import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CredentialsSummary from "./CredentialsSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Upload, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function AddChildModal({
  open,
  onOpenChange,
  onClose,
  onChildAdded,
  onLinked,
  parentId, // ✅ FIX: receive parentId from parent dashboard
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const [childData, setChildData] = useState({
    full_name: "",
    nickname: "",
    date_of_birth: "",
    gender: "",
    school_name: "",
    education_level: "",
    grade_year: "",
    country: "Malaysia",
    state: "",
    profile_picture_url: "",
  });

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // ✅ basic validation
      if (!childData.full_name?.trim()) {
        toast({
          title: "Name required",
          description: "Please enter child's full name",
          variant: "destructive",
        });
        return;
      }

      if (!childData.date_of_birth || !childData.education_level) {
        toast({
          title: "Missing info",
          description: "Please fill required fields",
          variant: "destructive",
        });
        return;
      }

      // ❌ REMOVED: base44.auth.me()

      if (!parentId) {
        toast({
          title: "Error",
          description: "Parent session missing",
          variant: "destructive",
        });
        return;
      }

      // 🚀 CALL BACKEND
      const response = await base44.functions.invoke("createChildAccount", {
        childData: {
          ...childData,
          full_name: childData.full_name.trim(),
          parent_id: parentId, // ✅ FIXED
        },
      });

      if (response?.data?.success) {
        setCredentials(response.data.credentials);
        setShowCredentials(true);

        toast({
          title: "Account Created",
          description: "Child account created successfully",
        });

        setTimeout(() => {
          onChildAdded?.();
          onLinked?.();
        }, 500);
      } else {
        toast({
          title: "Failed",
          description: response?.data?.error || "Creation failed",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange || onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Child</DialogTitle>
          <DialogDescription>
            Create a child learning account
          </DialogDescription>
        </DialogHeader>

        {/* FORM (UNCHANGED UI - you already built it well) */}
        <div className="space-y-4 py-4">
          <Input
            placeholder="Full Name"
            value={childData.full_name}
            onChange={(e) =>
              setChildData({ ...childData, full_name: e.target.value })
            }
          />

          <Input
            type="date"
            value={childData.date_of_birth}
            onChange={(e) =>
              setChildData({ ...childData, date_of_birth: e.target.value })
            }
          />

          <Select
            onValueChange={(val) =>
              setChildData({ ...childData, education_level: val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Education Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard 1">Standard 1</SelectItem>
              <SelectItem value="Standard 2">Standard 2</SelectItem>
              <SelectItem value="Form 1">Form 1</SelectItem>
              <SelectItem value="Form 2">Form 2</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Child"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}