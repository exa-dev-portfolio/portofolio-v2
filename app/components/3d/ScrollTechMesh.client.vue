<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let processorGroup: THREE.Group | null = null;

// Core Components for Animation
const logicCores: THREE.Mesh[] = [];
let laserScanBar: THREE.Mesh | null = null;
let hudBrackets: THREE.LineSegments | null = null;
let dustParticles: THREE.Points | null = null;

// Data Bus Highways with traveling electron pulses
interface CircuitBus {
  points: THREE.Vector3[];
  pulses: { mesh: THREE.Mesh; progress: number; speed: number }[];
}
const circuitBuses: CircuitBus[] = [];

let animationFrameId: number | null = null;
let scrollProgress = 0;
let targetScrollProgress = 0;
let mouseX = 0;
let mouseY = 0;
let isMobile = false;
let overclockEnergy = 0;

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
  // Trigger overclock energy burst
  overclockEnergy = 1.0;
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
  let targetRotY: number;
  let targetRotX: number;

  if (isMobile) {
    targetX = 0;
    targetY = p < 0.2 ? 0.6 : -0.4;
    targetZ = -3.4;
    targetScale = 0.68;
    targetRotY = -0.4 + p * 0.9;
    targetRotX = 0.55;
    return { x: targetX, y: targetY, z: targetZ, scale: targetScale, rotY: targetRotY, rotX: targetRotX };
  }

  if (p < 0.25) {
    // Phase 1: Hero (Right Column, dramatic isometric inspection tilt)
    const t = p / 0.25;
    targetX = 2.6 + (-2.3 - 2.6) * easeInOutCubic(t);
    targetY = 0.1 + (0.3 - 0.1) * t;
    targetZ = 0.3 + (0.9 - 0.3) * easeInOutCubic(t);
    targetScale = 1.12 + (1.20 - 1.12) * t;
    targetRotY = -0.55 + 0.4 * t;
    targetRotX = 0.65 - 0.1 * t;
  } else if (p < 0.50) {
    // Phase 2: Projects Showcase (Centered aerial view of compute engine)
    const t = (p - 0.25) / 0.25;
    targetX = -2.3 + (0.1 - -2.3) * easeInOutCubic(t);
    targetY = 0.3 + (-0.2 - 0.3) * t;
    targetZ = 0.9 + (-0.4 - 0.9) * easeInOutCubic(t);
    targetScale = 1.20 + (1.00 - 1.20) * t;
    targetRotY = -0.15 + (-0.6 - -0.15) * t;
    targetRotX = 0.55 + 0.2 * t;
  } else if (p < 0.75) {
    // Phase 3: Technical Stack (High-angle inspection of circuits & buses)
    const t = (p - 0.50) / 0.25;
    targetX = 0.1 + (2.3 - 0.1) * easeInOutCubic(t);
    targetY = -0.2 + (0.1 - -0.2) * t;
    targetZ = -0.4 + (-1.2 - -0.4) * easeInOutCubic(t);
    targetScale = 1.00 + (1.15 - 1.00) * t;
    targetRotY = -0.75 + (0.5 - -0.75) * t;
    targetRotX = 0.75 - 0.15 * t;
  } else {
    // Phase 4: Contact & Horizon
    const t = (p - 0.75) / 0.25;
    targetX = 2.3 + (1.6 - 2.3) * easeInOutCubic(t);
    targetY = 0.1 + (-0.5 - 0.1) * t;
    targetZ = -1.2 + (-3.4 - -1.2) * easeInOutCubic(t);
    targetScale = 1.15 + (1.40 - 1.15) * t;
    targetRotY = 0.5 + (0.9 - 0.5) * t;
    targetRotX = 0.6;
  }

  return { x: targetX, y: targetY, z: targetZ, scale: targetScale, rotY: targetRotY, rotX: targetRotX };
}

