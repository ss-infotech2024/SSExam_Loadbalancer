// components/exam/ExamDetailsFields.jsx
// Subject / duration / schedule inputs shared by Create Exam and Edit Exam.
// Values are datetime-local strings interpreted as IST (see utils/time).
import React from "react";
import { BookOpen, Clock, CalendarCheck } from "lucide-react";
import { Field, Input } from "../ui";
import { formatIST, localToIST_ISO } from "../../utils/time";

const SchedulePreview = ({ value }) =>
  value ? (
    <span className="flex items-center gap-1 text-brand-700">
      <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" /> Saved as {formatIST(localToIST_ISO(value))}
    </span>
  ) : "Enter the time in IST (Asia/Kolkata)";

const ExamDetailsFields = ({ examData, errors, onChange }) => (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
    <Field label="Subject / paper name" required error={errors.subject} className="md:col-span-2">
      {(p) => (
        <Input {...p} icon={BookOpen} type="text" name="subject" value={examData.subject} onChange={onChange}
          placeholder="e.g. Data Structures and Algorithms" />
      )}
    </Field>

    <Field label="Duration" required error={errors.duration} hint="In minutes. The timer starts when the student begins.">
      {(p) => (
        <Input {...p} icon={Clock} type="number" name="duration" min="1" inputMode="numeric"
          value={examData.duration} onChange={onChange} placeholder="e.g. 60" />
      )}
    </Field>

    <div className="hidden md:block" aria-hidden="true" />

    <Field label="Opens at (IST)" required error={errors.startTime} hint={<SchedulePreview value={examData.startTime} />}>
      {(p) => <Input {...p} type="datetime-local" name="startTime" value={examData.startTime} onChange={onChange} />}
    </Field>

    <Field label="Closes at (IST)" required error={errors.endTime} hint={<SchedulePreview value={examData.endTime} />}>
      {(p) => <Input {...p} type="datetime-local" name="endTime" value={examData.endTime} onChange={onChange} />}
    </Field>
  </div>
);

export default ExamDetailsFields;
