// pages/admin/EditExam.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchExamById, updateExam, clearSelected, clearActionError } from "../../store/slices/examSlices";
import CameraProctoringToggle from "../../components/exam/CameraProctoringToggle";
import ExamDetailsFields from "../../components/exam/ExamDetailsFields";
import QuestionEditorCard from "../../components/exam/QuestionEditorCard";
import { ArrowLeft, Save, Plus, ListPlus, Lock, CalendarClock, ShieldCheck, Building2, Info } from "lucide-react";
import {
  PageHeader, Button, Card, CardHeader, Badge, Alert, EmptyState, ErrorState, LoadingState, useToast,
} from "../../components/ui";
import { isoToLocalInput, localToIST_ISO } from "../../utils/time";

const makeQuestion = () => ({
  _id: null,
  id:            Date.now() + Math.random(),
  text:          "",
  options:       ["", "", "", ""],
  correctAnswer: null,
});

// Map the fetched exam into form state (UTC → IST for the datetime inputs)
const toFormState = (selected) => ({
  examData: {
    subject:   selected.subject,
    duration:  String(selected.duration),
    startTime: isoToLocalInput(selected.startTime),
    endTime:   isoToLocalInput(selected.endTime),
    cameraEnabled: selected.cameraEnabled !== false, // older exams have no field → ON
  },
  marksPerQuestion: selected.marksPerQuestion ?? 1,
  questions: (selected.questions || []).map((q) => ({
    _id:           q._id,
    id:            q._id || Date.now() + Math.random(),
    text:          q.text,
    options:       [...q.options],
    correctAnswer: q.correctAnswer,
  })),
});

