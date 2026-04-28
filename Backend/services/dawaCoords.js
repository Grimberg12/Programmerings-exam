// Henter koordinater for en adresse fra DAWA i EPSG:25832 (UTM32/ETRS89),
// som er det koordinatsystem Dataforsyningens WMS forventer for danske data.
// Prøver først /adresser (enhedsadresse), og falder tilbage til /adgangsadresser
// så funktionen virker uanset hvilken type UUID vi får med ind.
// Returnerer null hvis adressen ikke findes.
// Bruges af både luftfoto- og matrikelkort-service så vi undgår at duplikere
// opslaget mod DAWA.
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

module.exports = {
  hentKoordinaterFraDawa,
};
