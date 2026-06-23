/* ============================================================================
   Reignite — التربة
   soil-config.js — يعيد استخدام تهيئة Firebase من firebase-config.js (بدون
   تكرار)، ويضيف كولكشنات التربة. اسم كولكشن الاحتراق متاح للكروسووك في الأدمن.
============================================================================ */

import {
  db, collection, addDoc, getDocs, doc, getDoc, setDoc,
  query, where, serverTimestamp, deleteDoc,
  COLLECTION as BURNOUT_COLLECTION, ADMIN_PASSCODE
} from './firebase-config.js';

/* كولكشن إجابات التربة النهائية (اللي الأدمن بيحلّلها) */
export const COLLECTION_SOIL = 'reignite_soil';

/* كولكشن مسودات التربة أثناء الإجابة (مؤقت — بيتمسح بعد الإنهاء) */
export const COLLECTION_SOIL_DRAFTS = 'reignite_soil_drafts';

/* اسم كولكشن الاحتراق — نقرأه في الأدمن لحساب النوع الغالب للكروسووك */
export const BURNOUT_COLLECTION_NAME = BURNOUT_COLLECTION;

export {
  db, collection, addDoc, getDocs, doc, getDoc, setDoc,
  query, where, serverTimestamp, deleteDoc, ADMIN_PASSCODE
};
