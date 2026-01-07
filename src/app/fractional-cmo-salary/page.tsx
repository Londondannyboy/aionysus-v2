import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BreadcrumbsLight } from '@/components/Breadcrumbs'
import { WebPageSchema } from '@/components/seo/WebPageSchema'
import { RoleCalculator } from '@/components/RoleCalculator'
import { IR35Calculator } from '@/components/IR35Calculator'
import { RoleContentHub } from '@/components/RoleContentHub'

export const metadata: Metadata = {
  title: 'Fractional CMO Salary UK 2025 | Day Rates, Costs & Compensation Guide',
  description: 'Fractional CMO salary UK guide for 2025. Day rates £700-£1,400, annual equivalent £70,000-£170,000. Compare fractional CMO costs, understand pricing factors, and calculate your potential earnings.',
  keywords: 'fractional cmo salary, fractional cmo salary uk, fractional cmo day rate, fractional cmo cost, cmo salary uk, part time cmo salary, fractional cmo rates, fractional marketing salary',
  alternates: {
    canonical: 'https://fractional.quest/fractional-cmo-salary',
  },
  openGraph: {
    title: 'Fractional CMO Salary UK 2025 | Complete Compensation Guide',
    description: 'Fractional CMO salary UK: Day rates £700-£1,400. Complete guide to fractional CMO costs and compensation.',
    url: 'https://fractional.quest/fractional-cmo-salary',
  },
}

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Fractional CMO', href: '/fractional-cmo' },
  { label: 'Salary Guide', href: '/fractional-cmo-salary' },
]

