const { DATAFORSYNING_TOKEN } = require("../config/env");

// Henter koordinater for en adresse fra DAWA i EPSG:25832 (UTM32/ETRS89),
// som er det koordinatsystem Dataforsyningens WMS forventer for danske data.
// Prøver først /adresser (enhedsadresse), og falder tilbage til /adgangsadresser
// så funktionen virker uanset hvilken type UUID vi får med ind.
// Returnerer null hvis adressen ikke findes.
async function hentKoordinaterFraDawa(adresseid) {
  const adresserUrl = `https://api.dataforsyningen.dk/adresser/${encodeURIComponent(adresseid)}?srid=25832`;
  const adresserRes = await fetch(adresserUrl);

  if (adresserRes.ok) {
    const data = await adresserRes.json();
    return data.adgangsadresse.adgangspunkt.koordinater;
  }

  const adgangsUrl = `https://api.dataforsyningen.dk/adgangsadresser/${encodeURIComponent(adresseid)}?srid=25832`;
  const adgangsRes = await fetch(adgangsUrl);

  if (!adgangsRes.ok) {
    return null;
  }

  const data = await adgangsRes.json();
  return data.adgangspunkt.koordinater;
}

// Bygger en WMS GetMap-URL til Dataforsyningens ortofoto-service.
// radius (i meter) styrer zoom-niveauet – et lille BBOX giver et tæt zoom.
function byggLuftfotoUrl(x, y, radius = 40) {
  const bbox = `${x - radius},${y - radius},${x + radius},${y + radius}`;

  return (
    `https://api.dataforsyningen.dk/orto_foraar_DAF?SERVICE=WMS&VERSION=1.1.1` +
    `&REQUEST=GetMap&FORMAT=image/jpeg&LAYERS=orto_foraar&STYLES=` +
    `&WIDTH=600&HEIGHT=600&SRS=EPSG:25832&BBOX=${bbox}` +
    `&token=${DATAFORSYNING_TOKEN}`
  );
}

// Hovedfunktion som route-laget kalder.
// Returnerer en WMS-URL til luftfoto af ejendommen, eller null hvis adressen
// ikke blev fundet i DAWA.
async function hentLuftfotoUrl(adresseid) {
  const koordinater = await hentKoordinaterFraDawa(adresseid);
  if (!koordinater) return null;

  const [x, y] = koordinater;
  return byggLuftfotoUrl(x, y);
}

module.exports = {
  hentLuftfotoUrl,
};
