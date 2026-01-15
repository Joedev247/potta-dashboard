'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Info, CaretLeft, CaretRight, SquaresFour, TrendUp, Spinner } from '@phosphor-icons/react';
import { statisticsService } from '@/lib/api';
import { formatCurrency } from '@/lib/utils/format';

export default function StatisticsPage() {
  const [activePeriod, setActivePeriod] = useState<'days' | 'weeks' | 'months' | 'quarters' | 'years' | 'custom...'>('months');
  const [selectedValue, setSelectedValue] = useState('November 2025');
  const [showPreviousPeriod, setShowPreviousPeriod] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<Array<any>>([]);
  const [previousTimeSeries, setPreviousTimeSeries] = useState<Array<any>>([]);
  const [breakdown, setBreakdown] = useState<Array<any>>([]);
  const [breakdownDimension, setBreakdownDimension] = useState<'payment_method' | 'status' | 'currency' | 'product'>('payment_method');
  const [events, setEvents] = useState<Array<any>>([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const selectorScrollRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  const periods = ['Days', 'Weeks', 'Months', 'Quarters', 'Years', 'Custom...'];

  // Fetch overview and timeseries from API
  const fetchStatistics = useCallback(async () => {
    if (activePeriod === 'custom...') return;
    setLoading(true);
    try {
      // Derive start/end from selectedValue for common period types (months, quarters, years)
      const now = new Date();
      let startDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30); // default last 30 days
      let endDate = now;

      // Months like "November 2025"
      if (activePeriod === 'months' || activePeriod === 'days' || activePeriod === 'weeks') {
        const parts = selectedValue.split(' ');
        if (parts.length === 2) {
          const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const monthIndex = monthNames.indexOf(parts[0]);
          const year = parseInt(parts[1], 10);
          if (!isNaN(monthIndex) && !isNaN(year)) {
            startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
            endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59));
          }
        }
      } else if (activePeriod === 'quarters') {
        const parts = selectedValue.split(' ');
        if (parts.length === 2) {
          const q = parseInt(parts[0].replace('Q',''), 10) - 1;
          const y = parseInt(parts[1], 10);
          if (!isNaN(q) && !isNaN(y)) {
            startDate = new Date(Date.UTC(y, q * 3, 1, 0, 0, 0));
            endDate = new Date(Date.UTC(y, q * 3 + 3, 0, 23, 59, 59));
          }
        }
      } else if (activePeriod === 'years') {
        const y = parseInt(selectedValue, 10);
        if (!isNaN(y)) {
          startDate = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
          endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
        }
      }

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // Overview
      const overviewResp = await statisticsService.getOverview({ startDate: startISO, endDate: endISO, tz: 'UTC' });
      if (overviewResp.success && overviewResp.data) {
        setOverview(overviewResp.data);
      } else {
        setOverview(null);
      }

      // Timeseries - request volume and count
      const granularity = activePeriod === 'days' || activePeriod === 'weeks' ? 'day' : activePeriod === 'months' ? 'day' : activePeriod === 'quarters' ? 'month' : 'month';
      const tsResp = await statisticsService.getTimeSeries({ startDate: startISO, endDate: endISO, granularity, metrics: ['total_volume','total_count'] });
      if (tsResp.success && tsResp.data) {
        setTimeSeries(Array.isArray(tsResp.data) ? tsResp.data : []);
      } else {
        setTimeSeries([]);
      }

      // Breakdown by payment method
      const breakdownResp = await statisticsService.getBreakdown({ startDate: startISO, endDate: endISO, dimension: breakdownDimension });
      if (breakdownResp.success && breakdownResp.data) {
        setBreakdown(Array.isArray(breakdownResp.data) ? breakdownResp.data : (breakdownResp.data?.breakdown || []));
      } else {
        setBreakdown([]);
      }

      // Events
      const eventsResp = await statisticsService.getEvents({ startDate: startISO, endDate: endISO, page: 1, limit: 10 });
      if (eventsResp.success && eventsResp.data) {
        setEvents(Array.isArray(eventsResp.data) ? eventsResp.data : (eventsResp.data?.events || []));
      } else {
        setEvents([]);
      }

      // Previous period (if requested)
      if (showPreviousPeriod) {
        // Compute previous range length
        const prevStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()) - 1000);
        const prevEnd = new Date(startDate.getTime() - 1000);
        const prevResp = await statisticsService.getTimeSeries({ startDate: prevStart.toISOString(), endDate: prevEnd.toISOString(), granularity, metrics: ['total_volume','total_count'] });
        if (prevResp.success && prevResp.data) {
          setPreviousTimeSeries(Array.isArray(prevResp.data) ? prevResp.data : []);
        } else {
          setPreviousTimeSeries([]);
        }
      } else {
        setPreviousTimeSeries([]);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setOverview(null);
      setTimeSeries([]);
      setBreakdown([]);
      setEvents([]);
      setPreviousTimeSeries([]);
    } finally {
      setLoading(false);
    }
  }, [activePeriod, selectedValue, showPreviousPeriod, breakdownDimension]);

  // Fetch statistics when period or value changes
  useEffect(() => {
    if (activePeriod !== 'custom...') {
      fetchStatistics();
    }
  }, [fetchStatistics]);
  
  // Generate months up to current month
  const generateMonths = () => {
    const months: string[] = [];
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    for (let year = now.getFullYear() - 2; year <= now.getFullYear(); year++) {
      for (let m = 0; m < 12; m++) {
        // stop if we've reached current month in current year
        if (year === now.getFullYear() && m > now.getMonth()) break;
        months.push(`${monthNames[m]} ${year}`);
      }
    }
    return months;
  };

  const months = generateMonths();
  
  const generateWeeks = (monthStr: string) => {
    // Keep for UI only; actual data comes from API
    const [monthName, year] = monthStr.split(' ');
    const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
    const yearNum = parseInt(year, 10);
    const firstDay = new Date(yearNum, monthIndex, 1);
    const lastDay = new Date(yearNum, monthIndex + 1, 0);
    const weeks: any[] = [];
    let currentWeekStart = new Date(firstDay);
    while (currentWeekStart <= lastDay) {
      let weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > lastDay) weekEnd = new Date(lastDay);
      weeks.push({ label: `Week ${weeks.length + 1}`, start: new Date(currentWeekStart), end: new Date(weekEnd) });
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    return weeks;
  };

  const generateQuarters = () => {
    const now = new Date();
    const years = [now.getFullYear() - 2, now.getFullYear() -1, now.getFullYear()];
    const quarters: string[] = [];
    years.forEach(y => {
      for (let q = 1; q <= 4; q++) {
        if (y === now.getFullYear()) {
          const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
          if (q > currentQuarter) break;
        }
        quarters.push(`Q${q} ${y}`);
      }
    });
    return quarters;
  };

  const generateYears = () => {
    const now = new Date();
    return [ (now.getFullYear() - 2).toString(), (now.getFullYear() -1).toString(), now.getFullYear().toString()];
  };

  // Get available options based on period type
  const getAvailableOptions = () => {
    switch (activePeriod) {
      case 'days':
        return months; // For days, show months
      case 'weeks':
        return months; // For weeks, show months
      case 'months':
        return months;
      case 'quarters':
        return generateQuarters();
      case 'years':
        return generateYears();
      case 'custom...':
        return [];
      default:
        return months;
    }
  };

  const availableOptions = getAvailableOptions();
  
  // Set default selected value when period changes
  const handlePeriodChange = (period: string) => {
    setActivePeriod(period as 'days' | 'weeks' | 'months' | 'quarters' | 'years' | 'custom...');
    const options = period === 'quarters' ? generateQuarters() : 
                   period === 'years' ? generateYears() : months;
    if (options.length > 0) {
      setSelectedValue(options[options.length - 1]); // Select last option
    }
  };

  const scrollSelector = (direction: 'left' | 'right') => {
    if (selectorScrollRef.current) {
      const scrollAmount = 200;
      selectorScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Data is now provided by API: see fetchStatistics -> setTimeSeries / setOverview

  // Get previous period value
  const getPreviousPeriodValue = (period: string, currentValue: string) => {
    if (period === 'months') {
      const [monthName, year] = currentValue.split(' ');
      const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
      if (monthIndex > 0) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[monthIndex - 1]} ${year}`;
      }
    } else if (period === 'quarters') {
      const [quarter, year] = currentValue.split(' ');
      const quarterNum = parseInt(quarter.substring(1));
      if (quarterNum > 1) {
        return `Q${quarterNum - 1} ${year}`;
      } else {
        return `Q4 ${parseInt(year) - 1}`;
      }
    } else if (period === 'years') {
      return (parseInt(currentValue) - 1).toString();
    }
    return currentValue;
  };

  const currentPeriodData = useMemo(() => {
    if (timeSeries && timeSeries.length > 0) {
      return timeSeries.map((p: any, i: number) => ({ label: p.ts || p.label || p.date || `#${i}`, revenue: p.total_volume ?? p.revenue ?? 0, date: new Date(p.ts || p.date || Date.now()), index: i }));
    }
    return [];
  }, [timeSeries]);

  const previousPeriodData = useMemo(() => {
    if (!showPreviousPeriod) return [];
    if (previousTimeSeries && previousTimeSeries.length > 0) {
      return previousTimeSeries.map((p: any, i: number) => ({ label: p.ts || p.label || p.date || `#${i}`, revenue: p.total_volume ?? p.revenue ?? 0, date: new Date(p.ts || p.date || Date.now()), index: i }));
    }
    return [];
  }, [previousTimeSeries, showPreviousPeriod]);

  // Calculate totals - use API data if available
  const totalRevenue = overview?.total_volume ?? statistics?.totals?.revenue ?? (currentPeriodData.length > 0 ? currentPeriodData.reduce((s,d)=>s+(d.revenue||0),0) : 0);
  const totalTransactions = overview?.total_count ?? statistics?.totals?.transactions ?? (overview?.successful_count ?? 0);
  const totalRefunds = overview?.refunds_total ?? statistics?.totals?.refunds ?? Math.round(totalRevenue * 0.02);
  const totalChargebacks = overview?.chargebacks_total ?? statistics?.totals?.chargebacks ?? Math.round(totalRevenue * 0.005);

  // Chart dimensions and calculations
  const chartWidth = 800;
  const chartHeight = 200;
  const padding = { top: 10, right: 20, bottom: 20, left: 0 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Find max value for scaling
  const allRevenues = [
    ...currentPeriodData.map((d: { label: string; revenue: number; date: Date; index: number }) => d.revenue || 0),
    ...(showPreviousPeriod ? previousPeriodData.map((d: { label: string; revenue: number; date: Date; index: number }) => d.revenue || 0) : [])
  ].filter(rev => !isNaN(rev) && rev > 0);
  
  const maxRevenue = allRevenues.length > 0 ? Math.max(...allRevenues) : 100000;
  const maxValue = Math.ceil(maxRevenue / 10000) * 10000 || 100000; // Round up to nearest 10k, fallback to 100k

  // Scale function
  const scaleY = (value: number) => {
    return graphHeight - (value / maxValue) * graphHeight;
  };

  // Generate path for line chart
  const generatePath = (data: typeof currentPeriodData) => {
    if (data.length === 0) return '';
    const points = data.map((d: { label: string; revenue: number; date: Date; index: number }, index: number) => {
      const x = (index / (data.length - 1)) * graphWidth;
      const y = scaleY(d.revenue) + padding.top;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    });
    return points.join(' ');
  };

  // Generate area path (for filled area under curve)
  const generateAreaPath = (data: typeof currentPeriodData) => {
    if (data.length === 0) return '';
    const linePath = generatePath(data);
    const firstX = 0;
    const lastX = graphWidth;
    const bottomY = chartHeight - padding.bottom;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Get point position for hover
  const getPointPosition = (index: number) => {
    const divisor = Math.max(currentPeriodData.length - 1, 1);
    const x = (index / divisor) * graphWidth;
    const y = scaleY(currentPeriodData[index].revenue) + padding.top;
    return { x, y };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto fade-in">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
          <TrendUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Statistics</h1>
      </div>

      {loading && (
        <>
          {/* Skeleton Period Selector */}
          <div className="flex gap-1 mb-3 sm:mb-4 border-b-2 border-gray-200">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-t w-20 animate-pulse"></div>
            ))}
          </div>

          {/* Skeleton Dynamic Selector */}
          <div className="flex items-center gap-2 mb-6 sm:mb-8">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex gap-2 flex-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
              ))}
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Skeleton Revenue Display */}
          <div className="mb-4 sm:mb-6">
            <div className="h-12 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>

          {/* Skeleton Chart Area */}
          <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-end mb-4">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="flex gap-4 h-64">
              <div className="flex flex-col justify-between h-full">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                ))}
              </div>
              <div className="flex-1 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Skeleton Info Note */}
          <div className="mb-8">
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>

          {/* Skeleton Totals Section */}
          <div className="mb-8">
            <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 border border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Per Day Section */}
          <div>
            <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
            <div className="bg-white border border-gray-200 p-12">
              <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        </>
      )}

      {!loading && (
        <div className="fade-in">

      {/* Period Selector */}
      <div className="flex gap-1 mb-3 sm:mb-4 border-b-2 border-gray-200 overflow-x-auto">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period.toLowerCase() as 'days' | 'weeks' | 'months' | 'quarters' | 'years' | 'custom...')}
            className={`
              px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap
              ${activePeriod === period.toLowerCase()
                ? 'text-gray-900 bg-gray-50'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {period}
            {activePeriod === period.toLowerCase() && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Selector (Months/Weeks/Quarters/Years) */}
      {activePeriod !== 'custom...' && availableOptions.length > 0 && (
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <button 
            onClick={() => scrollSelector('left')}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <CaretLeft className="w-4 h-4" />
          </button>
          <div 
            ref={selectorScrollRef}
            className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1"
          >
            {availableOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedValue(option)}
                className={`
                  px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${selectedValue === option
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {option}
                {selectedValue === option && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                )}
              </button>
            ))}
          </div>
          <button 
            onClick={() => scrollSelector('right')}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <CaretRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Revenue and Chart Section */}
      <div className="mb-4 sm:mb-6">
        {/* Revenue Display */}
        <div className="mb-4 sm:mb-6">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Revenue</div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 sm:w-12 bg-green-500"></div>
            <span className="text-xs text-gray-500">Current period ({selectedValue})</span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200  p-4 sm:p-6 relative overflow-x-auto">
          {/* Toggle at top right */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 z-10">
            <span className="text-xs text-gray-600 whitespace-nowrap hidden sm:inline">Show previous period</span>
            <span className="text-xs text-gray-600 sm:hidden">Previous</span>
            <button
              onClick={() => setShowPreviousPeriod(!showPreviousPeriod)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                showPreviousPeriod ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  showPreviousPeriod ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-4 h-64 mt-8">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-full">
              {[4, 3, 2, 1, 0].map((value) => {
                const labelValue = (value * maxValue / 4);
                const formattedValue = labelValue >= 1000000 
                  ? `${(labelValue / 1000000).toFixed(1)}M`
                  : labelValue >= 1000
                  ? `${(labelValue / 1000).toFixed(0)}k`
                  : labelValue.toFixed(0);
                return (
                  <span key={value} className="text-xs text-gray-500">
                    XAF {formattedValue}
                  </span>
                );
              })}
            </div>

            {/* Chart */}
            <div className="flex-1 relative" 
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <svg 
                ref={chartRef}
                className="w-full h-full" 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#e5e7eb" strokeWidth="1" />
                {[0, 1, 2, 3, 4].map((i) => {
                  const y = padding.top + (i * graphHeight / 4);
                  return (
                    <line 
                      key={i}
                      x1={padding.left} 
                      y1={y} 
                      x2={chartWidth - padding.right} 
                      y2={y} 
                      stroke="#e5e7eb" 
                      strokeWidth="0.5" 
                    />
                  );
                })}
                <line 
                  x1={padding.left} 
                  y1={chartHeight - padding.bottom} 
                  x2={chartWidth - padding.right} 
                  y2={chartHeight - padding.bottom} 
                  stroke="#e5e7eb" 
                  strokeWidth="1" 
                />
                
                {/* Previous period area (if enabled) */}
                {showPreviousPeriod && (
                  <path
                    d={generateAreaPath(previousPeriodData)}
                    fill="url(#previousGradient)"
                    opacity="0.1"
                  />
                )}

                {/* Current period area */}
                <defs>
                  <linearGradient id="currentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="previousGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d={generateAreaPath(currentPeriodData)}
                  fill="url(#currentGradient)"
                />

                {/* Previous period line (if enabled) */}
                {showPreviousPeriod && (
                  <path
                    d={generatePath(previousPeriodData)}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    opacity="0.6"
                  />
                )}

                {/* Current period line */}
                <path
                  d={generatePath(currentPeriodData)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className="transition-all"
                />

                {/* Data points and hover areas */}
                {currentPeriodData.map((data: { label: string; revenue: number; date: Date; index: number }, index: number) => {
                  const { x, y } = getPointPosition(index);
                  const isHovered = hoveredIndex === index;
                  
                  return (
                    <g key={index}>
                      {/* Invisible hover area */}
                      <rect
                        x={x - graphWidth / (currentPeriodData.length * 2)}
                        y={padding.top}
                        width={graphWidth / currentPeriodData.length}
                        height={graphHeight}
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(index)}
                        className="cursor-pointer"
                      />
                      
                      {/* Data point */}
                      {isHovered && (
                        <>
                          {/* Vertical line */}
                          <line
                            x1={x}
                            y1={padding.top}
                            x2={x}
                            y2={chartHeight - padding.bottom}
                            stroke="#10b981"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                            opacity="0.5"
                          />
                          {/* Point circle */}
                          <circle
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#10b981"
                            stroke="white"
                            strokeWidth="2"
                          />
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
              
              {/* Tooltip */}
              {hoveredIndex !== null && currentPeriodData[hoveredIndex] && (
                <div
                  className="absolute bg-gray-900 text-white text-xs  px-3 py-2 z-20 pointer-events-none"
                  style={{
                    left: `${(hoveredIndex / Math.max(currentPeriodData.length - 1, 1)) * 100}%`,
                    top: `${(scaleY(currentPeriodData[hoveredIndex].revenue) / graphHeight) * 100 - 10}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div className="font-semibold mb-1">
                    {currentPeriodData[hoveredIndex].label}
                  </div>
                  <div className="text-green-400">
                    {formatCurrency(currentPeriodData[hoveredIndex].revenue)}
                  </div>
                  {showPreviousPeriod && previousPeriodData[hoveredIndex] && (
                    <div className="text-gray-400 mt-1 border-t border-gray-700 pt-1">
                      Prev: {formatCurrency(previousPeriodData[hoveredIndex].revenue)}
                    </div>
                  )}
                </div>
              )}
              
              {/* X-axis labels */}
              {currentPeriodData.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-500 -mb-5">
                  <span>{currentPeriodData[0]?.label || ''}</span>
                  <span>{currentPeriodData[currentPeriodData.length - 1]?.label || ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <p className="text-sm text-gray-600 mb-8">
        For accounting: use the{' '}
        <a href="/balance" className="text-green-600 hover:text-green-700 hover:underline">
          Balance
        </a>{' '}
        for accurate financial data.
      </p>

      {/* Totals Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Totals</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-white to-gray-50 p-6 border-2 border-gray-200  hover:border-green-400 transition-all">
            <div className="text-sm font-medium text-gray-900 mb-3">Revenue</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Transactions</span> {totalTransactions.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-sm font-medium text-gray-900">Refunds</div>
              <Info className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(totalRefunds)}</div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Transactions</span> {Math.floor(totalRefunds / 1000)}
            </div>
          </div>
          <div className="bg-white p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-900 mb-3">Chargebacks</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(totalChargebacks)}</div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Transactions</span> {Math.floor(totalChargebacks / 500)}
            </div>
          </div>
        </div>
      </div>

      {/* Per day Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Breakdown by {breakdownDimension.replace('_', ' ')}</h2>
        <div className="flex gap-2 mb-4">
          {(['payment_method', 'status', 'currency', 'product'] as const).map((dim) => (
            <button
              key={dim}
              onClick={() => setBreakdownDimension(dim)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                breakdownDimension === dim
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {dim.replace('_', ' ')}
            </button>
          ))}
        </div>
        {breakdown.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">{breakdownDimension.replace('_', ' ')}</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900">Volume</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900">Count</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((item: any, idx: number) => {
                    const totalVolume = breakdown.reduce((sum: number, x: any) => sum + (x.total_volume || x.volume || 0), 0);
                    const percentage = totalVolume > 0 ? ((item.total_volume || item.volume || 0) / totalVolume * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900 font-medium">{item.dimension_value || item.name || '-'}</td>
                        <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(item.total_volume || item.volume || 0)}</td>
                        <td className="px-6 py-4 text-right text-gray-700">{(item.total_count || item.count || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-gray-700">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <SquaresFour className="w-8 h-8 text-gray-400 mb-3" />
              <p className="text-sm text-gray-500">No breakdown data found for this period</p>
            </div>
          </div>
        )}
      </div>

      {/* Events Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Payment Events</h2>
        {events.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Event</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900 font-medium">{event.id || event.transaction_id || '-'}</td>
                      <td className="px-6 py-4 text-gray-700">{event.type || event.event_type || '-'}</td>
                      <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(event.amount || 0)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.status === 'completed' || event.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : event.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{new Date(event.created_at || event.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <SquaresFour className="w-8 h-8 text-gray-400 mb-3" />
              <p className="text-sm text-gray-500">No events found for this period</p>
            </div>
          </div>
        )}
      </div>

      {/* Per day Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Per day</h2>
        <div className="bg-white border border-gray-200  p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <SquaresFour className="w-8 h-8 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">No statistics found for this period</p>
          </div>
        </div>
      </div>
        </div>
      )}
      </div>
    </div>
  );
}

