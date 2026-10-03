// pages/superadmin/components/DepartmentResults.jsx — performance per department
import React, { useState } from "react";
import { BarChart3, Building2, ChevronRight, RefreshCw } from "lucide-react";
import {
  PageHeader, Button, SearchInput, Select, Card, EmptyState, ErrorState, Skeleton, Alert, Spinner, Badge, Pagination,
} from "../../../components/ui";
import DepartmentDetailModal from "../../../components/superadmin/DepartmentDetailModal";
import { useDepartmentStats, useDepartmentDetail } from "../useDepartmentStats";

const ITEMS_PER_PAGE = 6;

const passTone = (rate) => (rate >= 75 ? "success" : rate >= 50 ? "warning" : "danger");

const Metric = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
    <p className="text-[11px] font-medium text-slate-500">{label}</p>
    <p className="text-lg font-bold tabular text-slate-900">{value}</p>
  </div>
);

const DepartmentResults = () => {
  const { departments, loading, error, reload } = useDepartmentStats();
  const { detail, loadingDept, detailError, open, close, clearError } = useDepartmentDetail();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("studentCount");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredDepartments = departments
    .filter((dept) => dept.department.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "studentCount") return b.studentCount - a.studentCount;
      if (sortBy === "averageScore") return b.averageScore - a.averageScore;
      if (sortBy === "passRate") return b.passRate - a.passRate;
      return 0;
    });

  const currentItems = filteredDepartments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <PageHeader
        title="Department results"
        description="Average scores and pass rates across departments (pass mark: 40%)."
        actions={<Button variant="secondary" icon={RefreshCw} onClick={reload} loading={loading}>Refresh</Button>}
      />

      {detailError && (
        <Alert tone="danger" className="mb-4" action={<button className="text-xs font-semibold underline" onClick={clearError}>Dismiss</button>}>
          {detailError}
        </Alert>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={searchTerm}
          onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
          placeholder="Search departments"
          className="flex-1"
        />
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort departments" className="sm:w-56">
          <option value="studentCount">Sort by students</option>
          <option value="averageScore">Sort by average score</option>
          <option value="passRate">Sort by pass rate</option>
        </Select>
      </div>

      {error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-60 rounded-xl" />)}
        </div>
      ) : currentItems.length === 0 ? (
        <Card><EmptyState icon={Building2} title="No departments found" description="No departments match your search." /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currentItems.map((dept) => (
              <button
                key={dept.department}
                type="button"
                onClick={() => open(dept.department)}
                disabled={!!loadingDept}
                className="card group flex flex-col p-5 text-left transition-shadow hover:border-brand-300 hover:shadow-pop disabled:cursor-wait"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Building2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900">{dept.department}</h3>
                      <p className="text-xs text-slate-500">{dept.totalAttempts ?? 0} attempts</p>
                    </div>
                  </div>
                  {loadingDept === dept.department
                    ? <Spinner />
                    : <ChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-brand-600" aria-hidden="true" />}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Metric label="Students" value={dept.studentCount} />
                  <Metric label="Exams" value={dept.totalExams} />
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-medium text-slate-600">Average score</span>
                    <span className="font-semibold tabular text-slate-900">{dept.averageScore}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(dept.averageScore, 100)}%` }} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs font-medium text-slate-600">Pass rate</span>
                  <Badge tone={passTone(dept.passRate)} className="tabular">{dept.passRate}%</Badge>
                </div>
              </button>
            ))}
          </div>
          {filteredDepartments.length > ITEMS_PER_PAGE && (
            <Card className="mt-4">
              <Pagination page={currentPage} pageSize={ITEMS_PER_PAGE} total={filteredDepartments.length} onChange={setCurrentPage} className="border-t-0" />
            </Card>
          )}
        </>
      )}

      {detail && <DepartmentDetailModal data={detail} onClose={close} />}

      {!loading && !error && departments.length > 0 && (
        <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-500">
          <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Select a department to view individual student results.
        </p>
      )}
    </>
  );
};

export default DepartmentResults;
