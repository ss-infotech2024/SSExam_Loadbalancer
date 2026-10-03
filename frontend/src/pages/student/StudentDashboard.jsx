import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "@/services/api";
import {
  Clock, CalendarDays, CheckCircle2, BookOpen, Play, Camera, Lock, BarChart3, Radio, FileText, Award,
  Maximize, ShieldCheck, VideoOff, Video, Inbox, KeyRound, Eye, UserX, MonitorX,
} from "lucide-react";
import { StudentLayout } from "../../components/student/StudentLayout";
import ExamInterface from "./ExamInterface";
import {
  Button, Card, StatCard, Tabs, Badge, ExamStatusBadge, Modal, Alert, EmptyState, ErrorState, Skeleton,
} from "../../components/ui";
import { formatDateTimeShortIST, formatTimeIST, formatWeekdayIST, isTodayIST } from "../../utils/time";
import { cn } from "../../utils/cn";

// ─── Countdown ────────────────────────────────────────────────────────────────
const calcCountdown = (targetISO) => {
  if (!targetISO) return { h: 0, m: 0, s: 0, over: true };
  const diff = new Date(targetISO) - new Date();
  if (diff <= 0) return { h: 0, m: 0, s: 0, over: true };
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    over: false,
  };
};

const useCountdown = (targetISO) => {
  const [cd, setCd] = useState(() => calcCountdown(targetISO));
  useEffect(() => {
    const t = setInterval(() => setCd(calcCountdown(targetISO)), 1000);
    return () => clearInterval(t);
  }, [targetISO]);
  return cd;
};

