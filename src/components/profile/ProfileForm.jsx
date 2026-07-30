import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDistrictsForState } from "@/lib/malaysiaDistricts";

const GENDER_LABELS = {
  male: "Lelaki",
  female: "Perempuan",
  other: "Lain-lain",
  prefer_not_to_say: "Tidak mahu nyatakan",
};

export default function ProfileForm({ user, editing, formData, setFormData, isStudent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading font-bold text-foreground">
            {isStudent ? "Profil Sekolah" : "Butiran Peribadi"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Nama Penuh</Label>
              <div className="mt-1 p-2 bg-muted/50 rounded-md border border-border/50">
                <p className="text-sm font-medium">{user?.full_name || "Tidak ditetapkan"}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                <span>ℹ️</span>
                <span>Nama penuh tidak boleh diubah. Gunakan medan Nama Panggilan untuk nama pilihan anda.</span>
              </p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Nama Panggilan (Pilihan)</Label>
              {editing ? (
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="Nama panggilan"
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">{user?.nickname || "Tidak ditetapkan"}</p>
              )}
            </div>

            {isStudent && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Tahap Tahun</Label>
                  {editing ? (
                    <Select
                      value={formData.school_year}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, school_year: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih tahap" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tahun 1">Tahun 1</SelectItem>
                        <SelectItem value="Tahun 2">Tahun 2</SelectItem>
                        <SelectItem value="Tahun 3">Tahun 3</SelectItem>
                        <SelectItem value="Tahun 4">Tahun 4</SelectItem>
                        <SelectItem value="Tahun 5">Tahun 5</SelectItem>
                        <SelectItem value="Tahun 6">Tahun 6</SelectItem>
                        <SelectItem value="Tingkatan 1">Tingkatan 1</SelectItem>
                        <SelectItem value="Tingkatan 2">Tingkatan 2</SelectItem>
                        <SelectItem value="Tingkatan 3">Tingkatan 3</SelectItem>
                        <SelectItem value="Tingkatan 4">Tingkatan 4</SelectItem>
                        <SelectItem value="Tingkatan 5">Tingkatan 5</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{user?.school_year || "Tidak ditetapkan"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Kelas</Label>
                  {editing ? (
                    <Input
                      value={formData.class_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                      placeholder="Cth: 1A, 3B"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{user?.class_name || "Tidak ditetapkan"}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Nama Sekolah</Label>
              {editing ? (
                <Input
                  value={formData.school_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
                  placeholder={isStudent ? "Cth: SK Taman Jaya" : "Sekolah/institusi anda"}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">{user?.school_name || "Tidak ditetapkan"}</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Jantina</Label>
              {editing ? (
                <Select
                  value={formData.gender}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih jantina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Lelaki</SelectItem>
                    <SelectItem value="female">Perempuan</SelectItem>
                    <SelectItem value="other">Lain-lain</SelectItem>
                    <SelectItem value="prefer_not_to_say">Tidak mahu nyatakan</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium mt-1">{GENDER_LABELS[user?.gender] || "Tidak ditetapkan"}</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Tarikh Lahir</Label>
              {editing ? (
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">
                  {user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : "Tidak ditetapkan"}
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Negara</Label>
              {editing ? (
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Negara"
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">{user?.country || "Tidak ditetapkan"}</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Negeri</Label>
              {editing ? (
                <Select
                  value={formData.state}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, state: v, district: "" }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih negeri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Johor">Johor</SelectItem>
                    <SelectItem value="Kedah">Kedah</SelectItem>
                    <SelectItem value="Kelantan">Kelantan</SelectItem>
                    <SelectItem value="Melaka">Melaka</SelectItem>
                    <SelectItem value="Negeri Sembilan">Negeri Sembilan</SelectItem>
                    <SelectItem value="Pahang">Pahang</SelectItem>
                    <SelectItem value="Pulau Pinang">Pulau Pinang</SelectItem>
                    <SelectItem value="Perak">Perak</SelectItem>
                    <SelectItem value="Perlis">Perlis</SelectItem>
                    <SelectItem value="Sabah">Sabah</SelectItem>
                    <SelectItem value="Sarawak">Sarawak</SelectItem>
                    <SelectItem value="Selangor">Selangor</SelectItem>
                    <SelectItem value="Terengganu">Terengganu</SelectItem>
                    <SelectItem value="W.P. Kuala Lumpur">W.P. Kuala Lumpur</SelectItem>
                    <SelectItem value="W.P. Putrajaya">W.P. Putrajaya</SelectItem>
                    <SelectItem value="W.P. Labuan">W.P. Labuan</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium mt-1">{user?.state || "Tidak ditetapkan"}</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Kawasan/Daerah</Label>
              {editing ? (
                <Select
                  value={formData.district}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, district: v }))}
                  disabled={!formData.state}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={formData.state ? "Pilih kawasan" : "Pilih negeri dahulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getDistrictsForState(formData.state).map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium mt-1">{user?.district || "Tidak ditetapkan"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}