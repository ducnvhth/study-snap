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
  "CREATE TABLE IF NOT EXISTS submissions (submission_id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL, student_id TEXT NOT NULL, submitted_at TEXT NOT NULL DEFAULT '', student_note TEXT NOT NULL DEFAULT '', media_type TEXT NOT NULL DEFAULT 'audio', media_url TEXT NOT NULL DEFAULT '', media_duration TEXT NOT NULL DEFAULT '01:00', status TEXT NOT NULL DEFAULT 'submitted', score TEXT NOT NULL DEFAULT '', teacher_comment TEXT NOT NULL DEFAULT '', teacher_voice_url TEXT NOT NULL DEFAULT '', teacher_voice_duration TEXT NOT NULL DEFAULT '', graded_at TEXT NOT NULL DEFAULT '', practice_count INTEGER NOT NULL DEFAULT 0, attempt_number INTEGER NOT NULL DEFAULT 1)",
  "CREATE TABLE IF NOT EXISTS exit_tickets (record_id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL, student_id TEXT NOT NULL, student_name TEXT NOT NULL DEFAULT '', score REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0, submitted_at TEXT NOT NULL DEFAULT '', answers_json TEXT NOT NULL DEFAULT '[]')",
  "CREATE TABLE IF NOT EXISTS vocabulary (vocab_id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL, lesson_title TEXT NOT NULL DEFAULT '', word TEXT NOT NULL, ipa TEXT NOT NULL DEFAULT '', part_of_speech TEXT NOT NULL DEFAULT '', meaning_vi TEXT NOT NULL DEFAULT '', example_en TEXT NOT NULL DEFAULT '', example_vi TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS practice_exercises (exercise_id TEXT PRIMARY KEY, title TEXT NOT NULL, lesson_tag TEXT NOT NULL DEFAULT '', total_score REAL NOT NULL DEFAULT 35, thresholds_json TEXT NOT NULL DEFAULT '{\"very_good\":31,\"good\":25}', sections_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS practice_submissions (submission_id TEXT PRIMARY KEY, exercise_id TEXT NOT NULL, student_id TEXT NOT NULL, student_name TEXT NOT NULL DEFAULT '', total_score REAL NOT NULL DEFAULT 0, max_score REAL NOT NULL DEFAULT 35, rating TEXT NOT NULL DEFAULT '', submitted_at TEXT NOT NULL DEFAULT '', section_scores_json TEXT NOT NULL DEFAULT '{}', answers_json TEXT NOT NULL DEFAULT '{}', manual_grades_json TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'submitted')",
  "CREATE TABLE IF NOT EXISTS auth_sessions (session_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, role TEXT NOT NULL, refresh_hash TEXT NOT NULL, prev_refresh_hash TEXT NOT NULL DEFAULT '', prev_refresh_until INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, last_used_at INTEGER NOT NULL, user_agent TEXT NOT NULL DEFAULT '')",
  'CREATE TABLE IF NOT EXISTS login_attempts (attempt_key TEXT PRIMARY KEY, fail_count INTEGER NOT NULL DEFAULT 0, first_fail_at INTEGER NOT NULL, locked_until INTEGER NOT NULL DEFAULT 0)'
];

const SCHEMA_INDEX_STATEMENTS = [
  'CREATE INDEX IF NOT EXISTS idx_students_username ON students(username)',
  'CREATE INDEX IF NOT EXISTS idx_assignments_exercise ON assignments(exercise_id)',
  'CREATE INDEX IF NOT EXISTS idx_submissions_asg_stu ON submissions(assignment_id, student_id)',
  'CREATE INDEX IF NOT EXISTS idx_submissions_stu ON submissions(student_id)',
  'CREATE INDEX IF NOT EXISTS idx_exit_tickets_stu ON exit_tickets(student_id)',
  'CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson ON vocabulary(lesson_id)',
  'CREATE INDEX IF NOT EXISTS idx_practice_subs_ex_stu ON practice_submissions(exercise_id, student_id)',
  'CREATE INDEX IF NOT EXISTS idx_practice_subs_stu ON practice_submissions(student_id)',
  'CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id, role)'
];

const DEFAULT_TEACHER = {
  teacher_id: 'GV01',
  full_name: 'Hồ Châu Uyển Nhi',
  username: 'gv_uyennhi',
  password: '123456',
  subject: 'Tiếng Trung Giao Tiếp & HSK'
};

const ACCESS_COOKIE_NAME = 'ss_access';
const REFRESH_COOKIE_NAME = 'ss_refresh';
const ACCESS_TTL_SEC = 900; // 15 minutes
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // 7 days
const LOGIN_MAX_FAILS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const PBKDF2_PREFIX = 'pbkdf2_v1$';

const initializedDatabases = new WeakSet();

function jsonResponse(obj, status = 200, extraHeaders, setCookies) {
  const headers = new Headers(
    Object.assign(
      {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      },
      extraHeaders || {}
    )
  );
  if (Array.isArray(setCookies)) {
    setCookies.forEach(function (c) {
      if (c) headers.append('Set-Cookie', c);
    });
  }
  return new Response(JSON.stringify(obj), { status, headers });
}

