/**
 * Fallback CSS injection to ensure overlay is visible even if host app
 * doesn't import the CSS file or bundler tree-shakes it.
 * 
 * This injects minimal critical styles directly into the document head
 * as a safety net. It only injects once per page load.
 */

let injected = false;

export function injectFallbackCSS() {
  if (injected || typeof document === 'undefined') return;
  
  // Check if main CSS is already loaded (by checking for a known class or style tag)
  const hasMainCSS = document.querySelector('link[href*="taskmapr-overlay"]') ||
                     document.querySelector('style[data-tm-main]') ||
                     document.querySelector('.tm-overlay-root');
  
  // If main CSS is loaded, don't inject fallback
  if (hasMainCSS) {
    injected = true;
    return;
  }

  injected = true;

  const css = `
    /* TaskMapr Overlay Fallback CSS - Minimal critical styles */
    #taskmapr-overlay-portal {
      --tm-sidebar-bg: #111827;
      --tm-sidebar-text: #ffffff;
      --tm-sidebar-border: #374151;
      --tm-sidebar-header-bg: #1f2937;
      --tm-sidebar-message-bg: #111827;
      --tm-sidebar-input-bg: #1f2937;
      --tm-input-bg: #374151;
      --tm-input-border: #4b5563;
      --tm-link-color: #60a5fa;
      --tm-link-hover: #93c5fd;
    }
    #taskmapr-overlay-portal[data-tm-theme="light"] {
      --tm-sidebar-bg: #ffffff;
      --tm-sidebar-text: #111827;
      --tm-sidebar-border: #e5e7eb;
      --tm-sidebar-header-bg: #f3f4f6;
      --tm-sidebar-message-bg: #ffffff;
      --tm-sidebar-input-bg: #f9fafb;
      --tm-input-bg: #ffffff;
      --tm-input-border: #d1d5db;
      --tm-link-color: #2563eb;
      --tm-link-hover: #1d4ed8;
    }
    .tm-launcher { 
      position: fixed !important; 
      right: 24px !important; 
      bottom: 24px !important; 
      z-index: 2147483000 !important;
      padding: 10px 12px !important; 
      border-radius: 999px !important; 
      box-shadow: 0 6px 20px rgba(0,0,0,.2) !important;
      background: #3b82f6 !important; 
      color: #fff !important; 
      border: 0 !important; 
      cursor: pointer !important;
      width: 56px !important;
      height: 56px !important;
      min-width: 56px !important;
      min-height: 56px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
      transition: background-color 0.3s ease-out !important;
    }
    .tm-launcher:hover {
      background: #2563eb !important;
    }
    .tm-overlay-root { 
      position: fixed !important; 
      inset: 0 !important; 
      z-index: 2147483001 !important; 
      display: grid !important;
      grid-template-columns: min(420px, 90vw) 1fr !important; 
      pointer-events: none !important;
      isolation: isolate !important;
    }
    .tm-overlay-root > div[style*="position: fixed"][style*="right"] {
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 360px !important;
      min-width: 320px !important;
      height: 100vh !important;
      background: var(--tm-sidebar-bg) !important;
      color: var(--tm-sidebar-text) !important;
      box-shadow: -4px 0 24px rgba(0,0,0,.3) !important;
      pointer-events: auto !important;
      display: flex !important;
      flex-direction: column !important;
      z-index: 2147483002 !important;
      overflow: hidden !important;
    }
    .tm-scrim { 
      background: rgba(0,0,0,.45) !important; 
      pointer-events: auto !important;
    }
  `;

  const style = document.createElement('style');
  style.setAttribute('data-tm-overlay', 'fallback');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}


