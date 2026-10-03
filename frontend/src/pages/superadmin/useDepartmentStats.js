import { useCallback, useEffect, useState } from "react";
import API from "@/services/api";

/** GET /superadmin/department-stats — shared by the overview, students and results screens. */
export const useDepartmentStats = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State is only written after the request settles, so this is safe to call from an effect.
  const fetchStats = useCallback(async () => {
    try {
      const res = await API.get("/superadmin/department-stats");
      setDepartments(res.data.departments || []);
      setError("");
    } catch (err) {
      console.error("Error fetching department stats:", err);
      setError(err.response?.data?.message || "Failed to load department statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const reload = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  return { departments, loading, error, reload };
};

/** GET /superadmin/department/:dept/results — loaded on demand for the detail dialog. */
export const useDepartmentDetail = () => {
  const [detail, setDetail] = useState(null);
  const [loadingDept, setLoadingDept] = useState(null);
  const [detailError, setDetailError] = useState("");

  const open = useCallback(async (deptName) => {
    setLoadingDept(deptName);
    setDetailError("");
    try {
      const res = await API.get(`/superadmin/department/${deptName}/results`);
      setDetail(res.data);
    } catch (err) {
      console.error("Error fetching department details:", err);
      setDetailError(err.response?.data?.message || `Failed to load details for ${deptName}.`);
    } finally {
      setLoadingDept(null);
    }
  }, []);

  const close = useCallback(() => setDetail(null), []);

  return { detail, loadingDept, detailError, open, close, clearError: () => setDetailError("") };
};
