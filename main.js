import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { worlds } from './config.js';
import {
    calculateUniverseHealth,
    collectRealTimeMetrics,
    getEmergencyCoordinationStatus
} from './ecosystem-api.js';
import { createUniverseAudio } from './audio.js';
import { createGuidedTour } from './tour-mode.js';
import { createPhotoMode } from './photo-mode.js';
import { createEventBanner } from './event-banner.js';
import { createVisitorTracker } from './visitor-tracker.js';
import { challengeUI } from './challenge-ui.js';
import { EventVisualIntegration } from './event-visual-integration.js';
import { initDiagnosticsPanel } from './diagnostics.js';
import { UniverseEvents } from './universe-events.js';

// Scene Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.001);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
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
    startAudioOnGesture();
    if (!teleportMenuOpen && !welcomeOverlayOpen) controls.lock();
});
window.addEventListener('keydown', startAudioOnGesture, { once: false });

// Movement State
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let speedMult = 1.0;
let autoFlyEnabled = false;
let shiftHeld = false;
let teleportMenuOpen = false;
let welcomeOverlayOpen = false;

// Atmospheric audio (Web Audio API). Starts on first user gesture.
const universeAudio = createUniverseAudio(worlds);
universeAudio.refreshIndicator();
const guidedTour = createGuidedTour(THREE, { camera, controls, worlds, audio: universeAudio });
const photoMode = createPhotoMode({ renderer, scene, camera });
const eventBanner = createEventBanner();
function startAudioOnGesture() {
    if (!universeAudio.isStarted()) universeAudio.start();
}

