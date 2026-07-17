import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// Senarai ikon emoji pilihan untuk kad ganjaran
const EMOJIS = ["🍦", "🎮", "🎬", "📱", "🛍️", "🎂", "🏀", "🎵", "📚", "✈️", "🎁", "⭐"];

// Fungsi bantuan untuk mendapatkan nama paparan pelajar yang sah
const getDisplayName = (user) => {
  if (!user) return "Pelajar";
  return user.nickname || user.username || user.email || "Pelajar";
};

export default function ParentRewards() {
  const [user, setUser] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [form, setForm] = useState({ title: "", coin_cost: "", icon: "🎁", student_id: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Memuatkan data profil ibu bapa, senarai ganjaran, dan hubungan akaun anak
  const loadData = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      
      // 1. Mengambil data ganjaran yang telah dicipta oleh ibu bapa ini
      const rws = await base44.entities.Reward.filter({ parent_id: u.id });
      setRewards(rws);
      
      // 2. Mengambil data hubungan anak yang berstatus aktif
      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: "active",
      });

      // 3. Mengambil maklumat terperinci setiap profil anak secara selari
      const childDetails = await Promise.all(
        relationships.map(async (rel) => {
          try {
            const child = await base44.entities.User.get(rel.child_id);
            return {
              id: child.id,
              full_name: getDisplayName(child),
              email: child.email || "",
              username: child.username || ""
            };
          } catch (childErr) {
            console.error(`Gagal memuatkan maklumat profil anak bagi ID ${rel.child_id}:`, childErr);
            return null;
          }
        })
      );

      const activeChildren = childDetails.filter(Boolean);
      setChildren(activeChildren);

    } catch (err) {
      console.error("Ralat memuatkan rangka kerja data ganjaran ibu bapa:", err);
      toast({ 
        title: "Penyinkronan Gagal", 
        description: "Tidak dapat memautkan profil aktif anak.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Menjalankan fungsi memuatkan data sebaik sahaja halaman dibuka
  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  // Membuka borang dialog untuk mencipta ganjaran baharu
  const openCreate = () => {
    setEditingReward(null);
    setForm({ 
      title: "", 
      coin_cost: "", 
      icon: "🎁", 
      student_id: children[0]?.id || "" 
    });
    setDialogOpen(true);
  };

  // Membuka borang dialog untuk mengemas kini ganjaran sedia ada
  const openEdit = (reward) => {
    setEditingReward(reward);
    setForm({ 
      title: reward.title, 
      coin_cost: String(reward.coin_cost), 
      icon: reward.icon || "🎁", 
      student_id: reward.student_id 
    });
    setDialogOpen(true);
  };

  // Mengendalikan fungsi simpan (Cipta Baru atau Kemas Kini) data ganjaran
  const handleSave = async () => {
    if (!form.title || !form.coin_cost || !form.student_id) {
      toast({ title: "Sila isi semua ruangan yang diperlukan", variant: "destructive" });
      return;
    }
    setSaving(true);
    
    try {
      if (editingReward) {
        const selectedChild = children.find(c => c.id === form.student_id);
        const data = {
          title: form.title,
          coin_cost: Number(form.coin_cost),
          icon: form.icon,
          student_id: form.student_id,
          student_email: selectedChild ? selectedChild.email : "",
          student_username: selectedChild ? selectedChild.username : "",
          parent_id: user.id,
          parent_email: user.email,
          status: editingReward.status || "active",
        };
        await base44.entities.Reward.update(editingReward.id, data);
        toast({ title: "Ganjaran berjaya dikemas kini! ✨" });
      } else {
        // Logik jika ibu bapa memilih untuk menerbitkan kepada semua anak serentak
        if (form.student_id === "all") {
          await Promise.all(
            children.map(child => 
              base44.entities.Reward.create({
                title: form.title,
                coin_cost: Number(form.coin_cost),
                icon: form.icon,
                student_id: child.id,
                student_email: child.email, 
                student_username: child.username, 
                parent_id: user.id,
                parent_email: user.email,
                status: "active",
              })
            )
          );
          toast({ title: "Ganjaran diterbitkan untuk semua anak! 🎁" });
        } else {
          const selectedChild = children.find(c => c.id === form.student_id);
          await base44.entities.Reward.create({
            title: form.title,
            coin_cost: Number(form.coin_cost),
            icon: form.icon,
            student_id: form.student_id,
            student_email: selectedChild ? selectedChild.email : "",
            student_username: selectedChild ? selectedChild.username : "",
            parent_id: user.id,
            parent_email: user.email,
            status: "active",
          });
          toast({ title: "Ganjaran dicipta untuk anak yang dipilih! 🎁" });
        }
      }
      setDialogOpen(false);
      
      // Segerakkan semula senarai ganjaran terkini dari pelayan
      await loadData();
    } catch (err) {
      console.error("Ralat semasa menyimpan ganjaran:", err);
      toast({ title: "Ralat menyimpan ganjaran", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Menukar status aktif atau tidak aktif sesuatu ganjaran di kedai anak
  const toggleStatus = async (reward) => {
    const newStatus = reward.status === "active" ? "inactive" : "active";
    try {
      await base44.entities.Reward.update(reward.id, { status: newStatus });
      await loadData();
    } catch (err) {
      console.error("Gagal menukar status ganjaran:", err);
    }
  };

  // Memadam data ganjaran secara kekal daripada sistem
  const deleteReward = async (id) => {
    if (!window.confirm("Adakah anda pasti mahu memadam ganjaran ini secara kekal?")) return;
    try {
      await base44.entities.Reward.delete(id);
      await loadData();
    } catch (err) {
      console.error("Gagal memadam ganjaran:", err);
    }
  };

  // Skrin pemuat halaman utama
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 font-bold mt-2">Memuatkan Profil Ganjaran...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto px-1">
      
      {/* 1. KAD KEPALA HALAMAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <Sparkles className="w-3.5 h-3.5 fill-indigo-100" />
            Sistem Insentif Belajar
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">Pengurus Ganjaran 🎁</h1>
          <p className="text-slate-500 text-sm mt-0.5">Reka sasaran ganjaran khusus untuk menyemarakkan motivasi belajar anak anda.</p>
        </div>
        <Button 
          onClick={openCreate} 
          disabled={children.length === 0} 
          className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm px-5 py-5 shrink-0 border-0"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[3]" /> Cipta Ganjaran
        </Button>
      </div>

      {/* 2. PAPARAN PANDUAN JIKA TIADA AKAUN ANAK TERPAUT */}
      {children.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed max-w-md mx-auto">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">Tiada Akaun Terpaut yang Sah</h3>
          <p className="text-slate-400 text-xs px-6 mt-1">
            Anda mesti selesai memautkan akaun anak dan memastikan ia diluluskan sepenuhnya di papan pemuka utama sebelum menyediakan insentif khusus.
          </p>
        </div>
      )}

      {/* 3. PAPARAN JIKA TIADA GANJARAN YANG DICIPTA LAGI */}
      {rewards.length === 0 && children.length > 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-lg mx-auto">
          <Gift className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Tiada item ganjaran dicipta lagi</h3>
          <p className="text-slate-400 text-sm px-4 mt-1">
            Tetapkan sasaran seperti "30 minit Main Permainan Video" atau "Lawatan Aiskrim" untuk menggalakkan tabiat belajar yang konsisten!
          </p>
          <Button onClick={openCreate} variant="outline" className="mt-4 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold">
            Tambah Ganjaran Pertama Anda
          </Button>
        </div>
      ) : (
        /* 4. GRID SENARAI GANJARAN IBU BAPA */
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence>
            {rewards.map((reward, i) => {
              const assignedChild = children.find(c => c.id === reward.student_id);
              const isActive = reward.status === "active";

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between group ${
                    isActive ? "border-slate-100 shadow-sm hover:shadow-md" : "border-slate-100 bg-slate-50/50 opacity-65"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shrink-0 transition-transform ${
                      isActive ? "bg-indigo-50/60 border-indigo-100/80" : "bg-slate-200 border-slate-300"
                    }`}>
                      {reward.icon || "🎁"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-800 text-base tracking-tight truncate leading-tight">
                        {reward.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/50">
                          {reward.coin_cost} koin
                        </span>
                        
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg max-w-[140px] truncate">
                          👤 {assignedChild ? assignedChild.full_name : "Anak Tidak Dikenali"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3">
                    <span className={`text-[11px] font-bold tracking-wide uppercase ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                      {isActive ? "● Aktif di kedai" : "○ Disembunyikan"}
                    </span>
                    
                    <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-100">
                      <button 
                        onClick={() => toggleStatus(reward)} 
                        className="p-2 rounded-lg hover:bg-white transition-all text-slate-400 hover:text-indigo-600"
                      >
                        {isActive ? (
                          <ToggleRight className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>

                      <button 
                        onClick={() => openEdit(reward)} 
                        className="p-2 rounded-lg hover:bg-white transition-all text-slate-400 hover:text-indigo-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => deleteReward(reward.id)} 
                        className="p-2 rounded-lg hover:bg-rose-50 transition-all text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 5. BORANG POP-UP DIALOG (CIPTA / KEMAS KINI GANJARAN) */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingReward(null);
          setForm({ title: "", coin_cost: "", icon: "🎁", student_id: "" });
        }
      }}>
        <DialogContent className="rounded-3xl max-w-md p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight text-slate-800">
              {editingReward ? "Ubah Suai Simpanan Ganjaran" : "Reka Ganjaran Baharu"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Isi butiran konfigurasi di bawah untuk menerbitkan token hadiah ini ke katalog kedai anak anda.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 pt-3">
            {/* Bahagian Pemilihan Emoji */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pilih Ikon Kad Ganjaran</Label>
              <div className="grid grid-cols-6 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon: e }))}
                    className={`h-11 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${
                      form.icon === e 
                        ? "border-indigo-500 bg-white scale-105" 
                        : "border-transparent hover:bg-white/80"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Tajuk Ganjaran */}
            <div className="space-y-1.5">
              <Label htmlFor="reward-title" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tajuk Ganjaran</Label>
              <Input
                id="reward-title"
                placeholder="Contoh: Sesi Main Permainan Video Malam Jumaat"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 font-medium py-5 text-sm"
              />
            </div>

            {/* Input Harga Koin */}
            <div className="space-y-1.5">
              <Label htmlFor="coin-cost" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Harga Belian Koin</Label>
              <Input
                id="coin-cost"
                type="number"
                placeholder="Contoh: 350"
                value={form.coin_cost}
                onChange={e => setForm(f => ({ ...f, coin_cost: e.target.value }))}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 font-bold py-5 text-sm"
              />
            </div>

            {/* Pilihan Penerima Sasaran */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Penerima Sasaran</Label>
              <Select value={form.student_id} onValueChange={v => setForm(f => ({ ...f, student_id: v }))}>
                <SelectTrigger className="rounded-xl border-slate-200 py-5 font-semibold text-slate-700">
                  <SelectValue placeholder="Pilih profil anak" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {!editingReward && children.length > 1 && (
                    <SelectItem value="all" className="rounded-lg font-bold text-indigo-600 hover:text-indigo-700">
                      ✨ Semua Anak (Cipta Salinan Individu)
                    </SelectItem>
                  )}
                  {children.map(c => (
                    <SelectItem key={c.id} value={c.id} className="rounded-lg font-medium text-slate-700">
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Butang Tindakan Utama */}
            <Button 
              onClick={handleSave} 
              disabled={saving || !form.title || !form.coin_cost || !form.student_id} 
              className="w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm py-5 border-0 mt-2 text-sm"
            >
              {saving ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Perubahan...
                </span>
              ) : editingReward ? (
                "Kemas Kini Sasaran Ganjaran"
              ) : (
                "Terbitkan Tiket Ganjaran"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
