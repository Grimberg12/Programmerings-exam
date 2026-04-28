// Hent elementer fra DOM
const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");
const suggestionsList = document.getElementById("suggestionsList");
const opretBtn = document.getElementById("opretEjendomBtn");

// Oversættes BBR-koder til læsbare betegnelser for ejendomstype
// Kilderne er Datafordeler BBR feltbeskrivelse for byg021BygningensAnvendelse
const BYGNINGSANVENDELSE = {
    110: "Stuehus til landbrugsejendom", 120: "Fritliggende enfamiliehus",
    121: "Sammenbygget enfamiliehus", 140: "Etageboligbebyggelse, flerfamiliehus",
    150: "Kollegium", 160: "Fritidshus", 190: "Anden helårsbeboelse",
};

// Gemmer den valgte adresse,
// så vi kan bruge den senere når brugeren klikker på knappen
let valgtAdresse = null;
let valgtBBRData = null;

// Når brugeren klikker på søg
searchInput.addEventListener("input", () => {
    // Hent input fra bruger
    const query = searchInput.value.trim();

    if (query.length < 3) {
    suggestionsList.classList.add("hidden");
    suggestionsList.innerHTML = "";
    return;
    }

    // Kald DAWA API
    fetch("https://api.dataforsyningen.dk/adresser?q=" + encodeURIComponent(query) + "&format=json")
        .then(response => {
            if (!response.ok) {
                throw new Error("API fejl");
            }
            return response.json();
        })
        .then(data => {
            // Ryd tidligere resultater
            suggestionsList.innerHTML = "";

            // Hvis ingen resultater → skjul dropdown
            if (data.length === 0) {
                suggestionsList.classList.add("hidden");
                return;
            }

            // Loop gennem adresser
            data.forEach(address => {
                // Opret option element
                const option = document.createElement("option");

                // Gem adresse data i dataset
                option.value = address.id;
                option.textContent = address.adressebetegnelse;

                option.dataset.adresseid = address.id;
                option.dataset.vejnavn = address.adgangsadresse?.vejstykke?.navn || "";
                option.dataset.vejnummer = address.adgangsadresse?.husnr || "";
                option.dataset.etage = address.etage || "";
                option.dataset.postnummer = address.adgangsadresse?.postnummer?.nr || "";
                option.dataset.bynavn = address.adgangsadresse?.postnummer?.navn || "";
                // Tilføj til dropdown
                suggestionsList.appendChild(option);
            });

            // Vis dropdown når vi har data
            suggestionsList.classList.remove("hidden");
        })
        .catch(error => {
            console.error("Fejl ved hentning:", error);
            suggestionsList.classList.add("hidden");
        });
});

// Når bruger vælger en adresse i dropdown
suggestionsList.addEventListener("change", () => {
    const selectedOption = suggestionsList.options[suggestionsList.selectedIndex];

    // Hvis der ikke er valgt noget, stopper vi
    if (!selectedOption) {
        return;
    }

    // Gemmer den valgte adresse
    valgtAdresse = {
        adresseid: selectedOption.dataset.adresseid,
        vejnavn: selectedOption.dataset.vejnavn,
        vejnummer: selectedOption.dataset.vejnummer,
        etage: selectedOption.dataset.etage || null,
        postnummer: selectedOption.dataset.postnummer,
        bynavn: selectedOption.dataset.bynavn
    };

    // Sæt valgt adresse i inputfelt og skjul dropdown
    searchInput.value = selectedOption.text;
    suggestionsList.classList.add("hidden");

    // Vis valgt adresse i preview-boksen
    const adresse = valgtAdresse.vejnavn + " " + valgtAdresse.vejnummer;
    const postnummerBy = valgtAdresse.postnummer + " " + valgtAdresse.bynavn;

    document.getElementById("displayAdresse").textContent = adresse;
    document.getElementById("displayPostnummerBy").textContent = postnummerBy;
    document.getElementById("addressDisplay").classList.remove("hidden");

    // Hent BBR-data og opdater preview
    hentOgVisBBRData(valgtAdresse.adresseid);
});

