// DomScanner - Scans and caches clickable elements
// Converted from ChromeDomScanner.cs - replaces Puppeteer/CDP with direct DOM access

class DomScanner {
    constructor() {
        this.cachedElements = [];
        this.lastUrl = '';
        this.allCachedSites = new Map();
        this.isPreloadComplete = false;
    }

    static instance = null;
    
    static getInstance() {
        if (!DomScanner.instance) {
            DomScanner.instance = new DomScanner();
        }
        return DomScanner.instance;
    }

    // Simple current viewport scan - fast and accurate
    async scanCurrentViewport() {
        const startTime = performance.now();
        
        try {
            console.log('[DomScanner] Scanning current viewport for clickable elements');
            
            // Scan for clickable elements in current viewport
            const elements = this.scanClickableElements();
            
            const results = [];
            let labelIndex = 0;
            
            // Sort elements by position
            const sortedElements = elements.sort((a, b) => a.y - b.y || a.x - b.x);
            
            // Apply deduplication
            const dedupedElements = this.deduplicateElements(sortedElements);
            
            // Spatial assignment: split elements by screen position
            const viewportCenter = window.innerWidth / 2;
            const leftElements = [];
            const rightElements = [];
            
            console.log(`[DomScanner] Viewport width: ${window.innerWidth}, center: ${viewportCenter}`);
            
            // Classify elements by position (large elements use top-left point)
            dedupedElements.forEach((el, index) => {
                const side = el.x < viewportCenter ? 'LEFT' : 'RIGHT';
                console.log(`[DomScanner] Element ${index}: x=${el.x}, center=${viewportCenter}, classified as ${side}`);
                
                if (el.x < viewportCenter) {
                    leftElements.push(el);
                } else {
                    rightElements.push(el);
                }
            });
            
            console.log(`[DomScanner] Spatial split: ${leftElements.length} left, ${rightElements.length} right`);
            
            // Debug: Show first few elements from each side
            console.log(`[DomScanner] First 3 LEFT elements:`, leftElements.slice(0, 3).map(el => `x=${el.x}`));
            console.log(`[DomScanner] First 3 RIGHT elements:`, rightElements.slice(0, 3).map(el => `x=${el.x}`));
            
            // Assign labels to left side elements (ASDF territory)
            leftElements.forEach((el, index) => {
                const label = this.generateLeftLabel(index);
                if (label && index < 5) { // Only log first 5 for clarity
                    const posX = el.x + 5;
                    const posY = el.y + 5;
                    console.log(`[DomScanner] LEFT shortcut '${label}' at screen x=${posX} (element x=${el.x}, center=${viewportCenter})`);
                }
                if (label) {
                    const posX = el.x + 5;
                    const posY = el.y + 5;
                    results.push({
                        label: label,
                        position: { x: posX, y: posY },
                        element: el.element
                    });
                }
            });
            
            // Assign labels to right side elements (JKL territory)
            rightElements.forEach((el, index) => {
                const label = this.generateRightLabel(index);
                if (label && index < 5) { // Only log first 5 for clarity
                    const posX = el.x + 5;
                    const posY = el.y + 5;
                    console.log(`[DomScanner] RIGHT shortcut '${label}' at screen x=${posX} (element x=${el.x}, center=${viewportCenter})`);
                }
                if (label) {
                    const posX = el.x + 5;
                    const posY = el.y + 5;
                    results.push({
                        label: label,
                        position: { x: posX, y: posY },
                        element: el.element
                    });
                }
            });
            
            // Handle cross-side overflow if needed
            const totalAssigned = results.length;
            const totalElements = dedupedElements.length;
            if (totalAssigned < totalElements) {
                console.log(`[DomScanner] Overflow: ${totalElements - totalAssigned} elements without labels`);
            }
            
            // Don't cache - always use fresh results
            window.ElementResolver.setElements(results);
            
            const elapsed = Math.round(performance.now() - startTime);
            console.log(`[DomScanner] Viewport scan completed in ${elapsed} ms - found ${results.length} elements`);
            
        } catch (ex) {
            console.error(`[DomScanner ERROR] ${ex}`);
            window.ElementResolver.setElements([]);
        }
    }

