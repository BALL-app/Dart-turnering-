import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
  doc,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// rest of file unchanged
