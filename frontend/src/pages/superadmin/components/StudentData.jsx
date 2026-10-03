// pages/superadmin/components/StudentData.jsx — student counts per department
import React, { useState } from "react";
import { Building2, ChevronRight, ClipboardList, FileCheck2, GraduationCap, RefreshCw, Users } from "lucide-react";
import {
  PageHeader, Button, SearchInput, Select, StatCard, Card, EmptyState, ErrorState, Skeleton, Alert, Spinner,
} from "../../../components/ui";
import DepartmentDetailModal from "../../../components/superadmin/DepartmentDetailModal";
import { useDepartmentStats, useDepartmentDetail } from "../useDepartmentStats";

const StudentData = () => {
  const { departments, loading, error, reload } = useDepartmentStats();
  const { detail, loadingDept, detailError, open, close, clearError } = useDepartmentDetail();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("studentCount");

  const filteredDepartments = departments
    .filter((dept) => dept.department.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "studentCount") return b.studentCount - a.studentCount;
      if (sortBy === "averageScore") return b.averageScore - a.averageScore;
      if (sortBy === "passRate") return b.passRate - a.passRate;
      return 0;
    });

  const totalStudents = departments.reduce((s, d) => s + (d.studentCount || 0), 0);
  const maxStudents = Math.max(1, ...departments.map((d) => d.studentCount || 0));

  return (
    <>
      <PageHeader
        title="Students"
        description="Student enrolment by department. Select a department to see its exam results."
        actions={<Button variant="secondary" icon={RefreshCw} onClick={reload} loading={loading}>Refresh</Button>}
      />

      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total students" value={totalStudents}      icon={GraduationCap} loading={loading} />
        <StatCard label="Departments"    value={departments.length} icon={Building2} tone="info" loading={loading} />
        <StatCard
          label="Largest department"
          value={departments.length ? [...departments].sort((a, b) => b.studentCount - a.studentCount)[0].department : "—"}
          icon={Users}
          tone="neutral"
          loading={loading}
        />
      </div>

      {detailError && (
        <Alert tone="danger" className="mb-4" action={<button className="text-xs font-semibold underline" onClick={clearError}>Dismiss</button>}>
          {detailError}
        </Alert>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search departments" className="flex-1" />
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort departments" className="sm:w-56">
          <option value="studentCount">Sort by student count</option>
          <option value="averageScore">Sort by average score</option>
          <option value="passRate">Sort by pass rate</option>
        </Select>
      </div>

      {error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <Card><EmptyState icon={Building2} title="No departments found" description="Try a different search." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDepartments.map((dept) => (
            <button
              key={dept.department}
              type="button"
              onClick={() => open(dept.department)}
              disabled={!!loadingDept}
              className="card group p-5 text-left transition-shadow hover:border-brand-300 hover:shadow-pop disabled:cursor-wait"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">Department</p>
                  <h3 className="truncate text-lg font-semibold text-slate-900">{dept.department}</h3>
                </div>
                {loadingDept === dept.department
                  ? <Spinner />
                  : <ChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-brand-600" aria-hidden="true" />}
              </div>

              <p className="mt-4 text-3xl font-bold tabular text-slate-900">
                {dept.studentCount}
                <span className="ml-1.5 text-sm font-medium text-slate-500">students</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${((dept.studentCount || 0) / maxStudents) * 100}%` }} />
              </div>

              <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> {dept.totalExams ?? 0} exams</span>
                <span className="flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5" /> {dept.totalAttempts ?? 0} attempts</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {detail && <DepartmentDetailModal data={detail} onClose={close} />}
    </>
  );
};

export default StudentData;
