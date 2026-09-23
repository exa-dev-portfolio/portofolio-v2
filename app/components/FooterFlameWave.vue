<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

interface Particle {
  progress: number // 0 to 1 across screen width
  lateralOffset: number
  speed: number
  size: number
  opacity: number
  maxOpacity: number
  spriteIdx: number
  wobbleSpeed: number
  wobbleAmp: number
  phase: number
}

let animationFrameId: number | null = null
let isVisible = false
let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null

// Pre-rendered offscreen particle colors for GPU blitting
const SPRITE_COLORS = [
  { inner: 'rgba(255, 255, 255, 1)', mid: 'rgba(56, 189, 248, 0.9)', outer: 'rgba(56, 189, 248, 0)' }, // Bright Cyan
  { inner: 'rgba(255, 255, 255, 1)', mid: 'rgba(96, 165, 250, 0.9)', outer: 'rgba(59, 130, 246, 0)' },  // Electric Blue
  { inner: 'rgba(255, 255, 255, 1)', mid: 'rgba(251, 191, 36, 0.95)', outer: 'rgba(245, 158, 11, 0)' },  // Fiery Amber
  { inner: 'rgba(255, 255, 255, 1)', mid: 'rgba(192, 132, 252, 0.85)', outer: 'rgba(147, 51, 234, 0)' }, // Violet Plasma
]

const PARTICLE_COUNT = 34
let particles: Particle[] = []
let particleSprites: HTMLCanvasElement[] = []

function initSprites() {
  particleSprites = SPRITE_COLORS.map((cfg) => {
    const offCanvas = document.createElement('canvas')
    const size = 32
    offCanvas.width = size
    offCanvas.height = size
    const offCtx = offCanvas.getContext('2d')
    if (offCtx) {
      const half = size / 2
      const grad = offCtx.createRadialGradient(half, half, 0, half, half, half)
      grad.addColorStop(0, cfg.inner)
      grad.addColorStop(0.3, cfg.mid)
      grad.addColorStop(1, cfg.outer)
      offCtx.fillStyle = grad
      offCtx.beginPath()
      offCtx.arc(half, half, half, 0, Math.PI * 2)
      offCtx.fill()
    }
    return offCanvas
  })
}

function createParticle(randomizeProgress = false): Particle {
  return {
    progress: randomizeProgress ? Math.random() : -0.05 - Math.random() * 0.1,
    lateralOffset: (Math.random() - 0.5) * 60,
    speed: 0.0008 + Math.random() * 0.0014,
    size: 5 + Math.random() * 12,
    opacity: 0,
    maxOpacity: 0.45 + Math.random() * 0.5,
    spriteIdx: Math.floor(Math.random() * SPRITE_COLORS.length),
    wobbleSpeed: 1.4 + Math.random() * 2.2,
    wobbleAmp: 6 + Math.random() * 14,
    phase: Math.random() * Math.PI * 2,
  }
}

