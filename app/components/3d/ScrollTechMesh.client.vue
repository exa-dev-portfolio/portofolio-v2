<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let networkGroup: THREE.Group | null = null;

// Interconnected Infrastructure Nodes
interface TopologyNode {
  mesh: THREE.Group;
  lightMesh: THREE.Mesh;
  baseY: number;
  pulsePhase: number;
  position: THREE.Vector3;
}
const nodes: TopologyNode[] = [];

// Interconnected Cables
interface NetworkCable {
  curve: THREE.CatmullRomCurve3;
  tubeMesh: THREE.Mesh;
  glowMesh: THREE.Line;
  dataPackets: {
    mesh: THREE.Mesh;
    speed: number;
    offset: number;
    color: number;
  }[];
}
const cables: NetworkCable[] = [];

// Ambient Background Dust
let dustParticles: THREE.Points | null = null;

let animationFrameId: number | null = null;
let scrollProgress = 0;
let targetScrollProgress = 0;
let mouseX = 0;
let mouseY = 0;
let isMobile = false;
let shockwaveScale = 1.0;

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
  shockwaveScale = 1.25;
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
    targetZ = -3.2;
    targetScale = 0.65;
    targetRotY = p * 0.8;
    targetRotX = 0.2;
    return { x: targetX, y: targetY, z: targetZ, scale: targetScale, rotY: targetRotY, rotX: targetRotX };
  }

  if (p < 0.25) {
    // Phase 1: Hero (Framed on the Right Column)
    const t = p / 0.25;
    targetX = 2.5 + (-2.2 - 2.5) * easeInOutCubic(t);
    targetY = 0.1 + (0.3 - 0.1) * t;
    targetZ = 0.2 + (0.8 - 0.2) * easeInOutCubic(t);
    targetScale = 1.05 + (1.15 - 1.05) * t;
    targetRotY = t * 0.5;
    targetRotX = 0.15 + t * 0.1;
  } else if (p < 0.50) {
    // Phase 2: Projects Showcase (Centered / Unfolding Cluster)
    const t = (p - 0.25) / 0.25;
    targetX = -2.2 + (0.2 - -2.2) * easeInOutCubic(t);
    targetY = 0.3 + (-0.2 - 0.3) * t;
    targetZ = 0.8 + (-0.5 - 0.8) * easeInOutCubic(t);
    targetScale = 1.15 + (0.95 - 1.15) * t;
    targetRotY = 0.5 + (-0.2 - 0.5) * t;
    targetRotX = 0.25 - t * 0.1;
  } else if (p < 0.75) {
    // Phase 3: Technical Stack (Right Perspective Matrix)
    const t = (p - 0.50) / 0.25;
    targetX = 0.2 + (2.2 - 0.2) * easeInOutCubic(t);
    targetY = -0.2 + (0.1 - -0.2) * t;
    targetZ = -0.5 + (-1.2 - -0.5) * easeInOutCubic(t);
    targetScale = 0.95 + (1.08 - 0.95) * t;
    targetRotY = -0.2 + (0.4 - -0.2) * t;
    targetRotX = 0.15;
  } else {
    // Phase 4: Contact & Horizon
    const t = (p - 0.75) / 0.25;
    targetX = 2.2 + (1.5 - 2.2) * easeInOutCubic(t);
    targetY = 0.1 + (-0.5 - 0.1) * t;
    targetZ = -1.2 + (-3.2 - -1.2) * easeInOutCubic(t);
    targetScale = 1.08 + (1.35 - 1.08) * t;
    targetRotY = 0.4 + (0.8 - 0.4) * t;
    targetRotX = 0.2;
  }

  return { x: targetX, y: targetY, z: targetZ, scale: targetScale, rotY: targetRotY, rotX: targetRotX };
}

