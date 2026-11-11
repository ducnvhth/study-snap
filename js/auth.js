/**
 * StudySnap — Quản lý Đăng nhập, Phân quyền Vai trò (Giáo viên / Học sinh) & Bảo vệ Trang
 */

window.StudySnapAuth = (function () {
  const SESSION_KEY = 'studysnap_active_session_v2';

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
    window.location.href = 'index.html';
  }

  /**
   * Bảo vệ trang theo vai trò ('teacher' hoặc 'student')
   */
  function enforceRole(requiredRole) {
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get('preview') === '1';
    const user = getCurrentUser();

    if (!user) {
      if (isPreview) {
        const state = window.StudySnapStore.loadState();
        if (requiredRole === 'teacher') {
          const t = state.teachers[0];
          return {
            role: 'teacher',
            id: t.teacher_id,
            full_name: t.full_name,
            username: t.username,
            subject: t.subject
          };
        } else {
          const s = state.students[0];
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
      window.location.replace('index.html');
      return null;
    }

    if (user.role !== requiredRole) {
      window.location.replace(user.role === 'teacher' ? 'teacher.html' : 'student.html');
      return null;
    }

    return user;
  }

  return {
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    authenticate: authenticate,
    logout: logout,
    enforceRole: enforceRole
  };
})();

