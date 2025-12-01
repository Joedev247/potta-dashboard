'use client';

import { useState } from 'react';
import { Plus, Settings, ArrowLeft, ChevronDown, Info, FileText, Eye, Download, Search, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function InvoicingPage() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState('one-off');
  const [vatDisplay, setVatDisplay] = useState('including');

  const tabs = [
    { id: 'invoices', label: 'Invoices' },
    { id: 'recurring', label: 'Recurring' },
    { id: 'credit-notes', label: 'Credit notes' },
    { id: 'customers', label: 'Customers' },
    { id: 'products', label: 'Products' },
  ];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Invoices</h1>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/settings"
            className="px-4 py-1 bg-white border-2 border-gray-200 text-gray-700 text-sm font-semibold hover:border-green-400 hover:bg-green-50 transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button 
            onClick={() => setShowCreateInvoice(true)}
            className="px-5 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b-2 border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-1 text-sm font-semibold transition-colors relative
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
      {!showCreateInvoice && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              className="w-full pl-10 pr-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-1 bg-white border border-gray-200 rounded text-sm text-gray-700">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 px-4 py-1 bg-white border border-gray-200 rounded text-sm text-gray-700">
            <Calendar className="w-4 h-4" />
            <span>Last 30 days</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          <button className="px-4 py-1 bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded">
            Amount
          </button>
          <button className="px-4 py-1 bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded">
            Status
          </button>
        </div>
      )}

      {/* Create Invoice Form */}
      {showCreateInvoice ? (
        <div className="bg-white max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 px-8">
            <button 
              onClick={() => setShowCreateInvoice(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Invoices</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold text-gray-900">Create invoice</h1>
                <div className="flex gap-1 bg-gray-100 p-1 rounded">
                  <button
                    onClick={() => setInvoiceType('one-off')}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      invoiceType === 'one-off'
                        ? 'bg-white text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    One-off
                  </button>
                  <button
                    onClick={() => setInvoiceType('recurring')}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      invoiceType === 'recurring'
                        ? 'bg-white text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Recurring
                  </button>
                </div>
              </div>
              <button className="px-6 py-1.5 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors">
                Create
              </button>
            </div>
          </div>

          {/* Invoice Details Section */}
          <div className="flex gap-8 mb-8 items-start">
            {/* Left Column - Logo */}
            <div className="flex-shrink-0 pl-8">
              <div className="border-2 border-dashed border-gray-300 p-6 h-32 w-32 flex items-center justify-center bg-gray-50 hover:border-green-400 transition-colors cursor-pointer">
                <div className="text-center">
                  <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-600">+ Add logo</span>
                </div>
              </div>
            </div>

            {/* Right Column - Sender Information and Form Fields */}
            <div className="flex-1">
              {/* Sender Information - Right Aligned */}
              <div className="mb-6 text-right pr-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Codev</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>joedev247@gmail.com</p>
                  <p>+237 6 54 58 34 54</p>
                  <p>my.instanvi.com</p>
                </div>
              </div>

              {/* Profile */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <span>Profile</span>
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                </label>
                <div className="relative">
                  <select className="w-full px-4 py-1.5 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-20">
                    <option>Codev</option>
                  </select>
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-xs font-semibold text-green-700">CO</div>
                  </div>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Customer */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Select customer"
                    className="w-full px-4 py-1.5 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500 pr-10"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Payment term */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment term</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Select payment term"
                    className="w-full px-4 py-1.5 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500 pr-10"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Memo */}
              <button className="text-sm text-green-600 hover:text-green-700 hover:underline">
                + Add memo
              </button>
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Items</h2>
              <div className="flex gap-1 bg-gray-100 p-1 rounded">
                <button
                  onClick={() => setVatDisplay('including')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    vatDisplay === 'including'
                      ? 'bg-white text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Including VAT
                </button>
                <button
                  onClick={() => setVatDisplay('excluding')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    vatDisplay === 'excluding'
                      ? 'bg-white text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Excluding VAT
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-200 rounded">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">VAT</div>
                <div className="col-span-1">Total</div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Start typing..."
                        className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500 pr-10"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value="1"
                      className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-sm text-gray-600">XAF</span>
                    <input
                      type="text"
                      placeholder="0.00"
                      className="flex-1 px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="px-4 py-1 text-gray-400">-</div>
                  </div>
                  <div className="col-span-1">
                    <div className="px-4 py-1 text-gray-400">-</div>
                  </div>
                </div>
              </div>
            </div>

            <button className="mt-4 text-sm text-green-600 hover:text-green-700 hover:underline">
              + Add item
            </button>
          </div>

          {/* Totals Section */}
          <div className="border border-gray-200 rounded p-6 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Totals</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Subtotal</span>
                <span className="text-gray-900 font-medium">XAF 0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Discount</span>
                  <button className="text-sm text-green-600 hover:text-green-700 hover:underline">
                    + Add
                  </button>
                </div>
                <span className="text-gray-900 font-medium">XAF 0.00</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-semibold text-gray-900">XAF 0.00</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Invoices List */}
          {activeTab === 'invoices' && (
            <div className="bg-white border border-gray-200  overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                  <div>Invoice #</div>
                  <div>Customer</div>
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { id: 'INV-2024-001', customer: 'John Doe', date: '2024-01-15', amount: 'XAF 1,250.00', status: 'paid' },
                  { id: 'INV-2024-002', customer: 'Jane Smith', date: '2024-01-14', amount: 'XAF 850.00', status: 'paid' },
                  { id: 'INV-2024-003', customer: 'Bob Johnson', date: '2024-01-13', amount: 'XAF 2,100.00', status: 'pending' },
                  { id: 'INV-2024-004', customer: 'Alice Brown', date: '2024-01-12', amount: 'XAF 950.00', status: 'paid' },
                  { id: 'INV-2024-005', customer: 'Charlie Wilson', date: '2024-01-11', amount: 'XAF 1,500.00', status: 'overdue' },
                ].map((invoice) => (
                  <div key={invoice.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div className="font-mono text-sm text-gray-900 font-semibold">{invoice.id}</div>
                      <div className="text-sm text-gray-900">{invoice.customer}</div>
                      <div className="text-sm text-gray-600">{invoice.date}</div>
                      <div className="font-semibold text-gray-900">{invoice.amount}</div>
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Tab */}
          {activeTab === 'recurring' && (
            <div className="bg-white border border-gray-200  overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                  <div>Recurring Invoice</div>
                  <div>Customer</div>
                  <div>Frequency</div>
                  <div>Next Invoice</div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { id: 'REC-001', customer: 'John Doe', frequency: 'Monthly', next: '2024-02-01', amount: 'XAF 500.00' },
                  { id: 'REC-002', customer: 'Jane Smith', frequency: 'Weekly', next: '2024-01-22', amount: 'XAF 200.00' },
                  { id: 'REC-003', customer: 'Bob Johnson', frequency: 'Monthly', next: '2024-02-05', amount: 'XAF 1,000.00' },
                ].map((recurring) => (
                  <div key={recurring.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-mono text-sm text-gray-900 font-semibold">{recurring.id}</div>
                      <div className="text-sm text-gray-900">{recurring.customer}</div>
                      <div className="text-sm text-gray-600">{recurring.frequency}</div>
                      <div className="text-sm text-gray-600">{recurring.next}</div>
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

          {/* Credit Notes Tab */}
          {activeTab === 'credit-notes' && (
            <div className="bg-white border border-gray-200  overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                  <div>Credit Note #</div>
                  <div>Invoice</div>
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { id: 'CN-001', invoice: 'INV-2024-001', date: '2024-01-10', amount: 'XAF 150.00' },
                  { id: 'CN-002', invoice: 'INV-2024-003', date: '2024-01-08', amount: 'XAF 75.00' },
                ].map((creditNote) => (
                  <div key={creditNote.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-mono text-sm text-gray-900 font-semibold">{creditNote.id}</div>
                      <div className="text-sm text-gray-600">{creditNote.invoice}</div>
                      <div className="text-sm text-gray-600">{creditNote.date}</div>
                      <div className="font-semibold text-gray-900">{creditNote.amount}</div>
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

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="bg-white border border-gray-200  overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                  <div>Customer</div>
                  <div>Email</div>
                  <div>Total Invoices</div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { name: 'John Doe', email: 'john@example.com', invoices: 5, total: 'XAF 6,250.00' },
                  { name: 'Jane Smith', email: 'jane@example.com', invoices: 3, total: 'XAF 2,550.00' },
                  { name: 'Bob Johnson', email: 'bob@example.com', invoices: 4, total: 'XAF 4,200.00' },
                ].map((customer, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.email}</div>
                      <div className="text-sm text-gray-600">{customer.invoices} invoices</div>
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

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-white border border-gray-200  overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                  <div>Product</div>
                  <div>Price</div>
                  <div>Used In</div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { name: 'Web Development', price: 'XAF 1,500.00', used: 8 },
                  { name: 'Consulting Services', price: 'XAF 200.00', used: 12 },
                  { name: 'Design Package', price: 'XAF 850.00', used: 5 },
                ].map((product, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-900 font-semibold">{product.price}</div>
                      <div className="text-sm text-gray-600">{product.used} invoices</div>
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
        </>
      )}
    </div>
  );
}
