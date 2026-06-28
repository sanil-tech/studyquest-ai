import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { X, IdCard, KeyRound, Mail, Loader2 } from "lucide-react";
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

  const resetFormFields = () => {
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
      // FIX: Unpack wrapped data object from edge function response safely
      const response = await base44.functions.invoke("linkParentToChild", {
        method: "student_id",
        student_id: studentId.trim().toUpperCase()
      });

      if (response.data?.success) {
        toast({
          title: "Link Request Sent!",
          description: `${response.data.child?.name || "Your child"} needs to approve the connection.`,
        });
        resetFormFields();
        onLinked?.();
      } else {
        throw new Error(response.data?.error || "Failed to initiate link request");
      }
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
      // FIX: Unpack wrapped data object from edge function response safely
      const response = await base44.functions.invoke("linkParentToChild", {
        method: "link_code",
        link_code: linkCode.trim().toUpperCase()
      });

      if (response.data?.success) {
        toast({
          title: "Successfully Linked!",
          description: `You are now connected to ${response.data.child?.name || "your child"}`,
        });
        resetFormFields();
        onLinked?.();
      } else {
        throw new Error(response.data?.error || "Invalid or expired authorization code");
      }
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
      // FIX: Standardize architecture to run through the unified security edge function
      const response = await base44.functions.invoke("linkParentToChild", {
        method: "email",
        student_email: childEmail.trim().toLowerCase(),
      });

      if (response.data?.success) {
        toast({
          title: "Request Sent!",
          description: "Your child will receive a notification to approve the link.",
        });
        resetFormFields();
        onLinked?.();
      } else {
        throw new Error(response.data?.error || "Could not locate a profile matching that email");
      }
    } catch (err) {
      toast({
        title: "Request Failed",
        description: err.message || "Please check the email and try again",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold text-gray-900">Add Child Account</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
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

          <TabsContent value="student_id" className="space-y-4 focus-visible:outline-none">
            <div className="bg-primary/5 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your child's unique StudyQuest Student ID. They can locate this string on their main account Profile tab.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder="SQ-XXXXXX"
                className="font-mono uppercase tracking-wider"
              />
            </div>
            <Button
              onClick={handleLinkByStudentId}
              disabled={linking}
              className="w-full h-11"
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

          <TabsContent value="link_code" className="space-y-4 focus-visible:outline-none">
            <div className="bg-primary/5 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter the temporary 8-character Parent Link Code generated on your child's profile page. These codes expire after 24 hours.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkCode">Parent Link Code</Label>
              <Input
                id="linkCode"
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                className="font-mono uppercase tracking-widest text-center text-lg"
                maxLength={8}
              />
            </div>
            <Button
              onClick={handleLinkByCode}
              disabled={linking}
              className="w-full h-11"
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Linking Accounts...
                </>
              ) : (
                "Link Account Instantly"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 focus-visible:outline-none">
            <div className="bg-primary/5 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Send an invitation straight to your child's registered email address. The profile link activates as soon as they authorize it.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="childEmail">Child's Email Address</Label>
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
              className="w-full h-11"
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                "Send Email Request"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-muted-foreground text-center">
            Need help? Ask your child to pull up their profile settings to retrieve their credentials.
          </p>
        </div>
      </motion.div>
    </div>
  );
}