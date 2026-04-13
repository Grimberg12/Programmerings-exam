fetch("https://api.dataforsyningen.dk/adresser?q=ringstedgade%204&format=json")
.then(response => response.json())
.then(data => console.log(data))
.catch(error => {
    console.error("Error fetching addresses:", error);
});

// Hent elementer fra DOM
const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");
const suggestionsList = document.getElementById("suggestionsList");

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

                // Gem adresse data i dataset så vi kan sende det til backend senere
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

    const selectedId = selectedOption.value;
    const selectedText = selectedOption.text;

    console.log("Valgt adresse ID:", selectedId);
    console.log("Valgt adresse:", selectedText);
    //logger hele json
    console.log(option.dataset)

    // Sæt valgt adresse i inputfelt
    searchInput.value = selectedText;

    // Skjul dropdown efter valg
    suggestionsList.classList.add("hidden");

    // Hent adressefelter fra option.dataset
    const adresseData = {
        adresseID: parseInt(selectedOption.dataset.adresseid),
        vejNavn: selectedOption.dataset.vejnavn,
        vejNummer: parseInt(selectedOption.dataset.vejnummer, 10),
        etage: selectedOption.dataset.etage ? parseInt(selectedOption.dataset.etage, 10) : null,
        postnummer: parseInt(selectedOption.dataset.postnummer, 10),
        bynavn: selectedOption.dataset.bynavn
    };

    console.log(adresseData)
    console.log(selectedOption.dataset)

    // Send til database
    saveAddressToDatabase(adresseData);
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

        /* 
        Senere kan næste step fx være:

        fetch("/api/v1/property-profile/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                adresseID: result.body.data.adresseID
            })
        })
        .then(response => response.json())
        .then(data => console.log("Ejendomsprofil oprettet:", data));
        */
    })
    .catch(error => {
        console.error("Fejl ved lagring i database:", error);
    });
}


// Skjul dropdown hvis man klikker udenfor
document.addEventListener("click", (e) => {
    if (!document.querySelector(".search-block").contains(e.target)) {
        suggestionsList.classList.add("hidden");
    }
});