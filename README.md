# Ejendomsinvestering app

Dette projekt er en Ejendomsinvesterings platform. Brugeren kan oprette ejendomsprofiler, oprette investeringscases og sammenligne forskellige investeringsscenarier.

Projektet er lavet som en del af eksamensprojektet i Programmering og udvikling af små systemer.

## Teknologier

HTML
CSS
JavaScript
Node.js
Express
SQL Server
Azure SQL
Jest
DAWA
Datafordeler/BBR

## Funktioner

Brugeren kan oprette sig og logge ind
Brugeren kan søge efter en dansk adresse
Systemet kan hente ejendomsdata fra offentlige API'er
Brugeren kan oprette ejendomsprofiler
Brugeren kan se, redigere og slette ejendomsprofiler
Brugeren kan oprette investeringscases
Brugeren kan se, redigere, slette og duplikere investeringscases
Systemet kan beregne månedlig låneydelse
Systemet kan beregne restgæld over tid
Systemet kan vise økonomiske nøgletal
Brugeren kan sammenligne flere investeringscases
Systemet kan vise kort og luftfoto for ejendomme

## Filstruktur

-Backend
config
middleware
routes
services
tests
package.json
server.js

-Frontend
css
js
layout
pictures
public

README.md

## Krav før opstart

Node.js skal være installeret
npm skal være installeret
Der skal være adgang til en SQL Server database
Der skal være adgang til de nødvendige API oplysninger

## Opsætning

Gå ind i Backend mappen:

```bash
cd Backend
node server.js