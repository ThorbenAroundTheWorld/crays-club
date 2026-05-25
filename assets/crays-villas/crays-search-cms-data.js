(function () {
  window.CRAYS_SEARCH_CMS = {
    backendModel: {
      properties: ["title", "slug", "status", "region", "geo", "gallery", "price", "availability", "features", "rooms", "services", "legal", "owner", "seo"],
      searchPage: ["utility", "trust", "promos", "destinations", "collections", "ownerCta", "editorial", "reviews", "faq", "fundNote", "footerExplore"],
      contentPages: ["title", "slug", "status", "seo", "hero", "body", "sections", "faq", "cta"]
    },
    utility: [
      { label: "Booking help", kind: "phoneVisible", phone: "+34 655 14 93 02", href: "tel:+34655149302" },
      { label: "Contact", href: "/contact" },
      { label: "Owner In-Kind Contribution", href: "https://crays.fund/en/rollovers", external: true }
    ],
    trust: [
      { title: "Local Crays support", text: "A Mallorca-based Crays contact helps with arrival, handover and stay questions." },
      { title: "Availability first", text: "Each request is checked before payment so guests move forward with clear terms." },
      { title: "Fund-owned standards", text: "Villa content, media quality and service fields follow one Crays operating model." },
      { title: "Saved stay flow", text: "Account, Wish List, Cart and Booking Request stay connected from search to the request." }
    ],
    promos: [
      { title: "Perfect for summer stays", text: "Large villas, private pools and work-ready setups for longer Mallorca stays.", href: "/search?destination=Formentor", image: "/assets/crays-villas/stock/summer-stay-lifestyle.jpg" },
      { title: "Book and relax", text: "Crays confirms availability, guest fit and final pricing before the request moves forward.", href: "/search?attribute=flexible", image: "/assets/crays-villas/stock/relax-pool-lifestyle.jpg" },
      { title: "Best villa matches", text: "Use destination, dates, guests, filters and the map to find the right Crays villa.", href: "/search", image: "/assets/crays-villas/stock/mallorca-discovery-lifestyle.jpg" }
    ],
    destinations: [
      { name: "Formentor coast", text: "Sea-view villas and quiet northern privacy.", href: "/search?destination=Formentor", image: "/assets/crays-villas/stock/unsplash-coastal-villa-aerial.jpg" },
      { name: "Portocolom & east coast", text: "Pool villas close to golf, bays and long stays.", href: "/search?destination=Portocolom", image: "/assets/crays-villas/stock/unsplash-luxury-pool-pergola.jpg" },
      { name: "Andratx lifestyle", text: "Modern villa energy for premium island weeks.", href: "/search?destination=Andratx", image: "/assets/crays-villas/stock/unsplash-modern-mediterranean-villa.jpg" },
      { name: "Inland fincas", text: "Sineu, Llubi and calm countryside estates.", href: "/search?destination=Sineu", image: "/assets/crays-villas/stock/unsplash-white-villa-pool.jpg" }
    ],
    collections: [
      { name: "Private pool villas", text: "Pool-first homes for relaxed group stays.", href: "/search?attribute=pool", image: "/assets/crays-villas/only-summer.jpg" },
      { name: "Sea view villas", text: "Open horizon, coastal air and easy island mood.", href: "/search?attribute=sea-view", image: "/assets/crays-villas/villa-formentor.jpg" },
      { name: "Luxury Crays collection", text: "Elevated homes with stronger design language.", href: "/search?attribute=luxe", image: "/assets/crays-villas/son-doblons.jpg" },
      { name: "Work-live longer stays", text: "Wi-Fi, space and a softer Crays rhythm.", href: "/search?attribute=dedicated-workspace", image: "/assets/crays-villas/cabrera.jpg" }
    ],
    ownerCta: {
      eyebrow: "For villa owners",
      title: "Turn a high-value villa into a structured Crays position.",
      text: "A contribution-in-kind or asset swap means you do not simply sell the villa and walk away. The property can be reviewed, valued and contributed into a Crays structure in exchange for a documented position, subject to tax, legal and governance review. The goal is a cleaner route for owners who want liquidity options, operational relief and continued lifestyle upside instead of carrying every cost, booking detail and family decision alone.",
      benefits: [
        { title: "Tax and legal route", text: "Specialists review title, valuation, local taxes, holding history and the possible contribution path before anything is proposed." },
        { title: "Operational relief", text: "Crays can prepare media, availability, service setup, guest handling and portfolio standards so the asset works inside a managed model." },
        { title: "Lifestyle upside", text: "Owner-use windows, governance, community access and exit logic can be discussed before onboarding, not after." }
      ],
      points: [
        "Confidential first call for owners of premium Spanish villas",
        "Indicative valuation and Crays Fund fit check",
        "Contribution-in-kind or asset-swap structure explained in plain language",
        "Tax, legal, governance, lock-up and exit questions prepared for specialist review",
        "Optional operating model for bookings, service, CMS data and guest standards",
        "Potential owner-use and Crays lifestyle access discussed before commitment"
      ],
      note: "No generic tax promise is made. Each route depends on title, valuation, ownership history, local taxes, personal situation and specialist advice.",
      href: "https://crays.fund/en/rollovers",
      label: "Explore Contribution-in-Kind",
      image: "/assets/crays-villas/stock/unsplash-high-class-real-estate-owner.jpg"
    },
    editorial: {
      title: "Discover Crays Villas on Mallorca",
      intro: "Crays Villas combines curated homes, large visual galleries, map discovery and a request-first booking flow.",
      sections: [
        { title: "Why a Crays villa stay?", text: "A villa gives guests privacy, room for teams and families, private pool options and local support before arrival.", image: "/assets/crays-villas/casablanca.jpg" },
        { title: "Collections for different stay types", text: "Guests can enter through collections such as private pool, family-ready, pet request, sea view, luxury and flexible request stays.", image: "/assets/crays-villas/marbella.jpg" },
        { title: "Search, map and detail pages", text: "The flow starts on search, moves through filters and map, then into a detail page with gallery, facts, location, legal information and booking request.", image: "/assets/crays-villas/villa-el-ancla.jpg" },
        { title: "CMS-ready operations", text: "Search sections, content pages and property pages are modeled as separate content objects so employees can maintain inventory and editorial content through backend fields.", image: "/assets/crays-villas/can-ferragut.jpg" }
      ]
    },
    reviews: [
      { name: "Yvonne", date: "23 August 2024", text: "A calm villa setting with the right amount of privacy and support.", rating: "5.0" },
      { name: "Katharina", date: "9 July 2024", text: "The outdoor areas, pool and local handover made the stay feel easy.", rating: "5.0" },
      { name: "Andreas", date: "11 September 2024", text: "Great villa flow, clear arrival setup and a strong place for a longer stay.", rating: "5.0" }
    ],
    faq: [
      { question: "How does a Crays villa request work?", answer: "Choose your dates, guests and relevant filters, then send a request. Crays checks owner-approved availability, stay rules, guest fit and the final quote before a reservation becomes binding." },
      { question: "Is the price shown on search already the final booking price?", answer: "Search prices are guidance for comparison. The confirmed quote can include the villa rate, required local fees, taxes, security deposit rules and any mandatory services. Optional concierge, stocking, cars, chefs or aviation are quoted separately." },
      { question: "What happens after I send a request?", answer: "The Crays team reviews the request, may ask for missing details and then confirms whether the villa can be offered for the selected dates. If the exact villa is not available, Crays can suggest suitable alternatives from the portfolio." },
      { question: "When do I pay?", answer: "Payment timing is shown with the individual quote and booking confirmation. In luxury villa rental, a deposit normally secures the stay and the remaining balance is due before arrival; the exact schedule depends on the villa and terms confirmed for your request." },
      { question: "Can I change or cancel my request?", answer: "Before confirmation, a request can be withdrawn or adjusted. After confirmation, changes and cancellations follow the villa-specific terms in the booking documents, including any deadlines, fees and refund rules." },
      { question: "Are pets, children and special services guaranteed by the filter?", answer: "Filters help you find likely matches, but special wishes are only guaranteed when Crays confirms them for the specific villa. This includes pets, extra guests, baby equipment, chef service, stocking, cars, boats, accessibility needs and owner-use blackout dates." },
      { question: "Why book through Crays instead of a generic marketplace?", answer: "Crays focuses on curated villas, local support, request-first confirmation and a broader hospitality layer. The goal is a private-home stay with hotel-grade service logic, clearer communication and access to the Crays lifestyle network." }
    ],
    fundNote: {
      eyebrow: "Crays Fund",
      title: "Fund-owned villas with one Crays standard.",
      text: "Crays Fund connects luxury short-term rental real estate, professional hospitality operations and the Crays lifestyle ecosystem. The villa portfolio is treated as an institutional STR asset class: disciplined acquisition, owner onboarding, reporting, service standards and guest demand work together instead of leaving each home as an isolated rental listing.",
      points: [
        "Evergreen luxury STR strategy with diversified prime-destination exposure",
        "Crays operating layer for booking demand, service, reporting and owner-approved availability",
        "Spain-first contribution-in-kind path can turn qualifying villas into a documented platform position"
      ],
      href: "https://crays.fund/en/rollovers",
      label: "Explore Crays Fund",
      image: "/assets/crays-villas/luxury-golf-dor.jpg"
    },
    footerExplore: [
      { title: "Destinations", text: "Browse Mallorca villa regions.", href: "/search", image: "/assets/crays-villas/leon-de-sineu.jpg" },
      { title: "Inspiration", text: "Lifestyle, hospitality and Crays context.", href: "/lifestyle", image: "/assets/crays-club/deck-party.webp" },
      { title: "Contact", text: "Talk to Crays before your request.", href: "/contact", image: "/assets/crays-club/cafe-founder.webp" },
      { title: "Owner In-Kind Contribution", text: "Start a structured owner conversation.", href: "https://crays.fund/en/rollovers", image: "/assets/crays-villas/stock/owner-intake-lifestyle.jpg" }
    ]
  };
})();
