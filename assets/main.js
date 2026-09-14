/* ============================================================
   EMMANUEL BRENDAN — MAIN JAVASCRIPT
   ============================================================ */

(function () {
  'use strict';

  /* ── PAGE LOADER ──────────────────────────────────────── */
  const loader = document.createElement('div');
  loader.className = 'page-loader';
  loader.innerHTML = `
    <div class="loader-inner">
      <div class="loader-logo">EMMANUEL BRENDAN</div>
      <div class="loader-bar"><div class="loader-bar-fill"></div></div>
    </div>`;
  document.body.prepend(loader);
  document.body.style.overflow = 'hidden';

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('done');
      document.body.style.overflow = '';
      initAnimations();
    }, 1100);
  });

  /* ── NAVBAR SCROLL ────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  const dock = document.getElementById('sticky-dock');
  let lastScroll = 0;
  let scrollTicking = false;

  function onScroll() {
    const scrollY = window.scrollY;
    // Navbar
    if (scrollY > 20) { navbar.classList.add('scrolled'); }
    else { navbar.classList.remove('scrolled'); }
    // Hero scroll indicator (hide once scrolled past 80px)
    const hero = document.getElementById('hero');
    if (hero) {
      if (scrollY > 80) {
        hero.style.setProperty('--scroll-indicator-opacity', '0');
      } else {
        hero.style.setProperty('--scroll-indicator-opacity', '1');
      }
    }
    lastScroll = scrollY;
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => { onScroll(); scrollTicking = false; });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ── HERO ANIMATIONS ──────────────────────────────────────── */
  function initAnimations() {
    // Hero elements
    const nameParts = document.querySelectorAll('.hero-name-part');
    const heroIcon = document.querySelector('.hero-icon-x');
    const heroSub = document.querySelector('.hero-subtitle');
    const heroStatus = document.querySelector('.hero-status-badge');

    setTimeout(() => {
      nameParts.forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 120);
      });
    }, 50);
    setTimeout(() => heroIcon && heroIcon.classList.add('visible'), 350);
    setTimeout(() => heroSub && heroSub.classList.add('visible'), 550);
    setTimeout(() => heroStatus && heroStatus.classList.add('visible'), 750);

    // Scroll-triggered reveal
    initScrollReveal();
    // Works section: filters + floating preview
    initWorksSection();
    // Services section: hover image cards
    initServicesSection();
  }

  /* ── WORKS SECTION ─────────────────────────────────────── */
  function initWorksSection() {
    // Filter pills
    const filterBtns = document.querySelectorAll('.wf-btn');
    const workRows   = document.querySelectorAll('.work-row');

    if (filterBtns.length) {
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.dataset.filter;
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          workRows.forEach(row => {
            const cat = row.dataset.category || '';
            const show = filter === 'all' || cat.includes(filter);
            row.classList.toggle('filtered-out', !show);
          });
        });
      });
    }

    // Case study page filter tabs
    const csFilterTabs = document.querySelectorAll('.work-filter-tab');
    const csCards      = document.querySelectorAll('.cs-card');

    if (csFilterTabs.length) {
      csFilterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const filter = tab.dataset.filter;
          csFilterTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          csCards.forEach(card => {
            const cat = card.dataset.category || '';
            const show = filter === 'all' || cat.includes(filter);
            card.classList.toggle('filtered-out', !show);
          });
        });
      });
    }

    // Floating image preview — desktop only, not touch devices
    const preview    = document.getElementById('work-preview');
    const previewImg = document.getElementById('work-preview-img');
    const isTouch    = window.matchMedia('(hover: none)').matches;

    if (!preview || !previewImg || window.innerWidth <= 900 || isTouch) return;

    preview.style.display = 'block';

    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;
    let rafId = null;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function lerp(a, b, t) { return a + (b - a) * t; }

    function animatePreview() {
      currentX = lerp(currentX, mouseX, 0.1);
      currentY = lerp(currentY, mouseY, 0.1);
      preview.style.left = (currentX + 24) + 'px';
      preview.style.top  = (currentY - preview.offsetHeight / 2) + 'px';
      rafId = requestAnimationFrame(animatePreview);
    }

    // Cleanup RAF on page unload to prevent leaks
    window.addEventListener('pagehide', () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    });

    workRows.forEach(row => {
      const imgSrc = row.querySelector('.wr-img-wrap img')?.src;
      if (!imgSrc) return;

      row.addEventListener('mouseenter', () => {
        previewImg.src = imgSrc;
        preview.classList.add('is-active');
        if (!rafId) animatePreview();
      });

      row.addEventListener('mouseleave', () => {
        preview.classList.remove('is-active');
        cancelAnimationFrame(rafId);
        rafId = null;
      });
    });
  }

  /* ── SCROLL REVEAL (IntersectionObserver) ─────────────── */
  function initScrollReveal() {
    const autoReveal = document.querySelectorAll(
      '.about-statement, .about-body, .stack-eyebrow, .stack-col, .works-header, .services-label, .services-content, ' +
      '.testimonials-label, .testimonials-inner, .trusted-label, .logos-grid, ' +
      '.contact-left, .contact-right, .life-header, .life-marquee-container, .footer-container'
    );
    autoReveal.forEach(el => el.classList.add('reveal'));

    const allReveal = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    allReveal.forEach(el => observer.observe(el));

    // Stagger work rows on scroll
    const workRows = document.querySelectorAll('.work-row');
    const rowObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          rowObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

    workRows.forEach((row, i) => {
      row.style.transitionDelay = `${i * 0.05}s`;
      rowObserver.observe(row);
    });
  }

  /* ── SERVICES SECTION ─────────────────────────────────── */
  function initServicesSection() {
    const svcNames = document.querySelectorAll('.svc-name');
    const svcCards = document.querySelectorAll('.svc-img-card');

    if (!svcNames.length) return;

    svcNames.forEach(name => {
      const svc = name.dataset.svc;

      name.addEventListener('mouseenter', () => {
        // Hide all cards first
        svcCards.forEach(card => card.classList.remove('is-active'));
        // Show only cards for this service
        document.querySelectorAll(`[data-svc-card="${svc}"]`)
          .forEach(card => card.classList.add('is-active'));
      });

      name.addEventListener('mouseleave', () => {
        svcCards.forEach(card => card.classList.remove('is-active'));
      });
    });
  }

  /* ── TESTIMONIALS TABS ────────────────────────────────── */
  const tabBtns = document.querySelectorAll('.tab-person');
  const quotes = document.querySelectorAll('.testimonial-quote');

  function setTab(idx) {
    tabBtns.forEach(b => b.classList.remove('active'));
    quotes.forEach(q => q.classList.remove('active'));
    tabBtns[idx] && tabBtns[idx].classList.add('active');
    quotes[idx] && quotes[idx].classList.add('active');
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => setTab(Number(btn.dataset.tab)));
  });

  // Auto-rotate testimonials every 5s
  let tabIdx = 0;
  setInterval(() => {
    tabIdx = (tabIdx + 1) % tabBtns.length;
    setTab(tabIdx);
  }, 5000);

  /* ── CONTACT FORM & EMAILJS INTEGRATION ───────────────── */
  const EMAILJS_CONFIG = {
    serviceId: 'service_qx5cj9q',
    templateId: 'template_p0ewyov',
    publicKey: 'M3NF-YNY1Sdm99XHv',
    recipientEmail: 'elebrendan@gmail.com'
  };

  // Initialize EmailJS if the browser SDK is loaded
  if (typeof emailjs !== 'undefined') {
    try {
      emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    } catch (initErr) {
      console.warn('EmailJS SDK init warning:', initErr);
    }
  }

  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const serviceInput = document.getElementById('service');
      const messageInput = document.getElementById('message');
      const btn = document.getElementById('form-submit');

      // Clear previous error states
      [nameInput, emailInput, serviceInput].forEach(input => {
        if (input) input.style.borderColor = '';
      });

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const serviceVal = serviceInput ? serviceInput.value : '';
      const messageVal = messageInput ? messageInput.value.trim() : '';

      // Validation
      if (!nameVal) {
        if (nameInput) {
          nameInput.focus();
          nameInput.style.borderColor = '#ef4444';
        }
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal || !emailPattern.test(emailVal)) {
        if (emailInput) {
          emailInput.focus();
          emailInput.style.borderColor = '#ef4444';
        }
        return;
      }

      if (!serviceVal) {
        if (serviceInput) {
          serviceInput.focus();
          serviceInput.style.borderColor = '#ef4444';
        }
        return;
      }

      // Map service code to readable title
      const serviceTitles = {
        'landing-page': 'Landing Page Design',
        'website': 'Website Design',
        'cro': 'CRO / UX Audit',
        'branding': 'Branding & Identity'
      };
      const readableService = serviceTitles[serviceVal] || serviceVal;

      // Loading state
      btn.disabled = true;
      btn.classList.add('is-sending');
      btn.innerHTML = `
        <svg class="btn-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        <span>SENDING...</span>
      `;

      // Clear existing toast if any
      const existingToast = document.getElementById('form-toast');
      if (existingToast) existingToast.remove();

      // Exhaustive template parameters to map any placeholder in template_p0ewyov
      const templateParams = {
        name: nameVal,
        from_name: nameVal,
        user_name: nameVal,
        sender_name: nameVal,

        email: emailVal,
        from_email: emailVal,
        user_email: emailVal,
        reply_to: emailVal,

        service: readableService,
        service_type: readableService,
        project_service: readableService,

        message: messageVal || 'No additional project details provided.',
        project_details: messageVal || 'No additional project details provided.',

        to_email: EMAILJS_CONFIG.recipientEmail,
        to_name: 'Emmanuel Brendan',
        recipient: EMAILJS_CONFIG.recipientEmail,

        subject: `New Project Inquiry from ${nameVal} [${readableService}]`,
        submission_date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      };

      try {
        let sentSuccessfully = false;

        // Strategy 1: Official EmailJS SDK if available
        if (typeof emailjs !== 'undefined' && typeof emailjs.send === 'function') {
          try {
            await emailjs.send(
              EMAILJS_CONFIG.serviceId,
              EMAILJS_CONFIG.templateId,
              templateParams,
              EMAILJS_CONFIG.publicKey
            );
            sentSuccessfully = true;
          } catch (sdkErr) {
            console.warn('EmailJS SDK send failed, falling back to direct API:', sdkErr);
          }
        }

        // Strategy 2: Direct EmailJS API call
        if (!sentSuccessfully) {
          const apiResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              service_id: EMAILJS_CONFIG.serviceId,
              template_id: EMAILJS_CONFIG.templateId,
              user_id: EMAILJS_CONFIG.publicKey,
              template_params: templateParams
            })
          });

          if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            throw new Error(`EmailJS API returned status ${apiResponse.status}: ${errorBody}`);
          }
          sentSuccessfully = true;
        }

        // SUCCESS UI
        btn.classList.remove('is-sending');
        btn.classList.add('is-success');
        btn.innerHTML = `<span>MESSAGE SENT ✓</span>`;

        const toast = document.createElement('div');
        toast.id = 'form-toast';
        toast.className = 'form-toast form-toast--success';
        toast.textContent = "Thank you! Your project details have been sent to Emmanuel. I'll get back to you within 24 hours.";
        form.appendChild(toast);
        form.reset();

        setTimeout(() => {
          btn.classList.remove('is-success');
          btn.disabled = false;
          btn.innerHTML = `
            <span>SUBMIT</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
          `;
          if (toast) {
            toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(4px)';
            setTimeout(() => toast.remove(), 400);
          }
        }, 5000);

      } catch (err) {
        console.error('Failed to send contact inquiry via EmailJS:', err);
        btn.classList.remove('is-sending');
        btn.classList.add('is-error');
        btn.innerHTML = `<span>FAILED TO SEND ✕</span>`;

        const toast = document.createElement('div');
        toast.id = 'form-toast';
        toast.className = 'form-toast form-toast--error';
        toast.innerHTML = `Oops, something went wrong. You can reach Emmanuel directly at <a href="mailto:${EMAILJS_CONFIG.recipientEmail}" style="color: #fff; font-weight: 600; text-decoration: underline;">${EMAILJS_CONFIG.recipientEmail}</a>`;
        form.appendChild(toast);

        setTimeout(() => {
          btn.classList.remove('is-error');
          btn.disabled = false;
          btn.innerHTML = `
            <span>TRY AGAIN</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
          `;
        }, 4500);
      }
    });
  }

  /* ── CONTACT RED BLOB MOUSE PARALLAX ──────────────────── */
  const contactSec = document.getElementById('contact');
  const contactBlob = document.querySelector('.contact-red-blob');
  if (contactSec && contactBlob && window.innerWidth > 768) {
    contactSec.addEventListener('mousemove', (e) => {
      const rect = contactSec.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      contactBlob.style.transform = `translate(${relX * 36}px, ${relY * 36}px)`;
    }, { passive: true });

    contactSec.addEventListener('mouseleave', () => {
      contactBlob.style.transform = 'translate(0px, 0px)';
    });
  }

  /* ── DOCK MENU BUTTON & POPOVER ──────────────────────── */
  const menuBtn = document.getElementById('dock-menu-btn');
  if (menuBtn) {
    let popover = document.querySelector('.dock-menu-popover');
    if (!popover) {
      popover = document.createElement('div');
      popover.className = 'dock-menu-popover';
      const basePath = window.location.pathname.includes('/pages/') ? '../' : '';
      popover.innerHTML = `
        <a href="${basePath}index.html" class="dock-menu-item"><span>Home</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></a>
        <a href="${basePath}index.html#about" class="dock-menu-item"><span>About</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></a>
        <a href="${basePath}case-study.html" class="dock-menu-item"><span>Case Studies</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></a>
        <a href="${basePath}index.html#services" class="dock-menu-item"><span>Services</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></a>
        <a href="${basePath}index.html#testimonials" class="dock-menu-item"><span>Testimonials</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></a>
        <a href="${basePath}index.html#contact" class="dock-menu-item"><span>Contact</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></a>
        <a href="https://calendar.app.google/o8xFfmjKJcM9aER78" target="_blank" rel="noopener" class="dock-menu-item" style="color: var(--red);"><span>Book A Call ↗</span></a>
      `;
      document.body.appendChild(popover);
    }

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = popover.classList.toggle('open');
      menuBtn.classList.toggle('active', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        popover.classList.remove('open');
        menuBtn.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        popover.classList.remove('open');
        menuBtn.classList.remove('active');
      }
    });
  }

  /* ── PARALLAX HERO ────────────────────────────────────────── */
  const heroPortrait = document.querySelector('.hero-portrait');
  if (heroPortrait && window.innerWidth > 768) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const heroH = document.querySelector('.hero').offsetHeight;
      if (scrollY < heroH) {
        // Must preserve translateX(-50%) centering + add parallax
        heroPortrait.style.transform = `translateX(-50%) translateY(${scrollY * 0.22}px)`;
      } else {
        heroPortrait.style.transform = 'translateX(-50%)';
      }
    }, { passive: true });
  }

  /* ── CURSOR GLOW (desktop) ────────────────────────────── */
  if (window.innerWidth > 768) {
    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    Object.assign(glow.style, {
      position: 'fixed',
      width: '360px',
      height: '360px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(192,57,43,0.06) 0%, transparent 70%)',
      pointerEvents: 'none',
      zIndex: '1',
      transform: 'translate(-50%, -50%)',
      transition: 'left 0.12s ease, top 0.12s ease',
      left: '-500px', top: '-500px'
    });
    document.body.appendChild(glow);

    window.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });
  }

})();
