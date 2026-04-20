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

  // Udfyld formular hvis vi er kommet fra blyant-knappen
  let isEditMode = false;
  let editCaseId = null;

  const editCaseRaw = localStorage.getItem("editCase");
  if (editCaseRaw) {
    const ec = JSON.parse(editCaseRaw);
    localStorage.removeItem("editCase");

    const inputSection = document.querySelector(".input-section-investeringscase");
    const createCaseBtn = document.getElementById("openFormButton-investeringscase");
    if (inputSection) inputSection.style.display = "block";
    if (createCaseBtn) createCaseBtn.style.display = "none";

    const relatedHeading = document.getElementById("relatedCasesHeading");
    const relatedCases = document.getElementById("relatedCases");
    const createCaseContainer = document.getElementById("createCaseContainer");
    if (relatedHeading) relatedHeading.style.display = "none";
    if (relatedCases) relatedCases.style.display = "none";
    if (createCaseContainer) createCaseContainer.style.display = "none";

    const formTitle = document.querySelector(".input-section-investeringscase h2");
    if (formTitle) formTitle.textContent = "Rediger din investeringscase";

    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };
    const setSelect = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };

    set("investmentName", ec.navn);
    set("description", ec.beskrivelse);
    set("purchasePrice", ec.købspris);
    set("equity", ec.egenkapital);
    set("otherCosts", ec.andre_omkostninger);
    set("renovationCosts", ec.renoveringsomkostninger);

    if (ec.realkreditlån) {
      set("mortgage", ec.realkreditlån.beløb);
      setSelect("mortgageType", ec.realkreditlån.type);
      set("mortgageInterest", ec.realkreditlån.rente * 100);
      set("mortgageTerm", ec.realkreditlån.løbetid);
    }
    if (ec.banklån) {
      set("bankLoan", ec.banklån.beløb);
      setSelect("bankLoanType", ec.banklån.type);
      set("bankLoanInterest", ec.banklån.rente * 100);
      set("bankLoanTerm", ec.banklån.løbetid);
    }
    if (ec.andrelån) {
      set("otherLoans", ec.andrelån.beløb);
      setSelect("otherLoansType", ec.andrelån.type);
      set("otherLoansInterest", ec.andrelån.rente * 100);
      set("otherLoansTerm", ec.andrelån.løbetid);
    }

    setSelect("rental", String(ec.udlejning.udlejes));
    if (ec.udlejning.udlejes) {
      set("rentalIncome", ec.udlejning.månedligLeje);
      set("rentalExpenses", ec.udlejning.månedligUdgifter);
    }

    const submitBtn = document.getElementById("submitFormButton-investeringscase");
    if (submitBtn) submitBtn.textContent = "Gem ændringer";

    isEditMode = true;
    editCaseId = ec.id;

    // Trigger konditionelle sektioner så de vises med de udfyldte værdier
    setTimeout(() => { updateLoanSections(); toggleRentalInfo(); updateMortgagePlaceholder(); }, 0);
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

      if (!investmentForm.reportValidity()) return;

      const rentalValue = document.getElementById("rental")?.value;
      const udlejes = rentalValue === "true";

      const opdateretCase = {
        id: editCaseId,
        ejendomsProfilID: Number(new URLSearchParams(window.location.search).get("id")),
        navn: document.getElementById("investmentName")?.value.trim(),
        beskrivelse: document.getElementById("description")?.value.trim() || "",
        købspris: Number(document.getElementById("purchasePrice")?.value || 0),
        egenkapital: Number(document.getElementById("equity")?.value || 0),
        andre_omkostninger: Number(document.getElementById("otherCosts")?.value || 0),
        renoveringsomkostninger: Number(document.getElementById("renovationCosts")?.value || 0),
        realkreditlån: Number(document.getElementById("mortgage")?.value) > 0 ? {
          beløb: Number(document.getElementById("mortgage")?.value),
          type: document.getElementById("mortgageType")?.value,
          rente: Number(document.getElementById("mortgageInterest")?.value) / 100,
          løbetid: Number(document.getElementById("mortgageTerm")?.value)
        } : null,
        banklån: Number(document.getElementById("bankLoan")?.value) > 0 ? {
          beløb: Number(document.getElementById("bankLoan")?.value),
          type: document.getElementById("bankLoanType")?.value,
          rente: Number(document.getElementById("bankLoanInterest")?.value) / 100,
          løbetid: Number(document.getElementById("bankLoanTerm")?.value)
        } : null,
        andrelån: Number(document.getElementById("otherLoans")?.value) > 0 ? {
          beløb: Number(document.getElementById("otherLoans")?.value),
          type: document.getElementById("otherLoansType")?.value,
          rente: Number(document.getElementById("otherLoansInterest")?.value) / 100,
          løbetid: Number(document.getElementById("otherLoansTerm")?.value)
        } : null,
        udlejning: {
          udlejes,
          månedligLeje: udlejes ? Number(document.getElementById("rentalIncome")?.value || 0) : 0,
          månedligUdgifter: udlejes ? Number(document.getElementById("rentalExpenses")?.value || 0) : 0
        }
      };

      if (isEditMode) {
        /* PUT til database her.
           Eksempel:
           const response = await fetch(`/api/v1/investment-cases/${opdateretCase.id}`, {
             method: "PUT",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(opdateretCase)
           });
        */
        localStorage.setItem("updatedCase", JSON.stringify(opdateretCase));
        window.location.href = "/investeringscase.html";
        return;
      }

      try {
        const response = await fetch("/api/v1/investment-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ejendomsProfilID: opdateretCase.ejendomsProfilID,
            caseNavn: opdateretCase.navn,
            beskrivelse: opdateretCase.beskrivelse,
            simuleringsAar: 30,
            koebsPris: opdateretCase.købspris,
            egenKapital: opdateretCase.egenkapital,
            otherCosts: opdateretCase.andre_omkostninger,
            renovationOmkostninger: opdateretCase.renoveringsomkostninger,
            laaneBeloeb: opdateretCase.realkreditlån?.beløb || 0,
            laaneType: opdateretCase.realkreditlån?.type || "",
            rente: opdateretCase.realkreditlån?.rente * 100 || 0,
            loebetid: opdateretCase.realkreditlån?.løbetid || 0,
            bankLaan: opdateretCase.banklån?.beløb || 0,
            bankLaanType: opdateretCase.banklån?.type || "",
            bankLaanRente: opdateretCase.banklån?.rente * 100 || 0,
            bankLaanLoebetid: opdateretCase.banklån?.løbetid || 0,
            andreLaan: opdateretCase.andrelån?.beløb || 0,
            andreLaanType: opdateretCase.andrelån?.type || "",
            andreLaanRente: opdateretCase.andrelån?.rente * 100 || 0,
            andreLaanLoebetid: opdateretCase.andrelån?.løbetid || 0,
            udlejning: String(opdateretCase.udlejning.udlejes),
            udlejningIndkomst: opdateretCase.udlejning.månedligLeje,
            udlejningUdgifter: opdateretCase.udlejning.månedligUdgifter
          })
        });

        const result = await response.json();

        if (!response.ok) {
          alert(result.message || "Noget gik galt.");
          console.error("Backend-fejl:", result);
          return;
        }

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