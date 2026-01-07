'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const TAX_CONFIG = {
  personalAllowance: 12570,
  basicRate: 0.20,
  basicRateLimit: 50270,
  higherRate: 0.40,
  higherRateLimit: 125140,
  additionalRate: 0.45,
  niPrimaryThreshold: 12570,
  niUpperEarningsLimit: 50270,
  niEmployeeRate: 0.08,
  niEmployeeUpperRate: 0.02,
  niSecondaryThreshold: 9100,
  niEmployerRate: 0.138,
  dividendAllowance: 500,
  dividendBasicRate: 0.0875,
  dividendHigherRate: 0.3375,
  dividendAdditionalRate: 0.3935,
  corpTaxSmall: 0.19,
  corpTaxMain: 0.25,
  corpTaxMarginal: 0.265,
  workingWeeks: 48,
}

interface IR35CalculatorProps {
  defaultDayRate?: number
  className?: string
}

export function IR35Calculator({ defaultDayRate = 800, className = '' }: IR35CalculatorProps) {
  const [dayRate, setDayRate] = useState(defaultDayRate)
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [weeksPerYear, setWeeksPerYear] = useState(TAX_CONFIG.workingWeeks)

  const grossAnnual = dayRate * daysPerWeek * weeksPerYear

  const insideIR35 = useMemo(() => {
    const umbrellaMargin = 25 * weeksPerYear
    const employerNI = Math.max(0, (grossAnnual - umbrellaMargin - TAX_CONFIG.niSecondaryThreshold * 12) * TAX_CONFIG.niEmployerRate)
    const expensesAllowance = grossAnnual * 0.05
    const taxableGross = grossAnnual - umbrellaMargin - employerNI - expensesAllowance

    let incomeTax = 0
    if (taxableGross > TAX_CONFIG.personalAllowance) {
      const taxableAfterPA = taxableGross - TAX_CONFIG.personalAllowance
      if (taxableAfterPA <= TAX_CONFIG.basicRateLimit - TAX_CONFIG.personalAllowance) {
        incomeTax = taxableAfterPA * TAX_CONFIG.basicRate
      } else if (taxableAfterPA <= TAX_CONFIG.higherRateLimit - TAX_CONFIG.personalAllowance) {
        const basicPortion = TAX_CONFIG.basicRateLimit - TAX_CONFIG.personalAllowance
        const higherPortion = taxableAfterPA - basicPortion
        incomeTax = basicPortion * TAX_CONFIG.basicRate + higherPortion * TAX_CONFIG.higherRate
      } else {
        const basicPortion = TAX_CONFIG.basicRateLimit - TAX_CONFIG.personalAllowance
        const higherPortion = TAX_CONFIG.higherRateLimit - TAX_CONFIG.basicRateLimit
        const additionalPortion = taxableAfterPA - basicPortion - higherPortion
        incomeTax = basicPortion * TAX_CONFIG.basicRate + higherPortion * TAX_CONFIG.higherRate + additionalPortion * TAX_CONFIG.additionalRate
      }
    }

    let employeeNI = 0
    if (taxableGross > TAX_CONFIG.niPrimaryThreshold) {
      if (taxableGross <= TAX_CONFIG.niUpperEarningsLimit) {
        employeeNI = (taxableGross - TAX_CONFIG.niPrimaryThreshold) * TAX_CONFIG.niEmployeeRate
      } else {
        employeeNI = (TAX_CONFIG.niUpperEarningsLimit - TAX_CONFIG.niPrimaryThreshold) * TAX_CONFIG.niEmployeeRate +
          (taxableGross - TAX_CONFIG.niUpperEarningsLimit) * TAX_CONFIG.niEmployeeUpperRate
      }
    }

    return {
      grossAnnual,
      umbrellaMargin,
      employerNI,
      expensesAllowance,
      taxableGross,
      incomeTax,
      employeeNI,
      totalTax: incomeTax + employeeNI + employerNI,
      takeHome: grossAnnual - incomeTax - employeeNI - umbrellaMargin - employerNI,
      effectiveRate: ((incomeTax + employeeNI + employerNI + umbrellaMargin) / grossAnnual) * 100,
    }
  }, [grossAnnual, weeksPerYear])

  const outsideIR35 = useMemo(() => {
    const optimalSalary = TAX_CONFIG.personalAllowance
    const companyRevenue = grossAnnual
    const companyExpenses = 3000

    const companyProfit = companyRevenue - optimalSalary - companyExpenses
    let corpTax = 0
    if (companyProfit <= 50000) {
      corpTax = companyProfit * TAX_CONFIG.corpTaxSmall
    } else if (companyProfit <= 250000) {
      corpTax = companyProfit * TAX_CONFIG.corpTaxMarginal
    } else {
      corpTax = companyProfit * TAX_CONFIG.corpTaxMain
    }

    const availableForDividends = companyProfit - corpTax
    let dividendTax = 0
    const taxableDividends = Math.max(0, availableForDividends - TAX_CONFIG.dividendAllowance)
    const totalIncome = optimalSalary + availableForDividends

    if (taxableDividends > 0) {
      const incomeAfterPA = totalIncome - TAX_CONFIG.personalAllowance
      const basicBandRemaining = Math.max(0, TAX_CONFIG.basicRateLimit - TAX_CONFIG.personalAllowance - optimalSalary)

      if (taxableDividends <= basicBandRemaining) {
        dividendTax = taxableDividends * TAX_CONFIG.dividendBasicRate
      } else if (incomeAfterPA <= TAX_CONFIG.higherRateLimit - TAX_CONFIG.personalAllowance) {
        const basicPortion = basicBandRemaining
        const higherPortion = taxableDividends - basicBandRemaining
        dividendTax = basicPortion * TAX_CONFIG.dividendBasicRate + higherPortion * TAX_CONFIG.dividendHigherRate
      } else {
        const basicPortion = basicBandRemaining
        const higherPortion = TAX_CONFIG.higherRateLimit - TAX_CONFIG.basicRateLimit
        const additionalPortion = taxableDividends - basicPortion - higherPortion
        dividendTax = basicPortion * TAX_CONFIG.dividendBasicRate + higherPortion * TAX_CONFIG.dividendHigherRate + additionalPortion * TAX_CONFIG.dividendAdditionalRate
      }
    }

    const totalTax = corpTax + dividendTax
    const takeHome = companyRevenue - totalTax - companyExpenses

    return {
      grossAnnual: companyRevenue,
      salary: optimalSalary,
      companyExpenses,
      companyProfit,
      corpTax,
      availableForDividends,
      dividendTax,
      totalTax,
      takeHome,
      effectiveRate: ((totalTax + companyExpenses) / companyRevenue) * 100,
    }
  }, [grossAnnual])

  const difference = outsideIR35.takeHome - insideIR35.takeHome
  const percentageSaved = ((difference / insideIR35.takeHome) * 100).toFixed(1)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className={`bg-white border border-gray-200 overflow-hidden ${className}`}>
      <div className="bg-black text-white p-6">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 block mb-2">UK Tax Calculator</span>
        <h2 className="text-2xl font-black">IR35 Take-Home Pay Calculator</h2>
        <p className="text-gray-400 mt-2">See how IR35 status affects your earnings as a fractional executive</p>
      </div>

      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Day Rate</label>
            <div className="text-2xl font-black text-gray-900 mb-2">{formatCurrency(dayRate)}</div>
            <input
              type="range"
              min="400"
              max="2000"
              step="50"
              value={dayRate}
              onChange={(e) => setDayRate(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Days Per Week</label>
            <div className="text-2xl font-black text-gray-900 mb-2">{daysPerWeek} days</div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weeks Per Year</label>
            <div className="text-2xl font-black text-gray-900 mb-2">{weeksPerYear} weeks</div>
            <input
              type="range"
              min="40"
              max="52"
              step="1"
              value={weeksPerYear}
              onChange={(e) => setWeeksPerYear(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">Gross Annual: </span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(grossAnnual)}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Inside IR35</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Umbrella company or deemed employment</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Gross Revenue</dt><dd className="font-medium">{formatCurrency(insideIR35.grossAnnual)}</dd></div>
            <div className="flex justify-between text-red-600"><dt>Employer's NI</dt><dd>-{formatCurrency(insideIR35.employerNI)}</dd></div>
            <div className="flex justify-between text-red-600"><dt>Income Tax</dt><dd>-{formatCurrency(insideIR35.incomeTax)}</dd></div>
            <div className="flex justify-between text-red-600"><dt>Employee NI</dt><dd>-{formatCurrency(insideIR35.employeeNI)}</dd></div>
          </dl>
          <div className="mt-4 p-4 bg-red-50 border border-red-200">
            <div className="text-sm text-red-700">Take-Home Pay</div>
            <div className="text-3xl font-black text-red-700">{formatCurrency(insideIR35.takeHome)}</div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-blue-600 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900">Outside IR35</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Limited company - salary + dividends</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Company Revenue</dt><dd className="font-medium">{formatCurrency(outsideIR35.grossAnnual)}</dd></div>
            <div className="flex justify-between text-red-600"><dt>Corporation Tax</dt><dd>-{formatCurrency(outsideIR35.corpTax)}</dd></div>
            <div className="flex justify-between text-red-600"><dt>Dividend Tax</dt><dd>-{formatCurrency(outsideIR35.dividendTax)}</dd></div>
          </dl>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200">
            <div className="text-sm text-blue-700">Take-Home Pay</div>
            <div className="text-3xl font-black text-blue-700">{formatCurrency(outsideIR35.takeHome)}</div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-amber-500 text-black text-center">
        <div className="text-sm font-bold uppercase tracking-wider mb-1">Being Outside IR35 Saves You</div>
        <div className="text-4xl font-black">{formatCurrency(difference)}</div>
        <div className="text-lg font-bold">per year ({percentageSaved}% more)</div>
      </div>

      <div className="p-4 bg-amber-50 border-t-4 border-amber-400 text-xs text-gray-700">
        <span className="inline-block bg-amber-500 text-black px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-2">Beta</span>
        Estimates only. Consult a tax accountant.{' '}
        <Link href="https://www.gov.uk/guidance/understanding-off-payroll-working-ir35" target="_blank" className="text-amber-700 hover:underline">gov.uk/IR35</Link>
      </div>
    </div>
  )
}
