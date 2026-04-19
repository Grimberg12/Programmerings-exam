const API_KEY = "DIN_API_KEY";

async function testBBR() {
  try {
    const res = await fetch(
      `https://graphql.datafordeler.dk/BBR/v2?apiKey=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            {
              BBR_Bygning(
                first: 1
                registreringstid: "2024-01-01T00:00:00Z"
                virkningstid: "2024-01-01T00:00:00Z"
              ) {
                nodes {
                  id_lokalId
                  kommunekode
                  byg026Opfoerelsesaar
                }
              }
            }
          `,
        }),
      }
    );

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testBBR();