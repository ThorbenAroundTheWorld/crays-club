(function () {
  const root = document.querySelector("[data-booking-root]");
  if (!root) return;

  const backendBase = (
    document.documentElement.getAttribute("data-booking-backend") ||
    window.CRAYS_BOOKING_BACKEND_URL ||
    "http://127.0.0.1:8088"
  ).replace(/\/+$/, "");

  const hotel = {
    id: "1",
    categoryId: "7",
    name: "Crays Villas",
    frontendName: "Crays Villas",
    location: "Mallorca",
    checkIn: "12:00",
    checkOut: "11:00",
    email: "stay@craysclub.com",
    phone: "0987654321",
    source: "Crays villa portfolio",
    image: "/assets/crays-club/crays-booking-demo-hero.jpg",
    summary:
      "A local test property used as the first booking backend shape for the Crays Club front layer.",
  };

  const rooms = [
    {
      slug: "general-rooms",
      productId: "1",
      name: "General Rooms",
      price: "1000.00",
      image: "/assets/crays-club/hotel-lounge.webp",
      short:
        "Space and comfort with multiple bedrooms, a cozy living area, flat-screen TVs, Wi-Fi and a kitchenette.",
    },
    {
      slug: "delux-rooms",
      productId: "2",
      name: "Delux Rooms",
      price: "1500.00",
      image: "/assets/crays-club/city-lounge-night.jpg",
      short:
        "Lake-view demo room with a king-sized bed, elegant furnishings and a spacious sitting area.",
    },
    {
      slug: "executive-rooms",
      productId: "3",
      name: "Executive Rooms",
      price: "2000.00",
      image: "/assets/crays-club/work-hero.jpg",
      short:
        "Separate living and sleeping areas, a luxurious bathroom and exclusive lounge access for business travelers.",
    },
    {
      slug: "luxury-rooms",
      productId: "4",
      name: "Luxury Rooms",
      price: "2500.00",
      image: "/assets/crays-club/city-pool.webp",
      short:
        "A calm premium room with expansive views, a queen-sized bed, workspace and serene decor.",
    },
  ];

  const services = [
    {
      slug: "room-maintenance-fees",
      productId: "5",
      name: "Room Maintenance Fees",
      price: "250.00",
      short: "Keeps accommodation pristine and hassle-free throughout the stay.",
    },
    {
      slug: "internet-handling-charges",
      productId: "6",
      name: "Internet Handling Charges",
      price: "250.00",
      short: "Reliable high-speed access for a smoother online journey.",
    },
    {
      slug: "airport-shuttle",
      productId: "7",
      name: "Airport Shuttle",
      price: "50.00",
      short: "A simple transfer layer from touchdown to check-in.",
    },
    {
      slug: "cab-on-demand",
      productId: "8",
      name: "Cab on Demand",
      price: "200.00",
      short: "Local travel support for city discovery and flexible movement.",
    },
    {
      slug: "breakfast",
      productId: "9",
      name: "Breakfast",
      price: "350.00",
      short: "A hearty morning service prepared for the day ahead.",
    },
    {
      slug: "dinner",
      productId: "10",
      name: "Dinner",
      price: "450.00",
      short: "Evening dining service for a complete stay experience.",
    },
  ];

  const pages = [
    { slug: "policies", cmsId: "1", title: "Policies" },
    { slug: "legal-notice", cmsId: "2", title: "Legal Notice" },
    { slug: "terms-and-conditions-of-use", cmsId: "3", title: "Terms and Conditions" },
    { slug: "about-us", cmsId: "4", title: "About Us" },
    { slug: "secure-payment", cmsId: "5", title: "Secure payment" },
  ];

  const formatMoney = (value) => "$" + Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const escapeHtml = (value) =>
    String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));

  const backendUrl = (params) => {
    const url = new URL("/index.php", backendBase + "/");
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  };

  const productBackendUrl = (productId) =>
    backendUrl({ id_product: productId, controller: "product", id_lang: "1" });

  const cmsBackendUrl = (cmsId) =>
    backendUrl({ id_cms: cmsId, controller: "cms", id_lang: "1" });

  const propertyBackendUrl = () =>
    backendUrl({ controller: "our-properties" });

  const pad = (number) => String(number).padStart(2, "0");

  const dateAfter = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const buildOccupancies = (guests) => {
    const total = Math.max(1, Math.min(Number.parseInt(guests || "1", 10) || 1, 8));
    const roomsNeeded = Math.ceil(total / 2);
    let remaining = total;
    return Array.from({ length: roomsNeeded }, () => {
      const adults = Math.min(2, remaining);
      remaining -= adults;
      return { adults, children: 0 };
    });
  };

  const searchBackendUrl = (params) => {
    const query = {
      id_category: hotel.categoryId,
      controller: "category",
      id_lang: "1",
      date_from: params.checkin || dateAfter(1),
      date_to: params.checkout || dateAfter(3),
    };

    buildOccupancies(params.guests).forEach((room, index) => {
      query[`occupancy[${index}][adults]`] = String(room.adults);
      query[`occupancy[${index}][children]`] = String(room.children);
    });

    return backendUrl(query);
  };

  const linkCard = ({ href, title, text, meta, image }) => `
    <article class="booking-card">
      ${image ? `<img src="${image}" alt="${escapeHtml(title)}" loading="lazy" />` : ""}
      <div class="booking-card-body">
        ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
        <a class="booking-text-link" href="${href}">Open</a>
      </div>
    </article>
  `;

  const roomCards = () => rooms.map((room) => linkCard({
    href: `/clubs/rooms/?room=${encodeURIComponent(room.slug)}`,
    title: room.name,
    text: room.short,
    meta: `${formatMoney(room.price)} demo rate`,
    image: room.image,
  })).join("");

  const serviceCards = () => services.map((service) => linkCard({
    href: `/clubs/services/?service=${encodeURIComponent(service.slug)}`,
    title: service.name,
    text: service.short,
    meta: `${formatMoney(service.price)} demo add-on`,
  })).join("");

  const pageCards = () => pages.map((page) => linkCard({
    href: `/clubs/pages/?page=${encodeURIComponent(page.slug)}`,
    title: page.title,
    text: `Booking CMS page id ${page.cmsId}`,
    meta: "CMS dummy page",
  })).join("");

  const renderBackendRail = (activeSearchUrl) => `
    <aside class="booking-backend-rail">
      <span>Backend</span>
      <h2>${escapeHtml(hotel.source)}</h2>
      <dl>
        <div><dt>Hotel ID</dt><dd>${hotel.id}</dd></div>
        <div><dt>Category ID</dt><dd>${hotel.categoryId}</dd></div>
        <div><dt>Check-in</dt><dd>${hotel.checkIn}</dd></div>
        <div><dt>Check-out</dt><dd>${hotel.checkOut}</dd></div>
      </dl>
      <div class="booking-action-stack">
        <a class="btn primary" href="${activeSearchUrl || searchBackendUrl({})}" target="_blank" rel="noreferrer noopener">Open Crays availability</a>
        <a class="btn secondary" href="${propertyBackendUrl()}" target="_blank" rel="noreferrer noopener">Open portfolio properties</a>
      </div>
    </aside>
  `;

  const renderOverview = () => {
    root.innerHTML = `
      <section class="booking-section booking-section-tight">
        <div class="shell booking-split">
          <div>
            <p class="club-eyebrow">Booking Layer</p>
            <h2>Crays booking inventory, shaped as a CraysClub frontend.</h2>
            <p class="booking-copy">The frontend lives in this Vercel project. The PHP booking engine remains behind it and can move from local runtime to Strato later.</p>
          </div>
          ${renderBackendRail()}
        </div>
      </section>
      <section class="booking-section">
        <div class="shell">
          <div class="booking-section-head">
            <p class="club-eyebrow">Rooms</p>
            <h2>Stay inventory</h2>
          </div>
          <div class="booking-grid">${roomCards()}</div>
        </div>
      </section>
      <section class="booking-section booking-section-muted">
        <div class="shell">
          <div class="booking-section-head">
            <p class="club-eyebrow">Services</p>
            <h2>Bookable add-ons</h2>
          </div>
          <div class="booking-grid booking-grid-compact">${serviceCards()}</div>
        </div>
      </section>
      <section class="booking-section">
        <div class="shell">
          <div class="booking-section-head">
            <p class="club-eyebrow">Booking Pages</p>
            <h2>Dummy CMS pages</h2>
          </div>
          <div class="booking-grid booking-grid-compact">${pageCards()}</div>
        </div>
      </section>
    `;
  };

  const renderSearch = () => {
    const params = new URLSearchParams(window.location.search);
    const search = {
      destination: params.get("destination") || "hotel-prime",
      checkin: params.get("checkin") || params.get("date_from") || dateAfter(1),
      checkout: params.get("checkout") || params.get("date_to") || dateAfter(3),
      guests: params.get("guests") || "1",
    };
    const activeSearchUrl = searchBackendUrl(search);

    root.innerHTML = `
      <section class="booking-section booking-section-tight">
        <div class="shell booking-split">
          <div>
          <p class="club-eyebrow">Search Results</p>
            <h2>${escapeHtml(hotel.frontendName)}</h2>
            <div class="booking-search-summary">
              <span>${escapeHtml(search.checkin)}</span>
              <span>${escapeHtml(search.checkout)}</span>
              <span>${escapeHtml(search.guests)} guest${search.guests === "1" ? "" : "s"}</span>
            </div>
            <p class="booking-copy">These room cards are rendered on the CraysClub frontend. The availability button opens the matching booking category result with dates and occupancy.</p>
          </div>
          ${renderBackendRail(activeSearchUrl)}
        </div>
      </section>
      <section class="booking-section">
        <div class="shell">
          <div class="booking-grid">${roomCards()}</div>
        </div>
      </section>
    `;
  };

  const renderRooms = () => {
    const slug = new URLSearchParams(window.location.search).get("room");
    const room = rooms.find((item) => item.slug === slug);
    if (!room) {
      root.innerHTML = `
        <section class="booking-section">
          <div class="shell">
            <div class="booking-section-head">
              <p class="club-eyebrow">Rooms</p>
              <h2>Room type inventory</h2>
            </div>
            <div class="booking-grid">${roomCards()}</div>
          </div>
        </section>
      `;
      return;
    }

    root.innerHTML = `
      <section class="booking-section">
        <div class="shell booking-detail">
          <figure class="booking-detail-media">
            <img src="${room.image}" alt="${escapeHtml(room.name)}" loading="eager" />
          </figure>
          <div class="booking-detail-copy">
            <p class="club-eyebrow">Room Type ${room.productId}</p>
            <h2>${escapeHtml(room.name)}</h2>
            <p>${escapeHtml(room.short)}</p>
            <div class="booking-price">${formatMoney(room.price)} <span>demo base rate</span></div>
            <div class="club-actions">
        <a class="btn primary" href="/search/">Search dates</a>
              <a class="btn secondary" href="${productBackendUrl(room.productId)}" target="_blank" rel="noreferrer noopener">Open backend room</a>
            </div>
          </div>
        </div>
      </section>
    `;
  };

  const renderServices = () => {
    const slug = new URLSearchParams(window.location.search).get("service");
    const service = services.find((item) => item.slug === slug);
    if (!service) {
      root.innerHTML = `
        <section class="booking-section">
          <div class="shell">
            <div class="booking-section-head">
              <p class="club-eyebrow">Services</p>
              <h2>Service products</h2>
            </div>
            <div class="booking-grid booking-grid-compact">${serviceCards()}</div>
          </div>
        </section>
      `;
      return;
    }

    root.innerHTML = `
      <section class="booking-section">
        <div class="shell booking-detail booking-detail-plain">
          <div class="booking-detail-copy">
            <p class="club-eyebrow">Service Product ${service.productId}</p>
            <h2>${escapeHtml(service.name)}</h2>
            <p>${escapeHtml(service.short)}</p>
            <div class="booking-price">${formatMoney(service.price)} <span>demo service rate</span></div>
            <div class="club-actions">
              <a class="btn primary" href="${productBackendUrl(service.productId)}" target="_blank" rel="noreferrer noopener">Open backend service</a>
              <a class="btn secondary" href="/clubs/services/">All services</a>
            </div>
          </div>
        </div>
      </section>
    `;
  };

  const renderProperties = () => {
    root.innerHTML = `
      <section class="booking-section">
        <div class="shell booking-detail">
          <figure class="booking-detail-media">
            <img src="${hotel.image}" alt="${escapeHtml(hotel.frontendName)}" loading="eager" />
          </figure>
          <div class="booking-detail-copy">
            <p class="club-eyebrow">Property ${hotel.id}</p>
            <h2>${escapeHtml(hotel.frontendName)}</h2>
            <p>${escapeHtml(hotel.summary)}</p>
            <dl class="booking-fact-list">
              <div><dt>Backend hotel</dt><dd>${escapeHtml(hotel.name)}</dd></div>
              <div><dt>Email</dt><dd>${escapeHtml(hotel.email)}</dd></div>
              <div><dt>Phone</dt><dd>${escapeHtml(hotel.phone)}</dd></div>
            </dl>
            <div class="club-actions">
        <a class="btn primary" href="/search/">Search villas</a>
              <a class="btn secondary" href="${propertyBackendUrl()}" target="_blank" rel="noreferrer noopener">Open backend property</a>
            </div>
          </div>
        </div>
      </section>
    `;
  };

  const renderPages = () => {
    const slug = new URLSearchParams(window.location.search).get("page");
    const page = pages.find((item) => item.slug === slug);
    if (!page) {
      root.innerHTML = `
        <section class="booking-section">
          <div class="shell">
            <div class="booking-section-head">
              <p class="club-eyebrow">CMS</p>
              <h2>Dummy CMS pages</h2>
            </div>
            <div class="booking-grid booking-grid-compact">${pageCards()}</div>
          </div>
        </section>
      `;
      return;
    }

    root.innerHTML = `
      <section class="booking-section">
        <div class="shell booking-detail booking-detail-plain">
          <div class="booking-detail-copy">
            <p class="club-eyebrow">CMS Page ${page.cmsId}</p>
            <h2>${escapeHtml(page.title)}</h2>
            <p>This dummy CMS route is represented in the Vercel frontend and remains linked to the original backend page.</p>
            <div class="club-actions">
              <a class="btn primary" href="${cmsBackendUrl(page.cmsId)}" target="_blank" rel="noreferrer noopener">Open backend page</a>
              <a class="btn secondary" href="/clubs/pages/">All CMS pages</a>
            </div>
          </div>
        </div>
      </section>
    `;
  };

  const page = root.getAttribute("data-booking-page");
  if (page === "search") renderSearch();
  else if (page === "rooms") renderRooms();
  else if (page === "services") renderServices();
  else if (page === "properties") renderProperties();
  else if (page === "pages") renderPages();
  else renderOverview();
}());
