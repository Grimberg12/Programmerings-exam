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
const otherCostsInput = document.getElementById("otherCosts")
const renovationCostsInput = document.getElementById("renovationCosts");

function updateMortgagePlaceholder() {
    const purchasePrice = parseFloat(purchasePriceInput.value);
    const equity = parseFloat(equityInput.value);
    const otherExpenses = parseFloat(otherCostsInput.value) || 0; // Hvis tom, så 0
    const renovationCosts = parseFloat(renovationCostsInput.value) || 0; // Hvis tom, så 0

    // Valider input
    if (!isNaN(purchasePrice) && !isNaN(equity)) {
        const result = purchasePrice - equity + otherExpenses + renovationCosts;

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
otherCostsInput.addEventListener("input", updateMortgagePlaceholder);
renovationCostsInput.addEventListener("input", updateMortgagePlaceholder);

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

//dropdown conditional section for diffrent types of rent. Find ID for the specific. Then add event listener for change. If value is "true" show the section, else hide it.
const realKreditInput = document.getElementById("mortgage");
const bankLoanInput = document.getElementById("bankLoan");
const otherLoansInput = document.getElementById("otherLoans");

const mortgageDetails = document.getElementById("mortgageDetails-realkredit");
const bankLoanDetails = document.getElementById("mortgageDetails-bankLoan");
const otherLoansDetails = document.getElementById("mortgageDetails-otherLoans");

const mortgageType = document.getElementById("mortgageType");
const mortgageInterest = document.getElementById("mortgageInterest");
const mortgageTerm = document.getElementById("mortgageTerm");

const bankLoanType = document.getElementById("bankLoanType");
const bankLoanInterest = document.getElementById("bankLoanInterest");
const bankLoanTerm = document.getElementById("bankLoanTerm");

const otherLoansType = document.getElementById("otherLoansType");
const otherLoansInterest = document.getElementById("otherLoansInterest");
const otherLoansTerm = document.getElementById("otherLoansTerm");

function toggleLoanSection(inputField, detailSection, fields) {
  const value = parseFloat(inputField.value);

  if (!isNaN(value) && value > 0) {
    detailSection.style.display = "block";

    fields.forEach((field) => {
      field.required = true;
    });
  } else {
    detailSection.style.display = "none";

    fields.forEach((field) => {
      field.required = false;
      field.value = "";
    });
  }
}

function updateLoanSections() {
  toggleLoanSection(realKreditInput, mortgageDetails, [
    mortgageType,
    mortgageInterest,
    mortgageTerm
  ]);

  toggleLoanSection(bankLoanInput, bankLoanDetails, [
    bankLoanType,
    bankLoanInterest,
    bankLoanTerm
  ]);

  toggleLoanSection(otherLoansInput, otherLoansDetails, [
    otherLoansType,
    otherLoansInterest,
    otherLoansTerm
  ]);
}

mortgageInput.addEventListener("input", updateLoanSections);
bankLoanInput.addEventListener("input", updateLoanSections);
otherLoansInput.addEventListener("input", updateLoanSections);