import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "@/services/api";
import {
  User, Lock, Mail, Hash, UserPlus, Users, UserCheck, CalendarPlus, UploadCloud, FileSpreadsheet,
  X, Download, ShieldCheck, ArrowRight, Building2, CheckCircle2, Inbox,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  PageHeader, Button, Card, CardHeader, Field, Input, PasswordInput, Tabs, StatCard, Alert, Badge, Avatar,
  EmptyState, Skeleton, useToast,
} from "../../components/ui";
import { cn } from "../../utils/cn";

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
  fetchStudents: (department) =>
    API
      .get("/admin/students", { params: { department } })
      .then((r) => r.data)
      .catch(toError),

  createStudent: (body) =>
    API
      .post("/admin/create-student", body)
      .then((r) => r.data)
      .catch(toError),

  // Bulk upload — backend sends Excel binary directly
  bulkAddStudents: (file) => {
    const fd = new FormData();
    fd.append("excelFile", file);
    return API
      .post("/admin/students/bulk", fd, { responseType: "blob" })
      .then((r) => r)
      .catch(toError);
  },

  // Download all students with passwords from backend
  downloadAllStudents: (department) =>
    API
      .get("/admin/students/download-all", {
        params: { department },
        responseType: "blob",
      })
      .then((r) => r)
      .catch(toError),
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DEPARTMENTS = ["Data Bricks", "Service Now"];

const EMPTY_FORM = { fullName: "", email: "", password: "", studentId: "" };

