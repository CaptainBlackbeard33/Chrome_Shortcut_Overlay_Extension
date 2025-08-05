// InputManager - Handles keyboard input and sequences
// Converted from InputManager.cs - replaces Windows keyboard detection with DOM events

class InputManager {
    constructor(onSequence, onCancel, onToggle) {
        this.onSequence = onSequence;
        this.onCancel = onCancel;
        this.onToggle = onToggle;
        
        this.currentSequence = '';
        this.keyPressed = new Set(); // Track pressed keys
        this.sequenceListeningActive = false; // Only listen for sequences when overlay is active
        this.isListening = false;
        
        // Debouncing for toggle
        this.lastToggleTime = 0;
        this.toggleDebounceMs = 300;
        
        // Customizable shortcut keys
        this.shortcutKeys = ['Control', 'Alt'];
        
        this.boundKeyDownHandler = this.handleKeyDown.bind(this);
        this.boundKeyUpHandler = this.handleKeyUp.bind(this);
    }

    static instance = null;
    
    static getInstance(onSequence, onCancel, onToggle) {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager(onSequence, onCancel, onToggle);
        }
        return InputManager.instance;
    }

    // Clear sequence (equivalent to ClearSequence from C#)
    clearSequence() {
        this.currentSequence = '';
        this.keyPressed.clear();
    }

    // Set sequence listening state (equivalent to SetSequenceListening from C#)
    setSequenceListening(active) {
        this.sequenceListeningActive = active;
        
        // Always clear sequence when changing state (same as C#)
        this.currentSequence = '';
        this.keyPressed.clear();
    }

    // Start listening for keyboard events (equivalent to StartListening from C#)
    startListening() {
        if (this.isListening) {
                return;
        }

        
        // Add event listeners for keyboard input
        document.addEventListener('keydown', this.boundKeyDownHandler, true);
        document.addEventListener('keyup', this.boundKeyUpHandler, true);
        
        this.isListening = true;
    }

    // Stop listening (cleanup)
    stopListening() {
        if (!this.isListening) return;
        
        document.removeEventListener('keydown', this.boundKeyDownHandler, true);
        document.removeEventListener('keyup', this.boundKeyUpHandler, true);
        
        this.isListening = false;
    }

    // Handle keydown events
    handleKeyDown(event) {
        const key = event.key;
        const code = event.code;
        
        // Safety check for undefined/null key
        if (!key) return;

        // Check for custom toggle shortcut
        if (this.isToggleShortcutPressed(event)) {
            // Prevent default browser behavior
            event.preventDefault();
            event.stopPropagation();
            
            const now = Date.now();
            if (now - this.lastToggleTime > this.toggleDebounceMs) {
                this.lastToggleTime = now;
                this.onToggle();
            }
            return;
        }

        // When overlay is active, prevent ALL browser shortcuts to avoid conflicts
        if (this.sequenceListeningActive) {
            // Handle Escape key to close overlay
            if (key === 'Escape') {
                this.currentSequence = '';
                this.keyPressed.clear();
                this.onCancel();
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            // Check for letter keys (A-Z)
            if (key.length === 1 && key.match(/[a-zA-Z]/)) {
                const upperKey = key.toUpperCase();
                
                // Only add if key wasn't already pressed (prevent key repeat)
                if (!this.keyPressed.has(upperKey)) {
                    this.keyPressed.add(upperKey);
                    this.currentSequence += upperKey;
                    
                    
                    // Call sequence handler
                    this.onSequence(this.currentSequence);
                }
                
                // Always prevent default for letter keys when overlay is active
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            // Prevent common browser shortcuts when overlay is active
            const preventedShortcuts = [
                // Alt + letter combinations (Chrome shortcuts) - but allow Alt + numbers
                event.altKey && key.match(/[a-zA-Z]/),
                // Ctrl + letter combinations  
                event.ctrlKey && key.match(/[a-zA-Z]/),
                // Function keys
                key.startsWith('F') && key.length <= 3,
                // Tab navigation
                key === 'Tab',
                // Space bar (page scroll)
                key === ' ' || key === 'Space',
                // Arrow keys (can interfere with navigation)
                ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
            ];

            if (preventedShortcuts.some(condition => condition)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        } else {
            // When overlay is NOT active, handle normal Escape behavior  
            if (key === 'Escape') {
                this.currentSequence = '';
                this.keyPressed.clear();
                this.onCancel();
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        }
    }

    // Handle keyup events
    handleKeyUp(event) {
        const key = event.key;
        
        // Safety check for undefined/null key
        if (!key) return;
        
        // Only track letter keys for sequence building
        if (key.length === 1 && key.match(/[a-zA-Z]/)) {
            const upperKey = key.toUpperCase();
            this.keyPressed.delete(upperKey);
        }
    }

    // Get current sequence
    getCurrentSequence() {
        return this.currentSequence;
    }

    // Check if currently listening for sequences
    isSequenceListening() {
        return this.sequenceListeningActive;
    }

    // Manually set the sequence (for testing or special cases)
    setSequence(sequence) {
        this.currentSequence = sequence;
    }

    // Check if Alt+Ctrl is currently pressed (utility method)
    isToggleKeyPressed() {
        // In web context, we can't easily check if keys are currently pressed
        // This would need to be tracked during keydown/keyup events
        // For now, return false as this is mainly used for state checking
        return false;
    }

    // Update shortcut keys
    updateShortcutKeys(keys) {
        this.shortcutKeys = keys || ['Control', 'Alt'];
    }

    // Check if toggle shortcut is pressed
    isToggleShortcutPressed(event) {
        const requiredKeys = {
            Alt: event.altKey,
            Control: event.ctrlKey,
            Shift: event.shiftKey,
            Meta: event.metaKey
        };
        
        // Separate modifiers from regular keys
        const modifierKeys = ['Control', 'Alt', 'Shift', 'Meta'];
        const requiredModifiers = this.shortcutKeys.filter(key => modifierKeys.includes(key));
        const requiredRegularKeys = this.shortcutKeys.filter(key => !modifierKeys.includes(key));
        
        // Check if all required modifier keys are pressed
        const allModifiersPressed = requiredModifiers.every(key => {
            if (key === 'Control') return requiredKeys.Control;
            if (key === 'Alt') return requiredKeys.Alt;
            if (key === 'Shift') return requiredKeys.Shift;
            if (key === 'Meta') return requiredKeys.Meta;
            return false;
        });
        
        // Check if the regular key matches (if any)
        const regularKeyMatches = requiredRegularKeys.length === 0 || 
            requiredRegularKeys.some(key => event.key === key || event.key === key.toLowerCase());
        
        // Check that no extra modifier keys are pressed
        const noExtraModifiers = Object.entries(requiredKeys).every(([modifier, pressed]) => {
            if (requiredModifiers.includes(modifier)) {
                return true; // This modifier is expected
            }
            return !pressed; // This modifier should not be pressed
        });
        
        return allModifiersPressed && regularKeyMatches && noExtraModifiers;
    }

    // Get display string for current shortcut
    getShortcutDisplay() {
        return this.shortcutKeys.map(key => {
            switch (key) {
                case 'Control': return 'Ctrl';
                case 'Alt': return 'Alt';
                case 'Shift': return 'Shift';
                case 'Meta': return navigator.platform.includes('Mac') ? 'Cmd' : 'Win';
                default: return key;
            }
        }).join('+');
    }

    // Destroy and cleanup
    destroy() {
        this.stopListening();
        this.clearSequence();
        InputManager.instance = null;
    }
}

// Export for global access
window.InputManager = InputManager;