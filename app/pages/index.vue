<script setup lang="ts">
// ========== IMPORTS ==========
import { computed, onMounted, ref, nextTick } from "vue";
import type { Skill, SkillsResponse } from "~/types/skill";
import ScrollTechMesh from "~/components/3d/ScrollTechMesh.client.vue";
import NordicHero from "~/components/nordic/NordicHero.vue";
import NordicProjects from "~/components/nordic/NordicProjects.vue";
import NordicStack from "~/components/nordic/NordicStack.vue";
import NordicExperience from "~/components/nordic/NordicExperience.vue";
import NordicContact from "~/components/nordic/NordicContact.vue";
import NordicFooter from "~/components/nordic/NordicFooter.vue";
import type { JourneysResponse } from "~/types/journey";
import type { ProjectsResponse } from "~/types/project";
import type { UserSettingsModel } from "~/types/settings";

// ========== PAGE METADATA ==========
definePageMeta({
  layout: "default",
});

// SEO Configuration
const siteUrl = "https://eka-dev.cloud";
const siteName = "Eka Syafrino - Full Stack Developer & System Architect";
const siteDescription =
  "Moh. Eka Syafrino - Full Stack Developer & System Architect specializing in Vue/Nuxt, React, Golang, Node.js, and Flutter. Building high-concurrency microservices, fluid reactive applications, and cross-platform mobile solutions.";
const authorName = "Moh. Eka Syafrino";
const ogImage = `${siteUrl}/images/og-image.png`;

// ========== FETCH DATA FROM API (SSR dynamic) ==========
// In Nuxt, internal API routes (/api/*) are automatically resolved in-memory during SSR
// and via relative URLs on the client, avoiding external HTTP network loops.
const { data: projectsData, pending: projectsLoading, refresh: refreshProjects } = await useFetch<
  BaseResponse<ProjectsResponse>
>("/api/projects", {
  query: {
    pagination: false,
    status: true,
  },
  watch: false,
});

const { data: skillsData, pending: skillsLoading } = await useFetch<
  BaseResponse<SkillsResponse>
>("/api/skills", {
  query: {
    pagination: false,
  },
  watch: false,
});

const { data: journeysData, pending: journeysLoading } = await useFetch<
  BaseResponse<JourneysResponse>
>("/api/journeys", {
  query: {
    pagination: false,
  },
  watch: false,
});

const { data: dataUser, pending: loadingUser } = await useFetch<
  BaseResponse<UserSettingsModel>
>("/api/settings", {
  watch: false,
});

// ========== COMPUTED DATA ==========
const user = computed(() => dataUser.value?.data);

const projects = computed(() => {
  const apiProjects = projectsData.value?.data?.data ?? [];

  // Map API projects to expected format for components (filter only published/active projects)
  return apiProjects
    .filter((p) => p.status === 'published' || p.status === true)
    .map((p) => ({
      ...p,
      id: p.id,
      title: p.name,
      shortDesc: p.description || "",
      description: p.description || "",
      image: p.preview_image || "/images/project-preview.webp",
      preview_images: p.preview_images || [],
      technologies: p.technologies || [],
      link: p.repo_url,
      liveUrl: p.live_url,
      details: p.description,
      features: p.features || [],
      is_organization: Boolean(p.is_organization),
      github_org: p.github_org || null,
      sub_apps: p.sub_apps || [],
    }));
});

const skills = computed(() => {
  return (skillsData.value?.data?.data ?? []) as Skill[];
});

const isLoading = computed(
  () => projectsLoading.value || skillsLoading.value || journeysLoading.value,
);

// ========== EXPERIENCE DATA dari API ==========
const experiences = computed(() => {
  const journeys = journeysData.value?.data?.data ?? [];

  // Map API journeys to experiences format
  return journeys.map((journey) => ({
    id: journey.id,
    company: journey.company,
    position: journey.title,
    period: journey.is_current
      ? `${formatDate(journey.start_date)} - Present`
      : `${formatDate(journey.start_date)} - ${formatDate(journey.end_date)}`,
    description: journey.description || "",
    logo: "https://via.placeholder.com/80",
    responsibilities: journey.key_responsibilities || [],
    technologies: journey.skills || [],
    attachment: journey.attachments || null,
  }));
});

