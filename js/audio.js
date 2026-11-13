/**
 * StudySnap — Bộ xử lý Ghi âm Giọng nói (MediaRecorder), Tải file Audio/Video
 * & Trình phát Voice tương tác (Play/Pause, Tua đoạn cần nghe, -5s, Thời lượng 00:00 / 01:18)
 */

window.StudySnapAudio = (function () {
  let activeRecorder = null;
  let recordedChunks = [];
  let timerInterval = null;
  let startTime = 0;

  // Quản lý các phiên phát âm thanh tương tác (Play / Pause / Seek / Time readout)
  const playerSessions = {};
  const resolvedMediaCache = {};
  const inflightMediaFetches = {};
  const MEDIA_CACHE_NAME = 'studysnap-drive-media-v1';
  let activePlayerId = null;

  async function readBrowserCachedMedia(fileId) {
    if (!fileId || typeof caches === 'undefined') return '';
    try {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      const cached = await cache.match('https://studysnap-media-cache.local/drive/' + encodeURIComponent(fileId));
      if (!cached) return '';
      const blob = await cached.blob();
      if (!blob || blob.size === 0) return '';
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        return URL.createObjectURL(blob);
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  async function writeBrowserCachedMedia(fileId, blob) {
    if (!fileId || !blob || typeof caches === 'undefined' || typeof Response === 'undefined') return;
    try {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      const headers = { 'Content-Type': blob.type || 'audio/webm' };
      await cache.put(
        'https://studysnap-media-cache.local/drive/' + encodeURIComponent(fileId),
        new Response(blob, { status: 200, headers: headers })
      );
    } catch (e) {
      // Ignore cache quota errors
    }
  }

  async function dataUrlToBlob(dataUrl) {
    try {
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch (e) {
      return null;
    }
  }

  async function resolveDriveMediaSource(driveFileId) {
    if (!driveFileId) return '';
    if (resolvedMediaCache[driveFileId]) return resolvedMediaCache[driveFileId];
    if (inflightMediaFetches[driveFileId]) return await inflightMediaFetches[driveFileId];

    inflightMediaFetches[driveFileId] = (async function () {
      try {
        const cachedObjUrl = await readBrowserCachedMedia(driveFileId);
        if (cachedObjUrl) {
          resolvedMediaCache[driveFileId] = cachedObjUrl;
          return cachedObjUrl;
        }

        const canUseEdgeMedia =
          typeof window !== 'undefined' &&
          window.location &&
          /^https?:$/i.test(window.location.protocol) &&
          window.StudySnapStore &&
          typeof window.StudySnapStore.isUsingD1 === 'function' &&
          window.StudySnapStore.isUsingD1();

        if (canUseEdgeMedia) {
          try {
            const edgeRes = await fetch('/api?action=media&fileId=' + encodeURIComponent(driveFileId));
            const ct = String(edgeRes.headers.get('content-type') || '').toLowerCase();
            if (edgeRes.ok && ct.indexOf('application/json') === -1 && ct.indexOf('text/html') === -1) {
              const blob = await edgeRes.blob();
              if (blob && blob.size > 0) {
                await writeBrowserCachedMedia(driveFileId, blob);
                const objUrl =
                  typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
                    ? URL.createObjectURL(blob)
                    : '';
                if (objUrl) {
                  resolvedMediaCache[driveFileId] = objUrl;
                  return objUrl;
                }
              }
            }
          } catch (edgeErr) {
            // Fall through to GAS Drive Bridge getMedia
          }
        }

        const gasUrl =
          window.StudySnapStore && window.StudySnapStore.getGasUrl
            ? window.StudySnapStore.getGasUrl()
            : '';
        if (!gasUrl) return '';

        const fetchReq = fetch(gasUrl + '?action=getMedia&fileId=' + encodeURIComponent(driveFileId)).then(function (r) {
          return r.json();
        });
        const json = window.StudySnapLoading
          ? await window.StudySnapLoading.trackPromise('getMedia', fetchReq)
          : await fetchReq;

        if (json && json.ok && json.dataUrl) {
          const blob = await dataUrlToBlob(json.dataUrl);
          if (blob && blob.size > 0) {
            await writeBrowserCachedMedia(driveFileId, blob);
            if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
              const objUrl = URL.createObjectURL(blob);
              resolvedMediaCache[driveFileId] = objUrl;
              return objUrl;
            }
          }
          resolvedMediaCache[driveFileId] = json.dataUrl;
          return json.dataUrl;
        }
        return '';
      } catch (err) {
        return '';
      } finally {
        delete inflightMediaFetches[driveFileId];
      }
    })();

    return await inflightMediaFetches[driveFileId];
  }

  const PLAYER_ICONS = {
    play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>',
    rewind: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>'
  };

  function escapeAttr(val) {
    return String(val === undefined || val === null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDuration(seconds) {
    const safeSec = Math.max(0, Math.floor(Number(seconds) || 0));
    const mins = Math.floor(safeSec / 60);
    const secs = Math.floor(safeSec % 60);
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function parseDurationToSeconds(durationStr) {
    if (!durationStr) return 45;
    const clean = String(durationStr).trim();
    const parts = clean.split(':');
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10) || 0;
      const s = parseInt(parts[1], 10) || 0;
      return Math.max(1, m * 60 + s);
    }
    const num = parseFloat(clean);
    return isFinite(num) && num > 0 ? Math.round(num) : 45;
  }

  function extractDriveFileId(url) {
    if (!url || typeof url !== 'string') return '';
    if (url.indexOf('drive.google.com') === -1 && url.indexOf('docs.google.com') === -1) {
      return '';
    }
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return idMatch && idMatch[1] ? idMatch[1] : '';
  }

  /**
   * Tạo HTML cho Trình phát Voice tương tác (Play/Pause + Tua đoạn cần nghe + Thời lượng 00:00 / 01:18)
   * @param {Object} opts
   *   - id: mã định danh duy nhất cho trình phát
   *   - url: đường dẫn audio/video (data:, blob:, https:, hoặc demo:)
   *   - duration: chuỗi thời lượng (ví dụ: "01:18")
   *   - label: nhãn hiển thị (ví dụ: "Bài HS", "Voice GV", "Ghi âm bài nộp")
   *   - fallbackText: câu thoại dự phòng nếu là dữ liệu mẫu
   *   - lang: ngôn ngữ đọc ('zh-CN' hoặc 'vi-VN')
   *   - compact: true nếu hiển thị gọn trong ô bảng tổng hợp
   *   - variant: 'student' | 'teacher'
   */
  function renderVoicePlayer(opts) {
    const id = opts.id || ('vp-' + Math.random().toString(36).slice(2, 9));
    const url = opts.url || 'demo:voice';
    const durationStr = formatDuration(parseDurationToSeconds(opts.duration || '00:40'));
    const label = opts.label || 'Bản thu âm';
    const fallbackText = opts.fallbackText || '你好，老师！我是越南学生。';
    const lang = opts.lang || 'zh-CN';
    const compactClass = opts.compact ? ' is-compact' : '';
    const variantClass = opts.variant === 'teacher' ? ' is-teacher-voice' : ' is-student-voice';

    const existing = playerSessions[id];
    const isPlaying = existing && existing.isPlaying;
    const currentSec = existing ? existing.currentSeconds : 0;
    const totalSec = existing && existing.totalSeconds ? existing.totalSeconds : parseDurationToSeconds(durationStr);
    const playbackRate = existing && existing.playbackRate ? existing.playbackRate : 1;
    const currentStr = formatDuration(currentSec);
    const totalStr = formatDuration(totalSec);
    const percent = totalSec > 0 ? Math.min(100, Math.round((currentSec / totalSec) * 1000) / 10) : 0;
    const speedBtnHtml = opts.showSpeedToggle
      ? '<button type="button" class="voice-ctrl-btn voice-speed-btn" data-vp-action="speed" ' +
        'title="Chuyển tốc độ nghe (Chuẩn 1.0x / Chậm 0.8x)" aria-label="Tốc độ nghe">' +
        '<span data-vp-speed>' + (playbackRate === 0.8 ? '0.8x' : '1.0x') + '</span>' +
        '</button>'
      : '';

    return (
      '<div class="voice-player-bar' + compactClass + variantClass + (isPlaying ? ' is-playing' : '') + '" ' +
        'data-voice-player="' + escapeAttr(id) + '" ' +
        'data-voice-url="' + escapeAttr(url) + '" ' +
        'data-voice-duration="' + escapeAttr(totalStr) + '" ' +
        'data-voice-fallback="' + escapeAttr(fallbackText) + '" ' +
        'data-voice-lang="' + escapeAttr(lang) + '">' +
        '<button type="button" class="voice-ctrl-btn voice-play-toggle" data-vp-action="toggle" ' +
          'title="' + (isPlaying ? 'Tạm dừng (Pause)' : 'Phát (Play)') + '" ' +
          'aria-label="' + (isPlaying ? 'Tạm dừng âm thanh' : 'Phát âm thanh') + '">' +
          '<span class="vp-icon-play"' + (isPlaying ? ' style="display:none;"' : '') + '>' + PLAYER_ICONS.play + '</span>' +
          '<span class="vp-icon-pause"' + (isPlaying ? '' : ' style="display:none;"') + '>' + PLAYER_ICONS.pause + '</span>' +
          '<span class="vp-icon-loading" style="display:none;"><span class="ss-spinner ss-spinner-sm" aria-hidden="true"></span></span>' +
        '</button>' +
        '<button type="button" class="voice-ctrl-btn voice-rewind-btn" data-vp-action="rewind" ' +
          'title="Tua lại 5 giây để nghe lại đoạn vừa rồi" aria-label="Tua lại 5 giây">' +
          '<span>-5s</span>' +
        '</button>' +
        speedBtnHtml +
        '<div class="voice-timeline-col">' +
          '<div class="voice-meta-row">' +
            '<span class="voice-label-text">' + escapeAttr(label) + '</span>' +
            '<span class="voice-time-badge tabular-nums">' +
              '<span data-vp-current>' + escapeAttr(currentStr) + '</span>' +
              ' / ' +
              '<span data-vp-total>' + escapeAttr(totalStr) + '</span>' +
            '</span>' +
          '</div>' +
          '<input type="range" class="voice-seek-slider" data-vp-slider ' +
            'min="0" max="100" step="0.5" value="' + percent + '" ' +
            'aria-label="Thanh tua thời gian nghe ' + escapeAttr(label) + '">' +
        '</div>' +
      '</div>'
    );
  }

  function syncPlayerDom(playerId) {
    const session = playerSessions[playerId];
    if (!session) return;
    const containers = document.querySelectorAll('[data-voice-player="' + CSS.escape(playerId) + '"]');
    containers.forEach(function (el) {
      const isLoading = Boolean(session.fetchingDriveMedia);
      el.classList.toggle('is-playing', Boolean(session.isPlaying) && !isLoading);
      el.classList.toggle('is-loading', isLoading);
      const playIcon = el.querySelector('.vp-icon-play');
      const pauseIcon = el.querySelector('.vp-icon-pause');
      const loadingIcon = el.querySelector('.vp-icon-loading');
      const toggleBtn = el.querySelector('[data-vp-action="toggle"]');
      if (playIcon) playIcon.style.display = !isLoading && !session.isPlaying ? '' : 'none';
      if (pauseIcon) pauseIcon.style.display = !isLoading && session.isPlaying ? '' : 'none';
      if (loadingIcon) loadingIcon.style.display = isLoading ? 'inline-flex' : 'none';
      if (toggleBtn) {
        toggleBtn.disabled = isLoading;
        toggleBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
        toggleBtn.setAttribute(
          'title',
          isLoading ? 'Đang tải âm thanh...' : (session.isPlaying ? 'Tạm dừng (Pause)' : 'Phát (Play)')
        );
        toggleBtn.setAttribute(
          'aria-label',
          isLoading ? 'Đang tải âm thanh' : (session.isPlaying ? 'Tạm dừng âm thanh' : 'Phát âm thanh')
        );
      }
      const curEl = el.querySelector('[data-vp-current]');
      const totEl = el.querySelector('[data-vp-total]');
      const slider = el.querySelector('[data-vp-slider]');
      const speedEl = el.querySelector('[data-vp-speed]');
      if (curEl) curEl.textContent = formatDuration(session.currentSeconds);
      if (totEl) totEl.textContent = formatDuration(session.totalSeconds);
      if (speedEl) speedEl.textContent = session.playbackRate === 0.8 ? '0.8x' : '1.0x';
      if (slider && !session.isDraggingSlider) {
        const pct = session.totalSeconds > 0
          ? Math.min(100, Math.round((session.currentSeconds / session.totalSeconds) * 1000) / 10)
          : 0;
        slider.value = String(pct);
      }
    });
  }

  function getOrCreateSession(playerEl) {
    const id = playerEl.getAttribute('data-voice-player');
    const rawUrl = playerEl.getAttribute('data-voice-url') || '';
    const driveId = extractDriveFileId(rawUrl);
    const effectiveUrl = (driveId && resolvedMediaCache[driveId]) ? resolvedMediaCache[driveId] : rawUrl;
    const durStr = playerEl.getAttribute('data-voice-duration') || '00:40';
    const fallbackText = playerEl.getAttribute('data-voice-fallback') || '你好，老师！';
    const lang = playerEl.getAttribute('data-voice-lang') || 'zh-CN';
    const totalSec = parseDurationToSeconds(durStr);

    if (!playerSessions[id] || playerSessions[id].rawUrl !== rawUrl) {
      if (playerSessions[id]) {
        pauseSession(id);
      }
      playerSessions[id] = {
        id: id,
        rawUrl: rawUrl,
        url: effectiveUrl,
        fallbackText: fallbackText,
        lang: lang,
        totalSeconds: totalSec,
        currentSeconds: 0,
        playbackRate: 1,
        isPlaying: false,
        audioEl: null,
        simTimer: null,
        isRealAudio: effectiveUrl.indexOf('data:') === 0 || effectiveUrl.indexOf('blob:') === 0 || effectiveUrl.indexOf('http') === 0,
        fetchingDriveMedia: false
      };
    } else {
      playerSessions[id].fallbackText = fallbackText;
      if (driveId && resolvedMediaCache[driveId] && playerSessions[id].url !== resolvedMediaCache[driveId]) {
        playerSessions[id].url = resolvedMediaCache[driveId];
      }
    }
    return playerSessions[id];
  }

  function pauseSession(playerId) {
    const session = playerSessions[playerId];
    if (!session) return;
    session.isPlaying = false;
    if (session.simTimer) {
      clearInterval(session.simTimer);
      session.simTimer = null;
    }
    if (session.audioEl) {
      try {
        session.audioEl.pause();
      } catch (e) {
        // ignore
      }
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    if (activePlayerId === playerId) {
      activePlayerId = null;
    }
    syncPlayerDom(playerId);
  }

  function pauseAllExcept(playerId) {
    Object.keys(playerSessions).forEach(function (id) {
      if (id !== playerId && playerSessions[id] && playerSessions[id].isPlaying) {
        pauseSession(id);
      }
    });
  }

  function startSimulatedPlayback(session) {
    if (session.simTimer) clearInterval(session.simTimer);
    if (session.currentSeconds >= session.totalSeconds) {
      session.currentSeconds = 0;
    }
    session.isPlaying = true;
    activePlayerId = session.id;
    syncPlayerDom(session.id);

    // Phát giọng đọc minh họa từ vị trí tương ứng với thanh tua (seek position)
    if ('speechSynthesis' in window && session.fallbackText) {
      try {
        window.speechSynthesis.cancel();
        const ratio = session.totalSeconds > 0 ? session.currentSeconds / session.totalSeconds : 0;
        const fullText = String(session.fallbackText);
        const startIdx = Math.min(fullText.length - 1, Math.max(0, Math.floor(fullText.length * ratio)));
        const slicedText = fullText.slice(startIdx) || fullText;
        const utter = new SpeechSynthesisUtterance(slicedText);
        utter.lang = session.lang || 'zh-CN';
        utter.rate = 0.92 * (session.playbackRate || 1);
        window.speechSynthesis.speak(utter);
      } catch (e) {
        // ignore
      }
    }

    let lastTick = Date.now();
    session.simTimer = setInterval(function () {
      if (!session.isPlaying) return;
      const now = Date.now();
      const delta = (now - lastTick) / 1000;
      lastTick = now;
      session.currentSeconds = Math.min(session.totalSeconds, session.currentSeconds + delta);
      syncPlayerDom(session.id);

      if (session.currentSeconds >= session.totalSeconds) {
        clearInterval(session.simTimer);
        session.simTimer = null;
        session.isPlaying = false;
        session.currentSeconds = 0;
        if (activePlayerId === session.id) activePlayerId = null;
        syncPlayerDom(session.id);
      }
    }, 200);
  }

  function attachRealAudioEvents(session, audio) {
    audio.addEventListener('loadedmetadata', function () {
      if (isFinite(audio.duration) && audio.duration > 0) {
        session.totalSeconds = Math.max(1, Math.round(audio.duration));
        syncPlayerDom(session.id);
      }
    });

    audio.addEventListener('timeupdate', function () {
      if (!session.isDraggingSlider) {
        session.currentSeconds = audio.currentTime || 0;
        if (isFinite(audio.duration) && audio.duration > 0) {
          session.totalSeconds = Math.max(1, Math.round(audio.duration));
        }
        syncPlayerDom(session.id);
      }
    });

    audio.addEventListener('ended', function () {
      session.isPlaying = false;
      session.currentSeconds = 0;
      if (activePlayerId === session.id) activePlayerId = null;
      syncPlayerDom(session.id);
    });
  }

  async function playSession(session) {
    pauseAllExcept(session.id);

    if (!session.isRealAudio) {
      startSimulatedPlayback(session);
      return;
    }

    if (!session.audioEl) {
      const audio = new Audio();
      audio.preload = 'metadata';
      attachRealAudioEvents(session, audio);
      audio.src = session.url;
      session.audioEl = audio;
    }
    try {
      session.audioEl.playbackRate = session.playbackRate || 1;
    } catch (e) {
      // ignore
    }

    if (session.currentSeconds >= session.totalSeconds) {
      session.currentSeconds = 0;
      try {
        session.audioEl.currentTime = 0;
      } catch (e) {
        // ignore
      }
    } else if (Math.abs((session.audioEl.currentTime || 0) - session.currentSeconds) > 0.5) {
      try {
        session.audioEl.currentTime = session.currentSeconds;
      } catch (e) {
        // ignore
      }
    }

    if (session.fetchingDriveMedia) return;

    session.isPlaying = true;
    activePlayerId = session.id;
    syncPlayerDom(session.id);

    try {
      await session.audioEl.play();
    } catch (err) {
      // Nếu file bị trình duyệt chặn CORS redirect trên thẻ <audio>,
      // ưu tiên đọc từ Cache / Cloudflare Edge proxy rồi fallback sang GAS (?action=getMedia&fileId=...)
      const driveFileId = extractDriveFileId(session.url);
      if (driveFileId && !session.fetchingDriveMedia) {
        session.fetchingDriveMedia = true;
        session.isPlaying = false;
        syncPlayerDom(session.id);
        try {
          const resolvedSrc = await resolveDriveMediaSource(driveFileId);
          if (resolvedSrc) {
            session.url = resolvedSrc;
            session.audioEl.src = resolvedSrc;
            session.audioEl.currentTime = session.currentSeconds;
            session.fetchingDriveMedia = false;
            session.isPlaying = true;
            syncPlayerDom(session.id);
            await session.audioEl.play();
            return;
          }
        } catch (fetchErr) {
          // Fallback to simulated timeline
        }
        session.fetchingDriveMedia = false;
        syncPlayerDom(session.id);
      }
      // Fallback sang trình phát mô phỏng có thanh tua nếu file không truy cập được
      session.isRealAudio = false;
      startSimulatedPlayback(session);
    }
  }

  function seekSessionToSeconds(session, targetSec) {
    const clamped = Math.max(0, Math.min(session.totalSeconds, targetSec));
    session.currentSeconds = clamped;

    if (session.isRealAudio && session.audioEl) {
      try {
        session.audioEl.currentTime = clamped;
      } catch (e) {
        // ignore
      }
    } else if (session.isPlaying) {
      startSimulatedPlayback(session);
      return;
    }
    syncPlayerDom(session.id);
  }

  // Lắng nghe sự kiện toàn cục cho mọi trình phát `.voice-player-bar`
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (ev) {
      const actionBtn = ev.target.closest('[data-vp-action]');
      if (!actionBtn) return;
      const playerEl = actionBtn.closest('[data-voice-player]');
      if (!playerEl) return;

      const action = actionBtn.getAttribute('data-vp-action');
      const session = getOrCreateSession(playerEl);

      if (action === 'toggle') {
        if (session.isPlaying) {
          pauseSession(session.id);
        } else {
          playSession(session);
        }
      } else if (action === 'rewind') {
        const nextSec = Math.max(0, session.currentSeconds - 5);
        seekSessionToSeconds(session, nextSec);
      } else if (action === 'speed') {
        session.playbackRate = session.playbackRate === 0.8 ? 1 : 0.8;
        if (session.audioEl) {
          try {
            session.audioEl.playbackRate = session.playbackRate;
          } catch (e) {
            // ignore
          }
        }
        if (session.isPlaying && !session.isRealAudio) {
          startSimulatedPlayback(session);
        } else {
          syncPlayerDom(session.id);
        }
      }
    });

    document.addEventListener('input', function (ev) {
      const slider = ev.target.closest('[data-vp-slider]');
      if (!slider) return;
      const playerEl = slider.closest('[data-voice-player]');
      if (!playerEl) return;

      const session = getOrCreateSession(playerEl);
      session.isDraggingSlider = true;
      const pct = parseFloat(slider.value) || 0;
      const targetSec = (pct / 100) * session.totalSeconds;
      session.currentSeconds = targetSec;

      const curEl = playerEl.querySelector('[data-vp-current]');
      if (curEl) curEl.textContent = formatDuration(targetSec);
    });

    document.addEventListener('change', function (ev) {
      const slider = ev.target.closest('[data-vp-slider]');
      if (!slider) return;
      const playerEl = slider.closest('[data-voice-player]');
      if (!playerEl) return;

      const session = getOrCreateSession(playerEl);
      session.isDraggingSlider = false;
      const pct = parseFloat(slider.value) || 0;
      const targetSec = (pct / 100) * session.totalSeconds;
      seekSessionToSeconds(session, targetSec);
    });
  }

  /**
   * Bộ FFT Radix-2 thực dụng thuần JS cho lọc tạp âm STFT không cần thư viện ngoài
   */
  function fftRadix2(re, im, inverse) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) {
        j ^= bit;
      }
      j ^= bit;
      if (i < j) {
        const tr = re[i];
        re[i] = re[j];
        re[j] = tr;
        const ti = im[i];
        im[i] = im[j];
        im[j] = ti;
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const halfLen = len >> 1;
      const angle = ((inverse ? 2 : -2) * Math.PI) / len;
      const wStepRe = Math.cos(angle);
      const wStepIm = Math.sin(angle);
      for (let i = 0; i < n; i += len) {
        let wRe = 1;
        let wIm = 0;
        for (let j = 0; j < halfLen; j++) {
          const idx1 = i + j;
          const idx2 = idx1 + halfLen;
          const tRe = re[idx2] * wRe - im[idx2] * wIm;
          const tIm = re[idx2] * wIm + im[idx2] * wRe;
          re[idx2] = re[idx1] - tRe;
          im[idx2] = im[idx1] - tIm;
          re[idx1] += tRe;
          im[idx1] += tIm;
          const nextWRe = wRe * wStepRe - wIm * wStepIm;
          wIm = wRe * wStepIm + wIm * wStepRe;
          wRe = nextWRe;
        }
      }
    }
    if (inverse) {
      for (let i = 0; i < n; i++) {
        re[i] /= n;
        im[i] /= n;
      }
    }
  }

  function percentileFromSorted(sortedArr, ratio) {
    if (!sortedArr || sortedArr.length === 0) return 0;
    const idx = Math.min(sortedArr.length - 1, Math.max(0, Math.floor((sortedArr.length - 1) * ratio)));
    return sortedArr[idx];
  }

  /**
   * Lọc tạp âm phổ STFT Wiener mượt (tránh méo/nước sôi) từ các khung nền yên tĩnh nhất
   */
  function spectralSuppressStationaryNoise(samples) {
    const n = samples.length;
    const fftSize = 512;
    const hop = 256;
    if (n < fftSize * 4) {
      return new Float32Array(samples);
    }

    const halfBins = (fftSize >> 1) + 1;
    const win = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      win[i] = Math.sin((Math.PI * (i + 0.5)) / fftSize);
    }

    const frameStarts = [];
    for (let pos = 0; pos + fftSize <= n; pos += hop) {
      frameStarts.push(pos);
    }
    if (frameStarts.length === 0 || frameStarts[frameStarts.length - 1] + fftSize < n) {
      frameStarts.push(Math.max(0, n - fftSize));
    }
    const numFrames = frameStarts.length;
    if (numFrames < 8) {
      return new Float32Array(samples);
    }

    const frameInfos = [];
    const nonZeroEnergies = [];
    const re = new Float32Array(fftSize);
    const im = new Float32Array(fftSize);

    for (let f = 0; f < numFrames; f++) {
      const start = frameStarts[f];
      let timeEnergy = 0;
      for (let j = 0; j < fftSize; j++) {
        const s = start + j < n ? samples[start + j] : 0;
        const w = s * win[j];
        re[j] = w;
        im[j] = 0;
        timeEnergy += w * w;
      }
      fftRadix2(re, im, false);
      const specRe = new Float32Array(halfBins);
      const specIm = new Float32Array(halfBins);
      const pow = new Float32Array(halfBins);
      for (let k = 0; k < halfBins; k++) {
        specRe[k] = re[k];
        specIm[k] = im[k];
        pow[k] = re[k] * re[k] + im[k] * im[k];
      }
      frameInfos.push({ start: start, specRe: specRe, specIm: specIm, pow: pow, energy: timeEnergy });
      if (timeEnergy > 1e-8) {
        nonZeroEnergies.push(timeEnergy);
      }
    }

    if (nonZeroEnergies.length < 6) {
      return new Float32Array(samples);
    }
    const sortedEnergies = nonZeroEnergies.slice().sort(function (a, b) { return a - b; });
    const quietThreshold = percentileFromSorted(sortedEnergies, 0.14);
    const speechRefEnergy = percentileFromSorted(sortedEnergies, 0.85);
    if (speechRefEnergy <= quietThreshold * 1.6) {
      return new Float32Array(samples);
    }

    const noisePow = new Float32Array(halfBins);
    let noiseFramesCount = 0;
    for (let f = 0; f < numFrames; f++) {
      if (frameInfos[f].energy > 1e-8 && frameInfos[f].energy <= quietThreshold * 1.08) {
        for (let k = 0; k < halfBins; k++) {
          noisePow[k] += frameInfos[f].pow[k];
        }
        noiseFramesCount++;
      }
    }
    if (noiseFramesCount === 0) {
      return new Float32Array(samples);
    }
    for (let k = 0; k < halfBins; k++) {
      noisePow[k] /= noiseFramesCount;
    }

    const out = new Float32Array(n);
    const olaWeight = new Float32Array(n);
    const prevPow = new Float32Array(halfBins);
    const prevGain = new Float32Array(halfBins);
    prevGain.fill(1.0);
    const overSub = 1.65;
    const minSpecGain = 0.20;

    for (let f = 0; f < numFrames; f++) {
      const info = frameInfos[f];
      const pow = info.pow;

      for (let k = 0; k < halfBins; k++) {
        const left = k > 0 ? pow[k - 1] : pow[k];
        const right = k < halfBins - 1 ? pow[k + 1] : pow[k];
        const freqSmooth = 0.2 * left + 0.6 * pow[k] + 0.2 * right;
        const timeSmooth = f === 0 ? freqSmooth : 0.55 * prevPow[k] + 0.45 * freqSmooth;
        prevPow[k] = timeSmooth;

        const targetG = Math.max(minSpecGain, Math.min(1.0, (timeSmooth - overSub * noisePow[k]) / (timeSmooth + 1e-12)));
        const g = 0.5 * prevGain[k] + 0.5 * targetG;
        prevGain[k] = g;

        re[k] = info.specRe[k] * g;
        im[k] = info.specIm[k] * g;
        if (k > 0 && k < fftSize - k) {
          const mirrorIdx = fftSize - k;
          re[mirrorIdx] = info.specRe[k] * g;
          im[mirrorIdx] = -info.specIm[k] * g;
        }
      }
      im[0] = 0;
      if ((fftSize & 1) === 0) {
        im[fftSize >> 1] = 0;
      }

      fftRadix2(re, im, true);
      const start = info.start;
      for (let j = 0; j < fftSize && start + j < n; j++) {
        const w = win[j];
        out[start + j] += re[j] * w;
        olaWeight[start + j] += w * w;
      }
    }

    for (let i = 0; i < n; i++) {
      out[i] = olaWeight[i] > 1e-6 ? out[i] / olaWeight[i] : samples[i];
    }
    return out;
  }

  /**
   * Cắt khoảng im lặng + tiếng click chuột đầu/cuối, giữ lại lề tự nhiên & lọc cổng nhiễu mượt
   */
  function cleanAndTrimMonoSamples(inputSamples, sampleRate) {
    const sr = sampleRate || 22050;
    const rawLen = inputSamples ? inputSamples.length : 0;
    if (!rawLen) {
      return {
        samples: new Float32Array(0),
        sampleRate: sr,
        rawDurationSec: 0,
        trimmedDurationSec: 0,
        trimmedSeconds: 0
      };
    }

    const rawDurationSec = rawLen / sr;
    const dcCentered = new Float32Array(rawLen);
    let mean = 0;
    for (let i = 0; i < rawLen; i++) mean += inputSamples[i];
    mean /= rawLen;
    for (let i = 0; i < rawLen; i++) dcCentered[i] = inputSamples[i] - mean;

    const denoised = spectralSuppressStationaryNoise(dcCentered);

    const frameSize = Math.max(64, Math.round(sr * 0.01));
    const numFrames = Math.max(1, Math.ceil(rawLen / frameSize));
    const frameRms = new Float32Array(numFrames);
    const activeRmsVals = [];
    for (let f = 0; f < numFrames; f++) {
      const s0 = f * frameSize;
      const s1 = Math.min(rawLen, s0 + frameSize);
      let sumSq = 0;
      for (let i = s0; i < s1; i++) {
        sumSq += denoised[i] * denoised[i];
      }
      const rms = Math.sqrt(sumSq / Math.max(1, s1 - s0));
      frameRms[f] = rms;
      if (rms > 1e-5) activeRmsVals.push(rms);
    }

    const sortedRms = activeRmsVals.slice().sort(function (a, b) { return a - b; });
    const noiseRms = Math.max(0.0008, percentileFromSorted(sortedRms, 0.18));
    const speechRms = percentileFromSorted(sortedRms, 0.88);
    const hasSpeech = speechRms >= Math.max(0.005, noiseRms * 1.85);

    let trimStartSample = 0;
    let trimEndSample = rawLen;

    if (hasSpeech && numFrames >= 8) {
      const trimThresh = Math.min(speechRms * 0.36, Math.max(noiseRms * 2.5, speechRms * 0.08, 0.009));
      const activeMask = new Uint8Array(numFrames);
      for (let f = 0; f < numFrames; f++) {
        activeMask[f] = frameRms[f] >= trimThresh ? 1 : 0;
      }

      const winLen = 6;
      const minHits = 4;
      let firstSpeechFrame = -1;
      for (let f = 0; f <= numFrames - winLen; f++) {
        let hits = 0;
        for (let k = 0; k < winLen; k++) hits += activeMask[f + k];
        if (hits >= minHits) {
          firstSpeechFrame = f;
          break;
        }
      }

      let lastSpeechFrame = -1;
      for (let f = numFrames - winLen; f >= 0; f--) {
        let hits = 0;
        for (let k = 0; k < winLen; k++) hits += activeMask[f + k];
        if (hits >= minHits) {
          lastSpeechFrame = f + winLen - 1;
          break;
        }
      }

      if (firstSpeechFrame >= 0 && lastSpeechFrame >= firstSpeechFrame) {
        const preRollSamples = Math.round(sr * 0.11);
        const postRollSamples = Math.round(sr * 0.15);
        trimStartSample = Math.max(0, firstSpeechFrame * frameSize - preRollSamples);
        trimEndSample = Math.min(rawLen, (lastSpeechFrame + 1) * frameSize + postRollSamples);
        const minKeep = Math.min(rawLen, Math.round(sr * 0.35));
        if (trimEndSample - trimStartSample < minKeep) {
          trimEndSample = Math.min(rawLen, trimStartSample + minKeep);
          trimStartSample = Math.max(0, trimEndSample - minKeep);
        }
      }
    }

    const keptLen = Math.max(1, trimEndSample - trimStartSample);
    const trimmed = denoised.slice(trimStartSample, trimEndSample);

    if (hasSpeech) {
      const keptFrames = Math.max(1, Math.ceil(keptLen / frameSize));
      const keptRms = new Float32Array(keptFrames);
      for (let f = 0; f < keptFrames; f++) {
        const s0 = f * frameSize;
        const s1 = Math.min(keptLen, s0 + frameSize);
        let sumSq = 0;
        for (let i = s0; i < s1; i++) sumSq += trimmed[i] * trimmed[i];
        keptRms[f] = Math.sqrt(sumSq / Math.max(1, s1 - s0));
      }

      const gateOpen = Math.min(speechRms * 0.34, Math.max(noiseRms * 2.2, speechRms * 0.06, 0.007));
      const gateClose = Math.max(0.0005, noiseRms * 1.15);
      const minGateGain = 0.06;
      const frameTargetGain = new Float32Array(keptFrames);

      for (let f = 0; f < keptFrames; f++) {
        const r0 = keptRms[f];
        const r1 = f + 1 < keptFrames ? keptRms[f + 1] : r0;
        const r2 = f + 2 < keptFrames ? keptRms[f + 2] : r1;
        const lookRms = Math.max(r0, r1, r2);
        if (lookRms >= gateOpen) {
          frameTargetGain[f] = 1.0;
        } else if (lookRms <= gateClose) {
          frameTargetGain[f] = minGateGain;
        } else {
          const ratio = (lookRms - gateClose) / Math.max(1e-6, gateOpen - gateClose);
          frameTargetGain[f] = minGateGain + (1.0 - minGateGain) * ratio * ratio;
        }
      }

      const holdFrames = 14;
      let holdCounter = 0;
      for (let f = 0; f < keptFrames; f++) {
        if (frameTargetGain[f] > 0.75) {
          holdCounter = holdFrames;
        } else if (holdCounter > 0) {
          frameTargetGain[f] = Math.max(frameTargetGain[f], 0.85);
          holdCounter--;
        }
      }

      let env = frameTargetGain[0];
      const atkCoeff = Math.exp(-1 / Math.max(1, sr * 0.006));
      const relCoeff = Math.exp(-1 / Math.max(1, sr * 0.16));
      for (let i = 0; i < keptLen; i++) {
        const f = Math.min(keptFrames - 1, Math.floor(i / frameSize));
        const tgt = frameTargetGain[f];
        const c = tgt > env ? atkCoeff : relCoeff;
        env = c * env + (1 - c) * tgt;
        trimmed[i] *= env;
      }
    }

    const fadeInLen = Math.min(Math.floor(keptLen / 3), Math.round(sr * 0.012));
    for (let i = 0; i < fadeInLen; i++) {
      trimmed[i] *= i / Math.max(1, fadeInLen);
    }
    const fadeOutLen = Math.min(Math.floor(keptLen / 3), Math.round(sr * 0.022));
    for (let i = 0; i < fadeOutLen; i++) {
      trimmed[keptLen - 1 - i] *= i / Math.max(1, fadeOutLen);
    }

    let maxAbs = 0;
    for (let i = 0; i < keptLen; i++) {
      const a = Math.abs(trimmed[i]);
      if (a > maxAbs) maxAbs = a;
    }
    if (hasSpeech && maxAbs > 0.008) {
      const normGain = Math.min(10, 0.85 / maxAbs);
      for (let i = 0; i < keptLen; i++) {
        const v = trimmed[i] * normGain;
        trimmed[i] = Math.abs(v) > 0.88 ? Math.tanh(v / 0.88) * 0.88 : v;
      }
    }

    const trimmedDurationSec = keptLen / sr;
    const trimmedSeconds = Math.max(0, Math.round(rawDurationSec - trimmedDurationSec));
    return {
      samples: trimmed,
      sampleRate: sr,
      rawDurationSec: rawDurationSec,
      trimmedDurationSec: trimmedDurationSec,
      trimmedSeconds: trimmedSeconds
    };
  }

  function encodeMonoWavBytes(samples, sampleRate) {
    const numSamples = samples.length;
    const byteLength = 44 + numSamples * 2;
    const buffer = new ArrayBuffer(byteLength);
    const view = new DataView(buffer);

    function writeAscii(offset, str) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    writeAscii(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeAscii(8, 'WAVE');
    writeAscii(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeAscii(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const clamped = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }
    return new Uint8Array(buffer);
  }

  async function processRecordedAudioBlob(rawBlob, rawElapsedSec) {
    if (!rawBlob || typeof window === 'undefined') {
      return { blob: rawBlob, durationSec: rawElapsedSec, trimmedSeconds: 0, enhanced: false };
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AudioCtx || !OfflineCtx || typeof rawBlob.arrayBuffer !== 'function') {
      return { blob: rawBlob, durationSec: rawElapsedSec, trimmedSeconds: 0, enhanced: false };
    }

    let ctx = null;
    try {
      ctx = new AudioCtx();
      const arrBuf = await rawBlob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrBuf);
      const chCount = Math.max(1, decoded.numberOfChannels || 1);
      const monoBuf = ctx.createBuffer(1, decoded.length, decoded.sampleRate);
      const monoOut = monoBuf.getChannelData(0);
      for (let c = 0; c < chCount; c++) {
        const chData = decoded.getChannelData(c);
        for (let i = 0; i < decoded.length; i++) {
          monoOut[i] += chData[i] / chCount;
        }
      }

      const targetRate = decoded.duration > 60 ? 16000 : 22050;
      const outLen = Math.max(1, Math.ceil(decoded.duration * targetRate));
      const offline = new OfflineCtx(1, outLen, targetRate);
      const src = offline.createBufferSource();
      src.buffer = monoBuf;

      const hp = offline.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 95;
      hp.Q.value = 0.707;

      const lp = offline.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = Math.min(7800, Math.round(targetRate * 0.44));
      lp.Q.value = 0.707;

      src.connect(hp);
      hp.connect(lp);
      lp.connect(offline.destination);
      src.start(0);

      const rendered = await offline.startRendering();
      const filteredSamples = rendered.getChannelData(0);
      const cleaned = cleanAndTrimMonoSamples(filteredSamples, targetRate);
      const wavBytes = encodeMonoWavBytes(cleaned.samples, targetRate);
      const wavBlob = new Blob([wavBytes], { type: 'audio/wav' });
      return {
        blob: wavBlob,
        durationSec: Math.max(1, Math.round(cleaned.trimmedDurationSec)),
        rawDurationSec: Math.max(1, Math.round(cleaned.rawDurationSec)),
        trimmedSeconds: cleaned.trimmedSeconds,
        enhanced: true
      };
    } catch (e) {
      return { blob: rawBlob, durationSec: rawElapsedSec, trimmedSeconds: 0, enhanced: false };
    } finally {
      if (ctx && typeof ctx.close === 'function') {
        try { await ctx.close(); } catch (closeErr) {}
      }
    }
  }

  /**
   * Bắt đầu thu âm bằng Microphone trình duyệt (kèm lọc tạp âm & cắt im lặng đầu/cuối)
   */
  async function startRecording(onTick, onComplete, onError) {
    try {
      pauseAllExcept(null);
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      if (activeRecorder && activeRecorder.state !== 'inactive') {
        try {
          activeRecorder.onstop = null;
          activeRecorder.stop();
        } catch (stopErr) {}
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt hiện tại không hỗ trợ thu âm trực tiếp. Vui lòng chọn tải file lên.');
      }
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false
          }
        });
      } catch (constraintErr) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      recordedChunks = [];
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorderOptions = {
        mimeType: mimeType,
        audioBitsPerSecond: 96000
      };
      try {
        activeRecorder = new MediaRecorder(stream, recorderOptions);
      } catch (optErr) {
        try {
          activeRecorder = new MediaRecorder(stream, { audioBitsPerSecond: 64000 });
        } catch (fallbackErr) {
          activeRecorder = new MediaRecorder(stream);
        }
      }
      activeRecorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      activeRecorder.onstop = async function () {
        clearInterval(timerInterval);
        const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const rawBlob = new Blob(recordedChunks, { type: mimeType });

        stream.getTracks().forEach(function (track) {
          track.stop();
        });

        const processed = await processRecordedAudioBlob(rawBlob, elapsedSeconds);
        const finalBlob = processed.blob || rawBlob;
        const durationText = formatDuration(processed.durationSec || elapsedSeconds);

        const reader = new FileReader();
        reader.onloadend = function () {
          if (typeof onComplete === 'function') {
            onComplete({
              dataUrl: reader.result,
              mimeType: finalBlob.type || mimeType || 'audio/wav',
              duration: durationText,
              rawDuration: formatDuration(elapsedSeconds),
              trimmedSeconds: processed.trimmedSeconds || 0,
              enhanced: Boolean(processed.enhanced),
              sizeKB: Math.round(finalBlob.size / 1024)
            });
          }
        };
        reader.onerror = function () {
          if (typeof onError === 'function') {
            onError('Không thể đọc dữ liệu bản thu âm vừa tạo.');
          }
        };
        reader.readAsDataURL(finalBlob);
      };

      startTime = Date.now();
      activeRecorder.start();

      if (typeof onTick === 'function') {
        onTick('00:00');
      }
      timerInterval = setInterval(function () {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (typeof onTick === 'function') {
          onTick(formatDuration(elapsed));
        }
      }, 500);
    } catch (err) {
      if (typeof onError === 'function') {
        onError(err && err.message ? err.message : 'Không thể truy cập Microphone.');
      }
    }
  }

  function stopRecording() {
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      activeRecorder.stop();
      return true;
    }
    return false;
  }

  /**
   * Đọc file Audio/Video do học sinh hoặc giáo viên tải lên
   */
  function readUploadedMediaFile(file, callback) {
    if (!file) return;
    const isVideo = file.type && file.type.indexOf('video') === 0;
    const mediaType = isVideo ? 'video' : 'audio';

    const reader = new FileReader();
    reader.onload = function (ev) {
      const dataUrl = ev.target.result;
      const tempEl = document.createElement(isVideo ? 'video' : 'audio');
      tempEl.preload = 'metadata';
      tempEl.onloadedmetadata = function () {
        const dur = isFinite(tempEl.duration) && tempEl.duration > 0
          ? formatDuration(tempEl.duration)
          : '01:15';
        callback({
          mediaType: mediaType,
          dataUrl: dataUrl,
          mimeType: file.type || (isVideo ? 'video/mp4' : 'audio/webm'),
          fileName: file.name,
          duration: dur,
          sizeKB: Math.round(file.size / 1024)
        });
      };
      tempEl.onerror = function () {
        callback({
          mediaType: mediaType,
          dataUrl: dataUrl,
          mimeType: file.type || (isVideo ? 'video/mp4' : 'audio/webm'),
          fileName: file.name,
          duration: '01:10',
          sizeKB: Math.round(file.size / 1024)
        });
      };
      tempEl.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Phát âm từ vựng tiếng Trung (zh-CN) bằng Web Speech API
   */
  function speakText(text, lang) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang || 'zh-CN';
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  }

  /**
   * Phát file media thực tế hoặc giọng đọc minh họa (dùng cho nơi gọi trực tiếp)
   */
  function playMediaOrDemo(url, fallbackSpeechText, lang) {
    if (!url) return;
    if (url.indexOf('data:') === 0 || url.indexOf('http') === 0 || url.indexOf('blob:') === 0) {
      const audio = new Audio(url);
      audio.play().catch(function () {
        speakText(fallbackSpeechText || '你好，老师！', lang || 'zh-CN');
      });
      return;
    }
    speakText(fallbackSpeechText, lang || 'zh-CN');
  }

  return {
    startRecording: startRecording,
    stopRecording: stopRecording,
    readUploadedMediaFile: readUploadedMediaFile,
    speakText: speakText,
    playMediaOrDemo: playMediaOrDemo,
    renderVoicePlayer: renderVoicePlayer,
    cleanAndTrimMonoSamples: cleanAndTrimMonoSamples,
    encodeMonoWavBytes: encodeMonoWavBytes,
    pauseAll: function () { pauseAllExcept(null); }
  };
})();
