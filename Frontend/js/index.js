// ── Velkomstbesked ved sideindlæsning ────────────────────────────────────────
// Venter på at siden er loaded
document.addEventListener("DOMContentLoaded", () => {
  // Henter velkomstbesked-elementet og tjekker for gemt bruger i localStorage
  const welcomeMessage = document.getElementById("welcomeMessage");
  const savedUser = localStorage.getItem("loggedInUser");
 // Hvis der ikke er nogle af delene, gør vi ingenting
  if (!savedUser || !welcomeMessage) {
    return;
  }
// Gemmer som objekt og viser velkomstbesked
  const user = JSON.parse(savedUser);

  if (user.navn) {
    welcomeMessage.textContent = `Velkommen ${user.navn}`;
  }
});

// ── Kan muligvis slettes: Bliver brugt ved redirect til ejendomsprofil istedet for database kald
const INDEX_BYGNINGSANVENDELSE = {
  110: "Stuehus til landbrugsejendom",
  120: "Fritliggende enfamiliehus",
  121: "Sammenbygget enfamiliehus",
  140: "Etageboligbebyggelse, flerfamiliehus",
  150: "Kollegium",
  160: "Fritidshus",
  190: "Anden helårsbeboelse"
};

// ── Vis relaterede investeringscases på ejendomssiden ─────────────────────────
async function renderRelateredeCases(ejendomsProfilID) {
  const heading = document.getElementById("relatedCasesHeading");
  const container = document.getElementById("relatedCases");

  if (!heading || !container) return;

  try {
    container.innerHTML = "<p>Henter relaterede investeringscases...</p>";

    const response = await fetch(`/api/v1/ejendomsprofiler/${ejendomsProfilID}/investment-cases`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Kunne ikke hente cases.");
    }

    const cases = result.data;

    if (cases.length === 0) {
      container.innerHTML = `
        <p>Denne ejendomsprofil har endnu ingen tilknyttede investeringscases.</p>
      `;
      return;
    }

    container.innerHTML = cases.map(c => {
      const dato = c.datoOprettet
        ? new Date(c.datoOprettet).toLocaleDateString("da-DK")
        : "Ukendt dato";

      const koebsPris = Number(c.koebsPris || 0).toLocaleString("da-DK");
      const egenKapital = Number(c.egenKapital || 0).toLocaleString("da-DK");

      const cashflow =
        c.erLejeBolig
          ? Number(c.lejeIndkomst || 0) - Number(c.lejeUdgifter || 0)
          : null;

      return `
        <div class="related-case-card">
          <h3>${c.navn}</h3>
          <p>${c.beskrivelse || "Ingen beskrivelse"}</p>

          <p><strong>Oprettet:</strong> ${dato}</p>
          <p><strong>Simuleringsperiode:</strong> ${c.simuleringsAar || "–"} år</p>
          <p><strong>Købspris:</strong> ${koebsPris} kr.</p>
          <p><strong>Egenkapital:</strong> ${egenKapital} kr.</p>

          ${
            cashflow !== null
              ? `<p><strong>Cashflow/md.:</strong> ${cashflow.toLocaleString("da-DK")} kr.</p>`
              : `<p><strong>Udlejning:</strong> Nej</p>`
          }

          <a href="/investeringscase.html?id=${c.id}">Se investeringscase →</a>
        </div>
      `;
    }).join("");

  } catch (error) {
    console.error("Fejl ved visning af relaterede cases:", error);
    container.innerHTML = `
      <p>Kunne ikke hente relaterede investeringscases.</p>
    `;
  }
}

// ── Vis BBR-data og kort på ejendomssiden ─────────────────────────────────────
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
      renderRelateredeCases(id);

      // Slå DAWA adresseid op fra adressekomponenter, så vi kan hente kort
      let luftfotoUrl = "";
      let matrikelUrl = "";
      try {
        const dawaRes = await fetch(
          `https://api.dataforsyningen.dk/adresser?vejnavn=${encodeURIComponent(property.vejNavn)}&husnr=${encodeURIComponent(property.vejNummer)}&postnr=${encodeURIComponent(property.postnummer)}&format=json`
        );
        const dawaData = await dawaRes.json();
        const adresseid = dawaData[0]?.id;

        if (adresseid) {
          const [luftfotoRes, matrikelRes] = await Promise.all([
            fetch(`/api/v1/properties/luftfoto?adresseid=${encodeURIComponent(adresseid)}`),
            fetch(`/api/v1/properties/matrikelkort?adresseid=${encodeURIComponent(adresseid)}`)
          ]);
          luftfotoUrl = (await luftfotoRes.json()).data?.url ?? "";
          matrikelUrl = (await matrikelRes.json()).data?.url ?? "";
        }
      } catch (kortFejl) {
        console.error("Fejl ved hentning af kortdata:", kortFejl);
      }

      container.innerHTML = `
        <h2>${property.vejNavn} ${property.vejNummer}</h2>

        ${luftfotoUrl || matrikelUrl ? `
        <div class="property-maps">
          ${luftfotoUrl ? `<img src="${luftfotoUrl}" alt="Luftfoto af ${property.vejNavn} ${property.vejNummer}" class="property-aerial-photo">` : ""}
          ${matrikelUrl ? `<img src="${matrikelUrl}" alt="Matrikelkort af ${property.vejNavn} ${property.vejNummer}" class="property-aerial-photo">` : ""}
        </div>` : ""}

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

  const relatedHeading = document.getElementById("relatedCasesHeading");
  const relatedCases = document.getElementById("relatedCases");

  if (relatedHeading) relatedHeading.style.display = "none";
  if (relatedCases) relatedCases.style.display = "none";

  container.innerHTML = `<p>Henter ejendomsdata fra BBR...</p>`;

  try {
    // Henter enhed, bygning og grundareal parallelt fra BBR/DAWA via backend
    const [enhedRes, bygningRes, grundRes] = await Promise.all([
      fetch(`/api/v1/properties/enheder?adresseid=${encodeURIComponent(adresseid)}`),
      fetch(`/api/v1/properties/bygning?adresseid=${encodeURIComponent(adresseid)}`),
      fetch(`/api/v1/properties/grund?adresseid=${encodeURIComponent(adresseid)}`),
    ]);

    const enhed = (await enhedRes.json()).data?.[0] ?? {};
    const bygning = (await bygningRes.json()).data?.[0] ?? {};
    const jordstykke = (await grundRes.json()).data?.[0] ?? {};

    const adresse = `${vejnavn || ""} ${vejnummer || ""}`.trim();
    const by = `${postnummer || ""} ${bynavn || ""}`.trim();
    const ejendomstype = INDEX_BYGNINGSANVENDELSE[bygning.byg021BygningensAnvendelse] ?? "Ukendt";
    const byggeaarKey = Object.keys(bygning).find(k => k.startsWith("byg026"));
    const byggeaar = byggeaarKey ? bygning[byggeaarKey] : "–";
    const boligareal = enhed.enh027EnhedensBoligareal ?? enhed.enh026EnhedensSamledeAreal ?? "–";
    const vaerelser = enhed.enh031AntalVærelser ?? "–";
    const grundareal = jordstykke.registreretareal ?? "–";

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
