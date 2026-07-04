import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IdCard, Copy, RefreshCw, QrCode, Check, Sparkles, KeyRound } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { QRCodeSVG } from "qrcode.react";

export default function StudentIdSection({ user }) {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState(null);
  const [linkCode, setLinkCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      // Dapatkan atau Jana ID Pelajar
      if (user.student_id) {
        setStudentId(user.student_id);
      } else {
        const result = await base44.functions.invoke('generateStudentId', {});
        setStudentId(result.student_id);
      }

      // Dapatkan Kod Pautan aktif
      const codes = await base44.asServiceRole.entities.ParentLinkCode.filter({
        child_id: user.id,
        is_active: true
      });

      if (codes.length > 0) {
        const now = new Date();
        const expiresAt = new Date(codes[0].expires_at);
        if (now < expiresAt) {
          setLinkCode({
            code: codes[0].code,
            expires_at: codes[0].expires_at
          });
        }
      }
    } catch (err) {
      console.error("Gagal memuatkan ID Pelajar / Kod Pautan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLinkCode = async () => {
    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateParentLinkCode', {});
      setLinkCode({
        code: result.code,
        expires_at: result.expires_at
      });
      toast({
        title: "Kod Rahsia Dijana! ✨",
        description: "Berikan kod ini kepada ibu bapa anda. Ia sah selama 24 jam.",
      });
    } catch (err) {
      toast({
        title: "Gagal Menjana Kod",
        description: err.message || "Sila cuba lagi sebentar lagi.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
      toast({
        title: "Disalin! 📋",
        description: `${type === 'id' ? 'ID Pelajar' : 'Kod Pautan'} berjaya disalin.`,
      });
    } catch (err) {
      toast({
        title: "Gagal Menyalin",
        description: "Sila salin secara manual.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
        <Sparkles className="w-8 h-8 text-cyan-500 animate-spin mb-3" style={{ animationDuration: '3s' }} />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Menyediakan Kad Pengenalan...</p>
      </div>
    );
  }

  const isExpired = linkCode && new Date() > new Date(linkCode.expires_at);

  return (
    <div className="bg-white rounded-[2rem] p-6 sm:p-8 border-4 border-slate-100 shadow-xl relative overflow-hidden">
      {/* Hiasan Latar Belakang */}
      <IdCard className="absolute -top-6 -right-6 w-32 h-32 text-cyan-50/50 rotate-12 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyan-100 rounded-2xl">
            <IdCard className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Maklumat Pengembara 🪪</h2>
            <p className="text-sm text-slate-500">ID rasmi dan kod rahsia anda di StudyQuest.</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* BAHAGIAN 1: ID PELAJAR */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">ID Pelajar (Tetap)</label>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[10px]">
                Kekal
              </Badge>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white rounded-xl px-4 py-3 font-mono text-lg font-bold text-slate-800 text-center border-2 border-slate-200 shadow-sm flex items-center justify-center">
                {studentId || "Belum Dijana"}
              </div>
              {studentId && (
                <Button
                  className={`h-auto w-14 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
                    copiedId 
                      ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-700" 
                      : "bg-cyan-500 hover:bg-cyan-600 border-cyan-700 text-white"
                  }`}
                  onClick={() => copyToClipboard(studentId, 'id')}
                >
                  {copiedId ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5" />}
                </Button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              💡 Kongsi ID ini kepada ibu bapa supaya mereka boleh menghantar *Request* kepada anda.
            </p>
          </div>

          {/* BAHAGIAN 2: KOD RAHSIA (LINK CODE) */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 rounded-2xl border-2 border-amber-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Kod Pautan Segera
              </label>
              {linkCode && !isExpired && (
                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-100/50">
                  Sah 24 Jam
                </Badge>
              )}
            </div>
            
            {linkCode && !isExpired ? (
              <div className="flex gap-2">
                <div className="flex-1 bg-white rounded-xl px-4 py-3 font-mono text-xl tracking-widest font-bold text-amber-600 text-center border-2 border-amber-200 shadow-sm flex items-center justify-center">
                  {linkCode.code}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    className={`h-auto w-14 sm:w-12 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
                      copiedCode 
                        ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-700" 
                        : "bg-amber-500 hover:bg-amber-600 border-amber-700 text-white"
                    }`}
                    onClick={() => copyToClipboard(linkCode.code, 'code')}
                  >
                    {copiedCode ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5" />}
                  </Button>
                  <Button
                    className="h-auto w-14 sm:w-12 rounded-xl bg-slate-800 hover:bg-slate-900 text-white border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all"
                    onClick={() => setShowQR(!showQR)}
                  >
                    <QrCode className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleGenerateLinkCode}
                disabled={generating}
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Menjana Kod...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Jana Kod Rahsia Baru
                  </>
                )}
              </Button>
            )}

            {linkCode && !isExpired && (
              <p className="text-[11px] font-medium text-amber-700/70">
                Tamat pada: {new Date(linkCode.expires_at).toLocaleString('ms-MY', { 
                  day: 'numeric', 
                  month: 'short', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            )}

            {isExpired && (
              <p className="text-[11px] font-medium text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100">
                ⚠️ Kod ini telah tamat tempoh. Sila jana kod yang baru.
              </p>
            )}
          </div>

          {/* BAHAGIAN 3: PAPARAN QR CODE */}
          <AnimatePresence>
            {showQR && linkCode && !isExpired && studentId && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-800 p-6 rounded-2xl flex flex-col items-center mt-2 shadow-inner">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG
                      value={JSON.stringify({
                        student_id: studentId,
                        link_code: linkCode.code
                      })}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-xs text-slate-300 mt-4 text-center font-medium max-w-[200px]">
                    Minta ibu bapa imbas kod ini menggunakan peranti mereka 📸
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}