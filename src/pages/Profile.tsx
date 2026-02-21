import { useState, useEffect, useRef } from "react";
import { 
  Settings, 
  Shield, 
  Star, 
  Camera, 
  Edit3, 
  ChevronRight, 
  Heart, 
  Sparkles, 
  Users, 
  Award,
  Loader2,
  Check,
  User as UserIcon,
  Phone,
  MapPin,
  GraduationCap,
  LogOut,
  Gift,
  Share2,
  Trash2,
  Flag,
  ChevronLeft,
  X,
  CreditCard,
  Globe,
  MessageSquare,
  Lock
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import PasswordReset from "@/components/PasswordReset";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import ProfileBuilder from "@/components/ProfileBuilder";

type ViewState = 'profile' | 'settings' | 'referrals' | 'edit' | 'report' | 'customize';

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState<ViewState>('profile');
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    mobile_no: "",
    age: "",
    gender: "",
    bio: "",
    state: "",
    district: "",
    place: ""
  });

  // Referrals
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [matchCount, setMatchCount] = useState(0);

  // Reports
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserEmail(user.email || "");

      const { data: adminData } = await supabase.from("admins").select("role").eq("id", user.id).single();
      setIsAdmin(!!adminData);

      const { data, error } = await supabase
        .from("profiles")
        .select("*, colleges(name)")
        .eq("id", user.id)
        .single();

      // No profile found → sign out and redirect to login
      if (error?.code === "PGRST116" || !data) {
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        username: data.username || "",
        mobile_no: data.mobile_no || "",
        age: data.age?.toString() || "",
        gender: data.gender || "",
        bio: data.bio || "",
        state: data.state || "",
        district: data.district || "",
        place: data.place || ""
      });
      fetchReferredUsers(user.id);
      fetchMatchCount(user.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchCount = async (userId: string) => {
    try {
      const { count } = await supabase
        .from('crushes')
        .select('*', { count: 'exact', head: true })
        .eq('is_mutual', true)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      setMatchCount(count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReferredUsers = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .eq("referrer_id", userId);
    if (data) setReferredUsers(data);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          username: formData.username,
          mobile_no: formData.mobile_no,
          age: parseInt(formData.age) || null,
          gender: formData.gender,
          bio: formData.bio,
          state: formData.state,
          district: formData.district,
          place: formData.place,
          updated_at: new Date()
        })
        .eq("id", user?.id);

      if (error) throw error;
      toast({ title: "Profile updated! ✨" });
      setView('profile');
      fetchProfile();
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const { data: { user } } = await supabase.auth.getUser();

      // Delete old avatar from storage bucket if it exists
      if (profile?.avatar_url) {
        try {
          // Extract the path after "/avatars/" from the public URL
          const url = new URL(profile.avatar_url);
          const pathParts = url.pathname.split('/avatars/');
          if (pathParts.length > 1) {
            const oldPath = pathParts[1];
            await supabase.storage.from('avatars').remove([oldPath]);
          }
        } catch (_) {
          // If we can't parse the URL or delete fails, continue anyway
        }
      }

      // Upload new avatar with user-scoped path to avoid conflicts
      const ext = file.name.split('.').pop();
      const filePath = `avatars/${user?.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user?.id);

      // Reset input so same file can be selected again
      e.target.value = "";
      fetchProfile();
      toast({ title: "Photo updated!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleModeSwitch = async () => {
    const newMode = profile.mode === 'college' ? 'global' : 'college';
    const { error } = await supabase.from("profiles").update({ mode: newMode }).eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, mode: newMode });
      toast({ title: `Switched to ${newMode} mode!` });
    }
  };

  const handleShare = async () => {
    const baseUrl = window.location.origin;
      const referralUrl = `${baseUrl}?ref=${profile.id}`;
      const shareData = {
      title: 'Join Crushere!',
      text: `Hey! Join me on Crushere — the campus social network 🎓`,
      url: referralUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(referralUrl);
        toast({ title: "Link copied to clipboard!" });
      }
    } catch (err) {
      console.log('Error sharing', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleTerminateAccount = async () => {
    if (confirm("CRITICAL: This will permanently delete your account and all data. This cannot be undone. Proceed?")) {
      const { error } = await supabase.from("profiles").delete().eq("id", profile.id);
      if (!error) {
        await supabase.auth.signOut();
        navigate("/auth");
      }
    }
  };

  const handleSendReport = async () => {
    if (!reportReason.trim()) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: profile.id,
      target_id: 'system',
      target_type: 'user', // generic for feedback
      reason: reportReason
    });
    if (!error) {
      toast({ title: "Report sent. Thank you!" });
      setReportReason("");
      setView('settings');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <AppLayout onRefresh={fetchProfile} hideNav={view === 'customize'}>
      <div className="min-h-[calc(100vh-100px)] bg-background pb-12 overflow-x-hidden">
        {/* Header - Adaptive Based on View */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-3xl px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view !== 'profile' && (
              <button onClick={() => setView('profile')} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
                <ChevronLeft size={20} />
              </button>
            )}
            <h1 className="font-display font-bold text-2xl capitalize">
              {view === 'profile' ? "Profile" : view.replace('-', ' ')}
            </h1>
          </div>
          {view === 'profile' && (
            <div className="flex gap-2">
              <button onClick={() => setView('settings')} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                <Settings size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Single hidden file input - always mounted so both profile + edit views can trigger it */}
        <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />

        <div className="px-6 pt-8 max-w-mobile mx-auto">
          {/* 1. PROFILE VIEW - Instagram Style */}
          {view === 'profile' && (
            <div className="animate-in fade-in duration-500">

              {/* IG-style header row: avatar left + stats right */}
              <div className="flex items-center gap-6 mb-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`w-24 h-24 rounded-full p-[2.5px] shadow-xl ${profile?.subscription_plan === 'premium' ? 'bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500 shadow-orange-500/30' : 'bg-gradient-brand shadow-primary/30'}`}>
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={32} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {profile?.subscription_plan === 'premium' && (
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl rotate-12 flex items-center justify-center border-2 border-background shadow-lg shadow-blue-500/30 z-10" title="Premium Verified">
                      <Check size={14} strokeWidth={4} className="text-white -rotate-12" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center shadow-glow border-2 border-background active:scale-90 transition-transform"
                  >
                    <Camera size={12} className="text-white" />
                  </button>
                </div>

                {/* Stats: horizontal IG-style */}
                <div className="flex-1 flex justify-around">
                  {[
                    { label: "Points", val: profile?.points || 0 },
                    { label: "Matches", val: matchCount },
                    { label: "Referrals", val: referredUsers.length },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-xl font-display font-black">{s.val}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Name, username, bio */}
              <div className="mb-5">
                <p className="font-display font-bold text-base leading-tight">{profile?.full_name || "New User"}</p>
                <p className="text-xs text-muted-foreground mb-2">@{profile?.username || "crushere_user"}</p>
                {profile?.colleges?.name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                    <GraduationCap size={12} /> {profile.colleges.name}
                  </p>
                )}
                {profile?.district && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                    <MapPin size={12} /> {profile.district}, {profile.state}
                  </p>
                )}
                {profile?.bio && (
                  <p className="text-sm text-foreground/80 leading-relaxed mt-2">{profile.bio}</p>
                )}
                {!profile?.bio && (
                  <p className="text-sm text-muted-foreground/50 italic mt-2">No bio yet. Tap Edit Profile to add one.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => setView('edit')}
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl py-2.5 text-xs font-bold text-foreground hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => setView('customize')}
                  className="flex-1 btn-brand rounded-xl py-2.5 text-xs font-bold text-white shadow-glow active:scale-[0.98] transition-all"
                >
                  Customize Page
                </button>
              </div>
            </div>
          )}

          {/* CUSTOMIZE VIEW */}
          {view === 'customize' && profile && (
            <ProfileBuilder 
              userId={profile.id} 
              initialLayout={profile.profile_layout} 
              subscriptionPlan={profile.subscription_plan} 
              onClose={() => { setView('profile'); fetchProfile(); }}
            />
          )}

          {/* 2. EDIT VIEW - Instagram Style */}
          {view === 'edit' && (
            <div className="animate-in slide-in-from-right-10 duration-400">
              {/* Change Photo */}
              <div className="flex flex-col items-center py-6 mb-2">
                <div className="relative mb-3">
                  <div className={`w-24 h-24 rounded-full p-[2.5px] ${profile?.subscription_plan === 'premium' ? 'bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500' : 'bg-gradient-brand'}`}>
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={32} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center shadow-glow border-2 border-background">
                    <Camera size={12} className="text-white" />
                  </button>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="text-primary text-sm font-semibold">
                  Change Photo
                </button>
              </div>

              {/* Fields - IG / clean style */}
              <div className="divide-y divide-white/5 border-t border-b border-white/5 mb-6">
                {[
                  { key: 'full_name', label: 'Name', placeholder: 'Your name' },
                  { key: 'username', label: 'Username', placeholder: 'username' },
                  { key: 'mobile_no', label: 'Phone', placeholder: '+91 xxxxxx' },
                  { key: 'age', label: 'Age', placeholder: '18', type: 'number' },
                  { key: 'state', label: 'State', placeholder: 'Kerala' },
                  { key: 'district', label: 'District', placeholder: 'Thrissur' },
                ].map(f => (
                  <div key={f.key} className="flex items-center px-1 py-4">
                    <label className="w-28 text-sm text-muted-foreground flex-shrink-0">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={(formData as any)[f.key]}
                      onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                      placeholder={f.placeholder}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/40"
                    />
                  </div>
                ))}
                {/* Bio */}
                <div className="flex items-start px-1 py-4">
                  <label className="w-28 text-sm text-muted-foreground flex-shrink-0 pt-0.5">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    placeholder="Write something about yourself..."
                    rows={3}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/40 resize-none"
                  />
                </div>
                {/* Gender */}
                <div className="flex items-center px-1 py-4">
                  <label className="w-28 text-sm text-muted-foreground flex-shrink-0">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-foreground"
                  >
                    <option value="" className="bg-background">Not specified</option>
                    <option value="male" className="bg-background">Male</option>
                    <option value="female" className="bg-background">Female</option>
                    <option value="other" className="bg-background">Other</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full btn-brand py-3.5 rounded-xl text-sm font-bold text-white shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={15} className="animate-spin" />} Submit
              </button>
            </div>
          )}

          {/* 3. SETTINGS VIEW */}
          {view === 'settings' && (
            <div className="animate-in slide-in-from-right-10 duration-500 space-y-4">
               {/* Admin Panel Toggle */}
               {isAdmin && (
                <button onClick={() => navigate("/admin")} className="w-full flex items-center justify-between p-6 bg-primary/10 border border-primary/20 rounded-3xl group active:scale-95 transition-all mb-4">
                  <div className="flex items-center gap-4">
                    <Shield className="text-primary" />
                    <div className="text-left">
                      <p className="font-bold text-sm">Open Admin Panel</p>
                      <p className="text-[10px] text-primary/60 uppercase font-black">System Management</p>
                    </div>
                  </div>
                  <ChevronRight size={18} />
                </button>
              )}

              <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden">
                <button onClick={handleModeSwitch} className="w-full flex items-center justify-between p-6 hover:bg-white/5 border-b border-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <Globe size={20} className="text-blue-500" />
                    <div className="text-left">
                      <p className="font-bold text-sm">App Mode</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">{profile?.mode === 'college' ? "🎓 Campus Only" : "🌍 Global Feed"}</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-all ${profile?.mode === 'college' ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${profile?.mode === 'college' ? 'right-1' : 'left-1'}`} />
                  </div>
                </button>

                <button onClick={() => navigate("/premium")} className="w-full flex items-center justify-between p-6 hover:bg-white/5 border-b border-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <CreditCard size={20} className="text-yellow-500" />
                    <p className="font-bold text-sm">Subscription Plan</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">{profile?.subscription_plan === 'premium' ? "PRO" : "STANDARD"}</span>
                    <ChevronRight size={16} />
                  </div>
                </button>

                <button onClick={() => setShowPasswordReset(true)} className="w-full flex items-center justify-between p-6 hover:bg-white/5 border-b border-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <Lock size={20} className="text-orange-500" />
                    <p className="font-bold text-sm">Reset Password</p>
                  </div>
                  <ChevronRight size={16} />
                </button>

                <button onClick={() => setView('report')} className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <Flag size={20} className="text-red-500" />
                    <p className="font-bold text-sm">Send Report / Feedback</p>
                  </div>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Invite Banner - highly visible CTA */}
              <button
                onClick={() => setView('referrals')}
                className="w-full relative overflow-hidden rounded-3xl p-[1.5px] mt-2 active:scale-[0.97] transition-transform"
                style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899, #f97316)' }}
              >
                <div className="w-full rounded-3xl bg-background/10 backdrop-blur-sm px-6 py-5 flex items-center gap-4"
                  style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(249,115,22,0.25))' }}
                >
                  {/* Glow blob */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-orange-500/30 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-purple-500/30 blur-2xl pointer-events-none" />

                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 animate-pulse-glow">
                    <span className="text-2xl">🎁</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-display font-black text-base text-white leading-tight">Invite & Earn Points</p>
                    <p className="text-xs text-white/70 mt-0.5">Share your link · Get rewarded 🔥</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                    <ChevronRight size={16} className="text-white" />
                  </div>
                </div>
              </button>

              <div className="pt-10 space-y-4">
                <button onClick={handleLogout} className="w-full bg-white/5 p-6 rounded-3xl flex items-center justify-center gap-3 text-sm font-bold text-muted-foreground hover:bg-white/10 active:scale-[0.98] transition-all">
                  <LogOut size={18} /> Logout Account
                </button>
                <button onClick={handleTerminateAccount} className="w-full border border-destructive/20 p-6 rounded-3xl flex items-center justify-center gap-3 text-sm font-bold text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all">
                  <Trash2 size={18} /> Terminate Account
                </button>
              </div>
            </div>
          )}

          {/* 4. REFERRALS VIEW */}
          {view === 'referrals' && (
            <div className="animate-in slide-in-from-right-10 duration-500">
               <div className="bg-gradient-brand rounded-[3rem] p-8 text-white mb-10 shadow-2xl shadow-primary/30 relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/20 blur-[60px] rounded-full" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-display font-black mb-2">Share & Earn!</h3>
                    <p className="text-sm opacity-90 mb-6">Invite your friends to Crushere and get 50 points for every successful signup. ✨</p>
                    <button onClick={handleShare} className="w-full bg-white py-4 rounded-2xl text-primary font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                      <Share2 size={16} /> Share Referral Link
                    </button>
                  </div>
               </div>

               <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 flex items-center justify-between">
                    Referred Friends <span>{referredUsers.length}</span>
                  </h3>
                  {referredUsers.length === 0 ? (
                    <div className="bg-white/5 border border-dashed border-white/10 p-10 rounded-[2.5rem] text-center">
                      <Gift size={32} className="mx-auto text-muted-foreground/20 mb-4" />
                      <p className="text-sm text-muted-foreground">No referrals yet. Start sharing!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referredUsers.map(u => (
                        <button key={u.id} onClick={() => navigate(`/profile/${u.id}`)} className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
                          <div className="w-12 h-12 rounded-2xl bg-muted overflow-hidden">
                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xs font-bold">{u.full_name?.[0]}</div>}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{u.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                          </div>
                          <ChevronRight size={14} className="text-muted-foreground/30" />
                        </button>
                      ))}
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* 5. REPORT VIEW */}
          {view === 'report' && (
            <div className="animate-in slide-in-from-right-10 duration-500 space-y-6">
              <div className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem]">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Anonymous Report</h3>
                <p className="text-xs text-muted-foreground mb-6">Found a bug or want to report offensive content? Let the admins know.</p>
                <textarea 
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  placeholder="Tell us what's wrong..." 
                  className="crushere-input w-full p-5 rounded-3xl min-h-[160px] mb-6" 
                />
                <button onClick={handleSendReport} disabled={!reportReason.trim()} className="w-full btn-brand py-5 rounded-2xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-30 disabled:grayscale transition-all shadow-glow flex items-center justify-center gap-2">
                  <MessageSquare size={16} /> Send Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PasswordReset 
        open={showPasswordReset} 
        onOpenChange={setShowPasswordReset} 
        email={userEmail} 
      />
    </AppLayout>
  );
}
