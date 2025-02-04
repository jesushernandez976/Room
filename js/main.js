// Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { gsap } from "https://cdn.skypack.dev/gsap@3.9.1";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/shaders/FXAAShader.js";

// Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const fixedHeight = 2.5;
let objToRender = 'eye';
const loader = new GLTFLoader();
let roomBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
let selectedObject = null;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio); // Improve anti-aliasing quality
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);

// Load the 3D Model
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

// Lighting
const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(50, 50, 5);
scene.add(topLight);
scene.add(new THREE.AmbientLight(0x333333, 3.5));

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;
controls.enableZoom = true;
controls.minDistance = 2;
controls.maxDistance = 2;
controls.enableRotate = true;
controls.screenSpacePanning = false;

// Create Clickable Markers
const markerGeometry = new THREE.BoxGeometry(1, 1, 1);
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
const marker = new THREE.Mesh(markerGeometry, markerMaterial);
marker.position.set(0.01, fixedHeight, 2);
marker.name = "ClickableMarker";
scene.add(marker);

const markerGeometry2 = new THREE.BoxGeometry(0.6, 1, 1);
const markerMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0 });
const marker2 = new THREE.Mesh(markerGeometry2, markerMaterial2);
marker2.position.set(3.7, 2, -2.5);
marker2.name = "ClickableMarker2";
scene.add(marker2);

// Raycaster for Click Detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Camera Movement Functions
function moveCameraToMarker1() {
    gsap.to(camera.position, {
        x: marker.position.x - 2,
        y: fixedHeight,
        z: marker.position.z - 7,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
            camera.position.y = fixedHeight;
            controls.update();
        }
    });
    gsap.to(controls.target, {
        x: marker.position.x,
        y: fixedHeight,
        z: marker.position.z,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
            controls.target.y = fixedHeight;
            controls.update();
        }
    });
}

function moveCameraToMarker2() {
    gsap.to(camera.position, {
        x: marker2.position.x - 5, 
        y: fixedHeight + 1, 
        z: marker2.position.z + 9, 
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
            camera.position.y = fixedHeight + 1; 
            controls.update();
        }
    });
    gsap.to(controls.target, {
        x: marker2.position.x,
        y: fixedHeight,
        z: marker2.position.z,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
            controls.target.y = fixedHeight;
            controls.update();
        }
    });
}

// Click Event Listener
window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.name === "ClickableMarker") {
            console.log("Marker 1 clicked! Moving camera...");
            moveCameraToMarker1();
        } else if (clickedObject.name === "ClickableMarker2") {
            console.log("Marker 2 clicked! Moving camera...");
            moveCameraToMarker2();
        }
    }
});

// **FXAA Anti-Aliasing Post-processing**
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.uniforms['resolution'].value.set(.01 / window.innerWidth, .01 / window.innerHeight);
composer.addPass(fxaaPass);

// **Animation Loop**
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render(); // Use composer instead of renderer for FXAA
}

animate();
