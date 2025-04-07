// Shiki renderer for light mode only
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Shiki highlighting once the DOM is loaded
    initializeShikiHighlighting();

    function initializeShikiHighlighting() {
        // Always use light theme
        const theme = 'github-light';

        // Find all code blocks that need highlighting
        const codeBlocks = document.querySelectorAll('pre > code');
        if (!codeBlocks || codeBlocks.length === 0) return;

        // Load Shiki if not already loaded
        if (typeof window.shiki === 'undefined') {
            loadShikiLibrary(function() {
                highlightAllCodeBlocks(theme, codeBlocks);
            });
        } else {
            highlightAllCodeBlocks(theme, codeBlocks);
        }
    }

    function loadShikiLibrary(callback) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/shiki@0.14.3/dist/index.unpkg.iife.js';
        script.async = true;

        script.onload = function() {
            if (typeof window.shiki !== 'undefined') {
                callback();
            } else {
                console.warn('Shiki loaded but global object not available');
                applyBasicStyling();
            }
        };

        script.onerror = function() {
            console.error('Failed to load Shiki library');
            applyBasicStyling();
        };

        document.head.appendChild(script);
    }

    function highlightAllCodeBlocks(theme, codeBlocks) {
        // Initialize the highlighter
        window.shiki.getHighlighter({
            theme: theme,
            langs: ['bash', 'javascript', 'html', 'css', 'json', 'python']
        }).then(highlighter => {
            // Process each code block
            for (const codeBlock of codeBlocks) {
                try {
                    const codeContent = codeBlock.textContent;

                    // Determine language from class or data attribute
                    let language = 'bash'; // Default language

                    if (codeBlock.hasAttribute('data-language')) {
                        language = codeBlock.getAttribute('data-language');
                    } else {
                        const classes = codeBlock.className.split(' ');
                        for (const cls of classes) {
                            if (cls.startsWith('language-')) {
                                language = cls.replace('language-', '');
                                break;
                            }
                        }
                    }

                    // Store original code and language
                    codeBlock.setAttribute('data-original-code', codeContent);
                    codeBlock.setAttribute('data-language', language);

                    // Highlight the code
                    const highlightedCode = highlighter.codeToHtml(codeContent, { lang: language });

                    // Update the DOM
                    const preElement = codeBlock.closest('pre');
                    if (preElement) {
                        preElement.innerHTML = highlightedCode.replace(/<pre.*?>([\s\S]*)<\/pre>/, '$1');

                        // Add copy button
                        addCopyButton(preElement, codeContent);
                    }
                } catch (error) {
                    console.error('Error highlighting code:', error);
                }
            }
        }).catch(error => {
            console.error('Failed to initialize Shiki highlighter:', error);
            applyBasicStyling();
        });
    }

    function addCopyButton(container, code) {
        // Check if copy button already exists
        if (container.querySelector('.copy-button')) {
            return;
        }

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

        // Add copy functionality
        copyButton.onclick = function() {
            navigator.clipboard.writeText(code).then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code:', err);
            });
        };

        // Make container position relative for absolute positioning of button
        container.style.position = 'relative';

        // Add button to container
        container.appendChild(copyButton);
    }

    function applyBasicStyling() {
        // Apply basic styling to code blocks if Shiki fails
        const codeBlocks = document.querySelectorAll('pre > code');
        codeBlocks.forEach(block => {
            if (!block.classList.contains('styled')) {
                block.style.display = 'block';
                block.style.padding = '1em';
                block.style.overflow = 'auto';
                block.style.backgroundColor = '#f6f8fa';
                block.style.borderRadius = '6px';
                block.style.fontFamily = 'monospace';
                block.style.fontSize = '14px';
                block.style.lineHeight = '1.5';
                block.classList.add('styled');
            }
        });
    }
});
