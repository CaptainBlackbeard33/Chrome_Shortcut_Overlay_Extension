// ElementResolver - Manages cached element data
// Converted from ElementResolver.cs

class ElementResolver {
    constructor() {
        this.elements = [];
    }

    static instance = null;
    
    static getInstance() {
        if (!ElementResolver.instance) {
            ElementResolver.instance = new ElementResolver();
        }
        return ElementResolver.instance;
    }

    setElements(elements) {
        this.elements = elements || [];
        console.log(`[ElementResolver] Set ${this.elements.length} elements`);
    }

    resolveElements() {
        if (!this.elements || this.elements.length === 0) {
            console.log('[ElementResolver] No cached elements available.');
            return [];
        }

        try {
            console.log('[ElementResolver] Getting cached elements...');
            console.log(`[ElementResolver] Got ${this.elements.length} elements`);
            return this.elements;
        } catch (ex) {
            console.log(`[ElementResolver ERROR] ${ex.message}`);
            // Fallback test elements (same as C# version)
            return [
                { label: 'AA', position: { x: 200, y: 200 } },
                { label: 'AB', position: { x: 300, y: 250 } },
                { label: 'AC', position: { x: 400, y: 300 } }
            ];
        }
    }

    hasElements() {
        return this.elements && this.elements.length > 0;
    }
}

// Export singleton instance
window.ElementResolver = ElementResolver.getInstance();