'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Download, Calendar, Funnel, CaretDown, Eye, CheckCircle, Printer, CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { reportsService, invoicingService } from '@/lib/api';
import { useOrganization } from '@/contexts/OrganizationContext';
import { formatDate as formatDateUtil, formatCurrency } from '@/lib/utils/format';
import type { ApiResponse } from '@/lib/api';

export default function ReportsPage() {
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState('settlements');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [calendarMonth, setCalendarMonth] = useState(0);
  const [calendarYear, setCalendarYear] = useState(0);
  
  // Initialize date range and calendar on client side only to avoid hydration mismatch
  useEffect(() => {
    if (!selectedRange.start || !selectedRange.end) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const formatDateForRange = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };
      
      setSelectedRange({
        start: formatDateForRange(yesterday),
        end: formatDateForRange(today),
      });
      
      setCalendarMonth(today.getMonth() + 1);
      setCalendarYear(today.getFullYear());
    }
  }, []);
  const [selectedDates, setSelectedDates] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [predefinedRange, setPredefinedRange] = useState<string | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showBalanceDropdown, setShowBalanceDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 days');
  const [selectedBalance, setSelectedBalance] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  
  // Initialize year on client side only to avoid hydration mismatch
  useEffect(() => {
    if (!selectedYear) {
      setSelectedYear(new Date().getFullYear().toString());
    }
  }, []);
  
  const filterRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

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
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setShowPeriodDropdown(false);
      }
      if (balanceRef.current && !balanceRef.current.contains(event.target as Node)) {
        setShowBalanceDropdown(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    if (showDatePicker || showFilterDropdown || showPeriodDropdown || showBalanceDropdown || showYearDropdown || showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker, showFilterDropdown, showPeriodDropdown, showBalanceDropdown, showYearDropdown, showExportDropdown]);

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
      if (start) {
        const end = dateStr;
        if (new Date(end.split('/').reverse().join('-')) < new Date(start.split('/').reverse().join('-'))) {
          setSelectedDates({ start: end, end: start });
          setSelectedRange({ start: end, end: start });
        } else {
          setSelectedDates({ start, end });
          setSelectedRange({ start, end });
        }
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

  // Apply filter for balance report period
  const applyFilter = () => {
    setShowDatePicker(false);
    // The period filter is already applied when dates are selected
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

  // API data state
  const [settlements, setSettlements] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<{ total: number; successful: number; failed: number } | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [financialReport, setFinancialReport] = useState<any>(null);
  const [loading, setLoading] = useState({ settlements: false, invoices: false, balanceReport: false });
  const [exportLoading, setExportLoading] = useState(false);

  // Helper to convert date format for API
  const convertToAPIDate = (dateStr: string): string => {
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Fetch settlements (Payment Report)
  const fetchSettlements = useCallback(async () => {
    setLoading(prev => ({ ...prev, settlements: true }));
    try {
      const params: any = {};
      
      if (selectedRange.start && selectedRange.end) {
        params.startDate = convertToAPIDate(selectedRange.start);
        params.endDate = convertToAPIDate(selectedRange.end);
      } else if (selectedPeriod && selectedPeriod !== 'All') {
        const today = new Date();
        let startDate: Date = today;
        
        switch (selectedPeriod) {
          case 'Last 7 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
          case 'Last 30 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);
            break;
          case 'Last 90 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 90);
            break;
          case 'This year':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
        }
        
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      }
      
      if (selectedFilter && selectedFilter !== 'All') {
        params.status = selectedFilter.toLowerCase();
      }
      
      if (organization?.id) {
        params.organizationId = organization.id;
      }
      
      if (selectedCurrency && selectedCurrency !== 'All') {
        params.currency = selectedCurrency;
      }
      
      const response = await reportsService.getPaymentReport(params);
      if (response.success && response.data) {
        // Normalize payment data to match expected structure
        const payments = (response.data.payments || []).map((payment: any) => ({
          id: payment.id || payment.transaction_id || payment.payment_id || '',
          date: payment.createdAt || payment.created_at || payment.date || new Date().toISOString(),
          amount: payment.amount || 0,
          currency: payment.currency || 'XAF',
          status: (payment.status || 'pending').toLowerCase(),
          ...payment, // Keep original data for details
        }));
        setSettlements(payments);
        setPaymentSummary(response.data.summary || { total: 0, successful: 0, failed: 0 });
      } else {
        setSettlements([]);
        setPaymentSummary(null);
      }
    } catch (error) {
      console.error('Error fetching payment report:', error);
      setSettlements([]);
      setPaymentSummary(null);
    } finally {
      setLoading(prev => ({ ...prev, settlements: false }));
    }
  }, [selectedPeriod, selectedFilter, selectedRange]);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(prev => ({ ...prev, invoices: true }));
    try {
      const params: any = {};
      
      if (selectedPeriod && selectedPeriod !== 'All') {
        const today = new Date();
        let startDate: Date = today;
        
        switch (selectedPeriod) {
          case 'Last 7 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
          case 'Last 30 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);
            break;
          case 'Last 90 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 90);
            break;
          case 'This year':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
        }
        
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      }
      
      if (selectedFilter && selectedFilter !== 'All') {
        params.status = selectedFilter.toLowerCase();
      }
      
      const response = await invoicingService.getInvoices(params);
      if (response.success && response.data) {
        setInvoices(Array.isArray(response.data) ? response.data : []);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(prev => ({ ...prev, invoices: false }));
    }
  }, [selectedPeriod, selectedFilter]);

  // Fetch balance report (Financial Report)
  const fetchBalanceReport = useCallback(async () => {
    if (!selectedRange.start || !selectedRange.end) {
      setFinancialReport(null);
      return;
    }
    
    setLoading(prev => ({ ...prev, balanceReport: true }));
    try {
      const startDate = convertToAPIDate(selectedRange.start);
      const endDate = convertToAPIDate(selectedRange.end);
      
      const params: any = {
        startDate,
        endDate,
        format: 'JSON',
      };
      
      if (organization?.id) {
        params.organizationId = organization.id;
      }
      
      if (selectedCurrency && selectedCurrency !== 'All') {
        params.currency = selectedCurrency;
      }
      
      const response = await reportsService.getFinancialReport(params);
      
      if (response.success && response.data) {
        setFinancialReport(response.data);
      } else {
        setFinancialReport(null);
      }
    } catch (error) {
      console.error('Error fetching financial report:', error);
      setFinancialReport(null);
    } finally {
      setLoading(prev => ({ ...prev, balanceReport: false }));
    }
  }, [selectedRange]);

  // Fetch data when tab or filters change
  useEffect(() => {
    if (activeTab === 'settlements') {
      fetchSettlements();
    } else if (activeTab === 'invoices') {
      fetchInvoices();
    } else if (activeTab === 'balance-report') {
      fetchBalanceReport();
    }
  }, [activeTab, fetchSettlements, fetchInvoices, fetchBalanceReport]);

  // Trigger API calls when date range changes
  useEffect(() => {
    if (selectedRange.start && selectedRange.end) {
      if (activeTab === 'settlements') {
        fetchSettlements();
      } else if (activeTab === 'invoices') {
        fetchInvoices();
      } else if (activeTab === 'balance-report') {
        fetchBalanceReport();
      }
    }
  }, [selectedRange, activeTab, fetchSettlements, fetchInvoices, fetchBalanceReport]);

  // Filter data based on selected filters
  const getFilteredData = () => {
    let data = activeTab === 'settlements' ? settlements : invoices;
    
    // Filter by status
    if (selectedFilter && selectedFilter !== 'All') {
      data = data.filter(item => item.status === selectedFilter.toLowerCase());
    }
    
    // Filter by period
    if (selectedPeriod && selectedPeriod !== 'All') {
      const today = new Date();
      const periodStart = new Date();
      
      switch (selectedPeriod) {
        case 'Last 7 days':
          periodStart.setDate(today.getDate() - 7);
          break;
        case 'Last 30 days':
          periodStart.setDate(today.getDate() - 30);
          break;
        case 'Last 90 days':
          periodStart.setDate(today.getDate() - 90);
          break;
        case 'This year':
          periodStart.setMonth(0, 1);
          break;
        default:
          break;
      }
      
      data = data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= periodStart && itemDate <= today;
      });
    }
    
    // Filter by year
    if (selectedYear) {
      data = data.filter(item => {
        const itemYear = new Date(item.date).getFullYear().toString();
        return itemYear === selectedYear;
      });
    }
    
    // Filter by balance range
    if (selectedBalance && selectedBalance !== 'All') {
      data = data.filter(item => {
        const amount = item.amount;
        switch (selectedBalance) {
          case '0-1000':
            return amount >= 0 && amount <= 1000;
          case '1000-5000':
            return amount > 1000 && amount <= 5000;
          case '5000-10000':
            return amount > 5000 && amount <= 10000;
          case '10000+':
            return amount > 10000;
          default:
            return true;
        }
      });
    }
    
    return data;
  };

  // Generate PDF content as HTML
  const generatePDFContent = (type: 'annual' | 'report') => {
    const year = selectedYear || new Date().getFullYear().toString();
    const reportTitle = type === 'annual' 
      ? `Annual Balance Report - ${year}` 
      : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`;
    
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportTitle}</title>
        <style>
          @media print {
            @page { margin: 1cm; size: A4; }
            body { margin: 0; padding: 20px; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #111827;
            background: #ffffff;
            padding: 40px;
          }
          .report-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
          }
          .header h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
          }
          .header .subtitle {
            font-size: 16px;
            opacity: 0.95;
            font-weight: 500;
            margin-top: 8px;
          }
          .header .period {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px 40px;
            background: #f9fafb;
          }
          .summary-card {
            background: white;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .summary-card .label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .summary-card .value {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
          }
          .summary-card.revenue .value { color: #10b981; }
          .summary-card.refunds .value { color: #ef4444; }
          .summary-card.net .value { color: #3b82f6; }
          .content-section {
            padding: 40px;
          }
          .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #3b82f6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          thead {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          }
          th {
            padding: 16px 14px;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #d1d5db;
          }
          th.text-right {
            text-align: right;
          }
          td {
            padding: 14px;
            border-bottom: 1px solid #e5e7eb;
            color: #111827;
            font-size: 14px;
          }
          td.text-right {
            text-align: right;
          }
          tbody tr {
            transition: background-color 0.2s;
          }
          tbody tr:hover {
            background-color: #f9fafb;
          }
          tbody tr:last-child td {
            border-bottom: none;
          }
          .highlight-row {
            background-color: #eff6ff !important;
            font-weight: 700;
          }
          .highlight-row td {
            color: #1e40af;
            font-size: 15px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-paid, .status-completed { background: #10b981; color: white; }
          .status-pending { background: #f59e0b; color: white; }
          .status-failed, .status-cancelled { background: #ef4444; color: white; }
          .status-sent { background: #3b82f6; color: white; }
          .currency-section {
            margin-top: 30px;
            padding: 20px;
            background: #f0f9ff;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }
          .currency-section h3 {
            font-size: 16px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 16px;
          }
          .currency-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
          }
          .currency-item {
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #bfdbfe;
          }
          .currency-item .currency-code {
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 4px;
          }
          .currency-item .currency-amount {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
          }
          .footer {
            padding: 30px 40px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .footer p {
            margin-bottom: 4px;
          }
          .footer strong {
            color: #374151;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
        <div class="header">
            <h1>${reportTitle}</h1>
            <div class="subtitle">Financial Analysis & Summary</div>
            <div class="period">Period: ${selectedRange.start} - ${selectedRange.end}</div>
        </div>
    `;

    if (type === 'annual' || activeTab === 'balance-report') {
      const report = financialReport || { revenue: 0, refunds: 0, net: 0, byCurrency: {} };
      const currencyEntries = Object.entries(report.byCurrency || {});
      
      htmlContent += `
          <div class="summary-cards">
            <div class="summary-card revenue">
              <div class="label">Total Revenue</div>
              <div class="value">${formatCurrency(report.revenue || 0, 'XAF')}</div>
            </div>
            <div class="summary-card refunds">
              <div class="label">Total Refunds</div>
              <div class="value">${formatCurrency(report.refunds || 0, 'XAF')}</div>
            </div>
            <div class="summary-card net">
              <div class="label">Net Amount</div>
              <div class="value">${formatCurrency(report.net || 0, 'XAF')}</div>
            </div>
          </div>
          
          <div class="content-section">
            <h2 class="section-title">Financial Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
                  <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
                <tr>
                  <td><strong>Revenue</strong></td>
                  <td class="text-right"><strong>${formatCurrency(report.revenue || 0, 'XAF')}</strong></td>
                </tr>
                <tr>
                  <td><strong>Refunds</strong></td>
                  <td class="text-right"><strong>${formatCurrency(report.refunds || 0, 'XAF')}</strong></td>
                </tr>
                <tr class="highlight-row">
                  <td><strong>Net Amount</strong></td>
                  <td class="text-right"><strong>${formatCurrency(report.net || 0, 'XAF')}</strong></td>
                </tr>
          </tbody>
        </table>
      `;
      
      if (currencyEntries.length > 0) {
        htmlContent += `
            <div class="currency-section">
              <h3>Breakdown by Currency</h3>
              <div class="currency-grid">
                ${currencyEntries.map(([currency, amount]) => `
                  <div class="currency-item">
                    <div class="currency-code">${currency}</div>
                    <div class="currency-amount">${formatCurrency(amount as number, currency)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
        `;
      }
      
      htmlContent += `</div>`;
    } else {
      const dataToExport = getFilteredData();
      const columns = activeTab === 'settlements' 
        ? ['Settlement ID', 'Date', 'Amount', 'Status']
        : ['Invoice ID', 'Date', 'Amount', 'Status'];
      
      // Calculate totals
      const totalAmount = dataToExport.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const statusCounts = dataToExport.reduce((acc: any, item: any) => {
        const status = (item.status || 'unknown').toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      htmlContent += `
          <div class="summary-cards">
            <div class="summary-card net">
              <div class="label">Total ${activeTab === 'settlements' ? 'Settlements' : 'Invoices'}</div>
              <div class="value">${dataToExport.length}</div>
            </div>
            <div class="summary-card revenue">
              <div class="label">Total Amount</div>
              <div class="value">${formatCurrency(totalAmount, 'XAF')}</div>
            </div>
            <div class="summary-card">
              <div class="label">Status Breakdown</div>
              <div class="value" style="font-size: 14px; line-height: 1.8;">
                ${Object.entries(statusCounts).map(([status, count]) => 
                  `<div>${status}: ${count}</div>`
                ).join('')}
              </div>
            </div>
          </div>
          
          <div class="content-section">
            <h2 class="section-title">${activeTab === 'settlements' ? 'Settlements' : 'Invoices'} Details</h2>
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
      `;
      
      dataToExport.forEach((item: any) => {
        const status = (item.status || 'unknown').toLowerCase();
        const statusClass = status.includes('paid') || status.includes('completed') ? 'paid' :
                          status.includes('pending') ? 'pending' :
                          status.includes('failed') || status.includes('cancelled') ? 'failed' :
                          status.includes('sent') ? 'sent' : 'pending';
        
        htmlContent += `
          <tr>
                  <td><strong>${item.id}</strong></td>
                  <td>${item.date || 'N/A'}</td>
                  <td class="text-right"><strong>${formatCurrency(item.amount || 0, 'XAF')}</strong></td>
                  <td><span class="status-badge status-${statusClass}">${item.status || 'N/A'}</span></td>
          </tr>
        `;
      });
      
      htmlContent += `
          </tbody>
              <tfoot>
                <tr class="highlight-row">
                  <td colspan="2"><strong>Total</strong></td>
                  <td class="text-right"><strong>${formatCurrency(totalAmount, 'XAF')}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
        </table>
          </div>
      `;
    }

    htmlContent += `
        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Instanvi Payment Platform</strong></p>
            <p>This is an automated report generated by the system.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  };

  // Print only the report content
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    let tableContent = '';
    let title = '';
    let headers: string[] = [];
    let summaryCards = '';
    
    if (activeTab === 'balance-report') {
      title = 'Financial Balance Report';
      headers = ['Category', 'Amount'];
      const report = financialReport || { revenue: 0, refunds: 0, net: 0, byCurrency: {} };
      const currencyEntries = Object.entries(report.byCurrency || {});
      
      summaryCards = `
        <div class="summary-cards">
          <div class="summary-card revenue">
            <div class="label">Total Revenue</div>
            <div class="value">${formatCurrency(report.revenue || 0, 'XAF')}</div>
          </div>
          <div class="summary-card refunds">
            <div class="label">Total Refunds</div>
            <div class="value">${formatCurrency(report.refunds || 0, 'XAF')}</div>
          </div>
          <div class="summary-card net">
            <div class="label">Net Amount</div>
            <div class="value">${formatCurrency(report.net || 0, 'XAF')}</div>
          </div>
        </div>
      `;
      
      tableContent = `
        <div class="content-section">
          <h2 class="section-title">Financial Summary</h2>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
              <tr>
                <td><strong>Revenue</strong></td>
                <td class="text-right"><strong>${formatCurrency(report.revenue || 0, 'XAF')}</strong></td>
              </tr>
              <tr>
                <td><strong>Refunds</strong></td>
                <td class="text-right"><strong>${formatCurrency(report.refunds || 0, 'XAF')}</strong></td>
              </tr>
              <tr class="highlight-row">
                <td><strong>Net Amount</strong></td>
                <td class="text-right"><strong>${formatCurrency(report.net || 0, 'XAF')}</strong></td>
              </tr>
          </tbody>
        </table>
          ${currencyEntries.length > 0 ? `
            <div class="currency-section">
              <h3>Breakdown by Currency</h3>
              <div class="currency-grid">
                ${currencyEntries.map(([currency, amount]) => `
                  <div class="currency-item">
                    <div class="currency-code">${currency}</div>
                    <div class="currency-amount">${formatCurrency(amount as number, currency)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      const dataToExport = getFilteredData();
      title = activeTab === 'settlements' ? 'Settlements Report' : 'Invoices Report';
      headers = activeTab === 'settlements' 
        ? ['Settlement ID', 'Date', 'Amount', 'Status']
        : ['Invoice ID', 'Date', 'Amount', 'Status'];
      
      const totalAmount = dataToExport.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const statusCounts = dataToExport.reduce((acc: any, item: any) => {
        const status = (item.status || 'unknown').toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      summaryCards = `
        <div class="summary-cards">
          <div class="summary-card net">
            <div class="label">Total ${activeTab === 'settlements' ? 'Settlements' : 'Invoices'}</div>
            <div class="value">${dataToExport.length}</div>
          </div>
          <div class="summary-card revenue">
            <div class="label">Total Amount</div>
            <div class="value">${formatCurrency(totalAmount, 'XAF')}</div>
          </div>
          <div class="summary-card">
            <div class="label">Status Breakdown</div>
            <div class="value" style="font-size: 14px; line-height: 1.8;">
              ${Object.entries(statusCounts).map(([status, count]) => 
                `<div>${status}: ${count}</div>`
              ).join('')}
            </div>
          </div>
        </div>
      `;
      
      tableContent = `
        <div class="content-section">
          <h2 class="section-title">${activeTab === 'settlements' ? 'Settlements' : 'Invoices'} Details</h2>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
              ${dataToExport.map((item: any) => {
                const status = (item.status || 'unknown').toLowerCase();
                const statusClass = status.includes('paid') || status.includes('completed') ? 'paid' :
                                  status.includes('pending') ? 'pending' :
                                  status.includes('failed') || status.includes('cancelled') ? 'failed' :
                                  status.includes('sent') ? 'sent' : 'pending';
                return `
                  <tr>
                    <td><strong>${item.id}</strong></td>
                    <td>${item.date || 'N/A'}</td>
                    <td class="text-right"><strong>${formatCurrency(item.amount || 0, 'XAF')}</strong></td>
                    <td><span class="status-badge status-${statusClass}">${item.status || 'N/A'}</span></td>
              </tr>
                `;
              }).join('')}
          </tbody>
            <tfoot>
              <tr class="highlight-row">
                <td colspan="2"><strong>Total</strong></td>
                <td class="text-right"><strong>${formatCurrency(totalAmount, 'XAF')}</strong></td>
                <td></td>
              </tr>
            </tfoot>
        </table>
        </div>
      `;
    }

    const printContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @media print {
            @page { margin: 1cm; size: A4; }
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #111827;
            background: #ffffff;
            padding: 20px;
          }
          .report-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 40px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .header .subtitle {
            font-size: 14px;
            opacity: 0.95;
            margin-top: 8px;
          }
          .header .period {
            font-size: 13px;
            opacity: 0.9;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            padding: 24px;
            background: #f9fafb;
          }
          .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .summary-card .label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .summary-card .value {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
          }
          .summary-card.revenue .value { color: #10b981; }
          .summary-card.refunds .value { color: #ef4444; }
          .summary-card.net .value { color: #3b82f6; }
          .content-section {
            padding: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 16px;
            padding-bottom: 10px;
            border-bottom: 3px solid #3b82f6;
          }
          table { 
            width: 100%; 
            border-collapse: collapse;
            margin-top: 16px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          thead {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          }
          th {
            padding: 14px 12px;
            text-align: left; 
            font-size: 11px;
            font-weight: 700;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #d1d5db;
          }
          th.text-right {
            text-align: right;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #111827;
            font-size: 13px;
          }
          td.text-right {
            text-align: right;
          }
          tbody tr:hover {
            background-color: #f9fafb;
          }
          .highlight-row {
            background-color: #eff6ff !important;
            font-weight: 700;
          }
          .highlight-row td {
            color: #1e40af;
            font-size: 14px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-paid, .status-completed { background: #10b981; color: white; }
          .status-pending { background: #f59e0b; color: white; }
          .status-failed, .status-cancelled { background: #ef4444; color: white; }
          .status-sent { background: #3b82f6; color: white; }
          .currency-section {
            margin-top: 24px;
            padding: 16px;
            background: #f0f9ff;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }
          .currency-section h3 {
            font-size: 14px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 12px;
          }
          .currency-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 10px;
          }
          .currency-item {
            background: white;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #bfdbfe;
          }
          .currency-item .currency-code {
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 4px;
            font-size: 12px;
          }
          .currency-item .currency-amount {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
          }
          .footer {
            padding: 24px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 11px;
            border-radius: 0 0 8px 8px;
          }
          .footer p {
            margin-bottom: 3px;
          }
          .footer strong {
            color: #374151;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
          <h1>${title}</h1>
            <div class="subtitle">Financial Analysis & Summary</div>
            <div class="period">Period: ${selectedRange.start} - ${selectedRange.end}</div>
        </div>
          ${summaryCards}
        ${tableContent}
        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Instanvi Payment Platform</strong></p>
            <p>This is an automated report generated by the system.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Download annual reports as viewable PDF
  const handleDownloadAnnualReports = async () => {
    try {
      const year = selectedYear || new Date().getFullYear().toString();
      
      // Generate HTML content for PDF
      const htmlContent = generatePDFContent('annual');
      
      // Create a blob with HTML content
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for viewing
      const viewWindow = window.open(url, '_blank', 'width=900,height=700');
      
      // Also download the HTML file (which can be opened in browser or converted to PDF)
      const filename = `annual-balance-report-${year}.html`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (viewWindow) {
        viewWindow.onload = () => {
          // The file is viewable in browser and can be printed to PDF
          viewWindow.focus();
        };
      }
      
      // Clean up URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Export report in different formats
  const handleExportReport = async (format: 'csv' | 'pdf' | 'excel' = 'csv') => {
    if (!selectedRange.start || !selectedRange.end) {
      alert('Please select a date range before exporting');
      return;
    }

    setExportLoading(true);
    try {
      const startDate = convertToAPIDate(selectedRange.start);
      const endDate = convertToAPIDate(selectedRange.end);
      const exportFormat = format === 'excel' ? 'XLSX' : format === 'pdf' ? 'PDF' : 'CSV';
      
      let response: ApiResponse<Blob> | null = null;
      
      // Use appropriate export endpoint based on active tab
      if (activeTab === 'settlements') {
        response = await reportsService.exportPaymentReport({
          startDate,
          endDate,
          status: selectedFilter && selectedFilter !== 'All' ? selectedFilter : undefined,
          format: exportFormat as 'CSV' | 'XLSX' | 'PDF',
        });
      } else if (activeTab === 'balance-report') {
        response = await reportsService.exportFinancialReport({
          startDate,
          endDate,
          format: exportFormat as 'CSV' | 'XLSX' | 'PDF',
        });
      } else if (activeTab === 'invoices') {
        // For invoices, we can use transaction report export or handle separately
        // For now, use transaction export as fallback
        response = await reportsService.exportTransactionReport({
          startDate,
          endDate,
          format: exportFormat as 'CSV' | 'XLSX' | 'PDF',
        });
      }
      
      if (response?.success && response.data) {
        // Determine MIME type based on format
        let mimeType = 'application/octet-stream';
        let fileExtension = 'bin';
        if (format === 'pdf') {
          mimeType = 'application/pdf';
          fileExtension = 'pdf';
        } else if (format === 'excel') {
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
        } else {
          mimeType = 'text/csv';
          fileExtension = 'csv';
        }
        
        const blob = new Blob([response.data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShowExportDropdown(false);
      } else {
        alert(response?.error?.message || 'Export failed. Please try again.');
      }
    } catch (apiError: any) {
      console.error('API export failed:', apiError);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
    
    try {
      // Client-side export fallback
      setShowExportDropdown(false);
      const tabName = activeTab === 'settlements' ? 'settlements' : activeTab === 'invoices' ? 'invoices' : 'balance-report';
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (format === 'csv') {
        const filename = `${tabName}-report-${dateStr}.csv`;
        const dataToExport = activeTab === 'balance-report' ? [] : getFilteredData();
        
        let csvContent = '';
        if (activeTab === 'settlements') {
          csvContent = 'Settlement ID,Date,Amount,Status\n';
          dataToExport.forEach((item: any) => {
            csvContent += `${item.id},${item.date},XAF ${item.amount.toFixed(2)},${item.status}\n`;
          });
        } else if (activeTab === 'invoices') {
          csvContent = 'Invoice ID,Date,Amount,Status\n';
          dataToExport.forEach((item: any) => {
            csvContent += `${item.id},${item.date},XAF ${item.amount.toFixed(2)},${item.status}\n`;
          });
        } else if (activeTab === 'balance-report') {
          const report = financialReport || { revenue: 0, refunds: 0, net: 0, byCurrency: {} };
          csvContent = 'Category,Amount\n';
          csvContent += `Revenue,${formatCurrency(report.revenue || 0, 'XAF')}\n`;
          csvContent += `Refunds,${formatCurrency(report.refunds || 0, 'XAF')}\n`;
          csvContent += `Net Amount,${formatCurrency(report.net || 0, 'XAF')}\n`;
          Object.entries(report.byCurrency || {}).forEach(([currency, amount]) => {
            csvContent += `${currency},${formatCurrency(amount as number, currency)}\n`;
          });
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const filename = `${tabName}-report-${dateStr}.html`;
        const htmlContent = generatePDFContent('report');
        
        // Create blob and open in new window for viewing/printing to PDF
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // Open in new window
        const viewWindow = window.open(url, '_blank', 'width=900,height=700');
        
        // Also download the HTML file
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (viewWindow) {
          viewWindow.onload = () => {
            viewWindow.focus();
          };
        }
      } else if (format === 'excel') {
        const filename = `${tabName}-report-${dateStr}.csv`;
        const dataToExport = activeTab === 'balance-report' ? [] : getFilteredData();
        
        // Excel-compatible CSV format
        const BOM = '\uFEFF';
        let csvContent = BOM;
        
        if (activeTab === 'settlements') {
          csvContent += 'Settlement ID,Date,Amount,Status\n';
          dataToExport.forEach((item: any) => {
            csvContent += `${item.id},${item.date},"XAF ${item.amount.toFixed(2)}",${item.status}\n`;
          });
        } else if (activeTab === 'invoices') {
          csvContent += 'Invoice ID,Date,Amount,Status\n';
          dataToExport.forEach((item: any) => {
            csvContent += `${item.id},${item.date},"XAF ${item.amount.toFixed(2)}",${item.status}\n`;
          });
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Client-side export failed:', error);
    }
  };

  // Generate year options (current year and past 5 years)
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  
  // Initialize year options on client side only to avoid hydration mismatch
  useEffect(() => {
    if (yearOptions.length === 0) {
      const currentYear = new Date().getFullYear();
      setYearOptions(Array.from({ length: 6 }, (_, i) => (currentYear - i).toString()));
    }
  }, [yearOptions.length]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Reports</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Print Button - show on all tabs */}
          <button 
            onClick={handlePrint}
            className="p-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors rounded flex items-center justify-center"
            title="Print report"
          >
            <Printer className="w-4 h-4" />
          </button>
          {/* Download Annual Reports Button - only show on balance report */}
          {activeTab === 'balance-report' && (
            <button 
              onClick={handleDownloadAnnualReports}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download annual reports
            </button>
          )}
          {/* Export Report Button with Dropdown */}
          <div className="relative" ref={exportRef}>
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 transform hover:scale-105"
            >
              <Download className="w-4 h-4" />
              Export Report
              <CaretDown className="w-4 h-4" />
            </button>
            {showExportDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[180px] rounded overflow-hidden">
                <button
                  onClick={() => handleExportReport('csv')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExportReport('pdf')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExportReport('excel')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export as Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 sm:mb-6 border-b-2 border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        {/* Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => {
              setShowFilterDropdown(!showFilterDropdown);
              setShowPeriodDropdown(false);
              setShowBalanceDropdown(false);
              setShowYearDropdown(false);
            }}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-base bg-white border border-gray-200 text-sm transition-colors ${
              selectedFilter ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
          <Funnel className="w-4 h-4" />
            <span>{selectedFilter || 'Filter'}</span>
          <CaretDown className="w-4 h-4" />
          </button>
          {showFilterDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
              {['All', 'paid', 'pending', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedFilter(status === 'All' ? '' : status);
                    setShowFilterDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Period Dropdown */}
        <div className="relative" ref={periodRef}>
          <button
            onClick={() => {
              setShowPeriodDropdown(!showPeriodDropdown);
              setShowFilterDropdown(false);
              setShowBalanceDropdown(false);
              setShowYearDropdown(false);
            }}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-base bg-white border border-gray-200 text-sm transition-colors ${
              selectedPeriod ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
          <Calendar className="w-4 h-4" />
            <span>{selectedPeriod}</span>
          <CaretDown className="w-4 h-4" />
          </button>
          {showPeriodDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
              {['All', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'].map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setSelectedPeriod(period);
                    setShowPeriodDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                >
                  {period}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Balance Dropdown */}
        <div className="relative" ref={balanceRef}>
          <button
            onClick={() => {
              setShowBalanceDropdown(!showBalanceDropdown);
              setShowFilterDropdown(false);
              setShowPeriodDropdown(false);
              setShowYearDropdown(false);
            }}
            className={`w-full sm:w-auto px-4 py-2 text-base bg-white border border-gray-200 text-sm transition-colors ${
              selectedBalance ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {selectedBalance || 'Balance'}
            <CaretDown className="w-4 h-4 inline-block ml-2" />
          </button>
          {showBalanceDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
              {['All', '0-1000', '1000-5000', '5000-10000', '10000+'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setSelectedBalance(range === 'All' ? '' : range);
                    setShowBalanceDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Year Dropdown */}
        <div className="relative" ref={yearRef}>
          <button
            onClick={() => {
              setShowYearDropdown(!showYearDropdown);
              setShowFilterDropdown(false);
              setShowPeriodDropdown(false);
              setShowBalanceDropdown(false);
            }}
            className={`w-full sm:w-auto px-4 py-2 text-base bg-white border border-gray-200 text-sm transition-colors ${
              selectedYear ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {selectedYear || 'Year'}
            <CaretDown className="w-4 h-4 inline-block ml-2" />
        </button>
          {showYearDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[100px] rounded max-h-48 overflow-y-auto">
              {yearOptions.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    setShowYearDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                >
                  {year}
        </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'settlements' && (() => {
        const filteredSettlements = getFilteredData();
        
        if (loading.settlements) {
          return (
            <>
              {/* Skeleton Table */}
              <div className="bg-white border border-gray-200 overflow-hidden fade-in">
                <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="hidden lg:grid grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
            </div>
                  <div className="lg:hidden h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="divide-y divide-gray-200">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        }
        
        return (
          <div ref={reportContentRef} className="bg-white border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="hidden lg:grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
              <div>Settlement ID</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
              {filteredSettlements.length > 0 ? (
                filteredSettlements.map((settlement: any) => (
              <div key={settlement.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                {/* Mobile Card Layout */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs sm:text-sm text-gray-900 truncate">{settlement.id}</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">{formatDateUtil(settlement.date)}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded flex-shrink-0 ml-2 ${
                      settlement.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {settlement.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(settlement.amount, settlement.currency || 'XAF')}</div>
                    <button 
                      onClick={() => setSelectedItem({ ...settlement, type: 'settlement' })}
                      className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 px-3 py-1 border border-green-200 hover:bg-green-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
                {/* Desktop Table Layout */}
                <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                  <div className="font-mono text-sm text-gray-900">{settlement.id}</div>
                  <div className="text-sm text-gray-600">{formatDateUtil(settlement.date)}</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(settlement.amount, settlement.currency || 'XAF')}</div>
                  <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                      settlement.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {settlement.status}
                    </span>
                  </div>
                  <div>
                    <button 
                      onClick={() => setSelectedItem({ ...settlement, type: 'settlement' })}
                      className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              </div>
                ))
              ) : (
                <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                  {settlements.length === 0 ? 'No settlements found. Settlements will appear here when available.' : 'No settlements found matching the selected filters'}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {activeTab === 'invoices' && (() => {
        const filteredInvoices = getFilteredData();
        
        if (loading.invoices) {
          return (
            <>
              {/* Skeleton Table */}
              <div className="bg-white border border-gray-200 overflow-hidden fade-in">
                <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="hidden lg:grid grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                  <div className="lg:hidden h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="divide-y divide-gray-200">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        }
        
        return (
          <div ref={reportContentRef} className="bg-white border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="hidden lg:grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
              <div>Invoice ID</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice: any) => (
              <div key={invoice.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                {/* Mobile Card Layout */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs sm:text-sm text-gray-900 truncate">{invoice.invoiceNumber || invoice.id}</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">{formatDateUtil(invoice.date)}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded flex-shrink-0 ml-2 ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount, invoice.currency || 'XAF')}</div>
                    <button 
                      onClick={() => setSelectedItem({ ...invoice, type: 'invoice' })}
                      className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 px-3 py-1 border border-green-200 hover:bg-green-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
                {/* Desktop Table Layout */}
                <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                  <div className="font-mono text-sm text-gray-900">{invoice.invoiceNumber || invoice.id}</div>
                  <div className="text-sm text-gray-600">{formatDateUtil(invoice.date)}</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(invoice.amount, invoice.currency || 'XAF')}</div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div>
                    <button 
                      onClick={() => setSelectedItem({ ...invoice, type: 'invoice' })}
                      className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              </div>
                ))
              ) : (
                <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                  {invoices.length === 0 ? 'No invoices found. Invoices will appear here when available.' : 'No invoices found matching the selected filters'}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {activeTab === 'balance-report' && (
        <div>
          <div ref={reportContentRef}>
          {/* Period Selector */}
          <div className="mb-6 relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 text-sm text-gray-700 px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">Period</span>
              <span className="text-gray-400">|</span>
              <span>{selectedRange.start} - {selectedRange.end}</span>
              <CaretDown className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded z-50 w-[420px]">
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
                        <CaretLeft className="w-3 h-3 text-gray-600" />
                      </button>
                      <div className="text-xs font-medium text-gray-900">
                        {monthNames[calendarMonth - 1]} {calendarYear}
                      </div>
                        <button
                        onClick={() => navigateMonth('next')}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <CaretRight className="w-3 h-3 text-gray-600" />
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
          <div className="bg-white border border-gray-200  overflow-hidden">
            {loading.balanceReport ? (
              <>
                {/* Skeleton Balance Report */}
                <div className="bg-white border border-gray-200 overflow-hidden fade-in">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="hidden sm:grid grid-cols-2 gap-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
                    <div className="sm:hidden h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="hidden sm:grid grid-cols-2 gap-4 items-center">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse ml-auto"></div>
                        </div>
                        <div className="sm:hidden space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : financialReport ? (
              <>
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-700">
                    <div>Category</div>
                    <div className="text-right">Amount</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {/* Revenue */}
                  <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="text-sm text-gray-700">Revenue</div>
                      <div className="text-sm text-right font-semibold text-green-700">
                        {formatCurrency(financialReport.revenue || 0, 'XAF')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Refunds */}
                  <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="text-sm text-gray-700">Refunds</div>
                      <div className="text-sm text-right font-semibold text-red-700">
                        {formatCurrency(financialReport.refunds || 0, 'XAF')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Net Amount */}
                  <div className="px-6 py-4 bg-gray-50 font-semibold border-t-2 border-gray-300">
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="text-sm text-gray-900">Net Amount</div>
                      <div className="text-sm text-right text-gray-900">
                        {formatCurrency(financialReport.net || 0, 'XAF')}
                      </div>
                    </div>
                  </div>
                  
                  {/* By Currency */}
                  {financialReport.byCurrency && Object.keys(financialReport.byCurrency).length > 0 && (
                    <>
                      <div className="px-6 py-3 bg-gray-100 border-t-2 border-gray-300">
                        <div className="text-sm font-medium text-gray-700">By Currency</div>
                      </div>
                      {Object.entries(financialReport.byCurrency).map(([currency, amount]) => (
                        <div key={currency} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="text-sm text-gray-700">{currency}</div>
                            <div className="text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(amount as number, currency)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                {selectedRange.start && selectedRange.end 
                  ? 'No financial report data available for the selected date range.'
                  : 'Select a date range to view the financial report.'}
              </div>
            )}
          </div>
          </div>
        </div>
      )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm backdrop-fade-in z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto modal-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 ">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-0.5">
                {selectedItem.type === 'settlement' && 'Settlement Details'}
                {selectedItem.type === 'invoice' && 'Invoice Details'}
              </h2>
                  <p className="text-green-100 text-xs">Transaction Information</p>
                </div>
              <button
                onClick={() => setSelectedItem(null)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 "
              >
                <X className="w-6 h-6" />
              </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Key Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3  border border-gray-200">
                  <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">
                    {selectedItem.type === 'settlement' ? 'Settlement ID' : 'Invoice ID'}
                    </div>
                  <div className="text-sm font-mono text-gray-900 break-all">{selectedItem.id}</div>
                    </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3  border border-gray-200">
                  <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Status</div>
                      <div className="mt-1">
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                      selectedItem.status === 'paid' || selectedItem.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : selectedItem.status === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : selectedItem.status === 'failed' || selectedItem.status === 'cancelled'
                        ? 'bg-red-500 text-white'
                        : selectedItem.status === 'sent'
                        ? 'bg-gray-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {selectedItem.status ? selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3  border border-green-200">
                  <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Date</div>
                  <div className="text-sm font-semibold text-green-900">{selectedItem.date || 'N/A'}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3  border border-emerald-200">
                  <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Amount</div>
                  <div className="text-lg font-bold text-emerald-900">
                    {formatCurrency(selectedItem.amount || 0, 'XAF')}
                      </div>
                    </div>
                  </div>

              {selectedItem.type === 'settlement' && (
                <>
                  {/* Additional Settlement Details */}
                  <div className="bg-gray-50  p-4 border border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Currency</label>
                        <p className="text-sm text-gray-900 font-medium">XAF (Central African CFA Franc)</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Payment Method</label>
                        <p className="text-sm text-gray-900 font-medium">Mobile Money</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Transaction Fee</label>
                        <p className="text-sm text-gray-900 font-medium">XAF 0.00</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Net Amount</label>
                        <p className="text-base font-bold text-gray-900">
                          {formatCurrency(selectedItem.amount || 0, 'XAF')}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedItem.type === 'invoice' && (
                <>
                  {/* Additional Invoice Details */}
                  <div className="bg-gray-50  p-4 border border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Invoice Number</label>
                        <p className="text-sm font-mono text-gray-900">{selectedItem.id}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Due Date</label>
                        <p className="text-sm text-gray-900 font-medium">{selectedItem.date || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Currency</label>
                        <p className="text-sm text-gray-900 font-medium">XAF (Central African CFA Franc)</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Payment Method</label>
                        <p className="text-sm text-gray-900 font-medium">Mobile Money</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200  shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
