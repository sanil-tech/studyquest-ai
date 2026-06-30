import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Eye, Key, User, RefreshCw, Trash2, GraduationCap, Award, Flame } from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

  const loadChildren = useCallback(async () => {
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
            let progress = null;
            let wallet = null;

            try {
              [progress, wallet] = await Promise.all([
                base44.entities.Progress.filter({ student_id: child.id }).then((r) => r[0] || null),
                base44.entities.Wallet.filter({ student_id: child.id }).then((r) => r[0] || null),
              ]);
            } catch (metaErr) {
              console.error(`Failed to load metadata for child ${child.id}:`, metaErr);
            }

            return {
              ...child,
              display_name: getDisplayName(child),
              progress,
              wallet,
              relationshipId: rel.id,
            };
          } catch (childErr) {
            console.error(`Failed to load core profile for relationship ${rel.id}:`, childErr);
            return null;
          }
        })
      );

      setChildren(childDetails.filter(Boolean));
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to load children", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

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

  const handleModalSuccess = () => {
    setShowAddModal(false);
    loadChildren();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Syncing learning profiles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            My Children
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor activity, manage security options, and review academic milestone accomplishments.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={loadChildren} disabled={loading} className="h-9 shadow-sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sync Dashboard
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="h-9 shadow-sm bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
            Add Child Account
          </Button>
        </div>
      </div>

      {/* Empty State Card */}
      {children.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 bg-muted/20 backdrop-blur-sm">
          <CardContent className="py-16 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">No learning profiles linked</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Link your student's existing account or configure a new workspace to track streaks and digital rewards.
            </p>
            <Button onClick={() => setShowAddModal(true)} size="default" className="shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Link First Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Main Profiles Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {children.map((child, index) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border border-border/50 bg-card hover:shadow-md hover:border-primary/30 dark:hover:border-primary/20 transition-all duration-300">
                  <div className="p-6 space-y-6">
                    {/* Header: Identity Block */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl blur group-hover:opacity-100 transition duration-300 opacity-60" />
                          <div className="relative w-14 h-14 rounded-2xl border border-primary/10 bg-muted flex items-center justify-center overflow-hidden shadow-sm">
                            {child.profile_picture_url || child.avatar_photo_url ? (
                              <img
                                src={child.profile_picture_url || child.avatar_photo_url}
                                alt={child.display_name}
                                className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <User className="w-7 h-7 text-primary/70" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <h3 className="text-lg font-bold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-[280px]">
                            {child.display_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground">
                            <span className="bg-muted px-2 py-0.5 rounded-md text-foreground/80">
                              {calculateAge(child.date_of_birth)} Yrs
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-primary">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {child.education_level || "Grade Unassigned"}
                            </span>
                          </div>
                          {child.school_name && (
                            <p className="text-xs text-muted-foreground/80 line-clamp-1 mt-1">
                              🏫 {child.school_name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Top Action Hook / Unlink Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={() => handleRemoveLink(child)}
                        title="Unlink profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Stats Dashboard Panel */}
                    <div className="grid grid-cols-3 gap-3 bg-muted/30 dark:bg-muted/10 border border-border/40 p-3 rounded-xl">
                      <div className="flex flex-col items-center justify-center text-center p-1.5">
                        <div className="flex items-center gap-1 text-primary mb-0.5">
                          <Award className="w-4 h-4 stroke-[2.5]" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rank</span>
                        </div>
                        <p className="text-xl font-black text-foreground">
                          {child.progress?.level || 1}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground/70">Current Level</span>
                      </div>

                      <div className="flex flex-col items-center justify-center text-center p-1.5 border-x border-border/50">
                        <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 mb-0.5">
                          <span className="text-sm font-bold">🪙</span>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wallet</span>
                        </div>
                        <p className="text-xl font-black text-amber-600 dark:text-amber-400">
                          {child.wallet?.balance || 0}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground/70">Available Coins</span>
                      </div>

                      <div className="flex flex-col items-center justify-center text-center p-1.5">
                        <div className="flex items-center gap-1 text-orange-500 mb-0.5">
                          <Flame className="w-4 h-4 fill-orange-500 stroke-none" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity</span>
                        </div>
                        <p className="text-xl font-black text-foreground">
                          {child.progress?.streak_days || 0}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground/70">Day Streak</span>
                      </div>
                    </div>

                    {/* Action Panel Group */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Link to="/parent" className="flex-1 min-w-[100px]">
                        <Button variant="default" size="sm" className="w-full h-9 bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none font-medium">
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Metrics Dashboard
                        </Button>
                      </Link>
                      
                      <Link to={`/parent/children/${child.id}`} className="flex-1 min-w-[100px]">
                        <Button variant="outline" size="sm" className="w-full h-9 font-medium shadow-sm">
                          <User className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          Edit Profile
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-[100px] h-9 font-medium shadow-sm"
                        onClick={() => {
                          setSelectedChild(child);
                          setShowCredentialManager(true);
                        }}
                      >
                        <Key className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                        Credentials
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Action Modals */}
      <AddChildModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onChildAdded={handleModalSuccess}
        onLinked={handleModalSuccess}
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