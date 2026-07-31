// src/pages/AdminPremiumAccess.jsx
// Admin page to grant temporary premium access to parents for Suku AI Learning Insights.
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Crown, Clock, X, Loader2, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import moment from "moment";

const GRANT_OPTIONS = [
  { label: "7 Hari", days: 7 },
  { label: "30 Hari", days: 30 },
  { label: "90 Hari", days: 90 },
];

export default function AdminPremiumAccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const loadParents = useCallback(async () => {
    setLoading(true);
    try {
      const allUsers = await base44.entities.User.list(100);
      const parentUsers = (allUsers || []).filter(u => u.app_role === "parent");
      setParents(parentUsers);
    } catch (err) {
      toast({ title: "Ralat", description: "Gagal memuatkan senarai ibu bapa.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadParents(); }, [loadParents]);

  const grantAccess = async (userId, days) => {
    setUpdating(userId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    try {
      await base44.entities.User.update(userId, {
        subscription_tier: "premium",
        premium_expires_at: expiresAt.toISOString(),
      });
      toast({ title: "Akses Premium diberikan! 🐢", description: `${days} hari akses Suku AI Insights aktif.` });
      loadParents();
    } catch (err) {
      toast({ title: "Ralat", description: "Gagal memberikan akses premium.", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const grantPermanent = async (userId) => {
    setUpdating(userId);
    try {
      await base44.entities.User.update(userId, {
        subscription_tier: "premium",
        premium_expires_at: null,
      });
      toast({ title: "Akses Premium Kekal! 🐢", description: "Akses Suku AI Insights kekal selamanya." });
      loadParents();
    } catch (err) {
      toast({ title: "Ralat", description: "Gagal memberikan akses premium.", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const revokeAccess = async (userId) => {
    setUpdating(userId);
    try {
      await base44.entities.User.update(userId, {
        subscription_tier: "free",
        premium_expires_at: null,
      });
      toast({ title: "Akses Premium ditarik balik." });
      loadParents();
    } catch (err) {
      toast({ title: "Ralat", description: "Gagal menarik balik akses.", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const getStatus = (p) => {
    if (p.subscription_tier !== "premium") return { label: "Free", color: "bg-slate-100 text-slate-500", active: false };
    if (!p.premium_expires_at) return { label: "Premium Kekal", color: "bg-emerald-100 text-emerald-700", active: true, permanent: true };
    const expiry = new Date(p.premium_expires_at);
    const isExpired = expiry < new Date();
    if (isExpired) return { label: "Tamat Tempoh", color: "bg-rose-100 text-rose-600", active: false, expired: true };
    const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
    return { label: `${daysLeft} hari lagi`, color: "bg-amber-100 text-amber-700", active: true, expiry: p.premium_expires_at };
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto bg-slate-50/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/parent")} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" /> Pengurusan Akses Premium
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Berikan akses sementara kepada Suku AI Learning Insights untuk ibu bapa.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : parents.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl bg-white">
          <p className="text-sm text-slate-500 font-medium">Tiada akaun ibu bapa dijumpai.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {parents.map(p => {
            const status = getStatus(p);
            const isUpdating = updating === p.id;
            return (
              <Card key={p.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-indigo-600">
                        {(p.nickname || p.full_name || p.email || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">{p.nickname || p.full_name || "Ibu Bapa"}</p>
                      <p className="text-[10px] text-slate-400 truncate">{p.email || p.username || "—"}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${status.color}`}>
                    {status.active ? <Crown className="w-3 h-3 inline mr-0.5" /> : status.expired ? <Clock className="w-3 h-3 inline mr-0.5" /> : null}
                    {status.label}
                  </span>
                </div>

                {status.expiry && (
                  <p className="text-[10px] text-slate-400 mb-3">
                    Tamat pada: {moment(status.expiry).format("DD MMM YYYY, HH:mm")}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {!status.active && GRANT_OPTIONS.map(opt => (
                    <Button
                      key={opt.days}
                      onClick={() => grantAccess(p.id, opt.days)}
                      disabled={isUpdating}
                      className="h-8 text-[10px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3"
                    >
                      {opt.label}
                    </Button>
                  ))}
                  {!status.active && (
                    <Button
                      onClick={() => grantPermanent(p.id)}
                      disabled={isUpdating}
                      className="h-8 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3"
                    >
                      <Sparkles className="w-3 h-3 mr-1" /> Kekal
                    </Button>
                  )}
                  {status.active && (
                    <Button
                      onClick={() => revokeAccess(p.id)}
                      disabled={isUpdating}
                      variant="outline"
                      className="h-8 text-[10px] font-bold rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 px-3"
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                      Tarik Balik
                    </Button>
                  )}
                  {status.active && !status.permanent && GRANT_OPTIONS.map(opt => (
                    <Button
                      key={`ext-${opt.days}`}
                      onClick={() => grantAccess(p.id, opt.days)}
                      disabled={isUpdating}
                      variant="outline"
                      className="h-8 text-[10px] font-bold rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 px-3"
                    >
                      +{opt.label}
                    </Button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}