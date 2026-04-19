//Denne fil skal kunne hente data fra backend og vise det i investeringscase.html, samt kunne udregne cashflow baseret på de indtastede data i investeringscase.html

//udfyld investmentcasedetails med data fra backend'
const mockCases = [
  {
    id: 1,
    navn: "Ejendom 1",
    beskrivelse: "En flot ejendom i København",
    adresse: "Rosenvængets Allé 2",
    areal: 120,
    antalVærelser: 3,
    købspris: 5000000,
    egenkapital: 1000000,
    andre_omkostninger: 50000,
    renoveringsomkostninger: 200000,
    realkreditlån: {
        beløb: 4000000,
        type: "fast",
        rente: 0.02,
        løbetid: 30
    },
    banklån: {
        beløb: 500000,
        type: "variabel",
        rente: 0.05,
        løbetid: 10
    },
    andrelån: {
        beløb: 500000,
        type: "variabel",
        rente: 0.05,
        løbetid: 10
    },
    udlejning: {
        udlejes: true,
        månedligLeje: 20000,
        månedligUdgifter: 5000
    }
  }
];

//Udfyld investmentcasedetails med data fra mockCases (senere hentes fra API database)
function renderInvestmentCaseDetails() {
    const detailsContainer = document.getElementById("investmentCaseDetails");  
    detailsContainer.innerHTML = ""; // Ryd eksisterende indhold
    const caseData = mockCases[0]; // For nu, brug den første case i mock data

    const hasFinancing = caseData.realkreditlån || caseData.banklån || caseData.andrelån;
    
    const caseDetailsHTML = `<h2>${caseData.navn}</h2>
    <p>${caseData.beskrivelse}</p>
    <p>Adresse: ${caseData.adresse}</p>
    <p>Areal: ${caseData.areal} m²</p>
    <p>Antal værelser: ${caseData.antalVærelser}</p>
    <p>Købspris: ${caseData.købspris.toLocaleString()} DKK</p>
    <p>Egenkapital: ${caseData.egenkapital.toLocaleString()} DKK</p>
    <p>Anden omkostninger: ${caseData.andre_omkostninger.toLocaleString()} DKK</p>
    <p>Renoveringsomkostninger: ${caseData.renoveringsomkostninger.toLocaleString()} DKK</p>

    ${hasFinancing ? `
    <h3>Finansiering</h3>
    ${caseData.realkreditlån ? `<p>Realkreditlån: ${caseData.realkreditlån.beløb.toLocaleString()} DKK (type: ${caseData.realkreditlån.type}, rente: ${caseData.realkreditlån.rente * 100}%, løbetid: ${caseData.realkreditlån.løbetid} år)</p>` : ''}
    ${caseData.banklån ? `<p>Banklån: ${caseData.banklån.beløb.toLocaleString()} DKK (type: ${caseData.banklån.type}, rente: ${caseData.banklån.rente * 100}%, løbetid: ${caseData.banklån.løbetid} år)</p>` : ''}
    ${caseData.andrelån ? `<p>Andrelån: ${caseData.andrelån.beløb.toLocaleString()} DKK (type: ${caseData.andrelån.type}, rente: ${caseData.andrelån.rente * 100}%, løbetid: ${caseData.andrelån.løbetid} år)</p>` : ''}
    ` : ''}

    <!-- Udlejning sektion vises kun hvis ejendommen udlejes -->
     ${caseData.udlejning.udlejes ? `
    <h3>Udlejning</h3>
    <p>Udlejes: ${caseData.udlejning.udlejes ? "Ja" : "Nej"}</p>
    <p>Månedlig leje: ${caseData.udlejning.månedligLeje.toLocaleString()} DKK</p>
    <p>Månedlige udgifter: ${caseData.udlejning.månedligUdgifter.toLocaleString()} DKK</p>
  ` : ''}`;

    detailsContainer.innerHTML = caseDetailsHTML;
}

renderInvestmentCaseDetails();

