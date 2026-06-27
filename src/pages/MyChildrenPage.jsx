import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, UserPlus, Search, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

export default function MyChildrenPage() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [childEmail, setChildEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);

        // Get linked children from LinkRequest
        const linkReqs = await base44.entities.LinkRequest.filter({
          parent_id: u.id,
          status: "approved"
        });

        // Fetch child details
        const childDetails = await Promise.all(
          linkReqs.map(async (req) => {
            const childUsers = await base44.entities.User.filter({ email: req.student_email });
            if (childUsers.length === 0) return null;
            
            const child = childUsers[0];
            const [progress, wallet] = await Promise.all([
              base44.entities.Progress.filter({ student_id: child.id }).then(r => r[0]),
              base44.entities.Wallet.filter({ student_id: child.id }).then(r => r[0])
            ]);

            return {
              ...child,
              progress,
              wallet,
              linkRequestId: req.id
            };
          })
        );

        setChildren(childDetails.filter(c => c !== null));
      } catch (err) {
        console.error("Failed to load children:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLinkChild = async () => {
    if (!childEmail) {
      toast({
        title: "Email required",
        description: "Please enter your child's email address.",
        variant: "destructive",
      });
      return;
    }

    setLinking(true);
    try {
      // Check if user exists
      const users = await base44.entities.User.filter({ email: childEmail });
      if (users.length === 0) {
        toast({
          title: "User not found",
          description: "No account found with this email.",
          variant: "destructive",
        });
        return;
      }

      const childUser = users[0];
      if (childUser.app_role !== "student") {
        toast({
          title: "Not a student account",
          description: "This account is not registered as a student.",
          variant: "destructive",
        });
        return;
      }

      // Check if already linked
      const existing = await base44.entities.LinkRequest.filter({
        student_email: childEmail,
        parent_id: user.id,
        status: "approved"
      });

      if (existing.length > 0) {
        toast({
          title: "Already linked",
          description: "This child is already linked to your account.",
        });
        return;
      }

      // Create link request
      await base44.entities.LinkRequest.create({
        student_email: childEmail,
        student_name: childUser.full_name || childEmail,
        parent_id: user.id,
        parent_email: user.email,
        parent_name: user.full_name || user.email,
        initiated_by: "parent",
        status: "pending"
      });

      toast({
        title: "Request sent!",
        description: "Your child needs to accept the link request.",
      });
      setShowLinkModal(false);
      setChildEmail("");
    } catch (err) {
      console.error("Failed to link child:", err);
      toast({
        title: "Failed to link",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Link Child
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Child
          </Button>
        </div>
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
            <Button onClick={() => setShowLinkModal(true)}>
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
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {child.avatar_photo_url ? (
                        <img
                          src={child.avatar_photo_url}
                          alt={child.full_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-2xl">{child.avatar_emoji || "🎓"}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold">{child.full_name || child.email}</CardTitle>
                      <p className="text-xs text-muted-foreground">{child.school_year || "Not set"} • {child.email}</p>
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
                  
                  <div className="flex gap-2 pt-2">
                    <Link
                      to="/parent"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        View Progress
                      </Button>
                    </Link>
                    <Button size="sm" className="flex-1">
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold">Link Child Account</h2>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-2 hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Child's Email Address</Label>
                <Input
                  type="email"
                  value={childEmail}
                  onChange={(e) => setChildEmail(e.target.value)}
                  placeholder="child@example.com"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the email address your child uses to log in
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLinkChild}
                  disabled={linking}
                  className="flex-1"
                >
                  {linking ? "Sending..." : "Send Request"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Child Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold">Add Child</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              To add a child, they need to create their own student account first. Then you can link it using the "Link Child" option.
            </p>

            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}