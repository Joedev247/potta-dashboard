'use client';

import { Search, Plus, ExternalLink, ArrowLeft, ChevronDown, Calendar, X, RotateCcw, ChevronUp, ArrowRight, AlertCircle, Package, RefreshCw, Eye } from 'lucide-react';
import { useState } from 'react';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('payments');
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [showExtraOptions, setShowExtraOptions] = useState(true);
  const [reusable, setReusable] = useState(false);
  const [saveUrl, setSaveUrl] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState(['IDEAL']);

  const tabs = [
    { id: 'payments', label: 'Payments' },
    { id: 'refunds', label: 'Refunds' },
    { id: 'chargebacks', label: 'Chargebacks' },
    { id: 'orders', label: 'Orders' },
  ];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Payments</h1>
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

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search here"
                className="pl-10 pr-4 py-1 bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500  w-64 shadow-sm transition-all"
              />
            </div>
            <button className="px-4 py-1 bg-white border-2 border-gray-200 text-sm text-gray-700 hover:border-green-400 hover:bg-green-50 transition-all  shadow-sm font-medium">
              Amount
            </button>
            <button className="px-4 py-1 bg-white border-2 border-gray-200 text-sm text-gray-700 hover:border-green-400 hover:bg-green-50 transition-all  shadow-sm font-medium">
              Period
            </button>
            <button className="px-4 py-1 bg-white border-2 border-gray-200 text-sm text-gray-700 hover:border-green-400 hover:bg-green-50 transition-all  shadow-sm font-medium">
              Status
            </button>
          </div>
          <button 
            onClick={() => setShowCreateLink(true)}
            className="flex items-center gap-2 px-5 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg  transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create payment
          </button>
        </div>
      </div>

      {/* Create Link Form */}
      {showCreateLink ? (
        <div className="bg-white max-w-4xl mx-auto px-8">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => setShowCreateLink(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Payment links</span>
            </button>
            
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold text-gray-900">Create link</h1>
              <div className="relative">
                <select className="px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-20">
                  <option>Codev</option>
                </select>
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-xs font-semibold text-green-700">CO</div>
                </div>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Type, Currency, Amount Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="relative">
                <select className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-10">
                  <option>Fixed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <div className="relative">
                <select className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-10">
                  <option>EUR</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="text"
                value="665656"
                className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              placeholder=""
              className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Expiry Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry date (optional)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="DD-MM-YYYY"
                className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500 pr-10"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Redirect URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Redirect URL (optional)</label>
            <input
              type="text"
              placeholder=""
              className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Save URL Checkbox */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveUrl}
                onChange={(e) => setSaveUrl(e.target.checked)}
                className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700">Save URL for all future links</span>
            </label>
          </div>

          {/* Extra Options */}
          <div className="mb-6 border border-gray-200 rounded">
            <button
              onClick={() => setShowExtraOptions(!showExtraOptions)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">Extra options</span>
              {showExtraOptions ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {showExtraOptions && (
              <div className="p-4 border-t border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reusable}
                    onChange={(e) => setReusable(e.target.checked)}
                    className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <RotateCcw className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">Reusable</span>
                    </div>
                    <p className="text-sm text-gray-600">Create a reusable payment link that can be paid multiple times</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment methods</label>
            <div className="border border-gray-200 rounded p-3 bg-white min-h-[48px] flex items-center gap-2 flex-wrap">
              {paymentMethods.map((method, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded text-sm text-gray-900"
                >
                  <span>{method}</span>
                  <button
                    onClick={() => setPaymentMethods(paymentMethods.filter((_, i) => i !== index))}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">By default, all methods are offered in your checkout.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button className="px-6 py-1 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors shadow-sm">
              Create link
            </button>
            <button 
              onClick={() => setShowCreateLink(false)}
              className="px-6 py-1 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Payments Tab Content */}
          {activeTab === 'payments' && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 mb-6 flex items-center justify-center">
                <Search className="w-24 h-24 text-gray-300" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">No test payments found</h2>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                Test payments will show up here, these help you test your connection with instanvi
              </p>
              <button className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:underline">
                Read more
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Refunds Tab Content */}
          {activeTab === 'refunds' && (
            <div>
              <div className="bg-white border border-gray-200  overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                    <div>Refund ID</div>
                    <div>Payment ID</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div>Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {[
                    { id: 're_abc123', paymentId: 'tr_xyz789', amount: 'XAF 25.00', status: 'completed', date: '2024-01-15', currency: 'EUR' },
                    { id: 're_def456', paymentId: 'tr_uvw012', amount: 'XAF 50.00', status: 'pending', date: '2024-01-14', currency: 'EUR' },
                    { id: 're_ghi789', paymentId: 'tr_rst345', amount: 'XAF 100.00', status: 'processing', date: '2024-01-13', currency: 'EUR' },
                  ].map((refund) => (
                    <div key={refund.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-6 gap-4 items-center">
                        <div className="font-mono text-sm text-gray-900">{refund.id}</div>
                        <div className="font-mono text-sm text-gray-600">{refund.paymentId}</div>
                        <div className="font-semibold text-gray-900">{refund.amount}</div>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            refund.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : refund.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {refund.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{refund.date}</div>
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

              {/* Empty State (if no refunds) */}
              <div className="flex flex-col items-center justify-center py-20 mt-8">
                <div className="w-16 h-16 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                  <RefreshCw className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No refunds yet</h3>
                <p className="text-gray-600 text-center max-w-md">
                  Refunds will appear here once you process them
                </p>
              </div>
            </div>
          )}

          {/* Chargebacks Tab Content */}
          {activeTab === 'chargebacks' && (
            <div>
              <div className="bg-white border border-gray-200  overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                    <div>Chargeback ID</div>
                    <div>Payment ID</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div>Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {[
                    { id: 'ch_cb123', paymentId: 'tr_xyz789', amount: 'XAF 75.00', status: 'open', date: '2024-01-15', currency: 'EUR' },
                    { id: 'ch_cb456', paymentId: 'tr_uvw012', amount: 'XAF 120.00', status: 'won', date: '2024-01-10', currency: 'EUR' },
                    { id: 'ch_cb789', paymentId: 'tr_rst345', amount: 'XAF 200.00', status: 'lost', date: '2024-01-05', currency: 'EUR' },
                  ].map((chargeback) => (
                    <div key={chargeback.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-6 gap-4 items-center">
                        <div className="font-mono text-sm text-gray-900">{chargeback.id}</div>
                        <div className="font-mono text-sm text-gray-600">{chargeback.paymentId}</div>
                        <div className="font-semibold text-gray-900">{chargeback.amount}</div>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 w-fit ${
                            chargeback.status === 'open'
                              ? 'bg-red-100 text-red-700'
                              : chargeback.status === 'won'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {chargeback.status === 'open' && <AlertCircle className="w-3 h-3" />}
                            {chargeback.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{chargeback.date}</div>
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

              {/* Chargeback Info Banner */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200  p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">About chargebacks</h4>
                    <p className="text-sm text-gray-700">
                      A chargeback occurs when a customer disputes a payment with their bank. 
                      You can respond to chargebacks and provide evidence to contest them.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab Content */}
          {activeTab === 'orders' && (
            <div>
              <div className="bg-white border border-gray-200  overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700">
                    <div>Order ID</div>
                    <div>Customer</div>
                    <div>Amount</div>
                    <div>Items</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div>Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {[
                    { id: 'ord_001', customer: 'John Doe', amount: 'XAF 149.99', items: 3, status: 'paid', date: '2024-01-15', email: 'john@example.com' },
                    { id: 'ord_002', customer: 'Jane Smith', amount: 'XAF 89.50', items: 2, status: 'pending', date: '2024-01-14', email: 'jane@example.com' },
                    { id: 'ord_003', customer: 'Bob Johnson', amount: 'XAF 299.00', items: 1, status: 'shipped', date: '2024-01-13', email: 'bob@example.com' },
                    { id: 'ord_004', customer: 'Alice Brown', amount: 'XAF 45.00', items: 5, status: 'cancelled', date: '2024-01-12', email: 'alice@example.com' },
                  ].map((order) => (
                    <div key={order.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-7 gap-4 items-center">
                        <div className="font-mono text-sm text-gray-900">{order.id}</div>
                        <div>
                          <div className="font-medium text-gray-900">{order.customer}</div>
                          <div className="text-xs text-gray-500">{order.email}</div>
                        </div>
                        <div className="font-semibold text-gray-900">{order.amount}</div>
                        <div className="text-sm text-gray-600">{order.items} items</div>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            order.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{order.date}</div>
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

              {/* Orders Summary */}
              <div className="grid grid-cols-4 gap-6 mt-6">
                <div className="bg-white border border-gray-200  p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Orders</div>
                  <div className="text-2xl font-bold text-gray-900">24</div>
                </div>
                <div className="bg-white border border-gray-200  p-4">
                  <div className="text-sm text-gray-600 mb-1">Paid</div>
                  <div className="text-2xl font-bold text-green-600">18</div>
                </div>
                <div className="bg-white border border-gray-200  p-4">
                  <div className="text-sm text-gray-600 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-600">4</div>
                </div>
                <div className="bg-white border border-gray-200  p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-gray-900">XAF 2,450.00</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
