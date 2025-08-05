// Simple Content Script - Chrome Commands Only
// No manual keyboard detection - only responds to Chrome command shortcuts

class ChromeShortcutOverlay {
    constructor() {
        this.elements = [];
        this.isOverlayVisible = false;
        this.currentInput = '';
        this.settings = { fontSize: 14, boxSize: 24, shortcutKeys: ['Control', 'Alt'], boxColor: '#FFFF00' };
        
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
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleWindowFocus = this.handleWindowFocus.bind(this);
    }

    // Initialize the extension
    async initialize() {
        
        try {
            // Load user settings
            await this.loadSettings();
            
            // Initialize input manager with custom shortcuts
            this.inputManager = window.InputManager.getInstance(
                this.handleKeySequence,
                this.clearOverlay,
                this.toggleOverlay
            );
            
            // Configure input manager with stored shortcut
            this.inputManager.updateShortcutKeys(this.settings.shortcutKeys);
            
            // Set up scroll listener for hiding overlay - catch ALL scroll events
            window.addEventListener('scroll', this.handleScroll, { passive: true, capture: true });
            document.addEventListener('scroll', this.handleScroll, { passive: true, capture: true });
            
            // Also listen for wheel events (mouse wheel) to catch programmatic scrolling
            window.addEventListener('wheel', this.handleScroll, { passive: true, capture: true });
            document.addEventListener('wheel', this.handleScroll, { passive: true, capture: true });
            
            // Set up click listener for hiding overlay only
            document.addEventListener('click', this.handleClick, true);
            document.addEventListener('mousedown', this.handleClick, true);
            
            // Set up tab/window focus listeners
            document.addEventListener('visibilitychange', this.handleVisibilityChange);
            window.addEventListener('blur', this.handleWindowFocus);
            window.addEventListener('focus', this.handleWindowFocus);
            
            // Start listening for shortcuts
            this.inputManager.startListening();
            
        } catch (error) {
            console.error('[ChromeShortcut] Initialization failed:', error);
        }
    }


    // Handle key sequence input
    handleKeySequence(sequence) {
        if (!this.isOverlayVisible) return;

        this.currentInput = sequence.toUpperCase();
        const matches = this.elements.filter(element => 
            element.label.startsWith(this.currentInput)
        );

        // Exact match triggers click
        if (matches.length === 1 && matches[0].label === this.currentInput) {
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
            this.currentInput = '';
            this.clearOverlay();
            return;
        }

        // Filter labels to show only matching ones
        this.overlayRenderer.filterLabels(this.currentInput);
    }

    // Toggle overlay - called from Chrome command
    async toggleOverlay() {
        if (this.isOverlayVisible) {
            this.clearOverlay();
            return;
        }

        // ALWAYS scan current viewport - no caching
        await this.domScanner.scanCurrentViewport();
        this.elements = this.elementResolver.resolveElements();

        // Render overlay
        this.overlayRenderer.renderLabels(this.elements);
        this.isOverlayVisible = true;
        this.currentInput = '';
        
        // Enable sequence listening for letter navigation
        this.inputManager.setSequenceListening(true);
    }

    // Clear overlay
    clearOverlay() {
        this.overlayRenderer.hideAll();
        this.isOverlayVisible = false;
        this.currentInput = '';
        
        // Disable sequence listening
        this.inputManager.setSequenceListening(false);
    }

    // Handle scroll - hide overlay
    handleScroll() {
        if (this.isOverlayVisible) {
            this.clearOverlay();
        }
    }

    // Handle click - hide overlay
    handleClick(event) {
        if (this.isOverlayVisible) {
            this.clearOverlay();
        }
    }

    // Handle tab visibility change - hide overlay when tab becomes hidden
    handleVisibilityChange() {
        if (document.hidden && this.isOverlayVisible) {
            this.clearOverlay();
        }
    }

    // Handle window focus changes - hide overlay when window loses focus
    handleWindowFocus(event) {
        if (event.type === 'blur' && this.isOverlayVisible) {
            this.clearOverlay();
        }
    }

