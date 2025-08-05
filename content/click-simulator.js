// ClickSimulator - Simulates clicks on elements
// Converted from ClickSimulator.cs - replaces Windows API calls with DOM events

class ClickSimulator {
    static clickAt(x, y) {
        console.log(`[ClickSimulator] Clicking at ${x}, ${y}`);
        
        // Find the element at the given coordinates
        const element = document.elementFromPoint(x, y);
        
        if (!element) {
            console.log('[ClickSimulator] No element found at coordinates');
            return false;
        }

        try {
            // Method 1: Try native click if it's a clickable element
            if (this.isClickableElement(element)) {
                console.log(`[ClickSimulator] Using native click on ${element.tagName}`);
                element.click();
                return true;
            }

            // Method 2: Dispatch mouse events for complex elements
            console.log(`[ClickSimulator] Using mouse events on ${element.tagName}`);
            this.dispatchMouseEvents(element, x, y);
            return true;

        } catch (ex) {
            console.error(`[ClickSimulator ERROR] ${ex.message}`);
            return false;
        }
    }

    static isClickableElement(element) {
        const clickableTags = ['A', 'BUTTON', 'INPUT'];
        const clickableRoles = ['button', 'link', 'tab', 'menuitem'];
        
        return clickableTags.includes(element.tagName) ||
               clickableRoles.includes(element.getAttribute('role')) ||
               element.hasAttribute('onclick') ||
               element.tabIndex >= 0;
    }

    static dispatchMouseEvents(element, x, y) {
        // Create mouse events similar to Windows API SendInput
        const mouseEvents = ['mousedown', 'mouseup', 'click'];
        
        const rect = element.getBoundingClientRect();
        const relativeX = x - rect.left;
        const relativeY = y - rect.top;

        mouseEvents.forEach(eventType => {
            const event = new MouseEvent(eventType, {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                offsetX: relativeX,
                offsetY: relativeY,
                button: 0, // Left button
                buttons: eventType === 'mousedown' ? 1 : 0
            });

            element.dispatchEvent(event);
        });
    }

    // Helper method to get element center point (for use with overlay positions)
    static getElementCenter(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    // Enhanced click that handles different element types
    static clickElement(element) {
        if (!element) return false;

        try {
            // Handle different element types appropriately
            if (element.tagName === 'A' && element.href) {
                // For links, we can either click or navigate
                element.click();
            } else if (element.tagName === 'INPUT') {
                // Focus input elements and trigger change
                element.focus();
                element.click();
            } else if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
                // Standard button click
                element.click();
            } else {
                // Generic clickable element
                const center = this.getElementCenter(element);
                this.dispatchMouseEvents(element, center.x, center.y);
            }
            return true;
        } catch (ex) {
            console.error(`[ClickSimulator] Error clicking element: ${ex.message}`);
            return false;
        }
    }
}

// Export to global scope
window.ClickSimulator = ClickSimulator;