//udregn sektion/simulation skal indeholde udregninger for cashflow, egenkapitalforrentning, gæld, egenkapital, udlejningsindtægter, udlejningsudgifter, samt en samlet vurdering af investeringscasen baseret på disse udregninger. Alle udregninger skal have tooltips der forklarer hvordan de er udregnet, og hvilke data der er brugt i udregningen.

function calculateCashflow() {
    const caseData = mockCases[0]; // For nu, brug den første case i mock data
    const månedligLeje = caseData.udlejning.månedligLeje;
    const månedligeUdgifter = caseData.udlejning.månedligUdgifter;
    const månedligtCashflow = månedligLeje - månedligeUdgifter;
    const årligtCashflow = månedligtCashflow * 12;

    const cashflowResultContainer = document.getElementById("cashflowResult");
    cashflowResultContainer.innerHTML = `<div><h3>Cashflow</h3>
    <!-- Vis både månedligt og årligt cashflow + tooltip med udregninger -->
    <div class="cashflow-item">
        <p>Månedligt cashflow: ${månedligtCashflow.toLocaleString()} DKK</p>
        <span class="tooltip">ℹ️
            <span class="tooltip-text">
                Udregning: Månedlig leje (${månedligLeje.toLocaleString()} DKK) - Månedlige udgifter (${månedligeUdgifter.toLocaleString()} DKK) = Månedligt cashflow (${månedligtCashflow.toLocaleString()} DKK)
            </span>
        </span>
    </div>
    <div class="cashflow-item">
        <p>Årligt cashflow: ${årligtCashflow.toLocaleString()} DKK</p>
        <span class="tooltip">ℹ️
            <span class="tooltip-text">
                Udregning: Månedligt cashflow (${månedligtCashflow.toLocaleString()} DKK) * 12 = Årligt cashflow (${årligtCashflow.toLocaleString()} DKK)
            </span>
        </span>
    </div>
    </div>`;
}

//egenkapitalforrentning udregning skal indeholde udregning for både månedlig og årlig egenkapitalforrentning, samt tooltip med udregninger

function calculateEgenkapitalforrentning() {
    const caseData = mockCases[0]; // For nu, brug den første case i mock data
    const månedligEgenkapitalforrentning = (caseData.udlejning.månedligLeje - caseData.udlejning.månedligUdgifter) / caseData.egenkapital;
    const årligEgenkapitalforrentning = månedligEgenkapitalforrentning * 12;
    const egenkapitalforrentningResultContainer = document.getElementById("egenkapitalforrentningResult");
    egenkapitalforrentningResultContainer.innerHTML = `<div><h3>Egenkapitalforrentning</h3>
    <!-- Vis både månedlig og årlig egenkapitalforrentning + tooltip med udregninger -->
    <div class="egenkapitalforrentning-item">
        <p>Månedlig egenkapitalforrentning: ${(månedligEgenkapitalforrentning * 100).toFixed(2)}%</p>
        <span class="tooltip">ℹ️
            <span class="tooltip-text">
                Udregning: (Månedlig leje (${caseData.udlejning.månedligLeje.toLocaleString()} DKK) - Månedlige udgifter (${caseData.udlejning.månedligUdgifter.toLocaleString()} DKK)) / Egenkapital (${caseData.egenkapital.toLocaleString()} DKK) = Månedlig egenkapitalforrentning (${(månedligEgenkapitalforrentning * 100).toFixed(2)}%)
            </span>
        </span>
    </div>
    <div class="egenkapitalforrentning-item">
        <p>Årlig egenkapitalforrentning: ${(årligEgenkapitalforrentning * 100).toFixed(2)}%</p>
        <span class="tooltip">ℹ️
            <span class="tooltip-text">
                Udregning: Månedlig egenkapitalforrentning (${(månedligEgenkapitalforrentning * 100).toFixed(2)}%) * 12 = Årlig egenkapitalforrentning (${(årligEgenkapitalforrentning * 100).toFixed(2)}%)
            </span>
        </span>
    </div>
    </div>`;
}

//gældsgrad udregning skal indeholde udregning for både månedlig og årlig gældsgrad, samt tooltip med udregninger

