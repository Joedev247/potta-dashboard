'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Envelope, User, CheckCircle, X, Spinner } from '@phosphor-icons/react';
import { useOrganization } from '@/contexts/OrganizationContext';

interface TeamMember {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'active';
  invitedAt: string;
  invitedBy: string;
}

export default function AddTeamMemberPage() {
  const router = useRouter();
  const { organization } = useOrganization();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Load team members from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('team_members');
    if (stored) {
      try {
        setTeamMembers(JSON.parse(stored));
      } catch {
        setTeamMembers([]);
      }
    }
    // Simulate page load
    setTimeout(() => {
      setPageLoading(false);
    }, 300);
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use crypto.randomUUID if available, otherwise use a timestamp-based ID
      const memberId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newMember: TeamMember = {
        id: memberId,
        email,
        role,
        status: 'pending',
        invitedAt: new Date().toISOString(),
        invitedBy: 'Current User',
      };

      const updated = [newMember, ...teamMembers];
      setTeamMembers(updated);
      localStorage.setItem('team_members', JSON.stringify(updated));

      setSuccess(true);
      setEmail('');
      setRole('member');

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (memberId: string) => {
    const updated = teamMembers.filter(m => m.id !== memberId);
    setTeamMembers(updated);
    localStorage.setItem('team_members', JSON.stringify(updated));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8 fade-in">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Members</h1>
            <p className="text-sm text-gray-600">Manage your organization team</p>
          </div>
        </div>
      </div>

      {pageLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 fade-in">
          {/* Skeleton for Invite Form */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 p-6">
              <div className="h-7 bg-gray-200 rounded w-40 mb-6 animate-pulse"></div>
              <div className="space-y-4">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          {/* Skeleton for Team Members List */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              <div className="divide-y divide-gray-200">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div>
                          <div className="h-5 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 fade-in">
          {/* Invite Form */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Invite Team Member</h2>
              
              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 p-4  flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">Invitation sent!</p>
                    <p className="text-xs text-green-700 mt-1">An email invitation has been sent to the team member.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 p-4  flex items-start gap-3">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Envelope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="team@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'member' | 'viewer')}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white hover:border-gray-300"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                    {role === 'admin' && 'Full access to all features and settings'}
                    {role === 'member' && 'Can manage payments and transactions'}
                    {role === 'viewer' && 'Read-only access to reports and data'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Team Members List */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">
                  Team Members ({teamMembers.length})
                </h2>
              </div>
              {teamMembers.length > 0 ? (
                <div className="divide-y divide-gray-200 ">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="p-5 sm:p-6 hover:bg-gray-50 transition-colors fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-gray-900">{member.email}</span>
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                member.status === 'active' 
                                  ? 'bg-green-100 text-green-700 border border-green-200' 
                                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              }`}>
                                {member.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                              <span className="capitalize font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">
                                {member.role}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span>Invited {formatDate(member.invitedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors "
                          title="Remove team member"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center fade-in">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <UserPlus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
                  <p className="text-sm text-gray-600">Invite team members to collaborate on your organization</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

