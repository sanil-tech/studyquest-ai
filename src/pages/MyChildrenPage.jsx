import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Loader2, Plus, Coins, Zap, Flame, GraduationCap, Settings, UserPlus, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function ParentChildrenDashboard() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  
  // Form State matching backend requirements
  const [newChild, setNewChild] = useState({
    full_name: "",
    nickname: "",
    date_of_birth: "",
  });

  // Fetch the logged-in parent
  const { data: parent, isLoading: isLoadingParent } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me()
  });

  // Fetch children
  const { data: children, isLoading: isLoadingChildren, error } = useQuery({
    queryKey: ["parent-children"],
    enabled: !!parent?.id,
    queryFn: async () => {
      // You can also fetch by linked_parent_id as per your backend schema
      return await base44.entities.User.filter({ 
        linked_parent_id: parent.id,
        app_role: "student" 
      });
    }
  });

  // Invoke the custom backend function
  const addChildMutation = useMutation({
    mutationFn: async (childData) => {
      const response = await base44.functions.invoke("createChildAccount", {
        childData: {
          full_name: childData.full_name,
          nickname: childData.nickname,
          date_of_birth: childData.date_of_birth,
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to create account");
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast({ title: "Success!", description: "Child profile created." });
      queryClient.invalidateQueries(["parent-children"]); // Refresh UI
      queryClient.invalidateQueries(["me"]); // Refresh parent data
      
      // Show credentials to the parent
      setCreatedCredentials(data.child);
      
      // Reset form
      setNewChild({ full_name: "", nickname: "", date_of_birth: "" });
    },
    onError: (err) => {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to create child profile.", 
        variant: "destructive" 
      });
    }
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addChildMutation.mutate(newChild);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Copied to clipboard." });
  };

  const closeAndResetModal = () => {
    setIsAddModalOpen(false);
    setTimeout(() => setCreatedCredentials(null), 300);
  };

  const isLoading = isLoadingParent || isLoadingChildren;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-destructive">Failed to load children.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Children</h1>
          <p className="text-muted-foreground mt-1">Monitor progress, coins, and learning streaks.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Child Profile
        </Button>
      </div>

      {!children || children.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed rounded-2xl text-muted-foreground bg-card/50">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No children added yet</h3>
          <p>Create a child account to start tracking their StudyQuest progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}

      {/* --- Add Child Modal --- */}
      <Dialog open={isAddModalOpen} onOpenChange={closeAndResetModal}>
        <DialogContent className="sm:max-w-[450px]">
          {createdCredentials ? (
            // SUCCESS SCREEN - Show Generated Credentials
            <div className="py-6 space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Account Created!</h3>
                <p className="text-sm text-muted-foreground">
                  Please save these login details. Your child will need them to log in.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-xl space-y-4 text-left border">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Student ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-background p-2 rounded border font-mono text-lg font-bold">
                      {createdCredentials.student_id}
                    </code>
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdCredentials.student_id)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Password</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-background p-2 rounded border font-mono text-lg font-bold">
                      {createdCredentials.password}
                    </code>
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdCredentials.password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={closeAndResetModal}>
                Done
              </Button>
            </div>
          ) : (
            // CREATION FORM
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Add a Child Profile
                </DialogTitle>
                <DialogDescription>
                  Enter your child's details. The system will securely generate their Student ID and password.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="full_name"
                    placeholder="e.g. Alex Johnson"
                    value={newChild.full_name}
                    onChange={(e) => setNewChild({ ...newChild, full_name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname (Optional)</Label>
                  <Input
                    id="nickname"
                    placeholder="e.g. Alex"
                    value={newChild.nickname}
                    onChange={(e) => setNewChild({ ...newChild, nickname: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth <span className="text-destructive">*</span></Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={newChild.date_of_birth}
                    onChange={(e) => setNewChild({ ...newChild, date_of_birth: e.target.value })}
                    required
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={closeAndResetModal}
                    disabled={addChildMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addChildMutation.isPending}>
                    {addChildMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Generate Account"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-component to handle fetching individual child stats securely
function ChildCard({ child }) {
  // Fetch Wallet (Coins)
  const { data: wallet } = useQuery({
    queryKey: ["wallet", child.id],
    queryFn: async () => {
      const result = await base44.entities.Wallet.filter({ student_id: child.id });
      return result[0] || { balance: 0 };
    }
  });

  // Fetch Progress (XP, Level, Streak)
  const { data: progress } = useQuery({
    queryKey: ["progress", child.id],
    queryFn: async () => {
      const result = await base44.entities.Progress.filter({ student_id: child.id });
      return result[0] || { level: 1, total_xp: 0, streak_days: 0 };
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-2 border-border rounded-2xl p-6 bg-card hover:shadow-md transition-all relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border-2 border-primary/20">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{child.display_name || child.full_name || "Student"}</h2>
            <p className="text-sm font-mono text-muted-foreground bg-muted inline-block px-2 py-0.5 rounded mt-1">
              ID: {child.student_id || "PENDING"}
            </p>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Level */}
        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Level</span>
          </div>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            {progress?.level || 1}
          </p>
        </div>

        {/* XP */}
        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
            <span className="text-xs font-semibold uppercase font-black">XP</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {progress?.total_xp || 0}
          </p>
        </div>

        {/* Coins */}
        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
            <Coins className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Coins</span>
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {wallet?.balance || 0}
          </p>
        </div>

        {/* Streak */}
        <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-xl border border-orange-100 dark:border-orange-900">
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Streak</span>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {progress?.streak_days || 0}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => console.log("Reset credentials logic")}>
          Reset Password
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => console.log("View full profile")}>
          View Profile
        </Button>
      </div>
    </motion.div>
  );
}