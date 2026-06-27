import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDisplayName } from "@/lib/utils";
import { 
  ArrowLeft, Edit2, Save, X, AlertTriangle, User, 
  Calendar, School, MapPin, GraduationCap, Image as ImageIcon,
  TrendingUp, Award, Coins, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import moment from "moment";

const MALAYSIAN_STATES = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka", 
  "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", 
  "Sabah", "Sarawak", "Selangor", "Terengganu"
];

const EDUCATION_LEVELS = [
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", 
  "Standard 5", "Standard 6", "Form 1", "Form 2", "Form 3", 
  "Form 4", "Form 5"
];

export default function ChildProfilePage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [child, setChild] = useState(null);
  const [progress, setProgress] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDobWarning, setShowDobWarning] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    nickname: "",
    date_of_birth: "",
    school_name: "",
    education_level: "",
    grade_year: "",
    class_name: "",
    state: "",
    country: "Malaysia",
    profile_picture_url: ""
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

  useEffect(() => {
    loadChildData();
  }, [childId]);

  const loadChildData = async () => {
    try {
      const childData = await base44.entities.User.get(childId);
      const [progressData, walletData] = await Promise.all([
        base44.entities.Progress.filter({ student_id: childId }).then(r => r[0]),
        base44.entities.Wallet.filter({ student_id: childId }).then(r => r[0])
      ]);

      // Compute display name immediately
      childData.display_name = getDisplayName(childData);
      console.log(`Child ${childId} loaded:`, {
        full_name: childData.full_name,
        nickname: childData.nickname,
        username: childData.username,
        student_id: childData.student_id,
        display_name: childData.display_name
      });
      
      setChild(childData);
      setProgress(progressData || { level: 1, streak_days: 0, total_xp: 0 });
      setWallet(walletData || { balance: 0 });
      
      // Initialize form data
      setFormData({
        full_name: childData.full_name || "",
        nickname: childData.nickname || "",
        date_of_birth: childData.date_of_birth || "",
        school_name: childData.school_name || "",
        education_level: childData.education_level || "",
        grade_year: childData.grade_year || "",
        class_name: childData.class_name || "",
        state: childData.state || "",
        country: childData.country || "Malaysia",
        profile_picture_url: childData.profile_picture_url || ""
      });
    } catch (err) {
      console.error("Failed to load child data:", err);
      toast({
        title: "Error",
        description: "Failed to load child profile",
        variant: "destructive",
      });
      navigate("/parent/children");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Check if DOB changed
    if (formData.date_of_birth !== child.date_of_birth) {
      setShowDobWarning(true);
      return;
    }

    await submitUpdate();
  };

  const submitUpdate = async () => {
    setSaving(true);
    try {
      const response = await base44.functions.invoke('updateChildProfile', {
        childId,
        updates: formData
      });

      if (response.data.success) {
        toast({
          title: "Profile Updated",
          description: response.data.message,
        });
        
        // Reload data
        await loadChildData();
        setEditing(false);
        setShowDobWarning(false);
      }
    } catch (err) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDobChange = () => {
    setShowDobWarning(false);
    submitUpdate();
  };

  const handleCancelEdit = () => {
    setEditing(false);
    // Reset form data
    setFormData({
      full_name: child.full_name || "",
      nickname: child.nickname || "",
      date_of_birth: child.date_of_birth || "",
      school_name: child.school_name || "",
      education_level: child.education_level || "",
      grade_year: child.grade_year || "",
      class_name: child.class_name || "",
      state: child.state || "",
      country: child.country || "Malaysia",
      profile_picture_url: child.profile_picture_url || ""
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2">Child not found</h2>
        <Button onClick={() => navigate("/parent/children")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Children
        </Button>
      </div>
    );
  }

  const age = child.date_of_birth ? calculateAge(child.date_of_birth) : "N/A";

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/parent/children")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {child.display_name || getDisplayName(child)}
          </h1>
          <p className="text-sm text-muted-foreground">Student Profile</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Overview Card */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {child.profile_picture_url ? (
                <img
                  src={child.profile_picture_url}
                  alt={getDisplayName(child)}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Student ID</p>
                <p className="font-bold text-primary">{child.student_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Age</p>
                <p className="font-bold">{age} years</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Grade</p>
                <p className="font-bold">{child.education_level || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">School</p>
                <p className="font-bold">{child.school_name || "Not set"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="progress">Learning Progress</TabsTrigger>
        </TabsList>

        {/* Profile Information Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Manage your child's profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!editing}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nickname</Label>
                  <Input
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    disabled={!editing}
                    placeholder="Preferred name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={!editing}
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                  disabled={!editing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {MALAYSIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5" />
                Education Information
              </CardTitle>
              <CardDescription>School and grade details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                  disabled={!editing}
                  placeholder="School name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Education Level</Label>
                  <Select
                    value={formData.education_level}
                    onValueChange={(value) => setFormData({ ...formData, education_level: value })}
                    disabled={!editing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grade/Year</Label>
                  <Input
                    value={formData.grade_year}
                    onChange={(e) => setFormData({ ...formData, grade_year: e.target.value })}
                    disabled={!editing}
                    placeholder="e.g., Year 3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  disabled={!editing}
                  placeholder="e.g., 3A"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Progress Tab - READ ONLY */}
        <TabsContent value="progress" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Progress Overview
              </CardTitle>
              <CardDescription>Learning metrics and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-primary" />
                    <p className="text-2xl font-bold text-primary">{progress?.level || 1}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Learning Level</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-amber-600" />
                    <p className="text-2xl font-bold text-amber-600">{wallet?.balance || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Coins Earned</p>
                </div>
                <div className="bg-accent/5 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <p className="text-2xl font-bold text-accent">{progress?.streak_days || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">{progress?.total_xp || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Protected Learning Data</CardTitle>
              <CardDescription>
                These metrics are automatically tracked and cannot be manually edited
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Quiz Attempts</span>
                <span className="font-bold">System Tracked</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Lesson Completions</span>
                <span className="font-bold">System Tracked</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Achievements</span>
                <span className="font-bold">System Tracked</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Study Time</span>
                <span className="font-bold">System Tracked</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DOB Change Warning Dialog */}
      {showDobWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                Date of Birth Change
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  Changing date of birth will update your child's learning level and lesson recommendations.
                  This may affect their current progress tracking.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDobWarning(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDobChange}
                  className="flex-1"
                >
                  Confirm Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}