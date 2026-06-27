import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Loader2, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function ConnectParent({ user }) {
  const [parentEmail, setParentEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const check = async () => {
      try {
        const reqs = await base44.entities.LinkRequest.filter({
          student_id: user.id,
        });
        setExistingRequest(reqs[0] || null);
        if (reqs[0]?.parent_email) setParentEmail(reqs[0].parent_email);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [user.id]);

  const handleConnect = async () => {
    if (!parentEmail.trim()) return;
    setSaving(true);
    try {
      if (existingRequest) {
        await base44.entities.LinkRequest.update(existingRequest.id, {
          parent_email: parentEmail.trim(),
          status: "pending",
        });
      } else {
        await base44.entities.LinkRequest.create({
          student_id: user.id,
          student_name: user.full_name || "Student",
          student_email: user.email,
          parent_email: parentEmail.trim(),
          status: "pending",
        });
      }
      const reqs = await base44.entities.LinkRequest.filter({ student_id: user.id });
      setExistingRequest(reqs[0]);
      toast({ title: "Link request sent! 🎉", description: "Your parent can now link to your account." });
    } catch (err) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-semibold text-foreground">Connect Parent</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Enter your parent's email so they can link to your account and track your progress.
      </p>
      {existingRequest?.status === "approved" && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Linked to your parent account!
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Parent's email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            className="pl-9 rounded-xl"
            disabled={existingRequest?.status === "approved"}
          />
        </div>
        <Button onClick={handleConnect} disabled={saving || !parentEmail.trim() || existingRequest?.status === "approved"} className="rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : existingRequest ? "Update" : "Send"}
        </Button>
      </div>
    </div>
  );
}