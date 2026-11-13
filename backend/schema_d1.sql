-- StudySnap Cloudflare D1 (SQLite) Schema
-- Áp dụng tự động qua functions/api.js hoặc thủ công bằng:
--   wrangler d1 execute <TEN_DB> --remote --file=backend/schema_d1.sql

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teachers (
  teacher_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS classes (
  class_id TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS students (
  student_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  class_name TEXT NOT NULL DEFAULT '',
  avatar_initials TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS assignments (
  assignment_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lesson_tag TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  require_media TEXT NOT NULL DEFAULT 'audio_or_video',
  session_tag TEXT NOT NULL DEFAULT 'Buổi 1',
  class_name TEXT NOT NULL DEFAULT 'all',
  exercise_id TEXT NOT NULL DEFAULT '',
  lesson_id TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS submissions (
  submission_id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT '',
  student_note TEXT NOT NULL DEFAULT '',
  media_type TEXT NOT NULL DEFAULT 'audio',
  media_url TEXT NOT NULL DEFAULT '',
  media_duration TEXT NOT NULL DEFAULT '01:00',
  status TEXT NOT NULL DEFAULT 'submitted',
  score TEXT NOT NULL DEFAULT '',
  teacher_comment TEXT NOT NULL DEFAULT '',
  teacher_voice_url TEXT NOT NULL DEFAULT '',
  teacher_voice_duration TEXT NOT NULL DEFAULT '',
  graded_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS exit_tickets (
  record_id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL DEFAULT '',
  score REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  submitted_at TEXT NOT NULL DEFAULT '',
  answers_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS vocabulary (
  vocab_id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  lesson_title TEXT NOT NULL DEFAULT '',
  word TEXT NOT NULL,
  ipa TEXT NOT NULL DEFAULT '',
  part_of_speech TEXT NOT NULL DEFAULT '',
  meaning_vi TEXT NOT NULL DEFAULT '',
  example_en TEXT NOT NULL DEFAULT '',
  example_vi TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS practice_exercises (
  exercise_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lesson_tag TEXT NOT NULL DEFAULT '',
  total_score REAL NOT NULL DEFAULT 35,
  thresholds_json TEXT NOT NULL DEFAULT '{"very_good":31,"good":25}',
  sections_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS practice_submissions (
  submission_id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL DEFAULT '',
  total_score REAL NOT NULL DEFAULT 0,
  max_score REAL NOT NULL DEFAULT 35,
  rating TEXT NOT NULL DEFAULT '',
  submitted_at TEXT NOT NULL DEFAULT '',
  section_scores_json TEXT NOT NULL DEFAULT '{}',
  answers_json TEXT NOT NULL DEFAULT '{}',
  manual_grades_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted'
);

CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
CREATE INDEX IF NOT EXISTS idx_assignments_exercise ON assignments(exercise_id);
CREATE INDEX IF NOT EXISTS idx_submissions_asg_stu ON submissions(assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_stu ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exit_tickets_stu ON exit_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson ON vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_practice_subs_ex_stu ON practice_submissions(exercise_id, student_id);
CREATE INDEX IF NOT EXISTS idx_practice_subs_stu ON practice_submissions(student_id);

