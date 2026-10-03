import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Circle, CheckCircle2, QrCode, User, Mail, Phone, School, Hash, Lock, ArrowRight, XCircle } from "lucide-react";

import {
  getRegistrationQR,
  registerStudentFromQR,
} from "../../services/api";
import { Alert, Button, Field, Input, PasswordInput, LoadingState } from "../../components/ui";
import { cn } from "../../utils/cn";

// Centered single-card frame for this public page
const Frame = ({ children }) => (
  <div className="flex min-h-screen flex-col items-center bg-canvas px-4 py-10 sm:justify-center">
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
        <img src="/logo.jpg" alt="" className="h-full w-full object-contain p-1" />
      </span>
      <span className="text-base font-bold text-slate-900">SS Exam Portal</span>
    </div>
    <div className="card w-full max-w-lg p-6 sm:p-8">{children}</div>
  </div>
);

const StudentRegistration = () => {
  const { token } = useParams();

  const [validQR, setValidQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    college: "",
    password: "",
    confirmPassword: "",
    rollNumber: "",
  });

  // ==========================================
  // VERIFY QR
  // ==========================================

  useEffect(() => {
    const verifyQR = async () => {
      try {
        const response = await getRegistrationQR(token);

        if (response.data.success) {
          setValidQR(true);
        }
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Invalid registration QR"
        );
      } finally {
        setLoading(false);
      }
    };

    verifyQR();
  }, [token]);

  // ==========================================
  // INPUT
  // ==========================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // PASSWORD VALIDATION
  // ==========================================

  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
  };

  const isStrongPassword =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.special;

  const passwordsMatch =
    form.password.length > 0 &&
    form.password === form.confirmPassword;

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const response = await registerStudentFromQR(token, {
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile,
        college: form.college,
        password: form.password,
        rollNumber: form.rollNumber,
      });

      if (response.data.success) {
        setSuccess(response.data.student);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <Frame><LoadingState label="Checking your registration link…" /></Frame>;
  }

  // ==========================================
  // INVALID QR
  // ==========================================

  if (!validQR) {
    return (
      <Frame>
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <XCircle className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">This QR code isn't valid</h1>
          <p className="mt-2 text-sm text-slate-500">
            {error || "This registration QR is invalid or expired."} Ask your department admin for a new code.
          </p>
        </div>
      </Frame>
    );
  }

  // ==========================================
  // SUCCESS
  // ==========================================

  if (success) {
    return (
      <Frame>
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">You're registered</h1>
          <p className="mt-1 text-sm text-slate-500">Keep your student ID — you'll need it at the exam.</p>

          <div className="mx-auto mt-6 max-w-xs rounded-xl border border-brand-200 bg-brand-50 p-4">
            <p className="text-xs font-medium text-brand-700">Your student ID</p>
            <p className="mt-1 font-mono text-3xl font-bold text-slate-900">{success.studentId}</p>
          </div>

          <p className="mt-5 font-semibold text-slate-900">{success.name}</p>
          <p className="text-sm text-slate-500">{success.email}</p>

          <Link to="/" className="btn btn-md btn-primary mt-6">Go to sign in <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </Frame>
    );
  }

  // ==========================================
  // FORM
  // ==========================================

  const checks = [
    [passwordChecks.length, "At least 8 characters"],
    [passwordChecks.uppercase, "One uppercase letter (A–Z)"],
    [passwordChecks.lowercase, "One lowercase letter (a–z)"],
    [passwordChecks.number, "One number (0–9)"],
    [passwordChecks.special, "One special character (!@#$%)"],
  ];

  return (
    <Frame>
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <QrCode className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student registration</h1>
          <p className="text-sm text-slate-500">Fill in your details to create your student account.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" required>
          {(p) => <Input {...p} icon={User} type="text" name="fullName" value={form.fullName} onChange={handleChange} required autoComplete="name" placeholder="As on your college ID" />}
        </Field>
        <Field label="Email" required>
          {(p) => <Input {...p} icon={Mail} type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="you@example.com" />}
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mobile number" required>
            {(p) => <Input {...p} icon={Phone} type="tel" name="mobile" value={form.mobile} onChange={handleChange} required autoComplete="tel" placeholder="10-digit number" />}
          </Field>
          <Field label="Roll number">
            {(p) => <Input {...p} icon={Hash} type="text" name="rollNumber" value={form.rollNumber} onChange={handleChange} placeholder="Optional" />}
          </Field>
        </div>
        <Field label="College">
          {(p) => <Input {...p} icon={School} type="text" name="college" value={form.college} onChange={handleChange} placeholder="College name" />}
        </Field>

        <Field label="Password" required>
          {(p) => <PasswordInput {...p} icon={Lock} name="password" value={form.password} onChange={handleChange} required autoComplete="new-password" placeholder="Create a strong password" />}
        </Field>

        {form.password.length > 0 && (
          <ul className="grid grid-cols-1 gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-2" aria-label="Password requirements">
            {checks.map(([ok, text]) => (
              <li key={text} className={cn("flex items-center gap-1.5", ok ? "text-emerald-700" : "text-slate-500")}>
                {ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Circle className="h-3 w-3" aria-hidden="true" />}
                {text}
                <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
              </li>
            ))}
          </ul>
        )}

        <Field
          label="Confirm password"
          required
          error={form.confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : undefined}
          hint={form.confirmPassword.length > 0 && passwordsMatch ? "Passwords match" : undefined}
        >
          {(p) => <PasswordInput {...p} icon={Lock} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required autoComplete="new-password" placeholder="Re-enter your password" />}
        </Field>

        {error && <Alert tone="danger">{error}</Alert>}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!isStrongPassword || !passwordsMatch}
        >
          {submitting ? "Creating account…" : "Register"}
        </Button>
      </form>
    </Frame>
  );
};

export default StudentRegistration;
