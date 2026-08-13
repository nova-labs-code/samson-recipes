import { isAuthorized } from "/js/security.js";
(function () {
  const iconPath = "/icons/favicon.ico";

  function getHead() {
    if (!document.head) {
      const head = document.createElement("head");
      document.documentElement.insertBefore(
        head,
        document.documentElement.firstChild
      );
    }
    return document.head;
  }

  function ensureLink(rel, href, extra = {}) {
    const head = getHead();

    let link = document.querySelector(`link[rel="${rel}"]`);

    if (!link) {
      link = document.createElement("link");
      head.appendChild(link);
    }

    link.setAttribute("rel", rel);
    link.setAttribute("href", href);

    for (const [key, value] of Object.entries(extra)) {
      link.setAttribute(key, value);
    }

    return link;
  }

  function ensureMeta(selector, attrName, attrValue, content) {
    const head = getHead();

    let meta = document.querySelector(selector);

    if (!meta) {
      meta = document.createElement("meta");
      head.appendChild(meta);
    }

    meta.setAttribute(attrName, attrValue);
    meta.setAttribute("content", content);

    return meta;
  }

  function applyIcons() {
    // Common favicon relations
    [
      "icon",
      "shortcut icon",
      "apple-touch-icon",
      "apple-touch-icon-precomposed",
      "fluid-icon"
    ].forEach(rel => {
      ensureLink(rel, iconPath);
    });

    ensureLink("mask-icon", iconPath, {
      color: "#000000"
    });

    // Fix any existing icon-related links
    document.querySelectorAll("link").forEach(link => {
      const rel = (link.getAttribute("rel") || "").toLowerCase();

      if (
        rel.includes("icon") ||
        rel.includes("apple-touch") ||
        rel.includes("fluid") ||
        rel.includes("mask")
      ) {
        link.setAttribute("href", iconPath);
      }
    });

    // Microsoft tiles
    [
      "msapplication-TileImage",
      "msapplication-square70x70logo",
      "msapplication-square150x150logo",
      "msapplication-wide310x150logo",
      "msapplication-square310x310logo"
    ].forEach(name => {
      ensureMeta(
        `meta[name="${name}"]`,
        "name",
        name,
        iconPath
      );
    });

    // Open Graph
    ensureMeta(
      'meta[property="og:image"]',
      "property",
      "og:image",
      iconPath
    );

    // Twitter
    ensureMeta(
      'meta[name="twitter:image"]',
      "name",
      "twitter:image",
      iconPath
    );

    // Theme color
    ensureMeta(
      'meta[name="theme-color"]',
      "name",
      "theme-color",
      "#ffffff"
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyIcons);
  } else {
    applyIcons();
  }
})();