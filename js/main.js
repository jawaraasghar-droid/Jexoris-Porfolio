/* ═══════════════════════════════════════════════════════════
   MIDNIGHT GENESIS — interactions
   Everything here is deliberately slow. Nothing bounces.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ─────────────────────────────────────────────
     1. LOADING SCREEN
     ───────────────────────────────────────────── */
  var loader = document.getElementById('loader');
  document.body.classList.add('is-loading');

  function dismissLoader() {
    if (!loader || loader.classList.contains('is-done')) return;
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    if (finePointer) document.body.classList.add('cursor-ready');
    // reveal whatever is already on screen once the curtain lifts
    window.setTimeout(revealVisible, 60);
  }

  var minShow = reduceMotion ? 400 : 2900;
  var started = Date.now();

  window.addEventListener('load', function () {
    var waited = Date.now() - started;
    window.setTimeout(dismissLoader, Math.max(0, minShow - waited));
  });
  // hard fallback: never trap the visitor behind the curtain
  window.setTimeout(dismissLoader, minShow + 2500);

  /* ─────────────────────────────────────────────
     2. CUSTOM CURSOR — dot + glass ring
     ───────────────────────────────────────────── */
  var dot  = document.getElementById('cursorDot');
  var ring = document.getElementById('cursorRing');

  if (finePointer && dot && ring) {
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    }, { passive: true });

    (function trail() {
      rx += (mx - rx) * 0.32;           // gentle trail; the .2s CSS ease does the rest
      ry += (my - ry) * 0.32;
      ring.style.setProperty('--rx', rx.toFixed(1) + 'px');
      ring.style.setProperty('--ry', ry.toFixed(1) + 'px');
      window.requestAnimationFrame(trail);
    })();

    // hover states
    var hoverables = document.querySelectorAll('a, button, [data-cursor]');
    Array.prototype.forEach.call(hoverables, function (el) {
      var kind = el.getAttribute('data-cursor') === 'card' ? 'is-card' : 'is-link';
      el.addEventListener('mouseenter', function () {
        ring.classList.add(kind);
        dot.classList.add('is-hidden');
      });
      el.addEventListener('mouseleave', function () {
        ring.classList.remove('is-link', 'is-card');
        dot.classList.remove('is-hidden');
      });
    });

    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      dot.style.opacity = '';
      ring.style.opacity = '';
    });
  }

  /* ─────────────────────────────────────────────
     3. MOUSE PARALLAX — the reflections bend
     ───────────────────────────────────────────── */
  var bg    = document.querySelector('.bg');
  var glare = document.querySelector('.hero__glare');

  if (!reduceMotion && finePointer && bg) {
    var tx = 0, ty = 0, cx = 0, cy = 0;

    document.addEventListener('mousemove', function (e) {
      tx = (e.clientX / window.innerWidth  - 0.5) * 44;   // max ~22px each way
      ty = (e.clientY / window.innerHeight - 0.5) * 44;
    }, { passive: true });

    (function bend() {
      cx += (tx - cx) * 0.045;          // very slow follow — it drifts, it doesn't track
      cy += (ty - cy) * 0.045;
      bg.style.setProperty('--px', cx.toFixed(2) + 'px');
      bg.style.setProperty('--py', cy.toFixed(2) + 'px');
      if (glare) glare.style.setProperty('--gx', (cx * 2.4).toFixed(2) + 'px');
      window.requestAnimationFrame(bend);
    })();
  }

  /* ─────────────────────────────────────────────
     4. PARTICLES — tiny, slow, barely there
     ───────────────────────────────────────────── */
  var canvas = document.getElementById('particles');

  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var particles = [];

    function sizeCanvas() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width  = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      var count = Math.round(Math.min(90, Math.max(34, (w * h) / 24000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.4,
          vx: (Math.random() - 0.5) * 0.10,
          vy: -(Math.random() * 0.12 + 0.02),
          a: Math.random() * 0.5 + 0.12,
          tw: Math.random() * Math.PI * 2,
          ts: Math.random() * 0.012 + 0.004
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.tw += p.ts;

        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        var alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(140,214,255,' + alpha.toFixed(3) + ')';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(101,184,255,' + (alpha * 0.8).toFixed(3) + ')';
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      window.requestAnimationFrame(draw);
    }

    sizeCanvas();
    seed();
    draw();

    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () { sizeCanvas(); seed(); }, 200);
    });
  }

  /* ─────────────────────────────────────────────
     5. SCROLL REVEAL — fade + blur
     ───────────────────────────────────────────── */
  var revealEls = document.querySelectorAll('.reveal');

  // stagger cards inside grids
  Array.prototype.forEach.call(document.querySelectorAll('.skills, .projects, .philosophy, .contact'), function (grid) {
    Array.prototype.forEach.call(grid.children, function (child, i) {
      child.style.setProperty('--i', i);
      child.style.transitionDelay = (i * 70) + 'ms';
    });
  });

  function revealVisible() {
    Array.prototype.forEach.call(revealEls, function (el) {
      var box = el.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.92) el.classList.add('is-in');
    });
  }

  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('is-in'); });
  }

  /* ─────────────────────────────────────────────
     6. TIMELINE — the line fills, the icons wake up
     ───────────────────────────────────────────── */
  var timeline = document.getElementById('timeline');
  var progress = document.getElementById('timelineProgress');
  var steps    = document.querySelectorAll('.tl');

  function updateTimeline() {
    if (!timeline || !progress) return;
    var rail = timeline.querySelector('.timeline__rail');
    var box  = rail.getBoundingClientRect();
    var mark = window.innerHeight * 0.62;                  // the "reading line"
    var pct  = (mark - box.top) / box.height;
    pct = Math.max(0, Math.min(1, pct));
    progress.style.height = (pct * 100).toFixed(2) + '%';

    Array.prototype.forEach.call(steps, function (step) {
      var node = step.querySelector('.tl__node').getBoundingClientRect();
      if (node.top + node.height / 2 < mark) step.classList.add('is-lit');
      else step.classList.remove('is-lit');
    });
  }

  /* ─────────────────────────────────────────────
     7. NAVIGATION — glass on scroll, active section
     ───────────────────────────────────────────── */
  var nav      = document.getElementById('nav');
  var navLinks = document.querySelectorAll('.nav__link');
  var sections = [];

  Array.prototype.forEach.call(navLinks, function (link) {
    var target = document.querySelector(link.getAttribute('href'));
    if (target) sections.push({ link: link, el: target });
  });

  function updateNav() {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 40);

    var mark = window.scrollY + window.innerHeight * 0.35;
    var current = null;
    sections.forEach(function (s) {
      if (s.el.offsetTop <= mark) current = s.link;
    });
    Array.prototype.forEach.call(navLinks, function (l) {
      l.classList.toggle('is-active', l === current);
    });
  }

  /* mobile menu */
  var toggle   = document.getElementById('navToggle');
  var menu     = document.getElementById('navLinks');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    Array.prototype.forEach.call(navLinks, function (l) {
      l.addEventListener('click', function () {
        menu.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ─────────────────────────────────────────────
     8. ONE SCROLL LISTENER FOR EVERYTHING
     ───────────────────────────────────────────── */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateNav();
      updateTimeline();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateNav();
  updateTimeline();
})();
