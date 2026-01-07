import Image from 'next/image'
import Link from 'next/link'

interface CaseStudyProps {
  variant?: 'full' | 'card'
  className?: string
}

/**
 * E-E-A-T Authority Component - Real Case Study
 * Demonstrates actual fractional executive experience
 * Shows Google we have real-world expertise, not just content
 */
export function CaseStudy({ variant = 'full', className = '' }: CaseStudyProps) {
  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            1U
          </div>
          <div>
            <div className="font-bold text-gray-900">OneUp Productions</div>
            <div className="text-sm text-gray-500">Fractional GTM Engagement</div>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Led market expansion strategy as Fractional GTM, helping this gaming production company enter new international markets.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Market Expansion</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">GTM Strategy</span>
        </div>
      </div>
    )
  }

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full mb-4">
            Real Fractional Experience
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Case Study: <span className="text-blue-600">Fractional GTM in Action</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See how fractional executive work delivers real results for growing companies
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold">
                1U
              </div>
              <div>
                <h3 className="text-2xl font-bold">OneUp Productions</h3>
                <p className="text-blue-100">Gaming & Esports Production Company</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">1</span>
                  The Challenge
                </h4>
                <p className="text-gray-600">
                  OneUp Productions needed to expand into new international markets but lacked the in-house expertise for go-to-market strategy. They needed senior GTM leadership without the commitment of a full-time hire.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">2</span>
                  The Solution
                </h4>
                <p className="text-gray-600">
                  Engaged as <strong>Fractional GTM Lead</strong> to develop and execute market expansion strategy, working 2-3 days per week alongside the existing leadership team.
                </p>
              </div>
            </div>

            {/* Results */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h4 className="font-bold text-gray-900 mb-4">Key Deliverables</h4>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">3</div>
                  <div className="text-sm text-gray-600">New Markets Entered</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-green-600 mb-1">GTM</div>
                  <div className="text-sm text-gray-600">Strategy Delivered</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-purple-600 mb-1">2-3</div>
                  <div className="text-sm text-gray-600">Days Per Week</div>
                </div>
              </div>
            </div>

            {/* Why Fractional Works */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-bold text-gray-900 mb-3">Why Fractional Worked Here</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span><strong>Cost Effective</strong> — Senior GTM expertise at a fraction of full-time hire cost</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span><strong>Immediate Impact</strong> — Hit the ground running with proven playbooks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span><strong>Flexible Scale</strong> — Adjusted involvement as needs evolved</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Fractional GTM</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">Market Expansion</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">Gaming Industry</span>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">International Growth</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Schema.org Case Study markup
export function CaseStudySchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Fractional GTM Case Study: OneUp Productions Market Expansion",
    "description": "How fractional executive leadership helped OneUp Productions expand into new international markets.",
    "author": {
      "@id": "https://fractional.quest/#dan-keegan"
    },
    "publisher": {
      "@id": "https://fractional.quest/#organization"
    },
    "about": {
      "@type": "Service",
      "name": "Fractional GTM Services",
      "description": "Part-time go-to-market executive leadership for growing companies"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
