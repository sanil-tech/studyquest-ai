import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserCheck, Loader2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function ConnectParent({ user }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedLink, setApprovedLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const reqs = await base44.entities.LinkRequest.filter({ student_email: user.email });
      setPendingRequests(reqs.filter(r => r.status === "pending"));
      const approved = reqs.find(r => r.status === "approved");
      setApprovedLink(approved || null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user.email]);

  const handleAccept = async (req) => {
    setProcessing(req.id);
    try {
      await base44.entities.LinkRequest.update(req.id, {
        student_id: user.id,
        student_name: user.full_name || user.email,
        student_email: user.email,
        status: "approved",
      });
      toast({ title: "Parent linked! 🎉", description: `You're now connected to ${req.parent_name || req.parent_email}.` });
      load();
    } catch (err) {
      toast({ title: "Failed to accept", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (req) => {
    setProcessing(req.id);
    try {
      await base44.entities.LinkRequest.update(req.id, { status: "rejected" });
      toast({ title: "Request declined" });
      load();
    } catch (err) {
      toast({ title: "Failed to decline", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-semibold text-foreground">Parent Connection</h2>
      </div>

      {approvedLink ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Linked to {approvedLink.parent_name || approvedLink.parent_email}
        </div>
      ) : pendingRequests.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Your parent wants to connect:</p>
          {pendingRequests.map(req => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {req.parent_name?.[0]?.toUpperCase() || "P"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{req.parent_name || "Parent"}</p>
                <p className="text-xs text-muted-foreground truncate">{req.parent_email}</p>
              </div>
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => handleAccept(req)}
                disabled={processing === req.id}
              >
                {processing === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => handleReject(req)}
                disabled={processing === req.id}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No pending parent requests. Ask your parent to link you from their dashboard.
        </p>
      )}
    </div>
  );
}