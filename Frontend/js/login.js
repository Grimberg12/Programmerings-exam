// Sender loginformular til /api/v1/users/login og gemmer brugersession i localStorage.
// Backend sammenligner email + adgangskode og returnerer brugerID, navn, email og brugerStatus.
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

//tilføjer event listener til loginformularen, som håndterer loginprocessen ved at sende en POST-anmodning til backend og håndtere responsen.
loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  loginMessage.textContent = "";

  const data = {
    email: document.getElementById("email").value.trim(),
    adgangskode: document.getElementById("password").value
  };

  //fetcher til backend og håndterer responsen, gemmer session i localStorage og omdirigerer ved succes, eller viser fejlmeddelelse ved fejl.
  try {
    const response = await fetch("/api/v1/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      // Session gemmes under nøglen "loggedInUser" i localStorage — al resten af appen læser herfra
      localStorage.setItem("loggedInUser", JSON.stringify(result.data));
      window.location.href = result.redirectTo || "/index.html";
      return;
    }

    loginMessage.textContent = result.message || "Login mislykkedes.";
    loginMessage.style.color = "red";
  } catch (error) {
    console.error("Fejl ved login:", error);
    loginMessage.textContent = "Der opstod en fejl ved forbindelse til serveren.";
    loginMessage.style.color = "red";
  }
});