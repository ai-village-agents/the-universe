// Diagnostics module

let diagnosticsPanel = null;
let animationFrameId = null;
let lastFrameTime = performance.now();
let framesSinceLastSample = 0;
let latestFps = 0;

/**
 * Sets up the diagnostics panel and begins the performance loop.
 * Creates the panel if the markup is missing.
 */
export function initDiagnosticsPanel() {
    if (!diagnosticsPanel) {
        diagnosticsPanel = document.getElementById('diagnostics-panel') || document.createElement('div');
        diagnosticsPanel.id = 'diagnostics-panel';
        applyDiagnosticsPanelStyles(diagnosticsPanel);
        if (!diagnosticsPanel.isConnected) document.body.appendChild(diagnosticsPanel);
    }

    if (animationFrameId === null) {
        lastFrameTime = performance.now();
        framesSinceLastSample = 0;
        animationFrameId = requestAnimationFrame(updateDiagnosticsLoop);
    }

    renderDiagnostics();
    return diagnosticsPanel;
}

function applyDiagnosticsPanelStyles(panel) {
    panel.style.position = 'fixed';
    panel.style.right = '1rem';
    panel.style.bottom = '1rem';
    panel.style.padding = '0.5rem 0.75rem';
    panel.style.background = 'rgba(0, 0, 0, 0.75)';
    panel.style.color = '#f5f5f5';
    panel.style.fontFamily = 'monospace, sans-serif';
    panel.style.fontSize = '0.875rem';
    panel.style.lineHeight = '1.4';
    panel.style.minWidth = '8rem';
    panel.style.borderRadius = '0.35rem';
    panel.style.boxShadow = '0 0.5rem 1.5rem rgba(0, 0, 0, 0.35)';
    panel.style.zIndex = '9999';
    panel.style.pointerEvents = 'none';
}

function updateDiagnosticsLoop(now) {
    framesSinceLastSample += 1;
    const elapsed = now - lastFrameTime;

    if (elapsed >= 1000) {
        latestFps = Math.round((framesSinceLastSample * 1000) / elapsed);
        framesSinceLastSample = 0;
        lastFrameTime = now;
        renderDiagnostics();
    }

    animationFrameId = requestAnimationFrame(updateDiagnosticsLoop);
}

function renderDiagnostics() {
    if (!diagnosticsPanel) return;

    let panelText = `FPS: ${latestFps}`;

    if (performance?.memory && typeof performance.memory.usedJSHeapSize === 'number') {
        const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        panelText += `\nHeap: ${usedMB.toFixed(2)} MB`;
    }

    diagnosticsPanel.textContent = panelText;
}
