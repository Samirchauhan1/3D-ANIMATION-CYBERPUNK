import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from 'gsap';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 4;

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#canvas'), antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms.amount.value = 0.003;
composer.addPass(rgbShiftPass);

new RGBELoader().load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr',
  (texture) => { texture.mapping = THREE.EquirectangularReflectionMapping; scene.environment = texture; },
  undefined,
  (error) => console.warn('HDR environment failed to load:', error)
);

let model;
new GLTFLoader().load(
  `${import.meta.env.BASE_URL}DamagedHelmet.gltf`,
  (gltf) => {
    model = gltf.scene;
    model.scale.setScalar(1.25);
    scene.add(model);
  },
  undefined,
  (error) => console.error('3D model failed to load:', error)
);

window.addEventListener('mousemove', (event) => {
  if (!model) return;
  const x = (event.clientX / window.innerWidth - 0.5) * Math.PI * 0.12;
  const y = (event.clientY / window.innerHeight - 0.5) * Math.PI * 0.12;
  gsap.to(model.rotation, { x: y, y: x, duration: 0.9, ease: 'power2.out', overwrite: true });
});

const logo = document.getElementById('logo');
logo?.addEventListener('mouseenter', () => { logo.style.animation = 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both'; });
logo?.addEventListener('animationend', () => { logo.style.animation = ''; });

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
function animate() {
  requestAnimationFrame(animate);
  rgbShiftPass.uniforms.amount.value = 0.003 + 0.002 * Math.sin(performance.now() * 0.001);
  composer.render();
}
resize();
animate();
