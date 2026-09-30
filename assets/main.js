/* ============================================================
   EMMANUEL BRENDAN — SITE SCRIPT
   Each feature is a self-contained init function that exits early
   when its markup is not on the current page.
   ============================================================ */

(() => {
  'use strict';

  /* ── ENVIRONMENT ──────────────────────────────────────────── */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Mouse-driven effects only make sense with a precise pointer that can hover
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  /** Run `fn` at most once per animation frame. */
  function rafThrottle(fn) {
    let queued = false;
    let lastArgs;
    return (...args) => {
      lastArgs = args;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        fn(...lastArgs);
      });
    };
  }

  /* ── PAGE LOADER ──────────────────────────────────────────── */
  // Shows the brand intro, then reveals the page once it has loaded.
  // The bar animation takes ~1.2s; the loader never blocks for more than 3s.
  const LOADER_MIN_MS = 1200;
  const LOADER_MAX_MS = 3000;

  function initLoader(onDone) {
    if (reducedMotion) {
      onDone();
      return;
    }

    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = `
      <div class="loader-inner">
        <div class="loader-logo">EMMANUEL BRENDAN</div>
        <div class="loader-bar"><div class="loader-bar-fill"></div></div>
      </div>`;
    document.body.prepend(loader);
    document.body.style.overflow = 'hidden';

    const start = performance.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      loader.classList.add('done');
      document.body.style.overflow = '';
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
      onDone();
    };

    const finishAfterMinimum = () => {
      setTimeout(finish, Math.max(0, LOADER_MIN_MS - (performance.now() - start)));
    };

    if (document.readyState === 'complete') finishAfterMinimum();
    else window.addEventListener('load', finishAfterMinimum, { once: true });
    setTimeout(finish, LOADER_MAX_MS);
  }

  /* ── NAVBAR ───────────────────────────────────────────────── */
  function initNavbar() {
    const navbar = $('#navbar');
    if (!navbar) return;
    const update = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', rafThrottle(update), { passive: true });
    update();
  }

  /* ── HERO INTRO (home) ────────────────────────────────────── */
  function initHeroIntro() {
    $$('.hero-name-part').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), 50 + i * 120);
    });
    [['.hero-icon-x', 350], ['.hero-subtitle', 550], ['.hero-status-badge', 750]].forEach(([selector, delay]) => {
      const el = $(selector);
      if (el) setTimeout(() => el.classList.add('visible'), delay);
    });
  }

  /* ── HERO PARALLAX (home) ─────────────────────────────────── */
  function initHeroParallax() {
    const portrait = $('.hero-portrait');
    const hero = $('.hero');
    if (!portrait || !hero || reducedMotion || !finePointer) return;

    const update = () => {
      const offset = Math.min(window.scrollY, hero.offsetHeight) * 0.22;
      // translateX(-50%) keeps the portrait centred
      portrait.style.transform = `translateX(-50%) translateY(${offset}px)`;
    };
    window.addEventListener('scroll', rafThrottle(update), { passive: true });
  }

  /* ── SCROLL REVEAL ────────────────────────────────────────── */
  const AUTO_REVEAL = [
    '.about-statement', '.about-body', '.stack-eyebrow', '.stack-col', '.works-header',
    '.testimonials-label', '.testimonials-inner', '.trusted-label',
    '.contact-left', '.contact-right', '.life-header', '.life-marquee-container', '.footer-container',
  ].join(', ');

  function initScrollReveal() {
    const reveal = (options) => new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, options);

    $$(AUTO_REVEAL).forEach((el) => el.classList.add('reveal'));
    const sectionObserver = reveal({ threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal, .reveal-left, .reveal-right').forEach((el) => sectionObserver.observe(el));

    // Work rows stagger in one after another
    const rowObserver = reveal({ threshold: 0.06, rootMargin: '0px 0px -20px 0px' });
    $$('.work-row').forEach((row, i) => {
      row.style.transitionDelay = `${i * 0.05}s`;
      rowObserver.observe(row);
    });
  }

  /* ── WORK LIST HOVER PREVIEW (home) ───────────────────────── */
  function initWorkPreview() {
    const preview = $('#work-preview');
    const previewImg = $('#work-preview-img');
    const rows = $$('.work-row');
    if (!preview || !previewImg || !rows.length || !finePointer || window.innerWidth <= 900) return;

    preview.style.display = 'block';

    let mouseX = 0;
    let mouseY = 0;
    let x = 0;
    let y = 0;
    let rafId = null;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Ease the preview towards the cursor for a trailing effect
    const follow = () => {
      x += (mouseX - x) * 0.1;
      y += (mouseY - y) * 0.1;
      preview.style.left = `${x + 24}px`;
      preview.style.top = `${y - preview.offsetHeight / 2}px`;
      rafId = requestAnimationFrame(follow);
    };
    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = null;
    };

    rows.forEach((row) => {
      const src = $('.wr-img-wrap img', row)?.src;
      if (!src) return;
      row.addEventListener('mouseenter', () => {
        previewImg.src = src;
        preview.classList.add('is-active');
        if (!rafId) follow();
      });
      row.addEventListener('mouseleave', () => {
        preview.classList.remove('is-active');
        stop();
      });
    });
    window.addEventListener('pagehide', stop);
  }

  /* ── CASE STUDY FILTER (work page) ────────────────────────── */
  function initCaseStudyFilter() {
    const tabs = $$('.work-filter-tab');
    const cards = $$('.cs-card');
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        tabs.forEach((t) => t.classList.toggle('active', t === tab));
        cards.forEach((card) => {
          const show = filter === 'all' || (card.dataset.category || '').includes(filter);
          card.classList.toggle('filtered-out', !show);
        });
      });
    });
  }

  /* ── TESTIMONIALS ─────────────────────────────────────────── */
  const TESTIMONIAL_INTERVAL_MS = 5000;

  function initTestimonials() {
    const tabs = $$('.tab-person');
    const quotes = $$('.testimonial-quote');
    if (!tabs.length) return;

    let current = 0;
    let timer = null;

    const show = (index) => {
      current = index;
      tabs.forEach((tab, i) => tab.classList.toggle('active', i === index));
      quotes.forEach((quote, i) => quote.classList.toggle('active', i === index));
    };
    // A manual pick restarts the countdown
    const restartRotation = () => {
      clearInterval(timer);
      if (!reducedMotion) {
        timer = setInterval(() => show((current + 1) % tabs.length), TESTIMONIAL_INTERVAL_MS);
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        show(Number(tab.dataset.tab));
        restartRotation();
      });
    });
    restartRotation();
  }

  /* ── CONTACT FORM (EmailJS REST API) ──────────────────────── */
  const EMAILJS = {
    endpoint: 'https://api.emailjs.com/api/v1.0/email/send',
    serviceId: 'service_qx5cj9q',
    templateId: 'template_p0ewyov',
    publicKey: 'M3NF-YNY1Sdm99XHv',
  };
  const RECIPIENT = 'elebrendan@gmail.com';
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ARROW_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>';
  const SPINNER_ICON = '<svg class="btn-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>';

  const BUTTON_STATES = {
    idle: { className: '', html: `<span>SUBMIT</span>${ARROW_ICON}` },
    sending: { className: 'is-sending', html: `${SPINNER_ICON}<span>SENDING...</span>` },
    success: { className: 'is-success', html: '<span>MESSAGE SENT ✓</span>' },
    error: { className: 'is-error', html: '<span>FAILED TO SEND ✕</span>' },
    retry: { className: '', html: `<span>TRY AGAIN</span>${ARROW_ICON}` },
  };

  async function sendInquiry({ name, email, service, message }) {
    const details = message || 'No additional project details provided.';
    // The EmailJS template has used several placeholder names over time; send them all
    const templateParams = {
      name, from_name: name, user_name: name, sender_name: name,
      email, from_email: email, user_email: email, reply_to: email,
      service, service_type: service, project_service: service,
      message: details, project_details: details,
      to_email: RECIPIENT, to_name: 'Emmanuel Brendan', recipient: RECIPIENT,
      subject: `New Project Inquiry from ${name} [${service}]`,
      submission_date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    };

    const response = await fetch(EMAILJS.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS.serviceId,
        template_id: EMAILJS.templateId,
        user_id: EMAILJS.publicKey,
        template_params: templateParams,
      }),
    });
    if (!response.ok) {
      throw new Error(`EmailJS responded ${response.status}: ${await response.text()}`);
    }
  }

  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    const fields = {
      name: $('#name', form),
      email: $('#email', form),
      service: $('#service', form),
      message: $('#message', form),
    };
    const button = $('#form-submit', form);

    const setButton = (state) => {
      const { className, html } = BUTTON_STATES[state];
      button.classList.remove('is-sending', 'is-success', 'is-error');
      if (className) button.classList.add(className);
      button.innerHTML = html;
      button.disabled = state === 'sending' || state === 'success' || state === 'error';
    };

    const showToast = (type, html) => {
      $('.form-toast', form)?.remove();
      const toast = document.createElement('div');
      toast.className = `form-toast form-toast--${type}`;
      toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
      toast.innerHTML = html;
      form.appendChild(toast);
      return toast;
    };

    const markInvalid = (field) => {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    };

    // Validate in field order; return the first invalid field, if any
    const firstInvalid = (values) => {
      if (!values.name) return fields.name;
      if (!EMAIL_PATTERN.test(values.email)) return fields.email;
      if (!values.service) return fields.service;
      return null;
    };

    Object.values(fields).forEach((field) => {
      field?.addEventListener('input', () => field.removeAttribute('aria-invalid'));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const values = {
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        service: fields.service.value,
        message: fields.message?.value.trim() ?? '',
      };
      const invalid = firstInvalid(values);
      if (invalid) {
        markInvalid(invalid);
        return;
      }

      const serviceLabel = fields.service.selectedOptions[0]?.textContent.trim() || values.service;
      setButton('sending');
      $('.form-toast', form)?.remove();

      try {
        await sendInquiry({ ...values, service: serviceLabel });
        setButton('success');
        form.reset();
        const toast = showToast('success', "Thank you! Your project details have been sent to Emmanuel. I'll get back to you within 24 hours.");
        setTimeout(() => {
          setButton('idle');
          toast.classList.add('is-leaving');
          toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 5000);
      } catch (err) {
        console.error('Contact form: failed to send inquiry', err);
        setButton('error');
        showToast('error', `Oops, something went wrong. You can reach Emmanuel directly at <a href="mailto:${RECIPIENT}">${RECIPIENT}</a>`);
        setTimeout(() => setButton('retry'), 4500);
      }
    });
  }

  /* ── CONTACT BLOB PARALLAX ────────────────────────────────── */
  function initContactBlob() {
    const section = $('#contact');
    const blob = $('.contact-red-blob');
    if (!section || !blob || reducedMotion || !finePointer) return;

    section.addEventListener('mousemove', rafThrottle((e) => {
      const rect = section.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      blob.style.transform = `translate(${x * 36}px, ${y * 36}px)`;
    }), { passive: true });
    section.addEventListener('mouseleave', () => {
      blob.style.transform = '';
    });
  }

  /* ── DOCK MENU ────────────────────────────────────────────── */
  function initDockMenu() {
    const button = $('#dock-menu-btn');
    const menu = $('#dock-menu');
    if (!button || !menu) return;

    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      button.classList.toggle('active', open);
      button.setAttribute('aria-expanded', String(open));
    };

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!menu.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setOpen(false);
        button.focus();
      }
    });
  }

  /* ── CURSOR GLOW ──────────────────────────────────────────── */
  function initCursorGlow() {
    if (!finePointer || reducedMotion) return;
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    window.addEventListener('mousemove', rafThrottle((e) => {
      glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    }), { passive: true });
  }

  /* ── BOOT ─────────────────────────────────────────────────── */
  initNavbar();
  initDockMenu();
  initCaseStudyFilter();
  initTestimonials();
  initContactForm();
  initContactBlob();
  initHeroParallax();
  initCursorGlow();

  // Entrance animations wait for the loader so they play in view
  initLoader(() => {
    initHeroIntro();
    initScrollReveal();
    initWorkPreview();
  });
})();
