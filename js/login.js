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

  document.addEventListener('DOMContentLoaded', function () {
    renderSessionBanner();

    // Đồng bộ ngầm dữ liệu mới nhất từ hệ thống
    if (window.StudySnapStore.getGasUrl()) {
      window.StudySnapStore.fetchBootstrapFromGas(state).then(function () {
        state = window.StudySnapStore.loadState();
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
        window.StudySnapAuth.setCurrentUser(null);
        renderSessionBanner();
        showToast('Đã đăng xuất phiên hiện tại.');
      });
    }

    const loginForm = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error-box');
    const submitText = document.getElementById('login-submit-text');

    if (loginForm) {
      loginForm.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const u = document.getElementById('login-username').value;
        const p = document.getElementById('login-password').value;

        let result = window.StudySnapAuth.authenticate(u, p);

        if (!result.ok && window.StudySnapStore.getGasUrl()) {
          if (submitText) submitText.textContent = 'Đang kiểm tra tài khoản...';
          const remoteAuth = await window.StudySnapStore.syncPostToGas(state, {
            action: 'login',
            username: u,
            password: p
          });
          if (remoteAuth && remoteAuth.ok && remoteAuth.user) {
            window.StudySnapAuth.setCurrentUser(remoteAuth.user);
            result = { ok: true, user: remoteAuth.user };
          } else {
            await window.StudySnapStore.fetchBootstrapFromGas(state);
            result = window.StudySnapAuth.authenticate(u, p);
          }
          setRoleTab(selectedRole);
        }

        if (!result.ok) {
          if (errorBox) {
            errorBox.textContent = result.error;
            errorBox.classList.add('is-visible');
          }
          return;
        }

        if (errorBox) errorBox.classList.remove('is-visible');
        window.location.href = result.user.role === 'teacher' ? 'teacher.html' : 'student.html';
      });
    }
  });
})();
