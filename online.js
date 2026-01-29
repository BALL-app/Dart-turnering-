// online.js – Online-turneringar (koppla ALLA knappar: login/logout + skapa/join + realtime-listor)
// Kräver att din index.html har dessa ID:n (finns i din fil):
// btnHubLogin, btnHubLogout, hubAccountStatus
// btnCreateOnline, btnJoinOnline
// hubOnlineOwned, hubOnlineJoined, hubOwnedCount, hubJoinedCount
// hubOwnedDetails, hubJoinedDetails

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Firebase config – samma som i firebase-check.html
const firebaseConfig = {
  apiKey: "AIzaSyAE4zslKdFbgsjXVnWPzcc67OIbE8v1-X0",
  authDomain: "dart-turnering.firebaseapp.com",
  projectId: "dart-turnering",
  storageBucket: "dart-turnering.firebasestorage.app",
  messagingSenderId: "63007726766",
  appId: "1:63007726766:web:e1ba313924b72b1dd0613f"
};

// ===== Helpers =====
const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[s]));
}

function genCode6() {
  // samma stil som testfilen: undvik O/0, I/1
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ===== Firebase init =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let unsubOwned = null;
let unsubMember = null;

function setAccountUI(user) {
  const statusEl = $("hubAccountStatus");
  const btnLogin = $("btnHubLogin");
  const btnLogout = $("btnHubLogout");

  if (statusEl) {
    statusEl.textContent = user ? `Inloggad (UID: ${user.uid.slice(0, 6)}…)` : "Inte inloggad.";
  }
  if (btnLogin) btnLogin.style.display = user ? "none" : "inline-flex";
  if (btnLogout) btnLogout.style.display = user ? "inline-flex" : "none";
}

function renderList({ containerId, countId, detailsId, items, label }) {
  const el = $(containerId);
  const countEl = $(countId);
  const detailsEl = $(detailsId);

  if (countEl) countEl.textContent = String(items.length);

  if (!el) return;

  if (!currentUser) {
    el.innerHTML = "<em>Logga in för att se dina online-turneringar.</em>";
    return;
  }

  if (!items.length) {
    el.innerHTML = label === "Ägare"
      ? "<em>Inga online-turneringar ännu.</em>"
      : "<em>Inga anslutna online-turneringar ännu.</em>";
    return;
  }

  el.innerHTML = items.map((t) => {
    const name = escapeHtml(t.name || "Online-turnering");
    const code = escapeHtml(t.code || "");
    const role = label;
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 10px;border:1px solid rgba(17,24,39,.10);border-radius:14px;background:#fff;margin:8px 0;">
        <div style="min-width:0">
          <div style="font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🌍 ${name}</div>
          <div class="small muted">Kod: <span style="font-weight:800">${code}</span> • ${role}</div>
        </div>
        <button class="btn secondary" type="button" data-open-id="${escapeHtml(t.id)}">Öppna</button>
      </div>
    `;
  }).join("");

  // öppna-details automatiskt om det finns data (bekvämt på mobil)
  if (detailsEl) detailsEl.open = true;

  // klick på "Öppna" (placeholder)
  el.querySelectorAll("[data-open-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      alert("Online-turnering öppnas i nästa steg.\n\nJust nu är online kopplat för: skapa/join/listor.");
    });
  });
}

function stopRealtime() {
  if (unsubOwned) { unsubOwned(); unsubOwned = null; }
  if (unsubMember) { unsubMember(); unsubMember = null; }
}

function startRealtime(uid) {
  stopRealtime();

  const tRef = collection(db, "tournaments");

  const ownedQ = query(tRef, where("ownerUid", "==", uid), orderBy("createdAt", "desc"));
  unsubOwned = onSnapshot(ownedQ, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderList({
      containerId: "hubOnlineOwned",
      countId: "hubOwnedCount",
      detailsId: "hubOwnedDetails",
      items,
      label: "Ägare"
    });
  }, (err) => {
    console.error("[online] owned onSnapshot error:", err);
  });

  const memberQ = query(tRef, where("memberUids", "array-contains", uid), orderBy("createdAt", "desc"));
  unsubMember = onSnapshot(memberQ, (snap) => {
    // (obs: här kan turneringar du äger också dyka upp – helt okej; UI visar "Deltar" ändå)
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderList({
      containerId: "hubOnlineJoined",
      countId: "hubJoinedCount",
      detailsId: "hubJoinedDetails",
      items,
      label: "Deltar"
    });
  }, (err) => {
    console.error("[online] member onSnapshot error:", err);
  });
}

// ===== Actions (knappar) =====
async function ensureLoggedIn() {
  if (auth.currentUser) return auth.currentUser;
  const res = await signInAnonymously(auth);
  return res.user;
}

async function handleLogin() {
  try {
    await ensureLoggedIn();
  } catch (e) {
    console.error(e);
    alert("Kunde inte logga in. Kontrollera nätet och Firestore Rules.");
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
  } catch (e) {
    console.error(e);
    alert("Kunde inte logga ut.");
  }
}

async function handleCreateTournament() {
  try {
    const user = await ensureLoggedIn();

    const name = (prompt("Namn på online-turnering:", "Online-turnering") || "").trim() || "Online-turnering";

    // Generera kod (6 tecken). Enkelt: försök några gånger om koden råkar krocka.
    let code = "";
    let tries = 0;
    while (tries < 5) {
      tries++;
      code = genCode6();
      const q = query(collection(db, "tournaments"), where("code", "==", code));
      const snap = await getDocs(q);
      if (snap.empty) break;
    }

    const ref = await addDoc(collection(db, "tournaments"), {
      name,
      code,
      ownerUid: user.uid,
      memberUids: [user.uid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const copied = await copyToClipboard(code);
    alert(`Turnering skapad!\n\nKod: ${code}${copied ? " (kopierad)" : ""}\nDocId: ${ref.id}`);
  } catch (e) {
    console.error(e);
    alert("Kunde inte skapa turnering. (Kolla Firestore Rules / nätverk)");
  }
}

async function handleJoinByCode() {
  try {
    const user = await ensureLoggedIn();

    const codeIn = prompt("Skriv in turneringskoden (6 tecken):", "") || "";
    const code = codeIn.trim().toUpperCase();
    if (!code) return;

    const q = query(collection(db, "tournaments"), where("code", "==", code));
    const snap = await getDocs(q);

    if (snap.empty) {
      alert("Hittade ingen turnering med den koden.");
      return;
    }

    const docSnap = snap.docs[0];
    await updateDoc(doc(db, "tournaments", docSnap.id), {
      memberUids: arrayUnion(user.uid),
      updatedAt: serverTimestamp()
    });

    alert("Ansluten!");
  } catch (e) {
    console.error(e);
    alert("Kunde inte ansluta. (Kolla Firestore Rules / nätverk)");
  }
}

// ===== Wire up =====
function wireButtons() {
  const btnHubLogin = $("btnHubLogin");
  const btnHubLogout = $("btnHubLogout");
  const btnCreateOnline = $("btnCreateOnline");
  const btnJoinOnline = $("btnJoinOnline");

  if (btnHubLogin) btnHubLogin.addEventListener("click", handleLogin);
  if (btnHubLogout) btnHubLogout.addEventListener("click", handleLogout);
  if (btnCreateOnline) btnCreateOnline.addEventListener("click", handleCreateTournament);
  if (btnJoinOnline) btnJoinOnline.addEventListener("click", handleJoinByCode);
}

document.addEventListener("DOMContentLoaded", () => {
  wireButtons();

  // init tomma listor direkt
  renderList({ containerId: "hubOnlineOwned", countId: "hubOwnedCount", detailsId: "hubOwnedDetails", items: [], label: "Ägare" });
  renderList({ containerId: "hubOnlineJoined", countId: "hubJoinedCount", detailsId: "hubJoinedDetails", items: [], label: "Deltar" });

  // Auth state
  onAuthStateChanged(auth, (user) => {
    currentUser = user || null;
    setAccountUI(currentUser);

    if (currentUser) {
      startRealtime(currentUser.uid);
    } else {
      stopRealtime();
      // visa "logga in" i listor
      renderList({ containerId: "hubOnlineOwned", countId: "hubOwnedCount", detailsId: "hubOwnedDetails", items: [], label: "Ägare" });
      renderList({ containerId: "hubOnlineJoined", countId: "hubJoinedCount", detailsId: "hubJoinedDetails", items: [], label: "Deltar" });
    }
  });

  // Auto-login för att få “live”-listor direkt (du kan ta bort om du vill kräva knapptryck)
  ensureLoggedIn().catch(() => {
    // tyst – UI visar "Inte inloggad"
  });
});

// Debug
window.__online = {
  get user() { return currentUser; },
  get db() { return db; }
};
