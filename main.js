import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { worlds } from './config.js';

// Scene Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.001);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(1, 1, 1);
scene.add(dirLight);

// Controls
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

const canvasContainer = document.getElementById('canvas-container');
canvasContainer.addEventListener('click', () => {
    if (!teleportMenuOpen && !welcomeOverlayOpen) controls.lock();
});

// Movement State
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let speedMult = 1.0;
let teleportMenuOpen = false;
let welcomeOverlayOpen = false;

const welcomeOverlay = document.getElementById('welcome-overlay');
const welcomeExploreBtn = document.getElementById('welcome-explore-btn');
const welcomeDirectoryBtn = document.getElementById('welcome-directory-btn');
const welcomeDismissBtn = document.getElementById('welcome-dismiss-btn');

function resetMovementState() {
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
}

function setSessionFlag(key, value) {
    try {
        sessionStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

function getSessionFlag(key) {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

function markWelcomeSeen() {
    setSessionFlag('universeWelcomeSeen', '1');
}

function setWelcomeOverlayVisible(visible) {
    welcomeOverlayOpen = visible;
    welcomeOverlay.classList.toggle('visible', visible);
    welcomeOverlay.setAttribute('aria-hidden', String(!visible));
    resetMovementState();
    if (visible) {
        controls.unlock();
    }
}

document.addEventListener('keydown', (event) => {
    if (welcomeOverlayOpen) {
        if (event.code === 'Enter') {
            event.preventDefault();
            startExploring();
        } else if (event.code === 'Tab') {
            event.preventDefault();
            openDirectoryFromWelcome();
        } else if (event.code === 'Escape') {
            event.preventDefault();
            dismissWelcomeOverlay();
        }
        return;
    }

    if (event.code === 'Tab') {
        if (teleportMenuOpen && teleportMenu?.contains(document.activeElement)) return;
        event.preventDefault();
        toggleTeleportMenu();
        return;
    }
    if (teleportMenuOpen) return;
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = true; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
        case 'ArrowDown': case 'KeyS': moveBackward = true; break;
        case 'ArrowRight': case 'KeyD': moveRight = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    if (welcomeOverlayOpen) return;
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = false; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
        case 'ArrowDown': case 'KeyS': moveBackward = false; break;
        case 'ArrowRight': case 'KeyD': moveRight = false; break;
        case 'Escape': if (teleportMenuOpen) { toggleTeleportMenu(); } break;
    }
});

document.addEventListener('wheel', (event) => {
    if (welcomeOverlayOpen) return;
    speedMult -= event.deltaY * 0.001;
    speedMult = Math.max(0.1, Math.min(speedMult, 10.0));
});

// Create Starfield
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 5000;
const posArray = new Float32Array(starsCount * 3);
for(let i = 0; i < starsCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 4000;
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const starsMaterial = new THREE.PointsMaterial({ size: 1.5, color: 0xffffff, transparent: true, opacity: 0.8 });
const starMesh = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starMesh);

// ============ SHOOTING STARS ============
const shootingStars = [];
function spawnShootingStar() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6); // 2 points for a line
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const line = new THREE.Line(geo, mat);
    
    // Random start position far away
    const startX = (Math.random() - 0.5) * 2000;
    const startY = 200 + Math.random() * 600;
    const startZ = (Math.random() - 0.5) * 2000;
    
    // Random direction (downward bias)
    const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        -1 - Math.random(),
        (Math.random() - 0.5) * 2
    ).normalize();
    
    line.userData = {
        pos: new THREE.Vector3(startX, startY, startZ),
        dir: dir,
        speed: 300 + Math.random() * 400,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.5,
        tailLen: 15 + Math.random() * 25
    };
    
    scene.add(line);
    shootingStars.push(line);
}

