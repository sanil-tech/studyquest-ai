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
  DialogFooter 
} from "@/components/ui/dialog";
import { Loader2, User, Edit2, GraduationCap } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function MyChildren() {
  const queryClient = useQueryClient();
  const [editingChild, setEditingChild] = useState(null);
  const [editForm, setEditForm] = useState({ name: "" });

  // 1. Fetch the logged-in parent and their linked children
  const { data: children, isLoading, error } = useQuery({
    queryKey: ["myChildren"],
    queryFn: async () => {
      const me = await base44.auth.me();
      // Assuming your database links children to parents using a 'parent_id' column
      const myKids = await base44.entities.User.filter({ 
        parent_id: me.id,
        app_role: "student" 
      });
      return myKids;
    }
  });

  // 2. Mutation to update the child's profile
  const updateChildMutation = useMutation({
    mutationFn: async ({ childId, updates }) => {
      return await base44.entities.User.update(childId, updates);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Child profile updated!" });
      queryClient.invalidateQueries(["myChildren"]); // Refresh the list
      setEditingChild(null); // Close the modal
    },
    onError: (err) => {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to update profile", 
        variant: "destructive" 
      });
    }
  });

  const handleEditClick = (child) => {
    setEditingChild(child);
    setEditForm({ name: child.name || "" }); // Add other fields as needed
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editingChild) return;
    
    updateChildMutation.mutate({
      childId: editingChild.id,
      updates: { name: editForm.name }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">Error loading children profiles.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
          <p className="text-muted-foreground mt-1">Manage and update your kids' profiles.</p>
        </div>
        {/* You could add an "Add Child" button here linking to an account creation flow */}
        <Button onClick={() => console.log("Navigate to add child flow")}>
          <User className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      {children?.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed rounded-xl text-muted-foreground">
          No children profiles found. Add a child to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <motion.div 
              key={child.id}
              whileHover={{ y: -4 }}
              className="border rounded-2xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleEditClick(child)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="text-xl font-semibold mb-1">{child.name || "Unnamed Student"}</h3>
              <p className="text-sm text-muted-foreground">{child.email}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Profile Modal Dialog */}
      <Dialog open={!!editingChild} onOpenChange={(open) => !open && setEditingChild(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile: {editingChild?.name}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="childName">Full Name</Label>
              <Input
                id="childName"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter child's name"
                required
              />
            </div>
            {/* Add more fields here like avatar, grade level, etc. */}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingChild(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateChildMutation.isPending}>
                {updateChildMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}