function initParticles() {
  particles = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle(true))
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
  if (!ctx) return

  initSprites()
  initParticles()

  let width = 0
  let height = 0
  let dpr = 1

  // Pre-cached linear gradients along the full screen width
  let strokeGradCyan: CanvasGradient | null = null
  let strokeGradBlue: CanvasGradient | null = null
  let strokeGradAmber: CanvasGradient | null = null
  let strokeGradViolet: CanvasGradient | null = null
  let fillGradCyan: CanvasGradient | null = null
  let fillGradBlue: CanvasGradient | null = null

  function resize() {
    if (!container || !canvas || !ctx) return
    const rect = container.getBoundingClientRect()
    width = rect.width
    height = rect.height
    if (width === 0 || height === 0) return

    dpr = Math.min(window.devicePixelRatio || 1, 1.25)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)

    // Horizontal full-width gradients: enters at left, brilliant across middle, dissolves at right
    strokeGradCyan = ctx.createLinearGradient(0, 0, width, 0)
    strokeGradCyan.addColorStop(0, 'rgba(6, 182, 212, 0.1)')
    strokeGradCyan.addColorStop(0.12, 'rgba(6, 182, 212, 0.55)')
    strokeGradCyan.addColorStop(0.45, 'rgba(56, 189, 248, 0.95)')
    strokeGradCyan.addColorStop(0.82, 'rgba(59, 130, 246, 0.45)')
    strokeGradCyan.addColorStop(1, 'rgba(59, 130, 246, 0)')

    strokeGradBlue = ctx.createLinearGradient(0, 0, width, 0)
    strokeGradBlue.addColorStop(0, 'rgba(59, 130, 246, 0.08)')
    strokeGradBlue.addColorStop(0.15, 'rgba(59, 130, 246, 0.45)')
    strokeGradBlue.addColorStop(0.50, 'rgba(99, 102, 241, 0.85)')
    strokeGradBlue.addColorStop(0.85, 'rgba(147, 51, 234, 0.35)')
    strokeGradBlue.addColorStop(1, 'rgba(147, 51, 234, 0)')

    strokeGradAmber = ctx.createLinearGradient(0, 0, width, 0)
    strokeGradAmber.addColorStop(0, 'rgba(251, 191, 36, 0.05)')
    strokeGradAmber.addColorStop(0.20, 'rgba(251, 191, 36, 0.45)')
    strokeGradAmber.addColorStop(0.52, 'rgba(251, 191, 36, 0.92)')
    strokeGradAmber.addColorStop(0.80, 'rgba(56, 189, 248, 0.45)')
    strokeGradAmber.addColorStop(1, 'rgba(56, 189, 248, 0)')

    strokeGradViolet = ctx.createLinearGradient(0, 0, width, 0)
    strokeGradViolet.addColorStop(0, 'rgba(168, 85, 247, 0.05)')
    strokeGradViolet.addColorStop(0.22, 'rgba(168, 85, 247, 0.35)')
    strokeGradViolet.addColorStop(0.60, 'rgba(192, 132, 252, 0.75)')
    strokeGradViolet.addColorStop(0.90, 'rgba(59, 130, 246, 0.2)')
    strokeGradViolet.addColorStop(1, 'rgba(59, 130, 246, 0)')

    fillGradCyan = ctx.createLinearGradient(0, 0, width, 0)
    fillGradCyan.addColorStop(0, 'rgba(6, 182, 212, 0.04)')
    fillGradCyan.addColorStop(0.20, 'rgba(6, 182, 212, 0.08)')
    fillGradCyan.addColorStop(0.50, 'rgba(56, 189, 248, 0.04)')
    fillGradCyan.addColorStop(0.85, 'rgba(59, 130, 246, 0.01)')
    fillGradCyan.addColorStop(1, 'rgba(59, 130, 246, 0)')

    fillGradBlue = ctx.createLinearGradient(0, 0, width, 0)
    fillGradBlue.addColorStop(0, 'rgba(59, 130, 246, 0.03)')
    fillGradBlue.addColorStop(0.22, 'rgba(59, 130, 246, 0.06)')
    fillGradBlue.addColorStop(0.52, 'rgba(99, 102, 241, 0.03)')
    fillGradBlue.addColorStop(0.85, 'rgba(147, 51, 234, 0.01)')
    fillGradBlue.addColorStop(1, 'rgba(147, 51, 234, 0)')
  }

  resize()

  resizeObserver = new ResizeObserver(() => {
    resize()
  })
  resizeObserver.observe(container)

  let startTime = performance.now()

  // Base diagonal trajectory (flows from mid-upper left to mid-lower right)
  function getBaseY(x: number): number {
    return height * (0.38 + 0.28 * (x / (width || 1)))
  }

  // Multi-frequency harmonic wave modulation (creates smooth, natural upward crests & dips)
  function getWaveOffset(x: number, tSec: number, layer: number): number {
    const w1 = Math.sin(x * 0.0038 + tSec * (1.6 + layer * 0.25) + layer * 1.4) * (20 + layer * 3)
    const w2 = Math.sin(x * 0.0075 - tSec * (2.0 - layer * 0.2) + layer * 2.6) * (10 - layer * 1.5)
    const w3 = Math.cos(x * 0.0018 + tSec * (0.85 + layer * 0.1) + layer * 0.7) * (22 + layer * 3)
    return w1 + w2 + w3
  }

  function render(now: number) {
    if (!isVisible) return

    const tSec = (now - startTime) * 0.001

    if (!ctx || width === 0 || height === 0) {
      animationFrameId = requestAnimationFrame(render)
      return
    }

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    // Set blend mode for luminous flame/plasma wave glow
    ctx.globalCompositeOperation = 'lighter'

    // Layered Flame Wave Ribbons
    const layers = [
      {
        baseOffset: -32,
        strokeGrad: strokeGradBlue,
        fillGrad: fillGradBlue,
        bloomWidth: 10,
        coreWidth: 1.5,
        bloomAlpha: 0.18,
        coreAlpha: 0.65,
      },
      {
        baseOffset: -6,
        strokeGrad: strokeGradCyan,
        fillGrad: fillGradCyan,
        bloomWidth: 12,
        coreWidth: 2.0,
        bloomAlpha: 0.25,
        coreAlpha: 0.85,
      },
      {
        baseOffset: 18,
        strokeGrad: strokeGradAmber,
        fillGrad: null,
        bloomWidth: 8,
        coreWidth: 1.5,
        bloomAlpha: 0.20,
        coreAlpha: 0.75,
      },
      {
        baseOffset: 42,
        strokeGrad: strokeGradViolet,
        fillGrad: null,
        bloomWidth: 8,
        coreWidth: 1.2,
        bloomAlpha: 0.14,
        coreAlpha: 0.55,
      },
    ]

    const stepSize = 18 // tight horizontal sampling for buttery smooth curves
    const startX = -40
    const endX = width + 40

    layers.forEach((layer, layerIdx) => {
      if (!layer.strokeGrad) return

      ctx.beginPath()
      let isFirst = true
      let firstX = 0
      let firstY = 0
      let lastX = 0
      let lastY = 0

      for (let x = startX; x <= endX; x += stepSize) {
        const waveOffset = getWaveOffset(x, tSec, layerIdx) + layer.baseOffset
        const posX = x
        const posY = getBaseY(x) + waveOffset

        if (isFirst) {
          ctx.moveTo(posX, posY)
          firstX = posX
          firstY = posY
          isFirst = false
        } else {
          ctx.lineTo(posX, posY)
        }
        lastX = posX
        lastY = posY
      }

      // Fast multi-pass hardware-accelerated blooming (NO expensive shadowBlur)
      // Pass 1: Soft outer bloom
      ctx.globalAlpha = layer.bloomAlpha
      ctx.strokeStyle = layer.strokeGrad
      ctx.lineWidth = layer.bloomWidth
      ctx.stroke()

      // Pass 2: Bright sharp core line
      ctx.globalAlpha = layer.coreAlpha
      ctx.lineWidth = layer.coreWidth
      ctx.stroke()

      // Pass 3: Flame underbelly glow
      if (layer.fillGrad) {
        ctx.save()
        ctx.lineTo(lastX, height + 40)
        ctx.lineTo(firstX, height + 40)
        ctx.closePath()
        ctx.globalAlpha = 0.5
        ctx.fillStyle = layer.fillGrad
        ctx.fill()
        ctx.restore()
      }
    })

    // Floating Ember Sparks flowing horizontally from full left to right
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.progress += p.speed

      if (p.progress > 1.05) {
        particles[i] = createParticle(false)
        continue
      }

      // Natural sin envelope (starts softly at left, peaks at middle, fades at right)
      const envelope = Math.sin(Math.max(0, Math.min(1, p.progress)) * Math.PI)
      p.opacity = envelope * p.maxOpacity

      const posX = p.progress * width
      const waveOffset = getWaveOffset(posX, tSec, 1)
      const wobble = Math.sin(tSec * p.wobbleSpeed + p.phase) * p.wobbleAmp
      const posY = getBaseY(posX) + waveOffset + p.lateralOffset + wobble

      const sprite = particleSprites[p.spriteIdx]
      if (sprite && p.opacity > 0.01) {
        const halfSize = p.size / 2
        ctx.globalAlpha = p.opacity
        ctx.drawImage(sprite, posX - halfSize, posY - halfSize, p.size, p.size)
      }
    }

    ctx.restore()

    animationFrameId = requestAnimationFrame(render)
  }

  // Pre-warm observer with 600px rootMargin for zero scroll hitch
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      isVisible = entry.isIntersecting
      if (isVisible) {
        if (!animationFrameId) {
          startTime = performance.now()
          animationFrameId = requestAnimationFrame(render)
        }
      } else {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
      }
    },
    { threshold: 0, rootMargin: '600px 0px 600px 0px' }
  )

  observer.observe(container)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="absolute -top-16 -bottom-10 inset-x-0 pointer-events-none overflow-visible select-none z-0"
    aria-hidden="true"
  >
    <canvas ref="canvasRef" class="w-full h-full block opacity-90 transition-opacity duration-500"></canvas>
  </div>
</template>
