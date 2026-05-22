// ═══════════════════════════════════════════════════════
// tracker.js — سكريبت تتبع نقاط التماس
// يستخدم على كل landing page بعد تحميل emc-firebase.js + emc-utils.js + emc-touchpoints.js
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── Session Management ───
  const SESSION_KEY = 'emc_lp_session';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 دقيقة

  function getSessionId() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (stored && Date.now() - stored.created < SESSION_DURATION) {
        return stored.id;
      }
      const newId = 's_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36).slice(-6);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: newId, created: Date.now() }));
      return newId;
    } catch (e) {
      return 's_' + Math.random().toString(36).slice(2, 11);
    }
  }

  // ─── UTM Parameters ───
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || '',
      medium: params.get('utm_medium') || '',
      campaign: params.get('utm_campaign') || '',
      content: params.get('utm_content') || '',
      term: params.get('utm_term') || ''
    };
  }

  // ─── تخمين المصدر ───
  function inferSource(utm, referrer) {
    if (utm.source) {
      const s = utm.source.toLowerCase();
      if (s.includes('facebook') || s.includes('fb')) return 'facebook';
      if (s.includes('linkedin')) return 'linkedin';
      if (s.includes('google')) return 'search';
      return 'other';
    }
    if (referrer) {
      const r = referrer.toLowerCase();
      if (r.includes('facebook')) return 'facebook';
      if (r.includes('linkedin')) return 'linkedin';
      if (r.includes('google')) return 'search';
      if (r.includes('mahmoudfouad25.github.io') || r.includes('emc')) return 'direct';
      return 'other';
    }
    return 'direct';
  }

  // ─── Setup state (populated when DOM is ready) ───
  let landingPage = '';
  let sessionId = '';
  let utm = { source: '', medium: '', campaign: '', content: '', term: '' };
  let source = '';
  let baseData = null;

  function initState() {
    landingPage = document.body?.dataset?.landingPage || '';
    sessionId = getSessionId();
    utm = getUTMParams();
    source = inferSource(utm, document.referrer);
    baseData = {
      sessionId,
      landingPage,
      source,
      utm,
      referrer: document.referrer || '',
      userAgent: (navigator.userAgent || '').substring(0, 200)
    };
  }

  async function safeCreate(payload) {
    try {
      if (typeof EMC === 'undefined' || !EMC.touchpoints) return;
      if (!baseData) return; // not initialized yet
      await EMC.touchpoints.create(payload);
    } catch (e) {
      console.warn('Touchpoint tracking error:', e?.message || e);
    }
  }

  async function trackPageView() {
    if (typeof EMC === 'undefined' || !EMC.touchpoints) {
      setTimeout(trackPageView, 400);
      return;
    }
    safeCreate({ ...baseData, type: 'page_view' });
  }

  let maxScroll = 0;
  const scrollMilestones = [25, 50, 75, 100];
  const trackedMilestones = new Set();

  function trackScroll() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
    maxScroll = Math.max(maxScroll, scrollPercent);

    scrollMilestones.forEach(milestone => {
      if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
        trackedMilestones.add(milestone);
        safeCreate({ ...baseData, type: 'scroll_depth', data: { depth: milestone } });
      }
    });
  }

  const startTime = Date.now();
  let timeTracked = false;
  function trackTimeOnPage() {
    if (timeTracked) return;
    const seconds = Math.round((Date.now() - startTime) / 1000);
    if (seconds < 3) return;
    timeTracked = true;
    safeCreate({
      ...baseData,
      type: 'time_on_page',
      data: { seconds, maxScroll }
    });
  }

  function setupCTATracking() {
    document.querySelectorAll('[data-cta]').forEach(el => {
      el.addEventListener('click', () => {
        safeCreate({
          ...baseData,
          type: 'cta_click',
          data: { ctaId: el.dataset.cta, label: el.textContent.trim().substring(0, 80) }
        });
      });
    });
  }

  // ─── واجهة استدعاء من الـ Landing page form ───
  function buildLPInterface() {
    window.EMC_LP = {
      get sessionId() { return sessionId; },
      get source() { return source; },
      get utm() { return utm; },
      get landingPage() { return landingPage; },

      async submitLead(formData) {
        try {
          if (typeof EMC === 'undefined' || !EMC.contacts) {
            throw new Error('EMC not loaded yet');
          }

          const fullName = (formData.fullName || '').trim();
          const parts = fullName.split(/\s+/);

          const contactId = await EMC.contacts.create({
            identity: {
              fullName: fullName,
              firstName: parts[0] || '',
              lastName: parts.slice(1).join(' '),
              companyName: formData.companyName || '',
              preferredLanguage: 'ar',
              country: 'EG'
            },
            channels: {
              primaryEmail: formData.email || '',
              mobile: formData.mobile || '',
              whatsapp: formData.mobile || '',
              preferredChannel: 'email'
            },
            context: {
              source: source,
              sourceDetails: 'Landing: ' + (EMC.LANDING_PAGES[landingPage]?.title || landingPage),
              firstTouchAt: new Date().toISOString(),
              lastInteractionAt: new Date().toISOString(),
              tags: ['landing_page', landingPage].filter(Boolean),
              notes: utm.campaign ? ('حملة: ' + utm.campaign) : ''
            },
            engagement: { engagementScore: 18, temperature: 'cold' },
            currentStage: 2,
            createdBy: 'landing-page'
          });

          await safeCreate({
            ...baseData,
            type: 'form_submit',
            contactId,
            data: { fields: Object.keys(formData) }
          });

          await EMC.touchpoints.linkToContact(sessionId, contactId);

          // ─── ريفريش السكور بعد التقديم ───
          if (EMC.utils?.refreshContactScore) {
            EMC.utils.refreshContactScore(contactId).catch(() => {});
          }

          return { success: true, contactId };
        } catch (e) {
          console.error('Lead submission failed:', e);
          return { success: false, error: e?.message || 'حدث خطأ، حاول مرة أخرى' };
        }
      },

      // ─── Smart Upsert: Lead → Identified أو إنشاء contact في المرحلة 3 ───
      async submitIdentified(formData) {
        try {
          if (typeof EMC === 'undefined' || !EMC.contacts) {
            throw new Error('EMC not loaded yet');
          }

          const email = (formData.email || '').trim().toLowerCase();
          if (!email) throw new Error('الإيميل مطلوب');

          const fullName = (formData.fullName || '').trim();
          const parts = fullName.split(/\s+/);
          const firstName = parts[0] || '';
          const lastName = parts.slice(1).join(' ');

          // ابحث عن contact موجود بنفس الإيميل
          const allContacts = await EMC.contacts.list();
          const existing = allContacts.find(c =>
            (c.channels?.primaryEmail || '').toLowerCase() === email
          );

          let contactId;
          let upserted = false;

          const enrichedData = {
            identity: {
              fullName: fullName,
              firstName,
              lastName,
              title: formData.title || '',
              companyName: formData.companyName || '',
              industry: formData.industry || '',
              companySize: formData.companySize || '',
              country: 'EG',
              preferredLanguage: 'ar'
            },
            channels: {
              primaryEmail: email,
              mobile: formData.mobile || '',
              whatsapp: formData.mobile || '',
              preferredChannel: 'whatsapp'
            },
            eosProfile: {
              eosFamiliarity: formData.eosFamiliarity || ''
            },
            context: {
              source: source || (existing?.context?.source) || 'direct',
              sourceDetails: 'Landing: التشخيص الكامل',
              lastInteractionAt: new Date().toISOString(),
              tags: ['landing_page', 'diagnosis']
            }
          };

          if (existing) {
            upserted = true;
            const mergedTags = [...new Set([
              ...(existing.context?.tags || []),
              ...enrichedData.context.tags
            ])];

            await EMC.contacts.update(existing.id, {
              identity: { ...(existing.identity || {}), ...enrichedData.identity },
              channels: { ...(existing.channels || {}), ...enrichedData.channels },
              eosProfile: { ...(existing.eosProfile || {}), ...enrichedData.eosProfile },
              context: {
                ...(existing.context || {}),
                ...enrichedData.context,
                tags: mergedTags
              }
            });

            if ((existing.currentStage || 0) < 3) {
              await EMC.contacts.moveToStage(existing.id, 3, 'تقديم نموذج التشخيص الكامل');
            }
            contactId = existing.id;
          } else {
            contactId = await EMC.contacts.create({
              ...enrichedData,
              context: {
                ...enrichedData.context,
                firstTouchAt: new Date().toISOString()
              },
              currentStage: 3,
              createdBy: 'landing-page-diagnosis'
            });
          }

          await safeCreate({
            ...baseData,
            type: 'form_submit',
            contactId,
            data: { fields: Object.keys(formData), upserted, formType: 'identified' }
          });

          await EMC.touchpoints.linkToContact(sessionId, contactId);

          if (EMC.utils?.refreshContactScore) {
            EMC.utils.refreshContactScore(contactId).catch(() => {});
          }

          return { success: true, contactId, upserted };
        } catch (e) {
          console.error('Identified submission failed:', e);
          return { success: false, error: e?.message || 'حدث خطأ، حاول مرة أخرى' };
        }
      }
    };
  }

  // ─── Activation ───
  function start() {
    initState();
    buildLPInterface();
    trackPageView();
    setupCTATracking();
    window.addEventListener('scroll', trackScroll, { passive: true });
    window.addEventListener('beforeunload', trackTimeOnPage);
    window.addEventListener('pagehide', trackTimeOnPage);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') trackTimeOnPage();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
