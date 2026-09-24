import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

const canvas = document.getElementById('canvas');
if (!canvas) throw new Error('Missing #canvas element in index.html');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

scene.add(new THREE.HemisphereLight(0xc8e8ff, 0x202030, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 3.5);
key.position.set(4, 5, 6);
scene.add(key);
const fill = new THREE.DirectionalLight(0x00bfff, 2.5);
fill.position.set(-4, 1, 3);
scene.add(fill);
const rim = new THREE.PointLight(0x087eff, 18, 20);
rim.position.set(-3, 2, -3);
scene.add(rim);

let model = null;
const modelUrl = `${import.meta.env.BASE_URL}DamagedHelmet.gltf`;
const loader = new GLTFLoader();
loader.load(modelUrl, ({ scene: loadedScene }) => {
  model = loadedScene;
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.updateMatrixWorld(true);

  // Fit the model to the camera using its actual transformed dimensions.
  const fittedBounds = new THREE.Box3().setFromObject(model);
  const size = fittedBounds.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  model.scale.setScalar(2.25 / maxDim);
  model.updateMatrixWorld(true);
  const finalBounds = new THREE.Box3().setFromObject(model);
  const finalCenter = finalBounds.getCenter(new THREE.Vector3());
  model.position.sub(finalCenter);
  const finalSize = finalBounds.getSize(new THREE.Vector3());
  const fitHeightDistance = (finalSize.y / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const fitWidthDistance = (finalSize.x / 2) / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
  camera.position.set(0, 0, Math.max(fitHeightDistance, fitWidthDistance) * 1.35 + finalSize.z / 2);
  camera.lookAt(0, 0, 0);
  scene.add(model);
  console.info(`Helmet loaded: ${modelUrl}`);
}, undefined, (error) => {
  console.error(`Could not load 3D model at ${modelUrl}`, error);
});

window.addEventListener('pointermove', (event) => {
  if (!model) return;
  const nx = (event.clientX / window.innerWidth - 0.5) * 0.55;
  const ny = (event.clientY / window.innerHeight - 0.5) * 0.35;
  gsap.to(model.rotation, { y: nx, x: -ny, duration: 0.65, ease: 'power2.out', overwrite: true });
}, { passive: true });

const logo = document.getElementById('logo');
logo?.addEventListener('mouseenter', () => { logo.style.animation = 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both'; });
logo?.addEventListener('animationend', () => { logo.style.animation = ''; });

function resize() {
  const width = window.innerWidth || 1;
  const height = window.innerHeight || 1;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);

let frame = 0;
function animate() {
  frame = requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
function stop() { cancelAnimationFrame(frame); frame = 0; }
function start() { if (!frame) animate(); }
document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
resize();
start();
