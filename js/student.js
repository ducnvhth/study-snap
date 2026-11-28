/**
 * StudySnap — Logic Cổng Học Sinh (`student.html`)
 * - Bảo vệ trang theo vai trò `student` (`StudySnapAuth.enforceRole('student')`)
 * - Nộp BVN đa phương tiện (Ghi âm trực tiếp hoặc tải file Audio/Video) và nghe phản hồi giáo viên (Nhận xét + Voice Feedback)
 * - Bảng theo dõi tiến độ BVN & phản hồi giáo viên của riêng học sinh đang đăng nhập
 * - Làm Bài luyện tập cuối buổi tương tác & lưu lịch sử cá nhân
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
  const WELCOME_QUOTE_KEY = 'studysnap_last_welcome_quote_' + activeStudent.student_id;

  const STUDENT_WELCOME_QUOTES = {
    completed: [
      'Em đã hoàn thành trọn vẹn mọi bài tập được giao hôm nay rồi — thật đáng tự hào! Dành ít phút ôn lại từ vựng để nhớ sâu hơn nhé.',
      'Tất cả bài luyện và BVN đều đã gọn gàng xong xuôi. Hôm nay em đã nỗ lực rất tuyệt vời!',
      'Chặng bài hôm nay đã cán đích trọn vẹn rồi đấy. Nghỉ ngơi một chút hoặc ghé lật nhanh vài thẻ từ vựng cho vui nhé!',
      'Phong độ rất ổn định! Em đã xong hết nhiệm vụ của buổi học hôm nay — giữ vững đà tiến bộ này nhé.'
    ],
    encouraging: [
      'Mỗi ngày kiên trì thêm một chút là phát âm và chữ Hán sẽ tự nhiên vững vàng hơn. Cố lên em nhé!',
      'Không cần vội đi thật nhanh, chỉ cần mỗi ngày em tiến thêm một bước nhỏ so với hôm qua là đã rất tuyệt rồi.',
      'Nghe thêm một lượt, đọc to thêm một lần — âm bật hơi và 4 thanh điệu sẽ dần trở nên thật tự nhiên.',
      'Mỗi chữ Hán em viết hôm nay, mỗi câu em thu âm hôm nay đều là một viên gạch xây nên sự tự tin của ngày mai.',
      'Học ngoại ngữ giống như tích lũy từng giọt mưa nhỏ: đều đặn mỗi ngày một ít, rồi đến lúc em sẽ bất ngờ vì mình hiểu được thật nhiều.',
      'Sai một lần cũng chẳng sao cả — mỗi lần sửa phát âm là một lần nhớ chắc hơn gấp bội!',
      'Bắt đầu từ 5 phút luyện tập nhẹ nhàng ngay bây giờ, em sẽ thấy tiếng Trung gần gũi và thú vị hơn mỗi ngày.',
      'Hành trình chinh phục tiếng Trung bắt đầu từ những bước nhỏ bền bỉ. Hôm nay cùng chinh phục thêm một mục tiêu nhỏ nhé!',
      'Giọng đọc tự tin không tự nhiên mà có — nó được tạo nên từ những lần em dám mở mic lên và thử nói thật to.',
      'Một chút tập trung hôm nay sẽ đổi lấy thật nhiều thoải mái ở buổi học tiếp theo. Bắt đầu thôi nào!',
      'Đừng lo nếu hôm nay mới nhớ được vài từ mới: chỉ cần gặp lại chúng thêm vài lượt nữa, bộ não sẽ tự động ghi nhớ giúp em.',
      'Sự đều đặn luôn chiến thắng tốc độ. Chỉ cần em giữ nhịp học mỗi ngày, kết quả tốt sẽ tự tìm đến.'
    ]
  };

  const ui = {
    activeTab: 'practice',
    selectedHomeworkSession: 'all',
    selectedAssignmentId: state.assignments[0] ? state.assignments[0].assignment_id : 'BVN01_1',
    selectedAttemptSubId: null,
    resubmitExpandedAsgId: null,
    dismissedAutoResubmitAsgId: null,
    pendingMedia: null,
    welcomeQuoteCategory: null,
    welcomeQuoteText: null,

    // Practice state
    selectedExerciseId: (state.practiceExercises && state.practiceExercises[0]) ? state.practiceExercises[0].exercise_id : 'EX_HSK1_BAI_1',
    practiceAnswers: {},
    selectedMatchingLeft: null,
    selectedWordBankChip: null,
    selectedTargetBlank: null,
    matchingShuffledRight: {},
    practiceViewingResult: false,
    practiceSummaryFilter: 'all',
    practiceSummarySort: 'default',
    bvnSummarySort: 'default',

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

  const STUDENT_SORT_ICONS = {
    none: '<svg class="sort-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>',
    asc: '<svg class="sort-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
    desc: '<svg class="sort-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
  };

  function compareNullableNumStudent(aVal, bVal, isAsc) {
    const hasA = typeof aVal === 'number' && Number.isFinite(aVal);
    const hasB = typeof bVal === 'number' && Number.isFinite(bVal);
    if (!hasA && !hasB) return 0;
    if (!hasA) return 1;
    if (!hasB) return -1;
    return isAsc ? (aVal - bVal) : (bVal - aVal);
  }

  function parseViDateTimestamp(dateStr) {
    const raw = String(dateStr || '').trim();
    if (!raw) return null;
    const m = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]) - 1;
      const year = Number(m[3]);
      const ts = new Date(year, month, day).getTime();
      return Number.isFinite(ts) ? ts : null;
    }
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function toggleStudentSortKey(curKey, colKey, defaultDescCols) {
    const cur = String(curKey || 'default');
    const firstDesc = Array.isArray(defaultDescCols) && defaultDescCols.indexOf(colKey) !== -1;
    const first = colKey + (firstDesc ? '_desc' : '_asc');
    const second = colKey + (firstDesc ? '_asc' : '_desc');
    if (cur === first) return second;
    if (cur === second) return 'default';
    return first;
  }

  function syncStudentSortIndicators(attrName, activeSortKey) {
    const cur = String(activeSortKey || 'default');
    document.querySelectorAll('[' + attrName + ']').forEach(function (btn) {
      const colKey = btn.getAttribute(attrName);
      let dir = 'none';
      if (colKey && cur === colKey + '_asc') dir = 'asc';
      else if (colKey && cur === colKey + '_desc') dir = 'desc';
      btn.classList.toggle('is-sorted', dir !== 'none');
      const ind = btn.querySelector('.sort-indicator');
      if (ind) {
        ind.innerHTML = dir === 'asc'
          ? STUDENT_SORT_ICONS.asc
          : (dir === 'desc' ? STUDENT_SORT_ICONS.desc : STUDENT_SORT_ICONS.none);
      }
    });
  }

  function sortStudentRows(items, sortKey, accessors) {
    const list = (items || []).slice();
    const key = String(sortKey || 'default');
    if (key === 'default' || list.length <= 1) return list;

    const lastUnderscore = key.lastIndexOf('_');
    const colKey = lastUnderscore > 0 ? key.slice(0, lastUnderscore) : '';
    const isAsc = lastUnderscore > 0 ? key.slice(lastUnderscore + 1) === 'asc' : true;

    list.sort(function (a, b) {
      let diff = 0;
      if (colKey === 'title' && accessors.getTitle) {
        const cmp = String(accessors.getTitle(a) || '').localeCompare(
          String(accessors.getTitle(b) || ''),
          'vi',
          { numeric: true, sensitivity: 'base' }
        );
        diff = isAsc ? cmp : -cmp;
      } else if (colKey === 'due' && accessors.getDue) {
        const tsA = parseViDateTimestamp(accessors.getDue(a));
        const tsB = parseViDateTimestamp(accessors.getDue(b));
        diff = compareNullableNumStudent(tsA, tsB, isAsc);
        if (diff === 0) {
          const cmp = String(accessors.getDue(a) || '').localeCompare(String(accessors.getDue(b) || ''), 'vi');
          diff = isAsc ? cmp : -cmp;
        }
      } else if (colKey === 'status' && accessors.getStatusRank) {
        const rA = Number(accessors.getStatusRank(a) || 0);
        const rB = Number(accessors.getStatusRank(b) || 0);
        diff = isAsc ? (rA - rB) : (rB - rA);
      } else if (colKey === 'score' && accessors.getScore) {
        diff = compareNullableNumStudent(accessors.getScore(a), accessors.getScore(b), isAsc);
      }
      if (diff !== 0) return diff;
      if (accessors.getTitle) {
        return String(accessors.getTitle(a) || '').localeCompare(
          String(accessors.getTitle(b) || ''),
          'vi',
          { numeric: true, sensitivity: 'base' }
        );
      }
      return 0;
    });
    return list;
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

  function getSubmissionAttempts(assignmentId, studentId) {
    const list = (state.submissions || []).filter(function (sub) {
      return String(sub.assignment_id) === String(assignmentId) && String(sub.student_id) === String(studentId);
    });
    if (list.length <= 1) return list;
    return list
      .map(function (sub, idx) {
        return { sub: sub, idx: idx };
      })
      .sort(function (a, b) {
        const attA = Math.max(1, Number(a.sub.attempt_number || 1) || 1);
        const attB = Math.max(1, Number(b.sub.attempt_number || 1) || 1);
        if (attA !== attB) return attA - attB;
        return a.idx - b.idx;
      })
      .map(function (item) {
        return item.sub;
      });
  }

  function findSubmission(assignmentId, studentId) {
    const attempts = getSubmissionAttempts(assignmentId, studentId);
    return attempts.length ? attempts[attempts.length - 1] : null;
  }

  function findSubmissionById(assignmentId, studentId, submissionId) {
    const attempts = getSubmissionAttempts(assignmentId, studentId);
    if (!attempts.length) return null;
    if (submissionId) {
      const exact = attempts.find(function (sub) {
        return String(sub.submission_id) === String(submissionId);
      });
      if (exact) return exact;
    }
    return attempts[attempts.length - 1];
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
      renderVocabularySection();
    }
  }

  // =========================================================================
  // 1. HEADER & PERSONAL PROGRESS SUMMARY BANNER
  // =========================================================================
  function formatStudentClassLabel(student) {
    const rawClass = String((student && student.class_name) || 'Lớp Tiếng Trung HSK 2').trim();
    return /^lớp\b/i.test(rawClass) ? rawClass : 'Lớp ' + rawClass;
  }

  /**
   * Chọn một quote động viên mới cho mỗi lần tải trang và tránh lặp lại quote vừa xem trước đó.
   */
  function pickStudentWelcomeQuote(progress) {
    const totalAssignments = Number(progress && progress.totalAssignments) || 0;
    const submittedCount = Number(progress && progress.submittedCount) || 0;
    const totalPracticeCount = Number(progress && progress.totalPracticeCount) || 0;
    const submittedPracticeCount = Number(progress && progress.submittedPracticeCount) || 0;

    const allTasksTotal = totalAssignments + totalPracticeCount;
    const category =
      allTasksTotal > 0 &&
      submittedCount >= totalAssignments &&
      submittedPracticeCount >= totalPracticeCount
        ? 'completed'
        : 'encouraging';

    if (ui.welcomeQuoteCategory === category && ui.welcomeQuoteText) {
      return ui.welcomeQuoteText;
    }

    const pool = STUDENT_WELCOME_QUOTES[category] || STUDENT_WELCOME_QUOTES.encouraging;
    let lastQuote = '';
    try {
      lastQuote = localStorage.getItem(WELCOME_QUOTE_KEY) || '';
    } catch (e) {}

    const candidates = pool.filter(function (quote) {
      return quote !== lastQuote;
    });
    const source = candidates.length > 0 ? candidates : pool;
    const chosen = source[Math.floor(Math.random() * source.length)] || pool[0];

    ui.welcomeQuoteCategory = category;
    ui.welcomeQuoteText = chosen;
    try {
      localStorage.setItem(WELCOME_QUOTE_KEY, chosen);
    } catch (e) {}

    return chosen;
  }

  function renderStudentHeaderAndStats() {
    const student = getActiveStudent();

    const profilePill = document.getElementById('student-profile-pill');
    const headerSub = document.getElementById('student-header-subtitle');
    const welcomeHeading = document.getElementById('student-welcome-heading');
    const welcomeClass = document.getElementById('student-welcome-class');
    const welcomeDesc = document.getElementById('student-welcome-desc');
    const accountBadge = document.getElementById('student-account-badge');

    if (profilePill) {
      profilePill.textContent = student.full_name + ' (' + student.student_id + ')';
    }
    if (headerSub) {
      headerSub.textContent = (student.class_name || 'Lớp Tiếng Trung HSK 2') + ' • Tài khoản: @' + (student.username || student.student_id.toLowerCase());
    }
    if (welcomeHeading) {
      const fullName = String(student.full_name || '').trim();
      welcomeHeading.textContent = fullName ? 'Chào mừng trở lại, ' + fullName : 'Chào mừng trở lại';
    }
    if (welcomeClass) {
      welcomeClass.textContent = formatStudentClassLabel(student);
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
        if (sub.status === 'graded' || sub.status === 'resubmit_required' || sub.teacher_comment || sub.teacher_voice_url) {
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
    const targetStuKey = String((student && student.student_id) || '').trim().toUpperCase();
    let submittedPracticeCount = 0;
    visiblePracticeExercises.forEach(function (ex) {
      const targetExId = String((ex && ex.exercise_id) || '').trim();
      const hasSubmitted = (state.practiceSubmissions || []).some(function (sub) {
        return (
          String((sub && sub.exercise_id) || '').trim() === targetExId &&
          String((sub && sub.student_id) || '').trim().toUpperCase() === targetStuKey
        );
      });
      if (hasSubmitted) {
        submittedPracticeCount++;
      }
    });

    const avgScore = scoreCount > 0 ? (scoreTotal / scoreCount).toFixed(1) : '—';
    const customVocabList = Array.isArray(state.vocabulary) ? state.vocabulary : [];
    const hskBanks = (typeof window !== 'undefined' && window.StudySnapHskBanks && typeof window.StudySnapHskBanks === 'object')
      ? window.StudySnapHskBanks
      : {};
    const hskTotal = ['hsk-1', 'hsk-2', 'hsk-3'].reduce(function (sum, lvl) {
      return sum + (Array.isArray(hskBanks[lvl]) ? hskBanks[lvl].length : 0);
    }, 0);
    const totalVocab = customVocabList.length + hskTotal;
    const customMasteredCount = ui.masteredIds.filter(function (id) {
      return customVocabList.some(function (v) {
        return v.vocab_id === id;
      });
    }).length;
    const hskMasteredCount = hskTotal > 0
      ? ui.masteredIds.filter(function (id) {
          const s = String(id || '');
          return s.indexOf('HSK1_') === 0 || s.indexOf('HSK2_') === 0 || s.indexOf('HSK3_') === 0;
        }).length
      : 0;
    const validMasteredCount = Math.min(totalVocab, customMasteredCount + hskMasteredCount);

    if (welcomeDesc) {
      welcomeDesc.textContent = pickStudentWelcomeQuote({
        totalAssignments: totalAssignments,
        submittedCount: submittedCount,
        totalPracticeCount: totalPracticeCount,
        submittedPracticeCount: submittedPracticeCount
      });
    }

    const elSubmitted = document.getElementById('student-stat-hw-submitted');
    const elGraded = document.getElementById('student-stat-hw-graded');
    const elAvg = document.getElementById('student-stat-avg-score');
    const elVocab = document.getElementById('student-stat-vocab-mastered');
    const elVocabPractices = document.getElementById('student-stat-vocab-practices');
    const elPracticeScore = document.getElementById('student-stat-practice-score');
    const elPracticeRating = document.getElementById('student-stat-practice-rating');

    const vocabPracticeStats =
      typeof window !== 'undefined' &&
      window.StudySnapStore &&
      typeof window.StudySnapStore.getStudentVocabPracticeStats === 'function'
        ? window.StudySnapStore.getStudentVocabPracticeStats(state, student.student_id)
        : { totalCount: 0 };

    if (elSubmitted) elSubmitted.textContent = submittedPracticeCount + '/' + totalPracticeCount;
    if (elGraded) elGraded.textContent = String(gradedWithVoiceCount);
    if (elAvg) elAvg.textContent = String(avgScore);
    if (elVocab) elVocab.textContent = validMasteredCount + '/' + totalVocab;
    if (elVocabPractices) elVocabPractices.textContent = 'Đã luyện: ' + vocabPracticeStats.totalCount + ' lần';

    const currentEx = getActiveExercise();
    const practiceSub = currentEx ? findStudentPracticeSubmission(currentEx.exercise_id) : null;
    if (elPracticeScore) {
      elPracticeScore.textContent = practiceSub
        ? practiceSub.total_score + '/' + (practiceSub.max_score || (currentEx && currentEx.total_score) || 35)
        : '—';
    }
    if (elPracticeRating) {
      if (practiceSub) {
        const resolvedRatingKey =
          typeof window !== 'undefined' &&
          window.StudySnapStore &&
          typeof window.StudySnapStore.resolvePracticeRatingKey === 'function'
            ? window.StudySnapStore.resolvePracticeRatingKey(
                practiceSub.rating,
                practiceSub.total_score,
                practiceSub.max_score || (currentEx && currentEx.total_score),
                currentEx && currentEx.thresholds
              )
            : practiceSub.rating;
        elPracticeRating.textContent =
          resolvedRatingKey === 'very_good' ? 'Rất tốt' : resolvedRatingKey === 'good' ? 'Khá' : 'Cần ôn';
      } else {
        elPracticeRating.textContent = 'Chưa làm';
      }
    }
  }

  // =========================================================================
  // 2. TAB 2: BVN & PHẢN HỒI GIÁO VIÊN (NỘP AUDIO/VIDEO & XEM VOICE FEEDBACK)
  // =========================================================================
  function getStudentAssignments(student) {
    const activeList = (state.assignments || []).filter(function (asg) {
      if (String(asg.require_media || '').trim().toLowerCase() === 'vocab') return false;
      if (String(asg.require_media || '').trim().toLowerCase() === 'practice') return false;
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
            ui.selectedAttemptSubId = null;
            ui.resubmitExpandedAsgId = null;
            ui.dismissedAutoResubmitAsgId = null;
            ui.pendingMedia = null;
            const noteAreaEl = document.getElementById('student-note-textarea');
            if (noteAreaEl) noteAreaEl.value = '';
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
          const attempts = getSubmissionAttempts(asg.assignment_id, student.student_id);
          const sub = attempts.length ? attempts[attempts.length - 1] : null;
          const attNum = sub ? Math.max(attempts.length, Number(sub.attempt_number || 1) || 1) : 0;
          const attPrefix = attNum > 1 ? ('L' + attNum + ' • ') : '';
          const isSelected = asg.assignment_id === ui.selectedAssignmentId;
          let badgeBg = 'var(--soft)';
          let badgeFg = 'var(--muted)';
          let badgeBorder = 'rgba(45, 27, 78, 0.14)';
          let statusText = 'Chưa nộp';
          if (sub && sub.status === 'resubmit_required') {
            badgeBg = '#FFE4EC';
            badgeFg = '#9E1650';
            badgeBorder = '#FF85B3';
            statusText = attPrefix + 'Cần nộp lại';
          } else if (sub && sub.status === 'graded') {
            badgeBg = 'var(--mint-lt)';
            badgeFg = 'var(--color-success-text)';
            badgeBorder = 'var(--color-success-border)';
            statusText = attPrefix + (sub.score !== '' && sub.score !== undefined && sub.score !== null ? (sub.score + 'đ') : 'Đã chấm');
          } else if (sub) {
            badgeBg = 'var(--ylt)';
            badgeFg = 'var(--color-warning-text)';
            badgeBorder = 'var(--color-warning-border)';
            statusText = attNum > 1 ? ('Lần ' + attNum + ' • Chờ chữa') : 'Đã nộp';
          }
          return (
            '<button type="button" class="sub-asg-chip' + (isSelected ? ' is-active' : '') + '" data-subtask-id="' + escapeHtml(asg.assignment_id) + '">' +
            '<span>' + escapeHtml(asg.lesson_tag || asg.title) + '</span>' +
            '<span class="tabular-nums" style="font-size:0.75rem;padding:2px 8px;border-radius:var(--radius-full);background:' + badgeBg + ';color:' + badgeFg + ';border:1px solid ' + badgeBorder + ';font-weight:700;">' +
            escapeHtml(statusText) +
            '</span>' +
            '</button>'
          );
        }).join('');

        subtaskChipsRow.querySelectorAll('[data-subtask-id]').forEach(function (chip) {
          chip.addEventListener('click', function () {
            ui.selectedAssignmentId = chip.getAttribute('data-subtask-id');
            ui.selectedAttemptSubId = null;
            ui.resubmitExpandedAsgId = null;
            ui.dismissedAutoResubmitAsgId = null;
            ui.pendingMedia = null;
            const noteAreaEl = document.getElementById('student-note-textarea');
            if (noteAreaEl) noteAreaEl.value = '';
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
        summaryText.textContent = 'Toàn bộ ' + studentAssignments.length + ' bài tập về nhà (BVN)';
      } else {
        summaryText.textContent = 'Đang xem ' + ui.selectedHomeworkSession + ' (' + filteredAssignments.length + ' BVN)';
      }
    }

    if (selectEl) {
      selectEl.innerHTML = filteredAssignments.length > 0
        ? filteredAssignments
            .map(function (asg) {
              const attempts = getSubmissionAttempts(asg.assignment_id, student.student_id);
              const sub = attempts.length ? attempts[attempts.length - 1] : null;
              const attNum = sub ? Math.max(attempts.length, Number(sub.attempt_number || 1) || 1) : 0;
              const attPrefix = attNum > 1 ? ('Lần ' + attNum + ' • ') : '';
              let statusLabel = 'Chưa nộp';
              if (sub && sub.status === 'resubmit_required') {
                statusLabel = attPrefix + 'Cô yêu cầu nộp lại' + (sub.score !== '' && sub.score !== undefined && sub.score !== null ? (' • ' + sub.score + '/10') : '');
              } else if (sub && sub.status === 'graded') {
                statusLabel = attPrefix + 'Đã chấm: ' + sub.score + (asg.require_media === 'practice' ? 'đ' : '/10');
              } else if (sub) {
                statusLabel = attPrefix + 'Đã nộp • Chờ phản hồi GV';
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
        : '<option value="">-- Chưa có BVN cho buổi này --</option>';
    }

    const currentAsg =
      filteredAssignments.find(function (a) {
        return a.assignment_id === ui.selectedAssignmentId;
      }) || filteredAssignments[0] || studentAssignments[0] || null;

    const briefTitle = document.getElementById('student-brief-title');
    const briefDesc = document.getElementById('student-brief-desc');
    const resubmitSlot = document.getElementById('student-bvn-resubmit-slot');
    const recorderZone = document.getElementById('student-recorder-zone');
    const noteArea = document.getElementById('student-note-textarea');
    const noteFormGroup = noteArea ? noteArea.closest('.form-group') : null;
    const submitBtn = document.querySelector('#student-submit-hw-form button[type="submit"]');
    let practiceCallout = document.getElementById('practice-asg-callout');

    const currentAttempts = currentAsg ? getSubmissionAttempts(currentAsg.assignment_id, student.student_id) : [];
    const currentLatestSub = currentAttempts.length ? currentAttempts[currentAttempts.length - 1] : null;
    const currentLatestAtt = currentLatestSub ? Math.max(currentAttempts.length, Number(currentLatestSub.attempt_number || 1) || 1) : 0;
    const nextAttemptNum = currentLatestSub ? currentLatestAtt + 1 : 1;

    if (currentAsg) {
      if (briefTitle) {
        briefTitle.textContent = currentAsg.title + ' • Hạn nộp: ' + currentAsg.due_date;
      }
      if (briefDesc) {
        briefDesc.textContent = currentAsg.description;
      }

      if (currentAsg.require_media === 'practice') {
        if (resubmitSlot) resubmitSlot.innerHTML = '';
        if (recorderZone) recorderZone.style.display = 'none';
        if (noteFormGroup) noteFormGroup.style.display = 'none';
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
        if (practiceCallout) practiceCallout.style.display = 'none';
        const reqMedia = String(currentAsg.require_media || 'audio_or_video').trim().toLowerCase();
        const isImageOnlyAsg = reqMedia === 'image';
        const allowsImageAsg = reqMedia === 'image' || reqMedia === 'audio_video_image' || reqMedia === 'any';
        const allowsAudioVideoAsg = !isImageOnlyAsg;
        const capturePromptNoun = isImageOnlyAsg
          ? 'chụp hoặc chọn ảnh bài làm'
          : (allowsImageAsg ? 'thu âm, tải file Audio/Video hoặc chọn ảnh' : 'thu âm hoặc tải file Audio/Video');

        const captureZoneLabel = document.getElementById('student-capture-zone-label');
        const btnStartRecEl = document.getElementById('btn-student-start-rec');
        const btnStopRecEl = document.getElementById('btn-student-stop-rec');
        const lblFileUploadEl = document.getElementById('lbl-student-file-upload');
        const lblImageUploadEl = document.getElementById('lbl-student-image-upload');
        const imageDropzoneEl = document.getElementById('student-image-dropzone');
        const recWaveformEl = document.getElementById('student-recorder-waveform');
        const recStatusEl = document.getElementById('student-rec-status-text');

        if (captureZoneLabel) {
          captureZoneLabel.textContent = isImageOnlyAsg
            ? 'Chụp ảnh hoặc tải lên hình ảnh bài làm BVN (tối đa 5 ảnh)'
            : (allowsImageAsg
              ? 'Thu âm, tải file Audio / Video hoặc tải ảnh bài làm BVN'
              : 'Ghi âm trực tiếp hoặc tải lên file Audio / Video làm BVN');
        }
        if (btnStartRecEl && btnStopRecEl) {
          if (!allowsAudioVideoAsg) {
            btnStartRecEl.style.display = 'none';
            btnStopRecEl.style.display = 'none';
          } else if (btnStopRecEl.style.display === 'none' || !btnStopRecEl.style.display) {
            btnStartRecEl.style.display = 'inline-flex';
          }
        }
        if (lblFileUploadEl) lblFileUploadEl.style.display = allowsAudioVideoAsg ? 'inline-flex' : 'none';
        if (lblImageUploadEl) lblImageUploadEl.style.display = allowsImageAsg ? 'inline-flex' : 'none';
        if (imageDropzoneEl) imageDropzoneEl.style.display = isImageOnlyAsg ? 'flex' : 'none';
        if (recWaveformEl) recWaveformEl.style.display = allowsAudioVideoAsg ? 'inline-flex' : 'none';
        if (recStatusEl && !ui.pendingMedia) {
          recStatusEl.textContent = isImageOnlyAsg
            ? 'Chưa chọn ảnh bài làm nào'
            : (allowsImageAsg ? 'Sẵn sàng thu âm, chọn file hoặc tải ảnh' : 'Sẵn sàng thu âm hoặc chọn file');
        }
        if (noteArea) {
          noteArea.placeholder = isImageOnlyAsg
            ? 'Ví dụ: Em đã viết xong bài tập chữ Hán và chụp rõ trang vở gửi cô sửa giúp em ạ...'
            : 'Ví dụ: Em đã luyện kỹ biến điệu thanh 3 và các âm uốn lưỡi zh, ch, sh, nhờ cô nghe và sửa giúp em ạ...';
        }

        const requiresResubmit = Boolean(currentLatestSub && currentLatestSub.status === 'resubmit_required');
        const autoOpenForResubmit = Boolean(requiresResubmit && ui.dismissedAutoResubmitAsgId !== currentAsg.assignment_id);
        const isResubmitReady = Boolean(
          ui.pendingMedia ||
          (currentLatestSub && (ui.resubmitExpandedAsgId === currentAsg.assignment_id || autoOpenForResubmit))
        );
        const reasonText = requiresResubmit && currentLatestSub.teacher_comment
          ? String(currentLatestSub.teacher_comment).trim()
          : '';
        const reasonQuoteHtml = reasonText
          ? '<div class="bvn-resubmit-reason-quote">Nhận xét của cô (Lần ' + currentLatestAtt + '): “' + escapeHtml(reasonText) + '”</div>'
          : '';

        if (currentLatestSub && !isResubmitReady) {
          if (recorderZone) recorderZone.style.display = 'none';
          if (noteFormGroup) noteFormGroup.style.display = 'none';
          if (submitBtn) submitBtn.style.display = 'none';
          if (resubmitSlot) {
            if (requiresResubmit) {
              resubmitSlot.innerHTML =
                '<div class="bvn-resubmit-banner is-required">' +
                  '<div style="flex:1 1 240px;">' +
                    '<div class="bvn-resubmit-banner-title">' +
                      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>' +
                      '<span>Cô yêu cầu nộp lại BVN (Lần ' + nextAttemptNum + ')</span>' +
                    '</div>' +
                    '<p class="bvn-resubmit-banner-desc">Hãy xem kỹ phản hồi của cô ở cột bên phải rồi ' + capturePromptNoun + ' mới cho Lần ' + nextAttemptNum + '.</p>' +
                    reasonQuoteHtml +
                  '</div>' +
                  '<button type="button" class="btn btn-primary btn-sm" id="btn-student-resubmit-hw">' +
                    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>' +
                    '<span>Nộp lại BVN (Lần ' + nextAttemptNum + ')</span>' +
                  '</button>' +
                '</div>';
            } else {
              resubmitSlot.innerHTML =
                '<div class="bvn-resubmit-banner">' +
                  '<div>' +
                    '<div class="bvn-resubmit-banner-title">Em đã nộp BVN (Lần ' + currentLatestAtt + ')</div>' +
                    '<p class="bvn-resubmit-banner-desc">Bài làm và nhận xét từng lần đều được lưu riêng bên phải. Nếu cần sửa bài, bấm nộp thêm Lần ' + nextAttemptNum + '.</p>' +
                  '</div>' +
                  '<button type="button" class="btn btn-primary btn-sm" id="btn-student-resubmit-hw">' +
                    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>' +
                    '<span>Nộp lại BVN (Lần ' + nextAttemptNum + ')</span>' +
                  '</button>' +
                '</div>';
            }
          }
        } else {
          if (recorderZone) recorderZone.style.display = 'block';
          if (noteFormGroup) noteFormGroup.style.display = 'block';
          if (submitBtn) {
            submitBtn.style.display = 'block';
            const spanTxt = submitBtn.querySelector('span');
            if (spanTxt) {
              spanTxt.textContent = currentLatestSub
                ? ('Gửi BVN Lần ' + nextAttemptNum)
                : 'Nộp BVN Ngay';
            }
          }
          if (resubmitSlot) {
            if (currentLatestSub && requiresResubmit) {
              resubmitSlot.innerHTML =
                '<div class="bvn-resubmit-banner is-required">' +
                  '<div style="flex:1 1 240px;">' +
                    '<div class="bvn-resubmit-banner-title">' +
                      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>' +
                      '<span>Cô yêu cầu em nộp lại bài này — Sẵn sàng nộp Lần ' + nextAttemptNum + '</span>' +
                    '</div>' +
                    '<p class="bvn-resubmit-banner-desc">Hãy xem lại góp ý của cô ở cột bên phải, sau đó ' + capturePromptNoun + ' mới bên dưới. Bài Lần ' + currentLatestAtt + ' vẫn được lưu nguyên.</p>' +
                    reasonQuoteHtml +
                  '</div>' +
                  '<button type="button" class="btn btn-outline btn-sm" id="btn-cancel-student-resubmit">Thu gọn</button>' +
                '</div>';
            } else if (currentLatestSub) {
              resubmitSlot.innerHTML =
                '<div class="bvn-resubmit-banner is-preparing">' +
                  '<div>' +
                    '<div class="bvn-resubmit-banner-title">Đang chuẩn bị bài nộp Lần ' + nextAttemptNum + '</div>' +
                    '<p class="bvn-resubmit-banner-desc">Hãy ' + capturePromptNoun + ' mới bên dưới. Bài Lần ' + currentLatestAtt + ' vẫn được giữ nguyên vẹn.</p>' +
                  '</div>' +
                  '<button type="button" class="btn btn-outline btn-sm" id="btn-cancel-student-resubmit">Hủy nộp lại</button>' +
                '</div>';
            } else {
              resubmitSlot.innerHTML = '';
            }
          }
        }

        if (resubmitSlot) {
          const btnStartResubmit = resubmitSlot.querySelector('#btn-student-resubmit-hw');
          if (btnStartResubmit) {
            btnStartResubmit.addEventListener('click', function () {
              ui.resubmitExpandedAsgId = currentAsg.assignment_id;
              ui.dismissedAutoResubmitAsgId = null;
              ui.pendingMedia = null;
              if (noteArea) noteArea.value = '';
              const statusText = document.getElementById('student-rec-status-text');
              if (statusText) {
                statusText.textContent = isImageOnlyAsg
                  ? ('Chưa chọn ảnh bài làm cho Lần ' + nextAttemptNum)
                  : ('Sẵn sàng ' + capturePromptNoun + ' mới cho Lần ' + nextAttemptNum);
              }
              const fileInputEl = document.getElementById('student-file-upload');
              if (fileInputEl) fileInputEl.value = '';
              const imgInputEl = document.getElementById('student-image-upload');
              if (imgInputEl) imgInputEl.value = '';
              renderPendingMediaPreview();
              renderHomeworkSection();
            });
          }
          const btnCancelResubmit = resubmitSlot.querySelector('#btn-cancel-student-resubmit');
          if (btnCancelResubmit) {
            btnCancelResubmit.addEventListener('click', function () {
              ui.resubmitExpandedAsgId = null;
              if (requiresResubmit) {
                ui.dismissedAutoResubmitAsgId = currentAsg.assignment_id;
              }
              ui.pendingMedia = null;
              if (noteArea) noteArea.value = '';
              const fileInputEl = document.getElementById('student-file-upload');
              if (fileInputEl) fileInputEl.value = '';
              const imgInputEl = document.getElementById('student-image-upload');
              if (imgInputEl) imgInputEl.value = '';
              renderPendingMediaPreview();
              renderHomeworkSection();
            });
          }
        }
      }
    } else {
      if (briefTitle) {
        briefTitle.textContent = 'Chưa có BVN nào được giao cho lớp của em';
      }
      if (briefDesc) {
        briefDesc.textContent = 'Khi giáo viên giao bài tập về nhà (BVN) mới cho lớp, hướng dẫn chi tiết và khung nộp bài sẽ hiển thị tại đây.';
      }
      if (resubmitSlot) resubmitSlot.innerHTML = '';
      if (recorderZone) recorderZone.style.display = 'none';
      if (noteFormGroup) noteFormGroup.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'none';
      if (practiceCallout) practiceCallout.style.display = 'none';
    }

    const activeAttemptSub = currentAsg
      ? findSubmissionById(currentAsg.assignment_id, student.student_id, ui.selectedAttemptSubId)
      : null;

    renderFeedbackDetailPanel(currentAsg, activeAttemptSub, currentAttempts);
    renderPersonalHomeworkMatrix(student);
  }

  function renderFeedbackDetailPanel(assignment, submission, attemptsList) {
    const statusBadge = document.getElementById('student-feedback-status-badge');
    const bodyEl = document.getElementById('student-feedback-panel-body');
    if (!bodyEl) return;
    if (!assignment) {
      if (statusBadge) {
        statusBadge.className = 'status-badge status-submitted';
        statusBadge.textContent = 'Chưa có BVN';
      }
      bodyEl.innerHTML =
        '<div class="assignment-brief-box">' +
        '<div class="assignment-brief-title">Chưa có BVN cần nộp</div>' +
        '<p class="assignment-brief-desc">Hiện lớp của em chưa có bài tập về nhà (BVN) nào đang mở. Hãy kiểm tra lại khi giáo viên giao bài nhé.</p>' +
        '</div>';
      return;
    }

    const student = getActiveStudent();
    const attempts = Array.isArray(attemptsList)
      ? attemptsList
      : getSubmissionAttempts(assignment.assignment_id, student.student_id);
    if (attempts.length > 0 && (!submission || !attempts.some(function (a) { return a.submission_id === submission.submission_id; }))) {
      submission = findSubmissionById(assignment.assignment_id, student.student_id, ui.selectedAttemptSubId);
    }

    if (!submission) {
      ui.selectedAttemptSubId = null;
      if (statusBadge) {
        statusBadge.className = 'status-badge status-missing';
        statusBadge.textContent = 'Chưa nộp BVN';
      }
      bodyEl.innerHTML =
        '<div class="assignment-brief-box">' +
        '<div class="assignment-brief-title">Em chưa nộp ' +
        escapeHtml(assignment.lesson_tag || assignment.title) +
        '</div>' +
        '<p class="assignment-brief-desc">Hãy thu âm trực tiếp hoặc tải file Audio/Video ở cột bên trái và bấm <strong>Nộp BVN Ngay</strong>. Sau khi giáo viên chấm, điểm số cùng phản hồi bằng chữ và giọng nói sẽ hiển thị tại đây.</p>' +
        '</div>';
      return;
    }

    ui.selectedAttemptSubId = submission.submission_id;
    const latestSub = attempts.length ? attempts[attempts.length - 1] : submission;
    const activeIdx = attempts.findIndex(function (a) { return a.submission_id === submission.submission_id; });
    const activeAttemptNum = Math.max(1, Number(submission.attempt_number || (activeIdx >= 0 ? activeIdx + 1 : 1)) || 1);
    const isLatestAttempt = submission.submission_id === latestSub.submission_id;
    const attemptPrefix = attempts.length > 1 ? ('Lần ' + activeAttemptNum + ' • ') : '';

    if (statusBadge) {
      if (submission.status === 'resubmit_required') {
        statusBadge.className = 'status-badge status-resubmit';
        statusBadge.textContent = (submission.score !== '' && submission.score !== undefined && submission.score !== null)
          ? (attemptPrefix + 'Cô yêu cầu nộp lại • ' + submission.score + '/10 điểm')
          : (attemptPrefix + 'Cô yêu cầu nộp lại BVN');
      } else if (submission.status === 'graded') {
        statusBadge.className = 'status-badge status-graded';
        statusBadge.textContent = (submission.score !== '' && submission.score !== undefined && submission.score !== null)
          ? (attemptPrefix + 'Đã chấm • ' + submission.score + '/10 điểm')
          : (attemptPrefix + 'Đã chấm • Có phản hồi GV');
      } else {
        statusBadge.className = 'status-badge status-submitted';
        statusBadge.textContent = attemptPrefix + 'Đã nộp BVN • Chờ giáo viên phản hồi';
      }
    }

    let attemptTabsHtml = '';
    if (attempts.length > 1) {
      const descAttempts = attempts.slice().reverse();
      attemptTabsHtml =
        '<div class="attempt-tabs-row" role="tablist" aria-label="Các lần đã nộp BVN">' +
        '<span class="attempt-tabs-label">Lịch sử nộp bài:</span>' +
        descAttempts.map(function (att) {
          const idx = attempts.indexOf(att);
          const attNo = Math.max(1, Number(att.attempt_number || (idx + 1)) || (idx + 1));
          const isLatest = att.submission_id === latestSub.submission_id;
          const isActive = att.submission_id === submission.submission_id;
          const metaText = att.status === 'resubmit_required'
            ? (att.score !== '' && att.score !== undefined && att.score !== null ? (att.score + 'đ · Nộp lại') : 'Cần nộp lại')
            : (att.status === 'graded'
              ? (att.score !== '' && att.score !== undefined && att.score !== null ? (att.score + 'đ') : 'Đã chữa')
              : 'Chờ chữa');
          const metaCls = att.status === 'resubmit_required'
            ? 'is-resubmit'
            : (att.status === 'graded' ? 'is-graded' : 'is-pending');
          return (
            '<button type="button" role="tab" aria-selected="' + (isActive ? 'true' : 'false') + '" ' +
            'class="attempt-tab-pill' + (isActive ? ' is-active' : '') + '" ' +
            'data-student-attempt-id="' + escapeHtml(att.submission_id) + '">' +
            '<span>Lần ' + attNo + (isLatest ? ' (Mới nhất)' : '') + '</span>' +
            '<span class="attempt-tab-meta ' + metaCls + '">' + escapeHtml(metaText) + '</span>' +
            '</button>'
          );
        }).join('') +
        '</div>';
    }

    const isImage = typeof window.StudySnapAudio.isImageSubmission === 'function'
      ? window.StudySnapAudio.isImageSubmission(submission.media_url, submission.media_type)
      : submission.media_type === 'image';
    const isVideo = !isImage && (typeof window.StudySnapAudio.isVideoSubmission === 'function'
      ? window.StudySnapAudio.isVideoSubmission(submission.media_url, submission.media_type)
      : submission.media_type === 'video');
    const mediaLabel = isImage
      ? ('Ảnh BVN Lần ' + activeAttemptNum + ' em đã nộp')
      : (isVideo
        ? ('Video BVN Lần ' + activeAttemptNum + ' em đã nộp')
        : ('Ghi âm BVN Lần ' + activeAttemptNum + ' em đã nộp'));

    const hasRealTeacherVoice = isRealTeacherVoiceUrl(submission.teacher_voice_url);
    let teacherReviewHtml = '';
    if (submission.status === 'graded' || submission.status === 'resubmit_required' || submission.teacher_comment || hasRealTeacherVoice) {
      const voiceBtnHtml = hasRealTeacherVoice
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
            fallbackText: '',
            lang: 'vi-VN',
            variant: 'teacher',
            requireRealAudio: true
          }) +
          '</div>'
        : '';

      const reviewHeading = submission.status === 'resubmit_required'
        ? ('Yêu cầu nộp lại từ Giáo viên' + (attempts.length > 1 ? ' (Lần ' + activeAttemptNum + ')' : ''))
        : ('Phản hồi chi tiết từ Giáo viên' + (attempts.length > 1 ? ' (Lần ' + activeAttemptNum + ')' : ''));
      const rightBadgesHtml =
        (submission.status === 'resubmit_required'
          ? '<span class="status-badge status-resubmit">Cần nộp lại</span>'
          : '') +
        (submission.score !== '' && submission.score !== null && submission.score !== undefined
          ? '<span class="status-badge ' + (submission.status === 'resubmit_required' ? 'status-submitted' : 'status-graded') + '">Điểm: ' + escapeHtml(submission.score) + '/10</span>'
          : '');

      teacherReviewHtml =
        '<div class="voice-feedback-box">' +
        '<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">' +
        '<strong style="font-size: 0.9375rem; color: ' + (submission.status === 'resubmit_required' ? '#9E1650' : 'var(--color-foreground)') + ';">' + reviewHeading + '</strong>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' + rightBadgesHtml + '</div>' +
        '</div>' +
        '<p class="matrix-teacher-note">' +
        escapeHtml(submission.teacher_comment || (submission.status === 'resubmit_required'
          ? 'Cô yêu cầu em luyện lại và nộp lại bài tập này nhé.'
          : 'Giáo viên đã gửi phản hồi bằng giọng nói cho BVN của em.')) +
        '</p>' +
        voiceBtnHtml +
        '</div>';
    } else {
      teacherReviewHtml =
        '<div class="voice-feedback-box">' +
        '<div style="font-weight: 700; font-size: 0.9375rem; color: var(--color-foreground); margin-bottom: 4px;">Đang chờ Giáo viên chấm &amp; phản hồi' +
        (attempts.length > 1 ? ' (Lần ' + activeAttemptNum + ')' : '') +
        '</div>' +
        '<p style="font-size: 0.875rem; color: var(--color-muted-foreground); margin: 0;">' +
        'BVN Lần ' + activeAttemptNum + ' đã được lưu lúc ' +
        escapeHtml(submission.submitted_at) +
        (attempts.length > 1
          ? '. Em có thể bấm sang các tab Lần trước ở trên để xem lại bài và nhận xét cũ.'
          : '. Nếu cần sửa nhiều lỗi, em có thể bấm "Nộp lại BVN" ở cột bên trái để gửi thêm Lần 2.') +
        '</p>' +
        '</div>';
    }

    const ownMediaHtml = isImage && typeof window.StudySnapAudio.renderImageViewer === 'function'
      ? window.StudySnapAudio.renderImageViewer({
          url: submission.media_url,
          label: mediaLabel
        })
      : (isVideo && typeof window.StudySnapAudio.renderVideoPlayer === 'function'
        ? window.StudySnapAudio.renderVideoPlayer({
            id: 'student-own-sub-' + submission.submission_id,
            url: submission.media_url,
            duration: submission.media_duration || '01:15',
            label: mediaLabel
          })
        : window.StudySnapAudio.renderVoicePlayer({
            id: 'student-own-sub-' + submission.submission_id,
            url: submission.media_url,
            duration: submission.media_duration || '01:15',
            label: mediaLabel,
            fallbackText: '老师好，我是越南学生，这是我的汉语作业录音。',
            lang: 'zh-CN',
            variant: 'student'
          }));

    const boxTitle = attempts.length > 1
      ? ('Bài nộp Lần ' + activeAttemptNum + (isLatestAttempt ? ' (Mới nhất)' : '') + ' • ' + (submission.submitted_at || 'Vừa nộp'))
      : ('BVN đã nộp của em • ' + (submission.submitted_at || 'Vừa nộp'));

    bodyEl.innerHTML =
      attemptTabsHtml +
      '<div class="assignment-brief-box">' +
      '<div class="assignment-brief-title">' + escapeHtml(boxTitle) + '</div>' +
      '<p class="assignment-brief-desc">Ghi chú của em: "' +
      escapeHtml(submission.student_note || 'Em gửi bài tập về nhà (BVN) ạ.') +
      '"</p>' +
      (isImage
        ? ownMediaHtml
        : ('<div class="media-player-box' + (isVideo ? ' media-player-video-box' : '') + '">' + ownMediaHtml + '</div>')) +
      '</div>' +
      teacherReviewHtml;

    bodyEl.querySelectorAll('[data-student-attempt-id]').forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        const pickedId = tabBtn.getAttribute('data-student-attempt-id');
        if (!pickedId) return;
        ui.selectedAttemptSubId = pickedId;
        const chosenSub = findSubmissionById(assignment.assignment_id, student.student_id, pickedId);
        renderFeedbackDetailPanel(assignment, chosenSub, attempts);
      });
    });

    if (isImage && typeof window.StudySnapAudio.hydrateImageViewers === 'function') {
      window.StudySnapAudio.hydrateImageViewers(bodyEl);
    } else if (isVideo && typeof window.StudySnapAudio.hydrateVideoPlayers === 'function') {
      window.StudySnapAudio.hydrateVideoPlayers(bodyEl);
    }
  }

  function isRealTeacherVoiceUrl(url) {
    const clean = String(url || '').trim();
    if (!clean) return false;
    if (clean.indexOf('demo:') === 0) return false;
    return true;
  }

  function renderPersonalHomeworkMatrix(student) {
    const tbody = document.getElementById('student-personal-matrix-tbody');
    const summaryBadge = document.getElementById('student-table-summary-badge');
    if (!tbody) return;

    const studentAssignments = getStudentAssignments(student);

    if (studentAssignments.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-muted-foreground);">' +
          'Hiện giáo viên chưa giao bài tập về nhà (BVN) nào cho lớp của em.' +
        '</td></tr>';
      if (summaryBadge) summaryBadge.textContent = '0/0 BVN';
      return;
    }

    syncStudentSortIndicators('data-student-bvn-sort', ui.bvnSummarySort);

    const sortedAssignments = sortStudentRows(studentAssignments, ui.bvnSummarySort, {
      getTitle: function (asg) {
        return (asg.lesson_tag ? asg.lesson_tag + ' ' : '') + (asg.title || '');
      },
      getDue: function (asg) {
        return asg.due_date || '';
      },
      getStatusRank: function (asg) {
        const sub = findSubmission(asg.assignment_id, student.student_id);
        if (!sub || (sub.status !== 'submitted' && sub.status !== 'graded' && sub.status !== 'resubmit_required')) return 0;
        if (sub.status === 'graded') return 3;
        return sub.status === 'resubmit_required' ? 2 : 1;
      },
      getScore: function (asg) {
        const sub = findSubmission(asg.assignment_id, student.student_id);
        if (!sub || sub.score === '' || sub.score === null || sub.score === undefined) return null;
        const n = Number(sub.score);
        return Number.isFinite(n) ? n : null;
      }
    });

    let completed = 0;
    tbody.innerHTML = sortedAssignments
      .map(function (asg) {
        const attempts = getSubmissionAttempts(asg.assignment_id, student.student_id);
        const sub = attempts.length ? attempts[attempts.length - 1] : null;
        const attNum = sub ? Math.max(attempts.length, Number(sub.attempt_number || 1) || 1) : 0;
        const prevGraded = attempts.length > 1
          ? attempts.slice(0, -1).reverse().find(function (a) {
              return a.status === 'graded' || a.status === 'resubmit_required' || (a.score !== '' && a.score !== undefined && a.score !== null);
            })
          : null;
        const attBadgeHtml = attNum > 1
          ? '<span class="attempt-count-pill">Lần ' + attNum + '</span> '
          : '';
        let statusHtml = '<span class="status-badge status-missing">Chưa nộp BVN</span>';
        let scoreHtml = '<span class="mono-text tabular-nums" style="color: var(--color-muted-foreground);">—</span>';
        let feedbackHtml =
          '<p class="matrix-teacher-note">Em chưa nộp BVN này. Hãy hoàn thành trước hạn ' +
          escapeHtml(asg.due_date) +
          '.</p>';
        let btnText = asg.require_media === 'practice' ? 'Làm bài luyện tập' : 'Làm & Nộp BVN';

        if (sub) {
          completed++;
          const isRowImage = Boolean(
            sub.media_url &&
            typeof window.StudySnapAudio.isImageSubmission === 'function' &&
            window.StudySnapAudio.isImageSubmission(sub.media_url, sub.media_type)
          );
          const rowImageChipHtml = isRowImage && typeof window.StudySnapAudio.renderImageViewer === 'function'
            ? window.StudySnapAudio.renderImageViewer({
                url: sub.media_url,
                label: asg.title + ' (Lần ' + attNum + ')',
                compact: true
              })
            : '';
          if (sub.status === 'resubmit_required') {
            const hasRealVoice = isRealTeacherVoiceUrl(sub.teacher_voice_url);
            statusHtml = attBadgeHtml + '<span class="status-badge status-resubmit">Cô yêu cầu nộp lại</span>';
            scoreHtml = (sub.score !== '' && sub.score !== undefined && sub.score !== null)
              ? ('<strong class="mono-text tabular-nums">' + escapeHtml(sub.score) + (asg.require_media === 'practice' ? 'đ' : ' / 10') + '</strong>')
              : '<span class="mono-text tabular-nums" style="color: #9E1650; font-weight: 700;">Cần nộp lại</span>';
            feedbackHtml =
              '<div class="matrix-cell-content">' +
              '<p class="matrix-teacher-note">' +
              escapeHtml(sub.teacher_comment || (hasRealVoice ? 'Nghe hướng dẫn bằng Voice của cô để nộp lại.' : 'Cô yêu cầu em luyện và nộp lại bài này.')) +
              '</p>' +
              rowImageChipHtml +
              (hasRealVoice
                ? window.StudySnapAudio.renderVoicePlayer({
                    id: 'student-matrix-voice-' + sub.submission_id,
                    url: sub.teacher_voice_url,
                    duration: sub.teacher_voice_duration || '00:35',
                    label: 'Voice GV',
                    fallbackText: '',
                    lang: 'vi-VN',
                    compact: true,
                    variant: 'teacher',
                    requireRealAudio: true
                  })
                : '') +
              '</div>';
            btnText = 'Nộp lại ngay';
          } else if (sub.status === 'graded') {
            const hasRealVoice = isRealTeacherVoiceUrl(sub.teacher_voice_url);
            statusHtml = attBadgeHtml + '<span class="status-badge status-graded">Đã chữa &amp; Có phản hồi GV</span>';
            scoreHtml = (sub.score !== '' && sub.score !== undefined && sub.score !== null)
              ? ('<strong class="mono-text tabular-nums">' + escapeHtml(sub.score) + (asg.require_media === 'practice' ? 'đ' : ' / 10') + '</strong>')
              : '<span class="mono-text tabular-nums" style="color: var(--color-muted-foreground);">—</span>';
            feedbackHtml =
              '<div class="matrix-cell-content">' +
              '<p class="matrix-teacher-note">' +
              escapeHtml(sub.teacher_comment || (hasRealVoice ? 'Giáo viên đã gửi phản hồi bằng Voice.' : 'Đã chấm điểm.')) +
              '</p>' +
              rowImageChipHtml +
              (hasRealVoice
                ? window.StudySnapAudio.renderVoicePlayer({
                    id: 'student-matrix-voice-' + sub.submission_id,
                    url: sub.teacher_voice_url,
                    duration: sub.teacher_voice_duration || '00:35',
                    label: 'Voice GV',
                    fallbackText: '',
                    lang: 'vi-VN',
                    compact: true,
                    variant: 'teacher',
                    requireRealAudio: true
                  })
                : '') +
              '</div>';
            btnText = asg.require_media === 'practice' ? 'Xem phản hồi' : 'Xem / Nộp lại';
          } else {
            const prevIdx = prevGraded ? attempts.indexOf(prevGraded) : -1;
            const prevNo = prevGraded ? Math.max(1, Number(prevGraded.attempt_number || (prevIdx + 1)) || (prevIdx + 1)) : 0;
            const prevHintHtml = prevGraded
              ? '<p class="attempt-prev-hint">Trước đó Lần ' + prevNo + ': ' +
                (prevGraded.score !== '' && prevGraded.score !== undefined && prevGraded.score !== null
                  ? (escapeHtml(prevGraded.score) + '/10đ')
                  : 'Đã chữa') +
                '</p>'
              : '';
            statusHtml = attBadgeHtml + '<span class="status-badge status-submitted">Đã nộp BVN • Chờ phản hồi</span>';
            scoreHtml = '<span class="mono-text tabular-nums">Chờ chấm</span>';
            feedbackHtml =
              '<div class="matrix-cell-content">' +
              '<p class="matrix-teacher-note">Đã nộp Lần ' + attNum + ' lúc ' +
              escapeHtml(sub.submitted_at) +
              '. Đang chờ giáo viên chấm và ghi âm phản hồi.</p>' +
              rowImageChipHtml +
              prevHintHtml +
              '</div>';
            btnText = 'Xem / Nộp lại';
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
      summaryBadge.textContent = 'Đã hoàn thành ' + completed + '/' + studentAssignments.length + ' BVN';
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
        ui.selectedAttemptSubId = null;
        ui.resubmitExpandedAsgId = null;
        ui.dismissedAutoResubmitAsgId = null;
        ui.pendingMedia = null;
        const noteAreaEl = document.getElementById('student-note-textarea');
        if (noteAreaEl) noteAreaEl.value = '';
        renderPendingMediaPreview();
        renderHomeworkSection();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function renderPendingMediaPreview() {
    const previewEl = document.getElementById('student-pending-voice-preview');
    if (!previewEl) return;
    if (!ui.pendingMedia || (!ui.pendingMedia.media_url && !(ui.pendingMedia.images && ui.pendingMedia.images.length))) {
      previewEl.innerHTML = '';
      const imgInputEl = document.getElementById('student-image-upload');
      if (imgInputEl) imgInputEl.value = '';
      return;
    }
    if (ui.pendingMedia.media_type === 'image' && Array.isArray(ui.pendingMedia.images) && ui.pendingMedia.images.length > 0) {
      const imgUrls = ui.pendingMedia.images.map(function (im) { return im.dataUrl; });
      previewEl.innerHTML = typeof window.StudySnapAudio.renderImageViewer === 'function'
        ? window.StudySnapAudio.renderImageViewer({
            urls: imgUrls,
            label: 'Xem trước ảnh bài làm trước khi nộp',
            editable: true
          })
        : '';
      if (typeof window.StudySnapAudio.hydrateImageViewers === 'function') {
        window.StudySnapAudio.hydrateImageViewers(previewEl);
      }
      previewEl.querySelectorAll('[data-remove-pending-img]').forEach(function (rmBtn) {
        rmBtn.addEventListener('click', function (ev) {
          ev.stopPropagation();
          const idx = parseInt(rmBtn.getAttribute('data-remove-pending-img'), 10);
          if (!Number.isFinite(idx) || !ui.pendingMedia || !Array.isArray(ui.pendingMedia.images)) return;
          ui.pendingMedia.images.splice(idx, 1);
          const statusText = document.getElementById('student-rec-status-text');
          if (ui.pendingMedia.images.length === 0) {
            ui.pendingMedia = null;
            if (statusText) statusText.textContent = 'Chưa chọn ảnh bài làm nào';
          } else {
            ui.pendingMedia.media_url = ui.pendingMedia.images.length === 1
              ? ui.pendingMedia.images[0].dataUrl
              : JSON.stringify(ui.pendingMedia.images.map(function (x) { return x.dataUrl; }));
            ui.pendingMedia.media_duration = ui.pendingMedia.images.length + ' ảnh';
            if (statusText) statusText.textContent = 'Đã chọn ' + ui.pendingMedia.images.length + ' ảnh bài làm';
          }
          renderPendingMediaPreview();
        });
      });
      return;
    }
    const isVideo = typeof window.StudySnapAudio.isVideoSubmission === 'function'
      ? window.StudySnapAudio.isVideoSubmission(ui.pendingMedia.media_url, ui.pendingMedia.media_type, ui.pendingMedia.mimeType)
      : ui.pendingMedia.media_type === 'video';
    if (isVideo && typeof window.StudySnapAudio.renderVideoPlayer === 'function') {
      previewEl.innerHTML = window.StudySnapAudio.renderVideoPlayer({
        id: 'student-draft-video',
        url: ui.pendingMedia.media_url,
        duration: ui.pendingMedia.media_duration || '01:15',
        label: 'Xem thử Video BVN trước khi nộp',
        mimeType: ui.pendingMedia.mimeType || 'video/mp4'
      });
      if (typeof window.StudySnapAudio.hydrateVideoPlayers === 'function') {
        window.StudySnapAudio.hydrateVideoPlayers(previewEl);
      }
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
    document.querySelectorAll('[data-student-bvn-sort]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const colKey = btn.getAttribute('data-student-bvn-sort');
        if (!colKey) return;
        ui.bvnSummarySort = toggleStudentSortKey(ui.bvnSummarySort, colKey, ['score']);
        renderPersonalHomeworkMatrix(getActiveStudent());
      });
    });

    const selectEl = document.getElementById('student-assignment-select');
    if (selectEl) {
      selectEl.addEventListener('change', function () {
        ui.selectedAssignmentId = selectEl.value;
        ui.selectedAttemptSubId = null;
        ui.resubmitExpandedAsgId = null;
        ui.dismissedAutoResubmitAsgId = null;
        ui.pendingMedia = null;
        const noteAreaEl = document.getElementById('student-note-textarea');
        if (noteAreaEl) noteAreaEl.value = '';
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
    const imageInput = document.getElementById('student-image-upload');
    const imageDropzone = document.getElementById('student-image-dropzone');

    function handleStudentImageFiles(fileList) {
      if (!fileList || !fileList.length) return;
      if (typeof window.StudySnapAudio.readUploadedImageFiles !== 'function') {
        showToast('Trình duyệt chưa tải xong bộ xử lý ảnh, em vui lòng tải lại trang.');
        return;
      }
      const existingImgs =
        ui.pendingMedia && ui.pendingMedia.media_type === 'image' && Array.isArray(ui.pendingMedia.images)
          ? ui.pendingMedia.images.slice()
          : [];
      const remainingSlots = Math.max(0, 5 - existingImgs.length);
      if (remainingSlots <= 0) {
        showToast('Mỗi lần nộp tối đa 5 ảnh. Em có thể bấm dấu X trên ảnh để bỏ bớt trước nhé.');
        return;
      }
      if (recStatusText) recStatusText.textContent = 'Đang nén & xử lý ảnh...';
      window.StudySnapAudio.readUploadedImageFiles(
        fileList,
        function (newImgs) {
          const merged = existingImgs.concat(newImgs).slice(0, 5);
          const totalKB = merged.reduce(function (sum, it) { return sum + (Number(it.sizeKB) || 0); }, 0);
          ui.pendingMedia = {
            media_type: 'image',
            images: merged,
            media_url: merged.length === 1
              ? merged[0].dataUrl
              : JSON.stringify(merged.map(function (x) { return x.dataUrl; })),
            mimeType: merged[0].mimeType || 'image/jpeg',
            fileName: merged[0].fileName || 'anh_bai_lam.jpg',
            media_duration: merged.length + ' ảnh'
          };
          if (recStatusText) {
            recStatusText.textContent = 'Đã chọn ' + merged.length + ' ảnh bài làm (~' + totalKB + ' KB)';
          }
          renderPendingMediaPreview();
          showToast('Đã sẵn sàng ' + merged.length + ' ảnh bài làm. Nhấn "Nộp BVN Ngay" để gửi!');
        },
        function (errMsg) {
          if (recStatusText) {
            recStatusText.textContent = existingImgs.length
              ? ('Đang giữ ' + existingImgs.length + ' ảnh đã chọn')
              : 'Chưa chọn ảnh hợp lệ';
          }
          showToast(errMsg || 'Không thể tải ảnh lên.');
        },
        { maxCount: remainingSlots }
      );
    }

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
                ? 'Đã thu âm, lọc tạp âm & cắt ' + result.trimmedSeconds + 's khoảng trống (' + result.duration + '). Em có thể nghe lại hoặc nộp BVN!'
                : 'Đã thu âm & lọc tạp âm xong (' + result.duration + '). Em có thể nghe lại hoặc bấm "Nộp BVN Ngay".'
            );
          },
          function (errMsg) {
            btnStartRec.style.display = 'inline-flex';
            btnStopRec.style.display = 'none';
            btnStopRec.disabled = false;
            if (recZone) recZone.classList.remove('is-recording');
            ui.pendingMedia = null;
            if (recStatusText) {
              recStatusText.textContent = 'Chưa thu được bản thu hợp lệ — hãy kiểm tra micro hoặc tải file lên.';
            }
            renderPendingMediaPreview();
            showToast(errMsg || 'Không thu được âm thanh. Em hãy kiểm tra quyền Micro hoặc dùng nút Tải file lên.');
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
            fileName: mediaInfo.fileName || (file && file.name) || '',
            media_duration: mediaInfo.duration
          };
          if (recStatusText) {
            recStatusText.textContent =
              'Đã chọn: ' + mediaInfo.fileName + ' (' + mediaInfo.duration + ')';
          }
          renderPendingMediaPreview();
          showToast('Đã tải file "' + mediaInfo.fileName + '". Nhấn "Nộp BVN Ngay" để gửi!');
        });
      });
    }

    if (imageInput) {
      imageInput.addEventListener('change', function () {
        if (imageInput.files && imageInput.files.length) {
          handleStudentImageFiles(imageInput.files);
          imageInput.value = '';
        }
      });
    }

    if (imageDropzone) {
      ['dragenter', 'dragover'].forEach(function (evtName) {
        imageDropzone.addEventListener(evtName, function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          imageDropzone.classList.add('is-dragover');
        });
      });
      ['dragleave', 'drop'].forEach(function (evtName) {
        imageDropzone.addEventListener(evtName, function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          imageDropzone.classList.remove('is-dragover');
          if (evtName === 'drop' && ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length) {
            handleStudentImageFiles(ev.dataTransfer.files);
          }
        });
      });
    }

    if (typeof document !== 'undefined' && document.body) {
      document.body.addEventListener('click', function (ev) {
        const imgCompactBtn = ev.target && ev.target.closest ? ev.target.closest('[data-image-compact-open]') : null;
        if (imgCompactBtn && typeof window.StudySnapAudio.openImageModal === 'function') {
          let urls = [];
          try {
            urls = JSON.parse(imgCompactBtn.getAttribute('data-image-urls') || '[]');
          } catch (e) {}
          if (!Array.isArray(urls) || !urls.length) {
            const rawSingle = imgCompactBtn.getAttribute('data-image-url') || '';
            if (rawSingle) urls = [rawSingle];
          }
          window.StudySnapAudio.openImageModal({
            urls: urls,
            index: 0,
            label: imgCompactBtn.getAttribute('data-image-label') || 'Ảnh bài làm BVN'
          });
          return;
        }
        const imgThumbBtn = ev.target && ev.target.closest ? ev.target.closest('[data-image-modal-open]') : null;
        if (imgThumbBtn && typeof window.StudySnapAudio.openImageModal === 'function') {
          let urls = [];
          try {
            urls = JSON.parse(imgThumbBtn.getAttribute('data-image-urls') || '[]');
          } catch (e) {}
          const idx = parseInt(imgThumbBtn.getAttribute('data-image-index') || '0', 10) || 0;
          window.StudySnapAudio.openImageModal({
            urls: urls,
            index: idx,
            label: imgThumbBtn.getAttribute('data-image-label') || 'Ảnh bài làm BVN'
          });
        }
      });
    }

    const formEl = document.getElementById('student-submit-hw-form');
    if (formEl) {
      formEl.addEventListener('paste', function (ev) {
        const activeAsg = (state.assignments || []).find(function (a) {
          return a.assignment_id === ui.selectedAssignmentId;
        });
        const reqType = activeAsg ? String(activeAsg.require_media || '').trim().toLowerCase() : '';
        if (reqType !== 'image' && reqType !== 'audio_video_image' && reqType !== 'any') return;
        const items = ev.clipboardData && ev.clipboardData.items ? Array.prototype.slice.call(ev.clipboardData.items) : [];
        const imgFiles = items
          .filter(function (it) { return it && it.kind === 'file' && String(it.type || '').indexOf('image/') === 0; })
          .map(function (it) { return it.getAsFile(); })
          .filter(Boolean);
        if (imgFiles.length > 0) {
          ev.preventDefault();
          handleStudentImageFiles(imgFiles);
        }
      });

      formEl.addEventListener('submit', async function (e) {
        e.preventDefault();
        const student = getActiveStudent();
        const activeAsg = (state.assignments || []).find(function (a) {
          return a.assignment_id === ui.selectedAssignmentId;
        });
        const activeReqMedia = activeAsg ? String(activeAsg.require_media || 'audio_or_video').trim().toLowerCase() : 'audio_or_video';
        const noteArea = document.getElementById('student-note-textarea');
        const noteText = noteArea ? noteArea.value.trim() : '';
        const attempts = getSubmissionAttempts(ui.selectedAssignmentId, student.student_id);
        const existingSub = attempts.length ? attempts[attempts.length - 1] : null;
        const nextAttemptNum = existingSub
          ? Math.max(attempts.length + 1, Math.max(1, Number(existingSub.attempt_number || 1) || 1) + 1)
          : 1;
        const submitBtn = formEl.querySelector('button[type="submit"]');
        const loading = window.StudySnapLoading;

        if (existingSub && (!ui.pendingMedia || (!ui.pendingMedia.media_url && !(ui.pendingMedia.images && ui.pendingMedia.images.length)))) {
          ui.resubmitExpandedAsgId = ui.selectedAssignmentId;
          renderHomeworkSection();
          showToast(
            'Em đã nộp Lần ' +
            Math.max(1, Number(existingSub.attempt_number || attempts.length) || 1) +
            ' rồi. Hãy ' +
            (activeReqMedia === 'image' ? 'chụp hoặc chọn ảnh bài làm mới' : 'thu âm hoặc chọn tệp bài làm mới') +
            ' để nộp Lần ' +
            nextAttemptNum +
            ' nhé!'
          );
          return;
        }

        if (!ui.pendingMedia && activeReqMedia === 'image') {
          showToast('Em vui lòng chụp hoặc chọn ít nhất 1 ảnh bài làm trước khi bấm Nộp BVN nhé!');
          return;
        }

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
          media_type: 'audio',
          media_url: 'demo:student-' + student.student_id + '-' + Date.now(),
          media_duration: '01:15'
        };

        const isImageSubmission = mediaData.media_type === 'image';
        const pendingImages = isImageSubmission && Array.isArray(mediaData.images) ? mediaData.images : [];
        if (isImageSubmission && pendingImages.length === 0) {
          showToast('Chưa có ảnh bài làm hợp lệ. Em hãy chọn lại ảnh nhé!');
          return;
        }

        const hasBinaryMedia = Boolean(
          (isImageSubmission && pendingImages.length > 0) ||
          (mediaData.media_url && String(mediaData.media_url).indexOf('data:') === 0)
        );
        if (hasBinaryMedia && !isImageSubmission) {
          const commaPos = String(mediaData.media_url).indexOf(',');
          const b64Part = commaPos >= 0 ? String(mediaData.media_url).slice(commaPos + 1).replace(/\s+/g, '') : '';
          if (!b64Part || b64Part.length < 4) {
            showToast('Tệp thu âm/video bị trống hoặc lỗi dữ liệu. Em hãy thu lại hoặc chọn tệp khác nhé!');
            return;
          }
        }

        const defaultStudentNote = isImageSubmission
          ? ('Em nộp ' + pendingImages.length + ' ảnh bài làm BVN ạ.')
          : (mediaData.media_type === 'video' ? 'Em nộp video BVN ạ.' : 'Em nộp bản thu âm BVN ạ.');

        const submissionRecord = {
          submission_id: 'SUB_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6).toUpperCase(),
          assignment_id: ui.selectedAssignmentId,
          student_id: student.student_id,
          attempt_number: nextAttemptNum,
          submitted_at: timestamp,
          student_note: noteText || defaultStudentNote,
          media_type: mediaData.media_type,
          media_url: mediaData.media_url,
          media_duration: isImageSubmission ? (pendingImages.length + ' ảnh') : mediaData.media_duration,
          status: 'submitted',
          score: '',
          teacher_comment: '',
          teacher_voice_url: '',
          teacher_voice_duration: '',
          graded_at: ''
        };

        const runSubmit = async function () {
          const runSync = async function () {
            const postPayload = {
              action: 'submitHomework',
              assignment_id: submissionRecord.assignment_id,
              student_id: submissionRecord.student_id,
              student_note: submissionRecord.student_note,
              media_type: submissionRecord.media_type,
              media_url: submissionRecord.media_url,
              media_duration: submissionRecord.media_duration
            };
            if (isImageSubmission) {
              postPayload.media_images_base64 = pendingImages.map(function (img) {
                return {
                  dataUrl: img.dataUrl,
                  mimeType: img.mimeType || 'image/jpeg',
                  fileName: img.fileName || 'anh_bai_lam.jpg'
                };
              });
              postPayload.media_url = '';
            } else {
              postPayload.media_base64 = hasBinaryMedia ? mediaData.media_url : '';
              postPayload.media_mime_type = mediaData.mimeType || (mediaData.media_type === 'video' ? 'video/mp4' : 'audio/webm');
              postPayload.media_filename = mediaData.fileName || '';
            }
            return await window.StudySnapStore.syncPostToGas(state, postPayload);
          };

          const remoteRes = loading
            ? await loading.withOverlay(
                isImageSubmission
                  ? ('Đang tải ' + pendingImages.length + ' ảnh BVN lên hệ thống...')
                  : (hasBinaryMedia ? 'Đang tải tệp BVN lên hệ thống...' : 'Đang nộp BVN...'),
                'Vui lòng giữ nguyên trang cho đến khi hệ thống xác nhận đã nhận BVN.',
                runSync
              )
            : await runSync();

          if (remoteRes && remoteRes.ok === false) {
            showToast(remoteRes.error || 'Chưa thể nộp BVN lúc này. Vui lòng thử lại sau.');
            return;
          }

          if (remoteRes && remoteRes.submission) {
            if (remoteRes.submission.submission_id) {
              submissionRecord.submission_id = remoteRes.submission.submission_id;
            }
            if (remoteRes.submission.attempt_number) {
              submissionRecord.attempt_number = Math.max(1, Number(remoteRes.submission.attempt_number) || nextAttemptNum);
            }
            if (remoteRes.submission.media_url) {
              submissionRecord.media_url = remoteRes.submission.media_url;
            }
            if (remoteRes.submission.status) {
              submissionRecord.status = remoteRes.submission.status;
            }
            if (remoteRes.submission.submitted_at) {
              submissionRecord.submitted_at = remoteRes.submission.submitted_at;
            }
          }

          const existingIndex = (state.submissions || []).findIndex(function (s) {
            return s.submission_id === submissionRecord.submission_id;
          });

          if (existingIndex >= 0) {
            state.submissions[existingIndex] = submissionRecord;
          } else {
            state.submissions.push(submissionRecord);
          }

          window.StudySnapStore.saveState(state);
          ui.pendingMedia = null;
          ui.resubmitExpandedAsgId = null;
          ui.dismissedAutoResubmitAsgId = null;
          ui.selectedAttemptSubId = submissionRecord.submission_id;
          if (noteArea) noteArea.value = '';
          if (fileInput) fileInput.value = '';
          if (imageInput) imageInput.value = '';
          renderPendingMediaPreview();
          if (recStatusText) {
            recStatusText.textContent = 'Đã nộp BVN Lần ' + submissionRecord.attempt_number + ' lúc ' + (submissionRecord.submitted_at || timestamp);
          }

          renderStudentHeaderAndStats();
          renderHomeworkSection();
          showToast(
            remoteRes === null && window.StudySnapStore.getGasUrl()
              ? 'Đã lưu BVN Lần ' + submissionRecord.attempt_number + ' trên thiết bị (mất kết nối máy chủ).'
              : 'Đã nộp BVN Lần ' + submissionRecord.attempt_number + ' thành công!'
          );
        };

        if (loading && submitBtn) {
          await loading.withButtonLoading(
            submitBtn,
            isImageSubmission ? 'Đang tải ảnh BVN...' : (hasBinaryMedia ? 'Đang tải tệp BVN...' : 'Đang gửi BVN...'),
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
  // 3. TAB 1: BÀI TẬP LUYỆN TẬP CUỐI BUỔI (TỰ ĐỘNG CHẤM & ĐÁNH GIÁ)
  // =========================================================================
  function getPracticeDraftKey(exerciseId) {
    const student = getActiveStudent();
    return 'studysnap_practice_draft_' + student.student_id + '_' + exerciseId;
  }

  function getVisiblePracticeExercises(student) {
    const activeStudent = student || getActiveStudent();
    const sClass = activeStudent ? String(activeStudent.class_name || '').trim().toLowerCase() : '';
    const sIdUpper = activeStudent ? String(activeStudent.student_id || '').trim().toUpperCase() : '';
    const exercises = state.practiceExercises || [];
    const assignments = state.assignments || [];
    const practiceSubs = Array.isArray(state.practiceSubmissions) ? state.practiceSubmissions : [];

    return exercises.filter(function (ex) {
      const exId = String((ex && ex.exercise_id) || '').trim();
      const hasSubmitted = Boolean(
        sIdUpper &&
        exId &&
        practiceSubs.some(function (sub) {
          return (
            String((sub && sub.exercise_id) || '').trim() === exId &&
            String((sub && sub.student_id) || '').trim().toUpperCase() === sIdUpper
          );
        })
      );
      if (hasSubmitted) return true;

      const deliveries = assignments.filter(function (a) {
        return a.require_media === 'practice' && String(a.exercise_id || '').trim() === exId;
      });
      // Đề chưa từng được giao cho lớp nào (Chưa giao lớp nào) không hiển thị cho học sinh chưa nộp
      if (deliveries.length === 0) return false;
      return deliveries.some(function (d) {
        const clsLower = String(d.class_name || '').trim().toLowerCase();
        if (!clsLower || clsLower === 'unassigned') return false;
        if (clsLower === 'all') return true;
        return Boolean(sClass && clsLower === sClass);
      });
    });
  }

  function isPracticeExerciseActivelyAssignedToStudent(ex, student) {
    if (!ex || !ex.exercise_id) return false;
    const activeStudent = student || getActiveStudent();
    const sClass = activeStudent ? String(activeStudent.class_name || '').trim().toLowerCase() : '';
    const exId = String(ex.exercise_id || '').trim();
    return (state.assignments || []).some(function (a) {
      if (a.require_media !== 'practice' || String(a.exercise_id || '').trim() !== exId) return false;
      const clsLower = String(a.class_name || '').trim().toLowerCase();
      if (!clsLower || clsLower === 'unassigned') return false;
      if (clsLower === 'all') return true;
      return Boolean(sClass && clsLower === sClass);
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
    const targetExId = String(exerciseId || '').trim();
    const targetStuId = String((student && student.student_id) || '').trim().toUpperCase();
    return (state.practiceSubmissions || []).find(function (sub) {
      return (
        String((sub && sub.exercise_id) || '').trim() === targetExId &&
        String((sub && sub.student_id) || '').trim().toUpperCase() === targetStuId
      );
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
      } else if (sec.type === 'error_correction' || sec.type === 'translation' || sec.type === 'short_answer') {
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

  const PRACTICE_SUMMARY_ICONS = {
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    alert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>'
  };

  function getStudentPracticeRatingMeta(sub, ex) {
    const maxScore = Number((sub && sub.max_score) || (ex && ex.total_score) || 0) || 0;
    const score = Number((sub && sub.total_score) || 0) || 0;
    const key =
      typeof window !== 'undefined' &&
      window.StudySnapStore &&
      typeof window.StudySnapStore.resolvePracticeRatingKey === 'function'
        ? window.StudySnapStore.resolvePracticeRatingKey(sub && sub.rating, score, maxScore, ex && ex.thresholds)
        : (sub && sub.rating);

    if (key === 'good') {
      return { label: 'Khá', badgeClass: 'status-submitted', icon: PRACTICE_SUMMARY_ICONS.check };
    }
    if (key === 'needs_review') {
      return { label: 'Cần ôn', badgeClass: 'status-missing', icon: PRACTICE_SUMMARY_ICONS.alert };
    }
    return { label: 'Rất tốt', badgeClass: 'status-graded', icon: PRACTICE_SUMMARY_ICONS.check };
  }

  function getPracticeManualTranslationStatus(exercise, sub) {
    let totalManual = 0;
    let gradedManual = 0;
    const comments = [];
    if (exercise && Array.isArray(exercise.sections)) {
      exercise.sections.forEach(function (sec) {
        if (sec && (sec.type === 'translation' || sec.type === 'short_answer')) {
          ((sec.data && sec.data.items) || []).forEach(function (item) {
            const hasKey = Array.isArray(item && item.accepted) && item.accepted.length > 0;
            const isManualItem = Boolean(item && (item.mode === 'manual' || (sec.type === 'short_answer' && !hasKey)));
            if (isManualItem) {
              totalManual++;
              const mg = sub && sub.manual_grades ? sub.manual_grades[item.id] : null;
              if (mg) {
                gradedManual++;
                if (mg.comment) comments.push(String(mg.comment).trim());
              }
            }
          });
        }
      });
    }
    return {
      totalManual: totalManual,
      gradedManual: gradedManual,
      pendingManual: Math.max(0, totalManual - gradedManual),
      comments: comments.filter(Boolean)
    };
  }

  function hasPracticeLocalDraft(exerciseId) {
    try {
      const raw = localStorage.getItem(getPracticeDraftKey(exerciseId));
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed && parsed.answers && Object.keys(parsed.answers).length > 0);
    } catch (e) {
      return false;
    }
  }

  function renderStudentPracticeSummaryTable() {
    const tbody = document.getElementById('student-practice-summary-tbody');
    const summaryBadge = document.getElementById('student-practice-summary-badge');
    const summaryNote = document.getElementById('student-practice-summary-note');
    if (!tbody) return;

    const student = getActiveStudent();
    const visibleExercises = getVisiblePracticeExercises(student);
    const activeEx = getActiveExercise();
    const filterVal = ui.practiceSummaryFilter || 'all';

    document.querySelectorAll('[data-student-practice-filter]').forEach(function (pill) {
      pill.classList.toggle('is-active', pill.getAttribute('data-student-practice-filter') === filterVal);
    });

    if (visibleExercises.length === 0) {
      if (summaryBadge) summaryBadge.textContent = '0/0 bài';
      if (summaryNote) {
        summaryNote.textContent = 'Giáo viên chưa giao bài luyện tập cuối buổi nào cho lớp của em.';
      }
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-muted-foreground);">' +
          'Hiện chưa có bài luyện tập cuối buổi nào được giao cho lớp của em.' +
        '</td></tr>';
      return;
    }

    let doneCount = 0;
    let pctSum = 0;
    let pctCount = 0;
    let pendingManualTotal = 0;

    const rowsData = visibleExercises.map(function (ex) {
      const sub = findStudentPracticeSubmission(ex.exercise_id);
      const isDone = Boolean(sub);
      const isDraft = !isDone && hasPracticeLocalDraft(ex.exercise_id);
      const maxScore = Number((sub && sub.max_score) || ex.total_score || 0) || 0;
      const scoreVal = isDone ? (Number(sub.total_score || 0) || 0) : 0;
      const pct = (isDone && maxScore > 0) ? Math.round((scoreVal / maxScore) * 100) : null;
      const manualInfo = isDone ? getPracticeManualTranslationStatus(ex, sub) : { totalManual: 0, gradedManual: 0, pendingManual: 0, comments: [] };

      if (isDone) {
        doneCount++;
        if (pct !== null) {
          pctSum += pct;
          pctCount++;
        }
        if (manualInfo.pendingManual > 0) pendingManualTotal++;
      }

      return {
        ex: ex,
        sub: sub,
        isDone: isDone,
        isDraft: isDraft,
        maxScore: maxScore,
        scoreVal: scoreVal,
        pct: pct,
        manualInfo: manualInfo
      };
    });

    const avgPct = pctCount > 0 ? Math.round(pctSum / pctCount) : null;
    if (summaryBadge) {
      summaryBadge.textContent = doneCount + '/' + visibleExercises.length + ' bài' + (avgPct !== null ? (' • TB ' + avgPct + '%') : '');
    }
    if (summaryNote) {
      const missingTotal = visibleExercises.length - doneCount;
      const parts = ['Hoàn thành ' + doneCount + '/' + visibleExercises.length + ' bài'];
      if (missingTotal > 0) parts.push('còn ' + missingTotal + ' bài chưa làm');
      if (pendingManualTotal > 0) parts.push(pendingManualTotal + ' bài đang chờ cô chấm câu Dịch');
      summaryNote.textContent = parts.join(' • ') + '.';
    }

    syncStudentSortIndicators('data-student-practice-sort', ui.practiceSummarySort);

    const rawFilteredRows = rowsData.filter(function (row) {
      if (filterVal === 'missing') return !row.isDone;
      if (filterVal === 'done') return row.isDone;
      return true;
    });

    const filteredRows = sortStudentRows(rawFilteredRows, ui.practiceSummarySort, {
      getTitle: function (row) {
        const ex = row && row.ex ? row.ex : {};
        return (ex.lesson_tag ? ex.lesson_tag + ' ' : '') + (ex.title || '');
      },
      getStatusRank: function (row) {
        if (row.isDone) return 2;
        if (row.isDraft) return 1;
        return 0;
      },
      getScore: function (row) {
        if (!row.isDone) return null;
        if (typeof row.pct === 'number' && Number.isFinite(row.pct)) return row.pct;
        const n = Number(row.scoreVal);
        return Number.isFinite(n) ? n : null;
      }
    });

    if (filteredRows.length === 0) {
      const emptyMsg = filterVal === 'missing'
        ? 'Em đã hoàn thành tất cả các bài luyện tập cuối buổi được giao!'
        : 'Em chưa hoàn thành bài luyện tập cuối buổi nào.';
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-muted-foreground);">' +
          emptyMsg + ' ' +
          '<button type="button" class="btn btn-outline btn-sm" data-student-practice-reset="1" style="margin-left:8px;">Xem tất cả bài</button>' +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = filteredRows.map(function (row) {
      const ex = row.ex;
      const sub = row.sub;
      const isActiveRow = Boolean(activeEx && activeEx.exercise_id === ex.exercise_id);

      const isClosedAssigned = row.isDone && !isPracticeExerciseActivelyAssignedToStudent(ex, student);

      let statusHtml = '';
      if (row.isDone) {
        statusHtml = '<span class="status-badge status-graded">' + PRACTICE_SUMMARY_ICONS.check + '<span>Đã hoàn thành</span></span>' +
          (isClosedAssigned ? '<div style="margin-top:4px;"><span class="status-badge status-unassigned" style="font-size:0.75rem;">Đã đóng giao • Giữ điểm</span></div>' : '');
      } else if (row.isDraft) {
        statusHtml = '<span class="status-badge status-submitted">' + PRACTICE_SUMMARY_ICONS.clock + '<span>Đang làm dở (đã lưu nháp)</span></span>';
      } else {
        statusHtml = '<span class="status-badge status-missing">' + PRACTICE_SUMMARY_ICONS.alert + '<span>Chưa làm bài</span></span>';
      }

      const scoreHtml = row.isDone
        ? ('<strong class="mono-text tabular-nums">' + row.scoreVal + (row.maxScore > 0 ? ('/' + row.maxScore) : '') + ' đ</strong>' +
            (row.pct !== null ? (' <span class="tabular-nums" style="font-size:0.8125rem;color:var(--color-muted-foreground);">(' + row.pct + '%)</span>') : ''))
        : '<span class="mono-text tabular-nums" style="color:var(--color-muted-foreground);">—</span>';

      let ratingHtml = '<span style="font-size:0.8125rem;color:var(--color-muted-foreground);">Chưa có</span>';
      if (row.isDone && sub) {
        const rm = getStudentPracticeRatingMeta(sub, ex);
        ratingHtml = '<span class="status-badge ' + rm.badgeClass + '">' + rm.icon + '<span>' + rm.label + '</span></span>';
      }

      let reviewNoteHtml = '';
      if (!row.isDone) {
        reviewNoteHtml = '<p class="matrix-teacher-note" style="color:var(--color-muted-foreground);">' +
          (row.isDraft ? 'Em đang làm dở bài này. Bấm "Làm tiếp" để hoàn thành và xem điểm.' : 'Em chưa làm bài này. Hãy bấm "Làm bài ngay" để luyện tập.') +
          '</p>';
      } else if (row.manualInfo.totalManual === 0) {
        reviewNoteHtml = '<p class="matrix-teacher-note">Hệ thống đã tự chấm điểm đầy đủ' +
          (sub && sub.submitted_at ? (' • Nộp lúc ' + escapeHtml(sub.submitted_at)) : '') + '.</p>';
      } else if (row.manualInfo.pendingManual > 0) {
        reviewNoteHtml = '<p class="matrix-teacher-note">' +
          '<span class="status-badge status-submitted" style="margin-bottom:4px;">' + PRACTICE_SUMMARY_ICONS.clock + '<span>Chờ cô chấm (' + row.manualInfo.gradedManual + '/' + row.manualInfo.totalManual + ' câu)</span></span>' +
          (sub && sub.submitted_at ? ('<br><span style="font-size:0.75rem;color:var(--color-muted-foreground);">Nộp lúc ' + escapeHtml(sub.submitted_at) + '</span>') : '') +
          '</p>';
      } else {
        const previewComment = row.manualInfo.comments.length > 0
          ? ('<br><strong>Nhận xét GV:</strong> ' + escapeHtml(row.manualInfo.comments[0]) + (row.manualInfo.comments.length > 1 ? ' ...' : ''))
          : '';
        reviewNoteHtml = '<p class="matrix-teacher-note">' +
          '<span class="status-badge status-graded" style="margin-bottom:4px;">' + PRACTICE_SUMMARY_ICONS.check + '<span>Đã chấm đủ ' + row.manualInfo.totalManual + ' câu Dịch</span></span>' +
          previewComment +
          '</p>';
      }

      const btnLabel = row.isDone ? 'Xem chi tiết điểm' : (row.isDraft ? 'Làm tiếp bài' : 'Làm bài ngay');
      const btnClass = row.isDone ? 'btn-outline' : 'btn-primary';

      return (
        '<tr' + (isActiveRow ? ' class="is-active-row"' : '') + '>' +
          '<td>' +
            '<div style="font-weight:700;color:var(--color-foreground);display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
              '<span class="status-badge" style="background:var(--color-surface-soft);color:var(--color-primary-deep);font-weight:700;font-size:0.75rem;">' +
                escapeHtml(ex.lesson_tag || 'Bài học') +
              '</span>' +
              '<span>' + escapeHtml(ex.title || 'Bài luyện tập') + '</span>' +
              (isActiveRow ? '<span class="status-badge status-submitted" style="font-size:0.75rem;">Đang mở</span>' : '') +
            '</div>' +
            '<div class="tabular-nums" style="font-size:0.8125rem;color:var(--color-muted-foreground);margin-top:2px;">' +
              (ex.sections ? ex.sections.length + ' phần' : '') +
              (row.maxScore > 0 ? (' • Tối đa ' + row.maxScore + ' điểm') : '') +
            '</div>' +
          '</td>' +
          '<td>' + statusHtml + '</td>' +
          '<td>' + scoreHtml + '</td>' +
          '<td>' + ratingHtml + '</td>' +
          '<td>' + reviewNoteHtml + '</td>' +
          '<td>' +
            '<button type="button" class="btn ' + btnClass + ' btn-sm" data-open-practice-row="' + escapeHtml(ex.exercise_id) + '">' +
              btnLabel +
            '</button>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
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
      if (typeof renderStudentPracticeSummaryTable === 'function') {
        renderStudentPracticeSummaryTable();
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
      if (typeof renderStudentPracticeSummaryTable === 'function') {
        renderStudentPracticeSummaryTable();
      }
      return;
    }

    if (resultsBox) resultsBox.style.display = 'none';
    if (formEl) formEl.style.display = 'block';

    const container = document.getElementById('student-practice-sections-container');
    if (!container) {
      if (typeof renderStudentPracticeSummaryTable === 'function') {
        renderStudentPracticeSummaryTable();
      }
      return;
    }

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
    if (typeof renderStudentPracticeSummaryTable === 'function') {
      renderStudentPracticeSummaryTable();
    }
  }

  function getPracticeItemPoints(item) {
    const p = Number(item && item.points);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }

  function getPracticeScaledMcPoints(sec, items) {
    const count = Array.isArray(items) ? items.length : 0;
    const secMax = Number(sec && sec.max_score) || count;
    if (count > 0 && secMax !== count) {
      return Math.round((secMax / count) * 10) / 10;
    }
    return 1;
  }

  function formatPracticePtsLabel(pts) {
    const n = Math.round(Number(pts || 0) * 10) / 10;
    return Number.isInteger(n) ? String(n) : String(n);
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
    } else if (sec.type === 'short_answer') {
      return renderShortAnswerBodyHtml(sec);
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

  // --- SHARED SECTION MEDIA HELPER (IMAGE + YOUTUBE + AUDIO) ---
  function extractStudentYouTubeId(rawUrlOrId) {
    const clean = String(rawUrlOrId || '').trim();
    if (!clean) return '';
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
    const match = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    return match ? match[1] : '';
  }

  function resolveStudentDisplayImageUrl(rawUrl) {
    const clean = String(rawUrl || '').trim();
    if (!clean) return '';
    if (
      typeof window !== 'undefined' &&
      window.StudySnapStore &&
      typeof window.StudySnapStore.resolveMediaDisplayUrl === 'function'
    ) {
      return window.StudySnapStore.resolveMediaDisplayUrl(clean, 'image/jpeg');
    }
    return clean;
  }

  function renderSectionMediaContextHtml(sec, idPrefix) {
    const data = (sec && sec.data) || {};
    const blocks = [];

    const imgUrl = resolveStudentDisplayImageUrl(data.image_url);
    if (imgUrl) {
      blocks.push(
        '<div class="practice-prompt-image-box">' +
        '<img src="' + escapeHtml(imgUrl) + '" alt="Hình ảnh minh họa câu hỏi" loading="lazy">' +
        '</div>'
      );
    }

    const ytId = extractStudentYouTubeId(data.youtube_id || data.youtube_url);
    if (ytId) {
      const watchUrl = 'https://www.youtube.com/watch?v=' + encodeURIComponent(ytId);
      const embedUrl = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(ytId) + '?rel=0';
      blocks.push(
        '<div class="practice-youtube-box">' +
        '<div class="practice-youtube-frame-wrap">' +
        '<iframe src="' + escapeHtml(embedUrl) + '" title="' + escapeHtml(sec.title || 'Video bài nghe') + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>' +
        '</div>' +
        '<div class="practice-youtube-footer">' +
        '<span>Bấm Play trên video để nghe bài làm (có thể tua lại bất kỳ lúc nào).</span>' +
        '<a href="' + escapeHtml(watchUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Mở trực tiếp trên YouTube</a>' +
        '</div>' +
        '</div>'
      );
    }

    const audioUrl = String(data.audio_url || '').trim();
    if (audioUrl && audioUrl.indexOf('demo:') !== 0 && window.StudySnapAudio) {
      blocks.push(
        '<div class="listening-audio-strip">' +
        window.StudySnapAudio.renderVoicePlayer({
          id: (idPrefix || 'student-sec-aud-') + sec.section_id,
          url: audioUrl,
          duration: data.audio_duration || '00:45',
          label: data.audio_label || 'Nghe file âm thanh bài tập',
          fallbackText: '',
          requireRealAudio: true,
          lang: 'zh-CN',
          variant: 'student',
          showSpeedToggle: true
        }) +
        '</div>'
      );
    }

    return blocks.length > 0 ? '<div class="practice-media-block">' + blocks.join('') + '</div>' : '';
  }

  function renderPracticePassageBoxHtml(sec) {
    const passageText = sec && sec.data && sec.data.passage ? String(sec.data.passage).trim() : '';
    if (!passageText) return '';
    return (
      '<div class="practice-passage-box">' +
        '<div class="practice-passage-label">Đoạn văn đọc hiểu</div>' +
        '<div class="practice-passage-text">' + escapeHtml(passageText) + '</div>' +
      '</div>'
    );
  }

  function renderMcQuestionCardsHtml(sec, skipEmptyOptions) {
    const secAns = ui.practiceAnswers[sec.section_id] || {};
    const items = (sec.data && sec.data.items) || [];
    const isPerQuestionListening =
      sec.type === 'listening_mc' && sec.data && sec.data.listening_mode === 'per_question';
    const passageHtml = sec.type === 'multiple_choice' ? renderPracticePassageBoxHtml(sec) : '';
    const mediaHeaderHtml = sec.type === 'multiple_choice' ? renderSectionMediaContextHtml(sec, 'student-mc-media-') : '';

    return (
      passageHtml +
      mediaHeaderHtml +
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
          const itemImgUrl = resolveStudentDisplayImageUrl(item.image_url);
          const itemImgHtml = itemImgUrl
            ? '<div class="practice-prompt-image-box" style="margin-top:10px;"><img src="' + escapeHtml(itemImgUrl) + '" alt="Hình ảnh câu ' + (idx + 1) + '" loading="lazy"></div>'
            : '';
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
            itemImgHtml +
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
    return renderMcQuestionCardsHtml(sec, true);
  }

  // --- SECTION 6: LISTENING COMPREHENSION (NGHE HIỂU HỘI THOẠI / TỪNG CÂU) ---
  function renderListeningMcBodyHtml(sec) {
    const data = sec.data || {};
    const listeningMode = data.listening_mode === 'per_question' ? 'per_question' : 'shared';
    const audioUrl = (data.audio_url || '').trim();
    const hasAudioFile = Boolean(audioUrl && audioUrl.indexOf('demo:') !== 0);
    const ytId = extractStudentYouTubeId(data.youtube_id || data.youtube_url);
    const secImgUrl = resolveStudentDisplayImageUrl(data.image_url);
    const showSharedPlayer = listeningMode === 'shared' && hasAudioFile && window.StudySnapAudio;

    const imgBannerHtml = secImgUrl
      ? '<div class="practice-prompt-image-box" style="margin-bottom:12px;"><img src="' + escapeHtml(secImgUrl) + '" alt="Hình ảnh bài nghe" loading="lazy"></div>'
      : '';
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
          : ytId
          ? ''
          : '<div class="listening-missing-audio-note">Phần nghe hiểu này chưa được giáo viên gắn tệp âm thanh.</div>')
      : '';
    const ytStripHtml = ytId
      ? '<div class="practice-youtube-box" style="margin-top:10px;">' +
        '<div class="practice-youtube-frame-wrap">' +
        '<iframe src="' + escapeHtml('https://www.youtube-nocookie.com/embed/' + encodeURIComponent(ytId) + '?rel=0') + '" title="' + escapeHtml(sec.title || 'Video bài nghe') + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>' +
        '</div>' +
        '<div class="practice-youtube-footer"><span>Nghe video để chọn đáp án phù hợp.</span><a href="' + escapeHtml('https://www.youtube.com/watch?v=' + encodeURIComponent(ytId)) + '" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Mở trên YouTube</a></div>' +
        '</div>'
      : '';

    const hasBannerContent = Boolean(data.context_label || data.context_title || data.context_subtitle || playerHtml || ytStripHtml || imgBannerHtml);
    const bannerHtml = hasBannerContent
      ? '<div class="listening-context-banner">' +
        '<div class="listening-context-top">' +
        '<div style="flex:1;min-width:min(220px, 100%);">' +
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
        imgBannerHtml +
        playerHtml +
        ytStripHtml +
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

  // --- SECTION 7: SHORT ANSWER / IMAGE MATCH / AUDIO FILL (TRẢ LỜI NGẮN / NGHE & ĐIỀN) ---
  function renderShortAnswerBodyHtml(sec) {
    const secAns = ui.practiceAnswers[sec.section_id] || {};
    const items = (sec.data && sec.data.items) || [];
    const passageText = sec.data && sec.data.passage ? String(sec.data.passage).trim() : '';
    const passageHtml = renderPracticePassageBoxHtml(sec);
    const mediaHtml = renderSectionMediaContextHtml(sec, 'student-sa-');
    const hasLongOrMultiline = items.some(function (it) {
      return Boolean(it && (it.multiline || String(it.prompt || '').length > 36));
    });
    const isCompactGrid = items.length >= 4 && !passageText && !hasLongOrMultiline;

    const cardsHtml = items
      .map(function (item, idx) {
        const currentVal = secAns[item.id] || '';
        const itemPts = getPracticeItemPoints(item);
        const itemImgUrl = resolveStudentDisplayImageUrl(item.image_url);
        const itemImgHtml = itemImgUrl
          ? '<div class="practice-prompt-image-box"><img src="' + escapeHtml(itemImgUrl) + '" alt="Hình minh họa câu ' + (idx + 1) + '" loading="lazy"></div>'
          : '';
        const placeholderText = item.hint ? String(item.hint) : 'Nhập câu trả lời của em...';
        const badgeLabel = 'Câu ' + (idx + 1) + (itemPts !== 1 ? ' • ' + formatPracticePtsLabel(itemPts) + 'đ' : '');
        const fieldHtml = item.multiline
          ? '<textarea rows="' + (Number(item.rows) || 5) + '" class="form-control chinese-text-input practice-essay-textarea" placeholder="' +
            escapeHtml(placeholderText) +
            '" data-sa-sec="' +
            escapeHtml(sec.section_id) +
            '" data-sa-item="' +
            escapeHtml(item.id) +
            '">' +
            escapeHtml(currentVal) +
            '</textarea>' +
            '<div class="practice-char-counter tabular-nums" data-sa-char-count="' +
            escapeHtml(sec.section_id + ':' + item.id) +
            '">Đã viết: ' + currentVal.trim().length + ' ký tự</div>'
          : '<input type="text" class="form-control chinese-text-input" placeholder="' +
            escapeHtml(placeholderText) +
            '" value="' +
            escapeHtml(currentVal) +
            '" data-sa-sec="' +
            escapeHtml(sec.section_id) +
            '" data-sa-item="' +
            escapeHtml(item.id) +
            '">';

        return (
          '<div class="short-answer-card">' +
          '<div class="short-answer-card-head">' +
          '<div class="short-answer-prompt">' +
          escapeHtml(item.prompt || ('Câu ' + (idx + 1))) +
          '</div>' +
          '<span class="practice-section-num-badge" style="font-size:0.75rem;flex-shrink:0;">' +
          escapeHtml(badgeLabel) +
          '</span>' +
          '</div>' +
          itemImgHtml +
          (item.hint
            ? '<div class="short-answer-hint">' + escapeHtml(item.hint) + '</div>'
            : '') +
          fieldHtml +
          '</div>'
        );
      })
      .join('');

    return (
      passageHtml +
      mediaHtml +
      '<div class="short-answer-grid' + (isCompactGrid ? ' is-compact' : '') + '">' +
      cardsHtml +
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

    // 7. Short Answer Inputs (Realtime auto-save + char counter)
    document.querySelectorAll('[data-sa-sec]').forEach(function (input) {
      input.addEventListener('input', function () {
        const secId = input.getAttribute('data-sa-sec');
        const itemId = input.getAttribute('data-sa-item');
        if (!ui.practiceAnswers[secId]) ui.practiceAnswers[secId] = {};
        ui.practiceAnswers[secId][itemId] = input.value;
        const charEl = document.querySelector('[data-sa-char-count="' + secId + ':' + itemId + '"]');
        if (charEl) {
          charEl.textContent = 'Đã viết: ' + String(input.value || '').trim().length + ' ký tự';
        }
        savePracticeDraft();
      });
    });
  }

  // --- RESULTS & EVALUATION DASHBOARD RENDERING ---
  function renderPracticeResultsHtml(exercise, sub) {
    const totalScore = sub.total_score || 0;
    const maxScore = sub.max_score || exercise.total_score || 35;
    const percent = Math.round((totalScore / maxScore) * 100);

    const rawThresholds = exercise.thresholds || { very_good: 31, good: 25 };
    const thresholds =
      typeof window !== 'undefined' &&
      window.StudySnapStore &&
      typeof window.StudySnapStore.getEffectivePracticeThresholds === 'function'
        ? window.StudySnapStore.getEffectivePracticeThresholds(rawThresholds, maxScore)
        : rawThresholds;
    const ratingKey =
      typeof window !== 'undefined' &&
      window.StudySnapStore &&
      typeof window.StudySnapStore.resolvePracticeRatingKey === 'function'
        ? window.StudySnapStore.resolvePracticeRatingKey(sub.rating, totalScore, maxScore, thresholds)
        : (totalScore >= thresholds.very_good ? 'very_good' : (totalScore >= thresholds.good ? 'good' : 'needs_review'));

    let ratingBadgeClass = 'status-badge status-missing';
    let ratingLabel = 'Cần ôn lại (Dưới ' + thresholds.good + ' điểm)';
    let ratingMessage =
      'Em đã rất nỗ lực hoàn thành bài tập! Hãy xem kỹ lời giải thích chi tiết bên dưới để củng cố các chữ Hán và ngữ pháp cần ôn lại nhé.';

    if (ratingKey === 'very_good') {
      ratingBadgeClass = 'status-badge status-graded';
      ratingLabel = 'Rất tốt (' + thresholds.very_good + '–' + maxScore + ' điểm)';
      ratingMessage =
        'Xuất sắc! Em nắm rất vững ngữ âm, chữ Hán, quy tắc biến điệu thanh điệu và giao tiếp thực tế của bài học!';
    } else if (ratingKey === 'good') {
      ratingBadgeClass = 'status-badge status-submitted';
      ratingLabel = 'Khá (' + thresholds.good + '–' + Math.max(thresholds.good, thresholds.very_good - 0.5) + ' điểm)';
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
      const mcPtsLabel = formatPracticePtsLabel(getPracticeScaledMcPoints(sec, items));
      const isPerQuestionListening =
        sec.type === 'listening_mc' && sec.data && sec.data.listening_mode === 'per_question';
      const passageHtml = sec.type === 'multiple_choice' ? renderPracticePassageBoxHtml(sec) : '';
      return passageHtml + items
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
            '<div style="font-weight:700;white-space:pre-line;">Câu ' +
            (idx + 1) +
            ': ' +
            escapeHtml(item.prompt) +
            '</div>' +
            '<span class="status-badge ' +
            (isCorrect ? 'status-graded' : 'status-submitted') +
            '">' +
            (isCorrect ? '✓ Đúng (+' + mcPtsLabel + 'đ)' : '✕ Sai') +
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
          const itemPts = getPracticeItemPoints(item);
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
            (isCorrect ? '✓ Đúng (+' + formatPracticePtsLabel(itemPts) + 'đ)' : '✕ Sai') +
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
          const itemPts = getPracticeItemPoints(item);
          const isManual = item.mode === 'manual';
          const mg = manualGrades[item.id];

          let isCorrect = false;
          let badgeHtml = '';

          if (isManual) {
            if (mg) {
              const sc = Number(mg.score || 0);
              isCorrect = sc >= itemPts * 0.5;
              badgeHtml =
                '<span class="status-badge status-graded">Giáo viên chấm: ' + sc + '/' + formatPracticePtsLabel(itemPts) + ' đ</span>';
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
              (isCorrect ? '✓ Đúng (+' + formatPracticePtsLabel(itemPts) + 'đ)' : '✕ Sai') +
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
    } else if (sec.type === 'short_answer') {
      const items = (sec.data && sec.data.items) || [];
      const manualGrades = sub.manual_grades || {};
      const passageHtml = renderPracticePassageBoxHtml(sec);
      const mediaHtml = renderSectionMediaContextHtml(sec, 'student-sa-review-');

      const itemsHtml = items
        .map(function (item, idx) {
          const userVal = studentAns[item.id] || '';
          const itemPts = getPracticeItemPoints(item);
          const hasAccepted = Array.isArray(item.accepted) && item.accepted.length > 0;
          const isManual = item.mode === 'manual' || !hasAccepted;
          const mg = manualGrades[item.id];

          let isCorrect = false;
          let badgeHtml = '';

          if (isManual) {
            if (mg) {
              const sc = Number(mg.score || 0);
              isCorrect = sc >= itemPts * 0.5;
              badgeHtml =
                '<span class="status-badge status-graded">Giáo viên chấm: ' + sc + '/' + formatPracticePtsLabel(itemPts) + ' đ</span>';
            } else {
              badgeHtml =
                '<span class="status-badge status-submitted">Đang chờ giáo viên chấm</span>';
            }
          } else {
            isCorrect = window.StudySnapStore.isAnswerMatch(userVal, item.accepted || []);
            badgeHtml =
              '<span class="status-badge ' +
              (isCorrect ? 'status-graded' : 'status-submitted') +
              '">' +
              (isCorrect ? '✓ Đúng (+' + formatPracticePtsLabel(itemPts) + 'đ)' : '✕ Sai') +
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
            '<div style="font-weight:700;white-space:pre-line;">Câu ' +
            (idx + 1) +
            ': ' +
            escapeHtml(item.prompt || '') +
            '</div>' +
            badgeHtml +
            '</div>' +
            '<div style="font-size:0.875rem;margin-top:6px;">' +
            '<div>Câu trả lời của em: <strong' + (item.multiline ? ' style="display:block;white-space:pre-wrap;margin-top:4px;"' : '') + '>' +
            escapeHtml(userVal || 'Chưa nhập') +
            '</strong></div>' +
            (!isManual && !isCorrect
              ? '<div style="color:var(--color-primary-deep);margin-top:2px;">Đáp án chuẩn: <strong>' +
                escapeHtml((item.accepted || []).slice(0, 3).join(' / ')) +
                '</strong></div>'
              : '') +
            (isManual && mg && mg.comment
              ? '<div style="color:var(--color-primary-deep);margin-top:4px;">Nhận xét của cô: <em>' +
                escapeHtml(mg.comment) +
                '</em></div>'
              : '') +
            '</div>' +
            (item.explanation
              ? '<div class="explanation-reveal-box"><strong>Giải thích:</strong> ' +
                escapeHtml(item.explanation) +
                '</div>'
              : '') +
            '</div>'
          );
        })
        .join('');
      return passageHtml + mediaHtml + itemsHtml;
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
    document.querySelectorAll('[data-student-practice-sort]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const colKey = btn.getAttribute('data-student-practice-sort');
        if (!colKey) return;
        ui.practiceSummarySort = toggleStudentSortKey(ui.practiceSummarySort, colKey, ['score']);
        renderStudentPracticeSummaryTable();
      });
    });

    document.querySelectorAll('[data-student-practice-filter]').forEach(function (pill) {
      pill.addEventListener('click', function () {
        ui.practiceSummaryFilter = pill.getAttribute('data-student-practice-filter') || 'all';
        renderStudentPracticeSummaryTable();
      });
    });

    const summaryTbody = document.getElementById('student-practice-summary-tbody');
    if (summaryTbody) {
      summaryTbody.addEventListener('click', function (ev) {
        const target = ev.target && ev.target.closest ? ev.target : null;
        if (!target) return;

        const resetBtn = target.closest('[data-student-practice-reset]');
        if (resetBtn) {
          ui.practiceSummaryFilter = 'all';
          renderStudentPracticeSummaryTable();
          return;
        }

        const openBtn = target.closest('[data-open-practice-row]');
        if (openBtn) {
          const exId = openBtn.getAttribute('data-open-practice-row');
          if (!exId) return;
          ui.selectedExerciseId = exId;
          const existingSub = findStudentPracticeSubmission(exId);
          if (existingSub) {
            ui.practiceAnswers = JSON.parse(JSON.stringify(existingSub.answers || {}));
            ui.practiceViewingResult = true;
          } else {
            ui.practiceAnswers = {};
            ui.selectedMatchingLeft = null;
            ui.selectedWordBankChip = null;
            ui.selectedTargetBlank = null;
            ui.practiceViewingResult = false;
          }
          renderStudentHeaderAndStats();
          renderPracticeSection();
          const pracTab = document.getElementById('student-tab-practice');
          if (pracTab && typeof pracTab.scrollIntoView === 'function') {
            pracTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (typeof window.scrollTo === 'function') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      });
    }

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
                secScore += getPracticeItemPoints(item);
              }
            });
          } else if (sec.type === 'translation') {
            const items = (sec.data && sec.data.items) || [];
            items.forEach(function (item) {
              const pts = getPracticeItemPoints(item);
              const userVal = secAns[item.id] || '';
              if (item.mode === 'exact') {
                if (window.StudySnapStore.isAnswerMatch(userVal, item.accepted || [])) {
                  secScore += pts;
                }
              } else if (item.mode === 'keywords') {
                if (window.StudySnapStore.isKeywordsMatch(userVal, item.required_keywords || [])) {
                  secScore += pts;
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
                  secScore += Math.min(pts, Math.max(0, Number(existingSub.manual_grades[item.id].score || 0)));
                }
              }
            });
          } else if (sec.type === 'short_answer') {
            const items = (sec.data && sec.data.items) || [];
            items.forEach(function (item) {
              const pts = getPracticeItemPoints(item);
              const userVal = secAns[item.id] || '';
              const hasKey = Array.isArray(item.accepted) && item.accepted.length > 0;
              const isManual = item.mode === 'manual' || !hasKey;
              if (!isManual) {
                if (window.StudySnapStore.isAnswerMatch(userVal, item.accepted || [])) {
                  secScore += pts;
                }
              } else {
                hasManualQuestions = true;
                const existingSub = findStudentPracticeSubmission(exercise.exercise_id);
                if (
                  existingSub &&
                  existingSub.manual_grades &&
                  existingSub.manual_grades[item.id]
                ) {
                  secScore += Math.min(pts, Math.max(0, Number(existingSub.manual_grades[item.id].score || 0)));
                }
              }
            });
          }

          secScore = Math.round(secScore * 10) / 10;
          sectionScores[sec.section_id] = secScore;
          totalEarnedScore = Math.round((totalEarnedScore + secScore) * 10) / 10;
        });

        const ratingObj = window.StudySnapStore.calculateRating(
          totalEarnedScore,
          exercise.thresholds,
          exercise.total_score
        );
        const ratingKey = ratingObj && ratingObj.key ? ratingObj.key : 'needs_review';

        const newSubmission = {
          submission_id:
            'PRAC_' + student.student_id + '_' + exercise.exercise_id + '_' + Date.now(),
          exercise_id: exercise.exercise_id,
          student_id: student.student_id,
          student_name: student.full_name,
          total_score: totalEarnedScore,
          max_score: exercise.total_score || 35,
          rating: ratingKey,
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
          const finalSub = findStudentPracticeSubmission(exercise.exercise_id) || newSubmission;
          showToast(
            'Đã nộp bài tập thành công! Điểm số: ' +
              finalSub.total_score +
              '/' +
              (finalSub.max_score || exercise.total_score || 35) +
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
  // 4. TAB 3: ÔN TẬP TỪ VỰNG THEO BÀI, HSK 1–3 & NHIỆM VỤ ĐƯỢC GIAO
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
    const hskPrefixes = { 'hsk-1': 'HSK1_', 'hsk-2': 'HSK2_', 'hsk-3': 'HSK3_' };
    if (Object.prototype.hasOwnProperty.call(hskPrefixes, lessonKey)) {
      const bank = (window.StudySnapHskBanks && Array.isArray(window.StudySnapHskBanks[lessonKey]))
        ? window.StudySnapHskBanks[lessonKey]
        : [];
      const prefix = hskPrefixes[lessonKey];
      const masteredLevel = ui.masteredIds.filter(function (id) { return String(id).indexOf(prefix) === 0; }).length;
      return { masteredCount: masteredLevel, total: bank.length };
    }
    const targetList = vocabList.filter(function (v) { return String(v.lesson_id || '') === lessonKey; });
    const total = targetList.length;
    const masteredCount = targetList.filter(function (v) { return ui.masteredIds.indexOf(v.vocab_id) !== -1; }).length;
    return { masteredCount: masteredCount, total: total };
  }

  async function recordStudentVocabPracticeEvent(eventInfo) {
    const student = getActiveStudent();
    if (!eventInfo || !student || !window.StudySnapStore) return;
    const sourceKey = String(eventInfo.sourceKey || 'hsk-1').trim() || 'hsk-1';
    const sourceLabel = String(eventInfo.sourceLabel || sourceKey);
    const payloadScore = eventInfo.score !== undefined && eventInfo.score !== null ? String(eventInfo.score) : '';
    const mediaDur = String(eventInfo.media_duration || '');
    const noteStr = String(eventInfo.student_note || ('Luyện từ vựng: ' + sourceLabel));

    if (typeof window.StudySnapStore.recordVocabSourcePractice === 'function') {
      await window.StudySnapStore.recordVocabSourcePractice(state, {
        student_id: student.student_id,
        sourceKey: sourceKey,
        sourceLabel: sourceLabel,
        score: payloadScore,
        media_duration: mediaDur,
        student_note: noteStr
      });
    }

    const matchingTasks = getStudentVocabAssignments(student).filter(function (t) {
      return String(t.lesson_id || '') === sourceKey;
    });
    for (let i = 0; i < matchingTasks.length; i++) {
      await submitStudentVocabTaskProgress(matchingTasks[i], {
        score: payloadScore,
        media_duration: mediaDur,
        student_note: noteStr
      });
    }

    renderStudentHeaderAndStats();
    renderStudentAssignedVocabTasks();
    if (window.StudySnapVocabSuite && typeof window.StudySnapVocabSuite.render === 'function') {
      window.StudySnapVocabSuite.render(false);
    }
  }

  async function submitStudentVocabTaskProgress(task, opts, triggerBtn) {
    const student = getActiveStudent();
    if (!task || !student) return;
    const options = opts || {};
    const stats = computeMasteryStatsForLesson(task.lesson_id || 'hsk-1');
    const fallbackPct = stats.total > 0 ? Math.min(100, Math.round((stats.masteredCount / stats.total) * 100)) : 100;
    const existingSub = findVocabSubmissionForTask(task.assignment_id, student.student_id);
    const scoreStr = options.score !== undefined
      ? String(options.score)
      : (existingSub && existingSub.score !== undefined && existingSub.score !== '' ? '' : String(fallbackPct));
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
    const vocabPracticeStats = window.StudySnapStore && typeof window.StudySnapStore.getStudentVocabPracticeStats === 'function'
      ? window.StudySnapStore.getStudentVocabPracticeStats(state, student.student_id)
      : { byAssignment: {} };

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
          const lessonKey = task.lesson_id || 'hsk-1';
          const taskPracticeCount = Math.max(
            Number((vocabPracticeStats.byAssignment && vocabPracticeStats.byAssignment[task.assignment_id]) || 0) || 0,
            sub ? (Number(sub.practice_count || 0) || 1) : 0
          );
          const statusBadge = isDone
            ? '<span class="status-badge status-graded tabular-nums">Đã hoàn thành' + (sub.score ? ' · ' + escapeHtml(sub.score) + '%' : '') + '</span>'
            : '<span class="status-badge status-missing">Chưa hoàn thành</span>';
          const countChip =
            '<span class="vocab-practice-count-chip' + (taskPracticeCount > 0 ? ' is-active' : '') + ' tabular-nums">Đã luyện ' + taskPracticeCount + ' lần</span>';
          return (
            '<div class="vocab-assigned-card' + (isDone ? ' is-done' : '') + '">' +
              '<div class="vocab-assigned-card-top">' +
                '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                  '<span class="vlist-lesson-tag">' + escapeHtml(task.lesson_tag || 'Từ vựng') + '</span>' +
                  statusBadge +
                  countChip +
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
      getPracticeCounts: function () {
        if (window.StudySnapStore && typeof window.StudySnapStore.getStudentVocabPracticeStats === 'function') {
          return window.StudySnapStore.getStudentVocabPracticeStats(state, getActiveStudent().student_id);
        }
        return { totalCount: 0, bySource: {}, byAssignment: {} };
      },
      onToggleMastered: function (masteryKey) {
        toggleStudentVocabMastered(masteryKey);
      },
      onQuizComplete: async function (summary) {
        if (!summary) return;
        await recordStudentVocabPracticeEvent({
          sourceKey: summary.sourceKey,
          sourceLabel: summary.sourceLabel,
          score: summary.pct,
          media_duration: summary.correct + '/' + summary.total + ' câu',
          student_note: 'Hoàn thành Trắc nghiệm: ' + summary.correct + '/' + summary.total + ' câu (' + summary.pct + '%)'
        });
        showToast('Đã ghi nhận +1 lần luyện Trắc nghiệm (' + summary.pct + '%)!');
      },
      onStrokeComplete: async function (summary) {
        if (!summary) return;
        await recordStudentVocabPracticeEvent({
          sourceKey: summary.sourceKey,
          sourceLabel: summary.sourceLabel,
          score: '',
          media_duration: 'Viết chữ ' + summary.char,
          student_note: 'Hoàn thành Tập viết chữ "' + summary.char + '" (Sai ' + summary.mistakes + ' nét)'
        });
        showToast('Đã ghi nhận +1 lần tập viết chữ "' + summary.char + '"!');
      },
      onFlashcardCycleComplete: async function (summary) {
        if (!summary) return;
        await recordStudentVocabPracticeEvent({
          sourceKey: summary.sourceKey,
          sourceLabel: summary.sourceLabel,
          score: '',
          media_duration: summary.totalCards + ' thẻ Flashcard',
          student_note: 'Hoàn thành 1 lượt Flashcard (' + summary.totalCards + ' thẻ)'
        });
        showToast('Tuyệt vời! Đã ghi nhận +1 lần ôn Flashcard ("' + summary.sourceLabel + '")!');
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
        const practiceTarget = document.getElementById('student-practice-title');
        if (practiceTarget && typeof practiceTarget.scrollIntoView === 'function') {
          practiceTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    const btnGoVocabAll = document.getElementById('btn-banner-go-vocab-all');
    if (btnGoVocabAll) {
      btnGoVocabAll.addEventListener('click', function () {
        switchTab('vocabulary');
        if (window.StudySnapVocabSuite && typeof window.StudySnapVocabSuite.selectSource === 'function') {
          window.StudySnapVocabSuite.selectSource('hsk-1');
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

    const btnOpenChangePwd = document.getElementById('btn-student-change-password');
    const modalStudentPwd = document.getElementById('modal-student-change-password');
    const btnCloseStudentPwd = document.getElementById('btn-close-student-pwd-modal');
    const btnCancelStudentPwd = document.getElementById('btn-cancel-student-pwd-modal');
    const formStudentPwd = document.getElementById('student-change-password-form');

    function setStudentPwdModalOpen(open) {
      if (!modalStudentPwd) return;
      modalStudentPwd.classList.toggle('is-open', Boolean(open));
      modalStudentPwd.classList.toggle('is-visible', Boolean(open));
      if (open) {
        if (formStudentPwd) formStudentPwd.reset();
        const curInput = document.getElementById('student-current-password');
        if (curInput) setTimeout(function () { curInput.focus(); }, 40);
      }
    }

    if (btnOpenChangePwd && modalStudentPwd) {
      btnOpenChangePwd.addEventListener('click', function () {
        setStudentPwdModalOpen(true);
      });
    }
    if (btnCloseStudentPwd) {
      btnCloseStudentPwd.addEventListener('click', function () {
        setStudentPwdModalOpen(false);
      });
    }
    if (btnCancelStudentPwd) {
      btnCancelStudentPwd.addEventListener('click', function () {
        setStudentPwdModalOpen(false);
      });
    }
    if (modalStudentPwd) {
      modalStudentPwd.addEventListener('click', function (ev) {
        if (ev.target === modalStudentPwd) setStudentPwdModalOpen(false);
      });
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && modalStudentPwd.classList.contains('is-open')) {
          setStudentPwdModalOpen(false);
        }
      });
    }
    if (formStudentPwd) {
      formStudentPwd.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const curPwd = String((document.getElementById('student-current-password') || {}).value || '').trim();
        const newPwd = String((document.getElementById('student-new-password') || {}).value || '').trim();
        const confirmPwd = String((document.getElementById('student-confirm-password') || {}).value || '').trim();
        if (!curPwd || newPwd.length < 6) {
          showToast('Mật khẩu mới phải có tối thiểu 6 ký tự.');
          return;
        }
        if (newPwd !== confirmPwd) {
          showToast('Mật khẩu xác nhận không khớp với mật khẩu mới.');
          return;
        }
        const submitBtn = document.getElementById('btn-submit-student-change-pwd');
        const stu = getActiveStudent();
        const doChange = async function () {
          return await window.StudySnapStore.syncPostToGas(state, {
            action: 'changePassword',
            role: 'student',
            user_id: stu.student_id,
            current_password: curPwd,
            new_password: newPwd
          });
        };
        const res = window.StudySnapLoading && submitBtn
          ? await window.StudySnapLoading.withButtonLoading(submitBtn, 'Đang cập nhật...', doChange)
          : await doChange();
        if (!res || !res.ok) {
          showToast((res && res.error) || 'Không thể đổi mật khẩu lúc này.');
          return;
        }
        setStudentPwdModalOpen(false);
        showToast('Đã cập nhật mật khẩu đăng nhập thành công!');
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

    if (
      window.StudySnapStore.getGasUrl() ||
      (window.StudySnapAuth && typeof window.StudySnapAuth.isHttpRuntime === 'function' && window.StudySnapAuth.isHttpRuntime())
    ) {
      window.StudySnapStore.fetchBootstrapFromGas(state).then(function (remoteRes) {
        state = window.StudySnapStore.loadState();
        if (remoteRes && remoteRes.sessionExpired) {
          return;
        }
        if (remoteRes && remoteRes.ok && remoteRes.data) {
          const isPreview = window.StudySnapAuth && typeof window.StudySnapAuth.isPreviewAllowed === 'function'
            ? window.StudySnapAuth.isPreviewAllowed()
            : false;
          if (!isPreview && !window.StudySnapAuth.revalidateActiveSession(state)) {
            if (window.StudySnapAuth && typeof window.StudySnapAuth.handleSessionExpired === 'function') {
              window.StudySnapAuth.handleSessionExpired();
            } else {
              window.location.replace('index.html?session=expired');
            }
            return;
          }
        }
        renderAll();
      });
    }
  });
})();
