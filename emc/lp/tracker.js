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
      if (r.includes('amership9.github.io') || r.includes('emc')) return 'direct';
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
      if (!baseData) return;
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

      // ─── Lead form (المرحلة 2): اسم + إيميل + (اختياري شركة) ───
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

          if (EMC.utils?.refreshContactScore) {
            EMC.utils.refreshContactScore(contactId).catch(() => {});
          }

          return { success: true, contactId };
        } catch (e) {
          console.error('Lead submission failed:', e);
          return { success: false, error: e?.message || 'حدث خطأ، حاول مرة أخرى' };
        }
      },

      // ═══════════════════════════════════════════════════
      // Smart Upsert — التشخيص الكامل (المرحلة 3 / Identified)
      // ═══════════════════════════════════════════════════
      // يستقبل 11 حقل (7 ID + 4 تشخيصية):
      // - fullName, email, mobile, title, companyName, industry, companySize, eosFamiliarity
      // - ceilings[] (multi-select), primaryComponent, workHours (number), biggestChallenge (text)
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

          // ─── بناء eosProfile مُحسّن من البيانات التشخيصية ───
          // ceilings[] قد تكون قائمة (multi-select من chips) أو فاضية
          const ceilingsArr = Array.isArray(formData.ceilings) ? formData.ceilings : [];
          // primaryCeiling = أول واحد في الـ array (للعرض السريع)، والباقي يدخل في pains
          const primaryCeiling = ceilingsArr[0] || '';
          const additionalPains = ceilingsArr.slice(1);

          const eosProfileData = {
            eosFamiliarity: formData.eosFamiliarity || '',
            ceiling: primaryCeiling,
            primaryComponent: formData.primaryComponent || '',
            pains: additionalPains  // السقوف الإضافية بتدخل كـ pains
          };

          // لو فيه biggestChallenge، اضفه كـ goal
          if (formData.biggestChallenge) {
            eosProfileData.goals12Months = formData.biggestChallenge;
          }

          // ─── workHours بتدخل في engagement كحقل جديد ───
          const workHours = parseInt(formData.workHours);
          const validWorkHours = (workHours >= 30 && workHours <= 90) ? workHours : null;

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
            eosProfile: eosProfileData,
            context: {
              source: source || (existing?.context?.source) || 'direct',
              sourceDetails: 'Landing: التشخيص الكامل',
              lastInteractionAt: new Date().toISOString(),
              tags: ['landing_page', 'diagnosis']
            }
          };

          // أضف workHoursPerWeek في engagement
          if (validWorkHours !== null) {
            enrichedData.engagement = { workHoursPerWeek: validWorkHours };
          }

          if (existing) {
            // ─── UPSERT path: موجود → دمج البيانات + رفع المرحلة ───
            upserted = true;

            // دمج الـ tags بدون تكرار
            const mergedTags = [...new Set([
              ...(existing.context?.tags || []),
              ...enrichedData.context.tags
            ])];

            // دمج الـ pains (السقوف الإضافية + اللي كانوا موجودين)
            const mergedPains = [...new Set([
              ...(existing.eosProfile?.pains || []),
              ...additionalPains
            ])];

            // دمج الـ engagement (نحافظ على scores موجودة + نضيف workHours)
            const mergedEngagement = {
              ...(existing.engagement || {}),
              ...(enrichedData.engagement || {})
            };

            await EMC.contacts.update(existing.id, {
              identity: { ...(existing.identity || {}), ...enrichedData.identity },
              channels: { ...(existing.channels || {}), ...enrichedData.channels },
              eosProfile: {
                ...(existing.eosProfile || {}),
                ...eosProfileData,
                pains: mergedPains
              },
              engagement: mergedEngagement,
              context: {
                ...(existing.context || {}),
                ...enrichedData.context,
                tags: mergedTags
              }
            });

            if ((existing.currentStage || 0) < 3) {
              await EMC.contacts.moveToStage(existing.id, 3, 'تقديم نموذج التشخيص الكامل');
            }

            // سجّل event منفصل بالـ diagnosis details (مفيد للـ analytics لاحقاً)
            if (EMC.events?.log) {
              EMC.events.log({
                contactId: existing.id,
                type: 'manual_note',
                stage: 3,
                channel: 'website',
                data: {
                  action: 'diagnosis_submitted',
                  ceilings: ceilingsArr,
                  primaryComponent: formData.primaryComponent || '',
                  workHours: validWorkHours,
                  hasChallenge: !!formData.biggestChallenge
                }
              }).catch(() => {});
            }

            contactId = existing.id;
          } else {
            // ─── CREATE path: جديد → ينشأ مباشرة في المرحلة 3 ───
            contactId = await EMC.contacts.create({
              ...enrichedData,
              context: {
                ...enrichedData.context,
                firstTouchAt: new Date().toISOString()
              },
              currentStage: 3,
              createdBy: 'landing-page-diagnosis'
            });

            // سجّل event بالتفاصيل التشخيصية
            if (EMC.events?.log) {
              EMC.events.log({
                contactId,
                type: 'manual_note',
                stage: 3,
                channel: 'website',
                data: {
                  action: 'diagnosis_submitted',
                  ceilings: ceilingsArr,
                  primaryComponent: formData.primaryComponent || '',
                  workHours: validWorkHours,
                  hasChallenge: !!formData.biggestChallenge
                }
              }).catch(() => {});
            }
          }

          await safeCreate({
            ...baseData,
            type: 'form_submit',
            contactId,
            data: {
              fields: Object.keys(formData),
              upserted,
              formType: 'identified',
              ceilingsCount: ceilingsArr.length
            }
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
      },

      // ═══════════════════════════════════════════════════
      // Form B — استمارة التأهيل (المرحلة 5 / SQL prep)
      // بتعبّي طبقة الفرصة (BANT) وبترفع درجة الجاهزية.
      // مش بتنقل المرحلة — بتجهّز بس لقرار عبدالله في الكوكبيت.
      // ═══════════════════════════════════════════════════
      async submitApplication(payload) {
        try {
          if (typeof EMC === 'undefined' || !EMC.contacts) {
            throw new Error('EMC not loaded yet');
          }
          if (!payload.contactId) {
            throw new Error('رابط غير صالح — مفيش معرّف للعميل');
          }

          const existing = await EMC.contacts.get(payload.contactId);
          if (!existing) throw new Error('العميل غير موجود');

          // حدّث طبقة الفرصة بالـ BANT
          const oppUpdate = {
            ...(existing.opportunity || {}),
            decisionRole: payload.decisionRole || existing.opportunity?.decisionRole || '',
            budgetConfirmed: payload.budgetConfirmed || existing.opportunity?.budgetConfirmed || '',
            timelineUrgency: payload.timelineUrgency || existing.opportunity?.timelineUrgency || ''
          };

          // الضغط/الوجع يدخل في الأهداف لو مفيش، أو في الملاحظات
          const eosUpdate = { ...(existing.eosProfile || {}) };
          if (payload.pressure && !eosUpdate.goals12Months) {
            eosUpdate.goals12Months = payload.pressure;
          }

          const tags = [...new Set([...(existing.context?.tags || []), 'application_submitted'])];
          const noteStamp = payload.pressure
            ? `[استمارة التأهيل — الضغط الحالي: ${payload.pressure}]`
            : '[استمارة التأهيل — تم تعبئتها]';
          const newNotes = (existing.context?.notes || '') + ((existing.context?.notes) ? '\n' : '') + noteStamp;

          await EMC.contacts.update(payload.contactId, {
            opportunity: oppUpdate,
            eosProfile: eosUpdate,
            context: {
              ...(existing.context || {}),
              tags,
              notes: newNotes,
              lastInteractionAt: new Date().toISOString()
            }
          });

          // سجّل event
          if (EMC.events?.log) {
            EMC.events.log({
              contactId: payload.contactId,
              type: 'manual_note',
              stage: existing.currentStage || 4,
              channel: 'website',
              data: {
                action: 'application_submitted',
                decisionRole: payload.decisionRole,
                budgetConfirmed: payload.budgetConfirmed,
                timelineUrgency: payload.timelineUrgency,
                hasPressure: !!payload.pressure
              }
            }).catch(() => {});
          }

          await safeCreate({
            ...baseData,
            type: 'form_submit',
            contactId: payload.contactId,
            data: { formType: 'application' }
          });

          if (EMC.utils?.refreshContactScore) {
            EMC.utils.refreshContactScore(payload.contactId).catch(() => {});
          }

          return { success: true, contactId: payload.contactId };
        } catch (e) {
          console.error('Application submission failed:', e);
          return { success: false, error: e?.message || 'حدث خطأ، حاول مرة أخرى' };
        }
      },

      // ═══════════════════════════════════════════════════
      // نموذج ما قبل المكالمة (المرحلة 6 / Discovery prep)
      // بيكتب في discovery.prep — عبدالله بيقراه قبل المكالمة.
      // ═══════════════════════════════════════════════════
      async submitPrep(payload) {
        try {
          if (typeof EMC === 'undefined' || !EMC.contacts) {
            throw new Error('EMC not loaded yet');
          }
          if (!payload.contactId) {
            throw new Error('رابط غير صالح — مفيش معرّف للعميل');
          }

          const existing = await EMC.contacts.get(payload.contactId);
          if (!existing) throw new Error('العميل غير موجود');

          const prep = {
            topic: payload.topic || '',
            tried: payload.tried || '',
            change: payload.change || '',
            stakeholders: payload.stakeholders || '',
            submittedAt: new Date().toISOString()
          };

          const newDiscovery = {
            ...(existing.discovery || {}),
            prep
          };

          const tags = [...new Set([...(existing.context?.tags || []), 'prep_submitted'])];

          await EMC.contacts.update(payload.contactId, {
            discovery: newDiscovery,
            context: {
              ...(existing.context || {}),
              tags,
              lastInteractionAt: new Date().toISOString()
            }
          });

          if (EMC.events?.log) {
            EMC.events.log({
              contactId: payload.contactId,
              type: 'manual_note',
              stage: existing.currentStage || 6,
              channel: 'website',
              data: { action: 'prep_submitted' }
            }).catch(() => {});
          }

          await safeCreate({
            ...baseData,
            type: 'form_submit',
            contactId: payload.contactId,
            data: { formType: 'prep' }
          });

          return { success: true, contactId: payload.contactId };
        } catch (e) {
          console.error('Prep submission failed:', e);
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
