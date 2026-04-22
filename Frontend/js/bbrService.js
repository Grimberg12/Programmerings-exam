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

// Når brugeren klikker på søg
searchButton.addEventListener("click", () => {
    // Hent input fra bruger
    const query = searchInput.value.trim();

    // Hvis input er tomt → skjul dropdown
    if (!query) {
        suggestionsList.classList.add("hidden");
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
                option.dataset.vejnavn = address.vejstykke?.navn || "";
                option.dataset.vejnummer = address.husnr || "";
                option.dataset.etage = address.etage || "";
                option.dataset.postnummer = address.postnr || "";
                option.dataset.bynavn = address.postnrnavn || "";

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
        etage: selectedOption.dataset.etage,
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
opretBtn.addEventListener("click", () => {
    // Hvis brugeren ikke har valgt en adresse fra dropdownen endnu
    if (!valgtAdresse) {
        alert("Vælg en adresse fra listen, før du opretter ejendomsprofilen.");
        return;
    }

    // Samler parametre til næste side
    const params = new URLSearchParams({
        adresseid: valgtAdresse.adresseid,
        vejnavn: valgtAdresse.vejnavn,
        vejnummer: valgtAdresse.vejnummer,
        postnummer: valgtAdresse.postnummer,
        bynavn: valgtAdresse.bynavn
    });

    // Sender brugeren videre til ejendomssiden
    window.location.href = "/ejendom.html?" + params.toString();
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

// Henter BBR-data fra vores backend og viser det i preview-boksen på forsiden
// Kaldes automatisk når brugeren vælger en adresse fra dropdown
// adresseid er DAR-adressens UUID fra DAWA API
async function hentOgVisBBRData(adresseid) {
    try {
        // Kalder backend parallelt for enhed, bygning og jordstykke (grundareal)
        // Backend proxyer kaldet til Datafordeler med credentials fra .env
        const [enhedRes, bygningRes, grundRes] = await Promise.all([
            fetch(`/api/v1/properties/enheder?adresseid=${encodeURIComponent(adresseid)}`),
            fetch(`/api/v1/properties/bygning?adresseid=${encodeURIComponent(adresseid)}`),
            fetch(`/api/v1/properties/grund?adresseid=${encodeURIComponent(adresseid)}`),
        ]);

        // Tager første element fra svaret - en adresse har typisk én enhed og én bygning
        const enhed = (await enhedRes.json()).data?.[0] ?? {};
        const bygning = (await bygningRes.json()).data?.[0] ?? {};
        const jordstykke = (await grundRes.json()).data?.[0] ?? {};

        // Byggeår-feltet har et æ/Å-tegn i feltnavnet som kan variere i encoding,
        // så vi finder nøglen dynamisk fremfor at hardcode den
        const byggeaarKey = Object.keys(bygning).find(k => k.startsWith("byg026"));

        // Opdaterer de individuelle BBR-span-elementer i index.html
        document.getElementById("bbrEjendomstype").textContent =
            BYGNINGSANVENDELSE[bygning.byg021BygningensAnvendelse] ?? "–";
        document.getElementById("bbrByggeaar").textContent =
            byggeaarKey ? bygning[byggeaarKey] : "–";
        document.getElementById("bbrBoligareal").textContent =
            enhed.enh026EnhedensSamledeAreal ? enhed.enh026EnhedensSamledeAreal + " m²" : "–";
        document.getElementById("bbrVaerelser").textContent =
            enhed.enh031AntalVærelser ?? "–";
        document.getElementById("bbrGrundareal").textContent =
            jordstykke.registreretareal ? jordstykke.registreretareal + " m²" : "–";
    } catch (error) {
        // Hvis BBR-kaldet fejler vises preview stadig, bare uden BBR-data
        console.error("Fejl ved hentning af BBR-data til preview:", error);
    }
}

// Skjul dropdown hvis man klikker udenfor
document.addEventListener("click", (e) => {
    if (!document.querySelector(".search-block").contains(e.target)) {
        suggestionsList.classList.add("hidden");
    }
});