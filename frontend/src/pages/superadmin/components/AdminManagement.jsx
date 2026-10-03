// pages/superadmin/components/AdminManagement.jsx

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdmins, createAdmin, updateAdmin,
  deleteAdmin as deleteAdminThunk,
  toggleAdminStatus, clearActionError,
} from "../../../store/slices/adminSlices";
import {
  Download, Eye, Pencil, Trash2, Plus, UserPlus, ShieldCheck, ShieldOff, RefreshCw, Mail, Building2, Lock, Users,
  CheckCircle2, XCircle, FilterX,
} from "lucide-react";
import {
  PageHeader, Button, IconButton, StatCard, Card, SearchInput, Select, Field, Input, PasswordInput,
  Modal, ConfirmDialog, Alert, Badge, Avatar, EmptyState, ErrorState, Skeleton, Pagination, useToast,
} from "../../../components/ui";
import { formatDateIST } from "../../../utils/time";

const DEPARTMENTS = ['Data Bricks', 'Service Now', 'MCA'];

const StatusBadge = ({ status }) =>
  status === "active"
    ? <Badge tone="success" icon={CheckCircle2}>Active</Badge>
    : <Badge tone="neutral" icon={XCircle}>Inactive</Badge>;

// ─── ADD / EDIT MODAL ──────────────────────────────────────────────────────────
const AdminFormModal = ({ editAdmin, onClose, onSaved }) => {
  const dispatch = useDispatch();
  const { loading, actionError } = useSelector(s => s.admins);
  const isEdit = !!editAdmin;

  const [form, setForm] = useState({
    email:           editAdmin?.email      || "",
    department:      editAdmin?.department || "",
    password:        "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => () => dispatch(clearActionError()), [dispatch]);

  const validate = () => {
    const e = {};
    if (!form.email.trim())                                     e.email           = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))                 e.email           = "Invalid email";
    if (!form.department)                                       e.department      = "Department is required";
    if (!isEdit && !form.password)                              e.password        = "Password is required";
    if (!isEdit && form.password && form.password.length < 6)  e.password        = "Min 6 characters";
    if (!isEdit && form.password !== form.confirmPassword)      e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const body = { email: form.email.trim(), department: form.department };
    if (!isEdit || form.password) body.password = form.password;

    if (isEdit) {
      const res = await dispatch(updateAdmin({ id: editAdmin._id, body }));
      if (res.meta.requestStatus === "fulfilled") onSaved("updated");
    } else {
      const res = await dispatch(createAdmin(body));
      if (res.meta.requestStatus === "fulfilled") onSaved("created");
    }
  };

  return (
    <Modal
      onClose={onClose}
      dismissible={!loading}
      icon={isEdit ? Pencil : UserPlus}
      title={isEdit ? "Edit admin" : "Add admin"}
      description={isEdit ? editAdmin.email : "Admins manage students and exams for one department."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="admin-form" loading={loading} icon={isEdit ? undefined : UserPlus}>
            {isEdit ? (loading ? "Saving…" : "Save changes") : (loading ? "Creating…" : "Create admin")}
          </Button>
        </>
      }
    >
      <form id="admin-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {actionError && <Alert tone="danger">{actionError}</Alert>}

        <Field label="Email address" required error={errors.email}>
          {(p) => (
            <Input {...p} icon={Mail} type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="admin@example.com" disabled={loading} autoComplete="off" />
          )}
        </Field>

        <Field label="Department" required error={errors.department}>
          {(p) => (
            <Select {...p} name="department" value={form.department} onChange={handleChange} disabled={loading}>
              <option value="">Select a department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={isEdit ? "New password" : "Password"}
            required={!isEdit}
            error={errors.password}
            hint={isEdit ? "Leave blank to keep the current password" : "At least 6 characters"}
          >
            {(p) => (
              <PasswordInput {...p} icon={Lock} name="password" value={form.password} onChange={handleChange}
                placeholder="••••••••" disabled={loading} autoComplete="new-password" />
            )}
          </Field>
          {!isEdit && (
            <Field label="Confirm password" required error={errors.confirmPassword}>
              {(p) => (
                <PasswordInput {...p} icon={Lock} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                  placeholder="••••••••" disabled={loading} autoComplete="new-password" />
              )}
            </Field>
          )}
        </div>

        <Alert tone="brand">One admin per department. The admin can only manage students and exams in the assigned department.</Alert>
      </form>
    </Modal>
  );
};

// ─── VIEW MODAL ────────────────────────────────────────────────────────────────
const ViewModal = ({ admin, onClose, onEdit }) => (
  <Modal
    onClose={onClose}
    title="Admin details"
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button icon={Pencil} onClick={() => { onClose(); onEdit(admin); }}>Edit admin</Button>
      </>
    }
  >
    <div className="flex items-center gap-4">
      <Avatar name={admin.name || admin.email} size="lg" />
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-slate-900">{admin.name || "—"}</p>
        <p className="truncate text-sm text-slate-500">{admin.email}</p>
        <div className="mt-1.5"><StatusBadge status={admin.status} /></div>
      </div>
    </div>
    <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        { label: "Department", val: admin.department || "—" },
        { label: "Joined",     val: admin.joinDate ? formatDateIST(admin.joinDate) : "—" },
        { label: "Admin ID",   val: admin._id ? admin._id.toString().slice(-8).toUpperCase() : "—", mono: true },
      ].map(({ label, val, mono }) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className={`mt-0.5 text-sm font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>{val}</dd>
        </div>
      ))}
    </dl>
  </Modal>
);

// ─── DELETE MODAL ──────────────────────────────────────────────────────────────
const DeleteModal = ({ admin, onClose, onDeleted }) => {
  const dispatch = useDispatch();
  const { loading, actionError } = useSelector(s => s.admins);

  useEffect(() => () => dispatch(clearActionError()), [dispatch]);

  const confirm = async () => {
    const res = await dispatch(deleteAdminThunk(admin._id));
    if (res.meta.requestStatus === "fulfilled") onDeleted();
  };

  return (
    <ConfirmDialog
      title="Delete admin?"
      message={<>This permanently removes <strong className="text-slate-900">{admin.name || admin.email}</strong>. This action cannot be undone.</>}
      confirmLabel={loading ? "Deleting…" : "Delete admin"}
      loading={loading}
      error={actionError}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const AdminManagement = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { list: admins, loading, error } = useSelector(s => s.admins);

  const [addOpen,      setAddOpen]    = useState(false);
  const [editAdmin,    setEditAdmin]  = useState(null);
  const [viewAdmin,    setViewAdmin]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingId,   setTogglingId] = useState(null);
  const [search,       setSearch]     = useState("");
  const [deptFilter,   setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,         setPage]       = useState(1);

  const PER_PAGE = 8;

  useEffect(() => {
    dispatch(fetchAdmins());
  }, [dispatch]);

  const handleSaved = (action) => {
    setAddOpen(false);
    setEditAdmin(null);
    toast(action === "created" ? "Admin created successfully." : "Admin updated successfully.");
  };

  const handleDeleted = () => {
    setDeleteTarget(null);
    toast("Admin deleted.");
  };

  const handleToggleStatus = async (admin) => {
    const newStatus = admin.status === "active" ? "inactive" : "active";
    setTogglingId(admin._id);
    const res = await dispatch(toggleAdminStatus({ id: admin._id, status: newStatus }));
    setTogglingId(null);
    if (res.meta.requestStatus === "fulfilled") {
      toast(`Admin marked as ${newStatus}.`);
    } else {
      toast(res.payload || "Failed to update status.", "error");
    }
  };

  // Filter + Paginate
  const filtered = admins.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || (a.name || "").toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchDept   = deptFilter === "all" || a.department === deptFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const pageItems  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasFilters = search || deptFilter !== "all" || statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setDeptFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const exportCsv = () => {
    const csv = [
      ["Email", "Department", "Status", "Join Date"],
      ...filtered.map(a => [a.email, a.department, a.status, a.joinDate])
    ].map(r => r.join(",")).join("\n");

    const el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    el.download = "admins.csv";
    el.click();
  };

  const activeCount = admins.filter(a => a.status === "active").length;
  const deptCount   = new Set(admins.map(a => a.department).filter(Boolean)).size;
  const initialLoad = loading && admins.length === 0;

  return (
    <>
      <PageHeader
        title="Admins"
        description="Create and manage department administrators."
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh" variant="secondary" loading={loading} onClick={() => dispatch(fetchAdmins())} />
            <Button icon={Plus} onClick={() => setAddOpen(true)}>Add admin</Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total admins"  value={admins.length} icon={Users}       loading={initialLoad} />
        <StatCard label="Active"        value={activeCount}   icon={ShieldCheck} tone="success" loading={initialLoad} />
        <StatCard label="Departments covered" value={`${deptCount} / ${DEPARTMENTS.length}`} icon={Building2} tone="info" loading={initialLoad} />
      </div>

      <Card>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by name or email"
            className="lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }} aria-label="Filter by department" className="sm:w-48">
              <option value="all">All departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filter by status" className="sm:w-40">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div className="flex gap-2">
            {hasFilters && <Button variant="ghost" icon={FilterX} onClick={resetFilters}>Clear</Button>}
            <Button variant="secondary" icon={Download} onClick={exportCsv} disabled={!filtered.length}>Export CSV</Button>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => dispatch(fetchAdmins())} />
        ) : initialLoad ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No admins found"
            description={hasFilters ? "Try different filters." : "Add an admin to get started."}
            action={hasFilters
              ? <Button variant="secondary" onClick={resetFilters}>Clear filters</Button>
              : <Button icon={Plus} onClick={() => setAddOpen(true)}>Add admin</Button>}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="table-wrap hidden md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>Admin</th>
                    <th>Department</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(admin => (
                    <tr key={admin._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={admin.name || admin.email} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{admin.name || "—"}</p>
                            <p className="truncate text-xs text-slate-500">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><Badge tone="brand">{admin.department || "—"}</Badge></td>
                      <td className="whitespace-nowrap text-slate-500">{admin.joinDate ? formatDateIST(admin.joinDate) : "—"}</td>
                      <td><StatusBadge status={admin.status} /></td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <IconButton icon={Eye} label="View details" size="sm" onClick={() => setViewAdmin(admin)} />
                          <IconButton icon={Pencil} label="Edit admin" size="sm" onClick={() => setEditAdmin(admin)} />
                          <IconButton
                            icon={admin.status === "active" ? ShieldOff : ShieldCheck}
                            label={admin.status === "active" ? "Deactivate" : "Activate"}
                            size="sm"
                            loading={togglingId === admin._id}
                            onClick={() => handleToggleStatus(admin)}
                          />
                          <IconButton icon={Trash2} label="Delete admin" size="sm" variant="danger-ghost" onClick={() => setDeleteTarget(admin)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {pageItems.map(admin => (
                <li key={admin._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={admin.name || admin.email} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{admin.email}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge tone="brand">{admin.department || "—"}</Badge>
                        <StatusBadge status={admin.status} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" icon={Eye} onClick={() => setViewAdmin(admin)}>View</Button>
                    <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditAdmin(admin)}>Edit</Button>
                    <Button size="sm" variant="secondary" loading={togglingId === admin._id} onClick={() => handleToggleStatus(admin)}>
                      {admin.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={() => setDeleteTarget(admin)}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>

            <Pagination page={page} pageSize={PER_PAGE} total={filtered.length} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Modals */}
      {addOpen && <AdminFormModal editAdmin={null} onClose={() => setAddOpen(false)} onSaved={handleSaved} />}
      {editAdmin && <AdminFormModal editAdmin={editAdmin} onClose={() => setEditAdmin(null)} onSaved={handleSaved} />}
      {viewAdmin && <ViewModal admin={viewAdmin} onClose={() => setViewAdmin(null)} onEdit={setEditAdmin} />}
      {deleteTarget && <DeleteModal admin={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}
    </>
  );
};

export default AdminManagement;
