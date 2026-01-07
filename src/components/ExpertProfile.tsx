import Image from 'next/image'
import Link from 'next/link'

interface ExpertProfileProps {
  variant?: 'full' | 'compact'
  className?: string
}

/**
 * E-E-A-T Authority Component
 * Displays Dan Keegan's expert profile to establish credibility and trust
 * Used on ranking pages to demonstrate real expertise in fractional executive work
 */
export function ExpertProfile({ variant = 'full', className = '' }: ExpertProfileProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 ${className}`}>
        <Image
          src="/dan-keegan.webp"
          alt="Dan Keegan - Fractional Executive Expert"
          width={64}
          height={64}
          className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30"
        />
        <div>
          <div className="font-bold text-gray-900">Dan Keegan</div>
          <div className="text-sm text-blue-600">Fractional GTM Expert</div>
          <div className="text-xs text-gray-500">15+ years executive experience</div>
        </div>
      </div>
    )
  }

  return (
    <section className={`py-16 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full mb-4">
            Meet the Expert
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Written by a <span className="text-blue-400">Practicing Fractional Executive</span>
          </h2>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <Image
                src="/dan-keegan.webp"
                alt="Dan Keegan - Fractional Executive Expert with 15+ years experience in GTM, strategy, and executive leadership"
                title="Dan Keegan - Founder of Fractional Quest"
                width={200}
                height={200}
                className="w-48 h-48 rounded-xl object-cover border-2 border-blue-500/50"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Dan Keegan</h3>
              <p className="text-blue-400 font-medium mb-4">Founder & Fractional GTM Expert</p>
              <p className="text-gray-300 mb-4">
                With <strong>over 15 years of experience</strong> in executive leadership, go-to-market strategy, and business development, Dan brings real-world fractional expertise to help professionals navigate the executive job market.
              </p>
              <p className="text-gray-400 mb-4">
                Dan founded Fractional Quest after working as a fractional executive himself, understanding firsthand the challenges of finding quality opportunities and the value fractional leaders bring to growing businesses.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full">15+ Years Executive Experience</span>
                <span className="px-3 py-1 bg-purple-600/20 text-purple-400 text-sm rounded-full">Fractional GTM</span>
                <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">Strategy & Growth</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Schema.org Person markup for SEO
export function ExpertProfileSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://fractional.quest/#dan-keegan",
    "name": "Dan Keegan",
    "jobTitle": "Fractional GTM Expert",
    "description": "Fractional executive expert with 15+ years experience in go-to-market strategy, business development, and executive leadership.",
    "image": "https://fractional.quest/dan-keegan.webp",
    "url": "https://fractional.quest/about",
    "sameAs": [
      "https://www.linkedin.com/in/dankeegan/",
      "https://www.linkedin.com/company/fractional-quest"
    ],
    "worksFor": {
      "@type": "Organization",
      "name": "Fractional Quest",
      "url": "https://fractional.quest"
    },
    "knowsAbout": [
      "Fractional Executive",
      "Go-to-Market Strategy",
      "Business Development",
      "Fractional CFO",
      "Fractional CTO",
      "Fractional CMO",
      "Portfolio Career"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
