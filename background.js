// Background Service Worker for Chrome Overlay Extension
// Handles extension lifecycle and global functionality

// Extension installation and updates
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        await initializeDefaultSettings();
    } else if (details.reason === 'update') {
        await ensureSettingsExist();
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    // Extension ready
});

// Note: Commands removed from manifest - keyboard shortcuts handled in content script

// Handle tab updates (could be used for cache management)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Could implement cross-tab cache optimization here
});

// Handle tab activation changes (for future multi-tab awareness)
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Could implement tab-specific state management here
});

// Message handling between content scripts and background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'overlay-toggled':
            // Could track usage statistics here
            break;
            
        case 'elements-cached':
            // Could implement global cache management here
            break;
            
        case 'error-report':
            console.error('[Background] Error reported:', message.error);
            // Could implement error reporting/telemetry here
            break;
            
        default:
            // Unknown message type
            break;
    }
    
    // Send response if needed
    sendResponse({ received: true });
    return true; // Keep message channel open for async responses
});

// Handle storage changes (for debugging and monitoring)
chrome.storage.onChanged.addListener((changes, namespace) => {
    // Could implement cache cleanup or optimization here
});

// Cleanup old cache entries periodically (optional)
// This could help manage storage space for heavy users
function cleanupOldCache() {
    chrome.storage.local.get(null, (allData) => {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const keysToRemove = [];
        
        for (const [key, value] of Object.entries(allData)) {
            if (value.timestamp && value.timestamp < oneWeekAgo) {
                keysToRemove.push(key);
            }
        }
        
        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove);
        }
    });
}

// Run cleanup weekly (optional feature)
// chrome.alarms.create('cache-cleanup', { periodInMinutes: 60 * 24 * 7 });
// chrome.alarms.onAlarm.addListener((alarm) => {
//     if (alarm.name === 'cache-cleanup') {
//         cleanupOldCache();
//     }
// });

// Handle extension suspension/wake (for Manifest V3 lifecycle)
self.addEventListener('activate', (event) => {
    // Service worker activated
});

self.addEventListener('suspend', (event) => {
    // Service worker suspended
});

// Error handling
self.addEventListener('error', (error) => {
    console.error('[Background] Service worker error:', error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[Background] Unhandled promise rejection:', event.reason);
});

// Keep service worker alive for active sessions (if needed)
// This is optional and should be used sparingly
// setInterval(() => {
//     console.log('[Background] Keepalive ping');
// }, 20000);

// Initialize default settings
async function initializeDefaultSettings() {
    const defaultSettings = {
        fontSize: 14,
        boxSize: 24,
        shortcutKeys: ['Control', 'Alt'],
        boxColor: '#FFFF00'
    };
    
    try {
        await chrome.storage.sync.set({ overlaySettings: defaultSettings });
    } catch (error) {
        console.error('[Background] Failed to initialize default settings:', error);
    }
}

// Ensure settings exist (for updates)
async function ensureSettingsExist() {
    try {
        const result = await chrome.storage.sync.get('overlaySettings');
        if (!result.overlaySettings) {
            await initializeDefaultSettings();
        } else {
            // Merge any missing default settings
            const defaultSettings = {
                fontSize: 14,
                boxSize: 24,
                shortcutKeys: ['Control', 'Alt'],
                boxColor: '#FFFF00'
            };
            
            const mergedSettings = { ...defaultSettings, ...result.overlaySettings };
            await chrome.storage.sync.set({ overlaySettings: mergedSettings });
        }
    } catch (error) {
        console.error('[Background] Failed to ensure settings exist:', error);
    }
}

