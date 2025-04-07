// Fixed script.js with proper null checks to prevent querySelectorAll errors
document.addEventListener('DOMContentLoaded', function() {
  // Handle smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  if (anchorLinks && anchorLinks.length > 0) {
    anchorLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const targetElement = document.querySelector(href);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      });
    });
  }
  
  // Initialize all functionality
  window.addEventListener('scroll', handleActiveNavLinks);
  initializeAnimations();
  initializeComparisonChart();
  initializeDemoButton();
  initializeCounters();
});

// Handle active navigation links based on scroll position
function handleActiveNavLinks() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav ul li a');
  
  if (!sections || sections.length === 0 || !navLinks || navLinks.length === 0) {
    return;
  }
  
  let currentSection = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');
    
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
      currentSection = sectionId;
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + currentSection) {
      link.classList.add('active');
    }
  });
}

// Initialize animations for cards and elements
function initializeAnimations() {
  // Add scroll animation
  window.addEventListener('scroll', function() {
    const animatableElements = document.querySelectorAll('.benefit-card, .metric-card, .tti-metric-card, .factor-card, .step, .use-case');
    if (!animatableElements || animatableElements.length === 0) {
      return;
    }
    
    animatableElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const triggerPoint = window.innerHeight / 1.3;
      
      if (elementTop < triggerPoint) {
        element.classList.add('animate');
      }
    });
  });
  
  // Add hover effects
  const hoverElements = document.querySelectorAll('.benefit-card, .metric-card, .factor-card');
  if (hoverElements && hoverElements.length > 0) {
    hoverElements.forEach(element => {
      element.addEventListener('mouseenter', function() {
        this.classList.add('hover');
      });
      
      element.addEventListener('mouseleave', function() {
        this.classList.remove('hover');
      });
    });
  }
  
  // Add animation styles
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .animate {
      animation: fadeInUp 0.5s ease forwards;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
  `;
  document.head.appendChild(styleElement);
}

// Initialize the TTI comparison chart
function initializeComparisonChart() {
  const comparisonSection = document.querySelector('.comparison');
  if (!comparisonSection) {
    return;
  }
  
  // The chart is now handled by tti-chart.js
  // This function is kept for compatibility
}

// Initialize the demo button
function initializeDemoButton() {
  const forwardEmailSection = document.getElementById('forward-email');
  if (!forwardEmailSection) {
    return;
  }
  
  const container = forwardEmailSection.querySelector('.container');
  const note = forwardEmailSection.querySelector('.forward-email-note');
  
  if (!container) {
    return;
  }
  
  const demoButton = document.createElement('button');
  demoButton.className = 'demo-button';
  demoButton.textContent = 'Simulate Live TTI Test';
  
  if (note) {
    note.parentNode.insertBefore(demoButton, note);
  } else {
    container.appendChild(demoButton);
  }
  
  demoButton.style.display = 'block';
  demoButton.style.margin = '40px auto 20px';
  demoButton.style.padding = '12px 24px';
  demoButton.style.backgroundColor = 'var(--primary-color)';
  demoButton.style.color = 'white';
  demoButton.style.border = 'none';
  demoButton.style.borderRadius = '4px';
  demoButton.style.fontWeight = 'bold';
  demoButton.style.cursor = 'pointer';
  
  demoButton.addEventListener('click', showTTIDemo);
}

// Show the TTI demo modal
function showTTIDemo() {
  // Create overlay
  const overlay = document.createElement('div');
  const modalHeader = document.createElement('div');
  const closeButton = document.createElement('button');
  const statusText = document.createElement('p');
  
  // Provider data
  const providers = [
    { name: 'Forward Email', directTime: 1.3, forwardingTime: 1.3 },
    { name: 'Gmail', directTime: 0.744, forwardingTime: 1.7 },
    { name: 'Apple iCloud', directTime: 3.2, forwardingTime: 5.8 },
    { name: 'Yahoo/AOL', directTime: 4.5, forwardingTime: 6.2 },
    { name: 'Outlook.com', directTime: 2.8, forwardingTime: 4.3 }
  ];
  
  // Table elements
  const resultsTitle = document.createElement('h4');
  const tableHead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const columns = ['Provider', 'Direct TTI', 'Forwarding TTI'];
  const conclusion = document.createElement('div');
  
  // Style overlay
  overlay.className = 'tti-demo-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = overlay.style.left = '0';
  overlay.style.width = overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '1000';
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'tti-demo-modal';
  modal.style.backgroundColor = 'white';
  modal.style.borderRadius = '8px';
  modal.style.padding = '30px';
  modal.style.maxWidth = '600px';
  modal.style.width = '90%';
  modal.style.maxHeight = '80vh';
  modal.style.overflowY = 'auto';
  
  // Style header
  modalHeader.className = 'tti-demo-header';
  modalHeader.style.display = 'flex';
  modalHeader.style.justifyContent = 'space-between';
  modalHeader.style.alignItems = 'center';
  modalHeader.style.marginBottom = '20px';
  
  // Create title
  const title = document.createElement('h3');
  title.textContent = 'Live Time to Inbox Test';
  title.style.margin = '0';
  title.style.color = 'var(--secondary-color)';
  
  // Style close button
  closeButton.innerHTML = '&times;';
  closeButton.style.background = closeButton.style.border = 'none';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = 'var(--text-light)';
  
  // Add header elements
  modalHeader.appendChild(title);
  modalHeader.appendChild(closeButton);
  
  // Create content container
  const content = document.createElement('div');
  content.className = 'tti-demo-content';
  
  // Status text
  statusText.textContent = 'Simulating email delivery test to measure Time to Inbox (TTI) across different email service providers...';
  
  // Create progress section
  const progressSection = document.createElement('div');
  progressSection.className = 'test-progress';
  progressSection.style.marginTop = '20px';
  
  // Create progress bars for each provider
  for (const provider of providers) {
    const providerTest = document.createElement('div');
    const providerName = document.createElement('span');
    const progressBar = document.createElement('div');
    
    providerTest.className = 'provider-test';
    providerTest.style.marginBottom = '15px';
    
    const nameRow = document.createElement('div');
    nameRow.style.display = 'flex';
    nameRow.style.justifyContent = 'space-between';
    nameRow.style.marginBottom = '5px';
    
    providerName.textContent = provider.name;
    providerName.style.fontWeight = 'bold';
    
    const status = document.createElement('span');
    status.className = 'status';
    status.textContent = 'Pending...';
    status.style.color = 'var(--text-light)';
    
    nameRow.appendChild(providerName);
    nameRow.appendChild(status);
    
    progressBar.className = 'progress-bar';
    progressBar.style.height = '10px';
    progressBar.style.backgroundColor = '#eee';
    progressBar.style.borderRadius = '5px';
    progressBar.style.overflow = 'hidden';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = '0%';
    progressFill.style.height = '100%';
    progressFill.style.backgroundColor = 'var(--primary-color)';
    progressFill.style.transition = 'width 0.3s ease';
    
    progressBar.appendChild(progressFill);
    providerTest.appendChild(nameRow);
    providerTest.appendChild(progressBar);
    progressSection.appendChild(providerTest);
  }
  
  // Create results section
  const resultsSection = document.createElement('div');
  resultsSection.className = 'test-results';
  resultsSection.style.marginTop = '30px';
  resultsSection.style.display = 'none';
  
  resultsTitle.textContent = 'Test Results';
  resultsTitle.style.marginBottom = '15px';
  resultsTitle.style.color = 'var(--secondary-color)';
  
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  
  // Create table header
  for (const column of columns) {
    const th = document.createElement('th');
    th.textContent = column;
    th.style.padding = '10px';
    th.style.backgroundColor = 'var(--light-color)';
    th.style.textAlign = 'left';
    headerRow.appendChild(th);
  }
  
  tableHead.appendChild(headerRow);
  table.appendChild(tableHead);
  
  // Create table body
  const tableBody = document.createElement('tbody');
  
  for (const provider of providers) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const forwardingCell = document.createElement('td');
    
    nameCell.textContent = provider.name;
    
    const directCell = document.createElement('td');
    directCell.textContent = provider.directTime + 's';
    forwardingCell.textContent = provider.forwardingTime + 's';
    
    // Highlight Forward Email row
    if (provider.name === 'Forward Email') {
      row.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
      row.style.fontWeight = 'bold';
    }
    
    // Style cells
    for (const cell of [nameCell, directCell, forwardingCell]) {
      cell.style.padding = '10px';
      cell.style.borderBottom = '1px solid #eee';
    }
    
    row.appendChild(nameCell);
    row.appendChild(directCell);
    row.appendChild(forwardingCell);
    tableBody.appendChild(row);
  }
  
  table.appendChild(tableBody);
  resultsSection.appendChild(resultsTitle);
  resultsSection.appendChild(table);
  
  // Create conclusion section
  conclusion.className = 'test-conclusion';
  conclusion.style.marginTop = '20px';
  conclusion.style.padding = '15px';
  conclusion.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
  conclusion.style.borderRadius = '4px';
  conclusion.style.display = 'none';
  
  const conclusionText = document.createElement('p');
  conclusionText.innerHTML = '<strong>Conclusion:</strong> Forward Email consistently delivers the fastest and most reliable Time to Inbox performance, especially for email forwarding scenarios. This ensures your emails reach recipients quickly and reliably.';
  conclusionText.style.margin = '0';
  conclusion.appendChild(conclusionText);
  
  // Assemble content
  content.appendChild(statusText);
  content.appendChild(progressSection);
  content.appendChild(resultsSection);
  content.appendChild(conclusion);
  
  // Assemble modal
  modal.appendChild(modalHeader);
  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Add close button functionality
  closeButton.addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  
  // Start the animation
  runTestAnimation(progressSection, resultsSection, conclusion);
}

// Run the test animation
function runTestAnimation(progressSection, resultsSection, conclusion) {
  const providerTests = progressSection.querySelectorAll('.provider-test');
  if (!providerTests || providerTests.length === 0) {
    return;
  }
  
  let currentProvider = 0;
  
  function animateNextProvider() {
    if (currentProvider >= providerTests.length) {
      // All providers completed, show results
      setTimeout(() => {
        if (resultsSection) resultsSection.style.display = 'block';
        if (conclusion) conclusion.style.display = 'block';
      }, 500);
      return;
    }
    
    const providerTest = providerTests[currentProvider];
    if (!providerTest) {
      currentProvider++;
      setTimeout(animateNextProvider, 300);
      return;
    }
    
    const statusElement = providerTest.querySelector('.status');
    const progressFill = providerTest.querySelector('.progress-fill');
    
    if (!statusElement || !progressFill) {
      currentProvider++;
      setTimeout(animateNextProvider, 300);
      return;
    }
    
    // Update status
    statusElement.textContent = 'Testing...';
    statusElement.style.color = 'var(--accent-color)';
    
    // Animate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      progressFill.style.width = `${progress}%`;
      
      if (progress >= 100) {
        clearInterval(interval);
        statusElement.textContent = 'Complete';
        statusElement.style.color = 'var(--primary-color)';
        currentProvider++;
        setTimeout(animateNextProvider, 300);
      }
    }, 20);
  }
  
  // Start the animation after a short delay
  setTimeout(animateNextProvider, 500);
}

// Initialize counters for TTI values
function initializeCounters() {
  const ttiValues = document.querySelectorAll('.tti-value .value');
  if (!ttiValues || ttiValues.length === 0) {
    return;
  }
  
  ttiValues.forEach(valueElement => {
    try {
      const finalValue = parseFloat(valueElement.textContent);
      const originalText = valueElement.textContent;
      const duration = 30; // Animation duration in frames
      const totalDuration = 1500; // Total animation time in ms
      const framesPerSecond = totalDuration / duration;
      const increment = finalValue / duration;
      
      // Reset and start counter
      let currentValue = 0;
      valueElement.textContent = '0s';
      
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        currentValue += increment;
        
        if (currentValue >= finalValue || frame >= duration) {
          clearInterval(interval);
          valueElement.textContent = originalText;
        } else {
          valueElement.textContent = currentValue.toFixed(1) + 's';
        }
      }, framesPerSecond);
    } catch (error) {
      console.error('Error initializing counter:', error);
    }
  });
}
