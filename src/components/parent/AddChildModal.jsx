import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CredentialsSummary from "./CredentialsSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Upload, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"
];

const educationLevels = [
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5"
];

export default function AddChildModal({ open, onOpenChange, onClose, onChildAdded, onLinked }) {
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // CRITICAL VALIDATION: full_name is REQUIRED - no empty names allowed
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

      // Create child account with credentials - ensure full_name is trimmed
      const response = await base44.functions.invoke("createChildAccount", {
        childData: {
          ...childData,
          full_name: childData.full_name.trim(),
          grade_year: childData.grade_year,
        },
      });

      if (response.data.success) {
        setCredentials(response.data.child);
        setShowCredentials(true);
        
        toast({
          title: "✅ Account Created",
          description: "Please save the login credentials!",
        });

        // Trigger parent refresh with a small delay to ensure data propagation
        setTimeout(() => {
          onChildAdded?.();
          onLinked?.();
        }, 500);
      }
    } catch (err) {
      console.error("Create child account error:", err);
      toast({ 
        title: "Failed", 
        description: err.response?.data?.error || err.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const age = childData.date_of_birth ? calculateAge(childData.date_of_birth) : null;
  const recommendedLevel = age ? getRecommendedLevel(age) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange || onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Add Your Child's Profile
          </DialogTitle>
          <DialogDescription>
            Create a learning profile for your child with secure login credentials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Profile Picture */}
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
                  <Button variant="outline" asChild disabled={uploading}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </span>
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={childData.full_name}
                onChange={(e) => setChildData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="e.g. Ahmad bin Abu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname (optional)</Label>
              <Input
                id="nickname"
                value={childData.nickname}
                onChange={(e) => setChildData(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="What to call them"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={childData.date_of_birth}
                onChange={(e) => setChildData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              />
              {age && (
                <p className="text-xs text-muted-foreground">Age: {age} years old</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={childData.gender} 
                onValueChange={(val) => setChildData(prev => ({ ...prev, gender: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select 
              value={childData.state} 
              onValueChange={(val) => setChildData(prev => ({ ...prev, state: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your state" />
              </SelectTrigger>
              <SelectContent>
                {malaysianStates.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">School Name</Label>
            <Input
              id="school"
              value={childData.school_name}
              onChange={(e) => setChildData(prev => ({ ...prev, school_name: e.target.value }))}
              placeholder="e.g. SK Taman Jaya"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="education">Education Level *</Label>
              <Select 
                value={childData.education_level} 
                onValueChange={(val) => setChildData(prev => ({ ...prev, education_level: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {educationLevels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {recommendedLevel && !childData.education_level && (
                <p className="text-xs text-emerald-600 font-medium">
                  💡 Recommended for age {age}: {recommendedLevel}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Class (optional)</Label>
              <Input
                id="grade"
                value={childData.grade_year}
                onChange={(e) => setChildData(prev => ({ ...prev, grade_year: e.target.value }))}
                placeholder="e.g. Jaya, Bestari"
              />
            </div>
          </div>



          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Child Profile & Continue"
            )}
          </Button>
        </div>
        </DialogContent>
      </Dialog>

      {/* Credentials Summary Modal */}
      <CredentialsSummary
        open={showCredentials}
        onOpenChange={setShowCredentials}
        credentials={credentials}
        childName={childData.full_name}
      />
    </>
  );
}