import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Sparkles, KeyRound, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Step = "email" | "otp";
type AuthMode = "magic_link" | "password";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [identifier, setIdentifier] = useState(""); // Can be email or username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !window.location.search.includes("admin=true")) {
        navigate("/feed");
      }
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      setAuthMode("password");
    }
    if (params.get("mode") === "signup") {
      setIsSignup(true);
    }
  }, []);

  const validateEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  };

  const handleSendOTP = async () => {
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      toast({
        title: "Magic Link Sent! ✨",
        description: "Check your email for the code.",
      });

      setStep("otp");
      setResendTimer(30);

    } catch (error: any) {
      console.error("Send Email OTP Error:", error);
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!identifier) {
      toast({ title: "Username or Email Required", description: "Please enter your username or email.", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Password Required", description: "Please enter your password.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      let loginEmail = identifier;

      // If not a valid email, assume it's a username and fetch the associated email
      if (!validateEmail(identifier)) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", identifier.toLowerCase())
          .maybeSingle();

        if (!profile) {
          throw new Error("User not found with that username.");
        }

        // Supabase Auth doesn't store email in profiles directly usually, 
        // but it's in auth.users. If we don't have email in profiles, we might need 
        // a RPC or just ensure profiles has email.
        // Actually, let's check if profiles has email. If not, we might need a workaround.
        // For now, let's assume we can fetch it or just use the UID if Supabase allowed it (it doesn't).
        
        // Wait, I should have added email to profiles if I want to support username login easily.
        // Let's check profile columns.
        const { data: profileWithEmail } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", identifier.toLowerCase())
          .maybeSingle();
        
        if (profileWithEmail?.email) {
          loginEmail = profileWithEmail.email;
        } else {
          throw new Error("Could not resolve email for this username. Use email to login.");
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) throw error;

      toast({ title: "Welcome back! 🚀", description: "Successfully logged in." });
      navigate("/feed");
      
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    const otpCode = otp.join("");
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: 'email',
      });

      if (error) throw error;
      
      toast({ title: "Verified! 🚀", description: "Welcome to Crushere." });
      navigate("/onboarding");

    } catch (error: any) {
      toast({
        title: "Verification Failed", 
        description: error.message || "Invalid code.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 7) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 8).split("");
    if (pastedData.length === 0) return;

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 8 && /\d/.test(char)) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    
    // Focus the last filled input or the first empty one
    const focusIndex = Math.min(pastedData.length, 7);
    inputRefs.current[focusIndex]?.focus();
  };


  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="relative w-full max-w-mobile min-h-screen flex flex-col px-6 pt-safe-top">
        {/* Header */}
        <div className="flex items-center gap-3 pt-6 pb-8">
          {step === "otp" && (
            <button
              onClick={() => setStep("email")}
              className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center border border-border active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} className="text-foreground" />
            </button>
          )}
           {step === "email" && (
             <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center border border-border active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} className="text-foreground" />
            </button>
           )}
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl text-gradient-brand">Crushere</span>
          </div>
        </div>

        {/* Progress dots - only for OTP flow */}
        {authMode === "magic_link" && (
          <div className="flex gap-1.5 mb-8">
            {["email", "otp"].map((s, i) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  (step === "email" && i === 0) || (step === "otp" && i <= 1)
                    ? "bg-primary flex-[2]"
                    : "bg-muted flex-1"
                }`}
              />
            ))}
          </div>
        )}

        {step === "email" ? (
          <div className="animate-slide-up flex flex-col flex-1">
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5 shadow-glow">
                {isSignup ? (
                  <Sparkles size={24} className="text-white" />
                ) : authMode === "password" ? (
                  <KeyRound size={24} className="text-white" />
                ) : (
                  <Mail size={24} className="text-white" />
                )}
              </div>
              <h1 className="font-display font-bold text-3xl mb-2">
                {isSignup ? "Create account" : authMode === "password" ? "Welcome back" : "Login with OTP"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isSignup
                  ? "Join Crushere and find your campus crush 💜"
                  : authMode === "password"
                  ? "Enter your username or email to sign in."
                  : "We'll send a verification code to your email."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                  {authMode === "password" ? "Username or Email" : "Email Address"}
                </label>
                <div className="flex gap-2">
                  <div className="crushere-input flex items-center justify-center px-3 py-4 rounded-2xl text-sm font-medium w-14 text-muted-foreground">
                    @
                  </div>
                  <input
                    type={authMode === "password" ? "text" : "email"}
                    value={authMode === "password" ? identifier : email}
                    onChange={e => { 
                      if (authMode === "password") setIdentifier(e.target.value);
                      else setEmail(e.target.value); 
                      setEmailError(""); 
                    }}
                    placeholder={authMode === "password" ? "username or email" : "alex@university.edu"}
                    className="crushere-input flex-1 px-4 py-4 rounded-2xl text-base"
                    onKeyDown={e => e.key === "Enter" && (authMode === "magic_link" ? handleSendOTP() : null)}
                    autoFocus
                  />
                </div>
                {emailError && (
                  <p className="text-crush text-xs mt-2">{emailError}</p>
                )}
              </div>

              {authMode === "password" && (
                <div className="animate-fade-in">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="crushere-input w-full px-4 py-4 rounded-2xl text-base pr-12"
                      onKeyDown={e => e.key === "Enter" && handlePasswordLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pb-6">
              <button
                onClick={authMode === "password" ? handlePasswordLogin : handleSendOTP}
                disabled={loading}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-60 flex items-center justify-center gap-2 mb-4"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {authMode === "password" ? "Logging in..." : "Sending..."}
                  </>
                ) : (
                   authMode === "password" ? "Sign In →" : "Send OTP →"
                )}
              </button>
              
              <div className="flex justify-center">
                <button 
                  onClick={() => setAuthMode(authMode === "password" ? "magic_link" : "password")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {authMode === "password" ? "Login with Email OTP" : "Login with Username/Password"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-slide-up flex flex-col flex-1">
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5 shadow-glow">
                 <span className="text-2xl text-white">🔒</span>
              </div>
              <h1 className="font-display font-bold text-3xl mb-2">Verify OTP</h1>
              <p className="text-muted-foreground text-sm">
                Code sent to <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>

            <div className="flex gap-2 justify-center mb-8 px-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onPaste={handlePaste}
                  className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-2 text-center text-xl font-bold transition-all outline-none 
                    ${digit 
                      ? "border-primary bg-primary/20 text-primary scale-105 shadow-[0_0_10px_rgba(139,92,246,0.3)]" 
                      : "border-white/10 bg-white/5 text-white focus:border-primary/50 focus:bg-primary/5"
                    }`}
                />
              ))}
            </div>

            <div className="text-center mb-8">
              {resendTimer > 0 ? (
                <p className="text-muted-foreground text-sm font-medium">
                  Resend in <span className="text-foreground">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleSendOTP}
                  className="text-primary font-bold text-sm hover:underline underline-offset-4"
                >
                  Resend Code
                </button>
              )}
            </div>

            <div className="mt-auto pb-10">
              <button
                onClick={() => verifyOtp()}
                disabled={loading || otp.some(d => !d)}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-50 disabled:grayscale transition-all shadow-glow hover:shadow-glow-lg active:scale-[0.98]"
              >
                {loading ? "Verifying..." : "Verify & Enter 🚀"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
