import axios from "axios";

// 🔹 Backend URL comes from VITE_API_URL (frontend/.env locally, Vercel env vars in production)
if (!import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL is not set — API requests will go to the frontend origin.");
}

// Create Axios instance
// No default Content-Type: axios sets application/json for plain objects automatically,
// and a forced JSON header would make axios serialize FormData uploads as JSON.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// 🔐 Automatically attach token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ❌ Handle global response errors (like 401 unauthorized)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

// ==========================================
// QR SCANNER APIs
// ==========================================

// 🔍 Scan Student QR
export const scanStudentQR = (studentId, examId) => {
  return API.post("/admin/qr-scanner/scan", {
    studentId,
    examId,
  });
};

// 📊 Get QR Scan Count
export const getQRScanCount = (examId) => {
  return API.get("/admin/qr-scanner/count", {
    params: {
      examId,
    },
  });
};

// 📋 Get All QR Scans
export const getQRScans = (examId) => {
  return API.get("/admin/qr-scanner/scans", {
    params: {
      examId,
    },
  });
};

// ==========================================
// STUDENT REGISTRATION QR
// ==========================================

export const generateRegistrationQR = () => {
  return API.post("/student-registration/generate");
};

export const getRegistrationQR = (token) => {
  return API.get(`/student-registration/${token}`);
};

export const registerStudentFromQR = (token, studentData) => {
  return API.post(
    `/student-registration/${token}/register`,
    studentData
  );
};

export default API;