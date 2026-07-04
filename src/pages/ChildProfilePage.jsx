import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, Check, X, Clock, ShieldCheck, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentParentConnections({ studentId }) {
  const { toast } = useToast();
  const [activeConnections, setActiveConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (studentId) {
      loadConnections();
    }
  }, [studentId]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      
      const [activeData, pendingData] = await Promise.all([
        base44.entities.ParentChildRelationship.filter({
          child_id: studentId,
          status: "active"
        }),
        base44.entities.LinkRequest.filter({
          student_id: studentId,
          status: "pending"
        })
      ]);

      // Ambil nama profil ibu bapa untuk sambungan yang aktif
      const enhancedActiveData = await Promise.all(
        (activeData || []).map(async (conn) => {
          try {
            const parentProfile = await base44.entities.User.get(conn.parent_id);
            return { ...conn, parent_name: parentProfile.full_name || parentProfile.nickname || parentProfile.email };
          } catch (e) {
            return { ...conn, parent_name: "Ibu/Bapa Pengembara" };
          }
        })
      );

      setActiveConnections(enhancedActiveData);
      setPendingRequests(pendingData || []);
    } catch (err) {
      console.error("Gagal memuatkan data sambungan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (request, action) => {
    setProcessingId(request.id);
    try {
      if (action === "accept") {
        await base44.entities.LinkRequest.update(request.id, { status: "approved" });

        await base44.entities.ParentChildRelationship.create({
          parent_id: request.parent_id,
          child_id: studentId,
          relationship: "parent",
          status: "active",
          linked_at: new Date().toISOString()
        });

        toast({
          title: "Berjaya Disambung! 🎉",
          description: "YAY! Akaun anda kini telah dihubungkan dengan ibu bapa.",
        });
      } else {
        await base44.entities.LinkRequest.update(request.id, { status: "declined" });
        toast({
          title: "Permintaan Ditolak",
          description: "Anda telah menolak permintaan pautan ini.",
        });
      }

      await loadConnections();
    } catch (err) {
      toast({
        title: "Ralat Berlaku 😢",
        description: err.message || "Gagal memproses permintaan.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
        <Sparkles className="w-8 h-8 text-cyan-500 animate-spin mb-3" style={{ animationDuration: '3s' }} />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Menyemak buku log pengembaraan...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] p-6 sm:p-8 border-4 border-slate-100 shadow-xl relative overflow-hidden">
      {/* Dekorasi Kad */}
      <Heart className="absolute -top-6 -right-6 w-32 h-32 text-pink-50/50 rotate-12" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-cyan-100 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Rakan Pengembaraan 🛡️</h2>
            <p className="text-sm text-slate-500">Urus senarai ibu bapa yang memantau & memberi ganjaran kepada anda.</p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          
          {/* Sesi Permintaan Menunggu (Pending) */}
          <AnimatePresence>
            {pendingRequests.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Permintaan Baru ({pendingRequests.length})
                </h4>
                <div className="grid gap-3">
                  {pendingRequests.map((request) => (
                    <motion.div 
                      key={request.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {request.parent_name || "Ibu Bapa"}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">{request.parent_email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-10 px-4 text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl"
                          onClick={() => handleAction(request, "decline")}
                          disabled={processingId !== null}
                        >
                          <X className="w-4 h-4 mr-1" /> Tolak
                        </Button>
                        <Button
                          size="sm"
                          className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all"
                          onClick={() => handleAction(request, "accept")}
                          disabled={processingId !== null}
                        >
                          <Check className="w-4 h-4 mr-1" /> Terima
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sesi Profil Aktif */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Profil Ibu Bapa Dihubungkan ({activeConnections.length})
            </h4>

            {activeConnections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                <User className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-400">Belum ada ibu bapa yang dipautkan lagi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeConnections.map((conn) => (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={conn.id} 
                    className="flex items-center gap-3 p-4 border-2 border-cyan-100 bg-cyan-50/30 rounded-2xl transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center shadow-inner">
                      <ShieldCheck className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {conn.parent_name}
                      </p>
                      <p className="text-xs font-medium text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full inline-block mt-1">
                        Penyokong Aktif ✨
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}