/**
 * StudySnap — Logic Cổng Giáo Viên (`teacher.html`)
 * Bao gồm: Chấm chữa BVN bằng Voice, Bảng tổng hợp tự động, Giao BVN mới,
 * Tạo & Quản lý Tài khoản Học sinh, Quản lý Kho từ vựng & Xem kết quả cuối giờ.
 */

(function () {
  const currentUser = window.StudySnapAuth.enforceRole('teacher');
  if (!currentUser) return;

  const ICONS = {
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
    video: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 8-6 4 6 4V8Z"></path><rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect></svg>',
    check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    clock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    alert: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>',
    volume: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>',
    edit: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>'
  };

  let state = window.StudySnapStore.loadState();

  let ui = {
    activeTab: 'grading',
    gradingStudentId: state.students[0] ? state.students[0].student_id : 'HS01',
    gradingAssignmentId: state.assignments[0] ? state.assignments[0].assignment_id : 'BVN01',
    matrixFilter: 'all',
    teacherDraftVoice: null,
    isTeacherRecording: false,
    vocabFilter: 'all'
  };

  function escapeHtml(str) {
    return String(str === undefined || str === null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    const toast = document.getElementById('toast-banner');
    const text = document.getElementById('toast-message');
    if (!toast || !text) return;
    text.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(window.__teacherToastTimer);
    window.__teacherToastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 3400);
  }

  function findSubmission(assignmentId, studentId) {
    return state.submissions.find(function (s) {
      return String(s.assignment_id) === String(assignmentId) && String(s.student_id) === String(studentId);
    });
  }

  function findStudent(studentId) {
    return state.students.find(function (s) {
      return String(s.student_id) === String(studentId);
    });
  }

  function findAssignment(assignmentId) {
    return state.assignments.find(function (a) {
      return String(a.assignment_id) === String(assignmentId);
    });
  }

  function renderSummaryStats() {
    const profilePill = document.getElementById('teacher-profile-pill');
    if (profilePill) {
      profilePill.textContent = currentUser.full_name + ' • Giáo viên';
    }

    const totalExpected = state.students.length * state.assignments.length;
    let submittedOrGraded = 0;
    let gradedWithFeedback = 0;
    let missingCount = 0;

    state.students.forEach(function (st) {
      state.assignments.forEach(function (asg) {
        const sub = findSubmission(asg.assignment_id, st.student_id);
        if (sub && (sub.status === 'submitted' || sub.status === 'graded')) {
          submittedOrGraded++;
          if (sub.status === 'graded' || sub.teacher_comment || sub.teacher_voice_url) {
            gradedWithFeedback++;
          }
        } else {
          missingCount++;
        }
      });
    });

    const elStudents = document.getElementById('stat-total-students');
    const elSubmitted = document.getElementById('stat-submitted-count');
    const elMissing = document.getElementById('stat-missing-count');
    const elGraded = document.getElementById('stat-graded-count');

    if (elStudents) elStudents.textContent = state.students.length + ' học sinh';
    if (elSubmitted) elSubmitted.textContent = submittedOrGraded + '/' + totalExpected;
    if (elMissing) elMissing.textContent = String(missingCount);
    if (elGraded) elGraded.textContent = String(gradedWithFeedback);
  }

  function renderGradingPanel() {
    const studentSelect = document.getElementById('grade-student-select');
    const assignmentSelect = document.getElementById('grade-assignment-select');

    if (studentSelect) {
      studentSelect.innerHTML = state.students.length > 0
        ? state.students.map(function (st) {
            const sel = st.student_id === ui.gradingStudentId ? ' selected' : '';
            return '<option value="' + escapeHtml(st.student_id) + '"' + sel + '>' +
              escapeHtml(st.full_name) + ' (' + escapeHtml(st.student_id) + ')</option>';
          }).join('')
        : '<option value="">-- Chưa có học sinh --</option>';
    }

    if (assignmentSelect) {
      assignmentSelect.innerHTML = state.assignments.length > 0
        ? state.assignments.map(function (asg) {
            const sel = asg.assignment_id === ui.gradingAssignmentId ? ' selected' : '';
            return '<option value="' + escapeHtml(asg.assignment_id) + '"' + sel + '>' +
              escapeHtml(asg.title) + '</option>';
          }).join('')
        : '<option value="">-- Chưa có bài tập --</option>';
    }

    const asg = findAssignment(ui.gradingAssignmentId) || state.assignments[0];
    const st = findStudent(ui.gradingStudentId) || state.students[0];
    const targetBadge = document.getElementById('grading-target-badge');
    const studentMediaBox = document.getElementById('grading-student-media-box');
    const scoreInput = document.getElementById('teacher-score-input');
    const commentInput = document.getElementById('teacher-comment-input');
    const voicePreview = document.getElementById('teacher-voice-preview');

    if (!asg || !st) {
      if (targetBadge) targetBadge.textContent = 'Chưa có dữ liệu';
      if (studentMediaBox) {
        studentMediaBox.innerHTML =
          '<div class="assignment-brief-box">' +
            '<span class="status-badge status-submitted">' + ICONS.clock + '<span>Hệ thống đang trống — Hãy tạo tài khoản học sinh thật và giao bài tập mới</span></span>' +
          '</div>';
      }
      if (voicePreview) voicePreview.innerHTML = '';
      return;
    }

    ui.gradingAssignmentId = asg.assignment_id;
    ui.gradingStudentId = st.student_id;

    const sub = findSubmission(asg.assignment_id, st.student_id);

    if (targetBadge) {
      targetBadge.textContent = st.full_name + ' • ' + asg.lesson_tag;
    }

    if (studentMediaBox) {
      if (sub && (sub.status === 'submitted' || sub.status === 'graded') && sub.media_url) {
        const typeText = sub.media_type === 'video' ? 'Video học sinh nộp' : 'Ghi âm học sinh nộp';
        studentMediaBox.innerHTML =
          '<div class="assignment-brief-box">' +
            '<p class="assignment-brief-desc" style="margin-bottom:6px;">Lời nhắn của học sinh: "' + escapeHtml(sub.student_note || 'Em nộp bài tập ạ.') + '"</p>' +
            window.StudySnapAudio.renderVoicePlayer({
              id: 'grading-student-' + sub.submission_id,
              url: sub.media_url,
              duration: sub.media_duration || '01:15',
              label: st.full_name + ' — ' + typeText,
              fallbackText: '老师好！我是越南留学生，我每天都很努力学习汉语。',
              lang: 'zh-CN',
              variant: 'student'
            }) +
          '</div>';
      } else {
        studentMediaBox.innerHTML =
          '<div class="assignment-brief-box">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
              '<span class="status-badge status-missing">' + ICONS.alert + '<span>Học sinh chưa nộp file ghi âm/video</span></span>' +
              '<span style="font-size:0.875rem;color:var(--color-muted-foreground);">Giáo viên vẫn có thể gửi nhận xét hoặc nhắc nhở bằng Voice/Text</span>' +
            '</div>' +
          '</div>';
      }
    }

    if (scoreInput && document.activeElement !== scoreInput) {
      scoreInput.value = sub && sub.score !== undefined && sub.score !== '' ? sub.score : '';
    }
    if (commentInput && document.activeElement !== commentInput) {
      commentInput.value = sub && sub.teacher_comment ? sub.teacher_comment : '';
    }

    if (voicePreview) {
      if (ui.teacherDraftVoice) {
        voicePreview.innerHTML =
          '<div class="voice-feedback-box">' +
            window.StudySnapAudio.renderVoicePlayer({
              id: 'teacher-draft-voice-' + st.student_id + '-' + asg.assignment_id,
              url: ui.teacherDraftVoice.dataUrl,
              duration: ui.teacherDraftVoice.duration || '00:30',
              label: 'Bản thu Voice Feedback mới (Chưa lưu)',
              fallbackText: '你的汉语发音很标准，继续加油！',
              lang: 'vi-VN',
              variant: 'teacher'
            }) +
          '</div>';
      } else if (sub && sub.teacher_voice_url) {
        voicePreview.innerHTML =
          '<div class="voice-feedback-box">' +
            window.StudySnapAudio.renderVoicePlayer({
              id: 'grading-teacher-voice-' + sub.submission_id,
              url: sub.teacher_voice_url,
              duration: sub.teacher_voice_duration || '00:35',
              label: 'Voice Feedback của Giáo viên đã lưu',
              fallbackText: sub.teacher_comment || '你的汉语发音很标准，继续加油！',
              lang: 'vi-VN',
              variant: 'teacher'
            }) +
          '</div>';
      } else {
        voicePreview.innerHTML = '';
      }
    }
  }

  function renderProgressMatrix() {
    const thead = document.getElementById('matrix-thead');
    const tbody = document.getElementById('matrix-tbody');
    if (!thead || !tbody) return;

    thead.innerHTML =
      '<tr>' +
        '<th>Học sinh</th>' +
        state.assignments.map(function (asg) {
          return '<th>' +
            '<div>' + escapeHtml(asg.lesson_tag) + ': ' + escapeHtml(asg.title.replace(/^Bài \d+:\s*/i, '')) + '</div>' +
            '<div class="tabular-nums" style="font-size:0.8125rem;font-weight:500;color:var(--color-muted-foreground);margin-top:2px;">Hạn nộp: ' + escapeHtml(asg.due_date) + '</div>' +
          '</th>';
        }).join('') +
        '<th>Tổng kết tiến độ</th>' +
      '</tr>';

    if (state.students.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="' + (state.assignments.length + 2) + '" style="text-align:center;padding:28px;color:var(--color-muted-foreground);">' +
          'Hiện chưa có học sinh nào trong lớp. Hãy bấm <strong>"Tạo tài khoản cho học sinh mới"</strong> để bắt đầu danh sách lớp học thật.' +
        '</td></tr>';
      return;
    }

    const filteredStudents = state.students.filter(function (st) {
      if (ui.matrixFilter === 'all') return true;
      const statuses = state.assignments.map(function (asg) {
        const sub = findSubmission(asg.assignment_id, st.student_id);
        return sub ? sub.status : 'missing';
      });
      if (ui.matrixFilter === 'missing') return statuses.indexOf('missing') >= 0;
      if (ui.matrixFilter === 'submitted') return statuses.indexOf('submitted') >= 0;
      if (ui.matrixFilter === 'graded') return statuses.indexOf('graded') >= 0;
      return true;
    });

    tbody.innerHTML = filteredStudents.map(function (st) {
      let completedCount = 0;

      const assignmentCells = state.assignments.map(function (asg) {
        const sub = findSubmission(asg.assignment_id, st.student_id);
        const status = sub ? sub.status : 'missing';
        if (status === 'submitted' || status === 'graded') {
          completedCount++;
        }

        let badgeHtml = '';
        if (status === 'graded') {
          badgeHtml = '<span class="status-badge status-graded">' + ICONS.check +
            '<span>Đã chữa' + (sub.score ? ' • ' + escapeHtml(sub.score) + 'đ' : '') + '</span></span>';
        } else if (status === 'submitted') {
          badgeHtml = '<span class="status-badge status-submitted">' + ICONS.clock +
            '<span>Đã nộp • Chờ chữa</span></span>';
        } else {
          badgeHtml = '<span class="status-badge status-missing">' + ICONS.alert +
            '<span>Chưa làm bài</span></span>';
        }

        const teacherCommentHtml = (sub && sub.teacher_comment)
          ? '<p class="matrix-teacher-note"><strong>Ý kiến GV:</strong> ' + escapeHtml(sub.teacher_comment) + '</p>'
          : '<p class="matrix-teacher-note" style="color:var(--color-muted-foreground);">Chưa có nhận xét của giáo viên.</p>';

        const voicePlayersHtml = [];
        if (sub && sub.media_url) {
          voicePlayersHtml.push(
            window.StudySnapAudio.renderVoicePlayer({
              id: 'matrix-student-' + sub.submission_id,
              url: sub.media_url,
              duration: sub.media_duration || '01:10',
              label: sub.media_type === 'video' ? 'Video HS' : 'Bài HS',
              fallbackText: '老师好！我是越南留学生，我每天都很努力学习汉语。',
              lang: 'zh-CN',
              compact: true,
              variant: 'student'
            })
          );
        }
        if (sub && sub.teacher_voice_url) {
          voicePlayersHtml.push(
            window.StudySnapAudio.renderVoicePlayer({
              id: 'matrix-teacher-' + sub.submission_id,
              url: sub.teacher_voice_url,
              duration: sub.teacher_voice_duration || '00:35',
              label: 'Voice GV',
              fallbackText: sub.teacher_comment || '你的汉语发音很标准，继续加油！',
              lang: 'vi-VN',
              compact: true,
              variant: 'teacher'
            })
          );
        }

        const gradeActionBtn =
          '<button type="button" class="btn btn-outline btn-sm" data-select-grade="' + escapeHtml(asg.assignment_id) + ':' + escapeHtml(st.student_id) + '">' +
            ICONS.edit +
            '<span>' + (status === 'graded' ? 'Sửa nhận xét' : 'Chữa bài') + '</span>' +
          '</button>';

        return '<td>' +
          '<div class="matrix-cell-content">' +
            '<div>' + badgeHtml + '</div>' +
            teacherCommentHtml +
            voicePlayersHtml.join('') +
            '<div class="matrix-cell-actions">' + gradeActionBtn + '</div>' +
          '</div>' +
        '</td>';
      }).join('');

      const progressRatio = completedCount + '/' + state.assignments.length;
      const allDone = state.assignments.length > 0 && completedCount === state.assignments.length;

      return '<tr>' +
        '<td>' +
          '<div class="student-cell-info">' +
            '<span class="student-avatar">' + escapeHtml(st.avatar_initials) + '</span>' +
            '<div>' +
              '<div style="font-weight:700;color:var(--color-foreground);">' + escapeHtml(st.full_name) + '</div>' +
              '<div class="tabular-nums" style="font-size:0.8125rem;color:var(--color-muted-foreground);">Tài khoản: ' + escapeHtml(st.username || st.student_id.toLowerCase()) + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        assignmentCells +
        '<td>' +
          '<span class="status-badge ' + (allDone ? 'status-graded' : 'status-submitted') + ' tabular-nums">' +
            (allDone ? ICONS.check : ICONS.clock) +
            '<span>Hoàn thành ' + progressRatio + ' bài</span>' +
          '</span>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  /**
   * TAB 2: QUẢN LÝ & TẠO TÀI KHOẢN CHO HỌC SINH
   */
  function renderStudentAccountsTab() {
    const nextNumber = state.students.length + 1;
    const suggestedUsername = 'hs' + String(nextNumber).padStart(2, '0');
    const usernameInput = document.getElementById('new-student-username');
    if (usernameInput && !usernameInput.value) {
      usernameInput.value = suggestedUsername;
    }

    const countBadge = document.getElementById('student-accounts-count-badge');
    if (countBadge) {
      countBadge.textContent = state.students.length + ' tài khoản học sinh';
    }

    const listEl = document.getElementById('student-accounts-list');
    if (!listEl) return;

    if (state.students.length === 0) {
      listEl.innerHTML =
        '<div class="quick-account-row" style="color:var(--color-muted-foreground);">' +
          'Chưa có tài khoản học sinh nào. Hãy nhập Họ tên và bấm <strong>"Tạo tài khoản Học sinh"</strong> ở khung bên trái.' +
        '</div>';
      return;
    }

    listEl.innerHTML = state.students.map(function (st) {
      const uname = st.username || st.student_id.toLowerCase();
      const pwd = st.password || '123456';
      return '<div class="quick-account-row">' +
        '<div class="student-cell-info">' +
          '<span class="student-avatar">' + escapeHtml(st.avatar_initials) + '</span>' +
          '<div>' +
            '<div style="font-weight:700;">' + escapeHtml(st.full_name) + ' (' + escapeHtml(st.student_id) + ') • ' + escapeHtml(st.class_name || 'Lớp Tiếng Trung HSK 2') + '</div>' +
            '<div class="tabular-nums" style="font-size:0.8125rem;color:var(--color-muted-foreground);">' +
              'Tên đăng nhập: <strong>' + escapeHtml(uname) + '</strong> • Mật khẩu: <strong>' + escapeHtml(pwd) + '</strong>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-outline btn-sm" data-copy-credentials="' + escapeHtml(st.full_name) + '|' + escapeHtml(uname) + '|' + escapeHtml(pwd) + '">' +
            '<span>Sao chép TK</span>' +
          '</button>' +
          '<button type="button" class="btn btn-outline btn-sm" data-reset-password="' + escapeHtml(st.student_id) + '">' +
            '<span>Đổi mật khẩu</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /**
   * TAB 3: KHO TỪ VỰNG & KẾT QUẢ BÀI CUỐI GIỜ
   */
  function renderTeacherVocabTable() {
    const tbody = document.getElementById('teacher-vocab-tbody');
    const badge = document.getElementById('teacher-vocab-count-badge');
    if (!tbody) return;

    const filtered = state.vocabulary.filter(function (v) {
      if (ui.vocabFilter === 'all') return true;
      return v.lesson_id === ui.vocabFilter;
    });

    if (badge) {
      badge.textContent = filtered.length + ' từ vựng';
    }

    if (filtered.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-muted-foreground);">' +
          'Chưa có từ vựng nào trong danh mục này. Hãy nhập từ vựng mới ở biểu mẫu phía trên.' +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (v) {
      return '<tr>' +
        '<td><strong style="font-size:1.125rem;color:var(--color-primary-deep);">' + escapeHtml(v.word) + '</strong></td>' +
        '<td><span class="mono-text tabular-nums" style="color:var(--color-accent);font-weight:600;">' + escapeHtml(v.ipa || '') + '</span></td>' +
        '<td><span class="status-badge" style="background:var(--color-surface-muted);color:var(--color-muted-foreground);border-color:var(--color-border-soft);font-size:0.75rem;">' + escapeHtml(v.part_of_speech || 'Từ vựng') + '</span></td>' +
        '<td><span style="font-weight:600;color:var(--color-foreground);">' + escapeHtml(v.meaning_vi || '') + '</span></td>' +
        '<td><span style="font-size:0.8125rem;color:var(--color-muted-foreground);">' + escapeHtml(v.example_en || '') + '</span></td>' +
        '<td><span style="font-size:0.8125rem;font-weight:600;color:var(--color-primary);">' + escapeHtml(v.lesson_title || v.lesson_id) + '</span></td>' +
        '<td>' +
          '<button type="button" class="btn btn-outline btn-sm" data-speak-vocab="' + escapeHtml(v.word) + '" title="Phát âm tiếng Trung">' +
            ICONS.volume +
            '<span>Nghe</span>' +
          '</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function renderContentAndExitLogsTab() {
    renderTeacherVocabTable();

    const logsContainer = document.getElementById('teacher-exit-ticket-logs');
    if (!logsContainer) return;

    if (state.exitTicketLogs.length === 0) {
      logsContainer.innerHTML =
        '<div class="quick-account-row" style="color:var(--color-muted-foreground);">' +
          'Chưa có kết quả bài luyện tập cuối giờ nào.' +
        '</div>';
      return;
    }

    logsContainer.innerHTML = state.exitTicketLogs.map(function (log) {
      const isPerfect = Number(log.score) === Number(log.total);
      return '<div class="quick-account-row">' +
        '<div>' +
          '<div style="font-weight:700;">' + escapeHtml(log.student_name) + ' (' + escapeHtml(log.student_id) + ')</div>' +
          '<div class="tabular-nums" style="font-size:0.8125rem;color:var(--color-muted-foreground);">Đề: ' + escapeHtml(log.ticket_id) + ' • Nộp lúc: ' + escapeHtml(log.submitted_at) + '</div>' +
        '</div>' +
        '<span class="status-badge ' + (isPerfect ? 'status-graded' : 'status-submitted') + ' tabular-nums">' +
          escapeHtml(log.score) + '/' + escapeHtml(log.total) + ' câu đúng' +
        '</span>' +
      '</div>';
    }).join('');
  }

  function exportMatrixToCsv() {
    const headers = ['Mã HS', 'Họ và tên', 'Tài khoản'];
    state.assignments.forEach(function (asg) {
      headers.push(asg.lesson_tag + ' - Trạng thái');
      headers.push(asg.lesson_tag + ' - Điểm');
      headers.push(asg.lesson_tag + ' - Nhận xét của GV');
    });

    const rows = [headers];
    state.students.forEach(function (st) {
      const row = [st.student_id, st.full_name, st.username || st.student_id.toLowerCase()];
      state.assignments.forEach(function (asg) {
        const sub = findSubmission(asg.assignment_id, st.student_id);
        const stText = sub
          ? (sub.status === 'graded' ? 'Đã chữa' : 'Đã nộp - Chờ chữa')
          : 'Chưa làm';
        row.push(stText);
        row.push(sub && sub.score ? String(sub.score) : '');
        row.push(sub && sub.teacher_comment ? String(sub.teacher_comment) : '');
      });
      rows.push(row);
    });

    const csvContent = '\uFEFF' + rows.map(function (r) {
      return r.map(function (cell) {
        return '"' + String(cell || '').replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'StudySnap_Bang_Tong_Hop_BVN.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file Excel (CSV) Bảng tổng hợp tiến độ & nhận xét!');
  }

  function switchTeacherTab(tabId) {
    ui.activeTab = tabId;
    document.querySelectorAll('[data-teacher-tab]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-teacher-tab') === tabId);
    });
    document.querySelectorAll('.module-section').forEach(function (sec) {
      sec.classList.toggle('is-active', sec.id === 'teacher-tab-' + tabId);
    });
  }

  function bindEvents() {
    document.querySelectorAll('[data-teacher-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTeacherTab(btn.getAttribute('data-teacher-tab'));
      });
    });

    const jumpCreateStudentBtn = document.getElementById('btn-jump-create-student');
    if (jumpCreateStudentBtn) {
      jumpCreateStudentBtn.addEventListener('click', function () {
        switchTeacherTab('accounts');
        const nameInput = document.getElementById('new-student-name');
        if (nameInput) nameInput.focus();
      });
    }

    const exportCsvBtn = document.getElementById('btn-export-matrix-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', exportMatrixToCsv);
    }

    const clearAllBtn = document.getElementById('btn-clear-all-test-data');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', async function () {
        const confirmed = window.confirm(
          'XÁC NHẬN XÓA TOÀN BỘ DỮ LIỆU TEST?\n\n' +
          'Hành động này sẽ xóa sạch toàn bộ Học sinh mẫu, BVN mẫu, Bài nộp mẫu, Từ vựng mẫu và Lịch sử bài cuối giờ (chỉ giữ lại tài khoản Giáo viên) để bạn bắt đầu sử dụng dữ liệu thật 100%.\n\n' +
          'Bạn có chắc chắn muốn tiếp tục?'
        );
        if (!confirmed) return;

        window.StudySnapAudio.pauseAll();
        ui.teacherDraftVoice = null;
        await window.StudySnapStore.clearAllTestData(state);
        renderAll();
        showToast('Đã xóa toàn bộ dữ liệu test! Hệ thống hiện chỉ lưu trữ dữ liệu thật của bạn.');
      });
    }

    const logoutBtn = document.getElementById('btn-teacher-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        window.StudySnapAuth.logout();
      });
    }

    // Chọn học sinh & bài tập cần chữa
    const gradeStudentSelect = document.getElementById('grade-student-select');
    if (gradeStudentSelect) {
      gradeStudentSelect.addEventListener('change', function () {
        ui.gradingStudentId = gradeStudentSelect.value;
        ui.teacherDraftVoice = null;
        renderGradingPanel();
      });
    }

    const gradeAssignmentSelect = document.getElementById('grade-assignment-select');
    if (gradeAssignmentSelect) {
      gradeAssignmentSelect.addEventListener('change', function () {
        ui.gradingAssignmentId = gradeAssignmentSelect.value;
        ui.teacherDraftVoice = null;
        renderGradingPanel();
      });
    }

    // Giáo viên thu âm phản hồi bằng giọng nói (Voice Feedback)
    const btnTeacherRecord = document.getElementById('btn-teacher-record-voice');
    const teacherRecordTimer = document.getElementById('teacher-record-timer');
    const teacherRecorderBar = document.getElementById('teacher-recorder-bar');
    if (btnTeacherRecord) {
      btnTeacherRecord.addEventListener('click', function () {
        if (!ui.isTeacherRecording) {
          ui.isTeacherRecording = true;
          btnTeacherRecord.textContent = 'Dừng thu Voice';
          if (teacherRecorderBar) teacherRecorderBar.classList.add('is-recording');
          window.StudySnapAudio.startRecording(
            function (timeStr) {
              if (teacherRecordTimer) teacherRecordTimer.textContent = timeStr;
            },
            function (result) {
              ui.isTeacherRecording = false;
              btnTeacherRecord.textContent = 'Thu âm phản hồi Voice';
              if (teacherRecorderBar) teacherRecorderBar.classList.remove('is-recording');
              ui.teacherDraftVoice = {
                dataUrl: result.dataUrl,
                mimeType: result.mimeType,
                duration: result.duration
              };
              renderGradingPanel();
              showToast('Đã thu âm phản hồi Voice (' + result.duration + ')!');
            },
            function (errMsg) {
              ui.isTeacherRecording = false;
              btnTeacherRecord.textContent = 'Thu âm phản hồi Voice';
              if (teacherRecorderBar) teacherRecorderBar.classList.remove('is-recording');
              showToast(errMsg);
            }
          );
        } else {
          window.StudySnapAudio.stopRecording();
        }
      });
    }

    // Giáo viên lưu chấm bài & phản hồi
    const teacherGradingForm = document.getElementById('teacher-grading-form');
    if (teacherGradingForm) {
      teacherGradingForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const scoreVal = document.getElementById('teacher-score-input').value.trim();
        const commentVal = document.getElementById('teacher-comment-input').value.trim();
        const nowStr = new Date().toLocaleString('vi-VN');

        let sub = findSubmission(ui.gradingAssignmentId, ui.gradingStudentId);
        const voiceUrl = ui.teacherDraftVoice
          ? ui.teacherDraftVoice.dataUrl
          : (sub && sub.teacher_voice_url ? sub.teacher_voice_url : 'demo:teacher-voice-feedback');
        const voiceDur = ui.teacherDraftVoice
          ? ui.teacherDraftVoice.duration
          : (sub && sub.teacher_voice_duration ? sub.teacher_voice_duration : '00:32');

        if (sub) {
          sub.status = 'graded';
          sub.score = scoreVal || sub.score || 9.0;
          sub.teacher_comment = commentVal || 'Giáo viên đã gửi phản hồi chữa bài.';
          sub.teacher_voice_url = voiceUrl;
          sub.teacher_voice_duration = voiceDur;
          sub.graded_at = nowStr;
        } else {
          sub = {
            submission_id: 'SUB_' + Date.now(),
            assignment_id: ui.gradingAssignmentId,
            student_id: ui.gradingStudentId,
            submitted_at: nowStr,
            student_note: '',
            media_type: 'audio',
            media_url: '',
            media_duration: '',
            status: 'graded',
            score: scoreVal || '',
            teacher_comment: commentVal || 'Nhắc nhở học sinh hoàn thành bài tập.',
            teacher_voice_url: voiceUrl,
            teacher_voice_duration: voiceDur,
            graded_at: nowStr
          };
          state.submissions.push(sub);
        }

        const draftVoice = ui.teacherDraftVoice;
        ui.teacherDraftVoice = null;
        window.StudySnapStore.saveState(state);
        renderAll();

        const st = findStudent(ui.gradingStudentId);
        showToast('Đã lưu nhận xét & Voice Feedback cho ' + (st ? st.full_name : '') + '!');

        window.StudySnapStore.syncPostToGas(state, {
          action: 'saveTeacherFeedback',
          assignment_id: ui.gradingAssignmentId,
          student_id: ui.gradingStudentId,
          score: sub.score,
          teacher_comment: sub.teacher_comment,
          teacher_voice_duration: voiceDur,
          teacher_voice_base64: draftVoice ? draftVoice.dataUrl : '',
          teacher_voice_mime_type: draftVoice ? draftVoice.mimeType : ''
        });
      });
    }

    // Giáo viên Giao BVN mới
    const createAsgForm = document.getElementById('create-assignment-form');
    if (createAsgForm) {
      createAsgForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const tag = document.getElementById('new-asg-tag').value.trim();
        const due = document.getElementById('new-asg-due').value.trim();
        const title = document.getElementById('new-asg-title').value.trim();
        const desc = document.getElementById('new-asg-desc').value.trim();
        if (!title) return;

        const newId = 'BVN0' + (state.assignments.length + 1);
        const newAsg = {
          assignment_id: newId,
          title: title,
          lesson_tag: tag || ('Bài ' + (state.assignments.length + 1)),
          due_date: due || '20/11/2026',
          description: desc,
          require_media: 'audio_or_video'
        };

        state.assignments.push(newAsg);
        ui.gradingAssignmentId = newId;
        window.StudySnapStore.saveState(state);
        createAsgForm.reset();
        renderAll();
        showToast('Đã giao bài tập mới "' + newAsg.lesson_tag + '" và thêm cột vào Bảng tổng hợp!');

        window.StudySnapStore.syncPostToGas(state, {
          action: 'addAssignment',
          assignment_id: newAsg.assignment_id,
          title: newAsg.title,
          lesson_tag: newAsg.lesson_tag,
          due_date: newAsg.due_date,
          description: newAsg.description
        });
      });
    }

    // Giáo viên Tạo tài khoản mới cho Học sinh
    const createStudentForm = document.getElementById('create-student-account-form');
    if (createStudentForm) {
      createStudentForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const fullName = document.getElementById('new-student-name').value.trim();
        const className = document.getElementById('new-student-class').value.trim() || 'Lớp Tiếng Trung HSK 2';
        const username = document.getElementById('new-student-username').value.trim().toLowerCase();
        const password = document.getElementById('new-student-password').value.trim() || '123456';

        if (!fullName || !username) return;

        // Kiểm tra trùng username
        const exists = state.students.some(function (s) {
          return String(s.username || '').toLowerCase() === username || String(s.student_id || '').toLowerCase() === username;
        });
        if (exists) {
          showToast('Tên đăng nhập "' + username + '" đã tồn tại. Vui lòng chọn tên đăng nhập khác.');
          return;
        }

        const nextId = 'HS' + String(state.students.length + 1).padStart(2, '0');
        const initials = window.StudySnapStore.getInitials(fullName);
        const newStudent = {
          student_id: nextId,
          full_name: fullName,
          class_name: className,
          avatar_initials: initials,
          username: username,
          password: password,
          created_at: new Date().toLocaleDateString('vi-VN')
        };

        state.students.push(newStudent);
        window.StudySnapStore.saveState(state);
        document.getElementById('new-student-name').value = '';
        document.getElementById('new-student-username').value = 'hs' + String(state.students.length + 1).padStart(2, '0');
        renderAll();
        showToast('Đã tạo tài khoản cho học sinh ' + fullName + ' (TK: ' + username + ' / MK: ' + password + ')!');

        window.StudySnapStore.syncPostToGas(state, {
          action: 'createStudentAccount',
          student_id: newStudent.student_id,
          full_name: newStudent.full_name,
          class_name: newStudent.class_name,
          avatar_initials: newStudent.avatar_initials,
          username: newStudent.username,
          password: newStudent.password
        });
      });
    }

    // Thêm từ vựng mới
    const addVocabForm = document.getElementById('add-vocab-form');
    if (addVocabForm) {
      addVocabForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const lessonSelectVal = document.getElementById('new-vocab-lesson').value;
        const wordVal = document.getElementById('new-vocab-word').value.trim();
        const ipaVal = document.getElementById('new-vocab-ipa').value.trim() || 'pinyin';
        const posVal = document.getElementById('new-vocab-pos').value.trim() || 'Danh từ';
        const meaningVal = document.getElementById('new-vocab-meaning').value.trim();
        const exampleEnVal = document.getElementById('new-vocab-example-en').value.trim();

        if (!wordVal || !meaningVal) return;

        const lessonMap = {
          'bai-1': 'Bài 1: Chào hỏi & Làm quen',
          'bai-2': 'Bài 2: Học tập & Ngôn ngữ',
          'bai-3': 'Bài 3: Mua sắm & Đời sống',
          'bai-4': 'Bài 4: Chủ đề Mở rộng'
        };
        const newVocab = {
          vocab_id: 'V_' + Date.now(),
          lesson_id: lessonSelectVal,
          lesson_title: lessonMap[lessonSelectVal] || 'Bài mới',
          word: wordVal,
          ipa: ipaVal,
          part_of_speech: posVal,
          meaning_vi: meaningVal,
          example_en: exampleEnVal || ('我每天练习"' + wordVal + '"。'),
          example_vi: meaningVal
        };

        state.vocabulary.push(newVocab);
        window.StudySnapStore.saveState(state);
        addVocabForm.reset();
        renderAll();
        showToast('Đã thêm từ vựng "' + wordVal + '" vào ' + newVocab.lesson_title + '!');

        window.StudySnapStore.syncPostToGas(state, {
          action: 'addVocabulary',
          lesson_id: newVocab.lesson_id,
          lesson_title: newVocab.lesson_title,
          word: newVocab.word,
          ipa: newVocab.ipa,
          part_of_speech: newVocab.part_of_speech,
          meaning_vi: newVocab.meaning_vi,
          example_en: newVocab.example_en,
          example_vi: newVocab.example_vi
        });
      });
    }

    // Bộ lọc Bảng tổng hợp
    document.querySelectorAll('[data-matrix-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ui.matrixFilter = btn.getAttribute('data-matrix-filter');
        document.querySelectorAll('[data-matrix-filter]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        renderProgressMatrix();
      });
    });

    // Event delegation
    document.body.addEventListener('click', function (ev) {
      const playStudentBtn = ev.target.closest('[data-play-student]');
      if (playStudentBtn) {
        const subId = playStudentBtn.getAttribute('data-play-student');
        const sub = state.submissions.find(function (s) { return s.submission_id === subId; });
        if (sub) {
          const st = findStudent(sub.student_id);
          window.StudySnapAudio.playMediaOrDemo(
            sub.media_url,
            '老师好！我是越南留学生，我每天都很努力学习汉语。',
            'zh-CN'
          );
          showToast('Đang phát bài làm của học sinh ' + (st ? st.full_name : '') + '...');
        }
        return;
      }

      const playTeacherBtn = ev.target.closest('[data-play-teacher-voice]');
      if (playTeacherBtn) {
        const subId = playTeacherBtn.getAttribute('data-play-teacher-voice');
        const sub = state.submissions.find(function (s) { return s.submission_id === subId; });
        if (sub) {
          window.StudySnapAudio.playMediaOrDemo(
            sub.teacher_voice_url,
            sub.teacher_comment || '你的汉语发音很标准，继续加油！',
            'vi-VN'
          );
          showToast('Đang phát phản hồi Voice của giáo viên...');
        }
        return;
      }

      const gradeBtn = ev.target.closest('[data-select-grade]');
      if (gradeBtn) {
        const parts = gradeBtn.getAttribute('data-select-grade').split(':');
        ui.gradingAssignmentId = parts[0];
        ui.gradingStudentId = parts[1];
        renderGradingPanel();
        const panel = document.getElementById('teacher-grading-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const copyBtn = ev.target.closest('[data-copy-credentials]');
      if (copyBtn) {
        const parts = copyBtn.getAttribute('data-copy-credentials').split('|');
        const copyText = 'Tài khoản StudySnap của ' + parts[0] + ' — Tên đăng nhập: ' + parts[1] + ' | Mật khẩu: ' + parts[2];
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(copyText);
        }
        showToast('Đã sao chép: ' + copyText);
        return;
      }

      const resetPwdBtn = ev.target.closest('[data-reset-password]');
      if (resetPwdBtn) {
        const stId = resetPwdBtn.getAttribute('data-reset-password');
        const st = findStudent(stId);
        if (!st) return;
        const newPwd = window.prompt('Nhập mật khẩu mới cho học sinh ' + st.full_name + ':', st.password || '123456');
        if (newPwd && newPwd.trim()) {
          st.password = newPwd.trim();
          window.StudySnapStore.saveState(state);
          renderStudentAccountsTab();
          showToast('Đã cập nhật mật khẩu mới cho ' + st.full_name + '!');
          window.StudySnapStore.syncPostToGas(state, {
            action: 'resetStudentPassword',
            student_id: st.student_id,
            new_password: st.password
          });
        }
        return;
      }

      // Nút chèn nhanh dấu thanh điệu Pinyin
      const toneBtn = ev.target.closest('[data-insert-tone]');
      if (toneBtn) {
        const toneChar = toneBtn.getAttribute('data-insert-tone');
        const ipaInput = document.getElementById('new-vocab-ipa');
        if (ipaInput && toneChar) {
          const start = ipaInput.selectionStart || ipaInput.value.length;
          const end = ipaInput.selectionEnd || ipaInput.value.length;
          const text = ipaInput.value;
          ipaInput.value = text.substring(0, start) + toneChar + text.substring(end);
          ipaInput.focus();
          const newPos = start + toneChar.length;
          ipaInput.setSelectionRange(newPos, newPos);
        }
        return;
      }

      // Bộ lọc từ vựng trong Tab 3
      const vocabFilterBtn = ev.target.closest('[data-teacher-vocab-filter]');
      if (vocabFilterBtn) {
        ui.vocabFilter = vocabFilterBtn.getAttribute('data-teacher-vocab-filter') || 'all';
        document.querySelectorAll('[data-teacher-vocab-filter]').forEach(function (b) {
          b.classList.toggle('is-active', b === vocabFilterBtn);
        });
        renderTeacherVocabTable();
        return;
      }

      // Phát âm từ vựng tiếng Trung
      const speakVocabBtn = ev.target.closest('[data-speak-vocab]');
      if (speakVocabBtn) {
        const wordToSpeak = speakVocabBtn.getAttribute('data-speak-vocab');
        if (wordToSpeak) {
          window.StudySnapAudio.speakText(wordToSpeak, 'zh-CN');
        }
        return;
      }
    });
  }

  function renderAll() {
    renderSummaryStats();
    renderGradingPanel();
    renderProgressMatrix();
    renderStudentAccountsTab();
    renderContentAndExitLogsTab();
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindEvents();
    renderAll();
    if (window.StudySnapStore.getGasUrl()) {
      window.StudySnapStore.fetchBootstrapFromGas(state).then(function () {
        renderAll();
      });
    }
  });
})();

