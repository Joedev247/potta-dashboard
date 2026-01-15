'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, MagnifyingGlass, Eye, PencilSimple, Trash, X, CheckCircle, WarningCircle, Spinner, Package, Power, ToggleLeft, CurrencyDollar, Calendar, CaretDown } from '@phosphor-icons/react';
import { productsService, type Product } from '@/lib/api';
import { useOrganization } from '@/contexts/OrganizationContext';
import { formatDate, formatCurrency } from '@/lib/utils/format';

export default function ProductsPage() {
  const { organization } = useOrganization();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showAmountDropdown, setShowAmountDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 days');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const periodRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'XAF',
    sku: '',
    isActive: true,
  });

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = organization?.id ? { organization_id: organization.id } : undefined;
      const response = await productsService.listProducts(params);
      if (response.success && response.data) {
        setProducts(Array.isArray(response.data) ? response.data : []);
      } else {
        setProducts([]);
        if (response.error) {
          setErrorMessage(response.error.message || 'Failed to load products');
        }
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setErrorMessage('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products by search query
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Period filter (uses createdAt if available)
    if (selectedPeriod && selectedPeriod !== 'All' && (product as any).createdAt) {
      const today = new Date();
      let startDate = new Date();
      switch (selectedPeriod) {
        case 'Last 7 days':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'Last 30 days':
          startDate.setDate(today.getDate() - 30);
          break;
        case 'Last 90 days':
          startDate.setDate(today.getDate() - 90);
          break;
        case 'This year':
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          break;
      }
      const created = new Date((product as any).createdAt);
      if (!(created >= startDate && created <= today)) return false;
    }

    // Amount filter (price ranges)
    if (selectedAmount && selectedAmount !== 'All') {
      const price = Number(product.price || 0);
      switch (selectedAmount) {
        case '0-1000':
          if (!(price >= 0 && price <= 1000)) return false;
          break;
        case '1000-2000':
          if (!(price > 1000 && price <= 2000)) return false;
          break;
        case '2000-5000':
          if (!(price > 2000 && price <= 5000)) return false;
          break;
        case '5000+':
          if (!(price > 5000)) return false;
          break;
        default:
          break;
      }
    }

    // Status filter (Active / Inactive)
    if (selectedStatus && selectedStatus !== 'All') {
      if (selectedStatus === 'Active' && !product.isActive) return false;
      if (selectedStatus === 'Inactive' && product.isActive) return false;
    }

    return true;
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setShowPeriodDropdown(false);
      }
      if (amountRef.current && !amountRef.current.contains(event.target as Node)) {
        setShowAmountDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    if (showPeriodDropdown || showAmountDropdown || showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPeriodDropdown, showAmountDropdown, showStatusDropdown]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'XAF',
      sku: '',
      isActive: true,
    });
    setSelectedProduct(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Handle create product
  const handleCreateProduct = async () => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!formData.name.trim()) {
      setErrorMessage('Product name is required');
      setActionLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setErrorMessage('Price must be greater than 0');
      setActionLoading(false);
      return;
    }

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        currency: formData.currency,
        sku: formData.sku.trim() || undefined,
        isActive: formData.isActive,
        organization_id: organization?.id,
      };

      const response = await productsService.createProduct(productData);
      
      if (response.success) {
        setSuccessMessage('Product created successfully!');
        await fetchProducts();
        setTimeout(() => {
          resetForm();
          setShowCreateModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to create product. Please try again.');
      }
    } catch (error: any) {
      console.error('Create product error:', error);
      setErrorMessage('Failed to create product. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price.toString(),
      currency: product.currency || 'XAF',
      sku: product.sku || '',
      isActive: product.isActive ?? true,
    });
    setShowEditModal(true);
  };

  // Handle update product
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!formData.name.trim()) {
      setErrorMessage('Product name is required');
      setActionLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setErrorMessage('Price must be greater than 0');
      setActionLoading(false);
      return;
    }

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        sku: formData.sku.trim() || undefined,
      };

      const response = await productsService.updateProduct(selectedProduct.id, updateData);
      
      if (response.success) {
        setSuccessMessage('Product updated successfully!');
        await fetchProducts();
        setTimeout(() => {
          resetForm();
          setShowEditModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to update product. Please try again.');
      }
    } catch (error: any) {
      console.error('Update product error:', error);
      setErrorMessage('Failed to update product. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!showDeleteConfirm) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await productsService.deleteProduct(showDeleteConfirm);
      
      if (response.success) {
        setSuccessMessage('Product deleted successfully!');
        await fetchProducts();
        setTimeout(() => {
          setShowDeleteConfirm(null);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to delete product. Please try again.');
      }
    } catch (error: any) {
      console.error('Delete product error:', error);
      setErrorMessage('Failed to delete product. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle activate/deactivate product
  const handleToggleProductStatus = async (product: Product) => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = product.isActive
        ? await productsService.deactivateProduct(product.id)
        : await productsService.activateProduct(product.id);
      
      if (response.success) {
        setSuccessMessage(`Product ${product.isActive ? 'deactivated' : 'activated'} successfully!`);
        await fetchProducts();
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || `Failed to ${product.isActive ? 'deactivate' : 'activate'} product. Please try again.`);
      }
    } catch (error: any) {
      console.error('Toggle product status error:', error);
      setErrorMessage(`Failed to ${product.isActive ? 'deactivate' : 'activate'} product. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view product
  const handleViewProduct = async (product: Product) => {
    setSelectedProduct(product);
    setErrorMessage('');
    // Fetch full product details
    try {
      const response = await productsService.getProduct(product.id);
      if (response.success && response.data) {
        setSelectedProduct(response.data);
        setShowViewModal(true);
      } else {
        setErrorMessage(response.error?.message || 'Failed to load product details');
        // Still show modal with existing data
        setShowViewModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching product details:', error);
      setErrorMessage(error?.message || 'Failed to load product details');
      // Still show modal with existing data
      setShowViewModal(true);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your product catalog</p>
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
            Create Product
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

      {/* Search + Filters (matches invoices layout) */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, description, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-1 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Period Dropdown */}
          <div className="relative" ref={periodRef}>
            <button
              onClick={() => {
                setShowPeriodDropdown(!showPeriodDropdown);
                setShowAmountDropdown(false);
                setShowStatusDropdown(false);
              }}
              className={`flex items-center gap-2 px-4 py-1 bg-white border border-gray-200 rounded text-sm transition-colors ${
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

          {/* Amount Dropdown */}
          <div className="relative" ref={amountRef}>
            <button
              onClick={() => {
                setShowAmountDropdown(!showAmountDropdown);
                setShowPeriodDropdown(false);
                setShowStatusDropdown(false);
              }}
              className={`px-4 py-1 bg-white border border-gray-200 text-sm transition-colors rounded ${
                selectedAmount ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {selectedAmount || 'Amount'}
              <CaretDown className="w-4 h-4 inline-block ml-2" />
            </button>
            {showAmountDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
                {['All', '0-1000', '1000-2000', '2000-5000', '5000+'].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount === 'All' ? '' : amount);
                      setShowAmountDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowPeriodDropdown(false);
                setShowAmountDropdown(false);
              }}
              className={`px-4 py-1 bg-white border border-gray-200 text-sm transition-colors rounded ${
                selectedStatus ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {selectedStatus || 'Status'}
              <CaretDown className="w-4 h-4 inline-block ml-2" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
                {['All', 'Active', 'Inactive'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status === 'All' ? '' : status);
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <>
          {/* Skeleton Table */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden fade-in">
            <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="hidden lg:grid grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
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
                  <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
                    {[...Array(6)].map((_, j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden fade-in">
          <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="hidden lg:grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
              <div>Product</div>
              <div>Description</div>
              <div>Price</div>
              <div>SKU</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                  {/* Mobile Card Layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                            {product.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          product.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(product.price, product.currency)}
                      </div>
                      {product.sku && (
                        <div className="text-xs text-gray-600">SKU: {product.sku}</div>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-green-700 hover:text-green-800 transition-all duration-200 group/btn"
                        title="View Product"
                      >
                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-gray-700 hover:text-gray-800 transition-all duration-200 group/btn"
                        title="Edit Product"
                      >
                        <PencilSimple className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleToggleProductStatus(product)}
                        disabled={actionLoading}
                        className={`px-3 py-2 text-sm rounded-full font-semibold transition-all duration-200 group/btn ${
                          product.isActive
                            ? 'text-amber-700 hover:text-amber-800'
                            : 'text-green-700 hover:text-green-800'
                        }`}
                        title={product.isActive ? 'Deactivate Product' : 'Activate Product'}
                      >
                        {product.isActive ? (
                          <ToggleLeft className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        ) : (
                          <Power className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(product.id)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-red-700 hover:text-red-800 transition-all duration-200 group/btn"
                        title="Delete Product"
                      >
                        <Trash className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                  {/* Desktop Table Layout */}
                  <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600 line-clamp-2">{product.description || 'N/A'}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(product.price, product.currency)}
                    </div>
                    <div className="text-sm text-gray-600">{product.sku || 'N/A'}</div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        product.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-green-700 hover:text-green-800 transition-all duration-200 group/btn"
                        title="View Product"
                      >
                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-gray-700 hover:text-gray-800 transition-all duration-200 group/btn"
                        title="Edit Product"
                      >
                        <PencilSimple className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleToggleProductStatus(product)}
                        disabled={actionLoading}
                        className={`px-3 py-2 text-sm rounded-full font-semibold transition-all duration-200 group/btn ${
                          product.isActive
                            ? 'text-amber-700 hover:text-amber-800'
                            : 'text-green-700 hover:text-green-800'
                        }`}
                        title={product.isActive ? 'Deactivate Product' : 'Activate Product'}
                      >
                        {product.isActive ? (
                          <ToggleLeft className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        ) : (
                          <Power className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(product.id)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-red-700 hover:text-red-800 transition-all duration-200 group/btn"
                        title="Delete Product"
                      >
                        <Trash className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                {searchQuery ? 'No products found matching your search.' : 'No products found. Create your first product to get started.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Product Modal - Right Slide Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-fade-in"
            onClick={() => {
              resetForm();
              setShowCreateModal(false);
            }}
          />
          {/* Modal Content */}
          <div className="relative bg-white h-full w-full max-w-2xl shadow-2xl slide-in-right overflow-y-auto">
            {/* Sticky Header with Gradient */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-4 flex items-center justify-between z-10 shadow-lg">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <h1 className="text-xl font-bold">Create Product</h1>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(false);
                }}
                className="p-1.5 hover:bg-white/10  transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Form Content */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateProduct();
              }}
              className="p-5 space-y-5"
            >
              {/* Success/Error Messages */}
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200  flex items-start gap-3">
                  <WarningCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
                  </div>
                  <button
                    onClick={() => setErrorMessage('')}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200  flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-semibold">Product created successfully!</p>
                    <p className="text-xs text-green-700 mt-1">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Product Name Field */}
              <div className="p-4 bg-gray-50 border border-gray-200 ">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Web Development Service"
                  required
                />
              </div>

              {/* Description Field */}
              <div className="p-4 bg-gray-50 border border-gray-200 ">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                  placeholder="Professional web development services"
                  rows={3}
                />
                <p className="text-xs text-gray-700 mt-2">Optional: Detailed product description</p>
              </div>

              {/* Price and Currency Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-200 ">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 ">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="XAF">XAF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {/* SKU Field */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 ">
                <label className="block text-sm font-semibold text-yellow-900 mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-yellow-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="PROD-001"
                />
                <p className="text-xs text-yellow-700 mt-2">Optional: Stock Keeping Unit identifier</p>
              </div>

              {/* Active Status */}
              <div className="p-4 bg-green-50 border border-green-200 ">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-semibold text-green-900">Active Product</span>
                </label>
                <p className="text-xs text-green-700 mt-2">Active products are available for use in invoices</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-white text-green-700 font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2 text-sm shadow-sm border border-green-200"
                >
                  {actionLoading ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Create Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal - Right Slide */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-fade-in"
            onClick={() => {
              resetForm();
              setShowEditModal(false);
            }}
          />
          {/* Modal Content */}
          <div className="relative bg-white h-full w-full max-w-2xl shadow-2xl slide-in-right overflow-y-auto">
            {/* Sticky Header with Gradient */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-4 flex items-center justify-between z-10 shadow-lg">
              <div className="flex items-center gap-2">
                <PencilSimple className="w-5 h-5" />
                <h1 className="text-xl font-bold">Edit Product</h1>
                {selectedProduct.name && (
                  <span className="text-xs text-white/80 truncate max-w-[200px]">({selectedProduct.name})</span>
                )}
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowEditModal(false);
                }}
                className="p-1.5 hover:bg-white/10  transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Form Content */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProduct();
              }}
              className="p-5 space-y-5"
            >
              {/* Success/Error Messages */}
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200  flex items-start gap-3">
                  <WarningCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
                  </div>
                  <button
                    onClick={() => setErrorMessage('')}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200  flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-semibold">Product updated successfully!</p>
                    <p className="text-xs text-green-700 mt-1">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Product Name Field */}
              <div className="p-4 bg-gray-50 border border-gray-200 ">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Description Field */}
              <div className="p-4 bg-gray-50 border border-gray-200 ">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                  rows={3}
                />
              </div>

              {/* Price and Currency Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-200 ">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 ">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="XAF">XAF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {/* SKU Field */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 ">
                <label className="block text-sm font-semibold text-yellow-900 mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-yellow-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowEditModal(false);
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-white text-green-700 font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2 text-sm shadow-sm border border-green-200"
                >
                  {actionLoading ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Update Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 backdrop-fade-in">
          <div className="bg-white shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto modal-fade-in">
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-0.5">Product Details</h2>
                  <p className="text-green-100 text-xs">Product Information</p>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedProduct(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center gap-2">
                  <WarningCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">{errorMessage}</span>
                </div>
              )}

              {/* Key Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Product ID</div>
                  <div className="text-xs font-mono text-gray-900 break-all">{selectedProduct.id}</div>
                </div>
                {selectedProduct.organization_id && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-200">
                    <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Organization ID</div>
                    <div className="text-xs font-mono text-gray-900 break-all">{selectedProduct.organization_id}</div>
                  </div>
                )}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 border border-green-200">
                  <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Product Name</div>
                  <div className="text-sm font-semibold text-green-900">{selectedProduct.name}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 border border-emerald-200">
                  <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Status</div>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${
                      selectedProduct.isActive
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {selectedProduct.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 border border-amber-200">
                  <div className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
                    <CurrencyDollar className="w-3 h-3" />
                    Price
                  </div>
                  <div className="text-lg font-bold text-amber-900">
                    {formatCurrency(selectedProduct.price, selectedProduct.currency)}
                  </div>
                </div>
                {selectedProduct.sku && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-200">
                    <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">SKU</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedProduct.sku}</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    Description
                  </h3>
                  <p className="text-sm text-gray-900 leading-relaxed">{selectedProduct.description}</p>
                </div>
              )}

              {/* Metadata */}
              {(selectedProduct.createdAt || selectedProduct.updatedAt) && (
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    Metadata
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProduct.createdAt && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created At</div>
                        <div className="text-sm text-gray-900 font-medium">{formatDate(selectedProduct.createdAt)}</div>
                      </div>
                    )}
                    {selectedProduct.updatedAt && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Updated At</div>
                        <div className="text-sm text-gray-900 font-medium">{formatDate(selectedProduct.updatedAt)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditProduct(selectedProduct);
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-1.5"
              >
                <PencilSimple className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedProduct(null);
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-2xl max-w-sm w-full  overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4">
              <div className="flex items-center gap-2">
                <WarningCircle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Delete Product</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={actionLoading}
                  className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Spinner className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


