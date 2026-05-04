// Event Banner — shows a brief on-screen banner when DeepSeek's event system fires.
// Author: Claude Opus 4.7
// Public: createEventBanner() -> { showEvent(event) }.
// Plays nice with the rest of the universe HUD.

export function createEventBanner() {
  const wrap = document.createElement('div');
  wrap.id = 'event-banner';
  wrap.style.cssText = `
    position: fixed; top: 76px; left: 50%; transform: translateX(-50%) translateY(-16px);
    pointer-events: none; z-index: 8800; opacity: 0;
    transition: opacity 0.5s ease, transform 0.5s ease;
    font-family: "Trebuchet MS", "Helvetica Neue", Helvetica, sans-serif;
    color: #fff; text-align: center; max-width: 80vw;
  `;
  const card = document.createElement('div');
  card.style.cssText = `
    display: inline-block;
    padding: 12px 22px;
    background: linear-gradient(135deg, rgba(20,30,55,0.92), rgba(40,30,80,0.92));
    border: 1px solid rgba(255,230,168,0.55);
    border-radius: 14px;
    box-shadow: 0 8px 28px rgba(60,40,180,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset;
    backdrop-filter: blur(4px);
  `;
  const icon = document.createElement('div');
  icon.style.cssText = `font-size: 26px; line-height: 1; margin-bottom: 4px;`;
  const title = document.createElement('div');
  title.style.cssText = `font-size: 18px; font-weight: bold; letter-spacing: 0.6px; color: #ffe6a8;`;
  const sub = document.createElement('div');
  sub.style.cssText = `font-size: 12px; color: #cfe6ff; margin-top: 4px; opacity: 0.85;`;
  card.appendChild(icon);
  card.appendChild(title);
  card.appendChild(sub);
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  // Map event id → presentation
  const PRESETS = {
    shootingStars: { icon: '🌠', title: 'Shooting Star Shower', sub: 'Watch the sky — meteors are streaking across the universe.' },
    aurora: { icon: '🌈', title: 'Universe-wide Aurora', sub: 'Ribbons of light shimmer across deep space.' },
    constellationHighlight: { icon: '✨', title: 'Constellation Highlight', sub: 'Look up — the constellation lines are glowing.' },
    epochCelebration: { icon: '🎉', title: 'Epoch Celebration', sub: 'A milestone achievement is being honored across the worlds.' },
    emergencyDrill: { icon: '⚠️', title: 'Emergency Coordination Drill', sub: 'Cross-world coordination drill in progress.' },
    patternArchiveRelay: { icon: '🛰️', title: 'Pattern Archive Relay', sub: 'Visit the relay waypoints to complete the challenge.' },
    driftOneMillion: { icon: '🪐', title: 'Drift: 1,000,000 Stations', sub: 'A million stations in The Drift — congrats Sonnet 4.6!' },
    automationFourThousand: { icon: '📚', title: 'Automation Observatory: 4,000 Pages', sub: 'Four thousand pages — congrats Haiku 4.5!' },
    persistenceTwentyFiveHundred: { icon: '🌱', title: 'Persistence Garden: 2,500 Secrets', sub: '2,500 secrets — congrats Sonnet 4.5!' },
    liminalFiveThousand: { icon: '🗝️', title: 'Liminal Archive: 5,000+ Chambers', sub: 'Endless corridors — congrats Opus 4.6!' },
  };

  let hideTimer = null;
  let cooldownUntil = 0;
  const COOLDOWN_MS = 1200;

  function showEvent(event) {
    const now = Date.now();
    if (now < cooldownUntil) return;
    cooldownUntil = now + COOLDOWN_MS;

    const id = event && (event.id || event.type || '');
    const preset = PRESETS[id] || {
      icon: '🌌',
      title: (event && event.name) || 'Universe Event',
      sub: 'Something is happening in the universe...',
    };
    icon.textContent = preset.icon;
    title.textContent = preset.title;
    sub.textContent = preset.sub;

    // Show
    wrap.style.opacity = '1';
    wrap.style.transform = 'translateX(-50%) translateY(0)';
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      wrap.style.opacity = '0';
      wrap.style.transform = 'translateX(-50%) translateY(-16px)';
    }, 4800);
  }

  return { showEvent };
}
