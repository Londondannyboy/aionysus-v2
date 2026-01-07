import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FAQ, CFO_FAQS } from '@/components/seo/FAQ'
import { BreadcrumbsLight } from '@/components/Breadcrumbs'
import { WebPageSchema } from '@/components/seo/WebPageSchema'
import { FAQPageSchema } from '@/components/seo/FAQPageSchema'
import { LazyYouTube } from '@/components/LazyYouTube'
import { RoleContentHub } from '@/components/RoleContentHub'
import { RoleCalculator } from '@/components/RoleCalculator'

export const metadata: Metadata = {
  title: 'What is a Fractional CFO? | Part-Time Chief Financial Officer Guide 2025',
  description: 'What is a fractional CFO? A part-time Chief Financial Officer who provides strategic financial leadership to multiple companies. Learn about fractional CFO meaning, responsibilities, costs, and when to hire one.',
  keywords: 'what is a fractional cfo, fractional cfo meaning, fractional cfo definition, part time cfo, fractional finance officer, fractional chief financial officer, what does a fractional cfo do',
  alternates: {
    canonical: 'https://fractional.quest/fractional-cfo',
  },
  openGraph: {
    title: 'What is a Fractional CFO? | Complete Guide',
    description: 'Understand fractional CFO meaning, responsibilities, and costs. Learn when to hire a part-time Chief Financial Officer.',
    url: 'https://fractional.quest/fractional-cfo',
    images: ['/images/fractional-cfo.jpg'],
  },
}

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'What is a Fractional CFO', href: '/fractional-cfo' },
]

