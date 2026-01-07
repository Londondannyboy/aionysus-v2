import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BreadcrumbsLight } from '@/components/Breadcrumbs'
import { WebPageSchema } from '@/components/seo/WebPageSchema'
import { RoleCalculator } from '@/components/RoleCalculator'
import { IR35Calculator } from '@/components/IR35Calculator'
import { RoleContentHub } from '@/components/RoleContentHub'

export const metadata: Metadata = {
  title: 'Fractional COO Salary UK 2025 | Day Rates, Costs & Compensation Guide',
  description: 'Fractional COO salary UK guide for 2025. Day rates £600-£1,200, annual equivalent £60,000-£145,000. Compare fractional COO costs, understand pricing factors, and calculate your potential earnings.',
  keywords: 'fractional coo salary, fractional coo salary uk, fractional coo day rate, fractional coo cost, coo salary uk, part time coo salary, fractional coo rates, fractional operations salary',
  alternates: {
    canonical: 'https://fractional.quest/fractional-coo-salary',
  },
  openGraph: {
    title: 'Fractional COO Salary UK 2025 | Complete Compensation Guide',
    description: 'Fractional COO salary UK: Day rates £600-£1,200. Complete guide to fractional COO costs.',
    url: 'https://fractional.quest/fractional-coo-salary',
  },
}

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Fractional COO', href: '/fractional-coo' },
  { label: 'Salary Guide', href: '/fractional-coo-salary' },
]

export default function FractionalCooSalaryPage() {
  return (
    <div className="min-h-screen bg-white">
      <WebPageSchema
        title="Fractional COO Salary UK 2025 | Day Rates & Compensation Guide"
        description="Complete guide to fractional COO salary UK. Day rates, annual equivalents, and factors affecting compensation."
        url="https://fractional.quest/fractional-coo-salary"
        dateModified={new Date('2025-01-07')}
      />

      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80"
          alt="Fractional COO Salary UK - Compensation Guide"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-700/90 via-gray-600/80 to-zinc-500/60" />
        <div className="relative z-10 w-full py-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <BreadcrumbsLight items={breadcrumbs} className="mb-8" />
            <div className="max-w-3xl">
              <span className="inline-block bg-white/20 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                Salary Guide 2025
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                <strong>Fractional COO Salary</strong> UK
              </h1>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                Complete guide to <strong>fractional COO salary UK</strong> rates. Day rates, annual equivalents, and factors affecting compensation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="py-8 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-slate-400">£600-£1,200</div>
              <div className="text-sm text-gray-400">Day Rate Range</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-400">£900</div>
              <div className="text-sm text-gray-400">Average Day Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-400">£60k-£145k</div>
              <div className="text-sm text-gray-400">Annual Equivalent</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-400">2-3 days</div>
              <div className="text-sm text-gray-400">Typical Engagement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <article className="prose prose-lg prose-gray max-w-none">

            <h2 className="text-3xl font-black text-gray-900 mb-6">Fractional COO Salary UK Overview</h2>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              <strong>Fractional COO salary</strong> in the UK typically ranges from £600-£1,200 per day, with the average around £900/day. COOs with scale-up experience and M&A integration expertise command premium rates. E-commerce and supply chain specialists are particularly in demand.
            </p>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional COO Day Rates by Experience</h3>

            <div className="overflow-x-auto my-8 not-prose">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Experience Level</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Day Rate</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Annual (2 days/week)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Entry-level Fractional</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£550-£750</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£57,000-£78,000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Mid-level Fractional</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£750-£950</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£78,000-£99,000</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Senior Fractional</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£950-£1,200</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£99,000-£125,000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Specialist (PE/M&A)</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£1,100-£1,400</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£114,000-£145,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional COO Salary by Specialisation</h3>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'Scale-up COO', desc: 'Rapid growth, team scaling', rate: '£900-£1,200/day' },
                { title: 'E-commerce COO', desc: 'Supply chain, fulfilment', rate: '£800-£1,100/day' },
                { title: 'Process COO', desc: 'Lean operations, efficiency', rate: '£750-£1,050/day' },
                { title: 'Integration COO', desc: 'M&A, company integration', rate: '£900-£1,200/day' },
              ].map((type, i) => (
                <div key={i} className="bg-gray-50 p-6 border border-gray-200 rounded-lg">
                  <h4 className="font-bold text-gray-900 mb-1">{type.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{type.desc}</p>
                  <span className="text-slate-700 font-semibold text-sm">{type.rate}</span>
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Factors Affecting Fractional COO Salary</h3>

            <ul className="space-y-3">
              <li><strong>Scale experience:</strong> Growing companies from 20 to 200+ employees adds 15-20%</li>
              <li><strong>Industry expertise:</strong> E-commerce, SaaS, manufacturing specialists in demand</li>
              <li><strong>Process certifications:</strong> Six Sigma, Lean qualifications add credibility</li>
              <li><strong>M&A experience:</strong> Integration expertise commands premiums</li>
              <li><strong>Team size managed:</strong> 50+ person teams typically pay more</li>
            </ul>

          </article>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Fractional COO Salary Calculator</h2>
          </div>
          <RoleCalculator role="coo" />
        </div>
      </section>

      {/* IR35 Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">IR35 Impact on Fractional COO Salary</h2>
          </div>
          <IR35Calculator defaultDayRate={900} />
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Related Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/fractional-coo" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-slate-400 transition-colors group">
              <h3 className="font-bold text-gray-900 group-hover:text-slate-700 mb-2">What is a Fractional COO?</h3>
              <p className="text-gray-600 text-sm">Understand the role</p>
            </Link>
            <Link href="/fractional-coo-jobs-uk" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-slate-400 transition-colors group">
              <h3 className="font-bold text-gray-900 group-hover:text-slate-700 mb-2">Fractional COO Jobs UK</h3>
              <p className="text-gray-600 text-sm">Browse live roles</p>
            </Link>
            <Link href="/hire-fractional-coo" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-slate-400 transition-colors group">
              <h3 className="font-bold text-gray-900 group-hover:text-slate-700 mb-2">How to Hire</h3>
              <p className="text-gray-600 text-sm">Complete hiring guide</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">Find Fractional COO Opportunities</h2>
          <Link href="/fractional-coo-jobs-uk" className="px-8 py-4 bg-slate-500 text-white font-bold rounded-lg hover:bg-slate-400 transition-colors inline-block">
            Browse COO Jobs
          </Link>
        </div>
      </section>

      <RoleContentHub currentRole="coo" />
    </div>
  )
}