onMounted(() => {
  if (!canvasRef.value) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  isMobile = width < 768;

  // Scene setup with background fog matching Nordic theme (#09090b)
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x09090b, 0.042);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 8.2);

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Studio Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const mainLight = new THREE.PointLight(0xffffff, 3.0, 40);
  mainLight.position.set(6, 6, 6);
  scene.add(mainLight);

  const fillLight = new THREE.PointLight(0xd4d4d8, 2.2, 35);
  fillLight.position.set(-6, -4, 4);
  scene.add(fillLight);

  const backGlow = new THREE.PointLight(0x71717a, 1.8, 30);
  backGlow.position.set(0, -5, -4);
  scene.add(backGlow);

  // Group container for all 3D topology elements
  networkGroup = new THREE.Group();
  scene.add(networkGroup);

  // 1. Definition of Network Topology Nodes (Microservices, DBs, Gateway)
  const nodeDefinitions = [
    { name: 'Gateway / Ingress', pos: new THREE.Vector3(0, 1.5, 0.2), color: 0xffffff, scale: 1.15 },
    { name: 'Go Microservice A', pos: new THREE.Vector3(-1.8, 0.5, 0.9), color: 0xd4d4d8, scale: 1.0 },
    { name: 'API Cluster B', pos: new THREE.Vector3(1.9, 0.4, -0.3), color: 0xd4d4d8, scale: 1.0 },
    { name: 'PostgreSQL Primary', pos: new THREE.Vector3(-1.3, -1.3, -0.5), color: 0xa1a1aa, scale: 1.05 },
    { name: 'Redis Cache Ring', pos: new THREE.Vector3(1.4, -1.4, 0.6), color: 0xffffff, scale: 0.95 },
    { name: 'Event Stream / Queue', pos: new THREE.Vector3(0.1, -1.9, -0.9), color: 0x71717a, scale: 1.0 },
    { name: 'Cloud Mesh Satellite', pos: new THREE.Vector3(0.8, 2.0, -0.8), color: 0xa1a1aa, scale: 0.9 },
  ];

  nodes.length = 0;
  nodeDefinitions.forEach((def, idx) => {
    const nodeObj = new THREE.Group();
    nodeObj.position.copy(def.pos);

    // Node Server Chassis (Faceted Hexagonal / Octagonal Hub)
    const chassisGeom = new THREE.CylinderGeometry(0.24 * def.scale, 0.28 * def.scale, 0.18 * def.scale, 8);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.9,
      roughness: 0.25,
      emissive: 0x101014,
    });
    const chassisMesh = new THREE.Mesh(chassisGeom, chassisMat);
    chassisMesh.rotation.x = Math.PI / 6;
    nodeObj.add(chassisMesh);

    // Glowing Status Collar / Rim
    const collarGeom = new THREE.TorusGeometry(0.32 * def.scale, 0.018, 8, 32);
    const collarMat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.75,
    });
    const collarMesh = new THREE.Mesh(collarGeom, collarMat);
    collarMesh.rotation.x = Math.PI / 2;
    nodeObj.add(collarMesh);

    // Pulsing LED Core (Network Heartbeat)
    const ledGeom = new THREE.SphereGeometry(0.08 * def.scale, 12, 12);
    const ledMat = new THREE.MeshBasicMaterial({
      color: def.color,
    });
    const ledMesh = new THREE.Mesh(ledGeom, ledMat);
    ledMesh.position.y = 0.12 * def.scale;
    nodeObj.add(ledMesh);

    networkGroup?.add(nodeObj);
    nodes.push({
      mesh: nodeObj,
      lightMesh: ledMesh,
      baseY: def.pos.y,
      pulsePhase: idx * 0.8,
      position: def.pos,
    });
  });

  // 2. Interconnected Cables (Physical Catmull-Rom 3D Fiber Tubes)
  const connections = [
    { from: 0, to: 1, sag: 0.35, color: 0xffffff }, // Gateway -> Go Microservice A
    { from: 0, to: 2, sag: 0.42, color: 0xd4d4d8 }, // Gateway -> API Cluster B
    { from: 1, to: 3, sag: 0.50, color: 0xffffff }, // Microservice A -> PostgreSQL
    { from: 1, to: 4, sag: 0.38, color: 0xd4d4d8 }, // Microservice A -> Redis
    { from: 2, to: 5, sag: 0.45, color: 0xa1a1aa }, // API Cluster B -> Event Stream
    { from: 5, to: 3, sag: 0.32, color: 0x71717a }, // Event Stream -> PostgreSQL
    { from: 6, to: 0, sag: 0.28, color: 0xffffff }, // Cloud Satellite -> Gateway
    { from: 6, to: 2, sag: 0.40, color: 0xd4d4d8 }, // Cloud Satellite -> API B
    { from: 1, to: 2, sag: 0.65, color: 0xffffff }, // Cross-Cluster Pod Link (A <-> B)
    { from: 3, to: 4, sag: 0.45, color: 0xa1a1aa }, // DB <-> Redis Sync
  ];

  cables.length = 0;
  connections.forEach((conn, cIdx) => {
    const p1 = nodes[conn.from].position;
    const p2 = nodes[conn.to].position;

    // Realistic Cable Sag (catenary physics midpoint)
    const mid = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
    mid.y -= conn.sag;
    mid.z += (cIdx % 2 === 0 ? 0.2 : -0.25);

    const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);

    // Outer Physical Cable Tube (Dark Titanium Shielding)
    const tubeGeom = new THREE.TubeGeometry(curve, 48, 0.038, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x141417,
      roughness: 0.35,
      metalness: 0.85,
      emissive: 0x09090b,
    });
    const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
    networkGroup?.add(tubeMesh);

    // Glowing Optical Centerline (Fiber-Optic Core)
    const points = curve.getPoints(48);
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: conn.color,
      transparent: true,
      opacity: 0.35,
    });
    const glowLine = new THREE.Line(lineGeom, lineMat);
    networkGroup?.add(glowLine);

    // Flowing Data Packets (Glowing Light Pulses Traveling the Cable)
    const packetCount = isMobile ? 1 : 2;
    const packets = [];
    for (let p = 0; p < packetCount; p++) {
      const packetGeom = new THREE.SphereGeometry(0.052, 8, 8);
      const packetMat = new THREE.MeshBasicMaterial({
        color: conn.color,
      });
      const packetMesh = new THREE.Mesh(packetGeom, packetMat);
      networkGroup?.add(packetMesh);
      packets.push({
        mesh: packetMesh,
        speed: 0.45 + (cIdx % 3) * 0.15,
        offset: p * 0.5 + (cIdx * 0.18),
        color: conn.color,
      });
    }

    cables.push({
      curve,
      tubeMesh,
      glowMesh: glowLine,
      dataPackets: packets,
    });
  });

  // 3. Ambient Ambient Data Dust Field
  const particleCount = isMobile ? 100 : 220;
  const particleGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 22;
    positions[i + 1] = (Math.random() - 0.5) * 18;
    positions[i + 2] = (Math.random() - 0.5) * 14;
  }
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xd4d4d8,
    size: 0.035,
    transparent: true,
    opacity: 0.45,
  });
  dustParticles = new THREE.Points(particleGeom, dustMat);
  scene.add(dustParticles);

  // Initial position in Hero Section
  networkGroup.position.set(isMobile ? 0 : 2.5, isMobile ? 0.6 : 0.1, isMobile ? -3.2 : 0.2);

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
    if (!networkGroup || !scene || !camera || !renderer) return;

    const elapsedTime = clock.getElapsedTime();

    // Smooth scroll interpolation (damping lerp)
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.06;
    const wp = interpolateScroll(scrollProgress);

    // Apply target position with subtle mouse parallax
    const pX = isMobile ? wp.x : wp.x + mouseX * 0.32;
    const pY = isMobile ? wp.y : wp.y + mouseY * 0.22;

    networkGroup.position.x += (pX - networkGroup.position.x) * 0.08;
    networkGroup.position.y += (pY - networkGroup.position.y) * 0.08;
    networkGroup.position.z += (wp.z - networkGroup.position.z) * 0.08;

    // Shockwave pulse decay
    shockwaveScale += (1.0 - shockwaveScale) * 0.08;
    const currentScale = networkGroup.scale.x;
    const baseTargetScale = wp.scale * shockwaveScale;
    const nextScale = currentScale + (baseTargetScale - currentScale) * 0.08;
    networkGroup.scale.set(nextScale, nextScale, nextScale);

    // Continuous Cluster Rotation
    const baseRotY = elapsedTime * 0.12 + wp.rotY;
    const baseRotX = wp.rotX + (isMobile ? 0 : mouseY * 0.12);
    networkGroup.rotation.y = baseRotY;
    networkGroup.rotation.x = baseRotX;

    // Pulse Node LEDs & Micro-float
    nodes.forEach((node) => {
      const pulse = 0.8 + Math.sin(elapsedTime * 3.5 + node.pulsePhase) * 0.4;
      node.lightMesh.scale.set(pulse, pulse, pulse);
      node.mesh.position.y = node.baseY + Math.sin(elapsedTime * 1.5 + node.pulsePhase) * 0.04;
    });

    // Animate Flowing Data Packets on each cable
    cables.forEach((cable) => {
      cable.dataPackets.forEach((pkt) => {
        const t = (elapsedTime * pkt.speed + pkt.offset) % 1.0;
        const pt = cable.curve.getPointAt(t);
        pkt.mesh.position.copy(pt);

        // Flash packet scale as it approaches midpoint
        const pulseScale = 0.9 + Math.sin(t * Math.PI) * 0.45;
        pkt.mesh.scale.set(pulseScale, pulseScale, pulseScale);
      });
    });

    // Ambient space dust drift
    if (dustParticles) {
      dustParticles.rotation.y = elapsedTime * 0.015 + scrollProgress * 0.6;
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

  // Memory cleanup: dispose all WebGL geometries, materials, and renderer
  if (networkGroup) {
    networkGroup.traverse((child) => {
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
