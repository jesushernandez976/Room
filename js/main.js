import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { gsap } from "https://cdn.skypack.dev/gsap@3.9.1";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/shaders/FXAAShader.js";

// Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = true;
controls.enableZoom = true;
controls.enablePan = false;
controls.minDistance = 1;
controls.maxDistance = 2.7;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 1.7;

// Lighting
scene.add(new THREE.AmbientLight(0x333333, 3.5));
const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(50, 50, 5);
scene.add(topLight);

// Load 3D Model with Draco Compression
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://cdn.skypack.dev/three@0.129.0/examples/js/libs/draco/");

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const objToRender = "eye";
loader.load(`./models/${objToRender}/room.gltf`, (gltf) => {
    const object = gltf.scene;
    scene.add(object);

    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const fixedHeight = 2.3;

    camera.position.set(center.x + 9, fixedHeight, center.z + .5);
    camera.lookAt(center.x, fixedHeight, center.z);
    controls.target.set(center.x + 2.5, fixedHeight, center.z);
    controls.update();
}, undefined, (error) => console.error("Error loading model:", error));

// Clickable Markers
function createMarker(position, size, name, rotation = [0, 0, 0]) {
    const geometry = new THREE.BoxGeometry(...size);
    const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }); // Initially invisible
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(...position);
    marker.rotation.set(...rotation);
    marker.name = name;
    scene.add(marker);
    return marker;
}

// Create markers
const marker1 = createMarker([-.26, 1.2, 2.3], [1.65, 4, 1], "Marker1");
const marker2 = createMarker([3.43, 1.94, -2.98], [0.1, 1.01, 1.64], "Marker2", [0, Math.PI / 4.3, 0]);

// Camera Movement Functions
function moveCamera(marker, offsetX = -0.7, offsetY = 0, offsetZ = -4) {
    gsap.to(camera.position, {
        x: marker.position.x + offsetX,
        y: 2.3 + offsetY,
        z: marker.position.z + offsetZ,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => controls.update()
    });
    gsap.to(controls.target, {
        x: marker.position.x,
        y: 2.3,
        z: marker.position.z,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => controls.update()
    });
}

// Raycasting for interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();



function onPointerMove(event) {
    const x = event.clientX || event.touches?.[0]?.clientX;
    const y = event.clientY || event.touches?.[0]?.clientY;

    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    let isHovering = false;

    intersects.forEach((intersect) => {
        if (intersect.object.name === "Marker1" || intersect.object.name === "Marker2") {
            gsap.to(intersect.object.material, { opacity: 0.25, duration: 0.3 }); // Show marker on hover
            document.body.style.cursor = "pointer";
            isHovering = true;
        }
    });

    if (!isHovering) {
        gsap.to(marker1.material, { opacity: 0, duration: 0.3 }); // Hide when not hovered
        gsap.to(marker2.material, { opacity: 0, duration: 0.3 });
        document.body.style.cursor = "default";
    }
}

function onPointerDown(event) {
    const x = event.clientX || event.touches?.[0]?.clientX;
    const y = event.clientY || event.touches?.[0]?.clientY;

    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.name === "Marker1") moveCamera(marker1);
        if (clickedObject.name === "Marker2") moveCamera(marker2, -1, 4, 1);
    }
}

// Event listeners
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerdown", onPointerDown);

// FXAA Anti-Aliasing Post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.uniforms["resolution"].value.set(.5 / window.innerWidth, .2 / window.innerHeight);
composer.addPass(fxaaPass);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
}
animate();

// Resize Handling
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
