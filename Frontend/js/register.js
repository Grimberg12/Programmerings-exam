// Inputs
const form = document.getElementById("registerForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm_password");
const passwordError = document.getElementById("passwordError");

// 🔹 Password styrke validering
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

// 🔹 Password match validering
function validatePasswordMatch() {
  if (confirmPasswordInput.value !== passwordInput.value) {
    confirmPasswordInput.setCustomValidity("Adgangskoderne er ikke ens.");
    return false;
  } else {
    confirmPasswordInput.setCustomValidity("");
    return true;
  }
}

// 🔴 MAIN SUBMIT CONTROL (det vigtigste)
form.addEventListener("submit", function (e) {
  let isValid = true;

  // Reset fejl visning
  passwordError.classList.add("hidden");

  // 1. Tjek password strength
  const passwordValid = validatePassword();
  if (!passwordValid) {
    passwordError.classList.remove("hidden");
    isValid = false;
  }

  // 2. Tjek match
  const matchValid = validatePasswordMatch();
  if (!matchValid) {
    confirmPasswordInput.reportValidity();
    isValid = false;
  }

  // 3. Stop hvis noget fejler
  if (!isValid) {
    e.preventDefault();
  }
});