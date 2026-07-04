import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, X, Shield, CheckCircle, Loader2, Heart, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ParentConnections({ user }) {
  const { toast } = useToast();
  const [parents, setParents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadConnections();
    }
  }, [user?.id]);

  const loadConnections = async () => {
    try {
      setLoading(true);

      // 1. Ambil rekod hubungan daripada single source of truth table
      const links = await base44.entities.ParentChildRelationship.filter({
        child_id: user.id
      });

      const activeLinks = links.filter((l) => l.status === "active");
      const pendingLinks = links.filter((l) => l.status === "pending");

      // Fungsi bantuan untuk dapatkan profil penuh maklumat User (Ibu bapa)
      const hydrateParents = async (relationshipRecords) => {
        return Promise.all(
          relationshipRecords.map(async (rel) => {
            try {
              const parentUsers = await base44.entities.User.filter({ id: rel.parent_id });
              if (parentUsers.length === 0) return null;
              return {
                ...parentUsers[0],
                relationshipId: rel.id,
                relationship: rel.relationship || "Ibu Bapa",
                linked_at: rel.linked_at
              };
            } catch (err) {
              console.error(`Gagal memuatkan info ibu bapa untuk ID: ${rel.parent_id}`, err);
              return null;
            }
          })
        );
      };

      const [hydratedActive, hydratedPending] = await Promise.all([
        hydrateParents(activeLinks),
        hydrateParents(pendingLinks)
      ]);

      setParents(hydratedActive.filter((p) => p !== null));
      setPendingRequests(hydratedPending.filter((p) => p !== null));
    } catch (err) {
      console.error("Gagal memuatkan pautan ibu bapa:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (relationshipId, action, parentName) => {
    setProcessingId(relationshipId);
    try {
      // Panggilan terus ke Deno Edge Function backend anda
      const response = await base44.functions.respondToLinkRequest({
        relationship_id: relationshipId,
        action: action // 'approve' atau 'reject'
      });

      if (response?.error) throw new Error(response.error);

      toast({
        title: action === "approve" ? "Pautan Berjaya! 🎉" : "Permintaan Ditolak",
        description: action === "approve" 
          ? `${parentName} kini boleh melihat trek pembelajaran dan papan pemuka progres anda.`
          : "Permintaan pautan akaun telah dialih keluar."
      });

      await loadConnections();
    } catch (err) {
      toast({
        title: "Tindakan Gagal",
        description: err.message || "Gagal memproses status pautan.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveParent = async (relationshipId, parentName) => {
    if (!confirm(`Adakah anda pasti mahu mengeluarkan ${parentName}? Mereka tidak akan dapat melihat log perkembangan anda lagi.`)) {
      return;
    }

    setProcessingId(relationshipId);
    try {
      await base44.entities.ParentChildRelationship.update(relationshipId, {
        status: "inactive"
      });

      toast({
        title: "Pautan Diputuskan",
        description: `${parentName} tidak lagi terhubung dengan akaun anda.`,
      });

      await loadConnections();
    } catch (err) {
      toast({
        title: "Gagal Mengeluarkan",
        description: err.message || "Sila cuba lagi sebentar lagi.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-[2rem] border-4 border-slate-100 shadow-xl">
        <Sparkles className="w-8 h-8 text-indigo-500 animate-spin mb-3" style={{ animationDuration: '3s' }} />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Menyemak rangkaian keluarga...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] p-6 sm:p-8 border-4 border-slate-100 shadow-xl relative overflow-hidden">
      {/* Hiasan Latar Belakang */}
      <Users className="absolute -top-6 -right-6 w-32 h-32 text-indigo-50/40 rotate-12 pointer-events-none" />

      <div className="relative z-10 space-y-6">
        
        {/* Header Utama */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-2xl">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Pautan Ibu Bapa 👨‍👩‍👧‍👦</h2>
            <p className="text-sm text-slate-500">Uruskan akaun penjaga yang boleh melihat perkembangan quest anda.</p>
          </div>
        </div>

        {/* ========================================= */}
        // {/* SEKSYEN PERMINTAAN MENUNGGU (PENDING)    */}
        {/* ========================================= */}
        <AnimatePresence>
          {pendingRequests.length > 0 && (
            <div className="space-y-3 bg-amber-50/50 border-2 border-amber-100 p-4 rounded-2xl">
              <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Permintaan Menunggu Kelulusan ({pendingRequests.length})
              </h3>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <motion.div
                    key={request.relationshipId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border-2 border-amber-200/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <p className="font-extrabold text-slate-800">
                        {request.full_name || request.nickname || request.email}
                      </p>
                      <p className="text-xs text-amber-600 font-medium">Mahu memautkan akaun penjaga ke profil anda</p>
                    </div>
                    
                    <div className="flex gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg border-b-4 border-slate-300 active:border-b-0 active:translate-y-0.5 text-slate-600 bg-white hover:bg-slate-50 transition-all px-3"
                        disabled={processingId !== null}
                        onClick={() => handleAction(request.relationshipId, "reject", request.full_name || request.email)}
                      >
                        <X className="w-4 h-4 mr-1 text-rose-500" /> Tolak
                      </Button>
                      
                      <Button
                        size="sm"
                        className="h-9 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg border-b-4 border-emerald-700 active:border-b-0 active:translate-y-0.5 transition-all px-3"
                        disabled={processingId !== null}
                        onClick={() => handleAction(request.relationshipId, "approve", request.full_name || request.email)}
                      >
                        {processingId === request.relationshipId ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Terima
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================= */}
        {/* SEKSYEN SENARAI IBU BAPA AKTIF (ACTIVE)  */}
        {/* ========================================= */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400/10" /> Ibu Bapa Terhubung ({parents.length})
          </h3>
          
          {parents.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/60 border-2 border-dashed border-slate-200 rounded-2xl p-6">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-20 text-slate-500" />
              <p className="text-sm font-bold text-slate-700">Tiada penjaga terhubung</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                Kongsi ID Pelajar tetap atau Kod Pautan Segera anda untuk mula menghubungkan ahli keluarga anda.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {parents.map((parent) => (
                <motion.div
                  key={parent.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-50/80 border-2 border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs hover:border-indigo-100 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Bekas Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-3xs overflow-hidden">
                      {parent.profile_picture_url ? (
                        <img
                          src={parent.profile_picture_url}
                          alt={parent.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">{parent.avatar_emoji || "👤"}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate leading-tight">
                        {parent.full_name || parent.nickname || parent.email}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1">
                        Terhubung pada {new Date(parent.linked_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-white border-slate-200 text-slate-600 px-2 py-0.5 rounded-md shadow-3xs flex items-center gap-1">
                      <Shield className="w-3 h-3 text-indigo-500 fill-indigo-500/10" />
                      {parent.relationship}
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 active:scale-95 transition-all"
                      disabled={processingId !== null}
                      onClick={() => handleRemoveParent(parent.relationshipId, parent.full_name || parent.email)}
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}