/**
 * Centralized API Service Exports
 */

export * from './client';
export * from './auth';
export * from './payments';
export * from './balance';
export * from './reports';
export * from './invoicing';
export * from './browse';
export * from './users';
export * from './organization';
export * from './notifications';
export * from './statistics';
export * from './onboarding';
export * from './customers';
export * from './products';
export * from './orders';
export * from './refunds';
export * from './chargebacks';
export * from './bank-accounts';
export * from './applications';
export * from './admin';

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

export { apiClient } from './client';
export { authService } from './auth';
export { paymentsService } from './payments';
export { balanceService } from './balance';
export { reportsService } from './reports';
export { invoicingService } from './invoicing';
export { browseService } from './browse';
export { usersService } from './users';
export { organizationService } from './organization';
export { notificationsService } from './notifications';
export { statisticsService } from './statistics';
export { onboardingService } from './onboarding';
export { customersService } from './customers';
export { productsService } from './products';
export { ordersService } from './orders';
export { refundsService } from './refunds';
export { chargebacksService } from './chargebacks';
export { bankAccountsService } from './bank-accounts';
export { applicationsService } from './applications';
export { adminService } from './admin';