export default function FractionalCfoPage() {
  return (
    <div className="min-h-screen bg-white">
      <WebPageSchema
        title="What is a Fractional CFO? | Part-Time Chief Financial Officer Guide"
        description="Complete guide to fractional CFO meaning, responsibilities, costs, and when to hire one. Learn what a part-time Chief Financial Officer does."
        url="https://fractional.quest/fractional-cfo"
        dateModified={new Date('2025-01-07')}
      />
      <FAQPageSchema faqs={CFO_FAQS} />

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1920&q=80"
          alt="What is a Fractional CFO - Part-time Chief Financial Officer"
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
                Role Guide
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                What is a <strong>Fractional CFO</strong>?
              </h1>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                A <strong>fractional CFO</strong> is a part-time Chief Financial Officer who provides strategic financial leadership to companies on a flexible basis. Learn about <strong>fractional CFO meaning</strong>, responsibilities, and costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Definition Box */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-4">Fractional CFO Definition</h2>
            <p className="text-2xl font-light leading-relaxed">
              A <strong className="font-semibold">Fractional CFO</strong> (Fractional Chief Financial Officer) is an experienced finance executive who works with companies on a part-time or contract basis, typically 1-3 days per week, providing strategic financial leadership without the cost of a full-time hire.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <article className="prose prose-lg prose-gray max-w-none">

            <h2 className="text-3xl font-black text-gray-900 mb-6">What is a Fractional CFO? Understanding the Role</h2>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              The <strong>fractional CFO meaning</strong> centres on flexible, senior-level financial leadership. Unlike traditional full-time CFOs earning £130,000-£220,000 annually, a <strong>fractional Chief Financial Officer</strong> works with multiple companies simultaneously, dedicating typically 1-3 days per week to each client.
            </p>

            <p>
              This model emerged from the startup and scale-up ecosystem where companies need CFO-level expertise for fundraising, financial planning, and investor relations but cannot justify the cost of a full-time finance executive.
            </p>

            {/* Video */}
            <div className="my-10 not-prose">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What Does a Fractional CFO Do?</h3>
              <LazyYouTube
                videoId="vFTB5pWJY4A"
                title="What is a Fractional CFO? Role Explained"
              />
              <p className="text-gray-500 text-sm mt-3">Video: Understanding the fractional CFO role and responsibilities</p>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">What Does a Fractional CFO Do?</h2>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'Financial Strategy', desc: 'Developing financial plans aligned with business goals', icon: '📊' },
                { title: 'Fundraising', desc: 'Leading Series A-C rounds and investor relations', icon: '💰' },
                { title: 'Cash Management', desc: 'Optimising working capital and runway planning', icon: '🏦' },
                { title: 'FP&A', desc: 'Budgeting, forecasting, and variance analysis', icon: '📈' },
                { title: 'Board Reporting', desc: 'Investor-grade financial presentations', icon: '📋' },
                { title: 'Compliance', desc: 'Regulatory compliance and audit readiness', icon: '✅' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg">
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Fractional CFO vs Full-Time CFO</h2>

            <div className="overflow-x-auto my-8 not-prose">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Factor</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Fractional CFO</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Full-Time CFO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Annual Cost</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£40,000-£100,000</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£130,000-£250,000+</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Time Commitment</td>
                    <td className="px-6 py-4 text-sm text-gray-600">1-3 days/week</td>
                    <td className="px-6 py-4 text-sm text-gray-600">5 days/week</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Fundraising Experience</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Multiple rounds across companies</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Single company focus</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Best For</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Pre-Series B, specific projects</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Series C+, complex financials</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">When Do You Need a Fractional CFO?</h2>

            <ul className="space-y-3">
              <li><strong>Fundraising:</strong> Preparing for and executing Series A-C rounds</li>
              <li><strong>Investor readiness:</strong> Need professional financial reporting</li>
              <li><strong>Cash crisis:</strong> Runway planning and cost optimisation needed</li>
              <li><strong>Scale preparation:</strong> Financial systems for rapid growth</li>
              <li><strong>Exit planning:</strong> Preparing for M&A or IPO</li>
              <li><strong>Finance team gap:</strong> Interim senior leadership needed</li>
            </ul>

            <div className="bg-emerald-50 p-6 border border-emerald-200 rounded-lg my-8 not-prose">
              <p className="text-emerald-800 font-medium mb-3">Ready to hire a fractional CFO?</p>
              <Link href="/hire-fractional-cfo" className="inline-flex items-center text-emerald-700 font-bold hover:text-emerald-900">
                Complete Guide: How to Hire a Fractional CFO →
              </Link>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Fractional CFO Cost UK</h2>

            <div className="bg-gray-50 p-6 rounded-lg my-6 not-prose">
              <h4 className="font-bold text-gray-900 mb-4">Typical Fractional CFO Pricing</h4>
              <ul className="space-y-2 text-gray-700">
                <li><strong>1 day/week:</strong> £3,000-£5,600/month (£36,000-£67,000/year)</li>
                <li><strong>2 days/week:</strong> £6,000-£11,200/month (£72,000-£134,000/year)</li>
                <li><strong>3 days/week:</strong> £9,000-£16,800/month (£108,000-£202,000/year)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">Compare to full-time CFO: £160,000-£280,000+ (salary + benefits + equity)</p>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Types of Fractional CFO</h2>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'VC-Backed CFO', desc: 'Fundraising and investor relations', rate: '£1,100-£1,400/day' },
                { title: 'PE Portfolio CFO', desc: 'Value creation and exit planning', rate: '£1,200-£1,500/day' },
                { title: 'Scale-up CFO', desc: 'Growth finance and cash management', rate: '£900-£1,200/day' },
                { title: 'Turnaround CFO', desc: 'Restructuring and crisis management', rate: '£1,000-£1,300/day' },
              ].map((type, i) => (
                <div key={i} className="bg-gray-50 p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-1">{type.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{type.desc}</p>
                  <span className="text-emerald-700 font-semibold text-sm">{type.rate}</span>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Qualifications</h2>

            <p>
              Most <strong>fractional CFOs</strong> hold professional accounting qualifications from bodies like:
            </p>

            <ul className="space-y-2">
              <li><strong>ACA</strong> - <a href="https://www.icaew.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">ICAEW</a> (Institute of Chartered Accountants)</li>
              <li><strong>ACCA</strong> - <a href="https://www.accaglobal.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">Association of Chartered Certified Accountants</a></li>
              <li><strong>CIMA</strong> - Chartered Institute of Management Accountants</li>
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
              Fractional CFO Cost Calculator
            </h2>
          </div>
          <RoleCalculator role="cfo" />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Frequently Asked Questions About Fractional CFOs
            </h2>
          </div>
          <FAQ items={CFO_FAQS} title="" />
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Related Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/hire-fractional-cfo" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors group">
              <span className="text-2xl mb-3 block">📋</span>
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 mb-2">How to Hire a Fractional CFO</h3>
              <p className="text-gray-600 text-sm">Complete guide to hiring process</p>
            </Link>
            <Link href="/fractional-cfo-jobs-uk" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors group">
              <span className="text-2xl mb-3 block">💼</span>
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 mb-2">Fractional CFO Jobs UK</h3>
              <p className="text-gray-600 text-sm">Browse live fractional CFO roles</p>
            </Link>
            <Link href="/fractional-cfo-salary" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors group">
              <span className="text-2xl mb-3 block">💰</span>
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 mb-2">Fractional CFO Salary Guide</h3>
              <p className="text-gray-600 text-sm">UK salary benchmarks and rates</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Ready to Work with a Fractional CFO?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Browse pre-vetted fractional CFO candidates or post your requirements.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/fractional-cfo-jobs-uk"
              className="px-8 py-4 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors"
            >
              Browse Fractional CFOs
            </Link>
            <Link
              href="/hire-fractional-cfo"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-black transition-colors"
            >
              Hiring Guide
            </Link>
          </div>
        </div>
      </section>

      <RoleContentHub currentRole="cfo" />
    </div>
  )
}
