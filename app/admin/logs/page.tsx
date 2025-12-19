'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardText, 
  Eye, 
  Spinner, 
  WarningCircle,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { adminService, type LogEntry } from '@/lib/api';
import { formatDate } from '@/lib/utils/format';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      const response = await adminService.getLogs({ page: currentPage, limit });
      
      if (response.success && response.data) {
        setLogs(response.data.logs || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        // Check if it's an admin access error
        if (response.error?.code === 'ADMIN_ACCESS_REQUIRED') {
          setErrorMessage('Admin access required. Your account does not have admin privileges. Please contact your system administrator.');
        } else {
          setErrorMessage(response.error?.message || 'Failed to fetch logs');
        }
        setLogs([]);
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      setErrorMessage(error?.message || 'Failed to fetch logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleViewLog = async (log: LogEntry) => {
    if (log.id) {
      try {
        const response = await adminService.getLogById(log.id);
        if (response.success && response.data) {
          setSelectedLog(response.data);
          setShowViewModal(true);
        }
      } catch (error) {
        // If detailed fetch fails, show the log we have
        setSelectedLog(log);
        setShowViewModal(true);
      }
    } else {
      setSelectedLog(log);
      setShowViewModal(true);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-50';
    if (status >= 400 && status < 500) return 'text-yellow-600 bg-yellow-50';
    if (status >= 500) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getMethodColor = (method: string) => {
    const methodColors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      DELETE: 'bg-red-100 text-red-700',
      PATCH: 'bg-green-100 text-green-700',
    };
    return methodColors[method] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mt-20 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">System Logs</h1>
              <p className="text-sm text-gray-600 mt-1">View and monitor API request logs</p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200  flex items-start gap-3">
          <WarningCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white  border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Spinner className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No logs found</p>
            <p className="text-sm text-gray-500 mt-1">Logs will appear here as requests are made</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Endpoint</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id || `${log.endpoint}-${log.createdAt}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(log.method)}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-mono text-gray-900 max-w-md truncate" title={log.endpoint}>
                          {log.endpoint}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.userId ? (
                            <span className="font-mono text-xs">{log.userId.substring(0, 8)}...</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          {log.ipAddress || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.executionTime || <span className="text-gray-400">-</span>}
                        </div>
                        {log.createdAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(log.createdAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleViewLog(log)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50  transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CaretLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CaretRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Log Modal */}
      {showViewModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white  shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Log Details</h2>
                <p className="text-sm text-gray-600 mt-1">Request and response information</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100  transition-colors"
              >
                <WarningCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Request Information</h3>
                  <div className="bg-gray-50  p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Method:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(selectedLog.method)}`}>
                        {selectedLog.method}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Endpoint:</span>
                      <span className="text-sm font-mono text-gray-900">{selectedLog.endpoint}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLog.status)}`}>
                        {selectedLog.status}
                      </span>
                    </div>
                    {selectedLog.userId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">User ID:</span>
                        <span className="text-sm font-mono text-gray-900">{selectedLog.userId}</span>
                      </div>
                    )}
                    {selectedLog.ipAddress && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">IP Address:</span>
                        <span className="text-sm font-mono text-gray-900">{selectedLog.ipAddress}</span>
                      </div>
                    )}
                    {selectedLog.executionTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Execution Time:</span>
                        <span className="text-sm text-gray-900">{selectedLog.executionTime}</span>
                      </div>
                    )}
                    {selectedLog.createdAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Created At:</span>
                        <span className="text-sm text-gray-900">{formatDate(selectedLog.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Body */}
                {selectedLog.requestBody && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Request Body</h3>
                    <div className="bg-gray-50  p-4">
                      <pre className="text-xs text-gray-800 overflow-x-auto">
                        {JSON.stringify(selectedLog.requestBody, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Response Body */}
                {selectedLog.responseBody && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Response Body</h3>
                    <div className="bg-gray-50  p-4">
                      <pre className="text-xs text-gray-800 overflow-x-auto">
                        {JSON.stringify(selectedLog.responseBody, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors "
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

