'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Info, ChevronLeft, ChevronRight, Grid3x3, TrendingUp, Loader2 } from 'lucide-react';
import { statisticsService } from '@/lib/api';
import { formatCurrency } from '@/lib/utils/format';

export default function StatisticsPage() {
  const [activePeriod, setActivePeriod] = useState<'days' | 'weeks' | 'months' | 'quarters' | 'years' | 'custom...'>('months');
  const [selectedValue, setSelectedValue] = useState('November 2025');
  const [showPreviousPeriod, setShowPreviousPeriod] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const selectorScrollRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  const periods = ['Days', 'Weeks', 'Months', 'Quarters', 'Years', 'Custom...'];

  // Fetch statistics from API
  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await statisticsService.getStatistics({
        period: activePeriod,
        value: selectedValue,
        comparePrevious: showPreviousPeriod,
      });
      
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [activePeriod, selectedValue, showPreviousPeriod]);

  // Fetch statistics when period or value changes
  useEffect(() => {
    if (activePeriod !== 'custom...') {
      fetchStatistics();
    }
  }, [fetchStatistics]);
  
  // Generate months from January to current month (November 2025)
  const generateMonths = () => {
    const months = [];
    const currentDate = new Date(2025, 10, 1); // November 2025
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    for (let i = 0; i <= currentDate.getMonth(); i++) {
      months.push(`${monthNames[i]} 2025`);
    }
    return months;
  };

  const months = generateMonths();
  
  // Generate weeks for current month
  const generateWeeks = (monthStr: string) => {
    const [monthName, year] = monthStr.split(' ');
    const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
    const yearNum = parseInt(year);
    const firstDay = new Date(yearNum, monthIndex, 1);
    const lastDay = new Date(yearNum, monthIndex + 1, 0);
    const weeks = [];
    
    let currentWeekStart = new Date(firstDay);
    while (currentWeekStart <= lastDay) {
      let weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > lastDay) weekEnd = new Date(lastDay);
      
      weeks.push({
        label: `Week ${weeks.length + 1}`,
        start: new Date(currentWeekStart),
        end: new Date(weekEnd),
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    return weeks;
  };

  // Generate quarters
  const generateQuarters = () => {
    return [
      'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'
    ];
  };

  // Generate years
  const generateYears = () => {
    return ['2023', '2024', '2025'];
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
    setActivePeriod(period);
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

  // Generate data based on period type and selected value
  const generateDataForPeriod = (period: string, value: string, isPrevious: boolean = false) => {
    const data: Array<{ label: string; revenue: number; date: Date; index: number }> = [];
    
    if (period === 'days') {
      // Daily data for selected month
      const [monthName, year] = value.split(' ');
      const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
      const yearNum = parseInt(year);
      const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
      const seed = isPrevious ? monthIndex - 1 : monthIndex;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(yearNum, monthIndex, day);
        const random = ((seed * 1000 + day * 37) % 1000) / 1000;
        const baseRevenue = random * 50000 + 10000;
        const revenue = Math.round(isPrevious ? baseRevenue * 0.9 : baseRevenue);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        const monthAbbr = monthName.substring(0, 3);
        
        data.push({
          label: `${dayName} ${day.toString().padStart(2, '0')} ${monthAbbr}`,
          revenue,
          date,
          index: day - 1,
        });
      }
    } else if (period === 'weeks') {
      // Weekly data for selected month
      const weeks = generateWeeks(value);
      const [monthName, year] = value.split(' ');
      const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
      const seed = isPrevious ? monthIndex - 1 : monthIndex;
      
      weeks.forEach((week, index) => {
        const random = ((seed * 100 + index * 17) % 100) / 100;
        const baseRevenue = random * 300000 + 70000; // Weekly revenue
        const revenue = Math.round(isPrevious ? baseRevenue * 0.9 : baseRevenue);
        data.push({
          label: week.label,
          revenue,
          date: week.start,
          index,
        });
      });
    } else if (period === 'months') {
      // Monthly data for all months
      const [monthName, year] = value.split(' ');
      const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
      const yearNum = parseInt(year);
      const seed = isPrevious ? monthIndex - 1 : monthIndex;
      
      const random = ((seed * 50 + 23) % 100) / 100;
      const baseRevenue = random * 1500000 + 300000; // Monthly revenue
      const revenue = Math.round(isPrevious ? baseRevenue * 0.9 : baseRevenue);
      
      data.push({
        label: value,
        revenue,
        date: new Date(yearNum, monthIndex, 1),
        index: 0,
      });
    } else if (period === 'quarters') {
      // Quarterly data
      const [quarter, year] = value.split(' ');
      const quarterNum = parseInt(quarter.substring(1)) - 1;
      const yearNum = parseInt(year);
      
      if (isNaN(quarterNum) || isNaN(yearNum)) {
        return data;
      }
      
      let seed = quarterNum;
      if (isPrevious) {
        if (quarterNum > 0) {
          seed = quarterNum - 1;
        } else {
          // Previous quarter is Q4 of previous year
          seed = 3;
        }
      }
      
      // Ensure seed is non-negative
      seed = Math.max(0, seed);
      const random = ((seed * 30 + 17) % 100) / 100;
      const baseRevenue = random * 4500000 + 900000; // Quarterly revenue
      const revenue = Math.round(isPrevious ? baseRevenue * 0.9 : baseRevenue);
      
      data.push({
        label: value,
        revenue: isNaN(revenue) ? 0 : revenue,
        date: new Date(yearNum, quarterNum * 3, 1),
        index: 0,
      });
    } else if (period === 'years') {
      // Yearly data
      const yearNum = parseInt(value);
      
      if (isNaN(yearNum)) {
        return data;
      }
      
      const seed = isPrevious ? yearNum - 1 : yearNum;
      const random = ((Math.abs(seed) * 20 + 13) % 100) / 100;
      const baseRevenue = random * 18000000 + 3600000; // Yearly revenue
      const revenue = Math.round(isPrevious ? baseRevenue * 0.9 : baseRevenue);
      
      data.push({
        label: value,
        revenue: isNaN(revenue) ? 0 : revenue,
        date: new Date(yearNum, 0, 1),
        index: 0,
      });
    }
    
    return data;
  };

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
    // Use API data if available, otherwise fallback to generated data
    if (statistics?.dataPoints && statistics.dataPoints.length > 0) {
      return statistics.dataPoints.map((point: any, index: number) => ({
        label: point.label,
        revenue: point.revenue || 0,
        date: new Date(point.date),
        index,
      }));
    }
    return generateDataForPeriod(activePeriod, selectedValue, false);
  }, [statistics, activePeriod, selectedValue]);

  const previousPeriodData = useMemo(() => {
    if (!showPreviousPeriod) return [];
    // Use API previous period data if available
    if (statistics?.previousPeriod) {
      // Return empty array as previous period data structure may vary
      return [];
    }
    const previousValue = getPreviousPeriodValue(activePeriod, selectedValue);
    return generateDataForPeriod(activePeriod, previousValue, true);
  }, [statistics, activePeriod, selectedValue, showPreviousPeriod]);

  // Calculate totals - use API data if available
  const totalRevenue = statistics?.totals?.revenue ?? 
    (currentPeriodData.length > 0 
      ? currentPeriodData.reduce((sum, d) => {
          const rev = d.revenue || 0;
          return sum + (isNaN(rev) ? 0 : rev);
        }, 0)
      : 0);
  
  const totalTransactions = statistics?.totals?.transactions ?? 
    (currentPeriodData.length > 0 
      ? currentPeriodData.length * Math.floor(Math.random() * 50 + 20)
      : 0);
  
  const totalRefunds = statistics?.totals?.refunds ?? Math.round(totalRevenue * 0.02);
  const totalChargebacks = statistics?.totals?.chargebacks ?? Math.round(totalRevenue * 0.005);

  // Chart dimensions and calculations
  const chartWidth = 800;
  const chartHeight = 200;
  const padding = { top: 10, right: 20, bottom: 20, left: 0 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Find max value for scaling
  const allRevenues = [
    ...currentPeriodData.map(d => d.revenue || 0),
    ...(showPreviousPeriod ? previousPeriodData.map(d => d.revenue || 0) : [])
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
    const points = data.map((d, index) => {
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
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Statistics</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      )}

      {/* Period Selector */}
      <div className="flex gap-1 mb-4 border-b-2 border-gray-200">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period.toLowerCase())}
            className={`
              px-4 py-2 text-sm font-semibold transition-colors relative
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
        <div className="flex items-center gap-2 mb-8">
          <button 
            onClick={() => scrollSelector('left')}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
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
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Revenue and Chart Section */}
      <div className="mb-6">
        {/* Revenue Display */}
        <div className="mb-6">
          <div className="text-5xl font-bold text-gray-900 mb-2">{formatCurrency(totalRevenue)}</div>
          <div className="text-sm text-gray-600 mb-3">Revenue</div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 bg-green-500"></div>
            <span className="text-xs text-gray-500">Current period ({selectedValue})</span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200  p-6 relative">
          {/* Toggle at top right */}
          <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
            <span className="text-xs text-gray-600 whitespace-nowrap">Show previous period</span>
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
                {currentPeriodData.map((data, index) => {
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
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Per day</h2>
        <div className="bg-white border border-gray-200  p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Grid3x3 className="w-8 h-8 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">No statistics found for this period</p>
          </div>
        </div>
      </div>
    </div>
  );
}

