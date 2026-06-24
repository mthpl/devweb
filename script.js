gsap.registerPlugin(ScrollTrigger);

const isMobile = window.innerWidth <= 768;

// ─────────────────────────────────────────────────────────────────────────────
// 1. THREE.JS BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const particlesGeometry = new THREE.BufferGeometry();
const count = isMobile ? 800 : 1800;
const positions = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 12;
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: isMobile ? 0.05 : 0.04,
    color: 0x00fff2,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particleSystem);

let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
});
document.addEventListener('touchmove', e => {
    if (e.touches.length > 0) {
        mouseX = (e.touches[0].clientX / window.innerWidth) - 0.5;
        mouseY = (e.touches[0].clientY / window.innerHeight) - 0.5;
    }
}, { passive: true });

const clock = new THREE.Clock();
(function tick() {
    const t = clock.getElapsedTime();
    particleSystem.rotation.y = t * 0.03;
    particleSystem.rotation.x += (-mouseY * 0.3 - particleSystem.rotation.x) * 0.05;
    particleSystem.rotation.y += (mouseX  * 0.3 - particleSystem.rotation.y) * 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
})();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// ─────────────────────────────────────────────────────────────────────────────
// 2. CHAR SPLITTER  — respects <br> and class-carrying child nodes
// ─────────────────────────────────────────────────────────────────────────────
document.querySelectorAll('.fx-shatter').forEach(title => {
    const frag = document.createDocumentFragment();

    function extractChars(node, cls) {
        node.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                child.textContent.split('').forEach(ch => {
                    if (ch === ' ') {
                        frag.appendChild(document.createTextNode('\u00A0'));
                    } else {
                        const s = document.createElement('span');
                        s.className = ('char ' + (cls || '')).trim();
                        s.textContent = ch;
                        frag.appendChild(s);
                    }
                });
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                if (child.tagName.toLowerCase() === 'br') {
                    frag.appendChild(document.createElement('br'));
                } else {
                    extractChars(child, child.className || '');
                }
            }
        });
    }

    extractChars(title, '');
    title.innerHTML = '';
    title.appendChild(frag);
});


// ─────────────────────────────────────────────────────────────────────────────
// 3. SCATTER / ASSEMBLE  — identical logic for ALL 3 sections
//    Phase A  (0 → 0.45)  : chars assemble from chaos  → readable
//    Pause    (0.45 → 0.55): text is fully visible
//    Phase B  (0.55 → 1.0) : chars scatter back to chaos → invisible
//    (last section skips phase B so text stays readable at the bottom)
// ─────────────────────────────────────────────────────────────────────────────
const VW = window.innerWidth;
const VH = window.innerHeight;

