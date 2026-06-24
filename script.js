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
let speedMultiplier = 1; 

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
});

const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    
    particleSystem.rotation.y = elapsedTime * (0.04 * speedMultiplier);
    
    if(speedMultiplier > 1) {
        particleSystem.position.z = (speedMultiplier - 1) * 1.5;
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


// --- SEKCJA INTERAKTYWNEGO ROZPADU I SCALANIA TEKSTU (MORPHING) ---
const sections = document.querySelectorAll('.particle-section');

sections.forEach((section) => {
    const textBlock = section.querySelector('.morph-target');

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
    })
    .to({}, {
        duration: 1,
        onUpdate: function() {
            let progress = this.progress();
            speedMultiplier = 1 + (progress * 15);
        }
    }, 0); 
});
