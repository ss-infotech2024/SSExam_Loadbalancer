import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "@/services/api";
import {
  Pencil, Trash2, KeyRound, RefreshCw, Users, UserCheck, UserX, UserPlus, Wand2, Lock, FilterX, CheckCircle2, XCircle,
  ShieldAlert, Radio,
} from "lucide-react";
import {
  PageHeader, Button, IconButton, StatCard, Card, SearchInput, Select, Field, Input, Modal, ConfirmDialog,
  Alert, Badge, Avatar, EmptyState, Skeleton, Pagination, useToast, ScoreBadge, CardHeader,
} from "../../components/ui";
import { formatDateIST, formatDateTimeShortIST, formatTimeIST } from "../../utils/time";

// Turn axios errors into Error(message) so callers can show err.message
const toError = (err) => {
  throw new Error(
    err.response?.data?.message ||
    err.response?.data?.errors?.[0]?.msg ||
    err.message ||
    "Something went wrong"
  );
};

// ─── API ──────────────────────────────────────────────────────────────────────
const api = {
  // GET /api/admin/students?status=active&search=john
  fetchStudents: (params) =>
    API.get("/admin/students", { params }).then((r) => r.data).catch(toError),

  // GET /api/admin/students/exam-activity → { exams, live, attempts }
  fetchExamActivity: () =>
    API.get("/admin/students/exam-activity").then((r) => r.data).catch(toError),

  // PUT /api/admin/students/:id
  updateStudent: (id, body) =>
    API.put(`/admin/students/${id}`, body).then((r) => r.data).catch(toError),

  // DELETE /api/admin/students/:id
  deleteStudent: (id) =>
    API.delete(`/admin/students/${id}`).then((r) => r.data).catch(toError),

  // PATCH /api/admin/students/:id/password
  changePassword: (id, newPassword) =>
    API
      .patch(`/admin/students/${id}/password`, { newPassword })
      .then((r) => r.data)
      .catch(toError),

  // PATCH /api/admin/students/bulk-password
  bulkChangePassword: (newPassword) =>
    API
      .patch("/admin/students/bulk-password", { newPassword })
      .then((r) => r.data)
      .catch(toError),
};

const PAGE_SIZE = 15;
const ACTIVITY_REFRESH_MS = 30000;

const EMPTY_ACTIVITY = { exams: [], live: [], attempts: [] };
const NO_ACTIVITY    = { live: null, attempts: [] };

const SORTS = {
  newest:      "Newest joined",
  oldest:      "Oldest joined",
  name_asc:    "Name A–Z",
  name_desc:   "Name Z–A",
  id_asc:      "Student ID",
  exam_recent: "Latest exam time",
  score_desc:  "Highest score",
};

// "YYYY-MM-DD" in IST — same format as <input type="date">
const istDay = (iso) => (iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : "");

const nameOf = (s) => s?.fullName || s?.name || "";

const minutesSince = (iso) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

// What the student did in the exam / date currently filtered on
const ActivityCell = ({ info, examFilter }) => {
  if (info.live) {
    return (
      <div className="min-w-0">
        <Badge tone="success" dot pulse>Writing · {info.live.subject}</Badge>
        <p className="mt-1 text-xs text-slate-500">Started {formatTimeIST(info.live.startedAt)} · {minutesSince(info.live.startedAt)} min</p>
      </div>
    );
  }
  const a = info.attempts[0];
  if (a) {
    return (
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-slate-800">{a.subject || "Exam"}</span>
          <ScoreBadge percentage={a.percentage} />
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatDateTimeShortIST(a.submittedAt)}
          {info.attempts.length > 1 && ` · +${info.attempts.length - 1} more`}
        </p>
      </div>
    );
  }
  return examFilter
    ? <Badge tone="warning">Not attempted</Badge>
    : <span className="text-slate-400">—</span>;
};

const randomPassword = (chars) =>
  Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

