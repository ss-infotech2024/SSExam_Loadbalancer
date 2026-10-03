import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, ScanLine, UserCheck, Copy, ScanFace, Hash, Mail, Phone, Building2, User } from "lucide-react";

import API, {
  scanStudentQR,
  getQRScanCount,
} from "../../services/api";
import {
  PageHeader, Button, Card, CardHeader, Field, Input, Select, StatCard, Alert, EmptyState, Avatar,
} from "../../components/ui";
import { formatDateTimeShortIST } from "../../utils/time";

const QRScanner = () => {
  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  const [examId, setExamId] = useState("");
  const [exams, setExams] = useState([]);
  const [examsFailed, setExamsFailed] = useState(false);

  const [student, setStudent] = useState(null);

  const [isScanning, setIsScanning] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const [counts, setCounts] = useState({
    totalScanned: 0,
    added: 0,
    duplicate: 0,
  });

  // Exams for the picker (same endpoint as the exam list). Manual ID entry remains as a fallback.
  useEffect(() => {
    API.get("/admin/exams")
      .then((res) => setExams(res.data.exams || []))
      .catch(() => setExamsFailed(true));
  }, []);

  // =====================================
  // LOAD COUNT
  // =====================================

  const loadCounts = useCallback(async () => {
    try {
      if (!examId) return;

      const response = await getQRScanCount(examId);

      if (response.data.success) {
        setCounts(response.data.count);
      }
    } catch (error) {
      console.error("Count error:", error);
    }
  }, [examId]);

  // =====================================
  // PROCESS QR
  // =====================================

  const processQRCode = async (qrData) => {
    try {
      setError("");
      setMessage("");

      /*
        QR should contain:  STU001   OR   { "studentId": "STU001" }
      */

      let studentId = qrData;

      // If QR contains JSON
      try {
        const parsedData = JSON.parse(qrData);

        if (parsedData.studentId) {
          studentId = parsedData.studentId;
        }
      } catch {
        // QR contains simple student ID
      }

      studentId = String(studentId).trim();

      if (!studentId) {
        throw new Error("Invalid QR code");
      }

      const response = await scanStudentQR(
        studentId,
        examId
      );

      const data = response.data;

      if (data.duplicate) {
        setStudent(data.student);
        setMessageTone("warning");
        setMessage("Student already scanned for this exam.");
        await loadCounts();
        return;
      }

      if (data.success) {
        setStudent(data.student);
        setMessageTone("success");
        setMessage("Student added for this exam.");
        await loadCounts();
      }
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to process QR code."
      );
    }
  };

  // =====================================
  // START SCANNER
  // =====================================

  const startScanner = async () => {
    if (!examId) {
      setError("Please select an exam first.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const scanner = new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },

        async (decodedText) => {
          if (processingRef.current) {
            return;
          }

          processingRef.current = true;

          await processQRCode(decodedText);

          setTimeout(() => {
            processingRef.current = false;
          }, 1500);
        },

        () => {
          // QR not detected
        }
      );

      setIsScanning(true);
    } catch (error) {
      console.error(error);

      setError(
        "Couldn't start the camera. Allow camera access in your browser and try again."
      );
    }
  };

  // =====================================
  // STOP SCANNER
  // =====================================

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const scanner = scannerRef.current;

        await scanner.stop();

        scanner.clear();

        scannerRef.current = null;
      }
    } catch (error) {
      console.log("Scanner stop error:", error);
    }

    setIsScanning(false);
  };

  // =====================================
  // LOAD COUNT WHEN EXAM CHANGES
  // =====================================

  useEffect(() => {
    if (examId) {
      loadCounts();
    }
  }, [examId, loadCounts]);

  // =====================================
  // CLEANUP
  // =====================================

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {});
      }
    };
  }, []);

  const selectedExam = exams.find((e) => e._id === examId);

  return (
    <>
      <PageHeader
        title="QR attendance"
        description="Scan a student's QR code to add them to an exam."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Scanner column ── */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader title="1. Choose the exam" icon={ScanLine} />
            <div className="card-body">
              {exams.length > 0 && !examsFailed ? (
                <Field label="Exam" required hint={selectedExam ? `Starts ${formatDateTimeShortIST(selectedExam.startTime)} IST` : "Scans are recorded against this exam."}>
                  {(p) => (
                    <Select {...p} value={examId} onChange={(e) => setExamId(e.target.value)} disabled={isScanning}>
                      <option value="">Select an exam</option>
                      {exams.map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.subject}{e.status === "active" ? " · live" : e.status === "upcoming" ? " · upcoming" : ""}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              ) : (
                <Field label="Exam ID" required hint="Copy the exam ID from the exam list.">
                  {(p) => (
                    <Input {...p} type="text" value={examId} onChange={(e) => setExamId(e.target.value)}
                      placeholder="Enter exam ID" disabled={isScanning} className="font-mono" />
                  )}
                </Field>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="2. Scan student QR"
              icon={Camera}
              actions={isScanning && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /> Camera live
                </span>
              )}
            />
            <div className="card-body space-y-4">
              <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                <div id="qr-reader" className="w-full [&_video]:!w-full" />
                {!isScanning && (
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-slate-400">
                    <ScanFace className="h-10 w-10" aria-hidden="true" />
                    <p className="text-sm">Camera preview appears here</p>
                  </div>
                )}
              </div>

              {!isScanning ? (
                <Button icon={Camera} size="lg" fullWidth onClick={startScanner} disabled={!examId}>Start scanner</Button>
              ) : (
                <Button icon={CameraOff} size="lg" variant="danger" fullWidth onClick={stopScanner}>Stop scanner</Button>
              )}

              {error && <Alert tone="danger">{error}</Alert>}
              {message && <Alert tone={messageTone}>{message}</Alert>}
            </div>
          </Card>
        </div>

        {/* ── Results column ── */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Scanned"   value={counts.totalScanned} icon={ScanLine} />
            <StatCard label="Added"     value={counts.added}        icon={UserCheck} tone="success" />
            <StatCard label="Duplicate" value={counts.duplicate}    icon={Copy} tone="warning" />
          </div>

          <Card>
            <CardHeader title="Last scanned student" icon={User} />
            {!student ? (
              <EmptyState icon={ScanFace} title="Nothing scanned yet" description="Student details appear here after each scan." />
            ) : (
              <div className="card-body">
                <div className="mb-4 flex items-center gap-3">
                  <Avatar name={student.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">{student.name}</p>
                    <p className="font-mono text-sm text-slate-500">ID {student.studentId}</p>
                  </div>
                </div>
                <dl className="space-y-2.5 text-sm">
                  {[
                    { icon: Hash,      label: "Student ID", val: student.studentId },
                    { icon: Mail,      label: "Email",      val: student.email || "-" },
                    { icon: Phone,     label: "Mobile",     val: student.mobile || "-" },
                    { icon: Building2, label: "Department", val: student.department || "-" },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      <dt className="w-24 shrink-0 text-slate-500">{label}</dt>
                      <dd className="min-w-0 truncate font-medium text-slate-900">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default QRScanner;