// Når brugeren klikker på "Opret ejendomsprofil"
opretBtn.addEventListener("click", async () => {
  if (!valgtAdresse) {
    alert("Vælg en adresse først.");
    return;
  }
  console.log("valgtAdresse:", valgtAdresse);
console.log("valgtBBRData:", valgtBBRData);
const adresseData = valgtAdresse.data || valgtAdresse;

const savedUser = localStorage.getItem("loggedInUser");

if (!savedUser) {
  alert("Du skal være logget ind for at oprette en ejendomsprofil.");
  window.location.href = "/login.html";
  return;
}

const user = JSON.parse(savedUser);
const brugerID = Number(user.brugerID);

if (!brugerID) {
  console.error("loggedInUser mangler brugerID:", user);
  alert("Kunne ikke finde brugerID for den loggede ind bruger.");
  return;
}

const payload = {
  brugerID: brugerID,

  vejNavn: valgtAdresse.vejnavn,
  vejNummer: valgtAdresse.vejnummer,
  etage: valgtAdresse.etage || null,
  postnummer: Number(valgtAdresse.postnummer),
  bynavn: valgtAdresse.bynavn,

  ejendomstype: valgtBBRData?.ejendomstype || "Ukendt",
  byggeAar: valgtBBRData?.byggeAar || null,
  boligArealM2: valgtBBRData?.boligArealM2 || 0,
  antalVaerelser: valgtBBRData?.antalVaerelser || null,
  grundArealM2: valgtBBRData?.grundArealM2 || null
};
console.log("payload sendt til backend:", payload);
  try {
    const response = await fetch("/api/v1/ejendomsProfil", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }
    
    const query = new URLSearchParams({
        id: result.ejendomsProfilID,
        adresseid: valgtAdresse.adresseid,
        vejnavn: valgtAdresse.vejnavn,
        vejnummer: valgtAdresse.vejnummer,
        postnummer: valgtAdresse.postnummer,
        bynavn: valgtAdresse.bynavn
    });

    window.location.href = `/ejendom.html?${query.toString()}`;

  } catch (error) {
    console.error(error);
    alert("Ejendomsprofilen kunne ikke oprettes.");
  }
});

// Funktion der sender adresse til backend
function saveAddressToDatabase(adresseData) {
    fetch("/api/v1/address/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(adresseData)
    })
        .then(response => {
            return response.json().then(data => ({
                ok: response.ok,
                status: response.status,
                body: data
            }));
        })
        .then(result => {
            if (!result.ok) {
                throw new Error(result.body.message || "Kunne ikke gemme adressen");
            }

            console.log("Adresse gemt i database:", result.body);
        })
        .catch(error => {
            console.error("Fejl ved lagring i database:", error);
        });
}

// State for kort-tabs i preview – holder de seneste URLs så vi kan skifte
// mellem dem uden at hente data igen, og husker hvilken tab der er aktiv.
const kortState = {
    luftfoto: null,
    matrikelkort: null,
    aktiv: "luftfoto",
};

// Tegner det aktuelt valgte kort i preview-containeren ud fra kortState.
// Kaldes både når en URL er hentet, og når brugeren klikker på en tab.
function visAktivtKort() {
    const photoContainer = document.querySelector(".address-display__photo");
    if (!photoContainer) return;

    const url = kortState[kortState.aktiv];
    const alt = kortState.aktiv === "luftfoto"
        ? "Luftfoto af ejendom"
        : "Matrikelkort af ejendom";

    if (url) {
        photoContainer.innerHTML = `<img src="${url}" alt="${alt}" class="property-aerial-photo">`;
    } else {
        // URL'en for det valgte korttype er ikke hentet endnu
        photoContainer.innerHTML = `<span>Henter kort fra API...</span>`;
    }
}

// Henter luftfoto-URL fra backend, gemmer den i state og opdaterer visningen
// hvis luftfoto er den aktive tab. Backend (mellemled) bygger WMS-kaldet mod
// Dataforsyningen.
async function hentOgVisLuftfoto(adresseid) {
    try {
        const response = await fetch(
            `/api/v1/properties/luftfoto?adresseid=${encodeURIComponent(adresseid)}`
        );
        const json = await response.json();
        kortState.luftfoto = json.data?.url ?? null;
        if (kortState.aktiv === "luftfoto") visAktivtKort();
    } catch (error) {
        console.error("Fejl ved hentning af luftfoto:", error);
    }
}

