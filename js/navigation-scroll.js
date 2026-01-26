// Navigation scroll behavior
let lastScrollTop = 0;
let scrollTimeout;

function handleScroll() {
    const navbar = document.querySelector('.top-navbar');
    if (!navbar) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Clear existing timeout
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down and past 100px - hide navbar
        navbar.classList.add('hidden');
    } else {
        // Scrolling up or near top - show navbar
        navbar.classList.remove('hidden');
    }
    
    // Update last scroll position
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    
    // Set timeout to show navbar when scrolling stops
    scrollTimeout = setTimeout(() => {
        if (scrollTop > 100) {
            navbar.classList.remove('hidden');
        }
    }, 1000);
}

// Initialize scroll behavior
document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also handle mouse movement near top
    document.addEventListener('mousemove', function(e) {
        const navbar = document.querySelector('.top-navbar');
        if (!navbar) return;
        
        if (e.clientY <= 100) {
            navbar.classList.remove('hidden');
        }
    });
});
