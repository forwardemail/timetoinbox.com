document.addEventListener('DOMContentLoaded', function() {
    initLazyLoading();
    setupSmoothScrolling();
    addStructuredData();
    setupMobileMenu();
    setupCitationTooltips();
    trackOutboundLinks();
});

function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy-load');
    if (!lazyImages || lazyImages.length === 0) return;
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset && img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            }
        });
        
        for (const img of lazyImages) {
            imageObserver.observe(img);
        }
    } else {
        // Fallback for browsers without IntersectionObserver
        for (const img of lazyImages) {
            if (img.dataset && img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }
        }
    }
}

function setupSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    if (!anchorLinks || anchorLinks.length === 0) return;
    
    for (const link of anchorLinks) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
}

function addStructuredData() {
    try {
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (!descriptionMeta) return;
        
        const description = descriptionMeta.getAttribute('content');
        const url = window.location.href;
        
        const titleElement = document.querySelector('title');
        if (!titleElement) return;
        
        const title = titleElement.innerText;
        
        const logoHeading = document.querySelector('.logo h1');
        if (!logoHeading) return;
        
        const organizationName = logoHeading.innerText;
        
        const scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        
        const structuredData = {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': title,
            'description': description,
            'url': url,
            'publisher': {
                '@type': 'Organization',
                'name': organizationName,
                'url': 'https://forwardemail.net'
            }
        };
        
        scriptTag.textContent = JSON.stringify(structuredData);
        document.head.appendChild(scriptTag);
    } catch (error) {
        console.error('Error adding structured data:', error);
    }
}

function setupMobileMenu() {
    const nav = document.querySelector('nav');
    const header = document.querySelector('header');
    
    if (!nav || !header) return;
    
    // Only create mobile menu toggle if it doesn't exist
    if (!document.querySelector('.mobile-menu-toggle')) {
        const container = header.querySelector('.container');
        if (!container) return;
        
        const mobileMenuToggle = document.createElement('button');
        mobileMenuToggle.className = 'mobile-menu-toggle';
        mobileMenuToggle.setAttribute('aria-label', 'Toggle navigation menu');
        mobileMenuToggle.innerHTML = '<span></span><span></span><span></span>';
        
        mobileMenuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.classList.toggle('active');
            
            const isExpanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !isExpanded);
        });
        
        container.appendChild(mobileMenuToggle);
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        if (!mobileMenuToggle) return;
        
        if (!nav.contains(e.target) && 
            !mobileMenuToggle.contains(e.target) && 
            nav.classList.contains('active')) {
            
            nav.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

function setupCitationTooltips() {
    const citationLinks = document.querySelectorAll('a[href^="#citation"]');
    if (!citationLinks || citationLinks.length === 0) return;
    
    for (const link of citationLinks) {
        link.addEventListener('mouseover', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId) return;
            
            const citationElement = document.getElementById(targetId.substring(1));
            if (!citationElement) return;
            
            const tooltip = document.createElement('div');
            tooltip.className = 'citation-tooltip';
            tooltip.textContent = citationElement.textContent;
            
            const linkRect = this.getBoundingClientRect();
            tooltip.style.top = `${linkRect.bottom + window.scrollY + 10}px`;
            tooltip.style.left = `${linkRect.left + window.scrollX}px`;
            
            document.body.appendChild(tooltip);
            
            this.addEventListener('mouseout', function() {
                if (document.body.contains(tooltip)) {
                    document.body.removeChild(tooltip);
                }
            }, { once: true });
        });
    }
}

function trackOutboundLinks() {
    const externalLinks = document.querySelectorAll('a[href^="http"]');
    if (!externalLinks || externalLinks.length === 0) return;
    
    for (const link of externalLinks) {
        if (link.hostname !== window.location.hostname) {
            link.addEventListener('click', function(e) {
                console.log('Outbound link clicked:', link.href);
            });
        }
    }
}
