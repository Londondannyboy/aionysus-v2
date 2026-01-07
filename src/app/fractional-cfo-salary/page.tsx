import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BreadcrumbsLight } from '@/components/Breadcrumbs'
import { WebPageSchema } from '@/components/seo/WebPageSchema'
import { RoleCalculator } from '@/components/RoleCalculator'
import { IR35Calculator } from '@/components/IR35Calculator'
import { RoleContentHub } from '@/components/RoleContentHub'

export const metadata: Metadata = {
  title: 'Fractional CFO Salary UK 2025 | Day Rates, Costs & Compensation Guide',
  description: 'Fractional CFO salary UK guide for 2025. Day rates £700-£1,400, annual equivalent £70,000-£170,000. Compare fractional CFO costs, understand pricing factors, and calculate your potential earnings.',
  keywords: 'fractional cfo salary, fractional cfo salary uk, fractional cfo day rate, fractional cfo cost, cfo salary uk, part time cfo salary, fractional cfo rates, fractional finance salary',
  alternates: {
    canonical: 'https://fractional.quest/fractional-cfo-salary',
  },
  openGraph: {
    title: 'Fractional CFO Salary UK 2025 | Complete Compensation Guide',
    description: 'Fractional CFO salary UK: Day rates £700-£1,400. Complete guide to fractional CFO costs.',
    url: 'https://fractional.quest/fractional-cfo-salary',
  },
}

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Fractional CFO', href: '/fractional-cfo' },
  { label: 'Salary Guide', href: '/fractional-cfo-salary' },
]

export default function FractionalCfoSalaryPage() {
  return (
    <div className="min-h-screen bg-white">
      <WebPageSchema
        title="Fractional CFO Salary UK 2025 | Day Rates & Compensation Guide"
        description="Complete guide to fractional CFO salary UK. Day rates, annual equivalents, and factors affecting compensation."
        url="https://fractional.quest/fractional-cfo-salary"
        dateModified={new Date('2025-01-07')}
      />

      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80"
          alt="Fractional CFO Salary UK - Compensation Guide"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 via-teal-500/80 to-green-500/60" />
        <div className="relative z-10 w-full py-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <BreadcrumbsLight items={breadcrumbs} className="mb-8" />
            <div className="max-w-3xl">
              <span className="inline-block bg-white/20 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                Salary Guide 2025
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                <strong>Fractional CFO Salary</strong> UK
              </h1>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                Complete guide to <strong>fractional CFO salary UK</strong> rates. Day rates, annual equivalents, and factors affecting compensation.
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
              <div className="text-3xl font-bold text-emerald-400">£700-£1,400</div>
              <div className="text-sm text-gray-400">Day Rate Range</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">£1,050</div>
              <div className="text-sm text-gray-400">Average Day Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">£70k-£170k</div>
              <div className="text-sm text-gray-400">Annual Equivalent</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">2-3 days</div>
              <div className="text-sm text-gray-400">Typical Engagement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <article className="prose prose-lg prose-gray max-w-none">

            <h2 className="text-3xl font-black text-gray-900 mb-6">Fractional CFO Salary UK Overview</h2>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              <strong>Fractional CFO salary</strong> in the UK typically ranges from £700-£1,400 per day, with the average around £1,050/day. CFOs with fundraising experience and PE/VC backgrounds command premium rates. ACA and ACCA qualified candidates typically earn at the higher end.
            </p>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional CFO Day Rates by Experience</h3>

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
                    <td className="px-6 py-4 text-sm text-gray-600">£650-£850</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£68,000-£88,000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Mid-level Fractional</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£850-£1,100</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£88,000-£114,000</td>
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

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional CFO Salary by Specialisation</h3>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'VC-Backed CFO', desc: 'Fundraising, investor relations', rate: '£1,100-£1,400/day' },
                { title: 'PE Portfolio CFO', desc: 'Value creation, exit planning', rate: '£1,200-£1,500/day' },
                { title: 'Scale-up CFO', desc: 'Growth finance, cash management', rate: '£900-£1,200/day' },
                { title: 'Turnaround CFO', desc: 'Restructuring, crisis management', rate: '£1,000-£1,300/day' },
              ].map((type, i) => (
                <div key={i} className="bg-gray-50 p-6 border border-gray-200 rounded-lg">
                  <h4 className="font-bold text-gray-900 mb-1">{type.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{type.desc}</p>
                  <span className="text-emerald-700 font-semibold text-sm">{type.rate}</span>
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Factors Affecting Fractional CFO Salary</h3>

            <ul className="space-y-3">
              <li><strong>Professional qualification:</strong> ACA/ACCA qualified typically earn 10-15% more</li>
              <li><strong>Fundraising track record:</strong> Multiple successful rounds command premiums</li>
              <li><strong>Industry expertise:</strong> SaaS, FinTech specialists in high demand</li>
              <li><strong>Big 4 background:</strong> Ex-Deloitte, PwC, EY, KPMG adds 10-15%</li>
              <li><strong>Company stage:</strong> Series B+ typically pay 15-20% more</li>
            </ul>

          </article>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Fractional CFO Salary Calculator</h2>
          </div>
          <RoleCalculator role="cfo" />
        </div>
      </section>

      {/* IR35 Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">IR35 Impact on Fractional CFO Salary</h2>
          </div>
          <IR35Calculator defaultDayRate={1050} />
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Related Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/fractional-cfo" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors group">
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 mb-2">What is a Fractional CFO?</h3>
              <p className="text-gray-600 text-sm">Understand the role</p>
            </Link>
            <Link href="/fractional-cfo-jobs-uk" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors group">
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 mb-2">Fractional CFO Jobs UK</h3>
              <p className="text-gray-600 text-sm">Browse live roles</p>
            </Link>
            <Link href="/hire-fractional-cfo" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors group">
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 mb-2">How to Hire</h3>
              <p className="text-gray-600 text-sm">Complete hiring guide</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">Find Fractional CFO Opportunities</h2>
          <Link href="/fractional-cfo-jobs-uk" className="px-8 py-4 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors inline-block">
            Browse CFO Jobs
          </Link>
        </div>
      </section>

      <RoleContentHub currentRole="cfo" />
    </div>
  )
}
