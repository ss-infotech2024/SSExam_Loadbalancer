import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/slices/authSlice";
import API from "../services/api";
import {
  GraduationCap, Shield, Crown, Mail, Lock, User, ScanFace, Building2, BarChart3, ArrowRight,
} from "lucide-react";
import { Alert, Button, Field, Input, PasswordInput, Tabs } from "../components/ui";

const ROLES = [
  { value: "student",    label: "Student",     icon: GraduationCap },
  { value: "admin",      label: "Admin",       icon: Shield },
  { value: "superadmin", label: "Super admin", icon: Crown },
];

const ROLE_NOTE = {
  student:    "Use the credentials from your department admin, or create an account below.",
  admin:      "You manage students and exams for your assigned department only.",
  superadmin: "Full access to admins and department-wide reporting.",
};

const FEATURES = [
  { icon: ScanFace,  title: "Proctored exams",        text: "Camera, fullscreen and tab-switch monitoring." },
  { icon: Building2, title: "Department-scoped",      text: "Admins see only their department's students and exams." },
  { icon: BarChart3, title: "Instant results",        text: "Scores and grades as soon as an exam is submitted." },
];

// ═════════════════════════════════════════════════════════════════════════════
const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [role, setRole] = useState("student");
  const [mode, setMode] = useState("login");

  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("mca");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const switchRole = (r) => {
    setRole(r);
    setMode("login");
    setError("");
    setNotice("");

    setFullName("");
    setDepartment("mca");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setNotice("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setNotice(""); setLoading(true);

    try {
      // ── STUDENT LOGIN / REGISTER ──────────────────────────────────────────
      if (role === "student") {

        // STUDENT REGISTRATION
        if (mode === "register") {

          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
          }

          const res = await API.post("/auth/student/register", {
            fullName: fullName.trim(),
            department: department.trim(),
            email: email.trim(),
            password,
          });

          // If backend returns token after registration
          if (res.data.token && res.data.user) {
            const { token, user } = res.data;

            localStorage.setItem("studentName", user.fullName || "");
            localStorage.setItem("studentId", user.studentId || "");
            localStorage.setItem("studentDept", user.department || "");

            dispatch(loginSuccess({ token, role: "student", user }));
            navigate("/student/dashboard");
            return;
          }

          // Registration successful, but no auto-login
          setMode("login");
          setPassword("");
          setConfirmPassword("");
          setError("");
          setNotice("Registration successful — sign in with your new account.");
          return;
        }

        // STUDENT LOGIN
        const res = await API.post("/auth/student/login", {
          email: email.trim(),
          password,
        });

        const { token, user } = res.data;

        localStorage.setItem("studentName", user.fullName || "");
        localStorage.setItem("studentId", user.studentId || "");
        localStorage.setItem("studentDept", user.department || "");

        dispatch(loginSuccess({ token, role: "student", user }));
        navigate("/student/dashboard");
        return;
      }

      // ── ADMIN LOGIN ─────────────────────────────────────────────────────────
      if (role === "admin") {
        const res = await API.post("/auth/admin/login", {
          email: email.trim(), password,
        });
        const { token, user } = res.data;

        if (!user?.department) {
          setError("No department assigned to your account. Contact superadmin.");
          setLoading(false); return;
        }

        dispatch(loginSuccess({ token, role: "admin", user }));
        navigate("/admin/dashboard");
        return;
      }

      // ── SUPERADMIN LOGIN ────────────────────────────────────────────────────
      if (role === "superadmin") {
        const res = await API.post("/auth/login", {
          email: email.trim(), password,
        });
        dispatch(loginSuccess({ token: res.data.token, role: "superadmin", user: res.data.user }));
        navigate("/superadmin/dashboard");
        return;
      }

    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const isRegister = role === "student" && mode === "register";

  return (
    <div className="flex min-h-screen bg-white">

      {/* ── Brand panel (desktop) ───────────────────────────────────────────── */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden border-r border-brand-100 bg-brand-50 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: "radial-gradient(#c4b7f6 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-brand-200 bg-white shadow-card">
            <img src="/logo.jpg" alt="" className="h-full w-full object-contain p-1" />
          </span>
          <span className="text-lg font-bold text-slate-900">SS Exam Portal</span>
        </div>

        <div className="relative">
          <h2 className="max-w-sm text-3xl font-bold leading-tight text-slate-900">
            Secure online exams for every department.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
            Create papers, run proctored sessions and review results — Data Bricks, Service Now and MCA in one place.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-700 shadow-card">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{title}</span>
                  <span className="block text-sm text-slate-600">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} SS Exam Portal</p>
      </aside>

      {/* ── Form ─────────────────────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">

          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img src="/logo.jpg" alt="" className="h-full w-full object-contain p-1" />
            </span>
            <span className="text-base font-bold text-slate-900">SS Exam Portal</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            {isRegister ? "Create your student account" : "Sign in"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRegister ? "It only takes a minute." : "Choose your role and enter your credentials."}
          </p>

          <Tabs
            items={ROLES}
            value={role}
            onChange={switchRole}
            label="Sign in as"
            className="mt-6 grid w-full grid-cols-3 [&>button]:justify-center [&>button]:whitespace-nowrap [&>button>svg]:hidden sm:[&>button>svg]:inline"
          />
          <p className="mt-2.5 text-xs text-slate-500">{ROLE_NOTE[role]}</p>

          {error && <Alert tone="danger" className="mt-5">{error}</Alert>}
          {notice && <Alert tone="success" className="mt-5">{notice}</Alert>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <Field label="Full name" required>
                {(p) => (
                  <Input {...p} icon={User} type="text" value={fullName} autoComplete="name"
                    onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" disabled={loading} required />
                )}
              </Field>
            )}

            <Field label="Email address" required>
              {(p) => (
                <Input {...p} icon={Mail} type="email" value={email} autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={loading} required />
              )}
            </Field>

            <Field label="Password" required>
              {(p) => (
                <PasswordInput {...p} icon={Lock} value={password}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" disabled={loading} required />
              )}
            </Field>

            {isRegister && (
              <Field label="Confirm password" required>
                {(p) => (
                  <PasswordInput {...p} icon={Lock} value={confirmPassword} autoComplete="new-password"
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" disabled={loading} required />
                )}
              </Field>
            )}

            <Button type="submit" size="lg" fullWidth loading={loading} iconRight={ArrowRight} className="!mt-6">
              {loading
                ? (isRegister ? "Creating account…" : "Signing in…")
                : (isRegister ? "Create account" : "Sign in")}
            </Button>
          </form>

          {role === "student" && (
            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === "login" ? "New student? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
