const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  loginMessage.textContent = "";

  const data = {
    email: document.getElementById("email").value.trim(),
    adgangskode: document.getElementById("password").value
  };

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