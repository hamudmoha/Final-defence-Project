import React, { useState, useEffect } from 'react';
import {
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import api from '../../../services/api';

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('This Month');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Chart Data States with fallback defaults
  const [revenueData, setRevenueData] = useState([
    { name: 'Week 1', revenue: 12000, bookings: 45 },
    { name: 'Week 2', revenue: 19000, bookings: 65 },
    { name: 'Week 3', revenue: 15000, bookings: 55 },
    { name: 'Week 4', revenue: 22000, bookings: 80 },
  ]);

  const [occupancyByCamp, setOccupancyByCamp] = useState([
    { name: 'Bale Mountains', rate: 85, color: '#0d9488' },
    { name: 'Simien Lodge', rate: 92, color: '#14b8a6' },
    { name: 'Lake Tana', rate: 65, color: '#2dd4bf' },
    { name: 'Omo Valley', rate: 70, color: '#5eead4' },
  ]);

  const [visitorDemographics, setVisitorDemographics] = useState([
    { name: 'Local', value: 65, color: '#0d9488' },
    { name: 'International', value: 35, color: '#fb923c' },
  ]);

  const getRangeParam = (rangeStr) => {
    switch (rangeStr) {
      case 'Today': return 'today';
      case 'This Week': return 'week';
      case 'This Month': return 'month';
      case 'This Year': return 'year';
      default: return 'month';
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const rangeParam = getRangeParam(timeRange);
      try {
        const [statsRes, revenueRes, campDistRes] = await Promise.all([
          api.get('/dashboard/stats', { params: { range: rangeParam } }),
          api.get('/dashboard/charts/revenue', { params: { range: rangeParam } }),
          api.get('/dashboard/charts/camp-distribution', { params: { range: rangeParam } })
        ]);

        if (statsRes.data?.success && statsRes.data.stats) {
          setStats(statsRes.data.stats);
          if (statsRes.data.stats.visitorDemographics) {
            setVisitorDemographics(statsRes.data.stats.visitorDemographics);
          }
        }

        if (revenueRes.data?.success && revenueRes.data.data && revenueRes.data.data.length > 0) {
          const revChart = revenueRes.data.data.map(item => ({
            name: item.label,
            revenue: item.revenue || 0,
            bookings: item.count || 0
          }));
          setRevenueData(revChart);
        }

        if (campDistRes.data?.success && campDistRes.data.data && campDistRes.data.data.length > 0) {
          const occData = campDistRes.data.data.map(item => ({
            name: item.name || item.type,
            rate: item.rate || 65,
            color: item.color || '#0d9488'
          }));
          setOccupancyByCamp(occData);
        }
      } catch (err) {
        console.error('Error fetching analytics dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  // Key Metrics
  const metrics = [
    { 
      label: 'Total Revenue', 
      value: `${(stats?.totalRevenue ?? 45231).toLocaleString()} Birr`, 
      trend: `${stats?.revenueGrowth >= 0 ? '+' : ''}${stats?.revenueGrowth ?? 12.5}%`, 
      isUp: (stats?.revenueGrowth ?? 1) >= 0, 
      icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' 
    },
    { 
      label: 'Total Bookings', 
      value: `${(stats?.activeBookings ?? 342).toLocaleString()}`, 
      trend: `${stats?.reservationsGrowth >= 0 ? '+' : ''}${stats?.reservationsGrowth ?? 8.2}%`, 
      isUp: (stats?.reservationsGrowth ?? 1) >= 0, 
      icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' 
    },
    { 
      label: 'Occupancy Rate', 
      value: `${stats ? Math.min(100, Math.round((stats.activeBookings / ((stats.totalMyCamps || 1) * 10)) * 100)) : 78}%`, 
      trend: '+5.0%', 
      isUp: true, 
      icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' 
    },
    { 
      label: 'Total Visitors', 
      value: `${(stats?.activeUsers ?? 1204).toLocaleString()}`, 
      trend: `${stats?.usersGrowth >= 0 ? '+' : ''}${stats?.usersGrowth ?? 15.3}%`, 
      isUp: (stats?.usersGrowth ?? 1) >= 0, 
      icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' 
    }
  ];

  const [showExportMenu, setShowExportMenu] = useState(false);

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = (type) => {
    const prefix = `analytics_${type}_${timeRange.toLowerCase().replace(/\s+/g, '_')}`;
    let headers = [];
    let rows = [];

    if (type === 'revenue') {
      if (!revenueData || revenueData.length === 0) return;
      headers = ['Time Period', 'Revenue (Birr)', 'Bookings Count'];
      rows = revenueData.map(item => `${JSON.stringify(item.name)},${item.revenue},${item.bookings}`);
    } else if (type === 'occupancy') {
      if (!occupancyByCamp || occupancyByCamp.length === 0) return;
      headers = ['Camp Name', 'Occupancy Rate (%)', 'Total Revenue'];
      rows = occupancyByCamp.map(item => `${JSON.stringify(item.name)},${item.rate},${item.count || item.revenue || 0}`);
    } else if (type === 'demographics') {
      if (!visitorDemographics || visitorDemographics.length === 0) return;
      headers = ['Category', 'Percentage (%)'];
      rows = visitorDemographics.map(item => `${JSON.stringify(item.name)},${item.value}`);
    } else if (type === 'summary') {
      headers = ['Metric Name', 'Value', 'Trend Direction', 'Trend %'];
      rows = metrics.map(m => `${JSON.stringify(m.label)},${JSON.stringify(m.value)},${m.isUp ? 'Increasing' : 'Decreasing'},${JSON.stringify(m.trend)}`);
    }

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, `${prefix}.csv`, 'text/csv');
  };

  const exportJSON = () => {
    const data = {
      reportGeneratedAt: new Date().toISOString(),
      timeRangeSelected: timeRange,
      keyMetrics: metrics.map(m => ({ label: m.label, value: m.value, trend: m.trend, isPositive: m.isUp })),
      revenueAndBookings: revenueData,
      campOccupancy: occupancyByCamp.map(c => ({ name: c.name, occupancyRate: c.rate, revenue: c.count || c.revenue || 0 })),
      demographics: visitorDemographics
    };
    const jsonString = JSON.stringify(data, null, 2);
    const filename = `comprehensive_analytics_${timeRange.toLowerCase().replace(/\s+/g, '_')}.json`;
    downloadFile(jsonString, filename, 'application/json');
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportMenu]);

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans overflow-y-auto">
      {/* Main Container with responsive padding */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Reports & Analytics</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Track your camp performance and revenue insights.</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium shadow-sm text-slate-700 cursor-pointer w-full sm:w-auto"
              >
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative export-menu-container">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center justify-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 text-teal-600" />
                <span className="hidden xs:inline">Export</span>
                <span className="xs:hidden">Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 divide-y divide-slate-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Export Options
                  </div>
                  <button
                    onClick={() => { exportCSV('revenue'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <span className="text-base">📈</span> Revenue & Bookings (CSV)
                  </button>
                  <button
                    onClick={() => { exportCSV('occupancy'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <span className="text-base">🏕️</span> Camp Occupancy (CSV)
                  </button>
                  <button
                    onClick={() => { exportCSV('demographics'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <span className="text-base">👥</span> Demographics (CSV)
                  </button>
                  <button
                    onClick={() => { exportCSV('summary'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <span className="text-base">📊</span> KPI Summary (CSV)
                  </button>
                  <button
                    onClick={() => { exportJSON(); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3 transition-colors border-t border-slate-100 cursor-pointer"
                  >
                    <span className="text-base">📑</span> Complete Report (JSON)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards - Responsive Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-white p-4 sm:p-5 md:p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${metric.bg} flex items-center justify-center`}>
                  <metric.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${metric.color}`} />
                </div>
                <span className={`flex items-center text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${metric.isUp ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                  {metric.isUp ? <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> : <TrendingDown className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />}
                  <span className="text-[10px] sm:text-xs">{metric.trend}</span>
                </span>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 break-words">{metric.value}</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">{metric.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Revenue Overview (Area Chart) */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Revenue Overview</h3>
            </div>
            <div className="h-[250px] sm:h-[280px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    dy={10}
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Visitor Demographics (Pie Chart) */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">Visitor Demographics</h3>
            <div className="h-[200px] sm:h-[220px] w-full flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visitorDemographics}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {visitorDemographics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl sm:text-2xl font-bold text-slate-800">100%</span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500">Total</span>
              </div>
            </div>
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-3 sm:mt-4">
              {visitorDemographics.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs sm:text-sm font-medium text-slate-600">
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Occupancy Rate by Camp (Bar Chart) */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">Occupancy Rate by Camp</h3>
            <div className="h-[220px] sm:h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyByCamp} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                    width={80}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value) => [`${value}%`, 'Occupancy Rate']}
                  />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={20}>
                    {occupancyByCamp.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bookings Trend (Line Chart) */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">Bookings Trend</h3>
            <div className="h-[220px] sm:h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    dy={10}
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#fff' }} 
                    activeDot={{ r: 5 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-3 text-sm text-slate-600">Loading analytics...</p>
            </div>
          </div>
        )}
      </div>

      {/* Custom responsive styles */}
      <style jsx>{`
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline;
          }
        }
      `}</style>
    </div>
  );
}