export default function FractionalCmoSalaryPage() {
  return (
    <div className="min-h-screen bg-white">
      <WebPageSchema
        title="Fractional CMO Salary UK 2025 | Day Rates & Compensation Guide"
        description="Complete guide to fractional CMO salary UK. Day rates, annual equivalents, and factors affecting compensation."
        url="https://fractional.quest/fractional-cmo-salary"
        dateModified={new Date('2025-01-07')}
      />

      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80"
          alt="Fractional CMO Salary UK - Compensation Guide"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/90 via-orange-500/80 to-pink-500/60" />
        <div className="relative z-10 w-full py-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <BreadcrumbsLight items={breadcrumbs} className="mb-8" />
            <div className="max-w-3xl">
              <span className="inline-block bg-white/20 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                Salary Guide 2025
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                <strong>Fractional CMO Salary</strong> UK
              </h1>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                Complete guide to <strong>fractional CMO salary UK</strong> rates. Understand day rates, annual equivalents, and factors affecting compensation.
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
              <div className="text-3xl font-bold text-amber-400">£700-£1,400</div>
              <div className="text-sm text-gray-400">Day Rate Range</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400">£950</div>
              <div className="text-sm text-gray-400">Average Day Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400">£70k-£170k</div>
              <div className="text-sm text-gray-400">Annual Equivalent</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400">2-3 days</div>
              <div className="text-sm text-gray-400">Typical Engagement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <article className="prose prose-lg prose-gray max-w-none">

            <h2 className="text-3xl font-black text-gray-900 mb-6">Fractional CMO Salary UK Overview</h2>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              <strong>Fractional CMO salary</strong> in the UK typically ranges from £700-£1,400 per day, with the average sitting around £950/day. This translates to annual earnings of £70,000-£170,000 depending on days worked per week and number of clients.
            </p>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional CMO Day Rates by Experience</h3>

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
                    <td className="px-6 py-4 text-sm text-gray-600">£600-£800</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£62,000-£83,000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Mid-level Fractional</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£800-£1,100</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£83,000-£114,000</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Senior Fractional</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£1,100-£1,400</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£114,000-£145,000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Specialist (PE/VC)</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£1,300-£1,600</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£135,000-£166,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional CMO Salary by Location</h3>

            <div className="overflow-x-auto my-8 not-prose">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Day Rate Range</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Premium vs UK Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">London</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£900-£1,400</td>
                    <td className="px-6 py-4 text-sm text-green-600">+15-20%</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Manchester</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£700-£1,100</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Baseline</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Bristol</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£700-£1,000</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Baseline</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Remote UK</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£650-£950</td>
                    <td className="px-6 py-4 text-sm text-red-600">-5-10%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Factors Affecting Fractional CMO Salary</h3>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'Industry Specialisation', desc: 'SaaS, FinTech, and healthcare CMOs command 10-20% premiums', icon: '🏭' },
                { title: 'Channel Expertise', desc: 'PLG, demand gen, and ABM specialists earn higher rates', icon: '📊' },
                { title: 'Company Stage', desc: 'Series B+ companies typically pay more than seed stage', icon: '🚀' },
                { title: 'Track Record', desc: 'Proven exit experience or IPO involvement increases rates', icon: '🏆' },
                { title: 'Time Commitment', desc: 'Higher day counts may warrant volume discounts', icon: '⏰' },
                { title: 'Contract Length', desc: '12-month contracts may offer slightly lower rates', icon: '📝' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg">
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional CMO vs Full-Time CMO Salary</h3>

            <div className="bg-gray-50 p-6 rounded-lg my-6 not-prose">
              <h4 className="font-bold text-gray-900 mb-4">Total Cost Comparison</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-700">Full-time CMO (salary only)</span>
                  <span className="font-semibold">£120,000-£200,000</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-700">+ Employer NI, pension, benefits</span>
                  <span className="font-semibold">+£20,000-£40,000</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-700">+ Equity (estimated value)</span>
                  <span className="font-semibold">+£30,000-£100,000</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-lg">
                  <span className="font-bold text-gray-900">Full-time Total Cost</span>
                  <span className="font-bold text-red-600">£170,000-£340,000</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-300">
                  <span className="font-bold text-gray-900">Fractional CMO (2 days/week)</span>
                  <span className="font-bold text-green-600">£70,000-£115,000</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">Fractional CMOs typically cost 40-60% less than full-time equivalents</p>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Structuring Your Fractional CMO Compensation</h3>

            <ul className="space-y-3">
              <li><strong>Day rate retainer:</strong> Most common - fixed days per week at agreed rate</li>
              <li><strong>Monthly retainer:</strong> Set monthly fee for defined scope of work</li>
              <li><strong>Project-based:</strong> Fixed fee for specific deliverables (e.g., GTM strategy)</li>
              <li><strong>Hybrid:</strong> Base retainer plus performance bonuses tied to KPIs</li>
              <li><strong>Equity component:</strong> Some include small equity grants (0.1-0.5%)</li>
            </ul>

          </article>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">Calculate</span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              Fractional CMO Salary Calculator
            </h2>
            <p className="text-gray-600 mt-2">Calculate your potential earnings as a fractional CMO</p>
          </div>
          <RoleCalculator role="cmo" />
        </div>
      </section>

      {/* IR35 Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">UK Tax</span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              IR35 Impact on Fractional CMO Salary
            </h2>
            <p className="text-gray-600 mt-2">Calculate your take-home pay based on IR35 status</p>
          </div>
          <IR35Calculator defaultDayRate={950} />
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Related Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/fractional-cmo" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors group">
              <span className="text-2xl mb-3 block">📖</span>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-700 mb-2">What is a Fractional CMO?</h3>
              <p className="text-gray-600 text-sm">Understand the role</p>
            </Link>
            <Link href="/fractional-cmo-jobs-uk" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors group">
              <span className="text-2xl mb-3 block">💼</span>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-700 mb-2">Fractional CMO Jobs UK</h3>
              <p className="text-gray-600 text-sm">Browse live roles</p>
            </Link>
            <Link href="/hire-fractional-cmo" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors group">
              <span className="text-2xl mb-3 block">📋</span>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-700 mb-2">How to Hire</h3>
              <p className="text-gray-600 text-sm">Complete hiring guide</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Find Fractional CMO Opportunities
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Browse UK fractional CMO roles and compare compensation packages.
          </p>
          <Link
            href="/fractional-cmo-jobs-uk"
            className="px-8 py-4 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors inline-block"
          >
            Browse CMO Jobs
          </Link>
        </div>
      </section>

      <RoleContentHub currentRole="cmo" />
    </div>
  )
}
