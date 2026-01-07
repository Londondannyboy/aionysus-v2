import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FAQ, CMO_FAQS } from '@/components/seo/FAQ'
import { BreadcrumbsLight } from '@/components/Breadcrumbs'
import { WebPageSchema } from '@/components/seo/WebPageSchema'
import { FAQPageSchema } from '@/components/seo/FAQPageSchema'
import { LazyYouTube } from '@/components/LazyYouTube'
import { RoleContentHub } from '@/components/RoleContentHub'
import { RoleCalculator } from '@/components/RoleCalculator'

export const metadata: Metadata = {
  title: 'What is a Fractional CMO? | Part-Time Chief Marketing Officer Guide 2025',
  description: 'What is a fractional CMO? A part-time Chief Marketing Officer who provides strategic marketing leadership to multiple companies. Learn about fractional CMO meaning, responsibilities, costs, and when to hire one.',
  keywords: 'what is a fractional cmo, fractional cmo meaning, fractional cmo definition, part time cmo, fractional marketing officer, fractional chief marketing officer, what does a fractional cmo do',
  alternates: {
    canonical: 'https://fractional.quest/fractional-cmo',
  },
  openGraph: {
    title: 'What is a Fractional CMO? | Complete Guide',
    description: 'Understand fractional CMO meaning, responsibilities, and costs. Learn when to hire a part-time Chief Marketing Officer.',
    url: 'https://fractional.quest/fractional-cmo',
    images: ['/images/fractional-cmo.jpg'],
  },
}

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'What is a Fractional CMO', href: '/fractional-cmo' },
]

