import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Eye, Key, User, RefreshCw, Trash2 } from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AddChildModal from "@/components/parent/AddChildModal";
import ChildCredentialManager from "@/components/parent/ChildCredentialManager";

export default function MyChildrenPage() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredentialManager, setShowCredentialManager] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const { toast } = useToast();

  const calculateAge = (birthDate) => {
    if (!birthDate) return "N/A";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const loadChildren = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      setUser(u);

      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: "active",
      });

      const childDetails = await Promise.all(
        relationships.map(async (rel) => {
          try {
            const child = await base44.entities.User.get(rel.child_id);
            const [progress, wallet] = await Promise.all([
              base44.entities.Progress.filter({ student_id: child.id }).then((r) => r[0]),
              base44.entities.Wallet.filter({ student_id: child.id }).then((r) => r[0]),
            ]);
            return {
              ...child,
              display_name: getDisplayName(child),
              progress,
              wallet,
              relationshipId: rel.id,
            };
          } catch {
            return null;
          }
        })
      );

      setChildren(childDetails.filter(Boolean));
      setLoading(false);
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to load children", variant: "destructive" });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const handleRemoveLink = async (child) => {
    if (!confirm(`Remove link to ${child.display_name}? This won't delete their account.`)) return;

    try {
      await base44.entities.ParentChildRelationship.update(child.relationshipId, { status: "inactive" });
      setChildren((prev) => prev.filter((c) => c.id !== child.id));
      toast({ title: "Link Removed", description: "You are no longer linked to this child." });
    } catch (err) {
      toast({ title: "Failed", description: err.message || "Could not remove link", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">My Children</h1>
          <p className="text-sm text-muted-foreground">Manage your children's learning profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadChildren} disabled={loading}>
            <RefreshCw className={loading ? "w-4 h-4 mr-2 animate-spin" : "w-4 h-4 mr-2"} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Child
          </Button>
        </div>
      </div>

      {children.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-bold text-foreground mb-2">No children linked yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your child's account to monitor their progress.</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child, index) => (
            <motion.div key={child.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
              <Card className="border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {child.profile_picture_url || child.avatar_photo_url ? (
                        <img src={child.profile_picture_url || child.avatar_photo_url} alt={child.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold truncate">{child.display_name}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{calculateAge(child.date_of_birth)} years</span>
                        <span>•</span>
                        <span>{child.education_level || "Not set"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{child.school_name || "No school set"}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-primary/5 rounded-lg p-2">
                      <p className="text-lg font-bold text-primary">{child.progress?.level || 1}</p>
                      <p className="text-[10px] text-muted-foreground">Level</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-amber-600">{child.wallet?.balance || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Coins</p>
                    </div>
                    <div className="bg-accent/5 rounded-lg p-2">
                      <p className="text-lg font-bold text-accent">{child.progress?.streak_days || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Day Streak</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link to={`/parent/children/${child.id}`} className="flex-1 min-w-[120px]">
                      <Button variant="outline" size="sm" className="w-full">
                        <User className="w-3 h-3 mr-1" />
                        Profile
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1 min-w-[120px]" onClick={() => { setSelectedChild(child); setShowCredentialManager(true); }}>
                      <Key className="w-3 h-3 mr-1" />
                      Credentials
                    </Button>
                    <Link to="/parent" className="flex-1 min-w-[120px]">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-3 h-3 mr-1" />
                        Progress
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveLink(child)}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AddChildModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onChildAdded={() => {
          setShowAddModal(false);
          loadChildren();
        }}
        onLinked={() => {
          setShowAddModal(false);
          loadChildren();
        }}
      />

      {selectedChild && (
        <ChildCredentialManager
          child={selectedChild}
          open={showCredentialManager}
          onOpenChange={(open) => {
            setShowCredentialManager(open);
            if (!open) setSelectedChild(null);
          }}
        />
      )}
    </div>
  );
}