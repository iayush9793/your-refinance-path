// Google Sheets endpoint (Apps Script Web App URL)
// TODO: Replace this with your deployed Apps Script URL, e.g.
// 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec'
const GOOGLE_SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwebQY22IDA6xhSCP1d8VS6-4UqrvqPk6D-hKYSnT34ngeBoeATPHbYMPSOqgNTetw/exec';

async function submitToGoogleSheets(formName, payload) {
    if (!GOOGLE_SHEETS_ENDPOINT || GOOGLE_SHEETS_ENDPOINT.includes('YOUR_WEB_APP_ID_HERE')) {
        // Endpoint not configured yet; skip silently to avoid breaking UX.
        return;
    }

    try {
        await fetch(GOOGLE_SHEETS_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors', // allow write-only from browser
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                form: formName,
                timestamp: new Date().toISOString(),
                ...payload
            })
        });
    } catch (err) {
        // In production you might log this somewhere; for now we fail silently
        console.error('Error submitting to Google Sheets', err);
    }
}

// Form validation and submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('savingsForm');
    const zipCodeInput = document.getElementById('zipCode');
    const zipError = document.getElementById('zipError');
    const resultsModal = document.getElementById('resultsModal');
    const savingsSuccess = document.getElementById('savingsSuccess');
    const header = document.querySelector('.header');

    // Header scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ZIP code validation
    zipCodeInput.addEventListener('input', function() {
        const zipCode = this.value;
        const zipPattern = /^[0-9]{5}$/;
        
        if (zipCode && !zipPattern.test(zipCode)) {
            zipError.textContent = 'Please enter a valid 5-digit ZIP code';
            zipError.classList.add('show');
            this.style.borderColor = '#ef4444';
        } else {
            zipError.classList.remove('show');
            this.style.borderColor = '';
        }
    });

    // Form submission (Savings form)
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate ZIP code
        const zipCode = zipCodeInput.value;
        const zipPattern = /^[0-9]{5}$/;
        
        if (!zipPattern.test(zipCode)) {
            zipError.textContent = 'Please enter a valid 5-digit ZIP code';
            zipError.classList.add('show');
            zipCodeInput.style.borderColor = '#ef4444';
            zipCodeInput.focus();
            return;
        }

        // Get form values
        const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
        const currentRate = parseFloat(document.getElementById('currentRate').value) || 0;
        const creditScore = document.getElementById('creditScore').value;

        // Calculate savings (simplified calculation)
        const savings = calculateSavings(loanAmount, currentRate, creditScore);
        
        // Send data to Google Sheets (non-blocking)
        submitToGoogleSheets('savingsForm', {
            zipCode,
            loanAmount,
            currentRate,
            creditScore,
            estimatedMonthlySavings: savings.monthlySavings,
            estimatedAnnualSavings: savings.annualSavings,
            estimatedTotalSavings: savings.totalSavings
        });

        // Clear form fields
        form.reset();
        zipError.classList.remove('show');
        zipCodeInput.style.borderColor = '';

        // Optional: still compute results but show a simple inline summary instead of modal
        if (savingsSuccess) {
            savingsSuccess.textContent = `Thank you! Estimated monthly savings: ${formatCurrency(savings.monthlySavings)}.`;
        }
    });

    // We no longer use the savings modal; keep helpers noop to avoid errors
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            if (resultsModal) {
                resultsModal.classList.remove('show');
            }
        });
    }

    if (resultsModal) {
        resultsModal.addEventListener('click', function(e) {
            if (e.target === resultsModal) {
                resultsModal.classList.remove('show');
            }
        });
    }

    // Expose a global closeModal helper for inline onclick in HTML (safe no-op)
    window.closeModal = function() {
        if (resultsModal) {
            resultsModal.classList.remove('show');
        }
    };

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '#savingsForm') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Scroll to form when clicking "Calculate Your Savings Now"
    document.querySelectorAll('a[href="#savingsForm"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const formSection = document.querySelector('.hero-form');
            if (formSection) {
                formSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                // Focus on first input
                setTimeout(() => {
                    zipCodeInput.focus();
                }, 500);
            }
        });
    });

    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe benefit cards and steps
    document.querySelectorAll('.benefit-card, .step').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Observe team cards
    document.querySelectorAll('.team-card').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // Team Carousel
    initTeamCarousel();

    // Contact form -> Google Sheets submission
    const contactForm = document.querySelector('.contact-form');
    const contactSuccess = document.getElementById('contactSuccess');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const fullName = document.getElementById('contactName')?.value || '';
            const email = document.getElementById('contactEmail')?.value || '';
            const phone = document.getElementById('contactPhone')?.value || '';
            const zip = document.getElementById('contactZip')?.value || '';
            const message = document.getElementById('contactMsg')?.value || '';

            submitToGoogleSheets('contactForm', {
                fullName,
                email,
                phone,
                zip,
                message
            });

            // Simple UX feedback
            contactForm.reset();
            if (contactSuccess) {
                contactSuccess.textContent = 'Thank you! Your message has been sent.';
            }
        });
    }
});