function withSessionCookies(response, setCookies) {
  if (!response || !Array.isArray(setCookies) || setCookies.length === 0) return response;
  const headers = new Headers(response.headers);
  setCookies.forEach(function (c) {
    if (c) headers.append('Set-Cookie', c);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

function bytesToHex(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = '';
  for (let i = 0; i < arr.length; i++) {
    out += arr[i].toString(16).padStart(2, '0');
  }
  return out;
}

function hexToBytes(hex) {
  const clean = String(hex || '').trim();
  if (!clean || clean.length % 2 !== 0) return new Uint8Array(0);
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return out;
}

function toBase64Url(bytesInput) {
  const bytes = bytesInput instanceof Uint8Array ? bytesInput : new Uint8Array(bytesInput);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  const clean = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = clean.length % 4 === 0 ? '' : '='.repeat(4 - (clean.length % 4));
  const bin = atob(clean + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqualBytes(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function randomTokenUrl(byteLen) {
  const bytes = new Uint8Array(byteLen || 32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(String(text || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

function isPasswordHashed(stored) {
  return String(stored || '').indexOf(PBKDF2_PREFIX) === 0;
}

async function hashPassword(plainPassword, iterations) {
  const raw = String(plainPassword || '');
  const iter = Math.min(100000, Math.max(1000, Number(iterations) || 100000));
  if (isPasswordHashed(raw)) return raw;
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(raw),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return PBKDF2_PREFIX + iter + '$' + bytesToHex(salt) + '$' + bytesToHex(new Uint8Array(bits));
}

async function verifyPassword(plainInput, storedVal) {
  const plain = String(plainInput || '').trim();
  const stored = String(storedVal || '').trim();
  if (!plain || !stored) return { valid: false, needsUpgrade: false };

  if (isPasswordHashed(stored)) {
    const parts = stored.split('$');
    if (parts.length !== 4) return { valid: false, needsUpgrade: false };
    const iter = parseInt(parts[1], 10);
    const salt = hexToBytes(parts[2]);
    const expected = hexToBytes(parts[3]);
    if (!iter || iter < 1000 || iter > 100000 || salt.length === 0 || expected.length !== 32) {
      return { valid: false, needsUpgrade: false };
    }
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(plain),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    const valid = timingSafeEqualBytes(new Uint8Array(derived), expected);
    return { valid: valid, needsUpgrade: valid && iter < 100000 };
  }

  if (stored.indexOf('sha256_v1$') === 0) {
    const parts = stored.split('$');
    if (parts.length !== 3 || !parts[1] || !parts[2]) return { valid: false, needsUpgrade: false };
    const actualHex = await sha256Hex(parts[1] + ':' + plain);
    const valid = timingSafeEqualBytes(hexToBytes(actualHex), hexToBytes(parts[2]));
    return { valid: valid, needsUpgrade: valid };
  }

  const a = new TextEncoder().encode(plain);
  const b = new TextEncoder().encode(stored);
  const sameLen = a.length === b.length;
  const maxLen = Math.max(a.length, b.length, 1);
  let diff = sameLen ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    diff |= (a[i] || 0) ^ (b[i] || 0);
  }
  const valid = diff === 0;
  return { valid: valid, needsUpgrade: valid };
}

function parseCookies(request) {
  const out = {};
  const raw = request && request.headers ? String(request.headers.get('cookie') || '') : '';
  if (!raw) return out;
  raw.split(';').forEach(function (part) {
    const idx = part.indexOf('=');
    if (idx <= 0) return;
    const name = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!name) return;
    try {
      out[name] = decodeURIComponent(val);
    } catch (e) {
      out[name] = val;
    }
  });
  return out;
}

function buildCookieString(name, value, maxAgeSec, isHttps) {
  const attrs = [
    name + '=' + encodeURIComponent(value),
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + Math.max(0, Math.floor(Number(maxAgeSec) || 0))
  ];
  if (isHttps) attrs.push('Secure');
  return attrs.join('; ');
}

function buildSessionSetCookies(url, accessToken, refreshToken) {
  const isHttps = Boolean(url && url.protocol === 'https:');
  return [
    buildCookieString(ACCESS_COOKIE_NAME, accessToken, ACCESS_TTL_SEC, isHttps),
    buildCookieString(REFRESH_COOKIE_NAME, refreshToken, REFRESH_TTL_SEC, isHttps)
  ];
}

function buildClearSessionCookies(url) {
  const isHttps = Boolean(url && url.protocol === 'https:');
  return [
    buildCookieString(ACCESS_COOKIE_NAME, '', 0, isHttps),
    buildCookieString(REFRESH_COOKIE_NAME, '', 0, isHttps)
  ];
}

async function getAuthHmacSecret(db, env) {
  const envSecret = env && (env.AUTH_SECRET || env.SESSION_SECRET);
  if (envSecret && String(envSecret).trim().length >= 16) {
    return String(envSecret).trim();
  }
  const row = await db.prepare("SELECT value FROM app_meta WHERE key = 'auth_hmac_secret' LIMIT 1").first();
  if (row && row.value && String(row.value).length >= 32) {
    return String(row.value);
  }
  const generated = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  await db
    .prepare("INSERT OR IGNORE INTO app_meta (key, value) VALUES ('auth_hmac_secret', ?)")
    .bind(generated)
    .run();
  const stored = await db.prepare("SELECT value FROM app_meta WHERE key = 'auth_hmac_secret' LIMIT 1").first();
  return stored && stored.value ? String(stored.value) : generated;
}

async function importHmacKey(secretText) {
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(secretText || '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signAccessToken(secretText, payloadObj) {
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payloadObj)));
  const key = await importHmacKey(secretText);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  return payloadB64 + '.' + toBase64Url(new Uint8Array(sig));
}

async function verifyAccessToken(secretText, tokenStr) {
  try {
    const parts = String(tokenStr || '').split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const key = await importHmacKey(secretText);
    const sigBytes = fromBase64Url(parts[1]);
    const ok = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(parts[0]));
    if (!ok) return null;
    const decoded = new TextDecoder().decode(fromBase64Url(parts[0]));
    const data = JSON.parse(decoded);
    if (!data || !data.sid || !data.uid || !data.role || !data.exp) return null;
    if (Number(data.exp) <= Date.now()) return null;
    return data;
  } catch (e) {
    return null;
  }
}

async function loadUserBySessionIdentity(db, role, userId) {
  const uid = String(userId || '').trim();
  if (!uid) return null;
  if (role === 'teacher') {
    const t = await db
      .prepare('SELECT teacher_id, full_name, username, subject FROM teachers WHERE teacher_id = ? LIMIT 1')
      .bind(uid)
      .first();
    if (!t) return null;
    return {
      role: 'teacher',
      id: t.teacher_id,
      full_name: t.full_name,
      username: t.username,
      subject: t.subject || 'Giáo viên phụ trách'
    };
  }
  if (role === 'student') {
    const s = await db
      .prepare('SELECT student_id, full_name, class_name, avatar_initials, username FROM students WHERE student_id = ? LIMIT 1')
      .bind(uid)
      .first();
    if (!s) return null;
    return {
      role: 'student',
      id: s.student_id,
      student_id: s.student_id,
      full_name: s.full_name,
      username: s.username || String(s.student_id || '').toLowerCase(),
      class_name: s.class_name,
      avatar_initials: s.avatar_initials
    };
  }
  return null;
}

async function createAuthSession(db, env, url, user, request) {
  const now = Date.now();
  const sid = 'SES_' + randomTokenUrl(18);
  const refreshSecret = randomTokenUrl(32);
  const refreshHash = await sha256Hex(refreshSecret);
  const expiresAt = now + REFRESH_TTL_SEC * 1000;
  const ua = request && request.headers ? String(request.headers.get('user-agent') || '').slice(0, 180) : '';
  const uid = String(user.student_id || user.id || '');
  const role = String(user.role || '');

  await db
    .prepare('INSERT INTO auth_sessions (session_id, user_id, role, refresh_hash, expires_at, revoked, created_at, last_used_at, user_agent) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)')
    .bind(sid, uid, role, refreshHash, expiresAt, now, now, ua)
    .run();

  const hmacSecret = await getAuthHmacSecret(db, env);
  const accessToken = await signAccessToken(hmacSecret, {
    sid: sid,
    uid: uid,
    role: role,
    exp: now + ACCESS_TTL_SEC * 1000
  });
  const refreshCookieVal = sid + '.' + refreshSecret;

  return {
    sessionId: sid,
    expiresAt: expiresAt,
    setCookies: buildSessionSetCookies(url, accessToken, refreshCookieVal)
  };
}

async function resolveRequestSession(request, db, env, url) {
  const cookies = parseCookies(request);
  const rawAccess = cookies[ACCESS_COOKIE_NAME] || '';
  const rawRefresh = cookies[REFRESH_COOKIE_NAME] || '';
  const hasAnyCookie = Boolean(rawAccess || rawRefresh);
  if (!hasAnyCookie) {
    return { session: null, user: null, setCookies: [], hadInvalidCookies: false };
  }

  const now = Date.now();
  const hmacSecret = await getAuthHmacSecret(db, env);

  if (rawAccess) {
    const verified = await verifyAccessToken(hmacSecret, rawAccess);
    if (verified) {
      const sesRow = await db
        .prepare('SELECT session_id, user_id, role, expires_at, revoked FROM auth_sessions WHERE session_id = ? LIMIT 1')
        .bind(String(verified.sid))
        .first();
      if (sesRow && Number(sesRow.revoked || 0) === 0 && Number(sesRow.expires_at || 0) > now) {
        const user = await loadUserBySessionIdentity(db, verified.role, verified.uid);
        if (user) {
          return {
            session: {
              sid: sesRow.session_id,
              uid: String(user.student_id || user.id),
              role: user.role,
              expiresAt: Number(sesRow.expires_at)
            },
            user: user,
            setCookies: [],
            hadInvalidCookies: false
          };
        }
      }
    }
  }

  if (rawRefresh) {
    const dotIdx = rawRefresh.indexOf('.');
    if (dotIdx > 0) {
      const sid = rawRefresh.slice(0, dotIdx);
      const rawSecret = rawRefresh.slice(dotIdx + 1);
      if (sid && rawSecret) {
        const sesRow = await db
          .prepare('SELECT session_id, user_id, role, refresh_hash, prev_refresh_hash, prev_refresh_until, expires_at, revoked FROM auth_sessions WHERE session_id = ? LIMIT 1')
          .bind(sid)
          .first();
        if (sesRow && Number(sesRow.revoked || 0) === 0 && Number(sesRow.expires_at || 0) > now) {
          const presentedHash = await sha256Hex(rawSecret);
          const actualBytes = hexToBytes(presentedHash);
          const expectedBytes = hexToBytes(sesRow.refresh_hash);
          const matchesCurrent = timingSafeEqualBytes(actualBytes, expectedBytes);
          const matchesPrev =
            !matchesCurrent &&
            sesRow.prev_refresh_hash &&
            Number(sesRow.prev_refresh_until || 0) >= now &&
            timingSafeEqualBytes(actualBytes, hexToBytes(sesRow.prev_refresh_hash));

          if (matchesCurrent || matchesPrev) {
            const user = await loadUserBySessionIdentity(db, sesRow.role, sesRow.user_id);
            if (user) {
              if (matchesCurrent) {
                const nextRefreshSecret = randomTokenUrl(32);
                const nextRefreshHash = await sha256Hex(nextRefreshSecret);
                const nextExpiresAt = now + REFRESH_TTL_SEC * 1000;
                const graceUntil = now + 20000;
                await db
                  .prepare('UPDATE auth_sessions SET refresh_hash = ?, prev_refresh_hash = ?, prev_refresh_until = ?, expires_at = ?, last_used_at = ? WHERE session_id = ?')
                  .bind(nextRefreshHash, sesRow.refresh_hash, graceUntil, nextExpiresAt, now, sid)
                  .run();
                const nextAccessToken = await signAccessToken(hmacSecret, {
                  sid: sid,
                  uid: String(user.student_id || user.id),
                  role: user.role,
                  exp: now + ACCESS_TTL_SEC * 1000
                });
                return {
                  session: {
                    sid: sid,
                    uid: String(user.student_id || user.id),
                    role: user.role,
                    expiresAt: nextExpiresAt
                  },
                  user: user,
                  setCookies: buildSessionSetCookies(url, nextAccessToken, sid + '.' + nextRefreshSecret),
                  hadInvalidCookies: false
                };
              }
              // Concurrent sibling request within 20s grace window: mint fresh ss_access without clobbering rotated refresh_hash
              const siblingAccessToken = await signAccessToken(hmacSecret, {
                sid: sid,
                uid: String(user.student_id || user.id),
                role: user.role,
                exp: now + ACCESS_TTL_SEC * 1000
              });
              return {
                session: {
                  sid: sid,
                  uid: String(user.student_id || user.id),
                  role: user.role,
                  expiresAt: Number(sesRow.expires_at)
                },
                user: user,
                setCookies: [
                  buildCookieString(ACCESS_COOKIE_NAME, siblingAccessToken, ACCESS_TTL_SEC, url.protocol === 'https:')
                ],
                hadInvalidCookies: false
              };
            }
          } else {
            // Possible stolen refresh token replay after grace window: revoke session
            await db.prepare('UPDATE auth_sessions SET revoked = 1 WHERE session_id = ?').bind(sid).run();
          }
        }
      }
    }
  }

  return {
    session: null,
    user: null,
    setCookies: buildClearSessionCookies(url),
    hadInvalidCookies: true
  };
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

function extractDriveIdSimple(url) {
  const s = String(url || '').trim();
  const m = s.match(/[?&](?:id|fileId)=([a-zA-Z0-9_-]+)/) || s.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m && m[1] ? m[1] : '';
}

async function filterUnreferencedDriveUrls(db, candidates) {
  const list = collectDriveUrls(candidates);
  if (list.length === 0) return [];
  const subUrlsRes = await db
    .prepare("SELECT media_url, teacher_voice_url FROM submissions WHERE media_url != '' OR teacher_voice_url != ''")
    .all();
  const stillUrls = new Set();
  const stillIds = new Set();
  (subUrlsRes && subUrlsRes.results ? subUrlsRes.results : []).forEach(function (r) {
    [r.media_url, r.teacher_voice_url].forEach(function (u) {
      const clean = String(u || '').trim();
      if (!clean) return;
      stillUrls.add(clean);
      const fid = extractDriveIdSimple(clean);
      if (fid) stillIds.add(fid);
    });
  });
  return list.filter(function (u) {
    if (stillUrls.has(u)) return false;
    const fid = extractDriveIdSimple(u);
    if (fid && stillIds.has(fid)) return false;
    return true;
  });
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
    if (sec.data.image_url) candidates.push(sec.data.image_url);
    if (Array.isArray(sec.data.items)) {
      sec.data.items.forEach(function (item) {
        if (item && item.audio_url) candidates.push(item.audio_url);
        if (item && item.image_url) candidates.push(item.image_url);
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
  try {
    await db.prepare('ALTER TABLE submissions ADD COLUMN practice_count INTEGER NOT NULL DEFAULT 0').run();
  } catch (e) {
    // Column practice_count already exists on existing D1 table
  }
  try {
    await db.prepare('ALTER TABLE submissions ADD COLUMN attempt_number INTEGER NOT NULL DEFAULT 1').run();
  } catch (e) {
    // Column attempt_number already exists on existing D1 table
  }
  try {
    await db.prepare("ALTER TABLE auth_sessions ADD COLUMN prev_refresh_hash TEXT NOT NULL DEFAULT ''").run();
  } catch (e) {
    // Column prev_refresh_hash already exists
  }
  try {
    await db.prepare('ALTER TABLE auth_sessions ADD COLUMN prev_refresh_until INTEGER NOT NULL DEFAULT 0').run();
  } catch (e) {
    // Column prev_refresh_until already exists
  }
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

function sanitizePracticeExerciseForStudent(exRow, hasSubmitted) {
  if (!exRow) return exRow;
  let sections = [];
  try {
    sections = typeof exRow.sections_json === 'string'
      ? JSON.parse(exRow.sections_json || '[]')
      : (Array.isArray(exRow.sections) ? exRow.sections : []);
  } catch (e) {
    sections = [];
  }

  const sanitizedSections = (Array.isArray(sections) ? sections : []).map(function (sec) {
    const secCopy = Object.assign({}, sec);
    const data = Object.assign({}, sec && sec.data ? sec.data : {});
    if (!hasSubmitted) {
      if (sec.type === 'matching') {
        delete data.answer;
      } else if (Array.isArray(data.items)) {
        data.items = data.items.map(function (item) {
          const cleanItem = Object.assign({}, item);
          delete cleanItem.correctIndex;
          delete cleanItem.answer;
          delete cleanItem.accepted;
          delete cleanItem.required_keywords;
          delete cleanItem.explanation;
          delete cleanItem.grading_note;
          return cleanItem;
        });
      }
    } else if (Array.isArray(data.items)) {
      data.items = data.items.map(function (item) {
        const cleanItem = Object.assign({}, item);
        delete cleanItem.grading_note;
        if (cleanItem.mode === 'manual' || (sec.type === 'short_answer' && (!Array.isArray(cleanItem.accepted) || cleanItem.accepted.length === 0))) {
          delete cleanItem.accepted;
          delete cleanItem.required_keywords;
        }
        return cleanItem;
      });
    }
    secCopy.data = data;
    return secCopy;
  });

  return Object.assign({}, exRow, {
    sections_json: JSON.stringify(sanitizedSections)
  });
}

async function getBootstrapData(db, metaOverride, session) {
  const meta = metaOverride || (await getMetaMap(db));
  const batchRes = await db.batch([
    db.prepare('SELECT teacher_id, full_name, username, subject FROM teachers ORDER BY rowid ASC'),
    db.prepare('SELECT class_id, class_name, created_at FROM classes ORDER BY rowid ASC'),
    db.prepare('SELECT student_id, full_name, class_name, avatar_initials, username, created_at FROM students ORDER BY rowid ASC'),
    db.prepare('SELECT assignment_id, title, lesson_tag, due_date, description, require_media, session_tag, class_name, exercise_id, lesson_id FROM assignments ORDER BY rowid ASC'),
    db.prepare('SELECT submission_id, assignment_id, student_id, submitted_at, student_note, media_type, media_url, media_duration, status, score, teacher_comment, teacher_voice_url, teacher_voice_duration, graded_at, practice_count, COALESCE(attempt_number, 1) AS attempt_number FROM submissions ORDER BY COALESCE(attempt_number, 1) ASC, rowid ASC'),
    db.prepare('SELECT record_id, ticket_id, student_id, student_name, score, total, submitted_at, answers_json FROM exit_tickets ORDER BY rowid ASC'),
    db.prepare('SELECT vocab_id, lesson_id, lesson_title, word, ipa, part_of_speech, meaning_vi, example_en, example_vi FROM vocabulary ORDER BY rowid ASC'),
    db.prepare('SELECT exercise_id, title, lesson_tag, total_score, thresholds_json, sections_json, created_at FROM practice_exercises ORDER BY rowid ASC'),
    db.prepare('SELECT submission_id, exercise_id, student_id, student_name, total_score, max_score, rating, submitted_at, section_scores_json, answers_json, manual_grades_json, status FROM practice_submissions ORDER BY rowid ASC')
  ]);

  const rows = function (idx) {
    return batchRes[idx] && Array.isArray(batchRes[idx].results) ? batchRes[idx].results : [];
  };

  const allClasses = rows(1).filter(function (c) {
    return isValidRealClassName(c && c.class_name);
  });

  if (session && session.role === 'student') {
    const uid = String(session.uid || '').trim();
    const myStudent = rows(2).find(function (s) {
      return String(s.student_id || '').trim() === uid;
    });
    const myClassLower = myStudent ? String(myStudent.class_name || '').trim().toLowerCase() : '';

    const mySubs = rows(4).filter(function (sub) {
      return String(sub.student_id || '').trim() === uid;
    });
    const myExitLogs = rows(5).filter(function (lg) {
      return String(lg.student_id || '').trim() === uid;
    });
    const myPracticeSubs = rows(8).filter(function (ps) {
      return String(ps.student_id || '').trim() === uid;
    });
    const submittedExSet = new Set(
      myPracticeSubs.map(function (ps) { return String(ps.exercise_id || '').trim(); }).filter(Boolean)
    );
    const myAssignments = rows(3).filter(function (asg) {
      const cls = String(asg.class_name || '').trim().toLowerCase();
      return cls === 'all' || (myClassLower && cls === myClassLower);
    });
    const myExercises = rows(7).map(function (ex) {
      const exId = String(ex.exercise_id || '').trim();
      return sanitizePracticeExerciseForStudent(ex, submittedExSet.has(exId));
    });

    return {
      isProduction: meta.is_production === 'true',
      teachers: rows(0).map(function (t) {
        return {
          teacher_id: t.teacher_id,
          full_name: t.full_name,
          subject: t.subject
        };
      }),
      classes: allClasses.filter(function (c) {
        return !myClassLower || String(c.class_name || '').trim().toLowerCase() === myClassLower;
      }),
      students: myStudent ? [myStudent] : [],
      assignments: myAssignments,
      submissions: mySubs,
      exitTicketLogs: myExitLogs,
      vocabulary: rows(6),
      practiceExercises: myExercises,
      practiceSubmissions: myPracticeSubs
    };
  }

  return {
    isProduction: meta.is_production === 'true',
    teachers: rows(0),
    classes: allClasses,
    students: rows(2),
    assignments: rows(3),
    submissions: rows(4),
    exitTicketLogs: rows(5),
    vocabulary: rows(6),
    practiceExercises: rows(7),
    practiceSubmissions: rows(8)
  };
}

async function buildMutationResponse(db, payload, preVer, extraFields, session, setCookies) {
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
    out.data = await getBootstrapData(db, null, session);
  }
  return jsonResponse(out, 200, null, setCookies);
}

function isValidRealClassName(name) {
  const clean = String(name || '').trim();
  if (!clean) return false;
  const lower = clean.toLowerCase();
  return (
    lower !== 'chưa xếp lớp' &&
    lower !== 'chua xep lop' &&
    lower !== 'all' &&
    lower !== 'unassigned'
  );
}

async function ensureClassRecord(db, className) {
  const clean = String(className || '').trim();
  if (!isValidRealClassName(clean)) return;
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

async function handleSetupDatabase(db, session) {
  const meta = await getMetaMap(db);
  const countRow = await db.prepare('SELECT COUNT(*) AS cnt FROM teachers').first();
  const hasTeachers = countRow && Number(countRow.cnt) > 0;
  if ((meta.d1_bootstrapped === '1' || hasTeachers) && (!session || session.role !== 'teacher')) {
    return jsonResponse({ ok: false, error: 'Chỉ Giáo viên đã đăng nhập mới có quyền khởi tạo lại cấu trúc.' }, session ? 403 : 401);
  }
  if (!hasTeachers) {
    const hashedDefaultPwd = await hashPassword(DEFAULT_TEACHER.password, 100000);
    await db
      .prepare('INSERT OR IGNORE INTO teachers (teacher_id, full_name, username, password, subject) VALUES (?, ?, ?, ?, ?)')
      .bind(
        DEFAULT_TEACHER.teacher_id,
        DEFAULT_TEACHER.full_name,
        DEFAULT_TEACHER.username,
        hashedDefaultPwd,
        DEFAULT_TEACHER.subject
      )
      .run();
  }
  await db.batch([
    db.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('is_production', 'true')"),
    db.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('d1_bootstrapped', '1')")
  ]);
  const nextVer = await bumpDataVersion(db);
  if (session && session.role === 'teacher') {
    const data = await getBootstrapData(db, null, session);
    return jsonResponse({
      ok: true,
      backend: 'cloudflare-d1',
      version: nextVer,
      message: 'Đã khởi tạo cơ sở dữ liệu Cloudflare D1 với tài khoản Giáo viên: Hồ Châu Uyển Nhi (gv_uyennhi).',
      data: data
    });
  }
  return jsonResponse({
    ok: true,
    backend: 'cloudflare-d1',
    version: nextVer,
    bootstrapped: true,
    message: 'Đã khởi tạo cơ sở dữ liệu Cloudflare D1 với tài khoản Giáo viên: Hồ Châu Uyển Nhi (gv_uyennhi).'
  });
}

async function handleImportFromBootstrapData(db, payload, session, env) {
  const meta = await getMetaMap(db);
  const teacherCntRow = await db.prepare('SELECT COUNT(*) AS cnt FROM teachers').first();
  const hasExistingTeachers = teacherCntRow && Number(teacherCntRow.cnt) > 0;
  const alreadyBootstrapped = meta.d1_bootstrapped === '1' || hasExistingTeachers;

  if (alreadyBootstrapped) {
    if (!session || session.role !== 'teacher') {
      return jsonResponse({ ok: false, error: 'Bạn cần đăng nhập quyền Giáo viên để thực hiện thao tác đồng bộ dữ liệu.' }, session ? 403 : 401);
    }
    if (payload.forceOverwrite !== true) {
      return jsonResponse({
        ok: true,
        backend: 'cloudflare-d1',
        skipped: true,
        version: await getDataVersion(db, meta),
        data: await getBootstrapData(db, meta, session)
      });
    }
    const adminSecret = env && env.ADMIN_SECRET ? String(env.ADMIN_SECRET).trim() : '';
    if (adminSecret && String(payload.admin_secret || '').trim() !== adminSecret) {
      return jsonResponse({ ok: false, error: 'Thiếu hoặc sai mã bảo mật quản trị (admin_secret) để ghi đè toàn bộ cơ sở dữ liệu.' }, 403);
    }
  }

  const src = payload && payload.data && typeof payload.data === 'object' ? payload.data : {};
  const statements = [];

  if (alreadyBootstrapped && payload.forceOverwrite === true) {
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
  for (let idx = 0; idx < teachers.length; idx++) {
    const t = teachers[idx];
    const rawPwd = String(t.password !== undefined && t.password !== null ? t.password : '123456');
    const hashedTeacherPwd = await hashPassword(rawPwd, 100000);
    statements.push(
      db
        .prepare('INSERT OR REPLACE INTO teachers (teacher_id, full_name, username, password, subject) VALUES (?, ?, ?, ?, ?)')
        .bind(
          String(t.teacher_id || ('GV0' + (idx + 1))),
          String(t.full_name || 'Giáo viên'),
          String(t.username || ('gv_' + (idx + 1))),
          hashedTeacherPwd,
          String(t.subject || 'Tiếng Trung Giao Tiếp & HSK')
        )
    );
  }

  const seenClasses = new Set();
  const queueClass = function (clsObj) {
    const cname = String((clsObj && clsObj.class_name) || clsObj || '').trim();
    if (!isValidRealClassName(cname)) return;
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
  const studentIter = students.length > 5 ? 10000 : 100000;
  for (let idx = 0; idx < students.length; idx++) {
    const s = students[idx];
    const stId = String(s.student_id || ('HS' + String(idx + 1).padStart(2, '0')));
    const cname = String(s.class_name || '');
    const rawStuPwd = String(s.password !== undefined && s.password !== null ? s.password : '123456');
    const hashedStuPwd = await hashPassword(rawStuPwd, studentIter);
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
          hashedStuPwd,
          String(s.created_at || formatViDate())
        )
    );
  }

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
        .prepare('INSERT OR REPLACE INTO submissions (submission_id, assignment_id, student_id, submitted_at, student_note, media_type, media_url, media_duration, status, score, teacher_comment, teacher_voice_url, teacher_voice_duration, graded_at, practice_count, attempt_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
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
          String(s.graded_at || ''),
          Math.max(0, Number(s.practice_count || 0) || 0),
          Math.max(1, Number(s.attempt_number || 1) || 1)
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
  if (session && session.role === 'teacher') {
    const data = await getBootstrapData(db, null, session);
    return jsonResponse({
      ok: true,
      backend: 'cloudflare-d1',
      imported: true,
      version: nextVer,
      data: data
    });
  }
  return jsonResponse({
    ok: true,
    backend: 'cloudflare-d1',
    imported: true,
    bootstrapped: true,
    version: nextVer
  });
}

async function getLoginAttemptKey(request, username) {
  const ip = request && request.headers ? String(request.headers.get('cf-connecting-ip') || '').trim() : '';
  return 'u:' + String(username || '').toLowerCase() + (ip ? '|ip:' + ip : '');
}

async function checkLoginRateLimit(db, attemptKey) {
  const row = await db
    .prepare('SELECT fail_count, first_fail_at, locked_until FROM login_attempts WHERE attempt_key = ? LIMIT 1')
    .bind(attemptKey)
    .first();
  if (!row) return { limited: false };
  const now = Date.now();
  const lockedUntil = Number(row.locked_until || 0);
  if (lockedUntil > now) {
    const waitMin = Math.max(1, Math.ceil((lockedUntil - now) / 60000));
    return {
      limited: true,
      message: 'Bạn đã nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau khoảng ' + waitMin + ' phút.'
    };
  }
  return { limited: false };
}

async function recordLoginFailure(db, attemptKey) {
  const now = Date.now();
  const row = await db
    .prepare('SELECT fail_count, first_fail_at FROM login_attempts WHERE attempt_key = ? LIMIT 1')
    .bind(attemptKey)
    .first();
  let failCount = 1;
  let firstFailAt = now;
  if (row && now - Number(row.first_fail_at || 0) <= LOGIN_WINDOW_MS) {
    failCount = Number(row.fail_count || 0) + 1;
    firstFailAt = Number(row.first_fail_at || now);
  }
  const lockedUntil = failCount >= LOGIN_MAX_FAILS ? now + LOGIN_LOCK_MS : 0;
  await db
    .prepare('INSERT OR REPLACE INTO login_attempts (attempt_key, fail_count, first_fail_at, locked_until) VALUES (?, ?, ?, ?)')
    .bind(attemptKey, failCount, firstFailAt, lockedUntil)
    .run();
}

async function clearLoginFailure(db, attemptKey) {
  await db.prepare('DELETE FROM login_attempts WHERE attempt_key = ?').bind(attemptKey).run();
}

async function handleLogin(db, payload, request, env, url) {
  const username = String(payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();
  if (!username || !password) {
    return jsonResponse({
      ok: false,
      error: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.'
    }, 400);
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

  const attemptKey = await getLoginAttemptKey(request, username);
  const limitStatus = await checkLoginRateLimit(db, attemptKey);
  if (limitStatus.limited) {
    return jsonResponse({ ok: false, rateLimited: true, error: limitStatus.message }, 429);
  }

  const teacher = await db
    .prepare('SELECT teacher_id, full_name, username, password, subject FROM teachers WHERE LOWER(TRIM(username)) = ? LIMIT 1')
    .bind(username)
    .first();

  if (teacher) {
    const tCheck = await verifyPassword(password, teacher.password);
    if (tCheck.valid) {
      await clearLoginFailure(db, attemptKey);
      if (tCheck.needsUpgrade) {
        const upgraded = await hashPassword(password, 100000);
        await db.prepare('UPDATE teachers SET password = ? WHERE teacher_id = ?').bind(upgraded, teacher.teacher_id).run();
      }
      const userObj = {
        role: 'teacher',
        id: teacher.teacher_id,
        full_name: teacher.full_name,
        username: teacher.username,
        subject: teacher.subject || 'Giáo viên phụ trách'
      };
      const sesInfo = await createAuthSession(db, env, url, userObj, request);
      return jsonResponse({
        ok: true,
        backend: 'cloudflare-d1',
        version: await getDataVersion(db, meta),
        expiresAt: sesInfo.expiresAt,
        user: userObj
      }, 200, null, sesInfo.setCookies);
    }
  }

  const student = await db
    .prepare('SELECT student_id, full_name, class_name, avatar_initials, username, password FROM students WHERE (LOWER(TRIM(username)) = ? OR LOWER(TRIM(student_id)) = ?) LIMIT 1')
    .bind(username, username)
    .first();

  if (student) {
    const sCheck = await verifyPassword(password, student.password);
    if (sCheck.valid) {
      await clearLoginFailure(db, attemptKey);
      if (sCheck.needsUpgrade) {
        const upgradedStu = await hashPassword(password, 100000);
        await db.prepare('UPDATE students SET password = ? WHERE student_id = ?').bind(upgradedStu, student.student_id).run();
      }
      const userObj = {
        role: 'student',
        id: student.student_id,
        student_id: student.student_id,
        full_name: student.full_name,
        username: student.username || String(student.student_id || '').toLowerCase(),
        class_name: student.class_name,
        avatar_initials: student.avatar_initials
      };
      const sesInfo = await createAuthSession(db, env, url, userObj, request);
      return jsonResponse({
        ok: true,
        backend: 'cloudflare-d1',
        version: await getDataVersion(db, meta),
        expiresAt: sesInfo.expiresAt,
        user: userObj
      }, 200, null, sesInfo.setCookies);
    }
  }

  await recordLoginFailure(db, attemptKey);
  return jsonResponse({
    ok: false,
    error: 'Tên đăng nhập hoặc mật khẩu không chính xác.'
  }, 401);
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

function inferMimeFromFilenameOrHint(fileNameOrDisposition, fallbackMime) {
  const src = String(fileNameOrDisposition || '');
  const extMatch = src.match(/\.([a-z0-9]{2,5})(?:["';\s?]|$)/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';
  const extMap = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    m4a: 'audio/mp4',
    m4b: 'audio/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    caf: 'audio/x-caf',
    amr: 'audio/amr',
    '3gp': 'audio/3gpp',
    ogg: 'audio/ogg',
    oga: 'audio/ogg',
    opus: 'audio/opus',
    flac: 'audio/flac',
    webm: (fallbackMime && String(fallbackMime).toLowerCase().indexOf('video/') === 0) ? 'video/webm' : 'audio/webm',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif'
  };
  if (ext && extMap[ext]) return extMap[ext];
  return '';
}

function normalizeProxyMediaMime(rawContentType, contentDisposition, hintMime) {
  const ct = String(rawContentType || '').split(';')[0].trim().toLowerCase();
  const cleanHint = String(hintMime || '').split(';')[0].trim().toLowerCase();
  if (ct === 'audio/x-m4a' || ct === 'audio/m4a' || ct === 'audio/mp4a-latm') return 'audio/mp4';
  if (ct === 'audio/mp3') return 'audio/mpeg';
  if (ct === 'audio/x-wav' || ct === 'audio/wave') return 'audio/wav';
  if (ct === 'audio/x-aac' || ct === 'audio/x-hx-aac-adts' || ct === 'audio/aacp') return 'audio/aac';
  if (!ct || ct === 'application/octet-stream' || ct === 'binary/octet-stream') {
    const byName = inferMimeFromFilenameOrHint(contentDisposition, cleanHint);
    if (byName) return byName;
    if (cleanHint && (cleanHint.indexOf('video/') === 0 || cleanHint.indexOf('audio/') === 0 || cleanHint.indexOf('image/') === 0)) {
      return cleanHint;
    }
    return 'application/octet-stream';
  }
  return ct;
}

function parseByteRangeHeader(rangeHeader, totalBytes) {
  const clean = String(rangeHeader || '').trim();
  const match = clean.match(/^bytes=(\d*)-(\d*)$/i);
  if (!match || !totalBytes || totalBytes <= 0) return null;
  const startStr = match[1];
  const endStr = match[2];
  let start = 0;
  let end = totalBytes - 1;
  if (startStr === '' && endStr !== '') {
    const suffix = parseInt(endStr, 10);
    if (!isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, totalBytes - suffix);
  } else if (startStr !== '') {
    start = parseInt(startStr, 10);
    if (!isFinite(start) || start < 0 || start >= totalBytes) return null;
    if (endStr !== '') {
      const parsedEnd = parseInt(endStr, 10);
      if (isFinite(parsedEnd) && parsedEnd >= start) {
        end = Math.min(totalBytes - 1, parsedEnd);
      }
    }
  } else {
    return null;
  }
  return { start: start, end: end };
}

async function handleDriveMediaProxy(request, url, ctx) {
  const fileId = String(url.searchParams.get('fileId') || '').trim();
  if (!/^[a-zA-Z0-9_-]{10,120}$/.test(fileId)) {
    return jsonResponse({ ok: false, error: 'Thiếu hoặc sai định dạng fileId.' }, 400);
  }
  const hintMime = url.searchParams.get('mime') || '';
  const bypassCache = url.searchParams.get('nocache') === '1';
  const rangeHeader = request && request.headers ? request.headers.get('range') : null;

  const edgeCache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const cacheKey = new Request('https://studysnap-drive-edge.internal/media/v3/' + encodeURIComponent(fileId), {
    method: 'GET'
  });
  if (edgeCache && !bypassCache) {
    const cached = await edgeCache.match(cacheKey);
    if (cached) {
      if (rangeHeader) {
        try {
          const fullBuf = await cached.arrayBuffer();
          const range = parseByteRangeHeader(rangeHeader, fullBuf.byteLength);
          if (range) {
            const sliceBuf = fullBuf.slice(range.start, range.end + 1);
            const partialHeaders = new Headers(cached.headers);
            partialHeaders.set('Accept-Ranges', 'bytes');
            partialHeaders.set('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + fullBuf.byteLength);
            partialHeaders.set('Content-Length', String(sliceBuf.byteLength));
            partialHeaders.delete('Access-Control-Allow-Origin');
            return new Response(sliceBuf, { status: 206, headers: partialHeaders });
          }
        } catch (rangeErr) {
          // Fall back to serving cached full response
        }
      }
      return cached;
    }
  }

  const driveUrls = [
    'https://drive.usercontent.google.com/download?id=' + encodeURIComponent(fileId) + '&export=download&confirm=t',
    'https://drive.usercontent.google.com/uc?id=' + encodeURIComponent(fileId) + '&export=download',
    'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(fileId)
  ];

  for (let i = 0; i < driveUrls.length; i++) {
    try {
      const fetchHeaders = {
        'User-Agent': 'Mozilla/5.0 (compatible; StudySnapMediaProxy/1.0)'
      };
      if (rangeHeader) {
        fetchHeaders.Range = rangeHeader;
      }
      const upstream = await fetch(driveUrls[i], {
        method: 'GET',
        redirect: 'follow',
        headers: fetchHeaders
      });
      const contentType = String(upstream.headers.get('content-type') || '').toLowerCase();
      if (
        (upstream.status === 200 || upstream.status === 206) &&
        upstream.body &&
        contentType.indexOf('text/') === -1 &&
        contentType.indexOf('xml') === -1 &&
        contentType.indexOf('application/json') === -1
      ) {
        const headers = new Headers();
        const disp = upstream.headers.get('content-disposition') || '';
        headers.set('Content-Type', normalizeProxyMediaMime(contentType, disp, hintMime));
        headers.set('Accept-Ranges', 'bytes');
        const contentLen = upstream.headers.get('content-length');
        if (contentLen) headers.set('Content-Length', contentLen);
        const contentRange = upstream.headers.get('content-range');
        if (contentRange) headers.set('Content-Range', contentRange);
        headers.set('Cache-Control', 'public, max-age=604800, immutable');

        const responseToServe = new Response(upstream.body, {
          status: upstream.status,
          headers: headers
        });
        if (edgeCache && upstream.status === 200 && responseToServe.body) {
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

function normalizeProxyTtsLang(rawLang) {
  const clean = String(rawLang || 'zh-CN').trim();
  if (/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(clean)) {
    return clean;
  }
  return 'zh-CN';
}

function isAudioPayloadValid(contentType, buffer) {
  if (!buffer || buffer.byteLength <= 100) return false;
  const ct = String(contentType || '').toLowerCase();
  if (ct && (ct.includes('text/html') || ct.includes('application/json') || ct.includes('text/plain'))) {
    return false;
  }
  if (ct && !ct.includes('audio/') && !ct.includes('application/octet-stream')) {
    return false;
  }
  const bytes = new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength));
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x20 || b === 0x09 || b === 0x0a || b === 0x0d) continue;
    // Reject HTML/XML ('<') or JSON ('{' / '[') masquerading as audio
    if (b === 0x3c || b === 0x7b || b === 0x5b) return false;
    break;
  }
  return true;
}

export async function handleTtsProxy(request, url, ctx) {
  const rawQuery = url.searchParams.get('q');
  const cleanText = String(rawQuery || '').replace(/\s+/g, ' ').trim();
  if (!cleanText || cleanText.length > 240) {
    return jsonResponse({
      ok: false,
      error: !cleanText ? 'Missing q parameter' : 'Text too long for TTS (max 240 characters)'
    }, 400);
  }

  const lang = normalizeProxyTtsLang(url.searchParams.get('lang'));
  const cache = (typeof caches !== 'undefined' && caches.default) ? caches.default : null;
  const canonicalUrl = new URL(url.origin + '/api');
  canonicalUrl.searchParams.set('action', 'tts');
  canonicalUrl.searchParams.set('lang', lang);
  canonicalUrl.searchParams.set('q', cleanText);
  const cacheKey = new Request(canonicalUrl.toString(), { method: 'GET' });

  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) {
        if (request.method === 'HEAD') {
          return new Response(null, { status: cached.status, headers: cached.headers });
        }
        return cached;
      }
    } catch (err) {
      // Ignore cache lookup failure and fetch from upstream
    }
  }

  const encodedQ = encodeURIComponent(cleanText);
  const encodedLang = encodeURIComponent(lang);
  const providers = [
    {
      name: 'google-gtx',
      url: 'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=' + encodedLang + '&ttsspeed=0.9&q=' + encodedQ
    },
    {
      name: 'google-tw-ob',
      url: 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + encodedLang + '&ttsspeed=0.9&q=' + encodedQ
    }
  ];
  if (lang.toLowerCase().indexOf('zh') === 0 && cleanText.length <= 120) {
    providers.push({
      name: 'youdao',
      url: 'https://dict.youdao.com/dictvoice?audio=' + encodedQ + '&le=zh&type=2'
    });
  }

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      // Never forward client Referer/Origin so Google Translate TTS does not reject with 404/403
      const upstream = await fetch(provider.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'audio/mpeg, audio/*;q=0.9, */*;q=0.5'
        }
      });
      if (!upstream || !upstream.ok) continue;

      const contentType = upstream.headers.get('content-type') || '';
      const buffer = await upstream.arrayBuffer();
      if (!isAudioPayloadValid(contentType, buffer)) continue;

      const resolvedType = contentType.toLowerCase().includes('audio/')
        ? contentType.split(';')[0].trim()
        : 'audio/mpeg';

      const headers = new Headers({
        'Content-Type': resolvedType,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=2592000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'X-TTS-Provider': provider.name
      });

      const responseToCache = new Response(buffer, { status: 200, headers: headers });
      if (cache) {
        const putPromise = cache.put(cacheKey, responseToCache.clone()).catch(function () {});
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(putPromise);
        } else {
          await putPromise;
        }
      }

      if (request.method === 'HEAD') {
        return new Response(null, { status: 200, headers: headers });
      }
      return responseToCache;
    } catch (err) {
      // Try next TTS provider
    }
  }

  return jsonResponse({ ok: false, error: 'TTS upstream unavailable' }, 502);
}

function isAllowedGoogleFormUrl(rawUrl) {
  const clean = String(rawUrl || '').trim();
  if (!clean) return false;
  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'forms.gle') return parsed.pathname.length > 1;
    if (host === 'docs.google.com') return /^\/forms\//i.test(parsed.pathname);
    return false;
  } catch (e) {
    return false;
  }
}

function uint8ArrayToBase64(bytes) {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function decodeFormEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function handleGoogleFormFetchProxy(request, url) {
  let targetUrl = String(url.searchParams.get('url') || '').trim();
  if (!targetUrl && request.method === 'POST') {
    try {
      const body = await request.json();
      targetUrl = String((body && body.url) || '').trim();
    } catch (e) {
      // ignore invalid JSON
    }
  }

  if (!isAllowedGoogleFormUrl(targetUrl)) {
    return jsonResponse({
      ok: false,
      error: 'Link không hợp lệ. Vui lòng dán đường dẫn Google Form (https://docs.google.com/forms/... hoặc https://forms.gle/...).'
    }, 400);
  }

  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (res.url && res.url.indexOf('accounts.google.com') >= 0) {
      return jsonResponse({
        ok: false,
        error: 'Google Form này đang yêu cầu đăng nhập Google. Vui lòng tắt giới hạn tổ chức trong Cài đặt Google Form trước khi nhập.'
      }, 403);
    }

    const cookies =
      res.headers && typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie().map(function (c) { return String(c).split(';')[0]; }).join('; ')
        : String((res.headers && res.headers.get('set-cookie')) || '');

    const html = await res.text();
    const dataMatch = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]*?);\s*<\/script>/);
    if (!dataMatch) {
      return jsonResponse({
        ok: false,
        error: 'Không đọc được nội dung câu hỏi từ Google Form này. Hãy đảm bảo đây là link làm bài (/viewform) đang mở công khai.'
      }, 422);
    }

    const rawData = JSON.parse(dataMatch[1]);
    if (!Array.isArray(rawData) || !Array.isArray(rawData[1])) {
      return jsonResponse({ ok: false, error: 'Cấu trúc Google Form không được hỗ trợ.' }, 422);
    }

    const htmlImgUrls = [];
    const seenImgs = {};
    const imgRegex = /<img[^>]+src=["'](https:\/\/docs\.google\.com\/forms-images-rt\/[^"']+)["']/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const cleanImg = decodeFormEntities(imgMatch[1]);
      if (!seenImgs[cleanImg]) {
        seenImgs[cleanImg] = true;
        htmlImgUrls.push(cleanImg);
      }
    }

    const formMeta = rawData[1];
    const title = String(formMeta[8] || rawData[3] || '').trim() || 'Bài kiểm tra Google Form';
    const description = String(formMeta[0] || '').trim();
    const rawItems = Array.isArray(formMeta[1]) ? formMeta[1] : [];

    let imgCursor = 0;
    const parsedItems = [];
    const imgFetchJobs = [];

    rawItems.forEach(function (it) {
      if (!it) return;
      const qBlocks = Array.isArray(it[4]) ? it[4] : [];
      const primaryBlock = qBlocks[0] || [];
      const rawOptions = Array.isArray(primaryBlock[1]) ? primaryBlock[1] : [];
      const options = rawOptions
        .map(function (opt) { return opt && opt[0] !== undefined && opt[0] !== null ? String(opt[0]).trim() : ''; })
        .filter(function (v) { return v !== ''; });

      const videoBlock = Array.isArray(it[6]) ? it[6] : null;
      const youtubeId =
        videoBlock && typeof videoBlock[3] === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(videoBlock[3])
          ? videoBlock[3]
          : '';

      const imgBlock = Array.isArray(it[9]) ? it[9] : null;
      const imageId = imgBlock && imgBlock[0] && typeof imgBlock[0][0] === 'string' ? imgBlock[0][0] : '';
      let imageUrl = '';
      if (imageId && htmlImgUrls[imgCursor]) {
        imageUrl = htmlImgUrls[imgCursor];
        imgCursor++;
      }

      const itemObj = {
        id: it[0] !== undefined ? String(it[0]) : '',
        title: String(it[1] || ''),
        desc: String(it[2] || ''),
        rawType: Number(it[3]),
        options: options,
        youtubeId: youtubeId,
        youtubeUrl: youtubeId ? ('https://www.youtube.com/watch?v=' + youtubeId) : '',
        imageId: imageId,
        imageUrl: imageUrl,
        imageDataUrl: ''
      };
      parsedItems.push(itemObj);
      if (imageUrl && imgFetchJobs.length < 15) {
        imgFetchJobs.push({ item: itemObj, url: imageUrl });
      }
    });

    if (imgFetchJobs.length > 0) {
      await Promise.all(
        imgFetchJobs.map(async function (job) {
          try {
            const imgRes = await fetch(job.url, {
              headers: {
                'User-Agent': ua,
                'Referer': 'https://docs.google.com/',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Cookie': cookies
              }
            });
            if (!imgRes.ok) return;
            const ct = String(imgRes.headers.get('content-type') || 'image/jpeg').split(';')[0].trim().toLowerCase();
            if (ct.indexOf('image/') !== 0) return;
            const buf = await imgRes.arrayBuffer();
            if (buf.byteLength > 0 && buf.byteLength <= 1500000) {
              job.item.imageDataUrl = 'data:' + ct + ';base64,' + uint8ArrayToBase64(new Uint8Array(buf));
            }
          } catch (e) {
            // Leave imageDataUrl empty if image fetch fails
          }
        })
      );
    }

    return jsonResponse({
      ok: true,
      form: {
        sourceUrl: res.url || targetUrl,
        title: title,
        description: description,
        items: parsedItems
      }
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: 'Không thể kết nối tới Google Form lúc này. Vui lòng kiểm tra lại đường dẫn và thử lại.'
    }, 502);
  }
}

function normalizeChineseSentenceServer(str) {
  if (!str) return '';
  let s = String(str).trim();
  s = s.replace(/！/g, '!')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/？/g, '?')
    .replace(/：/g, ':')
    .replace(/；/g, ';')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/（/g, '(')
    .replace(/）/g, ')');
  s = s.toLowerCase();
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function isAnswerMatchServer(studentInput, acceptedList) {
  if (!studentInput || !Array.isArray(acceptedList) || acceptedList.length === 0) return false;
  const inputNorm = normalizeChineseSentenceServer(studentInput).toLowerCase();
  const inputNoPunct = inputNorm.replace(/[!.,?:;'"()]/g, '').trim();
  const inputCompactHyphen = inputNoPunct.replace(/\s*-\s*/g, '-').replace(/\s+/g, '');

  return acceptedList.some(function (acc) {
    const accNorm = normalizeChineseSentenceServer(acc).toLowerCase();
    if (inputNorm === accNorm) return true;
    const accNoPunct = accNorm.replace(/[!.,?:;'"()]/g, '').trim();
    if (inputNoPunct === accNoPunct) return true;
    if (/^[a-z0-9]+(?:\s*-\s*[a-z0-9]+)+$/i.test(accNoPunct)) {
      const accHyphenTight = accNoPunct.replace(/\s*-\s*/g, '-');
      const accBare = accHyphenTight.replace(/-/g, '');
      if (inputNoPunct.replace(/\s*-\s*/g, '-') === accHyphenTight) return true;
      if (inputCompactHyphen === accBare) return true;
    }
    return false;
  });
}

function isKeywordsMatchServer(studentInput, requiredKeywords) {
  if (!studentInput || !Array.isArray(requiredKeywords) || requiredKeywords.length === 0) return false;
  const inputNorm = normalizeChineseSentenceServer(studentInput).toLowerCase();
  return requiredKeywords.every(function (kw) {
    const kwNorm = normalizeChineseSentenceServer(kw).toLowerCase();
    return inputNorm.indexOf(kwNorm) !== -1;
  });
}

function getEffectivePracticeThresholdsServer(thresholds, maxScore) {
  const t = thresholds || {};
  const max = Number(maxScore) || 0;
  const rawGood = Number(t.good) || 0;
  const rawVeryGood = Number(t.very_good) || 0;

  if (max > 0) {
    const hasValidCustom =
      rawGood > 0 &&
      rawVeryGood >= rawGood &&
      rawVeryGood <= max &&
      !(rawVeryGood <= 1 && max > 2);
    if (hasValidCustom) {
      return { good: rawGood, very_good: rawVeryGood };
    }
    return {
      good: max <= 1 ? 1 : Math.max(1, Math.round(max * 0.7 * 10) / 10),
      very_good: max <= 1 ? 1 : Math.max(1, Math.round(max * 0.85 * 10) / 10)
    };
  }

  return {
    good: rawGood > 0 ? rawGood : 25,
    very_good: rawVeryGood > 0 ? rawVeryGood : 31
  };
}

function calculateRatingServer(score, thresholds, maxScore) {
  const t = getEffectivePracticeThresholdsServer(thresholds, maxScore);
  const num = Number(score) || 0;
  if (num >= t.very_good) return 'very_good';
  if (num >= t.good) return 'good';
  return 'needs_review';
}

function gradePracticeSubmissionServer(exRow, answersObj, existingManualGrades) {
  let sections = [];
  let thresholds = {};
  try {
    sections = typeof exRow.sections_json === 'string'
      ? JSON.parse(exRow.sections_json || '[]')
      : (Array.isArray(exRow.sections) ? exRow.sections : []);
  } catch (e) {
    sections = [];
  }
  try {
    thresholds = typeof exRow.thresholds_json === 'string'
      ? JSON.parse(exRow.thresholds_json || '{}')
      : (exRow.thresholds || {});
  } catch (e) {
    thresholds = {};
  }

  const cleanManualGrades = {};
  if (existingManualGrades && typeof existingManualGrades === 'object') {
    Object.keys(existingManualGrades).forEach(function (k) {
      if (existingManualGrades[k] && typeof existingManualGrades[k] === 'object') {
        cleanManualGrades[k] = existingManualGrades[k];
      }
    });
  }

  const sectionScores = {};
  let totalEarnedScore = 0;
  let hasManualQuestions = false;
  let computedMaxScore = 0;

  (Array.isArray(sections) ? sections : []).forEach(function (sec) {
    if (!sec) return;
    const secAns = (answersObj && answersObj[sec.section_id]) || {};
    let secScore = 0;

    if (sec.type === 'matching') {
      const answerKey = (sec.data && sec.data.answer) || {};
      const leftItems = (sec.data && sec.data.left) || [];
      computedMaxScore += Number(sec.max_score || leftItems.length);
      leftItems.forEach(function (l) {
        const expected = answerKey[String(l.id)];
        const userVal = secAns[String(l.id)];
        if (userVal && userVal === expected) {
          secScore += 1;
        }
      });
    } else if (sec.type === 'multiple_choice' || sec.type === 'listening_mc') {
      const items = (sec.data && sec.data.items) || [];
      const secMax = Number(sec.max_score || items.length);
      computedMaxScore += secMax;
      let correctCount = 0;
      items.forEach(function (item) {
        const userVal = secAns[item.id];
        if (
          userVal !== undefined &&
          userVal !== null &&
          userVal !== '' &&
          Number(userVal) === Number(item.correctIndex)
        ) {
          correctCount += 1;
        }
      });
      if (items.length > 0 && secMax !== items.length) {
        secScore = Math.round((correctCount / items.length) * secMax * 10) / 10;
      } else {
        secScore = correctCount;
      }
    } else if (sec.type === 'fill_blank_wordbank') {
      const items = (sec.data && sec.data.items) || [];
      computedMaxScore += Number(sec.max_score || items.length);
      items.forEach(function (item) {
        const userVal = secAns[item.id] || '';
        if (isAnswerMatchServer(userVal, [item.answer])) {
          secScore += 1;
        }
      });
    } else if (sec.type === 'error_correction') {
      const items = (sec.data && sec.data.items) || [];
      computedMaxScore += Number(sec.max_score || items.length);
      items.forEach(function (item) {
        const userVal = secAns[item.id] || '';
        if (isAnswerMatchServer(userVal, item.accepted || [])) {
          secScore += 1;
        }
      });
    } else if (sec.type === 'translation') {
      const items = (sec.data && sec.data.items) || [];
      computedMaxScore += Number(sec.max_score || items.length);
      items.forEach(function (item) {
        const userVal = secAns[item.id] || '';
        if (item.mode === 'exact') {
          if (isAnswerMatchServer(userVal, item.accepted || [])) {
            secScore += 1;
          }
        } else if (item.mode === 'keywords') {
          if (isKeywordsMatchServer(userVal, item.required_keywords || [])) {
            secScore += 1;
          }
        } else if (item.mode === 'manual') {
          hasManualQuestions = true;
          if (cleanManualGrades[item.id]) {
            secScore += Number(cleanManualGrades[item.id].score || 0);
          }
        }
      });
    } else if (sec.type === 'short_answer') {
      const items = (sec.data && sec.data.items) || [];
      computedMaxScore += Number(sec.max_score || items.length);
      items.forEach(function (item) {
        const userVal = secAns[item.id] || '';
        const hasKey = Array.isArray(item.accepted) && item.accepted.length > 0;
        const isManual = item.mode === 'manual' || !hasKey;
        if (!isManual) {
          if (isAnswerMatchServer(userVal, item.accepted || [])) {
            secScore += 1;
          }
        } else {
          hasManualQuestions = true;
          if (cleanManualGrades[item.id]) {
            secScore += Number(cleanManualGrades[item.id].score || 0);
          }
        }
      });
    }

    sectionScores[sec.section_id] = secScore;
    totalEarnedScore += secScore;
  });

  const maxScore = Number(exRow.total_score) || computedMaxScore || 35;
  const rating = calculateRatingServer(totalEarnedScore, thresholds, maxScore);
  const status = hasManualQuestions ? 'pending_manual' : 'graded';

  return {
    totalScore: totalEarnedScore,
    maxScore: maxScore,
    rating: rating,
    sectionScores: sectionScores,
    sectionScoresJson: JSON.stringify(sectionScores),
    manualGrades: cleanManualGrades,
    manualGradesJson: JSON.stringify(cleanManualGrades),
    status: status
  };
}

async function isDatabaseBootstrapped(db) {
  const meta = await getMetaMap(db);
  const teacherCntRow = await db.prepare('SELECT COUNT(*) AS cnt FROM teachers').first();
  const teachersCount = teacherCntRow ? Number(teacherCntRow.cnt) : 0;
  return {
    meta: meta,
    teachersCount: teachersCount,
    bootstrapped: meta.d1_bootstrapped === '1' || teachersCount > 0
  };
}

async function revokeSessionFromRequest(request, db, env) {
  const cookies = parseCookies(request);
  const rawAccess = cookies[ACCESS_COOKIE_NAME] || '';
  const rawRefresh = cookies[REFRESH_COOKIE_NAME] || '';
  let sidToRevoke = '';

  if (rawRefresh) {
    const dotIdx = rawRefresh.indexOf('.');
    if (dotIdx > 0) {
      const sid = rawRefresh.slice(0, dotIdx);
      const rawSecret = rawRefresh.slice(dotIdx + 1);
      if (sid && rawSecret) {
        const sesRow = await db
          .prepare('SELECT session_id, refresh_hash, prev_refresh_hash FROM auth_sessions WHERE session_id = ? LIMIT 1')
          .bind(sid)
          .first();
        if (sesRow) {
          const presented = hexToBytes(await sha256Hex(rawSecret));
          if (
            timingSafeEqualBytes(presented, hexToBytes(sesRow.refresh_hash)) ||
            (sesRow.prev_refresh_hash && timingSafeEqualBytes(presented, hexToBytes(sesRow.prev_refresh_hash)))
          ) {
            sidToRevoke = sesRow.session_id;
          }
        }
      }
    }
  }

  if (!sidToRevoke && rawAccess) {
    const hmacSecret = await getAuthHmacSecret(db, env);
    const verified = await verifyAccessToken(hmacSecret, rawAccess);
    if (verified && verified.sid) {
      sidToRevoke = String(verified.sid);
    }
  }

  if (sidToRevoke) {
    await db
      .prepare('UPDATE auth_sessions SET revoked = 1 WHERE session_id = ?')
      .bind(sidToRevoke)
      .run();
  }
}

export async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url);
  const reqOrigin = request.headers ? String(request.headers.get('Origin') || '').trim() : '';

  if (request.method === 'OPTIONS') {
    if (reqOrigin && reqOrigin !== url.origin) {
      return new Response(null, { status: 403 });
    }
    const optHeaders = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    if (reqOrigin && reqOrigin === url.origin) {
      optHeaders['Access-Control-Allow-Origin'] = url.origin;
      optHeaders['Access-Control-Allow-Credentials'] = 'true';
    }
    return new Response(null, { status: 204, headers: optHeaders });
  }

  if (request.method === 'POST' && reqOrigin && reqOrigin !== url.origin) {
    return jsonResponse({ ok: false, error: 'Yêu cầu cross-origin không được phép.' }, 403);
  }

  const earlyAction = url.searchParams.get('action') || '';
  const db = env && env.DB ? env.DB : null;

  if (request.method === 'GET' && earlyAction === 'media') {
    if (db) {
      await ensureSchema(db);
      const bState = await isDatabaseBootstrapped(db);
      if (bState.bootstrapped) {
        const auth = await resolveRequestSession(request, db, env, url);
        if (!auth.session || !auth.user) {
          return withSessionCookies(
            jsonResponse(
              { ok: false, sessionExpired: true, error: 'Vui lòng đăng nhập để xem tệp bài làm.' },
              401
            ),
            auth.setCookies
          );
        }
        const mediaRes = await handleDriveMediaProxy(request, url, ctx);
        return withSessionCookies(mediaRes, auth.setCookies);
      }
    }
    return await handleDriveMediaProxy(request, url, ctx);
  }

  if ((request.method === 'GET' || request.method === 'HEAD') && earlyAction === 'tts') {
    return await handleTtsProxy(request, url, ctx);
  }

  if (earlyAction === 'fetchGoogleForm' && (request.method === 'GET' || request.method === 'POST')) {
    if (db) {
      await ensureSchema(db);
      const bState = await isDatabaseBootstrapped(db);
      if (bState.bootstrapped) {
        const auth = await resolveRequestSession(request, db, env, url);
        if (!auth.session || !auth.user) {
          return withSessionCookies(
            jsonResponse(
              { ok: false, sessionExpired: true, error: 'Vui lòng đăng nhập tài khoản Giáo viên.' },
              401
            ),
            auth.setCookies
          );
        }
        if (auth.session.role !== 'teacher') {
          return withSessionCookies(
            jsonResponse({ ok: false, error: 'Chỉ Giáo viên mới có quyền nhập Google Form.' }, 403),
            auth.setCookies
          );
        }
        const formRes = await handleGoogleFormFetchProxy(request, url);
        return withSessionCookies(formRes, auth.setCookies);
      }
    }
    return await handleGoogleFormFetchProxy(request, url);
  }

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
      const bState = await isDatabaseBootstrapped(db);
      const meta = bState.meta;
      const curVer = await getDataVersion(db, meta);
      const needsMigration = !bState.bootstrapped;

      if (action === 'ping') {
        return jsonResponse({
          ok: true,
          backend: 'cloudflare-d1',
          version: curVer,
          needsMigration: needsMigration,
          timestamp: new Date().toISOString()
        });
      }

      if (action === 'session' || action === 'refresh') {
        if (needsMigration) {
          return jsonResponse({
            ok: true,
            backend: 'cloudflare-d1',
            authenticated: false,
            needsMigration: true,
            version: curVer,
            user: null
          });
        }
        const auth = await resolveRequestSession(request, db, env, url);
        if (!auth.session || !auth.user) {
          return jsonResponse(
            {
              ok: true,
              backend: 'cloudflare-d1',
              authenticated: false,
              needsMigration: false,
              sessionExpired: auth.hadInvalidCookies,
              version: curVer,
              user: null
            },
            200,
            null,
            auth.setCookies
          );
        }
        let cookiesOut = auth.setCookies;
        let nextExpiresAt = auth.session.expiresAt;
        if (action === 'refresh' && (!cookiesOut || cookiesOut.length === 0)) {
          const nowMs = Date.now();
          nextExpiresAt = nowMs + REFRESH_TTL_SEC * 1000;
          await db
            .prepare('UPDATE auth_sessions SET expires_at = ?, last_used_at = ? WHERE session_id = ?')
            .bind(nextExpiresAt, nowMs, auth.session.sid)
            .run();
          const hmacSecret = await getAuthHmacSecret(db, env);
          const freshAccess = await signAccessToken(hmacSecret, {
            sid: auth.session.sid,
            uid: auth.session.uid,
            role: auth.session.role,
            exp: nowMs + ACCESS_TTL_SEC * 1000
          });
          cookiesOut = [
            buildCookieString(ACCESS_COOKIE_NAME, freshAccess, ACCESS_TTL_SEC, url.protocol === 'https:')
          ];
        }
        return jsonResponse(
          {
            ok: true,
            backend: 'cloudflare-d1',
            authenticated: true,
            needsMigration: false,
            version: curVer,
            expiresAt: nextExpiresAt,
            user: auth.user
          },
          200,
          null,
          cookiesOut
        );
      }

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

      const auth = await resolveRequestSession(request, db, env, url);
      if (!auth.session || !auth.user) {
        return jsonResponse(
          {
            ok: false,
            backend: 'cloudflare-d1',
            sessionExpired: true,
            error: 'Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập.'
          },
          401,
          null,
          auth.setCookies
        );
      }

      const clientVer = String(url.searchParams.get('v') || '').trim();
      if (clientVer && curVer && curVer !== '0' && clientVer === curVer) {
        return jsonResponse(
          {
            ok: true,
            backend: 'cloudflare-d1',
            unchanged: true,
            version: curVer,
            expiresAt: auth.session.expiresAt,
            currentUser: auth.user
          },
          200,
          null,
          auth.setCookies
        );
      }

      const bootstrapData = await getBootstrapData(db, meta, auth.session);
      return jsonResponse(
        {
          ok: true,
          backend: 'cloudflare-d1',
          version: curVer,
          expiresAt: auth.session.expiresAt,
          currentUser: auth.user,
          data: bootstrapData
        },
        200,
        null,
        auth.setCookies
      );
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

    if (action === 'logout') {
      await revokeSessionFromRequest(request, db, env);
      return jsonResponse(
        { ok: true, backend: 'cloudflare-d1', loggedOut: true },
        200,
        null,
        buildClearSessionCookies(url)
      );
    }

    if (action === 'login') {
      return await handleLogin(db, payload, request, env, url);
    }

    if (action === 'clearAllData' || action === 'clearAllDataCompletely') {
      return jsonResponse({
        ok: false,
        error: 'Chức năng quản trị và làm sạch dữ liệu không thực hiện từ giao diện web.'
      }, 403);
    }

    if (action === 'setupDatabase') {
      const auth = await resolveRequestSession(request, db, env, url);
      const setupRes = await handleSetupDatabase(db, auth.session);
      return withSessionCookies(setupRes, auth.setCookies);
    }

    if (action === 'importFromBootstrapData') {
      const auth = await resolveRequestSession(request, db, env, url);
      const importRes = await handleImportFromBootstrapData(db, payload, auth.session, env);
      return withSessionCookies(importRes, auth.setCookies);
    }

    const auth = await resolveRequestSession(request, db, env, url);
    if (action === 'session' || action === 'refresh') {
      const metaSes = await getMetaMap(db);
      const curVerSes = await getDataVersion(db, metaSes);
      if (!auth.session || !auth.user) {
        return jsonResponse(
          {
            ok: false,
            backend: 'cloudflare-d1',
            authenticated: false,
            sessionExpired: true,
            error: 'Phiên đăng nhập đã hết hạn.'
          },
          401,
          null,
          auth.setCookies
        );
      }
      return jsonResponse(
        {
          ok: true,
          backend: 'cloudflare-d1',
          authenticated: true,
          version: curVerSes,
          expiresAt: auth.session.expiresAt,
          user: auth.user
        },
        200,
        null,
        auth.setCookies
      );
    }

    if (!auth.session || !auth.user) {
      return jsonResponse(
        {
          ok: false,
          backend: 'cloudflare-d1',
          sessionExpired: true,
          error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        },
        401,
        null,
        auth.setCookies
      );
    }

    const session = auth.session;
    const sessionCookies = auth.setCookies;
    const isTeacher = session.role === 'teacher';
    const respond = function (res) {
      return withSessionCookies(res, sessionCookies);
    };
    const mutate = async function (extra) {
      return await buildMutationResponse(db, payload, preVer, extra, session, sessionCookies);
    };

    const preVer = await getDataVersion(db);

    if (action === 'changePassword') {
      const currentPwd = String(payload.current_password || '').trim();
      const newPwd = String(payload.new_password || '').trim();
      if (!currentPwd || !newPwd || newPwd.length < 6) {
        return respond(
          jsonResponse(
            { ok: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' },
            400
          )
        );
      }
      if (session.role === 'teacher') {
        const tRow = await db
          .prepare('SELECT teacher_id, password FROM teachers WHERE teacher_id = ? LIMIT 1')
          .bind(session.uid)
          .first();
        const chkT = tRow ? await verifyPassword(currentPwd, tRow.password) : { valid: false };
        if (!chkT.valid) {
          return respond(jsonResponse({ ok: false, error: 'Mật khẩu hiện tại không chính xác.' }, 403));
        }
        const hashedT = await hashPassword(newPwd, 100000);
        await db.prepare('UPDATE teachers SET password = ? WHERE teacher_id = ?').bind(hashedT, session.uid).run();
      } else {
        const sRow = await db
          .prepare('SELECT student_id, password FROM students WHERE student_id = ? LIMIT 1')
          .bind(session.uid)
          .first();
        const chkS = sRow ? await verifyPassword(currentPwd, sRow.password) : { valid: false };
        if (!chkS.valid) {
          return respond(jsonResponse({ ok: false, error: 'Mật khẩu hiện tại không chính xác.' }, 403));
        }
        const hashedS = await hashPassword(newPwd, 100000);
        await db.prepare('UPDATE students SET password = ? WHERE student_id = ?').bind(hashedS, session.uid).run();
      }
      await db
        .prepare('UPDATE auth_sessions SET revoked = 1 WHERE user_id = ? AND role = ? AND session_id != ?')
        .bind(session.uid, session.role, session.sid)
        .run();
      const nextVerPwd = await bumpDataVersion(db);
      return respond(
        jsonResponse({
          ok: true,
          backend: 'cloudflare-d1',
          version: nextVerPwd,
          passwordChanged: true
        })
      );
    }

    const TEACHER_ONLY_ACTIONS = new Set([
      'createClass',
      'deleteClass',
      'changeStudentClass',
      'createStudentAccount',
      'resetStudentPassword',
      'deleteStudentAccount',
      'saveTeacherFeedback',
      'copyTeacherFeedback',
      'addVocabulary',
      'batchAddVocabulary',
      'deleteVocabulary',
      'addAssignment',
      'renameAssignmentSession',
      'assignExercisesToClass',
      'unassignAssignment',
      'deleteAssignment',
      'gradeManualTranslation',
      'savePracticeExercise',
      'deletePracticeExercise'
    ]);
    if (TEACHER_ONLY_ACTIONS.has(action) && !isTeacher) {
      return respond(
        jsonResponse(
          { ok: false, error: 'Bạn không có quyền thực hiện thao tác dành cho Giáo viên.' },
          403
        )
      );
    }

    if (action === 'createClass') {
      const className = String(payload.class_name || '').trim();
      if (!className) {
        return respond(jsonResponse({ ok: false, error: 'Thiếu tên lớp học.' }, 400));
      }
      if (!isValidRealClassName(className)) {
        return respond(jsonResponse({ ok: false, error: 'Tên lớp không hợp lệ hoặc trùng từ khóa hệ thống.' }, 400));
      }
      const existing = await db
        .prepare('SELECT class_id, class_name, created_at FROM classes WHERE LOWER(TRIM(class_name)) = LOWER(TRIM(?)) LIMIT 1')
        .bind(className)
        .first();
      if (existing) {
        return await mutate({ classItem: existing });
      }
      const classId = String(payload.class_id || makeShortId('CLS'));
      const createdAt = formatViDate();
      await db
        .prepare('INSERT INTO classes (class_id, class_name, created_at) VALUES (?, ?, ?)')
        .bind(classId, className, createdAt)
        .run();
      return await mutate({
        classItem: { class_id: classId, class_name: className, created_at: createdAt }
      });
    }

    if (action === 'deleteClass') {
      const className = String(payload.class_name || '').trim();
      if (!className) {
        return respond(jsonResponse({ ok: false, error: 'Thiếu tên lớp học.' }, 400));
      }
      await db.batch([
        db.prepare('DELETE FROM classes WHERE LOWER(TRIM(class_name)) = LOWER(TRIM(?))').bind(className),
        db
          .prepare("UPDATE students SET class_name = 'Chưa xếp lớp' WHERE LOWER(TRIM(class_name)) = LOWER(TRIM(?))")
          .bind(className)
      ]);
      return await mutate({
        deletedClass: { deleted: true, class_name: className }
      });
    }

    if (action === 'changeStudentClass') {
      const studentId = String(payload.student_id || '').trim();
      const targetClass = String(payload.class_name || '').trim();
      if (!studentId || !targetClass) {
        return respond(jsonResponse({ ok: false, error: 'Thiếu thông tin học sinh hoặc lớp mới.' }, 400));
      }
      await ensureClassRecord(db, targetClass);
      await db
        .prepare('UPDATE students SET class_name = ? WHERE student_id = ?')
        .bind(targetClass, studentId)
        .run();
      return await mutate({
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
      const hashedPassword = await hashPassword(password, 100000);
      const createdAt = formatViDate();

      await ensureClassRecord(db, className);
      await db
        .prepare('INSERT OR REPLACE INTO students (student_id, full_name, class_name, avatar_initials, username, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(studentId, fullName, className, initials, username, hashedPassword, createdAt)
        .run();

      return await mutate({
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
      const hashedNewPwd = await hashPassword(newPwd, 100000);
      const info = await db
        .prepare('UPDATE students SET password = ? WHERE student_id = ?')
        .bind(hashedNewPwd, studentId)
        .run();
      await db
        .prepare("UPDATE auth_sessions SET revoked = 1 WHERE user_id = ? AND role = 'student'")
        .bind(studentId)
        .run();
      const updatedCount = info && info.meta ? Number(info.meta.changes || 0) : 1;
      return await mutate({
        student: updatedCount > 0 ? { student_id: studentId, password: newPwd } : null
      });
    }

    if (action === 'deleteStudentAccount') {
      const studentId = String(payload.student_id || '').trim();
      if (!studentId) {
        return await mutate({
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
        db.prepare('DELETE FROM practice_submissions WHERE TRIM(student_id) = ?').bind(studentId),
        db.prepare("DELETE FROM auth_sessions WHERE user_id = ? AND role = 'student'").bind(studentId)
      ]);
      const changesOf = function (i) {
        return batchOut[i] && batchOut[i].meta ? Number(batchOut[i].meta.changes || 0) : 0;
      };
      return await mutate({
        deletedStudent: {
          deleted: changesOf(0) > 0,
          student_id: studentId,
          deleted_students: changesOf(0),
          deleted_submissions: changesOf(1),
          deleted_exit_tickets: changesOf(2),
          deleted_practice_submissions: changesOf(3)
        },
        deletedMediaUrls: await filterUnreferencedDriveUrls(db, mediaCandidates)
      });
    }

    if (action === 'submitHomework') {
      const assignmentId = String(payload.assignment_id || '').trim();
      const requestedStudentId = String(payload.student_id || '').trim();
      if (session.role === 'student' && requestedStudentId && requestedStudentId !== session.uid) {
        return respond(jsonResponse({ ok: false, error: 'Không thể nộp bài thay học sinh khác.' }, 403));
      }
      const studentId = session.role === 'student' ? String(session.uid) : requestedStudentId;
      const nowStr = formatViDateTime();
      const incomingUrl = String(payload.media_url || '').trim();

      if (payload.media_base64 || (incomingUrl.indexOf('data:') === 0 && incomingUrl.length > 262144)) {
        return respond(jsonResponse({
          ok: false,
          error: 'Tệp ghi âm/video phải được tải lên Google Drive trước khi lưu vào Cloudflare D1.'
        }, 400));
      }

      const incomingType = String(payload.media_type || 'audio').trim() || 'audio';
      const isVocabTrack = incomingType === 'vocab' || incomingType === 'vocab_log';

      if (isVocabTrack) {
        const existing = await db
          .prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ? ORDER BY rowid DESC LIMIT 1')
          .bind(assignmentId, studentId)
          .first();

        if (existing) {
          const nextMediaUrl = incomingUrl || existing.media_url || '';
          const nextNote = payload.student_note !== undefined ? String(payload.student_note) : (existing.student_note || '');
          const nextType = incomingType;
          const nextDur = payload.media_duration || existing.media_duration || '01:00';
          const nextStatus = String(payload.status || 'graded');
          const hasIncomingScore =
            payload.score !== undefined &&
            payload.score !== null &&
            String(payload.score) !== '';
          const nextScore = hasIncomingScore ? String(payload.score) : (existing.score || '');
          const rawPriorCount = Number(existing.practice_count || 0) || 0;
          const effectivePrior = rawPriorCount === 0 && (existing.submitted_at || existing.status === 'graded')
            ? 1
            : rawPriorCount;
          const incrementPractice = payload.increment_practice !== false && payload.increment_practice !== 0;
          const explicitPracticeCount =
            payload.practice_count !== undefined && payload.practice_count !== null && payload.practice_count !== ''
              ? Math.max(0, Number(payload.practice_count) || 0)
              : null;
          const nextPracticeCount = incrementPractice
            ? Math.max(effectivePrior + 1, explicitPracticeCount || 0)
            : (explicitPracticeCount !== null ? explicitPracticeCount : effectivePrior);
          const keepAttempt = Math.max(1, Number(existing.attempt_number || 1) || 1);

          await db
            .prepare('UPDATE submissions SET submitted_at = ?, student_note = ?, media_type = ?, media_url = ?, media_duration = ?, status = ?, score = ?, practice_count = ?, attempt_number = ? WHERE submission_id = ?')
            .bind(nowStr, nextNote, nextType, nextMediaUrl, nextDur, nextStatus, nextScore, nextPracticeCount, keepAttempt, existing.submission_id)
            .run();

          return await mutate({
            submission: {
              submission_id: existing.submission_id,
              assignment_id: assignmentId,
              student_id: studentId,
              attempt_number: keepAttempt,
              media_type: nextType,
              media_url: nextMediaUrl,
              status: nextStatus,
              score: nextScore,
              student_note: nextNote,
              media_duration: nextDur,
              submitted_at: nowStr,
              practice_count: nextPracticeCount
            },
            deletedMediaUrls: []
          });
        } else {
          const newId = makeShortId('SUB');
          const nextNote = String(payload.student_note || '');
          const nextDur = String(payload.media_duration || '01:00');
          const nextStatus = String(payload.status || 'graded');
          const nextScore =
            payload.score !== undefined && payload.score !== null
              ? String(payload.score)
              : '';
          const incrementPractice = payload.increment_practice !== false && payload.increment_practice !== 0;
          const nextPracticeCount = Math.max(incrementPractice ? 1 : 0, Number(payload.practice_count || 0) || 0);
          await db
            .prepare('INSERT INTO submissions (submission_id, assignment_id, student_id, submitted_at, student_note, media_type, media_url, media_duration, status, score, teacher_comment, teacher_voice_url, teacher_voice_duration, graded_at, practice_count, attempt_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(newId, assignmentId, studentId, nowStr, nextNote, incomingType, incomingUrl, nextDur, nextStatus, nextScore, '', '', '', '', nextPracticeCount, 1)
            .run();
          return await mutate({
            submission: {
              submission_id: newId,
              assignment_id: assignmentId,
              student_id: studentId,
              attempt_number: 1,
              media_type: incomingType,
              media_url: incomingUrl,
              status: nextStatus,
              score: nextScore,
              student_note: nextNote,
              media_duration: nextDur,
              submitted_at: nowStr,
              practice_count: nextPracticeCount
            }
          });
        }
      }

      // Bài tập về nhà (audio/video): giữ nguyên mọi lần nộp cũ, nộp lại tạo row mới (Lần 2, Lần 3...)
      const existingAllRes = await db
        .prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ? ORDER BY COALESCE(attempt_number, 1) DESC, rowid DESC')
        .bind(assignmentId, studentId)
        .all();
      const existingRows = (existingAllRes && Array.isArray(existingAllRes.results) ? existingAllRes.results : [])
        .filter(function (r) {
          const mt = String(r.media_type || '').trim();
          return mt !== 'vocab' && mt !== 'vocab_log';
        });

      const isResubmitAttempt = existingRows.length > 0;
      if (isResubmitAttempt && !incomingUrl) {
        return respond(jsonResponse({
          ok: false,
          error: 'Vui lòng thu âm hoặc tải lên file Audio/Video mới để nộp lại lần tiếp theo.'
        }, 400));
      }

      const maxAttempt = existingRows.reduce(function (mx, r) {
        return Math.max(mx, Math.max(1, Number(r.attempt_number || 1) || 1));
      }, 0);
      const nextAttempt = isResubmitAttempt ? Math.max(maxAttempt + 1, existingRows.length + 1) : 1;
      const newId = makeShortId('SUB');
      const nextNote = String(payload.student_note || '');
      const nextDur = String(payload.media_duration || '01:00');
      const nextStatus = 'submitted';
      const nextScore =
        isTeacher && payload.score !== undefined && payload.score !== null
          ? String(payload.score)
          : '';

      await db
        .prepare('INSERT INTO submissions (submission_id, assignment_id, student_id, submitted_at, student_note, media_type, media_url, media_duration, status, score, teacher_comment, teacher_voice_url, teacher_voice_duration, graded_at, practice_count, attempt_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(newId, assignmentId, studentId, nowStr, nextNote, incomingType, incomingUrl, nextDur, nextStatus, nextScore, '', '', '', '', 0, nextAttempt)
        .run();

      return await mutate({
        submission: {
          submission_id: newId,
          assignment_id: assignmentId,
          student_id: studentId,
          attempt_number: nextAttempt,
          media_type: incomingType,
          media_url: incomingUrl,
          status: nextStatus,
          score: nextScore,
          student_note: nextNote,
          media_duration: nextDur,
          submitted_at: nowStr,
          practice_count: 0
        },
        deletedMediaUrls: []
      });
    }

    if (action === 'saveTeacherFeedback') {
      const assignmentId = String(payload.assignment_id || '').trim();
      const studentId = String(payload.student_id || '').trim();
      const requestedSubId = String(payload.submission_id || '').trim();
      const nowStr = formatViDateTime();
      const rawVoiceUrl = String(payload.teacher_voice_url || '').trim();
      const incomingVoiceUrl = rawVoiceUrl.indexOf('demo:') === 0 ? '' : rawVoiceUrl;

      if (payload.teacher_voice_base64 || (incomingVoiceUrl.indexOf('data:') === 0 && incomingVoiceUrl.length > 262144)) {
        return respond(jsonResponse({
          ok: false,
          error: 'Bản ghi âm phản hồi phải được tải lên Google Drive trước khi lưu vào Cloudflare D1.'
        }, 400));
      }

      let existing = null;
      if (requestedSubId) {
        existing = await db
          .prepare('SELECT * FROM submissions WHERE submission_id = ? AND assignment_id = ? AND student_id = ? LIMIT 1')
          .bind(requestedSubId, assignmentId, studentId)
          .first();
      }
      if (!existing) {
        existing = await db
          .prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ? ORDER BY COALESCE(attempt_number, 1) DESC, rowid DESC LIMIT 1')
          .bind(assignmentId, studentId)
          .first();
      }

      if (existing) {
        const keepAttempt = Math.max(1, Number(existing.attempt_number || 1) || 1);
        const existingRealVoice =
          existing.teacher_voice_url && String(existing.teacher_voice_url).trim().indexOf('demo:') !== 0
            ? String(existing.teacher_voice_url).trim()
            : '';
        const incomingScore = payload.score !== undefined ? String(payload.score) : undefined;
        const nextScore =
          incomingScore === undefined || (incomingScore === '' && existing.score !== '' && payload.allow_clear_score !== true)
            ? String(existing.score || '')
            : incomingScore;
        const incomingComment = payload.teacher_comment !== undefined ? String(payload.teacher_comment) : undefined;
        const nextComment =
          incomingComment === undefined || (incomingComment === '' && existing.teacher_comment && payload.allow_clear_comment !== true)
            ? String(existing.teacher_comment || '')
            : incomingComment;
        const nextVoiceUrl = incomingVoiceUrl || existingRealVoice || '';
        const replacedUrls =
          incomingVoiceUrl && existingRealVoice && incomingVoiceUrl !== existingRealVoice
            ? collectDriveUrls([existingRealVoice])
            : [];
        const nextVoiceDur = nextVoiceUrl
          ? (incomingVoiceUrl ? String(payload.teacher_voice_duration || existing.teacher_voice_duration || '') : String(existing.teacher_voice_duration || payload.teacher_voice_duration || ''))
          : '';
        const nextSubmittedAt = existing.submitted_at || nowStr;

        await db
          .prepare('UPDATE submissions SET submitted_at = ?, status = ?, score = ?, teacher_comment = ?, teacher_voice_url = ?, teacher_voice_duration = ?, graded_at = ? WHERE submission_id = ?')
          .bind(nextSubmittedAt, 'graded', nextScore, nextComment, nextVoiceUrl, nextVoiceDur, nowStr, existing.submission_id)
          .run();

        return await mutate({
          submission: {
            submission_id: existing.submission_id,
            assignment_id: assignmentId,
            student_id: studentId,
            attempt_number: keepAttempt,
            submitted_at: nextSubmittedAt,
            status: 'graded',
            score: nextScore,
            teacher_comment: nextComment,
            teacher_voice_url: nextVoiceUrl,
            teacher_voice_duration: nextVoiceDur,
            graded_at: nowStr
          },
          deletedMediaUrls: await filterUnreferencedDriveUrls(db, replacedUrls)
        });
      } else {
        const newId = makeShortId('SUB');
        const nextStatus = String(payload.status || 'graded');
        const nextScore = payload.score !== undefined ? String(payload.score) : '';
        const nextComment = String(payload.teacher_comment || '');
        const nextVoiceDur = incomingVoiceUrl ? String(payload.teacher_voice_duration || '') : '';
        await db
          .prepare('INSERT INTO submissions (submission_id, assignment_id, student_id, submitted_at, student_note, media_type, media_url, media_duration, status, score, teacher_comment, teacher_voice_url, teacher_voice_duration, graded_at, practice_count, attempt_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(newId, assignmentId, studentId, '', '', 'audio', '', '', nextStatus, nextScore, nextComment, incomingVoiceUrl, nextVoiceDur, nowStr, 0, 1)
          .run();
        return await mutate({
          submission: {
            submission_id: newId,
            assignment_id: assignmentId,
            student_id: studentId,
            attempt_number: 1,
            submitted_at: '',
            status: nextStatus,
            score: nextScore,
            teacher_comment: nextComment,
            teacher_voice_url: incomingVoiceUrl,
            teacher_voice_duration: nextVoiceDur,
            graded_at: nowStr
          }
        });
      }
    }

    if (action === 'copyTeacherFeedback') {
      const assignmentId = String(payload.assignment_id || '').trim();
      const sourceStudentId = String(payload.source_student_id || '').trim();
      const includeSource = Boolean(payload.include_source && sourceStudentId);
      const rawTargets = Array.isArray(payload.target_student_ids) ? payload.target_student_ids : [];
      const targetSet = new Set();
      rawTargets.forEach(function (id) {
        const clean = String(id || '').trim();
        if (clean) targetSet.add(clean);
      });
      if (includeSource) targetSet.add(sourceStudentId);

      if (!assignmentId || targetSet.size === 0) {
        return respond(jsonResponse({ ok: false, error: 'Thiếu mã BVN hoặc danh sách học sinh cần copy phản hồi.' }, 400));
      }

      const rawVoiceUrl = String(payload.teacher_voice_url || '').trim();
      const incomingVoiceUrl = rawVoiceUrl.indexOf('demo:') === 0 ? '' : rawVoiceUrl;
      if (payload.teacher_voice_base64 || (incomingVoiceUrl.indexOf('data:') === 0 && incomingVoiceUrl.length > 262144)) {
        return respond(jsonResponse({
          ok: false,
          error: 'Bản ghi âm phản hồi phải được tải lên Google Drive trước khi sao chép sang nhiều học sinh.'
        }, 400));
      }

      const copyComment = payload.copy_comment !== false;
      const copyVoice = payload.copy_voice !== false && Boolean(incomingVoiceUrl);
      const copyScore = Boolean(payload.copy_score);
      const mergeMode = String(payload.merge_mode || 'replace') === 'append' ? 'append' : 'replace';
      const incomingComment = payload.teacher_comment !== undefined ? String(payload.teacher_comment).trim() : '';
      const incomingScore = payload.score !== undefined && payload.score !== null ? String(payload.score).trim() : '';
      const incomingVoiceDur = copyVoice ? String(payload.teacher_voice_duration || '') : '';
      const nowStr = formatViDateTime();

      const sourceSubId = String(payload.source_submission_id || '').trim();
      const existingRowsRes = await db
        .prepare('SELECT * FROM submissions WHERE assignment_id = ? ORDER BY COALESCE(attempt_number, 1) DESC, rowid DESC')
        .bind(assignmentId)
        .all();
      const existingByStu = {};
      (existingRowsRes && existingRowsRes.results ? existingRowsRes.results : []).forEach(function (r) {
        const stuKey = String(r.student_id || '').trim();
        if (!stuKey) return;
        if (sourceSubId && stuKey === sourceStudentId && String(r.submission_id || '').trim() === sourceSubId) {
          existingByStu[stuKey] = r;
          return;
        }
        if (!existingByStu[stuKey]) {
          existingByStu[stuKey] = r;
        }
      });

      const stmts = [];
      const replacedVoiceCandidates = [];
      const updatedSubmissions = [];

      targetSet.forEach(function (stuId) {
        const existing = existingByStu[stuId];
        if (existing) {
          const keepAttempt = Math.max(1, Number(existing.attempt_number || 1) || 1);
          const existingVoiceRaw = String(existing.teacher_voice_url || '').trim();
          const existingRealVoice = existingVoiceRaw.indexOf('demo:') === 0 ? '' : existingVoiceRaw;
          const nextScore = copyScore && incomingScore !== '' ? incomingScore : String(existing.score || '');
          let nextComment = String(existing.teacher_comment || '');
          if (copyComment && incomingComment !== '') {
            if (mergeMode === 'append' && nextComment) {
              nextComment = nextComment.indexOf(incomingComment) !== -1
                ? nextComment
                : (nextComment + '\n' + incomingComment);
            } else {
              nextComment = incomingComment;
            }
          }
          const nextVoiceUrl = copyVoice ? incomingVoiceUrl : existingRealVoice;
          const nextVoiceDur = copyVoice
            ? incomingVoiceDur
            : (nextVoiceUrl ? String(existing.teacher_voice_duration || '') : '');
          if (copyVoice && existingRealVoice && existingRealVoice !== incomingVoiceUrl) {
            replacedVoiceCandidates.push(existingRealVoice);
          }
          const nextSubmittedAt = existing.submitted_at || nowStr;

          stmts.push(
            db
              .prepare('UPDATE submissions SET submitted_at = ?, status = ?, score = ?, teacher_comment = ?, teacher_voice_url = ?, teacher_voice_duration = ?, graded_at = ? WHERE submission_id = ?')
              .bind(nextSubmittedAt, 'graded', nextScore, nextComment, nextVoiceUrl, nextVoiceDur, nowStr, existing.submission_id)
          );
          updatedSubmissions.push({
            submission_id: existing.submission_id,
            assignment_id: assignmentId,
            student_id: stuId,
            attempt_number: keepAttempt,
            status: 'graded',
            score: nextScore,
            teacher_comment: nextComment,
            teacher_voice_url: nextVoiceUrl,
            teacher_voice_duration: nextVoiceDur,
            graded_at: nowStr
          });
        } else {
          const newId = makeShortId('SUB');
          const nextScore = copyScore && incomingScore !== '' ? incomingScore : '';
          const nextComment = copyComment ? incomingComment : '';
          const nextVoiceUrl = copyVoice ? incomingVoiceUrl : '';
          const nextVoiceDur = copyVoice ? incomingVoiceDur : '';

          stmts.push(
            db
              .prepare('INSERT INTO submissions (submission_id, assignment_id, student_id, submitted_at, student_note, media_type, media_url, media_duration, status, score, teacher_comment, teacher_voice_url, teacher_voice_duration, graded_at, practice_count, attempt_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
              .bind(newId, assignmentId, stuId, '', '', 'audio', '', '', 'graded', nextScore, nextComment, nextVoiceUrl, nextVoiceDur, nowStr, 0, 1)
          );
          updatedSubmissions.push({
            submission_id: newId,
            assignment_id: assignmentId,
            student_id: stuId,
            attempt_number: 1,
            submitted_at: '',
            student_note: '',
            media_type: 'audio',
            media_url: '',
            media_duration: '',
            status: 'graded',
            score: nextScore,
            teacher_comment: nextComment,
            teacher_voice_url: nextVoiceUrl,
            teacher_voice_duration: nextVoiceDur,
            graded_at: nowStr
          });
        }
      });

      await runBatchedStatements(db, stmts);
      return await mutate({
        copiedFeedback: {
          assignment_id: assignmentId,
          updated_count: updatedSubmissions.length,
          teacher_voice_url: incomingVoiceUrl,
          submissions: updatedSubmissions
        },
        deletedMediaUrls: await filterUnreferencedDriveUrls(db, replacedVoiceCandidates)
      });
    }

    if (action === 'submitExitTicket') {
      const requestedStudentId = String(payload.student_id || '').trim();
      if (session.role === 'student' && requestedStudentId && requestedStudentId !== session.uid) {
        return respond(jsonResponse({ ok: false, error: 'Không thể nộp bài thay học sinh khác.' }, 403));
      }
      const studentId = session.role === 'student' ? String(session.uid) : requestedStudentId;
      const studentName = session.role === 'student'
        ? String(auth.user.full_name || payload.student_name || '')
        : String(payload.student_name || '');
      const recordId = makeShortId('EXT');
      const nowStr = formatViDateTime();
      await db
        .prepare('INSERT INTO exit_tickets (record_id, ticket_id, student_id, student_name, score, total, submitted_at, answers_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          recordId,
          String(payload.ticket_id || 'EXIT_BAI_1'),
          studentId,
          studentName,
          Number(payload.score) || 0,
          Number(payload.total) || 0,
          nowStr,
          JSON.stringify(payload.answers || [])
        )
        .run();
      return await mutate({
        exitResult: { record_id: recordId, submitted_at: nowStr }
      });
    }

    if (action === 'addVocabulary') {
      const vocabId = String(payload.vocab_id || '').trim() || makeShortId('V');
      await db
        .prepare('INSERT OR REPLACE INTO vocabulary (vocab_id, lesson_id, lesson_title, word, ipa, part_of_speech, meaning_vi, example_en, example_vi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
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
      return await mutate({ vocab: { vocab_id: vocabId } });
    }

    if (action === 'batchAddVocabulary') {
      const list = Array.isArray(payload.vocabulary) ? payload.vocabulary : [];
      if (list.length === 0) {
        return await mutate({
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
      return await mutate({
        importedVocab: { importedCount: list.length, lessonIds: Array.from(lessonIdSet) }
      });
    }

    if (action === 'deleteVocabulary') {
      const vocabId = String(payload.vocab_id || '').trim();
      const lessonId = String(payload.lesson_id || '').trim();
      let deletedCount = 0;
      if (vocabId) {
        const delRes = await db
          .prepare('DELETE FROM vocabulary WHERE TRIM(vocab_id) = ?')
          .bind(vocabId)
          .run();
        deletedCount = delRes && delRes.meta ? Number(delRes.meta.changes || 0) : 0;
      } else if (lessonId) {
        const delRes = await db
          .prepare('DELETE FROM vocabulary WHERE TRIM(lesson_id) = ?')
          .bind(lessonId)
          .run();
        deletedCount = delRes && delRes.meta ? Number(delRes.meta.changes || 0) : 0;
      }
      return await mutate({
        deletedVocab: { vocab_id: vocabId, lesson_id: lessonId, deleted_count: deletedCount }
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
      return await mutate({ assignment: { assignment_id: asgId } });
    }

    if (action === 'renameAssignmentSession') {
      const oldName = String(payload.old_session_tag || '').trim();
      const newName = String(payload.new_session_tag || '').trim();
      if (!oldName || !newName) {
        return respond(jsonResponse({ ok: false, error: 'Thiếu tên buổi học cũ hoặc mới.' }, 400));
      }
      const res = await db
        .prepare("UPDATE assignments SET session_tag = ? WHERE TRIM(COALESCE(session_tag, 'Buổi 1')) = ? AND LOWER(TRIM(COALESCE(require_media, 'audio_or_video'))) NOT IN ('practice', 'vocab')")
        .bind(newName, oldName)
        .run();
      const updatedCount = res && res.meta ? Number(res.meta.changes || 0) : 0;
      return await mutate({
        renamedSession: { old_session_tag: oldName, new_session_tag: newName, updated_count: updatedCount }
      });
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
        return await mutate({
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
      return await mutate({
        updated: { updated_count: updatedCount, target_class: targetClass }
      });
    }

    if (action === 'deleteAssignment') {
      const assignmentId = String(payload.assignment_id || '').trim();
      if (!assignmentId) {
        return await mutate({
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
      return await mutate({
        deletedAssignment: {
          deleted: changesOf(0) > 0,
          assignment_id: assignmentId,
          deleted_assignments: changesOf(0),
          deleted_submissions: changesOf(1)
        },
        deletedMediaUrls: await filterUnreferencedDriveUrls(db, mediaCandidates)
      });
    }

    if (action === 'submitPracticeExercise') {
      const exerciseId = String(payload.exercise_id || '').trim();
      const requestedStudentId = String(payload.student_id || '').trim();
      if (session.role === 'student' && requestedStudentId && requestedStudentId !== session.uid) {
        return respond(jsonResponse({ ok: false, error: 'Không thể nộp bài thay học sinh khác.' }, 403));
      }
      const studentId = session.role === 'student' ? String(session.uid) : requestedStudentId;
      const studentName = session.role === 'student'
        ? String(auth.user.full_name || payload.student_name || '')
        : String(payload.student_name || '');

      const exRow = await db
        .prepare('SELECT exercise_id, total_score, thresholds_json, sections_json FROM practice_exercises WHERE exercise_id = ? LIMIT 1')
        .bind(exerciseId)
        .first();
      if (!exRow) {
        return respond(jsonResponse({ ok: false, error: 'Không tìm thấy bài luyện tập trên máy chủ.' }, 404));
      }

      const existing = await db
        .prepare('SELECT submission_id, manual_grades_json FROM practice_submissions WHERE exercise_id = ? AND student_id = ? LIMIT 1')
        .bind(exerciseId, studentId)
        .first();
      const subId = existing && existing.submission_id ? String(existing.submission_id) : makeShortId('PRAC_SUB');
      const nowStr = formatViDateTime();

      let answersObj = {};
      try {
        answersObj = payload.answers && typeof payload.answers === 'object'
          ? payload.answers
          : JSON.parse(String(payload.answers_json || '{}'));
      } catch (e) {
        answersObj = {};
      }
      let existingManual = {};
      try {
        existingManual = existing && existing.manual_grades_json
          ? JSON.parse(existing.manual_grades_json || '{}')
          : {};
      } catch (e) {
        existingManual = {};
      }

      const graded = gradePracticeSubmissionServer(exRow, answersObj, existingManual);
      const answersJson = JSON.stringify(answersObj || {});

      await db
        .prepare('INSERT OR REPLACE INTO practice_submissions (submission_id, exercise_id, student_id, student_name, total_score, max_score, rating, submitted_at, section_scores_json, answers_json, manual_grades_json, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          subId,
          exerciseId,
          studentId,
          studentName,
          graded.totalScore,
          graded.maxScore,
          graded.rating,
          nowStr,
          graded.sectionScoresJson,
          answersJson,
          graded.manualGradesJson,
          graded.status
        )
        .run();

      const fullExRow = await db
        .prepare('SELECT exercise_id, title, lesson_tag, total_score, thresholds_json, sections_json, created_at FROM practice_exercises WHERE exercise_id = ? LIMIT 1')
        .bind(exerciseId)
        .first();
      const unlockedExercise = fullExRow
        ? (session.role === 'teacher' ? fullExRow : sanitizePracticeExerciseForStudent(fullExRow, true))
        : null;

      return await mutate({
        practiceSubmission: {
          submission_id: subId,
          exercise_id: exerciseId,
          student_id: studentId,
          student_name: studentName,
          submitted_at: nowStr,
          status: graded.status,
          total_score: graded.totalScore,
          max_score: graded.maxScore,
          rating: graded.rating,
          section_scores: graded.sectionScores,
          manual_grades: graded.manualGrades
        },
        practiceExercise: unlockedExercise
      });
    }

    if (action === 'gradeManualTranslation') {
      const subId = String(payload.submission_id || '');
      const existing = await db
        .prepare('SELECT * FROM practice_submissions WHERE submission_id = ? LIMIT 1')
        .bind(subId)
        .first();
      if (!existing) {
        return await mutate({ practiceSubmission: null });
      }
      const nextScore = payload.total_score !== undefined ? Number(payload.total_score) : Number(existing.total_score || 0);
      const rawNextRating = payload.rating && typeof payload.rating === 'object' && payload.rating.key
        ? payload.rating.key
        : payload.rating;
      const nextRatingStr = String(rawNextRating || existing.rating || '').trim();
      const nextRating = nextRatingStr === '[object Object]' ? '' : nextRatingStr;
      const nextManualGrades =
        typeof payload.manual_grades === 'object'
          ? JSON.stringify(payload.manual_grades)
          : String(payload.manual_grades_json || existing.manual_grades_json || '{}');
      const nextSectionScores =
        typeof payload.section_scores === 'object' && payload.section_scores !== null
          ? JSON.stringify(payload.section_scores)
          : (typeof payload.section_scores_json === 'string' && payload.section_scores_json
            ? payload.section_scores_json
            : String(existing.section_scores_json || '{}'));

      await db
        .prepare("UPDATE practice_submissions SET total_score = ?, rating = ?, section_scores_json = ?, manual_grades_json = ?, status = 'graded' WHERE submission_id = ?")
        .bind(nextScore, nextRating, nextSectionScores, nextManualGrades, subId)
        .run();

      return await mutate({
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

      return await mutate({
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
      return await mutate({
        deleted: deleted,
        exercise_id: exId,
        deletedMediaUrls: deletedMediaUrls
      });
    }

    return respond(jsonResponse({ ok: false, error: 'Yêu cầu không hợp lệ.' }, 400));
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
