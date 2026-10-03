import React, { useState } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Copy, RefreshCw, Link2, Smartphone, UserPlus, ShieldCheck } from "lucide-react";

import { generateRegistrationQR } from "../../services/api";
import { PageHeader, Button, Card, CardHeader, Alert, EmptyState, useToast } from "../../components/ui";

const StudentRegistrationQR = () => {
  const toast = useToast();
  const [qrImage, setQrImage] = useState("");
  const [registrationURL, setRegistrationURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await generateRegistrationQR();
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message);
      }

      const url = data.registrationURL;

      const qrDataURL = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
      });

      setQrImage(qrDataURL);
      setRegistrationURL(url);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate QR"
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrImage) return;

    const link = document.createElement("a");

    link.href = qrImage;
    link.download = "student-registration-qr.png";

    link.click();
  };

  const copyURL = async () => {
    try {
      await navigator.clipboard.writeText(registrationURL);
      toast("Registration link copied.");
    } catch {
      toast("Couldn't copy — select the link and copy it manually.", "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Registration QR"
        description="Generate a QR code that lets new students register themselves into your department."
        actions={
          <Button icon={qrImage ? RefreshCw : QrCode} onClick={handleGenerateQR} loading={loading}>
            {loading ? "Generating…" : qrImage ? "Generate new QR" : "Generate QR"}
          </Button>
        }
      />

      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Scan to register" icon={QrCode} />
          {!qrImage ? (
            <EmptyState
              icon={QrCode}
              title="No QR code yet"
              description="Generate a QR code, then display or print it for students."
              action={<Button icon={QrCode} onClick={handleGenerateQR} loading={loading}>Generate QR</Button>}
            />
          ) : (
            <div className="card-body flex flex-col items-center">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                <img src={qrImage} alt="Student registration QR code" className="h-64 w-64 sm:h-80 sm:w-80" />
              </div>

              <div className="mt-6 w-full max-w-lg">
                <p className="label flex items-center gap-1.5"><Link2 className="h-4 w-4 text-slate-400" /> Registration link</p>
                <div className="flex gap-2">
                  <p className="input min-w-0 flex-1 truncate font-mono text-xs leading-5" title={registrationURL}>{registrationURL}</p>
                  <Button variant="secondary" icon={Copy} onClick={copyURL}>Copy</Button>
                </div>
              </div>

              <Button icon={Download} variant="success" className="mt-5" onClick={downloadQR}>Download QR (.png)</Button>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 lg:self-start">
          <CardHeader title="How students register" icon={UserPlus} />
          <ol className="card-body space-y-4">
            {[
              { icon: Smartphone,  title: "Scan the code",       text: "Students scan the QR with their phone camera, or open the link." },
              { icon: UserPlus,    title: "Fill in their details", text: "Name, email, mobile, college, roll number and a strong password." },
              { icon: ShieldCheck, title: "Get a student ID",     text: "An ID is assigned on submit and they can sign in straight away." },
            ].map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{i + 1}. {title}</p>
                  <p className="text-sm text-slate-500">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
};

export default StudentRegistrationQR;
