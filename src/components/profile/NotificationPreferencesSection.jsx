import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Trophy, BookOpen } from "lucide-react";

export default function NotificationPreferencesSection({ editing, formData, setFormData }) {
  const notifPrefs = formData.notification_preferences || {
    email_notifications: true,
    push_notifications: true,
    quiz_reminders: true,
    daily_learning_reminder: true,
    parent_progress_reports: true,
    weekly_achievement_summary: true
  };

  const updateNotifPrefs = (updates) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: { ...notifPrefs, ...updates }
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading font-bold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <Switch
              checked={notifPrefs.email_notifications}
              onCheckedChange={(v) => updateNotifPrefs({ email_notifications: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Browser notifications</p>
              </div>
            </div>
            <Switch
              checked={notifPrefs.push_notifications}
              onCheckedChange={(v) => updateNotifPrefs({ push_notifications: v })}
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Learning</p>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Daily Learning Reminder</p>
                  <p className="text-xs text-muted-foreground">Get reminded to study</p>
                </div>
              </div>
              <Switch
                checked={notifPrefs.daily_learning_reminder}
                onCheckedChange={(v) => updateNotifPrefs({ daily_learning_reminder: v })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Quiz Reminders</p>
                  <p className="text-xs text-muted-foreground">Never miss a quiz</p>
                </div>
              </div>
              <Switch
                checked={notifPrefs.quiz_reminders}
                onCheckedChange={(v) => updateNotifPrefs({ quiz_reminders: v })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Progress Reports</p>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Weekly Achievement Summary</p>
                <p className="text-xs text-muted-foreground">Summary of your weekly progress</p>
              </div>
              <Switch
                checked={notifPrefs.weekly_achievement_summary}
                onCheckedChange={(v) => updateNotifPrefs({ weekly_achievement_summary: v })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Parent Progress Reports</p>
                <p className="text-xs text-muted-foreground">Share progress with parents</p>
              </div>
              <Switch
                checked={notifPrefs.parent_progress_reports}
                onCheckedChange={(v) => updateNotifPrefs({ parent_progress_reports: v })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}