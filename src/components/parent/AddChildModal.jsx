import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CredentialsSummary from "./CredentialsSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Upload, X, Link2, UserPlus, Search, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getDisplayName } from "@/lib/utils";

const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"
];

const educationLevels = [
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5"
];

export default function AddChildModal({ open, onOpenChange, onClose, onChildAdded, onLinked }) {
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState(null);
  
  // Custom SQ Student ID input tracking
  const [studentIdInput, setStudentIdInput] = useState("");
  const [linkError, setLinkError] = useState("");
  const [savedChildName, setSavedChildName] = useState("");

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

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getRecommendedLevel = (age) => {
    if (age < 7) return "Standard 1";
    if (age === 7) return "Standard 1";
    if (age === 8) return "Standard 2";
    if (age === 9) return "Standard 3";
    if (age === 10) return "Standard 4";
    if (age === 11) return "Standard 5";
    if (age === 12) return "Standard 6";
    if (age === 13) return "Form 1";
    if (age === 14) return "Form 2";
    if (age === 15) return "Form 3";
    if (age === 16) return "Form 4";
    if (age === 17) return "Form 5";
    return "Other";
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setChildData(prev => ({ ...prev, profile_picture_url: result.file_url }));
      toast({ title: "Photo uploaded", description: "Profile picture updated" });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // ============================================================================
  // HANDLER: LINK AN EXISTING STUDENT BY CUSTOM STUDENT ID (e.g., SQ.....)
  // ============================================================================
  const handleLinkExistingId = async (e) => {
    e.preventDefault();
    const targetId = studentIdInput.trim();

    if (!targetId) {
      setLinkError("Please provide a valid Student ID (e.g., SQ10001).");
      return;
    }

    setLoading(true);
    setLinkError("");

    try {
      const currentUser = await base44.auth.me();

      // Look up via custom student_id key matching the 'SQ...' pattern
      const studentsFound = await base44.entities.User.filter({
        student_id: targetId
      });

      if (!studentsFound || studentsFound.length === 0) {
        throw new Error("No active student record matches this Student ID.");
      }

      const targetedStudent = studentsFound[0];

      if (currentUser.id === targetedStudent.id) {
        throw new Error("You cannot link your own account profile to yourself.");
      }

      // Check for preexisting active relationship
      const dynamicMatches = await base44.entities.ParentChildRelationship.filter({
        parent_id: currentUser.id,
        child_id: targetedStudent.id,
        status: "active",
      });

      if (dynamicMatches && dynamicMatches.length > 0) {
        throw new Error("This child account is already connected to your parental dashboard.");
      }

      // Create new relationship entry
      await base44.entities.ParentChildRelationship.create({
        parent_id: currentUser.id,
        child_id: targetedStudent.id,
        status: "active",
      });

      toast({
        title: "Account Linked Successfully! 🎉",
        description: `Bound ${getDisplayName(targetedStudent)} to your dashboard overview.`,
      });

      setStudentIdInput("");
      onLinked?.();
      onChildAdded?.();
      onClose?.();
      onOpenChange?.(false);
    } catch (err) {
      setLinkError(err.message || "An error occurred during account verification.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLER: CREATE A BRAND NEW CHILD ACCOUNT
  // ============================================================================
  const handleSubmit = async () => {
    if (!childData.full_name || !childData.full_name.trim()) {
      toast({ 
        title: "⚠️ Name Required", 
        description: "Please enter your child's full name. This field cannot be empty.", 
        variant: "destructive" 
      });
      return;
    }
    if (!childData.date_of_birth) {
      toast({ title: "Missing info", description: "Please select your child's date of birth", variant: "destructive" });
      return;
    }
    if (!childData.education_level) {
      toast({ title: "Missing info", description: "Please select education level", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke("createChildAccount", {
        childData: {
          ...childData,
          full_name: childData.full_name.trim(),
          grade_year: childData.grade_year,
        },
      });

      if (response.data.success) {
        setSavedChildName(childData.full_name.trim());
        setCredentials(response.data.child); 
        setShowCredentials(true);

        toast({
          title: "✅ Account Created",
          description: "Please copy these credentials down now!",
        });

        setChildData({
          full_name: "", nickname: "", date_of_birth: "", gender: "",
          school_name: "", education_level: "", grade_year: "",
          country: "Malaysia", state: "", profile_picture_url: "",
        });

        onClose?.(); 
      } else {
        toast({
          title: "❌ Creation Failed",
          description: response.data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ 
        title: "Failed", 
        description: err.response?.data?.error || err.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCredentialsSummary = (isOpen) => {
    setShowCredentials(isOpen);
    if (!isOpen) {
      onChildAdded?.();
      onLinked?.();
    }
  };

  const age = childData.date_of_birth ? calculateAge(childData.date_of_birth) : null;
  const recommendedLevel = age ? getRecommendedLevel(age) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange || onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <User className="w-5 h-5 text-primary" />
              Manage Child Profiles
            </DialogTitle>
            <DialogDescription>
              Create a brand new learning account or connect an existing child account using their tracking reference hash key.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create" className="text-xs font-semibold gap-2">
                <UserPlus className="w-3.5 h-3.5" />
                Create New Profile
              </TabsTrigger>
              <TabsTrigger value="link" className="text-xs font-semibold gap-2">
                <Link2 className="w-3.5 h-3.5" />
                Link Existing ID
              </TabsTrigger>
            </TabsList>

            {/* TAB CONTENT: LINK EXISTING STUDENT VIA SQ ID */}
            <TabsContent value="link" className="space-y-4 py-2 focus-visible:outline-none focus-visible:ring-0">
              <form onSubmit={handleLinkExistingId} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student_id" className="text-sm font-semibold text-foreground">
                    Student ID Key *
                  </Label>
                  <div className="relative">
                    <Input
                      id="student_id"
                      type="text"
                      disabled={loading}
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value)}
                      placeholder="e.g. SQ10023"
                      className="font-mono text-sm pl-10 h-11 tracking-wider border-input"
                    />
                    <Search className="w-4 h-4 text-muted-foreground/40 absolute left-3.5 top-3.5" />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    You can retrieve this ID directly from the student's dashboard settings layout view.
                  </p>
                </div>

                {linkError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-medium flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{linkError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 font-semibold text-sm rounded-xl mt-2 shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Establishing Profile Link Map...
                    </>
                  ) : (
                    "Establish Dashboard Profile Link"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* TAB CONTENT: ORIGINAL REGISTRATION FORM */}
            <TabsContent value="create" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
              {/* Profile Picture Upload Section */}
              <div className="space-y-2">
                <Label>Profile Picture (optional)</Label>
                <div className="flex items-center gap-4">
                  {childData.profile_picture_url ? (
                    <div className="relative">
                      <img 
                        src={childData.profile_picture_url} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary" 
                      />
                      <button
                        onClick={() => setChildData(prev => ({ ...prev, profile_picture_url: "" }))}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-white hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      id="child-profile-upload"
                    />
                    <Label htmlFor="child-profile-upload" className="cursor-pointer">
                      <Button variant="outline" asChild disabled={uploading