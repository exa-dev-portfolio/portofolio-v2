<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    imageFile: File | null;
    initialAspectRatio?: number; // default 16/9
    targetWidth?: number; // default 1280
    targetHeight?: number; // default 720
    quality?: number; // default 0.85
  }>(),
  {
    initialAspectRatio: 16 / 9,
    targetWidth: 1280,
    targetHeight: 720,
    quality: 0.85,
  },
);

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (
    e: "crop-success",
    result: {
      file: File;
      previewUrl: string;
      originalSize: number;
      compressedSize: number;
    },
  ): void;
}>();

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit("update:open", val),
});

// Aspect ratio presets
const aspectRatios = [
  { label: "16:9 Banner (Standard)", value: 16 / 9, w: 1280, h: 720 },
  { label: "4:3 Classic", value: 4 / 3, w: 1200, h: 900 },
  { label: "1:1 Square", value: 1, w: 800, h: 800 },
];

const selectedRatio = ref(props.initialAspectRatio);
const currentTargetW = ref(props.targetWidth);
const currentTargetH = ref(props.targetHeight);

// Image and Canvas State
const imageSrc = ref<string>("");
const imgElement = ref<HTMLImageElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isProcessing = ref(false);

// Crop Box Dimensions in Viewport (pixels)
const cropBoxW = ref(480);
const cropBoxH = ref(270);
const baseScale = ref(1);

// Transform state (Pan & Zoom)
const zoom = ref(1);
const minZoom = ref(0.2);
const maxZoom = ref(4.0);
const panX = ref(0);
const panY = ref(0);
const isDragging = ref(false);
const startDragX = ref(0);
const startDragY = ref(0);

// Load image when imageFile changes
watch(
  () => props.imageFile,
  (newFile) => {
    if (!newFile) {
      imageSrc.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imageSrc.value = e.target?.result as string;
      nextTick(() => {
        initImage();
      });
    };
    reader.readAsDataURL(newFile);
  },
  { immediate: true },
);

// Recalculate crop box whenever modal opens or aspect ratio changes
watch(
  () => props.open,
  (isOpenVal) => {
    if (isOpenVal) {
      nextTick(() => {
        updateCropBoxAndFit(true);
      });
    }
  },
);

const setAspectRatio = (item: (typeof aspectRatios)[0]) => {
  selectedRatio.value = item.value;
  currentTargetW.value = item.w;
  currentTargetH.value = item.h;
  updateCropBoxAndFit(true);
};

const initImage = () => {
  if (!imageSrc.value) return;
  const img = new Image();
  img.onload = () => {
    imgElement.value = img;
    updateCropBoxAndFit(true);
  };
  img.src = imageSrc.value;
};

// Calculate crop box size inside viewport
const updateCropBoxAndFit = (autoFit = true) => {
  if (!containerRef.value) return;
  const containerW = containerRef.value.clientWidth || 560;
  const containerH = containerRef.value.clientHeight || 360;

  const padding = 24;
  const maxW = containerW - padding * 2;
  const maxH = containerH - padding * 2;

  let w = maxW;
  let h = w / selectedRatio.value;

  if (h > maxH) {
    h = maxH;
    w = h * selectedRatio.value;
  }

  cropBoxW.value = Math.round(w);
  cropBoxH.value = Math.round(h);

  if (imgElement.value) {
    const imgW = imgElement.value.naturalWidth || 1;
    const imgH = imgElement.value.naturalHeight || 1;
    // Base scale is Fit (contain entire image in crop box)
    baseScale.value = Math.min(cropBoxW.value / imgW, cropBoxH.value / imgH);
  } else {
    baseScale.value = 1;
  }

  if (autoFit) {
    fitFullImage();
  }
};

// Presets
const fitFullImage = () => {
  zoom.value = 1; // zoom=1 means fit whole image
  panX.value = 0;
  panY.value = 0;
};

const fillCoverImage = () => {
  if (!imgElement.value || !baseScale.value) return;
  const imgW = imgElement.value.naturalWidth || 1;
  const imgH = imgElement.value.naturalHeight || 1;
  const coverScale = Math.max(cropBoxW.value / imgW, cropBoxH.value / imgH);
  zoom.value = Number((coverScale / baseScale.value).toFixed(2));
  panX.value = 0;
  panY.value = 0;
};

const resetTransform = () => {
  fitFullImage();
};

// Drag / Pan handlers
const onMouseDown = (e: MouseEvent) => {
  isDragging.value = true;
  startDragX.value = e.clientX - panX.value;
  startDragY.value = e.clientY - panY.value;
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  panX.value = e.clientX - startDragX.value;
  panY.value = e.clientY - startDragY.value;
};

const onMouseUp = () => {
  isDragging.value = false;
};

