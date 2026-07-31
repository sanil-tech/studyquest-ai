import React from "react";
import { Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const educationLevels = [
  "Tahun 1", "Tahun 2", "Tahun 3", "Tahun 4", "Tahun 5", "Tahun 6",
  "Tingkatan 1", "Tingkatan 2", "Tingkatan 3", "Tingkatan 4", "Tingkatan 5"
];

export default function RoleSpecificStep({
  user,
  schoolName, setSchoolName,
  educationLevel, setEducationLevel,
  gradeYear, setGradeYear,
  age,
  numChildren, setNumChildren,
  childrenNames, setChildrenNames,
  teachingSubjects, setTeachingSubjects,
  teachingLevel, setTeachingLevel
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Student Fields */}
      {user.app_role === "student" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="school">Nama Sekolah *</Label>
            <Input
              id="school"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Cth: SK Taman Jaya"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="education">Tahap Pendidikan *</Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahap" />
                </SelectTrigger>
                <SelectContent>
                  {educationLevels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {age && !educationLevel && (
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="p-3">
                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Disyorkan untuk umur {age}: Tingkatan {age - 12}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Kelas (Pilihan)</Label>
              <Input
                id="grade"
                value={gradeYear}
                onChange={(e) => setGradeYear(e.target.value)}
                placeholder="Cth: Jaya, Bestari"
              />
            </div>
          </div>
        </>
      )}

      {/* Parent Fields */}
      {user.app_role === "parent" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="numChildren">Bilangan Anak *</Label>
            <Input
              id="numChildren"
              type="number"
              min="1"
              max="10"
              value={numChildren}
              onChange={(e) => setNumChildren(e.target.value)}
              placeholder="Berapa orang anak anda?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childrenNames">Nama Anak-anak (Pilihan)</Label>
            <Input
              id="childrenNames"
              value={childrenNames}
              onChange={(e) => setChildrenNames(e.target.value)}
              placeholder="Cth: Ali, Siti, Ahmad"
            />
          </div>
        </>
      )}

      {/* Teacher Fields */}
      {user.app_role === "teacher" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="subjects">Subjek Diajar *</Label>
            <Input
              id="subjects"
              value={teachingSubjects}
              onChange={(e) => setTeachingSubjects(e.target.value)}
              placeholder="Cth: Matematik, Sains, Bahasa Inggeris"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teachingLevel">Tahap Mengajar *</Label>
            <Select value={teachingLevel} onValueChange={setTeachingLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tahap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Sekolah Rendah</SelectItem>
                <SelectItem value="secondary">Sekolah Menengah</SelectItem>
                <SelectItem value="both">Kedua-dua Tahap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </motion.div>
  );
}