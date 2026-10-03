// components/layout/AppShell.jsx
// One layout for every role: collapsible sidebar on desktop, drawer on mobile, sticky top bar.
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ChevronsLeft, ChevronsRight, LogOut, Menu, X } from "lucide-react";
import { logout } from "../../store/slices/authSlice";
import { Avatar } from "../ui/Avatar";
import { cn } from "../../utils/cn";

const isItemActive = (item, pathname) => {
  const prefixes = item.match || [item.to];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
};

const Brand = ({ collapsed, roleLabel, to }) => (
  <Link to={to} className="flex min-w-0 items-center gap-3" aria-label="SS Exam Portal — home">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
      <img src="/logo.jpg" alt="" className="h-full w-full object-contain p-0.5" />
    </span>
    {!collapsed && (
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-bold text-slate-900">SS Exam Portal</span>
        <span className="block truncate text-[11px] font-medium text-brand-700">{roleLabel}</span>
      </span>
    )}
  </Link>
);

const NavList = ({ nav, collapsed, pathname, onNavigate }) => (
  <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin" aria-label="Main">
    {nav.map((group) => (
      <div key={group.label}>
        {!collapsed && (
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
        )}
        <ul className="space-y-0.5">
          {group.items.map((item) => {
            const active = isItemActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                    collapsed ? "h-10 justify-center" : "px-3 py-2",
                    active
                      ? "bg-brand-50 text-brand-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {active && <span className="absolute -left-3 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-600" aria-hidden="true" />}
                  <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")} aria-hidden="true" />
                  {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);

const UserBlock = ({ user, collapsed, onLogout }) => (
  <div className="border-t border-slate-200 p-3">
    {!collapsed && (
      <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-1.5">
        <Avatar name={user.name} size="sm" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
          {user.meta && <p className="truncate text-xs text-slate-500">{user.meta}</p>}
        </div>
      </div>
    )}
    <button
      type="button"
      onClick={onLogout}
      title={collapsed ? "Sign out" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700",
        collapsed ? "h-10 justify-center" : "px-3 py-2"
      )}
    >
      <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      {collapsed ? <span className="sr-only">Sign out</span> : "Sign out"}
    </button>
  </div>
);

/**
 * @param nav        navigation groups (see navConfig.js)
 * @param roleLabel  e.g. "Admin · MCA"
 * @param user       { name, meta }
 * @param title      optional override for the top-bar title
 * @param topbarRight optional content at the right of the top bar
 */
const AppShell = ({ nav, roleLabel, user, title, topbarRight, children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer with Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const handleLogout = () => {
    dispatch(logout()); // clears redux auth + localStorage
    navigate("/");
  };

  const currentItem = nav.flatMap((g) => g.items).find((i) => isItemActive(i, pathname));
  const pageTitle = title || currentItem?.label || "SS Exam Portal";
  const homePath = nav[0]?.items[0]?.to || "/";

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-white transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-slate-200", collapsed ? "justify-center px-2" : "justify-between px-4")}>
          <Brand collapsed={collapsed} roleLabel={roleLabel} to={homePath} />
        </div>
        <NavList nav={nav} collapsed={collapsed} pathname={pathname} />
        <div className={cn("px-3 pb-1", collapsed && "flex justify-center")}>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 items-center gap-2 rounded-md px-2 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
          </button>
        </div>
        <UserBlock user={user} collapsed={collapsed} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="relative flex h-full w-72 max-w-[85vw] animate-slide-in-left flex-col bg-white shadow-pop">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <Brand roleLabel={roleLabel} to={homePath} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList nav={nav} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <UserBlock user={user} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="-ml-1.5 flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{pageTitle}</p>
          <div className="flex items-center gap-3">
            {topbarRight}
            <span className="hidden items-center gap-2 sm:flex lg:hidden">
              <Avatar name={user.name} size="sm" />
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
