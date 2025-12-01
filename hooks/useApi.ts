// React Hooks for API Usage

import { useState, useCallback } from 'react';
import { paymentApi } from '@/lib/api/payments';
import { userApi } from '@/lib/api/users';
import { adminApi } from '@/lib/api/admin';
import { webhookApi } from '@/lib/api/webhooks';
import type { ApiError } from '@/lib/api/types';

// Generic hook for API calls with loading and error states
export function useApiCall<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async (...args: P) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err: any) {
        const apiError: ApiError = {
          message: err.message || 'An error occurred',
          statusCode: err.statusCode || 500,
          errors: err.errors,
        };
        setError(apiError);
        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// Hook for payments
export function usePayments() {
  const makePayment = useApiCall(paymentApi.makePayment);
  const getPaymentStatus = useApiCall(paymentApi.getPaymentStatus);
  const verifyAccountHolderActive = useApiCall(paymentApi.verifyAccountHolderActive);
  const verifyAccountHolderBasicInfo = useApiCall(paymentApi.verifyAccountHolderBasicInfo);

  return {
    makePayment,
    getPaymentStatus,
    verifyAccountHolderActive,
    verifyAccountHolderBasicInfo,
  };
}

// Hook for user transactions
export function useUserTransactions() {
  const getTransactions = useApiCall(userApi.getCustomerTransactions);
  const getTransaction = useApiCall(userApi.getCustomerTransaction);
  const generateCredentials = useApiCall(userApi.generateCredentials);

  return {
    getTransactions,
    getTransaction,
    generateCredentials,
  };
}

// Hook for admin operations
export function useAdmin() {
  const registerUser = useApiCall(userApi.registerUser);
  const changeUserStatus = useApiCall(userApi.changeUserStatus);
  const createProvider = useApiCall(userApi.createProvider);
  const activateProvider = useApiCall(userApi.activateProvider);
  const findUser = useApiCall(userApi.findUser);
  const getLogs = useApiCall(userApi.getLogs);
  const getLog = useApiCall(userApi.getLog);
  const getQueues = useApiCall(adminApi.getQueues);

  return {
    registerUser,
    changeUserStatus,
    createProvider,
    activateProvider,
    findUser,
    getLogs,
    getLog,
    getQueues,
  };
}

// Hook for webhooks
export function useWebhooks() {
  const handleMtnCallback = useApiCall(webhookApi.handleMtnCallback);
  const ipnMomoGet = useApiCall(webhookApi.ipnMomoGet);
  const ipnMomoPost = useApiCall(webhookApi.ipnMomoPost);
  const ipnMomoPut = useApiCall(webhookApi.ipnMomoPut);
  const ipnMomoDelete = useApiCall(webhookApi.ipnMomoDelete);
  const ipnMomoPatch = useApiCall(webhookApi.ipnMomoPatch);
  const ipnMomoOptions = useApiCall(webhookApi.ipnMomoOptions);
  const ipnMomoHead = useApiCall(webhookApi.ipnMomoHead);

  return {
    handleMtnCallback,
    ipnMomoGet,
    ipnMomoPost,
    ipnMomoPut,
    ipnMomoDelete,
    ipnMomoPatch,
    ipnMomoOptions,
    ipnMomoHead,
  };
}

