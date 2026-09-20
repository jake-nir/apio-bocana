/* ==========================================================================
   BARANGAY BOCANA â€” site scripts
   Navigation, reveal, gallery, lightbox, counters, form, misc
   ========================================================================== */

(function () {
  "use strict";

  document.documentElement.classList.add("js-anim");

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // -------------------------------------------------------------------------
  // Shared element helpers
  // -------------------------------------------------------------------------
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  // -------------------------------------------------------------------------
  // Mobile menu
  // -------------------------------------------------------------------------
  const header = $(".site-header");
  const toggle = $(".nav-toggle");
  const mobileMenu = $(".mobile-menu");

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenu.inert = true;
    toggle && toggle.setAttribute("aria-expanded", "false");
    toggle && toggle.focus();
    document.body.style.overflow = "";
  }

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    mobileMenu.inert = false;
    toggle && toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    const first = $(".mobile-menu a", mobileMenu);
    first && first.focus();
  }

  if (toggle && mobileMenu) {
    toggle.addEventListener("click", function () {
      const isOpen = mobileMenu.classList.contains("is-open");
      isOpen ? closeMobileMenu() : openMobileMenu();
    });

    $$(".mobile-menu a", mobileMenu).forEach(function (link) {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileMenu();
    });

    mobileMenu.addEventListener("click", function (e) {
      if (e.target === mobileMenu) closeMobileMenu();
    });

    // Hide menu on resize to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) closeMobileMenu();
    });
  }

  // -------------------------------------------------------------------------
  // Sticky navbar â€” shrink + shadow on scroll
  // -------------------------------------------------------------------------
  const toTop = $(".to-top");

  function onScroll() {
    const scrolled = window.scrollY > 30;
    if (header) header.classList.toggle("site-header--scroll", scrolled);
    if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 600);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  // -------------------------------------------------------------------------
  // Active navigation link (based on current page)
  // -------------------------------------------------------------------------
  (function setActiveNav() {
    const current = window.location.pathname.split("/").pop() || "index.html";
    $$("[data-nav-link]").forEach(function (link) {
      const href = link.getAttribute("href").replace(/^\.\//, "");
      if (href === current) link.classList.add("is-active");
    });
  })();

  // -------------------------------------------------------------------------
  // Scroll reveal
  // -------------------------------------------------------------------------
  const revealEls = $$("[data-reveal]");

  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach(function (el) {
      if (el.dataset.delay) {
        el.style.transitionDelay = el.dataset.delay + "ms";
      }
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // -------------------------------------------------------------------------
  // Animated counters
  // -------------------------------------------------------------------------
  const counters = $$("[data-counter]");

  function runCounter(el) {
    const target = parseInt(el.dataset.count || el.dataset.counter, 10) || 0;
    const suffix = el.dataset.suffix || "";
    const dur = el.dataset.duration ? parseInt(el.dataset.duration, 10) : 1400;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (counters.length) {
    if ("IntersectionObserver" in window && !prefersReduced) {
      const cio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              runCounter(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach(function (el) {
        cio.observe(el);
      });
    } else {
      counters.forEach(function (el) {
        el.textContent =
          (el.dataset.count || "0").replace(/\D/g, "") + (el.dataset.suffix || "");
      });
    }
  }

  // -------------------------------------------------------------------------
  // Gallery filter
  // -------------------------------------------------------------------------
  const filterBtns = $$(".filter-pill");
  const galleryItems = $$(".gallery-item");
  const galleryGrid = $(".gallery-grid");

  function applyFilter(filter) {
    galleryItems.forEach(function (item) {
      const cat = item.dataset.category || "all";
      const show = filter === "all" || cat === filter;
      item.style.display = show ? "" : "none";
      if (show) {
        item.classList.remove("is-filtering");
        // re-trigger fade via rAF
        requestAnimationFrame(function () {
          item.classList.add("is-filtering");
        });
      }
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const filter = btn.dataset.filter || "all";
      filterBtns.forEach(function (b) {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
      applyFilter(filter);
    });
  });

  if (galleryItems.length && galleryGrid) {
    // ensure at least one element has the styling class available
    const style = document.createElement("style");
    style.textContent =
      ".gallery-item.is-filtering{animation:galleryFade .5s var(--ease-out)}" +
      "@keyframes galleryFade{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}";
    document.head.appendChild(style);
  }

  // -------------------------------------------------------------------------
  // Lightbox
  // -------------------------------------------------------------------------
  const lightbox = $(".lightbox");
  let lbItems = [];
  let lbCurrent = 0;
  let lastFocused = null;

  if (lightbox) {
    const lbImg = $(".lightbox__img", lightbox);
    const lbTitle = $(".lightbox__caption-title", lightbox);
    const lbSub = $(".lightbox__caption-sub", lightbox);
    const lbBtnPrev = $(".lightbox__prev", lightbox);
    const lbBtnNext = $(".lightbox__next", lightbox);
    const lbBtnClose = $(".lightbox__close", lightbox);
    const lbCounter = $(".lightbox__counter", lightbox);

    function collectVisibleItems() {
      return $$(".gallery-item", document).filter(function (item) {
        return item.style.display !== "none";
      });
    }

    function openLightbox(index, items) {
      lbItems = items;
      lbCurrent = index;
      lastFocused = document.activeElement;
      loadLightbox();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      lightbox.inert = false;
      document.body.style.overflow = "hidden";
      lbBtnClose && lbBtnClose.focus();
      setLightboxFocusTrap(true);
    }

    function setLightboxFocusTrap(on) {
      if (on) {
        lightbox.addEventListener("keydown", trapFocus);
      } else {
        lightbox.removeEventListener("keydown", trapFocus);
      }
    }

    function trapFocus(e) {
      if (e.key !== "Tab") return;
      const focusables = [lbBtnClose, lbBtnPrev, lbBtnNext].filter(Boolean);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.inert = true;
      document.body.style.overflow = "";
      setLightboxFocusTrap(false);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function loadLightbox() {
      const item = lbItems[lbCurrent];
      if (!item) return;
      const img = $("img", item);
      lbImg.src = img ? img.src : "";
      lbImg.alt = img ? img.alt : item.dataset.title || "";
      lbTitle.textContent = item.dataset.title || "";
      lbSub.textContent = item.dataset.cat || "";
      if (lbCounter) {
        lbCounter.textContent = (lbCurrent + 1) + " / " + lbItems.length;
      }
    }

    function step(dir) {
      if (!lbItems.length) return;
      lbCurrent = (lbCurrent + dir + lbItems.length) % lbItems.length;
      loadLightbox();
    }

    // delegate click â€” attaches to all gallery items (also works after filters)
    document.addEventListener("click", function (e) {
      const item = e.target.closest(".gallery-item");
      if (!item || !lightbox) return;
      const items = collectVisibleItems();
      const index = items.indexOf(item);
      if (index > -1) openLightbox(index, items);
    });

    // keyboard: Enter/Space opens the lightbox for focused items
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const active = document.activeElement;
      if (!active || !active.classList || !active.classList.contains("gallery-item")) return;
      e.preventDefault();
      const items = collectVisibleItems();
      const index = items.indexOf(active);
      if (index > -1) openLightbox(index, items);
    });

    lbBtnClose.addEventListener("click", closeLightbox);
    lbBtnPrev.addEventListener("click", function () { step(-1); });
    lbBtnNext.addEventListener("click", function () { step(1); });

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Contact form (front-end only demo)
  // -------------------------------------------------------------------------
  const contactForm = $(".contact-form");
  const formSuccess = $(".form-success");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (formSuccess) {
        formSuccess.hidden = false;
        formSuccess.scrollIntoView({
          behavior: prefersReduced ? "auto" : "smooth",
          block: "center",
        });
      }
      contactForm.reset();
    });
  }

  // -------------------------------------------------------------------------
  // Footer year
  // -------------------------------------------------------------------------
  const yearEl = $("#footer-year");
  if (yearEl) yearEl.textContent = "2026";

  // -------------------------------------------------------------------------
  // Lucide icons
  // -------------------------------------------------------------------------
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    try {
      window.lucide.createIcons();
    } catch (err) {
      /* icons are decorative â€” fail silently */
    }
  }
})();

