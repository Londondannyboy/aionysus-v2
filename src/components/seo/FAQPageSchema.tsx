/**
 * FAQPageSchema Component
 *
 * Server-side FAQPage JSON-LD schema for SEO rich snippets.
 * Use this on pages that need FAQ schema without client-side hydration.
 */

interface FAQItem {
  question: string
  answer: string
}

interface FAQPageSchemaProps {
  faqs: FAQItem[]
}

export function FAQPageSchema({ faqs }: FAQPageSchemaProps) {
  if (!faqs || faqs.length === 0) return null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