document.querySelectorAll('.particle-section').forEach((section, index, all) => {
    const chars    = Array.from(section.querySelectorAll('.char'));
    const subtitle = section.querySelector('.hero-subtitle');
    const cta      = section.querySelector('.hero-cta');
    const isLast   = index === all.length - 1;

    // Pre-generate per-char random vectors so scrubbing is perfectly reversible
    const scatter = chars.map(() => ({
        x   : (Math.random() - 0.5) * (isMobile ? 280 : VW * 1.5),
        y   : (Math.random() - 0.5) * (isMobile ? 200 : VH * 1.2),
        z   : isMobile ? 0 : (Math.random() - 0.5) * 600,
        rx  : (Math.random() - 0.5) * 360,
        ry  : (Math.random() - 0.5) * 360,
    }));

    // Start every section with chars already scattered (invisible)
    // EXCEPT the very first section which starts assembled
    if (index === 0) {
        gsap.set(chars,    { x:0, y:0, z:0, rotationX:0, rotationY:0, scale:1, opacity:1 });
        gsap.set(subtitle, { opacity:1, y:0 });
        if (cta) gsap.set(cta, { opacity:1, y:0 });
    } else {
        chars.forEach((ch, i) => {
            gsap.set(ch, { x: scatter[i].x, y: scatter[i].y, z: scatter[i].z,
                           rotationX: scatter[i].rx, rotationY: scatter[i].ry,
                           scale: 0, opacity: 0 });
        });
        gsap.set(subtitle, { opacity:0, y:40 });
        if (cta) gsap.set(cta, { opacity:0, y:30 });
    }

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger    : section,
            start      : 'top top',
            end        : '+=180%',
            scrub      : 1.4,
            pin        : true,
            anticipatePin: 1,
            invalidateOnRefresh: true
        }
    });

    // ── PHASE A: ASSEMBLE ────────────────────────────────────────────────────
    // Section 0 is already assembled → short dummy tween so timeline has content
    if (index === 0) {
        tl.to({}, { duration: 0.3 }); // just a tiny gap before the pause
    } else {
        chars.forEach((ch, i) => {
            tl.fromTo(ch,
                { x: scatter[i].x, y: scatter[i].y, z: scatter[i].z,
                  rotationX: scatter[i].rx, rotationY: scatter[i].ry,
                  scale: 0, opacity: 0 },
                { x:0, y:0, z:0, rotationX:0, rotationY:0,
                  scale:1, opacity:1,
                  duration: 0.45, ease: 'power3.out' },
                0  // all chars start at position 0 → they fly in simultaneously
            );
        });
        tl.fromTo(subtitle,
            { opacity:0, y:40 },
            { opacity:1, y:0, duration:0.35, ease:'power2.out' },
            0.08
        );
        if (cta) tl.fromTo(cta,
            { opacity:0, y:30 },
            { opacity:1, y:0, duration:0.28, ease:'power2.out' },
            0.16
        );
    }

    // ── PAUSE: text fully visible ────────────────────────────────────────────
    tl.to({}, { duration: 0.45 });

    // ── PHASE B: SHATTER ─────────────────────────────────────────────────────
    if (!isLast) {
        chars.forEach((ch, i) => {
            tl.to(ch,
                { x: scatter[i].x, y: scatter[i].y, z: scatter[i].z,
                  rotationX: scatter[i].rx, rotationY: scatter[i].ry,
                  scale: 0, opacity: 0,
                  duration: 0.45, ease: 'power3.in' },
                '>-0.42'   // all start nearly together = explosion feel
            );
        });
        tl.to(subtitle, { opacity:0, y:-50, duration:0.35, ease:'power2.in' }, '<');
        if (cta) tl.to(cta, { opacity:0, y:-30, duration:0.28, ease:'power2.in' }, '<');
    }
});


// ─────────────────────────────────────────────────────────────────────────────
// 4. CONTACT CARD — WOW entrance + floating orbs canvas
// ─────────────────────────────────────────────────────────────────────────────
const contactSection = document.querySelector('.contact-section');
const contactCard    = document.querySelector('.contact-card');

// ── 4a. Scroll-triggered card entrance ──────────────────────────────────────
if (contactCard) {
    gsap.fromTo(contactCard,
        { opacity:0, y:80, scale:0.9, rotationX:8 },
        {
            opacity:1, y:0, scale:1, rotationX:0,
            duration:1.1, ease:'power4.out',
            scrollTrigger: {
                trigger: contactSection,
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            }
        }
    );
}

