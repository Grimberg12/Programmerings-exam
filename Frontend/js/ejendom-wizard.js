// ejendom-wizard.js
// Styrer wizard-navigationen på ejendom.html og viser valideringsbeskeder
// Deler formularen op i 5 trin så det er nemmere for brugeren at udfylde

class InvesteringWizard {
  // Private variabler med # foran - kan kun bruges inde i denne klasse
  #currentStep = 1;
  #totalSteps = 5;
  #finansieringAdvaret = false;

  constructor() {
    // Henter de elementer vi skal bruge fra DOM'en
    this.form       = document.getElementById("investmentForm");
    this.nextBtn    = document.getElementById("wizardNextBtn");
    this.prevBtn    = document.getElementById("wizardPrevBtn");
    this.subtitleEl = document.getElementById("wizardStepSubtitle");

    // Tjekker at vi er på ejendom.html, ellers gør vi ingenting
    if (!this.form) return;

    // Sætter klik-events på Næste og Tilbage
    this.#bindNavigation();

    // Sætter valideringslyttere på alle inputfelter i formularen
    this.#opsaetValideringsListeners();

    // Sørger for at progress bar og knapper viser trin 1 fra start
    this.#opdaterProgress();
    this.#opdaterKnapper();
  }

  // Springer direkte til et bestemt trin-nummer
  // Bruges af DOMContentLoaded nedenfor til at synkronisere edit-mode tekst
  goToStep(n) {
    // Skjuler det nuværende trin
    const fraTrin = this.#getTrinElement(this.#currentStep);
    if (fraTrin) fraTrin.hidden = true;

    // Viser det nye trin
    const tilTrin = this.#getTrinElement(n);
    if (tilTrin) tilTrin.hidden = false;

    this.#currentStep = n;
    this.#opdaterProgress();
    this.#opdaterKnapper();
    this.#scrollTilFormular();

    // Når brugeren når trin 4, tjekker vi straks om finansieringen passer med købsprisen
    // På det tidspunkt er trin 2 allerede udfyldt, så vi har tallene
    if (n === 4) this.#tjekFinansieringBalance();
  }

