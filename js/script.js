// The pages in the site. The menu is built from this list, so a new page only needs adding here.
const pages = [
    { id: "home",  file: "index.html", label: "Home",     tooltip: "TV energy charts" },
    { id: "about", file: "about.html", label: "About Us", tooltip: "Who we are" }
];

// Each HTML file says which page it is with <body data-page="...">
const currentPage = document.body.dataset.page;

// Build the top navigation menu and highlight the current page
function buildNav() {
    let links = "";
    pages.forEach(function (page) {
        const activeClass = page.id === currentPage ? "active" : "";
        links += '<li><a href="' + page.file + '" class="' + activeClass + '" ' +
                 'data-tooltip="' + page.tooltip + '">' + page.label + '</a></li>';
    });

    document.getElementById("site-header").innerHTML =
        '<nav class="navbar">' +
            '<a href="index.html" class="logo" data-tooltip="Back to Home">' +
                '<img src="images/PowerIcon.png" alt="Power logo">' +
                '<span>PowerWise</span>' +
            '</a>' +
            '<ul class="nav-links">' + links + '</ul>' +
        '</nav>';
}

// Build the footer (same on every page)
function buildFooter() {
    const year = new Date().getFullYear();
    document.getElementById("site-footer").innerHTML =
        '<p>&copy; ' + year + ' Stefani Lee Shi Huey &middot; COS30045 Data Visualisation</p>' +
        '<p class="genai">GenAI acknowledgement: code and placeholder content were generated with ' +
        'the assistance of AI tools and reviewed by the author.</p>';
}

buildNav();
buildFooter();
