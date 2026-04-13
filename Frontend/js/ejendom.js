document.addEventListener("DOMContentLoaded", () => {

  // Mock data (midlertidig – senere API)
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

  // Hent ID fra URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  console.log("ID fra URL:", id);

  // Find ejendom
  const property = mockProperties.find(p => p.id == id);

  const container = document.getElementById("propertyDetails");

  // Fejlhåndtering
  if (!property) {
    container.innerHTML = "<p>Ejendom ikke fundet</p>";
    console.error("Ingen ejendom fundet med id:", id);
    return;
  }

  // Render ejendom
  container.innerHTML = `
    <h2>${property.adresse}</h2>
    <p>${property.postnummer} ${property.by}</p>
    <p>Antal cases: ${property.antalCases}</p>
    <p>Dato oprettet: ${property.datoOprettet}</p>
  `;

  console.log("Fundet ejendom:", property);

});

const rentalSelect = document.getElementById("rental");
const rentalInfo = document.getElementById("rentalInfo");

function toggleRentalInfo() {
    const value = rentalSelect.value; // altid string fra <select>

    if (value === "true") {
        rentalInfo.style.display = "block";
    } else {
        rentalInfo.style.display = "none";
    }
}

// Kør ved ændring
rentalSelect.addEventListener("change", toggleRentalInfo);

// Kør ved load (så den er korrekt fra start)
toggleRentalInfo();

//Forslå mortgage ud fra equity og purchase price.
const purchasePriceInput = document.getElementById("purchasePrice");
const equityInput = document.getElementById("equity");
const mortgageInput = document.getElementById("mortgage");

function updateMortgagePlaceholder() {
    const purchasePrice = parseFloat(purchasePriceInput.value);
    const equity = parseFloat(equityInput.value);

    // Valider input
    if (!isNaN(purchasePrice) && !isNaN(equity)) {
        const result = purchasePrice - equity;

        if (result >= 0) {
            mortgageInput.placeholder = result.toLocaleString("da-DK") + " kr. (foreslået lån)";
        } else {
            mortgageInput.placeholder = "Realkredit lån";
        }
    } else {
        mortgageInput.placeholder = "Realkredit lån";
    }
}

// Lyt på begge inputs
purchasePriceInput.addEventListener("input", updateMortgagePlaceholder);
equityInput.addEventListener("input", updateMortgagePlaceholder);

//when opret investeringscase is clicked open form (defeault is hidden)
const createCaseBtn = document.getElementById("openFormButton-investeringscase");
const inputSection = document.querySelector(".input-section-investeringscase");

createCaseBtn.addEventListener("click", () => {
    if (inputSection.style.display === "none" || inputSection.style.display === "") {
        inputSection.style.display = "block";
        createCaseBtn.textContent = "Luk form";
    } else {
        inputSection.style.display = "none";
        createCaseBtn.textContent = "Opret ny investeringscase";
    }
});