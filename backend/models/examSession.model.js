// models/examSession.model.js
// Tracks students who are CURRENTLY writing an exam.
// Created by the first heartbeat when the exam starts, refreshed every ~30s,
// deleted on submit. ExamAttempt is only written on submit, so this is the
// only way the admin can see who is live.
import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema({
  examId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  startedAt:  { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
});

examSessionSchema.index({ examId: 1, studentId: 1 }, { unique: true });
examSessionSchema.index({ department: 1, lastSeenAt: -1 });
// Stale sessions (tab closed, never submitted) clean themselves up after 1 day
examSessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

const ExamSession = mongoose.model('ExamSession', examSessionSchema);

export default ExamSession;
