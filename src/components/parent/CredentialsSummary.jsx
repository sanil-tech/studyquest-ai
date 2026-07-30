import React, { useState, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Copy, Check, Key, Lock, User, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CredentialsSummary({ open, onOpenChange, credentials, childName }) {
  const [copiedField, setCopiedField] = useState(null);
  const cardRef = useRef(null);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({ title: "Copied!", description: `${field} copied to clipboard` });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({ title: "Failed", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };

  const downloadPDF = async () => {
    try {
      const element = cardRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 20, pdfWidth, pdfHeight);
      pdf.save(`${childName || "Child"}-Login-Card.pdf`);
      
      toast({ title: "Downloaded!", description: "Login card saved as PDF" });
    } catch (err) {
      toast({ title: "Failed", description: "Could not generate PDF", variant: "destructive" });
    }
  };

  const printCard = () => {
    const printWindow = window.open("", "_blank");
    const cardContent = cardRef.current.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${childName || "Child"} - Login Card</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .card { border: 2px solid #6366f1; border-radius: 16px; padding: 32px; max-width: 500px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: bold; color: #6366f1; }
            .credential { margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 8px; }
            .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .value { font-size: 18px; font-weight: bold; font-family: monospace; }
            .warning { margin-top: 24px; padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="card">${cardContent}</div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  if (!credentials) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Login Credentials Created
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              <strong>Important:</strong> The password is shown only once. Please save it securely or download the login card.
            </AlertDescription>
          </Alert>

          {/* Login Card Preview */}
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-primary/30 p-6"
          >
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-primary">StudyQuest Login Card</h3>
              <p className="text-sm text-muted-foreground mt-1">{childName || "Child"}</p>
            </div>

            <div className="space-y-4">
              {/* Student ID */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase">Student ID</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary font-mono">{credentials.student_id}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.student_id, "student_id")}
                  >
                    {copiedField === "student_id" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Username */}
              {credentials.username && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase">Username (Optional)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold font-mono">{credentials.username}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(credentials.username, "username")}
                    >
                      {copiedField === "username" ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-amber-600 uppercase">Password (Save This!)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-amber-700 font-mono">{credentials.password}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.password, "password")}
                  >
                    {copiedField === "password" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* PIN (if enabled) */}
              {credentials.pin_enabled && credentials.pin && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase">PIN Code</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-mono tracking-widest">{credentials.pin}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(credentials.pin, "pin")}
                    >
                      {copiedField === "pin" ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="mt-6 p-3 bg-amber-100 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800 text-center">
                ⚠️ Keep this card safe! Password cannot be viewed again after closing this screen.
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={downloadPDF} className="h-12 rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={printCard} variant="outline" className="h-12 rounded-xl">
              <Printer className="w-4 h-4 mr-2" />
              Print Card
            </Button>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full h-12 rounded-xl bg-primary"
          >
            I've Saved the Credentials - Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}