const StatusBadge = ({ status }) =>
  status === "active"
    ? <Badge tone="success" icon={CheckCircle2}>Active</Badge>
    : <Badge tone="danger" icon={XCircle}>Inactive</Badge>;

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
const EditModal = ({ student, onClose, onSaved }) => {
  const [form,        setForm]        = useState({
    fullName:   student.fullName || student.name || "",
    email:      student.email      || "",
    department: student.department || "",
    status:     student.status     || "active",
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.fullName.trim()) return setError("Full name is required");
    if (!form.email.trim())    return setError("Email is required");

    setSaving(true);
    setError("");
    try {
      // Only send editable fields — department is locked server-side too
      const { fullName, email, status } = form;
      const data = await api.updateStudent(student._id, { fullName, email, status });
      onSaved(data.student);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      dismissible={!saving}
      icon={Pencil}
      title="Edit student"
      description={`ID ${student.studentId ?? "N/A"}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="edit-student-form" loading={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </>
      }
    >
      <form id="edit-student-form" onSubmit={handleSave} className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Full name" required>
          {(p) => <Input {...p} name="fullName" value={form.fullName} onChange={handleChange} />}
        </Field>
        <Field label="Email" required>
          {(p) => <Input {...p} type="email" name="email" value={form.email} onChange={handleChange} />}
        </Field>
        <Field label="Department" hint="Department can't be changed after a student is created.">
          {(p) => <Input {...p} icon={Lock} value={form.department} disabled readOnly />}
        </Field>
        <Field label="Status">
          {(p) => (
            <Select {...p} name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          )}
        </Field>
      </form>
    </Modal>
  );
};

// ─── PASSWORD MODAL ───────────────────────────────────────────────────────────
const PasswordModal = ({ student, onClose }) => {
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState("");
  const [saving,          setSaving]          = useState(false);
  const [success,         setSuccess]         = useState(false);

  const generateRandom = () => {
    const pwd = randomPassword("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%");
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setError("");
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    if (!newPassword || !confirmPassword) return setError("Both fields are required");
    if (newPassword.length < 6)           return setError("Password must be at least 6 characters");
    if (newPassword !== confirmPassword)  return setError("Passwords do not match");

    setSaving(true);
    try {
      await api.changePassword(student._id, newPassword);
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      dismissible={!saving}
      icon={KeyRound}
      title="Change password"
      description={`${student.fullName || student.name} · ID ${student.studentId ?? "N/A"} · ${student.department}`}
      footer={
        success
          ? <Button variant="secondary" onClick={onClose}>Close</Button>
          : (
            <>
              <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button type="submit" form="password-form" loading={saving}>{saving ? "Updating…" : "Update password"}</Button>
            </>
          )
      }
    >
      {success ? (
        <Alert tone="success" title="Password updated">Share the new password with the student securely.</Alert>
      ) : (
        <form id="password-form" onSubmit={handleSubmit} className="space-y-4">
          <Button variant="subtle" icon={Wand2} onClick={generateRandom} fullWidth>Generate a random password</Button>
          {/* Plain text on purpose so the admin can see what they're setting */}
          <Field label="New password" required>
            {(p) => <Input {...p} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }} placeholder="At least 6 characters" className="font-mono" autoComplete="off" />}
          </Field>
          <Field label="Confirm password" required>
            {(p) => <Input {...p} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} placeholder="Re-enter the password" className="font-mono" autoComplete="off" />}
          </Field>
          {error && <Alert tone="danger">{error}</Alert>}
        </form>
      )}
    </Modal>
  );
};

// ─── DELETE MODAL ─────────────────────────────────────────────────────────────
const DeleteModal = ({ student, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await api.deleteStudent(student._id);
      onDeleted(student._id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      title="Delete student?"
      message={
        <>
          <strong className="text-slate-900">{student.fullName || student.name}</strong> (ID {student.studentId ?? "N/A"}) will be removed permanently. This cannot be undone.
        </>
      }
      confirmLabel={deleting ? "Deleting…" : "Delete student"}
      loading={deleting}
      error={error}
      onConfirm={handleDelete}
      onCancel={onClose}
    />
  );
};

// ─── BULK PASSWORD MODAL ──────────────────────────────────────────────────────
// Two steps: choose a password → explicit final confirmation. Applies to every student in the department.
const BulkPasswordModal = ({ studentCount, onClose, onSuccess, showToast }) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateRandomPassword = () => {
    setPassword(randomPassword("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$"));
    setError("");
  };

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError("Enter a password first.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!confirm) {
      setConfirm(true);
      return;
    }

    try {
      setLoading(true);

      const res = await api.bulkChangePassword(password);

      showToast(res.message || "Passwords updated successfully.", "success");

      onSuccess?.();

    } catch (err) {
      showToast(err.message || "Unable to update passwords", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      dismissible={!loading}
      icon={ShieldAlert}
      title="Reset password for all students"
      description={`Applies to all ${studentCount} students in your department`}
      footer={
        !confirm ? (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Continue</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)} disabled={loading}>Back</Button>
            <Button variant="danger" onClick={handleSubmit} loading={loading}>
              {loading ? "Updating…" : `Yes, update all ${studentCount}`}
            </Button>
          </>
        )
      }
    >
      {!confirm ? (
        <div className="space-y-4">
          <Alert tone="warning" title="This affects every student">
            Every student in the department will need the new password to sign in.
          </Alert>
          <Field label="New password" required error={error}>
            {(p) => (
              <Input {...p} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="At least 6 characters" className="font-mono" autoComplete="off" />
            )}
          </Field>
          <Button variant="subtle" icon={Wand2} onClick={generateRandomPassword}>Generate random password</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Alert tone="danger" title="Final confirmation">
            The password for all <strong>{studentCount}</strong> students will be changed. This cannot be undone.
          </Alert>
          <div>
            <p className="label">New password</p>
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-900">{password}</p>
          </div>
        </div>
      )}
    </Modal>
  );
};

const RowActions = ({ student, compact, openModal }) => compact ? (
  <div className="flex flex-wrap gap-2">
    <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openModal("edit", student)}>Edit</Button>
    <Button size="sm" variant="secondary" icon={KeyRound} onClick={() => openModal("password", student)}>Password</Button>
    <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={() => openModal("delete", student)}>Delete</Button>
  </div>
) : (
  <div className="flex justify-end gap-1">
    <IconButton icon={Pencil} label="Edit student" size="sm" onClick={() => openModal("edit", student)} />
    <IconButton icon={KeyRound} label="Change password" size="sm" onClick={() => openModal("password", student)} />
    <IconButton icon={Trash2} label="Delete student" size="sm" variant="danger-ghost" onClick={() => openModal("delete", student)} />
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const ViewStudents = () => {
  const navigate = useNavigate();
  const showToast = useToast();

  const [adminDepartment, setAdminDepartment] = useState("");
  const [students,        setStudents]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [loadError,       setLoadError]       = useState("");

  const [searchTerm,    setSearchTerm]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [examFilter,     setExamFilter]     = useState("");
  const [activityFilter, setActivityFilter] = useState(""); // '' | 'live' | 'attempted' | 'not_attempted'
  const [dateFilter,     setDateFilter]     = useState("");
  const [sortBy,         setSortBy]         = useState("newest");
  const [page,          setPage]          = useState(1);

  const [activity,      setActivity]      = useState(EMPTY_ACTIVITY);

  // Modal state — only one modal open at a time
  const [modal,           setModal]           = useState(null); // 'edit' | 'password' | 'delete' | 'bulk-password'
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const role  = localStorage.getItem("userRole");
    const dept  = localStorage.getItem("adminDepartment");
    const token = localStorage.getItem("token");

    if (!token || role !== "admin" || !dept) { navigate("/"); return; }

    setAdminDepartment(dept);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load students when department is set ───────────────────────────────────
  useEffect(() => {
    if (!adminDepartment) return;
    loadStudents();
  }, [adminDepartment]); // eslint-disable-line react-hooks/exhaustive-deps

  // Activity failing shouldn't break the student list — it just stays empty
  const loadActivity = async () => {
    try {
      const data = await api.fetchExamActivity();
      setActivity({ ...EMPTY_ACTIVITY, ...data });
    } catch (err) {
      console.warn("[exam-activity]", err.message);
    }
  };

  // Keep "Live now" fresh while the page is open
  useEffect(() => {
    if (!adminDepartment) return;
    const id = setInterval(loadActivity, ACTIVITY_REFRESH_MS);
    return () => clearInterval(id);
  }, [adminDepartment]);

  const loadStudents = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [data] = await Promise.all([
        api.fetchStudents({ department: adminDepartment }),
        loadActivity(),
      ]);
      setStudents(data.students || []);
    } catch (err) {
      setLoadError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Per-student exam activity, narrowed to the selected exam / date ──────────
  const activityByStudent = new Map();
  const infoFor = (id) => {
    if (!activityByStudent.has(id)) activityByStudent.set(id, { live: null, attempts: [] });
    return activityByStudent.get(id);
  };
  activity.live.forEach((l) => {
    if (examFilter && String(l.examId) !== examFilter) return;
    if (dateFilter && istDay(l.startedAt) !== dateFilter) return;
    infoFor(String(l.studentId)).live = l;
  });
  activity.attempts.forEach((a) => {
    if (examFilter && String(a.examId) !== examFilter) return;
    if (dateFilter && istDay(a.submittedAt) !== dateFilter) return;
    infoFor(String(a.studentId)).attempts.push(a);
  });
  activityByStudent.forEach((info) =>
    info.attempts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
  const activityOf = (s) => activityByStudent.get(String(s._id)) || NO_ACTIVITY;

  const lastExamTime = (s) => {
    const info = activityOf(s);
    if (info.live) return Date.now();
    return info.attempts[0] ? new Date(info.attempts[0].submittedAt).getTime() : -Infinity;
  };
  const joinedTime = (s) => (s.createdAt ? new Date(s.createdAt).getTime() : 0);

  const sorters = {
    newest:      (a, b) => joinedTime(b) - joinedTime(a),
    oldest:      (a, b) => joinedTime(a) - joinedTime(b),
    name_asc:    (a, b) => nameOf(a).localeCompare(nameOf(b)),
    name_desc:   (a, b) => nameOf(b).localeCompare(nameOf(a)),
    id_asc:      (a, b) => (Number(a.studentId) || Infinity) - (Number(b.studentId) || Infinity),
    exam_recent: (a, b) => lastExamTime(b) - lastExamTime(a),
    score_desc:  (a, b) => (activityOf(b).attempts[0]?.percentage ?? -1) - (activityOf(a).attempts[0]?.percentage ?? -1),
  };

  // ── Filtered list (client-side — all students are already dept-filtered by backend) ──
  const matchesBase = (s) => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      !q ||
      (s.fullName || s.name || "").toLowerCase().includes(q) ||
      // studentId is a Number — safely convert, skip if undefined
      (s.studentId != null && String(s.studentId).includes(q)) ||
      (s.email || "").toLowerCase().includes(q);

    const matchStatus =
      !statusFilter || statusFilter === "All" || s.status === statusFilter;

    return matchSearch && matchStatus;
  };

  // 'live' | 'attempted' | 'not_attempted' for the selected exam / date
  const activityKind = (s) => {
    const info = activityOf(s);
    if (info.live) return "live";
    return info.attempts.length > 0 ? "attempted" : "not_attempted";
  };

  // Counts per activity, within the current search / status / exam / date
  const baseStudents   = students.filter(matchesBase);
  const activityCounts = { live: 0, attempted: 0, not_attempted: 0 };
  baseStudents.forEach((s) => { activityCounts[activityKind(s)] += 1; });

  const filtered = baseStudents.filter((s) => {
    const kind = activityKind(s);
    if (activityFilter) return kind === activityFilter;
    // A date on its own means "who wrote an exam that day"
    return dateFilter ? kind !== "not_attempted" : true;
  }).sort(sorters[sortBy] || sorters.newest);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal  = (type, student) => { setSelectedStudent(student); setModal(type); };
  const closeModal = ()               => { setSelectedStudent(null);   setModal(null); };

  // ── CRUD handlers (update state without full reload) ───────────────────────
  const handleUpdated = (updated) => {
    setStudents((p) => p.map((s) => (s._id === updated._id ? updated : s)));
    closeModal();
    showToast("Student updated.");
  };

  const handleDeleted = (deletedId) => {
    setStudents((p) => p.filter((s) => s._id !== deletedId));
    closeModal();
    showToast("Student deleted.");
  };

  const clearFilters = () => {
    setSearchTerm(""); setStatusFilter(""); setExamFilter(""); setActivityFilter(""); setDateFilter(""); setSortBy("newest"); setPage(1);
  };
  const activeFilters = [searchTerm, statusFilter, examFilter, activityFilter, dateFilter].filter(Boolean).length;
  const setFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  const studentById  = new Map(students.map((s) => [String(s._id), s]));
  const liveSessions = activity.live
    .filter((l) => studentById.has(String(l.studentId)))
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

  const activeCount   = students.filter((s) => s.status === "active").length;
  const inactiveCount = students.filter((s) => s.status === "inactive").length;
  const initialLoad   = loading && students.length === 0;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="All students"
        description={`Students in the ${adminDepartment} department`}
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh" variant="secondary" loading={loading} onClick={loadStudents} />
            <Button variant="secondary" icon={KeyRound} onClick={() => setModal("bulk-password")} disabled={!students.length}>
              Reset all passwords
            </Button>
            <Button icon={UserPlus} onClick={() => navigate("/admin/add-student")}>Add students</Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total students"   value={students.length}     icon={Users}     loading={initialLoad} />
        <StatCard label="Active"           value={activeCount}         icon={UserCheck} tone="success" loading={initialLoad} />
        <StatCard label="Inactive"         value={inactiveCount}       icon={UserX}     tone="danger" loading={initialLoad} />
        <StatCard label="Writing exam now" value={liveSessions.length} icon={Radio}     tone="info" loading={initialLoad} />
      </div>

      {liveSessions.length > 0 && (
        <Card className="mb-6">
          <CardHeader
            icon={Radio}
            title={`Live now · ${liveSessions.length} writing`}
            description="Updates every 30 seconds"
            actions={
              <Button size="sm" variant="secondary" onClick={() => { setActivityFilter("live"); setPage(1); }}>
                Show in list
              </Button>
            }
          />
          <ul className="grid gap-2 p-4 pt-0 sm:grid-cols-2 xl:grid-cols-3">
            {liveSessions.map((l) => {
              const s = studentById.get(String(l.studentId));
              return (
                <li key={`${l.examId}-${l.studentId}`} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                  <Avatar name={nameOf(s)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {nameOf(s)} <span className="font-mono text-xs text-slate-500">#{s.studentId ?? "N/A"}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {l.subject} · since {formatTimeIST(l.startedAt)} ({minutesSince(l.startedAt)} min)
                    </p>
                  </div>
                  <Badge tone="success" dot pulse>Live</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={(v) => { setSearchTerm(v); setPage(1); }}
            placeholder="Search by name, ID or email"
            className="sm:flex-1"
          />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            aria-label="Filter by status"
            className="sm:w-44"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          {activeFilters > 0 && <Button variant="ghost" icon={FilterX} onClick={clearFilters}>Clear</Button>}
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={examFilter} onChange={setFilter(setExamFilter)} aria-label="Filter by exam">
            <option value="">All exams</option>
            {activity.exams.map((e) => (
              <option key={e._id} value={String(e._id)}>
                {e.subject} · {formatDateIST(e.startTime)}{e.status === "active" ? " (live)" : ""}
              </option>
            ))}
          </Select>
          <Select value={activityFilter} onChange={setFilter(setActivityFilter)} aria-label="Filter by exam activity">
            <option value="">Any exam activity</option>
            <option value="live">Writing exam now ({activityCounts.live})</option>
            <option value="attempted">Attempted ({activityCounts.attempted})</option>
            <option value="not_attempted">Not attempted ({activityCounts.not_attempted})</option>
          </Select>
          <Input type="date" value={dateFilter} onChange={setFilter(setDateFilter)} aria-label="Exam date" title="Exam date (IST)" />
          <Select value={sortBy} onChange={setFilter(setSortBy)} aria-label="Sort students">
            {Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>Sort: {label}</option>)}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm">
          <span className="mr-1 text-slate-600">
            <strong className="tabular text-slate-900">{filtered.length}</strong> of {students.length} students
          </span>
          {[
            ["live",          "Writing now",   "success"],
            ["attempted",     "Attempted",     "brand"],
            ["not_attempted", "Not attempted", "warning"],
          ].map(([kind, label, tone]) => (
            <button
              key={kind}
              type="button"
              onClick={() => { setActivityFilter(activityFilter === kind ? "" : kind); setPage(1); }}
              aria-pressed={activityFilter === kind}
              className={activityFilter === kind ? "rounded-full ring-2 ring-brand-400" : "rounded-full"}
            >
              <Badge tone={tone} dot pulse={kind === "live" && activityCounts.live > 0}>
                {label}: <span className="tabular font-semibold">{activityCounts[kind]}</span>
              </Badge>
            </button>
          ))}
        </div>

        {initialLoad ? (
          <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
        ) : loadError && students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Couldn't load students"
            description={loadError}
            action={<Button variant="secondary" icon={RefreshCw} onClick={loadStudents}>Try again</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            description={students.length === 0
              ? `No students have been added to ${adminDepartment} yet.`
              : "No students match your search or filter."}
            action={students.length === 0
              ? <Button icon={UserPlus} onClick={() => navigate("/admin/add-student")}>Add students</Button>
              : <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <>
            <div className="table-wrap hidden md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student</th>
                    <th>Joined</th>
                    <th>Exam activity</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                          {student.studentId ?? "N/A"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={student.fullName || student.name} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{student.fullName || student.name}</p>
                            <p className="truncate text-xs text-slate-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-slate-500">
                        {student.joinDate || (student.createdAt ? formatDateIST(student.createdAt) : "—")}
                      </td>
                      <td><ActivityCell info={activityOf(student)} examFilter={examFilter} /></td>
                      <td><StatusBadge status={student.status} /></td>
                      <td><RowActions student={student} openModal={openModal} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {pageItems.map((student) => (
                <li key={student._id} className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={student.fullName || student.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{student.fullName || student.name}</p>
                      <p className="truncate text-xs text-slate-500">{student.email}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge className="font-mono">ID {student.studentId ?? "N/A"}</Badge>
                        <StatusBadge status={student.status} />
                      </div>
                      <div className="mt-2"><ActivityCell info={activityOf(student)} examFilter={examFilter} /></div>
                    </div>
                  </div>
                  <RowActions student={student} compact openModal={openModal} />
                </li>
              ))}
            </ul>

            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Modals */}
      {modal === "edit"     && selectedStudent && (
        <EditModal student={selectedStudent} onClose={closeModal} onSaved={handleUpdated} />
      )}
      {modal === "password" && selectedStudent && (
        <PasswordModal student={selectedStudent} onClose={closeModal} />
      )}
      {modal === "delete"   && selectedStudent && (
        <DeleteModal student={selectedStudent} onClose={closeModal} onDeleted={handleDeleted} />
      )}
      {modal === "bulk-password" && (
        <BulkPasswordModal
          studentCount={students.length}
          showToast={showToast}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            loadStudents();
          }}
        />
      )}
    </>
  );
};

export default ViewStudents;
