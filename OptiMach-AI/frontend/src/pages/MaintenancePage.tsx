import React, { useState } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MaintenanceRecord, MaintenanceStatus, MaintenancePriority, Machine } from '../types';
import { PriorityBadge } from '../components/StatusBadge';
import {
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from '../services/api';

interface MaintenancePageProps {
  records: MaintenanceRecord[];
  machines: Machine[];
  onRefresh: () => void;
  initialOpenModal?: boolean;
  prefillMachineId?: string;
  prefillTitle?: string;
  prefillDesc?: string;
  prefillPriority?: string;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  records,
  machines,
  onRefresh,
  initialOpenModal = false,
  prefillMachineId,
  prefillTitle,
  prefillDesc,
  prefillPriority,
}) => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(initialOpenModal);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    machine_id: prefillMachineId || 'MCH-04',
    title: prefillTitle || '',
    description: prefillDesc || '',
    priority: (prefillPriority as MaintenancePriority) || 'High',
    status: 'Scheduled' as MaintenanceStatus,
    technician: 'Marcus Vance (Senior Mechanical)',
    scheduled_date: new Date().toISOString().split('T')[0],
    cost: 500,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchesTab = activeTab === 'All' || r.status === activeTab;
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.machine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // KPI calculations
  const total = records.length;
  const scheduledCount = records.filter((r) => r.status === 'Scheduled').length;
  const inProgressCount = records.filter((r) => r.status === 'In Progress').length;
  const completedCount = records.filter((r) => r.status === 'Completed').length;
  const urgentCount = records.filter((r) => r.priority === 'Urgent' || r.priority === 'High').length;

  const handleOpenAdd = () => {
    setFormData({
      machine_id: prefillMachineId || machines[0]?.id || 'MCH-01',
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Scheduled',
      technician: 'Marcus Vance (Senior Mechanical)',
      scheduled_date: new Date().toISOString().split('T')[0],
      cost: 450,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rec: MaintenanceRecord) => {
    setSelectedRecord(rec);
    setFormData({
      machine_id: rec.machine_id,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      status: rec.status,
      technician: rec.technician,
      scheduled_date: rec.scheduled_date,
      cost: rec.cost || 0,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (rec: MaintenanceRecord) => {
    setSelectedRecord(rec);
    setIsDeleteModalOpen(true);
  };

  // Submit Add
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createMaintenanceRecord(formData);
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      await updateMaintenanceRecord(selectedRecord.id, formData);
      setIsEditModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark Completed with Confetti Celebration
  const handleQuickComplete = async (rec: MaintenanceRecord) => {
    try {
      await updateMaintenanceRecord(rec.id, {
        status: 'Completed',
        completed_date: new Date().toISOString().split('T')[0],
      });
      // Trigger festive industrial accomplishment confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#FFD700', '#10B981'],
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      await deleteMaintenanceRecord(selectedRecord.id);
      setIsDeleteModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#66521A]/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#1A1A1A] border border-[#66521A] text-[#FFD700]">
              <CalendarClock className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5]">
              Industrial Maintenance Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">
            Dispatch, track, and close preventive and predictive work orders across the plant fleet
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-gold-primary flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-[#D4AF37]/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Work Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#66521A]">
          <span className="text-xs text-[#A0A0A0] block">Total Work Orders</span>
          <span className="text-2xl font-bold font-mono text-[#F5F5F5] mt-1 block">{total}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#66521A]">
          <span className="text-xs text-[#A0A0A0] block">Scheduled</span>
          <span className="text-2xl font-bold font-mono text-[#FFD700] mt-1 block">{scheduledCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#66521A]">
          <span className="text-xs text-[#A0A0A0] block">In Progress</span>
          <span className="text-2xl font-bold font-mono text-[#D4AF37] mt-1 block">{inProgressCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#66521A]">
          <span className="text-xs text-[#A0A0A0] block">Completed</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">{completedCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#66521A]">
          <span className="text-xs text-[#A0A0A0] block">Urgent Priority</span>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">{urgentCount}</span>
        </div>
      </div>

      {/* Filter and View Toolbar */}
      <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#66521A] flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search work orders, technicians, machines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-xs text-[#F5F5F5] placeholder-[#A0A0A0] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {['All', 'Scheduled', 'In Progress', 'Completed', 'Pending'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveTab(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === st
                  ? 'bg-[#121212] text-[#FFD700] border border-[#D4AF37] shadow-sm font-semibold'
                  : 'bg-[#121212] text-[#A0A0A0] hover:text-[#F5F5F5] border border-[#66521A]/50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-[#66521A]/60">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg ${viewMode === 'list' ? 'bg-[#1A1A1A] text-[#FFD700] border border-[#66521A] font-semibold' : 'text-[#A0A0A0]'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded-lg ${viewMode === 'calendar' ? 'bg-[#1A1A1A] text-[#FFD700] border border-[#66521A] font-semibold' : 'text-[#A0A0A0]'}`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Main Content Display */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="p-16 rounded-2xl bg-[#1A1A1A] border border-[#66521A] text-center text-[#A0A0A0]">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#D4AF37]" />
              <p className="text-sm">No maintenance records matching criteria</p>
            </div>
          ) : (
            filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A]/70 hover:border-[#D4AF37] shadow-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#121212] border border-[#66521A] text-[#FFD700] font-mono font-bold text-xs">
                      {rec.machine_id}
                    </span>
                    <PriorityBadge priority={rec.priority} />
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        rec.status === 'Completed'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : rec.status === 'In Progress'
                          ? 'bg-[#121212] text-[#FFD700] border border-[#D4AF37]'
                          : 'bg-[#121212] text-[#A0A0A0] border border-[#66521A]'
                      }`}
                    >
                      {rec.status}
                    </span>
                    {rec.cost && rec.cost > 0 && (
                      <span className="text-[11px] text-[#A0A0A0] font-mono">
                        ${rec.cost.toFixed(0)} est.
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#F5F5F5] truncate">{rec.title}</h3>
                  <p className="text-xs text-[#A0A0A0] line-clamp-2 leading-relaxed">
                    {rec.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#A0A0A0] pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-[#D4AF37]" />
                      {rec.technician}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#FFD700]" />
                      Target: {rec.scheduled_date}
                    </span>
                    {rec.completed_date && (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Closed: {rec.completed_date}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {rec.status !== 'Completed' && (
                    <button
                      onClick={() => handleQuickComplete(rec)}
                      className="btn-gold-primary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark Complete
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEdit(rec)}
                    title="Edit Record"
                    className="p-2 rounded-xl bg-[#121212] border border-[#66521A]/60 text-[#A0A0A0] hover:text-[#FFD700] transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenDelete(rec)}
                    title="Delete Record"
                    className="p-2 rounded-xl bg-[#121212] border border-[#66521A]/60 text-[#A0A0A0] hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Timeline View */
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-6">
          <div className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            Maintenance Dispatch Timeline
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#66521A]/60">
            {filteredRecords.map((rec) => (
              <div key={rec.id} className="relative group">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-[#1A1A1A] ${
                    rec.status === 'Completed'
                      ? 'bg-emerald-500'
                      : rec.priority === 'Urgent'
                      ? 'bg-rose-500 animate-ping'
                      : 'bg-[#FFD700]'
                  }`}
                />

                <div className="p-4 rounded-xl bg-[#121212] border border-[#66521A]/60 hover:border-[#D4AF37] transition-all">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-[#FFD700] font-bold">{rec.machine_id} • {rec.scheduled_date}</span>
                    <PriorityBadge priority={rec.priority} />
                  </div>
                  <h4 className="text-sm font-semibold text-[#F5F5F5]">{rec.title}</h4>
                  <p className="text-xs text-[#A0A0A0] mt-1">{rec.description}</p>
                  <div className="mt-2 text-[11px] text-[#A0A0A0] flex items-center gap-2">
                    <User className="w-3 h-3 text-[#D4AF37]" />
                    <span>Assigned Lead: {rec.technician}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ADD WORK ORDER MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/85 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#66521A] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#66521A]/50">
              <h3 className="text-base font-bold text-[#F5F5F5]">Create Maintenance Work Order</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Target Machine</label>
                  <select
                    value={formData.machine_id}
                    onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
                  >
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} — {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenancePriority })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  >
                    <option value="Urgent">Urgent (Immediate)</option>
                    <option value="High">High (Within 3 days)</option>
                    <option value="Medium">Medium (Within 7 days)</option>
                    <option value="Low">Low (Routine)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#A0A0A0] block mb-1">Work Order Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Drive Shaft Bearing Replacement"
                  className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="text-[#A0A0A0] block mb-1">Detailed Technical Scope</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Vibration telemetry triggered hazard limit. Inspect sleeve bearings, purge oil reservoir, verify alignment."
                  className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Assigned Lead Technician</label>
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-gold-secondary px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold-primary px-4 py-2 rounded-xl font-bold"
                >
                  {isSubmitting ? 'Creating...' : 'Create Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT WORK ORDER MODAL --- */}
      {isEditModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/85 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#66521A] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#66521A]/50">
              <h3 className="text-base font-bold text-[#F5F5F5]">Edit Work Order #{selectedRecord.id}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-semibold focus:border-[#D4AF37]"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenancePriority })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#A0A0A0] block mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="text-[#A0A0A0] block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Technician</label>
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-gold-secondary px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold-primary px-4 py-2 rounded-xl font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {isDeleteModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/85 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#66521A] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#F5F5F5]">Delete Work Order?</h3>
            <p className="text-xs text-[#A0A0A0]">
              Are you sure you want to remove work order <strong className="text-[#F5F5F5]">#{selectedRecord.id}: {selectedRecord.title}</strong>?
            </p>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-gold-secondary px-3.5 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
