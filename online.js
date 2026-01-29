// online.js – Online-turneringar (steg 1)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// 🔐 Firebase config – samma som i firebase-check.html
const firebaseConfig = {
  apiKey: "AIzaSyAE4zslKdFbgsjXVnWPzcc67OIbE8v1-X0",
  authDomain: "dart-turnering.firebaseapp.com",
  projectId: "dart-turnering",
  storageBucket: "dart-turnering.firebasestorage.app",
  messagingSenderId: "63007726766",
  appId: "1:63007726766:web:e1ba313924b72b1dd0613f"
};

let app, auth, db;
let currentUser = null;

// Init Firebase
app = initializeApp(firebaseConfig);
auth = getAuth(app);
db = getFirestore(app);

// Auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("[online] inloggad:", user.uid);
  } else {
    currentUser = null;
    console.log("[online] ej inloggad – försöker logga in anonymt");
    signInAnonymously(auth).catch((err) => {
      console.error("[online] anon login fel", err);
    });
  }
});

// Exponera för debug och nästa steg
window.__online = {
  get user() { return currentUser; },
  get db() { return db; }
};
