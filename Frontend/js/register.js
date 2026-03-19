const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm_password");
const passwordError = document.getElementById("passwordError");

function validatePassword() {
  const value = passwordInput.value;

  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasLength = value.length >= 8;

  if (value.length === 0) {
    passwordError.classList.add("hidden");
    return;
  }

  if (!hasLetter || !hasNumber || !hasLength) {
    passwordError.classList.remove("hidden");
  } else {
    passwordError.classList.add("hidden");
  }
}

function validatePasswordMatch() {
  if (confirmPasswordInput.value !== passwordInput.value) {
    confirmPasswordInput.setCustomValidity("Adgangskoderne er ikke ens.");
  } else {
    confirmPasswordInput.setCustomValidity("");
  }
}

passwordInput.addEventListener("input", () => {
  validatePassword();
  validatePasswordMatch();
});

confirmPasswordInput.addEventListener("input", validatePasswordMatch);