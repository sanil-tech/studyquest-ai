import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Users, School, GraduationCap, Calendar } from "lucide-react";
import AddChildModal from "@/components/AddChildModal";
import { toast } from "@/components/ui/use-toast";

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fungsi untuk mengambil data anak-anak yang berpaut dengan akaun ibu bapa ini
  const fetchChildrenProfiles = async () => {
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();
      
      // Ambil senarai hubungan parent-child
      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: currentUser.id,
      });

      if (relationships && relationships.length > 0) {
        // Ambil data profil bagi setiap anak berdasarkan child_id
        const childProfiles = await Promise.all(
          relationships.map(async (rel) => {
            try {
              const studentData = await base44.entities.User.get(rel.child_id);
              return {
                ...studentData,
                relationshipStatus: rel.status, // 'active' atau 'pending'
                relationshipId: rel.id
              };
            } catch (err) {
              console.error(`Gagal memuatkan profil anak ID: ${rel.child_id}`, err);
              return null;
            }
          })
        );
        
        // Tapis keluar jika ada data yang kosong/null akibat ralat
        setChildren(childProfiles.filter(c => c !== null));
      } else {
        setChildren([]);
      }
    } catch (error) {
      console.error("Ralat memuatkan dashboard ibu bapa:", error);
      toast({
        title: "Ralat Sistem",
        description: "Gagal memuatkan senarai profil anak anda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildrenProfiles();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-4 rounded-xl border shadow-xs">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Dashboard Ibu Bapa
          </h1>
          <p className="text-muted-foreground text-sm">
            Urus profil pembelajaran, pantau prestasi akademik, dan pautkan akaun anak anda.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 font-semibold shadow-xs">
          <UserPlus className="w-4 h-4" />
          Urus / Tambah Anak
        </Button>
      </div>

      {/* Konten Utama Senarai Profil Anak */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border rounded-xl bg-muted/10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Memuatkan maklumat profil anak...</p>
        </div>
      ) : children.length === 0 ? (
        <Card className="border-dashed bg-muted/20 text-center py-12">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Tiada Profil Anak Ditemui</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Anda belum mendaftarkan profil atau memautkan mana-mana akaun pelajar sedia ada lagi.
              </p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="mt-2 font-medium">
              Daftar Profil Pertama Sekarang
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Grid Kad Profil Anak */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child) => (
            <Card key={child.id} className="overflow-hidden border-input hover:border-primary/30 transition-all shadow-xs">
              <CardHeader className="flex flex-row items-center gap-4 bg-muted/30 pb-4">
                <Avatar className="w-14 h-14 border-2 border-background shadow-xs">
                  <AvatarImage src={child.profile_picture_url || child.avatar_photo_url} alt={child.full_name} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {child.full_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-bold leading-none">{child.full_name}</CardTitle>
                    {child.relationshipStatus === "pending" ? (
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100 font-semibold border-amber-200">
                        Menunggu Pengesahan
                      </Badge>
                    ) : child.status === "inactive" ? (
                      <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 font-semibold">
                        Profil Sahaja (Belum Aktif)
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] bg-emerald-600 font-semibold">
                        Aktif
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs font-medium text-primary/80">
                    ID Pelajar: <span className="font-mono bg-background px-1.5 py-0.5 rounded border text-[11px] tracking-wide">{child.student_id || "Tiada"}</span>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3 text-xs border-t">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <School className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                  <span className="truncate font-medium">Sekolah: <strong className="text-foreground">{child.school_name || "—"}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                  <span className="truncate font-medium">Tahap: <strong className="text-foreground">{child.education_level || "—"}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                  <span className="truncate font-medium">Tarikh Lahir: <strong className="text-foreground">{child.date_of_birth || "—"}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                  <span className="truncate font-medium">Kelas: <strong className="text-foreground">{child.grade_year || "—"}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Urus / Tambah Anak */}
      <AddChildModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChildAdded={fetchChildrenProfiles}
        onLinked={fetchChildrenProfiles}
      />
    </div>
  );
}