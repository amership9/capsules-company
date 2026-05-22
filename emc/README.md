# EMC CRM — MVP الأسبوع 3 (المراحل 1 + 2 + 3 مكتملة · Firestore live)

نظام إدارة رحلة العميل لأكاديمية Executive Mastery Camp.

## 🌐 Firestore Mode

النظام شغّال على **Firestore فعلياً**. الـ **LocalAuth** للديمو (`abdullah@emc.academy` / `demo2026`). التحويل لـ FirebaseAuth = تغيير `AUTH_MODE = 'firebase'` (راجع `MIGRATION.md`).

## 📁 البنية

```
/emc/
├── index.html                   ← كاتالوج (15 صفحة)
├── admin/
│   ├── login.html / dashboard.html / contacts.html / contact-detail.html / add-contact.html
│   ├── segments.html / add-segment.html / segment-detail.html         (P1)
│   ├── leads.html / sources.html                                       (P2)
│   └── templates.html                                                  (P3 🆕)
├── lp/
│   ├── eos-guide.html / webinar.html / insight.html                    (P2)
│   ├── diagnosis.html                                                  (P3 🆕 — Form A)
│   ├── lp-styles.css / tracker.js
├── css/emc-styles.css
├── js/
│   ├── emc-firebase.js          ← Storage + Auth adapters
│   ├── emc-utils.js             ← قواميس + Engagement Score Engine
│   ├── emc-contacts.js / emc-segments.js / emc-touchpoints.js
│   ├── emc-templates.js         ← 🆕 CRUD + render({{vars}})
│   └── emc-layout.js
└── MIGRATION.md
```

## 🗂 الـ Collections

| Collection         | الوظيفة                              | الحالة       |
|--------------------|--------------------------------------|--------------|
| `emc_contacts`     | ملف العميل بالطبقات الـ 9            | ✅ Firestore  |
| `emc_events`       | سجل التحولات                          | ✅ Firestore  |
| `emc_segments`     | الشرائح المستهدفة — P1                | ✅ Firestore  |
| `emc_touchpoints`  | نقاط التماس — P2                      | ✅ Firestore  |
| `emc_templates`    | قوالب الرسائل — P3                    | ✅ Firestore (5 seeded) |
| `emc_cohorts`      | الكوهورتات                            | ✅ schema    |
| `emc_admins`       | مدراء النظام                          | ✅ schema    |

## 📋 الـ 14 مرحلة

| منطقة | المراحل | الحالة |
|-------|--------|--------|
| 1 — العملاء المحتملون | 1-4 | ✅ 1/2/3 مكتملة · 4 تتبع يدوي |
| 2 — إدارة الفرص | 5-9 | تتبع يدوي |
| 3 — دورة حياة العميل | 10-12 | تتبع يدوي |
| 4 — الانتماء والإحالة | 13-14 | تتبع يدوي |

## 🚀 الجديد في P3

- **Engagement Score Engine**: `EMC.utils.calculateEngagementScore()` بيحسب السكور الحقيقي من الـ touchpoints والـ events (max 100). الـ breakdown ظاهر في تبويب "التفاعل" + زر "إعادة حساب".
- **Smart Upsert (diagnosis.html)**: لو الإيميل موجود → enrich + promote stage 2→3. لو جديد → contact مباشرة في stage 3. الـ touchpoints بتنربط بالـ contact تلقائياً.
- **Promote Modal (leads.html)**: نموذج كامل بـ 6 حقول قبل النقل (title, company, industry, size, mobile, EOS familiarity).
- **Templates Library**: 5 قوالب نموذجية في سلسلة الترحيب (3 إيميل + 2 واتساب). Modal فيه:
  - تخصيص حي بمتغيرات contact ({{firstName}}, {{companyName}}, إلخ)
  - نسخ بضغطة (clipboard API + toast)
  - رابط `wa.me` مباشر لقوالب الواتساب
- **Dashboard**: stat جديد "Identified هذا الأسبوع" + معدل التحويل Lead→Identified.
- **Sara promoted**: في الـ seed، سارة الفقي اترقّت من Lead لـ Identified بكل البيانات الكاملة كمثال.

## 🎯 ما بعد P3 — التحويل النهائي

المراحل 1+2+3 مكتملة على البنية التحتية الحالية (`fouad-perspective`). الخطوة التالية: التحويل لمشروع Firebase الخاص بعبدالله. راجع `/emc/MIGRATION.md` لخطوات التحويل. المراحل 4-14 ستُبنى على بنية عبدالله الخاصة.

---
بُني خصيصاً لـ **عبدالله عامر · Executive Mastery Camp** · مايو 2026

نظام إدارة رحلة العميل لأكاديمية Executive Mastery Camp.

## 🌐 Firestore Mode

النظام دلوقتي شغّال على **Firestore فعلياً** (مش LocalStorage). يعني:
- البيانات بتتحفظ في الـ cloud وتظهر من أي جهاز
- الـ Landing pages تستقبل leads حقيقيين
- الـ touchpoints بتتسجّل في الوقت الفعلي

