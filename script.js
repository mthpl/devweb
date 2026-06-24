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


// --- 2. PARSER TEKSTU (SZANUJE TAGI <BR> I PROSTUJE STRUKTURĘ DLA OSTROŚCI) ---
document.querySelectorAll('.fx-shatter').forEach(title => {
    const fragment = document.createDocumentFragment();

    const extractChars = (node, inheritedClasses = '') => {
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                child.textContent.split('').forEach(char => {
                    if (char === ' ') {
                        fragment.appendChild(document.createTextNode(' '));
                    } else {
                        const span = document.createElement('span');
                        span.className = `char ${inheritedClasses}`.trim(); 
                        span.textContent = char;
                        fragment.appendChild(span);
                    }
                });
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                if (child.tagName.toLowerCase() === 'br') {
                    fragment.appendChild(document.createElement('br'));
                } else {
                    const currentClasses = child.className;
                    extractChars(child, currentClasses);
                }
            }
        });
    };

    extractChars(title);
    title.innerHTML = ''; 
    title.appendChild(fragment); 
});


// --- 3. DWUKIERUNKOWA OŚ CZASU (ZUNIFIKOWANE WEJŚCIE I ROZPAD) ---
const particleSections = document.querySelectorAll('.particle-section');

particleSections.forEach((section, index) => {
    const chars = section.querySelectorAll('.char');
    const subtitle = section.querySelector('.hero-subtitle');
    const cta = section.querySelector('.hero-cta');

    // Ustawienie domyślnego, krystalicznie ostrego stanu początkowego liter
    gsap.set(chars, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, opacity: 1, scale: 1 });
    if(subtitle) gsap.set(subtitle, { opacity: 1, y: 0 });
    if(cta) gsap.set(cta, { opacity: 1, y: 0 });

    const masterTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=150%', // Wydłużony czas przewijania, aby zmieścić rozpad
            scrub: 1,
            pin: true,
            anticipatePin: 1
        }
    });

    // FAZA 1: WEJŚCIE (SCALANIE) — litery wlatują z kosmosu (dla sekcji 2 i 3)
    if (index > 0) {
        chars.forEach((char) => {
            const inX = isMobile ? (Math.random() - 0.5) * 60 : (Math.random() - 0.5) * window.innerWidth * 0.7;
            const inY = isMobile ? (Math.random() - 0.5) * 40 : (Math.random() - 0.6) * window.innerHeight * 0.7;
            const inZ = isMobile ? 0 : (Math.random() - 0.5) * 500;
            const inRot = isMobile ? (Math.random() - 0.5) * 45 : (Math.random() - 0.5) * 180;

            masterTimeline.from(char, {
                x: inX,
                y: inY,
                z: inZ,
                rotationX: inRot,
                rotationY: inRot,
                scale: 0,
                opacity: 0,
                duration: 1
            }, 0);
        });

        if(subtitle) masterTimeline.from(subtitle, { opacity: 0, y: 40, duration: 0.8 }, 0.2);
        if(cta) masterTimeline.from(cta, { opacity: 0, y: 40, duration: 0.6 }, 0.4);
    }

    // FAZA 2: PUNKT KULMINACYJNY — stabilne okno czasowe, kiedy tekst stoi złączony na ekranie
    masterTimeline.to({}, { duration: 0.5 });

    // FAZA 3: WYJŚCIE (ROZPROSZENIE) — litery autentycznie eksplodują i rozlatują się w nicość
    chars.forEach((char) => {
        const outX = isMobile ? (Math.random() - 0.5) * 60 : (Math.random() - 0.5) * window.innerWidth * 0.7;
        const outY = isMobile ? (Math.random() - 0.5) * 40 : (Math.random() - 0.6) * window.innerHeight * 0.7;
        const outZ = isMobile ? 0 : (Math.random() - 0.5) * 500;
        const outRot = isMobile ? (Math.random() - 0.5) * 45 : (Math.random() - 0.5) * 180;

        masterTimeline.to(char, {
            x: outX,
            y: outY,
            z: outZ,
            rotationX: outRot,
            rotationY: outRot,
            scale: 0,
            opacity: 0,
            duration: 1
        }, '+=0'); // Odpalenie sekwencji wybuchu od razu po oknie stabilizacji
    });

    if(subtitle) masterTimeline.to(subtitle, { opacity: 0, y: -40, duration: 0.8 }, '-=1');
    if(cta) masterTimeline.to(cta, { opacity: 0, y: -20, duration: 0.6 }, '-=1');
});


// --- 4. INTERAKTYWNE WYDARZENIA FORMULARZA ---
const formCard = document.querySelector('.contact-card');
const formInputs = document.querySelectorAll('.custom-input-group input, .custom-input-group textarea');

formInputs.forEach(input => {
    input.addEventListener('focus', () => {
        formCard.classList.add('form-active');
    });
    
    input.addEventListener('blur', () => {
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
