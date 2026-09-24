import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import gsap from 'gsap';

const canvas = document.querySelector('#canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

scene.add(new THREE.HemisphereLight(0xb8dfff, 0x101020, 2.0));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0x00bfff, 25, 15);
rimLight.position.set(-3, 1, -2);
scene.add(rimLight);

new RGBELoader().load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr',
  (texture) => { texture.mapping = THREE.EquirectangularReflectionMapping; scene.environment = texture; },
  undefined,
  (error) => console.warn('Optional HDR environment failed to load:', error)
);

let model = null;
new GLTFLoader().load(
  `${import.meta.env.BASE_URL}DamagedHelmet.gltf`,
  (gltf) => {
    model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    model.position.sub(center);
    const largestDimension = Math.max(size.x, size.y, size.z);
    if (largestDimension > 0) model.scale.setScalar(2.15 / largestDimension);
    scene.add(model);
    console.info('3D helmet loaded successfully');
  },
  undefined,
  (error) => console.error('3D model failed to load:', error)
);

window.addEventListener('mousemove', (event) => {
  if (!model) return;
  const x = (event.clientX / window.innerWidth - 0.5) * Math.PI * 0.12;
  const y = (event.clientY / window.innerHeight - 0.5) * Math.PI * 0.12;
  gsap.to(model.rotation, { x: y, y: x, duration: 0.6, ease: 'power2.out', overwrite: true });
}, { passive: true });

const logo = document.getElementById('logo');
logo?.addEventListener('mouseenter', () => { logo.style.animation = 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both'; });
logo?.addEventListener('animationend', () => { logo.style.animation = ''; });

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);

let frameId;
function animate() {
  frameId = requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
function startRendering() { if (!frameId) animate(); }
function stopRendering() { cancelAnimationFrame(frameId); frameId = null; }
document.addEventListener('visibilitychange', () => document.hidden ? stopRendering() : startRendering());
resize();
startRendering();