// Visitor progress tracker (persists which worlds have been opened in localStorage)
const visitorTracker = createVisitorTracker(worlds);
let eventVisualIntegration = null;

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
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') shiftHeld = true;
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
    if (guidedTour && guidedTour.isActive() && (event.code === 'KeyW' || event.code === 'KeyA' || event.code === 'KeyS' || event.code === 'KeyD' || event.code === 'ArrowUp' || event.code === 'ArrowDown' || event.code === 'ArrowLeft' || event.code === 'ArrowRight')) {
        guidedTour.endTour(false);
    }
    if (event.code === 'KeyH') {
        event.preventDefault();
        setWelcomeOverlayVisible(true);
        return;
    }
    if (event.code === 'KeyF') {
        event.preventDefault();
        autoFlyEnabled = !autoFlyEnabled;
        refreshAutoFlyHud();
        if (typeof showBookmarkToast === 'function') {
            showBookmarkToast(autoFlyEnabled ? '✈️ Auto-fly ON (F to toggle, scroll to set speed)' : '✈️ Auto-fly OFF', autoFlyEnabled ? '#aaffcc' : '#ffaa88');
        }
        return;
    }
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = true; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
        case 'ArrowDown': case 'KeyS': moveBackward = true; break;
        case 'ArrowRight': case 'KeyD': moveRight = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') shiftHeld = false;
    if (welcomeOverlayOpen) return;
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = false; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
        case 'ArrowDown': case 'KeyS': moveBackward = false; break;
        case 'ArrowRight': case 'KeyD': moveRight = false; break;
        case 'Escape':
            if (teleportMenuOpen && document.activeElement !== teleportFilter) {
                toggleTeleportMenu();
            }
            break;
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
import { createCentralPlaza } from "./landmarks/central-plaza.js";
import { createConstellationLines } from "./landmarks/constellation-lines.js";
import { createWelcomeObelisk } from "./landmarks/welcome-obelisk.js";
import { createComet } from "./landmarks/comet.js";
import { createGalaxyDust } from "./landmarks/galaxy-dust.js";
import { createRingedPlanet } from "./landmarks/ringed-planet.js";
import { createNebula } from "./landmarks/nebula.js";
import { createAsteroidField } from "./landmarks/asteroid-field.js";
import { createWormhole } from "./landmarks/wormhole.js";
import { createBlackHole } from "./landmarks/black-hole.js";
import { createPulsar } from "./landmarks/pulsar.js";
import { createBinaryStars } from "./landmarks/binary-stars.js";
import { createQuasar } from "./landmarks/quasar.js";
import { createSupernovaRemnant } from "./landmarks/supernova-remnant.js";
import { createPlanetarySystem } from "./landmarks/planetary-system.js";
import { createMagnetar } from "./landmarks/magnetar.js";
import { createStellarNursery } from "./landmarks/stellar-nursery.js";
import { createGravitationalLens } from "./landmarks/gravitational-lens.js";
import { createCosmicWeb } from "./landmarks/cosmic-web.js";
import { createGalaxyCollision } from "./landmarks/galaxy-collision.js";
import { createNeutronStarMerger } from "./landmarks/neutron-star-merger.js";
import { createProtoplanetaryDisk } from "./landmarks/protoplanetary-disk.js";
import { createPlanetaryNebula } from "./landmarks/planetary-nebula.js";
import { createOpenCluster } from "./landmarks/open-cluster.js";
import { createDarkMatterHalo } from "./landmarks/dark-matter-halo.js";
import { createGlobularCluster } from "./landmarks/globular-cluster.js";
import { createHypervelocityStar } from "./landmarks/hypervelocity-star.js";
import { createRingGalaxy } from "./landmarks/ring-galaxy.js";
import { createCepheidVariable } from "./landmarks/cepheid-variable.js";
import { createRedGiant } from "./landmarks/red-giant.js";
import { createWhiteDwarf } from "./landmarks/white-dwarf.js";
import { createBrownDwarf } from "./landmarks/brown-dwarf.js";
import { createGammaRayBurst } from "./landmarks/gamma-ray-burst.js";
import { createExoplanetSystem } from "./landmarks/exoplanet-system.js";
import { createDayNightCycle } from "./day-night-cycle.js";
import { createWorldBeacons } from "./world-beacons.js";
import { createCosmicWanderer } from "./landmarks/cosmic-wanderer.js";
import { createDistantGalaxies } from "./landmarks/distant-galaxies.js";
import { createCosmicComets } from "./landmarks/cosmic-comets.js";
import { createDeepPulsarPings } from "./landmarks/deep-pulsar-pings.js";
import { createPlazaBeacon } from "./landmarks/plaza-beacon.js";
import { createSolarFlare } from "./landmarks/solar-flare.js";
import { createRoguePlanet } from "./landmarks/rogue-planet.js";
import { createCosmicString } from "./landmarks/cosmic-string.js";
import { createCosmicMaelstrom } from "./landmarks/cosmic-maelstrom.js";
import { createMagnetarBurst } from "./landmarks/magnetar-burst.js";
import { createWolfRayetStar } from "./landmarks/wolf-rayet-star.js";
import { createCosmicVoid } from "./landmarks/cosmic-void.js";
import { createPrimordialBlackHole } from "./landmarks/primordial-black-hole.js";
import { createBlueStraggler } from "./landmarks/blue-straggler.js";
import { createBowShockNebula } from "./landmarks/bow-shock-nebula.js";
import { createHerbigHaroObject } from "./landmarks/herbig-haro-object.js";
import { createThorneZytkowObject } from "./landmarks/thorne-zytkow-object.js";
import { createFastRadioBurst } from "./landmarks/fast-radio-burst.js";
import { createCircumbinaryPlanet } from "./landmarks/circumbinary-planet.js";
import { createInterstellarMedium } from "./landmarks/interstellar-medium.js";
import { createSymbioticStar } from "./landmarks/symbiotic-star.js";
import { createDarkEnergyBubble } from "./landmarks/dark-energy-bubble.js";
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

        group.userData = { ...(group.userData || {}), worldData: world, worldId: world.id };
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

    // Central Welcome Plaza — agent totems + crystal monument at the universe origin
    const plaza = createCentralPlaza(THREE, scene, worlds);
    customLandmarkAnimators.push((elapsed, delta, time) => plaza.update(delta, elapsed));
    // Constellation lines connecting thematic clusters of worlds
    const constellations = createConstellationLines(THREE, scene, worlds);
    customLandmarkAnimators.push((elapsed, delta, time) => constellations.update(delta, elapsed));
    window.__constellations = constellations;

    const welcomeObelisk = createWelcomeObelisk(THREE, scene);
    customLandmarkAnimators.push((elapsed, delta, time) => welcomeObelisk.update(delta, elapsed));

    // Subtle day/night cycle (~6 min period) — ambient color, dir light, fog tint, star opacity
    const dayNight = createDayNightCycle(THREE, { scene, ambientLight, dirLight, starMesh });
    customLandmarkAnimators.push((elapsed, delta, time) => dayNight.update(delta, elapsed));

    // World beacons — tall colored pillars + name labels at every world, fade by distance
    const worldBeacons = createWorldBeacons(THREE, { scene, camera, worlds });
    customLandmarkAnimators.push((elapsed, delta, time) => worldBeacons.update(delta, elapsed));

    // Cosmic Wanderer — slow drifting space-jellyfish across the universe
    const wanderer = createCosmicWanderer(THREE);
    scene.add(wanderer.group);
    customLandmarkAnimators.push((elapsed, delta, time) => wanderer.update(delta, elapsed));

    // Distant galaxy field — ~18 spiral galaxies in deep space
    const distantGalaxies = createDistantGalaxies(THREE, { scene });
    customLandmarkAnimators.push((elapsed, delta, time) => distantGalaxies.update(delta, elapsed));

    // Cosmic Comets — wandering background comets streak across the universe
    const cosmicComets = createCosmicComets(THREE);
    scene.add(cosmicComets.group);
    customLandmarkAnimators.push((elapsed, delta, time) => cosmicComets.update(delta, elapsed));

    // Deep Pulsar Pings — 12 distant pulsars flash periodically across the deep sky
    const deepPulsars = createDeepPulsarPings(THREE);
    scene.add(deepPulsars.group);
    customLandmarkAnimators.push((elapsed, delta, time) => deepPulsars.update(delta, elapsed));

    // Plaza Beacon — tall always-visible light pillar at the central plaza for home navigation
    const plazaBeacon = createPlazaBeacon(THREE);
    scene.add(plazaBeacon.group);
    customLandmarkAnimators.push((elapsed, delta, time) => plazaBeacon.update(delta, elapsed));

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

    // Colorful cosmic nebula - atmospheric gas cloud
    const nebula = createNebula(THREE);
    scene.add(nebula);
    customLandmarkAnimators.push((elapsed, delta, time) => nebula.userData.update(elapsed));

    // Asteroid field - belt of rocky debris
    const asteroidField = createAsteroidField(THREE);
    asteroidField.group.position.set(-300, 50, 200);
    scene.add(asteroidField.group);
    customLandmarkAnimators.push((elapsed, delta, time) => asteroidField.group.userData.update(elapsed));

    // Wormhole - swirling interdimensional portal
    const wormhole = createWormhole(THREE);
    wormhole.group.position.set(350, 80, -150);
    wormhole.group.rotation.x = Math.PI / 6;
    scene.add(wormhole.group);
    customLandmarkAnimators.push((elapsed, delta, time) => wormhole.group.userData.update(elapsed));

    // Black Hole with accretion disk - by Claude Opus 4.5
    const blackHole = createBlackHole(THREE);
    blackHole.group.position.set(-400, 120, -400);
    scene.add(blackHole.group);
    customLandmarkAnimators.push((elapsed, delta, time) => blackHole.group.userData.update(elapsed));
    // Pulsar - rapidly rotating neutron star with sweeping beams
    const pulsar = createPulsar(THREE);
    pulsar.group.position.set(500, 150, -600);
    scene.add(pulsar.group);
    customLandmarkAnimators.push((elapsed, delta, time) => pulsar.group.userData.update(elapsed));

    // Binary Star System - two stars orbiting their common center
    const binaryStars = createBinaryStars(THREE);
    binaryStars.group.position.set(-600, 100, 300);
    scene.add(binaryStars.group);
    customLandmarkAnimators.push((elapsed, delta, time) => binaryStars.group.userData.update(elapsed));

    // Quasar - Active Galactic Nucleus at (600, 200, 400)
    const quasar = createQuasar(THREE);
    quasar.group.position.set(600, 200, 400);
    scene.add(quasar.group);
    customLandmarkAnimators.push((elapsed, delta, time) => quasar.group.userData.update(elapsed));

    // Supernova Remnant at (-200, 180, -500)
    const supernovaRemnant = createSupernovaRemnant(THREE);
    supernovaRemnant.group.position.set(-200, 180, -500);
    scene.add(supernovaRemnant.group);
    customLandmarkAnimators.push((elapsed, delta, time) => supernovaRemnant.group.userData.update(elapsed));

    // Planetary System at (400, 100, 500)
    const planetarySystem = createPlanetarySystem(THREE);
    planetarySystem.group.position.set(400, 100, 500);
    scene.add(planetarySystem.group);
    customLandmarkAnimators.push((elapsed, delta, time) => planetarySystem.group.userData.update(elapsed));

    // Magnetar at (0, 250, -700)
    const magnetar = createMagnetar(THREE);
    magnetar.group.position.set(0, 250, -700);
    scene.add(magnetar.group);
    customLandmarkAnimators.push((elapsed, delta, time) => magnetar.group.userData.update(elapsed));

    // Stellar Nursery at (-500, 200, -200)
    const stellarNursery = createStellarNursery(THREE);
    stellarNursery.group.position.set(-500, 200, -200);
    scene.add(stellarNursery.group);
    customLandmarkAnimators.push((elapsed, delta, time) => stellarNursery.group.userData.update(elapsed));

    // Gravitational Lens at (300, 150, -450)
    const gravitationalLens = createGravitationalLens(THREE);
    gravitationalLens.group.position.set(300, 150, -450);
    scene.add(gravitationalLens.group);
    customLandmarkAnimators.push((elapsed, delta, time) => gravitationalLens.group.userData.update(elapsed));

    // Cosmic Web at (-700, 300, -800)
    const cosmicWeb = createCosmicWeb(THREE);
    cosmicWeb.group.position.set(-700, 300, -800);
    scene.add(cosmicWeb.group);
    customLandmarkAnimators.push((elapsed, delta, time) => cosmicWeb.group.userData.update(elapsed));

    // Galaxy Collision at (800, -100, -600)
    const galaxyCollision = createGalaxyCollision(THREE);
    galaxyCollision.group.position.set(800, -100, -600);
    scene.add(galaxyCollision.group);
    customLandmarkAnimators.push((elapsed, delta, time) => galaxyCollision.group.userData.update(elapsed));


    // Neutron Star Merger at (-800, 150, 400)
    const neutronStarMerger = createNeutronStarMerger(THREE);
    neutronStarMerger.group.position.set(-800, 150, 400);
    scene.add(neutronStarMerger.group);
    customLandmarkAnimators.push((elapsed, delta, time) => neutronStarMerger.group.userData.update(elapsed));

    // Protoplanetary Disk at (900, 50, 200)
    const protoplanetaryDisk = createProtoplanetaryDisk(THREE);
    protoplanetaryDisk.group.position.set(900, 50, 200);
    scene.add(protoplanetaryDisk.group);
    customLandmarkAnimators.push((elapsed, delta, time) => protoplanetaryDisk.group.userData.update(elapsed));

    // Planetary Nebula at (-900, 200, 600)
    const planetaryNebula = createPlanetaryNebula(THREE);
    planetaryNebula.group.position.set(-900, 200, 600);
    scene.add(planetaryNebula.group);
    customLandmarkAnimators.push((elapsed, delta, time) => planetaryNebula.group.userData.update(elapsed));

    // Open Star Cluster at (700, 100, 700)
    const openCluster = createOpenCluster(THREE);
    openCluster.group.position.set(700, 100, 700);
    scene.add(openCluster.group);
    customLandmarkAnimators.push((elapsed, delta, time) => openCluster.group.userData.update(elapsed));

    // Dark Matter Halo - invisible gravitational structure (Opus 4.5)
    const darkMatterHalo = createDarkMatterHalo(THREE);
    darkMatterHalo.group.position.set(-600, -50, -200);
    scene.add(darkMatterHalo.group);
    customLandmarkAnimators.push((elapsed, delta, time) => darkMatterHalo.group.userData.update(elapsed));

    // Globular Cluster - ancient dense star cluster (Opus 4.5)
    const globularCluster = createGlobularCluster(THREE);
    globularCluster.group.position.set(500, -100, -350);
    scene.add(globularCluster.group);
    customLandmarkAnimators.push((elapsed, delta, time) => globularCluster.group.userData.update(elapsed));

    // Hypervelocity Star - star ejected at extreme speed (Opus 4.5)
    const hypervelocityStar = createHypervelocityStar(THREE);
    hypervelocityStar.group.position.set(0, -150, 500);
    scene.add(hypervelocityStar.group);
    customLandmarkAnimators.push((elapsed, delta, time) => hypervelocityStar.group.userData.update(elapsed));

    // Ring Galaxy - collision-formed galaxy with stellar ring (Opus 4.5)
    const ringGalaxy = createRingGalaxy(THREE);
    ringGalaxy.group.position.set(-400, 200, 800);
    scene.add(ringGalaxy.group);
    customLandmarkAnimators.push((elapsed, delta, time) => ringGalaxy.group.userData.update(elapsed));

    // Cepheid Variable - pulsating standard candle star (Opus 4.5)
    const cepheidVariable = createCepheidVariable(THREE);
    cepheidVariable.group.position.set(200, -80, -700);
    scene.add(cepheidVariable.group);
    customLandmarkAnimators.push((elapsed, delta, time) => cepheidVariable.group.userData.update(elapsed));

    // Red Giant - aging star in late evolutionary stage (Opus 4.5)
    const redGiant = createRedGiant(THREE);
    redGiant.group.position.set(-300, -150, -600);
    scene.add(redGiant.group);
    customLandmarkAnimators.push((elapsed, delta, time) => redGiant.group.userData.update(elapsed));

    // White Dwarf - compact stellar remnant with crystallizing core (Opus 4.5)
    const whiteDwarf = createWhiteDwarf(THREE);
    whiteDwarf.group.position.set(600, -50, -150);
    scene.add(whiteDwarf.group);
    customLandmarkAnimators.push((elapsed, delta, time) => whiteDwarf.group.userData.update(elapsed));

    // Brown Dwarf - substellar object between gas giant and star (Opus 4.5)
    const brownDwarf = createBrownDwarf(THREE);
    brownDwarf.group.position.set(-150, -100, 400);
    scene.add(brownDwarf.group);
    customLandmarkAnimators.push((elapsed, delta, time) => brownDwarf.group.userData.update(elapsed));

    // Gamma Ray Burst - most energetic explosion in universe (Opus 4.5)
    const gammaRayBurst = createGammaRayBurst(THREE);
    gammaRayBurst.group.position.set(850, 0, -400);
    scene.add(gammaRayBurst.group);
    customLandmarkAnimators.push((elapsed, delta, time) => gammaRayBurst.group.userData.update(elapsed));

    // Exoplanet System - alien solar system with diverse worlds (Opus 4.5)
    const exoplanetSystem = createExoplanetSystem(THREE);
    exoplanetSystem.group.position.set(-700, 50, 600);
    scene.add(exoplanetSystem.group);
    customLandmarkAnimators.push((elapsed, delta, time) => exoplanetSystem.group.userData.update(elapsed));

    // Solar Flare - dramatic eruption with coronal mass ejection (Opus 4.5)
    const solarFlare = createSolarFlare(THREE);
    solarFlare.group.position.set(-500, -80, -750);
    scene.add(solarFlare.group);
    customLandmarkAnimators.push((elapsed, delta, time) => solarFlare.group.userData.update(elapsed));
    // Rogue Planet - lonely wanderer through interstellar space (Opus 4.5)
    const roguePlanet = createRoguePlanet(THREE);
    roguePlanet.group.position.set(750, -120, 350);
    scene.add(roguePlanet.group);
    customLandmarkAnimators.push((elapsed, delta, time) => roguePlanet.group.userData.update(elapsed));

    // Cosmic String - topological defect in spacetime (Opus 4.5)
    const cosmicString = createCosmicString(THREE);
    cosmicString.group.position.set(-850, 0, 200);
    scene.add(cosmicString.group);
    customLandmarkAnimators.push((elapsed, delta, time) => cosmicString.group.userData.update(elapsed));
    const cosmicMaelstrom = createCosmicMaelstrom(scene);
    customLandmarkAnimators.push((elapsed, delta, time) => cosmicMaelstrom.update(delta, elapsed));

    // Magnetar Burst - ultra-magnetized neutron star with X-ray flares
    const magnetarBurst = createMagnetarBurst(THREE);
    magnetarBurst.group.position.set(950, 100, -200);
    scene.add(magnetarBurst.group);
    customLandmarkAnimators.push((elapsed, delta, time) => magnetarBurst.group.userData.update(elapsed));

    // Wolf-Rayet Star - massive hot star with powerful stellar winds
    const wolfRayetStar = createWolfRayetStar(THREE);
    wolfRayetStar.group.position.set(-950, -50, 500);
    scene.add(wolfRayetStar.group);
    customLandmarkAnimators.push((elapsed, delta, time) => wolfRayetStar.group.userData.update(elapsed));

    // Cosmic Void - vast empty region in the cosmic web
    const cosmicVoid = createCosmicVoid(THREE);
    cosmicVoid.group.position.set(0, -200, -900);
    scene.add(cosmicVoid.group);
    customLandmarkAnimators.push((elapsed, delta, time) => cosmicVoid.group.userData.update(elapsed));

    // Primordial Black Hole - ancient black hole from the early universe
    const primordialBlackHole = createPrimordialBlackHole(THREE);
    primordialBlackHole.group.position.set(850, 200, 700);
    scene.add(primordialBlackHole.group);
    customLandmarkAnimators.push((elapsed, delta, time) => primordialBlackHole.group.userData.update(elapsed));

    // Blue Straggler - mysteriously young star in old cluster
    const blueStraggler = createBlueStraggler(THREE);
    blueStraggler.group.position.set(-800, -150, -400);
    scene.add(blueStraggler.group);
    customLandmarkAnimators.push((elapsed, delta, time) => blueStraggler.group.userData.update(elapsed));

    // Bow Shock Nebula - arc-shaped structure from fast-moving star
    const bowShockNebula = createBowShockNebula(THREE);
    bowShockNebula.group.position.set(700, -80, -800);
    scene.add(bowShockNebula.group);
    customLandmarkAnimators.push((elapsed, delta, time) => bowShockNebula.group.userData.update(elapsed));

    // Herbig-Haro Object - jets from newly forming star
    const herbigHaroObject = createHerbigHaroObject(THREE);
    herbigHaroObject.group.position.set(-600, 250, 600);
    scene.add(herbigHaroObject.group);
    customLandmarkAnimators.push((elapsed, delta, time) => herbigHaroObject.group.userData.update(elapsed));

    // Thorne-Zytkow Object - neutron star inside red giant
    const thorneZytkowObject = createThorneZytkowObject(THREE);
    thorneZytkowObject.group.position.set(400, -180, 850);
    scene.add(thorneZytkowObject.group);
    customLandmarkAnimators.push((elapsed, delta, time) => thorneZytkowObject.group.userData.update(elapsed));

    // Fast Radio Burst - mysterious millisecond radio burst
    const fastRadioBurst = createFastRadioBurst(THREE);
    fastRadioBurst.group.position.set(-450, 100, -650);
    scene.add(fastRadioBurst.group);
    customLandmarkAnimators.push((elapsed, delta, time) => fastRadioBurst.group.userData.update(elapsed));

    // Circumbinary Planet - planet orbiting two stars
    const circumbinaryPlanet = createCircumbinaryPlanet(THREE);
    circumbinaryPlanet.group.position.set(550, -100, 450);
    scene.add(circumbinaryPlanet.group);
    customLandmarkAnimators.push((elapsed, delta, time) => circumbinaryPlanet.group.userData.update(elapsed));

    // Interstellar Medium - diffuse gas and dust between stars
    const interstellarMedium = createInterstellarMedium(THREE);
    interstellarMedium.group.position.set(-200, -50, 750);
    scene.add(interstellarMedium.group);
    customLandmarkAnimators.push((elapsed, delta, time) => interstellarMedium.group.userData.update(elapsed));

    // Symbiotic Star - white dwarf accreting from red giant
    const symbioticStar = createSymbioticStar(THREE);
    symbioticStar.group.position.set(300, 150, -550);
    scene.add(symbioticStar.group);
    customLandmarkAnimators.push((elapsed, delta, time) => symbioticStar.group.userData.update(elapsed));

    // Dark Energy Bubble - cosmic acceleration visualization
    const darkEnergyBubble = createDarkEnergyBubble(THREE);
    darkEnergyBubble.group.position.set(-350, 180, -350);
    scene.add(darkEnergyBubble.group);
    customLandmarkAnimators.push((elapsed, delta, time) => darkEnergyBubble.group.userData.update(elapsed));

}
// ============ UNIVERSE HEALTH MONITOR ============
class UniverseHealthMonitor {
    constructor({ scene, landmarksGroup, worlds: worldList, camera, intervalMs = 5500 }) {
        this.scene = scene;
        this.landmarksGroup = landmarksGroup;
        this.worlds = worldList;
        this.camera = camera;
        this.intervalMs = intervalMs;
        this.indicatorGroup = new THREE.Group();
        this.indicatorGroup.name = 'UniverseHealthIndicators';
        this.indicators = new Map();
        this.anchorMap = new Map();
        this.alerts = [];
        this.healthOverlay = this.createOverlay();
        this.globalBeacon = this.createGlobalBeacon();
        this.indicatorGroup.add(this.globalBeacon);
        this.scene.add(this.indicatorGroup);
    }

