import React from "react";
import { CheckCircle2, Clock3, Radio, XCircle } from "lucide-react";
import { cn } from "../../utils/cn";

const TONES = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  brand:   "border-brand-200 bg-brand-50 text-brand-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger:  "border-rose-200 bg-rose-50 text-rose-700",
  info:    "border-sky-200 bg-sky-50 text-sky-700",
};

const DOTS = {
  neutral: "bg-slate-400", brand: "bg-brand-500", success: "bg-emerald-500",
  warning: "bg-amber-500", danger: "bg-rose-500", info: "bg-sky-500",
};

export const Badge = ({ tone = "neutral", icon: Icon, dot, pulse, className, children }) => (
  <span className={cn("badge", TONES[tone], className)}>
    {dot && (
      <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[tone], pulse && "animate-pulse")} aria-hidden="true" />
    )}
    {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
    {children}
  </span>
);

// Exam lifecycle status as returned by the API: upcoming | active | completed
const EXAM_STATUS = {
  upcoming:  { tone: "info",    label: "Upcoming",  icon: Clock3 },
  active:    { tone: "success", label: "Live now",  icon: Radio },
  completed: { tone: "neutral", label: "Completed", icon: CheckCircle2 },
};

export const ExamStatusBadge = ({ status }) => {
  const s = EXAM_STATUS[status] || EXAM_STATUS.upcoming;
  return <Badge tone={s.tone} icon={s.icon}>{s.label}</Badge>;
};

/** Pass / fail at the app-wide 40% threshold — icon + text so it never relies on colour alone. */
export const PassFailBadge = ({ percentage }) => {
  const pass = (percentage ?? 0) >= 40;
  return (
    <Badge tone={pass ? "success" : "danger"} icon={pass ? CheckCircle2 : XCircle}>
      {pass ? "Pass" : "Fail"}
    </Badge>
  );
};

/** Percentage chip, tinted by performance band. */
export const ScoreBadge = ({ percentage }) => {
  const p = Number(percentage) || 0;
  const tone = p >= 70 ? "success" : p >= 40 ? "warning" : "danger";
  return <Badge tone={tone} className="font-mono tabular">{p}%</Badge>;
};
