import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, User, GraduationCap, Settings, Loader2 } from "lucide-react";
import ProfileStep from "@/components/profile/ProfileStep";
import RoleSpecificStep from "@/components/profile/RoleSpecificStep";
import PreferencesStep from "@/components/profile/PreferencesStep";

export default function CompleteProfile() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile fields
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("Malaysia");
  const [state, setState] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Student-specific
  const [schoolName, setSchoolName] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [gradeYear, setGradeYear] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(20);
  const [favoriteSubjectsList, setFavoriteSubjectsList] = useState([]);
  const [difficultyPreference, setDifficultyPreference] = useState("medium");

  // Parent-specific
  const [numChildren, setNumChildren] = useState("");
  const [childrenNames, setChildrenNames] = useState("");

  // Teacher-specific
  const [teachingSubjects, setTeachingSubjects] = useState("");
  const [teachingLevel, setTeachingLevel] = useState("");

  // Notifications (parent/teacher)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [progressReports, setProgressReports] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [learningAlerts, setLearningAlerts] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me?.nickname) setNickname(me.nickname);
        if (me?.gender) setGender(me.gender);
        if (me?.date_of_birth) setDateOfBirth(me.date_of_birth);
        if (me?.country) setCountry(me.country);
        if (me?.state) setState(me.state);
        if (me?.profile_picture_url) setProfilePictureUrl(me.profile_picture_url);
        if (me?.phone_number) setPhoneNumber(me.phone_number);
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const toggleFavoriteSubject = (subject) => {
    setFavoriteSubjectsList(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfilePictureUrl(file_url);
      toast({ title: "Photo uploaded!", duration: 1500 });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!dateOfBirth) {
        toast({ title: "Date of birth is required", variant: "destructive" });
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (user?.app_role === "student") {
        if (!schoolName || !educationLevel) {
          toast({ title: "Please complete school details", variant: "destructive" });
          return false;
        }
      } else if (user?.app_role === "parent") {
        if (!numChildren) {
          toast({ title: "Number of children is required", variant: "destructive" });
          return false;
        }
      } else if (user?.app_role === "teacher") {
        if (!teachingSubjects || !teachingLevel) {
          toast({ title: "Please complete teaching details", variant: "destructive" });
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setSaving(true);
    try {
      const updateData = {
        nickname,
        gender,
        date_of_birth: dateOfBirth,
        country,
        state,
        profile_picture_url: profilePictureUrl,
        preferred_language: preferredLanguage,
        profile_completed: true, // 🎯 Menandakan profil sudah selesai sepenuhnya
      };

      if (user.app_role === "student") {
        updateData.school_name = schoolName;
        updateData.education_level = educationLevel;
        updateData.grade_year = gradeYear;
        updateData.school_year = educationLevel;
        updateData.learning_preferences = {
          daily_goal_minutes: dailyGoalMinutes,
          favorite_subjects: favoriteSubjectsList,
          difficulty_preference: difficultyPreference,
        };
      } else if (user.app_role === "parent") {
        updateData.phone_number = phoneNumber;
        updateData.num_children = parseInt(numChildren);
        updateData.children_names = childrenNames;
        updateData.notification_preferences = {
          email_notifications: emailNotifications,
          parent_progress_reports: progressReports,
          weekly_achievement_summary: weeklySummary,
          quiz_reminders: learningAlerts,
        };
      } else if (user.app_role === "teacher") {
        updateData.teaching_subjects = teachingSubjects;
        updateData.teaching_level = teachingLevel;
        updateData.notification_preferences = {
          email_notifications: emailNotifications,
          quiz_reminders: learningAlerts,
        };
      }
      
      // 1. Kemaskini data profil ke dalam pangkalan data
      await base44.auth.updateMe(updateData);
      
      // 🔄 2. SELESAI: Paksa SDK mengambil data baharu secara nyata untuk mengemaskini cache sesi
      const refreshedUser = await base44.auth.me();
      const finalRole = refreshedUser?.app_role || user?.app_role;

      if (finalRole === "student") {
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
          console.error("Gagal mencipta entiti tambahan:", entityErr);
        }
      }

      toast({ 
        title: "Profil Selesai! 🎉", 
        description: "Selamat datang ke dunia StudyQuest!",
        duration: 2000
      });
      
      // 🚀 3. SELESAI: Guna Hard Redirect untuk memintas sebarang takungan sekatan Route Guard lama
      setTimeout(() => {
        const targetPath = finalRole === "student" 
          ? "/dashboard" 
          : finalRole === "parent" 
            ? "/parent" 
            : "/login";
            
        globalThis.location.href = targetPath;
      }, 500);

    } catch (err) {
      toast({ 
        title: "❌ Gagal Menyimpan", 
        description: err.message || "Sila cuba sebentar lagi.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Unable to load profile. Please refresh.</p>
      </div>
    );
  }

  const steps = [
    { num: 1, title: "Profile", icon: User },
    { num: 2, title: "Details", icon: GraduationCap },
    { num: 3, title: "Preferences", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome, {user.full_name?.split(" ")[0] || "there"}! Let's set up your account.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isComplete = currentStep > step.num;
            return (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" :
                      isComplete ? "bg-primary/20 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-12 ${currentStep > step.num ? "bg-primary/40" : "bg-border"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading font-bold text-foreground">
              Step {currentStep} of 3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <ProfileStep
                  key="step1"
                  user={user}
                  nickname={nickname} setNickname={setNickname}
                  gender={gender} setGender={setGender}
                  dateOfBirth={dateOfBirth} setDateOfBirth={setDateOfBirth}
                  country={country} setCountry={setCountry}
                  state={state} setState={setState}
                  profilePictureUrl={profilePictureUrl} setProfilePictureUrl={setProfilePictureUrl}
                  phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
                  uploading={uploading} setUploading={setUploading}
                  handleFileUpload={handleFileUpload}
                />
              )}
              {currentStep === 2 && (
                <RoleSpecificStep
                  key="step2"
                  user={user}
                  schoolName={schoolName} setSchoolName={setSchoolName}
                  educationLevel={educationLevel} setEducationLevel={setEducationLevel}
                  gradeYear={gradeYear} setGradeYear={setGradeYear}
                  age={null}
                  numChildren={numChildren} setNumChildren={setNumChildren}
                  childrenNames={childrenNames} setChildrenNames={setChildrenNames}
                  teachingSubjects={teachingSubjects} setTeachingSubjects={setTeachingSubjects}
                  teachingLevel={teachingLevel} setTeachingLevel={setTeachingLevel}
                />
              )}
              {currentStep === 3 && (
                <PreferencesStep
                  key="step3"
                  user={user}
                  preferredLanguage={preferredLanguage} setPreferredLanguage={setPreferredLanguage}
                  dailyGoalMinutes={dailyGoalMinutes} setDailyGoalMinutes={setDailyGoalMinutes}
                  favoriteSubjectsList={favoriteSubjectsList} toggleFavoriteSubject={toggleFavoriteSubject}
                  difficultyPreference={difficultyPreference} setDifficultyPreference={setDifficultyPreference}
                  emailNotifications={emailNotifications} setEmailNotifications={setEmailNotifications}
                  progressReports={progressReports} setProgressReports={setProgressReports}
                  weeklySummary={weeklySummary} setWeeklySummary={setWeeklySummary}
                  learningAlerts={learningAlerts} setLearningAlerts={setLearningAlerts}
                />
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} className="gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                "Complete Profile 🎉"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}