import React from "react";
import { School, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const educationLevels = [
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5"
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
            <Label htmlFor="school">School Name *</Label>
            <Input
              id="school"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. SK Taman Jaya"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="education">Education Level *</Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
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
                      Recommended for age {age}: Form {age - 12}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Class (optional)</Label>
              <Input
                id="grade"
                value={gradeYear}
                onChange={(e) => setGradeYear(e.target.value)}
                placeholder="e.g. Jaya, Bestari"
              />
            </div>
          </div>
        </>
      )}

      {/* Parent Fields */}
      {user.app_role === "parent" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="numChildren">Number of Children *</Label>
            <Input
              id="numChildren"
              type="number"
              min="1"
              max="10"
              value={numChildren}
              onChange={(e) => setNumChildren(e.target.value)}
              placeholder="How many children do you have?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childrenNames">Children's Names (optional)</Label>
            <Input
              id="childrenNames"
              value={childrenNames}
              onChange={(e) => setChildrenNames(e.target.value)}
              placeholder="e.g. Ali, Siti, Ahmad"
            />
          </div>
        </>
      )}

      {/* Teacher Fields */}
      {user.app_role === "teacher" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="subjects">Subjects Taught *</Label>
            <Input
              id="subjects"
              value={teachingSubjects}
              onChange={(e) => setTeachingSubjects(e.target.value)}
              placeholder="e.g. Mathematics, Science, English"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teachingLevel">Teaching Level *</Label>
            <Select value={teachingLevel} onValueChange={setTeachingLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary School</SelectItem>
                <SelectItem value="secondary">Secondary School</SelectItem>
                <SelectItem value="both">Both Levels</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </motion.div>
  );
}