gsap.registerPlugin(ScrollTrigger);

// --- 1. SEKCJA ENGINE 3D: PRAWDZIWY TEXT PARTICLE DISINTEGRATION ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Globalne zmienne cząsteczek
const totalParticles = 2200; // Liczba atomów na ekranie
const targetPositions = []; // Matryca celów dla kolejnych sekcji

// Inicjalizacja bazowych losowych pozycji cząsteczek w kosmosie
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(totalParticles * 3);

for(let i = 0; i < totalParticles * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 15;
}
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x00fff2,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
});

const particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

// FUNKCJA PRZEKSZTAŁCAJĄCA TEKST HTML NA WSPÓŁRZĘDNE 3D (Zapis kształtu liter)
function generateTextTargets(lines, index) {
    const textCanvas = document.createElement('canvas');
    const ctx = textCanvas.getContext('2d');
    textCanvas.width = 1000;
    textCanvas.height = 300;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 65px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    
    // Rysujemy linie tekstu na ukrytym canvasie 2D
    lines.forEach((line, i) => {
        ctx.fillText(line.toUpperCase(), textCanvas.width / 2, 100 + i * 80);
    });
    
    const imgData = ctx.getImageData(0, 0, textCanvas.width, textCanvas.height);
    const points = [];
    
    // Próbkowanie pikseli napisu
    for (let y = 0; y < textCanvas.height; y += 3) {
        for (let x = 0; x < textCanvas.width; x += 3) {
            const alpha = imgData.data[(y * textCanvas.width + x) * 4 + 3];
            if (alpha > 128) {
                // Skalowanie pikseli 2D do przestrzeni 3D Three.js
                const pX = (x - textCanvas.width / 2) * 0.015;
                const pY = -(y - textCanvas.height / 2) * 0.015 + 1.2;
                const pZ = (Math.random() - 0.5) * 0.2;
                points.push({x: pX, y: pY, z: pZ});
            }
        }
    }
    
    targetPositions[index] = points;
}

// Surowe teksty nagłówków, które mają ulegać eksplozji ( SEO i układ zachowany )
const headers = [
    ["Budowa stron WWW", "Dlaczego warto?"],
    ["Budowa dedykowanych", "Aplikacji Android"],
    ["Kim jestem?", "Programista z Pasji"]
];

headers.forEach((text, index) => generateTextTargets(text, index));

// Sterowanie za pomocą myszki/dotyku
let mouseX = 0, mouseY = 0;
const mouseHandler = (x, y) => {
    mouseX = (x / window.innerWidth) - 0.5;
    mouseY = (y / window.innerHeight) - 0.5;
};
document.addEventListener('mousemove', (e) => mouseHandler(e.clientX, e.clientY));
document.addEventListener('touchmove', (e) => mouseHandler(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

// Główna pętla renderowania i fizyki płynnego przyciągania atomów
const posAttribute = particleSystem.geometry.attributes.position;
let currentMorphProgress = 0; // Stan przejścia (0=Sekcja1, 1=Eksplozja, 2=Sekcja2 itd.)

const tick = () => {
    const baseSection = Math.floor(currentMorphProgress);
    const nextSection = baseSection + 1;
    const factor = currentMorphProgress - baseSection; // Postęp ułamkowy skrolla (0 do 1)

    const baseTargets = targetPositions[baseSection] || [];
    const nextTargets = targetPositions[nextSection] || [];

    for (let i = 0; i < totalParticles; i++) {
        let tX, tY, tZ;

        // PRAWDZIWY EFEKT WYBUCHU: jeśli jesteśmy w trakcie skrolowania, cząsteczki rozlatują się agresywnie po tle
        if (factor > 0.1 && factor < 0.9) {
            // Generujemy chaos/rozproszenie w przestrzeni na bazie funkcji sinus
            const seed = i * 0.5;
            const explosionFactor = 1 + Math.sin(factor * Math.PI) * 1.5;
            tX = Math.sin(seed) * 6 * explosionFactor;
            tY = Math.cos(seed) * 6 * explosionFactor;
            tZ = Math.sin(seed * 2) * 5 * explosionFactor;
        } else {
            // STABILIZACJA I SCALANIE: cząsteczki układają się idealnie w litery aktualnej sekcji
            const targetSet = factor < 0.5 ? baseTargets : nextTargets;
            if (targetSet && targetSet[i % targetSet.length]) {
                tX = targetSet[i % targetSet.length].x;
                tY = targetSet[i % targetSet.length].y;
                tZ = targetSet[i % targetSet.length].z;
            } else {
                // Jeśli brakuje punktów, reszta krąży swobodnie w tle kosmosu
                tX = Math.sin(i) * 5;
                tY = Math.cos(i) * 5;
                tZ = Math.sin(i * 2) * 3;
            }
        }

        // Płynna interpolacja (LERP) pozycji dla zachowania płynności klatek
        posAttribute.array[i * 3] += (tX - posAttribute.array[i * 3]) * 0.12;
        posAttribute.array[i * 3 + 1] += (tY - posAttribute.array[i * 3 + 1]) * 0.12;
        posAttribute.array[i * 3 + 2] += (tZ - posAttribute.array[i * 3 + 2]) * 0.12;
    }

    posAttribute.needsUpdate = true;

    // Delikatna reakcja całej chmury na kursor/dotyk
    particleSystem.rotation.y += (mouseX * 0.4 - particleSystem.rotation.y) * 0.05;
    particleSystem.rotation.x += (-mouseY * 0.4 - particleSystem.rotation.x) * 0.05;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

// Dopasowanie do zmian rozmiaru okna
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// --- 2. SEKCJA SCROLL TRIGGER: KONTROLA ROZPADU I UI ---
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

    // Płynna zmiana suwaka kontrolującego stan cząsteczek Three.js
    tl.to(window, {
        duration: 1,
        onUpdate: function() {
            currentMorphProgress = index + this.progress();
        }
    });

    // Wygaszanie interfejsu (UI) aktualnej sekcji, gdy cząsteczki wybuchają
    if (index < sections.length - 1) {
        gsap.to(ui, {
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: 'bottom top',
                scrub: true
            },
            opacity: 0,
            pointerEvents: 'none'
        });
    }

    // Włączanie interfejsu nowej sekcji, gdy cząsteczki scalają się w wyraz
    if (index > 0) {
        gsap.to(ui, {
            scrollTrigger: {
                trigger: section,
                start: 'top 50%',
                end: 'top top',
                scrub: true
            },
            opacity: 1,
            pointerEvents: 'auto'
        });
    }
});


// --- 3. SEKCJA KONTAKT: INTERAKTYWNE EFEKTY ---
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

// Obsługa formularza AJAX
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
