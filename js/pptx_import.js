/**
 * StudySnap PPTX Practice Importer
 * - Đọc file PowerPoint (.pptx) trực tiếp trên trình duyệt (ZIP + OOXML XML, giữ tọa độ từng khung chữ).
 * - Tự động nhận diện đoạn luyện tập cuối buổi ("LUYỆN TẬP CUỐI BÀI", "ĐÁP ÁN / 参考答案", "TỔNG KẾT / 自我评价").
 * - Ghép trọn vẹn cả 5 dạng bài của StudySnap: Nối từ, Trắc nghiệm (A/B/C hoặc A/B/C/D), Điền từ, Sửa câu sai, Dịch câu.
 * - Đồng thời hỗ trợ phân tích văn bản sao chép từ slide khi giáo viên muốn dán nhanh.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.StudySnapPptx = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  const CJK_RE = /[\u4e00-\u9fff]/;
  const PINYIN_DIACRITIC_RE = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/i;

  function decodeXmlEntities(str) {
    return String(str || '').replace(/&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g, function (_, ent) {
      if (ent === 'amp') return '&';
      if (ent === 'lt') return '<';
      if (ent === 'gt') return '>';
      if (ent === 'quot') return '"';
      if (ent === 'apos') return "'";
      if (ent.indexOf('#x') === 0 || ent.indexOf('#X') === 0) {
        const cp = parseInt(ent.slice(2), 16);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
      }
      if (ent.charAt(0) === '#') {
        const cp = parseInt(ent.slice(1), 10);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
      }
      return _;
    });
  }

  function parseXmlAttrs(attrStr) {
    const attrs = {};
    if (!attrStr) return attrs;
    const re = /([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let m;
    while ((m = re.exec(attrStr)) !== null) {
      const fullName = m[1];
      const val = decodeXmlEntities(m[2] !== undefined ? m[2] : m[3]);
      attrs[fullName] = val;
      const colonIdx = fullName.indexOf(':');
      if (colonIdx >= 0) {
        attrs[fullName.slice(colonIdx + 1)] = val;
      }
    }
    return attrs;
  }

  function localTagName(tag) {
    const idx = tag.indexOf(':');
    return idx >= 0 ? tag.slice(idx + 1) : tag;
  }

  /**
   * Lightweight dependency-free XML tree parser (consistent across Browser & Node tests).
   */
  function parseXml(xmlText) {
    const cleaned = String(xmlText || '')
      .replace(/<\?[\s\S]*?\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<!DOCTYPE[\s\S]*?>/gi, '');

    const root = { tag: '#root', localName: '#root', attrs: {}, children: [], text: '' };
    const stack = [root];
    const tokenRe = /<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[A-Za-z_][\w:.-]*\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
    let match;

    while ((match = tokenRe.exec(cleaned)) !== null) {
      const top = stack[stack.length - 1];
      if (match[5] !== undefined) {
        const textVal = decodeXmlEntities(match[5]);
        if (textVal) top.text += textVal;
        continue;
      }

      const isClosing = match[1] === '/';
      const tagName = match[2];
      const attrStr = match[3] || '';
      const selfClosing = match[4] === '/';

      if (isClosing) {
        const targetLocal = localTagName(tagName);
        for (let i = stack.length - 1; i >= 1; i--) {
          if (stack[i].tag === tagName || stack[i].localName === targetLocal) {
            stack.length = i;
            break;
          }
        }
        continue;
      }

      const node = {
        tag: tagName,
        localName: localTagName(tagName),
        attrs: parseXmlAttrs(attrStr),
        children: [],
        text: ''
      };
      top.children.push(node);
      if (!selfClosing) {
        stack.push(node);
      }
    }

    return root;
  }

  function findChild(node, localName) {
    if (!node || !node.children) return null;
    for (let i = 0; i < node.children.length; i++) {
      if (node.children[i].localName === localName) return node.children[i];
    }
    return null;
  }

  function findChildren(node, localName) {
    const out = [];
    if (!node || !node.children) return out;
    for (let i = 0; i < node.children.length; i++) {
      if (node.children[i].localName === localName) out.push(node.children[i]);
    }
    return out;
  }

  function findDescendants(node, localName) {
    const out = [];
    if (!node || !node.children) return out;
    const queue = node.children.slice();
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur.localName === localName) out.push(cur);
      if (cur.children && cur.children.length > 0) {
        for (let i = cur.children.length - 1; i >= 0; i--) {
          queue.unshift(cur.children[i]);
        }
      }
    }
    return out;
  }

  function collectParagraphText(pNode) {
    let buf = '';
    function walk(n) {
      if (!n) return;
      if (n.localName === 'br') {
        buf += '\n';
        return;
      }
      if (n.localName === 'tab') {
        buf += '\t';
        return;
      }
      if (n.localName === 't') {
        if (n.text) buf += n.text;
        return;
      }
      if (n.children) {
        for (let i = 0; i < n.children.length; i++) walk(n.children[i]);
      }
    }
    walk(pNode);
    return buf;
  }

  function extractTxBodyLines(txBodyNode) {
    if (!txBodyNode) return [];
    const lines = [];
    const pNodes = findChildren(txBodyNode, 'p');
    pNodes.forEach(function (p) {
      const raw = collectParagraphText(p);
      raw.split('\n').forEach(function (part) {
        const cleaned = part.replace(/\u00a0/g, ' ').replace(/\s+$/g, '');
        if (cleaned.trim()) lines.push(cleaned.trim());
      });
    });
    return lines;
  }

  async function inflateRawBytes(compressedBytes, customInflateRaw) {
    if (typeof customInflateRaw === 'function') {
      return customInflateRaw(compressedBytes);
    }
    if (typeof DecompressionStream === 'function') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      const readPromise = new Response(ds.readable).arrayBuffer();
      const writePromise = writer.write(compressedBytes).then(function () {
        return writer.close();
      });
      const results = await Promise.all([readPromise, writePromise]);
      return new Uint8Array(results[0]);
    }
    throw new Error('Trình duyệt không hỗ trợ giải nén deflate-raw cho file .pptx.');
  }

  function normalizeZipPath(rawPath) {
    const parts = String(rawPath || '').replace(/\\/g, '/').split('/');
    const stack = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!p || p === '.') continue;
      if (p === '..') stack.pop();
      else stack.push(p);
    }
    return stack.join('/');
  }

  function shouldExtractPptxEntry(name) {
    if (!name) return false;
    return (
      name === 'ppt/presentation.xml' ||
      name === 'ppt/_rels/presentation.xml.rels' ||
      /^ppt\/slides\/slide\d+\.xml$/i.test(name) ||
      /^ppt\/slides\/_rels\/slide\d+\.xml\.rels$/i.test(name)
    );
  }

  /**
   * Read needed OOXML entries from a .pptx ArrayBuffer / Uint8Array without external dependencies.
   */
  async function readZipEntries(inputBuffer, opts) {
    const options = opts || {};
    const bytes = inputBuffer instanceof Uint8Array
      ? inputBuffer
      : new Uint8Array(inputBuffer && inputBuffer.buffer ? inputBuffer.buffer.slice(inputBuffer.byteOffset || 0, (inputBuffer.byteOffset || 0) + inputBuffer.byteLength) : inputBuffer);

    if (bytes.length < 22) {
      throw new Error('Tệp không phải định dạng .pptx hợp lệ (dung lượng quá nhỏ).');
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocdOffset = -1;
    const minScan = Math.max(0, bytes.length - 65558);
    for (let i = bytes.length - 22; i >= minScan; i--) {
      if (
        bytes[i] === 0x50 &&
        bytes[i + 1] === 0x4b &&
        bytes[i + 2] === 0x05 &&
        bytes[i + 3] === 0x06
      ) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset < 0) {
      if (typeof window !== 'undefined' && window.JSZip && typeof window.JSZip.loadAsync === 'function') {
        const zip = await window.JSZip.loadAsync(bytes);
        const out = {};
        const names = Object.keys(zip.files).filter(shouldExtractPptxEntry);
        for (let j = 0; j < names.length; j++) {
          out[names[j]] = await zip.files[names[j]].async('string');
        }
        return out;
      }
      throw new Error('Không tìm thấy cấu trúc ZIP của file .pptx (lưu ý chỉ hỗ trợ .pptx, không hỗ trợ .ppt cũ).');
    }

    const cdTotalEntries = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);
    const utf8Decoder = new TextDecoder('utf-8');
    const textEntries = {};

    let ptr = cdOffset;
    for (let idx = 0; idx < cdTotalEntries && ptr + 46 <= bytes.length; idx++) {
      if (view.getUint32(ptr, true) !== 0x02014b50) break;

      const method = view.getUint16(ptr + 10, true);
      const compressedSize = view.getUint32(ptr + 20, true);
      const nameLen = view.getUint16(ptr + 28, true);
      const extraLen = view.getUint16(ptr + 30, true);
      const commentLen = view.getUint16(ptr + 32, true);
      const localHeaderOffset = view.getUint32(ptr + 42, true);

      const entryName = utf8Decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
      ptr += 46 + nameLen + extraLen + commentLen;

      if (options.filter && !options.filter(entryName)) continue;
      if (!options.filter && !shouldExtractPptxEntry(entryName)) continue;

      if (localHeaderOffset + 30 > bytes.length) continue;
      if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) continue;

      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const slice = bytes.subarray(dataStart, dataStart + compressedSize);

      let plainBytes;
      if (method === 0) {
        plainBytes = slice;
      } else if (method === 8) {
        plainBytes = await inflateRawBytes(slice, options.inflateRaw);
      } else {
        continue;
      }

      textEntries[entryName] = utf8Decoder.decode(plainBytes);
    }

    return textEntries;
  }

  function readXfrmBox(spPrNode) {
    if (!spPrNode) return null;
    const xfrm = findChild(spPrNode, 'xfrm');
    if (!xfrm) return null;
    const off = findChild(xfrm, 'off');
    const ext = findChild(xfrm, 'ext');
    const chOff = findChild(xfrm, 'chOff');
    const chExt = findChild(xfrm, 'chExt');
    return {
      x: off ? Number(off.attrs.x || 0) : 0,
      y: off ? Number(off.attrs.y || 0) : 0,
      w: ext ? Number(ext.attrs.cx || 0) : 0,
      h: ext ? Number(ext.attrs.cy || 0) : 0,
      chX: chOff ? Number(chOff.attrs.x || 0) : 0,
      chY: chOff ? Number(chOff.attrs.y || 0) : 0,
      chW: chExt ? Number(chExt.attrs.cx || 0) : 0,
      chH: chExt ? Number(chExt.attrs.cy || 0) : 0
    };
  }

  function applyGroupTransform(box, t) {
    if (!box) return { x: t.offX, y: t.offY, w: 0, h: 0 };
    const sx = t.scaleX;
    const sy = t.scaleY;
    return {
      x: t.offX + (box.x - t.chX) * sx,
      y: t.offY + (box.y - t.chY) * sy,
      w: box.w * sx,
      h: box.h * sy
    };
  }

  function extractSlideShapes(slideXmlText, slideSize) {
    const root = parseXml(slideXmlText);
    const sldW = (slideSize && slideSize.cx) || 12192000;
    const sldH = (slideSize && slideSize.cy) || 6858000;
    const spTree = findDescendants(root, 'spTree')[0];
    const items = [];

    function walkTree(container, transform) {
      if (!container || !container.children) return;
      for (let i = 0; i < container.children.length; i++) {
        const ch = container.children[i];
        if (ch.localName === 'sp') {
          const spPr = findChild(ch, 'spPr');
          const rawBox = readXfrmBox(spPr);
          const absBox = applyGroupTransform(rawBox, transform);
          const txBody = findChild(ch, 'txBody');
          const lines = extractTxBodyLines(txBody);
          if (lines.length === 0) continue;

          const nx = (absBox.x / sldW) * 100;
          const ny = (absBox.y / sldH) * 100;
          const nw = (absBox.w / sldW) * 100;
          const nh = (absBox.h / sldH) * 100;
          items.push({
            kind: 'shape',
            nx: nx,
            ny: ny,
            nw: nw,
            nh: nh,
            cx: nx + nw / 2,
            cy: ny + nh / 2,
            lines: lines,
            text: lines.join('\n')
          });
        } else if (ch.localName === 'grpSp') {
          const grpPr = findChild(ch, 'grpSpPr');
          const gBox = readXfrmBox(grpPr);
          if (gBox) {
            const absG = applyGroupTransform(gBox, transform);
            const nextTransform = {
              offX: absG.x,
              offY: absG.y,
              chX: gBox.chX,
              chY: gBox.chY,
              scaleX: gBox.chW > 0 ? absG.w / gBox.chW : transform.scaleX,
              scaleY: gBox.chH > 0 ? absG.h / gBox.chH : transform.scaleY
            };
            walkTree(ch, nextTransform);
          } else {
            walkTree(ch, transform);
          }
        } else if (ch.localName === 'graphicFrame') {
          const xfrm = findChild(ch, 'xfrm');
          let fBox = null;
          if (xfrm) {
            const off = findChild(xfrm, 'off');
            const ext = findChild(xfrm, 'ext');
            fBox = applyGroupTransform(
              {
                x: off ? Number(off.attrs.x || 0) : 0,
                y: off ? Number(off.attrs.y || 0) : 0,
                w: ext ? Number(ext.attrs.cx || 0) : sldW * 0.8,
                h: ext ? Number(ext.attrs.cy || 0) : sldH * 0.4
              },
              transform
            );
          } else {
            fBox = { x: sldW * 0.08, y: sldH * 0.25, w: sldW * 0.84, h: sldH * 0.5 };
          }
          const tbls = findDescendants(ch, 'tbl');
          tbls.forEach(function (tbl) {
            const rows = findChildren(tbl, 'tr');
            const rowCount = Math.max(1, rows.length);
            rows.forEach(function (tr, rIdx) {
              const cells = findChildren(tr, 'tc');
              const cellCount = Math.max(1, cells.length);
              const rowY = ((fBox.y + (fBox.h * (rIdx + 0.5)) / rowCount) / sldH) * 100;
              const rowH = ((fBox.h / rowCount) / sldH) * 100;
              cells.forEach(function (tc, cIdx) {
                const txBody = findChild(tc, 'txBody');
                const lines = extractTxBodyLines(txBody);
                if (lines.length === 0) return;
                const cellX = ((fBox.x + (fBox.w * cIdx) / cellCount) / sldW) * 100;
                const cellW = ((fBox.w / cellCount) / sldW) * 100;
                items.push({
                  kind: 'table-cell',
                  nx: cellX,
                  ny: rowY - rowH / 2,
                  nw: cellW,
                  nh: rowH,
                  cx: cellX + cellW / 2,
                  cy: rowY,
                  lines: lines,
                  text: lines.join('\n')
                });
              });
            });
          });
        }
      }
    }

    walkTree(spTree, { offX: 0, offY: 0, chX: 0, chY: 0, scaleX: 1, scaleY: 1 });
    items.sort(function (a, b) {
      if (Math.abs(a.ny - b.ny) > 1.8) return a.ny - b.ny;
      return a.nx - b.nx;
    });
    return items;
  }

  function isFooterChromeShape(sh) {
    if (!sh || sh.ny < 86) return false;
    const clean = sh.text.trim();
    if (/^\d{1,3}$/.test(clean)) return true;
    if (/lớp\s*tiếng\s*trung|小课堂|giáo\s*trình/i.test(clean)) return true;
    return false;
  }

  function cleanShapeLines(lines) {
    return (lines || [])
      .map(function (ln) {
        return String(ln || '').replace(/\t+/g, '   ').trim();
      })
      .filter(function (ln) {
        if (!ln) return false;
        if (ln === '→' || ln === '|') return false;
        if (/^sửa\s*lại\s*:?$/i.test(ln)) return false;
        return true;
      });
  }

  function normalizeSlideShapes(rawShapes) {
    const kept = [];
    (rawShapes || []).forEach(function (sh) {
      if (isFooterChromeShape(sh)) return;
      const lines = cleanShapeLines(sh.lines);
      if (lines.length === 0) return;
      kept.push({
        kind: sh.kind || 'shape',
        nx: sh.nx,
        ny: sh.ny,
        nw: sh.nw,
        nh: sh.nh,
        cx: sh.cx,
        cy: sh.cy,
        lines: lines,
        text: lines.join('\n')
      });
    });
    return kept;
  }

  function orderSlidesFromEntries(textEntries) {
    const presXml = textEntries['ppt/presentation.xml'];
    const presRelsXml = textEntries['ppt/_rels/presentation.xml.rels'];
    let slideSize = { cx: 12192000, cy: 6858000 };
    const orderedPaths = [];

    if (presXml) {
      const presRoot = parseXml(presXml);
      const sldSz = findDescendants(presRoot, 'sldSz')[0];
      if (sldSz && sldSz.attrs.cx && sldSz.attrs.cy) {
        slideSize = {
          cx: Number(sldSz.attrs.cx) || 12192000,
          cy: Number(sldSz.attrs.cy) || 6858000
        };
      }

      const relMap = {};
      if (presRelsXml) {
        const relRoot = parseXml(presRelsXml);
        findDescendants(relRoot, 'Relationship').forEach(function (rel) {
          if (rel.attrs.Id && rel.attrs.Target) {
            const target = rel.attrs.Target.indexOf('ppt/') === 0
              ? rel.attrs.Target
              : normalizeZipPath('ppt/' + rel.attrs.Target);
            relMap[rel.attrs.Id] = target;
          }
        });
      }

      findDescendants(presRoot, 'sldId').forEach(function (sldId) {
        const rid = sldId.attrs['r:id'] || sldId.attrs.id || '';
        const target = relMap[rid];
        if (target && textEntries[target]) {
          orderedPaths.push(target);
        }
      });
    }

    if (orderedPaths.length === 0) {
      Object.keys(textEntries)
        .filter(function (k) {
          return /^ppt\/slides\/slide\d+\.xml$/i.test(k);
        })
        .sort(function (a, b) {
          const na = parseInt((a.match(/slide(\d+)\.xml/i) || [])[1] || '0', 10);
          const nb = parseInt((b.match(/slide(\d+)\.xml/i) || [])[1] || '0', 10);
          return na - nb;
        })
        .forEach(function (k) {
          orderedPaths.push(k);
        });
    }

    return orderedPaths.map(function (slidePath, idx) {
      const rawShapes = extractSlideShapes(textEntries[slidePath], slideSize);
      const shapes = normalizeSlideShapes(rawShapes);
      return {
        slideNumber: idx + 1,
        path: slidePath,
        shapes: shapes,
        text: shapes.map(function (s) { return s.text; }).join('\n')
      };
    });
  }

  function classifySlide(slide) {
    const txt = String((slide && slide.text) || '');
    const topShapes = ((slide && slide.shapes) || []).filter(function (s) {
      return s.ny < 30;
    });
    const topText = topShapes.map(function (s) { return s.text; }).join('\n') || txt.split('\n').slice(0, 6).join('\n');

    const hasEndPracticeKicker = /luyện\s*tập\s*cuối\s*bài/i.test(topText);
    const isMidLessonVocabApp = /sinh\s*từ|生词应用|ứng\s*dụng\s*từ\s*vựng|nhấp\s*chuột\s*để\s*hiện\s*đáp\s*án/i.test(txt);
    const hasPracticePartHeading = /练习[一二三四五1-5]|bài\s*[1-5]\s*[\.\:]\s*(nối\s*từ|trắc\s*nghiệm|điền\s*từ|tìm\s*lỗi|sửa\s*câu|dịch)/i.test(topText);

    const isAnswerSlide = /(?:^|\n)\s*đáp\s*án(?:\s|$)|参考答案/i.test(topText) && !/ứng\s*dụng\s*từ\s*vựng/i.test(topText);
    const isSummarySlide = /tổng\s*kết|自我评价|bảng\s*điểm\s*\(/i.test(topText);

    let role = 'lesson';
    if (isAnswerSlide) {
      role = 'answer';
    } else if (isSummarySlide) {
      role = 'summary';
    } else if ((hasEndPracticeKicker || hasPracticePartHeading) && !isMidLessonVocabApp) {
      role = 'question';
    }

    let sectionKind = '';
    if (role === 'question') {
      if (/练习一|连线|nối\s*từ/i.test(topText)) sectionKind = 'matching';
      else if (/练习二|选择|trắc\s*nghiệm/i.test(topText)) sectionKind = 'multiple_choice';
      else if (/练习三|填空|điền\s*từ/i.test(topText)) sectionKind = 'fill_blank_wordbank';
      else if (/练习四|改错|tìm\s*lỗi|sửa\s*câu/i.test(topText)) sectionKind = 'error_correction';
      else if (/练习五|翻译|dịch/i.test(topText)) sectionKind = 'translation';
      else if (/\n\s*A[\.\)]\s+.+\n\s*B[\.\)]\s+/m.test(txt)) sectionKind = 'multiple_choice';
    }

    return {
      slideNumber: slide.slideNumber,
      role: role,
      sectionKind: sectionKind,
      headerSummary: topText.replace(/\s+/g, ' ').trim().slice(0, 90)
    };
  }

  function extractDeckMeta(slides, fileName) {
    let lessonTag = '';
    let lessonTitle = '';
    const firstFew = (slides || []).slice(0, 3);
    for (let i = 0; i < firstFew.length; i++) {
      const s = firstFew[i];
      const matchTag = s.text.match(/\b(Bài\s*\d+)\b/i);
      if (matchTag && !lessonTag) {
        lessonTag = 'Bài ' + matchTag[1].replace(/[^0-9]/g, '');
      }
      const lines = s.text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      for (let j = 0; j < lines.length; j++) {
        const ln = lines[j];
        if (/Bài\s*\d+\s*·\s*(.+)/i.test(ln) && !lessonTitle) {
          lessonTitle = ln.replace(/^Bài\s*\d+\s*·\s*/i, '').trim();
          break;
        }
      }
    }

    if (!lessonTag && fileName) {
      const fnTag = String(fileName).match(/b[àa]i\s*(\d+)|hsk\s*\d*\s*[-_ ]*b?(\d+)/i);
      if (fnTag) {
        lessonTag = 'Bài ' + (fnTag[1] || fnTag[2]);
      }
    }
    if (!lessonTag) lessonTag = 'Bài mới';

    const cleanFileBase = String(fileName || '')
      .replace(/\.pptx$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    let suggestedTitle = 'Bài luyện tập cuối buổi — ' + lessonTag;
    if (lessonTitle) {
      suggestedTitle += ' (' + lessonTitle.slice(0, 60) + ')';
    } else if (cleanFileBase) {
      suggestedTitle = 'Bài luyện tập cuối buổi — ' + cleanFileBase;
    }

    return {
      lessonTag: lessonTag,
      lessonTitle: lessonTitle,
      suggestedTitle: suggestedTitle
    };
  }

  function detectDefaultQuizRange(slides) {
    const classified = (slides || []).map(classifySlide);
    const qIndices = [];
    const ansIndices = [];
    const sumIndices = [];

    classified.forEach(function (c, i) {
      if (c.role === 'question') qIndices.push(i);
      else if (c.role === 'answer') ansIndices.push(i);
      else if (c.role === 'summary') sumIndices.push(i);
    });

    if (qIndices.length > 0) {
      const firstQ = qIndices[0];
      let lastRelevant = qIndices[qIndices.length - 1];
      ansIndices.forEach(function (ai) {
        if (ai > firstQ) lastRelevant = Math.max(lastRelevant, ai);
      });
      sumIndices.forEach(function (si) {
        if (si > firstQ && si <= lastRelevant + 2) lastRelevant = Math.max(lastRelevant, si);
      });
      return {
        startSlide: slides[firstQ].slideNumber,
        endSlide: slides[lastRelevant].slideNumber,
        classified: classified,
        autoDetected: true
      };
    }

    if (ansIndices.length > 0) {
      return {
        startSlide: slides[ansIndices[0]].slideNumber,
        endSlide: slides[ansIndices[ansIndices.length - 1]].slideNumber,
        classified: classified,
        autoDetected: true
      };
    }

    const total = slides.length;
    const span = Math.min(12, Math.max(1, Math.ceil(total * 0.2)));
    return {
      startSlide: slides[Math.max(0, total - span)].slideNumber,
      endSlide: slides[total - 1].slideNumber,
      classified: classified,
      autoDetected: false
    };
  }

  function stripEndingPunctVariants(str) {
    const clean = String(str || '').trim();
    if (!clean) return [];
    const out = [clean];
    const noPunct = clean.replace(/[。！？\.!\?]+$/g, '').trim();
    if (noPunct && out.indexOf(noPunct) < 0) out.push(noPunct);
    return out;
  }

  function splitChineseAndPinyin(rawText) {
    const txt = String(rawText || '').replace(/\s+/g, ' ').trim();
    if (!txt) return { hanzi: '', pinyin: '' };
    const m = txt.match(/^(.+?[\u4e00-\u9fff\u3000-\u303f\uff00-\uffefA-Za-z0-9]*)\s+([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s'’·-]+)$/);
    if (m && CJK_RE.test(m[1])) {
      return { hanzi: m[1].trim(), pinyin: m[2].trim() };
    }
    const lines = String(rawText || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (lines.length >= 2 && CJK_RE.test(lines[0]) && !CJK_RE.test(lines[1])) {
      return { hanzi: lines[0], pinyin: lines.slice(1).join(' ') };
    }
    const cjkChars = txt.match(/[\u4e00-\u9fff]+/g);
    if (cjkChars && cjkChars.length > 0) {
      const idx = txt.lastIndexOf(cjkChars[cjkChars.length - 1]) + cjkChars[cjkChars.length - 1].length;
      const head = txt.slice(0, idx).trim();
      const tail = txt.slice(idx).trim();
      return { hanzi: head, pinyin: tail };
    }
    return { hanzi: txt, pinyin: '' };
  }

  function clusterShapesByRow(shapes, tolerancePct) {
    const tol = tolerancePct || 3.6;
    const sorted = (shapes || []).slice().sort(function (a, b) {
      return a.cy - b.cy;
    });
    const rows = [];
    sorted.forEach(function (sh) {
      const last = rows[rows.length - 1];
      if (last && Math.abs(sh.cy - last.avgCy) <= tol) {
        last.items.push(sh);
        last.avgCy = last.items.reduce(function (s, x) { return s + x.cy; }, 0) / last.items.length;
      } else {
        rows.push({ avgCy: sh.cy, items: [sh] });
      }
    });
    rows.forEach(function (r) {
      r.items.sort(function (a, b) { return a.nx - b.nx; });
    });
    return rows;
  }

  function isSlideHeaderShape(sh) {
    if (!sh) return false;
    if (sh.ny < 22) return true;
    if (sh.ny < 30 && /^Nối mỗi từ|Mỗi câu dưới đây|Dịch các câu sau/i.test(sh.text.trim())) {
      return true;
    }
    return false;
  }

  // ---- SECTION PARSER 1: MATCHING ----
  function parseMatchingQuestionSlide(slide) {
    const bodyShapes = (slide.shapes || []).filter(function (s) {
      return !isSlideHeaderShape(s);
    });
    const leftShapes = bodyShapes.filter(function (s) { return s.cx < 50; });
    const rightShapes = bodyShapes.filter(function (s) { return s.cx >= 50; });

    const leftRows = clusterShapesByRow(leftShapes, 3.8);
    const rightRows = clusterShapesByRow(rightShapes, 3.8);

    const leftItems = [];
    leftRows.forEach(function (row) {
      const joined = row.items.map(function (s) { return s.text; }).join(' ');
      if (/^\d+\s*[\t\s]/.test(joined) || /^\d+$/.test(row.items[0].text.trim())) {
        const numMatch = joined.match(/^\s*(\d{1,2})(?:\s*[\.\)]\s*|\s+)(.+)$/s);
        if (numMatch) {
          const id = parseInt(numMatch[1], 10);
          const pair = splitChineseAndPinyin(numMatch[2].replace(/\n+/g, ' '));
          leftItems.push({ id: id, hanzi: pair.hanzi, pinyin: pair.pinyin });
        }
      }
    });

    // Multi-line fallback inside tall textboxes if row clustering yielded < 2
    if (leftItems.length < 2) {
      const flatLeftLines = [];
      leftShapes.forEach(function (s) { s.lines.forEach(function (l) { flatLeftLines.push(l); }); });
      for (let i = 0; i < flatLeftLines.length; i++) {
        const line = flatLeftLines[i].trim();
        const mInline = line.match(/^(\d{1,2})(?:\s*[\.\)]\s*|\s+)(.+)$/);
        if (mInline && !/^\d+$/.test(mInline[2])) {
          const pair = splitChineseAndPinyin(mInline[2]);
          leftItems.push({ id: parseInt(mInline[1], 10), hanzi: pair.hanzi, pinyin: pair.pinyin });
        } else if (/^\d{1,2}$/.test(line) && i + 1 < flatLeftLines.length) {
          const id = parseInt(line, 10);
          const next = flatLeftLines[i + 1].trim();
          let rawVal = next;
          if (i + 2 < flatLeftLines.length && !/^\d{1,2}$/.test(flatLeftLines[i + 2].trim()) && !CJK_RE.test(flatLeftLines[i + 2])) {
            rawVal += '\n' + flatLeftLines[i + 2].trim();
            i += 2;
          } else {
            i += 1;
          }
          const pair = splitChineseAndPinyin(rawVal);
          leftItems.push({ id: id, hanzi: pair.hanzi, pinyin: pair.pinyin });
        }
      }
    }

    const rightItems = [];
    rightRows.forEach(function (row) {
      const joined = row.items.map(function (s) { return s.text; }).join(' ');
      const mLetter = joined.match(/^\s*([A-Z])(?:\s*[\.\)]\s*|\s+)(.+)$/s);
      if (mLetter) {
        rightItems.push({ id: mLetter[1].toUpperCase(), text: mLetter[2].replace(/\s+/g, ' ').trim() });
      }
    });

    if (rightItems.length < 2) {
      const flatRightLines = [];
      rightShapes.forEach(function (s) { s.lines.forEach(function (l) { flatRightLines.push(l); }); });
      for (let i = 0; i < flatRightLines.length; i++) {
        const line = flatRightLines[i].trim();
        const mInline = line.match(/^([A-Z])(?:\s*[\.\)]\s*|\s+)(.+)$/);
        if (mInline) {
          rightItems.push({ id: mInline[1].toUpperCase(), text: mInline[2].trim() });
        } else if (/^[A-Z]$/.test(line) && i + 1 < flatRightLines.length) {
          rightItems.push({ id: line, text: flatRightLines[i + 1].trim() });
          i += 1;
        }
      }
    }

    leftItems.sort(function (a, b) { return a.id - b.id; });
    rightItems.sort(function (a, b) { return a.id.localeCompare(b.id); });

    const descShape = (slide.shapes || []).find(function (s) {
      return s.ny >= 20 && s.ny < 30 && /nối mỗi từ/i.test(s.text);
    });

    return {
      title: 'Phần 1: Nối từ với nghĩa đúng',
      description: descShape ? descShape.text.replace(/\s+/g, ' ').trim() : 'Nối mỗi từ ở cột trái với nghĩa tiếng Việt tương ứng ở cột phải.',
      left: leftItems,
      right: rightItems
    };
  }

  // ---- SECTION PARSER 2: MULTIPLE CHOICE ----
  function parseMcBlockText(lines) {
    const joined = lines.map(function (l) { return String(l || '').trim(); }).filter(Boolean).join('\n');
    const qMatch = joined.match(/^\s*(\d{1,2})\s*[\.、\)]\s*([\s\S]+)$/);
    if (!qMatch) return null;
    const num = parseInt(qMatch[1], 10);
    const body = qMatch[2];

    const optMatches = [];
    const optRe = /(?:^|\n|\s{2,})([A-D])\s*[\.、\)]\s*([\s\S]*?)(?=(?:\n|\s{2,})[A-D]\s*[\.、\)]\s*|$)/g;
    let om;
    while ((om = optRe.exec(body)) !== null) {
      optMatches.push({
        letter: om[1].toUpperCase(),
        text: om[2].replace(/\s+/g, ' ').trim(),
        index: om.index
      });
    }

    if (optMatches.length < 2) return null;
    const prompt = body.slice(0, optMatches[0].index).replace(/\s+/g, ' ').trim();
    const options = optMatches.map(function (o) { return o.text; });
    if (!prompt) return null;

    return {
      num: num,
      id: 'MC' + num,
      prompt: prompt,
      options: options,
      correctIndex: 0,
      explanation: ''
    };
  }

  function parseMcQuestionSlides(mcSlides) {
    const items = [];
    (mcSlides || []).forEach(function (slide) {
      const bodyShapes = (slide.shapes || []).filter(function (s) {
        return !isSlideHeaderShape(s);
      });

      const consumed = new Set();
      bodyShapes.forEach(function (sh, idx) {
        if (consumed.has(idx)) return;
        const parsed = parseMcBlockText(sh.lines);
        if (parsed) {
          consumed.add(idx);
          items.push(parsed);
          return;
        }

        // Handle split shapes where prompt is in one textbox and options A/B/C are sibling shapes below in the same column
        if (/^\s*\d{1,2}\s*[\.、\)]\s*.+/.test(sh.text.trim())) {
          const siblingLines = sh.lines.slice();
          for (let j = idx + 1; j < bodyShapes.length; j++) {
            const sib = bodyShapes[j];
            if (Math.abs(sib.cx - sh.cx) > 28) continue;
            if (sib.ny < sh.ny - 1) continue;
            if (/^\s*\d{1,2}\s*[\.、\)]\s*.+/.test(sib.text.trim())) break;
            if (/^[A-D]\s*[\.、\)]/m.test(sib.text)) {
              sib.lines.forEach(function (l) { siblingLines.push(l); });
              consumed.add(j);
            }
          }
          const combined = parseMcBlockText(siblingLines);
          if (combined) {
            consumed.add(idx);
            items.push(combined);
          }
        }
      });
    });

    items.sort(function (a, b) { return a.num - b.num; });
    return items.map(function (it) {
      return {
        id: it.id,
        num: it.num,
        prompt: it.prompt,
        options: it.options,
        correctIndex: it.correctIndex,
        explanation: it.explanation
      };
    });
  }

  // ---- SECTION PARSER 3: FILL BLANK WORDBANK ----
  function parseFillBlankSlide(slide) {
    const bodyShapes = (slide.shapes || []).filter(function (s) {
      return !isSlideHeaderShape(s);
    });

    const wordbank = [];
    const wordbankShapes = [];
    const itemShapes = [];

    // Identify where numbered items begin vertically
    let firstNumberNy = 100;
    bodyShapes.forEach(function (sh) {
      if (sh.ny >= 26 && (/^\s*\d{1,2}\s*$/.test(sh.text.trim()) || /^\s*\d{1,2}\s+.*_{2,}/.test(sh.text.trim()))) {
        firstNumberNy = Math.min(firstNumberNy, sh.ny);
      }
    });

    bodyShapes.forEach(function (sh) {
      const t = sh.text.trim();
      if (/^Chọn từ cho sẵn\s*:?$/i.test(t)) return;
      if (sh.ny < firstNumberNy - 1 && sh.ny < 40 && !/^\d{1,2}$/.test(t)) {
        wordbankShapes.push(sh);
      } else {
        itemShapes.push(sh);
      }
    });

    wordbankShapes.sort(function (a, b) { return a.nx - b.nx; });
    wordbankShapes.forEach(function (sh) {
      const cleaned = sh.text.replace(/^Chọn từ cho sẵn\s*:\s*/i, '').trim();
      if (!cleaned) return;
      if (cleaned.indexOf('\t') >= 0 || /\s{2,}/.test(cleaned)) {
        cleaned.split(/\t|\s{2,}/).forEach(function (tok) {
          if (tok.trim() && wordbank.indexOf(tok.trim()) < 0) wordbank.push(tok.trim());
        });
      } else if (wordbank.indexOf(cleaned) < 0) {
        wordbank.push(cleaned);
      }
    });

    // Split into 2 columns ONLY if a second column actually starts on the right half (nx >= 46%),
    // so full-width single-column cards (starting at nx ~ 11% with center ~ 51%) stay paired with their left number badge!
    const hasTwoColumns = itemShapes.some(function (s) { return s.nx >= 46; });
    const colSplits = hasTwoColumns
      ? [
          itemShapes.filter(function (s) { return s.nx < 46; }),
          itemShapes.filter(function (s) { return s.nx >= 46; })
        ]
      : [itemShapes];

    const parsedItems = [];
    colSplits.forEach(function (colShapes) {
      if (colShapes.length === 0) return;
      const rows = clusterShapesByRow(colShapes, 4.5);
      rows.forEach(function (row) {
        const combinedLines = [];
        row.items.forEach(function (sh) {
          sh.lines.forEach(function (ln) { combinedLines.push(ln); });
        });
        if (combinedLines.length === 0) return;

        let num = null;
        let startIdx = 0;
        if (/^\d{1,2}$/.test(combinedLines[0])) {
          num = parseInt(combinedLines[0], 10);
          startIdx = 1;
        } else {
          const inlineNum = combinedLines[0].match(/^(\d{1,2})(?:\s*[\.\)]\s*|\s+)(.+)$/);
          if (inlineNum) {
            num = parseInt(inlineNum[1], 10);
            combinedLines[0] = inlineNum[2].trim();
          }
        }
        if (!num) return;

        const bodyLines = combinedLines.slice(startIdx).filter(Boolean);
        let textLine = bodyLines[0] || '';
        const hintLines = bodyLines.slice(1);
        textLine = textLine.replace(/_{2,}|（[\s\u3000]*）|\(\s*\)/g, '____').trim();

        parsedItems.push({
          num: num,
          id: 'FB' + num,
          text: textLine,
          hint: hintLines.join(' ').trim(),
          answer: ''
        });
      });
    });

    parsedItems.sort(function (a, b) { return a.num - b.num; });

    return {
      wordbank: wordbank,
      items: parsedItems
    };
  }

  // ---- SECTION PARSER 4: ERROR CORRECTION ----
  function parseErrorCorrectionSlide(slide) {
    const bodyShapes = (slide.shapes || []).filter(function (s) {
      return !isSlideHeaderShape(s) && s.cx < 58;
    });
    const descShape = (slide.shapes || []).find(function (s) {
      return s.ny >= 20 && s.ny < 30 && /một lỗi|sửa lại cho đúng|hãy viết lại/i.test(s.text);
    });

    const rows = clusterShapesByRow(bodyShapes, 5.2);
    const items = [];
    rows.forEach(function (row) {
      const lines = [];
      row.items.forEach(function (sh) {
        sh.lines.forEach(function (ln) { lines.push(ln); });
      });
      if (lines.length === 0) return;

      let num = null;
      let startIdx = 0;
      if (/^\d{1,2}$/.test(lines[0])) {
        num = parseInt(lines[0], 10);
        startIdx = 1;
      } else {
        const m = lines[0].match(/^(\d{1,2})(?:\s*[\.\)]\s*|\s+)(.+)$/);
        if (m) {
          num = parseInt(m[1], 10);
          lines[0] = m[2].trim();
        }
      }
      if (!num) return;

      const content = lines.slice(startIdx).filter(Boolean);
      const wrong = content[0] || '';
      const sitLine = content.slice(1).join(' ').replace(/^Tình huống\s*:\s*/i, '').trim();

      items.push({
        num: num,
        id: 'ERR' + num,
        wrong: wrong,
        situation: sitLine,
        accepted: [],
        explanation: ''
      });
    });

    items.sort(function (a, b) { return a.num - b.num; });
    return {
      description: descShape ? descShape.text.replace(/\s+/g, ' ').trim() : 'Mỗi câu dưới đây có MỘT lỗi sai. Hãy viết lại câu đúng.',
      items: items
    };
  }

  // ---- SECTION PARSER 5: TRANSLATION ----
  function parseTranslationSlide(slide) {
    const bodyShapes = (slide.shapes || []).filter(function (s) {
      return !isSlideHeaderShape(s) && s.cx < 58;
    });
    const descShape = (slide.shapes || []).find(function (s) {
      return s.ny >= 20 && s.ny < 30 && /dịch các câu/i.test(s.text);
    });

    const rows = clusterShapesByRow(bodyShapes, 5.2);
    const items = [];
    rows.forEach(function (row) {
      const lines = [];
      row.items.forEach(function (sh) {
        sh.lines.forEach(function (ln) { lines.push(ln); });
      });
      if (lines.length === 0) return;

      let num = null;
      let startIdx = 0;
      if (/^\d{1,2}$/.test(lines[0])) {
        num = parseInt(lines[0], 10);
        startIdx = 1;
      } else {
        const m = lines[0].match(/^(\d{1,2})(?:\s*[\.\)]\s*|\s+)(.+)$/);
        if (m) {
          num = parseInt(m[1], 10);
          lines[0] = m[2].trim();
        }
      }
      if (!num) return;

      const content = lines.slice(startIdx).filter(Boolean);
      const promptParts = [];
      let dir = '';
      content.forEach(function (ln) {
        if (/dịch\s*sang\s*tiếng\s*việt/i.test(ln)) {
          dir = 'zh->vi';
        } else if (/dịch\s*sang\s*tiếng\s*trung/i.test(ln)) {
          dir = 'vi->zh';
        } else {
          promptParts.push(ln);
        }
      });

      const prompt = promptParts.join(' ').trim();
      if (!dir) {
        dir = CJK_RE.test(prompt) && !/[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i.test(prompt) ? 'zh->vi' : 'vi->zh';
      }

      items.push({
        num: num,
        id: 'TR' + num,
        direction: dir,
        prompt: prompt
      });
    });

    items.sort(function (a, b) { return a.num - b.num; });
    return {
      description: descShape ? descShape.text.replace(/\s+/g, ' ').trim() : 'Dịch các câu sau theo đúng tình huống.',
      items: items
    };
  }

  // ---- ANSWER SLIDES EXTRACTOR ----
  function splitAnswerSlideBlocks(ansSlides) {
    const blocks = {
      matching: [],
      multiple_choice: [],
      fill_blank_wordbank: [],
      error_correction: [],
      translation: []
    };

    function detectKindFromHeader(text) {
      if (/Bài\s*1\b|Nối\s*từ/i.test(text)) return 'matching';
      if (/Bài\s*2\b|Trắc\s*nghiệm/i.test(text)) return 'multiple_choice';
      if (/Bài\s*3\b|Điền\s*từ/i.test(text)) return 'fill_blank_wordbank';
      if (/Bài\s*4\b|Sửa\s*câu\s*sai|Tìm\s*lỗi/i.test(text)) return 'error_correction';
      if (/Bài\s*5\b|Dịch/i.test(text)) return 'translation';
      return '';
    }

    (ansSlides || []).forEach(function (slide) {
      const subShapes = (slide.shapes || []).filter(function (s) {
        return !/^ĐÁP ÁN$|^参考答案/i.test(s.text.trim()) && s.ny >= 20;
      });
      if (subShapes.length === 0) return;

      const leftKindShape = subShapes.find(function (s) { return s.cx < 50 && /^Bài\s*[1-5]\b/i.test(s.text.trim()); });
      const rightKindShape = subShapes.find(function (s) { return s.cx >= 50 && /^Bài\s*[1-5]\b/i.test(s.text.trim()); });

      if (leftKindShape && rightKindShape) {
        const lKind = detectKindFromHeader(leftKindShape.text);
        const rKind = detectKindFromHeader(rightKindShape.text);
        const leftBody = subShapes.filter(function (s) { return s.cx < 50 && s !== leftKindShape; });
        const rightBody = subShapes.filter(function (s) { return s.cx >= 50 && s !== rightKindShape; });
        if (lKind) blocks[lKind] = blocks[lKind].concat(leftBody);
        if (rKind) blocks[rKind] = blocks[rKind].concat(rightBody);
        return;
      }

      const fullHeader = subShapes.find(function (s) { return /^Bài\s*[1-5]\b/i.test(s.text.trim()); });
      const kind = fullHeader ? detectKindFromHeader(fullHeader.text) : detectKindFromHeader(slide.text);
      if (kind) {
        blocks[kind] = blocks[kind].concat(subShapes.filter(function (s) { return s !== fullHeader; }));
      }
    });

    return blocks;
  }

  function parseMatchingAnswers(shapes) {
    const map = {};
    const extraPairs = [];
    const rows = clusterShapesByRow(shapes, 3.2);
    rows.forEach(function (row) {
      const joined = row.items.map(function (s) { return s.text; }).join('  ');
      joined.split('\n').forEach(function (line) {
        const m = line.trim().match(/^(\d{1,2})\s*[–—\-:\.]\s*([A-Z])(?:\s+(.*))?$/i);
        if (m) {
          const num = parseInt(m[1], 10);
          const letter = m[2].toUpperCase();
          map[String(num)] = letter;
          if (m[3]) {
            const parts = m[3].trim().split(/\t|\s{2,}/);
            extraPairs.push({
              num: num,
              letter: letter,
              hanzi: (parts[0] || '').trim(),
              meaning: parts.slice(1).join(' ').trim()
            });
          }
        }
      });
    });
    return { map: map, extraPairs: extraPairs };
  }

  function parseMcAnswers(shapes) {
    const map = {};
    const rows = clusterShapesByRow(shapes, 3.5);
    rows.forEach(function (row) {
      const joined = row.items.map(function (s) { return s.text; }).join(' ');
      joined.split('\n').forEach(function (line) {
        const m = line.trim().match(/^(\d{1,2})\s*[\.:\-\)]\s*([A-D])(?:\s+(.*))?$/i);
        if (m) {
          const num = parseInt(m[1], 10);
          const letter = m[2].toUpperCase();
          const tail = (m[3] || '').replace(/\s+/g, ' ').trim();
          map[num] = {
            letter: letter,
            correctIndex: 'ABCD'.indexOf(letter),
            tail: tail
          };
        }
      });
    });
    return map;
  }

  function parseFillBlankAnswers(shapes) {
    const map = {};
    const orderedWords = [];
    const rows = clusterShapesByRow(shapes, 3.8);
    rows.forEach(function (row) {
      const candidateLines = row.items.length === 1
        ? (row.items[0].lines || [])
        : [row.items.map(function (s) { return s.text.replace(/\n+/g, ' '); }).join('   ')];
      candidateLines.forEach(function (ln) {
        const m = String(ln || '').trim().match(/^(\d{1,2})(?:\s*[\.\)]\s*|\s+)(\S+)(?:\s+(.*))?$/);
        if (m) {
          const num = parseInt(m[1], 10);
          const ansWord = m[2].trim();
          const fullSentence = (m[3] || '').trim();
          map[num] = { answer: ansWord, fullSentence: fullSentence };
          if (orderedWords.indexOf(ansWord) < 0) orderedWords.push(ansWord);
        }
      });
    });
    return { map: map, orderedWords: orderedWords };
  }

  function parseNumberedBlocksFromShapes(shapes) {
    const allLines = [];
    const footerNotes = [];
    const rows = clusterShapesByRow(shapes, 4.0);
    rows.forEach(function (row) {
      const rowLines = [];
      row.items.forEach(function (sh) {
        sh.lines.forEach(function (ln) { rowLines.push(ln); });
      });
      const first = (rowLines[0] || '').trim();
      if (/^Lưu ý khi chấm\s*:/i.test(first)) {
        footerNotes.push(rowLines.join(' ').trim());
        return;
      }
      if (/^\d{1,2}$/.test(first) && rowLines.length > 1) {
        allLines.push(first + '. ' + rowLines.slice(1).join('\n'));
      } else if (/^\d{1,2}\s/.test(first) && rowLines.length > 1) {
        allLines.push(rowLines.join('\n'));
      } else {
        rowLines.forEach(function (l) {
          if (/^Lưu ý khi chấm\s*:/i.test(l.trim())) footerNotes.push(l.trim());
          else allLines.push(l);
        });
      }
    });

    const blocks = {};
    let currentNum = null;
    allLines.join('\n').split('\n').forEach(function (rawLine) {
      const ln = rawLine.trim();
      if (!ln) return;
      if (/^Lưu ý khi chấm\s*:/i.test(ln)) {
        footerNotes.push(ln);
        return;
      }
      const startMatch = ln.match(/^(\d{1,2})(?:\s*[\.\)]\s*|\s{2,}|\s+(?=[\u4e00-\u9fffA-Za-z]))(.+)$/);
      if (startMatch) {
        currentNum = parseInt(startMatch[1], 10);
        if (!blocks[currentNum]) blocks[currentNum] = [];
        blocks[currentNum].push(startMatch[2].trim());
      } else if (currentNum !== null) {
        blocks[currentNum].push(ln);
      }
    });

    return { blocks: blocks, footerNotes: footerNotes };
  }

  function expandAcceptedAlternatives(rawMainLine) {
    const clean = String(rawMainLine || '').trim();
    if (!clean) return [];
    const expandedParen = clean.replace(/\((?:hoặc|or)\s+([^)]+)\)/gi, ' / $1');
    const parts = expandedParen
      .split(/\s*(?:\/|\bhoặc\b)\s*/i)
      .map(function (s) { return s.replace(/\s+/g, ' ').trim(); })
      .filter(Boolean);
    const out = [];
    parts.forEach(function (p) {
      stripEndingPunctVariants(p).forEach(function (v) {
        if (v && out.indexOf(v) < 0) out.push(v);
      });
    });
    return out;
  }

  function parseErrorCorrectionAnswers(shapes) {
    const parsed = parseNumberedBlocksFromShapes(shapes);
    const map = {};
    Object.keys(parsed.blocks).forEach(function (k) {
      const lines = parsed.blocks[k];
      const mainLine = lines[0] || '';
      let accepted = [];
      let expParts = [];

      // If single line contains Chinese corrected sentence followed by multi-space / Vietnamese explanation
      const splitInline = mainLine.match(/^(.+?[\u4e00-\u9fff。！？\.!\?])\s{2,}(.+)$/);
      if (splitInline) {
        accepted = expandAcceptedAlternatives(splitInline[1]);
        expParts.push(splitInline[2].trim());
        if (lines.length > 1) expParts = expParts.concat(lines.slice(1));
      } else {
        accepted = expandAcceptedAlternatives(mainLine);
        expParts = lines.slice(1);
      }

      map[Number(k)] = {
        accepted: accepted,
        explanation: expParts.join(' ').trim()
      };
    });
    return map;
  }

  function parseTranslationAnswers(shapes) {
    const parsed = parseNumberedBlocksFromShapes(shapes);
    const map = {};
    Object.keys(parsed.blocks).forEach(function (k) {
      const lines = parsed.blocks[k];
      const mainLine = (lines[0] || '').trim();
      const restLines = lines.slice(1).join(' · ').trim();
      // Strip trailing pinyin after bullet `·` when author wrote "王老师，您好！ · Wáng lǎoshī..."
      const mainWithoutPinyin = mainLine.split(/\s*·\s*/)[0].trim();
      const accepted = expandAcceptedAlternatives(mainWithoutPinyin);
      const suggestedFull = lines.join(' — ').replace(/\s+/g, ' ').trim();
      map[Number(k)] = {
        accepted: accepted,
        suggestedMain: mainLine,
        suggestedDetail: restLines,
        suggestedFull: suggestedFull
      };
    });
    return {
      map: map,
      gradingNoteFooter: parsed.footerNotes.join(' ').trim()
    };
  }

  function extractRubricThresholds(summarySlides, computedTotalScore) {
    let veryGood = 0;
    let good = 0;
    (summarySlides || []).forEach(function (slide) {
      const txt = slide.text || '';
      const vgMatch = txt.match(/(\d+)\s*[–-]\s*\d+\s*điểm\s*:\s*Rất tốt/i);
      if (vgMatch) veryGood = parseInt(vgMatch[1], 10);
      const gMatch = txt.match(/(\d+)\s*[–-]\s*\d+\s*điểm\s*:\s*Khá/i);
      if (gMatch) good = parseInt(gMatch[1], 10);
    });
    const total = Number(computedTotalScore || 0);
    if (!good && total > 0) good = Math.max(1, Math.round(total * 0.7));
    if (!veryGood && total > 0) veryGood = Math.max(good, Math.round(total * 0.85));
    return { good: good || 25, very_good: veryGood || 31 };
  }

  /**
   * Build StudySnap sections from selected PPTX slides (Question slides + Answer slides + Rubric slides).
   */
  function buildSectionsFromSlides(selectedSlides, opts) {
    const options = opts || {};
    const translationMode = options.translationMode === 'exact' ? 'exact' : 'manual';
    const slides = (selectedSlides || []).slice();
    const classified = slides.map(classifySlide);

    const qMatchingSlides = [];
    const qMcSlides = [];
    const qFillSlides = [];
    const qErrSlides = [];
    const qTransSlides = [];
    const ansSlides = [];
    const summarySlides = [];

    slides.forEach(function (slide, i) {
      const cls = classified[i];
      if (cls.role === 'answer') {
        ansSlides.push(slide);
      } else if (cls.role === 'summary') {
        summarySlides.push(slide);
      } else if (cls.role === 'question') {
        if (cls.sectionKind === 'matching') qMatchingSlides.push(slide);
        else if (cls.sectionKind === 'multiple_choice') qMcSlides.push(slide);
        else if (cls.sectionKind === 'fill_blank_wordbank') qFillSlides.push(slide);
        else if (cls.sectionKind === 'error_correction') qErrSlides.push(slide);
        else if (cls.sectionKind === 'translation') qTransSlides.push(slide);
      }
    });

    const ansBlocks = splitAnswerSlideBlocks(ansSlides);
    const warnings = [];
    const sections = [];
    const baseTs = Date.now();
    let secSeq = 1;

    // 1. MATCHING
    if (qMatchingSlides.length > 0) {
      const mParsed = parseMatchingQuestionSlide(qMatchingSlides[0]);
      const mAns = parseMatchingAnswers(ansBlocks.matching);
      const ansMap = mAns.map;
      if (Object.keys(ansMap).length === 0) {
        warnings.push('Phần 1 (Nối từ): chưa tìm thấy đáp án ghép nối từ slide 参考答案 — hệ thống đặt ghép nối mặc định 1-A, hãy kiểm tra lại.');
        mParsed.left.forEach(function (lItem, idx) {
          if (mParsed.right[idx]) ansMap[String(lItem.id)] = mParsed.right[idx].id;
        });
      }
      if (mParsed.left.length > 0 && mParsed.right.length > 0) {
        const count = mParsed.left.length;
        sections.push({
          section_id: 'sec_pptx_match_' + baseTs + '_' + secSeq,
          section_num: secSeq,
          type: 'matching',
          title: 'Phần ' + secSeq + ': Nối từ với nghĩa đúng (' + count + ' điểm)',
          description: mParsed.description,
          max_score: count,
          data: {
            left: mParsed.left,
            right: mParsed.right,
            answer: ansMap
          }
        });
        secSeq++;
      }
    }

    // 2. MULTIPLE CHOICE
    if (qMcSlides.length > 0) {
      const mcItems = parseMcQuestionSlides(qMcSlides);
      const mcAnsMap = parseMcAnswers(ansBlocks.multiple_choice);
      let missingAns = 0;

      mcItems.forEach(function (it) {
        const ans = mcAnsMap[it.num];
        if (ans && ans.correctIndex >= 0 && ans.correctIndex < it.options.length) {
          it.correctIndex = ans.correctIndex;
          const chosenText = (it.options[it.correctIndex] || '').trim();
          const tail = ans.tail || '';
          const normChosen = chosenText.replace(/\s+/g, ' ').toLowerCase();
          const normTail = tail.replace(/\s+/g, ' ').toLowerCase();
          if (tail && normTail !== normChosen) {
            const parenNote = tail.match(/\(([^)]+)\)\s*$/);
            if (chosenText && tail.indexOf(chosenText) === 0 && parenNote) {
              it.explanation = parenNote[1].trim();
            } else {
              it.explanation = tail;
            }
          }
        } else {
          missingAns++;
        }
        delete it.num;
      });

      if (missingAns > 0) {
        warnings.push('Phần Trắc nghiệm có ' + missingAns + ' câu chưa ghép được đáp án đúng từ slide Đáp án.');
      }

      if (mcItems.length > 0) {
        sections.push({
          section_id: 'sec_pptx_mc_' + baseTs + '_' + secSeq,
          section_num: secSeq,
          type: 'multiple_choice',
          title: 'Phần ' + secSeq + ': Trắc nghiệm (' + mcItems.length + ' điểm)',
          description: 'Chọn đáp án chính xác nhất cho từng câu hỏi. Mỗi câu đúng được 1 điểm.',
          max_score: mcItems.length,
          shuffle_options: false,
          data: { items: mcItems }
        });
        secSeq++;
      }
    }

    // 3. FILL BLANK WORDBANK
    if (qFillSlides.length > 0) {
      const mergedWordbank = [];
      const mergedItems = [];
      qFillSlides.forEach(function (sl) {
        const fb = parseFillBlankSlide(sl);
        fb.wordbank.forEach(function (w) {
          if (mergedWordbank.indexOf(w) < 0) mergedWordbank.push(w);
        });
        fb.items.forEach(function (it) { mergedItems.push(it); });
      });

      const fbAns = parseFillBlankAnswers(ansBlocks.fill_blank_wordbank);
      let missingFb = 0;
      mergedItems.forEach(function (it) {
        const ansObj = fbAns.map[it.num];
        if (ansObj && ansObj.answer) {
          it.answer = ansObj.answer;
          if (mergedWordbank.indexOf(ansObj.answer) < 0) {
            mergedWordbank.push(ansObj.answer);
          }
        } else {
          missingFb++;
        }
        delete it.num;
      });

      if (missingFb > 0) {
        warnings.push('Phần Điền từ có ' + missingFb + ' câu chưa ghép được đáp án từ slide Đáp án.');
      }

      if (mergedItems.length > 0) {
        sections.push({
          section_id: 'sec_pptx_fill_' + baseTs + '_' + secSeq,
          section_num: secSeq,
          type: 'fill_blank_wordbank',
          title: 'Phần ' + secSeq + ': Điền từ vào chỗ trống (' + mergedItems.length + ' điểm)',
          description: 'Chọn từ thích hợp từ ngân hàng từ để điền vào chỗ trống "____". Mỗi câu đúng được 1 điểm.',
          max_score: mergedItems.length,
          data: {
            wordbank: mergedWordbank,
            items: mergedItems
          }
        });
        secSeq++;
      }
    }

    // 4. ERROR CORRECTION
    if (qErrSlides.length > 0) {
      let errDesc = '';
      const errItems = [];
      qErrSlides.forEach(function (sl) {
        const ep = parseErrorCorrectionSlide(sl);
        if (!errDesc && ep.description) errDesc = ep.description;
        ep.items.forEach(function (it) { errItems.push(it); });
      });

      const errAnsMap = parseErrorCorrectionAnswers(ansBlocks.error_correction);
      let missingErr = 0;
      errItems.forEach(function (it) {
        const ans = errAnsMap[it.num];
        if (ans && ans.accepted && ans.accepted.length > 0) {
          it.accepted = ans.accepted;
          it.explanation = ans.explanation || '';
        } else {
          missingErr++;
        }
        delete it.num;
      });

      if (missingErr > 0) {
        warnings.push('Phần Sửa câu sai có ' + missingErr + ' câu chưa tìm thấy đáp án sửa chuẩn.');
      }

      if (errItems.length > 0) {
        sections.push({
          section_id: 'sec_pptx_err_' + baseTs + '_' + secSeq,
          section_num: secSeq,
          type: 'error_correction',
          title: 'Phần ' + secSeq + ': Sửa câu sai (' + errItems.length + ' điểm)',
          description: errDesc || 'Mỗi câu dưới đây có một lỗi sai. Hãy viết lại câu đúng.',
          max_score: errItems.length,
          data: { items: errItems }
        });
        secSeq++;
      }
    }

    // 5. TRANSLATION
    if (qTransSlides.length > 0) {
      let trDesc = '';
      const trItems = [];
      qTransSlides.forEach(function (sl) {
        const tp = parseTranslationSlide(sl);
        if (!trDesc && tp.description) trDesc = tp.description;
        tp.items.forEach(function (it) { trItems.push(it); });
      });

      const trAns = parseTranslationAnswers(ansBlocks.translation);
      trItems.forEach(function (it) {
        const ans = trAns.map[it.num];
        const accepted = ans ? ans.accepted : [];
        const baseNote = ans ? ('Đáp án gợi ý: ' + ans.suggestedFull) : '';
        const fullNote = trAns.gradingNoteFooter ? (baseNote ? baseNote + ' | ' + trAns.gradingNoteFooter : trAns.gradingNoteFooter) : baseNote;

        it.mode = translationMode;
        it.accepted = accepted;
        it.grading_note = fullNote;
        it.explanation = translationMode === 'exact' && ans
          ? (ans.suggestedDetail || ans.suggestedMain || '')
          : '';
        delete it.num;
      });

      if (trItems.length > 0) {
        sections.push({
          section_id: 'sec_pptx_tr_' + baseTs + '_' + secSeq,
          section_num: secSeq,
          type: 'translation',
          title: 'Phần ' + secSeq + ': Dịch ứng dụng (' + trItems.length + ' điểm)',
          description: trDesc || 'Dịch các câu sau theo đúng tình huống.',
          max_score: trItems.length,
          data: { items: trItems }
        });
        secSeq++;
      }
    }

    const totalItems = sections.reduce(function (s, sec) {
      if (sec.type === 'matching') return s + (((sec.data && sec.data.left) || []).length);
      return s + (((sec.data && sec.data.items) || []).length);
    }, 0);
    const totalScore = sections.reduce(function (s, sec) {
      return s + Number(sec.max_score || 0);
    }, 0);

    const thresholds = extractRubricThresholds(summarySlides, totalScore);

    return {
      sections: sections,
      totalItems: totalItems,
      totalScore: totalScore,
      thresholds: thresholds,
      warnings: warnings,
      classifiedSlides: classified
    };
  }

  /**
   * High-level entry: read .pptx ArrayBuffer -> detect quiz slides -> build sections.
   */
  async function parsePptxArrayBuffer(arrayBuffer, opts) {
    const options = opts || {};
    const entries = await readZipEntries(arrayBuffer, {
      inflateRaw: options.inflateRaw
    });
    const slides = orderSlidesFromEntries(entries);
    if (slides.length === 0) {
      throw new Error('Không tìm thấy slide nào trong tệp .pptx.');
    }

    const meta = extractDeckMeta(slides, options.fileName);
    const rangeInfo = detectDefaultQuizRange(slides);
    const startSlide = Number(options.startSlide) >= 1 ? Math.min(slides.length, Number(options.startSlide)) : rangeInfo.startSlide;
    const endSlide = Number(options.endSlide) >= startSlide ? Math.min(slides.length, Number(options.endSlide)) : Math.max(startSlide, rangeInfo.endSlide);

    const selectedSlides = slides.filter(function (sl) {
      return sl.slideNumber >= startSlide && sl.slideNumber <= endSlide;
    });

    const built = buildSectionsFromSlides(selectedSlides, {
      translationMode: options.translationMode || 'manual'
    });

    return {
      totalSlides: slides.length,
      startSlide: startSlide,
      endSlide: endSlide,
      autoDetectedRange: rangeInfo.autoDetected,
      meta: meta,
      slides: slides,
      sections: built.sections,
      totalItems: built.totalItems,
      totalScore: built.totalScore,
      thresholds: built.thresholds,
      warnings: built.warnings,
      classifiedSlides: built.classifiedSlides
    };
  }

  return {
    parseXml: parseXml,
    readZipEntries: readZipEntries,
    extractSlideShapes: extractSlideShapes,
    orderSlidesFromEntries: orderSlidesFromEntries,
    classifySlide: classifySlide,
    detectDefaultQuizRange: detectDefaultQuizRange,
    extractDeckMeta: extractDeckMeta,
    buildSectionsFromSlides: buildSectionsFromSlides,
    parsePptxArrayBuffer: parsePptxArrayBuffer
  };
});