  // Går et trin frem - validerer det nuværende trin inden vi skifter
  next() {
    // Stopper hvis der er tomme required felter i det nuværende trin
    if (!this.#validerNuvaaerendeTrin()) return;

    // På trin 4 - spørg brugeren hvis finansiering ikke stemmer med købspris
    if (!this.#bekraeftFinansiering()) return;

    if (this.#currentStep < this.#totalSteps) {
      this.goToStep(this.#currentStep + 1);
    }
  }

  // Tjekker finansieringsbalance inden vi går videre fra trin 4
  // Første klik - opdaterer advarslen og blokerer
  // Andet klik uden ændringer - lader brugeren gå videre
  #bekraeftFinansiering() {
    if (this.#currentStep !== 4) return true;

    const parseVal = (id) => {
      const el = document.getElementById(id);
      return Number(el?.value.replace(/\D/g, "") || 0);
    };

    const koebsPris    = parseVal("koebsPris");
    const egenkapital  = parseVal("egenkapital");
    const realkredit   = parseVal("mortgage");
    const bankLaan     = parseVal("bankLoan");
    const andreLaan    = parseVal("otherLoans");
    const finansiering = egenkapital + realkredit + bankLaan + andreLaan;

    if (koebsPris === 0 || finansiering === 0 || finansiering === koebsPris) {
      this.#finansieringAdvaret = false;
      return true;
    }

    if (this.#finansieringAdvaret) {
      // Brugeren har set advarslen og trykker Næste igen - lad dem gå videre
      this.#finansieringAdvaret = false;
      return true;
    }

    // Første klik med mismatch - vis advarsel og bloker
    this.#finansieringAdvaret = true;
    const trin4 = this.#getTrinElement(4);
    let advarsel = trin4?.querySelector(".finansiering-advarsel");
    if (!advarsel) {
      advarsel = document.createElement("div");
      advarsel.className = "finansiering-advarsel";
      trin4?.querySelector(".form-section")?.prepend(advarsel);
    }
    const forskel = Math.abs(koebsPris - finansiering).toLocaleString("da-DK");
    advarsel.textContent =
      `Er du sikker? Din finansiering (${finansiering.toLocaleString("da-DK")} kr.) ` +
      `svarer ikke til din købspris (${koebsPris.toLocaleString("da-DK")} kr.) — ` +
      `${forskel} kr. i difference. Tryk Næste igen for at fortsætte alligevel.`;
    return false;
  }

  // Går et trin tilbage - ingen validering, brugeren må gerne rette data
  prev() {
    if (this.#currentStep > 1) {
      this.goToStep(this.#currentStep - 1);
    }
  }

  // Getter så andre scripts kan aflæse nuværende trin hvis det skulle blive nødvendigt
  get currentStep() {
    return this.#currentStep;
  }

  // Bruges til at sætte teksten på submit-knappen
  // I edit-mode kalder vi denne med "Gem ændringer" i stedet for "Opret investeringscase"
  setSubmitLabel(label) {
    // Gemmer label som data-attribut på formularen så den huskes ved trin-skift
    this.form.dataset.submitLabel = label;

    // Hvis vi allerede er på trin 5, ændres knappteksten med det samme
    if (this.#currentStep === this.#totalSteps && this.nextBtn) {
      this.nextBtn.textContent = label;
    }
  }

  // ----- Valideringslogik - viser popup-beskeder ved ugyldigt input -----

  // Tilknytter event listeners til alle relevante felter i formularen
  // Hver felttype har sin egen logik for hvornår og hvad der vises
  #opsaetValideringsListeners() {

    // --- DKK-beløb felter (class="number-input") ---
    // Disse felter må kun indeholde tal - bogstaver skal give en popup
    // ejendom.js fjerner bogstaver stille, så vi fanger dem på keydown inden de slettes
    this.form.querySelectorAll(".number-input").forEach(input => {

      input.addEventListener("keydown", (e) => {
        // Tjekker om det er en synlig karakter (length === 1) og ikke et tal eller genvej
        const erSynligKarakter = e.key.length === 1;
        const erTal = /\d/.test(e.key);
        const erGenvej = e.ctrlKey || e.metaKey;

        // Hvis brugeren taster et bogstav eller symbol vises en popup-hint
        if (erSynligKarakter && !erTal && !erGenvej) {
          this.#visPopup(input, "Kun tal er tilladt her");
          // Beskeden forsvinder automatisk efter 2 sekunder
          clearTimeout(input._valTimeout);
          input._valTimeout = setTimeout(() => this.#skjulPopup(input), 2000);
        }
      });

      // Fjerner popup med det samme når brugeren begynder at taste gyldige tal
      input.addEventListener("input", () => {
        const renVaerdi = input.value.replace(/\D/g, "");
        if (renVaerdi !== "" || !input.hasAttribute("required")) {
          this.#skjulPopup(input);
        }
        // Opdaterer finansieringsbalancen løbende når beløb ændres
        // Nulstiller bekræftelsesflag så advarslen vises igen ved næste klik
        this.#finansieringAdvaret = false;
        this.#tjekFinansieringBalance();
      });

      // Tjekker om et required felt er tomt når brugeren forlader det
      // Tal-felter viser "Skal minimum være 0" fordi det altid er et beløb der forventes
      input.addEventListener("blur", () => {
        const erTom = input.value.replace(/\D/g, "") === "";
        if (input.hasAttribute("required") && erTom) {
          this.#visPopup(input, "Skal minimum være 0");
        }
        // Tjekker også balance ved blur - måske er koebsPris netop udfyldt
        this.#tjekFinansieringBalance();
      });

      // Fjerner popup når brugeren klikker ind i feltet igen
      input.addEventListener("focus", () => this.#skjulPopup(input));
    });

    // --- Tal-inputs med type="number" (rente og løbetid på lån) ---
    // Browseren blokerer selv bogstaver, men vi tjekker for negative tal og urealistiske værdier
    this.form.querySelectorAll("input[type='number']").forEach(input => {

      input.addEventListener("blur", () => {
        // Feltet er tomt - ingen besked nødvendig
        if (input.value === "") return;

        const vaerdi = parseFloat(input.value);

        if (isNaN(vaerdi)) {
          this.#visPopup(input, "Skal være et tal");
          return;
        }

        if (vaerdi < 0) {
          this.#visPopup(input, "Skal minimum være 0");
          return;
        }

        // Rente-felterne bør ikke overstige 100 procent
        if (input.name.toLowerCase().includes("interest") && vaerdi > 100) {
          this.#visPopup(input, "Renten kan ikke overstige 100%");
          return;
        }

        // Løbetid bør være realistisk - over 0 og max 600 måneder (50 år)
        if (input.name.toLowerCase().includes("term")) {
          if (vaerdi <= 0) {
            this.#visPopup(input, "Løbetiden skal være mere end 0");
            return;
          }
          if (vaerdi > 600) {
            this.#visPopup(input, "Løbetiden er usandsynlig høj");
            return;
          }
        }

        // Alt er i orden - fjern eventuel gammel popup
        this.#skjulPopup(input);
      });

      input.addEventListener("focus", () => this.#skjulPopup(input));
    });

    // --- Tekst-inputs og textarea med required (Navn og Beskrivelse på trin 1) ---
    // Viser besked hvis brugeren forlader feltet uden at udfylde det
    this.form.querySelectorAll("input[type='text']:not(.number-input)[required], textarea[required]").forEach(input => {

      input.addEventListener("blur", () => {
        if (input.value.trim() === "") {
          this.#visPopup(input, "Feltet er påkrævet");
        }
      });

      // Fjerner beskeden med det samme når brugeren begynder at skrive
      input.addEventListener("input", () => {
        if (input.value.trim() !== "") {
          this.#skjulPopup(input);
        }
      });
    });

    // --- Dropdowns med required (fx "Udlejer du ejendommen?") ---
    // Viser besked hvis brugeren klikker væk uden at vælge en mulighed
    this.form.querySelectorAll("select[required]").forEach(select => {

      select.addEventListener("blur", () => {
        if (select.value === "") {
          this.#visPopup(select, "Vælg venligst en mulighed");
        }
      });

      // Fjerner beskeden med det samme når brugeren vælger noget
      select.addEventListener("change", () => {
        if (select.value !== "") {
          this.#skjulPopup(select);
        }
      });
    });
  }

  // Tjekker om egenkapital + alle lån svarer til købsprisen
  // Viser en gul advarselsboks øverst i trin 4 hvis tallene ikke går op
  // Det er en advarsel og ikke en blokering - brugeren kan stadig gå videre
  #tjekFinansieringBalance() {
    // Hjælpefunktion til at parse DKK-felter - fjerner "kr.", mellemrum og punktum
    const parseVal = (id) => {
      const el = document.getElementById(id);
      return Number(el?.value.replace(/\D/g, "") || 0);
    };

    const koebsPris   = parseVal("koebsPris");
    const egenkapital = parseVal("egenkapital");
    const realkredit  = parseVal("mortgage");
    const bankLaan    = parseVal("bankLoan");
    const andreLaan   = parseVal("otherLoans");

    // Samlet finansiering = hvad brugeren har angivet de betaler med
    const finansiering = egenkapital + realkredit + bankLaan + andreLaan;

    // Finder trin 4 hvor advarslen skal vises
    const trin4 = this.#getTrinElement(4);
    if (!trin4) return;

    // Finder eller opretter advarselsboksen - vi laver max én ad gangen
    let advarsel = trin4.querySelector(".finansiering-advarsel");

    // Vis kun advarsel hvis begge tal er større end 0 og ikke matcher hinanden
    // Hvis et af beløbene er 0, er brugeren sandsynligvis stadig i gang med at udfylde
    if (koebsPris > 0 && finansiering > 0 && finansiering !== koebsPris) {
      if (!advarsel) {
        advarsel = document.createElement("div");
        advarsel.className = "finansiering-advarsel";
        // Indsæt øverst i form-section på trin 4 så brugeren ser det med det samme
        trin4.querySelector(".form-section")?.prepend(advarsel);
      }
      // Viser de konkrete tal så brugeren nemt kan se hvad der mangler
      const forskel = koebsPris - finansiering;
      const forskelTekst = forskel > 0
        ? `${forskel.toLocaleString("da-DK")} kr. mangler`
        : `${Math.abs(forskel).toLocaleString("da-DK")} kr. for meget`;

      advarsel.textContent =
        `Er du sikker? Finansiering (${finansiering.toLocaleString("da-DK")} kr.) ≠ Købspris (${koebsPris.toLocaleString("da-DK")} kr.) - ${forskelTekst}`;

    } else {
      // Tallene passer - fjern advarslen hvis den er der
      if (advarsel) advarsel.remove();
    }
  }

  // Opretter og viser en rød popup-besked direkte over det givne felt
  // Indsættes som element lige før input-feltet inde i form-group
  #visPopup(felt, tekst) {
    // Fjerner evt. eksisterende popup for dette felt inden vi laver en ny
    this.#skjulPopup(felt);

    const popup = document.createElement("div");
    popup.className = "validerings-popup";
    popup.textContent = tekst;

    // Indsæt lige før inputfeltet - vil visuelt fremstå over det
    felt.parentElement.insertBefore(popup, felt);
  }

  // Fjerner popup-beskeden for det givne felt hvis den er der
  #skjulPopup(felt) {
    const eksisterende = felt.parentElement?.querySelector(".validerings-popup");
    if (eksisterende) eksisterende.remove();
  }

  // ----- Resten af wizard-logikken -----

  // Returnerer det div-element der svarer til et bestemt trin-nummer
  #getTrinElement(n) {
    return this.form.querySelector(`.wizard-step[data-step="${n}"]`);
  }

  // Gennemgår alle required felter i det nuværende trin og validerer dem
  // Bruger vores egne popups i stedet for browserens standard-boble
  // Returnerer true hvis alle felter er korrekt udfyldt
  #validerNuvaaerendeTrin() {
    const trinElement = this.#getTrinElement(this.#currentStep);
    if (!trinElement) return true;

    let foersteUgyldigt = null;
    let altGyldig = true;

    trinElement.querySelectorAll("[required]").forEach(felt => {
      // Tjekker om feltet er tomt - afhænger af felttype
      let erTom;
      if (felt.classList.contains("number-input")) {
        erTom = felt.value.replace(/\D/g, "") === "";
      } else if (felt.tagName === "SELECT") {
        erTom = felt.value === "";
      } else {
        erTom = felt.value.trim() === "";
      }

      if (!erTom) return;

      // Vælger besked baseret på felttype
      let besked;
      if (felt.classList.contains("number-input")) {
        besked = "Skriv 0 hvis det skal være tomt";
      } else if (felt.tagName === "SELECT") {
        besked = "Vælg venligst en mulighed";
      } else {
        besked = "Feltet er påkrævet";
      }

      this.#visPopup(felt, besked);
      if (!foersteUgyldigt) foersteUgyldigt = felt;
      altGyldig = false;
    });

    // Scroller til og fokuserer det første ugyldige felt
    if (foersteUgyldigt) {
      foersteUgyldigt.scrollIntoView({ behavior: "smooth", block: "center" });
      foersteUgyldigt.focus();
    }

    return altGyldig;
  }

  // Opdaterer progress baren - markerer aktive og gennemførte trin med CSS klasser
  // Henter trin-titlen fra data-title attributten i HTML, så den kun defineres ét sted
  #opdaterProgress() {
    document.querySelectorAll(".wizard-step-item").forEach(item => {
      const trinNummer = Number(item.dataset.step);

      // Fjerner eksisterende klasser og sætter den rigtige baseret på position
      item.classList.remove("active", "completed");

      if (trinNummer === this.#currentStep) {
        item.classList.add("active");
      } else if (trinNummer < this.#currentStep) {
        item.classList.add("completed");
      }
    });

    // Henter titelnavnet fra data-title på det aktive trin i HTML - én kilde til sandhed
    const aktivtItem = document.querySelector(`.wizard-step-item[data-step="${this.#currentStep}"]`);
    const trinTitel = aktivtItem?.dataset.title ?? "";

    if (this.subtitleEl) {
      this.subtitleEl.textContent = `Trin ${this.#currentStep} af ${this.#totalSteps} - ${trinTitel}`;
    }
  }

