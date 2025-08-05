// Fresh Content Script - Simple, no caching, always scan current viewport

class ChromeShortcutOverlay {
    constructor() {
        this.elements = [];
        this.isOverlayVisible = false;
        this.preloadComplete = false;
        this.currentInput = '';
        this.settings = null;
        
        // Component instances
        this.domScanner = window.DomScanner;
        this.overlayRenderer = window.OverlayRenderer;
        this.elementResolver = window.ElementResolver;
        this.inputManager = null;
        
        // Bind methods
        this.handleKeySequence = this.handleKeySequence.bind(this);
        this.clearOverlay = this.clearOverlay.bind(this);
        this.toggleOverlay = this.toggleOverlay.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    // Initialize the extension
    async initialize() {
        console.log('[ChromeShortcut] Fresh extension initializing...');
        
        try {
            // Load user settings
            await this.loadSettings();
            // Initialize input manager
            this.inputManager = window.InputManager.getInstance(
                this.handleKeySequence,
                this.clearOverlay,
                this.toggleOverlay
            );

            // Set up scroll listener for hiding overlay only
            window.addEventListener('scroll', this.handleScroll, { passive: true });
            document.addEventListener('scroll', this.handleScroll, { passive: true });
            
            // Set up click listener for hiding overlay only
            document.addEventListener('click', this.handleClick, true);
            document.addEventListener('mousedown', this.handleClick, true);
            
            // Extension ready immediately - no preloading
            console.log(`[ChromeShortcut] Fresh extension ready - ${this.getShortcutDisplay()} to activate`);
            this.preloadComplete = true;
            this.inputManager.startListening();
            
        } catch (error) {
            console.error('[ChromeShortcut] Initialization failed:', error);
        }
    }

    // Handle key sequence input
    handleKeySequence(sequence) {
        if (!this.isOverlayVisible) return;

        if (sequence === 'ESCAPE') {
            this.clearOverlay();
            return;
        }

        this.currentInput = sequence.toUpperCase();
        const matches = this.elements.filter(element => 
            element.label.startsWith(this.currentInput)
        );

        // Exact match triggers click
        if (matches.length === 1 && matches[0].label === this.currentInput) {
            console.log(`[ChromeShortcut] Triggered click on ${matches[0].label}`);
            
            window.ClickSimulator.clickAt(
                Math.round(matches[0].position.x), 
                Math.round(matches[0].position.y)
            );
            
            this.currentInput = '';
            this.clearOverlay();
            return;
        }

        // No matches - clear and hide
        if (matches.length === 0) {
            console.log(`[ChromeShortcut] No match for ${this.currentInput}`);
            this.currentInput = '';
            this.clearOverlay();
            return;
        }

        // Filter labels to show only matching ones
        console.log(`[ChromeShortcut] ${matches.length} matches for ${this.currentInput}`);
        this.overlayRenderer.filterLabels(this.currentInput);
    }

    // Toggle overlay - ALWAYS scans fresh
    async toggleOverlay() {
        console.log(`[ChromeShortcut] Alt+Ctrl pressed (overlay visible: ${this.isOverlayVisible})`);

        if (this.isOverlayVisible) {
            console.log('[ChromeShortcut] Hiding overlay...');
            this.clearOverlay();
            return;
        }

        if (!this.preloadComplete) {
            console.log('[ChromeShortcut] Extension not ready');
            return;
        }

        const startTime = performance.now();

        // ALWAYS scan current viewport - no caching whatsoever
        console.log('[ChromeShortcut] Scanning current viewport...');
        await this.domScanner.scanCurrentViewport();
        this.elements = this.elementResolver.resolveElements();

        console.log(`[ChromeShortcut] Found ${this.elements.length} elements`);

        // Render overlay
        this.overlayRenderer.renderLabels(this.elements);
        this.isOverlayVisible = true;
        this.inputManager.setSequenceListening(true);

        const elapsed = Math.round(performance.now() - startTime);
        console.log(`[ChromeShortcut] Overlay appeared in ${elapsed} ms`);
    }

    // Clear overlay
    clearOverlay() {
        this.overlayRenderer.hideAll();
        this.isOverlayVisible = false;
        this.inputManager.setSequenceListening(false);
        this.currentInput = '';
        console.log('[ChromeShortcut] Overlay cleared');
    }

    // Handle scroll - hide overlay
    handleScroll() {
        if (this.isOverlayVisible) {
            console.log('[ChromeShortcut] Scroll detected - hiding overlay');
            this.clearOverlay();
        }
    }

    // Handle click - hide overlay
    handleClick(event) {
        if (this.isOverlayVisible) {
            console.log('[ChromeShortcut] Click detected - hiding overlay');
            this.clearOverlay();
        }
    }

    // Cleanup
    destroy() {
        console.log('[ChromeShortcut] Extension destroying...');
        this.clearOverlay();
        
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        if (this.overlayRenderer) {
            this.overlayRenderer.destroy();
        }
        
        window.removeEventListener('scroll', this.handleScroll);
        document.removeEventListener('scroll', this.handleScroll);
        document.removeEventListener('click', this.handleClick, true);
        document.removeEventListener('mousedown', this.handleClick, true);
    }

    // Load user settings
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get('overlaySettings');
            this.settings = result.overlaySettings || {
                fontSize: 14,
                boxSize: 32,
                shortcutKeys: ['Alt', 'Control']
            };
            
            console.log('[ChromeShortcut] Settings loaded:', this.settings);
            
            // Apply CSS settings
            this.applyCSSSettings();
            
            // Configure input manager with custom shortcut
            if (this.inputManager) {
                this.inputManager.updateShortcutKeys(this.settings.shortcutKeys);
            }
            
        } catch (error) {
            console.error('[ChromeShortcut] Failed to load settings:', error);
            // Use default settings
            this.settings = {
                fontSize: 14,
                boxSize: 32,
                shortcutKeys: ['Alt', 'Control']
            };
        }
    }

    // Apply CSS settings to overlay
    applyCSSSettings() {
        let style = document.getElementById('chrome-overlay-custom-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'chrome-overlay-custom-styles';
            document.head.appendChild(style);
        }
        
        const { fontSize, boxSize } = this.settings;
        const padding = Math.max(4, Math.floor(boxSize * 0.15));
        
        style.textContent = `
            .chrome-overlay-label {
                font-size: ${fontSize}px !important;
                min-width: ${boxSize}px !important;
                min-height: ${boxSize}px !important;
                padding: ${padding}px !important;
                line-height: ${boxSize - (padding * 2)}px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
        `;
        
        console.log(`[ChromeShortcut] Applied custom styles: font ${fontSize}px, box ${boxSize}px`);
    }

    // Get shortcut display string
    getShortcutDisplay() {
        if (!this.settings) return 'Alt+Ctrl';
        
        return this.settings.shortcutKeys.map(key => {
            switch (key) {
                case 'Control': return 'Ctrl';
                case 'Alt': return 'Alt';
                case 'Shift': return 'Shift';
                case 'Meta': return navigator.platform.includes('Mac') ? 'Cmd' : 'Win';
                default: return key;
            }
        }).join('+');
    }

    // Handle settings updates from options page
    handleSettingsUpdate(newSettings) {
        this.settings = newSettings;
        console.log('[ChromeShortcut] Settings updated:', newSettings);
        
        // Apply new CSS settings
        this.applyCSSSettings();
        
        // Update input manager shortcut
        if (this.inputManager) {
            this.inputManager.updateShortcutKeys(newSettings.shortcutKeys);
        }
    }
}

// Initialize extension when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

async function initializeExtension() {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Skip Chrome internal pages
    if (window.location.href.startsWith('chrome://') || 
        window.location.href.startsWith('chrome-extension://') ||
        window.location.href.startsWith('devtools://')) {
        console.log('[ChromeShortcut] Skipping Chrome internal page');
        return;
    }
    
    console.log('[ChromeShortcut] Initializing fresh on:', window.location.href);
    
    try {
        window.chromeOverlayExtension = new ChromeShortcutOverlay();
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

// Handle messages from extension (popup, background script)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[ChromeShortcut] Message received:', message);
    
    if (message.type === 'settings-updated' && window.chromeOverlayExtension) {
        window.chromeOverlayExtension.handleSettingsUpdate(message.settings);
        sendResponse({ success: true });
    }
    
    if (message.type === 'toggle-overlay' && window.chromeOverlayExtension) {
        window.chromeOverlayExtension.toggleOverlay();
        sendResponse({ success: true });
    }
    
    return true; // Keep message channel open for async response
});