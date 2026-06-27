import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, UserPlus, Search, X, ChevronRight, Eye, Trash2, Key, User, Edit2 } from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      const u = await base44.auth.me();
      setUser(u);

      // Get linked children from ParentChildRelationship
      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: "active"
      });

      console.log(`Loaded ${relationships.length} relationships for parent ${u.id}`);

      // Fetch child details
      const childDetails = await Promise.all(
        relationships.map(async (rel) => {
          try {
            const child = await base44.entities.User.get(rel.child_id);
            const displayName = getDisplayName(child);
            console.log(`Fetched child ${rel.child_id}:`, { 
              full_name: child.full_name, 
              nickname: child.nickname,
              username: child.username,
              student_id: child.student_id,
              computed_display_name: displayName
            });
            child.display_name = displayName;
            const [progress, wallet] = await Promise.all([
              base44.entities.Progress.filter({ student_id: child.id }).then(r => r[0]),
              base44.entities.Wallet.filter({ student_id: child.id }).then(r => r[0])
            ]);

            return {
              ...child,
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

      const validChildren = childDetails.filter(c => c !== null);
      console.log(`Loaded ${validChildren.length} children with details`);
      setChildren(validChildren);
    } catch (err) {
      console.error("Failed to load children:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  // Subscribe to relationship changes for real-time updates
  useEffect(() => {
    const unsubscribe = base44.entities.ParentChildRelationship.subscribe(() => {
      console.log('Relationship changed, reloading children...');
      loadChildren();
    });
    return () => unsubscribe();
  }, []);

  const handleRemoveLink = async (childId, relationshipId, childName) => {
    if (!confirm(`Remove link to ${childName}? This won't delete their account.`)) return;

    try {
      await base44.entities.ParentChildRelationship.update(relationshipId, {
        status: 'inactive'
      });

      setChildren(prev => prev.filter(c => c.id !== childId));
      toast({
        title: "Link Removed",
        description: "You are no longer linked to this child.",
      });
    } catch (err) {
      toast({
        title: "Failed",
        description: err.message || "Could not remove link",
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">My Children</h1>
          <p className="text-sm text-muted-foreground">Manage your children's learning profiles</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Child
        </Button>
      </div>

      {/* Children Grid */}
      {children.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-bold text-foreground mb-2">No children linked yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Link your child's account to monitor their progress
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Link Your First Child
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
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {child.profile_picture_url || child.avatar_photo_url ? (
                        <img
                          src={child.profile_picture_url || child.avatar_photo_url}
                          alt={child.display_name || getDisplayName(child)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold">
                        {child.display_name || getDisplayName(child)}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{calculateAge(child.date_of_birth)} years</span>
                        <span>•</span>
                        <span>{child.education_level || "Not set"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{child.school_name || "No school set"}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Progress Stats */}
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
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{child.progress?.level || 1}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min((child.progress?.level || 1) * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Link
                      to={`/parent/children/${child.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <User className="w-3 h-3 mr-1" />
                        View Profile
                      </Button>
                    </Link>
                    <Link
                      to={`/parent/children/${child.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit Profile
                      </Button>
                    </Link>
                    <Link
                      to="/parent"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-3 h-3 mr-1" />
                        View Progress
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Child Modal */}
      <AddChildModal
        open={showAddModal}
        onOpenChange={(open) => {
          if (!open) setShowAddModal(false);
        }}
        onLinked={() => {
          setShowAddModal(false);
          // Refresh data immediately (subscription will also trigger)
          setLoading(true);
          loadChildren();
        }}
      />

      {/* Credential Manager */}
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