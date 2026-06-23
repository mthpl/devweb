// Aktywacja silnika animacji ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

    // 1. GENEROWANIE PRZESTRZENI CZĄSTECZEK (Glow Stars 3D)
    const particlesContainer = document.getElementById('particles-container');
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Losowa dystrybucja pozycji i głębi (skala jako trzeci wymiar)
        const size = Math.random() * 3 + 1;
        const xPos = Math.random() * 100;
        const yPos = Math.random() * 100;
        const opacity = Math.random() * 0.6 + 0.2;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${xPos}%`;
        particle.style.top = `${yPos}%`;
        particle.style.opacity = opacity;

        particlesContainer.appendChild(particle);
    }


    // 2. KONTROLA MYSZY: INTERAKTYWNA PRZESTRZEŃ TŁA
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const xOffset = (clientX / window.innerWidth) - 0.5;
        const yOffset = (clientY / window.innerHeight) - 0.5;

        // Płynna manipulacja mgławicami i siatką cyfrową w osiach X/Y/Z
        gsap.to('.cyan-glow', { x: xOffset * 80, y: yOffset * 80, duration: 1.5, ease: 'power1.out' });
        gsap.to('.violet-glow', { x: -xOffset * 60, y: -yOffset * 60, duration: 1.5, ease: 'power1.out' });
        
        gsap.to('.digital-grid', { 
            rotateY: xOffset * 15, 
            rotateX: 65 + (yOffset * 10), 
            x: xOffset * -30,
            duration: 0.8, 
            ease: 'power2.out' 
        });

        // Lekka paralaksacja wygenerowanych gwiazd w tle
        gsap.to('.particle', {
            x: xOffset * 20,
            y: yOffset * 20,
            stagger: 0.002,
            duration: 1,
            ease: 'power1.out'
        });
    });


    // 3. SEKCJA HERO — ANIMACJA INTRO (Wygląd aplikacji React)
    gsap.from('.hero-content > *', {
        opacity: 0,
        y: 50,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power4.out'
    });


    // 4. SCROLLTRIGGER — SYSTEM KASKADOWEGO UJAWNIANIA KART
    gsap.from('.card-3d', {
        scrollTrigger: {
            trigger: '.services-grid',
            start: 'top 85%',
        },
        opacity: 0,
        y: 60,
        rotationX: -20,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power3.out'
    });


    // 5. INTERAKTYWNY EFEKT 3D PARALLAX TILT DLA KART
    const cards = document.querySelectorAll('.card-3d');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            // Obliczanie środka aktualnej karty
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top;  
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Kąt obrotu (maksymalnie ok 12 stopni)
            const rotateX = (centerY - y) / 12;
            const rotateY = (x - centerX) / 12;

            // Obroty głównego kontenera karty
            gsap.to(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                duration: 0.3,
                ease: 'power2.out'
            });

            // Efekt wielowarstwowej głębi (Parallax osi Z wewnątrz karty)
            const layers = card.querySelectorAll('.card-layer');
            layers.forEach(layer => {
                const depth = parseFloat(layer.getAttribute('data-depth')) || 0.2;
                const moveX = (x - centerX) * depth;
                const moveY = (y - centerY) * depth;

                gsap.to(layer, {
                    x: moveX * 0.4,
                    y: moveY * 0.4,
                    translateZ: depth * 120, // Dosłowne wysunięcie elementu do przodu na zewnątrz ekranu
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });

        // Resetowanie stanu karty po opuszczeniu kursora myszy
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.6,
                ease: 'power3.out'
            });

            const layers = card.querySelectorAll('.card-layer');
            layers.forEach(layer => {
                gsap.to(layer, {
                    x: 0,
                    y: 0,
                    translateZ: 0,
                    duration: 0.6,
                    ease: 'power3.out'
                });
            });
        });
    });
});
