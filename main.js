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
import { createPhotoGallery } from './photo-gallery.js';
import { createEventBanner } from './event-banner.js';
import { createVisitorTracker } from './visitor-tracker.js';
import { createCosmicSightTracker } from './cosmic-sight-tracker.js';
import { createCosmicSightsAtlas } from './cosmic-sights-atlas.js';
import { createCosmicSightLog } from './cosmic-sight-log.js';
import { createCosmicSightMarkers } from './cosmic-sight-markers.js';
import { createCosmicSightCategoryHud } from './cosmic-sight-category-hud.js';
import { createCosmicSightCompass } from './cosmic-sight-compass.js';
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
const photoGallery = createPhotoGallery({ audio: universeAudio });
window.__photoGallery = photoGallery;
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
import { createNarrativeConnections } from "./landmarks/narrative-connections.js";
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
import { createPlazaFountain } from "./landmarks/plaza-fountain.js";
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
import { createRelativisticJet } from "./landmarks/relativistic-jet.js";
import { createActiveGalacticNucleus } from "./landmarks/active-galactic-nucleus.js";
import { createCosmicRayShower } from "./landmarks/cosmic-ray-shower.js";
import { createPulsarWindNebula } from "./landmarks/pulsar-wind-nebula.js";
import { createBlazar } from "./landmarks/blazar.js";
import { createStellarWindCollision } from "./landmarks/stellar-wind-collision.js";
import { createSeyfertGalaxy } from "./landmarks/seyfert-galaxy.js";
import { createRadioLobe } from "./landmarks/radio-lobe.js";
import { createNeutronStarCrustQuake } from "./landmarks/neutron-star-crust-quake.js";
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

    const narrativeConnections = createNarrativeConnections(THREE, scene, worlds);
    scene.add(narrativeConnections.group);
    customLandmarkAnimators.push((elapsed, delta, time) => narrativeConnections.update(delta, elapsed));
    window.__narrativeConnections = narrativeConnections;

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

    const plazaFountain = createPlazaFountain(THREE);
    scene.add(plazaFountain.group);
    customLandmarkAnimators.push((elapsed, delta, time) => plazaFountain.update(delta, elapsed));

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

// Relativistic Jet - spectacular particle beams from black hole
const relativisticJet = createRelativisticJet(THREE);
relativisticJet.group.position.set(-100, -100, 600);
scene.add(relativisticJet.group);
customLandmarkAnimators.push((elapsed, delta, time) => relativisticJet.group.userData.update(elapsed));

// Active Galactic Nucleus - supermassive black hole at galaxy center
const activeGalacticNucleus = createActiveGalacticNucleus(THREE);
activeGalacticNucleus.group.position.set(600, 50, -700);
scene.add(activeGalacticNucleus.group);
customLandmarkAnimators.push((elapsed, delta, time) => activeGalacticNucleus.group.userData.update(elapsed));

// Cosmic Ray Shower - high-energy particle cascade
const cosmicRayShower = createCosmicRayShower(THREE);
cosmicRayShower.group.position.set(-700, 100, 400);
scene.add(cosmicRayShower.group);
customLandmarkAnimators.push((elapsed, delta, time) => cosmicRayShower.group.userData.update(elapsed));

// Pulsar Wind Nebula - shocked plasma bubble around pulsar
const pulsarWindNebula = createPulsarWindNebula(THREE);
pulsarWindNebula.group.position.set(800, -50, -300);
scene.add(pulsarWindNebula.group);
customLandmarkAnimators.push((elapsed, delta, time) => pulsarWindNebula.group.userData.update(elapsed));

// Blazar - AGN with jet pointing at observer
const blazar = createBlazar(THREE);
blazar.group.position.set(-850, 50, -500);
scene.add(blazar.group);
customLandmarkAnimators.push((elapsed, delta, time) => blazar.group.userData.update(elapsed));

// Stellar Wind Collision - two massive stars colliding winds
const stellarWindCollision = createStellarWindCollision(THREE);
stellarWindCollision.group.position.set(450, -80, 700);
scene.add(stellarWindCollision.group);
customLandmarkAnimators.push((elapsed, delta, time) => stellarWindCollision.group.userData.update(elapsed));

// Seyfert Galaxy - active spiral with luminous nucleus
const seyfertGalaxy = createSeyfertGalaxy(THREE);
seyfertGalaxy.group.position.set(-750, 80, -250);
scene.add(seyfertGalaxy.group);
customLandmarkAnimators.push((elapsed, delta, time) => seyfertGalaxy.group.userData.update(elapsed));

// Radio Lobe - giant plasma bubble from AGN
const radioLobe = createRadioLobe(THREE);
radioLobe.group.position.set(650, -120, 550);
scene.add(radioLobe.group);
customLandmarkAnimators.push((elapsed, delta, time) => radioLobe.group.userData.update(elapsed));

