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
    vocabFilter: 'all',
    selectedPracticeExId: (state.practiceExercises && state.practiceExercises[0]) ? state.practiceExercises[0].exercise_id : 'EX_HSK1_BAI_1',
    activeGradingSubId: null,
    practiceCurrentView: 'builder'
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

  // =========================================================================
  // TAB 4: QUẢN LÝ BÀI TẬP LUYỆN TẬP CUỐI BÀI (5 DẠNG BÀI - GOOGLE FORM BUILDER)
  // =========================================================================
  function getActivePracticeExercise() {
    if (!Array.isArray(state.practiceExercises) || state.practiceExercises.length === 0) {
      const titleInp = document.getElementById('ex-meta-title');
      const tagInp = document.getElementById('ex-meta-tag');
      const title = (titleInp && titleInp.value.trim()) || 'Bài tập luyện tập cuối bài — HSK 1: Bài 1';
      const tag = (tagInp && tagInp.value.trim()) || 'Bài 1';

      const initialEx = createTemplateExercise(title, tag);
      state.practiceExercises = [initialEx];
      ui.selectedPracticeExId = initialEx.exercise_id;
      window.StudySnapStore.savePracticeExercise(state, initialEx);
      return initialEx;
    }

    const found = state.practiceExercises.find(function (e) {
      return e.exercise_id === ui.selectedPracticeExId;
    });
    if (found) return found;

    ui.selectedPracticeExId = state.practiceExercises[0].exercise_id;
    return state.practiceExercises[0];
  }

  function switchPracticeSubView(view) {
    ui.practiceCurrentView = view;
    const btnBuilder = document.getElementById('subtab-btn-builder');
    const btnSubs = document.getElementById('subtab-btn-submissions');
    const viewBuilder = document.getElementById('teacher-practice-view-builder');
    const viewSubs = document.getElementById('teacher-practice-view-submissions');

    if (btnBuilder) btnBuilder.classList.toggle('is-active', view === 'builder');
    if (btnSubs) btnSubs.classList.toggle('is-active', view === 'submissions');
    if (viewBuilder) viewBuilder.style.display = view === 'builder' ? 'block' : 'none';
    if (viewSubs) viewSubs.style.display = view === 'submissions' ? 'block' : 'none';
  }

  function createDefaultSection(type, sectionNum) {
    const timeId = Date.now();
    if (type === 'matching') {
      return {
        section_id: 'sec_matching_' + timeId,
        section_num: sectionNum,
        type: 'matching',
        title: 'Phần ' + sectionNum + ': Nối từ (matching)',
        description: 'Nối chữ Hán và phiên âm pinyin ở cột trái với nghĩa tiếng Việt tương ứng ở cột phải.',
        max_score: 2,
        data: {
          left: [
            { id: 1, hanzi: '你好', pinyin: 'nǐ hǎo' },
            { id: 2, hanzi: '谢谢', pinyin: 'xièxie' }
          ],
          right: [
            { id: 'A', text: 'Xin chào' },
            { id: 'B', text: 'Cảm ơn' }
          ],
          answer: { '1': 'A', '2': 'B' }
        }
      };
    } else if (type === 'multiple_choice') {
      return {
        section_id: 'sec_mc_' + timeId,
        section_num: sectionNum,
        type: 'multiple_choice',
        title: 'Phần ' + sectionNum + ': Trắc nghiệm (multiple_choice)',
        description: 'Chọn đáp án chính xác nhất cho từng câu hỏi.',
        max_score: 1,
        data: {
          items: [
            {
              id: 'MC_' + timeId,
              prompt: 'Điền câu hỏi trắc nghiệm tiếng Trung vào đây...',
              speakWord: '',
              options: ['Đáp án A (Đúng)', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
              correctIndex: 0,
              explanation: 'Giải thích lý do vì sao đáp án A đúng...'
            }
          ]
        }
      };
    } else if (type === 'fill_blank_wordbank') {
      return {
        section_id: 'sec_fill_' + timeId,
        section_num: sectionNum,
        type: 'fill_blank_wordbank',
        title: 'Phần ' + sectionNum + ': Điền từ có ngân hàng từ (wordbank)',
        description: 'Chọn từ trong ngân hàng từ để điền vào chỗ trống "____".',
        max_score: 1,
        data: {
          wordbank: ['您', '好', '谢谢'],
          items: [
            {
              id: 'FB_' + timeId,
              text: '李老师，____好！',
              hint: 'Chào cô Lý ạ! (kính trọng)',
              answer: '您'
            }
          ]
        }
      };
    } else if (type === 'error_correction') {
      return {
        section_id: 'sec_err_' + timeId,
        section_num: sectionNum,
        type: 'error_correction',
        title: 'Phần ' + sectionNum + ': Sửa câu sai (error_correction)',
        description: 'Mỗi câu có một lỗi sai ngữ pháp, viết lại câu đúng vào ô nhập.',
        max_score: 1,
        data: {
          items: [
            {
              id: 'ERR_' + timeId,
              wrong: '大家们好！',
              situation: 'Chào mọi người trong lớp học',
              accepted: ['大家好！', '大家好'],
              explanation: 'Chữ 大家 đã mang nghĩa số nhiều, không thêm hậu tố 们.'
            }
          ]
        }
      };
    } else if (type === 'translation') {
      return {
        section_id: 'sec_trans_' + timeId,
        section_num: sectionNum,
        type: 'translation',
        title: 'Phần ' + sectionNum + ': Dịch câu (translation)',
        description: 'Dịch câu theo đúng hướng yêu cầu (Việt → Trung hoặc Trung → Việt).',
        max_score: 1,
        data: {
          items: [
            {
              id: 'TR_' + timeId,
              direction: 'vi->zh',
              mode: 'exact',
              prompt: 'Xin chào các bạn!',
              accepted: ['你们好！', '大家好！', '你们好', '大家好'],
              grading_note: 'Dịch đúng chữ 你们好 hoặc 大家好.',
              explanation: 'Chào các bạn là 你们好 hoặc 大家好.'
            }
          ]
        }
      };
    }
  }

  function createTemplateExercise(title, tag) {
    const exId = 'EX_' + Date.now();
    return {
      exercise_id: exId,
      title: title,
      lesson_tag: tag || 'Bài mới',
      total_score: 35,
      thresholds: { very_good: 31, good: 25 },
      sections: [
        {
          section_id: 'sec_matching_' + Date.now() + '_1',
          section_num: 1,
          type: 'matching',
          title: 'Phần 1: Nối từ (10 điểm)',
          description: 'Nối chữ Hán và phiên âm pinyin ở cột trái với nghĩa tiếng Việt tương ứng ở cột phải.',
          max_score: 10,
          data: {
            left: [
              { id: 1, hanzi: '你', pinyin: 'nǐ' },
              { id: 2, hanzi: '好', pinyin: 'hǎo' },
              { id: 3, hanzi: '您', pinyin: 'nín' },
              { id: 4, hanzi: '你们', pinyin: 'nǐmen' },
              { id: 5, hanzi: '对不起', pinyin: 'duìbuqǐ' },
              { id: 6, hanzi: '没关系', pinyin: 'méi guānxi' },
              { id: 7, hanzi: '谢谢', pinyin: 'xièxie' },
              { id: 8, hanzi: '不客气', pinyin: 'bú kèqi' },
              { id: 9, hanzi: '再见', pinyin: 'zàijiàn' },
              { id: 10, hanzi: '老师', pinyin: 'lǎoshī' }
            ],
            right: [
              { id: 'A', text: 'Bạn, cậu' },
              { id: 'B', text: 'Tốt, khỏe' },
              { id: 'C', text: 'Ngài, ông, bà (kính cẩn)' },
              { id: 'D', text: 'Các bạn' },
              { id: 'E', text: 'Xin lỗi' },
              { id: 'F', text: 'Không sao' },
              { id: 'G', text: 'Cảm ơn' },
              { id: 'H', text: 'Đừng khách sáo' },
              { id: 'I', text: 'Tạm biệt' },
              { id: 'J', text: 'Thầy, cô giáo' }
            ],
            answer: {
              '1': 'A',
              '2': 'B',
              '3': 'C',
              '4': 'D',
              '5': 'E',
              '6': 'F',
              '7': 'G',
              '8': 'H',
              '9': 'I',
              '10': 'J'
            }
          }
        },
        {
          section_id: 'sec_mc_' + Date.now() + '_2',
          section_num: 2,
          type: 'multiple_choice',
          title: 'Phần 2: Trắc nghiệm (8 điểm)',
          description: 'Chọn đáp án chính xác nhất.',
          max_score: 8,
          data: {
            items: [
              {
                id: 'MC1',
                prompt: 'Khi hai âm tiết mang thanh 3 đi liền nhau như "你好 (nǐ hǎo)", âm tiết thứ nhất biến điệu thành thanh mấy?',
                speakWord: '你好',
                options: ['Thanh 2 (ní hǎo)', 'Thanh 1 (nī hāo)', 'Thanh 4 (nì hǎo)', 'Giữ nguyên thanh 3'],
                correctIndex: 0,
                explanation: 'Quy tắc 3 + 3 biến thành 2 + 3 (ní hǎo).'
              }
            ]
          }
        },
        {
          section_id: 'sec_fill_' + Date.now() + '_3',
          section_num: 3,
          type: 'fill_blank_wordbank',
          title: 'Phần 3: Điền từ có ngân hàng từ (7 điểm)',
          description: 'Chọn từ trong ngân hàng từ để điền vào chỗ trống "____".',
          max_score: 7,
          data: {
            wordbank: ['您', '好', '们', '对不起', '没关系', '谢谢', '再见'],
            items: [
              {
                id: 'FB1',
                text: '李老师，____好！',
                hint: 'Chào cô Lý ạ! (kính trọng)',
                answer: '您'
              }
            ]
          }
        },
        {
          section_id: 'sec_err_' + Date.now() + '_4',
          section_num: 4,
          type: 'error_correction',
          title: 'Phần 4: Sửa câu sai (5 điểm)',
          description: 'Viết lại câu đúng vào ô nhập.',
          max_score: 5,
          data: {
            items: [
              {
                id: 'ERR1',
                wrong: '大家们好！',
                situation: 'Chào mọi người trong lớp học',
                accepted: ['大家好！', '大家好'],
                explanation: 'Chữ 大家 đã là số nhiều, không thêm 们.'
              }
            ]
          }
        },
        {
          section_id: 'sec_trans_' + Date.now() + '_5',
          section_num: 5,
          type: 'translation',
          title: 'Phần 5: Dịch câu (5 điểm)',
          description: 'Dịch câu theo đúng hướng yêu cầu.',
          max_score: 5,
          data: {
            items: [
              {
                id: 'TR1',
                direction: 'vi->zh',
                mode: 'exact',
                prompt: 'Xin chào các bạn!',
                accepted: ['你们好！', '大家好！', '你们好', '大家好'],
                explanation: 'Câu chào các bạn là 你们好！ Hoặc 大家好！'
              }
            ]
          }
        }
      ]
    };
  }

  function collectExerciseFromDom() {
    const ex = getActivePracticeExercise();
    if (!ex) return;

    const titleInp = document.getElementById('ex-meta-title');
    const tagInp = document.getElementById('ex-meta-tag');
    const goodInp = document.getElementById('ex-meta-thresh-good');
    const veryGoodInp = document.getElementById('ex-meta-thresh-verygood');

    if (titleInp && titleInp.value.trim()) ex.title = titleInp.value.trim();
    if (tagInp && tagInp.value.trim()) ex.lesson_tag = tagInp.value.trim();
    if (!ex.thresholds) ex.thresholds = { good: 25, very_good: 31 };
    if (goodInp) ex.thresholds.good = parseInt(goodInp.value, 10) || 25;
    if (veryGoodInp) ex.thresholds.very_good = parseInt(veryGoodInp.value, 10) || 31;

    document.querySelectorAll('[data-sec-card]').forEach(function (card) {
      const secId = card.getAttribute('data-sec-card');
      const sec = (ex.sections || []).find(function (s) {
        return s.section_id === secId;
      });
      if (!sec) return;

      const titleEl = card.querySelector('[data-sec-title]');
      const descEl = card.querySelector('[data-sec-desc]');
      const maxScoreEl = card.querySelector('[data-sec-score]');

      if (titleEl) sec.title = titleEl.value.trim();
      if (descEl) sec.description = descEl.value.trim();
      if (maxScoreEl) sec.max_score = parseInt(maxScoreEl.value, 10) || 1;

      if (sec.type === 'matching') {
        const left = [];
        const right = [];
        const answer = {};

        const rows = card.querySelectorAll('[data-match-row]');
        rows.forEach(function (row, idx) {
          const leftId = idx + 1;
          const rightId = String.fromCharCode(65 + idx);
          const hanzi = (row.querySelector('[data-pair-hanzi]') || {}).value || '';
          const pinyin = (row.querySelector('[data-pair-pinyin]') || {}).value || '';
          const meaning = (row.querySelector('[data-pair-meaning]') || {}).value || '';

          left.push({ id: leftId, hanzi: hanzi.trim(), pinyin: pinyin.trim() });
          right.push({ id: rightId, text: meaning.trim() });
          answer[String(leftId)] = rightId;
        });

        sec.data = { left: left, right: right, answer: answer };
      } else if (sec.type === 'multiple_choice') {
        const items = [];
        const qCards = card.querySelectorAll('[data-mc-qcard]');
        qCards.forEach(function (qCard, qIdx) {
          const itemId = qCard.getAttribute('data-mc-qcard') || 'MC_' + (qIdx + 1);
          const prompt = (qCard.querySelector('[data-mc-prompt]') || {}).value || '';
          const speak = (qCard.querySelector('[data-mc-speak]') || {}).value || '';
          const exp = (qCard.querySelector('[data-mc-exp]') || {}).value || '';

          const options = [];
          const optInputs = qCard.querySelectorAll('[data-mc-opt]');
          optInputs.forEach(function (optInp) {
            options.push(optInp.value.trim());
          });

          let correctIdx = 0;
          const checkedRadio = qCard.querySelector('input[type="radio"]:checked');
          if (checkedRadio) {
            correctIdx = parseInt(checkedRadio.value, 10) || 0;
          }

          items.push({
            id: itemId,
            prompt: prompt.trim(),
            speakWord: speak.trim(),
            options: options.length > 0 ? options : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
            correctIndex: correctIdx,
            explanation: exp.trim()
          });
        });
        sec.data = { items: items };
      } else if (sec.type === 'fill_blank_wordbank') {
        const wbInput = card.querySelector('[data-fb-wordbank]');
        const rawWb = wbInput ? wbInput.value : '';
        const wordbank = rawWb
          .split(/[,;\n]/)
          .map(function (w) {
            return w.trim();
          })
          .filter(Boolean);

        const items = [];
        const qCards = card.querySelectorAll('[data-fb-qcard]');
        qCards.forEach(function (qCard, qIdx) {
          const itemId = qCard.getAttribute('data-fb-qcard') || 'FB_' + (qIdx + 1);
          const text = (qCard.querySelector('[data-fb-text]') || {}).value || '';
          const hint = (qCard.querySelector('[data-fb-hint]') || {}).value || '';
          const ans = (qCard.querySelector('[data-fb-ans]') || {}).value || '';

          items.push({
            id: itemId,
            text: text.trim(),
            hint: hint.trim(),
            answer: ans.trim()
          });
        });
        sec.data = { wordbank: wordbank, items: items };
      } else if (sec.type === 'error_correction') {
        const items = [];
        const qCards = card.querySelectorAll('[data-err-qcard]');
        qCards.forEach(function (qCard, qIdx) {
          const itemId = qCard.getAttribute('data-err-qcard') || 'ERR_' + (qIdx + 1);
          const wrong = (qCard.querySelector('[data-err-wrong]') || {}).value || '';
          const sit = (qCard.querySelector('[data-err-sit]') || {}).value || '';
          const accRaw = (qCard.querySelector('[data-err-acc]') || {}).value || '';
          const exp = (qCard.querySelector('[data-err-exp]') || {}).value || '';

          const accepted = accRaw
            .split(/[\/,;]/)
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean);
          items.push({
            id: itemId,
            wrong: wrong.trim(),
            situation: sit.trim(),
            accepted: accepted.length > 0 ? accepted : [accRaw.trim()],
            explanation: exp.trim()
          });
        });
        sec.data = { items: items };
      } else if (sec.type === 'translation') {
        const items = [];
        const qCards = card.querySelectorAll('[data-tr-qcard]');
        qCards.forEach(function (qCard, qIdx) {
          const itemId = qCard.getAttribute('data-tr-qcard') || 'TR_' + (qIdx + 1);
          const dir = (qCard.querySelector('[data-tr-dir]') || {}).value || 'vi->zh';
          const mode = (qCard.querySelector('[data-tr-mode]') || {}).value || 'exact';
          const prompt = (qCard.querySelector('[data-tr-prompt]') || {}).value || '';
          const accRaw = (qCard.querySelector('[data-tr-acc]') || {}).value || '';
          const note = (qCard.querySelector('[data-tr-note]') || {}).value || '';
          const exp = (qCard.querySelector('[data-tr-exp]') || {}).value || '';

          const accepted = accRaw
            .split(/[\/,;]/)
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean);
          items.push({
            id: itemId,
            direction: dir,
            mode: mode,
            prompt: prompt.trim(),
            accepted: accepted.length > 0 ? accepted : [accRaw.trim()],
            grading_note: note.trim(),
            explanation: exp.trim()
          });
        });
        sec.data = { items: items };
      }
    });

    let totalScore = 0;
    (ex.sections || []).forEach(function (s) {
      totalScore += Number(s.max_score || 0);
    });
    ex.total_score = totalScore;
  }

  function renderTeacherPracticeTab() {
    const ex = getActivePracticeExercise();
    if (!ex) return;

    const selectEl = document.getElementById('teacher-practice-select');
    if (selectEl) {
      selectEl.innerHTML = (state.practiceExercises || [])
        .map(function (e) {
          const isSel = e.exercise_id === ex.exercise_id ? ' selected' : '';
          return (
            '<option value="' +
            escapeHtml(e.exercise_id) +
            '"' +
            isSel +
            '>' +
            (e.lesson_tag ? '[' + escapeHtml(e.lesson_tag) + '] ' : '') +
            escapeHtml(e.title) +
            ' (' +
            (e.total_score || 0) +
            'đ)' +
            '</option>'
          );
        })
        .join('');
    }

    // Populate Exercise Meta Form
    const titleInput = document.getElementById('ex-meta-title');
    const tagInput = document.getElementById('ex-meta-tag');
    const threshGoodInput = document.getElementById('ex-meta-thresh-good');
    const threshVeryGoodInput = document.getElementById('ex-meta-thresh-verygood');
    const maxScoreBadge = document.getElementById('teacher-practice-maxscore-badge');

    if (titleInput && document.activeElement !== titleInput) {
      titleInput.value = ex.title || '';
    }
    if (tagInput && document.activeElement !== tagInput) {
      tagInput.value = ex.lesson_tag || '';
    }
    if (threshGoodInput) threshGoodInput.value = (ex.thresholds && ex.thresholds.good) || 25;
    if (threshVeryGoodInput) threshVeryGoodInput.value = (ex.thresholds && ex.thresholds.very_good) || 31;
    if (maxScoreBadge) maxScoreBadge.textContent = 'Tổng ' + (ex.total_score || 0) + ' điểm';

    // Update submissions pill count
    const subs = (state.practiceSubmissions || []).filter(function (s) {
      return s.exercise_id === ex.exercise_id;
    });
    const subCountPill = document.getElementById('teacher-practice-sub-count-pill');
    if (subCountPill) subCountPill.textContent = String(subs.length);

    // Render Google Form interactive builder
    renderBuilderSectionsList(ex);

    // Render Submissions Table
    renderTeacherPracticeSubmissions(ex);

    // Ensure correct subview is displayed
    switchPracticeSubView(ui.practiceCurrentView || 'builder');
  }

  function renderBuilderSectionsList(ex) {
    const listEl = document.getElementById('teacher-builder-sections-list');
    if (!listEl) return;

    if (!ex.sections || ex.sections.length === 0) {
      listEl.innerHTML =
        '<div style="padding:32px 20px;text-align:center;background:var(--color-surface);border:2px dashed var(--color-primary);border-radius:var(--radius-xl);margin:16px 0;">' +
        '<div style="font-size:2rem;margin-bottom:8px;">📝</div>' +
        '<p style="margin:0 0 8px;font-size:1rem;font-weight:700;color:var(--color-primary-deep);">' +
        'Bài tập này chưa có câu hỏi nào' +
        '</p>' +
        '<p style="margin:0 0 16px;font-size:0.875rem;color:var(--color-muted-foreground);">' +
        'Hãy bấm vào các nút bên trên (+ 1. Nối từ, + 2. Trắc nghiệm, + 3. Điền từ...) hoặc bấm nút dưới đây để nạp sẵn 5 câu hỏi mẫu chuẩn:' +
        '</p>' +
        '<button type="button" class="btn btn-primary" id="btn-quick-fill-template">' +
        '<span>✨ Nạp sẵn 5 dạng câu hỏi mẫu chuẩn HSK</span>' +
        '</button>' +
        '</div>';

      const btnFill = document.getElementById('btn-quick-fill-template');
      if (btnFill) {
        btnFill.addEventListener('click', function () {
          const tpl = createTemplateExercise(ex.title, ex.lesson_tag);
          ex.sections = tpl.sections;
          ex.total_score = tpl.total_score;
          window.StudySnapStore.savePracticeExercise(state, ex);
          renderTeacherPracticeTab();
          showToast('Đã nạp sẵn 5 câu hỏi mẫu vào bài tập!');
        });
      }
      return;
    }

    const typeIcons = {
      matching: '1. Nối từ (matching)',
      multiple_choice: '2. Trắc nghiệm (multiple choice)',
      fill_blank_wordbank: '3. Điền từ (wordbank)',
      error_correction: '4. Sửa câu sai (correction)',
      translation: '5. Dịch câu (translation)'
    };

    listEl.innerHTML = ex.sections
      .map(function (sec, idx) {
        const typeLabel = typeIcons[sec.type] || ('Phần ' + (idx + 1));
        const currentScore = sec.max_score || (sec.type === 'matching' ? 10 : 5);

        return (
          '<div class="gform-section-card" data-sec-card="' +
          escapeHtml(sec.section_id) +
          '" style="margin-bottom: 20px; background: var(--color-surface); border: 1px solid var(--color-border-soft); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); overflow: hidden;">' +
          '<!-- Header tinh gọn chuẩn Google Forms -->' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:var(--color-surface-muted);border-bottom:1px solid var(--color-border-soft);gap:12px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
          '<span style="font-weight:800;color:var(--color-primary-deep);font-size:0.9375rem;">' +
          'Phần ' + (sec.section_num || idx + 1) + ': ' + escapeHtml(typeLabel) +
          '</span>' +
          '<div style="display:flex;align-items:center;gap:4px;background:var(--color-surface);padding:3px 8px;border-radius:var(--radius-md);border:1px solid var(--color-border-soft);">' +
          '<span style="font-size:0.75rem;color:var(--color-muted-foreground);font-weight:600;">Điểm phần này:</span>' +
          '<input type="number" class="tabular-nums" data-sec-score value="' +
          currentScore +
          '" min="1" max="100" style="width:48px;font-size:0.875rem;font-weight:700;border:none;background:transparent;padding:2px;text-align:center;color:var(--color-primary);">' +
          '<span style="font-size:0.75rem;color:var(--color-muted-foreground);">đ</span>' +
          '</div>' +
          '</div>' +
          '<input type="hidden" data-sec-title value="' + escapeHtml(sec.title || ('Phần ' + (idx + 1) + ': ' + typeLabel)) + '">' +
          '<input type="hidden" data-sec-desc value="' + escapeHtml(sec.description || '') + '">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" class="btn btn-outline btn-sm" data-sec-move-up="' +
          idx +
          '"' +
          (idx === 0 ? ' disabled' : '') +
          ' title="Di chuyển lên trên" style="padding:4px 8px;font-size:0.75rem;">↑ Lên</button>' +
          '<button type="button" class="btn btn-outline btn-sm" data-sec-move-down="' +
          idx +
          '"' +
          (idx === ex.sections.length - 1 ? ' disabled' : '') +
          ' title="Di chuyển xuống dưới" style="padding:4px 8px;font-size:0.75rem;">↓ Xuống</button>' +
          '<button type="button" class="btn btn-outline btn-sm" data-sec-delete="' +
          escapeHtml(sec.section_id) +
          '" style="color:var(--color-destructive);border-color:var(--color-destructive);padding:4px 8px;font-size:0.75rem;" title="Xóa phần này khỏi bài tập">✕ Xóa</button>' +
          '</div>' +
          '</div>' +
          '<div style="padding: 16px 18px;">' +
          renderTypeSpecificEditorHtml(sec) +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    bindBuilderInteractiveEvents(ex);
  }

  function renderTypeSpecificEditorHtml(sec) {
    if (sec.type === 'matching') {
      const leftItems = (sec.data && sec.data.left) || [];
      const rightItems = (sec.data && sec.data.right) || [];
      const answer = (sec.data && sec.data.answer) || {};
      const rightMap = {};
      rightItems.forEach(function (r) {
        rightMap[r.id] = r.text;
      });

      const rowsHtml = leftItems
        .map(function (l, idx) {
          const pairedRightText = rightMap[answer[String(l.id)]] || '';
          return (
            '<tr data-match-row="' +
            l.id +
            '">' +
            '<td class="tabular-nums" style="font-weight:700;width:40px;text-align:center;">' +
            (idx + 1) +
            '</td>' +
            '<td><input type="text" class="form-control" data-pair-hanzi="' +
            l.id +
            '" value="' +
            escapeHtml(l.hanzi) +
            '" placeholder="Ví dụ: 你好"></td>' +
            '<td><input type="text" class="form-control" data-pair-pinyin="' +
            l.id +
            '" value="' +
            escapeHtml(l.pinyin) +
            '" placeholder="Ví dụ: nǐ hǎo"></td>' +
            '<td><input type="text" class="form-control" data-pair-meaning="' +
            l.id +
            '" value="' +
            escapeHtml(pairedRightText) +
            '" placeholder="Ví dụ: Xin chào"></td>' +
            '<td style="width:50px;text-align:center;"><button type="button" class="btn btn-outline btn-sm" data-delete-matching-row="' +
            sec.section_id +
            ':' +
            l.id +
            '" style="color:var(--color-destructive);border-color:var(--color-destructive);" title="Xóa cặp này">✕</button></td>' +
            '</tr>'
          );
        })
        .join('');

      return (
        '<div>' +
        '<div class="gform-table-wrap">' +
        '<table class="gform-matching-table">' +
        '<thead>' +
        '<tr>' +
        '<th style="width:40px;text-align:center;">STT</th>' +
        '<th>Chữ Hán (Cột A)</th>' +
        '<th>Phiên âm Pinyin</th>' +
        '<th>Nghĩa Tiếng Việt (Cột B)</th>' +
        '<th style="width:50px;text-align:center;">Xóa</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        rowsHtml +
        '</tbody>' +
        '</table>' +
        '</div>' +
        '<button type="button" class="btn btn-outline btn-sm" data-add-matching-row="' +
        escapeHtml(sec.section_id) +
        '" style="margin-top:8px;">' +
        '<span>+ Thêm cặp từ nối mới</span>' +
        '</button>' +
        '</div>'
      );
    } else if (sec.type === 'multiple_choice') {
      const items = (sec.data && sec.data.items) || [];
      const questionsHtml = items
        .map(function (item, idx) {
          const opts = item.options || ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'];
          const optLetters = ['A', 'B', 'C', 'D'];
          const optionsHtml = optLetters
            .map(function (letter, optIdx) {
              const isChecked = Number(item.correctIndex) === optIdx;
              return (
                '<div class="gform-option-row">' +
                '<label class="gform-option-radio-wrap" title="Tích chọn nếu đây là đáp án đúng">' +
                '<input type="radio" name="mc_correct_' +
                sec.section_id +
                '_' +
                item.id +
                '" value="' +
                optIdx +
                '"' +
                (isChecked ? ' checked' : '') +
                '>' +
                '<span>' +
                letter +
                ' (Đúng)</span>' +
                '</label>' +
                '<input type="text" class="form-control" data-mc-opt="' +
                sec.section_id +
                ':' +
                item.id +
                ':' +
                optIdx +
                '" value="' +
                escapeHtml(opts[optIdx] || '') +
                '" placeholder="Nội dung đáp án ' +
                letter +
                '...">' +
                '</div>'
              );
            })
            .join('');

          return (
            '<div class="gform-question-card" data-mc-qcard="' +
            item.id +
            '">' +
            '<div class="gform-question-header">' +
            '<strong style="color:var(--color-primary-deep);">Câu trắc nghiệm ' +
            (idx + 1) +
            '</strong>' +
            '<button type="button" class="btn btn-outline btn-sm" data-delete-mc-q="' +
            sec.section_id +
            ':' +
            item.id +
            '" style="color:var(--color-destructive);border-color:var(--color-destructive);">' +
            '✕ Xóa câu này' +
            '</button>' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Đề bài / Câu hỏi tiếng Trung:</label>' +
            '<textarea class="form-control" data-mc-prompt="' +
            sec.section_id +
            ':' +
            item.id +
            '" rows="2" placeholder="Ví dụ: Khi hai âm tiết mang thanh 3 đi liền nhau như 你好 (nǐ hǎo), quy tắc biến điệu phát âm chuẩn là gì?">' +
            escapeHtml(item.prompt) +
            '</textarea>' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Từ phát âm tiếng Trung (Tùy chọn — nếu nhập, học sinh sẽ có nút bấm nghe giọng đọc):</label>' +
            '<input type="text" class="form-control" data-mc-speak="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.speakWord || '') +
            '" placeholder="Ví dụ: 你好">' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;">' +
            '<label class="form-label" style="font-size:0.8125rem;margin-bottom:0;">4 Lựa chọn đáp án (Tích chọn nút tròn trước chữ cái là đáp án đúng):</label>' +
            optionsHtml +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Lời giải thích chi tiết (Hiển thị sau khi học sinh nộp bài):</label>' +
            '<input type="text" class="form-control" data-mc-exp="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.explanation || '') +
            '" placeholder="Ví dụ: Quy tắc biến điệu hai thanh 3: âm tiết thứ nhất biến âm thành thanh 2 (ní hǎo)...">' +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      return (
        '<div>' +
        '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:12px;">' +
        questionsHtml +
        '</div>' +
        '<button type="button" class="btn btn-outline btn-sm" data-add-mc-q="' +
        escapeHtml(sec.section_id) +
        '">' +
        '<span>+ Thêm câu trắc nghiệm mới</span>' +
        '</button>' +
        '</div>'
      );
    } else if (sec.type === 'fill_blank_wordbank') {
      const wordbank = (sec.data && sec.data.wordbank) || [];
      const items = (sec.data && sec.data.items) || [];

      const questionsHtml = items
        .map(function (item, idx) {
          return (
            '<div class="gform-question-card" data-fb-qcard="' +
            item.id +
            '">' +
            '<div class="gform-question-header">' +
            '<strong style="color:var(--color-primary-deep);">Câu điền từ ' +
            (idx + 1) +
            '</strong>' +
            '<button type="button" class="btn btn-outline btn-sm" data-delete-fb-q="' +
            sec.section_id +
            ':' +
            item.id +
            '" style="color:var(--color-destructive);border-color:var(--color-destructive);">' +
            '✕ Xóa câu này' +
            '</button>' +
            '</div>' +
            '<div class="form-row-2">' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Câu có chỗ trống (Dùng 4 dấu gạch dưới "____"):</label>' +
            '<input type="text" class="form-control" data-fb-text="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.text) +
            '" placeholder="Ví dụ: 李老师，____好！">' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Từ cần điền (Đáp án đúng, phải nằm trong ngân hàng từ):</label>' +
            '<input type="text" class="form-control" data-fb-ans="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.answer) +
            '" placeholder="Ví dụ: 您">' +
            '</div>' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Gợi ý nghĩa tiếng Việt cho học sinh:</label>' +
            '<input type="text" class="form-control" data-fb-hint="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.hint) +
            '" placeholder="Ví dụ: Chào cô Lý ạ! (kính trọng)">' +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      return (
        '<div>' +
        '<div style="margin-bottom:14px;background:var(--color-surface-muted);padding:12px;border-radius:var(--radius-md);">' +
        '<label class="form-label" style="font-size:0.8125rem;font-weight:700;">Ngân hàng từ vựng chung cho phần này (Các từ cách nhau bởi dấu phẩy):</label>' +
        '<input type="text" class="form-control" data-fb-wordbank="' +
        sec.section_id +
        '" value="' +
        escapeHtml(wordbank.join(', ')) +
        '" placeholder="Ví dụ: 您, 好, 们, 对不起, 没关系, 谢谢, 再见">' +
        '<div style="font-size:0.75rem;color:var(--color-muted-foreground);margin-top:4px;">Các từ này sẽ hiện thành các thẻ từ (chips) ở trên cùng để học sinh bấm chọn điền vào chỗ trống.</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:12px;">' +
        questionsHtml +
        '</div>' +
        '<button type="button" class="btn btn-outline btn-sm" data-add-fb-q="' +
        escapeHtml(sec.section_id) +
        '">' +
        '<span>+ Thêm câu điền từ mới</span>' +
        '</button>' +
        '</div>'
      );
    } else if (sec.type === 'error_correction') {
      const items = (sec.data && sec.data.items) || [];
      const questionsHtml = items
        .map(function (item, idx) {
          const acceptedStr = Array.isArray(item.accepted) ? item.accepted.join(' / ') : item.accepted || '';
          return (
            '<div class="gform-question-card" data-err-qcard="' +
            item.id +
            '">' +
            '<div class="gform-question-header">' +
            '<strong style="color:var(--color-primary-deep);">Câu sửa sai ' +
            (idx + 1) +
            '</strong>' +
            '<button type="button" class="btn btn-outline btn-sm" data-delete-err-q="' +
            sec.section_id +
            ':' +
            item.id +
            '" style="color:var(--color-destructive);border-color:var(--color-destructive);">' +
            '✕ Xóa câu này' +
            '</button>' +
            '</div>' +
            '<div class="form-row-2">' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;color:var(--color-destructive);font-weight:700;">Câu sai đề bài đưa ra:</label>' +
            '<input type="text" class="form-control" data-err-wrong="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.wrong) +
            '" placeholder="Ví dụ: 大家们好！">' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Tình huống giao tiếp thực tế:</label>' +
            '<input type="text" class="form-control" data-err-sit="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.situation) +
            '" placeholder="Ví dụ: Chào mọi người trong lớp học">' +
            '</div>' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;color:var(--color-primary-deep);font-weight:700;">Các câu đúng chấp nhận (Nếu có nhiều cách nói đúng, ngăn cách bởi dấu /):</label>' +
            '<input type="text" class="form-control" data-err-acc="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(acceptedStr) +
            '" placeholder="Ví dụ: 大家好！ / 大家好">' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Giải thích lỗi sai (Hiện sau khi nộp):</label>' +
            '<input type="text" class="form-control" data-err-exp="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.explanation) +
            '" placeholder="Ví dụ: Chữ 大家 đã mang nghĩa số nhiều, không thêm 们.">' +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      return (
        '<div>' +
        '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:12px;">' +
        questionsHtml +
        '</div>' +
        '<button type="button" class="btn btn-outline btn-sm" data-add-err-q="' +
        escapeHtml(sec.section_id) +
        '">' +
        '<span>+ Thêm câu sửa sai mới</span>' +
        '</button>' +
        '</div>'
      );
    } else if (sec.type === 'translation') {
      const items = (sec.data && sec.data.items) || [];
      const questionsHtml = items
        .map(function (item, idx) {
          const acceptedStr = Array.isArray(item.accepted) ? item.accepted.join(' / ') : item.accepted || '';
          const isViToZh = item.direction === 'vi->zh';
          const isManual = item.mode === 'manual';

          return (
            '<div class="gform-question-card" data-tr-qcard="' +
            item.id +
            '">' +
            '<div class="gform-question-header">' +
            '<strong style="color:var(--color-primary-deep);">Câu dịch ' +
            (idx + 1) +
            '</strong>' +
            '<button type="button" class="btn btn-outline btn-sm" data-delete-tr-q="' +
            sec.section_id +
            ':' +
            item.id +
            '" style="color:var(--color-destructive);border-color:var(--color-destructive);">' +
            '✕ Xóa câu này' +
            '</button>' +
            '</div>' +
            '<div class="form-row-2">' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Hướng dịch:</label>' +
            '<select class="form-control" data-tr-dir="' +
            sec.section_id +
            ':' +
            item.id +
            '">' +
            '<option value="vi->zh"' +
            (isViToZh ? ' selected' : '') +
            '>Việt &rarr; Trung (vi&rarr;zh)</option>' +
            '<option value="zh->vi"' +
            (!isViToZh ? ' selected' : '') +
            '>Trung &rarr; Việt (zh&rarr;vi)</option>' +
            '</select>' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Chế độ chấm điểm:</label>' +
            '<select class="form-control" data-tr-mode="' +
            sec.section_id +
            ':' +
            item.id +
            '">' +
            '<option value="exact"' +
            (!isManual ? ' selected' : '') +
            '>Tự động chấm (so khớp đáp án đúng)</option>' +
            '<option value="manual"' +
            (isManual ? ' selected' : '') +
            '>Giáo viên chấm thủ công</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Câu cần dịch:</label>' +
            '<input type="text" class="form-control" data-tr-prompt="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.prompt) +
            '" placeholder="Ví dụ: Xin chào các bạn! hoặc 认识你，我也很高兴。">' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Đáp án mẫu chấp nhận (Nếu chấm tự động, ngăn cách bởi /):</label>' +
            '<input type="text" class="form-control" data-tr-acc="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(acceptedStr) +
            '" placeholder="Ví dụ: 你们好！ / 大家好！">' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Gợi ý chấm cho cô (Chỉ hiện trong khung chấm của giáo viên):</label>' +
            '<input type="text" class="form-control" data-tr-note="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.grading_note || '') +
            '" placeholder="Ví dụ: Dịch đúng nghĩa: Làm quen bạn tôi cũng rất vui...">' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Giải thích từ vựng / ngữ pháp (Hiện sau khi nộp):</label>' +
            '<input type="text" class="form-control" data-tr-exp="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.explanation || '') +
            '" placeholder="Ví dụ: 认识 (quen biết), 也 (cũng)...">' +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      return (
        '<div>' +
        '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:12px;">' +
        questionsHtml +
        '</div>' +
        '<button type="button" class="btn btn-outline btn-sm" data-add-tr-q="' +
        escapeHtml(sec.section_id) +
        '">' +
        '<span>+ Thêm câu dịch mới</span>' +
        '</button>' +
        '</div>'
      );
    }
    return '';
  }

  function bindBuilderInteractiveEvents(ex) {
    // 1. Move Up / Down / Delete Section
    document.querySelectorAll('[data-sec-move-up]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const idx = parseInt(btn.getAttribute('data-sec-move-up'), 10);
        if (idx > 0) {
          const temp = ex.sections[idx];
          ex.sections[idx] = ex.sections[idx - 1];
          ex.sections[idx - 1] = temp;
          ex.sections.forEach(function (s, i) {
            s.section_num = i + 1;
          });
          window.StudySnapStore.savePracticeExercise(state, ex);
          renderTeacherPracticeTab();
        }
      });
    });

    document.querySelectorAll('[data-sec-move-down]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const idx = parseInt(btn.getAttribute('data-sec-move-down'), 10);
        if (idx < ex.sections.length - 1) {
          const temp = ex.sections[idx];
          ex.sections[idx] = ex.sections[idx + 1];
          ex.sections[idx + 1] = temp;
          ex.sections.forEach(function (s, i) {
            s.section_num = i + 1;
          });
          window.StudySnapStore.savePracticeExercise(state, ex);
          renderTeacherPracticeTab();
        }
      });
    });

    document.querySelectorAll('[data-sec-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const secId = btn.getAttribute('data-sec-delete');
        if (window.confirm('Cô có chắc muốn xóa phần này khỏi bài tập không?')) {
          collectExerciseFromDom();
          ex.sections = ex.sections.filter(function (s) {
            return s.section_id !== secId;
          });
          ex.sections.forEach(function (s, i) {
            s.section_num = i + 1;
          });
          let total = 0;
          ex.sections.forEach(function (s) {
            total += Number(s.max_score || 0);
          });
          ex.total_score = total;
          window.StudySnapStore.savePracticeExercise(state, ex);
          renderTeacherPracticeTab();
          showToast('Đã xóa phần bài tập!');
        }
      });
    });

    // 2. Matching: Add Row / Delete Row
    document.querySelectorAll('[data-add-matching-row]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const secId = btn.getAttribute('data-add-matching-row');
        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data) return;

        if (!Array.isArray(sec.data.left)) sec.data.left = [];
        if (!Array.isArray(sec.data.right)) sec.data.right = [];
        if (!sec.data.answer) sec.data.answer = {};

        const nextLeftId = sec.data.left.length + 1;
        const nextRightId = String.fromCharCode(65 + sec.data.right.length);

        sec.data.left.push({ id: nextLeftId, hanzi: '', pinyin: '' });
        sec.data.right.push({ id: nextRightId, text: '' });
        sec.data.answer[String(nextLeftId)] = nextRightId;
        sec.max_score = sec.data.left.length;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });

    document.querySelectorAll('[data-delete-matching-row]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const parts = btn.getAttribute('data-delete-matching-row').split(':');
        const secId = parts[0];
        const leftId = parseInt(parts[1], 10);

        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data || !Array.isArray(sec.data.left)) return;

        const idx = sec.data.left.findIndex(function (l) {
          return l.id === leftId;
        });
        if (idx >= 0) {
          sec.data.left.splice(idx, 1);
          if (sec.data.right && sec.data.right[idx]) {
            sec.data.right.splice(idx, 1);
          }
          // Re-key matching
          const newLeft = [];
          const newRight = [];
          const newAnswer = {};
          sec.data.left.forEach(function (l, i) {
            const newLId = i + 1;
            const newRId = String.fromCharCode(65 + i);
            newLeft.push({ id: newLId, hanzi: l.hanzi, pinyin: l.pinyin });
            const rText = sec.data.right && sec.data.right[i] ? sec.data.right[i].text : '';
            newRight.push({ id: newRId, text: rText });
            newAnswer[String(newLId)] = newRId;
          });
          sec.data.left = newLeft;
          sec.data.right = newRight;
          sec.data.answer = newAnswer;
          sec.max_score = newLeft.length;

          window.StudySnapStore.savePracticeExercise(state, ex);
          renderTeacherPracticeTab();
        }
      });
    });

    // 3. Multiple Choice: Add Question / Delete Question
    document.querySelectorAll('[data-add-mc-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const secId = btn.getAttribute('data-add-mc-q');
        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data) return;
        if (!Array.isArray(sec.data.items)) sec.data.items = [];

        sec.data.items.push({
          id: 'MC_' + Date.now(),
          prompt: '',
          speakWord: '',
          options: ['Đáp án A (Đúng)', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
          correctIndex: 0,
          explanation: ''
        });
        sec.max_score = sec.data.items.length;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });

    document.querySelectorAll('[data-delete-mc-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const parts = btn.getAttribute('data-delete-mc-q').split(':');
        const secId = parts[0];
        const itemId = parts[1];

        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data || !Array.isArray(sec.data.items)) return;

        sec.data.items = sec.data.items.filter(function (it) {
          return it.id !== itemId;
        });
        sec.max_score = sec.data.items.length;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });

    // 4. Fill Blank: Add Question / Delete Question
    document.querySelectorAll('[data-add-fb-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const secId = btn.getAttribute('data-add-fb-q');
        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data) return;
        if (!Array.isArray(sec.data.items)) sec.data.items = [];

        sec.data.items.push({
          id: 'FB_' + Date.now(),
          text: '李老师，____好！',
          hint: 'Gợi ý nghĩa tiếng Việt...',
          answer: '您'
        });
        sec.max_score = sec.data.items.length;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });

    document.querySelectorAll('[data-delete-fb-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const parts = btn.getAttribute('data-delete-fb-q').split(':');
        const secId = parts[0];
        const itemId = parts[1];

        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data || !Array.isArray(sec.data.items)) return;

        sec.data.items = sec.data.items.filter(function (it) {
          return it.id !== itemId;
        });
        sec.max_score = sec.data.items.length;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });

    // 5. Error Correction: Add Question / Delete Question
    document.querySelectorAll('[data-add-err-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const secId = btn.getAttribute('data-add-err-q');
        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data) return;
        if (!Array.isArray(sec.data.items)) sec.data.items = [];

        sec.data.items.push({
          id: 'ERR_' + Date.now(),
          wrong: '大家们好！',
          situation: 'Tình huống giao tiếp...',
          accepted: ['大家好！', '大家好'],
          explanation: ''
        });
        sec.max_score = sec.data.items.length;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });

    document.querySelectorAll('[data-delete-err-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const parts = btn.getAttribute('data-delete-err-q').split(':');
        const secId = parts[0];
        const itemId = parts[1];

        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data || !Array.isArray(sec.data.items)) return;

        sec.data.items = sec.data.items.filter(function (it) {
          return it.id !== itemId;
        });
        sec.max_score = sec.data.items.length;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });

    // 6. Translation: Add Question / Delete Question
    document.querySelectorAll('[data-add-tr-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const secId = btn.getAttribute('data-add-tr-q');
        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data) return;
        if (!Array.isArray(sec.data.items)) sec.data.items = [];

        sec.data.items.push({
          id: 'TR_' + Date.now(),
          direction: 'vi->zh',
          mode: 'exact',
          prompt: 'Xin chào các bạn!',
          accepted: ['你们好！', '大家好！'],
          grading_note: '',
          explanation: ''
        });
        sec.max_score = sec.data.items.length;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });

    document.querySelectorAll('[data-delete-tr-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const parts = btn.getAttribute('data-delete-tr-q').split(':');
        const secId = parts[0];
        const itemId = parts[1];

        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data || !Array.isArray(sec.data.items)) return;

        sec.data.items = sec.data.items.filter(function (it) {
          return it.id !== itemId;
        });
        sec.max_score = sec.data.items.length;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });
  }

  function renderTeacherPracticeSubmissions(ex) {
    const tbody = document.getElementById('teacher-practice-submissions-tbody');
    const countBadge = document.getElementById('teacher-practice-sub-count');
    if (!tbody) return;

    const subs = (state.practiceSubmissions || []).filter(function (s) {
      return s.exercise_id === ex.exercise_id;
    });

    if (countBadge) {
      countBadge.textContent = subs.length + ' bài nộp';
    }

    if (subs.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-muted-foreground);">' +
        'Chưa có học sinh nào nộp bài tập này. Học sinh có thể làm trực tiếp tại Cổng Học sinh (Tab 2).' +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = subs
      .map(function (sub) {
        const student = findStudent(sub.student_id);
        const studentName = student ? student.full_name : sub.student_name;
        const totalScore = sub.total_score || 0;
        const maxScore = sub.max_score || ex.total_score || 35;

        let ratingBadge = '<span class="status-badge status-graded">Rất tốt 🌟</span>';
        if (sub.rating === 'good') {
          ratingBadge = '<span class="status-badge status-submitted">Khá 👍</span>';
        } else if (sub.rating === 'needs_review') {
          ratingBadge = '<span class="status-badge status-missing">Cần ôn 📚</span>';
        }

        const secScores = sub.section_scores || {};
        const breakdownStr = (ex.sections || [])
          .map(function (sec, idx) {
            const sc = secScores[sec.section_id] !== undefined ? secScores[sec.section_id] : 0;
            return 'P' + (sec.section_num || idx + 1) + ': ' + sc + '/' + sec.max_score;
          })
          .join(' • ');

        let hasPendingManual = false;
        (ex.sections || []).forEach(function (sec) {
          if (sec.type === 'translation') {
            ((sec.data && sec.data.items) || []).forEach(function (item) {
              if (item.mode === 'manual') {
                const mg = sub.manual_grades && sub.manual_grades[item.id];
                if (!mg) hasPendingManual = true;
              }
            });
          }
        });

        const statusBadge = hasPendingManual
          ? '<span class="status-badge status-submitted">Chờ chấm câu Dịch</span>'
          : '<span class="status-badge status-graded">Đã chấm xong</span>';

        const actionBtnText = hasPendingManual ? 'Chấm câu Dịch' : 'Xem &amp; Sửa điểm';
        const actionBtnClass = hasPendingManual ? 'btn-primary' : 'btn-outline';

        return (
          '<tr>' +
          '<td>' +
          '<div style="font-weight:700;color:var(--color-foreground);">' +
          escapeHtml(studentName) +
          '</div>' +
          '<div class="tabular-nums" style="font-size:0.8125rem;color:var(--color-muted-foreground);">' +
          escapeHtml(sub.student_id) +
          ' • ' +
          escapeHtml(sub.submitted_at) +
          '</div>' +
          '</td>' +
          '<td class="tabular-nums" style="font-weight:700;font-size:1.125rem;color:var(--color-primary-deep);">' +
          totalScore +
          '/' +
          maxScore +
          ' đ' +
          '</td>' +
          '<td>' +
          ratingBadge +
          '</td>' +
          '<td class="tabular-nums" style="font-size:0.8125rem;color:var(--color-foreground);">' +
          escapeHtml(breakdownStr) +
          '</td>' +
          '<td>' +
          statusBadge +
          '</td>' +
          '<td>' +
          '<button type="button" class="btn ' +
          actionBtnClass +
          ' btn-sm" data-open-manual-sub="' +
          escapeHtml(sub.submission_id) +
          '">' +
          actionBtnText +
          '</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('[data-open-manual-sub]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const subId = btn.getAttribute('data-open-manual-sub');
        openManualGradingModal(subId);
      });
    });
  }

  function openManualGradingModal(submissionId) {
    const sub = (state.practiceSubmissions || []).find(function (s) {
      return s.submission_id === submissionId;
    });
    if (!sub) return;

    const ex =
      (state.practiceExercises || []).find(function (e) {
        return e.exercise_id === sub.exercise_id;
      }) || getActivePracticeExercise();

    ui.activeGradingSubId = sub.submission_id;

    const student = findStudent(sub.student_id);
    const studentName = student ? student.full_name : sub.student_name;

    const infoEl = document.getElementById('manual-grading-student-info');
    if (infoEl) {
      infoEl.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--color-surface-muted);padding:10px 14px;border-radius:var(--radius-md);">' +
        '<div><strong>Học sinh:</strong> ' +
        escapeHtml(studentName) +
        ' (' +
        escapeHtml(sub.student_id) +
        ') • Nộp lúc: ' +
        escapeHtml(sub.submitted_at) +
        '</div>' +
        '<div><strong>Điểm hiện tại:</strong> <span class="tabular-nums" style="color:var(--color-primary-deep);font-weight:700;">' +
        sub.total_score +
        '/' +
        (sub.max_score || 35) +
        ' đ</span></div>' +
        '</div>';
    }

    const manualItems = [];
    let translationSecId = null;
    (ex.sections || []).forEach(function (sec) {
      if (sec.type === 'translation') {
        translationSecId = sec.section_id;
        ((sec.data && sec.data.items) || []).forEach(function (item) {
          if (item.mode === 'manual') {
            manualItems.push({ secId: sec.section_id, item: item });
          }
        });
      }
    });

    const container = document.getElementById('manual-grading-questions-container');
    if (!container) return;

    if (manualItems.length === 0) {
      container.innerHTML =
        '<p style="color:var(--color-muted-foreground);text-align:center;">Bài tập này không có câu Dịch nào cần chấm thủ công.</p>';
    } else {
      const studentTransAns = (sub.answers && sub.answers[translationSecId]) || {};
      const manualGrades = sub.manual_grades || {};

      container.innerHTML = manualItems
        .map(function (entry, idx) {
          const item = entry.item;
          const userAns = studentTransAns[item.id] || '';
          const mg = manualGrades[item.id] || {};
          const currentScore = mg.score !== undefined ? mg.score : 1;
          const currentComment = mg.comment || '';

          return (
            '<div class="surface-panel" style="padding:14px;border:1px solid var(--color-border-soft);">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px;">' +
            '<div style="font-weight:700;color:var(--color-foreground);font-size:0.9375rem;">' +
            'Câu Dịch ' +
            (idx + 1) +
            ': <span style="font-size:1.125rem;color:var(--color-primary-deep);">' +
            escapeHtml(item.prompt) +
            '</span>' +
            '</div>' +
            '<span class="status-badge status-submitted" style="font-size:0.75rem;">Trung &rarr; Việt (zh&rarr;vi)</span>' +
            '</div>' +
            (item.grading_note
              ? '<div style="font-size:0.8125rem;color:var(--color-muted-foreground);margin-bottom:8px;font-style:italic;">💡 <strong>Gợi ý chấm của đề:</strong> ' +
                escapeHtml(item.grading_note) +
                '</div>'
              : '') +
            '<div style="background:var(--color-background);padding:10px 12px;border-radius:var(--radius-md);margin-bottom:12px;border:1px solid var(--color-border-soft);">' +
            '<div style="font-size:0.8125rem;color:var(--color-muted-foreground);font-weight:600;">Bản dịch của học sinh:</div>' +
            '<div style="font-size:1rem;font-weight:700;color:var(--color-foreground);margin-top:2px;">' +
            (userAns
              ? escapeHtml(userAns)
              : '<em style="color:var(--color-destructive);">Chưa nhập câu dịch</em>') +
            '</div>' +
            '</div>' +
            '<div class="form-row-2">' +
            '<div class="form-group" style="margin-bottom:0;">' +
            '<label class="form-label" style="font-size:0.8125rem;" for="manual-score-' +
            escapeHtml(item.id) +
            '">Điểm câu này (0 đến 1 điểm):</label>' +
            '<input type="number" id="manual-score-' +
            escapeHtml(item.id) +
            '" class="form-control tabular-nums" min="0" max="1" step="0.5" value="' +
            currentScore +
            '" data-manual-item-score="' +
            escapeHtml(item.id) +
            '" required>' +
            '</div>' +
            '<div class="form-group" style="margin-bottom:0;">' +
            '<label class="form-label" style="font-size:0.8125rem;" for="manual-comment-' +
            escapeHtml(item.id) +
            '">Lời nhận xét cho học sinh:</label>' +
            '<input type="text" id="manual-comment-' +
            escapeHtml(item.id) +
            '" class="form-control" placeholder="Ví dụ: Dịch tự nhiên, đúng ngữ cảnh..." value="' +
            escapeHtml(currentComment) +
            '" data-manual-item-comment="' +
            escapeHtml(item.id) +
            '">' +
            '</div>' +
            '</div>' +
            '</div>'
          );
        })
        .join('');
    }

    const modal = document.getElementById('modal-manual-grading');
    if (modal) modal.classList.add('is-open', 'is-visible');
  }

  function exportPracticeSubmissionsToCsv() {
    const ex = getActivePracticeExercise();
    if (!ex) return;

    const subs = (state.practiceSubmissions || []).filter(function (s) {
      return s.exercise_id === ex.exercise_id;
    });

    if (subs.length === 0) {
      showToast('Chưa có bài nộp nào để xuất file Excel!');
      return;
    }

    const headers = [
      'Mã Học Sinh',
      'Họ và Tên',
      'Bài Tập',
      'Điểm Tổng',
      'Điểm Tối Đa',
      'Xếp Loại',
      'Phần 1: Nối từ',
      'Phần 2: Trắc nghiệm',
      'Phần 3: Điền từ',
      'Phần 4: Sửa câu sai',
      'Phần 5: Dịch',
      'Thời Gian Nộp',
      'Trạng Thái'
    ];

    const rows = [headers];
    subs.forEach(function (sub) {
      const student = findStudent(sub.student_id);
      const studentName = student ? student.full_name : sub.student_name;
      const secScores = sub.section_scores || {};

      let p1 = 0,
        p2 = 0,
        p3 = 0,
        p4 = 0,
        p5 = 0;
      (ex.sections || []).forEach(function (sec, idx) {
        const sc = secScores[sec.section_id] !== undefined ? secScores[sec.section_id] : 0;
        if (idx === 0) p1 = sc;
        else if (idx === 1) p2 = sc;
        else if (idx === 2) p3 = sc;
        else if (idx === 3) p4 = sc;
        else if (idx === 4) p5 = sc;
      });

      const ratingText =
        sub.rating === 'very_good'
          ? 'Rất tốt'
          : sub.rating === 'good'
          ? 'Khá'
          : 'Cần ôn';

      rows.push([
        sub.student_id,
        studentName,
        ex.title,
        sub.total_score,
        sub.max_score || ex.total_score || 35,
        ratingText,
        p1,
        p2,
        p3,
        p4,
        p5,
        sub.submitted_at,
        sub.status === 'graded' ? 'Đã chấm' : 'Chờ chấm câu Dịch'
      ]);
    });

    const csvContent =
      '\uFEFF' +
      rows
        .map(function (r) {
          return r
            .map(function (cell) {
              return '"' + String(cell || '').replace(/"/g, '""') + '"';
            })
            .join(',');
        })
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'StudySnap_Diem_Luyen_Tap_' + (ex.exercise_id || 'HSK1') + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file Excel (CSV) điểm bài tập luyện tập!');
  }

  function handleJsonImport() {
    const textarea = document.getElementById('json-import-textarea');
    if (!textarea) return;
    const raw = textarea.value.trim();
    if (!raw) {
      alert('Vui lòng dán mã JSON bài tập vào ô nhập!');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed.exercise_id || !parsed.title || !Array.isArray(parsed.sections)) {
        alert(
          'Mã JSON không hợp lệ! Bắt buộc phải có các trường "exercise_id", "title" và mảng "sections".'
        );
        return;
      }

      window.StudySnapStore.savePracticeExercise(state, parsed);
      ui.selectedPracticeExId = parsed.exercise_id;
      renderTeacherPracticeTab();

      const modal = document.getElementById('modal-json-import');
      if (modal) modal.classList.remove('is-visible');
      showToast('Đã nhập bài tập "' + parsed.title + '" từ JSON thành công!');
    } catch (err) {
      alert('Lỗi cú pháp JSON: ' + err.message);
    }
  }

  function handleExcelPaste() {
    const ex = getActivePracticeExercise();
    if (!ex) return;
    const typeSelect = document.getElementById('excel-target-section-type');
    const textarea = document.getElementById('excel-paste-textarea');
    if (!typeSelect || !textarea) return;

    const raw = textarea.value.trim();
    if (!raw) {
      alert('Vui lòng dán các dòng dữ liệu từ bảng tính Excel vào ô nhập!');
      return;
    }

    const targetType = typeSelect.value;
    const lines = raw
      .split(/\r?\n/)
      .map(function (l) {
        return l.trim();
      })
      .filter(function (l) {
        return l.length > 0;
      });

    if (lines.length === 0) return;

    let targetSec = (ex.sections || []).find(function (s) {
      return s.type === targetType;
    });
    if (!targetSec) {
      targetSec = {
        section_id: 'sec_' + targetType + '_' + Date.now(),
        section_num: (ex.sections || []).length + 1,
        type: targetType,
        title: 'Phần mới: ' + targetType,
        description: 'Dữ liệu nhập từ Excel',
        max_score: lines.length,
        data: {}
      };
      if (!ex.sections) ex.sections = [];
      ex.sections.push(targetSec);
    }

    if (targetType === 'matching') {
      const left = [];
      const right = [];
      const answer = {};

      lines.forEach(function (line, i) {
        const parts = line.split('\t');
        const hanzi = (parts[0] || '').trim();
        const pinyin = (parts[1] || '').trim();
        const text = (parts[2] || '').trim();
        const leftId = i + 1;
        const rightId = String.fromCharCode(65 + i);

        if (hanzi) {
          left.push({ id: leftId, hanzi: hanzi, pinyin: pinyin });
          right.push({ id: rightId, text: text || hanzi });
          answer[String(leftId)] = rightId;
        }
      });

      targetSec.data = { left: left, right: right, answer: answer };
      targetSec.max_score = left.length;
    } else if (targetType === 'fill_blank_wordbank') {
      const items = [];
      const wordbank = [];

      lines.forEach(function (line, i) {
        const parts = line.split('\t');
        const text = (parts[0] || '').trim();
        const hint = (parts[1] || '').trim();
        const ans = (parts[2] || '').trim();

        if (text && ans) {
          items.push({ id: 'FB_' + (i + 1), text: text, hint: hint, answer: ans });
          if (wordbank.indexOf(ans) === -1) wordbank.push(ans);
        }
      });

      targetSec.data = { wordbank: wordbank, items: items };
      targetSec.max_score = items.length;
    } else if (targetType === 'error_correction') {
      const items = [];

      lines.forEach(function (line, i) {
        const parts = line.split('\t');
        const wrong = (parts[0] || '').trim();
        const situation = (parts[1] || '').trim();
        const acceptedStr = (parts[2] || '').trim();
        const explanation = (parts[3] || '').trim();

        if (wrong) {
          const accepted = acceptedStr
            .split(/[\/,;]/)
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean);
          items.push({
            id: 'ERR_' + (i + 1),
            wrong: wrong,
            situation: situation,
            accepted: accepted.length > 0 ? accepted : [acceptedStr],
            explanation: explanation
          });
        }
      });

      targetSec.data = { items: items };
      targetSec.max_score = items.length;
    }

    let totalScore = 0;
    ex.sections.forEach(function (s) {
      totalScore += s.max_score || 0;
    });
    ex.total_score = totalScore;

    window.StudySnapStore.savePracticeExercise(state, ex);
    renderTeacherPracticeTab();

    const modal = document.getElementById('modal-excel-paste');
    if (modal) modal.classList.remove('is-visible');
    showToast('Đã nạp ' + lines.length + ' câu từ Excel vào dạng bài ' + targetType + '!');
  }

  function bindTeacherPracticeEvents() {
    // 1. Practice Exercise selector dropdown
    const selectEl = document.getElementById('teacher-practice-select');
    if (selectEl) {
      selectEl.addEventListener('change', function () {
        ui.selectedPracticeExId = selectEl.value;
        renderTeacherPracticeTab();
      });
    }

    // 2. Sub-view Switcher (Google Form Builder vs Submissions)
    document.querySelectorAll('[data-practice-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const view = btn.getAttribute('data-practice-view');
        switchPracticeSubView(view);
      });
    });

    // 3. Create Practice Exercise Modal & Trigger
    const btnCreateEx = document.getElementById('btn-create-practice-ex');
    const modalCreateEx = document.getElementById('modal-create-practice-ex');
    const btnCloseCreateEx = document.getElementById('btn-close-create-ex-modal');
    const btnCancelCreateEx = document.getElementById('btn-cancel-create-ex-modal');
    const formCreateEx = document.getElementById('form-create-new-practice-ex');

    if (btnCreateEx && modalCreateEx) {
      btnCreateEx.addEventListener('click', function () {
        const nextNum = (state.practiceExercises || []).length + 1;
        const titleInp = document.getElementById('new-ex-title');
        const tagInp = document.getElementById('new-ex-tag');
        const currentTitleInp = document.getElementById('ex-meta-title');
        const currentTagInp = document.getElementById('ex-meta-tag');

        const currentTitle = currentTitleInp ? currentTitleInp.value.trim() : '';
        const currentTag = currentTagInp ? currentTagInp.value.trim() : '';

        if (titleInp) {
          titleInp.value = currentTitle && currentTitle !== 'Bài tập luyện tập cuối bài — HSK 1: Bài 1'
            ? currentTitle
            : 'Bài tập luyện tập cuối bài — HSK 1: Bài ' + nextNum;
        }
        if (tagInp) {
          tagInp.value = currentTag && currentTag !== 'Bài 1'
            ? currentTag
            : 'Bài ' + nextNum;
        }

        modalCreateEx.classList.add('is-open', 'is-visible');
        setTimeout(function () {
          if (titleInp) {
            titleInp.focus();
            titleInp.select();
          }
        }, 60);
      });

      modalCreateEx.addEventListener('click', function (e) {
        if (e.target === modalCreateEx) {
          modalCreateEx.classList.remove('is-open', 'is-visible');
        }
      });
    }

    if (btnCloseCreateEx && modalCreateEx) {
      btnCloseCreateEx.addEventListener('click', function () {
        modalCreateEx.classList.remove('is-open', 'is-visible');
      });
    }

    if (btnCancelCreateEx && modalCreateEx) {
      btnCancelCreateEx.addEventListener('click', function () {
        modalCreateEx.classList.remove('is-open', 'is-visible');
      });
    }

    if (formCreateEx && modalCreateEx) {
      formCreateEx.addEventListener('submit', function (e) {
        e.preventDefault();
        const titleInp = document.getElementById('new-ex-title');
        const tagInp = document.getElementById('new-ex-tag');

        const nextNum = (state.practiceExercises || []).length + 1;
        const title = (titleInp ? titleInp.value : '').trim() || ('Bài ' + nextNum);
        const tag = (tagInp ? tagInp.value : '').trim() || ('Bài ' + nextNum);

        const newEx = createTemplateExercise(title, tag);

        if (!Array.isArray(state.practiceExercises)) {
          state.practiceExercises = [];
        }
        window.StudySnapStore.savePracticeExercise(state, newEx);
        ui.selectedPracticeExId = newEx.exercise_id;
        ui.practiceCurrentView = 'builder';
        modalCreateEx.classList.remove('is-open', 'is-visible');
        renderTeacherPracticeTab();
        showToast('Đã tạo bài tập mới: ' + title);
      });
    }

    // Top Bar Save Button Trigger
    const btnSaveTop = document.getElementById('btn-save-top-bar');
    if (btnSaveTop) {
      btnSaveTop.addEventListener('click', function () {
        const form = document.getElementById('teacher-exercise-meta-form');
        if (form) {
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        }
      });
    }

    // 4. Quick Add Section Buttons (matching, multiple_choice, fill_blank_wordbank, error_correction, translation)
    document.querySelectorAll('[data-quick-add-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const ex = getActivePracticeExercise();
        collectExerciseFromDom();
        const type = btn.getAttribute('data-quick-add-type');
        const nextNum = (ex.sections || []).length + 1;
        const newSec = createDefaultSection(type, nextNum);
        if (!ex.sections) ex.sections = [];
        ex.sections.push(newSec);

        let total = 0;
        ex.sections.forEach(function (s) {
          total += Number(s.max_score || 0);
        });
        ex.total_score = total;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
        showToast('Đã thêm mẫu ' + newSec.title + ' vào bài tập!');

        setTimeout(function () {
          const newCard = document.querySelector('[data-sec-card="' + newSec.section_id + '"]');
          if (newCard) {
            newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 80);
      });
    });

    // 5. Exercise Meta & Sections Save Submit
    const metaForm = document.getElementById('teacher-exercise-meta-form');
    if (metaForm) {
      metaForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const ex = getActivePracticeExercise();

        collectExerciseFromDom();

        const titleInput = document.getElementById('ex-meta-title');
        const tagInput = document.getElementById('ex-meta-tag');
        const threshGood = document.getElementById('ex-meta-thresh-good');
        const threshVeryGood = document.getElementById('ex-meta-thresh-verygood');

        if (titleInput && titleInput.value.trim()) ex.title = titleInput.value.trim();
        if (tagInput && tagInput.value.trim()) ex.lesson_tag = tagInput.value.trim();
        if (!ex.thresholds) ex.thresholds = { good: 25, very_good: 31 };
        ex.thresholds.good = parseInt(threshGood ? threshGood.value : 25, 10) || 25;
        ex.thresholds.very_good = parseInt(threshVeryGood ? threshVeryGood.value : 31, 10) || 31;

        let total = 0;
        (ex.sections || []).forEach(function (s) {
          total += Number(s.max_score || 0);
        });
        ex.total_score = total;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
        showToast('💾 Đã lưu bài tập "' + ex.title + '" thành công!');
      });
    }

    // 6. Delete Current Exercise Button
    const btnDeleteEx = document.getElementById('btn-delete-current-ex');
    if (btnDeleteEx) {
      btnDeleteEx.addEventListener('click', function () {
        const ex = getActivePracticeExercise();
        if (!ex) return;
        if (
          window.confirm(
            'Cô có chắc muốn xóa vĩnh viễn bài tập "' +
              ex.title +
              '" không? Toàn bộ câu hỏi và bài nộp sẽ bị xóa.'
          )
        ) {
          window.StudySnapStore.deletePracticeExercise(state, ex.exercise_id);
          ui.selectedPracticeExId =
            state.practiceExercises && state.practiceExercises[0]
              ? state.practiceExercises[0].exercise_id
              : null;
          renderTeacherPracticeTab();
          showToast('Đã xóa bài tập!');
        }
      });
    }

    // 7. Add New Section Button (Fallback if present in DOM)
    const btnAddNewSec = document.getElementById('btn-add-new-section');
    if (btnAddNewSec) {
      btnAddNewSec.addEventListener('click', function () {
        const ex = getActivePracticeExercise();
        if (!ex) return;
        collectExerciseFromDom();
        const nextNum = (ex.sections || []).length + 1;
        const newSec = createDefaultSection('multiple_choice', nextNum);
        if (!ex.sections) ex.sections = [];
        ex.sections.push(newSec);

        let total = 0;
        ex.sections.forEach(function (s) {
          total += Number(s.max_score || 0);
        });
        ex.total_score = total;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
        showToast('Đã thêm phần mới vào bài tập!');
      });
    }

    // 6. CSV Export Button
    const btnExportCsv = document.getElementById('btn-export-practice-csv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', exportPracticeSubmissionsToCsv);
    }

    // 7. Modals: Open & Close bindings
    // JSON Modal
    const btnOpenJson = document.getElementById('btn-open-json-modal');
    const modalJson = document.getElementById('modal-json-import');
    const btnCloseJson = document.getElementById('btn-close-json-modal');
    const btnCancelJson = document.getElementById('btn-cancel-json-modal');
    const btnSubmitJson = document.getElementById('btn-submit-json-import');
    const btnLoadSampleJson = document.getElementById('btn-load-sample-json');

    if (btnOpenJson && modalJson) {
      btnOpenJson.addEventListener('click', function () {
        modalJson.classList.add('is-visible');
      });
    }
    if (btnCloseJson && modalJson) {
      btnCloseJson.addEventListener('click', function () {
        modalJson.classList.remove('is-visible');
      });
    }
    if (btnCancelJson && modalJson) {
      btnCancelJson.addEventListener('click', function () {
        modalJson.classList.remove('is-visible');
      });
    }
    if (btnLoadSampleJson) {
      btnLoadSampleJson.addEventListener('click', function () {
        const sample =
          (state.practiceExercises && state.practiceExercises[0]) || null;
        const textarea = document.getElementById('json-import-textarea');
        if (textarea && sample) {
          textarea.value = JSON.stringify(sample, null, 2);
        }
      });
    }
    if (btnSubmitJson) {
      btnSubmitJson.addEventListener('click', handleJsonImport);
    }

    // Excel Modal
    const btnOpenExcel = document.getElementById('btn-open-excel-modal');
    const modalExcel = document.getElementById('modal-excel-paste');
    const btnCloseExcel = document.getElementById('btn-close-excel-modal');
    const btnCancelExcel = document.getElementById('btn-cancel-excel-modal');
    const btnSubmitExcel = document.getElementById('btn-submit-excel-paste');

    if (btnOpenExcel && modalExcel) {
      btnOpenExcel.addEventListener('click', function () {
        modalExcel.classList.add('is-visible');
      });
    }
    if (btnCloseExcel && modalExcel) {
      btnCloseExcel.addEventListener('click', function () {
        modalExcel.classList.remove('is-visible');
      });
    }
    if (btnCancelExcel && modalExcel) {
      btnCancelExcel.addEventListener('click', function () {
        modalExcel.classList.remove('is-visible');
      });
    }
    if (btnSubmitExcel) {
      btnSubmitExcel.addEventListener('click', handleExcelPaste);
    }

    // Manual Grading Modal Close & Submit
    const modalManual = document.getElementById('modal-manual-grading');
    const btnCloseManual = document.getElementById('btn-close-manual-modal');
    const btnCancelManual = document.getElementById('btn-cancel-manual-modal');
    const manualForm = document.getElementById('manual-grading-form');

    if (btnCloseManual && modalManual) {
      btnCloseManual.addEventListener('click', function () {
        modalManual.classList.remove('is-open', 'is-visible');
      });
    }
    if (btnCancelManual && modalManual) {
      btnCancelManual.addEventListener('click', function () {
        modalManual.classList.remove('is-open', 'is-visible');
      });
    }

    if (manualForm) {
      manualForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!ui.activeGradingSubId) return;

        const sub = (state.practiceSubmissions || []).find(function (s) {
          return s.submission_id === ui.activeGradingSubId;
        });
        if (!sub) return;

        const ex =
          (state.practiceExercises || []).find(function (e) {
            return e.exercise_id === sub.exercise_id;
          }) || getActivePracticeExercise();

        const manualGrades = sub.manual_grades || {};
        let manualSum = 0;

        document.querySelectorAll('[data-manual-item-score]').forEach(function (inp) {
          const itemId = inp.getAttribute('data-manual-item-score');
          const score = parseFloat(inp.value) || 0;
          const commentInp = document.querySelector(
            '[data-manual-item-comment="' + itemId + '"]'
          );
          const comment = commentInp ? commentInp.value.trim() : '';
          manualGrades[itemId] = { score: score, comment: comment };
          manualSum += score;
        });

        // Recalculate translation section score:
        let autoTransScore = 0;
        let transSecId = null;
        (ex.sections || []).forEach(function (sec) {
          if (sec.type === 'translation') {
            transSecId = sec.section_id;
            ((sec.data && sec.data.items) || []).forEach(function (item) {
              if (item.mode !== 'manual') {
                const userVal =
                  sub.answers && sub.answers[sec.section_id] && sub.answers[sec.section_id][item.id];
                if (window.StudySnapStore.isAnswerMatch(userVal, item.accepted || [])) {
                  autoTransScore += 1;
                }
              }
            });
          }
        });

        if (transSecId) {
          if (!sub.section_scores) sub.section_scores = {};
          sub.section_scores[transSecId] = autoTransScore + manualSum;
        }

        // Recalculate total score
        let newTotal = 0;
        Object.keys(sub.section_scores || {}).forEach(function (k) {
          newTotal += Number(sub.section_scores[k] || 0);
        });

        const newRating = window.StudySnapStore.calculateRating(newTotal, ex.thresholds);

        await window.StudySnapStore.gradeManualTranslation(
          state,
          sub.submission_id,
          manualGrades,
          newTotal,
          newRating
        );

        if (modalManual) modalManual.classList.remove('is-open', 'is-visible');
        renderTeacherPracticeTab();
        showToast('Đã lưu điểm và nhận xét cho câu Dịch của học sinh thành công!');
      });
    }
  }

  function switchTeacherTab(tabId) {
    ui.activeTab = tabId;
    document.querySelectorAll('[data-teacher-tab]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-teacher-tab') === tabId);
    });
    document.querySelectorAll('.module-section').forEach(function (sec) {
      sec.classList.toggle('is-active', sec.id === 'teacher-tab-' + tabId);
    });
    if (tabId === 'practice') {
      renderTeacherPracticeTab();
    }
  }

  function bindEvents() {
    bindTeacherPracticeEvents();

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
    renderTeacherPracticeTab();
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

