import React from "react";
import { Target, CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

const favoriteSubjects = [
  "Matematik", "Sains", "Bahasa Inggeris", "Bahasa Melayu", "Sejarah",
  "Geografi", "Seni Visual", "Muzik", "Pendidikan Jasmani", "Sains Komputer"
];

export default function PreferencesStep({
  user,
  preferredLanguage, setPreferredLanguage,
  dailyGoalMinutes, setDailyGoalMinutes,
  favoriteSubjectsList, toggleFavoriteSubject,
  difficultyPreference, setDifficultyPreference,
  emailNotifications, setEmailNotifications,
  progressReports, setProgressReports,
  weeklySummary, setWeeklySummary,
  learningAlerts, setLearningAlerts
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Student Learning Preferences */}
      {user.app_role === "student" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="language">Bahasa Pilihan</Label>
            <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih bahasa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">Bahasa Inggeris</SelectItem>
                <SelectItem value="ms">Bahasa Melayu</SelectItem>
                <SelectItem value="zh">Bahasa Cina</SelectItem>
                <SelectItem value="ta">Bahasa Tamil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Matlamat Belajar Harian</Label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 60].map(minutes => (
                <Button
                  key={minutes}
                  type="button"
                  variant={dailyGoalMinutes === minutes ? "default" : "outline"}
                  className="flex flex-col items-center h-auto py-3"
                  onClick={() => setDailyGoalMinutes(minutes)}
                >
                  <Target className="w-4 h-4 mb-1" />
                  <span className="text-xs font-bold">{minutes}m</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subjek Kegemaran (pilih semua yang berkenaan)</Label>
            <div className="grid grid-cols-2 gap-2">
              {favoriteSubjects.map(subject => (
                <Button
                  key={subject}
                  type="button"
                  variant={favoriteSubjectsList.includes(subject) ? "default" : "outline"}
                  className="justify-start text-sm h-auto py-2"
                  onClick={() => toggleFavoriteSubject(subject)}
                >
                  {favoriteSubjectsList.includes(subject) && <CheckCircle className="w-4 h-4 mr-2" />}
                  {subject}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keutamaan Tahap Kesukaran</Label>
            <Select value={difficultyPreference} onValueChange={setDifficultyPreference}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tahap kesukaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Mudah - Bina keyakinan dahulu</SelectItem>
                <SelectItem value="medium">Sederhana - Cabaran seimbang</SelectItem>
                <SelectItem value="hard">Sukar - Pelajar lanjutan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Parent/Teacher Notifications */}
      {(user.app_role === "parent" || user.app_role === "teacher") && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label htmlFor="email-notif" className="cursor-pointer">Pemberitahuan E-mel</Label>
                <p className="text-xs text-muted-foreground">Terima kemaskini melalui e-mel</p>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            {user.app_role === "parent" && (
              <>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="progress-reports" className="cursor-pointer">Laporan Kemajuan</Label>
                    <p className="text-xs text-muted-foreground">Ringkasan kemajuan anak mingguan</p>
                  </div>
                  <Switch
                    id="progress-reports"
                    checked={progressReports}
                    onCheckedChange={setProgressReports}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="weekly-summary" className="cursor-pointer">Ringkasan Mingguan</Label>
                    <p className="text-xs text-muted-foreground">Sorotan pencapaian setiap minggu</p>
                  </div>
                  <Switch
                    id="weekly-summary"
                    checked={weeklySummary}
                    onCheckedChange={setWeeklySummary}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="learning-alerts" className="cursor-pointer">Amaran Pembelajaran</Label>
                    <p className="text-xs text-muted-foreground">Peringatan untuk sessi kuiz dan belajar</p>
                  </div>
                  <Switch
                    id="learning-alerts"
                    checked={learningAlerts}
                    onCheckedChange={setLearningAlerts}
                  />
                </div>
              </>
            )}

            {user.app_role === "teacher" && (
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="learning-alerts" className="cursor-pointer">Amaran Pembelajaran</Label>
                  <p className="text-xs text-muted-foreground">Peringatan untuk aktiviti kelas</p>
                </div>
                <Switch
                  id="learning-alerts"
                  checked={learningAlerts}
                  onCheckedChange={setLearningAlerts}
                />
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}