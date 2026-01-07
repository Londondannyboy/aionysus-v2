'use client'

import { useState } from 'react'

// Role-specific defaults based on UK market data
const ROLE_DEFAULTS: Record<string, {
  label: string
  avgDayRate: number
  avgSalary: number
  minDayRate: number
  maxDayRate: number
  color: string
  colorDark: string
}> = {
  cmo: {
    label: 'CMO',
    avgDayRate: 950,
    avgSalary: 130000,
    minDayRate: 700,
    maxDayRate: 1400,
    color: 'amber',
    colorDark: 'amber-600',
  },
  cfo: {
    label: 'CFO',
    avgDayRate: 1050,
    avgSalary: 145000,
    minDayRate: 800,
    maxDayRate: 1500,
    color: 'blue',
    colorDark: 'blue-600',
  },
  cto: {
    label: 'CTO',
    avgDayRate: 1100,
    avgSalary: 155000,
    minDayRate: 850,
    maxDayRate: 1600,
    color: 'blue',
    colorDark: 'blue-600',
  },
  coo: {
    label: 'COO',
    avgDayRate: 950,
    avgSalary: 140000,
    minDayRate: 750,
    maxDayRate: 1400,
    color: 'orange',
    colorDark: 'orange-600',
  },
  ciso: {
    label: 'CISO',
    avgDayRate: 1150,
    avgSalary: 150000,
    minDayRate: 900,
    maxDayRate: 1600,
    color: 'red',
    colorDark: 'red-600',
  },
  chro: {
    label: 'CHRO',
    avgDayRate: 850,
    avgSalary: 125000,
    minDayRate: 650,
    maxDayRate: 1200,
    color: 'pink',
    colorDark: 'pink-600',
  },
  cpo: {
    label: 'CPO',
    avgDayRate: 1000,
    avgSalary: 145000,
    minDayRate: 800,
    maxDayRate: 1400,
    color: 'purple',
    colorDark: 'purple-600',
  },
  ceo: {
    label: 'CEO',
    avgDayRate: 1200,
    avgSalary: 180000,
    minDayRate: 900,
    maxDayRate: 1800,
    color: 'indigo',
    colorDark: 'indigo-600',
  },
}

interface RoleCalculatorProps {
  role: keyof typeof ROLE_DEFAULTS
  className?: string
}

type ViewMode = 'candidate' | 'employer'

