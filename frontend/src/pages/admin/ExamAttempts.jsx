// pages/admin/ExamAttempts.jsx — attendance report for one exam
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "@/services/api";
import {
  ArrowLeft, Users, UserCheck, UserX, Percent, RefreshCw, RotateCcw, Clock, ClipboardList, Star, Inbox,
} from "lucide-react";
import {
  PageHeader, Button, StatCard, Card, Tabs, SearchInput, ExamStatusBadge, ScoreBadge, Badge, Avatar,
  ConfirmDialog, EmptyState, ErrorState, LoadingState, useToast,
} from "../../components/ui";

const ExamAttempts = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("attended"); // "attended" or "not-attended"
  const [search, setSearch] = useState("");

  // State is written only after the request settles, so this is safe to call from the mount effect.
  const fetchAttendees = useCallback(async () => {
    try {
      const response = await API.get(`/admin/exams/${id}/attendees`);
      setData(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching attendees:", err);
      setError(err.response?.data?.message || "Failed to load student attendance");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && id !== "undefined") fetchAttendees();
  }, [id, fetchAttendees]);

  const invalidId = !id || id === "undefined";

  const refresh = () => { setLoading(true); fetchAttendees(); };

  const handleResetAttempt = async () => {
    const { _id: studentId, fullName: studentName } = resetTarget;
    setResetting(studentId);
    try {
      await API.delete(`/admin/exams/${id}/attempts/${studentId}/reschedule`);
      toast(`Attempt reset for ${studentName}. They can take the exam again.`);
      setResetTarget(null);
      fetchAttendees(); // Refresh data
    } catch (err) {
      toast(err.response?.data?.message || "Failed to reset attempt", "error");
    } finally {
      setResetting(null);
    }
  };

  if (invalidId || (error && !data)) {
    return (
      <Card>
        <ErrorState title="Couldn't load attendance" message={invalidId ? "Invalid exam ID" : error} onRetry={invalidId ? undefined : refresh} />
        <div className="-mt-8 flex justify-center pb-10">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate("/admin/exams")}>Back to exams</Button>
        </div>
      </Card>
    );
  }

  if (loading && !data) return <Card><LoadingState label="Loading student attendance…" /></Card>;
  if (!data) return null;

  const { exam, summary, attendedStudents = [], notAttendedStudents = [] } = data;

  const q = search.trim().toLowerCase();
  const displayedStudents = (activeTab === "attended" ? attendedStudents : notAttendedStudents).filter((s) =>
    !q || [s.fullName, s.email, s.rollNumber].some((v) => String(v ?? "").toLowerCase().includes(q))
  );
  const attended = activeTab === "attended";

  return (
    <>
      <PageHeader
        title={exam.subject}
        description={`${exam.department} department · Attendance report`}
        eyebrow={
          <button type="button" onClick={() => navigate("/admin/exams")} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" /> Exams
          </button>
        }
        actions={<Button variant="secondary" icon={RefreshCw} onClick={refresh} loading={loading}>Refresh</Button>}
      />

      <Card className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 text-sm">
        <ExamStatusBadge status={exam.status} />
        <span className="flex items-center gap-1.5 text-slate-600"><Clock className="h-4 w-4 text-slate-400" />{exam.duration} min</span>
        <span className="flex items-center gap-1.5 text-slate-600"><ClipboardList className="h-4 w-4 text-slate-400" />{exam.totalQuestions} questions</span>
        <span className="flex items-center gap-1.5 text-slate-600"><Star className="h-4 w-4 text-slate-400" />{exam.totalMarks} marks</span>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students"     value={summary.totalStudents}    icon={Users} />
        <StatCard label="Attended"     value={summary.attendedCount}    icon={UserCheck} tone="success" />
        <StatCard label="Not attended" value={summary.notAttendedCount} icon={UserX} tone="danger" />
        <StatCard label="Attendance"   value={`${summary.attendanceRate}%`} icon={Percent} tone="info" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <Tabs
            label="Attendance"
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { value: "attended",     label: "Attended",     count: attendedStudents.length },
              { value: "not-attended", label: "Not attended", count: notAttendedStudents.length },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or roll no." className="md:w-72" />
        </div>

        {displayedStudents.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={q ? "No matching students" : attended ? "No one has attempted this exam yet" : "Everyone has attempted this exam"}
          />
        ) : (
          <>
            <div className="table-wrap hidden md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll no.</th>
                    {attended && (<><th>Score</th><th>Percentage</th><th>Grade</th></>)}
                    <th>Status</th>
                    {attended && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayedStudents.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={student.fullName} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{student.fullName}</p>
                            <p className="truncate text-xs text-slate-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{student.rollNumber}</td>
                      {attended && (
                        <>
                          <td className="whitespace-nowrap font-semibold tabular text-slate-900">{student.score} / {student.totalMarks}</td>
                          <td><ScoreBadge percentage={student.percentage} /></td>
                          <td className="font-semibold text-slate-900">{student.grade}</td>
                        </>
                      )}
                      <td>
                        {student.status === "attended"
                          ? <Badge tone="success" icon={UserCheck}>Attended</Badge>
                          : <Badge tone="danger" icon={UserX}>Not attended</Badge>}
                      </td>
                      {attended && (
                        <td className="text-right">
                          <Button size="sm" variant="secondary" icon={RotateCcw} loading={resetting === student._id} onClick={() => setResetTarget(student)}>
                            Reset attempt
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {displayedStudents.map((student) => (
                <li key={student._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={student.fullName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{student.fullName}</p>
                      <p className="truncate text-xs text-slate-500">{student.email} · Roll {student.rollNumber}</p>
                    </div>
                    {attended && <p className="font-bold tabular text-slate-900">{student.score}/{student.totalMarks}</p>}
                  </div>
                  {attended && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <ScoreBadge percentage={student.percentage} />
                      <Badge>Grade {student.grade}</Badge>
                      <Button size="sm" variant="secondary" icon={RotateCcw} className="ml-auto" loading={resetting === student._id} onClick={() => setResetTarget(student)}>
                        Reset
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {resetTarget && (
        <ConfirmDialog
          tone="warning"
          title="Reset this attempt?"
          message={<>The submitted attempt for <strong className="text-slate-900">{resetTarget.fullName}</strong> will be removed so they can take the exam again.</>}
          confirmLabel="Reset attempt"
          loading={resetting === resetTarget._id}
          onConfirm={handleResetAttempt}
          onCancel={() => setResetTarget(null)}
        />
      )}
    </>
  );
};

export default ExamAttempts;
