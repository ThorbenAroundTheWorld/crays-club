(function () {
  var root = document.querySelector("[data-account-root]");
  if (!root) return;

  var page = root.getAttribute("data-flow-page") || "login";
  var villas = window.CRAYS_VILLA_DATA || [];
  var statusNode = document.querySelector("[data-account-status]");
  var accountKey = "craysAccount";
  var wishKey = "craysWishList";
  var legacyWishKey = "craysWatchList";
  var cartKey = "craysCart";
  var customerEndpoint = "/api/customers";
  var sessionEndpoint = "/api/session";
  var authFeedbackHandled = false;

  function readJson(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function showStatus(message, tone) {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.dataset.tone = tone || "default";
    statusNode.classList.add("is-visible");
    window.clearTimeout(showStatus.timeout);
    showStatus.timeout = window.setTimeout(function () {
      statusNode.classList.remove("is-visible");
    }, 5600);
  }

  function money(value) {
    return Number(value || 0).toLocaleString("de-DE") + " EUR";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function villaBySlug(slug) {
    return villas.find(function (villa) { return villa.slug === slug; }) || villas[0];
  }

  function heroImage(villa) {
    return villa && (villa.image || (villa.gallery && villa.gallery[0])) || "/assets/crays-villas/andratx.jpg";
  }

  function wishSlugs() {
    var modern = readJson(wishKey, []);
    var legacy = readJson(legacyWishKey, []);
    return Array.from(new Set([].concat(modern || [], legacy || []).filter(Boolean)));
  }

  function setWishSlugs(slugs) {
    var unique = Array.from(new Set(slugs.filter(Boolean)));
    writeJson(wishKey, unique);
    writeJson(legacyWishKey, unique);
  }

  function cartItems() {
    var stored = readJson(cartKey, []);
    var requests = [];
    try {
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i);
        if (!key || key.indexOf("craysBookingRequest:") !== 0) continue;
        var request = JSON.parse(localStorage.getItem(key));
        if (!request || !request.villa) continue;
        requests.push({
          id: request.reference || key,
          slug: request.villa,
          dateFrom: request.dates && request.dates.from,
          dateTo: request.dates && request.dates.to,
          nights: request.dates && request.dates.nights,
          guests: request.guests && (Number(request.guests.adults || 0) + Number(request.guests.children || 0)),
          total: request.totals && request.totals.total,
          source: "request"
        });
      }
    } catch (error) {}
    return [].concat(stored || [], requests);
  }

  function setCartItems(items) {
    writeJson(cartKey, items.filter(function (item) { return item.source !== "request"; }));
  }

  function account() {
    return readJson(accountKey, null);
  }

  function accountName(current) {
    if (!current) return "";
    return current.name || [current.firstName, current.lastName].filter(Boolean).join(" ") || current.email || "";
  }

  function initials(current) {
    var label = accountName(current) || "Crays";
    return label.split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) {
      return part.charAt(0).toUpperCase();
    }).join("") || "C";
  }

  function sessionBadge(current) {
    if (!current) return '<span class="account-sync-badge account-sync-badge--pending">No session</span>';
    if (current.backendSynced) return '<span class="account-sync-badge">Backend synced</span>';
    return '<span class="account-sync-badge account-sync-badge--pending">Local pending</span>';
  }

  function defaultDateTo() {
    var date = new Date("2026-06-26T00:00:00");
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }

  function addToCart(slug) {
    var villa = villaBySlug(slug);
    if (!villa) return;
    var items = readJson(cartKey, []);
    var existing = items.find(function (item) { return item.slug === villa.slug; });
    var next = {
      id: "cart-" + villa.slug,
      slug: villa.slug,
      dateFrom: "2026-06-26",
      dateTo: defaultDateTo(),
      nights: 7,
      guests: 2,
      total: villa.price || 0,
      source: "cart"
    };
    if (existing) {
      Object.assign(existing, next);
    } else {
      items.push(next);
    }
    writeJson(cartKey, items);
  }

  function addWish(slug) {
    var slugs = wishSlugs();
    if (slugs.indexOf(slug) === -1) slugs.push(slug);
    setWishSlugs(slugs);
  }

  function accountReturnPath() {
    var params = new URLSearchParams(window.location.search);
    ["auth_provider", "auth_error", "auth", "customer"].forEach(function (key) {
      params.delete(key);
    });
    var query = params.toString();
    return window.location.pathname + (query ? "?" + query : "") + window.location.hash;
  }

  function authUrl(provider) {
    var returnTo = accountReturnPath();
    return "/api/auth/" + provider + "?returnTo=" + encodeURIComponent(returnTo || "/account");
  }

  function providerLabel(provider) {
    if (provider === "linkedin") return "LinkedIn";
    if (provider === "google") return "Google";
    return "Social";
  }

  async function hydrateSessionFromBackend(provider) {
    try {
      var response = await fetch(sessionEndpoint, {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok || !data.customer) return false;
      writeJson(accountKey, Object.assign({}, data.customer, {
        backendSynced: true,
        signedInAt: new Date().toISOString()
      }));
      render();
      showStatus(providerLabel(provider) + " login connected. Your Crays profile is ready.");
      return true;
    } catch (error) {
      return false;
    }
  }

  function handleAuthFeedback() {
    if (authFeedbackHandled) return;
    authFeedbackHandled = true;
    var params = new URLSearchParams(window.location.search);
    var provider = params.get("auth_provider") || "";
    var error = params.get("auth_error");
    var auth = params.get("auth");
    if (error) {
      var providerName = providerLabel(provider);
      var setupCopy = error.indexOf("missing_") === 0
        ? providerName + " login is not configured in Vercel yet. Use email for now."
        : providerName + " login could not be completed: " + error;
      showStatus(setupCopy, "error");
      return;
    }
    if (auth === "success") {
      hydrateSessionFromBackend(provider).then(function (hydrated) {
        if (!hydrated) {
          showStatus(providerLabel(provider) + " login reached Crays, but the local profile could not be loaded yet.", "error");
        }
      });
    }
  }

  function socialButtons() {
    return '<div class="account-social-grid" aria-label="Social login">' +
      '<a class="account-social-button" href="' + authUrl("google") + '" data-social-auth="google"><span class="account-provider-icon account-provider-icon--google">G</span><strong>Continue with Google</strong><small>Best for guests and members</small></a>' +
      '<a class="account-social-button" href="' + authUrl("linkedin") + '" data-social-auth="linkedin"><span class="account-provider-icon account-provider-icon--linkedin">in</span><strong>Continue with LinkedIn</strong><small>Best for founders and teams</small></a>' +
    '</div>';
  }

  function authForm(mode) {
    var current = account();
    var title = mode === "update" ? "Profile details" : "Create your Crays account";
    var copy = mode === "update"
      ? "Keep your profile ready for booking requests, membership access and Crays follow-up."
      : "Use Google or LinkedIn when available, or create an account with email in under a minute.";
    var consent = mode === "update" ? "" : '<label class="account-consent"><input type="checkbox" name="consent" required><span>I agree that Crays may create my account and process my data for booking, membership and service requests. <a href="/legal/privacy-policy">Privacy Policy</a></span></label>';
    return '<div class="account-auth-card">' +
      '<div class="account-auth-head"><p class="account-kicker">Sign up</p><h2>' + title + '</h2><p>' + copy + '</p></div>' +
      socialButtons() +
      '<div class="account-divider"><span>Email fallback</span></div>' +
      '<form class="account-form account-signup-form" data-auth-form data-auth-mode="' + escapeHtml(mode || "signup") + '">' +
        '<div class="account-form-grid">' +
          '<label class="account-field">First name<input type="text" name="firstName" value="' + escapeHtml(current && current.firstName || "") + '" autocomplete="given-name" required></label>' +
          '<label class="account-field">Last name<input type="text" name="lastName" value="' + escapeHtml(current && current.lastName || "") + '" autocomplete="family-name"></label>' +
        '</div>' +
        '<label class="account-field">Email<input type="email" name="email" value="' + escapeHtml(current && current.email || "") + '" autocomplete="email" required></label>' +
        '<label class="account-field">Phone<input type="tel" name="phone" value="' + escapeHtml(current && current.phone || "") + '" autocomplete="tel" placeholder="+49 ..."></label>' +
        '<label class="account-field">Main intent<select name="intent" required>' +
          option("villa-booking", "Book villas and stays", current && current.intent) +
          option("membership", "Become a member", current && current.intent) +
          option("company-team", "Company or team access", current && current.intent) +
          option("creator-partner", "Creator or brand partner", current && current.intent) +
          option("owner-investor", "Villa owner or investor", current && current.intent) +
        '</select></label>' +
        consent +
        '<button class="account-button" type="submit">' + (mode === "update" ? "Update profile" : "Create account with email") + '</button>' +
      '</form>' +
    '</div>';
  }

  function option(value, label, current) {
    return '<option value="' + value + '"' + (current === value ? " selected" : "") + '>' + label + '</option>';
  }

  function accountSummary() {
    var current = account();
    if (!current) {
      return '<p>No active Crays account yet.</p><a class="account-button" href="/account">Create account</a>';
    }
    return '<p>Signed in as</p><strong>' + escapeHtml(accountName(current)) + '</strong><span>' + escapeHtml(current.email) + '</span>' + sessionBadge(current) + '<a class="account-button-secondary" href="/account">Account area</a>';
  }

  function profilePanel(current) {
    if (!current) return authForm("signup");
    return '<div class="account-profile-card">' +
      '<div class="account-profile-avatar">' + escapeHtml(initials(current)) + '</div>' +
      '<div><p class="account-kicker">Crays profile</p><h2>' + escapeHtml(accountName(current)) + '</h2><p>' + escapeHtml(current.email) + '</p></div>' +
      '<dl class="account-profile-list">' +
        '<div><dt>Phone</dt><dd>' + escapeHtml(current.phone || "Not set") + '</dd></div>' +
        '<div><dt>Main intent</dt><dd>' + escapeHtml(intentLabel(current.intent)) + '</dd></div>' +
        '<div><dt>Provider</dt><dd>' + escapeHtml(current.provider || "email") + '</dd></div>' +
        '<div><dt>Backend</dt><dd>' + (current.backendSynced ? "Synced" : "Pending") + '</dd></div>' +
      '</dl>' +
      '<button class="account-link-button" type="button" data-show-profile-form>Update profile</button>' +
    '</div>';
  }

  function intentLabel(value) {
    var labels = {
      "villa-booking": "Book villas and stays",
      membership: "Become a member",
      "company-team": "Company or team access",
      "creator-partner": "Creator or brand partner",
      "owner-investor": "Villa owner or investor"
    };
    return labels[value] || "Book villas and stays";
  }

  function villaCard(villa, mode) {
    if (!villa) return "";
    var meta = [villa.guests + " guests", villa.bedrooms + " bedrooms", villa.bathrooms + " baths"].map(function (item) {
      return "<span>" + escapeHtml(item) + "</span>";
    }).join("");
    var actions = mode === "cart"
      ? '<a class="account-button-secondary" href="/villas/' + villa.slug + '">View villa</a><button class="account-link-button" type="button" data-remove-cart="' + villa.slug + '">Remove</button>'
      : '<a class="account-button-secondary" href="/villas/' + villa.slug + '">View villa</a><button class="account-button" type="button" data-add-cart="' + villa.slug + '">Add to cart</button><button class="account-link-button" type="button" data-remove-wish="' + villa.slug + '">Remove</button>';
    return '<article class="account-card">' +
      '<img src="' + escapeHtml(heroImage(villa)) + '" alt="' + escapeHtml(villa.name) + '" loading="lazy">' +
      '<div class="account-card-body"><small>' + escapeHtml(villa.place) + '</small><h3>' + escapeHtml(villa.name) + '</h3><p>' + escapeHtml(villa.intro || villa.hero || "Crays villa stay") + '</p><div class="account-card-meta">' + meta + '<span>' + money(villa.price) + '</span></div></div>' +
      '<div class="account-card-actions">' + actions + '</div>' +
    '</article>';
  }

  function suggestionCards(mode) {
    return villas.slice(0, 3).map(function (villa) {
      var action = mode === "cart"
        ? '<button class="account-button" type="button" data-add-cart="' + villa.slug + '">Add to cart</button>'
        : '<button class="account-button" type="button" data-add-wish="' + villa.slug + '">Save villa</button>';
      return '<article class="account-card">' +
        '<img src="' + escapeHtml(heroImage(villa)) + '" alt="' + escapeHtml(villa.name) + '" loading="lazy">' +
        '<div class="account-card-body"><small>' + escapeHtml(villa.place) + '</small><h3>' + escapeHtml(villa.name) + '</h3><p>' + escapeHtml(villa.intro || "Crays villa stay") + '</p><div class="account-card-meta"><span>' + villa.guests + ' guests</span><span>' + money(villa.price) + '</span></div></div>' +
        '<div class="account-card-actions"><a class="account-button-secondary" href="/villas/' + villa.slug + '">View villa</a>' + action + '</div>' +
      '</article>';
    }).join("");
  }

  function flowChecklist() {
    return '<div class="account-flow-grid" aria-label="Crays account flow">' +
      '<article><span>01</span><strong>Create account</strong><p>Google, LinkedIn or email profile connected to the Crays backend.</p></article>' +
      '<article><span>02</span><strong>Save intent</strong><p>Membership, villa booking, team access and partner interest stay attached.</p></article>' +
      '<article><span>03</span><strong>Use the flow</strong><p>Wish List, cart and booking requests stay visible after login.</p></article>' +
      '<article><span>04</span><strong>Crays follows up</strong><p>The backend record gives the team one customer source of truth.</p></article>' +
    '</div>';
  }

  function renderAccount() {
    var current = account();
    var saved = wishSlugs().map(villaBySlug).filter(Boolean);
    var items = cartItems();
    var requests = items.filter(function (item) { return item.source === "request"; });
    var subtotal = items.reduce(function (sum, item) { return sum + Number(item.total || (villaBySlug(item.slug) || {}).price || 0); }, 0);
    var savedBody = saved.length
      ? saved.map(function (villa) { return villaCard(villa, "wish"); }).join("")
      : '<div class="account-empty"><strong>No saved villas yet</strong><p>Use the villa search or detail pages to save houses into this unified flow.</p><div class="account-two-actions"><a class="account-button" href="/search">Search villas</a></div></div>' + suggestionCards("wish");
    var cartBody = items.length
      ? items.map(function (item) { return villaCard(villaBySlug(item.slug), "cart"); }).join("")
      : '<div class="account-empty"><strong>No cart or booking request yet</strong><p>Add a villa to the cart or send a booking request from a villa detail page.</p><div class="account-two-actions"><a class="account-button" href="/search">Search villas</a></div></div>' + suggestionCards("cart");
    var panel = current ? profilePanel(current) : authForm("signup");
    var headline = current ? "Your Crays account is ready for the real-world flow." : "Create your Crays account for stays, membership and access.";
    var lead = current ? "Profile, Wish List, Cart and booking requests stay connected after login." : "Start with Google, LinkedIn or email. Crays stores the customer profile in the backend and keeps the front-end flow simple.";
    root.innerHTML = '<section class="account-hero account-hero-unified"><div class="account-shell account-hero-grid">' +
      '<div class="account-hero-copy"><p class="account-kicker">Account & Booking</p><h1>' + headline + '</h1><p>' + lead + '</p>' + flowChecklist() + '</div>' +
      panel + '</div></section>' +
      '<section class="account-main"><div class="account-shell account-layout account-layout-unified"><div class="account-section account-stack">' +
      '<div class="account-section-head" id="saved-villas"><div><p class="account-kicker">Wish List</p><h2>Saved villas</h2></div><a class="account-button-secondary" href="/search">Search Villas</a></div><div class="account-list">' + savedBody + '</div>' +
      '<div class="account-section-head" id="cart-requests"><div><p class="account-kicker">Cart & Requests</p><h2>Cart and booking requests</h2></div><button class="account-button" type="button" data-checkout>Request checkout</button></div><div class="account-list">' + cartBody + '</div></div>' +
      '<aside class="account-summary"><h2>Flow summary</h2><div class="account-summary-row"><span>Saved villas</span><strong>' + saved.length + '</strong></div><div class="account-summary-row"><span>Cart / requests</span><strong>' + items.length + '</strong></div><div class="account-summary-row"><span>Booking requests</span><strong>' + requests.length + '</strong></div><div class="account-summary-row"><span>Estimated subtotal</span><strong>' + money(subtotal) + '</strong></div><a class="account-button-secondary" href="/search">Continue search</a>' + accountSummary() + '</aside></div></section>';
  }

  function renderLogin() {
    renderAccount();
  }

  function renderWishList() {
    renderAccount();
    window.requestAnimationFrame(function () {
      document.getElementById("saved-villas")?.scrollIntoView({ block: "start" });
    });
  }

  function renderCart() {
    renderAccount();
    window.requestAnimationFrame(function () {
      document.getElementById("cart-requests")?.scrollIntoView({ block: "start" });
    });
  }

  function customerFromForm(form) {
    var data = new FormData(form);
    var firstName = String(data.get("firstName") || "").trim();
    var lastName = String(data.get("lastName") || "").trim();
    return {
      id: account() && account().id || "",
      provider: "email",
      email: String(data.get("email") || "").trim().toLowerCase(),
      firstName: firstName,
      lastName: lastName,
      name: [firstName, lastName].filter(Boolean).join(" "),
      phone: String(data.get("phone") || "").trim(),
      intent: String(data.get("intent") || "villa-booking"),
      source: "craysclub-account",
      page: window.location.pathname,
      wishList: wishSlugs(),
      cart: cartItems(),
      updatedAt: new Date().toISOString()
    };
  }

  async function syncCustomer(customer, eventType) {
    var response = await fetch(customerEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: eventType || "customer.upsert",
        customer: customer,
        context: {
          path: window.location.pathname,
          userAgent: navigator.userAgent,
          referrer: document.referrer || ""
        }
      })
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Backend sync failed");
    }
    return data;
  }

  async function saveCustomerFromForm(form) {
    var button = form.querySelector("button[type='submit']");
    var customer = customerFromForm(form);
    if (!customer.email) {
      showStatus("Please enter an email address.", "error");
      return;
    }
    if (button) {
      button.disabled = true;
      button.textContent = "Creating account...";
    }
    try {
      var result = await syncCustomer(customer, "customer.upsert");
      var savedCustomer = Object.assign({}, customer, result.customer || {}, {
        backendSynced: true,
        backendMode: result.persistence || "backend",
        signedInAt: new Date().toISOString()
      });
      writeJson(accountKey, savedCustomer);
      showStatus("Account created and synced with the Crays backend.");
    } catch (error) {
      writeJson(accountKey, Object.assign({}, customer, {
        id: customer.id || "local-" + Date.now().toString(36),
        backendSynced: false,
        backendError: error.message,
        signedInAt: new Date().toISOString()
      }));
      showStatus("Account saved locally. Backend sync is pending: " + error.message, "error");
    } finally {
      render();
    }
  }

  async function persistCheckout(reference, payload) {
    var current = account();
    if (!current) return;
    try {
      await syncCustomer(Object.assign({}, current, {
        checkoutReference: reference,
        checkout: payload,
        wishList: wishSlugs(),
        cart: cartItems()
      }), "checkout.requested");
    } catch (error) {}
  }

  function render() {
    if (page === "cart") renderCart();
    else if (page === "wish-list") renderWishList();
    else if (page === "login") renderLogin();
    else renderAccount();
  }

  root.addEventListener("submit", function (event) {
    if (!event.target.matches("[data-auth-form]")) return;
    event.preventDefault();
    saveCustomerFromForm(event.target);
  });

  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-show-profile-form]")) {
      var card = event.target.closest(".account-profile-card");
      if (card) card.outerHTML = authForm("update");
      return;
    }

    var addWishButton = event.target.closest("[data-add-wish]");
    if (addWishButton) {
      addWish(addWishButton.getAttribute("data-add-wish"));
      showStatus("Villa saved to Wish List.");
      render();
      return;
    }

    var removeWishButton = event.target.closest("[data-remove-wish]");
    if (removeWishButton) {
      setWishSlugs(wishSlugs().filter(function (slug) { return slug !== removeWishButton.getAttribute("data-remove-wish"); }));
      showStatus("Villa removed from Wish List.");
      render();
      return;
    }

    var addCartButton = event.target.closest("[data-add-cart]");
    if (addCartButton) {
      addToCart(addCartButton.getAttribute("data-add-cart"));
      showStatus("Villa added to cart.");
      render();
      return;
    }

    var removeCartButton = event.target.closest("[data-remove-cart]");
    if (removeCartButton) {
      var slug = removeCartButton.getAttribute("data-remove-cart");
      setCartItems(readJson(cartKey, []).filter(function (item) { return item.slug !== slug; }));
      showStatus("Villa removed from cart.");
      render();
      return;
    }

    if (event.target.closest("[data-checkout]")) {
      if (!account()) {
        window.location.href = "/account";
        return;
      }
      var items = cartItems();
      var subtotal = items.reduce(function (sum, item) { return sum + Number(item.total || (villaBySlug(item.slug) || {}).price || 0); }, 0);
      var reference = "CRC-" + Date.now().toString(36).toUpperCase().slice(-6);
      var payload = {
        reference: reference,
        items: items,
        subtotal: subtotal,
        deposit: Math.round(subtotal * 0.3),
        account: account(),
        status: "availabilityRequested",
        createdAt: new Date().toISOString()
      };
      writeJson("craysCheckoutRequest:" + reference, payload);
      persistCheckout(reference, payload);
      showStatus("Checkout request " + reference + " prepared for Crays confirmation.");
    }
  });

  render();
  handleAuthFeedback();
})();