    // Load user settings
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get('overlaySettings');
            this.settings = result.overlaySettings || {
                fontSize: 14,
                boxSize: 24,
                shortcutKeys: ['Control', 'Alt'],
                boxColor: '#FFFF00'
            };
            
            // Apply CSS settings
            this.applyCSSSettings();
            
        } catch (error) {
            console.error('[ChromeShortcut] Failed to load settings:', error);
            // Use default settings
            this.settings = {
                fontSize: 14,
                boxSize: 24,
                shortcutKeys: ['Control', 'Alt'],
                boxColor: '#FFFF00'
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
        
        const { fontSize, boxSize, boxColor } = this.settings;
        const padding = Math.max(4, Math.floor(boxSize * 0.15));
        const textColor = this.getTextColor(boxColor || '#FFFF00');
        
        // Now that inline styles are removed, simpler CSS should work
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
                background-color: ${boxColor || '#FFFF00'} !important;
                color: ${textColor} !important;
            }
        `;
    }
    
    // Calculate luminance to determine if text should be black or white
    // Formula from WCAG guidelines
    getLuminance(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Handle 3-digit hex codes
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        // Convert to RGB
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        // Apply gamma correction
        const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
        
        // Calculate luminance
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    
    // Get appropriate text color (black or white) based on background
    getTextColor(backgroundColor) {
        const luminance = this.getLuminance(backgroundColor);
        // Use white text for dark backgrounds (luminance < 0.5)
        // Use black text for light backgrounds (luminance >= 0.5)
        return luminance < 0.5 ? 'rgba(255, 255, 255, 0.5)' : '#000000';
    }
    
    // Force apply styles directly to existing label elements (nuclear option)
    forceApplyStylesToLabels() {
        const labels = document.querySelectorAll('.chrome-overlay-label');
        const { fontSize, boxSize, boxColor } = this.settings;
        const padding = Math.max(4, Math.floor(boxSize * 0.15));
        const textColor = this.getTextColor(boxColor || '#FFFF00');
        
        labels.forEach(label => {
            label.style.setProperty('background-color', boxColor || '#FFFF00', 'important');
            label.style.setProperty('color', textColor, 'important');
            label.style.setProperty('font-size', `${fontSize}px`, 'important');
            label.style.setProperty('min-width', `${boxSize}px`, 'important');
            label.style.setProperty('min-height', `${boxSize}px`, 'important');
            label.style.setProperty('padding', `${padding}px`, 'important');
            label.style.setProperty('line-height', `${boxSize - (padding * 2)}px`, 'important');
        });
    }

    // Handle settings updates
    handleSettingsUpdate(newSettings) {
        this.settings = newSettings;
        
        // Apply new CSS settings
        this.applyCSSSettings();
        
        // Update input manager shortcut if changed
        if (this.inputManager && newSettings.shortcutKeys) {
            this.inputManager.updateShortcutKeys(newSettings.shortcutKeys);
        }
    }
    
    // Get shortcut display string
    getShortcutDisplay() {
        if (!this.settings || !this.settings.shortcutKeys) return 'Ctrl+Alt';
        
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

    // Cleanup
    destroy() {
        this.clearOverlay();
        
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        if (this.overlayRenderer) {
            this.overlayRenderer.destroy();
        }
        
        window.removeEventListener('scroll', this.handleScroll);
        document.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('wheel', this.handleScroll);
        document.removeEventListener('wheel', this.handleScroll);
        document.removeEventListener('click', this.handleClick, true);
        document.removeEventListener('mousedown', this.handleClick, true);
        
        // Remove focus listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('blur', this.handleWindowFocus);
        window.removeEventListener('focus', this.handleWindowFocus);
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
        return;
    }
    
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

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'settings-updated' && window.chromeOverlayExtension) {
        window.chromeOverlayExtension.handleSettingsUpdate(message.settings);
        sendResponse({ success: true });
    }
    
    return true; // Keep message channel open for async response
});