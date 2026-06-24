gsap.registerPlugin(ScrollTrigger);

// --- 1. SETUP INTEGRALNEJ SCENY THREE.JS ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5.5;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


// --- 2. JEDNA WSPÓLNA CHMURA CZĄSTECZEK (TŁO + TEKSTY) ---
const particleCount = 2500; // Duża liczba cząsteczek dająca efekt gęstego pyłu
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const initialPositions = new Float32Array(particleCount * 3); // Zapis stanu kosmosu

// Rozsypujemy losowo cząsteczki po całym ekranie (Twoje oryginalne tło)
for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 14;
    positions[i + 1] = (Math.random() - 0.5) * 8;
    positions[i + 2] = (Math.random() - 0.5) * 6;

    initialPositions[i] = positions[i];
    initialPositions[i + 1] = positions[i + 1];
    initialPositions[i + 2] = positions[i + 2];
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
    size: 0.045,
    color: 0x00fff2,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
});

const globalParticles = new THREE.Points(geometry, material);
scene.add(globalParticles);


// --- 3. SPRYTNY GENERATOR MATRYCY PUNKTÓW DLA TEKSTÓW (BEZ BŁĘDÓW CORS) ---
const textData = [
    "BUDOWA STRON WWW\nDLACZEGO WARTO?",
    "BUDOWA APLIKACJI\nANDROID",
    "KIM JESTEM?\nPROGRAMISTA Z PASJI"
];

const textTargets = [];

function sampleTextPoints(text, index) {
    const textCanvas = document.createElement('canvas');
    const ctx = textCanvas.getContext('2d');
    textCanvas.width = 900;
    textCanvas.height = 250;

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px Orbitron, sans-serif';
    
    // Rysowanie wielolinijkowe
    const lines = text.split('\n');
    lines.forEach((line, i) => {
        ctx.fillText(line, 20, 80 + (i * 65));
    });

    const imgData = ctx.getImageData(0, 0, textCanvas.width, textCanvas.height);
    const sampledPoints = [];

    // Skanujemy matrycę 2D pikseli i zbieramy koordynaty
    for (let y = 0; y < textCanvas.height; y += 3) {
        for (let x = 0; x < textCanvas.width; x += 3) {
            const alpha = imgData.data[(y * textCanvas.width + x) * 4 + 3];
            if (alpha > 130) {
                // Mapowanie proporcji pikseli do współrzędnych świata 3D Three.js
                const pX = (x - textCanvas.width / 2) * 0.011 - 1.2;
                const pY = -(y - textCanvas.height / 2) * 0.011 + 1.5;
                const pZ = (Math.random() - 0.5) * 0.2;
                sampledPoints.push({ x: pX, y: pY, z: pZ });
            }
        }
    }
    textTargets[index] = sampledPoints;
}

// Generowanie współrzędnych punktów
textData.forEach((text, i) => sampleTextPoints(text, i));


// --- 4. MECHANIZM INTERAKCJI SCROLLA I MYSZKI ---
let currentProgress = 0; // Sterowane przez ScrollTrigger (0 = Sekcja 1, 1 = Sekcja 2, itd.)
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
});

const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const posAttr = globalParticles.geometry.attributes.position;

    // Ustalanie sekcji bazowej i docelowej
    const activeIndex = Math.floor(currentProgress);
    const factor = currentProgress - activeIndex; // Ułamek przejścia (0 do 1)

    const baseSet = textTargets[activeIndex] || [];
    const nextSet = textTargets[activeIndex + 1] || [];

    for (let i = 0; i < particleCount; i++) {
        let targetX, targetY, targetZ;

        // EFEKT ROZPROSZENIA NA CAŁE TŁO PRZY SKROLOWANIU (factor > 0)
        if (factor > 0.05 && factor < 0.95) {
            // Cząsteczki wybuchają i wracają do swoich losowych pozycji z tła kosmicznego
            const seed = i * 3;
            const wave = Math.sin(factor * Math.PI); // Fala eksplozji (szczyt na środku skrolla)
            
            // Atomy lecą w losowe punkty kosmosu
            targetX = initialPositions[seed] + Math.sin(i) * wave * 2;
            targetY = initialPositions[seed + 1] + Math.cos(i) * wave * 2;
            targetZ = initialPositions[seed + 2];
        } else {
            // EFEKT SCALANIA W TEKST: Gdy jesteśmy blisko zatrzymania sekcji
            const currentSet = factor < 0.5 ? baseSet : nextSet;
            
            if (currentSet && currentSet[i % currentSet.length]) {
                targetX = currentSet[i % currentSet.length].x;
                targetY = currentSet[i % currentSet.length].y;
                targetZ = currentSet[i % currentSet.length].z;
            } else {
                // Nadmiarowe cząsteczki krążą luźno w tle jako pojedyncze gwiazdy
                const seed = i * 3;
                targetX = initialPositions[seed];
                targetY = initialPositions[seed + 1];
                targetZ = initialPositions[seed + 2];
            }
        }

        // Płynny dolot atomów klatka po klatce (fizyka lerpu)
        posAttr.array[i * 3] += (targetX - posAttr.array[i * 3]) * 0.12;
        posAttr.array[i * 3 + 1] += (targetY - posAttr.array[i * 3 + 1]) * 0.12;
        posAttr.array[i * 3 + 2] += (targetZ - posAttr.array[i * 3 + 2]) * 0.12;
    }

    posAttr.needsUpdate = true;

    // Stały, delikatny obrót uniwersum + wodzenie za myszką
    globalParticles.rotation.y = elapsedTime * 0.02;
    globalParticles.rotation.y += (mouseX * 0.4 - globalParticles.rotation.y) * 0.05;
    globalParticles.rotation.x += (-mouseY * 0.4 - globalParticles.rotation.x) * 0.05;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

// Responsywność
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    textData.forEach((text, i) => sampleTextPoints(text, i));
});


// --- 5. SCROLLTRIGGER: BLOKOWANIE EKRANU I KONTROLA FAZ ---
const sections = document.querySelectorAll('.particle-section');

sections.forEach((section, index) => {
    const ui = section.querySelector('.ui-target');

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=100%',
            scrub: 1,
            pin: true,
            anticipatePin: 1
        }
    });

    // Powiązanie suwaka myszy ze stanem ułożenia cząsteczek w pętli renderującej
    tl.to(window, {
        duration: 1,
        onUpdate: function() {
            currentProgress = index + this.progress();
        }
    });

    // Wygaszanie opisów i przycisków w trakcie wybuchu
    if (index < sections.length - 1) {
        gsap.to(ui, {
            scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
            opacity: 0,
            y: -30,
            pointerEvents: 'none'
        });
    }

    // Włączanie interfejsu kolejnej sekcji, gdy pył układa się w słowa
    if (index > 0) {
        gsap.to(ui, {
            scrollTrigger: { trigger: section, start: 'top 50%', end: 'top top', scrub: true },
            opacity: 1,
            y: 0,
            pointerEvents: 'auto'
        });
    }
});


// --- 6. FORMULARZ KONTAKTOWY (AJAX) ---
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
