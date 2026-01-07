import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BreadcrumbsLight } from '@/components/Breadcrumbs'
import { WebPageSchema } from '@/components/seo/WebPageSchema'
import { RoleCalculator } from '@/components/RoleCalculator'
import { IR35Calculator } from '@/components/IR35Calculator'
import { RoleContentHub } from '@/components/RoleContentHub'

export const metadata: Metadata = {
  title: 'Fractional CTO Salary UK 2025 | Day Rates, Costs & Compensation Guide',
  description: 'Fractional CTO salary UK guide for 2025. Day rates £800-£1,600, annual equivalent £85,000-£200,000. Compare fractional CTO costs, understand pricing factors, and calculate your potential earnings.',
  keywords: 'fractional cto salary, fractional cto salary uk, fractional cto day rate, fractional cto cost, cto salary uk, part time cto salary, fractional cto rates, fractional technology salary',
  alternates: {
    canonical: 'https://fractional.quest/fractional-cto-salary',
  },
  openGraph: {
    title: 'Fractional CTO Salary UK 2025 | Complete Compensation Guide',
    description: 'Fractional CTO salary UK: Day rates £800-£1,600. Complete guide to fractional CTO costs and compensation.',
    url: 'https://fractional.quest/fractional-cto-salary',
  },
}

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Fractional CTO', href: '/fractional-cto' },
  { label: 'Salary Guide', href: '/fractional-cto-salary' },
]

export default function FractionalCtoSalaryPage() {
  return (
    <div className="min-h-screen bg-white">
      <WebPageSchema
        title="Fractional CTO Salary UK 2025 | Day Rates & Compensation Guide"
        description="Complete guide to fractional CTO salary UK. Day rates, annual equivalents, and factors affecting compensation."
        url="https://fractional.quest/fractional-cto-salary"
        dateModified={new Date('2025-01-07')}
      />

      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1920&q=80"
          alt="Fractional CTO Salary UK - Compensation Guide"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/90 via-blue-500/80 to-indigo-500/60" />
        <div className="relative z-10 w-full py-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <BreadcrumbsLight items={breadcrumbs} className="mb-8" />
            <div className="max-w-3xl">
              <span className="inline-block bg-white/20 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                Salary Guide 2025
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                <strong>Fractional CTO Salary</strong> UK
              </h1>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                Complete guide to <strong>fractional CTO salary UK</strong> rates. Day rates, annual equivalents, and factors affecting compensation.
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
              <div className="text-3xl font-bold text-cyan-400">£800-£1,600</div>
              <div className="text-sm text-gray-400">Day Rate Range</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">£1,100</div>
              <div className="text-sm text-gray-400">Average Day Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">£85k-£200k</div>
              <div className="text-sm text-gray-400">Annual Equivalent</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">2-3 days</div>
              <div className="text-sm text-gray-400">Typical Engagement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <article className="prose prose-lg prose-gray max-w-none">

            <h2 className="text-3xl font-black text-gray-900 mb-6">Fractional CTO Salary UK Overview</h2>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              <strong>Fractional CTO salary</strong> in the UK typically ranges from £800-£1,600 per day, with the average around £1,100/day. This translates to annual earnings of £85,000-£200,000 depending on days worked and specialisation. Technology leadership commands premium rates, especially in AI/ML and FinTech.
            </p>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional CTO Day Rates by Experience</h3>

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
                    <td className="px-6 py-4 text-sm text-gray-600">£800-£1,000</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£83,000-£104,000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Mid-level Fractional</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£1,000-£1,300</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£104,000-£135,000</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Senior Fractional</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£1,300-£1,600</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£135,000-£166,000</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Specialist (AI/ML)</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£1,500-£2,000</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£156,000-£208,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional CTO Salary by Specialisation</h3>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'AI/ML CTO', desc: 'Machine learning, data infrastructure', rate: '£1,300-£1,800/day' },
                { title: 'Cloud/DevOps CTO', desc: 'Infrastructure, scalability', rate: '£1,100-£1,500/day' },
                { title: 'FinTech CTO', desc: 'Regulated environments, security', rate: '£1,200-£1,600/day' },
                { title: 'Startup CTO', desc: 'MVP, 0-to-1 building', rate: '£1,000-£1,400/day' },
              ].map((type, i) => (
                <div key={i} className="bg-gray-50 p-6 border border-gray-200 rounded-lg">
                  <h4 className="font-bold text-gray-900 mb-1">{type.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{type.desc}</p>
                  <span className="text-cyan-700 font-semibold text-sm">{type.rate}</span>
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Factors Affecting Fractional CTO Salary</h3>

            <ul className="space-y-3">
              <li><strong>Tech stack expertise:</strong> Modern stacks (K8s, serverless) command 15-25% premiums</li>
              <li><strong>Industry specialisation:</strong> FinTech, HealthTech, AI require specific compliance knowledge</li>
              <li><strong>Company stage:</strong> Series B+ typically pay 20% more than seed stage</li>
              <li><strong>Team size:</strong> Managing larger engineering teams increases rates</li>
              <li><strong>Location:</strong> London-based roles pay 15-20% more than regional</li>
            </ul>

          </article>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Fractional CTO Salary Calculator</h2>
          </div>
          <RoleCalculator role="cto" />
        </div>
      </section>

      {/* IR35 Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">IR35 Impact on Fractional CTO Salary</h2>
          </div>
          <IR35Calculator defaultDayRate={1100} />
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Related Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/fractional-cto" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors group">
              <h3 className="font-bold text-gray-900 group-hover:text-cyan-700 mb-2">What is a Fractional CTO?</h3>
              <p className="text-gray-600 text-sm">Understand the role</p>
            </Link>
            <Link href="/fractional-cto-jobs-uk" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors group">
              <h3 className="font-bold text-gray-900 group-hover:text-cyan-700 mb-2">Fractional CTO Jobs UK</h3>
              <p className="text-gray-600 text-sm">Browse live roles</p>
            </Link>
            <Link href="/hire-fractional-cto" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors group">
              <h3 className="font-bold text-gray-900 group-hover:text-cyan-700 mb-2">How to Hire</h3>
              <p className="text-gray-600 text-sm">Complete hiring guide</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">Find Fractional CTO Opportunities</h2>
          <Link href="/fractional-cto-jobs-uk" className="px-8 py-4 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors inline-block">
            Browse CTO Jobs
          </Link>
        </div>
      </section>

      <RoleContentHub currentRole="cto" />
    </div>
  )
}
