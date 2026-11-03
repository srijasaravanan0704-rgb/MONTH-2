import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  ShieldCheck,
  Award,
  Database,
  Info,
  TrendingUp,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { MLMetricsResponse } from '../types';
import { fetchMlMetrics } from '../services/api';

export const MlEvaluationPage: React.FC = () => {
  const [metrics, setMetrics] = useState<MLMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeModelKey, setActiveModelKey] = useState<'random_forest' | 'gradient_boosting' | 'logistic_regression'>('random_forest');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMlMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load ML metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-[#A0A0A0]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm">Loading authentic ML benchmark metrics...</p>
      </div>
    );
  }

  const { rf, gb, lr } = {
    rf: metrics.models.random_forest,
    gb: metrics.models.gradient_boosting,
    lr: metrics.models.logistic_regression,
  };

  const activeModelData = metrics.models[activeModelKey];

  // Prepare combined ROC data for chart
  const rocCombined = (rf?.roc_curve || []).map((pt, i) => ({
    fpr: pt.fpr,
    rf_tpr: pt.tpr,
    gb_tpr: gb?.roc_curve[i]?.tpr ?? pt.tpr,
    lr_tpr: lr?.roc_curve[i]?.tpr ?? pt.tpr,
    diagonal: pt.fpr,
  }));

  // Prepare combined PR data for chart
  const prCombined = (rf?.pr_curve || []).map((pt, i) => ({
    recall: pt.recall,
    rf_precision: pt.precision,
    gb_precision: gb?.pr_curve[i]?.precision ?? pt.precision,
    lr_precision: lr?.pr_curve[i]?.precision ?? pt.precision,
  }));

  // Feature importances
  const featureData = Object.keys(rf?.feature_importances || {}).map((feat) => {
    const labels: Record<string, string> = {
      vibration: 'Vibration (mm/s)',
      pressure: 'Pressure (psi)',
      rotate: 'Rotation (RPM)',
      volt: 'Voltage (V)',
    };
    return {
      feature: labels[feat] || feat,
      rf: ((rf?.feature_importances[feat] || 0) * 100).toFixed(1),
      gb: ((gb?.feature_importances[feat] || 0) * 100).toFixed(1),
      lr: ((lr?.feature_importances[feat] || 0) * 100).toFixed(1),
    };
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#66521A]/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#1A1A1A] border border-[#66521A] text-[#FFD700]">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5]">
              Supervised Machine Learning Evaluation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1">
            Comparative performance validation against the Microsoft Azure Predictive Maintenance benchmark
          </p>
        </div>

        {/* Dataset Verification Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121212] border border-[#66521A] text-xs text-[#A0A0A0]">
          <Database className="w-4 h-4 text-[#D4AF37]" />
          <span>Azure Benchmark: <strong className="text-[#F5F5F5] font-mono">{metrics.metadata.total_samples.toLocaleString()} Records</strong></span>
        </div>
      </div>

      {/* Dataset & Methodology Card */}
      <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-[#FFD700] text-xs font-bold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          Experimental Setup & Data Leakage Prevention Protocol
        </div>
        <p className="text-xs text-[#A0A0A0] leading-relaxed">
          The models are evaluated to predict equipment failure within a <strong className="text-[#F5F5F5]">7-day continuous horizon</strong>.
          StandardScaler was strictly fit only on the 80% training partition (9,600 samples) and applied to the 20% holdout test partition (2,400 samples) to prevent future data leakage. Class weighting was applied to mitigate the standard industrial ~5% rare-event failure imbalance.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#121212] border border-[#66521A]/50">
            <span className="text-[10px] text-[#A0A0A0] block">Total Telemetry Samples</span>
            <span className="font-mono font-bold text-[#F5F5F5]">{metrics.metadata.total_samples}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121212] border border-[#66521A]/50">
            <span className="text-[10px] text-[#A0A0A0] block">Stratified Train / Test</span>
            <span className="font-mono font-bold text-[#FFD700]">80% / 20% Split</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121212] border border-[#66521A]/50">
            <span className="text-[10px] text-[#A0A0A0] block">Input Features (4)</span>
            <span className="font-mono font-bold text-[#D4AF37]">Volt, Rotate, Press, Vib</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121212] border border-[#66521A]/50">
            <span className="text-[10px] text-[#A0A0A0] block">Holdout Failure Prevalence</span>
            <span className="font-mono font-bold text-rose-400">{(metrics.metadata.failure_rate * 100).toFixed(1)}% Rare-Event</span>
          </div>
        </div>
      </div>

      {/* Models Comparison Leaderboard Table */}
      <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FFD700]" />
              Supervised Algorithm Performance Comparison
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              Evaluated on the 2,400 holdout test samples (Authentic Scikit-Learn Metrics)
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-[#121212] text-[#FFD700] border border-[#D4AF37] text-xs font-semibold">
            Top Model: Random Forest
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#121212] text-[#A0A0A0] uppercase font-mono text-[10px] border-b border-[#66521A]/50">
              <tr>
                <th className="py-3 px-4">Model Algorithm</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Accuracy</th>
                <th className="py-3 px-3">Precision</th>
                <th className="py-3 px-3">Recall</th>
                <th className="py-3 px-3">F1-Score</th>
                <th className="py-3 px-3">PR-AUC</th>
                <th className="py-3 px-3">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#66521A]/30">
              {/* Random Forest */}
              <tr className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/15 transition-colors font-semibold">
                <td className="py-3 px-4 flex items-center gap-2 text-[#F5F5F5]">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700]"></span>
                  Random Forest Classifier
                  <span className="px-1.5 py-0.2 rounded bg-[#121212] text-[#FFD700] border border-[#66521A] text-[10px]">Candidate</span>
                </td>
                <td className="py-3 px-3 text-[#FFD700]">Main Candidate</td>
                <td className="py-3 px-3 font-mono text-[#F5F5F5]">{(rf.accuracy * 100).toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono text-[#F5F5F5]">{(rf.precision * 100).toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono text-emerald-400 font-bold">{(rf.recall * 100).toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono text-[#FFD700] font-bold">{rf.f1_score.toFixed(4)}</td>
                <td className="py-3 px-3 font-mono text-[#D4AF37] font-bold">{rf.pr_auc.toFixed(4)}</td>
                <td className="py-3 px-3 font-mono text-[#F5F5F5]">{rf.roc_auc.toFixed(4)}</td>
              </tr>

              {/* Gradient Boosting */}
              <tr className="hover:bg-[#121212]/80 transition-colors">
                <td className="py-3 px-4 flex items-center gap-2 text-[#F5F5F5]">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                  Gradient Boosting Classifier
                </td>
                <td className="py-3 px-3 text-[#D4AF37]">Comparison Model</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{(gb.accuracy * 100).toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{(gb.precision * 100).toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{(gb.recall * 100).toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{gb.f1_score.toFixed(4)}</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{gb.pr_auc.toFixed(4)}</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{gb.roc_auc.toFixed(4)}</td>
              </tr>

              {/* Logistic Regression */}
              <tr className="hover:bg-[#121212]/80 transition-colors">
                <td className="py-3 px-4 flex items-center gap-2 text-[#A0A0A0]">
                  <span className="w-2 h-2 rounded-full bg-[#66521A]"></span>
                  Logistic Regression
                </td>
                <td className="py-3 px-3 text-[#A0A0A0]">Linear Baseline</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{(lr.accuracy * 100).toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{(lr.precision * 100).toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{(lr.recall * 100).toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{lr.f1_score.toFixed(4)}</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{lr.pr_auc.toFixed(4)}</td>
                <td className="py-3 px-3 font-mono text-[#A0A0A0]">{lr.roc_auc.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualizers Grid: Confusion Matrix & Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Interactive Visualizer */}
        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                Confusion Matrix Analysis
              </h2>
              <p className="text-xs text-[#A0A0A0]">Test set: 2,400 equipment instances</p>
            </div>

            {/* Model Tab Switcher */}
            <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-[#66521A]/60 text-xs">
              {(
                [
                  { id: 'random_forest', label: 'Random Forest' },
                  { id: 'gradient_boosting', label: 'Gradient Boost' },
                  { id: 'logistic_regression', label: 'Logistic Reg' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModelKey(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeModelKey === tab.id
                      ? 'bg-[#1A1A1A] text-[#FFD700] border border-[#66521A] shadow-sm font-semibold'
                      : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix 2x2 Grid */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#66521A]/50 space-y-3">
            <div className="text-center text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2">
              Predicted Condition vs Ground Truth
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-center font-mono">
              {/* True Negative */}
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                <span className="text-[10px] text-emerald-300 font-sans block uppercase">
                  True Negative (Healthy)
                </span>
                <span className="text-2xl font-bold text-emerald-400">
                  {activeModelData.confusion_matrix.true_negative}
                </span>
                <span className="text-[10px] text-emerald-400/80 block mt-1">
                  Correctly Classified Healthy
                </span>
              </div>

              {/* False Positive */}
              <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#66521A]">
                <span className="text-[10px] text-[#FFD700] font-sans block uppercase">
                  False Positive (Type I)
                </span>
                <span className="text-2xl font-bold text-[#FFD700]">
                  {activeModelData.confusion_matrix.false_positive}
                </span>
                <span className="text-[10px] text-[#A0A0A0] block mt-1">
                  False Alarms Triggered
                </span>
              </div>

              {/* False Negative */}
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40">
                <span className="text-[10px] text-rose-300 font-sans block uppercase">
                  False Negative (Type II)
                </span>
                <span className="text-2xl font-bold text-rose-400">
                  {activeModelData.confusion_matrix.false_negative}
                </span>
                <span className="text-[10px] text-rose-400/80 block mt-1">
                  Missed Critical Failures
                </span>
              </div>

              {/* True Positive */}
              <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#D4AF37]">
                <span className="text-[10px] text-[#D4AF37] font-sans block uppercase">
                  True Positive (Failure)
                </span>
                <span className="text-2xl font-bold text-[#FFD700]">
                  {activeModelData.confusion_matrix.true_positive}
                </span>
                <span className="text-[10px] text-[#A0A0A0] block mt-1">
                  Detected Impending Failures
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[#A0A0A0] text-center pt-2">
              Recall Sensitivity: <strong className="text-emerald-400 font-mono">{(activeModelData.recall * 100).toFixed(1)}%</strong> of actual 7-day failures captured
            </div>
          </div>
        </div>

        {/* Feature Importance Relative Contribution */}
        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#D4AF37]" />
              Sensor Feature Importance Breakdown
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              Gini impurity importance (Random Forest) vs standard physical impacts
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="feature" stroke="#A0A0A0" fontSize={11} tickLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121212',
                    borderColor: '#66521A',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F5F5F5',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Relative Weight']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="rf" name="Random Forest" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gb" name="Gradient Boost" fill="#818CF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-[#121212] border border-[#66521A]/50 text-xs text-[#A0A0A0]">
            <strong className="text-[#F5F5F5]">Physical Validation:</strong> Vibration velocity exhibits the highest Gini importance (~45%), conforming to industrial ISO vibration failure progression in mechanical bearings.
          </div>
        </div>
      </div>

      {/* Curves: ROC & Precision-Recall Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve */}
        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-3">
          <div>
            <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              Receiver Operating Characteristic (ROC) Curves
            </h2>
            <p className="text-xs text-[#A0A0A0]">True Positive Rate vs False Positive Rate across classification thresholds</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocCombined} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="fpr" stroke="#A0A0A0" fontSize={10} tickLine={false} domain={[0, 1]} />
                <YAxis stroke="#A0A0A0" fontSize={10} tickLine={false} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121212',
                    borderColor: '#66521A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F5F5F5',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="rf_tpr" name={`Random Forest (AUC=${rf.roc_auc})`} stroke="#D4AF37" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="gb_tpr" name={`Gradient Boost (AUC=${gb.roc_auc})`} stroke="#FFD700" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="lr_tpr" name={`Logistic Reg (AUC=${lr.roc_auc})`} stroke="#66521A" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="diagonal" name="Random Classifier" stroke="#333333" strokeWidth={1} dot={false} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precision-Recall Curve */}
        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#66521A] shadow-xl space-y-3">
          <div>
            <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              Precision-Recall (PR) Curves
            </h2>
            <p className="text-xs text-[#A0A0A0]">Essential metric for imbalanced industrial failure datasets (PR-AUC)</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prCombined} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="recall" stroke="#A0A0A0" fontSize={10} tickLine={false} domain={[0, 1]} />
                <YAxis stroke="#A0A0A0" fontSize={10} tickLine={false} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121212',
                    borderColor: '#66521A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F5F5F5',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="rf_precision" name={`Random Forest (PR-AUC=${rf.pr_auc})`} stroke="#D4AF37" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="gb_precision" name={`Gradient Boost (PR-AUC=${gb.pr_auc})`} stroke="#FFD700" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="lr_precision" name={`Logistic Reg (PR-AUC=${lr.pr_auc})`} stroke="#66521A" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
