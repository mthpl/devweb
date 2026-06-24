gsap.registerPlugin(ScrollTrigger);

const isMobile = window.innerWidth <= 768;

// --- 1. THREE.JS ANIMATED BACKGROUND ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const particlesGeometry = new THREE.BufferGeometry();
const count = isMobile ? 800 : 1800;
const positions = new Float32Array(count * 3);

for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 12;
}
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

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
});

document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
        mouseX = (event.touches[0].clientX / window.innerWidth) - 0.5;
        mouseY = (event.touches[0].clientY / window.innerHeight) - 0.5;
    }
}, { passive: true });

const clock = new THREE.Clock();
const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    particleSystem.rotation.y = elapsedTime * 0.03;
    particleSystem.rotation.x += (-mouseY * 0.3 - particleSystem.rotation.x) * 0.05;
    particleSystem.rotation.y += (mouseX * 0.3 - particleSystem.rotation.y) * 0.05;
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// --- 2. CHAR SPLITTER — respects <br> and nested tags ---
document.querySelectorAll('.fx-shatter').forEach(title => {
    const fragment = document.createDocumentFragment();

    const extractChars = (node, inheritedClasses = '') => {
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                child.textContent.split('').forEach(char => {
                    if (char === ' ') {
                        fragment.appendChild(document.createTextNode('\u00A0'));
                    } else {
                        const span = document.createElement('span');
                        span.className = ('char ' + inheritedClasses).trim();
                        span.textContent = char;
                        fragment.appendChild(span);
                    }
                });
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                if (child.tagName.toLowerCase() === 'br') {
                    fragment.appendChild(document.createElement('br'));
                } else {
                    extractChars(child, child.className || '');
                }
            }
        });
    };

    extractChars(title);
    title.innerHTML = '';
    title.appendChild(fragment);
});


// --- 3. SCROLL-PINNED SHATTER / ASSEMBLE ANIMATIONS ---
const particleSections = document.querySelectorAll('.particle-section');
const VW = window.innerWidth;
const VH = window.innerHeight;

particleSections.forEach((section, index) => {
    const chars = section.querySelectorAll('.char');
    const subtitle = section.querySelector('.hero-subtitle');
    const cta = section.querySelector('.hero-cta');

    // === ASSEMBLE animation (chars fly in from random space) ===
    // Defined per-char so values are stable across scrub direction
    const charData = Array.from(chars).map(() => ({
        startX: (Math.random() - 0.5) * (isMobile ? 200 : VW * 1.2),
        startY: (Math.random() - 0.5) * (isMobile ? 160 : VH * 1.0),
        startZ: isMobile ? 0 : (Math.random() - 0.5) * 500,
        startRot: (Math.random() - 0.5) * 270
    }));

    const endCharData = Array.from(chars).map(() => ({
        endX: (Math.random() - 0.5) * (isMobile ? 250 : VW * 1.4),
        endY: (Math.random() - 0.5) * (isMobile ? 200 : VH * 1.2),
        endZ: isMobile ? 0 : (Math.random() - 0.5) * 700,
        endRot: (Math.random() - 0.5) * 360
    }));

    // Set all chars visible and at natural position initially
    gsap.set(chars, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, opacity: 1, scale: 1 });
    if (subtitle) gsap.set(subtitle, { opacity: 1, y: 0 });
    if (cta) gsap.set(cta, { opacity: 1, y: 0 });

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=160%',
            scrub: 1.2,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
        }
    });

    // == PHASE 1 — ASSEMBLE (only sections 2 and 3) ==
    if (index > 0) {
        chars.forEach((char, i) => {
            const d = charData[i];
            tl.fromTo(char,
                {
                    x: d.startX,
                    y: d.startY,
                    z: d.startZ,
                    rotationX: d.startRot,
                    rotationY: d.startRot,
                    scale: 0.2,
                    opacity: 0
                },
                {
                    x: 0, y: 0, z: 0,
                    rotationX: 0, rotationY: 0,
                    scale: 1, opacity: 1,
                    duration: 0.5,
                    ease: 'power2.out'
                },
                0   // all start at the same timeline position → parallel
            );
        });

        if (subtitle) {
            tl.fromTo(subtitle,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
                0.1
            );
        }
        if (cta) {
            tl.fromTo(cta,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
                0.2
            );
        }
    }

    // == Legibility pause ==
    tl.to({}, { duration: 0.5 });

    // == PHASE 2 — SHATTER (all sections except the last) ==
    if (index < particleSections.length - 1) {
        chars.forEach((char, i) => {
            const d = endCharData[i];
            tl.to(char, {
                x: d.endX,
                y: d.endY,
                z: d.endZ,
                rotationX: d.endRot,
                rotationY: d.endRot,
                scale: 0,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.in'
            }, '>-0.05');   // tiny stagger for wave feel, all relative to last
        });

        if (subtitle) {
            tl.to(subtitle, { opacity: 0, y: -50, duration: 0.4, ease: 'power2.in' }, '<');
        }
        if (cta) {
            tl.to(cta, { opacity: 0, y: -30, duration: 0.3, ease: 'power2.in' }, '<');
        }
    }
});


// --- 4. CONTACT CARD ENTRANCE ANIMATION ---
const contactSection = document.querySelector('.contact-section');
const contactCard = document.querySelector('.contact-card');

if (contactCard) {
    gsap.fromTo(contactCard,
        {
            opacity: 0,
            y: 60,
            scale: 0.94
        },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: contactSection,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        }
    );

    // Glow pulse animation on the border line
    gsap.to('.card-glow-line', {
        opacity: 0.35,
        duration: 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
    });
}


// --- 5. FORM INTERACTIVITY ---
const formCard = document.querySelector('.contact-card');
const formInputs = document.querySelectorAll('.custom-input-group input, .custom-input-group textarea');

formInputs.forEach(input => {
    input.addEventListener('focus', () => {
        formCard.classList.add('form-active');
    });
    input.addEventListener('blur', () => {
        const anyActive = Array.from(formInputs).some(inp => inp === document.activeElement);
        if (!anyActive) {
            formCard.classList.remove('form-active');
        }
    });
});

// AJAX form submit
const form = document.getElementById('contact-form-element');
const result = document.getElementById('form-result');

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        result.style.color = 'var(--primary)';
        result.innerHTML = 'Wysyłanie sygnału...';

        const formData = new FormData(form);
        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: json
        })
            .then(async (response) => {
                let jsonRes = await response.json();
                if (response.status === 200) {
                    result.style.color = '#00ff88';
                    result.innerHTML = 'Wiadomość wysłana pomyślnie! Odezwę się niebawem.';
                    form.reset();
                    formCard.classList.remove('form-active');
                } else {
                    result.style.color = '#ff4444';
                    result.innerHTML = jsonRes.message;
                }
            })
            .catch(() => {
                result.style.color = '#ff4444';
                result.innerHTML = 'Coś poszło nie tak... Spróbuj ponownie później.';
            });
    });
}
