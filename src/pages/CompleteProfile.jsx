import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { User, GraduationCap, Users, BookOpen, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";

const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"
];

const educationLevels = [
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5"
];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Student fields
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("Malaysia");
  const [state, setState] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [gradeYear, setGradeYear] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  // Parent fields
  const [numChildren, setNumChildren] = useState("");
  const [childrenNames, setChildrenNames] = useState("");

  // Teacher fields
  const [teachingSubjects, setTeachingSubjects] = useState("");
  const [teachingLevel, setTeachingLevel] = useState("");

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        // Pre-fill existing data
        if (u.nickname) setNickname(u.nickname);
        if (u.gender) setGender(u.gender);
        if (u.date_of_birth) setDateOfBirth(u.date_of_birth);
        if (u.country) setCountry(u.country);
        if (u.state) setState(u.state);
        if (u.school_name) setSchoolName(u.school_name);
        if (u.education_level) setEducationLevel(u.education_level);
        if (u.grade_year) setGradeYear(u.grade_year);
        if (u.profile_picture_url) setProfilePictureUrl(u.profile_picture_url);
        if (u.num_children) setNumChildren(u.num_children.toString());
        if (u.children_names) setChildrenNames(u.children_names);
        if (u.teaching_subjects) setTeachingSubjects(u.teaching_subjects);
        if (u.teaching_level) setTeachingLevel(u.teaching_level);
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

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
      setProfilePictureUrl(result.file_url);
      toast({ title: "Photo uploaded", description: "Profile picture updated" });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

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

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const updateData = {
        nickname,
        gender,
        date_of_birth: dateOfBirth,
        country,
        state,
        profile_picture_url: profilePictureUrl,
        profile_completed: true,
      };

      if (user.app_role === "student") {
        if (!schoolName.trim()) {
          toast({ title: "Missing info", description: "Please enter your school name", variant: "destructive" });
          setSaving(false);
          return;
        }
        if (!educationLevel) {
          toast({ title: "Missing info", description: "Please select your education level", variant: "destructive" });
          setSaving(false);
          return;
        }
        updateData.school_name = schoolName;
        updateData.education_level = educationLevel;
        updateData.grade_year = gradeYear;
        updateData.school_year = educationLevel;
      } else if (user.app_role === "parent") {
        if (!numChildren || parseInt(numChildren) < 1) {
          toast({ title: "Missing info", description: "Please enter the number of children", variant: "destructive" });
          setSaving(false);
          return;
        }
        updateData.num_children = parseInt(numChildren);
        updateData.children_names = childrenNames;
      } else if (user.app_role === "teacher") {
        if (!teachingSubjects.trim()) {
          toast({ title: "Missing info", description: "Please enter subjects you teach", variant: "destructive" });
          setSaving(false);
          return;
        }
        if (!teachingLevel) {
          toast({ title: "Missing info", description: "Please select teaching level", variant: "destructive" });
          setSaving(false);
          return;
        }
        updateData.teaching_subjects = teachingSubjects;
        updateData.teaching_level = teachingLevel;
      }

      await base44.auth.updateMe(updateData);
      
      // Refresh user to ensure profile_completed is set
      const refreshedUser = await base44.auth.me();
      console.log("Profile updated successfully:", refreshedUser);

      // Create wallet and progress for students
      if (user.app_role === "student") {
        try {
          const wallets = await base44.entities.Wallet.filter({ student_id: user.id });
          if (wallets.length === 0) {
            await base44.entities.Wallet.create({ student_id: user.id, balance: 0 });
          }
          const progress = await base44.entities.Progress.filter({ student_id: user.id });
          if (progress.length === 0) {
            await base44.entities.Progress.create({ student_id: user.id, total_xp: 0, level: 1, streak_days: 0, total_study_time: 0 });
          }
        } catch (entityErr) {
          console.error("Failed to create wallet/progress:", entityErr);
          // Continue anyway - profile is saved
        }
      }

      toast({ title: "Profile complete!", description: "Welcome to StudyQuest!" });
      navigate(user.app_role === "student" ? "/dashboard" : user.app_role === "parent" ? "/parent" : "/");
    } catch (err) {
      console.error("Profile save error:", err);
      toast({ title: "Save failed", description: err.message || "Please try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;
  const recommendedLevel = age ? getRecommendedLevel(age) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {user.app_role === "student" && <GraduationCap className="w-6 h-6 text-primary" />}
                {user.app_role === "parent" && <Users className="w-6 h-6 text-accent" />}
                {user.app_role === "teacher" && <BookOpen className="w-6 h-6 text-emerald-600" />}
                Complete Your Profile
              </CardTitle>
              <p className="text-muted-foreground">
                {user.app_role === "student" && "Tell us about yourself to personalize your learning!"}
                {user.app_role === "parent" && "Let us know about your family to track progress."}
                {user.app_role === "teacher" && "Share your teaching details to customize your experience."}
              </p>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Profile Picture */}
              <div className="space-y-2">
                <Label>Profile Picture (optional)</Label>
                <div className="flex items-center gap-4">
                  {profilePictureUrl ? (
                    <div className="relative">
                      <img src={profilePictureUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                      <button
                        onClick={() => setProfilePictureUrl("")}
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
                      id="profile-upload"
                    />
                    <Label htmlFor="profile-upload" className="cursor-pointer">
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
                  <Label htmlFor="nickname">Nickname (optional)</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="What should we call you?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                  {age && (
                    <p className="text-xs text-muted-foreground">Age: {age} years old</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={state} onValueChange={setState}>
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

              {/* Student-specific fields */}
              {user.app_role === "student" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="school">School Name</Label>
                    <Input
                      id="school"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. SK Taman Jaya"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="education">Education Level</Label>
                      <Select value={educationLevel} onValueChange={setEducationLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {recommendedLevel && !educationLevel && (
                        <p className="text-xs text-emerald-600 font-medium">
                          💡 Recommended for age {age}: {recommendedLevel}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade/Year (optional)</Label>
                      <Input
                        id="grade"
                        value={gradeYear}
                        onChange={(e) => setGradeYear(e.target.value)}
                        placeholder="e.g. 1A, 3B"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Parent-specific fields */}
              {user.app_role === "parent" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="numChildren">Number of Children</Label>
                    <Input
                      id="numChildren"
                      type="number"
                      min="1"
                      value={numChildren}
                      onChange={(e) => setNumChildren(e.target.value)}
                      placeholder="How many children do you have?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="childrenNames">Children's Names (optional)</Label>
                    <Input
                      id="childrenNames"
                      value={childrenNames}
                      onChange={(e) => setChildrenNames(e.target.value)}
                      placeholder="e.g. Ali, Siti, Ahmad"
                    />
                  </div>
                </>
              )}

              {/* Teacher-specific fields */}
              {user.app_role === "teacher" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subjects">Subjects Taught</Label>
                    <Input
                      id="subjects"
                      value={teachingSubjects}
                      onChange={(e) => setTeachingSubjects(e.target.value)}
                      placeholder="e.g. Mathematics, Science, English"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teachingLevel">Teaching Level</Label>
                    <Select value={teachingLevel} onValueChange={setTeachingLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary School (Standard 1-6)</SelectItem>
                        <SelectItem value="secondary">Secondary School (Form 1-5)</SelectItem>
                        <SelectItem value="both">Both Levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Profile & Continue 🚀"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}