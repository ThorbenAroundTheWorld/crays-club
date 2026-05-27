(function () {
  var APPLICATION_ENDPOINT = "/api/franchise-application";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formMarkup(location, defaultTargetGroup) {
    var safeLocation = escapeHtml(location || "Franchise page application");
    var safeTarget = escapeHtml(defaultTargetGroup || "");

    return [
      '<form class="crays-franchise-application-form" data-crays-application-form>',
      '<input type="hidden" name="formLocation" value="' + safeLocation + '">',
      '<input type="hidden" name="sourceUrl" value="">',
      '<label>First name<input name="firstName" type="text" autocomplete="given-name" placeholder="Your first name" required></label>',
      '<label>Last name<input name="lastName" type="text" autocomplete="family-name" placeholder="Your last name" required></label>',
      '<label>Email<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>',
      '<label>Phone<input name="phone" type="tel" autocomplete="tel" placeholder="+49 ..." ></label>',
      '<label>Target country / destination<input name="targetCountry" type="text" placeholder="Spain, Portugal, Mallorca, Ibiza..." required></label>',
      '<label>Target group<select name="targetGroup" required>',
      '<option value="">Select target group</option>',
      '<option value="Hospitality operator"' + (safeTarget === "Hospitality operator" ? " selected" : "") + '>Hospitality operator</option>',
      '<option value="Real estate or asset owner"' + (safeTarget === "Real estate or asset owner" ? " selected" : "") + '>Real estate or asset owner</option>',
      '<option value="Local operator or entrepreneur"' + (safeTarget === "Local operator or entrepreneur" ? " selected" : "") + '>Local operator or entrepreneur</option>',
      '<option value="Community builder or host"' + (safeTarget === "Community builder or host" ? " selected" : "") + '>Community builder or host</option>',
      '<option value="Capital or finance partner"' + (safeTarget === "Capital or finance partner" ? " selected" : "") + '>Capital or finance partner</option>',
      '<option value="Technology or ecosystem partner"' + (safeTarget === "Technology or ecosystem partner" ? " selected" : "") + '>Technology or ecosystem partner</option>',
      '</select></label>',
      '<label>Asset or concept<select name="propertyType" required>',
      '<option value="">Select asset or concept</option>',
      '<option value="Luxury villa for groups">Luxury villa for groups</option>',
      '<option value="Boutique hotel">Boutique hotel</option>',
      '<option value="Hotel floor or hotel partnership">Hotel floor or hotel partnership</option>',
      '<option value="Club lounge or beach club">Club lounge or beach club</option>',
      '<option value="Creator house or co-living node">Creator house or co-living node</option>',
      '<option value="Retreat base or destination venue">Retreat base or destination venue</option>',
      '<option value="Market plan without property yet">Market plan without property yet</option>',
      '</select></label>',
      '<label>Website<input name="website" type="url" autocomplete="url" placeholder="Optional website or listing"></label>',
      '<label class="crays-franchise-form-preview__wide">Project note<textarea name="message" rows="5" placeholder="Tell us your market, asset situation, operator setup and why this should become a Crays Club." required></textarea></label>',
      '<label class="crays-franchise-form-preview__consent"><input name="privacyAccepted" type="checkbox" value="yes" required><span>I agree that Crays may contact me about this application and review the information I submit.</span></label>',
      '<label class="crays-franchise-form-preview__trap" aria-hidden="true">Company website<input name="companyWebsite" type="text" tabindex="-1" autocomplete="off"></label>',
      '<button class="crays-franchise-button crays-franchise-button--primary" type="submit">Send Application</button>',
      '<p class="crays-franchise-application-status" data-crays-application-status role="status" aria-live="polite">This form sends directly to info@crays.org.</p>',
      '</form>'
    ].join("");
  }

  function renderForms() {
    document.querySelectorAll("[data-crays-application-mount]").forEach(function (mount) {
      if (mount.getAttribute("data-crays-application-ready") === "true") {
        return;
      }

      mount.innerHTML = formMarkup(
        mount.getAttribute("data-crays-form-location"),
        mount.getAttribute("data-crays-default-target-group")
      );
      mount.setAttribute("data-crays-application-ready", "true");
    });
  }

  function openApplication() {
    var tab = document.querySelector('[data-crays-franchise-tab="application"]');
    if (tab) {
      tab.click();
    }

    window.setTimeout(function () {
      var panel = document.getElementById("crays-franchise-panel-application") || document.getElementById("apply");
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      var firstInput = panel ? panel.querySelector("[data-crays-application-form] input:not([type='hidden']):not([tabindex='-1'])") : null;
      if (firstInput) {
        firstInput.focus({ preventScroll: true });
      }
    }, 80);
  }

  function statusFor(form) {
    return form.querySelector("[data-crays-application-status]");
  }

  function setStatus(form, type, message) {
    var status = statusFor(form);
    if (!status) {
      return;
    }

    status.classList.remove("is-error", "is-success");
    if (type) {
      status.classList.add("is-" + type);
    }
    status.textContent = message;
  }

  async function submitForm(form) {
    var submit = form.querySelector("button[type='submit']");
    var data = Object.fromEntries(new FormData(form).entries());
    data.privacyAccepted = form.querySelector('[name="privacyAccepted"]')?.checked || false;
    data.sourceUrl = window.location.href;

    if (submit) {
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
    }
    setStatus(form, "", "Sending your application to info@crays.org...");

    try {
      var response = await fetch(APPLICATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      var payload = await response.json().catch(function () { return {}; });

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Application could not be sent.");
      }

      form.reset();
      setStatus(form, "success", payload.message || "Application sent. We will review it and reply from info@crays.org.");
    } catch (error) {
      setStatus(form, "error", error.message || "Sending failed. Please email info@crays.org directly.");
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
      }
    }
  }

  function boot() {
    renderForms();

    document.querySelectorAll("[data-crays-start-application]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        openApplication();
      });
    });

    document.querySelectorAll("[data-crays-application-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitForm(form);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
