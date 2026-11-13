/**
 * StudySnap — Logic Cổng Học Sinh (`student.html`)
 * - Bảo vệ trang theo vai trò `student` (`StudySnapAuth.enforceRole('student')`)
 * - Nộp bài luyện tập cuối buổi (Ghi âm trực tiếp hoặc tải file Audio/Video) cho đúng tài khoản học sinh đang đăng nhập
 * - Xem điểm số, nhận xét văn bản và bấm nghe trực tiếp Voice Feedback của Giáo viên
 * - Bảng theo dõi tiến độ & nhận xét của riêng học sinh đang đăng nhập
 * - Bài luyện tập cuối buổi tương tác & lưu lịch sử cá nhân
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
    activeTab: 'practice',
    selectedHomeworkSession: 'all',
    selectedAssignmentId: state.assignments[0] ? state.assignments[0].assignment_id : 'BVN01_1',
    pendingMedia: null,

    // Practice state
    selectedExerciseId: (state.practiceExercises && state.practiceExercises[0]) ? state.practiceExercises[0].exercise_id : 'EX_HSK1_BAI_1',
    practiceAnswers: {},
    selectedMatchingLeft: null,
    selectedWordBankChip: null,
    selectedTargetBlank: null,
    matchingShuffledRight: {},
    practiceViewingResult: false,

    // Exit Ticket state
    selectedTicketId: state.exitTickets[0] ? state.exitTickets[0].ticket_id : 'EXIT_BAI_1',
    quizQuestionIndex: 0,
    quizSelectedOption: null,
    quizAnswered: false,
    quizScore: 0,
    quizFinished: false,

    // Vocabulary state
    selectedVocabLessonId: 'bai-1',
    vocabFilterMode: 'all',
    vocabSearchQuery: '',
    flashcardIndex: 0,
    showMeaningOnCard: true,
    vocabSuiteConfigured: false,
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
      practice: document.getElementById('student-tab-practice'),
      'exit-ticket': document.getElementById('student-tab-exit-ticket'),
      vocabulary: document.getElementById('student-tab-vocabulary')
    };

    Object.keys(tabMap).forEach(function (key) {
      if (tabMap[key]) {
        tabMap[key].classList.toggle('is-active', key === tabName);
      }
    });

    if (tabName === 'practice') {
      renderPracticeSection();
    } else if (tabName === 'vocabulary') {
      if (typeof fcRender === 'function') fcRender();
    }
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
        '. Làm bài luyện tập cuối buổi có hệ thống tự chấm, nộp bài thu âm trực tiếp hoặc tải video để nghe giáo viên sửa phát âm bằng giọng nói (Voice Feedback) và ôn từ vựng theo từng bài hoặc tổng hợp.';
    }
    if (accountBadge) {
      accountBadge.textContent = student.student_id + ' • ' + student.full_name;
    }

    const visibleAssignments = getStudentAssignments(student);
    const totalAssignments = visibleAssignments.length;
    let submittedCount = 0;
    let gradedWithVoiceCount = 0;
    let scoreTotal = 0;
    let scoreCount = 0;

    visibleAssignments.forEach(function (asg) {
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

    const visiblePracticeExercises = getVisiblePracticeExercises(student);
    const totalPracticeCount = visiblePracticeExercises.length;
    let submittedPracticeCount = 0;
    visiblePracticeExercises.forEach(function (ex) {
      const hasSubmitted = (state.practiceSubmissions || []).some(function (sub) {
        return String(sub.exercise_id) === String(ex.exercise_id) && String(sub.student_id) === String(student.student_id);
      });
      if (hasSubmitted) {
        submittedPracticeCount++;
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
    const elPracticeScore = document.getElementById('student-stat-practice-score');
    const elPracticeRating = document.getElementById('student-stat-practice-rating');

    if (elSubmitted) elSubmitted.textContent = submittedPracticeCount + '/' + totalPracticeCount;
    if (elGraded) elGraded.textContent = String(gradedWithVoiceCount);
    if (elAvg) elAvg.textContent = String(avgScore);
    if (elVocab) elVocab.textContent = validMasteredCount + '/' + totalVocab;

    const currentEx = getActiveExercise();
    const practiceSub = currentEx ? findStudentPracticeSubmission(currentEx.exercise_id) : null;
    if (elPracticeScore) {
      elPracticeScore.textContent = practiceSub
        ? practiceSub.total_score + '/' + (practiceSub.max_score || (currentEx && currentEx.total_score) || 35)
        : '—';
    }
    if (elPracticeRating) {
      if (practiceSub) {
        const r = practiceSub.rating;
        elPracticeRating.textContent =
          r === 'very_good' ? 'Rất tốt 🌟' : r === 'good' ? 'Khá 👍' : 'Cần ôn 📚';
      } else {
        elPracticeRating.textContent = 'Chưa làm';
      }
    }
  }

  // =========================================================================
  // 2. TAB 1: HOMEWORK SUBMISSION & TEACHER VOICE FEEDBACK VIEWER
  // =========================================================================
  function getStudentAssignments(student) {
    const activeList = (state.assignments || []).filter(function (asg) {
      if (String(asg.require_media || '').trim().toLowerCase() === 'vocab') return false;
      const clsLower = String(asg.class_name || '').trim().toLowerCase();
      return Boolean(clsLower && clsLower !== 'unassigned');
    });
    if (!student) return activeList;
    const sClass = String(student.class_name || '').trim().toLowerCase();
    return activeList.filter(function (asg) {
      const clsLower = String(asg.class_name || '').trim().toLowerCase();
      if (clsLower === 'all') return true;
      return Boolean(sClass && clsLower === sClass);
    });
  }

  function getStudentVocabAssignments(student) {
    const activeList = (state.assignments || []).filter(function (asg) {
      if (String(asg.require_media || '').trim().toLowerCase() !== 'vocab') return false;
      const clsLower = String(asg.class_name || '').trim().toLowerCase();
      return Boolean(clsLower && clsLower !== 'unassigned');
    });
    if (!student) return activeList;
    const sClass = String(student.class_name || '').trim().toLowerCase();
    return activeList.filter(function (asg) {
      const clsLower = String(asg.class_name || '').trim().toLowerCase();
      if (clsLower === 'all') return true;
      return Boolean(sClass && clsLower === sClass);
    });
  }

  function renderHomeworkSection() {
    const student = getActiveStudent();
    const selectEl = document.getElementById('student-assignment-select');
    const studentAssignments = getStudentAssignments(student);

    // Trích xuất toàn bộ các Buổi học có bài tập
    const sessions = [];
    studentAssignments.forEach(function (asg) {
      const s = (asg.session_tag || 'Buổi 1').trim();
      if (s && sessions.indexOf(s) === -1) {
        sessions.push(s);
      }
    });

    if (ui.selectedHomeworkSession !== 'all' && sessions.indexOf(ui.selectedHomeworkSession) === -1 && sessions.length > 0) {
      ui.selectedHomeworkSession = 'all';
    }

    // Hiển thị thanh nút bấm chuyển Buổi học (Pills)
    const sessionPillsRow = document.getElementById('student-session-pills-row');
    if (sessionPillsRow) {
      let pillsHtml =
        '<button type="button" class="session-pill' +
        (ui.selectedHomeworkSession === 'all' ? ' is-active' : '') +
        '" data-hw-session="all">' +
        '<span>Tất cả các buổi</span>' +
        '<span class="pill-count">' + studentAssignments.length + '</span>' +
        '</button>';

      sessions.forEach(function (s) {
        const countInSession = studentAssignments.filter(function (a) {
          return (a.session_tag || 'Buổi 1').trim() === s;
        }).length;
        const isActive = ui.selectedHomeworkSession === s;
        pillsHtml +=
          '<button type="button" class="session-pill' +
          (isActive ? ' is-active' : '') +
          '" data-hw-session="' + escapeHtml(s) + '">' +
          '<span>' + escapeHtml(s) + '</span>' +
          '<span class="pill-count">' + countInSession + '</span>' +
          '</button>';
      });
      sessionPillsRow.innerHTML = pillsHtml;

      sessionPillsRow.querySelectorAll('[data-hw-session]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const s = btn.getAttribute('data-hw-session');
          ui.selectedHomeworkSession = s;
          const inSession = s === 'all'
            ? studentAssignments
            : studentAssignments.filter(function (a) { return (a.session_tag || 'Buổi 1').trim() === s; });
          if (inSession.length > 0) {
            ui.selectedAssignmentId = inSession[0].assignment_id;
            ui.pendingMedia = null;
            renderPendingMediaPreview();
          }
          renderHomeworkSection();
        });
      });
    }

    // Lọc bài tập theo Buổi học đã chọn
    const filteredAssignments = ui.selectedHomeworkSession === 'all'
      ? studentAssignments
      : studentAssignments.filter(function (a) {
          return (a.session_tag || 'Buổi 1').trim() === ui.selectedHomeworkSession;
        });

    if (filteredAssignments.length > 0 && !filteredAssignments.some(function (a) { return a.assignment_id === ui.selectedAssignmentId; })) {
      ui.selectedAssignmentId = filteredAssignments[0].assignment_id;
    }

    // Hiển thị chip chọn nhanh các bài nhỏ trong buổi
    const subtaskChipsRow = document.getElementById('student-subtask-chips-row');
    if (subtaskChipsRow) {
      if (filteredAssignments.length > 0) {
        subtaskChipsRow.style.display = 'flex';
        subtaskChipsRow.innerHTML = filteredAssignments.map(function (asg) {
          const sub = findSubmission(asg.assignment_id, student.student_id);
          const isSelected = asg.assignment_id === ui.selectedAssignmentId;
          let badgeBg = 'var(--soft)';
          let badgeFg = 'var(--muted)';
          let badgeBorder = 'rgba(45, 27, 78, 0.14)';
          let statusText = 'Chưa nộp';
          if (sub && sub.status === 'graded') {
            badgeBg = 'var(--mint-lt)';
            badgeFg = 'var(--color-success-text)';
            badgeBorder = 'var(--color-success-border)';
            statusText = '✓ ' + sub.score + 'đ';
          } else if (sub) {
            badgeBg = 'var(--ylt)';
            badgeFg = 'var(--color-warning-text)';
            badgeBorder = 'var(--color-warning-border)';
            statusText = 'Đã nộp';
          }
          return (
            '<button type="button" class="sub-asg-chip' + (isSelected ? ' is-active' : '') + '" data-subtask-id="' + escapeHtml(asg.assignment_id) + '">' +
            '<span>' + escapeHtml(asg.lesson_tag || asg.title) + '</span>' +
            '<span style="font-size:0.75rem;padding:2px 8px;border-radius:var(--radius-full);background:' + badgeBg + ';color:' + badgeFg + ';border:1px solid ' + badgeBorder + ';font-weight:700;">' +
            escapeHtml(statusText) +
            '</span>' +
            '</button>'
          );
        }).join('');

        subtaskChipsRow.querySelectorAll('[data-subtask-id]').forEach(function (chip) {
          chip.addEventListener('click', function () {
            ui.selectedAssignmentId = chip.getAttribute('data-subtask-id');
            ui.pendingMedia = null;
            renderPendingMediaPreview();
            renderHomeworkSection();
          });
        });
      } else {
        subtaskChipsRow.style.display = 'none';
      }
    }

    // Cập nhật câu text tóm tắt
    const summaryText = document.getElementById('student-session-summary-text');
    if (summaryText) {
      if (ui.selectedHomeworkSession === 'all') {
        summaryText.textContent = 'Toàn bộ ' + studentAssignments.length + ' bài luyện tập cuối buổi';
      } else {
        summaryText.textContent = 'Đang xem ' + ui.selectedHomeworkSession + ' (' + filteredAssignments.length + ' bài)';
      }
    }

    if (selectEl) {
      selectEl.innerHTML = filteredAssignments.length > 0
        ? filteredAssignments
            .map(function (asg) {
              const sub = findSubmission(asg.assignment_id, student.student_id);
              let statusLabel = 'Chưa nộp';
              if (sub && sub.status === 'graded') {
                statusLabel = 'Đã chấm: ' + sub.score + (asg.require_media === 'practice' ? 'đ' : '/10');
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
                escapeHtml('[' + (asg.session_tag || 'Buổi 1') + '] ' + asg.title + ' (' + statusLabel + ')') +
                '</option>'
              );
            })
            .join('')
        : '<option value="">-- Chưa có bài tập cho buổi này --</option>';
    }

    const currentAsg =
      filteredAssignments.find(function (a) {
        return a.assignment_id === ui.selectedAssignmentId;
      }) || filteredAssignments[0] || studentAssignments[0] || null;

    const briefTitle = document.getElementById('student-brief-title');
    const briefDesc = document.getElementById('student-brief-desc');
    const recorderZone = document.getElementById('student-recorder-zone');
    const submitBtn = document.querySelector('#student-submit-hw-form button[type="submit"]');
    let practiceCallout = document.getElementById('practice-asg-callout');

    if (currentAsg) {
      if (briefTitle) {
        briefTitle.textContent = currentAsg.title + ' • Hạn nộp: ' + currentAsg.due_date;
      }
      if (briefDesc) {
        briefDesc.textContent = currentAsg.description;
      }

      if (currentAsg.require_media === 'practice') {
        if (recorderZone) recorderZone.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
        if (!practiceCallout && recorderZone && recorderZone.parentNode) {
          practiceCallout = document.createElement('div');
          practiceCallout.id = 'practice-asg-callout';
          recorderZone.parentNode.insertBefore(practiceCallout, recorderZone);
        }
        if (practiceCallout) {
          practiceCallout.style.display = 'block';
          practiceCallout.innerHTML =
            '<div style="background:var(--color-primary-soft);border:1.5px solid var(--color-primary);border-radius:var(--radius-xl);padding:18px 20px;margin-bottom:16px;">' +
              '<div style="font-weight:800;color:var(--color-primary-deep);font-size:1rem;margin-bottom:4px;">' +
                'Đây là Bài luyện tập cuối buổi (Làm trực tiếp trên Web)' +
              '</div>' +
              '<p style="font-size:0.875rem;color:var(--color-muted-foreground);margin-bottom:14px;line-height:1.5;">' +
                'Bài tập bao gồm các phần câu hỏi tương tác (Nối từ, Trắc nghiệm, Điền từ, Sửa câu sai, Dịch câu, Nghe hiểu). Hệ thống sẽ tự chấm điểm và xếp loại kết quả ngay sau khi nộp bài.' +
              '</p>' +
              '<button type="button" class="btn btn-primary" id="btn-student-do-practice-now" data-ex-id="' + escapeHtml(currentAsg.exercise_id || '') + '" style="font-weight:700;width:100%;">' +
                '<span>Bắt đầu làm bài luyện tập cuối buổi ngay →</span>' +
              '</button>' +
            '</div>';
          const btnDo = practiceCallout.querySelector('#btn-student-do-practice-now');
          if (btnDo) {
            btnDo.addEventListener('click', function () {
              const exId = btnDo.getAttribute('data-ex-id');
              if (exId) ui.selectedExerciseId = exId;
              switchTab('practice');
              renderPracticeSection();
            });
          }
        }
      } else {
        if (recorderZone) recorderZone.style.display = 'block';
        if (submitBtn) submitBtn.style.display = 'block';
        if (practiceCallout) practiceCallout.style.display = 'none';
      }
    } else {
      if (briefTitle) {
        briefTitle.textContent = 'Chưa có bài tập nào được giao cho lớp của em';
      }
      if (briefDesc) {
        briefDesc.textContent = 'Khi giáo viên giao bài tập mới cho lớp, hướng dẫn chi tiết và khung nộp bài sẽ hiển thị tại đây.';
      }
      if (recorderZone) recorderZone.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'none';
      if (practiceCallout) practiceCallout.style.display = 'none';
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
    if (!bodyEl) return;
    if (!assignment) {
      if (statusBadge) {
        statusBadge.className = 'status-badge status-submitted';
        statusBadge.textContent = 'Chưa có bài';
      }
      bodyEl.innerHTML =
        '<div class="assignment-brief-box">' +
        '<div class="assignment-brief-title">Chưa có bài tập cần nộp</div>' +
        '<p class="assignment-brief-desc">Hiện lớp của em chưa có bài luyện tập cuối buổi nào đang mở. Hãy kiểm tra lại khi giáo viên giao bài nhé.</p>' +
        '</div>';
      return;
    }

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
        '<p class="assignment-brief-desc">Hãy thu âm trực tiếp hoặc tải file Audio/Video ở cột bên trái và bấm <strong>Nộp Bài Luyện Tập Cuối Buổi Ngay</strong>. Sau khi giáo viên chấm, điểm số cùng nhận xét và giọng nói sửa bài sẽ hiển thị tại đây.</p>' +
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
      escapeHtml(submission.student_note || 'Em gửi bài luyện tập cuối buổi ạ.') +
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

    const studentAssignments = getStudentAssignments(student);

    if (studentAssignments.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-muted-foreground);">' +
          'Hiện giáo viên chưa giao bài luyện tập cuối buổi nào cho lớp của em.' +
        '</td></tr>';
      if (summaryBadge) summaryBadge.textContent = '0/0 bài tập';
      return;
    }

    let completed = 0;
    tbody.innerHTML = studentAssignments
      .map(function (asg) {
        const sub = findSubmission(asg.assignment_id, student.student_id);
        let statusHtml = '<span class="status-badge status-missing">Chưa làm</span>';
        let scoreHtml = '<span class="mono-text tabular-nums" style="color: var(--color-muted-foreground);">—</span>';
        let feedbackHtml =
          '<p class="matrix-teacher-note">Em chưa nộp bài này. Hãy hoàn thành trước hạn ' +
          escapeHtml(asg.due_date) +
          '.</p>';
        let btnText = asg.require_media === 'practice' ? 'Làm bài luyện tập' : 'Làm & Nộp bài';

        if (sub) {
          completed++;
          if (sub.status === 'graded') {
            statusHtml = '<span class="status-badge status-graded">Đã chữa &amp; Có phản hồi</span>';
            scoreHtml = '<strong class="mono-text tabular-nums">' + escapeHtml(sub.score) + (asg.require_media === 'practice' ? 'đ' : ' / 10') + '</strong>';
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
          '<div style="font-weight: 700; color: var(--color-foreground); display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">' +
          '<span class="status-badge" style="background: var(--color-surface-soft); color: var(--color-primary-deep); font-weight: 700; font-size: 0.75rem;">' +
          escapeHtml(asg.session_tag || 'Buổi 1') +
          '</span>' +
          '<span>' + escapeHtml(asg.title) + '</span>' +
          '</div>' +
          '<div style="font-size: 0.8125rem; color: var(--color-muted-foreground); margin-top: 2px;">' +
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
      summaryBadge.textContent = 'Đã hoàn thành ' + completed + '/' + studentAssignments.length + ' bài tập';
    }

    tbody.querySelectorAll('[data-select-hw-row]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const asgId = btn.getAttribute('data-select-hw-row');
        if (!asgId) return;
        const targetAsg = state.assignments.find(function (a) { return a.assignment_id === asgId; });
        if (targetAsg && targetAsg.session_tag) {
          ui.selectedHomeworkSession = targetAsg.session_tag;
        }
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
            btnStopRec.disabled = false;
            if (recZone) recZone.classList.remove('is-recording');
            ui.pendingMedia = {
              media_type: 'audio',
              media_url: result.dataUrl,
              mimeType: result.mimeType || 'audio/wav',
              media_duration: result.duration
            };
            if (recStatusText) {
              recStatusText.textContent = 'Đã thu âm & lọc tạp âm (' + result.duration + ')';
            }
            renderPendingMediaPreview();
            showToast(
              result.trimmedSeconds >= 1
                ? 'Đã thu âm, lọc tạp âm & cắt ' + result.trimmedSeconds + 's khoảng trống (' + result.duration + '). Em có thể nghe lại hoặc nộp bài!'
                : 'Đã thu âm & lọc tạp âm xong (' + result.duration + '). Em có thể nghe lại hoặc bấm "Nộp Bài Luyện Tập Cuối Buổi Ngay".'
            );
          },
          function (errMsg) {
            btnStartRec.style.display = 'inline-flex';
            btnStopRec.style.display = 'none';
            btnStopRec.disabled = false;
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
        btnStopRec.disabled = true;
        if (recStatusText) recStatusText.textContent = 'Đang lọc tạp âm & cắt khoảng trống...';
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
            mimeType: mediaInfo.mimeType || (mediaInfo.mediaType === 'video' ? 'video/mp4' : 'audio/webm'),
            media_duration: mediaInfo.duration
          };
          if (recStatusText) {
            recStatusText.textContent =
              'Đã chọn: ' + mediaInfo.fileName + ' (' + mediaInfo.duration + ')';
          }
          renderPendingMediaPreview();
          showToast('Đã tải file "' + mediaInfo.fileName + '". Nhấn "Nộp Bài Luyện Tập Cuối Buổi Ngay" để gửi!');
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
        const submitBtn = formEl.querySelector('button[type="submit"]');
        const loading = window.StudySnapLoading;

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

        const hasBinaryMedia = Boolean(
          mediaData.media_url && String(mediaData.media_url).indexOf('data:') === 0
        );

        const submissionRecord = {
          submission_id: existingSub ? existingSub.submission_id : 'SUB_' + Date.now(),
          assignment_id: ui.selectedAssignmentId,
          student_id: student.student_id,
          submitted_at: timestamp,
          student_note: noteText || 'Em nộp bản thu âm bài luyện tập cuối buổi ạ.',
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

        const runSubmit = async function () {
          const runSync = async function () {
            return await window.StudySnapStore.syncPostToGas(state, {
              action: 'submitHomework',
              assignment_id: submissionRecord.assignment_id,
              student_id: submissionRecord.student_id,
              student_note: submissionRecord.student_note,
              media_type: submissionRecord.media_type,
              media_url: submissionRecord.media_url,
              media_duration: submissionRecord.media_duration,
              media_base64: hasBinaryMedia ? mediaData.media_url : '',
              media_mime_type: mediaData.mimeType || (mediaData.media_type === 'video' ? 'video/mp4' : 'audio/webm')
            });
          };

          const remoteRes = loading
            ? await loading.withOverlay(
                hasBinaryMedia ? 'Đang tải tệp bài nộp lên hệ thống...' : 'Đang nộp bài luyện tập cuối buổi...',
                'Vui lòng giữ nguyên trang cho đến khi hệ thống xác nhận đã nhận bài.',
                runSync
              )
            : await runSync();

          if (remoteRes && remoteRes.ok === false) {
            showToast(remoteRes.error || 'Chưa thể nộp bài lúc này. Vui lòng thử lại sau.');
            return;
          }

          if (remoteRes && remoteRes.submission) {
            if (remoteRes.submission.submission_id) {
              submissionRecord.submission_id = remoteRes.submission.submission_id;
            }
            if (remoteRes.submission.media_url) {
              submissionRecord.media_url = remoteRes.submission.media_url;
            }
            if (remoteRes.submission.status) {
              submissionRecord.status = remoteRes.submission.status;
            }
          }

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
          showToast(
            remoteRes === null && window.StudySnapStore.getGasUrl()
              ? 'Đã lưu bài nộp trên thiết bị (mất kết nối máy chủ).'
              : 'Đã nộp Bài luyện tập cuối buổi thành công cho tài khoản ' + student.full_name + '!'
          );
        };

        if (loading && submitBtn) {
          await loading.withButtonLoading(
            submitBtn,
            hasBinaryMedia ? 'Đang tải tệp bài nộp...' : 'Đang gửi bài nộp...',
            runSubmit
          );
        } else {
          await runSubmit();
        }
      });
    }
  }

  // =========================================================================
  // 3. INTERACTIVE EXIT TICKET (BÀI LUYỆN TẬP CUỐI BUỔI)
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
          '<span class="status-badge status-graded">Đã hoàn thành bài luyện tập cuối buổi</span>' +
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

              const runSaveExitTicket = async function () {
                const remoteRes = await window.StudySnapStore.syncPostToGas(state, {
                  action: 'submitExitTicket',
                  ticket_id: logRecord.ticket_id,
                  student_id: logRecord.student_id,
                  student_name: logRecord.student_name,
                  score: logRecord.score,
                  total: logRecord.total
                });
                if (remoteRes && remoteRes.ok === false) {
                  showToast(remoteRes.error || 'Chưa thể lưu kết quả lúc này. Vui lòng thử lại!');
                  return;
                }
                ui.quizFinished = true;
                state.exitTicketLogs.unshift(logRecord);
                window.StudySnapStore.saveState(state);
                showToast('Đã lưu kết quả bài luyện tập cuối buổi của ' + student.full_name + '!');
                renderExitTicketSection();
              };

              const loading = window.StudySnapLoading;
              if (loading) {
                await loading.withButtonLoading(btnNext, 'Đang lưu kết quả...', runSaveExitTicket);
              } else {
                await runSaveExitTicket();
              }
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
  // 3. TAB 2: BÀI TẬP LUYỆN TẬP CUỐI BUỔI (TỰ ĐỘNG CHẤM & ĐÁNH GIÁ)
  // =========================================================================
  function getPracticeDraftKey(exerciseId) {
    const student = getActiveStudent();
    return 'studysnap_practice_draft_' + student.student_id + '_' + exerciseId;
  }

  function getVisiblePracticeExercises(student) {
    const activeStudent = student || getActiveStudent();
    const sClass = activeStudent ? String(activeStudent.class_name || '').trim().toLowerCase() : '';
    const exercises = state.practiceExercises || [];
    const assignments = state.assignments || [];

    return exercises.filter(function (ex) {
      const deliveries = assignments.filter(function (a) {
        return a.require_media === 'practice' && String(a.exercise_id || '') === String(ex.exercise_id || '');
      });
      // Đề chưa từng được giao cho lớp nào (Chưa giao lớp nào) không hiển thị cho học sinh
      if (deliveries.length === 0) return false;
      return deliveries.some(function (d) {
        const clsLower = String(d.class_name || '').trim().toLowerCase();
        if (!clsLower || clsLower === 'unassigned') return false;
        if (clsLower === 'all') return true;
        return Boolean(sClass && clsLower === sClass);
      });
    });
  }

  function getActiveExercise() {
    const exercises = getVisiblePracticeExercises();
    const found = exercises.find(function (e) {
      return e.exercise_id === ui.selectedExerciseId;
    });
    return found || exercises[0] || null;
  }

  function findStudentPracticeSubmission(exerciseId) {
    const student = getActiveStudent();
    return (state.practiceSubmissions || []).find(function (sub) {
      return sub.exercise_id === exerciseId && sub.student_id === student.student_id;
    }) || null;
  }

  function loadPracticeDraftOrInit(exercise) {
    if (!exercise) return;
    const existingSub = findStudentPracticeSubmission(exercise.exercise_id);
    if (existingSub && !ui.practiceViewingResult && Object.keys(ui.practiceAnswers).length === 0) {
      ui.practiceAnswers = JSON.parse(JSON.stringify(existingSub.answers || {}));
      ui.practiceViewingResult = true;
      return;
    }

    if (Object.keys(ui.practiceAnswers).length > 0) return;

    try {
      const raw = localStorage.getItem(getPracticeDraftKey(exercise.exercise_id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.answers) {
          ui.practiceAnswers = parsed.answers;
          const draftText = document.getElementById('student-draft-text');
          if (draftText && parsed.updatedAt) {
            draftText.textContent = 'Đã nạp bản nháp (' + parsed.updatedAt + ')';
          }
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    ui.practiceAnswers = {};
  }

  function savePracticeDraft() {
    const exercise = getActiveExercise();
    if (!exercise) return;
    const student = getActiveStudent();
    const timeStr = new Date().toLocaleTimeString('vi-VN');
    try {
      localStorage.setItem(
        getPracticeDraftKey(exercise.exercise_id),
        JSON.stringify({ answers: ui.practiceAnswers, updatedAt: timeStr })
      );
    } catch (e) {
      // ignore
    }

    const draftText = document.getElementById('student-draft-text');
    if (draftText) {
      draftText.textContent = 'Đã tự động lưu nháp lúc ' + timeStr;
    }
    updatePracticeProgressBar(exercise);
  }

  function computePracticeProgress(exercise) {
    if (!exercise || !exercise.sections) return { total: 35, answered: 0, percent: 0 };
    let totalCount = 0;
    let answeredCount = 0;

    exercise.sections.forEach(function (sec) {
      const secAns = ui.practiceAnswers[sec.section_id] || {};
      if (sec.type === 'matching') {
        const leftItems = (sec.data && sec.data.left) || [];
        totalCount += leftItems.length;
        leftItems.forEach(function (l) {
          if (secAns[String(l.id)]) answeredCount++;
        });
      } else if (sec.type === 'multiple_choice' || sec.type === 'listening_mc') {
        const items = (sec.data && sec.data.items) || [];
        totalCount += items.length;
        items.forEach(function (item) {
          if (secAns[item.id] !== undefined && secAns[item.id] !== null && secAns[item.id] !== '') {
            answeredCount++;
          }
        });
      } else if (sec.type === 'fill_blank_wordbank') {
        const items = (sec.data && sec.data.items) || [];
        totalCount += items.length;
        items.forEach(function (item) {
          if (secAns[item.id] && String(secAns[item.id]).trim().length > 0) {
            answeredCount++;
          }
        });
      } else if (sec.type === 'error_correction' || sec.type === 'translation') {
        const items = (sec.data && sec.data.items) || [];
        totalCount += items.length;
        items.forEach(function (item) {
          if (secAns[item.id] && String(secAns[item.id]).trim().length > 0) {
            answeredCount++;
          }
        });
      }
    });

    const percent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
    return { total: totalCount, answered: answeredCount, percent: percent };
  }

  function updatePracticeProgressBar(exercise) {
    const stats = computePracticeProgress(exercise);
    const progressText = document.getElementById('student-practice-progress-text');
    const progressFill = document.getElementById('student-practice-progress-fill');

    if (progressText) {
      progressText.textContent =
        'Tiến độ làm bài: ' + stats.answered + '/' + stats.total + ' câu (' + stats.percent + '%)';
    }
    if (progressFill) {
      progressFill.style.width = stats.percent + '%';
    }
  }

  function renderPracticeSection() {
    const visibleExercises = getVisiblePracticeExercises();
    const exercise = getActiveExercise();
    const titleEl = document.getElementById('student-practice-title');
    const selectorEl = document.getElementById('student-practice-exercise-selector');
    const resultsBox = document.getElementById('student-practice-results-box');
    const formEl = document.getElementById('student-practice-form');
    const submitPracBtn = document.getElementById('btn-submit-practice');
    const resetPracBtn = document.getElementById('btn-reset-practice-draft');

    const headerCard = document.querySelector('#student-tab-practice .practice-header-card');

    if (!exercise) {
      if (titleEl) titleEl.textContent = 'Chưa có bài luyện tập cuối buổi cho lớp của em';
      if (selectorEl) selectorEl.innerHTML = '';
      if (headerCard) headerCard.style.display = 'none';
      if (resultsBox) resultsBox.style.display = 'none';
      if (formEl) formEl.style.display = 'block';
      if (submitPracBtn) submitPracBtn.style.display = 'none';
      if (resetPracBtn) resetPracBtn.style.display = 'none';
      const progressText = document.getElementById('student-practice-progress-text');
      const progressFill = document.getElementById('student-practice-progress-fill');
      if (progressText) progressText.textContent = 'Chưa có bài tập được giao';
      if (progressFill) progressFill.style.width = '0%';
      const container = document.getElementById('student-practice-sections-container');
      if (container) {
        container.innerHTML =
          '<div class="empty-state-panel">' +
          '<div class="empty-state-icon" aria-hidden="true">' +
          '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>' +
          '</div>' +
          '<h3>Chưa có bài tập nào được giao cho lớp của em</h3>' +
          '<p>Giáo viên sẽ sớm cập nhật bài luyện tập cuối buổi cho lớp tại đây.</p>' +
          '</div>';
      }
      return;
    }

    if (headerCard) headerCard.style.display = '';
    if (submitPracBtn) submitPracBtn.style.display = '';
    if (resetPracBtn) resetPracBtn.style.display = '';

    loadPracticeDraftOrInit(exercise);

    if (titleEl) {
      titleEl.textContent = exercise.title + ' (' + (exercise.total_score || 35) + ' điểm)';
    }

    // Exercise selector pills
    if (selectorEl) {
      selectorEl.innerHTML = visibleExercises
        .map(function (ex) {
          const isActive = ex.exercise_id === exercise.exercise_id;
          return (
            '<button type="button" class="filter-pill' +
            (isActive ? ' is-active' : '') +
            '" data-practice-ex-select="' +
            escapeHtml(ex.exercise_id) +
            '">' +
            escapeHtml(ex.lesson_tag || ex.title) +
            '</button>'
          );
        })
        .join('');

      selectorEl.querySelectorAll('[data-practice-ex-select]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const exId = btn.getAttribute('data-practice-ex-select');
          if (!exId || exId === ui.selectedExerciseId) return;
          ui.selectedExerciseId = exId;
          ui.practiceAnswers = {};
          ui.selectedMatchingLeft = null;
          ui.selectedWordBankChip = null;
          ui.selectedTargetBlank = null;
          ui.practiceViewingResult = false;
          renderStudentHeaderAndStats();
          renderPracticeSection();
        });
      });
    }

    updatePracticeProgressBar(exercise);

    // Results Box vs Form view
    const existingSub = findStudentPracticeSubmission(exercise.exercise_id);

    if (existingSub && ui.practiceViewingResult) {
      if (resultsBox) {
        resultsBox.style.display = 'block';
        resultsBox.innerHTML = renderPracticeResultsHtml(exercise, existingSub);
        bindPracticeResultsEvents(exercise, existingSub);
      }
      if (formEl) formEl.style.display = 'none';
      return;
    }

    if (resultsBox) resultsBox.style.display = 'none';
    if (formEl) formEl.style.display = 'block';

    const container = document.getElementById('student-practice-sections-container');
    if (!container) return;

    container.innerHTML = (exercise.sections || [])
      .map(function (sec, idx) {
        return (
          '<div class="surface-panel" style="margin-bottom: 24px;" id="student-sec-' +
          escapeHtml(sec.section_id) +
          '">' +
          '<div class="panel-header">' +
          '<div class="panel-title-row">' +
          '<span class="practice-section-num-badge">Phần ' +
          (sec.section_num || idx + 1) +
          '</span>' +
          '<div>' +
          '<h3 style="margin:0;font-size:1.125rem;font-weight:700;color:var(--color-foreground);">' +
          escapeHtml(sec.title) +
          '</h3>' +
          '<p style="margin:4px 0 0;font-size:0.875rem;color:var(--color-muted-foreground);">' +
          escapeHtml(sec.description) +
          '</p>' +
          '</div>' +
          '</div>' +
          '<span class="status-badge status-graded tabular-nums">' +
          sec.max_score +
          ' điểm</span>' +
          '</div>' +
          '<div style="padding-top:14px;">' +
          renderSectionBodyHtml(sec) +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    bindSectionInteractiveEvents(exercise);
  }

  function renderSectionBodyHtml(sec) {
    if (sec.type === 'matching') {
      return renderMatchingBodyHtml(sec);
    } else if (sec.type === 'multiple_choice') {
      return renderMultipleChoiceBodyHtml(sec);
    } else if (sec.type === 'listening_mc') {
      return renderListeningMcBodyHtml(sec);
    } else if (sec.type === 'fill_blank_wordbank') {
      return renderFillBlankBodyHtml(sec);
    } else if (sec.type === 'error_correction') {
      return renderErrorCorrectionBodyHtml(sec);
    } else if (sec.type === 'translation') {
      return renderTranslationBodyHtml(sec);
    }
    return '<p style="color:var(--color-muted-foreground);">Dạng câu hỏi chưa được hỗ trợ.</p>';
  }

  // --- SECTION 1: MATCHING (NỐI TỪ) ---
  function renderMatchingBodyHtml(sec) {
    const secAns = ui.practiceAnswers[sec.section_id] || {};
    const leftItems = (sec.data && sec.data.left) || [];
    const rightItems = (sec.data && sec.data.right) || [];

    // Ensure shuffled right array is preserved during a session
    if (!ui.matchingShuffledRight[sec.section_id]) {
      const arr = rightItems.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      ui.matchingShuffledRight[sec.section_id] = arr;
    }
    const shuffledRight = ui.matchingShuffledRight[sec.section_id];

    let leftColHtml = leftItems
      .map(function (item) {
        const leftKey = String(item.id);
        const pairedRightId = secAns[leftKey];
        const isSelected =
          ui.selectedMatchingLeft &&
          ui.selectedMatchingLeft.secId === sec.section_id &&
          String(ui.selectedMatchingLeft.leftId) === leftKey;
        const isPaired = Boolean(pairedRightId);

        let cardClass = 'matching-card';
        if (isSelected) cardClass += ' is-selected';
        if (isPaired) cardClass += ' is-paired';

        return (
          '<div class="' +
          cardClass +
          '" data-matching-left-sec="' +
          escapeHtml(sec.section_id) +
          '" data-matching-left-id="' +
          escapeHtml(item.id) +
          '" tabindex="0" role="button" aria-pressed="' +
          (isSelected ? 'true' : 'false') +
          '">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
          '<span class="matching-badge">' +
          escapeHtml(item.id) +
          '</span>' +
          '<div>' +
          '<div class="matching-hanzi">' +
          escapeHtml(item.hanzi) +
          '</div>' +
          '<div class="matching-pinyin">' +
          escapeHtml(item.pinyin) +
          '</div>' +
          '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
          (isPaired
            ? '<span class="matching-badge" title="Đã ghép với mục ' +
              escapeHtml(pairedRightId) +
              ' — Nhấn để hủy ghép">Đã ghép: [' +
              escapeHtml(pairedRightId) +
              '] ✕</span>'
            : '<span class="matching-badge" style="opacity:0.6;">Chưa nối</span>') +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    let rightColHtml = shuffledRight
      .map(function (item) {
        const rightKey = String(item.id);
        // Find which left is paired with this right
        let pairedLeftId = null;
        Object.keys(secAns).forEach(function (k) {
          if (secAns[k] === rightKey) pairedLeftId = k;
        });

        const isPaired = Boolean(pairedLeftId);
        let cardClass = 'matching-card';
        if (isPaired) cardClass += ' is-paired';

        return (
          '<div class="' +
          cardClass +
          '" data-matching-right-sec="' +
          escapeHtml(sec.section_id) +
          '" data-matching-right-id="' +
          escapeHtml(item.id) +
          '" tabindex="0" role="button">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span class="matching-badge">' +
          escapeHtml(item.id) +
          '</span>' +
          '<span style="font-weight:600;font-size:0.9375rem;color:var(--color-foreground);">' +
          escapeHtml(item.text) +
          '</span>' +
          '</div>' +
          '<div>' +
          (isPaired
            ? '<span class="matching-badge">Đã nối: [' + escapeHtml(pairedLeftId) + ']</span>'
            : '<span class="matching-badge" style="opacity:0.6;">Chờ nối</span>') +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    return (
      '<div>' +
      '<p style="font-size:0.875rem;color:var(--color-muted-foreground);margin-top:0;margin-bottom:12px;">' +
      '💡 <strong>Cách làm:</strong> Bấm chọn 1 chữ Hán ở cột trái (thẻ sáng lên), sau đó bấm vào nghĩa tiếng Việt tương ứng ở cột phải. Nhấn vào cặp đã ghép để hủy nối.' +
      '</p>' +
      '<div class="matching-container">' +
      '<div class="matching-col">' +
      '<h4 style="margin:0 0 4px;font-size:0.875rem;font-weight:700;color:var(--color-primary-deep);text-transform:uppercase;letter-spacing:0.04em;">Cột A: Chữ Hán &amp; Pinyin</h4>' +
      leftColHtml +
      '</div>' +
      '<div class="matching-col">' +
      '<h4 style="margin:0 0 4px;font-size:0.875rem;font-weight:700;color:var(--color-primary-deep);text-transform:uppercase;letter-spacing:0.04em;">Cột B: Nghĩa Tiếng Việt (Đã xáo trộn)</h4>' +
      rightColHtml +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  // --- SECTION 2 & 6 SHARED: MULTIPLE CHOICE CARDS ---
  function renderListeningQuestionPlayerHtml(sec, item, idx, idPrefix) {
    if (!window.StudySnapAudio || !sec || !item) return '';
    const itemAudioUrl = String(item.audio_url || '').trim();
    const isReview = String(idPrefix || '').indexOf('review') >= 0;
    if (!itemAudioUrl || itemAudioUrl.indexOf('demo:') === 0) {
      return isReview
        ? ''
        : '<div class="listening-missing-audio-note">Câu hỏi này chưa có tệp âm thanh từ giáo viên.</div>';
    }

    return (
      '<div class="listening-question-player">' +
      window.StudySnapAudio.renderVoicePlayer({
        id: (idPrefix || 'student-ls-') + sec.section_id + '-' + item.id,
        url: itemAudioUrl,
        duration: item.audio_duration || '00:25',
        label: String(item.audio_label || '').trim() || ('Nghe câu ' + (idx + 1)),
        fallbackText: '',
        requireRealAudio: true,
        lang: 'zh-CN',
        variant: 'student',
        showSpeedToggle: true
      }) +
      '</div>'
    );
  }

  function renderMcQuestionCardsHtml(sec, skipEmptyOptions) {
    const secAns = ui.practiceAnswers[sec.section_id] || {};
    const items = (sec.data && sec.data.items) || [];
    const isPerQuestionListening =
      sec.type === 'listening_mc' && sec.data && sec.data.listening_mode === 'per_question';

    return (
      '<div style="display:flex;flex-direction:column;gap:16px;">' +
      items
        .map(function (item, idx) {
          const selectedOpt = secAns[item.id];
          const hasSelected = selectedOpt !== undefined && selectedOpt !== null && selectedOpt !== '';
          const visibleOptions = [];
          (item.options || []).forEach(function (optText, optIdx) {
            if (!skipEmptyOptions || (optText && String(optText).trim() !== '') || optIdx < 2) {
              visibleOptions.push({ optText: optText || '', optIdx: optIdx });
            }
          });
          const itemPlayerHtml = isPerQuestionListening
            ? renderListeningQuestionPlayerHtml(sec, item, idx, 'student-ls-')
            : '';

          return (
            '<div class="mc-card" id="student-mc-' +
            escapeHtml(item.id) +
            '">' +
            '<div class="mc-prompt-row">' +
            '<div style="display:flex;align-items:flex-start;gap:10px;">' +
            '<span class="practice-section-num-badge" style="font-size:0.8125rem;">Câu ' +
            (idx + 1) +
            '</span>' +
            '<div class="mc-prompt-text">' +
            escapeHtml(item.prompt) +
            '</div>' +
            '</div>' +
            (item.speakWord
              ? '<button type="button" class="btn btn-outline btn-sm" style="flex-shrink:0;" data-speak-mc="' +
                escapeHtml(item.speakWord) +
                '" title="Nghe phát âm chuẩn">' +
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>' +
                '<span>Nghe</span></button>'
              : '') +
            '</div>' +
            itemPlayerHtml +
            '<div class="mc-options-grid">' +
            visibleOptions
              .map(function (entry) {
                const optIdx = entry.optIdx;
                const optText = entry.optText;
                const isOptActive = hasSelected && Number(selectedOpt) === optIdx;
                const letter = String.fromCharCode(65 + optIdx);
                return (
                  '<div class="option-card' +
                  (isOptActive ? ' is-selected' : '') +
                  '" data-mc-opt-sec="' +
                  escapeHtml(sec.section_id) +
                  '" data-mc-item-id="' +
                  escapeHtml(item.id) +
                  '" data-mc-opt-idx="' +
                  optIdx +
                  '" tabindex="0" role="radio" aria-checked="' +
                  (isOptActive ? 'true' : 'false') +
                  '">' +
                  '<span class="option-letter">' +
                  letter +
                  '</span>' +
                  '<span class="option-text">' +
                  escapeHtml(optText) +
                  '</span>' +
                  '<span class="option-check" aria-hidden="true">' +
                  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
                  '</span>' +
                  '</div>'
                );
              })
              .join('') +
            '</div>' +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function renderMultipleChoiceBodyHtml(sec) {
    return renderMcQuestionCardsHtml(sec, false);
  }

  // --- SECTION 6: LISTENING COMPREHENSION (NGHE HIỂU HỘI THOẠI / TỪNG CÂU) ---
  function renderListeningMcBodyHtml(sec) {
    const data = sec.data || {};
    const listeningMode = data.listening_mode === 'per_question' ? 'per_question' : 'shared';
    const audioUrl = (data.audio_url || '').trim();
    const hasAudioFile = Boolean(audioUrl && audioUrl.indexOf('demo:') !== 0);
    const showSharedPlayer = listeningMode === 'shared' && hasAudioFile && window.StudySnapAudio;

    const playerHtml = listeningMode === 'shared'
      ? (showSharedPlayer
          ? '<div class="listening-audio-strip">' +
              window.StudySnapAudio.renderVoicePlayer({
                id: 'student-ls-' + sec.section_id,
                url: audioUrl,
                duration: data.audio_duration || '00:35',
                label: data.audio_label || 'Nghe đoạn hội thoại',
                fallbackText: '',
                requireRealAudio: true,
                lang: 'zh-CN',
                variant: 'student',
                showSpeedToggle: true
              }) +
            '</div>'
          : '<div class="listening-missing-audio-note">Phần nghe hiểu này chưa được giáo viên gắn tệp âm thanh.</div>')
      : '';

    const hasBannerContent = Boolean(data.context_label || data.context_title || data.context_subtitle || playerHtml);
    const bannerHtml = hasBannerContent
      ? '<div class="listening-context-banner">' +
        '<div class="listening-context-top">' +
        '<div style="flex:1;min-width:220px;">' +
        (data.context_label
          ? '<span class="listening-label-pill">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>' +
            '<span>' + escapeHtml(data.context_label) + '</span>' +
            '</span>'
          : '') +
        (data.context_title
          ? '<div style="margin-top:8px;font-size:1.125rem;font-weight:800;color:var(--ink);">' +
            escapeHtml(data.context_title) +
            '</div>'
          : '') +
        (data.context_subtitle
          ? '<div style="margin-top:4px;font-size:0.875rem;color:var(--muted);">' +
            escapeHtml(data.context_subtitle) +
            '</div>'
          : '') +
        '</div>' +
        '</div>' +
        playerHtml +
        '</div>'
      : '';

    return (
      '<div>' +
      bannerHtml +
      renderMcQuestionCardsHtml(sec, true) +
      '</div>'
    );
  }

  // --- SECTION 3: FILL BLANK WORDBANK (ĐIỀN TỪ CÓ NGÂN HÀNG TỪ) ---
  function renderFillBlankBodyHtml(sec) {
    const secAns = ui.practiceAnswers[sec.section_id] || {};
    const wordbank = (sec.data && sec.data.wordbank) || [];
    const items = (sec.data && sec.data.items) || [];

    // Words currently used in this section
    const usedWords = Object.keys(secAns).map(function (k) {
      return secAns[k];
    });

    const isChipActive = Boolean(
      ui.selectedWordBankChip && ui.selectedWordBankChip.secId === sec.section_id
    );
    const isTargetActive = Boolean(
      ui.selectedTargetBlank && ui.selectedTargetBlank.secId === sec.section_id
    );

    const wordbankChipsHtml = wordbank
      .map(function (word) {
        const isUsed = usedWords.indexOf(word) >= 0;
        const isActive = isChipActive && ui.selectedWordBankChip.word === word;

        let chipClass = 'wordbank-chip';
        if (isUsed) chipClass += ' is-used';
        if (isActive) chipClass += ' is-active';

        return (
          '<button type="button" class="' +
          chipClass +
          '" data-wordbank-sec="' +
          escapeHtml(sec.section_id) +
          '" data-wordbank-word="' +
          escapeHtml(word) +
          '"' +
          (isUsed ? ' disabled' : '') +
          ' title="' + (isUsed ? 'Từ này đã được sử dụng' : 'Bấm để chọn từ này') + '">' +
          escapeHtml(word) +
          '</button>'
        );
      })
      .join('');

    const itemsHtml = items
      .map(function (item, idx) {
        const currentVal = secAns[item.id];
        const isFilled = Boolean(currentVal);
        const isTargeted = isTargetActive && ui.selectedTargetBlank.itemId === item.id;

        // Replace ____ with clickable blank slot
        let slotClass = 'blank-slot-target';
        if (isFilled) slotClass += ' is-filled';
        if (isTargeted) slotClass += ' is-targeted';

        const blankSlotHtml = isFilled
          ? '<span class="' + slotClass + '" data-blank-sec="' +
            escapeHtml(sec.section_id) +
            '" data-blank-id="' +
            escapeHtml(item.id) +
            '" title="Bấm để gỡ từ này ra trả về ngân hàng">' +
            escapeHtml(currentVal) +
            '<button type="button" class="blank-remove-btn" aria-label="Gỡ từ">✕</button></span>'
          : '<span class="' + slotClass + '" data-blank-sec="' +
            escapeHtml(sec.section_id) +
            '" data-blank-id="' +
            escapeHtml(item.id) +
            '" title="' +
            (isChipActive ? 'Bấm để điền từ đang chọn vào đây' : 'Bấm để chọn ô này trước rồi chọn từ ở trên') +
            '">' + (isTargeted ? '📍 Chọn từ ở trên' : '____') + '</span>';

        const sentenceWithSlot = escapeHtml(item.text).replace(/____/g, blankSlotHtml);

        return (
          '<div class="fill-blank-item" id="fb-item-' + escapeHtml(item.id) + '">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
          '<span class="practice-section-num-badge" style="font-size:0.75rem;">Câu ' +
          (idx + 1) +
          '</span>' +
          '</div>' +
          '<div class="fill-sentence-row">' +
          sentenceWithSlot +
          '</div>' +
          (item.hint
            ? '<div class="fill-hint-text">Gợi ý nghĩa: ' + escapeHtml(item.hint) + '</div>'
            : '') +
          '</div>'
        );
      })
      .join('');

    let statusHintHtml = '';
    if (isChipActive) {
      statusHintHtml =
        '<span class="status-badge status-submitted" style="font-size:0.75rem;">' +
        'Đang chọn từ: <strong>&ldquo;' +
        escapeHtml(ui.selectedWordBankChip.word) +
        '&rdquo;</strong> &rarr; Nhấp vào chỗ trống [ ____ ] trong câu bên dưới</span>';
    } else if (isTargetActive) {
      const targetIdx = items.findIndex(function (it) { return it.id === ui.selectedTargetBlank.itemId; });
      const targetLabel = targetIdx >= 0 ? 'Câu ' + (targetIdx + 1) : 'ô trống';
      statusHintHtml =
        '<span class="status-badge status-submitted" style="font-size:0.75rem; background: var(--color-accent-soft); color: var(--color-accent); border-color: var(--color-accent);">' +
        'Đang chọn chỗ trống ' + targetLabel + ' &rarr; Nhấp vào từ trong ngân hàng để điền</span>';
    } else {
      statusHintHtml =
        '<span style="font-size:0.75rem; color:var(--color-muted-foreground);">' +
        'Gợi ý: Nhấp từ &rarr; Nhấp ô trống, hoặc nhấp ô trống &rarr; Nhấp từ</span>';
    }

    return (
      '<div class="fill-blank-container">' +
      '<div class="wordbank-bar">' +
      '<div class="wordbank-bar-header">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
      '<span class="wordbank-label">Ngân hàng từ vựng</span>' +
      '<span class="wordbank-sticky-badge" title="Ngân hàng từ luôn cố định theo màn hình khi cuộn">' +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>' +
      'Cuộn theo trang' +
      '</span>' +
      '</div>' +
      statusHintHtml +
      '</div>' +
      '<div class="wordbank-chips-group">' +
      wordbankChipsHtml +
      '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
      itemsHtml +
      '</div>' +
      '</div>'
    );
  }

  // --- SECTION 4: ERROR CORRECTION (SỬA CÂU SAI) ---
  function renderErrorCorrectionBodyHtml(sec) {
    const secAns = ui.practiceAnswers[sec.section_id] || {};
    const items = (sec.data && sec.data.items) || [];

    return (
      '<div style="display:flex;flex-direction:column;gap:16px;">' +
      items
        .map(function (item, idx) {
          const currentVal = secAns[item.id] || '';
          return (
            '<div class="error-item-card">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<span class="practice-section-num-badge" style="font-size:0.8125rem;">Câu ' +
            (idx + 1) +
            '</span>' +
            '<span class="error-situation-tag">Tình huống: ' +
            escapeHtml(item.situation) +
            '</span>' +
            '</div>' +
            '<div class="error-wrong-sentence">' +
            '<span style="font-size:0.875rem;padding:2px 8px;border-radius:var(--radius-pill);background:var(--color-destructive-bg);color:var(--color-destructive);font-weight:700;">Câu sai</span>' +
            '<span>' +
            escapeHtml(item.wrong) +
            '</span>' +
            '</div>' +
            '<div style="margin-top:10px;">' +
            '<label class="form-label" style="font-size:0.875rem;font-weight:600;" for="err-input-' +
            escapeHtml(item.id) +
            '">Viết lại câu đúng bằng tiếng Trung (hỗ trợ gõ bộ gõ chữ Hán):</label>' +
            '<input type="text" id="err-input-' +
            escapeHtml(item.id) +
            '" class="form-control chinese-text-input" placeholder="Nhập câu đúng (ví dụ: 大家好！)..." value="' +
            escapeHtml(currentVal) +
            '" data-err-sec="' +
            escapeHtml(sec.section_id) +
            '" data-err-item="' +
            escapeHtml(item.id) +
            '">' +
            '</div>' +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  // --- SECTION 5: TRANSLATION (DỊCH CÂU) ---
  function renderTranslationBodyHtml(sec) {
    const secAns = ui.practiceAnswers[sec.section_id] || {};
    const items = (sec.data && sec.data.items) || [];

    return (
      '<div style="display:flex;flex-direction:column;gap:16px;">' +
      items
        .map(function (item, idx) {
          const currentVal = secAns[item.id] || '';
          const isViToZh = item.direction === 'vi->zh';
          const isManual = item.mode === 'manual';

          return (
            '<div class="trans-item-card">' +
            '<div class="trans-header-row">' +
            '<span class="practice-section-num-badge" style="font-size:0.8125rem;">Câu ' +
            (idx + 1) +
            '</span>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            (isViToZh
              ? '<span class="status-badge status-submitted">Việt &rarr; Trung (vi&rarr;zh)</span>'
              : '<span class="status-badge status-graded">Trung &rarr; Việt (zh&rarr;vi)</span>') +
            (isManual
              ? '<span class="status-badge status-submitted">Giáo viên chấm</span>'
              : '<span class="status-badge status-graded">Tự động chấm</span>') +
            '</div>' +
            '</div>' +
            '<div class="trans-prompt-sentence">' +
            escapeHtml(item.prompt) +
            '</div>' +
            '<div>' +
            '<input type="text" class="form-control chinese-text-input" placeholder="' +
            (isViToZh ? 'Gõ bản dịch bằng chữ Hán tiếng Trung...' : 'Gõ bản dịch bằng tiếng Việt...') +
            '" value="' +
            escapeHtml(currentVal) +
            '" data-trans-sec="' +
            escapeHtml(sec.section_id) +
            '" data-trans-item="' +
            escapeHtml(item.id) +
            '">' +
            '</div>' +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  // --- INTERACTIVE EVENT BINDINGS FOR SECTIONS ---
  function bindSectionInteractiveEvents(exercise) {
    // 1. Matching Left Click
    document.querySelectorAll('[data-matching-left-sec]').forEach(function (card) {
      card.addEventListener('click', function () {
        const secId = card.getAttribute('data-matching-left-sec');
        const leftId = card.getAttribute('data-matching-left-id');
        if (!ui.practiceAnswers[secId]) ui.practiceAnswers[secId] = {};
        const secAns = ui.practiceAnswers[secId];

        // If this left card is already paired, clicking it unpairs it
        if (secAns[leftId]) {
          delete secAns[leftId];
          ui.selectedMatchingLeft = null;
          savePracticeDraft();
          const prevScroll = window.scrollY;
          renderPracticeSection();
          window.scrollTo({ top: prevScroll });
          return;
        }

        // Toggle selection
        if (
          ui.selectedMatchingLeft &&
          ui.selectedMatchingLeft.secId === secId &&
          String(ui.selectedMatchingLeft.leftId) === leftId
        ) {
          ui.selectedMatchingLeft = null;
        } else {
          ui.selectedMatchingLeft = { secId: secId, leftId: leftId };
        }
        const prevScroll = window.scrollY;
        renderPracticeSection();
        window.scrollTo({ top: prevScroll });
      });
    });

    // 1. Matching Right Click
    document.querySelectorAll('[data-matching-right-sec]').forEach(function (card) {
      card.addEventListener('click', function () {
        const secId = card.getAttribute('data-matching-right-sec');
        const rightId = card.getAttribute('data-matching-right-id');
        if (!ui.practiceAnswers[secId]) ui.practiceAnswers[secId] = {};
        const secAns = ui.practiceAnswers[secId];

        if (ui.selectedMatchingLeft && ui.selectedMatchingLeft.secId === secId) {
          const leftId = String(ui.selectedMatchingLeft.leftId);
          // Remove rightId from any other left item
          Object.keys(secAns).forEach(function (k) {
            if (secAns[k] === rightId) delete secAns[k];
          });
          secAns[leftId] = rightId;
          ui.selectedMatchingLeft = null;
          savePracticeDraft();
          const prevScroll = window.scrollY;
          renderPracticeSection();
          window.scrollTo({ top: prevScroll });
          return;
        }

        // If no left item is selected, check if this right card was already paired: click to unpair
        let pairedLeft = null;
        Object.keys(secAns).forEach(function (k) {
          if (secAns[k] === rightId) pairedLeft = k;
        });
        if (pairedLeft) {
          delete secAns[pairedLeft];
          savePracticeDraft();
          const prevScroll = window.scrollY;
          renderPracticeSection();
          window.scrollTo({ top: prevScroll });
        } else {
          showToast('Hãy bấm chọn một chữ Hán ở Cột trái trước nhé!');
        }
      });
    });

    // 2. Multiple Choice Options Click & Keyboard Select
    document.querySelectorAll('[data-mc-opt-sec]').forEach(function (card) {
      function chooseOption() {
        const secId = card.getAttribute('data-mc-opt-sec');
        const itemId = card.getAttribute('data-mc-item-id');
        const optIdx = parseInt(card.getAttribute('data-mc-opt-idx'), 10);
        if (!secId || !itemId || isNaN(optIdx)) return;

        if (!ui.practiceAnswers[secId]) ui.practiceAnswers[secId] = {};
        ui.practiceAnswers[secId][itemId] = optIdx;
        savePracticeDraft();

        // Update active selection classes in DOM immediately
        const grid = card.closest('.mc-options-grid') || card.parentElement;
        if (grid) {
          grid.querySelectorAll('[data-mc-opt-sec]').forEach(function (other) {
            const isThis = other === card;
            other.classList.toggle('is-selected', isThis);
            other.setAttribute('aria-checked', isThis ? 'true' : 'false');
          });
        }

        const exercise = getActiveExercise();
        if (exercise) updatePracticeProgressBar(exercise);
      }

      card.addEventListener('click', chooseOption);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          chooseOption();
        }
      });
    });

    // Audio Speaker in MCQs
    document.querySelectorAll('[data-speak-mc]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const word = btn.getAttribute('data-speak-mc');
        if (word) window.StudySnapAudio.speakText(word, 'zh-CN');
      });
    });

    // 3. Word Bank Chips Click
    document.querySelectorAll('[data-wordbank-sec]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        const secId = chip.getAttribute('data-wordbank-sec');
        const word = chip.getAttribute('data-wordbank-word');

        // Case A: A blank slot was already targeted -> place word directly into it!
        if (ui.selectedTargetBlank && ui.selectedTargetBlank.secId === secId) {
          if (!ui.practiceAnswers[secId]) ui.practiceAnswers[secId] = {};
          ui.practiceAnswers[secId][ui.selectedTargetBlank.itemId] = word;
          ui.selectedTargetBlank = null;
          ui.selectedWordBankChip = null;
          savePracticeDraft();
          const prevScroll = window.scrollY;
          renderPracticeSection();
          window.scrollTo({ top: prevScroll });
          return;
        }

        // Case B: Toggle active selection on word chip
        if (
          ui.selectedWordBankChip &&
          ui.selectedWordBankChip.secId === secId &&
          ui.selectedWordBankChip.word === word
        ) {
          ui.selectedWordBankChip = null;
        } else {
          ui.selectedWordBankChip = { secId: secId, word: word };
          ui.selectedTargetBlank = null;
        }
        const prevScroll = window.scrollY;
        renderPracticeSection();
        window.scrollTo({ top: prevScroll });
      });
    });

    // 3. Blank Slot Targets Click (Fill, Remove, or Target)
    document.querySelectorAll('[data-blank-sec]').forEach(function (slot) {
      slot.addEventListener('click', function () {
        const secId = slot.getAttribute('data-blank-sec');
        const itemId = slot.getAttribute('data-blank-id');
        if (!ui.practiceAnswers[secId]) ui.practiceAnswers[secId] = {};
        const secAns = ui.practiceAnswers[secId];

        // Case 1: Slot already has a word -> click to remove word and return to bank
        if (secAns[itemId]) {
          delete secAns[itemId];
          ui.selectedTargetBlank = null;
          savePracticeDraft();
          const prevScroll = window.scrollY;
          renderPracticeSection();
          window.scrollTo({ top: prevScroll });
          return;
        }

        // Case 2: A word chip is currently selected -> place it immediately!
        if (ui.selectedWordBankChip && ui.selectedWordBankChip.secId === secId) {
          secAns[itemId] = ui.selectedWordBankChip.word;
          ui.selectedWordBankChip = null;
          ui.selectedTargetBlank = null;
          savePracticeDraft();
          const prevScroll = window.scrollY;
          renderPracticeSection();
          window.scrollTo({ top: prevScroll });
          return;
        }

        // Case 3: No word is selected -> mark this blank slot as targeted so picking a word fills it!
        if (
          ui.selectedTargetBlank &&
          ui.selectedTargetBlank.secId === secId &&
          ui.selectedTargetBlank.itemId === itemId
        ) {
          ui.selectedTargetBlank = null;
        } else {
          ui.selectedTargetBlank = { secId: secId, itemId: itemId };
          ui.selectedWordBankChip = null;
        }
        const prevScroll = window.scrollY;
        renderPracticeSection();
        window.scrollTo({ top: prevScroll });
      });
    });

    // 4. Error Correction Inputs (Realtime auto-save with debounce)
    document.querySelectorAll('[data-err-sec]').forEach(function (input) {
      input.addEventListener('input', function () {
        const secId = input.getAttribute('data-err-sec');
        const itemId = input.getAttribute('data-err-item');
        if (!ui.practiceAnswers[secId]) ui.practiceAnswers[secId] = {};
        ui.practiceAnswers[secId][itemId] = input.value;
        savePracticeDraft();
      });
    });

    // 5. Translation Inputs (Realtime auto-save with debounce)
    document.querySelectorAll('[data-trans-sec]').forEach(function (input) {
      input.addEventListener('input', function () {
        const secId = input.getAttribute('data-trans-sec');
        const itemId = input.getAttribute('data-trans-item');
        if (!ui.practiceAnswers[secId]) ui.practiceAnswers[secId] = {};
        ui.practiceAnswers[secId][itemId] = input.value;
        savePracticeDraft();
      });
    });
  }

  // --- RESULTS & EVALUATION DASHBOARD RENDERING ---
  function renderPracticeResultsHtml(exercise, sub) {
    const totalScore = sub.total_score || 0;
    const maxScore = sub.max_score || exercise.total_score || 35;
    const percent = Math.round((totalScore / maxScore) * 100);

    const thresholds = exercise.thresholds || { very_good: 31, good: 25 };
    let ratingBadgeClass = 'status-badge status-graded';
    let ratingLabel = 'Cần ôn lại 📚 (Dưới ' + thresholds.good + ' điểm)';
    let ratingMessage =
      'Em đã rất nỗ lực hoàn thành bài tập! Hãy xem kỹ lời giải thích chi tiết bên dưới để củng cố các chữ Hán và ngữ pháp cần ôn lại nhé.';

    if (totalScore >= thresholds.very_good) {
      ratingBadgeClass = 'status-badge status-graded';
      ratingLabel = 'Rất tốt 🌟 (' + thresholds.very_good + '–' + maxScore + ' điểm)';
      ratingMessage =
        'Xuất sắc! Em nắm rất vững ngữ âm, chữ Hán, quy tắc biến điệu thanh điệu và giao tiếp thực tế của bài học!';
    } else if (totalScore >= thresholds.good) {
      ratingBadgeClass = 'status-badge status-submitted';
      ratingLabel = 'Khá 👍 (' + thresholds.good + '–' + (thresholds.very_good - 1) + ' điểm)';
      ratingMessage =
        'Khá tốt! Em đã hiểu hầu hết nội dung trọng tâm. Cần chú ý thêm một số điểm ngữ pháp nhỏ và quy tắc biến điệu.';
    }

    const secScores = sub.section_scores || {};
    const sectionScoreBoxes = (exercise.sections || [])
      .map(function (sec, idx) {
        const score = secScores[sec.section_id] !== undefined ? secScores[sec.section_id] : 0;
        return (
          '<div class="section-score-box">' +
          '<span style="font-size:0.8125rem;color:var(--color-muted-foreground);display:block;">Phần ' +
          (sec.section_num || idx + 1) +
          '</span>' +
          '<strong>' +
          score +
          '/' +
          sec.max_score +
          ' đ</strong>' +
          '<div style="font-size:0.75rem;margin-top:2px;color:var(--color-foreground);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
          escapeHtml(sec.title.split(':')[0]) +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    // Detailed Review for Each Section
    const reviewDetailsHtml = (exercise.sections || [])
      .map(function (sec, idx) {
        return (
          '<div class="surface-panel" style="margin-top:16px;">' +
          '<div class="panel-header">' +
          '<div class="panel-title-row">' +
          '<span class="practice-section-num-badge">Phần ' +
          (sec.section_num || idx + 1) +
          '</span>' +
          '<h3 style="margin:0;font-size:1rem;font-weight:700;">' +
          escapeHtml(sec.title) +
          ' — Điểm đạt được: <span class="tabular-nums" style="color:var(--color-primary);">' +
          (secScores[sec.section_id] || 0) +
          '/' +
          sec.max_score +
          ' điểm</span></h3>' +
          '</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:12px;padding-top:12px;">' +
          renderSectionReviewItemsHtml(sec, sub) +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    return (
      '<div class="practice-result-card">' +
      '<div class="practice-score-header">' +
      '<div>' +
      '<div style="font-size:0.875rem;color:var(--color-muted-foreground);font-weight:600;margin-bottom:4px;">KẾT QUẢ ĐÁNH GIÁ BÀI LUYỆN TẬP CUỐI BUỔI</div>' +
      '<div class="practice-big-score tabular-nums">' +
      totalScore +
      ' / ' +
      maxScore +
      ' điểm' +
      ' <span style="font-size:1.125rem;font-weight:600;color:var(--color-primary);">(' +
      percent +
      '%)</span></div>' +
      '<div style="font-size:0.8125rem;color:var(--color-muted-foreground);margin-top:4px;">Nộp lúc: ' +
      escapeHtml(sub.submitted_at) +
      ' • Học sinh: ' +
      escapeHtml(sub.student_name) +
      '</div>' +
      '</div>' +
      '<div style="text-align:right;">' +
      '<span class="' +
      ratingBadgeClass +
      '" style="font-size:0.9375rem;padding:6px 14px;">' +
      ratingLabel +
      '</span>' +
      '</div>' +
      '</div>' +
      '<p style="margin:0 0 16px;color:var(--color-foreground);font-size:0.9375rem;line-height:1.5;">' +
      ratingMessage +
      '</p>' +
      '<div class="section-score-grid">' +
      sectionScoreBoxes +
      '</div>' +
      '<div class="banner-actions" style="margin-top:16px;justify-content:flex-end;">' +
      '<button type="button" class="btn btn-outline" id="btn-retake-practice">' +
      '<span>Làm lại bài tập này</span>' +
      '</button>' +
      '</div>' +
      reviewDetailsHtml +
      '</div>'
    );
  }

  function renderSectionReviewItemsHtml(sec, sub) {
    const studentAns = (sub.answers && sub.answers[sec.section_id]) || {};

    if (sec.type === 'matching') {
      const leftItems = (sec.data && sec.data.left) || [];
      const rightItems = (sec.data && sec.data.right) || [];
      const answerKey = (sec.data && sec.data.answer) || {};

      const rightMap = {};
      rightItems.forEach(function (r) {
        rightMap[r.id] = r.text;
      });

      return leftItems
        .map(function (l) {
          const userRightId = studentAns[String(l.id)];
          const expectedRightId = answerKey[String(l.id)];
          const isCorrect = userRightId === expectedRightId;

          return (
            '<div class="matching-card' +
            (isCorrect ? ' is-correct' : ' is-wrong') +
            '">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
            '<span class="matching-badge">' +
            (isCorrect ? '✓ Đúng (+1đ)' : '✕ Sai') +
            '</span>' +
            '<span class="matching-hanzi" style="font-size:1.125rem;">' +
            escapeHtml(l.hanzi) +
            '</span>' +
            '<span class="matching-pinyin">' +
            escapeHtml(l.pinyin) +
            '</span>' +
            '<span>&rarr; ' +
            (userRightId ? '[' + escapeHtml(userRightId) + '] ' + escapeHtml(rightMap[userRightId] || '') : '<em style="color:var(--color-destructive);">Chưa nối</em>') +
            '</span>' +
            '</div>' +
            (!isCorrect
              ? '<div style="font-size:0.8125rem;color:var(--color-primary-deep);font-weight:600;">Đáp án đúng: [' +
                escapeHtml(expectedRightId) +
                '] ' +
                escapeHtml(rightMap[expectedRightId] || '') +
                '</div>'
              : '') +
            '</div>'
          );
        })
        .join('');
    } else if (sec.type === 'multiple_choice' || sec.type === 'listening_mc') {
      const items = (sec.data && sec.data.items) || [];
      const isPerQuestionListening =
        sec.type === 'listening_mc' && sec.data && sec.data.listening_mode === 'per_question';
      return items
        .map(function (item, idx) {
          const userOpt = studentAns[item.id];
          const isCorrect =
            userOpt !== undefined &&
            userOpt !== null &&
            userOpt !== '' &&
            Number(userOpt) === Number(item.correctIndex);
          const userOptText =
            userOpt !== undefined && userOpt !== null && userOpt !== '' && item.options && item.options[userOpt]
              ? String.fromCharCode(65 + Number(userOpt)) + '. ' + item.options[userOpt]
              : 'Chưa chọn';
          const correctOptText =
            item.options && item.options[item.correctIndex]
              ? String.fromCharCode(65 + Number(item.correctIndex)) + '. ' + item.options[item.correctIndex]
              : '';
          const itemAudioReviewHtml = isPerQuestionListening
            ? renderListeningQuestionPlayerHtml(sec, item, idx, 'student-ls-review-')
            : '';

          return (
            '<div class="mc-card ' +
            (isCorrect ? 'is-correct' : 'is-wrong') +
            '">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">' +
            '<div style="font-weight:700;">Câu ' +
            (idx + 1) +
            ': ' +
            escapeHtml(item.prompt) +
            '</div>' +
            '<span class="status-badge ' +
            (isCorrect ? 'status-graded' : 'status-submitted') +
            '">' +
            (isCorrect ? '✓ Đúng (+1đ)' : '✕ Sai') +
            '</span>' +
            '</div>' +
            itemAudioReviewHtml +
            '<div style="margin-top:6px;font-size:0.875rem;">' +
            '<div>Đáp án của em: <strong style="color:' +
            (isCorrect ? 'var(--color-success)' : 'var(--color-destructive)') +
            ';">' +
            escapeHtml(userOptText) +
            '</strong></div>' +
            (!isCorrect
              ? '<div style="color:var(--color-primary-deep);margin-top:2px;">Đáp án đúng: <strong>' +
                escapeHtml(correctOptText) +
                '</strong></div>'
              : '') +
            '</div>' +
            (item.explanation
              ? '<div class="explanation-reveal-box">💡 <strong>Giải thích:</strong> ' +
                escapeHtml(item.explanation) +
                '</div>'
              : '') +
            '</div>'
          );
        })
        .join('');
    } else if (sec.type === 'fill_blank_wordbank') {
      const items = (sec.data && sec.data.items) || [];
      return items
        .map(function (item, idx) {
          const userVal = studentAns[item.id] || '';
          const isCorrect = window.StudySnapStore.isAnswerMatch(userVal, [item.answer]);

          return (
            '<div class="fill-blank-item ' +
            (isCorrect ? 'is-correct' : 'is-wrong') +
            '">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">' +
            '<div style="font-weight:700;">Câu ' +
            (idx + 1) +
            ': ' +
            escapeHtml(item.text.replace(/____/g, '【 ' + (userVal || '___') + ' 】')) +
            '</div>' +
            '<span class="status-badge ' +
            (isCorrect ? 'status-graded' : 'status-submitted') +
            '">' +
            (isCorrect ? '✓ Đúng (+1đ)' : '✕ Sai') +
            '</span>' +
            '</div>' +
            '<div style="font-size:0.875rem;margin-top:6px;">' +
            '<div>Từ em đã điền: <strong style="color:' +
            (isCorrect ? 'var(--color-success)' : 'var(--color-destructive)') +
            ';">' +
            escapeHtml(userVal || 'Chưa điền') +
            '</strong></div>' +
            (!isCorrect
              ? '<div style="color:var(--color-primary-deep);margin-top:2px;">Từ đúng là: <strong>' +
                escapeHtml(item.answer) +
                '</strong></div>'
              : '') +
            '<div class="fill-hint-text">Gợi ý nghĩa: ' +
            escapeHtml(item.hint) +
            '</div>' +
            '</div>' +
            '</div>'
          );
        })
        .join('');
    } else if (sec.type === 'error_correction') {
      const items = (sec.data && sec.data.items) || [];
      return items
        .map(function (item, idx) {
          const userVal = studentAns[item.id] || '';
          const isCorrect = window.StudySnapStore.isAnswerMatch(userVal, item.accepted || []);

          return (
            '<div class="error-item-card ' +
            (isCorrect ? 'is-correct' : 'is-wrong') +
            '">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">' +
            '<div style="font-weight:700;">Câu ' +
            (idx + 1) +
            ' — Tình huống: ' +
            escapeHtml(item.situation) +
            '</div>' +
            '<span class="status-badge ' +
            (isCorrect ? 'status-graded' : 'status-submitted') +
            '">' +
            (isCorrect ? '✓ Đúng (+1đ)' : '✕ Sai') +
            '</span>' +
            '</div>' +
            '<div class="error-wrong-sentence" style="font-size:1rem;margin:6px 0;">' +
            '<span style="font-size:0.8125rem;padding:2px 6px;border-radius:var(--radius-pill);background:var(--color-destructive-bg);color:var(--color-destructive);">Câu sai</span> ' +
            escapeHtml(item.wrong) +
            '</div>' +
            '<div style="font-size:0.875rem;">' +
            '<div>Câu em đã sửa: <strong style="color:' +
            (isCorrect ? 'var(--color-success)' : 'var(--color-destructive)') +
            ';">' +
            escapeHtml(userVal || 'Chưa nhập') +
            '</strong></div>' +
            (!isCorrect
              ? '<div style="color:var(--color-primary-deep);margin-top:2px;">Đáp án mẫu chấp nhận: <strong>' +
                escapeHtml((item.accepted || []).slice(0, 3).join(' / ')) +
                '</strong></div>'
              : '') +
            '</div>' +
            (item.explanation
              ? '<div class="explanation-reveal-box">💡 <strong>Giải thích lỗi sai:</strong> ' +
                escapeHtml(item.explanation) +
                '</div>'
              : '') +
            '</div>'
          );
        })
        .join('');
    } else if (sec.type === 'translation') {
      const items = (sec.data && sec.data.items) || [];
      const manualGrades = sub.manual_grades || {};

      return items
        .map(function (item, idx) {
          const userVal = studentAns[item.id] || '';
          const isManual = item.mode === 'manual';
          const mg = manualGrades[item.id];

          let isCorrect = false;
          let badgeHtml = '';

          if (isManual) {
            if (mg) {
              const sc = Number(mg.score || 0);
              isCorrect = sc >= 0.5;
              badgeHtml =
                '<span class="status-badge status-graded">Giáo viên chấm: ' + sc + '/1 đ</span>';
            } else {
              badgeHtml =
                '<span class="status-badge status-submitted">⏳ Đang chờ cô chấm</span>';
            }
          } else {
            isCorrect = window.StudySnapStore.isAnswerMatch(userVal, item.accepted || []);
            badgeHtml =
              '<span class="status-badge ' +
              (isCorrect ? 'status-graded' : 'status-submitted') +
              '">' +
              (isCorrect ? '✓ Đúng (+1đ)' : '✕ Sai') +
              '</span>';
          }

          return (
            '<div class="trans-item-card ' +
            (isManual && !mg
              ? 'is-pending'
              : isCorrect
              ? 'is-correct'
              : 'is-wrong') +
            '">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">' +
            '<div style="font-weight:700;">Câu ' +
            (idx + 1) +
            ': ' +
            escapeHtml(item.prompt) +
            '</div>' +
            badgeHtml +
            '</div>' +
            '<div style="font-size:0.875rem;margin-top:6px;">' +
            '<div>Bản dịch của em: <strong>' +
            escapeHtml(userVal || 'Chưa nhập') +
            '</strong></div>' +
            (!isManual && !isCorrect
              ? '<div style="color:var(--color-primary-deep);margin-top:2px;">Đáp án mẫu chấp nhận: <strong>' +
                escapeHtml((item.accepted || []).slice(0, 3).join(' / ')) +
                '</strong></div>'
              : '') +
            (isManual && mg && mg.comment
              ? '<div style="color:var(--color-primary-deep);margin-top:4px;">💬 Nhận xét của cô: <em>' +
                escapeHtml(mg.comment) +
                '</em></div>'
              : '') +
            '</div>' +
            (item.explanation
              ? '<div class="explanation-reveal-box">💡 <strong>Giải thích ngữ pháp/từ vựng:</strong> ' +
                escapeHtml(item.explanation) +
                '</div>'
              : '') +
            '</div>'
          );
        })
        .join('');
    }

    return '';
  }

  function bindPracticeResultsEvents(exercise, sub) {
    const btnRetake = document.getElementById('btn-retake-practice');
    if (btnRetake) {
      btnRetake.addEventListener('click', function () {
        if (
          window.confirm(
            'Em có chắc muốn làm lại bài tập này từ đầu không? Bài làm cũ sẽ được ghi đè bằng điểm số mới sau khi nộp.'
          )
        ) {
          ui.practiceViewingResult = false;
          ui.practiceAnswers = {};
          try {
            localStorage.removeItem(getPracticeDraftKey(exercise.exercise_id));
          } catch (e) {
            // ignore
          }
          renderStudentHeaderAndStats();
          renderPracticeSection();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  function initPracticeEvents() {
    const btnResetDraft = document.getElementById('btn-reset-practice-draft');
    if (btnResetDraft) {
      btnResetDraft.addEventListener('click', function () {
        const exercise = getActiveExercise();
        if (!exercise) return;
        if (
          window.confirm(
            'Làm lại từ đầu sẽ xóa toàn bộ câu trả lời đang làm dở của bài tập này. Em có chắc không?'
          )
        ) {
          ui.practiceAnswers = {};
          ui.selectedMatchingLeft = null;
          ui.selectedWordBankChip = null;
          ui.selectedTargetBlank = null;
          try {
            localStorage.removeItem(getPracticeDraftKey(exercise.exercise_id));
          } catch (e) {
            // ignore
          }
          showToast('Đã đặt lại bài tập từ đầu.');
          renderPracticeSection();
        }
      });
    }

    const formEl = document.getElementById('student-practice-form');
    if (formEl) {
      formEl.addEventListener('submit', async function (e) {
        e.preventDefault();
        const exercise = getActiveExercise();
        if (!exercise) return;
        const student = getActiveStudent();

        const stats = computePracticeProgress(exercise);
        if (stats.answered < stats.total) {
          const proceed = window.confirm(
            'Em mới làm ' +
              stats.answered +
              '/' +
              stats.total +
              ' câu hỏi. Em có chắc muốn nộp bài và chấm điểm ngay bây giờ không?'
          );
          if (!proceed) return;
        }

        // --- AUTOMATIC GRADING FOR ALL 5 SECTIONS ---
        let totalEarnedScore = 0;
        const sectionScores = {};
        let hasManualQuestions = false;

        (exercise.sections || []).forEach(function (sec) {
          const secAns = ui.practiceAnswers[sec.section_id] || {};
          let secScore = 0;

          if (sec.type === 'matching') {
            const answerKey = (sec.data && sec.data.answer) || {};
            const leftItems = (sec.data && sec.data.left) || [];
            leftItems.forEach(function (l) {
              const expected = answerKey[String(l.id)];
              const userVal = secAns[String(l.id)];
              if (userVal && userVal === expected) {
                secScore += 1;
              }
            });
          } else if (sec.type === 'multiple_choice' || sec.type === 'listening_mc') {
            const items = (sec.data && sec.data.items) || [];
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
            const secMax = Number(sec.max_score || items.length);
            if (items.length > 0 && secMax !== items.length) {
              secScore = Math.round((correctCount / items.length) * secMax * 10) / 10;
            } else {
              secScore = correctCount;
            }
          } else if (sec.type === 'fill_blank_wordbank') {
            const items = (sec.data && sec.data.items) || [];
            items.forEach(function (item) {
              const userVal = secAns[item.id] || '';
              if (window.StudySnapStore.isAnswerMatch(userVal, [item.answer])) {
                secScore += 1;
              }
            });
          } else if (sec.type === 'error_correction') {
            const items = (sec.data && sec.data.items) || [];
            items.forEach(function (item) {
              const userVal = secAns[item.id] || '';
              if (window.StudySnapStore.isAnswerMatch(userVal, item.accepted || [])) {
                secScore += 1;
              }
            });
          } else if (sec.type === 'translation') {
            const items = (sec.data && sec.data.items) || [];
            items.forEach(function (item) {
              const userVal = secAns[item.id] || '';
              if (item.mode === 'exact') {
                if (window.StudySnapStore.isAnswerMatch(userVal, item.accepted || [])) {
                  secScore += 1;
                }
              } else if (item.mode === 'keywords') {
                if (window.StudySnapStore.isKeywordsMatch(userVal, item.required_keywords || [])) {
                  secScore += 1;
                }
              } else if (item.mode === 'manual') {
                hasManualQuestions = true;
                // Preserved score if already graded previously
                const existingSub = findStudentPracticeSubmission(exercise.exercise_id);
                if (
                  existingSub &&
                  existingSub.manual_grades &&
                  existingSub.manual_grades[item.id]
                ) {
                  secScore += Number(existingSub.manual_grades[item.id].score || 0);
                }
              }
            });
          }

          sectionScores[sec.section_id] = secScore;
          totalEarnedScore += secScore;
        });

        const rating = window.StudySnapStore.calculateRating(
          totalEarnedScore,
          exercise.thresholds
        );

        const newSubmission = {
          submission_id:
            'PRAC_' + student.student_id + '_' + exercise.exercise_id + '_' + Date.now(),
          exercise_id: exercise.exercise_id,
          student_id: student.student_id,
          student_name: student.full_name,
          total_score: totalEarnedScore,
          max_score: exercise.total_score || 35,
          rating: rating,
          submitted_at: new Date().toLocaleString('vi-VN'),
          section_scores: sectionScores,
          answers: JSON.parse(JSON.stringify(ui.practiceAnswers)),
          manual_grades: {},
          status: hasManualQuestions ? 'pending_manual' : 'graded'
        };

        const submitBtn =
          document.getElementById('btn-submit-practice') ||
          formEl.querySelector('button[type="submit"]');
        const loading = window.StudySnapLoading;

        const runPracticeSubmit = async function () {
          const doSubmit = async function () {
            return await window.StudySnapStore.submitPracticeExercise(state, newSubmission);
          };
          const remoteRes = loading
            ? await loading.withOverlay(
                'Đang nộp bài luyện tập cuối buổi...',
                'Hệ thống đang chấm điểm tự động và lưu kết quả bài làm của em.',
                doSubmit
              )
            : await doSubmit();

          if (remoteRes && remoteRes.ok === false) {
            showToast(remoteRes.error || 'Chưa thể nộp bài lúc này. Vui lòng thử lại!');
            return;
          }

          try {
            localStorage.removeItem(getPracticeDraftKey(exercise.exercise_id));
          } catch (err) {
            // ignore
          }

          ui.practiceViewingResult = true;
          showToast(
            'Đã nộp bài tập thành công! Điểm số: ' +
              totalEarnedScore +
              '/' +
              (exercise.total_score || 35) +
              ' điểm'
          );
          renderStudentHeaderAndStats();
          renderPracticeSection();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        if (loading && submitBtn) {
          await loading.withButtonLoading(submitBtn, 'Đang chấm & nộp bài...', runPracticeSubmit);
        } else {
          await runPracticeSubmit();
        }
      });
    }
  }

  // =========================================================================
  // =========================================================================
  // 4. TAB 3: ÔN TẬP TỪ VỰNG THEO BÀI, KHO 272 TỪ & NHIỆM VỤ ĐƯỢC GIAO
  // =========================================================================
  function getStudentLessonsList() {
    if (window.StudySnapStore && typeof window.StudySnapStore.getSyncedLessons === 'function') {
      return window.StudySnapStore.getSyncedLessons(state);
    }
    return [];
  }

  function findVocabSubmissionForTask(assignmentId, studentId) {
    return (state.submissions || []).find(function (s) {
      return String(s.assignment_id) === String(assignmentId) && String(s.student_id) === String(studentId);
    });
  }

  function toggleStudentVocabMastered(masteryKey) {
    if (!masteryKey) return;
    const keyStr = String(masteryKey);
    const idx = ui.masteredIds.indexOf(keyStr);
    if (idx === -1) {
      ui.masteredIds.push(keyStr);
      showToast('Đã đánh dấu thuộc từ vựng này!');
    } else {
      ui.masteredIds.splice(idx, 1);
      showToast('Đã bỏ đánh dấu thuộc từ.');
    }
    saveMasteredIds();
    renderStudentHeaderAndStats();
    renderStudentAssignedVocabTasks();
  }

  function computeMasteryStatsForLesson(lessonKey) {
    const vocabList = Array.isArray(state.vocabulary) ? state.vocabulary : [];
    const targetList = lessonKey === 'all-lessons'
      ? vocabList
      : (lessonKey === 'hsk-272'
        ? []
        : vocabList.filter(function (v) { return String(v.lesson_id || '') === lessonKey; }));
    const total = lessonKey === 'hsk-272'
      ? ((window.StudySnapVocabList && window.StudySnapVocabList.length) || 272)
      : targetList.length;
    const masteredCount = lessonKey === 'hsk-272'
      ? ui.masteredIds.filter(function (id) { return String(id).indexOf('HSK272_') === 0; }).length
      : targetList.filter(function (v) { return ui.masteredIds.indexOf(v.vocab_id) !== -1; }).length;
    return { masteredCount: masteredCount, total: total };
  }

  async function submitStudentVocabTaskProgress(task, opts, triggerBtn) {
    const student = getActiveStudent();
    if (!task || !student) return;
    const options = opts || {};
    const stats = computeMasteryStatsForLesson(task.lesson_id || 'hsk-272');
    const fallbackPct = stats.total > 0 ? Math.min(100, Math.round((stats.masteredCount / stats.total) * 100)) : 100;
    const scoreStr = options.score !== undefined ? String(options.score) : String(fallbackPct);
    const durStr = options.media_duration || (stats.masteredCount + '/' + Math.max(1, stats.total) + ' từ');
    const noteStr = options.student_note || ('Đã ôn từ vựng (' + (task.lesson_tag || task.lesson_id) + ') • Thuộc ' + stats.masteredCount + '/' + stats.total + ' từ');

    const runSync = async function () {
      await window.StudySnapStore.submitVocabCompletion(state, {
        assignment_id: task.assignment_id,
        student_id: student.student_id,
        score: scoreStr,
        media_duration: durStr,
        student_note: noteStr,
        status: 'graded'
      });
    };

    if (triggerBtn && window.StudySnapLoading && typeof window.StudySnapLoading.withButtonLoading === 'function') {
      await window.StudySnapLoading.withButtonLoading(triggerBtn, 'Đang gửi kết quả...', runSync);
    } else {
      await runSync();
    }

    renderStudentHeaderAndStats();
    renderStudentAssignedVocabTasks();
  }

  function renderStudentAssignedVocabTasks() {
    const strip = document.getElementById('student-vocab-assigned-strip');
    const student = getActiveStudent();
    const tasks = getStudentVocabAssignments(student);
    const tabBtn = document.querySelector('[data-student-tab="vocabulary"]');

    let pendingCount = 0;
    tasks.forEach(function (t) {
      if (!findVocabSubmissionForTask(t.assignment_id, student.student_id)) pendingCount++;
    });

    if (tabBtn) {
      let badge = tabBtn.querySelector('.vocab-nav-pending-badge');
      if (pendingCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'vocab-nav-pending-badge tabular-nums';
          tabBtn.appendChild(badge);
        }
        badge.textContent = String(pendingCount);
      } else if (badge) {
        badge.remove();
      }
    }

    if (!strip) return;
    if (tasks.length === 0) {
      strip.style.display = 'none';
      strip.innerHTML = '';
      return;
    }

    strip.style.display = 'block';
    strip.innerHTML =
      '<div class="vocab-assigned-header">' +
        '<div class="vocab-assigned-heading">' +
          '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>' +
          '<span>Nhiệm vụ ôn từ vựng giáo viên giao cho lớp (' + tasks.length + ')</span>' +
        '</div>' +
        '<span class="vocab-assigned-hint">Hoàn thành bài Luyện Trắc Nghiệm hoặc bấm Xác nhận sau khi ôn xong để gửi kết quả cho giáo viên.</span>' +
      '</div>' +
      '<div class="vocab-assigned-grid">' +
        tasks.map(function (task) {
          const sub = findVocabSubmissionForTask(task.assignment_id, student.student_id);
          const isDone = Boolean(sub);
          const lessonKey = task.lesson_id || 'hsk-272';
          const statusBadge = isDone
            ? '<span class="status-badge status-graded tabular-nums">Đã hoàn thành' + (sub.score ? ' · ' + escapeHtml(sub.score) + '%' : '') + '</span>'
            : '<span class="status-badge status-missing">Chưa hoàn thành</span>';
          return (
            '<div class="vocab-assigned-card' + (isDone ? ' is-done' : '') + '">' +
              '<div class="vocab-assigned-card-top">' +
                '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                  '<span class="vlist-lesson-tag">' + escapeHtml(task.lesson_tag || 'Từ vựng') + '</span>' +
                  statusBadge +
                '</div>' +
                (task.due_date ? '<span class="vocab-assigned-due tabular-nums">Hạn: ' + escapeHtml(task.due_date) + '</span>' : '') +
              '</div>' +
              '<h4 class="vocab-assigned-title">' + escapeHtml(task.title) + '</h4>' +
              (task.description ? '<p class="vocab-assigned-desc">' + escapeHtml(task.description) + '</p>' : '') +
              (sub && sub.student_note ? '<div class="vocab-assigned-result">' + escapeHtml(sub.student_note) + '</div>' : '') +
              '<div class="vocab-assigned-actions">' +
                '<button type="button" class="btn btn-primary btn-sm" data-open-vocab-task="' + escapeHtml(lessonKey) + '">Vào ôn bài này</button>' +
                '<button type="button" class="btn btn-outline btn-sm" data-submit-vocab-task="' + escapeHtml(task.assignment_id) + '">' +
                  (isDone ? 'Cập nhật kết quả ôn' : 'Xác nhận đã ôn xong') +
                '</button>' +
              '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>';
  }

  function ensureStudentVocabSuiteConfigured() {
    if (!window.StudySnapVocabSuite || typeof window.StudySnapVocabSuite.configure !== 'function') return;
    if (ui.vocabSuiteConfigured) return;
    ui.vocabSuiteConfigured = true;
    window.StudySnapVocabSuite.configure({
      isTeacher: false,
      getLessons: getStudentLessonsList,
      getVocabularyItems: function () { return state.vocabulary || []; },
      getMasteredIds: function () { return ui.masteredIds || []; },
      onToggleMastered: function (masteryKey) {
        toggleStudentVocabMastered(masteryKey);
      },
      onQuizComplete: async function (summary) {
        if (!summary) return;
        const student = getActiveStudent();
        const matchingTasks = getStudentVocabAssignments(student).filter(function (t) {
          return String(t.lesson_id || '') === String(summary.sourceKey || '');
        });
        if (matchingTasks.length > 0) {
          for (let i = 0; i < matchingTasks.length; i++) {
            await submitStudentVocabTaskProgress(matchingTasks[i], {
              score: summary.pct,
              media_duration: summary.correct + '/' + summary.total + ' câu',
              student_note: 'Hoàn thành Trắc nghiệm: ' + summary.correct + '/' + summary.total + ' câu (' + summary.pct + '%)'
            });
          }
          showToast('Đã tự động ghi nhận kết quả trắc nghiệm (' + summary.pct + '%) gửi giáo viên!');
        }
      }
    });
  }

  function renderVocabularySection() {
    ensureStudentVocabSuiteConfigured();
    renderStudentAssignedVocabTasks();
    if (window.StudySnapVocabSuite && typeof window.StudySnapVocabSuite.render === 'function') {
      window.StudySnapVocabSuite.render(false);
    }
  }

  function initVocabularyEvents() {
    ensureStudentVocabSuiteConfigured();
    const assignedStrip = document.getElementById('student-vocab-assigned-strip');
    if (assignedStrip) {
      assignedStrip.addEventListener('click', async function (ev) {
        const openBtn = ev.target.closest('[data-open-vocab-task]');
        if (openBtn) {
          const lid = openBtn.getAttribute('data-open-vocab-task');
          if (window.StudySnapVocabSuite && typeof window.StudySnapVocabSuite.selectSource === 'function') {
            window.StudySnapVocabSuite.selectSource(lid, { subTab: 'flashcard' });
          }
          return;
        }
        const submitBtn = ev.target.closest('[data-submit-vocab-task]');
        if (submitBtn) {
          const asgId = submitBtn.getAttribute('data-submit-vocab-task');
          const task = getStudentVocabAssignments(getActiveStudent()).find(function (t) {
            return String(t.assignment_id) === String(asgId);
          });
          if (task) {
            await submitStudentVocabTaskProgress(task, {}, submitBtn);
            showToast('Đã nộp kết quả ôn tập "' + task.title + '" cho giáo viên!');
          }
        }
      });
    }
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

    const btnGoPractice = document.getElementById('btn-banner-go-practice');
    if (btnGoPractice) {
      btnGoPractice.addEventListener('click', function () {
        switchTab('practice');
        renderPracticeSection();
      });
    }

    const btnGoVocabAll = document.getElementById('btn-banner-go-vocab-all');
    if (btnGoVocabAll) {
      btnGoVocabAll.addEventListener('click', function () {
        switchTab('vocabulary');
        if (window.StudySnapVocabSuite && typeof window.StudySnapVocabSuite.selectSource === 'function') {
          window.StudySnapVocabSuite.selectSource('all-lessons');
        } else {
          renderVocabularySection();
        }
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
    renderPracticeSection();
    renderExitTicketSection();
    renderVocabularySection();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initGlobalEvents();
    initHomeworkEvents();
    initPracticeEvents();
    initVocabularyEvents();
    renderAll();

    if (window.StudySnapStore.getGasUrl()) {
      window.StudySnapStore.fetchBootstrapFromGas(state).then(function (remoteRes) {
        state = window.StudySnapStore.loadState();
        if (remoteRes && remoteRes.ok && remoteRes.data) {
          const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
          if (!isPreview && !window.StudySnapAuth.revalidateActiveSession(state)) {
            window.location.replace('index.html?session=expired');
            return;
          }
        }
        renderAll();
      });
    }
  });
})();
