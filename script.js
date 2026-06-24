gsap.registerPlugin(ScrollTrigger);

// --- 1. ORYGINALNE TŁO THREE.JS ---
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


// --- 2. ROZBICIE TEKSTU NA LITERY ---
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


// --- 3. UJEDNOLICONY SYSTEM SCALANIA I WYJŚCIA TEKSTU (JAK W SEKCOJI "KIM JESTEM") ---
const particleSections = document.querySelectorAll('.particle-section');

particleSections.forEach((section, index) => {
    const chars = section.querySelectorAll('.char');
    const subtitle = section.querySelector('.hero-subtitle');
    const cta = section.querySelector('.hero-cta');

    // Główny proces przypięcia sekcji (Scroll pinning)
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

    // Ujednolicony algorytm lotu liter: każda litera na starcie przylatuje z losowej przestrzeni 3D
    chars.forEach((char) => {
        masterTimeline.from(char, {
            x: () => (Math.random() - 0.5) * window.innerWidth * 0.7,
            y: () => (Math.random() - 0.6) * window.innerHeight * 0.7,
            z: () => (Math.random() - 0.5) * 600, // Nadlatywanie z głębokiego tła
            rotationX: () => (Math.random() - 0.5) * 270,
            rotationY: () => (Math.random() - 0.5) * 270,
            opacity: 0,
            filter: 'blur(10px)',
            duration: 1
        }, 0);
    });

    // Płynne włączanie / wyostrzanie opisów i przycisków równo ze scalaniem się liter nagłówka
    if(subtitle) {
        masterTimeline.from(subtitle, {
            opacity: 0,
            y: 30,
            filter: 'blur(12px)',
            duration: 0.8
        }, 0.2);
    }

    if(cta) {
        masterTimeline.from(cta, {
            opacity: 0,
            y: 30,
            filter: 'blur(8px)',
            duration: 0.6
        }, 0.4);
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
