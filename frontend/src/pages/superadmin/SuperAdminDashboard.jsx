// pages/superadmin/SuperAdminDashboard.jsx
// The active section comes from the URL (/superadmin/<section>), so refresh and deep links work.
import React from "react";
import { useLocation } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { SUPERADMIN_NAV } from "../../components/layout/navConfig";
import Overview from "./components/Overview";
import AdminManagement from "./components/AdminManagement";
import StudentData from "./components/StudentData";
import DepartmentResults from "./components/DepartmentResults";

const SECTIONS = {
  dashboard:   Overview,
  admins:      AdminManagement,
  students:    StudentData,
  departments: DepartmentResults,
};

const SuperAdminDashboard = () => {
  const { pathname } = useLocation();
  const section = pathname.split("/")[2];
  const Content = SECTIONS[section] || Overview;

  return (
    <AppShell
      nav={SUPERADMIN_NAV}
      roleLabel="Super admin"
      user={{ name: "Super Admin", meta: "All departments" }}
      title={SECTIONS[section] ? undefined : "Dashboard"}
    >
      <Content />
    </AppShell>
  );
};

export default SuperAdminDashboard;
