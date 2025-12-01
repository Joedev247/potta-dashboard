'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, ChevronDown, Eye, CheckCircle2, Printer, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('settlements');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRange, setSelectedRange] = useState({ start: '27/11/2025', end: '28/11/2025' });
  const [calendarMonth, setCalendarMonth] = useState(11); // November
  const [calendarYear, setCalendarYear] = useState(2025);
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [predefinedRange, setPredefinedRange] = useState(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'settlements', label: 'Settlements' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'balance-report', label: 'Balance report' },
  ];

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // Format date as DD/MM/YYYY
  const formatDate = (day: number, month: number, year: number) => {
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  };

  // Handle predefined range selection
  const handlePredefinedRange = (range: string) => {
    setPredefinedRange(range);
    const today = new Date();
    let startDate: Date;
    let endDate = new Date(today);

    switch (range) {
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = new Date(startDate);
        break;
      case 'this-week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
        break;
      case 'this-month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'last-3-months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      default:
        return;
    }

    setSelectedRange({
      start: formatDate(startDate.getDate(), startDate.getMonth() + 1, startDate.getFullYear()),
      end: formatDate(endDate.getDate(), endDate.getMonth() + 1, endDate.getFullYear()),
    });
  };

  // Handle date selection from calendar
  const handleDateClick = (day: number) => {
    const dateStr = formatDate(day, calendarMonth, calendarYear);
    
    if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
      // Start new selection
      setSelectedDates({ start: dateStr, end: null });
      setSelectedRange({ start: dateStr, end: dateStr });
    } else {
      // Complete selection
      const start = selectedDates.start;
      const end = dateStr;
      if (new Date(end.split('/').reverse().join('-')) < new Date(start.split('/').reverse().join('-'))) {
        setSelectedDates({ start: end, end: start });
        setSelectedRange({ start: end, end: start });
      } else {
        setSelectedDates({ start, end });
        setSelectedRange({ start, end });
      }
    }
    setPredefinedRange(null);
  };

  // Check if date is in selected range
  const isDateInRange = (day: number) => {
    if (!selectedRange.start || !selectedRange.end) return false;
    const dateStr = formatDate(day, calendarMonth, calendarYear);
    const start = selectedRange.start.split('/').reverse().join('-');
    const end = selectedRange.end.split('/').reverse().join('-');
    const current = dateStr.split('/').reverse().join('-');
    return current >= start && current <= end;
  };

  // Check if date is selected
  const isDateSelected = (day: number) => {
    const dateStr = formatDate(day, calendarMonth, calendarYear);
    return selectedRange.start === dateStr || selectedRange.end === dateStr;
  };

  // Navigate calendar months
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (calendarMonth === 1) {
        setCalendarMonth(12);
        setCalendarYear(calendarYear - 1);
      } else {
        setCalendarMonth(calendarMonth - 1);
      }
    } else {
      if (calendarMonth === 12) {
        setCalendarMonth(1);
        setCalendarYear(calendarYear + 1);
      } else {
        setCalendarMonth(calendarMonth + 1);
      }
    }
  };

  // Apply filter
  const applyFilter = () => {
    setShowDatePicker(false);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
    const days: (number | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Reports</h1>
        </div>
        <button className="px-5 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all  shadow-lg flex items-center gap-2 transform hover:scale-105">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b-2 border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2 text-sm font-semibold transition-colors relative
              ${activeTab === tab.id
                ? 'text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200  text-sm text-gray-700">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
          <ChevronDown className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200  text-sm text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>Last 30 days</span>
          <ChevronDown className="w-4 h-4" />
        </div>
        <button className="px-4 py-2 bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors ">
          Balance
        </button>
        <button className="px-4 py-2 bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors ">
          Year
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'settlements' && (
        <div className="bg-white border border-gray-200  overflow-hidden shadow-sm">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
              <div>Settlement ID</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {[
              { id: 'stl_abc123', date: '2024-01-15', amount: 'XAF 5,250.00', status: 'paid' },
              { id: 'stl_def456', date: '2024-01-14', amount: 'XAF 3,800.00', status: 'paid' },
              { id: 'stl_ghi789', date: '2024-01-13', amount: 'XAF 4,200.00', status: 'pending' },
              { id: 'stl_jkl012', date: '2024-01-12', amount: 'XAF 2,950.00', status: 'paid' },
            ].map((settlement) => (
              <div key={settlement.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="font-mono text-sm text-gray-900">{settlement.id}</div>
                  <div className="text-sm text-gray-600">{settlement.date}</div>
                  <div className="font-semibold text-gray-900">{settlement.amount}</div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium  ${
                      settlement.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {settlement.status}
                    </span>
                  </div>
                  <div>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white border border-gray-200  overflow-hidden shadow-sm">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
              <div>Invoice ID</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {[
              { id: 'inv_001', date: '2024-01-15', amount: 'XAF 1,250.00', status: 'paid' },
              { id: 'inv_002', date: '2024-01-14', amount: 'XAF 850.00', status: 'paid' },
              { id: 'inv_003', date: '2024-01-13', amount: 'XAF 2,100.00', status: 'pending' },
              { id: 'inv_004', date: '2024-01-12', amount: 'XAF 950.00', status: 'paid' },
            ].map((invoice) => (
              <div key={invoice.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="font-mono text-sm text-gray-900">{invoice.id}</div>
                  <div className="text-sm text-gray-600">{invoice.date}</div>
                  <div className="font-semibold text-gray-900">{invoice.amount}</div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'balance-report' && (
        <div>
          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mb-6">
            <button className="p-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors rounded flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download annual reports
            </button>
            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Period Selector */}
          <div className="mb-6 relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 text-sm text-gray-700 px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">Period</span>
              <span className="text-gray-400">|</span>
              <span>{selectedRange.start} - {selectedRange.end}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 w-[420px]">
                {/* Top Bar - Current Period Display */}
                <div className="px-2 py-1.5 border-b border-gray-200">
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                    <span className="font-medium">Period</span>
                    <span className="text-gray-400">|</span>
                    <span>{selectedRange.start} - {selectedRange.end}</span>
                  </div>
                </div>

                {/* Main Date Picker Panel */}
                <div className="flex">
                  {/* Left Column - Predefined Ranges */}
                  <div className="w-1/3 border-r border-gray-200 p-2">
                    <div className="space-y-1">
                      {[
                        { id: 'yesterday', label: 'Yesterday' },
                        { id: 'this-week', label: 'This week' },
                        { id: 'this-month', label: 'This month' },
                        { id: 'last-3-months', label: 'Last 3 months' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handlePredefinedRange(option.id)}
                          className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                            predefinedRange === option.id
                              ? 'bg-green-50 border border-green-500 text-green-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column - Custom Date Range & Calendar */}
                  <div className="w-2/3 p-2">
                    {/* Custom Date Input Fields */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={selectedRange.start}
                          readOnly
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-gray-700"
                        />
                        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                      <span className="text-xs text-gray-500">to</span>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={selectedRange.end}
                          readOnly
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-gray-700"
                        />
                        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Calendar Navigation */}
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronLeft className="w-3 h-3 text-gray-600" />
                      </button>
                      <div className="text-xs font-medium text-gray-900">
                        {monthNames[calendarMonth - 1]} {calendarYear}
                      </div>
                      <button
                        onClick={() => navigateMonth('next')}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="mb-2">
                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <div key={day} className="text-[10px] text-gray-500 text-center py-0.5 font-medium">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-0.5">
                        {generateCalendarDays().map((day, index) => {
                          if (day === null) {
                            return <div key={`empty-${index}`} className="aspect-square" />;
                          }

                          const isSelected = isDateSelected(day);
                          const inRange = isDateInRange(day);
                          const isToday = day === new Date().getDate() && 
                                         calendarMonth === new Date().getMonth() + 1 && 
                                         calendarYear === new Date().getFullYear();

                          return (
                            <button
                              key={day}
                              onClick={() => handleDateClick(day)}
                              className={`
                                aspect-square text-xs rounded transition-colors
                                ${isSelected
                                  ? 'bg-green-500 text-white font-semibold'
                                  : inRange
                                  ? 'bg-green-50 text-green-700'
                                  : isToday
                                  ? 'bg-gray-100 text-gray-900 font-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                                }
                              `}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Apply Filter Button */}
                    <button
                      onClick={applyFilter}
                      className="w-full px-2 py-1.5 bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors rounded"
                    >
                      Apply filter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Balance Report Table */}
          <div className="bg-white border border-gray-200  overflow-hidden shadow-sm">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700">
                <div>Category</div>
                <div className="text-right">Pending</div>
                <div className="text-right">Available</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {[
                { category: 'Opening balance (27 Nov)', pending: 'XAF 0.00', available: 'XAF 0.00' },
                { category: 'Payments', pending: 'XAF 0.00', available: 'XAF 0.00' },
                { category: 'Refunds', pending: 'XAF 0.00', available: 'XAF 0.00' },
                { category: 'Chargebacks', pending: 'XAF 0.00', available: 'XAF 0.00' },
                { category: 'Transfers', pending: 'XAF 0.00', available: 'XAF 0.00' },
                { category: 'Top-ups', pending: 'XAF 0.00', available: 'XAF 0.00' },
                { category: 'Corrections', pending: 'XAF 0.00', available: 'XAF 0.00' },
                { category: 'Fees charged', pending: 'XAF 0.00', available: 'XAF 0.00' },
                { category: 'Closing balance (28 Nov)', pending: 'XAF 0.00', available: 'XAF 0.00', isTotal: true },
              ].map((row, index) => (
                <div
                  key={index}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                    row.isTotal ? 'bg-gray-50 font-semibold' : ''
                  }`}
                >
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className={`text-sm ${row.isTotal ? 'text-gray-900' : 'text-gray-700'}`}>
                      {row.category}
                    </div>
                    <div className={`text-sm text-right ${row.isTotal ? 'text-gray-900' : 'text-gray-600'}`}>
                      {row.pending}
                    </div>
                    <div className={`text-sm text-right ${row.isTotal ? 'text-gray-900' : 'text-gray-600'}`}>
                      {row.available}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
