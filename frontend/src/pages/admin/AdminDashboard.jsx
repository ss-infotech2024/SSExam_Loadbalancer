// pages/admin/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "@/services/api";
import {
  Users, ClipboardList, Radio, FileCheck2, TrendingUp, Percent, RefreshCw, ArrowRight,
  FilePlus2, UserPlus, ScanLine, QrCode, Clock, CalendarDays, Inbox,
} from "lucide-react";
import {
  PageHeader, Button, StatCard, Card, CardHeader, ExamStatusBadge, ScoreBadge, Avatar, EmptyState, ErrorState, Skeleton,
} from "../../components/ui";
import { formatDateIST, formatDateTimeShortIST } from "../../utils/time";

const QUICK_ACTIONS = [
  { to: "/admin/create-exam",             label: "Create exam",     icon: FilePlus2 },
  { to: "/admin/add-student",             label: "Add students",    icon: UserPlus },
  { to: "/admin/qr-scanner",              label: "QR attendance",   icon: ScanLine },
  { to: "/admin/student-registration-qr", label: "Registration QR", icon: QrCode },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const adminDepartment = localStorage.getItem("adminDepartment") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0, totalExams: 0, averageScore: 0, activeExams: 0, totalResults: 0, passRate: 0,
  });
  const [recentExams, setRecentExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  // Writes state only after the requests settle (safe to call from the mount effect).
  const fetchDashboardData = useCallback(async () => {
    try {
      const [studentsRes, examsRes, resultsRes] = await Promise.all([
        API.get("/admin/students"),
        API.get("/admin/exams"),
        API.get("/admin/results"),
      ]);

      const students = studentsRes.data.students || [];
      const exams = examsRes.data.exams || [];
      const results = resultsRes.data.results || [];

      const totalResults = results.length;
      let totalScore = 0;
      results.forEach(r => totalScore += r.percentage || 0);

      setStats({
        totalStudents: students.length,
        totalExams:    exams.length,
        activeExams:   exams.filter((e) => e.status === "active").length,
        totalResults,
        averageScore:  totalResults > 0 ? Math.round(totalScore / totalResults) : 0,
        passRate:      totalResults > 0
          ? Math.round((results.filter(r => (r.percentage || 0) >= 40).length / totalResults) * 100)
          : 0,
      });

      // Live first, then upcoming by start time, then most recent
      const order = { active: 0, upcoming: 1, completed: 2 };
      setRecentExams(
        [...exams]
          .sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3) ||
            new Date(b.createdAt || b.startTime) - new Date(a.createdAt || a.startTime))
          .slice(0, 5)
      );
      setRecentResults(
        [...results].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 5)
      );
      setError("");
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const refresh = () => { setLoading(true); fetchDashboardData(); };

  const studentName = (r) => r.studentName || r.student?.name || r.student?.fullName || "Student";
  const examName = (r) => r.examName || r.exam?.subject || "Exam";

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={adminDepartment ? `Overview of the ${adminDepartment} department` : "Department overview"}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={refresh} loading={loading}>Refresh</Button>
            <Button icon={FilePlus2} onClick={() => navigate("/admin/create-exam")}>Create exam</Button>
          </>
        }
      />

      {error && (
        <Card className="mb-6"><ErrorState title="Couldn't load the dashboard" message={error} onRetry={refresh} /></Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Students"      value={stats.totalStudents}     icon={Users}         loading={loading} />
        <StatCard label="Exams"         value={stats.totalExams}        icon={ClipboardList} tone="neutral" loading={loading} />
        <StatCard label="Live now"      value={stats.activeExams}       icon={Radio}         tone="success" loading={loading} />
        <StatCard label="Results"       value={stats.totalResults}      icon={FileCheck2}    tone="info" loading={loading} />
        <StatCard label="Average score" value={`${stats.averageScore}%`} icon={TrendingUp}   tone="neutral" loading={loading} />
        <StatCard label="Pass rate"     value={`${stats.passRate}%`}    icon={Percent}       tone="success" loading={loading} />
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="card group flex items-center gap-3 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-slate-800">{label}</span>
            <ArrowRight className="ml-auto hidden h-4 w-4 text-slate-300 group-hover:text-brand-600 sm:block" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Exams */}
        <Card>
          <CardHeader
            title="Exams"
            description="Live and upcoming first"
            icon={ClipboardList}
            actions={<Link to="/admin/exams" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">View all <ArrowRight className="h-4 w-4" /></Link>}
          />
          {loading ? (
            <div className="space-y-3 p-5">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : recentExams.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No exams yet"
              action={<Button size="sm" icon={FilePlus2} onClick={() => navigate("/admin/create-exam")}>Create exam</Button>}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentExams.map((exam) => (
                <li key={exam._id}>
                  <Link to={`/admin/exams/${exam._id}/attempts`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{exam.subject}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDateTimeShortIST(exam.startTime)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration} min</span>
                        <span>{exam.questionCount ?? exam.questions?.length ?? 0} questions</span>
                      </p>
                    </div>
                    <ExamStatusBadge status={exam.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Results */}
        <Card>
          <CardHeader
            title="Latest results"
            icon={FileCheck2}
            actions={<Link to="/admin/student-scores" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">View all <ArrowRight className="h-4 w-4" /></Link>}
          />
          {loading ? (
            <div className="space-y-3 p-5">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : recentResults.length === 0 ? (
            <EmptyState icon={Inbox} title="No results yet" description="Results appear when students submit exams." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentResults.map((result, i) => (
                <li key={result._id || i} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={studentName(result)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{studentName(result)}</p>
                    <p className="truncate text-xs text-slate-500">
                      {examName(result)}
                      {result.submittedAt && <> · {formatDateIST(result.submittedAt)}</>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular text-slate-900">{result.score}/{result.totalMarks}</p>
                    <div className="mt-0.5"><ScoreBadge percentage={result.percentage} /></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};

export default AdminDashboard;
