"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
  RadialBarChart, RadialBar, PieLabelRenderProps, LineChart, Line
} from "recharts";

// Wine-themed color palette
const WINE_COLORS = [
  "#722F37", // Burgundy
  "#4A1C40", // Deep purple
  "#8B0000", // Dark red
  "#C41E3A", // Cardinal
  "#D4AF37", // Gold (for champagne)
  "#556B2F", // Olive (for white wine regions)
  "#800020", // Burgundy variant
  "#702963", // Byzantium
];

type RegionData = { name: string; wines: number }[];
type PriceData = { year: string; price: number; trend?: number }[];
type TypeData = { name: string; count: number }[];

// Wine by Region Chart
export function WineRegionChart({ data, title, subtitle }: { data: RegionData; title: string; subtitle?: string }) {
  return (
    <div className="bg-gradient-to-br from-white to-rose-50 rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-rose-100">
      <div className="mb-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-rose-700 to-purple-700 bg-clip-text text-transparent">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#374151', fontSize: 11, fontWeight: 500 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }}
            labelStyle={{ color: '#f3f4f6' }}
            formatter={(value) => [`${value} wines`, '']}
          />
          <Bar dataKey="wines" radius={[0, 8, 8, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={WINE_COLORS[index % WINE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Wine Type Distribution (Pie)
export function WineTypeChart({ data, title, subtitle }: { data: TypeData; title: string; subtitle?: string }) {
  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-purple-100">
      <div className="mb-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-rose-600 bg-clip-text text-transparent">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="count"
            label={(props: PieLabelRenderProps) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
            labelLine={{ stroke: '#9ca3af' }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={WINE_COLORS[index % WINE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Wine Investment Price Trend
export function WinePriceChart({ data, title, subtitle }: { data: PriceData; title: string; subtitle?: string }) {
  return (
    <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-amber-100">
      <div className="mb-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ left: -10 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#722F37" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#722F37" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="year" tick={{ fill: '#374151', fontSize: 11 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(value) => `£${value}`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }}
            formatter={(value) => [`£${value}`, 'Price']}
          />
          <Legend />
          <Area type="monotone" dataKey="price" stroke="#722F37" fill="url(#colorPrice)" strokeWidth={2} name="Price" />
          {data[0]?.trend !== undefined && (
            <Line type="monotone" dataKey="trend" stroke="#D4AF37" strokeWidth={2} strokeDasharray="5 5" name="Trend" dot={false} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Wine Market Dashboard
type WineDashboardData = {
  metrics: { totalWines: number; totalRegions: number; avgPrice: string; topVintage: string };
  topRegions: { name: string; count: number }[];
  title: string;
  lastUpdated: string;
};

export function WineMarketDashboard({ data }: { data: WineDashboardData }) {
  const radialData = data.topRegions.map((r, i) => ({
    name: r.name,
    value: r.count,
    fill: WINE_COLORS[i % WINE_COLORS.length]
  }));

  return (
    <div className="bg-gradient-to-br from-slate-900 to-rose-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg text-white">
      <div className="mb-6">
        <h3 className="text-2xl font-bold">{data.title}</h3>
        <p className="text-rose-300 text-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          {data.lastUpdated}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
          <p className="text-3xl font-bold text-rose-300">{data.metrics.totalWines}</p>
          <p className="text-sm text-gray-300">Wines Available</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
          <p className="text-3xl font-bold text-purple-300">{data.metrics.totalRegions}</p>
          <p className="text-sm text-gray-300">Wine Regions</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
          <p className="text-3xl font-bold text-amber-300">{data.metrics.avgPrice}</p>
          <p className="text-sm text-gray-300">Avg Price</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
          <p className="text-3xl font-bold text-emerald-300">{data.metrics.topVintage}</p>
          <p className="text-sm text-gray-300">Top Vintage</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-sm text-gray-400 mb-3">Top Regions</p>
        <ResponsiveContainer width="100%" height={120}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData}>
            <RadialBar dataKey="value" cornerRadius={4} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Wine Articles/News Grid
type Article = {
  title: string;
  description: string;
  image: string;
  url: string;
  source: string;
};

export function WineArticlesGrid({ articles, title }: { articles: Article[]; title: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {articles.map((article, i) => (
          <a
            key={i}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 p-3 rounded-xl hover:bg-rose-50 transition-colors group"
          >
            <img
              src={article.image}
              alt={article.title}
              className="w-24 h-16 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 text-sm group-hover:text-rose-700 transition-colors line-clamp-1">
                {article.title}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-2">{article.description}</p>
              <p className="text-xs text-rose-600 mt-1">{article.source}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Loading state
export function ChartLoading({ title }: { title: string }) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 w-full max-w-lg border border-gray-100">
      <h3 className="text-lg font-bold text-gray-400 mb-4">{title}</h3>
      <div className="h-[250px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Loading visualization...</p>
        </div>
      </div>
    </div>
  );
}

// Legacy exports for compatibility (will be removed)
export const JobsBarChart = WineRegionChart;
export const JobsPieChart = WineTypeChart;
export const SalaryAreaChart = WinePriceChart;
export const MarketDashboard = WineMarketDashboard;
export const ArticlesGrid = WineArticlesGrid;
