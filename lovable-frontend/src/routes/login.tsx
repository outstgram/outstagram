import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, ShieldCheck, Sparkles, Camera, Upload, CheckCircle2, RotateCw, FileText, Download, Smartphone, KeyRound } from "lucide-react";
import { useStore, type Role } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { saveRegisteredUser } from "@/lib/people";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Wordmark } from "@/components/hb/AppShell";
import { OutstagramIcon } from "@/components/hb/OutstagramLogo";
import { triggerPwaInstall, InstallGuideModal } from "@/components/hb/InstallAppBanner";
import friends from "@/assets/friends-walk.jpg";
import { Postmark } from "@/components/hb/Postmark";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Welcome back — Outstagram" },
      { name: "description", content: "Sign in to Outstagram to send, track and deliver real-world moments around your city." },
      { property: "og:title", content: "Welcome back — Outstagram" },
      { property: "og:description", content: "Post less. Go somewhere. Meet someone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Field({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-sand bg-paper px-4 transition-all focus-within:border-stamp focus-within:bg-paper-raised focus-within:shadow-[0_0_0_4px_var(--stamp-soft)]">
      <Icon className="size-4 text-ink-muted group-focus-within:text-stamp" />{children}
    </div>
  );
}
const inputCls = "h-13 w-full bg-transparent py-3.5 text-sm text-ink outline-none placeholder:text-ink-muted/70";

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState("Signing you in…");
  const [role, setRole] = useState<Role>("user");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [error, setError] = useState("");
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { signIn, demo, setDemo } = useStore();
  const nav = useNavigate();

  // Check if user confirmed via email link while on OTP screen
  const checkConfirmationStatus = async (showToast = true) => {
    if (!email || !password) return false;
    setOtpBusy(true);
    try {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (!signInErr && signInData?.user) {
        setDemo(false);
        const user = signInData.user;
        const finalAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username.trim())}`;
        const finalBio = bio.trim() || "Living offline first. Exploring the city with Outstagram.";
        const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        toast.success("Account confirmed! Welcome to Outstagram.");
        enter(
          email.trim(),
          "user",
          username.trim() || (user.user_metadata?.["username"] as string | undefined) || "Member",
          "Account verified — welcome to Outstagram!",
          user.id,
          generatedCode,
          finalAvatar,
          finalBio
        );
        return true;
      } else if (showToast) {
        toast.info("Waiting for email confirmation... If you received an email link, please click it first.");
      }
    } catch {
      // ignore
    } finally {
      setOtpBusy(false);
    }
    return false;
  };

  // Auto-detect email confirmation link click while user is on the OTP screen
  useEffect(() => {
    if (!otpMode || !email || !password) return;
    const interval = setInterval(() => {
      checkConfirmationStatus(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [otpMode, email, password]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large. Please select a photo under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setAvatar(event.target.result);
        toast.success("Profile photo uploaded!");
      }
    };
    reader.readAsDataURL(file);
  };

  const previewAvatar = avatar || (username.trim()
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username.trim())}`
    : "https://api.dicebear.com/7.x/initials/svg?seed=Outstagram");

  const enter = (
    mail: string,
    r: Role,
    n?: string,
    msg?: string,
    id?: string,
    friendCode?: string,
    avatarSrc?: string,
    bioText?: string
  ) => {
    const userId = id || mail;
    const displayName = n || (r === "admin" ? "Admin" : (mail.split("@")[0] ?? "Member"));
    const finalAvatar = avatarSrc || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
    signIn(mail, r, displayName, userId, friendCode, finalAvatar, bioText);
    saveRegisteredUser({
      id: userId,
      name: displayName,
      handle: displayName.toLowerCase().replace(/\s+/g, ""),
      friendCode,
      avatar: finalAvatar,
      bio: bioText,
    });
    toast.success(msg ?? `Welcome${displayName ? `, ${displayName.split(" ")[0]}` : ""}!`);
    nav({ to: r === "admin" ? "/admin" : "/" });
  };

  const quickLogin = async (
    targetEmail: string,
    targetPassword: string,
    fallbackRole: Role,
    fallbackName: string
  ) => {
    setError("");
    setBusyText(fallbackRole === "admin" ? "Opening admin console…" : "Signing into account…");
    setBusy(true);

    try {
      const isSpecialAdmin =
        targetEmail.toLowerCase() === "nothingisspecial78@gmail.com" &&
        targetPassword === "abdu@1027";

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPassword,
      });

      if (!authError && authData.user) {
        let userRole: Role = isSpecialAdmin ? "admin" : fallbackRole;
        let displayName = fallbackName;
        let profileAvatar: string | undefined;
        let profileBio: string | undefined;

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, display_name, username, avatar_url, bio")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profile) {
          if (profile.role === "admin" || isSpecialAdmin) {
            userRole = "admin";
          } else {
            userRole = "user";
          }
          if (profile.username || profile.display_name) {
            displayName = profile.username || profile.display_name;
          }
          profileAvatar = profile.avatar_url;
          profileBio = profile.bio;
        }

        if (isSpecialAdmin) {
          userRole = "admin";
        }

        setDemo(false);
        enter(targetEmail, userRole, displayName, `Signed in as ${displayName}`, authData.user.id, undefined, profileAvatar, profileBio);
        return;
      }

      if (authError) {
        console.warn("Supabase auth error during quick login:", authError);
      }
    } catch (err) {
      console.warn("Quick login fallback to local:", err);
    } finally {
      setBusy(false);
    }

    setDemo(false);
    enter(targetEmail, fallbackRole, fallbackName, `Signed in as ${fallbackName}`);
  };

  const handleGoogleSignIn = async () => {
    setBusyText("Opening Google Sign-In…");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: "offline",
            prompt: "consent select_account",
          },
        },
      });

      if (error) {
        toast.error("Google Sign-In: " + error.message);
        setBusy(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to launch Google Sign-In");
      setBusy(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/`
        : "https://outstagram.vercel.app/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        toast.error(error.message || "Apple Sign-In is unavailable.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to launch Apple Sign-In");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError("Please enter your registered email address.");
      return;
    }
    setForgotBusy(true);
    setError("");
    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/settings`
        : "https://outstagram.vercel.app/settings";
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: redirectUrl,
      });
      if (resetErr) {
        setError(resetErr.message || "Could not send reset link.");
        toast.error(resetErr.message || "Could not send reset link.");
      } else {
        toast.success("Password reset link sent! Please check your email inbox.");
        setForgotMode(false);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setForgotBusy(false);
    }
  };

  const go = (r: Role = role) => {
    enter(r === "admin" ? "admin@outstagram.app" : "sam@outstagram.app", r, undefined);
  };

  const submit = async () => {
    setError("");

    if (mode === "in") {
      const uInput = username.trim();
      if (!uInput) return setError("Please enter your username.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");

      setBusyText("Signing you in…");
      setBusy(true);

      try {
        let resolvedEmail: string | null = null;
        const isSpecialAdmin =
          uInput.toLowerCase() === "nothingisspecial78@gmail.com" &&
          password === "abdu@1027";

        if (uInput.includes("@")) {
          resolvedEmail = uInput;
        } else {
          const { data: foundEmail, error: rpcError } = await supabase.rpc(
            "get_email_for_username",
            { p_username: uInput }
          );
          if (rpcError) {
            console.warn("RPC get_email_for_username error:", rpcError);
          }
          resolvedEmail = foundEmail;
        }

        if (!resolvedEmail) {
          setError(`No account found for username "${uInput}". Please check your username or sign up.`);
          toast.error(`No account found for username "${uInput}".`);
          setBusy(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password: password,
        });

        if (authError) {
          setError(authError.message || "Invalid credentials. Please try again.");
          toast.error(authError.message || "Invalid credentials. Please try again.");
          setBusy(false);
          return;
        }

        setDemo(false);

        let userRole: Role = isSpecialAdmin ? "admin" : (role === "admin" ? "admin" : "user");
        let displayName = uInput;
        let userId = authData?.user?.id || resolvedEmail;
        let friendCode: string | undefined = undefined;
        let profileAvatar: string | undefined;
        let profileBio: string | undefined;

        if (authData?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, username, friend_code, role, avatar_url, bio")
            .eq("id", authData.user.id)
            .maybeSingle();

          if (profile) {
            displayName = profile.username || profile.display_name || uInput;
            friendCode = profile.friend_code;
            profileAvatar = profile.avatar_url;
            profileBio = profile.bio;
            if (profile.role === "admin" || isSpecialAdmin) {
              userRole = "admin";
            }
          }
        }

        enter(resolvedEmail, userRole, displayName, `Welcome, ${displayName}!`, userId, friendCode, profileAvatar, profileBio);
      } catch (err: any) {
        const msg = err?.message || "Failed to sign in. Please try again.";
        setError(msg);
        toast.error(msg);
      } finally {
        setBusy(false);
      }
    } else {
      // mode === "up" (Sign Up)
      const trimmedUsername = username.trim();
      const mail = email.trim();

      if (trimmedUsername.length < 3) {
        return setError("Username must be at least 3 characters.");
      }
      if (!/^[a-zA-Z0-9_.]+$/.test(trimmedUsername)) {
        return setError("Username can only contain letters, numbers, underscores, and dots.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        return setError("Please enter a valid email address.");
      }
      if (password.length < 6) {
        return setError("Password must be at least 6 characters.");
      }

      setBusyText("Verifying username availability…");
      setBusy(true);

      try {
        // 1. Check if username is already taken in database
        const { data: isAvailable, error: checkErr } = await supabase.rpc(
          "check_username_available",
          { p_username: trimmedUsername }
        );

        if (checkErr) {
          console.warn("Could not check username:", checkErr);
        } else if (isAvailable === false) {
          setError(`Username "${trimmedUsername}" is already taken. Please choose another username.`);
          toast.error(`Username "${trimmedUsername}" is already taken.`);
          setBusy(false);
          return;
        }

        setBusyText("Creating your Outstagram account…");

        const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "https://outstagram.vercel.app/";
        const finalAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedUsername)}`;
        const finalBio = bio.trim() || "Living offline first. Exploring the city with Outstagram.";

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: mail,
          password: password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: trimmedUsername,
              username: trimmedUsername.toLowerCase(),
              avatar_url: finalAvatar,
              bio: finalBio,
              role: "user",
            },
          },
        });

        if (authError) {
          setError(authError.message);
          toast.error(authError.message || "Failed to create account.");
          setBusy(false);
          return;
        }

        setDemo(false);

        const user = authData?.user;
        const userRole: Role = "user";
        const displayName = trimmedUsername;
        const userId = user?.id || `u_${Date.now()}`;
        const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (user) {
          try {
            await supabase.from("profiles").upsert({
              id: user.id,
              display_name: displayName,
              username: displayName,
              avatar_url: finalAvatar,
              bio: finalBio,
              friend_code: generatedCode,
            });
          } catch (pErr) {
            console.warn("Could not upsert profile:", pErr);
          }
        }

        if (!authData.session) {
          // Switch to OTP Verification Screen
          setOtpMode(true);
          toast.success("Confirmation code sent to your email!");
          setBusy(false);
          return;
        }

        enter(mail, userRole, displayName, "Account created — welcome!", userId, generatedCode, finalAvatar, finalBio);
      } catch (err: any) {
        const msg = err?.message || "An unexpected error occurred during signup.";
        setError(msg);
        toast.error(msg);
      } finally {
        setBusy(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.trim();
    if (token.length < 6) {
      setError("Please enter the complete 6-digit confirmation code.");
      return;
    }
    setError("");
    setOtpBusy(true);

    try {
      // 1. Attempt verification with type 'signup'
      let { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "signup",
      });

      // 2. If signup type fails, fallback to 'email' type
      if (verifyErr) {
        const fallback = await supabase.auth.verifyOtp({
          email: email.trim(),
          token,
          type: "email",
        });
        if (!fallback.error && fallback.data.user) {
          verifyData = fallback.data;
          verifyErr = null;
        }
      }

      if (verifyErr) {
        // Auto-recovery: If OTP verification failed (e.g. token expired because the user already clicked
        // the email confirmation link, or link was used), try signing in with their credentials!
        if (password) {
          try {
            const { data: autoSignIn, error: autoErr } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password,
            });

            if (!autoErr && autoSignIn?.user) {
              setDemo(false);
              const user = autoSignIn.user;
              const finalAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username.trim())}`;
              const finalBio = bio.trim() || "Living offline first. Exploring the city with Outstagram.";
              const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

              toast.success("Account confirmed! Welcome to Outstagram.");
              enter(
                email.trim(),
                "user",
                username.trim() || (user.user_metadata?.["username"] as string | undefined) || "Member",
                "Account verified — welcome to Outstagram!",
                user.id,
                generatedCode,
                finalAvatar,
                finalBio
              );
              return;
            }
          } catch {
            // fallback to showing error
          }
        }

        setError(verifyErr.message || "Invalid or expired confirmation code. If you clicked the link in your email, click 'Check Status' below.");
        toast.error(verifyErr.message || "Invalid confirmation code.");
        setOtpBusy(false);
        return;
      }

      // Successful verification!
      const user = verifyData?.user || (await supabase.auth.getUser()).data.user;
      const finalAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username.trim())}`;
      const finalBio = bio.trim() || "Living offline first. Exploring the city with Outstagram.";
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      if (user) {
        try {
          await supabase.rpc("update_user_profile", {
            p_user_id: user.id,
            p_username: username.trim(),
            p_display_name: username.trim(),
            p_avatar_url: finalAvatar,
            p_bio: finalBio,
          });
        } catch (uErr) {
          console.warn("Profile update RPC error:", uErr);
        }
      }

      setDemo(false);
      toast.success("Email verified! Welcome to Outstagram.");
      enter(
        email.trim(),
        "user",
        username.trim(),
        "Account verified — welcome to Outstagram!",
        user?.id,
        generatedCode,
        finalAvatar,
        finalBio
      );
    } catch (err: any) {
      setError(err?.message || "Failed to verify code.");
      toast.error(err?.message || "Failed to verify code.");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (resendErr) {
        toast.error(resendErr.message || "Failed to resend code.");
      } else {
        toast.success("New 6-digit confirmation code sent to " + email.trim());
      }
    } catch (err: any) {
      toast.error(err.message || "Could not resend code.");
    }
  };

  return (
    <div className="min-h-screen bg-paper-raised">
      {/* Fixed Constant Top Bar for Login & Signup */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 md:h-16 w-full items-center justify-between border-b border-sand bg-paper-raised/95 px-4 sm:px-8 backdrop-blur-md shadow-xs select-none">
        <a href="/" className="flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-95" aria-label="Outstagram Home">
          <OutstagramIcon size={34} />
          <Wordmark className="text-2xl sm:text-3xl text-ink" />
        </a>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerPwaInstall(() => setShowInstallGuide(true))}
            className="flex items-center gap-1.5 rounded-full border border-sand bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-stamp hover:text-stamp-ink transition-colors cursor-pointer"
          >
            <Download className="size-3.5 text-stamp" />
            <span>Install App</span>
          </button>
          <span className="hidden md:inline text-xs font-medium text-ink-muted">The Anti-Instagram</span>
          <span className="hidden sm:inline-block rounded-full bg-stamp-soft px-3 py-1 text-xs font-bold text-stamp-ink">Post less · Go outside</span>
        </div>
      </header>

      <div className="pt-14 md:pt-16 min-h-screen lg:grid lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          <img src={friends} alt="Three friends walking along a river at golden hour" width={1024} height={1280} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
          <Postmark place="Riverside walk" date="TODAY" className="absolute top-10 right-10 size-28 rounded-full bg-paper-raised/85 p-1" />
          <div className="absolute inset-x-12 bottom-12 text-paper-raised">
            <div className="mb-4 inline-flex items-center gap-3 rounded-2xl bg-paper-raised/95 p-2.5 shadow-postcard backdrop-blur-xs">
              <OutstagramIcon size={38} />
              <Wordmark className="text-3xl text-ink pr-2" />
            </div>
            <p className="font-hand text-3xl">The anti-Instagram.</p>
            <p className="mt-2 max-w-md font-serif text-5xl font-semibold leading-tight">Post less. Go somewhere. Meet someone.</p>
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-6 py-10">
          <div className="relative">
            <div className="mb-6 flex items-center gap-3">
              <OutstagramIcon size={40} />
              <Wordmark className="text-3xl sm:text-4xl text-ink" />
            </div>
          <h1 className="font-serif text-3xl font-semibold text-ink lg:text-4xl">
            {forgotMode ? "Reset Password" : otpMode ? "Verify Your Account" : mode === "in" ? "Welcome Back" : "Get Started"}
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {forgotMode
              ? "Enter your registered email address to receive a secure password reset link."
              : otpMode
              ? `Enter the 6-digit confirmation code (OTP) sent to your email.`
              : mode === "in"
              ? "Sign in. One quest, ten postcards, then go outside."
              : "Create an account. No likes, no followers."}
          </p>

          {!otpMode && !forgotMode && (
            <div role="tablist" aria-label="Account type" className="mt-6 grid grid-cols-2 rounded-2xl border border-sand bg-paper p-1">
              {(["user", "admin"] as const).map((r) => (
                <button
                  key={r}
                  role="tab"
                  type="button"
                  aria-selected={role === r}
                  onClick={() => {
                    setRole(r);
                    setError("");
                    setOtpMode(false);
                    setForgotMode(false);
                    if (r === "admin") {
                      setMode("in");
                      setUsername("");
                      setEmail("");
                      setPassword("");
                    }
                  }}
                  className={cn("flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all", role === r ? "bg-paper-raised text-ink shadow-paper" : "text-ink-muted hover:text-ink")}
                >
                  {r === "admin" ? <ShieldCheck className="size-4" /> : <User className="size-4" />}{r === "admin" ? "Admin" : "Member"}
                </button>
              ))}
            </div>
          )}
          {role === "admin" && !otpMode && !forgotMode && <p className="mt-3 rounded-xl bg-stamp-soft px-3 py-2 text-xs text-stamp-ink">Sign in with authorized administrator credentials to review reports, approve partner offers, manage members and set daily quests.</p>}

          {forgotMode ? (
            /* FORGOT PASSWORD VIEW */
            <div className="mt-6 rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-stamp-soft text-stamp mb-3">
                <KeyRound className="size-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink text-center">Reset Your Password</h3>
              <p className="mt-2 text-xs text-ink-muted text-center leading-relaxed">
                Enter your registered email address below, and we will send you a secure link to reset your password.
              </p>

              <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Registered Email</label>
                  <Field icon={Mail}>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={inputCls}
                    />
                  </Field>
                </div>

                {error && <p role="alert" className="rounded-xl bg-stamp-soft px-3 py-2 text-xs font-medium text-stamp-ink text-center">{error}</p>}

                <Button
                  type="submit"
                  disabled={forgotBusy || !email.trim()}
                  className="h-13 w-full rounded-2xl py-3.5 text-base font-bold shadow-postcard transition-transform hover:-translate-y-0.5 cursor-pointer"
                >
                  {forgotBusy ? "Sending reset link…" : "Send Password Reset Link"}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setError("");
                    }}
                    className="text-xs font-semibold text-stamp-ink hover:underline cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : otpMode ? (
            /* OTP VERIFICATION VIEW */
            <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-paper-raised p-6 shadow-paper">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 mb-3">
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink text-center">Enter Confirmation Code</h3>
              <p className="mt-2 text-xs text-ink-muted text-center leading-relaxed">
                We've sent a 6-digit code and confirmation link from <span className="font-semibold text-stamp-ink">outstagram@gmail.com</span> to <span className="font-semibold text-ink">{email}</span>.
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 text-center">6-Digit Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="123456"
                    className="h-14 w-full rounded-2xl border border-sand bg-paper text-center text-3xl font-mono font-bold tracking-[0.4em] text-ink outline-none focus:border-stamp focus:shadow-[0_0_0_4px_var(--stamp-soft)]"
                  />
                </div>

                {error && <p role="alert" className="rounded-xl bg-stamp-soft px-3 py-2 text-xs font-medium text-stamp-ink text-center">{error}</p>}

                <Button
                  type="submit"
                  disabled={otpBusy || otp.length < 6}
                  className="h-13 w-full rounded-2xl py-3.5 text-base font-bold shadow-postcard transition-transform hover:-translate-y-0.5"
                >
                  {otpBusy ? "Verifying code…" : "Verify & Complete Sign Up"}
                </Button>

                <button
                  type="button"
                  onClick={() => checkConfirmationStatus(true)}
                  disabled={otpBusy}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-sand bg-paper py-2.5 text-xs font-semibold text-ink hover:bg-sand/30 transition-colors"
                >
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Already clicked email link? Check Status & Continue →
                </button>

                <div className="flex items-center justify-between pt-2 text-xs text-ink-muted">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-semibold text-stamp-ink hover:underline"
                  >
                    Resend Code / Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpMode(false);
                      setError("");
                    }}
                    className="hover:underline"
                  >
                    Edit Email / Back
                  </button>
                </div>

                <p className="text-center text-[11px] text-ink-muted/80 pt-2 border-t border-sand/50">
                  Tip: If your confirmation email only contains a verification link, simply click the link in your email. You will be signed in automatically, or you can click "Check Status & Continue" above.
                </p>
              </form>
            </div>
          ) : (
            /* NORMAL LOGIN / SIGNUP FORM */
            <form className="mt-5 space-y-3.5" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
              {mode === "up" && (
                <>
                  {/* Avatar Picker & Upload */}
                  <div className="flex items-center gap-4 rounded-2xl border border-sand bg-paper p-3">
                    <div className="relative group shrink-0">
                      <img
                        src={previewAvatar}
                        alt="Avatar preview"
                        className="size-16 rounded-full border-2 border-stamp/40 object-cover bg-sand/20 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Upload photo"
                      >
                        <Camera className="size-5" />
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink">Profile Photo</p>
                      <p className="text-[11px] text-ink-muted">Upload your picture or use default initials.</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="inline-flex items-center gap-1 rounded-lg border border-sand bg-paper-raised px-2.5 py-1 text-xs font-semibold text-ink hover:bg-sand/30"
                        >
                          <Upload className="size-3" /> Upload Photo
                        </button>
                        {avatar && (
                          <button
                            type="button"
                            onClick={() => setAvatar("")}
                            className="text-[11px] text-ink-muted hover:text-stamp-ink"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFile}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Username Field */}
                  <Field icon={User}>
                    <input
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username (e.g. alex24)"
                      className={inputCls}
                    />
                  </Field>

                  {/* Email Field */}
                  <Field icon={Mail}>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className={inputCls}
                    />
                  </Field>
                </>
              )}

              {mode === "in" && (
                <Field icon={User}>
                  <input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === "admin" ? "Admin username or email" : "Username"}
                    className={inputCls}
                  />
                </Field>
              )}

              {/* Password Field */}
              <Field icon={Lock}>
                <input
                  required
                  type={show ? "text" : "password"}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="text-ink-muted hover:text-ink"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </Field>

              {/* Bio Field (Only in Sign Up) */}
              {mode === "up" && (
                <Field icon={FileText}>
                  <input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short bio (e.g. Walking more, scrolling less)"
                    maxLength={120}
                    className={inputCls}
                  />
                </Field>
              )}

              {error && <p role="alert" className="rounded-xl bg-stamp-soft px-3 py-2 text-xs font-medium text-stamp-ink">{error}</p>}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-ink-muted">
                  <Checkbox defaultChecked className="data-[state=checked]:border-stamp data-[state=checked]:bg-stamp" /> Keep me signed in
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError("");
                  }}
                  className="font-semibold text-stamp-ink hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" disabled={busy} className="h-13 w-full rounded-2xl py-3.5 text-base font-bold shadow-postcard transition-transform hover:-translate-y-0.5">
                {busy ? "Please wait…" : role === "admin" ? "Login as Admin" : mode === "in" ? "Login" : "Create Account"}
              </Button>
            </form>
          )}

          {!otpMode && !forgotMode && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-ink-muted"><span className="h-px flex-1 bg-sand" />or continue with<span className="h-px flex-1 bg-sand" /></div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-sand bg-paper-raised py-3 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:shadow-paper cursor-pointer"
                >
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-sand bg-paper-raised py-3 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:shadow-paper cursor-pointer"
                >
                  <svg className="size-4 fill-ink" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-.99 1.74-.85 2.78 1.01.08 2.06-.53 2.58-1.28z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {role === "user" && (
                <p className="mt-6 text-center text-sm text-ink-muted">
                  {mode === "in" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setMode(mode === "in" ? "up" : "in");
                      setError("");
                      setOtpMode(false);
                    }}
                    className="font-bold text-ink hover:text-stamp-ink"
                  >
                    {mode === "in" ? "Sign Up" : "Sign In"}
                  </button>
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setDemo(true);
                  enter("guest@outstagram.app", "user", "Guest", "Exploring as guest");
                }}
                className="mx-auto mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-stamp-ink"
              >
                Explore as Guest <ArrowRight className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className={cn("fixed inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-md transition-opacity", busy ? "opacity-100" : "pointer-events-none opacity-0")} role="status" aria-live="polite">
        <div className={cn("w-72 rounded-3xl bg-paper-raised p-6 text-center shadow-postcard transition-all", busy ? "scale-100" : "scale-90")}>
          <div className="relative mx-auto h-24 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><Postmark place="Outstagram" date="HELLO" className="animate-pulse size-24" /></div>
          </div>
          <p className="mt-3 font-bold text-ink">{busyText}</p>
          <p className="text-xs text-ink-muted">{role === "admin" ? "Opening the admin console" : "Loading your journey"}</p>
        </div>
      </div>

      {/* PWA Install Guide Modal */}
      {showInstallGuide && (
        <InstallGuideModal isIOS={isIOS} onClose={() => setShowInstallGuide(false)} />
      )}
    </div>
  </div>
  );
}