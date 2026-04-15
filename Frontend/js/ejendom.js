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

  const container = document.getElementById("propertyDetails");

  if (container) {
    // Find ejendom
    const property = mockProperties.find((p) => p.id == id);

    // Fejlhåndtering
    if (!property) {
      container.innerHTML = "<p>Ejendom ikke fundet</p>";
      console.error("Ingen ejendom fundet med id:", id);
    } else {
      // Render ejendom
      container.innerHTML = `
        <h2>${property.adresse}</h2>
        <p>${property.postnummer} ${property.by}</p>
        <p>Antal cases: ${property.antalCases}</p>
        <p>Dato oprettet: ${property.datoOprettet}</p>
      `;

      console.log("Fundet ejendom:", property);
    }
  }

  // Udlejning vis/skjul
  const rentalSelect = document.getElementById("rental");
  const rentalInfo = document.getElementById("rentalInfo");

  function toggleRentalInfo() {
    if (!rentalSelect || !rentalInfo) return;

    const value = rentalSelect.value;

    if (value === "true") {
      rentalInfo.style.display = "block";
    } else {
      rentalInfo.style.display = "none";
    }
  }

  if (rentalSelect) {
    rentalSelect.addEventListener("change", toggleRentalInfo);
    toggleRentalInfo();
  }

  // Foreslå mortgage ud fra equity og purchase price
  const purchasePriceInput = document.getElementById("purchasePrice");
  const equityInput = document.getElementById("equity");
  const mortgageInput = document.getElementById("mortgage");
  const otherCostsInput = document.getElementById("otherCosts");
  const renovationCostsInput = document.getElementById("renovationCosts");

  function updateMortgagePlaceholder() {
    if (
      !purchasePriceInput ||
      !equityInput ||
      !mortgageInput ||
      !otherCostsInput ||
      !renovationCostsInput
    ) {
      return;
    }

    const purchasePrice = parseFloat(purchasePriceInput.value);
    const equity = parseFloat(equityInput.value);
    const otherExpenses = parseFloat(otherCostsInput.value) || 0;
    const renovationCosts = parseFloat(renovationCostsInput.value) || 0;

    if (!isNaN(purchasePrice) && !isNaN(equity)) {
      const result = purchasePrice - equity + otherExpenses + renovationCosts;

      if (result >= 0) {
        mortgageInput.placeholder =
          result.toLocaleString("da-DK") + " kr. (foreslået lån)";
      } else {
        mortgageInput.placeholder = "Realkredit lån";
      }
    } else {
      mortgageInput.placeholder = "Realkredit lån";
    }
  }

  if (purchasePriceInput) {
    purchasePriceInput.addEventListener("input", updateMortgagePlaceholder);
  }
  if (equityInput) {
    equityInput.addEventListener("input", updateMortgagePlaceholder);
  }
  if (otherCostsInput) {
    otherCostsInput.addEventListener("input", updateMortgagePlaceholder);
  }
  if (renovationCostsInput) {
    renovationCostsInput.addEventListener("input", updateMortgagePlaceholder);
  }

  // Åbn/luk formular
  const createCaseBtn = document.getElementById("openFormButton-investeringscase");
  const inputSection = document.querySelector(".input-section-investeringscase");

  if (createCaseBtn && inputSection) {
    createCaseBtn.addEventListener("click", () => {
      if (inputSection.style.display === "none" || inputSection.style.display === "") {
        inputSection.style.display = "block";
        createCaseBtn.textContent = "Luk form";
      } else {
        inputSection.style.display = "none";
        createCaseBtn.textContent = "Opret ny investeringscase";
      }
    });
  }

  // Lånefelter
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
    if (!inputField || !detailSection || !fields) return;

    const value = parseFloat(inputField.value);

    if (!isNaN(value) && value > 0) {
      detailSection.style.display = "block";

      fields.forEach((field) => {
        if (field) field.required = true;
      });
    } else {
      detailSection.style.display = "none";

      fields.forEach((field) => {
        if (field) {
          field.required = false;
          field.value = "";
        }
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

  if (realKreditInput) {
    realKreditInput.addEventListener("input", updateLoanSections);
  }
  if (bankLoanInput) {
    bankLoanInput.addEventListener("input", updateLoanSections);
  }
  if (otherLoansInput) {
    otherLoansInput.addEventListener("input", updateLoanSections);
  }

  updateLoanSections();

  // Submit formular
  const investmentForm = document.getElementById("investmentForm");

  if (investmentForm) {
    investmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const params = new URLSearchParams(window.location.search);
      const ejendomsProfilID = params.get("id");

      const formData = {
        ejendomsProfilID: Number(ejendomsProfilID),
        caseNavn: document.getElementById("investmentName")?.value.trim(),
        beskrivelse: document.getElementById("description")?.value.trim() || "",
        simuleringsAar: 30,

        koebsPris: document.getElementById("purchasePrice")?.value || 0,
        egenKapital: document.getElementById("equity")?.value || 0,
        otherCosts: document.getElementById("otherCosts")?.value || 0,
        renovationOmkostninger: document.getElementById("renovationCosts")?.value || 0,

        laaneBeloeb: document.getElementById("mortgage")?.value || 0,
        laaneType: document.getElementById("mortgageType")?.value || "",
        rente: document.getElementById("mortgageInterest")?.value || 0,
        loebetid: document.getElementById("mortgageTerm")?.value || 0,

        bankLaan: document.getElementById("bankLoan")?.value || 0,
        bankLaanType: document.getElementById("bankLoanType")?.value || "",
        bankLaanRente: document.getElementById("bankLoanInterest")?.value || 0,
        bankLaanLoebetid: document.getElementById("bankLoanTerm")?.value || 0,

        andreLaan: document.getElementById("otherLoans")?.value || 0,
        andreLaanType: document.getElementById("otherLoansType")?.value || "",
        andreLaanRente: document.getElementById("otherLoansInterest")?.value || 0,
        andreLaanLoebetid: document.getElementById("otherLoansTerm")?.value || 0,

        udlejning: document.getElementById("rental")?.value || "false",
        udlejningIndkomst: document.getElementById("rentalIncome")?.value || 0,
        udlejningUdgifter: document.getElementById("rentalExpenses")?.value || 0
      };

      console.log("Sender data til backend:", formData);

      try {
        const response = await fetch("/api/v1/investment-cases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
          alert(result.message || "Noget gik galt.");
          console.error("Backend-fejl:", result);
          return;
        }

        alert("Investeringscase oprettet!");
        console.log("Case oprettet:", result);

        investmentForm.reset();
        toggleRentalInfo();
        updateLoanSections();
        updateMortgagePlaceholder();

      } catch (error) {
        console.error("Fejl ved oprettelse af case:", error);
        alert("Kunne ikke forbinde til serveren.");
      }
    });
  }
});