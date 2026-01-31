// online.js – MINIMALT TEST (INGA SYNTAXFEL)

alert("ONLINE.JS LADDAD – INGA SYNTAXFEL");

function initOnline() {
  console.log("initOnline körs");

  const FB = window.__FIREBASE;

  if (!FB || !FB.enabled) {
    console.warn("Firebase inte aktivt – online-funktioner inaktiva");
    return;
  }

  console.log("Firebase finns – redo för nästa steg");
}

try {
  initOnline();
} catch (e) {
  alert("JS-FEL i initOnline: " + e.message);
  console.error(e);
}