// Neutron Star Crust Quake - violent starquake
const neutronStarCrustQuake = createNeutronStarCrustQuake(THREE);
neutronStarCrustQuake.group.position.set(-550, -60, -680);
scene.add(neutronStarCrustQuake.group);
customLandmarkAnimators.push((elapsed, delta, time) => neutronStarCrustQuake.group.userData.update(elapsed));

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
    if (event.code === 'KeyU' && !teleportMenuOpen) {
        event.preventDefault();
        const achievementsPanel = document.getElementById('achievements-panel');
        const panelIsOpen = achievementsPanel && window.getComputedStyle(achievementsPanel).display !== 'none';
        if (panelIsOpen && typeof visitorTracker.closePanel === 'function') {
            visitorTracker.closePanel();
        } else if (typeof visitorTracker.openPanel === 'function') {
            visitorTracker.openPanel();
        }
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
    { name: 'Relativistic Jet', position: [-100, -100, 600], color: '#ff00ff', description: 'spectacular twin particle beams ejected at near-light speed from spinning black hole' },
    { name: 'Active Galactic Nucleus', position: [600, 50, -700], color: '#ffffff', description: 'supermassive black hole at galaxy center outshining billions of stars with luminous accretion disk' },
    { name: 'Cosmic Ray Shower', position: [-700, 100, 400], color: '#00ffff', description: 'high-energy particle cascade from deep space with ionization trails and secondary particles' },
    { name: 'Pulsar Wind Nebula', position: [800, -50, -300], color: '#8844ff', description: 'expanding shocked plasma bubble surrounding energetic pulsar with termination shock and wisps' },
    { name: 'Blazar', position: [-850, 50, -500], color: '#88ccff', description: 'active galactic nucleus with relativistic jet aimed directly at Earth causing intense flickering emission' },
    { name: 'Stellar Wind Collision', position: [450, -80, 700], color: '#ff44ff', description: 'two massive stars with colliding supersonic winds creating hot X-ray emitting bow shock' },
    { name: 'Seyfert Galaxy', position: [-750, 80, -250], color: '#ffdd44', description: 'active spiral galaxy with extremely luminous nucleus powered by supermassive black hole accretion' },
    { name: 'Radio Lobe', position: [650, -120, 550], color: '#aa55ff', description: 'colossal bubble of synchrotron-emitting plasma ejected from active galactic nucleus' },
    { name: 'Neutron Star Crust Quake', position: [-550, -60, -680], color: '#ff6633', description: 'violent starquake releasing immense energy as crust fractures and resets' },
    { name: 'Tidal Disruption Event', position: [750, 100, -450], color: '#ff3366', description: 'star shredded by supermassive black hole creating spiraling debris stream and luminous flare' },
    { name: 'Microquasar', position: [-650, -100, 300], color: '#66ffcc', description: 'stellar-mass black hole with relativistic jets mimicking quasar behavior at smaller scale' },
    { name: 'Coronal Mass Ejection', position: [200, -150, 800], color: '#ffaa00', description: 'massive plasma eruption from star propelling billions of tons of magnetized matter into space' },
    { name: 'Magnetized Filament', position: [-400, 150, -800], color: '#8888ff', description: 'cosmic web strand threaded with magnetic fields channeling gas flows between galaxy clusters' },
    { name: 'Accretion Disk Instability', position: [850, -80, -550], color: '#ff8844', description: 'turbulent spiral of superheated material falling into black hole with magnetic instabilities and flares' },
    { name: 'X-ray Binary', position: [-750, -120, 650], color: '#ff4488', description: 'compact object stealing gas from companion star creating brilliant X-ray emissions' },
    { name: 'Type Ia Supernova', position: [550, 180, -750], color: '#ffffff', description: 'white dwarf thermonuclear explosion serving as cosmic standard candle' },
    { name: 'Stellar Jet', position: [-550, 80, -150], color: '#44ffaa', description: 'bipolar outflow from young protostar carving through molecular cloud' },
    { name: 'Circumstellar Disk', position: [350, -60, 650], color: '#ddaa77', description: 'flattened ring of gas and dust orbiting star where planets may form' },
    { name: 'Interstellar Shock', position: [-200, -180, -400], color: '#66aaff', description: 'supersonic collision between stellar wind and interstellar medium creating glowing bow wave' },
    { name: 'Lyman Alpha Blob', position: [900, 60, 350], color: '#aaddff', description: 'giant cloud of hydrogen gas glowing with characteristic ultraviolet emission in early universe' },
    { name: 'Cooling Flow', position: [-900, -30, -300], color: '#88ddcc', description: 'hot intracluster gas condensing and flowing toward galaxy cluster center' },
    { name: 'Fermi Bubble', position: [100, 220, -500], color: '#cc66ff', description: 'giant gamma-ray emitting lobes extending from galactic center powered by past activity' },
    { name: 'Cosmic Microwave Background', position: [-50, -250, 900], color: '#ffeecc', description: 'ancient light from universe 380000 years old showing temperature fluctuations of early cosmos' },
    { name: 'Pulsar Timing Array', position: [700, -150, -200], color: '#aaffcc', description: 'network of millisecond pulsars detecting gravitational waves rippling through spacetime' },
    { name: 'Magnetohydrodynamic Wave', position: [-800, 100, 200], color: '#77aaff', description: 'plasma oscillation propagating along magnetic field lines in stellar corona' },
    { name: 'Baryon Acoustic Oscillation', position: [250, -200, -850], color: '#ffccaa', description: 'ancient sound wave frozen in matter distribution revealing cosmic expansion history' },
    { name: 'Epoch of Reionization', position: [-300, 280, 700], color: '#aaddee', description: 'cosmic dawn when first stars ionized neutral hydrogen flooding universe with light' },
    { name: 'Supermassive Black Hole Binary', position: [950, 50, -100], color: '#ff55aa', description: 'two giants locked in gravitational dance destined to merge with space-shaking waves' },
    { name: 'Cosmic Strings Wake', position: [-950, -80, -450], color: '#ffaaff', description: 'topological defect from early universe dragging matter into wake as it moves' },
    { name: 'Photon Sphere', position: [400, 150, 400], color: '#ffffaa', description: 'region where light orbits black hole eternally trapped by extreme gravity' },
    { name: 'Hawking Radiation', position: [-100, -220, -750], color: '#ff9966', description: 'quantum particles escaping black hole event horizon slowly evaporating the beast' },
    { name: 'Dark Matter Annihilation', position: [650, -180, 250], color: '#dd88ff', description: 'hypothetical zone where dark matter particles collide releasing gamma rays' },
    { name: 'Gravitational Wave Memory', position: [-450, 200, 550], color: '#88ffdd', description: 'permanent spacetime displacement left behind after gravitational wave passes' },
    { name: 'Intergalactic Medium', position: [800, -50, 800], color: '#aaccff', description: 'vast diffuse gas between galaxies holding most of universes normal matter' },
    { name: 'Warm Hot Intergalactic Medium', position: [-700, -150, -650], color: '#ffddaa', description: 'shock-heated gas at millions of degrees in cosmic web filaments' },
    { name: 'Sunyaev-Zeldovich Effect', position: [300, 200, -300], color: '#ddffee', description: 'CMB photons scattered by hot galaxy cluster electrons revealing cosmic structure' },
    { name: 'Gravitational Lensing Arc', position: [-550, 120, 450], color: '#aaffaa', description: 'distant galaxy stretched into arc by foreground cluster gravitational bending' },
    { name: 'Einstein Cross', position: [500, -100, -500], color: '#ffff88', description: 'four images of single quasar created by gravitational lensing around galaxy' },
    { name: 'Zodiacal Light', position: [-200, -100, 850], color: '#ffffcc', description: 'sunlight scattered by interplanetary dust creating ethereal glow along ecliptic' },
    { name: 'Gegenschein', position: [600, 80, -600], color: '#eeffdd', description: 'faint backscatter glow opposite sun from interplanetary dust particles' },
    { name: 'Airglow', position: [-600, -200, 300], color: '#88ff99', description: 'chemiluminescence from excited atoms in upper atmosphere creating subtle light' },
    { name: 'Polar Aurora', position: [150, 250, 600], color: '#00ff77', description: 'dancing curtains of light from solar wind particles exciting atmospheric gases' },
    { name: 'Sprite Lightning', position: [-850, 180, -100], color: '#ff4444', description: 'red electrical discharge above thunderstorms reaching toward ionosphere' },
    { name: 'Elve Ring', position: [750, -80, 150], color: '#ff8888', description: 'rapidly expanding ring of light above thunderstorm from electromagnetic pulse' },
    { name: 'Blue Jet', position: [-400, 220, -400], color: '#4488ff', description: 'electrical discharge shooting upward from storm cloud top into stratosphere' },
    { name: 'Terrestrial Gamma Flash', position: [450, 150, -150], color: '#ffccff', description: 'intense gamma ray burst from lightning generating antimatter particles' },
    { name: 'Noctilucent Cloud', position: [-750, -120, 750], color: '#aaddff', description: 'highest clouds in atmosphere visible at twilight when sunlit from below' },
    { name: 'Polar Stratospheric Cloud', position: [850, 100, 450], color: '#ff99cc', description: 'nacreous ice crystals forming in extreme cold creating iridescent colors' },
    { name: 'Sun Pillar', position: [-150, -180, -550], color: '#ffdd88', description: 'vertical column of light above or below sun from ice crystal reflections' },
    { name: 'Moon Halo', position: [550, 200, 700], color: '#eeeeff', description: 'ring around moon from refraction through hexagonal ice crystals in cirrus' },
    { name: 'Parhelion', position: [-500, -80, -200], color: '#ffeeaa', description: 'sun dog bright spot beside sun from horizontal ice crystal refraction' },
    { name: 'Circumzenithal Arc', position: [300, 280, 350], color: '#ff88ff', description: 'upside down rainbow near zenith from ice crystal refraction creating smile' },
    { name: 'Glory', position: [-850, -150, 600], color: '#ffaa88', description: 'colorful rings around shadow cast on cloud by backscattered sunlight waves' },
    { name: 'Coronagraph View', position: [650, -200, -350], color: '#ffcc99', description: 'stellar corona revealed by blocking central star light showing coronal streamers' },
    { name: 'Heliospheric Current Sheet', position: [-350, 250, 400], color: '#ddaaff', description: 'undulating magnetic boundary dividing solar wind into sectors like ballerina skirt' },
    { name: 'Termination Shock', position: [900, -100, -800], color: '#ff8866', description: 'boundary where solar wind slows to subsonic speeds meeting interstellar medium' },
    { name: 'Heliopause', position: [-900, 150, 850], color: '#aabbff', description: 'outer boundary of heliosphere where solar wind merges with interstellar plasma' },
    { name: 'Bow Shock Heliosphere', position: [350, -150, -900], color: '#77ddff', description: 'possible shock wave ahead of heliosphere as Sun moves through galaxy' },
    { name: 'Voyager Interstellar', position: [-650, -180, -500], color: '#88ffaa', description: 'spacecraft beyond heliopause sampling pristine interstellar medium for first time' },
    { name: 'Oort Cloud', position: [750, 180, 600], color: '#ccddff', description: 'spherical shell of icy bodies at solar system edge reservoir of long-period comets' },
    { name: 'Kuiper Belt', position: [-450, -100, 750], color: '#aaccee', description: 'donut-shaped region of icy bodies beyond Neptune home to dwarf planets' },
    { name: 'Scattered Disk', position: [500, -220, -650], color: '#ddccaa', description: 'dynamically unstable region of trans-Neptunian objects with highly elliptical orbits' },
    { name: 'Hills Cloud', position: [-800, 200, -350], color: '#bbddcc', description: 'inner Oort cloud transitional region between Kuiper belt and outer cloud' },
    { name: 'Sedna Orbit', position: [950, -50, 250], color: '#ff6666', description: 'detached trans-Neptunian object with extreme orbit hinting at Planet Nine' },
    { name: 'Planet Nine Region', position: [-950, 100, -700], color: '#8888dd', description: 'hypothetical distant giant planet explaining clustered orbits of extreme TNOs' },
    { name: 'Interstellar Object', position: [400, -180, 500], color: '#ff99aa', description: 'visitor from another star system passing through our solar neighborhood' },
    { name: 'Local Interstellar Cloud', position: [-300, 150, -800], color: '#aaddaa', description: 'warm diffuse cloud our solar system currently travels through' },
    { name: 'G-Cloud', position: [600, 200, -400], color: '#ddbbaa', description: 'neighboring interstellar cloud that will envelope Sun in future millennia' },
    { name: 'Local Bubble', position: [-700, -120, 350], color: '#aaeeff', description: 'cavity in interstellar medium carved by ancient supernovae surrounding Sun' },
    { name: 'Gould Belt', position: [800, 80, -150], color: '#ffccdd', description: 'ring of young stars and gas tilted to galactic plane containing many nearby nebulae' },
    { name: 'Orion Spur', position: [-500, -200, -600], color: '#ddaaff', description: 'minor spiral arm between major arms where our solar system resides' },
    { name: 'Sagittarius Arm', position: [700, 150, 750], color: '#aaffcc', description: 'inner spiral arm visible toward galactic center hosting many star-forming regions' },
    { name: 'Perseus Arm', position: [-850, 50, 500], color: '#ffaabb', description: 'outer major spiral arm of Milky Way beyond our local spur' },
    { name: 'Galactic Bar', position: [450, -100, -800], color: '#ffdd99', description: 'elongated central structure of Milky Way funneling gas toward nucleus' },
    { name: 'Nuclear Star Cluster', position: [-600, 180, 650], color: '#ffffaa', description: 'dense stellar core at galactic center surrounding supermassive black hole' },
    { name: 'Sagittarius A Star', position: [850, -30, -600], color: '#ff8800', description: 'supermassive black hole at heart of Milky Way four million solar masses' },
    { name: 'Circumnuclear Disk', position: [-750, -80, -300], color: '#ffaa77', description: 'ring of gas and dust orbiting close to galactic center black hole' },
    { name: 'Galactic Bulge', position: [300, 250, 500], color: '#ffcc88', description: 'spheroidal concentration of old stars surrounding galactic center' },
    { name: 'Thick Disk', position: [-400, -150, 800], color: '#ddbb99', description: 'older stellar population extending above and below galactic plane' },
    { name: 'Stellar Halo', position: [700, 100, -250], color: '#aabbcc', description: 'sparse spherical distribution of ancient stars and globular clusters' },
    { name: 'Magellanic Stream', position: [-550, 200, -450], color: '#88ddff', description: 'trailing gas stripped from Magellanic Clouds by tidal interaction' },
    { name: 'Magellanic Bridge', position: [500, -200, 400], color: '#aaddee', description: 'gaseous connection linking Large and Small Magellanic Clouds' },
    { name: 'Leading Arm', position: [-200, 150, 900], color: '#99ccff', description: 'gas stream pulled ahead of Magellanic Clouds by gravitational forces' },
    { name: 'Andromeda Halo', position: [900, -80, 700], color: '#bbaaff', description: 'vast extended halo of Andromeda galaxy already overlapping with Milky Way' },
    { name: 'Triangulum Galaxy', position: [-850, 120, -200], color: '#aaccff', description: 'third largest Local Group spiral with active star formation' },
    { name: 'Local Group Barycenter', position: [150, -100, -700], color: '#ddddaa', description: 'gravitational center around which Local Group galaxies orbit' },
    { name: 'Virgo Cluster Core', position: [-600, 200, 300], color: '#ffbbdd', description: 'heart of nearest large galaxy cluster dominated by giant ellipticals' },
    { name: 'Coma Cluster', position: [650, -150, -500], color: '#eeccff', description: 'rich galaxy cluster revealing dark matter through velocity dispersions' },
    { name: 'Great Attractor', position: [-300, 100, 850], color: '#ff7788', description: 'gravitational anomaly pulling Local Group at 600 km per second' },
    { name: 'Shapley Supercluster', position: [800, 180, 150], color: '#ffaacc', description: 'most massive concentration of galaxies in nearby universe' },
    { name: 'Laniakea Supercluster', position: [-700, -100, -650], color: '#aaffdd', description: 'our home supercluster containing 100000 galaxies including Milky Way' },
    { name: 'Cosmic Web Node', position: [400, -200, 600], color: '#ddffaa', description: 'dense intersection point where cosmic web filaments meet' },
    { name: 'Void Boundary', position: [-450, 150, -350], color: '#99aaff', description: 'sharp edge between cosmic void and surrounding large-scale structure' },
    { name: 'Bootes Void', position: [550, -80, -850], color: '#8899aa', description: 'supervoid spanning 330 million light years nearly empty of galaxies' },
    { name: 'Cold Spot', position: [-900, 50, 400], color: '#aabbdd', description: 'mysterious CMB cold region possibly indicating largest void or multiverse imprint' },
    { name: 'Eridanus Supervoid', position: [750, 120, -350], color: '#99aabb', description: 'billion light year void aligned with CMB cold spot' },
    { name: 'KBC Void', position: [-350, -180, 700], color: '#aaccbb', description: 'local underdensity surrounding Milky Way affecting cosmic expansion measurements' },
    { name: 'Hercules-Corona Wall', position: [600, 200, 450], color: '#ffddee', description: 'largest known structure spanning 10 billion light years of connected galaxies' },
    { name: 'Sloan Great Wall', position: [-650, -50, -550], color: '#eeddff', description: 'massive galactic filament stretching 1.4 billion light years' },
    { name: 'CfA2 Great Wall', position: [350, 150, 800], color: '#ddccee', description: 'one of first discovered large scale structures in cosmic web' },
    { name: 'Observable Universe Horizon', position: [-100, 280, -200], color: '#ffffff', description: 'cosmic light horizon 46 billion light years marking visible universe edge' },
    { name: 'Particle Horizon', position: [200, -250, 350], color: '#ffeedd', description: 'boundary beyond which light has not had time to reach us since Big Bang' },
    { name: 'Event Horizon Cosmos', position: [-500, 100, 500], color: '#ddffff', description: 'boundary beyond which events will never be observable due to cosmic expansion' },
    { name: 'Inflation Field', position: [450, -120, -650], color: '#ffee88', description: 'hypothetical scalar field driving exponential expansion in first fraction of second' },
    { name: 'Reheating Epoch', position: [-650, 180, 350], color: '#ffaa66', description: 'moment when inflation ended and energy converted to hot particle plasma' },
    { name: 'Electroweak Phase Transition', position: [300, -200, 750], color: '#88ffdd', description: 'symmetry breaking moment giving particles mass via Higgs mechanism' },
    { name: 'QCD Phase Transition', position: [-400, 100, -500], color: '#ff6699', description: 'quarks confined into protons and neutrons as universe cooled' },
    { name: 'Nucleosynthesis Epoch', position: [700, 150, 200], color: '#aaffaa', description: 'first three minutes when hydrogen helium and lithium nuclei formed' },
    { name: 'Recombination Surface', position: [-550, -80, 650], color: '#ffeedd', description: 'moment when electrons joined nuclei creating transparent universe we see as CMB' },
    { name: 'Dark Ages', position: [850, -150, -400], color: '#445566', description: 'era before first stars when universe was filled with neutral hydrogen fog' },
    { name: 'First Light', position: [-750, 200, -150], color: '#ffffcc', description: 'moment when first stars ignited ending cosmic dark ages' },
    { name: 'Population III Star', position: [500, 100, 550], color: '#aaddff', description: 'hypothetical first generation massive star made only of hydrogen and helium' },
    { name: 'First Black Hole', position: [-300, -180, 800], color: '#aa44ff', description: 'earliest black holes forming from first massive star collapses' },
    { name: 'T Tauri Star', position: [600, -80, -300], color: '#ffcc77', description: 'young pre-main-sequence star still contracting with powerful stellar winds and jets' },
    { name: 'Asymptotic Giant Branch', position: [-450, 220, 400], color: '#ff8844', description: 'late stellar evolution phase with thermal pulses and heavy element production' },
    { name: 'Horizontal Branch Star', position: [350, -180, -550], color: '#aaccff', description: 'post-red-giant star burning helium in its core' },
    { name: 'Carbon Star', position: [-600, 80, -200], color: '#ff4422', description: 'cool red giant with more carbon than oxygen creating sooty atmosphere' },
    { name: 'Mira Variable', position: [750, 100, 300], color: '#ff6655', description: 'pulsating red giant varying dramatically in brightness over months' },
    { name: 'Contact Binary', position: [-200, -150, 600], color: '#ffaaff', description: 'two stars so close they share outer atmosphere in figure-eight shape' },
    { name: 'Cataclysmic Variable', position: [400, 180, -400], color: '#ff88dd', description: 'white dwarf accreting from companion star with dramatic outbursts' },
    { name: 'Classical Nova', position: [-700, -50, 150], color: '#ffffff', description: 'thermonuclear explosion on white dwarf surface brightening million-fold' },
    { name: 'Reflection Nebula', position: [550, -200, 450], color: '#88aaff', description: 'cloud illuminated by nearby star scattering blue light' },
    { name: 'Dark Nebula', position: [-350, 150, -650], color: '#332211', description: 'dense molecular cloud blocking light from background stars' },
    { name: 'Bipolar Nebula', position: [200, 250, 700], color: '#ff99cc', description: 'hourglass-shaped planetary nebula with polar jets' },
    { name: 'Ultra Diffuse Galaxy', position: [-800, -100, -350], color: '#445577', description: 'galaxy-sized but extremely faint with very few stars' },
    { name: 'Jellyfish Galaxy', position: [650, -80, -150], color: '#66ddff', description: 'galaxy with trailing streamers of gas stripped by cluster medium' },
    { name: 'Cosmic Dawn', position: [-500, 280, 250], color: '#ffddaa', description: 'era 100-250 million years after Big Bang when first galaxies formed' },
    { name: 'Reionization Bubble', position: [300, -300, -200], color: '#aaddff', description: 'expanding sphere of ionized hydrogen around early luminous sources' },
    { name: 'Blue Supergiant', position: [480, -250, 380], color: '#88ccff', description: 'massive hot luminous star 10000 times brighter than Sun' },
    { name: 'Red Supergiant', position: [-380, 200, -480], color: '#ff4400', description: 'evolved massive star expanded to hundreds of solar radii' },
    { name: 'Yellow Hypergiant', position: [250, 320, -280], color: '#ffdd44', description: 'extremely rare luminous star among most massive known' },
    { name: 'Luminous Blue Variable', position: [-550, -180, 320], color: '#aaddff', description: 'unstable massive star with dramatic brightness eruptions' },
    { name: 'Be Star', position: [680, 50, -520], color: '#ccddff', description: 'rapidly rotating B-type star with circumstellar disk' },
    { name: 'X-ray Pulsar', position: [-420, 280, 180], color: '#ff66aa', description: 'neutron star in binary emitting pulsed X-rays from accretion' },
    { name: 'Millisecond Pulsar', position: [380, -320, 620], color: '#aaffff', description: 'neutron star spun up to hundreds of rotations per second' },
    { name: 'Double Pulsar', position: [-680, 120, -280], color: '#ffaadd', description: 'rare binary system where both neutron stars are pulsars' },
    { name: 'Pulsar Glitch', position: [520, 180, 480], color: '#ffff88', description: 'sudden spin-up event from neutron star interior rearrangement' },
    { name: 'Galactic Fountain', position: [-280, -220, 550], color: '#88ddaa', description: 'hot gas ejected from disk falling back as galactic rain' },
    { name: 'Galactic Wind', position: [720, -120, -380], color: '#aaccdd', description: 'outflow of gas driven by supernovae and stellar winds' },
    { name: 'Starburst Region', position: [-620, 80, 420], color: '#ffaa77', description: 'area of intense star formation 10-100 times normal rate' },
    { name: 'Baryon Acoustic Peak', position: [180, 350, -650], color: '#ddccff', description: 'characteristic 500 million light year scale from sound waves in early universe' },
    { name: 'Cosmic Shear Field', position: [-480, -280, -180], color: '#ccddee', description: 'distortion pattern revealing dark matter distribution' },
    { name: 'Lyman Alpha Forest', position: [580, 220, 280], color: '#aabbff', description: 'absorption lines from intergalactic hydrogen clouds along quasar sightlines' },
    { name: 'Supermassive Star', position: [-380, 280, -420], color: '#ffeeaa', description: 'primordial star over 100 solar masses possibly seeding first black holes' },
    { name: 'Pair Instability Supernova', position: [620, -180, 520], color: '#ffaa44', description: 'complete stellar disruption leaving no remnant from very massive star' },
    { name: 'Kilonova', position: [-520, 150, 280], color: '#ffddcc', description: 'neutron star merger explosion producing heavy elements like gold and platinum' },
    { name: 'Superluminous Supernova', position: [280, -350, -580], color: '#ffffff', description: 'explosion 10-100 times brighter than normal supernova from magnetar or pair instability' },
    { name: 'Tidal Stream', position: [-680, -80, 180], color: '#aaddcc', description: 'stellar debris stretched into arc from dwarf galaxy disruption' },
    { name: 'Stellar Halo Substructure', position: [480, 280, -320], color: '#ccbbaa', description: 'ancient remnants of accreted dwarf galaxies in galactic halo' },
    { name: 'Intergalactic Star', position: [-280, -320, 680], color: '#ddddff', description: 'lonely star ejected from galaxy wandering between galaxies' },
    { name: 'Hypercompact Stellar System', position: [380, 180, 580], color: '#ffccdd', description: 'dense star cluster orbiting supermassive black hole' },
    { name: 'Cosmic Filament Core', position: [-580, 220, -280], color: '#aaccee', description: 'densest region of cosmic web filament where galaxies cluster' },
    { name: 'Protocluster', position: [720, -220, 180], color: '#ddaaff', description: 'early universe overdensity destined to become galaxy cluster' },
    { name: 'Soft Gamma Repeater', position: [-420, -180, 380], color: '#ff88aa', description: 'magnetar emitting repeated bursts of gamma rays and X-rays' },
    { name: 'Solar Granulation', position: [180, -80, -120], color: '#ffdd88', description: 'convection cells on Sun surface each size of Texas' },
    { name: 'Sunspot', position: [-150, 60, 80], color: '#884400', description: 'cooler darker region on Sun surface with intense magnetic field' },
    { name: 'Coronal Hole', position: [220, 120, -180], color: '#334455', description: 'dark region in corona with open magnetic field lines' },
    { name: 'Solar Prominence', position: [-280, -60, 150], color: '#ff6644', description: 'giant loop of plasma suspended by magnetic fields above Sun' },
    { name: 'Lenticular Galaxy', position: [580, 280, -480], color: '#ddccaa', description: 'disk galaxy with no spiral arms between elliptical and spiral types' },
    { name: 'Compact Elliptical', position: [-680, -220, 320], color: '#ccbbaa', description: 'small dense elliptical galaxy possibly stripped of outer stars' },
    { name: 'Brightest Cluster Galaxy', position: [420, -320, 620], color: '#ffddaa', description: 'giant elliptical at center of galaxy cluster often with AGN' },
    { name: 'Fossil Group', position: [-520, 180, -380], color: '#aabbcc', description: 'galaxy group dominated by single giant elliptical all others merged' },
    { name: 'OB Association', position: [680, 80, 280], color: '#aaddff', description: 'loose grouping of young hot massive stars born together' },
    { name: 'Moving Group', position: [-380, -280, 520], color: '#ccddee', description: 'stars with common motion through space from same birth cloud' },
    { name: 'Stellar Stream', position: [280, 380, -280], color: '#ddbbcc', description: 'elongated structure of stars torn from globular cluster or dwarf galaxy' },
    { name: 'Hubble Flow', position: [-620, 280, 180], color: '#aaccff', description: 'smooth expansion of universe carrying galaxies apart' },
    { name: 'Peculiar Velocity Field', position: [520, -180, -520], color: '#ddccff', description: 'galaxy motions deviating from pure Hubble expansion due to gravity' },
    { name: 'Sachs-Wolfe Effect', position: [-280, 320, 680], color: '#ffeedd', description: 'CMB temperature variations from gravitational redshift in potential wells' },
    { name: 'Io Volcanism', position: [120, -40, 60], color: '#ffaa33', description: 'most volcanically active body in solar system with sulfur eruptions' },
    { name: 'Enceladus Geysers', position: [-180, 80, 120], color: '#aaeeff', description: 'ice plumes erupting from subsurface ocean through tiger stripes' },
    { name: 'Titan Methane Lakes', position: [280, 60, -80], color: '#aa8866', description: 'liquid hydrocarbon seas on Saturns largest moon' },
    { name: 'Europa Subsurface Ocean', position: [-120, -80, 180], color: '#88aacc', description: 'saltwater ocean beneath ice shell possibly habitable' },
    { name: 'Mars Dust Devil', position: [80, 40, -60], color: '#cc8866', description: 'towering whirlwinds of dust on Martian surface' },
    { name: 'Proplyd', position: [480, -280, 380], color: '#ffccaa', description: 'protoplanetary disk being photoevaporated by nearby massive star' },
    { name: 'Cometary Globule', position: [-580, 220, -420], color: '#667788', description: 'dense molecular cloud with comet-like tail from stellar wind' },
    { name: 'Bok Globule', position: [380, 320, 520], color: '#445566', description: 'small dark cloud collapsing to form stars' },
    { name: 'Subdwarf B Star', position: [-420, -180, 280], color: '#aaccff', description: 'hot blue star that lost envelope before helium flash' },
    { name: 'Extreme Horizontal Branch', position: [620, 180, -320], color: '#88bbff', description: 'very hot helium-burning star bluer than normal HB' },
    { name: 'Ap Star', position: [-320, 280, 480], color: '#ddccff', description: 'chemically peculiar A-type star with strong magnetic field' },
    { name: 'Am Star', position: [480, -120, 680], color: '#eeddcc', description: 'metallic-line A star with unusual abundance patterns' },
    { name: 'Lambda Bootis Star', position: [-680, -80, -280], color: '#ccddee', description: 'A-type star deficient in iron-peak elements from accretion' },
    { name: 'Flare Star', position: [280, 380, -180], color: '#ff6644', description: 'red dwarf with sudden dramatic brightness increases' },
    { name: 'UV Ceti Variable', position: [-480, 180, 320], color: '#ff8866', description: 'flare star with powerful magnetic eruptions' },
    { name: 'RS CVn Binary', position: [520, -220, 180], color: '#ffaa88', description: 'active binary with giant starspots and chromospheric activity' },
    { name: 'W UMa Contact Binary', position: [-380, 280, -480], color: '#ffccaa', description: 'overcontact binary sharing common envelope with short period' },
    { name: 'Algol Paradox System', position: [680, 120, 320], color: '#aaddff', description: 'binary where less massive star evolved first due to mass transfer' },
    { name: 'Post-AGB Star', position: [-520, -180, 580], color: '#ffdd77', description: 'star transitioning from red giant to planetary nebula phase' },
    { name: 'Proto-White Dwarf', position: [280, 380, -620], color: '#ddddff', description: 'hot core just shed envelope becoming white dwarf' },
    { name: 'Polar', position: [-620, 80, 280], color: '#ff66cc', description: 'magnetic cataclysmic variable with accretion stream hitting poles' },
    { name: 'Intermediate Polar', position: [420, -320, -180], color: '#dd88ff', description: 'magnetic white dwarf with partial accretion disk' },
    { name: 'Nova-like Variable', position: [-280, 220, 680], color: '#ffaaff', description: 'cataclysmic variable with sustained high accretion rate' },
    { name: 'Dwarf Nova', position: [580, 180, 480], color: '#ffddee', description: 'cataclysmic variable with repeated small outbursts' },
    { name: 'Recurrent Nova', position: [-480, -280, -320], color: '#ffffff', description: 'nova system that erupts multiple times over decades' },
    { name: 'Symbiotic Nova', position: [380, 320, -480], color: '#ffccdd', description: 'slow nova in symbiotic binary with red giant donor' },
    { name: 'Luminous Red Nova', position: [-680, 180, 120], color: '#ff4422', description: 'stellar merger event ejecting cool red transient' },
    { name: 'Gap Transient', position: [220, -380, 520], color: '#ffbb66', description: 'explosion between nova and supernova in luminosity' },
    { name: 'Calcium-rich Transient', position: [-320, 80, -580], color: '#eeddaa', description: 'faint fast supernova-like event in galaxy outskirts' },
    { name: 'Type Ibn Supernova', position: [620, -80, -280], color: '#aaddcc', description: 'supernova interacting with helium-rich circumstellar material' },
    { name: 'Type Icn Supernova', position: [-420, 320, 380], color: '#88ddaa', description: 'stripped supernova interacting with carbon-oxygen shell' },
    { name: 'Supernova Impostor', position: [480, 220, 680], color: '#ffcc88', description: 'giant eruption mimicking supernova but star survives' },
    { name: 'Tidal Disruption Flare', position: [-580, -120, -180], color: '#aaccff', description: 'UV/X-ray burst from star shredded by black hole' },
    { name: 'Changing-look AGN', position: [320, -280, 380], color: '#ddbbff', description: 'active nucleus switching between spectral types over years' },
    { name: 'Quasi-periodic Eruption', position: [-220, 380, -280], color: '#ff88dd', description: 'X-ray bursts repeating every few hours from galactic nucleus' },
    { name: 'Radio Galaxy', position: [580, -180, 280], color: '#aabbcc', description: 'galaxy with powerful radio emission from relativistic jets' },
    { name: 'FR-I Radio Source', position: [-420, 280, -380], color: '#99aabb', description: 'radio galaxy with edge-darkened jets fading with distance' },
    { name: 'FR-II Radio Source', position: [320, 380, 520], color: '#bbccdd', description: 'powerful radio galaxy with edge-brightened hotspots' },
    { name: 'Head-Tail Galaxy', position: [-580, -120, 180], color: '#aaccbb', description: 'radio galaxy with jets bent by cluster medium motion' },
    { name: 'Wide-Angle Tail', position: [480, 180, -620], color: '#bbddcc', description: 'radio galaxy with jets bent into C-shape by motion' },
    { name: 'Compact Steep Spectrum', position: [-280, 320, 480], color: '#ccaabb', description: 'young confined radio source with steep spectrum' },
    { name: 'GHz-Peaked Spectrum', position: [680, -280, -180], color: '#aaddcc', description: 'young radio source with peak emission at gigahertz' },
    { name: 'BL Lac Object', position: [-620, 80, -280], color: '#ddbbff', description: 'blazar with featureless spectrum from beamed jet' },
    { name: 'Flat Spectrum Radio Quasar', position: [220, -380, 680], color: '#ffddaa', description: 'quasar with jet pointed toward Earth' },
    { name: 'Narrow-Line Seyfert 1', position: [-380, 220, 320], color: '#aaffdd', description: 'active galaxy with narrow permitted lines and strong FeII' },
    { name: 'LINER Galaxy', position: [520, 320, -380], color: '#ccbbaa', description: 'galaxy with low ionization nuclear emission lines' },
    { name: 'Composite AGN', position: [-480, -220, -180], color: '#ddccbb', description: 'galaxy with both starburst and AGN activity' },
    { name: 'Obscured AGN', position: [380, 80, 580], color: '#887766', description: 'active nucleus hidden by dusty torus' },
    { name: 'Compton-Thick AGN', position: [-220, 380, -520], color: '#665544', description: 'AGN with extreme column density blocking even hard X-rays' },
    { name: 'Dual AGN', position: [620, -180, 280], color: '#ffaaff', description: 'two active nuclei in merging galaxy pair' },
    { name: 'Recoiling Black Hole', position: [-520, 120, 420], color: '#aaccff', description: 'black hole ejected from nucleus by gravitational wave kick' },
    { name: 'Wandering Black Hole', position: [280, 280, -280], color: '#bbaaff', description: 'massive black hole adrift in galaxy halo' },
    { name: 'Intermediate Mass Black Hole', position: [-680, -80, -480], color: '#ccbbff', description: 'black hole between stellar and supermassive at hundreds to thousands solar masses' },
    { name: 'Ultraluminous X-ray Source', position: [480, -320, 180], color: '#ff88cc', description: 'extremely bright off-nuclear X-ray source possibly IMBH' },
    { name: 'Hyperluminous X-ray Source', position: [-320, 280, 680], color: '#ff66aa', description: 'X-ray source brighter than entire galaxy possibly beamed' },
    { name: 'X-ray Binary Jet', position: [180, 380, -480], color: '#aaddff', description: 'relativistic outflow from accreting stellar mass black hole' },
    { name: 'SS 433 System', position: [-580, -220, 280], color: '#ffcc88', description: 'famous microquasar with precessing jets' },
    { name: 'Cyg X-1 Analog', position: [680, 120, -180], color: '#aabbdd', description: 'stellar black hole in high mass X-ray binary' },
    { name: 'Low Mass X-ray Binary', position: [-420, 180, -320], color: '#ffaabb', description: 'neutron star or black hole fed by low mass companion' },
    { name: 'High Mass X-ray Binary', position: [320, -280, 520], color: '#aaccff', description: 'compact object fed by massive O or B star wind' },
    // 276-280: Stellar Populations & Clusters
    { name: "Globular Cluster Core", position: [-245, 85, -155], color: "#ffd700", description: "Dense stellar nucleus with up to a million ancient stars in gravitational embrace" },
    { name: "Open Cluster Halo", position: [255, -45, 165], color: "#87ceeb", description: "Diffuse outer region of young stellar associations slowly dissolving into the galaxy" },
    { name: "Blue Straggler (II)", position: [-175, 55, 235], color: "#4169e1", description: "Anomalously young-looking star in old clusters, rejuvenated by stellar mergers" },
    { name: "Extreme Horizontal Branch Star", position: [195, -75, -205], color: "#9370db", description: "Hot subluminous stars that lost most envelope mass during red giant phase" },
    { name: "AGB Tip Star", position: [-225, 95, 145], color: "#ff6347", description: "Luminous cool giants undergoing thermal pulses before planetary nebula ejection" },
    // 281-285: Exotic Compact Objects
    { name: "Strange Star", position: [175, -65, -175], color: "#ff00ff", description: "Hypothetical quark star made of strange quark matter, denser than neutron stars" },
    { name: "Quark Star", position: [-155, 85, 195], color: "#da70d6", description: "Theoretical ultra-dense remnant where neutrons dissolve into free quarks" },
    { name: "Electroweak Star", position: [235, -55, 125], color: "#00ffff", description: "Hypothetical object powered by electroweak burning of quarks at extreme densities" },
    { name: "Preon Star", position: [-195, 75, -165], color: "#ff1493", description: "Speculative object made of hypothetical preon subparticles" },
    { name: "Dark Star", position: [145, -85, 215], color: "#2f4f4f", description: "Primordial star powered by dark matter annihilation rather than nuclear fusion" },
    // 286-290: Variable Star Types
    { name: "RR Lyrae Variable", position: [-165, 65, -185], color: "#ffa500", description: "Pulsating horizontal branch star, standard candle for measuring cosmic distances" },
    { name: "Delta Scuti Variable", position: [205, -45, 155], color: "#f0e68c", description: "Short-period pulsating star on or near the main sequence instability strip" },
    { name: "Gamma Doradus Variable", position: [-215, 55, 175], color: "#daa520", description: "Non-radially pulsating F-type star with gravity-mode oscillations" },
    { name: "Beta Cephei Variable", position: [165, -95, -145], color: "#6495ed", description: "Massive pulsating star driven by iron opacity mechanism in stellar envelope" },
    { name: "Slowly Pulsating B Star", position: [-185, 75, 205], color: "#b0c4de", description: "B-type star with long-period gravity-mode pulsations" },
    // 291-295: White Dwarf Variables
    { name: "ZZ Ceti Variable", position: [225, -65, -195], color: "#f5f5f5", description: "Pulsating white dwarf in hydrogen atmosphere instability strip" },
    { name: "V777 Her Variable", position: [-145, 85, 165], color: "#e6e6fa", description: "Pulsating helium-atmosphere white dwarf, also called DB variable" },
    { name: "PG 1159 Star", position: [185, -55, 185], color: "#dcdcdc", description: "Hot pre-white dwarf pulsator with carbon and oxygen dominated atmosphere" },
    { name: "SX Phoenicis Variable", position: [-235, 65, -155], color: "#ffd700", description: "Metal-poor blue straggler with Delta Scuti-like pulsations" },
    { name: "Spotted Rotator", position: [155, -75, 225], color: "#98fb98", description: "Star with brightness changes due to surface spots rotating in and out of view" },
    // 296-300: Cosmological Defects
    { name: "Cosmic String (II)", position: [-175, 95, 145], color: "#ff4500", description: "Hypothetical topological defect from early universe phase transitions" },
    { name: "Domain Wall", position: [215, -85, -175], color: "#8b0000", description: "Theoretical two-dimensional defect separating regions of different vacuum states" },
    { name: "Magnetic Monopole", position: [-205, 55, 195], color: "#ff69b4", description: "Hypothetical particle with isolated north or south magnetic pole" },
    { name: "Cosmic Texture", position: [175, -65, 155], color: "#9932cc", description: "Topological defect from symmetry breaking without stable localized structure" },
    { name: "Primordial Black Hole (II)", position: [-145, 75, -215], color: "#000000", description: "Black hole formed in early universe density fluctuations, potential dark matter candidate" },
    // 301-305: Galaxy Morphology
    { name: "Barred Spiral Galaxy", position: [265, -55, 175], color: "#ffa07a", description: "Spiral galaxy with central bar-shaped stellar structure channeling gas inward" },
    { name: "Ring Galaxy (II)", position: [-235, 85, -185], color: "#40e0d0", description: "Rare galaxy with ring of young stars formed by collision through disk center" },
    { name: "Polar Ring Galaxy", position: [185, -75, 215], color: "#dda0dd", description: "Galaxy with ring of gas and stars orbiting perpendicular to main disk" },
    { name: "Shell Galaxy", position: [-195, 65, 155], color: "#f5deb3", description: "Elliptical galaxy with concentric arc structures from past merger events" },
    { name: "Seyfert 2 Galaxy", position: [225, -85, -165], color: "#9acd32", description: "Active galaxy with obscured nucleus viewed edge-on through dusty torus" },
    // 306-310: Interstellar Medium
    { name: "Giant Molecular Cloud", position: [-175, 55, 195], color: "#4a4a4a", description: "Massive cold cloud of molecular hydrogen, birthplace of star clusters" },
    { name: "HII Region", position: [205, -45, 145], color: "#ff6b6b", description: "Emission nebula of ionized hydrogen glowing from hot young star radiation" },
    { name: "Superbubble", position: [-225, 75, -155], color: "#87cefa", description: "Giant cavity blown by combined stellar winds and supernovae from OB association" },
    { name: "Chimney Structure", position: [165, -95, 185], color: "#c0c0c0", description: "Vertical channel in galactic disk venting hot gas into the halo" },
    { name: "High Velocity Cloud", position: [-145, 85, 205], color: "#6495ed", description: "Gas cloud moving through galactic halo at speeds incompatible with disk rotation" },
    // 311-315: More Stellar Types
    { name: "Herbig Ae/Be Star", position: [245, -65, -195], color: "#ffd700", description: "Young intermediate-mass star with circumstellar disk still forming planets" },
    { name: "FU Orionis Star", position: [-185, 55, 165], color: "#ff8c00", description: "Young star undergoing dramatic brightness increase from accretion outburst" },
    { name: "EX Lupi Variable", position: [175, -75, 225], color: "#ffa500", description: "Young star with repetitive outbursts from episodic mass accretion" },
    { name: "Vega-like Star", position: [-215, 95, -145], color: "#f0f8ff", description: "Main sequence star with infrared excess indicating debris disk" },
    { name: "Barium Star", position: [195, -55, 155], color: "#daa520", description: "Giant star enriched in heavy elements from past companion mass transfer" },
    // 316-320: Multiple Star Systems
    { name: "Trapezium System", position: [-155, 65, 195], color: "#00bfff", description: "Young massive multiple star system ionizing the Orion Nebula" },
    { name: "Hierarchical Triple", position: [235, -85, -175], color: "#98fb98", description: "Three-star system with close binary orbited by distant third companion" },
    { name: "Quadruple Star System", position: [-195, 75, 145], color: "#dda0dd", description: "Four-star system typically as two binary pairs in mutual orbit" },
    { name: "Quintuple Star System", position: [165, -45, 215], color: "#f0e68c", description: "Five-star system with complex hierarchical gravitational dance" },
    { name: "Runaway Star", position: [-225, 85, -165], color: "#ff4500", description: "High-velocity star ejected from birthplace by supernova kick or dynamical interaction" },
    // 321-325: Solar System Features
    { name: "Trojan Asteroid", position: [205, -65, 175], color: "#a0522d", description: "Asteroid sharing planets orbit at stable Lagrange points L4 or L5" },
    { name: "Centaur Object", position: [-175, 55, 185], color: "#808080", description: "Minor planet orbiting between Jupiter and Neptune with unstable chaotic orbit" },
    { name: "Scattered Disk Object", position: [245, -75, -155], color: "#d2691e", description: "Distant icy body with highly elliptical orbit perturbed by Neptune" },
    { name: "Detached Object", position: [-205, 95, 145], color: "#bc8f8f", description: "Trans-Neptunian object with perihelion too distant for Neptune influence" },
    { name: "Sednoid", position: [175, -85, 205], color: "#8b4513", description: "Extreme trans-Neptunian object hinting at Planet Nine or stellar flyby" },
    // 326-330: Gravitational Lensing
    { name: "Einstein Ring", position: [-165, 75, -185], color: "#ffd700", description: "Perfect circular image when source, lens, and observer align precisely" },
    { name: "Einstein Cross (II)", position: [215, -55, 195], color: "#f0e68c", description: "Four images of background quasar created by foreground galaxy lens" },
    { name: "Gravitational Arc", position: [-195, 85, 155], color: "#87ceeb", description: "Stretched and magnified image of distant galaxy by cluster mass" },
    { name: "Microlensing Event", position: [175, -65, -175], color: "#90ee90", description: "Temporary brightening when compact object passes in front of star" },
    { name: "Strong Lensing Cluster", position: [-225, 55, 185], color: "#dda0dd", description: "Massive galaxy cluster creating multiple distorted images of background sources" },
    // 331-335: Stellar End States
    { name: "Planetary Nebula Nucleus", position: [245, -75, 145], color: "#00ffff", description: "Hot exposed core ionizing ejected envelope, future white dwarf" },
    { name: "Thorne-Zytkow Object (II)", position: [-175, 95, -165], color: "#ff6347", description: "Theoretical red giant with neutron star core from stellar collision" },
    { name: "Iron Core Collapse", position: [195, -45, 215], color: "#cd853f", description: "Final moment when massive star iron core exceeds Chandrasekhar limit" },
    { name: "Fallback Supernova", position: [-215, 65, 175], color: "#8b4513", description: "Failed explosion where material falls back creating black hole directly" },
    { name: "Electron Capture Supernova", position: [165, -85, -195], color: "#deb887", description: "Collapse triggered by electron capture in degenerate ONeMg core" },
    // 336-340: Astrochemistry
    { name: "Hot Core", position: [-145, 75, 205], color: "#ff4500", description: "Warm dense region near protostars where icy mantles sublimate releasing complex molecules" },
    { name: "Photodissociation Region", position: [235, -55, 155], color: "#ffa07a", description: "Interface where UV radiation destroys molecules at cloud boundary" },
    { name: "Maser Source", position: [-185, 85, -145], color: "#00ff7f", description: "Natural microwave laser amplifying emission from water, methanol, or silicon monoxide" },
    { name: "Polycyclic Aromatic Hydrocarbon Emission", position: [205, -65, 185], color: "#da70d6", description: "Infrared glow from complex carbon ring molecules in interstellar space" },
    { name: "Diffuse Interstellar Band Source", position: [-235, 55, 165], color: "#778899", description: "Mysterious absorption features from unknown large carbon-bearing molecules" },
    // 341-345: More Transients
    { name: "Fast Blue Optical Transient", position: [175, -95, -175], color: "#1e90ff", description: "Rapidly evolving blue explosion possibly from failed supernovae or stellar mergers" },
    { name: "Luminous Fast Cooler", position: [-155, 75, 195], color: "#4169e1", description: "Bright transient that fades and reddens quickly, uncertain origin" },
    { name: "AT2018cow-like Event", position: [225, -45, 145], color: "#00bfff", description: "Extremely luminous fast transient possibly from star being shredded by black hole" },
    { name: "Afterglow", position: [-195, 85, -155], color: "#ffa500", description: "Fading multiwavelength emission as gamma-ray burst jet decelerates" },
    { name: "Orphan Afterglow", position: [185, -75, 215], color: "#f4a460", description: "Afterglow detected without accompanying gamma-ray burst due to jet angle" },
    // 346-350: Exotic Phenomena
    { name: "Boson Star", position: [-165, 65, 175], color: "#e6e6fa", description: "Hypothetical star made of self-gravitating bosonic particles" },
    { name: "Q-Ball", position: [245, -55, -185], color: "#dda0dd", description: "Theoretical stable non-topological soliton of scalar field" },
    { name: "Axion Cloud", position: [-205, 95, 155], color: "#f0fff0", description: "Hypothetical cloud of axion particles forming around spinning black holes" },
    { name: "Fuzzy Dark Matter Halo", position: [175, -85, 195], color: "#708090", description: "Ultralight axion dark matter forming wavelike interference patterns" },
    { name: "Mirror Star", position: [-225, 55, -165], color: "#c0c0c0", description: "Hypothetical star made of mirror matter from parity-symmetric dark sector" },
    // 351-355: Planetary Atmospheres
    { name: "Hadley Cell", position: [195, -65, 175], color: "#87ceeb", description: "Large-scale atmospheric circulation cell transporting heat from equator to midlatitudes" },
    { name: "Polar Vortex", position: [-175, 85, -195], color: "#4169e1", description: "Persistent large-scale cyclonic circulation around planetary poles" },
    { name: "Great Dark Spot", position: [235, -55, 155], color: "#191970", description: "Giant anticyclonic storm system on ice giant planets" },
    { name: "Hexagonal Storm", position: [-205, 75, 185], color: "#daa520", description: "Saturns unique six-sided polar vortex maintained by jet stream dynamics" },
    { name: "Superrotation", position: [165, -95, -165], color: "#ffa07a", description: "Atmospheric winds faster than planetary rotation speed" },
    // 356-360: Galaxy Cluster Features
    { name: "Cool Core Cluster", position: [-145, 65, 195], color: "#00ced1", description: "Galaxy cluster with rapidly cooling gas at center feeding AGN feedback" },
    { name: "Radio Relic", position: [215, -75, 145], color: "#ff6347", description: "Elongated radio source at cluster outskirts from merger shock waves" },
    { name: "Radio Halo", position: [-225, 85, -155], color: "#9370db", description: "Giant diffuse radio emission filling cluster volume from turbulent reacceleration" },
    { name: "Cluster Cold Front", position: [185, -45, 215], color: "#40e0d0", description: "Sharp temperature discontinuity from sloshing gas in merging clusters" },
    { name: "Ram Pressure Tail", position: [-165, 55, 175], color: "#98fb98", description: "Stripped gas trailing behind galaxy moving through cluster medium" },
    // 361-365: Magnetohydrodynamics
    { name: "Magnetar Flare", position: [245, -85, -175], color: "#ff1493", description: "Intense burst of gamma rays from starquake on highly magnetized neutron star" },
    { name: "Magnetic Reconnection Site", position: [-195, 75, 155], color: "#ffd700", description: "Region where opposing magnetic field lines break and rejoin releasing energy" },
    { name: "Alfven Wave", position: [175, -55, 195], color: "#87cefa", description: "Magnetohydrodynamic wave propagating along magnetic field lines in plasma" },
    { name: "Flux Rope", position: [-215, 65, -185], color: "#ff8c00", description: "Helical magnetic field structure often ejected in coronal mass events" },
    { name: "Current Sheet", position: [205, -95, 165], color: "#f0e68c", description: "Thin layer of intense electric current separating magnetic domains" },
    // 366-370: High Energy Phenomena
    { name: "Pulsar Wind Shock", position: [-155, 85, 195], color: "#00ffff", description: "Termination shock where relativistic pulsar wind meets surrounding medium" },
    { name: "Bow Shock Nebula (II)", position: [225, -65, -195], color: "#dda0dd", description: "Arc-shaped structure where fast-moving star compresses interstellar medium" },
    { name: "Jet Knot", position: [-185, 55, 175], color: "#1e90ff", description: "Bright condensation in relativistic jet from internal shock or instability" },
    { name: "Hot Spot", position: [175, -75, 155], color: "#ff4500", description: "Bright region where relativistic jet impacts intergalactic medium" },
    { name: "Cocoon Shock", position: [-235, 95, -165], color: "#da70d6", description: "Expanding bubble of shocked gas surrounding active radio jets" },
    // 371-375: More Stellar Phenomena
    { name: "Chromospheric Network", position: [195, -45, 205], color: "#ffa500", description: "Magnetic field pattern visible in stellar chromosphere at supergranule boundaries" },
    { name: "Stellar Flare", position: [-165, 75, 185], color: "#ff6347", description: "Sudden brightening from magnetic reconnection in stellar atmosphere" },
    { name: "Starspot Cycle", position: [245, -85, -155], color: "#8b4513", description: "Periodic variation in starspot coverage revealing magnetic activity cycle" },
    { name: "Convective Blueshift", position: [-205, 55, 165], color: "#6495ed", description: "Net Doppler shift from bright rising granules dominating spectral lines" },
    { name: "Asteroseismic Mode", position: [175, -65, 195], color: "#e6e6fa", description: "Standing wave oscillation in stellar interior probed by brightness variations" },
    // 376-380: Cosmological Phenomena
    { name: "Lyman Alpha Blob (II)", position: [-185, 75, -175], color: "#00ff7f", description: "Giant cloud of hydrogen gas glowing from embedded galaxies or cooling flows" },
    { name: "Damped Lyman Alpha System", position: [215, -55, 185], color: "#4682b4", description: "High column density neutral hydrogen absorber, likely proto-galactic disk" },
    { name: "Gunn-Peterson Trough", position: [-225, 85, 155], color: "#2f4f4f", description: "Complete absorption of quasar light by neutral hydrogen before reionization" },
    { name: "Sunyaev-Zeldovich Decrement", position: [175, -95, -165], color: "#708090", description: "CMB shadow from inverse Compton scattering in hot cluster gas" },
    { name: "Cosmic Infrared Background", position: [-155, 65, 195], color: "#8b0000", description: "Diffuse infrared glow from all dust-obscured star formation across cosmic time" },
    // 381-385: Particle Astrophysics
    { name: "Ultra High Energy Cosmic Ray", position: [245, -75, 145], color: "#ff00ff", description: "Particle with energy exceeding 10^20 eV from unknown extreme accelerator" },
    { name: "PeV Neutrino Source", position: [-195, 55, -185], color: "#00ffff", description: "Astrophysical source producing petaelectronvolt neutrinos detected by IceCube" },
    { name: "Cosmic Ray Knee", position: [185, -85, 175], color: "#9932cc", description: "Spectral steepening at 10^15 eV marking transition in cosmic ray origin" },
    { name: "Cosmic Ray Ankle", position: [-165, 95, 155], color: "#8a2be2", description: "Spectral flattening at 10^18 eV suggesting extragalactic cosmic ray dominance" },
    { name: "Air Shower", position: [225, -45, -195], color: "#7cfc00", description: "Cascade of secondary particles from cosmic ray hitting atmosphere" },
    // 386-390: Planet Formation
    { name: "Transition Disk", position: [-205, 75, 185], color: "#deb887", description: "Protoplanetary disk with inner gap cleared by forming giant planet" },
    { name: "Spiral Arm Disk", position: [175, -65, 155], color: "#f4a460", description: "Gravitational spiral pattern in disk driven by embedded planet or companion" },
    { name: "Disk Shadow", position: [-235, 55, -165], color: "#696969", description: "Dark lane in outer disk cast by misaligned inner disk warp" },
    { name: "Disk Wind", position: [195, -95, 205], color: "#87cefa", description: "Magnetically or photoevaporatively driven outflow from disk surface" },
    { name: "Pebble Pile", position: [-145, 85, 175], color: "#cd853f", description: "Concentration of cm-sized particles drifting inward in protoplanetary disk" },
    // 391-395: Stellar Dynamics
    { name: "Three Body Encounter", position: [235, -55, -175], color: "#ffd700", description: "Close gravitational interaction ejecting one star at high velocity" },
    { name: "Tidal Capture", position: [-175, 65, 195], color: "#ff6b6b", description: "Formation of binary system when tidal dissipation removes orbital energy" },
    { name: "Common Envelope Phase", position: [165, -75, 145], color: "#ff4500", description: "Evolutionary stage where companion orbits inside giants envelope" },
    { name: "Mass Ratio Reversal", position: [-215, 95, -155], color: "#98fb98", description: "Binary evolution where initially less massive star becomes more massive" },
    { name: "Kozai-Lidov Oscillation", position: [205, -85, 185], color: "#dda0dd", description: "Periodic exchange between inclination and eccentricity in hierarchical triple" },
    // 396-400: Detection Frontiers
    { name: "Gravitational Wave Memory (II)", position: [-155, 55, 165], color: "#e6e6fa", description: "Permanent spacetime strain remaining after gravitational wave passes" },
    { name: "Pulsar Timing Residual", position: [245, -65, -185], color: "#40e0d0", description: "Deviation in pulse arrival times from gravitational wave background" },
    { name: "Stochastic Background", position: [-185, 85, 195], color: "#778899", description: "Overlapping gravitational waves from countless unresolved sources" },
    { name: "Continuous Wave Source", position: [175, -45, 155], color: "#90ee90", description: "Persistent gravitational wave from spinning neutron star asymmetry" },
    { name: "Ringdown Signal", position: [-225, 75, -175], color: "#f0e68c", description: "Damped oscillation as merged black hole settles to Kerr solution" },
    // 401-405: Extragalactic Features
    { name: "Intracluster Light", position: [185, -55, 165], color: "#fffacd", description: "Diffuse stellar glow from stars stripped during galaxy interactions in clusters" },
    { name: "Brightest Cluster Galaxy (II)", position: [-215, 85, -185], color: "#ffd700", description: "Massive central elliptical formed from multiple mergers at cluster core" },
    { name: "Coma Cluster Core", position: [225, -75, 195], color: "#f5deb3", description: "Dense concentration of ellipticals at heart of rich galaxy cluster" },
    { name: "Void Galaxy", position: [-175, 65, 155], color: "#4682b4", description: "Isolated galaxy evolving in cosmic underdensity with minimal interactions" },
    { name: "Backsplash Galaxy", position: [195, -95, -165], color: "#9370db", description: "Galaxy that passed through cluster and now orbits beyond virial radius" },
    // 406-410: Binary Evolution
    { name: "Roche Lobe Overflow", position: [-145, 55, 185], color: "#ff6b6b", description: "Mass transfer when star expands to fill gravitational equipotential surface" },
    { name: "Accretion Stream", position: [245, -65, 145], color: "#00bfff", description: "Flow of matter from donor star toward compact companion" },
    { name: "Accretion Disk Hot Spot", position: [-195, 85, -155], color: "#ff4500", description: "Bright region where stream impacts outer accretion disk edge" },
    { name: "Circumbinary Disk", position: [175, -45, 205], color: "#deb887", description: "Gas disk orbiting around both components of binary system" },
    { name: "Spiral Shock", position: [-235, 75, 175], color: "#87ceeb", description: "Density wave in accretion disk from tidal interaction with companion" },
    // 411-415: Accretion Physics
    { name: "Disk Corona", position: [205, -85, -175], color: "#ffa500", description: "Hot tenuous atmosphere above accretion disk producing X-ray emission" },
    { name: "Slim Disk", position: [-165, 55, 195], color: "#ff8c00", description: "Thick advection-dominated disk at super-Eddington accretion rates" },
    { name: "ADAF", position: [235, -75, 155], color: "#cd853f", description: "Advection-dominated accretion flow at very low accretion rates" },
    { name: "Disk Instability", position: [-185, 95, -165], color: "#da70d6", description: "Thermal-viscous cycle causing dwarf nova outbursts" },
    { name: "Propeller Effect", position: [165, -55, 185], color: "#00ced1", description: "Centrifugal barrier from rapidly spinning magnetosphere ejecting accreting matter" },
    // 416-420: Spectroscopic Features
    { name: "P Cygni Profile", position: [-225, 65, 165], color: "#4169e1", description: "Absorption plus emission line shape indicating expanding stellar wind" },
    { name: "Double Peaked Emission", position: [195, -95, -185], color: "#ff69b4", description: "Line profile from rotating accretion disk with approaching and receding sides" },
    { name: "Inverse P Cygni", position: [-155, 85, 195], color: "#6495ed", description: "Redshifted absorption indicating infalling material toward source" },
    { name: "Emission Line Star", position: [245, -45, 155], color: "#98fb98", description: "Star showing hydrogen emission from circumstellar disk or wind" },
    { name: "Absorption Line System", position: [-205, 55, -175], color: "#778899", description: "Intervening gas cloud imprinting absorption on background quasar spectrum" },
    // 421-425: More Theoretical
    { name: "Naked Singularity", position: [175, -75, 205], color: "#ffffff", description: "Hypothetical spacetime singularity visible to external observers" },
    { name: "White Hole", position: [-235, 95, 165], color: "#f0f0f0", description: "Time-reversed black hole ejecting matter and light" },
    { name: "Wormhole Throat", position: [215, -65, -155], color: "#dda0dd", description: "Hypothetical passage connecting distant regions of spacetime" },
    { name: "Closed Timelike Curve", position: [-175, 55, 185], color: "#9932cc", description: "Spacetime path that loops back to same point in time" },
    { name: "Firewall", position: [185, -85, 175], color: "#ff4500", description: "Proposed high-energy surface at black hole event horizon" },
    // 426-430: Galactic Archaeology
    { name: "Stellar Stream (II)", position: [-195, 65, -175], color: "#ffd700", description: "Tidal debris from disrupted dwarf galaxy or globular cluster" },
    { name: "Sagittarius Stream", position: [215, -55, 185], color: "#daa520", description: "Prominent stellar stream from tidally disrupting Sagittarius dwarf" },
    { name: "Gaia Sausage", position: [-175, 85, 165], color: "#cd853f", description: "Remnant of massive ancient merger visible in stellar velocity space" },
    { name: "Splash Stars", position: [185, -75, -195], color: "#87ceeb", description: "Disk stars kicked to halo orbits during major merger event" },
    { name: "Chemically Peculiar Halo Star", position: [-235, 55, 195], color: "#9370db", description: "Metal-poor star with unusual abundance pattern from early nucleosynthesis" },
    // 431-435: Time Domain Astronomy
    { name: "Microlensing Planet", position: [165, -95, 155], color: "#98fb98", description: "Exoplanet detected via temporary magnification of background star" },
    { name: "Self-Lensing Binary", position: [-155, 75, -165], color: "#f0e68c", description: "Compact object magnifying companion star during orbital alignment" },
    { name: "Astrometric Binary", position: [245, -45, 185], color: "#dda0dd", description: "Binary detected by periodic wobble in proper motion of visible star" },
    { name: "Eclipsing Binary", position: [-205, 85, 175], color: "#4169e1", description: "Binary system where components periodically block each others light" },
    { name: "Heartbeat Star", position: [195, -65, -185], color: "#ff6b6b", description: "Eccentric binary with tidal distortion causing periodic brightness changes" },
    // 436-440: Multi-Messenger Sources
    { name: "Binary Neutron Star Merger", position: [-225, 55, 165], color: "#ff4500", description: "Collision producing gravitational waves, gamma burst, and kilonova" },
    { name: "Core Collapse Site", position: [175, -85, 195], color: "#8b4513", description: "Supernova with expected neutrino burst and possible gravitational waves" },
    { name: "Blazar Flare", position: [-165, 95, -155], color: "#00ffff", description: "High-energy outburst potentially coincident with neutrino detection" },
    { name: "TXS 0506+056", position: [235, -55, 175], color: "#1e90ff", description: "Blazar associated with IceCube neutrino, first identified neutrino source" },
    { name: "Gravitational Wave Host", position: [-185, 65, 185], color: "#ffa07a", description: "Galaxy identified as location of gravitational wave event" },
    // 441-445: More Stellar Phenomena
    { name: "Magnetic Braking", position: [205, -75, -175], color: "#6495ed", description: "Angular momentum loss via magnetized stellar wind" },
    { name: "Gyrochronology Clock", position: [-145, 85, 165], color: "#f0e68c", description: "Stellar rotation rate used to estimate age through spin-down" },
    { name: "Lithium Dip Star", position: [225, -45, 195], color: "#deb887", description: "F-type star with depleted lithium from rotationally-driven mixing" },
    { name: "Super-Lithium Giant", position: [-215, 55, -185], color: "#ff8c00", description: "Red giant with anomalously high lithium from internal production" },
    { name: "Rapidly Oscillating Ap Star", position: [175, -95, 155], color: "#da70d6", description: "Magnetic A star with high-frequency pulsations aligned to magnetic poles" },
    // 446-450: Planetary Science
    { name: "Exomoon Candidate", position: [-195, 75, 185], color: "#87cefa", description: "Potential natural satellite orbiting exoplanet in another system" },
    { name: "Circumbinary Planet (II)", position: [245, -65, -165], color: "#98fb98", description: "Planet orbiting around both stars of binary system" },
    { name: "Hot Neptune", position: [-175, 85, 175], color: "#4682b4", description: "Neptune-mass planet in close orbit undergoing atmospheric escape" },
    { name: "Super-Puff", position: [195, -55, 195], color: "#dda0dd", description: "Extremely low density planet with extended atmosphere" },
    { name: "Ultra-Short Period Planet", position: [-235, 65, -175], color: "#ff6347", description: "Planet with orbital period less than one Earth day" },
    { name: "Interstellar Comet", position: [185, -45, -195], color: "#b0e0e6", description: "Comet originating from another star system passing through ours" },
    { name: "Hypercompact Stellar System (II)", position: [-215, 75, 165], color: "#ffd700", description: "Extremely tight stellar system with stars orbiting in days" },
    { name: "Tidal Disruption Flare (II)", position: [225, -85, 185], color: "#ff4500", description: "Brilliant flash from star being torn apart by black hole" },
    { name: "Kilonova Remnant", position: [-185, 65, -155], color: "#daa520", description: "Heavy element enriched debris from neutron star merger" },
    { name: "Supergiant Fast X-ray Transient", position: [195, -55, 205], color: "#00bfff", description: "Brief intense X-ray flare from wind-fed neutron star" },
    { name: "Circumnuclear Disk (II)", position: [-225, 85, 175], color: "#9370db", description: "Dense gas and dust ring orbiting galactic center" },
    { name: "Nuclear Star Cluster (II)", position: [175, -75, -185], color: "#fafad2", description: "Dense stellar concentration at galaxy core distinct from bulge" },
    { name: "Pseudobulge", position: [-195, 55, 195], color: "#f0e68c", description: "Disk-like central structure formed through secular evolution" },
    { name: "Boxy Bulge", position: [235, -65, 165], color: "#deb887", description: "Peanut or X-shaped galactic bulge from bar instability" },
    { name: "Counter-Rotating Disk", position: [-175, 95, -165], color: "#87ceeb", description: "Galaxy disk rotating opposite to its stellar halo" },
    { name: "Lopsided Galaxy", position: [205, -45, 195], color: "#98fb98", description: "Asymmetric galaxy from tidal interaction or gas accretion" },
    { name: "Fossil Group (II)", position: [-235, 75, 155], color: "#ff69b4", description: "Galaxy group where most galaxies merged into single giant" },
    { name: "Compact Group", position: [165, -85, -205], color: "#f0f8ff", description: "Dense galaxy grouping with high interaction probability" },
    { name: "Infall Region", position: [-205, 65, 185], color: "#e6e6fa", description: "Zone where galaxies are falling into cluster for first time" },
    { name: "Splashback Radius", position: [225, -55, 175], color: "#ffefd5", description: "Physical edge of galaxy cluster where orbits pile up" },
    { name: "Jellyfish Galaxy Tentacle", position: [-185, 85, -145], color: "#00ced1", description: "Gas and star trail from ram pressure stripped galaxy" },
    { name: "Bow Shock Galaxy", position: [195, -75, 215], color: "#ff8c00", description: "Galaxy with leading edge compressed by cluster medium" },
    { name: "Stripped Envelope Supernova", position: [-215, 55, 195], color: "#ff6347", description: "Core collapse explosion from star that lost outer layers" },
    { name: "Calcium-Rich Transient", position: [175, -95, -175], color: "#fffacd", description: "Peculiar faint explosion with strong calcium emission" },
    { name: "Luminous Red Nova (II)", position: [-195, 75, 165], color: "#dc143c", description: "Outburst from stellar merger cooler than classical nova" },
    { name: "Intermediate Luminosity Red Transient", position: [235, -65, 185], color: "#cd5c5c", description: "Gap transient between novae and supernovae in brightness" },
    { name: "Supernova Impostor (II)", position: [-175, 85, -195], color: "#ff7f50", description: "Giant eruption mimicking supernova but star survives" },
    { name: "Pair-Instability Supernova", position: [205, -45, 165], color: "#ffa07a", description: "Complete stellar destruction from electron-positron pair creation" },
    { name: "Pulsational Pair-Instability", position: [-225, 65, 205], color: "#f08080", description: "Repeated mass ejections before final supernova explosion" },
    { name: "Magnetorotational Supernova", position: [185, -85, -155], color: "#4169e1", description: "Jet-driven explosion from rapidly rotating magnetized core" },
    { name: "Collapsar Jet", position: [-205, 95, 175], color: "#ff1493", description: "Relativistic jet from collapsing massive star core" },
    { name: "Cocoon Emission", position: [215, -55, -185], color: "#dda0dd", description: "Hot shocked material surrounding astrophysical jet" },
    { name: "Reverse Shock", position: [-175, 75, 195], color: "#00ffff", description: "Shock wave traveling backward into expanding ejecta" },
    { name: "Forward Shock", position: [195, -85, 165], color: "#ffa500", description: "Leading shock wave from supernova into ambient medium" },
    { name: "Contact Discontinuity", position: [-225, 65, -175], color: "#98fb98", description: "Sharp boundary between shocked ejecta and swept-up material" },
    { name: "Rayleigh-Taylor Finger", position: [185, -95, 205], color: "#ff6347", description: "Instability structure from dense fluid penetrating lighter one" },
    { name: "Richtmyer-Meshkov Instability", position: [-195, 85, 155], color: "#87ceeb", description: "Shock-driven mixing at density interface" },
    { name: "Kelvin-Helmholtz Roll", position: [225, -65, -195], color: "#9370db", description: "Spiral structure from shear flow between fluid layers" },
    { name: "Thermal Instability Filament", position: [-185, 75, 185], color: "#f0e68c", description: "Cool dense strand condensing from hot diffuse medium" },
    { name: "Parker Spiral", position: [205, -45, 175], color: "#ffd700", description: "Spiral pattern of solar magnetic field in heliosphere" },
    { name: "Heliospheric Current Sheet (II)", position: [-215, 95, -165], color: "#deb887", description: "Warped surface separating opposite magnetic polarities" },
    { name: "Termination Shock (II)", position: [175, -75, 195], color: "#ff7f50", description: "Boundary where solar wind abruptly slows to subsonic" },
    { name: "Heliopause (II)", position: [-235, 65, 175], color: "#b0e0e6", description: "Edge where solar wind meets interstellar medium" },
    { name: "Bow Shock Nose", position: [195, -85, -155], color: "#00bfff", description: "Leading edge of heliospheres interaction with ISM" },
    { name: "Hydrogen Wall", position: [-175, 85, 205], color: "#f5deb3", description: "Pileup of interstellar hydrogen at heliosphere boundary" },
    { name: "Local Bubble Wall", position: [235, -55, 165], color: "#e6e6fa", description: "Shell of dense gas surrounding our local cavity" },
    { name: "Superbubble Interior", position: [-205, 75, -185], color: "#ffefd5", description: "Hot rarefied region blown by multiple supernovae" },
    { name: "Worm Structure", position: [185, -95, 195], color: "#cd853f", description: "Vertical filament connecting disk to halo in galaxy" },
    { name: "Galactic Chimney", position: [-195, 65, 175], color: "#fa8072", description: "Vertical channel venting hot gas from disk to halo" },
    { name: "Fermi Bubble Edge", position: [215, -75, -175], color: "#9932cc", description: "Sharp boundary of giant gamma-ray lobes above galactic center" },
    { name: "eROSITA Bubble", position: [-185, 85, 195], color: "#ff69b4", description: "X-ray counterpart to Fermi bubbles in our galaxy" },
    { name: "Magellanic Stream (II)", position: [175, -65, 165], color: "#87cefa", description: "Tidal gas stream from Magellanic Clouds around Milky Way" },
    { name: "Leading Arm (II)", position: [-225, 95, -155], color: "#98fb98", description: "Gas stripped ahead of Magellanic Clouds orbital motion" },
    { name: "Magellanic Bridge (II)", position: [205, -85, 205], color: "#dda0dd", description: "Gas connecting Large and Small Magellanic Clouds" },
    { name: "Sagittarius Tidal Arm", position: [-175, 75, 175], color: "#f0f8ff", description: "Stellar stream from disrupting Sagittarius dwarf galaxy" },
    { name: "Convective Core", position: [195, -65, -195], color: "#ff4500", description: "Central turbulent mixing region in massive star" },
    { name: "Radiative Zone", position: [-215, 85, 165], color: "#ffd700", description: "Stellar layer where energy transport is by photon diffusion" },
    { name: "Tachocline", position: [175, -75, 185], color: "#00ced1", description: "Thin shear layer between radiative and convective zones" },
    { name: "Stellar Core Flash", position: [-195, 95, -175], color: "#ff6347", description: "Explosive helium ignition in degenerate stellar core" },
    { name: "Dredge-Up Event", position: [235, -55, 195], color: "#98fb98", description: "Convective mixing bringing processed material to stellar surface" },
    { name: "Thermal Pulse", position: [-175, 65, 175], color: "#ffa07a", description: "Periodic helium shell flash in asymptotic giant star" },
    { name: "Mass Loss Envelope", position: [205, -85, -165], color: "#dda0dd", description: "Expanding shell of material shed by evolved star" },
    { name: "Dust Formation Zone", position: [-225, 75, 195], color: "#cd853f", description: "Cool region where molecules condense into solid grains" },
    { name: "Mira Pulsation", position: [185, -95, 155], color: "#dc143c", description: "Long-period radial oscillation of giant star atmosphere" },
    { name: "Cepheid Instability Strip", position: [-205, 55, -185], color: "#f0e68c", description: "HR diagram region where pulsating variables reside" },
    { name: "Blue Loop", position: [215, -65, 205], color: "#4169e1", description: "Evolutionary track of massive star crossing HR diagram" },
    { name: "Hertzsprung Gap", position: [-185, 85, 165], color: "#fafad2", description: "Sparsely populated region in HR diagram during rapid evolution" },
    { name: "Red Giant Branch Bump", position: [175, -75, -195], color: "#ff7f50", description: "Brief pause in stellar evolution when H-shell crosses discontinuity" },
    { name: "Horizontal Branch", position: [-235, 95, 175], color: "#87ceeb", description: "Core helium burning phase of low-mass stars" },
    { name: "Asymptotic Giant Branch Tip", position: [195, -55, 185], color: "#f08080", description: "Final luminous phase before planetary nebula ejection" },
    { name: "Post-AGB Transit", position: [-175, 65, -165], color: "#e6e6fa", description: "Rapid crossing from giant to white dwarf precursor" },
    { name: "Born-Again Giant", position: [225, -85, 165], color: "#ff69b4", description: "Star re-expanding after late helium flash" },
    { name: "Very Late Thermal Pulse", position: [-195, 75, 195], color: "#deb887", description: "Final helium flash occurring after departure from AGB" },
    { name: "R Coronae Borealis Minimum", position: [185, -95, -175], color: "#2f4f4f", description: "Dramatic fading from carbon dust cloud formation" },
    { name: "Hydrogen-Deficient Carbon Star", position: [-215, 55, 155], color: "#ffefd5", description: "Cool giant with carbon-rich hydrogen-poor atmosphere" },
    { name: "Extreme Helium Star", position: [205, -65, 205], color: "#00bfff", description: "Hot star with helium-dominated atmosphere" },
    { name: "AM CVn System", position: [-185, 85, -185], color: "#9370db", description: "Ultracompact binary transferring helium-rich material" },
    { name: "Double White Dwarf Binary", position: [175, -75, 175], color: "#f5f5f5", description: "Two white dwarfs in close orbit heading toward merger" },
    { name: "Type Ia Progenitor", position: [-225, 95, 165], color: "#fffacd", description: "Binary system destined to produce thermonuclear supernova" },
    { name: "Super-Chandrasekhar Candidate", position: [195, -55, -155], color: "#ffd700", description: "White dwarf potentially exceeding classical mass limit" },
    { name: "Transmission Spectrum", position: [-205, 65, 195], color: "#87ceeb", description: "Atmospheric fingerprint revealed during exoplanet transit" },
    { name: "Emission Spectrum", position: [225, -75, -175], color: "#ffa500", description: "Thermal radiation from exoplanet dayside atmosphere" },
    { name: "Phase Curve", position: [-185, 85, 155], color: "#dda0dd", description: "Brightness variation revealing planetary heat distribution" },
    { name: "Thermal Inversion Layer", position: [195, -95, 185], color: "#ff6347", description: "Atmospheric region where temperature increases with altitude" },
    { name: "Dayside Hot Spot", position: [-215, 55, -165], color: "#ff4500", description: "Shifted thermal maximum from atmospheric winds" },
    { name: "Terminator Region", position: [175, -65, 205], color: "#708090", description: "Day-night boundary zone with unique chemistry" },
    { name: "Nightside Cold Trap", position: [-195, 75, 175], color: "#191970", description: "Region where atmospheric species condense on permanent night" },
    { name: "Magma Ocean World", position: [235, -85, -155], color: "#ff0000", description: "Rocky planet with molten surface from extreme heating" },
    { name: "Lava Hemisphere", position: [-175, 95, 195], color: "#dc143c", description: "Permanent molten dayside of tidally locked rocky world" },
    { name: "Evaporating Atmosphere", position: [205, -55, 165], color: "#add8e6", description: "Planetary atmosphere escaping into space from stellar heating" },
    { name: "Atmospheric Drag", position: [-225, 65, -185], color: "#b0c4de", description: "Comet-like tail of material stripped from close-in planet" },
    { name: "Roche Lobe Overflow Planet", position: [185, -75, 205], color: "#9370db", description: "Planet losing mass to its host star" },
    { name: "Disintegrating Planet", position: [-195, 85, 155], color: "#cd853f", description: "Rocky world shedding dusty debris in orbital trail" },
    { name: "Ring Gap", position: [215, -95, -175], color: "#f5deb3", description: "Clear zone in planetary ring sculpted by moon gravity" },
    { name: "Ringlet", position: [-185, 55, 185], color: "#deb887", description: "Narrow bright ring confined by shepherd moons" },
    { name: "Propeller Structure", position: [175, -65, 175], color: "#ffefd5", description: "Double-armed wake from moonlet embedded in ring" },
    { name: "Spoke Pattern", position: [-235, 75, -165], color: "#e6e6fa", description: "Radial dark features in ring from electromagnetic effects" },
    { name: "Ring Rain", position: [195, -85, 195], color: "#87cefa", description: "Material falling from rings into planetary atmosphere" },
    { name: "Magnetospheric Boundary", position: [-205, 95, 165], color: "#4169e1", description: "Edge where planetary magnetic field meets solar wind" },
    { name: "Plasma Torus", position: [225, -55, -195], color: "#ff69b4", description: "Ring of ionized material from volcanic moon" },
    { name: "Io Flux Tube", position: [-175, 65, 205], color: "#00ff7f", description: "Magnetic connection channeling particles between moon and planet" },
    { name: "Auroral Footprint", position: [185, -75, 155], color: "#00ffff", description: "Glowing spot in atmosphere from moon magnetic connection" },
    { name: "Radio Storm", position: [-215, 85, -175], color: "#ffd700", description: "Intense radio emission from planetary magnetosphere" },
    { name: "Synchrotron Belt", position: [205, -95, 185], color: "#ff1493", description: "Radiation belt of relativistic electrons around giant planet" },
    { name: "Magnetotail Reconnection", position: [-195, 55, 195], color: "#00bfff", description: "Explosive energy release in stretched magnetic field behind planet" },
    { name: "Cryovolcano", position: [175, -65, -185], color: "#e0ffff", description: "Volcano erupting water ice and ammonia instead of lava" },
    { name: "Geyser Plume", position: [-225, 85, 165], color: "#f0f8ff", description: "Jet of material erupting from icy moon subsurface ocean" },
    { name: "Tiger Stripe Fissure", position: [205, -95, 195], color: "#4682b4", description: "Active fracture venting material from subsurface" },
    { name: "Chaos Terrain", position: [-185, 55, -175], color: "#d2691e", description: "Disrupted ice blocks from subsurface ocean interaction" },
    { name: "Lineae Network", position: [195, -75, 175], color: "#8b4513", description: "Crisscrossing ridges and fractures on icy surface" },
    { name: "Cryolava Flow", position: [-215, 95, 185], color: "#b0e0e6", description: "Solidified flood of water-ammonia mixture on icy world" },
    { name: "Sublimation Pit", position: [185, -55, -165], color: "#696969", description: "Depression from ice converting directly to vapor" },
    { name: "Penitente Field", position: [-175, 65, 195], color: "#fffafa", description: "Forest of tall ice spikes from differential sublimation" },
    { name: "Nitrogen Glacier", position: [235, -85, 155], color: "#ffc0cb", description: "Flowing ice made of frozen nitrogen" },
    { name: "Methane Lake", position: [-205, 75, -195], color: "#ff8c00", description: "Liquid hydrocarbon sea on frigid moon surface" },
    { name: "Ethane Rain", position: [175, -95, 205], color: "#daa520", description: "Precipitation of liquid ethane in thick atmosphere" },
    { name: "Tholin Haze", position: [-195, 55, 165], color: "#cd853f", description: "Complex organic aerosols in outer solar system atmosphere" },
    { name: "Prebiotic Chemistry Zone", position: [225, -65, -185], color: "#9acd32", description: "Region where life-precursor molecules form" },
    { name: "Complex Organic Deposit", position: [-185, 85, 175], color: "#8b0000", description: "Surface accumulation of carbon-rich compounds" },
    { name: "Isotope Anomaly", position: [195, -75, 195], color: "#ff69b4", description: "Unusual atomic ratios revealing formation history" },
    { name: "Presolar Grain", position: [-235, 95, -155], color: "#ffd700", description: "Ancient stardust particle predating solar system" },
    { name: "CAI Inclusion", position: [185, -55, 175], color: "#f5f5dc", description: "First solid material condensed in solar nebula" },
    { name: "Chondrule", position: [-175, 65, 205], color: "#deb887", description: "Rapidly cooled molten droplet in primitive meteorite" },
    { name: "Carbonaceous Matrix", position: [215, -85, -175], color: "#2f4f4f", description: "Fine-grained organic-rich material in meteorite" },
    { name: "Aqueous Alteration Zone", position: [-205, 75, 165], color: "#5f9ea0", description: "Region of water-rock interaction in asteroid" },
    { name: "Regolith Layer", position: [175, -95, 185], color: "#808080", description: "Surface blanket of broken rock and dust" },
    { name: "Space Weathering Rind", position: [-195, 55, -185], color: "#a9a9a9", description: "Thin altered surface from micrometeorite and radiation exposure" },
    { name: "Electrostatic Dust Levitation", position: [235, -65, 205], color: "#d3d3d3", description: "Dust floating from surface charging in sunlight" },
    { name: "Yarkovsky Drift", position: [-185, 85, 155], color: "#bc8f8f", description: "Slow orbital change from asymmetric thermal emission" },
    { name: "YORP Spin-Up", position: [205, -75, -165], color: "#f4a460", description: "Asteroid rotation acceleration from sunlight torque" },
    { name: "Binary Asteroid", position: [-175, 95, 195], color: "#a0522d", description: "Two asteroids orbiting common center of mass" },
    { name: "Contact Binary Asteroid", position: [225, -55, -175], color: "#8b4513", description: "Two lobes touching in peanut-shaped configuration" },
    { name: "Rubble Pile Interior", position: [-215, 65, 175], color: "#696969", description: "Loosely bound aggregate of fragments held by gravity" },
    { name: "Monolithic Core", position: [185, -85, 195], color: "#808080", description: "Solid unfractured interior of differentiated body" },
    { name: "Differentiated Asteroid", position: [-195, 75, -165], color: "#b8860b", description: "Body with iron core and rocky mantle layers" },
    { name: "Vesta-type Crust", position: [205, -95, 165], color: "#d2b48c", description: "Basaltic surface from ancient volcanic activity" },
    { name: "Impact Basin Floor", position: [-185, 55, 205], color: "#2f4f4f", description: "Flat terrain from massive collision excavation" },
    { name: "Central Peak", position: [175, -65, -195], color: "#dcdcdc", description: "Uplifted material at center of large impact crater" },
    { name: "Ejecta Blanket", position: [-235, 85, 155], color: "#c0c0c0", description: "Layer of debris thrown out by impact" },
    { name: "Ray System", position: [195, -75, 185], color: "#fffafa", description: "Bright streaks radiating from fresh impact crater" },
    { name: "Secondary Crater Chain", position: [-205, 95, -175], color: "#a9a9a9", description: "Line of craters from ejected block impacts" },
    { name: "Breccia Layer", position: [215, -55, 195], color: "#8b8b83", description: "Jumbled rock fragments welded by impact shock" },
    { name: "Melt Sheet", position: [-175, 65, 175], color: "#4a4a4a", description: "Solidified pool of rock melted by impact energy" },
    { name: "Shatter Cone", position: [185, -85, -165], color: "#708090", description: "Distinctive conical fracture from shock wave passage" },
    { name: "Planar Deformation Feature", position: [-195, 75, 205], color: "#778899", description: "Microscopic shock signature in quartz grain" },
    { name: "Suevite Deposit", position: [235, -95, 155], color: "#556b2f", description: "Impact glass and shocked rock mixture" },
    { name: "Mascon", position: [-215, 55, -185], color: "#cd5c5c", description: "Mass concentration from dense material beneath basin" },
    { name: "Isostatic Rebound", position: [175, -65, 195], color: "#bc8f8f", description: "Slow uplift as crust recovers from impact load" },
    { name: "Tidal Bulge", position: [-185, 85, 165], color: "#f5deb3", description: "Gravitational deformation from nearby massive body" },
    { name: "Tidal Heating Zone", position: [205, -75, -175], color: "#ff4500", description: "Internal heat from orbital flexing" },
    { name: "Resonance Orbit", position: [-225, 95, 195], color: "#6495ed", description: "Orbital period locked in integer ratio with neighbor" },
    { name: "Lagrange Point Cloud", position: [195, -55, 165], color: "#98fb98", description: "Collection of objects at gravitational stability point" },
    { name: "Horseshoe Orbit", position: [-175, 65, -195], color: "#dda0dd", description: "Object swapping between leading and trailing positions" },
    { name: "Quasi-Satellite", position: [215, -85, 205], color: "#87ceeb", description: "Co-orbital object appearing to orbit planet" },
    { name: "Temporary Capture", position: [-205, 75, 155], color: "#ffa07a", description: "Brief gravitational binding of passing object" },
    { name: "21-cm Emission", position: [185, -95, -185], color: "#00ff7f", description: "Radio signature from neutral hydrogen spin flip" },
    { name: "Zeeman Splitting", position: [-175, 55, 195], color: "#9400d3", description: "Spectral line separation revealing magnetic field strength" },
    { name: "Faraday Rotation", position: [225, -65, 175], color: "#ff1493", description: "Polarization twist from magnetized plasma along line of sight" },
    { name: "Dispersion Measure", position: [-215, 85, -165], color: "#00ced1", description: "Signal delay revealing electron column density" },
    { name: "Scintillation Pattern", position: [195, -75, 205], color: "#7b68ee", description: "Twinkling from interstellar turbulence scattering" },
    { name: "Interstellar Scattering Screen", position: [-185, 95, 165], color: "#483d8b", description: "Dense plasma cloud causing angular broadening" },
    { name: "Extreme Scattering Event", position: [175, -55, -195], color: "#8a2be2", description: "Dramatic flux variation from plasma lens crossing" },
    { name: "Intraday Variability", position: [-235, 65, 185], color: "#9932cc", description: "Rapid radio brightness changes from ISM scintillation" },
    { name: "Interplanetary Scintillation", position: [205, -85, 155], color: "#ba55d3", description: "Rapid flux variation from solar wind turbulence" },
    { name: "Solar Radio Burst", position: [-195, 75, -175], color: "#ff6347", description: "Intense emission from solar flare particle acceleration" },
    { name: "Type II Radio Burst", position: [215, -95, 195], color: "#dc143c", description: "Drifting emission from CME shock wave" },
    { name: "Type III Radio Burst", position: [-175, 55, 175], color: "#ff4500", description: "Fast drift from electron beam along magnetic field" },
    { name: "Auroral Kilometric Radiation", position: [185, -65, -165], color: "#00ffff", description: "Intense radio emission from planetary aurora" },
    { name: "Cyclotron Maser", position: [-205, 85, 205], color: "#40e0d0", description: "Coherent amplification in magnetized plasma" },
    { name: "Gyrosynchrotron Emission", position: [175, -75, 185], color: "#48d1cc", description: "Radiation from mildly relativistic spiraling electrons" },
    { name: "Free-Free Absorption", position: [-225, 95, -155], color: "#afeeee", description: "Radio dimming from ionized gas along path" },
    { name: "HII Region Boundary", position: [195, -55, 195], color: "#98fb98", description: "Sharp transition between ionized and neutral gas" },
    { name: "Recombination Line", position: [-185, 65, 165], color: "#90ee90", description: "Radio emission from electron capture by ion" },
    { name: "Carbon Recombination Line", position: [235, -85, -175], color: "#3cb371", description: "Low frequency signature of cool diffuse carbon" },
    { name: "Hydrogen Alpha Emission", position: [-175, 75, 205], color: "#ff69b4", description: "Red glow from electron transition in hydrogen atom" },
    { name: "Forbidden Line Emission", position: [205, -95, 155], color: "#00fa9a", description: "Low density signature from normally prohibited transition" },
    { name: "Coronal Line", position: [-215, 55, -185], color: "#7cfc00", description: "High ionization feature revealing million degree plasma" },
    { name: "Absorption Trough", position: [185, -65, 185], color: "#006400", description: "Dark feature from foreground gas absorbing background light" },
    { name: "Damped Lyman Alpha System (II)", position: [-195, 85, 175], color: "#228b22", description: "Deep absorption from neutral hydrogen cloud at high redshift" },
    { name: "Metal Absorption Line", position: [175, -75, -155], color: "#32cd32", description: "Imprint of heavy elements in intervening gas" },
    { name: "Gravitational Wave Chirp", position: [-225, 95, 195], color: "#ff00ff", description: "Rising frequency signal from inspiraling compact objects" },
    { name: "Merger Ringdown", position: [195, -55, -175], color: "#da70d6", description: "Damped oscillation as merged object settles" },
    { name: "Quasi-Normal Mode", position: [-185, 65, 185], color: "#ee82ee", description: "Characteristic vibration frequency of black hole" },
    { name: "Spin-Orbit Precession", position: [235, -85, 155], color: "#dda0dd", description: "Wobbling orbit from misaligned spin and angular momentum" },
    { name: "Tidal Deformability", position: [-175, 75, -165], color: "#d8bfd8", description: "Neutron star squishing from companion gravity" },
    { name: "Mass Gap Object", position: [205, -95, 205], color: "#4b0082", description: "Compact object in uncertain region between NS and BH" },
    { name: "Hierarchical Merger", position: [-215, 55, 175], color: "#8b008b", description: "Black hole formed from previous merger generation" },
    { name: "Eccentric Binary", position: [175, -65, -185], color: "#9932cc", description: "Compact pair with non-circular orbit" },
    { name: "Head-On Collision", position: [-195, 85, 195], color: "#800080", description: "Direct impact rather than inspiral merger" },
    { name: "Electromagnetic Counterpart", position: [215, -75, 165], color: "#ba55d3", description: "Light signal accompanying gravitational wave event" },
    { name: "Kilonova Optical", position: [-235, 95, -155], color: "#ff6347", description: "Visible light from neutron-rich ejecta radioactive decay" },
    { name: "Kilonova Infrared", position: [185, -55, 185], color: "#ff4500", description: "Heat glow from heavy element synthesis" },
    { name: "R-Process Peak", position: [-175, 65, 175], color: "#ffd700", description: "Element abundance from rapid neutron capture" },
    { name: "Lanthanide Curtain", position: [195, -85, -175], color: "#b8860b", description: "Opacity from freshly synthesized rare earth elements" },
    { name: "Cocoon Breakout", position: [-205, 75, 205], color: "#ff8c00", description: "Shock emergence from jet drilling through merger debris" },
    { name: "Off-Axis Jet View", position: [225, -95, 155], color: "#ffa500", description: "Relativistic outflow seen from angle outside beam" },
    { name: "Structured Jet Profile", position: [-185, 55, -165], color: "#ff7f50", description: "Energy distribution across jet angular extent" },
    { name: "Superluminal Motion", position: [175, -65, 195], color: "#00ffff", description: "Apparent faster-than-light speed from relativistic geometry" },
    { name: "Afterglow Plateau", position: [-215, 85, 175], color: "#e0ffff", description: "Extended flat emission from energy injection" },
    { name: "Jet Break", position: [205, -75, -155], color: "#afeeee", description: "Steepening light curve as jet edge becomes visible" },
    { name: "Reverse Shock Flash", position: [-175, 95, 195], color: "#40e0d0", description: "Brief brightening from shock in jet material" },
    { name: "Refreshed Shock", position: [235, -55, 185], color: "#48d1cc", description: "Late energy injection rejuvenating fading afterglow" },
    { name: "Orphan Optical Transient", position: [-195, 65, -175], color: "#00ced1", description: "Afterglow without detected gamma-ray trigger" },
    { name: "High Energy Neutrino", position: [185, -85, 165], color: "#5f9ea0", description: "Astrophysical messenger particle from extreme acceleration" },
    { name: "Blazar Neutrino Association", position: [-225, 75, 205], color: "#20b2aa", description: "Connection between neutrino and AGN flare" },
    { name: "Cosmic Web Filament", position: [195, -95, -165], color: "#4169e1", description: "Thread of galaxies connecting massive clusters" },
    { name: "Cosmic Web Node (II)", position: [-185, 55, 185], color: "#6495ed", description: "Dense intersection where multiple filaments meet" },
    { name: "Void Wall", position: [175, -65, 195], color: "#87ceeb", description: "Sheet of galaxies bordering cosmic emptiness" },
    { name: "Void Galaxy (II)", position: [-235, 85, -155], color: "#b0c4de", description: "Isolated system evolving in cosmic underdensity" },
    { name: "Great Attractor Region", position: [215, -75, 175], color: "#ff6347", description: "Massive overdensity pulling local galaxies" },
    { name: "Shapley Supercluster (II)", position: [-175, 95, 195], color: "#ffa07a", description: "Largest nearby concentration of galaxy clusters" },
    { name: "Laniakea Basin", position: [205, -55, -185], color: "#f0e68c", description: "Flow pattern defining local supercluster boundary" },
    { name: "Dipole Repeller", position: [-215, 65, 175], color: "#dda0dd", description: "Void region pushing local group motion" },
    { name: "Bulk Flow", position: [185, -85, 165], color: "#98fb98", description: "Coherent large-scale galaxy motion" },
    { name: "Peculiar Velocity Field (II)", position: [-195, 75, -175], color: "#90ee90", description: "Deviations from pure Hubble expansion" },
    { name: "Baryon Acoustic Oscillation (II)", position: [235, -95, 205], color: "#00fa9a", description: "Imprint of primordial sound waves in galaxy distribution" },
    { name: "Sound Horizon", position: [-175, 55, 185], color: "#7cfc00", description: "Maximum distance sound traveled before recombination" },
    { name: "Silk Damping Scale", position: [195, -65, -155], color: "#adff2f", description: "Smallest fluctuations surviving photon diffusion" },
    { name: "Reionization Bubble (II)", position: [-205, 85, 195], color: "#ffff00", description: "Ionized region around first luminous sources" },
    { name: "Stromgren Sphere", position: [175, -75, 175], color: "#ffd700", description: "Fully ionized zone around UV source" },
    { name: "Gunn-Peterson Damping Wing", position: [-225, 95, -165], color: "#f0fff0", description: "Absorption profile revealing neutral epoch end" },
    { name: "Dark Matter Halo (II)", position: [215, -55, 195], color: "#483d8b", description: "Invisible gravitational scaffold hosting galaxy" },
    { name: "NFW Profile", position: [-185, 65, 175], color: "#4b0082", description: "Universal density distribution of dark matter" },
    { name: "Halo Cusp", position: [205, -85, -175], color: "#8b008b", description: "Central density spike in dark matter distribution" },
    { name: "Halo Core", position: [-175, 75, 205], color: "#9400d3", description: "Flattened central region from self-interaction" },
    { name: "Subhalo", position: [185, -95, 165], color: "#9932cc", description: "Smaller dark matter clump within larger halo" },
    { name: "Tidal Stream Progenitor", position: [-235, 55, -185], color: "#ba55d3", description: "Dwarf galaxy source of stellar debris trail" },
    { name: "Missing Satellite", position: [195, -65, 195], color: "#da70d6", description: "Predicted dark subhalo without visible galaxy" },
    { name: "Ultra-Faint Dwarf", position: [-195, 85, 175], color: "#ee82ee", description: "Extremely dim galaxy dominated by dark matter" },
    { name: "Fossil Dwarf Galaxy", position: [175, -75, -155], color: "#dda0dd", description: "Ancient relic system from early universe" },
    { name: "Population III Remnant", position: [-180, 88, 168], color: "#ffd700", description: "Chemical signature of first generation stars" },
    { name: "Cosmic Dawn Galaxy", position: [172, -82, -163], color: "#ff6347", description: "Galaxy from universe first billion years" },
    { name: "Lyman-Alpha Emitter", position: [-168, 76, 154], color: "#00ffff", description: "High-redshift galaxy detected via hydrogen emission" },
    { name: "Lyman-Break Galaxy", position: [156, -68, -147], color: "#9370db", description: "Distant galaxy identified by UV absorption dropout" },
    { name: "Submillimeter Galaxy", position: [-152, 62, 138], color: "#ff8c00", description: "Dusty starburst seen in far-infrared" },
    { name: "Quasar Host Galaxy", position: [144, -56, -132], color: "#8a2be2", description: "Galaxy harboring actively feeding supermassive black hole" },
    { name: "Damped Lyman-Alpha System", position: [-138, 48, 124], color: "#20b2aa", description: "High column density neutral hydrogen absorber" },
    { name: "Metal-Poor Globular", position: [128, -42, -118], color: "#4169e1", description: "Ancient cluster with primordial composition" },
    { name: "Ultra-Metal-Poor Star", position: [-122, 36, 108], color: "#ffa07a", description: "Second generation star with trace metals" },
    { name: "Carbon-Enhanced Metal-Poor", position: [114, -28, -102], color: "#cd853f", description: "Ancient star enriched by first supernovae" },
    { name: "R-Process Enhanced Star", position: [-106, 22, 94], color: "#daa520", description: "Star bearing neutron star merger products" },
    { name: "Chemically Peculiar Star", position: [98, -16, -86], color: "#f0e68c", description: "Star with unusual elemental abundances" },
    { name: "Lambda Bootis Star (II)", position: [-92, 8, 78], color: "#e6e6fa", description: "A-type star depleted in iron-peak elements" },
    { name: "Am Star (II)", position: [84, -4, -72], color: "#fffacd", description: "Metallic-line A star with slow rotation" },
    { name: "Ap Star (II)", position: [-78, -6, 64], color: "#dda0dd", description: "A-type peculiar star with strong magnetic field" },
    { name: "HgMn Star", position: [72, 12, -58], color: "#d8bfd8", description: "B star with mercury and manganese enhancement" },
    { name: "Barium Star (II)", position: [-66, 18, 52], color: "#f5deb3", description: "Giant enriched by mass transfer from AGB companion" },
    { name: "CH Star", position: [58, -24, -46], color: "#ffdead", description: "Carbon and s-process enhanced giant" },
    { name: "S-Type Star", position: [-52, 32, 38], color: "#ffb6c1", description: "AGB star with zirconium oxide bands" },
    { name: "Technetium Star", position: [46, -38, -32], color: "#ff69b4", description: "AGB star proving internal nucleosynthesis" },
    { name: "Lithium-Rich Giant", position: [-42, 44, 26], color: "#ffc0cb", description: "Evolved star with unexplained lithium abundance" },
    { name: "Super Lithium-Rich Giant", position: [38, -52, -22], color: "#db7093", description: "Giant with thousand times solar lithium" },
    { name: "Thorne-Zytkow Object (III)", position: [-34, 58, 18], color: "#c71585", description: "Theoretical neutron star inside red giant" },
    { name: "Quasi-Star", position: [28, -64, -14], color: "#8b0000", description: "Hypothetical black hole powered supergiant" },
    { name: "Dark Star Candidate", position: [-24, 72, 12], color: "#2f4f4f", description: "Proposed dark matter annihilation powered star" },
    { name: "Primordial Black Hole (III)", position: [182, -78, 172], color: "#1a1a2e", description: "Hypothetical black hole from early universe density fluctuations" },
    { name: "Intermediate Mass Black Hole (II)", position: [-176, 72, -166], color: "#2d2d44", description: "Elusive black hole between stellar and supermassive" },
    { name: "Wandering Black Hole (II)", position: [168, -66, 158], color: "#3d3d5c", description: "Ejected or orphan black hole roaming intergalactic space" },
    { name: "Direct Collapse Black Hole", position: [-162, 58, -152], color: "#4a4a6a", description: "Supermassive seed formed without stellar precursor" },
    { name: "Blazar Jet Base", position: [154, -52, 144], color: "#9932cc", description: "Relativistic jet launching region near event horizon" },
    { name: "Event Horizon Silhouette", position: [-148, 44, -138], color: "#ff4500", description: "Shadow cast by black hole against bright accretion" },
    { name: "Photon Ring", position: [142, -38, 132], color: "#ffd700", description: "Light orbiting just outside event horizon" },
    { name: "ISCO Emission", position: [-136, 32, -126], color: "#ff6347", description: "Radiation from innermost stable circular orbit" },
    { name: "Relativistic Jet Knot", position: [128, -26, 118], color: "#00bfff", description: "Bright emission region in astrophysical jet" },
    { name: "Hotspot Superluminal", position: [-122, 18, -112], color: "#7fffd4", description: "Apparent faster-than-light motion in jet" },
    { name: "Doppler Boosted Jet", position: [114, -12, 104], color: "#00ff7f", description: "Relativistically brightened approaching jet" },
    { name: "Counter-Jet", position: [-108, 6, -98], color: "#4682b4", description: "Faint receding jet opposite to boosted one" },
    { name: "Jet Termination Lobe", position: [102, 2, 92], color: "#ff69b4", description: "Extended radio lobe where jet impacts IGM" },
    { name: "Hotspot Complex", position: [-96, -8, -86], color: "#ffa07a", description: "Shock-heated region at jet termination" },
    { name: "Backflow Region", position: [88, 14, 78], color: "#dda0dd", description: "Plasma flowing back from jet impact zone" },
    { name: "Radio Bridge", position: [-82, -22, -72], color: "#98fb98", description: "Emission connecting double radio sources" },
    { name: "Giant Radio Galaxy", position: [76, 28, 66], color: "#f0e68c", description: "Radio source spanning megaparsecs" },
    { name: "Compact Steep Spectrum (II)", position: [-68, -34, -58], color: "#e6e6fa", description: "Young powerful radio source confined to host" },
    { name: "Peaked Spectrum Source", position: [62, 42, 52], color: "#fffacd", description: "Radio source with turnover frequency" },
    { name: "GPS Radio Source", position: [-56, -48, -46], color: "#ffefd5", description: "Gigahertz-peaked spectrum compact source" },
    { name: "CSS Radio Source", position: [48, 54, 38], color: "#ffebcd", description: "Compact steep spectrum young radio galaxy" },
    { name: "Dying Radio Galaxy", position: [-42, -62, -32], color: "#8b4513", description: "Fading radio source with ceased AGN activity" },
    { name: "Restarted Radio Galaxy", position: [36, 68, 26], color: "#cd853f", description: "AGN with multiple epochs of jet activity" },
    { name: "Double-Double Radio Galaxy", position: [-28, -74, -18], color: "#d2691e", description: "Source with two pairs of radio lobes" },
    { name: "X-Shaped Radio Galaxy", position: [22, 82, 14], color: "#b8860b", description: "Radio source with cross-shaped morphology" },
    { name: "Infrared Dark Cloud", position: [-186, 84, 176], color: "#2f2f2f", description: "Dense molecular cloud silhouetted against galactic background" },
    { name: "Hot Molecular Core", position: [178, -78, -168], color: "#ff4500", description: "Warm dense region around forming massive star" },
    { name: "Ultracompact HII Region", position: [-172, 68, 162], color: "#ff6347", description: "Tiny ionized region around newborn O-star" },
    { name: "Hypercompact HII Region", position: [164, -62, -154], color: "#ff7f50", description: "Extremely small dense ionized nebula" },
    { name: "Extended Green Object", position: [-158, 54, 148], color: "#00ff00", description: "Shocked outflow with enhanced 4.5 micron emission" },
    { name: "Infrared Excess Source", position: [152, -48, -142], color: "#ffd700", description: "Star with circumstellar dust emission" },
    { name: "Class 0 Protostar", position: [-146, 42, 136], color: "#8b0000", description: "Youngest embedded protostellar phase" },
    { name: "Class I Protostar", position: [138, -36, -128], color: "#a52a2a", description: "Protostar with infalling envelope and disk" },
    { name: "Flat Spectrum Source", position: [-132, 28, 122], color: "#cd853f", description: "Transitional protostar between Class I and II" },
    { name: "Class II T Tauri", position: [126, -22, -116], color: "#daa520", description: "Pre-main-sequence star with optically thick disk" },
    { name: "Class III Weak-Line T Tauri", position: [-118, 16, 108], color: "#f0e68c", description: "Young star with dissipated disk" },
    { name: "Herbig Ae/Be Star (II)", position: [112, -8, -102], color: "#e6e6fa", description: "Intermediate mass pre-main-sequence star" },
    { name: "FU Orionis Outburst", position: [-106, 4, 96], color: "#ff1493", description: "Dramatic accretion burst in young star" },
    { name: "EX Lupi Variable (II)", position: [98, 2, -88], color: "#db7093", description: "Repetitive accretion outbursts in T Tauri" },
    { name: "X-Ray Binary Flare", position: [-92, -6, 82], color: "#00ffff", description: "Sudden X-ray brightening from accreting compact object" },
    { name: "Type I X-Ray Burst", position: [86, 12, -76], color: "#7fffd4", description: "Thermonuclear flash on neutron star surface" },
    { name: "Type II X-Ray Burst", position: [-78, -18, 68], color: "#40e0d0", description: "Accretion instability driven X-ray flare" },
    { name: "Superburst", position: [72, 24, -62], color: "#00ced1", description: "Carbon-triggered thermonuclear runaway" },
    { name: "Quasi-Periodic Oscillation", position: [-66, -32, 56], color: "#48d1cc", description: "Recurring X-ray variability from inner disk" },
    { name: "Kilohertz QPO", position: [58, 38, -48], color: "#afeeee", description: "High-frequency oscillation near ISCO" },
    { name: "Low-Frequency QPO", position: [-52, -44, 42], color: "#b0e0e6", description: "Slower disk oscillation in X-ray binaries" },
    { name: "X-Ray Pulsar Beam", position: [46, 52, -36], color: "#87ceeb", description: "Magnetically channeled accretion column" },
    { name: "Accretion Column Shock", position: [-38, -58, 28], color: "#87cefa", description: "Standing shock where infalling matter impacts" },
    { name: "Cyclotron Resonance", position: [32, 64, -22], color: "#add8e6", description: "Spectral feature from magnetic field strength" },
    { name: "Gamma-Ray Burst Afterglow", position: [-26, -72, 16], color: "#e0ffff", description: "Fading multi-wavelength emission post-GRB" },
    { name: "Coronal Mass Ejection (II)", position: [188, -86, 178], color: "#ff4500", description: "Massive solar plasma eruption into space" },
    { name: "Solar Energetic Particle Event", position: [-182, 78, -172], color: "#ffa500", description: "High-energy particles accelerated by solar activity" },
    { name: "Forbush Decrease", position: [174, -72, 164], color: "#4169e1", description: "Temporary cosmic ray intensity drop from CME shield" },
    { name: "Ground Level Enhancement", position: [-168, 66, -158], color: "#ff6347", description: "Solar particles detected at Earth surface" },
    { name: "Geomagnetic Storm", position: [162, -58, 152], color: "#9400d3", description: "Disturbance in Earth magnetosphere from solar wind" },
    { name: "Substorm Injection", position: [-156, 52, -146], color: "#8a2be2", description: "Energetic particle burst into inner magnetosphere" },
    { name: "Ring Current Enhancement", position: [148, -46, 138], color: "#9932cc", description: "Strengthened particle belt during geomagnetic activity" },
    { name: "Radiation Belt Slot", position: [-142, 38, -132], color: "#ba55d3", description: "Gap between inner and outer Van Allen belts" },
    { name: "Plasmasphere Drainage Plume", position: [136, -32, 126], color: "#da70d6", description: "Cold plasma escaping during storm times" },
    { name: "Polar Cap Absorption", position: [-128, 26, -118], color: "#ee82ee", description: "Radio blackout from solar particle ionization" },
    { name: "Sudden Ionospheric Disturbance", position: [122, -18, 112], color: "#dda0dd", description: "Rapid ionosphere change from solar flare" },
    { name: "Traveling Ionospheric Disturbance", position: [-116, 12, -106], color: "#d8bfd8", description: "Wave propagating through ionosphere" },
    { name: "Equatorial Spread F", position: [108, -6, 98], color: "#e6e6fa", description: "Plasma irregularities in equatorial ionosphere" },
    { name: "Sporadic E Layer", position: [-102, 4, -92], color: "#f0f8ff", description: "Thin intense ionization patches" },
    { name: "Noctilucent Cloud (II)", position: [96, 8, 86], color: "#b0e0e6", description: "Highest atmospheric ice crystals visible at twilight" },
    { name: "Polar Mesospheric Cloud", position: [-88, -14, -78], color: "#87ceeb", description: "Ice clouds at mesopause seen from space" },
    { name: "Airglow Layer", position: [82, 22, 72], color: "#7fffd4", description: "Faint atmospheric emission from excited molecules" },
    { name: "Sprite Lightning (II)", position: [-76, -28, -66], color: "#ff0000", description: "Large-scale electrical discharge above thunderstorms" },
    { name: "Blue Jet (II)", position: [68, 34, 58], color: "#0000ff", description: "Upward electrical discharge from storm tops" },
    { name: "Elve Ring (II)", position: [-62, -42, -52], color: "#ff1493", description: "Expanding ionospheric glow from lightning pulse" },
    { name: "Terrestrial Gamma-Ray Flash", position: [56, 48, 46], color: "#ffd700", description: "Gamma rays produced by thunderstorm electrons" },
    { name: "Ball Lightning", position: [-48, -54, -38], color: "#ffff00", description: "Rare luminous spherical atmospheric phenomenon" },
    { name: "St. Elmo Fire", position: [42, 62, 32], color: "#00ff7f", description: "Plasma discharge from pointed objects in storms" },
    { name: "Volcanic Lightning", position: [-36, -68, -26], color: "#ff8c00", description: "Electrical activity in volcanic ash plumes" },
    { name: "Dust Devil Electrification", position: [28, 76, 18], color: "#d2691e", description: "Charge separation in rotating dust columns" },
    { name: "Habitable Zone Planet", position: [-192, 88, 182], color: "#228b22", description: "World within star liquid water temperature range" },
    { name: "Super-Earth", position: [184, -82, -176], color: "#8b4513", description: "Rocky planet larger than Earth smaller than Neptune" },
    { name: "Mini-Neptune", position: [-178, 74, 168], color: "#4682b4", description: "Small gas-rich planet with thick atmosphere" },
    { name: "Sub-Neptune", position: [172, -68, -162], color: "#5f9ea0", description: "Planet between super-Earth and Neptune mass" },
    { name: "Water World", position: [-166, 62, 154], color: "#00bfff", description: "Planet with global ocean hundreds of km deep" },
    { name: "Hycean World", position: [158, -56, -148], color: "#20b2aa", description: "Hydrogen-rich ocean planet potentially habitable" },
    { name: "Eyeball Planet", position: [-152, 48, 142], color: "#ff6347", description: "Tidally locked world with habitable terminator" },
    { name: "Lava World", position: [146, -42, -136], color: "#ff4500", description: "Extremely hot planet with molten surface" },
    { name: "Carbon Planet", position: [-138, 36, 128], color: "#2f4f4f", description: "Carbide and graphite rich exotic world" },
    { name: "Iron Planet", position: [132, -28, -122], color: "#708090", description: "Mercury-like world with massive iron core" },
    { name: "Chthonian Planet", position: [-126, 22, 114], color: "#696969", description: "Former gas giant stripped to rocky core" },
    { name: "Puffy Planet", position: [118, -16, -108], color: "#ffa07a", description: "Inflated hot Jupiter with anomalously low density" },
    { name: "Ultra-Short Period Planet (II)", position: [-112, 8, 102], color: "#ff1493", description: "World orbiting in less than one Earth day" },
    { name: "Circumbinary Planet (III)", position: [106, -4, -96], color: "#9370db", description: "Planet orbiting two stars" },
    { name: "Circumtriple Planet", position: [-98, -6, 88], color: "#8a2be2", description: "Hypothetical world around triple star system" },
    { name: "Rogue Planet (II)", position: [92, 12, -82], color: "#191970", description: "Free-floating world ejected from its system" },
    { name: "Planetary Embryo", position: [-86, -18, 76], color: "#daa520", description: "Moon-sized body in planet formation process" },
    { name: "Oligarch Planet", position: [78, 24, -68], color: "#cd853f", description: "Dominant body accreting nearby planetesimals" },
    { name: "Giant Impact Debris", position: [-72, -32, 62], color: "#d2691e", description: "Material from catastrophic planetary collision" },
    { name: "Late Heavy Bombardment", position: [66, 38, -56], color: "#8b0000", description: "Intense cratering epoch evidence" },
    { name: "Biosignature Candidate", position: [-58, -44, 48], color: "#32cd32", description: "Atmospheric hint of possible biological origin" },
    { name: "Oxygen False Positive", position: [52, 52, -42], color: "#98fb98", description: "Abiotic O2 production mechanism" },
    { name: "Methane Disequilibrium", position: [-46, -58, 36], color: "#90ee90", description: "Coexisting gases suggesting active chemistry" },
    { name: "Phosphine Anomaly", position: [38, 64, -28], color: "#adff2f", description: "Unexpected reduced phosphorus compound" },
    { name: "Technosignature Search", position: [-32, -72, 22], color: "#00ff00", description: "Hunt for signs of extraterrestrial technology" },
    { name: "Cosmic Microwave Background (II)", position: [196, -92, 186], color: "#fffaf0", description: "Relic radiation from recombination epoch" },
    { name: "CMB Cold Spot", position: [-188, 84, -178], color: "#4682b4", description: "Anomalously cool region in microwave sky" },
    { name: "CMB Hot Spot", position: [182, -78, 172], color: "#ff6347", description: "Temperature fluctuation above average" },
    { name: "Sachs-Wolfe Plateau", position: [-176, 72, -166], color: "#f5deb3", description: "Large-scale CMB anisotropy from potential wells" },
    { name: "Integrated Sachs-Wolfe", position: [168, -66, 158], color: "#deb887", description: "CMB effect from evolving gravitational potentials" },
    { name: "Sunyaev-Zeldovich Effect (II)", position: [-162, 58, -152], color: "#d2b48c", description: "CMB distortion from hot cluster gas" },
    { name: "Kinetic SZ Signal", position: [154, -52, 144], color: "#bc8f8f", description: "CMB shift from cluster peculiar velocity" },
    { name: "CMB Lensing Convergence", position: [-148, 46, -138], color: "#f4a460", description: "Large-scale structure imprint on CMB" },
    { name: "B-Mode Polarization", position: [142, -38, 132], color: "#e9967a", description: "Curl pattern potentially from gravitational waves" },
    { name: "E-Mode Polarization", position: [-136, 32, -126], color: "#fa8072", description: "Gradient polarization from density fluctuations" },
    { name: "Primordial Non-Gaussianity", position: [128, -26, 118], color: "#ffa07a", description: "Departure from Gaussian initial conditions" },
    { name: "Inflation Field Remnant", position: [-122, 18, -112], color: "#ff7f50", description: "Signature of early exponential expansion" },
    { name: "Reheating Relic", position: [114, -12, 104], color: "#ff6347", description: "Particle production after inflation ended" },
    { name: "Axion Dark Matter", position: [-108, 6, -98], color: "#483d8b", description: "Ultralight bosonic dark matter candidate" },
    { name: "WIMP Signature", position: [102, 2, 92], color: "#6a5acd", description: "Hypothetical weakly interacting massive particle" },
    { name: "Primordial Nucleosynthesis", position: [-96, -8, -86], color: "#7b68ee", description: "Light element formation in early universe" },
    { name: "Deuterium Abundance", position: [88, 14, 78], color: "#9370db", description: "Primordial hydrogen isotope fraction" },
    { name: "Helium-4 Primordial", position: [-82, -22, -72], color: "#8a2be2", description: "Big Bang helium production" },
    { name: "Lithium Problem", position: [76, 28, 66], color: "#9932cc", description: "Discrepancy between predicted and observed Li" },
    { name: "Neutrino Background", position: [-68, -34, -58], color: "#ba55d3", description: "Cosmic relic neutrinos from early universe" },
    { name: "Neutrino Mass Bound", position: [62, 42, 52], color: "#da70d6", description: "Cosmological constraint on neutrino masses" },
    { name: "Dark Energy Equation", position: [-56, -48, -46], color: "#ee82ee", description: "Parameter describing cosmic acceleration" },
    { name: "Quintessence Field", position: [48, 54, 38], color: "#dda0dd", description: "Dynamic dark energy scalar field" },
    { name: "Phantom Energy", position: [-42, -62, -32], color: "#d8bfd8", description: "Dark energy with w less than -1" },
    { name: "Big Rip Horizon", position: [36, 68, 26], color: "#e6e6fa", description: "Ultimate fate in phantom energy universe" },
    { name: "Adaptive Optics Correction", position: [-198, 94, 188], color: "#00ced1", description: "Real-time atmospheric turbulence compensation" },
    { name: "Laser Guide Star", position: [192, -88, -182], color: "#ffd700", description: "Artificial reference for wavefront sensing" },
    { name: "Speckle Pattern", position: [-186, 82, 176], color: "#f0e68c", description: "Atmospheric seeing frozen in short exposures" },
    { name: "Lucky Imaging Frame", position: [178, -76, -168], color: "#bdb76b", description: "Rare moment of excellent seeing captured" },
    { name: "Interferometric Fringe", position: [-172, 68, 162], color: "#9acd32", description: "Interference pattern from multiple telescopes" },
    { name: "Closure Phase", position: [164, -62, -154], color: "#6b8e23", description: "Interferometry observable immune to atmosphere" },
    { name: "Aperture Synthesis Image", position: [-158, 56, 148], color: "#556b2f", description: "High resolution from combined baselines" },
    { name: "Coronagraph Dark Hole", position: [152, -48, -142], color: "#2f4f4f", description: "Starlight suppression region for exoplanet imaging" },
    { name: "Starshade Shadow", position: [-146, 42, 136], color: "#3c3c3c", description: "External occulter blocking stellar light" },
    { name: "Nulling Interferometer", position: [138, -36, -128], color: "#4a4a4a", description: "Destructive interference to cancel starlight" },
    { name: "Astrometric Wobble", position: [-132, 28, 122], color: "#708090", description: "Stellar position shift from planetary companion" },
    { name: "Radial Velocity Curve", position: [126, -22, -116], color: "#778899", description: "Doppler shift pattern revealing orbiting body" },
    { name: "Transit Light Curve", position: [-118, 16, 108], color: "#b0c4de", description: "Brightness dip from planet crossing star" },
    { name: "Secondary Eclipse", position: [112, -8, -102], color: "#add8e6", description: "Planet disappearing behind host star" },
    { name: "Phase Curve Modulation", position: [-106, 4, 96], color: "#87ceeb", description: "Brightness variation through orbit phases" },
    { name: "Rossiter-McLaughlin Effect", position: [98, 2, -88], color: "#87cefa", description: "Spectroscopic anomaly during transit" },
    { name: "Doppler Tomography", position: [-92, -6, 82], color: "#00bfff", description: "Velocity-resolved stellar surface mapping" },
    { name: "Zeeman Doppler Imaging", position: [86, 12, -76], color: "#1e90ff", description: "Magnetic field mapping from spectropolarimetry" },
    { name: "Asteroseismic Mode (II)", position: [-78, -18, 68], color: "#4169e1", description: "Stellar oscillation revealing internal structure" },
    { name: "Solar-Like Oscillation", position: [72, 24, -62], color: "#6495ed", description: "Acoustic modes in sun-like stars" },
    { name: "Delta Scuti Pulsation", position: [-66, -32, 56], color: "#7b68ee", description: "Rapid oscillation in A/F-type stars" },
    { name: "Gamma Doradus Mode", position: [58, 38, -48], color: "#9370db", description: "Gravity-mode pulsation in cool stars" },
    { name: "Slowly Pulsating B Star (II)", position: [-52, -44, 42], color: "#8a2be2", description: "Non-radial g-modes in B-type stars" },
    { name: "Beta Cephei Oscillation", position: [46, 52, -36], color: "#9400d3", description: "Pressure modes in hot massive stars" },
    { name: "Rotationally Split Modes", position: [-38, -58, 28], color: "#8b008b", description: "Frequency splitting revealing stellar rotation" },
    { name: "Galactic Warp", position: [198, -96, 192], color: "#daa520", description: "Disk bending away from midplane at outskirts" },
    { name: "Galactic Flare", position: [-194, 92, -186], color: "#cd853f", description: "Disk thickening with increasing radius" },
    { name: "Galactic Bar (II)", position: [186, -86, 178], color: "#d2691e", description: "Elongated stellar structure in galaxy center" },
    { name: "Bar Resonance", position: [-182, 78, -172], color: "#8b4513", description: "Orbital frequency matching bar pattern speed" },
    { name: "Corotation Radius", position: [174, -72, 164], color: "#a0522d", description: "Where stars orbit at bar rotation rate" },
    { name: "Inner Lindblad Resonance", position: [-168, 66, -158], color: "#6b4423", description: "Inner orbital resonance with spiral pattern" },
    { name: "Outer Lindblad Resonance", position: [162, -58, 152], color: "#5c4033", description: "Outer boundary of spiral wave propagation" },
    { name: "Spiral Density Wave", position: [-156, 52, -146], color: "#4a3728", description: "Pattern propagating through galactic disk" },
    { name: "Pitch Angle Variation", position: [148, -46, 138], color: "#3d2b1f", description: "Changing tightness of spiral arms" },
    { name: "Spur Structure", position: [-142, 38, -132], color: "#654321", description: "Secondary feature branching from main arm" },
    { name: "Feather Structure", position: [136, -32, 126], color: "#704214", description: "Fine filaments along spiral arm edges" },
    { name: "Nuclear Ring", position: [-128, 26, -118], color: "#ff6600", description: "Star-forming ring around galactic nucleus" },
    { name: "Inner Ring", position: [122, -18, 112], color: "#ff9900", description: "Stellar ring at end of galactic bar" },
    { name: "Outer Ring", position: [-116, 12, -106], color: "#ffcc00", description: "Faint ring at edge of spiral structure" },
    { name: "Pseudoring", position: [108, -6, 98], color: "#ffff00", description: "Nearly closed spiral arm mimicking ring" },
    { name: "Lens Component", position: [-102, 4, -92], color: "#cccc00", description: "Smooth oval structure between bar and disk" },
    { name: "Barlens", position: [96, 8, -86], color: "#999900", description: "Boxy inner structure of face-on bars" },
    { name: "Ansae", position: [-88, -14, -78], color: "#666600", description: "Bright enhancements at bar ends" },
    { name: "X-Structure", position: [82, 22, 72], color: "#808000", description: "Boxy/peanut shape from bar buckling" },
    { name: "Boxy Peanut Bulge", position: [-76, -28, 66], color: "#556b2f", description: "Vertically thickened bar viewed edge-on" },
    { name: "Classical Bulge", position: [68, 34, -58], color: "#6b8e23", description: "Merger-built spheroidal central component" },
    { name: "Disky Pseudobulge", position: [-62, -42, 52], color: "#9acd32", description: "Disk-like central component from secular evolution" },
    { name: "Nuclear Star Disk", position: [56, 48, -46], color: "#32cd32", description: "Tiny stellar disk in galaxy nucleus" },
    { name: "Kinematically Decoupled Core", position: [-48, -54, 38], color: "#228b22", description: "Counter-rotating central stellar population" },
    { name: "Embedded Disk", position: [42, 62, -32], color: "#008000", description: "Disk structure within elliptical galaxy" },
    { name: "Tidal Bridge", position: [-196, 98, 194], color: "#4169e1", description: "Stellar stream connecting interacting galaxies" },
    { name: "Tidal Tail", position: [192, -94, -188], color: "#6495ed", description: "Extended debris from gravitational encounter" },
    { name: "Plume Structure", position: [-188, 88, 182], color: "#7b68ee", description: "Diffuse stellar fan from minor merger" },
    { name: "Shell Galaxy (II)", position: [184, -82, -176], color: "#9370db", description: "Concentric stellar arcs from radial merger" },
    { name: "Ripple Structure", position: [-178, 76, 168], color: "#8a2be2", description: "Phase-wrapped debris from accreted satellite" },
    { name: "Umbrella Feature", position: [172, -68, -162], color: "#9932cc", description: "Parabolic stream from disrupted dwarf" },
    { name: "Great Circle Stream", position: [-166, 64, 156], color: "#ba55d3", description: "Debris following polar orbit around host" },
    { name: "Stellar Halo Substructure (II)", position: [158, -56, -148], color: "#da70d6", description: "Fossil evidence of ancient accretion" },
    { name: "Ghostly Stream", position: [-152, 48, 142], color: "#dda0dd", description: "Very low surface brightness tidal debris" },
    { name: "Monoceros Ring", position: [146, -42, -136], color: "#ee82ee", description: "Ring-like structure in Milky Way outskirts" },
    { name: "Virgo Overdensity", position: [-138, 36, 128], color: "#d8bfd8", description: "Stellar cloud from ancient merger" },
    { name: "Gaia Sausage Debris", position: [132, -28, -122], color: "#e6e6fa", description: "Remnant of major early Milky Way merger" },
    { name: "Merger Nucleus", position: [-126, 22, 114], color: "#ff4500", description: "Surviving core of absorbed galaxy" },
    { name: "Double Nucleus", position: [118, -16, -106], color: "#ff6347", description: "Two nuclei in ongoing merger" },
    { name: "Ultraluminous Infrared Galaxy", position: [-112, 8, 102], color: "#ff7f50", description: "Extreme starburst triggered by merger" },
    { name: "Luminous Infrared Galaxy", position: [106, -4, -96], color: "#ffa500", description: "Dusty merger with enhanced star formation" },
    { name: "Post-Starburst Galaxy", position: [-98, -6, 88], color: "#ffb6c1", description: "Recent quenching after merger-triggered burst" },
    { name: "E+A Galaxy", position: [92, 12, -82], color: "#ffc0cb", description: "Elliptical with A-star spectrum from recent burst" },
    { name: "Green Valley Galaxy", position: [-86, -18, 76], color: "#98fb98", description: "Transitioning between star-forming and quiescent" },
    { name: "Red Nugget", position: [78, 24, -68], color: "#8b0000", description: "Compact massive quiescent galaxy" },
    { name: "Blue Nugget", position: [-72, -32, 62], color: "#0000cd", description: "Compact massive star-forming galaxy" },
    { name: "Compact Elliptical (II)", position: [66, 38, -56], color: "#dc143c", description: "Small dense elliptical possibly stripped" },
    { name: "Diffuse Dwarf", position: [-58, -44, 48], color: "#ff69b4", description: "Extended low surface brightness dwarf" },
    { name: "Ultra-Diffuse Galaxy", position: [52, 52, -42], color: "#ffb6c1", description: "Giant galaxy with extremely low surface brightness" },
    { name: "Dark Galaxy Candidate", position: [-46, -58, 36], color: "#2f4f4f", description: "Gas-rich system with minimal stars" },
    { name: "Stellar Tidal Stream", position: [72, -44, 18], color: "#c0a080", description: "Stars stripped from dwarf galaxy merger" },
    { name: "Phase Space Spiral", position: [-38, 52, -64], color: "#a8d8ea", description: "Galactic disk perturbation signature" },
    { name: "Bar Resonance Zone", position: [54, -28, 76], color: "#f4a460", description: "Orbital trapping near galactic bar" },
    { name: "Corotation Circle", position: [-66, 34, -42], color: "#90ee90", description: "Spiral arm pattern speed boundary" },
    { name: "Lindblad Resonance", position: [48, -56, 28], color: "#dda0dd", description: "Inner resonance driving spiral structure" },
    { name: "Dark Matter Spike", position: [-52, 42, -78], color: "#483d8b", description: "Central density enhancement near SMBH" },
    { name: "Velocity Dispersion Map", position: [68, -38, 54], color: "#ff6b6b", description: "Stellar motion randomness visualization" },
    { name: "Anisotropic Halo", position: [-44, 58, -36], color: "#6b8e23", description: "Non-spherical dark matter distribution" },
    { name: "Triaxial Bulge", position: [36, -62, 44], color: "#cd853f", description: "Three-axis stellar bulge structure" },
    { name: "Pseudo-Bulge Region", position: [-58, 26, -58], color: "#b8860b", description: "Disk-like central stellar concentration" },
    { name: "Nuclear Star Cluster (III)", position: [62, -48, 32], color: "#ffd700", description: "Compact central stellar overdensity" },
    { name: "Circumnuclear Ring", position: [-36, 64, -24], color: "#ff69b4", description: "Star-forming ring around nucleus" },
    { name: "Molecular Cloud Complex", position: [44, -54, 66], color: "#4682b4", description: "Giant molecular cloud association" },
    { name: "Superbubble Cavity", position: [-68, 38, -52], color: "#e0ffff", description: "Hot gas cavity from supernovae" },
    { name: "Chimney Structure (II)", position: [56, -32, 48], color: "#f0e68c", description: "Hot gas venting from disk" },
    { name: "Worm Feature", position: [-42, 56, -38], color: "#d2691e", description: "Elongated HI structure in disk" },
    { name: "High-Velocity Cloud", position: [74, -46, 22], color: "#40e0d0", description: "Gas falling toward galactic disk" },
    { name: "Magellanic Stream Analog", position: [-54, 44, -66], color: "#87ceeb", description: "Tidal gas from satellite interaction" },
    { name: "Leading Arm Feature", position: [38, -58, 58], color: "#98fb98", description: "Gas preceding orbiting satellite" },
    { name: "Galactic Fountain Flow", position: [-64, 32, -44], color: "#afeeee", description: "Recycled gas returning to disk" },
    { name: "Metallicity Gradient Map", position: [52, -42, 36], color: "#ffb6c1", description: "Radial chemical abundance variation" },
    { name: "Age-Metallicity Relation", position: [-48, 62, -28], color: "#ffa07a", description: "Stellar age vs composition trend" },
    { name: "Alpha Enhancement Zone", position: [66, -36, 72], color: "#20b2aa", description: "Region enriched by core-collapse SNe" },
    { name: "R-Process Site", position: [-56, 28, -54], color: "#9370db", description: "Neutron-capture element production" },
    { name: "S-Process Contributor", position: [42, -66, 26], color: "#f08080", description: "AGB star heavy element factory" },
    { name: "Convective Envelope", position: [-62, 48, 34], color: "#ff8c00", description: "Turbulent stellar outer layer" },
    { name: "Radiative Zone Boundary", position: [58, -52, -46], color: "#ffd700", description: "Energy transport transition region" },
    { name: "Tachocline Layer", position: [-46, 38, 68], color: "#ff6347", description: "Solar rotation shear layer" },
    { name: "Magnetic Flux Tube", position: [64, -34, -58], color: "#4169e1", description: "Concentrated magnetic field bundle" },
    { name: "Stellar Dynamo Region", position: [-38, 56, 44], color: "#9932cc", description: "Magnetic field generation zone" },
    { name: "Meridional Flow Cell", position: [52, -48, -32], color: "#3cb371", description: "Pole-to-equator circulation" },
    { name: "Differential Rotation Map", position: [-56, 42, 56], color: "#f0e68c", description: "Latitude-dependent spin rate" },
    { name: "Rossby Wave Pattern", position: [46, -62, -44], color: "#00ced1", description: "Planetary-scale atmospheric wave" },
    { name: "Starspot Umbra", position: [-68, 28, 38], color: "#2f4f4f", description: "Dark magnetic cool region" },
    { name: "Penumbral Filament", position: [72, -38, -52], color: "#8b4513", description: "Radial structure around sunspot" },
    { name: "Light Bridge Crossing", position: [-44, 64, 26], color: "#f5deb3", description: "Bright lane dividing sunspot" },
    { name: "Facular Region", position: [38, -56, -66], color: "#fffacd", description: "Bright magnetic concentration" },
    { name: "Network Element", position: [-52, 36, 62], color: "#e0ffff", description: "Supergranule boundary brightness" },
    { name: "Internetwork Field", position: [66, -44, -38], color: "#b0c4de", description: "Weak mixed-polarity region" },
    { name: "Ephemeral Region", position: [-36, 58, 48], color: "#dda0dd", description: "Short-lived bipolar emergence" },
    { name: "Moreton Wave Front", position: [54, -32, -72], color: "#ff69b4", description: "Chromospheric flare shock" },
    { name: "EIT Wave Expansion", position: [-64, 46, 32], color: "#87cefa", description: "Coronal disturbance propagation" },
    { name: "Coronal Hole Boundary", position: [48, -58, -28], color: "#191970", description: "Open field region edge" },
    { name: "Plume Structure (II)", position: [-58, 32, 74], color: "#e6e6fa", description: "Polar coronal ray" },
    { name: "Polar Crown Filament", position: [76, -42, -48], color: "#ff4500", description: "High-latitude prominence chain" },
    { name: "Helmet Streamer Base", position: [-42, 68, 22], color: "#fafad2", description: "Closed field arcade root" },
    { name: "Pseudo-Streamer", position: [34, -64, -54], color: "#ffe4b5", description: "Same-polarity dividing structure" },
    { name: "Heliospheric Plasma Sheet", position: [-74, 26, 46], color: "#7fffd4", description: "Current sheet extension" },
    { name: "Corotating Interaction Region", position: [62, -36, -62], color: "#ff7f50", description: "Fast-slow wind collision zone" },
    { name: "Stream Interaction Front", position: [-48, 54, 58], color: "#00fa9a", description: "Solar wind compression boundary" },
    { name: "N-Body Simulation Node", position: [56, -42, 64], color: "#6a5acd", description: "Gravitational many-body calculation" },
    { name: "SPH Particle Cloud", position: [-62, 38, -48], color: "#48d1cc", description: "Smoothed particle hydrodynamics blob" },
    { name: "AMR Grid Refinement", position: [44, -56, 52], color: "#9acd32", description: "Adaptive mesh resolution zone" },
    { name: "MHD Shock Capture", position: [-54, 48, -36], color: "#ff6b6b", description: "Magnetized fluid discontinuity" },
    { name: "Radiative Transfer Path", position: [68, -34, 46], color: "#ffd93d", description: "Photon propagation calculation" },
    { name: "Monte Carlo Scatter", position: [-46, 62, -54], color: "#c9b1ff", description: "Probabilistic radiation interaction" },
    { name: "Chemical Network Node", position: [52, -48, 72], color: "#98d8c8", description: "Reaction rate computation point" },
    { name: "Cooling Function Map", position: [-68, 32, -42], color: "#87ceeb", description: "Temperature-dependent energy loss" },
    { name: "Equation of State Point", position: [36, -64, 38], color: "#f4a460", description: "Pressure-density-temperature relation" },
    { name: "Opacity Table Lookup", position: [-42, 56, -66], color: "#deb887", description: "Material transparency data" },
    { name: "Neutrino Transport Path", position: [74, -38, 54], color: "#e6e6fa", description: "Weakly interacting particle flow" },
    { name: "Gravitational Softening", position: [-58, 44, -28], color: "#b8860b", description: "Force smoothing length marker" },
    { name: "Tree Code Branch", position: [48, -52, 68], color: "#2e8b57", description: "Hierarchical force calculation" },
    { name: "FFT Grid Cell", position: [-36, 68, -44], color: "#4682b4", description: "Fourier transform mesh point" },
    { name: "Boundary Condition Face", position: [62, -28, 42], color: "#cd853f", description: "Simulation domain edge treatment" },
    { name: "Initial Conditions Seed", position: [-72, 36, -52], color: "#da70d6", description: "Primordial fluctuation origin" },
    { name: "Power Spectrum Mode", position: [38, -66, 56], color: "#20b2aa", description: "Fourier space density component" },
    { name: "Halo Finder Output", position: [-48, 58, -38], color: "#ff7f50", description: "Structure identification result" },
    { name: "Merger Tree Branch", position: [66, -44, 34], color: "#9370db", description: "Assembly history connection" },
    { name: "Semi-Analytic Model", position: [-56, 42, -72], color: "#f0e68c", description: "Simplified galaxy formation recipe" },
    { name: "Subgrid Physics Kernel", position: [54, -58, 48], color: "#ff69b4", description: "Unresolved process parameterization" },
    { name: "Feedback Injection Site", position: [-44, 66, -26], color: "#ffa500", description: "Energy deposition location" },
    { name: "Turbulent Driving Scale", position: [72, -32, 62], color: "#00ced1", description: "Velocity fluctuation injection" },
    { name: "Magnetic Seed Field", position: [-66, 28, -58], color: "#8a2be2", description: "Primordial magnetization" },
    { name: "Cosmic Ray Diffusion", position: [42, -72, 28], color: "#32cd32", description: "High-energy particle propagation" },
    { name: "Cosmic String Segment", position: [-52, 46, 38], color: "#ff00ff", description: "Topological defect from early universe" },
    { name: "Domain Wall Fragment", position: [58, -38, -54], color: "#8b0000", description: "Phase transition boundary relic" },
    { name: "Monopole Candidate", position: [-44, 62, 46], color: "#ffd700", description: "Hypothetical magnetic singularity" },
    { name: "Texture Knot", position: [66, -52, -38], color: "#7b68ee", description: "Non-trivial field configuration" },
    { name: "Primordial Black Hole (IV)", position: [-68, 34, 64], color: "#1a1a2e", description: "Early universe density fluctuation collapse" },
    { name: "Wormhole Throat Model", position: [48, -64, -46], color: "#4b0082", description: "Theoretical spacetime tunnel" },
    { name: "White Hole Candidate", position: [-36, 58, 52], color: "#ffffff", description: "Time-reversed black hole" },
    { name: "Naked Singularity (II)", position: [72, -42, -62], color: "#dc143c", description: "Unshielded spacetime cusp" },
    { name: "Closed Timelike Curve (II)", position: [-58, 48, 28], color: "#9400d3", description: "Theoretical time loop" },
    { name: "Alcubierre Metric Zone", position: [42, -68, -34], color: "#00ffff", description: "Warp drive spacetime model" },
    { name: "Negative Energy Region", position: [-74, 28, 58], color: "#2f4f4f", description: "Exotic matter requirement" },
    { name: "Casimir Vacuum", position: [56, -34, -72], color: "#e0e0e0", description: "Quantum vacuum energy density" },
    { name: "False Vacuum Bubble", position: [-46, 66, 36], color: "#ff4500", description: "Metastable quantum state" },
    { name: "True Vacuum Front", position: [64, -48, -28], color: "#228b22", description: "Phase transition expansion" },
    { name: "Quantum Foam Sample", position: [-62, 38, 68], color: "#dda0dd", description: "Planck-scale spacetime texture" },
    { name: "Holographic Boundary", position: [38, -72, -52], color: "#ffa07a", description: "Information encoding surface" },
    { name: "Extra Dimension Portal", position: [-54, 54, 44], color: "#ba55d3", description: "Higher dimensional access point" },
    { name: "Brane Collision Site", position: [76, -36, -44], color: "#ff6347", description: "Membrane universe interaction" },
    { name: "Multiverse Junction", position: [-42, 72, 32], color: "#00fa9a", description: "Parallel reality intersection" },
    { name: "Boltzmann Brain Locus", position: [52, -58, -66], color: "#f0e68c", description: "Spontaneous fluctuation emergence" },
    { name: "Eternal Inflation Bubble", position: [-66, 44, 54], color: "#87cefa", description: "Forever expanding pocket universe" },
    { name: "Big Crunch Horizon", position: [44, -66, -38], color: "#8b4513", description: "Collapsing universe boundary" },
    { name: "Big Rip Frontier", position: [-48, 62, 48], color: "#ff1493", description: "Phantom energy expansion edge" },
    { name: "Heat Death Remnant", position: [68, -44, -58], color: "#696969", description: "Maximum entropy final state" },
    { name: "Cosmic Omega Point", position: [-38, 76, 26], color: "#ffd700", description: "Ultimate convergence of complexity" },
    { name: "Adaptive Optics Beacon", position: [54, -46, 62], color: "#ff8c00", description: "Laser guide star reference" },
    { name: "Interferometry Baseline", position: [-62, 52, -34], color: "#00bfff", description: "Multi-telescope resolution boost" },
    { name: "Coronagraph Mask", position: [46, -58, 48], color: "#2f2f2f", description: "Stellar light suppression device" },
    { name: "Spectrograph Slit", position: [-48, 66, -46], color: "#c0c0c0", description: "Light dispersion entrance" },
    { name: "CCD Focal Plane", position: [68, -34, 56], color: "#708090", description: "Digital light detector array" },
    { name: "Filter Wheel Position", position: [-56, 44, -58], color: "#9370db", description: "Wavelength selection mechanism" },
    { name: "Dome Slit Opening", position: [38, -72, 34], color: "#1e90ff", description: "Telescope sky access window" },
    { name: "Mount Axis Point", position: [-72, 36, -42], color: "#cd853f", description: "Telescope rotation center" },
    { name: "Autoguider Lock", position: [62, -48, 68], color: "#32cd32", description: "Tracking correction reference" },
    { name: "Flat Field Frame", position: [-44, 58, -36], color: "#f5f5dc", description: "Detector calibration image" },
    { name: "Dark Current Map", position: [56, -62, 44], color: "#191970", description: "Thermal noise pattern" },
    { name: "Bias Level Offset", position: [-66, 42, -52], color: "#4682b4", description: "Electronic readout baseline" },
    { name: "Point Spread Function", position: [44, -56, 72], color: "#ff69b4", description: "Optical system response" },
    { name: "Airy Disk Pattern", position: [-54, 68, -28], color: "#e6e6fa", description: "Diffraction-limited spot" },
    { name: "Seeing Disk Blur", position: [74, -38, 52], color: "#b0c4de", description: "Atmospheric turbulence effect" },
    { name: "Speckle Pattern (II)", position: [-38, 74, -44], color: "#ffa07a", description: "Short-exposure interference" },
    { name: "Lucky Imaging Frame (II)", position: [52, -44, 64], color: "#98fb98", description: "Best seeing moment capture" },
    { name: "Aperture Synthesis Map", position: [-68, 48, -38], color: "#dda0dd", description: "Combined baseline image" },
    { name: "UV Coverage Plot", position: [36, -68, 38], color: "#7fffd4", description: "Spatial frequency sampling" },
    { name: "Dirty Beam Pattern", position: [-46, 62, -66], color: "#f0e68c", description: "Incomplete sampling artifact" },
    { name: "CLEAN Algorithm Output", position: [66, -52, 46], color: "#00fa9a", description: "Deconvolved source image" },
    { name: "Maximum Entropy Map", position: [-58, 38, -54], color: "#ff7f50", description: "Information-theoretic reconstruction" },
    { name: "Visibility Amplitude", position: [48, -64, 58], color: "#20b2aa", description: "Correlated signal strength" },
    { name: "Phase Closure Triangle", position: [-74, 44, -32], color: "#da70d6", description: "Self-calibration geometry" },
    { name: "Baseline Delay Line", position: [58, -36, 76], color: "#f4a460", description: "Path length compensation" },
    { name: "Radio Dish Focus", position: [-42, 56, 42], color: "#c0c0c0", description: "Parabolic antenna focal point" },
    { name: "Feed Horn Assembly", position: [64, -48, -54], color: "#b8860b", description: "Signal collection element" },
    { name: "Low-Noise Amplifier", position: [-56, 44, 56], color: "#4169e1", description: "Weak signal boosting stage" },
    { name: "Correlator Bank", position: [48, -62, -38], color: "#2e8b57", description: "Signal cross-multiplication array" },
    { name: "Backend Processor", position: [-68, 38, 48], color: "#8b4513", description: "Data digitization system" },
    { name: "RFI Excision Filter", position: [56, -44, -66], color: "#dc143c", description: "Interference removal mask" },
    { name: "Pulsar Timer Clock", position: [-44, 68, 34], color: "#ffd700", description: "Precision timing reference" },
    { name: "Dispersion Measure Path", position: [72, -36, -48], color: "#9370db", description: "Interstellar electron column" },
    { name: "Rotation Measure Probe", position: [-52, 52, 64], color: "#ff69b4", description: "Magnetic field line integral" },
    { name: "Faraday Screen", position: [38, -74, -34], color: "#6a5acd", description: "Polarization rotation layer" },
    { name: "Scintillation Arc", position: [-66, 42, 46], color: "#00ced1", description: "ISM refraction pattern" },
    { name: "HI 21cm Emission", position: [54, -56, -58], color: "#87ceeb", description: "Neutral hydrogen line" },
    { name: "Maser Amplification", position: [-48, 64, 52], color: "#ff4500", description: "Stimulated microwave emission" },
    { name: "Zeeman Splitting Site", position: [66, -42, -44], color: "#9932cc", description: "Magnetic field strength indicator" },
    { name: "Synchrotron Hotspot", position: [-74, 34, 38], color: "#ff6347", description: "Relativistic electron emission" },
    { name: "Inverse Compton Zone", position: [42, -66, -72], color: "#e0ffff", description: "Photon energy upscattering" },
    { name: "Thermal Bremsstrahlung", position: [-58, 48, 68], color: "#ffa500", description: "Free-free emission region" },
    { name: "Cyclotron Line Source", position: [76, -38, -36], color: "#da70d6", description: "Quantized magnetic emission" },
    { name: "Pair Annihilation Site", position: [-36, 72, 44], color: "#ffff00", description: "Electron-positron destruction" },
    { name: "Cherenkov Light Pool", position: [58, -52, -62], color: "#00bfff", description: "Faster-than-light-in-medium glow" },
    { name: "Air Shower Maximum", position: [-62, 46, 58], color: "#98fb98", description: "Cosmic ray cascade peak" },
    { name: "Muon Track Chamber", position: [44, -68, -28], color: "#708090", description: "Particle trajectory detector" },
    { name: "Neutrino Interaction", position: [-54, 58, 36], color: "#e6e6fa", description: "Weak force event vertex" },
    { name: "Gravitational Wave Strain", position: [68, -44, -52], color: "#f0e68c", description: "Spacetime ripple amplitude" },
    { name: "LIGO Arm Cavity", position: [-46, 66, 72], color: "#c0c0c0", description: "Laser interferometer path" },
    { name: "Spacecraft Trajectory Arc", position: [52, -58, 44], color: "#1e90ff", description: "Orbital mechanics path" },
    { name: "Gravity Assist Slingshot", position: [-64, 42, -48], color: "#ff8c00", description: "Planetary momentum transfer" },
    { name: "Lagrange Point Station", position: [46, -72, 36], color: "#32cd32", description: "Gravitational equilibrium" },
    { name: "Halo Orbit Path", position: [-54, 56, -54], color: "#dda0dd", description: "Libration point trajectory" },
    { name: "Solar Sail Deployment", position: [68, -44, 58], color: "#ffd700", description: "Photon pressure propulsion" },
    { name: "Ion Thruster Plume", position: [-48, 68, -36], color: "#00ffff", description: "Electric propulsion exhaust" },
    { name: "Aerobraking Corridor", position: [38, -66, 48], color: "#ff6347", description: "Atmospheric deceleration zone" },
    { name: "Entry Interface Point", position: [-72, 38, -44], color: "#dc143c", description: "Atmospheric entry altitude" },
    { name: "Heat Shield Ablation", position: [58, -52, 64], color: "#8b4513", description: "Thermal protection erosion" },
    { name: "Parachute Deployment Altitude", position: [-46, 64, -58], color: "#f5f5dc", description: "Descent system activation" },
    { name: "Powered Descent Phase", position: [74, -36, 42], color: "#ff4500", description: "Retrorocket landing sequence" },
    { name: "Touchdown Ellipse", position: [-58, 48, -66], color: "#98fb98", description: "Landing uncertainty zone" },
    { name: "Rover Traverse Path", position: [44, -74, 54], color: "#d2691e", description: "Surface exploration route" },
    { name: "Sample Cache Site", position: [-66, 44, -38], color: "#c0c0c0", description: "Collected material depot" },
    { name: "Drill Core Location", position: [56, -48, 72], color: "#708090", description: "Subsurface sampling point" },
    { name: "Seismometer Station", position: [-42, 72, -46], color: "#4682b4", description: "Ground vibration sensor" },
    { name: "Weather Station Data", position: [66, -56, 38], color: "#87ceeb", description: "Atmospheric monitoring site" },
    { name: "Magnetometer Reading", position: [-74, 36, -52], color: "#9932cc", description: "Magnetic field measurement" },
    { name: "Radar Sounding Track", position: [48, -62, 66], color: "#2e8b57", description: "Subsurface imaging path" },
    { name: "Laser Altimeter Point", position: [-56, 58, -34], color: "#ff69b4", description: "Topographic height data" },
    { name: "Thermal Emission Map", position: [72, -42, 48], color: "#ff7f50", description: "Surface temperature image" },
    { name: "Gravity Field Anomaly", position: [-44, 66, -72], color: "#6a5acd", description: "Mass distribution variation" },
    { name: "Orbital Decay Track", position: [36, -68, 56], color: "#b22222", description: "Atmospheric drag trajectory" },
    { name: "Debris Field Mapping", position: [-68, 48, -28], color: "#696969", description: "Space junk distribution" },
    { name: "Rendezvous Approach Cone", position: [62, -38, 74], color: "#00fa9a", description: "Spacecraft docking corridor" },
    { name: "Habitable Zone Inner Edge", position: [-52, 54, 46], color: "#ff6347", description: "Runaway greenhouse boundary" },
    { name: "Habitable Zone Outer Edge", position: [58, -64, -42], color: "#4682b4", description: "Maximum greenhouse limit" },
    { name: "Tidal Locking Boundary", position: [-68, 42, 58], color: "#dda0dd", description: "Synchronous rotation zone" },
    { name: "Biosignature Detection", position: [44, -56, -66], color: "#32cd32", description: "Life indicator spectrum" },
    { name: "Oxygen Rise Event", position: [-46, 68, 38], color: "#00bfff", description: "Great oxidation marker" },
    { name: "Methane Disequilibrium (II)", position: [72, -38, -54], color: "#98fb98", description: "Biological activity hint" },
    { name: "Phosphine Signature", position: [-58, 48, 64], color: "#ff69b4", description: "Potential biogas trace" },
    { name: "Technosignature Search (II)", position: [36, -72, -38], color: "#ffd700", description: "Artificial signal hunt" },
    { name: "Dyson Sphere Candidate", position: [-74, 36, 52], color: "#b8860b", description: "Megastructure indicator" },
    { name: "Laser Sail Detection", position: [66, -44, -58], color: "#ff4500", description: "Directed energy propulsion" },
    { name: "Radio Leakage Zone", position: [-44, 72, 44], color: "#9370db", description: "Unintentional broadcast region" },
    { name: "Arecibo Message Path", position: [54, -58, -48], color: "#1e90ff", description: "Intentional transmission route" },
    { name: "Voyager Golden Record", position: [-66, 44, 68], color: "#ffd700", description: "Interstellar time capsule" },
    { name: "Pioneer Plaque Location", position: [48, -66, -34], color: "#c0c0c0", description: "Message to the stars" },
    { name: "Galactic Habitable Zone", position: [-54, 58, 54], color: "#90ee90", description: "Metallicity sweet spot" },
    { name: "Stellar Quiet Zone", position: [76, -42, -64], color: "#e6e6fa", description: "Low flare activity region" },
    { name: "Magnetic Shielding Field", position: [-48, 66, 36], color: "#8a2be2", description: "Radiation protection" },
    { name: "Ozone Layer Formation", position: [42, -74, -46], color: "#87ceeb", description: "UV shielding development" },
    { name: "Liquid Water Stability", position: [-72, 38, 62], color: "#00ced1", description: "Phase diagram sweet spot" },
    { name: "Carbonate-Silicate Cycle", position: [68, -48, -52], color: "#d2691e", description: "Climate thermostat" },
    { name: "Plate Tectonics Zone", position: [-56, 52, 48], color: "#8b4513", description: "Geological recycling region" },
    { name: "Ocean Circulation Cell", position: [38, -68, -72], color: "#4169e1", description: "Heat distribution current" },
    { name: "Snowball Earth Marker", position: [-62, 46, 72], color: "#f0f8ff", description: "Global glaciation event" },
    { name: "Mass Extinction Horizon", position: [62, -54, -38], color: "#dc143c", description: "Biodiversity crash layer" },
    { name: "Cambrian Explosion Site", position: [-42, 74, 42], color: "#ff8c00", description: "Life diversification burst" },
    { name: "Cosmic Web Node (III)", position: [54, -48, 56], color: "#9370db", description: "Galaxy cluster intersection" },
    { name: "Filament Bridge", position: [-66, 52, -44], color: "#6a5acd", description: "Intergalactic matter strand" },
    { name: "Void Interior", position: [42, -72, 38], color: "#191970", description: "Cosmic emptiness center" },
    { name: "Sheet Structure", position: [-54, 44, -68], color: "#b0c4de", description: "Planar galaxy distribution" },
    { name: "Supervoid Region", position: [68, -36, 64], color: "#2f4f4f", description: "Giant underdense volume" },
    { name: "Cold Spot Anomaly", position: [-48, 68, -36], color: "#4682b4", description: "CMB temperature dip" },
    { name: "Warm-Hot Intergalactic Medium", position: [56, -58, 48], color: "#ff7f50", description: "Missing baryon reservoir" },
    { name: "Lyman-Alpha Forest", position: [-72, 38, -52], color: "#00bfff", description: "Intergalactic gas absorption" },
    { name: "Gunn-Peterson Trough (II)", position: [38, -66, 72], color: "#1e90ff", description: "Reionization epoch marker" },
    { name: "Damped Lyman-Alpha System (II)", position: [-58, 56, -42], color: "#4169e1", description: "High column density absorber" },
    { name: "Metal Absorption System", position: [74, -42, 52], color: "#c0c0c0", description: "Enriched gas tracer" },
    { name: "Proximity Effect Zone", position: [-44, 72, -58], color: "#ffd700", description: "QSO ionization sphere" },
    { name: "Cosmic Shear Map", position: [48, -54, 66], color: "#dda0dd", description: "Weak lensing distortion" },
    { name: "Dark Matter Filament", position: [-68, 46, -34], color: "#483d8b", description: "Invisible mass strand" },
    { name: "Subhalo Population", position: [62, -48, 44], color: "#8b4513", description: "Dwarf-scale dark clumps" },
    { name: "Tidal Disruption Stream", position: [-52, 64, -46], color: "#cd853f", description: "Stripped satellite debris" },
    { name: "Phase-Space Fold", position: [36, -74, 58], color: "#ff69b4", description: "Shell crossing caustic" },
    { name: "Core-Cusp Transition", position: [-76, 34, -64], color: "#9932cc", description: "Density profile change" },
    { name: "Splashback Radius (II)", position: [66, -38, 76], color: "#f4a460", description: "Halo accretion boundary" },
    { name: "Virial Shock Front", position: [-46, 58, -72], color: "#ff4500", description: "Infalling gas heating" },
    { name: "Cooling Flow Region", position: [58, -66, 42], color: "#87ceeb", description: "Radiatively cooling gas" },
    { name: "Feedback Bubble", position: [-62, 48, -38], color: "#ff6347", description: "AGN heating cavity" },
    { name: "Metal Enrichment Plume", position: [44, -56, 68], color: "#2e8b57", description: "Superwind outflow" },
    { name: "Recycled Gas Inflow", position: [-54, 66, -54], color: "#20b2aa", description: "Fountain mode return" },
    { name: "Baryon Cycle Node", position: [72, -44, 54], color: "#00fa9a", description: "Matter circulation hub" },
    { name: "Population III Remnant (II)", position: [-58, 52, 48], color: "#e0e0e0", description: "First generation star fossil" },
    { name: "Extremely Metal-Poor Star", position: [46, -68, -52], color: "#f5f5dc", description: "Ancient chemical signature" },
    { name: "Carbon-Enhanced Star", position: [-72, 38, 62], color: "#8b4513", description: "Unusual abundance pattern" },
    { name: "R-Process Enhanced Star (II)", position: [64, -44, -44], color: "#9370db", description: "Heavy element enriched" },
    { name: "Chemically Peculiar Star (II)", position: [-48, 66, 54], color: "#da70d6", description: "Abundance anomaly object" },
    { name: "Am Star Spectrum", position: [38, -74, -38], color: "#dda0dd", description: "Metallic-line peculiarity" },
    { name: "Ap Star Magnetic Field", position: [-66, 44, 68], color: "#8a2be2", description: "Strongly magnetized atmosphere" },
    { name: "Lambda Bootis Type", position: [56, -52, -66], color: "#b0c4de", description: "Metal-depleted surface" },
    { name: "Barium Star System", position: [-54, 58, 42], color: "#ffd700", description: "Mass transfer enrichment" },
    { name: "CH Star Carbon", position: [74, -36, -54], color: "#cd853f", description: "Carbon-rich giant" },
    { name: "Horizontal Branch Star (II)", position: [-42, 72, 58], color: "#4169e1", description: "Core helium burning phase" },
    { name: "Blue Straggler Formation", position: [48, -66, -42], color: "#00bfff", description: "Rejuvenated cluster member" },
    { name: "Yellow Straggler", position: [-68, 46, 64], color: "#ffd700", description: "Evolved blue straggler" },
    { name: "Sub-Subgiant Branch", position: [62, -48, -58], color: "#f4a460", description: "Unusual evolutionary track" },
    { name: "Red Clump Star", position: [-56, 54, 46], color: "#ff6347", description: "Standard candle marker" },
    { name: "Asymptotic Giant Bump", position: [36, -72, -34], color: "#ff8c00", description: "Shell burning transition" },
    { name: "Thermal Pulse Phase", position: [-74, 42, 56], color: "#dc143c", description: "AGB helium flash cycle" },
    { name: "Third Dredge-Up Event", position: [68, -38, -72], color: "#32cd32", description: "Carbon mixing episode" },
    { name: "Hot Bottom Burning", position: [-46, 68, 38], color: "#ff4500", description: "Envelope nucleosynthesis" },
    { name: "Super-AGB Star", position: [54, -58, -46], color: "#b22222", description: "Massive asymptotic giant" },
    { name: "Electron Capture Supernova (II)", position: [-62, 48, 72], color: "#ffff00", description: "O-Ne-Mg core collapse" },
    { name: "Pair Instability Region", position: [42, -76, -56], color: "#ff69b4", description: "Photon-electron disruption" },
    { name: "Pulsational Pair Instability", position: [-52, 62, 44], color: "#9932cc", description: "Repeated mass ejection" },
    { name: "Failed Supernova Site", position: [76, -42, -38], color: "#2f4f4f", description: "Direct collapse to black hole" },
    { name: "Accretion-Induced Collapse", position: [-44, 74, 62], color: "#4682b4", description: "White dwarf to neutron star" },
    { name: "Balmer Series Emission", position: [58, -34, 82], color: "#ff6b6b", description: "Hydrogen recombination lines" },
    { name: "Lyman Alpha Forest (II)", position: [-72, 46, -54], color: "#87ceeb", description: "Intergalactic hydrogen absorption" },
    { name: "Damped Lyman Alpha System (III)", position: [34, -58, 66], color: "#4169e1", description: "High column density absorber" },
    { name: "Metal Line Absorber", position: [-46, 72, -42], color: "#c0c0c0", description: "Heavy element signatures" },
    { name: "Broad Absorption Line Region", position: [62, -44, -74], color: "#9370db", description: "Quasar outflow signatures" },
    { name: "P Cygni Profile Source", position: [-54, 38, 58], color: "#00ced1", description: "Wind-driven line asymmetry" },
    { name: "Emission Line Galaxy", position: [76, -66, 32], color: "#32cd32", description: "Star formation indicators" },
    { name: "Seyfert Emission Region", position: [-38, 54, -68], color: "#ff4500", description: "Active nucleus narrow lines" },
    { name: "Forbidden Line Nebula", position: [44, -72, 54], color: "#da70d6", description: "Low-density transition zones" },
    { name: "Coronal Line Emitter", position: [-66, 42, 76], color: "#ffd700", description: "Highly ionized species" },
    { name: "Stellar Chromosphere", position: [52, -38, -62], color: "#ff8c00", description: "Temperature inversion layer" },
    { name: "Transition Region Interface", position: [-42, 68, 44], color: "#ee82ee", description: "Chromosphere-corona boundary" },
    { name: "Photospheric Granulation", position: [68, -54, 38], color: "#ffb347", description: "Convection cell patterns" },
    { name: "Stellar Limb Darkening", position: [-56, 46, -52], color: "#cd853f", description: "Center-to-edge brightness gradient" },
    { name: "Zeeman Splitting Field", position: [38, -64, 72], color: "#b22222", description: "Magnetic line broadening" },
    { name: "Stark Broadening Zone", position: [-74, 52, -36], color: "#dda0dd", description: "Electric field line effects" },
    { name: "Rotational Broadening Star", position: [46, -42, -58], color: "#20b2aa", description: "Doppler-spread spectral lines" },
    { name: "Microturbulence Region", position: [-52, 74, 66], color: "#778899", description: "Small-scale velocity fields" },
    { name: "Macroturbulence Zone", position: [64, -58, 42], color: "#696969", description: "Large-scale atmospheric motions" },
    { name: "Spectral Line Inversion", position: [-36, 48, -74], color: "#ff69b4", description: "Temperature gradient reversal" },
    { name: "Isotope Shift Detection", position: [72, -46, 56], color: "#98fb98", description: "Nuclear mass signatures" },
    { name: "Hyperfine Structure Line", position: [-58, 62, -44], color: "#afeeee", description: "Nuclear spin coupling" },
    { name: "Curve of Growth Analysis", position: [42, -74, 68], color: "#f0e68c", description: "Abundance determination method" },
    { name: "Equivalent Width Mapping", position: [-64, 38, 52], color: "#deb887", description: "Line strength measurements" },
    { name: "Spectropolarimetry Target", position: [56, -52, -66], color: "#8a2be2", description: "Polarized light analysis" },
    { name: "Proton-Proton Chain Site", position: [-48, 56, 74], color: "#ffff00", description: "Core hydrogen fusion" },
    { name: "CNO Cycle Region", position: [66, -42, -52], color: "#00ff7f", description: "Catalytic hydrogen burning" },
    { name: "Triple Alpha Process", position: [-54, 68, 38], color: "#ff4500", description: "Helium to carbon fusion" },
    { name: "Carbon Burning Shell", position: [42, -56, 64], color: "#ff6347", description: "Neon-magnesium production" },
    { name: "Neon Burning Layer", position: [-72, 44, -46], color: "#ff8c00", description: "Oxygen-magnesium synthesis" },
    { name: "Oxygen Burning Shell", position: [58, -74, 52], color: "#ffa500", description: "Silicon group elements" },
    { name: "Silicon Burning Core", position: [-36, 62, -58], color: "#dc143c", description: "Iron peak production" },
    { name: "Neutron Capture Site", position: [74, -48, 36], color: "#4682b4", description: "Heavy element formation" },
    { name: "S-Process Branch Point", position: [-62, 52, 72], color: "#9370db", description: "Slow neutron capture path" },
    { name: "R-Process Nucleus", position: [46, -66, -44], color: "#8b0000", description: "Rapid neutron capture" },
    { name: "P-Process Region", position: [-44, 76, 56], color: "#ff69b4", description: "Proton-rich isotope creation" },
    { name: "Neutrino-Driven Wind", position: [68, -38, -68], color: "#00ced1", description: "Proto-neutron star outflow" },
    { name: "Alpha-Rich Freeze-Out", position: [-56, 48, 42], color: "#ffd700", description: "Explosive nucleosynthesis" },
    { name: "Nuclear Statistical Equilibrium", position: [38, -72, 58], color: "#b8860b", description: "Iron peak conditions" },
    { name: "Photodisintegration Zone", position: [-68, 54, -34], color: "#ff1493", description: "Gamma-ray nucleus breakup" },
    { name: "Spallation Signature", position: [52, -44, 76], color: "#32cd32", description: "Cosmic ray fragmentation" },
    { name: "Lithium Depletion Star", position: [-42, 66, -62], color: "#f0e68c", description: "Light element destruction" },
    { name: "Beryllium Production Site", position: [76, -58, 44], color: "#98fb98", description: "Rare light isotope source" },
    { name: "Boron Anomaly Region", position: [-58, 42, 68], color: "#afeeee", description: "Unusual abundance pattern" },
    { name: "Fluorine Factory Star", position: [44, -76, -56], color: "#40e0d0", description: "AGB fluorine enrichment" },
    { name: "Technetium-Rich Giant", position: [-74, 56, 38], color: "#da70d6", description: "Short-lived element presence" },
    { name: "Barium Star System (II)", position: [62, -34, -74], color: "#dda0dd", description: "Mass transfer s-process" },
    { name: "Lead Star Atmosphere", position: [-46, 72, 54], color: "#778899", description: "Heavy s-process products" },
    { name: "Actinide Boost Zone", position: [54, -62, 66], color: "#c71585", description: "Uranium-thorium excess" },
    { name: "Cosmochronometer Star", position: [-66, 48, -42], color: "#20b2aa", description: "Radioactive age dating" },
    { name: "Phase Space Spiral (II)", position: [48, -56, 72], color: "#9370db", description: "Vertical oscillation pattern" },
    { name: "Radial Migration Zone", position: [-64, 42, -54], color: "#20b2aa", description: "Orbital radius evolution" },
    { name: "Churning Region", position: [56, -74, 38], color: "#daa520", description: "Angular momentum exchange" },
    { name: "Blurring Zone", position: [-42, 68, 66], color: "#778899", description: "Epicyclic heating effects" },
    { name: "Resonance Overlap Area", position: [72, -38, -62], color: "#ff6347", description: "Bar-spiral interaction" },
    { name: "Corotation Circle (II)", position: [-58, 54, 44], color: "#ffd700", description: "Pattern speed matching" },
    { name: "Lindblad Resonance Ring", position: [34, -66, 58], color: "#00ced1", description: "Orbital frequency ratios" },
    { name: "Ultra-Lindblad Zone", position: [-76, 46, -36], color: "#da70d6", description: "Higher order resonances" },
    { name: "Velocity Ellipsoid", position: [62, -52, 74], color: "#87ceeb", description: "Stellar dispersion shape" },
    { name: "Vertex Deviation Field", position: [-44, 72, -58], color: "#f0e68c", description: "Non-axisymmetric motions" },
    { name: "Asymmetric Drift Region", position: [54, -46, 42], color: "#cd853f", description: "Mean rotation lag" },
    { name: "Tilt Angle Gradient", position: [-68, 58, 52], color: "#deb887", description: "Velocity ellipsoid orientation" },
    { name: "Jeans Instability Front", position: [46, -72, -44], color: "#ff4500", description: "Gravitational collapse threshold" },
    { name: "Toomre Stability Zone", position: [-52, 44, 68], color: "#32cd32", description: "Disk fragmentation boundary" },
    { name: "Swing Amplification Region", position: [74, -58, 36], color: "#ff69b4", description: "Leading-trailing arm enhancement" },
    { name: "Winding Problem Site", position: [-36, 76, -46], color: "#4169e1", description: "Spiral arm persistence puzzle" },
    { name: "Density Wave Crest", position: [58, -34, -72], color: "#9932cc", description: "Spiral pattern propagation" },
    { name: "Kinematic Wave Front", position: [-72, 52, 56], color: "#00ff7f", description: "Streaming motion signatures" },
    { name: "Stellar Stream Terminus", position: [42, -68, 64], color: "#afeeee", description: "Tidal debris endpoint" },
    { name: "Wrap Counting Point", position: [-56, 46, -64], color: "#b8860b", description: "Stream orbit revolution" },
    { name: "Caustic Surface", position: [66, -44, 48], color: "#ff8c00", description: "Stream density enhancement" },
    { name: "Fan Structure", position: [-48, 74, 42], color: "#98fb98", description: "Tidal debris morphology" },
    { name: "Cocoon Region", position: [38, -76, -52], color: "#dda0dd", description: "Stream surrounding material" },
    { name: "Sausage Remnant", position: [-74, 56, 58], color: "#dc143c", description: "Ancient merger debris" },
    { name: "Splash Population", position: [52, -42, 76], color: "#40e0d0", description: "Radial merger heating" },
    { name: "Giant Molecular Cloud Core", position: [-62, 48, -44], color: "#2f4f4f", description: "Star formation reservoir" },
    { name: "Infrared Dark Cloud (II)", position: [54, -56, 68], color: "#1a1a2e", description: "Cold dense silhouette" },
    { name: "Hot Molecular Core (II)", position: [-44, 72, 52], color: "#ff6347", description: "Embedded protostar heating" },
    { name: "Outflow Cavity", position: [68, -42, -58], color: "#87ceeb", description: "Bipolar jet excavation" },
    { name: "Herbig-Haro Shock", position: [-76, 54, 38], color: "#00ff7f", description: "Protostellar jet interaction" },
    { name: "Maser Emission Site", position: [42, -74, 56], color: "#ff00ff", description: "Stimulated molecular radiation" },
    { name: "Water Maser Fountain", position: [-54, 46, -72], color: "#4169e1", description: "H2O amplification zone" },
    { name: "Methanol Maser Source", position: [76, -58, 42], color: "#9932cc", description: "CH3OH emission signature" },
    { name: "Silicon Monoxide Jet", position: [-38, 68, 64], color: "#ff8c00", description: "Shock-heated molecule tracer" },
    { name: "Formaldehyde Absorption", position: [58, -36, -66], color: "#696969", description: "H2CO density probe" },
    { name: "Ammonia Core", position: [-72, 52, 48], color: "#daa520", description: "NH3 temperature tracer" },
    { name: "Carbon Monoxide Outflow", position: [46, -68, 74], color: "#20b2aa", description: "CO velocity mapping" },
    { name: "Cyanogen Envelope", position: [-56, 74, -36], color: "#da70d6", description: "CN radical distribution" },
    { name: "Polycyclic Aromatic Hydrocarbon Band", position: [64, -44, 52], color: "#ffb347", description: "PAH emission features" },
    { name: "Diffuse Interstellar Band Source (II)", position: [-48, 56, 66], color: "#c71585", description: "Unidentified absorption carriers" },
    { name: "Extinction Curve Anomaly", position: [72, -62, -48], color: "#8b4513", description: "Dust grain variations" },
    { name: "Polarization Hole", position: [-66, 42, 58], color: "#778899", description: "Magnetic field disruption" },
    { name: "Dust Lane Crossing", position: [38, -76, 44], color: "#2f2f2f", description: "Obscuration path" },
    { name: "Reflection Nebula Edge", position: [-42, 68, -54], color: "#add8e6", description: "Scattered starlight boundary" },
    { name: "Photodissociation Region (II)", position: [56, -48, 72], color: "#ffd700", description: "UV-irradiated interface" },
    { name: "Carbon Ionization Front", position: [-74, 58, 36], color: "#32cd32", description: "C+ transition zone" },
    { name: "Molecular Hydrogen Fluorescence", position: [44, -72, -62], color: "#ff69b4", description: "UV-pumped H2 emission" },
    { name: "Warm Neutral Medium", position: [-58, 46, 76], color: "#f0e68c", description: "Intermediate ISM phase" },
    { name: "Cold Neutral Medium Filament", position: [66, -54, 48], color: "#4682b4", description: "HI 21cm structure" },
    { name: "Warm Ionized Medium Bubble", position: [-36, 74, -42], color: "#ff6b6b", description: "Diffuse HII region" },
    { name: "Silicate Grain Population", position: [52, -46, 64], color: "#d2b48c", description: "Oxygen-rich dust species" },
    { name: "Carbonaceous Grain Cloud", position: [-68, 58, -52], color: "#2f2f2f", description: "Carbon-rich dust particles" },
    { name: "Graphite Whisker Zone", position: [46, -72, 48], color: "#1a1a1a", description: "Elongated carbon structures" },
    { name: "Diamond Dust Region", position: [-54, 44, 76], color: "#e0e0e0", description: "Presolar nanodiamonds" },
    { name: "Silicon Carbide Condensation", position: [74, -56, -38], color: "#b8860b", description: "SiC circumstellar grains" },
    { name: "Ice Mantle Accumulation", position: [-42, 76, 54], color: "#e0ffff", description: "Frozen volatile coatings" },
    { name: "Grain Coagulation Front", position: [58, -38, 68], color: "#cd853f", description: "Dust aggregation boundary" },
    { name: "Sputtering Erosion Zone", position: [-76, 52, -44], color: "#a0522d", description: "Ion bombardment destruction" },
    { name: "Thermal Spike Region", position: [42, -68, 56], color: "#ff6347", description: "Cosmic ray grain heating" },
    { name: "Coulomb Explosion Site", position: [-56, 48, 72], color: "#ff4500", description: "Charged grain disruption" },
    { name: "Grain Surface Catalysis", position: [66, -54, -62], color: "#32cd32", description: "Molecular formation site" },
    { name: "H2 Formation Surface", position: [-48, 74, 38], color: "#98fb98", description: "Hydrogen molecule creation" },
    { name: "Cosmic Ray Ionization Zone", position: [54, -42, 74], color: "#9370db", description: "Particle-induced chemistry" },
    { name: "X-Ray Dominated Region", position: [-72, 56, -56], color: "#4169e1", description: "High-energy irradiation" },
    { name: "Dust Sublimation Front", position: [38, -76, 46], color: "#ffa500", description: "Thermal evaporation boundary" },
    { name: "Snow Line Location", position: [-58, 42, 66], color: "#87ceeb", description: "Volatile condensation radius" },
    { name: "Soot Line Marker", position: [72, -58, -42], color: "#2f4f4f", description: "Carbon condensation limit" },
    { name: "Silicate Crystallization Zone", position: [-44, 68, 52], color: "#deb887", description: "Annealed grain production" },
    { name: "Amorphous-Crystalline Transition", position: [56, -44, 58], color: "#d2691e", description: "Dust structure transformation" },
    { name: "Stardust Injection Point", position: [-66, 54, -48], color: "#ffd700", description: "Supernova dust delivery" },
    { name: "AGB Dust Factory", position: [48, -72, 64], color: "#ff8c00", description: "Red giant mass loss" },
    { name: "Wolf-Rayet Dust Shell", position: [-52, 46, 78], color: "#c71585", description: "Massive star carbon dust" },
    { name: "Nova Dust Condensation", position: [64, -56, -54], color: "#da70d6", description: "Ejecta grain formation" },
    { name: "Presolar Grain Archive", position: [-74, 62, 44], color: "#f0e68c", description: "Ancient stellar material" },
    { name: "Isotopic Anomaly Carrier", position: [44, -48, 72], color: "#afeeee", description: "Non-solar composition grains" },
    { name: "Diffusive Shock Acceleration", position: [-58, 52, 66], color: "#ff4500", description: "First-order Fermi process" },
    { name: "Stochastic Acceleration Zone", position: [62, -44, -58], color: "#ffa500", description: "Second-order Fermi mechanism" },
    { name: "Magnetic Reconnection Site (II)", position: [-46, 74, 42], color: "#ff6347", description: "Field line rearrangement" },
    { name: "Current Sheet Dissipation", position: [54, -68, 56], color: "#dc143c", description: "Energy release region" },
    { name: "Particle Injection Threshold", position: [-72, 48, -52], color: "#b22222", description: "Thermal pool escape" },
    { name: "Cosmic Ray Knee (II)", position: [48, -56, 74], color: "#8b0000", description: "Spectral steepening feature" },
    { name: "Cosmic Ray Ankle (II)", position: [-54, 66, 38], color: "#ff1493", description: "Extragalactic transition" },
    { name: "GZK Cutoff Region", position: [76, -42, -46], color: "#9400d3", description: "Photopion production limit" },
    { name: "Hillas Criterion Boundary", position: [-38, 72, 58], color: "#4169e1", description: "Maximum energy constraint" },
    { name: "Pevatron Candidate", position: [66, -74, 44], color: "#00ced1", description: "PeV particle accelerator" },
    { name: "TeV Halo", position: [-64, 46, -68], color: "#9370db", description: "Extended gamma-ray emission" },
    { name: "Pulsar Wind Nebula Shock", position: [42, -58, 68], color: "#00ff7f", description: "Termination shock zone" },
    { name: "Inverse Compton Scattering", position: [-56, 58, 54], color: "#87ceeb", description: "Photon upscattering" },
    { name: "Synchrotron Self-Compton", position: [58, -46, -72], color: "#da70d6", description: "SSC emission region" },
    { name: "External Compton Zone", position: [-74, 52, 46], color: "#ff69b4", description: "Seed photon scattering" },
    { name: "Hadronic Cascade Site", position: [52, -72, 52], color: "#ff8c00", description: "Proton interaction showers" },
    { name: "Photomeson Production", position: [-42, 68, -54], color: "#ffd700", description: "Pion creation zone" },
    { name: "Bethe-Heitler Pair Production", position: [74, -54, 38], color: "#32cd32", description: "Electron-positron creation" },
    { name: "Neutrino Production Site", position: [-68, 44, 72], color: "#4682b4", description: "High-energy neutrino source" },
    { name: "Blazar Zone Model", position: [46, -66, -48], color: "#c71585", description: "Jet emission structure" },
    { name: "Radio Lobe Hotspot", position: [-52, 76, 56], color: "#20b2aa", description: "Jet termination shock" },
    { name: "X-Ray Cavity", position: [68, -38, 64], color: "#778899", description: "AGN feedback bubble" },
    { name: "Cockspur Feature", position: [-76, 56, -42], color: "#daa520", description: "Bent radio jet" },
    { name: "Wide-Angle Tail Source", position: [38, -74, 48], color: "#f0e68c", description: "Galaxy motion distortion" },
    { name: "Narrow-Angle Tail Jet", position: [-48, 62, 76], color: "#afeeee", description: "High-velocity radio structure" },
    { name: "Optical Transient Alert", position: [56, -52, 62], color: "#ffd700", description: "New source detection" },
    { name: "Fast Blue Optical Transient (II)", position: [-64, 48, -56], color: "#00bfff", description: "Rapid luminous event" },
    { name: "Luminous Red Nova (III)", position: [44, -76, 48], color: "#dc143c", description: "Stellar merger outburst" },
    { name: "Intermediate Luminosity Red Transient (II)", position: [-52, 66, 54], color: "#b22222", description: "ILRT enigma" },
    { name: "Gap Transient (II)", position: [72, -44, -64], color: "#ff6347", description: "Luminosity gap event" },
    { name: "Superluminous Supernova Site", position: [-46, 74, 42], color: "#ff00ff", description: "Extreme brightness explosion" },
    { name: "Pair Instability Supernova (II)", position: [58, -58, 76], color: "#9400d3", description: "Massive star annihilation" },
    { name: "Calcium-Rich Transient (II)", position: [-74, 52, -38], color: "#f0e68c", description: "Peculiar thermonuclear event" },
    { name: "Type Iax Supernova Remnant", position: [48, -68, 52], color: "#daa520", description: "Failed deflagration" },
    { name: "Ibn Supernova Shell", position: [-56, 46, 68], color: "#00ced1", description: "Helium-rich interaction" },
    { name: "Icn Supernova Ejecta", position: [66, -54, -48], color: "#20b2aa", description: "Carbon-rich stripped star" },
    { name: "Supernova Impostor (III)", position: [-38, 72, 56], color: "#ff69b4", description: "Non-terminal eruption" },
    { name: "Precursor Emission Site", position: [54, -42, 74], color: "#ffa500", description: "Pre-explosion activity" },
    { name: "Flash Spectroscopy Target", position: [-72, 58, -52], color: "#87ceeb", description: "Rapid follow-up observation" },
    { name: "Shock Breakout Detection", position: [42, -74, 46], color: "#ff4500", description: "First light emergence" },
    { name: "Early Excess Emission", position: [-58, 44, 72], color: "#da70d6", description: "Companion interaction signal" },
    { name: "Nickel Mass Constraint", position: [76, -56, -42], color: "#32cd32", description: "56Ni yield measurement" },
    { name: "Cobalt Decay Phase", position: [-44, 68, 48], color: "#4169e1", description: "56Co decline tracking" },
    { name: "Nebular Spectrum Epoch", position: [52, -48, 68], color: "#9370db", description: "Late-time transparency" },
    { name: "Dust Echo Detection", position: [-76, 54, -46], color: "#cd853f", description: "Scattered light delay" },
    { name: "Light Echo Ring", position: [46, -66, 56], color: "#add8e6", description: "Historical supernova reflection" },
    { name: "Infrared Echo", position: [-54, 76, 38], color: "#ff8c00", description: "Thermal dust emission" },
    { name: "Rebrightening Event", position: [68, -38, -74], color: "#c71585", description: "Secondary luminosity peak" },
    { name: "Plateau Phase Star", position: [-48, 62, 66], color: "#778899", description: "Hydrogen recombination" },
    { name: "Radioactive Tail", position: [62, -72, 44], color: "#98fb98", description: "Decay-powered late emission" },
    { name: "Cepheid Variable Field", position: [-66, 54, 58], color: "#ffd700", description: "Period-luminosity standard" },
    { name: "RR Lyrae Population", position: [52, -48, -72], color: "#87ceeb", description: "Old stellar distance tracer" },
    { name: "Mira Variable Zone", position: [-44, 72, 44], color: "#ff6347", description: "Long-period pulsator" },
    { name: "Tip of Red Giant Branch", position: [74, -56, 48], color: "#dc143c", description: "TRGB standard candle" },
    { name: "Horizontal Branch Clump", position: [-58, 46, -64], color: "#ffa500", description: "Core helium burning tracer" },
    { name: "Red Clump Standard", position: [46, -74, 56], color: "#ff8c00", description: "Galactic distance anchor" },
    { name: "Eclipsing Binary Distance", position: [-72, 58, 52], color: "#4169e1", description: "Geometric parallax extension" },
    { name: "Detached Eclipsing System", position: [58, -42, -58], color: "#9370db", description: "Direct radius measurement" },
    { name: "Surface Brightness Fluctuation", position: [-48, 68, 66], color: "#778899", description: "SBF distance method" },
    { name: "Globular Cluster Luminosity Function", position: [66, -66, 42], color: "#daa520", description: "GCLF peak distance" },
    { name: "Planetary Nebula Luminosity Function", position: [-54, 44, -74], color: "#00ced1", description: "PNLF standard candle" },
    { name: "Type Ia Supernova Hubble Diagram", position: [42, -58, 72], color: "#ff69b4", description: "Cosmological distance ladder" },
    { name: "Standardizable Candle", position: [-76, 52, 38], color: "#32cd32", description: "Corrected luminosity source" },
    { name: "Tully-Fisher Calibrator", position: [54, -72, -46], color: "#20b2aa", description: "Rotation-luminosity relation" },
    { name: "Faber-Jackson Elliptical", position: [-46, 74, 54], color: "#da70d6", description: "Velocity dispersion standard" },
    { name: "Fundamental Plane Galaxy", position: [72, -44, 64], color: "#cd853f", description: "Three-parameter distance" },
    { name: "Baryon Acoustic Oscillation Scale", position: [-62, 56, -52], color: "#4682b4", description: "BAO standard ruler" },
    { name: "Sound Horizon Marker", position: [48, -68, 48], color: "#98fb98", description: "Acoustic scale imprint" },
    { name: "CMB Distance Prior", position: [-56, 48, 76], color: "#f0e68c", description: "Last scattering geometry" },
    { name: "Hubble Tension Region", position: [68, -54, -62], color: "#ff4500", description: "H0 discrepancy zone" },
    { name: "Early Universe Calibrator", position: [-38, 76, 46], color: "#c71585", description: "Inverse distance ladder" },
    { name: "Megamaser Distance", position: [56, -46, 58], color: "#afeeee", description: "Geometric H2O measurement" },
    { name: "Time-Delay Cosmography", position: [-74, 62, -44], color: "#b8860b", description: "Lensed quasar distance" },
    { name: "Gravitational Wave Siren", position: [44, -76, 68], color: "#9400d3", description: "Standard siren distance" },
    { name: "Dark Energy Equation of State", position: [-52, 54, 72], color: "#00ff7f", description: "w parameter constraint" },
    { name: "Protogalactic Cloud", position: [62, -52, -66], color: "#4682b4", description: "Pre-galactic gas assembly" },
    { name: "First Galaxy Candidate", position: [-68, 46, 58], color: "#ffd700", description: "High-z proto-galaxy" },
    { name: "Lyman Break Galaxy", position: [48, -74, 44], color: "#00bfff", description: "UV dropout selection" },
    { name: "Lyman Alpha Emitter", position: [-54, 72, -48], color: "#87ceeb", description: "LAE population" },
    { name: "Submillimeter Galaxy (II)", position: [76, -44, 56], color: "#ff8c00", description: "Dusty starburst" },
    { name: "Ultra-Luminous Infrared Galaxy", position: [-42, 58, 72], color: "#dc143c", description: "ULIRG merger stage" },
    { name: "Luminous Infrared Galaxy (II)", position: [54, -68, -52], color: "#ff6347", description: "LIRG interaction" },
    { name: "Green Pea Galaxy", position: [-76, 52, 46], color: "#32cd32", description: "Compact starburst analog" },
    { name: "Blueberry Galaxy", position: [46, -56, 68], color: "#4169e1", description: "Extreme emission dwarf" },
    { name: "Tadpole Galaxy", position: [-58, 74, -38], color: "#9370db", description: "Tidal disruption morphology" },
    { name: "Antennae Interaction Zone", position: [68, -42, 54], color: "#ff69b4", description: "Major merger complex" },
    { name: "Ring Galaxy Formation", position: [-46, 48, 76], color: "#00ced1", description: "Collisional ring structure" },
    { name: "Polar Ring Host", position: [52, -76, -44], color: "#da70d6", description: "Perpendicular orbit capture" },
    { name: "Shell Galaxy System", position: [-72, 56, 52], color: "#f0e68c", description: "Radial merger debris" },
    { name: "Tidal Dwarf Galaxy", position: [44, -48, 72], color: "#98fb98", description: "Interaction-born dwarf" },
    { name: "Ultra-Diffuse Galaxy (II)", position: [-56, 66, -56], color: "#778899", description: "Low surface brightness giant" },
    { name: "Dark Galaxy Candidate (II)", position: [74, -58, 42], color: "#2f4f4f", description: "Starless dark matter halo" },
    { name: "Backsplash Galaxy (II)", position: [-44, 54, 64], color: "#cd853f", description: "Former cluster member" },
    { name: "Jellyfish Galaxy Tail", position: [58, -72, -48], color: "#40e0d0", description: "Ram pressure stripping" },
    { name: "Strangulation Zone", position: [-66, 48, 58], color: "#b8860b", description: "Gas supply cutoff" },
    { name: "Preprocessing Region", position: [42, -46, 76], color: "#daa520", description: "Group environment effects" },
    { name: "Red Nugget Relic", position: [-52, 76, -42], color: "#8b0000", description: "Compact massive galaxy" },
    { name: "Inside-Out Growth", position: [76, -54, 48], color: "#ffa500", description: "Size evolution signature" },
    { name: "Downsizing Evidence", position: [-38, 62, 68], color: "#c71585", description: "Mass-dependent evolution" },
    { name: "Archaeological Downturn", position: [66, -68, -54], color: "#afeeee", description: "Star formation decline" },
    { name: "Quasar Host Galaxy (II)", position: [-64, 58, 54], color: "#9400d3", description: "AGN environment" },
    { name: "Broad Line Region", position: [52, -46, -72], color: "#ff00ff", description: "High-velocity clouds" },
    { name: "Narrow Line Region", position: [-48, 74, 46], color: "#00ff7f", description: "Extended ionization cone" },
    { name: "Obscuring Torus", position: [74, -58, 58], color: "#8b4513", description: "Dusty equatorial structure" },
    { name: "Accretion Disk Corona", position: [-56, 44, -66], color: "#ffd700", description: "X-ray emitting plasma" },
    { name: "UV Bump Region", position: [46, -72, 44], color: "#87ceeb", description: "Big blue bump" },
    { name: "Soft X-Ray Excess", position: [-72, 56, 62], color: "#00ced1", description: "Warm Comptonization" },
    { name: "Iron K-alpha Line", position: [58, -44, -58], color: "#ff6347", description: "Fluorescent emission" },
    { name: "Relativistic Reflection", position: [-44, 68, 52], color: "#dc143c", description: "Disk reflection spectrum" },
    { name: "Reverberation Mapping Zone", position: [68, -66, 48], color: "#4169e1", description: "BLR size measurement" },
    { name: "Quasar Wind Outflow", position: [-58, 52, -54], color: "#ff8c00", description: "UV absorption troughs" },
    { name: "Ultra-Fast Outflow", position: [44, -54, 76], color: "#b22222", description: "Relativistic AGN wind" },
    { name: "Warm Absorber Zone", position: [-76, 48, 56], color: "#20b2aa", description: "Ionized gas absorption" },
    { name: "Changing-Look AGN", position: [56, -76, -44], color: "#9370db", description: "Type transition event" },
    { name: "Tidal Disruption Flare (III)", position: [-46, 72, 64], color: "#ff69b4", description: "Stellar disruption glow" },
    { name: "Quasi-Periodic Eruption", position: [72, -48, 52], color: "#da70d6", description: "Repeated X-ray bursts" },
    { name: "LINER Nucleus", position: [-54, 56, -48], color: "#778899", description: "Low-ionization emission" },
    { name: "Low-Luminosity AGN", position: [48, -68, 68], color: "#cd853f", description: "Sub-Eddington accretor" },
    { name: "Radiatively Inefficient Flow", position: [-68, 44, 74], color: "#daa520", description: "RIAF accretion mode" },
    { name: "Advection Dominated Disk", position: [62, -52, -66], color: "#f0e68c", description: "ADAF hot flow" },
    { name: "Magnetically Arrested Disk", position: [-42, 76, 42], color: "#c71585", description: "MAD accretion state" },
    { name: "Blandford-Znajek Engine", position: [76, -56, 54], color: "#4682b4", description: "Black hole spin extraction" },
    { name: "Jet Launching Zone", position: [-56, 48, -72], color: "#ff4500", description: "Magnetized outflow base" },
    { name: "Blazar Sequence Position", position: [54, -74, 46], color: "#32cd32", description: "Synchrotron peak trend" },
    { name: "Unified Model Test", position: [-74, 62, 58], color: "#98fb98", description: "AGN orientation probe" },
    { name: "White Dwarf Cooling Track", position: [48, -56, 72], color: "#f0f0f0", description: "Degenerate star evolution" },
    { name: "Crystallizing White Dwarf", position: [-66, 52, -48], color: "#e0e0e0", description: "Core solidification" },
    { name: "Magnetic White Dwarf", position: [72, -44, 54], color: "#9370db", description: "Strong field remnant" },
    { name: "DA White Dwarf", position: [-52, 74, 46], color: "#ffffff", description: "Hydrogen atmosphere" },
    { name: "DB White Dwarf", position: [56, -68, -58], color: "#add8e6", description: "Helium atmosphere" },
    { name: "DQ White Dwarf", position: [-74, 48, 62], color: "#2f2f2f", description: "Carbon atmosphere" },
    { name: "Polluted White Dwarf", position: [44, -54, 76], color: "#cd853f", description: "Metal-contaminated surface" },
    { name: "White Dwarf Debris Disk", position: [-48, 66, -54], color: "#deb887", description: "Disrupted planetesimal" },
    { name: "Neutron Star Crust", position: [68, -76, 48], color: "#4682b4", description: "Nuclear pasta layer" },
    { name: "Neutron Star Core", position: [-56, 44, 68], color: "#2f4f4f", description: "Exotic matter interior" },
    { name: "Quark Matter Phase", position: [52, -48, -72], color: "#9400d3", description: "Deconfined quarks" },
    { name: "Strange Quark Star", position: [-44, 72, 52], color: "#ff00ff", description: "Strange matter object" },
    { name: "Neutron Star Mountain", position: [76, -58, 44], color: "#8b4513", description: "Crustal deformation" },
    { name: "Glitch Recovery Phase", position: [-68, 56, -46], color: "#ffd700", description: "Rotational jump aftermath" },
    { name: "Pulsar Braking Index", position: [46, -72, 66], color: "#ff8c00", description: "Spindown evolution" },
    { name: "Pulsar Death Line", position: [-54, 48, 74], color: "#b22222", description: "Radio emission cutoff" },
    { name: "Recycled Millisecond Pulsar", position: [62, -46, -64], color: "#00ced1", description: "Spun-up old pulsar" },
    { name: "Spider Pulsar System", position: [-76, 62, 54], color: "#dc143c", description: "Ablating companion" },
    { name: "Black Widow Binary", position: [54, -74, 52], color: "#1a1a1a", description: "Evaporating partner" },
    { name: "Redback System", position: [-46, 54, -68], color: "#ff6347", description: "Non-degenerate companion" },
    { name: "Transitional Millisecond Pulsar", position: [74, -52, 58], color: "#da70d6", description: "State-switching system" },
    { name: "Isolated Neutron Star", position: [-58, 76, 44], color: "#778899", description: "Thermally cooling remnant" },
    { name: "Central Compact Object", position: [48, -66, -52], color: "#87ceeb", description: "SNR point source" },
    { name: "Rotating Radio Transient", position: [-72, 46, 66], color: "#32cd32", description: "Sporadic pulsar" },
    { name: "X-Ray Dim Isolated NS", position: [66, -54, 72], color: "#4169e1", description: "XDINS cooling source" },
    { name: "Event Horizon Boundary", position: [-62, 58, -56], color: "#000000", description: "Point of no return" },
    { name: "Ergosphere Region", position: [54, -48, 74], color: "#4b0082", description: "Frame dragging zone" },
    { name: "Innermost Stable Orbit", position: [-48, 72, 48], color: "#ff4500", description: "ISCO accretion edge" },
    { name: "Photon Sphere (II)", position: [72, -56, -62], color: "#ffd700", description: "Unstable light orbit" },
    { name: "Black Hole Shadow", position: [-56, 46, 66], color: "#1a1a1a", description: "Silhouette against emission" },
    { name: "Relativistic Jet Base", position: [46, -74, 54], color: "#ff6347", description: "Jet launching point" },
    { name: "Hawking Radiation Zone", position: [-74, 54, -44], color: "#87ceeb", description: "Quantum evaporation" },
    { name: "Penrose Process Site", position: [58, -44, 72], color: "#9370db", description: "Energy extraction" },
    { name: "Blandford-Payne Wind", position: [-44, 68, 58], color: "#00ced1", description: "Disk-driven outflow" },
    { name: "Quasi-Periodic Oscillation (II)", position: [68, -66, -48], color: "#da70d6", description: "QPO timing signal" },
    { name: "High-Frequency QPO", position: [-68, 52, 52], color: "#ff69b4", description: "Relativistic orbit probe" },
    { name: "Type-C QPO Source", position: [52, -52, 68], color: "#32cd32", description: "Low-frequency variability" },
    { name: "State Transition Zone", position: [-52, 76, -52], color: "#ffa500", description: "Accretion mode change" },
    { name: "Hard State Spectrum", position: [76, -48, 46], color: "#dc143c", description: "Power-law dominated" },
    { name: "Soft State Disk", position: [-46, 58, 74], color: "#4169e1", description: "Thermal component" },
    { name: "Intermediate State", position: [44, -72, -58], color: "#9400d3", description: "Transitional accretion" },
    { name: "Corona Ejection Event", position: [-72, 48, 62], color: "#ff8c00", description: "Discrete jet launch" },
    { name: "Disk Wind Launch", position: [62, -58, 56], color: "#20b2aa", description: "Thermal-magnetic outflow" },
    { name: "Iron Line Profile", position: [-58, 74, -46], color: "#cd853f", description: "Relativistic broadening" },
    { name: "Spin Measurement Site", position: [48, -46, 76], color: "#b8860b", description: "Kerr parameter probe" },
    { name: "Mass Function Binary", position: [-76, 56, 48], color: "#778899", description: "Dynamical mass limit" },
    { name: "Stellar Mass Black Hole", position: [56, -76, -44], color: "#2f4f4f", description: "Collapsed massive star" },
    { name: "Intermediate Mass BH Candidate", position: [-44, 62, 68], color: "#8b0000", description: "IMBH search target" },
    { name: "Supermassive BH Sphere", position: [74, -54, 52], color: "#000080", description: "Galactic center monster" },
    { name: "Ultramassive Black Hole", position: [-66, 48, -66], color: "#0d0d0d", description: "Billion solar mass giant" },
    { name: "Binary Black Hole Inspiral", position: [52, -62, -68], color: "#9400d3", description: "Chirping GW source" },
    { name: "Binary Neutron Star Merger (II)", position: [-58, 54, 72], color: "#ff6347", description: "Kilonova progenitor" },
    { name: "NS-BH Merger Site", position: [68, -48, 56], color: "#dc143c", description: "Mixed compact binary" },
    { name: "Ringdown Phase", position: [-46, 76, -48], color: "#ffd700", description: "Final black hole ringing" },
    { name: "Quasi-Normal Mode (II)", position: [74, -56, 48], color: "#4169e1", description: "BH vibration frequency" },
    { name: "GW Memory Signal", position: [-72, 48, 64], color: "#9370db", description: "Permanent spacetime offset" },
    { name: "Continuous GW Source", position: [46, -74, -54], color: "#00ced1", description: "Spinning NS emission" },
    { name: "Stochastic GW Background", position: [-54, 62, 58], color: "#778899", description: "Cosmic GW noise" },
    { name: "Pulsar Timing Array Signal", position: [62, -44, 72], color: "#32cd32", description: "Nanohertz waves" },
    { name: "SMBH Binary GW Source", position: [-68, 56, -56], color: "#8b0000", description: "Supermassive merger" },
    { name: "Extreme Mass Ratio Inspiral", position: [54, -68, 46], color: "#ff8c00", description: "EMRI orbit mapping" },
    { name: "Eccentric Binary GW", position: [-44, 72, 52], color: "#da70d6", description: "Non-circular inspiral" },
    { name: "Precessing Binary Spin", position: [76, -52, -62], color: "#ff69b4", description: "Spin-orbit coupling" },
    { name: "Kilonova Ejecta", position: [-62, 46, 68], color: "#ffa500", description: "Neutron-rich outflow" },
    { name: "R-Process Nucleosynthesis Site", position: [48, -76, 54], color: "#b8860b", description: "Heavy element forge" },
    { name: "Lanthanide Curtain (II)", position: [-56, 68, -44], color: "#cd853f", description: "Red kilonova opacity" },
    { name: "Blue Kilonova Component", position: [66, -46, 76], color: "#87ceeb", description: "Polar ejecta glow" },
    { name: "Cocoon Shock Breakout", position: [-74, 54, 56], color: "#ff4500", description: "Jet-ejecta interaction" },
    { name: "Short GRB Afterglow", position: [52, -58, -74], color: "#20b2aa", description: "Merger jet emission" },
    { name: "Off-Axis Jet View (II)", position: [-48, 76, 48], color: "#c71585", description: "Structured jet profile" },
    { name: "GW Electromagnetic Counterpart", position: [72, -64, 52], color: "#f0e68c", description: "Multi-messenger event" },
    { name: "Hubble Constant from GW", position: [-66, 48, -68], color: "#4682b4", description: "Standard siren cosmology" },
    { name: "Neutron Star EOS Constraint", position: [44, -52, 68], color: "#98fb98", description: "Tidal deformability" },
    { name: "Mass Gap Object (II)", position: [-52, 74, 54], color: "#2f4f4f", description: "3-5 solar mass mystery" },
    { name: "Hierarchical Merger Product", position: [58, -72, -48], color: "#daa520", description: "Second-generation BH" },
    { name: "Inflation Epoch Relic", position: [-64, 58, 62], color: "#ffd700", description: "Exponential expansion trace" },
    { name: "Reheating Phase", position: [56, -46, -72], color: "#ff6347", description: "Post-inflation thermalization" },
    { name: "Baryogenesis Site", position: [-48, 74, 46], color: "#9370db", description: "Matter-antimatter asymmetry" },
    { name: "Electroweak Phase Transition (II)", position: [72, -58, 54], color: "#4169e1", description: "Symmetry breaking epoch" },
    { name: "QCD Phase Transition (II)", position: [-56, 44, -66], color: "#dc143c", description: "Quark confinement" },
    { name: "Big Bang Nucleosynthesis", position: [46, -72, 48], color: "#32cd32", description: "Primordial element forge" },
    { name: "Deuterium Abundance Probe", position: [-74, 56, 58], color: "#87ceeb", description: "Baryon density tracer" },
    { name: "Helium-4 Primordial (II)", position: [58, -44, 74], color: "#f0e68c", description: "BBN yield measurement" },
    { name: "Lithium Problem Zone", position: [-44, 68, -52], color: "#ff8c00", description: "Cosmological lithium puzzle" },
    { name: "Recombination Surface (II)", position: [68, -66, 52], color: "#ffb347", description: "Photon decoupling" },
    { name: "Last Scattering Sphere", position: [-58, 52, 68], color: "#00ced1", description: "CMB origin surface" },
    { name: "CMB Temperature Anisotropy", position: [52, -52, -68], color: "#da70d6", description: "Primordial fluctuations" },
    { name: "CMB Polarization Pattern", position: [-72, 48, 54], color: "#9400d3", description: "E-mode/B-mode signals" },
    { name: "Sachs-Wolfe Plateau (II)", position: [44, -76, 46], color: "#778899", description: "Large-scale ISW effect" },
    { name: "Silk Damping Tail", position: [-46, 72, -58], color: "#cd853f", description: "Photon diffusion scale" },
    { name: "Acoustic Peak Structure", position: [76, -54, 58], color: "#20b2aa", description: "BAO imprint" },
    { name: "Sunyaev-Zeldovich Decrement (II)", position: [-68, 56, 64], color: "#4682b4", description: "Cluster CMB distortion" },
    { name: "Kinetic SZ Signal (II)", position: [54, -48, -74], color: "#b8860b", description: "Bulk motion signature" },
    { name: "CMB Lensing Convergence (II)", position: [-52, 76, 48], color: "#98fb98", description: "Mass-induced deflection" },
    { name: "Primordial Non-Gaussianity (II)", position: [72, -62, 46], color: "#ff69b4", description: "Inflation model test" },
    { name: "Cosmic Variance Limit", position: [-66, 46, -62], color: "#daa520", description: "Fundamental uncertainty" },
    { name: "Dark Ages Epoch", position: [48, -74, 68], color: "#1a1a1a", description: "Pre-reionization void" },
    { name: "Cosmic Dawn Signal", position: [-74, 58, 52], color: "#ffa500", description: "First light emergence" },
    { name: "Epoch of Reionization Bubble", position: [62, -56, -56], color: "#00ff7f", description: "Ionizing radiation front" },
    { name: "21cm Cosmology Target", position: [-58, 64, 72], color: "#c71585", description: "Neutral hydrogen probe" },
    { name: "Hot Jupiter Atmosphere", position: [54, -58, 66], color: "#ff8c00", description: "Inflated gas giant" },
    { name: "Warm Neptune Zone", position: [-66, 52, -54], color: "#4169e1", description: "Sub-Saturn atmosphere" },
    { name: "Super-Earth Surface", position: [48, -74, 52], color: "#32cd32", description: "Rocky world candidate" },
    { name: "Sub-Neptune Envelope", position: [-52, 68, 58], color: "#87ceeb", description: "Volatile-rich layer" },
    { name: "Mini-Neptune Transition", position: [72, -46, -68], color: "#00ced1", description: "Radius gap object" },
    { name: "Lava World Surface", position: [-44, 76, 44], color: "#ff4500", description: "Magma ocean planet" },
    { name: "Water World Ocean", position: [58, -68, 56], color: "#1e90ff", description: "Deep hydrosphere" },
    { name: "Hycean World (II)", position: [-76, 48, -62], color: "#20b2aa", description: "Hydrogen-rich ocean planet" },
    { name: "Transmission Spectrum (II)", position: [46, -52, 74], color: "#da70d6", description: "Transit atmosphere probe" },
    { name: "Emission Spectrum Night", position: [-58, 72, 48], color: "#ffd700", description: "Thermal emission detection" },
    { name: "Phase Curve Mapping", position: [68, -56, -52], color: "#f0e68c", description: "Day-night variation" },
    { name: "Terminator Region (II)", position: [-48, 56, 72], color: "#778899", description: "Day-night boundary" },
    { name: "Cloud Deck Layer", position: [56, -76, 46], color: "#c0c0c0", description: "Aerosol opacity" },
    { name: "Photochemical Haze", position: [-72, 54, -48], color: "#d2b48c", description: "UV-produced particles" },
    { name: "Thermal Inversion Layer (II)", position: [44, -48, 68], color: "#ff6347", description: "Stratospheric heating" },
    { name: "Atmospheric Escape Flow", position: [-54, 74, 54], color: "#9370db", description: "Hydrodynamic outflow" },
    { name: "Roche Lobe Overflow (II)", position: [76, -62, -44], color: "#dc143c", description: "Mass loss stream" },
    { name: "Habitable Zone Planet (II)", position: [-46, 48, 76], color: "#98fb98", description: "Temperate orbit" },
    { name: "Optimistic HZ Edge", position: [62, -72, 52], color: "#00ff7f", description: "Extended habitable limit" },
    { name: "Conservative HZ Center", position: [-68, 56, -56], color: "#228b22", description: "Earth-like insolation" },
    { name: "Tidal Locking Zone", position: [52, -44, -74], color: "#cd853f", description: "Synchronous rotation" },
    { name: "Eyeball Planet Model", position: [-56, 76, 48], color: "#daa520", description: "Substellar habitability" },
    { name: "Terminator Habitability", position: [74, -58, 58], color: "#b8860b", description: "Day-night boundary life" },
    { name: "Biosignature Candidate (II)", position: [-42, 62, -68], color: "#7cfc00", description: "Potential life marker" },
    { name: "Oxygen False Positive (II)", position: [48, -76, 64], color: "#afeeee", description: "Abiotic O2 source" },
    { name: "Mercury Magnetosphere", position: [-64, 54, 62], color: "#b0b0b0", description: "Compact magnetic bubble" },
    { name: "Venus Cloud Deck", position: [56, -48, -72], color: "#f5deb3", description: "Sulfuric acid layers" },
    { name: "Venus Phosphine Debate", position: [-48, 72, 48], color: "#ffd700", description: "Controversial biosignature" },
    { name: "Mars Polar Cap", position: [72, -56, 54], color: "#ffffff", description: "CO2 and water ice" },
    { name: "Mars Recurring Slope Lineae", position: [-56, 46, -66], color: "#cd853f", description: "Seasonal dark streaks" },
    { name: "Mars Methane Plume", position: [46, -74, 52], color: "#98fb98", description: "Transient CH4 detection" },
    { name: "Asteroid Belt Crossing", position: [-74, 58, 56], color: "#a0522d", description: "Main belt transit" },
    { name: "Ceres Bright Spots", position: [58, -44, 74], color: "#e0e0e0", description: "Occator crater salts" },
    { name: "Jupiter Great Red Spot", position: [-44, 68, -54], color: "#ff6347", description: "Anticyclonic vortex" },
    { name: "Jupiter Radiation Belts", position: [68, -66, 48], color: "#9400d3", description: "Intense particle environment" },
    { name: "Io Volcanic Plume", position: [-58, 52, 68], color: "#ff4500", description: "Tidal heating eruption" },
    { name: "Europa Ice Shell", position: [52, -52, -68], color: "#87ceeb", description: "Subsurface ocean layer" },
    { name: "Europa Plume Zone", position: [-72, 48, 54], color: "#add8e6", description: "Water vapor jets" },
    { name: "Ganymede Magnetosphere", position: [44, -76, 46], color: "#4682b4", description: "Moon with magnetic field" },
    { name: "Callisto Cratered Surface", position: [-46, 74, -56], color: "#696969", description: "Ancient bombardment record" },
    { name: "Saturn Ring System", position: [76, -54, 58], color: "#f0e68c", description: "Icy particle disk" },
    { name: "Saturn Hexagon Storm", position: [-68, 56, 64], color: "#daa520", description: "Polar vortex pattern" },
    { name: "Enceladus Tiger Stripes", position: [54, -48, -74], color: "#00ced1", description: "Cryovolcanic fissures" },
    { name: "Enceladus Hydrothermal", position: [-52, 76, 48], color: "#20b2aa", description: "Ocean floor vents" },
    { name: "Titan Methane Lakes (II)", position: [72, -62, 46], color: "#ff8c00", description: "Hydrocarbon seas" },
    { name: "Titan Atmospheric Haze", position: [-66, 46, -62], color: "#d2691e", description: "Organic photochemistry" },
    { name: "Uranus Tilted Axis", position: [48, -74, 68], color: "#afeeee", description: "Extreme obliquity" },
    { name: "Neptune Great Dark Spot", position: [-74, 58, 52], color: "#4169e1", description: "Transient storm system" },
    { name: "Triton Retrograde Orbit", position: [62, -56, -56], color: "#778899", description: "Captured KBO moon" },
    { name: "Kuiper Belt Edge", position: [-58, 64, 72], color: "#2f4f4f", description: "Outer solar system frontier" },
    { name: "Trans-Neptunian Object", position: [54, -62, 66], color: "#8b4513", description: "Distant icy body" },
    { name: "Plutino Resonance", position: [-66, 52, -52], color: "#cd853f", description: "3:2 Neptune orbit" },
    { name: "Classical KBO", position: [48, -74, 54], color: "#a0522d", description: "Cold population member" },
    { name: "Scattered Disk Object (II)", position: [-52, 68, 58], color: "#696969", description: "Highly eccentric orbit" },
    { name: "Detached Object (II)", position: [72, -46, -68], color: "#2f4f4f", description: "Isolated outer body" },
    { name: "Sednoid Population", position: [-44, 76, 44], color: "#b22222", description: "Extreme trans-Neptunian" },
    { name: "Oort Cloud Inner Edge", position: [58, -68, 56], color: "#1a1a2e", description: "Distant reservoir" },
    { name: "Long-Period Comet", position: [-76, 48, -62], color: "#00bfff", description: "Oort cloud visitor" },
    { name: "Short-Period Comet", position: [46, -52, 74], color: "#87ceeb", description: "Jupiter family member" },
    { name: "Comet Nucleus Surface", position: [-58, 72, 48], color: "#3d3d3d", description: "Dusty ice body" },
    { name: "Comet Coma Expansion", position: [68, -56, -52], color: "#add8e6", description: "Sublimation atmosphere" },
    { name: "Comet Ion Tail", position: [-48, 56, 72], color: "#4169e1", description: "Solar wind interaction" },
    { name: "Comet Dust Tail", position: [56, -76, 46], color: "#f5deb3", description: "Radiation pressure curve" },
    { name: "Meteor Stream Crossing", position: [-72, 54, -48], color: "#ffd700", description: "Debris trail intersection" },
    { name: "Fireball Event", position: [44, -48, 68], color: "#ff6347", description: "Bright meteor entry" },
    { name: "Meteorite Fall Site", position: [-54, 74, 54], color: "#8b0000", description: "Recovered space rock" },
    { name: "Near-Earth Asteroid", position: [76, -62, -44], color: "#ff8c00", description: "Earth-crossing orbit" },
    { name: "Potentially Hazardous Object", position: [-46, 48, 76], color: "#dc143c", description: "PHO close approach" },
    { name: "Asteroid Deflection Target", position: [62, -72, 52], color: "#9370db", description: "DART mission type" },
    { name: "Gravity Tractor Zone", position: [-68, 56, -56], color: "#778899", description: "Slow deflection method" },
    { name: "Kinetic Impactor Result", position: [52, -44, -74], color: "#da70d6", description: "Momentum transfer" },
    { name: "Binary Asteroid System", position: [-56, 76, 48], color: "#20b2aa", description: "Moonlet companion" },
    { name: "Rubble Pile Asteroid", position: [74, -58, 58], color: "#a0522d", description: "Gravitational aggregate" },
    { name: "Asteroid Family Member", position: [-42, 62, -68], color: "#daa520", description: "Collisional fragment" },
    { name: "Interstellar Object Track", position: [48, -76, 64], color: "#c71585", description: "Extrasolar visitor path" },
    { name: "Space Telescope Orbit", position: [-62, 58, 62], color: "#ffd700", description: "Observatory platform" },
    { name: "L2 Lagrange Point Station", position: [56, -46, -72], color: "#4169e1", description: "Stable observation point" },
    { name: "Infrared Survey Field", position: [-48, 74, 46], color: "#ff8c00", description: "Thermal wavelength scan" },
    { name: "X-Ray Observatory Target", position: [72, -58, 54], color: "#9400d3", description: "High-energy imaging" },
    { name: "Gamma-Ray Burst Localization", position: [-56, 44, -66], color: "#dc143c", description: "GRB position fix" },
    { name: "Radio Interferometry Baseline", position: [46, -72, 48], color: "#00ced1", description: "VLBI resolution" },
    { name: "Optical Interferometer", position: [-74, 56, 58], color: "#da70d6", description: "Baseline combination" },
    { name: "Adaptive Optics Correction (II)", position: [58, -44, 74], color: "#32cd32", description: "Wavefront sensing" },
    { name: "Laser Guide Star (II)", position: [-44, 68, -54], color: "#00ff7f", description: "Artificial reference" },
    { name: "Coronagraph Mask (II)", position: [68, -66, 52], color: "#778899", description: "Starlight suppression" },
    { name: "Starshade Position", position: [-58, 52, 68], color: "#2f4f4f", description: "External occulter" },
    { name: "Transit Photometry Field", position: [52, -52, -68], color: "#87ceeb", description: "Exoplanet detection zone" },
    { name: "Radial Velocity Survey", position: [-72, 48, 54], color: "#9370db", description: "Doppler wobble search" },
    { name: "Astrometric Survey Region", position: [44, -76, 46], color: "#f0e68c", description: "Position measurement field" },
    { name: "Microlensing Survey Zone", position: [-46, 74, -56], color: "#cd853f", description: "Gravitational detection" },
    { name: "Direct Imaging Target", position: [76, -54, 58], color: "#ff69b4", description: "Resolved exoplanet" },
    { name: "Spectroscopic Binary", position: [-68, 56, 64], color: "#20b2aa", description: "Doppler shift orbit" },
    { name: "Eclipsing Binary Light Curve", position: [54, -48, -74], color: "#b8860b", description: "Mutual eclipse timing" },
    { name: "Asteroseismology Target", position: [-52, 76, 48], color: "#ffa500", description: "Stellar oscillations" },
    { name: "Gyrochronology Calibrator", position: [72, -62, 46], color: "#98fb98", description: "Rotation-age relation" },
    { name: "Photometric Variability", position: [-66, 46, -62], color: "#daa520", description: "Brightness changes" },
    { name: "Polarimetry Observation", position: [48, -74, 68], color: "#c71585", description: "Light polarization" },
    { name: "High-Resolution Spectrum", position: [-74, 58, 52], color: "#4682b4", description: "Detailed line analysis" },
    { name: "Time-Series Photometry", position: [62, -56, -56], color: "#afeeee", description: "Temporal monitoring" },
    { name: "Multi-Epoch Astrometry", position: [-58, 64, 72], color: "#ff6347", description: "Proper motion measurement" },
    { name: "Dark Matter Halo (III)", position: [75, -42, 88], color: "#2f2f4f", description: "Invisible mass structure" },
    { name: "Dark Energy Field", position: [-82, 55, -65], color: "#191970", description: "Cosmic acceleration driver" },
    { name: "Modified Gravity Theory", position: [55, -68, 42], color: "#4b0082", description: "Alternative to dark matter" },
    { name: "MOND Dynamics", position: [-48, 72, 78], color: "#800080", description: "Modified Newtonian dynamics" },
    { name: "Chameleon Field", position: [68, -35, -72], color: "#9932cc", description: "Screened scalar field" },
    { name: "Axion Detection", position: [-72, 48, 58], color: "#dda0dd", description: "Light dark matter search" },
    { name: "WIMP Annihilation", position: [42, -78, 65], color: "#ba55d3", description: "Massive particle signal" },
    { name: "Primordial Black Hole (V)", position: [-65, 58, -48], color: "#1c1c1c", description: "Early universe remnant" },
    { name: "Fuzzy Dark Matter", position: [78, -45, 52], color: "#6a5acd", description: "Ultralight bosonic field" },
    { name: "Self-Interacting DM", position: [-55, 65, 82], color: "#483d8b", description: "Collisional dark matter" },
    { name: "Warm Dark Matter", position: [62, -72, -58], color: "#7b68ee", description: "Intermediate mass particles" },
    { name: "Sterile Neutrino", position: [-78, 42, 68], color: "#9370db", description: "Non-interacting neutrino" },
    { name: "Dark Photon", position: [48, -58, 75], color: "#8b008b", description: "Hidden sector particle" },
    { name: "Quintessence Model", position: [-68, 75, -42], color: "#9400d3", description: "Dynamic dark energy" },
    { name: "Phantom Energy (II)", position: [72, -48, 62], color: "#4a0080", description: "Super-negative pressure" },
    { name: "f(R) Gravity", position: [-52, 62, 88], color: "#663399", description: "Extended gravity theory" },
    { name: "Tensor-Scalar Theory", position: [65, -75, -45], color: "#5d3fd3", description: "Brans-Dicke gravity" },
    { name: "Massive Gravity", position: [-75, 55, 52], color: "#7851a9", description: "Graviton mass theory" },
    { name: "Lorentz Violation", position: [55, -62, 78], color: "#6c3461", description: "Symmetry breaking test" },
    { name: "CPT Invariance Test", position: [-62, 68, -55], color: "#702963", description: "Fundamental symmetry" },
    { name: "Equivalence Principle", position: [78, -42, 65], color: "#5c4033", description: "Gravity universality" },
    { name: "Gravitational Redshift", position: [-48, 75, 72], color: "#a52a2a", description: "Time dilation effect" },
    { name: "Frame Dragging", position: [68, -68, -62], color: "#8b4513", description: "Spacetime rotation" },
    { name: "Shapiro Delay", position: [-72, 48, 85], color: "#d2691e", description: "Light time delay" },
    { name: "Parameterized Post-Newton", position: [52, -55, 68], color: "#cd853f", description: "Gravity test framework" },
    { name: "N-Body Simulation", position: [-65, 42, 75], color: "#4169e1", description: "Gravitational dynamics" },
    { name: "SPH Hydrodynamics", position: [72, -58, -48], color: "#1e90ff", description: "Smoothed particle method" },
    { name: "AMR Grid Refinement (II)", position: [-55, 68, 62], color: "#00bfff", description: "Adaptive mesh resolution" },
    { name: "Monte Carlo Transport", position: [48, -72, 85], color: "#87ceeb", description: "Radiation transfer" },
    { name: "MHD Turbulence Sim", position: [-78, 55, -55], color: "#5f9ea0", description: "Magnetic field evolution" },
    { name: "Radiative Transfer Code", position: [65, -45, 72], color: "#20b2aa", description: "Photon propagation" },
    { name: "Chemical Network Solver", position: [-48, 75, 58], color: "#3cb371", description: "Reaction rate integration" },
    { name: "Dust Evolution Model", position: [75, -62, -65], color: "#8b4513", description: "Grain growth tracking" },
    { name: "Planet Formation Sim", position: [-68, 48, 82], color: "#daa520", description: "Planetesimal dynamics" },
    { name: "Stellar Evolution Code", position: [55, -75, 52], color: "#ffa500", description: "Nuclear burning tracks" },
    { name: "Supernova Explosion Sim", position: [-72, 62, -48], color: "#ff4500", description: "Core-collapse modeling" },
    { name: "Galaxy Formation Code", position: [68, -48, 78], color: "#9370db", description: "Cosmological simulation" },
    { name: "Black Hole Merger Sim", position: [-55, 72, 65], color: "#1c1c1c", description: "Numerical relativity" },
    { name: "Accretion Disk Model", position: [78, -65, -58], color: "#ff6347", description: "Viscous flow dynamics" },
    { name: "Jet Propagation Sim", position: [-62, 55, 88], color: "#dc143c", description: "Relativistic outflows" },
    { name: "Cluster Formation Sim", position: [52, -78, 62], color: "#b22222", description: "Galaxy cluster assembly" },
    { name: "Cosmic Web Simulation", position: [-75, 48, -72], color: "#8b0000", description: "Large-scale structure" },
    { name: "Reionization Modeling", position: [65, -55, 75], color: "#00ced1", description: "Epoch simulation" },
    { name: "Lyman-Alpha RT", position: [-48, 68, 55], color: "#40e0d0", description: "Resonant scattering" },
    { name: "21-cm Signal Sim", position: [72, -72, -55], color: "#48d1cc", description: "Neutral hydrogen map" },
    { name: "Post-Processing Pipeline", position: [-65, 58, 78], color: "#7fffd4", description: "Mock observation" },
    { name: "Machine Learning Classifier", position: [58, -48, 85], color: "#66cdaa", description: "Galaxy morphology AI" },
    { name: "Neural Network Emulator", position: [-72, 72, -42], color: "#8fbc8f", description: "Fast surrogate model" },
    { name: "Bayesian Parameter Inference", position: [75, -62, 58], color: "#2e8b57", description: "MCMC sampling" },
    { name: "Gaussian Process Regression", position: [-58, 55, 72], color: "#228b22", description: "Non-parametric fitting" },
    { name: "Roman Space Telescope", position: [68, -48, 85], color: "#ffd700", description: "Wide-field infrared survey" },
    { name: "Vera Rubin Observatory", position: [-72, 62, -55], color: "#9400d3", description: "LSST deep survey" },
    { name: "Extremely Large Telescope", position: [55, -75, 62], color: "#4682b4", description: "39-meter primary mirror" },
    { name: "Giant Magellan Telescope", position: [-65, 48, 78], color: "#5f9ea0", description: "Segmented giant mirror" },
    { name: "Thirty Meter Telescope", position: [75, -55, -68], color: "#00ced1", description: "Next-gen optical/IR" },
    { name: "Square Kilometre Array", position: [-55, 72, 52], color: "#ff4500", description: "Radio interferometer array" },
    { name: "ngVLA Array", position: [62, -68, 75], color: "#ff6347", description: "Next-gen Very Large Array" },
    { name: "LISA Constellation", position: [-78, 55, -48], color: "#dda0dd", description: "Space gravitational waves" },
    { name: "Einstein Telescope", position: [48, -72, 82], color: "#9370db", description: "Underground GW detector" },
    { name: "Cosmic Explorer", position: [-68, 65, 68], color: "#8a2be2", description: "40-km GW interferometer" },
    { name: "Athena X-ray Observatory", position: [72, -48, -62], color: "#1e90ff", description: "Hot universe mission" },
    { name: "LUVOIR Concept", position: [-52, 78, 55], color: "#00bfff", description: "Large UV/optical/IR" },
    { name: "HabEx Mission", position: [65, -62, 78], color: "#87ceeb", description: "Habitable exoplanet imager" },
    { name: "Origins Space Telescope", position: [-75, 48, -72], color: "#add8e6", description: "Far-infrared surveyor" },
    { name: "Lynx X-ray Observatory", position: [55, -78, 58], color: "#4169e1", description: "High-resolution X-ray" },
    { name: "CMB-S4 Experiment", position: [-62, 55, 85], color: "#ffa07a", description: "Ground-based CMB survey" },
    { name: "Simons Observatory", position: [78, -45, -55], color: "#fa8072", description: "CMB polarization" },
    { name: "LiteBIRD Satellite", position: [-48, 72, 62], color: "#f08080", description: "B-mode satellite" },
    { name: "PICO Mission Concept", position: [68, -68, 72], color: "#cd5c5c", description: "Polarized CMB imaging" },
    { name: "ARIEL Exoplanet Mission", position: [-72, 58, -58], color: "#32cd32", description: "Atmospheric characterization" },
    { name: "PLATO Transit Survey", position: [52, -55, 88], color: "#9acd32", description: "Rocky planet finder" },
    { name: "Euclid Dark Universe", position: [-65, 75, 48], color: "#6b8e23", description: "Cosmic geometry mapper" },
    { name: "SPHEREx All-Sky Survey", position: [75, -72, -48], color: "#808000", description: "Spectrophotometric explorer" },
    { name: "ULTRASAT UV Transient", position: [-55, 62, 75], color: "#bdb76b", description: "UV transient satellite" },
    { name: "Dragonfly Titan Lander", position: [62, -48, 82], color: "#f4a460", description: "Saturn moon explorer" },
    { name: "Thorne-Zytkow Object (IV)", position: [-68, 55, 78], color: "#ff0000", description: "Neutron star in red giant" },
    { name: "Przybylski Star", position: [75, -62, -52], color: "#ffd700", description: "Exotic element abundance" },
    { name: "Tabby Star Anomaly", position: [-55, 72, 65], color: "#daa520", description: "Irregular dimming mystery" },
    { name: "STEVE Phenomenon", position: [62, -48, 88], color: "#ff69b4", description: "Atmospheric light ribbon" },
    { name: "Sprites and Elves", position: [-72, 58, -48], color: "#ff1493", description: "Upper atmosphere lightning" },
    { name: "Ball Lightning Event", position: [48, -75, 72], color: "#ffff00", description: "Plasma sphere mystery" },
    { name: "Hessdalen Lights", position: [-65, 48, 82], color: "#00ff00", description: "Unexplained glow phenomena" },
    { name: "Quasar Microlensing", position: [72, -55, -65], color: "#9400d3", description: "Magnified quasar structure" },
    { name: "Einstein Cross (III)", position: [-48, 68, 55], color: "#8b008b", description: "Quadruple lensed quasar" },
    { name: "Cosmic String Wake", position: [65, -72, 78], color: "#4b0082", description: "Topological defect trace" },
    { name: "Domain Wall Relic", position: [-78, 55, -58], color: "#483d8b", description: "Phase transition boundary" },
    { name: "Monopole Search", position: [55, -65, 85], color: "#6a5acd", description: "Magnetic pole particle" },
    { name: "Q-Ball Signature", position: [-62, 75, 48], color: "#7b68ee", description: "Non-topological soliton" },
    { name: "Strange Quark Matter", position: [78, -48, -72], color: "#9370db", description: "Exotic nuclear state" },
    { name: "Quark-Gluon Plasma", position: [-55, 62, 75], color: "#ba55d3", description: "Deconfined matter phase" },
    { name: "Color Superconductor", position: [68, -78, 58], color: "#da70d6", description: "Dense quark pairing" },
    { name: "Penta-Quark State", position: [-75, 48, -55], color: "#ee82ee", description: "Five-quark hadron" },
    { name: "Tetra-Quark Meson", position: [52, -55, 88], color: "#dda0dd", description: "Four-quark bound state" },
    { name: "Glueball Detection", position: [-68, 72, 62], color: "#e6e6fa", description: "Pure glue hadron" },
    { name: "Hybrid Meson State", position: [75, -68, -48], color: "#d8bfd8", description: "Quark-gluon mixture" },
    { name: "Exotic Baryon", position: [-52, 55, 82], color: "#c71585", description: "Non-standard three-quark" },
    { name: "Kaon Regeneration", position: [62, -72, 65], color: "#db7093", description: "CP violation probe" },
    { name: "Neutral Meson Mixing", position: [-78, 62, -52], color: "#ff69b4", description: "Flavor oscillation" },
    { name: "Charm Quark Hadron", position: [48, -48, 78], color: "#ff1493", description: "Heavy flavor state" },
    { name: "Bottom Quark Meson", position: [-65, 68, 58], color: "#c71585", description: "Beauty particle decay" },
    { name: "Radio Continuum Survey", position: [72, -55, 78], color: "#ff4500", description: "Full-sky radio map" },
    { name: "Infrared All-Sky Survey", position: [-68, 62, -52], color: "#8b0000", description: "WISE/2MASS heritage" },
    { name: "Optical Spectroscopic Survey", position: [55, -72, 65], color: "#4682b4", description: "SDSS-style mapping" },
    { name: "UV Sky Survey", position: [-55, 48, 85], color: "#9400d3", description: "GALEX archive" },
    { name: "X-ray All-Sky Monitor", position: [68, -65, -58], color: "#1e90ff", description: "eROSITA scanning" },
    { name: "Gamma-Ray Sky Map", position: [-72, 75, 48], color: "#32cd32", description: "Fermi LAT all-sky" },
    { name: "Neutrino Sky Map", position: [48, -48, 82], color: "#00ced1", description: "IceCube hotspots" },
    { name: "Gravitational Wave Skymap", position: [-65, 55, -68], color: "#ff69b4", description: "LIGO/Virgo localizations" },
    { name: "Cosmic Ray Arrival Map", position: [75, -78, 55], color: "#ffa500", description: "Auger anisotropy" },
    { name: "Photometric Redshift Catalog", position: [-52, 68, 72], color: "#daa520", description: "Photo-z estimation" },
    { name: "Spectroscopic Redshift Survey", position: [62, -55, -75], color: "#b8860b", description: "Precision distances" },
    { name: "Proper Motion Catalog", position: [-78, 48, 62], color: "#cd853f", description: "Stellar kinematics" },
    { name: "Parallax Distance Catalog", position: [55, -68, 78], color: "#d2691e", description: "Gaia parallaxes" },
    { name: "Stellar Parameter Catalog", position: [-62, 72, -48], color: "#8b4513", description: "Teff/logg/[Fe/H]" },
    { name: "Exoplanet Archive Entry", position: [78, -45, 65], color: "#228b22", description: "Confirmed planet database" },
    { name: "Variable Star Catalog", position: [-48, 55, 88], color: "#006400", description: "AAVSO/ASAS archive" },
    { name: "Supernova Cosmology Sample", position: [65, -75, -52], color: "#2e8b57", description: "Standardized candles" },
    { name: "Galaxy Cluster Catalog", position: [-75, 62, 55], color: "#3cb371", description: "RedMaPPer/SPT sample" },
    { name: "Gravitational Lens Database", position: [52, -52, 82], color: "#66cdaa", description: "Strong lens archive" },
    { name: "AGN Spectral Library", position: [-68, 78, -55], color: "#8fbc8f", description: "Emission line atlas" },
    { name: "Stellar Spectra Library", position: [72, -68, 58], color: "#9acd32", description: "MILES/STELIB templates" },
    { name: "Nebular Emission Catalog", position: [-55, 48, 75], color: "#7fff00", description: "HII region atlas" },
    { name: "Molecular Cloud Survey", position: [68, -58, -68], color: "#adff2f", description: "CO mapping archive" },
    { name: "Pulsar Timing Array Data", position: [-72, 65, 62], color: "#00fa9a", description: "NANOGrav dataset" },
    { name: "Fast Radio Burst Catalog", position: [48, -72, 75], color: "#00ff7f", description: "CHIME/FRB archive" },
    { name: "Hubble Deep Field", position: [-65, 55, 82], color: "#191970", description: "First deep universe glimpse" },
    { name: "Hubble Ultra Deep Field", position: [72, -62, -48], color: "#000080", description: "Deepest optical image" },
    { name: "JWST Deep Field", position: [-52, 78, 55], color: "#0000cd", description: "Infrared universe revealed" },
    { name: "Crab Pulsar Discovery", position: [68, -48, 78], color: "#ff4500", description: "First neutron star ID" },
    { name: "First Quasar 3C273", position: [-78, 62, -55], color: "#ffd700", description: "Cosmic beacon discovered" },
    { name: "CMB Discovery Point", position: [55, -75, 62], color: "#fffacd", description: "Penzias-Wilson detection" },
    { name: "First Exoplanet 51 Peg b", position: [-68, 48, 72], color: "#32cd32", description: "Hot Jupiter discovery" },
    { name: "First Binary Pulsar", position: [75, -55, -68], color: "#00ced1", description: "Hulse-Taylor system" },
    { name: "SN 1987A Site", position: [-55, 72, 48], color: "#ff6347", description: "Nearby supernova event" },
    { name: "GW150914 Source", position: [62, -68, 85], color: "#8b008b", description: "First gravitational wave" },
    { name: "First Magnetar SGR 1806", position: [-72, 55, -62], color: "#dc143c", description: "Ultra-magnetic neutron star" },
    { name: "First Millisecond Pulsar", position: [48, -78, 58], color: "#00bfff", description: "PSR B1937+21 spin-up" },
    { name: "Cygnus X-1 Black Hole", position: [-62, 68, 75], color: "#1c1c1c", description: "First stellar black hole" },
    { name: "Sgr A* Discovery Site", position: [78, -48, -55], color: "#2f4f4f", description: "Galactic center black hole" },
    { name: "M87* Event Horizon", position: [-48, 55, 88], color: "#363636", description: "First black hole image" },
    { name: "First Fast Radio Burst", position: [65, -72, 52], color: "#ff1493", description: "Lorimer burst detection" },
    { name: "First Repeating FRB", position: [-75, 62, -48], color: "#ff69b4", description: "FRB 121102 localized" },
    { name: "First Kilonova AT2017gfo", position: [52, -55, 78], color: "#daa520", description: "NS merger optical" },
    { name: "Wow! Signal Location", position: [-68, 78, 55], color: "#00ff00", description: "Famous SETI detection" },
    { name: "Pioneer Anomaly Zone", position: [72, -62, -72], color: "#808080", description: "Spacecraft mystery solved" },
    { name: "Voyager 1 Heliopause", position: [-55, 48, 82], color: "#add8e6", description: "Interstellar boundary" },
    { name: "Pale Blue Dot Location", position: [68, -75, 48], color: "#87ceeb", description: "Iconic Earth image" },
    { name: "Earthrise Apollo 8", position: [-72, 65, -55], color: "#4169e1", description: "Earth from lunar orbit" },
    { name: "Pillars of Creation", position: [55, -48, 85], color: "#8b4513", description: "Eagle Nebula iconic" },
    { name: "Horsehead Nebula View", position: [-62, 72, 62], color: "#a0522d", description: "Famous dark nebula" },
    { name: "Mars Perseverance Landing", position: [75, -55, 78], color: "#cd5c5c", description: "Jezero crater exploration" },
    { name: "Curiosity Gale Crater", position: [-68, 62, -48], color: "#b22222", description: "Ancient lakebed study" },
    { name: "Mars Polar Ice Cap", position: [55, -72, 65], color: "#ffffff", description: "Water ice reservoir" },
    { name: "Valles Marineris Canyon", position: [-52, 48, 85], color: "#8b4513", description: "Solar system grand canyon" },
    { name: "Olympus Mons Summit", position: [68, -65, -58], color: "#a52a2a", description: "Largest volcano" },
    { name: "Europa Ocean Evidence", position: [-75, 75, 52], color: "#4682b4", description: "Subsurface water world" },
    { name: "Enceladus Plume Source", position: [62, -48, 78], color: "#e0ffff", description: "Tiger stripe geysers" },
    { name: "Titan Methane Lakes (III)", position: [-55, 68, -55], color: "#daa520", description: "Hydrocarbon seas" },
    { name: "Titan Atmosphere Haze", position: [78, -78, 55], color: "#ffa07a", description: "Orange organic smog" },
    { name: "Io Volcanic Eruption", position: [-62, 55, 82], color: "#ff4500", description: "Active sulfur plumes" },
    { name: "Ganymede Magnetic Field", position: [48, -55, -72], color: "#6a5acd", description: "Moon magnetosphere" },
    { name: "Callisto Crater Basin", position: [-78, 72, 48], color: "#696969", description: "Ancient impact surface" },
    { name: "Venus Phosphine Debate (II)", position: [72, -68, 62], color: "#ffd700", description: "Atmospheric biosignature?" },
    { name: "Venus Surface Radar", position: [-48, 58, -68], color: "#daa520", description: "Magellan mapping" },
    { name: "Mercury Caloris Basin", position: [65, -42, 85], color: "#708090", description: "Giant impact feature" },
    { name: "Mercury Ice Deposits", position: [-72, 65, 55], color: "#f0f8ff", description: "Polar shadowed craters" },
    { name: "Asteroid Bennu Sample", position: [55, -75, -48], color: "#5f9ea0", description: "OSIRIS-REx return" },
    { name: "Asteroid Ryugu Sample", position: [-65, 48, 78], color: "#2f4f4f", description: "Hayabusa2 collection" },
    { name: "Comet 67P Surface", position: [78, -55, 52], color: "#3c3c3c", description: "Rosetta exploration" },
    { name: "Pluto Heart Feature", position: [-55, 78, -42], color: "#ffe4e1", description: "Sputnik Planitia ice" },
    { name: "Charon Red Cap", position: [62, -62, 75], color: "#8b0000", description: "Mordor Macula pole" },
    { name: "Arrokoth Contact Binary", position: [-78, 55, 62], color: "#d2b48c", description: "Primordial Kuiper object" },
    { name: "Triton Geysers", position: [48, -78, -55], color: "#b0e0e6", description: "Nitrogen plume activity" },
    { name: "Miranda Cliff Face", position: [-62, 68, 85], color: "#a9a9a9", description: "Verona Rupes scarp" },
    { name: "Uranus Ring System", position: [75, -48, 68], color: "#4169e1", description: "Dark narrow rings" },
    { name: "Alpha Centauri System", position: [-68, 55, 78], color: "#ffd700", description: "Nearest stellar neighbor" },
    { name: "Proxima Centauri b", position: [72, -62, -48], color: "#32cd32", description: "Nearest exoplanet" },
    { name: "Barnard Star Motion", position: [-55, 72, 55], color: "#ff6347", description: "Fastest proper motion" },
    { name: "Sirius Binary System", position: [65, -48, 82], color: "#e0ffff", description: "Brightest night star" },
    { name: "Vega Debris Disk", position: [-78, 65, -52], color: "#87ceeb", description: "First IR excess detected" },
    { name: "Betelgeuse Dimming", position: [55, -75, 62], color: "#ff4500", description: "Great dimming event" },
    { name: "Rigel Blue Supergiant", position: [-62, 48, 85], color: "#4169e1", description: "Orion anchor star" },
    { name: "Polaris Cepheid", position: [78, -55, -65], color: "#ffd700", description: "North pole standard" },
    { name: "Algol Eclipse System", position: [-48, 78, 48], color: "#dcdcdc", description: "Prototype eclipsing binary" },
    { name: "Mira Variable Star", position: [68, -68, 72], color: "#ff0000", description: "Long-period prototype" },
    { name: "RR Lyrae Standard", position: [-75, 55, -58], color: "#ffa500", description: "Horizontal branch pulsator" },
    { name: "Delta Cephei Prototype", position: [52, -42, 88], color: "#ffd700", description: "Classical Cepheid standard" },
    { name: "T Tauri Young Star", position: [-68, 72, 62], color: "#ff8c00", description: "Pre-main-sequence type" },
    { name: "FU Orionis Outburst (II)", position: [75, -78, -48], color: "#ff4500", description: "Accretion eruption" },
    { name: "SS Cygni Dwarf Nova", position: [-55, 62, 78], color: "#00bfff", description: "Prototype CV outburst" },
    { name: "Eta Carinae Nebula", position: [62, -55, 55], color: "#ff69b4", description: "Massive star eruption" },
    { name: "Wolf-Rayet Bubble", position: [-72, 48, -72], color: "#9400d3", description: "Stellar wind shell" },
    { name: "Pleiades Cluster", position: [48, -72, 82], color: "#add8e6", description: "Seven Sisters open cluster" },
    { name: "Hyades Cluster Core", position: [-65, 75, 48], color: "#ffdab9", description: "Nearest open cluster" },
    { name: "Omega Centauri Core", position: [78, -48, -58], color: "#ffff00", description: "Largest globular cluster" },
    { name: "47 Tucanae Center", position: [-52, 58, 85], color: "#ffd700", description: "Dense globular core" },
    { name: "M13 Hercules Cluster", position: [68, -65, 52], color: "#f0e68c", description: "Northern globular showcase" },
    { name: "M4 Scorpius Cluster", position: [-78, 68, -48], color: "#daa520", description: "Nearest globular cluster" },
    { name: "Trapezium Cluster", position: [55, -55, 78], color: "#87cefa", description: "Orion OB association" },
    { name: "Double Cluster Perseus", position: [-62, 55, 68], color: "#b0c4de", description: "NGC 869/884 pair" },
    { name: "Orion Nebula M42", position: [72, -55, 78], color: "#ff69b4", description: "Stellar nursery showcase" },
    { name: "Carina Nebula Complex", position: [-68, 62, -48], color: "#ff1493", description: "Massive star factory" },
    { name: "Lagoon Nebula M8", position: [55, -72, 65], color: "#db7093", description: "Summer Milky Way gem" },
    { name: "Trifid Nebula M20", position: [-55, 48, 85], color: "#c71585", description: "Tri-lobed emission" },
    { name: "Eagle Nebula M16", position: [68, -65, -58], color: "#8b4513", description: "Pillars of Creation home" },
    { name: "Rosette Nebula Core", position: [-72, 75, 52], color: "#ff6347", description: "Circular HII region" },
    { name: "Tarantula Nebula 30 Dor", position: [48, -48, 82], color: "#ff4500", description: "LMC starburst region" },
    { name: "Ring Nebula M57", position: [-65, 55, -68], color: "#00ff7f", description: "Classic planetary nebula" },
    { name: "Helix Nebula NGC 7293", position: [75, -78, 55], color: "#00ced1", description: "Eye of God nebula" },
    { name: "Cat Eye Nebula NGC 6543", position: [-52, 68, 72], color: "#40e0d0", description: "Complex PN structure" },
    { name: "Butterfly Nebula NGC 6302", position: [62, -55, -75], color: "#9370db", description: "Bipolar planetary nebula" },
    { name: "Crab Nebula M1", position: [-78, 48, 62], color: "#ff8c00", description: "Supernova remnant icon" },
    { name: "Veil Nebula Complex", position: [55, -68, 78], color: "#4169e1", description: "Cygnus Loop remnant" },
    { name: "Cassiopeia A Remnant", position: [-62, 72, -48], color: "#ff0000", description: "Young supernova shell" },
    { name: "Tycho Remnant SNR", position: [78, -45, 65], color: "#dc143c", description: "Type Ia historical SN" },
    { name: "Kepler Remnant SNR", position: [-48, 55, 88], color: "#b22222", description: "1604 supernova shell" },
    { name: "Witch Head Nebula", position: [65, -75, -52], color: "#e6e6fa", description: "Rigel reflection nebula" },
    { name: "Flame Nebula NGC 2024", position: [-75, 62, 55], color: "#ff4500", description: "Orion Belt emission" },
    { name: "North America Nebula", position: [52, -52, 82], color: "#ff6347", description: "Cygnus shape nebula" },
    { name: "Pelican Nebula IC 5070", position: [-68, 78, -55], color: "#fa8072", description: "Cygnus companion" },
    { name: "Cone Nebula NGC 2264", position: [72, -68, 58], color: "#8b0000", description: "Dark pillar structure" },
    { name: "Elephant Trunk Nebula", position: [-55, 48, 75], color: "#a52a2a", description: "IC 1396 dark globule" },
    { name: "Barnard 68 Dark Cloud", position: [68, -58, -68], color: "#1c1c1c", description: "Bok globule silhouette" },
    { name: "Coalsack Dark Nebula", position: [-72, 65, 62], color: "#2f2f2f", description: "Southern dark cloud" },
    { name: "Snake Nebula B72", position: [48, -72, 75], color: "#363636", description: "Ophiuchus dark lane" },
    { name: "Andromeda Galaxy M31", position: [-68, 55, 82], color: "#9370db", description: "Nearest spiral galaxy" },
    { name: "Triangulum Galaxy M33", position: [75, -62, -48], color: "#8a2be2", description: "Local Group spiral" },
    { name: "Large Magellanic Cloud", position: [-55, 72, 58], color: "#dda0dd", description: "Irregular satellite galaxy" },
    { name: "Small Magellanic Cloud", position: [62, -48, 78], color: "#e6e6fa", description: "Dwarf irregular companion" },
    { name: "Sombrero Galaxy M104", position: [-78, 65, -52], color: "#ffd700", description: "Edge-on with dust lane" },
    { name: "Whirlpool Galaxy M51", position: [55, -75, 65], color: "#4169e1", description: "Grand design spiral" },
    { name: "Pinwheel Galaxy M101", position: [-62, 48, 85], color: "#6495ed", description: "Face-on spiral arms" },
    { name: "Bode Galaxy M81", position: [78, -55, -65], color: "#87ceeb", description: "Ursa Major spiral" },
    { name: "Cigar Galaxy M82", position: [-48, 78, 52], color: "#ff4500", description: "Starburst outflow" },
    { name: "Centaurus A NGC 5128", position: [68, -68, 72], color: "#2f4f4f", description: "Radio galaxy dust lane" },
    { name: "Sculptor Galaxy NGC 253", position: [-75, 55, -58], color: "#708090", description: "Silver Dollar starburst" },
    { name: "Black Eye Galaxy M64", position: [52, -42, 88], color: "#1c1c1c", description: "Evil Eye dust band" },
    { name: "Sunflower Galaxy M63", position: [-68, 72, 62], color: "#ffd700", description: "Flocculent spiral arms" },
    { name: "Tadpole Galaxy UGC 10214", position: [75, -78, -48], color: "#4682b4", description: "Tidal tail interaction" },
    { name: "Antennae Galaxies NGC 4038", position: [-55, 62, 78], color: "#ff6347", description: "Colliding pair merger" },
    { name: "Mice Galaxies NGC 4676", position: [62, -55, 58], color: "#daa520", description: "Interacting tail galaxies" },
    { name: "Cartwheel Galaxy Ring", position: [-72, 48, -72], color: "#00ced1", description: "Collision ring structure" },
    { name: "Hoag Object Ring Galaxy", position: [48, -72, 82], color: "#20b2aa", description: "Perfect ring galaxy" },
    { name: "NGC 1277 Relic Galaxy", position: [-65, 75, 48], color: "#8b0000", description: "Frozen ancient galaxy" },
    { name: "UGC 2885 Rubin Galaxy", position: [78, -48, -58], color: "#4169e1", description: "Largest known spiral" },
    { name: "IC 1101 Giant Elliptical", position: [-52, 58, 85], color: "#ffa500", description: "Largest known galaxy" },
    { name: "Messier 87 Jet Galaxy", position: [68, -65, 55], color: "#9400d3", description: "Virgo A jet source" },
    { name: "NGC 4889 Core", position: [-78, 68, -48], color: "#2f2f2f", description: "Coma cluster giant" },
    { name: "Fornax A Radio Lobes", position: [55, -55, 78], color: "#ff8c00", description: "NGC 1316 merger" },
    { name: "Stephan Quintet Group", position: [-62, 55, 72], color: "#9932cc", description: "Famous compact group" },
    { name: "Virgo Cluster Center", position: [72, -55, 82], color: "#ffd700", description: "Nearest galaxy cluster" },
    { name: "Coma Cluster Core (II)", position: [-68, 62, -48], color: "#ffa500", description: "Dense galaxy cluster" },
    { name: "Perseus Cluster ICM", position: [55, -72, 68], color: "#ff4500", description: "Hot X-ray gas" },
    { name: "Abell 2029 Giant", position: [-55, 48, 85], color: "#ff6347", description: "Dominant cD galaxy" },
    { name: "Bullet Cluster Collision", position: [68, -65, -58], color: "#00bfff", description: "Dark matter proof" },
    { name: "El Gordo Merger", position: [-72, 75, 55], color: "#1e90ff", description: "Largest merging cluster" },
    { name: "Musket Ball Cluster", position: [48, -48, 82], color: "#4169e1", description: "Offset DM subclump" },
    { name: "Abell 520 Train Wreck", position: [-65, 55, -68], color: "#6495ed", description: "Complex merger remnant" },
    { name: "Pandora Cluster A2744", position: [75, -78, 58], color: "#87ceeb", description: "Frontier Fields target" },
    { name: "MACS J0717 Filament", position: [-52, 68, 75], color: "#add8e6", description: "Massive cluster filament" },
    { name: "Phoenix Cluster Starburst", position: [62, -55, -75], color: "#00ced1", description: "Extreme BCG formation" },
    { name: "SPT-CL J2106 Distant", position: [-78, 48, 65], color: "#40e0d0", description: "High-z SZ cluster" },
    { name: "Great Attractor Region (II)", position: [55, -68, 82], color: "#9400d3", description: "Norma supercluster pull" },
    { name: "Shapley Concentration", position: [-62, 72, -48], color: "#8b008b", description: "Richest supercluster" },
    { name: "Laniakea Supercluster (II)", position: [78, -45, 68], color: "#ba55d3", description: "Our cosmic home" },
    { name: "Sloan Great Wall (II)", position: [-48, 55, 88], color: "#dda0dd", description: "Billion light-year structure" },
    { name: "Hercules Corona Wall", position: [65, -75, -52], color: "#e6e6fa", description: "Largest known structure" },
    { name: "Boötes Void Center", position: [-75, 62, 58], color: "#2f2f4f", description: "Great cosmic void" },
    { name: "KBC Void Local", position: [52, -52, 82], color: "#191970", description: "Local underdense region" },
    { name: "Cold Spot Anomaly (II)", position: [-68, 78, -55], color: "#000080", description: "CMB supervoid imprint" },
    { name: "Cosmic Web Node (IV)", position: [72, -68, 62], color: "#4b0082", description: "Filament intersection" },
    { name: "Intergalactic Filament", position: [-55, 48, 78], color: "#6a5acd", description: "WHIM gas strand" },
    { name: "Cosmic Void Wall", position: [68, -58, -68], color: "#7b68ee", description: "Void boundary layer" },
    { name: "Baryon Acoustic Peak (II)", position: [-72, 65, 65], color: "#9370db", description: "Standard ruler scale" },
    { name: "Cosmic Shear Field (II)", position: [48, -72, 78], color: "#8a2be2", description: "Weak lensing pattern" },
    { name: "Planck Epoch Relic", position: [210, -130, 195], color: "#ff00ff", description: "Quantum gravity signatures from the first 10^-43 seconds" },
    { name: "Grand Unification Era", position: [-215, 125, -180], color: "#00ffcc", description: "Epoch when strong and electroweak forces were unified" },
    { name: "Inflationary Bubble", position: [175, -95, 220], color: "#ffcc00", description: "Expanding pocket universe from eternal inflation" },
    { name: "Slow-Roll Inflaton", position: [-190, 140, 165], color: "#cc00ff", description: "Scalar field driving exponential cosmic expansion" },
    { name: "Reheating Phase (II)", position: [225, -85, -175], color: "#00ff99", description: "Conversion of inflaton energy to Standard Model particles" },
    { name: "Baryogenesis Window", position: [-160, 110, 200], color: "#ff9900", description: "Brief epoch generating matter-antimatter asymmetry" },
    { name: "Sphaleron Process", position: [180, -145, -155], color: "#9900ff", description: "Electroweak baryon number violation in early universe" },
    { name: "Electroweak Crossover", position: [-205, 95, 145], color: "#00ccff", description: "Smooth transition from unified to broken symmetry" },
    { name: "QCD Confinement", position: [195, -75, 185], color: "#ffff00", description: "Quarks becoming bound into hadrons as universe cooled" },
    { name: "Neutrino Decoupling", position: [-175, 135, -190], color: "#ff0099", description: "Cosmic neutrino background freezing out at 1 second" },
    { name: "Big Bang Nucleosynthesis (II)", position: [220, -115, 160], color: "#00ff66", description: "Primordial helium and lithium creation in first minutes" },
    { name: "Deuterium Bottleneck", position: [-185, 100, 175], color: "#cc66ff", description: "Critical threshold allowing heavier element formation" },
    { name: "Helium-4 Abundance", position: [165, -125, -200], color: "#66ccff", description: "Primordial ratio constraining cosmological parameters" },
    { name: "Lithium Problem (II)", position: [-210, 145, 140], color: "#ffcc66", description: "Discrepancy between predicted and observed Li-7" },
    { name: "Photon-Baryon Fluid", position: [200, -90, 195], color: "#ff6699", description: "Tightly coupled plasma before recombination" },
    { name: "Acoustic Oscillation Peak", position: [-170, 120, -165], color: "#99ff66", description: "Characteristic scale from sound waves in early plasma" },
    { name: "Silk Damping Scale (II)", position: [185, -140, 170], color: "#6699ff", description: "Photon diffusion erasing small-scale perturbations" },
    { name: "Last Scattering Surface", position: [-195, 85, 210], color: "#ff66cc", description: "Cosmic photosphere where CMB photons originated" },
    { name: "Saha Equilibrium", position: [230, -105, -145], color: "#66ffcc", description: "Ionization balance determining recombination timing" },
    { name: "Cosmic Dark Ages", position: [-155, 130, 185], color: "#9966ff", description: "Era between recombination and first star formation" },
    { name: "Primordial Density Seed", position: [175, -80, 205], color: "#ccff66", description: "Quantum fluctuation grown to galaxy cluster scale" },
    { name: "First Light Object", position: [-220, 105, -155], color: "#ff9966", description: "Hypothetical first luminous source in the universe" },
    { name: "Population III Star (II)", position: [190, -135, 150], color: "#66ff99", description: "Metal-free first generation star from pristine gas" },
    { name: "Cosmic Dawn Epoch", position: [-180, 150, 170], color: "#9999ff", description: "Era when first stars and galaxies illuminated space" },
    { name: "Reionization Bubble (III)", position: [205, -70, -180], color: "#ffff99", description: "Expanding ionized region around early UV sources" },
    { name: "Gunn-Peterson Trough (III)", position: [-165, 90, 195], color: "#ff00cc", description: "Complete absorption indicating neutral hydrogen at z>6" },
    { name: "Lyman-Alpha Emitter (II)", position: [215, -120, 165], color: "#00ffaa", description: "High-redshift galaxy detected via hydrogen emission" },
    { name: "Lyman-Break Galaxy (II)", position: [-200, 135, -170], color: "#ffaa00", description: "Distant galaxy identified by UV spectral discontinuity" },
    { name: "Damped Lyman-Alpha System (III)", position: [180, -95, 200], color: "#aa00ff", description: "High column density absorber probing early galaxies" },
    { name: "Cosmic Infrared Background (II)", position: [-175, 115, 180], color: "#00aaff", description: "Integrated light from dust-obscured star formation" },
    { name: "Cosmic X-ray Background", position: [225, -80, -160], color: "#ffff00", description: "Diffuse emission from unresolved AGN population" },
    { name: "Cosmic Gamma-ray Background", position: [-190, 145, 155], color: "#ff00aa", description: "High-energy photon field from blazars and unknown sources" },
    { name: "Unresolved Point Source", position: [170, -130, 190], color: "#00ffff", description: "Faint extragalactic source below detection threshold" },
    { name: "Gravitational Wave Background", position: [-210, 100, -185], color: "#aaff00", description: "Stochastic signal from supermassive black hole mergers" },
    { name: "Pulsar Timing Residual (II)", position: [195, -75, 175], color: "#ff66aa", description: "Nanosecond deviations revealing gravitational waves" },
    { name: "Hellings-Downs Correlation", position: [-160, 140, 165], color: "#66aaff", description: "Angular pattern confirming gravitational wave origin" },
    { name: "NANOGrav Signal", position: [230, -110, -150], color: "#aaff66", description: "Evidence for nanohertz gravitational wave spectrum" },
    { name: "LISA Sensitivity Curve", position: [-185, 85, 205], color: "#ff99cc", description: "Millihertz frequency range for space-based detection" },
    { name: "Extreme Mass Ratio Inspiral (II)", position: [175, -140, 160], color: "#99ccff", description: "Stellar object spiraling into supermassive black hole" },
    { name: "Intermediate Mass Black Hole (III)", position: [-220, 125, 145], color: "#ccff99", description: "Elusive 100-100000 solar mass population" },
    { name: "Direct Collapse Black Hole (II)", position: [200, -65, 195], color: "#ff6699", description: "Supermassive seed forming without stellar phase" },
    { name: "Primordial Black Hole (VI)", position: [-170, 150, -175], color: "#6699ff", description: "Relic from early universe density fluctuations" },
    { name: "Hawking Radiation Search", position: [185, -125, 180], color: "#99ff66", description: "Gamma-ray signature of evaporating mini black holes" },
    { name: "Dark Matter Halo Core", position: [-205, 95, 170], color: "#cc66ff", description: "Central concentration of invisible gravitating mass" },
    { name: "Cusp-Core Problem", position: [220, -90, -165], color: "#66ffcc", description: "Tension between simulated and observed halo profiles" },
    { name: "Missing Satellites", position: [-155, 130, 190], color: "#ffcc99", description: "Fewer dwarf galaxies than cold dark matter predicts" },
    { name: "Too-Big-To-Fail Problem", position: [165, -135, 155], color: "#99ffcc", description: "Massive subhalos without observed counterparts" },
    { name: "Self-Interacting Dark Matter", position: [-195, 110, -155], color: "#ccff66", description: "Alternative model with particle collisions" },
    { name: "Fuzzy Dark Matter (II)", position: [210, -70, 200], color: "#ff99ff", description: "Ultralight axion-like particles with wave behavior" },
    { name: "Dark Photon Search", position: [-180, 145, 165], color: "#99ffff", description: "Proposed hidden sector force carrier detection" },
    { name: "Axion Helioscope", position: [225, -85, -175], color: "#ff00ff", description: "Solar axion detector converting to X-rays in magnetic field" },
    { name: "Haloscope Cavity", position: [-165, 120, 195], color: "#00ffdd", description: "Resonant detector for galactic dark matter axions" },
    { name: "Weakly Interacting Massive Particle", position: [190, -130, 170], color: "#ffdd00", description: "Leading thermal relic dark matter candidate" },
    { name: "Direct Detection Limit", position: [-205, 95, -160], color: "#dd00ff", description: "Exclusion boundary from null WIMP searches" },
    { name: "Neutrino Floor", position: [175, -75, 200], color: "#00ddff", description: "Irreducible background from solar and atmospheric neutrinos" },
    { name: "Sterile Neutrino (II)", position: [-185, 140, 155], color: "#ffaa33", description: "Hypothetical right-handed neutrino as warm dark matter" },
    { name: "Kepler Data Archive", position: [220, -105, 165], color: "#33aaff", description: "Transit photometry treasure trove of exoplanet discoveries" },
    { name: "TESS Continuous Viewing Zone", position: [-170, 110, 185], color: "#ff33aa", description: "Polar regions with year-long observation coverage" },
    { name: "JWST Deep Field (II)", position: [200, -90, -180], color: "#aaff33", description: "Infrared window to earliest galaxy assembly" },
    { name: "Roman High Latitude Survey", position: [-195, 135, 145], color: "#33ffaa", description: "Wide-field infrared cosmic census to come" },
    { name: "Euclid Weak Lensing Map", position: [180, -140, 190], color: "#aa33ff", description: "Precision dark energy probe via cosmic shear" },
    { name: "Rubin Observatory Alert Stream", position: [-215, 85, 175], color: "#ffcc00", description: "Real-time transient discovery from LSST" },
    { name: "Extremely Large Telescope (II)", position: [165, -65, 205], color: "#00ccff", description: "39-meter aperture ground-based giant" },
    { name: "Square Kilometre Array (II)", position: [-155, 145, -165], color: "#ff00cc", description: "Radio interferometer spanning continents" },
    { name: "Hydrogen Epoch of Reionization Array", position: [230, -115, 155], color: "#ccff00", description: "21cm tomography of cosmic dawn" },
    { name: "Cosmic Microwave Background Polarization", position: [-180, 100, 195], color: "#00ffcc", description: "B-mode signal from primordial gravitational waves" },
    { name: "Simons Observatory (II)", position: [195, -80, -155], color: "#ff66ff", description: "Ground-based CMB experiment in Atacama" },
    { name: "CMB-S4 Survey", position: [-210, 125, 160], color: "#66ffff", description: "Next-generation cosmic microwave background mapping" },
    { name: "LiteBIRD Satellite (II)", position: [175, -135, 180], color: "#ffff66", description: "Space mission targeting inflation B-modes" },
    { name: "Cosmic Neutrino Background", position: [-190, 90, -175], color: "#ff6666", description: "Relic neutrinos from one second after Big Bang" },
    { name: "PTOLEMY Detector", position: [210, -70, 195], color: "#6666ff", description: "Proposed cosmic neutrino capture experiment" },
    { name: "Stochastic Background Search", position: [-160, 150, 150], color: "#66ff66", description: "Hunting nanohertz waves from black hole pairs" },
    { name: "Einstein Telescope (II)", position: [185, -125, -165], color: "#cc99ff", description: "Third-generation underground gravitational wave detector" },
    { name: "Cosmic Explorer (II)", position: [-200, 105, 185], color: "#99ffcc", description: "40-km arm next-generation LIGO successor" },
    { name: "DECIGO Proposal", position: [220, -95, 170], color: "#ffcc99", description: "Decihertz space interferometer bridging LISA and ground" },
    { name: "String Landscape", position: [-175, 130, -170], color: "#ff00ee", description: "Vast space of possible vacuum configurations" },
    { name: "Anthropic Selection", position: [205, -110, 185], color: "#00eeff", description: "Observer bias in multiverse parameter sampling" },
    { name: "Eternal Inflation Domain", position: [-195, 85, 195], color: "#eeff00", description: "Perpetually inflating region spawning pocket universes" },
    { name: "Bubble Universe Collision", position: [170, -135, -160], color: "#ee00ff", description: "Hypothetical signature in CMB from universe contact" },
    { name: "Cyclic Cosmology Model", position: [-160, 145, 165], color: "#00ffee", description: "Bouncing universe avoiding initial singularity" },
    { name: "Ekpyrotic Scenario", position: [225, -75, 175], color: "#ffee00", description: "Brane collision triggering Big Bang" },
    { name: "Holographic Principle", position: [-210, 100, -155], color: "#ff33ee", description: "Boundary theory encoding bulk spacetime information" },
    { name: "AdS/CFT Correspondence", position: [185, -120, 200], color: "#33eeff", description: "Duality between gravity and quantum field theory" },
    { name: "Black Hole Information Paradox", position: [-180, 140, 150], color: "#eeff33", description: "Unitarity crisis from Hawking evaporation" },
    { name: "Firewall Hypothesis", position: [200, -65, -175], color: "#ee33ff", description: "High-energy curtain at event horizon" },
    { name: "ER=EPR Conjecture", position: [-170, 95, 190], color: "#33ffee", description: "Wormholes as entanglement bridges" },
    { name: "Quantum Gravity Foam", position: [215, -130, 160], color: "#ffee33", description: "Planck-scale spacetime fluctuations" },
    { name: "Loop Quantum Gravity Node", position: [-200, 115, -165], color: "#ff66ee", description: "Discrete spin network quantum of space" },
    { name: "Causal Set Element", position: [175, -85, 195], color: "#66eeff", description: "Fundamental spacetime point in discrete gravity" },
    { name: "Asymptotic Safety", position: [-155, 150, 175], color: "#eeff66", description: "UV fixed point rendering gravity renormalizable" },
    { name: "Modified Newtonian Dynamics", position: [230, -105, -150], color: "#ee66ff", description: "Alternative to dark matter at galactic scales" },
    { name: "Tensor-Vector-Scalar Theory", position: [-185, 80, 200], color: "#66ffee", description: "Relativistic extension of MOND" },
    { name: "f(R) Gravity Model", position: [190, -140, 170], color: "#ffcc66", description: "Modified Einstein-Hilbert action" },
    { name: "Quintessence Field (II)", position: [-215, 125, 145], color: "#66ccff", description: "Dynamical dark energy scalar" },
    { name: "Phantom Energy (III)", position: [165, -70, 205], color: "#cc66ff", description: "Exotic w<-1 dark energy component" },
    { name: "Big Rip Scenario", position: [-175, 140, -175], color: "#ff99ee", description: "Phantom-driven dissolution of all structure" },
    { name: "Heat Death Horizon", position: [210, -115, 180], color: "#99eeff", description: "Ultimate entropic equilibrium state" },
    { name: "Vacuum Decay Bubble", position: [-190, 90, 160], color: "#eeff99", description: "True vacuum nucleation catastrophe" },
    { name: "False Vacuum State", position: [180, -125, -165], color: "#ee99ff", description: "Metastable Higgs field configuration" },
    { name: "Boltzmann Brain Paradox", position: [-165, 135, 185], color: "#99ffee", description: "Thermal fluctuation observer problem" },
    { name: "Galilean Moon System", position: [220, -80, -170], color: "#ff00dd", description: "Io, Europa, Ganymede, Callisto - first telescopic discovery" },
    { name: "Saturn Ring Division", position: [-185, 125, 175], color: "#00ddff", description: "Cassini gap revealing ring structure complexity" },
    { name: "Uranus Discovery Point", position: [195, -130, 165], color: "#ddff00", description: "William Herschel 1781 serendipitous find" },
    { name: "Neptune Prediction Triumph", position: [-170, 95, -160], color: "#dd00ff", description: "Mathematical planet discovered 1846" },
    { name: "Pluto Search Region", position: [180, -70, 200], color: "#00ffdd", description: "Clyde Tombaugh 1930 blink comparator success" },
    { name: "Ceres Discovery Arc", position: [-205, 140, 155], color: "#ffdd00", description: "First asteroid found New Year 1801" },
    { name: "Halley Comet Return", position: [215, -105, -155], color: "#ff66dd", description: "Predicted periodic return validating Newtonian gravity" },
    { name: "Stellar Parallax Measurement", position: [-160, 85, 190], color: "#66ddff", description: "Bessel 61 Cygni 1838 distance proof" },
    { name: "Spectroscopy Revolution", position: [170, -135, 180], color: "#ddff66", description: "Fraunhofer lines revealing stellar composition" },
    { name: "Doppler Shift Discovery", position: [-195, 115, -165], color: "#dd66ff", description: "Radial velocity from spectral line displacement" },
    { name: "Great Debate Location", position: [230, -65, 175], color: "#66ffdd", description: "1920 Shapley-Curtis island universe controversy" },
    { name: "Hubble Variable Star", position: [-180, 145, 160], color: "#ffcc99", description: "Cepheid in Andromeda proving extragalactic nature" },
    { name: "Expanding Universe Evidence", position: [200, -120, -175], color: "#99ccff", description: "1929 velocity-distance relation revelation" },
    { name: "CMB Discovery Antenna", position: [-155, 90, 195], color: "#ccff99", description: "Penzias-Wilson 1965 excess noise signal" },
    { name: "Pulsar Discovery Position", position: [185, -140, 165], color: "#cc99ff", description: "Jocelyn Bell 1967 LGM-1 detection" },
    { name: "First Quasar Identification", position: [-210, 130, -155], color: "#ff9966", description: "3C 273 1963 redshift revelation" },
    { name: "X-ray Sky Opening", position: [175, -75, 205], color: "#6699ff", description: "Giacconi rocket flight 1962 Sco X-1" },
    { name: "Gamma-Ray Burst Alert", position: [-175, 100, 180], color: "#99ff66", description: "Vela satellite 1967 cosmic explosion detection" },
    { name: "First Exoplanet Signal", position: [210, -110, -160], color: "#ff6699", description: "51 Pegasi b 1995 radial velocity wobble" },
    { name: "Gravitational Wave First", position: [-190, 150, 150], color: "#66ff99", description: "GW150914 binary black hole merger signal" },
    { name: "Event Horizon Image", position: [165, -125, 195], color: "#9966ff", description: "M87* 2019 shadow photograph" },
    { name: "Interstellar Visitor Track", position: [-165, 80, -170], color: "#ffaa66", description: "Oumuamua 2017 hyperbolic trajectory" },
    { name: "Dark Energy Supernova", position: [225, -95, 170], color: "#66aaff", description: "1998 accelerating expansion discovery" },
    { name: "Higgs Boson Detection", position: [-200, 135, 165], color: "#aaff66", description: "2012 mass mechanism confirmation at LHC" },
    { name: "Cosmic Milestone 2000", position: [190, -85, -180], color: "#ffd700", description: "Two thousand cosmic sights illuminating the universe!" },
    { name: "N-body Simulation", position: [-175, 120, 195], color: "#ff00bb", description: "Gravitational dynamics of millions of particles" },
    { name: "Smoothed Particle Hydrodynamics", position: [210, -135, -165], color: "#00bbff", description: "Lagrangian fluid simulation method" },
    { name: "Adaptive Mesh Refinement", position: [-195, 85, 175], color: "#bbff00", description: "Dynamic grid resolution in key regions" },
    { name: "Monte Carlo Radiative Transfer", position: [185, -70, 200], color: "#bb00ff", description: "Probabilistic photon propagation through matter" },
    { name: "Spectral Energy Distribution", position: [-160, 145, -155], color: "#00ffbb", description: "Broadband flux characterizing source properties" },
    { name: "Stellar Population Synthesis", position: [225, -110, 170], color: "#ffbb00", description: "Modeling integrated light from star formation history" },
    { name: "Chemical Evolution Model", position: [-180, 95, 185], color: "#ff33bb", description: "Element abundance tracking through cosmic time" },
    { name: "Semi-Analytic Galaxy Model", position: [175, -125, -175], color: "#33bbff", description: "Efficient prescription-based galaxy formation" },
    { name: "Halo Occupation Distribution", position: [-210, 140, 160], color: "#bbff33", description: "Statistical galaxy-halo connection framework" },
    { name: "Subhalo Abundance Matching", position: [200, -65, 195], color: "#bb33ff", description: "Linking stellar mass to halo mass" },
    { name: "Press-Schechter Formalism", position: [-170, 100, -165], color: "#33ffbb", description: "Analytical halo mass function prediction" },
    { name: "Excursion Set Theory", position: [190, -140, 165], color: "#ffbb33", description: "Random walk model for structure formation" },
    { name: "Perturbation Theory Mode", position: [-155, 130, 180], color: "#ff66bb", description: "Weakly nonlinear density field evolution" },
    { name: "Effective Field Theory", position: [230, -80, -155], color: "#66bbff", description: "Systematic expansion for large-scale structure" },
    { name: "Emulator Prediction", position: [-185, 115, 195], color: "#bbff66", description: "Machine learning interpolating simulation grids" },
    { name: "Neural Network Classifier", position: [170, -130, 175], color: "#bb66ff", description: "Deep learning for galaxy morphology" },
    { name: "Convolutional Feature Map", position: [-200, 90, -170], color: "#66ffbb", description: "Image processing layer extracting patterns" },
    { name: "Generative Adversarial Cosmos", position: [215, -100, 185], color: "#ffcc88", description: "AI creating synthetic astronomical images" },
    { name: "Bayesian Inference Chain", position: [-165, 150, 155], color: "#88ccff", description: "MCMC sampling posterior probability distributions" },
    { name: "Nested Sampling Run", position: [180, -75, -180], color: "#ccff88", description: "Evidence calculation for model comparison" },
    { name: "Fisher Matrix Forecast", position: [-190, 105, 175], color: "#cc88ff", description: "Parameter constraint projection for future surveys" },
    { name: "Covariance Matrix Element", position: [205, -135, 160], color: "#88ffcc", description: "Statistical correlation between observables" },
    { name: "Systematic Error Budget", position: [-175, 85, -160], color: "#ff88cc", description: "Non-random uncertainty quantification" },
    { name: "Blind Analysis Protocol", position: [195, -115, 200], color: "#aaddff", description: "Bias prevention through hidden results" },
    { name: "Reproducibility Framework", position: [-205, 145, 165], color: "#ffddaa", description: "Open science ensuring verifiable research" },
    { name: "Sloan Digital Sky Survey", position: [220, -90, -170], color: "#ff00aa", description: "Million-galaxy spectroscopic census" },
    { name: "Dark Energy Survey Footprint", position: [-170, 125, 185], color: "#00aaff", description: "5000 square degree optical imaging" },
    { name: "Gaia Astrometric Mission", position: [185, -140, 175], color: "#aaff00", description: "Billion star positions and motions" },
    { name: "WISE Infrared All-Sky", position: [-200, 80, -160], color: "#aa00ff", description: "Mid-infrared source catalog" },
    { name: "Fermi All-Sky Monitor", position: [175, -65, 200], color: "#00ffaa", description: "Gamma-ray source detection network" },
    { name: "IceCube Neutrino Event", position: [-155, 150, 160], color: "#ffaa00", description: "High-energy astrophysical neutrino alert" },
    { name: "LIGO Strain Measurement", position: [230, -115, -155], color: "#ff55aa", description: "Fractional length change from passing wave" },
    { name: "Virgo Interferometer Arm", position: [-185, 95, 195], color: "#55aaff", description: "European gravitational wave detector" },
    { name: "KAGRA Underground Site", position: [195, -130, 170], color: "#aaff55", description: "Japanese cryogenic GW observatory" },
    { name: "ALMA Array Configuration", position: [-165, 140, -165], color: "#aa55ff", description: "66 antenna submillimeter interferometer" },
    { name: "VLA Radio Snapshot", position: [205, -75, 185], color: "#55ffaa", description: "27 dish synthesis imaging array" },
    { name: "Event Horizon Telescope Baseline", position: [-210, 110, 175], color: "#ffaa55", description: "Earth-spanning VLBI network" },
    { name: "Chandra Deep Field", position: [170, -135, -175], color: "#ff88aa", description: "Multi-megasecond X-ray exposure" },
    { name: "XMM-Newton Survey", position: [-180, 85, 190], color: "#88aaff", description: "European X-ray Multi-Mirror Mission" },
    { name: "NuSTAR Hard X-ray Focus", position: [215, -100, 165], color: "#aaff88", description: "First focusing telescope above 10 keV" },
    { name: "Swift Burst Response", position: [-195, 145, -155], color: "#aa88ff", description: "Rapid gamma-ray burst localization" },
    { name: "Hubble Ultra Deep Field (II)", position: [180, -70, 200], color: "#88ffaa", description: "Deepest optical image of distant universe" },
    { name: "Spitzer Infrared Legacy", position: [-160, 100, 180], color: "#ffcc77", description: "Warm mission extending into JWST era" },
    { name: "Herschel Far-Infrared", position: [225, -120, -165], color: "#77ccff", description: "Cold dust emission mapping spacecraft" },
    { name: "Planck CMB Precision", position: [-175, 130, 165], color: "#ccff77", description: "All-sky microwave background mapping" },
    { name: "WMAP Temperature Anisotropy", position: [190, -145, 175], color: "#cc77ff", description: "Predecessor CMB satellite precision data" },
    { name: "COBE Discovery Legacy", position: [-205, 90, -170], color: "#77ffcc", description: "First CMB anisotropy and infrared background" },
    { name: "Voyager Interstellar Medium", position: [200, -80, 195], color: "#ff7799", description: "Spacecraft sampling heliopause plasma" },
    { name: "New Horizons Kuiper Belt", position: [-170, 150, 155], color: "#7799ff", description: "Post-Pluto extended mission exploration" },
    { name: "Parker Solar Probe Perihelion", position: [185, -110, -180], color: "#99ff77", description: "Closest approach to the Sun ever achieved" },
    { name: "Betelgeuse Dimming Event", position: [-190, 115, 175], color: "#ff0099", description: "2019-2020 unprecedented brightness drop" },
    { name: "Eta Carinae Eruption", position: [210, -125, -165], color: "#0099ff", description: "Great Eruption of the 1840s remnant" },
    { name: "Tabby Star Dips", position: [-165, 90, 195], color: "#99ff00", description: "KIC 8462852 mysterious irregular dimming" },
    { name: "TRAPPIST-1 System", position: [195, -80, 180], color: "#9900ff", description: "Seven Earth-sized planets around ultracool dwarf" },
    { name: "Proxima Centauri b (II)", position: [-205, 145, -155], color: "#00ff99", description: "Nearest potentially habitable exoplanet" },
    { name: "55 Cancri e Hemisphere", position: [175, -135, 165], color: "#ff9900", description: "Super-Earth with possible lava ocean" },
    { name: "HD 189733b Atmosphere", position: [-175, 100, 185], color: "#ff55ff", description: "Hot Jupiter with detected water vapor" },
    { name: "WASP-76b Iron Rain", position: [225, -70, -175], color: "#55ffff", description: "Ultrahot Jupiter with metal precipitation" },
    { name: "Kepler-16b Circumbinary", position: [-155, 140, 170], color: "#ffff55", description: "Planet orbiting two suns like Tatooine" },
    { name: "HR 8799 Direct Image", position: [185, -145, 195], color: "#ff5555", description: "Multi-planet system photographed directly" },
    { name: "Beta Pictoris Disk", position: [-210, 85, -160], color: "#5555ff", description: "Iconic debris disk with embedded planet" },
    { name: "Fomalhaut Ring", position: [200, -95, 175], color: "#55ff55", description: "Sharp-edged debris belt sculpted by planet" },
    { name: "Vega Excess Infrared", position: [-180, 130, 160], color: "#ff88ff", description: "First detected circumstellar disk" },
    { name: "Epsilon Eridani System", position: [170, -110, -180], color: "#88ffff", description: "Nearby star with asteroid and Kuiper belts" },
    { name: "Tau Ceti Candidates", position: [-195, 95, 195], color: "#ffff88", description: "Possible habitable zone planets 12 ly away" },
    { name: "Wolf 359 Flare", position: [215, -130, 165], color: "#ff8888", description: "Nearby red dwarf eruption activity" },
    { name: "Barnard Star Motion (II)", position: [-160, 150, -165], color: "#8888ff", description: "Fastest proper motion of any known star" },
    { name: "Sirius Binary Orbit", position: [190, -65, 200], color: "#88ff88", description: "Brightest star with white dwarf companion" },
    { name: "Algol Eclipse Cycle", position: [-175, 105, 175], color: "#ffaa88", description: "Prototype eclipsing binary demon star" },
    { name: "Mira Pulsation Trail", position: [230, -120, -155], color: "#88aaff", description: "Long-period variable with UV tail" },
    { name: "R Coronae Borealis Fade", position: [-185, 140, 155], color: "#aaffaa", description: "Carbon star sudden dimming episodes" },
    { name: "T Tauri Wind", position: [175, -85, 190], color: "#aa88ff", description: "Prototype young stellar object outflow" },
    { name: "FU Orionis Outburst (III)", position: [-200, 90, -170], color: "#88ffaa", description: "Dramatic accretion disk brightening" },
    { name: "V838 Monocerotis Echo", position: [205, -140, 170], color: "#ffaacc", description: "Light echo illuminating surrounding dust" },
    { name: "SN 1987A Rings", position: [-170, 115, 185], color: "#aaccff", description: "Triple ring system around nearby supernova" },
    { name: "Orion Nebula Core", position: [220, -75, -170], color: "#ff0088", description: "M42 massive star forming region" },
    { name: "Horsehead Silhouette", position: [-185, 135, 175], color: "#0088ff", description: "Dark nebula against emission backdrop" },
    { name: "Pillars of Creation (II)", position: [195, -140, 185], color: "#88ff00", description: "Eagle Nebula elephant trunks of gas" },
    { name: "Carina Nebula Complex (II)", position: [-160, 90, -160], color: "#8800ff", description: "Massive southern star factory" },
    { name: "Tarantula Nebula Heart", position: [180, -95, 195], color: "#00ff88", description: "30 Doradus LMC starburst region" },
    { name: "Lagoon Nebula Hourglass", position: [-205, 145, 165], color: "#ff8800", description: "M8 bright HII region with dark lanes" },
    { name: "Trifid Nebula Lobes", position: [210, -110, -165], color: "#ff44ff", description: "M20 emission reflection and dark nebula" },
    { name: "Rosette Nebula Cavity", position: [-175, 100, 190], color: "#44ffff", description: "Stellar wind blown bubble in Monoceros" },
    { name: "North America Nebula (II)", position: [175, -130, 175], color: "#ffff44", description: "NGC 7000 continental outline in Cygnus" },
    { name: "Helix Nebula Eye", position: [-190, 85, -155], color: "#ff4444", description: "NGC 7293 nearest planetary nebula" },
    { name: "Ring Nebula Shell", position: [225, -65, 190], color: "#4444ff", description: "M57 classic planetary nebula in Lyra" },
    { name: "Cat Eye Nebula Shells", position: [-165, 150, 160], color: "#44ff44", description: "NGC 6543 complex nested ejection structure" },
    { name: "Crab Nebula Filaments", position: [190, -145, -175], color: "#ff77ff", description: "M1 supernova remnant with pulsar" },
    { name: "Veil Nebula Arc", position: [-200, 95, 180], color: "#77ffff", description: "Cygnus Loop supernova remnant shock" },
    { name: "Cassiopeia A Shell", position: [170, -80, 200], color: "#ffff77", description: "Youngest Milky Way supernova remnant" },
    { name: "Tycho Remnant Shock", position: [-155, 140, -165], color: "#ff7777", description: "SN 1572 expanding blast wave" },
    { name: "Kepler Remnant", position: [215, -120, 170], color: "#7777ff", description: "SN 1604 last Galactic naked-eye supernova" },
    { name: "Puppis A Oxygen Knots", position: [-180, 105, 195], color: "#77ff77", description: "Oxygen-rich supernova ejecta" },
    { name: "W49B Barrel Shape", position: [200, -135, -160], color: "#ffaa77", description: "Distorted gamma-ray bright remnant" },
    { name: "IC 443 Jellyfish", position: [-210, 130, 155], color: "#77aaff", description: "Supernova remnant interacting with cloud" },
    { name: "Simeis 147 Spaghetti", position: [180, -70, 185], color: "#aaff77", description: "Faint filamentary old remnant" },
    { name: "Gum Nebula Extent", position: [-170, 150, -170], color: "#aa77ff", description: "Enormous southern emission region" },
    { name: "Barnard Loop Curve", position: [230, -105, 175], color: "#77ffaa", description: "Giant Orion region emission arc" },
    { name: "Magellanic Stream Tail", position: [-195, 85, 170], color: "#ffbb99", description: "Tidal gas trailing the LMC and SMC" },
    { name: "Fermi Bubbles Edge", position: [185, -140, -180], color: "#99bbff", description: "Giant gamma-ray lobes from Galactic center" },
    { name: "Virgo Cluster Core (II)", position: [-175, 120, 175], color: "#ff0077", description: "M87 dominated nearest rich galaxy cluster" },
    { name: "Coma Cluster Halo", position: [205, -85, -165], color: "#0077ff", description: "Hot X-ray gas pervading rich cluster" },
    { name: "Perseus Cluster Bubbles", position: [-195, 145, 165], color: "#77ff00", description: "AGN inflated cavities in hot ICM" },
    { name: "Bullet Cluster Offset", position: [180, -130, 195], color: "#7700ff", description: "Dark matter separated from baryonic gas" },
    { name: "Abell 2218 Arc", position: [-160, 90, -155], color: "#00ff77", description: "Spectacular gravitational lensing display" },
    { name: "MACS J1149 Lensed Supernova", position: [220, -70, 180], color: "#ff7700", description: "Multiply imaged Refsdal supernova" },
    { name: "El Gordo Merger (II)", position: [-185, 100, 190], color: "#ff33ff", description: "Most massive known distant cluster collision" },
    { name: "Shapley Supercluster (III)", position: [195, -145, -170], color: "#33ffff", description: "Densest concentration in nearby universe" },
    { name: "Laniakea Basin (II)", position: [-210, 135, 160], color: "#ffff33", description: "Our home supercluster gravitational watershed" },
    { name: "Great Attractor Region (III)", position: [175, -95, 200], color: "#ff3333", description: "Massive concentration behind Zone of Avoidance" },
    { name: "Sloan Great Wall (III)", position: [-165, 150, -165], color: "#3333ff", description: "Billion light-year galactic filament" },
    { name: "Hercules-Corona Borealis Wall", position: [215, -110, 170], color: "#33ff33", description: "Largest known cosmic structure" },
    { name: "Boötes Void Interior", position: [-180, 85, 180], color: "#ff55dd", description: "330 million light-year spherical emptiness" },
    { name: "Cold Spot Anomaly (III)", position: [190, -135, -175], color: "#55ddff", description: "CMB underdensity possibly from supervoid" },
    { name: "Eridanus Supervoid (II)", position: [-200, 105, 165], color: "#ddff55", description: "Billion light-year low-density region" },
    { name: "KBC Void Model", position: [170, -65, 195], color: "#dd55ff", description: "Local underdensity affecting Hubble tension" },
    { name: "Cosmic Web Filament (II)", position: [-155, 145, -160], color: "#55ffdd", description: "Dark matter backbone connecting clusters" },
    { name: "Warm-Hot Intergalactic Medium (II)", position: [225, -120, 175], color: "#ffdd55", description: "Missing baryon reservoir between galaxies" },
    { name: "Lyman-Alpha Forest Absorption", position: [-175, 95, 195], color: "#ff7799", description: "IGM hydrogen clouds along quasar sightlines" },
    { name: "Cosmic Dawn Signal (II)", position: [200, -140, -160], color: "#7799ff", description: "21cm absorption from first star era" },
    { name: "Epoch of Reionization End", position: [-190, 130, 155], color: "#99ff77", description: "Universe becoming transparent to UV" },
    { name: "Gunn-Peterson Complete Absorption", position: [180, -80, 190], color: "#9977ff", description: "Quasar spectra showing neutral IGM at z>6" },
    { name: "Hubble Tension Zone", position: [-205, 150, -170], color: "#77ff99", description: "Discrepancy between local and CMB H0" },
    { name: "S8 Tension Signal", position: [210, -105, 180], color: "#ffcc88", description: "Weak lensing vs CMB structure growth" },
    { name: "Cosmic Coincidence Point", position: [-170, 85, 170], color: "#88ccff", description: "Dark energy density equals matter today" },
    { name: "Adaptive Optics Core", position: [225, 60, -195], color: "#ffaa55", description: "Deformable mirror wavefront correction" },
    { name: "Laser Guide Star Beacon", position: [-230, 145, 175], color: "#ff8844", description: "Sodium layer artificial reference star" },
    { name: "Interferometric Baseline", position: [185, -70, -220], color: "#88ddff", description: "Long baseline phase coherence path" },
    { name: "Coronagraph Mask Field", position: [-195, 95, -185], color: "#aaddee", description: "Stellar light suppression region" },
    { name: "Spectrograph Grating Zone", position: [210, 130, 165], color: "#ddaa88", description: "Dispersive element wavelength spread" },
    { name: "CCD Mosaic Focal Plane", position: [-175, -55, 200], color: "#77ccaa", description: "Multi-chip detector array surface" },
    { name: "Primary Mirror Segment", position: [195, 85, -175], color: "#99bbdd", description: "Hexagonal segmented aperture element" },
    { name: "Secondary Support Structure", position: [-220, 110, -160], color: "#bbccaa", description: "Spider vane diffraction source" },
    { name: "Dome Slit Opening", position: [170, -90, 185], color: "#ddddaa", description: "Observatory enclosure aperture" },
    { name: "Telescope Mount Axis", position: [-185, 75, 210], color: "#aabbcc", description: "Alt-azimuth rotation pivot" },
    { name: "Field Rotator Mechanism", position: [215, -45, -190], color: "#ccaa99", description: "Tracking compensation system" },
    { name: "Atmospheric Dispersion Corrector", position: [-160, 140, -175], color: "#88ccdd", description: "Chromatic aberration fix optics" },
    { name: "Guider Camera Station", position: [180, 65, 195], color: "#aaddcc", description: "Fine tracking sensor position" },
    { name: "Filter Wheel Assembly", position: [-205, -80, 180], color: "#ddcc77", description: "Bandpass selection mechanism" },
    { name: "Calibration Lamp Source", position: [225, 95, -165], color: "#ffdd88", description: "Wavelength reference illumination" },
    { name: "Shutter Blade Mechanism", position: [-170, 120, 190], color: "#bbddaa", description: "Exposure timing control" },
    { name: "Cryostat Cooling System", position: [195, -100, -200], color: "#99ccee", description: "Infrared detector thermal management" },
    { name: "Vacuum Window Interface", position: [-215, 55, -185], color: "#aaccdd", description: "Pressure seal optical element" },
    { name: "Fiber Optic Feed Bundle", position: [165, 135, 175], color: "#ddbb99", description: "Multi-object spectroscopy input" },
    { name: "Echelle Cross-Disperser", position: [-190, -65, 215], color: "#88bbcc", description: "High-resolution order separation" },
    { name: "Polarimeter Wave Plate", position: [220, 80, -180], color: "#ccddbb", description: "Polarization state analyzer" },
    { name: "Lucky Imaging Selector", position: [-175, 105, -170], color: "#aaeecc", description: "Best-seeing frame selection" },
    { name: "Speckle Imaging Correlator", position: [185, -55, 200], color: "#ddaacc", description: "Atmospheric turbulence analysis" },
    { name: "Tip-Tilt Mirror Stage", position: [-225, 145, 165], color: "#99ddaa", description: "Fast image motion correction" },
    { name: "Null Depth Calibrator", position: [200, 70, -195], color: "#bbccdd", description: "Interferometric contrast measurement" },
    { name: "Dish Antenna Focus", position: [-180, 90, -210], color: "#88aadd", description: "Parabolic reflector convergence" },
    { name: "Feed Horn Assembly", position: [215, -75, 185], color: "#ddbb88", description: "Electromagnetic wave collector" },
    { name: "Low Noise Amplifier", position: [-200, 125, 170], color: "#aaddcc", description: "First stage signal boost" },
    { name: "Correlator Processing Core", position: [175, 60, -200], color: "#ccaadd", description: "Interferometric cross-correlation" },
    { name: "Baseline Vector Field", position: [-165, -85, 195], color: "#99ccbb", description: "Antenna pair separation space" },
    { name: "UV Coverage Pattern", position: [205, 140, -175], color: "#bbddaa", description: "Spatial frequency sampling" },
    { name: "Phased Array Beam", position: [-220, 70, -185], color: "#88ccaa", description: "Electronic beam steering zone" },
    { name: "Aperture Synthesis Map", position: [185, -50, 210], color: "#ddaaaa", description: "Virtual telescope construction" },
    { name: "Radio Quiet Zone", position: [-175, 105, 180], color: "#aabbee", description: "RFI protected observation area" },
    { name: "Frequency Band Switch", position: [220, 85, -165], color: "#ccbb99", description: "Multi-band receiver selection" },
    { name: "Subreflector Surface", position: [-195, -95, -200], color: "#99ddcc", description: "Secondary reflection element" },
    { name: "Maser Calibration Source", position: [165, 130, 195], color: "#ddcc88", description: "Radio wavelength standard" },
    { name: "Pointing Model Grid", position: [-210, 55, 175], color: "#88bbdd", description: "Telescope position correction" },
    { name: "System Temperature Monitor", position: [195, -65, -190], color: "#bbaacc", description: "Noise sensitivity measurement" },
    { name: "Bandpass Calibration Zone", position: [-170, 115, -175], color: "#aaccbb", description: "Spectral response correction" },
    { name: "Delay Tracking Center", position: [225, 75, 180], color: "#ddbbcc", description: "Geometric path compensation" },
    { name: "Fringe Stopping Node", position: [-185, -80, 205], color: "#99aadd", description: "Earth rotation correction" },
    { name: "Self-Calibration Loop", position: [180, 145, -185], color: "#ccddaa", description: "Iterative phase correction" },
    { name: "Dirty Beam Pattern", position: [-225, 95, 165], color: "#aaddaa", description: "Incomplete UV response" },
    { name: "CLEAN Deconvolution Zone", position: [200, -55, 200], color: "#88ddbb", description: "Image restoration process" },
    { name: "Sidelobe Suppression Field", position: [-160, 135, -195], color: "#ddaacc", description: "Antenna pattern control" },
    { name: "Holography Scan Path", position: [215, 65, -170], color: "#bbccdd", description: "Surface accuracy measurement" },
    { name: "Continuum Imaging Mode", position: [-190, -70, 185], color: "#aabbcc", description: "Broadband radio mapping" },
    { name: "Spectral Line Window", position: [170, 120, 195], color: "#ccaaaa", description: "Narrow band emission focus" },
    { name: "Polarization Leakage Correction", position: [-205, 85, -180], color: "#99ccdd", description: "Cross-hand calibration" },
    { name: "Lagrange Point Station", position: [230, -60, -185], color: "#88ddee", description: "Gravitational equilibrium orbit" },
    { name: "Sunshield Thermal Barrier", position: [-175, 100, 200], color: "#ddcc99", description: "Multi-layer heat protection" },
    { name: "Reaction Wheel Assembly", position: [190, 135, -170], color: "#aabbdd", description: "Attitude control momentum" },
    { name: "Star Tracker Camera", position: [-215, -75, 180], color: "#99ccaa", description: "Orientation determination sensor" },
    { name: "Solar Array Wing", position: [205, 70, 195], color: "#ffdd77", description: "Photovoltaic power source" },
    { name: "High Gain Antenna Dish", position: [-180, 120, -190], color: "#bbddcc", description: "Deep space communication link" },
    { name: "Thruster Cluster Node", position: [170, -90, -205], color: "#ccaa88", description: "Propulsion module array" },
    { name: "Momentum Dump Maneuver", position: [-200, 55, 175], color: "#aaddee", description: "Wheel desaturation event" },
    { name: "Safe Mode Configuration", position: [225, 85, -160], color: "#ddbbaa", description: "Emergency spacecraft state" },
    { name: "Gyroscope Drift Measurement", position: [-165, -85, 210], color: "#88aacc", description: "Rotational rate sensor" },
    { name: "Thermal Control Heater", position: [185, 145, 180], color: "#ffaa66", description: "Component temperature regulation" },
    { name: "Radiator Panel Surface", position: [-225, 95, -175], color: "#99dddd", description: "Excess heat rejection" },
    { name: "Command Upload Window", position: [200, -55, 190], color: "#ccddbb", description: "Ground station contact period" },
    { name: "Telemetry Downlink Stream", position: [-175, 110, 165], color: "#aaccee", description: "Science data transmission" },
    { name: "Onboard Computer Core", position: [215, 65, -195], color: "#bbaadd", description: "Flight software processor" },
    { name: "Solid State Recorder", position: [-190, -70, -185], color: "#ddaa99", description: "Mass memory storage" },
    { name: "Aperture Door Mechanism", position: [175, 130, 200], color: "#88ccbb", description: "Instrument cover actuator" },
    { name: "Fine Guidance Sensor", position: [-210, 80, 185], color: "#aadd88", description: "Precise pointing detector" },
    { name: "Slew Rate Limit Zone", position: [195, -100, -175], color: "#ccbbcc", description: "Maximum rotation speed boundary" },
    { name: "Orbit Maintenance Burn", position: [-170, 140, -200], color: "#99aabb", description: "Station keeping maneuver" },
    { name: "Decontamination Bakeout", position: [220, 75, 175], color: "#ddccaa", description: "Outgassing removal procedure" },
    { name: "Focus Adjustment Mechanism", position: [-195, -60, 195], color: "#88bbcc", description: "Secondary mirror positioning" },
    { name: "Calibration Target Wheel", position: [165, 115, -185], color: "#aabbaa", description: "Internal reference source" },
    { name: "Cosmic Ray Hit Map", position: [-220, 105, 170], color: "#ddddcc", description: "Particle damage tracking" },
    { name: "End of Life Disposal Orbit", position: [205, -45, 205], color: "#bbccaa", description: "Graveyard trajectory path" },
    { name: "Data Reduction Pipeline", position: [-185, 75, -205], color: "#aaddbb", description: "Raw to calibrated processing" },
    { name: "Bias Frame Subtraction", position: [210, -80, 180], color: "#99bbcc", description: "Electronic offset removal" },
    { name: "Flat Field Division Zone", position: [-220, 130, 165], color: "#ddcc88", description: "Pixel sensitivity correction" },
    { name: "Dark Current Map", position: [175, 95, -190], color: "#88aadd", description: "Thermal noise characterization" },
    { name: "Cosmic Ray Rejection", position: [-165, -65, 200], color: "#ccaaee", description: "Particle hit removal algorithm" },
    { name: "Sky Background Model", position: [225, 60, 185], color: "#aaccdd", description: "Atmospheric emission template" },
    { name: "Point Spread Function", position: [-200, 115, -175], color: "#bbddaa", description: "Image quality characterization" },
    { name: "Astrometric Solution Grid", position: [185, -95, -200], color: "#ddaabb", description: "World coordinate mapping" },
    { name: "Photometric Calibration", position: [-175, 85, 195], color: "#88ddcc", description: "Flux standard transformation" },
    { name: "Source Extraction Catalog", position: [200, 140, -165], color: "#ccbb99", description: "Object detection list" },
    { name: "Aperture Photometry Ring", position: [-215, -50, 175], color: "#aabbee", description: "Fixed radius flux measurement" },
    { name: "PSF Fitting Model", position: [165, 70, 205], color: "#ddddaa", description: "Profile-matched photometry" },
    { name: "Image Stacking Zone", position: [-180, 125, -185], color: "#99ccbb", description: "Multi-exposure combination" },
    { name: "Drizzle Algorithm Core", position: [220, -55, 175], color: "#bbaadd", description: "Sub-pixel image reconstruction" },
    { name: "Mosaic Tile Boundary", position: [-195, 65, 190], color: "#ddcc77", description: "Multi-chip image join" },
    { name: "Quality Assurance Flag", position: [180, 105, -195], color: "#88bbaa", description: "Data validity marker" },
    { name: "Archive Ingestion Point", position: [-225, -85, -170], color: "#aaddcc", description: "Database storage entry" },
    { name: "Virtual Observatory Portal", position: [195, 135, 180], color: "#ccddbb", description: "Multi-archive query interface" },
    { name: "Crossmatch Radius Zone", position: [-160, 95, 170], color: "#99aabb", description: "Multi-catalog association" },
    { name: "Limiting Magnitude Depth", position: [215, -70, -185], color: "#ddbbcc", description: "Detection threshold boundary" },
    { name: "Completeness Function", position: [-190, 140, -200], color: "#aaccaa", description: "Survey sensitivity curve" },
    { name: "False Positive Rejection", position: [170, 55, 195], color: "#bbccdd", description: "Artifact filtering zone" },
    { name: "Machine Learning Classifier", position: [-205, -75, 185], color: "#88ccdd", description: "Automated source typing" },
    { name: "Principal Component Space", position: [225, 90, -170], color: "#ddaa88", description: "Dimensionality reduction" },
    { name: "Outlier Detection Boundary", position: [-170, 110, 175], color: "#99ddaa", description: "Anomaly identification zone" },
    { name: "All-Sky Survey Grid", position: [180, -90, -210], color: "#88ddaa", description: "Complete hemisphere coverage" },
    { name: "Deep Field Pointing", position: [-210, 105, 170], color: "#ddbb99", description: "Ultra-deep exposure target" },
    { name: "Transient Alert Stream", position: [195, 75, 195], color: "#ffaa77", description: "Real-time event notification" },
    { name: "Citizen Classifier Hub", position: [-175, -60, -195], color: "#aaccee", description: "Crowdsourced morphology sorting" },
    { name: "Galaxy Zoo Portal", position: [220, 130, -175], color: "#99ddcc", description: "Public galaxy classification" },
    { name: "Planet Hunters Station", position: [-195, 85, 185], color: "#bbaadd", description: "Transit curve inspection" },
    { name: "Supernova Search Grid", position: [165, -75, 200], color: "#ddcc88", description: "Difference imaging patrol" },
    { name: "Variable Star Network", position: [-225, 140, -165], color: "#88bbcc", description: "Amateur observer coordination" },
    { name: "Asteroid Tracklet Zone", position: [205, 55, -190], color: "#ccddaa", description: "Near-Earth object linkage" },
    { name: "Meteor Shower Watch", position: [-160, -85, 175], color: "#aaddbb", description: "Fireball reporting network" },
    { name: "Comet Discovery Field", position: [185, 115, 180], color: "#ddaacc", description: "Amateur patrol territory" },
    { name: "Occultation Timing Path", position: [-205, 65, -200], color: "#99ccdd", description: "Stellar cover event track" },
    { name: "Double Star Measurement", position: [225, -50, 170], color: "#bbccaa", description: "Position angle recording" },
    { name: "Spectroscopy Campaign", position: [-180, 125, 190], color: "#88aaee", description: "Follow-up observation drive" },
    { name: "Photometry Database", position: [170, 95, -185], color: "#ddbb88", description: "Light curve repository" },
    { name: "Astrometry Solution Bank", position: [-215, -70, -175], color: "#aabbcc", description: "Position measurement archive" },
    { name: "Redshift Survey Volume", position: [200, 140, 175], color: "#ccaa99", description: "Distance mapping campaign" },
    { name: "Peculiar Velocity Field", position: [-170, 75, 195], color: "#99ddbb", description: "Galaxy motion mapping" },
    { name: "Weak Lensing Shear Map", position: [215, -65, -195], color: "#ddccaa", description: "Dark matter trace imaging" },
    { name: "Cluster Finding Algorithm", position: [-190, 110, 165], color: "#88ccaa", description: "Galaxy overdensity detection" },
    { name: "Void Catalog Region", position: [175, 85, 205], color: "#aadddd", description: "Underdensity identification" },
    { name: "Filament Tracing Network", position: [-225, -55, -185], color: "#bbddcc", description: "Cosmic web mapping" },
    { name: "Baryon Acoustic Feature", position: [195, 130, -170], color: "#ccbbdd", description: "Standard ruler measurement" },
    { name: "Power Spectrum Analysis", position: [-165, 95, 180], color: "#99aabb", description: "Clustering amplitude space" },
    { name: "Correlation Function Zone", position: [210, -80, 190], color: "#ddaaaa", description: "Galaxy pair statistics" },
    { name: "Hydrogen Burning Core", position: [-185, 80, -200], color: "#ffdd88", description: "Proton-proton chain zone" },
    { name: "CNO Cycle Region", position: [210, -65, 175], color: "#ffcc66", description: "Carbon catalyzed fusion" },
    { name: "Helium Flash Point", position: [-220, 135, 185], color: "#ffaa55", description: "Triple-alpha ignition" },
    { name: "Carbon Burning Shell", position: [175, 100, -185], color: "#ff8844", description: "Carbon-12 fusion zone" },
    { name: "Neon Burning Layer", position: [-165, -55, 195], color: "#ff7733", description: "Photodisintegration region" },
    { name: "Oxygen Burning Front", position: [225, 70, 180], color: "#ff6622", description: "Oxygen-16 fusion shell" },
    { name: "Silicon Burning Core", position: [-200, 120, -175], color: "#ff5511", description: "Final fusion stage" },
    { name: "Iron Core Boundary", position: [185, -90, -195], color: "#ddaa88", description: "Collapse threshold zone" },
    { name: "Neutrino Cooling Sink", position: [-175, 65, 170], color: "#aaddff", description: "Energy loss channel" },
    { name: "Convective Envelope", position: [195, 140, -165], color: "#ffbb77", description: "Mixing zone boundary" },
    { name: "Radiative Transport Zone", position: [-215, -80, 200], color: "#ffcc99", description: "Photon diffusion region" },
    { name: "Stellar Opacity Peak", position: [165, 85, 195], color: "#ddbb66", description: "Iron bump absorption" },
    { name: "Mixing Length Scale", position: [-180, 110, -190], color: "#ccaa55", description: "Convection cell size" },
    { name: "Overshoot Boundary", position: [220, -50, 170], color: "#bbdd88", description: "Mixing penetration depth" },
    { name: "Semiconvection Zone", position: [-195, 90, 185], color: "#aaccaa", description: "Partial mixing region" },
    { name: "Thermohaline Gradient", position: [180, 125, -180], color: "#99bbcc", description: "Salt finger instability" },
    { name: "Rotational Mixing", position: [-225, -70, -170], color: "#88aadd", description: "Shear-driven transport" },
    { name: "Meridional Circulation", position: [200, 55, 185], color: "#77aaee", description: "Global stellar flow" },
    { name: "Magnetic Braking Zone", position: [-160, 130, 175], color: "#6699ff", description: "Angular momentum loss" },
    { name: "Tidal Synchronization", position: [215, -75, -190], color: "#aabbff", description: "Binary spin-orbit lock" },
    { name: "Mass Loss Wind", position: [-190, 75, -200], color: "#ccddff", description: "Stellar wind outflow" },
    { name: "Pulsation Driving Zone", position: [170, 105, 175], color: "#ddccaa", description: "Kappa mechanism region" },
    { name: "Instability Strip Boundary", position: [-205, -85, 190], color: "#eedd88", description: "Variable star domain" },
    { name: "Period-Luminosity Track", position: [225, 145, -170], color: "#ffee99", description: "Cepheid calibration line" },
    { name: "Blue Loop Evolution", position: [-170, 95, 165], color: "#88ccff", description: "Helium burning excursion" },










];