function calculateGældsgrad() {
    const caseData = mockCases[0]; // For nu, brug den første case i mock data
    const totalGæld = (caseData.realkreditlån ? caseData.realkreditlån.beløb : 0) + (caseData.banklån ? caseData.banklån.beløb : 0) + (caseData.andrelån ? caseData.andrelån.beløb : 0);
    const gældsgrad = totalGæld / caseData.købspris;
    const gældsgradResultContainer = document.getElementById("gældsgradResult");
    gældsgradResultContainer.innerHTML = `<div><h3>Gældsgrad</h3>
    <!-- Vis gældsgrad + tooltip med udregninger -->
    <div class="gældsgrad-item">
        <p>Gældsgrad: ${(gældsgrad * 100).toFixed(2)}%</p>
        <span class="tooltip">ℹ️
            <span class="tooltip-text">
                Udregning: Total gæld (${totalGæld.toLocaleString()} DKK) / Købspris (${caseData.købspris.toLocaleString()} DKK) = Gældsgrad (${(gældsgrad * 100).toFixed(2)}%)
            </span>
        </span>
    </div>
    </div>`;
}

//egenkapital udregning skal indeholde udregning for både månedlig og årlig egenkapital, samt tooltip med udregninger

function calculateEgenkapital() {
    const caseData = mockCases[0]; // For nu, brug den første case i mock data
    const totalGæld = (caseData.realkreditlån ? caseData.realkreditlån.beløb : 0) + (caseData.banklån ? caseData.banklån.beløb : 0) + (caseData.andrelån ? caseData.andrelån.beløb : 0);
    const egenkapital = caseData.købspris - totalGæld;
    const egenkapitalResultContainer = document.getElementById("egenkapitalResult");
    egenkapitalResultContainer.innerHTML = `<div><h3>Egenkapital</h3>
    <!-- Vis egenkapital + tooltip med udregninger -->
    <div class="egenkapital-item">
        <p>Egenkapital: ${egenkapital.toLocaleString()} DKK</p>
        <span class="tooltip">ℹ️
            <span class="tooltip-text">
                Udregning: Købspris (${caseData.købspris.toLocaleString()} DKK) - Total gæld (${totalGæld.toLocaleString()} DKK) = Egenkapital (${egenkapital.toLocaleString()} DKK)
            </span>
        </span>
    </div>
    </div>`;
}

//udlejningsindtægter udregning skal indeholde udregning for både månedlig og årlig udlejningsindtægter, samt tooltip med udregninger

function calculateUdlejningsindtægter() {
    const caseData = mockCases[0]; // For nu, brug den første case i mock data
    const månedligLeje = caseData.udlejning.månedligLeje;
    const årligLeje = månedligLeje * 12;
    const udlejningsindtægterResultContainer = document.getElementById("udlejningsindtægterResult");
    udlejningsindtægterResultContainer.innerHTML = `<div><h3>Udlejningsindtægter</h3>
    <!-- Vis både månedlig og årlig udlejningsindtægter + tooltip med udregninger -->
    <div class="udlejningsindtægter-item">
        <p>Månedlige udlejningsindtægter: ${månedligLeje.toLocaleString()} DKK</p>
        <span class="tooltip">ℹ️
            <span class="tooltip-text">
                Udregning: Månedlig leje (${månedligLeje.toLocaleString()} DKK) = Månedlige udlejningsindtægter (${månedligLeje.toLocaleString()} DKK)
            </span>
        </span>
    </div>
    <div class="udlejningsindtægter-item">
        <p>Årlige udlejningsindtægter: ${årligLeje.toLocaleString()} DKK</p>
        <span class="tooltip">ℹ️
            <span class="tooltip-text">
                Udregning: Månedlig leje (${månedligLeje.toLocaleString()} DKK) * 12 = Årlige udlejningsindtægter (${årligLeje.toLocaleString()} DKK)
            </span>
        </span>
    </div>
    </div>`;
}

//udlejningsudgifter udregning skal indeholde udregning for både månedlig og årlig udlejningsudgifter, samt tooltip med udregninger