export function RoleCalculator({ role, className = '' }: RoleCalculatorProps) {
  const roleData = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.cmo
  const [mode, setMode] = useState<ViewMode>('candidate')

  // Candidate calculator state
  const [dayRate, setDayRate] = useState(roleData.avgDayRate)
  const [daysPerWeek, setDaysPerWeek] = useState(2.5)
  const [clients, setClients] = useState(2)

  // Employer calculator state
  const [fullTimeSalary, setFullTimeSalary] = useState(roleData.avgSalary)
  const [hoursNeeded, setHoursNeeded] = useState(16)

  // Candidate calculations
  const weeklyEarnings = dayRate * daysPerWeek * clients
  const monthlyEarnings = weeklyEarnings * 4.33
  const annualEarnings = weeklyEarnings * 48

  // Employer calculations
  const fullTimeTotalCost = fullTimeSalary * 1.35
  const fractionalDailyEquivalent = roleData.avgDayRate
  const daysPerWeekNeeded = hoursNeeded / 8
  const fractionalAnnualCost = fractionalDailyEquivalent * daysPerWeekNeeded * 48
  const savings = fullTimeTotalCost - fractionalAnnualCost
  const savingsPercent = Math.round((savings / fullTimeTotalCost) * 100)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className={`bg-black text-white overflow-hidden ${className}`}>
      <div className="flex flex-col sm:flex-row border-b border-gray-800">
        <button
          onClick={() => setMode('candidate')}
          className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors ${
            mode === 'candidate'
              ? 'bg-amber-500 text-black'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          I'm a {roleData.label} - Earnings
        </button>
        <button
          onClick={() => setMode('employer')}
          className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors ${
            mode === 'employer'
              ? 'bg-amber-500 text-black'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          I'm Hiring - Savings
        </button>
      </div>

      <div className="p-4 sm:p-8">
        {mode === 'candidate' ? (
          <div>
            <div className="mb-8">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Fractional {roleData.label} Earnings</span>
              <h3 className="text-2xl font-black mt-1">Calculate Your Potential Income</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Your Day Rate</label>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 mb-3 truncate">{formatCurrency(dayRate)}</div>
                <input
                  type="range"
                  min={roleData.minDayRate}
                  max={roleData.maxDayRate}
                  step="50"
                  value={dayRate}
                  onChange={(e) => setDayRate(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>£{roleData.minDayRate}</span>
                  <span className="text-amber-500">Avg: £{roleData.avgDayRate}</span>
                  <span>£{roleData.maxDayRate}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Days Per Client/Week</label>
                <div className="text-2xl sm:text-3xl font-black text-white mb-3">{daysPerWeek} days</div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 day</span>
                  <span>5 days</span>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Number of Clients</label>
                <div className="text-2xl sm:text-3xl font-black text-white mb-3">{clients} {clients === 1 ? 'client' : 'clients'}</div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={clients}
                  onChange={(e) => setClients(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>4</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-6 bg-gray-900 border border-gray-800">
              <div className="text-center py-2 sm:py-0">
                <div className="text-xs sm:text-sm text-gray-500 mb-1 uppercase tracking-wider">Weekly</div>
                <div className="text-xl sm:text-2xl font-bold text-white truncate">{formatCurrency(weeklyEarnings)}</div>
              </div>
              <div className="text-center py-2 sm:py-0 border-y sm:border-y-0 sm:border-x border-gray-800">
                <div className="text-xs sm:text-sm text-gray-500 mb-1 uppercase tracking-wider">Monthly</div>
                <div className="text-xl sm:text-2xl font-bold text-white truncate">{formatCurrency(monthlyEarnings)}</div>
              </div>
              <div className="text-center py-2 sm:py-0">
                <div className="text-xs sm:text-sm text-gray-500 mb-1 uppercase tracking-wider">Annual</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 truncate">{formatCurrency(annualEarnings)}</div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-4">
              Based on {daysPerWeek} days/week x {clients} clients x 48 working weeks. {roleData.label} UK average day rate: £{roleData.avgDayRate}.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Fractional {roleData.label} vs Full-Time</span>
              <h3 className="text-2xl font-black mt-1">Calculate Your Savings</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Full-Time {roleData.label} Salary (Base)</label>
                  <div className="text-2xl sm:text-3xl font-black text-white mb-3 truncate">{formatCurrency(fullTimeSalary)}</div>
                  <input
                    type="range"
                    min="80000"
                    max="250000"
                    step="5000"
                    value={fullTimeSalary}
                    onChange={(e) => setFullTimeSalary(Number(e.target.value))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>£80k</span>
                    <span className="text-amber-500">Avg: £{(roleData.avgSalary / 1000).toFixed(0)}k</span>
                    <span>£250k</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Hours Per Week You Actually Need</label>
                  <div className="text-2xl sm:text-3xl font-black text-white mb-3">
                    {hoursNeeded} hrs <span className="text-sm sm:text-lg font-normal text-gray-500">({daysPerWeekNeeded.toFixed(1)} days)</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="40"
                    step="4"
                    value={hoursNeeded}
                    onChange={(e) => setHoursNeeded(Number(e.target.value))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>4 hrs (0.5 days)</span>
                    <span>40 hrs (5 days)</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-6 space-y-4">
                <h4 className="text-lg font-bold text-center mb-4 text-gray-400 uppercase tracking-wider">Annual Cost Comparison</h4>

                <div className="bg-red-900/30 border border-red-900/50 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <div className="text-xs sm:text-sm text-gray-400">Full-Time {roleData.label}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">(Salary + NI + Benefits)</div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-red-400 truncate">{formatCurrency(fullTimeTotalCost)}</div>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-900/50 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <div className="text-xs sm:text-sm text-gray-400">Fractional {roleData.label}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">({daysPerWeekNeeded.toFixed(1)} days/week x 48 weeks)</div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-400 truncate">{formatCurrency(fractionalAnnualCost)}</div>
                  </div>
                </div>

                <div className="bg-amber-500 text-black p-4 sm:p-5 text-center mt-4">
                  <div className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1">Your Annual Savings</div>
                  <div className="text-2xl sm:text-4xl font-black mb-1 truncate">{formatCurrency(savings)}</div>
                  <div className="text-sm sm:text-lg font-bold">That's {savingsPercent}% less than full-time</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-4">
              Based on £{roleData.avgDayRate}/day average {roleData.label} rate. Full-time includes 35% for employer NI, pension, benefits and overhead.
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-900 border border-gray-800 rounded">
          <p className="text-xs text-gray-500 text-center">
            <span className="inline-block bg-amber-500 text-black px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mr-2">Beta</span>
            This calculator provides rough estimates for illustration only. Actual rates and salaries vary based on location, experience, industry, and market conditions.
          </p>
        </div>
      </div>
    </div>
  )
}

export { ROLE_DEFAULTS }
