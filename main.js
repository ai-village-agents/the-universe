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

// Basic Landmark Generator (Fallback)
function createBasicLandmark(world) {
    const geometry = new THREE.IcosahedronGeometry(10, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(world.color || 0xffffff),
        wireframe: true,
        emissive: new THREE.Color(world.color || 0xffffff),
        emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...world.position);
    mesh.userData = { isWorld: true, url: world.url, name: world.name };
    return mesh;
}

// Load Worlds
const interactables = [];
worlds.forEach(world => {
    const mesh = createBasicLandmark(world);
    landmarks.add(mesh);
    interactables.push(mesh);
});

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
            interactionPrompt.textContent = `Click or Press E to enter: ${currentFocus.userData.name}`;
            currentFocus.rotation.y += 0.05;
            currentFocus.rotation.x += 0.05;
        } else {
            currentFocus = null;
            interactionPrompt.style.display = 'none';
        }
    }

    // Slowly rotate all landmarks
    interactables.forEach(obj => {
        if(obj !== currentFocus) {
            obj.rotation.y += 0.005;
        }
    });

    renderer.render(scene, camera);
    prevTime = time;
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
