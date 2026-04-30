// parseNumber og formatNumberDK er defineret her øverst så alle funktioner kan bruge dem
function parseNumber(value) {
  return Number(String(value || "").replace(/\D/g, ""));
}

function formatNumberDK(value) {
  if (!value) return "";
  const number = Number(value.toString().replace(/\D/g, ""));
  return number.toLocaleString("da-DK");
}

// ── Låneberegningshjælpere (bruges til live ydelsesvisning i wizarden) ───────
function beregnMånedligYdelseWizard(beløb, rente, løbetidMdr, afdragsFriMdr) {
  if (!beløb || beløb <= 0 || !løbetidMdr || løbetidMdr <= 0) return 0;
  const i = rente / 12;
  const amortMdr = løbetidMdr - (afdragsFriMdr || 0);
  if (amortMdr <= 0) return i === 0 ? 0 : beløb * i;
  if (i === 0) return beløb / amortMdr;
  return beløb * i / (1 - Math.pow(1 + i, -amortMdr));
}

function beregnRenteYdelseWizard(beløb, rente) {
  return beløb * (rente / 12);
}

// Opdaterer live ydelsesvisning for ét lån
function opdaterYdelseDisplay(beløbId, renteId, termId, afdragsfriId, visId, renteStrongId, amortStrongId) {
  const beløb     = parseNumber(document.getElementById(beløbId)?.value);
  const rente     = parseFloat(document.getElementById(renteId)?.value || "0") / 100;
  const løbetid   = Number(document.getElementById(termId)?.value || "0");
  const afdragsfri = Number(document.getElementById(afdragsfriId)?.value || "0");
  const visDiv    = document.getElementById(visId);

  if (!visDiv) return;

  if (beløb > 0 && løbetid > 0 && rente >= 0) {
    const amortYdelse   = beregnMånedligYdelseWizard(beløb, rente, løbetid, afdragsfri);
    const renteYdelse   = beregnRenteYdelseWizard(beløb, rente);
    const kr = v => Math.round(v).toLocaleString("da-DK") + " kr./md.";

    if (document.getElementById(renteStrongId))
      document.getElementById(renteStrongId).textContent = afdragsfri > 0 ? kr(renteYdelse) : "Ingen afdragsfri periode";
    if (document.getElementById(amortStrongId))
      document.getElementById(amortStrongId).textContent = kr(amortYdelse);

    visDiv.style.display = "block";
  } else {
    visDiv.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  let isEditMode = false;
  let editCaseId = null;

  // ── Edit-mode: udfyld formular fra localStorage ──────────────────
  const editCaseRaw = localStorage.getItem("editCase");
  if (editCaseRaw) {
    const ec = JSON.parse(editCaseRaw);
    localStorage.removeItem("editCase");

    const inputSection  = document.querySelector(".input-section-investeringscase");
    const createCaseBtn = document.getElementById("openFormButton-investeringscase");
    if (inputSection)  inputSection.style.display = "block";
    if (createCaseBtn) createCaseBtn.style.display = "none";

    const relatedHeading     = document.getElementById("relatedCasesHeading");
    const relatedCases       = document.getElementById("relatedCases");
    const createCaseContainer = document.getElementById("createCaseContainer");
    if (relatedHeading)      relatedHeading.style.display = "none";
    if (relatedCases)        relatedCases.style.display = "none";
    if (createCaseContainer) createCaseContainer.style.display = "none";

    const formTitle = document.querySelector(".input-section-investeringscase h2");
    if (formTitle) formTitle.textContent = "Rediger din investeringscase";

    const set       = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };
    const setSelect = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };

    set("investmentName",      ec.navn);
    set("description",         ec.beskrivelse);
    set("koebsPris",           ec.koebsPris ?? ec.købspris);
    set("egenkapital",         ec.egenKapital ?? ec.egenkapital);
    set("advokat",             ec.advokat);
    set("tinglysning",         ec.tinglysning);
    set("koeberRaadgivning",   ec.koeberRaadgivning);
    set("andreOmkostninger",   ec.andreOmkostninger ?? ec.andre_omkostninger);
    set("driftsOmkostninger",  ec.driftsOmkostninger);

    if (ec.realkreditlån) {
      set("mortgage",            ec.realkreditlån.beløb);
      setSelect("mortgageType",  ec.realkreditlån.type);
      set("mortgageInterest",    (ec.realkreditlån.rente * 100).toFixed(2));
      set("mortgageTerm",        ec.realkreditlån.løbetid);
      set("mortgageAfdragsFri",  ec.realkreditlån.afdragsFriMåneder || 0);
    }
    if (ec.banklån) {
      set("bankLoan",            ec.banklån.beløb);
      setSelect("bankLoanType",  ec.banklån.type);
      set("bankLoanInterest",    (ec.banklån.rente * 100).toFixed(2));
      set("bankLoanTerm",        ec.banklån.løbetid);
      set("bankLoanAfdragsFri",  ec.banklån.afdragsFriMåneder || 0);
    }
    if (ec.andrelån) {
      set("otherLoans",          ec.andrelån.beløb);
      setSelect("otherLoansType", ec.andrelån.type);
      set("otherLoansInterest",  (ec.andrelån.rente * 100).toFixed(2));
      set("otherLoansTerm",      ec.andrelån.løbetid);
      set("otherLoansAfdragsFri", ec.andrelån.afdragsFriMåneder || 0);
    }

    setSelect("rental", String(ec.udlejning?.udlejes ?? false));
    if (ec.udlejning?.udlejes) {
      set("rentalIncome",   ec.udlejning.månedligLeje);
      set("rentalExpenses", ec.udlejning.månedligUdgifter);
    }

    const submitBtn = document.getElementById("submitFormButton-investeringscase");
    if (submitBtn) submitBtn.textContent = "Gem ændringer";

    isEditMode  = true;
    editCaseId  = ec.id;

    setTimeout(() => { updateLoanSections(); toggleRentalInfo(); updateMortgagePlaceholder(); }, 0);
  }

  // ── Udlejning vis/skjul ──────────────────────────────────────────
  const rentalSelect = document.getElementById("rental");
  const rentalInfo   = document.getElementById("rentalInfo");

  function toggleRentalInfo() {
    if (!rentalSelect || !rentalInfo) return;
    rentalInfo.style.display = rentalSelect.value === "true" ? "block" : "none";
  }

  function addKrSuffix(input) {
    const raw = input.value.replace(/\D/g, "");
    if (raw) input.value = formatNumberDK(raw) + " kr.";
  }

  function removeKrSuffix(input) {
    const raw = input.value.replace(/\D/g, "");
    input.value = raw ? formatNumberDK(raw) : "";
  }

  document.querySelectorAll(".number-input").forEach((input) => {
    input.addEventListener("focus", () => removeKrSuffix(input));
    input.addEventListener("input", () => removeKrSuffix(input));
    input.addEventListener("blur",  () => addKrSuffix(input));
  });

  if (rentalSelect) {
    rentalSelect.addEventListener("change", toggleRentalInfo);
    toggleRentalInfo();
  }

  // ── Foreslå realkreditlån ud fra købs- og egenkapital ───────────
  const koebsPrisInput          = document.getElementById("koebsPris");
  const egenkapitalInput        = document.getElementById("egenkapital");
  const advokatInput            = document.getElementById("advokat");
  const tinglysningInput        = document.getElementById("tinglysning");
  const koeberRaadgivningInput  = document.getElementById("koeberRaadgivning");
  const andreOmkostningerInput  = document.getElementById("andreOmkostninger");
  const mortgageInput           = document.getElementById("mortgage");
  const driftsOmkostningerInput = document.getElementById("driftsOmkostninger");

  function getNumber(input) { return parseNumber(input?.value); }

  function updateMortgagePlaceholder() {
    if (!koebsPrisInput || !egenkapitalInput || !mortgageInput) return;
    const koebsPris   = getNumber(koebsPrisInput);
    const egenkapital = getNumber(egenkapitalInput);
    const maxRealkredit = Math.floor(koebsPris * 0.8);
    const foreslaaet    = Math.min(koebsPris - egenkapital, maxRealkredit);

    mortgageInput.placeholder = koebsPris > 0 && foreslaaet > 0
      ? `${foreslaaet.toLocaleString("da-DK")} kr. (maks 80% af kpris)`
      : "Realkreditlån";

    // Vis hint om banklån hvis egenkapital er under 20% af købsprisen
    const bankLoanHint = document.getElementById("bankLoanHint");
    if (bankLoanHint) {
      bankLoanHint.style.display = koebsPris > 0 && egenkapital < koebsPris * 0.2
        ? "block" : "none";
    }
  }

  [koebsPrisInput, egenkapitalInput, advokatInput, tinglysningInput,
   koeberRaadgivningInput, andreOmkostningerInput, driftsOmkostningerInput].forEach(input => {
    if (input) input.addEventListener("input", updateMortgagePlaceholder);
  });

  // ── Åbn/luk formular ────────────────────────────────────────────
  const createCaseBtn = document.getElementById("openFormButton-investeringscase");
  const inputSection  = document.querySelector(".input-section-investeringscase");
  if (createCaseBtn && inputSection) {
    createCaseBtn.addEventListener("click", () => {
      const open = inputSection.style.display === "block";
      inputSection.style.display = open ? "none" : "block";
      createCaseBtn.textContent  = open ? "Opret ny investeringscase" : "Luk form";
    });
  }

  // ── Lånefelter: vis/skjul detaljer + live ydelsesberegning ──────
  const realKreditInput  = document.getElementById("mortgage");
  const bankLoanInput    = document.getElementById("bankLoan");
  const otherLoansInput  = document.getElementById("otherLoans");

  const mortgageDetails  = document.getElementById("mortgageDetails-realkredit");
  const bankLoanDetails  = document.getElementById("mortgageDetails-bankLoan");
  const otherLoansDetails = document.getElementById("mortgageDetails-otherLoans");

  const mortgageType     = document.getElementById("mortgageType");
  const mortgageInterest = document.getElementById("mortgageInterest");
  const mortgageTerm     = document.getElementById("mortgageTerm");

  const bankLoanType     = document.getElementById("bankLoanType");
  const bankLoanInterest = document.getElementById("bankLoanInterest");
  const bankLoanTerm     = document.getElementById("bankLoanTerm");

  const otherLoansType     = document.getElementById("otherLoansType");
  const otherLoansInterest = document.getElementById("otherLoansInterest");
  const otherLoansTerm     = document.getElementById("otherLoansTerm");

  function toggleLoanSection(inputField, detailSection, fields) {
    if (!inputField || !detailSection || !fields) return;
    const value = parseNumber(inputField.value);
    if (!isNaN(value) && value > 0) {
      detailSection.style.display = "block";
      fields.forEach(f => { if (f) f.required = true; });
    } else {
      detailSection.style.display = "none";
      fields.forEach(f => { if (f) { f.required = false; f.value = ""; } });
    }
  }

  function updateLoanSections() {
    toggleLoanSection(realKreditInput, mortgageDetails, [mortgageType, mortgageInterest, mortgageTerm]);
    toggleLoanSection(bankLoanInput,   bankLoanDetails,  [bankLoanType, bankLoanInterest, bankLoanTerm]);
    toggleLoanSection(otherLoansInput, otherLoansDetails,[otherLoansType, otherLoansInterest, otherLoansTerm]);
  }

  // Live ydelsesberegning for alle tre lån
  function refreshAlleYdelser() {
    opdaterYdelseDisplay("mortgage",   "mortgageInterest",   "mortgageTerm",   "mortgageAfdragsFri",  "mortgageYdelseVis",  "mortgageRenteYdelse",  "mortgageAmortYdelse");
    opdaterYdelseDisplay("bankLoan",   "bankLoanInterest",   "bankLoanTerm",   "bankLoanAfdragsFri",  "bankLoanYdelseVis",  "bankLoanRenteYdelse",  "bankLoanAmortYdelse");
    opdaterYdelseDisplay("otherLoans", "otherLoansInterest", "otherLoansTerm", "otherLoansAfdragsFri","otherLoansYdelseVis","otherLoansRenteYdelse","otherLoansAmortYdelse");
  }

  [realKreditInput, bankLoanInput, otherLoansInput].forEach(el => {
    if (el) el.addEventListener("input", updateLoanSections);
  });

  // Opdater ydelser når rente/løbetid/afdragsfri ændres
  [
    "mortgageInterest","mortgageTerm","mortgageAfdragsFri",
    "bankLoanInterest","bankLoanTerm","bankLoanAfdragsFri",
    "otherLoansInterest","otherLoansTerm","otherLoansAfdragsFri",
    "mortgage","bankLoan","otherLoans"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", refreshAlleYdelser);
  });

  updateLoanSections();
  refreshAlleYdelser();

  // ── Renovering: dynamiske felter ────────────────────────────────
  const renovationContainer = document.getElementById("renovationContainer");
  const addRenovationBtn    = document.getElementById("addRenovationBtn");

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
      <div class="form-group">
        <label>Forventet varighed (måneder):</label>
        <input type="number" class="renovation-duration" min="1" placeholder="fx 3">
      </div>
      <button type="button" class="remove-renovation-btn">Fjern renovering</button>
      <hr>
    `;
    renovationDiv.querySelector(".remove-renovation-btn").addEventListener("click", () => renovationDiv.remove());
    renovationContainer.appendChild(renovationDiv);
  }

  if (addRenovationBtn) addRenovationBtn.addEventListener("click", createRenovationField);

  // ── Investeringsform submit ──────────────────────────────────────
  const investmentForm            = document.getElementById("investmentForm");
  const investeringscaseMessage   = document.getElementById("investeringscaseMessage");

  if (investmentForm) {
    investmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!investmentForm.reportValidity()) return;

      const rentalValue = document.getElementById("rental")?.value;
      const udlejes     = rentalValue === "true";

      const renovations = Array.from(document.querySelectorAll(".renovation-item"))
        .map(item => ({
          navn:              item.querySelector(".renovation-name")?.value.trim(),
          beskrivelse:       item.querySelector(".renovation-description")?.value.trim(),
          pris:              parseNumber(item.querySelector(".renovation-price")?.value),
          planlagtStartDato: item.querySelector(".renovation-start-date")?.value || null,
          varighedMaaneder:  Number(item.querySelector(".renovation-duration")?.value) || null
        }))
        .filter(r => r.navn || r.pris > 0);

      // Rente hentes med parseFloat (ikke parseNumber) for at bevare decimaler
      const realkreditRente  = parseFloat(document.getElementById("mortgageInterest")?.value  || "0") / 100;
      const bankLaanRente    = parseFloat(document.getElementById("bankLoanInterest")?.value   || "0") / 100;
      const andreLaanRente   = parseFloat(document.getElementById("otherLoansInterest")?.value || "0") / 100;

      const opdateretCase = {
        id:              editCaseId,
        ejendomsProfilID: Number(new URLSearchParams(window.location.search).get("id")),
        navn:            document.getElementById("investmentName")?.value.trim(),
        beskrivelse:     document.getElementById("description")?.value.trim() || "",
        koebsPris:       parseNumber(document.getElementById("koebsPris")?.value),
        egenKapital:     parseNumber(document.getElementById("egenkapital")?.value),
        advokat:         parseNumber(document.getElementById("advokat")?.value),
        tinglysning:     parseNumber(document.getElementById("tinglysning")?.value),
        koeberRaadgivning: parseNumber(document.getElementById("koeberRaadgivning")?.value),
        andreOmkostninger: parseNumber(document.getElementById("andreOmkostninger")?.value),
        driftsOmkostninger: parseNumber(document.getElementById("driftsOmkostninger")?.value),
        renovations,

        realkreditlån: parseNumber(document.getElementById("mortgage")?.value) > 0 ? {
          beløb:            parseNumber(document.getElementById("mortgage")?.value),
          type:             document.getElementById("mortgageType")?.value,
          rente:            realkreditRente,
          løbetid:          Number(document.getElementById("mortgageTerm")?.value),
          afdragsFriMåneder: Number(document.getElementById("mortgageAfdragsFri")?.value || "0")
        } : null,

        banklån: parseNumber(document.getElementById("bankLoan")?.value) > 0 ? {
          beløb:            parseNumber(document.getElementById("bankLoan")?.value),
          type:             document.getElementById("bankLoanType")?.value,
          rente:            bankLaanRente,
          løbetid:          Number(document.getElementById("bankLoanTerm")?.value),
          afdragsFriMåneder: Number(document.getElementById("bankLoanAfdragsFri")?.value || "0")
        } : null,

        andrelån: parseNumber(document.getElementById("otherLoans")?.value) > 0 ? {
          beløb:            parseNumber(document.getElementById("otherLoans")?.value),
          type:             document.getElementById("otherLoansType")?.value,
          rente:            andreLaanRente,
          løbetid:          Number(document.getElementById("otherLoansTerm")?.value),
          afdragsFriMåneder: Number(document.getElementById("otherLoansAfdragsFri")?.value || "0")
        } : null,

        udlejning: {
          udlejes,
          månedligLeje:     udlejes ? parseNumber(document.getElementById("rentalIncome")?.value)   : 0,
          månedligUdgifter: udlejes ? parseNumber(document.getElementById("rentalExpenses")?.value) : 0
        }
      };

      // Backend-payload — rente sendes som procent (backend dividerer ikke selv)
      const backendPayload = {
        ejendomsProfilID:  opdateretCase.ejendomsProfilID,
        caseNavn:          opdateretCase.navn,
        beskrivelse:       opdateretCase.beskrivelse,
        simuleringsAar:    30,

        koebsPris:         opdateretCase.koebsPris,
        egenKapital:       opdateretCase.egenKapital,
        advokat:           opdateretCase.advokat,
        tinglysning:       opdateretCase.tinglysning,
        koeberRaadgivning: opdateretCase.koeberRaadgivning,
        andreOmkostninger: opdateretCase.andreOmkostninger,
        renovations:       opdateretCase.renovations,
        driftsOmkostninger: opdateretCase.driftsOmkostninger,

        laaneBeloeb:       opdateretCase.realkreditlån?.beløb    || 0,
        laaneType:         opdateretCase.realkreditlån?.type     || "",
        rente:             realkreditRente * 100,
        loebetid:          opdateretCase.realkreditlån?.løbetid  || 0,

        bankLaan:          opdateretCase.banklån?.beløb          || 0,
        bankLaanType:      opdateretCase.banklån?.type           || "",
        bankLaanRente:     bankLaanRente * 100,
        bankLaanLoebetid:  opdateretCase.banklån?.løbetid        || 0,

        andreLaan:         opdateretCase.andrelån?.beløb         || 0,
        andreLaanType:     opdateretCase.andrelån?.type          || "",
        andreLaanRente:    andreLaanRente * 100,
        andreLaanLoebetid: opdateretCase.andrelån?.løbetid       || 0,

        udlejning:         String(udlejes),
        udlejningIndkomst: opdateretCase.udlejning.månedligLeje,
        udlejningUdgifter: opdateretCase.udlejning.månedligUdgifter
      };

      // Låndata der gemmes lokalt (inkl. decimale renter og afdragsfri)
      const lånDataTilStorage = {
        realkreditlån: opdateretCase.realkreditlån,
        banklån:       opdateretCase.banklån,
        andrelån:      opdateretCase.andrelån,
        driftsOmkostninger: opdateretCase.driftsOmkostninger
      };

      if (isEditMode) {
        try {
          const response = await fetch(`/api/v1/investment-cases/${editCaseId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(backendPayload)
          });
          const result = await response.json();
          if (!response.ok) { alert(result.message || "Kunne ikke gemme ændringer."); return; }

          localStorage.setItem(`invCase_loans_${editCaseId}`, JSON.stringify(lånDataTilStorage));
          window.location.href = `/investeringscase.html?id=${editCaseId}`;
        } catch (error) {
          console.error("Fejl ved opdatering:", error);
          alert("Kunne ikke forbinde til serveren.");
        }
        return;
      }

      try {
        const response = await fetch("/api/v1/investment-cases", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(backendPayload)
        });
        const result = await response.json();

        if (response.ok) {
          const caseID = result.data.investeringsCaseID;
          localStorage.setItem(`invCase_loans_${caseID}`, JSON.stringify(lånDataTilStorage));

          if (investeringscaseMessage) {
            investeringscaseMessage.textContent = "Case oprettet! Åbner casen om lidt...";
            investeringscaseMessage.style.color = "green";
          }
          setTimeout(() => { window.location.href = `/investeringscase.html?id=${caseID}`; }, 1500);
        } else {
          if (investeringscaseMessage) {
            investeringscaseMessage.textContent = result.message || "Kunne ikke oprette case.";
            investeringscaseMessage.style.color = "red";
          }
        }
      } catch (error) {
        console.error("Fejl ved oprettelse af case:", error);
        alert("Kunne ikke forbinde til serveren.");
      }
    });
  }
});