// ═════════════════════════════════════════════════════════════════════════════
const EditExam = () => {
  const navigate = useNavigate();
  const { id }   = useParams();
  const dispatch = useDispatch();
  const showToast = useToast();
  const { selected, loading, actionLoading, actionError, error } = useSelector((s) => s.exams);

  useEffect(() => {
    const role  = localStorage.getItem("userRole");
    const dept  = localStorage.getItem("adminDepartment");
    const token = localStorage.getItem("token");
    if (!token || role !== "admin" || !dept) navigate("/");
  }, []); // eslint-disable-line

  const adminDept = localStorage.getItem("adminDepartment") || "";

  const [examData,         setExamData]         = useState({ subject: "", duration: "", startTime: "", endTime: "", cameraEnabled: true });
  const [marksPerQuestion, setMarksPerQuestion] = useState(null); // read-only after fetch
  const [questions,        setQuestions]        = useState([]);
  const [errors,           setErrors]           = useState({});
  const [loadedId,         setLoadedId]         = useState(null);

  const questionRefs = useRef([]);

  useEffect(() => { if (actionError) showToast(actionError, "error"); }, [actionError, showToast]);

  useEffect(() => {
    dispatch(fetchExamById(id));
    return () => {
      dispatch(clearSelected());
      dispatch(clearActionError());
    };
  }, [id, dispatch]);

  // Pre-fill the form once per fetched exam (adjusting state during render instead of in an effect)
  if (selected && selected._id !== loadedId) {
    const s = toFormState(selected);
    setLoadedId(selected._id);
    setExamData(s.examData);
    setMarksPerQuestion(s.marksPerQuestion);
    setQuestions(s.questions);
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setExamData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const addQuestion = () => {
    const q = makeQuestion();
    setQuestions((p) => [...p, q]);
    setTimeout(() => questionRefs.current[questions.length]?.focus(), 80);
  };

  const addTenQuestions = () => {
    setQuestions((p) => [...p, ...Array.from({ length: 10 }, makeQuestion)]);
  };

  const removeQuestion = (lid) => setQuestions((p) => p.filter((q) => q.id !== lid));

  const updateQuestion = (lid, field, value, optIdx = null) => {
    setQuestions((p) =>
      p.map((q) => {
        if (q.id !== lid) return q;
        if (field === "text")          return { ...q, text: value };
        if (field === "option") {
          const opts = [...q.options];
          opts[optIdx] = value;
          return { ...q, options: opts };
        }
        if (field === "correctAnswer") return { ...q, correctAnswer: parseInt(value, 10) };
        return q;
      })
    );
    const key = field === "option" ? `q-${lid}-opt${optIdx}` : `q-${lid}-${field === "correctAnswer" ? "correct" : field}`;
    if (errors[key]) setErrors((p) => { const u = { ...p }; delete u[key]; return u; });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!examData.subject.trim())                              e.subject   = "Subject is required";
    if (!examData.duration || Number(examData.duration) <= 0) e.duration  = "Enter a valid duration";
    if (!examData.startTime)                                   e.startTime = "Start time is required";
    if (!examData.endTime)                                     e.endTime   = "End time is required";
    if (
      examData.startTime &&
      examData.endTime &&
      new Date(examData.endTime) <= new Date(examData.startTime)
    )                                                          e.endTime   = "End time must be after start time";
    questions.forEach((q) => {
      if (!q.text.trim())           e[`q-${q.id}-text`]    = "Question text required";
      q.options.forEach((o, i) => {
        if (!o.trim())              e[`q-${q.id}-opt${i}`] = `Option ${i + 1} required`;
      });
      if (q.correctAnswer === null) e[`q-${q.id}-correct`] = "Select the correct answer";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (questions.length === 0) { showToast("Add at least one question.", "error"); return; }
    if (!validate())            { showToast("Fix the errors before saving.", "error"); return; }

    const payload = {
      subject:   examData.subject.trim(),
      duration:  Number(examData.duration),
      // Convert datetime-local (IST) → UTC ISO string before sending to backend
      startTime: localToIST_ISO(examData.startTime),
      endTime:   localToIST_ISO(examData.endTime),
      // marksPerQuestion intentionally NOT sent — backend ignores it on update
      cameraEnabled: examData.cameraEnabled !== false,
      questions: questions.map((q) => ({
        text:          q.text.trim(),
        options:       q.options.map((o) => o.trim()),
        correctAnswer: q.correctAnswer,
      })),
    };

    const res = await dispatch(updateExam({ id, body: payload }));
    if (res.meta.requestStatus === "fulfilled") {
      showToast("Exam updated successfully!", "success");
      setTimeout(() => navigate("/admin/exams"), 1500);
    }
  };

  const totalMarks = questions.length * (marksPerQuestion ?? 1);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading && !selected) {
    return <Card><LoadingState label="Loading exam…" /></Card>;
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error && !selected) {
    return (
      <Card>
        <ErrorState title="Failed to load exam" message={error} onRetry={() => dispatch(fetchExamById(id))} />
        <div className="-mt-8 flex justify-center pb-10">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate("/admin/exams")}>Back to exams</Button>
        </div>
      </Card>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="Edit exam"
        description={examData.subject || "Loading…"}
        eyebrow={
          <button type="button" onClick={() => navigate("/admin/exams")} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" /> Exams
          </button>
        }
        actions={<Button icon={Save} onClick={handleSave} loading={actionLoading}>{actionLoading ? "Saving…" : "Save changes"}</Button>}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Exam details"
            icon={CalendarClock}
            actions={adminDept && <Badge tone="brand" icon={Building2}>{adminDept}</Badge>}
          />
          <div className="card-body space-y-5">
            <ExamDetailsFields examData={examData} errors={errors} onChange={handleInfoChange} />

            {marksPerQuestion && (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <Lock className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <p className="text-sm text-slate-700">
                  <strong className="text-slate-900">{marksPerQuestion} mark{marksPerQuestion > 1 ? "s" : ""} per question</strong>
                  <span className="text-slate-500"> — set at creation and locked. </span>
                  {questions.length} questions = <strong className="text-slate-900">{totalMarks} marks</strong>
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Proctoring" icon={ShieldCheck} />
          <div className="card-body">
            <CameraProctoringToggle
              enabled={examData.cameraEnabled !== false}
              onChange={(v) => setExamData((p) => ({ ...p, cameraEnabled: v }))}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Questions <span className="font-normal text-slate-500">({questions.length})</span></h2>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" icon={Plus} onClick={addQuestion}>Add question</Button>
              <Button variant="secondary" icon={ListPlus} onClick={addTenQuestions}>Add 10</Button>
            </div>
          </div>

          <Alert tone="info" icon={Info}>Saving replaces the full question set with what you see below.</Alert>

          {questions.length === 0 ? (
            <Card>
              <EmptyState
                icon={ListPlus}
                title="No questions yet"
                action={<Button icon={Plus} onClick={addQuestion}>Add first question</Button>}
              />
            </Card>
          ) : (
            questions.map((q, index) => (
              <QuestionEditorCard
                key={q.id}
                index={index}
                question={q}
                marks={marksPerQuestion}
                errors={errors}
                inputRef={(el) => (questionRefs.current[index] = el)}
                onChange={(field, value, optIdx) => updateQuestion(q.id, field, value, optIdx)}
                onRemove={() => removeQuestion(q.id)}
              />
            ))
          )}

          {/* Sticky action bar */}
          <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="secondary" onClick={() => navigate("/admin/exams")}>Cancel</Button>
              <Button icon={Save} size="lg" onClick={handleSave} loading={actionLoading}>
                {actionLoading ? "Saving…" : `Save changes · ${questions.length} Q · ${totalMarks} marks`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditExam;
