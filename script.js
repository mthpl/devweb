// Rejestracja wtyczki ScrollTrigger w silniku GSAP
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

    // 1. ANIMACJE WEJŚCIA (GSAP ScrollTrigger)
    // Animacja elementów sekcji Hero tuż po załadowaniu
    gsap.from('.hero-content > *', {
        opacity: 0,
        y: 40,
        duration: 1,
        stagger: 0.2,
        ease: 'power4.out'
    });

    // Płynne ujawnianie nagłówka sekcji usług przy przewijaniu
    gsap.from('.section-header', {
        scrollTrigger: {
            trigger: '.services-section',
            start: 'top 80%',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power2.out'
    });

    // Kaskadowe (staggered) pojawianie się kart usług w 3D
    gsap.from('.card-3d', {
        scrollTrigger: {
            trigger: '.services-grid',
            start: 'top 85%',
        },
        opacity: 0,
        y: 50,
        rotationX: -15,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out'
    });


    // 2. EFEKT INTERAKTYWNEGO TŁA (Myszka steruje głębią tła)
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const xPos = (clientX / window.innerWidth) - 0.5;
        const yPos = (clientY / window.innerHeight) - 0.5;

        // Delikatne poruszanie świecącymi kulami w tle
        gsap.to('.orb-1', { x: xPos * 50, y: yPos * 50, duration: 1, ease: 'power1.out' });
        gsap.to('.orb-2', { x: -xPos * 40, y: -yPos * 40, duration: 1, ease: 'power1.out' });
        
        // Pochylenie siatki perspektywicznej w tle
        gsap.to('.grid-overlay', { rotateY: xPos * 10, rotateX: 60 + (yPos * 10), duration: 0.5, ease: 'power2.out' });
    });


    // 3. ZAAWANSOWANY EFEKT 3D TILT DLA KART
    const cards = document.querySelectorAll('.card-3d');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // pozycja X myszki wewnątrz karty
            const y = e.clientY - rect.top;  // pozycja Y myszki wewnątrz karty
            
            // Mapowanie pozycji myszy na stopnie obrotu (max 15 stopni)
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const angleX = (yc - y) / 10;
            const angleY = (x - xc) / 10;
            
            // Dynamiczna transformacja 3D całego kontenera karty
            gsap.to(card, {
                rotateX: angleX,
                rotateY: angleY,
                transformPerspective: 1000,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        // Reset karty do pozycji wyjściowej po opuszczeniu jej obszaru przez mysz
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.5,
                ease: 'power2.out'
            });
        });
    });
});
