async function hentEjendomme() {
  const savedUser = localStorage.getItem("loggedInUser");
  if (!savedUser) {
    window.location.href = "/login.html";
    return [];
  }

  const user = JSON.parse(savedUser);

  const response = await fetch(`/api/v1/users/${user.brugerID}/ejendomsprofiler`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Kunne ikke hente ejendomme");
  }

  return result.data;
}

function formatDato(dato) {
  if (!dato) return "ukendt dato";
  return new Date(dato).toLocaleDateString("da-DK");
}

async function renderPropertyGrid() {
  const gridContainer = document.getElementById("propertyGrid");
  const propertyCount = document.getElementById("propertyCount");

  try {
    const properties = await hentEjendomme();

    propertyCount.textContent = `${properties.length} ejendomme`;

    if (properties.length === 0) {
      gridContainer.innerHTML = "<p>Du har endnu ikke oprettet nogen ejendomme.</p>";
      return;
    }

    gridContainer.innerHTML = "";

    properties.forEach(property => {
      const propertyCard = document.createElement("div");
      propertyCard.classList.add("property-card");

      const adresse = `${property.vejNavn} ${property.vejNummer}`;

      propertyCard.innerHTML = `
        <div class="property-card__accent"></div>
        <div class="property-card__body">
          <div class="property-card__header">
            <h3 class="property-card__adresse">${adresse}</h3>
            <p class="property-card__by">${property.postnummer} ${property.bynavn}</p>
          </div>
          <div class="property-card__chips">
            <span class="property-chip">${property.antalCases} case${property.antalCases !== 1 ? "s" : ""}</span>
          </div>
          <div class="property-card__footer">
            <span class="property-card__dato">Oprettet ${formatDato(property.datoOprettet)}</span>
            <span class="property-card__link">Se ejendom →</span>SS
          </div>
        </div>
      `;

      propertyCard.addEventListener("click", () => {
  const query = new URLSearchParams({
    id: property.id,
    vejnavn: property.vejNavn,
    vejnummer: property.vejNummer,
    postnummer: property.postnummer,
    bynavn: property.bynavn
  });

  window.location.href = `/ejendom.html?${query.toString()}`;
});

      gridContainer.appendChild(propertyCard);
    });
  } catch (error) {
    console.error(error);
    gridContainer.innerHTML = "<p>Kunne ikke hente dine ejendomme.</p>";
  }
}

document.addEventListener("DOMContentLoaded", renderPropertyGrid);