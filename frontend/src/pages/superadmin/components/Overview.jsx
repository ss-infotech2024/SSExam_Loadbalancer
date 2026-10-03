// pages/superadmin/components/Overview.jsx
// System-wide snapshot built only from existing endpoints:
//   GET /superadmin/admins           (via Redux fetchAdmins)
//   GET /superadmin/department-stats
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight, Building2, ClipboardList, FileCheck2, GraduationCap, Percent, RefreshCw, ShieldCheck,
} from "lucide-react";
import { fetchAdmins } from "../../../store/slices/adminSlices";
import { useDepartmentStats } from "../useDepartmentStats";
import {
  PageHeader, Button, StatCard, Card, CardHeader, Badge, Avatar, EmptyState, ErrorState, Skeleton,
} from "../../../components/ui";

// Single-measure horizontal bars: one hue, value labelled in ink, title tooltip on hover.
const BarList = ({ rows, valueKey, format = (v) => v }) => {
  const max = Math.max(1, ...rows.map((r) => r[valueKey] || 0));
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.department} title={`${r.department}: ${format(r[valueKey] || 0)}`}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">{r.department}</span>
            <span className="font-semibold tabular text-slate-900">{format(r[valueKey] || 0)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500 transition-[width] duration-500" style={{ width: `${((r[valueKey] || 0) / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

// Passed vs failed attempts per department — stacked, 2px gap, legend + counts in text.
const PassFailBars = ({ rows }) => (
  <>
    <div className="mb-4 flex gap-4 text-xs text-slate-600">
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Passed (≥ 40%)</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />Failed</span>
    </div>
    <ul className="space-y-3.5">
      {rows.map((r) => {
        const total = r.totalAttempts || 0;
        const pass = r.passCount || 0;
        const fail = r.failCount ?? Math.max(0, total - pass);
        return (
          <li key={r.department}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-700">{r.department}</span>
              <span className="tabular text-slate-500">
                <span className="font-semibold text-slate-900">{pass}</span> / {total} passed
              </span>
            </div>
            {total === 0 ? (
              <div className="h-2 rounded-full bg-slate-100" title="No attempts yet" />
            ) : (
              <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
                {pass > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(pass / total) * 100}%` }} title={`${pass} passed`} />}
                {fail > 0 && <div className="h-full bg-rose-400" style={{ width: `${(fail / total) * 100}%` }} title={`${fail} failed`} />}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  </>
);

const Overview = () => {
  const dispatch = useDispatch();
  const { list: admins, loading: adminsLoading } = useSelector((s) => s.admins);
  const { departments, loading, error, reload } = useDepartmentStats();

  useEffect(() => { dispatch(fetchAdmins()); }, [dispatch]);

  const sum = (k) => departments.reduce((s, d) => s + (d[k] || 0), 0);
  const totalAttempts = sum("totalAttempts");
  const totalPassed = sum("passCount");
  const overallPassRate = totalAttempts ? Math.round((totalPassed / totalAttempts) * 100) : 0;
  const activeAdmins = admins.filter((a) => a.status === "active").length;

  const refresh = () => { reload(); dispatch(fetchAdmins()); };

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="System-wide overview across all departments."
        actions={<Button variant="secondary" icon={RefreshCw} onClick={refresh} loading={loading}>Refresh</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Admins"   value={admins.length} hint={`${activeAdmins} active`} icon={ShieldCheck} loading={adminsLoading && !admins.length} />
        <StatCard label="Students" value={sum("studentCount")} icon={GraduationCap} tone="info" loading={loading} />
        <StatCard label="Exams"    value={sum("totalExams")}   icon={ClipboardList} tone="neutral" loading={loading} />
        <StatCard label="Attempts" value={totalAttempts}       icon={FileCheck2} tone="neutral" loading={loading} />
        <StatCard label="Overall pass rate" value={`${overallPassRate}%`} hint={`${totalPassed} / ${totalAttempts} passed`} icon={Percent} tone="success" loading={loading} />
      </div>

      {error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Departments"
              description="Students enrolled and exam outcomes"
              icon={Building2}
              actions={<Link to="/superadmin/departments" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Results <ArrowRight className="h-4 w-4" /></Link>}
            />
            <div className="card-body">
              {loading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}</div>
              ) : departments.length === 0 ? (
                <EmptyState icon={Building2} title="No departments yet" />
              ) : (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <section aria-label="Students per department">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">Students per department</h3>
                    <BarList rows={departments} valueKey="studentCount" />
                  </section>
                  <section aria-label="Pass and fail per department">
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">Exam outcomes</h3>
                    <PassFailBars rows={departments} />
                  </section>
                </div>
              )}
            </div>
            {!loading && departments.length > 0 && (
              <div className="table-wrap border-t border-slate-100">
                <table className="table">
                  <thead>
                    <tr><th>Department</th><th>Students</th><th>Exams</th><th>Attempts</th><th>Avg score</th><th>Pass rate</th></tr>
                  </thead>
                  <tbody>
                    {departments.map((d) => (
                      <tr key={d.department}>
                        <td className="font-medium text-slate-900">{d.department}</td>
                        <td className="tabular">{d.studentCount}</td>
                        <td className="tabular">{d.totalExams}</td>
                        <td className="tabular">{d.totalAttempts}</td>
                        <td className="tabular">{d.averageScore}%</td>
                        <td className="tabular">{d.passRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Admins"
              icon={ShieldCheck}
              actions={<Link to="/superadmin/admins" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Manage <ArrowRight className="h-4 w-4" /></Link>}
            />
            {adminsLoading && !admins.length ? (
              <div className="space-y-3 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : admins.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="No admins yet" description="Create an admin for each department." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {admins.slice(0, 6).map((a) => (
                  <li key={a._id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={a.email} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{a.email}</p>
                      <p className="text-xs text-slate-500">{a.department || "No department"}</p>
                    </div>
                    <Badge tone={a.status === "active" ? "success" : "neutral"} dot>{a.status === "active" ? "Active" : "Inactive"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default Overview;
