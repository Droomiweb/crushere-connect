import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone } from "lucide-react";

type Step = "phone" | "otp";

export default function Auth() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [phoneError, setPhoneError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleSendOTP = () => {
    if (phone.replace(/\D/g, "").length < 10) {
      setPhoneError("Please enter a valid phone number");
      return;
    }
    setPhoneError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      setResendTimer(30);
    }, 1200);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every(d => d !== "")) {
      setTimeout(() => verifyOtp(), 200);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/onboarding");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="relative w-full max-w-mobile min-h-screen flex flex-col px-6 pt-safe-top">
        {/* Header */}
        <div className="flex items-center gap-3 pt-6 pb-8">
          <button
            onClick={() => step === "otp" ? setStep("phone") : navigate("/")}
            className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center border border-border active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl text-gradient-brand">Crushere</span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-8">
          {["phone", "otp"].map((s, i) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                (step === "phone" && i === 0) || (step === "otp" && i <= 1)
                  ? "bg-primary flex-[2]"
                  : "bg-muted flex-1"
              }`}
            />
          ))}
        </div>

        {step === "phone" ? (
          <div className="animate-slide-up flex flex-col flex-1">
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5 shadow-glow">
                <Phone size={24} className="text-white" />
              </div>
              <h1 className="font-display font-bold text-3xl mb-2">Enter your number</h1>
              <p className="text-muted-foreground text-sm">
                We'll send a one-time code to verify it's you. No spam, ever.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="crushere-input flex items-center px-3 py-4 rounded-2xl text-sm font-medium w-16 justify-center">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneError(""); }}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="crushere-input flex-1 px-4 py-4 rounded-2xl text-base"
                    onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                  />
                </div>
                {phoneError && (
                  <p className="text-crush text-xs mt-2">{phoneError}</p>
                )}
              </div>

              <div className="glass-card p-4 rounded-2xl border border-border/50">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  🔒 Your number is only used for login verification. It's never shared or visible to other users.
                </p>
              </div>
            </div>

            <div className="mt-auto pb-10">
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : "Send OTP →"}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-slide-up flex flex-col flex-1">
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-crush flex items-center justify-center mb-5 shadow-crush animate-crush-pulse">
                <span className="text-2xl">📱</span>
              </div>
              <h1 className="font-display font-bold text-3xl mb-2">Verify OTP</h1>
              <p className="text-muted-foreground text-sm">
                Sent to <span className="text-foreground font-medium">+91 {phone}</span>
              </p>
            </div>

            {/* OTP inputs */}
            <div className="flex gap-3 justify-center mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className={`otp-box ${digit ? "filled" : ""}`}
                />
              ))}
            </div>

            {/* Resend */}
            <div className="text-center mb-8">
              {resendTimer > 0 ? (
                <p className="text-muted-foreground text-sm">
                  Resend in <span className="text-foreground font-medium">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  onClick={() => { setResendTimer(30); setOtp(["", "", "", "", "", ""]); }}
                  className="text-primary font-medium text-sm"
                >
                  Resend OTP
                </button>
              )}
            </div>

            {loading && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" style={{ borderWidth: "3px" }} />
                <p className="text-muted-foreground text-sm">Verifying...</p>
              </div>
            )}

            <div className="mt-auto pb-10">
              <button
                onClick={() => verifyOtp()}
                disabled={loading || otp.some(d => !d)}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-40"
              >
                Verify & Continue →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
