// Detail dialog for one department: summary + every submitted attempt.
// Data: GET /superadmin/department/:dept/results (average / pass rate derived from its results).
import React, { useMemo, useState } from "react";
import { Building2, ClipboardList, FileCheck2, GraduationCap, Inbox, Percent, TrendingUp } from "lucide-react";
import {
  Modal, SearchInput, Pagination, EmptyState, ScoreBadge, PassFailBadge, Avatar,
} from "../ui";
import { formatDateIST } from "../../utils/time";

const PAGE_SIZE = 10;

const Stat = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3.5">
    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
    </p>
    <p className="mt-1 text-xl font-bold tabular text-slate-900">{value}</p>
  </div>
);

const DepartmentDetailModal = ({ data, onClose }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const results = useMemo(() => data?.results || [], [data]);

  const { avg, passRate } = useMemo(() => {
    if (!results.length) return { avg: 0, passRate: 0 };
    const pcts = results.map((r) => Number(r.percentage) || 0);
    return {
      avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
      passRate: Math.round((pcts.filter((p) => p >= 40).length / pcts.length) * 100),
    };
  }, [results]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) =>
      [r.student?.fullName, r.student?.rollNumber, r.exam?.subject]
        .some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [results, search]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Modal
      onClose={onClose}
      size="xl"
      icon={Building2}
      title={`${data.department} department`}
      description="Student performance across all exams in this department"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat icon={GraduationCap} label="Students"      value={data.totalStudents ?? 0} />
        <Stat icon={ClipboardList} label="Exams"         value={data.totalExams ?? 0} />
        <Stat icon={FileCheck2}    label="Attempts"      value={data.totalAttempts ?? 0} />
        <Stat icon={TrendingUp}    label="Average score" value={`${avg}%`} />
        <Stat icon={Percent}       label="Pass rate"     value={`${passRate}%`} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Exam results <span className="font-normal text-slate-500">({filtered.length})</span>
        </h3>
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search student, roll no. or exam"
          className="sm:w-72"
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={results.length ? "No matching results" : "No results yet"}
            description={results.length ? "Try a different search." : "Results appear here once students submit exams."}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Exam</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Result</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r, idx) => (
                    <tr key={r._id || idx}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={r.student?.fullName} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{r.student?.fullName}</p>
                            <p className="font-mono text-xs text-slate-500">Roll {r.student?.rollNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate">{r.exam?.subject}</td>
                      <td className="whitespace-nowrap font-semibold tabular text-slate-900">{r.score} / {r.totalMarks}</td>
                      <td><ScoreBadge percentage={r.percentage} /></td>
                      <td className="font-semibold text-slate-900">{r.grade || "—"}</td>
                      <td><PassFailBadge percentage={r.percentage} /></td>
                      <td className="whitespace-nowrap text-slate-500">{formatDateIST(r.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
          </>
        )}
      </div>
    </Modal>
  );
};

export default DepartmentDetailModal;
