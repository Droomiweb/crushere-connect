import { useState, useRef, useEffect } from "react";
import { Mail, KeyRound, Loader2, Check, X, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PasswordResetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

type ResetStep = "request" | "verify" | "new_password" | "success";

export default function PasswordReset({ open, onOpenChange, email }: PasswordResetProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<ResetStep>("request");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setStep("verify");
      setCountdown(60);
      toast({
        title: "OTP Sent!",
        description: `Password reset code sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length < 8) {
      toast({ title: "Keep going!", description: "Please enter the full 8-digit OTP.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });
      if (error) throw error;
      setStep("new_password");
      toast({ title: "OTP Verified! ✅", description: "Now set your new password." });
    } catch (error: any) {
      toast({ title: "Invalid OTP", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setStep("success");
      toast({ title: "Password Reset! ✨", description: "Your password has been updated successfully." });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 7) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (paste.length > 0) {
      const newOtp = paste.split("").concat(Array(8).fill("")).slice(0, 8);
      setOtp(newOtp);
      otpRefs.current[Math.min(paste.length, 7)]?.focus();
    }
    e.preventDefault();
  };

  // Reset state when closing/opening
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("request");
        setOtp(["", "", "", "", "", "", "", ""]);
        setNewPassword("");
        setConfirmPassword("");
        setLoading(false);
      }, 500);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border rounded-[32px] overflow-hidden p-0 gap-0">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5 mx-auto shadow-glow rotate-3">
              {step === "request" && <Mail size={32} className="text-white" />}
              {step === "verify" && <ShieldCheck size={32} className="text-white" />}
              {step === "new_password" && <KeyRound size={32} className="text-white" />}
              {step === "success" && <Check size={32} className="text-white" />}
            </div>
            <DialogTitle className="text-3xl font-display font-black text-center">
              {step === "request" && "Reset Password"}
              {step === "verify" && "Verify Email"}
              {step === "new_password" && "New Password"}
              {step === "success" && "Perfect! ✨"}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2">
              {step === "request" && "We'll send a code to your registered email."}
              {step === "verify" && `Enter the 8-digit code sent to ${email}`}
              {step === "new_password" && "Set a strong password you can remember."}
              {step === "success" && "Your password has been changed successfully."}
            </DialogDescription>
          </DialogHeader>

          {step === "request" && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                <p className="text-sm font-semibold mb-1 text-foreground/80">Associated Email</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading || countdown > 0}
                className="w-full btn-brand py-5 rounded-2xl text-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Send OTP Link →"}
              </button>
              {countdown > 0 && (
                <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest">
                  Resend in {countdown}s
                </p>
              )}
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-8">
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="w-8 h-12 text-center text-lg font-bold crushere-input rounded-xl border border-white/10 focus:border-primary transition-all bg-white/5"
                  />
                ))}
              </div>
              <div className="space-y-4">
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.join("").length < 8}
                  className="w-full btn-brand py-5 rounded-2xl text-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Verify Code →"}
                </button>
                <button
                  onClick={() => setStep("request")}
                  className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center"
                >
                  I didn't get a code
                </button>
              </div>
            </div>
          )}

          {step === "new_password" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="crushere-input w-full px-5 py-4 rounded-2xl text-base pr-12 bg-white/5"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="crushere-input w-full px-5 py-4 rounded-2xl text-base bg-white/5"
                />
              </div>
              <button
                onClick={handleResetPassword}
                disabled={loading || !newPassword || newPassword !== confirmPassword}
                className="w-full btn-brand py-5 rounded-2xl text-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-glow"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Update Password ✨"}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-6 pt-4">
              <div className="p-8 rounded-[40px] bg-green-500/10 border border-green-500/20 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-green-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                <div className="relative z-10">
                  <p className="text-green-500 font-bold mb-2">Done!</p>
                  <p className="text-xs text-green-500/70">Your new password is now active. Use it next time you login.</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-full bg-white/10 hover:bg-white/15 py-5 rounded-2xl text-sm font-black uppercase tracking-widest text-foreground transition-all active:scale-[0.98]"
              >
                Close Settings
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
