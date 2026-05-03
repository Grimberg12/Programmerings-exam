// ── Hent ejendomme fra backend ────────────────────────────────────────────────
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

// ── Formatér dato til dansk format ───────────────────────────────────────────
function formatDato(dato) {
  if (!dato) return "ukendt dato";

  return new Date(dato).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// ── Slet ejendomsprofil med bekræftelsesdialog ───────────────────────────────
async function sletEjendomsprofil(id) {
  const bekraeft = confirm("Er du sikker på, at du vil slette denne ejendomsprofil? Alle tilknyttede investeringscases bliver også slettet.");

  if (!bekraeft) return;

  const response = await fetch(`/api/v1/ejendomsprofiler/${id}`, {
    method: "DELETE"
  });

  const result = await response.json();

  if (!response.ok) {
    alert(result.message || "Kunne ikke slette ejendomsprofil.");
    return;
  }

  alert("Ejendomsprofil slettet.");
  renderPropertyGrid();
}

// ── Byg og vis ejendomsgrid i DOM ────────────────────────────────────────────
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

      const ændretDato = property.datoAendret
        ? formatDato(property.datoAendret)
          : "Ikke ændret endnu";

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
            <span class="property-card__dato">Oprettet ${formatDato(property.datoOprettet)}</span><br>
            <span class="property-card__dato">Sidst ændret ${ændretDato}</span>
          </div>

            <button 
            class="delete-property-btn"
            onclick="event.stopPropagation(); sletEjendomsprofil(${property.id});"
            >
            Slet
            </button>
          </div>
        </div>
      `;

      propertyCard.addEventListener("click", () => {
        window.location.href = `/ejendom.html?id=${property.id}`;
      });

      gridContainer.appendChild(propertyCard);
    });
  } catch (error) {
    console.error(error);
    gridContainer.innerHTML = "<p>Kunne ikke hente dine ejendomme.</p>";
  }
}

// ── Start ved sideindlæsning ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", renderPropertyGrid);