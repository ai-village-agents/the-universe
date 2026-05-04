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
    controls.lock();
});

// Movement State
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let speedMult = 1.0;

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
});

document.addEventListener('wheel', (event) => {
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

// Landmark Group
const landmarks = new THREE.Group();
scene.add(landmarks);

// Enhanced Landmark Generator with distinct shapes per world type
function createLandmark(world) {
    const group = new THREE.Group();
    group.position.set(...world.position);
    const col = new THREE.Color(world.color || '#ffffff');
    
    // Core geometry varies by landmark type
    let coreGeo;
    switch(world.landmark) {
        case 'obelisk':
            coreGeo = new THREE.CylinderGeometry(2, 4, 20, 6);
            break;
        case 'lighthouse':
            coreGeo = new THREE.CylinderGeometry(2, 3, 18, 8);
            break;
        case 'dome':
            coreGeo = new THREE.SphereGeometry(8, 16, 12, 0, Math.PI*2, 0, Math.PI/2);
            break;
        case 'spire':
            coreGeo = new THREE.ConeGeometry(4, 22, 6);
            break;
        case 'constellation':
            coreGeo = new THREE.OctahedronGeometry(8, 0);
            break;
        case 'nexus':
            coreGeo = new THREE.TorusKnotGeometry(5, 1.5, 64, 8);
            break;
        case 'antenna':
            coreGeo = new THREE.CylinderGeometry(0.5, 2, 20, 4);
            break;
        case 'lantern':
            coreGeo = new THREE.DodecahedronGeometry(7, 0);
            break;
        case 'fortress':
            coreGeo = new THREE.BoxGeometry(12, 12, 12);
            break;
        case 'telescope':
            coreGeo = new THREE.CylinderGeometry(1, 5, 16, 8);
            break;
        case 'cluster':
            coreGeo = new THREE.IcosahedronGeometry(8, 2);
            break;
        case 'stargate_portal':
            coreGeo = new THREE.TorusGeometry(8, 2, 16, 32);
            break;
        default:
            coreGeo = new THREE.IcosahedronGeometry(8, 1);
    }
    
    const coreMat = new THREE.MeshStandardMaterial({
        color: col, wireframe: true,
        emissive: col, emissiveIntensity: 0.5
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    if (world.landmark === 'obelisk' || world.landmark === 'lighthouse' || world.landmark === 'antenna' || world.landmark === 'telescope') {
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
    if(event.code === 'KeyE' && currentFocus) {
        window.open(currentFocus.userData.url, '_blank');
    }
});
document.addEventListener('mousedown', (event) => {
    if(controls.isLocked && currentFocus) {
        window.open(currentFocus.userData.url, '_blank');
    }
});

// Animation Loop
let prevTime = performance.now();

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
        // Rotate core
        if (core !== currentFocus) core.rotation.y += 0.005;
        // Pulse light
        if (light) light.intensity = 1.2 + Math.sin(elapsed * 1.2 + grp.position.x * 0.1) * 0.5;
        // Orbit particles
        grp.children.forEach(child => {
            if (child.userData && child.userData.orbitAngle !== undefined) {
                const d = child.userData;
                const a = d.orbitAngle + elapsed * d.orbitSpeed;
                child.position.set(Math.cos(a)*d.orbitR, d.orbitH + Math.sin(elapsed*0.5+d.orbitAngle)*2, Math.sin(a)*d.orbitR);
                child.material.opacity = 0.4 + Math.sin(elapsed + d.orbitAngle) * 0.3;
            }
        });
    });

    renderer.render(scene, camera);
    prevTime = time;
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

async function init() {
    await loadWorlds();
    animate();
}

init().catch((error) => {
    console.error('Failed to initialize world loading:', error);
});
