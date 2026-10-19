import React, { useState } from 'react';
import { getSavedAuditLogs, AuditLogEntry, saveAuditLogEntry } from '../utils/storage';
import { ShieldCheck, User, Clock, FileText, Search, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuditLogView: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>(getSavedAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [actionDesc, setActionDesc] = useState('');
  const [actionCategory, setActionCategory] = useState('CONTENT_EDIT');

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionDesc.trim()) return;

    const updated = saveAuditLogEntry({
      userEmail: user?.email || 'topmostproffesor234@gmail.com',
      userName: user?.displayName || 'Dr. Raunak Roy',
      role: (user as any)?.role || 'Admin',
      action: actionCategory,
      details: actionDesc.trim(),
    });

    setLogs(updated);
    setActionDesc('');
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || log.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 md:p-8 space-y-6 max-h-[88vh] overflow-y-auto pr-2">
      {/* Header */}
      <div className="bg-[#FFFDF9] border border-[#DED2C5] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#661414] text-[#F5EBDF] text-[10px] font-mono font-bold uppercase rounded-xs">
              SECURE GOVERNANCE
            </span>
            <span className="text-xs font-mono text-[#C04E2A] font-semibold">
              Multi-User RBAC Audit Trail
            </span>
          </div>
          <h2 className="font-serif text-xl font-bold text-[#351D1D] mt-1">
            System-Wide Multi-User Audit Logs
          </h2>
          <p className="text-xs text-[#786A61]">
            Tracking every action, review decision, claim approval, and content generation across all users and roles in Steer.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 bg-[#416C49]/10 text-[#416C49] border border-[#416C49]/30 rounded-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>{logs.length} Total Audit Events Logged</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFDF9] p-4 border border-[#DED2C5]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#786A61] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by user, role, action..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F0] border border-[#DED2C5] rounded-xs focus:outline-hidden focus:border-[#661414]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-[#786A61]">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono bg-[#FAF6F0] border border-[#DED2C5] rounded-xs focus:outline-hidden focus:border-[#661414]"
          >
            <option value="ALL">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Medical Reviewer">Medical Reviewer</option>
            <option value="Content Creator">Content Creator</option>
            <option value="Compliance Officer">Compliance Officer</option>
          </select>
        </div>
      </div>

      {/* Add Audit Action Form for testing / logging */}
      <form onSubmit={handleAddLog} className="bg-[#FAF6F0] border border-[#DED2C5] p-4 space-y-3">
        <h3 className="font-serif font-bold text-xs text-[#351D1D] uppercase tracking-wider">
          Record Action to Shared Audit Trail
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={actionCategory}
            onChange={(e) => setActionCategory(e.target.value)}
            className="px-3 py-2 text-xs font-mono bg-white border border-[#DED2C5] rounded-xs"
          >
            <option value="CLAIM_APPROVAL">Claim Approval</option>
            <option value="CONTENT_GENERATION">Content Generation</option>
            <option value="PAPER_INGESTION">Paper Ingestion</option>
            <option value="RULE_OVERRIDE">Rule Override</option>
            <option value="CALENDAR_SCHEDULE">Calendar Schedule</option>
          </select>

          <input
            type="text"
            required
            value={actionDesc}
            onChange={(e) => setActionDesc(e.target.value)}
            placeholder="Describe action details (e.g., Verified biomarker metrics for GLP-1 trial)..."
            className="sm:col-span-2 px-3 py-2 text-xs bg-white border border-[#DED2C5] rounded-xs focus:outline-hidden focus:border-[#661414]"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#661414] hover:bg-[#4a0d0d] text-[#F5EBDF] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Audit Event</span>
          </button>
        </div>
      </form>

      {/* Audit Logs Ledger */}
      <div className="bg-[#FFFDF9] border border-[#DED2C5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F5EFE6] border-b border-[#DED2C5] text-[#351D1D] font-mono text-[10px] uppercase">
                <th className="p-3">Timestamp</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Action Category</th>
                <th className="p-3">Details & Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DED2C5]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF6F0] transition-colors">
                  <td className="p-3 font-mono text-[11px] text-[#786A61] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#C04E2A]" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-[#351D1D]">{log.userName}</div>
                    <div className="text-[10px] font-mono text-[#786A61]">{log.userEmail}</div>
                    <span className="inline-block mt-0.5 px-2 py-0.2 bg-[#661414]/10 text-[#661414] text-[9px] font-mono font-bold rounded-xs">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-semibold text-[#C04E2A] text-[11px]">
                    {log.action}
                  </td>
                  <td className="p-3 text-[#351D1D] leading-relaxed max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#786A61] font-mono text-xs">
                    No audit log events match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