// Samme mønster som hentOgVisLuftfoto, blot mod matrikelkort-endpointet.
async function hentOgVisMatrikelkort(adresseid) {
    try {
        const response = await fetch(
            `/api/v1/properties/matrikelkort?adresseid=${encodeURIComponent(adresseid)}`
        );
        const json = await response.json();
        kortState.matrikelkort = json.data?.url ?? null;
        if (kortState.aktiv === "matrikelkort") visAktivtKort();
    } catch (error) {
        console.error("Fejl ved hentning af matrikelkort:", error);
    }
}

// Sætter event listeners på tab-knapperne, så et klik skifter aktivt korttype
// og opdaterer både visning og knappens active-styling.
document.querySelectorAll(".map-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        const valgt = tab.dataset.map;
        if (!valgt || valgt === kortState.aktiv) return;

        kortState.aktiv = valgt;

        document.querySelectorAll(".map-tab").forEach((t) => {
            t.classList.toggle("map-tab--active", t.dataset.map === valgt);
        });

        visAktivtKort();
    });
});

// Henter BBR-data fra vores backend og viser det i preview-boksen på forsiden
// Kaldes automatisk når brugeren vælger en adresse fra dropdown
// adresseid er DAR-adressens UUID fra DAWA API
async function hentOgVisBBRData(adresseid) {
    // Henter luftfoto og matrikelkort parallelt med BBR-data (uafhængige kald)
    hentOgVisLuftfoto(adresseid);
    hentOgVisMatrikelkort(adresseid);

    try {
        const [enhedRes, bygningRes, grundRes] = await Promise.all([
            fetch(`/api/v1/properties/enheder?adresseid=${encodeURIComponent(adresseid)}`),
            fetch(`/api/v1/properties/bygning?adresseid=${encodeURIComponent(adresseid)}`),
            fetch(`/api/v1/properties/grund?adresseid=${encodeURIComponent(adresseid)}`),
        ]);

        const enhed = (await enhedRes.json()).data?.[0] ?? {};
        const bygning = (await bygningRes.json()).data?.[0] ?? {};
        const jordstykke = (await grundRes.json()).data?.[0] ?? {};

        const byggeaarKey = Object.keys(bygning).find(k => k.startsWith("byg026"));

        const ejendomstype = BYGNINGSANVENDELSE[bygning.byg021BygningensAnvendelse] ?? "Ukendt";
        const byggeAar = byggeaarKey ? Number(bygning[byggeaarKey]) : null;
        const boligArealM2 = enhed.enh026EnhedensSamledeAreal
            ? Number(enhed.enh026EnhedensSamledeAreal)
            : 0;
        const antalVaerelser = enhed.enh031AntalVærelser
            ? Number(enhed.enh031AntalVærelser)
            : null;
        const grundArealM2 = jordstykke.registreretareal
            ? Number(jordstykke.registreretareal)
            : null;

        document.getElementById("bbrEjendomstype").textContent = ejendomstype;
        document.getElementById("bbrByggeaar").textContent = byggeAar ?? "–";
        document.getElementById("bbrBoligareal").textContent =
            boligArealM2 ? boligArealM2 + " m²" : "–";
        document.getElementById("bbrVaerelser").textContent =
            antalVaerelser ?? "–";
        document.getElementById("bbrGrundareal").textContent =
            grundArealM2 ? grundArealM2 + " m²" : "–";

        valgtBBRData = {
            ejendomstype,
            byggeAar,
            boligArealM2,
            antalVaerelser,
            grundArealM2
        };

        console.log("valgtBBRData:", valgtBBRData);

    } catch (error) {
        console.error("Fejl ved hentning af BBR-data til preview:", error);
    }
}

// Skjul dropdown hvis man klikker udenfor
document.addEventListener("click", (e) => {
    if (!document.querySelector(".search-block").contains(e.target)) {
        suggestionsList.classList.add("hidden");
    }
});