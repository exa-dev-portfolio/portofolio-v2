<script setup lang="ts">
const siteUrl = 'https://eka-dev.cloud'
const pageUrl = `${siteUrl}/terms`
const pageTitle = 'Terms of Service - Eka Dev Portfolio'
const pageDescription = 'Read the Terms of Service for Eka Dev Portfolio. Understand the rules and guidelines for using our website and services.'

useHead({
  title: pageTitle,
  htmlAttrs: {
    lang: 'en'
  },
  meta: [
    {
      name: 'description',
      content: pageDescription
    },
    {
      name: 'robots',
      content: 'index, follow'
    },
    // Open Graph
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:url',
      content: pageUrl
    },
    {
      property: 'og:title',
      content: pageTitle
    },
    {
      property: 'og:image',
      content: `${siteUrl}/images/og-image.png`
    },
    {
      property: 'og:image:width',
      content: '1200'
    },
    {
      property: 'og:image:height',
      content: '630'
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:site',
      content: '@ESyafrino'
    },
    {
      name: 'twitter:title',
      content: pageTitle
    },
    {
      name: 'twitter:description',
      content: pageDescription
    },
    {
      name: 'twitter:image',
      content: `${siteUrl}/images/og-image.png`
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: pageUrl
    }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: pageTitle,
        url: pageUrl,
        description: pageDescription,
        inLanguage: 'en-US',
        isPartOf: {
          '@type': 'WebSite',
          url: siteUrl,
          name: 'Eka Dev Portfolio'
        }
      })
    }
  ]
})

definePageMeta(
    {
      layout: false
    }
)


</script>

<template>
  <div class="min-h-screen bg-linear-to-b from-[#071026] via-[#071423] to-[#071023]">
    <!-- Header -->
    <header class="container mx-auto px-6 py-6 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-white/5">
          <Icon name="material-symbols-light:terminal" size="28" class="text-primary"/>
        </div>
        <span class="font-semibold text-white">Eka Dev.</span>
      </NuxtLink>

      <NuxtLink to="/" class="text-white/70 hover:text-white transition-colors">
        Back to Home
      </NuxtLink>
    </header>

    <!-- Content -->
    <main class="container mx-auto px-6 py-16 max-w-4xl">
      <!-- Page Title -->
      <div class="mb-12">
        <h1 class="text-5xl font-black text-white mb-4">Terms of Service</h1>
        <p class="text-white/60">Last updated: January 2026</p>
      </div>

      <!-- Content Sections -->
      <div class="space-y-12 text-white/80 prose prose-invert max-w-none">
        <!-- Section 1 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
          <p class="mb-4">
            By accessing and using this website, you accept and agree to be bound by the terms and provision of this
            agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <!-- Section 2 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">2. Use License</h2>
          <p class="mb-4">
            Permission is granted to temporarily download one copy of the materials (information or software) on Eka
            Dev Portfolio for personal, non-commercial transitory viewing only. This is the grant of a license, not a
            transfer of title, and under this license you may not:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <!-- Section 3 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">3. Disclaimer</h2>
          <p class="mb-4">
            The materials on Eka Dev Portfolio are provided on an 'as is' basis. Eka Dev makes no warranties,
            expressed or implied, and hereby disclaims and negates all other warranties including, without limitation,
            implied warranties or conditions of merchantability, fitness for a particular purpose, or
            non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <!-- Section 4 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">4. Limitations</h2>
          <p class="mb-4">
            In no event shall Eka Dev or its suppliers be liable for any damages (including, without limitation,
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability
            to use the materials on Eka Dev Portfolio, even if Eka Dev or an authorized representative has been
            notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <!-- Section 5 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">5. Accuracy of Materials</h2>
          <p class="mb-4">
            The materials appearing on Eka Dev Portfolio could include technical, typographical, or photographic
            errors. Eka Dev does not warrant that any of the materials on its website are accurate, complete, or
            current. Eka Dev may make changes to the materials contained on its website at any time without notice.
          </p>
        </section>

        <!-- Section 6 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">6. Links</h2>
          <p class="mb-4">
            Eka Dev has not reviewed all of the sites linked to its website and is not responsible for the contents of
            any such linked site. The inclusion of any link does not imply endorsement by Eka Dev of the site. Use of
            any such linked website is at the user's own risk.
          </p>
        </section>

        <!-- Section 7 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">7. Modifications</h2>
          <p class="mb-4">
            Eka Dev may revise these terms of service for its website at any time without notice. By using this
            website, you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <!-- Section 8 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">8. Governing Law</h2>
          <p class="mb-4">
            These terms and conditions are governed by and construed in accordance with the laws of the United States,
            and you irrevocably submit to the exclusive jurisdiction of the courts located in that location.
          </p>
        </section>

        <!-- Section 9 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">9. Intellectual Property Rights</h2>
          <p class="mb-4">
            All content on this website, including text, graphics, logos, images, and software, is the property of
            Eka Dev or its content suppliers and is protected by international copyright laws. You may not reproduce,
            distribute, or transmit any content without our prior written permission.
          </p>
        </section>

        <!-- Section 10 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">10. User Responsibilities</h2>
          <p class="mb-4">
            When using our website, you agree not to:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Engage in any unlawful or fraudulent activity</li>
            <li>Harass, abuse, or harm any person</li>
            <li>Disrupt the normal flow of dialogue or content</li>
            <li>Post or transmit unsolicited advertisements or spam</li>
          </ul>
        </section>

        <!-- Section 11 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">11. Contact Information</h2>
          <p class="mb-4">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <div class="bg-white/10 border border-white/20 rounded-lg p-6 mt-4">
            <p class="font-semibold text-white mb-2">Eka Dev Portfolio</p>
            <p>Email: <a href="mailto:ekaaa.jobs@gmail.com" class="text-primary hover:text-primary/80">ekaaa.jobs@gmail.com</a>
            </p>
            <p>Location: Tegal, Indonesia</p>
          </div>
        </section>
      </div>

      <!-- Footer CTA -->
      <div class="mt-16 pt-12 border-t border-white/10">
        <div class="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <h3 class="text-2xl font-bold text-white mb-4">Agree to our terms?</h3>
          <p class="text-white/60 mb-6">Start exploring our portfolio and get in touch with us today.</p>
          <NuxtLink
              to="/#contact"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-all text-sm shadow-sm"
          >
            <Icon name="carbon:email" size="18"/>
            Get in Touch
          </NuxtLink>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <FooterSection/>
  </div>
</template>

<style scoped>
.prose-invert {
  --tw-prose-body: rgb(229 231 235 / var(--tw-prose-body-opacity));
  --tw-prose-headings: rgb(255 255 255 / var(--tw-prose-headings-opacity));
  --tw-prose-links: rgb(30 127 255 / var(--tw-prose-links-opacity));
  --tw-prose-bold: rgb(255 255 255 / var(--tw-prose-bold-opacity));
  --tw-prose-code: rgb(30 127 255 / var(--tw-prose-code-opacity));
}
</style>

