<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let meshGroup: THREE.Group | null = null;
let haloMesh: THREE.Mesh | null = null;
let dustParticles: THREE.Points | null = null;
let wireMat: THREE.MeshBasicMaterial | null = null;

let animationFrameId: number | null = null;
let scrollProgress = 0;
let targetScrollProgress = 0;
let mouseX = 0;
let mouseY = 0;
let isMobile = false;

// Cubic ease in-out for ultra smooth section transitions
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function updateScrollProgress() {
  if (typeof window === 'undefined') return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetScrollProgress = Math.max(0, Math.min(1, window.scrollY / (maxScroll || 1)));
}

function handleMouseMove(e: MouseEvent) {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
}

function handleResize() {
  if (!canvasRef.value || !camera || !renderer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  isMobile = width < 768;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// 3D Waypoint Trajectory based on scroll progress
function interpolateScroll(p: number) {
  let targetX: number;
  let targetY: number;
  let targetZ: number;
  let targetScale: number;
  let targetRotZ: number;

  if (isMobile) {
    // Mobile mode: keep object mostly centered and further back so it never covers content
    targetX = 0;
    targetY = p < 0.2 ? 0.8 : -0.5;
    targetZ = -2.5;
    targetScale = 0.65;
    targetRotZ = p * 0.5;
    return { x: targetX, y: targetY, z: targetZ, scale: targetScale, rotZ: targetRotZ };
  }

  if (p < 0.25) {
    // Phase 1: Hero (Right Column) -> About (Left)
    const t = p / 0.25;
    targetX = 2.4 + (-2.3 - 2.4) * easeInOutCubic(t);
    targetY = 0 + (0.2 - 0) * t;
    targetZ = 0 + (1.1 - 0) * easeInOutCubic(t);
    targetScale = 1.0 + (1.2 - 1.0) * t;
    targetRotZ = t * 0.4;
  } else if (p < 0.50) {
    // Phase 2: About (Left) -> Skills/Stack (Center)
    const t = (p - 0.25) / 0.25;
    targetX = -2.3 + (0 - -2.3) * easeInOutCubic(t);
    targetY = 0.2 + (-0.2 - 0.2) * t;
    targetZ = 1.1 + (-0.5 - 1.1) * easeInOutCubic(t);
    targetScale = 1.2 + (0.9 - 1.2) * t;
    targetRotZ = 0.4 + (0 - 0.4) * t;
  } else if (p < 0.75) {
    // Phase 3: Skills (Center) -> Journey/Projects (Right-Side Orbit)
    const t = (p - 0.50) / 0.25;
    targetX = 0 + (2.1 - 0) * easeInOutCubic(t);
    targetY = -0.2 + (0.1 - -0.2) * t;
    targetZ = -0.5 + (-1.2 - -0.5) * easeInOutCubic(t);
    targetScale = 0.9 + (1.1 - 0.9) * t;
    targetRotZ = t * -0.2;
  } else {
    // Phase 4: Projects -> Contact (Deep Background Horizon Glow)
    const t = (p - 0.75) / 0.25;
    targetX = 2.1 + (1.6 - 2.1) * easeInOutCubic(t);
    targetY = 0.1 + (-0.4 - 0.1) * t;
    targetZ = -1.2 + (-3.5 - -1.2) * easeInOutCubic(t);
    targetScale = 1.1 + (1.5 - 1.1) * t;
    targetRotZ = -0.2 + (-0.4 - -0.2) * t;
  }

  return { x: targetX, y: targetY, z: targetZ, scale: targetScale, rotZ: targetRotZ };
}

onMounted(() => {
  if (!canvasRef.value) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  isMobile = width < 768;

  // Scene setup with background fog matching portfolio theme (#070b14)
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070b14, 0.04);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 8);

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  const pointLightCyan = new THREE.PointLight(0x00f0ff, 3.2, 30);
  pointLightCyan.position.set(5, 5, 5);
  scene.add(pointLightCyan);

  const pointLightBlue = new THREE.PointLight(0x3b82f6, 2.2, 30);
  pointLightBlue.position.set(-5, -4, 3);
  scene.add(pointLightBlue);

  // Group container for all 3D mesh components
  meshGroup = new THREE.Group();
  scene.add(meshGroup);

  // 1. Inner Faceted Crystal Core
  const coreGeom = new THREE.IcosahedronGeometry(1.5, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x07111e,
    roughness: 0.15,
    metalness: 0.9,
    flatShading: true,
    emissive: 0x00203f,
    emissiveIntensity: 0.3,
  });
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  meshGroup.add(coreMesh);

  // 2. Outer Wireframe Lattice (Guillaume Gouessan Minimalist Tech Signature)
  const wireGeom = new THREE.IcosahedronGeometry(1.82, 1);
  wireMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.38,
  });
  const wireMesh = new THREE.Mesh(wireGeom, wireMat);
  meshGroup.add(wireMesh);

  // 3. Glowing Vertex Points
  const pointsMat = new THREE.PointsMaterial({
    color: 0x00f0ff,
    size: 0.08,
    transparent: true,
    opacity: 0.9,
  });
  const pointsMesh = new THREE.Points(wireGeom, pointsMat);
  meshGroup.add(pointsMesh);

  // 4. Toroidal Halo Ring
  const haloGeom = new THREE.TorusGeometry(2.35, 0.02, 16, 100);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.28,
  });
  haloMesh = new THREE.Mesh(haloGeom, haloMat);
  haloMesh.rotation.x = Math.PI / 2.5;
  meshGroup.add(haloMesh);

  // 5. Space Dust / Constellation Particle Field
  const particleCount = isMobile ? 100 : 220;
  const particleGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 18;
    positions[i + 1] = (Math.random() - 0.5) * 14;
    positions[i + 2] = (Math.random() - 0.5) * 12;
  }
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0x64748b,
    size: 0.035,
    transparent: true,
    opacity: 0.5,
  });
  dustParticles = new THREE.Points(particleGeom, dustMat);
  scene.add(dustParticles);

  // Initial position in Hero Section
  meshGroup.position.set(isMobile ? 0 : 2.4, isMobile ? 0.8 : 0, isMobile ? -2.5 : 0);

  // Event Listeners
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('resize', handleResize);
  updateScrollProgress();

  // Animation Loop with Smooth Damping
  const clock = new THREE.Clock();

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (!meshGroup || !scene || !camera || !renderer) return;

    const elapsedTime = clock.getElapsedTime();

    // Smooth scroll interpolation (damping lerp)
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.06;
    const wp = interpolateScroll(scrollProgress);

    // Apply target position with subtle mouse parallax
    const pX = isMobile ? wp.x : wp.x + mouseX * 0.25;
    const pY = isMobile ? wp.y : wp.y + mouseY * 0.18;

    meshGroup.position.x += (pX - meshGroup.position.x) * 0.08;
    meshGroup.position.y += (pY - meshGroup.position.y) * 0.08;
    meshGroup.position.z += (wp.z - meshGroup.position.z) * 0.08;

    const currentScale = meshGroup.scale.x;
    const nextScale = currentScale + (wp.scale - currentScale) * 0.08;
    meshGroup.scale.set(nextScale, nextScale, nextScale);

    // Continuous subtle rotation + scroll velocity dynamic burst
    const scrollSpeed = Math.abs(targetScrollProgress - scrollProgress) * 12;
    meshGroup.rotation.y = elapsedTime * 0.16 + scrollProgress * Math.PI * 2;
    meshGroup.rotation.x = elapsedTime * 0.10 + (isMobile ? 0 : mouseX * 0.15) + scrollSpeed * 0.4;
    meshGroup.rotation.z = wp.rotZ;

    // Independent halo ring rotation
    if (haloMesh) {
      haloMesh.rotation.z = elapsedTime * 0.28;
    }

    // Ambient space dust drift
    if (dustParticles) {
      dustParticles.rotation.y = elapsedTime * 0.02 + scrollProgress * 0.8;
    }

    renderer.render(scene, camera);
  }

  animate();
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', updateScrollProgress);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', handleResize);
  }

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  // Memory cleanup: dispose all WebGL geometries, materials, and renderer
  if (meshGroup) {
    meshGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh || (child as THREE.Points).isPoints) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });
  }

  if (dustParticles) {
    dustParticles.geometry.dispose();
    if (dustParticles.material instanceof THREE.Material) {
      dustParticles.material.dispose();
    }
  }

  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
  }
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
    <canvas ref="canvasRef" class="w-full h-full block"></canvas>
  </div>
</template>
