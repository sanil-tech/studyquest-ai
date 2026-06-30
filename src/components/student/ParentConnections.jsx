import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, X, Shield, CheckCircle, Loader2 } from "lucide-react";
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

      // 1. Fetch relationships tied to this child from the single source of truth table
      const links = await base44.entities.ParentChildRelationship.filter({
        child_id: user.id
      });

      const activeLinks = links.filter((l) => l.status === "active");
      const pendingLinks = links.filter((l) => l.status === "pending");

      // Helper function to hydrate full parent profile data from User collections
      const hydrateParents = async (relationshipRecords) => {
        return Promise.all(
          relationshipRecords.map(async (rel) => {
            try {
              const parentUsers = await base44.entities.User.filter({ id: rel.parent_id });
              if (parentUsers.length === 0) return null;
              return {
                ...parentUsers[0],
                relationshipId: rel.id,
                relationship: rel.relationship || "parent",
                linked_at: rel.linked_at
              };
            } catch (err) {
              console.error(`Error loading parent info for ID: ${rel.parent_id}`, err);
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
      console.error("Failed to load parent connections:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (relationshipId, action, parentName) => {
    setProcessingId(relationshipId);
    try {
      // Direct call to your backend Deno Edge Function
      const response = await base44.functions.respondToLinkRequest({
        relationship_id: relationshipId,
        action: action // 'approve' or 'reject'
      });

      if (response?.error) throw new Error(response.error);

      toast({
        title: action === "approve" ? "Parent Linked! 🎉" : "Request Declined",
        description: action === "approve" 
          ? `${parentName} can now view your learning tracks and progress dashboards.`
          : "The link request was removed."
      });

      await loadConnections();
    } catch (err) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to route process state.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveParent = async (relationshipId, parentName) => {
    if (!confirm(`Are you sure you want to remove ${parentName}? They will lose access to your progression logs.`)) {
      return;
    }

    setProcessingId(relationshipId);
    try {
      // Set status to inactive directly or call endpoint depending on preference
      await base44.entities.ParentChildRelationship.update(relationshipId, {
        status: "inactive"
      });

      toast({
        title: "Parent Removed",
        description: `${parentName} is no longer linked to your account.`,
      });

      await loadConnections();
    } catch (err) {
      toast({
        title: "Removal Failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-primary" />
          Parent Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* ========================================= */}
        {/* PENDING APPROVAL REQUESTS SECTION         */}
        {/* ========================================= */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-amber-600">Pending Requests</h3>
            {pendingRequests.map((request) => (
              <motion.div
                key={request.relationshipId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-amber-900">
                    {request.full_name || request.nickname || request.email}
                  </p>
                  <p className="text-xs text-amber-700">Wants to link to your account</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-800 hover:bg-amber-100"
                    disabled={processingId !== null}
                    onClick={() => handleAction(request.relationshipId, "reject", request.full_name || request.email)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={processingId !== null}
                    onClick={() => handleAction(request.relationshipId, "approve", request.full_name || request.email)}
                  >
                    {processingId === request.relationshipId ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Approve
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ========================================= */}
        {/* ACTIVE CONFIRMED CONNECTIONS SECTION     */}
        {/* ========================================= */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Linked Parents ({parents.length})
          </h3>
          
          {parents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No parents linked yet</p>
              <p className="text-xs mt-1">Share your Student ID or Link Code with your parents</p>
            </div>
          ) : (
            <div className="space-y-2">
              {parents.map((parent) => (
                <motion.div
                  key={parent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {parent.profile_picture_url ? (
                        <img
                          src={parent.profile_picture_url}
                          alt={parent.full_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-xl">{parent.avatar_emoji || "👤"}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{parent.full_name || parent.nickname || parent.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Linked {new Date(parent.linked_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      <Shield className="w-3 h-3 mr-1" />
                      {parent.relationship}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={processingId !== null}
                      onClick={() => handleRemoveParent(parent.relationshipId, parent.full_name || parent.email)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}