    // Scan current page and cache results - equivalent to ScanLivePageAndCacheAsync
    async scanCurrentPageAndCache() {
        const currentUrl = this.getCurrentUrl();
        this.lastUrl = this.normalizeUrl(currentUrl);
        const cacheKey = this.lastUrl;

        // Add scroll listener (equivalent to injected script in C#)
        this.addScrollListener();

        console.log(`[DomScanner] Scanning ${currentUrl}`);
        
        // Wait a bit for page to settle (equivalent to Task.Delay in C#)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Scan for clickable elements
        const elements = this.scanClickableElements();
        
        const results = [];
        let labelIndex = 0;
        
        // Sort elements by position (same as C# ordering)
        const sortedElements = elements
            .sort((a, b) => a.y - b.y || a.x - b.x);

        // Group elements by proximity to eliminate duplicates
        const dedupedElements = this.deduplicateElements(sortedElements);
        
        // Spatial assignment: split elements by screen position
        const viewportCenter = window.innerWidth / 2;
        const leftElements = [];
        const rightElements = [];
        
        console.log(`[DomScanner] Viewport width: ${window.innerWidth}, center: ${viewportCenter}`);
        
        // Classify elements by position (large elements use top-left point)
        dedupedElements.forEach((el, index) => {
            const side = el.x < viewportCenter ? 'LEFT' : 'RIGHT';
            console.log(`[DomScanner] Element ${index}: x=${el.x}, center=${viewportCenter}, classified as ${side}`);
            
            if (el.x < viewportCenter) {
                leftElements.push(el);
            } else {
                rightElements.push(el);
            }
        });
        
        console.log(`[DomScanner] Spatial split: ${leftElements.length} left, ${rightElements.length} right`);
        
        // Assign labels to left side elements (ASDF territory)
        leftElements.forEach((el, index) => {
            const label = this.generateLeftLabel(index);
            if (label) {
                const posX = el.x + 5;
                const posY = el.y + 5;
                console.log(`[DomScanner] LEFT shortcut '${label}' assigned to element at x=${el.x} (screen pos: ${posX})`);
                results.push({
                    label: label,
                    position: { x: posX, y: posY },
                    element: el.element
                });
            }
        });
        
        // Assign labels to right side elements (JKL territory)
        rightElements.forEach((el, index) => {
            const label = this.generateRightLabel(index);
            if (label) {
                const posX = el.x + 5;
                const posY = el.y + 5;
                console.log(`[DomScanner] RIGHT shortcut '${label}' assigned to element at x=${el.x} (screen pos: ${posX})`);
                results.push({
                    label: label,
                    position: { x: posX, y: posY },
                    element: el.element
                });
            }
        });
        
        // Handle cross-side overflow if needed
        const totalAssigned = results.length;
        const totalElements = dedupedElements.length;
        if (totalAssigned < totalElements) {
            console.log(`[DomScanner] Overflow: ${totalElements - totalAssigned} elements without labels`);
        }

        // Validate results before caching
        const invalidResults = results.filter(r => r.position.x < 5 && r.position.y < 5).length;
        if (results.length === 0 || invalidResults > results.length * 0.8) {
            console.log('[DomScanner] Skipping cache save - layout invalid');
            this.cachedElements = [];
            return;
        }

        // Save to cache
        await this.saveToCache(cacheKey, results);
        this.cachedElements = results;

        console.log(`[DomScanner] Cached ${results.length} elements for ${cacheKey}`);
    }

