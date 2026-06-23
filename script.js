// Rejestracja wtyczek GSAP
gsap.registerPlugin(ScrollTrigger);

// --- SEKCJA THREE.JS: INTERAKTYWNA PRZESTRZEŃ KOSMICZNA ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

// Kamera z perspektywą głębi
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Tworzenie geometrii dla 1200 cząsteczek gwiezdnych
const particlesGeometry = new THREE.BufferGeometry();
const count = 1200;
const positions = new Float32Array(count * 3);

for(let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 12; // Rozproszenie w przestrzeni X, Y, Z
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Wygląd cząsteczek (Neonowy, okrągły punkt cyfrowy)
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.035,
    color: 0x00fff2,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

// Połączenie w jeden obiekt 3D i dodanie do sceny
const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particleSystem);

// Monitorowanie pozycji myszy
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

document.addEventListener('mousemove', (event) => {
    // Normalizacja pozycji myszy (-0.5 do 0.5)
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
});

// Pętla renderowania (60 klatek na sekundę z płynną fizyką tłumienia)
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Stały, powolny obrót całego uniwersum
    particleSystem.rotation.y = elapsedTime * 0.05;

    // Reaktancja na kursor myszy (płynne gubienie pędu za pomocą lerpu)
    targetX = mouseX * 2.5;
    targetY = -mouseY * 2.5;

    particleSystem.rotation.x += 0.05 * (targetY - particleSystem.rotation.x);
    particleSystem.rotation.y += 0.05 * (targetX - particleSystem.rotation.y);

    // Renderowanie klatki
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();

// Responsywność okna 3D
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// --- SEKCJA GSAP: INTRO I EFEKTY INTERFEJSU ---
gsap.from('.hero-content > *', {
    opacity: 0,
    y: 60,
    duration: 1.4,
    stagger: 0.2,
    ease: 'power4.out'
});

gsap.from('.card-3d', {
    scrollTrigger: {
        trigger: '.services-grid',
        start: 'top 85%',
    },
    opacity: 0,
    y: 50,
    duration: 1,
    stagger: 0.2,
    ease: 'power3.out'
});


// --- SEKCJA 3D TILT PARALLAX DLA KART ---
const cards = document.querySelectorAll('.card-3d');

cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (centerY - y) / 10;
        const rotateY = (x - centerX) / 10;

        gsap.to(card, {
            rotateX: rotateX,
            rotateY: rotateY,
            duration: 0.3,
            ease: 'power2.out'
        });

        // Wypychanie warstw w głąb osi Z
        const layers = card.querySelectorAll('.card-layer');
        layers.forEach(layer => {
            const depth = parseFloat(layer.getAttribute('data-depth')) || 0.2;
            const moveX = (x - centerX) * depth;
            const moveY = (y - centerY) * depth;

            gsap.to(layer, {
                x: moveX * 0.3,
                y: moveY * 0.3,
                translateZ: depth * 140, // Wyskakiwanie elementów przed ekran
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
        
        const layers = card.querySelectorAll('.card-layer');
        layers.forEach(layer => {
            gsap.to(layer, { x: 0, y: 0, translateZ: 0, duration: 0.6, ease: 'power3.out' });
        });
    });
});
