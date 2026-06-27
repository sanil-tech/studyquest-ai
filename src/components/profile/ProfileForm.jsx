import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
            {isStudent ? "School Profile" : "Personal Details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <div className="mt-1 p-2 bg-muted/50 rounded-md border border-border/50">
                <p className="text-sm font-medium">{user?.full_name || "Not set"}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                <span>ℹ️</span>
                <span>Full name cannot be changed. Use the Nickname field for your preferred name.</span>
              </p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Nickname (Optional)</Label>
              {editing ? (
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="Preferred name"
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">{user?.nickname || "Not set"}</p>
              )}
            </div>

            {isStudent && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Year Level</Label>
                  {editing ? (
                    <Select 
                      value={formData.school_year} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, school_year: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard 1">Standard 1</SelectItem>
                        <SelectItem value="Standard 2">Standard 2</SelectItem>
                        <SelectItem value="Standard 3">Standard 3</SelectItem>
                        <SelectItem value="Standard 4">Standard 4</SelectItem>
                        <SelectItem value="Standard 5">Standard 5</SelectItem>
                        <SelectItem value="Standard 6">Standard 6</SelectItem>
                        <SelectItem value="Form 1">Form 1</SelectItem>
                        <SelectItem value="Form 2">Form 2</SelectItem>
                        <SelectItem value="Form 3">Form 3</SelectItem>
                        <SelectItem value="Form 4">Form 4</SelectItem>
                        <SelectItem value="Form 5">Form 5</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{user?.school_year || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Class</Label>
                  {editing ? (
                    <Input
                      value={formData.class_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                      placeholder="e.g. 1A, 3B"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{user?.class_name || "Not set"}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">School Name</Label>
              {editing ? (
                <Input
                  value={formData.school_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
                  placeholder={isStudent ? "e.g. SK Taman Jaya" : "Your school/institution"}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">{user?.school_name || "Not set"}</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Gender</Label>
              {editing ? (
                <Select 
                  value={formData.gender} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium mt-1 capitalize">{user?.gender || "Not set"}</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Date of Birth</Label>
              {editing ? (
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">
                  {user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : "Not set"}
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Country</Label>
              {editing ? (
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">{user?.country || "Not set"}</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">State/Region</Label>
              {editing ? (
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State or region"
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">{user?.state || "Not set"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}