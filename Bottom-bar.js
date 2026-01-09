// Detect if running inside the APP via service agent
const isApp = navigator.userAgent === "APP";

// Redirect if not inside the app and trying to access app-info
if (!isApp && window.location.pathname.includes('app-info.html')) {
    window.location.href = 'index.html'; // or any page you want
}

// Navigation bar
const links = [
    { text: 'Home', url: 'index.html' },
    { text: 'About', url: 'about.html' },
    { text: 'Staff', url: 'staff.html' },
    { text: 'Information', url: 'info.html' },
    { text: 'Status', url: 'https://stats.uptimerobot.com/yyyK0XGlqJ' },
    { text: 'Downloads', url: 'downloads.html' },
    { text: 'App Info', url: 'app-info.html', appOnly: true } // app-only link
];

const nav = document.createElement('nav');
nav.classList.add('no-print');
nav.style.backgroundColor = "#E6E6E6";
nav.style.display = "flex";
nav.style.justifyContent = "space-around";
nav.style.padding = "10px 20px";
nav.style.fontFamily = "sans-serif";

links.forEach(linkData => {
    // Hide links depending on app state
    if (isApp && linkData.text === 'Downloads') return;
    if (isApp && linkData.text === 'Status') return;
    if (!isApp && linkData.appOnly) return;

    const a = document.createElement('a');
    a.href = linkData.url;
    a.textContent = linkData.text;
    a.style.color = "#000000";
    a.style.textDecoration = "none";
    a.style.padding = "14px 16px";
    a.style.transition = "background-color 0.3s";

    a.addEventListener('mouseenter', () => { a.style.backgroundColor = "#B5B5B5"; });
    a.addEventListener('mouseleave', () => { a.style.backgroundColor = "#E6E6E6"; });

    nav.appendChild(a);
});

document.body.appendChild(nav);
