📦 Project Structure – API Setup
Dette projekt er struktureret med fokus på klar separation af ansvar, så koden er let at læse, vedligeholde og forklare til eksamen.
📁 Folder Structure
project-root/
│
├── routes/
├── controllers/
├── services/
├── middleware/
├── utils/
├── config/
│
├── app.js
├── package.json
├── package-lock.json
├── .env
└── .env.example

🔀 routes/
Her defineres kun endpoints og routes – ingen logik.
Eksempler:
/api/properties
/api/cases
/api/simulations
/webhooks/...

👉 Formål:
Modtage request
Route videre til controller
💡 Hvorfor det er vigtigt:
Matcher direkte eksamenskrav om API-design
Gør det nemt at forklare hvordan frontend kommunikerer med backend


🎯 controllers/
Controlleren styrer flowet:
Læser input fra request
Kalder service-laget
Sender response tilbage
Eksempel:
exports.getProperties = async (req, res, next) => {
  try {
    const data = await propertyService.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

👉 Formål:
Holder routes clean
Gør flowet tydeligt
💡 Hvis du smider logik her → din struktur er trash.


⚙️ services/
Her ligger al forretningslogik:
Databasekald
Eksterne API-kald
Beregninger
Data-transformation
Eksempel:
exports.getAll = async () => {
  return await db.query("SELECT * FROM properties");
};

👉 Formål:
Adskille logik fra HTTP-lag
Gøre systemet skalerbart
💡 Det her er det, censor faktisk kigger efter.



🧱 middleware/
Tværgående funktioner:
Global error handling
404 handler
Logging / validation
Eksempel:
exports.errorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error"
  });
};

👉 Formål:
Ét sted for fejlhåndtering
💡 Hvis dine errors er spredt → du dumper den del.


🧰 utils/
Små hjælpefunktioner:
Validering
Formattering
Standard responses
Eksempel:
exports.successResponse = (data) => ({
  status: "success",
  data
});

👉 Formål:
Undgå duplikering


⚙️ config/
Konfiguration og miljøvariabler.
Eksempel:
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
};

👉 Formål:
Centralisere setup
Undgå hardcoded værdier


📦 package.json (kort forklaring)
package.json styrer projektets dependencies og scripts.
Eksempel:
{
  "name": "api-project",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.0.0"
  }
}
👉 Indeholder:
Dependencies (Express osv.)
Scripts (start/dev)
Metadata
💡 Hvis du ikke kan forklare den → du forstår ikke dit projekt.


🔐 .env.example
Template til miljøvariabler (ALDRIG commit rigtig .env)
PORT=3000
DATABASE_URL=your_database_url
API_KEY=your_api_key

👉 Formål:
Vise hvilke variabler der kræves
Sikkerhed
💡 Hvis du committer secrets → det er amatørniveau.



🔒 .env
Din lokale config (skal i .gitignore)
Eksempel:
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/db
API_KEY=abc123
🔁 package-lock.json (kort forklaring)
Automatisk genereret fil.

👉 Indeholder:
Eksakte versions af dependencies
Dependency tree
💡 Hvorfor vigtigt:
Sikrer at alle får samme setup
Undgår "works on my machine" bullshit
👉 Du skal:
Altid committe den
Aldrig redigere den manuelt