import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FAQ, CTO_FAQS } from '@/components/seo/FAQ'
import { BreadcrumbsLight } from '@/components/Breadcrumbs'
import { WebPageSchema } from '@/components/seo/WebPageSchema'
import { FAQPageSchema } from '@/components/seo/FAQPageSchema'
import { LazyYouTube } from '@/components/LazyYouTube'
import { RoleContentHub } from '@/components/RoleContentHub'
import { RoleCalculator } from '@/components/RoleCalculator'

export const metadata: Metadata = {
  title: 'What is a Fractional CTO? | Part-Time Chief Technology Officer Guide 2025',
  description: 'What is a fractional CTO? A part-time Chief Technology Officer who provides strategic technology leadership to multiple companies. Learn about fractional CTO meaning, responsibilities, costs, and when to hire one.',
  keywords: 'what is a fractional cto, fractional cto meaning, fractional cto definition, part time cto, fractional technology officer, fractional chief technology officer, what does a fractional cto do',
  alternates: {
    canonical: 'https://fractional.quest/fractional-cto',
  },
  openGraph: {
    title: 'What is a Fractional CTO? | Complete Guide',
    description: 'Understand fractional CTO meaning, responsibilities, and costs. Learn when to hire a part-time Chief Technology Officer.',
    url: 'https://fractional.quest/fractional-cto',
    images: ['/images/fractional-cto.jpg'],
  },
}

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'What is a Fractional CTO', href: '/fractional-cto' },
]

