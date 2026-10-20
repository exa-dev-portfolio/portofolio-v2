<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;

// Groups and Meshes
let meshGroup: THREE.Group | null = null;
let torusKnotMesh: THREE.Mesh | null = null;
let wireKnotMesh: THREE.Mesh | null = null;
let wireKnotPoints: THREE.Points | null = null;
let innerGemMesh: THREE.Mesh | null = null;
let innerGemWire: THREE.Mesh | null = null;

// Multi-Axis Gimbal Rings
let gyroRing1: THREE.Mesh | null = null;
let gyroRing2: THREE.Mesh | null = null;
let gyroRing3: THREE.Mesh | null = null;

// Orbiting Satellites (Data Beacons)
interface SatelliteNode {
  mesh: THREE.Mesh;
  orbitRadius: number;
  speed: number;
  inclinationX: number;
  inclinationZ: number;
  phase: number;
}
const satellites: SatelliteNode[] = [];

// Particle Field
let dustParticles: THREE.Points | null = null;

let animationFrameId: number | null = null;
let scrollProgress = 0;
let targetScrollProgress = 0;
let mouseX = 0;
let mouseY = 0;
let isMobile = false;
let shockwaveScale = 1.0;

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

function handleClick() {
  shockwaveScale = 1.2;
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
    // Mobile mode: keep object centered and further back so it never covers content
    targetX = 0;
    targetY = p < 0.2 ? 0.7 : -0.5;
    targetZ = -2.8;
    targetScale = 0.62;
    targetRotZ = p * 0.5;
    return { x: targetX, y: targetY, z: targetZ, scale: targetScale, rotZ: targetRotZ };
  }

  if (p < 0.25) {
    // Phase 1: Hero (Right Column) -> About (Left)
    const t = p / 0.25;
    targetX = 2.4 + (-2.3 - 2.4) * easeInOutCubic(t);
    targetY = 0 + (0.2 - 0) * t;
    targetZ = 0 + (1.0 - 0) * easeInOutCubic(t);
    targetScale = 1.0 + (1.18 - 1.0) * t;
    targetRotZ = t * 0.4;
  } else if (p < 0.50) {
    // Phase 2: About (Left) -> Skills/Stack (Center)
    const t = (p - 0.25) / 0.25;
    targetX = -2.3 + (0 - -2.3) * easeInOutCubic(t);
    targetY = 0.2 + (-0.2 - 0.2) * t;
    targetZ = 1.0 + (-0.6 - 1.0) * easeInOutCubic(t);
    targetScale = 1.18 + (0.88 - 1.18) * t;
    targetRotZ = 0.4 + (0 - 0.4) * t;
  } else if (p < 0.75) {
    // Phase 3: Skills (Center) -> Journey/Projects (Right-Side Orbit)
    const t = (p - 0.50) / 0.25;
    targetX = 0 + (2.1 - 0) * easeInOutCubic(t);
    targetY = -0.2 + (0.1 - -0.2) * t;
    targetZ = -0.6 + (-1.2 - -0.6) * easeInOutCubic(t);
    targetScale = 0.88 + (1.08 - 0.88) * t;
    targetRotZ = t * -0.2;
  } else {
    // Phase 4: Projects -> Contact (Deep Background Horizon Glow)
    const t = (p - 0.75) / 0.25;
    targetX = 2.1 + (1.6 - 2.1) * easeInOutCubic(t);
    targetY = 0.1 + (-0.4 - 0.1) * t;
    targetZ = -1.2 + (-3.5 - -1.2) * easeInOutCubic(t);
    targetScale = 1.08 + (1.45 - 1.08) * t;
    targetRotZ = -0.2 + (-0.4 - -0.2) * t;
  }

  return { x: targetX, y: targetY, z: targetZ, scale: targetScale, rotZ: targetRotZ };
}

