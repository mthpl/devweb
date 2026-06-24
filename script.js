gsap.registerPlugin(ScrollTrigger);

// --- SEKCJA THREE.JS: INTERAKTYWNA PRZESTRZEŃ KOSMICZNA ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const particlesGeometry = new THREE.BufferGeometry();
const count = 1800; // Duża gęstość cząsteczek
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
let speedMultiplier = 1; // Mnożnik prędkości kontrolowany przez scrollowanie

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
});

const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    
    // Podstawowa rotacja + hiper-prędkość wywoływana scrollem
    particleSystem.rotation.y = elapsedTime * (0.04 * speedMultiplier);
    // Efekt przybliżania (lecenie w głąb gwiazd przy przejściu)
    if(speedMultiplier > 1) {
        particleSystem.position.z = (speedMultiplier - 1) * 2;
    } else {
        particleSystem.position.z = 0;
    }

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


// --- SEKCJA GSAP: INTRO ANIMACJA ---
gsap.from('.hero-content > *', {
    opacity: 0,
    y: 50,
    duration: 1.2,
    stagger: 0.15,
    ease: 'power3.out'
});


// --- SPERSONALIZOWANE, ULTRA-DYNAMICZNE PRZEJŚCIE 3D (SKOK W NADPRZESTRZEŃ) ---
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: '#text-trigger',
        start: 'top bottom', // Start animacji gdy sekcja wchodzi od dołu
        end: 'bottom top',   // Koniec gdy opuszcza górę ekranu
        scrub: true,         // Pełna synchronizacja z ruchem myszki / palca
    }
});

// Faza 1: Pojawianie się tekstu i przyspieszanie silnika 3D
tl.to('.dissolve-text', {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    duration: 1
})
.to({}, {
    duration: 1,
    onUpdate: function() {
        // Zwiększanie prędkości obrotu i zbliżania gwiazd Three.js
        let progress = this.progress(); // Pobiera aktualny postęp sekcji od 0 do 1
        speedMultiplier = 1 + (Math.sin(progress * Math.PI) * 12); // Szczyt prędkości na środku sekcji
    }
}, 0) // uruchom w tym samym czasie
// Faza 2: Rozmycie, powiększenie i zniknięcie tekstu
.to('.dissolve-text', {
    opacity: 0,
    scale: 1.6,
    filter: 'blur(25px)',
    y: -80,
    duration: 1
});
