// Henter header og footer fra /layout/-mappen og indsætter dem i #header og #footer ved sideload.
// Bruges på alle sider undtagen login/register, som har deres eget simplere layout (getlayout2.js).
document.addEventListener("DOMContentLoaded", async () => {
  const headerTarget = document.getElementById("header");
  const footerTarget = document.getElementById("footer");

  if (headerTarget) {
    const headerResponse = await fetch("/layout/header.html");
    headerTarget.innerHTML = await headerResponse.text();
  }

  if (footerTarget) {
    const footerResponse = await fetch("/layout/footer.html");
    footerTarget.innerHTML = await footerResponse.text();
  }
});