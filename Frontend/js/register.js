// Hetner formular og felter fra HTML-input
const form = document.getElementById("registerForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm_password");
const passwordError = document.getElementById("passwordError");
const registerMessage = document.getElementById("registerMessage");

// Password styrke validering
function validatePassword() {
  const value = passwordInput.value;

  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasLength = value.length >= 8;

  if (!hasLetter || !hasNumber || !hasLength) {
    return false;
  }

  return true;
}

// Password match validering
function validatePasswordMatch() {
  if (confirmPasswordInput.value !== passwordInput.value) {
    confirmPasswordInput.setCustomValidity("Adgangskoderne er ikke ens.");
    return false;
  } else {
    confirmPasswordInput.setCustomValidity("");
    return true;
  }
}
//Tilføjet for at forsøge at fixe, "password er ikke ens bug" Fjern evt. hvis fortsætter
passwordInput.addEventListener("input", validatePasswordMatch);
confirmPasswordInput.addEventListener("input", validatePasswordMatch);

// MAIN SUBMIT CONTROL (det vigtigste)
form.addEventListener("submit", async function (e) {
  // Stopper standard submit, så siden ikke reloades
  e.preventDefault();

  let isValid = true;

  // Nulstiller fejlbeskeder
  passwordError.classList.add("hidden");
  registerMessage.textContent = "";

  // 1. Tjek password strength
  const passwordValid = validatePassword();
  if (!passwordValid) {
    passwordError.classList.remove("hidden");
    isValid = false;
  }

  // 2. Tjek password match
  const matchValid = validatePasswordMatch();
  if (!matchValid) {
    confirmPasswordInput.reportValidity();
    isValid = false;
  }

  // Stop hvis validering fejler
  if (!isValid) {
    return;
  }

  // Samler data fra formularen
  const data = {
    fornavn: document.getElementById("name").value.trim(),
    efternavn: document.getElementById("lastname").value.trim(),
    telefonnummer: document.getElementById("phone").value.trim(),
    email: document.getElementById("username").value.trim(),
    adgangskode: document.getElementById("password").value,
    accepteretVilkaar: document.getElementById("terms").checked
  };

  try {
    // Sender data til backend API
    const response = await fetch("/api/v1/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      registerMessage.textContent = "Brugeren blev oprettet.";
      registerMessage.style.color = "green";

      // Nulstiller formularen efter succes
      form.reset();
    } else {
      registerMessage.textContent = result.message || "Kunne ikke oprette bruger.";
      registerMessage.style.color = "red";
    }

  } catch (error) {
    console.error("Fejl ved kald til backend:", error);
    registerMessage.textContent = "Der opstod en fejl ved forbindelse til serveren.";
    registerMessage.style.color = "red";
  }
});