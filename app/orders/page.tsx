'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, MagnifyingGlass, Eye, X, CheckCircle, WarningCircle, Spinner, ShoppingCart, CaretLeft, CaretRight, Funnel } from '@phosphor-icons/react';
import { ordersService, customersService, productsService, type Order, type Customer, type Product } from '@/lib/api';
import { useOrganization } from '@/contexts/OrganizationContext';
import { formatDate, formatCurrency } from '@/lib/utils/format';

export default function OrdersPage() {
  const { organization } = useOrganization();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Form data
  const [formData, setFormData] = useState({
    customer_id: '',
    items: [{ productId: '', name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    currency: 'XAF',
  });

  const [statusFormData, setStatusFormData] = useState({
    status: 'PENDING' as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED',
  });

  // Fetch orders
  const fetchOrders = useCallback(async (page: number = pagination.page) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params: any = {
        page,
        limit: pagination.limit,
      };

      if (organization?.id) {
        params.organization_id = organization.id;
      }

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await ordersService.listOrders(params);
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
        setPagination(response.data.pagination);
      } else {
        setOrders([]);
        setErrorMessage(response.error?.message || 'Failed to load orders');
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setErrorMessage(error?.message || 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [organization, pagination.page, pagination.limit, filterStatus]);

  // Fetch customers and products for create form
  const fetchCustomersAndProducts = useCallback(async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        customersService.listCustomers(organization?.id ? { organization_id: organization.id } : undefined),
        productsService.listProducts(organization?.id ? { organization_id: organization.id } : undefined),
      ]);

      if (customersRes.success && customersRes.data) {
        setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
      }

      if (productsRes.success && productsRes.data) {
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      }
    } catch (error) {
      console.error('Error fetching customers/products:', error);
    }
  }, [organization]);

  useEffect(() => {
    fetchOrders();
    fetchCustomersAndProducts();
  }, [fetchOrders, fetchCustomersAndProducts]);

  // Refetch when filters change
  useEffect(() => {
    if (pagination.page === 1) {
      fetchOrders(1);
    } else {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filterStatus]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchOrders(newPage);
    }
  };

  // Filter orders by search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.customer_id.toLowerCase().includes(query) ||
      order.items.some(item => item.name.toLowerCase().includes(query))
    );
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      customer_id: '',
      items: [{ productId: '', name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
      currency: 'XAF',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Handle create order
  const handleCreateOrder = async () => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!formData.customer_id.trim()) {
      setErrorMessage('Customer is required');
      setActionLoading(false);
      return;
    }

    if (formData.items.length === 0 || formData.items.some(item => !item.name.trim() || item.quantity <= 0 || item.unitPrice <= 0)) {
      setErrorMessage('Please add at least one valid item');
      setActionLoading(false);
      return;
    }

    try {
      const orderData = {
        customer_id: formData.customer_id.trim(),
        organization_id: organization?.id,
        items: formData.items.map(item => ({
          productId: item.productId || undefined,
          name: item.name.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
        currency: formData.currency,
      };

      const response = await ordersService.createOrder(orderData);
      
      if (response.success) {
        setSuccessMessage('Order created successfully!');
        await fetchOrders();
        setTimeout(() => {
          resetForm();
          setShowCreateModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to create order. Please try again.');
      }
    } catch (error: any) {
      console.error('Create order error:', error);
      setErrorMessage(error?.message || 'Failed to create order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view order
  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setErrorMessage('');
    try {
      const response = await ordersService.getOrder(order.id);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
        setShowViewModal(true);
      } else {
        setErrorMessage(response.error?.message || 'Failed to load order details');
        setShowViewModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      setErrorMessage(error?.message || 'Failed to load order details');
      setShowViewModal(true);
    }
  };

  // Handle update status
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await ordersService.updateOrderStatus(selectedOrder.id, {
        status: statusFormData.status,
      });
      
      if (response.success) {
        setSuccessMessage('Order status updated successfully!');
        await fetchOrders();
        setTimeout(() => {
          setShowStatusModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to update order status. Please try again.');
      }
    } catch (error: any) {
      console.error('Update status error:', error);
      setErrorMessage(error?.message || 'Failed to update order status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add item to form
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    });
  };

  // Remove item from form
  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  // Update item in form
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].name = product.name;
        newItems[index].unitPrice = product.price;
        newItems[index].totalPrice = newItems[index].quantity * product.price;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your orders</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
          <WarningCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-4 sm:mb-6 space-y-3">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by ID, customer, or item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-1 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Funnel className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-base border-2 border-gray-200 focus:outline-none focus:border-green-500 bg-white rounded"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="hidden lg:grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
              <div>Order ID</div>
              <div>Customer</div>
              <div>Items</div>
              <div>Amount</div>
              <div>Status</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div key={order.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                  {/* Mobile Card Layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">Order #{order.id.slice(0, 8)}</div>
                        <div className="text-xs text-gray-600 mt-1">Customer: {order.customer_id.slice(0, 8)}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(order.amount, order.currency)}
                    </div>
                    {order.createdAt && (
                      <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="flex-1 px-3 py-2 text-sm font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors rounded flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setStatusFormData({ status: order.status as any });
                          setShowStatusModal(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm font-medium border-2 border-green-200 text-green-700 hover:bg-green-50 transition-colors rounded"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                  {/* Desktop Table Layout */}
                  <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                    <div className="text-sm font-medium text-gray-900">#{order.id.slice(0, 12)}</div>
                    <div className="text-sm text-gray-600">{order.customer_id.slice(0, 12)}</div>
                    <div className="text-sm text-gray-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(order.amount, order.currency)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setStatusFormData({ status: order.status as any });
                          setShowStatusModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                {searchQuery || filterStatus !== 'all' 
                  ? 'No orders found matching your filters.' 
                  : 'No orders found. Create your first order to get started.'}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border-2 border-gray-300 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
                >
                  <CaretLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 border-2 border-gray-300 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
                >
                    Next
                    <CaretRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Order</h2>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateOrder();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="XAF">XAF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="p-4 border-2 border-gray-200 rounded space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Product (Optional)</label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                          >
                            <option value="">Select a product</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {formatCurrency(product.price, product.currency)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                            placeholder="Item name"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900">
                          Total: {formatCurrency(item.totalPrice, formData.currency)}
                        </div>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Order'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
                  <WarningCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-medium">Order ID</label>
                  <p className="text-sm font-mono text-gray-500 mt-1 break-all">{selectedOrder.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Status</label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Customer ID</label>
                  <p className="text-sm font-mono text-gray-500 mt-1 break-all">{selectedOrder.customer_id}</p>
                </div>
                {selectedOrder.organization_id && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Organization ID</label>
                    <p className="text-sm font-mono text-gray-500 mt-1 break-all">{selectedOrder.organization_id}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 font-medium">Total Amount</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatCurrency(selectedOrder.amount, selectedOrder.currency)}
                  </p>
                </div>
                {selectedOrder.createdAt && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Created At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium mb-2 block">Items</label>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            {item.quantity} × {formatCurrency(item.unitPrice, selectedOrder.currency)} = {formatCurrency(item.totalPrice || item.quantity * item.unitPrice, selectedOrder.currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setStatusFormData({ status: selectedOrder.status as any });
                  setShowStatusModal(true);
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Update Status
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedOrder(null);
                }}
                className="px-6 py-2 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Update Order Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateStatus();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={statusFormData.status}
                  onChange={(e) => setStatusFormData({ status: e.target.value as any })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

