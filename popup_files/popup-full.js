// Full Popup script - Shortcut recording + font/box settings
// Records shortcuts and stores them for input manager to use

class PopupManager {
    constructor() {
        this.isRecording = false;
        this.recordedKeys = new Set();
        this.currentShortcut = ['Control', 'Alt']; // Default shortcut
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
    }
    
    initializeElements() {
        // Shortcut elements
        this.currentShortcutDisplay = document.getElementById('currentShortcut');
        this.recordButton = document.getElementById('recordButton');
        this.clearButton = document.getElementById('clearButton');
        
        // Appearance elements
        this.fontSizeSlider = document.getElementById('fontSize');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.boxSizeSlider = document.getElementById('boxSize');
        this.boxSizeValue = document.getElementById('boxSizeValue');
        this.boxColorPicker = document.getElementById('boxColor');
        this.hexColorInput = document.getElementById('hexColor');
        
        // Action elements
        this.saveButton = document.getElementById('saveSettings');
        this.statusMessage = document.getElementById('statusMessage');
    }
    
    bindEvents() {
        // Shortcut recording
        this.recordButton.addEventListener('click', () => {
            this.startRecording();
        });
        
        this.clearButton.addEventListener('click', () => {
            this.clearShortcut();
        });
        
        // Global key listeners for recording
        document.addEventListener('keydown', (e) => {
            if (this.isRecording) {
                this.handleKeyDown(e);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.isRecording) {
                this.handleKeyUp(e);
            }
        });
        
        // Appearance sliders
        this.fontSizeSlider.addEventListener('input', () => {
            this.fontSizeValue.textContent = this.fontSizeSlider.value + 'px';
        });
        
        this.boxSizeSlider.addEventListener('input', () => {
            this.boxSizeValue.textContent = this.boxSizeSlider.value + 'px';
        });
        
        // Color picker events
        this.boxColorPicker.addEventListener('input', () => {
            const color = this.boxColorPicker.value;
            this.hexColorInput.value = color;
            this.updatePopupColors(color);
        });
        
        this.hexColorInput.addEventListener('input', () => {
            const color = this.hexColorInput.value;
            if (this.isValidHexColor(color)) {
                this.boxColorPicker.value = color;
                this.updatePopupColors(color);
            }
        });
        
        // Save button
        this.saveButton.addEventListener('click', () => {
            this.saveAllSettings();
        });
    }
    
    // Load all settings
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get('overlaySettings');
            const settings = result.overlaySettings || { 
                fontSize: 14, 
                boxSize: 24,
                shortcutKeys: ['Control', 'Alt'],
                boxColor: '#FFFF00'
            };
            
            // Load appearance settings
            this.fontSizeSlider.value = settings.fontSize;
            this.fontSizeValue.textContent = settings.fontSize + 'px';
            
            this.boxSizeSlider.value = settings.boxSize;
            this.boxSizeValue.textContent = settings.boxSize + 'px';
            
            // Load color setting
            this.boxColorPicker.value = settings.boxColor || '#FFFF00';
            this.hexColorInput.value = settings.boxColor || '#FFFF00';
            
            // Load shortcut setting
            this.currentShortcut = settings.shortcutKeys || ['Ctrl', 'Alt'];
            this.updateShortcutDisplay();
            
