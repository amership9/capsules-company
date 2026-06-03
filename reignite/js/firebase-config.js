/* ============================================================================
   Reignite — منحني الاحتراق
   firebase-config.js — تهيئة Firebase + إعدادات عامة

   ملاحظة: بنستخدم Firebase modular SDK من CDN (gstatic) عشان الموقع يشتغل
   مباشرة من GitHub Pages بدون أي build step.
============================================================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc,
  query, where, orderBy, serverTimestamp, deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDG8eQaToGjmLx_CczY6Vz1q59GetC-P9E',
  authDomain: 'emc-crm.firebaseapp.com',
  projectId: 'emc-crm',
  storageBucket: 'emc-crm.firebasestorage.app',
  messagingSenderId: '75520877393',
  appId: '1:75520877393:web:71931155b19155ad73e970',
  measurementId: 'G-ZS8YC5G6XQ'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* الكولكشن الخاص بالإجابات النهائية (اللي الأدمن بيحلّلها) */
export const COLLECTION = 'reignite_responses';

/* الكولكشن الخاص بالمسودات أثناء الإجابة (مؤقت — بيتمسح بعد الإنهاء) */
export const COLLECTION_DRAFTS = 'reignite_drafts';

/* بوابة الأدمن — مرحلة الاختبار (LocalAuth). غيّر الكود من هنا. */
export const ADMIN_PASSCODE = 'reignite-2025';

export {
  db, collection, addDoc, getDocs, doc, getDoc, setDoc,
  query, where, orderBy, serverTimestamp, deleteDoc
};