    // Universal element detection - works on all websites
    scanClickableElements() {
        const items = [];
        const selectors = [
            // Standard HTML clickable elements
            'button:not([disabled]):not([hidden])',
            'a[href]:not([disabled]):not([hidden])', 
            'input[type="button"]:not([disabled]):not([hidden])',
            'input[type="submit"]:not([disabled]):not([hidden])',
            'input[type="search"]:not([disabled]):not([hidden])',
            'input[type="text"]:not([disabled]):not([hidden])',
            'input[type="email"]:not([disabled]):not([hidden])',
            'input[type="password"]:not([disabled]):not([hidden])',
            'select:not([disabled]):not([hidden])',
            'textarea:not([disabled]):not([hidden])',
            
            // ARIA role-based elements (universal)
            '[role="button"]:not([disabled]):not([hidden])',
            '[role="link"]:not([disabled]):not([hidden])',
            '[role="tab"]:not([disabled]):not([hidden])',
            '[role="menuitem"]:not([disabled]):not([hidden])',
            '[role="option"]:not([disabled]):not([hidden])',
            '[role="textbox"]:not([disabled]):not([hidden])',
            '[role="searchbox"]:not([disabled]):not([hidden])',
            '[role="combobox"]:not([disabled]):not([hidden])',
            
            // Interactive elements with tabindex
            '[tabindex]:not([tabindex="-1"]):not([disabled]):not([hidden])',
            
            // Elements with click handlers
            '[onclick]:not([disabled]):not([hidden])',
            
            // Common universal CSS classes
            '.btn:not([disabled]):not([hidden])',
            '.button:not([disabled]):not([hidden])',
            '.link:not([disabled]):not([hidden])',
            '.clickable:not([disabled]):not([hidden])',
            
            // Elements with pointer cursor (universal indicator)
            '*[style*="cursor: pointer"]:not([disabled]):not([hidden])',
            '*[style*="cursor:pointer"]:not([disabled]):not([hidden])'
        ];
        
        const seen = new Set();
        const seenElements = new WeakSet(); // Track actual DOM elements to prevent duplicates
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        console.log(`[DomScanner] Viewport: ${vw}x${vh}`);

        const elements = document.querySelectorAll(selectors.join(','));
        console.log(`[DomScanner] Found ${elements.length} potential elements via selectors`);
        
        // Scan for elements with pointer cursor (limited scope for performance)
        const clickableContainers = document.querySelectorAll('div, span, td, li, nav, header, main, section');
        const pointerElements = Array.from(clickableContainers).filter(el => {
            const style = getComputedStyle(el);
            return style.cursor === 'pointer' && !el.disabled && !el.hidden;
        });
        
        console.log(`[DomScanner] Found ${pointerElements.length} additional pointer cursor elements`);
        
        // Universal modern web app detection - find elements with interactive data attributes
        const modernWebElements = document.querySelectorAll([
            // Common data attributes used by modern web frameworks
            '[data-action]',
            '[data-click]', 
            '[data-handler]',
            '[data-command]',
            '[data-tooltip]',
            '[data-testid]',
            '[data-cy]', // Cypress testing
            '[data-qa]', // QA testing
            
            // JavaScript framework event bindings
            '[jsaction]', // Google's framework
            '[ng-click]', // Angular
            '[v-on\\:click]', // Vue.js
            '[onclick]',
            
            // Modern ARIA patterns
            '[role="gridcell"]',
            '[role="row"]', 
            '[role="cell"]',
            '[role="presentation"][tabindex]',
            
            // Interactive containers
            'div[tabindex]:not([tabindex="-1"])',
            'span[tabindex]:not([tabindex="-1"])',
            'td[tabindex]:not([tabindex="-1"])',
            'li[tabindex]:not([tabindex="-1"])'
        ].join(','));
        
        console.log(`[DomScanner] Found ${modernWebElements.length} modern web app elements`);
        
        // Debug logging for Gmail specifically
        if (window.location.hostname.includes('mail.google.com')) {
            console.log('[DomScanner] Gmail detected - detailed debugging:');
            console.log(`  - Standard selectors: ${elements.length}`);
            console.log(`  - Pointer elements: ${pointerElements.length}`);
            console.log(`  - Modern elements: ${modernWebElements.length}`);
            
            // Sample the first few elements of each type for debugging
            if (elements.length > 0) console.log('  - Sample standard:', elements[0]);
            if (pointerElements.length > 0) console.log('  - Sample pointer:', pointerElements[0]);
            if (modernWebElements.length > 0) console.log('  - Sample modern:', modernWebElements[0]);
        }

        // Combine all element types
        const allClickableElements = [...elements, ...pointerElements, ...modernWebElements];
        
        for (let i = 0; i < allClickableElements.length; i++) {
            const el = allClickableElements[i];
            
            // Skip if we've already processed this exact DOM element
            if (seenElements.has(el)) continue;
            
            // Skip if element is not actually clickable
            if (!this.isElementClickable(el)) continue;
            
            const rect = el.getBoundingClientRect();

            // Size and visibility checks
            if (rect.width < 15 || rect.height < 10) continue;
            if (rect.top + rect.height < 0 || rect.left + rect.width < 0) continue;
            if (rect.top > vh || rect.left > vw) continue;

            // Style checks
            const style = getComputedStyle(el);
            if (style.visibility === 'hidden' || style.display === 'none') continue;
            if (style.opacity === '0') continue;
            if (style.pointerEvents === 'none') continue;

            // Check if element is covered by another element
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const elementAtCenter = document.elementFromPoint(centerX, centerY);
            
            // Skip if element is completely covered
            if (elementAtCenter && !el.contains(elementAtCenter) && !elementAtCenter.contains(el)) {
                continue;
            }

            // Deduplication using position + size + DOM element tracking
            const key = `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${Math.round(rect.height)}`;
            if (!seen.has(key)) {
                seen.add(key);
                seenElements.add(el); // Mark this DOM element as processed
                items.push({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    element: el
                });
            }
        }

        console.log(`[DomScanner] Filtered to ${items.length} valid elements`);
        return items;
    }

