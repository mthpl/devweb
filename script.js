gsap.registerPlugin(ScrollTrigger);

// --- SEKCJA THREE.JS: STABILNE INTERAKTYWNE TŁO ---
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

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
});

const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    
    // USUNIĘTO PRZYSPIESZANIE TŁA - tło obraca się zawsze ze stałą, płynną prędkością bazową
    particleSystem.rotation.y = elapsedTime * 0.04;
    particleSystem.position.z = 0;

    targetX = mouseX * 2.8;
    targetY = -mouseY * 2.8;

    particleSystem.rotation.x += 0.05 * (targetY - particleSystem.rotation.x);
    particleSystem.rotation.y += 0.05 * (targetX - particleSystem.rotation.y);

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// --- SEKCJA INTERAKTYWNEGO ROZPADU I SCALANIA TEKSTU (MORPHING) ---
// Poprawione wartości filtrów i stanów początkowych, by teksty i przyciski były idealnie kolorowe na starcie
const sections = document.querySelectorAll('.particle-section');

sections.forEach((section) => {
    const textBlock = section.querySelector('.morph-target');

    // Ustawienie czystego stanu początkowego (brak rozmycia, pełna widoczność)
    gsap.set(textBlock, { filter: 'blur(0px) contrast(100%)', opacity: 1, letterSpacing: '0px' });

    const morphTl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top top',     
            end: 'bottom top',    
            scrub: true,          
            pin: true,            
            anticipatePin: 1
        }
    });

    morphTl.to(textBlock, {
        letterSpacing: '12px',      
        filter: 'blur(25px) contrast(200%)', 
        opacity: 0,                 
        scale: 1.1,                
        y: -100,                    
        duration: 1
    });
    // USUNIĘTO MODYFIKACJĘ PRĘDKOŚCI GWIAZD (speedMultiplier)
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
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
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
