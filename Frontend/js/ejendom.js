document.addEventListener("DOMContentLoaded", async () => {
  // Udfyld formular hvis vi er kommet fra blyant-knappen
  let isEditMode = false;
  let editCaseId = null;

  const editCaseRaw = localStorage.getItem("editCase");
  if (editCaseRaw) {
    const ec = JSON.parse(editCaseRaw);
    localStorage.removeItem("editCase");

    const inputSection = document.querySelector(".input-section-investeringscase");
    const createCaseBtn = document.getElementById("openFormButton-investeringscase");
    const investeringscaseMessage = document.getElementById("investeringscaseMessage");
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
    set("koebsPris", ec.koebsPris);
    set("egenkapital", ec.egenkapital);
    set("advokat", ec.advokat);
    set("tinglysning", ec.tinglysning);
    set("koeberRaadgivning", ec.koeberRaadgivning);
    set("andreOmkostninger", ec.andreOmkostninger);
    set("driftsOmkostninger", ec.driftsOmkostninger);

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

  function formatNumberDK(value) {
    if (!value) return "";
    const number = Number(value.toString().replace(/\D/g, ""));
    return number.toLocaleString("da-DK");
  }

  function parseNumber(value) {
    return Number(String(value || "").replace(/\D/g, ""));
  }

  function addKrSuffix(input) {
    const raw = input.value.replace(/\D/g, "");
    if (raw) {
      input.value = formatNumberDK(raw) + " kr.";
    }
  }

  function removeKrSuffix(input) {
    const raw = input.value.replace(/\D/g, "");
    input.value = raw ? formatNumberDK(raw) : "";
  }

  const numberInputs = document.querySelectorAll(".number-input");

  numberInputs.forEach((input) => {
    input.addEventListener("focus", () => {
      removeKrSuffix(input);
    });

    input.addEventListener("input", () => {
      removeKrSuffix(input);
    });

    input.addEventListener("blur", () => {
      addKrSuffix(input);
    });
  });

  if (rentalSelect) {
    rentalSelect.addEventListener("change", toggleRentalInfo);
    toggleRentalInfo();
  }

  // Foreslå mortgage ud fra equity og purchase price
  const koebsPrisInput = document.getElementById("koebsPris");
  const egenkapitalInput = document.getElementById("egenkapital");
  const advokatInput = document.getElementById("advokat");
  const tinglysningInput = document.getElementById("tinglysning");
  const koeberRaadgivningInput = document.getElementById("koeberRaadgivning");
  const andreOmkostningerInput = document.getElementById("andreOmkostninger");
  const mortgageInput = document.getElementById("mortgage");
  const driftsOmkostningerInput = document.getElementById("driftsOmkostninger");

  function getNumber(input) {
    return parseNumber(input?.value);
  }

  function updateMortgagePlaceholder() {
    if (
      !koebsPrisInput ||
      !egenkapitalInput ||
      !advokatInput ||
      !tinglysningInput ||
      !koeberRaadgivningInput ||
      !andreOmkostningerInput ||
      !mortgageInput ||
      !driftsOmkostningerInput
    ) {
      return;
    }

    const koebsPris = getNumber(koebsPrisInput);
    const egenkapital = getNumber(egenkapitalInput);
    const advokat = getNumber(advokatInput);
    const tinglysning = getNumber(tinglysningInput);
    const koeberRaadgivning = getNumber(koeberRaadgivningInput);
    const andreOmkostninger = getNumber(andreOmkostningerInput);

    const suggestedLoan =
      koebsPris -
      egenkapital +
      advokat +
      tinglysning +
      koeberRaadgivning +
      andreOmkostninger;

    if (suggestedLoan > 0) {
      mortgageInput.placeholder =
        suggestedLoan.toLocaleString("da-DK") + " kr. (foreslået lån)";
    } else {
      mortgageInput.placeholder = "Realkredit lån";
    }
  }

  [
    koebsPrisInput,
    egenkapitalInput,
    advokatInput,
    tinglysningInput,
    koeberRaadgivningInput,
    andreOmkostningerInput,
    driftsOmkostningerInput
  ].forEach((input) => {
    if (input) {
      input.addEventListener("input", updateMortgagePlaceholder);
    }
  });

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

    const value = parseNumber(inputField.value);

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

const renovationContainer = document.getElementById("renovationContainer");
const addRenovationBtn = document.getElementById("addRenovationBtn");

function createRenovationField() {
  const renovationDiv = document.createElement("div");
  renovationDiv.classList.add("renovation-item");

  renovationDiv.innerHTML = `
    <div class="form-group">
      <label>Renoveringsnavn:</label>
      <input type="text" class="renovation-name">
    </div>

    <div class="form-group">
      <label>Beskrivelse:</label>
      <textarea class="renovation-description"></textarea>
    </div>

    <div class="form-group">
      <label>Pris (DKK):</label>
      <input type="text" class="number-input renovation-price">
    </div>

    <div class="form-group">
      <label>Planlagt startdato:</label>
      <input type="date" class="renovation-start-date">
    </div>

    <button type="button" class="remove-renovation-btn">Fjern renovering</button>
    <hr>
  `;

  renovationDiv.querySelector(".remove-renovation-btn").addEventListener("click", () => {
    renovationDiv.remove();
  });

  renovationContainer.appendChild(renovationDiv);
}

if (addRenovationBtn) {
  addRenovationBtn.addEventListener("click", createRenovationField);
}
  
  // Submit formular
  const investmentForm = document.getElementById("investmentForm");

  if (investmentForm) {
    investmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!investmentForm.reportValidity()) return;

      const rentalValue = document.getElementById("rental")?.value;
      const udlejes = rentalValue === "true";

      const renovations = Array.from(document.querySelectorAll(".renovation-item"))
        .map((item) => ({
        navn: item.querySelector(".renovation-name")?.value.trim(),
        beskrivelse: item.querySelector(".renovation-description")?.value.trim(),
        pris: parseNumber(item.querySelector(".renovation-price")?.value),
        planlagtStartDato: item.querySelector(".renovation-start-date")?.value || null
      }))
      .filter((renovation) => renovation.navn || renovation.pris > 0);

      const opdateretCase = {
        id: editCaseId,
        ejendomsProfilID: Number(new URLSearchParams(window.location.search).get("id")),
        navn: document.getElementById("investmentName")?.value.trim(),
        beskrivelse: document.getElementById("description")?.value.trim() || "",
        koebsPris: parseNumber(document.getElementById("koebsPris")?.value),
        egenKapital: parseNumber(document.getElementById("egenkapital")?.value),
        advokat: parseNumber(document.getElementById("advokat")?.value),
        tinglysning: parseNumber(document.getElementById("tinglysning")?.value),
        koeberRaadgivning: parseNumber(document.getElementById("koeberRaadgivning")?.value),
        andreOmkostninger: parseNumber(document.getElementById("andreOmkostninger")?.value),
        driftsOmkostninger: parseNumber(document.getElementById("driftsOmkostninger")?.value),
        renovations,

        realkreditlån: parseNumber(document.getElementById("mortgage")?.value) > 0 ? {
          beløb: parseNumber(document.getElementById("mortgage")?.value),
          type: document.getElementById("mortgageType")?.value,
          rente: parseNumber(document.getElementById("mortgageInterest")?.value) / 100,
          løbetid: Number(document.getElementById("mortgageTerm")?.value)
        } : null,

        banklån: parseNumber(document.getElementById("bankLoan")?.value) > 0 ? {
          beløb: parseNumber(document.getElementById("bankLoan")?.value),
          type: document.getElementById("bankLoanType")?.value,
          rente: parseNumber(document.getElementById("bankLoanInterest")?.value) / 100,
          løbetid: Number(document.getElementById("bankLoanTerm")?.value)
        } : null,

        andrelån: parseNumber(document.getElementById("otherLoans")?.value) > 0 ? {
          beløb: parseNumber(document.getElementById("otherLoans")?.value),
          type: document.getElementById("otherLoansType")?.value,
          rente: parseNumber(document.getElementById("otherLoansInterest")?.value) / 100,
          løbetid: Number(document.getElementById("otherLoansTerm")?.value)
        } : null,

        udlejning: {
          udlejes,
          månedligLeje: udlejes ? parseNumber(document.getElementById("rentalIncome")?.value) : 0,
          månedligUdgifter: udlejes ? parseNumber(document.getElementById("rentalExpenses")?.value) : 0
        }
      };

      if (isEditMode) {
        try {
          const response = await fetch(`/api/v1/investment-cases/${editCaseId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              caseNavn: opdateretCase.navn,
              beskrivelse: opdateretCase.beskrivelse,
              simuleringsAar: 30,

              koebsPris: opdateretCase.koebsPris,
              egenKapital: opdateretCase.egenKapital,
              advokat: opdateretCase.advokat,
              tinglysning: opdateretCase.tinglysning,
              koeberRaadgivning: opdateretCase.koeberRaadgivning,
              andreOmkostninger: opdateretCase.andreOmkostninger,
              renovations: opdateretCase.renovations,
              driftsOmkostninger: opdateretCase.driftsOmkostninger,

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
            alert(result.message || "Kunne ikke gemme ændringer.");
            return;
          }

          window.location.href = `/investeringscase.html?id=${editCaseId}`;
          return;

        } catch (error) {
          console.error("Fejl ved opdatering:", error);
          alert("Kunne ikke forbinde til serveren.");
          return;
        }
      }

      console.log("Sender til backend:", {
      ejendomsProfilID: opdateretCase.ejendomsProfilID,
      caseNavn: opdateretCase.navn,
      simuleringsAar: 30
    });
    try {
      const response = await fetch("/api/v1/investment-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ejendomsProfilID: opdateretCase.ejendomsProfilID,
          caseNavn: opdateretCase.navn,
          beskrivelse: opdateretCase.beskrivelse,
          simuleringsAar: 30,

          koebsPris: opdateretCase.koebsPris,
          egenKapital: opdateretCase.egenKapital,
          advokat: opdateretCase.advokat,
          tinglysning: opdateretCase.tinglysning,
          koeberRaadgivning: opdateretCase.koeberRaadgivning,
          andreOmkostninger: opdateretCase.andreOmkostninger,
          renovations: opdateretCase.renovations,
          driftsOmkostninger: opdateretCase.driftsOmkostninger,

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
      if (response.ok) {
        investeringscaseMessage.textContent = "Case oprettet!";
        investeringscaseMessage.style.color = "green";

      } else {
        investeringscaseMessage.textContent = result.message || "Kunne ikke oprette case.";
        investeringscaseMessage.style.color = "red";
      }

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