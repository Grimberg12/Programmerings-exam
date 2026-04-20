const mockProperties = [
  {
    id: 1,
    adresse: "Ringstedgade 4",
    postnummer: "2100",
    by: "København Ø",
    antalCases: 1,
    datoOprettet: "16.3.2026"
  },
  {
    id: 2,
    adresse: "Rosenvængets Allé 2",
    postnummer: "2100",
    by: "København Ø",
    antalCases: 0,
    datoOprettet: "15.3.2026"
  },
  {
    id: 3,
    adresse: "Rosenvængets Allé 2",
    postnummer: "2100",
    by: "København Ø",
    antalCases: 0,
    datoOprettet: "15.3.2026"
  },
  {
    id: 4,
    adresse: "Rosenvængets Allé 2",
    postnummer: "2100",
    by: "København Ø",
    antalCases: 0,
    datoOprettet: "15.3.2026"
  },
  {
    id: 5,
    adresse: "Rosenvængets Allé 2",
    postnummer: "2100",
    by: "København Ø",
    antalCases: 0,
    datoOprettet: "15.3.2026"
  }
];


function renderPropertyGrid() {
  const gridContainer = document.getElementById("propertyGrid");
  gridContainer.innerHTML = ""; // Ryd eksisterende indhold

  console.log("Rendering property grid with properties:", mockProperties);

    mockProperties.forEach(property => {
        const propertyCard = document.createElement("div");
        propertyCard.classList.add("property-card");

        propertyCard.innerHTML = `
            <div class="property-card__accent"></div>
            <div class="property-card__body">
                <div class="property-card__header">
                    <h3 class="property-card__adresse">${property.adresse}</h3>
                    <p class="property-card__by">${property.postnummer} ${property.by}</p>
                </div>
                <div class="property-card__chips">
                    <span class="property-chip">${property.antalCases} case${property.antalCases !== 1 ? "s" : ""}</span>
                </div>
                <div class="property-card__footer">
                    <span class="property-card__dato">Oprettet ${property.datoOprettet}</span>
                    <span class="property-card__link">Se ejendom →</span>
                </div>
            </div>
        `;
        gridContainer.appendChild(propertyCard);

        propertyCard.addEventListener("click", () => {
            window.location.href = `/ejendom.html?id=${property.id}`;
        });
    });

    const propertyCount = document.getElementById("propertyCount");
    propertyCount.textContent = `${mockProperties.length} ejendomme`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderPropertyGrid();
});