// ─── DOWNLOAD HELPER ──────────────────────────────────────────────────────────
const downloadBlob = (blob, filename) => {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const AddStudent = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const fileInputRef = useRef(null);

  const [adminDepartment, setAdminDepartment] = useState("");
  const [students,        setStudents]        = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [mode,         setMode]         = useState("single");
  const [formData,     setFormData]     = useState(EMPTY_FORM);
  const [errors,       setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [excelFile,    setExcelFile]    = useState(null);
  const [excelPreview, setExcelPreview] = useState([]);
  const [bulkErrors,   setBulkErrors]   = useState([]);
  const [bulkLoading,  setBulkLoading]  = useState(false);
  const [dragOver,     setDragOver]     = useState(false);

  const [downloadingAll, setDownloadingAll] = useState(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const role  = localStorage.getItem("userRole");
    const dept  = localStorage.getItem("adminDepartment");
    const token = localStorage.getItem("token");

    if (!token || role !== "admin" || !dept) {
      navigate("/");
      return;
    }

    setAdminDepartment(dept);
    loadStudents(dept);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStudents = async (dept) => {
    setLoadingStudents(true);
    try {
      const data = await api.fetchStudents(dept);
      setStudents(data.students || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingStudents(false);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const deptStudents   = students.filter(
    (s) => (s.department || "").toUpperCase() === (adminDepartment || "").toUpperCase()
  );
  const activeCount    = deptStudents.filter((s) => s.status === "active").length;
  const currentMonth   = new Date().toISOString().slice(0, 7);
  const thisMonthCount = deptStudents.filter((s) =>
    (s.joinDate || s.createdAt || "").startsWith(currentMonth)
  ).length;

  // ── Single form ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.fullName.trim())                e.fullName = "Full name is required";
    else if (formData.fullName.trim().length < 3) e.fullName = "Name must be at least 3 characters";
    if (!formData.email.trim())                   e.email    = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                                                  e.email    = "Please enter a valid email";
    if (!formData.password)                       e.password = "Password is required";
    else if (formData.password.length < 6)        e.password = "Min 6 characters";
    if (formData.studentId.trim()) {
      const sid = Number(formData.studentId);
      if (!Number.isInteger(sid) || sid < 1) e.studentId = "Student ID must be a positive whole number";
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSubmitting(true);
    try {
      const data = await api.createStudent({
        fullName:   formData.fullName.trim(),
        email:      formData.email.trim(),
        password:   formData.password,
        department: adminDepartment,
        ...(formData.studentId.trim() ? { studentId: Number(formData.studentId) } : {}),
      });

      const created = data.student || data;
      setStudents((p) => [created, ...p]);
      setFormData(EMPTY_FORM);
      const assignedId = created.studentId ?? created._id?.toString().slice(-4);
      showToast(`Student added. Assigned ID: ${assignedId ?? "assigned"}`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Excel preview ──────────────────────────────────────────────────────────
  const handleExcelFile = async (file) => {
    if (!file) return;

    setExcelFile(file);
    setBulkErrors([]);
    setExcelPreview([]);

    try {
      const buffer   = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: 1, defval: "", blankrows: false,
      });

      if (jsonData.length < 2) {
        setBulkErrors(["File is empty or has no data rows."]);
        return;
      }

      const headers = jsonData[0].map((h) =>
        String(h || "").trim().toLowerCase().replace(/\s+/g, "")
      );

      const col = (aliases) =>
        aliases.reduce((found, a) => (found !== -1 ? found : headers.indexOf(a)), -1);

      const nameIdx  = col(["name", "fullname", "studentname"]);
      const emailIdx = headers.findIndex((h) => h.includes("email"));
      const passIdx  = headers.findIndex((h) => h.includes("pass"));
      const deptIdx  = col(["department", "dept", "branch"]);

      if (nameIdx === -1 || emailIdx === -1) {
        setBulkErrors([
          "Missing required columns. Your Excel must have:",
          "• Name  (or Full Name / Student Name)",
          "• Email",
          "Optional: Password, Department (DB, SN)",
          "Student ID is auto-assigned — no column needed.",
        ]);
        return;
      }

      const tempErrors = [];
      const parsed = jsonData.slice(1).map((row, idx) => {
        const name  = String(row[nameIdx]  || "").trim();
        const email = String(row[emailIdx] || "").trim();
        const pass  = passIdx !== -1 ? String(row[passIdx] || "").trim() : "";
        const dept  = deptIdx !== -1
          ? String(row[deptIdx] || "").trim().toUpperCase()
          : adminDepartment;

        if (!name || !email) return null;

        if (!email.includes("@")) {
          tempErrors.push(`Row ${idx + 2}: Invalid email "${email}"`);
          return null;
        }

        if (dept && !DEPARTMENTS.includes(dept)) {
          tempErrors.push(
            `Row ${idx + 2}: Unknown department "${dept}" — will use ${adminDepartment}`
          );
        }

        return {
          name,
          email,
          password:   pass || "Student@123",
          department: DEPARTMENTS.includes(dept) ? dept : adminDepartment,
        };
      }).filter(Boolean);

      setExcelPreview(parsed);
      setBulkErrors(tempErrors);
    } catch {
      setBulkErrors(["Could not read file. Make sure it's a valid .xlsx file."]);
    }
  };

  const clearExcel = () => {
    setExcelFile(null);
    setExcelPreview([]);
    setBulkErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Bulk upload ────────────────────────────────────────────────────────────
  const confirmBulkAdd = async () => {
    if (!excelFile || !excelPreview.length) return;
    setBulkLoading(true);
    try {
      const response = await api.bulkAddStudents(excelFile);

      const insertedCount = parseInt(response.headers["x-inserted-count"] || "0", 10);
      const failedCount   = parseInt(response.headers["x-failed-count"]   || "0", 10);

      const filename = response.headers["x-filename"] || `students_credentials_${Date.now()}.xlsx`;

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, filename);

      if (insertedCount > 0 && failedCount > 0) {
        showToast(`Added ${insertedCount} student(s). ${failedCount} skipped (duplicates). Credentials Excel downloaded.`);
      } else if (insertedCount > 0) {
        showToast(`Added ${insertedCount} student(s). Credentials Excel downloaded.`);
      } else {
        showToast("No new students added — all records already exist.", "error");
      }

      await loadStudents(adminDepartment);
      clearExcel();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Download all students — backend includes passwords
  const downloadAllStudents = async () => {
    if (!deptStudents.length) return;
    setDownloadingAll(true);

    try {
      const response = await api.downloadAllStudents(adminDepartment);

      // Extract filename from Content-Disposition header
      const disposition = response.headers["content-disposition"] || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename =
        filenameMatch?.[1] ||
        `${adminDepartment}_students_with_passwords_${Date.now()}.xlsx`;

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, filename);

      const totalCount = response.headers["x-total-count"] || deptStudents.length;
      showToast(`Downloaded ${totalCount} student records with passwords.`);
    } catch (err) {
      showToast(err.message || "Failed to download Excel file.", "error");
    } finally {
      setDownloadingAll(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="Add students"
        description="Register students one at a time or in bulk from Excel. Student IDs are assigned automatically from 101."
        eyebrow={adminDepartment && <Badge tone="brand" icon={Building2}>{adminDepartment} department</Badge>}
        actions={<Button variant="secondary" iconRight={ArrowRight} onClick={() => navigate("/admin/view-students")}>All students</Button>}
      />

      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total students"  value={deptStudents.length} icon={Users}        loading={loadingStudents} />
        <StatCard label="Active"          value={activeCount}         icon={UserCheck}    tone="success" loading={loadingStudents} />
        <StatCard label="Added this month" value={thisMonthCount}     icon={CalendarPlus} tone="info" loading={loadingStudents} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Tabs
            label="How to add students"
            value={mode}
            onChange={setMode}
            items={[
              { value: "single", label: "Single student", icon: UserPlus },
              { value: "bulk",   label: "Bulk upload",    icon: UploadCloud },
            ]}
          />

          {/* ── SINGLE STUDENT FORM ── */}
          {mode === "single" && (
            <Card>
              <CardHeader title="New student" description="The student signs in with this email and password." icon={UserPlus} />
              <form onSubmit={handleSubmit} className="card-body space-y-5" noValidate>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Full name" required error={errors.fullName}>
                    {(p) => <Input {...p} icon={User} name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. Priya Sharma" autoComplete="off" />}
                  </Field>
                  <Field label="Email address" required error={errors.email}>
                    {(p) => <Input {...p} icon={Mail} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="student@example.com" autoComplete="off" />}
                  </Field>
                  <Field label="Password" required error={errors.password} hint="At least 6 characters">
                    {(p) => <PasswordInput {...p} icon={Lock} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" autoComplete="new-password" />}
                  </Field>
                  <Field label="Student ID" error={errors.studentId} hint="Optional — leave blank to auto-assign the next ID">
                    {(p) => <Input {...p} icon={Hash} type="number" min="1" inputMode="numeric" name="studentId" value={formData.studentId} onChange={handleChange} placeholder="Auto" />}
                  </Field>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm">
                  <Lock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="text-slate-600">
                    Department: <strong className="text-slate-900">{adminDepartment}</strong>
                    <span className="text-slate-500"> — you can only add students to your department.</span>
                  </span>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" icon={UserPlus} loading={isSubmitting}>
                    {isSubmitting ? "Adding student…" : "Add student"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* ── BULK UPLOAD ── */}
          {mode === "bulk" && (
            <Card>
              <CardHeader
                title="Bulk add from Excel"
                description="Required columns: Name, Email. Optional: Password, Department."
                icon={FileSpreadsheet}
              />
              <div className="card-body space-y-4">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Choose an Excel file"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleExcelFile(e.dataTransfer.files[0]); }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
                    dragOver ? "border-brand-500 bg-brand-50"
                      : excelFile ? "border-emerald-300 bg-emerald-50/50"
                      : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => handleExcelFile(e.target.files[0])}
                  />
                  {excelFile ? (
                    <>
                      <FileSpreadsheet className="mb-2 h-8 w-8 text-emerald-600" aria-hidden="true" />
                      <p className="text-sm font-semibold text-slate-900">{excelFile.name}</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearExcel(); }}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                      >
                        <X className="h-3.5 w-3.5" /> Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mb-2 h-8 w-8 text-slate-400" aria-hidden="true" />
                      <p className="text-sm font-semibold text-slate-800">
                        Drop an Excel file here, or <span className="text-brand-700 underline">browse</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">.xlsx or .xls</p>
                    </>
                  )}
                </div>

                {bulkErrors.length > 0 && (
                  <Alert tone="warning" title="Check your file">
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {bulkErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </Alert>
                )}

                {excelPreview.length > 0 && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Preview · {excelPreview.length} student{excelPreview.length !== 1 ? "s" : ""}
                      </p>
                      <Badge>IDs assigned by server</Badge>
                    </div>
                    <div className="max-h-72 overflow-auto rounded-lg border border-slate-200 scrollbar-thin">
                      <table className="table">
                        <thead className="sticky top-0">
                          <tr><th>#</th><th>Full name</th><th>Email</th><th>Department</th><th>Password</th></tr>
                        </thead>
                        <tbody>
                          {excelPreview.map((row, i) => (
                            <tr key={i}>
                              <td className="font-mono text-xs text-slate-400">{i + 1}</td>
                              <td className="font-medium text-slate-900">{row.name}</td>
                              <td className="text-slate-600">{row.email}</td>
                              <td><Badge tone="brand">{row.department}</Badge></td>
                              <td className="font-mono text-xs text-slate-500">{row.password}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Alert tone="success" icon={Download}>
                      After upload, a credentials Excel (Student ID, Name, Email, Password) downloads automatically.
                    </Alert>
                    <div className="flex justify-end">
                      <Button icon={CheckCircle2} onClick={confirmBulkAdd} loading={bulkLoading}>
                        {bulkLoading ? "Uploading…" : `Add ${excelPreview.length} student${excelPreview.length !== 1 ? "s" : ""}`}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ── RECENT STUDENTS ── */}
        <Card className="xl:col-span-2 xl:self-start">
          <CardHeader
            title="Recently added"
            description={`${deptStudents.length} in ${adminDepartment || "your department"}`}
            icon={Users}
          />
          {loadingStudents ? (
            <div className="space-y-3 p-5">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : deptStudents.length === 0 ? (
            <EmptyState icon={Inbox} title="No students yet" description="Students you add will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {deptStudents.slice(0, 8).map((student) => (
                <li key={student._id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={student.name || student.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{student.name || student.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{student.email}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                    {student.studentId ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-2 border-t border-slate-100 p-4">
            <Button
              variant="secondary"
              icon={ShieldCheck}
              fullWidth
              onClick={downloadAllStudents}
              loading={downloadingAll}
              disabled={loadingStudents || !deptStudents.length}
              title="Excel with Student ID, Name, Email, Password, Department, Status and Join Date"
            >
              {downloadingAll ? "Generating…" : "Download all with passwords"}
            </Button>
            <p className="text-center text-xs text-slate-500">
              Students added before password export was available show <strong>N/A</strong>.
            </p>
            {deptStudents.length > 8 && (
              <Link to="/admin/view-students" className="flex items-center justify-center gap-1 pt-1 text-sm font-semibold text-brand-700 hover:underline">
                View all {deptStudents.length} students <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};

export default AddStudent;
