/**
 * StudySnap — Quản lý Đăng nhập, Phân quyền Vai trò (Giáo viên / Học sinh) & Bảo vệ Trang
 */

window.StudySnapAuth = (function () {
  const SESSION_KEY = 'studysnap_active_session_v2';
  const STATE_STORAGE_KEY = 'studysnap_app_state_zh_v1';
  const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  function isHttpRuntime() {
    try {
      return Boolean(
        typeof window !== 'undefined' &&
          window.location &&
          /^https?:$/i.test(String(window.location.protocol || ''))
      );
    } catch (e) {
      return false;
    }
  }

  function isPreviewAllowed() {
    try {
      if (isHttpRuntime()) return false;
      const params = new URLSearchParams(window.location.search);
      return params.get('preview') === '1';
    } catch (e) {
      return false;
    }
  }

  function sanitizeUserObject(userObj) {
    if (!userObj || typeof userObj !== 'object') return null;
    const clean = Object.assign({}, userObj);
    delete clean.password;
    if (!clean.expires_at) {
      clean.expires_at = Date.now() + SESSION_TTL_MS;
    }
    return clean;
  }

  function getPortalUrl(role) {
    if (role === 'teacher') return 'teacher.html';
    if (role === 'student') return 'student.html';
    return '';
  }

  function readStoredStateForAuth() {
    if (window.StudySnapStore && typeof window.StudySnapStore.loadState === 'function') {
      return window.StudySnapStore.loadState();
    }
    try {
      const raw = localStorage.getItem(STATE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.password !== undefined) {
        delete parsed.password;
      }
      const exp = Number(parsed.expires_at || 0);
      if (exp > 0 && Date.now() > exp) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function setCurrentUser(userObj) {
    if (!userObj) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    const clean = sanitizeUserObject(userObj);
    localStorage.setItem(SESSION_KEY, JSON.stringify(clean));
  }

  function getLocalDemoPassword(role, idOrUsername) {
    if (isHttpRuntime()) return '';
    const seed = typeof window !== 'undefined' ? window.STUDYSNAP_INITIAL_DATA : null;
    if (!seed) return '';
    const key = String(idOrUsername || '').trim().toLowerCase();
    const list = role === 'teacher' ? (seed.teachers || []) : (seed.students || []);
    const found = list.find(function (u) {
      return (
        String(u.teacher_id || u.student_id || '').trim().toLowerCase() === key ||
        String(u.username || '').trim().toLowerCase() === key
      );
    });
    return found && found.password ? String(found.password) : '';
  }

  function authenticate(usernameInput, passwordInput) {
    if (isHttpRuntime()) {
      return {
        ok: false,
        error: 'Vui lòng đăng nhập qua máy chủ xác thực.'
      };
    }
    const state = window.StudySnapStore.loadState();
    const u = String(usernameInput || '').trim().toLowerCase();
    const p = String(passwordInput || '').trim();

    if (!u || !p) {
      return { ok: false, error: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.' };
    }

    // 1. Kiểm tra danh sách Giáo viên (chỉ chạy ngoại tuyến file://)
    for (let i = 0; i < state.teachers.length; i++) {
      const t = state.teachers[i];
      const expectedPwd = String(t.password || getLocalDemoPassword('teacher', t.username || t.teacher_id) || '');
      if (String(t.username || '').toLowerCase() === u && expectedPwd && expectedPwd === p) {
        const sessionUser = {
          role: 'teacher',
          id: t.teacher_id,
          full_name: t.full_name,
          username: t.username,
          subject: t.subject || 'Giáo viên phụ trách',
          expires_at: Date.now() + SESSION_TTL_MS
        };
        setCurrentUser(sessionUser);
        return { ok: true, user: sessionUser };
      }
    }

    // 2. Kiểm tra danh sách Học sinh (ngoại tuyến file://)
    for (let j = 0; j < state.students.length; j++) {
      const s = state.students[j];
      const matchUser =
        String(s.username || '').toLowerCase() === u ||
        String(s.student_id || '').toLowerCase() === u;
      const expectedPwd = String(s.password || getLocalDemoPassword('student', s.student_id || s.username) || '');

      if (matchUser && expectedPwd && expectedPwd === p) {
        const sessionUser = {
          role: 'student',
          id: s.student_id,
          student_id: s.student_id,
          full_name: s.full_name,
          username: s.username || s.student_id.toLowerCase(),
          class_name: s.class_name || 'Lớp Tiếng Trung HSK 2',
          avatar_initials: s.avatar_initials || window.StudySnapStore.getInitials(s.full_name),
          expires_at: Date.now() + SESSION_TTL_MS
        };
        setCurrentUser(sessionUser);
        return { ok: true, user: sessionUser };
      }
    }

    return {
      ok: false,
      error: 'Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại hoặc liên hệ giáo viên.'
    };
  }

  function handleSessionExpired() {
    if (window.__ssHandlingSessionExpiry) return;
    window.__ssHandlingSessionExpiry = true;
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(STATE_STORAGE_KEY);
    } catch (e) {
      // Ignore storage errors
    }
    try {
      const path = String((window.location && window.location.pathname) || '').toLowerCase();
      if (!path.endsWith('/index.html') && path !== 'index.html' && path !== '/') {
        window.location.replace('index.html?session=expired');
      } else if (document && document.documentElement) {
        document.documentElement.classList.remove('is-auth-redirecting');
      }
    } catch (e) {
      // Ignore redirect errors
    }
  }

  async function logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(STATE_STORAGE_KEY);
    } catch (e) {
      // Ignore storage errors
    }
    if (isHttpRuntime() && typeof fetch === 'function') {
      try {
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timer = controller ? setTimeout(function () { controller.abort(); }, 1800) : null;
        await fetch('/api', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout' }),
          keepalive: true,
          signal: controller ? controller.signal : undefined
        });
        if (timer) clearTimeout(timer);
      } catch (e) {
        // Proceed with redirect
      }
    }
    window.location.replace('index.html');
  }

  function revalidateActiveSession(stateObj) {
    const user = getCurrentUser();
    if (!user || !stateObj) return null;

    const teachers = Array.isArray(stateObj.teachers) ? stateObj.teachers : [];
    const students = Array.isArray(stateObj.students) ? stateObj.students : [];
    let exists = false;

    if (user.role === 'teacher') {
      const uId = String(user.id || '').trim();
      const uName = String(user.username || '').trim().toLowerCase();
      exists = teachers.some(function (t) {
        return (
          (uId && String(t.teacher_id || '').trim() === uId) ||
          (uName && String(t.username || '').trim().toLowerCase() === uName)
        );
      });
    } else if (user.role === 'student') {
      const sId = String(user.student_id || user.id || '').trim();
      const sName = String(user.username || '').trim().toLowerCase();
      exists = students.some(function (s) {
        return (
          (sId && String(s.student_id || '').trim() === sId) ||
          (sName && String(s.username || '').trim().toLowerCase() === sName)
        );
      });
    }

    if (!exists) {
      setCurrentUser(null);
      return null;
    }
    return user;
  }

  async function syncSessionFromServer(requiredRole) {
    if (!isHttpRuntime() || typeof fetch !== 'function') {
      return { checked: false, authenticated: Boolean(getCurrentUser()), user: getCurrentUser() };
    }
    try {
      const res = await fetch('/api?action=session', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const json = await res.json();
      if (!json || json.d1Missing || json.backend !== 'cloudflare-d1') {
        return { checked: false, authenticated: Boolean(getCurrentUser()), user: getCurrentUser() };
      }
      if (json.needsMigration) {
        return { checked: true, needsMigration: true, authenticated: false, user: null };
      }
      if (json.authenticated && json.user) {
        const syncedUser = sanitizeUserObject(
          Object.assign({}, json.user, {
            expires_at: Number(json.expiresAt || 0) || (Date.now() + SESSION_TTL_MS)
          })
        );
        setCurrentUser(syncedUser);
        if (requiredRole && syncedUser.role !== requiredRole) {
          window.location.replace(getPortalUrl(syncedUser.role) || 'index.html');
          return { checked: true, authenticated: true, roleMismatch: true, user: syncedUser };
        }
        return { checked: true, authenticated: true, user: syncedUser };
      }
      setCurrentUser(null);
      if (requiredRole) {
        handleSessionExpired();
      }
      return {
        checked: true,
        authenticated: false,
        sessionExpired: Boolean(json.sessionExpired),
        user: null
      };
    } catch (e) {
      return { checked: false, authenticated: Boolean(getCurrentUser()), user: getCurrentUser() };
    }
  }

  function attachPortalSessionGuard(requiredRole) {
    if (window.__ssPortalGuardBound) return;
    window.__ssPortalGuardBound = true;

    function checkPortalSession() {
      if (isPreviewAllowed()) return;
      const current = getCurrentUser();
      if (!current) {
        window.location.replace('index.html');
        return;
      }
      if (requiredRole && current.role !== requiredRole) {
        const target = getPortalUrl(current.role) || 'index.html';
        window.location.replace(target);
      }
    }

    window.addEventListener('pageshow', function (ev) {
      if (ev && ev.persisted) checkPortalSession();
      if (isHttpRuntime()) syncSessionFromServer(requiredRole);
    });
    window.addEventListener('storage', function (ev) {
      if (!ev || ev.key === SESSION_KEY || ev.key === null) {
        checkPortalSession();
      }
    });

    if (isHttpRuntime()) {
      syncSessionFromServer(requiredRole);
    }
  }

  /**
   * Chuyển thẳng vào cổng làm việc nếu người dùng vẫn đang đăng nhập hợp lệ.
   * Chỉ giữ lại trang đăng nhập khi chưa đăng nhập, đã đăng xuất, hoặc phiên hết hiệu lực.
   */
  function redirectIfAuthenticated() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('session') === 'expired') {
        setCurrentUser(null);
        if (document && document.documentElement) {
          document.documentElement.classList.remove('is-auth-redirecting');
        }
        return false;
      }

      const user = getCurrentUser();
      if (!user) {
        if (document && document.documentElement) {
          document.documentElement.classList.remove('is-auth-redirecting');
        }
        return false;
      }

      const target = getPortalUrl(user.role);
      if (!target) {
        if (document && document.documentElement) {
          document.documentElement.classList.remove('is-auth-redirecting');
        }
        return false;
      }

      const state = readStoredStateForAuth();
      if (state && state.isClearedForProduction === true) {
        const hasUsers =
          (Array.isArray(state.teachers) && state.teachers.length > 0) ||
          (Array.isArray(state.students) && state.students.length > 0);
        if (hasUsers && !revalidateActiveSession(state)) {
          if (document && document.documentElement) {
            document.documentElement.classList.remove('is-auth-redirecting');
          }
          return false;
        }
      }

      if (document && document.documentElement) {
        document.documentElement.classList.add('is-auth-redirecting');
      }
      window.location.replace(target);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Bảo vệ trang theo vai trò ('teacher' hoặc 'student')
   */
  function enforceRole(requiredRole) {
    const isPreview = isPreviewAllowed();
    const user = getCurrentUser();
    const state = window.StudySnapStore ? window.StudySnapStore.loadState() : null;

    if (!user) {
      if (isPreview && state) {
        if (requiredRole === 'teacher') {
          const t = (state.teachers || [])[0];
          if (t) {
            return {
              role: 'teacher',
              id: t.teacher_id,
              full_name: t.full_name,
              username: t.username,
              subject: t.subject
            };
          }
        } else {
          const s = (state.students || [])[0];
          if (s) {
            return {
              role: 'student',
              id: s.student_id,
              student_id: s.student_id,
              full_name: s.full_name,
              username: s.username,
              class_name: s.class_name,
              avatar_initials: s.avatar_initials
            };
          }
        }
      }
      window.location.replace('index.html');
      return null;
    }

    if (state && state.isClearedForProduction === true) {
      const hasUsers =
        (Array.isArray(state.teachers) && state.teachers.length > 0) ||
        (Array.isArray(state.students) && state.students.length > 0);
      if (hasUsers && !revalidateActiveSession(state)) {
        window.location.replace('index.html?session=expired');
        return null;
      }
    }

    if (user.role !== requiredRole) {
      window.location.replace(getPortalUrl(user.role) || 'index.html');
      return null;
    }

    attachPortalSessionGuard(requiredRole);
    return user;
  }

  return {
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    getPortalUrl: getPortalUrl,
    isHttpRuntime: isHttpRuntime,
    isPreviewAllowed: isPreviewAllowed,
    authenticate: authenticate,
    revalidateActiveSession: revalidateActiveSession,
    syncSessionFromServer: syncSessionFromServer,
    handleSessionExpired: handleSessionExpired,
    redirectIfAuthenticated: redirectIfAuthenticated,
    logout: logout,
    enforceRole: enforceRole
  };
})();

