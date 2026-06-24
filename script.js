gsap.registerPlugin(ScrollTrigger);

// --- 1. STABILNE, ORYGINALNE TŁO KOSMICZNE THREE.JS ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const particlesGeometry = new THREE.BufferGeometry();
const count = 1800; // Twoja oryginalna liczba gwiazd
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
    
    // Tło kręci się stabilnie w stałym tempie, bez zniekształceń
    particleSystem.rotation.y = elapsedTime * 0.04;
    particleSystem.rotation.x += ( -mouseY * 0.5 - particleSystem.rotation.x ) * 0.05;
    particleSystem.rotation.y += ( mouseX * 0.5 - particleSystem.rotation.y ) * 0.05;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// --- 2. PRAWDZIWY EFEKT ROZPADU I SCALANIA TEKSTU W CZĄSTECZKI (CANVAS DISINTEGRATION) ---
const particleSections = document.querySelectorAll('.particle-section');

particleSections.forEach((section) => {
    const target = section.querySelector('.morph-target');

    // Tworzymy mechanizm rozbicia zawartości na piksele po załadowaniu html2canvas
    window.addEventListener('load', () => {
        html2canvas(target, { background: 'transparent', scale: 1, useCORS: true }).then(canvas => {
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Generujemy nakładkę rysującą cząsteczki
            const pCanvas = document.createElement('canvas');
            pCanvas.classList.add('disintegrate-canvas');
            pCanvas.width = canvas.width;
            pCanvas.height = canvas.height;
            const pCtx = pCanvas.getContext('2d');
            target.appendChild(pCanvas);

            // Filtrujemy piksele tekstu, tworząc z nich strukturę fizycznych punktów
            const localParticles = [];
            for (let y = 0; y < canvas.height; y += 4) {
                for (let x = 0; x < canvas.width; x += 4) {
                    const i = (y * canvas.width + x) * 4;
                    if (imgData.data[i + 3] > 128) { // Pobierz tylko widoczne elementy tekstu/guzików
                        localParticles.push({
                            x: x, y: y,
                            r: imgData.data[i], g: imgData.data[i+1], b: imgData.data[i+2], a: imgData.data[i+3],
                            vx: (Math.random() - 0.5) * 8, // Prędkość eksplozji w bok
                            vy: (Math.random() - 2) * 6,   // Prędkość wznoszenia się w górę
                        });
                    }
                }
            }

            // Sterownik animacji podpięty pod ScrollTrigger
            const obj = { progress: 0 };
            gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: '+=100%',
                    scrub: true,
                    pin: true,
                    onUpdate: (self) => {
                        // Kiedy skrolujemy, płynnie ukrywamy standardowy tekst i odpalamy cząsteczki
                        if (self.progress > 0.01 && self.progress < 0.99) {
                            target.style.opacity = 0.01; // Zachowaj przestrzeń, ale ukryj tekst renderowany przez przeglądarkę
                        } else if (self.progress >= 0.99) {
                            target.style.opacity = 0;
                        } else {
                            target.style.opacity = 1;
                        }
                    }
                }
            }).to(obj, {
                progress: 1,
                ease: "none",
                onUpdate: () => {
                    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
                    
                    // Rysujemy fizyczny rozpad tekstu klatka po klatce na bazie poziomu przewijania
                    localParticles.forEach(p => {
                        const currentX = p.x + p.vx * obj.progress * 30;
                        const currentY = p.y + p.vy * obj.progress * 30 - (obj.progress * 150); // Efekt odlatywania w kosmos
                        const currentAlpha = Math.max(0, (p.a / 255) * (1 - obj.progress));

                        pCtx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${currentAlpha})`;
                        pCtx.fillRect(currentX, currentY, 2.5, 2.5); // Cząsteczki rozbitego tekstu
                    });
                }
            });
        });
    });
});


// --- 3. OBSŁUGA FORMULARZA KONTAKTOWEGO (AJAX) ---
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
