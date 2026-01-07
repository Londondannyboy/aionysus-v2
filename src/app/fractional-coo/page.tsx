import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FAQ, COO_FAQS } from '@/components/seo/FAQ'
import { BreadcrumbsLight } from '@/components/Breadcrumbs'
import { WebPageSchema } from '@/components/seo/WebPageSchema'
import { FAQPageSchema } from '@/components/seo/FAQPageSchema'
import { LazyYouTube } from '@/components/LazyYouTube'
import { RoleContentHub } from '@/components/RoleContentHub'
import { RoleCalculator } from '@/components/RoleCalculator'

export const metadata: Metadata = {
  title: 'What is a Fractional COO? | Part-Time Chief Operating Officer Guide 2025',
  description: 'What is a fractional COO? A part-time Chief Operating Officer who provides strategic operations leadership to multiple companies. Learn about fractional COO meaning, responsibilities, costs, and when to hire one.',
  keywords: 'what is a fractional coo, fractional coo meaning, fractional coo definition, part time coo, fractional operations officer, fractional chief operating officer, what does a fractional coo do',
  alternates: {
    canonical: 'https://fractional.quest/fractional-coo',
  },
  openGraph: {
    title: 'What is a Fractional COO? | Complete Guide',
    description: 'Understand fractional COO meaning, responsibilities, and costs. Learn when to hire a part-time Chief Operating Officer.',
    url: 'https://fractional.quest/fractional-coo',
    images: ['/images/fractional-coo.jpg'],
  },
}

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'What is a Fractional COO', href: '/fractional-coo' },
]