الـ **LocalAuth** ما زال مفعّل (`abdullah@emc.academy` / `demo2026`) لأن مفيش Firebase Auth حقيقي بعد. التحويل لـ FirebaseAuth = تغيير `AUTH_MODE = 'firebase'` في `emc-firebase.js` (راجع `MIGRATION.md`).

> ⚠️ قواعد `firestore.rules` الحالية **مفتوحة مؤقتاً** لأن LocalAuth ما بيدّيش Firebase Auth UID. التأمين الكامل عند تفعيل FirebaseAuth.

## 📁 البنية

```
/emc/
├── index.html                   ← كاتالوج الصفحات (13 صفحة)
├── admin/
│   ├── login.html               ← دخول
│   ├── dashboard.html           ← لوحة التحكم + أداء Landing Pages
│   ├── contacts.html            ← قائمة جهات الاتصال
│   ├── contact-detail.html?id=  ← تفاصيل بـ 9 تبويبات + Landing journey
│   ├── add-contact.html         ← إضافة يدوية
│   ├── segments.html            ← الشرائح المستهدفة (P1)
│   ├── add-segment.html         ← إضافة شريحة (P1)
│   ├── segment-detail.html?id=  ← تفاصيل شريحة (P1)
│   ├── leads.html               ← 🆕 قائمة المتفاعلين (P2)
│   └── sources.html             ← 🆕 Dashboard المصادر و Landing Pages (P2)
├── lp/                          ← 🆕 Landing pages عامة (public)
│   ├── eos-guide.html           ← دليل السقف القيادي
│   ├── webinar.html             ← ندوة العقل التشغيلي
│   ├── insight.html             ← مقال الـ 6 مكونات
│   ├── lp-styles.css            ← CSS مخصص للـ landings
│   └── tracker.js               ← سكريبت التتبع
├── css/emc-styles.css
├── js/
│   ├── emc-firebase.js          ← Storage + Auth adapters (LocalStore/Firestore)
│   ├── emc-utils.js             ← قواميس + helpers
│   ├── emc-contacts.js          ← CRUD emc_contacts
│   ├── emc-segments.js          ← CRUD emc_segments
│   ├── emc-touchpoints.js       ← 🆕 CRUD emc_touchpoints
│   └── emc-layout.js            ← Sidebar + Topbar
└── MIGRATION.md
```

## 🗂 الـ Collections

| Collection         | الوظيفة                              | الحالة      |
|--------------------|--------------------------------------|------------|
| `emc_contacts`     | ملف العميل بالطبقات الـ 9            | ✅ Firestore |
| `emc_events`       | سجل التحولات                          | ✅ Firestore |
| `emc_segments`     | الشرائح المستهدفة — المرحلة 1         | ✅ Firestore |
| `emc_touchpoints`  | نقاط التماس — المرحلة 2               | ✅ Firestore |
| `emc_cohorts`      | الكوهورتات الدراسية                  | ✅ schema   |
| `emc_templates`    | قوالب الإيميل والواتساب              | ⏳ أسبوع 3+ |
| `emc_admins`       | مدراء النظام                          | ✅ schema   |

## 📋 الـ 14 مرحلة

| منطقة | المراحل | الحالة |
|-------|--------|--------|
| 1 — العملاء المحتملون | 1-4 | ✅ 1+2 مكتملان · 3-4 تتبع يدوي |
| 2 — إدارة الفرص | 5-9 | تتبع يدوي |
| 3 — دورة حياة العميل | 10-12 | تتبع يدوي |
| 4 — الانتماء والإحالة | 13-14 | تتبع يدوي |

## 🚀 الدخول

افتح `emc/index.html` → اضغط "دخول النظام"
- 📧 `abdullah@emc.academy`
- 🔑 `demo2026`

أول مرة، النظام بيعبّى 6 contacts + 5 segments + 13 touchpoint + 2 leads من landing pages.

## 🌐 الـ Landing Pages

- `/emc/lp/eos-guide.html` — تنزيل دليل (2 حقول)
- `/emc/lp/webinar.html` — حجز ندوة (3 حقول)
- `/emc/lp/insight.html` — مقال + CTA للتشخيص

كل landing بتسجل:
- زيارات (`page_view`)
- تمرير عميق (`scroll_depth` عند 25/50/75/100%)
- نقرات الـ CTA
- وقت على الصفحة
- تعبئة النموذج → ينشئ contact في **المرحلة 2**

الـ UTM parameters بتتلتقط تلقائياً من الـ URL.

## ➡️ الأسبوع 3 القادم

بناء **المرحلة 3 (المُعرَّف)** — Form A مهيكل + سلسلة Welcome بالـ Email + Templates system.

---
بُني خصيصاً لـ **عبدالله عامر · Executive Mastery Camp** · مايو 2026

## 🚀 التشغيل

### للعرض المحلي
افتح `emc/index.html` في المتصفح. هتلاقي كاتالوج كامل لكل الصفحات.

**بيانات الدخول للديمو:**
- 📧 `abdullah@emc.academy`
- 🔑 `demo2026`

