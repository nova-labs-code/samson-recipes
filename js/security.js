// security.js

/**
 * Checks if the script was imported inside another JS file.
 */
function isImported() {
    try {
        throw new Error();
    } catch (e) {
        if (!e.stack) return false;
        const lines = e.stack.split('\n');
        return lines.length > 3 && lines.some(line => line.includes('.js') && !line.includes('security.js'));
    }
}

/**
 * Checks if the current HTML file explicitly includes this security script.
 */
function isCalledInCurrentHTML() {
    // Look at all script tags on the page to see if any point to security.js
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
        if (script.src && script.src.includes('security.js')) {
            return true;
        }
    }
    return false;
}

/**
 * Completely wipes the DOM and displays the formatted error screen.
 */
function triggerVisualBlock(status, errorType, message) {
    if (document.documentElement) {
        document.documentElement.innerHTML = "";
    }

    const failurePayload = {
        status: status,
        error: errorType,
        message: message,
        hostname: window.location.hostname
    };

    document.documentElement.innerHTML = `
        <head>
            <title>${status} ${errorType}</title>
            <style>
                :root {
                    color-scheme: light dark;
                }
                body {
                    margin: 20px;
                    font-family: monospace;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
            </style>
        </head>
        <body>${JSON.stringify(failurePayload, null, 2)}</body>
    `;
    
    window.stop(); 
}

// --- MAIN SECURITY ENGINE ---

// First, check if this is an HTML page that completely ignores/omits this script
if (!isImported() && !isCalledInCurrentHTML()) {
    // The script was somehow invoked dynamically or externally without being in the HTML.
    // Leave the HTML alone entirely and halt execution of this security file.
    throw new Error("Security.js Not Called In Html");
}

try {
    const response = await fetch('/json/alloweddomains.json');
    if (!response.ok) {
        throw new Error("Could not load authorization rules.");
    }
    
    const allowedDomains = await response.json();
    const currentHost = window.location.hostname;
    const isAllowed = allowedDomains.includes(currentHost);

    if (!isAllowed) {
        const errorMsg = "Domain not allowed.";
        
        if (isImported()) {
            throw new Error(`[Security Engine Blocked]: ${errorMsg}`);
        } else {
            triggerVisualBlock(403, "Forbidden", errorMsg);
        }
    }
} catch (error) {
    if (isImported()) {
        throw new Error(`[Security Engine Failure]: ${error.message}`);
    } else {
        if (error.message.includes("Domain not allowed")) {
            triggerVisualBlock(403, "Forbidden", "Execution halted: Domain mismatch.");
        } else {
            triggerVisualBlock(500, "Internal Security Error", error.message);
        }
    }
}

// Export the resolved promise for valid environments
export const isAuthorized = Promise.resolve(true);