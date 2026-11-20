/**
 * StudySnap — Logic Trang Đăng Nhập Phân Quyền (`index.html`)
 */

(function () {
  let state = window.StudySnapStore.loadState();
  let selectedRole = 'student';

  function showToast(msg) {
    const toast = document.getElementById('toast-banner');
    const text = document.getElementById('toast-message');
    if (!toast || !text) return;
    text.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(window.__loginToastTimer);
    window.__loginToastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 3200);
  }

  function renderSessionBanner() {
    const current = window.StudySnapAuth.getCurrentUser();
    const banner = document.getElementById('active-session-banner');
    if (!banner) return;

    if (!current) {
      banner.style.display = 'none';
      return;
    }

    banner.style.display = 'block';
    const titleEl = document.getElementById('active-session-title');
    const descEl = document.getElementById('active-session-desc');
    const contBtn = document.getElementById('btn-continue-session');

    if (titleEl) {
      titleEl.textContent = 'Đang đăng nhập: ' + current.full_name + ' (' + (current.role === 'teacher' ? 'Giáo viên' : current.student_id) + ')';
    }
    if (descEl) {
      descEl.textContent = current.role === 'teacher'
        ? 'Nhấn "Vào không gian làm việc" để mở cổng Quản lý & Chấm bài của Giáo viên.'
        : 'Nhấn "Vào không gian làm việc" để mở cổng Học tập của Học sinh.';
    }
    if (contBtn) {
      contBtn.href = current.role === 'teacher' ? 'teacher.html' : 'student.html';
    }
  }

  function setRoleTab(role) {
    selectedRole = role;
    document.querySelectorAll('[data-role-tab]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-role-tab') === role);
    });
    const badge = document.getElementById('selected-role-badge');
    const userLabel = document.getElementById('login-username-label');
    const userInput = document.getElementById('login-username');
    const submitText = document.getElementById('login-submit-text');

    if (role === 'teacher') {
      if (badge) badge.textContent = 'Vai trò: Giáo viên';
      if (userLabel) userLabel.textContent = 'Tên đăng nhập Giáo viên';
      if (userInput) userInput.placeholder = 'Nhập tên đăng nhập giáo viên';
      if (submitText) submitText.textContent = 'Đăng nhập vào Cổng Giáo viên';
    } else {
      if (badge) badge.textContent = 'Vai trò: Học sinh';
      if (userLabel) userLabel.textContent = 'Tên đăng nhập hoặc Mã Học sinh';
      if (userInput) userInput.placeholder = 'Nhập tên đăng nhập được cấp';
      if (submitText) submitText.textContent = 'Đăng nhập vào Cổng Học sinh';
    }
  }

  function setSyncBadgeState(isLoading) {
    const syncBadge = document.getElementById('login-sync-badge');
    if (!syncBadge) return;
    if (isLoading) {
      syncBadge.classList.add('is-syncing');
      syncBadge.innerHTML =
        '<span class="ss-spinner ss-spinner-sm" aria-hidden="true"></span>' +
        '<span>Đang đồng bộ hệ thống...</span>';
    } else {
      syncBadge.classList.remove('is-syncing');
      syncBadge.textContent = 'Hệ thống học tập trực tuyến';
    }
  }

  function setFormInteractive(enabled) {
    const ids = ['login-username', 'login-password', 'btn-toggle-password', 'btn-clear-session'];
    ids.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.disabled = !enabled;
    });
    document.querySelectorAll('[data-role-tab]').forEach(function (btn) {
      btn.disabled = !enabled;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session') === 'expired') {
      window.StudySnapAuth.setCurrentUser(null);
      if (document && document.documentElement) {
        document.documentElement.classList.remove('is-auth-redirecting');
      }
      showToast('Phiên đăng nhập trước đã hết hiệu lực. Vui lòng đăng nhập lại.');
      if (window.history && typeof window.history.replaceState === 'function') {
        try {
          window.history.replaceState(null, '', window.location.pathname || 'index.html');
        } catch (e) {}
      }
    } else if (window.StudySnapAuth && typeof window.StudySnapAuth.redirectIfAuthenticated === 'function') {
      if (window.StudySnapAuth.redirectIfAuthenticated()) return;
    }

    if (state && state.isClearedForProduction === true) {
      window.StudySnapAuth.revalidateActiveSession(state);
    }
    renderSessionBanner();

    window.addEventListener('pageshow', function (ev) {
      if (ev && ev.persisted && window.StudySnapAuth && typeof window.StudySnapAuth.redirectIfAuthenticated === 'function') {
        window.StudySnapAuth.redirectIfAuthenticated();
      }
    });

    window.addEventListener('storage', function (ev) {
      if (!ev || ev.key === 'studysnap_active_session_v2' || ev.key === null) {
        if (window.StudySnapAuth && typeof window.StudySnapAuth.redirectIfAuthenticated === 'function' && window.StudySnapAuth.redirectIfAuthenticated()) {
          return;
        }
        renderSessionBanner();
      }
    });

    // Không tự động tải bootstrap chứa dữ liệu lớp trước khi đăng nhập; chỉ kiểm tra phiên /api?action=session
    if (window.StudySnapAuth && typeof window.StudySnapAuth.isHttpRuntime === 'function' && window.StudySnapAuth.isHttpRuntime()) {
      setSyncBadgeState(true);
      const checkPromise =
        window.StudySnapStore && typeof window.StudySnapStore.fetchSessionFromD1 === 'function'
          ? window.StudySnapStore.fetchSessionFromD1(state)
          : Promise.resolve(null);
      checkPromise
        .then(function (sesRes) {
          if (sesRes && sesRes.backend === 'd1') {
            if (sesRes.authenticated && sesRes.user) {
              window.StudySnapAuth.setCurrentUser(
                Object.assign({}, sesRes.user, {
                  expires_at: Number(sesRes.expiresAt || 0) || undefined
                })
              );
              if (window.StudySnapAuth.redirectIfAuthenticated()) {
                return;
              }
            } else {
              window.StudySnapAuth.setCurrentUser(null);
              renderSessionBanner();
              if (sesRes.sessionExpired) {
                showToast('Phiên đăng nhập trước đã hết hiệu lực. Vui lòng đăng nhập lại.');
              }
            }
          }
        })
        .finally(function () {
          setSyncBadgeState(false);
        });
    }

    document.querySelectorAll('[data-role-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setRoleTab(btn.getAttribute('data-role-tab'));
      });
    });

    const togglePwdBtn = document.getElementById('btn-toggle-password');
    const pwdInput = document.getElementById('login-password');
    if (togglePwdBtn && pwdInput) {
      togglePwdBtn.addEventListener('click', function () {
        const isHidden = pwdInput.type === 'password';
        pwdInput.type = isHidden ? 'text' : 'password';
        togglePwdBtn.textContent = isHidden ? 'Ẩn' : 'Hiện';
      });
    }

    const clearSessionBtn = document.getElementById('btn-clear-session');
    if (clearSessionBtn) {
      clearSessionBtn.addEventListener('click', function () {
        window.StudySnapAuth.logout();
      });
    }

    const loginForm = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error-box');

    if (loginForm) {
      loginForm.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const u = document.getElementById('login-username').value;
        const p = document.getElementById('login-password').value;
        const submitBtn = document.getElementById('login-submit-btn') || loginForm.querySelector('button[type="submit"]');
        const loading = window.StudySnapLoading;
        if (submitBtn && (submitBtn.disabled || submitBtn.classList.contains('is-loading'))) return;

        if (errorBox) errorBox.classList.remove('is-visible');
        setFormInteractive(false);
        if (loading) {
          if (submitBtn) loading.setButtonLoading(submitBtn, true, 'Đang kiểm tra tài khoản...');
          loading.showOverlay('Đang xác thực tài khoản...', 'Hệ thống đang kiểm tra thông tin đăng nhập. Vui lòng đợi trong giây lát.');
        } else if (submitBtn) {
          submitBtn.disabled = true;
        }

        let result = null;
        let didRedirect = false;

        try {
          const isHttp = window.StudySnapAuth && typeof window.StudySnapAuth.isHttpRuntime === 'function'
            ? window.StudySnapAuth.isHttpRuntime()
            : false;
          const canTryServer = isHttp || Boolean(window.StudySnapStore.getGasUrl());

          if (canTryServer) {
            const remoteAuth = await window.StudySnapStore.syncPostToGas(state, {
              action: 'login',
              username: u,
              password: p
            });

            if (remoteAuth && remoteAuth.ok && remoteAuth.user) {
              const authUser = Object.assign({}, remoteAuth.user, {
                expires_at: Number(remoteAuth.expiresAt || 0) || undefined
              });
              if (authUser.role === 'teacher') {
                if (!Array.isArray(state.teachers)) state.teachers = [];
                const hasTeacher = state.teachers.some(function (t) {
                  return (
                    (authUser.id && String(t.teacher_id || '') === String(authUser.id)) ||
                    (authUser.username && String(t.username || '').toLowerCase() === String(authUser.username).toLowerCase())
                  );
                });
                if (!hasTeacher) {
                  state.teachers.push({
                    teacher_id: authUser.id || 'GV01',
                    full_name: authUser.full_name || '',
                    username: authUser.username || '',
                    subject: authUser.subject || 'Giáo viên phụ trách'
                  });
                }
              } else if (authUser.role === 'student') {
                if (!Array.isArray(state.students)) state.students = [];
                const sId = authUser.student_id || authUser.id || '';
                const hasStudent = state.students.some(function (s) {
                  return (
                    (sId && String(s.student_id || '') === String(sId)) ||
                    (authUser.username && String(s.username || '').toLowerCase() === String(authUser.username).toLowerCase())
                  );
                });
                if (!hasStudent) {
                  state.students.push({
                    student_id: sId,
                    full_name: authUser.full_name || '',
                    username: authUser.username || '',
                    class_name: authUser.class_name || '',
                    avatar_initials: authUser.avatar_initials || ''
                  });
                }
              }
              window.StudySnapStore.saveState(state);
              window.StudySnapAuth.setCurrentUser(authUser);
              if (loading) {
                if (submitBtn) loading.setButtonLoading(submitBtn, true, 'Đang chuyển trang...');
                loading.showOverlay('Đăng nhập thành công!', 'Đang mở không gian làm việc StudySnap...');
              }
              result = { ok: true, user: authUser };
            } else if (remoteAuth) {
              result = {
                ok: false,
                error: remoteAuth.error || 'Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.'
              };
            } else if (!isHttp) {
              // Ngoại tuyến file:// mới kiểm tra cục bộ
              result = window.StudySnapAuth.authenticate(u, p);
            } else {
              result = {
                ok: false,
                error: 'Không thể kết nối máy chủ xác thực lúc này. Vui lòng kiểm tra mạng và thử lại.'
              };
            }
          } else {
            result = window.StudySnapAuth.authenticate(u, p);
          }

          if (result && result.ok) {
            didRedirect = true;
            const targetUrl = window.StudySnapAuth && typeof window.StudySnapAuth.getPortalUrl === 'function'
              ? window.StudySnapAuth.getPortalUrl(result.user.role)
              : (result.user.role === 'teacher' ? 'teacher.html' : 'student.html');
            window.location.replace(targetUrl || 'student.html');
            return;
          }
        } finally {
          if (!didRedirect) {
            if (loading) {
              loading.hideOverlay(true);
              if (submitBtn) loading.setButtonLoading(submitBtn, false);
            } else if (submitBtn) {
              submitBtn.disabled = false;
            }
            setFormInteractive(true);
            setRoleTab(selectedRole);
          }
        }

        if (errorBox) {
          errorBox.textContent = (result && result.error) || 'Đăng nhập thất bại.';
          errorBox.classList.add('is-visible');
        }
      });
    }
  });
})();