// Touch support
const onTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1 && e.touches[0]) {
    isDragging.value = true;
    startDragX.value = e.touches[0].clientX - panX.value;
    startDragY.value = e.touches[0].clientY - panY.value;
  }
};

const onTouchMove = (e: TouchEvent) => {
  if (!isDragging.value || e.touches.length !== 1 || !e.touches[0]) return;
  panX.value = e.touches[0].clientX - startDragX.value;
  panY.value = e.touches[0].clientY - startDragY.value;
};

const onTouchEnd = () => {
  isDragging.value = false;
};

// Mouse wheel zoom
const onWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.05 : 0.05;
  const nextZoom = Math.min(Math.max(zoom.value + delta, minZoom.value), maxZoom.value);
  zoom.value = Number(nextZoom.toFixed(2));
};

// Helper: Format file size in KB or MB
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Perform Crop & WebP Compression
const applyCrop = async () => {
  if (!imgElement.value || !containerRef.value || !props.imageFile) return;

  isProcessing.value = true;
  try {
    const containerW = containerRef.value.clientWidth;
    const containerH = containerRef.value.clientHeight;

    // Target output dimensions
    const outputW = currentTargetW.value;
    const outputH = currentTargetH.value;

    const canvas = document.createElement("canvas");
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not initialize 2D canvas context");
    }

    // Fill background with elegant dark background (#090e1a) so letterbox looks integrated with dark theme
    ctx.fillStyle = "#090e1a";
    ctx.fillRect(0, 0, outputW, outputH);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Crop box in container space (centered)
    const cropBoxX = (containerW - cropBoxW.value) / 2;
    const cropBoxY = (containerH - cropBoxH.value) / 2;

    // Rendered image size on screen
    const effectiveW = (imgElement.value.naturalWidth * baseScale.value) * zoom.value;
    const effectiveH = (imgElement.value.naturalHeight * baseScale.value) * zoom.value;

    // Rendered image position on screen
    const imgCenterX = containerW / 2 + panX.value;
    const imgCenterY = containerH / 2 + panY.value;
    const imgLeft = imgCenterX - effectiveW / 2;
    const imgTop = imgCenterY - effectiveH / 2;

    // Scale from screen crop box to output canvas
    const scaleToOutput = outputW / cropBoxW.value;

    // Projected position on output canvas
    const canvasImgLeft = (imgLeft - cropBoxX) * scaleToOutput;
    const canvasImgTop = (imgTop - cropBoxY) * scaleToOutput;
    const canvasImgW = effectiveW * scaleToOutput;
    const canvasImgH = effectiveH * scaleToOutput;

    // Clip to canvas bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, outputW, outputH);
    ctx.clip();

    ctx.drawImage(
      imgElement.value,
      canvasImgLeft,
      canvasImgTop,
      canvasImgW,
      canvasImgH,
    );
    ctx.restore();

    // Convert to WebP with compression
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", props.quality);
    });

    if (!blob) {
      throw new Error("Canvas WebP conversion failed");
    }

    const cleanBaseName = props.imageFile.name
      .replace(/\.[^/.]+$/, "")
      .replace(/\s+/g, "-");
    const webpFileName = `${cleanBaseName}.webp`;
    const webpFile = new File([blob], webpFileName, { type: "image/webp" });
    const previewUrl = URL.createObjectURL(blob);

    emit("crop-success", {
      file: webpFile,
      previewUrl,
      originalSize: props.imageFile.size,
      compressedSize: blob.size,
    });

    isOpen.value = false;
  } catch (err) {
    console.error("Error cropping image:", err);
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      content:
        'w-full max-w-2xl bg-[#090e1a] border border-white/15 shadow-2xl rounded-3xl overflow-hidden',
      header: 'p-5 bg-[#0c1424] border-b border-white/10',
      body: 'p-5 sm:p-6',
      footer:
        'p-4 sm:p-5 bg-[#0c1424] border-t border-white/10 flex items-center justify-between',
    }"
  >
    <template #title>
      <div class="flex items-center gap-2.5">
        <div
          class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400"
        >
          <Icon name="carbon:crop" size="18" />
        </div>
        <div>
          <h2 class="text-base sm:text-lg font-heading font-bold text-white">
            Crop & Optimize Image
          </h2>
          <p class="text-xs text-slate-400 font-mono">
            Standardize dimensions (16:9) and convert to WebP
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <!-- Aspect Ratio Selection & Presets -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-mono text-slate-300 mr-1">Preset:</span>
            <button
              v-for="ratio in aspectRatios"
              :key="ratio.label"
              type="button"
              @click="setAspectRatio(ratio)"
              class="px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer"
              :class="
                selectedRatio === ratio.value
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              "
            >
              {{ ratio.label.split(' ')[0] }}
            </button>
          </div>

          <!-- Quick Fit / Fill Buttons -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              @click="fitFullImage"
              class="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 transition-colors cursor-pointer"
              title="Show entire image without cropping"
            >
              <Icon name="carbon:fit-to-screen" size="13" />
              <span>Fit Full</span>
            </button>
            <button
              type="button"
              @click="fillCoverImage"
              class="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
              title="Cover the entire crop frame"
            >
              <Icon name="carbon:maximize" size="13" />
              <span>Fill</span>
            </button>
          </div>
        </div>

        <!-- Interactive Crop Viewport -->
        <div
          ref="containerRef"
          class="relative w-full h-80 sm:h-96 rounded-2xl bg-slate-950 border border-white/10 overflow-hidden select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          @wheel="onWheel"
        >
          <!-- Underlying image -->
          <img
            v-if="imageSrc && imgElement"
            :src="imageSrc"
            alt="Source preview"
            class="absolute pointer-events-none select-none max-w-none transition-transform duration-75"
            :style="{
              width: `${(imgElement.naturalWidth || 1) * baseScale}px`,
              height: `${(imgElement.naturalHeight || 1) * baseScale}px`,
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }"
          />

          <!-- Crop Overlay Mask & Grid -->
          <div
            class="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div
              class="relative border-2 border-blue-400/80 shadow-[0_0_0_9999px_rgba(5,10,20,0.78)] rounded-lg transition-all duration-200"
              :style="{
                width: `${cropBoxW}px`,
                height: `${cropBoxH}px`,
              }"
            >
              <!-- 3x3 Rule-of-thirds grid lines -->
              <div class="absolute inset-0 grid grid-cols-3 pointer-events-none">
                <div class="border-r border-white/20"></div>
                <div class="border-r border-white/20"></div>
                <div></div>
              </div>
              <div class="absolute inset-0 grid grid-rows-3 pointer-events-none">
                <div class="border-b border-white/20"></div>
                <div class="border-b border-white/20"></div>
                <div></div>
              </div>

              <!-- Corner handles -->
              <span
                class="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-blue-400 bg-blue-500"
              ></span>
              <span
                class="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-blue-400 bg-blue-500"
              ></span>
              <span
                class="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-blue-400 bg-blue-500"
              ></span>
              <span
                class="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-blue-400 bg-blue-500"
              ></span>
            </div>
          </div>

          <!-- Drag instruction hint -->
          <div
            class="absolute bottom-3 inset-x-0 text-center pointer-events-none"
          >
            <span
              class="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[11px] font-mono text-slate-300"
            >
              Drag to reposition · Scroll or slider to zoom
            </span>
          </div>
        </div>

        <!-- Controls: Zoom & Info -->
        <div
          class="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
        >
          <div class="flex items-center gap-2 flex-1 min-w-[200px]">
            <Icon
              name="carbon:zoom-out"
              size="16"
              class="text-slate-400 shrink-0"
            />
            <input
              type="range"
              :min="minZoom"
              :max="maxZoom"
              step="0.02"
              v-model.number="zoom"
              class="w-full accent-blue-500 cursor-pointer"
            />
            <Icon
              name="carbon:zoom-in"
              size="16"
              class="text-slate-400 shrink-0"
            />
            <span class="text-xs font-mono text-slate-300 w-12 text-right">
              {{ Math.round(zoom * 100) }}%
            </span>
          </div>

          <div class="flex items-center gap-2.5">
            <button
              type="button"
              @click="resetTransform"
              class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Icon name="carbon:reset" size="13" />
              <span>Reset</span>
            </button>

            <span class="text-xs font-mono text-blue-400">
              {{ currentTargetW }} × {{ currentTargetH }} px (WebP)
            </span>
          </div>
        </div>

        <!-- File Size Preview -->
        <div
          v-if="props.imageFile"
          class="flex items-center justify-between text-xs font-mono text-slate-400 px-1"
        >
          <span
            >Original:
            <strong class="text-slate-200">{{
              formatSize(props.imageFile.size)
            }}</strong></span
          >
          <span class="text-emerald-400 flex items-center gap-1">
            <Icon name="carbon:flash" size="13" />
            <span>Output: 16:9 WebP Optimized</span>
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        @click="
          () => {
            isOpen = false;
          }
        "
        class="text-slate-400 hover:text-white cursor-pointer"
      >
        Cancel
      </UButton>

      <UButton
        color="primary"
        size="sm"
        :loading="isProcessing"
        @click="applyCrop"
        class="rounded-xl px-5 font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-2"
      >
        <Icon name="carbon:checkmark" size="16" />
        <span>Apply & Convert to WebP</span>
      </UButton>
    </template>
  </UModal>
</template>
