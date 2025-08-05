// Main Content Script - Coordinates all overlay components
// Converted from MainWindow.xaml.cs logic

class ChromeShortcutExtension {
    constructor() {
        this.elements = [];
        this.isOverlayVisible = false;
        this.preloadComplete = false;
        this.currentInput = '';
        
        // Removed complex caching - we always scan current viewport for accuracy
        
        // Component instances
        this.domScanner = window.DomScanner;
        this.overlayRenderer = window.OverlayRenderer;
        this.elementResolver = window.ElementResolver;
        this.inputManager = null; // Will be initialized after binding methods
        
        // Bind methods
        this.handleKeySequence = this.handleKeySequence.bind(this);
        this.clearOverlay = this.clearOverlay.bind(this);
        this.toggleOverlay = this.toggleOverlay.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    // Initialize the extension
    async initialize() {
        console.log('[ChromeShortcut] Extension initializing...');
        
        try {
            // Initialize input manager with bound callbacks
            this.inputManager = window.InputManager.getInstance(
                this.handleKeySequence,
                this.clearOverlay,
                this.toggleOverlay
            );

            // Set up scroll listener for hiding overlay (both custom and native)
            window.addEventListener('hideOverlay', this.handleScroll);
            window.addEventListener('scroll', this.handleScroll, { passive: true });
            document.addEventListener('scroll', this.handleScroll, { passive: true });
            
            // Set up click listener for hiding overlay and detecting new content
            document.addEventListener('click', this.handleClick, true);
            document.addEventListener('mousedown', this.handleClick, true);
            
            // No additional event listeners needed - fresh scan handles everything
            
            // Extension ready - no preloading needed
            console.log('[ChromeShortcut] Extension initialized - ready for overlay activation');
            this.preloadComplete = true;
            this.inputManager.startListening();
            console.log('[ChromeShortcut] Extension ready - Alt+Ctrl to activate');
            
        } catch (error) {
            console.error('[ChromeShortcut] Initialization failed:', error);
        }
    }

    // Handle key sequence input (equivalent to HandleKeySequence from C#)
    handleKeySequence(sequence) {
        if (!this.isOverlayVisible) {
            return;
        }

        if (sequence === 'ESCAPE') {
            this.clearOverlay();
            return;
        }

        // Use sequence directly (already built by InputManager)
        this.currentInput = sequence.toUpperCase();

        // Find matching elements
        const matches = this.elements.filter(element => 
            element.label.startsWith(this.currentInput)
        );

        // Exact match triggers click
        if (matches.length === 1 && matches[0].label === this.currentInput) {
            console.log(`[ChromeShortcut] Triggered click on ${matches[0].label}`);
            
            // Perform click
            const clickSuccessful = window.ClickSimulator.clickAt(
                Math.round(matches[0].position.x), 
                Math.round(matches[0].position.y)
            );
            
            // Reset and hide overlay
            this.currentInput = '';
            this.clearOverlay();
            
            // No cache to invalidate - we always scan fresh on next overlay
            return;
        }

        // No matches - clear input and hide overlay completely
        if (matches.length === 0) {
            console.log(`[ChromeShortcut] No match for ${this.currentInput}, clearing input and hiding overlay`);
            this.currentInput = '';
            this.clearOverlay(); // Use proper clear method to reset all state
            return;
        }

        // Filter labels to show only matching ones (progressive filtering)
        console.log(`[ChromeShortcut] ${matches.length} matches for ${this.currentInput}`);
        this.overlayRenderer.filterLabels(this.currentInput);
    }

    // Toggle overlay visibility (equivalent to ToggleOverlay from C#)
    async toggleOverlay() {
        console.log(`[ChromeShortcut] Alt+Ctrl pressed (overlay currently visible: ${this.isOverlayVisible})`);

        if (this.isOverlayVisible) {
            console.log('[ChromeShortcut] Hiding overlay...');
            this.overlayRenderer.hideAll();
            this.isOverlayVisible = false;
            this.inputManager.setSequenceListening(false);
            this.inputManager.clearSequence();
            console.log('[ChromeShortcut] Overlay hidden successfully');
            return;
        }

        // Block toggle until preload completes
        if (!this.preloadComplete) {
            console.log('[ChromeShortcut] Preload not finished - skipping overlay');
            return;
        }

        const startTime = performance.now();

        // Always do fresh scan of current viewport - fast and accurate
        console.log('[ChromeShortcut] Scanning current viewport for clickable elements...');
        await this.domScanner.scanCurrentViewport();
        this.elements = this.elementResolver.resolveElements();

        console.log(`[ChromeShortcut] Resolved ${this.elements.length} elements`);

        // Debug log elements (same as C#)
        this.elements.forEach(element => {
            console.log(`[ELEMENT] ${element.label} at ${element.position.x}, ${element.position.y}`);
        });

        // Render overlay
        this.overlayRenderer.renderLabels(this.elements);
        this.isOverlayVisible = true;
        
        console.log('[ChromeShortcut] About to call setSequenceListening(true)');
        try {
            this.inputManager.setSequenceListening(true);
            console.log('[ChromeShortcut] Successfully called setSequenceListening(true)');
        } catch (ex) {
            console.error(`[ChromeShortcut ERROR] Exception in setSequenceListening: ${ex.message}`);
        }

        // No scroll tracking needed - we always scan fresh

        const elapsed = Math.round(performance.now() - startTime);
        console.log(`[ChromeShortcut] Overlay appeared in ${elapsed} ms`);
    }

    // Removed complex scroll tracking - we always scan current viewport

    // Clear overlay (equivalent to ClearOverlay from C#)
    clearOverlay() {
        this.overlayRenderer.hideAll();
        this.isOverlayVisible = false;
        this.inputManager.setSequenceListening(false);
        this.currentInput = '';
        console.log('[ChromeShortcut] Overlay hidden and input reset');
    }

    // Handle scroll events (equivalent to scroll listener from C#)
    handleScroll() {
        if (this.isOverlayVisible) {
            console.log('[ChromeShortcut] Scroll detected - hiding overlay');
            this.clearOverlay();
        }
    }

    // Handle click events (equivalent to mouse event handlers from C#)
    handleClick(event) {
        if (this.isOverlayVisible) {
            console.log('[ChromeShortcut] Click detected - hiding overlay');
            this.clearOverlay();
            // Don't prevent default for clicks when overlay is visible
            // This allows normal page interaction
        }
    }

    // All caching and complex detection removed - we always scan fresh

    // Cleanup method
    destroy() {
        console.log('[ChromeShortcut] Extension destroying...');
        
        this.clearOverlay();
        
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        if (this.overlayRenderer) {
            this.overlayRenderer.destroy();
        }
        
        // Remove event listeners
        window.removeEventListener('hideOverlay', this.handleScroll);
        window.removeEventListener('scroll', this.handleScroll);
        document.removeEventListener('scroll', this.handleScroll);
        document.removeEventListener('click', this.handleClick, true);
        document.removeEventListener('mousedown', this.handleClick, true);
    }
}

// Initialize extension when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    // DOM already loaded
    initializeExtension();
}

async function initializeExtension() {
    // Wait a bit for page to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Skip initialization on Chrome internal pages
    if (window.location.href.startsWith('chrome://') || 
        window.location.href.startsWith('chrome-extension://') ||
        window.location.href.startsWith('devtools://')) {
        console.log('[ChromeShortcut] Skipping Chrome internal page');
        return;
    }
    
    console.log('[ChromeShortcut] Initializing on:', window.location.href);
    
    try {
        window.chromeOverlayExtension = new ChromeShortcutExtension();
        await window.chromeOverlayExtension.initialize();
    } catch (error) {
        console.error('[ChromeShortcut] Failed to initialize:', error);
    }
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.chromeOverlayExtension) {
        window.chromeOverlayExtension.destroy();
    }
});