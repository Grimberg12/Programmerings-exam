const { DATAFORSYNING_TOKEN } = require("../config/env");
const { hentKoordinaterFraDawa } = require("./dawaCoords");

// Bygger en WMS GetMap-URL til Dataforsyningens matrikelkort via Datafordeler.
// Service-stien har wms/-præfiks (jf. Dataforsyningens egen webservice-guide),
// modsat orto_foraar_DAF som ligger i roden. Vi bruger samme WMS 1.1.1 /
// EPSG:25832-opsætning og samme radius som luftfotoet, så de to billeder
// dækker præcis samme udsnit.
// LAYERS=SamletFastEjendom_Gaeldende viser ejendomsfladerne (matrikelskel)
// og Centroide_Gaeldende lægger matrikelnumrene oven på – tilsammen er det
// det klassiske matrikelkort-look.
// STYLES bestemmer farver: tom string for SamletFastEjendom_Gaeldende giver
// default-stilen (gul flade), Sorte_centroider giver sort matrikelnummer-tekst
// så tallene er læsbare oven på den gule baggrund (rækkefølgen matcher LAYERS).
function byggMatrikelkortUrl(x, y, radius = 40) {
  const bbox = `${x - radius},${y - radius},${x + radius},${y + radius}`;

  return (
    `https://api.dataforsyningen.dk/wms/MatGaeldendeOgForeloebigWMS_DAF` +
    `?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap` +
    `&FORMAT=image/png&TRANSPARENT=TRUE` +
    `&LAYERS=SamletFastEjendom_Gaeldende,Centroide_Gaeldende` +
    `&STYLES=,Sorte_centroider` +
    `&WIDTH=600&HEIGHT=600&SRS=EPSG:25832&BBOX=${bbox}` +
    `&token=${DATAFORSYNING_TOKEN}`
  );
}

// Hovedfunktion som route-laget kalder.
// Returnerer en WMS-URL til matrikelkort over ejendommen, eller null hvis
// adressen ikke blev fundet i DAWA.
async function hentMatrikelkortUrl(adresseid) {
  const koordinater = await hentKoordinaterFraDawa(adresseid);
  if (!koordinater) return null;

  const [x, y] = koordinater;
  return byggMatrikelkortUrl(x, y);
}

module.exports = {
  hentMatrikelkortUrl,
};
