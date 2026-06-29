/* ==========================================================================
   Nick Bourque - Revamped Interaction Scripts
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 2. Light / Dark Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  // Retrieve theme preference from localStorage or default to dark
  const storedTheme = localStorage.getItem('theme') || 'dark';
  if (storedTheme === 'light') {
    body.classList.add('light-mode');
    body.classList.remove('dark-mode');
  } else {
    body.classList.add('dark-mode');
    body.classList.remove('light-mode');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        body.classList.add('light-mode');
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  // 3. Mobile Navigation Drawer
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.setAttribute('aria-hidden', isExpanded);
      
      // Toggle body scrolling to prevent scroll background when menu is open
      if (!isExpanded) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    // Close mobile menu if window is resized above tablet breakpoint
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }

  // 4. Portfolio Category Filtering
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card[data-category]');

  if (filterButtons.length > 0 && projectCards.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Toggle active button class
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const filter = button.getAttribute('data-filter');

        projectCards.forEach(card => {
          const category = card.getAttribute('data-category');
          
          if (filter === 'all' || category === filter) {
            card.style.display = 'flex';
            // Subtle fade-in animation trigger
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
              card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }, 50);
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // 5. Scroll Progress Bar (Blog Posts)
  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = scrollPercent + '%';
    });
  }

  // 6. Fallback Scroll Shrinking Header (for browsers missing scroll-driven animations)
  const header = document.querySelector('.site-header');
  if (header && !CSS.supports('(animation-timeline: scroll()) and (animation-range: 0% 100%)')) {
    const initialHeight = 80;
    const finalHeight = 60;
    const scrollThreshold = 80;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const percent = Math.min(1, scrollY / scrollThreshold);
      const currentHeight = initialHeight - (initialHeight - finalHeight) * percent;
      
      header.style.height = `${currentHeight}px`;
      if (scrollY > 10) {
        header.style.boxShadow = `0 10px 30px rgba(0,0,0, ${0.1 * percent})`;
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }

  // 7. IntersectionObserver for Skill Bars entrance animation
  const skillProgressBars = document.querySelectorAll('.skill-progress-bar');
  if (skillProgressBars.length > 0) {
    const skillObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          // Trigger transition by resetting width to style width
          const targetWidth = bar.style.width;
          bar.style.width = '0';
          setTimeout(() => {
            bar.style.transition = 'width 1.2s ease-out';
            bar.style.width = targetWidth;
          }, 100);
          observer.unobserve(bar); // Run once
        }
      });
    }, { threshold: 0.1 });

    skillProgressBars.forEach(bar => skillObserver.observe(bar));
  }

  // 8. Scroll Reveal for generic element entrance
  const revealElements = document.querySelectorAll('.teaser-card, .skills-card, .blog-post-card, .blog-feed-card, .timeline-item');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Add inline style if transition is set in CSS
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(el => {
      // Set initial state
      el.style.opacity = '0';
      el.style.transform = 'translateY(25px)';
      el.style.transition = 'opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      revealObserver.observe(el);
    });
  }

  // 9. Contribution heatmap tooltip (delegated; native title is the no-JS fallback)
  const contribGrid = document.querySelector('.contrib-grid');
  if (contribGrid) {
    let tooltip = null;

    const showTooltip = (cell) => {
      if (!cell.dataset.week) return;
      cell.removeAttribute('title'); // suppress the native tooltip while ours is shown
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'contrib-tooltip';
        document.body.appendChild(tooltip);
      }
      const total = cell.dataset.total;
      tooltip.innerHTML =
        `<div class="contrib-tip-date">Week of ${cell.dataset.week} &middot; ${total} contribution${total === '1' ? '' : 's'}</div>` +
        `<div class="contrib-tip-row"><span class="contrib-tip-dot gl"></span>GitLab ${cell.dataset.gl}</div>` +
        `<div class="contrib-tip-row"><span class="contrib-tip-dot gh"></span>GitHub ${cell.dataset.gh}</div>`;
      const rect = cell.getBoundingClientRect();
      tooltip.style.left = rect.left + rect.width / 2 + 'px';
      tooltip.style.top = rect.top + 'px';
      tooltip.style.transform = 'translate(-50%, calc(-100% - 8px))';
      // Force reflow so the fade-in transition plays from the hidden state.
      tooltip.classList.remove('visible');
      void tooltip.offsetWidth;
      tooltip.classList.add('visible');
    };

    const hideTooltip = () => {
      if (tooltip) tooltip.classList.remove('visible');
    };

    contribGrid.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('.contrib-day');
      if (cell && contribGrid.contains(cell)) showTooltip(cell);
    });
    contribGrid.addEventListener('mouseout', (e) => {
      const cell = e.target.closest('.contrib-day');
      if (cell) hideTooltip();
    });
  }
});