// ── 4b. Floating orbs canvas behind the card ────────────────────────────────
(function buildOrbs() {
    const orbCanvas = document.createElement('canvas');
    orbCanvas.id = 'orb-canvas';
    orbCanvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;' +
        'border-radius:28px;pointer-events:none;z-index:0;opacity:0.85;';
    contactCard.insertBefore(orbCanvas, contactCard.firstChild);

    const ctx = orbCanvas.getContext('2d');
    let W, H;

    function resize() {
        W = orbCanvas.width  = contactCard.offsetWidth;
        H = orbCanvas.height = contactCard.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Define orbs
    const ORB_COUNT = isMobile ? 5 : 8;
    const orbs = Array.from({ length: ORB_COUNT }, (_, i) => ({
        x  : Math.random() * 600,
        y  : Math.random() * 400,
        r  : 55 + Math.random() * 85,         // radius
        vx : (Math.random() - 0.5) * 0.35,
        vy : (Math.random() - 0.5) * 0.35,
        hue: i % 2 === 0 ? 180 : 270,         // cyan / purple alternating
        phase: Math.random() * Math.PI * 2,    // breathing offset
    }));

    let orbRAF;
    let t = 0;

    function drawOrbs() {
        orbRAF = requestAnimationFrame(drawOrbs);
        t += 0.008;
        ctx.clearRect(0, 0, W, H);

        orbs.forEach(o => {
            // gentle drift
            o.x += o.vx;
            o.y += o.vy;

            // wrap around edges
            if (o.x < -o.r)     o.x = W + o.r;
            if (o.x > W + o.r)  o.x = -o.r;
            if (o.y < -o.r)     o.y = H + o.r;
            if (o.y > H + o.r)  o.y = -o.r;

            // breathing size
            const pulse = 1 + 0.18 * Math.sin(t * 1.3 + o.phase);
            const radius = o.r * pulse;

            // radial gradient orb
            const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, radius);
            if (o.hue === 180) {
                // cyan
                g.addColorStop(0,   'rgba(0,255,242,0.22)');
                g.addColorStop(0.5, 'rgba(0,200,200,0.08)');
                g.addColorStop(1,   'rgba(0,255,242,0)');
            } else {
                // purple
                g.addColorStop(0,   'rgba(147,51,234,0.20)');
                g.addColorStop(0.5, 'rgba(120,40,200,0.07)');
                g.addColorStop(1,   'rgba(147,51,234,0)');
            }

            ctx.beginPath();
            ctx.arc(o.x, o.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        });

        // subtle scan-line shimmer across the card
        const scanY = ((t * 60) % (H + 40)) - 20;
        const scanG = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
        scanG.addColorStop(0,   'rgba(0,255,242,0)');
        scanG.addColorStop(0.5, 'rgba(0,255,242,0.045)');
        scanG.addColorStop(1,   'rgba(0,255,242,0)');
        ctx.fillStyle = scanG;
        ctx.fillRect(0, scanY - 20, W, 40);
    }

    // Only run when card is in viewport (perf)
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { drawOrbs(); }
        else { cancelAnimationFrame(orbRAF); }
    }, { threshold: 0.1 });
    observer.observe(contactCard);
})();

// ── 4c. Glow pulse on border line ───────────────────────────────────────────
gsap.to('.card-glow-line', {
    opacity: 0.5,
    duration: 2.8,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    delay: 1
});


// ─────────────────────────────────────────────────────────────────────────────
// 5. FORM EVENTS
// ─────────────────────────────────────────────────────────────────────────────
const formInputs = document.querySelectorAll('.custom-input-group input, .custom-input-group textarea');

formInputs.forEach(input => {
    input.addEventListener('focus', () => contactCard.classList.add('form-active'));
    input.addEventListener('blur',  () => {
        if (!Array.from(formInputs).some(i => i === document.activeElement))
            contactCard.classList.remove('form-active');
    });
});

const form   = document.getElementById('contact-form-element');
const result = document.getElementById('form-result');

if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        result.style.color = 'var(--primary)';
        result.innerHTML   = 'Wysyłanie sygnału...';

        fetch('https://api.web3forms.com/submit', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body   : JSON.stringify(Object.fromEntries(new FormData(form)))
        })
        .then(async r => {
            const j = await r.json();
            if (r.status === 200) {
                result.style.color = '#00ff88';
                result.innerHTML   = 'Wiadomość wysłana pomyślnie! Odezwę się niebawem.';
                form.reset();
                contactCard.classList.remove('form-active');
            } else {
                result.style.color = '#ff4444';
                result.innerHTML   = j.message;
            }
        })
        .catch(() => {
            result.style.color = '#ff4444';
            result.innerHTML   = 'Coś poszło nie tak... Spróbuj ponownie później.';
        });
    });
}