const CountdownBadge = ({ startTime }) => {
  const { h, m, s, over } = useCountdown(startTime);
  if (over) return <Badge tone="success" dot pulse>Starting now</Badge>;
  const d = Math.floor(h / 24);
  const label = d > 0
    ? `${d}d ${h % 24}h`
    : `${h > 0 ? `${h}h ` : ""}${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return <Badge tone="info" icon={Clock} className="font-mono tabular">{label}</Badge>;
};

// ─── Guidelines Modal ────────────────────────────────────────────────────────
const GuidelinesModal = ({ exam, onStart, onClose, starting, error }) => {
  const cameraOn = exam?.cameraEnabled !== false;
  const [agreed, setAgreed] = useState(false);

  const requirements = [
    cameraOn && {
      icon: Camera, title: "Camera access",
      text: "Your browser will ask for camera permission. Your face must stay visible and centred for the whole exam.",
    },
    {
      icon: Maximize, title: "Fullscreen mode",
      text: "The exam runs in fullscreen. Leaving fullscreen counts as a violation.",
    },
    {
      icon: ShieldCheck, title: "Active proctoring",
      text: cameraOn
        ? "Face, gaze and eye checks run continuously, along with tab-switch and keyboard monitoring."
        : "Camera proctoring is off for this exam. Tab-switch, fullscreen and keyboard monitoring still apply.",
    },
  ].filter(Boolean);

  const violations = [
    { icon: MonitorX, text: "Switching tabs or exiting fullscreen" },
    { icon: KeyRound, text: "Blocked keys (Esc, F11, Ctrl+W/R/T, Alt+Tab) or right-click" },
    cameraOn && { icon: UserX, text: "No face, or more than one face, in view" },
    cameraOn && { icon: Eye, text: "Looking away or eyes closed for long periods" },
  ].filter(Boolean);

  return (
    <Modal
      onClose={onClose}
      dismissible={!starting}
      size="lg"
      icon={ShieldCheck}
      title="Before you begin"
      description={exam?.subject}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={starting}>Not now</Button>
          <Button icon={cameraOn ? Camera : Play} onClick={onStart} loading={starting} disabled={!agreed} size="lg">
            {starting ? "Starting…" : cameraOn ? "Allow camera & start" : "Start exam"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Exam facts */}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Clock,        label: "Duration",  val: `${exam?.duration} min` },
            { icon: FileText,     label: "Questions", val: exam?.questionCount ?? "—" },
            { icon: Award,        label: "Marks",     val: `${(exam?.questionCount ?? 0) * (exam?.marksPerQuestion || 1)} (${exam?.marksPerQuestion || 1}/Q)` },
            { icon: CalendarDays, label: "Closes at", val: `${formatTimeIST(exam?.endTime)} IST` },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-xs text-slate-500"><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">{val}</dd>
            </div>
          ))}
        </dl>

        {/* Requirements */}
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">What you'll need</h3>
          <ul className="space-y-3">
            {requirements.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Rules */}
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Exam rules</h3>
          <ol className="space-y-2 text-sm text-slate-700">
            {[
              "You can attempt this exam only once.",
              "There is no negative marking — answer every question.",
              "Your answers are submitted automatically when the timer reaches zero.",
              cameraOn && "Sit in a well-lit place. Only you should be visible to the camera.",
            ].filter(Boolean).map((rule, i) => (
              <li key={rule} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{i + 1}</span>
                {rule}
              </li>
            ))}
          </ol>
        </section>

        {/* Violations */}
        <Alert tone="warning" title="5 warnings = automatic submission">
          <p className="mb-2">Each of these adds a warning. On the 5th warning your exam is submitted automatically with the answers saved so far.</p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {violations.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2 text-xs">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{text}
              </li>
            ))}
          </ul>
        </Alert>

        {error && <Alert tone="danger" title="Camera access needed">{error}</Alert>}

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3.5 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600"
          />
          <span className="text-sm text-slate-700">
            I have read the rules and understand that {cameraOn ? "my camera, screen and keyboard activity" : "my screen and keyboard activity"} will be monitored.
          </span>
        </label>
      </div>
    </Modal>
  );
};

// ─── ExamCard ────────────────────────────────────────────────────────────────
const ExamCard = ({ exam, onStart, onViewResult, attempted }) => {
  const isActive = exam.status === "active";
  const isUpcoming = exam.status === "upcoming";
  const isDone = exam.status === "completed";
  const isAttempted = attempted === true;
  const cameraOn = exam.cameraEnabled !== false;

  return (
    <article
      className={cn(
        "card flex flex-col p-5 transition-shadow hover:shadow-pop",
        isActive && !isAttempted && "border-emerald-300 ring-1 ring-emerald-200"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">{exam.subject}</h3>
          <p className="text-xs text-slate-500">{exam.department} department</p>
        </div>
        {isAttempted ? <Badge tone="brand" icon={CheckCircle2}>Attempted</Badge> : <ExamStatusBadge status={exam.status} />}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Badge icon={Clock}>{exam.duration} min</Badge>
        <Badge icon={FileText}>{exam.questionCount} questions</Badge>
        <Badge icon={Award}>{exam.questionCount * (exam.marksPerQuestion || 1)} marks</Badge>
        <Badge icon={cameraOn ? Video : VideoOff}>{cameraOn ? "Camera proctored" : "No camera"}</Badge>
      </div>

      <dl className="mb-4 space-y-1.5 rounded-lg bg-slate-50 px-3 py-2.5 text-xs">
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Opens</dt><dd className="font-medium text-slate-800">{formatDateTimeShortIST(exam.startTime)} IST</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Closes</dt><dd className="font-medium text-slate-800">{formatDateTimeShortIST(exam.endTime)} IST</dd></div>
        {isUpcoming && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-1.5">
            <dt className="text-slate-500">Starts in</dt><dd><CountdownBadge startTime={exam.startTime} /></dd>
          </div>
        )}
      </dl>

      <div className="mt-auto">
        {isActive && !isAttempted && (
          <Button variant="success" icon={Play} size="lg" fullWidth onClick={() => onStart(exam)}>Start exam</Button>
        )}
        {isActive && isAttempted && (
          <Button variant="secondary" icon={Lock} fullWidth disabled>Already attempted</Button>
        )}
        {isUpcoming && (
          <p className="rounded-lg border border-dashed border-slate-300 py-2.5 text-center text-sm text-slate-500">Opens {formatWeekdayIST(exam.startTime)}</p>
        )}
        {isDone && (
          <Button variant="subtle" icon={BarChart3} fullWidth onClick={() => onViewResult(exam)}>View result</Button>
        )}
      </div>
    </article>
  );
};

const CardGrid = ({ children }) => <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const StudentDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    const r = localStorage.getItem("userRole");
    if (!t || r !== "student") navigate("/");
  }, [navigate]);

  const studentName = localStorage.getItem("studentName") || "Student";
  const studentId = localStorage.getItem("studentId") || "";

  const [exams, setExams] = useState([]);
  const [attemptMap, setAttemptMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [examStarted, setExamStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Writes state only after the requests settle (safe to call from the mount effect).
  const fetchExams = useCallback(async () => {
    try {
      const res = await API.get("/student/exams");
      const examList = res.data.exams || [];
      setExams(examList);

      const attemptStatuses = {};
      await Promise.all(
        examList.map(async (exam) => {
          try {
            const statusRes = await API.get(`/student/exams/${exam._id}/attempt-status`);
            if (statusRes.data.attempted) {
              attemptStatuses[exam._id] = true;
            }
          } catch (err) {
            console.error(`Failed to fetch attempt status for exam ${exam._id}:`, err);
          }
        })
      );
      setAttemptMap(attemptStatuses);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const loadExams = useCallback(() => { setLoading(true); fetchExams(); }, [fetchExams]);

  const activeExams = exams.filter(e => e.status === "active");
  const upcomingExams = exams.filter(e => e.status === "upcoming")
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const completedExams = exams.filter(e => e.status === "completed");
  const todayExams = upcomingExams.filter(e => isTodayIST(e.startTime));
  const pendingLive = activeExams.filter(e => !attemptMap[e._id]);

  const handleStartExam = (exam) => {
    if (attemptMap[exam._id]) return; // the card already shows "Already attempted"
    setStartError("");
    setSelectedExam(exam);
    setShowGuidelines(true);
  };

  const beginExam = async () => {
    setStarting(true);
    setStartError("");
    try {
      // Camera permission is only checked when proctoring is on (missing field = on)
      if (selectedExam?.cameraEnabled !== false) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
      }
      await document.documentElement.requestFullscreen?.().catch(() => {});
      setShowGuidelines(false);
      setExamStarted(true);
    } catch {
      setStartError("Please allow camera access to start the exam. Check the camera icon in your browser's address bar, then try again.");
    } finally {
      setStarting(false);
    }
  };

  const handleExamEnd = () => {
    setExamStarted(false);
    setSelectedExam(null);
    loadExams();
  };

  if (examStarted && selectedExam) {
    return <ExamInterface exam={selectedExam} onExamEnd={handleExamEnd} />;
  }

  const greet = () => {
    const h = currentTime.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const summary = pendingLive.length > 0
    ? `${pendingLive.length} exam${pendingLive.length > 1 ? "s are" : " is"} open now — you can start right away.`
    : todayExams.length > 0
    ? `${todayExams.length} exam${todayExams.length > 1 ? "s" : ""} scheduled for later today.`
    : upcomingExams.length > 0
    ? `You have ${upcomingExams.length} upcoming exam${upcomingExams.length !== 1 ? "s" : ""}.`
    : "No exams scheduled right now.";

  const listForTab = tab === "upcoming" ? upcomingExams : completedExams;

  return (
    <StudentLayout>
      {/* Welcome */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-medium text-brand-700">{greet()},</p>
          <h1 className="text-2xl font-bold text-slate-900">{studentName.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-slate-600">{loading ? "Loading your exams…" : summary}</p>
        </div>
        <dl className="flex gap-3">
          {studentId && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <dt className="text-xs text-slate-500">Student ID</dt>
              <dd className="font-mono text-lg font-bold text-slate-900">{studentId}</dd>
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
            <dt className="text-xs text-slate-500">Time (IST)</dt>
            <dd className="font-mono text-lg font-bold tabular text-slate-900">
              {currentTime.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open now"  value={activeExams.length}    icon={Radio}        tone="success" loading={loading} />
        <StatCard label="Upcoming"  value={upcomingExams.length}  icon={CalendarDays} tone="info" hint={todayExams.length ? `${todayExams.length} today` : undefined} loading={loading} />
        <StatCard label="Completed" value={completedExams.length} icon={CheckCircle2} tone="neutral" loading={loading} />
        <StatCard label="All exams" value={exams.length}          icon={BookOpen}     loading={loading} />
      </div>

      {error && (
        <Card className="mb-6"><ErrorState title="Couldn't load your exams" message={error} onRetry={loadExams} /></Card>
      )}

      {loading ? (
        <CardGrid>{[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}</CardGrid>
      ) : !error && exams.length === 0 ? (
        <Card>
          <EmptyState icon={BookOpen} title="No exams yet" description="Your department has no scheduled exams at the moment. Check back later." />
        </Card>
      ) : !error && (
        <>
          {/* Live exams */}
          {activeExams.length > 0 && (
            <section className="mb-8" aria-labelledby="live-heading">
              <div className="mb-3 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <h2 id="live-heading" className="text-base font-semibold text-slate-900">Open now</h2>
                <Badge tone="success">{activeExams.length}</Badge>
              </div>
              <CardGrid>
                {activeExams.map(e => (
                  <ExamCard
                    key={e._id}
                    exam={e}
                    onStart={handleStartExam}
                    onViewResult={() => navigate("/student/results")}
                    attempted={attemptMap[e._id]}
                  />
                ))}
              </CardGrid>
            </section>
          )}

          {/* Upcoming / completed */}
          <section aria-label="Other exams">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <Tabs
                label="Exam list"
                value={tab}
                onChange={setTab}
                items={[
                  { value: "upcoming",  label: "Upcoming",  count: upcomingExams.length },
                  { value: "completed", label: "Completed", count: completedExams.length },
                ]}
              />
              {tab === "completed" && completedExams.length > 0 && (
                <Button variant="ghost" icon={BarChart3} onClick={() => navigate("/student/results")}>All results</Button>
              )}
            </div>

            {listForTab.length === 0 ? (
              <Card>
                <EmptyState
                  icon={tab === "upcoming" ? CalendarDays : Inbox}
                  title={tab === "upcoming" ? "No upcoming exams" : "No completed exams yet"}
                  description={tab === "upcoming" ? "New exams from your department will appear here." : undefined}
                />
              </Card>
            ) : (
              <CardGrid>
                {listForTab.map(e => (
                  <ExamCard
                    key={e._id}
                    exam={e}
                    onStart={handleStartExam}
                    onViewResult={() => navigate("/student/results")}
                    attempted={attemptMap[e._id]}
                  />
                ))}
              </CardGrid>
            )}
          </section>
        </>
      )}

      {showGuidelines && selectedExam && (
        <GuidelinesModal
          exam={selectedExam}
          onStart={beginExam}
          onClose={() => { setShowGuidelines(false); setSelectedExam(null); }}
          starting={starting}
          error={startError}
        />
      )}
    </StudentLayout>
  );
};

export default StudentDashboard;
