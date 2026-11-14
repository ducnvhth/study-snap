/* ==========================================================================
   StudySnap — Shared 4-Mode Interactive Vocabulary Engine
   Supports: Lesson Vocabulary (state.vocabulary), "Tổng hợp theo bài",
   "Kho 272 từ HSK" (StudySnapVocabList), and "HSK 1-3 (3.0)" (StudySnapHskBanks).
   ========================================================================== */

(function () {
  const HSK_LEVEL_KEYS = ['hsk-1', 'hsk-2', 'hsk-3'];
  const HSK_LEVEL_META = {
    'hsk-1': {
      key: 'hsk-1',
      label: 'HSK 1 (3.0)',
      title: 'Từ vựng HSK 1 (Giáo trình 3.0)',
      badgeLabel: 'HSK 1',
      prefix: 'HSK1_',
      pillClass: 'is-hsk-bank is-hsk-level-1'
    },
    'hsk-2': {
      key: 'hsk-2',
      label: 'HSK 2 (3.0)',
      title: 'Từ vựng HSK 2 (Giáo trình 3.0)',
      badgeLabel: 'HSK 2',
      prefix: 'HSK2_',
      pillClass: 'is-hsk-bank is-hsk-level-2'
    },
    'hsk-3': {
      key: 'hsk-3',
      label: 'HSK 3 (3.0)',
      title: 'Từ vựng HSK 3 (Giáo trình 3.0)',
      badgeLabel: 'HSK 3',
      prefix: 'HSK3_',
      pillClass: 'is-hsk-bank is-hsk-level-3'
    }
  };

  function isHskLevelKey(key) {
    return Object.prototype.hasOwnProperty.call(HSK_LEVEL_META, String(key || '').trim());
  }

  function isBuiltInBankKey(key) {
    const k = String(key || '').trim();
    return k === 'hsk-272' || isHskLevelKey(k);
  }

  function defaultGetHskRawList() {
    return (typeof window !== 'undefined' && Array.isArray(window.StudySnapVocabList))
      ? window.StudySnapVocabList
      : [];
  }

  function defaultGetHskLevelRawList(levelKey) {
    return (
      typeof window !== 'undefined' &&
      window.StudySnapHskBanks &&
      Array.isArray(window.StudySnapHskBanks[levelKey])
    )
      ? window.StudySnapHskBanks[levelKey]
      : [];
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function extractHanziChars(word) {
    const matches = String(word || '').match(/[\u4E00-\u9FFF]/g);
    return matches && matches.length > 0 ? matches : [];
  }

  function normalizeLessonSortWeight(lessonId, title) {
    const m = String(title || lessonId || '').match(/\d+/);
    if (m) return parseInt(m[0], 10);
    return 9999;
  }

  function formatShortLessonLabel(lessonId, title) {
    const raw = String(title || lessonId || '').trim();
    const match = raw.match(/^(Bài\s*\d+)/i);
    if (match) return match[1];
    if (raw.length > 20) return raw.slice(0, 19) + '…';
    return raw || String(lessonId || 'Bài học');
  }

  function speakChineseWord(text) {
    const clean = String(text || '').trim();
    if (!clean) return;
    if (window.StudySnapAudio && typeof window.StudySnapAudio.speakText === 'function') {
      window.StudySnapAudio.speakText(clean, 'zh-CN');
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'zh-CN';
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  }

  const ICON_SPEAK =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
  const ICON_STROKE =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19 7-7 3 3-7 7-3-3z"></path><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>';
  const ICON_CHECK =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  const ICON_TRASH =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
  const ICON_BOOK =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';

  const adapter = {
    isTeacher: false,
    getLessons: null,
    getVocabularyItems: null,
    getHskItems: null,
    getMasteredIds: null,
    getPracticeCounts: null,
    onToggleMastered: null,
    onDeleteVocab: null,
    onQuizComplete: null,
    onStrokeComplete: null,
    onFlashcardCycleComplete: null,
    onSourceChange: null,
    onRequestAddVocab: null
  };

  const vs = {
    sourceKey: '',
    hskLessonFilter: 'all',
    masteryFilter: 'all',
    subTab: 'flashcard',
    fcOrder: [],
    fcIdx: 0,
    fcSide: 'zh',
    quizSessionToken: 0,
    quizAutoTimer: null,
    quizList: [],
    quizIdx: 0,
    quizCorrect: 0,
    quizWrong: 0,
    quizAnswered: false,
    quizCurr: null,
    quizCompletionReported: false,
    strokeWordItem: null,
    strokeChar: '',
    strokeCharIdx: 0,
    writerInstance: null,
    eventsBound: false
  };

  function getLessonVocabItemsNormalized() {
    let raw = [];
    if (typeof adapter.getVocabularyItems === 'function') {
      raw = adapter.getVocabularyItems() || [];
    } else if (typeof window !== 'undefined' && window.STUDYSNAP_INITIAL_DATA && Array.isArray(window.STUDYSNAP_INITIAL_DATA.vocabulary)) {
      raw = window.STUDYSNAP_INITIAL_DATA.vocabulary;
    }
    return raw.map(function (v, idx) {
      const lid = String(v.lesson_id || 'bai-1').trim() || 'bai-1';
      const lTitle = String(v.lesson_title || '').trim() || formatShortLessonLabel(lid, lid);
      const wid = String(v.vocab_id || ('V_LOCAL_' + idx)).trim();
      return {
        vocab_id: wid,
        mastery_key: wid,
        lesson_id: lid,
        lesson_title: lTitle,
        lesson_short: formatShortLessonLabel(lid, lTitle),
        word: String(v.word || '').trim(),
        pinyin: String(v.ipa || v.pinyin || '').trim(),
        part_of_speech: String(v.part_of_speech || '').trim(),
        meaning: String(v.meaning_vi || v.meaning || '').trim(),
        example: String(v.example_en || v.example || '').trim(),
        example_vi: String(v.example_vi || '').trim(),
        isCustom: true,
        sourceIndex: idx + 1
      };
    }).filter(function (item) {
      return item.word && item.meaning;
    });
  }

  function getHskItemsNormalized() {
    const raw = typeof adapter.getHskItems === 'function'
      ? (adapter.getHskItems() || [])
      : defaultGetHskRawList();
    return raw.map(function (row, idx) {
      if (Array.isArray(row)) {
        const w = String(row[0] || '').trim();
        return {
          vocab_id: 'HSK272_' + (idx + 1),
          mastery_key: 'HSK272_' + w,
          lesson_id: 'hsk-272',
          lesson_title: 'Kho 272 từ HSK',
          lesson_short: 'HSK 272',
          word: w,
          pinyin: String(row[1] || '').trim(),
          part_of_speech: '',
          meaning: String(row[2] || '').trim(),
          example: '',
          example_vi: '',
          isCustom: false,
          sourceIndex: idx + 1
        };
      }
      const wObj = String((row && (row.word || row[0])) || '').trim();
      return {
        vocab_id: 'HSK272_' + (idx + 1),
        mastery_key: 'HSK272_' + wObj,
        lesson_id: 'hsk-272',
        lesson_title: 'Kho 272 từ HSK',
        lesson_short: 'HSK 272',
        word: wObj,
        pinyin: String((row && (row.ipa || row.pinyin || row[1])) || '').trim(),
        part_of_speech: String((row && row.part_of_speech) || '').trim(),
        meaning: String((row && (row.meaning_vi || row.meaning || row[2])) || '').trim(),
        example: '',
        example_vi: '',
        isCustom: false,
        sourceIndex: idx + 1
      };
    }).filter(function (item) {
      return item.word && item.meaning;
    });
  }

  function getHskLevelItemsNormalized(levelKey) {
    const meta = HSK_LEVEL_META[levelKey];
    if (!meta) return [];
    const raw = defaultGetHskLevelRawList(levelKey);
    const wordCounts = {};
    raw.forEach(function (row) {
      const w = Array.isArray(row) ? String(row[0] || '').trim() : String((row && (row.word || row[0])) || '').trim();
      if (w) wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
    return raw.map(function (row, idx) {
      const isArr = Array.isArray(row);
      const w = isArr ? String(row[0] || '').trim() : String((row && (row.word || row[0])) || '').trim();
      const pinyin = isArr ? String(row[1] || '').trim() : String((row && (row.ipa || row.pinyin || row[1])) || '').trim();
      const meaning = isArr ? String(row[2] || '').trim() : String((row && (row.meaning_vi || row.meaning || row[2])) || '').trim();
      const pos = isArr ? String(row[3] || '').trim() : String((row && (row.part_of_speech || row[3])) || '').trim();
      const rawLesson = isArr ? row[4] : (row && (row.lesson || row.lesson_num || row[4]));
      const lessonNum = parseInt(rawLesson, 10) || 1;
      const isDupWord = (wordCounts[w] || 0) > 1;
      const mKey = isDupWord ? (meta.prefix + w + '_L' + lessonNum) : (meta.prefix + w);
      return {
        vocab_id: meta.prefix + (idx + 1),
        mastery_key: mKey,
        lesson_id: levelKey,
        lesson_title: meta.title,
        lesson_num: lessonNum,
        lesson_short: 'Bài ' + lessonNum,
        word: w,
        pinyin: pinyin,
        part_of_speech: pos,
        meaning: meaning,
        example: '',
        example_vi: '',
        isCustom: false,
        isHskLevel: true,
        sourceIndex: idx + 1
      };
    }).filter(function (item) {
      return item.word && item.meaning;
    });
  }

  function buildLessonBuckets(lessonItems) {
    const map = {};
    const defined = typeof adapter.getLessons === 'function' ? (adapter.getLessons() || []) : [];
    const definedById = {};
    defined.forEach(function (l) {
      if (l && l.lesson_id) definedById[String(l.lesson_id).trim()] = l;
    });

    if (adapter.isTeacher) {
      defined.forEach(function (l) {
        if (!l || !l.lesson_id) return;
        const lid = String(l.lesson_id).trim();
        const title = String(l.title || l.tag || lid).trim();
        map[lid] = {
          lesson_id: lid,
          title: title,
          shortLabel: String(l.tag || '').trim() || formatShortLessonLabel(lid, title),
          count: 0
        };
      });
    }

    lessonItems.forEach(function (item) {
      const lid = item.lesson_id;
      const syncedDef = definedById[lid];
      const preferredTitle = syncedDef ? String(syncedDef.title || syncedDef.tag || lid).trim() : (item.lesson_title || lid);
      const preferredShort = syncedDef && syncedDef.tag
        ? String(syncedDef.tag).trim()
        : (item.lesson_short || formatShortLessonLabel(lid, preferredTitle));
      if (!map[lid]) {
        map[lid] = {
          lesson_id: lid,
          title: preferredTitle,
          shortLabel: preferredShort,
          count: 0
        };
      } else if (preferredTitle && preferredTitle !== lid && map[lid].title === lid) {
        map[lid].title = preferredTitle;
        map[lid].shortLabel = preferredShort;
      }
      map[lid].count++;
    });

    return Object.keys(map).map(function (k) {
      return map[k];
    }).sort(function (a, b) {
      const wa = normalizeLessonSortWeight(a.lesson_id, a.title);
      const wb = normalizeLessonSortWeight(b.lesson_id, b.title);
      if (wa !== wb) return wa - wb;
      return a.title.localeCompare(b.title, 'vi');
    });
  }

  function getMasteredSet() {
    if (typeof adapter.getMasteredIds !== 'function') return {};
    const arr = adapter.getMasteredIds() || [];
    const map = {};
    arr.forEach(function (id) {
      map[String(id)] = true;
    });
    return map;
  }

  function isItemMastered(item, masteredMap) {
    if (!item || !masteredMap) return false;
    return Boolean(masteredMap[item.mastery_key] || masteredMap[item.vocab_id]);
  }

  function ensureValidSourceKey(lessonItems, hskItems, buckets, levelBanks) {
    if (vs.sourceKey === 'hsk-272' && hskItems.length > 0) return 'hsk-272';
    if (isHskLevelKey(vs.sourceKey) && levelBanks && (levelBanks[vs.sourceKey] || []).length > 0) {
      return vs.sourceKey;
    }
    if (vs.sourceKey === 'all-lessons' && (lessonItems.length > 0 || adapter.isTeacher)) return 'all-lessons';
    if (vs.sourceKey && buckets.some(function (b) { return b.lesson_id === vs.sourceKey; })) {
      return vs.sourceKey;
    }
    const firstNonEmpty = buckets.find(function (b) { return b.count > 0; });
    if (firstNonEmpty) return firstNonEmpty.lesson_id;
    if (adapter.isTeacher && buckets.length > 0) return buckets[0].lesson_id;
    if (lessonItems.length > 0) return 'all-lessons';
    if (hskItems.length > 0) return 'hsk-272';
    for (let i = 0; i < HSK_LEVEL_KEYS.length; i++) {
      const k = HSK_LEVEL_KEYS[i];
      if (levelBanks && (levelBanks[k] || []).length > 0) return k;
    }
    return 'hsk-272';
  }

  function buildHskLessonOptions(levelList) {
    const counts = {};
    (levelList || []).forEach(function (item) {
      const n = Number(item.lesson_num) || 1;
      counts[n] = (counts[n] || 0) + 1;
    });
    return Object.keys(counts).map(function (k) {
      const n = parseInt(k, 10);
      return { lessonNum: n, key: String(n), label: 'Bài ' + n, count: counts[k] };
    }).sort(function (a, b) {
      return a.lessonNum - b.lessonNum;
    });
  }

  function getSourceLabel(sourceKey, buckets, lessonItems, hskItems, levelBanks, activeCount) {
    if (sourceKey === 'hsk-272') return 'Kho 272 từ HSK (' + hskItems.length + ' từ)';
    if (isHskLevelKey(sourceKey)) {
      const meta = HSK_LEVEL_META[sourceKey];
      const fullCount = (levelBanks && levelBanks[sourceKey] && levelBanks[sourceKey].length) || 0;
      if (vs.hskLessonFilter && vs.hskLessonFilter !== 'all') {
        const shown = typeof activeCount === 'number' ? activeCount : fullCount;
        return meta.label + ' • Bài ' + vs.hskLessonFilter + ' (' + shown + ' từ)';
      }
      return meta.label + ' (' + fullCount + ' từ)';
    }
    if (sourceKey === 'all-lessons') return 'Tổng hợp theo bài (' + lessonItems.length + ' từ)';
    const bucket = buckets.find(function (b) { return b.lesson_id === sourceKey; });
    return bucket ? bucket.title : sourceKey;
  }

  function computeActiveItems(applyMasteryFilter) {
    const lessonItems = getLessonVocabItemsNormalized();
    const hskItems = getHskItemsNormalized();
    const levelBanks = {
      'hsk-1': getHskLevelItemsNormalized('hsk-1'),
      'hsk-2': getHskLevelItemsNormalized('hsk-2'),
      'hsk-3': getHskLevelItemsNormalized('hsk-3')
    };
    const buckets = buildLessonBuckets(lessonItems);
    vs.sourceKey = ensureValidSourceKey(lessonItems, hskItems, buckets, levelBanks);

    let baseList = [];
    let hskLessonOptions = [];
    if (vs.sourceKey === 'hsk-272') {
      baseList = hskItems;
    } else if (isHskLevelKey(vs.sourceKey)) {
      const fullLevelList = levelBanks[vs.sourceKey] || [];
      hskLessonOptions = buildHskLessonOptions(fullLevelList);
      if (vs.hskLessonFilter && vs.hskLessonFilter !== 'all') {
        const hasLesson = hskLessonOptions.some(function (opt) { return opt.key === String(vs.hskLessonFilter); });
        if (!hasLesson) {
          vs.hskLessonFilter = 'all';
        }
      }
      if (vs.hskLessonFilter && vs.hskLessonFilter !== 'all') {
        baseList = fullLevelList.filter(function (v) {
          return String(v.lesson_num) === String(vs.hskLessonFilter);
        });
      } else {
        baseList = fullLevelList;
      }
    } else if (vs.sourceKey === 'all-lessons') {
      baseList = lessonItems;
    } else {
      baseList = lessonItems.filter(function (v) { return v.lesson_id === vs.sourceKey; });
    }

    const masteredMap = getMasteredSet();
    let filtered = baseList;
    if (applyMasteryFilter && typeof adapter.getMasteredIds === 'function') {
      if (vs.masteryFilter === 'unmastered') {
        filtered = baseList.filter(function (v) { return !isItemMastered(v, masteredMap); });
      } else if (vs.masteryFilter === 'mastered') {
        filtered = baseList.filter(function (v) { return isItemMastered(v, masteredMap); });
      }
    }

    return {
      lessonItems: lessonItems,
      hskItems: hskItems,
      levelBanks: levelBanks,
      hskLessonOptions: hskLessonOptions,
      buckets: buckets,
      baseList: baseList,
      items: filtered,
      masteredMap: masteredMap,
      sourceLabel: getSourceLabel(vs.sourceKey, buckets, lessonItems, hskItems, levelBanks, baseList.length)
    };
  }

  function ensureSourceStripMounted() {
    let strip = document.getElementById('vocab-source-strip');
    if (strip) return strip;
    const subnav = document.querySelector('.vocab-workspace .vocab-subnav');
    if (!subnav || !subnav.parentNode) return null;
    strip = document.createElement('div');
    strip.id = 'vocab-source-strip';
    strip.className = 'vocab-source-strip';
    subnav.parentNode.insertBefore(strip, subnav);
    return strip;
  }

  function renderSourceStrip(ctx) {
    const strip = ensureSourceStripMounted();
    if (!strip) return;

    const lessonPillsHtml = ctx.buckets.map(function (b) {
      const activeCls = vs.sourceKey === b.lesson_id ? ' is-active' : '';
      return (
        '<button type="button" class="lesson-pill' + activeCls + '" data-vocab-source="' + escapeHtml(b.lesson_id) + '" title="' + escapeHtml(b.title) + '">' +
          '<span>' + escapeHtml(b.shortLabel) + '</span>' +
          '<span class="lesson-count-badge tabular-nums">' + b.count + '</span>' +
        '</button>'
      );
    }).join('');

    const allLessonsCls = vs.sourceKey === 'all-lessons' ? ' is-active' : '';
    const hskCls = vs.sourceKey === 'hsk-272' ? ' is-active' : '';

    const hskLevelPillsHtml = HSK_LEVEL_KEYS.map(function (lvlKey) {
      const meta = HSK_LEVEL_META[lvlKey];
      const list = (ctx.levelBanks && ctx.levelBanks[lvlKey]) || [];
      if (!list.length) return '';
      const activeCls = vs.sourceKey === lvlKey ? ' is-active' : '';
      return (
        '<button type="button" class="lesson-pill ' + meta.pillClass + activeCls + '" data-vocab-source="' + escapeHtml(lvlKey) + '" title="' + escapeHtml(meta.title) + '">' +
          '<span>' + escapeHtml(meta.label) + '</span>' +
          '<span class="lesson-count-badge tabular-nums">' + list.length + '</span>' +
        '</button>'
      );
    }).join('');

    let hskLessonRowHtml = '';
    if (isHskLevelKey(vs.sourceKey) && ctx.hskLessonOptions && ctx.hskLessonOptions.length > 0) {
      const meta = HSK_LEVEL_META[vs.sourceKey];
      const fullCount = (ctx.levelBanks[vs.sourceKey] || []).length;
      const allActive = (!vs.hskLessonFilter || vs.hskLessonFilter === 'all') ? ' is-active' : '';
      const chipsHtml = ctx.hskLessonOptions.map(function (opt) {
        const cls = String(vs.hskLessonFilter) === opt.key ? ' is-active' : '';
        return (
          '<button type="button" class="vocab-hsk-lesson-chip tabular-nums' + cls + '" data-vocab-hsk-lesson="' + escapeHtml(opt.key) + '">' +
            escapeHtml(opt.label) + ' (' + opt.count + ')' +
          '</button>'
        );
      }).join('');
      hskLessonRowHtml =
        '<div class="vocab-hsk-lesson-row" role="group" aria-label="Lọc theo bài trong giáo trình HSK">' +
          '<span class="vocab-strip-caption">Lọc bài ' + escapeHtml(meta.badgeLabel) + ':</span>' +
          '<button type="button" class="vocab-hsk-lesson-chip tabular-nums' + allActive + '" data-vocab-hsk-lesson="all">Tất cả (' + fullCount + ')</button>' +
          chipsHtml +
        '</div>';
    }

    let masteryBarHtml = '';
    if (!adapter.isTeacher && typeof adapter.getMasteredIds === 'function') {
      const masteredCount = ctx.baseList.filter(function (v) {
        return isItemMastered(v, ctx.masteredMap);
      }).length;
      const unmasteredCount = ctx.baseList.length - masteredCount;
      masteryBarHtml =
        '<div class="vocab-mastery-filter-row" role="group" aria-label="Lọc trạng thái thuộc từ">' +
          '<span class="vocab-strip-caption">Tiến độ bộ này:</span>' +
          '<button type="button" class="vocab-filter-chip' + (vs.masteryFilter === 'all' ? ' is-active' : '') + '" data-vocab-mfilter="all">Tất cả (' + ctx.baseList.length + ')</button>' +
          '<button type="button" class="vocab-filter-chip' + (vs.masteryFilter === 'unmastered' ? ' is-active' : '') + '" data-vocab-mfilter="unmastered">Chưa thuộc (' + unmasteredCount + ')</button>' +
          '<button type="button" class="vocab-filter-chip' + (vs.masteryFilter === 'mastered' ? ' is-active' : '') + '" data-vocab-mfilter="mastered">Đã thuộc (' + masteredCount + ')</button>' +
        '</div>';
    }

    const emptySyncHint = (adapter.isTeacher && ctx.buckets.length === 0)
      ? '<span class="vocab-strip-caption" style="font-weight:500;">(Chưa có bài từ tab Luyện tập cuối buổi — tạo bài bên Luyện cuối buổi hoặc chọn "+ Tạo bài học mới..." khi thêm từ)</span>'
      : '';

    let practiceCounterHtml = '';
    if (!adapter.isTeacher && typeof adapter.getPracticeCounts === 'function') {
      const pCounts = adapter.getPracticeCounts() || {};
      const bySrc = pCounts.bySource || {};
      const srcEntry = bySrc[vs.sourceKey];
      const currentSrcCount = srcEntry ? Math.max(0, Number(srcEntry.count || 0) || 0) : 0;
      const totalPracticeCount = Math.max(0, Number(pCounts.totalCount || 0) || 0);
      practiceCounterHtml =
        '<span class="vocab-practice-counter-pill tabular-nums" id="vocab-source-practice-badge" title="Số lần em đã hoàn thành luyện tập từ vựng (Flashcard, Trắc nghiệm, Tập viết)">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg>' +
          '<span>Bài này đã luyện: <strong>' + currentSrcCount + '</strong> lần · Tổng: <strong>' + totalPracticeCount + '</strong> lần</span>' +
        '</span>';
    }

    strip.innerHTML =
      '<div class="vocab-source-header">' +
        '<span class="vocab-strip-caption">Nguồn từ vựng:</span>' +
        '<strong class="vocab-active-source-name">' + escapeHtml(ctx.sourceLabel) + '</strong>' +
        emptySyncHint +
        practiceCounterHtml +
      '</div>' +
      '<div class="lesson-selector-bar vocab-lesson-pills-bar" role="group" aria-label="Chọn bài học hoặc kho từ vựng">' +
        lessonPillsHtml +
        '<button type="button" class="lesson-pill is-master-review' + allLessonsCls + '" data-vocab-source="all-lessons">' +
          '<span>Tổng hợp theo bài</span>' +
          '<span class="lesson-count-badge tabular-nums">' + ctx.lessonItems.length + '</span>' +
        '</button>' +
        '<button type="button" class="lesson-pill is-hsk-bank' + hskCls + '" data-vocab-source="hsk-272">' +
          '<span>Kho 272 từ HSK</span>' +
          '<span class="lesson-count-badge tabular-nums">' + ctx.hskItems.length + '</span>' +
        '</button>' +
        hskLevelPillsHtml +
      '</div>' +
      hskLessonRowHtml +
      masteryBarHtml;
  }

  function updateVocabBadge(ctx) {
    const totalBadge = document.getElementById('vocab-total-badge');
    if (totalBadge) {
      let shortName = '';
      if (vs.sourceKey === 'hsk-272') {
        shortName = 'Kho HSK';
      } else if (isHskLevelKey(vs.sourceKey)) {
        shortName = HSK_LEVEL_META[vs.sourceKey].badgeLabel +
          (vs.hskLessonFilter && vs.hskLessonFilter !== 'all' ? ' · Bài ' + vs.hskLessonFilter : '');
      } else if (vs.sourceKey === 'all-lessons') {
        shortName = 'Tổng hợp theo bài';
      } else {
        shortName = formatShortLessonLabel(vs.sourceKey, ctx.sourceLabel);
      }
      totalBadge.textContent = ctx.items.length + ' từ • ' + shortName;
    }
  }

  function ensureEmptyPanelNode(panelEl, idSuffix) {
    if (!panelEl) return null;
    const id = 'vocab-empty-panel-' + idSuffix;
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement('div');
      node.id = id;
      node.className = 'empty-state-panel vocab-empty-box';
      panelEl.insertBefore(node, panelEl.firstChild);
    }
    return node;
  }

  function renderEmptyStateHtml(title, desc, isFilterEmpty) {
    let actionBtn = '<button type="button" class="btn btn-outline btn-sm" data-vocab-empty-hsk="1" style="margin-top:14px;">Mở Kho 272 từ HSK</button>';
    if (isFilterEmpty) {
      actionBtn = '<button type="button" class="btn btn-outline btn-sm" data-vocab-mfilter="all" style="margin-top:14px;">Hiển thị tất cả từ</button>';
    } else if (adapter.isTeacher && !isBuiltInBankKey(vs.sourceKey) && vs.sourceKey !== 'all-lessons') {
      actionBtn = '<button type="button" class="btn btn-primary btn-sm" data-vocab-empty-add="1" style="margin-top:14px;">+ Thêm từ vào bài này</button>';
    }
    return (
      '<div class="empty-state-icon">' + ICON_BOOK + '</div>' +
      '<h3>' + escapeHtml(title) + '</h3>' +
      '<p>' + escapeHtml(desc) + '</p>' +
      actionBtn
    );
  }

  /* ------------------------------------------------------------------------
     MODE 1: 3D FLASHCARD
     ------------------------------------------------------------------------ */
  function syncFlashcardExtraNodes() {
    const backFace = document.querySelector('#fc-3d-card .fc-3d-back');
    let extraEl = document.getElementById('fc-back-extra-info');
    if (!extraEl && backFace) {
      extraEl = document.createElement('div');
      extraEl.id = 'fc-back-extra-info';
      extraEl.className = 'fc-back-extra-info';
      backFace.appendChild(extraEl);
    }
    const navRow = document.getElementById('btn-fc-next-card')
      ? document.getElementById('btn-fc-next-card').parentNode
      : null;
    let masterBtn = document.getElementById('btn-fc-toggle-mastered');
    if (!masterBtn && navRow && typeof adapter.onToggleMastered === 'function') {
      masterBtn = document.createElement('button');
      masterBtn.type = 'button';
      masterBtn.id = 'btn-fc-toggle-mastered';
      masterBtn.className = 'btn btn-outline btn-sm';
      const nextBtn = document.getElementById('btn-fc-next-card');
      navRow.insertBefore(masterBtn, nextBtn);
    }
    return { extraEl: extraEl, masterBtn: masterBtn };
  }

  function buildFlashcardOrder(items, forceReset) {
    const orderSelect = document.getElementById('fc-order-select');
    const mode = orderSelect ? orderSelect.value : 'seq';
    if (forceReset || vs.fcOrder.length !== items.length) {
      vs.fcOrder = items.map(function (_, i) { return i; });
      if (mode === 'rand') {
        vs.fcOrder = shuffleArray(vs.fcOrder);
      }
      vs.fcIdx = 0;
    } else if (vs.fcIdx >= items.length) {
      vs.fcIdx = Math.max(0, items.length - 1);
    }
  }

  function updateFlashcardUI(ctx) {
    const items = ctx ? ctx.items : computeActiveItems(true).items;
    const panel = document.getElementById('vpanel-flashcard');
    const stage = panel ? panel.querySelector('.fc-stage-container') : null;
    const emptyBox = ensureEmptyPanelNode(panel, 'fc');

    if (!items.length) {
      if (stage) stage.style.display = 'none';
      if (emptyBox) {
        emptyBox.style.display = 'flex';
        const isFilterEmpty = ctx && ctx.baseList.length > 0 && vs.masteryFilter !== 'all';
        emptyBox.innerHTML = renderEmptyStateHtml(
          isFilterEmpty ? 'Không có từ nào trong bộ lọc này' : 'Bài học này chưa có từ vựng',
          isFilterEmpty
            ? 'Hãy chọn tab "Tất cả" ở trên để xem lại toàn bộ từ vựng của bài học.'
            : 'Giáo viên có thể thêm từ thủ công hoặc nhập hàng loạt từ Excel/CSV cho bài học này.',
          isFilterEmpty
        );
      }
      return;
    }

    if (emptyBox) emptyBox.style.display = 'none';
    if (stage) stage.style.display = 'block';

    if (vs.fcOrder.length !== items.length) {
      buildFlashcardOrder(items, true);
    }
    const orderedIdx = vs.fcOrder[vs.fcIdx] !== undefined ? vs.fcOrder[vs.fcIdx] : 0;
    const v = items[orderedIdx] || items[0];
    if (!v) return;

    const card = document.getElementById('fc-3d-card');
    if (card) card.classList.remove('is-flipped');

    const frontStt = document.getElementById('fc-front-stt');
    const frontMain = document.getElementById('fc-front-main-text');
    const backHanzi = document.getElementById('fc-back-hanzi-text');
    const backPinyin = document.getElementById('fc-back-pinyin-text');
    const backMeaning = document.getElementById('fc-back-meaning-text');
    const progressBar = document.getElementById('fc-progress-bar');
    const labelEl = document.getElementById('fc-progress-label');
    const prevBtn = document.getElementById('btn-fc-prev-card');
    const nextBtn = document.getElementById('btn-fc-next-card');

    if (frontStt) {
      frontStt.textContent = 'Thẻ ' + (vs.fcIdx + 1) + ' / ' + items.length + ' · ' + v.lesson_short;
    }
    if (frontMain) {
      if (vs.fcSide === 'vi') {
        frontMain.textContent = v.meaning;
        frontMain.style.fontSize = v.meaning.length > 26 ? '1.25rem' : '1.75rem';
        frontMain.style.fontFamily = 'var(--font-display)';
      } else {
        frontMain.textContent = v.word;
        frontMain.style.fontSize = v.word.length >= 4 ? '2.5rem' : '3.25rem';
        frontMain.style.fontFamily = 'var(--font-sans-sc, "Noto Sans SC"), sans-serif';
      }
    }

    if (backHanzi) backHanzi.textContent = v.word;
    if (backPinyin) backPinyin.textContent = v.pinyin;
    if (backMeaning) backMeaning.textContent = v.meaning;

    const synced = syncFlashcardExtraNodes();
    if (synced.extraEl) {
      const parts = [];
      if (v.part_of_speech) parts.push('<span class="fc-pos-pill">' + escapeHtml(v.part_of_speech) + '</span>');
      if (v.example) parts.push('<div class="fc-example-line">' + escapeHtml(v.example) + '</div>');
      synced.extraEl.innerHTML = parts.join('');
    }
    if (synced.masterBtn) {
      const masteredMap = ctx ? ctx.masteredMap : getMasteredSet();
      const mastered = isItemMastered(v, masteredMap);
      synced.masterBtn.setAttribute('data-mastery-key', v.mastery_key);
      synced.masterBtn.className = 'btn btn-sm ' + (mastered ? 'btn-mint-active' : 'btn-outline');
      synced.masterBtn.innerHTML = ICON_CHECK + ' <span>' + (mastered ? 'Đã thuộc từ này' : 'Đánh dấu đã thuộc') + '</span>';
    }

    const pct = Math.round(((vs.fcIdx + 1) / items.length) * 100);
    if (progressBar) progressBar.style.width = pct + '%';
    if (labelEl) labelEl.textContent = (vs.fcIdx + 1) + ' / ' + items.length;
    if (prevBtn) prevBtn.disabled = vs.fcIdx === 0;
    if (nextBtn) {
      nextBtn.textContent = vs.fcIdx === items.length - 1 ? 'Hoàn thành bộ thẻ' : 'Tiếp theo →';
    }
  }

  /* ------------------------------------------------------------------------
     MODE 2: INTERACTIVE QUIZ
     ------------------------------------------------------------------------ */
  function clearQuizTimer() {
    if (vs.quizAutoTimer) {
      clearTimeout(vs.quizAutoTimer);
      vs.quizAutoTimer = null;
    }
  }

  function updateQuizCountSelectUI(itemsLength) {
    const countEl = document.getElementById('quiz-count-select');
    if (!countEl) return;
    const allOpt = countEl.querySelector('option[value="all"]');
    if (allOpt) {
      allOpt.textContent = 'Tất cả (' + itemsLength + ' câu)';
    }
  }

  function getCombinedDistractorPool(ctx) {
    const map = {};
    const pool = [];
    const activeBank = (ctx.levelBanks && isHskLevelKey(vs.sourceKey)) ? (ctx.levelBanks[vs.sourceKey] || []) : [];
    ctx.lessonItems.concat(activeBank, ctx.hskItems).forEach(function (item) {
      const key = item.word + '||' + item.meaning;
      if (!map[key]) {
        map[key] = true;
        pool.push(item);
      }
    });
    return pool;
  }

  function startQuizSession(ctxOverride) {
    clearQuizTimer();
    vs.quizSessionToken++;
    vs.quizCompletionReported = false;
    const ctx = ctxOverride || computeActiveItems(true);
    const items = ctx.items;
    updateQuizCountSelectUI(items.length);

    const panel = document.getElementById('vpanel-quiz');
    const activeBlock = document.getElementById('quiz-active-block');
    const resultView = document.getElementById('quiz-result-view');
    const emptyBox = ensureEmptyPanelNode(panel, 'quiz');

    if (!items.length) {
      if (activeBlock) activeBlock.style.display = 'none';
      if (resultView) resultView.style.display = 'none';
      if (emptyBox) {
        emptyBox.style.display = 'flex';
        emptyBox.innerHTML = renderEmptyStateHtml(
          'Chưa có từ vựng để tạo bài trắc nghiệm',
          'Bài học hiện tại chưa có từ vựng nào (hoặc đang bị lọc). Hãy chọn bài học khác hoặc Kho 272 từ HSK.'
        );
      }
      return;
    }

    if (emptyBox) emptyBox.style.display = 'none';
    const countEl = document.getElementById('quiz-count-select');
    const totalVal = countEl ? countEl.value : 'all';
    const total = totalVal === 'all' ? items.length : parseInt(totalVal, 10) || items.length;
    vs.quizList = shuffleArray(items).slice(0, Math.min(total, items.length));
    vs.quizIdx = 0;
    vs.quizCorrect = 0;
    vs.quizWrong = 0;
    vs.quizAnswered = false;

    if (activeBlock) activeBlock.style.display = 'block';
    if (resultView) resultView.style.display = 'none';
    renderQuizQuestion(ctx);
  }

  function renderQuizQuestion(ctxOverride) {
    const ctx = ctxOverride || computeActiveItems(true);
    const total = vs.quizList.length;
    if (vs.quizIdx >= total) {
      showQuizFinalResult(ctx);
      return;
    }

    vs.quizAnswered = false;
    vs.quizCurr = vs.quizList[vs.quizIdx];
    const modeEl = document.getElementById('quiz-mode-select');
    let dir = modeEl ? modeEl.value : 'zh2vi';
    if (dir === 'mixed') dir = Math.random() < 0.5 ? 'zh2vi' : 'vi2zh';

    const elCorr = document.getElementById('quiz-stat-correct');
    const elWrong = document.getElementById('quiz-stat-wrong');
    const elTotal = document.getElementById('quiz-stat-total');
    const counterText = document.getElementById('quiz-counter-text');
    const progressBar = document.getElementById('quiz-progress-bar');
    const qMain = document.getElementById('quiz-main-question');
    const qPinyin = document.getElementById('quiz-pinyin-question');
    const qDir = document.getElementById('quiz-ask-direction');
    const fb = document.getElementById('quiz-feedback-box');
    const nextBtn = document.getElementById('btn-quiz-next-question');
    const optsContainer = document.getElementById('quiz-options-container');

    if (elCorr) elCorr.textContent = String(vs.quizCorrect);
    if (elWrong) elWrong.textContent = String(vs.quizWrong);
    if (elTotal) elTotal.textContent = String(total);
    if (counterText) counterText.textContent = 'Câu ' + (vs.quizIdx + 1) + ' / ' + total;
    if (progressBar) progressBar.style.width = Math.round(((vs.quizIdx + 1) / total) * 100) + '%';
    if (fb) fb.innerHTML = '';
    if (nextBtn) nextBtn.style.display = 'none';

    if (dir === 'zh2vi') {
      if (qMain) {
        qMain.textContent = vs.quizCurr.word;
        qMain.style.fontFamily = 'var(--font-sans-sc, "Noto Sans SC"), sans-serif';
      }
      if (qPinyin) qPinyin.textContent = vs.quizCurr.pinyin;
      if (qDir) qDir.textContent = 'Chọn nghĩa tiếng Việt đúng cho từ trên:';
    } else {
      if (qMain) {
        qMain.textContent = vs.quizCurr.meaning;
        qMain.style.fontFamily = 'var(--font-display)';
      }
      if (qPinyin) qPinyin.textContent = '';
      if (qDir) qDir.textContent = 'Chọn chữ Hán tương ứng với nghĩa trên:';
    }

    const correctValue = dir === 'zh2vi' ? vs.quizCurr.meaning : vs.quizCurr.word;
    const seen = {};
    seen[correctValue] = true;
    const distractors = [];

    const candidatePools = [ctx.items, getCombinedDistractorPool(ctx)];
    candidatePools.forEach(function (pool) {
      if (distractors.length >= 3) return;
      shuffleArray(pool).forEach(function (cand) {
        if (distractors.length >= 3) return;
        const val = dir === 'zh2vi' ? cand.meaning : cand.word;
        if (!val || seen[val]) return;
        seen[val] = true;
        distractors.push({ label: val, isCorrect: false });
      });
    });

    const opts = shuffleArray([{ label: correctValue, isCorrect: true }].concat(distractors));
    const letters = ['A', 'B', 'C', 'D'];
    if (optsContainer) {
      optsContainer.innerHTML = opts.map(function (opt, idx) {
        return (
          '<button type="button" class="quiz-option-btn" data-correct="' + (opt.isCorrect ? '1' : '0') + '">' +
            '<span class="quiz-option-letter">' + letters[idx] + '</span>' +
            '<span>' + escapeHtml(opt.label) + '</span>' +
          '</button>'
        );
      }).join('');
    }
  }

  function showQuizFinalResult(ctxOverride) {
    clearQuizTimer();
    const ctx = ctxOverride || computeActiveItems(true);
    const activeBlock = document.getElementById('quiz-active-block');
    const resultView = document.getElementById('quiz-result-view');
    const percentEl = document.getElementById('quiz-result-percent');
    const titleEl = document.getElementById('quiz-result-title');
    const descEl = document.getElementById('quiz-result-desc');

    if (activeBlock) activeBlock.style.display = 'none';
    if (resultView) resultView.style.display = 'block';

    const total = vs.quizList.length || 1;
    const pct = Math.round((vs.quizCorrect / total) * 100);
    if (percentEl) percentEl.textContent = pct + '%';
    if (titleEl) {
      titleEl.textContent = pct >= 85 ? 'Xuất sắc!' : (pct >= 65 ? 'Khá tốt!' : 'Cần ôn lại thêm nhé!');
    }
    if (descEl) {
      descEl.textContent = 'Đã trả lời đúng ' + vs.quizCorrect + ' / ' + total + ' câu (' + ctx.sourceLabel + ').';
    }

    if (!vs.quizCompletionReported && typeof adapter.onQuizComplete === 'function') {
      vs.quizCompletionReported = true;
      adapter.onQuizComplete({
        sourceKey: vs.sourceKey,
        sourceLabel: ctx.sourceLabel,
        correct: vs.quizCorrect,
        total: total,
        pct: pct
      });
      renderSourceStrip(computeActiveItems(true));
    }
  }

  /* ------------------------------------------------------------------------
     MODE 3: HANZI WRITER STROKE PRACTICE
     ------------------------------------------------------------------------ */
  function loadHanziCharacter(char) {
    const canvas = document.getElementById('hanzi-writer-canvas');
    const status = document.getElementById('stroke-feedback-status');
    const activeChar = document.getElementById('stroke-active-char');
    const clean = extractHanziChars(char)[0] || String(char || '').charAt(0);
    if (!clean || !canvas) return;
    vs.strokeChar = clean;
    if (activeChar) activeChar.textContent = clean;
    if (status) status.textContent = '';

    canvas.innerHTML = '';
    if (typeof window.HanziWriter === 'undefined') {
      canvas.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.875rem;color:var(--color-muted-foreground);text-align:center;padding:12px;">Thư viện nét chữ HanziWriter đang tải...</div>';
      return;
    }

    try {
      vs.writerInstance = window.HanziWriter.create('hanzi-writer-canvas', clean, {
        width: 240,
        height: 240,
        padding: 12,
        strokeColor: '#2D1B4E',
        outlineColor: '#FFE8F0',
        radicalColor: '#FF6B9D',
        drawingColor: '#06D6A0',
        drawingWidth: 16,
        showCharacter: true,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 160
      });
    } catch (e) {
      canvas.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.875rem;color:var(--color-muted-foreground);">Chữ này không hỗ trợ mô phỏng nét.</div>';
    }
  }

  function renderStrokeCharTabs(word) {
    const activeChar = document.getElementById('stroke-active-char');
    if (!activeChar || !activeChar.parentNode) return;
    let tabsWrap = document.getElementById('stroke-word-chars');
    if (!tabsWrap) {
      tabsWrap = document.createElement('div');
      tabsWrap.id = 'stroke-word-chars';
      tabsWrap.className = 'stroke-word-chars-row';
      activeChar.parentNode.insertBefore(tabsWrap, activeChar.nextSibling);
    }
    const chars = extractHanziChars(word);
    if (chars.length <= 1) {
      tabsWrap.style.display = 'none';
      tabsWrap.innerHTML = '';
      return;
    }
    tabsWrap.style.display = 'flex';
    tabsWrap.innerHTML =
      '<span class="stroke-chars-caption">Chọn chữ trong từ:</span>' +
      chars.map(function (c, i) {
        const cls = i === vs.strokeCharIdx ? ' is-active' : '';
        return '<button type="button" class="stroke-char-tab' + cls + '" data-stroke-char-idx="' + i + '">' + escapeHtml(c) + '</button>';
      }).join('');
  }

  function selectStrokeWordItem(item, preserveCharIdx) {
    if (!item) return;
    vs.strokeWordItem = item;
    const chars = extractHanziChars(item.word);
    const maxIdx = Math.max(0, chars.length - 1);
    vs.strokeCharIdx = preserveCharIdx ? Math.min(Math.max(0, vs.strokeCharIdx || 0), maxIdx) : 0;
    const activeChar = chars[vs.strokeCharIdx] || chars[0] || item.word.charAt(0);
    const activePinyin = document.getElementById('stroke-active-pinyin');
    const activeMeaning = document.getElementById('stroke-active-meaning');
    if (activePinyin) activePinyin.textContent = item.pinyin;
    if (activeMeaning) activeMeaning.textContent = item.word + ' — ' + item.meaning;
    renderStrokeCharTabs(item.word);
    loadHanziCharacter(activeChar);
    renderStrokeChipsHighlight();
  }

  function renderStrokeChipsHighlight() {
    const grid = document.getElementById('stroke-quick-chips');
    if (!grid) return;
    const activeKey = vs.strokeWordItem ? vs.strokeWordItem.vocab_id : '';
    grid.querySelectorAll('.stroke-chip-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-stroke-vid') === activeKey);
    });
  }

  function renderStrokeGrid(ctxOverride, filterText) {
    const grid = document.getElementById('stroke-quick-chips');
    if (!grid) return;
    const ctx = ctxOverride || computeActiveItems(true);
    const list = ctx.items;
    const q = String(filterText || '').trim().toLowerCase();
    const filtered = q
      ? list.filter(function (v) {
          return (
            v.word.indexOf(q) >= 0 ||
            v.pinyin.toLowerCase().indexOf(q) >= 0 ||
            v.meaning.toLowerCase().indexOf(q) >= 0
          );
        })
      : list;

    if (!filtered.length) {
      grid.innerHTML = '<div style="font-size:0.8125rem;color:var(--color-muted-foreground);">Không tìm thấy từ phù hợp trong bộ này.</div>';
      return;
    }

    const activeKey = vs.strokeWordItem ? vs.strokeWordItem.vocab_id : '';
    grid.innerHTML = filtered.slice(0, 80).map(function (v) {
      const cls = v.vocab_id === activeKey ? ' is-active' : '';
      return (
        '<button type="button" class="stroke-chip-btn' + cls + '" data-stroke-vid="' + escapeHtml(v.vocab_id) + '">' +
          escapeHtml(v.word) +
        '</button>'
      );
    }).join('');
  }

  /* ------------------------------------------------------------------------
     MODE 4: LOOKUP & PRACTICE TABLE
     ------------------------------------------------------------------------ */
  function syncLookupRangeOptions(totalCount) {
    const rangeSel = document.getElementById('vlist-range-select');
    if (!rangeSel) return;
    const prevVal = rangeSel.value;
    const opts = ['<option value="all">Tất cả (' + totalCount + ' từ)</option>'];
    if (totalCount > 50) {
      for (let start = 1; start <= totalCount; start += 50) {
        const end = Math.min(totalCount, start + 49);
        opts.push('<option value="' + start + '-' + end + '">Từ ' + start + ' – ' + end + '</option>');
      }
    }
    rangeSel.innerHTML = opts.join('');
    const hasPrev = opts.some(function (o) { return o.indexOf('value="' + prevVal + '"') >= 0; });
    rangeSel.value = hasPrev ? prevVal : 'all';
  }

  function renderVocabLookupTable(ctxOverride) {
    const tbody = document.getElementById('vlist-table-body');
    if (!tbody) return;
    const ctx = ctxOverride || computeActiveItems(true);
    const baseItems = ctx.items;
    syncLookupRangeOptions(baseItems.length);

    const searchInp = document.getElementById('vlist-search-input');
    const rangeSel = document.getElementById('vlist-range-select');
    const countBadge = document.getElementById('vlist-count-badge');
    const q = searchInp ? searchInp.value.trim().toLowerCase() : '';
    const rangeVal = rangeSel ? rangeSel.value : 'all';

    let list = baseItems;
    if (rangeVal && rangeVal !== 'all') {
      const parts = rangeVal.split('-');
      const s = parseInt(parts[0], 10);
      const e = parseInt(parts[1], 10);
      if (!isNaN(s) && !isNaN(e)) {
        list = baseItems.slice(s - 1, e);
      }
    }
    if (q) {
      list = baseItems.filter(function (v) {
        return (
          v.word.indexOf(q) >= 0 ||
          v.pinyin.toLowerCase().indexOf(q) >= 0 ||
          v.meaning.toLowerCase().indexOf(q) >= 0 ||
          v.lesson_short.toLowerCase().indexOf(q) >= 0
        );
      });
    }

    if (countBadge) {
      countBadge.textContent = 'Hiển thị ' + list.length + ' / ' + baseItems.length + ' từ';
    }

    if (list.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--color-muted-foreground);">' +
          'Không có từ vựng nào khớp với bộ lọc hiện tại.' +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (v, idx) {
      const mastered = isItemMastered(v, ctx.masteredMap);
      const showLessonTag = vs.sourceKey === 'all-lessons' || isHskLevelKey(vs.sourceKey) || v.isCustom;
      const metaBadges =
        '<div class="vlist-meta-tags">' +
          (showLessonTag ? '<span class="vlist-lesson-tag">' + escapeHtml(v.lesson_short) + '</span>' : '') +
          (v.part_of_speech ? '<span class="vlist-pos-tag">' + escapeHtml(v.part_of_speech) + '</span>' : '') +
        '</div>';

      const masteryBtnHtml = typeof adapter.onToggleMastered === 'function'
        ? '<button type="button" class="btn btn-sm ' + (mastered ? 'btn-mint-active' : 'btn-outline') + '" data-vlist-mastery="' + escapeHtml(v.mastery_key) + '" title="Đánh dấu đã thuộc">' +
            ICON_CHECK + ' <span>' + (mastered ? 'Đã thuộc' : 'Thuộc') + '</span>' +
          '</button>'
        : '';

      const deleteBtnHtml = adapter.isTeacher && v.isCustom && typeof adapter.onDeleteVocab === 'function'
        ? '<button type="button" class="btn btn-outline btn-sm vocab-row-delete-btn" data-vlist-delete="' + escapeHtml(v.vocab_id) + '" title="Xóa từ này khỏi bài học">' +
            ICON_TRASH +
          '</button>'
        : '';

      return (
        '<tr>' +
          '<td class="tabular-nums" style="font-weight:700;color:var(--color-muted-foreground);">' + (idx + 1) + '</td>' +
          '<td>' +
            '<div style="font-size:1.25rem;font-weight:800;color:var(--color-ink);font-family:var(--font-sans-sc, sans-serif);">' + escapeHtml(v.word) + '</div>' +
            metaBadges +
          '</td>' +
          '<td>' +
            '<div style="font-weight:700;color:var(--color-primary-deep);font-size:0.9375rem;">' + escapeHtml(v.pinyin) + '</div>' +
            '<div style="color:var(--color-foreground);margin-top:2px;">' + escapeHtml(v.meaning) + '</div>' +
            (v.example ? '<div style="font-size:0.8125rem;color:var(--color-muted-foreground);margin-top:4px;">' + escapeHtml(v.example) + '</div>' : '') +
          '</td>' +
          '<td style="text-align:center;">' +
            '<div style="display:inline-flex;gap:6px;flex-wrap:wrap;justify-content:center;">' +
              '<button type="button" class="btn btn-outline btn-sm" data-vlist-speak="' + escapeHtml(v.word) + '" title="Nghe phát âm">' + ICON_SPEAK + '</button>' +
              '<button type="button" class="btn btn-outline btn-sm" data-vlist-stroke="' + escapeHtml(v.vocab_id) + '" title="Tập viết nét chữ">' + ICON_STROKE + '</button>' +
              masteryBtnHtml +
              deleteBtnHtml +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  /* ------------------------------------------------------------------------
     PUBLIC NAVIGATION & BINDING
     ------------------------------------------------------------------------ */
  function switchVocabSubTab(subTab) {
    vs.subTab = subTab;
    document.querySelectorAll('.vocab-subtab').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-vsub') === subTab);
    });
    document.querySelectorAll('.vocab-panel').forEach(function (p) {
      p.classList.toggle('is-active', p.id === 'vpanel-' + subTab);
    });

    const ctx = computeActiveItems(true);
    if (subTab === 'stroke') {
      renderStrokeGrid(ctx);
      if (ctx.items.length > 0) {
        const activeItem = (vs.strokeWordItem && ctx.items.some(function (x) { return x.vocab_id === vs.strokeWordItem.vocab_id; }))
          ? vs.strokeWordItem
          : ctx.items[0];
        selectStrokeWordItem(activeItem, true);
      } else if (vs.strokeChar) {
        loadHanziCharacter(vs.strokeChar);
      }
    } else if (subTab === 'quiz') {
      if (!vs.quizList || vs.quizList.length === 0) {
        startQuizSession(ctx);
      }
    } else if (subTab === 'list') {
      renderVocabLookupTable(ctx);
    } else {
      updateFlashcardUI(ctx);
    }
  }

  function renderVocabSuite(forceResetDecks) {
    const ctx = computeActiveItems(true);
    renderSourceStrip(ctx);
    updateVocabBadge(ctx);
    updateQuizCountSelectUI(ctx.items.length);

    if (forceResetDecks) {
      buildFlashcardOrder(ctx.items, true);
      vs.quizList = [];
      vs.strokeWordItem = ctx.items[0] || null;
      vs.strokeChar = vs.strokeWordItem ? (extractHanziChars(vs.strokeWordItem.word)[0] || vs.strokeWordItem.word.charAt(0)) : '';
      vs.strokeCharIdx = 0;
    }

    updateFlashcardUI(ctx);
    renderVocabLookupTable(ctx);
    renderStrokeGrid(ctx);

    if (vs.subTab === 'quiz' && (forceResetDecks || !vs.quizList.length)) {
      startQuizSession(ctx);
    } else if (vs.subTab === 'stroke' && ctx.items.length > 0) {
      const stillInList = vs.strokeWordItem && ctx.items.some(function (x) { return x.vocab_id === vs.strokeWordItem.vocab_id; });
      if (!stillInList || forceResetDecks) {
        selectStrokeWordItem(ctx.items[0]);
      }
    }
  }

  function selectSource(sourceKey, opts) {
    const nextKey = String(sourceKey || '').trim() || 'hsk-272';
    vs.sourceKey = nextKey;
    vs.hskLessonFilter = (opts && opts.hskLesson !== undefined && opts.hskLesson !== null)
      ? (String(opts.hskLesson).trim() || 'all')
      : 'all';
    if (opts && opts.masteryFilter) vs.masteryFilter = opts.masteryFilter;
    vs.quizList = [];
    renderVocabSuite(true);
    if (opts && opts.subTab) {
      switchVocabSubTab(opts.subTab);
    }
    if (typeof adapter.onSourceChange === 'function') {
      adapter.onSourceChange(getStateSnapshot());
    }
  }

  function getStateSnapshot() {
    const ctx = computeActiveItems(false);
    return {
      sourceKey: vs.sourceKey,
      hskLessonFilter: vs.hskLessonFilter,
      sourceLabel: ctx.sourceLabel,
      activeItems: ctx.baseList,
      filteredItems: computeActiveItems(true).items,
      totalLessonCount: ctx.lessonItems.length,
      totalHskCount: ctx.hskItems.length,
      buckets: ctx.buckets
    };
  }

  function bindVocabSuiteEvents() {
    if (vs.eventsBound) return;
    vs.eventsBound = true;

    const workspace = document.querySelector('.vocab-workspace');
    if (workspace) {
      workspace.addEventListener('click', function (ev) {
        const srcBtn = ev.target.closest('[data-vocab-source]');
        if (srcBtn) {
          selectSource(srcBtn.getAttribute('data-vocab-source'));
          return;
        }
        const hskLessonBtn = ev.target.closest('[data-vocab-hsk-lesson]');
        if (hskLessonBtn) {
          vs.hskLessonFilter = hskLessonBtn.getAttribute('data-vocab-hsk-lesson') || 'all';
          vs.quizList = [];
          renderVocabSuite(true);
          return;
        }
        const mFilterBtn = ev.target.closest('[data-vocab-mfilter]');
        if (mFilterBtn) {
          vs.masteryFilter = mFilterBtn.getAttribute('data-vocab-mfilter') || 'all';
          renderVocabSuite(true);
          return;
        }
        const emptyAddBtn = ev.target.closest('[data-vocab-empty-add]');
        if (emptyAddBtn) {
          if (typeof adapter.onRequestAddVocab === 'function') {
            adapter.onRequestAddVocab(vs.sourceKey);
          }
          return;
        }
        const emptyHskBtn = ev.target.closest('[data-vocab-empty-hsk]');
        if (emptyHskBtn) {
          vs.masteryFilter = 'all';
          selectSource('hsk-272');
          return;
        }
        const masteryBtn = ev.target.closest('#btn-fc-toggle-mastered, [data-vlist-mastery]');
        if (masteryBtn) {
          const mKey = masteryBtn.getAttribute('data-mastery-key') || masteryBtn.getAttribute('data-vlist-mastery');
          if (mKey && typeof adapter.onToggleMastered === 'function') {
            adapter.onToggleMastered(mKey);
            renderVocabSuite(false);
          }
          return;
        }
        const deleteBtn = ev.target.closest('[data-vlist-delete]');
        if (deleteBtn) {
          const vid = deleteBtn.getAttribute('data-vlist-delete');
          if (vid && typeof adapter.onDeleteVocab === 'function') {
            adapter.onDeleteVocab(vid, deleteBtn);
          }
          return;
        }
      });
    }

    document.querySelectorAll('.vocab-subtab').forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        const sub = tabBtn.getAttribute('data-vsub');
        if (sub) switchVocabSubTab(sub);
      });
    });

    const fcWrap = document.getElementById('fc-3d-card-wrap');
    const fcCard = document.getElementById('fc-3d-card');
    if (fcWrap && fcCard) {
      fcWrap.addEventListener('click', function (ev) {
        if (ev.target.closest('button')) return;
        fcCard.classList.toggle('is-flipped');
      });
    }

    const fcOrderSelect = document.getElementById('fc-order-select');
    if (fcOrderSelect) {
      fcOrderSelect.addEventListener('change', function () {
        const ctx = computeActiveItems(true);
        buildFlashcardOrder(ctx.items, true);
        updateFlashcardUI(ctx);
      });
    }

    const fcSideSelect = document.getElementById('fc-side-select');
    if (fcSideSelect) {
      fcSideSelect.addEventListener('change', function () {
        vs.fcSide = fcSideSelect.value;
        updateFlashcardUI();
      });
    }

    const btnFcReset = document.getElementById('btn-fc-reset');
    if (btnFcReset) {
      btnFcReset.addEventListener('click', function () {
        const ctx = computeActiveItems(true);
        buildFlashcardOrder(ctx.items, true);
        updateFlashcardUI(ctx);
      });
    }

    const btnFcPrev = document.getElementById('btn-fc-prev-card');
    if (btnFcPrev) {
      btnFcPrev.addEventListener('click', function () {
        if (vs.fcIdx > 0) {
          vs.fcIdx--;
          updateFlashcardUI();
        }
      });
    }

    const btnFcNext = document.getElementById('btn-fc-next-card');
    if (btnFcNext) {
      btnFcNext.addEventListener('click', function () {
        const ctx = computeActiveItems(true);
        if (vs.fcIdx < ctx.items.length - 1) {
          vs.fcIdx++;
          updateFlashcardUI(ctx);
        } else {
          if (ctx.items.length > 0 && typeof adapter.onFlashcardCycleComplete === 'function') {
            adapter.onFlashcardCycleComplete({
              sourceKey: vs.sourceKey,
              sourceLabel: ctx.sourceLabel,
              totalCards: ctx.items.length
            });
          }
          buildFlashcardOrder(ctx.items, true);
          const refreshedCtx = computeActiveItems(true);
          renderSourceStrip(refreshedCtx);
          updateFlashcardUI(refreshedCtx);
        }
      });
    }

    const btnFcSpeak = document.getElementById('btn-fc-speak-word');
    if (btnFcSpeak) {
      btnFcSpeak.addEventListener('click', function (ev) {
        ev.stopPropagation();
        const items = computeActiveItems(true).items;
        const v = items[vs.fcOrder[vs.fcIdx]];
        if (v) speakChineseWord(v.word);
      });
    }

    const btnFcGoStroke = document.getElementById('btn-fc-go-stroke');
    if (btnFcGoStroke) {
      btnFcGoStroke.addEventListener('click', function () {
        const items = computeActiveItems(true).items;
        const v = items[vs.fcOrder[vs.fcIdx]];
        if (v) {
          switchVocabSubTab('stroke');
          selectStrokeWordItem(v);
        }
      });
    }

    const btnQuizRestart = document.getElementById('btn-quiz-restart');
    if (btnQuizRestart) btnQuizRestart.addEventListener('click', function () { startQuizSession(); });
    const btnQuizRetry = document.getElementById('btn-quiz-try-again');
    if (btnQuizRetry) btnQuizRetry.addEventListener('click', function () { startQuizSession(); });
    const quizModeSelect = document.getElementById('quiz-mode-select');
    if (quizModeSelect) quizModeSelect.addEventListener('change', function () { startQuizSession(); });
    const quizCountSelect = document.getElementById('quiz-count-select');
    if (quizCountSelect) quizCountSelect.addEventListener('change', function () { startQuizSession(); });

    const btnQuizSpeak = document.getElementById('btn-quiz-speak-question');
    if (btnQuizSpeak) {
      btnQuizSpeak.addEventListener('click', function () {
        if (vs.quizCurr) speakChineseWord(vs.quizCurr.word);
      });
    }

    const optsContainer = document.getElementById('quiz-options-container');
    if (optsContainer) {
      optsContainer.addEventListener('click', function (ev) {
        const btn = ev.target.closest('.quiz-option-btn');
        if (!btn || vs.quizAnswered) return;
        vs.quizAnswered = true;
        const isCorrect = btn.getAttribute('data-correct') === '1';
        const fb = document.getElementById('quiz-feedback-box');
        const nextBtn = document.getElementById('btn-quiz-next-question');

        if (isCorrect) {
          vs.quizCorrect++;
          btn.classList.add('is-correct');
          if (fb) {
            fb.innerHTML =
              '<span style="color:var(--color-success-text);">Chính xác! ' +
              escapeHtml(vs.quizCurr.word) + ' (' + escapeHtml(vs.quizCurr.pinyin) + ') — ' +
              escapeHtml(vs.quizCurr.meaning) + '</span>';
          }
        } else {
          vs.quizWrong++;
          btn.classList.add('is-wrong');
          optsContainer.querySelectorAll('.quiz-option-btn').forEach(function (b) {
            if (b.getAttribute('data-correct') === '1') b.classList.add('is-correct');
          });
          if (fb) {
            fb.innerHTML =
              '<span style="color:var(--color-destructive-text);">Chưa đúng! Đáp án: ' +
              escapeHtml(vs.quizCurr.word) + ' (' + escapeHtml(vs.quizCurr.pinyin) + ') — ' +
              escapeHtml(vs.quizCurr.meaning) + '</span>';
          }
        }
        optsContainer.querySelectorAll('.quiz-option-btn').forEach(function (b) {
          b.disabled = true;
        });

        const elCorr = document.getElementById('quiz-stat-correct');
        const elWrong = document.getElementById('quiz-stat-wrong');
        if (elCorr) elCorr.textContent = String(vs.quizCorrect);
        if (elWrong) elWrong.textContent = String(vs.quizWrong);
        if (nextBtn) {
          nextBtn.style.display = 'inline-flex';
          nextBtn.textContent = vs.quizIdx >= vs.quizList.length - 1 ? 'Xem kết quả →' : 'Câu tiếp theo →';
        }

        const expectedToken = vs.quizSessionToken;
        clearQuizTimer();
        vs.quizAutoTimer = setTimeout(function () {
          if (vs.quizSessionToken === expectedToken && vs.quizAnswered) {
            vs.quizIdx++;
            renderQuizQuestion();
          }
        }, 1800);
      });
    }

    const btnQuizNext = document.getElementById('btn-quiz-next-question');
    if (btnQuizNext) {
      btnQuizNext.addEventListener('click', function () {
        if (!vs.quizAnswered) return;
        clearQuizTimer();
        vs.quizIdx++;
        renderQuizQuestion();
      });
    }

    const strokeSearchInput = document.getElementById('stroke-search-input');
    if (strokeSearchInput) {
      strokeSearchInput.addEventListener('input', function () {
        renderStrokeGrid(null, strokeSearchInput.value);
      });
    }
    const btnStrokeSearch = document.getElementById('btn-stroke-search-action');
    if (btnStrokeSearch) {
      btnStrokeSearch.addEventListener('click', function () {
        const val = strokeSearchInput ? strokeSearchInput.value.trim() : '';
        if (!val) return;
        const items = computeActiveItems(true).items;
        const found = items.find(function (v) {
          return (
            v.word.indexOf(val) >= 0 ||
            v.pinyin.toLowerCase().indexOf(val.toLowerCase()) >= 0 ||
            v.meaning.toLowerCase().indexOf(val.toLowerCase()) >= 0
          );
        });
        if (found) {
          selectStrokeWordItem(found);
        } else {
          vs.strokeWordItem = { vocab_id: 'CUSTOM', word: val, pinyin: '', meaning: '' };
          vs.strokeCharIdx = 0;
          renderStrokeCharTabs(val);
          loadHanziCharacter(val);
        }
      });
    }

    const strokeQuickGrid = document.getElementById('stroke-quick-chips');
    if (strokeQuickGrid) {
      strokeQuickGrid.addEventListener('click', function (ev) {
        const btn = ev.target.closest('.stroke-chip-btn');
        if (!btn) return;
        const vid = btn.getAttribute('data-stroke-vid');
        const items = computeActiveItems(true).items;
        const found = items.find(function (x) { return x.vocab_id === vid; });
        if (found) selectStrokeWordItem(found);
      });
    }

    const strokeDetailCol = document.querySelector('#vpanel-stroke .stroke-detail-column');
    if (strokeDetailCol) {
      strokeDetailCol.addEventListener('click', function (ev) {
        const charTab = ev.target.closest('[data-stroke-char-idx]');
        if (!charTab || !vs.strokeWordItem) return;
        const idx = parseInt(charTab.getAttribute('data-stroke-char-idx'), 10);
        const chars = extractHanziChars(vs.strokeWordItem.word);
        if (!isNaN(idx) && chars[idx]) {
          vs.strokeCharIdx = idx;
          renderStrokeCharTabs(vs.strokeWordItem.word);
          loadHanziCharacter(chars[idx]);
        }
      });
    }

    const btnStrokeAnim = document.getElementById('btn-stroke-animate');
    if (btnStrokeAnim) {
      btnStrokeAnim.addEventListener('click', function () {
        if (vs.writerInstance && typeof vs.writerInstance.animateCharacter === 'function') {
          vs.writerInstance.animateCharacter();
        }
      });
    }

    const btnStrokeQuiz = document.getElementById('btn-stroke-quiz');
    if (btnStrokeQuiz) {
      btnStrokeQuiz.addEventListener('click', function () {
        const status = document.getElementById('stroke-feedback-status');
        if (vs.writerInstance && typeof vs.writerInstance.quiz === 'function') {
          if (status) status.textContent = 'Hãy dùng ngón tay hoặc chuột vẽ theo thứ tự nét!';
          vs.writerInstance.quiz({
            onComplete: function (summaryData) {
              if (status) {
                status.textContent =
                  'Hoàn thành viết chữ "' + vs.strokeChar + '" (Sai ' + summaryData.totalMistakes + ' nét).';
              }
              const ctx = computeActiveItems(true);
              if (typeof adapter.onStrokeComplete === 'function') {
                adapter.onStrokeComplete({
                  sourceKey: vs.sourceKey,
                  sourceLabel: ctx.sourceLabel,
                  word: vs.strokeWordItem ? vs.strokeWordItem.word : vs.strokeChar,
                  char: vs.strokeChar,
                  mistakes: summaryData && typeof summaryData.totalMistakes === 'number' ? summaryData.totalMistakes : 0
                });
              }
              renderSourceStrip(computeActiveItems(true));
            }
          });
        }
      });
    }

    const btnStrokeSpeak = document.getElementById('btn-stroke-speak');
    if (btnStrokeSpeak) {
      btnStrokeSpeak.addEventListener('click', function () {
        const text = vs.strokeWordItem ? vs.strokeWordItem.word : vs.strokeChar;
        if (text) speakChineseWord(text);
      });
    }

    const vlistSearch = document.getElementById('vlist-search-input');
    if (vlistSearch) vlistSearch.addEventListener('input', function () { renderVocabLookupTable(); });
    const vlistRange = document.getElementById('vlist-range-select');
    if (vlistRange) vlistRange.addEventListener('change', function () { renderVocabLookupTable(); });

    const vlistBody = document.getElementById('vlist-table-body');
    if (vlistBody) {
      vlistBody.addEventListener('click', function (ev) {
        const speakBtn = ev.target.closest('[data-vlist-speak]');
        if (speakBtn) {
          speakChineseWord(speakBtn.getAttribute('data-vlist-speak'));
          return;
        }
        const strokeBtn = ev.target.closest('[data-vlist-stroke]');
        if (strokeBtn) {
          const vid = strokeBtn.getAttribute('data-vlist-stroke');
          const items = computeActiveItems(true).items;
          const v = items.find(function (x) { return x.vocab_id === vid; });
          if (v) {
            switchVocabSubTab('stroke');
            selectStrokeWordItem(v);
          }
        }
      });
    }
  }

  function configureVocabSuite(opts) {
    if (opts && typeof opts === 'object') {
      Object.keys(opts).forEach(function (k) {
        if (k in adapter) adapter[k] = opts[k];
      });
    }
    bindVocabSuiteEvents();
    renderVocabSuite(true);
  }

  function initVocabSuite() {
    bindVocabSuiteEvents();
    renderVocabSuite(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVocabSuite);
  } else {
    initVocabSuite();
  }

  window.StudySnapVocabSuite = {
    init: initVocabSuite,
    configure: configureVocabSuite,
    render: renderVocabSuite,
    selectSource: selectSource,
    switchSubTab: switchVocabSubTab,
    getState: getStateSnapshot
  };
})();