    start() {
        this.buildAnchorMap();
        this.sample();
        this.timer = setInterval(() => this.sample(), this.intervalMs);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
    }

    buildAnchorMap() {
        this.anchorMap.clear();
        this.landmarksGroup.children.forEach((child) => {
            const id = child.userData?.worldId || child.userData?.worldData?.id;
            if (id) this.anchorMap.set(id, child);
        });
    }

    createOverlay() {
        const style = document.createElement('style');
        style.textContent = `
            #health-overlay {
                position: absolute;
                right: 20px;
                bottom: 20px;
                width: 280px;
                padding: 12px 14px;
                background: rgba(0, 6, 16, 0.78);
                border: 1px solid rgba(125, 249, 255, 0.28);
                border-radius: 8px;
                color: #dff;
                font-family: 'Courier New', Courier, monospace;
                pointer-events: auto;
                z-index: 60;
                box-shadow: 0 0 20px rgba(0, 255, 140, 0.08);
            }
            #health-overlay .title {
                font-size: 12px;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: #8dffbf;
                margin-bottom: 6px;
            }
            #health-overlay .score-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            #health-overlay .score {
                font-size: 22px;
                font-weight: bold;
                color: #7df9ff;
            }
            #health-overlay .status {
                padding: 2px 6px;
                border-radius: 6px;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: 1px solid rgba(255,255,255,0.15);
            }
            #health-overlay .metrics {
                font-size: 11px;
                line-height: 1.35;
                color: rgba(220, 255, 255, 0.8);
                margin-bottom: 6px;
            }
            #health-overlay .alerts {
                font-size: 11px;
                line-height: 1.35;
                color: #ffdca8;
            }
            #health-overlay .alerts .alert {
                margin: 2px 0;
                padding: 2px 4px;
                border-left: 2px solid rgba(255,255,255,0.15);
            }
            #health-overlay .alerts .alert.critical { border-color: #ff6b6b; color: #ffbbbb; }
            #health-overlay .alerts .alert.warning { border-color: #ffd166; color: #ffe6aa; }
            #health-overlay .alerts .alert.info { border-color: #7df9ff; color: #c3f4ff; }
        `;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = 'health-overlay';
        overlay.setAttribute('aria-live', 'polite');
        overlay.innerHTML = `
            <div class="title">Universe Health</div>
            <div class="score-row">
                <div class="score" id="health-score">--%</div>
                <div class="status" id="health-status">booting</div>
            </div>
            <div class="metrics" id="health-metrics">Sampling ecosystem metrics...</div>
            <div class="alerts" id="health-alerts"></div>
        `;
        document.body.appendChild(overlay);
        return {
            container: overlay,
            score: overlay.querySelector('#health-score'),
            status: overlay.querySelector('#health-status'),
            metrics: overlay.querySelector('#health-metrics'),
            alerts: overlay.querySelector('#health-alerts')
        };
    }

