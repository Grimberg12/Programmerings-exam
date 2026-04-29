// Venter på at siden er loaded
document.addEventListener("DOMContentLoaded", () => {
  // Henter velkomstbesked-elementet og tjekker for gemt bruger i localStorage
  const welcomeMessage = document.getElementById("welcomeMessage");
  const savedUser = localStorage.getItem("loggedInUser");
 // Hvis der ikke findes nogle af delene, gør vi ingenting
  if (!savedUser || !welcomeMessage) {
    return;
  }
// Gemmer som objekt og viser velkomstbesked
  const user = JSON.parse(savedUser);

  if (user.navn) {
    welcomeMessage.textContent = `Velkommen ${user.navn}`;
  }
});

// SKAL DET HER FJERNES HELT?????
const INDEX_BYGNINGSANVENDELSE = {
  110: "Stuehus til landbrugsejendom",
  120: "Fritliggende enfamiliehus",
  121: "Sammenbygget enfamiliehus",
  140: "Etageboligbebyggelse, flerfamiliehus",
  150: "Kollegium",
  160: "Fritidshus",
  190: "Anden helårsbeboelse"
};

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
  const id = params.get("id");

  if (id) {
    try {
      const response = await fetch(`/api/v1/ejendomsprofiler/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      const property = result.data;

      container.innerHTML = `
        <h2>${property.vejNavn} ${property.vejNummer}</h2>

        <div class="property-info">
          <p><span class="property-label">Vejnavn:</span> ${property.vejNavn}</p>
          <p><span class="property-label">Vejnummer:</span> ${property.vejNummer}</p>
          <p><span class="property-label">Etage:</span> ${property.etage || "–"}</p>
          <p><span class="property-label">Postnummer:</span> ${property.postnummer}</p>
          <p><span class="property-label">Bynavn:</span> ${property.bynavn}</p>

          <p><span class="property-label">Byggeår:</span> ${property.byggeAar || "–"}</p>
          <p><span class="property-label">Boligareal:</span> ${property.boligAreal ? property.boligAreal + " m²" : "–"}</p>
          <p><span class="property-label">Antal værelser:</span> ${property.antalVaerelser || "–"}</p>
          <p><span class="property-label">Grundareal:</span> ${property.grundAreal ? property.grundAreal + " m²" : "–"}</p>
        </div>
      `;
      return;

    } catch (error) {
      console.error("Fejl ved hentning af ejendomsprofil:", error);
      container.innerHTML = `<p>Kunne ikke hente ejendomsprofilen.</p>`;
      return;
    }
  }

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
    const ejendomstype = INDEX_BYGNINGSANVENDELSE[bygning.byg021BygningensAnvendelse] ?? "Ukendt";
    const byggeaarKey = Object.keys(bygning).find(k => k.startsWith("byg026"));
    const byggeaar = byggeaarKey ? bygning[byggeaarKey] : "–";
    const boligareal = enhed.enh026EnhedensSamledeAreal ?? "–";
    const vaerelser = enhed.enh031AntalVærelser ?? "–";
    // Grundareal: bruger byg041BebyggetAreal (bebygget areal) fra BBR bygning
    const grundareal = bygning.byg041BebyggetAreal ?? "–";

    // Henter luftfoto- og matrikelkort-URL fra vores egen backend (mellemled
    // mod Dataforsyningen). Backend slår koordinater op og bygger WMS-kaldene
    // – vi får bare URL'erne retur. Hentes parallelt da kaldene er uafhængige.
    const [luftfotoRes, matrikelRes] = await Promise.all([
      fetch(`/api/v1/properties/luftfoto?adresseid=${encodeURIComponent(adresseid)}`),
      fetch(`/api/v1/properties/matrikelkort?adresseid=${encodeURIComponent(adresseid)}`),
    ]);
    const luftfotoJson = await luftfotoRes.json();
    const matrikelJson = await matrikelRes.json();
    const luftfotoUrl = luftfotoJson.data?.url ?? "";
    const matrikelUrl = matrikelJson.data?.url ?? "";

    container.innerHTML = `
      <h2>${adresse}</h2>
      <p>${by}</p>
      <div class="property-maps">
        ${luftfotoUrl ? `<img src="${luftfotoUrl}" alt="Luftfoto af ${adresse}" class="property-aerial-photo">` : ""}
        ${matrikelUrl ? `<img src="${matrikelUrl}" alt="Matrikelkort af ${adresse}" class="property-aerial-photo">` : ""}
      </div>
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