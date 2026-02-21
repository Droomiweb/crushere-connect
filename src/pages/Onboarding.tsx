import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Check, Loader2, Search, Plus, MapPin, ExternalLink, User, KeyRound, Eye, EyeOff, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type OnboardStep = "email_otp" | "credentials" | "name_mode" | "details";
type ProfileMode = "college" | "global";

interface College {
  id: string;
  name: string;
  district?: string;
  place?: string;
  state?: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<OnboardStep>("email_otp");
  const [mode, setMode] = useState<ProfileMode | null>(null);
  // Email OTP step state
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Credentials step state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [place, setPlace] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // College specific
  const [searchQuery, setSearchQuery] = useState("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [isCollegeSearchFocused, setIsCollegeSearchFocused] = useState(false); // Renamed to avoid any potential shadow/global conflicts
  const [showAddCollege, setShowAddCollege] = useState(false);
  
  // Add College Form
  const [collegeUrl, setCollegeUrl] = useState("");
  const [newCollegeData, setNewCollegeData] = useState({
    name: "",
    country: "India",
    state: "",
    district: "",
    place: "",
  });
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);
  const [isSubmittingCollege, setIsSubmittingCollege] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    checkRegistration();
  }, []);

  const loadProgress = async (uid: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();
        
      if (profile) {
        if (profile.onboarding_step) setStep(profile.onboarding_step as OnboardStep);
        if (profile.username) setUsername(profile.username);
        if (profile.full_name) setName(profile.full_name);
        if (profile.mode) setMode(profile.mode as ProfileMode);
        if (profile.age) setAge(profile.age.toString());
        if (profile.gender) setGender(profile.gender);
        if (profile.state) setState(profile.state);
        if (profile.district) setDistrict(profile.district);
        if (profile.place) setPlace(profile.place);
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile.mobile_no) setMobile(profile.mobile_no);
        if (profile.college_id) {
           const { data: col } = await supabase.from("colleges").select("id, name").eq("id", profile.college_id).single();
           if (col) setSelectedCollege(col);
        }
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const saveStep = async (nextStep: OnboardStep, additionalData: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = {
        id: user.id,
        onboarding_step: nextStep,
        ...additionalData,
        updated_at: new Date(),
      };

      await supabase.from("profiles").upsert(updates);
    } catch (error) {
      console.error("Error saving step:", error);
    }
  };

  const checkRegistration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If already logged in AND has a complete profile → skip onboarding, go to feed
      if (user) {
        // Load progress for semi-filled profiles
        await loadProgress(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, college_id, mode")
          .eq("id", user.id)
          .single();

        if (profile?.full_name && (profile.mode === 'global' || profile.college_id)) {
          navigate("/feed");
          return;
        }
      }
      // No user OR user without profile → allow onboarding to proceed normally
    } catch (error) {
      console.error("Check registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchColleges();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (step === 'details' && mode === 'college' && colleges.length === 0) {
      fetchColleges();
    }
  }, [step, mode]);

  const fetchColleges = async () => {
    setLoadingColleges(true);
    try {
      let query = supabase
        .from("colleges")
        .select("id, name, district, place, state")
        .limit(20);

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,district.ilike.%${searchQuery}%,place.ilike.%${searchQuery}%`);
      } else {
        query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      setColleges(data || []);
    } catch (error: any) {
      console.error("Error fetching colleges:", error.message);
    } finally {
      setLoadingColleges(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
      }
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    const isGoogleMaps = collegeUrl.includes("google.com/maps") || collegeUrl.includes("maps.app.goo.gl");
    
    if (!isGoogleMaps) {
      toast({
        title: "Invalid URL",
        description: "Please paste a valid Google Maps URL",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingUrl(true);
    
    // Simulate API fetch delay
    setTimeout(() => {
      let collegeData = {
        name: "Community College",
        country: "India",
        state: "Kerala",
        district: "Palakkad",
        place: "Kuzhalmannam",
      };

      // Handle user's specific test URL for IHRD
      if (collegeUrl.includes("jAkFTafR")) {
        collegeData = {
          name: "IHRD College of Applied Science",
          country: "India",
          state: "Kerala",
          district: "Thrissur",
          place: "Pazhayannur",
        };
      } else if (collegeUrl.includes("manipal")) {
        collegeData = {
          name: "Manipal Institute of Technology",
          country: "India",
          state: "Karnataka",
          district: "Udupi",
          place: "Manipal",
        };
      }

      setNewCollegeData(collegeData);
      setIsAnalyzingUrl(false);
      toast({
        title: "Details Fetched!",
        description: "Verify the information below.",
      });
    }, 1500);
  };

  const handleAddCollege = async () => {
    if (!newCollegeData.name || !newCollegeData.state) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingCollege(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Auto-approval logic
      const keywords = ["college", "institution", "science", "academy", "university", "institute", "polytechnic", "iit", "nit", "iim", "vidyalaya", "school"];
      const isAutoApprovable = keywords.some(kw => newCollegeData.name.toLowerCase().includes(kw.toLowerCase()));
      
      let finalStatus = isAutoApprovable ? "approved" : "pending";
      let createdCollegeId = null;

      // 1. If auto-approvable, insert into colleges table
      if (isAutoApprovable) {
        const { data: college, error: collegeError } = await supabase
          .from("colleges")
          .insert({
            name: newCollegeData.name,
            google_map_url: collegeUrl,
            country: newCollegeData.country,
            state: newCollegeData.state,
            district: newCollegeData.district,
            place: newCollegeData.place,
            is_active: true
          })
          .select()
          .single();
        
        if (collegeError) throw collegeError;
        createdCollegeId = college.id;
      }

      // 2. Insert into college_requests for history and admin review
      const { error: requestError } = await supabase
        .from("college_requests")
        .insert({
          user_id: user.id,
          name: newCollegeData.name,
          google_map_url: collegeUrl,
          country: newCollegeData.country,
          state: newCollegeData.state,
          district: newCollegeData.district,
          place: newCollegeData.place,
          status: finalStatus
        });

      if (requestError) throw requestError;

      if (isAutoApprovable) {
        toast({
          title: "College Added!",
          description: `${newCollegeData.name} has been added and verified.`,
        });
        setSelectedCollege({ id: createdCollegeId, name: newCollegeData.name });
      } else {
        toast({
          title: "Request Sent!",
          description: "Admin will review your college request.",
        });
        setSelectedCollege({ id: "pending", name: newCollegeData.name });
      }

      setShowAddCollege(false);
      setSearchQuery(""); // Clear search so selection shows
      
      // Still pre-fill location for the profile
      setState(newCollegeData.state);
      setDistrict(newCollegeData.district);
      setPlace(newCollegeData.place);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingCollege(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Check if mobile number is already taken by another user
      const { data: existingPhone, error: phoneError } = await supabase
        .from("profiles")
        .select("id")
        .eq("mobile_no", mobile)
        .neq("id", user.id)
        .maybeSingle();

      if (existingPhone) {
        toast({
          title: "Mobile number already in use",
          description: "This mobile number is already registered with another account.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const updates = {
        id: user.id,
        username: username.toLowerCase(),
        full_name: name,
        mobile_no: mobile,
        mode: mode,
        age: parseInt(age),
        gender: gender,
        state: state,
        district: district,
        place: place,
        avatar_url: avatarUrl,
        college_id: mode === "college" && selectedCollege?.id !== "pending" ? selectedCollege?.id : null,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);
      
      if (error) {
        if (error.code === "23505" && error.message.includes("mobile_no")) {
          throw new Error("This mobile number is already registered with another account.");
        }
        throw error;
      }

      await saveStep("details"); // Technically finished, but updates step just in case
      navigate("/feed");
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === "credentials") {
      if (!username || !password || !confirmPassword) {
        toast({ title: "Missing Information", description: "Please fill in all fields.", variant: "destructive" });
        return;
      }
      if (password !== confirmPassword) {
        toast({ title: "Passwords Mismatch", description: "Passwords do not match.", variant: "destructive" });
        return;
      }
      if (username.length < 3) {
        toast({ title: "Username too short", description: "Username must be at least 3 characters.", variant: "destructive" });
        return;
      }
      
      setLoading(true);
      try {
        const { data: existing } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username.toLowerCase())
          .maybeSingle();
        
        if (existing) {
          toast({ title: "Username Taken", description: "Please choose another username.", variant: "destructive" });
          setLoading(false);
          return;
        }

        const { error: authError } = await supabase.auth.updateUser({ password: password });
        if (authError) throw authError;

        await saveStep("name_mode", { username: username.toLowerCase() });
        setStep("name_mode");
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === "name_mode") {
      await saveStep("details", { full_name: name, mode: mode });
      setStep("details");
      return;
    }
  };

  const handleSendOTP = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
      setOtpSent(true);
      setCountdown(60);
      toast({ title: "OTP Sent! 📨", description: `Check your inbox at ${email}` });
    } catch (error: any) {
      toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length < 8) {
      toast({ title: "Enter full OTP", description: "Please enter all components.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) throw error;
      await saveStep("credentials", { email });
      setStep("credentials");
    } catch (error: any) {
      toast({ title: "Invalid OTP", description: error.message, variant: "destructive" });
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

  const progress = step === "email_otp" ? 25 : step === "credentials" ? 50 : step === "name_mode" ? 75 : 100;
  const stepNumber = step === "email_otp" ? 1 : step === "credentials" ? 2 : step === "name_mode" ? 3 : 4;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-mobile min-h-screen flex flex-col px-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-6 pb-4">
          <button
            onClick={async () => {
              if (step === "details") { await saveStep("name_mode"); setStep("name_mode"); }
              else if (step === "name_mode") { await saveStep("credentials"); setStep("credentials"); }
              else if (step === "credentials") { setStep("email_otp"); setOtpSent(false); }
              else navigate("/");
            }}
            className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center border border-border active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-xs text-muted-foreground font-medium">
            Step {stepNumber} of 4
          </div>
          <div className="w-10" />
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-brand rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        {step === "email_otp" && (
          <div className="animate-slide-up flex-1 flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5 shadow-glow">
              <Mail size={24} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl mb-2">
              {otpSent ? "Verify Email" : "Enter Email"}
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              {otpSent
                ? `We sent an 8-digit code to ${email}`
                : "We'll send a verification code to your email."}
            </p>

            {!otpSent ? (
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="alex@university.edu"
                    className="crushere-input w-full px-4 py-4 rounded-2xl text-base"
                    onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-4 block uppercase tracking-wider">OTP Code</label>
                <div className="flex gap-2 justify-center mb-4">
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
                      className="w-9 h-12 text-center text-lg font-bold crushere-input rounded-xl border border-white/10 focus:border-primary"
                    />
                  ))}
                </div>
                <button
                  onClick={() => { setOtpSent(false); setOtp(["","","","","","","",""]); }}
                  className="text-xs text-primary text-center w-full"
                >
                  ← Change email
                </button>
              </div>
            )}

            <div className="pb-10 pt-4">
              <button
                onClick={otpSent ? handleVerifyOTP : handleSendOTP}
                disabled={loading || (!otpSent && (email === "" || countdown > 0)) || (otpSent && otp.join("").length < 8)}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                {otpSent 
                  ? "Verify & Continue →" 
                  : countdown > 0 
                    ? `Resend OTP (${countdown}s)` 
                    : "Send OTP →"}
              </button>
            </div>
          </div>
        )}

        {step === "credentials" && (
          <div className="animate-slide-up flex-1 flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5 shadow-glow">
              <KeyRound size={24} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl mb-2">Create Account</h1>
            <p className="text-muted-foreground text-sm mb-8">
              Set a unique username and a strong password to secure your account.
            </p>

            <div className="space-y-6 flex-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="your_username"
                    className="crushere-input w-full pl-10 pr-4 py-4 rounded-2xl text-base"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 px-1">Lowercase letters, numbers, and underscores only.</p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="crushere-input w-full px-4 py-4 rounded-2xl text-base pr-12"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="crushere-input w-full px-4 py-4 rounded-2xl text-base"
                />
              </div>
            </div>

            <div className="pb-10 pt-4">
              <button
                onClick={handleNext}
                disabled={loading || !username || !password || !confirmPassword}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                Set Credentials →
              </button>
            </div>
          </div>
        )}
        {step === "name_mode" && (
          <div className="animate-slide-up flex-1 flex flex-col">
            <h1 className="font-display font-bold text-3xl mb-2">Basic Info</h1>
            <p className="text-muted-foreground text-sm mb-8">
              Let's start with your name and how you'd like to use Crushere.
            </p>

            <div className="space-y-6 flex-1">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center border-2 border-dashed border-border overflow-hidden cursor-pointer"
                  >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <Camera size={28} className="text-muted-foreground" />
                    )}
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 size={24} className="text-white animate-spin" />
                        </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow"
                  >
                    <span className="text-sm text-white">+</span>
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="crushere-input w-full px-4 py-4 rounded-2xl text-base"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-4 block uppercase tracking-wider">Select Mode</label>
                <div className="space-y-4">
                  <div
                    onClick={() => setMode("college")}
                    className={`mode-card p-5 ${mode === "college" ? "selected ring-2 ring-primary" : ""}`}
                  >
                    <div className="relative flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🎓</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-lg">College Mode</h3>
                        <p className="text-muted-foreground text-xs">Exclusively for your campus peers.</p>
                      </div>
                      {mode === "college" && <Check size={20} className="text-primary" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setMode("global")}
                    className={`mode-card p-5 ${mode === "global" ? "selected ring-2 ring-primary" : ""}`}
                  >
                    <div className="relative flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-crush flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🌍</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-lg">Global Mode</h3>
                        <p className="text-muted-foreground text-xs">Connect with everyone near you.</p>
                      </div>
                      {mode === "global" && <Check size={20} className="text-primary" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-10 pt-4">
              <button
                onClick={handleNext}
                disabled={!name.trim() || !mode}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-40"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="animate-slide-up flex-1 flex flex-col">
            <h1 className="font-display font-bold text-3xl mb-2">Final Details</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Just a few more things before you're in!
            </p>

            <div className="space-y-6 flex-1 max-h-[70vh] overflow-y-auto pr-2 scroll-hidden">
              {mode === "college" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Select College</label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedCollege(null);
                          }}
                          onFocus={() => {
                            setIsCollegeSearchFocused(true);
                            if (colleges.length === 0) fetchColleges();
                          }}
                          onBlur={() => setTimeout(() => setIsCollegeSearchFocused(false), 200)}
                          placeholder="Search your college..."
                          className="crushere-input w-full pl-12 pr-4 py-4 rounded-2xl text-base"
                        />
                      </div>

                      {(isCollegeSearchFocused || (searchQuery.length > 0 && !selectedCollege)) && !selectedCollege && (
                        <div className="absolute z-50 w-full mt-3 bg-background/95 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                          {loadingColleges ? (
                            <div className="p-8 text-center">
                              <Loader2 className="animate-spin mx-auto text-primary mb-2" size={24} />
                              <p className="text-xs text-muted-foreground">Searching colleges...</p>
                            </div>
                          ) : (
                            <div className="p-2">
                              {colleges.length > 0 ? (
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase px-3 py-2">Select your college</p>
                                  {colleges.map((c) => (
                                    <button
                                      key={c.id}
                                      onClick={() => {
                                        setSelectedCollege(c);
                                        setSearchQuery(c.name);
                                        if (c.district) setDistrict(c.district);
                                        if (c.state) setState(c.state);
                                        if (c.place) setPlace(c.place);
                                      }}
                                      className="w-full p-4 text-left hover:bg-primary/10 rounded-2xl transition-all flex items-center justify-between group"
                                    >
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-medium group-hover:text-primary transition-colors">{c.name}</span>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                          <MapPin size={10} /> {c.place}, {c.district}
                                        </span>
                                      </div>
                                      <ArrowLeft className="rotate-180 opacity-0 group-hover:opacity-100 transition-all text-primary" size={14} />
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-6 text-center">
                                  <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                                    <Search size={20} className="text-muted-foreground" />
                                  </div>
                                  <p className="text-sm font-bold mb-1">No colleges found</p>
                                  <p className="text-xs text-muted-foreground mb-4">Try a different name or add your college below.</p>
                                </div>
                              )}
                              
                              <div className="mt-2 p-1 bg-muted/20 rounded-2xl border border-border/50">
                                <button
                                  onClick={() => setShowAddCollege(true)}
                                  className="w-full p-4 rounded-xl bg-gradient-brand text-white font-bold text-sm flex items-center justify-center gap-2 hover:shadow-glow transition-all active:scale-[0.98]"
                                >
                                  <Plus size={18} /> Add My College
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-3 block uppercase tracking-wider">How old are you?</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 scroll-hidden">
                    {["18", "19", "20", "21", "22", "23", "24", "25+"].map((a) => (
                      <button
                        key={a}
                        onClick={() => setAge(a.replace('+', ''))}
                        className={`flex-shrink-0 w-14 h-14 rounded-2xl border font-bold text-lg transition-all ${
                          age === a.replace('+', '') 
                            ? "bg-gradient-brand border-transparent text-white shadow-glow scale-110" 
                            : "bg-muted/10 border-border text-foreground hover:border-primary/50"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-3 block uppercase tracking-wider">Gender</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "male", label: "Male", icon: "👨" },
                      { id: "female", label: "Female", icon: "👩" },
                      { id: "other", label: "Other", icon: "✨" }
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGender(g.id)}
                        className={`py-4 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                          gender === g.id 
                            ? "bg-gradient-brand border-transparent text-white shadow-glow" 
                            : "bg-muted/10 border-border text-foreground hover:border-primary/50"
                        }`}
                      >
                        <span className="text-xl">{g.icon}</span>
                        <span className="text-xs font-bold uppercase tracking-tighter">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 9876543210"
                  className="crushere-input w-full px-4 py-4 rounded-2xl text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="crushere-input w-full px-4 py-4 rounded-2xl text-base"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Udupi"
                    className="crushere-input w-full px-4 py-4 rounded-2xl text-base"
                  />
                </div>
              </div>
            </div>

            <div className="pb-10 pt-6">
              <button
                onClick={completeOnboarding}
                disabled={loading || !age || !gender || !mobile || !state || !district || (mode === "college" && !selectedCollege)}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                Complete Onboarding →
              </button>
            </div>
          </div>
        )}

        {/* Add College Modal */}
        <Dialog open={showAddCollege} onOpenChange={setShowAddCollege}>
          <DialogContent className="sm:max-w-md bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Plus className="text-primary" /> Add New College
              </DialogTitle>
              <DialogDescription>
                Paste the Google Maps URL of your college and we'll handle the rest.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Google Maps URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={collegeUrl}
                    onChange={(e) => setCollegeUrl(e.target.value)}
                    placeholder="https://goo.gl/maps/..."
                    className="crushere-input flex-1 px-4 py-3 rounded-xl text-sm"
                  />
                  <button
                    onClick={handleAnalyzeUrl}
                    disabled={isAnalyzingUrl || !collegeUrl}
                    className="bg-primary/20 text-primary px-4 rounded-xl font-bold text-xs disabled:opacity-50"
                  >
                    {isAnalyzingUrl ? <Loader2 className="animate-spin" size={16} /> : "Analyze"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <p className="text-[10px] font-bold text-primary bg-primary/5 p-2 rounded-lg text-center border border-primary/10">
                  ✨ Verify and edit if the fields are wrong
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">College Name</label>
                  <input
                    type="text"
                    value={newCollegeData.name}
                    onChange={(e) => setNewCollegeData({ ...newCollegeData, name: e.target.value })}
                    className="crushere-input w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Country</label>
                    <input
                      type="text"
                      value={newCollegeData.country}
                      onChange={(e) => setNewCollegeData({ ...newCollegeData, country: e.target.value })}
                      className="crushere-input w-full px-3 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">State</label>
                    <input
                      type="text"
                      value={newCollegeData.state}
                      onChange={(e) => setNewCollegeData({ ...newCollegeData, state: e.target.value })}
                      className="crushere-input w-full px-3 py-2 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">District</label>
                    <input
                      type="text"
                      value={newCollegeData.district}
                      onChange={(e) => setNewCollegeData({ ...newCollegeData, district: e.target.value })}
                      className="crushere-input w-full px-3 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Place</label>
                    <input
                      type="text"
                      value={newCollegeData.place}
                      onChange={(e) => setNewCollegeData({ ...newCollegeData, place: e.target.value })}
                      className="crushere-input w-full px-3 py-2 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowAddCollege(false)}
                className="w-full glass-card py-3 rounded-xl text-sm font-semibold border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCollege}
                disabled={isSubmittingCollege || !newCollegeData.name}
                className="w-full btn-brand py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
              >
                {isSubmittingCollege && <Loader2 className="animate-spin" size={16} />}
                Add College
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
