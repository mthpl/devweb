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
const count = 1500; // Zwiększona liczba dla efektu WOW
const positions = new Float32Array(count * 3);

for(let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 12;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.038,
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
    particleSystem.rotation.y = elapsedTime * 0.04;

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


// --- SEKCJA GSAP: INTRO ANIMACJA SEKCJ HERO ---
gsap.from('.hero-content > *', {
    opacity: 0,
    y: 50,
    duration: 1.2,
    stagger: 0.15,
    ease: 'power3.out'
});


// --- EFEKTOWNE ROZPROSZENIE / ZNIKANIE TEKSTU PRZY SCROLLOWANIU ---
gsap.fromTo('.dissolve-text', 
    { 
        opacity: 0, 
        scale: 0.8, 
        filter: 'blur(15px)' 
    },
    {
        scrollTrigger: {
            trigger: '#text-trigger',
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: true, // Animacja idzie dokładnie za palcem/skrollem
            toggleActions: 'play reverse play reverse'
        },
        opacity: 1,
        scale: 1.1,
        filter: 'blur(0px)',
        ease: 'none'
    }
);

// Druga faza skrollowania — tekst rozprasza się i znika w miarę dalszego ruchu w dół
gsap.to('.dissolve-text', {
    scrollTrigger: {
        trigger: '#text-trigger',
        start: 'top 30%',
        end: 'bottom top',
        scrub: true
    },
    opacity: 0,
    scale: 1.4,
    filter: 'blur(20px)',
    y: -50,
    ease: 'none'
});
