/**
 * Example Components Demonstrating API Usage
 * 
 * This file contains example React components showing how to use
 * all the API endpoints in your application.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePayments, useUserTransactions, useAdmin, useWebhooks } from '@/hooks/useApi';
import { paymentApi, userApi, adminApi } from '@/lib/api';
import type { MakePaymentDto, Transaction } from '@/lib/api';

// Example: Making a Payment
export function MakePaymentExample() {
  const { makePayment } = usePayments();
  const [formData, setFormData] = useState<MakePaymentDto>({
    amount: 0,
    currency: 'XAF',
    paymentProvider: 'MTN',
    phoneNumber: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await makePayment.execute(formData);
      alert(`Payment initiated! Transaction ID: ${result.transactionId}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Amount</label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          required
        />
      </div>
      <div>
        <label>Currency</label>
        <select
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
        >
          <option value="XAF">XAF</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div>
        <label>Payment Provider</label>
        <select
          value={formData.paymentProvider}
          onChange={(e) => setFormData({ ...formData, paymentProvider: e.target.value })}
        >
          <option value="MTN">MTN</option>
          <option value="ORANGE">ORANGE</option>
          <option value="MOOV">MOOV</option>
          <option value="AIRTEL">AIRTEL</option>
        </select>
      </div>
      <div>
        <label>Phone Number</label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          required
        />
      </div>
      <div>
        <label>Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <button type="submit" disabled={makePayment.loading}>
        {makePayment.loading ? 'Processing...' : 'Make Payment'}
      </button>
      {makePayment.error && <div className="text-red-500">{makePayment.error.message}</div>}
    </form>
  );
}

// Example: Fetching User Transactions
export function TransactionsListExample() {
  const { getTransactions } = useUserTransactions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const result = await getTransactions.execute();
      setTransactions(result);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  return (
    <div>
      <button onClick={loadTransactions} disabled={getTransactions.loading}>
        {getTransactions.loading ? 'Loading...' : 'Refresh Transactions'}
      </button>
      
      {getTransactions.error && (
        <div className="text-red-500">{getTransactions.error.message}</div>
      )}

      <div className="mt-4">
        <h3>Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.transactionId}</td>
                <td>{tx.amount}</td>
                <td>{tx.currency}</td>
                <td>{tx.status}</td>
                <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Example: Checking Payment Status
export function PaymentStatusExample({ transactionId }: { transactionId: string }) {
  const { getPaymentStatus } = usePayments();
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    checkStatus();
  }, [transactionId]);

  const checkStatus = async () => {
    try {
      const result = await getPaymentStatus.execute(transactionId);
      setStatus(result);
    } catch (error) {
      console.error('Failed to get payment status:', error);
    }
  };

  return (
    <div>
      <button onClick={checkStatus} disabled={getPaymentStatus.loading}>
        {getPaymentStatus.loading ? 'Checking...' : 'Check Status'}
      </button>
      {status && (
        <div>
          <p>Status: {status.status}</p>
          <p>Amount: {status.amount} {status.currency}</p>
        </div>
      )}
    </div>
  );
}

// Example: Admin - Register User
export function AdminRegisterUserExample() {
  const { registerUser } = useAdmin();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'customer' as 'customer' | 'admin' | 'service',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await registerUser.execute(formData);
      alert(`User registered: ${result.email}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="First Name"
        value={formData.firstName}
        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Last Name"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        required
      />
      <select
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
      >
        <option value="customer">Customer</option>
        <option value="admin">Admin</option>
        <option value="service">Service</option>
      </select>
      <button type="submit" disabled={registerUser.loading}>
        {registerUser.loading ? 'Registering...' : 'Register User'}
      </button>
    </form>
  );
}

// Example: Generate Credentials
export function GenerateCredentialsExample() {
  const { generateCredentials } = useUserTransactions();
  const [credentials, setCredentials] = useState<any>(null);

  const handleGenerate = async () => {
    try {
      const result = await generateCredentials.execute();
      setCredentials(result);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={generateCredentials.loading}>
        {generateCredentials.loading ? 'Generating...' : 'Generate Credentials'}
      </button>
      {credentials && (
        <div className="mt-4">
          <p>API Key: {credentials.apiKey}</p>
          <p>Secret Key: {credentials.secretKey}</p>
        </div>
      )}
    </div>
  );
}

// Example: Verify Account Holder
export function VerifyAccountHolderExample() {
  const { verifyAccountHolderActive, verifyAccountHolderBasicInfo } = usePayments();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('MTN');
  const [activeInfo, setActiveInfo] = useState<any>(null);
  const [basicInfo, setBasicInfo] = useState<any>(null);

  const checkActive = async () => {
    try {
      const result = await verifyAccountHolderActive.execute(phoneNumber, provider);
      setActiveInfo(result);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const checkBasicInfo = async () => {
    try {
      const result = await verifyAccountHolderBasicInfo.execute(phoneNumber, provider);
      setBasicInfo(result);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          type="tel"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="MTN">MTN</option>
          <option value="ORANGE">ORANGE</option>
          <option value="MOOV">MOOV</option>
          <option value="AIRTEL">AIRTEL</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={checkActive} disabled={verifyAccountHolderActive.loading}>
          Check Active Status
        </button>
        <button onClick={checkBasicInfo} disabled={verifyAccountHolderBasicInfo.loading}>
          Get Basic Info
        </button>
      </div>
      {activeInfo && (
        <div>
          <p>Is Active: {activeInfo.isActive ? 'Yes' : 'No'}</p>
        </div>
      )}
      {basicInfo && (
        <div>
          <p>Name: {basicInfo.firstName} {basicInfo.lastName}</p>
          <p>Is Active: {basicInfo.isActive ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}

// Example: Admin - Find User
export function AdminFindUserExample() {
  const { findUser } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'userId' | 'email'>('email');
  const [user, setUser] = useState<any>(null);

  const handleSearch = async () => {
    try {
      const params = searchType === 'userId' 
        ? { userId: searchTerm }
        : { email: searchTerm };
      
      const result = await findUser.execute(params.userId, params.email);
      setUser(result);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <select value={searchType} onChange={(e) => setSearchType(e.target.value as any)}>
          <option value="email">Email</option>
          <option value="userId">User ID</option>
        </select>
        <input
          type="text"
          placeholder={searchType === 'email' ? 'Email' : 'User ID'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch} disabled={findUser.loading}>
          {findUser.loading ? 'Searching...' : 'Find User'}
        </button>
      </div>
      {user && (
        <div>
          <p>User: {user.user.email}</p>
          <p>Transactions: {user.transactions?.length || 0}</p>
        </div>
      )}
    </div>
  );
}

// Example: Admin - Get Logs
export function AdminLogsExample() {
  const { getLogs } = useAdmin();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const result = await getLogs.execute();
      setLogs(result);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  return (
    <div>
      <button onClick={loadLogs} disabled={getLogs.loading}>
        {getLogs.loading ? 'Loading...' : 'Refresh Logs'}
      </button>
      <div className="mt-4">
        {logs.map((log, index) => (
          <div key={index}>
            <p>{log.method} {log.endpoint} - {log.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


