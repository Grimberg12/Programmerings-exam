document.addEventListener("DOMContentLoaded", () => {

  // Mock data (midlertidig – senere API)
  const mockProperties = [
    {
      id: 1,
      adresse: "Ringstedgade 4",
      postnummer: "2100",
      by: "København Ø",
      antalCases: 1,
      datoOprettet: "16.3.2026"
    },
    {
      id: 2,
      adresse: "Rosenvængets Allé 2",
      postnummer: "2100",
      by: "København Ø",
      antalCases: 0,
      datoOprettet: "15.3.2026"
    },
  {
    id: 3,
    adresse: "Rosenvængets Allé 2",
    postnummer: "2100",
    by: "København Ø",
    antalCases: 0,
    datoOprettet: "15.3.2026"
  },
  {
    id: 4,
    adresse: "Rosenvængets Allé 2",
    postnummer: "2100",
    by: "København Ø",
    antalCases: 0,
    datoOprettet: "15.3.2026"
  },
  {
    id: 5,
    adresse: "Rosenvængets Allé 2",
    postnummer: "2100",
    by: "København Ø",
    antalCases: 0,
    datoOprettet: "15.3.2026"
  }
  ];

  // Hent ID fra URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  console.log("ID fra URL:", id);

  // Find ejendom
  const property = mockProperties.find(p => p.id == id);

  const container = document.getElementById("propertyDetails");

  // Fejlhåndtering
  if (!property) {
    container.innerHTML = "<p>Ejendom ikke fundet</p>";
    console.error("Ingen ejendom fundet med id:", id);
    return;
  }

  // Render ejendom
  container.innerHTML = `
    <h2>${property.adresse}</h2>
    <p>${property.postnummer} ${property.by}</p>
    <p>Antal cases: ${property.antalCases}</p>
    <p>Dato oprettet: ${property.datoOprettet}</p>
  `;

  console.log("Fundet ejendom:", property);

});