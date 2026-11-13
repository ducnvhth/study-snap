/**
 * StudySnap Vocabulary Learning Suite
 * Đồng bộ 4 chế độ: Flashcard 3D, Trắc nghiệm (Quiz), Tập viết nét chữ (HanziWriter), Bảng tra cứu 272 từ.
 * Dùng chung cho cả Cổng Học Sinh (student.html) và Cổng Giáo Viên (teacher.html).
 */
(function () {
  'use strict';

  const VOCAB_DATA = (window.StudySnapVocabList && window.StudySnapVocabList.length > 0)
    ? window.StudySnapVocabList
    : [
        ["老师","lǎoshī","Giáo viên"],
        ["学生","xuésheng","Học sinh"],
        ["留学","liúxué","Du học"],
        ["留学生","liúxuéshēng","Du học sinh"],
        ["同屋","tóng wū","Bạn cùng phòng"],
        ["同事","tóngshì","Đồng nghiệp"],
        ["什么","shénme","Cái gì"],
        ["名字","míngzi","Tên"],
        ["叫","jiào","Gọi, kêu"],
        ["谁","shéi","Ai"],
        ["学","xué","Học"],
        ["汉语","Hànyǔ","Tiếng Trung (Hán ngữ)"]
      ];

  const vocabState = {
    activeSubTab: 'flashcard',
    // Flashcard
    fcIdx: 0,
    fcOrder: [],
    fcFlipped: false,
    // Quiz
    quizList: [],
    quizIdx: 0,
    quizCorrect: 0,
    quizWrong: 0,
    quizAnswered: false,
    quizCurr: null,
    quizIsZH: true,
    // Stroke
    strokeInited: false,
    hwInstance: null,
    curChar: '学',
    curPy: 'xué',
    curMean: 'Học, học tập'
  };

  function escapeHtml(str) {
    return String(str === undefined || str === null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function shuffleArray(arr) {
    const b = arr.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = b[i];
      b[i] = b[j];
      b[j] = temp;
    }
    return b;
  }

  function speakChineseText(text) {
    if (!text) return;
    if (window.StudySnapAudio && typeof window.StudySnapAudio.speakText === 'function') {
      window.StudySnapAudio.speakText(text, 'zh-CN');
    } else if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  }

  // ===== SUBTAB SWITCHER =====
  function switchVocabSubTab(targetId) {
    vocabState.activeSubTab = targetId;
    document.querySelectorAll('.vocab-subtab').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-vsub') === targetId);
    });
    document.querySelectorAll('.vocab-panel').forEach(function (p) {
      p.classList.remove('is-active');
    });
    const activePanel = document.getElementById('vpanel-' + targetId);
    if (activePanel) activePanel.classList.add('is-active');

    if (targetId === 'stroke' && !vocabState.strokeInited) {
      initStrokeWriter();
    }
    if (targetId === 'list') {
      renderFullVocabList();
    }
  }

  // ===== 1. FLASHCARD 3D =====
  function fcReset() {
    vocabState.fcIdx = 0;
    vocabState.fcFlipped = false;
    vocabState.fcOrder = VOCAB_DATA.map(function (_, i) { return i; });
    const orderSelect = document.getElementById('fc-order-select');
    if (orderSelect && orderSelect.value === 'rand') {
      vocabState.fcOrder = shuffleArray(vocabState.fcOrder);
    }
    fcRender();
  }

  function fcRender() {
    if (!VOCAB_DATA.length) return;
    const v = VOCAB_DATA[vocabState.fcOrder[vocabState.fcIdx]] || VOCAB_DATA[0];
    const cardEl = document.getElementById('fc-3d-card');
    const barEl = document.getElementById('fc-progress-bar');
    const labelEl = document.getElementById('fc-progress-label');
    const frontStt = document.getElementById('fc-front-stt');
    const frontMain = document.getElementById('fc-front-main-text');
    const backHanzi = document.getElementById('fc-back-hanzi-text');
    const backPinyin = document.getElementById('fc-back-pinyin-text');
    const backMeaning = document.getElementById('fc-back-meaning-text');
    const prevBtn = document.getElementById('btn-fc-prev-card');
    const nextBtn = document.getElementById('btn-fc-next-card');
    const sideSelect = document.getElementById('fc-side-select');
    const side = sideSelect ? sideSelect.value : 'zh';

    if (cardEl) {
      cardEl.classList.toggle('is-flipped', vocabState.fcFlipped);
    }
    const pct = Math.round(((vocabState.fcIdx + 1) / VOCAB_DATA.length) * 100);
    if (barEl) barEl.style.width = pct + '%';
    if (labelEl) labelEl.textContent = (vocabState.fcIdx + 1) + ' / ' + VOCAB_DATA.length;
    if (frontStt) frontStt.textContent = '#' + (vocabState.fcOrder[vocabState.fcIdx] + 1);

    if (frontMain) {
      if (side === 'zh') {
        frontMain.textContent = v[0];
        frontMain.style.fontSize = v[0].length > 3 ? '2rem' : '2.5rem';
      } else {
        frontMain.textContent = v[2];
        frontMain.style.fontSize = '1.5rem';
      }
    }
    if (backHanzi) backHanzi.textContent = v[0];
    if (backPinyin) backPinyin.textContent = v[1];
    if (backMeaning) backMeaning.textContent = v[2];

    if (prevBtn) prevBtn.disabled = vocabState.fcIdx === 0;
    if (nextBtn) {
      nextBtn.textContent = vocabState.fcIdx === VOCAB_DATA.length - 1 ? '🎉 Hoàn thành' : 'Tiếp theo →';
    }
  }

  function fcFlip() {
    vocabState.fcFlipped = !vocabState.fcFlipped;
    const cardEl = document.getElementById('fc-3d-card');
    if (cardEl) cardEl.classList.toggle('is-flipped', vocabState.fcFlipped);
  }

  function fcNext() {
    if (vocabState.fcIdx < VOCAB_DATA.length - 1) {
      vocabState.fcIdx++;
      vocabState.fcFlipped = false;
      fcRender();
    }
  }

  function fcPrev() {
    if (vocabState.fcIdx > 0) {
      vocabState.fcIdx--;
      vocabState.fcFlipped = false;
      fcRender();
    }
  }

  function fcSpeakCurrent() {
    const v = VOCAB_DATA[vocabState.fcOrder[vocabState.fcIdx]];
    if (v) speakChineseText(v[0]);
  }

  function fcGoStroke() {
    const v = VOCAB_DATA[vocabState.fcOrder[vocabState.fcIdx]];
    if (!v) return;
    switchVocabSubTab('stroke');
    setTimeout(function () {
      strokeSetChar(v[0], v[1], v[2]);
    }, 120);
  }

  // ===== 2. QUIZ (TRẮC NGHIỆM) =====
  function quizStartGame() {
    const countSelect = document.getElementById('quiz-count-select');
    const totalVal = countSelect ? countSelect.value : '20';
    const total = totalVal === 'all' ? VOCAB_DATA.length : parseInt(totalVal, 10);
    vocabState.quizList = shuffleArray(VOCAB_DATA).slice(0, Math.min(total, VOCAB_DATA.length));
    vocabState.quizIdx = 0;
    vocabState.quizCorrect = 0;
    vocabState.quizWrong = 0;

    const resultView = document.getElementById('quiz-result-view');
    const activeBlock = document.getElementById('quiz-active-block');
    if (resultView) resultView.style.display = 'none';
    if (activeBlock) activeBlock.style.display = 'block';
    quizRenderQuestion();
  }

  function quizRenderQuestion() {
    if (vocabState.quizIdx >= vocabState.quizList.length) {
      quizShowResult();
      return;
    }
    vocabState.quizAnswered = false;
    vocabState.quizCurr = vocabState.quizList[vocabState.quizIdx];
    const modeSelect = document.getElementById('quiz-mode-select');
    const mode = modeSelect ? modeSelect.value : 'zh2vi';
    vocabState.quizIsZH = mode === 'zh2vi' || (mode === 'mixed' && Math.random() > 0.5);

    const cEl = document.getElementById('quiz-stat-correct');
    const wEl = document.getElementById('quiz-stat-wrong');
    const tEl = document.getElementById('quiz-stat-total');
    const counterText = document.getElementById('quiz-counter-text');
    const barEl = document.getElementById('quiz-progress-bar');
    const fb = document.getElementById('quiz-feedback-box');
    const nextBtn = document.getElementById('btn-quiz-next-question');

    if (cEl) cEl.textContent = 'Đúng: ' + vocabState.quizCorrect;
    if (wEl) wEl.textContent = 'Sai: ' + vocabState.quizWrong;
    if (tEl) tEl.textContent = 'Đã làm: ' + vocabState.quizIdx;
    if (counterText) counterText.textContent = (vocabState.quizIdx + 1) + ' / ' + vocabState.quizList.length;
    if (barEl) barEl.style.width = Math.round((vocabState.quizIdx / vocabState.quizList.length) * 100) + '%';
    if (fb) { fb.textContent = ''; fb.style.color = 'inherit'; }
    if (nextBtn) nextBtn.style.display = 'none';

    const qMain = document.getElementById('quiz-main-question');
    const qPinyin = document.getElementById('quiz-pinyin-question');
    const qAsk = document.getElementById('quiz-ask-direction');

    if (vocabState.quizIsZH) {
      if (qMain) qMain.textContent = vocabState.quizCurr[0];
      if (qPinyin) qPinyin.textContent = vocabState.quizCurr[1];
      if (qAsk) qAsk.textContent = 'Chọn nghĩa tiếng Việt chính xác:';
    } else {
      if (qMain) qMain.textContent = vocabState.quizCurr[2];
      if (qPinyin) qPinyin.textContent = vocabState.quizCurr[1];
      if (qAsk) qAsk.textContent = 'Chọn chữ Hán tương ứng đúng:';
    }

    const others = shuffleArray(VOCAB_DATA.filter(function (v) { return v !== vocabState.quizCurr; })).slice(0, 3);
    const opts = shuffleArray([vocabState.quizCurr].concat(others));
    const letters = ['A', 'B', 'C', 'D'];
    const container = document.getElementById('quiz-options-container');

    if (container) {
      container.innerHTML = opts.map(function (o, i) {
        const val = vocabState.quizIsZH ? o[2] : o[0];
        const isCor = o === vocabState.quizCurr;
        return (
          '<button type="button" class="option-card" data-quiz-opt="' + i + '" data-is-correct="' + isCor + '" style="padding:14px;border-radius:var(--radius-lg);">' +
            '<span class="option-letter">' + letters[i] + '</span>' +
            '<span class="option-text" style="font-weight:700;">' + escapeHtml(val) + '</span>' +
          '</button>'
        );
      }).join('');

      container.querySelectorAll('.option-card').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const isCorrect = btn.getAttribute('data-is-correct') === 'true';
          quizAnswerSelected(btn, isCorrect);
        });
      });
    }
  }

  function quizAnswerSelected(btn, isCorrect) {
    if (vocabState.quizAnswered) return;
    vocabState.quizAnswered = true;

    document.querySelectorAll('.option-card').forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute('data-is-correct') === 'true') {
        b.classList.add('is-selected');
        b.style.borderColor = 'var(--color-success)';
        b.style.background = 'var(--color-success-bg)';
      }
    });

    const fb = document.getElementById('quiz-feedback-box');
    const nextBtn = document.getElementById('btn-quiz-next-question');

    if (isCorrect) {
      vocabState.quizCorrect++;
      if (fb) {
        fb.textContent = '✓ Chính xác! ' + vocabState.quizCurr[0] + ' (' + vocabState.quizCurr[1] + ') : ' + vocabState.quizCurr[2];
        fb.style.color = 'var(--color-success)';
      }
    } else {
      vocabState.quizWrong++;
      btn.style.borderColor = 'var(--color-destructive)';
      btn.style.background = 'var(--color-destructive-bg)';
      if (fb) {
        fb.textContent = '✗ Sai! Đáp án đúng: ' + vocabState.quizCurr[0] + ' (' + vocabState.quizCurr[1] + ') : ' + vocabState.quizCurr[2];
        fb.style.color = 'var(--color-destructive)';
      }
    }

    if (nextBtn) nextBtn.style.display = 'inline-flex';
    speakChineseText(vocabState.quizCurr[0]);

    setTimeout(function () {
      if (vocabState.quizIdx < vocabState.quizList.length - 1) {
        vocabState.quizIdx++;
        quizRenderQuestion();
      }
    }, 1800);
  }

  function quizShowResult() {
    const activeBlock = document.getElementById('quiz-active-block');
    const resultView = document.getElementById('quiz-result-view');
    if (activeBlock) activeBlock.style.display = 'none';
    if (resultView) {
      resultView.style.display = 'block';
      const pct = Math.round((vocabState.quizCorrect / vocabState.quizList.length) * 100);
      const pctEl = document.getElementById('quiz-result-percent');
      const titleEl = document.getElementById('quiz-result-title');
      const descEl = document.getElementById('quiz-result-desc');

      if (pctEl) pctEl.textContent = pct + '%';
      if (titleEl) {
        titleEl.textContent = pct >= 80 ? '🎉 Xuất sắc!' : (pct >= 60 ? '👍 Khá tốt!' : '📚 Cần ôn luyện thêm!');
      }
      if (descEl) {
        descEl.textContent = 'Bạn đã trả lời đúng ' + vocabState.quizCorrect + ' / ' + vocabState.quizList.length + ' câu (' + pct + '%). ' +
          (pct >= 80 ? 'Bạn đã nắm rất vững từ vựng bài học này!' : 'Hãy lật lại thẻ Flashcard 3D và thử làm lại nhé!');
      }
    }
  }

  // ===== 3. STROKE PRACTICE (HANZI WRITER) =====
  function initStrokeWriter() {
    vocabState.strokeInited = true;
    const canvasWrap = document.getElementById('hanzi-writer-canvas');
    if (canvasWrap && window.HanziWriter) {
      try {
        canvasWrap.innerHTML = '';
        vocabState.hwInstance = window.HanziWriter.create('hanzi-writer-canvas', '学', {
          width: 220,
          height: 220,
          padding: 10,
          showOutline: true,
          strokeColor: '#FF6B9D',
          outlineColor: '#FFD6E5',
          drawingColor: '#2D1B4E',
          drawingWidth: 5,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 60
        });
      } catch (err) {
        console.warn('HanziWriter init error:', err);
      }
    }
    renderStrokeGrid(VOCAB_DATA);
    strokeSetChar('学', 'xué', 'Học, học tập');
  }

  function strokeSetChar(zh, py, vi) {
    vocabState.curChar = zh[0] || '学';
    vocabState.curPy = py || '';
    vocabState.curMean = vi || '';

    const charHeading = document.getElementById('stroke-active-char');
    const pinyinText = document.getElementById('stroke-active-pinyin');
    const meanText = document.getElementById('stroke-active-meaning');
    const statusText = document.getElementById('stroke-feedback-status');

    if (charHeading) charHeading.textContent = zh;
    if (pinyinText) pinyinText.textContent = py;
    if (meanText) meanText.textContent = vi;
    if (statusText) statusText.textContent = '';

    if (vocabState.hwInstance) {
      try {
        vocabState.hwInstance.setCharacter(vocabState.curChar);
        vocabState.hwInstance.showCharacter();
      } catch (e) {}
    }
  }

  function renderStrokeGrid(list) {
    const grid = document.getElementById('stroke-quick-chips');
    if (!grid) return;
    grid.innerHTML = list.slice(0, 160).map(function (v) {
      const zh = escapeHtml(v[0]);
      const py = escapeHtml(v[1].split(' ')[0] || '');
      const vi = escapeHtml(v[2]);
      return (
        '<button type="button" class="stroke-chip-btn" data-zh="' + zh + '" data-py="' + py + '" data-vi="' + vi + '">' +
          '<span class="stroke-chip-zh">' + v[0][0] + '</span>' +
          '<span class="stroke-chip-py">' + py + '</span>' +
        '</button>'
      );
    }).join('');

    grid.querySelectorAll('.stroke-chip-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        grid.querySelectorAll('.stroke-chip-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        strokeSetChar(btn.getAttribute('data-zh'), btn.getAttribute('data-py'), btn.getAttribute('data-vi'));
      });
    });
  }

  function filterStrokeGrid() {
    const input = document.getElementById('stroke-search-input');
    const q = input ? input.value.trim().toLowerCase() : '';
    const filtered = q
      ? VOCAB_DATA.filter(function (v) {
          return v[0].includes(q) || v[1].toLowerCase().includes(q) || v[2].toLowerCase().includes(q);
        })
      : VOCAB_DATA;
    renderStrokeGrid(filtered);
  }

  function strokeSearchAction() {
    const input = document.getElementById('stroke-search-input');
    const q = input ? input.value.trim() : '';
    if (!q) return;
    const v = VOCAB_DATA.find(function (x) {
      return x[0].startsWith(q) || x[0] === q || x[1].toLowerCase().includes(q.toLowerCase()) || x[2].toLowerCase().includes(q.toLowerCase());
    });
    if (v) {
      strokeSetChar(v[0], v[1], v[2]);
    } else if (q.length > 0) {
      strokeSetChar(q, '-', '-');
    }
  }

  function strokeAnimateAction() {
    if (!vocabState.hwInstance) return;
    const st = document.getElementById('stroke-feedback-status');
    if (st) st.textContent = 'Đang trình chiếu thứ tự các nét viết...';
    try {
      vocabState.hwInstance.animateCharacter({
        onComplete: function () {
          if (st) st.textContent = 'Hoàn thành xem nét!';
        }
      });
    } catch (e) {}
  }

  function strokeQuizAction() {
    if (!vocabState.hwInstance) return;
    const st = document.getElementById('stroke-feedback-status');
    if (st) st.textContent = 'Hãy dùng chuột hoặc ngón tay viết từng nét vào khung...';
    try {
      vocabState.hwInstance.quiz({
        onMistake: function (d) {
          if (st) st.textContent = '❌ Nét chưa đúng! Hãy thử lại nét ' + d.strokeNum + ' / ' + d.totalStrokes;
        },
        onCorrectStroke: function (d) {
          if (st) st.textContent = '✓ Đúng nét ' + d.strokeNum + ' / ' + d.totalStrokes + '! Tiếp tục...';
        },
        onComplete: function () {
          if (st) st.textContent = '🎉 Viết hoàn thành! Rất chuẩn xác!';
        }
      });
    } catch (e) {
      if (st) st.textContent = 'Ký tự này chưa có dữ liệu nét. Hãy thử ký tự khác!';
    }
  }

  // ===== 4. LIST (TRA CỨU BẢNG 272 TỪ) =====
  function renderFullVocabList() {
    const input = document.getElementById('vlist-search-input');
    const q = input ? input.value.trim().toLowerCase() : '';
    const rangeSelect = document.getElementById('vlist-range-select');
    const range = rangeSelect ? rangeSelect.value : 'all';

    let list = VOCAB_DATA;
    if (range !== 'all') {
      const parts = range.split('-').map(Number);
      list = VOCAB_DATA.slice(parts[0] - 1, parts[1]);
    }
    if (q) {
      list = list.filter(function (v) {
        return v[0].includes(q) || v[1].toLowerCase().includes(q) || v[2].toLowerCase().includes(q);
      });
    }

    const countBadge = document.getElementById('vlist-count-badge');
    if (countBadge) countBadge.textContent = 'Hiển thị ' + list.length + ' từ';

    const tbody = document.getElementById('vlist-table-body');
    if (!tbody) return;

    tbody.innerHTML = list.map(function (v, idx) {
      const globalIdx = VOCAB_DATA.indexOf(v) + 1;
      const zh = escapeHtml(v[0]);
      const py = escapeHtml(v[1]);
      const vi = escapeHtml(v[2]);
      return (
        '<tr>' +
          '<td class="tabular-nums font-bold" style="color:var(--color-muted-foreground);">' + globalIdx + '</td>' +
          '<td>' +
            '<button type="button" class="btn-input-action" data-list-stroke="' + globalIdx + '" style="font-size:1.25rem;font-weight:700;color:var(--color-primary);border:none;background:transparent;cursor:pointer;" title="Nhấn để xem tập viết nét chữ">' +
              zh +
            '</button>' +
          '</td>' +
          '<td>' +
            '<div style="font-weight:700;color:var(--color-foreground);">' + vi + '</div>' +
            '<div class="tabular-nums" style="font-size:0.8125rem;color:var(--color-muted-foreground);margin-top:2px;">' + py + '</div>' +
          '</td>' +
          '<td style="text-align:center;">' +
            '<div style="display:inline-flex;gap:6px;">' +
              '<button type="button" class="btn btn-outline btn-sm" data-list-speak="' + zh + '" title="Nghe phát âm" style="padding:4px 8px;">🔊</button>' +
              '<button type="button" class="btn btn-outline btn-sm" data-list-goto-stroke="' + globalIdx + '" title="Tập viết" style="padding:4px 8px;">✍️</button>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    }).join('');

    tbody.querySelectorAll('[data-list-speak]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        speakChineseText(btn.getAttribute('data-list-speak'));
      });
    });

    tbody.querySelectorAll('[data-list-stroke], [data-list-goto-stroke]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const idx = parseInt(btn.getAttribute('data-list-stroke') || btn.getAttribute('data-list-goto-stroke'), 10) - 1;
        const v = VOCAB_DATA[idx];
        if (v) {
          switchVocabSubTab('stroke');
          setTimeout(function () {
            strokeSetChar(v[0], v[1], v[2]);
          }, 120);
        }
      });
    });
  }

  function renderVocabSuite() {
    const totalBadge = document.getElementById('vocab-total-badge');
    if (totalBadge) totalBadge.textContent = VOCAB_DATA.length + ' từ vựng';

    fcRender();
    if (vocabState.activeSubTab === 'quiz') quizRenderQuestion();
    if (vocabState.activeSubTab === 'stroke' && !vocabState.strokeInited) initStrokeWriter();
    if (vocabState.activeSubTab === 'list') renderFullVocabList();
  }

  function initVocabSuite() {
    // Subnav switching
    document.querySelectorAll('.vocab-subtab').forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        const sub = tabBtn.getAttribute('data-vsub');
        if (sub) switchVocabSubTab(sub);
      });
    });

    // 1. Flashcard events
    const cardWrap = document.getElementById('fc-3d-card-wrap');
    if (cardWrap) {
      cardWrap.addEventListener('click', fcFlip);
      cardWrap.addEventListener('keydown', function (e) {
        if (e.code === 'Space') { e.preventDefault(); fcFlip(); }
      });
    }

    const prevCard = document.getElementById('btn-fc-prev-card');
    if (prevCard) prevCard.addEventListener('click', fcPrev);

    const nextCard = document.getElementById('btn-fc-next-card');
    if (nextCard) nextCard.addEventListener('click', fcNext);

    const speakWord = document.getElementById('btn-fc-speak-word');
    if (speakWord) speakWord.addEventListener('click', fcSpeakCurrent);

    const goStroke = document.getElementById('btn-fc-go-stroke');
    if (goStroke) goStroke.addEventListener('click', fcGoStroke);

    const resetCard = document.getElementById('btn-fc-reset');
    if (resetCard) resetCard.addEventListener('click', fcReset);

    const orderSelect = document.getElementById('fc-order-select');
    if (orderSelect) orderSelect.addEventListener('change', fcReset);

    const sideSelect = document.getElementById('fc-side-select');
    if (sideSelect) sideSelect.addEventListener('change', fcRender);

    // 2. Quiz events
    const restartQuiz = document.getElementById('btn-quiz-restart');
    if (restartQuiz) restartQuiz.addEventListener('click', quizStartGame);

    const tryAgainQuiz = document.getElementById('btn-quiz-try-again');
    if (tryAgainQuiz) tryAgainQuiz.addEventListener('click', quizStartGame);

    const nextQuiz = document.getElementById('btn-quiz-next-question');
    if (nextQuiz) {
      nextQuiz.addEventListener('click', function () {
        vocabState.quizIdx++;
        quizRenderQuestion();
      });
    }

    const speakQuizQ = document.getElementById('btn-quiz-speak-question');
    if (speakQuizQ) {
      speakQuizQ.addEventListener('click', function () {
        if (vocabState.quizCurr) speakChineseText(vocabState.quizCurr[0]);
      });
    }

    const quizModeSelect = document.getElementById('quiz-mode-select');
    if (quizModeSelect) quizModeSelect.addEventListener('change', quizStartGame);

    const quizCountSelect = document.getElementById('quiz-count-select');
    if (quizCountSelect) quizCountSelect.addEventListener('change', quizStartGame);

    // 3. Stroke events
    const strokeSearchActionBtn = document.getElementById('btn-stroke-search-action');
    if (strokeSearchActionBtn) strokeSearchActionBtn.addEventListener('click', strokeSearchAction);

    const strokeSearchInput = document.getElementById('stroke-search-input');
    if (strokeSearchInput) {
      strokeSearchInput.addEventListener('input', filterStrokeGrid);
      strokeSearchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') strokeSearchAction();
      });
    }

    const strokeAnimBtn = document.getElementById('btn-stroke-animate');
    if (strokeAnimBtn) strokeAnimBtn.addEventListener('click', strokeAnimateAction);

    const strokeQuizBtn = document.getElementById('btn-stroke-quiz');
    if (strokeQuizBtn) strokeQuizBtn.addEventListener('click', strokeQuizAction);

    const strokeSpeakBtn = document.getElementById('btn-stroke-speak');
    if (strokeSpeakBtn) strokeSpeakBtn.addEventListener('click', function () {
      speakChineseText(vocabState.curChar);
    });

    // 4. List events
    const vlistSearch = document.getElementById('vlist-search-input');
    if (vlistSearch) vlistSearch.addEventListener('input', renderFullVocabList);

    const vlistRange = document.getElementById('vlist-range-select');
    if (vlistRange) vlistRange.addEventListener('change', renderFullVocabList);

    // Initial setups
    fcReset();
    quizStartGame();
  }

  // Export
  window.StudySnapVocabSuite = {
    init: initVocabSuite,
    render: renderVocabSuite,
    switchSubTab: switchVocabSubTab
  };

  document.addEventListener('DOMContentLoaded', function () {
    initVocabSuite();
    renderVocabSuite();
  });
})();

