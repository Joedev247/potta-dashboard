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
  const [allPaymentLinks, setAllPaymentLinks] = useState<PaymentLink[]>([]); // Store all links for client-side filtering
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

  // Modal states
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showCancelLinkModal, setShowCancelLinkModal] = useState(false);
  const [linkToCancel, setLinkToCancel] = useState<{ id: string; slug: string; fromHistory?: boolean } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // History state
  const [recentLinks, setRecentLinks] = useState<
    Array<{
      slug: string;
      url: string;
      created_at: string;
      amount?: number;
      currency?: string;
      description?: string;
      status?: string;
      max_uses?: number;
      current_uses?: number;
      expires_at?: string;
    }>
  >([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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

  // Apply search filter to payment links
  const applySearchFilter = useCallback((links: PaymentLink[], query: string) => {
    if (!query.trim()) {
      setPaymentLinks(links);
      return;
    }
    const searchQuery = query.toLowerCase().trim();
    const filtered = links.filter((link) => {
      const description = (link.description || "").toLowerCase();
      const slug = (link.slug || "").toLowerCase();
      const amount = String(link.amount || "");
      const currency = (link.currency || "").toLowerCase();
      return (
        description.includes(searchQuery) ||
        slug.includes(searchQuery) ||
        amount.includes(searchQuery) ||
        currency.includes(searchQuery)
      );
    });
    setPaymentLinks(filtered);
  }, []);

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
        const items = resp.data.items || [];
        setAllPaymentLinks(items); // Store all links for client-side filtering
        // Apply client-side search filter
        applySearchFilter(items, searchQuery);
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
    searchQuery,
    applySearchFilter,
  ]);

  // Load history from localStorage
  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    try {
      // Simulate a brief loading delay for better UX
      setTimeout(() => {
        const key = "recent_payment_links";
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        setRecentLinks(list || []);
        setHistoryLoading(false);
      }, 300);
    } catch (e) {
      console.error("Failed to load history:", e);
      setRecentLinks([]);
      setHistoryLoading(false);
    }
  }, []);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (activeTab === "list") {
      fetchPaymentLinks();
      loadHistory(); // Refresh history when switching to list tab
    }
  }, [activeTab, fetchPaymentLinks, selectedApplicationId, loadHistory]);

  // Filter recent links based on search query
  const filteredRecentLinks = recentLinks.filter((link) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const description = (link.description || "").toLowerCase();
    const slug = (link.slug || "").toLowerCase();
    const amount = String(link.amount || "");
    const currency = (link.currency || "").toLowerCase();
    return (
      description.includes(query) ||
      slug.includes(query) ||
      amount.includes(query) ||
      currency.includes(query)
    );
  });

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
        // Capture description before form reset
        const savedDescription = createForm.description;
        
        setCreateSuccess(response.data);
        setCreateForm({
          amount: "",
          currency: "XAF",
          description: "",
          expires_at: "",
          max_uses: "1",
          mode: "SANDBOX",
        });
        setActiveTab("list");
        // Save potta payment URL to local history so users can easily access the payment app
        try {
          const linkData = response.data as PaymentLink;
          saveLinkToHistory(linkData.slug || linkData.id, {
            amount: linkData.amount,
            currency: linkData.currency,
            description: linkData.description || savedDescription || undefined,
            status: linkData.status,
            max_uses: linkData.max_uses,
            current_uses: linkData.current_uses,
            expires_at: linkData.expires_at,
            created_at: linkData.created_at,
          });
        } catch (e) {
          // ignore
        }
        // Simply refresh the list from server - no manual addition to avoid duplicates
        await fetchPaymentLinks();
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
    setLinkToCancel({ id: linkId, slug: "" });
    setShowCancelLinkModal(true);
  };

  // Confirm cancel payment link
  const confirmCancelPaymentLink = async () => {
    if (!linkToCancel || isCancelling) return;

    setIsCancelling(true);

    // If canceling from history, just remove from history
    if (linkToCancel.fromHistory) {
      const updated = recentLinks.filter((l) => l.slug !== linkToCancel.slug);
      setRecentLinks(updated);
      localStorage.setItem("recent_payment_links", JSON.stringify(updated));
      setShowCancelLinkModal(false);
      setLinkToCancel(null);
      setIsCancelling(false);
      return;
    }

    // Otherwise, cancel via API
    try {
      const selectedApp = applications.find(
        (a) => a.id === selectedApplicationId
      );
      const appApiKey = selectedApp?.api_key;

      const response = await paymentLinksService.cancelPaymentLink(
        linkToCancel.id,
        appApiKey
      );

      if (response.success) {
        fetchPaymentLinks();
        if (selectedLink?.id === linkToCancel.id) {
          setSelectedLink(null);
        }
        setShowCancelLinkModal(false);
        setLinkToCancel(null);
      } else {
        alert(response.error?.message || "Failed to cancel payment link");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to cancel payment link");
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle clear history
  const handleClearHistory = () => {
    localStorage.removeItem("recent_payment_links");
    setRecentLinks([]);
    setShowClearHistoryModal(false);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, linkId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(linkId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Save created payment link (potta URL format) to local history for easy access
  const saveLinkToHistory = (
    slug: string,
    linkData?: {
      amount?: number;
      currency?: string;
      description?: string;
      status?: string;
      max_uses?: number;
      current_uses?: number;
      expires_at?: string;
      created_at?: string;
    }
  ) => {
    try {
      const url = `https://potta-payment.vercel.app/pay/${slug}`;
      const key = "recent_payment_links";
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const deduped = (list || []).filter((i: any) => i.slug !== slug);
      const newEntry = {
        slug,
        url,
        created_at: linkData?.created_at || new Date().toISOString(),
        amount: linkData?.amount,
        currency: linkData?.currency,
        description: linkData?.description,
        status: linkData?.status || "ACTIVE",
        max_uses: linkData?.max_uses,
        current_uses: linkData?.current_uses || 0,
        expires_at: linkData?.expires_at,
      };
      deduped.unshift(newEntry);
      const trimmed = deduped.slice(0, 20);
      localStorage.setItem(key, JSON.stringify(trimmed));
      setRecentLinks(trimmed);
    } catch (e) {
      // ignore storage errors
    }
  };

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
          <div className="space-y-6 fade-in">
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
                  // Trigger refetch when status changes
                  setTimeout(() => {
                    fetchPaymentLinks();
                  }, 0);
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
                    onChange={(e) => {
                      const newQuery = e.target.value;
                      setSearchQuery(newQuery);
                      // Apply search filter immediately to all payment links
                      applySearchFilter(allPaymentLinks, newQuery);
                    }}
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

            {/* Recent Payment Links History */}
            {historyLoading ? (
              <div className="mb-6 fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white border border-gray-200 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
                            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, j) => (
                              <div key={j}>
                                <div className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="h-3 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredRecentLinks.length > 0 ? (
              <div className="mb-6 fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Recent Payment Links
                    </h2>
                    <p className="text-sm text-gray-500">
                      Your recently created payment links
                    </p>
                  </div>
                  <button
                    onClick={() => setShowClearHistoryModal(true)}
                    className="text-sm text-gray-500 hover:text-red-600"
                  >
                    Clear History
                  </button>
                </div>
                <div className="space-y-4">
                  {filteredRecentLinks.map((link, index) => (
                    <div
                      key={`${link.slug}-${index}`}
                      className="bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900" title={link.description || "Untitled Link"}>
                              {link.description || "Untitled Link"}
                            </h3>
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                link.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : link.status === "PAID"
                                  ? "bg-gray-100 text-gray-800"
                                  : link.status === "CANCELLED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {link.status || "ACTIVE"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
                            {link.amount && link.currency && (
                              <div>
                                <span className="text-gray-500">Amount:</span>
                                <p className="font-semibold text-gray-900">
                                  {formatCurrency(link.amount, link.currency)}
                                </p>
                              </div>
                            )}
                            {(link.max_uses !== undefined || link.current_uses !== undefined) && (
                              <div>
                                <span className="text-gray-500">Uses:</span>
                                <p className="font-semibold text-gray-900">
                                  {link.current_uses || 0}/{link.max_uses || "∞"}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Created:</span>
                              <p className="font-semibold text-gray-900">
                                {link.created_at ? formatDate(link.created_at) : "Invalid Date"}
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
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <code className="text-sm font-mono text-gray-700 break-all">
                              {link.url}
                            </code>
                          </a>
                          <button
                            onClick={() => copyToClipboard(link.url, link.slug)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                          >
                            {copiedLink === link.slug ? (
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
                          onClick={async () => {
                            // Try to find the link in paymentLinks, or create a mock link for viewing
                            const fullLink = paymentLinks.find((l) => l.slug === link.slug);
                            if (fullLink) {
                              setSelectedLink(fullLink);
                              setEditForm({
                                description: fullLink.description,
                                max_uses: fullLink.max_uses,
                              });
                              setActiveTab("details");
                            } else {
                              // Try to fetch full link details first
                              try {
                                const fullLinkResp = await paymentLinksService.getPaymentLinkBySlug(
                                  link.slug
                                );
                                if (fullLinkResp.success && fullLinkResp.data) {
                                  setSelectedLink(fullLinkResp.data);
                                  setEditForm({
                                    description: fullLinkResp.data.description || link.description || "",
                                    max_uses: fullLinkResp.data.max_uses || link.max_uses,
                                  });
                                } else {
                                  // Create a mock link object from history data
                                  const mockLink: PaymentLink = {
                                    id: link.slug,
                                    slug: link.slug,
                                    amount: link.amount || 0,
                                    currency: link.currency || "XAF",
                                    description: link.description || undefined,
                                    status: (link.status as any) || "ACTIVE",
                                    max_uses: link.max_uses,
                                    current_uses: link.current_uses,
                                    expires_at: link.expires_at,
                                    created_at: link.created_at || new Date().toISOString(),
                                  };
                                  setSelectedLink(mockLink);
                                  setEditForm({
                                    description: link.description || "",
                                    max_uses: link.max_uses,
                                  });
                                }
                              } catch (e) {
                                // Create a mock link object from history data as fallback
                                const mockLink: PaymentLink = {
                                  id: link.slug,
                                  slug: link.slug,
                                  amount: link.amount || 0,
                                  currency: link.currency || "XAF",
                                  description: link.description || undefined,
                                  status: (link.status as any) || "ACTIVE",
                                  max_uses: link.max_uses,
                                  current_uses: link.current_uses,
                                  expires_at: link.expires_at,
                                  created_at: link.created_at || new Date().toISOString(),
                                };
                                setSelectedLink(mockLink);
                                setEditForm({
                                  description: link.description || "",
                                  max_uses: link.max_uses,
                                });
                              }
                              setActiveTab("details");
                            }
                          }}
                          className="px-4 py-2 text-gray-700 border border-gray-300  hover:bg-gray-50 inline-flex items-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {(link.status === "ACTIVE" || !link.status) && (
                          <button
                            onClick={() => {
                              setLinkToCancel({ id: link.slug, slug: link.slug, fromHistory: true });
                              setShowCancelLinkModal(true);
                            }}
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
              </div>
            ) : null}

            {loading ? (
              <>
                {/* Skeleton Loaders */}
                <div className="space-y-4 fade-in">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white border border-gray-200 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, j) => (
                              <div key={j}>
                                <div className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="h-3 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : paymentLinks.length === 0 && filteredRecentLinks.length === 0 && !searchQuery.trim() ? (
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
            ) : null}

            {/* Payment Links from API */}
            {!loading && paymentLinks.length > 0 && (
              <div className="space-y-4 fade-in">
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
                                ? "bg-gray-100 text-gray-800"
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
                        onClick={async () => {
                          // Try to fetch full link details to ensure we have all data including description
                          try {
                            const fullLinkResp = await paymentLinksService.getPaymentLinkBySlug(
                              link.slug
                            );
                            if (fullLinkResp.success && fullLinkResp.data) {
                              setSelectedLink(fullLinkResp.data);
                              setEditForm({
                                description: fullLinkResp.data.description || "",
                                max_uses: fullLinkResp.data.max_uses,
                              });
                            } else {
                              // Fallback to the link from list
                              setSelectedLink(link);
                              setEditForm({
                                description: link.description || "",
                                max_uses: link.max_uses,
                              });
                            }
                          } catch (e) {
                            // Fallback to the link from list
                            setSelectedLink(link);
                            setEditForm({
                              description: link.description || "",
                              max_uses: link.max_uses,
                            });
                          }
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
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-fade-in"
              onClick={() => setShowCreateSlide(false)}
            />
            {/* Modal Content */}
            <div
              className="relative bg-white h-full w-full max-w-2xl shadow-2xl slide-in-right overflow-y-auto z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header with Gradient */}
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-4 flex items-center justify-between z-10 shadow-lg">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  <h1 className="text-xl font-bold">Create Payment Link</h1>
                </div>
                <button
                  onClick={() => setShowCreateSlide(false)}
                  className="p-1.5 hover:bg-white/10  transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreatePaymentLink} className="p-5 space-y-5">
                {/* Success/Error Messages */}
                {createSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200  flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-green-800 font-semibold mb-2">
                        Payment link created successfully!
                      </p>
                      <div className="space-y-2 text-sm text-green-700">
                        <div>
                          <strong>Link:</strong>{" "}
                          <code className="bg-green-100 px-2 py-1 rounded text-xs">
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
                  </div>
                )}

                {createError && (
                  <div className="p-4 bg-red-50 border border-red-200  flex items-start gap-3">
                    <WarningCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-800 font-medium">{createError}</p>
                      {createErrorDetails && (
                        <details className="mt-2 text-xs text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">
                            Show details
                          </summary>
                          <pre className="whitespace-pre-wrap mt-2 text-xs bg-red-50 p-2 rounded">
                            {createErrorDetails}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )}

                {/* Amount and Currency Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 border border-gray-200 ">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                      className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 ">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Currency
                    </label>
                    <select
                      value={createForm.currency}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, currency: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      <option value="XAF">XAF</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                {/* Mode Field */}
                <div className="p-4 bg-gray-50 border border-gray-200 ">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Mode
                  </label>
                  <select
                    value={createForm.mode}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, mode: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  >
                    <option value="SANDBOX">Sandbox</option>
                    <option value="LIVE">Live</option>
                  </select>
                  <p className="text-xs text-gray-700 mt-2">
                    Choose the mode for this link (sandbox for testing)
                  </p>
                </div>

                {/* Description Field */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 ">
                  <label className="block text-sm font-semibold text-yellow-900 mb-2">
                    Title / Description
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
                    className="w-full px-3 py-2 bg-white border border-yellow-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="e.g., Invoice #123, Payment for services"
                  />
                  <p className="text-xs text-yellow-700 mt-2">
                    This will be displayed as the payment link title
                  </p>
                </div>

                {/* Max Uses and Expiration Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-teal-50 border border-teal-200 ">
                    <label className="block text-sm font-semibold text-teal-900 mb-2">
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
                      className="w-full px-3 py-2 bg-white border border-teal-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="1"
                    />
                    <p className="text-xs text-teal-700 mt-2">
                      How many times can this link be redeemed
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 ">
                    <label className="block text-sm font-semibold text-amber-900 mb-2">
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
                      className="w-full px-3 py-2 bg-white border border-amber-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-amber-700 mt-2">
                      Optional: Leave empty for no expiration
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateSlide(false)}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 px-4 py-2 bg-white text-green-700 font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2 text-sm shadow-sm border border-green-200"
                  >
                    {createLoading ? (
                      <>
                        <Spinner className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Create Payment Link
                      </>
                    )}
                  </button>
                </div>
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
                      ? "bg-gray-100 text-gray-800"
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
                  <p className="text-sm text-gray-500 mb-1">Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedLink.current_uses || 0}/{selectedLink.max_uses || "∞"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedLink.current_uses || 0} of {selectedLink.max_uses || "∞"} uses
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
                        Title / Description
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
                      <p className="text-xs text-gray-500 mt-1">
                        This will be displayed as the payment link title
                      </p>
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

      {/* Clear History Modal */}
      {showClearHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 z-40"
            onClick={() => setShowClearHistoryModal(false)}
          />
          <div className="relative bg-white  shadow-xl p-6 max-w-md w-full mx-4 z-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <WarningCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Clear History
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to clear all recent payment links? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowClearHistoryModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Payment Link Modal */}
      {showCancelLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!isCancelling) {
                setShowCancelLinkModal(false);
                setLinkToCancel(null);
              }
            }}
          />
          <div className="relative bg-white  shadow-2xl p-8 max-w-lg w-full mx-4 z-50 transform transition-all animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => {
                if (!isCancelling) {
                  setShowCancelLinkModal(false);
                  setLinkToCancel(null);
                }
              }}
              disabled={isCancelling}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600  hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <WarningCircle className="w-8 h-8 text-red-600" weight="fill" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Cancel Payment Link
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Are you sure you want to cancel this payment link? This action cannot be undone and the link will no longer be accessible for payments.
                </p>
                {linkToCancel?.fromHistory && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 ">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This will only remove the link from your recent history. The payment link itself may still be active.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  if (!isCancelling) {
                    setShowCancelLinkModal(false);
                    setLinkToCancel(null);
                  }
                }}
                disabled={isCancelling}
                className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300  hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelPaymentLink}
                disabled={isCancelling}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white  hover:from-red-700 hover:to-red-800 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px] shadow-lg hover:shadow-xl"
              >
                {isCancelling ? (
                  <>
                    <Spinner className="w-5 h-5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <Trash className="w-5 h-5" />
                    <span>Confirm Cancel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
