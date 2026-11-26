/* ==========================================================================
   Nick Bourque — site scripts (Coastline theme)
   The saved theme is applied by an inline script in <head>; this file only
   handles the toggle, the mobile menu, contour maps and small extras.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;

  // 1. Theme toggle. With no saved choice the CSS follows the OS setting.
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.getAttribute('data-theme') || (prefersDark.matches ? 'dark' : 'light');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
    });
  }

  // 2. Mobile menu
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  const setMenu = (open) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.setAttribute('aria-hidden', String(!open));
    if (open) mobileMenu.removeAttribute('inert'); else mobileMenu.setAttribute('inert', '');
    document.body.style.overflow = open ? 'hidden' : '';
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') { setMenu(false); menuToggle.focus(); }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) setMenu(false); });
  }

  // 3. Contour maps. Each <svg class="topo" data-topo="cx,cy,rings,step,seed;..."> gets
  //    wobbly concentric rings drawn around each centre. Deterministic, so every
  //    visit shows the same "terrain".
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('svg.topo[data-topo]').forEach((svg) => {
    const centres = svg.dataset.topo.split(';').map((c) => c.split(',').map(Number));
    centres.forEach(([cx, cy, count, step, seed]) => {
      for (let k = 1; k <= count; k++) {
        const r0 = k * step;
        let d = '';
        for (let j = 0; j <= 96; j++) {
          const t = (j / 96) * Math.PI * 2;
          const r = r0 * (1
            + 0.09 * Math.sin(3 * t + seed + k * 0.35)
            + 0.05 * Math.sin(5 * t + seed * 2 - k * 0.2)
            + 0.03 * Math.sin(8 * t + k));
          const x = cx + r * Math.cos(t) * 1.35;
          const y = cy + r * Math.sin(t);
          d += (j ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        }
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', d + 'Z');
        path.setAttribute('pathLength', '1');
        if (k % 5 === 0) path.setAttribute('class', 'major');
        svg.appendChild(path);
      }
    });
    if (!reduceMotion && svg.dataset.draw !== undefined) svg.classList.add('draw');
  });

  // 4. Portfolio filter (portfolio page only)
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projects = document.querySelectorAll('.project[data-category]');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      const filter = button.dataset.filter;
      projects.forEach((p) => { p.hidden = !(filter === 'all' || p.dataset.category === filter); });
    });
  });

  // 5. Reading progress (blog posts only)
  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // 6. Copy the address when a mailto link is clicked (the mailto still opens)
  let toastTimer;
  const showToast = (text) => {
    let toast = document.querySelector('.copy-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'copy-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    requestAnimationFrame(() => toast.classList.add('visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
  };

  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', () => {
      const email = link.href.replace('mailto:', '');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(() => showToast(email + ' copied to clipboard')).catch(() => {});
      }
    });
  });
});
