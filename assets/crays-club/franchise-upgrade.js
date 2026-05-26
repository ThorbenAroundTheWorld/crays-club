(function () {
  function activate(root, name) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-crays-franchise-tab]"));
    var panels = Array.prototype.slice.call(root.querySelectorAll("[data-crays-franchise-panel]"));

    tabs.forEach(function (tab) {
      var isActive = tab.getAttribute("data-crays-franchise-tab") === name;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    panels.forEach(function (panel) {
      var isActive = panel.getAttribute("data-crays-franchise-panel") === name;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  }

  function boot() {
    document.querySelectorAll("[data-crays-franchise-tabs]").forEach(function (root) {
      var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-crays-franchise-tab]"));
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          activate(root, tab.getAttribute("data-crays-franchise-tab"));
        });
      });
      if (!tabs.some(function (tab) { return tab.classList.contains("is-active"); }) && tabs[0]) {
        activate(root, tabs[0].getAttribute("data-crays-franchise-tab"));
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
