<script setup lang="ts">
// ========== IMPORTS ==========
import { computed, onMounted, ref, nextTick } from "vue";
import type { Skill, SkillsResponse } from "~/types/skill";
import FooterSection from "~/components/FooterSection.vue";
import ScrollTechMesh from "~/components/3d/ScrollTechMesh.client.vue";
import type { JourneysResponse } from "~/types/journey";
import type { ProjectsResponse } from "~/types/project";
import type { UserSettingsModel } from "~/types/settings";

// ========== PAGE METADATA ==========
definePageMeta({
  layout: "default",
});

// SEO Configuration
const siteUrl = "https://eka-dev.cloud"; // TODO: Update with your domain
const siteName = "Eka - Full Stack Developer Portfolio";
const siteDescription =
  "Full Stack Developer specializing in Vue.js, Nuxt.js, React, Node.js, and Golang. Building scalable web applications, mobile apps with Flutter, and cloud-native solutions with Kubernetes & Docker.";
const authorName = "Eka";
const ogImage = `${siteUrl}/images/og-image.webp`; // TODO: Create OG image

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
    .filter((p) => p.status === true)
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

useHead({
  title: "Eka - Full Stack Developer | Vue.js, React, Node.js & Mobile Expert",
  htmlAttrs: {
    lang: "en",
  },
  meta: [
    // Primary Meta Tags
    {
      name: "title",
      content:
        "Eka - Full Stack Developer | Vue.js, React, Node.js & Mobile Expert",
    },
    {
      name: "description",
      content: siteDescription,
    },
    {
      name: "keywords",
      content:
        "Full Stack Developer, Vue.js Developer, React Developer, Node.js, Golang Developer, Flutter Developer, Mobile App Development, Web Development, Nuxt.js, Next.js, TypeScript, Kubernetes, DevOps, CI/CD, PostgreSQL, MongoDB, REST API",
    },
    {
      name: "author",
      content: authorName,
    },
    {
      name: "robots",
      content: "index, follow",
    },
    {
      name: "googlebot",
      content: "index, follow",
    },

    // Open Graph / Facebook
    {
      property: "og:type",
      content: "website",
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
      content:
        "Eka - Full Stack Developer | Vue.js, React, Node.js & Mobile Expert",
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
      property: "og:image:width",
      content: "1200",
    },
    {
      property: "og:image:height",
      content: "630",
    },
    {
      property: "og:locale",
      content: "en_US",
    },

    // Twitter Card
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:site",
      content: "@ESyafrino", // TODO: Update with your Twitter handle
    },
    {
      name: "twitter:creator",
      content: "@ESyafrino", // TODO: Update with your Twitter handle
    },
    {
      name: "twitter:title",
      content:
        "Eka - Full Stack Developer | Vue.js, React, Node.js & Mobile Expert",
    },
    {
      name: "twitter:description",
      content: siteDescription,
    },
    {
      name: "twitter:image",
      content: ogImage,
    },

    // Additional SEO
    {
      name: "theme-color",
      content: "#1e7fff",
    },
    {
      name: "msapplication-TileColor",
      content: "#1e7fff",
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
      rel: "apple-touch-icon",
      href: "/favicon.ico",
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
        "@type": "Person",
        name: authorName,
        url: siteUrl,
        image: ogImage,
        jobTitle: "Full Stack Developer",
        description: siteDescription,
        knowsAbout: skills.value.map((skill) => skill.name),
        sameAs: [user.value?.github_profile, user.value?.linkedin_profile],
        worksFor: {
          "@type": "Organization",
          name: "Freelance Developer",
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
        author: {
          "@type": "Person",
          name: authorName,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/?s={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }),
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: projects.value.slice(0, 6).map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: project.title,
            description: project.description,
            url: project.liveUrl || project.link,
            image: project.image,
          },
        })),
      }),
    },
  ],
});

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
  <div class="relative">
    <!-- 3D Scroll-Driven WebGL Minimalist Tech Mesh Background -->
    <ClientOnly>
      <ScrollTechMesh />
    </ClientOnly>

    <!-- Hero Section -->
    <div class="relative overflow-hidden z-10">
      <HeroSection :user="user" />
    </div>

    <!-- Section Divider Line -->
    <div class="container mx-auto px-6 relative z-10">
      <div class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>

    <!-- About Section -->
    <div class="relative overflow-hidden z-10">
      <AboutSection
        :user="user"
        :count_projects="projects.length"
        :count_experience="totalExperienceYears"
      />
    </div>

    <!-- Section Divider Line -->
    <div class="container mx-auto px-6 relative z-10">
      <div class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>

    <!-- Skills Section -->
    <div class="relative overflow-hidden z-10">
      <SkillsSection :skills="skills" />
    </div>

    <!-- Section Divider Line -->
    <div class="container mx-auto px-6 relative z-10">
      <div class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>

    <!-- Journey Section -->
    <div class="relative overflow-hidden z-10">
      <JourneySection :experiences="experiences" />
    </div>

    <!-- Section Divider Line -->
    <div class="container mx-auto px-6 relative z-10">
      <div class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>

    <!-- Projects Section -->
    <div class="relative overflow-hidden z-10">
      <ProjectsSection :projects="projects" />
    </div>

    <!-- Section Divider Line -->
    <div class="container mx-auto px-6 relative z-10">
      <div class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>

    <!-- Contact Section -->
    <div class="relative overflow-hidden z-10">
      <ContactSection :user="user" />
    </div>

    <!-- Footer Section -->
    <div class="relative overflow-hidden z-10">
      <FooterSection />
    </div>

    <!-- AI Assistant Widget -->
    <AIAssistant />
  </div>
</template>
