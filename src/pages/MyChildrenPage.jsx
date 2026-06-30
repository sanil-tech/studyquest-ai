import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users, Plus, Eye, Key, User, RefreshCw, Trash2, 
  GraduationCap, Award, Flame, ShieldAlert, Sparkles, 
  TrendingUp, Calendar, ArrowRight, Settings, X, Search, AlertCircle, ShieldCheck, UserPlus
} from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ChildCredentialManager from "@/components/parent/ChildCredentialManager";
// 1. IMPORT YOUR ADD CHILD MODAL (Verify path matching)
import AddChildModal from "@/components/parent/AddChildModal"; 

export default function MyChildrenPage() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false); // Controls the ID Linking Modal
  
  // 2. ADD STATE FOR THE CREATION MODAL
  const [showCreateModal, setShowCreateModal] = useState(false); 
  
  const [showCredentialManager, setShowCredentialManager] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  
  // --- STUDENT ID LINKING INTERFACE STATES ---
  const [studentIdInput, setStudentIdInput] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

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
      setModalError("");
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

  // ============================================================================
  // SECURE UNIQUE STUDENT ID LINKING CONTROLLER
  // ============================================================================
  const handleLinkStudentById = async (e) => {
    e.preventDefault();
    const cleanId = studentIdInput.trim();

    if (!cleanId) {
      setModalError("Please specify a valid alphanumeric student tracking key.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    try {
      let targetedStudent;
      try {
        targetedStudent = await base44.entities.User.get(cleanId);
      } catch (err) {
        throw new Error("No active student profiles discovered matching this custom unique ID.");
      }

      if (targetedStudent.id === user.id) {
        throw new Error("Invalid operation: You cannot link a parental dashboard back to yourself.");
      }

      const preExisting = await base44.entities.ParentChildRelationship.filter({
        parent_id: user.id,
        child_id: cleanId,
        status: "active",
      });

      if (preExisting && preExisting.length > 0) {
        throw new Error("This profile account link is already securely bound to your dashboard.");
      }

      await base44.entities.ParentChildRelationship.create({
        parent_id: user.id,
        child_id: cleanId,
        status: "active",
      });

      toast({
        title: "Profile Linked! 🎉",
        description: `Successfully added ${getDisplayName(targetedStudent)} to your monitoring grid.`,
      });

      setStudentIdInput("");
      setShowAddModal(false);
      loadChildren();
    } catch (err) {
      setModalError(err.message || "Network exception saving database tracking pointers.");
    } finally {
      setModalSubmitting(false);
    }
  };

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
        
        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <Button variant="outline" size="sm" onClick={loadChildren} disabled={loading} className="h-10 bg-background shadow-xs hover:bg-muted/50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
          
          <Button variant="outline" onClick={() => setShowAddModal(true)} className="h-10 shadow-xs border-dashed font-semibold px-4">
            <Search className="w-4 h-4 mr-2" />
            Link Existing ID
          </Button>

          {/* 3. NEW ADD CHILD ACCOUNT TRIGGER BUTTON */}
          <Button onClick={() => setShowCreateModal(true)} className="h-10 shadow-sm bg-primary hover:bg-primary/90 font-semibold px-4">
            <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
            Create Child Profile
          </Button>
        </div>
      </div>

      {/* Empty Slate Screen */}
      {children.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 bg-muted/20 backdrop-blur-xs">
          <CardContent className="py-20 text-center max-w-md mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto shadow-xs">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">No profiles connected</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get started by creating a managed child account or linking an existing workspace mapping.
              </p>
            </div>
            
            {/* Split Options inside empty slate */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => setShowAddModal(true)} className="font-medium">
                <Search className="w-4 h-4 mr-2" />
                Link Existing ID
              </Button>
              <Button onClick={() => setShowCreateModal(true)} className="shadow-md font-medium">
                <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
                Create New Profile
              </Button>
            </div>
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
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/80 via-accent/80 to-transparent" />
                    
                    <div className="p-6 space-y-6">
                      
                      {/* Identity Module */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl border border-border bg-muted/60 flex items-center justify-center overflow-hidden shadow-inner">
                              {child.profile_picture_url || child.avatar_photo_url ? (
                                <img
                                  src={child.profile_picture_url || child.avatar_photo_url}
                                  alt={child.display_name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
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

                        <div>
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

                      {/* ID Hash Section */}
                      <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-between bg-muted/30 p-2 rounded-xl border border-border/20">
                        <span>STUDENT UNIQUE HASH:</span>
                        <span className="font-mono bg-background px-2 py-0.5 rounded border text-foreground font-semibold">
                          {child.id}
                        </span>
                      </div>

                      {/* Progress Rail */}
                      <div className="space-y-2 bg-muted/20 dark:bg-muted/5 border border-border/40 rounded-xl p-3.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                            <TrendingUp className="w-3.5 h-3.5 text-primary" />
                            <span>Milestone Progress</span>
                          </div>
                          <span className="font-bold text-foreground">Level {child.progress?.level || 1}</span>
                        </div>
                        <Progress value={currentXpPercentage} className="h-2 bg-muted-foreground/10" />
                      </div>

                      {/* Telemetry Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/50 bg-background/50 text-center">
                          <div className="p-1.5 rounded-lg bg-primary/5 text-primary mb-1">
                            <Award className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <p className="text-xl font-black tracking-tight text-foreground">{child.progress?.level || 1}</p>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Level Rank</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/50 bg-background/50 text-center">
                          <div className="p-1.5 rounded-lg bg-amber-500/5 text-amber-500 mb-1">
                            <span className="text-sm font-bold">🪙</span>
                          </div>
                          <p className="text-xl font-black tracking-tight text-amber-600 dark:text-amber-400">{child.wallet?.balance || 0}</p>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Coins</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/50 bg-background/50 text-center">
                          <div className="p-1.5 rounded-lg bg-orange-500/5 text-orange-500 mb-1">
                            <Flame className="w-4 h-4 fill-orange-500 stroke-none" />
                          </div>
                          <p className="text-xl font-black tracking-tight text-foreground">{child.progress?.streak_days || 0}</p>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Streak</span>
                        </div>
                      </div>

                      {/* Navigation Systems */}
                      <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center gap-2">
                        <Link to="/parent" className="w-full sm:flex-1">
                          <Button variant="default" size="sm" className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-xs gap-2 group">
                            <Eye className="w-4 h-4" />
                            Monitor Analytics
                            <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-60 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </Link>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Link to={`/parent/children/${child.id}`} className="flex-1 sm:flex-initial">
                            <Button variant="outline" size="sm" className="w-full h-10 font-semibold px-3 text-muted-foreground hover:text-foreground shadow-xs">
                              <User className="w-4 h-4" />
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
                          >
                            <Key className="w-4 h-4" />
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

      {/* ============================================================================
          LINK EXISTING STUDENT DIALOG OVERLAY (By ID Hash Key)
          ============================================================================ */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!modalSubmitting) setShowAddModal(false); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="bg-card text-card-foreground border rounded-2xl p-6 shadow-xl max-w-md w-full relative z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-lg tracking-tight text-foreground">Link Account Registry</h3>
                </div>
                <button 
                  disabled={modalSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect an existing student account to your manager dashboard view by entering their system generated unique ID code.
              </p>

              {modalError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleLinkStudentById} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={modalSubmitting}
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    placeholder="e.g. usr_8k92f1m04..."
                    className="w-full text-xs font-mono font-bold tracking-wider pl-9 pr-4 py-3 bg-muted/40 border border-input rounded-xl text-foreground focus:outline-none focus:border-primary transition-all duration-150"
                  />
                  <Search className="w-3.5 h-3.5 text-muted-foreground/40 absolute left-3 top-3.5" />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={modalSubmitting}
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl text-xs font-semibold text-muted-foreground h-10 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={modalSubmitting}
                    className="rounded-xl bg-primary text-primary-foreground font-semibold h-10 px-5 shadow-xs"
                  >
                    {modalSubmitting ? "Verifying..." : "Link Profile"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================================
          4. NEW CODE: ADD CHILD PROFILES CREATION LAYER MODAL
          ============================================================================ */}
      <AddChildModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onClose={() => setShowCreateModal(false)}
        onChildAdded={loadChildren}
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