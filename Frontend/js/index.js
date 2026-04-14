//Venter på at siden er loadet
document.addEventListener("DOMContentLoaded", () => {
    //Vi finder vores velcome message fra index.html
  const welcomeMessage = document.getElementById("welcomeMessage");
// Vi henter den bruger, vi gemte ved login
  const savedUser = localStorage.getItem("loggedInUser");
//Hvis der ikke findes en bruger, stopper vi bare
  if (!savedUser || !welcomeMessage) {
    return;
  }
//Laver det om fra tekst til et objekt
  const user = JSON.parse(savedUser);
//Hvis brugeren har et navn vises det
  if (user.navn) {
    welcomeMessage.textContent = `Velkommen ${user.navn}`;
  }
});