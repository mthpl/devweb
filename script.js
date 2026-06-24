gsap.registerPlugin(ScrollTrigger);

// --- 1. ODZYSKANE, ORYGINALNE TŁO TRZYWYMIAROWE ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const particlesGeometry = new THREE.BufferGeometry();
const count = 1800; 
const positions = new Float32Array(count * 3);

for(let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 12;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.04,
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

const clock = new THREE.Clock();
const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    
    particleSystem.rotation.y = elapsedTime * 0.04;
    particleSystem.rotation.x += ( -mouseY * 0.4 - particleSystem.rotation.x ) * 0.05;
    particleSystem.rotation.y += ( mouseX * 0.4 - particleSystem.rotation.y ) * 0.05;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// --- 2. ROZBICIE NALEŻĄCE TYLKO DO TEKSTU ---
document.querySelectorAll('.fx-shatter').forEach(title => {
    const text = title.innerHTML;
    title.innerHTML = '';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    
    const processNodes = (node, output) => {
        node.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                child.textContent.split('').forEach(char => {
                    if(char === ' ') {
                        output.innerHTML += ' ';
                    } else {
                        output.innerHTML += `<span class="char">${char}</span>`;
                    }
                });
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const newEl = child.cloneNode(false);
                newEl.innerHTML = '';
                processNodes(child, newEl);
                output.appendChild(newEl);
            }
        });
    };
    processNodes(tempDiv, title);
});

// --- 3. DWUKIERUNKOWA ANIMACJA WEJŚCIA I WYJŚCIA SEKCOJI ---
const particleSections = document.querySelectorAll('.particle-section');

particleSections.forEach((section, index) => {
    const chars = section.querySelectorAll('.char');
    const subtitle = section.querySelector('.hero-subtitle');
    const cta = section.querySelector('.hero-cta');

    // Nadpisujemy domyślne style startowe – wszystko na dzień dobry jest OSTRY i widoczny
    gsap.set(chars, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, opacity: 1, filter: 'blur(0px)' });
    if(subtitle) gsap.set(subtitle, { opacity: 1, y: 0, filter: 'blur(0px)' });
    if(cta) gsap.set(cta, { opacity: 1, y: 0, filter: 'blur(0px)' });

    // Główny Master Timeline dla przypiętej sekcji
    const masterTl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=150%', // Zwiększony dystans scrollowania dla płynności
            scrub: 1,
            pin: true,
            anticipatePin: 1
        }
    });

    // KROK A: Jeśli to nie jest pierwsza sekcja, najpierw tworzymy animację SCALANIA (wejścia) z kosmosu
    if (index > 0) {
        const introTl = gsap.timeline();
        
        chars.forEach((char) => {
            introTl.from(char, {
                x: () => (Math.random() - 0.5) * window.innerWidth * 0.6,
                y: () => (Math.random() - 0.6) * window.innerHeight * 0.6,
                z: () => (Math.random() - 0.5) * 500,
                rotationX: () => (Math.random() - 0.5) * 180,
                rotationY: () => (Math.random() - 0.5) * 180,
                opacity: 0,
                filter: 'blur(10px)',
                duration: 1
            }, 0);
        });

        if(subtitle) introTl.from(subtitle, { opacity: 0, y: 30, filter: 'blur(10px)', duration: 0.8 }, 0.2);
        if(cta) introTl.from(cta, { opacity: 0, y: 30, filter: 'blur(10px)', duration: 0.6 }, 0.4);

        masterTl.add(introTl);
    }

    // Mała chwila stabilizacji (odpoczynek tekstu na ekranie podczas czytania)
    masterTl.to({}, { duration: 0.5 });

    // KROK B: Jeśli to nie jest ostatnia sekcja, dodajemy animację ROZPADU (wyjścia) w przestrzeń
    if (index < particleSections.length - 1) {
        const outroTl = gsap.timeline();

        chars.forEach((char) => {
            const randomX = (Math.random() - 0.5) * window.innerWidth * 0.7;
            const randomY = (Math.random() - 0.6) * window.innerHeight * 0.7;
            const randomZ = (Math.random() - 0.5) * 600; 
            const randomRot = (Math.random() - 0.5) * 270;

            outroTl.to(char, {
                x: randomX,
                y: randomY,
                z: randomZ,
                rotationX: randomRot,
                rotationY: randomRot,
                opacity: 0,
                filter: 'blur(8px)',
                duration: 1
            }, 0);
        });

        if(subtitle) outroTl.to(subtitle, { filter: 'blur(12px)', opacity: 0, y: -40, duration: 0.8 }, 0);
        if(cta) outroTl.to(cta, { opacity: 0, filter: 'blur(8px)', y: -20, duration: 0.6 }, 0);

        masterTl.add(outroTl);
    }
});


// --- 4. OBSŁUGA FORMULARZA KONTAKTOWEGO (AJAX) ---
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