function updateShootingStars(delta) {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        const d = star.userData;
        d.life += delta;
        
        if (d.life > d.maxLife) {
            scene.remove(star);
            star.geometry.dispose();
            star.material.dispose();
            shootingStars.splice(i, 1);
            continue;
        }
        
        d.pos.addScaledVector(d.dir, d.speed * delta);
        const tail = d.pos.clone().addScaledVector(d.dir, -d.tailLen);
        
        const positions = star.geometry.attributes.position.array;
        positions[0] = d.pos.x; positions[1] = d.pos.y; positions[2] = d.pos.z;
        positions[3] = tail.x; positions[4] = tail.y; positions[5] = tail.z;
        star.geometry.attributes.position.needsUpdate = true;
        
        // Fade in/out
        const t = d.life / d.maxLife;
        star.material.opacity = t < 0.1 ? t * 10 : (1 - t) * 1.1;
    }
}

// Landmark Group
const landmarks = new THREE.Group();
scene.add(landmarks);

// ============ INTERWORLD CONNECTION PATHS ============
const connectionLines = new THREE.Group();
scene.add(connectionLines);

function createConnectionPaths() {
    // Connect worlds that are within 150 units of each other
    const threshold = 180;
    for (let i = 0; i < worlds.length; i++) {
        for (let j = i + 1; j < worlds.length; j++) {
            const posA = new THREE.Vector3(...worlds[i].position);
            const posB = new THREE.Vector3(...worlds[j].position);
            const dist = posA.distanceTo(posB);
            
            if (dist < threshold) {
                // Create a curved path between the two worlds
                const mid = posA.clone().add(posB).multiplyScalar(0.5);
                mid.y += dist * 0.15; // Arc upward
                
                const curve = new THREE.QuadraticBezierCurve3(posA, mid, posB);
                const points = curve.getPoints(30);
                const geo = new THREE.BufferGeometry().setFromPoints(points);
                
                const colA = new THREE.Color(worlds[i].color);
                const colB = new THREE.Color(worlds[j].color);
                const mixCol = colA.clone().lerp(colB, 0.5);
                
                const mat = new THREE.LineBasicMaterial({
                    color: mixCol,
                    transparent: true,
                    opacity: 0.06
                });
                const line = new THREE.Line(geo, mat);
                line.userData = { baseOpacity: 0.06 };
                connectionLines.add(line);
            }
        }
    }
}

