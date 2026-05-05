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
import { createCosmicSightMilestones } from './cosmic-sight-milestones.js';
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
    { name: "Dome Slit Opening (II)", position: [170, -90, 185], color: "#ddddaa", description: "Observatory enclosure aperture" },
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
    { name: "Feed Horn Assembly (II)", position: [215, -75, 185], color: "#ddbb88", description: "Electromagnetic wave collector" },
    { name: "Low Noise Amplifier", position: [-200, 125, 170], color: "#aaddcc", description: "First stage signal boost" },
    { name: "Correlator Processing Core", position: [175, 60, -200], color: "#ccaadd", description: "Interferometric cross-correlation" },
    { name: "Baseline Vector Field", position: [-165, -85, 195], color: "#99ccbb", description: "Antenna pair separation space" },
    { name: "UV Coverage Pattern", position: [205, 140, -175], color: "#bbddaa", description: "Spatial frequency sampling" },
    { name: "Phased Array Beam", position: [-220, 70, -185], color: "#88ccaa", description: "Electronic beam steering zone" },
    { name: "Aperture Synthesis Map (II)", position: [185, -50, 210], color: "#ddaaaa", description: "Virtual telescope construction" },
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
    { name: "Dirty Beam Pattern (II)", position: [-225, 95, 165], color: "#aaddaa", description: "Incomplete UV response" },
    { name: "CLEAN Deconvolution Zone", position: [200, -55, 200], color: "#88ddbb", description: "Image restoration process" },
    { name: "Sidelobe Suppression Field", position: [-160, 135, -195], color: "#ddaacc", description: "Antenna pattern control" },
    { name: "Holography Scan Path", position: [215, 65, -170], color: "#bbccdd", description: "Surface accuracy measurement" },
    { name: "Continuum Imaging Mode", position: [-190, -70, 185], color: "#aabbcc", description: "Broadband radio mapping" },
    { name: "Spectral Line Window", position: [170, 120, 195], color: "#ccaaaa", description: "Narrow band emission focus" },
    { name: "Polarization Leakage Correction", position: [-205, 85, -180], color: "#99ccdd", description: "Cross-hand calibration" },
    { name: "Lagrange Point Station (II)", position: [230, -60, -185], color: "#88ddee", description: "Gravitational equilibrium orbit" },
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
    { name: "Dark Current Map (II)", position: [175, 95, -190], color: "#88aadd", description: "Thermal noise characterization" },
    { name: "Cosmic Ray Rejection", position: [-165, -65, 200], color: "#ccaaee", description: "Particle hit removal algorithm" },
    { name: "Sky Background Model", position: [225, 60, 185], color: "#aaccdd", description: "Atmospheric emission template" },
    { name: "Point Spread Function (II)", position: [-200, 115, -175], color: "#bbddaa", description: "Image quality characterization" },
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
    { name: "Machine Learning Classifier (II)", position: [-205, -75, 185], color: "#88ccdd", description: "Automated source typing" },
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
    { name: "Peculiar Velocity Field (III)", position: [-170, 75, 195], color: "#99ddbb", description: "Galaxy motion mapping" },
    { name: "Weak Lensing Shear Map", position: [215, -65, -195], color: "#ddccaa", description: "Dark matter trace imaging" },
    { name: "Cluster Finding Algorithm", position: [-190, 110, 165], color: "#88ccaa", description: "Galaxy overdensity detection" },
    { name: "Void Catalog Region", position: [175, 85, 205], color: "#aadddd", description: "Underdensity identification" },
    { name: "Filament Tracing Network", position: [-225, -55, -185], color: "#bbddcc", description: "Cosmic web mapping" },
    { name: "Baryon Acoustic Feature", position: [195, 130, -170], color: "#ccbbdd", description: "Standard ruler measurement" },
    { name: "Power Spectrum Analysis", position: [-165, 95, 180], color: "#99aabb", description: "Clustering amplitude space" },
    { name: "Correlation Function Zone", position: [210, -80, 190], color: "#ddaaaa", description: "Galaxy pair statistics" },
    { name: "Hydrogen Burning Core", position: [-185, 80, -200], color: "#ffdd88", description: "Proton-proton chain zone" },
    { name: "CNO Cycle Region (II)", position: [210, -65, 175], color: "#ffcc66", description: "Carbon catalyzed fusion" },
    { name: "Helium Flash Point", position: [-220, 135, 185], color: "#ffaa55", description: "Triple-alpha ignition" },
    { name: "Carbon Burning Shell (II)", position: [175, 100, -185], color: "#ff8844", description: "Carbon-12 fusion zone" },
    { name: "Neon Burning Layer (II)", position: [-165, -55, 195], color: "#ff7733", description: "Photodisintegration region" },
    { name: "Oxygen Burning Front", position: [225, 70, 180], color: "#ff6622", description: "Oxygen-16 fusion shell" },
    { name: "Silicon Burning Core (II)", position: [-200, 120, -175], color: "#ff5511", description: "Final fusion stage" },
    { name: "Iron Core Boundary", position: [185, -90, -195], color: "#ddaa88", description: "Collapse threshold zone" },
    { name: "Neutrino Cooling Sink", position: [-175, 65, 170], color: "#aaddff", description: "Energy loss channel" },
    { name: "Convective Envelope (II)", position: [195, 140, -165], color: "#ffbb77", description: "Mixing zone boundary" },
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
    { name: "Transmission Spectrum Zone", position: [180, -85, -205], color: "#88ccdd", description: "Atmospheric absorption during transit" },
    { name: "Emission Spectrum Peak", position: [-215, 110, 170], color: "#ffbb88", description: "Thermal day-side radiation" },
    { name: "Phase Curve Map", position: [195, 75, 185], color: "#ddaa77", description: "Brightness vs orbital position" },
    { name: "Hot Spot Offset", position: [-170, -60, -190], color: "#ff9966", description: "Superrotation signature" },
    { name: "Terminator Profile", position: [225, 130, -175], color: "#aaddcc", description: "Day-night boundary atmosphere" },
    { name: "Cloud Deck Layer (II)", position: [-190, 85, 195], color: "#bbddee", description: "Condensate opacity region" },
    { name: "Haze Formation Zone", position: [165, -50, 200], color: "#ccbbdd", description: "Photochemical particle layer" },
    { name: "Temperature Inversion", position: [-225, 140, -165], color: "#ff8855", description: "Stratospheric heating layer" },
    { name: "Chemical Equilibrium Point", position: [205, 60, -190], color: "#99ccaa", description: "Thermochemical balance zone" },
    { name: "Disequilibrium Tracer", position: [-160, -85, 180], color: "#aabbdd", description: "Vertical mixing signature" },
    { name: "Water Feature Band", position: [185, 115, 175], color: "#6699ff", description: "H2O molecular absorption" },
    { name: "Methane Detection Zone", position: [-205, 70, -200], color: "#88dd88", description: "CH4 spectral signature" },
    { name: "Carbon Dioxide Peak", position: [225, -70, 170], color: "#ddcc99", description: "CO2 absorption feature" },
    { name: "Alkali Metal Lines", position: [-175, 125, 190], color: "#ffaa99", description: "Sodium potassium wings" },
    { name: "Rayleigh Scattering Slope", position: [170, 90, -185], color: "#88aaff", description: "Blue wavelength opacity" },
    { name: "Mie Scattering Region", position: [-215, -55, -175], color: "#bbccdd", description: "Large particle scattering" },
    { name: "Scale Height Measurement", position: [200, 145, 180], color: "#aaddbb", description: "Atmospheric thickness tracer" },
    { name: "Mean Molecular Weight", position: [-180, 95, 165], color: "#ccaa88", description: "Atmosphere composition proxy" },
    { name: "Escape Parameter Zone", position: [215, -80, -195], color: "#dd9988", description: "Atmospheric loss boundary" },
    { name: "Jeans Escape Flux", position: [-195, 130, -190], color: "#ee8877", description: "Thermal escape rate" },
    { name: "Hydrodynamic Outflow", position: [175, 55, 195], color: "#ff7766", description: "Bulk atmospheric loss" },
    { name: "Magnetic Field Interaction", position: [-225, -70, 185], color: "#7799ff", description: "Magnetosphere-atmosphere coupling" },
    { name: "Ionosphere Layer", position: [190, 105, -170], color: "#99aaff", description: "Upper atmosphere ionization" },
    { name: "Thermosphere Boundary", position: [-165, 75, 175], color: "#ff9999", description: "High altitude heating zone" },
    { name: "Exosphere Interface", position: [210, 135, 185], color: "#ddbbaa", description: "Collisionless transition region" },
    { name: "Neutron Star Crust (II)", position: [-185, 90, -195], color: "#99ddff", description: "Crystalline nuclear lattice" },
    { name: "Neutron Superfluid Core", position: [210, -55, 180], color: "#77ccff", description: "Paired neutron condensate" },
    { name: "Magnetar Field Line", position: [-220, 135, 170], color: "#ff55ff", description: "Extreme magnetic topology" },
    { name: "Soft Gamma Repeater (II)", position: [175, 80, -185], color: "#ff4488", description: "Magnetar burst source" },
    { name: "Giant Flare Region", position: [-160, -65, 200], color: "#ff3377", description: "Catastrophic field reconnection" },
    { name: "Pulsar Wind Zone", position: [225, 115, 175], color: "#88ddee", description: "Relativistic particle outflow" },
    { name: "Termination Shock Front", position: [-195, 75, -175], color: "#aaccff", description: "Wind deceleration boundary" },
    { name: "Bow Shock Interface", position: [185, -90, -200], color: "#bbddff", description: "ISM interaction zone" },
    { name: "Light Cylinder Surface", position: [-175, 120, 185], color: "#99aaff", description: "Corotation limit boundary" },
    { name: "Radio Beam Cone", position: [200, 60, 195], color: "#77ff99", description: "Coherent emission zone" },
    { name: "Gamma Ray Emission Gap", position: [-215, -50, -180], color: "#ff99ff", description: "High altitude radiation" },
    { name: "X-Ray Hot Spot", position: [165, 140, -170], color: "#ff6666", description: "Surface magnetic pole" },
    { name: "Glitch Recovery Curve", position: [-180, 95, 175], color: "#aaddcc", description: "Spin-up relaxation" },
    { name: "Timing Noise Region", position: [220, -75, 185], color: "#ccbbaa", description: "Rotational irregularity" },
    { name: "Pulse Profile Shape", position: [-200, 130, -190], color: "#88ccaa", description: "Beam geometry signature" },
    { name: "Interstellar Scintillation", position: [180, 55, -180], color: "#aabbff", description: "ISM turbulence modulation" },
    { name: "Dispersion Measure Path (II)", position: [-225, -85, 195], color: "#99ccdd", description: "Electron column density" },
    { name: "Faraday Rotation Track", position: [195, 105, 170], color: "#bb99ff", description: "Magnetic field integral" },
    { name: "Scattering Broadening", position: [-165, 70, -175], color: "#ccddee", description: "Pulse temporal smearing" },
    { name: "Binary Pulsar Orbit", position: [210, 135, -185], color: "#ffdd88", description: "Relativistic timing test" },
    { name: "Post-Keplerian Parameter", position: [-190, -60, 180], color: "#ddcc77", description: "GR orbital correction" },
    { name: "Shapiro Delay Zone", position: [175, 75, 195], color: "#ccbb66", description: "Time dilation measurement" },
    { name: "Orbital Decay Track (II)", position: [-210, 110, -165], color: "#aabb88", description: "GW energy loss signature" },
    { name: "Recycled Pulsar System", position: [225, -65, -195], color: "#88aacc", description: "Spin-up accretion product" },
    { name: "Millisecond Pulsar Core", position: [-175, 85, 190], color: "#99ffcc", description: "Rapid rotation equilibrium" },
    { name: "Event Horizon Surface", position: [180, -80, -210], color: "#333355", description: "Point of no return boundary" },
    { name: "Photon Sphere Orbit", position: [-215, 100, 175], color: "#666688", description: "Unstable light orbit radius" },
    { name: "Innermost Stable Orbit (II)", position: [195, 70, 190], color: "#888899", description: "ISCO accretion limit" },
    { name: "Ergosphere Region (II)", position: [-170, -55, -195], color: "#444466", description: "Frame dragging zone" },
    { name: "Kerr Metric Space", position: [225, 125, -175], color: "#555577", description: "Rotating black hole geometry" },
    { name: "Penrose Process Zone", position: [-195, 85, 180], color: "#666699", description: "Energy extraction region" },
    { name: "Blandford-Znajek Jet", position: [165, -45, 200], color: "#7788aa", description: "Magnetic energy extraction" },
    { name: "Accretion Disk Plane", position: [-225, 140, -165], color: "#ffcc88", description: "Infalling matter orbit" },
    { name: "Thin Disk Surface", position: [205, 55, -190], color: "#ffdd99", description: "Geometrically thin flow" },
    { name: "ADAF Flow Region", position: [-160, -90, 185], color: "#dd9966", description: "Radiatively inefficient zone" },
    { name: "Corona Hot Region", position: [185, 110, 175], color: "#ffaa77", description: "High temperature electrons" },
    { name: "Reflection Feature", position: [-205, 65, -200], color: "#88bbdd", description: "Disk X-ray reprocessing" },
    { name: "Iron Line Profile (II)", position: [220, -70, 170], color: "#aaccee", description: "Relativistic line broadening" },
    { name: "Disk Wind Outflow", position: [-180, 130, 195], color: "#99ddcc", description: "Accretion driven wind" },
    { name: "Tidal Disruption Flare (IV)", position: [170, 85, -180], color: "#ff8866", description: "Star destruction event" },
    { name: "QPO Oscillation Zone", position: [-210, -75, -175], color: "#ddbb99", description: "Quasi-periodic signal" },
    { name: "State Transition Point", position: [200, 140, 180], color: "#aabbcc", description: "Spectral state change" },
    { name: "Jet Launching Region", position: [-175, 95, 165], color: "#77aadd", description: "Relativistic outflow base" },
    { name: "Jet Collimation Zone", position: [215, -60, -195], color: "#6699cc", description: "Magnetic focusing region" },
    { name: "Superluminal Knot", position: [-190, 120, -190], color: "#5588bb", description: "Apparent faster than light" },
    { name: "Hotspot Orbit Track", position: [175, 50, 195], color: "#ff9955", description: "Near-horizon flare motion" },
    { name: "Shadow Image Zone", position: [-225, -65, 185], color: "#222244", description: "EHT dark silhouette" },
    { name: "Photon Ring Structure", position: [190, 100, -170], color: "#ffeecc", description: "Lensed emission ring" },
    { name: "Mass Measurement Track", position: [-165, 75, 175], color: "#ccddaa", description: "Dynamical mass method" },
    { name: "Spin Parameter Zone", position: [210, 130, 185], color: "#bbccdd", description: "Kerr spin determination" },
    { name: "Quasar Central Engine", position: [-185, 80, -200], color: "#ffdd66", description: "Supermassive black hole core" },
    { name: "Broad Line Region (II)", position: [210, -50, 175], color: "#ddcc88", description: "Fast moving gas clouds" },
    { name: "Narrow Line Region (II)", position: [-220, 140, 185], color: "#bbaa99", description: "Extended ionized zone" },
    { name: "Dusty Torus Structure", position: [175, 90, -185], color: "#aa8866", description: "Obscuring ring geometry" },
    { name: "Type 1 Viewing Angle", position: [-165, -60, 195], color: "#ffcc77", description: "Face-on broad line view" },
    { name: "Type 2 Sight Line", position: [225, 65, 180], color: "#997755", description: "Edge-on obscured view" },
    { name: "Seyfert Nucleus Zone", position: [-200, 115, -175], color: "#ddbb77", description: "Low luminosity AGN core" },
    { name: "Radio Quiet Core", position: [185, -85, -200], color: "#ccaa88", description: "Jet suppressed nucleus" },
    { name: "Radio Loud Jet System", position: [-175, 75, 170], color: "#6699dd", description: "Powerful jet emission" },
    { name: "Blazar Beam Axis", position: [195, 135, -165], color: "#ff9966", description: "Jet pointed at observer" },
    { name: "BL Lac Continuum", position: [-215, -45, 200], color: "#ffaa88", description: "Featureless nonthermal" },
    { name: "FSRQ Emission Lines", position: [165, 55, 195], color: "#eebb99", description: "Flat spectrum radio quasar" },
    { name: "Doppler Boosted Zone", position: [-180, 125, -190], color: "#ff8855", description: "Relativistic beaming effect" },
    { name: "Superluminal Jet Knot", position: [220, -70, 170], color: "#77aaee", description: "Apparent FTL motion" },
    { name: "FR-I Morphology", position: [-195, 95, 185], color: "#5588cc", description: "Edge darkened lobes" },
    { name: "FR-II Hot Spot", position: [180, 110, -180], color: "#88bbff", description: "Edge brightened terminus" },
    { name: "Double Lobe Structure", position: [-225, -80, -170], color: "#6699cc", description: "Giant radio galaxy" },
    { name: "Cocoon Cavity Zone", position: [205, 145, 175], color: "#7788aa", description: "Jet inflated bubble" },
    { name: "AGN Feedback Region", position: [-160, 70, 165], color: "#8899bb", description: "Energy injection zone" },
    { name: "Reverberation Map", position: [215, -55, -195], color: "#ffdd99", description: "BLR size measurement" },
    { name: "Virial Mass Estimate", position: [-190, 130, -185], color: "#ddcc66", description: "Black hole mass method" },
    { name: "M-Sigma Relation", position: [170, 45, 190], color: "#ccbb55", description: "Bulge velocity correlation" },
    { name: "AGN Luminosity Function", position: [-210, -90, 195], color: "#bbaa77", description: "Space density evolution" },
    { name: "Quasar Absorption System", position: [195, 100, -170], color: "#aaddcc", description: "Foreground gas detection" },
    { name: "Lyman Alpha Forest (III)", position: [-175, 85, 175], color: "#88ccbb", description: "Intergalactic hydrogen" },
    { name: "Gravitational Wave Strain (II)", position: [180, -75, -205], color: "#aabbff", description: "Spacetime ripple amplitude" },
    { name: "Chirp Mass Signal", position: [-215, 105, 170], color: "#99aaee", description: "Binary merger frequency rise" },
    { name: "Inspiral Phase Track", position: [195, 65, 185], color: "#88bbdd", description: "Orbital decay trajectory" },
    { name: "Merger Ringdown (II)", position: [-170, -60, -190], color: "#7799cc", description: "Final black hole vibration" },
    { name: "LIGO Detector Arm", position: [225, 120, -175], color: "#6688bb", description: "Interferometer baseline" },
    { name: "Virgo Sensitivity Curve", position: [-195, 90, 195], color: "#5577aa", description: "Frequency response range" },
    { name: "KAGRA Underground Site (II)", position: [165, -40, 200], color: "#446699", description: "Cryogenic detector" },
    { name: "LISA Constellation (II)", position: [-225, 145, -165], color: "#8899dd", description: "Space-based triangle" },
    { name: "Pulsar Timing Array (II)", position: [205, 50, -190], color: "#99aacc", description: "Nanohertz sensitivity" },
    { name: "Stochastic Background (II)", position: [-160, -95, 180], color: "#aabbcc", description: "Cosmic GW hum" },
    { name: "Binary Neutron Star Merger (III)", position: [185, 105, 175], color: "#ff8866", description: "Kilonova progenitor" },
    { name: "Kilonova Light Curve", position: [-205, 60, -200], color: "#ffaa77", description: "R-process glow" },
    { name: "Short GRB Jet", position: [220, -65, 170], color: "#ffcc88", description: "Neutron star merger burst" },
    { name: "Electromagnetic Counterpart (II)", position: [-180, 135, 190], color: "#ddbb99", description: "Multi-messenger signal" },
    { name: "Host Galaxy Localization", position: [170, 80, -180], color: "#ccaa88", description: "Source sky position" },
    { name: "Standard Siren Distance", position: [-210, -50, -175], color: "#bbddaa", description: "GW Hubble measurement" },
    { name: "Mass Gap Region", position: [200, 140, 180], color: "#aaccbb", description: "BH NS boundary zone" },
    { name: "Spin Precession Signal", position: [-175, 100, 165], color: "#99bbcc", description: "Orbital plane wobble" },
    { name: "Eccentricity Signature", position: [215, -55, -195], color: "#88aadd", description: "Non-circular orbit trace" },
    { name: "Higher Mode Detection", position: [-190, 125, -185], color: "#77bbee", description: "Beyond quadrupole" },
    { name: "Memory Effect Zone", position: [175, 45, 195], color: "#aaddff", description: "Permanent spacetime shift" },
    { name: "Continuous Wave Source (II)", position: [-225, -75, 185], color: "#99ccee", description: "Spinning deformed NS" },
    { name: "Extreme Mass Ratio", position: [190, 95, -170], color: "#88bbdd", description: "EMRI signal pattern" },
    { name: "Supermassive Binary", position: [-165, 70, 175], color: "#77aacc", description: "Galaxy merger product" },
    { name: "GW Cosmology Field", position: [210, 130, 185], color: "#aaccdd", description: "Dark energy probe" },
    { name: "Habitable Zone Ring", position: [-180, 55, -195], color: "#88dd88", description: "Liquid water possible" },
    { name: "Biosignature Haze", position: [195, -65, 180], color: "#99ee99", description: "Atmospheric life hints" },
    { name: "Oxygen Spike Region", position: [-170, 80, 195], color: "#aaffaa", description: "Photosynthesis tracer" },
    { name: "Methane Plume Zone", position: [185, 105, -185], color: "#77cc77", description: "Biogenic or volcanic" },
    { name: "Phosphine Cloud", position: [-200, -50, 170], color: "#66bb66", description: "Controversial marker" },
    { name: "Carbon Cycle Hub", position: [175, 70, 200], color: "#88cc88", description: "Climate regulation" },
    { name: "Prebiotic Ocean", position: [-165, 95, -180], color: "#99dd99", description: "Origin of life site" },
    { name: "RNA World Remnant", position: [210, -85, 175], color: "#aaeebb", description: "Early replicator zone" },
    { name: "Hydrothermal Vent", position: [-185, 60, 185], color: "#77bb99", description: "Chemosynthetic oasis" },
    { name: "Panspermia Trail", position: [195, 115, -195], color: "#88ddaa", description: "Interplanetary seeding" },
    { name: "Extremophile Haven", position: [-175, -70, 165], color: "#99ccaa", description: "Life at the limits" },
    { name: "Tardigrade Zone", position: [180, 85, 190], color: "#aaddbb", description: "Ultimate survivors" },
    { name: "Radioresistance Field", position: [-210, 50, -175], color: "#77ccbb", description: "Radiation tolerance" },
    { name: "Psychrophile Realm", position: [165, -90, 180], color: "#66bbaa", description: "Cold-loving life" },
    { name: "Thermophile Core", position: [-190, 100, 195], color: "#88cc99", description: "Heat-loving organisms" },
    { name: "Acidophile Basin", position: [200, 65, -170], color: "#99dd88", description: "Low pH survivors" },
    { name: "Alkaliphile Lake", position: [-170, -55, 175], color: "#aaeea0", description: "High pH life" },
    { name: "Halophile Flat", position: [185, 90, 185], color: "#77dd77", description: "Salt-loving microbes" },
    { name: "Barophile Abyss", position: [-205, 75, -190], color: "#88ee88", description: "Pressure-loving life" },
    { name: "Europa Subsurface", position: [175, -80, 170], color: "#99ff99", description: "Ice moon ocean" },
    { name: "Enceladus Plume", position: [-180, 110, 180], color: "#aaffbb", description: "Organic-rich jets" },
    { name: "Titan Lake Shore", position: [190, 55, -185], color: "#77eeaa", description: "Hydrocarbon life?" },
    { name: "Mars Subsurface", position: [-165, -65, 190], color: "#88dd99", description: "Ancient water refuge" },
    { name: "Venus Cloud Layer", position: [205, 95, 175], color: "#99ccbb", description: "Temperate aerial zone" },
    { name: "TRAPPIST-1e Zone", position: [-195, 80, -170], color: "#aaddcc", description: "Earth-sized prospect" },
    { name: "JWST Deep Field (III)", position: [180, -75, -185], color: "#ffdd88", description: "Infrared universe" },
    { name: "Roman Survey Zone", position: [-195, 90, 175], color: "#eecc77", description: "Wide-field imaging" },
    { name: "ARIEL Transit", position: [170, 60, 190], color: "#ddbb66", description: "Exoplanet atmospheres" },
    { name: "LISA Pathfinder", position: [-180, -55, -170], color: "#ccaa55", description: "GW technology demo" },
    { name: "Einstein Telescope (III)", position: [205, 85, 180], color: "#bb9944", description: "Next-gen GW detector" },
    { name: "Cosmic Explorer (III)", position: [-165, 100, 195], color: "#aa8833", description: "40km arm detector" },
    { name: "ELT First Light", position: [190, -70, -175], color: "#ffcc99", description: "39m primary mirror" },
    { name: "TMT Dome", position: [-200, 65, 170], color: "#eebb88", description: "Thirty meter class" },
    { name: "GMT Array", position: [175, 95, 185], color: "#ddaa77", description: "Giant Magellan" },
    { name: "SKA Core", position: [-175, -80, -190], color: "#cc9966", description: "Square Kilometer Array" },
    { name: "ngVLA Site", position: [210, 50, 175], color: "#bb8855", description: "Next-gen VLA" },
    { name: "Athena X-ray", position: [-190, 110, 180], color: "#aa7744", description: "Hot universe probe" },
    { name: "Lynx Observatory", position: [165, 75, -170], color: "#ffddaa", description: "X-ray surveyor" },
    { name: "HabEx Zone", position: [-170, -60, 195], color: "#eeccbb", description: "Habitable exoplanet" },
    { name: "LUVOIR Station", position: [195, 90, 190], color: "#ddbbcc", description: "Large UV optical" },
    { name: "Origins Space", position: [-205, 55, -175], color: "#ccaadd", description: "Mid-IR flagship" },
    { name: "Starshade Field", position: [180, -85, 175], color: "#bb99ee", description: "External coronagraph" },
    { name: "SGL Focus", position: [-165, 95, 180], color: "#aa88ff", description: "Solar grav lens" },
    { name: "Interstellar Probe", position: [200, 70, -185], color: "#ffaacc", description: "Beyond heliosphere" },
    { name: "Breakthrough Listen", position: [-185, -70, 170], color: "#ee99bb", description: "SETI survey" },
    { name: "VERITAS Array", position: [170, 100, 195], color: "#dd88aa", description: "Gamma-ray Cherenkov" },
    { name: "CTA South", position: [-210, 60, -170], color: "#cc7799", description: "Cherenkov Telescope" },
    { name: "IceCube Gen2", position: [185, -75, 180], color: "#bb6688", description: "Neutrino observatory" },
    { name: "Hyper-K Cavern", position: [-175, 105, 185], color: "#aa5577", description: "Water Cherenkov" },
    { name: "DUNE Far Det", position: [205, 80, -175], color: "#ffbb99", description: "Deep underground" },
    { name: "Herschel Discovery", position: [-190, 75, -180], color: "#ddccaa", description: "Uranus 1781" },
    { name: "Neptune Prediction", position: [175, -65, 185], color: "#ccbb99", description: "Mathematical triumph" },
    { name: "Cepheid Ladder", position: [-170, 95, 175], color: "#bbaa88", description: "Leavitt period-luminosity" },
    { name: "Hubble Expansion", position: [200, 55, -170], color: "#aa9977", description: "Redshift discovery" },
    { name: "Penzias-Wilson Horn", position: [-185, -80, 190], color: "#998866", description: "CMB detection 1965" },
    { name: "Pulsar Bell", position: [165, 100, 180], color: "#887755", description: "LGM-1 signal" },
    { name: "Quasar Schmidt", position: [-210, 65, -175], color: "#ddbb88", description: "3C 273 redshift" },
    { name: "GW150914 Site", position: [190, -70, 195], color: "#ccaa77", description: "First GW detection" },
    { name: "Exoplanet Mayor", position: [-175, 90, 170], color: "#bb9966", description: "51 Pegasi b 1995" },
    { name: "SN1987A Point", position: [205, 80, -185], color: "#aa8855", description: "Nearby supernova" },
    { name: "Galileo Jupiter", position: [-165, -55, 180], color: "#997744", description: "Moons discovered" },
    { name: "Tycho Supernova", position: [180, 105, 175], color: "#886633", description: "1572 new star" },
    { name: "Kepler Laws", position: [-200, 70, -170], color: "#eedd99", description: "Orbital mechanics" },
    { name: "Newton Principia", position: [170, -85, 190], color: "#ddcc88", description: "Universal gravitation" },
    { name: "Einstein Eclipse", position: [-180, 100, 185], color: "#ccbb77", description: "Light bending 1919" },
    { name: "Vera Rubin Zone", position: [195, 60, -175], color: "#bbaa66", description: "Dark matter curves" },
    { name: "Chandrasekhar Limit", position: [-170, -75, 170], color: "#aa9955", description: "White dwarf mass" },
    { name: "Zwicky Dark Field", position: [210, 95, 180], color: "#998844", description: "Missing mass 1933" },
    { name: "Eddington Core", position: [-195, 55, -180], color: "#eebb77", description: "Stellar fusion" },
    { name: "Baade Window", position: [175, 85, 195], color: "#ddaa66", description: "Galactic center view" },
    { name: "Shapley Center", position: [-185, -60, 175], color: "#cc9955", description: "Sun not center" },
    { name: "Curtis Island", position: [200, 75, -170], color: "#bb8844", description: "Spiral nebulae debate" },
    { name: "Messier Catalog", position: [-165, 110, 185], color: "#aa7733", description: "Fuzzy objects list" },
    { name: "NGC Index", position: [185, -80, 180], color: "#eeddaa", description: "New General Catalogue" },
    { name: "Palomar Survey", position: [-210, 80, -175], color: "#ddccbb", description: "Sky photographic" },
    { name: "Solar p-Mode", position: [170, -65, -180], color: "#ffee88", description: "5-minute oscillation" },
    { name: "Stellar g-Mode", position: [-185, 95, 175], color: "#eedd77", description: "Gravity wave mode" },
    { name: "Mixed Mode Star", position: [195, 75, 190], color: "#ddcc66", description: "p and g coupling" },
    { name: "Red Giant Seismo", position: [-170, -80, -170], color: "#ccbb55", description: "Core rotation probe" },
    { name: "Delta Scuti Zone", position: [205, 55, 180], color: "#bbaa44", description: "A-F star pulsations" },
    { name: "Gamma Doradus", position: [-200, 100, 195], color: "#aa9933", description: "High-order g-modes" },
    { name: "RR Lyrae Strip", position: [175, -70, -175], color: "#ffeedd", description: "Horizontal branch" },
    { name: "Cepheid Beat", position: [-165, 85, 170], color: "#eeddcc", description: "Double-mode pulsator" },
    { name: "Mira Variable (II)", position: [190, 90, 185], color: "#ddccbb", description: "Long period AGB" },
    { name: "Beta Cephei", position: [-210, -55, -185], color: "#ccbbaa", description: "Massive star modes" },
    { name: "SPB Oscillator", position: [165, 65, 175], color: "#bbaabb", description: "Slowly pulsating B" },
    { name: "roAp Star", position: [-180, 105, 180], color: "#aabbcc", description: "Rapid Ap oscillator" },
    { name: "Solar-like Core", position: [200, -85, -170], color: "#99ccdd", description: "Stochastic excitation" },
    { name: "Kepler Asteroseismo", position: [-175, 70, 195], color: "#88ddee", description: "4-year precision" },
    { name: "TESS Seismo Field", position: [210, 95, 180], color: "#77eeff", description: "Bright star modes" },
    { name: "CoRoT Legacy", position: [-190, -60, -175], color: "#ffcc88", description: "First space seismo" },
    { name: "PLATO Zone", position: [175, 80, 170], color: "#eebbaa", description: "Future asteroseismo" },
    { name: "Echelle Pattern", position: [-165, 110, 185], color: "#ddaacc", description: "Large separation" },
    { name: "Small Separation", position: [195, -75, 195], color: "#cc99dd", description: "Age diagnostic" },
    { name: "Period Spacing", position: [-205, 55, -180], color: "#bb88ee", description: "g-mode sequence" },
    { name: "Rotational Split", position: [180, 100, 175], color: "#aa77ff", description: "Internal rotation" },
    { name: "Magnetic Split", position: [-170, -70, 170], color: "#ffddaa", description: "Zeeman in modes" },
    { name: "Glitch Zone", position: [205, 65, -175], color: "#eeccbb", description: "Acoustic depth probe" },
    { name: "Convection Zone", position: [-185, 90, 190], color: "#ddbbcc", description: "Turbulent boundary" },
    { name: "Radiative Core", position: [170, 85, 180], color: "#ccaadd", description: "Stable stratification" },
    { name: "Sunspot Umbra", position: [-195, 75, -185], color: "#dd6644", description: "Dark magnetic core" },
    { name: "Penumbral Filament (II)", position: [180, -60, 175], color: "#ee7755", description: "Radial field lines" },
    { name: "Solar Flare Site", position: [-170, 100, 190], color: "#ff8866", description: "Magnetic reconnection" },
    { name: "CME Launch", position: [205, 55, -170], color: "#ff9977", description: "Coronal mass ejection" },
    { name: "Prominence Loop", position: [-185, -85, 180], color: "#ffaa88", description: "Suspended plasma" },
    { name: "Coronal Hole (II)", position: [165, 90, 175], color: "#335566", description: "Fast wind source" },
    { name: "Active Region", position: [-210, 65, -175], color: "#cc5533", description: "Emerging flux" },
    { name: "Quiet Sun", position: [190, -70, 195], color: "#ffddaa", description: "Network cells" },
    { name: "Granulation Field", position: [-175, 95, 170], color: "#ffeecc", description: "Convective tops" },
    { name: "Supergranule", position: [200, 80, -180], color: "#ffeedd", description: "Large-scale flow" },
    { name: "Spicule Forest", position: [-165, -55, 185], color: "#ff7766", description: "Chromospheric jets" },
    { name: "Moreton Wave", position: [175, 105, 180], color: "#ff8877", description: "Flare shockwave" },
    { name: "EIT Wave", position: [-200, 70, -170], color: "#ff9988", description: "Coronal disturbance" },
    { name: "Solar Wind Origin", position: [210, -80, 190], color: "#aaddff", description: "Acceleration zone" },
    { name: "Heliospheric Sheet", position: [-180, 100, 175], color: "#99ccee", description: "Current boundary" },
    { name: "Bow Shock", position: [170, 60, -175], color: "#88bbdd", description: "Solar wind interface" },
    { name: "Magnetopause", position: [-190, -65, 180], color: "#77aacc", description: "Field boundary" },
    { name: "Radiation Belt", position: [195, 95, 185], color: "#6699bb", description: "Trapped particles" },
    { name: "Auroral Oval", position: [-170, 75, -180], color: "#88ff88", description: "Particle precipitation" },
    { name: "Substorm Onset", position: [205, -75, 175], color: "#77ee77", description: "Tail reconnection" },
    { name: "Ring Current", position: [-185, 110, 190], color: "#66dd66", description: "Storm-time drift" },
    { name: "Plasmasphere", position: [175, 55, -170], color: "#55cc55", description: "Cold plasma torus" },
    { name: "Solar Cycle Peak", position: [-165, -80, 175], color: "#ffcc44", description: "Maximum activity" },
    { name: "Maunder Minimum", position: [200, 90, 180], color: "#ccaa33", description: "Grand minimum" },
    { name: "Carrington Event", position: [-210, 65, -185], color: "#ff4422", description: "1859 superflare" },
    { name: "Io Volcano Plume", position: [175, -65, -180], color: "#ffcc44", description: "Tidal heating" },
    { name: "Europa Ice Shell (II)", position: [-190, 95, 175], color: "#aaddff", description: "Subsurface ocean" },
    { name: "Ganymede Magnetosphere (II)", position: [200, 70, 190], color: "#88bbee", description: "Moon magnetic field" },
    { name: "Callisto Crater Basin (II)", position: [-170, -80, -175], color: "#998877", description: "Ancient surface" },
    { name: "Titan Methane Lake", position: [210, 55, 180], color: "#ddaa66", description: "Hydrocarbon seas" },
    { name: "Enceladus Tiger Stripe", position: [-185, 100, 195], color: "#ffffff", description: "Geyser source" },
    { name: "Mimas Death Star", position: [165, -75, -170], color: "#ccccbb", description: "Herschel crater" },
    { name: "Triton Retrograde", position: [-200, 85, 170], color: "#aabbcc", description: "Captured KBO" },
    { name: "Charon Fracture", position: [185, 105, 185], color: "#bbaa99", description: "Pluto tidal stress" },
    { name: "Miranda Chevron", position: [-165, -55, -180], color: "#aaaaaa", description: "Extreme terrain" },
    { name: "Phobos Groove", position: [195, 65, 175], color: "#887766", description: "Tidal decay" },
    { name: "Saturn A Ring", position: [-210, 90, 190], color: "#eeddcc", description: "Bright ice ring" },
    { name: "Cassini Division", position: [170, -70, -175], color: "#554433", description: "Gap resonance" },
    { name: "F Ring Braids", position: [-180, 110, 180], color: "#ddccbb", description: "Shepherd moons" },
    { name: "Uranus Epsilon Ring", position: [205, 55, 195], color: "#99aacc", description: "Dark narrow ring" },
    { name: "Neptune Adams Ring", position: [-175, -85, -170], color: "#7788aa", description: "Arc segments" },
    { name: "Jupiter Gossamer Ring", position: [190, 95, 175], color: "#ddbb99", description: "Dust from moons" },
    { name: "Rhea Ring System", position: [-195, 70, 185], color: "#bbccdd", description: "Moon debris ring" },
    { name: "Phoebe Ring", position: [175, -60, -185], color: "#443322", description: "Giant dark ring" },
    { name: "Haumea Ring", position: [-165, 100, 170], color: "#aabbcc", description: "Dwarf planet ring" },
    { name: "Chariklo Rings", position: [210, 80, 190], color: "#99aabb", description: "Centaur ring system" },
    { name: "Quaoar Ring", position: [-185, -55, -175], color: "#889999", description: "Beyond Roche limit" },
    { name: "Makemake Moon", position: [165, 105, 180], color: "#778888", description: "Distant KBO moon" },
    { name: "Eris Dysnomia", position: [-200, 75, 195], color: "#667777", description: "Scattered disc moon" },
    { name: "Sedna Orbit (II)", position: [195, -80, -170], color: "#cc6644", description: "Extreme TNO" },
    { name: "L Dwarf Haze", position: [-180, 65, -185], color: "#cc6644", description: "Dusty atmosphere" },
    { name: "T Dwarf Methane", position: [195, -75, 175], color: "#884422", description: "Blue methane bands" },
    { name: "Y Dwarf Cold", position: [-170, 100, 190], color: "#553311", description: "Room temperature star" },
    { name: "Brown Dwarf Binary", position: [205, 55, -170], color: "#995533", description: "Substellar pair" },
    { name: "Lithium Test Zone", position: [-195, -80, 180], color: "#aa6644", description: "Mass boundary" },
    { name: "Hydrogen Burning Edge", position: [165, 90, 175], color: "#bb7755", description: "0.075 solar mass" },
    { name: "Deuterium Burning", position: [-210, 70, -175], color: "#cc8866", description: "13 Jupiter masses" },
    { name: "Free-Floating Planet", position: [180, -65, 195], color: "#664422", description: "Rogue world" },
    { name: "Substellar Desert", position: [-165, 105, 170], color: "#775533", description: "Mass gap region" },
    { name: "Cloud Bands", position: [200, 75, -180], color: "#886644", description: "Weather patterns" },
    { name: "Iron Rain Zone", position: [-185, -55, 185], color: "#554433", description: "Hot atmosphere" },
    { name: "Silicate Cloud", position: [175, 95, 180], color: "#776655", description: "Mineral condensate" },
    { name: "Ammonia Ice Layer", position: [-200, 60, -170], color: "#8899aa", description: "Cold dwarf cloud" },
    { name: "Water Cloud Deck", position: [210, -70, 190], color: "#99aabb", description: "Late T dwarf" },
    { name: "Gliese 229B", position: [-170, 110, 175], color: "#774433", description: "First T dwarf" },
    { name: "WISE 0855", position: [185, 55, -175], color: "#443322", description: "Coldest known" },
    { name: "Luhman 16", position: [-195, -85, 180], color: "#885544", description: "Binary brown dwarf" },
    { name: "2MASS Survey Object", position: [170, 100, 185], color: "#996655", description: "Infrared discovery" },
    { name: "UKIDSS Detection", position: [-180, 65, -180], color: "#aa7766", description: "Deep K-band" },
    { name: "WISE Discovery", position: [205, -75, 175], color: "#bb8877", description: "Mid-IR survey" },
    { name: "Spectral Transition", position: [-165, 95, 190], color: "#cc9988", description: "M-L-T-Y sequence" },
    { name: "Rotational Variability", position: [195, 80, -170], color: "#ddaa99", description: "Cloud modulation" },
    { name: "Magnetic Activity", position: [-210, -60, 175], color: "#eebbaa", description: "Radio emission" },
    { name: "Aurorae Zone", position: [175, 105, 180], color: "#88ff88", description: "Substellar lights" },
    { name: "Planetary Mass Object", position: [-185, 70, -185], color: "#663322", description: "13 MJ boundary" },
    { name: "O Star Wind", position: [190, -65, -180], color: "#aaddff", description: "Million km/s outflow" },
    { name: "Wolf-Rayet Bubble (II)", position: [-175, 95, 175], color: "#99ccee", description: "Stripped giant" },
    { name: "LBV Eruption", position: [205, 70, 190], color: "#88bbdd", description: "Eta Carinae twin" },
    { name: "Red Supergiant Wind", position: [-190, -80, -175], color: "#ff6644", description: "Slow dense outflow" },
    { name: "AGB Mass Loss", position: [165, 105, 180], color: "#ee5533", description: "Thermal pulsing" },
    { name: "Mira Tail", position: [-210, 60, 195], color: "#dd4422", description: "13 light-year wake" },
    { name: "Planetary Nebula Shell", position: [180, -75, -170], color: "#44ff88", description: "Fast wind collision" },
    { name: "Interacting Winds", position: [-165, 100, 170], color: "#55ee99", description: "Binary shocks" },
    { name: "Wind Collision Zone", position: [200, 55, 185], color: "#66ddaa", description: "X-ray hot gas" },
    { name: "Bow Shock Nebula (III)", position: [-185, -55, -180], color: "#77ccbb", description: "Runaway star" },
    { name: "Dust Formation Shell", position: [175, 90, 175], color: "#aa8866", description: "Carbon condensation" },
    { name: "Circumstellar Envelope", position: [-200, 75, 190], color: "#bb9977", description: "Mass-loss history" },
    { name: "Wind Terminal Velocity", position: [210, -70, -175], color: "#aaccff", description: "v∞ measurement" },
    { name: "P Cygni Profile (II)", position: [-170, 110, 180], color: "#99bbee", description: "Wind signature" },
    { name: "Mass Loss Rate", position: [185, 65, 195], color: "#88aadd", description: "Msun per year" },
    { name: "Line-Driven Wind", position: [-195, -85, -170], color: "#77aacc", description: "UV photon push" },
    { name: "Dust-Driven Wind", position: [170, 100, 175], color: "#997755", description: "Radiation on grains" },
    { name: "Alfven Wave Drive", position: [-180, 55, 185], color: "#6699bb", description: "Magnetic acceleration" },
    { name: "Coronal Wind Base", position: [205, -60, -180], color: "#5588aa", description: "Solar-type wind" },
    { name: "Fast Rotating Wind", position: [-165, 95, 170], color: "#4488bb", description: "Be star disk" },
    { name: "Magnetic Confinement", position: [195, 80, 190], color: "#3399cc", description: "Trapped wind plasma" },
    { name: "Wind Clumping", position: [-210, -75, -175], color: "#88ccee", description: "Porosity effects" },
    { name: "Corotating Region", position: [175, 105, 180], color: "#99ddff", description: "Spiral structure" },
    { name: "Wind Accretion Zone", position: [-185, 70, 195], color: "#aaeeff", description: "Bondi-Hoyle" },
    { name: "Roche Lobe Overflow (III)", position: [200, -80, -170], color: "#ffbbaa", description: "Binary mass transfer" },
    { name: "Silicate Grain", position: [-180, 65, -185], color: "#aa9988", description: "Oxygen-rich dust" },
    { name: "Carbonaceous Grain", position: [195, -75, 175], color: "#554433", description: "Graphite and PAH" },
    { name: "Interstellar Extinction", position: [-170, 100, 190], color: "#776655", description: "Dust dimming" },
    { name: "Reddening Vector", position: [205, 55, -170], color: "#887766", description: "Color excess" },
    { name: "Dust-to-Gas Ratio", position: [-195, -80, 180], color: "#998877", description: "Metallicity tracer" },
    { name: "Infrared Cirrus", position: [165, 90, 175], color: "#ffddcc", description: "Diffuse emission" },
    { name: "Zodiacal Light (II)", position: [-210, 70, -175], color: "#ffeecc", description: "Inner system dust" },
    { name: "Gegenschein Glow", position: [180, -65, 195], color: "#eeddbb", description: "Opposition point" },
    { name: "Debris Disk", position: [-165, 105, 170], color: "#ddccaa", description: "Planetesimal belt" },
    { name: "Protoplanetary Dust", position: [200, 75, -180], color: "#ccbb99", description: "Planet formation" },
    { name: "Dust Sublimation", position: [-185, -55, 185], color: "#ffaa77", description: "Inner disk edge" },
    { name: "Ice Mantle", position: [175, 95, 180], color: "#aaddff", description: "Grain coating" },
    { name: "Grain Growth Zone", position: [-200, 60, -170], color: "#bbaa88", description: "Coagulation site" },
    { name: "Stardust Origin", position: [210, -70, 190], color: "#ccbb77", description: "Presolar grains" },
    { name: "Supernova Dust", position: [-170, 110, 175], color: "#ddcc66", description: "Explosive formation" },
    { name: "AGB Dust Factory (II)", position: [185, 55, -175], color: "#eedd55", description: "Wind condensation" },
    { name: "Dust Destruction", position: [-195, -85, 180], color: "#ff8844", description: "Shock sputtering" },
    { name: "PAH Emission", position: [170, 100, 185], color: "#ee7733", description: "3.3 micron band" },
    { name: "UIR Band Region", position: [-180, 65, -180], color: "#dd6622", description: "Unidentified IR" },
    { name: "Diffuse Band Origin", position: [205, -75, 175], color: "#cc5511", description: "DIB mystery" },
    { name: "Polarization Field", position: [-165, 95, 190], color: "#99aacc", description: "Grain alignment" },
    { name: "Magnetic Alignment", position: [195, 80, -170], color: "#8899bb", description: "B-field tracer" },
    { name: "Thermal Emission", position: [-210, -60, 175], color: "#ffccaa", description: "FIR continuum" },
    { name: "Scattering Halo", position: [175, 105, 180], color: "#aabbdd", description: "X-ray dust echo" },
    { name: "Cosmic Dust Lane", position: [-185, 70, -185], color: "#443322", description: "Galactic absorption" },
    { name: "Molecular Hydrogen", position: [190, -65, -180], color: "#aaeeff", description: "H2 universe fuel" },
    { name: "Carbon Monoxide", position: [-175, 95, 175], color: "#99ddee", description: "CO cloud tracer" },
    { name: "Ammonia Core (II)", position: [205, 70, 190], color: "#88ccdd", description: "NH3 thermometer" },
    { name: "Water Maser", position: [-190, -80, -175], color: "#77bbcc", description: "H2O amplification" },
    { name: "Hydroxyl Radical", position: [165, 105, 180], color: "#66aabb", description: "OH 18cm line" },
    { name: "Formaldehyde Zone", position: [-210, 60, 195], color: "#5599aa", description: "H2CO detection" },
    { name: "Methanol Ice", position: [180, -75, -170], color: "#4488aa", description: "CH3OH grain" },
    { name: "Hydrogen Cyanide", position: [-165, 100, 170], color: "#3388bb", description: "HCN dense tracer" },
    { name: "Carbon Chain", position: [200, 55, 185], color: "#4499cc", description: "HC3N and longer" },
    { name: "Complex Organic Zone", position: [-185, -55, -180], color: "#55aadd", description: "Prebiotic molecules" },
    { name: "Glycine Search", position: [175, 90, 175], color: "#66bbee", description: "Amino acid hunt" },
    { name: "Hot Core (II)", position: [-200, 75, 190], color: "#ff9966", description: "Warm protostellar" },
    { name: "Hot Corino", position: [210, -70, -175], color: "#ee8855", description: "Low-mass hot core" },
    { name: "Photodissociation Region (III)", position: [-170, 110, 180], color: "#dd7744", description: "PDR chemistry" },
    { name: "Cosmic Ray Ionization", position: [185, 65, 195], color: "#cc6633", description: "Dense cloud ion" },
    { name: "Ion-Molecule Zone", position: [-195, -85, -170], color: "#bb5522", description: "Cold reactions" },
    { name: "Grain Surface", position: [170, 100, 175], color: "#aa9988", description: "Catalytic site" },
    { name: "Desorption Event", position: [-180, 55, 185], color: "#bb8877", description: "Ice sublimation" },
    { name: "Deuterium Fractionation", position: [205, -60, -180], color: "#ccaa88", description: "D/H enhancement" },
    { name: "Isotope Ratio", position: [-165, 95, 170], color: "#ddbb99", description: "12C/13C tracer" },
    { name: "Nitrogen Fractionation", position: [195, 80, 190], color: "#eeccaa", description: "15N enrichment" },
    { name: "Sulfur Chemistry", position: [-210, -75, -175], color: "#ffcc44", description: "SO and SO2" },
    { name: "Phosphorus Detection", position: [175, 105, 180], color: "#eebb33", description: "PN molecule" },
    { name: "Silicon Monoxide", position: [-185, 70, 195], color: "#ddaa22", description: "SiO shock tracer" },
    { name: "Iron Hydride", position: [200, -80, -170], color: "#cc9911", description: "FeH rare species" },
    { name: "N-Body Simulation (II)", position: [-180, 65, -185], color: "#aabbff", description: "Gravity calculation" },
    { name: "SPH Particle Field", position: [195, -75, 175], color: "#99aaee", description: "Smoothed hydro" },
    { name: "AMR Grid Zone", position: [-170, 100, 190], color: "#8899dd", description: "Adaptive mesh" },
    { name: "Moving Mesh", position: [205, 55, -170], color: "#7788cc", description: "Voronoi cells" },
    { name: "MHD Solver", position: [-195, -80, 180], color: "#6677bb", description: "Magnetic fields" },
    { name: "Radiative Transfer", position: [165, 90, 175], color: "#5566aa", description: "Light propagation" },
    { name: "Monte Carlo RT", position: [-210, 70, -175], color: "#4466bb", description: "Photon packets" },
    { name: "Cosmological Box", position: [180, -65, 195], color: "#3377cc", description: "Universe simulation" },
    { name: "Zoom-In Region", position: [-165, 105, 170], color: "#4488dd", description: "High resolution" },
    { name: "Semi-Analytic Model (II)", position: [200, 75, -180], color: "#5599ee", description: "Galaxy formation" },
    { name: "Subgrid Physics", position: [-185, -55, 185], color: "#66aaff", description: "Unresolved processes" },
    { name: "Feedback Prescription", position: [175, 95, 180], color: "#77bbff", description: "SN and AGN" },
    { name: "Initial Conditions", position: [-200, 60, -170], color: "#88ccff", description: "Perturbation field" },
    { name: "Power Spectrum", position: [210, -70, 190], color: "#99ddff", description: "k-space analysis" },
    { name: "Halo Finder", position: [-170, 110, 175], color: "#aaeeff", description: "Structure identification" },
    { name: "Merger Tree", position: [185, 55, -175], color: "#bbffee", description: "Assembly history" },
    { name: "Lightcone Output", position: [-195, -85, 180], color: "#ccffdd", description: "Observer view" },
    { name: "Mock Catalog", position: [170, 100, 185], color: "#ddffcc", description: "Synthetic survey" },
    { name: "Code Comparison", position: [-180, 65, -180], color: "#eeffbb", description: "Aquila project" },
    { name: "Convergence Test", position: [205, -75, 175], color: "#ffffaa", description: "Resolution study" },
    { name: "GPU Acceleration", position: [-165, 95, 190], color: "#ffee99", description: "Parallel computing" },
    { name: "Exascale Region", position: [195, 80, -170], color: "#ffdd88", description: "Future computing" },
    { name: "Machine Learning Zone", position: [-210, -60, 175], color: "#ffcc77", description: "AI in astro" },
    { name: "Neural Network", position: [175, 105, 180], color: "#ffbb66", description: "Deep learning" },
    { name: "Emulator Model", position: [-185, 70, -185], color: "#ffaa55", description: "Fast prediction" },
    { name: "LSST Survey Field", position: [190, -65, -180], color: "#ffcc88", description: "10-year sky movie" },
    { name: "ZTF Patrol Zone", position: [-175, 95, 175], color: "#eebb77", description: "Nightly transient" },
    { name: "ASAS-SN Coverage", position: [205, 70, 190], color: "#ddaa66", description: "All-sky automated" },
    { name: "ATLAS Network", position: [-190, -80, -175], color: "#cc9955", description: "Asteroid impact" },
    { name: "Pan-STARRS Field", position: [165, 105, 180], color: "#bb8844", description: "Moving objects" },
    { name: "Gaia Alert Zone", position: [-210, 60, 195], color: "#aabbff", description: "Photometric transient" },
    { name: "TESS Sector", position: [180, -75, -170], color: "#99aaee", description: "Continuous stare" },
    { name: "Kepler Field", position: [-165, 100, 170], color: "#8899dd", description: "Original K2 zone" },
    { name: "Supernova Factory", position: [200, 55, 185], color: "#ff6644", description: "Cosmology SNe" },
    { name: "Kilonova Site", position: [-185, -55, -180], color: "#ee5533", description: "NS merger glow" },
    { name: "TDE Flare", position: [175, 90, 175], color: "#dd4422", description: "Tidal disruption" },
    { name: "Changing-Look AGN (II)", position: [-200, 75, 190], color: "#cc3311", description: "Type transition" },
    { name: "Microlensing Event (II)", position: [210, -70, -175], color: "#ffdd44", description: "Magnification peak" },
    { name: "Gravitational Lens Arc", position: [-170, 110, 180], color: "#eecc33", description: "Time delay" },
    { name: "Stellar Flare (II)", position: [185, 65, 195], color: "#ff8866", description: "M dwarf burst" },
    { name: "FRB Localization", position: [-195, -85, -170], color: "#88ffff", description: "Radio flash" },
    { name: "GRB Afterglow", position: [170, 100, 175], color: "#77eeff", description: "Fading remnant" },
    { name: "X-ray Nova", position: [-180, 55, 185], color: "#66ddff", description: "Binary outburst" },
    { name: "Dwarf Nova (II)", position: [205, -60, -180], color: "#55ccff", description: "CV eruption" },
    { name: "Classical Nova (II)", position: [-165, 95, 170], color: "#44bbff", description: "WD surface flash" },
    { name: "Recurrent Nova (II)", position: [195, 80, 190], color: "#33aaff", description: "Repeat eruption" },
    { name: "Luminous Red Nova (IV)", position: [-210, -75, -175], color: "#ff4444", description: "Stellar merger" },
    { name: "Gap Transient (III)", position: [175, 105, 180], color: "#ee3333", description: "Intermediate class" },
    { name: "Fast Blue Transient", position: [-185, 70, 195], color: "#4488ff", description: "Rapid bright event" },
    { name: "Cow-Like Object", position: [200, -80, -170], color: "#ffaaff", description: "AT2018cow class" },
    { name: "Intracluster Medium", position: [-210, 85, 205], color: "#ff6644", description: "Hot diffuse gas" },
    { name: "Ram Pressure Stripping", position: [215, -90, -175], color: "#44aaff", description: "Gas removal process" },
    { name: "Brightest Cluster Galaxy (III)", position: [-180, 100, 185], color: "#ffcc00", description: "Central massive elliptical" },
    { name: "Cool Core Cluster (II)", position: [190, -75, 210], color: "#66ddff", description: "Cooling flow center" },
    { name: "Cluster Virial Mass", position: [-205, 60, -195], color: "#ff8866", description: "Total gravitational mass" },
    { name: "Sunyaev-Zeldovich Effect (III)", position: [175, 110, 180], color: "#aaddff", description: "CMB spectral distortion" },
    { name: "X-Ray Luminosity Function", position: [-190, -85, 200], color: "#ff4466", description: "Cluster abundance" },
    { name: "Cluster Mass Function", position: [200, 95, -165], color: "#ffaa44", description: "Cosmological probe" },
    { name: "Richness Parameter", position: [-175, 70, 190], color: "#44ff88", description: "Galaxy count metric" },
    { name: "Cluster Relaxation", position: [185, -100, 175], color: "#88ccff", description: "Dynamical equilibrium" },
    { name: "Merger Shock Front", position: [-195, 80, -180], color: "#ff3355", description: "Collision heating" },
    { name: "Cold Front", position: [210, -65, 195], color: "#55ddee", description: "Contact discontinuity" },
    { name: "Radio Relic (II)", position: [-180, 105, 170], color: "#ff7744", description: "Peripheral synchrotron" },
    { name: "Radio Halo (II)", position: [170, 90, -200], color: "#ff6688", description: "Central diffuse emission" },
    { name: "Mini-Halo", position: [-200, -70, 185], color: "#ff5577", description: "Compact radio source" },
    { name: "Cluster Fossil Group", position: [195, 75, 180], color: "#ffbb66", description: "Evolved system" },
    { name: "Abell Catalog", position: [-185, 95, -170], color: "#88ff88", description: "Rich cluster survey" },
    { name: "Cluster Redshift Survey", position: [180, -80, 205], color: "#66aaff", description: "3D mapping" },
    { name: "Weak Lensing Mass", position: [-210, 55, 190], color: "#aabbff", description: "Shear measurement" },
    { name: "Strong Lensing Arc", position: [205, 100, -175], color: "#ff99cc", description: "Giant magnified image" },
    { name: "Cluster Baryon Fraction", position: [-170, -90, 180], color: "#ffdd88", description: "Gas to total ratio" },
    { name: "ICM Metallicity", position: [190, 65, 200], color: "#44ffaa", description: "Enrichment history" },
    { name: "Cluster Entropy Profile", position: [-195, 85, -165], color: "#ff8888", description: "Thermal structure" },
    { name: "Hydrostatic Mass Bias", position: [175, -95, 185], color: "#88ddff", description: "Pressure support error" },
    { name: "Cluster Cosmology", position: [-185, 110, 175], color: "#ffaa88", description: "σ8 and Ωm constraints" },
    { name: "Ultra-High-Energy CR", position: [220, -75, -185], color: "#ff4422", description: "Above 10^18 eV" },
    { name: "GZK Cutoff", position: [-175, 95, 210], color: "#ff6644", description: "Greisen-Zatsepin-Kuzmin limit" },
    { name: "Cosmic Ray Knee (III)", position: [185, 80, -195], color: "#ffaa33", description: "Spectral steepening" },
    { name: "Cosmic Ray Ankle (III)", position: [-200, -85, 180], color: "#ff8855", description: "Spectral flattening" },
    { name: "Fermi Acceleration", position: [195, 105, 170], color: "#44aaff", description: "Shock diffusive process" },
    { name: "Diffuse Shock Acceleration", position: [-180, 70, -200], color: "#66ccff", description: "First-order Fermi" },
    { name: "CR Composition", position: [210, -90, 185], color: "#88ffaa", description: "Protons to iron nuclei" },
    { name: "Air Shower (II)", position: [-195, 100, 165], color: "#ff99ff", description: "Particle cascade" },
    { name: "Extensive Air Shower", position: [175, 65, 205], color: "#ffaadd", description: "Ground-level detection" },
    { name: "Pierre Auger Observatory", position: [-210, -75, -175], color: "#44ff66", description: "Largest CR detector" },
    { name: "Telescope Array", position: [190, 95, -180], color: "#55dd88", description: "Northern hemisphere" },
    { name: "CR Anisotropy", position: [-170, 85, 195], color: "#ffcc66", description: "Directional variations" },
    { name: "Galactic CR Sources", position: [200, -100, 175], color: "#ff7744", description: "SNR acceleration" },
    { name: "Extragalactic CR", position: [-185, 60, -190], color: "#ff5566", description: "Beyond Milky Way" },
    { name: "CR Propagation", position: [180, 110, 190], color: "#88aaff", description: "Diffusion in ISM" },
    { name: "Spallation Products", position: [-205, -80, 180], color: "#aaffcc", description: "Secondary nuclei" },
    { name: "CR Clock Isotopes", position: [215, 70, -165], color: "#ffdd44", description: "Age tracers" },
    { name: "Grammage", position: [-175, 90, 175], color: "#ff8899", description: "Column density traversed" },
    { name: "CR Halo", position: [185, -65, 210], color: "#aaddff", description: "Galactic CR cocoon" },
    { name: "Solar Modulation", position: [-190, 105, -180], color: "#ffbb77", description: "Heliospheric effects" },
    { name: "Forbush Decrease (II)", position: [170, 80, 195], color: "#66ffaa", description: "CME CR suppression" },
    { name: "CR Ionization", position: [-200, -90, 165], color: "#ff6699", description: "Molecular cloud heating" },
    { name: "Gamma-Ray CR Tracer", position: [205, 100, -175], color: "#ffaa66", description: "Pion decay signature" },
    { name: "CR Energy Density", position: [-180, 75, 200], color: "#88ff88", description: "~1 eV per cm³" },
    { name: "Boron-to-Carbon Ratio", position: [195, -85, 180], color: "#44ffdd", description: "Secondary fraction" },
    { name: "IceCube Neutrino Observatory", position: [-215, 85, -170], color: "#55aaff", description: "South Pole detector" },
    { name: "High-Energy Neutrino", position: [180, -90, 205], color: "#66ccff", description: "Astrophysical TeV-PeV" },
    { name: "Neutrino Flavor Oscillation", position: [-175, 100, 185], color: "#88ddff", description: "Quantum mixing" },
    { name: "Blazar Neutrino Source", position: [205, 75, -180], color: "#ff8844", description: "TXS 0506+056" },
    { name: "Atmospheric Neutrino", position: [-190, -80, 195], color: "#aabbff", description: "CR shower background" },
    { name: "Solar Neutrino", position: [175, 105, 170], color: "#ffdd66", description: "pp chain flux" },
    { name: "Supernova Neutrino Burst", position: [-200, 65, -190], color: "#ff6688", description: "Collapse signature" },
    { name: "SN 1987A Neutrinos", position: [190, -100, 185], color: "#ff7799", description: "Historic detection" },
    { name: "Geoneutrino", position: [-180, 90, 175], color: "#88ff66", description: "Radioactive decay" },
    { name: "Reactor Neutrino", position: [210, 60, 200], color: "#44ffaa", description: "Calibration source" },
    { name: "Neutrino Cross Section", position: [-195, -75, -175], color: "#ccaaff", description: "Weak interaction" },
    { name: "Cherenkov Light Cone", position: [185, 95, -165], color: "#77ddff", description: "Detection mechanism" },
    { name: "Digital Optical Module", position: [-170, 80, 210], color: "#55ccee", description: "PMT sensor" },
    { name: "Neutrino Effective Area", position: [200, -85, 175], color: "#aaddee", description: "Detection efficiency" },
    { name: "Cascade Event", position: [-205, 105, 180], color: "#ff9988", description: "Contained shower" },
    { name: "Track Event", position: [175, 70, -195], color: "#88aadd", description: "Muon trajectory" },
    { name: "Diffuse Neutrino Flux", position: [-185, -90, 165], color: "#99bbff", description: "Isotropic background" },
    { name: "Point Source Search", position: [195, 100, 190], color: "#ffaa55", description: "Directional clustering" },
    { name: "Neutrino Alert System", position: [-210, 55, -180], color: "#ff5544", description: "Real-time followup" },
    { name: "Multi-Messenger Trigger", position: [180, -65, 205], color: "#ffcc88", description: "GW+ν correlation" },
    { name: "KM3NeT", position: [-175, 95, 175], color: "#44ccff", description: "Mediterranean detector" },
    { name: "Baikal-GVD", position: [205, 85, -170], color: "#66aadd", description: "Lake Baikal array" },
    { name: "Super-Kamiokande", position: [-190, -80, 195], color: "#88ddaa", description: "Water Cherenkov" },
    { name: "Hyper-Kamiokande", position: [170, 110, 180], color: "#77eebb", description: "Next-generation tank" },
    { name: "Cosmogenic Neutrino", position: [-200, 70, -165], color: "#aaccff", description: "GZK process ν" },
    { name: "Hubble Constant H0", position: [215, -70, 195], color: "#ff6644", description: "Expansion rate today" },
    { name: "Hubble Tension", position: [-175, 100, 180], color: "#ff4466", description: "Local vs CMB H0" },
    { name: "Matter Density Ωm", position: [185, 85, -200], color: "#88aaff", description: "Total matter fraction" },
    { name: "Dark Energy Density ΩΛ", position: [-200, -75, 175], color: "#aa66ff", description: "Cosmological constant" },
    { name: "Baryon Density Ωb", position: [175, 95, 210], color: "#ffaa88", description: "Ordinary matter" },
    { name: "Cold Dark Matter Ωc", position: [-185, 65, -185], color: "#6644ff", description: "Non-baryonic matter" },
    { name: "Curvature Parameter Ωk", position: [200, -90, 170], color: "#44ddaa", description: "Spatial geometry" },
    { name: "Equation of State w", position: [-210, 80, 190], color: "#ff88aa", description: "Dark energy pressure" },
    { name: "σ8 Amplitude", position: [180, 105, -175], color: "#ffcc55", description: "Structure normalization" },
    { name: "Spectral Index ns", position: [-175, -85, 185], color: "#88ff99", description: "Primordial tilt" },
    { name: "Optical Depth τ", position: [195, 70, 200], color: "#aabbee", description: "Reionization depth" },
    { name: "Age of Universe", position: [-190, 95, -170], color: "#ffdd77", description: "13.8 Gyr" },
    { name: "Critical Density", position: [210, -65, 180], color: "#ff9966", description: "Flatness threshold" },
    { name: "Cosmological Constant Λ", position: [-180, 110, 175], color: "#9977ff", description: "Vacuum energy" },
    { name: "Deceleration Parameter q", position: [175, 80, -190], color: "#66ccaa", description: "Expansion history" },
    { name: "Sound Horizon (II)", position: [-205, -70, 195], color: "#88ddff", description: "BAO standard ruler" },
    { name: "Matter-Radiation Equality", position: [190, 100, 165], color: "#ffaa44", description: "zeq epoch" },
    { name: "Recombination Redshift", position: [-170, 75, -180], color: "#ff7788", description: "z ~ 1100" },
    { name: "Reionization Epoch", position: [205, -80, 205], color: "#77aaff", description: "z ~ 6-10" },
    { name: "S8 Tension", position: [-195, 90, 180], color: "#ff5577", description: "Structure growth debate" },
    { name: "BAO Scale", position: [180, 60, -165], color: "#55ddcc", description: "~150 Mpc ruler" },
    { name: "Planck Parameters", position: [-185, -95, 170], color: "#aaffbb", description: "CMB constraints" },
    { name: "ΛCDM Model", position: [200, 105, 190], color: "#ffbb99", description: "Standard cosmology" },
    { name: "Flat Universe", position: [-210, 55, -175], color: "#88ffaa", description: "Ωk ≈ 0 evidence" },
    { name: "Cosmic Concordance", position: [175, -85, 175], color: "#ccddff", description: "Parameter agreement" },
    { name: "WIMP Particle", position: [-220, 75, -180], color: "#6644aa", description: "Weakly interacting" },
    { name: "Axion Dark Matter (II)", position: [185, -95, 200], color: "#88aaff", description: "Ultra-light boson" },
    { name: "Primordial Black Hole (VII)", position: [-175, 100, 175], color: "#4422aa", description: "Early universe relic" },
    { name: "Sterile Neutrino (III)", position: [200, 70, -185], color: "#7766cc", description: "keV mass candidate" },
    { name: "Fuzzy Dark Matter (III)", position: [-190, -80, 190], color: "#aabbff", description: "Ultra-light axion" },
    { name: "Self-Interacting DM (II)", position: [175, 105, 180], color: "#9988dd", description: "SIDM model" },
    { name: "Dark Photon (II)", position: [-205, 65, -170], color: "#5544bb", description: "Hidden sector gauge" },
    { name: "Asymmetric Dark Matter", position: [195, -85, 195], color: "#7755cc", description: "Matter-antimatter" },
    { name: "Mirror Dark Matter", position: [-180, 90, 185], color: "#6666bb", description: "Parallel sector" },
    { name: "Kaluza-Klein DM", position: [210, 80, -175], color: "#8877dd", description: "Extra dimension" },
    { name: "Wino Dark Matter", position: [-195, -70, 175], color: "#5533aa", description: "SUSY candidate" },
    { name: "Gravitino", position: [180, 100, 200], color: "#7744bb", description: "SUSY partner" },
    { name: "Q-Ball (II)", position: [-170, 55, -190], color: "#9999ee", description: "Supersymmetric soliton" },
    { name: "Dark Matter Halo (IV)", position: [205, -90, 170], color: "#8888cc", description: "Galactic envelope" },
    { name: "NFW Profile (II)", position: [-185, 95, 180], color: "#aaaaff", description: "Density distribution" },
    { name: "Cusp-Core Problem (II)", position: [175, 60, -180], color: "#ff8888", description: "Central density debate" },
    { name: "Missing Satellites (II)", position: [-200, -75, 195], color: "#ff7777", description: "Dwarf galaxy puzzle" },
    { name: "Direct Detection", position: [190, 110, 175], color: "#44aaff", description: "Recoil experiments" },
    { name: "Indirect Detection", position: [-210, 70, -165], color: "#55bbff", description: "Annihilation signals" },
    { name: "Collider Production", position: [180, -65, 205], color: "#66ccff", description: "LHC searches" },
    { name: "XENON Experiment", position: [-175, 85, 190], color: "#77ddff", description: "Liquid xenon detector" },
    { name: "LUX-ZEPLIN", position: [200, 75, -170], color: "#88eeff", description: "Next-gen direct" },
    { name: "DAMA/LIBRA Signal", position: [-190, -80, 170], color: "#ffaa55", description: "Annual modulation" },
    { name: "Dark Matter Subhalo", position: [215, 95, 185], color: "#9999cc", description: "Clumpy distribution" },
    { name: "Thermal Relic", position: [-180, 100, -175], color: "#aabbcc", description: "Freeze-out abundance" },
    { name: "Strong Gravitational Lens", position: [220, -70, 190], color: "#ff8855", description: "Multiple images" },
    { name: "Einstein Ring (II)", position: [-175, 95, 180], color: "#ffaa66", description: "Perfect alignment" },
    { name: "Einstein Cross (IV)", position: [185, 80, -195], color: "#ffcc77", description: "Quad configuration" },
    { name: "Weak Lensing Shear", position: [-200, -85, 175], color: "#88aaff", description: "Statistical distortion" },
    { name: "Cosmic Shear", position: [175, 105, 200], color: "#99bbff", description: "Large-scale lensing" },
    { name: "Microlensing Event (III)", position: [-185, 65, -185], color: "#ffdd88", description: "Stellar amplification" },
    { name: "MACHO Search", position: [200, -90, 170], color: "#aaddff", description: "Compact halo objects" },
    { name: "OGLE Survey", position: [-210, 80, 195], color: "#bbccff", description: "Bulge microlensing" },
    { name: "Magnification Bias", position: [180, 100, -175], color: "#ff9977", description: "Flux amplification" },
    { name: "Critical Curve", position: [-175, -75, 185], color: "#ff7766", description: "Infinite magnification" },
    { name: "Caustic Structure", position: [195, 70, 205], color: "#ff6655", description: "Source plane mapping" },
    { name: "Flexion Measurement", position: [-190, 95, -170], color: "#aabbee", description: "Higher-order distortion" },
    { name: "Convergence Map", position: [210, -65, 180], color: "#88ccff", description: "Projected mass density" },
    { name: "Aperture Mass", position: [-180, 110, 175], color: "#77ddff", description: "Filtered signal" },
    { name: "Galaxy-Galaxy Lensing", position: [175, 80, -190], color: "#ffbb88", description: "Halo mass probe" },
    { name: "Cluster Lensing", position: [-205, -70, 195], color: "#ff8866", description: "Mass reconstruction" },
    { name: "Time Delay Cosmography", position: [190, 105, 170], color: "#ffcc99", description: "H0 measurement" },
    { name: "Fermat Potential", position: [-170, 75, -180], color: "#aaddaa", description: "Light path geometry" },
    { name: "Lens Modeling", position: [205, -85, 205], color: "#99aaff", description: "Mass distribution fit" },
    { name: "Source Reconstruction", position: [-195, 90, 180], color: "#88bbff", description: "Unlensed image" },
    { name: "Substructure Lensing", position: [180, 60, -165], color: "#ffaa99", description: "Dark matter clumps" },
    { name: "Lensing Cross Section", position: [-185, -95, 170], color: "#bbddff", description: "Probability area" },
    { name: "Photometric Redshift", position: [200, 100, 185], color: "#88eeff", description: "Color-based z" },
    { name: "Shape Measurement", position: [-210, 55, -175], color: "#77ccee", description: "Ellipticity catalog" },
    { name: "PSF Correction", position: [175, -80, 175], color: "#99ddff", description: "Atmospheric removal" },
    { name: "Lyman-Break Galaxy (III)", position: [-220, 75, -185], color: "#55aaff", description: "UV dropout selection" },
    { name: "Lyman-Alpha Emitter (III)", position: [185, -95, 205], color: "#66bbff", description: "Lyα line detection" },
    { name: "Submillimeter Galaxy (III)", position: [-175, 100, 180], color: "#ff8855", description: "Dusty starburst" },
    { name: "Dropout Technique", position: [200, 75, -190], color: "#77ccff", description: "Photometric selection" },
    { name: "Gunn-Peterson Trough (IV)", position: [-190, -80, 195], color: "#4488ff", description: "IGM absorption" },
    { name: "Damped Lyman-Alpha", position: [175, 105, 175], color: "#88ddff", description: "High column HI" },
    { name: "Spectroscopic Confirmation", position: [-205, 65, -175], color: "#99eeff", description: "Redshift verification" },
    { name: "UV Luminosity Function", position: [195, -85, 200], color: "#aaffff", description: "Galaxy abundance" },
    { name: "Cosmic Star Formation", position: [-180, 90, 190], color: "#ff9966", description: "SFR density history" },
    { name: "Madau Plot", position: [210, 80, -180], color: "#ffaa77", description: "SFRD vs redshift" },
    { name: "Mass Assembly", position: [-195, -70, 180], color: "#ffbb88", description: "Galaxy buildup" },
    { name: "Downsizing", position: [180, 100, 205], color: "#ffcc99", description: "Mass-dependent evolution" },
    { name: "Size Evolution", position: [-170, 55, -190], color: "#88aadd", description: "Compact high-z" },
    { name: "Stellar Mass Function", position: [205, -90, 175], color: "#99bbee", description: "Mass distribution" },
    { name: "Photo-z Catastrophic", position: [-185, 95, 185], color: "#ff6655", description: "Redshift outliers" },
    { name: "JWST High-z Discovery", position: [175, 65, -175], color: "#ffdd44", description: "z > 10 candidates" },
    { name: "GN-z11", position: [-200, -75, 195], color: "#ffee55", description: "z = 10.6 galaxy" },
    { name: "JADES Survey", position: [190, 110, 180], color: "#66ff88", description: "JWST deep field" },
    { name: "CEERS Field", position: [-210, 70, -170], color: "#77ff99", description: "Extended survey" },
    { name: "Protocuster", position: [180, -65, 210], color: "#ff7766", description: "Forming cluster" },
    { name: "Overdensity Region", position: [-175, 85, 195], color: "#ff8877", description: "Galaxy concentration" },
    { name: "Quasar Host Galaxy (III)", position: [200, 75, -165], color: "#aabbff", description: "AGN environment" },
    { name: "GRB Host Galaxy", position: [-190, -80, 175], color: "#ffaaaa", description: "Gamma-ray burst site" },
    { name: "Cosmic Dawn (II)", position: [215, 95, 190], color: "#ffccaa", description: "First light epoch" },
    { name: "First Galaxies", position: [-180, 100, -180], color: "#ffddbb", description: "z > 15 population" },
    { name: "Epoch of Reionization (II)", position: [220, -70, 195], color: "#55aaff", description: "IGM ionization" },
    { name: "Neutral Hydrogen Fraction", position: [-175, 95, 185], color: "#66bbff", description: "xHI evolution" },
    { name: "Ionizing Photon Budget", position: [185, 80, -200], color: "#77ccff", description: "Source contribution" },
    { name: "Escape Fraction", position: [-200, -85, 180], color: "#88ddff", description: "fesc measurement" },
    { name: "Ionized Bubble", position: [175, 105, 205], color: "#99eeff", description: "HII region growth" },
    { name: "Bubble Percolation", position: [-185, 65, -190], color: "#aaffff", description: "Overlap phase" },
    { name: "21cm Cosmology", position: [200, -90, 175], color: "#ff8855", description: "Neutral gas signal" },
    { name: "Global 21cm Signal", position: [-210, 80, 200], color: "#ff9966", description: "Sky-averaged" },
    { name: "EDGES Detection", position: [180, 100, -180], color: "#ffaa77", description: "Absorption feature" },
    { name: "21cm Power Spectrum", position: [-175, -75, 190], color: "#ffbb88", description: "Fluctuation signal" },
    { name: "SKA Reionization", position: [195, 70, 210], color: "#44ff66", description: "Future tomography" },
    { name: "HERA Array", position: [-190, 95, -175], color: "#55ff77", description: "Hydrogen array" },
    { name: "MWA Observations", position: [210, -65, 185], color: "#66ff88", description: "Murchison array" },
    { name: "LOFAR EoR", position: [-180, 110, 180], color: "#77ff99", description: "Low frequency window" },
    { name: "Lyman-Alpha Damping Wing", position: [175, 80, -195], color: "#88aaff", description: "Neutral IGM signature" },
    { name: "Ionizing Background", position: [-205, -70, 200], color: "#99bbff", description: "Metagalactic field" },
    { name: "Reionization Optical Depth", position: [190, 105, 175], color: "#aaccff", description: "CMB constraint" },
    { name: "Thomson Scattering", position: [-170, 75, -185], color: "#bbddff", description: "CMB polarization" },
    { name: "Patchy Reionization", position: [205, -85, 210], color: "#ff7766", description: "Inhomogeneous process" },
    { name: "Inside-Out Scenario", position: [-195, 90, 185], color: "#ff8877", description: "Overdensity first" },
    { name: "Outside-In Scenario", position: [180, 60, -170], color: "#ff9988", description: "Underdensity first" },
    { name: "Photon-Starved Regime", position: [-185, -95, 175], color: "#ffaa99", description: "Source-limited" },
    { name: "Recombination-Limited", position: [200, 100, 190], color: "#ffbbaa", description: "Sink-dominated" },
    { name: "Fossil HII Region", position: [-210, 55, -180], color: "#ccddff", description: "Relic ionization" },
    { name: "Reionization Midpoint", position: [175, -80, 180], color: "#ddddff", description: "z ~ 7-8" },
    { name: "Population III Star (III)", position: [-220, 75, -190], color: "#ffee88", description: "First metal-free stars" },
    { name: "Zero Metallicity", position: [185, -95, 210], color: "#ffdd77", description: "Primordial composition" },
    { name: "Top-Heavy IMF", position: [-175, 100, 185], color: "#ffcc66", description: "Massive star bias" },
    { name: "Pair-Instability SN", position: [200, 75, -195], color: "#ff6644", description: "Complete disruption" },
    { name: "Pop III Remnant", position: [-190, -80, 200], color: "#ff7755", description: "Seed black hole" },
    { name: "Direct Collapse BH", position: [175, 105, 180], color: "#8855ff", description: "Massive seed" },
    { name: "Primordial Star Cluster", position: [-205, 65, -180], color: "#ffbb55", description: "First associations" },
    { name: "H2 Cooling", position: [195, -85, 205], color: "#88ddff", description: "Molecular hydrogen" },
    { name: "Jeans Mass", position: [-180, 90, 195], color: "#99eeff", description: "Collapse threshold" },
    { name: "Minihalo", position: [210, 80, -185], color: "#aaffff", description: "10^6 solar mass" },
    { name: "Lyman-Werner Feedback", position: [-195, -70, 185], color: "#ffaa44", description: "H2 photodissociation" },
    { name: "Pop III Supernova", position: [180, 100, 210], color: "#ff5533", description: "First explosions" },
    { name: "Chemical Enrichment", position: [-170, 55, -195], color: "#88ff88", description: "Metal seeding" },
    { name: "Pop III/II Transition", position: [205, -90, 180], color: "#99ff99", description: "Critical metallicity" },
    { name: "Extremely Metal-Poor", position: [-185, 95, 190], color: "#aaffaa", description: "EMP stars" },
    { name: "Carbon-Enhanced MP", position: [175, 65, -180], color: "#bbffbb", description: "CEMP stars" },
    { name: "Stellar Archaeology", position: [-200, -75, 200], color: "#ccffcc", description: "Fossil record" },
    { name: "Hyper Metal-Poor", position: [190, 110, 185], color: "#ddffdd", description: "[Fe/H] < -5" },
    { name: "Pristine Survey", position: [-210, 70, -175], color: "#eeffee", description: "Metal-poor search" },
    { name: "Pop III Detection", position: [180, -65, 215], color: "#ffff88", description: "Future prospects" },
    { name: "Gravitational Wave Pop III", position: [-175, 85, 200], color: "#ff88ff", description: "BH merger signature" },
    { name: "Pop III Host Halo", position: [200, 75, -170], color: "#ffaaff", description: "Formation site" },
    { name: "Atomic Cooling Halo", position: [-190, -80, 180], color: "#ffccff", description: "10^8 solar mass" },
    { name: "Streaming Velocity", position: [215, 95, 195], color: "#aabbff", description: "Baryon-DM offset" },
    { name: "Pop III Nucleosynthesis", position: [-180, 100, -185], color: "#bbccff", description: "First heavy elements" },
    { name: "Alpha Enhancement", position: [220, -70, 200], color: "#ff8844", description: "[α/Fe] enrichment" },
    { name: "Iron Peak Elements", position: [-175, 95, 190], color: "#ffaa55", description: "Type Ia products" },
    { name: "Neutron Capture", position: [185, 80, -205], color: "#88aaff", description: "s and r process" },
    { name: "s-Process Abundance", position: [-200, -85, 185], color: "#99bbff", description: "Slow neutron capture" },
    { name: "r-Process Abundance", position: [175, 105, 210], color: "#aaccff", description: "Rapid neutron capture" },
    { name: "Barium Star (III)", position: [-185, 65, -195], color: "#ffcc66", description: "s-process enhanced" },
    { name: "Europium Abundance", position: [200, -90, 180], color: "#bbddff", description: "r-process tracer" },
    { name: "Abundance Ratio", position: [-210, 80, 205], color: "#88ff88", description: "Element diagnostics" },
    { name: "Chemical Evolution", position: [180, 100, -185], color: "#99ff99", description: "Galaxy enrichment" },
    { name: "Age-Metallicity Relation (II)", position: [-175, -75, 195], color: "#aaff aa", description: "Stellar dating" },
    { name: "Metallicity Gradient", position: [195, 70, 215], color: "#bbffbb", description: "Radial variation" },
    { name: "Chemical Clock", position: [-190, 95, -180], color: "#ccffcc", description: "Abundance age proxy" },
    { name: "Li Depletion", position: [210, -65, 190], color: "#ffdd88", description: "Lithium problem" },
    { name: "CNO Abundances", position: [-180, 110, 185], color: "#ffeebb", description: "Mixing indicators" },
    { name: "Oxygen Abundance", position: [175, 80, -200], color: "#ddffdd", description: "[O/Fe] trend" },
    { name: "Magnesium Isotopes", position: [-205, -70, 205], color: "#88ddff", description: "AGB contribution" },
    { name: "Silicon Burning", position: [190, 105, 180], color: "#ff7755", description: "Pre-supernova" },
    { name: "Yield Table", position: [-170, 75, -190], color: "#ffaa77", description: "Nucleosynthesis output" },
    { name: "Spectroscopic Survey", position: [205, -85, 215], color: "#66ff88", description: "APOGEE/GALAH" },
    { name: "Chemical Tagging", position: [-195, 90, 190], color: "#77ff99", description: "Birth cluster ID" },
    { name: "Galactic Archaeology", position: [180, 60, -175], color: "#88ffaa", description: "Fossil abundances" },
    { name: "Actinide Abundance", position: [-185, -95, 180], color: "#aabbff", description: "U and Th tracers" },
    { name: "Nucleocosmochronometry", position: [200, 100, 195], color: "#bbccff", description: "Radioactive dating" },
    { name: "Solar Abundance", position: [-210, 55, -185], color: "#ffff88", description: "Reference standard" },
    { name: "Asplund Scale", position: [175, -80, 185], color: "#ffffaa", description: "Modern solar values" },
    { name: "Color-Magnitude Diagram", position: [-220, 75, -195], color: "#ffaa55", description: "HR diagram photometric" },
    { name: "Main Sequence Turnoff", position: [185, -95, 215], color: "#ffbb66", description: "Age indicator" },
    { name: "Red Giant Branch", position: [-175, 100, 190], color: "#ff6644", description: "Post-MS evolution" },
    { name: "Horizontal Branch (II)", position: [200, 75, -200], color: "#ff7755", description: "Core He burning" },
    { name: "Blue Straggler (III)", position: [-190, -80, 205], color: "#55aaff", description: "Anomalously blue" },
    { name: "Asymptotic Giant Branch (II)", position: [175, 105, 185], color: "#ff8866", description: "Double shell burning" },
    { name: "Red Clump", position: [-205, 65, -185], color: "#ff5533", description: "Standard candle" },
    { name: "Tip of RGB", position: [195, -85, 210], color: "#ff4422", description: "Distance indicator" },
    { name: "Color Index", position: [-180, 90, 200], color: "#88ddff", description: "B-V, V-I values" },
    { name: "Photometric System", position: [210, 80, -190], color: "#99eeff", description: "UBVRI/ugriz" },
    { name: "Reddening Vector (II)", position: [-195, -70, 190], color: "#ff9988", description: "Extinction path" },
    { name: "Dereddening", position: [180, 100, 215], color: "#ffaa99", description: "Color correction" },
    { name: "Bolometric Correction", position: [-170, 55, -200], color: "#ffbb88", description: "Total luminosity" },
    { name: "Effective Temperature", position: [205, -90, 185], color: "#ffcc77", description: "Surface Teff" },
    { name: "Surface Gravity", position: [-185, 95, 195], color: "#ffdd66", description: "log g parameter" },
    { name: "Photometric Parallax", position: [175, 65, -185], color: "#88ff88", description: "Distance from color" },
    { name: "Stellar Locus", position: [-200, -75, 210], color: "#99ff99", description: "Color-color track" },
    { name: "Photometric Metallicity", position: [190, 110, 185], color: "#aaff aa", description: "Color-Z relation" },
    { name: "Fiducial Sequence", position: [-210, 70, -180], color: "#bbffbb", description: "Reference CMD" },
    { name: "Isochrone Fitting", position: [180, -65, 220], color: "#ccffcc", description: "Age determination" },
    { name: "Luminosity Function", position: [-175, 85, 205], color: "#ddffdd", description: "Star counts" },
    { name: "Mass Function", position: [200, 75, -175], color: "#eeffee", description: "IMF measurement" },
    { name: "Binary Sequence", position: [-190, -80, 185], color: "#ff88ff", description: "Unresolved pairs" },
    { name: "Photometric Variability (II)", position: [215, 95, 200], color: "#ffaaff", description: "Time-domain colors" },
    { name: "Crowded Field Photometry", position: [-180, 100, -190], color: "#ffccff", description: "PSF fitting" },
    { name: "Radial Velocity", position: [220, -70, 205], color: "#55aaff", description: "Line-of-sight motion" },
    { name: "Proper Motion", position: [-175, 95, 195], color: "#66bbff", description: "Tangential motion" },
    { name: "Space Velocity", position: [185, 80, -210], color: "#77ccff", description: "3D motion vector" },
    { name: "UVW Velocities", position: [-200, -85, 190], color: "#88ddff", description: "Galactic components" },
    { name: "Velocity Dispersion", position: [175, 105, 215], color: "#99eeff", description: "Random motions" },
    { name: "Rotation Curve", position: [-185, 65, -195], color: "#ffaa44", description: "Circular velocity" },
    { name: "Asymmetric Drift", position: [200, -90, 185], color: "#ffbb55", description: "Lag from circular" },
    { name: "Vertex Deviation", position: [-210, 80, 210], color: "#ffcc66", description: "Velocity ellipsoid tilt" },
    { name: "Oort Constants", position: [180, 100, -195], color: "#ffdd77", description: "Local rotation" },
    { name: "Epicyclic Motion", position: [-175, -75, 200], color: "#88ff88", description: "Galactic oscillation" },
    { name: "Moving Group (II)", position: [195, 70, 220], color: "#99ff99", description: "Kinematic association" },
    { name: "Stellar Stream (III)", position: [-190, 95, -185], color: "#aaff aa", description: "Disrupted cluster" },
    { name: "Halo Kinematics", position: [210, -65, 195], color: "#bbffbb", description: "High-velocity stars" },
    { name: "Disk Kinematics", position: [-180, 110, 190], color: "#ccffcc", description: "Rotational support" },
    { name: "Thick Disk (II)", position: [175, 80, -205], color: "#ddffdd", description: "Hot disk component" },
    { name: "Thin Disk", position: [-205, -70, 215], color: "#eeffee", description: "Cold disk" },
    { name: "Bulge Kinematics", position: [190, 105, 185], color: "#ff8855", description: "Bar rotation" },
    { name: "Hypervelocity Star (II)", position: [-170, 75, -200], color: "#ff6644", description: "Escape velocity" },
    { name: "Runaway Star (II)", position: [205, -85, 210], color: "#ff7755", description: "Ejected from birth" },
    { name: "Binary Ejection", position: [-195, 90, 195], color: "#ff8866", description: "Hills mechanism" },
    { name: "Tidal Tail (II)", position: [180, 60, -180], color: "#ff9977", description: "Stretched remnant" },
    { name: "Phase Space", position: [-185, -95, 185], color: "#aabbff", description: "Position-velocity" },
    { name: "Action-Angle Variables", position: [200, 100, 200], color: "#bbccff", description: "Orbital integrals" },
    { name: "Jeans Equations", position: [-210, 55, -190], color: "#ccddff", description: "Dynamical equilibrium" },
    { name: "Gaia Kinematics", position: [175, -80, 190], color: "#44ff88", description: "6D phase space" },
    { name: "Seyfert Type 1", position: [185, 45, -165], color: "#ff6644", description: "Broad emission lines, direct view of BLR" },
    { name: "Seyfert Type 2", position: [-175, 65, 155], color: "#dd5533", description: "Narrow lines only, obscured nucleus" },
    { name: "AGN Unification", position: [165, -55, 175], color: "#ff8855", description: "Orientation-based taxonomy" },
    { name: "Dusty Torus", position: [-155, 75, -145], color: "#cc6644", description: "Obscuring equatorial structure" },
    { name: "Broad Line Region (III)", position: [145, 85, 165], color: "#ffaa66", description: "High-velocity gas near SMBH" },
    { name: "Narrow Line Region (III)", position: [-135, -75, 155], color: "#ddbb77", description: "Extended ionized gas kiloparsecs away" },
    { name: "AGN Feedback", position: [125, 65, -145], color: "#ff7755", description: "Regulation of star formation" },
    { name: "Radio-Loud AGN", position: [-115, 55, 135], color: "#ee6644", description: "Powerful relativistic jets" },
    { name: "Radio-Quiet AGN", position: [105, -45, 125], color: "#dd8866", description: "Weak or absent jet emission" },
    { name: "LINER Galaxies", position: [-95, 35, -115], color: "#cc9977", description: "Low-ionization nuclear emission" },
    { name: "Changing-Look AGN (III)", position: [85, 25, 105], color: "#ffbb88", description: "Transitioning spectral types" },
    { name: "AGN Variability", position: [-75, -15, 95], color: "#ee9966", description: "Stochastic flux changes" },
    { name: "Reverberation Mapping", position: [65, 5, -85], color: "#ddaa77", description: "BLR size from time delays" },
    { name: "M-sigma Relation", position: [-55, -5, 75], color: "#ccbb88", description: "SMBH mass vs velocity dispersion" },
    { name: "AGN Luminosity Function (II)", position: [45, 15, 65], color: "#ff9955", description: "Number density vs redshift" },
    { name: "Quasar Mode", position: [-35, -25, -55], color: "#ee8844", description: "Radiatively efficient accretion" },
    { name: "Jet Mode", position: [25, 35, 45], color: "#dd7733", description: "Kinetic feedback dominance" },
    { name: "AGN Host Galaxies", position: [-15, -45, 35], color: "#cc8855", description: "Massive spheroids preference" },
    { name: "Compton Thick AGN", position: [5, 55, -25], color: "#bb7744", description: "NH > 10^24 cm^-2 obscuration" },
    { name: "X-ray Reflection", position: [-200, -65, 200], color: "#ff6655", description: "Iron K-alpha fluorescence" },
    { name: "AGN Corona", position: [190, 75, 190], color: "#ee7766", description: "Hot X-ray emitting plasma" },
    { name: "Warm Absorbers", position: [-180, 85, -180], color: "#dd8877", description: "Ionized outflowing gas" },
    { name: "Ultra-Fast Outflows", position: [170, -95, 170], color: "#cc9988", description: "0.1c winds from inner disk" },
    { name: "AGN Duty Cycle", position: [-160, 105, 160], color: "#bbaa99", description: "Episodic activity phases" },
    { name: "Buried AGN", position: [150, 115, -150], color: "#ffccaa", description: "Heavily obscured nuclei" },
    { name: "Galaxy Groups", position: [-140, 125, 140], color: "#66aaff", description: "Few to dozens of members" },
    { name: "Compact Groups", position: [130, -135, -130], color: "#5599ee", description: "High density, frequent interactions" },
    { name: "Hickson Groups", position: [-120, 145, 120], color: "#4488dd", description: "Isolated compact configurations" },
    { name: "Fossil Groups", position: [110, 155, 110], color: "#3377cc", description: "Single giant from merged members" },
    { name: "Group X-ray Halos", position: [-100, -165, -100], color: "#6699dd", description: "Hot intragroup medium" },
    { name: "Galaxy Filaments", position: [90, 175, 90], color: "#77bbff", description: "Cosmic web strands" },
    { name: "Galaxy Walls", position: [-80, 185, -80], color: "#88ccff", description: "Sheet-like overdensities" },
    { name: "Void Galaxies", position: [70, -195, 70], color: "#99ddff", description: "Isolated underdense regions" },
    { name: "Field Galaxies", position: [-60, 200, 60], color: "#aaeeff", description: "Outside groups and clusters" },
    { name: "Supercluster", position: [50, -190, -50], color: "#5588cc", description: "Cluster of clusters" },
    { name: "Laniakea", position: [-40, 180, 40], color: "#4477bb", description: "Our local supercluster basin" },
    { name: "Great Attractor (II)", position: [30, 170, -30], color: "#3366aa", description: "Hidden mass concentration" },
    { name: "Shapley Concentration (II)", position: [-20, -160, 20], color: "#225599", description: "Most massive nearby supercluster" },
    { name: "Environmental Quenching", position: [10, 150, 10], color: "#6688bb", description: "Suppressed star formation" },
    { name: "Pre-processing", position: [-200, -140, -200], color: "#7799cc", description: "Group-scale transformations" },
    { name: "Strangulation", position: [195, 130, 195], color: "#88aadd", description: "Hot halo removal" },
    { name: "Conformity", position: [-185, 120, 185], color: "#99bbee", description: "Correlated galaxy properties" },
    { name: "Assembly Bias", position: [175, -110, -175], color: "#aaccff", description: "Halo history effects" },
    { name: "Backsplash Galaxies", position: [-165, 100, 165], color: "#5577aa", description: "Past cluster pericenter" },
    { name: "Infalling Population", position: [155, 90, 155], color: "#4466bb", description: "First approach to cluster" },
    { name: "Jellyfish Progenitors", position: [-145, -80, -145], color: "#3355cc", description: "Pre-stripping phase" },
    { name: "Group Tidal Fields", position: [135, 70, -135], color: "#6677dd", description: "Gravitational distortions" },
    { name: "Environmental Density", position: [-125, 60, 125], color: "#7788ee", description: "Local galaxy number counts" },
    { name: "Morphology-Density", position: [115, -50, 115], color: "#8899ff", description: "Relation of type to environment" },
    { name: "Group Dynamics", position: [-105, 40, -105], color: "#99aaff", description: "Virial equilibrium and masses" },
    { name: "Stellar Wind", position: [95, -30, 95], color: "#ffdd66", description: "Continuous mass loss flow" },
    { name: "Line-Driven Winds", position: [-85, 20, -85], color: "#eebb55", description: "UV photon momentum transfer" },
    { name: "CAK Theory", position: [75, 10, 75], color: "#ddaa44", description: "Castor-Abbott-Klein formalism" },
    { name: "Wind Terminal Velocity (II)", position: [-65, -200, -65], color: "#cc9933", description: "Asymptotic outflow speed" },
    { name: "Mass Loss Rate (II)", position: [55, 195, 55], color: "#ffcc55", description: "Solar masses per year" },
    { name: "Wolf-Rayet Winds", position: [-45, -185, 45], color: "#eeaa66", description: "Optically thick outflows" },
    { name: "Wind Clumping (II)", position: [35, 175, -35], color: "#dd9977", description: "Density inhomogeneities" },
    { name: "Wind Variability", position: [-25, -165, -25], color: "#cc8888", description: "Time-dependent structure" },
    { name: "Wind Shocks", position: [15, 155, 15], color: "#ff9966", description: "Embedded X-ray sources" },
    { name: "Corotating Interaction", position: [-200, -145, 200], color: "#ee8855", description: "CIR spiral patterns" },
    { name: "Wind Magnetic Fields", position: [190, 135, -190], color: "#dd7744", description: "Magnetically confined winds" },
    { name: "Wind Bubbles", position: [-180, -125, -180], color: "#cc6633", description: "Hot interior cavities" },
    { name: "Red Giant Winds", position: [170, 115, 170], color: "#ffaa77", description: "Dust-driven mass loss" },
    { name: "AGB Superwinds", position: [-160, -105, 160], color: "#ee9988", description: "Enhanced late-stage outflows" },
    { name: "Pulsation-Driven Winds", position: [150, 95, -150], color: "#dd8899", description: "Mira variable mass loss" },
    { name: "Bipolar Outflows", position: [-140, -85, -140], color: "#ccaaaa", description: "Collimated ejection axes" },
    { name: "Herbig-Haro Objects", position: [130, 75, 130], color: "#66ffaa", description: "Protostellar jet shocks" },
    { name: "T Tauri Winds", position: [-120, -65, 120], color: "#55ee99", description: "Young star outflows" },
    { name: "X-Wind Model", position: [110, 55, -110], color: "#44dd88", description: "Magnetospheric ejection" },
    { name: "Disk Wind Model", position: [-100, -45, -100], color: "#33cc77", description: "Centrifugally launched flows" },
    { name: "FU Orionis Outbursts", position: [90, 35, 90], color: "#77ff99", description: "Accretion-driven eruptions" },
    { name: "Molecular Outflows", position: [-80, -25, 80], color: "#88ffaa", description: "Entrained ambient gas" },
    { name: "Wind Momentum Problem", position: [70, 15, -70], color: "#99ffbb", description: "Efficiency beyond radiation" },
    { name: "Wind Collision Zones", position: [-60, -5, -60], color: "#aaffcc", description: "Binary wind interaction" },
    { name: "Bow Shock Nebulae", position: [50, -15, 50], color: "#bbffdd", description: "Runaway star wind shaping" },
    { name: "Radio Interferometry", position: [-40, 25, -40], color: "#44aaff", description: "Aperture synthesis imaging" },
    { name: "Baseline Vector", position: [30, -35, 30], color: "#55bbff", description: "Antenna pair separation" },
    { name: "UV Coverage", position: [-20, 45, 20], color: "#66ccff", description: "Spatial frequency sampling" },
    { name: "Visibility Function", position: [10, -55, -10], color: "#77ddff", description: "Fourier component measurement" },
    { name: "Phase Closure", position: [-200, 65, 200], color: "#88eeff", description: "Atmospheric error cancellation" },
    { name: "Self-Calibration", position: [195, -75, -195], color: "#44bbee", description: "Iterative gain correction" },
    { name: "CLEAN Algorithm", position: [-185, 85, -185], color: "#55ccdd", description: "Deconvolution method" },
    { name: "Dirty Beam", position: [175, -95, 175], color: "#66ddcc", description: "PSF from UV sampling" },
    { name: "Maximum Entropy", position: [-165, 105, 165], color: "#77eebb", description: "MEM image reconstruction" },
    { name: "Spectral Line VLBI", position: [155, -115, -155], color: "#88ffaa", description: "Maser astrometry" },
    { name: "Continuum VLBI", position: [-145, 125, -145], color: "#55aadd", description: "Compact AGN cores" },
    { name: "Phase Referencing", position: [135, -135, 135], color: "#66bbcc", description: "Calibrator source technique" },
    { name: "Fringe Fitting", position: [-125, 145, 125], color: "#77ccbb", description: "Delay and rate solution" },
    { name: "Bandwidth Synthesis", position: [115, -155, -115], color: "#88ddaa", description: "Multi-frequency imaging" },
    { name: "Mosaic Imaging", position: [-105, 165, -105], color: "#99ee99", description: "Wide-field combination" },
    { name: "Primary Beam", position: [95, -175, 95], color: "#44cc88", description: "Antenna response pattern" },
    { name: "Correlator", position: [-85, 185, 85], color: "#55dd77", description: "Signal cross-multiplication" },
    { name: "Digital Backend", position: [75, -195, -75], color: "#66ee66", description: "Sampler and spectrometer" },
    { name: "Array Configuration", position: [-65, 200, -65], color: "#77ff55", description: "Antenna layout optimization" },
    { name: "Snapshot Imaging", position: [55, -190, 55], color: "#88ff44", description: "Short integration maps" },
    { name: "Earth Rotation Synthesis", position: [-45, 180, 45], color: "#44ee77", description: "UV track filling" },
    { name: "Tropospheric Delay", position: [35, -170, -35], color: "#55dd88", description: "Water vapor correction" },
    { name: "Ionospheric Effects", position: [-25, 160, -25], color: "#66cc99", description: "Low frequency distortion" },
    { name: "RFI Excision", position: [15, -150, 15], color: "#77bbaa", description: "Interference flagging" },
    { name: "Amplitude Calibration", position: [-5, 140, 5], color: "#88aabb", description: "Flux density scale" },
    { name: "Optical Interferometry", position: [200, -130, -200], color: "#ffaa44", description: "Visible light aperture synthesis" },
    { name: "Michelson Stellar", position: [-190, 120, 190], color: "#eebb55", description: "Historic diameter measurement" },
    { name: "Intensity Interferometry", position: [180, -110, 180], color: "#ddcc66", description: "Photon correlation technique" },
    { name: "Amplitude Interferometry", position: [-170, 100, -170], color: "#ccdd77", description: "Direct wave combination" },
    { name: "Fringe Tracking", position: [160, -90, -160], color: "#bbee88", description: "Real-time OPD correction" },
    { name: "Delay Lines", position: [-150, 80, 150], color: "#aaff99", description: "Optical path equalization" },
    { name: "Beam Combiner", position: [140, -70, 140], color: "#ffbb66", description: "Interferometric mixing" },
    { name: "Closure Phase Optical", position: [-130, 60, -130], color: "#eecc77", description: "Asymmetry detection" },
    { name: "Squared Visibility", position: [120, -50, -120], color: "#dddd88", description: "Contrast measurement" },
    { name: "Stellar Diameter", position: [-110, 40, 110], color: "#ccee99", description: "Angular size from V²" },
    { name: "Binary Orbit Imaging", position: [100, -30, 100], color: "#bbffaa", description: "Astrometric detection" },
    { name: "Surface Imaging", position: [-90, 20, -90], color: "#ffcc88", description: "Stellar spot mapping" },
    { name: "Limb Darkening", position: [80, -10, -80], color: "#eedd99", description: "Center-to-edge intensity" },
    { name: "CHARA Array", position: [-70, 200, 70], color: "#ddeeaa", description: "Georgia State optical array" },
    { name: "VLTI", position: [60, -195, 60], color: "#ccffbb", description: "ESO Very Large Telescope Interferometer" },
    { name: "NPOI", position: [-50, 185, -50], color: "#ffdd99", description: "Navy Precision Optical" },
    { name: "Keck Interferometer", position: [40, -175, -40], color: "#eeeeaa", description: "Mauna Kea baseline" },
    { name: "Nulling Interferometry", position: [-30, 165, 30], color: "#ddffbb", description: "Starlight suppression" },
    { name: "Exoplanet Direct Imaging", position: [20, -155, 20], color: "#ccffcc", description: "Companion detection goal" },
    { name: "Atmospheric Coherence", position: [-10, 145, -10], color: "#ff9966", description: "Fried parameter r₀" },
    { name: "Isoplanatic Angle", position: [200, -135, 200], color: "#ee8877", description: "Atmospheric patch size" },
    { name: "Speckle Imaging", position: [-195, 125, -195], color: "#dd7788", description: "Short exposure technique" },
    { name: "Lucky Imaging", position: [185, -115, -185], color: "#cc6699", description: "Best frame selection" },
    { name: "Fiber Interferometry", position: [-175, 105, 175], color: "#bb55aa", description: "Single-mode beam transport" },
    { name: "Integrated Optics", position: [165, -95, 165], color: "#aa44bb", description: "Chip-based combination" },
    { name: "Visual Binary", position: [-155, 85, -155], color: "#ff6688", description: "Resolved orbital pairs" },
    { name: "Spectroscopic Binary (II)", position: [145, -75, -145], color: "#ee5599", description: "Radial velocity variations" },
    { name: "Eclipsing Binary (II)", position: [-135, 65, 135], color: "#dd44aa", description: "Mutual light blocking" },
    { name: "Astrometric Binary (II)", position: [125, -55, 125], color: "#cc33bb", description: "Positional wobble detection" },
    { name: "Contact Binary (II)", position: [-115, 45, -115], color: "#ff77aa", description: "Shared common envelope" },
    { name: "Detached Binary", position: [105, -35, -105], color: "#ee66bb", description: "Well-separated components" },
    { name: "Semi-Detached", position: [-95, 25, 95], color: "#dd55cc", description: "One Roche-filling star" },
    { name: "Roche Lobe", position: [85, -15, 85], color: "#cc44dd", description: "Gravitational equipotential" },
    { name: "Mass Transfer", position: [-75, 5, -75], color: "#ff88cc", description: "Accretion stream flow" },
    { name: "Orbital Period", position: [65, -200, -65], color: "#ee77dd", description: "Kepler third law" },
    { name: "Mass Ratio", position: [-55, 195, 55], color: "#dd66ee", description: "q = M₂/M₁ parameter" },
    { name: "Eccentricity", position: [45, -185, 45], color: "#cc55ff", description: "Orbit elongation measure" },
    { name: "Tidal Circularization", position: [-35, 175, -35], color: "#ff99dd", description: "Orbit rounding timescale" },
    { name: "Apsidal Motion", position: [25, -165, -25], color: "#ee88ee", description: "Periastron precession" },
    { name: "Orbital Decay", position: [-15, 155, 15], color: "#dd77ff", description: "Period decrease mechanism" },
    { name: "Mass Function (II)", position: [5, -145, 5], color: "#cc66ff", description: "Minimum companion mass" },
    { name: "Radial Velocity Curve (II)", position: [-200, 135, -200], color: "#ffaaee", description: "Doppler shift phasing" },
    { name: "Light Curve Analysis", position: [190, -125, 190], color: "#ee99ff", description: "Eclipse profile modeling" },
    { name: "Stellar Radii", position: [-180, 115, 180], color: "#dd88ff", description: "Size from eclipses" },
    { name: "Gravity Darkening", position: [170, -105, -170], color: "#cc77ff", description: "Pole-equator temperature" },
    { name: "Reflection Effect", position: [-160, 95, -160], color: "#ffbbff", description: "Heated facing hemispheres" },
    { name: "Ellipsoidal Variations", position: [150, -85, 150], color: "#eeaaff", description: "Tidal distortion signal" },
    { name: "O'Connell Effect", position: [-140, 75, 140], color: "#dd99ff", description: "Asymmetric light maxima" },
    { name: "Period Changes", position: [130, -65, -130], color: "#cc88ff", description: "Mass transfer signature" },
    { name: "Common Envelope", position: [-120, 55, -120], color: "#ffccff", description: "Shared outer layers phase" },
    { name: "Transit Method", position: [110, -45, 110], color: "#44ffaa", description: "Planetary dimming detection" },
    { name: "Transit Depth", position: [-100, 35, -100], color: "#55ee99", description: "Radius ratio squared" },
    { name: "Transit Duration", position: [90, -25, -90], color: "#66dd88", description: "Orbital geometry probe" },
    { name: "Limb Darkening Transit", position: [-80, 15, 80], color: "#77cc77", description: "Ingress egress shape" },
    { name: "Transit Timing", position: [70, -5, 70], color: "#88bb66", description: "TTV gravitational perturbations" },
    { name: "Transit Spectroscopy", position: [-60, -200, -60], color: "#99aa55", description: "Atmospheric transmission" },
    { name: "Radial Velocity Planet", position: [50, 195, 50], color: "#44ddaa", description: "Stellar wobble from planet" },
    { name: "RV Semi-Amplitude", position: [-40, -185, -40], color: "#55cc99", description: "K velocity measure" },
    { name: "Rossiter-McLaughlin", position: [30, 175, -30], color: "#66bb88", description: "Spin-orbit alignment" },
    { name: "Direct Imaging Planet", position: [-20, -165, 20], color: "#77aa77", description: "Spatially resolved detection" },
    { name: "Coronagraph", position: [10, 155, 10], color: "#889966", description: "Starlight blocking mask" },
    { name: "Angular Differential", position: [-200, -145, -200], color: "#44ccaa", description: "ADI speckle subtraction" },
    { name: "Spectral Differential", position: [195, 135, 195], color: "#55bb99", description: "SDI wavelength subtraction" },
    { name: "Astrometric Planet", position: [-185, -125, 185], color: "#66aa88", description: "Position wobble detection" },
    { name: "Microlensing Planet (II)", position: [175, 115, -175], color: "#779977", description: "Gravitational light bending" },
    { name: "Pulsar Timing Planet", position: [-165, -105, -165], color: "#888866", description: "TOA variations from companion" },
    { name: "Eclipse Timing", position: [155, 95, 155], color: "#44bbaa", description: "Binary light-time effect" },
    { name: "Orbital Brightness Modulation", position: [-145, -85, 145], color: "#55aa99", description: "Reflected light phases" },
    { name: "Doppler Beaming", position: [135, 75, -135], color: "#669988", description: "Relativistic flux variation" },
    { name: "Ellipsoidal Planet", position: [-125, -65, -125], color: "#779977", description: "Tidal shape changes" },
    { name: "Phase Curve (II)", position: [115, 55, 115], color: "#88aa66", description: "Day-night contrast mapping" },
    { name: "Secondary Eclipse (II)", position: [-105, -45, 105], color: "#44aaaa", description: "Thermal emission measurement" },
    { name: "Emission Spectroscopy", position: [95, 35, -95], color: "#559999", description: "Dayside atmosphere probing" },
    { name: "High-Resolution Cross-Correlation", position: [-85, -25, -85], color: "#668888", description: "Molecular line detection" },
    { name: "Transmission Cross-Correlation", position: [75, 15, 75], color: "#777777", description: "HRCCS terminator spectra" },
    { name: "Stellar Structure", position: [-65, 5, -65], color: "#ffcc44", description: "Hydrostatic equilibrium layers" },
    { name: "Radiative Zone (II)", position: [55, -200, 55], color: "#eebb55", description: "Photon diffusion transport" },
    { name: "Convective Zone", position: [-45, 195, -45], color: "#ddaa66", description: "Buoyant mixing region" },
    { name: "Schwarzschild Criterion", position: [35, -185, -35], color: "#cc9977", description: "Convective instability test" },
    { name: "Mixing Length Theory", position: [-25, 175, 25], color: "#bb8888", description: "Convection parameterization" },
    { name: "Opacity Tables", position: [15, -165, 15], color: "#ffdd66", description: "Rosseland mean values" },
    { name: "Nuclear Energy Generation", position: [-5, 155, -5], color: "#eecc77", description: "Core fusion rates" },
    { name: "PP Chain", position: [200, -145, 200], color: "#ddbb88", description: "Proton-proton reactions" },
    { name: "CNO Cycle", position: [-195, 135, -195], color: "#ccaa99", description: "Carbon-catalyzed fusion" },
    { name: "Triple Alpha", position: [185, -125, -185], color: "#bb99aa", description: "Helium to carbon burning" },
    { name: "Stellar Core", position: [-175, 115, 175], color: "#ffee88", description: "Central fusion region" },
    { name: "Degenerate Core", position: [165, -105, 165], color: "#eedd99", description: "Electron pressure support" },
    { name: "Chandrasekhar Mass", position: [-155, 95, -155], color: "#ddccaa", description: "1.4 solar mass limit" },
    { name: "Equation of State", position: [145, -85, -145], color: "#ccbbbb", description: "Pressure-density relation" },
    { name: "OPAL Tables", position: [-135, 75, 135], color: "#bbaacc", description: "Livermore opacity data" },
    { name: "Mass-Luminosity Relation", position: [125, -65, 125], color: "#ffff99", description: "L scales with M^3.5" },
    { name: "Main Sequence Lifetime", position: [-115, 55, -115], color: "#eeeeaa", description: "Hydrogen burning duration" },
    { name: "MESA Code", position: [105, -45, -105], color: "#ddddbb", description: "Stellar evolution software" },
    { name: "PARSEC Isochrones", position: [-95, 35, 95], color: "#cccccc", description: "Population synthesis models" },
    { name: "Stellar Atmosphere Model", position: [85, -25, 85], color: "#bbbbdd", description: "Surface boundary conditions" },
    { name: "ATLAS9", position: [-75, 15, -75], color: "#ffffaa", description: "Kurucz model atmospheres" },
    { name: "PHOENIX Models", position: [65, -5, -65], color: "#eeeebb", description: "Cool star atmospheres" },
    { name: "Limb Darkening Coefficient", position: [-55, -200, 55], color: "#ddddcc", description: "Center-to-limb intensity" },
    { name: "Effective Temperature (II)", position: [45, 195, 45], color: "#ccccdd", description: "Surface Stefan-Boltzmann" },
    { name: "Surface Gravity (II)", position: [-35, -185, -35], color: "#bbbbee", description: "log g parameter" },
    { name: "Supernova Remnant (II)", position: [25, 175, 25], color: "#ff4444", description: "Expanding explosion debris" },
    { name: "Free Expansion Phase", position: [-15, -165, -15], color: "#ee5555", description: "Undecelerated early stage" },
    { name: "Sedov-Taylor Phase", position: [5, 155, 5], color: "#dd6666", description: "Adiabatic blast wave" },
    { name: "Radiative Phase", position: [-200, -145, 200], color: "#cc7777", description: "Cooling shell formation" },
    { name: "Snowplow Phase", position: [195, 135, -195], color: "#bb8888", description: "Momentum-conserving sweep" },
    { name: "Forward Shock SNR", position: [-185, -125, -185], color: "#ff6666", description: "Outer blast front" },
    { name: "Reverse Shock SNR", position: [175, 115, 175], color: "#ee7777", description: "Ejecta heating wave" },
    { name: "Contact Discontinuity (II)", position: [-165, -105, 165], color: "#dd8888", description: "Ejecta-ISM boundary" },
    { name: "Rayleigh-Taylor SNR", position: [155, 95, -155], color: "#cc9999", description: "Finger instabilities" },
    { name: "X-ray Synchrotron Rims", position: [-145, -85, -145], color: "#bbaaaa", description: "TeV electron emission" },
    { name: "Thermal X-ray SNR", position: [135, 75, 135], color: "#ff8888", description: "Hot plasma emission" },
    { name: "Radio Shell SNR", position: [-125, -65, 125], color: "#ee9999", description: "Synchrotron limb brightening" },
    { name: "Pulsar Wind Nebula (II)", position: [115, 55, -115], color: "#ddaaaa", description: "Central engine outflow" },
    { name: "Crab Nebula", position: [-105, -45, -105], color: "#ccbbbb", description: "Iconic PWN example" },
    { name: "Cas A", position: [95, 35, 95], color: "#bbcccc", description: "Young oxygen-rich remnant" },
    { name: "Tycho SNR", position: [-85, -25, 85], color: "#ffaaaa", description: "Type Ia remnant" },
    { name: "SN 1006", position: [75, 15, -75], color: "#eebbbb", description: "Historic bilateral shell" },
    { name: "Vela SNR", position: [-65, -5, -65], color: "#ddcccc", description: "Nearby large remnant" },
    { name: "SNR Dynamics", position: [55, -200, 55], color: "#ccdddd", description: "Expansion velocity evolution" },
    { name: "Ejecta Abundances", position: [-45, 195, -45], color: "#bbeeff", description: "Nucleosynthesis products" },
    { name: "Dust Formation SNR", position: [35, -185, -35], color: "#ffbbbb", description: "Grain condensation in ejecta" },
    { name: "SNR Shocks ISM", position: [-25, 175, 25], color: "#eecccc", description: "Interstellar medium heating" },
    { name: "Mixed-Morphology SNR", position: [15, -165, 15], color: "#dddddd", description: "Thermal center radio shell" },
    { name: "SNR-Molecular Cloud", position: [-5, 155, -5], color: "#cceeee", description: "Dense environment interaction" },
    { name: "Cosmic Ray Acceleration SNR", position: [200, -145, 200], color: "#bbffff", description: "Diffusive shock acceleration" },
    { name: "Pulsar Timing Array (III)", position: [-195, 135, -195], color: "#9944ff", description: "Galactic GW detector" },
    { name: "NANOGrav", position: [185, -125, 185], color: "#8855ee", description: "North American PTA" },
    { name: "EPTA", position: [-175, 115, 175], color: "#7766dd", description: "European Pulsar Timing Array" },
    { name: "PPTA", position: [165, -105, -165], color: "#6677cc", description: "Parkes PTA Australia" },
    { name: "IPTA", position: [-155, 95, -155], color: "#5588bb", description: "International combination" },
    { name: "Timing Residuals", position: [145, -85, 145], color: "#aa55ff", description: "TOA minus model" },
    { name: "Hellings-Downs Curve", position: [-135, 75, 135], color: "#9966ee", description: "Angular correlation signature" },
    { name: "GW Background PTA", position: [125, -65, -125], color: "#8877dd", description: "Stochastic nHz signal" },
    { name: "SMBH Binary GW", position: [-115, 55, -115], color: "#7788cc", description: "Supermassive pair sources" },
    { name: "Continuous Wave PTA", position: [105, -45, 105], color: "#6699bb", description: "Individual binary detection" },
    { name: "Burst GW PTA", position: [-95, 35, 95], color: "#bb66ff", description: "Memory events" },
    { name: "Red Noise PTA", position: [85, -25, -85], color: "#aa77ee", description: "Low-frequency timing noise" },
    { name: "DM Variations", position: [-75, 15, -75], color: "#9988dd", description: "Dispersion measure changes" },
    { name: "Solar Wind PTA", position: [65, -5, 65], color: "#8899cc", description: "Interplanetary plasma delay" },
    { name: "Timing Model", position: [-55, -200, 55], color: "#77aabb", description: "Pulsar ephemeris fitting" },
    { name: "Glitch Recovery", position: [45, 195, -45], color: "#cc77ff", description: "Post-glitch timing" },
    { name: "Binary Pulsar Timing", position: [-35, -185, -35], color: "#bb88ee", description: "Orbital parameter fitting" },
    { name: "Shapiro Delay Binary", position: [25, 175, 25], color: "#aa99dd", description: "Gravitational time delay" },
    { name: "Timing Precision", position: [-15, -165, 15], color: "#99aacc", description: "Sub-microsecond TOAs" },
    { name: "Wideband Timing", position: [5, 155, -5], color: "#88bbbb", description: "Simultaneous DM fitting" },
    { name: "CHIME Pulsar", position: [-200, -145, -200], color: "#dd88ff", description: "Canadian radio telescope" },
    { name: "MeerKAT Timing", position: [195, 135, 195], color: "#cc99ee", description: "South African array PTA" },
    { name: "SKA Pulsar Timing", position: [-185, -125, 185], color: "#bbaadd", description: "Future PTA revolution" },
    { name: "Pulsar Noise Budget", position: [175, 115, -175], color: "#aabbcc", description: "Sensitivity limit sources" },
    { name: "Bayesian PTA Analysis", position: [-165, -105, -165], color: "#99ccbb", description: "Posterior GW parameter estimation" },
    { name: "Fast Radio Burst (II)", position: [155, 95, 155], color: "#ff8800", description: "Millisecond extragalactic pulse" },
    { name: "FRB Dispersion", position: [-145, -85, 145], color: "#ee9911", description: "Intergalactic electron delay" },
    { name: "FRB Host Galaxy", position: [135, 75, -135], color: "#ddaa22", description: "Localized source environment" },
    { name: "Repeating FRB", position: [-125, -65, -125], color: "#ccbb33", description: "Multiple burst sources" },
    { name: "Non-Repeating FRB", position: [115, 55, 115], color: "#bbcc44", description: "Apparent one-time events" },
    { name: "FRB Polarization", position: [-105, -45, 105], color: "#ff9922", description: "Linear and circular signals" },
    { name: "Rotation Measure FRB", position: [95, 35, -95], color: "#eeaa33", description: "Magnetic field tracer" },
    { name: "FRB Scattering", position: [-85, -25, -85], color: "#ddbb44", description: "Multipath broadening" },
    { name: "FRB Scintillation", position: [75, 15, 75], color: "#cccc55", description: "ISM intensity modulation" },
    { name: "Magnetar FRB", position: [-65, -5, 65], color: "#bbdd66", description: "Galactic FRB source" },
    { name: "SGR 1935+2154", position: [55, -200, -55], color: "#ffaa44", description: "Magnetar burst detection" },
    { name: "FRB 121102", position: [-45, 195, -45], color: "#eebb55", description: "First repeater source" },
    { name: "FRB 20180916B", position: [35, -185, 35], color: "#ddcc66", description: "Periodic activity window" },
    { name: "FRB 20200120E", position: [-25, 175, -25], color: "#ccdd77", description: "Globular cluster source" },
    { name: "CHIME FRB", position: [15, -165, 15], color: "#bbee88", description: "Canadian detection array" },
    { name: "ASKAP FRB", position: [-5, 155, -5], color: "#ffbb66", description: "Australian localization" },
    { name: "FRB Cosmology", position: [200, -145, 200], color: "#eecc77", description: "Baryon census application" },
    { name: "Macquart Relation", position: [-195, 135, -195], color: "#dddd88", description: "DM-redshift correlation" },
    { name: "FRB Environment", position: [185, -125, 185], color: "#ccee99", description: "Circumburst medium" },
    { name: "Persistent Radio Source", position: [-175, 115, -175], color: "#bbffaa", description: "Associated nebula emission" },
    { name: "FRB Periodicity", position: [165, -105, 165], color: "#ffcc88", description: "Activity phase windows" },
    { name: "FRB Sub-Burst", position: [-155, 95, 155], color: "#eedd99", description: "Microsecond structure" },
    { name: "Downward Drifting", position: [145, -85, -145], color: "#ddeeaa", description: "Sad trombone pattern" },
    { name: "FRB Energy", position: [-135, 75, -135], color: "#ccffbb", description: "Isotropic equivalent luminosity" },
    { name: "FRB Rate", position: [125, -65, 125], color: "#bbffcc", description: "All-sky event frequency" },
    { name: "LIGO Hanford", position: [-188, 42, -188], color: "#9966ff", description: "4km arm interferometer in Washington" },
    { name: "LIGO Livingston", position: [-186, 40, -186], color: "#9966ff", description: "Louisiana detector with 4km arms" },
    { name: "Virgo Detector", position: [-184, 38, -184], color: "#9966ff", description: "3km European interferometer in Italy" },
    { name: "KAGRA Underground", position: [-182, 36, -182], color: "#9966ff", description: "Japanese cryogenic detector in mine" },
    { name: "GW150914 Event", position: [-180, 34, -180], color: "#cc99ff", description: "First direct gravitational wave detection" },
    { name: "Binary Black Hole", position: [-178, 32, -178], color: "#cc99ff", description: "BBH mergers dominate GW detections" },
    { name: "Chirp Mass", position: [-176, 30, -176], color: "#cc99ff", description: "Best-measured mass combination in GW" },
    { name: "Ringdown Signal (II)", position: [-174, 28, -174], color: "#cc99ff", description: "Post-merger quasinormal mode decay" },
    { name: "Inspiral Phase", position: [-172, 26, -172], color: "#cc99ff", description: "Pre-merger spiral-in waveform" },
    { name: "GW170817 Merger", position: [-170, 24, -170], color: "#ffcc66", description: "First binary neutron star GW event" },
    { name: "Kilonova Counterpart", position: [-168, 22, -168], color: "#ffcc66", description: "Optical transient from BNS merger" },
    { name: "r-Process Nucleosynthesis", position: [-166, 20, -166], color: "#ffcc66", description: "Heavy element creation in mergers" },
    { name: "GRB 170817A", position: [-164, 18, -164], color: "#ffcc66", description: "Short gamma-ray burst from BNS" },
    { name: "NSBH Merger", position: [-162, 16, -162], color: "#ff9966", description: "Neutron star-black hole coalescence" },
    { name: "Mass Gap Objects", position: [-160, 14, -160], color: "#ff9966", description: "Compact objects 3-5 solar masses" },
    { name: "Spin Alignment", position: [-158, 12, -158], color: "#ff9966", description: "Pre-merger spin orientation clues" },
    { name: "Effective Spin", position: [-156, 10, -156], color: "#ff9966", description: "Mass-weighted spin projection" },
    { name: "Luminosity Distance", position: [-154, 8, -154], color: "#66ccff", description: "Standard siren distance measurement" },
    { name: "Sky Localization", position: [-152, 6, -152], color: "#66ccff", description: "Error ellipse from detector network" },
    { name: "EM Follow-up", position: [-150, 4, -150], color: "#66ccff", description: "Multi-messenger counterpart search" },
    { name: "Matched Filtering", position: [-148, 2, -148], color: "#66ccff", description: "Template-based signal extraction" },
    { name: "Strain Sensitivity", position: [-146, 0, -146], color: "#99ffcc", description: "Detector noise curve specification" },
    { name: "Seismic Isolation", position: [-144, -2, -144], color: "#99ffcc", description: "Ground vibration suppression systems" },
    { name: "Quantum Squeezing", position: [-142, -4, -142], color: "#99ffcc", description: "Shot noise reduction technique" },
    { name: "GW Stochastic Background", position: [-140, -6, -140], color: "#99ffcc", description: "Unresolved merger signal superposition" },
    { name: "Chandrasekhar Limit (II)", position: [-138, -8, -138], color: "#ffffff", description: "1.4 solar mass maximum for white dwarfs" },
    { name: "Electron Degeneracy", position: [-136, -10, -136], color: "#ffffff", description: "Pauli exclusion pressure support" },
    { name: "DA White Dwarf (II)", position: [-134, -12, -134], color: "#eeeeff", description: "Hydrogen atmosphere spectral type" },
    { name: "DB White Dwarf (II)", position: [-132, -14, -132], color: "#eeeeff", description: "Helium-dominated atmosphere" },
    { name: "DC White Dwarf", position: [-130, -16, -130], color: "#eeeeff", description: "Continuous spectrum, cool degenerate" },
    { name: "DQ Carbon WD", position: [-128, -18, -128], color: "#ddddff", description: "Carbon-polluted atmosphere" },
    { name: "DZ Metal WD", position: [-126, -20, -126], color: "#ddddff", description: "Metal lines from accreted debris" },
    { name: "Crystallization", position: [-124, -22, -124], color: "#ddddff", description: "Carbon-oxygen core solidification" },
    { name: "WD Cooling Track", position: [-122, -24, -122], color: "#ccccff", description: "Luminosity decay over gigayears" },
    { name: "Mestel Cooling", position: [-120, -26, -120], color: "#ccccff", description: "Simple cooling law approximation" },
    { name: "WD Mass-Radius", position: [-118, -28, -118], color: "#ccccff", description: "Inverse relation from degeneracy" },
    { name: "Gravitational Redshift (II)", position: [-116, -30, -116], color: "#bbbbff", description: "Spectral shift from WD surface gravity" },
    { name: "ZZ Ceti Variables", position: [-114, -32, -114], color: "#bbbbff", description: "DAV pulsating white dwarfs" },
    { name: "V777 Her Variables", position: [-112, -34, -112], color: "#bbbbff", description: "DBV helium-atmosphere pulsators" },
    { name: "GW Vir Stars", position: [-110, -36, -110], color: "#aaaaff", description: "DOV hot pulsating pre-WDs" },
    { name: "WD Asteroseismology", position: [-108, -38, -108], color: "#aaaaff", description: "g-mode probing of interior" },
    { name: "Polluted WD", position: [-106, -40, -106], color: "#aaaaff", description: "Accreted planetary material" },
    { name: "WD Debris Disk", position: [-104, -42, -104], color: "#9999ff", description: "Infrared excess from dust" },
    { name: "Magnetic WD", position: [-102, -44, -102], color: "#9999ff", description: "Fields up to 1 billion gauss" },
    { name: "WD Binary", position: [-100, -46, -100], color: "#9999ff", description: "Double degenerate systems" },
    { name: "AM CVn System (II)", position: [-98, -48, -98], color: "#8888ff", description: "Helium-transferring ultracompact binary" },
    { name: "WD Merger", position: [-96, -50, -96], color: "#8888ff", description: "Type Ia progenitor channel" },
    { name: "Super-Chandra WD", position: [-94, -52, -94], color: "#8888ff", description: "Rotation-supported overluminous WD" },
    { name: "WD Luminosity Function", position: [-92, -54, -92], color: "#7777ff", description: "Age dating via cooling sequence" },
    { name: "WD Initial-Final Mass", position: [-90, -56, -90], color: "#7777ff", description: "Progenitor to remnant mass relation" },
    { name: "Neutron Star EOS", position: [-88, -58, -88], color: "#ff6666", description: "Equation of state at nuclear density" },
    { name: "Nuclear Pasta", position: [-86, -60, -86], color: "#ff6666", description: "Exotic shapes in NS inner crust" },
    { name: "NS Crust", position: [-84, -62, -84], color: "#ff7777", description: "Solid nuclear lattice outer layer" },
    { name: "Neutron Drip", position: [-82, -64, -82], color: "#ff7777", description: "Free neutrons above threshold density" },
    { name: "NS Core Composition", position: [-80, -66, -80], color: "#ff8888", description: "Neutron-rich matter at 2-3 rho_nuc" },
    { name: "Hyperon Puzzle", position: [-78, -68, -78], color: "#ff8888", description: "Strange baryons soften EOS" },
    { name: "Quark Matter Core", position: [-76, -70, -76], color: "#ff9999", description: "Deconfined quarks at high density" },
    { name: "Color Superconductivity", position: [-74, -72, -74], color: "#ff9999", description: "Quark Cooper pairing in NS" },
    { name: "NS Mass-Radius", position: [-72, -74, -72], color: "#ffaaaa", description: "Observable constraining EOS" },
    { name: "Maximum NS Mass", position: [-70, -76, -70], color: "#ffaaaa", description: "TOV limit around 2.2 solar masses" },
    { name: "NICER Constraints", position: [-68, -78, -68], color: "#ffbbbb", description: "X-ray pulse profile modeling" },
    { name: "Neutron Superfluidity", position: [-66, -80, -66], color: "#ffbbbb", description: "Paired neutrons in inner crust" },
    { name: "Proton Superconductivity", position: [-64, -82, -64], color: "#ffcccc", description: "Type II superconductor in core" },
    { name: "Pulsar Glitch (II)", position: [-62, -84, -62], color: "#ffcccc", description: "Sudden spin-up from vortex unpinning" },
    { name: "Vela Glitches", position: [-60, -86, -60], color: "#ffdddd", description: "Frequent large glitches in young pulsar" },
    { name: "Crab Glitches", position: [-58, -88, -58], color: "#ffdddd", description: "Small frequent spin irregularities" },
    { name: "Starquake Model", position: [-56, -90, -56], color: "#ffeeee", description: "Crust cracking from stress buildup" },
    { name: "Vortex Creep", position: [-54, -92, -54], color: "#ffeeee", description: "Post-glitch recovery dynamics" },
    { name: "NS Thermal Evolution", position: [-52, -94, -52], color: "#eeffff", description: "Cooling curves constrain interior" },
    { name: "Direct URCA", position: [-50, -96, -50], color: "#eeffff", description: "Fast neutrino cooling process" },
    { name: "Modified URCA", position: [-48, -98, -48], color: "#ddffff", description: "Standard neutrino emission mechanism" },
    { name: "NS Magnetic Field", position: [-46, -100, -46], color: "#ddffff", description: "Surface fields 10^8 to 10^15 gauss" },
    { name: "Magnetar Field Decay", position: [-44, -102, -44], color: "#ccffff", description: "Ohmic and Hall evolution" },
    { name: "NS Moment of Inertia", position: [-42, -104, -42], color: "#ccffff", description: "Rotational response to torques" },
    { name: "Tidal Deformability (II)", position: [-40, -106, -40], color: "#bbffff", description: "GW constraint on NS compactness" },
    { name: "Hawking Radiation (II)", position: [-38, -108, -38], color: "#111111", description: "Quantum pair creation at horizon" },
    { name: "Bekenstein Entropy", position: [-36, -110, -36], color: "#111111", description: "S proportional to horizon area" },
    { name: "BH Temperature", position: [-34, -112, -34], color: "#222222", description: "T inversely proportional to mass" },
    { name: "Information Paradox", position: [-32, -114, -32], color: "#222222", description: "Unitarity vs thermal radiation" },
    { name: "No-Hair Theorem", position: [-30, -116, -30], color: "#333333", description: "BH characterized by M, J, Q only" },
    { name: "Kerr Solution", position: [-28, -118, -28], color: "#333333", description: "Rotating black hole spacetime" },
    { name: "Ergosphere", position: [-26, -120, -26], color: "#444444", description: "Frame-dragging region outside horizon" },
    { name: "Penrose Process", position: [-24, -122, -24], color: "#444444", description: "Energy extraction from rotation" },
    { name: "BH Superradiance", position: [-22, -124, -22], color: "#555555", description: "Wave amplification by spin" },
    { name: "Schwarzschild Radius", position: [-20, -126, -20], color: "#555555", description: "Event horizon for non-rotating BH" },
    { name: "Photon Sphere (III)", position: [-18, -128, -18], color: "#666666", description: "Unstable circular photon orbits" },
    { name: "ISCO Radius", position: [-16, -130, -16], color: "#666666", description: "Innermost stable circular orbit" },
    { name: "BH Shadow", position: [-14, -132, -14], color: "#777777", description: "Dark silhouette from photon capture" },
    { name: "M87* Image", position: [-12, -134, -12], color: "#777777", description: "EHT first black hole image" },
    { name: "Sgr A* Image", position: [-10, -136, -10], color: "#888888", description: "Milky Way center BH portrait" },
    { name: "BH Spin Measurement", position: [-8, -138, -8], color: "#888888", description: "X-ray reflection fitting method" },
    { name: "Iron K-alpha Line (II)", position: [-6, -140, -6], color: "#999999", description: "Relativistically broadened emission" },
    { name: "Quasi-Periodic Oscillation (III)", position: [-4, -142, -4], color: "#999999", description: "QPO timing from inner disk" },
    { name: "BH X-ray Binary", position: [-2, -144, -2], color: "#aaaaaa", description: "Stellar mass BH with companion" },
    { name: "Cyg X-1", position: [0, -146, 0], color: "#aaaaaa", description: "First confirmed stellar BH" },
    { name: "Intermediate Mass BH", position: [2, -148, 2], color: "#bbbbbb", description: "100-100000 solar mass gap objects" },
    { name: "SMBH Formation", position: [4, -150, 4], color: "#bbbbbb", description: "Seed growth in early universe" },
    { name: "BH Kick", position: [6, -152, 6], color: "#cccccc", description: "Recoil from asymmetric GW emission" },
    { name: "Naked Singularity (III)", position: [8, -154, 8], color: "#cccccc", description: "Cosmic censorship hypothesis" },
    { name: "Firewall Paradox", position: [10, -156, 10], color: "#dddddd", description: "Complementarity vs drama at horizon" },
    { name: "Shakura-Sunyaev Disk", position: [12, -158, 12], color: "#ffaa00", description: "Standard thin disk alpha model" },
    { name: "Alpha Viscosity", position: [14, -160, 14], color: "#ffaa00", description: "Parameterized angular momentum transport" },
    { name: "MRI Instability", position: [16, -162, 16], color: "#ffbb11", description: "Magnetorotational turbulence driver" },
    { name: "Disk Luminosity", position: [18, -164, 18], color: "#ffbb11", description: "Half gravitational energy radiated" },
    { name: "Eddington Limit", position: [20, -166, 20], color: "#ffcc22", description: "Maximum luminosity from radiation pressure" },
    { name: "Super-Eddington Accretion", position: [22, -168, 22], color: "#ffcc22", description: "Photon trapping allows higher rates" },
    { name: "Slim Disk Model", position: [24, -170, 24], color: "#ffdd33", description: "Advection-dominated high accretion" },
    { name: "ADAF Solution", position: [26, -172, 26], color: "#ffdd33", description: "Advection-dominated accretion flow" },
    { name: "RIAF Model", position: [28, -174, 28], color: "#ffee44", description: "Radiatively inefficient hot flow" },
    { name: "Disk Truncation", position: [30, -176, 30], color: "#ffee44", description: "Inner hot flow + outer thin disk" },
    { name: "Disk Wind (II)", position: [32, -178, 32], color: "#ffff55", description: "Magnetically or thermally driven outflow" },
    { name: "Blandford-Znajek", position: [34, -180, 34], color: "#ffff55", description: "Electromagnetic jet extraction from BH" },
    { name: "Blandford-Payne", position: [36, -182, 36], color: "#eeff66", description: "Centrifugally launched disk wind" },
    { name: "Jet Collimation", position: [38, -184, 38], color: "#eeff66", description: "Magnetic hoop stress focusing" },
    { name: "Disk Corona (II)", position: [40, -186, 40], color: "#ddff77", description: "Hot electron population above disk" },
    { name: "Comptonization", position: [42, -188, 42], color: "#ddff77", description: "Photon upscattering by hot electrons" },
    { name: "Reflection Spectrum", position: [44, -190, 44], color: "#ccff88", description: "Corona illumination of cold disk" },
    { name: "Disk Instability (II)", position: [46, -192, 46], color: "#ccff88", description: "Thermal-viscous limit cycle" },
    { name: "Dwarf Nova Outburst", position: [48, -194, 48], color: "#bbff99", description: "CV disk ionization instability" },
    { name: "FU Ori Outburst", position: [50, -196, 50], color: "#bbff99", description: "Protostellar disk accretion burst" },
    { name: "Circumbinary Disk (II)", position: [52, -198, 52], color: "#aaffaa", description: "Disk around binary system" },
    { name: "Gap Opening", position: [54, -200, 54], color: "#aaffaa", description: "Planet-disk gravitational interaction" },
    { name: "Disk Migration", position: [56, -202, 56], color: "#99ffbb", description: "Torque-driven orbital evolution" },
    { name: "Warped Disk", position: [58, -204, 58], color: "#99ffbb", description: "Non-planar disk geometry" },
    { name: "Disk Precession", position: [60, -206, 60], color: "#88ffcc", description: "Lense-Thirring or tidal tilting" },
    { name: "Relativistic Jet (II)", position: [62, -208, 62], color: "#ff00ff", description: "Collimated outflow near light speed" },
    { name: "Jet Lorentz Factor", position: [64, -210, 64], color: "#ff00ff", description: "Bulk motion gamma of 10-50" },
    { name: "Superluminal Motion (II)", position: [66, -212, 66], color: "#ee11ff", description: "Apparent faster-than-light projection" },
    { name: "Doppler Boosting", position: [68, -214, 68], color: "#ee11ff", description: "Relativistic intensity enhancement" },
    { name: "Jet Knots", position: [70, -216, 70], color: "#dd22ff", description: "Bright features from internal shocks" },
    { name: "Hotspot", position: [72, -218, 72], color: "#dd22ff", description: "Terminal shock where jet hits IGM" },
    { name: "FR I Radio Galaxy", position: [74, -220, 74], color: "#cc33ff", description: "Edge-darkened low-power jets" },
    { name: "FR II Radio Galaxy", position: [76, -222, 76], color: "#cc33ff", description: "Edge-brightened powerful jets" },
    { name: "Jet Dichotomy", position: [78, -224, 78], color: "#bb44ff", description: "FR I/II divide near 10^25 W/Hz" },
    { name: "Jet-ISM Interaction", position: [80, -226, 80], color: "#bb44ff", description: "Shocks and triggered star formation" },
    { name: "Jet Power Estimation", position: [82, -228, 82], color: "#aa55ff", description: "Cavity enthalpy and synchrotron age" },
    { name: "X-ray Cavity", position: [84, -230, 84], color: "#aa55ff", description: "Jet-inflated bubble in cluster gas" },
    { name: "Radio Lobe (II)", position: [86, -232, 86], color: "#9966ff", description: "Extended synchrotron emission region" },
    { name: "Jet Precession", position: [88, -234, 88], color: "#9966ff", description: "S-shaped or X-shaped morphology" },
    { name: "Jet Restarting", position: [90, -236, 90], color: "#8877ff", description: "Double-double radio galaxy" },
    { name: "Jet Entrainment", position: [92, -238, 92], color: "#8877ff", description: "Mass loading from stellar winds" },
    { name: "Jet Magnetic Field", position: [94, -240, 94], color: "#7788ff", description: "Helical structure and polarization" },
    { name: "Jet Synchrotron", position: [96, -242, 96], color: "#7788ff", description: "Radio to X-ray nonthermal emission" },
    { name: "Jet IC Emission", position: [98, -244, 98], color: "#6699ff", description: "Inverse Compton X-rays and gamma" },
    { name: "Microblazar", position: [100, -246, 100], color: "#6699ff", description: "Stellar-mass jet pointed at Earth" },
    { name: "SS 433 Jets", position: [102, -248, 102], color: "#55aaff", description: "Precessing relativistic stellar jets" },
    { name: "GRS 1915+105", position: [104, -250, 104], color: "#55aaff", description: "Superluminal galactic microquasar" },
    { name: "Jet Feedback", position: [106, -252, 106], color: "#44bbff", description: "AGN regulation of galaxy growth" },
    { name: "Radio Mode Feedback", position: [108, -254, 108], color: "#44bbff", description: "Maintenance heating of cluster cores" },
    { name: "Jet Composition", position: [110, -256, 110], color: "#33ccff", description: "Electron-positron vs electron-proton" },
    { name: "Sagittarius A*", position: [112, -258, 112], color: "#ffdd00", description: "4 million solar mass central BH" },
    { name: "S-Star Cluster", position: [114, -260, 114], color: "#ffdd00", description: "Stars orbiting Sgr A* closely" },
    { name: "S2 Orbit", position: [116, -262, 116], color: "#ffee11", description: "16-year period at 0.01 pc" },
    { name: "GR Precession S2", position: [118, -264, 118], color: "#ffee11", description: "Schwarzschild precession detected" },
    { name: "Gravitational Redshift S2", position: [120, -266, 120], color: "#ffff22", description: "GR time dilation at pericenter" },
    { name: "Central Parsec", position: [122, -268, 122], color: "#ffff22", description: "Dense nuclear star cluster" },
    { name: "Sgr A* Flares", position: [124, -270, 124], color: "#eeff33", description: "X-ray and NIR variability" },
    { name: "G Objects", position: [126, -272, 126], color: "#eeff33", description: "Dusty sources near Sgr A*" },
    { name: "Circumnuclear Disk (III)", position: [128, -274, 128], color: "#ddff44", description: "Ring of molecular gas at 2-7 pc" },
    { name: "Minispiral", position: [130, -276, 130], color: "#ddff44", description: "Ionized gas streamers near center" },
    { name: "IRS 16 Complex", position: [132, -278, 132], color: "#ccff55", description: "Bright infrared sources" },
    { name: "Central Molecular Zone", position: [134, -280, 134], color: "#ccff55", description: "Dense gas in inner 500 pc" },
    { name: "Sgr B2 Cloud", position: [136, -282, 136], color: "#bbff66", description: "Massive star-forming complex" },
    { name: "Arches Cluster", position: [138, -284, 138], color: "#bbff66", description: "Densest young cluster in Galaxy" },
    { name: "Quintuplet Cluster", position: [140, -286, 140], color: "#aaff77", description: "Massive stars with Pistol nebula" },
    { name: "Pistol Star", position: [142, -288, 142], color: "#aaff77", description: "Luminous blue variable near center" },
    { name: "Galactic Center Arc", position: [144, -290, 144], color: "#99ff88", description: "Radio filaments perpendicular to plane" },
    { name: "Radio Filaments", position: [146, -292, 146], color: "#99ff88", description: "Magnetic flux tubes in GC" },
    { name: "Fermi Bubbles", position: [148, -294, 148], color: "#88ff99", description: "Giant gamma-ray lobes above/below disk" },
    { name: "eROSITA Bubbles", position: [150, -296, 150], color: "#88ff99", description: "X-ray counterpart to Fermi structures" },
    { name: "GC Magnetic Field", position: [152, -298, 152], color: "#77ffaa", description: "Poloidal field in inner region" },
    { name: "X-ray Reflection (II)", position: [154, -300, 154], color: "#77ffaa", description: "Past Sgr A* activity echo" },
    { name: "GC Distance", position: [156, -302, 156], color: "#66ffbb", description: "8.2 kpc from S-star orbits" },
    { name: "Nuclear Star Cluster (IV)", position: [158, -304, 158], color: "#66ffbb", description: "10^7 solar mass stellar concentration" },
    { name: "GC Hypervelocity Star", position: [160, -306, 160], color: "#55ffcc", description: "Ejected by SMBH encounter" },
    { name: "Andromeda Galaxy", position: [162, -308, 162], color: "#aabbff", description: "M31, largest Local Group member" },
    { name: "Triangulum Galaxy (II)", position: [164, -310, 164], color: "#aabbff", description: "M33, third largest spiral" },
    { name: "Large Magellanic Cloud (II)", position: [166, -312, 166], color: "#99ccff", description: "Satellite galaxy at 50 kpc" },
    { name: "Small Magellanic Cloud (II)", position: [168, -314, 168], color: "#99ccff", description: "Irregular dwarf companion" },
    { name: "Magellanic Stream (III)", position: [170, -316, 170], color: "#88ddff", description: "HI gas tail from LMC/SMC" },
    { name: "Magellanic Bridge (III)", position: [172, -318, 172], color: "#88ddff", description: "Gas connecting LMC and SMC" },
    { name: "M32 Compact", position: [174, -320, 174], color: "#77eeff", description: "Compact elliptical near M31" },
    { name: "NGC 205", position: [176, -322, 176], color: "#77eeff", description: "M110 dwarf elliptical" },
    { name: "IC 10 Starburst", position: [178, -324, 178], color: "#66ffff", description: "Irregular with intense star formation" },
    { name: "NGC 6822", position: [180, -326, 180], color: "#66ffff", description: "Barnard's Galaxy irregular" },
    { name: "Sagittarius dSph", position: [182, -328, 182], color: "#55ffee", description: "Merging dwarf spheroidal" },
    { name: "Sagittarius Stream (II)", position: [184, -330, 184], color: "#55ffee", description: "Tidal debris wrapping MW" },
    { name: "Fornax dSph", position: [186, -332, 186], color: "#44ffdd", description: "Dwarf with globular clusters" },
    { name: "Sculptor dSph", position: [188, -334, 188], color: "#44ffdd", description: "Prototype dwarf spheroidal" },
    { name: "Draco dSph", position: [190, -336, 190], color: "#33ffcc", description: "Dark matter dominated satellite" },
    { name: "Ursa Minor dSph", position: [192, -338, 192], color: "#33ffcc", description: "Ancient stellar population" },
    { name: "Carina dSph", position: [194, -340, 194], color: "#22ffbb", description: "Episodic star formation history" },
    { name: "Sextans dSph", position: [196, -342, 196], color: "#22ffbb", description: "Diffuse low surface brightness" },
    { name: "Leo I", position: [198, -344, 198], color: "#11ffaa", description: "Distant MW satellite" },
    { name: "Leo II", position: [200, -346, 200], color: "#11ffaa", description: "Old stellar population dwarf" },
    { name: "Andromeda II", position: [202, -348, 202], color: "#00ff99", description: "M31 satellite dwarf spheroidal" },
    { name: "Pegasus dIrr", position: [204, -350, 204], color: "#00ff99", description: "Isolated dwarf irregular" },
    { name: "Local Group Dynamics", position: [206, -352, 206], color: "#00ff88", description: "MW-M31 approach at 110 km/s" },
    { name: "Local Group Mass", position: [208, -354, 208], color: "#00ff88", description: "~2 trillion solar masses total" },
    { name: "Planes of Satellites", position: [210, -356, 210], color: "#00ff77", description: "Anisotropic satellite distributions" },
    { name: "Ultra-Faint Dwarf (II)", position: [212, -358, 212], color: "#ffaa99", description: "L < 10^5 Lsun galaxies" },
    { name: "Missing Satellites (III)", position: [214, -360, 214], color: "#ffaa99", description: "Fewer dwarfs than CDM predicts" },
    { name: "Too Big to Fail", position: [216, -362, 216], color: "#ffbb88", description: "Massive subhalos without galaxies" },
    { name: "Core-Cusp Problem", position: [218, -364, 218], color: "#ffbb88", description: "Observed cores vs predicted cusps" },
    { name: "Dwarf DM Halos", position: [220, -366, 220], color: "#ffcc77", description: "Dark matter dominated systems" },
    { name: "Stellar Feedback", position: [222, -368, 222], color: "#ffcc77", description: "SN-driven core creation" },
    { name: "Reionization Quenching", position: [224, -370, 224], color: "#ffdd66", description: "UV background suppresses SF" },
    { name: "Tidal Stripping", position: [226, -372, 226], color: "#ffdd66", description: "Mass loss near massive host" },
    { name: "Ram Pressure Stripping (II)", position: [228, -374, 228], color: "#ffee55", description: "Gas removal by hot halo" },
    { name: "Dwarf Morphology-Density", position: [230, -376, 230], color: "#ffee55", description: "dSph near hosts, dIrr isolated" },
    { name: "Dwarf Metallicity", position: [232, -378, 232], color: "#ffff44", description: "Low Z from shallow potential" },
    { name: "Mass-Metallicity dwarfs", position: [234, -380, 234], color: "#ffff44", description: "Steep relation at low mass" },
    { name: "Dwarf Chemical Evolution", position: [236, -382, 236], color: "#eeff33", description: "r-process and alpha elements" },
    { name: "Dwarf Star Formation", position: [238, -384, 238], color: "#eeff33", description: "Bursty episodic histories" },
    { name: "Isolated Dwarf", position: [240, -386, 240], color: "#ddff22", description: "Field dwarfs probe intrinsic evolution" },
    { name: "Backsplash Galaxy (III)", position: [242, -388, 242], color: "#ddff22", description: "Former satellite now beyond virial" },
    { name: "Dwarf Tidal Dwarf", position: [244, -390, 244], color: "#ccff11", description: "Formed from interaction debris" },
    { name: "Blue Compact Dwarf", position: [246, -392, 246], color: "#ccff11", description: "Intense central starburst" },
    { name: "Dwarf Starburst", position: [248, -394, 248], color: "#bbff00", description: "NGC 1569 extreme star formation" },
    { name: "Dwarf AGN", position: [250, -396, 250], color: "#bbff00", description: "Low-mass black holes in dwarfs" },
    { name: "Dwarf Globulars", position: [252, -398, 252], color: "#aaff00", description: "GC systems in low-mass hosts" },
    { name: "Dwarf Rotation", position: [254, -400, 254], color: "#aaff00", description: "Kinematic support in dIrr" },
    { name: "Dwarf Velocity Dispersion", position: [256, -402, 256], color: "#99ff00", description: "Pressure support in dSph" },
    { name: "Dwarf CMD", position: [258, -404, 258], color: "#99ff00", description: "Color-magnitude resolved populations" },
    { name: "Dwarf SFH Method", position: [260, -406, 260], color: "#88ff00", description: "CMD fitting for star formation history" },
    { name: "Tully-Fisher Relation", position: [262, -408, 262], color: "#ff6688", description: "Spiral luminosity vs rotation velocity" },
    { name: "Baryonic Tully-Fisher", position: [264, -410, 264], color: "#ff6688", description: "Including gas mass tightens relation" },
    { name: "Faber-Jackson Relation", position: [266, -412, 266], color: "#ff7799", description: "Elliptical L vs velocity dispersion" },
    { name: "Fundamental Plane", position: [268, -414, 268], color: "#ff7799", description: "3D elliptical parameter space" },
    { name: "M-sigma Relation (II)", position: [270, -416, 270], color: "#ff88aa", description: "SMBH mass vs bulge dispersion" },
    { name: "Magorrian Relation", position: [272, -418, 272], color: "#ff88aa", description: "BH mass vs bulge mass correlation" },
    { name: "Mass-Size Relation", position: [274, -420, 274], color: "#ff99bb", description: "Galaxy radius vs stellar mass" },
    { name: "Size Evolution (II)", position: [276, -422, 276], color: "#ff99bb", description: "Compact galaxies at high z" },
    { name: "Sersic Profile", position: [278, -424, 278], color: "#ffaacc", description: "Generalized surface brightness law" },
    { name: "Sersic Index", position: [280, -426, 280], color: "#ffaacc", description: "n=1 disk, n=4 de Vaucouleurs" },
    { name: "Kormendy Relation", position: [282, -428, 282], color: "#ffbbdd", description: "Effective radius vs surface brightness" },
    { name: "Color-Magnitude Relation", position: [284, -430, 284], color: "#ffbbdd", description: "Red sequence in clusters" },
    { name: "Blue Cloud", position: [286, -432, 286], color: "#6688ff", description: "Star-forming galaxy locus" },
    { name: "Green Valley", position: [288, -434, 288], color: "#88ff88", description: "Transition region in CMD" },
    { name: "Red Sequence", position: [290, -436, 290], color: "#ff8888", description: "Passive galaxy population" },
    { name: "Quenching Mechanisms", position: [292, -438, 292], color: "#ffccee", description: "Processes ending star formation" },
    { name: "Mass Quenching", position: [294, -440, 294], color: "#ffccee", description: "Halo mass threshold effect" },
    { name: "Environmental Quenching (II)", position: [296, -442, 296], color: "#ffddff", description: "Cluster-driven star formation end" },
    { name: "Stellar Mass Function (II)", position: [298, -444, 298], color: "#ffddff", description: "Galaxy abundance vs mass" },
    { name: "Schechter Function", position: [300, -446, 300], color: "#eeccff", description: "Power-law plus exponential cutoff" },
    { name: "Luminosity Function (II)", position: [302, -448, 302], color: "#eeccff", description: "Galaxy counts per magnitude" },
    { name: "Characteristic Luminosity", position: [304, -450, 304], color: "#ddbbff", description: "L* knee in luminosity function" },
    { name: "Baryon Fraction", position: [306, -452, 306], color: "#ddbbff", description: "Stellar mass vs halo mass" },
    { name: "SHMR Relation", position: [308, -454, 308], color: "#ccaaff", description: "Stellar-to-halo mass ratio" },
    { name: "Abundance Matching", position: [310, -456, 310], color: "#ccaaff", description: "Connecting galaxies to halos" },
    { name: "Lyman-alpha Forest", position: [312, -458, 312], color: "#00ccff", description: "IGM HI absorption in QSO spectra" },
    { name: "Gunn-Peterson Trough (V)", position: [314, -460, 314], color: "#00ccff", description: "Complete Ly-alpha absorption at z>6" },
    { name: "Damped Lyman-alpha", position: [316, -462, 316], color: "#11bbff", description: "DLA with N(HI) > 10^20.3 cm^-2" },
    { name: "Sub-DLA System", position: [318, -464, 318], color: "#11bbff", description: "Intermediate column density absorber" },
    { name: "Lyman Limit System", position: [320, -466, 320], color: "#22aaff", description: "LLS with tau > 1 at 912 Angstrom" },
    { name: "Metal Absorption Line (II)", position: [322, -468, 322], color: "#22aaff", description: "CIV, MgII, FeII in QSO spectra" },
    { name: "MgII Absorber", position: [324, -470, 324], color: "#3399ff", description: "Tracer of cool gas halos" },
    { name: "CIV Absorber", position: [326, -472, 326], color: "#3399ff", description: "Tracing circumgalactic medium" },
    { name: "OVI Absorber", position: [328, -474, 328], color: "#4488ff", description: "Warm-hot ionized gas tracer" },
    { name: "Broad Absorption Line", position: [330, -476, 330], color: "#4488ff", description: "BAL QSO with outflow absorption" },
    { name: "Absorber Metallicity", position: [332, -478, 332], color: "#5577ff", description: "Chemical enrichment in CGM" },
    { name: "Proximity Effect", position: [334, -480, 334], color: "#5577ff", description: "Enhanced ionization near QSO" },
    { name: "Transverse Proximity", position: [336, -482, 336], color: "#6666ff", description: "QSO illuminating adjacent sightline" },
    { name: "Absorber Galaxy", position: [338, -484, 338], color: "#6666ff", description: "Host of intervening absorption" },
    { name: "CGM Absorption", position: [340, -486, 340], color: "#7755ff", description: "Circumgalactic medium probing" },
    { name: "Covering Fraction", position: [342, -488, 342], color: "#7755ff", description: "Gas extent around galaxies" },
    { name: "Voigt Profile Fitting", position: [344, -490, 344], color: "#8844ff", description: "Line profile decomposition" },
    { name: "Curve of Growth", position: [346, -492, 346], color: "#8844ff", description: "Equivalent width vs column density" },
    { name: "Line Saturation", position: [348, -494, 348], color: "#9933ff", description: "Flat part of curve of growth" },
    { name: "Doublet Ratio", position: [350, -496, 350], color: "#9933ff", description: "Optical depth from line pairs" },
    { name: "IGM Temperature", position: [352, -498, 352], color: "#aa22ff", description: "Thermal broadening measurement" },
    { name: "IGM Density", position: [354, -500, 354], color: "#aa22ff", description: "Flux decrement statistics" },
    { name: "Baryon Census", position: [356, -502, 356], color: "#bb11ff", description: "Accounting cosmic baryons" },
    { name: "Missing Baryons", position: [358, -504, 358], color: "#bb11ff", description: "Warm-hot IGM reservoir" },
    { name: "QSO Pair Sightline", position: [360, -506, 360], color: "#cc00ff", description: "Correlated absorption study" },
    { name: "Spectral Classification", position: [362, -508, 362], color: "#ffcc00", description: "OBAFGKM temperature sequence" },
    { name: "MK System", position: [364, -510, 364], color: "#ffcc00", description: "Morgan-Keenan luminosity classes" },
    { name: "Luminosity Class I", position: [366, -512, 366], color: "#ffdd11", description: "Supergiants spectral features" },
    { name: "Luminosity Class III", position: [368, -514, 368], color: "#ffdd11", description: "Giant star classification" },
    { name: "Luminosity Class V", position: [370, -516, 370], color: "#ffee22", description: "Main sequence dwarf stars" },
    { name: "Hydrogen Balmer Lines", position: [372, -518, 372], color: "#ffee22", description: "H-alpha to H-delta absorption" },
    { name: "Calcium H and K", position: [374, -520, 374], color: "#ffff33", description: "Ca II resonance doublet" },
    { name: "G Band", position: [376, -522, 376], color: "#ffff33", description: "CH molecular feature" },
    { name: "TiO Bands", position: [378, -524, 378], color: "#eeff44", description: "M-star molecular absorption" },
    { name: "Spectroscopic Binary (III)", position: [380, -526, 380], color: "#eeff44", description: "RV variation reveals companion" },
    { name: "Double-Lined Binary", position: [382, -528, 382], color: "#ddff55", description: "SB2 with both components visible" },
    { name: "Radial Velocity Method", position: [384, -530, 384], color: "#ddff55", description: "Doppler shift measurement" },
    { name: "Cross-Correlation", position: [386, -532, 386], color: "#ccff66", description: "Template matching for RV" },
    { name: "Equivalent Width", position: [388, -534, 388], color: "#ccff66", description: "Line strength measurement" },
    { name: "Line Depth", position: [390, -536, 390], color: "#bbff77", description: "Central absorption intensity" },
    { name: "Spectral Resolution", position: [392, -538, 392], color: "#bbff77", description: "R = lambda/delta-lambda" },
    { name: "Echelle Spectrograph", position: [394, -540, 394], color: "#aaff88", description: "High-resolution cross-dispersed" },
    { name: "Fiber-Fed Spectrograph", position: [396, -542, 396], color: "#aaff88", description: "Multi-object spectroscopy" },
    { name: "Atmospheric Parameters", position: [398, -544, 398], color: "#99ff99", description: "Teff, logg, [Fe/H] determination" },
    { name: "Spectral Synthesis", position: [400, -546, 400], color: "#99ff99", description: "Model atmosphere fitting" },
    { name: "Abundance Analysis", position: [402, -548, 402], color: "#88ffaa", description: "Element-by-element measurement" },
    { name: "NLTE Effects", position: [404, -550, 404], color: "#88ffaa", description: "Non-LTE abundance corrections" },
    { name: "Microturbulence", position: [406, -552, 406], color: "#77ffbb", description: "Small-scale velocity broadening" },
    { name: "Macroturbulence", position: [408, -554, 408], color: "#77ffbb", description: "Large-scale atmospheric motions" },
    { name: "Rotational Broadening", position: [410, -556, 410], color: "#66ffcc", description: "v sin i line profile effect" },
    { name: "Johnson-Cousins UBVRI", position: [-412, 558, -412], color: "#ff9966", description: "Standard broadband photometric system" },
    { name: "Sloan ugriz System", position: [413, -559, 413], color: "#66ff99", description: "SDSS photometric filter set" },
    { name: "Strömgren uvby", position: [-414, 560, -414], color: "#9966ff", description: "Intermediate-band stellar classification" },
    { name: "Washington CMT1T2", position: [415, -561, 415], color: "#ff6699", description: "Metallicity-sensitive photometry" },
    { name: "Vilnius UPXYZVS", position: [-416, 562, -416], color: "#99ff66", description: "Seven-color classification system" },
    { name: "Geneva UB1B2V1G", position: [417, -563, 417], color: "#6699ff", description: "Seven-band reddening-free parameters" },
    { name: "DDO Photometry", position: [-418, 564, -418], color: "#ffcc66", description: "David Dunlap Observatory filter system" },
    { name: "Cousins VRI Extension", position: [419, -565, 419], color: "#66ffcc", description: "Red-infrared photometric extension" },
    { name: "2MASS JHKs", position: [-420, 566, -420], color: "#cc66ff", description: "Near-infrared survey photometry" },
    { name: "WISE W1-W4", position: [421, -567, 421], color: "#ff66cc", description: "Mid-infrared all-sky survey bands" },
    { name: "Spitzer IRAC", position: [-422, 568, -422], color: "#66ccff", description: "3.6-8.0 μm imaging channels" },
    { name: "GALEX FUV NUV", position: [423, -569, 423], color: "#ccff66", description: "Ultraviolet survey photometry" },
    { name: "Hipparcos Hp BT VT", position: [-424, 570, -424], color: "#ff9999", description: "Space astrometry photometric bands" },
    { name: "Gaia G BP RP", position: [425, -571, 425], color: "#99ff99", description: "Gaia mission photometric system" },
    { name: "Pan-STARRS grizy", position: [-426, 572, -426], color: "#9999ff", description: "Wide-field survey filter set" },
    { name: "Photometric Zero Points", position: [427, -573, 427], color: "#ffff99", description: "Magnitude system calibration anchors" },
    { name: "Atmospheric Extinction", position: [-428, 574, -428], color: "#99ffff", description: "Wavelength-dependent light absorption" },
    { name: "Color Transformation", position: [429, -575, 429], color: "#ff99ff", description: "Filter system interconversion" },
    { name: "Aperture Photometry", position: [-430, 576, -430], color: "#ff8866", description: "Fixed-radius flux measurement" },
    { name: "PSF Photometry", position: [431, -577, 431], color: "#66ff88", description: "Point spread function fitting" },
    { name: "Differential Photometry", position: [-432, 578, -432], color: "#8866ff", description: "Relative brightness measurement" },
    { name: "All-Sky Photometry", position: [433, -579, 433], color: "#ff6688", description: "Absolute magnitude calibration" },
    { name: "CCD Linearity", position: [-434, 580, -434], color: "#88ff66", description: "Detector response characterization" },
    { name: "Flat Fielding", position: [435, -581, 435], color: "#6688ff", description: "Pixel sensitivity correction" },
    { name: "Photometric Redshift (II)", position: [-436, 582, -436], color: "#ffaa66", description: "SED-based distance estimation" },
    { name: "Hipparcos Mission", position: [437, -583, 437], color: "#66aaff", description: "First space astrometry satellite" },
    { name: "Gaia DR3", position: [-438, 584, -438], color: "#ffaa99", description: "Billion-star astrometric catalog" },
    { name: "Parallax Measurement", position: [439, -585, 439], color: "#99ffaa", description: "Geometric distance determination" },
    { name: "Proper Motion (II)", position: [-440, 586, -440], color: "#aa99ff", description: "Angular stellar velocity on sky" },
    { name: "Radial Velocity (II)", position: [441, -587, 441], color: "#ffcc99", description: "Line-of-sight motion from Doppler" },
    { name: "Space Velocity (II)", position: [-442, 588, -442], color: "#99ffcc", description: "Full 3D stellar motion vector" },
    { name: "Astrometric Binaries", position: [443, -589, 443], color: "#cc99ff", description: "Orbital wobble detection method" },
    { name: "Reference Frame", position: [-444, 590, -444], color: "#ff99cc", description: "Celestial coordinate system definition" },
    { name: "ICRF Quasars", position: [445, -591, 445], color: "#99ccff", description: "Extragalactic reference frame anchors" },
    { name: "Plate Constants", position: [-446, 592, -446], color: "#ccff99", description: "Photographic position calibration" },
    { name: "Distortion Mapping", position: [447, -593, 447], color: "#ff8877", description: "Optical field aberration correction" },
    { name: "Epoch Propagation", position: [-448, 594, -448], color: "#77ff88", description: "Position prediction over time" },
    { name: "Secular Parallax", position: [449, -595, 449], color: "#8877ff", description: "Solar motion distance method" },
    { name: "Statistical Parallax", position: [-450, 596, -450], color: "#ff7788", description: "Group distance from proper motions" },
    { name: "Moving Cluster Method", position: [451, -597, 451], color: "#88ff77", description: "Convergent point distance technique" },
    { name: "Expansion Parallax", position: [-452, 598, -452], color: "#7788ff", description: "Angular expansion rate distance" },
    { name: "VLBI Astrometry", position: [453, -599, 453], color: "#ffbb77", description: "Microarcsecond radio positions" },
    { name: "Pulsar Timing Astrometry", position: [-454, 600, -454], color: "#77ffbb", description: "Precision position from timing" },
    { name: "Differential Astrometry", position: [455, -601, 455], color: "#bb77ff", description: "Relative position measurement" },
    { name: "Narrow-Angle Astrometry", position: [-456, 602, -456], color: "#ff77bb", description: "High-precision small field technique" },
    { name: "Wide-Angle Astrometry", position: [457, -603, 457], color: "#77bbff", description: "Large-scale position mapping" },
    { name: "CCD Astrometry", position: [-458, 604, -458], color: "#bbff77", description: "Digital detector position measurement" },
    { name: "Atmospheric Refraction", position: [459, -605, 459], color: "#ff9977", description: "Apparent position displacement" },
    { name: "Aberration of Light", position: [-460, 606, -460], color: "#77ff99", description: "Earth motion position shift" },
    { name: "Precession Nutation", position: [461, -607, 461], color: "#9977ff", description: "Earth axis orientation changes" },
    { name: "Rubin Observatory LSST", position: [-462, 608, -462], color: "#ff7799", description: "Wide-fast-deep optical survey" },
    { name: "ZTF Survey", position: [463, -609, 463], color: "#99ff77", description: "Zwicky Transient Facility scanning" },
    { name: "ASAS-SN Network", position: [-464, 610, -464], color: "#7799ff", description: "All-Sky Automated Survey for SNe" },
    { name: "ATLAS Survey", position: [465, -611, 465], color: "#ffbb99", description: "Asteroid impact early warning system" },
    { name: "Pan-STARRS Transients", position: [-466, 612, -466], color: "#99ffbb", description: "Moving object and transient detection" },
    { name: "OGLE Survey (II)", position: [467, -613, 467], color: "#bb99ff", description: "Optical Gravitational Lensing Experiment" },
    { name: "Kepler K2 Mission", position: [-468, 614, -468], color: "#ff99bb", description: "Exoplanet transit photometry" },
    { name: "TESS Mission", position: [469, -615, 469], color: "#99bbff", description: "Transiting Exoplanet Survey Satellite" },
    { name: "CoRoT Mission", position: [-470, 616, -470], color: "#bbff99", description: "Convection Rotation and Transits" },
    { name: "Cadence Strategy", position: [471, -617, 471], color: "#ff8899", description: "Observation scheduling optimization" },
    { name: "Alert Brokers", position: [-472, 618, -472], color: "#99ff88", description: "Transient classification pipelines" },
    { name: "Difference Imaging", position: [473, -619, 473], color: "#8899ff", description: "Template subtraction detection" },
    { name: "Light Curve Classification", position: [-474, 620, -474], color: "#ff9988", description: "ML transient type identification" },
    { name: "Photometric Pipelines", position: [475, -621, 475], color: "#88ff99", description: "Automated flux measurement systems" },
    { name: "Real-Time Processing", position: [-476, 622, -476], color: "#9988ff", description: "Low-latency alert generation" },
    { name: "Survey Depth", position: [477, -623, 477], color: "#ffaa88", description: "Limiting magnitude characteristics" },
    { name: "Survey Footprint", position: [-478, 624, -478], color: "#88ffaa", description: "Sky coverage area design" },
    { name: "Coadded Images", position: [479, -625, 479], color: "#aa88ff", description: "Stacked deep reference images" },
    { name: "Source Extraction", position: [-480, 626, -480], color: "#ff88aa", description: "Object detection algorithms" },
    { name: "Forced Photometry", position: [481, -627, 481], color: "#88aaff", description: "Measurement at known positions" },
    { name: "Survey Uniformity", position: [-482, 628, -482], color: "#aaff88", description: "Calibration homogeneity" },
    { name: "Weather Losses", position: [483, -629, 483], color: "#ff7788", description: "Observing time efficiency" },
    { name: "Data Release", position: [-484, 630, -484], color: "#88ff77", description: "Public catalog publication" },
    { name: "Cross-Matching", position: [485, -631, 485], color: "#7788ff", description: "Multi-catalog source association" },
    { name: "Follow-Up Coordination", position: [-486, 632, -486], color: "#ffcc88", description: "Target of opportunity triggering" },
    { name: "Radio Window", position: [487, -633, 487], color: "#88ccff", description: "1mm to 30m atmospheric transmission" },
    { name: "Infrared Windows", position: [-488, 634, -488], color: "#ffdd88", description: "J H K L M N Q atmospheric bands" },
    { name: "Optical Window", position: [489, -635, 489], color: "#88ffdd", description: "300-700nm transmission range" },
    { name: "UV Cutoff", position: [-490, 636, -490], color: "#dd88ff", description: "Ozone atmospheric absorption edge" },
    { name: "X-ray Astronomy", position: [491, -637, 491], color: "#ff88dd", description: "High energy photon observation" },
    { name: "Gamma-ray Sky", position: [-492, 638, -492], color: "#88ddff", description: "GeV-TeV astrophysics domain" },
    { name: "SED Fitting", position: [493, -639, 493], color: "#ddff88", description: "Spectral energy distribution modeling" },
    { name: "Bolometric Luminosity", position: [-494, 640, -494], color: "#ff9988", description: "Total energy output integration" },
    { name: "Multiwavelength Imaging", position: [495, -641, 495], color: "#99ff88", description: "Cross-band morphology comparison" },
    { name: "Simultaneous Observations", position: [-496, 642, -496], color: "#8899ff", description: "Coordinated multi-facility campaigns" },
    { name: "Chandra Observatory", position: [497, -643, 497], color: "#ffaa99", description: "X-ray imaging spectrometer" },
    { name: "XMM-Newton", position: [-498, 644, -498], color: "#99ffaa", description: "European X-ray Multi-Mirror Mission" },
    { name: "NuSTAR Mission", position: [499, -645, 499], color: "#aa99ff", description: "Hard X-ray focusing telescope" },
    { name: "Fermi LAT", position: [-500, 646, -500], color: "#ff99aa", description: "Large Area Telescope gamma survey" },
    { name: "Swift Observatory", position: [501, -647, 501], color: "#99aaff", description: "Multi-band GRB rapid response" },
    { name: "Hubble UV-Optical", position: [-502, 648, -502], color: "#aaff99", description: "Space telescope imaging" },
    { name: "JWST Infrared", position: [503, -649, 503], color: "#ff8877", description: "Webb infrared observatory" },
    { name: "Spitzer Legacy", position: [-504, 650, -504], color: "#77ff88", description: "Mid-infrared space mission" },
    { name: "Herschel Far-IR", position: [505, -651, 505], color: "#8877ff", description: "Far-infrared/submm observatory" },
    { name: "ALMA Submillimeter", position: [-506, 652, -506], color: "#ff7788", description: "Atacama Large Millimeter Array" },
    { name: "VLA Radio", position: [507, -653, 507], color: "#88ff77", description: "Very Large Array interferometer" },
    { name: "LOFAR Low Frequency", position: [-508, 654, -508], color: "#7788ff", description: "Low-frequency radio array" },
    { name: "MeerKAT Array", position: [509, -655, 509], color: "#ffbb88", description: "South African radio interferometer" },
    { name: "SKA Pathfinders", position: [-510, 656, -510], color: "#88ffbb", description: "Square Kilometre Array precursors" },
    { name: "Panchromatic Atlases", position: [511, -657, 511], color: "#bb88ff", description: "Multi-band source catalogs" },
    { name: "Magnetar Formation", position: [-512, 658, -512], color: "#ff88bb", description: "Proto-neutron star dynamo origin" },
    { name: "SGR Giant Flares", position: [513, -659, 513], color: "#88bbff", description: "Soft gamma repeater mega-bursts" },
    { name: "AXP Pulsations", position: [-514, 660, -514], color: "#bbff88", description: "Anomalous X-ray pulsar timing" },
    { name: "Magnetar Bursts", position: [515, -661, 515], color: "#ff8899", description: "Short X-ray burst activity" },
    { name: "Crustal Fractures", position: [-516, 662, -516], color: "#99ff88", description: "Starquake energy release" },
    { name: "Magnetic Field Decay", position: [517, -663, 517], color: "#8899ff", description: "10^15 G field evolution" },
    { name: "Magnetospheric Twist", position: [-518, 664, -518], color: "#ffcc99", description: "Toroidal field reconfiguration" },
    { name: "Thermal X-ray Emission", position: [519, -665, 519], color: "#99ffcc", description: "Hot neutron star surface" },
    { name: "Hard X-ray Tail", position: [-520, 666, -520], color: "#cc99ff", description: "Non-thermal magnetar emission" },
    { name: "Resonant Cyclotron Scatter", position: [521, -667, 521], color: "#ff99cc", description: "Proton cyclotron absorption" },
    { name: "Magnetar Wind Nebulae", position: [-522, 668, -522], color: "#99ccff", description: "Pulsar wind from magnetars" },
    { name: "Transient Magnetars", position: [523, -669, 523], color: "#ccff99", description: "Newly active magnetar sources" },
    { name: "Magnetar QPOs", position: [-524, 670, -524], color: "#ff7799", description: "Quasi-periodic oscillations in flares" },
    { name: "Seismic Modes", position: [525, -671, 525], color: "#99ff77", description: "Neutron star crust vibrations" },
    { name: "Magnetar-FRB Connection", position: [-526, 672, -526], color: "#7799ff", description: "SGR 1935+2154 radio detection" },
    { name: "Internal Magnetic Field", position: [527, -673, 527], color: "#ffbb77", description: "Toroidal vs poloidal geometry" },
    { name: "Vacuum Birefringence", position: [-528, 674, -528], color: "#77ffbb", description: "QED polarization effect" },
    { name: "Photon Splitting", position: [529, -675, 529], color: "#bb77ff", description: "High-field QED process" },
    { name: "Pair Production", position: [-530, 676, -530], color: "#ff77bb", description: "Gamma-ray conversion in B field" },
    { name: "Magnetar Ages", position: [531, -677, 531], color: "#77bbff", description: "Characteristic vs true age" },
    { name: "Magnetar Population", position: [-532, 678, -532], color: "#bbff77", description: "Galactic census estimates" },
    { name: "Low-Field Magnetars", position: [533, -679, 533], color: "#ff9977", description: "Hidden magnetic energy sources" },
    { name: "Magnetar Glitches", position: [-534, 680, -534], color: "#77ff99", description: "Spin-up timing events" },
    { name: "Outburst Decay", position: [535, -681, 535], color: "#9977ff", description: "Flux relaxation timescales" },
    { name: "Magnetar Spectral Lines", position: [-536, 682, -536], color: "#ffaa77", description: "Ion cyclotron absorption features" },
    { name: "Globular Cluster Systems", position: [537, -683, 537], color: "#77aaff", description: "Ancient spherical star swarms" },
    { name: "Open Cluster Census", position: [-538, 684, -538], color: "#ffaa77", description: "Young disk population groups" },
    { name: "Cluster Color-Magnitude", position: [539, -685, 539], color: "#77ffaa", description: "Isochrone fitting age determination" },
    { name: "Main Sequence Turnoff (II)", position: [-540, 686, -540], color: "#aa77ff", description: "Stellar evolution age indicator" },
    { name: "Horizontal Branch (III)", position: [541, -687, 541], color: "#ff77aa", description: "Helium-burning giant phase" },
    { name: "Blue Stragglers", position: [-542, 688, -542], color: "#77aaff", description: "Anomalously young massive stars" },
    { name: "Cluster Mass Function (II)", position: [543, -689, 543], color: "#aaff77", description: "Initial stellar mass distribution" },
    { name: "Tidal Radius", position: [-544, 690, -544], color: "#ff88aa", description: "Gravitational influence boundary" },
    { name: "Core Collapse", position: [545, -691, 545], color: "#aa88ff", description: "Dynamical cluster evolution" },
    { name: "Mass Segregation", position: [-546, 692, -546], color: "#88ffaa", description: "Heavy star concentration effect" },
    { name: "Cluster Disruption", position: [547, -693, 547], color: "#ffaa88", description: "Tidal stripping processes" },
    { name: "Tidal Tails", position: [-548, 694, -548], color: "#88aaff", description: "Stellar stream formation" },
    { name: "Cluster Metallicity", position: [549, -695, 549], color: "#aaffaa", description: "Chemical abundance patterns" },
    { name: "Multiple Populations", position: [-550, 696, -550], color: "#ffccaa", description: "Light element variations in GCs" },
    { name: "Cluster Dynamics", position: [551, -697, 551], color: "#aaffcc", description: "N-body gravitational evolution" },
    { name: "Binary Fraction", position: [-552, 698, -552], color: "#ccaaff", description: "Close pair stellar populations" },
    { name: "Cluster X-ray Sources", position: [553, -699, 553], color: "#ffaacc", description: "LMXBs in globular clusters" },
    { name: "Millisecond Pulsars in GCs", position: [-554, 700, -554], color: "#aaccff", description: "Recycled neutron stars" },
    { name: "Intermediate Mass BHs", position: [555, -701, 555], color: "#ccffaa", description: "Cluster central black holes" },
    { name: "Pleiades Cluster (II)", position: [-556, 702, -556], color: "#ff9999", description: "Famous young open cluster" },
    { name: "Hyades Cluster", position: [557, -703, 557], color: "#99ff99", description: "Nearest open cluster to Sun" },
    { name: "Omega Centauri", position: [-558, 704, -558], color: "#9999ff", description: "Largest Milky Way globular" },
    { name: "47 Tucanae", position: [559, -705, 559], color: "#ffff99", description: "Bright southern globular cluster" },
    { name: "Palomar Clusters", position: [-560, 706, -560], color: "#99ffff", description: "Faint outer halo globulars" },
    { name: "Young Massive Clusters", position: [561, -707, 561], color: "#ff99ff", description: "Proto-globular cluster candidates" },
    { name: "Isochrone Ages", position: [-562, 708, -562], color: "#ff8888", description: "Stellar evolution track fitting" },
    { name: "Gyrochronology", position: [563, -709, 563], color: "#88ff88", description: "Rotation period age indicator" },
    { name: "Asteroseismic Ages", position: [-564, 710, -564], color: "#8888ff", description: "Oscillation mode age determination" },
    { name: "Lithium Depletion", position: [565, -711, 565], color: "#ffcc88", description: "Li abundance age tracer" },
    { name: "Activity-Age Relations", position: [-566, 712, -566], color: "#88ffcc", description: "Chromospheric decay timescales" },
    { name: "White Dwarf Cooling", position: [567, -713, 567], color: "#cc88ff", description: "Degenerate remnant ages" },
    { name: "Nucleocosmochronology", position: [-568, 714, -568], color: "#ff88cc", description: "Radioactive isotope dating" },
    { name: "Thorium-Uranium Ages", position: [569, -715, 569], color: "#88ccff", description: "r-process element chronometry" },
    { name: "Kinematic Ages", position: [-570, 716, -570], color: "#ccff88", description: "Velocity dispersion evolution" },
    { name: "Chemical Clock (II)", position: [571, -717, 571], color: "#ff9988", description: "Abundance ratio age proxy" },
    { name: "C/N Ratio Dating", position: [-572, 718, -572], color: "#88ff99", description: "Giant star mixing indicator" },
    { name: "Alpha Enhancement (II)", position: [573, -719, 573], color: "#9988ff", description: "SN II vs SN Ia enrichment timing" },
    { name: "Barium Star Ages", position: [-574, 720, -574], color: "#ff8899", description: "s-process transfer timescale" },
    { name: "Chromospheric Age", position: [575, -721, 575], color: "#99ff88", description: "Ca II H&K emission decay" },
    { name: "X-ray Luminosity Age", position: [-576, 722, -576], color: "#8899ff", description: "Coronal activity evolution" },
    { name: "UV Excess Age", position: [577, -723, 577], color: "#ffbb88", description: "Stellar activity indicator" },
    { name: "Eclipsing Binary Ages", position: [-578, 724, -578], color: "#88ffbb", description: "Dynamical mass-radius ages" },
    { name: "Moving Group Ages", position: [579, -725, 579], color: "#bb88ff", description: "Co-moving stellar association" },
    { name: "Expansion Age", position: [-580, 726, -580], color: "#ff88bb", description: "Supernova remnant kinematic age" },
    { name: "Pulsar Characteristic Age", position: [581, -727, 581], color: "#88bbff", description: "Spin-down timescale estimate" },
    { name: "Main Sequence Lifetime (II)", position: [-582, 728, -582], color: "#bbff88", description: "Hydrogen burning duration" },
    { name: "Post-AGB Age", position: [583, -729, 583], color: "#ff7788", description: "Planetary nebula evolution" },
    { name: "Subgiant Timescale", position: [-584, 730, -584], color: "#88ff77", description: "Shell hydrogen burning phase" },
    { name: "Red Clump Age", position: [585, -731, 585], color: "#7788ff", description: "Core helium burning indicator" },
    { name: "Turn-Off Mass Age", position: [-586, 732, -586], color: "#ffcc77", description: "Mass-age relationship calibration" },
    { name: "Stokes Parameters", position: [587, -733, 587], color: "#77ccff", description: "Polarization state description" },
    { name: "Linear Polarization", position: [-588, 734, -588], color: "#ffdd77", description: "Electric field oscillation plane" },
    { name: "Circular Polarization", position: [589, -735, 589], color: "#77ffdd", description: "Rotating electric field vector" },
    { name: "Zeeman Broadening", position: [-590, 736, -590], color: "#dd77ff", description: "Magnetic field line splitting" },
    { name: "Zeeman Doppler Imaging (II)", position: [591, -737, 591], color: "#ff77dd", description: "Stellar surface magnetic mapping" },
    { name: "Paschen-Back Effect", position: [-592, 738, -592], color: "#77ddff", description: "Strong field Zeeman regime" },
    { name: "Hanle Effect", position: [593, -739, 593], color: "#ddff77", description: "Depolarization in magnetic fields" },
    { name: "Faraday Rotation (II)", position: [-594, 740, -594], color: "#ff8899", description: "Polarization angle rotation" },
    { name: "Synchrotron Polarization", position: [595, -741, 595], color: "#99ff88", description: "Relativistic electron emission" },
    { name: "Dust Grain Alignment", position: [-596, 742, -596], color: "#8899ff", description: "Magnetic field dust polarization" },
    { name: "Interstellar Polarization", position: [597, -743, 597], color: "#ffaa88", description: "Dichroic extinction by dust" },
    { name: "Polarimetric Imaging", position: [-598, 744, -598], color: "#88ffaa", description: "Spatially resolved polarization" },
    { name: "Dual-Beam Polarimetry", position: [599, -745, 599], color: "#aa88ff", description: "Simultaneous orthogonal measurement" },
    { name: "Broadband Polarimetry", position: [-600, 746, -600], color: "#ff88aa", description: "Integrated polarization degree" },
    { name: "Spectropolarimetric Survey", position: [601, -747, 601], color: "#88aaff", description: "Stellar magnetic field census" },
    { name: "Magnetic White Dwarfs", position: [-602, 748, -602], color: "#aaff88", description: "MG-field degenerate stars" },
    { name: "Ap Star Magnetism", position: [603, -749, 603], color: "#ff7799", description: "Chemically peculiar star fields" },
    { name: "T Tauri Magnetospheres", position: [-604, 750, -604], color: "#99ff77", description: "Young star magnetic structures" },
    { name: "Hot Jupiter Polarimetry", position: [605, -751, 605], color: "#7799ff", description: "Exoplanet atmospheric scattering" },
    { name: "AGN Polarization", position: [-606, 752, -606], color: "#ffbb77", description: "Hidden nuclei scattered light" },
    { name: "Supernova Polarimetry", position: [607, -753, 607], color: "#77ffbb", description: "Explosion geometry asymmetry" },
    { name: "GRB Polarization", position: [-608, 754, -608], color: "#bb77ff", description: "Jet magnetic field structure" },
    { name: "CMB Polarization", position: [609, -755, 609], color: "#ff77bb", description: "E-mode and B-mode patterns" },
    { name: "Pulsar Polarization", position: [-610, 756, -610], color: "#77bbff", description: "Radio emission beam geometry" },
    { name: "Maser Polarization", position: [611, -757, 611], color: "#bbff77", description: "Magnetic field in star formation" },
    { name: "Coronagraphic Imaging", position: [-612, 758, -612], color: "#ff9977", description: "Stellar light suppression technique" },
    { name: "Lyot Coronagraph", position: [613, -759, 613], color: "#77ff99", description: "Classic amplitude mask design" },
    { name: "Vortex Coronagraph", position: [-614, 760, -614], color: "#9977ff", description: "Phase mask stellar nulling" },
    { name: "Starshade Occulter", position: [615, -761, 615], color: "#ff7799", description: "External spacecraft light blocker" },
    { name: "Speckle Suppression", position: [-616, 762, -616], color: "#99ff77", description: "Quasi-static aberration removal" },
    { name: "Angular Differential Imaging", position: [617, -763, 617], color: "#7799ff", description: "Field rotation speckle subtraction" },
    { name: "Spectral Differential Imaging", position: [-618, 764, -618], color: "#ffaa99", description: "Wavelength-dependent PSF removal" },
    { name: "Reference Star Differential", position: [619, -765, 619], color: "#99ffaa", description: "PSF template subtraction" },
    { name: "Deformable Mirror Control", position: [-620, 766, -620], color: "#aa99ff", description: "Active wavefront correction" },
    { name: "Extreme Adaptive Optics", position: [621, -767, 621], color: "#ff99aa", description: "High-order aberration correction" },
    { name: "SPHERE Instrument", position: [-622, 768, -622], color: "#99aaff", description: "VLT exoplanet imager" },
    { name: "GPI Instrument", position: [623, -769, 623], color: "#aaff99", description: "Gemini Planet Imager" },
    { name: "SCExAO System", position: [-624, 770, -624], color: "#ff8877", description: "Subaru extreme AO coronagraph" },
    { name: "JWST Coronagraphs", position: [625, -771, 625], color: "#77ff88", description: "Webb NIRCam/MIRI masks" },
    { name: "Roman CGI", position: [-626, 772, -626], color: "#8877ff", description: "Nancy Grace Roman coronagraph" },
    { name: "Direct Imaging Survey", position: [627, -773, 627], color: "#ff7788", description: "Young giant exoplanet search" },
    { name: "Debris Disk Imaging", position: [-628, 774, -628], color: "#88ff77", description: "Resolved circumstellar dust" },
    { name: "HR 8799 System", position: [629, -775, 629], color: "#7788ff", description: "Four-planet directly imaged system" },
    { name: "Beta Pictoris Disk (II)", position: [-630, 776, -630], color: "#ffbb99", description: "Edge-on debris disk prototype" },
    { name: "Fomalhaut System", position: [631, -777, 631], color: "#99ffbb", description: "Dusty debris ring architecture" },
    { name: "Point Spread Function (III)", position: [-632, 778, -632], color: "#bb99ff", description: "Optical system impulse response" },
    { name: "Strehl Ratio", position: [633, -779, 633], color: "#ff99bb", description: "Wavefront quality metric" },
    { name: "Contrast Curve", position: [-634, 780, -634], color: "#99bbff", description: "Detection limit vs separation" },
    { name: "Inner Working Angle", position: [635, -781, 635], color: "#bbff99", description: "Minimum detectable separation" },
    { name: "Post-Processing Pipeline (II)", position: [-636, 782, -636], color: "#ffaa88", description: "Image analysis algorithms" },
    { name: "Radio Interferometry (II)", position: [637, -783, 637], color: "#88aaff", description: "Aperture synthesis imaging" },
    { name: "Baseline Calibration", position: [-638, 784, -638], color: "#ffcc99", description: "Antenna pair phase correction" },
    { name: "UV Coverage (II)", position: [639, -785, 639], color: "#99ffcc", description: "Spatial frequency sampling" },
    { name: "CLEAN Algorithm (II)", position: [-640, 786, -640], color: "#cc99ff", description: "Deconvolution imaging method" },
    { name: "Self-Calibration (II)", position: [641, -787, 641], color: "#ff99cc", description: "Iterative phase correction" },
    { name: "Spectral Line Mapping", position: [-642, 788, -642], color: "#99ccff", description: "Velocity-resolved imaging" },
    { name: "Continuum Subtraction", position: [643, -789, 643], color: "#ccff99", description: "Line emission isolation" },
    { name: "Primary Beam (II)", position: [-644, 790, -644], color: "#ff8899", description: "Antenna field of view" },
    { name: "Synthesized Beam", position: [645, -791, 645], color: "#99ff88", description: "Interferometer angular resolution" },
    { name: "Mosaic Imaging (II)", position: [-646, 792, -646], color: "#8899ff", description: "Wide-field radio mapping" },
    { name: "Bandpass Calibration", position: [647, -793, 647], color: "#ffbb99", description: "Frequency response correction" },
    { name: "Flux Calibration", position: [-648, 794, -648], color: "#99ffbb", description: "Absolute brightness scaling" },
    { name: "Polarization Leakage", position: [649, -795, 649], color: "#bb99ff", description: "Cross-hand contamination" },
    { name: "RFI Mitigation", position: [-650, 796, -650], color: "#ff99bb", description: "Radio interference flagging" },
    { name: "Correlator Architecture", position: [651, -797, 651], color: "#99bbff", description: "Signal cross-multiplication" },
    { name: "Phased Array Feed", position: [-652, 798, -652], color: "#bbff99", description: "Multi-beam radio receiver" },
    { name: "Single Dish Mapping", position: [653, -799, 653], color: "#ff7799", description: "Total power radio imaging" },
    { name: "On-The-Fly Mapping", position: [-654, 800, -654], color: "#99ff77", description: "Scanning observation mode" },
    { name: "Position Switching", position: [655, -801, 655], color: "#7799ff", description: "Source-reference baseline" },
    { name: "Frequency Switching", position: [-656, 802, -656], color: "#ffcc77", description: "Spectral baseline technique" },
    { name: "Pulsar Backend", position: [657, -803, 657], color: "#77ffcc", description: "High time resolution recording" },
    { name: "Coherent Dedispersion", position: [-658, 804, -658], color: "#cc77ff", description: "Dispersion removal processing" },
    { name: "Incoherent Dedispersion", position: [659, -805, 659], color: "#ff77cc", description: "Channelized DM correction" },
    { name: "VLBI Correlation", position: [-660, 806, -660], color: "#77ccff", description: "Intercontinental baseline processing" },
    { name: "Fringe Fitting (II)", position: [661, -807, 661], color: "#ccff77", description: "VLBI delay-rate solution" },
    { name: "Submillimeter Galaxies", position: [-662, 808, -662], color: "#ff9988", description: "Dusty high-z starbursts" },
    { name: "SCUBA-2 Camera", position: [663, -809, 663], color: "#88ff99", description: "JCMT bolometer array" },
    { name: "LABOCA Instrument", position: [-664, 810, -664], color: "#9988ff", description: "APEX 870μm camera" },
    { name: "AzTEC Camera", position: [665, -811, 665], color: "#ff8899", description: "1.1mm continuum imager" },
    { name: "NOEMA Array", position: [-666, 812, -666], color: "#99ff88", description: "Northern mm interferometer" },
    { name: "SMA Interferometer", position: [667, -813, 667], color: "#8899ff", description: "Submillimeter Array Hawaii" },
    { name: "IRAM 30m Telescope", position: [-668, 814, -668], color: "#ffaa99", description: "Pico Veleta mm dish" },
    { name: "APEX Telescope", position: [669, -815, 669], color: "#99ffaa", description: "Atacama Pathfinder 12m" },
    { name: "LMT Telescope", position: [-670, 816, -670], color: "#aa99ff", description: "Large Millimeter Telescope Mexico" },
    { name: "Thermal Dust Emission", position: [671, -817, 671], color: "#ff99aa", description: "Modified blackbody spectrum" },
    { name: "Dust Mass Estimation", position: [-672, 818, -672], color: "#99aaff", description: "Submm flux conversion" },
    { name: "Dust Temperature", position: [673, -819, 673], color: "#aaff99", description: "SED peak wavelength indicator" },
    { name: "CO Ladder", position: [-674, 820, -674], color: "#ff7788", description: "Rotational transition sequence" },
    { name: "Dense Gas Tracers", position: [675, -821, 675], color: "#88ff77", description: "HCN HCO+ CS molecules" },
    { name: "Outflow Mapping", position: [-676, 822, -676], color: "#7788ff", description: "Protostellar wind structure" },
    { name: "Protoplanetary Disk Gas", position: [677, -823, 677], color: "#ffbb88", description: "Molecular line kinematics" },
    { name: "Debris Disk Submm", position: [-678, 824, -678], color: "#88ffbb", description: "Cold dust thermal emission" },
    { name: "SZ Effect Mapping", position: [679, -825, 679], color: "#bb88ff", description: "Cluster CMB distortion" },
    { name: "Line Confusion", position: [-680, 826, -680], color: "#ff88bb", description: "Spectral line blending" },
    { name: "Sideband Separation", position: [681, -827, 681], color: "#88bbff", description: "Heterodyne receiver technique" },
    { name: "Atmospheric Windows", position: [-682, 828, -682], color: "#bbff88", description: "350 450 850μm transmission" },
    { name: "Precipitable Water Vapor", position: [683, -829, 683], color: "#ff9977", description: "Atmospheric opacity driver" },
    { name: "Opacity Correction", position: [-684, 830, -684], color: "#77ff99", description: "Atmospheric transmission calibration" },
    { name: "Pointing Model", position: [685, -831, 685], color: "#9977ff", description: "Telescope alignment correction" },
    { name: "Focus Optimization", position: [-686, 832, -686], color: "#ffaa77", description: "Subreflector position tuning" },
    { name: "Hubble Space Telescope", position: [687, -833, 687], color: "#77aaff", description: "Iconic UV-optical-NIR observatory" },
    { name: "James Webb Space Telescope", position: [-688, 834, -688], color: "#ffbb77", description: "6.5m infrared space telescope" },
    { name: "Spitzer Space Telescope", position: [689, -835, 689], color: "#77ffbb", description: "Cryogenic IR observatory legacy" },
    { name: "Chandra X-ray Observatory", position: [-690, 836, -690], color: "#bb77ff", description: "High-resolution X-ray imaging" },
    { name: "XMM-Newton Observatory", position: [691, -837, 691], color: "#ff77bb", description: "Large collecting area X-ray" },
    { name: "Fermi Gamma-ray Telescope", position: [-692, 838, -692], color: "#77bbff", description: "GeV gamma-ray all-sky survey" },
    { name: "Planck Mission", position: [693, -839, 693], color: "#bbff77", description: "CMB anisotropy mapping" },
    { name: "WMAP Mission", position: [-694, 840, -694], color: "#ff9988", description: "Wilkinson microwave probe" },
    { name: "COBE Satellite", position: [695, -841, 695], color: "#88ff99", description: "CMB blackbody discovery" },
    { name: "Gaia Mission", position: [-696, 842, -696], color: "#9988ff", description: "Billion-star astrometry survey" },
    { name: "Euclid Mission", position: [697, -843, 697], color: "#ff8899", description: "Dark energy survey telescope" },
    { name: "Roman Space Telescope (II)", position: [-698, 844, -698], color: "#99ff88", description: "Wide-field infrared survey" },
    { name: "IXPE Mission", position: [699, -845, 699], color: "#8899ff", description: "X-ray polarimetry explorer" },
    { name: "NICER Instrument", position: [-700, 846, -700], color: "#ffaa88", description: "Neutron star interior probe" },
    { name: "eROSITA Survey", position: [701, -847, 701], color: "#88ffaa", description: "All-sky X-ray telescope" },
    { name: "INTEGRAL Mission", position: [-702, 848, -702], color: "#aa88ff", description: "Gamma-ray spectroscopy imager" },
    { name: "NuSTAR Telescope", position: [703, -849, 703], color: "#ff88aa", description: "Hard X-ray focusing optics" },
    { name: "Swift Observatory (II)", position: [-704, 850, -704], color: "#88aaff", description: "GRB rapid response mission" },
    { name: "TESS Mission Survey", position: [705, -851, 705], color: "#aaff88", description: "All-sky exoplanet transit search" },
    { name: "Kepler Mission Legacy", position: [-706, 852, -706], color: "#ff7799", description: "Exoplanet occurrence rates" },
    { name: "CHEOPS Mission", position: [707, -853, 707], color: "#99ff77", description: "Exoplanet characterization satellite" },
    { name: "PLATO Mission", position: [-708, 854, -708], color: "#7799ff", description: "Planetary transits oscillations" },
    { name: "Ariel Mission", position: [709, -855, 709], color: "#ffcc88", description: "Atmospheric characterization IR" },
    { name: "JWST NIRCam", position: [-710, 856, -710], color: "#88ffcc", description: "Near-infrared camera instrument" },
    { name: "JWST MIRI", position: [711, -857, 711], color: "#cc88ff", description: "Mid-infrared instrument" },
    { name: "Very Large Telescope", position: [720, -860, 720], color: "#8855ff", description: "ESO's flagship 4x8.2m array at Paranal" },
    { name: "VLT Interferometer", position: [725, -862, 725], color: "#8866ff", description: "Coherent beam combination for high resolution" },
    { name: "Keck Observatory", position: [730, -864, 730], color: "#8877ff", description: "Twin 10m segmented mirrors on Mauna Kea" },
    { name: "Keck Adaptive Optics", position: [735, -866, 735], color: "#8888ff", description: "Laser guide star AO system" },
    { name: "Gemini North", position: [740, -868, 740], color: "#8899ff", description: "8.1m telescope on Mauna Kea" },
    { name: "Gemini South", position: [745, -870, 745], color: "#88aaff", description: "8.1m telescope at Cerro Pachón" },
    { name: "Subaru Telescope", position: [750, -872, 750], color: "#88bbff", description: "8.2m NAOJ telescope with Hyper Suprime-Cam" },
    { name: "Gran Telescopio Canarias", position: [755, -874, 755], color: "#88ccff", description: "10.4m segmented mirror at La Palma" },
    { name: "Large Binocular Telescope", position: [760, -876, 760], color: "#88ddff", description: "Twin 8.4m mirrors on single mount" },
    { name: "Magellan Telescopes", position: [765, -878, 765], color: "#88eeff", description: "Twin 6.5m telescopes at Las Campanas" },
    { name: "MMT Observatory", position: [770, -880, 770], color: "#77ddff", description: "6.5m monolithic mirror on Mt. Hopkins" },
    { name: "Hobby-Eberly Telescope", position: [775, -882, 775], color: "#77ccff", description: "10m fixed-altitude segmented mirror" },
    { name: "Southern African Large Telescope", position: [780, -884, 780], color: "#77bbff", description: "11m segmented mirror in South Africa" },
    { name: "Anglo-Australian Telescope", position: [785, -886, 785], color: "#77aaff", description: "3.9m telescope at Siding Spring" },
    { name: "Canada-France-Hawaii Telescope", position: [790, -888, 790], color: "#7799ff", description: "3.6m telescope with MegaCam" },
    { name: "European Extremely Large Telescope", position: [795, -890, 795], color: "#7788ff", description: "39m future flagship under construction" },
    { name: "Thirty Meter Telescope (II)", position: [800, -892, 800], color: "#7777ff", description: "30m segmented next-gen observatory" },
    { name: "Giant Magellan Telescope (II)", position: [805, -894, 805], color: "#6688ff", description: "7x8.4m mirror segments" },
    { name: "ALMA Observatory", position: [810, -896, 810], color: "#6699ff", description: "66 antennas for submm interferometry" },
    { name: "NOEMA Interferometer", position: [815, -898, 815], color: "#66aaff", description: "Northern Extended Millimeter Array" },
    { name: "Submillimeter Array", position: [820, -900, 820], color: "#66bbff", description: "8-element submm array on Mauna Kea" },
    { name: "IRAM 30m Telescope (II)", position: [825, -902, 825], color: "#66ccff", description: "Millimeter single-dish in Spain" },
    { name: "Green Bank Telescope", position: [830, -904, 830], color: "#66ddff", description: "100m fully steerable radio dish" },
    { name: "Arecibo Observatory", position: [835, -906, 835], color: "#66eeff", description: "Iconic 305m dish (collapsed 2020)" },
    { name: "FAST Radio Telescope", position: [840, -908, 840], color: "#55eeff", description: "500m Chinese aperture synthesis dish" },
    { name: "ESPRESSO Spectrograph", position: [845, -910, 845], color: "#55ddff", description: "Ultra-stable RV spectrograph at VLT" },
    { name: "HARPS Spectrograph", position: [850, -912, 850], color: "#55ccff", description: "High Accuracy Radial velocity Planet Searcher" },
    { name: "HARPS-N", position: [855, -914, 855], color: "#55bbff", description: "Northern HARPS at TNG" },
    { name: "HIRES Spectrograph", position: [860, -916, 860], color: "#55aaff", description: "Keck high-resolution echelle" },
    { name: "UVES Spectrograph", position: [865, -918, 865], color: "#5599ff", description: "UV-Visual Echelle at VLT" },
    { name: "X-Shooter", position: [870, -920, 870], color: "#5588ff", description: "UV to K-band single-shot spectrograph" },
    { name: "MUSE Integral Field", position: [875, -922, 875], color: "#5577ff", description: "Multi Unit Spectroscopic Explorer" },
    { name: "KMOS Spectrograph", position: [880, -924, 880], color: "#4488ff", description: "K-band Multi Object Spectrograph" },
    { name: "MOSFIRE", position: [885, -926, 885], color: "#4499ff", description: "Multi-Object Spectrometer for Infrared" },
    { name: "DEIMOS Spectrograph", position: [890, -928, 890], color: "#44aaff", description: "Deep Imaging Multi-Object Spectrograph" },
    { name: "LRIS Spectrograph", position: [895, -930, 895], color: "#44bbff", description: "Low Resolution Imaging Spectrometer" },
    { name: "FORS2", position: [900, -932, 900], color: "#44ccff", description: "FOcal Reducer and Spectrograph" },
    { name: "GMOS Spectrograph", position: [905, -934, 905], color: "#44ddff", description: "Gemini Multi-Object Spectrograph" },
    { name: "NIRES Spectrograph", position: [910, -936, 910], color: "#44eeff", description: "Near-Infrared Echellette" },
    { name: "NIRSPEC Keck", position: [915, -938, 915], color: "#33eeff", description: "Near-Infrared Spectrometer" },
    { name: "CRIRES+", position: [920, -940, 920], color: "#33ddff", description: "Cryogenic IR Echelle Spectrograph upgrade" },
    { name: "GRAVITY Interferometer", position: [925, -942, 925], color: "#33ccff", description: "VLTI beam combiner for astrometry" },
    { name: "MATISSE Interferometer", position: [930, -944, 930], color: "#33bbff", description: "Mid-infrared VLTI instrument" },
    { name: "SPHERE Imager", position: [935, -946, 935], color: "#33aaff", description: "Exoplanet high-contrast imager" },
    { name: "GPI Imager", position: [940, -948, 940], color: "#3399ff", description: "Gemini Planet Imager" },
    { name: "SCExAO System (II)", position: [945, -950, 945], color: "#3388ff", description: "Subaru Coronagraphic Extreme AO" },
    { name: "MagAO-X", position: [950, -952, 950], color: "#3377ff", description: "Magellan Extreme Adaptive Optics" },
    { name: "NACO Imager", position: [955, -954, 955], color: "#2288ff", description: "NAOS-CONICA AO camera" },
    { name: "NIRC2 Camera", position: [960, -956, 960], color: "#2299ff", description: "Keck near-IR camera" },
    { name: "WFC3 HST", position: [965, -958, 965], color: "#22aaff", description: "Wide Field Camera 3" },
    { name: "CCD Technology", position: [970, -960, 970], color: "#22bbff", description: "Charge-coupled device detectors" },
    { name: "CMOS Detectors", position: [975, -962, 975], color: "#22ccff", description: "Complementary metal-oxide-semiconductor" },
    { name: "InGaAs Arrays", position: [980, -964, 980], color: "#22ddff", description: "Indium gallium arsenide near-IR sensors" },
    { name: "HgCdTe Detectors", position: [985, -966, 985], color: "#22eeff", description: "Mercury cadmium telluride IR arrays" },
    { name: "Superconducting Detectors", position: [990, -968, 990], color: "#11eeff", description: "MKIDs and TES bolometers" },
    { name: "Photon Counting", position: [995, -970, 995], color: "#11ddff", description: "Single-photon avalanche diodes" },
    { name: "Electron Multiplying CCD", position: [1000, -972, 1000], color: "#11ccff", description: "EMCCDs for low-light imaging" },
    { name: "Adaptive Secondary Mirrors", position: [1005, -974, 1005], color: "#11bbff", description: "Deformable mirrors for AO" },
    { name: "Laser Guide Stars", position: [1010, -976, 1010], color: "#11aaff", description: "Artificial reference stars for AO" },
    { name: "Multi-Conjugate AO", position: [1015, -978, 1015], color: "#1199ff", description: "Wide-field adaptive optics" },
    { name: "Ground Layer AO", position: [1020, -980, 1020], color: "#1188ff", description: "Correcting lowest turbulence layer" },
    { name: "Lucky Imaging (II)", position: [1025, -982, 1025], color: "#1177ff", description: "Short exposure selection technique" },
    { name: "Speckle Interferometry", position: [1030, -984, 1030], color: "#0088ff", description: "Beating atmospheric blurring" },
    { name: "Aperture Masking", position: [1035, -986, 1035], color: "#0099ff", description: "Non-redundant mask interferometry" },
    { name: "Nulling Interferometry (II)", position: [1040, -988, 1040], color: "#00aaff", description: "Starlight suppression technique" },
    { name: "SDSS Survey", position: [1045, -990, 1045], color: "#00bbff", description: "Sloan Digital Sky Survey legacy" },
    { name: "Pan-STARRS Survey", position: [1050, -992, 1050], color: "#00ccff", description: "Panoramic Survey Telescope" },
    { name: "DES Survey", position: [1055, -994, 1055], color: "#00ddff", description: "Dark Energy Survey" },
    { name: "DECaLS Survey", position: [1060, -996, 1060], color: "#00eeff", description: "DECam Legacy Survey" },
    { name: "DESI Survey", position: [1065, -998, 1065], color: "#00eeff", description: "Dark Energy Spectroscopic Instrument" },
    { name: "4MOST Survey", position: [1070, -1000, 1070], color: "#00ddee", description: "4-metre Multi-Object Spectrograph" },
    { name: "WEAVE Survey", position: [1075, -1002, 1075], color: "#00ccee", description: "WHT Enhanced Area Velocity Explorer" },
    { name: "PFS Survey", position: [1080, -1004, 1080], color: "#00bbee", description: "Prime Focus Spectrograph" },
    { name: "LSST Camera", position: [1085, -1006, 1085], color: "#00aaee", description: "3.2 gigapixel Rubin Observatory camera" },
    { name: "HSC Survey", position: [1090, -1008, 1090], color: "#0099ee", description: "Hyper Suprime-Cam Survey" },
    { name: "MAST Archive", position: [1095, -1010, 1095], color: "#0088ee", description: "Mikulski Archive for Space Telescopes" },
    { name: "ESO Archive", position: [1100, -1012, 1100], color: "#0077ee", description: "European Southern Observatory data" },
    { name: "IRSA Archive", position: [1105, -1014, 1105], color: "#0066ee", description: "NASA/IPAC Infrared Science Archive" },
    { name: "HEASARC Archive", position: [1110, -1016, 1110], color: "#0055ee", description: "High Energy Astrophysics data" },
    { name: "CDS Strasbourg", position: [1115, -1018, 1115], color: "#0044ee", description: "Centre de Données astronomiques" },
    { name: "NED Database", position: [1120, -1020, 1120], color: "#0033ee", description: "NASA Extragalactic Database" },
    { name: "SIMBAD Database", position: [1125, -1022, 1125], color: "#0022ee", description: "Astronomical object database" },
    { name: "VizieR Catalog Service", position: [1130, -1024, 1130], color: "#0011ee", description: "Astronomical catalog repository" },
    { name: "Astropy Library", position: [1135, -1026, 1135], color: "#1100ee", description: "Core Python astronomy package" },
    { name: "AstroPy Affiliated", position: [1140, -1028, 1140], color: "#2200ee", description: "Ecosystem of astro packages" },
    { name: "IRAF Legacy", position: [1145, -1030, 1145], color: "#3300ee", description: "Image Reduction and Analysis Facility" },
    { name: "DS9 Viewer", position: [1150, -1032, 1150], color: "#4400ee", description: "SAOImage astronomical visualization" },
    { name: "TOPCAT Tool", position: [1155, -1034, 1155], color: "#5500ee", description: "Table cross-matching and plotting" },
    { name: "Aladin Sky Atlas", position: [1160, -1036, 1160], color: "#6600ee", description: "Interactive sky atlas" },
    { name: "CASA Pipeline", position: [1165, -1038, 1165], color: "#7700ee", description: "Common Astronomy Software Applications" },
    { name: "AIPS Software", position: [1170, -1040, 1170], color: "#8800ee", description: "Astronomical Image Processing System" },
    { name: "MIRIAD Package", position: [1175, -1042, 1175], color: "#9900ee", description: "Radio interferometry reduction" },
    { name: "SExtractor", position: [1180, -1044, 1180], color: "#aa00ee", description: "Source Extractor for photometry" },
    { name: "DAOPHOT Package", position: [1185, -1046, 1185], color: "#bb00ee", description: "Crowded field photometry" },
    { name: "GALFIT Modeling", position: [1190, -1048, 1190], color: "#cc00ee", description: "Galaxy light profile fitting" },
    { name: "pPXF Spectroscopy", position: [1195, -1050, 1195], color: "#dd00ee", description: "Penalized Pixel-Fitting" },
    { name: "CLOUDY Simulation", position: [1200, -1052, 1200], color: "#ee00ee", description: "Photoionization modeling code" },
    { name: "MAPPINGS Code", position: [1205, -1054, 1205], color: "#ee00dd", description: "Shock and photoionization" },
    { name: "Prospector SED", position: [1210, -1056, 1210], color: "#ee00cc", description: "Bayesian SED fitting" },
    { name: "CIGALE SED Fitting", position: [1215, -1058, 1215], color: "#ee00bb", description: "Code Investigating GALaxy Emission" },
    { name: "Monte Carlo Methods", position: [1220, -1060, 1220], color: "#ee00aa", description: "Random sampling simulations" },
    { name: "MCMC Fitting", position: [1225, -1062, 1225], color: "#ee0099", description: "Markov Chain Monte Carlo inference" },
    { name: "Nested Sampling", position: [1230, -1064, 1230], color: "#ee0088", description: "Bayesian evidence computation" },
    { name: "N-body Simulations", position: [1235, -1066, 1235], color: "#ee0077", description: "Gravitational dynamics codes" },
    { name: "SPH Methods", position: [1240, -1068, 1240], color: "#ee0066", description: "Smoothed Particle Hydrodynamics" },
    { name: "AMR Codes", position: [1245, -1070, 1245], color: "#ee0055", description: "Adaptive Mesh Refinement" },
    { name: "Radiative Transfer (II)", position: [1250, -1072, 1250], color: "#ee0044", description: "Light propagation through media" },
    { name: "MHD Simulations", position: [1255, -1074, 1255], color: "#ee0033", description: "Magnetohydrodynamic codes" },
    { name: "Cosmological Boxes", position: [1260, -1076, 1260], color: "#ee0022", description: "Large-scale structure simulations" },
    { name: "Zoom-in Simulations", position: [1265, -1078, 1265], color: "#ee0011", description: "High-resolution galaxy formation" },
    { name: "Semi-Analytic Models", position: [1270, -1080, 1270], color: "#ee1100", description: "Simplified galaxy evolution" },
    { name: "Machine Learning Astro", position: [1275, -1082, 1275], color: "#ee2200", description: "Neural networks in astronomy" },
    { name: "Image Classification", position: [1280, -1084, 1280], color: "#ee3300", description: "Galaxy morphology with CNNs" },
    { name: "Anomaly Detection", position: [1285, -1086, 1285], color: "#ee4400", description: "Finding unusual objects" },
    { name: "Spectral Analysis ML", position: [1290, -1088, 1290], color: "#ee5500", description: "Deep learning for spectra" },
    { name: "Citizen Science", position: [1295, -1090, 1295], color: "#ee6600", description: "Galaxy Zoo and Zooniverse" },
    { name: "Discovery of Pulsars", position: [1300, -1092, 1300], color: "#ee7700", description: "Bell Burnell 1967" },
    { name: "Discovery of CMB", position: [1305, -1094, 1305], color: "#ee8800", description: "Penzias & Wilson 1965" },
    { name: "Discovery of Exoplanets", position: [1310, -1096, 1310], color: "#ee9900", description: "Mayor & Queloz 1995" },
    { name: "Discovery of Dark Energy", position: [1315, -1098, 1315], color: "#eeaa00", description: "Supernova cosmology 1998" },
    { name: "First Gravitational Waves", position: [1320, -1100, 1320], color: "#eebb00", description: "LIGO 2015 detection" },
    { name: "First Black Hole Image", position: [1325, -1102, 1325], color: "#eecc00", description: "EHT M87* 2019" },
    { name: "Hubble Deep Field (II)", position: [1330, -1104, 1330], color: "#eedd00", description: "Iconic 1995 exposure" },
    { name: "Pale Blue Dot", position: [1335, -1106, 1335], color: "#eeee00", description: "Voyager 1 Earth image" },
    { name: "Golden Record", position: [1340, -1108, 1340], color: "#ffee00", description: "Voyager interstellar message" },
    { name: "Galileo Galilei Legacy", position: [1345, -1110, 1345], color: "#ffdd00", description: "Father of observational astronomy" },
    { name: "Copernicus Revolution", position: [1350, -1112, 1350], color: "#ffcc00", description: "Heliocentric model pioneer" },
    { name: "Kepler Laws (II)", position: [1355, -1114, 1355], color: "#ffbb00", description: "Planetary motion foundations" },
    { name: "Newton Principia (II)", position: [1360, -1116, 1360], color: "#ffaa00", description: "Universal gravitation theory" },
    { name: "Einstein Relativity", position: [1365, -1118, 1365], color: "#ff9900", description: "Spacetime and gravity unified" },
    { name: "Hubble Expansion (II)", position: [1370, -1120, 1370], color: "#ff8800", description: "Expanding universe discovery" },
    { name: "Chandrasekhar Limit (III)", position: [1375, -1122, 1375], color: "#ff7700", description: "White dwarf mass limit" },
    { name: "Eddington Stellar Models", position: [1380, -1124, 1380], color: "#ff6600", description: "Stellar structure theory" },
    { name: "Sagan Cosmos", position: [1385, -1126, 1385], color: "#ff5500", description: "Science communication pioneer" },
    { name: "Hawking Radiation (III)", position: [1390, -1128, 1390], color: "#ff4400", description: "Black hole thermodynamics" },
    { name: "Vera Rubin Dark Matter", position: [1395, -1130, 1395], color: "#ff3300", description: "Galaxy rotation curves" },
    { name: "Cecilia Payne Composition", position: [1400, -1132, 1400], color: "#ff2200", description: "Stellar hydrogen abundance" },
    { name: "Annie Jump Cannon", position: [1405, -1134, 1405], color: "#ff1100", description: "Spectral classification system" },
    { name: "Henrietta Leavitt", position: [1410, -1136, 1410], color: "#ff0011", description: "Cepheid period-luminosity" },
    { name: "Jocelyn Bell Burnell", position: [1415, -1138, 1415], color: "#ff0022", description: "Pulsar discovery" },
    { name: "Andrea Ghez", position: [1420, -1140, 1420], color: "#ff0033", description: "Galactic center black hole" },
    { name: "Kip Thorne", position: [1425, -1142, 1425], color: "#ff0044", description: "Gravitational wave theory" },
    { name: "Rainer Weiss", position: [1430, -1144, 1430], color: "#ff0055", description: "LIGO laser interferometry" },
    { name: "Barry Barish", position: [1435, -1146, 1435], color: "#ff0066", description: "LIGO project leadership" },
    { name: "Jim Peebles", position: [1440, -1148, 1440], color: "#ff0077", description: "Physical cosmology foundations" },
    { name: "Roger Penrose", position: [1445, -1150, 1445], color: "#ff0088", description: "Singularity theorems" },
    { name: "Reinhard Genzel", position: [1450, -1152, 1450], color: "#ff0099", description: "Sgr A* mass measurement" },
    { name: "Didier Queloz", position: [1455, -1154, 1455], color: "#ff00aa", description: "51 Pegasi b discovery" },
    { name: "Michel Mayor", position: [1460, -1156, 1460], color: "#ff00bb", description: "Exoplanet pioneer" },
    { name: "Saul Perlmutter", position: [1465, -1158, 1465], color: "#ff00cc", description: "Accelerating expansion" },
    { name: "Greenwich Observatory", position: [1470, -1160, 1470], color: "#ff00dd", description: "Prime meridian origin" },
    { name: "Paris Observatory", position: [1475, -1162, 1475], color: "#ff00ee", description: "Oldest active observatory" },
    { name: "Yerkes Observatory", position: [1480, -1164, 1480], color: "#ee00ff", description: "Largest refracting telescope" },
    { name: "Mount Wilson Observatory", position: [1485, -1166, 1485], color: "#dd00ff", description: "Hubble expansion discovery site" },
    { name: "Palomar Observatory", position: [1490, -1168, 1490], color: "#cc00ff", description: "200-inch Hale Telescope" },
    { name: "Lick Observatory", position: [1495, -1170, 1495], color: "#bb00ff", description: "Historic Mt. Hamilton site" },
    { name: "Lowell Observatory", position: [1500, -1172, 1500], color: "#aa00ff", description: "Pluto discovery site" },
    { name: "McDonald Observatory", position: [1505, -1174, 1505], color: "#9900ff", description: "Dark sky Texas site" },
    { name: "Kitt Peak National", position: [1510, -1176, 1510], color: "#8800ff", description: "Arizona observing complex" },
    { name: "Cerro Tololo", position: [1515, -1178, 1515], color: "#7700ff", description: "Chilean southern observatory" },
    { name: "La Silla Observatory", position: [1520, -1180, 1520], color: "#6600ff", description: "ESO first site" },
    { name: "Paranal Observatory", position: [1525, -1182, 1525], color: "#5500ff", description: "VLT home in Chile" },
    { name: "Mauna Kea Observatories", position: [1530, -1184, 1530], color: "#4400ff", description: "Hawaiian summit complex" },
    { name: "Roque de los Muchachos", position: [1535, -1186, 1535], color: "#3300ff", description: "Canary Islands site" },
    { name: "Sutherland Observatory", position: [1540, -1188, 1540], color: "#2200ff", description: "South African site" },
    { name: "Siding Spring Observatory", position: [1545, -1190, 1545], color: "#1100ff", description: "Australian dark sky" },
    { name: "Atacama Desert Sites", position: [1550, -1192, 1550], color: "#0011ff", description: "Driest observatory region" },
    { name: "Antarctic Observatories", position: [1555, -1194, 1555], color: "#0022ff", description: "South Pole telescope sites" },
    { name: "Stonehenge Alignment", position: [1560, -1196, 1560], color: "#0033ff", description: "Ancient astronomical monument" },
    { name: "Newgrange Passage", position: [1565, -1198, 1565], color: "#0044ff", description: "Winter solstice alignment" },
    { name: "Chichen Itza", position: [1570, -1200, 1570], color: "#0055ff", description: "Maya astronomical observatory" },
    { name: "Jantar Mantar", position: [1575, -1202, 1575], color: "#0066ff", description: "Indian astronomical instruments" },
    { name: "Beijing Ancient Observatory", position: [1580, -1204, 1580], color: "#0077ff", description: "Ming Dynasty instruments" },
    { name: "Ulugh Beg Observatory", position: [1585, -1206, 1585], color: "#0088ff", description: "Medieval Samarkand site" },
    { name: "Tycho Brahe Uraniborg", position: [1590, -1208, 1590], color: "#0099ff", description: "Island observatory 1576" },
    { name: "Solar Eclipses", position: [1595, -1210, 1595], color: "#00aaff", description: "Moon blocking Sun alignment" },
    { name: "Lunar Eclipses", position: [1600, -1212, 1600], color: "#00bbff", description: "Earth shadow on Moon" },
    { name: "Transit Events", position: [1605, -1214, 1605], color: "#00ccff", description: "Planet crossing stellar disk" },
    { name: "Occultation Events", position: [1610, -1216, 1610], color: "#00ddff", description: "Body hiding another object" },
    { name: "Conjunction Events", position: [1615, -1218, 1615], color: "#00eeff", description: "Apparent close approaches" },
    { name: "Opposition Events", position: [1620, -1220, 1620], color: "#00ffee", description: "Planet opposite to Sun" },
    { name: "Perihelion Passage", position: [1625, -1222, 1625], color: "#00ffdd", description: "Closest solar approach" },
    { name: "Aphelion Distance", position: [1630, -1224, 1630], color: "#00ffcc", description: "Farthest from Sun point" },
    { name: "Equinox Events", position: [1635, -1226, 1635], color: "#00ffbb", description: "Equal day and night" },
    { name: "Solstice Events", position: [1640, -1228, 1640], color: "#00ffaa", description: "Longest/shortest days" },
    { name: "Precession Cycle", position: [1645, -1230, 1645], color: "#00ff99", description: "26000 year Earth wobble" },
    { name: "Nutation Effects", position: [1650, -1232, 1650], color: "#00ff88", description: "Short-period axis wobble" },
    { name: "Aberration of Light (II)", position: [1655, -1234, 1655], color: "#00ff77", description: "Earth motion effect" },
    { name: "Stellar Parallax", position: [1660, -1236, 1660], color: "#00ff66", description: "Distance by apparent shift" },
    { name: "Atmospheric Refraction (II)", position: [1665, -1238, 1665], color: "#00ff55", description: "Air bending starlight" },
    { name: "Scintillation Effects", position: [1670, -1240, 1670], color: "#00ff44", description: "Twinkling from turbulence" },
    { name: "Airglow Emission", position: [1675, -1242, 1675], color: "#00ff33", description: "Faint atmospheric light" },
    { name: "Zodiacal Light (III)", position: [1680, -1244, 1680], color: "#00ff22", description: "Interplanetary dust glow" },
    { name: "Gegenschein (II)", position: [1685, -1246, 1685], color: "#00ff11", description: "Anti-solar dust glow" },
    { name: "Light Pollution", position: [1690, -1248, 1690], color: "#11ff00", description: "Artificial sky brightness" },
    { name: "Dark Sky Preserves", position: [1695, -1250, 1695], color: "#22ff00", description: "Protected observing sites" },
    { name: "Bortle Scale", position: [1700, -1252, 1700], color: "#33ff00", description: "Sky darkness rating" },
    { name: "Limiting Magnitude", position: [1705, -1254, 1705], color: "#44ff00", description: "Faintest visible star" },
    { name: "Airmass Calculation", position: [1710, -1256, 1710], color: "#55ff00", description: "Atmospheric path length" },
    { name: "Extinction Correction", position: [1715, -1258, 1715], color: "#66ff00", description: "Atmosphere absorption fix" },
    { name: "Apollo Program", position: [1720, -1260, 1720], color: "#77ff00", description: "Human lunar exploration" },
    { name: "Voyager Program", position: [1725, -1262, 1725], color: "#88ff00", description: "Grand tour of outer planets" },
    { name: "Pioneer Missions", position: [1730, -1264, 1730], color: "#99ff00", description: "First outer planet flybys" },
    { name: "Cassini-Huygens", position: [1735, -1266, 1735], color: "#aaff00", description: "Saturn system exploration" },
    { name: "Galileo Mission", position: [1740, -1268, 1740], color: "#bbff00", description: "Jupiter orbiter and probe" },
    { name: "Juno Mission", position: [1745, -1270, 1745], color: "#ccff00", description: "Jupiter polar orbiter" },
    { name: "New Horizons", position: [1750, -1272, 1750], color: "#ddff00", description: "Pluto and Kuiper Belt flyby" },
    { name: "Mars Rovers", position: [1755, -1274, 1755], color: "#eeff00", description: "Spirit, Opportunity, Curiosity, Perseverance" },
    { name: "Mars Reconnaissance", position: [1760, -1276, 1760], color: "#ffee00", description: "High-resolution imaging orbiter" },
    { name: "Mars Express", position: [1765, -1278, 1765], color: "#ffdd00", description: "ESA Mars orbiter" },
    { name: "Venus Express", position: [1770, -1280, 1770], color: "#ffcc00", description: "ESA Venus atmosphere study" },
    { name: "Akatsuki Mission", position: [1775, -1282, 1775], color: "#ffbb00", description: "JAXA Venus orbiter" },
    { name: "BepiColombo", position: [1780, -1284, 1780], color: "#ffaa00", description: "Mercury dual orbiter mission" },
    { name: "MESSENGER Mission", position: [1785, -1286, 1785], color: "#ff9900", description: "Mercury orbiter mapping" },
    { name: "Dawn Mission", position: [1790, -1288, 1790], color: "#ff8800", description: "Vesta and Ceres orbiter" },
    { name: "OSIRIS-REx", position: [1795, -1290, 1795], color: "#ff7700", description: "Asteroid sample return" },
    { name: "Hayabusa Missions", position: [1800, -1292, 1800], color: "#ff6600", description: "Asteroid sample return JAXA" },
    { name: "Rosetta Mission", position: [1805, -1294, 1805], color: "#ff5500", description: "Comet 67P orbiter and lander" },
    { name: "Deep Impact", position: [1810, -1296, 1810], color: "#ff4400", description: "Comet impactor experiment" },
    { name: "Stardust Mission", position: [1815, -1298, 1815], color: "#ff3300", description: "Comet dust sample return" },
    { name: "Parker Solar Probe", position: [1820, -1300, 1820], color: "#ff2200", description: "Touching the Sun corona" },
    { name: "Solar Orbiter", position: [1825, -1302, 1825], color: "#ff1100", description: "ESA close solar imaging" },
    { name: "STEREO Mission", position: [1830, -1304, 1830], color: "#ff0011", description: "Solar stereoscopic imaging" },
    { name: "SOHO Observatory", position: [1835, -1306, 1835], color: "#ff0022", description: "Solar and Heliospheric Observer" },
    { name: "SDO Mission", position: [1840, -1308, 1840], color: "#ff0033", description: "Solar Dynamics Observatory" },
    { name: "Kepler Mission", position: [1845, -1310, 1845], color: "#ff0044", description: "Exoplanet transit hunter" },
    { name: "K2 Extended Mission", position: [1850, -1312, 1850], color: "#ff0055", description: "Kepler ecliptic survey" },
    { name: "TESS Mission (II)", position: [1855, -1314, 1855], color: "#ff0066", description: "All-sky exoplanet survey" },
    { name: "CHEOPS Mission (II)", position: [1860, -1316, 1860], color: "#ff0077", description: "Exoplanet characterization" },
    { name: "PLATO Mission (II)", position: [1865, -1318, 1865], color: "#ff0088", description: "Future rocky planet finder" },
    { name: "Ariel Mission (II)", position: [1870, -1320, 1870], color: "#ff0099", description: "Exoplanet atmospheres study" },
    { name: "Roman Space Telescope (III)", position: [1875, -1322, 1875], color: "#ff00aa", description: "Wide field infrared survey" },
    { name: "Euclid Mission (II)", position: [1880, -1324, 1880], color: "#ff00bb", description: "Dark energy mapping" },
    { name: "Gaia Mission (II)", position: [1885, -1326, 1885], color: "#ff00cc", description: "Billion star astrometry" },
    { name: "Hipparcos Mission (II)", position: [1890, -1328, 1890], color: "#ff00dd", description: "First astrometry satellite" },
    { name: "Spitzer Legacy (II)", position: [1895, -1330, 1895], color: "#ff00ee", description: "Infrared space telescope" },
    { name: "Herschel Observatory", position: [1900, -1332, 1900], color: "#ee00ff", description: "Far-infrared and submm" },
    { name: "Planck Mission (II)", position: [1905, -1334, 1905], color: "#dd00ff", description: "CMB precision mapping" },
    { name: "WMAP Mission (II)", position: [1910, -1336, 1910], color: "#cc00ff", description: "CMB anisotropy probe" },
    { name: "COBE Satellite (II)", position: [1915, -1338, 1915], color: "#bb00ff", description: "CMB discovery confirmation" },
    { name: "IRAS Mission", position: [1920, -1340, 1920], color: "#aa00ff", description: "First infrared all-sky survey" },
    { name: "WISE Mission", position: [1925, -1342, 1925], color: "#9900ff", description: "Wide-field infrared survey" },
    { name: "NEOWISE Extension", position: [1930, -1344, 1930], color: "#8800ff", description: "Near-Earth object hunter" },
    { name: "XMM-Newton (II)", position: [1935, -1346, 1935], color: "#7700ff", description: "X-ray Multi-Mirror Mission" },
    { name: "Chandra Observatory (II)", position: [1940, -1348, 1940], color: "#6600ff", description: "X-ray sharp imaging" },
    { name: "NuSTAR Mission (II)", position: [1945, -1350, 1945], color: "#5500ff", description: "Hard X-ray focusing telescope" },
    { name: "NICER Instrument (II)", position: [1950, -1352, 1950], color: "#4400ff", description: "Neutron star X-ray timing" },
    { name: "IXPE Mission (II)", position: [1955, -1354, 1955], color: "#3300ff", description: "X-ray polarimetry explorer" },
    { name: "Swift Observatory (III)", position: [1960, -1356, 1960], color: "#2200ff", description: "Gamma-ray burst hunter" },
    { name: "Fermi Gamma-ray", position: [1965, -1358, 1965], color: "#1100ff", description: "High-energy gamma-ray sky" },
    { name: "O-type Stars", position: [1970, -1360, 1970], color: "#0011ff", description: "Hot blue massive stars" },
    { name: "B-type Stars", position: [1975, -1362, 1975], color: "#0022ff", description: "Blue-white luminous stars" },
    { name: "A-type Stars", position: [1980, -1364, 1980], color: "#0033ff", description: "White hydrogen-line stars" },
    { name: "F-type Stars", position: [1985, -1366, 1985], color: "#0044ff", description: "Yellow-white main sequence" },
    { name: "G-type Stars", position: [1990, -1368, 1990], color: "#0055ff", description: "Yellow Sun-like stars" },
    { name: "K-type Stars", position: [1995, -1370, 1995], color: "#0066ff", description: "Orange cool dwarfs" },
    { name: "M-type Stars", position: [2000, -1372, 2000], color: "#0077ff", description: "Red dwarf majority" },
    { name: "L-type Dwarfs", position: [2005, -1374, 2005], color: "#0088ff", description: "Cool brown dwarfs" },
    { name: "T-type Dwarfs", position: [2010, -1376, 2010], color: "#0099ff", description: "Methane brown dwarfs" },
    { name: "Y-type Dwarfs", position: [2015, -1378, 2015], color: "#00aaff", description: "Coldest brown dwarfs" },
    { name: "Wolf-Rayet Stars", position: [2020, -1380, 2020], color: "#00bbff", description: "Hot massive wind stars" },
    { name: "Carbon Stars", position: [2025, -1382, 2025], color: "#00ccff", description: "C-rich red giants" },
    { name: "S-type Stars", position: [2030, -1384, 2030], color: "#00ddff", description: "Intermediate abundance giants" },
    { name: "Barium Stars", position: [2035, -1386, 2035], color: "#00eeff", description: "Enhanced heavy elements" },
    { name: "Ap/Bp Stars", position: [2040, -1388, 2040], color: "#00ffee", description: "Chemically peculiar magnetic" },
    { name: "Am Stars", position: [2045, -1390, 2045], color: "#00ffdd", description: "Metallic-line A stars" },
    { name: "Lambda Bootis Stars", position: [2050, -1392, 2050], color: "#00ffcc", description: "Metal-poor A stars" },
    { name: "Be Stars", position: [2055, -1394, 2055], color: "#00ffbb", description: "B stars with emission" },
    { name: "Herbig Ae/Be Stars", position: [2060, -1396, 2060], color: "#00ffaa", description: "Pre-main sequence A/B" },
    { name: "T Tauri Stars", position: [2065, -1398, 2065], color: "#00ff99", description: "Pre-main sequence cool" },
    { name: "FU Orionis Stars", position: [2070, -1400, 2070], color: "#00ff88", description: "Eruptive young stars" },
    { name: "Luminous Blue Variables", position: [2075, -1402, 2075], color: "#00ff77", description: "Massive unstable giants" },
    { name: "Yellow Hypergiants", position: [2080, -1404, 2080], color: "#00ff66", description: "Rare cool supergiants" },
    { name: "Red Supergiants", position: [2085, -1406, 2085], color: "#00ff55", description: "Betelgeuse-type evolved stars" },
    { name: "Blue Supergiants", position: [2090, -1408, 2090], color: "#00ff44", description: "Luminous hot evolved stars" },
    { name: "Orion Nebula", position: [2095, -1410, 2095], color: "#00ff33", description: "M42 iconic stellar nursery" },
    { name: "Eagle Nebula", position: [2100, -1412, 2100], color: "#00ff22", description: "M16 Pillars of Creation" },
    { name: "Carina Nebula", position: [2105, -1414, 2105], color: "#00ff11", description: "Massive star-forming complex" },
    { name: "Lagoon Nebula", position: [2110, -1416, 2110], color: "#11ff00", description: "M8 emission nebula" },
    { name: "Trifid Nebula", position: [2115, -1418, 2115], color: "#22ff00", description: "M20 emission and reflection" },
    { name: "Rosette Nebula", position: [2120, -1420, 2120], color: "#33ff00", description: "Rose-shaped H II region" },
    { name: "Tarantula Nebula", position: [2125, -1422, 2125], color: "#44ff00", description: "30 Doradus LMC starburst" },
    { name: "Horsehead Nebula", position: [2130, -1424, 2130], color: "#55ff00", description: "B33 dark silhouette" },
    { name: "Flame Nebula", position: [2135, -1426, 2135], color: "#66ff00", description: "NGC 2024 near Alnitak" },
    { name: "North America Nebula (III)", position: [2140, -1428, 2140], color: "#77ff00", description: "NGC 7000 emission region" },
    { name: "Pelican Nebula", position: [2145, -1430, 2145], color: "#88ff00", description: "IC 5070 emission region" },
    { name: "Soul Nebula", position: [2150, -1432, 2150], color: "#99ff00", description: "IC 1848 emission nebula" },
    { name: "Heart Nebula", position: [2155, -1434, 2155], color: "#aaff00", description: "IC 1805 emission nebula" },
    { name: "Omega Nebula", position: [2160, -1436, 2160], color: "#bbff00", description: "M17 Swan Nebula" },
    { name: "California Nebula", position: [2165, -1438, 2165], color: "#ccff00", description: "NGC 1499 emission nebula" },
    { name: "Cone Nebula", position: [2170, -1440, 2170], color: "#ddff00", description: "NGC 2264 dark pillar" },
    { name: "Witch Head Nebula (II)", position: [2175, -1442, 2175], color: "#eeff00", description: "IC 2118 reflection nebula" },
    { name: "Ghost Nebula", position: [2180, -1444, 2180], color: "#ffee00", description: "Sh2-136 reflection nebula" },
    { name: "Iris Nebula", position: [2185, -1446, 2185], color: "#ffdd00", description: "NGC 7023 reflection nebula" },
    { name: "Cave Nebula", position: [2190, -1448, 2190], color: "#ffcc00", description: "Sh2-155 emission nebula" },
    { name: "Bubble Nebula", position: [2195, -1450, 2195], color: "#ffbb00", description: "NGC 7635 stellar wind bubble" },
    { name: "Crescent Nebula", position: [2200, -1452, 2200], color: "#ffaa00", description: "NGC 6888 Wolf-Rayet shell" },
    { name: "Cocoon Nebula", position: [2205, -1454, 2205], color: "#ff9900", description: "IC 5146 star-forming region" },
    { name: "Elephant Trunk Nebula (II)", position: [2210, -1456, 2210], color: "#ff8800", description: "IC 1396A dark globule" },
    { name: "Pillars of Creation (III)", position: [2215, -1458, 2215], color: "#ff7700", description: "Iconic M16 star-forming towers" },
    { name: "Ring Nebula (M57)", position: [2420, -180, 2380], color: "#00CED1", description: "Classic planetary nebula in Lyra with distinctive ring shape" },
    { name: "Helix Nebula (NGC 7293)", position: [-2380, 170, 2420], color: "#FF6347", description: "Closest large planetary nebula, Eye of God appearance" },
    { name: "Cat's Eye Nebula (NGC 6543)", position: [2380, -160, -2420], color: "#7B68EE", description: "Complex planetary nebula with intricate structure" },
    { name: "Dumbbell Nebula (M27)", position: [-2420, 190, -2380], color: "#20B2AA", description: "First planetary nebula discovered, apple-core shape" },
    { name: "Owl Nebula (M97)", position: [2360, -140, 2440], color: "#98FB98", description: "Planetary nebula in Ursa Major with owl-like appearance" },
    { name: "Eskimo Nebula (NGC 2392)", position: [-2440, 200, 2360], color: "#87CEEB", description: "Planetary nebula resembling face surrounded by parka hood" },
    { name: "Saturn Nebula (NGC 7009)", position: [2400, -200, -2400], color: "#FFD700", description: "Planetary nebula with ansae resembling Saturn's rings" },
    { name: "Blue Snowball Nebula (NGC 7662)", position: [-2400, 180, -2400], color: "#4169E1", description: "Compact bright planetary nebula in Andromeda" },
    { name: "Ghost of Jupiter (NGC 3242)", position: [2340, -120, 2460], color: "#00FA9A", description: "Planetary nebula similar in size to Jupiter" },
    { name: "Little Gem Nebula (NGC 6818)", position: [-2460, 210, 2340], color: "#FF69B4", description: "Small bright planetary nebula in Sagittarius" },
    { name: "Blinking Planetary (NGC 6826)", position: [2320, -100, -2480], color: "#40E0D0", description: "Planetary nebula that appears to blink when observed" },
    { name: "Bug Nebula (NGC 6302)", position: [-2480, 220, -2320], color: "#DC143C", description: "Bipolar planetary nebula shaped like butterfly" },
    { name: "Red Spider Nebula (NGC 6537)", position: [2300, -80, 2500], color: "#FF4500", description: "Bipolar planetary with fastest stellar winds known" },
    { name: "Ant Nebula (Mz 3)", position: [-2500, 230, 2300], color: "#FF8C00", description: "Bipolar planetary nebula resembling ant head and body" },
    { name: "Stingray Nebula (Hen 3-1357)", position: [2280, -60, -2520], color: "#32CD32", description: "Youngest known planetary nebula" },
    { name: "Retina Nebula (IC 4406)", position: [-2520, 240, -2280], color: "#BA55D3", description: "Cylindrical planetary nebula seen from side" },
    { name: "Medusa Nebula (Abell 21)", position: [2260, -40, 2540], color: "#FF1493", description: "Large ancient planetary nebula with filamentary structure" },
    { name: "Lemon Slice Nebula (IC 3568)", position: [-2540, 250, 2260], color: "#FFFF00", description: "Nearly spherical planetary nebula" },
    { name: "Necklace Nebula", position: [2240, -20, -2560], color: "#00BFFF", description: "Planetary nebula with ring of bright knots" },
    { name: "Calabash Nebula (OH 231.8+4.2)", position: [-2560, 260, -2240], color: "#FFA500", description: "Protoplanetary nebula transitioning from AGB star" },
    { name: "Boomerang Nebula", position: [2220, 0, 2580], color: "#E6E6FA", description: "Coldest known natural place in universe at 1K" },
    { name: "Egg Nebula (RAFGL 2688)", position: [-2580, 270, 2220], color: "#F5DEB3", description: "Protoplanetary nebula with searchlight beams" },
    { name: "Cotton Candy Nebula (IRAS 17150-3224)", position: [2200, 20, -2600], color: "#FFB6C1", description: "Protoplanetary nebula with dusty torus" },
    { name: "Frosty Leo Nebula", position: [-2600, 280, -2200], color: "#B0E0E6", description: "Protoplanetary nebula with water ice grains" },
    { name: "Red Rectangle Nebula (HD 44179)", position: [2180, 40, 2620], color: "#FF0000", description: "Protoplanetary nebula with unique X-shaped structure" },
    { name: "Crab Nebula (M1)", position: [2640, -40, 2180], color: "#FF6B6B", description: "Remnant of SN 1054 with central pulsar, most studied SNR" },
    { name: "Cassiopeia A", position: [-2180, 60, 2640], color: "#4ECDC4", description: "Youngest known Galactic SNR, strong radio source" },
    { name: "Tycho's Supernova Remnant", position: [2660, -60, -2160], color: "#45B7D1", description: "Remnant of SN 1572 observed by Tycho Brahe" },
    { name: "Kepler's Supernova Remnant", position: [-2160, 80, -2660], color: "#96CEB4", description: "Remnant of SN 1604, last naked-eye Galactic supernova" },
    { name: "Veil Nebula Complex (II)", position: [2680, -80, 2140], color: "#DDA0DD", description: "Large ancient supernova remnant in Cygnus" },
    { name: "Cygnus Loop", position: [-2140, 100, 2680], color: "#98D8C8", description: "Spherical shock wave from supernova 10,000 years ago" },
    { name: "SN 1987A Remnant", position: [2700, -100, -2120], color: "#F7DC6F", description: "Most recent nearby supernova, extensively studied" },
    { name: "Puppis A", position: [-2120, 120, -2700], color: "#BB8FCE", description: "Oxygen-rich supernova remnant with central neutron star" },
    { name: "IC 443 (Jellyfish Nebula)", position: [2720, -120, 2100], color: "#85C1E9", description: "SNR interacting with molecular cloud" },
    { name: "W49B", position: [-2100, 140, 2720], color: "#F1948A", description: "Youngest known mixed-morphology supernova remnant" },
    { name: "G1.9+0.3", position: [2740, -140, -2080], color: "#82E0AA", description: "Most recent supernova in Milky Way, discovered 2008" },
    { name: "RCW 103", position: [-2080, 160, -2740], color: "#F8C471", description: "SNR containing unusual central compact object" },
    { name: "Simeis 147 (Spaghetti Nebula)", position: [2760, -160, 2060], color: "#D7BDE2", description: "Large faint supernova remnant with filamentary structure" },
    { name: "W44", position: [-2060, 180, 2760], color: "#AED6F1", description: "Mixed-morphology SNR, cosmic ray accelerator" },
    { name: "CTB 37A", position: [2780, -180, -2040], color: "#F9E79F", description: "Supernova remnant with evidence of cosmic ray acceleration" },
    { name: "3C 58", position: [-2040, 200, -2780], color: "#A3E4D7", description: "SNR possibly from SN 1181, contains fast pulsar" },
    { name: "MSH 15-52 (Hand of God)", position: [2800, -200, 2020], color: "#FAD7A0", description: "SNR with hand-shaped X-ray emission" },
    { name: "G11.2-0.3", position: [-2020, 220, 2800], color: "#D5DBDB", description: "Young shell-type supernova remnant" },
    { name: "Kes 75", position: [2820, -220, -2000], color: "#FADBD8", description: "SNR containing youngest known pulsar" },
    { name: "SNR 0509-67.5", position: [-2000, 240, -2820], color: "#E8DAEF", description: "Type Ia supernova remnant in Large Magellanic Cloud" },
    { name: "N132D", position: [2840, -240, 1980], color: "#D4E6F1", description: "Oxygen-rich SNR in Large Magellanic Cloud" },
    { name: "1E 0102.2-7219", position: [-1980, 260, 2840], color: "#D5F5E3", description: "Young oxygen-rich SNR in Small Magellanic Cloud" },
    { name: "RX J1713.7-3946", position: [2860, -260, -1960], color: "#FCF3CF", description: "Shell-type SNR, strong TeV gamma-ray source" },
    { name: "HESS J1731-347", position: [-1960, 280, -2860], color: "#EBDEF0", description: "TeV gamma-ray supernova remnant" },
    { name: "SN 1006 Remnant", position: [2880, -280, 1940], color: "#FDEBD0", description: "Brightest recorded supernova, still visible as faint remnant" },
    { name: "Andromeda Galaxy (M31)", position: [2900, -300, -1920], color: "#9B59B6", description: "Nearest major spiral galaxy, will merge with Milky Way" },
    { name: "Triangulum Galaxy (M33)", position: [-1920, 300, 2900], color: "#3498DB", description: "Third-largest galaxy in Local Group" },
    { name: "Sombrero Galaxy (M104)", position: [2920, -320, 1900], color: "#E74C3C", description: "Spiral galaxy with prominent dust lane and bright nucleus" },
    { name: "Whirlpool Galaxy (M51)", position: [-1900, 320, -2920], color: "#1ABC9C", description: "Classic face-on spiral with interacting companion" },
    { name: "Pinwheel Galaxy (M101)", position: [2940, -340, -1880], color: "#F39C12", description: "Large face-on spiral with asymmetric structure" },
    { name: "Bode's Galaxy (M81)", position: [-1880, 340, 2940], color: "#8E44AD", description: "Grand design spiral galaxy in Ursa Major" },
    { name: "Cigar Galaxy (M82)", position: [2960, -360, 1860], color: "#E91E63", description: "Starburst galaxy with strong infrared emission" },
    { name: "Centaurus A (NGC 5128)", position: [-1860, 360, -2960], color: "#009688", description: "Nearest giant elliptical, prominent dust lane and jets" },
    { name: "NGC 1300", position: [2980, -380, -1840], color: "#FF5722", description: "Prototype barred spiral galaxy" },
    { name: "Cartwheel Galaxy", position: [-1840, 380, 2980], color: "#00BCD4", description: "Ring galaxy formed by collision, spoke-like features" },
    { name: "Hoag's Object", position: [3000, -400, 1820], color: "#CDDC39", description: "Rare ring galaxy with perfect circular structure" },
    { name: "NGC 4676 (The Mice)", position: [-1820, 400, -3000], color: "#9C27B0", description: "Pair of merging galaxies with long tidal tails" },
    { name: "Antennae Galaxies (NGC 4038/4039)", position: [3020, -420, -1800], color: "#FF9800", description: "Interacting galaxies with dramatic tidal tails" },
    { name: "Tadpole Galaxy (UGC 10214)", position: [-1800, 420, 3020], color: "#4CAF50", description: "Disrupted spiral with 280,000 light-year tail" },
    { name: "Black Eye Galaxy (M64)", position: [3040, -440, 1780], color: "#795548", description: "Spiral with dramatic dark band of dust" },
    { name: "Sunflower Galaxy (M63)", position: [-1780, 440, -3040], color: "#FFC107", description: "Flocculent spiral with multiple spiral arm segments" },
    { name: "Leo Triplet", position: [3060, -460, -1760], color: "#607D8B", description: "Galaxy group with M65, M66, and NGC 3628" },
    { name: "Stephan's Quintet", position: [-1760, 460, 3060], color: "#E040FB", description: "First compact galaxy group discovered" },
    { name: "Sculptor Galaxy (NGC 253)", position: [3080, -480, 1740], color: "#00E676", description: "Starburst galaxy, brightest in Sculptor Group" },
    { name: "NGC 1365", position: [-1740, 480, -3080], color: "#FF4081", description: "Great Barred Spiral in Fornax Cluster" },
    { name: "M87 (Virgo A)", position: [3100, -500, -1720], color: "#536DFE", description: "Giant elliptical with supermassive black hole, first imaged" },
    { name: "NGC 4889", position: [-1720, 500, 3100], color: "#FFAB40", description: "Brightest galaxy in Coma Cluster, ultramassive black hole" },
    { name: "IC 1101", position: [3120, -520, 1700], color: "#B388FF", description: "One of largest known galaxies, over 5 million light-years" },
    { name: "Malin 1", position: [-1700, 520, -3120], color: "#84FFFF", description: "Prototype giant low surface brightness galaxy" },
    { name: "ESO 137-001", position: [3140, -540, -1680], color: "#EA80FC", description: "Jellyfish galaxy with dramatic ram pressure stripping" },
    { name: "Virgo Cluster", position: [-1680, 540, 3140], color: "#7C4DFF", description: "Nearest large galaxy cluster, ~1500 members" },
    { name: "Coma Cluster (Abell 1656)", position: [3160, -560, 1660], color: "#18FFFF", description: "Rich regular cluster, prototype for Coma-type clusters" },
    { name: "Fornax Cluster", position: [-1660, 560, -3160], color: "#64FFDA", description: "Second richest cluster within 100 Mly" },
    { name: "Perseus Cluster (Abell 426)", position: [3180, -580, -1640], color: "#FF6E40", description: "Brightest X-ray cluster, cool core with bubbles" },
    { name: "Centaurus Cluster (Abell 3526)", position: [-1640, 580, 3180], color: "#69F0AE", description: "Nearby cluster with complex substructure" },
    { name: "Hydra Cluster (Abell 1060)", position: [3200, -600, 1620], color: "#40C4FF", description: "Compact cluster in Hydra constellation" },
    { name: "Bullet Cluster (1E 0657-56)", position: [-1620, 600, -3200], color: "#FF5252", description: "Merging cluster providing dark matter evidence" },
    { name: "El Gordo (ACT-CL J0102-4915)", position: [3220, -620, -1600], color: "#B2FF59", description: "Most massive known distant cluster" },
    { name: "Abell 2218", position: [-1600, 620, 3220], color: "#FFFF00", description: "Strong gravitational lens with multiple arcs" },
    { name: "Abell 370", position: [3240, -640, 1580], color: "#FF4081", description: "Gravitational lens cluster with dragon arc" },
    { name: "MACS J0717.5+3745", position: [-1580, 640, -3240], color: "#E040FB", description: "Most complex known cluster collision" },
    { name: "Abell 1689", position: [3260, -660, -1560], color: "#7C4DFF", description: "One of most massive clusters, extreme lensing" },
    { name: "Abell 2744 (Pandora's Cluster)", position: [-1560, 660, 3260], color: "#18FFFF", description: "Complex merging cluster with multiple subclusters" },
    { name: "Phoenix Cluster (SPT-CL J2344-4243)", position: [3280, -680, 1540], color: "#64FFDA", description: "Extreme starburst in cluster core" },
    { name: "SDSS J1038+4849 (Cheshire Cat)", position: [-1540, 680, -3280], color: "#FFAB40", description: "Galaxy group resembling smiling cat face" },
    { name: "Abell 520 (Train Wreck Cluster)", position: [3300, -700, -1520], color: "#69F0AE", description: "Merging cluster with unusual dark matter distribution" },
    { name: "Zwicky 8338", position: [-1520, 700, 3300], color: "#40C4FF", description: "Cluster with spectacular gravitational arc" },
    { name: "RX J1347.5-1145", position: [3320, -720, 1500], color: "#FF5252", description: "One of most X-ray luminous clusters known" },
    { name: "Abell 85", position: [-1500, 720, -3320], color: "#B2FF59", description: "Cluster hosting one of largest black holes known" },
    { name: "Norma Cluster (Abell 3627)", position: [3340, -740, -1480], color: "#FFFF00", description: "Cluster at center of Great Attractor region" },
    { name: "Shapley Supercluster (IV)", position: [-1480, 740, 3340], color: "#FF4081", description: "Largest concentration of galaxies in local universe" },
    { name: "Laniakea Supercluster (III)", position: [3360, -760, 1460], color: "#E040FB", description: "Our home supercluster, 500 million light-years across" },
    { name: "Hercules Supercluster", position: [-1460, 760, -3360], color: "#7C4DFF", description: "Part of Hercules-Corona Borealis Great Wall" },
    { name: "Corona Borealis Supercluster", position: [3380, -780, -1440], color: "#18FFFF", description: "Dense supercluster 1 billion light-years away" },
    { name: "Sloan Great Wall (IV)", position: [-1440, 780, 3380], color: "#64FFDA", description: "One of largest known cosmic structures" },
    { name: "M2 (Globular Cluster)", position: [3400, -800, 1420], color: "#FFD54F", description: "Rich globular cluster in Aquarius" },
    { name: "M3 (Globular Cluster)", position: [-1420, 800, -3400], color: "#4DB6AC", description: "One of brightest globular clusters" },
    { name: "M4 (Globular Cluster)", position: [3420, -820, -1400], color: "#FF8A65", description: "Nearest globular to Solar System" },
    { name: "M5 (Globular Cluster)", position: [-1400, 820, 3420], color: "#A1887F", description: "One of oldest known globular clusters" },
    { name: "M9 (Globular Cluster)", position: [3440, -840, 1380], color: "#90A4AE", description: "Globular cluster near Galactic center" },
    { name: "M10 (Globular Cluster)", position: [-1380, 840, -3440], color: "#F48FB1", description: "Bright globular cluster in Ophiuchus" },
    { name: "M12 (Globular Cluster)", position: [3460, -860, -1360], color: "#CE93D8", description: "Loose globular cluster" },
    { name: "M13 (Great Hercules Cluster)", position: [-1360, 860, 3460], color: "#9FA8DA", description: "Finest globular in northern sky, 300,000 stars" },
    { name: "M14 (Globular Cluster)", position: [3480, -880, 1340], color: "#81D4FA", description: "Slightly elliptical globular cluster" },
    { name: "M15 (Globular Cluster)", position: [-1340, 880, -3480], color: "#80CBC4", description: "Dense core globular, possible black hole" },
    { name: "M19 (Globular Cluster)", position: [3500, -900, -1320], color: "#C5E1A5", description: "Most oblate known globular cluster" },
    { name: "M22 (Globular Cluster)", position: [-1320, 900, 3500], color: "#FFF59D", description: "One of nearest bright globular clusters" },
    { name: "M28 (Globular Cluster)", position: [3520, -920, 1300], color: "#FFCC80", description: "Globular cluster with millisecond pulsar" },
    { name: "M30 (Globular Cluster)", position: [-1300, 920, -3520], color: "#BCAAA4", description: "Core-collapsed globular cluster" },
    { name: "M53 (Globular Cluster)", position: [3540, -940, -1280], color: "#B0BEC5", description: "Remote globular cluster in Coma Berenices" },
    { name: "M55 (Globular Cluster)", position: [-1280, 940, 3540], color: "#EF9A9A", description: "Large loose globular cluster" },
    { name: "M56 (Globular Cluster)", position: [3560, -960, 1260], color: "#F8BBD9", description: "Moderately concentrated globular" },
    { name: "M62 (Globular Cluster)", position: [-1260, 960, -3560], color: "#E1BEE7", description: "One of most irregularly shaped globulars" },
    { name: "M68 (Globular Cluster)", position: [3580, -980, -1240], color: "#C5CAE9", description: "Metal-poor globular cluster" },
    { name: "M69 (Globular Cluster)", position: [-1240, 980, 3580], color: "#BBDEFB", description: "Small globular near Galactic center" },
    { name: "M70 (Globular Cluster)", position: [3600, -1000, 1220], color: "#B2EBF2", description: "Core-collapsed globular in Sagittarius" },
    { name: "M71 (Globular Cluster)", position: [-1220, 1000, -3600], color: "#B2DFDB", description: "Loosest known globular cluster" },
    { name: "M72 (Globular Cluster)", position: [3620, -1020, -1200], color: "#C8E6C9", description: "Remote loose globular cluster" },
    { name: "M75 (Globular Cluster)", position: [-1200, 1020, 3620], color: "#F0F4C3", description: "Highly concentrated distant globular" },
    { name: "M79 (Globular Cluster)", position: [3640, -1040, 1180], color: "#FFECB3", description: "Possible Canis Major Dwarf Galaxy member" },
    { name: "Pleiades (M45)", position: [-1180, 1040, -3640], color: "#64B5F6", description: "Seven Sisters, most famous open cluster" },
    { name: "Hyades Cluster (II)", position: [3660, -1060, -1160], color: "#FFB74D", description: "Nearest open cluster to Earth, V-shaped" },
    { name: "Beehive Cluster (M44)", position: [-1160, 1060, 3660], color: "#81C784", description: "Praesepe, bright open cluster in Cancer" },
    { name: "Double Cluster (NGC 869/884)", position: [3680, -1080, 1140], color: "#E57373", description: "Spectacular pair of open clusters in Perseus" },
    { name: "Wild Duck Cluster (M11)", position: [-1140, 1080, -3680], color: "#BA68C8", description: "Rich compact open cluster in Scutum" },
    { name: "Butterfly Cluster (M6)", position: [3700, -1100, -1120], color: "#4FC3F7", description: "Open cluster shaped like butterfly wings" },
    { name: "Ptolemy's Cluster (M7)", position: [-1120, 1100, 3700], color: "#AED581", description: "Large bright open cluster in Scorpius" },
    { name: "Jewel Box (NGC 4755)", position: [3720, -1120, 1100], color: "#FF8A80", description: "Colorful open cluster with red supergiant" },
    { name: "Wishing Well Cluster (NGC 3532)", position: [-1100, 1120, -3720], color: "#B39DDB", description: "Rich open cluster observed by Galileo" },
    { name: "Coma Star Cluster (Mel 111)", position: [3740, -1140, -1080], color: "#80DEEA", description: "Sparse nearby open cluster in Coma Berenices" },
    { name: "Alpha Persei Cluster (Mel 20)", position: [-1080, 1140, 3740], color: "#C5E1A5", description: "Moving group around Alpha Persei" },
    { name: "Omicron Velorum Cluster (IC 2391)", position: [3760, -1160, 1060], color: "#FFAB91", description: "Bright southern open cluster" },
    { name: "NGC 2516", position: [-1060, 1160, -3760], color: "#CE93D8", description: "Southern Beehive, rich open cluster" },
    { name: "NGC 6231", position: [3780, -1180, -1040], color: "#90CAF9", description: "Core of Scorpius OB1 association" },
    { name: "Westerlund 1", position: [-1040, 1180, 3780], color: "#A5D6A7", description: "Most massive known young cluster in Milky Way" },
    { name: "Westerlund 2", position: [3800, -1200, 1020], color: "#FFCC80", description: "Young massive cluster with Wolf-Rayet stars" },
    { name: "NGC 3603", position: [-1020, 1200, -3800], color: "#F48FB1", description: "Massive starburst cluster in Carina" },
    { name: "Trumpler 14", position: [3820, -1220, -1000], color: "#B0BEC5", description: "Young cluster in Carina Nebula complex" },
    { name: "Trumpler 16", position: [-1000, 1220, 3820], color: "#EF9A9A", description: "Contains Eta Carinae, massive cluster" },
    { name: "Arches Cluster (II)", position: [3840, -1240, 980], color: "#9FA8DA", description: "Densest known cluster in Milky Way" },
    { name: "Quintuplet Cluster (II)", position: [-980, 1240, -3840], color: "#81D4FA", description: "Massive cluster near Galactic center" },
    { name: "R136 (in Tarantula Nebula)", position: [3860, -1260, -960], color: "#80CBC4", description: "Most massive and luminous cluster known" },
    { name: "NGC 2362", position: [-960, 1260, 3860], color: "#FFF59D", description: "Young cluster dominated by Tau Canis Majoris" },
    { name: "Stock 2 (Muscleman Cluster)", position: [3880, -1280, 940], color: "#BCAAA4", description: "Large scattered cluster in Cassiopeia" },
    { name: "NGC 752", position: [-940, 1280, -3880], color: "#B0BEC5", description: "Old open cluster in Andromeda" },
    { name: "Orion Nebula (M42)", position: [3900, -1300, -920], color: "#FF69B4", description: "Brightest diffuse nebula, stellar nursery" },
    { name: "Lagoon Nebula (M8)", position: [-920, 1300, 3900], color: "#00CED1", description: "Giant interstellar cloud with young star cluster" },
    { name: "Eagle Nebula (M16)", position: [3920, -1320, 900], color: "#FF6347", description: "Star-forming region with Pillars of Creation" },
    { name: "Omega Nebula (M17)", position: [-900, 1320, -3920], color: "#7B68EE", description: "Swan Nebula, bright H II region in Sagittarius" },
    { name: "Trifid Nebula (M20)", position: [3940, -1340, -880], color: "#20B2AA", description: "Combination emission, reflection, and dark nebula" },
    { name: "Rosette Nebula (NGC 2237)", position: [-880, 1340, 3940], color: "#FF1493", description: "Large circular H II region with central cluster" },
    { name: "Carina Nebula (NGC 3372)", position: [3960, -1360, 860], color: "#FFD700", description: "One of largest H II regions, contains Eta Carinae" },
    { name: "Tarantula Nebula (30 Doradus)", position: [-860, 1360, -3960], color: "#00FF7F", description: "Most active starburst region in Local Group" },
    { name: "North America Nebula (NGC 7000)", position: [3980, -1380, -840], color: "#DC143C", description: "Large emission nebula shaped like North America" },
    { name: "Pelican Nebula (IC 5070)", position: [-840, 1380, 3980], color: "#9370DB", description: "H II region adjacent to North America Nebula" },
    { name: "California Nebula (NGC 1499)", position: [4000, -1400, 820], color: "#FF4500", description: "Large but faint emission nebula in Perseus" },
    { name: "Soul Nebula (IC 1848)", position: [-820, 1400, -4000], color: "#BA55D3", description: "Heart and Soul pair, active star formation" },
    { name: "Heart Nebula (IC 1805)", position: [4020, -1420, -800], color: "#FF0000", description: "Heart-shaped emission nebula in Cassiopeia" },
    { name: "Flaming Star Nebula (IC 405)", position: [-800, 1420, 4020], color: "#FF8C00", description: "Emission and reflection nebula around AE Aurigae" },
    { name: "Cone Nebula (NGC 2264)", position: [4040, -1440, 780], color: "#E9967A", description: "Dark absorption nebula in Monoceros" },
    { name: "Christmas Tree Cluster and Nebula", position: [-780, 1440, -4040], color: "#228B22", description: "Star cluster with surrounding nebulosity" },
    { name: "Monkey Head Nebula (NGC 2174)", position: [4060, -1460, -760], color: "#FFA07A", description: "Emission nebula in Orion with distinctive shape" },
    { name: "Flame Nebula (NGC 2024)", position: [-760, 1460, 4060], color: "#FF4500", description: "Emission nebula near Alnitak in Orion" },
    { name: "Horsehead Nebula (Barnard 33)", position: [4080, -1480, 740], color: "#8B4513", description: "Iconic dark nebula silhouetted against IC 434" },
    { name: "Bubble Nebula (NGC 7635)", position: [-740, 1480, -4080], color: "#87CEEB", description: "Emission nebula shaped by stellar wind" },
    { name: "Crescent Nebula (NGC 6888)", position: [4100, -1500, -720], color: "#00BFFF", description: "Wolf-Rayet nebula formed by stellar wind" },
    { name: "NGC 281 (Pacman Nebula)", position: [-720, 1500, 4100], color: "#FFFF00", description: "H II region in Cassiopeia with dark globules" },
    { name: "Elephant Trunk Nebula (IC 1396)", position: [4120, -1520, 700], color: "#CD853F", description: "Dark globule in large emission nebula" },
    { name: "Wizard Nebula (NGC 7380)", position: [-700, 1520, -4120], color: "#4169E1", description: "Open cluster with surrounding emission nebula" },
    { name: "Cocoon Nebula (IC 5146)", position: [4140, -1540, -680], color: "#FF6B6B", description: "Reflection nebula with embedded star cluster" },
    { name: "Sirius (Alpha Canis Majoris)", position: [-680, 1540, 4140], color: "#FFFFFF", description: "Brightest star in night sky, Dog Star" },
    { name: "Canopus (Alpha Carinae)", position: [4160, -1560, 660], color: "#FFF8DC", description: "Second brightest star, southern navigation star" },
    { name: "Arcturus (Alpha Bootis)", position: [-660, 1560, -4160], color: "#FFD700", description: "Brightest star in northern celestial hemisphere" },
    { name: "Vega (Alpha Lyrae)", position: [4180, -1580, -640], color: "#ADD8E6", description: "Fifth brightest star, former pole star" },
    { name: "Capella (Alpha Aurigae)", position: [-640, 1580, 4180], color: "#FFFACD", description: "Sixth brightest star, quadruple star system" },
    { name: "Rigel (Beta Orionis)", position: [4200, -1600, 620], color: "#B0E0E6", description: "Blue supergiant, one of most luminous stars" },
    { name: "Procyon (Alpha Canis Minoris)", position: [-620, 1600, -4200], color: "#FAFAD2", description: "Eighth brightest star, binary system" },
    { name: "Betelgeuse (Alpha Orionis)", position: [4220, -1620, -600], color: "#FF4500", description: "Red supergiant, future supernova candidate" },
    { name: "Achernar (Alpha Eridani)", position: [-600, 1620, 4220], color: "#87CEFA", description: "Flattest star known due to rapid rotation" },
    { name: "Hadar (Beta Centauri)", position: [4240, -1640, 580], color: "#B0C4DE", description: "Triple star system, pointer to Southern Cross" },
    { name: "Altair (Alpha Aquilae)", position: [-580, 1640, -4240], color: "#F5F5F5", description: "Twelfth brightest star, rapid rotator" },
    { name: "Aldebaran (Alpha Tauri)", position: [4260, -1660, -560], color: "#FF6347", description: "Eye of Taurus, orange giant star" },
    { name: "Antares (Alpha Scorpii)", position: [-560, 1660, 4260], color: "#FF0000", description: "Heart of Scorpion, red supergiant rival of Mars" },
    { name: "Spica (Alpha Virginis)", position: [4280, -1680, 540], color: "#E6E6FA", description: "Binary star, brightest in Virgo" },
    { name: "Pollux (Beta Geminorum)", position: [-540, 1680, -4280], color: "#FFA500", description: "Nearest giant star to Sun, has exoplanet" },
    { name: "Fomalhaut (Alpha Piscis Austrini)", position: [4300, -1700, -520], color: "#F0F8FF", description: "Autumn Star with famous debris disk" },
    { name: "Deneb (Alpha Cygni)", position: [-520, 1700, 4300], color: "#F5FFFA", description: "Most luminous first-magnitude star" },
    { name: "Regulus (Alpha Leonis)", position: [4320, -1720, 500], color: "#E0FFFF", description: "Heart of the Lion, fast-spinning star" },
    { name: "Castor (Alpha Geminorum)", position: [-500, 1720, -4320], color: "#F8F8FF", description: "Sextuple star system in Gemini" },
    { name: "Mimosa (Beta Crucis)", position: [4340, -1740, -480], color: "#B0E0E6", description: "Second brightest in Southern Cross" },
    { name: "Acrux (Alpha Crucis)", position: [-480, 1740, 4340], color: "#ADD8E6", description: "Brightest star in Southern Cross" },
    { name: "Shaula (Lambda Scorpii)", position: [4360, -1760, 460], color: "#87CEEB", description: "Stinger of Scorpius, triple star system" },
    { name: "Bellatrix (Gamma Orionis)", position: [-460, 1760, -4360], color: "#F0FFFF", description: "Amazon Star, third brightest in Orion" },
    { name: "Alnilam (Epsilon Orionis)", position: [4380, -1780, -440], color: "#E0E0E0", description: "Central star of Orion's Belt" },
    { name: "Polaris (Alpha Ursae Minoris)", position: [-440, 1780, 4380], color: "#FFFAF0", description: "Current North Star, Cepheid variable" },
    { name: "Proxima Centauri b (III)", position: [4400, -1800, 420], color: "#FF6B6B", description: "Nearest known exoplanet, in habitable zone" },
    { name: "TRAPPIST-1e", position: [-420, 1800, -4400], color: "#4ECDC4", description: "Earth-sized planet in habitable zone of ultracool dwarf" },
    { name: "TRAPPIST-1f", position: [4420, -1820, -400], color: "#45B7D1", description: "Potentially habitable planet in TRAPPIST-1 system" },
    { name: "Kepler-442b", position: [-400, 1820, 4420], color: "#96CEB4", description: "Super-Earth in habitable zone, high habitability score" },
    { name: "Kepler-452b", position: [4440, -1840, 380], color: "#DDA0DD", description: "Earth's Cousin, first near-Earth-size in habitable zone of Sun-like star" },
    { name: "Kepler-186f", position: [-380, 1840, -4440], color: "#98D8C8", description: "First Earth-sized planet in habitable zone" },
    { name: "TOI-700 d", position: [4460, -1860, -360], color: "#F7DC6F", description: "Earth-sized planet in habitable zone from TESS" },
    { name: "LHS 1140 b", position: [-360, 1860, 4460], color: "#BB8FCE", description: "Super-Earth with potential thick atmosphere" },
    { name: "K2-18 b", position: [4480, -1880, 340], color: "#85C1E9", description: "Mini-Neptune with water vapor detected" },
    { name: "55 Cancri e", position: [-340, 1880, -4480], color: "#F1948A", description: "Super-Earth with possible lava hemisphere" },
    { name: "HD 189733 b", position: [4500, -1900, -320], color: "#82E0AA", description: "Hot Jupiter with detected blue color and silicate rain" },
    { name: "HD 209458 b (Osiris)", position: [-320, 1900, 4500], color: "#F8C471", description: "First transiting exoplanet, evaporating atmosphere" },
    { name: "Kepler-22b", position: [4520, -1920, 300], color: "#D7BDE2", description: "First confirmed planet in habitable zone of Sun-like star" },
    { name: "Gliese 581 g", position: [-300, 1920, -4520], color: "#AED6F1", description: "Controversial potentially habitable super-Earth" },
    { name: "Tau Ceti e", position: [4540, -1940, -280], color: "#F9E79F", description: "Super-Earth in habitable zone of nearby Sun-like star" },
    { name: "WASP-12b", position: [-280, 1940, 4540], color: "#A3E4D7", description: "Hot Jupiter being tidally destroyed by its star" },
    { name: "WASP-76b", position: [4560, -1960, 260], color: "#FAD7A0", description: "Hot Jupiter where it rains iron" },
    { name: "HR 8799 System (II)", position: [-260, 1960, -4560], color: "#D5DBDB", description: "First directly imaged multi-planet system" },
    { name: "Beta Pictoris b", position: [4580, -1980, -240], color: "#FADBD8", description: "Young giant planet directly imaged around debris disk star" },
    { name: "51 Pegasi b", position: [-240, 1980, 4580], color: "#E8DAEF", description: "First confirmed exoplanet around Sun-like star" },
    { name: "PSR B1257+12 planets", position: [4600, -2000, 220], color: "#D4E6F1", description: "First exoplanets ever discovered, around pulsar" },
    { name: "Kepler-16b (Tatooine)", position: [-220, 2000, -4600], color: "#D5F5E3", description: "First confirmed circumbinary planet" },
    { name: "KELT-9b", position: [4620, -2020, -200], color: "#FCF3CF", description: "Hottest known exoplanet at 4,600 K" },
    { name: "GJ 1214 b", position: [-200, 2020, 4620], color: "#EBDEF0", description: "First super-Earth with confirmed atmosphere" },
    { name: "HAT-P-7b", position: [4640, -2040, 180], color: "#FDEBD0", description: "Hot Jupiter with detected atmospheric variability" },
    { name: "Mercury", position: [-180, 2040, -4640], color: "#A0522D", description: "Innermost planet, extreme temperature variations" },
    { name: "Venus", position: [4660, -2060, 160], color: "#DEB887", description: "Hottest planet, runaway greenhouse atmosphere" },
    { name: "Mars", position: [-160, 2060, 4660], color: "#CD5C5C", description: "Red Planet, target for human exploration" },
    { name: "Jupiter", position: [4680, -2080, -140], color: "#DAA520", description: "Largest planet, Great Red Spot storm system" },
    { name: "Saturn", position: [-140, 2080, -4680], color: "#F4A460", description: "Ringed planet, lowest density of any planet" },
    { name: "Uranus", position: [4700, -2100, 120], color: "#AFEEEE", description: "Ice giant tilted on its side" },
    { name: "Neptune", position: [-120, 2100, 4700], color: "#4169E1", description: "Windiest planet, deep blue color" },
    { name: "Pluto", position: [4720, -2120, -100], color: "#DEB887", description: "Dwarf planet with heart-shaped glacier" },
    { name: "Ceres", position: [-100, 2120, -4720], color: "#808080", description: "Largest asteroid, dwarf planet in asteroid belt" },
    { name: "Eris", position: [4740, -2140, 80], color: "#F5F5DC", description: "Most massive known dwarf planet" },
    { name: "Makemake", position: [-80, 2140, 4740], color: "#CD853F", description: "Dwarf planet in Kuiper Belt, no known moons" },
    { name: "Haumea", position: [4760, -2160, -60], color: "#FAEBD7", description: "Egg-shaped dwarf planet with rings" },
    { name: "Europa", position: [-60, 2160, -4760], color: "#F0E68C", description: "Jupiter moon with subsurface ocean" },
    { name: "Titan", position: [4780, -2180, 40], color: "#D2691E", description: "Saturn moon with thick atmosphere and methane lakes" },
    { name: "Enceladus", position: [-40, 2180, 4780], color: "#FFFAFA", description: "Saturn moon with active ice geysers" },
    { name: "Ganymede", position: [4800, -2200, -20], color: "#A9A9A9", description: "Largest moon in Solar System, has magnetic field" },
    { name: "Io", position: [-20, 2200, -4800], color: "#FFD700", description: "Most volcanically active body in Solar System" },
    { name: "Callisto", position: [4820, -2220, 0], color: "#696969", description: "Most heavily cratered object in Solar System" },
    { name: "Triton", position: [0, 2220, 4820], color: "#E0FFFF", description: "Neptune moon with retrograde orbit, likely captured" },
    { name: "Charon", position: [4840, -2240, 20], color: "#708090", description: "Pluto's largest moon, binary system" },
    { name: "Miranda", position: [20, 2240, -4840], color: "#D3D3D3", description: "Uranus moon with extreme geological features" },
    { name: "Phobos", position: [4860, -2260, 40], color: "#8B4513", description: "Larger Mars moon, slowly spiraling inward" },
    { name: "Deimos", position: [40, 2260, 4860], color: "#A0522D", description: "Smaller Mars moon, smooth surface" },
    { name: "Vesta", position: [4880, -2280, -60], color: "#C0C0C0", description: "Second largest asteroid, differentiated interior" },
    { name: "Pallas", position: [-60, 2280, -4880], color: "#B8860B", description: "Third largest asteroid, highly tilted orbit" },
    { name: "Halley's Comet (1P/Halley)", position: [4900, -2300, 80], color: "#E0FFFF", description: "Most famous periodic comet, 76-year orbit" },
    { name: "Comet Hale-Bopp (C/1995 O1)", position: [-80, 2300, 4900], color: "#F5F5F5", description: "Great Comet of 1997, visible for 18 months" },
    { name: "Comet Hyakutake (C/1996 B2)", position: [4920, -2320, -100], color: "#ADD8E6", description: "Great Comet of 1996 with long ion tail" },
    { name: "Comet NEOWISE (C/2020 F3)", position: [-100, 2320, -4920], color: "#FFF8DC", description: "Brightest comet visible from Northern Hemisphere in decades" },
    { name: "Comet Shoemaker-Levy 9", position: [4940, -2340, 120], color: "#D3D3D3", description: "Comet that impacted Jupiter in 1994" },
    { name: "Comet 67P/Churyumov-Gerasimenko", position: [-120, 2340, 4940], color: "#696969", description: "Rosetta mission target, rubber duck shape" },
    { name: "Comet Wild 2 (81P/Wild)", position: [4960, -2360, -140], color: "#A9A9A9", description: "Stardust mission target, samples returned" },
    { name: "Comet Tempel 1 (9P/Tempel)", position: [-140, 2360, -4960], color: "#808080", description: "Deep Impact target, artificial crater created" },
    { name: "Comet Encke (2P/Encke)", position: [4980, -2380, 160], color: "#DCDCDC", description: "Shortest known orbital period comet at 3.3 years" },
    { name: "Comet ISON (C/2012 S1)", position: [-160, 2380, 4980], color: "#E6E6FA", description: "Sungrazing comet that disintegrated near Sun" },
    { name: "Comet Lovejoy (C/2011 W3)", position: [5000, -2400, -180], color: "#B0E0E6", description: "Kreutz sungrazer that survived perihelion" },
    { name: "Comet McNaught (C/2006 P1)", position: [-180, 2400, -5000], color: "#FAFAD2", description: "Great Comet of 2007, spectacular tail fans" },
    { name: "Asteroid Bennu (101955)", position: [5020, -2420, 200], color: "#4A4A4A", description: "OSIRIS-REx target, samples returned to Earth" },
    { name: "Asteroid Ryugu (162173)", position: [-200, 2420, 5020], color: "#363636", description: "Hayabusa2 target, diamond-shaped rubble pile" },
    { name: "Asteroid Itokawa (25143)", position: [5040, -2440, -220], color: "#8B8682", description: "First asteroid with samples returned, Hayabusa mission" },
    { name: "Asteroid Eros (433)", position: [-220, 2440, -5040], color: "#CD853F", description: "First asteroid orbited and landed upon by spacecraft" },
    { name: "Asteroid Psyche (16)", position: [5060, -2460, 240], color: "#C0C0C0", description: "Metallic M-type asteroid, exposed planetary core" },
    { name: "Asteroid Ida (243)", position: [-240, 2460, 5060], color: "#A0522D", description: "First asteroid discovered to have a moon (Dactyl)" },
    { name: "Asteroid Gaspra (951)", position: [5080, -2480, -260], color: "#BC8F8F", description: "First asteroid visited by spacecraft (Galileo)" },
    { name: "Asteroid Apophis (99942)", position: [-260, 2480, -5080], color: "#8B0000", description: "Near-Earth asteroid with close approach in 2029" },
    { name: "Asteroid Didymos-Dimorphos", position: [5100, -2500, 280], color: "#556B2F", description: "DART mission target, first planetary defense test" },
    { name: "Centaur Chiron (2060)", position: [-280, 2500, 5100], color: "#708090", description: "First discovered centaur, shows cometary activity" },
    { name: "Centaur Chariklo (10199)", position: [5120, -2520, -300], color: "#4682B4", description: "First minor planet discovered with rings" },
    { name: "'Oumuamua (1I/2017 U1)", position: [-300, 2520, -5120], color: "#8B4513", description: "First confirmed interstellar object" },
    { name: "Comet Borisov (2I/Borisov)", position: [5140, -2540, 320], color: "#D8BFD8", description: "First confirmed interstellar comet" },
    { name: "Big Bang", position: [-320, 2540, 5140], color: "#FFFF00", description: "Origin event of universe 13.8 billion years ago" },
    { name: "Cosmic Inflation", position: [5160, -2560, -340], color: "#FFD700", description: "Rapid exponential expansion in early universe" },
    { name: "Cosmic Microwave Background (III)", position: [-340, 2560, -5160], color: "#FFA500", description: "Oldest light in universe, 380,000 years after Big Bang" },
    { name: "Dark Energy", position: [5180, -2580, 360], color: "#4B0082", description: "Mysterious force driving accelerating expansion" },
    { name: "Dark Matter Halos", position: [-360, 2580, 5180], color: "#191970", description: "Invisible matter scaffolding around galaxies" },
    { name: "Cosmic Web Filaments", position: [5200, -2600, -380], color: "#00CED1", description: "Large-scale structure of matter in universe" },
    { name: "Cosmic Voids", position: [-380, 2600, -5200], color: "#000080", description: "Vast empty regions between galaxy filaments" },
    { name: "Baryon Acoustic Oscillations", position: [5220, -2620, 400], color: "#8B008B", description: "Sound wave imprints in matter distribution" },
    { name: "Primordial Nucleosynthesis (II)", position: [-400, 2620, 5220], color: "#FF4500", description: "Formation of light elements minutes after Big Bang" },
    { name: "Recombination Epoch", position: [5240, -2640, -420], color: "#FF6347", description: "Era when atoms first formed, universe became transparent" },
    { name: "Dark Ages (Cosmology)", position: [-420, 2640, -5240], color: "#2F4F4F", description: "Period before first stars formed" },
    { name: "Cosmic Dawn (III)", position: [5260, -2660, 440], color: "#FF69B4", description: "Era when first stars and galaxies formed" },
    { name: "Epoch of Reionization (III)", position: [-440, 2660, 5260], color: "#DA70D6", description: "Period when universe became ionized again" },
    { name: "Observable Universe Boundary", position: [5280, -2680, -460], color: "#9400D3", description: "Cosmic horizon 46 billion light-years away" },
    { name: "Hubble Flow (II)", position: [-460, 2680, -5280], color: "#00BFFF", description: "Expansion of space carrying galaxies apart" },
    { name: "Hubble Tension (II)", position: [5300, -2700, 480], color: "#FF1493", description: "Discrepancy in measured expansion rate" },
    { name: "Cosmological Constant", position: [-480, 2700, 5300], color: "#9932CC", description: "Einstein's lambda, energy density of empty space" },
    { name: "Cosmic Strings (Hypothetical)", position: [5320, -2720, -500], color: "#7B68EE", description: "Theoretical topological defects from early universe" },
    { name: "Multiverse Theory", position: [-500, 2720, -5320], color: "#6A5ACD", description: "Hypothesis of multiple parallel universes" },
    { name: "Anthropic Principle", position: [5340, -2740, 520], color: "#483D8B", description: "Universe fine-tuned for observer existence" },
    { name: "Heat Death of Universe", position: [-520, 2740, 5340], color: "#1C1C1C", description: "Predicted final state of maximum entropy" },
    { name: "Big Rip Scenario (II)", position: [5360, -2760, -540], color: "#8B0000", description: "Hypothetical end where dark energy tears everything apart" },
    { name: "Big Crunch Scenario", position: [-540, 2760, -5360], color: "#800000", description: "Hypothetical end where universe collapses" },
    { name: "Cyclic Universe Model", position: [5380, -2780, 560], color: "#B22222", description: "Theory of repeating Big Bang cycles" },
    { name: "Holographic Principle (II)", position: [-560, 2780, 5380], color: "#DC143C", description: "Theory that 3D space encoded on 2D boundary" },
    { name: "James Webb Space Telescope (II)", position: [5400, -2800, -580], color: "#FFD700", description: "Largest space telescope, infrared observations" },
    { name: "Hubble Space Telescope (II)", position: [-580, 2800, -5400], color: "#4169E1", description: "Iconic space telescope transforming astronomy since 1990" },
    { name: "Event Horizon Telescope", position: [5420, -2820, 600], color: "#000000", description: "Planet-spanning array that imaged black holes" },
    { name: "LIGO Hanford (II)", position: [-600, 2820, 5420], color: "#7CFC00", description: "Gravitational wave detector in Washington State" },
    { name: "LIGO Livingston (II)", position: [5440, -2840, -620], color: "#32CD32", description: "Gravitational wave detector in Louisiana" },
    { name: "Virgo Interferometer", position: [-620, 2840, -5440], color: "#228B22", description: "European gravitational wave detector in Italy" },
    { name: "KAGRA", position: [5460, -2860, 640], color: "#006400", description: "Underground gravitational wave detector in Japan" },
    { name: "Square Kilometre Array (III)", position: [-640, 2860, 5460], color: "#FF6347", description: "World's largest radio telescope under construction" },
    { name: "Extremely Large Telescope (III)", position: [5480, -2880, -660], color: "#8B4513", description: "39-meter optical telescope under construction in Chile" },
    { name: "Thirty Meter Telescope (III)", position: [-660, 2880, -5480], color: "#A0522D", description: "Next-generation optical telescope planned for Hawaii" },
    { name: "Giant Magellan Telescope (III)", position: [5500, -2900, 680], color: "#D2691E", description: "25-meter telescope with seven primary mirrors" },
    { name: "Vera C. Rubin Observatory", position: [-680, 2900, 5500], color: "#6495ED", description: "Survey telescope for time-domain astronomy" },
    { name: "Nancy Grace Roman Space Telescope", position: [5520, -2920, -700], color: "#4682B4", description: "Wide-field infrared space telescope" },
    { name: "LISA (Laser Interferometer Space Antenna)", position: [-700, 2920, -5520], color: "#00CED1", description: "Future space-based gravitational wave detector" },
    { name: "IceCube Neutrino Observatory (II)", position: [5540, -2940, 720], color: "#00BFFF", description: "Neutrino detector at South Pole" },
    { name: "Super-Kamiokande (II)", position: [-720, 2940, 5540], color: "#1E90FF", description: "Giant underground water Cherenkov detector in Japan" },
    { name: "Cherenkov Telescope Array", position: [5560, -2960, -740], color: "#9400D3", description: "Next-gen gamma-ray observatory with 100+ telescopes" },
    { name: "MAGIC Telescopes", position: [-740, 2960, -5560], color: "#8A2BE2", description: "Twin gamma-ray telescopes in Canary Islands" },
    { name: "H.E.S.S. Telescopes", position: [5580, -2980, 760], color: "#9932CC", description: "High Energy Stereoscopic System in Namibia" },
    { name: "VERITAS Array (II)", position: [-760, 2980, 5580], color: "#BA55D3", description: "Gamma-ray telescope array in Arizona" },
    { name: "Pierre Auger Observatory (II)", position: [5600, -3000, -780], color: "#DA70D6", description: "Largest cosmic ray detector spanning 3000 km²" },
    { name: "Arecibo Observatory (Historical)", position: [-780, 3000, -5600], color: "#FF69B4", description: "Legendary 305-meter dish, collapsed 2020" },
    { name: "Green Bank Telescope (II)", position: [5620, -3020, 800], color: "#ADFF2F", description: "World's largest fully steerable radio telescope" },
    { name: "Atacama Large Millimeter Array", position: [-800, 3020, 5620], color: "#FFD700", description: "66 high-precision antennas for mm/submm astronomy" },
    { name: "Very Long Baseline Array", position: [5640, -3040, -820], color: "#FFA500", description: "Ten radio telescopes spanning 8,600 km" },
    { name: "Discovery of Uranus (1781)", position: [-820, 3040, -5640], color: "#87CEEB", description: "William Herschel's discovery expanded Solar System" },
    { name: "Discovery of Neptune (1846)", position: [5660, -3060, 840], color: "#4169E1", description: "First planet found by mathematical prediction" },
    { name: "Discovery of Pluto (1930)", position: [-840, 3060, 5660], color: "#DEB887", description: "Clyde Tombaugh's discovery at Lowell Observatory" },
    { name: "First Pulsar Detection (1967)", position: [5680, -3080, -860], color: "#00FF00", description: "Jocelyn Bell Burnell discovered LGM-1" },
    { name: "First Quasar Identification (1963)", position: [-860, 3080, -5680], color: "#FF4500", description: "Maarten Schmidt identified 3C 273 redshift" },
    { name: "CMB Discovery (1965)", position: [5700, -3100, 880], color: "#FFD700", description: "Penzias and Wilson detected cosmic background" },
    { name: "First Exoplanet Confirmed (1992)", position: [-880, 3100, 5700], color: "#9370DB", description: "Wolszczan discovered planets around pulsar" },
    { name: "First Hot Jupiter (1995)", position: [5720, -3120, -900], color: "#FF6347", description: "51 Pegasi b discovered by Mayor and Queloz" },
    { name: "Dark Energy Discovery (1998)", position: [-900, 3120, -5720], color: "#4B0082", description: "Accelerating expansion found via Type Ia supernovae" },
    { name: "First Gravitational Wave Detection (2015)", position: [5740, -3140, 920], color: "#32CD32", description: "LIGO detected merging black holes" },
    { name: "First Black Hole Image (2019)", position: [-920, 3140, 5740], color: "#000000", description: "EHT imaged M87* supermassive black hole" },
    { name: "Sagittarius A* Image (2022)", position: [5760, -3160, -940], color: "#FFA500", description: "EHT imaged Milky Way's central black hole" },
    { name: "JWST First Deep Field (2022)", position: [-940, 3160, -5760], color: "#FFD700", description: "Deepest infrared image of early universe" },
    { name: "Cosmic Noon Discovery", position: [5780, -3180, 960], color: "#FF69B4", description: "Peak of star formation 10 billion years ago" },
    { name: "Great Debate (1920)", position: [-960, 3180, 5780], color: "#8B4513", description: "Shapley vs Curtis on size of universe" },
    { name: "Hubble's Law (1929)", position: [5800, -3200, -980], color: "#DC143C", description: "Discovery of universe expansion" },
    { name: "Discovery of Dark Matter (1933)", position: [-980, 3200, -5800], color: "#191970", description: "Zwicky inferred missing mass in Coma Cluster" },
    { name: "Vera Rubin's Galaxy Rotation Curves", position: [5820, -3220, 1000], color: "#9932CC", description: "Confirmed dark matter in spiral galaxies" },
    { name: "First Fast Radio Burst (2007)", position: [-1000, 3220, 5820], color: "#00CED1", description: "Lorimer Burst discovered in archival data" },
    { name: "Breakthrough Starshot Announced (2016)", position: [5840, -3240, -1020], color: "#7FFF00", description: "Initiative for interstellar travel to Alpha Centauri" },
    { name: "TRAPPIST-1 System Discovered (2017)", position: [-1020, 3240, -5840], color: "#FF4500", description: "Seven Earth-sized planets found" },
    { name: "Neutron Star Merger GW170817", position: [5860, -3260, 1040], color: "#FFD700", description: "First multi-messenger gravitational wave event" },
    { name: "Voyager 1 Interstellar Entry (2012)", position: [-1040, 3260, 5860], color: "#4682B4", description: "First human-made object in interstellar space" },
    { name: "New Horizons Pluto Flyby (2015)", position: [5880, -3280, -1060], color: "#DEB887", description: "First spacecraft to visit Pluto system" },
    { name: "Cassini Grand Finale (2017)", position: [-1060, 3280, -5880], color: "#F4A460", description: "End of 13-year Saturn mission" },
    { name: "Witch Head Nebula (IC 2118)", position: [5900, -3300, 1080], color: "#6495ED", description: "Reflection nebula illuminated by Rigel" },
    { name: "Pleiades Reflection Nebulae", position: [-1080, 3300, 5900], color: "#87CEEB", description: "Blue nebulosity around Seven Sisters" },
    { name: "NGC 1999 (Keyhole)", position: [5920, -3320, -1100], color: "#B0C4DE", description: "Reflection nebula with dark Bok globule" },
    { name: "IC 2631", position: [-1100, 3320, -5920], color: "#ADD8E6", description: "Reflection nebula in Chamaeleon cloud" },
    { name: "Iris Nebula (NGC 7023)", position: [5940, -3340, 1120], color: "#E6E6FA", description: "Bright reflection nebula in Cepheus" },
    { name: "Coalsack Nebula", position: [-1120, 3340, 5940], color: "#1C1C1C", description: "Most prominent dark nebula, near Southern Cross" },
    { name: "Barnard 68", position: [5960, -3360, -1140], color: "#0D0D0D", description: "Perfect example of Bok globule, future star" },
    { name: "Horsehead Dark Nebula Core", position: [-1140, 3360, -5960], color: "#2F2F2F", description: "Dense molecular cloud in iconic silhouette" },
    { name: "Pipe Nebula (Barnard 59, 65-67, 78)", position: [5980, -3380, 1160], color: "#3D3D3D", description: "Pipe-shaped dark nebula complex in Ophiuchus" },
    { name: "Snake Nebula (Barnard 72)", position: [-1160, 3380, 5980], color: "#4B4B4B", description: "S-shaped dark nebula in Ophiuchus" },
    { name: "Dark Horse Nebula", position: [6000, -3400, -1180], color: "#2D2D2D", description: "Large dark nebula resembling horse shape" },
    { name: "Lynds Dark Nebula 1622", position: [-1180, 3400, -6000], color: "#1A1A1A", description: "Boogeyman Nebula in Orion" },
    { name: "Gulf of Mexico (Dark Nebula)", position: [6020, -3420, 1200], color: "#262626", description: "Dark region in North America Nebula" },
    { name: "Chamaeleon Dark Cloud Complex", position: [-1200, 3420, 6020], color: "#333333", description: "Nearby star-forming dark cloud region" },
    { name: "Lupus Dark Clouds", position: [6040, -3440, -1220], color: "#3A3A3A", description: "Star-forming molecular cloud complex" },
    { name: "Rho Ophiuchi Cloud Complex", position: [-1220, 3440, -6040], color: "#4A2A7F", description: "Colorful nebula complex with dark lanes" },
    { name: "Corona Australis Dark Cloud", position: [6060, -3460, 1240], color: "#404040", description: "Nearby star-forming dark molecular cloud" },
    { name: "Taurus Molecular Cloud", position: [-1240, 3460, 6060], color: "#363636", description: "Nearest large star-forming region" },
    { name: "Perseus Molecular Cloud", position: [6080, -3480, -1260], color: "#2F2F2F", description: "Giant molecular cloud with active star formation" },
    { name: "Orion Molecular Cloud Complex", position: [-1260, 3480, -6080], color: "#4D4D4D", description: "Massive star-forming region behind Orion Nebula" },
    { name: "Cygnus Rift", position: [6100, -3500, 1280], color: "#1F1F1F", description: "Great Rift dark lane in Milky Way" },
    { name: "Aquila Rift", position: [-1280, 3500, 6100], color: "#292929", description: "Nearby dark cloud complex in Aquila" },
    { name: "Ophiuchus Dark Lane", position: [6120, -3520, -1300], color: "#323232", description: "Dark dust lane towards Galactic center" },
    { name: "Vela Molecular Ridge", position: [-1300, 3520, -6120], color: "#3C3C3C", description: "Giant molecular cloud in Vela region" },
    { name: "Carina Molecular Cloud", position: [6140, -3540, 1320], color: "#464646", description: "Massive star-forming complex in Carina" },
    { name: "Crab Pulsar (PSR B0531+21)", position: [-1320, 3540, 6140], color: "#00FF00", description: "Young pulsar in Crab Nebula, 30 rotations/sec" },
    { name: "Vela Pulsar (PSR B0833-45)", position: [6160, -3560, -1340], color: "#32CD32", description: "Bright gamma-ray pulsar, 11 rotations/sec" },
    { name: "PSR J0437-4715", position: [-1340, 3560, -6160], color: "#7CFC00", description: "Nearest and brightest millisecond pulsar" },
    { name: "PSR J1748-2446ad", position: [6180, -3580, 1360], color: "#ADFF2F", description: "Fastest known pulsar, 716 rotations/sec" },
    { name: "Geminga Pulsar", position: [-1360, 3580, 6180], color: "#98FB98", description: "Nearby gamma-ray pulsar, radio-quiet" },
    { name: "SGR 1806-20", position: [6200, -3600, -1380], color: "#FF4500", description: "Most magnetic object known, magnetar" },
    { name: "SGR 1900+14", position: [-1380, 3600, -6200], color: "#FF6347", description: "Magnetar with giant flares detected" },
    { name: "1E 2259+586", position: [6220, -3620, 1400], color: "#DC143C", description: "Anomalous X-ray pulsar, magnetar candidate" },
    { name: "Sirius B", position: [-1400, 3620, 6220], color: "#F5F5F5", description: "Nearest white dwarf, companion to Sirius" },
    { name: "Procyon B", position: [6240, -3640, -1420], color: "#FFFAFA", description: "White dwarf companion to Procyon" },
    { name: "Van Maanen's Star", position: [-1420, 3640, -6240], color: "#F0F0F0", description: "Nearest solitary white dwarf" },
    { name: "40 Eridani B", position: [6260, -3660, 1440], color: "#E8E8E8", description: "First white dwarf discovered in triple system" },
    { name: "GD 356", position: [-1440, 3660, 6260], color: "#DCDCDC", description: "Magnetic white dwarf with spots" },
    { name: "RE J0317-853", position: [6280, -3680, -1460], color: "#D3D3D3", description: "Most magnetic white dwarf known" },
    { name: "Cygnus X-1", position: [-1460, 3680, -6280], color: "#000080", description: "First widely accepted black hole candidate" },
    { name: "GRS 1915+105 (II)", position: [6300, -3700, 1480], color: "#191970", description: "Microquasar with superluminal jets" },
    { name: "V404 Cygni", position: [-1480, 3700, 6300], color: "#00008B", description: "Black hole binary with dramatic outbursts" },
    { name: "SS 433", position: [6320, -3720, -1500], color: "#4B0082", description: "Microquasar with precessing jets" },
    { name: "Scorpius X-1", position: [-1500, 3720, -6320], color: "#8B008B", description: "Brightest persistent X-ray source in sky" },
    { name: "Her X-1", position: [6340, -3740, 1520], color: "#9400D3", description: "X-ray pulsar in binary system" },
    { name: "Cen X-3", position: [-1520, 3740, 6340], color: "#8A2BE2", description: "First X-ray pulsar discovered" },
    { name: "LMC X-1", position: [6360, -3760, -1540], color: "#9932CC", description: "First extragalactic black hole candidate" },
    { name: "M82 X-1", position: [-1540, 3760, -6360], color: "#BA55D3", description: "Ultraluminous X-ray source, possible IMBH" },
    { name: "HLX-1 (Hyper-Luminous X-ray Source)", position: [6380, -3780, 1560], color: "#DA70D6", description: "Best intermediate-mass black hole candidate" },
    { name: "TON 618", position: [-1560, 3780, 6380], color: "#000000", description: "One of most massive black holes known, 66 billion solar masses" },
    { name: "Alpha Centauri System (II)", position: [6400, -3800, -1580], color: "#FFD700", description: "Nearest star system, triple star with Proxima" },
    { name: "Sirius Binary System (II)", position: [-1580, 3800, -6400], color: "#F5F5F5", description: "Brightest star system with white dwarf companion" },
    { name: "Algol (Beta Persei)", position: [6420, -3820, 1600], color: "#87CEEB", description: "Demon Star, prototype eclipsing binary" },
    { name: "Mizar and Alcor", position: [-1600, 3820, 6420], color: "#ADD8E6", description: "Famous naked-eye double in Big Dipper handle" },
    { name: "Albireo (Beta Cygni)", position: [6440, -3840, -1620], color: "#FFD700", description: "Beautiful gold and blue double star" },
    { name: "Epsilon Lyrae (Double Double)", position: [-1620, 3840, -6440], color: "#E6E6FA", description: "Famous quadruple star system" },
    { name: "Zeta Reticuli", position: [6460, -3860, 1640], color: "#FFF8DC", description: "Wide binary system in southern sky" },
    { name: "61 Cygni", position: [-1640, 3860, 6460], color: "#FFA07A", description: "First star with measured parallax distance" },
    { name: "Gamma Virginis (Porrima)", position: [6480, -3880, -1660], color: "#F0FFF0", description: "Binary with nearly equal yellow-white stars" },
    { name: "Zeta Bootis", position: [-1660, 3880, -6480], color: "#FFFACD", description: "Close binary pair of A-type stars" },
    { name: "Beta Lyrae", position: [6500, -3900, 1680], color: "#B0E0E6", description: "Prototype semi-detached eclipsing binary" },
    { name: "W Ursae Majoris", position: [-1680, 3900, 6500], color: "#98FB98", description: "Prototype contact binary, stars touch" },
    { name: "RS Canum Venaticorum", position: [6520, -3920, -1700], color: "#DDA0DD", description: "Prototype chromospherically active binary" },
    { name: "AR Lacertae", position: [-1700, 3920, -6520], color: "#E6E6FA", description: "RS CVn-type active binary system" },
    { name: "Capella System", position: [6540, -3940, 1720], color: "#FFD700", description: "Bright quadruple system with two giant pairs" },
    { name: "Theta Orionis (Trapezium)", position: [-1720, 3940, 6540], color: "#87CEFA", description: "Multiple star system illuminating Orion Nebula" },
    { name: "Sigma Orionis System", position: [6560, -3960, -1740], color: "#ADD8E6", description: "Quintuple star system in Orion" },
    { name: "Nu Scorpii", position: [-1740, 3960, -6560], color: "#B0C4DE", description: "Septuple star system, seven stars total" },
    { name: "Castor Sextuple System", position: [6580, -3980, 1760], color: "#F5F5F5", description: "Six stars in three spectroscopic pairs" },
    { name: "Alpha Geminorum System", position: [-1760, 3980, 6580], color: "#FAFAD2", description: "Complex sextuple star in Gemini" },
    { name: "Eta Carinae Binary", position: [6600, -4000, -1780], color: "#FF69B4", description: "Massive binary with giant eruptions" },
    { name: "WR 104", position: [-1780, 4000, -6600], color: "#9400D3", description: "Wolf-Rayet binary with spiral dust plume" },
    { name: "PSR B1913+16 (Hulse-Taylor)", position: [6620, -4020, 1800], color: "#00FF00", description: "First binary pulsar, proved gravitational waves" },
    { name: "PSR J0737-3039", position: [-1800, 4020, 6620], color: "#32CD32", description: "Double pulsar, only known example" },
    { name: "AM CVn Stars", position: [6640, -4040, -1820], color: "#FF6347", description: "Ultracompact binaries with helium transfer" },
    { name: "Delta Cephei", position: [-1820, 4040, 6640], color: "#FFD700", description: "Prototype Cepheid variable, distance indicator" },
    { name: "Eta Aquilae", position: [6660, -4060, 1840], color: "#FFA500", description: "Bright Cepheid variable in Aquila" },
    { name: "Zeta Geminorum", position: [-1840, 4060, -6660], color: "#DAA520", description: "Cepheid visible to naked eye" },
    { name: "RS Puppis", position: [6680, -4080, -1860], color: "#FFD700", description: "Cepheid with stunning light echoes" },
    { name: "RR Lyrae", position: [-1860, 4080, 6680], color: "#F0E68C", description: "Prototype RR Lyrae variable, old population" },
    { name: "Mira (Omicron Ceti)", position: [6700, -4100, 1880], color: "#FF4500", description: "Prototype long-period variable, first discovered" },
    { name: "Chi Cygni", position: [-1880, 4100, -6700], color: "#FF6347", description: "Mira variable with extreme brightness range" },
    { name: "R Leonis", position: [6720, -4120, -1900], color: "#CD5C5C", description: "Bright Mira variable in Leo" },
    { name: "R Andromedae", position: [-1900, 4120, 6720], color: "#DC143C", description: "S-type Mira variable with zirconium oxide" },
    { name: "R Hydrae", position: [6740, -4140, 1920], color: "#B22222", description: "Long-period variable with changing period" },
    { name: "T Tauri", position: [-1920, 4140, -6740], color: "#FFA07A", description: "Prototype pre-main-sequence variable" },
    { name: "FU Orionis", position: [6760, -4160, -1940], color: "#FF8C00", description: "Prototype FUor eruptive variable" },
    { name: "EX Lupi", position: [-1940, 4160, 6760], color: "#FF7F50", description: "Prototype EXor eruptive young star" },
    { name: "R Coronae Borealis", position: [6780, -4180, 1960], color: "#8B4513", description: "Prototype RCB variable, carbon dust fading" },
    { name: "UV Ceti", position: [-1960, 4180, -6780], color: "#FF0000", description: "Prototype flare star, dramatic outbursts" },
    { name: "AD Leonis", position: [6800, -4200, -1980], color: "#FF3030", description: "Active flare star near Earth" },
    { name: "YZ Canis Minoris", position: [-1980, 4200, 6800], color: "#FF4040", description: "Nearby flare star with superflares" },
    { name: "BY Draconis", position: [6820, -4220, 2000], color: "#FFA500", description: "Prototype spotted variable star" },
    { name: "RS CVn", position: [-2000, 4220, -6820], color: "#FFB347", description: "Chromospherically active spotted binary" },
    { name: "FK Comae Berenices", position: [6840, -4240, -2020], color: "#FF6600", description: "Prototype rapidly rotating giant with spots" },
    { name: "Mu Cephei (Garnet Star)", position: [-2020, 4240, 6840], color: "#8B0000", description: "Red supergiant, one of largest stars known" },
    { name: "VY Canis Majoris", position: [6860, -4260, 2040], color: "#B22222", description: "Red hypergiant, extremely large and luminous" },
    { name: "UY Scuti", position: [-2040, 4260, -6860], color: "#A52A2A", description: "One of largest known stars by radius" },
    { name: "Stephenson 2-18", position: [6880, -4280, -2060], color: "#800000", description: "Possibly the largest known star" },
    { name: "WOH G64", position: [-2060, 4280, 6880], color: "#8B0000", description: "Red supergiant in Large Magellanic Cloud" },
    { name: "Large Magellanic Cloud (III)", position: [-2100, 4300, 6900], color: "#87CEEB", description: "Irregular dwarf galaxy, largest Milky Way satellite" },
    { name: "Small Magellanic Cloud (III)", position: [-2150, 4350, 6950], color: "#B0C4DE", description: "Dwarf irregular galaxy visible from Southern Hemisphere" },
    { name: "Sagittarius Dwarf Elliptical", position: [-2200, 4400, 7000], color: "#DDA0DD", description: "Dwarf galaxy being tidally disrupted by Milky Way" },
    { name: "Ursa Minor Dwarf", position: [-2250, 4450, 7050], color: "#E6E6FA", description: "Ancient dwarf spheroidal galaxy satellite of Milky Way" },
    { name: "Draco Dwarf Galaxy", position: [-2300, 4500, 7100], color: "#D8BFD8", description: "Faint dwarf spheroidal in constellation Draco" },
    { name: "Carina Dwarf Galaxy", position: [-2350, 4550, 7150], color: "#FFF0F5", description: "Dwarf spheroidal showing multiple star formation epochs" },
    { name: "Sextans Dwarf Galaxy", position: [-2400, 4600, 7200], color: "#FAF0E6", description: "Very low surface brightness dwarf spheroidal" },
    { name: "Sculptor Dwarf Galaxy", position: [-2450, 4650, 7250], color: "#F5F5DC", description: "First dwarf spheroidal discovered outside Milky Way globulars" },
    { name: "Fornax Dwarf Galaxy", position: [-2500, 4700, 7300], color: "#FAEBD7", description: "Dwarf spheroidal with its own globular cluster system" },
    { name: "Leo I Dwarf Galaxy", position: [-2550, 4750, 7350], color: "#FFF8DC", description: "Remote dwarf spheroidal satellite of Milky Way" },
    { name: "Leo II Dwarf Galaxy", position: [-2600, 4800, 7400], color: "#FFFACD", description: "Isolated dwarf spheroidal galaxy in Leo constellation" },
    { name: "Canis Major Overdensity", position: [-2650, 4850, 7450], color: "#FFE4B5", description: "Possible dwarf galaxy remnant in our galactic disk" },
    { name: "Bootes I Dwarf Galaxy", position: [-2700, 4900, 7500], color: "#FFEFD5", description: "Ultra-faint dwarf spheroidal dominated by dark matter" },
    { name: "Segue 1 Ultra-Faint Dwarf", position: [-2750, 4950, 7550], color: "#FFEBCD", description: "One of smallest and darkest galaxies known" },
    { name: "Willman 1 Ultra-Faint", position: [-2800, 5000, 7600], color: "#FFE4C4", description: "Tiny ultra-faint satellite galaxy of Milky Way" },
    { name: "Coma Berenices Dwarf", position: [-2850, 5050, 7650], color: "#FFDAB9", description: "Ultra-faint dwarf galaxy discovered in SDSS data" },
    { name: "Ursa Major II Dwarf", position: [-2900, 5100, 7700], color: "#EEE8AA", description: "Ultra-faint dwarf spheroidal rich in dark matter" },
    { name: "Hercules Dwarf Galaxy", position: [-2950, 5150, 7750], color: "#F0E68C", description: "Elongated ultra-faint dwarf being tidally stretched" },
    { name: "Leo T Dwarf Galaxy", position: [-3000, 5200, 7800], color: "#BDB76B", description: "Gas-rich dwarf irregular at edge of Local Group" },
    { name: "Tucana II Ultra-Faint", position: [-3050, 5250, 7850], color: "#9ACD32", description: "Ancient ultra-faint dwarf with extended stellar halo" },
    { name: "Reticulum II Ultra-Faint", position: [-3100, 5300, 7900], color: "#98FB98", description: "Ultra-faint dwarf enriched by r-process elements" },
    { name: "Horologium I Ultra-Faint", position: [-3150, 5350, 7950], color: "#90EE90", description: "Recently discovered ultra-faint satellite galaxy" },
    { name: "Grus I Ultra-Faint", position: [-3200, 5400, 8000], color: "#8FBC8F", description: "Faint dwarf galaxy in the Grus constellation" },
    { name: "Pisces II Ultra-Faint", position: [-3250, 5450, 8050], color: "#3CB371", description: "Ultra-faint Milky Way satellite in Pisces" },
    { name: "Pegasus III Ultra-Faint", position: [-3300, 5500, 8100], color: "#2E8B57", description: "Distant ultra-faint dwarf galaxy candidate" },
    { name: "M32 Compact Elliptical", position: [-3350, 5550, 8150], color: "#C0C0C0", description: "Compact elliptical satellite of Andromeda Galaxy" },
    { name: "M110 Dwarf Elliptical", position: [-3400, 5600, 8200], color: "#A9A9A9", description: "Dwarf elliptical galaxy satellite of Andromeda" },
    { name: "NGC 185 Dwarf Spheroidal", position: [-3450, 5650, 8250], color: "#808080", description: "Dwarf spheroidal satellite of Andromeda with dust lanes" },
    { name: "NGC 147 Dwarf Spheroidal", position: [-3500, 5700, 8300], color: "#696969", description: "Ancient dwarf spheroidal companion to Andromeda" },
    { name: "Andromeda I Dwarf", position: [-3550, 5750, 8350], color: "#778899", description: "Dwarf spheroidal satellite of Andromeda Galaxy" },
    { name: "Andromeda II Dwarf", position: [-3600, 5800, 8400], color: "#708090", description: "Isolated dwarf spheroidal in Andromeda subgroup" },
    { name: "Andromeda III Dwarf", position: [-3650, 5850, 8450], color: "#2F4F4F", description: "Faint dwarf spheroidal Andromeda satellite" },
    { name: "Triangulum Galaxy M33 (II)", position: [-3700, 5900, 8500], color: "#4682B4", description: "Third-largest Local Group spiral galaxy" },
    { name: "IC 10 Starburst Dwarf", position: [-3750, 5950, 8550], color: "#5F9EA0", description: "Only starburst galaxy in the Local Group" },
    { name: "IC 1613 Irregular Galaxy", position: [-3800, 6000, 8600], color: "#6495ED", description: "Irregular dwarf galaxy of the Local Group" },
    { name: "Phoenix Dwarf Galaxy", position: [-3850, 6050, 8650], color: "#7B68EE", description: "Transition-type dwarf galaxy in Local Group" },
    { name: "NGC 6822 Barnard's Galaxy", position: [-3900, 6100, 8700], color: "#6A5ACD", description: "Irregular Local Group galaxy studied by Hubble" },
    { name: "Wolf-Lundmark-Melotte Galaxy", position: [-3950, 6150, 8750], color: "#483D8B", description: "Isolated barred irregular at Local Group edge" },
    { name: "Aquarius Dwarf Irregular", position: [-4000, 6200, 8800], color: "#191970", description: "Faint irregular dwarf in Local Group outskirts" },
    { name: "Pegasus Dwarf Irregular", position: [-4050, 6250, 8850], color: "#000080", description: "Dwarf irregular galaxy transitioning to spheroidal" },
    { name: "Leo A Dwarf Irregular", position: [-4100, 6300, 8900], color: "#00008B", description: "Isolated gas-rich dwarf in Local Group" },
    { name: "Tucana Dwarf Galaxy", position: [-4150, 6350, 8950], color: "#0000CD", description: "Isolated dwarf spheroidal at Local Group boundary" },
    { name: "Cetus Dwarf Galaxy", position: [-4200, 6400, 9000], color: "#4169E1", description: "Isolated dwarf spheroidal in Local Group halo" },
    { name: "Antlia Dwarf Galaxy", position: [-4250, 6450, 9050], color: "#1E90FF", description: "Low surface brightness dwarf spheroidal" },
    { name: "Sextans A Irregular", position: [-4300, 6500, 9100], color: "#00BFFF", description: "Irregular dwarf at edge of Local Group" },
    { name: "Sextans B Irregular", position: [-4350, 6550, 9150], color: "#87CEEB", description: "Dwarf irregular paired with Sextans A" },
    { name: "NGC 3109 Magellanic Spiral", position: [-4400, 6600, 9200], color: "#87CEFA", description: "Edge-on Magellanic spiral in Local Group" },
    { name: "Antlia B Dwarf Galaxy", position: [-4450, 6650, 9250], color: "#ADD8E6", description: "Recently discovered Local Group dwarf" },
    { name: "KKH 98 Dwarf Irregular", position: [-4500, 6700, 9300], color: "#B0E0E6", description: "Faint dwarf irregular galaxy near Andromeda" },
    { name: "Cassiopeia Dwarf Andromeda VII", position: [-4550, 6750, 9350], color: "#AFEEEE", description: "Distant spheroidal satellite of Andromeda" },
    { name: "Seyfert Type 1 AGN", position: [-4600, 6800, 9400], color: "#FF6347", description: "Active galaxy with broad emission lines visible" },
    { name: "Seyfert Type 2 AGN", position: [-4650, 6850, 9450], color: "#FF4500", description: "Active galaxy with narrow emission lines only" },
    { name: "LINER Low-Ionization AGN", position: [-4700, 6900, 9500], color: "#DC143C", description: "Low-ionization nuclear emission region galaxy" },
    { name: "NGC 1068 Seyfert Prototype", position: [-4750, 6950, 9550], color: "#B22222", description: "Archetypal Seyfert 2 galaxy in Cetus" },
    { name: "NGC 4151 Eye of Sauron", position: [-4800, 7000, 9600], color: "#8B0000", description: "Nearby Seyfert 1.5 with variable X-ray emission" },
    { name: "NGC 5548 Seyfert", position: [-4850, 7050, 9650], color: "#CD5C5C", description: "Well-studied Seyfert 1 used for reverberation mapping" },
    { name: "Mrk 421 High-Energy Blazar", position: [-4900, 7100, 9700], color: "#F08080", description: "Nearby blazar with extreme TeV gamma-ray emission" },
    { name: "Mrk 501 TeV Blazar", position: [-4950, 7150, 9750], color: "#FA8072", description: "BL Lac object with rapid variability" },
    { name: "OJ 287 Binary SMBH Blazar", position: [-5000, 7200, 9800], color: "#E9967A", description: "Blazar hosting candidate binary supermassive black hole" },
    { name: "PKS 2155-304 Blazar", position: [-5050, 7250, 9850], color: "#FFA07A", description: "Southern BL Lac with famous 2006 flare" },
    { name: "3C 454.3 Crazy Diamond", position: [-5100, 7300, 9900], color: "#FF7F50", description: "Flat-spectrum radio quasar with extreme outbursts" },
    { name: "Fairall 9 Seyfert", position: [-5150, 7350, 9950], color: "#FF6347", description: "Luminous Seyfert 1 with strong iron emission" },
    { name: "NGC 7469 Seyfert Starburst", position: [-5200, 7400, 10000], color: "#FF4500", description: "Seyfert 1 with circumnuclear starburst ring" },
    { name: "Arp 220 Ultraluminous LIRG", position: [-5250, 7450, 10050], color: "#FFD700", description: "Ultraluminous infrared galaxy merger" },
    { name: "Circinus Galaxy Seyfert", position: [-5300, 7500, 10100], color: "#FFA500", description: "Nearest Seyfert 2 with ionization cones" },
    { name: "NGC 1275 Perseus A", position: [-5350, 7550, 10150], color: "#FF8C00", description: "Seyfert galaxy at center of Perseus Cluster" },
    { name: "Cygnus A Radio Galaxy", position: [-5400, 7600, 10200], color: "#FF69B4", description: "Powerful FR II radio galaxy with huge lobes" },
    { name: "Centaurus A NGC 5128 (II)", position: [-5450, 7650, 10250], color: "#FF1493", description: "Nearest giant radio galaxy with dust lane" },
    { name: "M77 Cetus A Seyfert", position: [-5500, 7700, 10300], color: "#DB7093", description: "Barred spiral with luminous Seyfert 2 nucleus" },
    { name: "NGC 4258 Water Maser Galaxy", position: [-5550, 7750, 10350], color: "#C71585", description: "Seyfert with megamaser for precise distance" },
    { name: "NGC 3783 Southern Seyfert", position: [-5600, 7800, 10400], color: "#DA70D6", description: "Bright Seyfert 1 extensively studied in X-rays" },
    { name: "MCG-6-30-15 Iron Line Source", position: [-5650, 7850, 10450], color: "#BA55D3", description: "Seyfert 1 with broad relativistic iron line" },
    { name: "IC 4329A Luminous Seyfert", position: [-5700, 7900, 10500], color: "#9932CC", description: "One of brightest hard X-ray Seyfert galaxies" },
    { name: "IRAS 13224-3809 NLS1", position: [-5750, 7950, 10550], color: "#9400D3", description: "Narrow-line Seyfert 1 with extreme variability" },
    { name: "1H 0707-495 Extreme NLS1", position: [-5800, 8000, 10600], color: "#8B008B", description: "Narrow-line Seyfert 1 with relativistic reflection" },
    { name: "Scorpius-Centaurus OB Association", position: [-5850, 8050, 10650], color: "#00CED1", description: "Nearest OB association to the Sun" },
    { name: "Orion OB1 Association", position: [-5900, 8100, 10700], color: "#20B2AA", description: "Massive OB association containing Orion Nebula" },
    { name: "Cygnus OB2 Stellar Association", position: [-5950, 8150, 10750], color: "#48D1CC", description: "One of largest OB associations in Milky Way" },
    { name: "Perseus OB1 Association", position: [-6000, 8200, 10800], color: "#40E0D0", description: "Young stellar association in Perseus arm" },
    { name: "Lacerta OB1 Association", position: [-6050, 8250, 10850], color: "#00FFFF", description: "OB association containing blue supergiant stars" },
    { name: "Cepheus OB2 Association", position: [-6100, 8300, 10900], color: "#E0FFFF", description: "OB association with embedded star formation" },
    { name: "Ursa Major Moving Group", position: [-6150, 8350, 10950], color: "#AFEEEE", description: "Nearby stellar stream including Big Dipper stars" },
    { name: "Hyades Moving Group", position: [-6200, 8400, 11000], color: "#7FFFD4", description: "Extended stellar stream from Hyades cluster" },
    { name: "AB Doradus Moving Group", position: [-6250, 8450, 11050], color: "#66CDAA", description: "Young nearby moving group about 50 million years old" },
    { name: "Beta Pictoris Moving Group", position: [-6300, 8500, 11100], color: "#8FBC8F", description: "Young stellar association with debris disks" },
    { name: "TW Hydrae Association", position: [-6350, 8550, 11150], color: "#3CB371", description: "Nearest T Tauri association with protoplanetary disks" },
    { name: "Tucana-Horologium Association", position: [-6400, 8600, 11200], color: "#2E8B57", description: "Young moving group about 45 million years old" },
    { name: "Columba Association", position: [-6450, 8650, 11250], color: "#228B22", description: "Nearby young stellar association in southern sky" },
    { name: "Argus Association", position: [-6500, 8700, 11300], color: "#008000", description: "Young moving group discovered via kinematics" },
    { name: "Carina Association", position: [-6550, 8750, 11350], color: "#006400", description: "Young stellar association near Carina Nebula" },
    { name: "Octans Association", position: [-6600, 8800, 11400], color: "#556B2F", description: "Southern hemisphere young moving group" },
    { name: "Castor Moving Group", position: [-6650, 8850, 11450], color: "#6B8E23", description: "Stellar stream including the star Castor" },
    { name: "IC 2391 Supercluster", position: [-6700, 8900, 11500], color: "#808000", description: "Extended stellar stream from IC 2391 cluster" },
    { name: "Pleiades Moving Group", position: [-6750, 8950, 11550], color: "#BDB76B", description: "Extended halo of Pleiades cluster members" },
    { name: "HR 1614 Moving Group", position: [-6800, 9000, 11600], color: "#DAA520", description: "Metal-rich stellar stream in solar neighborhood" },
    { name: "Wolf 630 Moving Group", position: [-6850, 9050, 11650], color: "#B8860B", description: "Nearby red dwarf dominated moving group" },
    { name: "Epsilon Chamaeleontis Association", position: [-6900, 9100, 11700], color: "#CD853F", description: "Very young association with circumstellar disks" },
    { name: "Eta Chamaeleontis Cluster", position: [-6950, 9150, 11750], color: "#D2691E", description: "Sparse young cluster in Chamaeleon" },
    { name: "32 Orionis Moving Group", position: [-7000, 9200, 11800], color: "#8B4513", description: "Young nearby association about 22 million years old" },
    { name: "Carina-Near Moving Group", position: [-7050, 9250, 11850], color: "#A0522D", description: "Intermediate-age stellar association" },
    { name: "3C 273 First Quasar", position: [-7100, 9300, 11900], color: "#FFFACD", description: "First quasar identified, brightest in sky" },
    { name: "3C 48 Radio Quasar", position: [-7150, 9350, 11950], color: "#FAFAD2", description: "First radio source identified as a quasar" },
    { name: "PKS 1830-211 Gravitational Lens", position: [-7200, 9400, 12000], color: "#FFEFD5", description: "Lensed quasar with molecular absorption" },
    { name: "APM 08279+5255 Hyperluminous", position: [-7250, 9450, 12050], color: "#FFE4B5", description: "One of most luminous objects known" },
    { name: "HS 1700+6416 Bright Quasar", position: [-7300, 9500, 12100], color: "#FFDAB9", description: "Luminous quasar used for IGM studies" },
    { name: "PG 1211+143 Ultrafast Outflow", position: [-7350, 9550, 12150], color: "#EEE8AA", description: "Quasar with relativistic winds" },
    { name: "SDSS J1030+0524 High-z", position: [-7400, 9600, 12200], color: "#F0E68C", description: "Distant quasar at redshift 6.3" },
    { name: "ULAS J1120+0641 Early Quasar", position: [-7450, 9650, 12250], color: "#BDB76B", description: "Quasar from 750 million years after Big Bang" },
    { name: "ULAS J1342+0928 Record Holder", position: [-7500, 9700, 12300], color: "#E6E6FA", description: "One of most distant quasars at z=7.54" },
    { name: "Ton 618 Ultramassive", position: [-7550, 9750, 12350], color: "#D8BFD8", description: "Quasar hosting 66 billion solar mass black hole" },
    { name: "S5 0014+81 Hyperluminous", position: [-7600, 9800, 12400], color: "#DDA0DD", description: "Extremely luminous quasar with massive BH" },
    { name: "Einstein Cross Q2237+030", position: [-7650, 9850, 12450], color: "#EE82EE", description: "Gravitationally lensed quasar with four images" },
    { name: "Cloverleaf Quasar H1413+117", position: [-7700, 9900, 12500], color: "#DA70D6", description: "Four-image gravitational lens system" },
    { name: "Twin Quasar Q0957+561", position: [-7750, 9950, 12550], color: "#BA55D3", description: "First discovered gravitational lens" },
    { name: "PG 1115+080 Lensed Quasar", position: [-7800, 10000, 12600], color: "#9932CC", description: "Quadruple-image gravitational lens" },
    { name: "HE 1104-1805 Double Quasar", position: [-7850, 10050, 12650], color: "#9400D3", description: "Strongly lensed quasar with time delay" },
    { name: "RX J1131-1231 X-ray Lens", position: [-7900, 10100, 12700], color: "#8A2BE2", description: "Quadruple quasar lens studied in X-rays" },
    { name: "SDSS J1004+4112 Cluster Lens", position: [-7950, 10150, 12750], color: "#8B008B", description: "Quasar lensed by galaxy cluster" },
    { name: "PHL 1811 NLS1 Quasar", position: [-8000, 10200, 12800], color: "#9370DB", description: "Narrow-line Seyfert 1 quasar" },
    { name: "HE 0435-1223 Time Delay", position: [-8050, 10250, 12850], color: "#7B68EE", description: "Quadruple lens for Hubble constant" },
    { name: "B1422+231 Radio Quasar Lens", position: [-8100, 10300, 12900], color: "#6A5ACD", description: "Radio-loud lensed quasar" },
    { name: "PKS 0637-752 Jet Quasar", position: [-8150, 10350, 12950], color: "#483D8B", description: "Quasar with spectacular X-ray jet" },
    { name: "3C 279 Superluminal Quasar", position: [-8200, 10400, 13000], color: "#4169E1", description: "First quasar showing apparent superluminal motion" },
    { name: "3C 9 High-z Radio Quasar", position: [-8250, 10450, 13050], color: "#0000FF", description: "Distant powerful radio quasar" },
    { name: "J0313-1806 Most Distant", position: [-8300, 10500, 13100], color: "#0000CD", description: "Quasar at z=7.64, earliest known" },
    { name: "NGC 1 Lenticular Galaxy", position: [-8350, 10550, 13150], color: "#4682B4", description: "First object in New General Catalogue" },
    { name: "NGC 7789 Caroline's Rose", position: [-8400, 10600, 13200], color: "#5F9EA0", description: "Open cluster discovered by Caroline Herschel" },
    { name: "NGC 253 Sculptor Galaxy", position: [-8450, 10650, 13250], color: "#6495ED", description: "Bright starburst spiral in Sculptor Group" },
    { name: "NGC 2403 Intermediate Spiral", position: [-8500, 10700, 13300], color: "#7B68EE", description: "Spiral galaxy in M81 Group" },
    { name: "NGC 2841 Flocculent Spiral", position: [-8550, 10750, 13350], color: "#6A5ACD", description: "Galaxy with fragmented spiral arms" },
    { name: "NGC 3115 Spindle Galaxy", position: [-8600, 10800, 13400], color: "#483D8B", description: "Edge-on lenticular with supermassive black hole" },
    { name: "NGC 3132 Eight-Burst Nebula", position: [-8650, 10850, 13450], color: "#00CED1", description: "Southern Ring planetary nebula" },
    { name: "NGC 3242 Ghost of Jupiter", position: [-8700, 10900, 13500], color: "#20B2AA", description: "Planetary nebula resembling Jupiter" },
    { name: "NGC 3372 Great Carina Nebula", position: [-8750, 10950, 13550], color: "#48D1CC", description: "Giant HII region with Eta Carinae" },
    { name: "NGC 4565 Needle Galaxy", position: [-8800, 11000, 13600], color: "#40E0D0", description: "Perfect edge-on spiral galaxy" },
    { name: "NGC 4631 Whale Galaxy", position: [-8850, 11050, 13650], color: "#00FFFF", description: "Edge-on spiral with companion hockey stick" },
    { name: "NGC 4676 The Mice Galaxies", position: [-8900, 11100, 13700], color: "#E0FFFF", description: "Interacting pair with long tidal tails" },
    { name: "NGC 5128 Centaurus A Core", position: [-8950, 11150, 13750], color: "#AFEEEE", description: "Peculiar galaxy with prominent dust lane" },
    { name: "NGC 5195 M51 Companion", position: [-9000, 11200, 13800], color: "#7FFFD4", description: "Interacting companion of Whirlpool Galaxy" },
    { name: "NGC 6543 Cat's Eye Core", position: [-9050, 11250, 13850], color: "#66CDAA", description: "Complex planetary nebula structure" },
    { name: "NGC 6720 Ring Nebula Core", position: [-9100, 11300, 13900], color: "#8FBC8F", description: "Famous planetary nebula in Lyra" },
    { name: "NGC 6826 Blinking Planetary", position: [-9150, 11350, 13950], color: "#3CB371", description: "Planetary that appears to blink" },
    { name: "NGC 6960 Western Veil", position: [-9200, 11400, 14000], color: "#2E8B57", description: "Delicate filaments of Cygnus Loop" },
    { name: "NGC 6992 Eastern Veil", position: [-9250, 11450, 14050], color: "#228B22", description: "Bright arc of the Veil Nebula" },
    { name: "NGC 7000 North America Emission", position: [-9300, 11500, 14100], color: "#008000", description: "Large emission nebula in Cygnus" },
    { name: "NGC 7027 Jewel Bug Nebula", position: [-9350, 11550, 14150], color: "#006400", description: "Young compact planetary nebula" },
    { name: "NGC 7293 Helix Core Region", position: [-9400, 11600, 14200], color: "#556B2F", description: "Nearest bright planetary nebula" },
    { name: "IC 434 Horsehead Region", position: [-9450, 11650, 14250], color: "#6B8E23", description: "Emission nebula behind Horsehead" },
    { name: "IC 2118 Witch Head Reflection", position: [-9500, 11700, 14300], color: "#808000", description: "Reflection nebula near Rigel" },
    { name: "IC 5070 Pelican Nebula", position: [-9550, 11750, 14350], color: "#BDB76B", description: "Emission nebula adjacent to North America" },
    { name: "Sagittarius A West HII", position: [-9600, 11800, 14400], color: "#FF6347", description: "Ionized gas spiral at galactic center" },
    { name: "Cassiopeia A SNR Radio", position: [-9650, 11850, 14450], color: "#FF4500", description: "Brightest extrasolar radio source in sky" },
    { name: "Taurus A Crab Radio", position: [-9700, 11900, 14500], color: "#DC143C", description: "Radio emission from Crab Nebula" },
    { name: "Virgo A M87 Radio", position: [-9750, 11950, 14550], color: "#B22222", description: "Giant radio lobes from M87 jet" },
    { name: "Hercules A 3C 348", position: [-9800, 12000, 14600], color: "#8B0000", description: "Spectacular radio jets and lobes" },
    { name: "Fornax A NGC 1316 Radio", position: [-9850, 12050, 14650], color: "#CD5C5C", description: "Radio galaxy from recent merger" },
    { name: "Pictor A Powerful Radio", position: [-9900, 12100, 14700], color: "#F08080", description: "Radio galaxy with X-ray hotspot" },
    { name: "Hydra A Cooling Flow", position: [-9950, 12150, 14750], color: "#FA8072", description: "Radio source in cooling flow cluster" },
    { name: "Perseus A 3C 84 Radio", position: [-10000, 12200, 14800], color: "#E9967A", description: "Restarted radio source in Perseus" },
    { name: "3C 295 Distant Radio Galaxy", position: [-10050, 12250, 14850], color: "#FFA07A", description: "Historic distant radio galaxy" },
    { name: "3C 236 Giant Radio Galaxy", position: [-10100, 12300, 14900], color: "#FF7F50", description: "One of largest structures in universe" },
    { name: "DA 240 Giant Radio Source", position: [-10150, 12350, 14950], color: "#FF6347", description: "Massive radio galaxy spanning megaparsecs" },
    { name: "Abell 2256 Radio Relic", position: [-10200, 12400, 15000], color: "#FF4500", description: "Cluster with spectacular radio relics" },
    { name: "Abell 3667 Double Relic", position: [-10250, 12450, 15050], color: "#FFD700", description: "Merging cluster with twin radio relics" },
    { name: "Toothbrush Radio Relic", position: [-10300, 12500, 15100], color: "#FFA500", description: "Linear radio relic in CIZA J2242" },
    { name: "Sausage Radio Relic", position: [-10350, 12550, 15150], color: "#FF8C00", description: "Bright arc-shaped cluster radio relic" },
    { name: "Phoenix Cluster Radio", position: [-10400, 12600, 15200], color: "#FF69B4", description: "Extreme starburst cluster radio source" },
    { name: "MS 0735 Giant Cavities", position: [-10450, 12650, 15250], color: "#FF1493", description: "Record AGN outburst radio bubbles" },
    { name: "4C 41.17 High-z Radio", position: [-10500, 12700, 15300], color: "#DB7093", description: "Distant radio galaxy with active star formation" },
    { name: "TN J0924-2201 z=5.2 Radio", position: [-10550, 12750, 15350], color: "#C71585", description: "One of most distant radio galaxies" },
    { name: "MRC 1138-262 Spiderweb", position: [-10600, 12800, 15400], color: "#DA70D6", description: "Merging protocluster radio galaxy" },
    { name: "B2 0902+34 High-z Source", position: [-10650, 12850, 15450], color: "#BA55D3", description: "Luminous distant radio galaxy" },
    { name: "8C 1435+635 Distant Giant", position: [-10700, 12900, 15500], color: "#9932CC", description: "Giant radio galaxy at high redshift" },
    { name: "PKS 1138-26 Proto-BCG", position: [-10750, 12950, 15550], color: "#9400D3", description: "Forming brightest cluster galaxy" },
    { name: "VLSS J2217+59 Giant", position: [-10800, 13000, 15600], color: "#8B008B", description: "Giant radio galaxy from VLSS survey" },
    { name: "Celestial Equator Reference", position: [-10850, 13050, 15650], color: "#00CED1", description: "Earth's equator projected onto celestial sphere" },
    { name: "Ecliptic Plane", position: [-10900, 13100, 15700], color: "#20B2AA", description: "Plane of Earth's orbit around Sun" },
    { name: "Galactic Plane Zero", position: [-10950, 13150, 15750], color: "#48D1CC", description: "Milky Way disk midplane reference" },
    { name: "North Celestial Pole", position: [-11000, 13200, 15800], color: "#40E0D0", description: "Point directly above Earth's north pole" },
    { name: "South Celestial Pole", position: [-11050, 13250, 15850], color: "#00FFFF", description: "Point directly above Earth's south pole" },
    { name: "Vernal Equinox Point", position: [-11100, 13300, 15900], color: "#E0FFFF", description: "Zero point of right ascension" },
    { name: "Galactic Center Direction", position: [-11150, 13350, 15950], color: "#AFEEEE", description: "Zero point of galactic longitude" },
    { name: "North Galactic Pole", position: [-11200, 13400, 16000], color: "#7FFFD4", description: "Perpendicular to Milky Way disk" },
    { name: "Solar Apex Direction", position: [-11250, 13450, 16050], color: "#66CDAA", description: "Direction of Sun's motion through galaxy" },
    { name: "Local Standard of Rest", position: [-11300, 13500, 16100], color: "#8FBC8F", description: "Reference frame for stellar motions" },
    { name: "Barycenter Solar System", position: [-11350, 13550, 16150], color: "#3CB371", description: "Center of mass of entire Solar System" },
    { name: "Earth-Moon Barycenter", position: [-11400, 13600, 16200], color: "#2E8B57", description: "Center of mass of Earth-Moon system" },
    { name: "Lagrange Point L1", position: [-11450, 13650, 16250], color: "#228B22", description: "Inner equilibrium point for solar observations" },
    { name: "Lagrange Point L2", position: [-11500, 13700, 16300], color: "#008000", description: "Outer equilibrium for space telescopes" },
    { name: "Lagrange Point L4 Trojans", position: [-11550, 13750, 16350], color: "#006400", description: "Leading triangular point with asteroids" },
    { name: "Lagrange Point L5 Trojans", position: [-11600, 13800, 16400], color: "#556B2F", description: "Trailing triangular point with asteroids" },
    { name: "Hill Sphere Boundary", position: [-11650, 13850, 16450], color: "#6B8E23", description: "Gravitational sphere of influence" },
    { name: "Roche Limit Zone", position: [-11700, 13900, 16500], color: "#808000", description: "Tidal disruption boundary for moons" },
    { name: "ICRS Reference Frame", position: [-11750, 13950, 16550], color: "#BDB76B", description: "International celestial reference system" },
    { name: "Hipparcos Reference Frame", position: [-11800, 14000, 16600], color: "#DAA520", description: "Space astrometry coordinate system" },
    { name: "Gaia Reference Frame", position: [-11850, 14050, 16650], color: "#B8860B", description: "Most precise celestial reference system" },
    { name: "UTC Time Standard", position: [-11900, 14100, 16700], color: "#CD853F", description: "Coordinated Universal Time reference" },
    { name: "TAI Atomic Time", position: [-11950, 14150, 16750], color: "#D2691E", description: "International Atomic Time standard" },
    { name: "TDB Barycentric Time", position: [-12000, 14200, 16800], color: "#8B4513", description: "Time for solar system ephemerides" },
    { name: "Julian Date Epoch", position: [-12050, 14250, 16850], color: "#A0522D", description: "Continuous day count for astronomy" },
    { name: "Speed of Light Constant", position: [-12100, 14300, 16900], color: "#FFD700", description: "Universal speed limit 299,792,458 m/s" },
    { name: "Gravitational Constant G", position: [-12150, 14350, 16950], color: "#FFA500", description: "Newton's constant of gravitation" },
    { name: "Planck Constant h", position: [-12200, 14400, 17000], color: "#FF8C00", description: "Quantum of action in physics" },
    { name: "Boltzmann Constant k", position: [-12250, 14450, 17050], color: "#FF7F50", description: "Links temperature to energy" },
    { name: "Stefan-Boltzmann Constant", position: [-12300, 14500, 17100], color: "#FF6347", description: "Relates temperature to radiation" },
    { name: "Astronomical Unit AU", position: [-12350, 14550, 17150], color: "#FF4500", description: "Earth-Sun average distance" },
    { name: "Parsec Distance Unit", position: [-12400, 14600, 17200], color: "#DC143C", description: "3.26 light-years parallax unit" },
    { name: "Light-Year Distance", position: [-12450, 14650, 17250], color: "#B22222", description: "Distance light travels in one year" },
    { name: "Solar Mass Unit", position: [-12500, 14700, 17300], color: "#8B0000", description: "Standard stellar mass reference" },
    { name: "Solar Luminosity Unit", position: [-12550, 14750, 17350], color: "#CD5C5C", description: "Standard stellar brightness reference" },
    { name: "Solar Radius Unit", position: [-12600, 14800, 17400], color: "#F08080", description: "Standard stellar size reference" },
    { name: "Earth Mass Unit", position: [-12650, 14850, 17450], color: "#FA8072", description: "Standard planetary mass reference" },
    { name: "Jupiter Mass Unit", position: [-12700, 14900, 17500], color: "#E9967A", description: "Giant planet mass standard" },
    { name: "Chandrasekhar Mass Limit", position: [-12750, 14950, 17550], color: "#FFA07A", description: "Maximum white dwarf mass 1.4 solar" },
    { name: "Eddington Luminosity", position: [-12800, 15000, 17600], color: "#FF7F50", description: "Maximum radiation pressure limit" },
    { name: "Schwarzschild Radius (II)", position: [-12850, 15050, 17650], color: "#FF6347", description: "Event horizon size formula" },
    { name: "Hubble Constant H0 (II)", position: [-12900, 15100, 17700], color: "#FF4500", description: "Universe expansion rate parameter" },
    { name: "Cosmological Constant Lambda", position: [-12950, 15150, 17750], color: "#FFD700", description: "Dark energy density parameter" },
    { name: "Critical Density Universe", position: [-13000, 15200, 17800], color: "#FFA500", description: "Flat universe density threshold" },
    { name: "Omega Matter Parameter", position: [-13050, 15250, 17850], color: "#FF8C00", description: "Universe matter density fraction" },
    { name: "Omega Lambda Parameter", position: [-13100, 15300, 17900], color: "#FF69B4", description: "Universe dark energy fraction" },
    { name: "Omega Baryon Parameter", position: [-13150, 15350, 17950], color: "#FF1493", description: "Ordinary matter density fraction" },
    { name: "Sigma 8 Parameter", position: [-13200, 15400, 18000], color: "#DB7093", description: "Matter clustering amplitude" },
    { name: "Spectral Index ns (II)", position: [-13250, 15450, 18050], color: "#C71585", description: "Primordial perturbation slope" },
    { name: "Optical Depth Tau", position: [-13300, 15500, 18100], color: "#DA70D6", description: "Reionization optical depth" },
    { name: "Voyager 1 Interstellar", position: [-13350, 15550, 18150], color: "#4682B4", description: "First spacecraft to enter interstellar space" },
    { name: "Voyager 2 Grand Tour", position: [-13400, 15600, 18200], color: "#5F9EA0", description: "Only spacecraft to visit all four giants" },
    { name: "Pioneer 10 Jupiter First", position: [-13450, 15650, 18250], color: "#6495ED", description: "First spacecraft to cross asteroid belt" },
    { name: "Pioneer 11 Saturn First", position: [-13500, 15700, 18300], color: "#7B68EE", description: "First spacecraft to encounter Saturn" },
    { name: "New Horizons Pluto Mission", position: [-13550, 15750, 18350], color: "#6A5ACD", description: "First spacecraft to fly by Pluto" },
    { name: "Cassini Saturn Orbiter", position: [-13600, 15800, 18400], color: "#483D8B", description: "Explored Saturn system for 13 years" },
    { name: "Huygens Titan Lander", position: [-13650, 15850, 18450], color: "#191970", description: "First landing in outer Solar System" },
    { name: "Galileo Jupiter Orbiter", position: [-13700, 15900, 18500], color: "#000080", description: "First spacecraft to orbit Jupiter" },
    { name: "Juno Jupiter Mission", position: [-13750, 15950, 18550], color: "#00008B", description: "Studying Jupiter's interior and aurora" },
    { name: "Europa Clipper Mission", position: [-13800, 16000, 18600], color: "#0000CD", description: "Investigating Europa's ocean potential" },
    { name: "Mars Curiosity Rover", position: [-13850, 16050, 18650], color: "#4169E1", description: "Nuclear-powered Mars science laboratory" },
    { name: "Mars Perseverance Rover", position: [-13900, 16100, 18700], color: "#1E90FF", description: "Collecting samples for Mars return" },
    { name: "Ingenuity Mars Helicopter", position: [-13950, 16150, 18750], color: "#00BFFF", description: "First powered flight on another planet" },
    { name: "Mars Reconnaissance Orbiter", position: [-14000, 16200, 18800], color: "#87CEEB", description: "High-resolution Mars imaging spacecraft" },
    { name: "MAVEN Mars Atmosphere", position: [-14050, 16250, 18850], color: "#87CEFA", description: "Studying Mars atmospheric loss" },
    { name: "InSight Mars Seismology", position: [-14100, 16300, 18900], color: "#ADD8E6", description: "First Mars interior seismic mission" },
    { name: "Parker Solar Probe (II)", position: [-14150, 16350, 18950], color: "#B0E0E6", description: "Closest spacecraft to the Sun" },
    { name: "Solar Orbiter Mission", position: [-14200, 16400, 19000], color: "#AFEEEE", description: "Studying Sun's poles and heliosphere" },
    { name: "BepiColombo Mercury Mission", position: [-14250, 16450, 19050], color: "#00CED1", description: "Joint ESA-JAXA Mercury exploration" },
    { name: "MESSENGER Mercury Orbiter", position: [-14300, 16500, 19100], color: "#20B2AA", description: "First spacecraft to orbit Mercury" },
    { name: "Dawn Asteroid Explorer", position: [-14350, 16550, 19150], color: "#48D1CC", description: "Visited Vesta and Ceres" },
    { name: "OSIRIS-REx Asteroid Sample", position: [-14400, 16600, 19200], color: "#40E0D0", description: "Returned sample from Bennu" },
    { name: "Hayabusa2 Ryugu Sample", position: [-14450, 16650, 19250], color: "#00FFFF", description: "Japanese asteroid sample return" },
    { name: "Rosetta Comet Mission", position: [-14500, 16700, 19300], color: "#E0FFFF", description: "First spacecraft to orbit a comet" },
    { name: "Philae Comet Lander", position: [-14550, 16750, 19350], color: "#AFEEEE", description: "First landing on a comet nucleus" },
    { name: "Aldebaran Bull's Eye", position: [-14600, 16800, 19400], color: "#FF6347", description: "Orange giant eye of Taurus the Bull" },
    { name: "Antares Scorpion Heart", position: [-14650, 16850, 19450], color: "#FF4500", description: "Red supergiant rival of Mars in color" },
    { name: "Arcturus Bear Guard", position: [-14700, 16900, 19500], color: "#FFA500", description: "Brightest star in northern celestial hemisphere" },
    { name: "Capella Goat Star", position: [-14750, 16950, 19550], color: "#FFD700", description: "Yellow giant binary in Auriga" },
    { name: "Deneb Swan's Tail", position: [-14800, 17000, 19600], color: "#F0F8FF", description: "Luminous supergiant in Cygnus" },
    { name: "Fomalhaut Lonely Star", position: [-14850, 17050, 19650], color: "#FFFFFF", description: "Bright star with famous debris disk" },
    { name: "Procyon Little Dog Star", position: [-14900, 17100, 19700], color: "#FFFAF0", description: "Binary with white dwarf companion" },
    { name: "Regulus Lion's Heart", position: [-14950, 17150, 19750], color: "#B0C4DE", description: "Blue-white star in Leo constellation" },
    { name: "Spica Wheat Ear Star", position: [-15000, 17200, 19800], color: "#ADD8E6", description: "Close binary in Virgo constellation" },
    { name: "Altair Eagle Star", position: [-15050, 17250, 19850], color: "#87CEEB", description: "Rapidly rotating main sequence star" },
    { name: "Achernar River's End", position: [-15100, 17300, 19900], color: "#87CEFA", description: "Fastest rotating bright star known" },
    { name: "Hadar Beta Centauri", position: [-15150, 17350, 19950], color: "#4682B4", description: "Blue giant triple star system" },
    { name: "Acrux Southern Cross", position: [-15200, 17400, 20000], color: "#6495ED", description: "Brightest star in Crux constellation" },
    { name: "Mimosa Beta Crucis", position: [-15250, 17450, 20050], color: "#7B68EE", description: "Variable blue giant in Crux" },
    { name: "Rigel Blue Supergiant (II)", position: [-15300, 17500, 20100], color: "#6A5ACD", description: "Brightest star in Orion constellation" },
    { name: "Bellatrix Amazon Star", position: [-15350, 17550, 20150], color: "#483D8B", description: "Blue giant shoulder of Orion" },
    { name: "Alnilam Belt Center", position: [-15400, 17600, 20200], color: "#191970", description: "Blue supergiant center of Orion's Belt" },
    { name: "Alnitak Belt East", position: [-15450, 17650, 20250], color: "#000080", description: "Triple star at Orion's Belt eastern end" },
    { name: "Mintaka Belt West", position: [-15500, 17700, 20300], color: "#00008B", description: "Multiple star western Orion's Belt" },
    { name: "Saiph Sword of Orion", position: [-15550, 17750, 20350], color: "#0000CD", description: "Blue supergiant at Orion's knee" },
    { name: "Castor Twin Star Alpha", position: [-15600, 17800, 20400], color: "#4169E1", description: "Sextuple star system in Gemini" },
    { name: "Pollux Twin Star Beta", position: [-15650, 17850, 20450], color: "#FF8C00", description: "Nearest giant star to Earth" },
    { name: "Mira Wonderful Star", position: [-15700, 17900, 20500], color: "#DC143C", description: "Prototype long-period variable star" },
    { name: "Algol Demon Star", position: [-15750, 17950, 20550], color: "#8B0000", description: "Famous eclipsing binary prototype" },
    { name: "Rasalhague Serpent Bearer", position: [-15800, 18000, 20600], color: "#F5F5DC", description: "White giant in Ophiuchus constellation" },
    { name: "Herschel's Garnet Star", position: [-15850, 18050, 20650], color: "#8B0000", description: "Mu Cephei red supergiant named for color" },
    { name: "Kapteyn's Star Runaway", position: [-15900, 18100, 20700], color: "#CD853F", description: "High proper motion halo subdwarf" },
    { name: "Barnard's Star Fastest", position: [-15950, 18150, 20750], color: "#D2691E", description: "Highest proper motion star known" },
    { name: "Luyten's Star Red Dwarf", position: [-16000, 18200, 20800], color: "#8B4513", description: "Nearby red dwarf with planets" },
    { name: "Lacaille 9352 Southern", position: [-16050, 18250, 20850], color: "#A0522D", description: "Nearby red dwarf visible to naked eye" },
    { name: "Groombridge 34 Binary", position: [-16100, 18300, 20900], color: "#BC8F8F", description: "Nearby red dwarf binary system" },
    { name: "Lalande 21185 Neighbor", position: [-16150, 18350, 20950], color: "#F4A460", description: "Fourth nearest stellar system" },
    { name: "Wolf 359 Tiny Flare Star", position: [-16200, 18400, 21000], color: "#FF6347", description: "Very low mass flare star nearby" },
    { name: "Ross 128 Quiet Red Dwarf", position: [-16250, 18450, 21050], color: "#FF4500", description: "Inactive red dwarf with planet" },
    { name: "Ross 154 Southern Flare", position: [-16300, 18500, 21100], color: "#DC143C", description: "Active flare star in south sky" },
    { name: "61 Cygni First Parallax", position: [-16350, 18550, 21150], color: "#FFD700", description: "First star with measured distance" },
    { name: "70 Ophiuchi Binary Pair", position: [-16400, 18600, 21200], color: "#FFA500", description: "Well-studied nearby binary system" },
    { name: "Kruger 60 Flare Binary", position: [-16450, 18650, 21250], color: "#FF8C00", description: "Active flare star binary" },
    { name: "DX Cancri Ultracool Dwarf", position: [-16500, 18700, 21300], color: "#FF7F50", description: "Very low temperature red dwarf" },
    { name: "Teegarden's Star Exoplanet Host", position: [-16550, 18750, 21350], color: "#FF6347", description: "Cool red dwarf with habitable zone planets" },
    { name: "GJ 1061 Nearby System", position: [-16600, 18800, 21400], color: "#FF4500", description: "Red dwarf with three known planets" },
    { name: "YZ Ceti Active Flare Star", position: [-16650, 18850, 21450], color: "#DC143C", description: "Nearby flare star with planets" },
    { name: "Luyten b Habitable World", position: [-16700, 18900, 21500], color: "#B22222", description: "Super-Earth in habitable zone" },
    { name: "Tau Ceti Sunlike Nearby", position: [-16750, 18950, 21550], color: "#FFD700", description: "Nearby solar analog with planets" },
    { name: "Epsilon Eridani Young System", position: [-16800, 19000, 21600], color: "#FFA500", description: "Young star with debris disk" },
    { name: "40 Eridani Triple System", position: [-16850, 19050, 21650], color: "#FF8C00", description: "Triple star with white dwarf" },
    { name: "Delta Pavonis Solar Twin", position: [-16900, 19100, 21700], color: "#FFD700", description: "Sun-like star in southern sky" },
    { name: "Beta Hydri Subgiant", position: [-16950, 19150, 21750], color: "#FFA500", description: "Evolved star near south pole" },
    { name: "Zeta Tucanae Solar Analog", position: [-17000, 19200, 21800], color: "#FFD700", description: "Near-solar star in Tucana" },
    { name: "Chi-1 Orionis Young Sun", position: [-17050, 19250, 21850], color: "#FFA500", description: "Young solar-type star with debris" },
    { name: "Orion the Hunter", position: [-17100, 19300, 21900], color: "#4682B4", description: "Most recognizable constellation in sky" },
    { name: "Ursa Major Great Bear", position: [-17150, 19350, 21950], color: "#5F9EA0", description: "Northern circumpolar constellation" },
    { name: "Ursa Minor Little Bear", position: [-17200, 19400, 22000], color: "#6495ED", description: "Contains Polaris the North Star" },
    { name: "Cassiopeia the Queen", position: [-17250, 19450, 22050], color: "#7B68EE", description: "W-shaped northern constellation" },
    { name: "Cygnus the Swan", position: [-17300, 19500, 22100], color: "#6A5ACD", description: "Northern Cross in Milky Way" },
    { name: "Scorpius the Scorpion", position: [-17350, 19550, 22150], color: "#DC143C", description: "Zodiac constellation with red Antares" },
    { name: "Sagittarius the Archer", position: [-17400, 19600, 22200], color: "#B22222", description: "Points toward galactic center" },
    { name: "Leo the Lion", position: [-17450, 19650, 22250], color: "#FFD700", description: "Zodiac constellation with Regulus" },
    { name: "Taurus the Bull", position: [-17500, 19700, 22300], color: "#FF8C00", description: "Ancient zodiac with Pleiades" },
    { name: "Gemini the Twins", position: [-17550, 19750, 22350], color: "#FFA500", description: "Zodiac with Castor and Pollux" },
    { name: "Virgo the Maiden", position: [-17600, 19800, 22400], color: "#FFDAB9", description: "Largest zodiac constellation" },
    { name: "Aquarius Water Bearer", position: [-17650, 19850, 22450], color: "#00CED1", description: "Zodiac constellation in water region" },
    { name: "Pisces the Fishes", position: [-17700, 19900, 22500], color: "#20B2AA", description: "Zodiac constellation with vernal equinox" },
    { name: "Aries the Ram", position: [-17750, 19950, 22550], color: "#FF6347", description: "First zodiac sign with golden fleece" },
    { name: "Capricornus Sea Goat", position: [-17800, 20000, 22600], color: "#2F4F4F", description: "Ancient zodiac hybrid creature" },
    { name: "Libra the Scales", position: [-17850, 20050, 22650], color: "#DAA520", description: "Only inanimate zodiac symbol" },
    { name: "Cancer the Crab", position: [-17900, 20100, 22700], color: "#808080", description: "Zodiac with Beehive Cluster" },
    { name: "Big Dipper Asterism", position: [-17950, 20150, 22750], color: "#4682B4", description: "Famous seven star pattern" },
    { name: "Southern Cross Crux", position: [-18000, 20200, 22800], color: "#FFFFFF", description: "Iconic southern hemisphere pattern" },
    { name: "Summer Triangle Asterism", position: [-18050, 20250, 22850], color: "#87CEEB", description: "Vega Deneb Altair triangle" },
    { name: "Winter Hexagon Asterism", position: [-18100, 20300, 22900], color: "#ADD8E6", description: "Six bright stars of winter sky" },
    { name: "Teapot Asterism Sagittarius", position: [-18150, 20350, 22950], color: "#DEB887", description: "Teapot shape in Sagittarius" },
    { name: "Great Square Pegasus", position: [-18200, 20400, 23000], color: "#B0C4DE", description: "Autumn sky landmark" },
    { name: "Sickle of Leo Asterism", position: [-18250, 20450, 23050], color: "#F0E68C", description: "Backwards question mark in Leo" },
    { name: "Diamond of Virgo Asterism", position: [-18300, 20500, 23100], color: "#E6E6FA", description: "Spring sky diamond pattern" },
    { name: "Perseid Meteor Shower", position: [28500, 18900, 31200], color: "#FFD700", description: "August shower from Comet Swift-Tuttle" },
    { name: "Leonid Meteor Shower", position: [-27400, 19200, -30100], color: "#FFA500", description: "November shower with periodic storms" },
    { name: "Geminid Meteor Shower", position: [26300, 17800, 29400], color: "#FFFF00", description: "December shower from asteroid Phaethon" },
    { name: "Orionid Meteor Shower", position: [-25200, 18100, 28300], color: "#FFE4B5", description: "October shower from Comet Halley" },
    { name: "Quadrantid Meteor Shower", position: [24100, 19400, -27200], color: "#E6E6FA", description: "January shower with sharp peak" },
    { name: "Eta Aquariid Meteor Shower", position: [-23000, 16700, 26100], color: "#87CEEB", description: "May shower from Comet Halley" },
    { name: "Delta Aquariid Meteor Shower", position: [21900, 17500, -25000], color: "#ADD8E6", description: "July-August Southern Hemisphere shower" },
    { name: "Taurid Meteor Shower", position: [-20800, 18300, 23900], color: "#DEB887", description: "October-November slow fireballs" },
    { name: "Lyrid Meteor Shower", position: [19700, 16100, 22800], color: "#F0E68C", description: "April shower from Comet Thatcher" },
    { name: "Ursid Meteor Shower", position: [-18600, 19600, -21700], color: "#B0C4DE", description: "December shower from Comet Tuttle" },
    { name: "Total Solar Eclipse Path", position: [17500, 20800, 20600], color: "#2F4F4F", description: "Moon completely blocks the Sun" },
    { name: "Annular Solar Eclipse", position: [-16400, 21900, -19500], color: "#696969", description: "Ring of fire around the Moon" },
    { name: "Total Lunar Eclipse", position: [15300, 22100, 18400], color: "#8B0000", description: "Blood moon in Earth's shadow" },
    { name: "Partial Lunar Eclipse", position: [-14200, 20300, 17300], color: "#A52A2A", description: "Partial shadow on the Moon" },
    { name: "Penumbral Lunar Eclipse", position: [13100, 19500, -16200], color: "#808080", description: "Subtle darkening of the Moon" },
    { name: "Transit of Mercury", position: [-12000, 18700, 15100], color: "#4A4A4A", description: "Mercury crosses the solar disk" },
    { name: "Transit of Venus", position: [10900, 17900, -14000], color: "#FFD700", description: "Rare Venus solar crossing" },
    { name: "Lunar Occultation of Star", position: [-9800, 16100, 12900], color: "#FFFFF0", description: "Moon hides a background star" },
    { name: "Planetary Conjunction", position: [8700, 15300, 11800], color: "#DDA0DD", description: "Planets appear close together" },
    { name: "Great Conjunction", position: [-7600, 14500, -10700], color: "#9370DB", description: "Jupiter-Saturn close approach" },
    { name: "Triple Conjunction", position: [6500, 13700, 9600], color: "#8A2BE2", description: "Three planets in alignment" },
    { name: "Zodiacal Light (IV)", position: [-5400, 12900, -8500], color: "#FFFACD", description: "Faint glow along ecliptic" },
    { name: "Gegenschein (III)", position: [4300, 12100, 7400], color: "#FAF0E6", description: "Anti-solar point glow" },
    { name: "Aurora Borealis Zone", position: [-3200, 11300, 6300], color: "#00FF7F", description: "Northern lights display region" },
    { name: "Aurora Australis Zone", position: [2100, 10500, -5200], color: "#32CD32", description: "Southern lights display region" },
    { name: "Noctilucent Cloud Region", position: [-1000, 9700, 4100], color: "#E0FFFF", description: "Highest atmospheric clouds" },
    { name: "Airglow Emission Layer", position: [900, 8900, -3000], color: "#7FFFD4", description: "Upper atmosphere luminescence" },
    { name: "Green Flash Phenomenon", position: [-800, 8100, 1900], color: "#00FF00", description: "Rare sunset optical effect" },
    { name: "Sun Dog Halo", position: [700, 7300, -800], color: "#FFE4C4", description: "Parhelia ice crystal display" },
    { name: "Moon Halo 22 Degree", position: [-600, 6500, 600], color: "#F5F5F5", description: "Lunar ice crystal ring" },
    { name: "Circumzenithal Arc (II)", position: [500, 5700, -500], color: "#FF69B4", description: "Upside-down rainbow arc" },
    { name: "Fire Rainbow", position: [-400, 4900, 400], color: "#FF1493", description: "Circumhorizontal arc display" },
    { name: "Moonbow", position: [300, 4100, -300], color: "#D3D3D3", description: "Lunar rainbow at night" },
    { name: "Light Pillar", position: [-200, 3300, 200], color: "#FFDAB9", description: "Vertical ice crystal reflection" },
    { name: "Star Trail Photography", position: [100, 2500, -100], color: "#4169E1", description: "Long exposure star arcs" },
    { name: "Earthshine on Moon", position: [-50, 1700, 50], color: "#778899", description: "Earth-lit lunar dark side" },
    { name: "Ashen Light of Venus", position: [25, 900, -25], color: "#A9A9A9", description: "Mysterious Venus night glow" },
    { name: "Opposition Surge", position: [-15, 100, 15], color: "#DCDCDC", description: "Brightness spike at opposition" },
    { name: "Heiligenschein", position: [28800, 19100, 31500], color: "#FFFAF0", description: "Bright halo around shadow" },
    { name: "Glory Optical Phenomenon", position: [-28100, 18400, -30800], color: "#FF6347", description: "Colorful rings around shadow" },
    { name: "Brocken Spectre", position: [27400, 17700, 30100], color: "#708090", description: "Giant shadow projection" },
    { name: "Crepuscular Rays", position: [-26700, 17000, -29400], color: "#FFEFD5", description: "Sunbeams through clouds" },
    { name: "Anticrepuscular Rays", position: [26000, 16300, 28700], color: "#FFF8DC", description: "Converging rays at antisolar point" },
    { name: "Corona Discharge", position: [-25300, 15600, -28000], color: "#00CED1", description: "St. Elmo's fire phenomenon" },
    { name: "Ball Lightning Phenomenon", position: [24600, 14900, 27300], color: "#FFFFE0", description: "Mysterious spherical lightning" },
    { name: "Sprite Lightning (III)", position: [-23900, 14200, -26600], color: "#FF4500", description: "Upper atmosphere discharge" },
    { name: "Blue Jet Lightning", position: [23200, 13500, 25900], color: "#1E90FF", description: "Upward electrical discharge" },
    { name: "ELVES Phenomenon", position: [-22500, 12800, -25200], color: "#9932CC", description: "Expanding light rings in ionosphere" },
    { name: "Meteor Outburst Event", position: [21800, 12100, 24500], color: "#FF8C00", description: "Unexpected meteor activity surge" },
    { name: "5000th Cosmic Sight Milestone", position: [0, 50000, 0], color: "#FFD700", description: "The historic 100x expansion achievement - Day 399!" },
    { name: "Albireo Binary System", position: [29100, 19300, 31800], color: "#FFD700", description: "Beautiful gold and blue double star" },
    { name: "Mizar-Alcor System", position: [-28400, 18600, -31100], color: "#FFFFFF", description: "Famous naked-eye double in Ursa Major" },
    { name: "Alpha Centauri AB", position: [27700, 17900, 30400], color: "#FFF8DC", description: "Nearest bright binary star system" },
    { name: "Castor Sextuple System", position: [-27000, 17200, -29700], color: "#F5F5F5", description: "Six-star system in Gemini" },
    { name: "Sirius AB Binary", position: [26300, 16500, 29000], color: "#A0D8FF", description: "Brightest star with white dwarf companion" },
    { name: "Procyon AB Binary", position: [-25600, 15800, -28300], color: "#F0E68C", description: "Bright star with faint companion" },
    { name: "Algol Triple System", position: [24900, 15100, 27600], color: "#B8860B", description: "Famous eclipsing binary - Demon Star" },
    { name: "Epsilon Lyrae Quadruple", position: [-24200, 14400, -26900], color: "#E6E6FA", description: "Double-double star system" },
    { name: "Beta Lyrae Binary", position: [23500, 13700, 26200], color: "#DDA0DD", description: "Interacting eclipsing binary" },
    { name: "Capella Quadruple System", position: [-22800, 13000, -25500], color: "#FFE4B5", description: "Four stars appearing as one" },
    { name: "61 Cygni Binary", position: [22100, 12300, 24800], color: "#FFA07A", description: "First star with measured parallax" },
    { name: "70 Ophiuchi Binary", position: [-21400, 11600, -24100], color: "#F4A460", description: "Well-studied orange dwarf pair" },
    { name: "SN 1054 Crab Supernova", position: [20700, 10900, 23400], color: "#FF4500", description: "Historic supernova creating Crab Nebula" },
    { name: "SN 1572 Tycho Supernova", position: [-20000, 10200, -22700], color: "#FF6347", description: "Tycho Brahe's supernova observation" },
    { name: "SN 1604 Kepler Supernova", position: [19300, 9500, 22000], color: "#FF7F50", description: "Last Milky Way supernova seen by eye" },
    { name: "SN 1987A Supernova", position: [-18600, 8800, -21300], color: "#FF8C00", description: "Closest supernova in modern era" },
    { name: "SN 185 Historical Supernova", position: [17900, 8100, 20600], color: "#FFD700", description: "First recorded supernova - 185 AD" },
    { name: "SN 1006 Supernova", position: [-17200, 7400, -19900], color: "#FFDAB9", description: "Brightest recorded stellar event" },
    { name: "SN 1181 Supernova Remnant", position: [16500, 6700, 19200], color: "#FFA500", description: "Medieval supernova in Cassiopeia" },
    { name: "Cassiopeia A Progenitor", position: [-15800, 6000, -18500], color: "#DC143C", description: "~1680 supernova not widely observed" },
    { name: "G1.9+0.3 Youngest Remnant", position: [15100, 5300, 17800], color: "#B22222", description: "Most recent Milky Way supernova ~1870" },
    { name: "PSR B1919+21 First Pulsar", position: [-14400, 4600, -17100], color: "#00CED1", description: "First discovered pulsar - LGM-1" },
    { name: "PSR B1937+21 Millisecond", position: [13700, 3900, 16400], color: "#40E0D0", description: "First millisecond pulsar discovered" },
    { name: "Vela Pulsar", position: [-13000, 3200, -15700], color: "#48D1CC", description: "Bright gamma-ray pulsar in remnant" },
    { name: "Geminga Pulsar", position: [12300, 2500, 15000], color: "#00FFFF", description: "Nearby gamma-ray pulsar" },
    { name: "SGR 1806-20 Magnetar", position: [11600, 1800, 14300], color: "#FF00FF", description: "Most powerful known magnetar" },
    { name: "SGR 1900+14 Magnetar", position: [-10900, 1100, -13600], color: "#EE82EE", description: "Giant flare source in 1998" },
    { name: "1E 2259+586 Magnetar", position: [10200, 400, 12900], color: "#DA70D6", description: "Anomalous X-ray pulsar" },
    { name: "SGR J1745-2900 Galactic Center", position: [-9500, -300, -12200], color: "#BA55D3", description: "Magnetar near Sgr A*" },
    { name: "Cygnus X-1 Black Hole", position: [8800, -1000, 11500], color: "#191970", description: "First confirmed stellar black hole" },
    { name: "GRS 1915+105 Microquasar", position: [-8100, -1700, -10800], color: "#000080", description: "Superluminal jet source" },
    { name: "SS 433 Microquasar", position: [7400, -2400, 10100], color: "#00008B", description: "Precessing relativistic jets" },
    { name: "Scorpius X-1", position: [-6700, -3100, -9400], color: "#4169E1", description: "Brightest persistent X-ray source" },
    { name: "Cygnus X-3 X-ray Binary", position: [6000, -3800, 8700], color: "#6495ED", description: "High-mass X-ray binary" },
    { name: "Centaurus X-3 Pulsar", position: [-5300, -4500, -8000], color: "#1E90FF", description: "First X-ray pulsar discovered" },
    { name: "Hercules X-1 Binary", position: [4600, -5200, 7300], color: "#00BFFF", description: "Accreting X-ray pulsar" },
    { name: "Vela X-1 Wind-Fed", position: [-3900, -5900, -6600], color: "#87CEEB", description: "Massive X-ray binary system" },
    { name: "Mira Variable Star", position: [3200, -6600, 5900], color: "#FF4500", description: "Prototype long-period variable" },
    { name: "Chi Cygni Variable", position: [-2500, -7300, -5200], color: "#FF6347", description: "Mira variable with large amplitude" },
    { name: "R Leonis Variable", position: [1800, -8000, 4500], color: "#FF7F50", description: "Bright Mira-type variable" },
    { name: "Betelgeuse Alpha Orionis", position: [-1100, -8700, -3800], color: "#FF8C00", description: "Famous red supergiant variable" },
    { name: "Delta Cephei Prototype", position: [400, -9400, 3100], color: "#FFD700", description: "Prototype Cepheid variable" },
    { name: "Polaris Cepheid", position: [300, -10100, -2400], color: "#FFF8DC", description: "North Star - classical Cepheid" },
    { name: "RR Lyrae Prototype", position: [-600, -10800, 1700], color: "#FFFACD", description: "Prototype RR Lyrae variable" },
    { name: "T Tauri Prototype", position: [1300, -11500, -1000], color: "#FFA500", description: "Young stellar object prototype" },
    { name: "FU Orionis Outburst Star", position: [-2000, -12200, 300], color: "#FF4500", description: "Prototype FUor eruptive variable" },
    { name: "R Coronae Borealis", position: [2700, -12900, 400], color: "#B8860B", description: "Prototype fading variable star" },
    { name: "SS Cygni Dwarf Nova", position: [-3400, -13600, -1100], color: "#00CED1", description: "Prototype dwarf nova system" },
    { name: "U Geminorum Dwarf Nova", position: [4100, -14300, 1800], color: "#20B2AA", description: "Bright dwarf nova outbursts" },
    { name: "RS CVn Binary Class", position: [-4800, -15000, -2500], color: "#3CB371", description: "Chromospherically active binary" },
    { name: "IC 434 Horsehead Region", position: [5500, -15700, 3200], color: "#8B0000", description: "Dark nebula silhouette region" },
    { name: "Barnard 33 Horsehead", position: [-6200, -16400, -3900], color: "#2F4F4F", description: "Famous dark nebula shape" },
    { name: "NGC 2024 Flame Nebula", position: [6900, -17100, 4600], color: "#FF4500", description: "Emission nebula near Alnitak" },
    { name: "IC 2944 Running Chicken", position: [-7600, -17800, -5300], color: "#FF69B4", description: "Southern emission nebula" },
    { name: "NGC 3372 Eta Carinae", position: [8300, -18500, 6000], color: "#FF1493", description: "Massive star-forming complex" },
    { name: "NGC 6302 Butterfly Nebula", position: [-9000, -19200, -6700], color: "#9400D3", description: "Bipolar planetary nebula" },
    { name: "NGC 6543 Cat's Eye", position: [9700, -19900, 7400], color: "#00FF7F", description: "Complex planetary nebula" },
    { name: "NGC 7293 Helix Nebula", position: [-10400, -20600, -8100], color: "#00FFFF", description: "Nearest bright planetary nebula" },
    { name: "NGC 2392 Eskimo Nebula", position: [11100, -21300, 8800], color: "#40E0D0", description: "Double-shell planetary nebula" },
    { name: "NGC 3132 Southern Ring", position: [-11800, -22000, -9500], color: "#7FFFD4", description: "JWST's iconic early image" },
    { name: "NGC 6720 Ring Nebula", position: [12500, -22700, 10200], color: "#98FB98", description: "Famous ring-shaped planetary" },
    { name: "NGC 6853 Dumbbell Nebula", position: [-13200, -23400, -10900], color: "#90EE90", description: "Large bright planetary nebula" },
    { name: "NGC 7027 Young Planetary", position: [13900, -24100, 11600], color: "#32CD32", description: "Very young planetary nebula" },
    { name: "IC 418 Spirograph Nebula", position: [-14600, -24800, -12300], color: "#00FA9A", description: "Unusual spiral structure" },
    { name: "NGC 2818 Cluster Planetary", position: [15300, -25500, 13000], color: "#00FF00", description: "Planetary in open cluster" },
    { name: "Abell 39 Spherical Planetary", position: [-16000, -26200, -13700], color: "#7CFC00", description: "Nearly perfect sphere shape" },
    { name: "NGC 1999 Keyhole Region", position: [16700, -26900, 14400], color: "#ADFF2F", description: "Reflection nebula with dark spot" },
    { name: "IC 1396 Elephant Trunk", position: [-17400, -27600, -15100], color: "#9ACD32", description: "Dark globule in emission nebula" },
    { name: "NGC 7380 Wizard Nebula", position: [18100, -28300, 15800], color: "#6B8E23", description: "Star-forming emission region" },
    { name: "NGC 281 Pacman Nebula", position: [-18800, -29000, -16500], color: "#556B2F", description: "Northern emission nebula" },
    { name: "IC 1805 Heart Nebula", position: [19500, -29700, 17200], color: "#FF0000", description: "Valentine-shaped emission region" },
    { name: "IC 1848 Soul Nebula", position: [-20200, -30400, -17900], color: "#DC143C", description: "Companion to Heart Nebula" },
    { name: "NGC 7635 Bubble Nebula", position: [20900, -31100, 18600], color: "#FF6B6B", description: "Stellar wind-blown bubble" },
    { name: "NGC 2237 Rosette Nebula", position: [-21600, -31800, -19300], color: "#FF1493", description: "Large circular emission region" },
    { name: "NGC 6888 Crescent Nebula", position: [22300, -32500, 20000], color: "#FF4500", description: "Wolf-Rayet wind bubble" },
    { name: "NGC 1300 Barred Spiral", position: [-23000, -33200, -20700], color: "#FFD700", description: "Classic barred spiral prototype" },
    { name: "NGC 1365 Great Barred", position: [23700, -33900, 21400], color: "#FFA500", description: "Large barred spiral in Fornax" },
    { name: "NGC 4565 Needle Galaxy", position: [-24400, -34600, -22100], color: "#F0E68C", description: "Perfect edge-on spiral view" },
    { name: "NGC 891 Edge-On Spiral", position: [25100, -35300, 22800], color: "#EEE8AA", description: "Milky Way analog edge-on" },
    { name: "NGC 5866 Spindle Galaxy", position: [-25800, -36000, -23500], color: "#FAFAD2", description: "Lenticular galaxy edge-on" },
    { name: "NGC 3115 Edge-On S0", position: [26500, -36700, 24200], color: "#FFFACD", description: "Massive lenticular galaxy" },
    { name: "NGC 4594 Sombrero Galaxy", position: [-27200, -37400, -24900], color: "#FFEFD5", description: "Famous dust lane galaxy" },
    { name: "NGC 5128 Centaurus A", position: [27900, -38100, 25600], color: "#FFE4B5", description: "Nearest giant elliptical with jets" },
    { name: "NGC 1316 Fornax A", position: [-28600, -38800, -26300], color: "#FFDAB9", description: "Radio galaxy merger remnant" },
    { name: "NGC 4486 M87 Giant", position: [29300, -39500, 27000], color: "#FFE4C4", description: "Supergiant elliptical with jet" },
    { name: "Abell 2029 Galaxy Cluster", position: [-30000, -40200, -27700], color: "#F5DEB3", description: "Massive relaxed cluster" },
    { name: "Abell 1689 Lensing Cluster", position: [30700, -40900, 28400], color: "#DEB887", description: "Strong gravitational lensing" },
    { name: "Abell 520 Train Wreck", position: [-31400, -41600, -29100], color: "#D2B48C", description: "Complex merging cluster" },
    { name: "Abell 2744 Pandora Cluster", position: [32100, -42300, 29800], color: "#BC8F8F", description: "Multiple merging subclusters" },
    { name: "MACS J0717 Complex Merger", position: [-32800, -43000, -30500], color: "#F4A460", description: "Massive ongoing cluster merger" },
    { name: "El Gordo Galaxy Cluster", position: [33500, -43700, 31200], color: "#DAA520", description: "Most massive distant cluster" },
    { name: "Bullet Cluster 1E0657", position: [-34200, -44400, -31900], color: "#CD853F", description: "Dark matter separation evidence" },
    { name: "Phoenix Cluster SPT-CLJ", position: [34900, -45100, 32600], color: "#D2691E", description: "Extreme starburst cluster" },
    { name: "Perseus Cluster Core", position: [-35600, -45800, -33300], color: "#8B4513", description: "Sound waves in hot gas" },
    { name: "Coma Cluster Center", position: [36300, -46500, 34000], color: "#A0522D", description: "Richest nearby cluster core" },
    { name: "Norma Cluster Abell 3627", position: [-37000, -47200, -34700], color: "#6B4423", description: "Great Attractor region cluster" },
    { name: "Shapley Supercluster Core", position: [37700, -47900, 35400], color: "#5C4033", description: "Densest nearby supercluster" },
    { name: "Laniakea Supercluster", position: [-38400, -48600, -36100], color: "#3D2B1F", description: "Our home supercluster" },
    { name: "Hercules Supercluster", position: [39100, -49300, 36800], color: "#2F1810", description: "Massive distant supercluster" },
    { name: "Corona Borealis Supercluster", position: [-39800, -50000, -37500], color: "#1C1008", description: "Dense concentration of clusters" },
    { name: "TRAPPIST-1 System", position: [-40500, -50700, -38200], color: "#FF6B6B", description: "Seven Earth-sized planets" },
    { name: "Kepler-186f Habitable", position: [41200, -51400, 38900], color: "#4ECDC4", description: "First Earth-size in habitable zone" },
    { name: "Kepler-452b Super-Earth", position: [-41900, -52100, -39600], color: "#95E1D3", description: "Earth's larger older cousin" },
    { name: "Proxima Centauri b", position: [42600, -52800, 40300], color: "#F38181", description: "Nearest exoplanet to Earth" },
    { name: "TOI-700 d Habitable", position: [-43300, -53500, -41000], color: "#AA96DA", description: "TESS-discovered Earth-size world" },
    { name: "LHS 1140 b Super-Earth", position: [44000, -54200, 41700], color: "#FCBAD3", description: "Rocky super-Earth in habitable zone" },
    { name: "K2-18 b Water World", position: [-44700, -54900, -42400], color: "#A8D8EA", description: "Sub-Neptune with water vapor" },
    { name: "55 Cancri e Lava World", position: [45400, -55600, 43100], color: "#FF4500", description: "Super-Earth with lava oceans" },
    { name: "HD 189733 b Hot Jupiter", position: [-46100, -56300, -43800], color: "#1E90FF", description: "Blue planet with glass rain" },
    { name: "WASP-12 b Doomed Planet", position: [46800, -57000, 44500], color: "#FFD700", description: "Hot Jupiter being consumed" },
    { name: "HR 8799 Four Giants", position: [-47500, -57700, -45200], color: "#DDA0DD", description: "Directly imaged multi-planet system" },
    { name: "Beta Pictoris b Giant", position: [48200, -58400, 45900], color: "#87CEEB", description: "Young directly imaged planet" },
    { name: "Kepler-22b Ocean World", position: [-48900, -59100, -46600], color: "#00CED1", description: "Possible water world candidate" },
    { name: "Kepler-442b Habitable", position: [49600, -59800, 47300], color: "#32CD32", description: "One of most Earth-like known" },
    { name: "Gliese 667C System", position: [-50300, -60500, -48000], color: "#FFE4B5", description: "Multiple potentially habitable worlds" },
    { name: "HD 209458 b Osiris", position: [51000, -61200, 48700], color: "#FF8C00", description: "First transiting exoplanet observed" },
    { name: "Kepler-16b Circumbinary", position: [-51700, -61900, -49400], color: "#9370DB", description: "Real Tatooine - two suns" },
    { name: "PSR B1257+12 System", position: [52400, -62600, 50100], color: "#00FFFF", description: "First confirmed exoplanets ever" },
    { name: "HAT-P-7b Kepler Target", position: [-53100, -63300, -50800], color: "#FF69B4", description: "Retrograde orbit hot Jupiter" },
    { name: "GJ 1214 b Mini-Neptune", position: [53800, -64000, 51500], color: "#98FB98", description: "Water world or mini-Neptune" },
    { name: "KELT-9b Hottest Planet", position: [-54500, -64700, -52200], color: "#FF0000", description: "Hotter than most stars" },
    { name: "TrES-2b Darkest Planet", position: [55200, -65400, 52900], color: "#1C1C1C", description: "Absorbs nearly all light" },
    { name: "WASP-76b Iron Rain", position: [-55900, -66100, -53600], color: "#C0C0C0", description: "Iron vaporizes and rains down" },
    { name: "TOI-1452 b Ocean World", position: [56600, -66800, 54300], color: "#4169E1", description: "Possible deep ocean planet" },
    { name: "Kepler-1649c Earth-Twin", position: [-57300, -67500, -55000], color: "#228B22", description: "Most similar to Earth in size/temp" },
    { name: "JWST James Webb Space Telescope", position: [58000, -68200, 55700], color: "#FFD700", description: "Largest space infrared observatory" },
    { name: "Hubble Space Telescope", position: [-58700, -68900, -56400], color: "#4169E1", description: "Iconic visible light observatory" },
    { name: "Chandra X-ray Observatory", position: [59400, -69600, 57100], color: "#9400D3", description: "Premier X-ray space telescope" },
    { name: "Spitzer Space Telescope", position: [-60100, -70300, -57800], color: "#FF4500", description: "Infrared Great Observatory" },
    { name: "Fermi Gamma-ray Space Telescope", position: [60800, -71000, 58500], color: "#00FF00", description: "High-energy gamma-ray observer" },
    { name: "Kepler Space Telescope", position: [-61500, -71700, -59200], color: "#00BFFF", description: "Exoplanet hunter mission" },
    { name: "TESS Planet Hunter", position: [62200, -72400, 59900], color: "#FF69B4", description: "All-sky exoplanet survey" },
    { name: "Gaia Astrometry Mission", position: [-62900, -73100, -60600], color: "#FFFFFF", description: "Billion star positions measured" },
    { name: "Planck CMB Observatory", position: [63600, -73800, 61300], color: "#B0E0E6", description: "Cosmic microwave background mapper" },
    { name: "WMAP CMB Mission", position: [-64300, -74500, -62000], color: "#E6E6FA", description: "Wilkinson background mapper" },
    { name: "COBE CMB Pioneer", position: [65000, -75200, 62700], color: "#F5F5DC", description: "First CMB anisotropy detection" },
    { name: "IRAS Infrared Survey", position: [-65700, -75900, -63400], color: "#FF8C00", description: "First infrared all-sky survey" },
    { name: "XMM-Newton Observatory", position: [66400, -76600, 64100], color: "#8A2BE2", description: "ESA X-ray multi-mirror mission" },
    { name: "NuSTAR Hard X-ray", position: [-67100, -77300, -64800], color: "#9932CC", description: "First focusing hard X-ray telescope" },
    { name: "Swift Gamma-Ray Burst", position: [67800, -78000, 65500], color: "#FF1493", description: "Rapid GRB response mission" },
    { name: "INTEGRAL Gamma-ray", position: [-68500, -78700, -66200], color: "#DA70D6", description: "ESA gamma-ray observatory" },
    { name: "Herschel Space Observatory", position: [69200, -79400, 66900], color: "#FA8072", description: "Far-infrared and submillimeter" },
    { name: "WISE Infrared Survey", position: [-69900, -80100, -67600], color: "#FFA07A", description: "Wide-field infrared surveyor" },
    { name: "ROSAT X-ray Survey", position: [70600, -80800, 68300], color: "#20B2AA", description: "All-sky X-ray source catalog" },
    { name: "Einstein Observatory HEAO-2", position: [-71300, -81500, -69000], color: "#5F9EA0", description: "First focusing X-ray telescope" },
    { name: "Uhuru X-ray Pioneer", position: [72000, -82200, 69700], color: "#6495ED", description: "First X-ray astronomy satellite" },
    { name: "EUVE Extreme Ultraviolet", position: [-72700, -82900, -70400], color: "#00CED1", description: "EUV all-sky survey mission" },
    { name: "FUSE Far Ultraviolet", position: [73400, -83600, 71100], color: "#7FFFD4", description: "Far-UV spectroscopy explorer" },
    { name: "GALEX UV Survey", position: [-74100, -84300, -71800], color: "#40E0D0", description: "Galaxy Evolution Explorer" },
    { name: "Euclid Dark Energy Mission", position: [74800, -85000, 72500], color: "#AFEEEE", description: "ESA dark universe mapper" },
    { name: "Keck Observatory Hawaii", position: [-75500, -85700, -73200], color: "#C0C0C0", description: "Twin 10m segmented mirror giants" },
    { name: "VLT Very Large Telescope", position: [76200, -86400, 73900], color: "#A9A9A9", description: "ESO's flagship four 8.2m array" },
    { name: "Gemini North Hawaii", position: [-76900, -87100, -74600], color: "#808080", description: "8.1m Northern hemisphere twin" },
    { name: "Gemini South Chile", position: [77600, -87800, 75300], color: "#696969", description: "8.1m Southern hemisphere twin" },
    { name: "Subaru Telescope Hawaii", position: [-78300, -88500, -76000], color: "#708090", description: "Japan's 8.2m optical-infrared" },
    { name: "Gran Telescopio Canarias", position: [79000, -89200, 76700], color: "#778899", description: "World's largest single-mirror 10.4m" },
    { name: "Large Binocular Telescope", position: [-79700, -89900, -77400], color: "#B0C4DE", description: "Twin 8.4m on common mount" },
    { name: "Magellan Telescopes Chile", position: [80400, -90600, 78100], color: "#4682B4", description: "Twin 6.5m at Las Campanas" },
    { name: "MMT Observatory Arizona", position: [-81100, -91300, -78800], color: "#5F9EA0", description: "6.5m converted multi-mirror" },
    { name: "Hobby-Eberly Telescope", position: [81800, -92000, 79500], color: "#6495ED", description: "9.2m for spectroscopy" },
    { name: "SALT South Africa", position: [-82500, -92700, -80200], color: "#00CED1", description: "Southern African 10m telescope" },
    { name: "LAMOST Spectroscopic", position: [83200, -93400, 80900], color: "#20B2AA", description: "Multi-fiber 4000 spectra" },
    { name: "ALMA Radio Array", position: [-83900, -94100, -81600], color: "#FFD700", description: "66 dish mm/submm interferometer" },
    { name: "VLA New Mexico", position: [84600, -94800, 82300], color: "#FFA500", description: "27 dish radio interferometer" },
    { name: "ASKAP Australia", position: [-85300, -95500, -83000], color: "#FF8C00", description: "Pathfinder for Square Kilometre Array" },
    { name: "MeerKAT South Africa", position: [86000, -96200, 83700], color: "#FF4500", description: "64-dish SKA precursor" },
    { name: "FAST Radio Telescope", position: [-86700, -96900, -84400], color: "#DC143C", description: "World's largest single dish 500m" },
    { name: "Arecibo Legacy", position: [87400, -97600, 85100], color: "#B22222", description: "Historic 305m dish (1963-2020)" },
    { name: "Green Bank Telescope", position: [-88100, -98300, -85800], color: "#228B22", description: "Largest fully steerable 100m" },
    { name: "Parkes Radio Telescope", position: [88800, -99000, 86500], color: "#32CD32", description: "The Dish - Australian 64m icon" },
    { name: "Effelsberg Radio Telescope", position: [-89500, -99700, -87200], color: "#3CB371", description: "German 100m radio dish" },
    { name: "LIGO Hanford", position: [90200, -100400, 87900], color: "#9932CC", description: "Gravitational wave detector" },
    { name: "LIGO Livingston", position: [-90900, -101100, -88600], color: "#8B008B", description: "Louisiana GW detector" },
    { name: "Virgo Interferometer", position: [91600, -101800, 89300], color: "#9400D3", description: "European GW detector Italy" },
    { name: "KAGRA Japan", position: [-92300, -102500, -90000], color: "#8A2BE2", description: "Underground GW detector" },
    { name: "Galileo Galilei Monument", position: [93000, -103200, 90700], color: "#FFD700", description: "Father of observational astronomy" },
    { name: "Johannes Kepler Monument", position: [-93700, -103900, -91400], color: "#FF8C00", description: "Laws of planetary motion" },
    { name: "Isaac Newton Monument", position: [94400, -104600, 92100], color: "#FFFFFF", description: "Universal gravitation pioneer" },
    { name: "Nicolaus Copernicus Monument", position: [-95100, -105300, -92800], color: "#4169E1", description: "Heliocentric model creator" },
    { name: "Edwin Hubble Monument", position: [95800, -106000, 93500], color: "#9370DB", description: "Discovered expanding universe" },
    { name: "Albert Einstein Monument", position: [-96500, -106700, -94200], color: "#E6E6FA", description: "General relativity architect" },
    { name: "Carl Sagan Monument", position: [97200, -107400, 94900], color: "#00BFFF", description: "Pale Blue Dot visionary" },
    { name: "Stephen Hawking Monument", position: [-97900, -108100, -95600], color: "#191970", description: "Black hole radiation theorist" },
    { name: "Vera Rubin Monument", position: [98600, -108800, 96300], color: "#8B008B", description: "Dark matter evidence pioneer" },
    { name: "Henrietta Leavitt Monument", position: [-99300, -109500, -97000], color: "#FFE4B5", description: "Cepheid period-luminosity relation" },
    { name: "Cecilia Payne Monument", position: [100000, -110200, 97700], color: "#FFFACD", description: "Stellar composition discoverer" },
    { name: "Annie Jump Cannon Monument", position: [-100700, -110900, -98400], color: "#F0E68C", description: "Stellar classification system" },
    { name: "Jocelyn Bell Burnell Monument", position: [101400, -111600, 99100], color: "#00CED1", description: "Pulsar discoverer" },
    { name: "Subrahmanyan Chandrasekhar Monument", position: [-102100, -112300, -99800], color: "#F5F5F5", description: "White dwarf mass limit" },
    { name: "William Herschel Monument", position: [102800, -113000, 100500], color: "#C0C0C0", description: "Uranus and infrared discoverer" },
    { name: "Caroline Herschel Monument", position: [-103500, -113700, -101200], color: "#D3D3D3", description: "First female comet hunter" },
    { name: "Tycho Brahe Monument", position: [104200, -114400, 101900], color: "#B8860B", description: "Precision pre-telescope observer" },
    { name: "Harlow Shapley Monument", position: [-104900, -115100, -102600], color: "#DEB887", description: "Milky Way structure mapper" },
    { name: "George Ellery Hale Monument", position: [105600, -115800, 103300], color: "#CD853F", description: "Great observatory founder" },
    { name: "Jan Oort Monument", position: [-106300, -116500, -104000], color: "#A0522D", description: "Oort Cloud and galactic rotation" },
    { name: "Gerard Kuiper Monument", position: [107000, -117200, 104700], color: "#8B4513", description: "Kuiper Belt namesake" },
    { name: "Clyde Tombaugh Monument", position: [-107700, -117900, -105400], color: "#D2691E", description: "Pluto discoverer" },
    { name: "Percival Lowell Monument", position: [108400, -118600, 106100], color: "#FF6347", description: "Lowell Observatory founder" },
    { name: "Fred Hoyle Monument", position: [-109100, -119300, -106800], color: "#FF4500", description: "Stellar nucleosynthesis pioneer" },
    { name: "Margaret Burbidge Monument", position: [109800, -120000, 107500], color: "#FA8072", description: "B2FH paper co-author" },










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

// ---- Cosmic Sight Milestones (Opus 4.7) — golden banner + chime at 10/25/50/100/250/500/1000/2500/5000 ----
const cosmicSightMilestones = createCosmicSightMilestones({ audio: universeAudio });
window.__cosmicSightMilestones = cosmicSightMilestones;

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
