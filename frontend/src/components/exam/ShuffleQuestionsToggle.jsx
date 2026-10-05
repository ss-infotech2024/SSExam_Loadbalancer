// components/exam/ShuffleQuestionsToggle.jsx
// Admin ON/OFF switch for per-student question shuffling (used by CreateExam + EditExam).
import React from "react";
import { Shuffle, ListOrdered } from "lucide-react";
import { Switch } from "../ui/Field";
import { cn } from "../../utils/cn";

const ShuffleQuestionsToggle = ({ enabled, onChange }) => (
  <div
    className={cn(
      "flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors",
      enabled ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50"
    )}
  >
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
        )}
      >
        {enabled ? <Shuffle className="h-[18px] w-[18px]" /> : <ListOrdered className="h-[18px] w-[18px]" />}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">
          Shuffle questions <span className={enabled ? "text-emerald-700" : "text-slate-500"}>· {enabled ? "On" : "Off"}</span>
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
          {enabled
            ? "Each student gets the questions in a different order. The order stays the same if they reload."
            : "Every student sees the questions in the order you added them."}
        </p>
      </div>
    </div>
    <Switch checked={enabled} onChange={onChange} label="Shuffle questions" />
  </div>
);

export default ShuffleQuestionsToggle;
