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

const payload = {
  brugerID: 1,

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

// Henter luftfoto-URL fra backend og viser billedet i preview-kortet.
// Backend (mellemled) bygger selve WMS-kaldet mod Dataforsyningen.
async function hentOgVisLuftfoto(adresseid) {
    try {
        const response = await fetch(
            `/api/v1/properties/luftfoto?adresseid=${encodeURIComponent(adresseid)}`
        );
        const json = await response.json();
        const url = json.data?.url;
        if (!url) return;

        // Erstatter placeholder-teksten med et <img> der peger på WMS-URL'en
        const photoContainer = document.querySelector(".address-display__photo");
        if (photoContainer) {
            photoContainer.innerHTML = `<img src="${url}" alt="Luftfoto af ejendom" class="property-aerial-photo">`;
        }
    } catch (error) {
        console.error("Fejl ved hentning af luftfoto:", error);
    }
}

// Henter BBR-data fra vores backend og viser det i preview-boksen på forsiden
// Kaldes automatisk når brugeren vælger en adresse fra dropdown
// adresseid er DAR-adressens UUID fra DAWA API
async function hentOgVisBBRData(adresseid) {
    // Henter luftfoto parallelt med BBR-data (uafhængige kald)
    hentOgVisLuftfoto(adresseid);

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