// GPT-5.4 — expose live cosmic-sight stats for Challenge UI
window.__universeCosmicSightsCount = cosmicSights.length;
window.__universeCosmicSightNames = cosmicSights.map((sight) => sight.name);
window.__universeCosmicSightsData = cosmicSights;

// ---- Cosmic Sight Tracker (Opus 4.7) ----
// Marks each cosmic sight as discovered when the camera comes within proximity.
// Pairs with DeepSeek's Cosmic Sightseer challenge and Gemini's Achievements panel.
const cosmicSightTracker = createCosmicSightTracker({ camera, sights: cosmicSights, audio: universeAudio });
customLandmarkAnimators.push((elapsed, delta /* , time */) => cosmicSightTracker.update(delta, elapsed));
window.__cosmicSightTracker = cosmicSightTracker;

// ---- Cosmic Sights Atlas Panel (Opus 4.7) — press C to toggle ----
const cosmicSightsAtlas = createCosmicSightsAtlas({
    camera,
    controls: typeof controls !== 'undefined' ? controls : null,
    sights: cosmicSights,
    audio: universeAudio,
});
window.__cosmicSightsAtlas = cosmicSightsAtlas;

// ---- Cosmic Sight 3D Markers (Opus 4.7) — visible diamonds at every sight position ----
const cosmicSightMarkers = createCosmicSightMarkers({ THREE, scene, sights: cosmicSights });
customLandmarkAnimators.push((elapsed, delta /* , time */) => cosmicSightMarkers.update(delta, elapsed));
window.__cosmicSightMarkers = cosmicSightMarkers;

