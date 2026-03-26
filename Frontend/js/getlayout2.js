/* layout.js - Fetches header and footer content and inserts into the page
Does this on page load for all pages that include this script. Does not include login.html since it has a different layout.
*/
document.addEventListener("DOMContentLoaded", async () => {
  const headerTarget = document.getElementById("header");
  const footerTarget = document.getElementById("footer");

  if (headerTarget) {
    const headerResponse = await fetch("../layout/header2.html");
    headerTarget.innerHTML = await headerResponse.text();
  }

  if (footerTarget) {
    const footerResponse = await fetch("../layout/footer2.html");
    footerTarget.innerHTML = await footerResponse.text();
  }
});