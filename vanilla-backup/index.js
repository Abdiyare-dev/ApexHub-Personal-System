/* ============================================================
   ApexHub Dashboard — Interactive Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ---- Element refs ----
  const html = document.documentElement;
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const themeToggle = document.getElementById('themeToggle');
  const mainWrapper = document.getElementById('mainWrapper');

  // ---- Theme Toggle ----
  const savedTheme = localStorage.getItem('apexhub-theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('apexhub-theme', next);
  });

  // ---- Sidebar Collapse / Expand (Desktop) ----
  const savedCollapsed = localStorage.getItem('apexhub-sidebar-collapsed');
  if (savedCollapsed === 'true') {
    sidebar.classList.add('collapsed');
  }

  sidebarToggle.addEventListener('click', () => {
    // On mobile, close the sidebar
    if (window.innerWidth <= 768) {
      closeMobileSidebar();
      return;
    }
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('apexhub-sidebar-collapsed', sidebar.classList.contains('collapsed'));
  });

  // ---- Mobile Sidebar ----
  function openMobileSidebar() {
    sidebar.classList.add('mobile-open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', openMobileSidebar);
  sidebarOverlay.addEventListener('click', closeMobileSidebar);

  // Close mobile sidebar on resize above 768
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeMobileSidebar();
    }
  });

  // ---- Accordion Menus ----
  const accordionTriggers = document.querySelectorAll('.nav-accordion-trigger');

  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const accordionKey = trigger.getAttribute('data-accordion');
      const panel = document.getElementById(accordionKey + 'Panel');
      const isOpen = trigger.classList.contains('open');

      // Close all panels first
      accordionTriggers.forEach(t => {
        const key = t.getAttribute('data-accordion');
        const p = document.getElementById(key + 'Panel');
        t.classList.remove('open');
        if (p) {
          p.style.maxHeight = null;
          p.classList.remove('open');
        }
      });

      // If it was closed, open it
      if (!isOpen && panel) {
        trigger.classList.add('open');
        panel.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  // ---- Progress Bar Animation ----
  function animateProgressBars() {
    const fills = document.querySelectorAll('.progress-fill');
    fills.forEach(fill => {
      const target = fill.getAttribute('data-width');
      // Small delay to allow the CSS transition to kick in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fill.style.width = target + '%';
        });
      });
    });
  }

  // Use IntersectionObserver to trigger when visible
  const statsGoals = document.getElementById('statsGoals');
  if (statsGoals) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateProgressBars();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(statsGoals);
  } else {
    // Fallback
    setTimeout(animateProgressBars, 600);
  }

  // ---- Summary Button Active State ----
  const navSummary = document.getElementById('navSummary');
  const navLinks = document.querySelectorAll('.nav-link, .nav-sub-item');

  navSummary.addEventListener('click', () => {
    navLinks.forEach(l => l.classList.remove('active'));
    navSummary.classList.add('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navSummary.classList.remove('active');
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // ---- KPI Card counter animation ----
  function animateCounters() {
    const kpiCards = document.querySelectorAll('.kpi-value');
    kpiCards.forEach(card => {
      const text = card.textContent;
      const isPercent = text.includes('%');
      const isDollar = text.includes('$');

      let rawNum;
      if (isDollar) {
        rawNum = parseFloat(text.replace(/[$,]/g, ''));
      } else if (isPercent) {
        rawNum = parseFloat(text.replace('%', ''));
      } else {
        rawNum = parseInt(text, 10);
      }

      if (isNaN(rawNum)) return;

      const duration = 1200;
      const startTime = performance.now();
      const isFloat = text.includes('.');

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * rawNum;

        if (isDollar) {
          card.textContent = '$' + (isFloat
            ? current.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : Math.round(current).toLocaleString());
        } else if (isPercent) {
          card.textContent = Math.round(current) + '%';
        } else {
          card.textContent = Math.round(current);
        }

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          // Restore original text to avoid rounding artifacts
          card.textContent = text;
        }
      }

      card.textContent = isDollar ? '$0' : isPercent ? '0%' : '0';
      requestAnimationFrame(tick);
    });
  }

  // Start counter animation after a short delay
  setTimeout(animateCounters, 350);
});
