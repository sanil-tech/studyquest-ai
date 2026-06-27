import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Bell, Eye, EyeOff } from "lucide-react";

export default function SecuritySection({ editing, formData, setFormData, onSavePassword }) {
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [passwordData, setPasswordData] = React.useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [changingPassword, setChangingPassword] = React.useState(false);

  const handleChangePassword = async () => {
    if (!passwordData.new_password || passwordData.new_password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("Passwords do not match");
      return;
    }
    
    setChangingPassword(true);
    try {
      await onSavePassword(passwordData);
    } catch (err) {
      console.error("Password change failed:", err);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading font-bold text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Email Address</Label>
              <p className="text-sm font-medium mt-1 text-muted-foreground">Contact support to change email</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Account Type</Label>
              <p className="text-sm font-medium mt-1 capitalize">Standard</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-heading font-semibold mb-3">Change Password</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Current Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !passwordData.new_password}
                className="w-full mt-2"
              >
                {changingPassword ? "Changing..." : "Update Password"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}