import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Coins, Trophy, Clock, TrendingUp, UserPlus, CheckSquare, BookOpen, Loader2, Pen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import moment from "moment";

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingLinkRequests, setPendingLinkRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [editFormData, setEditFormData] = useState({ full_name: "", school_year: "", school_name: "", class_name: "", avatar_emoji: "" });
  const [error, setError] = useState("");
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setError("");
      const u = await base44.auth.me();
      setUser(u);

      // Load all link requests matching this parent's email
      const linkReqs = await base44.entities.LinkRequest.filter({ parent_email: u.email });
      const pendingLinks = linkReqs.filter(r => r.status === "pending");
      setPendingLinkRequests(pendingLinks);

      // Approved links = linked children
      const approvedLinks = linkReqs.filter(r => r.status === "approved");
      const studentIds = approvedLinks.map(r => r.student_id);

      if (studentIds.length > 0) {
        const [childrenData, allPendingReqs, usersData] = await Promise.all([
          Promise.all(
            studentIds.map(async (sid, idx) => {
              const [progresses, wallets, attempts, sessions] = await Promise.all([
                base44.entities.Progress.filter({ student_id: sid }),
                base44.entities.Wallet.filter({ student_id: sid }),
                base44.entities.QuizAttempt.filter({ student_id: sid }, "-created_date", 5),
                base44.entities.StudySession.filter({ student_id: sid }, "-created_date", 50),
              ]);
              const weekAgo = moment().subtract(7, "days").toDate();
              const weeklySessions = sessions.filter(s => new Date(s.created_date) >= weekAgo);
              const weeklyMinutes = weeklySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
              return {
                id: sid,
                name: approvedLinks[idx].student_name || "Student",
                progress: progresses[0] || { total_xp: 0, level: 1, streak_days: 0, total_study_time: 0 },
                wallet: wallets[0] || { balance: 0 },
                recentAttempts: attempts || [],
                recentSessions: sessions.slice(0, 5),
                weeklyMinutes,
                sessionCount: sessions.length,
              };
            })
          ),
          Promise.all(
            studentIds.map(sid =>
              base44.entities.RewardRequest.filter({ student_id: sid, status: "pending" }, "-created_date", 20)
            )
          ),
          Promise.all(
            studentIds.map(sid => base44.entities.User.get(sid))
          ),
        ]);
        // Merge user data into children data
        const childrenWithUserData = childrenData.map((child, idx) => ({
          ...child,
          userData: usersData[idx] || {},
        }));
        setChildren(childrenWithUserData);
        setPendingRequests(allPendingReqs.flat());
      } else {
        setChildren([]);
        setPendingRequests([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Realtime: refresh when any LinkRequest changes (e.g. student accepts)
  useEffect(() => {
    const unsubscribeLink = base44.entities.LinkRequest.subscribe(() => {
      loadData();
    });
    // Also subscribe to User changes for real-time name/avatar updates
    const unsubscribeUser = base44.entities.User.subscribe(() => {
      loadData();
    });
    return () => {
      unsubscribeLink();
      unsubscribeUser();
    };
  }, []);

  const linkChild = async () => {
    setLinking(true);
    try {
      const existing = await base44.entities.LinkRequest.filter({
        student_email: linkEmail,
        parent_email: user.email,
      });
      const existingReq = existing[0];
      if (existingReq?.status === "approved") {
        toast({ title: "Already linked", description: "This student is already linked.", variant: "destructive" });
        return;
      }
      if (existingReq?.status === "pending") {
        toast({ title: "Request already sent", description: "Waiting for your child to accept.", variant: "destructive" });
        return;
      }

      await base44.entities.LinkRequest.create({
        student_email: linkEmail.trim(),
        parent_email: user.email,
        parent_id: user.id,
        parent_name: user.full_name || "Parent",
        initiated_by: "parent",
        status: "pending",
      });

      setDialogOpen(false);
      setLinkEmail("");
      toast({ title: "Link request sent! 🎉", description: "Your child can accept it from their Profile page." });
      loadData();
    } catch (err) {
      toast({ title: "Failed to send", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLinking(false);
    }
  };

  const openEditProfile = (child) => {
    setEditingChild(child);
    setEditFormData({
      full_name: child.userData?.full_name || child.name || "",
      school_year: child.userData?.school_year || "",
      school_name: child.userData?.school_name || "",
      class_name: child.userData?.class_name || "",
      avatar_emoji: child.userData?.avatar_emoji || "🎓",
    });
    setEditDialogOpen(true);
  };

  const handleSaveChildProfile = async () => {
    try {
      await base44.entities.User.update(editingChild.id, editFormData);
      toast({ title: "Profile updated! ✨", description: "Changes are now visible to your child." });
      setEditDialogOpen(false);
      loadData();
    } catch (err) {
      toast({ title: "Failed to update", description: err.message || "Something went wrong", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Parent Dashboard 👨‍👩‍👧</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your child's progress</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <UserPlus className="w-4 h-4 mr-1" /> Link Child
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link a Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Student's email address"
                value={linkEmail}
                onChange={e => setLinkEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your child will need to accept the request from their Profile page.
              </p>
              <Button onClick={linkChild} disabled={linking || !linkEmail} className="w-full rounded-xl">
                {linking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Link Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit child profile dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {editingChild?.name || "Child"}'s Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl mx-auto mb-2">
                  {editFormData.avatar_emoji || "🎓"}
                </div>
                <p className="text-xs text-muted-foreground">Avatar: {editFormData.avatar_emoji || "🎓"}</p>
              </div>
              <div>
                <Label>Full Name</Label>
                <Input
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Student's full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Year Level</Label>
                <Select value={editFormData.school_year} onValueChange={(v) => setEditFormData(prev => ({ ...prev, school_year: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard 1">Standard 1</SelectItem>
                    <SelectItem value="Standard 2">Standard 2</SelectItem>
                    <SelectItem value="Standard 3">Standard 3</SelectItem>
                    <SelectItem value="Standard 4">Standard 4</SelectItem>
                    <SelectItem value="Standard 5">Standard 5</SelectItem>
                    <SelectItem value="Standard 6">Standard 6</SelectItem>
                    <SelectItem value="Form 1">Form 1</SelectItem>
                    <SelectItem value="Form 2">Form 2</SelectItem>
                    <SelectItem value="Form 3">Form 3</SelectItem>
                    <SelectItem value="Form 4">Form 4</SelectItem>
                    <SelectItem value="Form 5">Form 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>School Name</Label>
                <Input
                  value={editFormData.school_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, school_name: e.target.value }))}
                  placeholder="e.g. SK Taman Jaya"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Class</Label>
                <Input
                  value={editFormData.class_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, class_name: e.target.value }))}
                  placeholder="e.g. 1A, 3B"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSaveChildProfile} className="w-full rounded-xl">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending link requests sent by parent — waiting for student to accept */}
      {pendingLinkRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-border/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold">Pending Link Requests</h2>
          </div>
          <div className="space-y-2">
            {pendingLinkRequests.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {req.student_email?.[0]?.toUpperCase() || "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{req.student_email}</p>
                  <p className="text-xs text-muted-foreground">Waiting for student to accept</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                  onClick={async () => {
                    await base44.entities.LinkRequest.delete(req.id);
                    toast({ title: "Request cancelled" });
                    loadData();
                  }}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pending reward requests — always visible */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border/50 p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            <h2 className="font-heading font-semibold">Reward Approvals</h2>
          </div>
          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            {pendingRequests.length} pending
          </span>
        </div>
        {pendingRequests.length > 0 ? (
          <div className="space-y-2">
            {pendingRequests.map(req => {
              const child = children.find(c => c.id === req.student_id);
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <Coins className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{req.reward_title}</p>
                    <p className="text-xs text-muted-foreground">{child?.name || "Student"} · {moment(req.created_date).fromNow()}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{req.coin_cost}🪙</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending reward requests.</p>
          </div>
        )}
      </motion.div>

      {/* Children overview */}
      {children.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-border/50">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No children linked yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Link a student to see their progress.</p>
        </div>
      ) : (
        children.map((child, ci) => (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.1 }}
            className="bg-white rounded-2xl border border-border/50 overflow-hidden"
          >
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-lg">{child.userData?.full_name || child.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{child.sessionCount} total sessions · {child.weeklyMinutes}m this week</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-8"
                onClick={() => openEditProfile(child)}
              >
                <Pen className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2 p-4">
              <div className="text-center p-3 rounded-xl bg-purple-50">
                <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="font-bold text-sm text-purple-700">Lv {child.progress.level}</p>
                <p className="text-[10px] text-purple-500">Level</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50">
                <Coins className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="font-bold text-sm text-amber-700">{child.wallet.balance}</p>
                <p className="text-[10px] text-amber-500">Coins</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-orange-50">
                <Trophy className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="font-bold text-sm text-orange-700">{child.progress.total_xp}</p>
                <p className="text-[10px] text-orange-500">XP</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-blue-50">
                <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="font-bold text-sm text-blue-700">{child.progress.streak_days}</p>
                <p className="text-[10px] text-blue-500">Streak</p>
              </div>
            </div>

            {/* Recent lessons */}
            <div className="px-4 pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Lessons</h3>
              {child.recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {child.recentSessions.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                      <span className="truncate">{s.topic_name || "Lesson"}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {moment(s.created_date).format("DD MMM, h:mm a")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  No lessons started yet
                </div>
              )}
            </div>

            {/* Recent quizzes */}
            <div className="px-4 pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Quizzes</h3>
              {child.recentAttempts.length > 0 ? (
                <div className="space-y-2">
                  {child.recentAttempts.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                      <span className="truncate">{a.topic_name || "Quiz"}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-bold ${a.score >= 80 ? "text-emerald-600" : a.score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                          {a.score}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {moment(a.created_date).fromNow()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  No quizzes taken yet
                </div>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}