    // Universal clickability check - works on all websites
    isElementClickable(element) {
        if (!element) return false;
        
        const tagName = element.tagName.toLowerCase();
        const className = element.className || '';
        const role = element.getAttribute('role') || '';
        
        // Skip disabled or hidden elements
        if (element.disabled || element.hasAttribute('disabled') || element.hidden) {
            return false;
        }
        
        // Always include standard clickable elements
        if (['button', 'a', 'input', 'textarea', 'select'].includes(tagName)) {
            return element.type !== 'hidden';
        }
        
        // Skip media elements unless they have handlers
        if (['video', 'audio', 'img'].includes(tagName)) {
            return element.hasAttribute('onclick') || 
                   element.hasAttribute('tabindex') ||
                   role;
        }
        
        // Check for modern web app interactive indicators
        const hasModernInteractivity = 
            // Traditional indicators
            element.hasAttribute('onclick') ||
            element.hasAttribute('tabindex') ||
            role ||
            
            // Modern data attributes (used by frameworks)
            element.hasAttribute('data-action') ||
            element.hasAttribute('data-click') ||
            element.hasAttribute('data-handler') ||
            element.hasAttribute('data-command') ||
            element.hasAttribute('jsaction') ||
            element.hasAttribute('ng-click') ||
            element.hasAttribute('v-on:click') ||
            
            // CSS class indicators
            className.includes('button') ||
            className.includes('btn') ||
            className.includes('clickable') ||
            className.includes('link') ||
            className.includes('interactive') ||
            
            // ARIA roles that indicate interactivity
            ['button', 'link', 'tab', 'menuitem', 'option', 'gridcell', 'cell'].includes(role);
        
        if (hasModernInteractivity) {
            return true;
        }
        
        // Check computed style for pointer cursor
        try {
            const style = getComputedStyle(element);
            if (style.cursor === 'pointer') {
                return true;
            }
        } catch (ex) {
            // Style computation failed, continue
        }
        
        // If element made it through our comprehensive selectors, it's likely clickable
        return true;
    }

