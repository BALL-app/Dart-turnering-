// online.js – TEST 2: bevisa att klicket når online.js

alert("ONLINE.JS LADDAD – INGA SYNTAXFEL");

function wireTestButtons() {
  const createBtn = document.getElementById("btnCreateOnline");
  const joinBtn = document.getElementById("btnJoinOnline");

  if (createBtn) {
    createBtn.addEventListener("click", () => {
      alert("KLICK NÅDDE ONLINE.JS (Skapa)");
      // Kör stubben i index.html om den finns
      if (typeof window.createOnlineTournamentStub === "function") {
        window.createOnlineTournamentStub();
      } else {
        alert("Hittar inte createOnlineTournamentStub() i index.html");
      }
    });
  }

  if (joinBtn) {
    joinBtn.addEventListener("click", () => {
      alert("KLICK NÅDDE ONLINE.JS (Anslut)");
      if (typeof window.openJoinOnlineOverlay === "function") {
        window.openJoinOnlineOverlay();
      } else {
        alert("Hittar inte openJoinOnlineOverlay() i index.html");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", wireTestButtons);
