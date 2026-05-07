// ejendom-wizard.js
// Styrer wizard navigationen på ejendom.html og viser valideringsbeskeder
// Formularen er delt op i 5 trin, så brugeren ikke skal udfylde alt på en gang
// Denne version bruger almindelig JavaScript uden private felter med #
// Det gør koden nemmere at forklare til eksamen

class InvesteringWizard {
  constructor() {
    /*
      Her gemmer vi de vigtigste værdier for wizarden.

      currentStep fortæller hvilket trin brugeren er på lige nu.
      totalSteps fortæller hvor mange trin formularen har i alt.
      finansieringAdvaret bruges til at huske om brugeren allerede har set advarslen om finansiering.
    */
    this.currentStep = 1;
    this.totalSteps = 5;
    this.finansieringAdvaret = false;

    /*
      Her henter vi de HTML elementer, som wizarden skal arbejde med.

      investmentForm er selve formularen.
      wizardNextBtn er knappen brugeren trykker på for at gå videre.
      wizardPrevBtn er knappen brugeren trykker på for at gå tilbage.
      wizardStepSubtitle er teksten, som viser hvilket trin brugeren er på.
    */
    this.form = document.getElementById("investmentForm");
    this.nextBtn = document.getElementById("wizardNextBtn");
    this.prevBtn = document.getElementById("wizardPrevBtn");
    this.subtitleEl = document.getElementById("wizardStepSubtitle");

    /*
      Hvis formularen ikke findes på siden, stopper vi her.
      Det gør, at filen godt kan være loaded på andre sider uden at give fejl.
    */
    if (!this.form) {
      return;
    }

    /*
      Her starter vi de dele af wizarden, som skal være klar fra starten.
    */
    this.bindNavigation();
    this.opsaetValideringsListeners();
    this.opdaterProgress();
    this.opdaterKnapper();
  }

  /*
    Denne metode skifter til et bestemt trin.

    Den bruges både når brugeren trykker Næste, når brugeren trykker Tilbage,
    og hvis et andet script vil sende brugeren direkte til et bestemt trin.
  */
  goToStep(n) {
    /*
      Vi tjekker først, at trin nummeret faktisk findes.
      Hvis nogen prøver at gå til trin 0 eller trin 6, gør vi ingenting.
    */
    if (n < 1 || n > this.totalSteps) {
      return;
    }

    /*
      Først finder vi det trin, som brugeren står på lige nu.
      Det trin skjuler vi.
    */
    var fraTrin = this.getTrinElement(this.currentStep);

    if (fraTrin) {
      fraTrin.hidden = true;
    }

    /*
      Derefter finder vi det nye trin.
      Det trin viser vi.
    */
    var tilTrin = this.getTrinElement(n);

    if (tilTrin) {
      tilTrin.hidden = false;
    }

    /*
      Nu opdaterer vi currentStep, så klassen ved hvilket trin brugeren er på.
    */
    this.currentStep = n;

    /*
      Når trinnet er ændret, skal progress baren, knapperne og scroll også opdateres.
    */
    this.opdaterProgress();
    this.opdaterKnapper();
    this.scrollTilFormular();

    /*
      Når brugeren kommer til trin 4, tjekker vi om finansiering og købsomkostninger passer.
      Her opretter vi ikke en ny advarsel.
      Vi fjerner kun en gammel advarsel, hvis tallene nu passer.
    */
    if (n === 4) {
      this.tjekFinansieringBalance();
    }
  }

