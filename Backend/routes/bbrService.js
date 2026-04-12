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

    // Kald DAWA API (adresse søgning)
    fetch("https://api.dataforsyningen.dk/adresser?q=" + encodeURIComponent(query) + "&format=json")
        
        // Konverter response til JSON
        .then(response => {
            if (!response.ok) {
                throw new Error("API fejl");
            }
            return response.json();
        })

        // Håndter data fra API
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

                // Opret option element (dropdown item)
                const option = document.createElement("option");

                // Gem ID (bruges senere til BBR API)
                option.value = address.id;

                // Vis pæn adresse tekst
                option.textContent = address.adressebetegnelse;

                // Tilføj til dropdown
                suggestionsList.appendChild(option);
            });

            // Vis dropdown når vi har data
            suggestionsList.classList.remove("hidden");
        })

        // Fejlhåndtering
        .catch(error => {
            console.error("Fejl ved hentning:", error);
            suggestionsList.classList.add("hidden");
        });
});


// Når bruger vælger en adresse i dropdown
suggestionsList.addEventListener("change", () => {

    const selectedId = suggestionsList.value;
    const selectedText = suggestionsList.options[suggestionsList.selectedIndex].text;

    console.log("Valgt adresse ID:", selectedId);
    console.log("Valgt adresse:", selectedText);

    // Sæt valgt adresse i inputfelt
    searchInput.value = selectedText;

    // Skjul dropdown efter valg
    suggestionsList.classList.add("hidden");

    // 👉 HER kan du senere kalde BBR API med selectedId
});


// Skjul dropdown hvis man klikker udenfor
document.addEventListener("click", (e) => {
    if (!document.querySelector(".search-block").contains(e.target)) {
        suggestionsList.classList.add("hidden");
    }
});