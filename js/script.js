// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// FAQ Toggle Function
function toggleFaq(element) {
    const answer = element.querySelector('.faq-answer');
    const icon = element.querySelector('.faq-icon');
    const isActive = element.classList.contains('active');

    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.faq-answer').classList.remove('active');
        item.querySelector('.faq-icon').textContent = '+';
    });

    // Toggle current item if it wasn't active
    if (!isActive) {
        element.classList.add('active');
        answer.classList.add('active');
        icon.textContent = '×';
    }
}

// Navigation scroll effect
let lastScrollTop = 0;
window.addEventListener('scroll', function () {
    const nav = document.querySelector('nav');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 100) {
        nav.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        nav.style.background = 'rgba(0, 0, 0, 0.8)';
    }
});

// Add entrance animations
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Initialize animations
document.querySelectorAll('.meet-omar, .process, .faq, .contact').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(50px)';
    section.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    observer.observe(section);
});

function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}
document.querySelectorAll('.meet-omar, .projects-hero, .projects-grid, .process, .faq, .contact').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(50px)';
    section.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    observer.observe(section);
});

function downloadResume() {
    const link = document.createElement('a');
    link.href = 'assets/Omar_Abdulmajeed_Resume.pdf';
    link.download = 'Omar_Abdulmajeed_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
const cursor = document.querySelector(".cursor");

document.addEventListener("mousemove", (e) => {
    cursor.style.top = `${e.clientY}px`;
    cursor.style.left = `${e.clientX}px`;
});

document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("bg-video");
    const videoBg = document.getElementById("video-bg");

    // Define your small GIF fallback
    const gifFallback = "assets/wave-fallback.gif";

    // Define breakpoint for mobile/tablet
    const maxMobileWidth = 1024;

    // Function to use GIF fallback
    function useGifFallback() {
        if (video) video.remove(); // remove video element entirely
        videoBg.style.backgroundImage = `url('${gifFallback}')`;
        videoBg.style.backgroundSize = "cover";
        videoBg.style.backgroundPosition = "center";
    }

    // If device width is small, use GIF directly
    if (window.innerWidth <= maxMobileWidth) {
        useGifFallback();
        return;
    }

    // Try to autoplay the video; if fails (e.g. iPhone Safari), fallback to GIF
    if (video) {
        video.play().catch(() => {
            useGifFallback();
        });
    }
});
