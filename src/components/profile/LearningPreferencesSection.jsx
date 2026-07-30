import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { BookOpen, Target, Award } from "lucide-react";

export default function LearningPreferencesSection({ editing, formData, setFormData }) {
  const learningPrefs = formData.learning_preferences || {
    daily_goal_minutes: 20,
    favorite_subjects: [],
    difficulty_preference: "medium"
  };

  const updateLearningPrefs = (updates) => {
    setFormData(prev => ({
      ...prev,
      learning_preferences: { ...learningPrefs, ...updates }
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
            <Target className="w-5 h-5" />
            Learning Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Daily Study Goal
            </Label>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {learningPrefs.daily_goal_minutes} minutes/day
                </span>
              </div>
              <Slider
                value={[learningPrefs.daily_goal_minutes]}
                onValueChange={([val]) => updateLearningPrefs({ daily_goal_minutes: val })}
                min={10}
                max={60}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10 min</span>
                <span>20 min</span>
                <span>30 min</span>
                <span>60 min</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <Award className="w-4 h-4" />
              Difficulty Preference
            </Label>
            <Select 
              value={learningPrefs.difficulty_preference} 
              onValueChange={(v) => updateLearningPrefs({ difficulty_preference: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - Build confidence</SelectItem>
                <SelectItem value="medium">Medium - Balanced challenge</SelectItem>
                <SelectItem value="hard">Hard - Advanced learner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Favorite Subjects</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Select your favorite subjects to personalize your learning experience
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Mathematics", "Science", "English", "Bahasa Melayu", "History", "Geography"].map((subject) => (
                <button
                  key={subject}
                  onClick={() => {
                    const current = learningPrefs.favorite_subjects || [];
                    const updated = current.includes(subject)
                      ? current.filter(s => s !== subject)
                      : [...current, subject];
                    updateLearningPrefs({ favorite_subjects: updated });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    (learningPrefs.favorite_subjects || []).includes(subject)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}