function calculateUdlejningsudgifter() {
    const caseData = mockCases[0]; // For nu, brug den første case i mock data
    const månedligeUdgifter = caseData.udlejning.månedligUdgifter;
    const årligeUdgifter = månedligeUdgifter * 12; 
    const udlejningsudgifterResultContainer = document.getElementById("udlejningsudgifterResult");
    udlejningsudgifterResultContainer.innerHTML = `<div><h3>Udlejningsudgifter</h3>
    <!-- Vis både månedlig og årlig udlejningsudgifter + tooltip med udregninger -->
    <div class="udlejningsudgifter-item">
        <p>Månedlige udlejningsudgifter: ${månedligeUdgifter.toLocaleString()} DKK</p>
        <span class="tooltip">ℹ️
            <span class="tooltip-text">
                Udregning: Månedlige udgifter (${månedligeUdgifter.toLocaleString()} DKK) = Månedlige udlejningsudgifter (${månedligeUdgifter.toLocaleString()} DKK)
            </span>
        </span>
    </div>
    <div class="udlejningsudgifter-item">
        <p>Årlige udlejningsudgifter: ${årligeUdgifter.toLocaleString()} DKK</p>
        <span class="tooltip">ℹ️
            <span class="tooltip-text">
                Udregning: Månedlige udgifter (${månedligeUdgifter.toLocaleString()} DKK) * 12 = Årlige udlejningsudgifter (${årligeUdgifter.toLocaleString()} DKK)
            </span>
        </span>
    </div>
    </div>`;
}

//samlet vurdering af investeringscasen skal indeholde en vurdering baseret på de udregnede værdier for cashflow, egenkapitalforrentning, gældsgrad, egenkapital, udlejningsindtægter og udlejningsudgifter. Vurderingen skal være i form af en tekstbeskrivelse (f.eks. "God investering", "Neutral investering", "Dårlig investering") og skal have en tooltip der forklarer hvordan vurderingen er lavet, og hvilke data der er brugt i vurderingen

function calculateSamletVurdering() {
    const caseData = mockCases[0];
    // Her skal du implementere logikken for at vurdere investeringscasen baseret på de udregnede værdier
    const samletVurderingResultContainer = document.getElementById("samletVurderingResult");
    samletVurderingResultContainer.innerHTML = `<div><h3>Samlet vurdering</h3>
    <p>Vurdering: Neutral investering</p>
    <span class="tooltip">ℹ️
        <span class="tooltip-text">
            Vurderingen er baseret på følgende data:
            - Cashflow: ${caseData.udlejning.månedligLeje - caseData.udlejning.månedligUdgifter} DKK pr. måned
            - Egenkapitalforrentning: ${(calculateEgenkapitalforrentning() * 100).toFixed(2)}% pr. år
            - Gældsgrad: ${(calculateGældsgrad() * 100).toFixed(2)}%
            - Egenkapital: ${calculateEgenkapital().toLocaleString()} DKK
            - Udlejningsindtægter: ${caseData.udlejning.månedligLeje.toLocaleString()} DKK pr. måned
            - Udlejningsudgifter: ${caseData.udlejning.månedligUdgifter.toLocaleString()} DKK pr. måned
            Baseret på disse data vurderes investeringscasen som en neutral investering, da cashflow er positivt, egenkapitalforrentning er moderat, gældsgrad er acceptabel, og udlejningsindtægter dækker udlejningsudgifter.
        </span>
    </span>
    </div>`;
}

//Aktiver når knappen trykkes på "Beregn cashflow" knappen i investeringscase.html
document.getElementById("calculateBtn").addEventListener("click", calculateCashflow);
document.getElementById("calculateBtn").addEventListener("click", calculateEgenkapitalforrentning);
document.getElementById("calculateBtn").addEventListener("click", calculateGældsgrad);
document.getElementById("calculateBtn").addEventListener("click", calculateEgenkapital);
document.getElementById("calculateBtn").addEventListener("click", calculateUdlejningsindtægter);
document.getElementById("calculateBtn").addEventListener("click", calculateUdlejningsudgifter);
document.getElementById("calculateBtn").addEventListener("click", calculateSamletVurdering);