// Team Carousel Functionality
function initTeamCarousel() {
    const carousel = document.getElementById('teamCarousel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!carousel) return;

    const cards = carousel.querySelectorAll('.team-card');
    const totalCards = cards.length;
    let currentIndex = 0;
    let cardsPerView = getCardsPerView();

    // Create dots
    function createDots() {
        dotsContainer.innerHTML = '';
        const totalDots = Math.ceil(totalCards / cardsPerView);
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    // Get cards per view based on screen size
    function getCardsPerView() {
        if (window.innerWidth <= 640) return 1;
        if (window.innerWidth <= 968) return 2;
        return 3;
    }

    // Update dots
    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        const activeDotIndex = Math.floor(currentIndex / cardsPerView);
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeDotIndex);
        });
    }

    // Scroll to specific index
    function scrollToIndex(index) {
        const cardWidth = cards[0].offsetWidth + 32; // card width + gap
        const scrollPosition = index * cardWidth * cardsPerView;
        carousel.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
        currentIndex = index;
        updateDots();
    }

    // Go to specific slide
    function goToSlide(slideIndex) {
        currentIndex = slideIndex * cardsPerView;
        scrollToIndex(currentIndex);
    }

    // Next slide
    function nextSlide() {
        const maxIndex = Math.ceil(totalCards / cardsPerView) - 1;
        const currentSlide = Math.floor(currentIndex / cardsPerView);
        if (currentSlide < maxIndex) {
            goToSlide(currentSlide + 1);
        } else {
            goToSlide(0);
        }
    }

    // Previous slide
    function prevSlide() {
        const currentSlide = Math.floor(currentIndex / cardsPerView);
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        } else {
            const maxIndex = Math.ceil(totalCards / cardsPerView) - 1;
            goToSlide(maxIndex);
        }
    }

    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Handle scroll to update dots
    let scrollTimeout;
    carousel.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollPosition = carousel.scrollLeft;
            const cardWidth = cards[0].offsetWidth + 32;
            currentIndex = Math.round(scrollPosition / cardWidth);
            updateDots();
        }, 100);
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            cardsPerView = getCardsPerView();
            createDots();
            scrollToIndex(0);
        }, 250);
    });

    // Auto-play carousel (optional)
    let autoPlayInterval;
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }

    // Start auto-play
    startAutoPlay();

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);

    // Initialize
    createDots();
    updateDots();
}

// Calculate potential savings
function calculateSavings(loanAmount, currentRate, creditScore) {
    // Simplified calculation - in real app, this would call an API
    // Assume new rate based on credit score
    let newRate = 2.5; // Base rate
    
    if (creditScore === 'excellent') {
        newRate = 2.3;
    } else if (creditScore === 'good') {
        newRate = 2.5;
    } else if (creditScore === 'fair') {
        newRate = 2.8;
    } else {
        newRate = 3.2;
    }

    // Calculate monthly payments
    const currentMonthly = calculateMonthlyPayment(loanAmount, currentRate, 30);
    const newMonthly = calculateMonthlyPayment(loanAmount, newRate, 30);
    
    const monthlySavings = currentMonthly - newMonthly;
    const annualSavings = monthlySavings * 12;
    const totalSavings = monthlySavings * 12 * 30; // 30 years

    return {
        monthlySavings: Math.max(0, monthlySavings),
        annualSavings: Math.max(0, annualSavings),
        totalSavings: Math.max(0, totalSavings),
        newRate: newRate
    };
}

// Calculate monthly mortgage payment
function calculateMonthlyPayment(principal, annualRate, years) {
    if (principal === 0 || annualRate === 0) return 0;
    
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;
    
    const monthlyPayment = principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return monthlyPayment;
}

// Display results in modal
function displayResults(savings) {
    document.getElementById('monthlySavings').textContent = 
        formatCurrency(savings.monthlySavings);
    document.getElementById('annualSavings').textContent = 
        formatCurrency(savings.annualSavings);
    document.getElementById('totalSavings').textContent = 
        formatCurrency(savings.totalSavings);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Close modal function (for inline onclick)
function closeModal() {
    document.getElementById('resultsModal').classList.remove('show');
}
