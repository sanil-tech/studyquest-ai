import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  GraduationCap, Users, BookOpen, Loader2, CheckCircle, ChevronRight, ChevronLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import ProfileStep from "@/components/profile/ProfileStep";
import RoleSpecificStep from "@/components/profile/RoleSpecificStep";
import PreferencesStep from "@/components/profile/PreferencesStep";

const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"
];

const educationLevels = [
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5"
];

const favoriteSubjects = [
  "Mathematics", "Science", "English", "Bahasa Melayu", "History", 
  "Geography", "Art", "Music", "Physical Education", "Computer Science"
];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(3);

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
  
  // Learning preferences (student)
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(20);
  const [favoriteSubjectsList, setFavoriteSubjectsList] = useState([]);
  const [difficultyPreference, setDifficultyPreference] = useState("medium");

  // Parent fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [numChildren, setNumChildren] = useState("");
  const [childrenNames, setChildrenNames] = useState("");
  // Notification preferences (parent)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [progressReports, setProgressReports] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [learningAlerts, setLearningAlerts] = useState(true);

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
        if (u.phone_number) setPhoneNumber(u.phone_number);
        if (u.num_children) setNumChildren(u.num_children.toString());
        if (u.children_names) setChildrenNames(u.children_names);
        if (u.teaching_subjects) setTeachingSubjects(u.teaching_subjects);
        if (u.teaching_level) setTeachingLevel(u.teaching_level);
        if (u.preferred_language) setPreferredLanguage(u.preferred_language);
        
        // Load learning preferences
        if (u.learning_preferences) {
          if (u.learning_preferences.daily_goal_minutes) setDailyGoalMinutes(u.learning_preferences.daily_goal_minutes);
          if (u.learning_preferences.favorite_subjects) setFavoriteSubjectsList(u.learning_preferences.favorite_subjects);
          if (u.learning_preferences.difficulty_preference) setDifficultyPreference(u.learning_preferences.difficulty_preference);
        }
        
        // Load notification preferences
        if (u.notification_preferences) {
          if (u.notification_preferences.email_notifications !== undefined) setEmailNotifications(u.notification_preferences.email_notifications);
          if (u.notification_preferences.parent_progress_reports !== undefined) setProgressReports(u.notification_preferences.parent_progress_reports);
          if (u.notification_preferences.weekly_achievement_summary !== undefined) setWeeklySummary(u.notification_preferences.weekly_achievement_summary);
          if (u.notification_preferences.quiz_reminders !== undefined) setLearningAlerts(u.notification_preferences.quiz_reminders);
        }
        
        // Set total steps based on role
        if (u.app_role === "student") setTotalSteps(3);
        else if (u.app_role === "parent") setTotalSteps(3);
        else if (u.app_role === "teacher") setTotalSteps(2);
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

  const validateStep = (step) => {
   if (step === 1) {
  if (user.app_role === "student" && !dateOfBirth) {
    toast({
      title: "⚠️ Missing Info",
      description: "Please select your date of birth",
      variant: "destructive"
    });
    return false;
  }

  return true;
}
    
    if (step === 2) {
      if (user.app_role === "student") {
        if (!schoolName || !schoolName.trim()) {
          toast({ title: "⚠️ Missing Info", description: "Please enter your school name", variant: "destructive" });
          return false;
        }
        if (!educationLevel) {
          toast({ title: "⚠️ Missing Info", description: "Please select your education level", variant: "destructive" });
          return false;
        }
      } else if (user.app_role === "parent") {
        if (!numChildren || parseInt(numChildren) < 1) {
          toast({ title: "⚠️ Missing Info", description: "Please enter how many children you have", variant: "destructive" });
          return false;
        }
      } else if (user.app_role === "teacher") {
        if (!teachingSubjects || !teachingSubjects.trim()) {
          toast({ title: "⚠️ Missing Info", description: "Please enter the subjects you teach", variant: "destructive" });
          return false;
        }
        if (!teachingLevel) {
          toast({ title: "⚠️ Missing Info", description: "Please select your teaching level", variant: "destructive" });
          return false;
        }
      }
      return true;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
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
        profile_completed: true,
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

      console.log("Submitting profile update with data:", updateData);
      
      await base44.auth.updateMe(updateData);
      console.log("Profile updated successfully");
      
      if (user.app_role === "student") {
        try {
          const wallets = await base44.entities.Wallet.filter({ student_id: user.id });
          if (wallets.length === 0) {
            await base44.entities.Wallet.create({ student_id: user.id, balance: 0 });
            console.log("Wallet created");
          }
          const progress = await base44.entities.Progress.filter({ student_id: user.id });
          if (progress.length === 0) {
            await base44.entities.Progress.create({ student_id: user.id, total_xp: 0, level: 1, streak_days: 0, total_study_time: 0 });
            console.log("Progress created");
          }
        } catch (entityErr) {
          console.error("Failed to create wallet/progress:", entityErr);
        }
      }

      toast({ 
        title: "Profile complete! 🎉", 
        description: "Welcome to StudyQuest!",
        duration: 2000
      });
      
      setTimeout(() => {
        console.log("Navigating to:", user.app_role === "student" ? "/dashboard" : user.app_role === "parent" ? "/parent" : "/");
        navigate(user.app_role === "student" ? "/dashboard" : user.app_role === "parent" ? "/parent" : "/");
      }, 500);
    } catch (err) {
      console.error("Profile save error:", err, err.stack);
      toast({ 
        title: "❌ Save Failed", 
        description: err.message || "Please try again. Check console for details.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleFavoriteSubject = (subject) => {
    setFavoriteSubjectsList(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;
  const getStepProgress = () => (currentStep / totalSteps) * 100;

  const getStepTitle = () => {
    if (user.app_role === "student") {
      if (currentStep === 1) return "About You";
      if (currentStep === 2) return "Academic Info";
      if (currentStep === 3) return "Learning Preferences";
    } else if (user.app_role === "parent") {
      if (currentStep === 1) return "About You";
      if (currentStep === 2) return "Family Setup";
      if (currentStep === 3) return "Notifications";
    } else if (user.app_role === "teacher") {
      if (currentStep === 1) return "About You";
      if (currentStep === 2) return "Teaching Details";
    }
    return "Profile Setup";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                {user.app_role === "student" && <GraduationCap className="w-8 h-8 text-primary" />}
                {user.app_role === "parent" && <Users className="w-8 h-8 text-accent" />}
                {user.app_role === "teacher" && <BookOpen className="w-8 h-8 text-emerald-600" />}
                <div>
                  <CardTitle className="text-xl">Complete Your Profile</CardTitle>
                  <CardDescription className="text-sm">
                    Step {currentStep} of {totalSteps}: {getStepTitle()}
                  </CardDescription>
                </div>
              </div>
              <Progress value={getStepProgress()} className="h-2" />
            </CardHeader>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="space-y-6 pt-6">
                {currentStep === 1 && (
                  <ProfileStep
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
                    user={user}
                    schoolName={schoolName} setSchoolName={setSchoolName}
                    educationLevel={educationLevel} setEducationLevel={setEducationLevel}
                    gradeYear={gradeYear} setGradeYear={setGradeYear}
                    numChildren={numChildren} setNumChildren={setNumChildren}
                    childrenNames={childrenNames} setChildrenNames={setChildrenNames}
                    teachingSubjects={teachingSubjects} setTeachingSubjects={setTeachingSubjects}
                    teachingLevel={teachingLevel} setTeachingLevel={setTeachingLevel}
                    age={age}
                  />
                )}

                {currentStep === 3 && (
                  <PreferencesStep
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
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-12"
              disabled={saving}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              className="flex-1 h-12"
              disabled={saving}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete & Continue 🚀
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}