export default function FractionalCooPage() {
  return (
    <div className="min-h-screen bg-white">
      <WebPageSchema
        title="What is a Fractional COO? | Part-Time Chief Operating Officer Guide"
        description="Complete guide to fractional COO meaning, responsibilities, costs, and when to hire one. Learn what a part-time Chief Operating Officer does."
        url="https://fractional.quest/fractional-coo"
        dateModified={new Date('2025-01-07')}
      />
      <FAQPageSchema faqs={COO_FAQS} />

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80"
          alt="What is a Fractional COO - Part-time Chief Operating Officer"
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
                Role Guide
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                What is a <strong>Fractional COO</strong>?
              </h1>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                A <strong>fractional COO</strong> is a part-time Chief Operating Officer who provides strategic operations leadership to companies on a flexible basis. Learn about <strong>fractional COO meaning</strong>, responsibilities, and costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Definition Box */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Fractional COO Definition</h2>
            <p className="text-2xl font-light leading-relaxed">
              A <strong className="font-semibold">Fractional COO</strong> (Fractional Chief Operating Officer) is an experienced operations executive who works with companies on a part-time or contract basis, typically 1-3 days per week, providing strategic operational leadership without the cost of a full-time hire.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <article className="prose prose-lg prose-gray max-w-none">

            <h2 className="text-3xl font-black text-gray-900 mb-6">What is a Fractional COO? Understanding the Role</h2>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              The <strong>fractional COO meaning</strong> centres on flexible, senior-level operations leadership. Unlike traditional full-time COOs earning £100,000-£180,000 annually, a <strong>fractional Chief Operating Officer</strong> works with multiple companies simultaneously, dedicating typically 1-3 days per week to each client.
            </p>

            <p>
              This model is ideal for companies experiencing rapid growth who need operational expertise to scale processes, build teams, and optimise efficiency without the cost of a full-time executive.
            </p>

            {/* Video */}
            <div className="my-10 not-prose">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What Does a Fractional COO Do?</h3>
              <LazyYouTube
                videoId="cKxRvEZd3Mw"
                title="What is a Fractional COO? Role Explained"
              />
              <p className="text-gray-500 text-sm mt-3">Video: Understanding the fractional COO role and responsibilities</p>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">What Does a Fractional COO Do?</h2>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'Operational Strategy', desc: 'Developing operational plans for growth', icon: '📊' },
                { title: 'Process Optimisation', desc: 'Streamlining workflows and eliminating waste', icon: '⚙️' },
                { title: 'Team Scaling', desc: 'Building and structuring teams for growth', icon: '👥' },
                { title: 'Vendor Management', desc: 'Negotiating contracts and supplier relations', icon: '🤝' },
                { title: 'KPI Development', desc: 'Establishing metrics and dashboards', icon: '📈' },
                { title: 'Change Management', desc: 'Leading organisational transformation', icon: '🔄' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg">
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Fractional COO vs Full-Time COO</h2>

            <div className="overflow-x-auto my-8 not-prose">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Factor</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Fractional COO</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Full-Time COO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Annual Cost</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£35,000-£90,000</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£100,000-£200,000+</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Time Commitment</td>
                    <td className="px-6 py-4 text-sm text-gray-600">1-3 days/week</td>
                    <td className="px-6 py-4 text-sm text-gray-600">5 days/week</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Scaling Experience</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Multiple scale-ups</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Single company focus</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Best For</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Growth phase, process building</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Large enterprises, complex ops</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">When Do You Need a Fractional COO?</h2>

            <ul className="space-y-3">
              <li><strong>Rapid growth:</strong> Operations struggling to keep up with sales</li>
              <li><strong>Founder bandwidth:</strong> CEO needs to delegate operations</li>
              <li><strong>Process chaos:</strong> Workflows are ad-hoc and inefficient</li>
              <li><strong>Team scaling:</strong> Growing from 20 to 100+ employees</li>
              <li><strong>New market:</strong> Expanding to new locations or products</li>
              <li><strong>Post-acquisition:</strong> Integrating acquired companies</li>
            </ul>

            <div className="bg-slate-50 p-6 border border-slate-200 rounded-lg my-8 not-prose">
              <p className="text-slate-800 font-medium mb-3">Ready to hire a fractional COO?</p>
              <Link href="/hire-fractional-coo" className="inline-flex items-center text-slate-700 font-bold hover:text-slate-900">
                Complete Guide: How to Hire a Fractional COO →
              </Link>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Fractional COO Cost UK</h2>

            <div className="bg-gray-50 p-6 rounded-lg my-6 not-prose">
              <h4 className="font-bold text-gray-900 mb-4">Typical Fractional COO Pricing</h4>
              <ul className="space-y-2 text-gray-700">
                <li><strong>1 day/week:</strong> £2,500-£4,800/month (£30,000-£58,000/year)</li>
                <li><strong>2 days/week:</strong> £5,000-£9,600/month (£60,000-£115,000/year)</li>
                <li><strong>3 days/week:</strong> £7,500-£14,400/month (£90,000-£173,000/year)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">Compare to full-time COO: £130,000-£230,000+ (salary + benefits + equity)</p>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Types of Fractional COO</h2>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'Scale-up COO', desc: 'Rapid growth and team scaling', rate: '£900-£1,200/day' },
                { title: 'E-commerce COO', desc: 'Supply chain and fulfilment', rate: '£800-£1,100/day' },
                { title: 'Process COO', desc: 'Lean operations and efficiency', rate: '£750-£1,050/day' },
                { title: 'Integration COO', desc: 'M&A and company integration', rate: '£900-£1,200/day' },
              ].map((type, i) => (
                <div key={i} className="bg-gray-50 p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-1">{type.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{type.desc}</p>
                  <span className="text-slate-700 font-semibold text-sm">{type.rate}</span>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Benefits of a Fractional COO</h2>

            <ul className="space-y-3">
              <li><strong>Cost-effective:</strong> Access COO expertise at 40-60% of full-time cost</li>
              <li><strong>Speed:</strong> Hire in weeks, not months</li>
              <li><strong>Experience:</strong> Benefit from scaling multiple companies</li>
              <li><strong>Objectivity:</strong> Fresh perspective on operational challenges</li>
              <li><strong>Network:</strong> Access to operational talent and vendor relationships</li>
              <li><strong>Flexibility:</strong> Scale engagement as company evolves</li>
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
              Fractional COO Cost Calculator
            </h2>
          </div>
          <RoleCalculator role="coo" />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Frequently Asked Questions About Fractional COOs
            </h2>
          </div>
          <FAQ items={COO_FAQS} title="" />
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Related Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/hire-fractional-coo" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-slate-400 transition-colors group">
              <span className="text-2xl mb-3 block">📋</span>
              <h3 className="font-bold text-gray-900 group-hover:text-slate-700 mb-2">How to Hire a Fractional COO</h3>
              <p className="text-gray-600 text-sm">Complete guide to hiring process</p>
            </Link>
            <Link href="/fractional-coo-jobs-uk" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-slate-400 transition-colors group">
              <span className="text-2xl mb-3 block">💼</span>
              <h3 className="font-bold text-gray-900 group-hover:text-slate-700 mb-2">Fractional COO Jobs UK</h3>
              <p className="text-gray-600 text-sm">Browse live fractional COO roles</p>
            </Link>
            <Link href="/fractional-coo-salary" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-slate-400 transition-colors group">
              <span className="text-2xl mb-3 block">💰</span>
              <h3 className="font-bold text-gray-900 group-hover:text-slate-700 mb-2">Fractional COO Salary Guide</h3>
              <p className="text-gray-600 text-sm">UK salary benchmarks and rates</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Ready to Work with a Fractional COO?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Browse pre-vetted fractional COO candidates or post your requirements.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/fractional-coo-jobs-uk"
              className="px-8 py-4 bg-slate-500 text-white font-bold rounded-lg hover:bg-slate-400 transition-colors"
            >
              Browse Fractional COOs
            </Link>
            <Link
              href="/hire-fractional-coo"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-black transition-colors"
            >
              Hiring Guide
            </Link>
          </div>
        </div>
      </section>

      <RoleContentHub currentRole="coo" />
    </div>
  )
}
