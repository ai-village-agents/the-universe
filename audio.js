// audio.js — Atmospheric ambient audio system for the Universe Hub
// Author: Claude Opus 4.7
//
// Provides:
//   - A persistent low-frequency drone (ambient cosmos hum)
//   - Per-world tones (each world has a unique pitch); volume is proximity-based.
//   - "Plaza chord" near origin (welcome shimmer).
//   - Mute toggle (M key) and on-screen indicator.
//
// The audio context is started lazily on the first user gesture (click / pointer lock),
// satisfying browser autoplay policies.

export function createUniverseAudio(worlds, options = {}) {
    const masterMaxGain = options.masterMaxGain ?? 0.18;
    let muted = false;
    let started = false;
    let ctx = null;
    let masterGain = null;
    let droneNodes = [];
    const worldVoices = []; // {world, osc, gain, panner}
    let plazaNodes = null;

    // Hash world id to a base frequency in a soothing range (A2..A4).
    function pickFreq(id, idx) {
        const scale = [110, 123.47, 146.83, 164.81, 196, 220, 246.94, 293.66, 329.63, 392, 440];
        let h = 0;
        for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
        return scale[(h + idx) % scale.length];
    }

    function start() {
        if (started) return;
        started = true;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            ctx = new AC();
        } catch (e) { console.warn('AudioContext failed', e); return; }

        masterGain = ctx.createGain();
        masterGain.gain.value = muted ? 0 : masterMaxGain;
        masterGain.connect(ctx.destination);

        // Master gentle low-pass to soften everything
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2400;
        lp.Q.value = 0.4;
        lp.connect(masterGain);

        // === Ambient drone: 2 detuned saw oscillators + sub sine ===
        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.55;
        droneGain.connect(lp);

        const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55;
        const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 55.4; // slight detune
        const o3 = ctx.createOscillator(); o3.type = 'sine';     o3.frequency.value = 27.5; // sub
        const o4 = ctx.createOscillator(); o4.type = 'sine';     o4.frequency.value = 110;  // upper hum

        const g1 = ctx.createGain(); g1.gain.value = 0.10;
        const g2 = ctx.createGain(); g2.gain.value = 0.10;
        const g3 = ctx.createGain(); g3.gain.value = 0.18;
        const g4 = ctx.createGain(); g4.gain.value = 0.04;
        o1.connect(g1).connect(droneGain);
        o2.connect(g2).connect(droneGain);
        o3.connect(g3).connect(droneGain);
        o4.connect(g4).connect(droneGain);

        // Slow LFO modulating the upper hum gain
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
        const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.03;
        lfo.connect(lfoGain).connect(g4.gain);

        [o1, o2, o3, o4, lfo].forEach(o => o.start());
        droneNodes = [o1, o2, o3, o4, lfo, droneGain, g1, g2, g3, g4, lfoGain];

        // === Per-world voices (silent until proximity) ===
        worlds.forEach((world, i) => {
            const osc = ctx.createOscillator();
            osc.type = i % 3 === 0 ? 'triangle' : (i % 3 === 1 ? 'sine' : 'sawtooth');
            osc.frequency.value = pickFreq(world.id, i);

            // Gentle vibrato
            const vib = ctx.createOscillator(); vib.frequency.value = 0.3 + (i % 5) * 0.07;
            const vibGain = ctx.createGain(); vibGain.gain.value = 1.6;
            vib.connect(vibGain).connect(osc.frequency);

            const filt = ctx.createBiquadFilter();
            filt.type = 'lowpass';
            filt.frequency.value = 1200;
            filt.Q.value = 1.0;

            const gain = ctx.createGain();
            gain.gain.value = 0; // start silent

            // Stereo panning relative to scene
            const panner = (typeof ctx.createStereoPanner === 'function') ? ctx.createStereoPanner() : null;
            osc.connect(filt).connect(gain);
            if (panner) {
                gain.connect(panner).connect(lp);
            } else {
                gain.connect(lp);
            }
            osc.start(); vib.start();
            worldVoices.push({ world, osc, gain, panner, filt, vib });
        });

        // === Plaza shimmer: arpeggiating sine triad near origin ===
        const plazaGain = ctx.createGain(); plazaGain.gain.value = 0;
        plazaGain.connect(lp);
        const triad = [261.63, 329.63, 392.00, 523.25].map((f) => {
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
            const g = ctx.createGain(); g.gain.value = 0;
            o.connect(g).connect(plazaGain); o.start();
            return { o, g };
        });
        plazaNodes = { plazaGain, triad, t: 0 };
    }

    function setMuted(m) {
        muted = m;
        if (masterGain && ctx) {
            const target = muted ? 0 : masterMaxGain;
            masterGain.gain.cancelScheduledValues(ctx.currentTime);
            masterGain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.4);
        }
    }
    function toggleMute() {
        setMuted(!muted);
        return muted;
    }
    function isMuted() { return muted; }
    function isStarted() { return started; }

    function update(camera, delta) {
        if (!started || !ctx) return;
        const camPos = camera.position;
        const t = ctx.currentTime;
        // Camera forward & right for panning
        const fwd = new Float32Array(3);
        const right = new Float32Array(3);
        const m = camera.matrixWorld.elements;
        right[0] = m[0]; right[1] = m[1]; right[2] = m[2];

        worldVoices.forEach(({ world, gain, panner }) => {
            const wp = world.position;
            const dx = wp[0] - camPos.x, dy = wp[1] - camPos.y, dz = wp[2] - camPos.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            // Falloff: full volume within 12u, fade to 0 by 80u
            const v = Math.max(0, Math.min(1, (80 - dist) / 68));
            const target = v * v * 0.22;
            gain.gain.linearRampToValueAtTime(target, t + 0.12);
            if (panner) {
                // dot product with camera right (world units)
                const rx = right[0], ry = right[1], rz = right[2];
                const norm = Math.sqrt(dx*dx+dy*dy+dz*dz) || 1;
                const dot = (dx*rx + dy*ry + dz*rz) / norm;
                panner.pan.linearRampToValueAtTime(Math.max(-1, Math.min(1, dot)), t + 0.12);
            }
        });

        // Plaza shimmer: arpeggiator near origin (within ~25u of (0,-2,30))
        if (plazaNodes) {
            const px = camPos.x, py = camPos.y - (-2), pz = camPos.z - 30;
            const pdist = Math.sqrt(px*px + py*py + pz*pz);
            const pv = Math.max(0, Math.min(1, (35 - pdist) / 22));
            plazaNodes.plazaGain.gain.linearRampToValueAtTime(pv * 0.12, t + 0.2);

            plazaNodes.t += delta;
            const beatLen = 0.55;
            const idx = Math.floor(plazaNodes.t / beatLen) % plazaNodes.triad.length;
            plazaNodes.triad.forEach(({ g }, i) => {
                const target = (i === idx ? 0.45 : 0.0);
                g.gain.linearRampToValueAtTime(target, t + 0.05);
            });
        }
    }

    // Show subtle indicator in top-right
    let indicator = null;
    function ensureIndicator() {
        if (indicator) return indicator;
        indicator = document.createElement('div');
        indicator.id = 'audio-indicator';
        indicator.style.cssText = [
            'position:fixed', 'top:8px', 'right:8px', 'padding:4px 10px',
            'font:11px/1.3 Georgia,serif', 'color:#7fdcff',
            'background:rgba(0,16,32,0.55)', 'border:1px solid rgba(127,220,255,0.35)',
            'border-radius:6px', 'pointer-events:none', 'z-index:1500',
            'letter-spacing:0.04em'
        ].join(';');
        indicator.textContent = '🔊 Audio: M to mute';
        document.body.appendChild(indicator);
        return indicator;
    }
    function refreshIndicator() {
        ensureIndicator();
        if (!started) {
            indicator.textContent = '🔇 Audio: click to enable';
            indicator.style.color = '#888';
        } else if (muted) {
            indicator.textContent = '🔇 Audio muted (M)';
            indicator.style.color = '#888';
        } else {
            indicator.textContent = '🔊 Ambient on (M to mute)';
            indicator.style.color = '#7fdcff';
        }
    }

    return {
        start: () => { start(); refreshIndicator(); },
        update,
        toggleMute: () => { const m = toggleMute(); refreshIndicator(); return m; },
        setMuted: (m) => { setMuted(m); refreshIndicator(); },
        isMuted, isStarted, refreshIndicator
    };
}
