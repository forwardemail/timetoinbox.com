// Shiki code highlighting implementation
document.addEventListener('DOMContentLoaded', function() {
  // Load Shiki from CDN following official documentation
  const shikiScript = document.createElement('script');
  shikiScript.src = 'https://cdn.jsdelivr.net/npm/shiki@0.14.3/dist/index.unpkg.iife.js';

  shikiScript.onload = function() {
    // Initialize Shiki once loaded
    if (typeof window.shiki !== 'undefined') {
      initializeShiki();
    } else {
      console.error('Shiki loaded but global object not available');
      applyBasicStyling();
    }
  };

  shikiScript.onerror = function() {
    console.error('Failed to load Shiki from CDN');
    applyBasicStyling();
  };

  // Add script to document
  document.head.appendChild(shikiScript);

  function initializeShiki() {
    // Use github-light theme as specified
    window.shiki.getHighlighter({
      theme: 'github-light',
      langs: ['bash', 'javascript', 'html', 'css', 'json', 'python', 'typescript']
    }).then(highlighter => {
      // Find all code blocks
      const codeBlocks = document.querySelectorAll('pre code');

      if (!codeBlocks || codeBlocks.length === 0) {
        console.log('No code blocks found on page');
        return;
      }

      console.log(`Found ${codeBlocks.length} code blocks to highlight`);

      // Process each code block
      codeBlocks.forEach((codeBlock, index) => {
        try {
          // Get code content and determine language
          const code = codeBlock.textContent || '';

          // Try to determine language from class (e.g., language-javascript)
          let lang = 'text';
          const classMatch = codeBlock.className.match(/language-(\w+)/);
          if (classMatch && classMatch[1]) {
            lang = classMatch[1];
          }

          // Also check for data-language attribute
          const dataLang = codeBlock.getAttribute('data-language') || codeBlock.parentElement.getAttribute('data-language');
          if (dataLang) {
            lang = dataLang;
          }

          // Map some common language aliases
          const langMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'sh': 'bash',
            'shell': 'bash',
            'bash': 'bash',
            'html': 'html',
            'css': 'css',
            'json': 'json'
          };

          const normalizedLang = langMap[lang.toLowerCase()] || lang;

          // Highlight the code
          const html = highlighter.codeToHtml(code, { lang: normalizedLang });

          // Replace the parent pre element's content
          const preElement = codeBlock.parentElement;
          if (preElement && preElement.tagName === 'PRE') {
            // Extract the highlighted code from the full HTML
            const highlightedCode = html.replace(/<pre[^>]*>([\s\S]*)<\/pre>/i, '$1');

            // Create a wrapper to hold the highlighted code
            const wrapper = document.createElement('div');
            wrapper.innerHTML = highlightedCode;

            // Replace the content of the pre element
            preElement.innerHTML = '';
            preElement.appendChild(wrapper);

            // Add a copy button
            addCopyButton(preElement, code);

            // Add a language indicator
            addLanguageIndicator(preElement, normalizedLang);

            console.log(`Highlighted code block ${index+1} (${normalizedLang})`);
          }
        } catch (error) {
          console.error('Error highlighting code block:', error);
          // Apply basic styling as fallback
          applyBasicStylingToBlock(codeBlock);
        }
      });
    }).catch(error => {
      console.error('Error initializing Shiki highlighter:', error);
      applyBasicStyling();
    });
  }

  function addCopyButton(container, code) {
    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.style.position = 'absolute';
    copyButton.style.top = '5px';
    copyButton.style.right = '5px';
    copyButton.style.padding = '3px 8px';
    copyButton.style.fontSize = '12px';
    copyButton.style.background = '#f0f0f0';
    copyButton.style.border = '1px solid #ddd';
    copyButton.style.borderRadius = '3px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.zIndex = '10';

    // Add copy functionality
    copyButton.addEventListener('click', function() {
      navigator.clipboard.writeText(code).then(() => {
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy code:', err);
      });
    });

    // Make container position relative for absolute positioning of button
    container.style.position = 'relative';

    // Add button to container
    container.appendChild(copyButton);
  }

  function addLanguageIndicator(container, lang) {
    // Create language indicator
    const langIndicator = document.createElement('div');
    langIndicator.className = 'language-indicator';
    langIndicator.textContent = lang;
    langIndicator.style.position = 'absolute';
    langIndicator.style.top = '5px';
    langIndicator.style.left = '5px';
    langIndicator.style.padding = '2px 6px';
    langIndicator.style.fontSize = '11px';
    langIndicator.style.background = '#e6e6e6';
    langIndicator.style.border = '1px solid #ddd';
    langIndicator.style.borderRadius = '3px';
    langIndicator.style.color = '#666';
    langIndicator.style.zIndex = '10';

    // Add indicator to container
    container.appendChild(langIndicator);
  }

  function applyBasicStyling() {
    // Apply basic styling to all code blocks as fallback
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
      applyBasicStylingToBlock(block);
    });
  }

  function applyBasicStylingToBlock(block) {
    // Only apply styling if not already styled
    if (!block.classList.contains('styled')) {
      const preElement = block.parentElement;
      if (preElement && preElement.tagName === 'PRE') {
        preElement.style.display = 'block';
        preElement.style.padding = '1em';
        preElement.style.overflow = 'auto';
        preElement.style.backgroundColor = '#f6f8fa';
        preElement.style.borderRadius = '6px';
        preElement.style.border = '1px solid #e1e4e8';
        preElement.style.margin = '1em 0';
      }

      block.style.fontFamily = 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace';
      block.style.fontSize = '14px';
      block.style.lineHeight = '1.5';
      block.style.color = '#24292e';
      block.classList.add('styled');
    }
  }
});