onMounted(() => {
  if (!canvasRef.value) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  isMobile = width < 768;

  // Scene setup with atmospheric dark fog (#09090b)
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x09090b, 0.045);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 8.5);

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Studio Lighting Suite tailored for metallic silicon & PCB reflections
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xd4d4d8, 2.5, 30);
  rimLight.position.set(-6, -4, 5);
  scene.add(rimLight);

  const bottomCyberGlow = new THREE.PointLight(0x71717a, 2.0, 25);
  bottomCyberGlow.position.set(0, -5, -4);
  scene.add(bottomCyberGlow);

  // Group container for the entire Silicon Processor Assembly
  processorGroup = new THREE.Group();
  scene.add(processorGroup);

  // ==========================================
  // 1. MULTI-LAYER DARK SUBSTRATE PCB BOARD
  // ==========================================
  const pcbWidth = 4.2;
  const pcbDepth = 4.2;
  const pcbHeight = 0.14;

  const pcbGeom = new THREE.BoxGeometry(pcbWidth, pcbHeight, pcbDepth);
  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0x101014,
    roughness: 0.45,
    metalness: 0.85,
    emissive: 0x08080a,
  });
  const pcbMesh = new THREE.Mesh(pcbGeom, pcbMat);
  processorGroup.add(pcbMesh);

  // Gold / Silver Solder Pin Grid along PCB Edges
  const pinCountPerEdge = 24;
  const pinGeom = new THREE.BoxGeometry(0.06, 0.04, 0.14);
  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xe4e4e7,
    roughness: 0.2,
    metalness: 0.95,
  });

  for (let i = 0; i < pinCountPerEdge; i++) {
    const offset = -pcbWidth / 2 + 0.3 + (i * ((pcbWidth - 0.6) / (pinCountPerEdge - 1)));
    
    // Top & Bottom Edge Pins
    const pinTop = new THREE.Mesh(pinGeom, pinMat);
    pinTop.position.set(offset, pcbHeight / 2 + 0.01, -pcbDepth / 2 + 0.08);
    processorGroup.add(pinTop);

    const pinBottom = new THREE.Mesh(pinGeom, pinMat);
    pinBottom.position.set(offset, pcbHeight / 2 + 0.01, pcbDepth / 2 - 0.08);
    processorGroup.add(pinBottom);

    // Left & Right Edge Pins
    const pinLeft = new THREE.Mesh(pinGeom, pinMat);
    pinLeft.rotation.y = Math.PI / 2;
    pinLeft.position.set(-pcbWidth / 2 + 0.08, pcbHeight / 2 + 0.01, offset);
    processorGroup.add(pinLeft);

    const pinRight = new THREE.Mesh(pinGeom, pinMat);
    pinRight.rotation.y = Math.PI / 2;
    pinRight.position.set(pcbWidth / 2 - 0.08, pcbHeight / 2 + 0.01, offset);
    processorGroup.add(pinRight);
  }

  // ==========================================
  // 2. CENTRAL HEAT SPREADER & SILICON DIE
  // ==========================================
  const dieFrameGeom = new THREE.BoxGeometry(2.3, 0.18, 2.3);
  const dieFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c22,
    roughness: 0.18,
    metalness: 0.95,
    emissive: 0x141418,
  });
  const dieFrame = new THREE.Mesh(dieFrameGeom, dieFrameMat);
  dieFrame.position.y = pcbHeight / 2 + 0.09;
  processorGroup.add(dieFrame);

  // Beveled Metallic Retainer Ring (Socket Mount)
  const socketGeom = new THREE.BoxGeometry(2.5, 0.08, 2.5);
  const socketWireGeom = new THREE.EdgesGeometry(socketGeom);
  const socketWireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
  const socketWire = new THREE.LineSegments(socketWireGeom, socketWireMat);
  socketWire.position.y = pcbHeight / 2 + 0.04;
  processorGroup.add(socketWire);

  // 4 Silicon Logic Cores (Compute Core Engine Grid)
  logicCores.length = 0;
  const coreOffsets = [
    { x: -0.52, z: -0.52, name: 'Compute Core 0' },
    { x: 0.52, z: -0.52, name: 'Compute Core 1' },
    { x: -0.52, z: 0.52, name: 'Neural Engine' },
    { x: 0.52, z: 0.52, name: 'Vector Cache' },
  ];

  const coreGeom = new THREE.BoxGeometry(0.88, 0.06, 0.88);
  coreOffsets.forEach((cfg) => {
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.25,
      metalness: 0.9,
      emissive: 0x3f3f46,
      emissiveIntensity: 0.5,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreMesh.position.set(cfg.x, pcbHeight / 2 + 0.20, cfg.z);
    processorGroup?.add(coreMesh);
    logicCores.push(coreMesh);

    // Micro Core Surface Grid
    const gridHelper = new THREE.GridHelper(0.85, 8, 0xffffff, 0x52525b);
    gridHelper.position.set(cfg.x, pcbHeight / 2 + 0.232, cfg.z);
    processorGroup?.add(gridHelper);
  });

  // ==========================================
  // 3. HBM MEMORY MODULES & SMD CAPACITORS
  // ==========================================
  // 4 High-Bandwidth Memory (HBM) Stacks
  const hbmGeom = new THREE.BoxGeometry(0.72, 0.12, 0.44);
  const hbmMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.35,
    metalness: 0.85,
    emissive: 0x09090b,
  });

  const hbmPositions = [
    { x: 0, z: -1.55, rot: 0 },
    { x: 0, z: 1.55, rot: 0 },
    { x: -1.55, z: 0, rot: Math.PI / 2 },
    { x: 1.55, z: 0, rot: Math.PI / 2 },
  ];

  hbmPositions.forEach((hPos) => {
    const hbm = new THREE.Mesh(hbmGeom, hbmMat);
    hbm.position.set(hPos.x, pcbHeight / 2 + 0.06, hPos.z);
    hbm.rotation.y = hPos.rot;
    processorGroup?.add(hbm);

    // Solder pads below HBM
    const hbmWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(hbmGeom),
      new THREE.LineBasicMaterial({ color: 0xd4d4d8, transparent: true, opacity: 0.35 })
    );
    hbmWire.position.copy(hbm.position);
    hbmWire.rotation.copy(hbm.rotation);
    processorGroup?.add(hbmWire);
  });

  // SMD Capacitor Arrays (Miniature surface-mount components)
  const capGeom = new THREE.BoxGeometry(0.08, 0.06, 0.14);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x71717a,
    roughness: 0.3,
    metalness: 0.9,
  });

  // Banks of capacitors near HBM corners
  const capCoords = [
    [-1.5, -1.3], [-1.3, -1.5], [-1.5, -1.5],
    [1.5, -1.3], [1.3, -1.5], [1.5, -1.5],
    [-1.5, 1.3], [-1.3, 1.5], [-1.5, 1.5],
    [1.5, 1.3], [1.3, 1.5], [1.5, 1.5],
  ];

  capCoords.forEach(([cx, cz]) => {
    const cap = new THREE.Mesh(capGeom, capMat);
    cap.position.set(cx, pcbHeight / 2 + 0.03, cz);
    processorGroup?.add(cap);
  });

  // ==========================================
  // 4. CIRCUIT BUS HIGHWAYS & DATA PHOTONS
  // ==========================================
  circuitBuses.length = 0;
  const rawBusRoutes = [
    // Top routes from die to pins
    [new THREE.Vector3(-0.6, 0.08, -1.15), new THREE.Vector3(-0.6, 0.08, -1.4), new THREE.Vector3(-0.9, 0.08, -1.7), new THREE.Vector3(-0.9, 0.08, -2.0)],
    [new THREE.Vector3(0.6, 0.08, -1.15), new THREE.Vector3(0.6, 0.08, -1.4), new THREE.Vector3(0.9, 0.08, -1.7), new THREE.Vector3(0.9, 0.08, -2.0)],
    // Bottom routes
    [new THREE.Vector3(-0.6, 0.08, 1.15), new THREE.Vector3(-0.6, 0.08, 1.4), new THREE.Vector3(-0.9, 0.08, 1.7), new THREE.Vector3(-0.9, 0.08, 2.0)],
    [new THREE.Vector3(0.6, 0.08, 1.15), new THREE.Vector3(0.6, 0.08, 1.4), new THREE.Vector3(0.9, 0.08, 1.7), new THREE.Vector3(0.9, 0.08, 2.0)],
    // Left routes
    [new THREE.Vector3(-1.15, 0.08, -0.6), new THREE.Vector3(-1.4, 0.08, -0.6), new THREE.Vector3(-1.7, 0.08, -0.9), new THREE.Vector3(-2.0, 0.08, -0.9)],
    [new THREE.Vector3(-1.15, 0.08, 0.6), new THREE.Vector3(-1.4, 0.08, 0.6), new THREE.Vector3(-1.7, 0.08, 0.9), new THREE.Vector3(-2.0, 0.08, 0.9)],
    // Right routes
    [new THREE.Vector3(1.15, 0.08, -0.6), new THREE.Vector3(1.4, 0.08, -0.6), new THREE.Vector3(1.7, 0.08, -0.9), new THREE.Vector3(2.0, 0.08, -0.9)],
    [new THREE.Vector3(1.15, 0.08, 0.6), new THREE.Vector3(1.4, 0.08, 0.6), new THREE.Vector3(1.7, 0.08, 0.9), new THREE.Vector3(2.0, 0.08, 0.9)],
  ];

  const photonGeom = new THREE.SphereGeometry(0.038, 8, 8);
  const photonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  rawBusRoutes.forEach((pts) => {
    const curvePoints: THREE.Vector3[] = [];
    // Convert to relative y on PCB surface
    pts.forEach(p => curvePoints.push(new THREE.Vector3(p.x, pcbHeight / 2 + 0.015, p.z)));

    const busLineGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const busLineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
    });
    const busLine = new THREE.Line(busLineGeom, busLineMat);
    processorGroup?.add(busLine);

    // Traveling Data Photon along trace
    const pulseMesh = new THREE.Mesh(photonGeom, photonMat);
    processorGroup?.add(pulseMesh);

    circuitBuses.push({
      points: curvePoints,
      pulses: [
        { mesh: pulseMesh, progress: Math.random(), speed: 0.35 + Math.random() * 0.25 },
      ],
    });
  });

  // ==========================================
  // 5. HOLOGRAPHIC SCANNER & HUD BRACKETS
  // ==========================================
  // Sweeping Laser Scan Plane over Die
  const scanGeom = new THREE.PlaneGeometry(2.4, 0.06);
  const scanMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  laserScanBar = new THREE.Mesh(scanGeom, scanMat);
  laserScanBar.rotation.x = Math.PI / 2;
  laserScanBar.position.y = pcbHeight / 2 + 0.28;
  processorGroup.add(laserScanBar);

  // Floating Cyber HUD Corner Brackets
  const hudBoxGeom = new THREE.BoxGeometry(2.6, 0.4, 2.6);
  const hudEdges = new THREE.EdgesGeometry(hudBoxGeom);
  const hudMat = new THREE.LineBasicMaterial({
    color: 0xd4d4d8,
    transparent: true,
    opacity: 0.25,
  });
  hudBrackets = new THREE.LineSegments(hudEdges, hudMat);
  hudBrackets.position.y = pcbHeight / 2 + 0.35;
  processorGroup.add(hudBrackets);

  // Ambient Silicon Micro-Data Particles
  const particleCount = isMobile ? 120 : 250;
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
    opacity: 0.5,
  });
  dustParticles = new THREE.Points(particleGeom, dustMat);
  scene.add(dustParticles);

  // Initial Position in Hero Section
  processorGroup.position.set(isMobile ? 0 : 2.6, isMobile ? 0.6 : 0.1, isMobile ? -3.4 : 0.3);

  // Event Listeners
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('click', handleClick, { passive: true });
  window.addEventListener('resize', handleResize);
  updateScrollProgress();

  // Animation Loop with 60fps Smooth Damping
  const clock = new THREE.Clock();

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (!processorGroup || !scene || !camera || !renderer) return;

    const elapsedTime = clock.getElapsedTime();

    // Smooth scroll interpolation (damping lerp)
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.06;
    const wp = interpolateScroll(scrollProgress);

    // Apply target position with subtle mouse parallax
    const pX = isMobile ? wp.x : wp.x + mouseX * 0.35;
    const pY = isMobile ? wp.y : wp.y + mouseY * 0.25;

    processorGroup.position.x += (pX - processorGroup.position.x) * 0.08;
    processorGroup.position.y += (pY - processorGroup.position.y) * 0.08;
    processorGroup.position.z += (wp.z - processorGroup.position.z) * 0.08;

    // Overclock Energy Burst Decay
    overclockEnergy += (0 - overclockEnergy) * 0.05;
    const baseScale = wp.scale * (1.0 + overclockEnergy * 0.15);
    const currScale = processorGroup.scale.x;
    const nextScale = currScale + (baseScale - currScale) * 0.08;
    processorGroup.scale.set(nextScale, nextScale, nextScale);

    // Isometric Rotation with Smooth Gimbal Tilt
    const rotY = wp.rotY + (isMobile ? 0 : mouseX * 0.22);
    const rotX = wp.rotX + (isMobile ? 0 : -mouseY * 0.18);
    processorGroup.rotation.y += (rotY - processorGroup.rotation.y) * 0.08;
    processorGroup.rotation.x += (rotX - processorGroup.rotation.x) * 0.08;

    // 1. Logic Cores Pulsing Computation Glow
    logicCores.forEach((core, cIdx) => {
      const pulseRate = 3.5 + cIdx * 0.6;
      const baseEmission = 0.45 + Math.sin(elapsedTime * pulseRate) * 0.25;
      const totalEmission = baseEmission + overclockEnergy * 1.5;
      (core.material as THREE.MeshStandardMaterial).emissiveIntensity = totalEmission;
    });

    // 2. Holographic Laser Scanner Sweep across Die
    if (laserScanBar) {
      const scanPos = Math.sin(elapsedTime * 1.8) * 1.05;
      laserScanBar.position.z = scanPos;
      // Pulse scanline opacity
      (laserScanBar.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.cos(elapsedTime * 3.6) * 0.35;
    }

    // 3. Floating HUD Brackets Micro-Float
    if (hudBrackets) {
      hudBrackets.position.y = (pcbHeight / 2 + 0.35) + Math.sin(elapsedTime * 2.2) * 0.04;
    }

    // 4. Data Photons Racing Along Circuit Bus Traces
    circuitBuses.forEach((bus) => {
      bus.pulses.forEach((pulse) => {
        pulse.progress = (pulse.progress + pulse.speed * 0.016) % 1.0;
        
        // Piecewise linear interpolation along the route points
        const numSegments = bus.points.length - 1;
        const segmentIndex = Math.min(Math.floor(pulse.progress * numSegments), numSegments - 1);
        const segmentT = (pulse.progress * numSegments) - segmentIndex;
        
        const p1 = bus.points[segmentIndex];
        const p2 = bus.points[segmentIndex + 1];
        if (p1 && p2) {
          pulse.mesh.position.lerpVectors(p1, p2, segmentT);
        }
      });
    });

    // 5. Space Dust Drift
    if (dustParticles) {
      dustParticles.rotation.y = elapsedTime * 0.018 + scrollProgress * 0.6;
      dustParticles.rotation.x = Math.sin(elapsedTime * 0.2) * 0.04;
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

  // Complete cleanup: dispose all WebGL geometries, materials, and renderer
  if (processorGroup) {
    processorGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh || (child as THREE.Points).isPoints || (child as THREE.Line).isLine) {
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
