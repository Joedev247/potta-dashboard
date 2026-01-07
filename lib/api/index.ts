/**
 * Centralized API Service Exports
 */

// Core exports (avoid blanket re-exports for modules that declare colliding type names)
export * from './client';
export * from './auth';
export * from './balance';
export * from './reports';
export * from './browse';
export * from './users';
export * from './organization';
export * from './notifications';
export * from './statistics';
export * from './onboarding';
export * from './bank-accounts';
export * from './applications';
export * from './payment-links';

// Explicitly export services and canonical types for modules that may export overlapping names
export { paymentsService } from './payments';
export type { Payment, PaymentsListResponse } from './payments';

export { invoicingService } from './invoicing';
export type { Invoice } from './invoicing';

export { customersService } from './customers';
export type { Customer } from './customers';

export { productsService } from './products';
export type { Product } from './products';

export { ordersService } from './orders';
export type { Order, OrderItem, OrdersListResponse } from './orders';

export { refundsService } from './refunds';
export type { Refund, RefundsListResponse } from './refunds';

export { chargebacksService } from './chargebacks';
export type { Chargeback, ChargebacksListResponse } from './chargebacks';

export { paymentLinksService } from './payment-links';
export type { PaymentLink, PaymentLinksListResponse } from './payment-links';

export { adminService } from './admin';
export type { User as AdminUserType, LogEntry, LogsResponse, Organization as AdminOrganization, RegisterUserData, ChangeUserStatusData } from './admin';

// Export customer self-service types
export type { 
  UserProfile, 
  AccountSettings, 
  UpdateProfileData,
  CustomerTransaction,
  TransactionsListResponse
} from './users';

// Export customers types explicitly to avoid conflicts
export type { 
  Customer as CustomerType,
  CreateCustomerData,
  UpdateCustomerData,
  CustomersListResponse
} from './customers';


