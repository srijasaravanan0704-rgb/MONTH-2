import React, { useState } from 'react';
import {
  Server,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MapPin,
  X,
  Sliders,
} from 'lucide-react';
import { Machine } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CircularGauge } from '../components/CircularGauge';
import { createMachine, updateMachine, deleteMachine } from '../services/api';

interface MachinesPageProps {
  machines: Machine[];
  onRefresh: () => void;
  onSelectMachineForPredict: (machine: Machine) => void;
  onNavigateToLive: (machineId: string) => void;
}

export const MachinesPage: React.FC<MachinesPageProps> = ({
  machines,
  onRefresh,
  onSelectMachineForPredict,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('health_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'Induction Motor',
    location: '',
    age_years: 3,
    volt: 170.8,
    rotate: 446.6,
    pressure: 100.9,
    vibration: 40.4,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter & Sort
  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  filteredMachines.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'health_score') comparison = a.health_score - b.health_score;
    else if (sortBy === 'failure_prob') comparison = a.failure_prob - b.failure_prob;
    else if (sortBy === 'age_years') comparison = a.age_years - b.age_years;
    else if (sortBy === 'id') comparison = a.id.localeCompare(b.id);
    else if (sortBy === 'name') comparison = a.name.localeCompare(b.name);

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const handleOpenAdd = () => {
    const nextNum = machines.length + 1;
    setFormData({
      id: `MCH-${nextNum < 10 ? '0' + nextNum : nextNum}`,
      name: '',
      type: 'Induction Motor',
      location: 'Production Line B',
      age_years: 2,
      volt: 170.8,
      rotate: 446.6,
      pressure: 100.9,
      vibration: 40.4,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (m: Machine) => {
    setSelectedMachine(m);
    setFormData({
      id: m.id,
      name: m.name,
      type: m.type,
      location: m.location,
      age_years: m.age_years,
      volt: m.volt,
      rotate: m.rotate,
      pressure: m.pressure,
      vibration: m.vibration,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = (m: Machine) => {
    setSelectedMachine(m);
    setIsDetailModalOpen(true);
  };

  const handleOpenDelete = (m: Machine) => {
    setSelectedMachine(m);
    setIsDeleteModalOpen(true);
  };

  // Submit Add
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.name.trim()) {
      setFormError('Machine ID and Name are required.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createMachine(formData);
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add machine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await updateMachine(selectedMachine.id, formData);
      setIsEditModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update machine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedMachine) return;
    setIsSubmitting(true);
    try {
      await deleteMachine(selectedMachine.id);
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
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#66521A]/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#1A1A1A] border border-[#66521A] text-[#FFD700]">
              <Server className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5]">
              Industrial Machine Fleet
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">
            Comprehensive equipment inventory, telemetry profiles, and lifecycle maintenance tracking
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-gold-primary flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-[#D4AF37]/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Industrial Machine
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#66521A] flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, machine name, type, bay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-xs text-[#F5F5F5] placeholder-[#A0A0A0] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {['All', 'Healthy', 'Warning', 'High Risk', 'Critical'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === st
                  ? 'bg-[#121212] text-[#FFD700] border border-[#D4AF37] shadow-sm font-semibold'
                  : 'bg-[#121212] text-[#A0A0A0] hover:text-[#F5F5F5] border border-[#66521A]/50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Sort & View Mode */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-xs text-[#A0A0A0] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="health_score">Sort by Health Score</option>
            <option value="failure_prob">Sort by Failure Risk</option>
            <option value="age_years">Sort by Age</option>
            <option value="id">Sort by ID</option>
            <option value="name">Sort by Name</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title="Toggle sort direction"
            className="p-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#A0A0A0] hover:text-[#F5F5F5]"
          >
            {sortOrder === 'asc' ? '▲' : '▼'}
          </button>

          <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-[#66521A]/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded-lg ${viewMode === 'grid' ? 'bg-[#1A1A1A] text-[#FFD700] border border-[#66521A]' : 'text-[#A0A0A0]'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded-lg ${viewMode === 'table' ? 'bg-[#1A1A1A] text-[#FFD700] border border-[#66521A]' : 'text-[#A0A0A0]'}`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMachines.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A]/70 hover:border-[#D4AF37] shadow-xl transition-all hover:translate-y-[-2px] flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-[#FFD700] bg-[#121212] px-2 py-0.5 rounded border border-[#66521A]">
                    {m.id}
                  </span>
                  <StatusBadge status={m.status} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-[#F5F5F5] group-hover:text-[#FFD700] transition-colors">
                  {m.name}
                </h3>
                <p className="text-xs text-[#A0A0A0] mt-0.5">{m.type}</p>
                <p className="text-[11px] text-[#A0A0A0]/70 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-[#D4AF37]" />
                  {m.location}
                </p>

                {/* Health & Failure Gauges */}
                <div className="grid grid-cols-2 gap-2 my-3 p-2 rounded-xl bg-[#121212] border border-[#66521A]/50">
                  <div className="flex flex-col items-center">
                    <CircularGauge value={m.health_score} size={64} strokeWidth={6} isRisk={false} />
                    <span className="text-[9px] text-[#A0A0A0] mt-1 font-semibold">Health Score</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <CircularGauge value={m.failure_prob * 100} size={64} strokeWidth={6} isRisk={true} />
                    <span className="text-[9px] text-[#A0A0A0] mt-1 font-semibold">7d Risk Prob</span>
                  </div>
                </div>

                {/* Sensors row */}
                <div className="grid grid-cols-4 gap-1 text-center text-xs mb-3 font-mono">
                  <div className="bg-[#121212] p-1 rounded border border-[#262626]">
                    <span className="text-[8px] text-[#A0A0A0] block font-sans">VOLT</span>
                    <span className="text-[#F5F5F5]">{m.volt.toFixed(0)}</span>
                  </div>
                  <div className="bg-[#121212] p-1 rounded border border-[#262626]">
                    <span className="text-[8px] text-[#A0A0A0] block font-sans">RPM</span>
                    <span className="text-[#F5F5F5]">{m.rotate.toFixed(0)}</span>
                  </div>
                  <div className="bg-[#121212] p-1 rounded border border-[#262626]">
                    <span className="text-[8px] text-[#A0A0A0] block font-sans">PRESS</span>
                    <span className="text-[#F5F5F5]">{m.pressure.toFixed(0)}</span>
                  </div>
                  <div className={`p-1 rounded border ${m.vibration > 45 ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-[#121212] border-[#262626] text-[#F5F5F5]'}`}>
                    <span className="text-[8px] text-[#A0A0A0] block font-sans">VIB</span>
                    <span>{m.vibration.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#66521A]/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenDetail(m)}
                    title="View Detailed Machine Spec"
                    className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-[#FFD700] hover:bg-[#121212] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(m)}
                    title="Edit Machine Record"
                    className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-[#D4AF37] hover:bg-[#121212] transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(m)}
                    title="Delete Machine"
                    className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-rose-400 hover:bg-[#121212] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onSelectMachineForPredict(m)}
                  className="px-2.5 py-1 rounded-lg bg-[#121212] hover:bg-[#1A1A1A] text-[#FFD700] border border-[#66521A] hover:border-[#D4AF37] text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  Predict
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#121212] text-[#A0A0A0] uppercase font-mono text-[10px] border-b border-[#66521A]/50">
              <tr>
                <th className="py-3 px-3">Machine ID</th>
                <th className="py-3 px-3">Name & Type</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Health</th>
                <th className="py-3 px-3">7d Failure Risk</th>
                <th className="py-3 px-3">Voltage</th>
                <th className="py-3 px-3">RPM</th>
                <th className="py-3 px-3">Pressure</th>
                <th className="py-3 px-3">Vibration</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#66521A]/30">
              {filteredMachines.map((m) => (
                <tr key={m.id} className="hover:bg-[#121212]/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#FFD700]">{m.id}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-[#F5F5F5] block">{m.name}</span>
                    <span className="text-[10px] text-[#A0A0A0]">{m.type}</span>
                  </td>
                  <td className="py-3 px-3 text-[#A0A0A0]">{m.location}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={m.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#F5F5F5]">
                    {m.health_score.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    <span className={m.failure_prob >= 0.5 ? 'text-rose-400' : 'text-[#F5F5F5]'}>
                      {(m.failure_prob * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#A0A0A0]">{m.volt.toFixed(1)}V</td>
                  <td className="py-3 px-3 font-mono text-[#A0A0A0]">{m.rotate.toFixed(0)}</td>
                  <td className="py-3 px-3 font-mono text-[#A0A0A0]">{m.pressure.toFixed(1)} psi</td>
                  <td className="py-3 px-3 font-mono font-semibold">
                    <span className={m.vibration > 45 ? 'text-rose-400' : 'text-[#F5F5F5]'}>
                      {m.vibration.toFixed(1)} mm/s
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenDetail(m)}
                      className="p-1 rounded text-[#A0A0A0] hover:text-[#FFD700] hover:bg-[#121212]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-1 rounded text-[#A0A0A0] hover:text-[#D4AF37] hover:bg-[#121212]"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(m)}
                      className="p-1 rounded text-[#A0A0A0] hover:text-rose-400 hover:bg-[#121212]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ADD MACHINE MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/85 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#66521A] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#66521A]/50">
              <h3 className="text-base font-bold text-[#F5F5F5]">Add Industrial Machine</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Machine ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
                    placeholder="MCH-09"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Machine Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  >
                    <option value="Induction Motor">Induction Motor</option>
                    <option value="CNC Mill">CNC Mill</option>
                    <option value="Compressor">Compressor</option>
                    <option value="Conveyor">Conveyor Drive</option>
                    <option value="Turbopump">Turbopump</option>
                    <option value="Hydraulic Press">Hydraulic Press</option>
                    <option value="Centrifugal Fan">Centrifugal Fan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#A0A0A0] block mb-1">Machine Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  placeholder="Heavy Duty Motor Unit 2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Plant Location / Bay</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                    placeholder="Bay C - Line 3"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Operating Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.age_years}
                    onChange={(e) => setFormData({ ...formData, age_years: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Initial Telemetry */}
              <div className="pt-2 border-t border-[#66521A]/50">
                <span className="text-[#A0A0A0] font-semibold block mb-2">Initial Sensor Telemetry Baseline:</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-[#A0A0A0] block">Volt (V)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.volt}
                      onChange={(e) => setFormData({ ...formData, volt: parseFloat(e.target.value) || 170 })}
                      className="w-full p-1.5 rounded bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#A0A0A0] block">RPM</label>
                    <input
                      type="number"
                      step="1"
                      value={formData.rotate}
                      onChange={(e) => setFormData({ ...formData, rotate: parseFloat(e.target.value) || 445 })}
                      className="w-full p-1.5 rounded bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#A0A0A0] block">Press (psi)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.pressure}
                      onChange={(e) => setFormData({ ...formData, pressure: parseFloat(e.target.value) || 100 })}
                      className="w-full p-1.5 rounded bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#A0A0A0] block">Vib (mm/s)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vibration}
                      onChange={(e) => setFormData({ ...formData, vibration: parseFloat(e.target.value) || 40 })}
                      className="w-full p-1.5 rounded bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200">
                  {formError}
                </div>
              )}

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
                  {isSubmitting ? 'Creating...' : 'Create Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MACHINE MODAL --- */}
      {isEditModalOpen && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/85 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#66521A] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#66521A]/50">
              <h3 className="text-base font-bold text-[#F5F5F5]">Edit Machine {selectedMachine.id}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-[#A0A0A0] block mb-1">Machine Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Operating Age (Years)</label>
                  <input
                    type="number"
                    value={formData.age_years}
                    onChange={(e) => setFormData({ ...formData, age_years: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Telemetry adjustment */}
              <div className="pt-2 border-t border-[#66521A]/50">
                <span className="text-[#A0A0A0] font-semibold block mb-2">Adjust Current Telemetry:</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-[#A0A0A0] block">Volt (V)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.volt}
                      onChange={(e) => setFormData({ ...formData, volt: parseFloat(e.target.value) || 170 })}
                      className="w-full p-1.5 rounded bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#A0A0A0] block">RPM</label>
                    <input
                      type="number"
                      step="1"
                      value={formData.rotate}
                      onChange={(e) => setFormData({ ...formData, rotate: parseFloat(e.target.value) || 445 })}
                      className="w-full p-1.5 rounded bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#A0A0A0] block">Press (psi)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.pressure}
                      onChange={(e) => setFormData({ ...formData, pressure: parseFloat(e.target.value) || 100 })}
                      className="w-full p-1.5 rounded bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#A0A0A0] block">Vib (mm/s)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vibration}
                      onChange={(e) => setFormData({ ...formData, vibration: parseFloat(e.target.value) || 40 })}
                      className="w-full p-1.5 rounded bg-[#121212] border border-[#66521A]/70 text-[#F5F5F5] font-mono focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200">
                  {formError}
                </div>
              )}

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
                  {isSubmitting ? 'Saving...' : 'Update Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAIL MACHINE MODAL --- */}
      {isDetailModalOpen && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/85 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#66521A] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#66521A]/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-[#FFD700]">{selectedMachine.id}</span>
                  <StatusBadge status={selectedMachine.status} size="sm" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F5F5] mt-1">{selectedMachine.name}</h3>
                <p className="text-xs text-[#A0A0A0]">{selectedMachine.type} • {selectedMachine.location}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gauges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#121212] border border-[#66521A]/60 flex flex-col items-center">
                <CircularGauge value={selectedMachine.health_score} size={84} strokeWidth={8} isRisk={false} label="Health" />
                <span className="text-xs text-[#A0A0A0] mt-1 font-semibold">Overall Health Score</span>
              </div>
              <div className="p-4 rounded-xl bg-[#121212] border border-[#66521A]/60 flex flex-col items-center">
                <CircularGauge value={selectedMachine.failure_prob * 100} size={84} strokeWidth={8} isRisk={true} label="Risk" />
                <span className="text-xs text-[#A0A0A0] mt-1 font-semibold">7-Day Failure Hazard</span>
              </div>
            </div>

            {/* Telemetry */}
            <div className="p-4 rounded-xl bg-[#121212] border border-[#66521A]/50 space-y-2 text-xs">
              <span className="text-[#A0A0A0] font-bold block uppercase tracking-wider text-[10px]">
                Current Sensor Telemetry
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded bg-[#1A1A1A] border border-[#262626]">
                  <span className="text-[#A0A0A0] block text-[10px]">Voltage</span>
                  <span className="text-[#F5F5F5] font-mono font-bold">{selectedMachine.volt.toFixed(1)} V</span>
                </div>
                <div className="p-2 rounded bg-[#1A1A1A] border border-[#262626]">
                  <span className="text-[#A0A0A0] block text-[10px]">Rotation</span>
                  <span className="text-[#F5F5F5] font-mono font-bold">{selectedMachine.rotate.toFixed(0)} RPM</span>
                </div>
                <div className="p-2 rounded bg-[#1A1A1A] border border-[#262626]">
                  <span className="text-[#A0A0A0] block text-[10px]">Pressure</span>
                  <span className="text-[#F5F5F5] font-mono font-bold">{selectedMachine.pressure.toFixed(1)} psi</span>
                </div>
                <div className={`p-2 rounded border ${selectedMachine.vibration > 45 ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-[#1A1A1A] border-[#262626]'}`}>
                  <span className="text-[#A0A0A0] block text-[10px]">Vibration</span>
                  <span className="font-mono font-bold">{selectedMachine.vibration.toFixed(1)} mm/s</span>
                </div>
              </div>
            </div>

            {/* Operating specs */}
            <div className="text-xs text-[#A0A0A0] space-y-1.5 bg-[#121212] p-3 rounded-xl border border-[#66521A]/50">
              <div className="flex justify-between">
                <span>Operating Lifetime:</span>
                <span className="font-medium text-[#F5F5F5]">{selectedMachine.age_years} Years ({selectedMachine.operating_hours} hrs logged)</span>
              </div>
              <div className="flex justify-between">
                <span>Last Service Date:</span>
                <span className="font-medium text-[#F5F5F5]">{selectedMachine.last_maintenance}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  onSelectMachineForPredict(selectedMachine);
                }}
                className="btn-gold-primary px-4 py-2 rounded-xl text-xs font-bold"
              >
                Launch Predictive Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {isDeleteModalOpen && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/85 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#66521A] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#F5F5F5]">Delete Machine?</h3>
            <p className="text-xs text-[#A0A0A0]">
              Are you sure you want to remove <strong className="text-[#F5F5F5]">{selectedMachine.id} ({selectedMachine.name})</strong>? All telemetry history and maintenance records will be permanently removed.
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
