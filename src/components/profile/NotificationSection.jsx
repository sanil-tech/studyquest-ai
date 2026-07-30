import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";

export default function NotificationSection({ user, editing, formData, setFormData }) {
  const prefs = formData.notification_preferences || {};

  const togglePref = (key) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: {
        ...prefs,
        [key]: !prefs[key]
      }
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading font-bold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={prefs.email_notifications ?? true}
                onCheckedChange={() => togglePref("email_notifications")}
                disabled={!editing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Browser notifications</p>
              </div>
              <Switch
                checked={prefs.push_notifications ?? true}
                onCheckedChange={() => togglePref("push_notifications")}
                disabled={!editing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Quiz Reminders</Label>
                <p className="text-xs text-muted-foreground">Get reminded to complete quizzes</p>
              </div>
              <Switch
                checked={prefs.quiz_reminders ?? true}
                onCheckedChange={() => togglePref("quiz_reminders")}
                disabled={!editing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Daily Learning Reminder</Label>
                <p className="text-xs text-muted-foreground">Daily study motivation</p>
              </div>
              <Switch
                checked={prefs.daily_learning_reminder ?? true}
                onCheckedChange={() => togglePref("daily_learning_reminder")}
                disabled={!editing}
              />
            </div>

            {user?.app_role === "parent" && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Progress Reports</Label>
                    <p className="text-xs text-muted-foreground">Weekly child progress summary</p>
                  </div>
                  <Switch
                    checked={prefs.parent_progress_reports ?? true}
                    onCheckedChange={() => togglePref("parent_progress_reports")}
                    disabled={!editing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Achievement Summary</Label>
                    <p className="text-xs text-muted-foreground">Weekly achievements and milestones</p>
                  </div>
                  <Switch
                    checked={prefs.weekly_achievement_summary ?? true}
                    onCheckedChange={() => togglePref("weekly_achievement_summary")}
                    disabled={!editing}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}