/* ===========================================================================
   THEME (dark mode) â€” persistence + live toggle buttons
   ---------------------------------------------------------------------------
   The actual colour remap lives in css/style.css under html[data-theme="dark"];
   this block only wires it up:
     - drops a .theme-toggle button into the desktop header row and the mobile
       drawer (they share the same markup, styled in style.css)
     - toggles data-theme on <html>, persists the choice to localStorage
     - on first visit / no stored value, falls back to the OS preference
     - re-renders the freshly injected lucide icons
   ------------------------------------------------------------------------- */
(function () {
  var STORAGE_KEY = "apio-bocana-theme";

  function readStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === "dark" || v === "light" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function systemPref() {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  }

  function apply(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    }
    syncState();
  }

  function syncState() {
    var dark = currentTheme() === "dark";
    var toggles = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute("aria-pressed", dark ? "true" : "false");
      toggles[i].setAttribute(
        "aria-label",
        dark ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  function makeToggle() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-pressed", currentTheme() === "dark" ? "true" : "false");
    btn.innerHTML =
      '<i class="theme-toggle__icon icon-moon" aria-hidden="true" data-lucide="moon"></i>' +
      '<i class="theme-toggle__icon icon-sun" aria-hidden="true" data-lucide="sun"></i>' +
      '<span class="theme-toggle__label">Theme</span>';
    return btn;
  }

  function mountToggle(anchor) {
    var btn = makeToggle();
    anchor.appendChild(btn);
    btn.addEventListener("click", function () {
      apply(currentTheme() === "dark" ? "light" : "dark", true);
    });
    return btn;
  }

  function init() {
    /* dot not flash: the inline head snippet already set data-theme early;
       re-apply here so the widget stays correct if it ran elsewhere */
    apply(readStored() || systemPref(), false);

    /* desktop: append to the header nav row (after hamburger) */
    var desktop = document.querySelector(".nav-inner");
    if (desktop) mountToggle(desktop);

    /* mobile: prepend to the drawer so it sits above the links */
    var mobile = document.querySelector(".mobile-menu");
    if (mobile) {
      var btn = makeToggle();
      mobile.insertBefore(btn, mobile.firstChild);
      btn.addEventListener("click", function () {
        apply(currentTheme() === "dark" ? "light" : "dark", true);
      });
    }

    /* honour OS preference changes unless the user chose explicitly */
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function (e) {
        if (!readStored()) apply(e.matches ? "dark" : "light", false);
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    syncState();

    /* render the lucide icons we just injected */
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      try { window.lucide.createIcons(); } catch (e) {}
    }
  }

  init();
})();