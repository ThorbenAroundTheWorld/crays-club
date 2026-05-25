(function () {
  var data = window.CRAYS_SEARCH_CMS;
  var root = document.querySelector("[data-search-cms]");
  var utility = document.querySelector("[data-search-utility]");
  if (!data) return;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderUtility() {
    if (!utility) return;
    utility.innerHTML = data.utility.map(function (item) {
      if (item.kind === "phone" || item.kind === "phoneVisible") {
        return '<a class="utility-button utility-phone" href="' + escapeHtml(item.href) + '"><span>' + escapeHtml(item.label) + '</span><strong>' + escapeHtml(item.phone) + '</strong></a>';
      }
      var target = item.external ? ' target="_blank" rel="noreferrer noopener"' : "";
      return '<a class="utility-button" href="' + escapeHtml(item.href) + '"' + target + '>' + escapeHtml(item.label) + '</a>';
    }).join("");
  }

  function linkGrid(items, className) {
    return '<div class="' + className + '">' + items.map(function (item) {
      var target = /^https?:\/\//.test(item.href || "") ? ' target="_blank" rel="noreferrer noopener"' : "";
      var image = item.image ? '<img src="' + escapeHtml(item.image) + '" alt="" loading="lazy" />' : "";
      var copy = '<strong>' + escapeHtml(item.name || item.title) + '</strong>' + (item.text ? '<span>' + escapeHtml(item.text) + '</span>' : "");
      return '<a href="' + escapeHtml(item.href) + '"' + target + '>' + image + copy + '</a>';
    }).join("") + '</div>';
  }

  function ownerPoints(points) {
    if (!Array.isArray(points) || !points.length) return "";
    return '<ul class="search-cms-owner-points">' + points.map(function (point) {
      return '<li>' + escapeHtml(point) + '</li>';
    }).join("") + '</ul>';
  }

  function ownerBenefits(items) {
    if (!Array.isArray(items) || !items.length) return "";
    return '<div class="search-cms-owner-benefits">' + items.map(function (item) {
      return '<article><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.text) + '</span></article>';
    }).join("") + '</div>';
  }

  function fundPoints(points) {
    if (!Array.isArray(points) || !points.length) return "";
    return '<ul class="search-cms-fund-points">' + points.map(function (point) {
      return '<li>' + escapeHtml(point) + '</li>';
    }).join("") + '</ul>';
  }

  function renderRoot() {
    if (!root) return;
    root.innerHTML =
      '<section class="search-cms-trust" aria-label="Crays villa trust signals">' +
        data.trust.map(function (item) { return '<article><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.text) + '</span></article>'; }).join("") +
      '</section>' +
      '<section class="search-cms-section search-cms-promos" aria-label="Crays villa highlights">' +
        data.promos.map(function (promo) {
          return '<a class="search-cms-promo" href="' + escapeHtml(promo.href) + '"><img src="' + escapeHtml(promo.image) + '" alt="" loading="lazy" /><span class="search-cms-card-copy"><strong>' + escapeHtml(promo.title) + '</strong><span>' + escapeHtml(promo.text) + '</span></span></a>';
        }).join("") +
      '</section>' +
      '<section class="search-cms-section search-cms-two-col">' +
        '<div><div class="search-cms-head"><p class="villa-eyebrow">Popular destinations</p><h2>Crays villa regions on Mallorca</h2></div>' + linkGrid(data.destinations, "search-cms-link-grid") + '</div>' +
        '<div><div class="search-cms-head"><p class="villa-eyebrow">Collections</p><h2>Start with the stay type</h2></div>' + linkGrid(data.collections, "search-cms-link-grid") + '</div>' +
      '</section>' +
      '<section class="search-cms-section search-cms-owner">' +
        '<div class="search-cms-owner-copy"><p class="villa-eyebrow">' + escapeHtml(data.ownerCta.eyebrow || "Owners") + '</p><h2>' + escapeHtml(data.ownerCta.title) + '</h2><p class="search-cms-owner-summary">' + escapeHtml(data.ownerCta.text) + '</p>' + ownerBenefits(data.ownerCta.benefits) + ownerPoints(data.ownerCta.points) + '<p class="search-cms-owner-note">' + escapeHtml(data.ownerCta.note || "") + '</p><a href="' + escapeHtml(data.ownerCta.href) + '" target="_blank" rel="noreferrer noopener"> ' + escapeHtml(data.ownerCta.label) + '</a></div><figure class="search-cms-owner-media"><img src="' + escapeHtml(data.ownerCta.image) + '" alt="" loading="lazy" /></figure>' +
      '</section>' +
      '<section class="search-cms-section search-cms-editorial" data-search-editorial>' +
        '<div class="search-cms-head"><p class="villa-eyebrow">Guide</p><h2>' + escapeHtml(data.editorial.title) + '</h2><p>' + escapeHtml(data.editorial.intro) + '</p></div>' +
        '<div class="search-cms-editorial-grid">' + data.editorial.sections.map(function (section) {
          return '<article><img src="' + escapeHtml(section.image) + '" alt="" loading="lazy" /><div><h3>' + escapeHtml(section.title) + '</h3><p>' + escapeHtml(section.text) + '</p></div></article>';
        }).join("") + '</div><button class="search-cms-toggle" type="button" data-editorial-toggle>Show more</button>' +
      '</section>' +
      '<section class="search-cms-section"><div class="search-cms-head"><p class="villa-eyebrow">Guest reviews</p><h2>What guests remember</h2></div><div class="search-cms-review-grid">' +
        data.reviews.map(function (review) {
          return '<article><strong>' + escapeHtml(review.rating) + ' / 5</strong><p>' + escapeHtml(review.text) + '</p><span>' + escapeHtml(review.name) + ', ' + escapeHtml(review.date) + '</span></article>';
        }).join("") + '</div></section>' +
      '<section class="search-cms-section search-cms-faq" aria-label="Crays villa FAQ"><div class="search-cms-head"><p class="villa-eyebrow">FAQ</p><h2>Questions before booking</h2></div>' +
        data.faq.map(function (item, index) {
          return '<article><button type="button" data-faq-toggle="' + index + '" aria-expanded="false">' + escapeHtml(item.question) + '</button><p hidden>' + escapeHtml(item.answer) + '</p></article>';
        }).join("") + '</section>' +
      '<section class="search-cms-section search-cms-fund"><div><p class="villa-eyebrow">' + escapeHtml(data.fundNote.eyebrow) + '</p><h2>' + escapeHtml(data.fundNote.title) + '</h2><p>' + escapeHtml(data.fundNote.text) + '</p>' + fundPoints(data.fundNote.points) + '<a href="' + escapeHtml(data.fundNote.href) + '" target="_blank" rel="noreferrer noopener">' + escapeHtml(data.fundNote.label) + '</a></div><img src="' + escapeHtml(data.fundNote.image) + '" alt="" loading="lazy" /></section>' +
      '<section class="search-cms-section search-cms-explore"><div><p class="villa-eyebrow">Explore</p><h2>Continue through Crays</h2></div>' + linkGrid(data.footerExplore, "search-cms-link-grid") + '</section>';
  }

  document.addEventListener("click", function (event) {
    var editorialToggle = event.target.closest("[data-editorial-toggle]");
    if (editorialToggle) {
      var editorial = document.querySelector("[data-search-editorial]");
      var expanded = editorial.classList.toggle("is-expanded");
      editorialToggle.textContent = expanded ? "Show less" : "Show more";
    }

    var faqToggle = event.target.closest("[data-faq-toggle]");
    if (faqToggle) {
      var answer = faqToggle.parentElement.querySelector("p");
      var hidden = answer.hidden;
      answer.hidden = !hidden;
      faqToggle.setAttribute("aria-expanded", hidden ? "true" : "false");
    }
  });

  renderUtility();
  renderRoot();
})();
