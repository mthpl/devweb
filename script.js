gsap.registerPlugin(ScrollTrigger);

const isMobile = window.innerWidth <= 768;

// --- 1. ORYGINALNE TŁO THREE.JS ---
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

for(let i = 0; i < count * 3; i++) {
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
    if(event.touches.length > 0) {
        mouseX = (event.touches[0].clientX / window.innerWidth) - 0.5;
        mouseY = (event.touches[0].clientY / window.innerHeight) - 0.5;
    }
}, { passive: true });

const clock = new THREE.Clock();
const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    
    particleSystem.rotation.y = elapsedTime * 0.03;
    particleSystem.rotation.x += ( -mouseY * 0.3 - particleSystem.rotation.x ) * 0.05;
    particleSystem.rotation.y += ( mouseX * 0.3 - particleSystem.rotation.y ) * 0.05;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// --- 2. GŁĘBOKI PARSER TEKSTU (IDEALNA OSTROŚĆ LITER) ---
document.querySelectorAll('.fx-shatter').forEach(title => {
    const processNodes = (node) => {
        const fragment = document.createDocumentFragment();
        
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                child.textContent.split('').forEach(char => {
                    if (char === ' ') {
                        fragment.appendChild(document.createTextNode(' '));
                    } else {
                        const span = document.createElement('span');
                        span.classList.add('char');
                        span.textContent = char;
                        fragment.appendChild(span);
                    }
                });
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const clonedElement = child.cloneNode(false);
                clonedElement.appendChild(processNodes(child));
                fragment.appendChild(clonedElement);
            }
        });
        return fragment;
    };

    const container = document.createElement('div');
    container.appendChild(processNodes(title));
    title.innerHTML = container.innerHTML;
});


// --- 3. SPÓJNY SYSTEM SCALANIA TEKSTU BEZ BLURA (ZABEZPIECZENIE GRADIENTÓW) ---
const particleSections = document.querySelectorAll('.particle-section');

particleSections.forEach((section, index) => {
    const chars = section.querySelectorAll('.char');
    const subtitle = section.querySelector('.hero-subtitle');
    const cta = section.querySelector('.hero-cta');

    // USUNIĘTO JAKIKOLWIEK BLUR Z PARAMETRÓW STARTOWYCH I ANIMACJI
    gsap.set(chars, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, opacity: 1, scale: 1 });
    if(subtitle) gsap.set(subtitle, { opacity: 1, y: 0 });
    if(cta) gsap.set(cta, { opacity: 1, y: 0 });

    const masterTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=100%',
            scrub: 1,
            pin: true,
            anticipatePin: 1
        }
    });

    // ETAP ENTRANCE (WEJŚCIE): Skalowanie i wyłanianie z przezroczystości zamiast niszczącego blura
    if (index > 0) {
        chars.forEach((char) => {
            const startX = isMobile ? (Math.random() - 0.5) * 60 : (Math.random() - 0.5) * window.innerWidth * 0.7;
            const startY = isMobile ? (Math.random() - 0.5) * 40 : (Math.random() - 0.6) * window.innerHeight * 0.7;
            const startZ = isMobile ? 0 : (Math.random() - 0.5) * 500;
            const startRot = isMobile ? (Math.random() - 0.5) * 45 : (Math.random() - 0.5) * 180;

            masterTimeline.from(char, {
                x: startX,
                y: startY,
                z: startZ,
                rotationX: startRot,
                rotationY: startRot,
                scale: 0, // Litery rosną z nicości składając się w wyraz
                opacity: 0,
                duration: 1
            }, 0);
        });

        if(subtitle) masterTimeline.from(subtitle, { opacity: 0, y: 30, duration: 0.8 }, 0.2);
        if(cta) masterTimeline.from(cta, { opacity: 0, y: 30, duration: 0.6 }, 0.4);
    }

    masterTimeline.to({}, { duration: 0.4 });
});


// --- 4. ZAAWANSOWANE EFEKTY INTERAKTYWNE DLA FORMULARZA ---
const formCard = document.querySelector('.contact-card');
const formInputs = document.querySelectorAll('.custom-input-group input, .custom-input-group textarea');

formInputs.forEach(input => {
    // Podświetlenie całej karty neonem, gdy użytkownik wejdzie w interakcję z polami
    input.addEventListener('focus', () => {
        formCard.classList.add('form-active');
    });
    
    input.addEventListener('blur', () => {
        // Zdejmij podświetlenie tylko jeśli wszystkie pola są puste i nieaktywne
        const anyActive = Array.from(formInputs).some(inp => inp === document.activeElement);
        if(!anyActive) {
            formCard.classList.remove('form-active');
        }
    });
});


// --- 5. OBSŁUGA FORMULARZA KONTAKTOWEGO (AJAX) ---
const form = document.getElementById('contact-form-element');
const result = document.getElementById('form-result');

if(form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        result.style.color = "var(--primary)";
        result.innerHTML = "Wysyłanie sygnału...";
        
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
            if (response.status == 200) {
                result.style.color = "#00ff88"; 
                result.innerHTML = "Wiadomość wysłana pomyślnie! Odezwię się niebawem.";
                form.reset(); 
                formCard.classList.remove('form-active');
            } else {
                result.style.color = "#ff4444";
                result.innerHTML = jsonRes.message;
            }
        })
        .catch(error => {
            result.style.color = "#ff4444";
            result.innerHTML = "Coś poszło nie tak... Spróbuj ponownie później.";
        });
    });
}
