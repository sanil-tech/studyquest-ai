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
      setLoading(true);

      // Fetch links targeting this specific child's ID matching the updated schema
      const links = await base44.entities.ParentChildRelationship.filter({ 
        child_id: user.id 
      });

      // Hydrate parent profile data (names/emails) dynamically since it's not in the relationship entity
      const hydrateRelationships = async (items) => {
        return Promise.all(
          items.map(async (item) => {
            try {
              const pUser = await base44.entities.User.get(item.parent_id);
              return {
                ...item,
                parent_name: pUser?.full_name || pUser?.nickname || "Parent User",
                parent_email: pUser?.email || "No email provided"
              };
            } catch {
              return {
                ...item,
                parent_name: "Parent User",
                parent_email: "Parent profile details loading error"
              };
            }
          })
        );
      };

      const pending = links.filter(r => r.status === "pending");
      const approved = links.find(r => r.status === "active");

      setPendingRequests(await hydrateRelationships(pending));
      
      if (approved) {
        const [hydratedApproved] = await hydrateRelationships([approved]);
        setApprovedLink(hydratedApproved);
      } else {
        setApprovedLink(null);
      }

    } catch (err) {
      console.error("Failed to fetch linkages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user?.id) load(); 
  }, [user?.id]);

  const handleAction = async (relationshipId, action) => {
    setProcessing(relationshipId);
    try {
      // Direct Edge Function routing matching your exact Deno endpoint setup
      const response = await base44.functions.respondToLinkRequest({
        relationship_id: relationshipId,
        action: action, // 'approve' or 'reject'
      });

      if (response?.error) throw new Error(response.error);

      toast({ 
        title: action === "approve" ? "Parent linked! 🎉" : "Request declined", 
        description: action === "approve" ? "You're now connected safely." : undefined
      });
      
      await load();
    } catch (err) {
      toast({ 
        title: `Failed to ${action}`, 
        description: err.message || "An expected server validation error occurred.", 
        variant: "destructive" 
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing parent configurations...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-semibold text-foreground">Parent Connection</h2>
      </div>

      {approvedLink ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Linked to {approvedLink.parent_name} ({approvedLink.parent_email})
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
                <p className="font-medium text-sm truncate">{req.parent_name}</p>
                <p className="text-xs text-muted-foreground truncate">{req.parent_email}</p>
              </div>
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => handleAction(req.id, "approve")}
                disabled={processing !== null}
              >
                {processing === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => handleAction(req.id, "reject")}
                disabled={processing !== null}
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