export default function FractionalCmoPage() {
  return (
    <div className="min-h-screen bg-white">
      <WebPageSchema
        title="What is a Fractional CMO? | Part-Time Chief Marketing Officer Guide"
        description="Complete guide to fractional CMO meaning, responsibilities, costs, and when to hire one. Learn what a part-time Chief Marketing Officer does."
        url="https://fractional.quest/fractional-cmo"
        dateModified={new Date('2025-01-07')}
      />
      <FAQPageSchema faqs={CMO_FAQS} />

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&q=80"
          alt="What is a Fractional CMO - Part-time Chief Marketing Officer"
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
                Role Guide
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                What is a <strong>Fractional CMO</strong>?
              </h1>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                A <strong>fractional CMO</strong> is a part-time Chief Marketing Officer who provides strategic marketing leadership to companies on a flexible basis. Learn about <strong>fractional CMO meaning</strong>, responsibilities, and costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Definition Box */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400 mb-4">Fractional CMO Definition</h2>
            <p className="text-2xl font-light leading-relaxed">
              A <strong className="font-semibold">Fractional CMO</strong> (Fractional Chief Marketing Officer) is an experienced marketing executive who works with companies on a part-time or contract basis, typically 1-3 days per week, providing strategic marketing leadership without the cost of a full-time hire.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <article className="prose prose-lg prose-gray max-w-none">

            {/* What is a Fractional CMO */}
            <h2 className="text-3xl font-black text-gray-900 mb-6">What is a Fractional CMO? Understanding the Role</h2>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              The <strong>fractional CMO meaning</strong> centres on flexible, senior-level marketing leadership. Unlike traditional full-time CMOs earning £150,000-£250,000 annually, a <strong>fractional Chief Marketing Officer</strong> works with multiple companies simultaneously, dedicating typically 1-3 days per week to each client.
            </p>

            <p>
              This model emerged from the startup and scale-up ecosystem where companies need CMO-level expertise but cannot justify or afford a full-time executive. The <strong>fractional CMO</strong> brings the same strategic thinking, leadership skills, and marketing expertise as a full-time CMO, but on a fractional basis.
            </p>

            {/* Video */}
            <div className="my-10 not-prose">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What Does a Fractional CMO Do?</h3>
              <LazyYouTube
                videoId="L8vLq6nqQdM"
                title="What is a Fractional CMO? Role Explained"
              />
              <p className="text-gray-500 text-sm mt-3">Video: Understanding the fractional CMO role and responsibilities</p>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">What Does a Fractional CMO Do?</h2>

            <p>
              A <strong>fractional CMO</strong> performs the same functions as a full-time Chief Marketing Officer, but on a part-time basis. Their responsibilities typically include:
            </p>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'Marketing Strategy', desc: 'Developing comprehensive marketing strategies aligned with business goals', icon: '🎯' },
                { title: 'Team Leadership', desc: 'Building, mentoring, and managing internal marketing teams and agencies', icon: '👥' },
                { title: 'Brand Development', desc: 'Defining brand positioning, messaging, and go-to-market strategies', icon: '💎' },
                { title: 'Demand Generation', desc: 'Creating and optimising lead generation and pipeline acceleration programs', icon: '📈' },
                { title: 'Budget Management', desc: 'Allocating marketing budgets and maximising ROI across channels', icon: '💰' },
                { title: 'Board Reporting', desc: 'Presenting marketing metrics and strategies to leadership and investors', icon: '📊' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg">
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Fractional CMO vs Full-Time CMO</h2>

            <p>
              Understanding the difference between a <strong>fractional CMO</strong> and full-time CMO helps companies make the right hiring decision:
            </p>

            <div className="overflow-x-auto my-8 not-prose">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Factor</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Fractional CMO</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Full-Time CMO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Annual Cost</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£40,000-£100,000</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£150,000-£250,000+</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Time Commitment</td>
                    <td className="px-6 py-4 text-sm text-gray-600">1-3 days/week</td>
                    <td className="px-6 py-4 text-sm text-gray-600">5 days/week</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Experience Breadth</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Multiple companies, diverse insights</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Single company focus</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Flexibility</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Scale up/down easily</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Fixed commitment</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Hiring Speed</td>
                    <td className="px-6 py-4 text-sm text-gray-600">2-4 weeks</td>
                    <td className="px-6 py-4 text-sm text-gray-600">3-6 months</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Best For</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Startups, SMEs, specific projects</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Large enterprises, complex orgs</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">When Do You Need a Fractional CMO?</h2>

            <p>
              Companies typically hire a <strong>fractional CMO</strong> in these situations:
            </p>

            <ul className="space-y-3">
              <li><strong>Post-funding:</strong> After raising seed or Series A and needing to build marketing function</li>
              <li><strong>Growth plateau:</strong> When existing marketing efforts have stalled and need strategic direction</li>
              <li><strong>Team gap:</strong> After losing a marketing leader and needing interim expertise</li>
              <li><strong>Scale preparation:</strong> Before hiring a full-time CMO to establish processes and strategy</li>
              <li><strong>Budget constraints:</strong> When full-time CMO salary is beyond current financial means</li>
              <li><strong>Specialised projects:</strong> For specific initiatives like rebranding, market expansion, or GTM</li>
            </ul>

            <div className="bg-amber-50 p-6 border border-amber-200 rounded-lg my-8 not-prose">
              <p className="text-amber-800 font-medium mb-3">Ready to hire a fractional CMO?</p>
              <Link href="/hire-fractional-cmo" className="inline-flex items-center text-amber-700 font-bold hover:text-amber-900">
                Complete Guide: How to Hire a Fractional CMO →
              </Link>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Fractional CMO Cost UK</h2>

            <p>
              <strong>Fractional CMO</strong> costs in the UK typically range from £700-£1,400 per day, depending on experience and specialisation. Most engagements are structured as:
            </p>

            <div className="bg-gray-50 p-6 rounded-lg my-6 not-prose">
              <h4 className="font-bold text-gray-900 mb-4">Typical Fractional CMO Pricing</h4>
              <ul className="space-y-2 text-gray-700">
                <li><strong>1 day/week:</strong> £3,000-£5,600/month (£36,000-£67,000/year)</li>
                <li><strong>2 days/week:</strong> £6,000-£11,200/month (£72,000-£134,000/year)</li>
                <li><strong>3 days/week:</strong> £9,000-£16,800/month (£108,000-£201,600/year)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">Compare to full-time CMO total cost: £180,000-£300,000+ (salary + benefits + equity)</p>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">How to Find a Fractional CMO</h2>

            <p>
              Finding the right <strong>fractional CMO</strong> requires knowing where to look:
            </p>

            <ul className="space-y-3">
              <li><strong>Fractional job boards:</strong> Platforms like <Link href="/fractional-cmo-jobs-uk" className="text-amber-700 hover:underline">Fractional.Quest</Link> with pre-vetted candidates</li>
              <li><strong>LinkedIn:</strong> Search "#FractionalCMO" or "#PortfolioCMO" for active practitioners</li>
              <li><strong>Referrals:</strong> Ask your investors, advisors, or founder network</li>
              <li><strong>Agencies:</strong> Fractional executive networks and marketplaces</li>
              <li><strong>Communities:</strong> Marketing Slack groups, Pavilion, and industry associations</li>
            </ul>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Fractional CMO vs Marketing Consultant</h2>

            <p>
              While sometimes confused, there are key differences between a <strong>fractional CMO</strong> and a marketing consultant:
            </p>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-3">Fractional CMO</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Embedded in the leadership team</li>
                  <li>• Ongoing strategic responsibility</li>
                  <li>• Manages team and agencies</li>
                  <li>• Accountable for results</li>
                  <li>• Part of company culture</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-3">Marketing Consultant</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• External advisory role</li>
                  <li>• Project-based scope</li>
                  <li>• Provides recommendations</li>
                  <li>• Limited execution involvement</li>
                  <li>• Less day-to-day presence</li>
                </ul>
              </div>
            </div>

            {/* Second Video */}
            <div className="my-10 not-prose">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Fractional CMO vs Marketing Consultant</h3>
              <LazyYouTube
                videoId="R8xXiQA7F5o"
                title="Fractional CMO vs Marketing Consultant"
              />
              <p className="text-gray-500 text-sm mt-3">Video: Understanding the differences between fractional CMO and consultant roles</p>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Benefits of Hiring a Fractional CMO</h2>

            <ul className="space-y-3">
              <li><strong>Cost-effective:</strong> Access CMO expertise at 30-50% of full-time cost</li>
              <li><strong>Speed:</strong> Hire in weeks, not months</li>
              <li><strong>Flexibility:</strong> Scale engagement up or down as needs change</li>
              <li><strong>Experience:</strong> Benefit from exposure to multiple companies and industries</li>
              <li><strong>Objectivity:</strong> Fresh perspective without internal politics</li>
              <li><strong>Network:</strong> Access to the CMO&apos;s professional network of talent and vendors</li>
              <li><strong>Mentorship:</strong> Develop your internal team under senior leadership</li>
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
              Fractional CMO Cost Calculator
            </h2>
          </div>
          <RoleCalculator role="cmo" />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Frequently Asked Questions About Fractional CMOs
            </h2>
          </div>
          <FAQ items={CMO_FAQS} title="" />
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Related Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/hire-fractional-cmo" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors group">
              <span className="text-2xl mb-3 block">📋</span>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-700 mb-2">How to Hire a Fractional CMO</h3>
              <p className="text-gray-600 text-sm">Complete guide to hiring process</p>
            </Link>
            <Link href="/fractional-cmo-jobs-uk" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors group">
              <span className="text-2xl mb-3 block">💼</span>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-700 mb-2">Fractional CMO Jobs UK</h3>
              <p className="text-gray-600 text-sm">Browse live fractional CMO roles</p>
            </Link>
            <Link href="/fractional-cmo-salary" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors group">
              <span className="text-2xl mb-3 block">💰</span>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-700 mb-2">Fractional CMO Salary Guide</h3>
              <p className="text-gray-600 text-sm">UK salary benchmarks and rates</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Ready to Work with a Fractional CMO?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Browse pre-vetted fractional CMO candidates or post your requirements to find the perfect match.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/fractional-cmo-jobs-uk"
              className="px-8 py-4 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
            >
              Browse Fractional CMOs
            </Link>
            <Link
              href="/hire-fractional-cmo"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-black transition-colors"
            >
              Hiring Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Content Hub */}
      <RoleContentHub currentRole="cmo" />
    </div>
  )
}
