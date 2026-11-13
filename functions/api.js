/**
 * ============================================================================
 * STUDYSNAP — CLOUDFLARE PAGES FUNCTION & D1 API (/api)
 * Kiến trúc lai: Cloudflare D1 cho toàn bộ dữ liệu có cấu trúc (~20-100ms),
 * kết hợp Google Drive làm kho lưu trữ tệp ghi âm/video 5TB.
 * ============================================================================
 */

const SCHEMA_TABLE_STATEMENTS = [
  'CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  "CREATE TABLE IF NOT EXISTS teachers (teacher_id TEXT PRIMARY KEY, full_name TEXT NOT NULL, username TEXT NOT NULL, password TEXT NOT NULL, subject TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS classes (class_id TEXT PRIMARY KEY, class_name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS students (student_id TEXT PRIMARY KEY, full_name TEXT NOT NULL, class_name TEXT NOT NULL DEFAULT '', avatar_initials TEXT NOT NULL DEFAULT '', username TEXT NOT NULL, password TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS assignments (assignment_id TEXT PRIMARY KEY, title TEXT NOT NULL, lesson_tag TEXT NOT NULL DEFAULT '', due_date TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', require_media TEXT NOT NULL DEFAULT 'audio_or_video', session_tag TEXT NOT NULL DEFAULT 'Buổi 1', class_name TEXT NOT NULL DEFAULT 'all', exercise_id TEXT NOT NULL DEFAULT '', lesson_id TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS submissions (submission_id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL, student_id TEXT NOT NULL, submitted_at TEXT NOT NULL DEFAULT '', student_note TEXT NOT NULL DEFAULT '', media_type TEXT NOT NULL DEFAULT 'audio', media_url TEXT NOT NULL DEFAULT '', media_duration TEXT NOT NULL DEFAULT '01:00', status TEXT NOT NULL DEFAULT 'submitted', score TEXT NOT NULL DEFAULT '', teacher_comment TEXT NOT NULL DEFAULT '', teacher_voice_url TEXT NOT NULL DEFAULT '', teacher_voice_duration TEXT NOT NULL DEFAULT '', graded_at TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS exit_tickets (record_id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL, student_id TEXT NOT NULL, student_name TEXT NOT NULL DEFAULT '', score REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0, submitted_at TEXT NOT NULL DEFAULT '', answers_json TEXT NOT NULL DEFAULT '[]')",
  "CREATE TABLE IF NOT EXISTS vocabulary (vocab_id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL, lesson_title TEXT NOT NULL DEFAULT '', word TEXT NOT NULL, ipa TEXT NOT NULL DEFAULT '', part_of_speech TEXT NOT NULL DEFAULT '', meaning_vi TEXT NOT NULL DEFAULT '', example_en TEXT NOT NULL DEFAULT '', example_vi TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS practice_exercises (exercise_id TEXT PRIMARY KEY, title TEXT NOT NULL, lesson_tag TEXT NOT NULL DEFAULT '', total_score REAL NOT NULL DEFAULT 35, thresholds_json TEXT NOT NULL DEFAULT '{\"very_good\":31,\"good\":25}', sections_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS practice_submissions (submission_id TEXT PRIMARY KEY, exercise_id TEXT NOT NULL, student_id TEXT NOT NULL, student_name TEXT NOT NULL DEFAULT '', total_score REAL NOT NULL DEFAULT 0, max_score REAL NOT NULL DEFAULT 35, rating TEXT NOT NULL DEFAULT '', submitted_at TEXT NOT NULL DEFAULT '', section_scores_json TEXT NOT NULL DEFAULT '{}', answers_json TEXT NOT NULL DEFAULT '{}', manual_grades_json TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'submitted')"
];

const SCHEMA_INDEX_STATEMENTS = [
  'CREATE INDEX IF NOT EXISTS idx_students_username ON students(username)',
  'CREATE INDEX IF NOT EXISTS idx_assignments_exercise ON assignments(exercise_id)',
  'CREATE INDEX IF NOT EXISTS idx_submissions_asg_stu ON submissions(assignment_id, student_id)',
  'CREATE INDEX IF NOT EXISTS idx_submissions_stu ON submissions(student_id)',
  'CREATE INDEX IF NOT EXISTS idx_exit_tickets_stu ON exit_tickets(student_id)',
  'CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson ON vocabulary(lesson_id)',
  'CREATE INDEX IF NOT EXISTS idx_practice_subs_ex_stu ON practice_submissions(exercise_id, student_id)',
  'CREATE INDEX IF NOT EXISTS idx_practice_subs_stu ON practice_submissions(student_id)'
];

const DEFAULT_TEACHER = {
  teacher_id: 'GV01',
  full_name: 'Hồ Châu Uyển Nhi',
  username: 'gv_uyennhi',
  password: '123456',
  subject: 'Tiếng Trung Giao Tiếp & HSK'
};

const initializedDatabases = new WeakSet();

function jsonResponse(obj, status = 200, extraHeaders) {
  const headers = Object.assign(
    {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    extraHeaders || {}
  );
  return new Response(JSON.stringify(obj), { status, headers });
}

function formatViDate(dateObj) {
  const d = dateObj || new Date();
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return d.toISOString().slice(0, 10);
  }
}

function formatViDateTime(dateObj) {
  const d = dateObj || new Date();
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false
    }).format(d);
  } catch (e) {
    return d.toISOString();
  }
}

function makeShortId(prefix) {
  let raw = '';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    raw = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  } else {
    raw = Math.random().toString(36).slice(2, 10).toUpperCase();
  }
  return prefix + '_' + raw;
}