useHead(() => ({
  title: `${siteName} | Software Engineer & Solutions Architect`,
  htmlAttrs: {
    lang: "en",
  },
  meta: [
    // Primary Meta Tags
    {
      name: "title",
      content: `${siteName} | Software Engineer & Solutions Architect`,
    },
    {
      name: "description",
      content: siteDescription,
    },
    {
      name: "keywords",
      content:
        "Moh. Eka Syafrino, Eka Syafrino, Full Stack Developer, Software Engineer, System Architect, Vue.js Developer, Nuxt.js, React Developer, Node.js, Golang Developer, Flutter Developer, Mobile App Development, Web Development, TypeScript, Kubernetes, DevOps, CI/CD, PostgreSQL, Cloud Architecture, REST API",
    },
    {
      name: "author",
      content: authorName,
    },
    {
      name: "robots",
      content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    {
      name: "googlebot",
      content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },

    // Open Graph / Facebook / LinkedIn
    {
      property: "og:type",
      content: "profile",
    },
    {
      property: "og:url",
      content: siteUrl,
    },
    {
      property: "og:site_name",
      content: siteName,
    },
    {
      property: "og:title",
      content: "Eka Syafrino - Full Stack Developer & System Architect",
    },
    {
      property: "og:description",
      content: siteDescription,
    },
    {
      property: "og:image",
      content: ogImage,
    },
    {
      property: "og:image:secure_url",
      content: ogImage,
    },
    {
      property: "og:image:type",
      content: "image/png",
    },
    {
      property: "og:image:width",
      content: "1200",
    },
    {
      property: "og:image:height",
      content: "630",
    },
    {
      property: "og:image:alt",
      content: "Eka Syafrino - Full Stack Developer & System Architect Portfolio",
    },
    {
      property: "og:locale",
      content: "en_US",
    },
    {
      property: "profile:first_name",
      content: "Moh. Eka",
    },
    {
      property: "profile:last_name",
      content: "Syafrino",
    },
    {
      property: "profile:username",
      content: "ESyafrino",
    },

    // Twitter Card
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:site",
      content: "@ESyafrino",
    },
    {
      name: "twitter:creator",
      content: "@ESyafrino",
    },
    {
      name: "twitter:title",
      content: "Eka Syafrino - Full Stack Developer & System Architect",
    },
    {
      name: "twitter:description",
      content: siteDescription,
    },
    {
      name: "twitter:image",
      content: ogImage,
    },
    {
      name: "twitter:image:alt",
      content: "Eka Syafrino - Full Stack Developer & System Architect Portfolio",
    },

    // Mobile PWA / UI
    {
      name: "theme-color",
      content: "#09090b",
    },
    {
      name: "msapplication-TileColor",
      content: "#09090b",
    },
    {
      name: "apple-mobile-web-app-capable",
      content: "yes",
    },
    {
      name: "apple-mobile-web-app-status-bar-style",
      content: "black-translucent",
    },
  ],
  link: [
    {
      rel: "canonical",
      href: siteUrl,
    },
    {
      rel: "icon",
      type: "image/x-icon",
      href: "/favicon.ico",
    },
    {
      rel: "icon",
      type: "image/png",
      href: "/favicon.png",
    },
    {
      rel: "icon",
      type: "image/svg+xml",
      href: "/favicon.svg",
    },
    {
      rel: "apple-touch-icon",
      href: "/favicon.png",
    },
    {
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    },
    {
      rel: "dns-prefetch",
      href: "https://fonts.googleapis.com",
    },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        dateCreated: "2024-01-01T00:00:00+07:00",
        dateModified: new Date().toISOString(),
        mainEntity: {
          "@type": "Person",
          name: authorName,
          alternateName: "Eka Syafrino",
          url: siteUrl,
          image: ogImage,
          jobTitle: "Full Stack Developer & System Architect",
          description: siteDescription,
          knowsAbout: skills.value.length ? skills.value.map((skill) => skill.name) : ["Vue.js", "Nuxt.js", "React", "Node.js", "Golang", "Flutter", "Kubernetes", "Docker", "PostgreSQL"],
          sameAs: [
            user.value?.github_profile || "https://github.com/ESyafrino",
            user.value?.linkedin_profile || "https://linkedin.com/in/eka-syafrino",
            "https://twitter.com/ESyafrino",
          ].filter(Boolean),
          worksFor: {
            "@type": "Organization",
            name: "Independent Software Consultant & Engineer",
          },
        },
      }),
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
        description: siteDescription,
        publisher: {
          "@type": "Person",
          name: authorName,
        },
      }),
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Featured Software Engineering Projects",
        itemListElement: projects.value.slice(0, 8).map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "SoftwareApplication",
            name: project.title,
            description: project.description,
            url: project.liveUrl || project.link || `${siteUrl}/#projects`,
            image: project.image.startsWith("http") ? project.image : `${siteUrl}${project.image}`,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web, Cross-Platform",
          },
        })),
      }),
    },
  ],
}));

function diffInMonths(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

const totalExperienceYears = computed(() => {
  const journeys = journeysData.value?.data?.data ?? [];
  let totalMonths = 0;

  journeys.forEach((journey) => {
    if (!journey.start_date) return;

    const start = new Date(journey.start_date);
    const end = journey.is_current
      ? new Date()
      : journey.end_date
        ? new Date(journey.end_date)
        : new Date();

    totalMonths += diffInMonths(start, end);
  });

  // convert ke tahun (1 angka desimal)
  return parseInt((totalMonths / 12).toFixed(0));
});
</script>

<template>
  <div class="relative max-w-5xl mx-auto px-4 sm:px-6 space-y-24 sm:space-y-32">
    <!-- 3D Scroll-Driven WebGL Minimalist Tech Mesh Background -->
    <ClientOnly>
      <ScrollTechMesh />
    </ClientOnly>

    <!-- 1. Hero / Introduction -->
    <div id="about" class="relative z-10 pt-2 sm:pt-4">
      <NordicHero
        :user="user"
        :project-count="projects.length"
        :experience-years="totalExperienceYears"
        :skills-count="skills.length"
      />
    </div>

    <!-- 2. Selected Projects Showcase -->
    <div id="projects" class="relative z-10">
      <NordicProjects :projects="projects" />
    </div>

    <!-- 3. Technical Stack & Tooling -->
    <div id="stack" class="relative z-10">
      <NordicStack :skills="skills" />
    </div>

    <!-- 4. Work Experience & Career -->
    <div id="experience" class="relative z-10">
      <NordicExperience :experiences="experiences" />
    </div>

    <!-- 5. Minimalist Contact Section -->
    <div id="contact" class="relative z-10">
      <NordicContact :user="user" />
    </div>

    <!-- 6. Minimalist Footer -->
    <div class="relative z-10">
      <NordicFooter />
    </div>
  </div>
</template>