// ---- Cosmic Sight Category Mini-HUD (Opus 4.7) ----
const cosmicSightCategoryHud = createCosmicSightCategoryHud({ sights: cosmicSights });
window.__cosmicSightCategoryHud = cosmicSightCategoryHud;

// ---- Cosmic Sight Compass (Opus 4.7) — N to toggle ----
const cosmicSightCompass = createCosmicSightCompass({ THREE, camera, sights: cosmicSights, audio: universeAudio });
customLandmarkAnimators.push((elapsed, delta /* , time */) => cosmicSightCompass.update());
window.__cosmicSightCompass = cosmicSightCompass;

// ---- Cosmic Sight Discovery Log (Opus 4.7) — L to toggle ----
const cosmicSightLog = createCosmicSightLog({ audio: universeAudio });
window.__cosmicSightLog = cosmicSightLog;




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
            // Bridge: directory Enter ↗ should record a visit + dispatch event
            // just like openFocusedWorld() does for the in-scene E key, so the
            // Achievements panel and Web Weaver session challenge advance.
            try { if (world.id) visitorTracker.recordVisit(world.id); } catch (_) {}
            try {
                if (universeAudio.playChime) universeAudio.playChime(world.id || 'plaza');
            } catch (_) {}
            try {
                UniverseEvents.recordLandmarkVisit(visitorTracker.getVisitorId(), world.id);
            } catch (_) {}
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
