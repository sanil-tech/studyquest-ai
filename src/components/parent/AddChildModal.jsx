import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User, Upload, X, Link2, UserPlus, Search, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  
  // State untuk pengesahan pautan (Link Confirmation Flow)
  const [studentIdInput, setStudentIdInput] = useState("");
  const [linkError, setLinkError] = useState("");
  const [targetStudent, setTargetStudent] = useState(null);

  const [childData, setChildData] = useState({
    full_name: "",
    nickname: "",
    username: "", // Ditambah untuk login murid tanpa e-mel
    password: "", // Ditambah untuk login murid tanpa e-mel
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
    if (age <= 7) return "Standard 1";
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

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    // Paksa huruf kecil dan buang karakter pelik/ruang kosong
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setChildData(prev => ({ ...prev, username: cleaned }));
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

      setTargetStudent(student);
    } catch (err) {
      setLinkError(err.message || "An error occurred during account verification.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!childData.full_name || !childData.full_name.trim()) {
      toast({ title: "⚠️ Name Required", description: "Please enter your child's full name.", variant: "destructive" });
      return;
    }
    if (!childData.username || childData.username.length < 3) {
      toast({ title: "⚠️ Invalid Username", description: "Username must be at least 3 characters long.", variant: "destructive" });
      return;
    }
    if (!childData.password || childData.password.length < 4) {
      toast({ title: "⚠️ Weak Password", description: "Password must be at least 4 characters long.", variant: "destructive" });
      return;
    }
    if (!childData.date_of_birth) {
      toast({ title: "Missing info", description: "Please select your child's date of birth", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Panggil cloud function untuk mendaftar profil pelajar baru beserta kelayakan log masuk
      const response = await base44.functions.invoke("createChildAccount", {
        childData: {
          ...childData,
          full_name: childData.full_name.trim(),
          status: "active" // Diaktifkan terus kerana sudah mempunyai username & password
        },
      });

      if (response.data.success) {
        toast({
          title: "Child account created! 🎉",
          description: `${childData.full_name} can now log in using username "${childData.username}".`,
        });

        setChildData({
          full_name: "", nickname: "", username: "", password: "", date_of_birth: "", gender: "",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Child Account
          </DialogTitle>
          <DialogDescription>
            Create a password-based profile or link an existing student to your portal.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">New Account</TabsTrigger>
            <TabsTrigger value="link">Link Existing</TabsTrigger>
          </TabsList>

          {/* TAB 1: REGISTER NEW STUDENT (NO EMAIL) */}
          <TabsContent value="create" className="space-y-4 pt-3">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input 
                    id="full_name"
                    placeholder="Ali Bin Ahmad"
                    value={childData.full_name}
                    onChange={(e) => setChildData(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input 
                    id="nickname"
                    placeholder="Ali"
                    value={childData.nickname}
                    onChange={(e) => setChildData(prev => ({ ...prev, nickname: e.target.value }))}
                  />
                </div>
              </div>

              {/* BARU: KELAYAKAN LOG MASUK LOGIN CREDENTIALS */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Login Credentials (No Email Required)</p>
                <div className="space-y-1">
                  <Label htmlFor="child_username">Unique Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="child_username"
                      placeholder="ali_quest12"
                      value={childData.username}
                      onChange={handleUsernameChange}
                      className="pl-9 text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="child_password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="child_password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={childData.password}
                      onChange={(e) => setChildData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-9 pr-9 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input 
                    id="dob"
                    type="date"
                    value={childData.date_of_birth}
                    onChange={(e) => setChildData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(val) => setChildData(prev => ({ ...prev, gender: val }))} value={childData.gender}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {recommendedLevel && (
                <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Based on age ({age}), we recommend selecting <strong>{recommendedLevel}</strong>.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edu_level">Education Level</Label>
                  <Select 
                    onValueChange={(val) => setChildData(prev => ({ ...prev, education_level: val, grade_year: val }))} 
                    value={childData.education_level}
                  >
                    <SelectTrigger id="edu_level"><SelectValue placeholder="Level" /></SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">State</Label>
                  <Select onValueChange={(val) => setChildData(prev => ({ ...prev, state: val }))} value={childData.state}>
                    <SelectTrigger id="state"><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>
                      {malaysianStates.map((st) => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="school">School Name</Label>
                <Input 
                  id="school"
                  placeholder="SK Taman Tun Dr Ismail"
                  value={childData.school_name}
                  onChange={(e) => setChildData(prev => ({ ...prev, school_name: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => onOpenChange?.(false)} disabled={loading}>Cancel</Button>
                <Button type="submit" disabled={loading || uploading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Account
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: LINK EXISTING STUDENT VIA REQUESTS */}
          <TabsContent value="link" className="space-y-4 pt-3">
            {!targetStudent ? (
              <form onSubmit={handleFindStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student_id">Enter Child's Student ID</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="student_id"
                        placeholder="e.g., SQ10001"
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                </div>

                {linkError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{linkError}</span>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-4">
                <Card className="border-green-100 bg-green-50/30 overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Profile Verified</p>
                      <h4 className="text-base font-bold text-foreground truncate">{getDisplayName(targetStudent)}</h4>
                      <p className="text-xs text-muted-foreground truncate">ID: {targetStudent.student_id}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setTargetStudent(null)} disabled={loading}>Back</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmLink} disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Send Link Request
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}