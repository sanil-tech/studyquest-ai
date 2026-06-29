import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { X, QrCode, IdCard, KeyRound, Mail, UserPlus, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LinkChildModal({ onClose, onLinked }) {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState("student_id");
  const [studentId, setStudentId] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [scanMode, setScanMode] = useState(false);

  const resetForm = () => {
    setStudentId("");
    setLinkCode("");
    setChildEmail("");
  };

  const handleLinkByStudentId = async () => {
    if (!studentId.trim()) {
      toast({
        title: "Student ID required",
        description: "Please enter your child's Student ID",
        variant: "destructive",
      });
      return;
    }

    setLinking(true);
    try {
      const result = await base44.functions.invoke('linkParentToChild', {
        method: 'student_id',
        student_id: studentId.trim().toUpperCase()
      });

      const childName = result?.data?.child?.name || result?.child?.name || "your child";
      toast({
        title: "Link Request Sent!",
        description: `${childName} needs to approve the connection.`,
      });
      resetForm();
      onLinked?.();
    } catch (err) {
      toast({
        title: "Link Failed",
        description: err.message || "Please check the Student ID and try again",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  const handleLinkByCode = async () => {
    if (!linkCode.trim()) {
      toast({
        title: "Link Code required",
        description: "Please enter the 8-character Link Code",
        variant: "destructive",
      });
      return;
    }

    setLinking(true);
    try {
      const result = await base44.functions.invoke('linkParentToChild', {
        method: 'link_code',
        link_code: linkCode.trim().toUpperCase()
      });

      const childName = result?.data?.child?.name || result?.child?.name || "your child";
      toast({
        title: "Successfully Linked!",
        description: `You are now connected to ${childName}`,
      });
      resetForm();
      onLinked?.();
    } catch (err) {
      toast({
        title: "Link Failed",
        description: err.message || "Code may be expired or invalid",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  const handleLinkByEmail = async () => {
    if (!childEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your child's email address",
        variant: "destructive",
      });
      return;
    }

    setLinking(true);
    try {
      // Create a LinkRequest
      await base44.entities.LinkRequest.create({
        student_email: childEmail.trim(),
        parent_email: (await base44.auth.me()).email,
        initiated_by: "parent",
        status: "pending"
      });

      toast({
        title: "Request Sent!",
        description: "Your child will receive a notification to approve the link.",
      });
      resetForm();
      onLinked?.();
    } catch (err) {
      toast({
        title: "Request Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold">Add Child</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Tabs value={selectedMethod} onValueChange={setSelectedMethod}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="student_id" className="flex items-center gap-2">
              <IdCard className="w-4 h-4" />
              <span className="hidden sm:inline">Student ID</span>
            </TabsTrigger>
            <TabsTrigger value="link_code" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              <span className="hidden sm:inline">Link Code</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student_id" className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                Enter your child's unique StudyQuest Student ID. They can find it in their Profile page.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder="SQ-XXXXXX"
                className="font-mono uppercase"
              />
            </div>
            <Button
              onClick={handleLinkByStudentId}
              disabled={linking}
              className="w-full"
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                "Send Link Request"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="link_code" className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                Enter the 8-character Parent Link Code from your child's Profile. Valid for 24 hours.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkCode">Parent Link Code</Label>
              <Input
                id="linkCode"
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                className="font-mono uppercase"
                maxLength={8}
              />
            </div>
            <Button
              onClick={handleLinkByCode}
              disabled={linking}
              className="w-full"
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link Account"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                Send a link request to your child's email address. They'll need to approve it.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="childEmail">Child's Email</Label>
              <Input
                id="childEmail"
                type="email"
                value={childEmail}
                onChange={(e) => setChildEmail(e.target.value)}
                placeholder="child@example.com"
              />
            </div>
            <Button
              onClick={handleLinkByEmail}
              disabled={linking}
              className="w-full"
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Email Request"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Need help? Ask your child to share their Student ID or Link Code from their Profile page.
          </p>
        </div>
      </motion.div>
    </div>
  );
}