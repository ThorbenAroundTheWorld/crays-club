(function () {
  var villas = [
    {
      id: 1,
      backendProductId: 1,
      backendLinkRewrite: "crays-villa-noemi",
      backendCategoryId: 7,
      slug: "villa-formentor",
      name: "Crays Villa Noemi",
      place: "Formentor",
      map: { label: "Formentor, Mallorca", latitude: 39.928, longitude: 3.119, zoom: 12 },
      type: "Luxury villa",
      price: 7000,
      searchPrice: 1487.5,
      guests: 8,
      adults: 8,
      children: 2,
      bedrooms: 4,
      bathrooms: 4,
      rating: 4.9,
      ratingLabel: "4.9 / 5",
      pets: "Pets on request",
      images: 4,
      hero: "sea-air terraces",
      intro: "Premium holiday villa in Formentor with sea-air terraces, private pool, generous living space and quiet privacy.",
      text: "Premium holiday villa in Formentor with sea-air terraces, private pool, generous living space and quiet privacy.",
      tags: ["Holiday home", "Private pool", "Pool", "Sea view", "Wi-Fi", "Air conditioning", "Beach nearby", "Pets allowed", "Sea distance: 300 m", "EV charger", "Wellness", "Boat available"]
    },
    {
      id: 2,
      backendProductId: 2,
      backendLinkRewrite: "crays-villa-son-doblons",
      backendCategoryId: 7,
      slug: "son-doblons",
      name: "Crays Villa Son Doblons",
      place: "Son Serra de Marina",
      map: { label: "Son Serra de Marina, Mallorca", latitude: 39.736, longitude: 3.228, zoom: 12 },
      type: "Luxury finca",
      price: 19942,
      searchPrice: 29664,
      guests: 16,
      adults: 16,
      children: 0,
      bedrooms: 8,
      bathrooms: 8,
      rating: 4.9,
      ratingLabel: "4.9 / 5",
      pets: "No pets",
      images: 4,
      hero: "wide terraces",
      intro: "Large estate for groups close to the north coast, with broad terraces, pool landscape and private retreat zones.",
      text: "Large estate for groups close to the north coast, with broad terraces, pool landscape and private retreat zones.",
      tags: ["Holiday home", "Private pool", "Pool", "Luxury collection", "Golf nearby", "Dishwasher", "Washing machine", "Sauna", "Whirlpool", "Garden or terrace", "Wi-Fi", "All inclusive"]
    },
    {
      id: 3,
      backendProductId: 3,
      backendLinkRewrite: "crays-villa-only-summer",
      backendCategoryId: 7,
      slug: "only-summer",
      name: "Crays Villa Only Summer",
      place: "Llubi",
      map: { label: "Llubi, Mallorca", latitude: 39.699, longitude: 3.006, zoom: 12 },
      type: "Luxury villa",
      price: 18756,
      searchPrice: 27900,
      guests: 8,
      adults: 8,
      children: 0,
      bedrooms: 4,
      bathrooms: 4,
      rating: 4.8,
      ratingLabel: "4.8 / 5",
      pets: "Pets on request",
      images: 4,
      hero: "summer garden",
      intro: "Mediterranean summer house with calm garden areas, wide outdoor living and a generous pool setting.",
      text: "Mediterranean summer house with calm garden areas, wide outdoor living and a generous pool setting.",
      tags: ["Holiday home", "Private pool", "Pool", "Garden or terrace", "High chair", "Wi-Fi", "Parking", "Fireplace", "Fishing", "Playground", "Air conditioning", "Eco stay"]
    },
    {
      id: 4,
      backendProductId: 4,
      backendLinkRewrite: "crays-villa-luxury-golf-dor",
      backendCategoryId: 7,
      slug: "luxury-golf-dor",
      name: "Crays Villa Luxury Golf d'Or",
      place: "Portocolom",
      map: { label: "Portocolom, Mallorca", latitude: 39.416, longitude: 3.258, zoom: 12 },
      type: "Golf villa",
      price: 12270,
      searchPrice: 18252,
      guests: 10,
      adults: 10,
      children: 0,
      bedrooms: 5,
      bathrooms: 5,
      rating: 4.8,
      ratingLabel: "4.8 / 5",
      pets: "No pets",
      images: 5,
      hero: "golf-side architecture",
      intro: "Golf-side villa near Portocolom with clean architecture, pool terraces and easy access to the coast.",
      text: "Golf-side villa near Portocolom with clean architecture, pool terraces and easy access to the coast.",
      tags: ["Holiday home", "Private pool", "Pool", "Golf nearby", "Sea view", "Luxury collection", "Air conditioning", "Sauna", "Whirlpool", "EV charger", "Boat available", "Wi-Fi"]
    },
    {
      id: 11,
      backendProductId: 11,
      backendLinkRewrite: "crays-villa-can-eretat",
      backendCategoryId: 7,
      slug: "can-eretat",
      name: "Crays Villa Can Eretat",
      place: "Capdepera",
      map: { label: "Capdepera, Mallorca", latitude: 39.702, longitude: 3.435, zoom: 12 },
      type: "Holiday home",
      price: 10288,
      searchPrice: 15304,
      guests: 8,
      adults: 8,
      children: 0,
      bedrooms: 5,
      bathrooms: 5,
      rating: 4.8,
      ratingLabel: "4.8 / 5",
      pets: "No pets",
      images: 4,
      hero: "green hill privacy",
      intro: "Quiet hill villa surrounded by greenery, built for privacy, pool days and focused time away.",
      text: "Quiet hill villa surrounded by greenery, built for privacy, pool days and focused time away.",
      tags: ["Holiday home", "Private pool", "Pool", "Landscape view", "Parking", "Dishwasher", "Flexible arrival", "Garden or terrace", "Wi-Fi", "Air conditioning"]
    },
    {
      id: 12,
      backendProductId: 12,
      backendLinkRewrite: "crays-villa-casablanca",
      backendCategoryId: 7,
      slug: "casablanca",
      name: "Crays Villa Casablanca",
      place: "Sa Font de Sa Cala",
      map: { label: "Sa Font de Sa Cala, Mallorca", latitude: 39.684, longitude: 3.454, zoom: 13 },
      type: "Sea view villa",
      price: 10236,
      searchPrice: 15226,
      guests: 8,
      adults: 8,
      children: 0,
      bedrooms: 4,
      bathrooms: 3,
      rating: 5,
      ratingLabel: "5 / 5",
      pets: "Pets on request",
      images: 4,
      hero: "white coastal terraces",
      intro: "White coastal villa with bright terraces, sea views and a direct holiday-home feeling from the first minute.",
      text: "White coastal villa with bright terraces, sea views and a direct holiday-home feeling from the first minute.",
      tags: ["Holiday home", "Private pool", "Pool", "Sea view", "Beach nearby", "Air conditioning", "Luxury collection", "Garden or terrace", "Wi-Fi", "Grill"]
    },
    {
      id: 13,
      backendProductId: 13,
      backendLinkRewrite: "crays-villa-marbella",
      backendCategoryId: 7,
      slug: "marbella",
      name: "Crays Villa Marbella",
      place: "Cala Ratjada",
      map: { label: "Cala Ratjada, Mallorca", latitude: 39.711, longitude: 3.463, zoom: 13 },
      type: "Luxury villa",
      price: 10168,
      searchPrice: 15124,
      guests: 12,
      adults: 12,
      children: 0,
      bedrooms: 5,
      bathrooms: 4,
      rating: 4.7,
      ratingLabel: "4.7 / 5",
      pets: "No pets",
      images: 4,
      hero: "coastal pool zones",
      intro: "Elegant villa in Cala Ratjada with generous pool zones, coastal views and space for family-style stays.",
      text: "Elegant villa in Cala Ratjada with generous pool zones, coastal views and space for family-style stays.",
      tags: ["Holiday home", "Private pool", "Pool", "Sea view", "Beach nearby", "Whirlpool", "Air conditioning", "Family games", "Garden or terrace", "Wi-Fi", "Grill"]
    },
    {
      id: 14,
      backendProductId: 14,
      backendLinkRewrite: "crays-villa-cabrera",
      backendCategoryId: 7,
      slug: "cabrera",
      name: "Crays Villa Cabrera",
      place: "Colonia de Sant Jordi",
      map: { label: "Colonia de Sant Jordi, Mallorca", latitude: 39.318, longitude: 2.991, zoom: 12 },
      type: "Coastal villa",
      price: 10050,
      searchPrice: 14950,
      guests: 12,
      adults: 12,
      children: 0,
      bedrooms: 6,
      bathrooms: 4,
      rating: 4.8,
      ratingLabel: "4.8 / 5",
      pets: "No pets",
      images: 4,
      hero: "southern coast light",
      intro: "Southern coast villa with open-air dining, pool deck and soft sea-facing spaces for longer stays.",
      text: "Southern coast villa with open-air dining, pool deck and soft sea-facing spaces for longer stays.",
      tags: ["Holiday home", "Private pool", "Pool", "Sea view", "Beach nearby", "Parking", "Barbecue", "Garden or terrace", "Wi-Fi", "Air conditioning"]
    },
    {
      id: 15,
      backendProductId: 15,
      backendLinkRewrite: "crays-villa-can-ferragut",
      backendCategoryId: 7,
      slug: "can-ferragut",
      name: "Crays Villa Can Ferragut",
      place: "Porto Cristo",
      map: { label: "Porto Cristo, Mallorca", latitude: 39.54, longitude: 3.333, zoom: 12 },
      type: "Luxury finca",
      price: 9701,
      searchPrice: 14430,
      guests: 16,
      adults: 16,
      children: 0,
      bedrooms: 8,
      bathrooms: 8,
      rating: 4.8,
      ratingLabel: "4.8 / 5",
      pets: "No pets",
      images: 4,
      hero: "large green estate",
      intro: "Large Porto Cristo estate with green lawns, pool living and plenty of room for multi-family trips.",
      text: "Large Porto Cristo estate with green lawns, pool living and plenty of room for multi-family trips.",
      tags: ["Holiday home", "Private pool", "Pool", "Garden or terrace", "High chair", "Parking", "Family games", "Golf nearby", "Wi-Fi", "Air conditioning"]
    },
    {
      id: 16,
      backendProductId: 16,
      backendLinkRewrite: "crays-villa-el-ancla",
      backendCategoryId: 7,
      slug: "villa-el-ancla",
      name: "Crays Villa el Ancla",
      place: "Portopetro",
      map: { label: "Portopetro, Mallorca", latitude: 39.352, longitude: 3.211, zoom: 13 },
      type: "Luxury villa",
      price: 9648,
      searchPrice: 14352,
      guests: 10,
      adults: 10,
      children: 0,
      bedrooms: 5,
      bathrooms: 5,
      rating: 4.9,
      ratingLabel: "4.9 / 5",
      pets: "No pets",
      images: 4,
      hero: "Portopetro coast access",
      intro: "Modern Portopetro villa with clean outdoor spaces, poolside living and close coastal access.",
      text: "Modern Portopetro villa with clean outdoor spaces, poolside living and close coastal access.",
      tags: ["Holiday home", "Private pool", "Pool", "Sea view", "Beach nearby", "Air conditioning", "Parking", "Garden or terrace", "Wi-Fi", "Dishwasher"]
    },
    {
      id: 17,
      backendProductId: 17,
      backendLinkRewrite: "crays-villa-andratx",
      backendCategoryId: 7,
      slug: "andratx",
      name: "Crays Villa Andratx",
      place: "Andratx",
      map: { label: "Andratx, Mallorca", latitude: 39.575, longitude: 2.42, zoom: 12 },
      type: "Finca",
      price: 8849,
      searchPrice: 13164,
      guests: 10,
      adults: 10,
      children: 0,
      bedrooms: 5,
      bathrooms: 3,
      rating: 4.8,
      ratingLabel: "4.8 / 5",
      pets: "No pets",
      images: 4,
      hero: "stone details and pool privacy",
      intro: "Andratx villa with stone details, a strong pool scene and calm Mallorcan countryside around it.",
      text: "Andratx villa with stone details, a strong pool scene and calm Mallorcan countryside around it.",
      tags: ["Holiday home", "Private pool", "Pool", "Landscape view", "Luxury collection", "Dishwasher", "Washing machine", "Garden or terrace", "Wi-Fi", "Air conditioning"]
    },
    {
      id: 18,
      backendProductId: 18,
      backendLinkRewrite: "crays-villa-leon-de-sineu",
      backendCategoryId: 7,
      slug: "leon-de-sineu",
      name: "Crays Villa Leon de Sineu",
      place: "Sineu",
      map: { label: "Sineu, Mallorca", latitude: 39.642, longitude: 3.011, zoom: 12 },
      type: "Estate villa",
      price: 8486,
      searchPrice: 12623,
      guests: 21,
      adults: 21,
      children: 0,
      bedrooms: 9,
      bathrooms: 10,
      rating: 4.7,
      ratingLabel: "4.7 / 5",
      pets: "No pets",
      images: 4,
      hero: "village estate scale",
      intro: "A spacious inland house for larger groups with pool courtyards and a classic village rhythm.",
      text: "A spacious inland house for larger groups with pool courtyards and a classic village rhythm.",
      tags: ["Holiday home", "Private pool", "Pool", "Garden or terrace", "Parking", "Barbecue", "Family games", "High chair", "Wi-Fi", "Air conditioning"]
    },
    {
      id: 19,
      backendProductId: 19,
      backendLinkRewrite: "crays-finca-es-reco",
      backendCategoryId: 7,
      slug: "luxus-finca-es-reco",
      name: "Crays Finca Es Reco",
      place: "Portocolom",
      map: { label: "Portocolom, Mallorca", latitude: 39.416, longitude: 3.258, zoom: 12 },
      type: "Luxury finca",
      price: 8054,
      searchPrice: 11900,
      guests: 10,
      adults: 10,
      children: 0,
      bedrooms: 5,
      bathrooms: 5,
      rating: 4.8,
      ratingLabel: "4.8 / 5",
      pets: "Pets on request",
      images: 4,
      hero: "quiet Portocolom terraces",
      intro: "Refined finca near Portocolom with quiet terraces, pool comfort and a polished island-house character.",
      text: "Refined finca near Portocolom with quiet terraces, pool comfort and a polished island-house character.",
      tags: ["Finca", "Holiday home", "Private pool", "Pool", "Garden or terrace", "Golf nearby", "Air conditioning", "Wi-Fi", "Dishwasher", "Sea distance: 500 m", "Eco stay"]
    }
  ];

  var nearbyByPlace = {
    "Formentor": ["Beach access: 300 m", "Nearest village: Port de Pollenca", "Marina access: 9 km", "Airport: Palma de Mallorca"],
    "Son Serra de Marina": ["Beach access: 1.8 km", "Nearest village: Son Serra de Marina", "Restaurants: 2.2 km", "Airport: Palma de Mallorca"],
    "Llubi": ["Village center: 1.4 km", "Weekly market: Llubi", "Coast access: 19 km", "Airport: Palma de Mallorca"],
    "Portocolom": ["Harbour: 1.6 km", "Golf nearby", "Beach access: 3 km", "Airport: Palma de Mallorca"],
    "Capdepera": ["Village center: 2 km", "Coast access: 5 km", "Golf nearby", "Airport: Palma de Mallorca"],
    "Sa Font de Sa Cala": ["Beach access: 900 m", "Cala Ratjada: 5 km", "Restaurants: 1 km", "Airport: Palma de Mallorca"],
    "Cala Ratjada": ["Beach access: 1.2 km", "Harbour: 2 km", "Restaurants: 900 m", "Airport: Palma de Mallorca"],
    "Colonia de Sant Jordi": ["Beach access: 1.1 km", "Marina: 1.5 km", "Natural coast: 2 km", "Airport: Palma de Mallorca"],
    "Porto Cristo": ["Harbour: 2 km", "Beach access: 2.8 km", "Caves of Drach area", "Airport: Palma de Mallorca"],
    "Portopetro": ["Harbour: 900 m", "Cala Mondrago area", "Beach access: 2.6 km", "Airport: Palma de Mallorca"],
    "Andratx": ["Village center: 1.2 km", "Port d'Andratx: 6 km", "Coast access: 4 km", "Airport: Palma de Mallorca"],
    "Sineu": ["Village center: 650 m", "Weekly market: Sineu", "Coast access: 24 km", "Airport: Palma de Mallorca"]
  };

  function hasTag(villa, needle) {
    var text = (villa.tags || []).join(" | ").toLowerCase();
    return text.indexOf(needle.toLowerCase()) !== -1;
  }

  function buildOverview(villa) {
    return [
      villa.name + " is a Crays villa stay in " + villa.place + " with " + villa.bedrooms + " bedrooms, " + villa.bathrooms + " bathrooms and capacity for up to " + villa.guests + " guests.",
      "The house is organized around " + villa.hero + ", generous outdoor living and a private-pool stay rhythm that works for families, founders and longer island stays.",
      "Inside the villa, guests find work-ready Wi-Fi, climate comfort, equipped kitchen areas and practical laundry support. Outside, terraces, dining zones and pool areas create the main social center of the stay.",
      "The page is driven by the Crays property model: gallery, availability, guest rules, services, geo data, legal fields, reviews and backend status can be maintained per villa without changing the layout."
    ];
  }

  function buildInfoGroups(villa) {
    var facilities = ["Private outdoor pool", "Smart TV", "High-speed Wi-Fi", "Dishwasher", "Washing machine"];
    if (hasTag(villa, "Air conditioning")) facilities.push("Air conditioning");
    if (hasTag(villa, "Sauna")) facilities.push("Sauna");
    if (hasTag(villa, "Whirlpool")) facilities.push("Whirlpool");
    if (hasTag(villa, "EV charger")) facilities.push("EV charger");
    if (hasTag(villa, "Boat")) facilities.push("Boat request field");

    return [
      { title: "Facts", items: ["Region: " + villa.place, "Accommodation type: " + villa.type, "Guest rating: " + villa.ratingLabel, "Guests: " + villa.guests, "Bedrooms: " + villa.bedrooms, "Bathrooms: " + villa.bathrooms, "Pets: " + villa.pets, "Collection: Crays Fund Villas"] },
      { title: "Facilities", items: facilities },
      { title: "Rooms", items: ["Kitchen with warm and cold water", villa.bedrooms + " bedrooms", villa.bathrooms + " bathrooms", "Living room", "Outdoor dining area", "Private terrace zones"] },
      { title: "Amenities", items: ["Cooking plates and oven", "Refrigerator", "Coffee machine", "Barbecue", "High chair field", "Baby cot field", "Private parking", "Flexible arrival"] },
      { title: "Heating / Energy", items: ["Air conditioning field", "Seasonal comfort setup", "Energy performance field", "Sustainability note field"] },
      { title: "Outside", items: ["Garden furniture", hasTag(villa, "Pool") ? "Private pool" : "Outdoor lounging", "Sun loungers", "Outdoor shower field", "Terrace or similar", "Local team support"] },
      { title: "Nearby", items: nearbyByPlace[villa.place] || ["Beach nearby", "Shopping and village access", "Local restaurants", "Airport: Palma de Mallorca"] },
      { title: "Parking", items: ["Private parking on the property", hasTag(villa, "EV charger") ? "EV charger available" : "EV charger field supported", "Arrival instructions from Crays"] }
    ];
  }

  function buildLegal(villa) {
    return {
      license: "Maintained in Crays Booking backend",
      nationalRegistration: "Field prepared for live import",
      provider: "Crays Villas",
      dataSource: "Crays Booking property CRY-" + (villa.backendProductId || villa.id),
      ownerType: "Fund-owned villa",
      quality: "Crays quality-controlled property record"
    };
  }

  function buildAvailability(villa) {
    return {
      defaultCheckIn: "2026-06-26",
      minimumNights: villa.guests >= 16 ? 7 : 3,
      defaultNights: 7,
      checkInWindow: "16:00 - 19:00",
      checkoutTime: "10:00",
      cancellation: "Availability and cancellation terms are confirmed before payment.",
      depositPercent: 20,
      securityHoldPercent: 12,
      paymentMode: "Request first, no instant charge"
    };
  }

  function buildHouseRules(villa) {
    return [
      "No instant charge. Crays confirms availability and final price first.",
      "Guest capacity is limited to " + villa.guests + " guests.",
      villa.pets === "No pets" ? "Pets are not available for this villa." : "Pets are possible on request and must be confirmed before arrival.",
      "Exact arrival address is shared after booking confirmation.",
      "House rules, license fields and local contact are maintained in the backend."
    ];
  }

  function buildReviews(villa) {
    return [
      { name: "Crays Guest", date: "Summer 2025", rating: villa.ratingLabel, text: "Strong villa setup, clean handover and enough space for a relaxed stay in " + villa.place + "." },
      { name: "Founder Stay", date: "Autumn 2025", rating: villa.ratingLabel, text: "The pool, Wi-Fi and local support made the house easy for work and recovery." },
      { name: "Family Stay", date: "Spring 2026", rating: villa.ratingLabel, text: "Clear arrival flow, useful guest setup and a house that matched the Crays description." }
    ];
  }

  function buildBookingServices(villa) {
    var services = [
      { key: "arrival", title: "Arrival planning", text: "Check-in timing, local contact and arrival notes prepared by Crays.", price: 0 },
      { key: "workspace", title: "Workspace setup", text: "Desk setup, monitor request and work-ready arrival pack.", price: 220 },
      { key: "chef", title: "Private chef intro", text: "Curated local chef introduction for one dinner at the villa.", price: 380 }
    ];
    if (hasTag(villa, "Boat")) services.push({ key: "boat", title: "Boat request", text: "Local boat or harbour introduction request for the stay.", price: 490 });
    if (hasTag(villa, "Wellness") || hasTag(villa, "Sauna")) services.push({ key: "wellness", title: "Wellness setup", text: "Massage, sauna or recovery-support request prepared by the local team.", price: 260 });
    return services;
  }

  window.CRAYS_VILLA_DATA = villas.map(function (villa) {
    var copy = Object.assign({}, villa);
    copy.image = copy.image || "/assets/crays-villas/" + copy.slug + ".jpg";
    copy.tags = copy.tags || [];
    copy.text = copy.text || copy.intro || "";
    copy.searchPrice = copy.searchPrice || copy.price || 0;
    copy.price = copy.price || copy.searchPrice || 0;
    copy.rating = Number(copy.rating || 0);
    copy.ratingLabel = copy.ratingLabel || copy.rating.toFixed(1) + " / 5";
    copy.adults = copy.adults || copy.guests || 2;
    copy.children = copy.children || 0;
    copy.images = copy.images || 1;
    copy.map = Object.assign({
      label: copy.place + ", Mallorca",
      latitude: null,
      longitude: null,
      zoom: 12
    }, copy.map || {});
    copy.overview = copy.overview || buildOverview(copy);
    copy.infoGroups = copy.infoGroups || buildInfoGroups(copy);
    copy.legal = copy.legal || buildLegal(copy);
    copy.availability = copy.availability || buildAvailability(copy);
    copy.houseRules = copy.houseRules || buildHouseRules(copy);
    copy.reviews = copy.reviews || buildReviews(copy);
    copy.bookingServices = copy.bookingServices || buildBookingServices(copy);
    copy.backendFunctions = Object.assign({
      googleMaps: true,
      availabilityRequest: true,
      bookingSteps: ["dates", "guests", "services", "request"],
      priceSummary: true,
      galleryModal: true,
      savedVillas: true,
      cartFlow: true,
      accountFlow: true,
      reviews: true,
      groupedInformation: true,
      houseRules: true,
      requestStorage: "craysBookingRequest"
    }, copy.backendFunctions || {});
    return copy;
  });
})();
