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

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limits for performance
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);

// Handle Resizing
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Load 3D Model
loader.load(`./models/${objToRender}/room.gltf`, function (gltf) {
    console.log("Model Loaded!");
    const object = gltf.scene;
    scene.add(object);

    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    roomBounds = { minX: box.min.x + 1, maxX: box.max.x - 1, minZ: box.min.z + 1, maxZ: box.max.z - 1 };

    camera.position.set(center.x + 6, fixedHeight, center.z + .50);
    camera.lookAt(center.x, fixedHeight, center.z);
    controls.target.set(center.x + 4, fixedHeight, center.z);
    controls.update();
}, undefined, function (error) {
    console.error("Error loading model:", error);
});

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
controls.enableRotate = true;
controls.enablePan = true;
controls.touchPanSpeed = 0.5;

// Clickable Markers
const markerGeometry = new THREE.BoxGeometry(2, 2, 2);
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
const marker = new THREE.Mesh(markerGeometry, markerMaterial);
marker.position.set(0.01, fixedHeight, 2.77);
marker.name = "ClickableMarker";
scene.add(marker);

const markerGeometry2 = new THREE.BoxGeometry(.2, 1, 2);
const markerMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0 });
const marker2 = new THREE.Mesh(markerGeometry2, markerMaterial2);
marker2.position.set(3.48, 2, -3);
marker2.name = "ClickableMarker2";
marker2.rotation.set(0, Math.PI / 4.3, 0); // Rotate 45° around the Y-axis
scene.add(marker2);

// Raycaster for Click Detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Camera Movement Functions
function moveCameraToMarker1() {
    gsap.to(camera.position, {
        x: marker.position.x - 1,
        y: fixedHeight,
        z: marker.position.z - 2,
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
        x: marker2.position.x - 1, 
        y: fixedHeight + 4, 
        z: marker2.position.z + 1, 
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

// Click & Touch Event Listener
function onClick(event) {
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const y = event.touches ? event.touches[0].clientY : event.clientY;

    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;

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
}

// Handle Click & Touch
window.addEventListener("click", onClick);
window.addEventListener("touchstart", onClick);

// FXAA Anti-Aliasing Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const fxaaPass = new ShaderPass(FXAAShader);
if (/Mobi|Android/i.test(navigator.userAgent)) {
    fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
} else {
    fxaaPass.uniforms['resolution'].value.set(0.01 / window.innerWidth, 0.01 / window.innerHeight);
}
composer.addPass(fxaaPass);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
}
animate();
