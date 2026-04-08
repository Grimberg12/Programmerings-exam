require("dotenv").config(); //indlæser miljøvariabler fra en .env-fil i roden af projektet og gør dem tilgængelige via process.env

const PORT = process.env.PORT || 3000; //hvis der findes en miljøport så brug den, ellers brug 3000. 
const NODE_ENV = process.env.NODE_ENV || 'development'; //hvis der findes en miljøvariabel for NODE_ENV så brug den, ellers sæt den til 'development'.

module.exports = { //eksporterer PORT og NODE_ENV så de kan bruges i andre filer, f.eks. server.js
  PORT,
  NODE_ENV,
};