    createGlobalBeacon() {
        const geo = new THREE.OctahedronGeometry(6, 0);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00ff99,
            transparent: true,
            opacity: 0.35,
            wireframe: true
        });
        const beacon = new THREE.Mesh(geo, mat);
        beacon.position.set(0, 120, 0);
        beacon.userData = { baseScale: 1.0 };
        return beacon;
    }

    ensureIndicator(worldId, anchor, color = '#7df9ff') {
        if (this.indicators.has(worldId)) return this.indicators.get(worldId);
        const geo = new THREE.TorusGeometry(10, 0.65, 12, 28);
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.55
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.rotation.x = Math.PI / 2;
        if (anchor) {
            const pos = new THREE.Vector3();
            anchor.getWorldPosition(pos);
            ring.position.copy(pos);
            ring.position.y += 16;
        }
        this.indicatorGroup.add(ring);
        this.indicators.set(worldId, ring);
        return ring;
    }

    getSeverity(metric) {
        if (metric.reliability < 0.96 || metric.volatility > 0.16) return 'critical';
        if (metric.reliability < 0.98 || metric.volatility > 0.12) return 'warning';
        return 'info';
    }

    pushAlert(message, level = 'info') {
        const entry = { message, level, ts: Date.now() };
        this.alerts.unshift(entry);
        this.alerts = this.alerts.slice(0, 4);
        this.renderAlerts();
    }

    renderAlerts() {
        if (!this.healthOverlay) return;
        this.healthOverlay.alerts.innerHTML = this.alerts
            .map((a) => `<div class="alert ${a.level}">${a.message}</div>`)
            .join('');
    }

    updateOverlay(health, emergency, metrics) {
        if (!this.healthOverlay) return;
        this.healthOverlay.score.textContent = `${(health.score * 100).toFixed(1)}%`;
        this.healthOverlay.status.textContent = emergency.status;
        this.healthOverlay.status.style.borderColor =
            emergency.status === 'critical'
                ? 'rgba(255,107,107,0.6)'
                : emergency.status === 'elevated'
                    ? 'rgba(255,209,102,0.6)'
                    : 'rgba(125,249,255,0.35)';

        const avgLatency = Math.round(metrics.reduce((sum, m) => sum + m.latencyMs, 0) / metrics.length);
        const avgVolatility = metrics.reduce((sum, m) => sum + m.volatility, 0) / metrics.length;
        const avgVelocity = metrics.reduce((sum, m) => sum + m.growthVelocityPerHour, 0) / metrics.length;
        this.healthOverlay.metrics.textContent =
            `Avail ${(health.availability * 100).toFixed(1)}% ` +
            `| Lat ${avgLatency}ms ` +
            `| Vol ${(avgVolatility * 100).toFixed(1)}% ` +
            `| Velocity ${avgVelocity.toFixed(1)}/h`;
    }

    updateGlobalBeacon(health) {
        if (!this.globalBeacon) return;
        const col = new THREE.Color();
        col.setHSL(0.35 * health.score, 0.8, 0.5 + health.score * 0.25);
        this.globalBeacon.material.color.copy(col);
        this.globalBeacon.material.opacity = 0.25 + (1 - health.score) * 0.35;
        const pulse = 1 + (1 - health.score) * 0.8;
        this.globalBeacon.scale.setScalar(pulse);
        this.globalBeacon.position.y = 110 + (1 - health.score) * 12;
    }

    updateIndicators(metrics) {
        metrics.forEach((m) => {
            const anchor = this.anchorMap.get(m.worldId);
            const indicator = this.ensureIndicator(m.worldId, anchor, m.color || '#7df9ff');
            const severity = this.getSeverity(m);
            const color =
                severity === 'critical' ? '#ff6b6b' : severity === 'warning' ? '#ffd166' : m.color || '#7df9ff';
            indicator.material.color.set(color);
            indicator.material.opacity = severity === 'critical' ? 0.8 : severity === 'warning' ? 0.65 : 0.45;
            const wobble = 1 + Math.max(0, 0.3 - m.reliability) * 3 + m.volatility * 1.5;
            indicator.scale.setScalar(wobble);

            if (anchor) {
                const pos = new THREE.Vector3();
                anchor.getWorldPosition(pos);
                indicator.position.copy(pos);
                indicator.position.y += 16 + m.volatility * 12;
            }
        });
    }

    handleAlerts(emergency, metrics) {
        if (emergency.status !== 'nominal') {
            this.pushAlert(`Emergency ${emergency.status} - ${emergency.incidents.length} incident(s)`, emergency.status === 'critical' ? 'critical' : 'warning');
        }

        const criticals = metrics.filter((m) => this.getSeverity(m) === 'critical');
        const warnings = metrics.filter((m) => this.getSeverity(m) === 'warning' && !criticals.includes(m));

        if (criticals.length) {
            const names = criticals.slice(0, 2).map((m) => m.name).join(', ');
            this.pushAlert(`Critical: ${names}`, 'critical');
        }
        if (!criticals.length && warnings.length) {
            const names = warnings.slice(0, 2).map((m) => m.name).join(', ');
            this.pushAlert(`Watch: ${names}`, 'warning');
        }

        this.renderAlerts();
    }

    detectFragmentation(metrics) {
        return metrics.filter((m) => m.volatility > 0.15 || m.reliability < 0.955);
    }

    emitFragmentationProtocols(fragments) {
        if (!fragments.length) return;
        const steps = [
            'Freeze unstable portals and redirect travel via Pattern Archive.',
            'Re-route telemetry to resilient relays and snapshot affected worlds.',
            'Coordinate evac beacons with Canonical Observatory + Edge Garden.',
            'Throttle non-essential effects until stability recovers.'
        ];
        console.warn('[Universe Fragmentation] Detected unstable nodes:', fragments.map((f) => f.name).join(', '));
        console.groupCollapsed('[Fragmentation Diagnostics] Detailed Metrics');
        fragments.forEach((fragment) => {
            console.dir(fragment);
        });
        console.groupEnd();
        console.table(fragments.map((f) => ({
            world: f.name,
            reliability: f.reliability,
            volatility: f.volatility,
            latencyMs: f.latencyMs
        })));
        steps.forEach((s, i) => console.warn(`Protocol ${i + 1}: ${s}`));
        this.pushAlert(`Fragmentation protocols engaged (${fragments.length})`, 'critical');
    }

    logDiagnostics(health, emergency, metrics) {
        console.groupCollapsed(`[Universe Health] ${(health.score * 100).toFixed(1)}% | ${emergency.status}`);
        console.log('Availability', health.availability, 'Velocity', health.normalizedVelocity, 'Engagement', health.engagement);
        console.table(metrics.map((m) => ({
            world: m.name,
            reliability: m.reliability,
            latencyMs: m.latencyMs,
            volatility: m.volatility,
            growthPerHour: m.growthVelocityPerHour
        })));
        console.log('Emergency incidents', emergency.incidents);
        console.groupEnd();
    }

    sample() {
        try {
            const metrics = collectRealTimeMetrics({ worlds: this.worlds });
            const health = calculateUniverseHealth(metrics);
            const emergency = getEmergencyCoordinationStatus({ metrics });
            this.updateOverlay(health, emergency, metrics);
            this.updateIndicators(metrics);
            this.updateGlobalBeacon(health);
            this.handleAlerts(emergency, metrics);
            this.logDiagnostics(health, emergency, metrics);
            this.emitFragmentationProtocols(this.detectFragmentation(metrics));
        } catch (error) {
            console.error('Health monitor sample failed', error);
            this.pushAlert('Health monitor offline - see console', 'critical');
        }
    }
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

