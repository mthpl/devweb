const card = document.getElementById('card');
const shine = document.querySelector('.shine');

// Maksymalny kąt obrotu w stopniach
const maxRotation = 15; 

document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    // Obliczanie pozycji myszki w przedziale od -0.5 do 0.5
    const xOffset = (clientX / innerWidth) - 0.5;
    const yOffset = (clientY / innerHeight) - 0.5;

    // Obliczanie obrotu (Y zależy od X myszki, X zależy od Y myszki)
    const rotateX = -yOffset * maxRotation * 2;
    const rotateY = xOffset * maxRotation * 2;

    // Płynna animacja karty za pomocą GSAP
    gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto"
    });

    // Płynny ruch błysku (Shine effect)
    gsap.to(shine, {
        opacity: 1,
        x: xOffset * 100,
        y: yOffset * 100,
        duration: 0.5,
        ease: "power2.out"
    });
});

// Resetowanie pozycji karty, gdy myszka opuści ekran
document.addEventListener('mouseleave', () => {
    gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.8,
        ease: "power2.out"
    });
    
    gsap.to(shine, {
        opacity: 0,
        duration: 0.8
    });
});
