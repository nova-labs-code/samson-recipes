document.addEventListener("DOMContentLoaded", function () {
  const isApp = navigator.userAgent === "APP";

  // Redirect if not in app and trying to access app-only page
  if (!isApp && window.location.pathname.includes('app-info.html')) {
    window.location.href = 'index.html';
  }

  const links = [
    { text: 'Home', url: '/index.html' },
    { text: 'Meal Planner', url: '/Pages/meal-plan.html' },
    { text: 'About', url: '/Pages/about.html' },
    { text: 'Staff', url: '/Pages/staff.html' },
    { text: 'Information', url: '/Pages/info.html' },
    { text: 'Contact Us', url: '/Pages/contact-us.html' },
    { text: 'Samson Blogs', url: '/Pages/blogs' },
    { text: 'Stats', url: '/Pages/sitedata.html' },
    { text: 'Status', url: 'https://stats.uptimerobot.com/yyyK0XGlqJ' },
    { text: 'Updates', url: '/Pages/updates.html' },
    { text: 'Sponsors', url: '/Pages/sponsors.html' },
    { text: 'Downloads', url: '/Pages/downloads.html' },
    { text: 'App Info', url: '/Pages/app-info.html', appOnly: true }
  ];

  const bottomBar = document.createElement("div");
  bottomBar.id = "bottom-bar";

  const inner = document.createElement("div");
  inner.className = "bottom-bar-inner";

  links.forEach((link, index) => {
    // Hide links depending on app state
    if (isApp && ['Downloads','Status','Sponsors'].includes(link.text)) return;
    if (!isApp && link.appOnly) return;

    if (index > 0) {
      const sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = "|";
      inner.appendChild(sep);
    }

    const a = document.createElement("a");
    a.href = link.url;
    a.textContent = link.text;
    inner.appendChild(a);
  });

  bottomBar.appendChild(inner);
  document.body.appendChild(bottomBar);

  // Styles
  const style = document.createElement("style");
  style.textContent = `
    #bottom-bar {
      width: 100%;
      margin-top: 40px;
      background-color: #4D4542;
      overflow-x: auto;       /* horizontal scroll if needed */
      white-space: nowrap;    /* keep links in one line */
      padding: 14px 0;
      text-align: center;
      font-size: 20px !important;
      box-sizing: border-box;
      z-index: 999;
    }
    .bottom-bar-inner {
      display: inline-block;
    }
    #bottom-bar a {
      color: black;
      text-decoration: underline;
      font-weight: bold;
      margin: 0 6px;
    }
    #bottom-bar .sep {
      margin: 0 6px;
    }
  `;
  document.head.appendChild(style);
});