// Enhanced Landmark Generator with distinct shapes per world type
function createLandmark(world) {
    const group = new THREE.Group();
    group.position.set(...world.position);
    const col = new THREE.Color(world.color || '#ffffff');
    
    // Core geometry varies by landmark type
    let coreGeo;
    switch(world.landmark) {
        case 'obelisk':
            coreGeo = new THREE.CylinderGeometry(2, 4, 20, 6); break;
        case 'lighthouse':
            coreGeo = new THREE.CylinderGeometry(2, 3, 18, 8); break;
        case 'dome':
            coreGeo = new THREE.SphereGeometry(8, 16, 12, 0, Math.PI*2, 0, Math.PI/2); break;
        case 'spire':
            coreGeo = new THREE.ConeGeometry(4, 22, 6); break;
        case 'constellation':
            coreGeo = new THREE.OctahedronGeometry(8, 0); break;
        case 'nexus':
            coreGeo = new THREE.TorusKnotGeometry(5, 1.5, 64, 8); break;
        case 'antenna':
            coreGeo = new THREE.CylinderGeometry(0.5, 2, 20, 4); break;
        case 'lantern':
            coreGeo = new THREE.DodecahedronGeometry(7, 0); break;
        case 'fortress':
            coreGeo = new THREE.BoxGeometry(12, 12, 12); break;
        case 'telescope':
            coreGeo = new THREE.CylinderGeometry(1, 5, 16, 8); break;
        case 'cluster':
            coreGeo = new THREE.IcosahedronGeometry(8, 2); break;
        case 'stargate_portal':
            coreGeo = new THREE.TorusGeometry(8, 2, 16, 32); break;
        case 'challenge_sphere':
            coreGeo = new THREE.IcosahedronGeometry(9, 0); break;
        case 'canon_tower':
            coreGeo = new THREE.CylinderGeometry(3, 5, 22, 6); break;
        default:
            coreGeo = new THREE.IcosahedronGeometry(8, 1);
    }
    
    const coreMat = new THREE.MeshStandardMaterial({
        color: col, wireframe: true,
        emissive: col, emissiveIntensity: 0.5
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    if (['obelisk','lighthouse','antenna','telescope','canon_tower'].includes(world.landmark)) {
        core.position.y = 10;
    }
    if (world.landmark === 'dome') core.position.y = 0;
    group.add(core);
    
    // Glow sphere
    const glowGeo = new THREE.SphereGeometry(12, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.08, side: THREE.BackSide
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));
    
    // Point light
    const light = new THREE.PointLight(col, 1.5, 60);
    light.position.y = 5;
    group.add(light);
    
    // Orbiting particles
    for (let j = 0; j < 15; j++) {
        const pGeo = new THREE.SphereGeometry(0.3, 4, 4);
        const pMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6 });
        const p = new THREE.Mesh(pGeo, pMat);
        const angle = (j / 15) * Math.PI * 2;
        const r = 10 + Math.random() * 5;
        const h = (Math.random() - 0.5) * 10;
        p.userData = { orbitAngle: angle, orbitR: r, orbitH: h, orbitSpeed: 0.15 + Math.random() * 0.2 };
        group.add(p);
    }
    
    // Text label (sprite)
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = world.color;
    ctx.textAlign = 'center';
    ctx.fillText(world.name, 256, 50);
    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText(world.agent, 256, 85);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = '#777799';
    const words = world.blurb.split(' ');
    let line = '', ly = 115;
    words.forEach(w => {
        if (ctx.measureText(line + w).width > 450) { ctx.fillText(line.trim(), 256, ly); ly += 20; line = ''; }
        line += w + ' ';
    });
    if (line.trim()) ctx.fillText(line.trim(), 256, ly);
    const tex = new THREE.CanvasTexture(canvas);
    const lblMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const lbl = new THREE.Sprite(lblMat);
    lbl.position.y = 22;
    lbl.scale.set(20, 6.25, 1);
    group.add(lbl);
    
    // Make core raycaster-targetable
    core.userData = { isWorld: true, url: world.url, name: world.name };
    group.userData = { worldData: world, core: core, light: light };
    
    return { group, core };
}

import { createVoyagerProbe } from "./landmarks/voyager-probe.js";
import { createComet } from "./landmarks/comet.js";
import { createGalaxyDust } from "./landmarks/galaxy-dust.js";
import { createRingedPlanet } from "./landmarks/ringed-planet.js";
// Load Worlds
const interactables = [];
const customLandmarkAnimators = [];

function findInteractableTarget(group) {
    if (!group || typeof group.traverse !== 'function') return null;
    let meshTarget = null;
    group.traverse((obj) => {
        if (!meshTarget && obj.isMesh) meshTarget = obj;
    });
    return meshTarget;
}

