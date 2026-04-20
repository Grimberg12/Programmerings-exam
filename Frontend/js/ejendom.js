const BYGNINGSANVENDELSE = {
  110: "Stuehus til landbrugsejendom",
  120: "Fritliggende enfamiliehus",
  121: "Sammenbygget enfamiliehus",
  130: "Fritliggende enfamiliehus (dobbelthus)",
  140: "Etageboligbebyggelse, flerfamiliehus",
  150: "Kollegium",
  160: "Fritidshus",
  185: "Anneks",
  190: "Anden helårsbeboelse",
  210: "Erhvervsmæssig produktion",
  220: "Landbrug, skovbrug, gartneri",
  230: "Industri, produktion",
  290: "Anden erhvervsanvendelse",
};

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const adresseid = params.get("adresseid");
  const vejnavn = params.get("vejnavn");
  const vejnummer = params.get("vejnummer");
  const postnummer = params.get("postnummer");
  const bynavn = params.get("bynavn");

  const container = document.getElementById("propertyDetails");

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
    // Det præcise matrikelareal ligger i Matriklen-API (separat Datafordeler-service)
    // og kræver opslag via jordstykkeList fra grund-entiteten
    const grundareal = bygning.byg041BebyggetAreal ?? "–";

    container.innerHTML = `
      <h2>${adresse}</h2>
      <p>${by}</p>
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


// tidligere oprettet cases - placeholder
const relatedCasesContainer = document.getElementById("relatedCases");
const mockCases = [
  { id: 1, name: "Case 1", description: "Beskrivelse af case 1", purchasePrice: 2000000, equity: 500000, otherCosts: 100000, renovationCosts: 150000, mortgage: 1350000, mortgageType: "fast", mortgageInterest: 3.5, mortgageTerm: 30, bankLoan: 0, bankLoanType: "fast", bankLoanInterest: 0, bankLoanTerm: 0, otherLoans: 0, otherLoansType: "fast", otherLoansInterest: 0, otherLoansTerm: 0, rental: "true", rentalIncome: 15000, rentalExpenses: 5000 },
  { id: 2, name: "Case 2", description: "Beskrivelse af case 2", purchasePrice: 3000000, equity: 1000000, otherCosts: 200000, renovationCosts: 250000, mortgage: 1750000, mortgageType: "variabel", mortgageInterest: 2.8, mortgageTerm: 30, bankLoan: 500000, bankLoanType: "fast", bankLoanInterest: 4.5, bankLoanTerm: 15, otherLoans: 0, otherLoansType: "fast", otherLoansInterest: 0, otherLoansTerm: 0, rental: "false", rentalIncome: 0, rentalExpenses: 0 },
  { id: 3, name: "Case 3", description: "Beskrivelse af case 3", purchasePrice: 4000000, equity: 1500000, otherCosts: 300000, renovationCosts: 350000, mortgage: 2250000, mortgageType: "fast", mortgageInterest: 3.8, mortgageTerm: 30, bankLoan: 500000, bankLoanType: "fast", bankLoanInterest: 4.8, bankLoanTerm: 15, otherLoans: 0, otherLoansType: "fast", otherLoansInterest: 0, otherLoansTerm: 0, rental: "true", rentalIncome: 25000, rentalExpenses: 15000 }
];

// Render cases i relatedCasesContainer - link to site for case details (investeringscase.html?id=CASE_ID)
mockCases.forEach(c => {
  const caseElement = document.createElement("div");
  caseElement.innerHTML = `
  <div class="related-case-card">
    <div class="case-header">
      <h3>${c.name}</h3>
      <button class="case-delete-button" title="Slet case" data-case-id="${c.id}">×</button>
    </div>
    <p>${c.description}</p>
    <a href="/investeringscase.html?id=${c.id}">Se detaljer</a>
  </div>
  `;
  relatedCasesContainer.appendChild(caseElement);
});


// delete case when pressed button - remove from DOM and log id (later API call)
relatedCasesContainer.addEventListener("click", (event) => {
  if (event.target.classList.contains("case-delete-button")) {
    const caseId = event.target.getAttribute("data-case-id");
    console.log("Sletter case med ID:", caseId);
    alert("Case slettet (placeholder) - ID: " + caseId);
    event.target.closest(".related-case-card").remove();
    // Implement API call to delete case here
  }
});