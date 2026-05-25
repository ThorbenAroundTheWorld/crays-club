(function () {
  var menu = document.querySelector("[data-home-menu]");
  if (!menu) return;

  var button = menu.querySelector("[data-home-menu-button]");
  var dropdown = menu.querySelector("[data-home-dropdown]");
  if (!button || !dropdown) return;

  function setOpen(open) {
    button.setAttribute("aria-expanded", String(open));
    dropdown.hidden = !open;
    menu.classList.toggle("is-open", open);
  }

  button.addEventListener("click", function () {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("click", function (event) {
    if (!menu.contains(event.target)) setOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });
})();

(function () {
  var field = document.querySelector("[data-home-date-field]");
  var trigger = document.querySelector("[data-home-date-trigger]");
  var popover = document.querySelector("[data-home-date-popover]");
  var calendar = document.querySelector("[data-home-calendar]");
  var fromInput = document.querySelector("[data-home-date-from]");
  var toInput = document.querySelector("[data-home-date-to]");
  var dateModeInput = document.querySelector("[data-home-date-mode]");
  var hiddenNights = document.querySelector("[data-home-hidden-nights]");
  var hiddenRange = document.querySelector("[data-home-hidden-range]");
  var flexibleStayInput = document.querySelector("[data-home-flexible-stay]");
  var flexibleMonthInput = document.querySelector("[data-home-flexible-month]");
  var summary = document.querySelector("[data-home-date-summary]");
  var exactFrom = document.querySelector("[data-home-exact-from]");
  var exactTo = document.querySelector("[data-home-exact-to]");
  if (!field || !trigger || !popover || !calendar || !fromInput || !toInput || !summary) return;

  var month = new Date(2026, 5, 1);
  var flexibleMonthStart = new Date(2026, 4, 1);
  var pendingStart = "";
  var hoverDate = "";
  var suppressClick = false;
  var suppressClickIso = "";
  var drag = {
    active: false,
    start: "",
    end: "",
    moved: false
  };

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toISO(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function parseISO(value) {
    var parts = String(value || "").split("-").map(Number);
    return new Date(parts[0] || 2026, (parts[1] || 6) - 1, parts[2] || 26);
  }

  function addDays(date, days) {
    var next = new Date(date.getTime());
    next.setDate(next.getDate() + Number(days || 0));
    return next;
  }

  function nightsBetween(start, end) {
    return Math.max(1, Math.round((parseISO(end).getTime() - parseISO(start).getTime()) / 86400000));
  }

  function monthISO(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1);
  }

  function parseMonth(value) {
    var parts = String(value || "").split("-").map(Number);
    return new Date(parts[0] || 2026, (parts[1] || 5) - 1, 1);
  }

  function stayDays(stay) {
    return stay === "weekend" ? 2 : stay === "month" ? 28 : 7;
  }

  function stayLabel(stay) {
    return stay === "weekend" ? "weekend" : stay === "month" ? "month" : "week";
  }

  function selectedMode() {
    return dateModeInput && dateModeInput.value === "flexible" ? "flexible" : "dates";
  }

  function normalizeRange(startIso, endIso, requireCheckout) {
    var start = parseISO(startIso);
    var end = parseISO(endIso || startIso);
    if (end.getTime() < start.getTime()) {
      var swap = start;
      start = end;
      end = swap;
    }
    if (requireCheckout !== false && toISO(start) === toISO(end)) end = addDays(start, 1);
    return {
      start: toISO(start),
      end: toISO(end)
    };
  }

  function shortDate(value) {
    return parseISO(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  function shortMonth(value) {
    return parseMonth(value).toLocaleDateString("en-GB", { month: "short" });
  }

  function firstFlexibleStart(monthValue, stay) {
    var date = parseMonth(monthValue);
    if (stay === "weekend") {
      while (date.getDay() !== 5) date.setDate(date.getDate() + 1);
    }
    return date;
  }

  function updateSummary() {
    if (selectedMode() === "flexible") {
      var stay = flexibleStayInput && flexibleStayInput.value || "week";
      var monthValue = flexibleMonthInput && flexibleMonthInput.value;
      summary.textContent = monthValue ? "Any " + stayLabel(stay) + " in " + shortMonth(monthValue) : "Any " + stayLabel(stay);
      return;
    }
    if (!fromInput.value || !toInput.value) {
      summary.textContent = "Add dates";
      if (exactFrom) exactFrom.value = "";
      if (exactTo) exactTo.value = "";
      return;
    }
    var nights = nightsBetween(fromInput.value, toInput.value);
    summary.textContent = shortDate(fromInput.value) + " - " + nights + " nights";
    if (exactFrom) exactFrom.value = fromInput.value;
    if (exactTo) exactTo.value = toInput.value;
  }

  function setOpen(open) {
    popover.hidden = !open;
    field.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
    if (open) renderFlexibleMonths();
  }

  function setDateRange(from, to, keepPending) {
    var range = normalizeRange(from, to, true);
    if (dateModeInput) dateModeInput.value = "dates";
    fromInput.value = range.start;
    toInput.value = range.end;
    if (hiddenNights) hiddenNights.value = String(nightsBetween(range.start, range.end));
    if (hiddenRange && !hiddenRange.value) hiddenRange.value = "0";
    if (flexibleMonthInput) flexibleMonthInput.value = "";
    if (!keepPending) pendingStart = "";
    hoverDate = "";
    drag.active = false;
    drag.start = "";
    drag.end = "";
    drag.moved = false;
    updateSummary();
    syncModeUI();
    renderCalendar();
  }

  function setDateMode(mode) {
    if (dateModeInput) dateModeInput.value = mode;
    pendingStart = "";
    hoverDate = "";
    drag.active = false;
    if (mode === "flexible") {
      applyFlexibleSelection();
    } else {
      if (flexibleMonthInput) flexibleMonthInput.value = "";
      if (fromInput.value && toInput.value && hiddenNights) hiddenNights.value = String(nightsBetween(fromInput.value, toInput.value));
      updateSummary();
    }
    syncModeUI();
    renderCalendar();
    renderFlexibleMonths();
  }

  function syncModeUI() {
    var mode = selectedMode();
    document.querySelectorAll("[data-home-date-mode-switch]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-home-date-mode-switch") === mode);
    });
    document.querySelectorAll("[data-home-date-panel]").forEach(function (panel) {
      var active = panel.getAttribute("data-home-date-panel") === mode;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    document.querySelectorAll("[data-home-flex-range]").forEach(function (button) {
      button.classList.toggle("is-active", (hiddenRange && hiddenRange.value || "0") === button.getAttribute("data-home-flex-range"));
    });
    document.querySelectorAll("[data-home-flex-stay]").forEach(function (button) {
      button.classList.toggle("is-active", (flexibleStayInput && flexibleStayInput.value || "week") === button.getAttribute("data-home-flex-stay"));
    });
  }

  function applyFlexibleSelection() {
    var stay = flexibleStayInput && flexibleStayInput.value || "week";
    var monthValue = flexibleMonthInput && flexibleMonthInput.value;
    var days = stayDays(stay);
    if (hiddenNights) hiddenNights.value = String(days);
    if (hiddenRange) hiddenRange.value = stay === "month" ? "30" : "14";
    if (monthValue) {
      var start = firstFlexibleStart(monthValue, stay);
      fromInput.value = toISO(start);
      toInput.value = toISO(addDays(start, days));
    } else {
      fromInput.value = "";
      toInput.value = "";
    }
    updateSummary();
  }

  function renderFlexibleMonths() {
    var holder = document.querySelector("[data-home-flex-months]");
    if (!holder) return;
    holder.innerHTML = Array.from({ length: 6 }).map(function (_, index) {
      var current = new Date(flexibleMonthStart.getFullYear(), flexibleMonthStart.getMonth() + index, 1);
      var value = monthISO(current);
      var active = flexibleMonthInput && flexibleMonthInput.value === value;
      return '<button class="crays-flex-month-card' + (active ? " is-active" : "") + '" type="button" data-home-flex-month="' + value + '"><strong>' + current.toLocaleDateString("en-GB", { month: "long" }) + '</strong><span>' + current.getFullYear() + "</span></button>";
    }).join("");
  }

  function renderCalendar() {
    var hasSelectedRange = Boolean(fromInput.value && toInput.value);
    var selectedStart = hasSelectedRange ? parseISO(fromInput.value) : null;
    var selectedEnd = hasSelectedRange ? parseISO(toInput.value) : null;
    var previewRange = null;
    var previewIsDraft = false;
    if (drag.active) {
      previewRange = normalizeRange(drag.start, drag.end, false);
      previewIsDraft = true;
    } else if (pendingStart) {
      previewRange = normalizeRange(pendingStart, hoverDate || pendingStart, false);
      previewIsDraft = true;
    }
    var previewStart = previewRange ? parseISO(previewRange.start) : selectedStart;
    var previewEnd = previewRange ? parseISO(previewRange.end) : selectedEnd;
    var hasVisibleRange = Boolean(previewStart && previewEnd);
    var hasDistinctEnd = hasVisibleRange && toISO(previewStart) !== toISO(previewEnd);
    calendar.classList.toggle("is-dragging", drag.active);
    calendar.innerHTML = [0, 1].map(function (offset) {
      var current = new Date(month.getFullYear(), month.getMonth() + offset, 1);
      var first = new Date(current.getFullYear(), current.getMonth(), 1);
      var last = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      var leading = (first.getDay() + 6) % 7;
      var html = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(function (day) {
        return '<div class="crays-home-weekday">' + day + '</div>';
      }).join("");
      for (var blank = 0; blank < leading; blank += 1) html += "<span></span>";
      for (var dayNumber = 1; dayNumber <= last.getDate(); dayNumber += 1) {
        var day = new Date(current.getFullYear(), current.getMonth(), dayNumber);
        var iso = toISO(day);
        var classes = [];
        if (hasVisibleRange && iso === toISO(previewStart)) classes.push("is-start");
        if (hasDistinctEnd && iso === toISO(previewEnd)) classes.push("is-end");
        if (pendingStart && iso === pendingStart) classes.push("is-pending");
        if (hasDistinctEnd && day.getTime() > previewStart.getTime() && day.getTime() < previewEnd.getTime()) {
          classes.push(previewIsDraft ? "is-preview" : "is-range");
        }
        html += '<button type="button" class="' + classes.join(" ") + '" data-home-calendar-day="' + iso + '" aria-label="' + iso + '">' + dayNumber + "</button>";
      }
      return '<section class="crays-home-calendar-month"><h3>' + current.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) + '</h3><div class="crays-home-calendar-grid">' + html + "</div></section>";
    }).join("");
  }

  function dayFromPointer(event) {
    var target = document.elementFromPoint(event.clientX, event.clientY);
    var button = target && target.closest && target.closest("[data-home-calendar-day]");
    return button ? button.getAttribute("data-home-calendar-day") : "";
  }

  function beginDrag(event) {
    var button = event.target.closest("[data-home-calendar-day]");
    if (!button) return;
    event.preventDefault();
    var iso = button.getAttribute("data-home-calendar-day");
    drag.active = true;
    drag.start = iso;
    drag.end = iso;
    drag.moved = false;
    hoverDate = "";
  }

  function updateDrag(event) {
    var iso = dayFromPointer(event);
    if (!iso) return;
    if (drag.active) {
      if (iso !== drag.end) {
        drag.end = iso;
        drag.moved = drag.moved || iso !== drag.start;
        renderCalendar();
      }
      return;
    }
    if (pendingStart && iso !== hoverDate) {
      hoverDate = iso;
      renderCalendar();
    }
  }

  function finishDrag() {
    if (!drag.active) return;
    if (drag.moved) {
      suppressClick = true;
      suppressClickIso = drag.end;
      setDateRange(drag.start, drag.end);
      window.setTimeout(function () {
        suppressClick = false;
        suppressClickIso = "";
      }, 250);
      return;
    }
    drag.active = false;
    drag.start = "";
    drag.end = "";
  }

  trigger.addEventListener("click", function (event) {
    event.stopPropagation();
    setOpen(popover.hidden);
  });

  popover.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  calendar.addEventListener("mousedown", beginDrag);
  calendar.addEventListener("click", function (event) {
    var button = event.target.closest("[data-home-calendar-day]");
    if (!button) return;
    var iso = button.getAttribute("data-home-calendar-day");
    if (suppressClick && iso === suppressClickIso) {
      suppressClick = false;
      suppressClickIso = "";
      return;
    }
    suppressClick = false;
    suppressClickIso = "";
    if (!pendingStart) {
      pendingStart = iso;
      hoverDate = iso;
      var previewNights = fromInput.value && toInput.value ? nightsBetween(fromInput.value, toInput.value) : 7;
      setDateRange(iso, toISO(addDays(parseISO(iso), previewNights)), true);
      pendingStart = iso;
      renderCalendar();
      return;
    }
    setDateRange(pendingStart, iso);
  });

  calendar.addEventListener("mousemove", updateDrag);
  document.addEventListener("mousemove", updateDrag);
  document.addEventListener("mouseup", finishDrag);

  document.querySelector("[data-home-calendar-prev]")?.addEventListener("click", function () {
    month = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    renderCalendar();
  });

  document.querySelector("[data-home-calendar-next]")?.addEventListener("click", function () {
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    renderCalendar();
  });

  document.querySelectorAll("[data-home-date-mode-switch]").forEach(function (button) {
    button.addEventListener("click", function () {
      setDateMode(button.getAttribute("data-home-date-mode-switch") || "dates");
    });
  });

  document.querySelectorAll("[data-home-flex-range]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (hiddenRange) hiddenRange.value = button.getAttribute("data-home-flex-range") || "0";
      if (dateModeInput) dateModeInput.value = "dates";
      syncModeUI();
      updateSummary();
    });
  });

  document.querySelectorAll("[data-home-flex-stay]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (flexibleStayInput) flexibleStayInput.value = button.getAttribute("data-home-flex-stay") || "week";
      if (dateModeInput) dateModeInput.value = "flexible";
      applyFlexibleSelection();
      syncModeUI();
      renderFlexibleMonths();
    });
  });

  document.querySelector("[data-home-flex-months]")?.addEventListener("click", function (event) {
    var button = event.target.closest("[data-home-flex-month]");
    if (!button) return;
    if (flexibleMonthInput) flexibleMonthInput.value = button.getAttribute("data-home-flex-month") || "";
    if (dateModeInput) dateModeInput.value = "flexible";
    applyFlexibleSelection();
    syncModeUI();
    renderFlexibleMonths();
  });

  document.querySelector("[data-home-flex-prev]")?.addEventListener("click", function () {
    flexibleMonthStart = new Date(flexibleMonthStart.getFullYear(), flexibleMonthStart.getMonth() - 6, 1);
    renderFlexibleMonths();
  });

  document.querySelector("[data-home-flex-next]")?.addEventListener("click", function () {
    flexibleMonthStart = new Date(flexibleMonthStart.getFullYear(), flexibleMonthStart.getMonth() + 6, 1);
    renderFlexibleMonths();
  });

  document.addEventListener("click", function (event) {
    if (!field.contains(event.target)) setOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });

  updateSummary();
  syncModeUI();
  renderCalendar();
  renderFlexibleMonths();
})();