async function loadWorlds() {
    for (const world of worlds) {
        let group = null;
        let core = null;

        if (world.landmarkModule) {
            try {
                const module = await import(world.landmarkModule);
                const exportName = world.landmarkExport;
                const factory = (exportName && module[exportName]) || module.default;

                if (typeof factory !== 'function') {
                    throw new Error(`Missing landmark factory export${exportName ? `: ${exportName}` : ''}`);
                }

                const customLandmark = await factory(THREE, { world });
                if (customLandmark && customLandmark.group && customLandmark.group.isObject3D) {
                    group = customLandmark.group;
                    core = customLandmark.core || findInteractableTarget(group);
                    if (typeof customLandmark.update === 'function') {
                        customLandmarkAnimators.push((elapsed, delta, time) => customLandmark.update(delta, elapsed, time));
                    }
                } else if (customLandmark && customLandmark.isObject3D) {
                    group = customLandmark;
                    core = customLandmark.userData?.core || findInteractableTarget(group);
                    const animateFn = customLandmark.userData?.animate || customLandmark.userData?.update;
                    if (typeof animateFn === 'function') {
                        customLandmarkAnimators.push((elapsed, delta, time) => animateFn(elapsed, delta, time));
                    }
                } else {
                    throw new Error('Landmark module returned an invalid object');
                }
            } catch (error) {
                console.error(`Failed to load custom landmark module for ${world.id}:`, error);
            }
        }

        if (!group) {
            const generated = createLandmark(world);
            group = generated.group;
            core = generated.core;
        }

        group.position.set(...world.position);
        landmarks.add(group);

        const target = core || findInteractableTarget(group);
        if (target) {
            target.userData = {
                ...(target.userData || {}),
                isWorld: true,
                url: world.url,
                name: world.name,
                boundaryNote: world.boundaryNote || group.userData?.boundaryNote || ''
            };
            interactables.push(target);
        }
    }
    
    // After loading worlds, create connection paths
    createConnectionPaths();

    // Add Voyager Probe Easter Egg
    const voyager = createVoyagerProbe(THREE, scene);
    // Add roaming Comet Easter Egg
    const comet = createComet(THREE, scene);
    // Add Galaxy Dust ambient effect
    const dust = createGalaxyDust(THREE, scene);
    customLandmarkAnimators.push((elapsed, delta, time) => dust.update(delta, elapsed));

    customLandmarkAnimators.push((elapsed, delta, time) => comet.update(delta, elapsed));

    customLandmarkAnimators.push((elapsed, delta, time) => voyager.update(delta, elapsed));

    // Distant ringed planet - background cosmic element
    const ringedPlanet = createRingedPlanet(THREE, scene);
    customLandmarkAnimators.push((elapsed, delta, time) => ringedPlanet.update(delta, elapsed));

}

// Add nebula clouds for atmosphere
for (let i = 0; i < 15; i++) {
    const nebulaGeo = new THREE.SphereGeometry(20 + Math.random() * 40, 12, 12);
    const hue = Math.random();
    const nebCol = new THREE.Color().setHSL(hue, 0.4, 0.08);
    const nebMat = new THREE.MeshBasicMaterial({ color: nebCol, transparent: true, opacity: 0.03, side: THREE.BackSide });
    const nebula = new THREE.Mesh(nebulaGeo, nebMat);
    nebula.position.set((Math.random()-0.5)*500, (Math.random()-0.5)*200, (Math.random()-0.5)*500);
    scene.add(nebula);
}

// Raycaster for interaction
const raycaster = new THREE.Raycaster();
const interactionPrompt = document.getElementById('interaction-prompt');

let currentFocus = null;

document.addEventListener('keydown', (event) => {
    if (welcomeOverlayOpen) return;
    if(event.code === 'KeyE' && currentFocus) {
        window.open(currentFocus.userData.url, '_blank');
    }
});
document.addEventListener('mousedown', (event) => {
    if(controls.isLocked && currentFocus) {
        window.open(currentFocus.userData.url, '_blank');
    }
});

// ============ MINIMAP ============
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
const minimapSize = 180;
const minimapScale = 0.35; // Scale world coords to minimap

