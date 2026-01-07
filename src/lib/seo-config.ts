/**
 * SEO Configuration for Fractional Quest
 * Centralized internal linking structure for optimal SEO
 */

export type RoleType =
  | 'cfo' | 'cto' | 'cmo' | 'coo' | 'ceo'
  | 'chro' | 'ciso' | 'cio' | 'cpo' | 'cdo' | 'cro' | 'cco'
  | 'cao' | 'cgo' | 'cso' | 'hr' | 'compliance' | 'legal' | 'dpo'
  | 'product' | 'project' | 'md' | 'fd' | 'fc' | 'ai' | 'growth'
  | 'sales' | 'bd' | 'recruiter' | 'general'

export interface RoleConfig {
  name: string
  fullName: string
  jobsPath: string
  servicesPath: string
  guidePath: string
  salaryPath: string
  howToBecomePath?: string
  vsFullTimePath?: string
  forStartupsPath?: string
  costPath?: string
  hourlyRatePath?: string
  interimPath?: string
  category: 'Finance' | 'Technology' | 'Marketing' | 'Operations' | 'HR' | 'Security' | 'Executive'
}

export const roleConfigs: Record<RoleType, RoleConfig> = {
  cfo: {
    name: 'CFO',
    fullName: 'Chief Financial Officer',
    jobsPath: '/fractional-cfo-jobs-uk',
    servicesPath: '/fractional-cfo-services',
    guidePath: '/fractional-cfo',
    salaryPath: '/fractional-cfo-salary',
    howToBecomePath: '/how-to-become-fractional-cfo',
    vsFullTimePath: '/fractional-cfo-vs-full-time',
    forStartupsPath: '/fractional-cfo-for-startups',
    costPath: '/fractional-cfo-cost',
    hourlyRatePath: '/fractional-cfo-hourly-rate',
    interimPath: '/interim-cfo',
    category: 'Finance',
  },
  cto: {
    name: 'CTO',
    fullName: 'Chief Technology Officer',
    jobsPath: '/fractional-cto-jobs-uk',
    servicesPath: '/fractional-cto-services',
    guidePath: '/fractional-cto',
    salaryPath: '/fractional-cto-salary',
    howToBecomePath: '/how-to-become-a-fractional-cto',
    forStartupsPath: '/fractional-cto-for-startups',
    costPath: '/fractional-cto-cost',
    hourlyRatePath: '/fractional-cto-hourly-rate',
    interimPath: '/interim-cto',
    category: 'Technology',
  },
  cmo: {
    name: 'CMO',
    fullName: 'Chief Marketing Officer',
    jobsPath: '/fractional-cmo-jobs-uk',
    servicesPath: '/fractional-cmo-services',
    guidePath: '/fractional-cmo',
    salaryPath: '/fractional-cmo-salary',
    costPath: '/fractional-cmo-cost',
    interimPath: '/interim-cmo',
    category: 'Marketing',
  },
  coo: {
    name: 'COO',
    fullName: 'Chief Operating Officer',
    jobsPath: '/fractional-coo-jobs-uk',
    servicesPath: '/fractional-coo-services',
    guidePath: '/fractional-coo',
    salaryPath: '/fractional-coo-salary',
    howToBecomePath: '/how-to-become-fractional-coo',
    forStartupsPath: '/fractional-coo-for-startups',
    costPath: '/fractional-coo-cost',
    interimPath: '/interim-coo',
    category: 'Operations',
  },
  ceo: {
    name: 'CEO',
    fullName: 'Chief Executive Officer',
    jobsPath: '/fractional-ceo-jobs-uk',
    servicesPath: '/fractional-ceo-services',
    guidePath: '/fractional-ceo',
    salaryPath: '/fractional-ceo-salary',
    interimPath: '/interim-ceo',
    category: 'Executive',
  },
  chro: {
    name: 'CHRO',
    fullName: 'Chief Human Resources Officer',
    jobsPath: '/fractional-chro-jobs-uk',
    servicesPath: '/fractional-chro-services',
    guidePath: '/fractional-chro',
    salaryPath: '/fractional-hr-salary',
    interimPath: '/interim-chro',
    category: 'HR',
  },
  ciso: {
    name: 'CISO',
    fullName: 'Chief Information Security Officer',
    jobsPath: '/fractional-ciso-jobs-uk',
    servicesPath: '/fractional-ciso-services',
    guidePath: '/fractional-ciso',
    salaryPath: '/fractional-ciso-salary',
    interimPath: '/interim-ciso',
    category: 'Security',
  },
  cio: {
    name: 'CIO',
    fullName: 'Chief Information Officer',
    jobsPath: '/fractional-cio-jobs-uk',
    servicesPath: '/fractional-cio-services',
    guidePath: '/fractional-cio',
    salaryPath: '/fractional-cio-salary',
    interimPath: '/interim-cio',
    category: 'Technology',
  },
  cpo: {
    name: 'CPO',
    fullName: 'Chief Product Officer',
    jobsPath: '/fractional-cpo-jobs-uk',
    servicesPath: '/fractional-cpo-services',
    guidePath: '/fractional-cpo',
    salaryPath: '/fractional-cpo-salary',
    category: 'Technology',
  },
  cdo: {
    name: 'CDO',
    fullName: 'Chief Data Officer',
    jobsPath: '/fractional-cdo-jobs-uk',
    servicesPath: '/fractional-cdo-services',
    guidePath: '/fractional-cdo',
    salaryPath: '/fractional-cdo-salary',
    category: 'Technology',
  },
  cro: {
    name: 'CRO',
    fullName: 'Chief Revenue Officer',
    jobsPath: '/fractional-cro-jobs-uk',
    servicesPath: '/fractional-cro-services',
    guidePath: '/fractional-cro',
    salaryPath: '/fractional-cro-salary',
    category: 'Executive',
  },
  cco: {
    name: 'CCO',
    fullName: 'Chief Commercial Officer',
    jobsPath: '/fractional-cco-jobs-uk',
    servicesPath: '/fractional-cco-services',
    guidePath: '/fractional-cco',
    salaryPath: '/fractional-cco-salary',
    category: 'Executive',
  },
  cao: {
    name: 'CAO',
    fullName: 'Chief Administrative Officer',
    jobsPath: '/fractional-cao-jobs-uk',
    servicesPath: '/fractional-cao-services',
    guidePath: '/fractional-cao',
    salaryPath: '/fractional-cao-salary',
    category: 'Operations',
  },
  cgo: {
    name: 'CGO',
    fullName: 'Chief Growth Officer',
    jobsPath: '/fractional-cgo-jobs-uk',
    servicesPath: '/fractional-cgo-services',
    guidePath: '/fractional-cgo',
    salaryPath: '/fractional-cgo-salary',
    category: 'Executive',
  },
  cso: {
    name: 'CSO',
    fullName: 'Chief Strategy Officer',
    jobsPath: '/fractional-cso-jobs-uk',
    servicesPath: '/fractional-cso-services',
    guidePath: '/fractional-cso',
    salaryPath: '/fractional-cso-salary',
    category: 'Executive',
  },
  hr: {
    name: 'HR Director',
    fullName: 'HR Director',
    jobsPath: '/fractional-hr-jobs-uk',
    servicesPath: '/fractional-hr-services',
    guidePath: '/what-is-fractional-hr',
    salaryPath: '/fractional-hr-salary',
    category: 'HR',
  },
  compliance: {
    name: 'Compliance Officer',
    fullName: 'Compliance Officer',
    jobsPath: '/fractional-compliance-jobs-uk',
    servicesPath: '/fractional-compliance-services',
    guidePath: '/fractional-compliance',
    salaryPath: '/compliance-officer-salary-uk',
    category: 'Operations',
  },
  legal: {
    name: 'Legal Counsel',
    fullName: 'General Counsel',
    jobsPath: '/fractional-legal-jobs-uk',
    servicesPath: '/fractional-legal-services',
    guidePath: '/fractional-legal',
    salaryPath: '/fractional-legal-salary',
    category: 'Operations',
  },
  dpo: {
    name: 'DPO',
    fullName: 'Data Protection Officer',
    jobsPath: '/fractional-dpo-jobs-uk',
    servicesPath: '/fractional-dpo-services',
    guidePath: '/fractional-dpo',
    salaryPath: '/fractional-dpo-salary',
    category: 'Operations',
  },
  product: {
    name: 'Product Manager',
    fullName: 'Product Manager',
    jobsPath: '/fractional-product-manager-jobs-uk',
    servicesPath: '/fractional-product-manager-services',
    guidePath: '/fractional-product-manager',
    salaryPath: '/fractional-product-manager-salary',
    category: 'Technology',
  },
  project: {
    name: 'Project Manager',
    fullName: 'Project Manager',
    jobsPath: '/fractional-project-manager-jobs-uk',
    servicesPath: '/fractional-project-manager-services',
    guidePath: '/fractional-project-manager',
    salaryPath: '/fractional-project-manager-salary',
    category: 'Operations',
  },
  md: {
    name: 'Managing Director',
    fullName: 'Managing Director',
    jobsPath: '/fractional-managing-director-jobs-uk',
    servicesPath: '/fractional-managing-director-services',
    guidePath: '/fractional-managing-director',
    salaryPath: '/fractional-managing-director-salary',
    category: 'Executive',
  },
  fd: {
    name: 'Finance Director',
    fullName: 'Finance Director',
    jobsPath: '/fractional-finance-director-jobs-uk',
    servicesPath: '/fractional-finance-director-services',
    guidePath: '/fractional-finance-director',
    salaryPath: '/fractional-finance-director-salary',
    category: 'Finance',
  },
  fc: {
    name: 'Financial Controller',
    fullName: 'Financial Controller',
    jobsPath: '/fractional-financial-controller-jobs-uk',
    servicesPath: '/fractional-financial-controller-services',
    guidePath: '/fractional-financial-controller',
    salaryPath: '/fractional-financial-controller-salary',
    category: 'Finance',
  },
  ai: {
    name: 'Head of AI',
    fullName: 'Head of AI',
    jobsPath: '/fractional-head-of-ai-jobs-uk',
    servicesPath: '/fractional-ai-services',
    guidePath: '/fractional-head-of-ai',
    salaryPath: '/fractional-head-of-ai-salary',
    category: 'Technology',
  },
  growth: {
    name: 'Head of Growth',
    fullName: 'Head of Growth',
    jobsPath: '/fractional-head-of-growth-jobs-uk',
    servicesPath: '/fractional-growth-services',
    guidePath: '/fractional-head-of-growth',
    salaryPath: '/fractional-head-of-growth-salary',
    category: 'Marketing',
  },
  sales: {
    name: 'Sales Director',
    fullName: 'Sales Director',
    jobsPath: '/fractional-sales-director-jobs-uk',
    servicesPath: '/fractional-sales-director-services',
    guidePath: '/fractional-sales-director',
    salaryPath: '/fractional-sales-director-salary',
    category: 'Executive',
  },
  bd: {
    name: 'Business Development',
    fullName: 'Business Development Director',
    jobsPath: '/fractional-business-development-jobs-uk',
    servicesPath: '/fractional-business-development-services',
    guidePath: '/fractional-business-development',
    salaryPath: '/fractional-business-development-salary',
    category: 'Executive',
  },
  recruiter: {
    name: 'Recruiter',
    fullName: 'Internal Recruiter',
    jobsPath: '/fractional-recruiter-jobs-uk',
    servicesPath: '/fractional-recruitment-services',
    guidePath: '/fractional-recruiter',
    salaryPath: '/fractional-recruiter-salary',
    category: 'HR',
  },
  general: {
    name: 'Executive',
    fullName: 'Fractional Executive',
    jobsPath: '/fractional-jobs-uk',
    servicesPath: '/fractional-services',
    guidePath: '/guide',
    salaryPath: '/fractional-executive-salary',
    category: 'Executive',
  },
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

/**
 * Generate breadcrumb items for a role-based page
 */
export function getRoleBreadcrumbs(
  role: RoleType,
  pageType: 'jobs' | 'services' | 'guide' | 'salary' | 'howTo' | 'comparison' | 'startups' | 'cost' | 'rate' | 'interim',
  customLabel?: string
): BreadcrumbItem[] {
  const config = roleConfigs[role]

  const breadcrumbs: BreadcrumbItem[] = []

  switch (pageType) {
    case 'jobs':
      breadcrumbs.push(
        { label: 'Jobs', href: '/fractional-jobs' },
        { label: `${config.name} Jobs` }
      )
      break
    case 'services':
      breadcrumbs.push(
        { label: 'Hire', href: '/contact/companies' },
        { label: `Hire a ${config.name}` }
      )
      break
    case 'guide':
      breadcrumbs.push(
        { label: 'Guides', href: '/guide' },
        { label: `What is a Fractional ${config.name}?` }
      )
      break
    case 'salary':
      breadcrumbs.push(
        { label: 'Salary Guides', href: '/fractional-cfo-salary' },
        { label: `${config.name} Salary` }
      )
      break
    case 'howTo':
      breadcrumbs.push(
        { label: 'Career Guides' },
        { label: `Become a ${config.name}` }
      )
      break
    case 'comparison':
      breadcrumbs.push(
        { label: 'Guides', href: '/guide' },
        { label: `${config.name}: Fractional vs Full-Time` }
      )
      break
    case 'startups':
      breadcrumbs.push(
        { label: `${config.name} Services`, href: config.servicesPath },
        { label: `${config.name} for Startups` }
      )
      break
    case 'cost':
      breadcrumbs.push(
        { label: `${config.name} Services`, href: config.servicesPath },
        { label: `${config.name} Cost` }
      )
      break
    case 'rate':
      breadcrumbs.push(
        { label: `${config.name} Salary`, href: config.salaryPath },
        { label: `${config.name} Hourly Rate` }
      )
      break
    case 'interim':
      breadcrumbs.push(
        { label: `${config.name} Services`, href: config.servicesPath },
        { label: `Interim ${config.name}` }
      )
      break
    default:
      breadcrumbs.push({ label: customLabel || config.name })
  }

  return breadcrumbs
}

/**
 * Get related links for a role (for RelatedContent component)
 */
export function getRelatedRoleLinks(role: RoleType, currentPage: 'jobs' | 'services' | 'guide' | 'salary') {
  const config = roleConfigs[role]

  const links = {
    forBusinesses: [
      { label: `${config.name} Services`, href: config.servicesPath, current: currentPage === 'services' },
      ...(config.vsFullTimePath ? [{ label: 'Fractional vs Full-Time', href: config.vsFullTimePath }] : []),
      ...(config.costPath ? [{ label: `${config.name} Cost Guide`, href: config.costPath }] : []),
      ...(config.hourlyRatePath ? [{ label: `${config.name} Rates`, href: config.hourlyRatePath }] : []),
      ...(config.forStartupsPath ? [{ label: `${config.name} for Startups`, href: config.forStartupsPath }] : []),
    ],
    forProfessionals: [
      { label: `${config.name} Jobs`, href: config.jobsPath, current: currentPage === 'jobs' },
      { label: `${config.name} Salary Guide`, href: config.salaryPath, current: currentPage === 'salary' },
      ...(config.howToBecomePath ? [{ label: `Become a ${config.name}`, href: config.howToBecomePath }] : []),
      ...(config.interimPath ? [{ label: `Interim ${config.name}`, href: config.interimPath }] : []),
    ],
    guides: [
      { label: `What is a Fractional ${config.name}?`, href: config.guidePath, current: currentPage === 'guide' },
    ],
    otherRoles: Object.entries(roleConfigs)
      .filter(([key]) => key !== role)
      .slice(0, 4)
      .map(([, cfg]) => ({
        label: `Fractional ${cfg.name}`,
        href: cfg.servicesPath,
      })),
  }

  return links
}

/**
 * Location-based job pages
 */
export const locationPages = [
  { label: 'UK', href: '/fractional-jobs-uk' },
  { label: 'London', href: '/fractional-jobs-london' },
  { label: 'Manchester', href: '/fractional-jobs-manchester' },
  { label: 'Birmingham', href: '/fractional-jobs-birmingham' },
  { label: 'Leeds', href: '/fractional-jobs-leeds' },
  { label: 'Edinburgh', href: '/fractional-jobs-edinburgh' },
  { label: 'Bristol', href: '/fractional-jobs-bristol' },
  { label: 'Glasgow', href: '/fractional-jobs-glasgow' },
  { label: 'Cambridge', href: '/fractional-jobs-cambridge' },
  { label: 'Oxford', href: '/fractional-jobs-oxford' },
  { label: 'Belfast', href: '/fractional-jobs-belfast' },
  { label: 'Cardiff', href: '/fractional-jobs-cardiff' },
]

/**
 * Industry-based job pages
 */
export const industryPages = [
  { label: 'SaaS', href: '/fractional-jobs-saas' },
  { label: 'Technology', href: '/fractional-jobs-tech' },
  { label: 'Healthcare', href: '/fractional-jobs-healthcare' },
  { label: 'Finance', href: '/fractional-jobs-finance' },
  { label: 'E-commerce', href: '/fractional-jobs-ecommerce' },
  { label: 'Startups', href: '/fractional-jobs-startups' },
  { label: 'Professional Services', href: '/fractional-jobs-professional-services' },
]
