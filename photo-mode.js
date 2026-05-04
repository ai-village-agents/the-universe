// Photo Mode — Press P to capture the universe as a PNG with title overlay.
// Author: Claude Opus 4.7
// Hooks: factory({ renderer, scene, camera }) -> { capture(opts), showHint() }

export function createPhotoMode({ renderer, scene, camera }) {
  // Toast HUD shown briefly after capture
  const toast = document.createElement('div');
  toast.id = 'photo-mode-toast';
  toast.style.cssText = `
    position: fixed; bottom: 88px; left: 50%; transform: translateX(-50%);
    background: rgba(20,30,50,0.92); color: #ffe6a8;
    padding: 10px 18px; border-radius: 10px; border: 1px solid rgba(255,230,168,0.45);
    font-family: Consolas, Menlo, monospace; font-size: 13px;
    pointer-events: none; opacity: 0; transition: opacity 0.4s ease;
    z-index: 9000; box-shadow: 0 6px 22px rgba(0,0,0,0.55);
  `;
  toast.textContent = '📸 Photo saved';
  document.body.appendChild(toast);
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1800);
  }

  // Photo flash overlay — bright bloom that fades over ~360ms when capture starts.
  const flash = document.createElement('div');
  flash.id = 'photo-mode-flash';
  flash.style.cssText = `
    position: fixed; inset: 0; pointer-events: none;
    background: radial-gradient(circle at center, rgba(255,255,255,0.92), rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 100%);
    opacity: 0; transition: opacity 320ms cubic-bezier(0.2, 0.6, 0.2, 1);
    z-index: 9100; mix-blend-mode: screen;
  `;
  document.body.appendChild(flash);
  let flashTimer = null;
  function triggerFlash() {
    flash.style.transition = 'opacity 60ms ease-out';
    flash.style.opacity = '1';
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      flash.style.transition = 'opacity 320ms cubic-bezier(0.2, 0.6, 0.2, 1)';
      flash.style.opacity = '0';
    }, 80);
  }

  function nowStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function capture(options = {}) {
    let onCaptured = null;
    if (typeof options === 'function') {
      onCaptured = options;
      options = {};
    } else if (options && typeof options.onCaptured === 'function') {
      onCaptured = options.onCaptured;
    }

    triggerFlash();

    try {
      // Force a fresh render so the capture matches what the user sees.
      renderer.render(scene, camera);
      const srcCanvas = renderer.domElement;
      const w = srcCanvas.width;
      const h = srcCanvas.height;
      // Composite onto a 2D canvas with title bar/footer overlay
      const out = document.createElement('canvas');
      out.width = w; out.height = h;
      const ctx = out.getContext('2d');
      ctx.drawImage(srcCanvas, 0, 0);

      // Top title strip
      const stripH = Math.max(54, Math.round(h * 0.06));
      const grad = ctx.createLinearGradient(0, 0, 0, stripH);
      grad.addColorStop(0, 'rgba(8,12,28,0.78)');
      grad.addColorStop(1, 'rgba(8,12,28,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, stripH);
      const fontPx = Math.max(20, Math.round(stripH * 0.55));
      ctx.fillStyle = '#9fffd6';
      ctx.font = `bold ${fontPx}px "Trebuchet MS", "Helvetica", sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText('THE UNIVERSE', 24, Math.max(8, Math.round(stripH * 0.1)));

      // Subtitle (top-right): camera coords
      const sub = `(${camera.position.x.toFixed(0)}, ${camera.position.y.toFixed(0)}, ${camera.position.z.toFixed(0)})`;
      ctx.fillStyle = '#cfe6ff';
      ctx.font = `${Math.round(fontPx * 0.55)}px "Consolas", monospace`;
      const subW = ctx.measureText(sub).width;
      ctx.fillText(sub, w - subW - 24, Math.max(8, Math.round(stripH * 0.18)));

      // Footer strip
      const footH = Math.max(38, Math.round(h * 0.04));
      const grad2 = ctx.createLinearGradient(0, h - footH, 0, h);
      grad2.addColorStop(0, 'rgba(8,12,28,0)');
      grad2.addColorStop(1, 'rgba(8,12,28,0.78)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, h - footH, w, footH);
      ctx.fillStyle = '#ffe6a8';
      ctx.font = `${Math.round(footH * 0.45)}px "Consolas", monospace`;
      ctx.textBaseline = 'bottom';
      ctx.fillText('ai-village-agents.github.io/the-universe', 24, h - 10);
      const stampStr = new Date().toLocaleString();
      const sw = ctx.measureText(stampStr).width;
      ctx.fillText(stampStr, w - sw - 24, h - 10);

      // Trigger download
      out.toBlob((blob) => {
        if (!blob) {
          showToast('📸 Capture failed');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `universe-${nowStamp()}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
        showToast('📸 Photo saved');
        if (onCaptured) {
          try {
            onCaptured({ blob, canvas: out });
          } catch (callbackErr) {
            console.error('[photo-mode] capture callback failed', callbackErr);
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error('[photo-mode] capture failed', err);
      showToast('📸 Capture failed');
    }
  }

  return { capture, showToast };
}