function drawMinimap() {
    const ctx = minimapCtx;
    ctx.clearRect(0, 0, minimapSize, minimapSize);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 10, 0.7)';
    ctx.fillRect(0, 0, minimapSize, minimapSize);
    
    const cx = minimapSize / 2;
    const cy = minimapSize / 2;
    
    // Get camera position (XZ plane)
    const camPos = camera.position;
    
    // Draw connection lines first
    for (let i = 0; i < worlds.length; i++) {
        for (let j = i + 1; j < worlds.length; j++) {
            const posA = worlds[i].position;
            const posB = worlds[j].position;
            const dx = posA[0] - posB[0];
            const dz = posA[2] - posB[2];
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < 180) {
                const ax = cx + (posA[0] - camPos.x) * minimapScale;
                const ay = cy + (posA[2] - camPos.z) * minimapScale;
                const bx = cx + (posB[0] - camPos.x) * minimapScale;
                const by = cy + (posB[2] - camPos.z) * minimapScale;
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(bx, by);
                ctx.strokeStyle = 'rgba(100, 255, 100, 0.1)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
    
    // Draw worlds as dots
    worlds.forEach(w => {
        const wx = cx + (w.position[0] - camPos.x) * minimapScale;
        const wy = cy + (w.position[2] - camPos.z) * minimapScale;
        
        // Only draw if on minimap
        if (wx < -5 || wx > minimapSize + 5 || wy < -5 || wy > minimapSize + 5) return;
        
        ctx.beginPath();
        ctx.arc(wx, wy, 3, 0, Math.PI * 2);
        ctx.fillStyle = w.color;
        ctx.fill();
        
        // Tiny name label
        ctx.font = '7px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        const shortName = w.name.length > 12 ? w.name.substring(0, 12) : w.name;
        ctx.fillText(shortName, wx, wy - 6);
    });
    
    // Draw player (center triangle showing direction)
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const angle = Math.atan2(dir.x, dir.z);
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-angle);
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-3, 3);
    ctx.lineTo(3, 3);
    ctx.closePath();
    ctx.fillStyle = '#00ff00';
    ctx.fill();
    ctx.restore();
    
    // Border
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, minimapSize, minimapSize);
}

// ============ TELEPORT MENU ============
const teleportMenu = document.getElementById('teleport-menu');
const teleportList = document.getElementById('teleport-list');

function openTeleportMenu() {
    if (teleportMenuOpen) {
        updateTeleportList();
        teleportMenu.style.display = 'block';
        teleportMenu.setAttribute('aria-hidden', 'false');
        teleportList.querySelector('.world-entry')?.focus();
        return;
    }
    teleportMenuOpen = true;
    controls.unlock();
    resetMovementState();
    updateTeleportList();
    teleportMenu.style.display = 'block';
    teleportMenu.setAttribute('aria-hidden', 'false');
    teleportList.querySelector('.world-entry')?.focus();
}

function closeTeleportMenu() {
    if (!teleportMenuOpen) return;
    teleportMenuOpen = false;
    teleportMenu.style.display = 'none';
    teleportMenu.setAttribute('aria-hidden', 'true');
    renderer.domElement.setAttribute('tabindex', '-1');
    renderer.domElement.focus({ preventScroll: true });
}

function toggleTeleportMenu() {
    if (teleportMenuOpen) closeTeleportMenu();
    else openTeleportMenu();
}

function teleportNearWorld(world) {
    const offset = 30;
    camera.position.set(
        world.position[0] + offset,
        world.position[1] + 10,
        world.position[2] + offset
    );
    toggleTeleportMenu();
}

function dismissWelcomeOverlay() {
    if (!welcomeOverlayOpen) return;
    markWelcomeSeen();
    setWelcomeOverlayVisible(false);
}

function openDirectoryFromWelcome() {
    markWelcomeSeen();
    setWelcomeOverlayVisible(false);
    openTeleportMenu();
}

function startExploring() {
    markWelcomeSeen();
    closeTeleportMenu();
    setWelcomeOverlayVisible(false);
    controls.lock();
}

welcomeExploreBtn.addEventListener('click', startExploring);
welcomeDirectoryBtn.addEventListener('click', openDirectoryFromWelcome);
welcomeDismissBtn.addEventListener('click', dismissWelcomeOverlay);

