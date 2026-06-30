import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, Check, X, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function StudentParentConnections({ studentId }) {
  const { toast } = useToast();
  const [activeConnections, setActiveConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (studentId) {
      loadConnections();
    }
  }, [studentId]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      
      // Fetch data using Base44 filter parameters
      const [activeData, pendingData] = await Promise.all([
        base44.entities.ParentChildRelationship.filter({
          child_id: studentId,
          status: "active"
        }),
        base44.entities.LinkRequest.filter({
          student_id: studentId,
          status: "pending"
        })
      ]);

      setActiveConnections(activeData || []);
      setPendingRequests(pendingData || []);
    } catch (err) {
      console.error("Failed to load connection workflows:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (request, action) => {
    setProcessingId(request.id);
    try {
      if (action === "accept") {
        // 1. Progress approval status in LinkRequest collection
        await base44.entities.LinkRequest.update(request.id, { status: "approved" });

        // 2. Spawn verified mapping row inside ParentChildRelationship record layout
        await base44.entities.ParentChildRelationship.create({
          parent_id: request.parent_id,
          child_id: studentId,
          relationship: "parent",
          status: "active",
          linked_at: new Date().toISOString()
        });

        toast({
          title: "Connection Linked!",
          description: "You are now successfully linked with your parent.",
        });
      } else {
        // Mark as declined to strip visibility parameters
        await base44.entities.LinkRequest.update(request.id, { status: "declined" });
        toast({
          title: "Request Declined",
          description: "The incoming link request was ignored.",
        });
      }

      await loadConnections();
    } catch (err) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to finalize workflow.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-6 text-sm text-muted-foreground animate-pulse">Checking approval logs...</div>;
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-primary" />
          Parent Connections
        </CardTitle>
        <CardDescription>
          Manage parents who have access to monitor your learning tracks and progression.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Pending Parent Link Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending Requests ({pendingRequests.length})
            </h4>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-amber-200 bg-amber-50/50 rounded-lg gap-3"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {request.parent_name || "Parent Request"}
                    </p>
                    <p className="text-xs text-muted-foreground">{request.parent_email || "Pending verification"}</p>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-amber-300 text-amber-800 hover:bg-amber-100"
                      onClick={() => handleAction(request, "decline")}
                      disabled={processingId !== null}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Decline
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => handleAction(request, "accept")}
                      disabled={processingId !== null}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmed Active Supervisor Mappings */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Linked Parents ({activeConnections.length})
          </h4>

          {activeConnections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg bg-muted/20">
              <User className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No linked supervision accounts detected.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {activeConnections.map((conn) => (
                <div 
                  key={conn.id} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {conn.parent_name || conn.parent_email || "Linked Profile"}
                      </p>
                      <p className="text-xs text-muted-foreground">Authorized Supervisor</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}