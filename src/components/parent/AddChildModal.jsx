import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// CredentialsSummary dialih keluar dari fasa pendaftaran awal
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card"; // Ditambah untuk Confirmation Card
import { Loader2, User, Upload, X, Link2, UserPlus, Search, AlertCircle, CheckCircle2 } from "lucide-react";
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
  
  // State untuk pengesahan pautan (Link Confirmation Flow)
  const [studentIdInput, setStudentIdInput] = useState("");
  const [linkError, setLinkError] = useState("");
  const [targetStudent, setTargetStudent] = useState(null); // Ditambah untuk simpan data preview anak

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
  // UBAH: FASA 1 - CARI REKOD STUDENT SAHAJA (BELUM LINK LAGI)
  // ============================================================================
  const handleFindStudent = async (e) => {
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
      const studentsFound = await base44.entities.User.filter({ student_id: targetId });

      if (!studentsFound || studentsFound.length === 0) {
        throw new Error("No active student record matches this Student ID.");
      }

      const student = studentsFound[0];

      if (currentUser.id === student.id) {
        throw new Error("You cannot link your own account profile to yourself.");
      }

      const existingMatches = await base44.entities.ParentChildRelationship.filter({
        parent_id: currentUser.id,
        child_id: student.id,
      });

      if (existingMatches && existingMatches.length > 0) {
        const currentRel = existingMatches[0];
        if (currentRel.status === "active") {
          throw new Error("This child account is already active and connected to your parental dashboard.");
        } else if (currentRel.status === "pending") {
          throw new Error("A link request is already pending verification from this student account.");
        }
      }

      // Set student data untuk paparan Confirmation Card
      setTargetStudent(student);
    } catch (err) {
      setLinkError(err.message || "An error occurred during account verification.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UBAH: FASA 2 - IBU BAPA SAHKAN & HANTAR LINK REQUEST STATUS PENDING
  // ============================================================================
  const handleConfirmLink = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      
      const existingMatches = await base44.entities.ParentChildRelationship.filter({
        parent_id: currentUser.id,
        child_id: targetStudent.id,
      });

      if (existingMatches && existingMatches.length > 0) {
        await base44.entities.ParentChildRelationship.update(existingMatches[0].id, {
          status: "pending"
        });
      } else {
        await base44.entities.ParentChildRelationship.create({
          parent_id: currentUser.id,
          child_id: targetStudent.id,
          status: "pending", 
        });
      }

      toast({
        title: "Link Request Sent! ✉️",
        description: `Connection requested with ${getDisplayName(targetStudent)}. Awaiting child validation.`,
      });

      setStudentIdInput("");
      setTargetStudent(null);
      onLinked?.();
      onChildAdded?.();
      onClose?.();
      onOpenChange?.(false);
    } catch (err) {
      setLinkError(err.message || "An error occurred during linkage.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UBAH: HANDLER PROFIL BARU (TIADA USERNAME/PASSWORD GENERATION)
  // ============================================================================
  const handleSubmit = async () => {
    if (!childData.full_name || !childData.full_name.trim()) {
      toast({ title: "⚠️ Name Required", description: "Please enter your child's full name.", variant: "destructive" });
      return;
    }
    if (!childData.date_of_birth) {
      toast({ title: "Missing info", description: "Please select your child's date of birth", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Ditukar ke fungsi 'createChildAccount' yang hanya set status = 'inactive'
      const response = await base44.functions.invoke("createChildAccount", {
        childData: {
          ...childData,
          full_name: childData.full_name.trim(),
          grade_year: childData.grade_year,
          status: "inactive",
        },
      });

      if (response.data.success) {
        toast({
          title: "Child profile created successfully.",
          description: "You can activate their student login credentials later from the dashboard card.",
        });

        setChildData({
          full_name: "", nickname: "", date_of_birth: "", gender: "",
          school_name: "", education_level: "", grade_year: "",
          country: "Malaysia", state: "", profile_picture_url: "",
        });

        onChildAdded?.();
        onClose?.(); 
        onOpenChange?.(false);
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

  const age = childData.date_of_birth ? calculateAge(childData.date_of_birth) : null;
  const recommendedLevel = age ? getRecommendedLevel(age) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange || onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <User className="w-5 h-5 text-primary" />
            Manage Child Profiles
          </DialogTitle>
          <DialogDescription>
            Create a brand new learning account profile or connect an existing child account.
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

          {/* TAB CONTENT: LINK EXISTING STUDENT */}
          <TabsContent value="link" className="space-y-4 py-2 focus-visible:outline-none focus-visible:ring-0">
            {!targetStudent ? (
              <form onSubmit={handleFindStudent} className="space-y-4">
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
                </div>

                {linkError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-medium flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{linkError}</span>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-11 font-semibold text-sm rounded-xl mt-2 shadow-xs">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Search Student"}
                </Button>
              </form>
            ) : (
              /* UBAH: CONFIRMATION CARD UI LAYOUT */
              <Card className="border border-primary/20 bg-primary/5">
                <CardContent className="p-5 text-center space-y-4">
                  <h4 className="font-semibold text-base">Is this your child?</h4>
                  <div className="text-sm space-y-1 bg-background p-3 rounded-lg border">
                    <p className="font-bold text-primary text-base">{getDisplayName(targetStudent)}</p>
                    <p className="text-muted-foreground text-xs">{targetStudent.school_name || "No school specified"}</p>
                    <p className="text-muted-foreground text-xs">{targetStudent.education_level || "General Level"}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" className="w-1/2" onClick={() => setTargetStudent(null)}>Cancel</Button>
                    <Button className="w-1/2" disabled={loading} onClick={handleConfirmLink}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Send Link Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB CONTENT: ORIGINAL REGISTRATION FORM */}
          <TabsContent value="create" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            {/* Profile Picture Upload Section */}
            <div className="space-y-2">
              <Label>Profile Picture (optional)</Label>
              <div className="flex items-center gap-4">
                {childData.profile_picture_url ? (
                  <div className="relative">
                    <img src={childData.profile_picture_url} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                    <button onClick={() => setChildData(prev => ({ ...prev, profile_picture_url: "" }))} className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-white hover:bg-destructive/90"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-8 h-8 text-primary" /></div>
                )}
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" id="child-profile-upload" />
                  <Label htmlFor="child-profile-upload" className="cursor-pointer">
                    <Button variant="outline" asChild disabled={uploading}>
                      <span><Upload className="w-4 h-4 mr-2" />{uploading ? "Uploading..." : "Upload Photo"}</span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                </div>
              </div>
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" value={childData.full_name} onChange={(e) => setChildData(prev => ({ ...prev, full_name: e.target.value }))} placeholder="e.g. Ahmad bin Abu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname (optional)</Label>
                <Input id="nickname" value={childData.nickname} onChange={(e) => setChildData(prev => ({ ...prev, nickname: e.target.value }))} placeholder="What to call them" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input id="dob" type="date" value={childData.date_of_birth} onChange={(e) => setChildData(prev => ({ ...prev, date_of_birth: e.target.value }))} />
                {age && <p className="text-xs text-muted-foreground">Age: {age} years old</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={childData.gender} onValueChange={(val) => setChildData(prev => ({ ...prev, gender: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
              <Select value={childData.state} onValueChange={(val) => setChildData(prev => ({ ...prev, state: val }))}>
                <SelectTrigger><SelectValue placeholder="Select your state" /></SelectTrigger>
                <SelectContent>
                  {malaysianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school">School Name</Label>
              <Input id="school" value={childData.school_name} onChange={(e) => setChildData(prev => ({ ...prev, school_name: e.target.value }))} placeholder="e.g. SK Taman Jaya" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="education">Education Level</Label>
                <Select value={childData.education_level} onValueChange={(val) => setChildData(prev => ({ ...prev, education_level: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {educationLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                  </SelectContent>
                </Select>
                {recommendedLevel && !childData.education_level && (
                  <p className="text-xs text-emerald-600 font-medium">💡 Recommended for age {age}: {recommendedLevel}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Class (optional)</Label>
                <Input id="grade" value={childData.grade_year} onChange={(e) => setChildData(prev => ({ ...prev, grade_year: e.target.value }))} placeholder="e.g. Jaya, Bestari" />
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 rounded-xl text-base font-semibold mt-2">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Child Profile & Continue"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}