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
            <h3>${property.adresse}</h3>
            <p>${property.postnummer} ${property.by}</p>
            <p>Antal cases: ${property.antalCases}</p>
            <p>Dato oprettet: ${property.datoOprettet}</p>
        `;
        gridContainer.appendChild(propertyCard);

        propertyCard.addEventListener("click", () => {
            window.location.href = `ejendom.html?id=${property.id}`;
        });

    });

    const propertyCount = document.getElementById("propertyCount");
    propertyCount.textContent = `${mockProperties.length} ejendomme`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderPropertyGrid();
});

