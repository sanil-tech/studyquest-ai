import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, UserPlus, Link2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

// Import sub-komponen modular
import ChildProfilePage from "./ChildProfilePage";
import ChildSchoolInfo from "./ChildSchoolInfo";
import ChildAvatar from "./ChildAvatar";
import LinkExistingStudent from "./LinkExistingStudent";

export default function AddChildModal({ open, onOpenChange, onClose, onChildAdded, onLinked }) {
  const [activeTab, setActiveTab] = useState("create");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleClose = () => {
    setStep(1);
    setChildData({
      full_name: "", nickname: "", date_of_birth: "", gender: "",
      school_name: "", education_level: "", grade_year: "", country: "Malaysia", state: "", profile_picture_url: ""
    });
    onClose?.();
    onOpenChange?.(false);
  };

  // HANDLER: Cipta Profil Kanak-kanak sahaja (Status: Inactive)
  const handleCreateProfile = async () => {
    setLoading(true);
    try {
      // Memanggil edge function/backend baru yang hanya menyimpan profil
      const response = await base44.functions.invoke("createChildProfile", {
        childData: {
          ...childData,
          full_name: childData.full_name.trim(),
          status: "inactive", // Dipastikan inactive di peringkat backend
        },
      });

      if (response.data.success) {
        toast({
          title: "Profil Berjaya Dicipta! 🎉",
          description: "Profil anak anda sedia digunakan. Anda boleh mengaktifkan log masuk pelajar pada bila-bila masa.",
        });
        onChildAdded?.();
        handleClose();
      } else {
        throw new Error(response.data.error || "Gagal mencipta profil.");
      }
    } catch (err) {
      toast({
        title: "Ralat Pendaftaran",
        description: err.message || "Sila cuba sebentar lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-xl p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <User className="w-5 h-5 text-primary" />
            Pengurusan Profil Anak
          </DialogTitle>
          <DialogDescription>
            Daftar profil pembelajaran baharu atau pautkan akaun pelajar sedia ada ke dashboard penjaga anda.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create" className="text-xs font-semibold gap-2">
              <UserPlus className="w-3.5 h-3.5" />
              Cipta Profil Baru
            </TabsTrigger>
            <TabsTrigger value="link" className="text-xs font-semibold gap-2">
              <Link2 className="w-3.5 h-3.5" />
              Paut ID Sedia Ada
            </TabsTrigger>
          </TabsList>

          {/* TAB: CIPTA PROFIL BARU (3-STEP WIZARD) */}
          <TabsContent value="create" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            {/* Wizard Progress Indicator */}
            <div className="flex items-center justify-between mb-6 px-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center w-full last:w-auto">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors duration-200
                    ${step >= s ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-muted"}`}>
                    {s}
                  </div>
                  {s < 3 && <div className={`h-1 w-full mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <ChildProfilePage childData={childData} setChildData={setChildData} onNext={nextStep} />
            )}
            {step === 2 && (
              <ChildSchoolInfo childData={childData} setChildData={setChildData} onNext={nextStep} onPrev={prevStep} />
            )}
            {step === 3 && (
              <ChildAvatar childData={childData} setChildData={setChildData} onPrev={prevStep} onSubmit={handleCreateProfile} loading={loading} />
            )}
          </TabsContent>

          {/* TAB: PAUT STRUKTUR BARU (CONFIRMATION CARD FLOW) */}
          <TabsContent value="link" className="focus-visible:outline-none focus-visible:ring-0">
            <LinkExistingStudent onLinked={onLinked} onChildAdded={onChildAdded} onClose={handleClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}