  // Opdaterer Tilbage og Næste knapperne afhængigt af hvilket trin vi er på
  #opdaterKnapper() {
    if (!this.prevBtn || !this.nextBtn) return;

    // Trin 1 - skjuler Tilbage, men bevarer plads i layoutet med visibility
    this.prevBtn.style.visibility = this.#currentStep === 1 ? "hidden" : "visible";

    // Trin 5 - Næste skifter til en submit-knap så ejendom.js' submit-handler tager over
    // Teksten hentes fra data-submitLabel hvis den er sat (fx "Gem ændringer" i edit-mode)
    if (this.#currentStep === this.#totalSteps) {
      const label = this.form.dataset.submitLabel ?? "Opret investeringscase";
      this.nextBtn.textContent = label;
      this.nextBtn.type = "submit";
    } else {
      this.nextBtn.textContent = "Næste →";
      this.nextBtn.type = "button";
    }
  }

  // Scroller op til toppen af formularen når brugeren skifter trin
  // Uden dette kan brugeren ende med at se et tomt trin midt på siden
  #scrollTilFormular() {
    const sektion = document.getElementById("inputSectionInvesteringscase");
    if (sektion) {
      sektion.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Tilknytter klik-events til Næste og Tilbage knapperne
  #bindNavigation() {
    this.nextBtn?.addEventListener("click", (e) => {
      // Trin 1-4 - forhindrer browser-submit og navigerer til næste trin
      // Trin 5 - knappen er type="submit", ejendom.js' submit-handler tager over
      if (this.#currentStep < this.#totalSteps) {
        e.preventDefault();
        this.next();
      }
    });

    this.prevBtn?.addEventListener("click", () => this.prev());
  }
}

// Starter wizarden når DOM'en er klar
// Loades efter ejendom.js, så vi kan læse om edit-mode er aktiveret
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("investmentForm")) return;

  window.wizard = new InvesteringWizard();

  // Tjekker om ejendom.js har sat "Gem ændringer" på den skjulte submit-knap
  // Det sker i edit-mode, og vi synkroniserer teksten til wizard-knappen
  const skjultSubmitKnap = document.getElementById("submitFormButton-investeringscase");
  const editTekst = skjultSubmitKnap?.textContent?.trim();

  if (editTekst && editTekst !== "") {
    window.wizard.setSubmitLabel(editTekst);
  }
});
