<script setup lang="ts">
const siteUrl = 'https://eka-dev.cloud'
const pageUrl = `${siteUrl}/privacy`
const pageTitle = 'Privacy Policy - Eka Dev Portfolio'
const pageDescription = 'Learn how Eka Dev Portfolio collects, uses, and protects your personal information. Our privacy policy explains our data practices and your rights.'

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
        <h1 class="text-5xl font-black text-white mb-4">Privacy Policy</h1>
        <p class="text-white/60">Last updated: January 2026</p>
      </div>

      <!-- Content Sections -->
      <div class="space-y-12 text-white/80 prose prose-invert max-w-none">
        <!-- Section 1 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">1. Introduction</h2>
          <p class="mb-4">
            Welcome to Eka Dev Portfolio ("we," "us," "our," or "Company"). We are committed to protecting your privacy
            and ensuring you have a positive experience on our website. This Privacy Policy explains our practices
            regarding the collection, use, and disclosure of your personal information.
          </p>
        </section>

        <!-- Section 2 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
          <p class="mb-4">We may collect information about you in various ways:</p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
            <li><strong>Contact Information:</strong> When you submit a contact form, we collect your name, email
              address, subject, and message.
            </li>
            <li><strong>Usage Data:</strong> We automatically collect information about your interactions with our
              website, including IP address, browser type, pages visited, and time spent on pages.
            </li>
            <li><strong>Cookies:</strong> We use cookies to enhance your browsing experience and analyze site
              performance.
            </li>
            <li><strong>Analytics:</strong> We use third-party analytics tools to understand how visitors use our site.
            </li>
          </ul>
        </section>

        <!-- Section 3 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
          <p class="mb-4">We use the information we collect for various purposes:</p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>To respond to your inquiries and support requests</li>
            <li>To improve our website and services</li>
            <li>To analyze website usage and trends</li>
            <li>To send you updates and promotional materials (with your consent)</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <!-- Section 4 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">4. Data Sharing</h2>
          <p class="mb-4">
            We do not sell, trade, or rent your personal information to third parties. However, we may share your
            information with:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Service providers who assist us in operating our website</li>
            <li>Law enforcement if required by law</li>
            <li>Business partners with your explicit consent</li>
          </ul>
        </section>

        <!-- Section 5 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">5. Data Security</h2>
          <p class="mb-4">
            We implement appropriate security measures to protect your personal information from unauthorized access,
            alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <!-- Section 6 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
          <p class="mb-4">You have the right to:</p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Access your personal information</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Request a copy of your data in a portable format</li>
          </ul>
        </section>

        <!-- Section 7 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">7. Cookies Policy</h2>
          <p class="mb-4">
            Our website uses cookies to enhance your experience. You can control cookie settings through your browser
            preferences. Disabling cookies may affect the functionality of some features on our website.
          </p>
        </section>

        <!-- Section 8 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">8. Third-Party Links</h2>
          <p class="mb-4">
            Our website may contain links to external websites. We are not responsible for the privacy practices of
            these third-party sites. We encourage you to review their privacy policies before providing any personal
            information.
          </p>
        </section>

        <!-- Section 9 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">9. GDPR Compliance</h2>
          <p class="mb-4">
            If you are located in the European Union, you have additional rights under the General Data Protection
            Regulation (GDPR). We are committed to protecting your data in accordance with GDPR requirements.
          </p>
        </section>

        <!-- Section 10 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
          <p class="mb-4">
            If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <div class="bg-white/10 border border-white/20 rounded-lg p-6 mt-4">
            <p class="font-semibold text-white mb-2">Eka Dev Portfolio</p>
            <p>Email: <a href="mailto:ekaaa.jobs@gmail.com" class="text-primary hover:text-primary/80">ekaaa.jobs@gmail.com</a>
            </p>
            <p>Location: San Francisco, CA</p>
          </div>
        </section>

        <!-- Section 11 -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
          <p class="mb-4">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an
            updated revision date. Your continued use of our website indicates your acceptance of the updated policy.
          </p>
        </section>
      </div>

      <!-- Footer CTA -->
      <div class="mt-16 pt-12 border-t border-white/10">
        <div class="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <h3 class="text-2xl font-bold text-white mb-4">Still have questions?</h3>
          <p class="text-white/60 mb-6">Get in touch with us directly for any privacy concerns or inquiries.</p>
          <NuxtLink
              to="/#contact"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-all text-sm shadow-sm"
          >
            <Icon name="carbon:email" size="18"/>
            Contact Us
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

