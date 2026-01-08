"use client";

import { useState, useEffect, useCallback } from "react";
import {
  paymentLinksService,
  applicationsService,
  type PaymentLink,
} from "@/lib/api";
import {
  Plus,
  X,
  Copy,
  CheckCircle,
  WarningCircle,
  Spinner,
  Eye,
  Trash,
  PencilSimple,
  Link as LinkIcon,
  Calendar,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { formatDate, formatCurrency } from "@/lib/utils/format";

export default function PaymentLinksPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"list" | "create" | "details">(
    "list"
  );

  // Applications state
  const [applications, setApplications] = useState<
    { id: string; name: string; api_key: string }[]
  >([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  // Payment links list state
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    amount: "",
    currency: "XAF",
    description: "",
    expires_at: "",
    max_uses: "1",
    mode: "SANDBOX",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createErrorDetails, setCreateErrorDetails] = useState<string | null>(
    null
  );
  const [createSuccess, setCreateSuccess] = useState<PaymentLink | null>(null);

  // Details modal state
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Copy to clipboard
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const tabs = [
    { id: "list", label: "Payment Links" },
    { id: "create", label: "Create Link" },
  ];
  const [showCreateSlide, setShowCreateSlide] = useState(false);

  // Fetch applications on mount
  const fetchApplications = useCallback(async () => {
    setApplicationsLoading(true);
    try {
      const resp = await applicationsService.listApplications({ limit: 50 });
      if (resp.success && resp.data) {
        const apps = resp.data.applications || [];
        setApplications(
          apps.map((a) => ({ id: a.id, name: a.name, api_key: a.api_key }))
        );
        if (apps.length === 1) setSelectedApplicationId(apps[0].id);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Fetch payment links
  const fetchPaymentLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedApp = applications.find(
        (a) => a.id === selectedApplicationId
      );
      const appApiKey = selectedApp?.api_key;

      const resp = await paymentLinksService.listPaymentLinks({
        status: statusFilter || undefined,
        page: pagination.page,
        limit: pagination.limit,
        appApiKey: appApiKey,
      });

      if (resp.success && resp.data) {
        setPaymentLinks(resp.data.items || []);
        if (resp.data.pagination) {
          setPagination(resp.data.pagination);
        }
      } else {
        setError(resp.error?.message || "Failed to fetch payment links");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch payment links");
    } finally {
      setLoading(false);
    }
  }, [
    applications,
    selectedApplicationId,
    statusFilter,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    if (activeTab === "list") {
      fetchPaymentLinks();
    }
  }, [activeTab, fetchPaymentLinks, selectedApplicationId]);

  // Handle create payment link
  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!createForm.amount) {
      setCreateError("Amount is required");
      return;
    }

    setCreateLoading(true);
    try {
      const selectedApp = applications.find(
        (a) => a.id === selectedApplicationId
      );
      const appApiKey = selectedApp?.api_key;

      const payload: any = {
        amount: parseFloat(createForm.amount),
        currency: createForm.currency,
        description: createForm.description || undefined,
        max_uses: createForm.max_uses
          ? parseInt(createForm.max_uses, 10)
          : undefined,
        mode: createForm.mode || "SANDBOX",
      };

      // Ensure `mode` is provided (backend requires it). Use sandbox by default.
      if (!payload.mode) payload.mode = "SANDBOX";

      if (createForm.expires_at) {
        payload.expires_at = new Date(createForm.expires_at).toISOString();
      }

      const response = await paymentLinksService.createPaymentLink(
        payload,
        appApiKey
      );

      if (response.success && response.data) {
        setCreateSuccess(response.data);
        setCreateForm({
          amount: "",
          currency: "XAF",
          description: "",
          expires_at: "",
          max_uses: "1",
          mode: "SANDBOX",
        });
        // Immediately show the created link in the list for instant feedback
        setPaymentLinks((prev) => [response.data as PaymentLink, ...(prev || [])]);
        setActiveTab("list");
        // Save potta payment URL to local history so users can easily access the payment app
        try {
          saveLinkToHistory((response.data as any).slug || (response.data as any).id);
        } catch (e) {
          // ignore
        }
        // Refresh the list from server using the same application API key
        // Merge the created link into the server list if the backend hasn't returned it yet
        try {
          const created = response.data as PaymentLink;
          const serverResp = await paymentLinksService.listPaymentLinks({
            status: statusFilter || undefined,
            page: pagination.page,
            limit: pagination.limit,
            appApiKey: appApiKey,
          });

          if (serverResp.success && serverResp.data) {
            const items = serverResp.data.items || [];
            const exists = items.some((i) => i.id === created.id);
            const merged = exists ? items : [created, ...items];
            setPaymentLinks(merged);
            if (serverResp.data.pagination) setPagination(serverResp.data.pagination);
          }
        } catch (e) {
          // ignore - we already showed the created link locally
        }
        console.log("Payment link created:", response.data);
      } else {
        setCreateError(
          response.error?.message || "Failed to create payment link"
        );
        setCreateErrorDetails(
          response.error?.details
            ? JSON.stringify(response.error.details, null, 2)
            : JSON.stringify(response.error, null, 2)
        );
      }
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create payment link");
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle update payment link
  const handleUpdatePaymentLink = async () => {
    if (!selectedLink) return;

    setEditError(null);
    setEditLoading(true);

    try {
      const selectedApp = applications.find(
        (a) => a.id === selectedApplicationId
      );
      const appApiKey = selectedApp?.api_key;

      const response = await paymentLinksService.updatePaymentLink(
        selectedLink.id,
        editForm,
        appApiKey
      );

      if (response.success && response.data) {
        setSelectedLink(response.data);
        setEditForm(null);
        fetchPaymentLinks();
      } else {
        setEditError(
          response.error?.message || "Failed to update payment link"
        );
      }
    } catch (err: any) {
      setEditError(err?.message || "Failed to update payment link");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle cancel payment link
  const handleCancelPaymentLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to cancel this payment link?")) return;

    try {
      const selectedApp = applications.find(
        (a) => a.id === selectedApplicationId
      );
      const appApiKey = selectedApp?.api_key;

      const response = await paymentLinksService.cancelPaymentLink(
        linkId,
        appApiKey
      );

      if (response.success) {
        fetchPaymentLinks();
        if (selectedLink?.id === linkId) {
          setSelectedLink(null);
        }
      } else {
        alert(response.error?.message || "Failed to cancel payment link");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to cancel payment link");
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, linkId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(linkId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Save created payment link (potta URL format) to local history for easy access
  const saveLinkToHistory = (slug: string) => {
    try {
      const url = `https://potta-payment.vercel.app/pay/${slug}`;
      const key = "recent_payment_links";
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const deduped = (list || []).filter((i: any) => i.slug !== slug);
      deduped.unshift({ slug, url, created_at: new Date().toISOString() });
      const trimmed = deduped.slice(0, 20);
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (e) {
      // ignore storage errors
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Payment Links
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateSlide(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200  hover:shadow-sm text-sm text-gray-700"
            >
              <Plus className="w-4 h-4 text-green-600" />
              Create Link
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 sm:mb-6 border-b-2 border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "create") {
                  setShowCreateSlide(true);
                } else {
                  setActiveTab(tab.id as any);
                }
              }}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Links List Tab */}
        {activeTab === "list" && (
          <div className="space-y-6">
            {/* Search and Filters (left-aligned like Payments page) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
              <div className="max-w-xs">
                <label className="sr-only">Select Application</label>
                <select
                  value={selectedApplicationId || ""}
                  onChange={(e) =>
                    setSelectedApplicationId(e.target.value || null)
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                >
                  <option value="">Choose an application...</option>
                  {applicationsLoading && (
                    <option disabled>Loading applications...</option>
                  )}
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="px-4 py-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PAID">Paid</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="flex items-stretch sm:items-center gap-3">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search payment links"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2 sm:py-1 text-base bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
                  />
                </div>

                <button
                  onClick={() => fetchPaymentLinks()}
                  className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700  flex items-center gap-2">
                <WarningCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner className="w-8 h-8 animate-spin text-green-600" />
              </div>
            ) : paymentLinks.length === 0 ? (
              <div className="text-center py-12">
                <LinkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No payment links yet</p>
                <button
                  onClick={() => setShowCreateSlide(true)}
                  className="mt-4 px-6 py-2 bg-green-600 text-white  hover:bg-green-700 inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Link
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentLinks.map((link) => (
                  <div
                    key={link.id}
                    className="bg-white  border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {link.description || "Untitled Link"}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              link.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : link.status === "PAID"
                                ? "bg-blue-100 text-blue-800"
                                : link.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {link.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-500">Amount:</span>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(link.amount, link.currency)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Uses:</span>
                            <p className="font-semibold text-gray-900">
                              {link.current_uses || 0}/{link.max_uses || "∞"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <p className="font-semibold text-gray-900">
                              {formatDate(link.created_at)}
                            </p>
                          </div>
                          {link.expires_at && (
                            <div>
                              <span className="text-gray-500">Expires:</span>
                              <p className="font-semibold text-gray-900">
                                {formatDate(link.expires_at)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Slug / Link */}
                    <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Payment Link</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://potta-payment.vercel.app/pay/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <code className="text-sm font-mono text-gray-700 break-all">
                            {`https://potta-payment.vercel.app/pay/${link.slug}`}
                          </code>
                        </a>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `https://potta-payment.vercel.app/pay/${link.slug}`,
                              link.id
                            )
                          }
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                        >
                          {copiedLink === link.id ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedLink(link);
                          setEditForm({
                            description: link.description,
                            max_uses: link.max_uses,
                          });
                          setActiveTab("details");
                        }}
                        className="px-4 py-2 text-gray-700 border border-gray-300  hover:bg-gray-50 inline-flex items-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      {link.status === "ACTIVE" && (
                        <button
                          onClick={() => handleCancelPaymentLink(link.id)}
                          className="px-4 py-2 text-red-600 border border-red-300  hover:bg-red-50 inline-flex items-center gap-2 text-sm"
                        >
                          <Trash className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {paymentLinks.length > 0 && pagination.total > pagination.limit && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300  disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of{" "}
                  {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={
                    pagination.page >=
                    Math.ceil(pagination.total / pagination.limit)
                  }
                  className="px-4 py-2 border border-gray-300  disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Payment Link SlideOver */}
        {showCreateSlide && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/40 z-40"
              onClick={() => setShowCreateSlide(false)}
            />
            <div
              className="ml-auto w-full sm:w-[640px] lg:w-[800px] h-full bg-white shadow-2xl p-6 overflow-y-auto z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create Payment Link</h2>
                <button
                  onClick={() => setShowCreateSlide(false)}
                  className="p-2 rounded hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {createSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 ">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">
                      Payment link created successfully!
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Link:</strong>{" "}
                      <code className="bg-green-100 px-2 py-1 rounded">
                        {createSuccess.slug}
                      </code>
                    </div>
                    <div>
                      <strong>Amount:</strong>{" "}
                      {formatCurrency(
                        createSuccess.amount,
                        createSuccess.currency
                      )}
                    </div>
                    <div>
                      <strong>Status:</strong> {createSuccess.status}
                    </div>
                  </div>
                </div>
              )}

              {createError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700  flex items-center gap-2">
                  <WarningCircle className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{createError}</div>
                    {createErrorDetails && (
                      <details className="mt-2 text-xs text-gray-600">
                        <summary className="cursor-pointer">
                          Show details
                        </summary>
                        <pre className="whitespace-pre-wrap mt-2 text-xs">
                          {createErrorDetails}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleCreatePaymentLink} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={createForm.amount}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, amount: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={createForm.currency}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, currency: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                  >
                    <option value="XAF">XAF</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode
                  </label>
                  <select
                    value={createForm.mode}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, mode: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                  >
                    <option value="SANDBOX">Sandbox</option>
                    <option value="LIVE">Live</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the mode for this link (sandbox for testing)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                    placeholder="e.g., Invoice #123, Payment for services"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={createForm.max_uses}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, max_uses: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many times can this link be redeemed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.expires_at}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        expires_at: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Leave empty for no expiration
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed  flex items-center justify-center gap-2"
                >
                  {createLoading ? (
                    <>
                      <Spinner className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Payment Link
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Payment Link Details Tab */}
        {activeTab === "details" && selectedLink && (
          <div className="max-w-2xl">
            <button
              onClick={() => {
                setActiveTab("list");
                setSelectedLink(null);
                setEditForm(null);
              }}
              className="mb-6 text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
            >
              ← Back to List
            </button>

            <div className="bg-white  border border-gray-200 p-8">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedLink.description || "Untitled Link"}
                </h2>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedLink.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : selectedLink.status === "PAID"
                      ? "bg-blue-100 text-blue-800"
                      : selectedLink.status === "CANCELLED"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedLink.status}
                </span>
              </div>

              {editError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700  flex items-center gap-2">
                  <WarningCircle className="w-5 h-5" />
                  {editError}
                </div>
              )}

              {/* Link Details */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedLink.amount, selectedLink.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Uses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedLink.current_uses || 0}/
                    {selectedLink.max_uses || "∞"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(selectedLink.created_at)}
                  </p>
                </div>
                {selectedLink.expires_at && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Expires</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(selectedLink.expires_at)}
                    </p>
                  </div>
                )}
              </div>

              {/* Slug */}
              <div className="mb-8 p-4 bg-gray-50  border border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Payment Link URL</p>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://potta-payment.vercel.app/pay/${selectedLink.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <code className="text-sm font-mono text-gray-700 break-all flex-1">
                      {`https://potta-payment.vercel.app/pay/${selectedLink.slug}`}
                    </code>
                  </a>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `https://potta-payment.vercel.app/pay/${selectedLink.slug}`,
                        selectedLink.id
                      )
                    }
                    className="p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  >
                    {copiedLink === selectedLink.id ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Edit Section */}
              {selectedLink.status === "ACTIVE" && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Edit Link
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editForm?.description || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Uses
                      </label>
                      <input
                        type="number"
                        min={selectedLink.current_uses || 0}
                        value={editForm?.max_uses || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            max_uses: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleUpdatePaymentLink}
                        disabled={editLoading}
                        className="flex-1 px-6 py-2 bg-green-600 text-white font-semibold  hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {editLoading ? (
                          <>
                            <Spinner className="w-5 h-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <PencilSimple className="w-5 h-5" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCancelPaymentLink(selectedLink.id)}
                        className="flex-1 px-6 py-2 bg-red-600 text-white font-semibold  hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <Trash className="w-5 h-5" />
                        Cancel Link
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
