/**
 * StudySnap — Trình phân tích & chuyển đổi Google Form sang cấu trúc Bài luyện tập StudySnap
 * Hỗ trợ:
 * - Câu hỏi Trắc nghiệm (Multiple Choice / Dropdown / Checkboxes) -> multiple_choice / listening_mc
 * - Câu hỏi Trả lời ngắn / Đoạn văn (Short Answer / Paragraph) -> short_answer
 * - Tự động tách danh sách đánh số nhiều câu trong cùng 1 ô (ví dụ: 1. ____én 2. ____én ... 20. ____ē)
 * - Trích xuất Video YouTube bài nghe & Hình ảnh đề bài (kèm gọt trùng tiêu đề câu con)
 */

(function (root) {
  'use strict';

  function isSupportedGoogleFormUrl(rawUrl) {
    const clean = String(rawUrl || '').trim();
    if (!clean) return false;
    try {
      const parsed = new URL(clean);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      const host = parsed.hostname.toLowerCase();
      if (host === 'forms.gle') {
        return parsed.pathname.length > 1;
      }
      if (host === 'docs.google.com') {
        return /^\/forms\//i.test(parsed.pathname);
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  function extractYouTubeId(rawInput) {
    const clean = String(rawInput || '').trim();
    if (!clean) return '';
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
    try {
      const u = new URL(clean);
      const host = u.hostname.toLowerCase().replace(/^www\./, '');
      if (host === 'youtu.be') {
        const seg = u.pathname.replace(/^\/+/, '').split('/')[0];
        return /^[a-zA-Z0-9_-]{11}$/.test(seg) ? seg : '';
      }
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        const vParam = u.searchParams.get('v');
        if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;
        const pathMatch = u.pathname.match(/^\/(?:embed|shorts|v|live)\/([a-zA-Z0-9_-]{11})/i);
        if (pathMatch) return pathMatch[1];
      }
    } catch (e) {
      const m = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
      if (m) return m[1];
    }
    return '';
  }

  function decodeHtmlEntities(str) {
    return String(str || '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/gi, "'");
  }

  function extractFormImageUrlsFromHtml(html) {
    const out = [];
    const seen = {};
    const regex = /<img[^>]+src=["'](https:\/\/docs\.google\.com\/forms-images-rt\/[^"']+)["']/gi;
    let match;
    while ((match = regex.exec(String(html || ''))) !== null) {
      const url = decodeHtmlEntities(match[1]);
      if (!seen[url]) {
        seen[url] = true;
        out.push(url);
      }
    }
    return out;
  }

  function parseGoogleFormPublicLoadData(htmlOrJson, sourceUrl) {
    let rawData = htmlOrJson;
    let htmlImgUrls = [];

    if (typeof htmlOrJson === 'string') {
      const trimmed = htmlOrJson.trim();
      if (trimmed.indexOf('<') >= 0 && trimmed.indexOf('FB_PUBLIC_LOAD_DATA_') >= 0) {
        htmlImgUrls = extractFormImageUrlsFromHtml(trimmed);
        const dataMatch = trimmed.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]*?);\s*<\/script>/);
        if (!dataMatch) {
          throw new Error('Không tìm thấy dữ liệu công khai (FB_PUBLIC_LOAD_DATA_) trong Google Form.');
        }
        rawData = JSON.parse(dataMatch[1]);
      } else {
        rawData = JSON.parse(trimmed);
      }
    }

    if (!Array.isArray(rawData) || !Array.isArray(rawData[1])) {
      throw new Error('Định dạng dữ liệu Google Form không hợp lệ.');
    }

    const formMeta = rawData[1];
    const title = String(formMeta[8] || rawData[3] || '').trim() || 'Bài kiểm tra Google Form';
    const description = String(formMeta[0] || '').trim();
    const rawItems = Array.isArray(formMeta[1]) ? formMeta[1] : [];

    let imgCursor = 0;
    const items = rawItems.map(function (it) {
      const qBlocks = Array.isArray(it && it[4]) ? it[4] : [];
      const primaryBlock = qBlocks[0] || [];
      const rawOptions = Array.isArray(primaryBlock[1]) ? primaryBlock[1] : [];
      const options = rawOptions
        .map(function (opt) {
          return opt && opt[0] !== undefined && opt[0] !== null ? String(opt[0]).trim() : '';
        })
        .filter(function (v) { return v !== ''; });

      const videoBlock = Array.isArray(it && it[6]) ? it[6] : null;
      const youtubeId =
        videoBlock && typeof videoBlock[3] === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(videoBlock[3])
          ? videoBlock[3]
          : '';

      const imgBlock = Array.isArray(it && it[9]) ? it[9] : null;
      const imageId = imgBlock && imgBlock[0] && typeof imgBlock[0][0] === 'string' ? imgBlock[0][0] : '';
      let imageUrl = '';
      if (imageId && htmlImgUrls[imgCursor]) {
        imageUrl = htmlImgUrls[imgCursor];
        imgCursor++;
      }

      return {
        id: it && it[0] !== undefined ? String(it[0]) : '',
        title: String((it && it[1]) || ''),
        desc: String((it && it[2]) || ''),
        rawType: Number(it && it[3]),
        options: options,
        youtubeId: youtubeId,
        youtubeUrl: youtubeId ? ('https://www.youtube.com/watch?v=' + youtubeId) : '',
        imageId: imageId,
        imageUrl: imageUrl
      };
    });

    return {
      sourceUrl: String(sourceUrl || ''),
      title: title,
      description: description,
      items: items
    };
  }

  function normalizeWhitespacePreserveBreaks(str) {
    return String(str || '')
      .replace(/[\u00a0\u2000-\u200b\u3000]/g, ' ')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function isStudentIdentityQuestion(it) {
    if (!it || it.rawType !== 0) return false;
    const text = normalizeWhitespacePreserveBreaks(it.title + ' ' + it.desc).toLowerCase();
    return /(?:họ\s*(?:và\s*)?tên|tên của bạn|tên học sinh|tên em là|your name|full name|student name|你的名字|姓名|lớp của bạn)/i.test(text);
  }

  function extractNumberedSubQuestions(rawText) {
    const clean = normalizeWhitespacePreserveBreaks(rawText);
    if (!clean) return null;

    const markerRegex = /(?:^|[\s])(\d{1,2})\.\s*(?=[^\s\d])/g;
    const matches = [];
    let m;
    while ((m = markerRegex.exec(clean)) !== null) {
      const num = parseInt(m[1], 10);
      const numStr = m[1];
      const dotPos = m.index + m[0].indexOf(numStr);
      matches.push({ num: num, start: dotPos, fullMatch: m[0] });
    }
    if (matches.length < 3) return null;

    // Locate longest contiguous sequence 1, 2, 3...
    let seqStartIdx = -1;
    let seq = [];
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].num !== 1) continue;
      const candidate = [matches[i]];
      let expected = 2;
      for (let j = i + 1; j < matches.length; j++) {
        if (matches[j].num === expected) {
          candidate.push(matches[j]);
          expected++;
        }
      }
      if (candidate.length > seq.length) {
        seq = candidate;
        seqStartIdx = i;
      }
    }
    if (seqStartIdx < 0 || seq.length < 3) return null;

    const leadText = clean.slice(0, seq[0].start).trim();
    const rawItems = [];
    let trailingNote = '';

    for (let k = 0; k < seq.length; k++) {
      const start = seq[k].start;
      const end = k + 1 < seq.length ? seq[k + 1].start : clean.length;
      let chunk = clean.slice(start, end).trim();
      if (k === seq.length - 1) {
        const noteIdx = chunk.search(/\n\s*(?:\(|Cách\s+ghi|Lưu\s*ý|Ghi\s+chú)/i);
        if (noteIdx >= 0) {
          trailingNote = chunk.slice(noteIdx).trim();
          chunk = chunk.slice(0, noteIdx).trim();
        } else {
          const parenIdx = chunk.search(/\s+\((?:Chỉ\s+cần|Nếu\s+|Thanh\s+\d|Cách\s+ghi|Viết\s+)/i);
          if (parenIdx >= 0) {
            trailingNote = chunk.slice(parenIdx).trim();
            chunk = chunk.slice(0, parenIdx).trim();
          }
        }
      }
      rawItems.push(chunk);
    }

    return {
      leadText: leadText,
      items: rawItems,
      trailingNote: trailingNote
    };
  }

  function cleanTrailingNoteForSplitInputs(noteStr) {
    let s = normalizeWhitespacePreserveBreaks(noteStr);
    if (!s) return '';
    s = s.replace(/,?\s*mỗi\s+đáp\s+án\s+(?:ghi\s+)?cách\s+nhau\s+bởi\s+dấu\s+phẩy[^)]*/gi, '');
    s = s.replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').replace(/\s+\)/g, ')').trim();
    return s;
  }

  function splitSectionHeadingAndInstructions(rawTitle, rawDesc, stripSplitHint) {
    const cleanTitle = normalizeWhitespacePreserveBreaks(rawTitle);
    const extracted = extractNumberedSubQuestions(cleanTitle);
    const baseText = extracted ? extracted.leadText : cleanTitle;
    const rawNote = extracted && extracted.trailingNote ? extracted.trailingNote : '';
    const noteTail = stripSplitHint ? cleanTrailingNoteForSplitInputs(rawNote) : rawNote;

    const lines = baseText
      .split('\n')
      .map(function (l) { return l.trim(); })
      .filter(Boolean);

    const heading = lines[0] || 'Phần câu hỏi';
    const descParts = lines.slice(1);
    const rawExtraDesc = normalizeWhitespacePreserveBreaks(rawDesc);
    const cleanExtraDesc = stripSplitHint ? cleanTrailingNoteForSplitInputs(rawExtraDesc) : rawExtraDesc;
    if (cleanExtraDesc) descParts.push(cleanExtraDesc);
    if (noteTail && descParts.indexOf(noteTail) < 0) descParts.push(noteTail);

    return {
      title: heading,
      description: descParts.join(' — ')
    };
  }

  function extractShortQuestionPrompt(it, currentSection) {
    const title = normalizeWhitespacePreserveBreaks(it && it.title);
    const desc = normalizeWhitespacePreserveBreaks(it && it.desc);

    if (desc && /^\d{1,2}\.\s*\S/.test(desc)) {
      return desc;
    }

    const lines = title.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (lines.length >= 2) {
      const lastLine = lines[lines.length - 1];
      if (/^\d{1,2}\.\s*\S/.test(lastLine)) {
        return lastLine;
      }
    }

    if (title && desc && currentSection && currentSection.title && title.indexOf(currentSection.title.replace(/^[IVX]+\.\s*/i, '')) >= 0) {
      return desc;
    }

    if (title && desc) {
      return title.split('\n')[0].trim() + (desc ? (' (' + desc + ')') : '');
    }
    return title || desc || 'Câu trả lời';
  }

  function inferLessonTagFromFormTitle(title) {
    const clean = String(title || '').trim();
    const baiMatch = clean.match(/bài\s*(\d+)/i);
    if (baiMatch) return 'Bài ' + baiMatch[1];
    const testMatch = clean.match(/test\s*(\d+)/i);
    if (testMatch) return 'Test ' + testMatch[1];
    const unitMatch = clean.match(/(?:unit|lesson)\s*(\d+)/i);
    if (unitMatch) return 'Bài ' + unitMatch[1];
    return 'Google Form';
  }

  function isLikelyListeningHeader(title, desc, hasYoutube) {
    if (hasYoutube) return true;
    const text = (String(title || '') + ' ' + String(desc || '')).toLowerCase();
    return /听录音|听一听|listen|nghe\s/.test(text);
  }

  function buildSectionsFromGoogleForm(parsedForm) {
    const rawItems = Array.isArray(parsedForm && parsedForm.items) ? parsedForm.items : [];
    const baseTs = Date.now();
    const sections = [];
    let pendingMeta = null;
    let skippedIdentityQuestions = 0;

    function resolveImageValue(it) {
      if (!it) return '';
      return String(it.imageDataUrl || it.imageUrl || '').trim();
    }

    function pushNewSection(type, meta) {
      const secNum = sections.length + 1;
      const prefix =
        type === 'listening_mc'
          ? 'sec_gf_listen_'
          : type === 'multiple_choice'
          ? 'sec_gf_mc_'
          : 'sec_gf_sa_';
      const sec = {
        section_id: prefix + baseTs + '_' + secNum,
        section_num: secNum,
        type: type,
        title: (meta && meta.title) || ('Phần ' + secNum),
        description: (meta && meta.description) || '',
        max_score: 0,
        data: {
          items: []
        }
      };

      const imgVal = meta && meta.image_url ? String(meta.image_url).trim() : '';
      const ytId = meta && meta.youtube_id ? String(meta.youtube_id).trim() : '';

      if (type === 'listening_mc') {
        sec.data.listening_mode = 'shared';
        sec.data.context_label = 'Bài nghe';
        sec.data.context_title = sec.title;
        sec.data.context_subtitle = sec.description || 'Nghe bài và chọn đáp án chính xác nhất.';
        sec.data.audio_label = 'Audio ' + secNum;
        sec.data.audio_url = '';
        sec.data.audio_duration = '01:00';
      }

      if (imgVal) sec.data.image_url = imgVal;
      if (ytId) {
        sec.data.youtube_id = ytId;
        sec.data.youtube_url = 'https://www.youtube.com/watch?v=' + ytId;
      }

      sections.push(sec);
      return sec;
    }

    rawItems.forEach(function (it, idx) {
      if (!it) return;
      if (isStudentIdentityQuestion(it)) {
        skippedIdentityQuestions++;
        return;
      }

      const rawType = Number(it.rawType);
      const itemImg = resolveImageValue(it);
      const itemYtId = String(it.youtubeId || extractYouTubeId(it.youtubeUrl) || '').trim();

      // Media / Section Header items (Type 6: Title/Desc, Type 8: Page break, Type 11: Image, Type 12: YouTube video)
      if (rawType === 6 || rawType === 8 || rawType === 11 || rawType === 12) {
        const headingInfo = splitSectionHeadingAndInstructions(it.title, it.desc);
        if (!pendingMeta) {
          pendingMeta = {
            title: headingInfo.title,
            description: headingInfo.description,
            image_url: itemImg,
            youtube_id: itemYtId
          };
        } else {
          if (headingInfo.title && headingInfo.title !== 'Phần câu hỏi') {
            pendingMeta.title = headingInfo.title;
          }
          if (headingInfo.description) {
            pendingMeta.description = pendingMeta.description
              ? (pendingMeta.description + ' — ' + headingInfo.description)
              : headingInfo.description;
          }
          if (itemImg) pendingMeta.image_url = itemImg;
          if (itemYtId) pendingMeta.youtube_id = itemYtId;
        }
        return;
      }

      // Choice questions: Type 2 (Multiple Choice), 3 (Dropdown), 4 (Checkboxes -> map choices if <= 4 or multiple)
      if (rawType === 2 || rawType === 3 || rawType === 4) {
        const opts = Array.isArray(it.options) ? it.options.slice(0, 6) : [];
        const hasPendingMedia = Boolean(pendingMeta && (pendingMeta.youtube_id || pendingMeta.image_url));
        const activeMeta = pendingMeta || splitSectionHeadingAndInstructions(it.title, '');
        const useListening = isLikelyListeningHeader(
          (activeMeta && activeMeta.title) || it.title,
          (activeMeta && activeMeta.description) || it.desc,
          Boolean((activeMeta && activeMeta.youtube_id) || itemYtId)
        );
        const targetType = useListening ? 'listening_mc' : 'multiple_choice';
        const lastSec = sections[sections.length - 1];

        let targetSec;
        if (!pendingMeta && !itemImg && !itemYtId && lastSec && lastSec.type === targetType) {
          targetSec = lastSec;
        } else {
          targetSec = pushNewSection(targetType, {
            title: activeMeta.title || (useListening ? 'Phần nghe hiểu' : 'Phần trắc nghiệm'),
            description: activeMeta.description || (useListening ? 'Nghe và chọn đáp án đúng.' : 'Chọn đáp án chính xác nhất.'),
            image_url: (pendingMeta && pendingMeta.image_url) || itemImg,
            youtube_id: (pendingMeta && pendingMeta.youtube_id) || itemYtId
          });
          pendingMeta = null;
        }

        const qNum = targetSec.data.items.length + 1;
        const mcItem = {
          id: (targetType === 'listening_mc' ? 'LS_' : 'MC_') + baseTs + '_' + idx + '_' + qNum,
          prompt: normalizeWhitespacePreserveBreaks(it.title) || ('Câu ' + qNum),
          speakWord: '',
          options: opts.length >= 2 ? opts : [opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || ''],
          correctIndex: 0,
          explanation: ''
        };
        if (itemImg && (!hasPendingMedia && targetSec.data.image_url !== itemImg)) {
          mcItem.image_url = itemImg;
        }
        targetSec.data.items.push(mcItem);
        targetSec.max_score = targetSec.data.items.length;
        return;
      }

      // Short answer / Paragraph (Type 0 or Type 1)
      if (rawType === 0 || rawType === 1) {
        const numberedBundle = extractNumberedSubQuestions(it.title);
        if (numberedBundle && numberedBundle.items.length >= 3) {
          const leadHeading = splitSectionHeadingAndInstructions(numberedBundle.leadText, it.desc, true);
          const cleanedTrail = cleanTrailingNoteForSplitInputs(numberedBundle.trailingNote);
          const mergedMeta = {
            title: (pendingMeta && pendingMeta.title) || leadHeading.title || 'Phần điền ngắn',
            description:
              (pendingMeta && pendingMeta.description) ||
              leadHeading.description ||
              cleanedTrail ||
              '',
            image_url: (pendingMeta && pendingMeta.image_url) || itemImg,
            youtube_id: (pendingMeta && pendingMeta.youtube_id) || itemYtId
          };
          if (cleanedTrail && mergedMeta.description.indexOf(cleanedTrail) < 0) {
            mergedMeta.description = mergedMeta.description
              ? (mergedMeta.description + ' — ' + cleanedTrail)
              : cleanedTrail;
          }

          const sec = pushNewSection('short_answer', mergedMeta);
          pendingMeta = null;
          numberedBundle.items.forEach(function (subPrompt, subIdx) {
            sec.data.items.push({
              id: 'SA_' + baseTs + '_' + idx + '_' + (subIdx + 1),
              prompt: subPrompt,
              hint: '',
              mode: 'manual',
              accepted: [],
              grading_note: '',
              explanation: ''
            });
          });
          sec.max_score = sec.data.items.length;
          return;
        }

        const lastSec = sections[sections.length - 1];
        const firstTitleLine = normalizeWhitespacePreserveBreaks(it.title).split('\n')[0].trim();
        let targetSec = null;

        if (pendingMeta) {
          targetSec = pushNewSection('short_answer', pendingMeta);
          targetSec.data._sourceFirstLine = firstTitleLine;
          pendingMeta = null;
        } else if (
          itemImg ||
          !lastSec ||
          lastSec.type !== 'short_answer' ||
          (lastSec.data._sourceFirstLine && firstTitleLine && lastSec.data._sourceFirstLine !== firstTitleLine)
        ) {
          const splitHeader = splitSectionHeadingAndInstructions(it.title, itemImg ? it.desc : '');
          targetSec = pushNewSection('short_answer', {
            title: splitHeader.title,
            description: splitHeader.description,
            image_url: itemImg,
            youtube_id: itemYtId
          });
          targetSec.data._sourceFirstLine = firstTitleLine;
        } else {
          targetSec = lastSec;
        }

        const qCount = targetSec.data.items.length + 1;
        let promptText = extractShortQuestionPrompt(it, targetSec);
        let hintText = '';

        // If this section is an image-based prompt like Read & Guess where item itself opened the section
        if (targetSec.data.image_url && qCount === 1 && normalizeWhitespacePreserveBreaks(it.title).indexOf(targetSec.title) === 0) {
          promptText = 'Nhập đáp án thứ tự hình từ trái sang phải';
          const exampleMatch = normalizeWhitespacePreserveBreaks(it.title + ' ' + it.desc).match(/ví\s*dụ\s*:?\s*([^\)\n]+)/i);
          if (exampleMatch) {
            hintText = 'Ví dụ: ' + exampleMatch[1].trim();
          }
        } else if (
          qCount === 1 &&
          !targetSec.data.youtube_id &&
          normalizeWhitespacePreserveBreaks(it.title).indexOf(targetSec.title) === 0 &&
          targetSec.description
        ) {
          const parenHint = normalizeWhitespacePreserveBreaks(it.title + '\n' + it.desc).match(/\([^)]*ví\s*dụ[^)]*\)/i);
          if (parenHint) {
            promptText = parenHint[0];
          }
        }

        targetSec.data.items.push({
          id: 'SA_' + baseTs + '_' + idx + '_' + qCount,
          prompt: promptText,
          hint: hintText,
          mode: 'manual',
          accepted: [],
          grading_note: '',
          explanation: ''
        });
        targetSec.max_score = targetSec.data.items.length;
      }
    });

    // Clean internal helper properties
    let totalItems = 0;
    let totalScore = 0;
    sections.forEach(function (sec, idx) {
      sec.section_num = idx + 1;
      if (sec.data && Object.prototype.hasOwnProperty.call(sec.data, '_sourceFirstLine')) {
        delete sec.data._sourceFirstLine;
      }
      const cnt = sec.data && Array.isArray(sec.data.items) ? sec.data.items.length : 0;
      sec.max_score = Math.max(1, Number(sec.max_score || cnt || 1));
      totalItems += cnt;
      totalScore += sec.max_score;
    });

    return {
      title: String((parsedForm && parsedForm.title) || 'Bài kiểm tra Google Form'),
      suggestedLessonTag: inferLessonTagFromFormTitle(parsedForm && parsedForm.title),
      totalItems: totalItems,
      totalScore: totalScore,
      skippedIdentityQuestions: skippedIdentityQuestions,
      sections: sections
    };
  }

  const api = {
    isSupportedGoogleFormUrl: isSupportedGoogleFormUrl,
    extractYouTubeId: extractYouTubeId,
    extractFormImageUrlsFromHtml: extractFormImageUrlsFromHtml,
    parseGoogleFormPublicLoadData: parseGoogleFormPublicLoadData,
    extractNumberedSubQuestions: extractNumberedSubQuestions,
    buildSectionsFromGoogleForm: buildSectionsFromGoogleForm
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.StudySnapGoogleForm = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