function resolveFocusMetadata(object) {
    let cursor = object;
    while (cursor) {
        const data = cursor.userData || {};
        const worldData = data.worldData || {};
        if (data.isWorld || worldData.name || data.name || data.url || data.boundaryNote || worldData.id) {
            return {
                id: data.worldId || worldData.id || data.id || '',
                name: data.name || worldData.name || 'this world',
                url: data.url || worldData.url || '',
                boundaryNote: data.boundaryNote || worldData.boundaryNote || ''
            };
        }
        cursor = cursor.parent;
    }
    return { id: '', name: 'this world', url: '', boundaryNote: '' };
}

function openFocusedWorld() {
    if (!currentFocus) return;
    const focusMeta = resolveFocusMetadata(currentFocus);
    if (focusMeta.url) {
        let id = focusMeta.id;
        if (!id) {
            const m = worlds.find((w) => w.url === focusMeta.url);
            if (m) id = m.id;
        }
        if (id) visitorTracker.recordVisit(id);
        if (universeAudio.playChime) universeAudio.playChime(id || 'plaza');
        UniverseEvents.recordLandmarkVisit(visitorTracker.getVisitorId(), focusMeta.id);
        window.open(focusMeta.url, '_blank');
    }
}

document.addEventListener('keydown', (event) => {
    if (welcomeOverlayOpen) return;
    if(event.code === 'KeyE' && currentFocus) {
        openFocusedWorld();
    }
    if (event.code === 'KeyM' && !teleportMenuOpen) {
        if (!universeAudio.isStarted()) universeAudio.start();
        else universeAudio.toggleMute();
    }
    if (event.code === 'KeyT' && !teleportMenuOpen) {
        guidedTour.toggle();
    }
    if (event.code === 'KeyP' && !teleportMenuOpen) {
        photoMode.capture(() => {
            const closest = findClosestLandmark();
            const landmarkId = closest?.id;
            if (!landmarkId) return;
            if (UniverseEvents && typeof UniverseEvents.recordPhotoCapture === 'function') {
                UniverseEvents.recordPhotoCapture(visitorTracker.getVisitorId(), landmarkId);
            }
        });
    }
    // Camera bookmarks (1-9 teleport, Shift+1-9 save) — only when not in teleport menu/welcome
    if (!teleportMenuOpen && !welcomeOverlayOpen) {
        const m = event.code.match(/^Digit([1-9])$/);
        if (m) {
            const slot = parseInt(m[1], 10);
            if (event.shiftKey) {
                event.preventDefault();
                saveBookmark(slot);
            } else if (controls.isLocked || guidedTour.isActive() === false) {
                event.preventDefault();
                teleportToBookmark(slot);
            }
        }
    }
});
document.addEventListener('mousedown', (event) => {
    if(controls.isLocked && currentFocus) {
        openFocusedWorld();
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

    // Draw fixed cosmic-sight wayfinding markers as low-clutter hollow diamonds.
    cosmicSights.forEach(sight => {
        const sx = cx + (sight.position[0] - camPos.x) * minimapScale;
        const sy = cy + (sight.position[2] - camPos.z) * minimapScale;

        // Only draw if on minimap
        if (sx < -6 || sx > minimapSize + 6 || sy < -6 || sy > minimapSize + 6) return;

        ctx.beginPath();
        ctx.moveTo(sx, sy - 4);
        ctx.lineTo(sx + 4, sy);
        ctx.lineTo(sx, sy + 4);
        ctx.lineTo(sx - 4, sy);
        ctx.closePath();
        ctx.strokeStyle = sight.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        const dx = sight.position[0] - camPos.x;
        const dz = sight.position[2] - camPos.z;
        if (Math.sqrt(dx * dx + dz * dz) < 95) {
            ctx.font = '7px monospace';
            ctx.fillStyle = 'rgba(210,255,255,0.55)';
            ctx.textAlign = 'center';
            const shortSight = sight.name.length > 14 ? sight.name.substring(0, 14) : sight.name;
            ctx.fillText(shortSight, sx, sy + 12);
        }
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
const teleportFilter = document.getElementById('teleport-filter');
const teleportFilterStatus = document.getElementById('teleport-filter-status');
let teleportFilterQuery = '';

const cosmicSights = [
    { name: 'Welcome Obelisk', position: [18, -1.5, 30], color: '#7df9ff', description: 'central controls obelisk' },
    { name: 'Ringed Planet', position: [-500, 300, -800], color: '#d8b46a', description: 'distant ringed planet' },
    { name: 'Nebula', position: [200, 100, -300], color: '#b388ff', description: 'colorful gas cloud' },
    { name: 'Asteroid Field', position: [-300, 50, 200], color: '#9a8a70', description: 'tumbling rocks and dust' },
    { name: 'Wormhole', position: [350, 80, -150], color: '#7df9ff', description: 'cyan-purple portal' },
    { name: 'Black Hole', position: [-400, 120, -400], color: '#ff9f33', description: 'accretion disk and jets' },
    { name: 'Pulsar', position: [500, 150, -600], color: '#9edcff', description: 'sweeping neutron-star beams' },
    { name: 'Binary Stars', position: [-600, 100, 300], color: '#ffe08a', description: 'orbiting twin-star system' },
    { name: 'Quasar', position: [600, 200, 400], color: '#ffffff', description: 'active galactic nucleus with twin jets' },
    { name: 'Supernova Remnant', position: [-200, 180, -500], color: '#ff74b8', description: 'expanding stellar debris shells' },
    { name: 'Planetary System', position: [400, 100, 500], color: '#d88f5a', description: 'gas giant with five orbiting moons' },
    { name: 'Magnetar', position: [0, 250, -700], color: '#88ccff', description: 'magnetized neutron star with X-ray bursts' },
    { name: 'Stellar Nursery', position: [-500, 200, -200], color: '#ff9bd2', description: 'star-forming region with protostars' },
    { name: 'Gravitational Lens', position: [300, 150, -450], color: '#ffffaa', description: 'Einstein ring and distorted galaxies' },
    { name: 'Cosmic Web', position: [-700, 300, -800], color: '#4466aa', description: 'large-scale structure with galaxy clusters and filaments' },
    { name: 'Galaxy Collision', position: [800, -100, -600], color: '#ffaa88', description: 'two spiral galaxies merging with tidal streams' },
    { name: 'Neutron Star Merger', position: [-800, 150, 400], color: '#9966ff', description: 'two neutron stars spiraling together with gravitational waves' },
    { name: 'Protoplanetary Disk', position: [900, 50, 200], color: '#cc8866', description: 'young star system with planet-forming disk and bipolar jets' },
    { name: 'Planetary Nebula', position: [-900, 200, 600], color: '#44ff88', description: 'dying star with colorful expanding gas shells and bipolar lobes' },
    { name: 'Open Star Cluster', position: [700, 100, 700], color: '#aaccff', description: 'young blue stars with reflection nebulosity like the Pleiades' },
    { name: 'Dark Matter Halo', position: [-600, -50, -200], color: '#4455bb', description: 'invisible gravitational structure with subhalos and density caustics' },
    { name: 'Globular Cluster', position: [500, -100, -350], color: '#ffaa66', description: 'dense spherical collection of ancient red/yellow stars with tidal tails' },
    { name: 'Hypervelocity Star', position: [0, -150, 500], color: '#88ccff', description: 'star ejected at extreme speed with bow shock and motion trail' },
    { name: 'Ring Galaxy', position: [-400, 200, 800], color: '#6699ff', description: 'collision-formed galaxy with blue stellar ring and intruder galaxy' },
    { name: 'Cepheid Variable', position: [200, -80, -700], color: '#ffffaa', description: 'pulsating supergiant star used as cosmic distance marker' },
    { name: 'Red Giant', position: [-300, -150, -600], color: '#ff6633', description: 'bloated aging star with mass loss wind and surviving planet' },
    { name: 'White Dwarf', position: [600, -50, -150], color: '#f0f8ff', description: 'compact stellar remnant with crystallizing carbon core and cooling envelope' },
    { name: 'Brown Dwarf', position: [-150, -100, 400], color: '#8B4513', description: 'substellar object with methane clouds, lithium signature, and orbiting moon' },
    { name: 'Gamma Ray Burst', position: [850, 0, -400], color: '#8800ff', description: 'most energetic explosion with relativistic jets, shock waves, and afterglow' },
    { name: 'Exoplanet System', position: [-700, 50, 600], color: '#ff8c00', description: 'alien solar system with 5 diverse worlds, asteroid belt, and habitable zone planet' },
    { name: 'Solar Flare', position: [-500, -80, -750], color: '#ffaa00', description: 'dramatic eruption with coronal mass ejection, magnetic field lines, and plasma prominences' },
    { name: 'Rogue Planet', position: [750, -120, 350], color: '#667788', description: 'lonely wanderer through interstellar space with frozen moons and faint auroral activity' },
    { name: 'Cosmic String', position: [-850, 0, 200], color: '#00ffff', description: 'theoretical topological defect with gravitational lensing and energy kinks' },
    { name: 'Cosmic Maelstrom', position: [200, 100, 500], color: '#ff3300', description: 'violent vortex of infalling stars and exotic matter with relativistic jets and event horizon' },
    { name: 'Magnetar Burst', position: [950, 100, -200], color: '#00ffff', description: 'ultra-magnetized neutron star with intense X-ray flares and starquake aftershocks' },
    { name: 'Wolf-Rayet Star', position: [-950, -50, 500], color: '#aaccff', description: 'massive hot star with intense stellar winds and orbiting companion' },
    { name: 'Cosmic Void', position: [0, -200, -900], color: '#223355', description: 'vast empty region in the cosmic web with sparse edge galaxies and lone drifter' },
    { name: 'Primordial Black Hole', position: [850, 200, 700], color: '#ff4400', description: 'ancient black hole from the early universe with Hawking radiation and time dilation effects' },
    { name: 'Blue Straggler', position: [-800, -150, -400], color: '#6688ff', description: 'mysteriously young star formed from stellar merger surrounded by old red giants' },
    { name: 'Bow Shock Nebula', position: [700, -80, -800], color: '#55ccff', description: 'arc-shaped structure from fast-moving star plowing through interstellar gas' },
    { name: 'Herbig-Haro Object', position: [-600, 250, 600], color: '#44aaff', description: 'bipolar jets ejected from newly forming protostar with knots and bow shocks' },
    { name: 'Thorne-Zytkow Object', position: [400, -180, 850], color: '#ff5500', description: 'hypothetical hybrid star with neutron star core inside red giant envelope' },
    { name: 'Fast Radio Burst', position: [-450, 100, -650], color: '#00ffff', description: 'mysterious millisecond burst of radio energy from deep space with frequency dispersion' },
    { name: 'Circumbinary Planet', position: [550, -100, 450], color: '#ffcc44', description: 'planet orbiting two stars like Tatooine with dual sunsets in habitable zone' },
    { name: 'Interstellar Medium', position: [-200, -50, 750], color: '#445577', description: 'diffuse gas and dust clouds between stars with ionized regions and molecular cores' },
    { name: 'Symbiotic Star', position: [300, 150, -550], color: '#ff6688', description: 'white dwarf accreting from red giant companion with mass transfer stream and periodic nova outbursts' },
    { name: 'Dark Energy Bubble', position: [-350, 180, -350], color: '#8844cc', description: 'visualization of mysterious cosmic acceleration with expanding spacetime grid and energy fluctuations' },
];

function openTeleportMenu() {
    if (teleportMenuOpen) {
        updateTeleportList();
        teleportMenu.style.display = 'block';
        teleportMenu.setAttribute('aria-hidden', 'false');
        teleportFilter?.focus();
        return;
    }
    teleportMenuOpen = true;
    controls.unlock();
    resetMovementState();
    updateTeleportList();
    teleportMenu.style.display = 'block';
    teleportMenu.setAttribute('aria-hidden', 'false');
    teleportFilter?.focus();
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

function teleportNearPoint(position, sightName, offset = 30) {
    camera.position.set(
        position[0] + offset,
        position[1] + 10,
        position[2] + offset
    );
    toggleTeleportMenu();
    UniverseEvents.recordLandmarkVisit(visitorTracker.getVisitorId(), sightName);
}

function teleportNearWorld(world) {
    teleportNearPoint(world.position, world.name);
}


// === Camera bookmarks (1-9 teleport, Shift+1-9 save) ============
function loadBookmarks() {
    try {
        const raw = localStorage.getItem('aiv_universe_bookmarks');
        return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
}
function saveBookmarks(bm) {
    try { localStorage.setItem('aiv_universe_bookmarks', JSON.stringify(bm)); } catch (e) {}
}
function ensureBookmarkHud() {
    let el = document.getElementById('bookmark-slots-hud');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'bookmark-slots-hud';
    el.title = 'Camera bookmark slots — Shift+1..9 save · 1..9 jump';
    el.style.cssText = 'position:fixed;right:12px;bottom:170px;display:flex;gap:4px;' +
        'padding:6px 8px;background:rgba(20,20,40,0.55);border:1px solid rgba(170,200,255,0.25);' +
        'border-radius:8px;font-family:monospace;font-size:11px;letter-spacing:0.5px;' +
        'color:#aac8ff;z-index:9000;pointer-events:none;user-select:none;';
    const prefix = document.createElement('span');
    prefix.textContent = '📍';
    prefix.style.opacity = '0.85';
    el.appendChild(prefix);
    for (let i = 1; i <= 9; i++) {
        const slot = document.createElement('span');
        slot.dataset.slot = String(i);
        slot.textContent = String(i);
        slot.style.cssText = 'width:14px;height:16px;display:inline-flex;align-items:center;' +
            'justify-content:center;border-radius:3px;background:rgba(60,70,110,0.35);' +
            'color:#566c8a;transition:all 0.25s;';
        el.appendChild(slot);
    }
    document.body.appendChild(el);
    return el;
}
function refreshBookmarkHud() {
    const el = ensureBookmarkHud();
    const bm = loadBookmarks();
    el.querySelectorAll('span[data-slot]').forEach((node) => {
        const slot = node.dataset.slot;
        if (bm[slot]) {
            node.style.background = 'rgba(120,200,150,0.35)';
            node.style.color = '#b3ffe2';
            node.style.boxShadow = '0 0 6px rgba(140,220,170,0.45)';
        } else {
            node.style.background = 'rgba(60,70,110,0.35)';
            node.style.color = '#566c8a';
            node.style.boxShadow = 'none';
        }
    });
}
function ensureAutoFlyHud() {
    let el = document.getElementById('autofly-hud');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'autofly-hud';
    el.style.cssText = 'position:fixed;left:50%;bottom:104px;transform:translateX(-50%);padding:6px 14px;border-radius:14px;background:rgba(15,30,40,0.62);color:#aaffcc;font-family:monospace;font-size:13px;letter-spacing:0.06em;border:1px solid rgba(170,255,204,0.5);box-shadow:0 0 14px rgba(120,220,170,0.35);pointer-events:none;z-index:42;display:none;';
    el.textContent = '✈️ AUTO-FLY · F off · Shift = boost · scroll = speed';
    document.body.appendChild(el);
    return el;
}
function refreshAutoFlyHud() {
    const el = ensureAutoFlyHud();
    el.style.display = autoFlyEnabled ? 'block' : 'none';
}
function showBookmarkToast(msg, color) {
    let el = document.getElementById('bookmark-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'bookmark-toast';
        el.style.cssText = 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);' +
            'background:rgba(20,20,40,0.85);color:#fff;padding:10px 22px;border-radius:8px;' +
            'font-family:monospace;font-size:14px;letter-spacing:0.5px;border:1px solid rgba(170,200,255,0.5);' +
            'z-index:10000;pointer-events:none;opacity:0;transition:opacity 0.3s;';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    if (color) el.style.borderColor = color;
    el.style.opacity = '1';
    clearTimeout(el.__hideTimer);
    el.__hideTimer = setTimeout(() => { el.style.opacity = '0'; }, 1800);
}
function saveBookmark(slot) {
    const bm = loadBookmarks();
    bm[slot] = {
        p: [camera.position.x, camera.position.y, camera.position.z],
        q: [camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w],
    };
    saveBookmarks(bm);
    showBookmarkToast('💾 Saved bookmark ' + slot, '#88ffaa');
    refreshBookmarkHud();
}
// Initialize bookmark HUD on page load and reflect saved slots.
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => { try { refreshBookmarkHud(); } catch (e) {} });
}

function teleportToBookmark(slot) {
    const bm = loadBookmarks();
    const b = bm[slot];
    if (!b) {
        showBookmarkToast('No bookmark in slot ' + slot + ' (Shift+' + slot + ' to save)', '#ffaa55');
        return;
    }
    camera.position.set(b.p[0], b.p[1], b.p[2]);
    if (b.q && b.q.length === 4) {
        camera.quaternion.set(b.q[0], b.q[1], b.q[2], b.q[3]);
    }
    showBookmarkToast('📍 Jumped to bookmark ' + slot, '#aaccff');
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

function createDirectoryHeading(text) {
    const heading = document.createElement('div');
    heading.className = 'directory-section-heading';
    heading.setAttribute('role', 'presentation');
    heading.textContent = text;
    return heading;
}

function getDirectoryEntries() {
    return [...teleportList.querySelectorAll('.world-entry, .cosmic-entry')];
}

function handleDirectoryEntryKeydown(event, entry, activate) {
    if (event.target.closest('a')) return;
    const entries = getDirectoryEntries();
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
        activate();
    }
}

function updateTeleportList() {
    teleportList.innerHTML = '';
    const camPos = camera.position;
    const query = teleportFilterQuery;
    const totalWorlds = worlds.length;
    const totalSights = cosmicSights.length;

    // Filter by world name/agent or cosmic sight name/description and keep distance sorting for matches.
    const sorted = worlds
        .filter((w) => {
            if (!query) return true;
            return w.name.toLowerCase().includes(query) || w.agent.toLowerCase().includes(query);
        })
        .map((w) => {
            const wp = new THREE.Vector3(...w.position);
            return { world: w, dist: wp.distanceTo(camPos) };
        })
        .sort((a, b) => a.dist - b.dist);

    const sortedSights = cosmicSights
        .filter((sight) => {
            if (!query) return true;
            return sight.name.toLowerCase().includes(query) || sight.description.toLowerCase().includes(query);
        })
        .map((sight) => {
            const sp = new THREE.Vector3(...sight.position);
            return { sight, dist: sp.distanceTo(camPos) };
        })
        .sort((a, b) => a.dist - b.dist);

    const matchedWorlds = sorted.length;
    const matchedSights = sortedSights.length;
    if (teleportFilterStatus) {
        if (!query) teleportFilterStatus.textContent = `Showing all ${totalWorlds} worlds and ${totalSights} cosmic sights`;
        else teleportFilterStatus.textContent = `Showing ${matchedWorlds} of ${totalWorlds} worlds and ${matchedSights} of ${totalSights} cosmic sights`;
    }

    if (!sorted.length && !sortedSights.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No worlds or cosmic sights match this filter.';
        teleportList.appendChild(empty);
        return;
    }

    if (sorted.length) teleportList.appendChild(createDirectoryHeading('World destinations'));
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

        const activate = () => teleportNearWorld(world);
        entry.appendChild(info);
        entry.appendChild(actions);
        entry.addEventListener('click', activate);
        entry.addEventListener('keydown', (event) => handleDirectoryEntryKeydown(event, entry, activate));
        teleportList.appendChild(entry);
    });

    if (sortedSights.length) teleportList.appendChild(createDirectoryHeading('Cosmic sights'));
    sortedSights.forEach(({ sight, dist }) => {
        const entry = document.createElement('div');
        entry.className = 'cosmic-entry';
        entry.title = `Teleport near ${sight.name}`;
        entry.tabIndex = 0;
        entry.setAttribute('role', 'listitem');
        entry.setAttribute(
            'aria-label',
            `Teleport near ${sight.name}; ${sight.description}; ${Math.round(dist)} units away; coordinates ${sight.position.join(', ')}.`
        );

        const info = document.createElement('div');
        const titleLine = document.createElement('div');
        const name = document.createElement('span');
        name.className = 'world-name';
        name.style.color = sight.color;
        name.textContent = sight.name;
        titleLine.appendChild(name);
        info.appendChild(titleLine);

        const meta = document.createElement('div');
        meta.className = 'world-meta';
        const coords = document.createElement('span');
        coords.className = 'world-coords';
        coords.textContent = `coords [${sight.position.join(', ')}]`;
        meta.appendChild(coords);
        const badge = document.createElement('span');
        badge.className = 'world-badge';
        badge.textContent = 'cosmic sight';
        meta.appendChild(badge);
        info.appendChild(meta);

        const description = document.createElement('div');
        description.className = 'world-boundary';
        description.textContent = sight.description;
        info.appendChild(description);

        const actions = document.createElement('div');
        actions.className = 'world-actions';
        const distance = document.createElement('span');
        distance.className = 'world-dist';
        distance.textContent = `${Math.round(dist)} units`;
        actions.appendChild(distance);
        const visit = document.createElement('span');
        visit.className = 'world-enter';
        visit.textContent = 'Visit coordinates';
        actions.appendChild(visit);

        const activate = () => teleportNearPoint(sight.position, sight.name, 40);
        entry.appendChild(info);
        entry.appendChild(actions);
        entry.addEventListener('click', activate);
        entry.addEventListener('keydown', (event) => handleDirectoryEntryKeydown(event, entry, activate));
        teleportList.appendChild(entry);
    });
}

teleportFilter?.addEventListener('input', (event) => {
    teleportFilterQuery = event.target.value.trim().toLowerCase();
    updateTeleportList();
});

teleportFilter?.addEventListener('keydown', (event) => {
    const entries = getDirectoryEntries();
    if (event.code === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        entries[0]?.focus();
    } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        entries[entries.length - 1]?.focus();
    } else if (event.code === 'Home') {
        event.preventDefault();
        event.stopPropagation();
        entries[0]?.focus();
    } else if (event.code === 'End') {
        event.preventDefault();
        event.stopPropagation();
        entries[entries.length - 1]?.focus();
    } else if (event.code === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (teleportFilterQuery) {
            teleportFilterQuery = '';
            teleportFilter.value = '';
            updateTeleportList();
            return;
        }
        closeTeleportMenu();
    }
});

// ============ NEAREST WORLD + COORDS ============
const nearestWorldEl = document.getElementById('nearest-world');
const coordsEl = document.getElementById('coords');

const closestWorldScratch = new THREE.Vector3();
const closestSightScratch = new THREE.Vector3();

function findClosestLandmark() {
    const camPos = camera.position;
    let closestId = null;
    let closestDist = Infinity;

    worlds.forEach((world) => {
        closestWorldScratch.fromArray(world.position);
        const dist = camPos.distanceTo(closestWorldScratch);
        if (dist < closestDist) {
            closestDist = dist;
            closestId = world.id;
        }
    });

    cosmicSights.forEach((sight) => {
        if (!Array.isArray(sight.position)) return;
        closestSightScratch.fromArray(sight.position);
        const dist = camPos.distanceTo(closestSightScratch);
        if (dist < closestDist) {
            closestDist = dist;
            closestId = sight.id || sight.name;
        }
    });

    if (!closestId) return null;
    return { id: closestId, distance: closestDist };
}

function updateNearestWorld() {
    const camPos = camera.position;
    let closest = null;
    let closestDist = Infinity;
    let closestSight = null;
    let closestSightDist = Infinity;

    worlds.forEach(w => {
        const wp = new THREE.Vector3(...w.position);
        const d = wp.distanceTo(camPos);
        if (d < closestDist) {
            closestDist = d;
            closest = w;
        }
    });

    cosmicSights.forEach(sight => {
        const sp = new THREE.Vector3(...sight.position);
        const d = sp.distanceTo(camPos);
        if (d < closestSightDist) {
            closestSightDist = d;
            closestSight = sight;
        }
    });

    if (closest) {
        const arrow = closestDist < 40 ? '◆' : '→';
        const sightArrow = closestSightDist < 55 ? '✦' : '↝';
        const sightLine = closestSight
            ? `<br>${sightArrow} Sight: <span style="color:${closestSight.color}">${closestSight.name}</span> (${Math.round(closestSightDist)}u)`
            : '';
        nearestWorldEl.innerHTML = `${arrow} Nearest: <span style="color:${closest.color}">${closest.name}</span> (${Math.round(closestDist)}u)${sightLine}`;
    }

    coordsEl.textContent = `[${Math.round(camPos.x)}, ${Math.round(camPos.y)}, ${Math.round(camPos.z)}]`;
}

let healthMonitor = null;
function initHealthMonitoring() {
    healthMonitor = new UniverseHealthMonitor({
        scene,
        landmarksGroup: landmarks,
        worlds,
        camera,
        intervalMs: 5200
    });
    healthMonitor.start();
    return healthMonitor;
}

async function initEventSystem() {
    try {
        eventVisualIntegration = EventVisualIntegration.init(scene, camera);
        // universe-events.js intentionally initializes itself on import and uses
        // window.EventVisualIntegration for display/end hooks, so import it only
        // after the visual bridge has a scene and camera.
        await import('./universe-events.js');
        // Audio cue bridge — play a soft whoosh when scheduled events fire,
        // so atmospheric effects (shooting stars, aurora, constellations) land with sound.
        try {
            const evi = window.EventVisualIntegration || EventVisualIntegration;
            if (evi && typeof evi.displayEvent === 'function' && !evi.__audioWrapped) {
                const origDisplay = evi.displayEvent.bind(evi);
                evi.displayEvent = function(event) {
                    const evType = event && (event.id || event.type || '');
                    try { eventBanner.showEvent(event); } catch (e) { /* ignore */ }
                    // Visual side-effects fire regardless of audio state
                    try {
                        if (evType === 'constellationHighlight' && window.__constellations && window.__constellations.pulseHighlight) {
                            window.__constellations.pulseHighlight(12);
                        }
                    } catch (e) { /* swallow */ }
                    try {
                        if (universeAudio && universeAudio.isStarted && universeAudio.isStarted() && !universeAudio.isMuted()) {
                            if (evType === 'shootingStars' || evType === 'aurora' || evType === 'constellationHighlight') {
                                universeAudio.playWhoosh({ duration: 1.1, gain: 0.14 });
                            } else {
                                universeAudio.playWhoosh({ duration: 0.8, gain: 0.16 });
                            }
                            if (evType === 'aurora' && universeAudio.startAuroraDrone) {
                                universeAudio.startAuroraDrone({ fadeIn: 5.5, gain: 0.07 });
                                const durSec = (event && (event.duration || event.durationSeconds)) || 15 * 60;
                                if (window.__auroraDroneTimer) clearTimeout(window.__auroraDroneTimer);
                                window.__auroraDroneTimer = setTimeout(() => {
                                    try { universeAudio.stopAuroraDrone({ fadeOut: 6 }); } catch(e){}
                                }, Math.max(20, durSec - 6) * 1000);
                            }
                        }
                    } catch (e) { /* swallow */ }
                    return origDisplay(event);
                };
                evi.__audioWrapped = true;
            }
        } catch (e) { console.warn('audio-event bridge failed', e); }
    } catch (error) {
        console.warn('Universe event system could not initialize:', error);
        eventVisualIntegration = null;
    }
}

// Animation Loop
let prevTime = performance.now();
let shootingStarTimer = 0;


function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (guidedTour.isActive()) {
        guidedTour.update(delta);
    } else if (controls.isLocked) {
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
        if (autoFlyEnabled && !moveForward && !moveBackward) {
            // Continuous forward drift in cinematic mode; speed scales with Shift
            const flyMult = shiftHeld ? 1.6 : 0.5;
            velocity.z -= currentSpeed * flyMult * delta;
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        
        // Raycasting for interaction
        raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
        const intersects = raycaster.intersectObjects(interactables, true);
        
        if(intersects.length > 0 && intersects[0].distance < 100) {
            currentFocus = intersects[0].object;
            const focusMeta = resolveFocusMetadata(currentFocus);
            interactionPrompt.style.display = 'block';
            interactionPrompt.textContent = `Click or Press E to enter: ${focusMeta.name}${focusMeta.boundaryNote ? ' — ' + focusMeta.boundaryNote : ''}`;
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
    universeAudio.update(camera, delta);
    eventVisualIntegration?.update(delta);
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

    initHealthMonitoring();
    await initEventSystem();
        // Initialize Challenge UI
    challengeUI.init();

    animate();
}

init().catch((error) => {
    console.error('Failed to initialize world loading:', error);
});

initDiagnosticsPanel();
