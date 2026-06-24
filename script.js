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


// --- 2. ZMODYFIKOWANY PARSER TEKSTU (SZANUJE I PRZENOSI TAGI <BR> DLA IDEALNEGO UKŁADU) ---
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
                // JEŚLI TRAFIMY NA <BR>, PRZENOSIMY GO BEZPOŚREDNIO DO STRUKTURY ZNAKÓW
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


// --- 3. SPÓJNY SYSTEM SCALANIA I WYJŚCIA TEKSTU DLA WSZYSTKICH SEKCOJI ---
const particleSections = document.querySelectorAll('.particle-section');

particleSections.forEach((section, index) => {
    const chars = section.querySelectorAll('.char');
    const subtitle = section.querySelector('.hero-subtitle');
    const cta = section.querySelector('.hero-cta');

    // Reset – wymuszenie pełnej ostrości dla całego nagłówka od startu
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

    // GENEROWANIE POZYCJI WYBUCHU ZNAKÓW
    const animData = Array.from(chars).map(() => ({
        x: isMobile ? (Math.random() - 0.5) * 60 : (Math.random() - 0.5) * window.innerWidth * 0.7,
        y: isMobile ? (Math.random() - 0.5) * 40 : (Math.random() - 0.6) * window.innerHeight * 0.7,
        z: isMobile ? 0 : (Math.random() - 0.5) * 500,
        rot: isMobile ? (Math.random() - 0.5) * 45 : (Math.random() - 0.5) * 180
    }));

    // ETAP ENTRANCE (WEJŚCIE): Jeśli to nie pierwsza sekcja, litery wlatują z kosmosu
    if (index > 0) {
        chars.forEach((char, i) => {
            masterTimeline.from(char, {
                x: animData[i].x,
                y: animData[i].y,
                z: animData[i].z,
                rotationX: animData[i].rot,
                rotationY: animData[i].rot,
                scale: 0,
                opacity: 0,
                duration: 0.5
            }, 0);
        });

        if(subtitle) masterTimeline.from(subtitle, { opacity: 0, y: 30, duration: 0.4 }, 0.1);
        if(cta) masterTimeline.from(cta, { opacity: 0, y: 30, duration: 0.3 }, 0.2);
    }

    // Punkt kulminacyjny sekcji (tekst idealnie ułożony, ostry)
    masterTimeline.to({}, { duration: 0.4 });

    // ETAP EXIT (WYJŚCIE): DODANO ROZPAD DLA PIERWSZEJ I DRUGIEJ SEKCJI PRZY SCROLLU W DÓŁ
    if (index < particleSections.length - 1) {
        chars.forEach((char, i) => {
            masterTimeline.to(char, {
                x: animData[i].x,
                y: animData[i].y,
                z: animData[i].z,
                rotationX: animData[i].rot,
                rotationY: animData[i].rot,
                scale: 0,
                opacity: 0,
                duration: 0.5
            }, '+=0');
        });

        if(subtitle) masterTimeline.to(subtitle, { opacity: 0, y: -40, duration: 0.4 }, '-=0.5');
        if(cta) masterTimeline.to(cta, { opacity: 0, y: -20, duration: 0.3 }, '-=0.5');
    }
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
