import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, X, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ParentConnections({ user }) {
  const { toast } = useToast();
  const [parents, setParents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, [user?.id]);

  const loadConnections = async () => {
    try {
      // Get active parent relationships
      const relationships = await base44.entities.ParentChildRelationship.filter({
        child_id: user.id,
        status: 'active'
      });

      // Get parent details
      const parentDetails = await Promise.all(
        relationships.map(async (rel) => {
          const parentUsers = await base44.entities.User.filter({ id: rel.parent_id });
          if (parentUsers.length === 0) return null;
          return {
            ...parentUsers[0],
            relationshipId: rel.id,
            relationship: rel.relationship,
            linked_at: rel.linked_at
          };
        })
      );

      setParents(parentDetails.filter(p => p !== null));

      // Get pending LinkRequests
      const pending = await base44.entities.LinkRequest.filter({
        student_id: user.id,
        status: 'pending',
        initiated_by: 'parent'
      });

      setPendingRequests(pending);
    } catch (err) {
      console.error("Failed to load parent connections:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId, parentId, parentName) => {
    try {
      // Update LinkRequest
      await base44.entities.LinkRequest.update(requestId, {
        status: 'approved',
        student_id: user.id
      });

      // Create ParentChildRelationship
      await base44.entities.ParentChildRelationship.create({
        parent_id: parentId,
        child_id: user.id,
        relationship: 'parent',
        status: 'active',
        linked_at: new Date().toISOString()
      });

      // Update parent's linked_student_ids
      const parent = await base44.entities.User.filter({ id: parentId });
      if (parent.length > 0) {
        const currentLinked = parent[0].linked_student_ids || [];
        if (!currentLinked.includes(user.id)) {
          // Note: Can't directly update other users, but the relationship entity handles the link
        }
      }

      toast({
        title: "Parent Linked!",
        description: `${parentName} can now view your progress`,
      });

      loadConnections();
    } catch (err) {
      toast({
        title: "Approval Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await base44.entities.LinkRequest.update(requestId, {
        status: 'rejected'
      });

      toast({
        title: "Request Rejected",
        description: "The link request has been declined",
      });

      loadConnections();
    } catch (err) {
      toast({
        title: "Rejection Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRemoveParent = async (relationshipId, parentName) => {
    if (!confirm(`Are you sure you want to remove ${parentName} from your connected parents? They will no longer be able to see your progress.`)) {
      return;
    }

    try {
      await base44.entities.ParentChildRelationship.update(relationshipId, {
        status: 'inactive'
      });

      toast({
        title: "Parent Removed",
        description: `${parentName} is no longer linked to your account`,
      });

      loadConnections();
    } catch (err) {
      toast({
        title: "Removal Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
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
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Requests</h3>
            {pendingRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-amber-900">{request.parent_name || request.parent_email}</p>
                  <p className="text-xs text-amber-700">Wants to link to your account</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(request.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveRequest(request.id, request.parent_id, request.parent_name)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Connected Parents */}
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
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      {parent.relationship || 'Parent'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveParent(parent.relationshipId, parent.full_name || parent.nickname || parent.email)}
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