import React from "react";
import { Target, Award, BookOpen, Bell, CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

const favoriteSubjects = [
  "Mathematics", "Science", "English", "Bahasa Melayu", "History", 
  "Geography", "Art", "Music", "Physical Education", "Computer Science"
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
            <Label htmlFor="language">Preferred Language</Label>
            <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ms">Bahasa Melayu</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ta">Tamil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Daily Learning Goal</Label>
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
            <Label>Favorite Subjects (select all that apply)</Label>
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
            <Label>Difficulty Preference</Label>
            <Select value={difficultyPreference} onValueChange={setDifficultyPreference}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - Build confidence first</SelectItem>
                <SelectItem value="medium">Medium - Balanced challenge</SelectItem>
                <SelectItem value="hard">Hard - Advanced learner</SelectItem>
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
                <Label htmlFor="email-notif" className="cursor-pointer">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
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
                    <Label htmlFor="progress-reports" className="cursor-pointer">Progress Reports</Label>
                    <p className="text-xs text-muted-foreground">Weekly child progress summaries</p>
                  </div>
                  <Switch
                    id="progress-reports"
                    checked={progressReports}
                    onCheckedChange={setProgressReports}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="weekly-summary" className="cursor-pointer">Weekly Summary</Label>
                    <p className="text-xs text-muted-foreground">Achievement highlights every week</p>
                  </div>
                  <Switch
                    id="weekly-summary"
                    checked={weeklySummary}
                    onCheckedChange={setWeeklySummary}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="learning-alerts" className="cursor-pointer">Learning Alerts</Label>
                    <p className="text-xs text-muted-foreground">Reminders for quiz and study sessions</p>
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
                  <Label htmlFor="learning-alerts" className="cursor-pointer">Learning Alerts</Label>
                  <p className="text-xs text-muted-foreground">Reminders for class activities</p>
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