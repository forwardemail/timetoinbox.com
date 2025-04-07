document.addEventListener('DOMContentLoaded', function() {
    initLazyLoading();
    addStructuredData();
    optimizeResourceLoading();
    enhanceAccessibility();
    trackOutboundLinks();
});

function initLazyLoading() {
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            }
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        if (lazyImages && lazyImages.length > 0) {
            for (const img of lazyImages) {
                img.classList.add('lazy');
                imageObserver.observe(img);
            }
        }
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        const lazyImages = document.querySelectorAll('img[data-src]');
        if (lazyImages && lazyImages.length > 0) {
            for (const img of lazyImages) {
                img.src = img.getAttribute('data-src');
            }
        }
    }
}

function addStructuredData() {
    const hostname = window.location.hostname;
    let structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'url': window.location.href,
        'name': document.title,
        'description': document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    };
    
    // Set specific structured data based on the site
    if (hostname.includes('alumniemail')) {
        structuredData = {
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Alumni Email Forwarding Service',
            'description': 'Professional email forwarding service for university alumni',
            'provider': {
                '@type': 'Organization',
                'name': 'Forward Email',
                'url': 'https://forwardemail.net'
            },
            'serviceType': 'Email Forwarding',
            'offers': {
                '@type': 'Offer',
                'price': '0',
                'priceCurrency': 'USD'
            }
        };
    } else if (hostname.includes('serverauditing')) {
        structuredData = {
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Server Auditing Service',
            'description': 'Comprehensive server auditing and monitoring solutions',
            'provider': {
                '@type': 'Organization',
                'name': 'Forward Email',
                'url': 'https://forwardemail.net'
            },
            'serviceType': 'Server Monitoring'
        };
    } else if (hostname.includes('sshmonitor')) {
        structuredData = {
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'SSH Monitoring Service',
            'description': 'Real-time SSH security monitoring and alerts',
            'provider': {
                '@type': 'Organization',
                'name': 'Forward Email',
                'url': 'https://forwardemail.net'
            },
            'serviceType': 'Security Monitoring'
        };
    } else if (hostname.includes('sslmonitor')) {
        structuredData = {
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'SSL Certificate Monitoring',
            'description': 'SSL certificate expiration monitoring and alerts',
            'provider': {
                '@type': 'Organization',
                'name': 'Forward Email',
                'url': 'https://forwardemail.net'
            },
            'serviceType': 'Certificate Monitoring'
        };
    } else if (hostname.includes('timetoinbox')) {
        structuredData = {
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Email Deliverability Metrics',
            'description': 'Time to Inbox (TTI) monitoring and email deliverability metrics',
            'provider': {
                '@type': 'Organization',
                'name': 'Forward Email',
                'url': 'https://forwardemail.net'
            },
            'serviceType': 'Email Deliverability'
        };
    }
    
    // Add the structured data to the page
    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.text = JSON.stringify(structuredData);
    document.head.appendChild(scriptTag);
}

function optimizeResourceLoading() {
    // Add defer attribute to scripts
    const scripts = document.querySelectorAll('script:not([type="application/ld+json"])');
    if (scripts && scripts.length > 0) {
        for (const script of scripts) {
            if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
                script.defer = true;
            }
        }
    }
    
    // Add preconnect for ForwardEmail
    const preconnectLink = document.createElement('link');
    preconnectLink.rel = 'preconnect';
    preconnectLink.href = 'https://forwardemail.net';
    document.head.appendChild(preconnectLink);
    
    // Add DNS prefetch for ForwardEmail
    const dnsPrefetchLink = document.createElement('link');
    dnsPrefetchLink.rel = 'dns-prefetch';
    dnsPrefetchLink.href = 'https://forwardemail.net';
    document.head.appendChild(dnsPrefetchLink);
}

function enhanceAccessibility() {
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Skip to content';
    skipLink.style.position = 'absolute';
    skipLink.style.top = '-40px';
    skipLink.style.left = '0';
    skipLink.style.padding = '8px';
    skipLink.style.zIndex = '100';
    skipLink.style.backgroundColor = '#fff';
    skipLink.style.transition = 'top 0.3s';
    
    skipLink.addEventListener('focus', function() {
        this.style.top = '0';
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    if (document.body) {
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // Add main-content ID if not present
    const firstSection = document.querySelector('section');
    if (firstSection && !document.getElementById('main-content')) {
        firstSection.id = 'main-content';
    }
    
    // Add tabindex to interactive elements
    const interactiveElements = document.querySelectorAll('a, button');
    if (interactiveElements && interactiveElements.length > 0) {
        for (const element of interactiveElements) {
            if (!element.getAttribute('tabindex') && element.style.display !== 'none') {
                element.setAttribute('tabindex', '0');
            }
        }
    }
    
    // Add aria-labels to icon links
    const iconLinks = document.querySelectorAll('a:not([aria-label])');
    if (iconLinks && iconLinks.length > 0) {
        for (const link of iconLinks) {
            if (link.textContent.trim() === '' && link.querySelector('img, svg, i')) {
                const href = link.getAttribute('href') || 'link';
                link.setAttribute('aria-label', `Link to ${href}`);
            }
        }
    }
}

function trackOutboundLinks() {
    // Track clicks on ForwardEmail links
    const forwardEmailLinks = document.querySelectorAll('a[href*="forwardemail.net"]');
    if (forwardEmailLinks && forwardEmailLinks.length > 0) {
        for (const link of forwardEmailLinks) {
            link.addEventListener('click', function(e) {
                this.setAttribute('data-tracked', 'true');
                console.log('Outbound link clicked: ' + this.href);
            });
        }
    }
}
