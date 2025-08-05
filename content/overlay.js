// OverlayRenderer - Renders overlay labels on the page
// Converted from OverlayRenderer.cs - replaces WPF Canvas with DOM elements

class OverlayRenderer {
    constructor() {
        this.overlayContainer = null;
        this.labels = [];
        this.isVisible = false;
    }

    static instance = null;
    
    static getInstance() {
        if (!OverlayRenderer.instance) {
            OverlayRenderer.instance = new OverlayRenderer();
        }
        return OverlayRenderer.instance;
    }

    // Initialize overlay container (equivalent to WPF Canvas)
    initializeOverlay() {
        if (this.overlayContainer) {
            return; // Already initialized
        }

        // Create main overlay container
        this.overlayContainer = document.createElement('div');
        this.overlayContainer.id = 'chrome-overlay-container';
        this.overlayContainer.className = 'chrome-overlay-container';
        
        // Style container to match WPF transparent window behavior
        this.overlayContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 999999;
            font-family: Arial, sans-serif;
        `;

        document.body.appendChild(this.overlayContainer);
    }

    // Equivalent to RenderLabels method from C#
    renderLabels(elements) {
        
        this.initializeOverlay();
        this.clearLabels();

        elements.forEach(element => {
            const label = this.createLabel(element.label, element.position);
            this.overlayContainer.appendChild(label);
            this.labels.push(label);
        });

        this.isVisible = true;
        this.overlayContainer.style.display = 'block';
    }

    // Create individual label element (equivalent to WPF Label)
    createLabel(labelText, position) {
        const label = document.createElement('div');
        label.className = 'chrome-overlay-label';
        label.textContent = labelText;
        label.setAttribute('data-label', labelText);

        // Style to match WPF label appearance
        label.style.cssText = `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            padding: 4px 8px;
            font-size: 16px;
            font-weight: bold;
            border: 1px solid #000000;
            border-radius: 3px;
            pointer-events: none;
            z-index: 1000000;
            font-family: Arial, sans-serif;
            line-height: 1;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;

        return label;
    }

    // Equivalent to FilterLabels method from C# - progressive filtering
    filterLabels(prefix) {
        
        let visibleCount = 0;
        this.labels.forEach(label => {
            const labelText = label.getAttribute('data-label');
            const shouldShow = labelText.toUpperCase().startsWith(prefix.toUpperCase());
            
            if (shouldShow) {
                label.style.display = 'block';
                label.style.opacity = '1';
                visibleCount++;
            } else {
                label.style.display = 'none';
                label.style.opacity = '0';
            }
        });
        
        return visibleCount;
    }

    // Show only specific matching labels (used for sequence matching)
    showMatchingLabels(matchingElements) {
        
        // Hide all labels first
        this.labels.forEach(label => {
            label.style.display = 'none';
        });

        // Show only matching ones
        matchingElements.forEach(element => {
            const matchingLabel = this.labels.find(label => 
                label.getAttribute('data-label') === element.label
            );
            if (matchingLabel) {
                matchingLabel.style.display = 'block';
            }
        });
    }

    // Equivalent to HideAll method from C#
    hideAll() {
        
        if (this.overlayContainer) {
            this.overlayContainer.style.display = 'none';
        }
        
        this.clearLabels();
        this.isVisible = false;
    }

    // Clear all label elements
    clearLabels() {
        this.labels.forEach(label => {
            if (label.parentNode) {
                label.parentNode.removeChild(label);
            }
        });
        this.labels = [];
    }

    // Check if overlay is currently visible
    getIsVisible() {
        return this.isVisible;
    }

    // Destroy overlay (cleanup)
    destroy() {
        this.hideAll();
        if (this.overlayContainer && this.overlayContainer.parentNode) {
            this.overlayContainer.parentNode.removeChild(this.overlayContainer);
            this.overlayContainer = null;
        }
    }

    // Handle page scroll to reposition labels if needed
    handleScroll() {
        if (this.isVisible) {
            // Labels are positioned fixed, so they stay in place during scroll
            // If we need to hide on scroll (like the C# version), we can do:
            // this.hideAll();
        }
    }
}

// Export singleton instance
window.OverlayRenderer = OverlayRenderer.getInstance();