function getInitials(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function isDriveUrl(url) {
  const s = String(url || '').trim();
  return Boolean(s && (s.indexOf('drive.google.com') >= 0 || s.indexOf('docs.google.com') >= 0));
}

function collectDriveUrls(candidates) {
  const seen = new Set();
  const list = [];
  (candidates || []).forEach(function (u) {
    const clean = String(u || '').trim();
    if (isDriveUrl(clean) && !seen.has(clean)) {
      seen.add(clean);
      list.push(clean);
    }
  });
  return list;
}

function collectPracticeMediaUrls(sectionsInput) {
  let sections = sectionsInput;
  if (typeof sections === 'string') {
    try {
      sections = JSON.parse(sections || '[]');
    } catch (e) {
      sections = [];
    }
  }
  if (!Array.isArray(sections)) return [];
  const candidates = [];
  sections.forEach(function (sec) {
    if (!sec || !sec.data) return;
    if (sec.data.audio_url) candidates.push(sec.data.audio_url);
    if (Array.isArray(sec.data.items)) {
      sec.data.items.forEach(function (item) {
        if (item && item.audio_url) candidates.push(item.audio_url);
      });
    }
  });
  return collectDriveUrls(candidates);
}

async function runBatchedStatements(db, statements, chunkSize) {
  const size = chunkSize || 80;
  for (let i = 0; i < statements.length; i += size) {
    const chunk = statements.slice(i, i + size);
    if (chunk.length > 0) {
      await db.batch(chunk);
    }
  }
}

async function ensureSchema(db) {
  if (initializedDatabases.has(db)) return;
  await runBatchedStatements(
    db,
    SCHEMA_TABLE_STATEMENTS.map(function (sql) {
      return db.prepare(sql);
    }),
    25
  );
  await runBatchedStatements(
    db,
    SCHEMA_INDEX_STATEMENTS.map(function (sql) {
      return db.prepare(sql);
    }),
    25
  );
  initializedDatabases.add(db);
}

async function getMetaMap(db) {
  const res = await db.prepare('SELECT key, value FROM app_meta').all();
  const map = {};
  (res && res.results ? res.results : []).forEach(function (row) {
    map[String(row.key)] = String(row.value);
  });
  return map;
}

async function getDataVersion(db, existingMeta) {
  const meta = existingMeta || (await getMetaMap(db));
  return meta.data_version ? String(meta.data_version) : '0';
}

async function bumpDataVersion(db) {
  const curStr = await getDataVersion(db);
  const curNum = parseInt(curStr, 10) || 0;
  const nextVer = String(Math.max(Date.now(), curNum + 1));
  await db
    .prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('data_version', ?)")
    .bind(nextVer)
    .run();
  return nextVer;
}

async function getBootstrapData(db, metaOverride) {
  const meta = metaOverride || (await getMetaMap(db));
  const batchRes = await db.batch([
    db.prepare('SELECT teacher_id, full_name, username, password, subject FROM teachers ORDER BY rowid ASC'),
    db.prepare('SELECT class_id, class_name, created_at FROM classes ORDER BY rowid ASC'),
    db.prepare('SELECT student_id, full_name, class_name, avatar_initials, username, password, created_at FROM students ORDER BY rowid ASC'),
    db.prepare('SELECT assignment_id, title, lesson_tag, due_date, description, require_media, session_tag, class_name, exercise_id, lesson_id FROM assignments ORDER BY rowid ASC'),
    db.prepare('SELECT submission_id, assignment_id, student_id, submitted_at, student_note, media_type, media_url, media_duration, status, score, teacher_comment, teacher_voice_url, teacher_voice_duration, graded_at FROM submissions ORDER BY rowid ASC'),
    db.prepare('SELECT record_id, ticket_id, student_id, student_name, score, total, submitted_at, answers_json FROM exit_tickets ORDER BY rowid ASC'),
    db.prepare('SELECT vocab_id, lesson_id, lesson_title, word, ipa, part_of_speech, meaning_vi, example_en, example_vi FROM vocabulary ORDER BY rowid ASC'),
    db.prepare('SELECT exercise_id, title, lesson_tag, total_score, thresholds_json, sections_json, created_at FROM practice_exercises ORDER BY rowid ASC'),
    db.prepare('SELECT submission_id, exercise_id, student_id, student_name, total_score, max_score, rating, submitted_at, section_scores_json, answers_json, manual_grades_json, status FROM practice_submissions ORDER BY rowid ASC')
  ]);

  const rows = function (idx) {
    return batchRes[idx] && Array.isArray(batchRes[idx].results) ? batchRes[idx].results : [];
  };

  return {
    isProduction: meta.is_production === 'true',
    teachers: rows(0),
    classes: rows(1),
    students: rows(2),
    assignments: rows(3),
    submissions: rows(4),
    exitTicketLogs: rows(5),
    vocabulary: rows(6),
    practiceExercises: rows(7),
    practiceSubmissions: rows(8)
  };
}

async function buildMutationResponse(db, payload, preVer, extraFields) {
  const nextVer = await bumpDataVersion(db);
  const clientVer = payload && payload.clientVersion ? String(payload.clientVersion).trim() : '';
  const wantsDeltaOnly = payload && payload.deltaOnly === true;
  const hasVersionConflict = Boolean(clientVer && preVer && preVer !== '0' && clientVer !== preVer);
  const needsBootstrap =
    (payload && payload.includeBootstrap === true) ||
    !wantsDeltaOnly ||
    hasVersionConflict;

  const out = Object.assign(
    {
      ok: true,
      backend: 'cloudflare-d1',
      version: nextVer,
      conflictRefreshed: hasVersionConflict
    },
    extraFields || {}
  );

  if (needsBootstrap) {
    out.data = await getBootstrapData(db);
  }
  return jsonResponse(out);
}

async function ensureClassRecord(db, className) {
  const clean = String(className || '').trim();
  if (!clean || clean === 'Chưa xếp lớp' || clean === 'all' || clean === 'unassigned') return;
  const existing = await db
    .prepare('SELECT class_id FROM classes WHERE LOWER(TRIM(class_name)) = LOWER(TRIM(?)) LIMIT 1')
    .bind(clean)
    .first();
  if (!existing) {
    await db
      .prepare('INSERT INTO classes (class_id, class_name, created_at) VALUES (?, ?, ?)')
      .bind(makeShortId('CLS'), clean, formatViDate())
      .run();
  }
}

async function handleSetupDatabase(db) {
  const countRow = await db.prepare('SELECT COUNT(*) AS cnt FROM teachers').first();
  if (!countRow || Number(countRow.cnt) === 0) {
    await db
      .prepare('INSERT OR IGNORE INTO teachers (teacher_id, full_name, username, password, subject) VALUES (?, ?, ?, ?, ?)')
      .bind(
        DEFAULT_TEACHER.teacher_id,
        DEFAULT_TEACHER.full_name,
        DEFAULT_TEACHER.username,
        DEFAULT_TEACHER.password,
        DEFAULT_TEACHER.subject
      )
      .run();
  }
  await db.batch([
    db.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('is_production', 'true')"),
    db.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('d1_bootstrapped', '1')")
  ]);
  const nextVer = await bumpDataVersion(db);
  const data = await getBootstrapData(db);
  return jsonResponse({
    ok: true,
    backend: 'cloudflare-d1',
    version: nextVer,
    message: 'Đã khởi tạo cơ sở dữ liệu Cloudflare D1 với tài khoản Giáo viên: Hồ Châu Uyển Nhi (gv_uyennhi).',
    data: data
  });
}

async function handleImportFromBootstrapData(db, payload) {
  const meta = await getMetaMap(db);
  const teacherCntRow = await db.prepare('SELECT COUNT(*) AS cnt FROM teachers').first();
  const hasExistingTeachers = teacherCntRow && Number(teacherCntRow.cnt) > 0;
  if ((meta.d1_bootstrapped === '1' || hasExistingTeachers) && payload.forceOverwrite !== true) {
    return jsonResponse({
      ok: true,
      backend: 'cloudflare-d1',
      skipped: true,
      version: await getDataVersion(db, meta),
      data: await getBootstrapData(db, meta)
    });
  }

  const src = payload && payload.data && typeof payload.data === 'object' ? payload.data : {};
  const statements = [];

  if (payload.forceOverwrite === true) {
    statements.push(
      db.prepare('DELETE FROM teachers'),
      db.prepare('DELETE FROM classes'),
      db.prepare('DELETE FROM students'),
      db.prepare('DELETE FROM assignments'),
      db.prepare('DELETE FROM submissions'),
      db.prepare('DELETE FROM exit_tickets'),
      db.prepare('DELETE FROM vocabulary'),
      db.prepare('DELETE FROM practice_exercises'),
      db.prepare('DELETE FROM practice_submissions')
    );
  }

  const teachers = Array.isArray(src.teachers) && src.teachers.length > 0 ? src.teachers : [DEFAULT_TEACHER];
  teachers.forEach(function (t, idx) {
    statements.push(
      db
        .prepare('INSERT OR REPLACE INTO teachers (teacher_id, full_name, username, password, subject) VALUES (?, ?, ?, ?, ?)')
        .bind(
          String(t.teacher_id || ('GV0' + (idx + 1))),
          String(t.full_name || 'Giáo viên'),
          String(t.username || ('gv_' + (idx + 1))),
          String(t.password !== undefined && t.password !== null ? t.password : '123456'),
          String(t.subject || 'Tiếng Trung Giao Tiếp & HSK')
        )
    );
  });

  const seenClasses = new Set();
  const queueClass = function (clsObj) {
    const cname = String((clsObj && clsObj.class_name) || clsObj || '').trim();
    if (!cname || cname === 'Chưa xếp lớp' || cname === 'all' || cname === 'unassigned') return;
    const key = cname.toLowerCase();
    if (seenClasses.has(key)) return;
    seenClasses.add(key);
    statements.push(
      db
        .prepare('INSERT OR REPLACE INTO classes (class_id, class_name, created_at) VALUES (?, ?, ?)')
        .bind(
          String((clsObj && clsObj.class_id) || makeShortId('CLS')),
          cname,
          String((clsObj && clsObj.created_at) || formatViDate())
        )
    );
  };

  if (Array.isArray(src.classes)) {
    src.classes.forEach(queueClass);
  }

  const students = Array.isArray(src.students) ? src.students : [];
  students.forEach(function (s, idx) {
    const stId = String(s.student_id || ('HS' + String(idx + 1).padStart(2, '0')));
    const cname = String(s.class_name || '');
    queueClass({ class_name: cname, created_at: s.created_at });
    statements.push(
      db
        .prepare('INSERT OR REPLACE INTO students (student_id, full_name, class_name, avatar_initials, username, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(
          stId,
          String(s.full_name || 'Học sinh'),
          cname,
          String(s.avatar_initials || getInitials(s.full_name)),
          String(s.username || stId.toLowerCase()),
          String(s.password !== undefined && s.password !== null ? s.password : '123456'),
          String(s.created_at || formatViDate())
        )
    );
  });

  const assignments = Array.isArray(src.assignments) ? src.assignments : [];
  assignments.forEach(function (a, idx) {
    const reqMedia = String(a.require_media || 'audio_or_video');
    const clsVal =
      a.class_name !== undefined && a.class_name !== null && String(a.class_name).trim() !== ''
        ? String(a.class_name).trim()
        : (reqMedia === 'practice' ? 'unassigned' : 'all');
    statements.push(
      db
        .prepare('INSERT OR REPLACE INTO assignments (assignment_id, title, lesson_tag, due_date, description, require_media, session_tag, class_name, exercise_id, lesson_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          String(a.assignment_id || ('BVN_' + (idx + 1))),
          String(a.title || ''),
          String(a.lesson_tag || ''),
          String(a.due_date || ''),
          String(a.description || ''),
          reqMedia,
          String(a.session_tag || 'Buổi 1'),
          clsVal,
          String(a.exercise_id || ''),
          String(a.lesson_id || '')
        )
    );
  });

  const submissions = Array.isArray(src.submissions) ? src.submissions : [];
  submissions.forEach(function (s, idx) {
    statements.push(
      db
        .prepare('INSERT OR REPLACE INTO submissions (submission_id, assignment_id, student_id, submitted_at, student_note, media_type, media_url, media_duration, status, score, teacher_comment, teacher_voice_url, teacher_voice_duration, graded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          String(s.submission_id || ('SUB_' + (idx + 1))),
          String(s.assignment_id || ''),
          String(s.student_id || ''),
          String(s.submitted_at || ''),
          String(s.student_note || ''),
          String(s.media_type || 'audio'),
          String(s.media_url || ''),
          String(s.media_duration || '01:00'),
          String(s.status || 'submitted'),
          s.score !== undefined && s.score !== null ? String(s.score) : '',
          String(s.teacher_comment || ''),
          String(s.teacher_voice_url || ''),
          String(s.teacher_voice_duration || ''),
          String(s.graded_at || '')
        )
    );
  });

  const exitTickets = Array.isArray(src.exitTicketLogs) ? src.exitTicketLogs : [];
  exitTickets.forEach(function (ex, idx) {
    statements.push(
      db
        .prepare('INSERT OR REPLACE INTO exit_tickets (record_id, ticket_id, student_id, student_name, score, total, submitted_at, answers_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          String(ex.record_id || ('EXT_' + (idx + 1))),
          String(ex.ticket_id || 'EXIT_BAI_1'),
          String(ex.student_id || ''),
          String(ex.student_name || ''),
          Number(ex.score) || 0,
          Number(ex.total) || 0,
          String(ex.submitted_at || ''),
          typeof ex.answers === 'object' ? JSON.stringify(ex.answers) : String(ex.answers_json || '[]')
        )
    );
  });

  const vocabulary = Array.isArray(src.vocabulary) ? src.vocabulary : [];
  vocabulary.forEach(function (v, idx) {
    statements.push(
      db
        .prepare('INSERT OR REPLACE INTO vocabulary (vocab_id, lesson_id, lesson_title, word, ipa, part_of_speech, meaning_vi, example_en, example_vi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          String(v.vocab_id || ('V_' + (idx + 1))),
          String(v.lesson_id || 'bai-1'),
          String(v.lesson_title || 'Bài 1'),
          String(v.word || ''),
          String(v.ipa || ''),
          String(v.part_of_speech || ''),
          String(v.meaning_vi || ''),
          String(v.example_en || ''),
          String(v.example_vi || '')
        )
    );
  });

  const practiceExercises = Array.isArray(src.practiceExercises) ? src.practiceExercises : [];
  practiceExercises.forEach(function (pe, idx) {
    const thresholdsJson =
      typeof pe.thresholds === 'object'
        ? JSON.stringify(pe.thresholds)
        : String(pe.thresholds_json || '{"very_good":31,"good":25}');
    const sectionsJson =
      typeof pe.sections === 'object' ? JSON.stringify(pe.sections) : String(pe.sections_json || '[]');
    statements.push(
      db
        .prepare('INSERT OR REPLACE INTO practice_exercises (exercise_id, title, lesson_tag, total_score, thresholds_json, sections_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(
          String(pe.exercise_id || ('EX_' + (idx + 1))),
          String(pe.title || 'Bài tập mới'),
          String(pe.lesson_tag || 'Bài 1'),
          Number(pe.total_score) || 35,
          thresholdsJson,
          sectionsJson,
          String(pe.created_at || formatViDateTime())
        )
    );
  });

  const practiceSubmissions = Array.isArray(src.practiceSubmissions) ? src.practiceSubmissions : [];
  practiceSubmissions.forEach(function (ps, idx) {
    const secScores =
      typeof ps.section_scores === 'object' ? JSON.stringify(ps.section_scores) : String(ps.section_scores_json || '{}');
    const answers = typeof ps.answers === 'object' ? JSON.stringify(ps.answers) : String(ps.answers_json || '{}');
    const manualGrades =
      typeof ps.manual_grades === 'object' ? JSON.stringify(ps.manual_grades) : String(ps.manual_grades_json || '{}');
    statements.push(
      db
        .prepare('INSERT OR REPLACE INTO practice_submissions (submission_id, exercise_id, student_id, student_name, total_score, max_score, rating, submitted_at, section_scores_json, answers_json, manual_grades_json, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          String(ps.submission_id || ('PRAC_SUB_' + (idx + 1))),
          String(ps.exercise_id || ''),
          String(ps.student_id || ''),
          String(ps.student_name || ''),
          Number(ps.total_score) || 0,
          Number(ps.max_score) || 35,
          String(ps.rating || ''),
          String(ps.submitted_at || ''),
          secScores,
          answers,
          manualGrades,
          String(ps.status || 'submitted')
        )
    );
  });

  statements.push(
    db.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('is_production', ?)").bind(src.isProduction ? 'true' : 'false'),
    db.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('d1_bootstrapped', '1')"),
    db.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('imported_from_gas', '1')")
  );

  await runBatchedStatements(db, statements, 70);
  const nextVer = await bumpDataVersion(db);
  const data = await getBootstrapData(db);
  return jsonResponse({
    ok: true,
    backend: 'cloudflare-d1',
    imported: true,
    version: nextVer,
    data: data
  });
}

async function handleLogin(db, payload) {
  const username = String(payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();
  if (!username || !password) {
    return jsonResponse({
      ok: false,
      error: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.'
    });
  }

  const meta = await getMetaMap(db);
  const teacherCntRow = await db.prepare('SELECT COUNT(*) AS cnt FROM teachers').first();
  if (meta.d1_bootstrapped !== '1' && (!teacherCntRow || Number(teacherCntRow.cnt) === 0)) {
    return jsonResponse({
      ok: false,
      needsMigration: true,
      error: 'Hệ thống đang khởi tạo dữ liệu D1. Vui lòng thử lại sau giây lát.'
    });
  }

  const teacher = await db
    .prepare('SELECT teacher_id, full_name, username, password, subject FROM teachers WHERE LOWER(TRIM(username)) = ? AND TRIM(password) = ? LIMIT 1')
    .bind(username, password)
    .first();

  if (teacher) {
    return jsonResponse({
      ok: true,
      backend: 'cloudflare-d1',
      version: await getDataVersion(db, meta),
      user: {
        role: 'teacher',
        id: teacher.teacher_id,
        full_name: teacher.full_name,
        username: teacher.username,
        subject: teacher.subject || 'Giáo viên phụ trách'
      }
    });
  }

  const student = await db
    .prepare('SELECT student_id, full_name, class_name, avatar_initials, username, password FROM students WHERE (LOWER(TRIM(username)) = ? OR LOWER(TRIM(student_id)) = ?) AND TRIM(password) = ? LIMIT 1')
    .bind(username, username, password)
    .first();

  if (student) {
    return jsonResponse({
      ok: true,
      backend: 'cloudflare-d1',
      version: await getDataVersion(db, meta),
      user: {
        role: 'student',
        id: student.student_id,
        student_id: student.student_id,
        full_name: student.full_name,
        username: student.username || String(student.student_id || '').toLowerCase(),
        class_name: student.class_name,
        avatar_initials: student.avatar_initials
      }
    });
  }

  return jsonResponse({
    ok: false,
    error: 'Tên đăng nhập hoặc mật khẩu không chính xác.'
  });
}

async function generateNextStudentId(db) {
  const res = await db.prepare('SELECT student_id FROM students').all();
  const rows = res && Array.isArray(res.results) ? res.results : [];
  let maxNum = 0;
  const existingIds = new Set();
  rows.forEach(function (r) {
    const id = String(r.student_id || '').trim().toUpperCase();
    if (!id) return;
    existingIds.add(id);
    const match = id.match(/^HS(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  let counter = Math.max(maxNum + 1, rows.length + 1, 1);
  let candidate = 'HS' + String(counter).padStart(2, '0');
  while (existingIds.has(candidate)) {
    counter++;
    candidate = 'HS' + String(counter).padStart(2, '0');
  }
  return candidate;
}

function formatPracticeAssignmentTitle(rawTitle) {
  const clean = String(rawTitle || '').trim() || 'Bài tập mới';
  if (/^Luyện tập cuối (buổi|bài):/i.test(clean)) {
    return 'Luyện tập cuối buổi:' + clean.replace(/^Luyện tập cuối (?:buổi|bài):/i, '');
  }
  return (
    'Luyện tập cuối buổi: ' +
    clean.replace(/^(?:Bài tập luyện tập cuối bài|Bài luyện tập cuối buổi)\s*—\s*/i, '')
  );
}

function normalizeProxyMediaMime(rawContentType) {
  const ct = String(rawContentType || '').split(';')[0].trim().toLowerCase();
  if (!ct) return 'audio/webm';
  if (ct === 'audio/x-m4a' || ct === 'audio/m4a') return 'audio/mp4';
  if (ct === 'audio/mp3') return 'audio/mpeg';
  return ct;
}

async function handleDriveMediaProxy(request, url, ctx) {
  const fileId = String(url.searchParams.get('fileId') || '').trim();
  if (!/^[a-zA-Z0-9_-]{10,120}$/.test(fileId)) {
    return jsonResponse({ ok: false, error: 'Thiếu hoặc sai định dạng fileId.' }, 400);
  }

  const edgeCache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const cacheKey = new Request('https://studysnap-drive-edge.internal/media/v2/' + encodeURIComponent(fileId), {
    method: 'GET'
  });
  if (edgeCache) {
    const cached = await edgeCache.match(cacheKey);
    if (cached) return cached;
  }

  const driveUrls = [
    'https://drive.usercontent.google.com/download?id=' + encodeURIComponent(fileId) + '&export=download&confirm=t',
    'https://drive.usercontent.google.com/uc?id=' + encodeURIComponent(fileId) + '&export=download',
    'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(fileId)
  ];

  for (let i = 0; i < driveUrls.length; i++) {
    try {
      const upstream = await fetch(driveUrls[i], {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StudySnapMediaProxy/1.0)'
        }
      });
      const contentType = String(upstream.headers.get('content-type') || '').toLowerCase();
      if (
        upstream.ok &&
        upstream.body &&
        contentType.indexOf('text/html') === -1 &&
        contentType.indexOf('application/json') === -1
      ) {
        const headers = new Headers();
        headers.set('Content-Type', normalizeProxyMediaMime(contentType));
        const contentLen = upstream.headers.get('content-length');
        if (contentLen) headers.set('Content-Length', contentLen);
        headers.set('Cache-Control', 'public, max-age=604800, immutable');
        headers.set('Access-Control-Allow-Origin', '*');

        const responseToServe = new Response(upstream.body, {
          status: 200,
          headers: headers
        });
        if (edgeCache && responseToServe.body) {
          const cloned = responseToServe.clone();
          if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(edgeCache.put(cacheKey, cloned).catch(function () {}));
          } else {
            await edgeCache.put(cacheKey, cloned).catch(function () {});
          }
        }
        return responseToServe;
      }
    } catch (e) {
      // Thử URL kế tiếp hoặc trả fallbackToGas
    }
  }

  return jsonResponse({ ok: false, fallbackToGas: true, fileId: fileId }, 404);
}

export async function handleApiRequest(request, env, ctx) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  const url = new URL(request.url);

  if (request.method === 'GET' && url.searchParams.get('action') === 'media') {
    return await handleDriveMediaProxy(request, url, ctx);
  }

  const db = env && env.DB ? env.DB : null;
  if (!db) {
    return jsonResponse(
      {
        ok: false,
        backend: 'cloudflare-d1',
        d1Missing: true,
        error: 'Chưa gắn kết cơ sở dữ liệu Cloudflare D1 (binding DB).'
      },
      503
    );
  }

  try {
    await ensureSchema(db);

    if (request.method === 'GET') {
      const action = url.searchParams.get('action') || 'bootstrap';
      const meta = await getMetaMap(db);
      const curVer = await getDataVersion(db, meta);

      if (action === 'ping') {
        const teacherCntRow = await db.prepare('SELECT COUNT(*) AS cnt FROM teachers').first();
        const teachersCount = teacherCntRow ? Number(teacherCntRow.cnt) : 0;
        const needsMigration = meta.d1_bootstrapped !== '1' && teachersCount === 0;
        return jsonResponse({
          ok: true,
          backend: 'cloudflare-d1',
          version: curVer,
          needsMigration: needsMigration,
          timestamp: new Date().toISOString()
        });
      }

      const teacherCntRow = await db.prepare('SELECT COUNT(*) AS cnt FROM teachers').first();
      const teachersCount = teacherCntRow ? Number(teacherCntRow.cnt) : 0;
      const needsMigration = meta.d1_bootstrapped !== '1' && teachersCount === 0;

      if (needsMigration) {
        return jsonResponse({
          ok: true,
          backend: 'cloudflare-d1',
          version: curVer,
          needsMigration: true,
          data: {
            isProduction: false,
            teachers: [],
            classes: [],
            students: [],
            assignments: [],
            submissions: [],
            exitTicketLogs: [],
            vocabulary: [],
            practiceExercises: [],
            practiceSubmissions: []
          }
        });
      }

      const clientVer = String(url.searchParams.get('v') || '').trim();
      if (clientVer && curVer && curVer !== '0' && clientVer === curVer) {
        return jsonResponse({
          ok: true,
          backend: 'cloudflare-d1',
          unchanged: true,
          version: curVer
        });
      }

      const bootstrapData = await getBootstrapData(db, meta);
      return jsonResponse({
        ok: true,
        backend: 'cloudflare-d1',
        version: curVer,
        data: bootstrapData
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, error: 'Phương thức HTTP không được hỗ trợ.' }, 405);
    }

    let payload = {};
    try {
      const text = await request.text();
      payload = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      return jsonResponse({ ok: false, error: 'Dữ liệu JSON không hợp lệ.' }, 400);
    }

    const action = String(payload.action || '').trim();

    if (action === 'setupDatabase') {
      return await handleSetupDatabase(db);
    }

    if (action === 'importFromBootstrapData') {
      return await handleImportFromBootstrapData(db, payload);
    }

    if (action === 'clearAllData' || action === 'clearAllDataCompletely') {
      return jsonResponse({
        ok: false,
        error: 'Chức năng quản trị và làm sạch dữ liệu không thực hiện từ giao diện web.'
      });
    }

    if (action === 'login') {
      return await handleLogin(db, payload);
    }

    const preVer = await getDataVersion(db);

    if (action === 'createClass') {
      const className = String(payload.class_name || '').trim();
      if (!className) {
        return jsonResponse({ ok: false, error: 'Thiếu tên lớp học.' }, 400);
      }
      const existing = await db
        .prepare('SELECT class_id, class_name, created_at FROM classes WHERE LOWER(TRIM(class_name)) = LOWER(TRIM(?)) LIMIT 1')
        .bind(className)
        .first();
      if (existing) {
        return await buildMutationResponse(db, payload, preVer, { classItem: existing });
      }
      const classId = String(payload.class_id || makeShortId('CLS'));
      const createdAt = formatViDate();
      await db
        .prepare('INSERT INTO classes (class_id, class_name, created_at) VALUES (?, ?, ?)')
        .bind(classId, className, createdAt)
        .run();
      return await buildMutationResponse(db, payload, preVer, {
        classItem: { class_id: classId, class_name: className, created_at: createdAt }
      });
    }

    if (action === 'deleteClass') {
      const className = String(payload.class_name || '').trim();
      if (!className) {
        return jsonResponse({ ok: false, error: 'Thiếu tên lớp học.' }, 400);
      }
      await db.batch([
        db.prepare('DELETE FROM classes WHERE LOWER(TRIM(class_name)) = LOWER(TRIM(?))').bind(className),
        db
          .prepare("UPDATE students SET class_name = 'Chưa xếp lớp' WHERE LOWER(TRIM(class_name)) = LOWER(TRIM(?))")
          .bind(className)
      ]);
      return await buildMutationResponse(db, payload, preVer, {
        deletedClass: { deleted: true, class_name: className }
      });
    }

    if (action === 'changeStudentClass') {
      const studentId = String(payload.student_id || '').trim();
      const targetClass = String(payload.class_name || '').trim();
      if (!studentId || !targetClass) {
        return jsonResponse({ ok: false, error: 'Thiếu thông tin học sinh hoặc lớp mới.' }, 400);
      }
      await ensureClassRecord(db, targetClass);
      await db
        .prepare('UPDATE students SET class_name = ? WHERE student_id = ?')
        .bind(targetClass, studentId)
        .run();
      return await buildMutationResponse(db, payload, preVer, {
        student: { student_id: studentId, class_name: targetClass }
      });
    }

    if (action === 'createStudentAccount') {
      const studentId = payload.student_id ? String(payload.student_id).trim() : await generateNextStudentId(db);
      const fullName = String(payload.full_name || 'Học sinh mới').trim();
      const className = String(payload.class_name || 'Lớp Tiếng Trung HSK 2').trim();
      const initials = String(payload.avatar_initials || getInitials(fullName)).trim();
      const username = String(payload.username || studentId.toLowerCase()).trim().toLowerCase();
      const password = String(payload.password || '123456').trim();
      const createdAt = formatViDate();

      await ensureClassRecord(db, className);
      await db
        .prepare('INSERT OR REPLACE INTO students (student_id, full_name, class_name, avatar_initials, username, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(studentId, fullName, className, initials, username, password, createdAt)
        .run();

      return await buildMutationResponse(db, payload, preVer, {
        student: {
          student_id: studentId,
          full_name: fullName,
          class_name: className,
          avatar_initials: initials,
          username: username,
          password: password,
          created_at: createdAt
        }
      });
    }

    if (action === 'resetStudentPassword') {
      const studentId = String(payload.student_id || '').trim();
      const newPwd = String(payload.new_password || '123456').trim();
      const info = await db
        .prepare('UPDATE students SET password = ? WHERE student_id = ?')
        .bind(newPwd, studentId)
        .run();
      const updatedCount = info && info.meta ? Number(info.meta.changes || 0) : 1;
      return await buildMutationResponse(db, payload, preVer, {
        student: updatedCount > 0 ? { student_id: studentId, password: newPwd } : null
      });
    }

    if (action === 'deleteStudentAccount') {
      const studentId = String(payload.student_id || '').trim();
      if (!studentId) {
        return await buildMutationResponse(db, payload, preVer, {
          deletedStudent: { deleted: false, student_id: '' },
          deletedMediaUrls: []
        });
      }

      const subMediaRes = await db
        .prepare('SELECT media_url, teacher_voice_url FROM submissions WHERE TRIM(student_id) = ?')
        .bind(studentId)
        .all();
      const mediaCandidates = [];
      (subMediaRes && subMediaRes.results ? subMediaRes.results : []).forEach(function (r) {
        mediaCandidates.push(r.media_url, r.teacher_voice_url);
      });

      const batchOut = await db.batch([
        db.prepare('DELETE FROM students WHERE TRIM(student_id) = ?').bind(studentId),
        db.prepare('DELETE FROM submissions WHERE TRIM(student_id) = ?').bind(studentId),
        db.prepare('DELETE FROM exit_tickets WHERE TRIM(student_id) = ?').bind(studentId),
        db.prepare('DELETE FROM practice_submissions WHERE TRIM(student_id) = ?').bind(studentId)
      ]);
      const changesOf = function (i) {
        return batchOut[i] && batchOut[i].meta ? Number(batchOut[i].meta.changes || 0) : 0;
      };
      return await buildMutationResponse(db, payload, preVer, {
        deletedStudent: {
          deleted: changesOf(0) > 0,
          student_id: studentId,
          deleted_students: changesOf(0),
          deleted_submissions: changesOf(1),
          deleted_exit_tickets: changesOf(2),
          deleted_practice_submissions: changesOf(3)
        },
        deletedMediaUrls: collectDriveUrls(mediaCandidates)
      });
    }

    if (action === 'submitHomework') {
      const assignmentId = String(payload.assignment_id || '').trim();
      const studentId = String(payload.student_id || '').trim();
      const nowStr = formatViDateTime();
      const incomingUrl = String(payload.media_url || '').trim();

      if (payload.media_base64 || (incomingUrl.indexOf('data:') === 0 && incomingUrl.length > 262144)) {
        return jsonResponse({
          ok: false,
          error: 'Tệp ghi âm/video phải được tải lên Google Drive trước khi lưu vào Cloudflare D1.'
        }, 400);
      }

      const existing = await db
        .prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1')
        .bind(assignmentId, studentId)
        .first();

      if (existing) {
        const nextMediaUrl = incomingUrl || existing.media_url || '';
        const replacedUrls =
          incomingUrl && existing.media_url && incomingUrl !== existing.media_url
            ? collectDriveUrls([existing.media_url])
            : [];
        const nextNote = payload.student_note !== undefined ? String(payload.student_note) : (existing.student_note || '');
        const nextType = payload.media_type || existing.media_type || 'audio';
        const nextDur = payload.media_duration || existing.media_duration || '01:00';
        const nextStatus = existing.status === 'graded' ? 'graded' : 'submitted';

        await db
          .prepare('UPDATE submissions SET submitted_at = ?, student_note = ?, media_type = ?, media_url = ?, media_duration = ?, status = ? WHERE submission_id = ?')
          .bind(nowStr, nextNote, nextType, nextMediaUrl, nextDur, nextStatus, existing.submission_id)
          .run();

        return await buildMutationResponse(db, payload, preVer, {
          submission: { submission_id: existing.submission_id, media_url: nextMediaUrl, status: nextStatus },
          deletedMediaUrls: replacedUrls
        });
      } else {
        const newId = makeShortId('SUB');
        const nextNote = String(payload.student_note || '');
        const nextType = String(payload.media_type || 'audio');
        const nextDur = String(payload.media_duration || '01:00');
        await db
          .prepare('INSERT INTO submissions (submission_id, assignment_id, student_id, submitted_at, student_note, media_type, media_url, media_duration, status, score, teacher_comment, teacher_voice_url, teacher_voice_duration, graded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(newId, assignmentId, studentId, nowStr, nextNote, nextType, incomingUrl, nextDur, 'submitted', '', '', '', '', '')
          .run();
        return await buildMutationResponse(db, payload, preVer, {
          submission: { submission_id: newId, media_url: incomingUrl, status: 'submitted' }
        });
      }
    }

    if (action === 'saveTeacherFeedback') {
      const assignmentId = String(payload.assignment_id || '').trim();
      const studentId = String(payload.student_id || '').trim();
      const nowStr = formatViDateTime();
      const incomingVoiceUrl = String(payload.teacher_voice_url || '').trim();

      if (payload.teacher_voice_base64 || (incomingVoiceUrl.indexOf('data:') === 0 && incomingVoiceUrl.length > 262144)) {
        return jsonResponse({
          ok: false,
          error: 'Bản ghi âm phản hồi phải được tải lên Google Drive trước khi lưu vào Cloudflare D1.'
        }, 400);
      }

      const existing = await db
        .prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1')
        .bind(assignmentId, studentId)
        .first();

      if (existing) {
        const nextScore = payload.score !== undefined ? String(payload.score) : String(existing.score || '');
        const nextComment = payload.teacher_comment !== undefined ? String(payload.teacher_comment) : String(existing.teacher_comment || '');
        const nextVoiceUrl = incomingVoiceUrl || existing.teacher_voice_url || '';
        const replacedUrls =
          incomingVoiceUrl && existing.teacher_voice_url && incomingVoiceUrl !== existing.teacher_voice_url
            ? collectDriveUrls([existing.teacher_voice_url])
            : [];
        const nextVoiceDur = payload.teacher_voice_duration || existing.teacher_voice_duration || '';
        const nextSubmittedAt = existing.submitted_at || nowStr;

        await db
          .prepare('UPDATE submissions SET submitted_at = ?, status = ?, score = ?, teacher_comment = ?, teacher_voice_url = ?, teacher_voice_duration = ?, graded_at = ? WHERE submission_id = ?')
          .bind(nextSubmittedAt, 'graded', nextScore, nextComment, nextVoiceUrl, nextVoiceDur, nowStr, existing.submission_id)
          .run();

        return await buildMutationResponse(db, payload, preVer, {
          submission: { submission_id: existing.submission_id, status: 'graded', teacher_voice_url: nextVoiceUrl },
          deletedMediaUrls: replacedUrls
        });
      } else {
        const newId = makeShortId('SUB');
        const nextStatus = String(payload.status || 'graded');
        const nextScore = payload.score !== undefined ? String(payload.score) : '';
        const nextComment = String(payload.teacher_comment || '');
        const nextVoiceDur = String(payload.teacher_voice_duration || '');
        await db
          .prepare('INSERT INTO submissions (submission_id, assignment_id, student_id, submitted_at, student_note, media_type, media_url, media_duration, status, score, teacher_comment, teacher_voice_url, teacher_voice_duration, graded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(newId, assignmentId, studentId, '', '', '', '', '', nextStatus, nextScore, nextComment, incomingVoiceUrl, nextVoiceDur, nowStr)
          .run();
        return await buildMutationResponse(db, payload, preVer, {
          submission: { submission_id: newId, status: nextStatus, teacher_voice_url: incomingVoiceUrl }
        });
      }
    }

    if (action === 'submitExitTicket') {
      const recordId = makeShortId('EXT');
      const nowStr = formatViDateTime();
      await db
        .prepare('INSERT INTO exit_tickets (record_id, ticket_id, student_id, student_name, score, total, submitted_at, answers_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          recordId,
          String(payload.ticket_id || 'EXIT_BAI_1'),
          String(payload.student_id || ''),
          String(payload.student_name || ''),
          Number(payload.score) || 0,
          Number(payload.total) || 0,
          nowStr,
          JSON.stringify(payload.answers || [])
        )
        .run();
      return await buildMutationResponse(db, payload, preVer, {
        exitResult: { record_id: recordId, submitted_at: nowStr }
      });
    }

    if (action === 'addVocabulary') {
      const vocabId = makeShortId('V');
      await db
        .prepare('INSERT INTO vocabulary (vocab_id, lesson_id, lesson_title, word, ipa, part_of_speech, meaning_vi, example_en, example_vi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          vocabId,
          String(payload.lesson_id || 'bai-1'),
          String(payload.lesson_title || 'Bài 1'),
          String(payload.word || ''),
          String(payload.ipa || ''),
          String(payload.part_of_speech || ''),
          String(payload.meaning_vi || ''),
          String(payload.example_en || ''),
          String(payload.example_vi || '')
        )
        .run();
      return await buildMutationResponse(db, payload, preVer, { vocab: { vocab_id: vocabId } });
    }

    if (action === 'batchAddVocabulary') {
      const list = Array.isArray(payload.vocabulary) ? payload.vocabulary : [];
      if (list.length === 0) {
        return await buildMutationResponse(db, payload, preVer, {
          importedVocab: { importedCount: 0, lessonIds: [] }
        });
      }
      const lessonIdSet = new Set();
      const stmts = list.map(function (item, idx) {
        const lid = String((item && item.lesson_id) || payload.lesson_id || 'bai-1');
        lessonIdSet.add(lid);
        return db
          .prepare('INSERT OR REPLACE INTO vocabulary (vocab_id, lesson_id, lesson_title, word, ipa, part_of_speech, meaning_vi, example_en, example_vi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(
            String((item && item.vocab_id) || (makeShortId('V') + '_' + idx)),
            lid,
            String((item && item.lesson_title) || payload.lesson_title || 'Bài 1'),
            String((item && item.word) || ''),
            String((item && item.ipa) || ''),
            String((item && item.part_of_speech) || ''),
            String((item && item.meaning_vi) || ''),
            String((item && item.example_en) || ''),
            String((item && item.example_vi) || '')
          );
      });
      await runBatchedStatements(db, stmts, 80);
      return await buildMutationResponse(db, payload, preVer, {
        importedVocab: { importedCount: list.length, lessonIds: Array.from(lessonIdSet) }
      });
    }

    if (action === 'addAssignment') {
      const asgId = String(payload.assignment_id || ('BVN_' + Date.now()));
      const reqMedia = String(payload.require_media || 'audio_or_video');
      const clsVal =
        payload.class_name !== undefined && payload.class_name !== null && String(payload.class_name).trim() !== ''
          ? String(payload.class_name).trim()
          : (reqMedia === 'practice' ? 'unassigned' : 'all');
      await db
        .prepare('INSERT OR REPLACE INTO assignments (assignment_id, title, lesson_tag, due_date, description, require_media, session_tag, class_name, exercise_id, lesson_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          asgId,
          String(payload.title || 'Bài tập mới'),
          String(payload.lesson_tag || 'Bài mới'),
          String(payload.due_date || '20/11/2026'),
          String(payload.description || ''),
          reqMedia,
          String(payload.session_tag || 'Buổi 1'),
          clsVal,
          String(payload.exercise_id || ''),
          String(payload.lesson_id || '')
        )
        .run();
      return await buildMutationResponse(db, payload, preVer, { assignment: { assignment_id: asgId } });
    }

    if (action === 'assignExercisesToClass' || action === 'unassignAssignment') {
      const targetClass =
        action === 'unassignAssignment'
          ? 'unassigned'
          : (String(payload.target_class || 'all').trim() || 'all');
      const ids = Array.isArray(payload.assignment_ids)
        ? payload.assignment_ids
        : (payload.assignment_id ? [payload.assignment_id] : []);
      const cleanIds = ids
        .map(function (id) { return String(id || '').trim(); })
        .filter(Boolean);
      if (cleanIds.length === 0) {
        return await buildMutationResponse(db, payload, preVer, {
          updated: { updated_count: 0, target_class: targetClass }
        });
      }
      const stmts = cleanIds.map(function (id) {
        return db
          .prepare('UPDATE assignments SET class_name = ? WHERE TRIM(assignment_id) = ?')
          .bind(targetClass, id);
      });
      const res = await db.batch(stmts);
      let updatedCount = 0;
      res.forEach(function (r) {
        if (r && r.meta && r.meta.changes) updatedCount += Number(r.meta.changes);
      });
      return await buildMutationResponse(db, payload, preVer, {
        updated: { updated_count: updatedCount, target_class: targetClass }
      });
    }

    if (action === 'deleteAssignment') {
      const assignmentId = String(payload.assignment_id || '').trim();
      if (!assignmentId) {
        return await buildMutationResponse(db, payload, preVer, {
          deletedAssignment: { deleted: false, assignment_id: '' },
          deletedMediaUrls: []
        });
      }
      const subMediaRes = await db
        .prepare('SELECT media_url, teacher_voice_url FROM submissions WHERE TRIM(assignment_id) = ?')
        .bind(assignmentId)
        .all();
      const mediaCandidates = [];
      (subMediaRes && subMediaRes.results ? subMediaRes.results : []).forEach(function (r) {
        mediaCandidates.push(r.media_url, r.teacher_voice_url);
      });

      const batchOut = await db.batch([
        db.prepare('DELETE FROM assignments WHERE TRIM(assignment_id) = ?').bind(assignmentId),
        db.prepare('DELETE FROM submissions WHERE TRIM(assignment_id) = ?').bind(assignmentId)
      ]);
      const changesOf = function (i) {
        return batchOut[i] && batchOut[i].meta ? Number(batchOut[i].meta.changes || 0) : 0;
      };
      return await buildMutationResponse(db, payload, preVer, {
        deletedAssignment: {
          deleted: changesOf(0) > 0,
          assignment_id: assignmentId,
          deleted_assignments: changesOf(0),
          deleted_submissions: changesOf(1)
        },
        deletedMediaUrls: collectDriveUrls(mediaCandidates)
      });
    }

    if (action === 'submitPracticeExercise') {
      const exerciseId = String(payload.exercise_id || '');
      const studentId = String(payload.student_id || '');
      const nowStr = formatViDateTime();

      const existing = await db
        .prepare('SELECT submission_id FROM practice_submissions WHERE exercise_id = ? AND student_id = ? LIMIT 1')
        .bind(exerciseId, studentId)
        .first();
      const subId = existing && existing.submission_id ? String(existing.submission_id) : makeShortId('PRAC_SUB');
      const totalScore = payload.total_score !== undefined ? Number(payload.total_score) : 0;
      const maxScore = payload.max_score !== undefined ? Number(payload.max_score) : 35;
      const rating = String(payload.rating || '');
      const secScoresJson =
        typeof payload.section_scores === 'object'
          ? JSON.stringify(payload.section_scores)
          : String(payload.section_scores_json || '{}');
      const answersJson =
        typeof payload.answers === 'object' ? JSON.stringify(payload.answers) : String(payload.answers_json || '{}');
      const manualGradesJson =
        typeof payload.manual_grades === 'object'
          ? JSON.stringify(payload.manual_grades)
          : String(payload.manual_grades_json || '{}');
      const status = String(payload.status || 'submitted');

      await db
        .prepare('INSERT OR REPLACE INTO practice_submissions (submission_id, exercise_id, student_id, student_name, total_score, max_score, rating, submitted_at, section_scores_json, answers_json, manual_grades_json, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          subId,
          exerciseId,
          studentId,
          String(payload.student_name || ''),
          totalScore,
          maxScore,
          rating,
          nowStr,
          secScoresJson,
          answersJson,
          manualGradesJson,
          status
        )
        .run();

      return await buildMutationResponse(db, payload, preVer, {
        practiceSubmission: { submission_id: subId, status: status }
      });
    }

    if (action === 'gradeManualTranslation') {
      const subId = String(payload.submission_id || '');
      const existing = await db
        .prepare('SELECT * FROM practice_submissions WHERE submission_id = ? LIMIT 1')
        .bind(subId)
        .first();
      if (!existing) {
        return await buildMutationResponse(db, payload, preVer, { practiceSubmission: null });
      }
      const nextScore = payload.total_score !== undefined ? Number(payload.total_score) : Number(existing.total_score || 0);
      const nextRating = payload.rating ? String(payload.rating) : String(existing.rating || '');
      const nextManualGrades =
        typeof payload.manual_grades === 'object'
          ? JSON.stringify(payload.manual_grades)
          : String(payload.manual_grades_json || existing.manual_grades_json || '{}');

      await db
        .prepare("UPDATE practice_submissions SET total_score = ?, rating = ?, manual_grades_json = ?, status = 'graded' WHERE submission_id = ?")
        .bind(nextScore, nextRating, nextManualGrades, subId)
        .run();

      return await buildMutationResponse(db, payload, preVer, {
        practiceSubmission: { submission_id: subId, status: 'graded', total_score: nextScore }
      });
    }

    if (action === 'savePracticeExercise') {
      const ex = payload.exercise || payload;
      const exId = String(ex.exercise_id || ('EX_' + Date.now()));
      const nowStr = formatViDateTime();
      const cleanTitle = String(ex.title || '').trim() || 'Bài tập mới';
      const cleanTag = String(ex.lesson_tag || '').trim() || 'Bài 1';
      const totalScore = Number(ex.total_score) || 35;
      const thresholdsJson =
        typeof ex.thresholds === 'object'
          ? JSON.stringify(ex.thresholds)
          : String(ex.thresholds_json || '{"very_good":31,"good":25}');
      const sectionsJson =
        typeof ex.sections === 'object' ? JSON.stringify(ex.sections) : String(ex.sections_json || '[]');
      const formattedAsgTitle = formatPracticeAssignmentTitle(cleanTitle);

      await db.batch([
        db
          .prepare('INSERT OR REPLACE INTO practice_exercises (exercise_id, title, lesson_tag, total_score, thresholds_json, sections_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(exId, cleanTitle, cleanTag, totalScore, thresholdsJson, sectionsJson, nowStr),
        db
          .prepare("UPDATE assignments SET title = ?, lesson_tag = ? WHERE TRIM(exercise_id) = ? AND (TRIM(require_media) = 'practice' OR TRIM(require_media) = '')")
          .bind(formattedAsgTitle, cleanTag, exId)
      ]);

      return await buildMutationResponse(db, payload, preVer, {
        practiceExercise: {
          exercise_id: exId,
          title: cleanTitle,
          lesson_tag: cleanTag,
          total_score: totalScore,
          thresholds: typeof ex.thresholds === 'object' ? ex.thresholds : undefined,
          sections: Array.isArray(ex.sections) ? ex.sections : undefined,
          updated_at: nowStr
        }
      });
    }

    if (action === 'deletePracticeExercise') {
      const exId = String(payload.exercise_id || '').trim();
      const existing = await db
        .prepare('SELECT sections_json FROM practice_exercises WHERE exercise_id = ? LIMIT 1')
        .bind(exId)
        .first();
      const deletedMediaUrls = existing ? collectPracticeMediaUrls(existing.sections_json) : [];
      const res = await db.prepare('DELETE FROM practice_exercises WHERE exercise_id = ?').bind(exId).run();
      const deleted = res && res.meta ? Number(res.meta.changes || 0) > 0 : false;
      return await buildMutationResponse(db, payload, preVer, {
        deleted: deleted,
        exercise_id: exId,
        deletedMediaUrls: deletedMediaUrls
      });
    }

    return jsonResponse({ ok: false, error: 'Yêu cầu không hợp lệ.' }, 400);
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        backend: 'cloudflare-d1',
        error: 'Không thể xử lý yêu cầu D1 lúc này. Vui lòng thử lại sau.'
      },
      500
    );
  }
}

export async function onRequest(context) {
  return await handleApiRequest(context.request, context.env, context);
}
