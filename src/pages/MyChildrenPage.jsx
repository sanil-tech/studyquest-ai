import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, UserPlus, Eye, Key, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
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
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const loadChildren = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      setUser(u);

      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: "active"
      });

      const childDetails = await Promise.all(
        relationships.map(async (rel) => {
          try {
            const child = await base44.entities.User.get(rel.child_id);

            // ===============================
            // 🔥 SINGLE SOURCE OF TRUTH FIX
            // ===============================
            const displayName =
              child.display_name?.trim() ||
              child.full_name?.trim() ||
              "Student";

            const [progress, wallet] = await Promise.all([
              base44.entities.Progress.filter({ student_id: child.id }).then(r => r[0]),
              base44.entities.Wallet.filter({ student_id: child.id }).then(r => r[0])
            ]);

            return {
              ...child,
              display_name: displayName,
              progress,
              wallet,
              relationshipId: rel.id
            };

          } catch (err) {
            console.error(`Failed to fetch child ${rel.child_id}:`, err.message);
            return null;
          }
        })
      );

      const validChildren = childDetails.filter(Boolean);
      setChildren(validChildren);

    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to load children",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    const unsubscribe = base44.entities.ParentChildRelationship.subscribe(() => {
      loadChildren();
    });
    return () => unsubscribe();
  }, []);

  const handleRemoveLink = async (childId, relationshipId, childName) => {
    if (!confirm(`Remove link to ${childName}? This won't delete their account.`)) return;

    try {
      await base44.entities.ParentChildRelationship.update(relationshipId, {
        status: "inactive"
      });

      setChildren(prev => prev.filter(c => c.id !== childId));

      toast({
        title: "Link Removed",
        description: "Child unlinked successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to remove link",
        variant: "destructive",
      });
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

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Children</h1>
          <p className="text-sm text-muted-foreground">
            Manage your children's learning profiles
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadChildren}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Child
          </Button>
        </div>
      </div>

      {/* EMPTY STATE */}
      {children.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-bold mb-2">No children linked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first child to start tracking learning progress
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/50 transition">

                <CardHeader>
                  <div className="flex items-center gap-3">

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {child.profile_picture_url ? (
                        <img
                          src={child.profile_picture_url}
                          className="w-full h-full object-cover"
                          alt={child.display_name}
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    {/* NAME (FIXED — NO FALLBACK CHAOS) */}
                    <div>
                      <CardTitle className="text-lg">
                        {child.display_name}
                      </CardTitle>

                      <p className="text-xs text-muted-foreground">
                        {calculateAge(child.date_of_birth)} years • {child.education_level || "Not set"}
                      </p>
                    </div>

                  </div>
                </CardHeader>

                <CardContent className="space-y-3">

                  {/* STATS */}
                  <div className="grid grid-cols-3 text-center gap-2">

                    <div className="bg-primary/5 rounded p-2">
                      <p className="font-bold">{child.progress?.level || 1}</p>
                      <p className="text-xs text-muted-foreground">Level</p>
                    </div>

                    <div className="bg-amber-50 rounded p-2">
                      <p className="font-bold">{child.wallet?.balance || 0}</p>
                      <p className="text-xs text-muted-foreground">Coins</p>
                    </div>

                    <div className="bg-green-50 rounded p-2">
                      <p className="font-bold">{child.progress?.streak_days || 0}</p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>

                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-2 pt-2">

                    <Link to={`/parent/children/${child.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Profile
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedChild(child);
                        setShowCredentialManager(true);
                      }}
                    >
                      Credentials
                    </Button>

                    <Link to="/parent" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Progress
                      </Button>
                    </Link>

                  </div>

                </CardContent>

              </Card>
            </motion.div>
          ))}

        </div>
      )}

      {/* MODALS */}
      <AddChildModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onLinked={loadChildren}
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