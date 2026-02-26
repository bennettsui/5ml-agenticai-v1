/**
 * TEDxXinyi — Minimal vanilla JS
 * Replaces React hydration with lightweight interactivity.
 */
(function () {
  'use strict';

  // ─── Scroll header: transparent → white on scroll ───
  var nav = document.querySelector('nav[data-nav="main"]');
  if (nav) {
    var logoLight = nav.querySelector('span.font-light');
    var navLinks = nav.querySelectorAll('a[href]');

    function updateNav() {
      var scrolled = window.scrollY > 60;
      if (scrolled) {
        nav.style.backgroundColor = 'white';
        nav.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
        if (logoLight) logoLight.style.color = '#171717';
        navLinks.forEach(function (a) {
          if (a.closest('.md\\:flex') || a.closest('[data-mobile-menu]')) {
            var isActive = a.querySelector('span[style*="background-color"]');
            a.style.color = isActive ? '#171717' : '#737373';
          }
        });
      } else {
        nav.style.backgroundColor = 'transparent';
        nav.style.boxShadow = 'none';
        if (logoLight) logoLight.style.color = 'white';
        navLinks.forEach(function (a) {
          if (a.closest('.md\\:flex')) {
            var isActive = a.querySelector('span[style*="background-color"]');
            a.style.color = isActive ? 'white' : 'rgba(255,255,255,0.7)';
          }
        });
      }
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  // ─── Mobile menu toggle ───
  var menuBtn = document.querySelector('[data-action="toggle-menu"]');
  if (menuBtn && nav) {
    var mobileMenu = null;
    // Create mobile menu from desktop nav links
    var desktopLinks = nav.querySelector('.md\\:flex');
    if (desktopLinks) {
      mobileMenu = document.createElement('div');
      mobileMenu.setAttribute('data-mobile-menu', '');
      mobileMenu.id = 'mobile-menu';
      mobileMenu.className = 'md:hidden overflow-hidden transition-all duration-300';
      mobileMenu.style.maxHeight = '0';
      mobileMenu.style.backgroundColor = 'white';

      var inner = document.createElement('div');
      inner.className = 'px-6 py-4 space-y-1';
      desktopLinks.querySelectorAll('a').forEach(function (link) {
        var a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.textContent.trim();
        a.className = 'block py-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 border-b border-neutral-100';
        if (link.querySelector('span[style*="background-color"]')) {
          a.style.color = '#E62B1E';
          a.style.fontWeight = '700';
        }
        a.addEventListener('click', function () { closeMenu(); });
        inner.appendChild(a);
      });
      mobileMenu.appendChild(inner);
      nav.appendChild(mobileMenu);
    }

    var menuOpen = false;
    function openMenu() {
      menuOpen = true;
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M6 18L18 6"></path></svg>';
      if (mobileMenu) mobileMenu.style.maxHeight = '400px';
      nav.style.backgroundColor = 'white';
      if (logoLight) logoLight.style.color = '#171717';
      menuBtn.style.color = '#171717';
    }
    function closeMenu() {
      menuOpen = false;
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 8h16M4 16h16"></path></svg>';
      if (mobileMenu) mobileMenu.style.maxHeight = '0';
      updateNav();
    }

    menuBtn.addEventListener('click', function () {
      if (menuOpen) closeMenu(); else openMenu();
    });
  }

  // ─── Fade-in on scroll (IntersectionObserver) ───
  // Elements use inline styles with opacity:0 and transform — animate them in
  var fadeEls = document.querySelectorAll('[style*="opacity:0"][style*="translateY"]');
  if (fadeEls.length > 0 && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(function (el) { observer.observe(el); });
  }

  // ─── Image error handler + load fade-in ───
  document.querySelectorAll('img').forEach(function (img) {
    if (img.complete && img.naturalHeight > 0) {
      // Already loaded
      var targetOp = img.getAttribute('data-loaded-opacity') || null;
      if (img.style.opacity === '0') {
        img.style.opacity = targetOp || '1';
      }
    }
    img.addEventListener('load', function () {
      // Trigger the opacity transition (matches the React onLoad handler)
      if (img.style.opacity === '0') {
        var op = img.getAttribute('data-loaded-opacity');
        img.style.opacity = op || '1';
      }
    });
    img.addEventListener('error', function () {
      img.style.display = 'none';
    });
  });

  // ─── Hero images: set loaded opacity ───
  // The React version sets opacity to 0.75 on load for hero images
  document.querySelectorAll('section img[fetchpriority="high"], section img[fetchPriority="high"]').forEach(function (img) {
    if (!img.getAttribute('data-loaded-opacity')) {
      img.setAttribute('data-loaded-opacity', '0.75');
    }
    if (img.complete && img.naturalHeight > 0) {
      img.style.opacity = '0.75';
    }
  });
  // Other full-width section images that start at opacity 0
  document.querySelectorAll('img.transition-opacity').forEach(function (img) {
    if (!img.getAttribute('data-loaded-opacity') && img.style.opacity === '0') {
      // Check if a nearby gradient overlay exists (hero pattern)
      var section = img.closest('section');
      if (section && section.querySelector('[class*="bg-gradient"]')) {
        img.setAttribute('data-loaded-opacity', '0.75');
        if (img.complete && img.naturalHeight > 0) img.style.opacity = '0.75';
      } else {
        img.setAttribute('data-loaded-opacity', '1');
        if (img.complete && img.naturalHeight > 0) img.style.opacity = '1';
      }
    }
  });

  // ─── Blog filter ───
  var filterBtns = document.querySelectorAll('[data-filter]');
  if (filterBtns.length === 0) {
    // Auto-detect: blog page filter buttons
    var blogSection = document.querySelector('[class*="blog"]');
    // The blog page uses buttons with category-specific onClick
    // We inject data attributes via the built HTML
  }

  // Blog filter: detect category buttons and post cards
  (function () {
    // Find filter buttons: they're in a flex container, small rounded-full buttons
    var btns = document.querySelectorAll('button.rounded-full[class*="text-sm"]');
    if (btns.length < 2) return; // Not the blog page

    var posts = document.querySelectorAll('[data-category]');
    if (posts.length === 0) {
      // Posts don't have data attrs yet — they're article/div elements after the filter section
      // Find the grid that contains blog post cards
      var grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.gap-8');
      if (!grid) return;
      posts = grid.children;
    }

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Update active styles
        btns.forEach(function (b) {
          b.style.backgroundColor = '';
          b.style.color = '';
          b.style.borderColor = '';
        });
        btn.style.backgroundColor = '#1a1a1a';
        btn.style.color = 'white';
        btn.style.borderColor = '#1a1a1a';

        var label = btn.textContent.trim();
        // Show/hide posts based on category
        // "全部" or "All" shows all
        var showAll = label === '全部' || label === 'All';
        Array.from(posts).forEach(function (post) {
          if (showAll) {
            post.style.display = '';
          } else {
            var cat = post.getAttribute('data-category') || post.textContent;
            // Check if post contains the category label
            var catBadge = post.querySelector('.text-xs');
            var postCat = catBadge ? catBadge.textContent.trim() : '';
            post.style.display = (postCat.includes(label) || label === postCat) ? '' : 'none';
          }
        });
      });
    });
  })();

  // ─── YouTube video embed (speakers page) ───
  document.querySelectorAll('[data-youtube]').forEach(function (container) {
    var videoId = container.getAttribute('data-youtube');
    var playBtn = container.querySelector('[data-play]');
    var thumb = container.querySelector('img');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
        iframe.className = 'absolute inset-0 w-full h-full';
        iframe.setAttribute('allow', 'autoplay; encrypted-media');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('frameborder', '0');
        if (thumb) thumb.style.display = 'none';
        playBtn.style.display = 'none';
        container.appendChild(iframe);
      });
    }
  });
})();
