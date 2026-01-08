"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

// Wine-themed color palette
const WINE_COLORS = [
  "#722F37", // Burgundy
  "#4A1C40", // Deep purple
  "#8B0000", // Dark red
  "#C41E3A", // Cardinal
  "#D4AF37", // Gold
  "#556B2F", // Olive
  "#800020", // Burgundy variant
  "#702963", // Byzantium
];

// Investment Wine Card
interface InvestmentWine {
  id: number;
  name: string;
  region: string;
  vintage?: number;
  price?: number;
  investmentScore?: number;
  fiveYearReturn?: number;
  storageType?: string;
  livExScore?: number;
}

export function InvestmentWineCard({ wine }: { wine: InvestmentWine }) {
  const scoreColor = (wine.investmentScore || 0) >= 8 ? "text-emerald-400" :
                     (wine.investmentScore || 0) >= 6 ? "text-amber-400" : "text-rose-400";

  const returnColor = (wine.fiveYearReturn || 0) >= 30 ? "text-emerald-400" :
                      (wine.fiveYearReturn || 0) >= 15 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="bg-gradient-to-br from-slate-900 to-rose-950 rounded-xl p-4 border border-rose-900/30 hover:border-rose-500/50 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm truncate">{wine.name}</h4>
          <p className="text-rose-300/70 text-xs">{wine.region} {wine.vintage && `· ${wine.vintage}`}</p>
        </div>
        {wine.livExScore && (
          <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-medium">
            Liv-ex {wine.livExScore}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className={`text-lg font-bold ${scoreColor}`}>{wine.investmentScore?.toFixed(1)}</p>
          <p className="text-[10px] text-gray-400">Score</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className={`text-lg font-bold ${returnColor}`}>
            {wine.fiveYearReturn ? `${wine.fiveYearReturn > 0 ? '+' : ''}${wine.fiveYearReturn.toFixed(0)}%` : 'N/A'}
          </p>
          <p className="text-[10px] text-gray-400">5yr Return</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-white">£{wine.price?.toLocaleString() || 'N/A'}</p>
          <p className="text-[10px] text-gray-400">Price</p>
        </div>
      </div>

      {wine.storageType && (
        <div className="mt-2 flex items-center gap-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            wine.storageType === 'bonded' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
          }`}>
            {wine.storageType === 'bonded' ? '🏦 Bonded' : '🍷 Private Cellar'}
          </span>
        </div>
      )}
    </div>
  );
}

// Investment Wines Grid
export function InvestmentWinesGrid({ wines, title }: { wines: InvestmentWine[]; title: string }) {
  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-rose-900/50 rounded-2xl shadow-2xl p-6 w-full max-w-2xl backdrop-blur border border-rose-900/30">
      <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
      <p className="text-rose-300/60 text-sm mb-4">{wines.length} investment-grade wines</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {wines.map((wine) => (
          <InvestmentWineCard key={wine.id} wine={wine} />
        ))}
      </div>
    </div>
  );
}

// Investment Price Chart
interface PriceData {
  year: string;
  price: number;
  trend?: number;
  volume?: number;
}

interface InvestmentChartProps {
  data: PriceData[];
  title: string;
  subtitle?: string;
  wineName?: string;
  investmentScore?: number;
  fiveYearReturn?: number;
}

export function InvestmentPriceChart({ data, title, subtitle, investmentScore, fiveYearReturn }: InvestmentChartProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-rose-950 rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-rose-900/30">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-rose-300/60">{subtitle}</p>}

        {(investmentScore || fiveYearReturn) && (
          <div className="flex gap-4 mt-2">
            {investmentScore && (
              <span className="text-emerald-400 text-sm font-medium">
                Score: {investmentScore.toFixed(1)}/10
              </span>
            )}
            {fiveYearReturn && (
              <span className={`text-sm font-medium ${fiveYearReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                5yr: {fiveYearReturn > 0 ? '+' : ''}{fiveYearReturn.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ left: -10 }}>
          <defs>
            <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#722F37" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(value) => `£${value}`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: 'white' }}
            formatter={(value) => [`£${(value as number).toLocaleString()}`, 'Price']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#D4AF37"
            fill="url(#colorInvestment)"
            strokeWidth={2}
          />
          {data[0]?.trend !== undefined && (
            <Area
              type="monotone"
              dataKey="trend"
              stroke="#722F37"
              fill="none"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ROI Calculator Display
interface ROIData {
  wine: string;
  investmentAmount: number;
  bottles: number;
  holdingYears: number;
  storageType: string;
  projectedValue: number;
  grossReturn: number;
  costs: {
    storage: number;
    insurance: number;
    duty: number;
    total: number;
  };
  netReturn: number;
  roiPercentage: number;
  annualizedReturn: number;
}

export function ROICalculator({ data }: { data: ROIData }) {
  const isPositive = data.netReturn >= 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-emerald-900/30">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white">Investment Calculator</h3>
        <p className="text-emerald-300/60 text-sm">{data.wine}</p>
      </div>

      {/* Investment Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/30 rounded-xl p-4">
          <p className="text-3xl font-bold text-white">£{data.investmentAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-400">Investment</p>
        </div>
        <div className="bg-black/30 rounded-xl p-4">
          <p className={`text-3xl font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            £{data.projectedValue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">Projected Value ({data.holdingYears}yr)</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Bottles</span>
          <span className="text-white font-medium">{data.bottles} bottles</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Storage Type</span>
          <span className={`font-medium ${data.storageType === 'bonded' ? 'text-emerald-400' : 'text-purple-400'}`}>
            {data.storageType === 'bonded' ? '🏦 Bonded (Duty-free)' : '🍷 Private Cellar'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Holding Period</span>
          <span className="text-white font-medium">{data.holdingYears} years</span>
        </div>
      </div>

      {/* Costs Breakdown */}
      <div className="bg-black/20 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-400 mb-2">Costs Breakdown</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Storage</span>
            <span className="text-rose-400">-£{data.costs.storage.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Insurance</span>
            <span className="text-rose-400">-£{data.costs.insurance.toFixed(0)}</span>
          </div>
          {data.costs.duty > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Duty (not bonded)</span>
              <span className="text-rose-400">-£{data.costs.duty.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
            <span className="text-gray-400 font-medium">Total Costs</span>
            <span className="text-rose-400 font-medium">-£{data.costs.total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* ROI */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/20 to-transparent rounded-xl p-4">
        <div>
          <p className="text-sm text-gray-400">Net Return</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}£{data.netReturn.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">ROI</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}{data.roiPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-500 mt-3">
        Annualized Return: {data.annualizedReturn.toFixed(1)}% p.a.
      </p>
    </div>
  );
}

// Portfolio Builder Display
interface PortfolioWine {
  id: number;
  name: string;
  region: string;
  vintage?: number;
  price: number;
  investmentScore?: number;
  fiveYearReturn?: number;
  allocation: number;
}

interface PortfolioData {
  portfolio: PortfolioWine[];
  totalCost: number;
  remainingBudget: number;
  diversification: {
    wineCount: number;
    regionCount: number;
    regions: string[];
  };
  metrics: {
    avgInvestmentScore: number;
    avgFiveYearReturn: number;
    riskLevel: string;
  };
  title: string;
}

export function PortfolioBuilder({ data }: { data: PortfolioData }) {
  const pieData = data.portfolio.map((wine, i) => ({
    name: wine.name.length > 20 ? wine.name.substring(0, 20) + '...' : wine.name,
    value: wine.allocation,
    fill: WINE_COLORS[i % WINE_COLORS.length],
  }));

  const riskColors = {
    low: 'text-emerald-400 bg-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/20',
    high: 'text-rose-400 bg-rose-500/20',
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-purple-900/30">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{data.title}</h3>
          <p className="text-purple-300/60 text-sm">
            {data.diversification.wineCount} wines · {data.diversification.regionCount} regions
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${riskColors[data.metrics.riskLevel as keyof typeof riskColors] || riskColors.medium}`}>
          {data.metrics.riskLevel.toUpperCase()} RISK
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allocation Chart */}
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }}
                formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Allocation']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          <div className="bg-black/30 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Total Investment</span>
              <span className="text-white font-bold text-lg">£{data.totalCost.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Avg Score</span>
              <span className="text-emerald-400 font-bold">{data.metrics.avgInvestmentScore.toFixed(1)}/10</span>
            </div>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Avg 5yr Return</span>
              <span className="text-amber-400 font-bold">+{data.metrics.avgFiveYearReturn.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wine List */}
      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-400 mb-2">Portfolio Holdings</p>
        {data.portfolio.map((wine, i) => (
          <div key={wine.id} className="flex items-center gap-3 bg-black/20 rounded-lg p-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: WINE_COLORS[i % WINE_COLORS.length] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{wine.name}</p>
              <p className="text-gray-500 text-xs">{wine.region}</p>
            </div>
            <div className="text-right">
              <p className="text-white text-sm font-medium">£{wine.price.toLocaleString()}</p>
              <p className="text-gray-500 text-xs">{wine.allocation.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading state
export function InvestmentLoading({ title }: { title: string }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-rose-950 rounded-2xl shadow-xl p-6 w-full max-w-lg border border-rose-900/30">
      <h3 className="text-lg font-bold text-gray-400 mb-4">{title}</h3>
      <div className="h-[250px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-200/20 border-t-rose-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Loading investment data...</p>
        </div>
      </div>
    </div>
  );
}