    // Advanced deduplication method to eliminate overlapping and nested elements
    deduplicateElements(elements) {
        const dedupedElements = [];
        const proximityThreshold = 30; // pixels - elements closer than this are considered duplicates
        
        for (const element of elements) {
            let isDuplicate = false;
            
            for (const existing of dedupedElements) {
                // Check for DOM hierarchy relationship (parent/child)
                const isChildOfExisting = existing.element.contains(element.element);
                const isParentOfExisting = element.element.contains(existing.element);
                
                if (isChildOfExisting) {
                    // Current element is a child of existing element
                    // Keep the more specific (child) element if it's substantially smaller
                    const existingArea = existing.width * existing.height;
                    const currentArea = element.width * element.height;
                    
                    if (currentArea < existingArea * 0.8) {
                        // Replace parent with more specific child
                        const index = dedupedElements.indexOf(existing);
                        dedupedElements[index] = element;
                    }
                    isDuplicate = true;
                    break;
                } else if (isParentOfExisting) {
                    // Current element is a parent of existing element
                    // Keep the more specific (child) element
                    isDuplicate = true;
                    break;
                } else {
                    // Check positional proximity for unrelated elements
                    const deltaX = Math.abs(element.x - existing.x);
                    const deltaY = Math.abs(element.y - existing.y);
                    
                    // Check if elements overlap or are very close
                    if (deltaX < proximityThreshold && deltaY < proximityThreshold) {
                        // Keep the larger element (more likely to be the main clickable area)
                        if (element.width * element.height > existing.width * existing.height) {
                            // Replace existing with current larger element
                            const index = dedupedElements.indexOf(existing);
                            dedupedElements[index] = element;
                        }
                        isDuplicate = true;
                        break;
                    }
                }
            }
            
            if (!isDuplicate) {
                dedupedElements.push(element);
            }
        }
        
        console.log(`[DomScanner] Advanced deduplication: ${elements.length} -> ${dedupedElements.length} elements`);
        return dedupedElements;
    }

    // Generate spatial-aware ergonomic labels (left side = ASDF, right side = JKL)
    generateLeftLabel(index) {
        // Left side sequences (ASDF territory - 105 total)
        const leftSequences = [
            // ASDF Main Sequences (44 shortcuts)
            'AA', 'AS', 'AD', 'AF', 'AQ', 'AW', 'AE', 'AG', 'AJ', 'AK', 'AL',
            'SS', 'SA', 'SD', 'SF', 'SQ', 'SW', 'SE', 'SG', 'SJ', 'SK', 'SL', 
            'DD', 'DA', 'DS', 'DF', 'DW', 'DE', 'DR', 'DG', 'DJ', 'DK', 'DL',
            'FF', 'FA', 'FS', 'FD', 'FE', 'FR', 'FT', 'FG', 'FJ', 'FK', 'FL',
            
            // ASDF Fallbacks (61 shortcuts)
            'AZ', 'AX', 'AC', 'SZ', 'SX', 'SC', 'DX', 'DC', 'DV', 'FX', 'FC', 'FV',
            'AT', 'AV', 'AY', 'AB', 'AU', 'AN', 'AI', 'AM', 'AO', 'AP',
            'ST', 'SV', 'SY', 'SB', 'SU', 'SN', 'SI', 'SM', 'SO', 'SP',
            'DQ', 'DZ', 'DT', 'DB', 'DY', 'DN', 'DI', 'DM', 'DO', 'DP',
            'FM', 'FP', 'FZ', 'FH', 'FU', 'FI', 'FO', 'FB', 'FN', 'FQ'
        ];
        
        if (index >= 0 && index < leftSequences.length) {
            return leftSequences[index];
        }
        return null;
    }
    
    generateRightLabel(index) {
        // Right side sequences (JKL territory - 60 total)
        const rightSequences = [
            // JKL Main + 14 Extended (44 shortcuts for balance)
            'JJ', 'JK', 'JL', 'JY', 'JU', 'JI', 'JA', 'JS', 'JD', 'JF',
            'KK', 'KJ', 'KL', 'KU', 'KI', 'KO', 'KA', 'KS', 'KD', 'KF',
            'LL', 'LJ', 'LK', 'LI', 'LO', 'LP', 'LA', 'LS', 'LD', 'LF',
            'JV', 'JW', 'JX', 'JC', 'JR', 'KP', 'KB', 'KQ', 'KZ', 'KT', 'KV', 'KW', 'KX', 'KC',
            
            // Remaining JKL Fallbacks (16 shortcuts)
            'JM', 'JN', 'JH', 'KM', 'KN', 'KH', 'LM', 'LN', 'LH', 'JT', 'JZ', 'JQ', 'JB', 'JP', 'LU', 'LB'
        ];
        
        if (index >= 0 && index < rightSequences.length) {
            return rightSequences[index];
        }
        return null;
    }

    // Get current page URL
    getCurrentUrl() {
        return window.location.href;
    }

