// Create Exam draft persistence (localStorage). Shared by CreateExam and the
// exam list's "Duplicate" action, which seeds a draft and opens Create Exam.
export const DRAFT_KEY = "createExamDraft";

export const loadDraft  = () => { try { const r = localStorage.getItem(DRAFT_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
export const saveDraft  = (d) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ } };
export const clearDraft = ()  => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } };

/** True when a saved draft holds work the admin might not want to lose. */
export const draftHasContent = (d = loadDraft()) =>
  !!(d && (d.examData?.subject || d.questions?.length > 0));