            // Update popup colors to match user's choice
            this.updatePopupColors(settings.boxColor || '#FFFF00');
            
        } catch (error) {
            console.error('[Popup] Failed to load settings:', error);
        }
    }
    
    // Update shortcut display
    updateShortcutDisplay() {
        const displayKeys = this.currentShortcut.map(key => {
            switch (key) {
                case 'Control': return 'Ctrl';
                case 'Alt': return 'Alt';
                case 'Shift': return 'Shift';
                case 'Meta': return navigator.platform.includes('Mac') ? 'Cmd' : 'Win';
                default: return key;
            }
        });
        
        this.currentShortcutDisplay.textContent = displayKeys.join('+');
        this.currentShortcutDisplay.classList.add('current-shortcut');
    }
    
    // Start recording keyboard shortcut
    startRecording() {
        this.isRecording = true;
        this.recordedKeys.clear();
        this.recordButton.textContent = 'Recording...';
        this.recordButton.disabled = true;
        this.currentShortcutDisplay.textContent = 'Press keys now...';
        this.currentShortcutDisplay.classList.add('recording');
        this.currentShortcutDisplay.classList.remove('current-shortcut');
        
    }
    
    // Stop recording
    stopRecording() {
        this.isRecording = false;
        this.recordButton.textContent = 'Record';
        this.recordButton.disabled = false;
        this.currentShortcutDisplay.classList.remove('recording');
        
    }
    
    // Handle key down during recording
    handleKeyDown(event) {
        if (!this.isRecording) return;
        
        // Prevent ALL default behavior during recording
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Record modifier keys
        if (event.ctrlKey) this.recordedKeys.add('Ctrl');
        if (event.altKey) this.recordedKeys.add('Alt'); 
        if (event.shiftKey) this.recordedKeys.add('Shift');
        if (event.metaKey) this.recordedKeys.add('Meta');
        
        // Record the main key (if it's not a modifier)
        const key = event.key;
        if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
            // For letter keys, use uppercase
            if (key.length === 1 && key.match(/[a-zA-Z]/)) {
                this.recordedKeys.add(key.toUpperCase());
            } else {
                this.recordedKeys.add(key);
            }
        }
        
        // Update display
        const keyString = Array.from(this.recordedKeys).join('+');
        this.currentShortcutDisplay.textContent = keyString || 'Press keys...';
        
    }
    
    // Handle key up during recording
    handleKeyUp(event) {
        if (!this.isRecording) return;
        
        // Prevent ALL default behavior during recording
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Finalize recording when all modifier keys are released
        if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
            this.finalizeRecording();
        }
    }
    
    // Finalize the recorded shortcut
    finalizeRecording() {
        if (this.recordedKeys.size === 0) {
            // No keys recorded, revert to previous
            this.updateShortcutDisplay();
            this.stopRecording();
            return;
        }
        
        // Validate that we have at least one modifier key for safety
        const modifiers = ['Ctrl', 'Alt', 'Shift', 'Meta'];
        const hasModifier = Array.from(this.recordedKeys).some(key => modifiers.includes(key));
        
        if (!hasModifier) {
            this.showStatus('Please include at least one modifier key (Ctrl, Alt, Shift)', 'error');
            this.updateShortcutDisplay();
            this.stopRecording();
            return;
        }
        
        // Prevent problematic shortcut combinations
        const keyArray = Array.from(this.recordedKeys);
        
        // Chrome Browser Shortcuts (Ctrl+Letter)
        const chromeShortcuts = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        const isChrome = keyArray.includes('Ctrl') && keyArray.length === 2 && keyArray.some(k => chromeShortcuts.includes(k));
        
        // Windows OS Shortcuts
        const windowsCtrlShortcuts = ['A', 'C', 'D', 'E', 'F', 'H', 'N', 'R', 'V', 'W', 'X', 'Y', 'Z'];
        const windowsAltShortcuts = ['D', 'F4'];
        const windowsWinShortcuts = ['A', 'D', 'E', 'I', 'L', 'R', 'S'];
        const isWindowsCtrl = keyArray.includes('Ctrl') && keyArray.length === 2 && keyArray.some(k => windowsCtrlShortcuts.includes(k));
        const isWindowsAlt = keyArray.includes('Alt') && (keyArray.some(k => windowsAltShortcuts.includes(k)) || keyArray.includes('F4'));
        const isWindowsWin = keyArray.includes('Meta') && keyArray.length === 2 && keyArray.some(k => windowsWinShortcuts.includes(k));
        
        // Block ALL single Meta key combinations (Win+anything)
        const isMetaSingle = keyArray.includes('Meta') && keyArray.length === 2;
        
        // macOS Shortcuts  
        const macCmdShortcuts = ['A', 'C', 'F', 'G', 'H', 'M', 'N', 'O', 'P', 'Q', 'S', 'T', 'V', 'W', 'X', 'Z'];
        const macCtrlShortcuts = ['A', 'E', 'F', 'H', 'K'];
        const isMacCmd = keyArray.includes('Meta') && keyArray.length === 2 && keyArray.some(k => macCmdShortcuts.includes(k));
        const isMacCtrl = keyArray.includes('Ctrl') && keyArray.length === 2 && keyArray.some(k => macCtrlShortcuts.includes(k));
        
        // Alt+Letter (browser menu shortcuts) - but allow Alt+Number
        const isAltLetter = keyArray.includes('Alt') && keyArray.length === 2 && keyArray.some(k => k.match(/^[A-Z]$/));
        const isAltNumber = keyArray.includes('Alt') && keyArray.length === 2 && keyArray.some(k => k.match(/^[0-9]$/));
        
        // Check for conflicts and show specific messages
        if (isChrome) {
            this.showStatus('Conflicts with Chrome browser shortcut. Try Ctrl+Alt, Ctrl+Shift, Alt+Number (1-9), or Ctrl+Shift+Letter (A-Z)', 'error');
            this.updateShortcutDisplay();
            this.stopRecording();
            return;
        }
        
        if (isWindowsCtrl || isWindowsAlt || isWindowsWin || isMetaSingle) {
            this.showStatus('Conflicts with Windows OS shortcut. Try Ctrl+Alt, Ctrl+Shift, Alt+Number (1-9), or Ctrl+Shift+Letter (A-Z)', 'error');
            this.updateShortcutDisplay();
            this.stopRecording();
            return;
        }
        
        if (isMacCmd || isMacCtrl) {
            this.showStatus('Conflicts with macOS shortcut. Try Ctrl+Alt, Ctrl+Shift, Alt+Number (1-9), or Ctrl+Shift+Letter (A-Z)', 'error');
            this.updateShortcutDisplay();
            this.stopRecording();
            return;
        }
        
        if (isAltLetter && !isAltNumber) {
            this.showStatus('Alt+Letter shortcuts are reserved for browser menus. Try Ctrl+Alt, Ctrl+Shift, Alt+Number (1-9), or Ctrl+Shift+Letter (A-Z)', 'error');
            this.updateShortcutDisplay();
            this.stopRecording();
            return;
        }
        
        // Convert to array format that input manager expects
        this.currentShortcut = Array.from(this.recordedKeys).map(key => {
            switch (key) {
                case 'Ctrl': return 'Control';
                case 'Alt': return 'Alt';
                case 'Shift': return 'Shift';
                case 'Meta': return 'Meta';
                default: return key;
            }
        });
        
        this.updateShortcutDisplay();
        this.stopRecording();
        
    }
    
    // Clear shortcut to default
    clearShortcut() {
        this.currentShortcut = ['Control', 'Alt'];
        this.updateShortcutDisplay();
    }
    
    // Save all settings
    async saveAllSettings() {
        try {
            const settings = {
                fontSize: parseInt(this.fontSizeSlider.value),
                boxSize: parseInt(this.boxSizeSlider.value),
                shortcutKeys: this.currentShortcut,
                boxColor: this.boxColorPicker.value
            };
            
            await chrome.storage.sync.set({ overlaySettings: settings });
            
            this.showStatus('All settings saved! Refresh current page to update!', 'success');
            
            // Notify content scripts
            const tabs = await chrome.tabs.query({});
            let notifiedTabs = 0;
            for (const tab of tabs) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: 'settings-updated',
                        settings: settings
                    });
                    notifiedTabs++;
                } catch (e) {
                }
            }
            
            
        } catch (error) {
            console.error('[Popup] Failed to save settings:', error);
            this.showStatus('Failed to save settings', 'error');
        }
    }
    
    // Show status message
    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';
        
        setTimeout(() => {
            this.statusMessage.style.display = 'none';
        }, 4000);
    }
    
    // Validate hex color format
    isValidHexColor(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }
    
    // Calculate luminance to determine if text should be black or white
    // Formula from WCAG guidelines
    getLuminance(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
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
    
    // Update popup UI colors to match user's selected color
    updatePopupColors(color) {
        const textColor = this.getTextColor(color);
        
        // Update range value colors
        const rangeValues = document.querySelectorAll('.range-value');
        rangeValues.forEach(element => {
            element.style.color = color;
        });
        
        // Update current shortcut display with background color and appropriate text color
        if (this.currentShortcutDisplay && this.currentShortcutDisplay.classList.contains('current-shortcut')) {
            this.currentShortcutDisplay.style.backgroundColor = color;
            this.currentShortcutDisplay.style.color = textColor;
        }
        
        // Update hex input border color when focused
        if (this.hexColorInput) {
            this.hexColorInput.style.setProperty('--focus-border-color', color);
        }
        
        // Update save button color
        if (this.saveButton) {
            this.saveButton.style.backgroundColor = color;
            this.saveButton.style.color = textColor;
        }
        
        // Update slider tracks
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            // Create or update CSS custom properties for this color
            slider.style.setProperty('--track-color', color);
        });
        
        // Update the CSS custom properties for slider styling
        this.updateSliderCSS(color);
    }
    
    // Update slider CSS with the new color
    updateSliderCSS(color) {
        let style = document.getElementById('popup-dynamic-colors');
        if (!style) {
            style = document.createElement('style');
            style.id = 'popup-dynamic-colors';
            document.head.appendChild(style);
        }
        
        style.textContent = `
            input[type="range"]::-webkit-slider-track {
                background: ${color} !important;
            }
            
            input[type="range"]::-moz-range-track {
                background: ${color} !important;
            }
            
            input[type="range"]::-webkit-slider-thumb {
                background: ${color} !important;
            }
            
            input[type="range"]::-moz-range-thumb {
                background: ${color} !important;
            }
            
            #hexColor:focus {
                border-color: ${color} !important;
            }
            
            .shortcut-display.recording {
                border-color: ${color} !important;
            }
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});