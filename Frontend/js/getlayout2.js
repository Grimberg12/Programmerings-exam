/* layout.js - Fetches header and footer content and inserts into the page
Does this on page load for all pages that include this script. Does not include login.html since it has a different layout.
*/
async function loadLayout() {

  const header = await fetch("../layout/header2.html");
  const headerHTML = await header.text();
  document.getElementById("header").innerHTML = headerHTML;

  const footer = await fetch("../layout/footer2.html");
  const footerHTML = await footer.text();
  document.getElementById("footer").innerHTML = footerHTML;

}

loadLayout();