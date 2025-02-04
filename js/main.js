// Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { gsap } from "https://cdn.skypack.dev/gsap@3.9.1";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const fixedHeight = 2.5;
let objToRender = 'eye';
const loader = new GLTFLoader();
let roomBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
let selectedObject = null;

loader.load(`./models/${objToRender}/room.gltf`, function (gltf) {
    const object = gltf.scene;
    scene.add(object);
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    roomBounds = { minX: box.min.x + 1, maxX: box.max.x - 1, minZ: box.min.z + 1, maxZ: box.max.z - 1 };
    camera.position.set(center.x + 7, fixedHeight, center.z + 1);
    camera.lookAt(center.x, fixedHeight, center.z);
    controls.target.set(center.x + 3, fixedHeight, center.z);
    controls.update();
}, undefined, console.error);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);

const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(50, 50, 5);
scene.add(topLight);
scene.add(new THREE.AmbientLight(0x333333, 3.5));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.minDistance = 2;
controls.maxDistance = 2;
controls.enableRotate = true;
controls.screenSpacePanning = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function moveCamera(targetPosition, lookAtPosition) {
    targetPosition.x = THREE.MathUtils.clamp(targetPosition.x, roomBounds.minX, roomBounds.maxX);
    targetPosition.z = THREE.MathUtils.clamp(targetPosition.z, roomBounds.minZ, roomBounds.maxZ);
    
    gsap.to(camera.position, {
        x: targetPosition.x,
        y: fixedHeight,
        z: targetPosition.z,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: controls.update
    });

    gsap.to(controls.target, {
        x: lookAtPosition.x,
        y: fixedHeight,
        z: lookAtPosition.z,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: controls.update
    });
}

window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        if (!selectedObject) {
            selectedObject = intersects[0].object;
            console.log("Object selected: Click again to move.");
        } else {
            const objectPosition = selectedObject.getWorldPosition(new THREE.Vector3());
            moveCamera(new THREE.Vector3(objectPosition.x + 2, fixedHeight, objectPosition.z + 2), objectPosition);
            selectedObject = null; // Reset selection
        }
    }
});

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0x00000, 1); // Softer, balanced light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x00000, 2.5); // Simulating sunlight
directionalLight.position.set(-100, -50, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2;
directionalLight.shadow.mapSize.height = 2;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 100;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0.5); // Warm point light in room
pointLight.position.set(0, 5, 0);
pointLight.castShadow = true;
scene.add(pointLight);

// Enable Shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
