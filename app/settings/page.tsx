'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Gear as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Building, 
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  FloppyDisk,
  Check
} from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { authService, usersService } from '@/lib/api';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuth();
  const { organization, updateOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 2FA states
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorAction, setTwoFactorAction] = useState<'enable' | 'disable' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [orgFormData, setOrgFormData] = useState({
    name: organization?.name || '',
    address: organization?.address || '',
    city: organization?.city || '',
    region: organization?.region || '',
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'organization', label: 'Organization', icon: Building },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setSaved(false);
  };

  // Load organization data on mount
  useEffect(() => {
    if (organization) {
      setOrgFormData({
        name: organization.name || '',
        address: organization.address || '',
        city: organization.city || '',
        region: organization.region || '',
      });
    }
  }, [organization]);

  // Load tab from URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.find(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Load profile and settings on mount
  useEffect(() => {
    const loadProfileAndSettings = async () => {
      try {
        // Load profile
        const profileResponse = await usersService.getProfile();
        if (profileResponse.success && profileResponse.data) {
          const profile = profileResponse.data;
          setFormData(prev => ({
            ...prev,
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            email: profile.email || '',
            phone: profile.phone || '',
          }));
          
          // Update user in context
          if (updateUser) {
            updateUser({
              id: profile.id,
              email: profile.email,
              username: profile.username,
              firstName: profile.firstName,
              lastName: profile.lastName,
              isVerified: profile.isVerified,
              role: profile.role,
            });
          }
        }

        // Load settings
        const settingsResponse = await usersService.getSettings();
        if (settingsResponse.success && settingsResponse.data) {
          const settings = settingsResponse.data;
          setTwoFactorAuth(settings.twoFactorEnabled || false);
          setEmailNotifications(settings.emailNotifications ?? true);
          setPushNotifications(settings.smsNotifications ?? true);
        }
      } catch (error) {
        console.error('Error loading profile and settings:', error);
      }
    };
    
    loadProfileAndSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await usersService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        username: formData.email, // Use email as username if needed
      });
      
      if (response.success && response.data) {
        const updatedProfile = response.data;
        
        // Update user in context
        if (updateUser && user) {
          updateUser({
            ...user,
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
          });
        }
        
        // Update localStorage
        const updatedUser = { ...user, ...updatedProfile };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.error?.message || 'Failed to update profile. Please try again.');
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all password fields.');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match.');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('Password updated successfully!');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await usersService.updateSettings({
        emailNotifications,
        smsNotifications: pushNotifications,
        twoFactorEnabled: twoFactorAuth, // Keep 2FA status
      });
      
      if (response.success) {
        setSuccess('Notification preferences saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.error?.message || 'Failed to save preferences. Please try again.');
      }
    } catch (err: any) {
      console.error('Notification settings update error:', err);
      setError(err?.message || 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrganization = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!orgFormData.name.trim()) {
      setError('Organization name is required.');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update organization in context
      if (organization && updateOrganization) {
        updateOrganization({
          name: orgFormData.name,
          address: orgFormData.address,
          city: orgFormData.city,
          region: orgFormData.region,
        });
      }
      
      setSuccess('Organization settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await authService.enable2FA();
      if (response.success && response.data) {
        setTwoFactorEmail(response.data.email);
        setTwoFactorAction('enable');
        setShow2FAModal(true);
        setOtpCode('');
        setOtpError('');
      } else {
        setError(response.error?.message || 'Failed to enable 2FA. Please try again.');
      }
    } catch (err) {
      setError('Failed to enable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FAOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit code');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    
    try {
      const response = await authService.verify2FA(otpCode, false);
      if (response.success && response.data) {
        if ('enabled' in response.data && response.data.enabled) {
          // 2FA enabled successfully
          setTwoFactorAuth(true);
          setShow2FAModal(false);
          setOtpCode('');
          setSuccess('Two-factor authentication enabled successfully!');
          setTimeout(() => setSuccess(''), 3000);
          
          // Update settings
          await usersService.updateSettings({ twoFactorEnabled: true });
        } else {
          setOtpError('Invalid verification code. Please try again.');
        }
      } else {
        setOtpError(response.error?.message || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      setOtpError('Failed to verify code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      setOtpError('Password is required to disable 2FA');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    
    try {
      const response = await authService.disable2FA(disablePassword);
      if (response.success) {
        setTwoFactorAuth(false);
        setShow2FAModal(false);
        setDisablePassword('');
        setSuccess('Two-factor authentication disabled successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Update settings
        await usersService.updateSettings({ twoFactorEnabled: false });
      } else {
        setOtpError(response.error?.message || 'Failed to disable 2FA. Please check your password.');
      }
    } catch (err) {
      setOtpError('Failed to disable 2FA. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend2FAOTP = async () => {
    if (!user?.email) return;
    
    try {
      await authService.resend2FAOTP(user.email);
      setOtpError('');
      setSuccess('Verification code sent to your email');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setOtpError('Failed to resend code. Please try again.');
    }
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <div
      className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${
        enabled ? 'bg-green-500' : 'bg-gray-300'
      }`}
      onClick={onChange}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-1'
        } mt-1`}
      />
    </div>
  );

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 border-b-2 border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white border-2 border-gray-200 p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                {success}
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : saved || success ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <FloppyDisk className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white border-2 border-gray-200 p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-600">
                    {twoFactorAuth ? 'Enabled - Extra security layer active' : 'Add an extra layer of security'}
                  </div>
                </div>
              </div>
              <ToggleSwitch 
                enabled={twoFactorAuth} 
                onChange={() => {
                  if (twoFactorAuth) {
                    // Disable 2FA
                    setTwoFactorAction('disable');
                    setShow2FAModal(true);
                    setDisablePassword('');
                  } else {
                    // Enable 2FA
                    handleEnable2FA();
                  }
                }} 
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                {success}
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleUpdatePassword}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : saved || success ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                      <FloppyDisk className="w-4 h-4" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white border-2 border-gray-200 p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                <div className="flex items-center gap-3">
                  <Envelope className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-600">Receive notifications via email</div>
                  </div>
                </div>
                <ToggleSwitch enabled={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Push Notifications</div>
                    <div className="text-sm text-gray-600">Receive push notifications</div>
                  </div>
                </div>
                <ToggleSwitch enabled={pushNotifications} onChange={() => setPushNotifications(!pushNotifications)} />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                <div className="flex items-center gap-3">
                      <Envelope className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Marketing Emails</div>
                    <div className="text-sm text-gray-600">Receive marketing and promotional emails</div>
                  </div>
                </div>
                <ToggleSwitch enabled={marketingEmails} onChange={() => setMarketingEmails(!marketingEmails)} />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                {success}
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveNotifications}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : saved || success ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                      <FloppyDisk className="w-4 h-4" />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Organization Tab */}
        {activeTab === 'organization' && (
          <div className="bg-white border-2 border-gray-200 p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
            </div>

            {organization && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                      {organization.name ? organization.name.substring(0, 2).toUpperCase() : 'OR'}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{organization.name || 'Organization'}</div>
                    <div className="text-sm text-gray-600">Organization</div>
                  </div>
                </div>
                {organization.registrationNumber && (
                  <div className="text-sm text-gray-600 mb-2">Registration: {organization.registrationNumber}</div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={orgFormData.name}
                onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                placeholder="Enter organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={orgFormData.address}
                onChange={(e) => setOrgFormData({ ...orgFormData, address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                placeholder="Enter organization address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={orgFormData.city}
                  onChange={(e) => setOrgFormData({ ...orgFormData, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region / Province
                </label>
                <input
                  type="text"
                  value={orgFormData.region}
                  onChange={(e) => setOrgFormData({ ...orgFormData, region: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  placeholder="Enter region"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                {success}
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveOrganization}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : saved || success ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                      <FloppyDisk className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white  max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {twoFactorAction === 'enable' ? 'Enable Two-Factor Authentication' : 'Disable Two-Factor Authentication'}
            </h3>
            
            {twoFactorAction === 'enable' ? (
              <>
                <p className="text-gray-600 mb-4">
                  A verification code has been sent to <span className="font-medium">{twoFactorEmail || user?.email}</span>.
                  Please enter the code below to enable 2FA.
                </p>
                <div className="mb-4">
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(value);
                      setOtpError('');
                    }}
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500 text-center text-xl tracking-widest"
                  />
                </div>
                {otpError && (
                  <div className="mb-4 text-red-600 text-sm">{otpError}</div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShow2FAModal(false);
                      setOtpCode('');
                      setOtpError('');
                      setTwoFactorAction(null);
                    }}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify2FAOTP}
                    disabled={otpLoading || otpCode.length !== 6}
                    className="flex-1 px-4 py-2 bg-green-500 text-white font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <div className="mt-4 text-center">
                  <button
                    onClick={handleResend2FAOTP}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Resend code
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  To disable two-factor authentication, please enter your password to confirm.
                </p>
                <div className="mb-4">
                  <label htmlFor="disable-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="disable-password"
                    value={disablePassword}
                    onChange={(e) => {
                      setDisablePassword(e.target.value);
                      setOtpError('');
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  />
                </div>
                {otpError && (
                  <div className="mb-4 text-red-600 text-sm">{otpError}</div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShow2FAModal(false);
                      setDisablePassword('');
                      setOtpError('');
                      setTwoFactorAction(null);
                    }}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    disabled={otpLoading || !disablePassword}
                    className="flex-1 px-4 py-2 bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpLoading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