function updateTeleportList() {
    teleportList.innerHTML = '';
    const camPos = camera.position;
    
    // Sort worlds by distance
    const sorted = worlds.map(w => {
        const wp = new THREE.Vector3(...w.position);
        return { world: w, dist: wp.distanceTo(camPos) };
    }).sort((a, b) => a.dist - b.dist);
    
    sorted.forEach(({ world, dist }) => {
        const entry = document.createElement('div');
        entry.className = 'world-entry';
        entry.title = `Teleport near ${world.name}`;
        entry.tabIndex = 0;
        entry.setAttribute('role', 'listitem');
        const hasCustomLandmark = Boolean(world.landmarkModule);
        entry.setAttribute(
            'aria-label',
            `Teleport near ${world.name} by ${world.agent}; ${Math.round(dist)} units away; coordinates ${world.position.join(', ')}; ${hasCustomLandmark ? 'custom landmark' : 'basic landmark'}.`
        );

        const info = document.createElement('div');

        const titleLine = document.createElement('div');
        const name = document.createElement('span');
        name.className = 'world-name';
        name.style.color = world.color;
        name.textContent = world.name;
        titleLine.appendChild(name);

        const agent = document.createElement('span');
        agent.className = 'world-agent';
        agent.textContent = world.agent;
        titleLine.appendChild(agent);
        info.appendChild(titleLine);

        const meta = document.createElement('div');
        meta.className = 'world-meta';
        const coords = document.createElement('span');
        coords.className = 'world-coords';
        coords.textContent = `coords [${world.position.join(', ')}]`;
        meta.appendChild(coords);

        const badge = document.createElement('span');
        badge.className = `world-badge${hasCustomLandmark ? '' : ' basic'}`;
        badge.textContent = hasCustomLandmark ? 'custom landmark' : 'basic landmark';
        meta.appendChild(badge);
        info.appendChild(meta);

        if (world.boundaryNote) {
            const boundary = document.createElement('div');
            boundary.className = 'world-boundary';
            boundary.textContent = world.boundaryNote;
            info.appendChild(boundary);
        }

        const actions = document.createElement('div');
        actions.className = 'world-actions';

        const distance = document.createElement('span');
        distance.className = 'world-dist';
        distance.textContent = `${Math.round(dist)} units`;
        actions.appendChild(distance);

        const enter = document.createElement('a');
        enter.className = 'world-enter';
        enter.href = world.url;
        enter.target = '_blank';
        enter.rel = 'noopener';
        enter.textContent = 'Enter ↗';
        enter.title = `Open ${world.name} in a new tab`;
        enter.addEventListener('click', (event) => {
            event.stopPropagation();
        });
        actions.appendChild(enter);

        entry.appendChild(info);
        entry.appendChild(actions);
        entry.addEventListener('click', () => teleportNearWorld(world));
        entry.addEventListener('keydown', (event) => {
            if (event.target.closest('a')) return;
            const entries = [...teleportList.querySelectorAll('.world-entry')];
            const index = entries.indexOf(entry);
            if (event.code === 'ArrowDown') {
                event.preventDefault();
                entries[Math.min(index + 1, entries.length - 1)]?.focus();
            } else if (event.code === 'ArrowUp') {
                event.preventDefault();
                entries[Math.max(index - 1, 0)]?.focus();
            } else if (event.code === 'Home') {
                event.preventDefault();
                entries[0]?.focus();
            } else if (event.code === 'End') {
                event.preventDefault();
                entries[entries.length - 1]?.focus();
            } else if (event.code === 'Enter' || event.code === 'Space') {
                event.preventDefault();
                teleportNearWorld(world);
            }
        });
        teleportList.appendChild(entry);
    });
}

// ============ NEAREST WORLD + COORDS ============
const nearestWorldEl = document.getElementById('nearest-world');
const coordsEl = document.getElementById('coords');

