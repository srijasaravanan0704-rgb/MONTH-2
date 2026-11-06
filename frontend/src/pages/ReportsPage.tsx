import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Clock,
  RefreshCw,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Machine, GeneratedReport } from '../types';
import { fetchReportsHistory, saveGeneratedReport } from '../services/api';

interface ReportsPageProps {
  machines: Machine[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ machines }) => {
  const [reportTitle, setReportTitle] = useState<string>(
    'OptiMach Industrial Equipment Health & Predictive Failure Report'
  );
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>(
    machines.map((m) => m.id)
  );
  const [includeTelemetry, setIncludeTelemetry] = useState<boolean>(true);
  const [includeMlRisk, setIncludeMlRisk] = useState<boolean>(true);
  const [includeRecommendations, setIncludeRecommendations] = useState<boolean>(true);
  const [generatedBy, setGeneratedBy] = useState<string>('Eng. Alex Mercer (Reliability Lead)');

  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportGeneratedCode] = useState<string>('RPT-2026-ALPHA');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchReportsHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMachine = (id: string) => {
    if (selectedMachineIds.includes(id)) {
      setSelectedMachineIds(selectedMachineIds.filter((item) => item !== id));
    } else {
      setSelectedMachineIds([...selectedMachineIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedMachineIds(machines.map((m) => m.id));
  };

  const targetMachines = machines.filter((m) => selectedMachineIds.includes(m.id));

  // Generate PDF with jsPDF
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const todayStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Header Banner
      doc.setFillColor(8, 8, 8); // Deep Black
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(212, 175, 55); // Metallic Gold
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('OptiMach AI', 14, 16);

      doc.setTextColor(245, 245, 245);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Industrial Predictive Maintenance & Machine Health Monitoring Platform', 14, 23);

      doc.setTextColor(160, 160, 160);
      doc.setFontSize(8);
      doc.text(`Academic Project Benchmark • Generated: ${todayStr}`, 14, 29);

      // Report Title
      let y = 46;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(reportTitle, 14, y);

      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Author: ${generatedBy} | Plant: OptiMach Smart Plant Alpha | Horizon: 7 Days Continuous`,
        14,
        y
      );

      // Executive Summary Box
      y += 8;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, y, 182, 22, 2, 2, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE FLEET RELIABILITY SUMMARY:', 18, y + 6);

      const criticalCount = targetMachines.filter((m) => m.status === 'Critical').length;
      const atRiskCount = targetMachines.filter((m) => m.status === 'Warning' || m.status === 'High Risk').length;
      const healthyCount = targetMachines.filter((m) => m.status === 'Healthy').length;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(
        `Analyzed ${targetMachines.length} industrial machines. Status: ${healthyCount} Healthy, ${atRiskCount} At Risk, ${criticalCount} Critical Failure Hazard.`,
        18,
        y + 12
      );
      doc.text(
        'Immediate work order dispatch recommended for equipment exceeding ISO 10816 vibration ceilings.',
        18,
        y + 17
      );

      // Equipment Telemetry & Prediction Table
      y += 28;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('EQUIPMENT TELEMETRY & 7-DAY ML FAILURE PROBABILITY:', 14, y);

      y += 4;
      // Table Header
      doc.setFillColor(15, 23, 42);
      doc.rect(14, y, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Machine ID', 16, y + 5);
      doc.text('Name / Type', 40, y + 5);
      doc.text('Condition', 84, y + 5);
      doc.text('Health', 106, y + 5);
      doc.text('7d Risk', 124, y + 5);
      doc.text('Volt/RPM', 144, y + 5);
      doc.text('Press/Vib', 168, y + 5);

      y += 7;
      targetMachines.forEach((m, idx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        const bg = idx % 2 === 0 ? 255 : 248;
        doc.setFillColor(bg, bg, bg);
        doc.rect(14, y, 182, 7.5, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);

        doc.text(m.id, 16, y + 5);
        doc.text(m.name.length > 22 ? m.name.substring(0, 20) + '..' : m.name, 40, y + 5);

        // Status
        if (m.status === 'Critical') doc.setTextColor(220, 38, 38);
        else if (m.status === 'Warning' || m.status === 'High Risk') doc.setTextColor(212, 175, 55);
        else doc.setTextColor(16, 185, 129);
        doc.text(m.status, 84, y + 5);

        doc.setTextColor(30, 41, 59);
        doc.text(`${m.health_score.toFixed(1)}%`, 106, y + 5);
        doc.text(`${(m.failure_prob * 100).toFixed(1)}%`, 124, y + 5);
        doc.text(`${m.volt.toFixed(0)}V / ${m.rotate.toFixed(0)}`, 144, y + 5);
        doc.text(`${m.pressure.toFixed(0)}psi / ${m.vibration.toFixed(1)}`, 168, y + 5);

        y += 7.5;
      });

      // Maintenance Actions Section
      y += 8;
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('RECOMMENDED ENGINEERING PROTOCOL:', 14, y);

      y += 5;
      const criticalMachine = targetMachines.find((m) => m.status === 'Critical') || targetMachines[0];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `• Critical Asset Alert: Machine ${criticalMachine.id} exhibits severe vibration elevation (>45 mm/s).`,
        16,
        y
      );
      doc.text(
        '• Protocol: Schedule emergency drive coupling and roller bearing replacement within 48 hours.',
        16,
        y + 5
      );
      doc.text(
        '• Calibration: Inspect VFD harmonic filtering and recalibrate fluid line backpressure valves.',
        16,
        y + 10
      );

      // Sign-off signature footer
      y += 24;
      if (y > 260) {
        doc.addPage();
        y = 30;
      }
      doc.setDrawColor(203, 213, 225);
      doc.line(14, y, 90, y);
      doc.line(120, y, 196, y);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Certified Maintenance Engineer Signature', 14, y + 4);
      doc.text('Plant Operations Director Verification', 120, y + 4);

      // Save PDF
      doc.save(`OptiMach_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);

      // Persist to history
      await saveGeneratedReport({
        title: reportTitle,
        machine_ids: selectedMachineIds,
        generated_by: generatedBy,
        summary: `Analyzed ${targetMachines.length} units: ${criticalCount} Critical, ${atRiskCount} Warning.`,
        risk_summary: `${criticalCount} Critical assets requiring urgent maintenance.`,
      });

      loadHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Machine ID',
      'Name',
      'Type',
      'Location',
      'Age (Years)',
      'Status',
      'Health Score (%)',
      '7-Day Failure Probability (%)',
      'Voltage (V)',
      'Rotation (RPM)',
      'Pressure (psi)',
      'Vibration (mm/s)',
      'Last Maintenance',
    ];

    const rows = targetMachines.map((m) => [
      m.id,
      `"${m.name}"`,
      `"${m.type}"`,
      `"${m.location}"`,
      m.age_years,
      m.status,
      m.health_score.toFixed(1),
      (m.failure_prob * 100).toFixed(1),
      m.volt.toFixed(1),
      m.rotate.toFixed(1),
      m.pressure.toFixed(1),
      m.vibration.toFixed(1),
      m.last_maintenance,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OptiMach_Fleet_Telemetry_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#66521A]/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#1A1A1A] border border-[#66521A] text-[#FFD700]">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5]">
              Industrial Report Generation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">
            Produce compliance-ready equipment health audits, failure projections, and maintenance documentation
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-gold-secondary flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            Export CSV
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="btn-gold-primary flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Compiling PDF...
              </>
            ) : (
              <>
                <Printer className="w-3.5 h-3.5" />
                Download Official PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Configurator & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Wizard (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
            Report Parameters
          </h3>

          <div>
            <label className="text-xs text-[#A0A0A0] block mb-1">Document Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-xs text-[#F5F5F5] focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="text-xs text-[#A0A0A0] block mb-1">Author / Sign-off Engineer</label>
            <input
              type="text"
              value={generatedBy}
              onChange={(e) => setGeneratedBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#66521A]/70 text-xs text-[#F5F5F5] focus:border-[#D4AF37]"
            />
          </div>

          {/* Machine Selection checklist */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#A0A0A0]">Target Machines ({selectedMachineIds.length})</label>
              <button
                type="button"
                onClick={selectAll}
                className="text-[10px] text-[#FFD700] hover:underline"
              >
                Select All
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded-xl bg-[#121212] border border-[#66521A]/50 text-xs">
              {machines.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-[#1A1A1A] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedMachineIds.includes(m.id)}
                      onChange={() => toggleMachine(m.id)}
                      className="accent-[#D4AF37]"
                    />
                    <span className="text-[#FFD700] font-mono font-medium">{m.id}</span>
                    <span className="text-[#A0A0A0] truncate max-w-[120px]">{m.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      m.status === 'Critical' ? 'text-rose-400' : 'text-[#A0A0A0]'
                    }`}
                  >
                    {m.status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Section Toggles */}
          <div className="pt-2 border-t border-[#66521A]/50 space-y-2 text-xs">
            <span className="text-[#A0A0A0] font-semibold block">Included Sections:</span>
            <label className="flex items-center gap-2 cursor-pointer text-[#F5F5F5]">
              <input
                type="checkbox"
                checked={includeTelemetry}
                onChange={(e) => setIncludeTelemetry(e.target.checked)}
                className="accent-[#D4AF37]"
              />
              Detailed Sensor Telemetry Table
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[#F5F5F5]">
              <input
                type="checkbox"
                checked={includeMlRisk}
                onChange={(e) => setIncludeMlRisk(e.target.checked)}
                className="accent-[#D4AF37]"
              />
              7-Day ML Failure Probability Gauges
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[#F5F5F5]">
              <input
                type="checkbox"
                checked={includeRecommendations}
                onChange={(e) => setIncludeRecommendations(e.target.checked)}
                className="accent-[#D4AF37]"
              />
              AI Maintenance Recommendations & Priority
            </label>
          </div>
        </div>

        {/* Right: Live Document Visual Preview (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-white text-slate-900 shadow-2xl space-y-6 border border-[#66521A]">
          {/* Header Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 tracking-tight font-mono">
                  Opti<span className="text-[#D4AF37]">Mach</span> AI
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                  PLANT AUDIT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Predictive Maintenance & Equipment Health Monitoring System
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500 mt-2 sm:mt-0">
              <div>Ref: <strong className="font-mono text-slate-700">{reportGeneratedCode}</strong></div>
              <div>Date: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-lg font-bold text-slate-900">{reportTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prepared by: {generatedBy} • Target Horizon: 7 Days Continuous
            </p>
          </div>

          {/* Executive Summary */}
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">
              Executive Summary
            </span>
            <p>
              Audited <strong>{targetMachines.length} machinery units</strong>. Fleet telemetry demonstrates stable operation on 6 units with 2 units exhibiting mechanical wear anomalies. Machine MCH-04 has triggered critical high vibration alarms and requires immediate service dispatch.
            </p>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2">ID</th>
                  <th className="py-2 px-2">Equipment</th>
                  <th className="py-2 px-2">Condition</th>
                  <th className="py-2 px-2">Health</th>
                  <th className="py-2 px-2">7d Risk</th>
                  <th className="py-2 px-2">Vibration</th>
                  <th className="py-2 px-2">Pressure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {targetMachines.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 px-2 font-bold text-[#D4AF37]">{m.id}</td>
                    <td className="py-2 px-2 font-sans text-slate-800">{m.name}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`font-bold ${
                          m.status === 'Critical'
                            ? 'text-rose-600'
                            : m.status === 'Warning' || m.status === 'High Risk'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">{m.health_score.toFixed(1)}%</td>
                    <td className="py-2 px-2 font-bold">{(m.failure_prob * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2">{m.vibration.toFixed(1)} mm/s</td>
                    <td className="py-2 px-2">{m.pressure.toFixed(1)} psi</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
            <div>
              <div className="border-b border-slate-300 pb-6 mb-1 font-mono text-slate-400">
                // Signed Digitally
              </div>
              <span>Reliability Engineering Lead</span>
            </div>
            <div>
              <div className="border-b border-slate-300 pb-6 mb-1 font-mono text-slate-400">
                // Plant Operations Verification
              </div>
              <span>Industrial Plant General Manager</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Generated Reports Table */}
      <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
            Historical Compliance Reports Archive
          </h3>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-[#A0A0A0]">No previous reports recorded in database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#121212] text-[#A0A0A0] uppercase font-mono text-[10px] border-b border-[#66521A]/50">
                <tr>
                  <th className="py-2.5 px-3">Report ID</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Scope</th>
                  <th className="py-2.5 px-3">Author</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#66521A]/30">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-[#121212]/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#FFD700]">{h.report_id}</td>
                    <td className="py-2.5 px-3 text-[#F5F5F5] font-semibold">{h.title}</td>
                    <td className="py-2.5 px-3 text-[#A0A0A0]">{h.machine_ids.length} Machines</td>
                    <td className="py-2.5 px-3 text-[#A0A0A0]">{h.generated_by}</td>
                    <td className="py-2.5 px-3 text-[#A0A0A0] font-mono">
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