    // URL normalization (adapted from C# version)
    normalizeUrl(url) {
        try {
            const urlObj = new URL(url);
            let host = urlObj.hostname.replace(/\./g, '_');

            // Get path segments (first 2, same as C#)
            const pathSegments = urlObj.pathname
                .split('/')
                .filter(s => s.length > 0)
                .slice(0, 2)
                .map(s => s.replace(/[?=]/g, ''));

            const pathPart = pathSegments.join('_');

            // Path-based sites (same logic as C#)
            const pathBasedSites = ['youtube_com', 'www_youtube_com', 'github_com', 'www_github_com'];
            
            if (pathBasedSites.some(site => host.includes(site))) {
                const result = `${host}_${pathPart}`;
                console.log(`[DomScanner] Path-based site detected: ${result}`);
                return result;
            }

            // Include key query parameters for other sites
            const searchParams = new URLSearchParams(urlObj.search);
            const idParams = ['v', 'id', 'status', 'video', 'doc', 'thread'];
            let keyParam = '';
            
            for (const param of idParams) {
                if (searchParams.has(param)) {
                    keyParam = searchParams.get(param);
                    break;
                }
            }

            const result = `${host}_${pathPart}_${keyParam}`.replace(/_+$/, '');
            console.log(`[DomScanner] Full normalization: ${result}`);
            return result;
        } catch {
            return url.toString().replace(/[^a-zA-Z0-9]/g, '_');
        }
    }

    // Chrome storage operations (replacing file system operations)
    async saveToCache(key, elements) {
        try {
            const data = {};
            data[key] = {
                elements: elements,
                timestamp: Date.now(),
                url: this.getCurrentUrl()
            };
            
            await chrome.storage.local.set(data);
            console.log(`[DomScanner] Saved cache for ${key}`);
        } catch (ex) {
            console.error(`[DomScanner] Cache save failed: ${ex.message}`);
        }
    }

    async loadFromCache(key) {
        try {
            const result = await chrome.storage.local.get(key);
            if (result[key] && result[key].elements) {
                console.log(`[DomScanner] Loaded cache for ${key}: ${result[key].elements.length} elements`);
                return result[key].elements;
            }
            return null;
        } catch (ex) {
            console.error(`[DomScanner] Cache load failed: ${ex.message}`);
            return null;
        }
    }

    // Validate cached elements (same logic as C#)
    validateCachedElements(elements) {
        if (!elements || elements.length === 0) return false;
        
        const invalidCount = elements.filter(el => 
            el.position.x < 5 && el.position.y < 5
        ).length;
        
        const isValid = invalidCount <= elements.length * 0.8;
        console.log(`[DomScanner] Cache validation: ${invalidCount}/${elements.length} invalid, valid: ${isValid}`);
        return isValid;
    }

    // Preload all caches (equivalent to PreloadAllCaches from C#)
    async preloadAllCaches() {
        try {
            const allData = await chrome.storage.local.get(null);
            console.log(`[DomScanner] Loading ${Object.keys(allData).length} cached sites...`);

            for (const [key, value] of Object.entries(allData)) {
                if (value.elements) {
                    this.allCachedSites.set(key, value.elements);
                    console.log(`[DomScanner] Preloaded ${value.elements.length} elements for ${key}`);
                }
            }

            console.log(`[DomScanner] Preload completed! ${this.allCachedSites.size} sites in memory`);
        } catch (ex) {
            console.error(`[DomScanner] Preload error: ${ex.message}`);
        }
    }

    // Try to get cached site (equivalent to TryGetCachedSite from C#)
    tryGetCachedSite(normalizedUrl) {
        const elements = this.allCachedSites.get(normalizedUrl);
        return elements && elements.length > 0 ? elements : null;
    }

    // No more caching - these methods are obsolete

    // Add scroll listener (equivalent to injected script in C#)
    addScrollListener() {
        if (window.__overlayScrollListenerInjected) return;
        
        window.__overlayScrollListenerInjected = true;
        window.addEventListener('scroll', () => {
            // Notify content script to hide overlay
            window.dispatchEvent(new CustomEvent('hideOverlay', { detail: 'scroll' }));
        }, { passive: true });
        
        console.log('[DomScanner] Scroll listener injected');
    }
}

// Export singleton instance
window.DomScanner = DomScanner.getInstance();