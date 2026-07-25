import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getChildDisplayName } from "@/lib/childUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Lock, RefreshCw, Copy, Check, AlertCircle, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function ChildCredentialManager({ open, onOpenChange, child, onCredentialsUpdated }) {
  const [resetting, setResetting] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [copied, setCopied] = useState(null);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast({ title: "Disalin! 📋", description: `${field} telah disalin ke papan klip.` });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({ title: "Gagal", description: "Tidak dapat menyalin.", variant: "destructive" });
    }
  };

  // 1. Reset Password Handler
  const handleResetPassword = async () => {
    setResetting("password");
    try {
      const response = await base44.functions.invoke("resetChildCredentials", {
        child_id: child.id,
        action: "reset_password",
      });

      if (response.data?.success) {
        setResetResult({ type: "password", value: response.data.password });
        toast({ title: "Kata Laluan Dijenakan 🎉", description: "Kata laluan baharu berjaya dijana." });
        if (onCredentialsUpdated) onCredentialsUpdated();
      } else {
        toast({ title: "Gagal", description: response.data?.error || "Gagal set kata laluan.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
    } finally {
      setResetting(null);
    }
  };

  // 2. Reset PIN Handler
  const handleResetPin = async () => {
    if (!/^\d{4,6}$/.test(newPin)) {
      toast({ title: "PIN Tidak Sah", description: "PIN mestilah 4 hingga 6 digit nombor.", variant: "destructive" });
      return;
    }

    setResetting("pin");
    try {
      const response = await base44.functions.invoke("resetChildCredentials", {
        child_id: child.id,
        action: "reset_pin",
        new_pin: newPin,
      });

      if (response.data?.success) {
        setResetResult({ type: "pin", value: newPin });
        toast({ title: "PIN Disimpan! 🔑", description: "PIN log masuk baharu telah diaktifkan." });
        setNewPin("");
        if (onCredentialsUpdated) onCredentialsUpdated();
      } else {
        toast({ title: "Gagal", description: response.data?.error || "Gagal menetapkan PIN.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
    } finally {
      setResetting(null);
    }
  };

  // 3. Toggle PIN Login Mode Handler
  const handleTogglePin = async () => {
    const isEnabling = !child?.pin_enabled;

    if (isEnabling && (!newPin || !/^\d{4,6}$/.test(newPin))) {
      toast({
        title: "Sila Masukkan PIN",
        description: "Masukkan PIN 4-digit dalam ruangan di atas sebelum membolehkan log masuk PIN.",
        variant: "destructive"
      });
      return;
    }

    setResetting("toggle_pin");
    try {
      const response = await base44.functions.invoke("resetChildCredentials", {
        child_id: child.id,
        action: isEnabling ? "enable_pin" : "disable_pin",
        new_pin: isEnabling ? newPin : undefined,
      });

      if (response.data?.success) {
        toast({ 
          title: isEnabling ? "Log Masuk PIN Didayakan" : "Log Masuk PIN Dinyahdayakan", 
          description: response.data.message 
        });
        setNewPin("");
        if (onCredentialsUpdated) onCredentialsUpdated();
      } else {
        toast({ title: "Gagal", description: response.data?.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
    } finally {
      setResetting(null);
    }
  };

  // 4. Unlock Account Handler
  const handleUnlockAccount = async () => {
    setResetting("unlock");
    try {
      const response = await base44.functions.invoke("resetChildCredentials", {
        child_id: child.id,
        action: "unlock_account",
      });

      if (response.data?.success) {
        toast({ title: "Akaun Dibuka Kunci! 🔓", description: "Anak anda kini boleh log masuk semula." });
        if (onCredentialsUpdated) onCredentialsUpdated();
      } else {
        toast({ title: "Gagal", description: response.data?.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
    } finally {
      setResetting(null);
    }
  };

  if (!child) return null;

  const displayName = getChildDisplayName(child);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-slate-800">
            <Key className="w-5 h-5 text-indigo-600" />
            Pengurusan Kredensial Log Masuk
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Tetapan kualiti akaun untuk {displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* USERNAME & STUDENT ID CARD */}
          <Card className="border-slate-100 rounded-2xl shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-800">
                <User className="w-4 h-4 text-indigo-600" />
                Username & ID Murid
              </CardTitle>
              <CardDescription className="text-xs">Pengenalan tetap untuk log masuk ke portal murid</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Username */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Username Log Masuk</p>
                  <p className="text-sm font-black font-mono text-slate-800">{child.username || "Tiada Username"}</p>
                </div>
                {child.username && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(child.username, "Username")}
                    className="h-8 px-2.5 rounded-lg text-slate-500"
                  >
                    {copied === "Username" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>

              {/* Student ID */}
              {child.student_id && (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ID Murid (SQ-XXXXXX)</p>
                    <p className="text-sm font-black font-mono text-indigo-600">{child.student_id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(child.student_id, "ID Murid")}
                    className="h-8 px-2.5 rounded-lg text-slate-500"
                  >
                    {copied === "ID Murid" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PASSWORD CARD */}
          <Card className="border-slate-100 rounded-2xl shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-800">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  Kata Laluan
                </CardTitle>
                <Badge className="bg-slate-100 text-slate-600 text-[9px] font-bold">Automatik</Badge>
              </div>
              <CardDescription className="text-xs">Dijana secara rawak untuk kegunaan murid</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {resetResult?.type === "password" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-amber-50 rounded-xl border border-amber-200"
                >
                  <p className="text-[10px] font-bold text-amber-800 mb-1">Kata Laluan Baharu (Sila simpan ini!):</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black font-mono text-amber-900 tracking-wider">{resetResult.value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(resetResult.value, "Kata Laluan")}
                      className="h-7 px-2 text-amber-800"
                    >
                      {copied === "Kata Laluan" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </motion.div>
              )}

              <Button
                onClick={handleResetPassword}
                disabled={resetting === "password"}
                className="w-full h-10 text-xs font-bold rounded-xl border-slate-200"
                variant="outline"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${resetting === "password" ? "animate-spin" : ""}`} />
                {resetting === "password" ? "Menjana..." : "Jana Kata Laluan Baharu"}
              </Button>
            </CardContent>
          </Card>

          {/* PIN MANAGEMENT CARD */}
          <Card className="border-slate-100 rounded-2xl shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-800">
                  <Key className="w-4 h-4 text-indigo-600" />
                  PIN Log Masuk 4-Digit
                </CardTitle>
                <Badge variant={child.pin_enabled ? "default" : "secondary"} className="text-[9px] font-bold">
                  {child.pin_enabled ? "Aktif" : "Dinyahdayakan"}
                </Badge>
              </div>
              <CardDescription className="text-xs">PIN nombor mudah untuk murid log masuk dengan pantas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {resetResult?.type === "pin" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-emerald-50 rounded-xl border border-emerald-200"
                >
                  <p className="text-[10px] font-bold text-emerald-800 mb-1">PIN Baharu Berjaya Disimpan:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black font-mono tracking-widest text-emerald-900">{resetResult.value}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(resetResult.value, "PIN")} className="h-7 px-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="new-pin" className="text-xs font-bold text-slate-600">Tetapkan PIN Baharu (4-6 Digit)</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-pin"
                    type="password"
                    inputMode="numeric"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••"
                    maxLength={6}
                    className="flex-1 font-mono tracking-widest text-center text-sm font-black h-10 rounded-xl border-slate-200"
                  />
                  <Button
                    onClick={handleResetPin}
                    disabled={resetting === "pin" || !newPin}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-10 px-4"
                  >
                    {resetting === "pin" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan PIN"}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleTogglePin}
                variant="outline"
                disabled={resetting === "toggle_pin"}
                className="w-full h-10 text-xs font-bold rounded-xl border-slate-200"
              >
                {child.pin_enabled ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1.5 text-slate-500" />
                    Nyahdayakan Log Masuk PIN
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1.5 text-indigo-600" />
                    Dayakan Log Masuk PIN
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* ACCOUNT LOCK STATUS CARD */}
          {child.account_locked && (
            <Card className="border-red-200 bg-red-50/60 rounded-2xl">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-extrabold text-sm text-red-800">Akaun Dikunci Sementara</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Akaun ini telah dikunci secara automatik kerana terlalu banyak percubaan log masuk yang salah.
                    </p>
                    <Button 
                      onClick={handleUnlockAccount} 
                      disabled={resetting === "unlock"}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-8 px-4 mt-2 shadow-xs"
                    >
                      {resetting === "unlock" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Buka Kunci Akaun
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
