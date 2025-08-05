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
                boxSize: 32,
                shortcutKeys: ['Control', 'Alt']
            };
            
            // Load appearance settings
            this.fontSizeSlider.value = settings.fontSize;
            this.fontSizeValue.textContent = settings.fontSize + 'px';
            
            this.boxSizeSlider.value = settings.boxSize;
            this.boxSizeValue.textContent = settings.boxSize + 'px';
            
            // Load shortcut setting
            this.currentShortcut = settings.shortcutKeys || ['Ctrl', 'Alt'];
            this.updateShortcutDisplay();
            
            console.log('[Popup] Settings loaded:', settings);
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
        
        console.log('[Popup] Started recording shortcut');
    }
    
    // Stop recording
    stopRecording() {
        this.isRecording = false;
        this.recordButton.textContent = 'Record';
        this.recordButton.disabled = false;
        this.currentShortcutDisplay.classList.remove('recording');
        
        console.log('[Popup] Stopped recording shortcut');
    }
    
    // Handle key down during recording
    handleKeyDown(event) {
        if (!this.isRecording) return;
        
        event.preventDefault();
        event.stopPropagation();
        
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
        
        console.log('[Popup] Keys recorded:', Array.from(this.recordedKeys));
    }
    
    // Handle key up during recording
    handleKeyUp(event) {
        if (!this.isRecording) return;
        
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
        
        console.log('[Popup] Shortcut finalized:', this.currentShortcut);
    }
    
    // Clear shortcut to default
    clearShortcut() {
        this.currentShortcut = ['Control', 'Alt'];
        this.updateShortcutDisplay();
        console.log('[Popup] Shortcut cleared to default');
    }
    
    // Save all settings
    async saveAllSettings() {
        try {
            const settings = {
                fontSize: parseInt(this.fontSizeSlider.value),
                boxSize: parseInt(this.boxSizeSlider.value),
                shortcutKeys: this.currentShortcut
            };
            
            await chrome.storage.sync.set({ overlaySettings: settings });
            
            this.showStatus('All settings saved!', 'success');
            
            // Notify content scripts
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: 'settings-updated',
                        settings: settings
                    });
                } catch (e) {
                    // Tab might not have content script loaded
                }
            }
            
            console.log('[Popup] All settings saved:', settings);
            
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
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});