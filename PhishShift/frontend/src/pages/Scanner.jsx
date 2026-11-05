import React, { useState, useEffect } from 'react';
import {
  ScanEye,
  Mail,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Lock,
  DollarSign,
  AlertOctagon,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Scanner() {
  const { addToast } = useToast();

  const [channel, setChannel] = useState('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedModel, setSelectedModel] = useState('linear_svm');
  const [storeBody, setStoreBody] = useState(false);

  const [models, setModels] = useState([]);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Load models and samples
    api.getModels().then(setModels).catch(console.error);
    api.getEducationalSamples().then(setSamples).catch(console.error);
  }, []);

  const handleSelectSample = (sample) => {
    setChannel(sample.channel);
    setSubject(sample.subject || '');
    setBody(sample.body);
    setResult(null);
    addToast(`Loaded preset sample: "${sample.name}"`, 'info');
  };

  const handleReset = () => {
    setSubject('');
    setBody('');
    setResult(null);
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (body.trim().length < 3) {
      addToast('Message body must be at least 3 characters.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await api.scanMessage({
        channel,
        subject: channel === 'email' ? subject : undefined,
        body,
        model_name: selectedModel,
        store_body: storeBody
      });
      setResult(res);
      addToast('Message risk evaluation complete.', 'success');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error executing scan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Intelligent Message Risk Scanner
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Evaluate email and SMS content using calibrated ML classifiers, word-level feature attributions, and transparent rule-based risk heuristics.
        </p>
      </div>

      {/* SAMPLE SELECTOR PRESETS */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <span>Quick Educational Presets (Click to autofill):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSample(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                s.category === 'phishing'
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.category === 'phishing' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span>{s.name}</span>
              <span className="text-[10px] opacity-75 uppercase">({s.channel})</span>
            </button>
          ))}
        </div>
      </div>

      {/* INPUT SCANNER FORM & RESULTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SCANNER FORM (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleScan} className="space-y-4">
            {/* Channel Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Communication Channel
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    channel === 'email'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email Message
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    channel === 'sms'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  SMS / Smishing
                </button>
              </div>
            </div>

            {/* Subject (Email only) */}
            {channel === 'email' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Line <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Critical: Your Microsoft 365 Password Expires in 24 Hours"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Message Body <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {body.length} / 10,000 characters
                </span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={channel === 'email' ? 7 : 5}
                required
                maxLength={10000}
                placeholder={
                  channel === 'email'
                    ? 'Paste inbound email text here for risk assessment...'
                    : 'Paste SMS text alert here (e.g., USPS: Your parcel is on hold...)'
                }
                className="w-full px-3.5 py-2.5 text-xs font-sans rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white resize-y"
              />
            </div>

            {/* Model Selector & Privacy Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classifier Model Selection
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.is_default ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Privacy Opt-in */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="storeBody"
                  checked={storeBody}
                  onChange={(e) => setStoreBody(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                />
                <label htmlFor="storeBody" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  Store full message body in history <span className="text-[10px] text-slate-400">(Default: previews only for privacy)</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="submit"
                disabled={loading || body.trim().length < 3}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-950/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating Risk...</span>
                  </>
                ) : (
                  <>
                    <ScanEye className="w-4 h-4" />
                    <span>Analyze Message</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
                title="Clear inputs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* RESULTS PANEL (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!result ? (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center text-slate-400 h-full min-h-[380px]">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <ScanEye className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1">
                Awaiting Message Submission
              </h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Select a preset educational sample on top or paste an email/SMS on the left to initiate model inference and feature attribution.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* PRIMARY RISK BANNER */}
              <div
                className={`p-5 rounded-2xl border flex items-start justify-between gap-4 ${
                  result.risk_category === 'Higher Risk'
                    ? 'bg-rose-50/80 border-rose-300 text-rose-950 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-100'
                    : result.risk_category === 'Needs Review'
                    ? 'bg-amber-50/80 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-100'
                    : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-100'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      result.risk_category === 'Higher Risk'
                        ? 'bg-rose-600 text-white'
                        : result.risk_category === 'Needs Review'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {result.risk_category === 'Higher Risk' && <ShieldAlert className="w-6 h-6" />}
                    {result.risk_category === 'Needs Review' && <AlertTriangle className="w-6 h-6" />}
                    {result.risk_category === 'Lower Risk' && <ShieldCheck className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider font-extrabold opacity-80">
                        Assessment Outcome
                      </span>
                      {result.abstained && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                          Model Abstained
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">{result.risk_category}</h2>
                    <p className="text-xs opacity-90 mt-0.5">
                      {result.risk_category === 'Higher Risk' &&
                        'High probability of malicious intent, credential harvesting, or coercion.'}
                      {result.risk_category === 'Needs Review' &&
                        'Moderate uncertainty or subtle clues requiring human inspection.'}
                      {result.risk_category === 'Lower Risk' &&
                        'Consistent with standard legitimate notifications and communications.'}
                    </p>
                  </div>
                </div>

                {/* Risk Score Pill */}
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Risk Probability
                  </div>
                  <div className="text-2xl font-extrabold font-mono tracking-tight">
                    {(result.risk_score * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Certainty: {(result.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* ABSTENTION WARNING IF APPLICABLE */}
              {result.abstained && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Abstention Notice:</strong> {result.abstain_reason}
                  </span>
                </div>
              )}

              {/* EXPLAINABILITY: FEATURE ATTRIBUTIONS & RULE BREAKDOWN */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    Model Feature Attributions (Word Impact)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Model: {result.model_used.replace('_', ' ')}
                  </span>
                </div>

                {/* Feature weights bars */}
                {result.feature_attributions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No active high-weight vocabulary tokens found in this input.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {result.feature_attributions.map((feat, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                            "{feat.feature}"
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              feat.direction === 'increases_risk'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {feat.direction === 'increases_risk' ? '+ Risk' : '- Risk'} ({feat.weight.toFixed(3)})
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              feat.direction === 'increases_risk' ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(15, feat.weight * 50))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* RULE-BASED INDICATORS BREAKDOWN */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    Detected Heuristic Clues
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Urgency */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                        Urgency Pressure:
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {result.rule_indicators.urgency_indicators?.length > 0
                          ? result.rule_indicators.urgency_indicators.join(', ')
                          : 'None detected'}
                      </div>
                    </div>

                    {/* Credentials */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                        <Lock className="w-3.5 h-3.5 text-cyan-500" />
                        Credential Triggers:
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {result.rule_indicators.credential_indicators?.length > 0
                          ? result.rule_indicators.credential_indicators.join(', ')
                          : 'None detected'}
                      </div>
                    </div>

                    {/* Financial */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                        Financial / Wire Clues:
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {result.rule_indicators.financial_indicators?.length > 0
                          ? result.rule_indicators.financial_indicators.join(', ')
                          : 'None detected'}
                      </div>
                    </div>

                    {/* Suspicious URL Tokens */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                        <ExternalLink className="w-3.5 h-3.5 text-purple-500" />
                        Inert Defanged URLs:
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate">
                        {result.inert_urls.length > 0
                          ? result.inert_urls.join(', ')
                          : 'No URLs detected'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SAFETY RECOMMENDATIONS */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Recommended Safety Actions
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-cyan-500 font-bold shrink-0">&bull;</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* MANDATORY DISCLAIMER */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 text-[11px] leading-relaxed flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{result.safety_disclaimer}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