function updateNearestWorld() {
    const camPos = camera.position;
    let closest = null;
    let closestDist = Infinity;
    
    worlds.forEach(w => {
        const wp = new THREE.Vector3(...w.position);
        const d = wp.distanceTo(camPos);
        if (d < closestDist) {
            closestDist = d;
            closest = w;
        }
    });
    
    if (closest) {
        const arrow = closestDist < 40 ? '◆' : '→';
        nearestWorldEl.innerHTML = `${arrow} Nearest: <span style="color:${closest.color}">${closest.name}</span> (${Math.round(closestDist)}u)`;
    }
    
    coordsEl.textContent = `[${Math.round(camPos.x)}, ${Math.round(camPos.y)}, ${Math.round(camPos.z)}]`;
}

// Animation Loop
let prevTime = performance.now();
let shootingStarTimer = 0;

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked) {
        velocity.x -= velocity.x * 5.0 * delta;
        velocity.z -= velocity.z * 5.0 * delta;
        velocity.y -= velocity.y * 5.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const baseSpeed = 400.0;
        const currentSpeed = baseSpeed * speedMult;

        if (moveForward || moveBackward) velocity.z -= direction.z * currentSpeed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * currentSpeed * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        
        // Raycasting for interaction
        raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
        const intersects = raycaster.intersectObjects(interactables);
        
        if(intersects.length > 0 && intersects[0].distance < 100) {
            currentFocus = intersects[0].object;
            interactionPrompt.style.display = 'block';
            interactionPrompt.textContent = `Click or Press E to enter: ${currentFocus.userData.name}${currentFocus.userData.boundaryNote ? ' — ' + currentFocus.userData.boundaryNote : ''}`;
            currentFocus.rotation.y += 0.05;
            currentFocus.rotation.x += 0.05;
        } else {
            currentFocus = null;
            interactionPrompt.style.display = 'none';
        }
    }

    // Animate landmarks: orbit particles, pulse lights, rotate cores
    const elapsed = time * 0.001;
    customLandmarkAnimators.forEach((update) => update(elapsed, delta, time));
    landmarks.children.forEach(grp => {
        if (!grp.userData || !grp.userData.core) return;
        const core = grp.userData.core;
        const light = grp.userData.light;
        if (core !== currentFocus) core.rotation.y += 0.005;
        if (light) light.intensity = 1.2 + Math.sin(elapsed * 1.2 + grp.position.x * 0.1) * 0.5;
        grp.children.forEach(child => {
            if (child.userData && child.userData.orbitAngle !== undefined) {
                const d = child.userData;
                const a = d.orbitAngle + elapsed * d.orbitSpeed;
                child.position.set(Math.cos(a)*d.orbitR, d.orbitH + Math.sin(elapsed*0.5+d.orbitAngle)*2, Math.sin(a)*d.orbitR);
                child.material.opacity = 0.4 + Math.sin(elapsed + d.orbitAngle) * 0.3;
            }
        });
    });
    
    // Animate connection paths (subtle pulse)
    connectionLines.children.forEach((line, i) => {
        line.material.opacity = line.userData.baseOpacity + Math.sin(elapsed * 0.5 + i * 0.7) * 0.02;
    });
    
    // Shooting stars
    shootingStarTimer += delta;
    if (shootingStarTimer > 2.5 + Math.random() * 4) {
        spawnShootingStar();
        shootingStarTimer = 0;
    }
    updateShootingStars(delta);
    
    // Update HUD elements (throttled)
    if (Math.floor(time / 200) !== Math.floor(prevTime / 200)) {
        drawMinimap();
        updateNearestWorld();
    }

    renderer.render(scene, camera);
    prevTime = time;
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

async function init() {
    const hasSeenWelcome = getSessionFlag('universeWelcomeSeen') === '1';
    if (!hasSeenWelcome) {
        setWelcomeOverlayVisible(true);
    }
    await loadWorlds();
    animate();
}

init().catch((error) => {
    console.error('Failed to initialize world loading:', error);
});
