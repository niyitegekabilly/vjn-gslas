import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { GSLAGroup, Member, Loan, Transaction, Cycle } from '../types';
import { 
  Building, MapPin, Users, DollarSign, Calendar, Edit, ArrowLeft,
  TrendingUp, FileText, Shield, CreditCard, Clock,
  AlertCircle, ExternalLink
} from 'lucide-react';
import { GroupForm } from '../components/GroupForm';

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang, refreshApp } = useContext(AppContext);
  const labels = LABELS[lang];

  const [group, setGroup] = useState<GSLAGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [groupData, membersData, loansData, transactionsData] = await Promise.all([
        api.getGroup(id),
        api.getMembers(id),
        api.getLoans(id),
        api.getTransactions(id)
      ]);

      setGroup(groupData);
      setMembers(membersData);
      setLoans(loansData);
      setTransactions(transactionsData);

      if (groupData?.currentCycleId) {
        try {
          const cycleData = await api.getCycle(groupData.currentCycleId);
          setCycle(cycleData);
        } catch (e) {
          console.error('Failed to load cycle:', e);
        }
      }
    } catch (e) {
      console.error('Failed to load group data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    if (!group) return;
    setSubmitting(true);
    try {
      await api.updateGroup(group.id, data, data.reason || 'Admin Update', 'Admin');
      await loadGroupData();
      refreshApp();
      setIsEditModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Failed to save group');
    } finally {
      setSubmitting(false);
    }
  };

  const getMemberName = (memberId?: string) => {
    if (!memberId) return 'Not assigned';
    const member = members.find(m => m.id === memberId);
    return member?.fullName || 'Unknown';
  };

  const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'APPROVED');
  const totalLoansOutstanding = activeLoans.reduce((sum, l) => sum + l.balance, 0);
  const recentTransactions = transactions.slice(0, 10).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-xl font-bold text-gray-700 mb-2">Group not found</h3>
        <p className="text-gray-500 mb-6">The group you're looking for doesn't exist or you don't have access.</p>
        <Link to="/groups" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <ArrowLeft size={18} className="mr-2" /> Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/groups" 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Building className="text-blue-600" size={28} />
              {group.name}
            </h1>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <MapPin size={14} className="mr-1" />
              {group.location || `${group.sector}, ${group.district}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
        >
          <Edit size={18} className="mr-2" /> {labels.edit}
        </button>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          group.status === 'ACTIVE' 
            ? 'bg-green-100 text-green-700' 
            : group.status === 'SUSPENDED'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {group.status}
        </span>
        {cycle && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            {labels.activeSeasons}: {cycle.interestRate}% {labels.interestRate}
          </span>
        )}
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.members}</p>
            <Users className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{members.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {members.filter(m => m.status === 'ACTIVE').length} {labels.active}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.totalSavings}</p>
            <DollarSign className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {group.totalSavings.toLocaleString()} RWF
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {labels.shareValue}: {group.shareValue.toLocaleString()} RWF
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.outstandingLoans}</p>
            <CreditCard className="text-orange-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {totalLoansOutstanding.toLocaleString()} RWF
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {activeLoans.length} {labels.loansActive}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.cashBalance}</p>
            <TrendingUp className="text-purple-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(group.totalSavings - totalLoansOutstanding).toLocaleString()} RWF
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {labels.netPosition}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Building size={20} className="mr-2 text-blue-600" />
              {labels.identification}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.groupName}</p>
                <p className="text-gray-900 font-medium">{group.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.status}</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                  group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {group.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.district}</p>
                <p className="text-gray-900">{group.district}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.sector}</p>
                <p className="text-gray-900">{group.sector}</p>
              </div>
              {group.cell && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.cell}</p>
                  <p className="text-gray-900">{group.cell}</p>
                </div>
              )}
              {group.village && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.village}</p>
                  <p className="text-gray-900">{group.village}</p>
                </div>
              )}
              {group.coordinates && (
                <div className="col-span-2">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.gpsLocation}</p>
                  <p className="text-gray-900 font-mono text-sm">
                    {group.coordinates.lat.toFixed(6)}, {group.coordinates.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Rules */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <DollarSign size={20} className="mr-2 text-green-600" />
              {labels.financialConfiguration}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.shareValue}</p>
                <p className="text-gray-900 font-medium">{group.shareValue.toLocaleString()} RWF</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.loanMultiplier}</p>
                <p className="text-gray-900 font-medium">x{group.maxLoanMultiplier}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Min Shares</p>
                <p className="text-gray-900 font-medium">{group.minShares}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Max Shares</p>
                <p className="text-gray-900 font-medium">{group.maxShares}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.meetingFreq}</p>
                <p className="text-gray-900 font-medium">{group.meetingFrequency}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Meeting Day</p>
                <p className="text-gray-900 font-medium">{group.meetingDay}</p>
              </div>
              {group.lateFeeAmount && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Late Payment Fee</p>
                  <p className="text-gray-900 font-medium">
                    {group.lateFeeType === 'PERCENTAGE' ? `${group.lateFeeAmount}%` : `${group.lateFeeAmount} RWF`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Governance Structure */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Shield size={20} className="mr-2 text-purple-600" />
              {labels.governanceStructure}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase mb-2">{labels.president}</p>
                <p className="text-gray-900 font-medium">{getMemberName(group.presidentId)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs font-bold text-green-600 uppercase mb-2">{labels.secretary}</p>
                <p className="text-gray-900 font-medium">{getMemberName(group.secretaryId)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-xs font-bold text-orange-600 uppercase mb-2">{labels.accountant}</p>
                <p className="text-gray-900 font-medium">{getMemberName(group.accountantId)}</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Clock size={20} className="mr-2 text-gray-600" />
              Recent Activity
            </h2>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">{labels.noData}</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{tx.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.date).toLocaleDateString()} • {tx.description || 'No description'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        tx.type.includes('DEPOSIT') || tx.type.includes('REPAYMENT')
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {tx.type.includes('DEPOSIT') || tx.type.includes('REPAYMENT') ? '+' : '-'}
                        {tx.amount.toLocaleString()} RWF
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Cycle Information */}
          {cycle && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Calendar size={20} className="mr-2 text-blue-600" />
                {labels.activeSeasons}
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.startedOn}</p>
                  <p className="text-gray-900">{new Date(cycle.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">{labels.interestRate}</p>
                  <p className="text-gray-900 font-medium">{cycle.interestRate}%</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    cycle.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cycle.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FileText size={20} className="mr-2 text-gray-600" />
              Documents
            </h2>
            {group.constitutionUrl ? (
              <div className="space-y-2">
                <a
                  href={group.constitutionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText size={18} className="text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{labels.constitution}</span>
                  </div>
                  <ExternalLink size={16} className="text-blue-600" />
                </a>
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-2">No documents uploaded</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to={`/members?groupId=${group.id}`}
                className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                View All Members
              </Link>
              <Link
                to={`/loans?groupId=${group.id}`}
                className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                Manage Loans
              </Link>
              <Link
                to={`/contributions?groupId=${group.id}`}
                className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                View Contributions
              </Link>
              <Link
                to={`/attendance?groupId=${group.id}`}
                className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                Attendance Records
              </Link>
              <Link
                to={`/reports?groupId=${group.id}`}
                className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                Generate Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl">
            <GroupForm
              initialData={group}
              onSubmit={handleSave}
              onCancel={() => setIsEditModalOpen(false)}
              isSubmitting={submitting}
              labels={labels}
              title={labels.modifyGroup}
            />
          </div>
        </div>
      )}
    </div>
  );
}
