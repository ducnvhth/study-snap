/**
 * StudySnap — Logic Cổng Học Sinh (`student.html`)
 * - Bảo vệ trang theo vai trò `student` (`StudySnapAuth.enforceRole('student')`)
 * - Nộp BVN đa phương tiện (Ghi âm trực tiếp hoặc tải file Audio/Video) cho đúng tài khoản học sinh đang đăng nhập
 * - Xem điểm số, nhận xét văn bản và bấm nghe trực tiếp Voice Feedback của Giáo viên
 * - Bảng theo dõi tiến độ BVN & nhận xét của riêng học sinh đang đăng nhập
 * - Bài luyện tập cuối giờ (Exit Ticket) tương tác & lưu lịch sử cá nhân
 * - Web ôn từ vựng chia theo từng bài (`Bài 1`, `Bài 2`, `Bài 3`...) và chế độ `"Tổng hợp"` toàn khóa
 */

(function () {
  'use strict';

  const sessionUser = window.StudySnapAuth.enforceRole('student');
  if (!sessionUser) return;

  let state = window.StudySnapStore.loadState();

  function getActiveStudent() {
    const found = (state.students || []).find(function (s) {
      return (
        s.student_id === sessionUser.student_id ||
        s.student_id === sessionUser.id ||
        String(s.username || '').toLowerCase() === String(sessionUser.username || '').toLowerCase()
      );
    });
    return (
      found || {
        student_id: sessionUser.student_id || sessionUser.id || 'HS01',
        full_name: sessionUser.full_name || 'Nguyễn Minh Anh',
        class_name: sessionUser.class_name || 'Lớp Tiếng Trung HSK 2',
        avatar_initials: sessionUser.avatar_initials || 'MA',
        username: sessionUser.username || 'hs01'
      }
    );
  }

  const activeStudent = getActiveStudent();
  const MASTERY_KEY = 'studysnap_mastered_vocab_' + activeStudent.student_id;

  const ui = {
    activeTab: 'homework',
    selectedAssignmentId: state.assignments[0] ? state.assignments[0].assignment_id : 'BVN01',
    pendingMedia: null,

    // Exit Ticket state
    selectedTicketId: state.exitTickets[0] ? state.exitTickets[0].ticket_id : 'EXIT_BAI_1',
    quizQuestionIndex: 0,
    quizSelectedOption: null,
    quizAnswered: false,
    quizScore: 0,
    quizFinished: false,

    // Vocabulary state
    selectedVocabLessonId: 'bai-1', // 'bai-1', 'bai-2', 'bai-3', ... or 'all' ("Tổng hợp")
    vocabFilterMode: 'all', // 'all' | 'unmastered' | 'mastered'
    vocabSearchQuery: '',
    flashcardIndex: 0,
    showMeaningOnCard: true,
    masteredIds: loadMasteredIds()
  };

  function loadMasteredIds() {
    try {
      const raw = localStorage.getItem(MASTERY_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) {
      // ignore
    }
    return ['V01', 'V02', 'V05', 'V09'];
  }

  function saveMasteredIds() {
    try {
      localStorage.setItem(MASTERY_KEY, JSON.stringify(ui.masteredIds));
    } catch (e) {
      // ignore
    }
  }

  function escapeHtml(val) {
    return String(val === null || val === undefined ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 3400);
  }

  function findSubmission(assignmentId, studentId) {
    return (
      (state.submissions || []).find(function (sub) {
        return sub.assignment_id === assignmentId && sub.student_id === studentId;
      }) || null
    );
  }

  function switchTab(tabName) {
    ui.activeTab = tabName;
    document.querySelectorAll('[data-student-tab]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-student-tab') === tabName);
    });

    const tabMap = {
      homework: document.getElementById('student-tab-homework'),
      'exit-ticket': document.getElementById('student-tab-exit-ticket'),
      vocabulary: document.getElementById('student-tab-vocabulary')
    };

    Object.keys(tabMap).forEach(function (key) {
      if (tabMap[key]) {
        tabMap[key].classList.toggle('is-active', key === tabName);
      }
    });
  }

  // =========================================================================
  // 1. HEADER & PERSONAL PROGRESS SUMMARY BANNER
  // =========================================================================
  function renderStudentHeaderAndStats() {
    const student = getActiveStudent();

    const profilePill = document.getElementById('student-profile-pill');
    const headerSub = document.getElementById('student-header-subtitle');
    const welcomeHeading = document.getElementById('student-welcome-heading');
    const welcomeDesc = document.getElementById('student-welcome-desc');
    const accountBadge = document.getElementById('student-account-badge');

    if (profilePill) {
      profilePill.textContent = student.full_name + ' (' + student.student_id + ')';
    }
    if (headerSub) {
      headerSub.textContent = (student.class_name || 'Lớp Tiếng Trung HSK 2') + ' • Tài khoản: @' + (student.username || student.student_id.toLowerCase());
    }
    if (welcomeHeading) {
      welcomeHeading.textContent = 'Xin chào ' + student.full_name + '!';
    }
    if (welcomeDesc) {
      welcomeDesc.textContent =
        'Lớp: ' +
        (student.class_name || 'Lớp Tiếng Trung HSK 2') +
        '. Nộp bài tập về nhà bằng thu âm trực tiếp hoặc tải video, nghe giáo viên sửa phát âm bằng giọng nói (Voice Feedback), làm bài luyện tập cuối giờ và ôn từ vựng theo từng bài hoặc tổng hợp.';
    }
    if (accountBadge) {
      accountBadge.textContent = student.student_id + ' • ' + student.full_name;
    }

    const totalAssignments = state.assignments.length;
    let submittedCount = 0;
    let gradedWithVoiceCount = 0;
    let scoreTotal = 0;
    let scoreCount = 0;

    state.assignments.forEach(function (asg) {
      const sub = findSubmission(asg.assignment_id, student.student_id);
      if (sub) {
        submittedCount++;
        if (sub.status === 'graded' || sub.teacher_comment || sub.teacher_voice_url) {
          gradedWithVoiceCount++;
        }
        if (sub.score !== '' && sub.score !== null && !isNaN(Number(sub.score))) {
          scoreTotal += Number(sub.score);
          scoreCount++;
        }
      }
    });

    const avgScore = scoreCount > 0 ? (scoreTotal / scoreCount).toFixed(1) : '—';
    const totalVocab = state.vocabulary.length;
    const validMasteredCount = ui.masteredIds.filter(function (id) {
      return state.vocabulary.some(function (v) {
        return v.vocab_id === id;
      });
    }).length;

    const elSubmitted = document.getElementById('student-stat-hw-submitted');
    const elGraded = document.getElementById('student-stat-hw-graded');
    const elAvg = document.getElementById('student-stat-avg-score');
    const elVocab = document.getElementById('student-stat-vocab-mastered');

    if (elSubmitted) elSubmitted.textContent = submittedCount + '/' + totalAssignments;
    if (elGraded) elGraded.textContent = String(gradedWithVoiceCount);
    if (elAvg) elAvg.textContent = String(avgScore);
    if (elVocab) elVocab.textContent = validMasteredCount + '/' + totalVocab;
  }

  // =========================================================================
  // 2. TAB 1: HOMEWORK SUBMISSION & TEACHER VOICE FEEDBACK VIEWER
  // =========================================================================
  function renderHomeworkSection() {
    const student = getActiveStudent();
    const selectEl = document.getElementById('student-assignment-select');

    if (selectEl) {
      selectEl.innerHTML = state.assignments
        .map(function (asg) {
          const sub = findSubmission(asg.assignment_id, student.student_id);
          let statusLabel = 'Chưa nộp';
          if (sub && sub.status === 'graded') {
            statusLabel = 'Đã chấm: ' + sub.score + '/10';
          } else if (sub) {
            statusLabel = 'Đã nộp • Chờ chấm';
          }
          const selected = asg.assignment_id === ui.selectedAssignmentId ? ' selected' : '';
          return (
            '<option value="' +
            escapeHtml(asg.assignment_id) +
            '"' +
            selected +
            '>' +
            escapeHtml(asg.title + ' (' + statusLabel + ')') +
            '</option>'
          );
        })
        .join('');
    }

    const currentAsg =
      state.assignments.find(function (a) {
        return a.assignment_id === ui.selectedAssignmentId;
      }) || state.assignments[0];

    if (currentAsg) {
      const briefTitle = document.getElementById('student-brief-title');
      const briefDesc = document.getElementById('student-brief-desc');
      if (briefTitle) {
        briefTitle.textContent = currentAsg.title + ' • Hạn nộp: ' + currentAsg.due_date;
      }
      if (briefDesc) {
        briefDesc.textContent = currentAsg.description;
      }
    }

    const currentSub = currentAsg ? findSubmission(currentAsg.assignment_id, student.student_id) : null;
    const noteArea = document.getElementById('student-note-textarea');
    if (noteArea && document.activeElement !== noteArea) {
      noteArea.value = currentSub && currentSub.student_note ? currentSub.student_note : '';
    }

    renderFeedbackDetailPanel(currentAsg, currentSub);
    renderPersonalHomeworkMatrix(student);
  }

  function renderFeedbackDetailPanel(assignment, submission) {
    const statusBadge = document.getElementById('student-feedback-status-badge');
    const bodyEl = document.getElementById('student-feedback-panel-body');
    if (!bodyEl || !assignment) return;

    if (!submission) {
      if (statusBadge) {
        statusBadge.className = 'status-badge status-missing';
        statusBadge.textContent = 'Chưa nộp bài';
      }
      bodyEl.innerHTML =
        '<div class="assignment-brief-box">' +
        '<div class="assignment-brief-title">Em chưa nộp ' +
        escapeHtml(assignment.lesson_tag || assignment.title) +
        '</div>' +
        '<p class="assignment-brief-desc">Hãy thu âm trực tiếp hoặc tải file Audio/Video ở cột bên trái và bấm <strong>Nộp Bài Tập Về Nhà Ngay</strong>. Sau khi giáo viên chấm, điểm số cùng nhận xét và giọng nói sửa bài sẽ hiển thị tại đây.</p>' +
        '</div>';
      return;
    }

    if (statusBadge) {
      if (submission.status === 'graded') {
        statusBadge.className = 'status-badge status-graded';
        statusBadge.textContent = 'Đã chấm • ' + submission.score + '/10 điểm';
      } else {
        statusBadge.className = 'status-badge status-submitted';
        statusBadge.textContent = 'Đã nộp • Chờ giáo viên chấm';
      }
    }

    const mediaLabel =
      submission.media_type === 'video'
        ? 'Video bài làm em đã nộp'
        : 'Ghi âm bài làm em đã nộp';

    let teacherReviewHtml = '';
    if (submission.status === 'graded' || submission.teacher_comment || submission.teacher_voice_url) {
      const voiceBtnHtml = submission.teacher_voice_url
        ? '<div class="media-player-box" style="flex-direction:column;align-items:stretch;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">' +
          '<span style="font-weight: 700; font-size: 0.875rem; color: var(--color-primary);">Phản hồi giọng nói (Voice Feedback) của Giáo viên</span>' +
          '<span style="font-size: 0.8125rem; color: var(--color-muted-foreground);">Chấm lúc: ' +
          escapeHtml(submission.graded_at || 'Hôm nay') +
          '</span>' +
          '</div>' +
          window.StudySnapAudio.renderVoicePlayer({
            id: 'student-view-teacher-voice-' + submission.submission_id,
            url: submission.teacher_voice_url,
            duration: submission.teacher_voice_duration || '00:35',
            label: 'Voice Feedback của Giáo viên',
            fallbackText: submission.teacher_comment || '你的汉语发音很标准，继续加油！',
            lang: 'vi-VN',
            variant: 'teacher'
          }) +
          '</div>'
        : '';

      teacherReviewHtml =
        '<div class="voice-feedback-box">' +
        '<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px;">' +
        '<strong style="font-size: 0.9375rem; color: var(--color-foreground);">Nhận xét chi tiết từ Giáo viên</strong>' +
        (submission.score !== '' && submission.score !== null
          ? '<span class="status-badge status-graded">Điểm: ' + escapeHtml(submission.score) + '/10</span>'
          : '') +
        '</div>' +
        '<p class="matrix-teacher-note">' +
        escapeHtml(submission.teacher_comment || 'Giáo viên đã gửi phản hồi bằng giọng nói cho bài làm của em.') +
        '</p>' +
        voiceBtnHtml +
        '</div>';
    } else {
      teacherReviewHtml =
        '<div class="voice-feedback-box">' +
        '<div style="font-weight: 700; font-size: 0.9375rem; color: var(--color-foreground); margin-bottom: 4px;">Đang chờ Giáo viên chấm &amp; phản hồi</div>' +
        '<p style="font-size: 0.875rem; color: var(--color-muted-foreground); margin: 0;">' +
        'Bài làm của em đã được hệ thống lưu lúc ' +
        escapeHtml(submission.submitted_at) +
        '. Em vẫn có thể thu âm lại hoặc bổ sung ghi chú nếu muốn cập nhật bài nộp.' +
        '</p>' +
        '</div>';
    }

    bodyEl.innerHTML =
      '<div class="assignment-brief-box">' +
      '<div class="assignment-brief-title">Bài nộp của em • ' +
      escapeHtml(submission.submitted_at || 'Vừa nộp') +
      '</div>' +
      '<p class="assignment-brief-desc">Ghi chú của em: "' +
      escapeHtml(submission.student_note || 'Em gửi bài tập về nhà ạ.') +
      '"</p>' +
      '<div class="media-player-box">' +
      window.StudySnapAudio.renderVoicePlayer({
        id: 'student-own-sub-' + submission.submission_id,
        url: submission.media_url,
        duration: submission.media_duration || '01:15',
        label: mediaLabel,
        fallbackText: '老师好，我是越南学生，这是我的汉语作业录音。',
        lang: 'zh-CN',
        variant: 'student'
      }) +
      '</div>' +
      '</div>' +
      teacherReviewHtml;
  }

  function renderPersonalHomeworkMatrix(student) {
    const tbody = document.getElementById('student-personal-matrix-tbody');
    const summaryBadge = document.getElementById('student-table-summary-badge');
    if (!tbody) return;

    if (state.assignments.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-muted-foreground);">' +
          'Hiện giáo viên chưa giao bài tập về nhà mới.' +
        '</td></tr>';
      if (summaryBadge) summaryBadge.textContent = '0/0 bài tập';
      return;
    }

    let completed = 0;
    tbody.innerHTML = state.assignments
      .map(function (asg) {
        const sub = findSubmission(asg.assignment_id, student.student_id);
        let statusHtml = '<span class="status-badge status-missing">Chưa làm</span>';
        let scoreHtml = '<span class="mono-text tabular-nums" style="color: var(--color-muted-foreground);">—</span>';
        let feedbackHtml =
          '<p class="matrix-teacher-note">Em chưa nộp bài này. Hãy thu âm hoặc tải video nộp trước hạn ' +
          escapeHtml(asg.due_date) +
          '.</p>';
        let btnText = 'Làm & Nộp bài';

        if (sub) {
          completed++;
          if (sub.status === 'graded') {
            statusHtml = '<span class="status-badge status-graded">Đã chữa &amp; Có phản hồi</span>';
            scoreHtml = '<strong class="mono-text tabular-nums">' + escapeHtml(sub.score) + ' / 10</strong>';
            feedbackHtml =
              '<div class="matrix-cell-content">' +
              '<p class="matrix-teacher-note">' +
              escapeHtml(sub.teacher_comment || 'Đã chấm điểm.') +
              '</p>' +
              (sub.teacher_voice_url
                ? window.StudySnapAudio.renderVoicePlayer({
                    id: 'student-matrix-voice-' + sub.submission_id,
                    url: sub.teacher_voice_url,
                    duration: sub.teacher_voice_duration || '00:35',
                    label: 'Voice GV',
                    fallbackText: sub.teacher_comment || '你的汉语发音很标准，继续加油！',
                    lang: 'vi-VN',
                    compact: true,
                    variant: 'teacher'
                  })
                : '') +
              '</div>';
            btnText = 'Xem chi tiết';
          } else {
            statusHtml = '<span class="status-badge status-submitted">Đã nộp • Chờ chấm</span>';
            scoreHtml = '<span class="mono-text tabular-nums">Chờ chấm</span>';
            feedbackHtml =
              '<p class="matrix-teacher-note">Đã nộp lúc ' +
              escapeHtml(sub.submitted_at) +
              '. Đang chờ giáo viên chấm và ghi âm nhận xét.</p>';
            btnText = 'Cập nhật bài nộp';
          }
        }

        return (
          '<tr>' +
          '<td>' +
          '<div style="font-weight: 700; color: var(--color-foreground);">' +
          escapeHtml(asg.title) +
          '</div>' +
          '<div style="font-size: 0.8125rem; color: var(--color-muted-foreground);">' +
          escapeHtml(asg.lesson_tag) +
          '</div>' +
          '</td>' +
          '<td class="mono-text tabular-nums">' +
          escapeHtml(asg.due_date) +
          '</td>' +
          '<td>' +
          statusHtml +
          '</td>' +
          '<td>' +
          scoreHtml +
          '</td>' +
          '<td>' +
          feedbackHtml +
          '</td>' +
          '<td>' +
          '<button type="button" class="btn btn-outline btn-sm" data-select-hw-row="' +
          escapeHtml(asg.assignment_id) +
          '">' +
          escapeHtml(btnText) +
          '</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    if (summaryBadge) {
      summaryBadge.textContent = 'Đã hoàn thành ' + completed + '/' + state.assignments.length + ' bài tập';
    }

    tbody.querySelectorAll('[data-select-hw-row]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const asgId = btn.getAttribute('data-select-hw-row');
        if (!asgId) return;
        ui.selectedAssignmentId = asgId;
        renderHomeworkSection();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function renderPendingMediaPreview() {
    const previewEl = document.getElementById('student-pending-voice-preview');
    if (!previewEl) return;
    if (!ui.pendingMedia || !ui.pendingMedia.media_url) {
      previewEl.innerHTML = '';
      return;
    }
    previewEl.innerHTML = window.StudySnapAudio.renderVoicePlayer({
      id: 'student-draft-recording',
      url: ui.pendingMedia.media_url,
      duration: ui.pendingMedia.media_duration || '01:12',
      label: 'Nghe thử bản thu trước khi nộp',
      fallbackText: '老师好，我是越南学生，这是我的汉语作业录音。',
      lang: 'zh-CN',
      variant: 'student'
    });
  }

  function initHomeworkEvents() {
    const selectEl = document.getElementById('student-assignment-select');
    if (selectEl) {
      selectEl.addEventListener('change', function () {
        ui.selectedAssignmentId = selectEl.value;
        ui.pendingMedia = null;
        const statusText = document.getElementById('student-rec-status-text');
        if (statusText) statusText.textContent = 'Sẵn sàng thu âm hoặc chọn file';
        renderPendingMediaPreview();
        renderHomeworkSection();
      });
    }

    const btnStartRec = document.getElementById('btn-student-start-rec');
    const btnStopRec = document.getElementById('btn-student-stop-rec');
    const recZone = document.getElementById('student-recorder-zone');
    const recStatusText = document.getElementById('student-rec-status-text');
    const fileInput = document.getElementById('student-file-upload');

    if (btnStartRec && btnStopRec) {
      btnStartRec.addEventListener('click', function () {
        btnStartRec.style.display = 'none';
        btnStopRec.style.display = 'inline-flex';
        if (recZone) recZone.classList.add('is-recording');

        window.StudySnapAudio.startRecording(
          function (durationText) {
            if (recStatusText) recStatusText.textContent = 'Đang thu âm... ' + durationText;
          },
          function (result) {
            btnStartRec.style.display = 'inline-flex';
            btnStopRec.style.display = 'none';
            if (recZone) recZone.classList.remove('is-recording');
            ui.pendingMedia = {
              media_type: 'audio',
              media_url: result.dataUrl,
              media_duration: result.duration
            };
            if (recStatusText) {
              recStatusText.textContent = 'Đã thu âm xong (' + result.duration + ')';
            }
            renderPendingMediaPreview();
            showToast('Đã thu âm xong (' + result.duration + '). Em có thể nghe lại hoặc bấm "Nộp Bài Tập Về Nhà Ngay".');
          },
          function (errMsg) {
            btnStartRec.style.display = 'inline-flex';
            btnStopRec.style.display = 'none';
            if (recZone) recZone.classList.remove('is-recording');
            ui.pendingMedia = {
              media_type: 'audio',
              media_url: 'demo:student-recorded-' + Date.now(),
              media_duration: '01:12'
            };
            if (recStatusText) {
              recStatusText.textContent = 'Đã tạo bản thu âm (01:12)';
            }
            renderPendingMediaPreview();
            showToast(errMsg + ' — Đã gắn bản thu âm giả lập (01:12) để em nộp thử.');
          }
        );
      });

      btnStopRec.addEventListener('click', function () {
        window.StudySnapAudio.stopRecording();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        window.StudySnapAudio.readUploadedMediaFile(file, function (mediaInfo) {
          ui.pendingMedia = {
            media_type: mediaInfo.mediaType,
            media_url: mediaInfo.dataUrl,
            media_duration: mediaInfo.duration
          };
          if (recStatusText) {
            recStatusText.textContent =
              'Đã chọn: ' + mediaInfo.fileName + ' (' + mediaInfo.duration + ')';
          }
          renderPendingMediaPreview();
          showToast('Đã tải file "' + mediaInfo.fileName + '". Nhấn "Nộp Bài Tập Về Nhà Ngay" để gửi!');
        });
      });
    }

    const formEl = document.getElementById('student-submit-hw-form');
    if (formEl) {
      formEl.addEventListener('submit', async function (e) {
        e.preventDefault();
        const student = getActiveStudent();
        const noteArea = document.getElementById('student-note-textarea');
        const noteText = noteArea ? noteArea.value.trim() : '';
        const existingSub = findSubmission(ui.selectedAssignmentId, student.student_id);

        const now = new Date();
        const timestamp =
          String(now.getDate()).padStart(2, '0') +
          '/' +
          String(now.getMonth() + 1).padStart(2, '0') +
          '/2026 ' +
          String(now.getHours()).padStart(2, '0') +
          ':' +
          String(now.getMinutes()).padStart(2, '0');

        const mediaData = ui.pendingMedia || {
          media_type: existingSub ? existingSub.media_type : 'audio',
          media_url: existingSub ? existingSub.media_url : 'demo:student-' + student.student_id + '-' + Date.now(),
          media_duration: existingSub ? existingSub.media_duration : '01:15'
        };

        const submissionRecord = {
          submission_id: existingSub ? existingSub.submission_id : 'SUB_' + Date.now(),
          assignment_id: ui.selectedAssignmentId,
          student_id: student.student_id,
          submitted_at: timestamp,
          student_note: noteText || 'Em nộp bản thu âm bài tập về nhà ạ.',
          media_type: mediaData.media_type,
          media_url: mediaData.media_url,
          media_duration: mediaData.media_duration,
          status: existingSub && existingSub.status === 'graded' ? 'graded' : 'submitted',
          score: existingSub ? existingSub.score : '',
          teacher_comment: existingSub ? existingSub.teacher_comment : '',
          teacher_voice_url: existingSub ? existingSub.teacher_voice_url : '',
          teacher_voice_duration: existingSub ? existingSub.teacher_voice_duration : '',
          graded_at: existingSub ? existingSub.graded_at : ''
        };

        const existingIndex = state.submissions.findIndex(function (s) {
          return s.assignment_id === ui.selectedAssignmentId && s.student_id === student.student_id;
        });

        if (existingIndex >= 0) {
          state.submissions[existingIndex] = submissionRecord;
        } else {
          state.submissions.push(submissionRecord);
        }

        window.StudySnapStore.saveState(state);
        ui.pendingMedia = null;
        renderPendingMediaPreview();
        if (recStatusText) {
          recStatusText.textContent = 'Đã nộp thành công lúc ' + timestamp;
        }

        renderStudentHeaderAndStats();
        renderHomeworkSection();
        showToast('Đã nộp Bài Tập Về Nhà thành công cho tài khoản ' + student.full_name + '!');

        await window.StudySnapStore.syncPostToGas(state, {
          action: 'submitHomework',
          assignment_id: submissionRecord.assignment_id,
          student_id: submissionRecord.student_id,
          student_note: submissionRecord.student_note,
          media_type: submissionRecord.media_type,
          media_url: submissionRecord.media_url,
          media_duration: submissionRecord.media_duration,
          media_base64:
            mediaData.media_url && String(mediaData.media_url).indexOf('data:') === 0
              ? mediaData.media_url
              : '',
          media_mime_type:
            mediaData.media_type === 'video' ? 'video/mp4' : 'audio/webm'
        });
      });
    }
  }

  // =========================================================================
  // 3. TAB 2: INTERACTIVE EXIT TICKET (BÀI LUYỆN TẬP CUỐI GIỜ)
  // =========================================================================
  function renderExitTicketSection() {
    const student = getActiveStudent();
    const selectorEl = document.getElementById('student-exit-ticket-selector');

    if (selectorEl) {
      selectorEl.innerHTML = state.exitTickets
        .map(function (ticket) {
          const isActive = ticket.ticket_id === ui.selectedTicketId;
          return (
            '<button type="button" class="filter-pill' +
            (isActive ? ' is-active' : '') +
            '" data-select-ticket="' +
            escapeHtml(ticket.ticket_id) +
            '">' +
            escapeHtml(ticket.lesson_tag + ' (' + ticket.questions.length + ' câu)') +
            '</button>'
          );
        })
        .join('');

      selectorEl.querySelectorAll('[data-select-ticket]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const tId = btn.getAttribute('data-select-ticket');
          if (!tId) return;
          ui.selectedTicketId = tId;
          ui.quizQuestionIndex = 0;
          ui.quizSelectedOption = null;
          ui.quizAnswered = false;
          ui.quizScore = 0;
          ui.quizFinished = false;
          renderExitTicketSection();
        });
      });
    }

    const activeTicket =
      state.exitTickets.find(function (t) {
        return t.ticket_id === ui.selectedTicketId;
      }) || state.exitTickets[0];

    const quizBox = document.getElementById('student-quiz-active-box');
    if (quizBox && activeTicket) {
      const totalQ = activeTicket.questions.length;

      if (ui.quizFinished) {
        quizBox.innerHTML =
          '<div class="assignment-brief-box">' +
          '<span class="status-badge status-graded">Đã hoàn thành bài luyện tập cuối giờ</span>' +
          '<h3 style="margin: 10px 0 6px;">Kết quả của ' +
          escapeHtml(student.full_name) +
          ': ' +
          ui.quizScore +
          ' / ' +
          totalQ +
          ' câu chính xác</h3>' +
          '<p style="font-size: 0.9375rem; color: var(--color-muted-foreground); margin-bottom: 14px;">' +
          'Kết quả đã được lưu tự động vào hệ thống để giáo viên theo dõi mức độ hiểu bài của em.' +
          '</p>' +
          '<button type="button" class="btn btn-primary" id="btn-student-retry-quiz">Làm lại đề này</button>' +
          '</div>';

        const btnRetry = document.getElementById('btn-student-retry-quiz');
        if (btnRetry) {
          btnRetry.addEventListener('click', function () {
            ui.quizQuestionIndex = 0;
            ui.quizSelectedOption = null;
            ui.quizAnswered = false;
            ui.quizScore = 0;
            ui.quizFinished = false;
            renderExitTicketSection();
          });
        }
      } else {
        const q = activeTicket.questions[ui.quizQuestionIndex] || activeTicket.questions[0];
        const progressPercent = Math.round(((ui.quizQuestionIndex + 1) / totalQ) * 100);

        const optionsHtml = q.options
          .map(function (optText, idx) {
            let statusClass = '';
            if (ui.quizAnswered) {
              if (idx === q.correctIndex) statusClass = ' is-correct';
              else if (idx === ui.quizSelectedOption) statusClass = ' is-wrong';
            }
            return (
              '<button type="button" class="quiz-option' +
              statusClass +
              '" data-quiz-option-idx="' +
              idx +
              '"' +
              (ui.quizAnswered ? ' disabled' : '') +
              '>' +
              '<span>' +
              escapeHtml(optText) +
              '</span>' +
              '<span class="mono-text tabular-nums">#' +
              (idx + 1) +
              '</span>' +
              '</button>'
            );
          })
          .join('');

        const feedbackHtml = ui.quizAnswered
          ? '<div class="quiz-feedback-banner ' +
            (ui.quizSelectedOption === q.correctIndex ? 'status-graded' : 'status-submitted') +
            '">' +
            '<strong>' +
            (ui.quizSelectedOption === q.correctIndex ? 'Chính xác! ' : 'Giải thích đáp án: ') +
            '</strong>' +
            escapeHtml(q.explanation) +
            '</div>'
          : '';

        quizBox.innerHTML =
          '<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px;">' +
          '<strong style="font-size: 0.9375rem; color: var(--color-primary);">' +
          escapeHtml(activeTicket.title) +
          '</strong>' +
          '<span class="mono-text tabular-nums" style="font-size: 0.875rem;">Câu ' +
          (ui.quizQuestionIndex + 1) +
          '/' +
          totalQ +
          '</span>' +
          '</div>' +
          '<div class="quiz-progress-track"><div class="quiz-progress-fill" style="width: ' +
          progressPercent +
          '%;"></div></div>' +
          '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px;">' +
          '<h3 style="margin: 0; font-size: 1.125rem;">' +
          escapeHtml(q.prompt) +
          '</h3>' +
          '<button type="button" class="btn btn-outline btn-sm" id="btn-quiz-speak">Phát âm từ khóa</button>' +
          '</div>' +
          '<div class="quiz-options-grid">' +
          optionsHtml +
          '</div>' +
          feedbackHtml +
          '<div style="display: flex; justify-content: flex-end; margin-top: 12px;">' +
          (ui.quizAnswered
            ? '<button type="button" class="btn btn-primary" id="btn-quiz-next">' +
              (ui.quizQuestionIndex + 1 < totalQ ? 'Câu tiếp theo →' : 'Hoàn thành & Lưu kết quả') +
              '</button>'
            : '') +
          '</div>';

        const btnSpeak = document.getElementById('btn-quiz-speak');
        if (btnSpeak) {
          btnSpeak.addEventListener('click', function () {
            window.StudySnapAudio.speakText(q.speakWord || q.prompt, 'zh-CN');
          });
        }

        quizBox.querySelectorAll('[data-quiz-option-idx]').forEach(function (optBtn) {
          optBtn.addEventListener('click', function () {
            if (ui.quizAnswered) return;
            const picked = parseInt(optBtn.getAttribute('data-quiz-option-idx'), 10);
            ui.quizSelectedOption = picked;
            ui.quizAnswered = true;
            if (picked === q.correctIndex) {
              ui.quizScore++;
            }
            renderExitTicketSection();
          });
        });

        const btnNext = document.getElementById('btn-quiz-next');
        if (btnNext) {
          btnNext.addEventListener('click', async function () {
            if (ui.quizQuestionIndex + 1 < totalQ) {
              ui.quizQuestionIndex++;
              ui.quizSelectedOption = null;
              ui.quizAnswered = false;
              renderExitTicketSection();
            } else {
              ui.quizFinished = true;
              const now = new Date();
              const logRecord = {
                record_id: 'EXT_' + Date.now(),
                ticket_id: activeTicket.ticket_id,
                student_id: student.student_id,
                student_name: student.full_name,
                score: ui.quizScore,
                total: totalQ,
                submitted_at:
                  String(now.getDate()).padStart(2, '0') +
                  '/' +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  '/2026 ' +
                  String(now.getHours()).padStart(2, '0') +
                  ':' +
                  String(now.getMinutes()).padStart(2, '0')
              };
              state.exitTicketLogs.unshift(logRecord);
              window.StudySnapStore.saveState(state);
              renderExitTicketSection();
              showToast('Đã lưu kết quả bài luyện tập cuối giờ của ' + student.full_name + '!');

              await window.StudySnapStore.syncPostToGas(state, {
                action: 'submitExitTicket',
                ticket_id: logRecord.ticket_id,
                student_id: logRecord.student_id,
                student_name: logRecord.student_name,
                score: logRecord.score,
                total: logRecord.total
              });
            }
          });
        }
      }
    }

    // Render Student's personal exit ticket history
    const historyListEl = document.getElementById('student-exit-ticket-history-list');
    if (historyListEl) {
      const myLogs = (state.exitTicketLogs || []).filter(function (item) {
        return item.student_id === student.student_id;
      });

      if (myLogs.length === 0) {
        historyListEl.innerHTML =
          '<div class="assignment-brief-box">' +
          '<div class="assignment-brief-title">Chưa có lượt làm bài nào</div>' +
          '<p class="assignment-brief-desc">Hãy chọn đáp án ở khung câu hỏi bên trái để kiểm tra mức độ hiểu bài ngay sau buổi học.</p>' +
          '</div>';
      } else {
        historyListEl.innerHTML = myLogs
          .map(function (log) {
            const ticketObj = state.exitTickets.find(function (t) {
              return t.ticket_id === log.ticket_id;
            });
            const titleText = ticketObj ? ticketObj.lesson_tag : log.ticket_id;
            return (
              '<div class="media-player-box">' +
              '<div>' +
              '<div style="font-weight: 700; font-size: 0.9375rem;">' +
              escapeHtml(titleText) +
              '</div>' +
              '<div style="font-size: 0.8125rem; color: var(--color-muted-foreground);">Nộp lúc: ' +
              escapeHtml(log.submitted_at) +
              '</div>' +
              '</div>' +
              '<span class="status-badge status-graded tabular-nums">' +
              escapeHtml(log.score + '/' + log.total + ' câu đúng') +
              '</span>' +
              '</div>'
            );
          })
          .join('');
      }
    }
  }

  // =========================================================================
  // 4. TAB 3: VOCABULARY WEB APP BY LESSON (BÀI 1, BÀI 2...) & "TỔNG HỢP"
  // =========================================================================
  function getLessonGroups() {
    const groups = [];
    const map = {};
    (state.vocabulary || []).forEach(function (v) {
      if (!map[v.lesson_id]) {
        map[v.lesson_id] = {
          lesson_id: v.lesson_id,
          lesson_title: v.lesson_title || v.lesson_id,
          short_label: (v.lesson_title || v.lesson_id).split(':')[0],
          count: 0
        };
        groups.push(map[v.lesson_id]);
      }
      map[v.lesson_id].count++;
    });
    return groups;
  }

  function getFilteredVocabularyList() {
    const q = ui.vocabSearchQuery.trim().toLowerCase();
    return (state.vocabulary || []).filter(function (v) {
      const matchLesson = ui.selectedVocabLessonId === 'all' || v.lesson_id === ui.selectedVocabLessonId;
      if (!matchLesson) return false;

      const isMastered = ui.masteredIds.indexOf(v.vocab_id) !== -1;
      if (ui.vocabFilterMode === 'mastered' && !isMastered) return false;
      if (ui.vocabFilterMode === 'unmastered' && isMastered) return false;

      if (q) {
        const text = (v.word + ' ' + v.meaning_vi + ' ' + v.example_en + ' ' + v.lesson_title).toLowerCase();
        return text.indexOf(q) !== -1;
      }
      return true;
    });
  }

  function renderVocabularySection() {
    const lessonGroups = getLessonGroups();
    const totalCount = (state.vocabulary || []).length;
    const lessonBar = document.getElementById('student-vocab-lesson-bar');
    const scopeBadge = document.getElementById('student-vocab-scope-badge');

    if (lessonBar) {
      const lessonButtons = lessonGroups
        .map(function (g) {
          const isActive = ui.selectedVocabLessonId === g.lesson_id;
          return (
            '<button type="button" class="lesson-pill' +
            (isActive ? ' is-active' : '') +
            '" data-vocab-lesson="' +
            escapeHtml(g.lesson_id) +
            '">' +
            '<span>' +
            escapeHtml(g.lesson_title) +
            '</span>' +
            '<span class="lesson-count-badge">' +
            g.count +
            ' từ</span>' +
            '</button>'
          );
        })
        .join('');

      const isMasterActive = ui.selectedVocabLessonId === 'all';
      const masterButton =
        '<button type="button" class="lesson-pill is-master-review' +
        (isMasterActive ? ' is-active' : '') +
        '" data-vocab-lesson="all">' +
        '<span>Tổng hợp tất cả các bài</span>' +
        '<span class="lesson-count-badge">' +
        totalCount +
        ' từ</span>' +
        '</button>';

      lessonBar.innerHTML = lessonButtons + masterButton;

      lessonBar.querySelectorAll('[data-vocab-lesson]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const targetLesson = btn.getAttribute('data-vocab-lesson');
          if (!targetLesson) return;
          ui.selectedVocabLessonId = targetLesson;
          ui.flashcardIndex = 0;
          renderVocabularySection();
        });
      });
    }

    const filteredVocab = getFilteredVocabularyList();
    if (ui.flashcardIndex >= filteredVocab.length) {
      ui.flashcardIndex = 0;
    }

    if (scopeBadge) {
      if (ui.selectedVocabLessonId === 'all') {
        scopeBadge.textContent = 'Đang mở: Tổng hợp tất cả (' + filteredVocab.length + ' từ)';
      } else {
        const g = lessonGroups.find(function (item) {
          return item.lesson_id === ui.selectedVocabLessonId;
        });
        scopeBadge.textContent = 'Đang mở: ' + (g ? g.lesson_title : ui.selectedVocabLessonId) + ' (' + filteredVocab.length + ' từ)';
      }
    }

    // Update Interactive Flashcard Stage
    const currentWord = filteredVocab[ui.flashcardIndex] || null;
    const fcLessonBadge = document.getElementById('fc-lesson-badge');
    const fcCounter = document.getElementById('fc-index-counter');
    const fcWord = document.getElementById('fc-word-text');
    const fcIpa = document.getElementById('fc-ipa-text');
    const fcMeaningPanel = document.getElementById('fc-meaning-panel');
    const fcMeaningVi = document.getElementById('fc-meaning-vi');
    const fcExampleEn = document.getElementById('fc-example-en');
    const fcExampleVi = document.getElementById('fc-example-vi');
    const fcMasterBtnText = document.getElementById('fc-master-btn-text');

    if (currentWord) {
      const isMastered = ui.masteredIds.indexOf(currentWord.vocab_id) !== -1;
      if (fcLessonBadge) fcLessonBadge.textContent = currentWord.lesson_title;
      if (fcCounter) fcCounter.textContent = ui.flashcardIndex + 1 + ' / ' + filteredVocab.length;
      if (fcWord) fcWord.textContent = currentWord.word;
      if (fcIpa) fcIpa.textContent = currentWord.ipa + ' • ' + currentWord.part_of_speech;
      if (fcMeaningVi) fcMeaningVi.textContent = currentWord.meaning_vi;
      if (fcExampleEn) fcExampleEn.textContent = '"' + currentWord.example_en + '"';
      if (fcExampleVi) fcExampleVi.textContent = currentWord.example_vi || '';
      if (fcMeaningPanel) {
        fcMeaningPanel.style.display = ui.showMeaningOnCard ? 'block' : 'none';
      }
      if (fcMasterBtnText) {
        fcMasterBtnText.textContent = isMastered ? 'Đã thuộc từ này (Bấm để bỏ)' : 'Đánh dấu: Đã thuộc từ này';
      }
    } else {
      if (fcLessonBadge) fcLessonBadge.textContent = 'Trống';
      if (fcCounter) fcCounter.textContent = '0 / 0';
      if (fcWord) fcWord.textContent = 'Không có từ phù hợp';
      if (fcIpa) fcIpa.textContent = 'Hãy đổi bộ lọc hoặc từ khóa tìm kiếm';
      if (fcMeaningPanel) fcMeaningPanel.style.display = 'none';
    }

    // Render Vocabulary Grid List
    const gridEl = document.getElementById('student-vocab-cards-grid');
    if (gridEl) {
      if (filteredVocab.length === 0) {
        gridEl.innerHTML =
          '<div class="assignment-brief-box">' +
          '<div class="assignment-brief-title">Không tìm thấy từ vựng</div>' +
          '<p class="assignment-brief-desc">Hãy chọn bộ lọc "Tất cả" hoặc xóa từ khóa tìm kiếm để xem toàn bộ từ vựng của bài học.</p>' +
          '</div>';
      } else {
        gridEl.innerHTML = filteredVocab
          .map(function (v) {
            const isMastered = ui.masteredIds.indexOf(v.vocab_id) !== -1;
            return (
              '<div class="vocab-item-row' +
              (isMastered ? ' is-mastered' : '') +
              '">' +
              '<div>' +
              '<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">' +
              '<strong style="font-family: var(--font-display); font-size: 1.25rem; color: var(--color-foreground);">' +
              escapeHtml(v.word) +
              '</strong>' +
              '<span class="status-badge ' +
              (isMastered ? 'status-graded' : 'status-submitted') +
              '">' +
              escapeHtml(v.lesson_title.split(':')[0]) +
              '</span>' +
              '</div>' +
              '<div class="mono-text" style="font-size: 0.8125rem; color: var(--color-primary); margin-bottom: 6px;">' +
              escapeHtml(v.ipa + ' • ' + v.part_of_speech) +
              '</div>' +
              '<div style="font-weight: 700; font-size: 0.9375rem; margin-bottom: 4px;">' +
              escapeHtml(v.meaning_vi) +
              '</div>' +
              '<p style="margin: 0; font-size: 0.875rem; color: var(--color-muted-foreground);">"' +
              escapeHtml(v.example_en) +
              '"</p>' +
              '</div>' +
              '<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: 8px;">' +
              '<button type="button" class="btn btn-outline btn-sm" data-speak-vocab="' +
              escapeHtml(v.word) +
              '">Phát âm</button>' +
              '<button type="button" class="btn ' +
              (isMastered ? 'btn-secondary' : 'btn-primary') +
              ' btn-sm" data-toggle-master-id="' +
              escapeHtml(v.vocab_id) +
              '">' +
              (isMastered ? 'Đã thuộc ✓' : 'Đánh dấu thuộc') +
              '</button>' +
              '</div>' +
              '</div>'
            );
          })
          .join('');

        gridEl.querySelectorAll('[data-speak-vocab]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const word = btn.getAttribute('data-speak-vocab');
            if (word) window.StudySnapAudio.speakText(word, 'zh-CN');
          });
        });

        gridEl.querySelectorAll('[data-toggle-master-id]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const vId = btn.getAttribute('data-toggle-master-id');
            if (!vId) return;
            toggleMasteredVocab(vId);
          });
        });
      }
    }
  }

  function toggleMasteredVocab(vocabId) {
    const idx = ui.masteredIds.indexOf(vocabId);
    if (idx >= 0) {
      ui.masteredIds.splice(idx, 1);
    } else {
      ui.masteredIds.push(vocabId);
    }
    saveMasteredIds();
    renderStudentHeaderAndStats();
    renderVocabularySection();
  }

  function initVocabularyEvents() {
    const stageEl = document.getElementById('student-flashcard-stage');
    const btnSpeak = document.getElementById('btn-fc-speak');
    const btnToggleMeaning = document.getElementById('btn-fc-toggle-meaning');
    const btnPrev = document.getElementById('btn-fc-prev');
    const btnNext = document.getElementById('btn-fc-next');
    const btnMaster = document.getElementById('btn-fc-master-toggle');

    if (stageEl) {
      stageEl.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        ui.showMeaningOnCard = !ui.showMeaningOnCard;
        renderVocabularySection();
      });
    }

    if (btnToggleMeaning) {
      btnToggleMeaning.addEventListener('click', function () {
        ui.showMeaningOnCard = !ui.showMeaningOnCard;
        renderVocabularySection();
      });
    }

    if (btnSpeak) {
      btnSpeak.addEventListener('click', function () {
        const list = getFilteredVocabularyList();
        const item = list[ui.flashcardIndex];
        if (item) {
          const cleanExample = String(item.example_en || '').split('(')[0].trim();
          window.StudySnapAudio.speakText(item.word + '。' + cleanExample, 'zh-CN');
        }
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', function () {
        const list = getFilteredVocabularyList();
        if (!list.length) return;
        ui.flashcardIndex = (ui.flashcardIndex - 1 + list.length) % list.length;
        renderVocabularySection();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', function () {
        const list = getFilteredVocabularyList();
        if (!list.length) return;
        ui.flashcardIndex = (ui.flashcardIndex + 1) % list.length;
        renderVocabularySection();
      });
    }

    if (btnMaster) {
      btnMaster.addEventListener('click', function () {
        const list = getFilteredVocabularyList();
        const item = list[ui.flashcardIndex];
        if (item) {
          toggleMasteredVocab(item.vocab_id);
        }
      });
    }

    const searchInput = document.getElementById('student-vocab-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        ui.vocabSearchQuery = searchInput.value;
        ui.flashcardIndex = 0;
        renderVocabularySection();
      });
    }

    document.querySelectorAll('[data-vocab-filter]').forEach(function (pill) {
      pill.addEventListener('click', function () {
        const mode = pill.getAttribute('data-vocab-filter');
        if (!mode) return;
        ui.vocabFilterMode = mode;
        ui.flashcardIndex = 0;
        document.querySelectorAll('[data-vocab-filter]').forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('data-vocab-filter') === mode);
        });
        renderVocabularySection();
      });
    });
  }

  // =========================================================================
  // 5. GLOBAL NAVIGATION, SHORTCUTS & GOOGLE SHEETS MODAL
  // =========================================================================
  function initGlobalEvents() {
    document.querySelectorAll('[data-student-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const tab = btn.getAttribute('data-student-tab');
        if (tab) switchTab(tab);
      });
    });

    const btnGoVocabAll = document.getElementById('btn-banner-go-vocab-all');
    if (btnGoVocabAll) {
      btnGoVocabAll.addEventListener('click', function () {
        ui.selectedVocabLessonId = 'all';
        ui.flashcardIndex = 0;
        switchTab('vocabulary');
        renderVocabularySection();
      });
    }

    const btnGoExitTicket = document.getElementById('btn-banner-go-exit-ticket');
    if (btnGoExitTicket) {
      btnGoExitTicket.addEventListener('click', function () {
        switchTab('exit-ticket');
        renderExitTicketSection();
      });
    }

    const btnLogout = document.getElementById('btn-student-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function () {
        window.StudySnapAuth.logout();
      });
    }
  }

  function renderAll() {
    renderStudentHeaderAndStats();
    renderHomeworkSection();
    renderExitTicketSection();
    renderVocabularySection();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initGlobalEvents();
    initHomeworkEvents();
    initVocabularyEvents();
    renderAll();

    if (window.StudySnapStore.getGasUrl()) {
      window.StudySnapStore.fetchBootstrapFromGas(state).then(function () {
        state = window.StudySnapStore.loadState();
        renderAll();
      });
    }
  });
})();
