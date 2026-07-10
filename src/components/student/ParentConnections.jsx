import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserCheck, UserX, Loader2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function ParentConnections() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { toast } = useToast();

  const loadRequests = async () => {
    try {
      setLoading(true);
      const me = await base44.auth.me();
      
      // 1. Tapis semua permintaan pautan yang berstatus 'pending' untuk murid ini
      const pendingReqs = await base44.entities.LinkRequest.filter({
        student_email: me.email,
        status: "pending"
      });

      if (!pendingReqs || pendingReqs.length === 0) {
        setRequests([]);
        return;
      }

      // 2. 💡 PROSES PINTAR: Dapatkan nama profil ibu bapa dari entiti User berdasarkan parent_id
      const enrichedRequests = await Promise.all(
        pendingReqs.map(async (req) => {
          try {
            const parentProfile = await base44.entities.User.get(req.parent_id);
            return {
              ...req,
              // Utamakan nama panggilan, kemudian nama penuh, akhir sekali e-mel sebagai fallback
              parent_display_name: parentProfile.nickname || parentProfile.full_name || parentProfile.email || "Penjaga"
            };
          } catch (err) {
            // Jika akaun bermasalah, gunakan e-mel dari data request asal
            return {
              ...req,
              parent_display_name: req.parent_email || "Penjaga"
            };
          }
        })
      );

      setRequests(enrichedRequests);
    } catch (err) {
      console.error("Gagal memuatkan permintaan penjaga:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (requestId, actionType) => {
    setProcessingId(requestId);
    try {
      // Kemaskini status sama ada 'approved' atau 'rejected'
      await base44.entities.LinkRequest.update(requestId, {
        status: actionType === "accept" ? "approved" : "rejected"
      });

      toast({
        title: actionType === "accept" ? "Akaun Dihubungkan! 🎉" : "Permintaan Ditolak",
        description: actionType === "accept" 
          ? "Ibu bapa anda kini boleh melihat laporan prestasi anda."
          : "Permintaan pautan telah dipadam.",
      });
      
      // Muat semula senarai
      loadRequests();
    } catch (err) {
      toast({
        title: "Ralat Sistem",
        description: "Gagal memproses tindakan anda. Sila cuba lagi.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-xs text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        Menyemak permintaan pautan akaun...
      </div>
    );
  }

  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <Card key={req.id} className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white max-w-xl">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="space-y-1">
              {/* 🌟 NAMA DITAMPILKAN SECARA DINAMIK DI SINI */}
              <h3 className="text-base font-black text-slate-800 tracking-tight leading-snug">
                Pautan: {req.parent_display_name}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Pengesahan sistem diperlukan • Ingin pautkan akaun
              </p>
            </div>

            {/* Butang Aksi Mengikut Reka Bentuk image_41a7e3.png */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                disabled={processingId === req.id}
                onClick={() => handleAction(req.id, "accept")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs h-9 px-4 transition-all"
              >
                {processingId === req.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                )}
                Terima
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={processingId === req.id}
                onClick={() => handleAction(req.id, "reject")}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs h-9 px-4 transition-all"
              >
                <UserX className="w-3.5 h-3.5 mr-1.5" />
                Tolak
              </Button>
            </div>

          </CardContent>
        </Card>
      ))}
    </div>
  );
}