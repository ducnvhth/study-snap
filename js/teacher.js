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
    activeTab: 'practice',
    selectedClass: 'all',
    gradingSessionFilter: 'all',
    manageSelectedSession: 'Buổi 1',
    studentAccountsClassFilter: 'all',
    gradingStudentId: state.students[0] ? state.students[0].student_id : 'HS01',
    gradingAssignmentId: state.assignments[0] ? state.assignments[0].assignment_id : 'BVN01_1',
    matrixFilter: 'all',
    teacherDraftVoice: null,
    isTeacherRecording: false,
    vocabFilter: 'bai-1',
    selectedLesson: 'bai-1',
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

  async function runWithLoading(btnOrList, loadingLabel, asyncFn, overlayOpts) {
    const loading = window.StudySnapLoading;
    if (!loading) return await asyncFn();
    const wrapped = overlayOpts
      ? function () {
          return loading.withOverlay(overlayOpts.title, overlayOpts.desc, asyncFn);
        }
      : asyncFn;
    if (btnOrList) {
      return await loading.withButtonLoading(btnOrList, loadingLabel, wrapped);
    }
    return await wrapped();
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

  const DEFAULT_LESSONS = [
    { lesson_id: 'bai-1', title: 'Bài 1: Chào hỏi & Làm quen', tag: 'Bài 1' },
    { lesson_id: 'bai-2', title: 'Bài 2: Học tập & Ngôn ngữ', tag: 'Bài 2' },
    { lesson_id: 'bai-3', title: 'Bài 3: Mua sắm & Đời sống', tag: 'Bài 3' },
    { lesson_id: 'bai-4', title: 'Bài 4: Đồ ăn & Nhà hàng', tag: 'Bài 4' },
    { lesson_id: 'bai-5', title: 'Bài 5: Thời gian & Lịch trình', tag: 'Bài 5' },
    { lesson_id: 'bai-6', title: 'Bài 6: Gia đình & Nghề nghiệp', tag: 'Bài 6' },
    { lesson_id: 'bai-7', title: 'Bài 7: Phương hướng & Giao thông', tag: 'Bài 7' },
    { lesson_id: 'bai-8', title: 'Bài 8: Thời tiết & Cảm xúc', tag: 'Bài 8' }
  ];

  function getLessons() {
    if (Array.isArray(state.lessons) && state.lessons.length > 0) {
      return state.lessons;
    }
    return DEFAULT_LESSONS;
  }

  function getAvailableClasses() {
    const classes = [];
    if (Array.isArray(state.classes)) {
      state.classes.forEach(function (cls) {
        const c = (cls.class_name || '').trim();
        if (c && classes.indexOf(c) === -1) {
          classes.push(c);
        }
      });
    }
    (state.students || []).forEach(function (st) {
      const c = (st.class_name || '').trim();
      if (c && classes.indexOf(c) === -1) {
        classes.push(c);
      }
    });
    (state.assignments || []).forEach(function (asg) {
      const c = (asg.class_name || '').trim();
      if (c && c !== 'all' && classes.indexOf(c) === -1) {
        classes.push(c);
      }
    });
    return classes;
  }

  function generateNextUsername() {
    let maxNum = 0;
    (state.students || []).forEach(function (st) {
      const u = (st.username || st.student_id || '').toLowerCase();
      const match = u.match(/^hs(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    let counter = Math.max(maxNum + 1, (state.students || []).length + 1);
    let candidate = 'hs' + String(counter).padStart(2, '0');
    while ((state.students || []).some(function (s) {
      return (s.username || s.student_id || '').toLowerCase() === candidate;
    })) {
      counter++;
      candidate = 'hs' + String(counter).padStart(2, '0');
    }
    return candidate;
  }

  function generateRandomPassword() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function getFilteredStudents() {
    if (!ui.selectedClass || ui.selectedClass === 'all') {
      return state.students;
    }
    return state.students.filter(function (st) {
      return (st.class_name || '').trim() === ui.selectedClass;
    });
  }

  function getFilteredAssignments(ignoreSessionFilter) {
    let list = state.assignments;
    if (ui.selectedClass && ui.selectedClass !== 'all') {
      list = list.filter(function (asg) {
        return !asg.class_name || asg.class_name === 'all' || asg.class_name.trim() === ui.selectedClass;
      });
    }
    if (!ignoreSessionFilter && ui.gradingSessionFilter && ui.gradingSessionFilter !== 'all') {
      list = list.filter(function (asg) {
        return (asg.session_tag || 'Buổi 1').trim() === ui.gradingSessionFilter;
      });
    }
    return list;
  }

  function renderSummaryStats() {
    const profilePill = document.getElementById('teacher-profile-pill');
    if (profilePill) {
      profilePill.textContent = currentUser.full_name + ' • Giáo viên';
    }

    const students = getFilteredStudents();
    const assignments = getFilteredAssignments();
    const totalExpected = students.length * assignments.length;
    let submittedOrGraded = 0;
    let gradedWithFeedback = 0;
    let missingCount = 0;

    students.forEach(function (st) {
      assignments.forEach(function (asg) {
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

    if (elStudents) {
      elStudents.textContent = ui.selectedClass === 'all'
        ? students.length + ' học sinh'
        : students.length + ' học sinh';
    }
    if (elSubmitted) elSubmitted.textContent = submittedOrGraded + '/' + totalExpected;
    if (elMissing) elMissing.textContent = String(missingCount);
    if (elGraded) elGraded.textContent = String(gradedWithFeedback);
  }

  function renderSessionManager() {
    const picker = document.getElementById('manage-session-picker');
    const checklist = document.getElementById('session-subtasks-checklist');
    const targetClassSelect = document.getElementById('assign-selected-target-class');
    const newAsgClassSelect = document.getElementById('new-asg-class');
    const hiddenSessionInput = document.getElementById('new-asg-session');

    // 1. Gather all unique sessions
    const sessions = [];
    (state.assignments || []).forEach(function (a) {
      const s = (a.session_tag || 'Buổi 1').trim();
      if (s && sessions.indexOf(s) === -1) sessions.push(s);
    });
    if (sessions.indexOf(ui.manageSelectedSession) === -1 && sessions.length > 0) {
      ui.manageSelectedSession = sessions[0];
    }
    if (hiddenSessionInput) {
      hiddenSessionInput.value = ui.manageSelectedSession;
    }

    if (picker) {
      picker.innerHTML = sessions.map(function (s) {
        const count = state.assignments.filter(function (a) { return (a.session_tag || 'Buổi 1').trim() === s; }).length;
        const sel = s === ui.manageSelectedSession ? ' selected' : '';
        return '<option value="' + escapeHtml(s) + '"' + sel + '>' + escapeHtml(s) + ' (' + count + ' bài)</option>';
      }).join('');
    }

    // 2. Render subtasks in selected session
    const subtasks = (state.assignments || []).filter(function (a) {
      return (a.session_tag || 'Buổi 1').trim() === ui.manageSelectedSession;
    });

    if (checklist) {
      if (subtasks.length === 0) {
        checklist.innerHTML = '<div style="padding:14px;text-align:center;color:var(--color-muted-foreground);font-size:0.875rem;">Buổi học này chưa có bài tập nhỏ nào. Hãy nhập ở form bên dưới để tạo bài tập!</div>';
      } else {
        checklist.innerHTML = subtasks.map(function (asg) {
          const clsLabel = asg.class_name === 'all'
            ? 'Tất cả các lớp'
            : (asg.class_name || 'Chưa giao');
          return (
            '<div class="asg-check-item">' +
              '<div class="asg-check-left">' +
                '<input type="checkbox" class="asg-subtask-check" data-asg-id="' + escapeHtml(asg.assignment_id) + '" checked>' +
                '<div class="asg-check-info">' +
                  '<div class="asg-check-title">' +
                    '<span style="color:var(--color-primary);">' + escapeHtml(asg.lesson_tag || 'Bài') + ':</span> ' +
                    escapeHtml(asg.title) +
                  '</div>' +
                  '<div class="asg-check-meta">' +
                    '<span class="status-badge" style="background:var(--color-primary-light);color:var(--color-primary-deep);font-weight:700;">' + escapeHtml(clsLabel) + '</span>' +
                    '<span class="tabular-nums">Hạn: ' + escapeHtml(asg.due_date || 'Chưa đặt') + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<button type="button" class="btn-danger-outline btn-sm" data-delete-asg-item="' + escapeHtml(asg.assignment_id) + '" title="Xóa bài tập này">' +
                'Xóa' +
              '</button>' +
            '</div>'
          );
        }).join('');

        checklist.querySelectorAll('[data-delete-asg-item]').forEach(function (btn) {
          btn.addEventListener('click', async function () {
            const asgId = btn.getAttribute('data-delete-asg-item');
            const targetAsg = state.assignments.find(function (a) { return a.assignment_id === asgId; });
            const title = targetAsg ? targetAsg.title : asgId;
            if (!confirm('Bạn có chắc chắn muốn xóa bài tập "' + title + '" không?')) return;
            await runWithLoading(btn, 'Đang xóa...', async function () {
              await window.StudySnapStore.deleteAssignment(state, asgId);
            });
            showToast('Đã xóa bài tập!');
            renderAll();
          });
        });
      }
    }

    // 3. Populate class selects
    const availableClasses = (state.classes || []).map(function (c) { return c.class_name; });
    const classOpts = ['<option value="all">Tất cả các lớp học</option>']
      .concat(availableClasses.map(function (cls) {
        return '<option value="' + escapeHtml(cls) + '">' + escapeHtml(cls) + '</option>';
      })).join('');

    if (targetClassSelect) targetClassSelect.innerHTML = classOpts;
    if (newAsgClassSelect) newAsgClassSelect.innerHTML = classOpts;
  }

  function renderGradingPanel() {
    const classFilter = document.getElementById('teacher-class-filter');
    const classBadge = document.getElementById('teacher-class-count-badge');
    const availableClasses = getAvailableClasses();
    const filteredStudents = getFilteredStudents();
    const filteredAssignments = getFilteredAssignments();

    if (classFilter) {
      const optionsHtml = ['<option value="all">Tất cả lớp học (' + state.students.length + ' học sinh)</option>'];
      availableClasses.forEach(function (cls) {
        const countInClass = state.students.filter(function (s) { return (s.class_name || '').trim() === cls; }).length;
        const sel = (cls === ui.selectedClass) ? ' selected' : '';
        optionsHtml.push('<option value="' + escapeHtml(cls) + '"' + sel + '>' + escapeHtml(cls) + ' (' + countInClass + ' HS)</option>');
      });
      classFilter.innerHTML = optionsHtml.join('');
      classFilter.value = ui.selectedClass;
    }

    if (classBadge) {
      if (ui.selectedClass === 'all') {
        classBadge.textContent = 'Toàn bộ ' + state.students.length + ' học sinh';
      } else {
        classBadge.textContent = ui.selectedClass + ' • ' + filteredStudents.length + ' học sinh';
      }
    }

    const sessionFilter = document.getElementById('teacher-grading-session-filter');
    if (sessionFilter) {
      const allClassAsgs = getFilteredAssignments(true);
      const sessions = [];
      allClassAsgs.forEach(function (asg) {
        const s = (asg.session_tag || 'Buổi 1').trim();
        if (s && sessions.indexOf(s) === -1) sessions.push(s);
      });
      const opts = ['<option value="all">Tất cả các buổi (' + allClassAsgs.length + ' bài)</option>'];
      sessions.forEach(function (s) {
        const countInSession = allClassAsgs.filter(function (a) { return (a.session_tag || 'Buổi 1').trim() === s; }).length;
        const sel = s === ui.gradingSessionFilter ? ' selected' : '';
        opts.push('<option value="' + escapeHtml(s) + '"' + sel + '>' + escapeHtml(s) + ' (' + countInSession + ' bài)</option>');
      });
      sessionFilter.innerHTML = opts.join('');
      sessionFilter.value = ui.gradingSessionFilter;
    }

    const newAsgClassSelect = document.getElementById('new-asg-class');
    if (newAsgClassSelect) {
      const asgClassOpts = ['<option value="all">Tất cả các lớp học</option>'];
      availableClasses.forEach(function (cls) {
        asgClassOpts.push('<option value="' + escapeHtml(cls) + '">' + escapeHtml(cls) + '</option>');
      });
      newAsgClassSelect.innerHTML = asgClassOpts.join('');
    }

    const hasStudent = filteredStudents.some(function (st) { return st.student_id === ui.gradingStudentId; });
    if (!hasStudent && filteredStudents.length > 0) {
      ui.gradingStudentId = filteredStudents[0].student_id;
    }

    const hasAsg = filteredAssignments.some(function (asg) { return asg.assignment_id === ui.gradingAssignmentId; });
    if (!hasAsg && filteredAssignments.length > 0) {
      ui.gradingAssignmentId = filteredAssignments[0].assignment_id;
    }

    const studentSelect = document.getElementById('grade-student-select');
    const assignmentSelect = document.getElementById('grade-assignment-select');

    if (studentSelect) {
      studentSelect.innerHTML = filteredStudents.length > 0
        ? filteredStudents.map(function (st) {
            const sel = st.student_id === ui.gradingStudentId ? ' selected' : '';
            return '<option value="' + escapeHtml(st.student_id) + '"' + sel + '>' +
              escapeHtml(st.full_name) + ' (' + escapeHtml(st.student_id) + ' - ' + escapeHtml(st.class_name || 'Lớp') + ')</option>';
          }).join('')
        : '<option value="">-- Lớp này chưa có học sinh --</option>';
    }

    if (assignmentSelect) {
      assignmentSelect.innerHTML = filteredAssignments.length > 0
        ? filteredAssignments.map(function (asg) {
            const sel = asg.assignment_id === ui.gradingAssignmentId ? ' selected' : '';
            return '<option value="' + escapeHtml(asg.assignment_id) + '"' + sel + '>' +
              escapeHtml('[' + (asg.session_tag || 'Buổi 1') + '] ' + asg.title) + '</option>';
          }).join('')
        : '<option value="">-- Không có bài tập nào --</option>';
    }

    const asg = findAssignment(ui.gradingAssignmentId) || filteredAssignments[0];
    const st = findStudent(ui.gradingStudentId) || filteredStudents[0];
    const targetBadge = document.getElementById('grading-target-badge');
    const studentMediaBox = document.getElementById('grading-student-media-box');
    const scoreInput = document.getElementById('teacher-score-input');
    const commentInput = document.getElementById('teacher-comment-input');
    const voicePreview = document.getElementById('teacher-voice-preview');
    const sessionHint = document.getElementById('grade-assignment-session-hint');

    if (sessionHint) {
      sessionHint.textContent = asg ? ('Thuộc: ' + (asg.session_tag || 'Buổi 1') + ' • Hạn nộp: ' + asg.due_date) : '';
    }

    if (!asg || !st) {
      if (targetBadge) targetBadge.textContent = 'Chưa có dữ liệu cho lựa chọn này';
      if (studentMediaBox) {
        studentMediaBox.innerHTML =
          '<div class="assignment-brief-box">' +
            '<span class="status-badge status-missing">' + ICONS.alert + '<span>Lớp này chưa có học sinh hoặc bài tập nào. Hãy chọn lớp khác hoặc tạo tài khoản/bài tập mới.</span></span>' +
          '</div>';
      }
      if (scoreInput) scoreInput.value = '';
      if (commentInput) commentInput.value = '';
      if (voicePreview) voicePreview.innerHTML = '';
      return;
    }

    ui.gradingAssignmentId = asg.assignment_id;
    ui.gradingStudentId = st.student_id;

    const sub = findSubmission(asg.assignment_id, st.student_id);

    if (targetBadge) {
      targetBadge.textContent = st.full_name + ' (' + (st.class_name || 'Lớp') + ') • ' + asg.lesson_tag;
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

    const filteredAssignments = getFilteredAssignments();
    const studentsInClass = getFilteredStudents();

    thead.innerHTML =
      '<tr>' +
        '<th>Học sinh</th>' +
        filteredAssignments.map(function (asg) {
          return '<th>' +
            '<div style="font-size:0.75rem;font-weight:700;color:var(--color-primary);">' + escapeHtml(asg.session_tag || 'Buổi 1') + '</div>' +
            '<div>' + escapeHtml(asg.lesson_tag) + ': ' + escapeHtml(asg.title.replace(/^Bài \d+:\s*/i, '')) + '</div>' +
            '<div class="tabular-nums" style="font-size:0.8125rem;font-weight:500;color:var(--color-muted-foreground);margin-top:2px;">Hạn nộp: ' + escapeHtml(asg.due_date) + '</div>' +
          '</th>';
        }).join('') +
        '<th>Tổng kết tiến độ</th>' +
      '</tr>';

    if (studentsInClass.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="' + (filteredAssignments.length + 2) + '" style="text-align:center;padding:28px;color:var(--color-muted-foreground);">' +
          'Không có học sinh nào trong lựa chọn này. Hãy chọn lớp khác hoặc bấm <strong>"Tạo tài khoản học sinh mới"</strong>.' +
        '</td></tr>';
      return;
    }

    const filteredStudents = studentsInClass.filter(function (st) {
      if (ui.matrixFilter === 'all') return true;
      const statuses = filteredAssignments.map(function (asg) {
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

      const assignmentCells = filteredAssignments.map(function (asg) {
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

      const progressRatio = completedCount + '/' + filteredAssignments.length;
      const allDone = filteredAssignments.length > 0 && completedCount === filteredAssignments.length;

      return '<tr>' +
        '<td>' +
          '<div class="student-cell-info">' +
            '<span class="student-avatar">' + escapeHtml(st.avatar_initials) + '</span>' +
            '<div>' +
              '<div style="font-weight:700;color:var(--color-foreground);">' + escapeHtml(st.full_name) + '</div>' +
              '<div class="tabular-nums" style="font-size:0.8125rem;color:var(--color-muted-foreground);">' +
                escapeHtml(st.class_name || 'Lớp') + ' • TK: ' + escapeHtml(st.username || st.student_id.toLowerCase()) +
              '</div>' +
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
   * TAB 2: QUẢN LÝ LỚP HỌC & TÀI KHOẢN HỌC SINH
   */
  function renderClassesManager() {
    const badge = document.getElementById('classes-count-badge');
    const grid = document.getElementById('classes-list-grid');
    if (!Array.isArray(state.classes)) {
      state.classes = [];
    }

    if (badge) {
      badge.textContent = state.classes.length + ' lớp học';
    }

    if (!grid) return;

    if (state.classes.length === 0) {
      grid.innerHTML =
        '<div style="grid-column: 1 / -1; padding: 18px; text-align: center; color: var(--color-muted-foreground); background: var(--color-surface); border: 1px dashed var(--color-border-soft); border-radius: var(--radius-lg);">' +
          'Chưa có lớp học nào. Hãy nhập tên lớp học ở trên để tạo lớp đầu tiên!' +
        '</div>';
      return;
    }

    grid.innerHTML = state.classes.map(function (cls) {
      const studentCount = (state.students || []).filter(function (s) {
        return (s.class_name || '').trim().toLowerCase() === cls.class_name.trim().toLowerCase();
      }).length;
      const asgCount = (state.assignments || []).filter(function (a) {
        return (a.class_name || '').trim().toLowerCase() === cls.class_name.trim().toLowerCase();
      }).length;

      return (
        '<div class="class-manage-card">' +
          '<div>' +
            '<div style="font-weight: 800; font-size: 0.9375rem; color: var(--color-primary-deep); display: flex; align-items: center; gap: 6px;">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg>' +
              '<span>' + escapeHtml(cls.class_name) + '</span>' +
            '</div>' +
            '<div style="font-size: 0.8125rem; color: var(--color-muted-foreground); margin-top: 4px;">' +
              '<strong style="color: var(--color-primary);">' + studentCount + '</strong> học sinh • <strong style="color: var(--color-accent);">' + asgCount + '</strong> bài tập' +
            '</div>' +
          '</div>' +
          '<div style="display: flex; align-items: center; gap: 6px;">' +
            '<button type="button" class="btn btn-outline btn-sm" data-filter-class-students="' + escapeHtml(cls.class_name) + '" title="Lọc danh sách học sinh theo lớp này">' +
              '<span>Xem HS</span>' +
            '</button>' +
            '<button type="button" class="btn btn-outline btn-sm" data-delete-class-name="' + escapeHtml(cls.class_name) + '" style="color: var(--color-destructive); border-color: var(--color-destructive); padding: 4px 8px;" title="Xóa lớp này">' +
              '<span>✕</span>' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderStudentAccountsTab() {
    renderClassesManager();

    const availableClasses = getAvailableClasses();

    // 1. Điền danh sách lớp vào dropdown chọn lớp khi tạo học sinh
    const newStudentClassSelect = document.getElementById('new-student-class');
    if (newStudentClassSelect) {
      if (availableClasses.length > 0) {
        newStudentClassSelect.innerHTML = availableClasses.map(function (c) {
          return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
        }).join('');
      } else {
        newStudentClassSelect.innerHTML = '<option value="">-- Chưa có lớp học (Hãy tạo ở trên) --</option>';
      }
    }

    // 2. Điền bộ lọc lớp học cho danh sách học sinh
    const classFilterSelect = document.getElementById('student-accounts-class-filter');
    if (classFilterSelect) {
      const opts = ['<option value="all">Tất cả lớp học (' + state.students.length + ' HS)</option>'];
      availableClasses.forEach(function (c) {
        const count = state.students.filter(function (s) { return (s.class_name || '').trim().toLowerCase() === c.toLowerCase(); }).length;
        const sel = (c === ui.studentAccountsClassFilter) ? ' selected' : '';
        opts.push('<option value="' + escapeHtml(c) + '"' + sel + '>' + escapeHtml(c) + ' (' + count + ' HS)</option>');
      });
      classFilterSelect.innerHTML = opts.join('');
      classFilterSelect.value = ui.studentAccountsClassFilter || 'all';
    }

    // 3. Tự động điền Tên đăng nhập & Mật khẩu tiếp theo
    const usernameInput = document.getElementById('new-student-username');
    if (usernameInput && (!usernameInput.value || /^hs\d+$/i.test(usernameInput.value.trim()))) {
      usernameInput.value = generateNextUsername();
    }
    const passwordInput = document.getElementById('new-student-password');
    if (passwordInput && (!passwordInput.value || passwordInput.value === '123456')) {
      passwordInput.value = generateRandomPassword();
    }

    // 4. Lọc học sinh theo ui.studentAccountsClassFilter
    const filteredStudents = state.students.filter(function (st) {
      if (!ui.studentAccountsClassFilter || ui.studentAccountsClassFilter === 'all') return true;
      return (st.class_name || '').trim().toLowerCase() === ui.studentAccountsClassFilter.toLowerCase();
    });

    const countBadge = document.getElementById('student-accounts-count-badge');
    if (countBadge) {
      countBadge.textContent = filteredStudents.length + ' học sinh';
    }

    const listEl = document.getElementById('student-accounts-list');
    if (!listEl) return;

    if (filteredStudents.length === 0) {
      listEl.innerHTML =
        '<div class="quick-account-row" style="color:var(--color-muted-foreground);">' +
          'Chưa có học sinh nào trong lựa chọn này. Hãy chọn lớp khác hoặc nhập Họ tên để thêm học sinh mới.' +
        '</div>';
      return;
    }

    listEl.innerHTML = filteredStudents.map(function (st) {
      const uname = st.username || st.student_id.toLowerCase();
      const pwd = st.password || '123456';
      return '<div class="quick-account-row">' +
        '<div class="student-cell-info">' +
          '<span class="student-avatar">' + escapeHtml(st.avatar_initials) + '</span>' +
          '<div>' +
            '<div style="font-weight:700;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
              '<span>' + escapeHtml(st.full_name) + ' (' + escapeHtml(st.student_id) + ')</span>' +
              '<span class="status-badge status-submitted" style="font-size:0.75rem;">' + escapeHtml(st.class_name || 'Chưa xếp lớp') + '</span>' +
            '</div>' +
            '<div class="tabular-nums" style="font-size:0.8125rem;color:var(--color-muted-foreground);margin-top:2px;">' +
              'Tên đăng nhập: <strong>' + escapeHtml(uname) + '</strong> • Mật khẩu: <strong>' + escapeHtml(pwd) + '</strong>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-outline btn-sm" data-change-student-class="' + escapeHtml(st.student_id) + '" title="Chuyển lớp cho học sinh này">' +
            '<span>Đổi lớp</span>' +
          '</button>' +
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
      if (ui.selectedLesson === 'all') return true;
      return v.lesson_id === ui.selectedLesson;
    });

    if (badge) {
      badge.textContent = filtered.length + ' từ vựng';
    }

    if (filtered.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-muted-foreground);">' +
          'Chưa có từ vựng nào trong bài học này. Hãy nhập từ vựng mới ở biểu mẫu phía trên.' +
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
    const lessons = getLessons();
    const newVocabLessonSelect = document.getElementById('new-vocab-lesson');
    if (newVocabLessonSelect) {
      newVocabLessonSelect.innerHTML = lessons.map(function (ls) {
        return '<option value="' + escapeHtml(ls.lesson_id) + '">' + escapeHtml(ls.title) + '</option>';
      }).join('');
    }

    const vocabTotalBadge = document.getElementById('vocab-total-badge');
    const totalCount = (window.StudySnapVocabList && window.StudySnapVocabList.length) || (state.vocabulary ? state.vocabulary.length : 272);
    if (vocabTotalBadge) {
      vocabTotalBadge.textContent = totalCount + ' từ vựng';
    }

    if (window.StudySnapVocabSuite && typeof window.StudySnapVocabSuite.render === 'function') {
      window.StudySnapVocabSuite.render();
    }
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
  // TAB 4: QUẢN LÝ BÀI TẬP LUYỆN TẬP CUỐI BÀI (FORM BUILDER)
  // =========================================================================
  function getActivePracticeExercise() {
    if (!Array.isArray(state.practiceExercises) || state.practiceExercises.length === 0) {
      ui.selectedPracticeExId = null;
      return null;
    }

    const found = state.practiceExercises.find(function (e) {
      return e.exercise_id === ui.selectedPracticeExId;
    });
    if (found) return found;

    ui.selectedPracticeExId = state.practiceExercises[0].exercise_id;
    return state.practiceExercises[0];
  }

  function createFreshPracticeExercise(title, tag, withTemplate) {
    const titleInp = document.getElementById('ex-meta-title');
    const tagInp = document.getElementById('ex-meta-tag');
    const resolvedTitle =
      (title && String(title).trim()) ||
      (titleInp && titleInp.value.trim()) ||
      (withTemplate ? 'Bài tập luyện tập cuối bài — HSK 1: Bài 1' : 'Bài luyện tập cuối buổi — Bài 1');
    const resolvedTag =
      (tag && String(tag).trim()) || (tagInp && tagInp.value.trim()) || 'Bài 1';

    const newEx = withTemplate
      ? createTemplateExercise(resolvedTitle, resolvedTag)
      : {
          exercise_id: 'EX_' + Date.now(),
          title: resolvedTitle,
          lesson_tag: resolvedTag,
          total_score: 0,
          thresholds: { good: 1, very_good: 1 },
          sections: []
        };

    if (!Array.isArray(state.practiceExercises)) state.practiceExercises = [];
    state.practiceExercises.push(newEx);
    ui.selectedPracticeExId = newEx.exercise_id;
    return newEx;
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
        title: 'Phần ' + sectionNum + ': Nối từ',
        description: 'Nối chữ Hán và phiên âm pinyin ở cột trái với nghĩa tiếng Việt tương ứng ở cột phải.',
        max_score: 2,
        data: {
          left: [
            { id: 1, hanzi: '', pinyin: '' },
            { id: 2, hanzi: '', pinyin: '' }
          ],
          right: [
            { id: 'A', text: '' },
            { id: 'B', text: '' }
          ],
          answer: { '1': 'A', '2': 'B' }
        }
      };
    } else if (type === 'multiple_choice') {
      return {
        section_id: 'sec_mc_' + timeId,
        section_num: sectionNum,
        type: 'multiple_choice',
        title: 'Phần ' + sectionNum + ': Trắc nghiệm',
        description: 'Chọn đáp án chính xác nhất cho từng câu hỏi.',
        max_score: 1,
        data: {
          items: [
            {
              id: 'MC_' + timeId,
              prompt: '',
              speakWord: '',
              options: ['', '', '', ''],
              correctIndex: 0,
              explanation: ''
            }
          ]
        }
      };
    } else if (type === 'fill_blank_wordbank') {
      return {
        section_id: 'sec_fill_' + timeId,
        section_num: sectionNum,
        type: 'fill_blank_wordbank',
        title: 'Phần ' + sectionNum + ': Điền từ có ngân hàng từ',
        description: 'Chọn từ trong ngân hàng từ để điền vào chỗ trống "____".',
        max_score: 1,
        data: {
          wordbank: [],
          items: [
            {
              id: 'FB_' + timeId,
              text: '',
              hint: '',
              answer: ''
            }
          ]
        }
      };
    } else if (type === 'error_correction') {
      return {
        section_id: 'sec_err_' + timeId,
        section_num: sectionNum,
        type: 'error_correction',
        title: 'Phần ' + sectionNum + ': Sửa câu sai',
        description: 'Mỗi câu có một lỗi sai ngữ pháp, viết lại câu đúng vào ô nhập.',
        max_score: 1,
        data: {
          items: [
            {
              id: 'ERR_' + timeId,
              wrong: '',
              situation: '',
              accepted: [],
              explanation: ''
            }
          ]
        }
      };
    } else if (type === 'translation') {
      return {
        section_id: 'sec_trans_' + timeId,
        section_num: sectionNum,
        type: 'translation',
        title: 'Phần ' + sectionNum + ': Dịch câu',
        description: 'Dịch câu theo đúng hướng yêu cầu (Việt → Trung hoặc Trung → Việt).',
        max_score: 1,
        data: {
          items: [
            {
              id: 'TR_' + timeId,
              direction: 'vi->zh',
              mode: 'exact',
              prompt: '',
              accepted: [],
              grading_note: '',
              explanation: ''
            }
          ]
        }
      };
    } else if (type === 'listening_mc') {
      return {
        section_id: 'sec_listen_' + timeId,
        section_num: sectionNum,
        type: 'listening_mc',
        title: 'Phần ' + sectionNum + ': Nghe hiểu',
        description: 'Nghe đoạn hội thoại và chọn đáp án chính xác nhất cho từng câu hỏi.',
        max_score: 2,
        data: {
          context_label: 'Bài nghe',
          context_title: '',
          context_subtitle: 'Nghe đoạn hội thoại 2 lần và chọn đáp án đúng.',
          audio_label: 'Audio ' + sectionNum,
          audio_url: '',
          audio_duration: '00:45',
          audio_transcript: '',
          items: [
            {
              id: 'LS_' + timeId + '_1',
              prompt: '',
              options: ['', '', '', ''],
              correctIndex: 0,
              explanation: ''
            },
            {
              id: 'LS_' + timeId + '_2',
              prompt: '',
              options: ['', '', '', ''],
              correctIndex: 0,
              explanation: ''
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
            options: options.length > 0 ? options : ['', '', '', ''],
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
      } else if (sec.type === 'listening_mc') {
        const ctxLabel = (card.querySelector('[data-ls-label]') || {}).value || '';
        const ctxTitle = (card.querySelector('[data-ls-title]') || {}).value || '';
        const ctxSub = (card.querySelector('[data-ls-subtitle]') || {}).value || '';
        const audioLabel = (card.querySelector('[data-ls-audio-label]') || {}).value || '';
        const audioUrl = (card.querySelector('[data-ls-audio-url]') || {}).value || '';
        const transcript = (card.querySelector('[data-ls-transcript]') || {}).value || '';
        const prevDur = (sec.data && sec.data.audio_duration) || '00:45';

        const items = [];
        card.querySelectorAll('[data-ls-qcard]').forEach(function (qCard, qIdx) {
          const itemId = qCard.getAttribute('data-ls-qcard') || ('LS_' + (qIdx + 1));
          const prompt = (qCard.querySelector('[data-ls-prompt]') || {}).value || '';
          const exp = (qCard.querySelector('[data-ls-exp]') || {}).value || '';

          const options = [];
          qCard.querySelectorAll('[data-ls-opt]').forEach(function (optInp) {
            options.push(optInp.value.trim());
          });

          let correctIdx = 0;
          const checkedRadio = qCard.querySelector('input[type="radio"]:checked');
          if (checkedRadio) {
            correctIdx = parseInt(checkedRadio.value, 10) || 0;
          }
          if (options[correctIdx] === '' && options.some(function (o) { return o !== ''; })) {
            const firstNonEmpty = options.findIndex(function (o) { return o !== ''; });
            if (firstNonEmpty >= 0) correctIdx = firstNonEmpty;
          }

          items.push({
            id: itemId,
            prompt: prompt.trim(),
            options: options.length > 0 ? options : ['', '', '', ''],
            correctIndex: correctIdx,
            explanation: exp.trim()
          });
        });

        sec.data = {
          context_label: ctxLabel.trim(),
          context_title: ctxTitle.trim(),
          context_subtitle: ctxSub.trim(),
          audio_label: audioLabel.trim(),
          audio_url: audioUrl.trim(),
          audio_duration: prevDur,
          audio_transcript: transcript.trim(),
          items: items
        };
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
    const selectEl = document.getElementById('teacher-practice-select');
    const titleInput = document.getElementById('ex-meta-title');
    const tagInput = document.getElementById('ex-meta-tag');
    const threshGoodInput = document.getElementById('ex-meta-thresh-good');
    const threshVeryGoodInput = document.getElementById('ex-meta-thresh-verygood');
    const maxScoreBadge = document.getElementById('teacher-practice-maxscore-badge');
    const stickySummaryBadge = document.getElementById('gform-sticky-summary');
    const subCountPill = document.getElementById('teacher-practice-sub-count-pill');

    if (!ex) {
      if (selectEl) {
        selectEl.innerHTML = '<option value="">Chưa có bài luyện tập nào</option>';
      }
      if (titleInput && document.activeElement !== titleInput) titleInput.value = '';
      if (tagInput && document.activeElement !== tagInput) tagInput.value = 'Bài 1';
      if (threshGoodInput) threshGoodInput.value = 25;
      if (threshVeryGoodInput) threshVeryGoodInput.value = 31;
      if (maxScoreBadge) maxScoreBadge.textContent = 'Tổng 0 điểm';
      if (stickySummaryBadge) stickySummaryBadge.textContent = '0 phần • Tổng 0 điểm';
      if (subCountPill) subCountPill.textContent = '0';

      const listEl = document.getElementById('teacher-builder-sections-list');
      if (listEl) {
        listEl.innerHTML =
          '<div style="padding:36px 24px;text-align:center;background:var(--white);border:1.5px dashed var(--pink-md);border-radius:var(--radius-xl);margin:16px 0;">' +
          '<div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:16px;background:var(--pink-lt);color:var(--ink);margin-bottom:12px;">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>' +
          '</div>' +
          '<p style="margin:0 0 8px;font-size:1rem;font-weight:700;color:var(--ink);">Chưa có bài luyện tập cuối buổi nào</p>' +
          '<p style="margin:0 0 18px;font-size:0.875rem;color:var(--color-muted-foreground);">Bạn có thể tạo bài tập mới từ đầu, nhập nhanh từ file Excel, hoặc nạp bộ câu hỏi mẫu chuẩn HSK.</p>' +
          '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">' +
          '<button type="button" class="btn btn-primary" id="btn-empty-new-practice">+ Tạo bài tập mới</button>' +
          '<button type="button" class="btn btn-outline-primary" id="btn-empty-import-practice">Nhập từ Excel</button>' +
          '<button type="button" class="btn btn-ghost" id="btn-empty-fill-template">Nạp bộ câu hỏi mẫu HSK</button>' +
          '</div></div>';

        const btnEmptyNew = document.getElementById('btn-empty-new-practice');
        if (btnEmptyNew) {
          btnEmptyNew.addEventListener('click', async function () {
            const newEx = createFreshPracticeExercise(null, null, false);
            await runWithLoading(btnEmptyNew, 'Đang tạo bài...', async function () {
              await window.StudySnapStore.savePracticeExercise(state, newEx);
            });
            switchPracticeSubView('builder');
            renderTeacherPracticeTab();
            showToast('Đã tạo bài luyện tập cuối buổi mới!');
          });
        }
        const btnEmptyImport = document.getElementById('btn-empty-import-practice');
        if (btnEmptyImport) {
          btnEmptyImport.addEventListener('click', function () {
            const openModalBtn = document.getElementById('btn-open-import-practice-modal');
            if (openModalBtn) openModalBtn.click();
          });
        }
        const btnEmptyTpl = document.getElementById('btn-empty-fill-template');
        if (btnEmptyTpl) {
          btnEmptyTpl.addEventListener('click', async function () {
            const tpl = createFreshPracticeExercise(
              'Bài tập luyện tập cuối bài — HSK 1: Bài 1',
              'Bài 1',
              true
            );
            await runWithLoading(btnEmptyTpl, 'Đang nạp mẫu...', async function () {
              await window.StudySnapStore.savePracticeExercise(state, tpl);
            });
            switchPracticeSubView('builder');
            renderTeacherPracticeTab();
            showToast('Đã nạp bộ câu hỏi mẫu chuẩn HSK!');
          });
        }
      }

      const tbody = document.getElementById('teacher-practice-submissions-tbody');
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-muted-foreground);">Chưa có bài tập hoặc bài nộp nào.</td></tr>';
      }
      const subCountBadge = document.getElementById('teacher-practice-sub-count');
      if (subCountBadge) subCountBadge.textContent = '0 bài nộp';

      switchPracticeSubView(ui.practiceCurrentView || 'builder');
      return;
    }

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
    if (titleInput && document.activeElement !== titleInput) {
      titleInput.value = ex.title || '';
    }
    if (tagInput && document.activeElement !== tagInput) {
      tagInput.value = ex.lesson_tag || '';
    }
    if (threshGoodInput) threshGoodInput.value = (ex.thresholds && ex.thresholds.good) || 25;
    if (threshVeryGoodInput) threshVeryGoodInput.value = (ex.thresholds && ex.thresholds.very_good) || 31;
    if (maxScoreBadge) maxScoreBadge.textContent = 'Tổng ' + (ex.total_score || 0) + ' điểm';
    if (stickySummaryBadge) {
      stickySummaryBadge.textContent =
        (ex.sections || []).length + ' phần • Tổng ' + (ex.total_score || 0) + ' điểm';
    }

    // Update submissions pill count
    const subs = (state.practiceSubmissions || []).filter(function (s) {
      return s.exercise_id === ex.exercise_id;
    });
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
        '<div style="padding:32px 20px;text-align:center;background:var(--white);border:1.5px dashed var(--pink-md);border-radius:var(--radius-xl);margin:16px 0;">' +
        '<div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:16px;background:var(--pink-lt);color:var(--ink);margin-bottom:10px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg></div>' +
        '<p style="margin:0 0 8px;font-size:1rem;font-weight:700;color:var(--color-primary-deep);">' +
        'Bài tập này chưa có câu hỏi nào' +
        '</p>' +
        '<p style="margin:0 0 16px;font-size:0.875rem;color:var(--color-muted-foreground);">' +
        'Hãy bấm vào các nút dạng bài bên trên hoặc bấm nút dưới đây để nạp sẵn bộ câu hỏi mẫu:' +
        '</p>' +
        '<button type="button" class="btn btn-primary" id="btn-quick-fill-template">' +
        '<span>Nạp sẵn câu hỏi mẫu chuẩn HSK</span>' +
        '</button>' +
        '</div>';

      const btnFill = document.getElementById('btn-quick-fill-template');
      if (btnFill) {
        btnFill.addEventListener('click', async function () {
          const tpl = createTemplateExercise(ex.title, ex.lesson_tag);
          ex.sections = tpl.sections;
          ex.total_score = tpl.total_score;
          await runWithLoading(btnFill, 'Đang nạp mẫu...', async function () {
            await window.StudySnapStore.savePracticeExercise(state, ex);
          });
          renderTeacherPracticeTab();
          showToast('Đã nạp sẵn 5 câu hỏi mẫu vào bài tập!');
        });
      }
      return;
    }

    const typeIcons = {
      matching: 'Nối từ',
      multiple_choice: 'Trắc nghiệm',
      fill_blank_wordbank: 'Điền từ',
      error_correction: 'Sửa câu sai',
      translation: 'Dịch câu',
      listening_mc: 'Nghe hiểu'
    };

    listEl.innerHTML = ex.sections
      .map(function (sec, idx) {
        const typeLabel = typeIcons[sec.type] || ('Phần ' + (idx + 1));
        const currentScore = sec.max_score || (sec.type === 'matching' ? 10 : 5);

        return (
          '<div class="gform-section-card" data-sec-card="' +
          escapeHtml(sec.section_id) +
          '" data-sec-type="' + escapeHtml(sec.type || 'matching') + '">' +
          '<!-- Header tinh gọn chuẩn Google Forms -->' +
          '<div class="gform-section-card-header">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
          '<span style="font-weight:800;color:var(--color-primary-deep);font-size:0.9375rem;">' +
          'Phần ' + (sec.section_num || idx + 1) + ': ' + escapeHtml(typeLabel) +
          '</span>' +
          '<div class="gform-section-score-pill">' +
          '<span style="font-size:0.75rem;color:var(--color-muted-foreground);font-weight:600;">Điểm phần này:</span>' +
          '<input type="number" class="tabular-nums" data-sec-score value="' +
          currentScore +
          '" min="1" max="100" style="width:48px;font-size:0.875rem;font-weight:800;border:none;background:transparent;padding:2px;text-align:center;color:var(--ink);">' +
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
          ' title="Di chuyển lên trên">↑ Lên</button>' +
          '<button type="button" class="btn btn-outline btn-sm" data-sec-move-down="' +
          idx +
          '"' +
          (idx === ex.sections.length - 1 ? ' disabled' : '') +
          ' title="Di chuyển xuống dưới">↓ Xuống</button>' +
          '<button type="button" class="btn-danger-outline" data-sec-delete="' +
          escapeHtml(sec.section_id) +
          '" title="Xóa phần này khỏi bài tập">✕ Xóa</button>' +
          '</div>' +
          '</div>' +
          '<div class="gform-section-card-body">' +
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
            '<td style="width:50px;text-align:center;"><button type="button" class="btn-danger-outline" data-delete-matching-row="' +
            sec.section_id +
            ':' +
            l.id +
            '" title="Xóa cặp này">✕</button></td>' +
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
          const opts = item.options || ['', '', '', ''];
          const optLetters = ['A', 'B', 'C', 'D'];
          const optionsHtml = optLetters
            .map(function (letter, optIdx) {
              const rawOpt = opts[optIdx] || '';
              const isGeneric = /^Đáp án [ABCD](\s*\(Đúng\))?$/i.test(rawOpt.trim());
              const val = isGeneric ? '' : rawOpt;
              const isChecked = Number(item.correctIndex) === optIdx;
              return (
                '<div class="gform-option-row">' +
                '<label class="gform-option-radio-wrap" title="Tích chọn để đặt làm đáp án đúng">' +
                '<input type="radio" name="mc_correct_' +
                sec.section_id +
                '_' +
                item.id +
                '" value="' +
                optIdx +
                '"' +
                (isChecked ? ' checked' : '') +
                ' data-mc-radio="' +
                sec.section_id +
                ':' +
                item.id +
                ':' +
                optIdx +
                '">' +
                '<span class="gform-opt-label">' +
                '<strong class="gform-opt-letter">' +
                letter +
                '</strong>' +
                '<span class="gform-opt-badge">(Đáp án đúng)</span>' +
                '</span>' +
                '</label>' +
                '<input type="text" class="form-control" data-mc-opt="' +
                sec.section_id +
                ':' +
                item.id +
                ':' +
                optIdx +
                '" value="' +
                escapeHtml(val) +
                '" placeholder="Nhập đáp án ' +
                letter +
                '...">' +
                '</div>'
              );
            })
            .join('');

          const isGenericPrompt = /^(Điền câu hỏi|Câu hỏi trắc nghiệm)/i.test((item.prompt || '').trim());
          const promptVal = isGenericPrompt ? '' : (item.prompt || '');
          const isGenericExp = /^(Giải thích lý do|Lời giải thích)/i.test((item.explanation || '').trim());
          const expVal = isGenericExp ? '' : (item.explanation || '');

          return (
            '<div class="gform-question-card" data-mc-qcard="' +
            item.id +
            '">' +
            '<div class="gform-question-header">' +
            '<strong style="color:var(--color-primary-deep);">Câu trắc nghiệm ' +
            (idx + 1) +
            '</strong>' +
            '<button type="button" class="btn-danger-outline" data-delete-mc-q="' +
            sec.section_id +
            ':' +
            item.id +
            '">' +
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
            escapeHtml(promptVal) +
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
            '" placeholder="Ví dụ: 你好 (tùy chọn để học sinh nghe phát âm)">' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;">' +
            '<label class="form-label" style="font-size:0.8125rem;margin-bottom:0;">4 Lựa chọn đáp án (Tích chọn nút tròn trước chữ cái để đặt làm đáp án đúng):</label>' +
            optionsHtml +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Lời giải thích chi tiết (Hiển thị sau khi học sinh nộp bài):</label>' +
            '<input type="text" class="form-control" data-mc-exp="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(expVal) +
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
            '<button type="button" class="btn-danger-outline" data-delete-fb-q="' +
            sec.section_id +
            ':' +
            item.id +
            '">' +
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
            escapeHtml(item.text || '') +
            '" placeholder="Ví dụ: 李老师，____好！">' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Từ cần điền (Đáp án đúng, phải nằm trong ngân hàng từ):</label>' +
            '<input type="text" class="form-control" data-fb-ans="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml(item.answer || '') +
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
            escapeHtml((item.hint || '').trim() === 'Gợi ý nghĩa tiếng Việt...' ? '' : (item.hint || '')) +
            '" placeholder="Ví dụ: Chào cô Lý ạ! (kính trọng)">' +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      return (
        '<div>' +
        '<div style="margin-bottom:14px;padding:0 0 14px;border-bottom:1.5px solid var(--soft);">' +
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
            '<button type="button" class="btn-danger-outline" data-delete-err-q="' +
            sec.section_id +
            ':' +
            item.id +
            '">' +
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
            escapeHtml(item.wrong || '') +
            '" placeholder="Ví dụ: 大家们好！">' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Tình huống giao tiếp thực tế:</label>' +
            '<input type="text" class="form-control" data-err-sit="' +
            sec.section_id +
            ':' +
            item.id +
            '" value="' +
            escapeHtml((item.situation || '').trim() === 'Tình huống giao tiếp...' ? '' : (item.situation || '')) +
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
            escapeHtml(item.explanation || '') +
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
            '<button type="button" class="btn-danger-outline" data-delete-tr-q="' +
            sec.section_id +
            ':' +
            item.id +
            '">' +
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
    } else if (sec.type === 'listening_mc') {
      const data = sec.data || {};
      const items = data.items || [];
      const optLetters = ['A', 'B', 'C', 'D'];
      const audioUrl = (data.audio_url || '').trim();
      const transcript = (data.audio_transcript || '').trim();
      const hasPreviewAudio = Boolean(audioUrl || transcript);
      const previewPlayerHtml = hasPreviewAudio && window.StudySnapAudio
        ? '<div class="listening-audio-strip">' +
            window.StudySnapAudio.renderVoicePlayer({
              id: 'ls-builder-' + sec.section_id,
              url: audioUrl || 'demo:listening',
              duration: data.audio_duration || '00:45',
              label: (data.audio_label || 'Nghe thử') + (audioUrl ? '' : ' (Đọc theo kịch bản)'),
              fallbackText: transcript || '你好，老师！',
              lang: 'zh-CN',
              variant: 'teacher',
              showSpeedToggle: true
            }) +
          '</div>'
        : '<div style="font-size:0.8125rem;color:var(--muted);">Chưa có file âm thanh hoặc kịch bản — hãy tải file MP3, ghi âm trực tiếp hoặc nhập kịch bản tiếng Trung bên dưới.</div>';

      const questionsHtml = items
        .map(function (item, idx) {
          const opts = item.options || ['', '', '', ''];
          const optionsHtml = optLetters
            .map(function (letter, optIdx) {
              const val = opts[optIdx] || '';
              const isChecked = Number(item.correctIndex) === optIdx;
              const ph = optIdx === 3
                ? 'Nhập đáp án D (bỏ trống nếu chỉ dùng 3 đáp án A, B, C)...'
                : 'Nhập đáp án ' + letter + '...';
              return (
                '<div class="gform-option-row">' +
                '<label class="gform-option-radio-wrap" title="Tích chọn để đặt làm đáp án đúng">' +
                '<input type="radio" name="ls_correct_' +
                sec.section_id +
                '_' +
                item.id +
                '" value="' +
                optIdx +
                '"' +
                (isChecked ? ' checked' : '') +
                ' data-ls-radio="' +
                sec.section_id +
                ':' +
                item.id +
                ':' +
                optIdx +
                '">' +
                '<span class="gform-opt-label">' +
                '<strong class="gform-opt-letter">' +
                letter +
                '</strong>' +
                '<span class="gform-opt-badge">(Đáp án đúng)</span>' +
                '</span>' +
                '</label>' +
                '<input type="text" class="form-control" data-ls-opt="' +
                sec.section_id +
                ':' +
                item.id +
                ':' +
                optIdx +
                '" value="' +
                escapeHtml(val) +
                '" placeholder="' +
                ph +
                '">' +
                '</div>'
              );
            })
            .join('');

          return (
            '<div class="gform-question-card" data-ls-qcard="' +
            escapeHtml(item.id) +
            '">' +
            '<div class="gform-question-header">' +
            '<strong style="color:var(--ink);">Câu hỏi nghe ' +
            (idx + 1) +
            '</strong>' +
            '<button type="button" class="btn-danger-outline" data-delete-ls-q="' +
            escapeHtml(sec.section_id + ':' + item.id) +
            '">✕ Xóa câu này</button>' +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Câu hỏi (ví dụ: 李文回北京的路上花了多长时间？):</label>' +
            '<input type="text" class="form-control" data-ls-prompt="' +
            escapeHtml(sec.section_id + ':' + item.id) +
            '" value="' +
            escapeHtml(item.prompt || '') +
            '" placeholder="Nhập câu hỏi theo nội dung đoạn nghe...">' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;">' +
            '<label class="form-label" style="font-size:0.8125rem;margin-bottom:0;">Lựa chọn đáp án (Tích tròn đáp án đúng; có thể bỏ trống D nếu chỉ dùng A, B, C):</label>' +
            optionsHtml +
            '</div>' +
            '<div>' +
            '<label class="form-label" style="font-size:0.8125rem;">Giải thích đáp án (Hiện sau khi học sinh nộp bài):</label>' +
            '<input type="text" class="form-control" data-ls-exp="' +
            escapeHtml(sec.section_id + ':' + item.id) +
            '" value="' +
            escapeHtml(item.explanation || '') +
            '" placeholder="Ví dụ: Trong bài nghe có câu...">' +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      return (
        '<div>' +
        '<div class="listening-builder-media-box">' +
        '<div class="form-row-2">' +
        '<div>' +
        '<label class="form-label" style="font-size:0.8125rem;">Nhãn bài nghe (ví dụ: 课文 4 / Bài nghe 1):</label>' +
        '<input type="text" class="form-control" data-ls-label value="' +
        escapeHtml(data.context_label || '') +
        '" placeholder="Ví dụ: 课文 4">' +
        '</div>' +
        '<div>' +
        '<label class="form-label" style="font-size:0.8125rem;">Mã file nghe hiển thị cạnh loa (ví dụ: 1-7):</label>' +
        '<input type="text" class="form-control" data-ls-audio-label value="' +
        escapeHtml(data.audio_label || '') +
        '" placeholder="Ví dụ: 1-7 hoặc Hội thoại 1">' +
        '</div>' +
        '</div>' +
        '<div class="form-row-2">' +
        '<div>' +
        '<label class="form-label" style="font-size:0.8125rem;">Ngữ cảnh / Tiêu đề đoạn nghe:</label>' +
        '<input type="text" class="form-control" data-ls-title value="' +
        escapeHtml(data.context_title || '') +
        '" placeholder="Ví dụ: 在宾馆房间，李文在写日记。">' +
        '</div>' +
        '<div>' +
        '<label class="form-label" style="font-size:0.8125rem;">Hướng dẫn làm bài:</label>' +
        '<input type="text" class="form-control" data-ls-subtitle value="' +
        escapeHtml(data.context_subtitle || '') +
        '" placeholder="Ví dụ: Nghe đoạn hội thoại 2 lần và chọn đáp án đúng.">' +
        '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:4px;">' +
        '<label class="btn btn-outline btn-sm" style="cursor:pointer;">' +
        '<input type="file" accept="audio/*" class="file-input-hidden" data-ls-upload="' +
        escapeHtml(sec.section_id) +
        '">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>' +
        '<span>Tải file Audio (.mp3/.wav)</span>' +
        '</label>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-ls-rec-btn="' +
        escapeHtml(sec.section_id) +
        '">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>' +
        '<span>Ghi âm trực tiếp</span>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-ls-preview-tts="' +
        escapeHtml(sec.section_id) +
        '">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>' +
        '<span>Nghe thử kịch bản</span>' +
        '</button>' +
        (audioUrl
          ? '<button type="button" class="btn-danger-outline" data-ls-clear-audio="' +
            escapeHtml(sec.section_id) +
            '">Xóa file audio</button>'
          : '') +
        '</div>' +
        '<div>' +
        '<label class="form-label" style="font-size:0.8125rem;">Link file Audio (hoặc tự động điền khi tải file/ghi âm):</label>' +
        '<input type="text" class="form-control" data-ls-audio-url="' +
        escapeHtml(sec.section_id) +
        '" value="' +
        escapeHtml(audioUrl) +
        '" placeholder="Dán đường dẫn file audio hoặc bấm Tải file / Ghi âm ở trên">' +
        '</div>' +
        '<div>' +
        '<label class="form-label" style="font-size:0.8125rem;">Kịch bản đoạn nghe (Tự đọc giọng tiếng Trung nếu không gắn file MP3 &amp; hiện cho HS đối chiếu sau khi nộp):</label>' +
        '<textarea class="form-control" rows="2" data-ls-transcript="' +
        escapeHtml(sec.section_id) +
        '" placeholder="Ví dụ: 女：李文，你从家回北京的路上花了多长时间？ 男：坐火车花了十几个小时...">' +
        escapeHtml(transcript) +
        '</textarea>' +
        '</div>' +
        previewPlayerHtml +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:12px;">' +
        questionsHtml +
        '</div>' +
        '<button type="button" class="btn btn-outline btn-sm" data-add-ls-q="' +
        escapeHtml(sec.section_id) +
        '">' +
        '<span>+ Thêm câu hỏi nghe mới</span>' +
        '</button>' +
        '</div>'
      );
    }
    return '';
  }

  function bindBuilderInteractiveEvents(ex) {
    // Live Total Score Summary Sync on Section Score Change
    document.querySelectorAll('[data-sec-score]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        let sum = 0;
        document.querySelectorAll('[data-sec-score]').forEach(function (el) {
          sum += parseInt(el.value, 10) || 0;
        });
        const maxScoreBadge = document.getElementById('teacher-practice-maxscore-badge');
        const stickySummary = document.getElementById('gform-sticky-summary');
        if (maxScoreBadge) maxScoreBadge.textContent = 'Tổng ' + sum + ' điểm';
        if (stickySummary) {
          stickySummary.textContent = (ex.sections || []).length + ' phần • Tổng ' + sum + ' điểm';
        }
      });
    });

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

    // 3. Multiple Choice: Add Question / Delete Question / Radio Change
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
          options: ['', '', '', ''],
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

    document.querySelectorAll('[data-mc-radio]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        collectExerciseFromDom();
        window.StudySnapStore.savePracticeExercise(state, ex);
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
          text: '',
          hint: '',
          answer: ''
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
          wrong: '',
          situation: '',
          accepted: [],
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
          prompt: '',
          accepted: [],
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

    // 7. Listening MC: Add / Delete Question, Upload Audio, Record Mic, Preview TTS, Clear Audio
    document.querySelectorAll('[data-add-ls-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const secId = btn.getAttribute('data-add-ls-q');
        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data) return;
        if (!Array.isArray(sec.data.items)) sec.data.items = [];

        sec.data.items.push({
          id: 'LS_' + Date.now(),
          prompt: '',
          options: ['', '', '', ''],
          correctIndex: 0,
          explanation: ''
        });
        sec.max_score = sec.data.items.length;

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });

    document.querySelectorAll('[data-delete-ls-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const parts = btn.getAttribute('data-delete-ls-q').split(':');
        const secId = parts[0];
        const itemId = parts[1];

        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data || !Array.isArray(sec.data.items)) return;

        sec.data.items = sec.data.items.filter(function (it) {
          return it.id !== itemId;
        });
        sec.max_score = Math.max(1, sec.data.items.length);

        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
      });
    });

    document.querySelectorAll('[data-ls-radio]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        collectExerciseFromDom();
        window.StudySnapStore.savePracticeExercise(state, ex);
      });
    });

    document.querySelectorAll('[data-ls-upload]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        const file = inp.files && inp.files[0];
        if (!file || !window.StudySnapAudio) return;
        const secId = inp.getAttribute('data-ls-upload');
        collectExerciseFromDom();
        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data) return;

        window.StudySnapAudio.readUploadedMediaFile(file, async function (mediaInfo) {
          const gasUrl = window.StudySnapStore.getGasUrl && window.StudySnapStore.getGasUrl();
          if (!gasUrl && mediaInfo.sizeKB > 1800) {
            showToast('File âm thanh hơi lớn (' + mediaInfo.sizeKB + 'KB) so với bộ nhớ cục bộ. Nên dùng file <= 1.5MB hoặc dán đường dẫn audio!');
          }
          sec.data.audio_url = mediaInfo.dataUrl;
          sec.data.audio_duration = mediaInfo.duration || '00:45';
          if (!sec.data.audio_label) {
            sec.data.audio_label = file.name.replace(/\.[^/.]+$/, '');
          }
          await runWithLoading(
            null,
            null,
            async function () {
              await window.StudySnapStore.savePracticeExercise(state, ex);
            },
            {
              title: 'Đang lưu tệp âm thanh bài nghe...',
              desc: 'Hệ thống đang tải lên và đồng bộ tệp âm thanh cho bài tập.'
            }
          );
          renderTeacherPracticeTab();
          showToast('Đã gắn file nghe: ' + file.name);
        });
      });
    });

    document.querySelectorAll('[data-ls-rec-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!window.StudySnapAudio) return;
        const secId = btn.getAttribute('data-ls-rec-btn');
        if (btn.getAttribute('data-recording') === '1') {
          window.StudySnapAudio.stopRecording();
          btn.setAttribute('data-recording', '0');
          return;
        }

        collectExerciseFromDom();
        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data) return;

        btn.setAttribute('data-recording', '1');
        const labelSpan = btn.querySelector('span');
        window.StudySnapAudio.startRecording(
          function (timeStr) {
            if (labelSpan) labelSpan.textContent = 'Đang thu ' + timeStr + ' (Bấm dừng)';
          },
          async function (recInfo) {
            btn.setAttribute('data-recording', '0');
            if (labelSpan) labelSpan.textContent = 'Ghi âm trực tiếp';
            sec.data.audio_url = recInfo.dataUrl;
            sec.data.audio_duration = recInfo.duration || '00:30';
            await runWithLoading(
              btn,
              'Đang lưu bản thu...',
              async function () {
                await window.StudySnapStore.savePracticeExercise(state, ex);
              },
              {
                title: 'Đang lưu bản thu âm bài nghe...',
                desc: 'Hệ thống đang đồng bộ bản ghi âm lên máy chủ.'
              }
            );
            renderTeacherPracticeTab();
            showToast('Đã ghi âm đoạn nghe (' + recInfo.duration + ')!');
          },
          function (errMsg) {
            btn.setAttribute('data-recording', '0');
            if (labelSpan) labelSpan.textContent = 'Ghi âm trực tiếp';
            showToast(errMsg || 'Không thể mở micro để ghi âm.');
          }
        );
      });
    });

    document.querySelectorAll('[data-ls-preview-tts]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!window.StudySnapAudio) return;
        const secId = btn.getAttribute('data-ls-preview-tts');
        const card = document.querySelector('[data-sec-card="' + secId + '"]');
        const trInput = card && card.querySelector('[data-ls-transcript="' + secId + '"]');
        const text = trInput ? trInput.value.trim() : '';
        if (!text) {
          showToast('Hãy nhập kịch bản tiếng Trung trước để nghe thử giọng đọc!');
          return;
        }
        window.StudySnapAudio.speakText(text, 'zh-CN');
      });
    });

    document.querySelectorAll('[data-ls-clear-audio]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        collectExerciseFromDom();
        const secId = btn.getAttribute('data-ls-clear-audio');
        const sec = (ex.sections || []).find(function (s) {
          return s.section_id === secId;
        });
        if (!sec || !sec.data) return;
        sec.data.audio_url = '';
        window.StudySnapStore.savePracticeExercise(state, ex);
        renderTeacherPracticeTab();
        showToast('Đã gỡ file âm thanh.');
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

  async function handleJsonImport() {
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

      const submitBtn = document.getElementById('btn-submit-json-import');
      await runWithLoading(submitBtn, 'Đang nhập đề...', async function () {
        await window.StudySnapStore.savePracticeExercise(state, parsed);
      });
      ui.selectedPracticeExId = parsed.exercise_id;
      renderTeacherPracticeTab();

      const modal = document.getElementById('modal-json-import');
      if (modal) modal.classList.remove('is-visible');
      showToast('Đã nhập bài tập "' + parsed.title + '" từ JSON thành công!');
    } catch (err) {
      alert('Lỗi cú pháp JSON: ' + err.message);
    }
  }

  async function handleExcelPaste() {
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

    const submitExcelBtn = document.getElementById('btn-submit-excel-paste');
    await runWithLoading(submitExcelBtn, 'Đang lưu dữ liệu...', async function () {
      await window.StudySnapStore.savePracticeExercise(state, ex);
    });
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
      formCreateEx.addEventListener('submit', async function (e) {
        e.preventDefault();
        const titleInp = document.getElementById('new-ex-title');
        const tagInp = document.getElementById('new-ex-tag');
        const submitBtn = formCreateEx.querySelector('button[type="submit"]');

        const nextNum = (state.practiceExercises || []).length + 1;
        const title = (titleInp ? titleInp.value : '').trim() || ('Bài ' + nextNum);
        const tag = (tagInp ? tagInp.value : '').trim() || ('Bài ' + nextNum);

        const newEx = {
          exercise_id: 'EX_' + Date.now(),
          title: title,
          lesson_tag: tag,
          total_score: 0,
          thresholds: { very_good: 31, good: 25 },
          sections: []
        };

        if (!Array.isArray(state.practiceExercises)) {
          state.practiceExercises = [];
        }
        await runWithLoading(submitBtn, 'Đang tạo bài tập...', async function () {
          await window.StudySnapStore.savePracticeExercise(state, newEx);
        });
        ui.selectedPracticeExId = newEx.exercise_id;
        ui.practiceCurrentView = 'builder';
        modalCreateEx.classList.remove('is-open', 'is-visible');
        renderTeacherPracticeTab();
        showToast('Đã tạo bài tập mới: ' + title);
      });
    }

    // Title & Tag live-sync to active exercise and dropdown
    const metaTitleInput = document.getElementById('ex-meta-title');
    const metaTagInput = document.getElementById('ex-meta-tag');
    function syncMetaInputsToActiveEx() {
      const ex = getActivePracticeExercise();
      if (!ex) return;
      if (metaTitleInput && metaTitleInput.value.trim()) {
        ex.title = metaTitleInput.value.trim();
      }
      if (metaTagInput && metaTagInput.value.trim()) {
        ex.lesson_tag = metaTagInput.value.trim();
      }
      window.StudySnapStore.savePracticeExercise(state, ex);
      const sel = document.getElementById('teacher-practice-select');
      if (sel) {
        const opt = sel.querySelector('option[value="' + ex.exercise_id + '"]');
        if (opt) {
          opt.textContent = (ex.lesson_tag ? '[' + ex.lesson_tag + '] ' : '') + ex.title + ' (' + (ex.total_score || 0) + 'đ)';
        }
      }
    }
    if (metaTitleInput) {
      metaTitleInput.addEventListener('input', syncMetaInputsToActiveEx);
    }
    if (metaTagInput) {
      metaTagInput.addEventListener('input', syncMetaInputsToActiveEx);
    }

    // Top Bar & Sticky Bar Save Button Triggers
    function triggerPracticeExerciseFormSubmit() {
      const form = document.getElementById('teacher-exercise-meta-form');
      if (form) {
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
    }

    const btnSaveTop = document.getElementById('btn-save-top-bar');
    if (btnSaveTop) {
      btnSaveTop.addEventListener('click', triggerPracticeExerciseFormSubmit);
    }

    const btnSaveSticky = document.getElementById('btn-save-sticky-bar');
    if (btnSaveSticky) {
      btnSaveSticky.addEventListener('click', triggerPracticeExerciseFormSubmit);
    }

    // 4. Quick Add Section Buttons (matching, multiple_choice, fill_blank_wordbank, error_correction, translation)
    document.querySelectorAll('[data-quick-add-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const ex = getActivePracticeExercise() || createFreshPracticeExercise(null, null, false);
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
      metaForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const ex = getActivePracticeExercise() || createFreshPracticeExercise(null, null, false);

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

        const saveBtns = [
          document.getElementById('btn-save-top-bar'),
          document.getElementById('btn-save-sticky-bar')
        ].filter(Boolean);
        await runWithLoading(saveBtns, 'Đang lưu đề...', async function () {
          await window.StudySnapStore.savePracticeExercise(state, ex);
        });
        renderTeacherPracticeTab();
        showToast('Đã lưu bài tập "' + ex.title + '" thành công!');
      });
    }

    // 6. Delete Current Exercise Button
    const btnDeleteEx = document.getElementById('btn-delete-current-ex');
    if (btnDeleteEx) {
      btnDeleteEx.addEventListener('click', async function () {
        const ex = getActivePracticeExercise();
        if (!ex) return;
        if (
          window.confirm(
            'Cô có chắc muốn xóa vĩnh viễn bài tập "' +
              ex.title +
              '" không? Toàn bộ câu hỏi và bài nộp sẽ bị xóa.'
          )
        ) {
          await runWithLoading(btnDeleteEx, 'Đang xóa...', async function () {
            await window.StudySnapStore.deletePracticeExercise(state, ex.exercise_id);
          });
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

        const submitManualBtn = manualForm.querySelector('button[type="submit"]');
        await runWithLoading(submitManualBtn, 'Đang lưu điểm...', async function () {
          await window.StudySnapStore.gradeManualTranslation(
            state,
            sub.submission_id,
            manualGrades,
            newTotal,
            newRating
          );
        });

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
    } else if (tabId === 'content') {
      renderContentAndExitLogsTab();
    } else if (tabId === 'grading') {
      renderSummaryStats();
      renderGradingPanel();
    renderSessionManager();
      renderProgressMatrix();
    } else if (tabId === 'accounts') {
      renderStudentAccountsTab();
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
          'XÁC NHẬN XÓA TOÀN BỘ DỮ LIỆU THỬ NGHIỆM?\n\n' +
          'Thao tác này sẽ xóa sạch toàn bộ dữ liệu Học sinh, Lớp học, Bài tập về nhà, Bài nộp, Từ vựng, Bài luyện tập và Lịch sử kết quả (chỉ giữ lại tài khoản Giáo viên).\n\n' +
          'Bạn có chắc chắn muốn tiếp tục?'
        );
        if (!confirmed) return;

        window.StudySnapAudio.pauseAll();
        ui.teacherDraftVoice = null;
        ui.selectedPracticeExId = null;
        ui.activeGradingSubId = null;
        ui.gradingStudentId = '';
        ui.gradingAssignmentId = '';
        await runWithLoading(
          clearAllBtn,
          'Đang xóa dữ liệu...',
          async function () {
            await window.StudySnapStore.clearAllTestData(state);
          },
          {
            title: 'Đang xóa toàn bộ dữ liệu thử nghiệm...',
            desc: 'Hệ thống đang làm sạch dữ liệu và giữ lại tài khoản Giáo viên.'
          }
        );
        renderAll();
        showToast('Đã xóa toàn bộ dữ liệu thử nghiệm! Hệ thống đã sẵn sàng cho dữ liệu lớp học thật.');
      });
    }

    const logoutBtn = document.getElementById('btn-teacher-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        window.StudySnapAuth.logout();
      });
    }

    // Bộ lọc chọn Lớp học ở Tab 2
    const classFilter = document.getElementById('teacher-class-filter');
    if (classFilter) {
      classFilter.addEventListener('change', function () {
        ui.selectedClass = classFilter.value;
        ui.teacherDraftVoice = null;
        renderSummaryStats();
        renderGradingPanel();
        renderProgressMatrix();
      });
    }

    // Bộ lọc chọn Buổi học ở Tab 2 (Buổi 1, Buổi 2...)
    const sessionFilter = document.getElementById('teacher-grading-session-filter');
    if (sessionFilter) {
      sessionFilter.addEventListener('change', function () {
        ui.gradingSessionFilter = sessionFilter.value;
        const filteredAsgs = getFilteredAssignments();
        if (filteredAsgs.length > 0 && !filteredAsgs.some(function (a) { return a.assignment_id === ui.gradingAssignmentId; })) {
          ui.gradingAssignmentId = filteredAsgs[0].assignment_id;
        }
        renderGradingPanel();
        renderProgressMatrix();
      });
    }

    // Nút Xóa bài tập về nhà
    const btnDeleteAsg = document.getElementById('btn-delete-current-asg');
    if (btnDeleteAsg) {
      btnDeleteAsg.addEventListener('click', async function () {
        const asgToDelete = findAssignment(ui.gradingAssignmentId);
        if (!asgToDelete) {
          showToast('Chưa chọn bài tập nào để xóa!');
          return;
        }
        const confirmDelete = window.confirm(
          'Bạn có chắc chắn muốn xóa bài tập "' + asgToDelete.title + '" không?\n\n' +
          'Lưu ý: Toàn bộ dữ liệu bài nộp của học sinh đối với bài tập này sẽ được gỡ bỏ khỏi hệ thống.'
        );
        if (!confirmDelete) return;

        await runWithLoading(btnDeleteAsg, 'Đang xóa...', async function () {
          await window.StudySnapStore.deleteAssignment(state, asgToDelete.assignment_id);
        });
        showToast('Đã xóa bài tập "' + asgToDelete.title + '"!');
        const remaining = getFilteredAssignments();
        ui.gradingAssignmentId = remaining[0] ? remaining[0].assignment_id : '';
        renderAll();
      });
    }

    // Bộ chọn Bài học đồng bộ ở Tab 3 (Từ vựng + Đề kiểm tra cuối buổi)
    const teacherLessonSelect = document.getElementById('teacher-lesson-select');
    if (teacherLessonSelect) {
      teacherLessonSelect.addEventListener('change', function () {
        ui.selectedLesson = teacherLessonSelect.value;
        ui.vocabFilter = teacherLessonSelect.value;
        renderContentAndExitLogsTab();
      });
    }

    // Modal Giao bài cho lớp học
    function openAssignPracticeModal(ex) {
      if (!ex) return;
      const modal = document.getElementById('modal-assign-practice');
      const titleInp = document.getElementById('assign-practice-title');
      const classSel = document.getElementById('assign-practice-class');
      const dueInp = document.getElementById('assign-practice-due');
      const noteInp = document.getElementById('assign-practice-note');
      const form = document.getElementById('form-assign-practice-to-class');

      if (titleInp) titleInp.value = (ex.lesson_tag ? '[' + ex.lesson_tag + '] ' : '') + ex.title;

      if (classSel) {
        const availableClasses = getAvailableClasses();
        const opts = ['<option value="all">Tất cả các lớp học (' + state.students.length + ' học sinh)</option>'];
        availableClasses.forEach(function (cls) {
          const countInClass = state.students.filter(function (s) { return (s.class_name || '').trim() === cls; }).length;
          const sel = (cls === ui.selectedClass && cls !== 'all') ? ' selected' : '';
          opts.push('<option value="' + escapeHtml(cls) + '"' + sel + '>' + escapeHtml(cls) + ' (' + countInClass + ' HS)</option>');
        });
        classSel.innerHTML = opts.join('');
      }

      if (dueInp && !dueInp.value) {
        const now = new Date();
        now.setDate(now.getDate() + 3);
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        dueInp.value = day + '/' + month + '/' + year;
      }

      if (noteInp && !noteInp.value) {
        noteInp.value = 'Làm bài luyện tập cuối bài cẩn thận, mục tiêu đạt từ ' + ((ex.thresholds && ex.thresholds.good) || 25) + ' điểm trở lên nhé các em!';
      }

      if (form) {
        form.setAttribute('data-target-ex-id', ex.exercise_id);
      }

      if (modal) {
        modal.classList.add('is-open', 'is-visible');
      }
    }

    function closeAssignPracticeModal() {
      const modal = document.getElementById('modal-assign-practice');
      if (modal) {
        modal.classList.remove('is-open', 'is-visible');
      }
    }

    const btnAssignPracticeTop = document.getElementById('btn-assign-practice-to-class');
    if (btnAssignPracticeTop) {
      btnAssignPracticeTop.addEventListener('click', function () {
        const ex = getActivePracticeExercise();
        if (ex) {
          openAssignPracticeModal(ex);
        } else {
          showToast('Vui lòng tạo hoặc chọn một bài tập trước khi giao cho lớp!');
        }
      });
    }

    const btnCloseAssignModal = document.getElementById('btn-close-assign-modal');
    if (btnCloseAssignModal) btnCloseAssignModal.addEventListener('click', closeAssignPracticeModal);

    const btnCancelAssignModal = document.getElementById('btn-cancel-assign-modal');
    if (btnCancelAssignModal) btnCancelAssignModal.addEventListener('click', closeAssignPracticeModal);

    const formAssignPractice = document.getElementById('form-assign-practice-to-class');
    if (formAssignPractice) {
      formAssignPractice.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const targetExId = formAssignPractice.getAttribute('data-target-ex-id');
        const ex = (state.practiceExercises || []).find(function (e) { return e.exercise_id === targetExId; }) || getActivePracticeExercise();
        if (!ex) return;

        const submitBtn = formAssignPractice.querySelector('button[type="submit"]');
        const classVal = document.getElementById('assign-practice-class').value;
        const dueVal = document.getElementById('assign-practice-due').value.trim();
        const noteVal = document.getElementById('assign-practice-note').value.trim();

        const newAsg = {
          assignment_id: 'ASG_PRAC_' + Date.now(),
          title: 'Luyện tập cuối bài: ' + ex.title.replace(/^Bài tập luyện tập cuối bài\s*—\s*/i, ''),
          lesson_tag: ex.lesson_tag || 'Bài tập',
          lesson_id: ui.selectedLesson || 'bai-1',
          due_date: dueVal || '20/11/2026',
          description: noteVal || 'Làm bài kiểm tra luyện tập cuối bài trực tiếp trên hệ thống.',
          require_media: 'practice',
          exercise_id: ex.exercise_id,
          class_name: classVal
        };

        if (!Array.isArray(state.assignments)) state.assignments = [];
        state.assignments.push(newAsg);
        ui.gradingAssignmentId = newAsg.assignment_id;
        window.StudySnapStore.saveState(state);

        await runWithLoading(submitBtn, 'Đang giao bài...', async function () {
          await window.StudySnapStore.syncPostToGas(state, {
            action: 'addAssignment',
            assignment_id: newAsg.assignment_id,
            title: newAsg.title,
            lesson_tag: newAsg.lesson_tag,
            due_date: newAsg.due_date,
            description: newAsg.description,
            class_name: newAsg.class_name,
            require_media: 'practice',
            exercise_id: newAsg.exercise_id
          });
        });

        closeAssignPracticeModal();
        renderAll();
        showToast('Đã giao bài "' + ex.title + '" cho ' + (classVal === 'all' ? 'tất cả các lớp' : classVal) + ' thành công!');
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
      teacherGradingForm.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const submitBtn = teacherGradingForm.querySelector('button[type="submit"]');
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
        const hasVoiceUpload = Boolean(draftVoice && draftVoice.dataUrl);
        ui.teacherDraftVoice = null;
        window.StudySnapStore.saveState(state);

        await runWithLoading(
          submitBtn,
          hasVoiceUpload ? 'Đang tải Voice & lưu...' : 'Đang lưu phản hồi...',
          async function () {
            await window.StudySnapStore.syncPostToGas(state, {
              action: 'saveTeacherFeedback',
              assignment_id: ui.gradingAssignmentId,
              student_id: ui.gradingStudentId,
              score: sub.score,
              teacher_comment: sub.teacher_comment,
              teacher_voice_duration: voiceDur,
              teacher_voice_base64: draftVoice ? draftVoice.dataUrl : '',
              teacher_voice_mime_type: draftVoice ? draftVoice.mimeType : ''
            });
          },
          hasVoiceUpload
            ? {
                title: 'Đang lưu nhận xét & bản thu Voice Feedback...',
                desc: 'Hệ thống đang tải tệp âm thanh chữa bài lên máy chủ.'
              }
            : null
        );

        renderAll();
        const st = findStudent(ui.gradingStudentId);
        showToast('Đã lưu nhận xét & Voice Feedback cho ' + (st ? st.full_name : '') + '!');
      });
    }

    // Giáo viên Giao BVN mới
    const createAsgForm = document.getElementById('create-assignment-form');
    if (createAsgForm) {
      createAsgForm.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const submitBtn = createAsgForm.querySelector('button[type="submit"]');
        const sessionInput = document.getElementById('new-asg-session');
        const sessionTag = sessionInput ? sessionInput.value.trim() : 'Buổi 1';
        const tag = document.getElementById('new-asg-tag').value.trim();
        const due = document.getElementById('new-asg-due').value.trim();
        const title = document.getElementById('new-asg-title').value.trim();
        const desc = document.getElementById('new-asg-desc').value.trim();
        const asgClass = document.getElementById('new-asg-class') ? document.getElementById('new-asg-class').value : 'all';
        if (!title) return;

        const newId = 'BVN_' + Date.now();
        const newAsg = {
          assignment_id: newId,
          session_tag: sessionTag || 'Buổi 1',
          title: title,
          lesson_tag: tag || ('Bài ' + (state.assignments.length + 1)),
          due_date: due || '20/11/2026',
          description: desc,
          require_media: 'audio_or_video',
          class_name: asgClass
        };

        state.assignments.push(newAsg);
        ui.gradingAssignmentId = newId;
        if (ui.gradingSessionFilter !== 'all' && ui.gradingSessionFilter !== newAsg.session_tag) {
          ui.gradingSessionFilter = newAsg.session_tag;
        }
        window.StudySnapStore.saveState(state);

        await runWithLoading(submitBtn, 'Đang giao bài tập...', async function () {
          await window.StudySnapStore.syncPostToGas(state, {
            action: 'addAssignment',
            assignment_id: newAsg.assignment_id,
            session_tag: newAsg.session_tag,
            title: newAsg.title,
            lesson_tag: newAsg.lesson_tag,
            due_date: newAsg.due_date,
            description: newAsg.description,
            class_name: newAsg.class_name
          });
        });

        createAsgForm.reset();
        renderAll();
        showToast('Đã giao bài tập mới "' + newAsg.title + '" (' + newAsg.session_tag + ')!');
      });
    }

    // Quản lý Buổi học & Giao bài theo Buổi
    const manageSessionPicker = document.getElementById('manage-session-picker');
    if (manageSessionPicker) {
      manageSessionPicker.addEventListener('change', function () {
        ui.manageSelectedSession = manageSessionPicker.value;
        renderSessionManager();
      });
    }

    const btnToggleAddSession = document.getElementById('btn-toggle-add-session');
    const quickAddSessionRow = document.getElementById('quick-add-session-row');
    if (btnToggleAddSession && quickAddSessionRow) {
      btnToggleAddSession.addEventListener('click', function () {
        quickAddSessionRow.style.display = quickAddSessionRow.style.display === 'none' ? 'block' : 'none';
      });
    }

    const btnCancelAddSession = document.getElementById('btn-cancel-add-session');
    if (btnCancelAddSession && quickAddSessionRow) {
      btnCancelAddSession.addEventListener('click', function () {
        quickAddSessionRow.style.display = 'none';
      });
    }

    const btnCreateSessionConfirm = document.getElementById('btn-create-session-confirm');
    if (btnCreateSessionConfirm) {
      btnCreateSessionConfirm.addEventListener('click', function () {
        const input = document.getElementById('new-custom-session-name');
        const val = input ? input.value.trim() : '';
        if (!val) return;
        ui.manageSelectedSession = val;
        if (quickAddSessionRow) quickAddSessionRow.style.display = 'none';
        if (input) input.value = '';
        showToast('Đã tạo và chuyển sang buổi học mới "' + val + '". Hãy nhập bài tập nhỏ để bắt đầu!');
        renderSessionManager();
      });
    }

    const btnCheckAll = document.getElementById('btn-check-all-subtasks');
    if (btnCheckAll) {
      btnCheckAll.addEventListener('click', function () {
        document.querySelectorAll('.asg-subtask-check').forEach(function (chk) { chk.checked = true; });
      });
    }

    const btnUncheckAll = document.getElementById('btn-uncheck-all-subtasks');
    if (btnUncheckAll) {
      btnUncheckAll.addEventListener('click', function () {
        document.querySelectorAll('.asg-subtask-check').forEach(function (chk) { chk.checked = false; });
      });
    }

    const btnAssignSelected = document.getElementById('btn-assign-selected-action');
    if (btnAssignSelected) {
      btnAssignSelected.addEventListener('click', async function () {
        const checkedBoxes = Array.from(document.querySelectorAll('.asg-subtask-check:checked'));
        if (checkedBoxes.length === 0) {
          alert('Vui lòng tích chọn ít nhất 1 bài tập nhỏ để giao cho lớp!');
          return;
        }
        const selectedIds = checkedBoxes.map(function (c) { return c.getAttribute('data-asg-id'); });
        const targetClassSelect = document.getElementById('assign-selected-target-class');
        const targetClass = targetClassSelect ? targetClassSelect.value : 'all';
        const classNameLabel = targetClass === 'all' ? 'Tất cả các lớp' : targetClass;

        await runWithLoading(btnAssignSelected, 'Đang giao bài...', async function () {
          await window.StudySnapStore.assignExercisesToClass(state, selectedIds, targetClass);
        });
        showToast('Đã giao thành công ' + selectedIds.length + ' bài tập nhỏ cho ' + classNameLabel + '!');
        renderAll();
      });
    }

        // Giáo viên Tạo Lớp học mới
    const createClassForm = document.getElementById('create-class-form');
    if (createClassForm) {
      createClassForm.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const nameInput = document.getElementById('new-class-name');
        const className = (nameInput ? nameInput.value : '').trim();
        if (!className) return;

        if (!Array.isArray(state.classes)) state.classes = [];

        const exists = state.classes.some(function (c) {
          return c.class_name.trim().toLowerCase() === className.toLowerCase();
        });
        if (exists) {
          showToast('Lớp học "' + className + '" đã có trong danh sách!');
          return;
        }

        const submitBtn = createClassForm.querySelector('button[type="submit"]');
        const newClass = {
          class_id: 'CLS_' + Date.now(),
          class_name: className,
          created_at: new Date().toLocaleDateString('vi-VN')
        };
        state.classes.push(newClass);
        window.StudySnapStore.saveState(state);

        await runWithLoading(submitBtn, 'Đang tạo lớp...', async function () {
          await window.StudySnapStore.syncPostToGas(state, {
            action: 'createClass',
            class_id: newClass.class_id,
            class_name: newClass.class_name
          });
        });

        if (nameInput) nameInput.value = '';
        ui.studentAccountsClassFilter = className;
        renderAll();
        showToast('Đã tạo lớp học mới: ' + className + '! Bạn có thể chọn lớp này ở dropdown bên dưới.');
      });
    }

    // Bộ lọc danh sách học sinh theo lớp
    const studentAccountsFilter = document.getElementById('student-accounts-class-filter');
    if (studentAccountsFilter) {
      studentAccountsFilter.addEventListener('change', function () {
        ui.studentAccountsClassFilter = studentAccountsFilter.value;
        renderStudentAccountsTab();
      });
    }

    // Nút đổi mã tên đăng nhập ngẫu nhiên / tiếp theo
    const btnRegenUsername = document.getElementById('btn-regen-username');
    if (btnRegenUsername) {
      btnRegenUsername.addEventListener('click', function () {
        const usernameInput = document.getElementById('new-student-username');
        if (usernameInput) {
          usernameInput.value = generateNextUsername();
          showToast('Đã sinh Tên đăng nhập mới: ' + usernameInput.value);
        }
      });
    }

    // Nút sinh mật khẩu ngẫu nhiên
    const btnRegenPassword = document.getElementById('btn-regen-password');
    if (btnRegenPassword) {
      btnRegenPassword.addEventListener('click', function () {
        const passwordInput = document.getElementById('new-student-password');
        if (passwordInput) {
          passwordInput.value = generateRandomPassword();
          showToast('Đã sinh Mật khẩu ngẫu nhiên: ' + passwordInput.value);
        }
      });
    }

    // Giáo viên Tạo tài khoản mới cho Học sinh
    const createStudentForm = document.getElementById('create-student-account-form');
    if (createStudentForm) {
      createStudentForm.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const nameInput = document.getElementById('new-student-name');
        const fullName = (nameInput ? nameInput.value : '').trim();
        const classSelect = document.getElementById('new-student-class');
        const className = (classSelect ? classSelect.value : '').trim() || 'Lớp Tiếng Trung HSK 2';
        let username = (document.getElementById('new-student-username').value || '').trim().toLowerCase();
        let password = (document.getElementById('new-student-password').value || '').trim();

        if (!fullName) return;

        const submitBtn = createStudentForm.querySelector('button[type="submit"]');
        if (!username) {
          username = generateNextUsername();
        }
        if (!password) {
          password = generateRandomPassword();
        }

        // Tự động kiểm tra trùng username, nếu trùng thì sinh mã kế tiếp
        if (state.students.some(function (s) {
          return String(s.username || s.student_id || '').toLowerCase() === username;
        })) {
          username = generateNextUsername();
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

        await runWithLoading(submitBtn, 'Đang tạo tài khoản...', async function () {
          await window.StudySnapStore.syncPostToGas(state, {
            action: 'createStudentAccount',
            student_id: newStudent.student_id,
            full_name: newStudent.full_name,
            class_name: newStudent.class_name,
            avatar_initials: newStudent.avatar_initials,
            username: newStudent.username,
            password: newStudent.password
          });
        });

        // Reset form: chỉ cần xóa tên học sinh, tự động sinh username kế tiếp và sinh mật khẩu ngẫu nhiên mới
        if (nameInput) {
          nameInput.value = '';
          nameInput.focus();
        }
        const usernameInput = document.getElementById('new-student-username');
        if (usernameInput) {
          usernameInput.value = generateNextUsername();
        }
        const passwordInput = document.getElementById('new-student-password');
        if (passwordInput) {
          passwordInput.value = generateRandomPassword();
        }

        renderAll();
        showToast('Đã thêm học sinh ' + fullName + ' vào ' + className + ' (TK: ' + username + ' / MK: ' + password + ')!');
      });
    }

        // Điều khiển khung thêm từ thủ công
    const btnToggleManualVocab = document.getElementById('btn-toggle-manual-add-vocab');
    const manualVocabBox = document.getElementById('teacher-manual-vocab-box');
    const btnCloseManualVocab = document.getElementById('btn-close-manual-add-vocab');
    const btnCancelManualVocab = document.getElementById('btn-cancel-manual-vocab');

    function toggleManualVocabBox(show) {
      if (!manualVocabBox) return;
      const willShow = (typeof show === 'boolean') ? show : (manualVocabBox.style.display === 'none' || !manualVocabBox.style.display);
      manualVocabBox.style.display = willShow ? 'block' : 'none';
    }

    if (btnToggleManualVocab) {
      btnToggleManualVocab.addEventListener('click', function () {
        toggleManualVocabBox();
      });
    }
    if (btnCloseManualVocab) {
      btnCloseManualVocab.addEventListener('click', function () {
        toggleManualVocabBox(false);
      });
    }
    if (btnCancelManualVocab) {
      btnCancelManualVocab.addEventListener('click', function () {
        toggleManualVocabBox(false);
      });
    }

    // Thêm từ vựng mới
    const addVocabForm = document.getElementById('add-vocab-form');
    if (addVocabForm) {
      addVocabForm.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const lessonSelectVal = document.getElementById('new-vocab-lesson').value;
        const wordVal = document.getElementById('new-vocab-word').value.trim();
        const ipaVal = document.getElementById('new-vocab-ipa').value.trim() || 'pinyin';
        const posVal = document.getElementById('new-vocab-pos').value.trim() || 'Danh từ';
        const meaningVal = document.getElementById('new-vocab-meaning').value.trim();
        const exampleEnVal = document.getElementById('new-vocab-example-en').value.trim();

        if (!wordVal || !meaningVal) return;

        const submitBtn = addVocabForm.querySelector('button[type="submit"]');
        const lessonObj = (state.lessons || []).find(function (l) { return l.lesson_id === lessonSelectVal; });
        const lessonTitle = lessonObj ? lessonObj.title : (lessonSelectVal || 'Bài mới');
        const newVocab = {
          vocab_id: 'V_' + Date.now(),
          lesson_id: lessonSelectVal,
          lesson_title: lessonTitle,
          word: wordVal,
          ipa: ipaVal,
          part_of_speech: posVal,
          meaning_vi: meaningVal,
          example_en: exampleEnVal || ('我每天练习"' + wordVal + '"。'),
          example_vi: meaningVal
        };

        state.vocabulary.push(newVocab);
        window.StudySnapStore.saveState(state);

        await runWithLoading(submitBtn, 'Đang lưu từ vựng...', async function () {
          await window.StudySnapStore.syncPostToGas(state, {
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

        addVocabForm.reset();
        if (Array.isArray(window.StudySnapVocabList)) {
          window.StudySnapVocabList.unshift([wordVal, ipaVal, meaningVal]);
        }
        if (manualVocabBox) manualVocabBox.style.display = 'none';
        if (window.StudySnapVocabSuite && typeof window.StudySnapVocabSuite.render === 'function') {
          window.StudySnapVocabSuite.render();
        }
        renderAll();
        showToast('Đã thêm từ vựng "' + wordVal + '" vào ' + newVocab.lesson_title + '!');
      });
    }

    // =========================================================================
    // HELPER CHUNG ĐỌC FILE EXCEL (.xlsx, .xls, .csv, .tsv) & TÁCH DÒNG
    // =========================================================================
    function splitDelimitedLine(line, delimiter) {
      if (delimiter === '\t') {
        return String(line || '').split('\t').map(function (c) {
          return c.trim();
        });
      }
      const result = [];
      let current = '';
      let inQuotes = false;
      const src = String(line || '');
      for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (ch === '"') {
          if (inQuotes && src[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result.map(function (c) {
        return c.replace(/^["']|["']$/g, '').trim();
      });
    }

    function detectTextDelimiter(rawText) {
      const sampleLines = String(rawText || '').split(/\r?\n/).slice(0, 8);
      let tabCount = 0;
      let semiCount = 0;
      let commaCount = 0;
      sampleLines.forEach(function (l) {
        tabCount += (l.match(/\t/g) || []).length;
        semiCount += (l.match(/;/g) || []).length;
        commaCount += (l.match(/,/g) || []).length;
      });
      if (tabCount > 0) return '\t';
      if (semiCount > commaCount) return ';';
      if (commaCount > 0) return ',';
      return '\t';
    }

    function parseRawTextToMatrix(rawText) {
      const clean = String(rawText || '').replace(/^\uFEFF/, '');
      if (!clean.trim()) return [];
      const delimiter = detectTextDelimiter(clean);
      return clean
        .split(/\r?\n/)
        .filter(function (l) { return l.trim().length > 0; })
        .map(function (line) {
          return splitDelimitedLine(line, delimiter);
        });
    }

    function readSpreadsheetFileAsMatrix(file, onSuccess, onError) {
      if (!file) return;
      const isBinaryExcel = /\.(xlsx|xls)$/i.test(file.name || '');
      if (isBinaryExcel) {
        if (typeof window.XLSX === 'undefined' || !window.XLSX || typeof window.XLSX.read !== 'function') {
          const msg = 'Không tải được thư viện đọc file .xlsx trực tuyến. Cô hãy lưu file sang .csv hoặc copy bảng từ Excel rồi dán trực tiếp nhé.';
          if (typeof onError === 'function') onError(msg);
          else showToast(msg);
          return;
        }
        const reader = new FileReader();
        reader.onload = function (evt) {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames && workbook.SheetNames[0];
            if (!firstSheetName) {
              if (typeof onError === 'function') onError('File Excel không có trang tính (sheet) nào.');
              return;
            }
            const sheet = workbook.Sheets[firstSheetName];
            const matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            onSuccess(
              (matrix || []).map(function (row) {
                return (row || []).map(function (cell) {
                  return cell === null || cell === undefined ? '' : String(cell).trim();
                });
              })
            );
          } catch (err) {
            const msg = 'Không đọc được file Excel: ' + (err && err.message ? err.message : 'Định dạng không hợp lệ');
            if (typeof onError === 'function') onError(msg);
            else showToast(msg);
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      const textReader = new FileReader();
      textReader.onload = function (evt) {
        onSuccess(parseRawTextToMatrix(evt.target.result));
      };
      textReader.readAsText(file, 'utf-8');
    }

    // =========================================================================
    // XỬ LÝ NHẬP TỪ VỰNG TỪ EXCEL / CSV / COPY-PASTE BẢNG
    // =========================================================================
    const modalVocabExcel = document.getElementById('modal-import-vocab-excel');
    const btnOpenVocabModal = document.getElementById('btn-open-import-vocab-modal');
    const btnCloseVocabModal = document.getElementById('btn-close-vocab-modal');
    const btnCancelVocabImport = document.getElementById('btn-cancel-vocab-import');
    const importVocabLessonSelect = document.getElementById('import-vocab-lesson-select');
    const importVocabFileInput = document.getElementById('import-vocab-file-input');
    const excelPasteText = document.getElementById('excel-paste-text');
    const excelDropZone = document.getElementById('excel-drop-zone');
    const btnPasteSample = document.getElementById('btn-paste-sample-vocab');
    const excelPreviewContainer = document.getElementById('excel-preview-container');
    const excelPreviewCount = document.getElementById('excel-preview-count');
    const excelPreviewTbody = document.getElementById('excel-preview-tbody');
    const btnConfirmVocabImport = document.getElementById('btn-confirm-vocab-import');

    let parsedImportRows = [];

    function parseVocabRows(rawText) {
      const matrix = parseRawTextToMatrix(rawText);
      const rows = [];
      matrix.forEach(function (cols, idx) {
        const joinedLower = cols.join(' ').toLowerCase();
        // Bỏ qua dòng tiêu đề nếu có
        if (idx === 0) {
          if (
            joinedLower.indexOf('chữ hán') >= 0 ||
            joinedLower.indexOf('pinyin') >= 0 ||
            joinedLower.indexOf('phiên âm') >= 0 ||
            (joinedLower.indexOf('word') >= 0 && joinedLower.indexOf('meaning') >= 0)
          ) {
            return;
          }
        }

        if (cols.length < 2) return;
        const word = cols[0];
        if (!word) return;

        let ipa = 'pinyin';
        let pos = 'Danh từ';
        let meaning = '';
        let exampleEn = '';
        let exampleVi = '';

        if (cols.length === 2) {
          meaning = cols[1];
        } else if (cols.length === 3) {
          ipa = cols[1];
          meaning = cols[2];
        } else if (cols.length === 4) {
          ipa = cols[1];
          pos = cols[2];
          meaning = cols[3];
        } else if (cols.length === 5) {
          ipa = cols[1];
          pos = cols[2];
          meaning = cols[3];
          exampleEn = cols[4];
        } else if (cols.length >= 6) {
          ipa = cols[1];
          pos = cols[2];
          meaning = cols[3];
          exampleEn = cols[4];
          exampleVi = cols[5];
        }

        rows.push({
          word: word,
          ipa: ipa,
          part_of_speech: pos,
          meaning_vi: meaning,
          example_en: exampleEn || ('我每天练习"' + word + '"。'),
          example_vi: exampleVi || meaning
        });
      });
      return rows;
    }

    function updateImportPreview(rows) {
      parsedImportRows = rows;
      if (!excelPreviewContainer || !excelPreviewTbody || !btnConfirmVocabImport) return;
      if (rows.length === 0) {
        excelPreviewContainer.style.display = 'none';
        btnConfirmVocabImport.disabled = true;
        return;
      }
      excelPreviewContainer.style.display = 'block';
      if (excelPreviewCount) excelPreviewCount.textContent = rows.length;
      btnConfirmVocabImport.disabled = false;

      excelPreviewTbody.innerHTML = rows.map(function (r, i) {
        return (
          '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td><strong>' + escapeHtml(r.word) + '</strong></td>' +
          '<td class="tabular-nums" style="color:var(--color-primary-deep);">' + escapeHtml(r.ipa) + '</td>' +
          '<td>' + escapeHtml(r.part_of_speech) + '</td>' +
          '<td>' + escapeHtml(r.meaning_vi) + '</td>' +
          '<td style="font-size:0.75rem;color:var(--color-muted-foreground);">' + escapeHtml(r.example_en) + '</td>' +
          '</tr>'
        );
      }).join('');
    }

    if (btnOpenVocabModal) {
      btnOpenVocabModal.addEventListener('click', function () {
        if (modalVocabExcel) {
          if (importVocabLessonSelect) {
            const lessons = getLessons();
            importVocabLessonSelect.innerHTML = lessons.map(function (ls) {
              const sel = (ls.lesson_id === ui.selectedLesson && ls.lesson_id !== 'all') ? ' selected' : '';
              return '<option value="' + escapeHtml(ls.lesson_id) + '"' + sel + '>' + escapeHtml(ls.title) + '</option>';
            }).join('');
          }
          modalVocabExcel.classList.add('is-open', 'is-visible');
        }
      });
    }

    if (btnCloseVocabModal) {
      btnCloseVocabModal.addEventListener('click', function () {
        if (modalVocabExcel) modalVocabExcel.classList.remove('is-open', 'is-visible');
      });
    }

    if (btnCancelVocabImport) {
      btnCancelVocabImport.addEventListener('click', function () {
        if (modalVocabExcel) modalVocabExcel.classList.remove('is-open', 'is-visible');
      });
    }

    if (excelPasteText) {
      excelPasteText.addEventListener('input', function () {
        const rows = parseVocabRows(excelPasteText.value);
        updateImportPreview(rows);
      });
    }

    if (btnPasteSample) {
      btnPasteSample.addEventListener('click', function () {
        const sampleText =
          '图书馆\ttú shū guǎn\tDanh từ\tThư viện\t我想去图书馆看书。\n' +
          '运动\tyùn dòng\tĐộng từ\tVận động, thể thao\t我每天下午都去运动。\n' +
          '咖啡\tkā fēi\tDanh từ\tCà phê\t请给我一杯热咖啡。\n' +
          '帮助\tbāng zhù\tĐộng từ\tGiúp đỡ, tương trợ\t谢谢你的热情帮助。\n' +
          '音乐\tyīn yuè\tDanh từ\tÂm nhạc\t你喜欢听中国音乐吗？';
        if (excelPasteText) {
          excelPasteText.value = sampleText;
          const rows = parseVocabRows(sampleText);
          updateImportPreview(rows);
        }
      });
    }

    function handleVocabExcelFile(file) {
      readSpreadsheetFileAsMatrix(
        file,
        function (matrix) {
          const tsvText = matrix
            .map(function (row) {
              return row.map(function (c) { return String(c || '').replace(/[\r\n\t]+/g, ' '); }).join('\t');
            })
            .join('\n');
          if (excelPasteText) excelPasteText.value = tsvText;
          updateImportPreview(parseVocabRows(tsvText));
        },
        function (errMsg) {
          showToast(errMsg);
        }
      );
    }

    if (importVocabFileInput) {
      importVocabFileInput.addEventListener('change', function (ev) {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        handleVocabExcelFile(file);
      });
    }

    if (excelDropZone) {
      excelDropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        excelDropZone.classList.add('is-dragover');
      });
      excelDropZone.addEventListener('dragleave', function () {
        excelDropZone.classList.remove('is-dragover');
      });
      excelDropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        excelDropZone.classList.remove('is-dragover');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) {
          handleVocabExcelFile(file);
        }
      });
    }

    if (btnConfirmVocabImport) {
      btnConfirmVocabImport.addEventListener('click', async function () {
        if (!parsedImportRows || parsedImportRows.length === 0) return;
        const targetLessonId = (importVocabLessonSelect && importVocabLessonSelect.value) || 'bai-1';
        const targetLessonObj = (state.lessons || []).find(function (l) { return l.lesson_id === targetLessonId; });
        const targetLessonTitle = targetLessonObj ? targetLessonObj.title : ('Bài ' + targetLessonId);

        const newVocabs = parsedImportRows.map(function (r, idx) {
          return {
            vocab_id: 'V_' + Date.now() + '_' + idx,
            lesson_id: targetLessonId,
            lesson_title: targetLessonTitle,
            word: r.word,
            ipa: r.ipa,
            part_of_speech: r.part_of_speech,
            meaning_vi: r.meaning_vi,
            example_en: r.example_en,
            example_vi: r.example_vi
          };
        });

        await runWithLoading(
          btnConfirmVocabImport,
          'Đang nhập ' + newVocabs.length + ' từ...',
          async function () {
            await window.StudySnapStore.batchAddVocabulary(state, newVocabs);
          },
          newVocabs.length >= 15
            ? {
                title: 'Đang nhập danh sách từ vựng...',
                desc: 'Hệ thống đang lưu ' + newVocabs.length + ' từ vựng vào kho bài học.'
              }
            : null
        );
        if (Array.isArray(window.StudySnapVocabList)) {
          newVocabs.forEach(function (nv) {
            window.StudySnapVocabList.push([nv.word, nv.ipa, nv.meaning_vi]);
          });
        }
        if (window.StudySnapVocabSuite && typeof window.StudySnapVocabSuite.render === 'function') {
          window.StudySnapVocabSuite.render();
        }
        showToast('Đã nạp thành công ' + newVocabs.length + ' từ vựng vào ' + targetLessonTitle + '!');

        if (modalVocabExcel) modalVocabExcel.classList.remove('is-open', 'is-visible');
        if (excelPasteText) excelPasteText.value = '';
        if (importVocabFileInput) importVocabFileInput.value = '';
        updateImportPreview([]);
        ui.selectedLesson = targetLessonId;
        renderAll();
      });
    }

    // =========================================================================
    // XỬ LÝ NHẬP ĐỀ LUYỆN TẬP CUỐI BUỔI TỪ EXCEL & XEM FILE TEMPLATE (TAB 1)
    // =========================================================================
    const modalPracticeExcel = document.getElementById('modal-import-practice-excel');
    const btnOpenPracticeImport = document.getElementById('btn-open-import-practice-modal');
    const btnOpenPracticeImportSticky = document.getElementById('btn-open-import-practice-sticky');
    const btnClosePracticeImport = document.getElementById('btn-close-practice-import');
    const btnCancelPracticeImport = document.getElementById('btn-cancel-practice-import');
    const practiceImportModeSel = document.getElementById('import-practice-mode');
    const practiceNewMetaBox = document.getElementById('import-practice-new-meta');
    const practiceNewTitleInput = document.getElementById('import-practice-new-title');
    const practiceNewTagInput = document.getElementById('import-practice-new-tag');
    const practiceFileInput = document.getElementById('import-practice-file-input');
    const practiceDropZone = document.getElementById('practice-excel-drop-zone');
    const practicePasteTextarea = document.getElementById('practice-excel-paste');
    const practicePreviewBox = document.getElementById('practice-excel-preview');
    const practicePreviewTbody = document.getElementById('practice-excel-preview-tbody');
    const practiceSecCountEl = document.getElementById('practice-import-sec-count');
    const practiceQCountEl = document.getElementById('practice-import-q-count');
    const practiceScoreCountEl = document.getElementById('practice-import-score-count');
    const practiceWarningsBox = document.getElementById('practice-import-warnings');
    const btnConfirmPracticeImport = document.getElementById('btn-confirm-practice-import');
    const btnDownloadPracticeTpl = document.getElementById('btn-download-practice-template');
    const btnFillPracticeSample = document.getElementById('btn-fill-practice-sample');
    const btnJumpTemplateView = document.getElementById('btn-jump-to-template-view');
    const btnUseTemplateInImport = document.getElementById('btn-use-template-in-import');
    const tplSheetThead = document.getElementById('practice-template-sheet-thead');
    const tplSheetTbody = document.getElementById('practice-template-sheet-tbody');

    const PRACTICE_TEMPLATE_HEADERS = [
      'Dạng bài',
      'Tên phần',
      'Câu hỏi / Đề bài',
      'Pinyin / Ngữ cảnh / Gợi ý',
      'Đáp án A',
      'Đáp án B',
      'Đáp án C',
      'Đáp án D',
      'Đáp án đúng',
      'Giải thích / Ghi chú',
      'Link Audio (Nghe)'
    ];

    const PRACTICE_TEMPLATE_ROWS = [
      ['Nối từ', 'Phần 1: Nối từ', '你好', 'nǐ hǎo', '', '', '', '', 'Xin chào', '', ''],
      ['Nối từ', 'Phần 1: Nối từ', '谢谢', 'xièxie', '', '', '', '', 'Cảm ơn', '', ''],
      ['Nối từ', 'Phần 1: Nối từ', '再见', 'zàijiàn', '', '', '', '', 'Tạm biệt', '', ''],
      ['Trắc nghiệm', 'Phần 2: Trắc nghiệm', 'Khi gặp cô giáo, câu chào nào trang trọng nhất?', '您', '老师，您好！', '老师，早！', '再见！', '没关系！', 'A', 'Dùng kính ngữ 您 (nín) với thầy cô và người lớn tuổi.', ''],
      ['Trắc nghiệm', 'Phần 2: Trắc nghiệm', 'Khi bạn nói "谢谢", câu đáp lại lịch sự là gì?', '不客气', '对不起', '没关系', '不客气', '谢谢你', 'C', '"不客气" (bú kèqi) nghĩa là "Đừng khách sáo".', ''],
      ['Điền từ', 'Phần 3: Điền từ có ngân hàng từ', '李老师，____好！', 'Chào cô Lý ạ (kính trọng)', '', '', '', '', '您', '吗, 呢', ''],
      ['Điền từ', 'Phần 3: Điền từ có ngân hàng từ', 'A: 对不起！ B: ____。', 'Không sao đâu', '', '', '', '', '没关系', '', ''],
      ['Sửa câu sai', 'Phần 4: Sửa câu sai', '大家们好！', 'Chào mọi người trong lớp', '', '', '', '', '大家好！ / 大家好', 'Chữ 大家 đã mang nghĩa số nhiều, không thêm 们.', ''],
      ['Sửa câu sai', 'Phần 4: Sửa câu sai', '我很很高兴。', 'Diễn đạt rất vui mừng', '', '', '', '', '我很高兴。 / 我很高兴', 'Phó từ 很 không lặp lại thành 很很.', ''],
      ['Dịch câu', 'Phần 5: Dịch câu', 'Xin chào các bạn!', 'vi->zh', '', '', '', '', '你们好！ / 大家好！', '"Các bạn" dùng 你们 hoặc 大家.', ''],
      ['Dịch câu', 'Phần 5: Dịch câu', '认识你，我也很高兴。', 'zh->vi', '', '', '', '', 'thu_cong', 'Gợi ý chấm: Làm quen với bạn, tôi cũng rất vui.', ''],
      ['Nghe hiểu', 'Text 4: Nghe hiểu', '李文回北京的路上花了多长时间？', '在宾馆房间，李文在写日记。', '几个小时', '十几个小时', '几十个小时', '', 'B', '女：李文，你从家回北京的路上花了多长时间？ 男：坐火车花了十几个小时，有点儿累。', ''],
      ['Nghe hiểu', 'Text 4: Nghe hiểu', '李文觉得王老师的姐姐看起来怎么样？', '在宾馆房间，李文在写日记。', '很累', '很年轻', '很像王老师', '', 'B', '女：昨天我见到王老师的姐姐了，她看起来很年轻！ 男：是啊。', '']
    ];

    const SECTION_BADGE_MAP = {
      matching: { label: 'Nối từ', cls: 'status-pink' },
      multiple_choice: { label: 'Trắc nghiệm', cls: 'status-mint' },
      fill_blank_wordbank: { label: 'Điền từ', cls: 'status-purple' },
      error_correction: { label: 'Sửa câu sai', cls: 'status-peach' },
      translation: { label: 'Dịch câu', cls: 'status-sky' },
      listening_mc: { label: 'Nghe hiểu', cls: 'status-yellow' }
    };

    let parsedPracticeResult = { sections: [], warnings: [], totalItems: 0, totalScore: 0 };
    let activeTemplateFilter = 'all';

    function normalizePlainKey(str) {
      return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    }

    function resolveImportedSectionType(rawType) {
      const k = normalizePlainKey(rawType);
      if (!k) return '';
      if (k === '1' || k.indexOf('noi tu') >= 0 || k.indexOf('matching') >= 0 || k.indexOf('ghep') >= 0) return 'matching';
      if (k === '2' || k.indexOf('trac nghiem') >= 0 || k.indexOf('multiple') >= 0 || k === 'mc' || k === 'mcq') return 'multiple_choice';
      if (k === '3' || k.indexOf('dien tu') >= 0 || k.indexOf('fill') >= 0 || k.indexOf('wordbank') >= 0) return 'fill_blank_wordbank';
      if (k === '4' || k.indexOf('sua cau') >= 0 || k.indexOf('sua sai') >= 0 || k.indexOf('error') >= 0 || k.indexOf('correction') >= 0) return 'error_correction';
      if (k === '5' || k.indexOf('dich') >= 0 || k.indexOf('translat') >= 0) return 'translation';
      if (k === '6' || k.indexOf('nghe') >= 0 || k.indexOf('listen') >= 0) return 'listening_mc';
      return null;
    }

    function resolveMcCorrectIndex(rawAns, options) {
      const cleaned = String(rawAns || '').trim();
      const upper = cleaned.toUpperCase();
      const letterIdx = { A: 0, B: 1, C: 2, D: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
      if (Object.prototype.hasOwnProperty.call(letterIdx, upper)) {
        return { index: letterIdx[upper], matched: true };
      }
      if (cleaned && Array.isArray(options)) {
        const target = normalizePlainKey(cleaned);
        const found = options.findIndex(function (opt) {
          return opt && normalizePlainKey(opt) === target;
        });
        if (found >= 0) return { index: found, matched: true };
      }
      return { index: 0, matched: cleaned === '' };
    }

    function parsePracticeMatrix(matrix) {
      const buckets = [];
      const warnings = [];
      let lastType = '';
      let lastSectionTitle = '';
      const baseTs = Date.now();

      function isHeaderRow(cols) {
        const c0 = normalizePlainKey(cols[0]);
        const c2 = normalizePlainKey(cols[2]);
        return (
          c0 === 'dang bai' ||
          c0 === 'a: dang bai' ||
          c0 === 'loai cau' ||
          c0 === 'type' ||
          c2.indexOf('cau hoi / de bai') >= 0
        );
      }

      (matrix || []).forEach(function (rawCols, rowIdx) {
        const cols = [];
        for (let c = 0; c < 11; c++) {
          cols.push(rawCols[c] !== undefined && rawCols[c] !== null ? String(rawCols[c]).trim() : '');
        }
        const hasAnyContent = cols.some(function (c) { return c !== ''; });
        if (!hasAnyContent) return;
        if (isHeaderRow(cols)) return;

        const excelRowNum = rowIdx + 1;
        let secType = resolveImportedSectionType(cols[0]);
        if (secType === null) {
          warnings.push('Dòng ' + excelRowNum + ': Không nhận diện được dạng bài "' + cols[0] + '".');
          return;
        }
        if (secType === '') {
          if (lastType && (cols[2] || cols[4] || cols[8])) {
            secType = lastType;
          } else {
            warnings.push('Dòng ' + excelRowNum + ': Thiếu tên Dạng bài ở cột A.');
            return;
          }
        }

        const explicitTitle = cols[1];
        const effectiveTitle = explicitTitle || (secType === lastType ? lastSectionTitle : '');
        const currentBucket = buckets.length > 0 ? buckets[buckets.length - 1] : null;
        let needNewBucket =
          !currentBucket ||
          currentBucket.type !== secType ||
          (explicitTitle && normalizePlainKey(explicitTitle) !== normalizePlainKey(currentBucket.rawTitle));

        if (!needNewBucket && secType === 'listening_mc' && !explicitTitle && cols[3] && currentBucket.contextTitle && cols[3] !== currentBucket.contextTitle) {
          needNewBucket = true;
        }

        if (needNewBucket) {
          buckets.push({
            type: secType,
            rawTitle: effectiveTitle,
            contextTitle: secType === 'listening_mc' ? cols[3] : '',
            rows: []
          });
        }

        buckets[buckets.length - 1].rows.push({ cols: cols, rowNum: excelRowNum });
        lastType = secType;
        lastSectionTitle = effectiveTitle;
      });

      const sections = [];
      let totalItems = 0;
      let totalScore = 0;

      buckets.forEach(function (bucket, bIdx) {
        const secNum = bIdx + 1;
        const t = bucket.type;
        const badgeInfo = SECTION_BADGE_MAP[t] || { label: t };
        const defaultTitle = 'Phần ' + secNum + ': ' + badgeInfo.label;
        const finalTitle = bucket.rawTitle || defaultTitle;
        const secId = 'sec_imp_' + t + '_' + baseTs + '_' + secNum;

        if (t === 'matching') {
          const left = [];
          const right = [];
          const answer = {};
          bucket.rows.forEach(function (r) {
            const hanzi = r.cols[2];
            const pinyin = r.cols[3];
            const meaning = r.cols[8] || r.cols[4];
            if (!hanzi && !meaning) return;
            const pairIdx = left.length;
            const leftId = pairIdx + 1;
            const rightId = pairIdx < 26 ? String.fromCharCode(65 + pairIdx) : ('R' + (pairIdx + 1));
            left.push({ id: leftId, hanzi: hanzi, pinyin: pinyin });
            right.push({ id: rightId, text: meaning });
            answer[String(leftId)] = rightId;
          });
          if (left.length === 0) return;
          totalItems += left.length;
          totalScore += left.length;
          sections.push({
            section_id: secId,
            section_num: secNum,
            type: 'matching',
            title: finalTitle,
            description: 'Nối chữ Hán và phiên âm pinyin ở cột trái với nghĩa tiếng Việt tương ứng ở cột phải.',
            max_score: left.length,
            data: { left: left, right: right, answer: answer }
          });
        } else if (t === 'multiple_choice') {
          const items = [];
          bucket.rows.forEach(function (r) {
            const prompt = r.cols[2];
            const speakWord = r.cols[3];
            const options = [r.cols[4], r.cols[5], r.cols[6], r.cols[7]];
            if (!prompt && !options.some(Boolean)) return;
            const ansRes = resolveMcCorrectIndex(r.cols[8], options);
            if (!ansRes.matched) {
              warnings.push('Dòng ' + r.rowNum + ': Đáp án đúng "' + r.cols[8] + '" chưa khớp A/B/C/D, tạm đặt về A.');
            }
            items.push({
              id: 'MC_' + baseTs + '_' + secNum + '_' + (items.length + 1),
              prompt: prompt,
              speakWord: speakWord,
              options: options,
              correctIndex: ansRes.index,
              explanation: r.cols[9] || ''
            });
          });
          if (items.length === 0) return;
          totalItems += items.length;
          totalScore += items.length;
          sections.push({
            section_id: secId,
            section_num: secNum,
            type: 'multiple_choice',
            title: finalTitle,
            description: 'Chọn đáp án chính xác nhất cho từng câu hỏi.',
            max_score: items.length,
            data: { items: items }
          });
        } else if (t === 'fill_blank_wordbank') {
          const items = [];
          const wordSet = [];
          const seenWords = {};
          function addWordUnique(w) {
            const val = String(w || '').trim();
            if (!val || seenWords[val]) return;
            seenWords[val] = true;
            wordSet.push(val);
          }

          bucket.rows.forEach(function (r) {
            const text = r.cols[2];
            const hint = r.cols[3];
            const answerWord = r.cols[8] || r.cols[4];
            const extraBankRaw = r.cols[9];
            if (!text && !answerWord) return;
            addWordUnique(answerWord);
            if (extraBankRaw) {
              extraBankRaw.split(/[,;\n\/]/).forEach(addWordUnique);
            }
            items.push({
              id: 'FB_' + baseTs + '_' + secNum + '_' + (items.length + 1),
              text: text,
              hint: hint,
              answer: answerWord
            });
          });
          if (items.length === 0) return;
          // Đảo nhẹ thứ tự ngân hàng từ để tránh lộ thứ tự 1-2-3
          const reorderedBank = wordSet.length > 2
            ? wordSet.filter(function (_, idx) { return idx % 2 === 1; }).concat(wordSet.filter(function (_, idx) { return idx % 2 === 0; }))
            : wordSet;
          totalItems += items.length;
          totalScore += items.length;
          sections.push({
            section_id: secId,
            section_num: secNum,
            type: 'fill_blank_wordbank',
            title: finalTitle,
            description: 'Chọn từ trong ngân hàng từ để điền vào chỗ trống "____".',
            max_score: items.length,
            data: { wordbank: reorderedBank, items: items }
          });
        } else if (t === 'error_correction') {
          const items = [];
          bucket.rows.forEach(function (r) {
            const wrong = r.cols[2];
            const situation = r.cols[3];
            const accRaw = r.cols[8] || r.cols[4];
            if (!wrong && !accRaw) return;
            const accepted = accRaw
              .split(/[\/;]/)
              .map(function (s) { return s.trim(); })
              .filter(Boolean);
            items.push({
              id: 'ERR_' + baseTs + '_' + secNum + '_' + (items.length + 1),
              wrong: wrong,
              situation: situation,
              accepted: accepted,
              explanation: r.cols[9] || ''
            });
          });
          if (items.length === 0) return;
          totalItems += items.length;
          totalScore += items.length;
          sections.push({
            section_id: secId,
            section_num: secNum,
            type: 'error_correction',
            title: finalTitle,
            description: 'Mỗi câu có một lỗi sai ngữ pháp, viết lại câu đúng vào ô nhập.',
            max_score: items.length,
            data: { items: items }
          });
        } else if (t === 'translation') {
          const items = [];
          bucket.rows.forEach(function (r) {
            const prompt = r.cols[2];
            if (!prompt) return;
            const dirNorm = normalizePlainKey(r.cols[3]);
            const direction = (dirNorm.indexOf('zh->vi') >= 0 || dirNorm.indexOf('zh-vi') >= 0 || dirNorm.indexOf('trung->viet') >= 0 || dirNorm.indexOf('trung - viet') >= 0)
              ? 'zh->vi'
              : 'vi->zh';
            const rawAns = r.cols[8] || r.cols[4];
            const ansNorm = normalizePlainKey(rawAns);
            const isManual = !rawAns || ansNorm === 'thu_cong' || ansNorm === 'thu cong' || ansNorm === 'manual' || ansNorm === 'cham tay';
            const accepted = isManual
              ? []
              : rawAns.split(/[\/;]/).map(function (s) { return s.trim(); }).filter(Boolean);
            items.push({
              id: 'TR_' + baseTs + '_' + secNum + '_' + (items.length + 1),
              direction: direction,
              mode: isManual ? 'manual' : 'exact',
              prompt: prompt,
              accepted: accepted,
              grading_note: isManual ? (r.cols[9] || '') : '',
              explanation: isManual ? '' : (r.cols[9] || '')
            });
          });
          if (items.length === 0) return;
          totalItems += items.length;
          totalScore += items.length;
          sections.push({
            section_id: secId,
            section_num: secNum,
            type: 'translation',
            title: finalTitle,
            description: 'Dịch câu theo đúng hướng yêu cầu (Việt → Trung hoặc Trung → Việt).',
            max_score: items.length,
            data: { items: items }
          });
        } else if (t === 'listening_mc') {
          const firstRowCols = bucket.rows[0].cols;
          const rawCtx = firstRowCols[3] || '';
          const ctxParts = rawCtx.split('||');
          const ctxTitle = (ctxParts[0] || '').trim();
          const ctxSub = (ctxParts[1] || '').trim() || 'Nghe đoạn hội thoại 2 lần rồi chọn đáp án đúng.';
          const labelCandidate = (bucket.rawTitle || '').split(':')[0].trim() || ('Bài nghe ' + secNum);
          let audioUrl = '';
          const transcriptLines = [];
          const items = [];

          bucket.rows.forEach(function (r) {
            if (!audioUrl && r.cols[10]) audioUrl = r.cols[10];
            if (r.cols[9] && transcriptLines.indexOf(r.cols[9]) < 0) {
              transcriptLines.push(r.cols[9]);
            }
            const prompt = r.cols[2];
            const options = [r.cols[4], r.cols[5], r.cols[6], r.cols[7]];
            if (!prompt && !options.some(Boolean)) return;
            const ansRes = resolveMcCorrectIndex(r.cols[8], options);
            if (!ansRes.matched) {
              warnings.push('Dòng ' + r.rowNum + ': Đáp án đúng "' + r.cols[8] + '" chưa khớp A/B/C/D, tạm đặt về A.');
            }
            items.push({
              id: 'LS_' + baseTs + '_' + secNum + '_' + (items.length + 1),
              prompt: prompt,
              options: options,
              correctIndex: ansRes.index,
              explanation: ''
            });
          });
          if (items.length === 0) return;
          totalItems += items.length;
          totalScore += items.length;
          sections.push({
            section_id: secId,
            section_num: secNum,
            type: 'listening_mc',
            title: finalTitle,
            description: 'Nghe đoạn hội thoại và chọn đáp án chính xác nhất cho từng câu hỏi.',
            max_score: items.length,
            data: {
              context_label: labelCandidate,
              context_title: ctxTitle,
              context_subtitle: ctxSub,
              audio_label: 'Audio ' + secNum,
              audio_url: audioUrl,
              audio_duration: '00:45',
              audio_transcript: transcriptLines.join(' '),
              items: items
            }
          });
        }
      });

      return {
        sections: sections,
        warnings: warnings,
        totalItems: totalItems,
        totalScore: totalScore
      };
    }

    function renderPracticeTemplateTable() {
      if (!tplSheetThead || !tplSheetTbody) return;
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
      tplSheetThead.innerHTML =
        '<tr>' +
          '<th class="col-idx-head">#</th>' +
          PRACTICE_TEMPLATE_HEADERS.map(function (h, i) {
            return '<th><span class="template-col-letter">' + letters[i] + '</span>' + escapeHtml(h) + '</th>';
          }).join('') +
        '</tr>';

      const filteredRows = PRACTICE_TEMPLATE_ROWS.filter(function (row) {
        if (activeTemplateFilter === 'all') return true;
        return resolveImportedSectionType(row[0]) === activeTemplateFilter;
      });

      tplSheetTbody.innerHTML = filteredRows.map(function (row, idx) {
        const t = resolveImportedSectionType(row[0]);
        const badge = SECTION_BADGE_MAP[t] || { label: row[0], cls: 'status-mint' };
        return '<tr>' +
          '<td class="col-idx-cell">' + (idx + 1) + '</td>' +
          row.map(function (cell, cIdx) {
            if (cIdx === 0) {
              return '<td><span class="status-badge ' + badge.cls + '" style="font-size:0.75rem;">' + escapeHtml(cell) + '</span></td>';
            }
            if (!cell) {
              return '<td style="color:var(--muted);opacity:0.45;">—</td>';
            }
            return '<td>' + escapeHtml(cell) + '</td>';
          }).join('') +
        '</tr>';
      }).join('');
    }

    function summarizeImportedSection(sec) {
      const d = sec.data || {};
      if (sec.type === 'matching') {
        const sample = (d.left || []).slice(0, 2).map(function (l, i) {
          const rightObj = (d.right || [])[i];
          return l.hanzi + (rightObj ? ' → ' + rightObj.text : '');
        }).join(' • ');
        return sample || ((d.left || []).length + ' cặp từ nối');
      }
      if (sec.type === 'multiple_choice') {
        const first = (d.items || [])[0];
        return first ? first.prompt : '';
      }
      if (sec.type === 'fill_blank_wordbank') {
        const wb = (d.wordbank || []).slice(0, 5).join(', ');
        return wb ? ('Ngân hàng từ: ' + wb) : '';
      }
      if (sec.type === 'error_correction') {
        const first = (d.items || [])[0];
        return first ? ('Câu sai: ' + first.wrong) : '';
      }
      if (sec.type === 'translation') {
        const first = (d.items || [])[0];
        return first ? (first.prompt + (first.mode === 'manual' ? ' (Chấm tay)' : ' (Tự động)')) : '';
      }
      if (sec.type === 'listening_mc') {
        const first = (d.items || [])[0];
        const ctx = d.context_title ? ('[' + d.context_title + '] ') : '';
        return ctx + (first ? first.prompt : '');
      }
      return '';
    }

    function updatePracticeImportPreview(matrix) {
      const res = parsePracticeMatrix(matrix);
      parsedPracticeResult = res;

      if (!practicePreviewBox || !practicePreviewTbody || !btnConfirmPracticeImport) return;
      if (res.sections.length === 0) {
        practicePreviewBox.style.display = res.warnings.length > 0 ? 'block' : 'none';
        if (practicePreviewTbody) practicePreviewTbody.innerHTML = '';
        if (practiceSecCountEl) practiceSecCountEl.textContent = '0 phần';
        if (practiceQCountEl) practiceQCountEl.textContent = '0 câu hỏi';
        if (practiceScoreCountEl) practiceScoreCountEl.textContent = '0 điểm';
        btnConfirmPracticeImport.disabled = true;
      } else {
        practicePreviewBox.style.display = 'block';
        if (practiceSecCountEl) practiceSecCountEl.textContent = res.sections.length + ' phần';
        if (practiceQCountEl) practiceQCountEl.textContent = res.totalItems + ' câu hỏi';
        if (practiceScoreCountEl) practiceScoreCountEl.textContent = res.totalScore + ' điểm';
        btnConfirmPracticeImport.disabled = false;

        practicePreviewTbody.innerHTML = res.sections.map(function (sec, idx) {
          const badge = SECTION_BADGE_MAP[sec.type] || { label: sec.type, cls: 'status-mint' };
          const itemCount = sec.type === 'matching'
            ? ((sec.data && sec.data.left && sec.data.left.length) || 0)
            : ((sec.data && sec.data.items && sec.data.items.length) || 0);
          return (
            '<tr>' +
              '<td class="tabular-nums"><strong>' + (idx + 1) + '</strong></td>' +
              '<td><span class="status-badge ' + badge.cls + '" style="font-size:0.75rem;">' + escapeHtml(badge.label) + '</span></td>' +
              '<td><strong>' + escapeHtml(sec.title) + '</strong></td>' +
              '<td class="tabular-nums">' + itemCount + ' câu</td>' +
              '<td class="tabular-nums">' + sec.max_score + 'đ</td>' +
              '<td style="font-size:0.75rem;color:var(--color-muted-foreground);">' + escapeHtml(summarizeImportedSection(sec)) + '</td>' +
            '</tr>'
          );
        }).join('');
      }

      if (practiceWarningsBox) {
        if (res.warnings.length > 0) {
          practiceWarningsBox.style.display = 'block';
          practiceWarningsBox.innerHTML =
            '<strong>Lưu ý định dạng (' + res.warnings.length + '):</strong><br>' +
            res.warnings.slice(0, 6).map(function (w) { return escapeHtml(w); }).join('<br>');
        } else {
          practiceWarningsBox.style.display = 'none';
          practiceWarningsBox.innerHTML = '';
        }
      }
    }

    function switchPracticeImportTab(tabName) {
      const uploadView = document.getElementById('practice-import-view-upload');
      const tplView = document.getElementById('practice-import-view-template');
      document.querySelectorAll('[data-practice-import-tab]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-practice-import-tab') === tabName);
      });
      if (uploadView) uploadView.style.display = tabName === 'upload' ? 'block' : 'none';
      if (tplView) tplView.style.display = tabName === 'template' ? 'block' : 'none';
      if (tabName === 'template') renderPracticeTemplateTable();
    }

    function openPracticeExcelModal(defaultTab) {
      if (!modalPracticeExcel) return;
      renderPracticeTemplateTable();
      switchPracticeImportTab(defaultTab || 'upload');
      modalPracticeExcel.classList.add('is-open', 'is-visible');
    }

    function closePracticeExcelModal() {
      if (modalPracticeExcel) modalPracticeExcel.classList.remove('is-open', 'is-visible');
    }

    function fillPracticeSampleIntoImport() {
      const tsv = PRACTICE_TEMPLATE_ROWS.map(function (r) {
        return r.join('\t');
      }).join('\n');
      if (practicePasteTextarea) {
        practicePasteTextarea.value = tsv;
      }
      updatePracticeImportPreview(PRACTICE_TEMPLATE_ROWS);
      switchPracticeImportTab('upload');
      showToast('Đã nạp dữ liệu template mẫu (6 dạng bài) vào khung xem trước!');
    }

    function downloadPracticeTemplateExcel() {
      const allRows = [PRACTICE_TEMPLATE_HEADERS].concat(PRACTICE_TEMPLATE_ROWS);
      if (typeof window.XLSX !== 'undefined' && window.XLSX && window.XLSX.utils) {
        const wb = window.XLSX.utils.book_new();
        const ws1 = window.XLSX.utils.aoa_to_sheet(allRows);
        ws1['!cols'] = [
          { wch: 15 }, { wch: 24 }, { wch: 36 }, { wch: 28 },
          { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
          { wch: 22 }, { wch: 38 }, { wch: 24 }
        ];
        window.XLSX.utils.book_append_sheet(wb, ws1, 'De_Luyen_Tap');

        const guideRows = [
          ['Dạng bài (Cột A)', 'Cột C (Câu hỏi / Đề bài)', 'Cột D (Pinyin / Ngữ cảnh / Gợi ý)', 'Cột E–H (Đáp án A–D)', 'Cột I (Đáp án đúng)', 'Cột J (Giải thích / Ghi chú)', 'Cột K (Link Audio)'],
          ['Nối từ', 'Chữ Hán', 'Phiên âm Pinyin', 'Bỏ trống', 'Nghĩa Tiếng Việt', 'Tùy chọn', 'Bỏ trống'],
          ['Trắc nghiệm', 'Nội dung câu hỏi', 'Từ phát âm mẫu (tùy chọn)', '4 lựa chọn A, B, C, D', 'Ghi A, B, C hoặc D', 'Giải thích đáp án sau nộp', 'Bỏ trống'],
          ['Điền từ', 'Câu có chỗ trống ____', 'Gợi ý nghĩa tiếng Việt', 'Bỏ trống', 'Từ cần điền (tự gom vào Ngân hàng từ)', 'Từ nhiễu thêm (ngăn cách dấu phẩy)', 'Bỏ trống'],
          ['Sửa câu sai', 'Câu sai đề bài', 'Tình huống giao tiếp', 'Bỏ trống', 'Các câu đúng ngăn cách dấu /', 'Giải thích lỗi sai', 'Bỏ trống'],
          ['Dịch câu', 'Câu cần dịch', 'vi->zh hoặc zh->vi', 'Bỏ trống', 'Đáp án mẫu (hoặc ghi thu_cong để chấm tay)', 'Gợi ý chấm / Giải thích', 'Bỏ trống'],
          ['Nghe hiểu', 'Câu hỏi nghe (1), (2)...', 'Tiêu đề ngữ cảnh bài nghe', '3 đáp án A–C (hoặc thêm D)', 'Ghi A, B, C hoặc D', 'Kịch bản hội thoại (Transcript)', 'Đường dẫn file âm thanh (tùy chọn)']
        ];
        const ws2 = window.XLSX.utils.aoa_to_sheet(guideRows);
        ws2['!cols'] = [
          { wch: 18 }, { wch: 26 }, { wch: 28 }, { wch: 24 }, { wch: 34 }, { wch: 34 }, { wch: 26 }
        ];
        window.XLSX.utils.book_append_sheet(wb, ws2, 'Huong_Dan_Cot');
        window.XLSX.writeFile(wb, 'StudySnap_Template_De_Luyen_Tap.xlsx');
        showToast('Đã tải xuống file Excel mẫu StudySnap_Template_De_Luyen_Tap.xlsx!');
        return;
      }

      // Fallback UTF-8 BOM CSV nếu đang ngoại tuyến
      const csvLines = allRows.map(function (row) {
        return row.map(function (cell) {
          const v = String(cell || '').replace(/"/g, '""');
          return /[",\n\r]/.test(v) ? '"' + v + '"' : v;
        }).join(',');
      }).join('\r\n');
      const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'StudySnap_Template_De_Luyen_Tap.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Đã tải xuống file template CSV (mở trực tiếp bằng Excel)!');
    }

    function handlePracticeExcelFile(file) {
      readSpreadsheetFileAsMatrix(
        file,
        function (matrix) {
          const tsvText = matrix
            .map(function (row) {
              return row.map(function (c) { return String(c || '').replace(/[\r\n\t]+/g, ' '); }).join('\t');
            })
            .join('\n');
          if (practicePasteTextarea) practicePasteTextarea.value = tsvText;
          updatePracticeImportPreview(matrix);
        },
        function (errMsg) {
          showToast(errMsg);
        }
      );
    }

    if (btnOpenPracticeImport) {
      btnOpenPracticeImport.addEventListener('click', function () {
        openPracticeExcelModal('upload');
      });
    }
    if (btnOpenPracticeImportSticky) {
      btnOpenPracticeImportSticky.addEventListener('click', function () {
        openPracticeExcelModal('upload');
      });
    }
    if (btnClosePracticeImport) btnClosePracticeImport.addEventListener('click', closePracticeExcelModal);
    if (btnCancelPracticeImport) btnCancelPracticeImport.addEventListener('click', closePracticeExcelModal);
    if (modalPracticeExcel) {
      modalPracticeExcel.addEventListener('click', function (ev) {
        if (ev.target === modalPracticeExcel) closePracticeExcelModal();
      });
    }
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && modalPracticeExcel && modalPracticeExcel.classList.contains('is-open')) {
        closePracticeExcelModal();
      }
    });

    document.querySelectorAll('[data-practice-import-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchPracticeImportTab(btn.getAttribute('data-practice-import-tab'));
      });
    });

    if (btnJumpTemplateView) {
      btnJumpTemplateView.addEventListener('click', function () {
        switchPracticeImportTab('template');
      });
    }

    document.querySelectorAll('[data-template-type-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeTemplateFilter = btn.getAttribute('data-template-type-filter') || 'all';
        document.querySelectorAll('[data-template-type-filter]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        renderPracticeTemplateTable();
      });
    });

    if (btnDownloadPracticeTpl) btnDownloadPracticeTpl.addEventListener('click', downloadPracticeTemplateExcel);
    if (btnFillPracticeSample) btnFillPracticeSample.addEventListener('click', fillPracticeSampleIntoImport);
    if (btnUseTemplateInImport) btnUseTemplateInImport.addEventListener('click', fillPracticeSampleIntoImport);

    if (practiceImportModeSel) {
      practiceImportModeSel.addEventListener('change', function () {
        if (practiceNewMetaBox) {
          practiceNewMetaBox.style.display = practiceImportModeSel.value === 'new' ? 'grid' : 'none';
        }
      });
    }

    if (practicePasteTextarea) {
      practicePasteTextarea.addEventListener('input', function () {
        updatePracticeImportPreview(parseRawTextToMatrix(practicePasteTextarea.value));
      });
    }

    if (practiceFileInput) {
      practiceFileInput.addEventListener('change', function (ev) {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        handlePracticeExcelFile(file);
      });
    }

    if (practiceDropZone) {
      practiceDropZone.addEventListener('click', function () {
        if (practiceFileInput) practiceFileInput.click();
      });
      practiceDropZone.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          if (practiceFileInput) practiceFileInput.click();
        }
      });
      practiceDropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        practiceDropZone.classList.add('is-dragover');
      });
      practiceDropZone.addEventListener('dragleave', function () {
        practiceDropZone.classList.remove('is-dragover');
      });
      practiceDropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        practiceDropZone.classList.remove('is-dragover');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) {
          handlePracticeExcelFile(file);
        }
      });
    }

    if (btnConfirmPracticeImport) {
      btnConfirmPracticeImport.addEventListener('click', async function () {
        if (!parsedPracticeResult || !parsedPracticeResult.sections || parsedPracticeResult.sections.length === 0) return;

        const mode = (practiceImportModeSel && practiceImportModeSel.value) || 'append';
        const importedSections = JSON.parse(JSON.stringify(parsedPracticeResult.sections));
        let targetEx = null;
        const firstNewId = importedSections[0] ? importedSections[0].section_id : null;

        if (mode === 'new' || !getActivePracticeExercise()) {
          const nextNum = (state.practiceExercises || []).length + 1;
          const title = (practiceNewTitleInput && practiceNewTitleInput.value.trim()) || ('Bài luyện tập nhập Excel #' + nextNum);
          const tag = (practiceNewTagInput && practiceNewTagInput.value.trim()) || ('Bài ' + nextNum);
          const totalScore = importedSections.reduce(function (sum, s) { return sum + Number(s.max_score || 0); }, 0);
          targetEx = {
            exercise_id: 'EX_' + Date.now(),
            title: title,
            lesson_tag: tag,
            total_score: totalScore,
            thresholds: {
              good: Math.max(1, Math.round(totalScore * 0.7)),
              very_good: Math.max(1, Math.round(totalScore * 0.85))
            },
            sections: importedSections
          };
          if (!Array.isArray(state.practiceExercises)) state.practiceExercises = [];
          ui.selectedPracticeExId = targetEx.exercise_id;
        } else {
          collectExerciseFromDom();
          targetEx = getActivePracticeExercise();
          if (mode === 'replace') {
            targetEx.sections = importedSections;
          } else {
            if (!Array.isArray(targetEx.sections)) targetEx.sections = [];
            targetEx.sections = targetEx.sections.concat(importedSections);
          }
          targetEx.sections.forEach(function (sec, idx) {
            sec.section_num = idx + 1;
          });
          targetEx.total_score = targetEx.sections.reduce(function (sum, s) {
            return sum + Number(s.max_score || 0);
          }, 0);
          if (!targetEx.thresholds) targetEx.thresholds = { good: 1, very_good: 1 };
          targetEx.thresholds.good = Math.max(1, Math.round(targetEx.total_score * 0.7));
          targetEx.thresholds.very_good = Math.max(1, Math.round(targetEx.total_score * 0.85));
        }

        await runWithLoading(
          btnConfirmPracticeImport,
          'Đang nhập vào đề...',
          async function () {
            await window.StudySnapStore.savePracticeExercise(state, targetEx);
          },
          {
            title: 'Đang nhập đề luyện tập từ Excel...',
            desc: 'Hệ thống đang lưu ' + importedSections.length + ' phần (' + parsedPracticeResult.totalItems + ' câu hỏi) lên máy chủ.'
          }
        );
        switchPracticeSubView('builder');
        renderTeacherPracticeTab();

        closePracticeExcelModal();
        if (practicePasteTextarea) practicePasteTextarea.value = '';
        if (practiceFileInput) practiceFileInput.value = '';
        if (practiceNewTitleInput) practiceNewTitleInput.value = '';
        updatePracticeImportPreview([]);

        showToast(
          'Đã nhập thành công ' +
            importedSections.length +
            ' phần (' +
            parsedPracticeResult.totalItems +
            ' câu • ' +
            parsedPracticeResult.totalScore +
            ' điểm) từ Excel!'
        );

        if (firstNewId) {
          setTimeout(function () {
            const newCard = document.querySelector('[data-sec-card="' + firstNewId + '"]');
            if (newCard) {
              newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
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
    document.body.addEventListener('click', async function (ev) {
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
          await runWithLoading(resetPwdBtn, 'Đang cập nhật...', async function () {
            await window.StudySnapStore.syncPostToGas(state, {
              action: 'resetStudentPassword',
              student_id: st.student_id,
              new_password: st.password
            });
          });
          renderStudentAccountsTab();
          showToast('Đã cập nhật mật khẩu mới cho ' + st.full_name + '!');
        }
        return;
      }

      // Lọc danh sách học sinh theo lớp từ thẻ lớp học
      const filterClassBtn = ev.target.closest('[data-filter-class-students]');
      if (filterClassBtn) {
        const clsName = filterClassBtn.getAttribute('data-filter-class-students');
        ui.studentAccountsClassFilter = clsName;
        renderStudentAccountsTab();
        const listEl = document.getElementById('student-accounts-list');
        if (listEl) listEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      // Xóa lớp học
      const deleteClassBtn = ev.target.closest('[data-delete-class-name]');
      if (deleteClassBtn) {
        const clsName = deleteClassBtn.getAttribute('data-delete-class-name');
        const studentsInClass = (state.students || []).filter(function (s) {
          return (s.class_name || '').trim().toLowerCase() === clsName.trim().toLowerCase();
        });
        if (studentsInClass.length > 0) {
          const confirmDel = window.confirm(
            'Lớp "' + clsName + '" hiện đang có ' + studentsInClass.length + ' học sinh!\n\n' +
            'Bạn có chắc chắn muốn xóa lớp này? (Các học sinh trong lớp sẽ được chuyển thành "Chưa xếp lớp")'
          );
          if (!confirmDel) return;
          studentsInClass.forEach(function (s) { s.class_name = 'Chưa xếp lớp'; });
        }
        state.classes = (state.classes || []).filter(function (c) {
          return c.class_name.trim().toLowerCase() !== clsName.trim().toLowerCase();
        });
        window.StudySnapStore.saveState(state);
        if (ui.studentAccountsClassFilter === clsName) ui.studentAccountsClassFilter = 'all';
        renderAll();
        showToast('Đã xóa lớp học "' + clsName + '"!');
        return;
      }

      // Đổi lớp cho học sinh
      const changeClassBtn = ev.target.closest('[data-change-student-class]');
      if (changeClassBtn) {
        const stId = changeClassBtn.getAttribute('data-change-student-class');
        const st = findStudent(stId);
        if (!st) return;
        const available = getAvailableClasses();
        if (available.length === 0) {
          showToast('Chưa có lớp học nào. Hãy tạo lớp học mới trước!');
          return;
        }
        const classListStr = available.map(function (c, idx) { return (idx + 1) + '. ' + c; }).join('\n');
        const chosen = window.prompt(
          'Chọn lớp học mới cho học sinh ' + st.full_name + ':\n\n' +
          classListStr + '\n\n' +
          'Nhập số thứ tự hoặc tên lớp mới:',
          st.class_name || available[0]
        );
        if (chosen && chosen.trim()) {
          let targetClass = chosen.trim();
          const num = parseInt(targetClass, 10);
          if (!isNaN(num) && num >= 1 && num <= available.length) {
            targetClass = available[num - 1];
          }
          st.class_name = targetClass;
          window.StudySnapStore.saveState(state);
          renderAll();
          showToast('Đã chuyển học sinh ' + st.full_name + ' sang ' + targetClass + '!');
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

      // Chuyển sang sửa đề bài tập luyện tập đồng bộ từ Tab 3
      const editPracticeBtn = ev.target.closest('#btn-synced-edit-practice');
      if (editPracticeBtn) {
        const exId = editPracticeBtn.getAttribute('data-ex-id');
        ui.selectedPracticeExId = exId;
        switchTeacherTab('practice');
        renderTeacherPracticeTab();
        return;
      }

      // Mở modal giao đề bài tập luyện tập đồng bộ từ Tab 3
      const assignPracticeBtn = ev.target.closest('#btn-synced-assign-practice');
      if (assignPracticeBtn) {
        const exId = assignPracticeBtn.getAttribute('data-ex-id');
        const ex = (state.practiceExercises || []).find(function (e) { return e.exercise_id === exId; });
        if (ex) openAssignPracticeModal(ex);
        return;
      }

      // Tạo nhanh đề bài tập luyện tập cho bài học từ Tab 3
      const createPracticeBtn = ev.target.closest('#btn-synced-create-practice');
      if (createPracticeBtn) {
        const tag = createPracticeBtn.getAttribute('data-lesson-tag') || 'Bài 1';
        const title = createPracticeBtn.getAttribute('data-lesson-title') || ('Bài tập luyện tập ' + tag);
        const newEx = {
          exercise_id: 'EX_' + Date.now(),
          title: 'Bài tập luyện tập cuối bài — ' + title,
          lesson_tag: tag,
          total_score: 0,
          thresholds: { very_good: 31, good: 25 },
          sections: []
        };
        if (!Array.isArray(state.practiceExercises)) state.practiceExercises = [];
        state.practiceExercises.push(newEx);
        ui.selectedPracticeExId = newEx.exercise_id;
        await runWithLoading(createPracticeBtn, 'Đang tạo đề...', async function () {
          await window.StudySnapStore.savePracticeExercise(state, newEx);
        });
        switchTeacherTab('practice');
        renderTeacherPracticeTab();
        showToast('Đã khởi tạo đề mới cho ' + tag + '! Hãy bấm chọn dạng bài bên dưới để soạn câu hỏi.');
        return;
      }

      // Nút nhảy nhanh sang Tab 4 từ thông báo Tab 3
      const jumpPracticeBtn = ev.target.closest('#btn-quick-jump-practice-tab');
      if (jumpPracticeBtn) {
        switchTeacherTab('practice');
        renderTeacherPracticeTab();
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
      window.StudySnapStore.fetchBootstrapFromGas(state).then(function (remoteRes) {
        if (remoteRes && remoteRes.ok && remoteRes.data) {
          if (!window.StudySnapAuth.revalidateActiveSession(state)) {
            window.location.replace('index.html?session=expired');
            return;
          }
        }
        renderAll();
      });
    }
  });
})();

