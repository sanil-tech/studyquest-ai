import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users, Plus, Eye, Key, User, RefreshCw, Trash2, 
  GraduationCap, Award, Flame, ShieldAlert, Sparkles, 
  TrendingUp, Calendar, ArrowRight, Settings 
} from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
    if (!confirm(`Are you sure you want to unlink ${child.display_name}? They will lose access to parent-guided features.`)) return;
    try {
      await base44.entities.ParentChildRelationship.update(child.relationshipId, { status: "inactive" });
      setChildren((prev) => prev.filter((c) => c.id !== child.id));
      toast({ title: "Profile Unlinked", description: "The child profile link has been safely deactivated." });
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
          <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading parent portal telemetry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 pb-16">
      
      {/* Dynamic Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-muted/50 via-background to-background border border-border/60 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Parental Overview
            </h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 font-bold px-2.5 py-0.5">
              {children.length} {children.length === 1 ? 'Profile' : 'Profiles'} Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Track daily streaks, audit wallet distributions, and review continuous learning behavior metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <Button variant="outline" size="sm" onClick={loadChildren} disabled={loading} className="h-10 bg-background shadow-xs hover:bg-muted/50">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Activity
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="h-10 shadow-sm bg-primary hover:bg-primary/90 font-semibold px-4">
            <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
            Link Child Profile
          </Button>
        </div>
      </div>

      {/* Empty Slate Screen */}
      {children.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 bg-muted/20 backdrop-blur-xs">
          <CardContent className="py-20 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-xs">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No profiles connected</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Link your student's workspace account to monitor continuous level progressions, track streaks, and safely verify app credentials.
            </p>
            <Button onClick={() => setShowAddModal(true)} size="lg" className="shadow-md font-medium">
              <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
              Connect Student Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Profiles Monitoring Hub Grid */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence>
            {children.map((child, index) => {
              const currentXpPercentage = child.progress?.xp_score ? (child.progress.xp_score % 100) : 65;

              return (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, scale: 0.98, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <Card className="relative overflow-hidden border border-border/70 bg-card hover:shadow-lg hover:border-primary/40 dark:hover:border-primary/30 transition-all duration-300">
                    
                    {/* Status Strip Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/80 via-accent/80 to-transparent" />
                    
                    <div className="p-6 space-y-6">
                      
                      {/* Identity & Bio Module */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl border border-border bg-muted/60 flex items-center justify-center overflow-hidden shadow-inner">
                              {child.profile_picture_url || child.avatar_photo_url ? (
                                <img
                                  src={child.profile_picture_url || child.avatar_photo_url}
                                  alt={child.display_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-8 h-8 text-muted-foreground/70" />
                              )}
                            </div>
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border-2 border-background">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-xl font-bold tracking-tight text-foreground truncate max-w-[180px] sm:max-w-[260px]">
                              {child.display_name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground bg-muted/80 px-2 py-0.5 rounded-md">
                                Age {calculateAge(child.date_of_birth)}
                              </span>
                              <span>•</span>
                              <Badge variant="outline" className="border-primary/20 text-primary font-medium gap-1 bg-primary/5">
                                <GraduationCap className="w-3 h-3" />
                                {child.education_level || "Grade Unassigned"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            onClick={() => handleRemoveLink(child)}
                            title="Unlink profile connection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Level Milestones Metrics Progress Rail */}
                      <div className="space-y-2 bg-muted/20 dark:bg-muted/5 border border-border/40 rounded-xl p-3.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                            <TrendingUp className="w-3.5 h-3.5 text-primary" />
                            <span>Milestone Progress</span>
                          </div>
                          <span className="font-bold text-foreground">Level {child.progress?.level || 1}</span>
                        </div>
                        <Progress value={currentXpPercentage} className="h-2 bg-muted-foreground/10" />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 font-medium">
                          <span>XP Progression</span>
                          <span>Next Level Target</span>
                        </div>
                      </div>

                      {/* Main Telemetry Panel */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/50 bg-background/50 text-center">
                          <div className="p-1.5 rounded-lg bg-primary/5 text-primary mb-1">
                            <Award className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <p className="text-xl font-black tracking-tight text-foreground">
                            {child.progress?.level || 1}
                          </p>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Level Rank</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/50 bg-background/50 text-center">
                          <div className="p-1.5 rounded-lg bg-amber-500/5 text-amber-500 mb-1">
                            <span className="text-sm font-bold">🪙</span>
                          </div>
                          <p className="text-xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                            {child.wallet?.balance || 0}
                          </p>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Coin Inventory</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/50 bg-background/50 text-center">
                          <div className="p-1.5 rounded-lg bg-orange-500/5 text-orange-500 mb-1">
                            <Flame className="w-4 h-4 fill-orange-500 stroke-none" />
                          </div>
                          <p className="text-xl font-black tracking-tight text-foreground">
                            {child.progress?.streak_days || 0}
                          </p>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Streak</span>
                        </div>
                      </div>

                      {/* Parent Supervision Navigation System */}
                      <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center gap-2">
                        <Link to="/parent" className="w-full sm:flex-1">
                          <Button variant="default" size="sm" className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-xs gap-2 group">
                            <Eye className="w-4 h-4" />
                            Monitor Analytics
                            <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-60 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </Link>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Link to={`/parent/children/${child.id}`} className="flex-1 sm:flex-initial" title="Configure Core Profiles">
                            <Button variant="outline" size="sm" className="w-full h-10 font-semibold px-3 text-muted-foreground hover:text-foreground shadow-xs">
                              <User className="w-4 h-4 sm:mr-0" />
                              <span className="sm:hidden ml-2">Edit Account</span>
                            </Button>
                          </Link>

                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-initial h-10 font-semibold px-3 text-muted-foreground hover:text-foreground shadow-xs gap-2"
                            onClick={() => {
                              setSelectedChild(child);
                              setShowCredentialManager(true);
                            }}
                            title="Manage Passwords & Credentials"
                          >
                            <Key className="w-4 h-4" />
                            <span className="sm:hidden">Credentials Access</span>
                          </Button>
                        </div>
                      </div>

                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Account Creation / Verification Overlays */}
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