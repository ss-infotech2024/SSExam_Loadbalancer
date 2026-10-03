// components/student/StudentLayout.jsx
// Shared layout for student pages (Dashboard, Results) — built on the common AppShell.
import React from "react";
import AppShell from "../layout/AppShell";
import { STUDENT_NAV } from "../layout/navConfig";
import { Badge } from "../ui/Badge";

export const StudentLayout = ({ children }) => {
  const studentName = localStorage.getItem("studentName") || "Student";
  const studentDept = localStorage.getItem("studentDept") || "";
  const studentId   = localStorage.getItem("studentId")   || "";

  return (
    <AppShell
      nav={STUDENT_NAV}
      roleLabel="Student"
      user={{ name: studentName, meta: [studentId && `ID ${studentId}`, studentDept].filter(Boolean).join(" · ") }}
      topbarRight={studentDept && <Badge tone="brand" className="hidden sm:inline-flex">{studentDept}</Badge>}
    >
      {children}
    </AppShell>
  );
};
