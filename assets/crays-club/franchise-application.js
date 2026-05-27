(function () {
  var APPLICATION_ENDPOINT = "/api/franchise-application";
  var FORM_SUBMIT_ENDPOINT = "https://formsubmit.co/ajax/info@crays.org";

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
      '<option value="Luxury Villa">Luxury Villa</option>',
      '<option value="Boutique Hotel">Boutique Hotel</option>',
      '<option value="Hotel Floor">Hotel Floor</option>',
      '<option value="Larger Hotel Complex">Larger Hotel Complex</option>',
      '<option value="Resort">Resort</option>',
      '<option value="Serviced Apartments">Serviced Apartments</option>',
      '<option value="Beach Club">Beach Club</option>',
      '<option value="Coworking &amp; Coliving Space">Coworking &amp; Coliving Space</option>',
      '<option value="Mixed-Use Development">Mixed-Use Development</option>',
      '<option value="Urban Lifestyle Hotel">Urban Lifestyle Hotel</option>',
      '<option value="Marina &amp; Yacht Club">Marina &amp; Yacht Club</option>',
      '<option value="Golf Resort">Golf Resort</option>',
      '<option value="Event &amp; Conference Venue">Event &amp; Conference Venue</option>',
      '<option value="Residential Community">Residential Community</option>',
      '<option value="Student Housing">Student Housing</option>',
      '<option value="Work-Live Campus">Work-Live Campus</option>',
      '<option value="Hospitality Village">Hospitality Village</option>',
      '<option value="Cultural &amp; Creative Hub">Cultural &amp; Creative Hub</option>',
      '<option value="Tech &amp; Innovation Campus">Tech &amp; Innovation Campus</option>',
      '<option value="Digital Nomad Hub">Digital Nomad Hub</option>',
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

  function applicationSubject(data) {
    var name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || "New applicant";
    var market = data.targetCountry || "new market";
    return "Crays Club Brand as a Service application - " + name + " - " + market;
  }

  async function sendWithFormSubmit(data) {
    var response = await fetch(FORM_SUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: [data.firstName, data.lastName].filter(Boolean).join(" ").trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || "-",
        targetCountry: data.targetCountry,
        targetGroup: data.targetGroup,
        propertyType: data.propertyType,
        website: data.website || "-",
        formLocation: data.formLocation || "-",
        sourceUrl: data.sourceUrl || window.location.href,
        privacyAccepted: data.privacyAccepted ? "yes" : "no",
        message: data.message,
        _replyto: data.email,
        _subject: applicationSubject(data),
        _template: "table",
        _captcha: "false"
      })
    });
    var payload = await response.json().catch(function () { return {}; });

    if (!response.ok || String(payload.success || "").toLowerCase() === "false") {
      throw new Error(payload.message || "Application could not be sent.");
    }

    return {
      ok: true,
      message: "Application sent to info@crays.org."
    };
  }

  async function sendWithCraysApi(data) {
    var response = await fetch(APPLICATION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    var payload = await response.json().catch(function () { return {}; });

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Application could not be sent.");
    }

    return payload;
  }

  async function sendApplication(data) {
    try {
      return await sendWithFormSubmit(data);
    } catch (formSubmitError) {
      return sendWithCraysApi(data);
    }
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
      if (data.companyWebsite) {
        form.reset();
        setStatus(form, "success", "Application sent. We will review it and reply from info@crays.org.");
        return;
      }

      var payload = await sendApplication(data);
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
