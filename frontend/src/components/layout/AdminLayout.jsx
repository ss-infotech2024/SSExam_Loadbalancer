import React from "react";
import AppShell from "./AppShell";
import { ADMIN_NAV } from "./navConfig";
import { Badge } from "../ui/Badge";

const AdminLayout = ({ children }) => {
  const dept = localStorage.getItem("adminDepartment") || "";
  return (
    <AppShell
      nav={ADMIN_NAV}
      roleLabel="Department admin"
      user={{ name: "Admin", meta: dept ? `${dept} department` : "Administrator" }}
      topbarRight={dept && <Badge tone="brand" className="hidden sm:inline-flex">{dept}</Badge>}
    >
      {children}
    </AppShell>
  );
};

export default AdminLayout;
