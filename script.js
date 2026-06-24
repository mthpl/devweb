gsap.registerPlugin(ScrollTrigger);

// --- SEKCJA ENGINE 3D: TEXT PARTICLE MORPHING ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Globalne zmienne cząsteczek
const totalParticles = 2200; // Liczba niezależnych atomów na ekranie
const particlePositions = [];
const targetPositions = []; // Matryca celów dla kolejnych sekcji tekstowych

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
function generateTextTargets(text, index) {
    const textCanvas = document.createElement('canvas');
    const ctx = textCanvas.getContext('2d');
    textCanvas.width = 800;
    textCanvas.height = 200;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px Orbitron';
    ctx.fillText(text, 10, 80);
    
    const imgData = ctx.getImageData(0, 0, textCanvas.width, textCanvas.height);
    const points = [];
    
    // Próbkowanie pikseli napisu
    for (let y = 0; y < textCanvas.height; y += 3) {
        for (let x = 0; x < textCanvas.width; x += 3) {
            const alpha = imgData.data[(y * textCanvas.width + x) * 4 + 3];
            if (alpha > 128) {
                // Skalowanie pikseli 2D do przestrzeni 3D
                const pX = (x - textCanvas.width / 2) * 0.012;
                const pY = -(y - textCanvas.height / 2) * 0.012 + 0.8;
                const pZ = (Math.random() - 0.5) * 0.1;
                points.push({x: pX, y: pY, z: pZ});
            }
        }
    }
    
    targetPositions[index] = points;
}

// Odczytanie tekstów z HTML i przygotowanie ich struktur 3D
const sourceElements = document.querySelectorAll('.source-text');
sourceElements.forEach((el, index) => {
    generateTextTargets(el.innerText, index);
});

// Sterowanie za pomocą myszki
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
});

// Główna pętla renderowania i fizyki płynnego przyciągania atomów
const currentCoords = positions;
let currentMorphProgress = 0; // Stan przejścia (0 = sekcja 1, 1 = rozpad, 2 = sekcja 2 itd.)

const tick = () => {
    const posAttribute = particleSystem.geometry.attributes.position;
    
    // Dynamiczne obliczanie indeksów sekcji bazowej i docelowej
    const baseSection = Math.floor(currentMorphProgress);
    const nextSection = baseSection + 1;
    const factor = currentMorphProgress - baseSection; // Postęp ułamkowy skrolla (0 do 1)

    const baseTargets = targetPositions[baseSection] || [];
    const nextTargets = targetPositions[nextSection] || [];

    for (let i = 0; i < totalParticles; i++) {
        let tX, tY, tZ;

        // EFEKT WYBUCHU: jeśli jesteśmy w trakcie skrolowania (factor > 0), cząsteczki eksplodują na całe tło
        if (factor > 0.02 && factor < 0.98) {
            // Generujemy losowy chaos/rozproszenie w przestrzeni na bazie funkcji sinus
            const seed = i * 0.5;
            tX = Math.sin(seed) * 5 * (1 + Math.sin(factor * Math.PI));
            tY = Math.cos(seed) * 5 * (1 + Math.sin(factor * Math.PI));
            tZ = Math.sin(seed * 2) * 4;
        } else {
            // STABILIZACJA I SCALANIE: cząsteczki układają się idealnie w litery aktualnej sekcji
            const targetSet = factor < 0.5 ? baseTargets : nextTargets;
            if (targetSet && targetSet[i % targetSet.length]) {
                tX = targetSet[i % targetSet.length].x;
                tY = targetSet[i % targetSet.length].y;
                tZ = targetSet[i % targetSet.length].z;
            } else {
                // Jeśli brakuje punktów, reszta krąży swobodnie w tle
                tX = Math.sin(i) * 4;
                tY = Math.cos(i) * 4;
                tZ = Math.sin(i * 2) * 2;
            }
        }

        // Płynna interpolacja (LERP) pozycji dla zachowania kinowej płynności klatek
        posAttribute.array[i * 3] += (tX - posAttribute.array[i * 3]) * 0.1;
        posAttribute.array[i * 3 + 1] += (tY - posAttribute.array[i * 3 + 1]) * 0.1;
        posAttribute.array[i * 3 + 2] += (tZ - posAttribute.array[i * 3 + 2]) * 0.1;
    }

    posAttribute.needsUpdate = true;

    // Delikatna reakcja całej chmury na kursor myszy
    particleSystem.rotation.y += (mouseX * 0.5 - particleSystem.rotation.y) * 0.05;
    particleSystem.rotation.x += (-mouseY * 0.5 - particleSystem.rotation.x) * 0.05;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

// Dopasowanie do zmian rozmiaru okna
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    sourceElements.forEach((el, index) => generateTextTargets(el.innerText, index));
});


// --- SYSTEM SCROLLTRIGGER: KONTROLA ROZPADU I WIDOCZNOŚCI BLOKÓW ---
const textSections = document.querySelectorAll('.hero-section');

textSections.forEach((section, index) => {
    const uiElements = section.querySelector('.interactive-ui');

    // Główny timeline blokujący sekcję i sterujący indeksem rozpadu cząsteczek
    const scrollTl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=100%', // Długość trwania efektu skrolowania
            scrub: 1,
            pin: true,
            anticipatePin: 1
        }
    });

    // Płynne podmienianie wartości zmiennej sterującej wyglądem cząsteczek w Three.js
    scrollTl.to(window, {
        duration: 1,
        onUpdate: function() {
            // Przeliczanie globalnego postępu morfingu tekstów
            currentMorphProgress = index + this.progress();
        }
    });

    // Sterowanie widocznością opisów i przycisków (interfejsu) towarzyszących tekstom 3D
    if (index > 0) {
        // Pojawianie się interfejsu nowej sekcji, gdy cząsteczki zaczynają się scalać
        gsap.to(uiElements, {
            scrollTrigger: {
                trigger: section,
                start: 'top 40%',
                end: 'top top',
                scrub: true
            },
            opacity: 1,
            pointerEvents: 'auto'
        });
    }

    // Znikanie interfejsu aktualnej sekcji, gdy zaczynamy skrolować w dół do kolejnej
    if (index < textSections.length - 1) {
        gsap.to(uiElements, {
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
});


// --- OBSŁUGA FORMULARZA KONTAKTOWEGO (AJAX) ---
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