أول مرة بتسجل، النظام بيعبّى 6 جهات اتصال نموذجية موزعة على مراحل مختلفة عشان تشوف الواجهة بكامل بياناتها.

### للنشر على GitHub Pages
المجلد `/emc/` بأكمله جاهز للنشر مباشرة. حط الـ folder كله في الـ repo `fouad-perspective`، وافتح:
```
https://mahmoudfouad25.github.io/fouad-perspective/emc/
```

## 🔥 ربط Firebase (خطوات سريعة)

النظام حالياً بيستخدم localStorage كـ adapter بنفس واجهة Firestore. للتبديل لـ Firestore الحقيقي:

### 1. أضف Firebase SDK لكل صفحة admin
قبل `emc-firebase.js` في كل صفحة:
```html
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
```

### 2. عدّل `emc-firebase.js`
استبدل `LocalStore` بدوال Firestore:
```js
const FirestoreAdapter = {
  async create(coll, data, id) {
    const ref = id
      ? window.emcFirestore.collection(coll).doc(id)
      : window.emcFirestore.collection(coll).doc();
    await ref.set({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    return ref.id;
  },
  async get(coll, id) {
    const doc = await window.emcFirestore.collection(coll).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },
  // ... باقي الدوال بنفس الـ signatures
};
window.EMC.store = FirestoreAdapter; // بدل LocalStore
```

نفس الواجهة بالضبط، فالـ pages كلها هتشتغل بدون أي تعديل.

### 3. أنشئ أول Admin يدوياً
في Firebase Console → Authentication → Users:
- أنشئ مستخدم بإيميل `abdullah@emc.academy`

في Firestore Console → Collection `emc_admins`:
- اعمل document بـ ID = uid الخاص بالمستخدم
- المحتوى:
  ```json
  {
    "email": "abdullah@emc.academy",
    "fullName": "عبدالله عامر",
    "role": "super_admin",
    "isActive": true,
    "createdAt": "..."
  }
  ```

### 4. حدّث `firestore.rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isEmcAdmin() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/emc_admins/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/emc_admins/$(request.auth.uid)).data.isActive == true;
    }
    match /emc_{collection}/{doc} {
      allow read, write: if isEmcAdmin();
    }
    match /emc_contacts/{doc} {
      allow create: if true;  // عشان النماذج العامة في المراحل القادمة
      allow read, update, delete: if isEmcAdmin();
    }
    // باقي القواعد الحالية لمنظور الفؤاد تفضل كما هي
  }
}
```

## 🗂 الـ Collections

| Collection         | الوظيفة                              | الحالة      |
|--------------------|--------------------------------------|------------|
| `emc_contacts`     | ملف العميل بالطبقات الـ 9            | ✅ MVP      |
| `emc_events`       | سجل كل تفاعل وتغيير مرحلة             | ✅ MVP      |
| `emc_segments`     | الشرائح المستهدفة — المرحلة 1         | ✅ MVP      |
| `emc_cohorts`      | الكوهورتات الدراسية                  | ✅ schema   |
| `emc_templates`    | قوالب الإيميل والواتساب              | ⏳ أسبوع 3+ |
| `emc_admins`       | مدراء النظام والصلاحيات              | ✅ schema   |
| `emc_opportunities`| الفرص النشطة (تفاصيل أعمق)            | ⏳ أسبوع 5  |
| `emc_automations`  | قواعد الأتمتة                        | ⏳ أسبوع 4+ |

## 📋 الـ 14 مرحلة

| منطقة | المراحل | الحالة في الـ MVP |
|-------|--------|------------------|
| 1 — العملاء المحتملون | 1-4 (Suspect → MQL) | ✅ 1 مكتمل · 2-4 تتبع يدوي |
| 2 — إدارة الفرص | 5-9 (SQL → Decision) | ✅ تتبع يدوي |
| 3 — دورة حياة العميل | 10-12 (Onboarding → Implementation) | ✅ تتبع يدوي |
| 4 — الانتماء والإحالة | 13-14 (Alumni → Advocate) | ✅ تتبع يدوي |

**MVP بيدعم:** عرض المراحل، تتبع جهات الاتصال عليها، نقل يدوي بين المراحل، سجل التحولات.
**في الإصدارات القادمة:** أتمتة الانتقالات، Triggers، نماذج عامة، قنوات تواصل مؤتمتة (إيميل + واتساب).

## 🎨 الـ Design System

- **Navy** `#0B2545` — اللون الأساسي (مأخوذ من خلفية الشعار)
- **Red** `#D72638` — اللون التركيزي (شرائط كرسي المخرج)
- **Cream** `#F7F4ED` — خلفية الصفحات
- **Gold** `#C9A961` — منطقة الخريجين والنجاحات
- **Font:** Cairo (Google Fonts) + JetBrains Mono للأرقام والكود

## ➡️ الأسبوع 2 القادم

بناء **المرحلة 2 (المتفاعل)** — تتبع المصادر، Landing pages عامة، نظام Pixel لتتبع الزيارات.

---
بُني خصيصاً لـ **عبدالله عامر · Executive Mastery Camp** · مايو 2026