  /*
    Denne metode kaldes, når brugeren trykker på Næste.

    Først validerer vi felterne på det nuværende trin.
    Hvis noget mangler, bliver brugeren på samme trin.
  */
  next() {
    /*
      Hvis det nuværende trin ikke er gyldigt, stopper vi her.
    */
    if (!this.validerNuvaaerendeTrin()) {
      return;
    }

    /*
      Hvis brugeren er på trin 4, tjekker vi også finansieringen.
      Hvis der er forskel, får brugeren først en advarsel.
    */
    if (!this.bekraeftFinansiering()) {
      return;
    }

    /*
      Hvis brugeren ikke allerede er på sidste trin, går vi et trin frem.
    */
    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    }
  }

  /*
    Denne metode bruges kun ved klik på Næste fra trin 4.

    Hvis finansieringen passer med købsomkostningerne, får brugeren lov at gå videre.
    Hvis der er forskel, får brugeren først en advarsel.
    Hvis brugeren trykker Næste igen, får brugeren lov at gå videre alligevel.
  */
  bekraeftFinansiering() {
    /*
      Denne kontrol skal kun ske på trin 4.
      På alle andre trin returnerer vi true med det samme.
    */
    if (this.currentStep !== 4) {
      return true;
    }

    /*
      Hjælpefunktion som læser et beløb fra et inputfelt.

      Den fjerner alt andet end tal.
      Det gør, at feltet både kan indeholde 1000000 og 1.000.000 kr.
      Hvis feltet ikke findes, returnerer funktionen 0.
    */
    function parseVal(id) {
      var element = document.getElementById(id);

      if (!element || !element.value) {
        return 0;
      }

      return Number(element.value.replace(/\D/g, "") || 0);
    }

    /*
      Her henter vi alle felter, som indgår i købsomkostninger og finansiering.
    */
    var koebsPris = parseVal("koebsPris");
    var advokat = parseVal("advokat");
    var tinglysning = parseVal("tinglysning");
    var koeberRadg = parseVal("koeberRaadgivning");
    var andreOmk = parseVal("andreOmkostninger");

    var egenkapital = parseVal("egenkapital");
    var realkredit = parseVal("mortgage");
    var bankLaan = parseVal("bankLoan");
    var andreLaan = parseVal("otherLoans");

    /*
      Her lægger vi købsomkostningerne sammen.
      Driftsomkostninger er ikke med her, fordi de er løbende udgifter.
    */
    var totalKoebsOmk = koebsPris + advokat + tinglysning + koeberRadg + andreOmk;

    /*
      Her lægger vi finansieringen sammen.
      Det er de penge brugeren har angivet, at købet skal betales med.
    */
    var finansiering = egenkapital + realkredit + bankLaan + andreLaan;

    /*
      Hvis der ikke er noget at sammenligne, eller hvis tallene passer, går vi bare videre.
    */
    if (totalKoebsOmk === 0 || finansiering === 0 || finansiering === totalKoebsOmk) {
      this.finansieringAdvaret = false;
      return true;
    }

    /*
      Hvis brugeren allerede har set advarslen og trykker Næste igen,
      giver vi lov til at fortsætte.
    */
    if (this.finansieringAdvaret) {
      this.finansieringAdvaret = false;
      return true;
    }

    /*
      Første gang der er forskel, viser vi en advarsel og stopper brugeren.
    */
    this.finansieringAdvaret = true;

    var trin4 = this.getTrinElement(4);

    /*
      Hvis trin 4 ikke findes, kan vi ikke vise advarslen.
      I den situation stopper vi ikke brugeren.
    */
    if (!trin4) {
      return true;
    }

    /*
      Vi prøver først at finde en eksisterende advarsel.
      Hvis den ikke findes, opretter vi en ny.
    */
    var advarsel = trin4.querySelector(".finansiering-advarsel");

    if (!advarsel) {
      advarsel = document.createElement("div");
      advarsel.className = "finansiering-advarsel";

      /*
        appendChild placerer advarslen nederst i trin 4.
        Det gør, at beskeden kommer under formularens indhold.
      */
      trin4.appendChild(advarsel);
    }

    /*
      Her beregner vi forskellen.
      Hvis forskellen er positiv, mangler der penge.
      Hvis forskellen er negativ, er der angivet for meget finansiering.
    */
    var forskel = totalKoebsOmk - finansiering;
    var forskelTxt = "";

    if (forskel > 0) {
      forskelTxt = forskel.toLocaleString("da-DK") + " kr. mangler i finansiering";
    } else {
      forskelTxt = Math.abs(forskel).toLocaleString("da-DK") + " kr. for meget finansiering";
    }

    /*
      Her viser vi beskeden til brugeren.
      Brugeren kan stadig fortsætte, men skal trykke Næste en ekstra gang.
    */
    advarsel.innerHTML =
      "<strong>Er du sikker?</strong> Din samlede finansiering er " +
      "<strong>" + finansiering.toLocaleString("da-DK") + " kr.</strong>, men de samlede " +
      "købsomkostninger er <strong>" + totalKoebsOmk.toLocaleString("da-DK") + " kr.</strong>. " +
      "<em>" + forskelTxt + "</em>. Tryk Næste igen for at fortsætte alligevel.";

    return false;
  }

  /*
    Denne metode kaldes, når brugeren trykker på Tilbage.

    Vi validerer ikke når brugeren går tilbage.
    Brugeren skal altid have lov til at rette tidligere indtastninger.
  */
  prev() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  /*
    Denne metode ændrer teksten på knappen på sidste trin.

    Den bruges især ved edit mode, hvor knappen skal sige Gem ændringer
    i stedet for Opret investeringscase.
  */
  setSubmitLabel(label) {
    /*
      Vi gemmer teksten på formularens dataset.
      Så kan teksten bruges igen, når brugeren skifter trin.
    */
    this.form.dataset.submitLabel = label;

    /*
      Hvis brugeren allerede står på sidste trin, opdaterer vi teksten med det samme.
    */
    if (this.currentStep === this.totalSteps && this.nextBtn) {
      this.nextBtn.textContent = label;
    }
  }

  /*
    Denne metode sætter alle valideringslyttere op.

    Den kobler små funktioner på felterne, så brugeren får beskeder,
    når noget er tomt eller forkert indtastet.
  */
  opsaetValideringsListeners() {
    var self = this;

    /*
      Først finder vi alle beløbsfelter.
      De skal kun indeholde tal.
    */
    var beloebsFelter = this.form.querySelectorAll(".number-input");

    beloebsFelter.forEach(function(input) {
      /*
        keydown bruges til at opdage bogstaver og symboler,
        før de når at blive skrevet i feltet.
      */
      input.addEventListener("keydown", function(e) {
        var erSynligKarakter = e.key.length === 1;
        var erTal = /\d/.test(e.key);
        var erGenvej = e.ctrlKey || e.metaKey;

        /*
          Hvis brugeren skriver andet end tal, viser vi en kort besked.
        */
        if (erSynligKarakter && !erTal && !erGenvej) {
          self.visPopup(input, "Kun tal er tilladt her");

          clearTimeout(input._valTimeout);

          input._valTimeout = setTimeout(function() {
            self.skjulPopup(input);
          }, 2000);
        }
      });

      /*
        input event kører hver gang feltets værdi ændrer sig.
        Her fjerner vi popup beskeden, hvis feltet nu ser gyldigt ud.
      */
      input.addEventListener("input", function() {
        var renVaerdi = input.value.replace(/\D/g, "");

        if (renVaerdi !== "" || !input.hasAttribute("required")) {
          self.skjulPopup(input);
        }

        /*
          Når et beløb ændres, kan finansieringsbalancen også ændre sig.
          Derfor nulstiller vi advarslen og tjekker balancen igen.
        */
        self.finansieringAdvaret = false;
        self.tjekFinansieringBalance();
      });

      /*
        blur kører når brugeren forlader feltet.
        Hvis feltet er required og tomt, viser vi en besked.
      */
      input.addEventListener("blur", function() {
        var erTom = input.value.replace(/\D/g, "") === "";

        if (input.hasAttribute("required") && erTom) {
          self.visPopup(input, "Skal minimum være 0");
        }

        self.tjekFinansieringBalance();
      });

      /*
        Når brugeren klikker ind i feltet igen, fjerner vi popup beskeden.
      */
      input.addEventListener("focus", function() {
        self.skjulPopup(input);
      });
    });

    /*
      Her finder vi almindelige number felter.
      Det kan for eksempel være rente og løbetid.
    */
    var numberFelter = this.form.querySelectorAll("input[type='number']");

    numberFelter.forEach(function(input) {
      input.addEventListener("blur", function() {
        /*
          Hvis feltet er tomt, gør vi ingenting her.
          Required felter bliver fanget af trin valideringen.
        */
        if (input.value === "") {
          return;
        }

        var vaerdi = parseFloat(input.value);

        if (isNaN(vaerdi)) {
          self.visPopup(input, "Skal være et tal");
          return;
        }

        if (vaerdi < 0) {
          self.visPopup(input, "Skal minimum være 0");
          return;
        }

        /*
          Hvis feltets name indeholder interest, behandler vi det som et rentefelt.
        */
        if (input.name.toLowerCase().indexOf("interest") !== -1 && vaerdi > 100) {
          self.visPopup(input, "Renten kan ikke overstige 100%");
          return;
        }

        /*
          Hvis feltets name indeholder term, behandler vi det som løbetid.
        */
        if (input.name.toLowerCase().indexOf("term") !== -1) {
          if (vaerdi <= 0) {
            self.visPopup(input, "Løbetiden skal være mere end 0");
            return;
          }

          if (vaerdi > 600) {
            self.visPopup(input, "Løbetiden er usandsynlig høj");
            return;
          }
        }

        /*
          Hvis ingen fejl blev fundet, fjerner vi en eventuel gammel popup besked.
        */
        self.skjulPopup(input);
      });

      input.addEventListener("focus", function() {
        self.skjulPopup(input);
      });
    });

    /*
      Her finder vi tekstfelter og tekstområder, som er required.
      Det bruges for eksempel til navn og beskrivelse.
    */
    var tekstFelter = this.form.querySelectorAll("input[type='text']:not(.number-input)[required], textarea[required]");

    tekstFelter.forEach(function(input) {
      input.addEventListener("blur", function() {
        if (input.value.trim() === "") {
          self.visPopup(input, "Feltet er påkrævet");
        }
      });

      input.addEventListener("input", function() {
        if (input.value.trim() !== "") {
          self.skjulPopup(input);
        }
      });
    });

    /*
      Her finder vi dropdown felter, som er required.
      Hvis brugeren ikke har valgt noget, viser vi en besked.
    */
    var dropdowns = this.form.querySelectorAll("select[required]");

    dropdowns.forEach(function(select) {
      select.addEventListener("blur", function() {
        if (select.value === "") {
          self.visPopup(select, "Vælg venligst en mulighed");
        }
      });

      select.addEventListener("change", function() {
        if (select.value !== "") {
          self.skjulPopup(select);
        }
      });
    });
  }

  /*
    Denne metode tjekker om finansiering og købsomkostninger passer sammen.

    Den opretter ikke en ny advarsel.
    Den fjerner kun en eksisterende advarsel, hvis tallene nu passer.
  */
  tjekFinansieringBalance() {
    function parseVal(id) {
      var element = document.getElementById(id);

      if (!element || !element.value) {
        return 0;
      }

      return Number(element.value.replace(/\D/g, "") || 0);
    }

    var koebsPris = parseVal("koebsPris");
    var advokat = parseVal("advokat");
    var tinglysning = parseVal("tinglysning");
    var koeberRadg = parseVal("koeberRaadgivning");
    var andreOmk = parseVal("andreOmkostninger");

    var egenkapital = parseVal("egenkapital");
    var realkredit = parseVal("mortgage");
    var bankLaan = parseVal("bankLoan");
    var andreLaan = parseVal("otherLoans");

    var totalKoebsOmk = koebsPris + advokat + tinglysning + koeberRadg + andreOmk;
    var finansiering = egenkapital + realkredit + bankLaan + andreLaan;

    var trin4 = this.getTrinElement(4);

    if (!trin4) {
      return;
    }

    var advarsel = trin4.querySelector(".finansiering-advarsel");

    /*
      Hvis tallene passer, fjerner vi advarslen.
      Vi fjerner også advarslen hvis der endnu ikke er tal nok til at sammenligne.
    */
    if (totalKoebsOmk === 0 || finansiering === 0 || finansiering === totalKoebsOmk) {
      if (advarsel) {
        advarsel.remove();
      }

      this.finansieringAdvaret = false;
    }
  }

  /*
    Denne metode viser en popup besked over et bestemt felt.

    Den bruges både når et felt mangler, og når brugeren skriver noget ugyldigt.
  */
  visPopup(felt, tekst) {
    /*
      Hvis feltet ikke findes, eller feltet ikke har et parent element,
      kan vi ikke placere popup beskeden.
    */
    if (!felt || !felt.parentElement) {
      return;
    }

    /*
      Først fjerner vi en gammel popup besked, så der ikke kommer flere oven på hinanden.
    */
    this.skjulPopup(felt);

    var popup = document.createElement("div");
    popup.className = "validerings-popup";
    popup.textContent = tekst;

    /*
      Popup beskeden bliver sat lige før feltet.
      Det gør, at den visuelt ligger tæt på det felt, som fejlen handler om.
    */
    felt.parentElement.insertBefore(popup, felt);
  }

  /*
    Denne metode fjerner popup beskeden for et felt.
  */
  skjulPopup(felt) {
    if (!felt || !felt.parentElement) {
      return;
    }

    var eksisterende = felt.parentElement.querySelector(".validerings-popup");

    if (eksisterende) {
      eksisterende.remove();
    }
  }

  /*
    Denne metode finder HTML elementet for et bestemt wizard trin.
  */
  getTrinElement(n) {
    return this.form.querySelector('.wizard-step[data-step="' + n + '"]');
  }

  /*
    Denne metode validerer kun det trin, som brugeren står på lige nu.

    Den tjekker alle required felter i det aktive trin.
    Hvis et felt mangler, viser den en popup besked og stopper brugeren.
  */
  validerNuvaaerendeTrin() {
    var trinElement = this.getTrinElement(this.currentStep);

    if (!trinElement) {
      return true;
    }

    var foersteUgyldigt = null;
    var altGyldig = true;

    var requiredFelter = trinElement.querySelectorAll("[required]");

    requiredFelter.forEach(function(felt) {
      var erTom;

      /*
        Her tjekker vi om feltet er tomt.
        Det afhænger af hvilken type felt det er.
      */
      if (felt.classList.contains("number-input")) {
        erTom = felt.value.replace(/\D/g, "") === "";
      } else if (felt.tagName === "SELECT") {
        erTom = felt.value === "";
      } else {
        erTom = felt.value.trim() === "";
      }

      /*
        Hvis feltet ikke er tomt, går vi videre til næste felt.
      */
      if (!erTom) {
        return;
      }

      /*
        Her vælger vi den besked, som passer bedst til felttypen.
      */
      var besked;

      if (felt.classList.contains("number-input")) {
        besked = "Skriv 0 hvis det skal være tomt";
      } else if (felt.tagName === "SELECT") {
        besked = "Vælg venligst en mulighed";
      } else {
        besked = "Feltet er påkrævet";
      }

      this.visPopup(felt, besked);

      /*
        Vi gemmer det første ugyldige felt.
        Det bruger vi bagefter til at scrolle brugeren hen til fejlen.
      */
      if (!foersteUgyldigt) {
        foersteUgyldigt = felt;
      }

      altGyldig = false;
    }, this);

    /*
      Hvis der er et ugyldigt felt, scroller vi brugeren hen til det.
    */
    if (foersteUgyldigt) {
      foersteUgyldigt.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      foersteUgyldigt.focus();
    }

    return altGyldig;
  }

  /*
    Denne metode opdaterer progress baren.

    Den markerer det aktive trin.
    Den markerer også de trin, som brugeren allerede er kommet forbi.
  */
  opdaterProgress() {
    var items = document.querySelectorAll(".wizard-step-item");

    items.forEach(function(item) {
      var trinNummer = Number(item.dataset.step);

      /*
        Først fjerner vi de gamle klasser.
        Derefter tilføjer vi den klasse, som passer til det aktuelle trin.
      */
      item.classList.remove("active", "completed");

      if (trinNummer === this.currentStep) {
        item.classList.add("active");
      } else if (trinNummer < this.currentStep) {
        item.classList.add("completed");
      }
    }, this);

    /*
      Her finder vi titlen på det aktive trin.
      Titlen ligger i data title i HTML.
    */
    var aktivtItem = document.querySelector('.wizard-step-item[data-step="' + this.currentStep + '"]');
    var trinTitel = "";

    if (aktivtItem && aktivtItem.dataset && aktivtItem.dataset.title) {
      trinTitel = aktivtItem.dataset.title;
    }

    /*
      Her opdaterer vi teksten under overskriften.
    */
    if (this.subtitleEl) {
      this.subtitleEl.textContent = "Trin " + this.currentStep + " af " + this.totalSteps + ": " + trinTitel;
    }
  }

  /*
    Denne metode opdaterer Tilbage og Næste knapperne.

    På første trin skjuler vi Tilbage.
    På sidste trin bliver Næste knappen ændret til en submit knap.
  */
  opdaterKnapper() {
    if (!this.prevBtn || !this.nextBtn) {
      return;
    }

    /*
      På trin 1 skal brugeren ikke kunne gå tilbage.
      Vi bruger visibility, så layoutet ikke hopper.
    */
    if (this.currentStep === 1) {
      this.prevBtn.style.visibility = "hidden";
    } else {
      this.prevBtn.style.visibility = "visible";
    }

    /*
      På sidste trin skal knappen sende formularen.
      På de andre trin skal knappen bare skifte trin.
    */
    if (this.currentStep === this.totalSteps) {
      var label = "Opret investeringscase";

      if (this.form.dataset.submitLabel) {
        label = this.form.dataset.submitLabel;
      }

      this.nextBtn.textContent = label;
      this.nextBtn.type = "submit";
    } else {
      this.nextBtn.textContent = "Næste →";
      this.nextBtn.type = "button";
    }
  }

  /*
    Denne metode scroller op til formularen, når brugeren skifter trin.

    Det gør flowet mere overskueligt, fordi brugeren starter samme sted på hvert trin.
  */
  scrollTilFormular() {
    var sektion = document.getElementById("inputSectionInvesteringscase");

    if (sektion) {
      sektion.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  /*
    Denne metode sætter klik funktioner på Næste og Tilbage knapperne.
  */
  bindNavigation() {
    var self = this;

    /*
      Næste knappen har to forskellige roller.

      På trin 1 til trin 4 skifter den bare trin.
      På trin 5 er den en submit knap, så ejendom.js kan gemme formularen.
    */
    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", function(e) {
        if (self.currentStep < self.totalSteps) {
          e.preventDefault();
          self.next();
        }
      });
    }

    /*
      Tilbage knappen kalder bare prev metoden.
    */
    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", function() {
        self.prev();
      });
    }
  }
}

/*
  Her starter vi wizarden, når HTML siden er klar.

  Vi venter på DOMContentLoaded, så vi er sikre på,
  at formularen og knapperne findes i DOM'en.
*/
document.addEventListener("DOMContentLoaded", function() {
  /*
    Hvis formularen ikke findes på siden, skal der ikke startes en wizard.
  */
  if (!document.getElementById("investmentForm")) {
    return;
  }

  /*
    Vi lægger wizarden på window, så andre scripts kan bruge den.
    Det svarer til den måde din gamle kode gjorde det på.
  */
  window.wizard = new InvesteringWizard();

  /*
    Her tjekker vi om ejendom.js har sat tekst på den skjulte submit knap.
    Det bruges ved edit mode, hvor teksten for eksempel kan være Gem ændringer.
  */
  var skjultSubmitKnap = document.getElementById("submitFormButton-investeringscase");
  var editTekst = "";

  if (skjultSubmitKnap && skjultSubmitKnap.textContent) {
    editTekst = skjultSubmitKnap.textContent.trim();
  }

  /*
    Hvis der findes en tekst, sætter vi samme tekst på wizard knappen.
  */
  if (editTekst !== "") {
    window.wizard.setSubmitLabel(editTekst);
  }
});