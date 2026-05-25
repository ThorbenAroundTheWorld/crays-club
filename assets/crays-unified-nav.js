(function () {
  function normalize(pathname) {
    if (!pathname) return "/";
    var clean = pathname.replace(/\/+$/, "");
    return clean || "/";
  }

  function setCurrentState(nav) {
    var path = normalize(window.location.pathname);
    nav.querySelectorAll("a[href]").forEach(function (link) {
      var href = link.getAttribute("href");
      if (!href || href.indexOf("http") === 0 || href.indexOf("mailto:") === 0) return;
      var linkPath = normalize(new URL(href, window.location.origin).pathname);
      var isCurrent = linkPath === "/" ? path === "/" : path === linkPath || path.indexOf(linkPath + "/") === 0;
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    nav.querySelectorAll(".crays-unified-dropdown").forEach(function (dropdown) {
      var currentLink = dropdown.querySelector('a[aria-current="page"]');
      var button = dropdown.querySelector(".crays-unified-dropdown-toggle");
      if (button) {
        if (currentLink) {
          button.setAttribute("data-current", "true");
        } else {
          button.removeAttribute("data-current");
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-crays-unified-header]").forEach(function (header) {
      var toggle = header.querySelector(".crays-unified-toggle");
      var nav = header.querySelector(".crays-unified-nav");
      if (!nav) return;
      setCurrentState(nav);

      if (toggle) {
        toggle.addEventListener("click", function () {
          var isOpen = toggle.getAttribute("aria-expanded") === "true";
          toggle.setAttribute("aria-expanded", String(!isOpen));
          nav.classList.toggle("is-open", !isOpen);
        });
      }

      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          if (!toggle) return;
          toggle.setAttribute("aria-expanded", "false");
          nav.classList.remove("is-open");
        });
      });
    });
  });
})();
