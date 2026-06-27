import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

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
    const u = await base44.auth.me();
    setUser(u);
    const rws = await base44.entities.Reward.filter({ parent_id: u.id });
    setRewards(rws);
    const linkReqs = await base44.entities.LinkRequest.filter({ parent_email: u.email, status: "approved" });
    setChildren(linkReqs.map(r => ({ id: r.student_id, full_name: r.student_name, email: r.student_email })));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditingReward(null);
    setForm({ title: "", coin_cost: "", icon: "🎁", student_id: children[0]?.id || "" });
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
    const data = {
      title: form.title,
      coin_cost: Number(form.coin_cost),
      icon: form.icon,
      student_id: form.student_id,
      parent_id: user.id,
      status: "active",
    };
    if (editingReward) {
      await base44.entities.Reward.update(editingReward.id, data);
    } else {
      await base44.entities.Reward.create(data);
    }
    setSaving(false);
    setDialogOpen(false);
    toast({ title: editingReward ? "Reward updated!" : "Reward created! 🎁" });
    loadData();
  };

  const toggleStatus = async (reward) => {
    const newStatus = reward.status === "active" ? "inactive" : "active";
    await base44.entities.Reward.update(reward.id, { status: newStatus });
    loadData();
  };

  const deleteReward = async (id) => {
    await base44.entities.Reward.delete(id);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Reward Manager 🎁</h1>
          <p className="text-muted-foreground text-sm mt-1">Create rewards for your child</p>
        </div>
        <Button onClick={openCreate} disabled={children.length === 0} size="sm" className="rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Create
        </Button>
      </div>

      {children.length === 0 && (
        <div className="text-center py-8 bg-white rounded-2xl border border-border/50">
          <p className="text-muted-foreground text-sm">Link a child first to create rewards.</p>
        </div>
      )}

      {rewards.length === 0 && children.length > 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-border/50">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No rewards yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Create rewards to motivate your child!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward, i) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl p-4 border border-border/50 ${reward.status === "inactive" ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                  {reward.icon || "🎁"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{reward.title}</h3>
                  <p className="text-sm text-amber-600 font-medium">{reward.coin_cost} coins</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleStatus(reward)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    {reward.status === "active"
                      ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                      : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    }
                  </button>
                  <button onClick={() => openEdit(reward)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteReward(reward.id)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "Create Reward"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setForm(f => ({ ...f, icon: e }))}
                    className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center border-2 transition-all ${
                      form.icon === e ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Reward Title</Label>
              <Input
                placeholder="e.g. Movie Night, Gaming Time"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Coin Cost</Label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={form.coin_cost}
                onChange={e => setForm(f => ({ ...f, coin_cost: e.target.value }))}
              />
            </div>
            {children.length > 1 && (
              <div>
                <Label>For which child?</Label>
                <Select value={form.student_id} onValueChange={v => setForm(f => ({ ...f, student_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {children.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving || !form.title || !form.coin_cost} className="w-full rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingReward ? "Update Reward" : "Create Reward"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}