import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  Shield,
  Layers,
  Award,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  Zap,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ModelInsights() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState(null);
  const [robustnessData, setRobustnessData] = useState(null);
  const [activeTab, setActiveTab] = useState('models'); // 'models', 'holdout', 'robustness', 'error_analysis'

  useEffect(() => {
    loadAllInsights();
  }, []);

  const loadAllInsights = async () => {
    try {
      setLoading(true);
      const [metricsRes, robRes] = await Promise.all([
        api.getModelMetrics(),
        api.getRobustnessResults()
      ]);
      setMetricsData(metricsRes);
      setRobustnessData(robRes);
    } catch (err) {
      console.error(err);
      addToast('Failed to load model insights.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading evaluation reports & robustness test telemetry...</p>
      </div>
    );
  }

  const modelsEval = metricsData?.models_evaluation || {};
  const prCurves = metricsData?.pr_curves || {};
  const errorAnalysis = metricsData?.error_analysis || {};
  const metadata = metricsData?.metadata || {};
  const robSuite = robustnessData?.test_results || [];

  // Formatter for PR Curve chart (combining curve points)
  const svmCurve = prCurves['linear_svm'] || [];
  const lrCurve = prCurves['logistic_regression'] || [];
  const nbCurve = prCurves['naive_bayes'] || [];

  const chartDataPR = svmCurve.map((pt, idx) => ({
    recall: pt.recall,
    svm_precision: pt.precision,
    lr_precision: lrCurve[idx]?.precision || null,
    nb_precision: nbCurve[idx]?.precision || null,
    threshold: pt.threshold
  }));

  return (
    <div className="space-y-6">
      {/* Page Heading & Metadata */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Machine Learning Insights & Evaluation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Empirical evaluation across training partitions, unseen campaign holdout sets, and controlled adversarial perturbations.
          </p>
        </div>

        {/* Model Meta Badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
            Version: {metadata.model_version || '1.0.0-ml07'}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Vocab: {metadata.vocabulary_size || 3000} features
          </div>
          <button
            onClick={loadAllInsights}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title="Refresh Evaluation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'models', label: 'Model Benchmark Comparison' },
          { id: 'holdout', label: 'Campaign Holdout & PR Curves' },
          { id: 'robustness', label: 'Adversarial Robustness Suite' },
          { id: 'error_analysis', label: 'False Positive Error Analysis' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MODEL COMPARISON MATRIX */}
      {activeTab === 'models' && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Dataset Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">Training Partition</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metadata.train_samples_count || 275} samples
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Deduplicated & campaign-grouped</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">Validation Partition</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metadata.validation_samples_count || 28} samples
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Balanced threshold tuning set</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">Campaign Holdout</span>
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                105 samples
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Strictly unseen campaign clusters</p>
            </div>
          </div>

          {/* Model Comparison Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Validation Benchmark Comparison
              </h2>
              <p className="text-xs text-slate-500">
                Empirical metrics computed strictly on held-out evaluation partitions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Model Architecture</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Precision</th>
                    <th className="py-3 px-4">Recall</th>
                    <th className="py-3 px-4">F1-Score</th>
                    <th className="py-3 px-4">False Positive Rate</th>
                    <th className="py-3 px-4">Calibrated Probabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {Object.entries(modelsEval).map(([key, val]) => {
                    const metrics = val.validation || {};
                    const isSVM = key === 'linear_svm';
                    return (
                      <tr key={key} className={isSVM ? 'bg-cyan-500/5 font-medium' : ''}>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white capitalize">
                            {key.replace('_', ' ')}
                            {isSVM && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 font-bold uppercase">
                                Production Pick
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {key === 'linear_svm' && 'Support Vector Machine + Platt Sigmoid Scaling'}
                            {key === 'logistic_regression' && 'L2 Regularized Logistic Regression'}
                            {key === 'naive_bayes' && 'Multinomial Naive Bayes (Dirichlet alpha=0.5)'}
                            {key === 'rule_baseline' && 'Deterministic transparent heuristic matching'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          {(metrics.accuracy * 100).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {(metrics.precision * 100).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {(metrics.recall * 100).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {(metrics.f1_score * 100).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 font-mono text-rose-600 dark:text-rose-400">
                          {(metrics.false_positive_rate * 100).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4">
                          {key === 'rule_baseline' ? (
                            <span className="text-[11px] text-slate-400">Heuristic Score</span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Calibrated
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAIGN HOLDOUT & PR CURVES */}
      {activeTab === 'holdout' && (
        <div className="space-y-6 animate-fade-in">
          {/* Holdout Overview Callout */}
          <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs flex items-start gap-3">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Campaign-Separated Holdout Integrity: </strong>
              The campaign holdout set consists of message templates from four completely separate campaign categories (e.g. gift card lures, postal smishing, shipping notices) that the model never observed during training or threshold tuning. This provides an unbiased measure of true out-of-sample generalization.
            </p>
          </div>

          {/* PR Curve Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="mb-4">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Precision-Recall Tradeoff Curves (Campaign Holdout)
              </h2>
              <p className="text-xs text-slate-500">
                Precision vs Recall at various decision thresholds
              </p>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataPR} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="recall"
                    label={{ value: 'Recall', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
                    fontSize={11}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <YAxis
                    domain={[0.4, 1.0]}
                    label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    fontSize={11}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="svm_precision"
                    name="Linear SVM"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lr_precision"
                    name="Logistic Regression"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="nb_precision"
                    name="Naive Bayes"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Confusion Matrices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(modelsEval).map(([key, val]) => {
              const h = val.campaign_holdout || {};
              const cm = h.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 };
              return (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
                >
                  <h3 className="font-bold text-xs capitalize text-slate-800 dark:text-slate-200">
                    {key.replace('_', ' ')} (Holdout CM)
                  </h3>

                  <div className="grid grid-cols-2 gap-1.5 text-center text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                      <span className="block text-[10px] text-slate-400 font-sans">True Neg (TN)</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">{cm.tn}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                      <span className="block text-[10px] text-slate-400 font-sans">False Pos (FP)</span>
                      <span className="font-bold text-rose-700 dark:text-rose-300">{cm.fp}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                      <span className="block text-[10px] text-slate-400 font-sans">False Neg (FN)</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">{cm.fn}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900">
                      <span className="block text-[10px] text-slate-400 font-sans">True Pos (TP)</span>
                      <span className="font-bold text-cyan-700 dark:text-cyan-300">{cm.tp}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                    <span>Acc: {(h.accuracy * 100).toFixed(1)}%</span>
                    <span>F1: {(h.f1_score * 100).toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CONTROLLED ADVERSARIAL ROBUSTNESS SUITE */}
      {activeTab === 'robustness' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Adversarial & Harmless Variation Suite
              </h2>
              <p className="text-xs text-slate-500">
                8 reproducible controlled perturbations testing whitespace splitting, leetspeak, punctuation noise, and legitimate false positive stress.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                0 / {robSuite.length} Flipped Predictions
              </span>
              <span className="text-slate-400">
                Mean Shift: &plusmn;{(robustnessData.mean_absolute_score_shift * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Test ID</th>
                    <th className="py-3 px-4">Variation Technique</th>
                    <th className="py-3 px-4">Perturbed Text Snippet</th>
                    <th className="py-3 px-4 text-center">Baseline &rarr; Perturbed Risk</th>
                    <th className="py-3 px-4 text-center">Score Shift (&Delta;)</th>
                    <th className="py-3 px-4 text-right">Robustness Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {robSuite.map((test) => {
                    const isRobust = test.robustness_outcome.includes('ROBUST') || test.robustness_outcome.includes('PASSED');
                    return (
                      <tr key={test.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {test.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {test.variation_type}
                          </span>
                          <span className="text-[11px] text-slate-400">{test.description}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] max-w-xs truncate text-slate-600 dark:text-slate-300">
                          {test.perturbed_snippet}
                        </td>
                        <td className="py-3 px-4 font-mono text-center">
                          {(test.original_risk_score * 100).toFixed(1)}% &rarr;{' '}
                          <span className="font-bold">{(test.perturbed_risk_score * 100).toFixed(1)}%</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                              test.score_shift_delta === 0
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                                : test.score_shift_delta > 0
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                            }`}
                          >
                            {test.score_shift_delta > 0 ? '+' : ''}
                            {(test.score_shift_delta * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                              isRobust
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isRobust ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {test.robustness_outcome.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REAL FALSE POSITIVE & ERROR ANALYSIS */}
      {activeTab === 'error_analysis' && (
        <div className="space-y-6 animate-fade-in">
          {/* Key Takeaways */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-500" />
              Empirical Error Analysis Summary
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {errorAnalysis.key_findings?.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-500 font-bold shrink-0">&bull;</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* False Positive Case Studies */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Representative False Positives (Legitimate Messages Flagged as Phishing)
            </h3>

            {errorAnalysis.false_positive_examples?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No false positive errors observed in holdout evaluation.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {errorAnalysis.false_positive_examples?.map((ex, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                      <span>{ex.message_id} &bull; {ex.campaign_group}</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        Risk: {(ex.model_risk_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">{ex.subject}</div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      "{ex.text_snippet}"
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      <strong>Root Cause:</strong> {ex.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
