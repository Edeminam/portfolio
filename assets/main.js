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

  /* ── HERO ANIMATIONS ──────────────────────────────────── */
  function initAnimations() {
    // Hero elements
    const nameParts = document.querySelectorAll('.hero-name-part');
    const heroIcon = document.querySelector('.hero-icon-x');
    const heroSub = document.querySelector('.hero-subtitle');

    setTimeout(() => {
      nameParts.forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 120);
      });
    }, 50);
    setTimeout(() => heroIcon && heroIcon.classList.add('visible'), 350);
    setTimeout(() => heroSub && heroSub.classList.add('visible'), 550);

    // Scroll-triggered reveal
    initScrollReveal();
    // New works filter + preview
    initWorksSection();
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

    // Floating image preview on desktop
    const preview    = document.getElementById('work-preview');
    const previewImg = document.getElementById('work-preview-img');

    if (!preview || !previewImg || window.innerWidth <= 900) return;

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
      '.contact-left, .contact-right, .life-header, .life-marquee-container, .footer-inner'
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
  initServicesSection();

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

  /* ── CONTACT FORM ─────────────────────────────────────── */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const btn = document.getElementById('form-submit');

      if (!nameInput.value.trim()) {
        nameInput.focus();
        nameInput.style.borderColor = 'var(--red)';
        return;
      }
      if (!emailInput.value.trim() || !emailInput.value.includes('@')) {
        emailInput.focus();
        emailInput.style.borderColor = 'var(--red)';
        return;
      }

      nameInput.style.borderColor = '';
      emailInput.style.borderColor = '';

      btn.textContent = 'SENT ✓';
      btn.style.background = '#27ae60';
      btn.disabled = true;

      let toast = document.getElementById('form-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'form-toast';
        toast.style.cssText = 'margin-top: 14px; font-size: 13px; color: #27ae60; font-family: var(--font-body); text-align: center;';
        form.appendChild(toast);
      }
      toast.textContent = "Thanks! I'll reply within 24 hours.";

      setTimeout(() => {
        btn.innerHTML = 'SUBMIT <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>';
        btn.style.background = '';
        btn.disabled = false;
        if (toast) toast.remove();
        form.reset();
      }, 4000);
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
        <a href="https://cal.com" target="_blank" rel="noopener" class="dock-menu-item" style="color: var(--red);"><span>Book A Call ↗</span></a>
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