onMounted(() => {
  if (!canvasRef.value) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  isMobile = width < 768;

  // Scene setup with background fog matching Nordic Monochrome theme (#09090b)
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x09090b, 0.038);

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

  // Lighting Suite (Nordic Monochrome Neutral Palette)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);

  const pointLightWhite = new THREE.PointLight(0xffffff, 3.2, 35);
  pointLightWhite.position.set(5, 5, 5);
  scene.add(pointLightWhite);

  const pointLightSilver = new THREE.PointLight(0xd4d4d8, 2.6, 35);
  pointLightSilver.position.set(-5, -4, 4);
  scene.add(pointLightSilver);

  const pointLightTitanium = new THREE.PointLight(0x71717a, 2.0, 25);
  pointLightTitanium.position.set(0, 4, -3);
  scene.add(pointLightTitanium);

  // Group container for all 3D mesh components
  meshGroup = new THREE.Group();
  scene.add(meshGroup);

  // 1. Quantum Torus Knot Core (Clean Titanium Metal)
  const knotGeom = new THREE.TorusKnotGeometry(1.22, 0.32, 128, 32, 2, 3);
  const knotMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.22,
    metalness: 0.92,
    emissive: 0x27272a,
    emissiveIntensity: 0.35,
  });
  torusKnotMesh = new THREE.Mesh(knotGeom, knotMat);
  meshGroup.add(torusKnotMesh);

  // 2. Holographic Outer Wireframe Cage (Crisp Silver)
  const wireKnotGeom = new THREE.TorusKnotGeometry(1.28, 0.34, 64, 16, 2, 3);
  const wireKnotMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });
  wireKnotMesh = new THREE.Mesh(wireKnotGeom, wireKnotMat);
  meshGroup.add(wireKnotMesh);

  // 3. Glowing Vertex Points (Node Matrix on the Knot)
  const pointsMat = new THREE.PointsMaterial({
    color: 0xf4f4f5,
    size: 0.055,
    transparent: true,
    opacity: 0.7,
  });
  wireKnotPoints = new THREE.Points(wireKnotGeom, pointsMat);
  meshGroup.add(wireKnotPoints);

  // 4. Inner Quantum Energy Gem (Dual-Pyramid Octahedron)
  const gemGeom = new THREE.OctahedronGeometry(0.55, 0);
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.15,
    metalness: 0.95,
    flatShading: true,
    emissive: 0x3f3f46,
    emissiveIntensity: 0.45,
  });
  innerGemMesh = new THREE.Mesh(gemGeom, gemMat);
  meshGroup.add(innerGemMesh);

  const gemWireGeom = new THREE.OctahedronGeometry(0.68, 0);
  const gemWireMat = new THREE.MeshBasicMaterial({
    color: 0xa1a1aa,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  innerGemWire = new THREE.Mesh(gemWireGeom, gemWireMat);
  meshGroup.add(innerGemWire);

  // 5. Multi-Axis Concentric Gyroscopic Rings (Gimbal System)
  // Ring 1 (Inner Crisp Ring)
  const ring1Geom = new THREE.TorusGeometry(2.25, 0.022, 16, 120);
  const ring1Mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
  });
  gyroRing1 = new THREE.Mesh(ring1Geom, ring1Mat);
  gyroRing1.rotation.x = Math.PI / 3;
  meshGroup.add(gyroRing1);

  // Ring 2 (Middle Silver Ring)
  const ring2Geom = new THREE.TorusGeometry(2.65, 0.016, 16, 120);
  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0xd4d4d8,
    transparent: true,
    opacity: 0.35,
  });
  gyroRing2 = new THREE.Mesh(ring2Geom, ring2Mat);
  gyroRing2.rotation.y = Math.PI / 4;
  gyroRing2.rotation.z = Math.PI / 6;
  meshGroup.add(gyroRing2);

  // Ring 3 (Outer Titanium Ring)
  const ring3Geom = new THREE.TorusGeometry(3.05, 0.012, 16, 120);
  const ring3Mat = new THREE.MeshBasicMaterial({
    color: 0x71717a,
    transparent: true,
    opacity: 0.25,
  });
  gyroRing3 = new THREE.Mesh(ring3Geom, ring3Mat);
  gyroRing3.rotation.x = -Math.PI / 5;
  meshGroup.add(gyroRing3);

  // 6. Orbiting Satellite Nodes (Data Beacons)
  const satelliteConfigs = [
    { color: 0xffffff, radius: 2.25, speed: 0.85, incX: 0.6, incZ: 0.2, phase: 0 },
    { color: 0xd4d4d8, radius: 2.65, speed: -0.65, incX: -0.4, incZ: 0.7, phase: Math.PI / 2 },
    { color: 0xa1a1aa, radius: 2.25, speed: 0.75, incX: 0.8, incZ: -0.3, phase: Math.PI },
    { color: 0x71717a, radius: 3.05, speed: -0.5, incX: -0.5, incZ: -0.5, phase: (3 * Math.PI) / 2 },
  ];

  satellites.length = 0;
  satelliteConfigs.forEach((cfg) => {
    const satGeom = new THREE.OctahedronGeometry(0.1, 0);
    const satMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      emissive: cfg.color,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.8,
    });
    const satMesh = new THREE.Mesh(satGeom, satMat);
    meshGroup?.add(satMesh);
    satellites.push({
      mesh: satMesh,
      orbitRadius: cfg.radius,
      speed: cfg.speed,
      inclinationX: cfg.incX,
      inclinationZ: cfg.incZ,
      phase: cfg.phase,
    });
  });

  // 7. Ambient Space Dust / Constellation Particle Field
  const particleCount = isMobile ? 120 : 260;
  const particleGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 20;
    positions[i + 1] = (Math.random() - 0.5) * 16;
    positions[i + 2] = (Math.random() - 0.5) * 14;
  }
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xd4d4d8,
    size: 0.035,
    transparent: true,
    opacity: 0.4,
  });
  dustParticles = new THREE.Points(particleGeom, dustMat);
  scene.add(dustParticles);

  // Initial position in Hero Section
  meshGroup.position.set(isMobile ? 0 : 2.4, isMobile ? 0.7 : 0, isMobile ? -2.8 : 0);

  // Event Listeners
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('click', handleClick, { passive: true });
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
    const pX = isMobile ? wp.x : wp.x + mouseX * 0.28;
    const pY = isMobile ? wp.y : wp.y + mouseY * 0.20;

    meshGroup.position.x += (pX - meshGroup.position.x) * 0.08;
    meshGroup.position.y += (pY - meshGroup.position.y) * 0.08;
    meshGroup.position.z += (wp.z - meshGroup.position.z) * 0.08;

    // Shockwave pulse decay
    shockwaveScale += (1.0 - shockwaveScale) * 0.08;
    const currentScale = meshGroup.scale.x;
    const baseTargetScale = wp.scale * shockwaveScale;
    const nextScale = currentScale + (baseTargetScale - currentScale) * 0.08;
    meshGroup.scale.set(nextScale, nextScale, nextScale);

    // Continuous Torus Knot Rotation + scroll velocity boost
    const scrollSpeed = Math.abs(targetScrollProgress - scrollProgress) * 12;
    if (torusKnotMesh && wireKnotMesh && wireKnotPoints) {
      const rotY = elapsedTime * 0.22 + scrollProgress * Math.PI * 2;
      const rotX = elapsedTime * 0.14 + (isMobile ? 0 : mouseX * 0.16) + scrollSpeed * 0.4;
      torusKnotMesh.rotation.set(rotX, rotY, wp.rotZ);
      wireKnotMesh.rotation.set(rotX, rotY, wp.rotZ);
      wireKnotPoints.rotation.set(rotX, rotY, wp.rotZ);
    }

    // Inner Quantum Gem Independent Rotation & Pulsing
    if (innerGemMesh && innerGemWire) {
      const gemRot = elapsedTime * 0.6;
      innerGemMesh.rotation.set(gemRot, gemRot * 1.2, gemRot * 0.8);
      innerGemWire.rotation.set(-gemRot * 0.8, -gemRot * 1.1, gemRot);

      const gemPulse = 1.0 + Math.sin(elapsedTime * 2.8) * 0.08;
      innerGemMesh.scale.set(gemPulse, gemPulse, gemPulse);
    }

    // Multi-Axis Gyroscopic Rings Counter-Rotations
    if (gyroRing1) {
      gyroRing1.rotation.z = elapsedTime * 0.35;
      gyroRing1.rotation.x = Math.PI / 3 + Math.sin(elapsedTime * 0.5) * 0.12;
    }
    if (gyroRing2) {
      gyroRing2.rotation.z = -elapsedTime * 0.28;
      gyroRing2.rotation.y = Math.PI / 4 + Math.cos(elapsedTime * 0.4) * 0.15;
    }
    if (gyroRing3) {
      gyroRing3.rotation.z = elapsedTime * 0.18;
      gyroRing3.rotation.x = -Math.PI / 5 + Math.sin(elapsedTime * 0.3) * 0.08;
    }

    // Orbiting Satellite Nodes Motion
    satellites.forEach((sat) => {
      const angle = elapsedTime * sat.speed + sat.phase;
      const r = sat.orbitRadius;
      const rawX = Math.cos(angle) * r;
      const rawY = Math.sin(angle) * r;
      const rawZ = Math.sin(angle * 2) * 0.35;

      // Apply inclination tilt
      sat.mesh.position.x = rawX * Math.cos(sat.inclinationZ) - rawY * Math.sin(sat.inclinationZ);
      sat.mesh.position.y = (rawX * Math.sin(sat.inclinationZ) + rawY * Math.cos(sat.inclinationZ)) * Math.cos(sat.inclinationX);
      sat.mesh.position.z = rawZ + rawY * Math.sin(sat.inclinationX);

      // Rotate individual node
      sat.mesh.rotation.x += 0.04;
      sat.mesh.rotation.y += 0.05;
    });

    // Ambient space dust drift
    if (dustParticles) {
      dustParticles.rotation.y = elapsedTime * 0.018 + scrollProgress * 0.75;
      dustParticles.rotation.x = Math.sin(elapsedTime * 0.2) * 0.05;
    }

    renderer.render(scene, camera);
  }

  animate();
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', updateScrollProgress);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('click', handleClick);
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
