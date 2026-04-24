//Venter på at siden er loadet
document.addEventListener("DOMContentLoaded", () => {
    //Vi finder vores velcome message fra index.html
  const welcomeMessage = document.getElementById("welcomeMessage");
// Vi henter den bruger, vi gemte ved login
  const savedUser = localStorage.getItem("loggedInUser");
//Hvis der ikke findes en bruger, stopper vi bare
  if (!savedUser || !welcomeMessage) {
    return;
  }
//Laver det om fra tekst til et objekt
  const user = JSON.parse(savedUser);
//Hvis brugeren har et navn vises det
  if (user.navn) {
    welcomeMessage.textContent = `Velkommen ${user.navn}`;
  }

  // Scroll langsomt ned til ejendomsgrid hvis man kommer fra case.html uden cases
  const params = new URLSearchParams(window.location.search);
  if (params.get("scroll") === "properties") {
    setTimeout(() => {
      document.querySelector(".property-section")?.scrollIntoView({ behavior: "smooth" });
    }, 500);
  }
});

// Henter BBR-data fra backend og viser dem på ejendomssiden
// Kører kun hvis siden har et #propertyDetails element (dvs. ejendom.html)
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const adresseid = params.get("adresseid");
  const vejnavn = params.get("vejnavn");
  const vejnummer = params.get("vejnummer");
  const postnummer = params.get("postnummer");
  const bynavn = params.get("bynavn");

  const container = document.getElementById("propertyDetails");

  // Ikke på ejendomssiden – gør ingenting
  if (!container) return;

  if (!adresseid) {
    container.innerHTML = `<p>Ingen adresse valgt. <a href="/">Gå tilbage til søgning</a>.</p>`;
    return;
  }

  container.innerHTML = `<p>Henter ejendomsdata fra BBR...</p>`;

  try {
    // Henter enhed og bygning parallelt fra BBR via backend
    const [enhedRes, bygningRes] = await Promise.all([
      fetch(`/api/v1/properties/enheder?adresseid=${encodeURIComponent(adresseid)}`),
      fetch(`/api/v1/properties/bygning?adresseid=${encodeURIComponent(adresseid)}`),
    ]);

    const enhedJson = await enhedRes.json();
    const bygningJson = await bygningRes.json();

    const enhed = enhedJson.data?.[0] ?? {};
    const bygning = bygningJson.data?.[0] ?? {};

    const adresse = `${vejnavn || ""} ${vejnummer || ""}`.trim();
    const by = `${postnummer || ""} ${bynavn || ""}`.trim();
    const ejendomstype = BYGNINGSANVENDELSE[bygning.byg021BygningensAnvendelse] ?? "Ukendt";
    const byggeaarKey = Object.keys(bygning).find(k => k.startsWith("byg026"));
    const byggeaar = byggeaarKey ? bygning[byggeaarKey] : "–";
    const boligareal = enhed.enh026EnhedensSamledeAreal ?? "–";
    const vaerelser = enhed.enh031AntalVærelser ?? "–";
    // Grundareal: bruger byg041BebyggetAreal (bebygget areal) fra BBR bygning
    const grundareal = bygning.byg041BebyggetAreal ?? "–";

    // Henter luftfoto-URL fra vores egen backend (mellemled mod Dataforsyningen).
    // Backend slår koordinater op og bygger WMS-kaldet – vi får bare URL'en retur.
    const luftfotoRes = await fetch(`/api/v1/properties/luftfoto?adresseid=${encodeURIComponent(adresseid)}`);
    const luftfotoJson = await luftfotoRes.json();
    const luftfotoUrl = luftfotoJson.data?.url ?? "";

    container.innerHTML = `
      <h2>${adresse}</h2>
      <p>${by}</p>
      ${luftfotoUrl ? `<img src="${luftfotoUrl}" alt="Luftfoto af ${adresse}" class="property-aerial-photo">` : ""}
      <div class="property-info">
        <p><span class="property-label">Ejendomstype:</span> ${ejendomstype}</p>
        <p><span class="property-label">Byggeår:</span> ${byggeaar}</p>
        <p><span class="property-label">Boligareal:</span> ${boligareal !== "–" ? boligareal + " m²" : "–"}</p>
        <p><span class="property-label">Antal værelser:</span> ${vaerelser}</p>
        <p><span class="property-label">Grundareal:</span> ${grundareal !== "–" ? grundareal + " m²" : "–"}</p>
      </div>
    `;
  } catch (error) {
    console.error("Fejl ved hentning af BBR-data:", error);
    container.innerHTML = `<p>Kunne ikke hente ejendomsdata. Prøv igen.</p>`;
  }
});