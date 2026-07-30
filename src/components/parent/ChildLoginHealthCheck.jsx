import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Activity, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function ChildLoginHealthCheck({ open, onOpenChange }) {
  const [query, setQuery] = useState("corry_1204");
  const [testPin, setTestPin] = useState("1234");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleRunDiagnostic = async (e) => {
    e.preventDefault();
    setLoading(true);
    setReport(null);

    try {
      const res = await base44.functions.invoke("debugChildAuth", {
        query: query.trim(),
        test_pin: testPin.trim()
      });

      setReport(res.data);
    } catch (err) {
      setReport({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" /> Diagnostik Log Masuk Murid
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Uji status pangkalan data dan pengesahan PIN untuk mana-mana akaun murid secara nyata.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRunDiagnostic} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Username / ID</label>
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="corry_1204"
                className="h-10 text-xs font-bold rounded-xl border-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">PIN Ujian</label>
              <Input
                type="password"
                maxLength={4}
                value={testPin}
                onChange={(e) => setTestPin(e.target.value)}
                placeholder="1234"
                className="h-10 text-xs font-bold rounded-xl border-slate-200 text-center tracking-widest"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-10 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Search className="w-4 h-4 mr-1.5" />}
            Jalankan Ujian Diagnostik
          </Button>
        </form>

        {report && (
          <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
            {report.found ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Akaun Ditemui!
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-emerald-900 font-medium pt-1">
                  <span>Nama: <strong>{report.user.nickname}</strong></span>
                  <span>Username: <strong>{report.user.username}</strong></span>
                  <span>ID Murid: <strong>{report.user.student_id}</strong></span>
                  <span>Peranan: <strong>{report.user.app_role}</strong></span>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center gap-2 text-rose-800 font-bold text-xs">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                {report.error || "Akaun tidak ditemui di dalam pangkalan data."}
              </div>
            )}

            {report.pin_verification && (
              <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                report.pin_verification.is_valid ? "bg-indigo-50 border-indigo-200 text-indigo-900" : "bg-amber-50 border-amber-200 text-amber-900"
              }`}>
                <span>Padanan PIN ({report.pin_verification.test_pin}):</span>
                <span className="uppercase tracking-wide px-2 py-0.5 rounded bg-white font-mono shadow-xs">
                  {report.pin_verification.is_valid ? "✅ SAH" : "❌ SALAH"}
                </span>
              </div>
            )}

            {/* Diagnostic Log Output */}
            {report.logs && (
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-2xl font-mono text-[10px] space-y-1 max-h-40 overflow-y-auto">
                <p className="text-slate-400 font-bold border-b border-slate-800 pb-1">-- LOG DIAGNOSTIK PELAYAN --</p>
                {report.logs.map((log, idx) => (
                  <p key={idx}>{log}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
