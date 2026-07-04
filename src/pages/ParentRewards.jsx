import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const EMOJIS = ["🍦", "🎮", "🎬", "📱", "🛍️", "🎂", "🏀", "🎵", "📚", "✈️", "🎁", "⭐"];

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

  const loadData = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      
      // Fetch rewards assigned to this parent
      const rws = await base44.entities.Reward.filter({ parent_id: u.id });
      setRewards(rws);
      
      // Fetch link requests
      const allReqs = await base44.entities.LinkRequest.filter({ parent_email: u.email });
      
      // FIX (Option 1): Only display fully approved profiles that have an established student_id
      const approvedLinks = allReqs.filter(r => r.status === "approved" && r.student_id);
      
      setChildren(approvedLinks.map(r => ({ 
        id: r.student_id, 
        full_name: r.student_name || r.student_username || `Profile (${r.student_email?.split("@")[0]})`, 
        email: r.student_email || "",
        username: r.student_username || r.username || "" 
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditingReward(null);
    setForm({ 
      title: "", 
      coin_cost: "", 
      icon: "🎁", 
      student_id: children.length > 1 ? "all" : (children[0]?.id || "") 
    });
    setDialogOpen(true);
  };

  const openEdit = (reward) => {
    setEditingReward(reward);
    setForm({ title: reward.title, coin_cost: String(reward.coin_cost), icon: reward.icon || "🎁", student_id: reward.student_id });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.coin_cost || !form.student_id) return;
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
          username: selectedChild ? selectedChild.username : "",
          parent_id: user.id,
          parent_email: user.email,
          status: editingReward.status || "active",
        };
        await base44.entities.Reward.update(editingReward.id, data);
        toast({ title: "Reward updated! ✨" });
      } else {
        if (form.student_id === "all") {
          // Loop through children and reliably use their verified IDs
          await Promise.all(
            children.map(child => {
              return base44.entities.Reward.create({
                title: form.title,
                coin_cost: Number(form.coin_cost),
                icon: form.icon,
                student_id: child.id,
                student_email: child.email, 
                student_username: child.username, 
                username: child.username, 
                parent_id: user.id,
                parent_email: user.email,
                status: "active",
              });
            })
          );
          toast({ title: "Reward published to all children! 🎁🎉" });
        } else {
          const selectedChild = children.find(c => c.id === form.student_id);
          
          await base44.entities.Reward.create({
            title: form.title,
            coin_cost: Number(form.coin_cost),
            icon: form.icon,
            student_id: form.student_id,
            student_email: selectedChild ? selectedChild.email : "",
            student_username: selectedChild ? selectedChild.username : "",
            username: selectedChild ? selectedChild.username : "", 
            parent_id: user.id,
            parent_email: user.email,
            status: "active",
          });
          toast({ title: "Reward created for selected child! 🎁" });
        }
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast({ title: "Error saving reward", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (reward) => {
    const newStatus = reward.status === "active" ? "inactive" : "active";
    try {
      await base44.entities.Reward.update(reward.id, { status: newStatus });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReward = async (id) => {
    if (!confirm("Are you sure you want to delete this reward permanently?")) return;
    try {
      await base44.entities.Reward.delete(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Loading Reward Vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto px-1">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-6 rounded-3xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <Sparkles className="w-3.5 h-3.5 fill-indigo-100" />
            Incentive System
          </div>
          <h1 className="text-2xl font-black font-heading tracking-tight text-slate-800">Reward Manager 🎁</h1>
          <p className="text-slate-500 text-sm mt-0.5">Design customized reward targets to fuel your child's learning motivation.</p>
        </div>
        <Button 
          onClick={openCreate} 
          disabled={children.length === 0} 
          className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm px-5 py-5 shrink-0 border-0"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[3]" /> Create Reward
        </Button>
      </div>

      {/* EMPTY & NO CHILDREN STATES */}
      {children.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed max-w-md mx-auto">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No Approved Linked Accounts</h3>
          <p className="text-slate-400 text-xs px-6 mt-1">
            You must finish linking a child's account and ensure it is fully approved on your main dashboard before setting up custom incentives.
          </p>
        </div>
      )}

      {rewards.length === 0 && children.length > 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-lg mx-auto">
          <Gift className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No items created yet</h3>
          <p className="text-slate-400 text-sm px-4 mt-1">
            Set goals like "30 min Gaming" or "Ice Cream Trip" to encourage consistent study habits!
          </p>
          <Button onClick={openCreate} variant="outline" className="mt-4 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold">
            Add Your First Reward
          </Button>
        </div>
      ) : (
        /* REWARDS LIST GRID */
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
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-2xl p-4 border shadow-2xs transition-all flex flex-col justify-between group ${
                    isActive ? "border-slate-100 hover:shadow-sm" : "border-slate-100 bg-slate-50/50 opacity-65"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-2xs border shrink-0 transition-transform ${
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
                          {reward.coin_cost} coins
                        </span>
                        
                        {assignedChild && (
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg max-w-[140px] truncate">
                            👤 {assignedChild.full_name?.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3">
                    <span className={`text-[11px] font-bold tracking-wide uppercase ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                      {isActive ? "● Live in shop" : "○ Disabled"}
                    </span>
                    
                    <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-100">
                      <button 
                        onClick={() => toggleStatus(reward)} 
                        title={isActive ? "Deactivate Reward" : "Activate Reward"}
                        className="p-2 rounded-lg hover:bg-white hover:shadow-3xs transition-all text-slate-400 hover:text-indigo-600"
                      >
                        {isActive ? (
                          <ToggleRight className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>

                      <button 
                        onClick={() => openEdit(reward)} 
                        title="Edit Details"
                        className="p-2 rounded-lg hover:bg-white hover:shadow-3xs transition-all text-slate-400 hover:text-indigo-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => deleteReward(reward.id)} 
                        title="Delete Permanently"
                        className="p-2 rounded-lg hover:bg-rose-50 hover:shadow-3xs transition-all text-slate-400 hover:text-rose-500"
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

      {/* CREATE / EDIT DIALOG OVERLAY */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-black font-heading tracking-tight text-slate-800">
              {editingReward ? "Modify Reward Vault" : "Design New Reward"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Fill out configuration metrics below to publish this prize token to your child's client catalog shop.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 pt-3">
            {/* Emoji Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Card Icon</Label>
              <div className="grid grid-cols-6 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon: e }))}
                    className={`h-11 rounded-xl text-lg flex items-center justify-center border-2 transition-all shadow-3xs ${
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

            {/* Reward Title */}
            <div className="space-y-1.5">
              <Label htmlFor="reward-title" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reward Title</Label>
              <Input
                id="reward-title"
                placeholder="e.g., Friday Late Night Gaming Session"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 font-medium py-5 text-sm"
              />
            </div>

            {/* Coin Cost */}
            <div className="space-y-1.5">
              <Label htmlFor="coin-cost" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Coin Purchase Price</Label>
              <Input
                id="coin-cost"
                type="number"
                placeholder="e.g., 350"
                value={form.coin_cost}
                onChange={e => setForm(f => ({ ...f, coin_cost: e.target.value }))}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 font-bold py-5 text-sm"
              />
            </div>

            {/* Target Assignment */}
            {children.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Recipient</Label>
                <Select value={form.student_id} onValueChange={v => setForm(f => ({ ...f, student_id: v }))}>
                  <SelectTrigger className="rounded-xl border-slate-200 py-5 font-semibold text-slate-700">
                    <SelectValue placeholder="Choose a child profile" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {!editingReward && (
                      <SelectItem value="all" className="rounded-lg font-bold text-indigo-600 hover:text-indigo-700">
                        ✨ All Children
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
            )}

            {/* Action Safe Button */}
            <Button 
              onClick={handleSave} 
              disabled={saving || !form.title || !form.coin_cost} 
              className="w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm py-5 border-0 mt-2 text-sm"
            >
              {saving ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </span>
              ) : editingReward ? (
                "Update Target Reward"
              ) : (
                "Publish Reward Ticket"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}