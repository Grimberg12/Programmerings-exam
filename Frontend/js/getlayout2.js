// Henter header2 og footer2 fra /layout/ og indsætter dem ved sideload.
// header2/footer2 er det simplere layout brugt på login.html og register.html (ingen navigation).
document.addEventListener("DOMContentLoaded", async () => {
  const headerTarget = document.getElementById("header");
  const footerTarget = document.getElementById("footer");

  if (headerTarget) {
    const headerResponse = await fetch("/layout/header2.html");
    headerTarget.innerHTML = await headerResponse.text();
  }

  if (footerTarget) {
    const footerResponse = await fetch("/layout/footer2.html");
    footerTarget.innerHTML = await footerResponse.text();
  }
});