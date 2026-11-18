/**
 * StudySnap — Quản lý Đăng nhập, Phân quyền Vai trò (Giáo viên / Học sinh) & Bảo vệ Trang
 */

window.StudySnapAuth = (function () {
  const SESSION_KEY = 'studysnap_active_session_v2';
  const STATE_STORAGE_KEY = 'studysnap_app_state_zh_v1';

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
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setCurrentUser(userObj) {
    if (!userObj) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
  }

  function authenticate(usernameInput, passwordInput) {
    const state = window.StudySnapStore.loadState();
    const u = String(usernameInput || '').trim().toLowerCase();
    const p = String(passwordInput || '').trim();

    if (!u || !p) {
      return { ok: false, error: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.' };
    }

    // 1. Kiểm tra danh sách Giáo viên
    for (let i = 0; i < state.teachers.length; i++) {
      const t = state.teachers[i];
      if (String(t.username || '').toLowerCase() === u && String(t.password || '') === p) {
        const sessionUser = {
          role: 'teacher',
          id: t.teacher_id,
          full_name: t.full_name,
          username: t.username,
          subject: t.subject || 'Giáo viên phụ trách'
        };
        setCurrentUser(sessionUser);
        return { ok: true, user: sessionUser };
      }
    }

    // 2. Kiểm tra danh sách Học sinh (cho phép đăng nhập bằng username hoặc mã HS như HS01)
    for (let j = 0; j < state.students.length; j++) {
      const s = state.students[j];
      const matchUser =
        String(s.username || '').toLowerCase() === u ||
        String(s.student_id || '').toLowerCase() === u;

      if (matchUser && String(s.password || '') === p) {
        const sessionUser = {
          role: 'student',
          id: s.student_id,
          student_id: s.student_id,
          full_name: s.full_name,
          username: s.username || s.student_id.toLowerCase(),
          class_name: s.class_name || 'Lớp Tiếng Trung HSK 2',
          avatar_initials: s.avatar_initials || window.StudySnapStore.getInitials(s.full_name)
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

  function logout() {
    localStorage.removeItem(SESSION_KEY);
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

  function attachPortalSessionGuard(requiredRole) {
    if (window.__ssPortalGuardBound) return;
    window.__ssPortalGuardBound = true;

    function checkPortalSession() {
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview') === '1') return;
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
    });
    window.addEventListener('storage', function (ev) {
      if (!ev || ev.key === SESSION_KEY || ev.key === null) {
        checkPortalSession();
      }
    });
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
        if (!revalidateActiveSession(state)) {
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
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get('preview') === '1';
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
      if (!revalidateActiveSession(state)) {
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
    authenticate: authenticate,
    revalidateActiveSession: revalidateActiveSession,
    redirectIfAuthenticated: redirectIfAuthenticated,
    logout: logout,
    enforceRole: enforceRole
  };
})();

