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

    document.querySelectorAll("[data-crays-advantages-slider]").forEach(function (slider) {
      var track = slider.querySelector("[data-crays-advantages-track]");
      if (!track) {
        return;
      }

      var slides = Array.prototype.slice.call(track.querySelectorAll("article"));
      var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-crays-advantages-dot]"));
      var previous = slider.querySelector("[data-crays-advantages-prev]");
      var next = slider.querySelector("[data-crays-advantages-next]");
      var activeIndex = 0;
      var programmaticUntil = 0;
      var autoplayDelay = 4600;
      var autoplayTimer = null;
      var ticking = false;

      function targetOffset(index) {
        var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        return Math.min(slides[index].offsetLeft, maxScroll);
      }

      function currentIndex() {
        var closest = 0;
        var distance = Infinity;
        slides.forEach(function (slide, index) {
          var offset = Math.abs(targetOffset(index) - track.scrollLeft);
          if (offset < distance) {
            distance = offset;
            closest = index;
          }
        });
        return closest;
      }

      function sync() {
        var active = Date.now() < programmaticUntil ? activeIndex : currentIndex();
        if (Date.now() >= programmaticUntil) {
          activeIndex = active;
        }
        slides.forEach(function (slide, index) {
          slide.classList.toggle("is-active-slide", index === active);
        });
        dots.forEach(function (dot, index) {
          var isActive = index === active;
          dot.classList.toggle("is-active", isActive);
          dot.setAttribute("aria-current", isActive ? "true" : "false");
        });
      }

      function goTo(index) {
        if (!slides.length) {
          return;
        }

        var target = (index + slides.length) % slides.length;
        activeIndex = target;
        programmaticUntil = Date.now() + 1200;
        dots.forEach(function (dot, dotIndex) {
          var isActive = dotIndex === target;
          dot.classList.toggle("is-active", isActive);
          dot.setAttribute("aria-current", isActive ? "true" : "false");
        });
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active-slide", slideIndex === target);
        });
        track.scrollTo({ left: track.scrollLeft, behavior: "auto" });
        track.scrollTo({ left: targetOffset(target), behavior: "smooth" });
      }

      function startAutoplay() {
        if (slides.length < 2) {
          return;
        }

        window.clearInterval(autoplayTimer);
        autoplayTimer = window.setInterval(function () {
          if (!document.hidden) {
            goTo(activeIndex + 1);
          }
        }, autoplayDelay);
      }

      dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
          goTo(index);
          startAutoplay();
        });
      });

      if (previous) {
        previous.addEventListener("click", function () {
          goTo(activeIndex - 1);
          startAutoplay();
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          goTo(activeIndex + 1);
          startAutoplay();
        });
      }

      track.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(activeIndex - 1);
          startAutoplay();
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goTo(activeIndex + 1);
          startAutoplay();
        }
      });

      track.addEventListener("scroll", function () {
        if (ticking) {
          return;
        }
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          sync();
        });
      }, { passive: true });

      window.addEventListener("resize", function () {
        goTo(activeIndex);
      });

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          window.clearInterval(autoplayTimer);
        } else {
          startAutoplay();
        }
      });

      sync();
      startAutoplay();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
