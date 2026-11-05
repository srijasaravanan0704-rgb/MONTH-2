import React, { useState, useEffect } from "react";
import { X, Search, Filter, Database, CheckCircle2, ShieldAlert, ShieldCheck, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { getSampleDataset } from "../services/api";

export default function SampleLibraryModal({ isOpen, onClose, onSelectSample }) {
  const [samples, setSamples] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalSamples, setTotalSamples] = useState(500);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchSamples = async (cat = selectedCategory, search = searchTerm, pageNum = 0) => {
    setLoading(true);
    try {
      const data = await getSampleDataset({
        category: cat === "all" ? "" : cat,
        search,
        limit: pageSize,
        offset: pageNum * pageSize,
      });
      setSamples(data.samples || []);
      setTotalMatches(data.total_matches || 0);
      setTotalSamples(data.total_samples || 500);
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.log("Error loading sample dataset:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSamples(selectedCategory, searchTerm, page);
    }
  }, [isOpen, selectedCategory, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchSamples(selectedCategory, searchTerm, 0);
  };

  const handleSelect = (sample) => {
    onSelectSample({
      sender: sample.sender || "",
      subject: sample.subject || "",
      body: sample.body || "",
    });
    onClose();
  };

  if (!isOpen) return null;

  const totalPages = Math.ceil(totalMatches / pageSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0b1026] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">500 Sample Email Dataset Explorer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  500 Verified Emails
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Browse, search, and click any sample email to immediately load and analyze it.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Categories */}
        <div className="p-4 border-b border-slate-800/80 space-y-3 bg-[#080d20]">
          
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search across 500 emails by sender, brand (PayPal, Amazon, FedEx), subject, or keyword..."
                className="input-saas pl-9 py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => { setSelectedCategory("all"); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
              }`}
            >
              All (500)
            </button>
            {categories.map((cat, idx) => {
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={idx}
                  onClick={() => { setSelectedCategory(cat); setPage(0); }}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md font-bold"
                      : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Email Cards List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-indigo-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Loading sample emails...</span>
            </div>
          ) : samples.length > 0 ? (
            samples.map((item, index) => {
              const isSpam = item.ground_truth?.toLowerCase() === "spam";
              return (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        isSpam 
                          ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {isSpam ? "SPAM / PHISHING" : "SAFE / HAM"}
                      </span>

                      {item.category && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
                        {item.sender}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {item.subject}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-mono">
                      {item.body}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelect(item)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-500/40 shrink-0 flex items-center justify-center gap-1.5 transition-all shadow-md group-hover:scale-105"
                  >
                    <span>Load & Analyze</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No sample emails found matching your filter or search.
            </div>
          )}
        </div>

        {/* Modal Footer & Pagination */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{samples.length}</span> of{" "}
            <span className="font-bold text-white">{totalMatches}</span> matching emails (Total 500 Dataset)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors text-xs font-semibold"
            >
              Previous
            </button>
            <span className="text-xs font-mono text-slate-300">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

