(function () {
  const form = document.querySelector("[data-booking-search-form]");
  if (!form) return;

  const defaults = {
    destination: "",
    checkIn: "",
    checkOut: "",
    guests: "2",
  };

  const pad = (value) => String(value).padStart(2, "0");

  const dateAfter = (days, fromDate) => {
    const date = fromDate ? new Date(fromDate + "T00:00:00") : new Date();
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  if (form.elements.destination && !form.elements.destination.value) {
    form.elements.destination.value = defaults.destination;
  }

  if (form.elements.date_from && !form.elements.date_from.value) {
    form.elements.date_from.value = defaults.checkIn;
  }

  if (form.elements.date_to && !form.elements.date_to.value) {
    form.elements.date_to.value = defaults.checkOut;
  }

  if (form.elements.guests && !form.elements.guests.value) {
    form.elements.guests.value = defaults.guests;
  }

  const buildOccupancies = (guestValue) => {
    const totalGuests = Math.max(1, Math.min(Number.parseInt(guestValue || "1", 10) || 1, 16));
    return [{ adults: totalGuests, children: 0 }];
  };

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    let checkIn = form.elements.date_from?.value || form.elements.checkin?.value || defaults.checkIn;
    let checkOut = form.elements.date_to?.value || form.elements.checkout?.value || defaults.checkOut;
    const dateMode = form.elements.date_mode?.value || "dates";
    const flexibleStay = form.elements.flexible_stay?.value || "";
    const flexibleMonth = form.elements.flexible_month?.value || "";
    const rangeValue = form.elements.range?.value || "";
    const nightsValue = form.elements.nights?.value || "";

    if (checkIn && checkOut && checkOut <= checkIn) {
      checkOut = dateAfter(1, checkIn);
    }

    const searchPath = form.getAttribute("data-search-path") || form.getAttribute("action") || "/search/";
    const url = new URL(searchPath, window.location.origin);
    url.searchParams.set("id_category", "7");
    url.searchParams.set("controller", "category");
    url.searchParams.set("id_lang", "1");
    if (checkIn && checkOut) {
      url.searchParams.set("date_from", checkIn);
      url.searchParams.set("date_to", checkOut);
      url.searchParams.set("nights", nightsValue || String(Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000) || 7)));
      if (rangeValue) url.searchParams.set("range", rangeValue);
    }
    if (dateMode === "flexible") {
      url.searchParams.set("date_mode", "flexible");
      if (flexibleStay) url.searchParams.set("flexible_stay", flexibleStay);
      if (flexibleMonth) url.searchParams.set("flexible_month", flexibleMonth);
      if (!checkIn && nightsValue) url.searchParams.set("nights", nightsValue);
      if (!checkIn && rangeValue) url.searchParams.set("range", rangeValue);
    }
    url.searchParams.set("pets", "0");

    if (form.elements.destination?.value) {
      url.searchParams.set("destination", form.elements.destination.value);
    }

    buildOccupancies(form.elements.guests?.value).forEach((room, index) => {
      url.searchParams.set(`occupancy[${index}][adults]`, String(room.adults));
      url.searchParams.set(`occupancy[${index}][children]`, String(room.children));
    });

    window.location.assign(url.toString());
  });
}());
