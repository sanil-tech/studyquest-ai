import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, UserPlus, Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"
];

const educationLevels = [
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5"
];

// Helper tempatan jika import utiliti tiada
const getLocalDisplayName = (user) => {
  if (!user) return "Pelajar";
  return user.nickname || user.username || user.full_name || "Pelajar";
};

export default function AddChildModal({ open, onOpenChange, onClose, onChildAdded, onLinked }) {
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // State untuk pengesahan pautan (Link Confirmation Flow)
  const [studentIdInput, setStudentIdInput] = useState("");
  const [linkError, setLinkError] = useState("");
  const [targetStudent, setTargetStudent] = useState(null);

  const [childData, setChildData] = useState({
    full_name: "",
    nickname: "",
    username: "", 
    password: "", 
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
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setChildData(prev => ({ ...prev, username: cleaned }));
  };

  const handleFindStudent = async (e) => {
    e.preventDefault();
    let targetId = studentIdInput.trim().toUpperCase();

    if (!targetId) {
      setLinkError("Sila masukkan ID Pelajar yang sah (Contoh: SQ-123456).");
      return;
    }

    // 💡 Auto-format: Tukar SQ123456 menjadi SQ-123456 mengikut standard DB baru
    if (targetId.startsWith("SQ") && !targetId.includes("-") && targetId.length > 2) {
      targetId = "SQ-" + targetId.substring(2);
    }

    setLoading(true);
    setLinkError("");

    try {
      const currentUser = await base44.auth.me();
      const studentsFound = await base44.entities.User.filter({ student_id: targetId });

      if (!studentsFound || studentsFound.length === 0) {
        throw new Error("Tiada rekod pelajar aktif yang sepadan dengan ID Pelajar ini.");
      }

      const student = studentsFound[0];

      if (currentUser.id === student.id) {
        throw new Error("Anda tidak boleh menyambungkan akaun anda sendiri.");
      }

      const existingMatches = await base44.entities.ParentChildRelationship.filter({
        parent_id: currentUser.id,
        child_id: student.id,
      });

      if (existingMatches && existingMatches.length > 0) {
        const currentRel = existingMatches[0];
        if (currentRel.status === "active") {
          throw new Error("Akaun anak ini sudah sedia aktif dan terhubung pada dashboard anda.");
        } else if (currentRel.status === "pending") {
          throw new Error("Permintaan pautan ke akaun ini masih dalam status menunggu pengesahan.");
        }
      }

      setTargetStudent(student);
    } catch (err) {
      setLinkError(err.message || "Ralat berlaku semasa pengesahan akaun.");
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
          relationship: "parent",
          linked_at: new Date().toISOString()
        });
      }

      toast({
        title: "Permintaan Pautan Dihantar! ✉️",
        description: `Sambungan dengan ${getLocalDisplayName(targetStudent)} telah diminta. Menunggu pengesahan anak.`,
      });

      setStudentIdInput("");
      setTargetStudent(null);
      onLinked?.();
      onChildAdded?.();
      onClose?.();
      onOpenChange?.(false);
    } catch (err) {
      setLinkError(err.message || "Ralat berlaku semasa memproses hubungan akaun.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!childData.full_name || !childData.full_name.trim()) {
      toast({ title: "⚠️ Nama Diperlukan", description: "Sila masukkan nama penuh anak anda.", variant: "destructive" });
      return;
    }
    if (!childData.username || childData.username.length < 3) {
      toast({ title: "⚠️ Username Tidak Sah", description: "Username mestilah sekurang-kurangnya 3 aksara.", variant: "destructive" });
      return;
    }
    if (!childData.password || childData.password.length < 4) {
      toast({ title: "⚠️ Kata Laluan Lemah", description: "Kata laluan mestilah sekurang-kurangnya 4 aksara.", variant: "destructive" });
      return;
    }
    if (!childData.date_of_birth) {
      toast({ title: "Maklumat tidak lengkap", description: "Sila pilih tarikh lahir anak anda.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 💡 PEMBETULAN UTAMA: Ditukar dari createChildAccount_TEST kepada fungsi pengeluaran rasmi
      const response = await base44.functions.invoke("createChildAccount", {
        childData: {
          ...childData,
          full_name: childData.full_name.trim(),
          username: childData.username.trim().toLowerCase(),
          password: childData.password, 
        },
      });

      if (response.data.success) {
        toast({
          title: "Akaun anak berjaya dicipta! 🎉",
          description: `${childData.full_name} kini boleh log masuk menggunakan username "${childData.username}".`,
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
          title: "❌ Gagal Mencipta Akaun",
          description: response.data.error || "Ralat tidak diketahui berlaku.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ 
        title: "Gagal", 
        description: err.response?.data?.error || err.message || "Sila cuba lagi semenit.", 
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
            Tambah Akaun Anak
          </DialogTitle>
          <DialogDescription>
            Cipta profil berasaskan kata laluan baru atau pautkan profil pelajar sedia ada ke dalam dashboard anda.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Akaun Baru</TabsTrigger>
            <TabsTrigger value="link">Pautkan Akaun Sedia Ada</TabsTrigger>
          </TabsList>

          {/* TAB 1: DAFTAR MURID BARU */}
          <TabsContent value="create" className="space-y-4 pt-3">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="full_name">Nama Penuh</Label>
                  <Input 
                    id="full_name"
                    placeholder="Ali Bin Ahmad"
                    value={childData.full_name}
                    onChange={(e) => setChildData(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nickname">Nama Panggilan</Label>
                  <Input 
                    id="nickname"
                    placeholder="Ali"
                    value={childData.nickname}
                    onChange={(e) => setChildData(prev => ({ ...prev, nickname: e.target.value }))}
                  />
                </div>
              </div>

              {/* KELAYAKAN LOG MASUK */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Kredensial Log Masuk (Tanpa Emel)</p>
                <div className="space-y-1">
                  <Label htmlFor="child_username">Username Unik</Label>
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
                  <Label htmlFor="child_password">Kata Laluan</Label>
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
                  <Label htmlFor="dob">Tarikh Lahir</Label>
                  <Input 
                    id="dob"
                    type="date"
                    value={childData.date_of_birth}
                    onChange={(e) => setChildData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gender">Jantina</Label>
                  <Select onValueChange={(val) => setChildData(prev => ({ ...prev, gender: val }))} value={childData.gender}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Lelaki</SelectItem>
                      <SelectItem value="female">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {recommendedLevel && (
                <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Cadangan tahap berdasarkan umur ({age} tahun): <strong>{recommendedLevel}</strong>.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edu_level">Tahap Pengajian</Label>
                  <Select 
                    onValueChange={(val) => setChildData(prev => ({ ...prev, education_level: val, grade_year: val }))} 
                    value={childData.education_level}
                  >
                    <SelectTrigger id="edu_level"><SelectValue placeholder="Tahap" /></SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">Negeri</Label>
                  <Select onValueChange={(val) => setChildData(prev => ({ ...prev, state: val }))} value={childData.state}>
                    <SelectTrigger id="state"><SelectValue placeholder="Negeri" /></SelectTrigger>
                    <SelectContent>
                      {malaysianStates.map((st) => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="school">Nama Sekolah</Label>
                <Input 
                  id="school"
                  placeholder="SK Taman Tun Dr Ismail"
                  value={childData.school_name}
                  onChange={(e) => setChildData(prev => ({ ...prev, school_name: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => onOpenChange?.(false)} disabled={loading}>Batal</Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Cipta Akaun
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: PAUTKAN AKAUN SEDIA ADA */}
          <TabsContent value="link" className="space-y-4 pt-3">
            {!targetStudent ? (
              <form onSubmit={handleFindStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student_id">Masukkan ID Pelajar Anak</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="student_id"
                        placeholder="Contoh: SQ-123456"
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sahkan"}
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
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Profil Disahkan</p>
                      <h4 className="text-base font-bold text-foreground truncate">{getLocalDisplayName(targetStudent)}</h4>
                      <p className="text-xs text-muted-foreground truncate">ID: {targetStudent.student_id}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setTargetStudent(null)} disabled={loading}>Kembali</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmLink} disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Hantar Permintaan Pautan
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