export default function FractionalCtoPage() {
  return (
    <div className="min-h-screen bg-white">
      <WebPageSchema
        title="What is a Fractional CTO? | Part-Time Chief Technology Officer Guide"
        description="Complete guide to fractional CTO meaning, responsibilities, costs, and when to hire one. Learn what a part-time Chief Technology Officer does."
        url="https://fractional.quest/fractional-cto"
        dateModified={new Date('2025-01-07')}
      />
      <FAQPageSchema faqs={CTO_FAQS} />

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1920&q=80"
          alt="What is a Fractional CTO - Part-time Chief Technology Officer"
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
                Role Guide
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                What is a <strong>Fractional CTO</strong>?
              </h1>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                A <strong>fractional CTO</strong> is a part-time Chief Technology Officer who provides strategic technology leadership to companies on a flexible basis. Learn about <strong>fractional CTO meaning</strong>, responsibilities, and costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Definition Box */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-4">Fractional CTO Definition</h2>
            <p className="text-2xl font-light leading-relaxed">
              A <strong className="font-semibold">Fractional CTO</strong> (Fractional Chief Technology Officer) is an experienced technology executive who works with companies on a part-time or contract basis, typically 1-3 days per week, providing strategic technology leadership without the cost of a full-time hire.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <article className="prose prose-lg prose-gray max-w-none">

            <h2 className="text-3xl font-black text-gray-900 mb-6">What is a Fractional CTO? Understanding the Role</h2>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              The <strong>fractional CTO meaning</strong> centres on flexible, senior-level technology leadership. Unlike traditional full-time CTOs earning £150,000-£250,000 annually, a <strong>fractional Chief Technology Officer</strong> works with multiple companies simultaneously, dedicating typically 1-3 days per week to each client.
            </p>

            <p>
              This model emerged from the startup ecosystem where companies need CTO-level expertise but cannot justify or afford a full-time executive. The <strong>fractional CTO</strong> brings the same strategic thinking, technical leadership, and engineering expertise as a full-time CTO, but on a fractional basis.
            </p>

            {/* Video */}
            <div className="my-10 not-prose">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What Does a Fractional CTO Do?</h3>
              <LazyYouTube
                videoId="8xLjRN-JFiE"
                title="What is a Fractional CTO? Role Explained"
              />
              <p className="text-gray-500 text-sm mt-3">Video: Understanding the fractional CTO role and responsibilities</p>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">What Does a Fractional CTO Do?</h2>

            <p>
              A <strong>fractional CTO</strong> performs the same functions as a full-time Chief Technology Officer, but on a part-time basis. Their responsibilities typically include:
            </p>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'Technical Strategy', desc: 'Developing technology roadmaps aligned with business objectives', icon: '🎯' },
                { title: 'Architecture Design', desc: 'Building scalable, secure, and maintainable system architectures', icon: '🏗️' },
                { title: 'Team Leadership', desc: 'Building, mentoring, and managing engineering teams', icon: '👥' },
                { title: 'Tech Stack Decisions', desc: 'Selecting technologies and frameworks for optimal performance', icon: '⚙️' },
                { title: 'Code Quality', desc: 'Establishing engineering best practices and standards', icon: '✅' },
                { title: 'Security & Compliance', desc: 'Implementing security protocols and regulatory compliance', icon: '🔒' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg">
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Fractional CTO vs Full-Time CTO</h2>

            <div className="overflow-x-auto my-8 not-prose">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Factor</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Fractional CTO</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Full-Time CTO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Annual Cost</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£50,000-£120,000</td>
                    <td className="px-6 py-4 text-sm text-gray-600">£150,000-£300,000+</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Time Commitment</td>
                    <td className="px-6 py-4 text-sm text-gray-600">1-3 days/week</td>
                    <td className="px-6 py-4 text-sm text-gray-600">5 days/week</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Tech Breadth</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Multiple stacks, diverse experience</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Deep single-stack focus</td>
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
                    <td className="px-6 py-4 text-sm text-gray-600">Startups, MVPs, scaling phase</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Large enterprises, complex systems</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">When Do You Need a Fractional CTO?</h2>

            <ul className="space-y-3">
              <li><strong>Building MVP:</strong> Need technical leadership to build your first product</li>
              <li><strong>Non-technical founders:</strong> Founders without tech background need technical strategy</li>
              <li><strong>Scale preparation:</strong> Architecture review before major growth phase</li>
              <li><strong>Tech debt:</strong> Legacy systems need modernisation strategy</li>
              <li><strong>Team gap:</strong> After losing a tech leader and needing interim expertise</li>
              <li><strong>Due diligence:</strong> Investors require technical leadership credibility</li>
            </ul>

            <div className="bg-cyan-50 p-6 border border-cyan-200 rounded-lg my-8 not-prose">
              <p className="text-cyan-800 font-medium mb-3">Ready to hire a fractional CTO?</p>
              <Link href="/hire-fractional-cto" className="inline-flex items-center text-cyan-700 font-bold hover:text-cyan-900">
                Complete Guide: How to Hire a Fractional CTO →
              </Link>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Fractional CTO Cost UK</h2>

            <div className="bg-gray-50 p-6 rounded-lg my-6 not-prose">
              <h4 className="font-bold text-gray-900 mb-4">Typical Fractional CTO Pricing</h4>
              <ul className="space-y-2 text-gray-700">
                <li><strong>1 day/week:</strong> £4,000-£6,400/month (£48,000-£77,000/year)</li>
                <li><strong>2 days/week:</strong> £8,000-£12,800/month (£96,000-£154,000/year)</li>
                <li><strong>3 days/week:</strong> £12,000-£19,200/month (£144,000-£230,000/year)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">Compare to full-time CTO total cost: £200,000-£400,000+ (salary + benefits + equity)</p>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Types of Fractional CTO</h2>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'Startup CTO', desc: 'Building technical foundations 0-to-1', rate: '£1,000-£1,400/day' },
                { title: 'Scale-up CTO', desc: 'Architecture for growth, team building', rate: '£1,200-£1,600/day' },
                { title: 'AI/ML CTO', desc: 'Machine learning and data infrastructure', rate: '£1,300-£1,800/day' },
                { title: 'Security-focused CTO', desc: 'FinTech, HealthTech compliance', rate: '£1,200-£1,600/day' },
              ].map((type, i) => (
                <div key={i} className="bg-gray-50 p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-1">{type.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{type.desc}</p>
                  <span className="text-cyan-700 font-semibold text-sm">{type.rate}</span>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-black text-gray-900 mt-16 mb-6">Benefits of a Fractional CTO</h2>

            <ul className="space-y-3">
              <li><strong>Cost-effective:</strong> Access CTO expertise at 30-50% of full-time cost</li>
              <li><strong>Speed:</strong> Hire in weeks, not months</li>
              <li><strong>Experience:</strong> Benefit from building multiple products</li>
              <li><strong>Objectivity:</strong> Fresh perspective on technical decisions</li>
              <li><strong>Network:</strong> Access to engineering talent and technical vendors</li>
              <li><strong>Flexibility:</strong> Scale engagement as product evolves</li>
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
              Fractional CTO Cost Calculator
            </h2>
          </div>
          <RoleCalculator role="cto" />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Frequently Asked Questions About Fractional CTOs
            </h2>
          </div>
          <FAQ items={CTO_FAQS} title="" />
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Related Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/hire-fractional-cto" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors group">
              <span className="text-2xl mb-3 block">📋</span>
              <h3 className="font-bold text-gray-900 group-hover:text-cyan-700 mb-2">How to Hire a Fractional CTO</h3>
              <p className="text-gray-600 text-sm">Complete guide to hiring process</p>
            </Link>
            <Link href="/fractional-cto-jobs-uk" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors group">
              <span className="text-2xl mb-3 block">💼</span>
              <h3 className="font-bold text-gray-900 group-hover:text-cyan-700 mb-2">Fractional CTO Jobs UK</h3>
              <p className="text-gray-600 text-sm">Browse live fractional CTO roles</p>
            </Link>
            <Link href="/fractional-cto-salary" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors group">
              <span className="text-2xl mb-3 block">💰</span>
              <h3 className="font-bold text-gray-900 group-hover:text-cyan-700 mb-2">Fractional CTO Salary Guide</h3>
              <p className="text-gray-600 text-sm">UK salary benchmarks and rates</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Ready to Work with a Fractional CTO?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Browse pre-vetted fractional CTO candidates or post your requirements to find the perfect match.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/fractional-cto-jobs-uk"
              className="px-8 py-4 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors"
            >
              Browse Fractional CTOs
            </Link>
            <Link
              href="/hire-fractional-cto"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-black transition-colors"
            >
              Hiring Guide
            </Link>
          </div>
        </div>
      </section>

      <RoleContentHub currentRole="cto" />
    </div>
  )
}
