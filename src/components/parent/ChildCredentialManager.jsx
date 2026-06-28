import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Lock, RefreshCw, Copy, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function ChildCredentialManager({ open, onOpenChange, child, onChildUpdated }) {
  const [resetting, setResetting] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [copied, setCopied] = useState(null);

  if (!child) return null;

  // FIX: Read backend state correctly using login_method fallback
  const isPinEnabled = child.login_method === "pin" || child.login_method === "both" || !!child.pin_enabled;

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast({ title: "Copied!", description: `${field} copied to clipboard` });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({ title: "Failed", description: "Could not copy", variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    setResetting("password");
    try {
      const response = await base44.functions.invoke("resetChildCredentials", {
        child_id: child.id,
        action: "reset_password",
      });

      if (response.data.success) {
        setResetResult({ type: "password", value: response.data.password });
        toast({ title: "Password Reset", description: "New password generated" });
        onChildUpdated?.(); // Keep parent view fresh
      } else {
        toast({ title: "Failed", description: response.data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setResetting(null);
    }
  };

  const handleResetPin = async () => {
    if (!/^\d{4,6}$/.test(newPin)) {
      toast({ title: "Invalid PIN", description: "PIN must be 4-6 digits", variant: "destructive" });
      return;
    }

    setResetting("pin");
    try {
      const response = await base44.functions.invoke("resetChildCredentials", {
        child_id: child.id,
        action: "reset_pin",
        new_pin: newPin,
      });

      if (response.data.success) {
        setResetResult({ type: "pin", value: newPin });
        toast({ title: "PIN Set", description: "PIN login enabled" });
        setNewPin("");
        onChildUpdated?.(); // Keep parent view fresh
      } else {
        toast({ title: "Failed", description: response.data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setResetting(null);
    }
  };

  const handleTogglePin = async () => {
    // FIX: Base toggle action on verified backend field structure
    const action = isPinEnabled ? "disable_pin" : "enable_pin";
    try {
      const response = await base44.functions.invoke("resetChildCredentials", {
        child_id: child.id,
        action: action,
        new_pin: newPin || undefined,
      });

      if (response.data.success) {
        toast({ 
          title: isPinEnabled ? "PIN Disabled" : "PIN Enabled", 
          description: response.data.message 
        });
        onChildUpdated?.(); // Trigger immediate list refetch
        onOpenChange(false);
      }
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleUnlockAccount = async () => {
    try {
      const response = await base44.functions.invoke("resetChildCredentials", {
        child_id: child.id,
        action: "unlock_account",
      });

      if (response.data.success) {
        toast({ title: "Account Unlocked", description: "Your child can now login again" });
        onChildUpdated?.(); // Instantly clears red lock banners on dashboard
        onOpenChange(false);
      }
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Manage Login Credentials
          </DialogTitle>
          <DialogDescription>
            {getDisplayName(child)} - {child.student_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student ID */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4" />
                Student ID
              </CardTitle>
              <CardDescription>Permanent identifier for login</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-xl font-bold font-mono text-primary">{child.student_id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(child.student_id, "Student ID")}
                >
                  {copied === "Student ID" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </CardTitle>
                <Badge>Required</Badge>
              </div>
              <CardDescription>For children 9+ years old</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetResult?.type === "password" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-amber-50 rounded-lg border-2 border-amber-300"
                >
                  <p className="text-xs font-semibold text-amber-800 mb-2">New Password (save this!)</p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold font-mono text-amber-700">{resetResult.value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(resetResult.value, "Password")}
                    >
                      {copied === "Password" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </motion.div>
              )}

              <Button
                onClick={handleResetPassword}
                disabled={resetting === "password"}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${resetting === "password" ? "animate-spin" : ""}`} />
                {resetting === "password" ? "Generating..." : "Generate New Password"}
              </Button>
            </CardContent>
          </Card>

          {/* PIN */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  PIN Login
                </CardTitle>
                <Badge variant={isPinEnabled ? "default" : "secondary"}>
                  {isPinEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <CardDescription>4-6 digit PIN for younger children</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetResult?.type === "pin" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-muted rounded-lg"
                >
                  <p className="text-xs font-semibold mb-2">New PIN</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-mono tracking-widest">{resetResult.value}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(resetResult.value, "PIN")}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-pin">Set New PIN (4-6 digits)</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-pin"
                    type="password"
                    inputMode="numeric"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••"
                    maxLength={6}
                    className="flex-1 font-mono tracking-widest"
                  />
                  <Button
                    onClick={handleResetPin}
                    disabled={resetting === "pin" || !newPin}
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${resetting === "pin" ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleTogglePin}
                variant="outline"
                className="w-full"
              >
                {isPinEnabled ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Disable PIN Login
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Enable PIN Login
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Account Lock */}
          {child.account_locked && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-800">Account Locked</p>
                    <p className="text-sm text-red-700 mt-1">
                      Too many failed login attempts
                    </p>
                    <Button onClick={handleUnlockAccount} variant="destructive" size="sm" className="mt-3">
                      Unlock Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>💡 Tips:</strong> Save passwords securely. PIN is great for ages 4-8.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}