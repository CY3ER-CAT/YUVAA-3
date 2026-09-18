/* ============================================================
   YUVAA ENGINEERS — main.js
   Interactions + optional Three.js background (fully guarded:
   the site stays 100% working even if Three.js fails to load)
   ============================================================ */
(function () {
    'use strict';

    var WHATSAPP_NUMBER = '919952172210';
    var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ==================== THEME ENGINE ====================
       Three themes: royal (Royal Gold) · obsidian (Obsidian Luxe)
       · blueprint (Blueprint Pro). Persists in localStorage and
       recolors the Three.js scenes live. */
    var themeRegistry = { blocks: [], shapes: [], apex: null, ring: null, grid: null };

    var THEME_3D = {
        royal:     { blockA: 0xd4af37, blockB: 0xf5c518, apex: 0xf5c518, ring: 0xd4af37, grid: 0xd4af37, shapes: [0xd4af37, 0xb8860b, 0xf5c518] },
        obsidian:  { blockA: 0xf5c518, blockB: 0xd4af37, apex: 0xffe08a, ring: 0xf5c518, grid: 0xd4af37, shapes: [0xd4af37, 0xf5c518, 0xb8860b] },
        blueprint: { blockA: 0x334155, blockB: 0x64748b, apex: 0xea580c, ring: 0xea580c, grid: 0x64748b, shapes: [0x334155, 0xea580c, 0x64748b] }
    };
    var THEME_NAMES = { royal: 'Royal Gold', obsidian: 'Obsidian Luxe', blueprint: 'Blueprint Pro' };
    var THEME_ORDER = ['royal', 'obsidian', 'blueprint'];

    function currentTheme() {
        var t = localStorage.getItem('yuvaa-theme');
        return THEME_ORDER.indexOf(t) !== -1 ? t : 'royal';
    }

    function applyTheme(name) {
        if (THEME_ORDER.indexOf(name) === -1) name = 'royal';
        document.documentElement.setAttribute('data-theme', name);

        var p = THEME_3D[name];
        themeRegistry.blocks.forEach(function (mat, i) {
            mat.color.setHex(i % 2 === 0 ? p.blockA : p.blockB);
        });
        themeRegistry.shapes.forEach(function (mat, i) {
            mat.color.setHex(p.shapes[i % 3]);
        });
        if (themeRegistry.apex) themeRegistry.apex.color.setHex(p.apex);
        if (themeRegistry.ring) themeRegistry.ring.color.setHex(p.ring);
        if (themeRegistry.grid) themeRegistry.grid.color.setHex(p.grid);
    }

    function initThemeSwitcher() {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;
        applyTheme(currentTheme());
        btn.addEventListener('click', function () {
            var next = THEME_ORDER[(THEME_ORDER.indexOf(currentTheme()) + 1) % THEME_ORDER.length];
            localStorage.setItem('yuvaa-theme', next);
            applyTheme(next);
            showToast('Theme: ' + THEME_NAMES[next]);
        });
    }

    /* ==================== LOADER ====================
       Hides once the page is ready + short delay.
       Hard fallback timer guarantees it can never get stuck. */
    var loader = document.getElementById('loader');
    var loaderHidden = false;

    function hideLoader() {
        if (loaderHidden || !loader) return;
        loaderHidden = true;
        loader.classList.add('hidden');
    }

    window.addEventListener('load', function () {
        setTimeout(hideLoader, REDUCED_MOTION ? 0 : 1200);
    });
    // Fallbacks: if `load` is slow or never fires (e.g. CDN hang)
    setTimeout(hideLoader, 3000);
    setTimeout(hideLoader, 6000);
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(hideLoader, 2500);
    });

    /* ==================== TOAST ==================== */
    var toastEl = document.getElementById('toast');
    var toastTimer = null;

    function showToast(message, isError) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.toggle('toast-error', !!isError);
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastEl.classList.remove('show');
        }, 4200);
    }

    /* ==================== CUSTOM CURSOR ====================
       3-layer cursor (dot + ring + trail), matching the reference
       site's feel: dot instant, ring ease 0.14, trail ease 0.07.
       Only enabled on devices with a real mouse (fine pointer). */
    var cursorDot = document.getElementById('cursor-dot');
    var cursorRing = document.getElementById('cursor-ring');
    var cursorTrail = document.getElementById('cursor-trail');
    var finePointer = window.matchMedia('(pointer: fine)').matches;

    if (cursorDot && cursorRing && cursorTrail && finePointer && !REDUCED_MOTION) {
        document.body.classList.add('custom-cursor');

        var mx = window.innerWidth / 2, my = window.innerHeight / 2;
        var rx = mx, ry = my, tx = mx, ty = my;

        document.addEventListener('mousemove', function (e) {
            mx = e.clientX;
            my = e.clientY;
            cursorDot.style.left = mx + 'px';
            cursorDot.style.top = my + 'px';
        }, { passive: true });

        (function animCursor() {
            rx += (mx - rx) * 0.14;
            ry += (my - ry) * 0.14;
            cursorRing.style.left = rx + 'px';
            cursorRing.style.top = ry + 'px';

            tx += (mx - tx) * 0.07;
            ty += (my - ty) * 0.07;
            cursorTrail.style.left = tx + 'px';
            cursorTrail.style.top = ty + 'px';

            requestAnimationFrame(animCursor);
        })();

        // Hover states: links/cards grow the ring, buttons grow it gold
        document.querySelectorAll('a, button, .service-card, .csc-card, .contact-card, .gallery-item')
            .forEach(function (el) {
                el.addEventListener('mouseenter', function () {
                    document.body.classList.add('cursor-hover');
                });
                el.addEventListener('mouseleave', function () {
                    document.body.classList.remove('cursor-hover');
                });
            });
        document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta, .nav-services, .form-submit')
            .forEach(function (el) {
                el.addEventListener('mouseenter', function () {
                    document.body.classList.add('cursor-btn');
                });
                el.addEventListener('mouseleave', function () {
                    document.body.classList.remove('cursor-btn');
                });
            });

        // Magnetic buttons — subtle pull toward the cursor
        document.querySelectorAll('.btn, .nav-cta, .nav-services, .form-submit, #sidebar-toggle')
            .forEach(function (el) {
                el.addEventListener('mousemove', function (e) {
                    var rect = el.getBoundingClientRect();
                    var dx = e.clientX - (rect.left + rect.width / 2);
                    var dy = e.clientY - (rect.top + rect.height / 2);
                    el.style.transform = 'translate(' + dx * 0.15 + 'px,' + dy * 0.15 + 'px)';
                });
                el.addEventListener('mouseenter', function () {
                    el.style.transition = 'transform 0.1s ease';
                });
                el.addEventListener('mouseleave', function () {
                    el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
                    el.style.transform = '';
                });
            });
    }

    /* ==================== NAVBAR ==================== */
    var navbar = document.getElementById('navbar');
    var scrollTopBtn = document.getElementById('scroll-top');
    var heroContent = document.querySelector('.hero-content');

    var ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            var scroll = window.pageYOffset;

            if (navbar) navbar.classList.toggle('scrolled', scroll > 50);

            if (scrollTopBtn) {
                scrollTopBtn.classList.toggle('show', scroll > 600);
            }

            // Hero parallax (skipped entirely for reduced motion)
            if (heroContent && !REDUCED_MOTION && scroll < window.innerHeight) {
                heroContent.style.transform = 'translateY(' + scroll * 0.3 + 'px)';
                heroContent.style.opacity = Math.max(1 - scroll / (window.innerHeight * 0.8), 0);
            }

            ticking = false;
        });
    }, { passive: true });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
        });
    }

    /* ==================== MOBILE MENU ==================== */
    var menuToggle = document.getElementById('menu-toggle');
    var mobileMenu = document.getElementById('mobile-menu');

    function closeMobileMenu() {
        if (!menuToggle || !mobileMenu) return;
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function () {
            var open = !mobileMenu.classList.contains('active');
            menuToggle.classList.toggle('active', open);
            mobileMenu.classList.toggle('active', open);
            document.body.style.overflow = open ? 'hidden' : '';
        });

        mobileMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    /* ==================== SERVICES SIDEBAR ==================== */
    var sidebarToggle = document.getElementById('sidebar-toggle');
    var sidebar = document.getElementById('services-sidebar');
    var sidebarBackdrop = document.getElementById('sidebar-backdrop');

    function setSidebar(open) {
        document.body.classList.toggle('sidebar-open', open);
        if (sidebarToggle) {
            sidebarToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
    }

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function () {
            setSidebar(!document.body.classList.contains('sidebar-open'));
        });
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', function () { setSidebar(false); });
        }
        sidebar.querySelectorAll('.sidebar-link').forEach(function (link) {
            link.addEventListener('click', function () { setSidebar(false); });
        });
    }

    // Escape closes everything
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        setSidebar(false);
        closeMobileMenu();
    });

    /* ==================== ACTIVE NAV LINK ==================== */
    var path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
        var href = a.getAttribute('href') || '';
        var target = href.split('#')[0];
        if (target === path || (target === '' && href.indexOf('#') === 0 && path === 'index.html')) {
            if (href.indexOf('#') === -1 || href.indexOf(location.hash) !== -1) {
                a.classList.add('active');
            }
        }
    });

    /* ==================== REVEAL ANIMATIONS ==================== */
    var revealElements = document.querySelectorAll('.reveal, .reveal-text');

    revealElements.forEach(function (el) {
        el.style.setProperty('--reveal-delay', (el.getAttribute('data-delay') || 0) + 'ms');
    });

    if (REDUCED_MOTION) {
        revealElements.forEach(function (el) { el.classList.add('visible'); });
    } else {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(function (el) { observer.observe(el); });
    }

    /* ==================== STAT COUNTER ==================== */
    var statNumbers = document.querySelectorAll('.stat-number');
    var statsAnimated = false;

    function animateStats() {
        if (statsAnimated) return;
        statsAnimated = true;

        statNumbers.forEach(function (el) {
            var target = parseInt(el.getAttribute('data-target'), 10) || 0;
            var suffix = el.getAttribute('data-suffix') || '';
            var duration = REDUCED_MOTION ? 1 : 2000;
            var startTime = performance.now();

            function update(currentTime) {
                var progress = Math.min((currentTime - startTime) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                var value = Math.floor(eased * target);

                el.textContent = value + (progress === 1 ? suffix : '');

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    el.textContent = target + suffix;
                }
            }

            requestAnimationFrame(update);
        });
    }

    var statsSection = document.getElementById('stats');
    if (statsSection && statNumbers.length) {
        var statsObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateStats();
                    statsObserver.disconnect();
                }
            });
        }, { threshold: 0.2 });
        statsObserver.observe(statsSection);

        // Fallback: fast scrolls can jump straight past the observer window
        function checkStatsPosition() {
            var rect = statsSection.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
                animateStats();
            }
        }
        window.addEventListener('scroll', checkStatsPosition, { passive: true });
        window.addEventListener('resize', checkStatsPosition);
        checkStatsPosition();
    }

    /* ==================== 3D TILT CARDS ==================== */
    if (finePointer && !REDUCED_MOTION) {
        document.querySelectorAll('[data-tilt]').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                var rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -6;
                var rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6;

                card.style.transform =
                    'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
                card.style.setProperty('--mx', (x / rect.width) * 100 + '%');
                card.style.setProperty('--my', (y / rect.height) * 100 + '%');
            });

            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
            });
        });
    }

    /* ==================== GALLERY FILTER ==================== */
    var galleryFilter = document.getElementById('gallery-filter');
    var galleryItems = document.querySelectorAll('.gallery-item');

    if (galleryFilter && galleryItems.length) {
        galleryFilter.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                galleryFilter.querySelectorAll('button').forEach(function (b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                var filter = btn.getAttribute('data-filter');

                galleryItems.forEach(function (item) {
                    var match = filter === 'all' || item.getAttribute('data-category') === filter;
                    item.style.display = match ? '' : 'none';
                    if (match) item.classList.add('visible');
                });
            });
        });
    }

    /* ==================== DATE INPUTS: min = today ==================== */
    var today = new Date();
    var isoToday = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
    document.querySelectorAll('input[type="date"]').forEach(function (input) {
        input.setAttribute('min', isoToday);
    });

    /* ==================== FORM HANDLING ====================
       Validates, then opens WhatsApp with the submission pre-filled
       so every form genuinely reaches the business — no backend needed. */
    var PHONE_RE = /^(\+?91[\-\s]?)?[6-9]\d{9}$/;
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function fieldLabel(field) {
        var group = field.closest('.form-group');
        var label = group ? group.querySelector('label') : null;
        return label ? label.textContent.replace('*', '').trim() : field.name;
    }

    function setError(field, message) {
        field.classList.add('invalid');
        var group = field.closest('.form-group');
        var err = group ? group.querySelector('.field-error') : null;
        if (err) {
            err.textContent = message;
            err.classList.add('show');
        }
    }

    function clearError(field) {
        field.classList.remove('invalid');
        var group = field.closest('.form-group');
        var err = group ? group.querySelector('.field-error') : null;
        if (err) err.classList.remove('show');
    }

    function validateForm(form) {
        var valid = true;
        var firstInvalid = null;

        form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(function (field) {
            clearError(field);
            var value = field.value.trim();

            if (field.hasAttribute('required') && !value) {
                setError(field, field.tagName === 'SELECT' ? 'Please select an option' : 'This field is required');
                valid = false;
                if (!firstInvalid) firstInvalid = field;
                return;
            }

            if (value && field.type === 'tel' && !PHONE_RE.test(value.replace(/\s+/g, ''))) {
                setError(field, 'Enter a valid 10-digit mobile number');
                valid = false;
                if (!firstInvalid) firstInvalid = field;
                return;
            }

            if (value && field.type === 'email' && !EMAIL_RE.test(value)) {
                setError(field, 'Enter a valid email address');
                valid = false;
                if (!firstInvalid) firstInvalid = field;
                return;
            }

            // At least one service checkbox must be picked (CSC form)
            if (field.type === 'checkbox' && field.hasAttribute('data-min-one')) {
                var group = field.closest('.form-checkbox-group');
                var any = group ? Array.prototype.some.call(
                    group.querySelectorAll('input[type="checkbox"]'),
                    function (c) { return c.checked; }
                ) : false;
                if (!any) {
                    setError(field, 'Select at least one service');
                    valid = false;
                    if (!firstInvalid) firstInvalid = field;
                }
            }
        });

        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'center' });
            firstInvalid.focus({ preventScroll: true });
        }

        return valid;
    }

    function buildMessage(title, data) {
        var lines = ['*YUVAA ENGINEERS — ' + title + '*', ''];
        data.forEach(function (item) {
            if (item.value) lines.push('*' + item.label + ':* ' + item.value);
        });
        lines.push('', '_Sent from the Yuvaa Engineers website_');
        return lines.join('\n');
    }

    function sendToWhatsApp(title, data) {
        var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildMessage(title, data));
        var win = window.open(url, '_blank');
        if (!win) {
            // Popup blocked — let the user click through instead
            showToast('Popup blocked. Tap here to open WhatsApp with your details.', true);
            var link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    document.querySelectorAll('form.form-card').forEach(function (form) {
        var title = (form.getAttribute('data-form-title') || 'New Enquiry').toUpperCase();

        // Live-clear errors as the user types
        form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(function (field) {
            field.addEventListener('input', function () { clearError(field); });
            field.addEventListener('change', function () { clearError(field); });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!validateForm(form)) {
                showToast('Please fix the highlighted fields.', true);
                return;
            }

            var submitBtn = form.querySelector('.form-submit');
            if (submitBtn) submitBtn.disabled = true;

            var data = [];
            form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(function (field) {
                if (field.type === 'checkbox' || field.type === 'radio') return;
                data.push({ label: fieldLabel(field), value: field.value.trim() });
            });

            // Collect radio groups
            form.querySelectorAll('input[type="radio"]:checked').forEach(function (radio) {
                data.push({ label: fieldLabel(radio), value: radio.value });
            });

            // Collect checked checkbox groups (comma-joined)
            var checkboxGroups = {};
            form.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
                var key = fieldLabel(cb);
                if (!checkboxGroups[key]) checkboxGroups[key] = [];
                checkboxGroups[key].push(
                    cb.parentElement.textContent.trim().replace(/^[★✓]\s*/, '')
                );
            });
            Object.keys(checkboxGroups).forEach(function (key) {
                data.push({ label: key, value: checkboxGroups[key].join(', ') });
            });

            sendToWhatsApp(title, data);

            setTimeout(function () {
                if (submitBtn) submitBtn.disabled = false;
                form.style.display = 'none';
                var success = form.parentElement.querySelector('.form-success');
                if (success) {
                    success.classList.add('show');
                    success.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'center' });
                }
            }, 600);
        });
    });

    /* ==================== THREE.JS BACKGROUND ====================
       Everything Three.js lives behind guards + try/catch so a CDN
       failure can never take down the rest of the site. */
    function initBackground() {
        if (typeof THREE === 'undefined' || REDUCED_MOTION) return;

        var canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        try {
            var scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0xffffff, 0.02);

            var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 50;

            var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            var floatingShapes = [];
            var geometries = [
                new THREE.IcosahedronGeometry(3, 0),
                new THREE.OctahedronGeometry(2.5, 0),
                new THREE.TetrahedronGeometry(3, 0),
                new THREE.DodecahedronGeometry(2.5, 0),
                new THREE.TorusGeometry(3, 0.5, 8, 16),
                new THREE.IcosahedronGeometry(2, 1),
                new THREE.OctahedronGeometry(3, 0),
                new THREE.TetrahedronGeometry(2, 0)
            ];

            geometries.forEach(function (geo, k) {
                var mat = new THREE.LineBasicMaterial({
                    color: k % 3 === 0 ? 0xd4af37 : k % 3 === 1 ? 0xb8860b : 0xf5c518,
                    transparent: true,
                    opacity: 0.22
                });
                var shape = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
                shape.position.set(
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 60,
                    (Math.random() - 0.5) * 40 - 10
                );
                shape.userData = {
                    rotSpeedX: (Math.random() - 0.5) * 0.005,
                    rotSpeedY: (Math.random() - 0.5) * 0.005,
                    rotSpeedZ: (Math.random() - 0.5) * 0.003,
                    floatSpeed: Math.random() * 0.3 + 0.1,
                    floatOffset: Math.random() * Math.PI * 2,
                    baseY: shape.position.y
                };
                floatingShapes.push(shape);
                scene.add(shape);
                themeRegistry.shapes.push(mat);
            });

            var clock = new THREE.Clock();
            var mouseTargetX = window.innerWidth / 2, mouseTargetY = window.innerHeight / 2;

            document.addEventListener('mousemove', function (e) {
                mouseTargetX = e.clientX;
                mouseTargetY = e.clientY;
            }, { passive: true });

            function animate() {
                requestAnimationFrame(animate);
                var time = clock.getElapsedTime();

                floatingShapes.forEach(function (shape) {
                    var d = shape.userData;
                    shape.rotation.x += d.rotSpeedX;
                    shape.rotation.y += d.rotSpeedY;
                    shape.rotation.z += d.rotSpeedZ;
                    shape.position.y = d.baseY + Math.sin(time * d.floatSpeed + d.floatOffset) * 3;
                });

                camera.position.x += ((mouseTargetX / window.innerWidth - 0.5) * 5 - camera.position.x) * 0.05;
                camera.position.y += (-(mouseTargetY / window.innerHeight - 0.5) * 5 - camera.position.y) * 0.05;
                camera.position.z = 50 + window.pageYOffset * 0.01;
                camera.lookAt(scene.position);

                renderer.render(scene, camera);
            }
            animate();

            window.addEventListener('resize', function () {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        } catch (err) {
            // WebGL unavailable — background stays static, site keeps working
        }
    }

    function initHero3D() {
        if (typeof THREE === 'undefined' || REDUCED_MOTION) return;

        var mount = document.getElementById('hero-3d');
        if (!mount) return;

        try {
            var w = mount.clientWidth || 520;
            var h = mount.clientHeight || 640;

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
            camera.position.set(0, 1.5, 14);

            var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setSize(w, h);
            renderer.setClearColor(0x000000, 0);
            mount.appendChild(renderer.domElement);

            var group = new THREE.Group();
            var heights = [3.2, 2.4, 1.8, 1.2, 0.7];
            var yCursor = -2.5;

            heights.forEach(function (hh, i) {
                var w0 = 2.6 - i * 0.32;
                var edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w0, hh, w0));
                var block = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                    color: i % 2 === 0 ? 0xd4af37 : 0xf5c518,
                    transparent: true,
                    opacity: 0.85
                }));
                block.position.y = yCursor + hh / 2;
                yCursor += hh + 0.05;
                group.add(block);
                themeRegistry.blocks.push(block.material);
            });

            var apex = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.45, 0),
                new THREE.MeshBasicMaterial({ color: 0xf5c518, wireframe: true })
            );
            apex.position.y = yCursor + 0.6;
            group.add(apex);
            themeRegistry.apex = apex.material;

            var ring = new THREE.Mesh(
                new THREE.TorusGeometry(4.5, 0.04, 16, 100),
                new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.5 })
            );
            ring.rotation.x = Math.PI / 2.2;
            group.add(ring);
            themeRegistry.ring = ring.material;

            scene.add(group);

            // Professional ground grid beneath the building
            var grid = new THREE.GridHelper(26, 26, 0xd4af37, 0xd4af37);
            grid.material.transparent = true;
            grid.material.opacity = 0.14;
            grid.position.y = -2.7;
            scene.add(grid);
            themeRegistry.grid = grid.material;

            var mx = 0, my = 0;
            document.addEventListener('mousemove', function (e) {
                mx = (e.clientX / window.innerWidth - 0.5) * 0.6;
                my = (e.clientY / window.innerHeight - 0.5) * 0.4;
            }, { passive: true });

            window.addEventListener('resize', function () {
                var nw = mount.clientWidth || 520;
                var nh = mount.clientHeight || 640;
                camera.aspect = nw / nh;
                camera.updateProjectionMatrix();
                renderer.setSize(nw, nh);
            });

            (function loop() {
                group.rotation.y += 0.005;
                group.rotation.x += (my - group.rotation.x) * 0.04;
                group.position.x += (mx * 2 - group.position.x) * 0.04;
                apex.rotation.y += 0.03;
                apex.rotation.x += 0.02;
                ring.rotation.z += 0.004;
                renderer.render(scene, camera);
                requestAnimationFrame(loop);
            })();
        } catch (err) {
            // WebGL unavailable — hero falls back to plain content
        }
    }

    // Run Three.js after the window is ready so it never blocks interactions.
    if (document.readyState === 'complete') {
        initBackground();
        initHero3D();
        applyTheme(currentTheme());
    } else {
        window.addEventListener('load', function () {
            initBackground();
            initHero3D();
            applyTheme(currentTheme());
        });
    }

    initThemeSwitcher();
})();
