/**
 * ============================================================================
 * STUDYSNAP — GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * Hỗ trợ Đăng nhập Phân quyền (Giáo viên / Học sinh), Tạo tài khoản Học sinh,
 * Nộp & Chữa BVN Voice, Bài luyện tập cuối giờ và Kho từ vựng trên Google Sheets.
 * ============================================================================
 */

const SHEET_NAMES = {
  TEACHERS: 'Teachers',
  STUDENTS: 'Students',
  ASSIGNMENTS: 'Assignments',
  SUBMISSIONS: 'Submissions',
  EXIT_TICKETS: 'ExitTickets',
  VOCABULARY: 'Vocabulary',
  PRACTICE_EXERCISES: 'PracticeExercises',
  PRACTICE_SUBMISSIONS: 'PracticeSubmissions'
};

const DRIVE_FOLDER_NAME = 'StudySnap_Media_Uploads';

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'bootstrap';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return jsonResponse({
        ok: true,
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getMedia') {
      const fileId = (e && e.parameter && e.parameter.fileId) ? String(e.parameter.fileId).trim() : '';
      if (!fileId) {
        return jsonResponse({ ok: false, error: 'Thiếu fileId.' });
      }
      const file = DriveApp.getFileById(fileId);
      const blob = file.getBlob();
      const mimeType = blob.getContentType() || 'audio/webm';
      const base64 = Utilities.base64Encode(blob.getBytes());
      return jsonResponse({
        ok: true,
        fileId: fileId,
        mimeType: mimeType,
        dataUrl: 'data:' + mimeType + ';base64,' + base64
      });
    }

    ensureSheetsExist_(ss);
    return jsonResponse({
      ok: true,
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      data: getBootstrapData_(ss)
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const payload = JSON.parse(rawBody);
    const action = payload.action || '';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheetsExist_(ss);

    if (action === 'setupDatabase') {
      setupDatabase();
      return jsonResponse({
        ok: true,
        message: 'Đã khởi tạo cấu trúc 6 bảng (gồm Teachers & Students có tài khoản đăng nhập) trên Google Sheets.',
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'clearAllData') {
      const clearResult = clearAllData();
      return jsonResponse({
        ok: true,
        message: clearResult.message,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'login') {
      const authResult = handleLogin_(ss, payload);
      return jsonResponse(authResult);
    }

    if (action === 'createStudentAccount') {
      const student = handleCreateStudentAccount_(ss, payload);
      return jsonResponse({
        ok: true,
        student: student,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'resetStudentPassword') {
      const updated = handleResetStudentPassword_(ss, payload);
      return jsonResponse({
        ok: true,
        student: updated,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'deleteStudentAccount') {
      handleDeleteStudentAccount_(ss, payload);
      return jsonResponse({
        ok: true,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'submitHomework') {
      const result = handleSubmitHomework_(ss, payload);
      return jsonResponse({
        ok: true,
        submission: result,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'saveTeacherFeedback') {
      const result = handleSaveTeacherFeedback_(ss, payload);
      return jsonResponse({
        ok: true,
        submission: result,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'submitExitTicket') {
      const result = handleSubmitExitTicket_(ss, payload);
      return jsonResponse({
        ok: true,
        exitResult: result,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'addVocabulary') {
      const result = handleAddVocabulary_(ss, payload);
      return jsonResponse({
        ok: true,
        vocab: result,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'addAssignment') {
      const result = handleAddAssignment_(ss, payload);
      return jsonResponse({
        ok: true,
        assignment: result,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'submitPracticeExercise') {
      const result = handleSubmitPracticeExercise_(ss, payload);
      return jsonResponse({
        ok: true,
        practiceSubmission: result,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'gradeManualTranslation') {
      const result = handleGradeManualTranslation_(ss, payload);
      return jsonResponse({
        ok: true,
        practiceSubmission: result,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'savePracticeExercise') {
      const result = handleSavePracticeExercise_(ss, payload);
      return jsonResponse({
        ok: true,
        practiceExercise: result,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'deletePracticeExercise') {
      handleDeletePracticeExercise_(ss, payload);
      return jsonResponse({
        ok: true,
        data: getBootstrapData_(ss)
      });
    }

    return jsonResponse({
      ok: false,
      error: 'Action không hợp lệ: ' + action
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Khởi tạo 6 Sheet chuẩn và điền dữ liệu mẫu (kèm tài khoản Giáo viên & Học sinh)
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist_(ss);

  const teachersSheet = ss.getSheetByName(SHEET_NAMES.TEACHERS);
  if (teachersSheet.getLastRow() <= 1) {
    const sampleTeachers = [
      ['GV01', 'Cô Nguyễn Thu Minh', 'gv_minh', '123456', 'Tiếng Trung Giao Tiếp & HSK']
    ];
    teachersSheet.getRange(2, 1, sampleTeachers.length, sampleTeachers[0].length).setValues(sampleTeachers);
  }

  const studentsSheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (studentsSheet.getLastRow() <= 1) {
    const sampleStudents = [
      ['HS01', 'Nguyễn Minh Anh', 'Lớp Tiếng Trung HSK 2', 'MA', 'hs01', '123456', '2026-11-01'],
      ['HS02', 'Trần Quốc Bảo', 'Lớp Tiếng Trung HSK 2', 'QB', 'hs02', '123456', '2026-11-01'],
      ['HS03', 'Lê Hoàng Châu', 'Lớp Tiếng Trung HSK 2', 'HC', 'hs03', '123456', '2026-11-01'],
      ['HS04', 'Phạm Gia Huy', 'Lớp Tiếng Trung HSK 2', 'GH', 'hs04', '123456', '2026-11-01'],
      ['HS05', 'Võ Khánh Linh', 'Lớp Tiếng Trung HSK 2', 'KL', 'hs05', '123456', '2026-11-01'],
      ['HS06', 'Đặng Tuấn Kiệt', 'Lớp Tiếng Trung HSK 2', 'TK', 'hs06', '123456', '2026-11-01']
    ];
    studentsSheet.getRange(2, 1, sampleStudents.length, sampleStudents[0].length).setValues(sampleStudents);
  }

  const assignmentsSheet = ss.getSheetByName(SHEET_NAMES.ASSIGNMENTS);
  if (assignmentsSheet.getLastRow() <= 1) {
    const sampleAssignments = [
      [
        'BVN01',
        'Bài 1: Thu âm giới thiệu bản thân bằng tiếng Trung & luyện 4 thanh điệu',
        'Bài 1',
        '12/11/2026',
        'Thu âm (60–90 giây) hoặc tải video giới thiệu họ tên, quốc tịch, nghề nghiệp bằng tiếng Trung. Chú ý quy tắc biến điệu thanh 3 (nǐ hǎo) và các âm bật hơi (p, t, k, q, ch).',
        'audio_or_video'
      ],
      [
        'BVN02',
        'Bài 2: Đọc đoạn hội thoại học tiếng Hán & phân biệt âm uốn lưỡi zh, ch, sh',
        'Bài 2',
        '14/11/2026',
        'Thu âm đoạn hội thoại Bài 2 và đặt 3 câu hỏi với 吗 (ma) hoặc 呢 (ne). Chú ý biến điệu của chữ 不 (bù → bú khi đi trước thanh 4).',
        'audio_or_video'
      ],
      [
        'BVN03',
        'Bài 3: Quay video hỏi giá mua sắm & nói lịch trình một ngày bằng tiếng Trung',
        'Bài 3',
        '16/11/2026',
        'Quay video hoặc thu âm kể về lịch trình buổi sáng và hội thoại mua hàng hỏi giá (多少钱), sử dụng ít nhất 4 từ vựng của Bài 3.',
        'audio_or_video'
      ]
    ];
    assignmentsSheet.getRange(2, 1, sampleAssignments.length, sampleAssignments[0].length).setValues(sampleAssignments);
  }

  const submissionsSheet = ss.getSheetByName(SHEET_NAMES.SUBMISSIONS);
  if (submissionsSheet.getLastRow() <= 1) {
    const sampleSubmissions = [
      [
        'SUB01',
        'BVN01',
        'HS01',
        '10/11/2026 14:20',
        'Em đã thu âm 2 lần để sửa biến điệu thanh 3 và âm mặt lưỡi j, q, x ạ.',
        'audio',
        'demo:audio-hs01-bvn01',
        '01:18',
        'graded',
        9.5,
        'Phát âm thanh 1 và thanh 4 rất sáng, dứt khoát! Biến điệu "你好 (nǐ hǎo)" chuẩn. Chú ý bật hơi mạnh hơn một chút ở từ "留学生 (liúxuéshēng)" nhé.',
        'demo:voice-gv-sub01',
        '00:42',
        '10/11/2026 19:05'
      ],
      [
        'SUB02',
        'BVN01',
        'HS02',
        '10/11/2026 16:45',
        'Em quay video tự giới thiệu bằng tiếng Trung không nhìn phiên âm Pinyin ạ.',
        'video',
        'demo:video-hs02-bvn01',
        '01:35',
        'submitted',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        'SUB03',
        'BVN01',
        'HS03',
        '10/11/2026 17:10',
        'Em nộp bản thu âm Bài 1 chào hỏi và giới thiệu bản thân ạ.',
        'audio',
        'demo:audio-hs03-bvn01',
        '01:05',
        'graded',
        8.5,
        'Ngữ điệu tự nhiên, trôi chảy. Em cần giữ độ cao của thanh 1 ở từ "高兴 (gāoxìng)" và đọc nhẹ thanh nhẹ ở từ "认识 (rènshi)" nhé.',
        'demo:voice-gv-sub03',
        '00:35',
        '10/11/2026 20:15'
      ],
      [
        'SUB04',
        'BVN02',
        'HS01',
        '11/11/2026 08:30',
        'Em gửi bài đọc hội thoại Bài 2 và 3 câu hỏi mở rộng bằng tiếng Trung ạ.',
        'audio',
        'demo:audio-hs01-bvn02',
        '01:24',
        'graded',
        9.0,
        'Biến điệu chữ "不" trong câu "汉语发音不太难 (Hànyǔ fāyīn bú tài nán)" rất chuẩn xác!',
        'demo:voice-gv-sub04',
        '00:28',
        '11/11/2026 09:30'
      ]
    ];
    submissionsSheet.getRange(2, 1, sampleSubmissions.length, sampleSubmissions[0].length).setValues(sampleSubmissions);
  }

  const vocabSheet = ss.getSheetByName(SHEET_NAMES.VOCABULARY);
  if (vocabSheet.getLastRow() <= 1) {
    const sampleVocab = [
      ['V01', 'bai-1', 'Bài 1: Chào hỏi & Làm quen', '你好', 'nǐ hǎo', 'Lời chào', 'Xin chào (biến điệu đọc là ní hǎo)', '你好，我是越南人。(Nǐ hǎo, wǒ shì Yuènán rén.)', 'Xin chào, tôi là người Việt Nam.'],
      ['V02', 'bai-1', 'Bài 1: Chào hỏi & Làm quen', '高兴', 'gāo xìng', 'Tính từ', 'Vui vẻ, phấn khởi', '认识你我很高兴。(Rènshi nǐ wǒ hěn gāoxìng.)', 'Rất vui được làm quen với bạn.'],
      ['V03', 'bai-1', 'Bài 1: Chào hỏi & Làm quen', '认识', 'rèn shi', 'Động từ', 'Quen biết, làm quen', '很高兴认识大家。(Hěn gāoxìng rènshi dàjiā.)', 'Rất vui được làm quen với mọi người.'],
      ['V04', 'bai-1', 'Bài 1: Chào hỏi & Làm quen', '留学生', 'liú xué shēng', 'Danh từ', 'Du học sinh', '她是汉语留学生。(Tā shì Hànyǔ liúxuéshēng.)', 'Cô ấy là du học sinh ngành tiếng Trung.'],
      ['V05', 'bai-2', 'Bài 2: Học tập & Ngôn ngữ', '汉语', 'Hàn yǔ', 'Danh từ', 'Tiếng Trung (Tiếng Hán)', '汉语发音不太难。(Hànyǔ fāyīn bú tài nán.)', 'Phát âm tiếng Trung không khó lắm.'],
      ['V06', 'bai-2', 'Bài 2: Học tập & Ngôn ngữ', '汉字', 'Hàn zì', 'Danh từ', 'Chữ Hán', '我每天都练习写汉字。(Wǒ měitiān dōu liànxí xiě Hànzì.)', 'Mỗi ngày tôi đều luyện viết chữ Hán.'],
      ['V07', 'bai-2', 'Bài 2: Học tập & Ngôn ngữ', '发音', 'fā yīn', 'Danh từ / Động từ', 'Phát âm, ngữ âm', '老师的发音非常标准。(Lǎoshī de fāyīn fēicháng biāozhǔn.)', 'Phát âm của cô giáo vô cùng chuẩn.'],
      ['V08', 'bai-2', 'Bài 2: Học tập & Ngôn ngữ', '努力', 'nǔ lì', 'Tính từ', 'Chăm chỉ, nỗ lực', '他学习汉语很努力。(Tā xuéxí Hànyǔ hěn nǔlì.)', 'Cậu ấy học tiếng Trung rất chăm chỉ.'],
      ['V09', 'bai-3', 'Bài 3: Mua sắm & Đời sống', '多少钱', 'duō shao qián', 'Đại từ nghi vấn', 'Bao nhiêu tiền?', '请问，这本书多少钱？(Qǐngwèn, zhè běn shū duōshao qián?)', 'Xin hỏi, quyển sách này bao nhiêu tiền?'],
      ['V10', 'bai-3', 'Bài 3: Mua sắm & Đời sống', '便宜', 'pián yi', 'Tính từ', 'Rẻ, giá hợp lý', '这件衣服很便宜。(Zhè jiàn yīfu hěn piányi.)', 'Bộ quần áo này rất rẻ.'],
      ['V11', 'bai-3', 'Bài 3: Mua sắm & Đời sống', '准备', 'zhǔn bèi', 'Động từ', 'Chuẩn bị, sẵn sàng', '我已经做好准备了。(Wǒ yǐjīng zuò hǎo zhǔnbèi le.)', 'Tôi đã chuẩn bị sẵn sàng rồi.'],
      ['V12', 'bai-3', 'Bài 3: Mua sắm & Đời sống', '坚持', 'jiān chí', 'Động từ', 'Kiên trì, bền bỉ', '坚持每天听汉语录音。(Jiānchí měitiān tīng Hànyǔ lùyīn.)', 'Kiên trì nghe băng ghi âm tiếng Trung mỗi ngày.']
    ];
    vocabSheet.getRange(2, 1, sampleVocab.length, sampleVocab[0].length).setValues(vocabSheet.getLastRow() <= 1 ? sampleVocab : sampleVocab);
  }

  PropertiesService.getScriptProperties().deleteProperty('STUDYSNAP_IS_PRODUCTION');
}

/**
 * XÓA TOÀN BỘ DỮ LIỆU TEST / DỮ LIỆU MẪU ĐỂ BẮT ĐẦU SỬ DỤNG DỮ LIỆU THẬT
 * Cách dùng:
 * - Cách 1: Mở Google Apps Script -> Chọn hàm `clearAllData` trên thanh công cụ -> Bấm "Chạy (Run)".
 * - Cách 2: Bấm nút "Xóa dữ liệu test" ngay trên trang Quản lý của Giáo viên (`teacher.html`).
 *
 * Hàm này sẽ:
 * 1. Xóa sạch toàn bộ dữ liệu test từ dòng thứ 2 trở đi ở các bảng:
 *    `Students`, `Assignments`, `Submissions`, `ExitTickets`, `Vocabulary` (giữ nguyên dòng tiêu đề cột số 1).
 * 2. Giữ lại tài khoản Giáo viên trong bảng `Teachers` để giáo viên đăng nhập và bắt đầu tạo lớp thật.
 * 3. Chuyển toàn bộ các file ghi âm/video test trong thư mục Google Drive `StudySnap_Media_Uploads` vào thùng rác.
 */
function clearAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist_(ss);

  const sheetsToClear = [
    SHEET_NAMES.STUDENTS,
    SHEET_NAMES.ASSIGNMENTS,
    SHEET_NAMES.SUBMISSIONS,
    SHEET_NAMES.EXIT_TICKETS,
    SHEET_NAMES.VOCABULARY,
    SHEET_NAMES.PRACTICE_EXERCISES,
    SHEET_NAMES.PRACTICE_SUBMISSIONS
  ];

  sheetsToClear.forEach(function (sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
  });

  // Đảm bảo bảng Teachers vẫn có ít nhất 1 tài khoản Giáo viên để đăng nhập
  const teachersSheet = ss.getSheetByName(SHEET_NAMES.TEACHERS);
  if (teachersSheet && teachersSheet.getLastRow() <= 1) {
    teachersSheet.getRange(2, 1, 1, 5).setValues([
      ['GV01', 'Cô Nguyễn Thu Minh', 'gv_minh', '123456', 'Tiếng Trung Giao Tiếp & HSK']
    ]);
  }

  // Dọn sạch các file ghi âm / video test trong thư mục Google Drive StudySnap_Media_Uploads
  try {
    const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    while (folders.hasNext()) {
      const folder = folders.next();
      const files = folder.getFiles();
      while (files.hasNext()) {
        files.next().setTrashed(true);
      }
    }
  } catch (e) {
    // Bỏ qua nếu chưa phát sinh thư mục Drive
  }

  PropertiesService.getScriptProperties().setProperty('STUDYSNAP_IS_PRODUCTION', 'true');

  return {
    ok: true,
    isProduction: true,
    message: 'Đã xóa toàn bộ dữ liệu test (Học sinh, BVN, Bài nộp, Từ vựng, Lịch sử cuối giờ & File ghi âm test). Hệ thống đã sẵn sàng 100% cho dữ liệu thật!'
  };
}

function ensureSheetsExist_(ss) {
  const schemas = [
    {
      name: SHEET_NAMES.TEACHERS,
      headers: ['teacher_id', 'full_name', 'username', 'password', 'subject']
    },
    {
      name: SHEET_NAMES.STUDENTS,
      headers: ['student_id', 'full_name', 'class_name', 'avatar_initials', 'username', 'password', 'created_at']
    },
    {
      name: SHEET_NAMES.ASSIGNMENTS,
      headers: ['assignment_id', 'title', 'lesson_tag', 'due_date', 'description', 'require_media']
    },
    {
      name: SHEET_NAMES.SUBMISSIONS,
      headers: [
        'submission_id',
        'assignment_id',
        'student_id',
        'submitted_at',
        'student_note',
        'media_type',
        'media_url',
        'media_duration',
        'status',
        'score',
        'teacher_comment',
        'teacher_voice_url',
        'teacher_voice_duration',
        'graded_at'
      ]
    },
    {
      name: SHEET_NAMES.EXIT_TICKETS,
      headers: ['record_id', 'ticket_id', 'student_id', 'student_name', 'score', 'total', 'submitted_at', 'answers_json']
    },
    {
      name: SHEET_NAMES.VOCABULARY,
      headers: ['vocab_id', 'lesson_id', 'lesson_title', 'word', 'ipa', 'part_of_speech', 'meaning_vi', 'example_en', 'example_vi']
    },
    {
      name: SHEET_NAMES.PRACTICE_EXERCISES,
      headers: ['exercise_id', 'title', 'lesson_tag', 'total_score', 'thresholds_json', 'sections_json', 'created_at']
    },
    {
      name: SHEET_NAMES.PRACTICE_SUBMISSIONS,
      headers: ['submission_id', 'exercise_id', 'student_id', 'student_name', 'total_score', 'max_score', 'rating', 'submitted_at', 'section_scores_json', 'answers_json', 'manual_grades_json', 'status']
    }
  ];

  schemas.forEach(function (schema) {
    let sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
      sheet.getRange(1, 1, 1, schema.headers.length).setFontWeight('bold').setBackground('#CCFBF1');
      sheet.setFrozenRows(1);
    }
  });
}

function getBootstrapData_(ss) {
  const isProdProp = PropertiesService.getScriptProperties().getProperty('STUDYSNAP_IS_PRODUCTION') === 'true';
  return {
    isProduction: isProdProp,
    teachers: readSheetRows_(ss.getSheetByName(SHEET_NAMES.TEACHERS)),
    students: readSheetRows_(ss.getSheetByName(SHEET_NAMES.STUDENTS)),
    assignments: readSheetRows_(ss.getSheetByName(SHEET_NAMES.ASSIGNMENTS)),
    submissions: readSheetRows_(ss.getSheetByName(SHEET_NAMES.SUBMISSIONS)),
    exitTicketLogs: readSheetRows_(ss.getSheetByName(SHEET_NAMES.EXIT_TICKETS)),
    vocabulary: readSheetRows_(ss.getSheetByName(SHEET_NAMES.VOCABULARY)),
    practiceExercises: readSheetRows_(ss.getSheetByName(SHEET_NAMES.PRACTICE_EXERCISES)),
    practiceSubmissions: readSheetRows_(ss.getSheetByName(SHEET_NAMES.PRACTICE_SUBMISSIONS))
  };
}

function readSheetRows_(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = [];
  for (let r = 1; r < values.length; r++) {
    const rowObj = {};
    for (let c = 0; c < headers.length; c++) {
      rowObj[headers[c]] = values[r][c];
    }
    rows.push(rowObj);
  }
  return rows;
}

/**
 * Xử lý đăng nhập cho Giáo viên và Học sinh
 */
function handleLogin_(ss, payload) {
  const username = String(payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();

  const teachers = readSheetRows_(ss.getSheetByName(SHEET_NAMES.TEACHERS));
  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i];
    if (String(t.username || '').toLowerCase() === username && String(t.password || '') === password) {
      return {
        ok: true,
        user: {
          role: 'teacher',
          id: t.teacher_id,
          full_name: t.full_name,
          username: t.username,
          subject: t.subject || 'Giáo viên phụ trách'
        }
      };
    }
  }

  const students = readSheetRows_(ss.getSheetByName(SHEET_NAMES.STUDENTS));
  for (let j = 0; j < students.length; j++) {
    const s = students[j];
    const matchUser = String(s.username || '').toLowerCase() === username || String(s.student_id || '').toLowerCase() === username;
    if (matchUser && String(s.password || '') === password) {
      return {
        ok: true,
        user: {
          role: 'student',
          id: s.student_id,
          student_id: s.student_id,
          full_name: s.full_name,
          username: s.username || s.student_id.toLowerCase(),
          class_name: s.class_name,
          avatar_initials: s.avatar_initials
        }
      };
    }
  }

  return {
    ok: false,
    error: 'Tên đăng nhập hoặc mật khẩu không chính xác.'
  };
}

/**
 * Giáo viên tạo tài khoản mới cho Học sinh
 */
function handleCreateStudentAccount_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  const studentId = payload.student_id || ('HS' + String(sheet.getLastRow()).padStart(2, '0'));
  const fullName = payload.full_name || 'Học sinh mới';
  const className = payload.class_name || 'Lớp Tiếng Trung HSK 2';
  const initials = payload.avatar_initials || getInitials_(fullName);
  const username = String(payload.username || studentId.toLowerCase()).trim().toLowerCase();
  const password = String(payload.password || '123456').trim();
  const createdAt = new Date().toLocaleDateString('vi-VN');

  sheet.appendRow([studentId, fullName, className, initials, username, password, createdAt]);
  return {
    student_id: studentId,
    full_name: fullName,
    class_name: className,
    avatar_initials: initials,
    username: username,
    password: password,
    created_at: createdAt
  };
}

function handleResetStudentPassword_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(payload.student_id)) {
      sheet.getRange(i + 1, 6).setValue(String(payload.new_password || '123456'));
      return { student_id: payload.student_id, password: payload.new_password };
    }
  }
  return null;
}

function handleDeleteStudentAccount_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  const values = sheet.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === String(payload.student_id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function getInitials_(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  if (parts.length === 0) return 'HS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function handleSubmitHomework_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.SUBMISSIONS);
  const assignmentId = payload.assignment_id;
  const studentId = payload.student_id;
  const nowStr = new Date().toLocaleString('vi-VN');

  let mediaUrl = payload.media_url || '';
  if (payload.media_base64 && payload.media_mime_type) {
    mediaUrl = saveBase64MediaToDrive_(
      payload.media_base64,
      payload.media_mime_type,
      payload.media_filename || ('BVN_' + assignmentId + '_' + studentId + '_' + Date.now())
    );
  }

  const values = sheet.getDataRange().getValues();
  let foundRowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]) === String(assignmentId) && String(values[i][2]) === String(studentId)) {
      foundRowIndex = i + 1;
      break;
    }
  }

  if (foundRowIndex > 0) {
    const existing = values[foundRowIndex - 1];
    const updatedRow = [
      existing[0],
      assignmentId,
      studentId,
      nowStr,
      payload.student_note || existing[4],
      payload.media_type || existing[5] || 'audio',
      mediaUrl || existing[6],
      payload.media_duration || existing[7] || '01:00',
      existing[8] === 'graded' ? 'graded' : 'submitted',
      existing[9],
      existing[10],
      existing[11],
      existing[12],
      existing[13]
    ];
    sheet.getRange(foundRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
    return { submission_id: existing[0], media_url: updatedRow[6], status: updatedRow[8] };
  } else {
    const newId = 'SUB_' + Utilities.getUuid().slice(0, 8).toUpperCase();
    const newRow = [
      newId,
      assignmentId,
      studentId,
      nowStr,
      payload.student_note || '',
      payload.media_type || 'audio',
      mediaUrl,
      payload.media_duration || '01:00',
      'submitted',
      '',
      '',
      '',
      '',
      ''
    ];
    sheet.appendRow(newRow);
    return { submission_id: newId, media_url: mediaUrl, status: 'submitted' };
  }
}

function handleSaveTeacherFeedback_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.SUBMISSIONS);
  const assignmentId = payload.assignment_id;
  const studentId = payload.student_id;
  const nowStr = new Date().toLocaleString('vi-VN');

  let teacherVoiceUrl = payload.teacher_voice_url || '';
  if (payload.teacher_voice_base64 && payload.teacher_voice_mime_type) {
    teacherVoiceUrl = saveBase64MediaToDrive_(
      payload.teacher_voice_base64,
      payload.teacher_voice_mime_type,
      'VoiceFeedback_' + assignmentId + '_' + studentId + '_' + Date.now()
    );
  }

  const values = sheet.getDataRange().getValues();
  let foundRowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]) === String(assignmentId) && String(values[i][2]) === String(studentId)) {
      foundRowIndex = i + 1;
      break;
    }
  }

  if (foundRowIndex > 0) {
    const existing = values[foundRowIndex - 1];
    const updatedRow = [
      existing[0],
      assignmentId,
      studentId,
      existing[3] || nowStr,
      existing[4],
      existing[5],
      existing[6],
      existing[7],
      'graded',
      payload.score !== undefined ? payload.score : existing[9],
      payload.teacher_comment !== undefined ? payload.teacher_comment : existing[10],
      teacherVoiceUrl || existing[11],
      payload.teacher_voice_duration || existing[12] || '',
      nowStr
    ];
    sheet.getRange(foundRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
    return { submission_id: existing[0], status: 'graded', teacher_voice_url: updatedRow[11] };
  } else {
    const newId = 'SUB_' + Utilities.getUuid().slice(0, 8).toUpperCase();
    const newRow = [
      newId,
      assignmentId,
      studentId,
      '',
      '',
      '',
      '',
      '',
      payload.status || 'graded',
      payload.score || '',
      payload.teacher_comment || '',
      teacherVoiceUrl,
      payload.teacher_voice_duration || '',
      nowStr
    ];
    sheet.appendRow(newRow);
    return { submission_id: newId, status: newRow[8], teacher_voice_url: teacherVoiceUrl };
  }
}

function handleSubmitExitTicket_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.EXIT_TICKETS);
  const recordId = 'EXT_' + Utilities.getUuid().slice(0, 8).toUpperCase();
  const nowStr = new Date().toLocaleString('vi-VN');
  sheet.appendRow([
    recordId,
    payload.ticket_id || 'EXIT_BAI_1',
    payload.student_id || '',
    payload.student_name || '',
    payload.score || 0,
    payload.total || 0,
    nowStr,
    JSON.stringify(payload.answers || [])
  ]);
  return { record_id: recordId, submitted_at: nowStr };
}

function handleAddVocabulary_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.VOCABULARY);
  const vocabId = 'V_' + Utilities.getUuid().slice(0, 6).toUpperCase();
  sheet.appendRow([
    vocabId,
    payload.lesson_id || 'bai-1',
    payload.lesson_title || 'Bài 1',
    payload.word || '',
    payload.ipa || '',
    payload.part_of_speech || '',
    payload.meaning_vi || '',
    payload.example_en || '',
    payload.example_vi || ''
  ]);
  return { vocab_id: vocabId };
}

function handleAddAssignment_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.ASSIGNMENTS);
  const assignmentId = payload.assignment_id || ('BVN0' + sheet.getLastRow());
  sheet.appendRow([
    assignmentId,
    payload.title || '',
    payload.lesson_tag || 'Bài mới',
    payload.due_date || '',
    payload.description || '',
    payload.require_media || 'audio_or_video'
  ]);
  return { assignment_id: assignmentId };
}

function saveBase64MediaToDrive_(base64Data, mimeType, fileName) {
  const cleaned = base64Data.indexOf(',') >= 0 ? base64Data.split(',')[1] : base64Data;
  const bytes = Utilities.base64Decode(cleaned);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);

  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return 'https://drive.google.com/uc?export=download&id=' + file.getId();
}

function handleSubmitPracticeExercise_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.PRACTICE_SUBMISSIONS);
  const exerciseId = String(payload.exercise_id || '');
  const studentId = String(payload.student_id || '');
  const nowStr = new Date().toLocaleString('vi-VN');

  const values = sheet.getDataRange().getValues();
  let foundRowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]) === exerciseId && String(values[i][2]) === studentId) {
      foundRowIndex = i + 1;
      break;
    }
  }

  const subId = foundRowIndex > 0 ? values[foundRowIndex - 1][0] : ('PRAC_SUB_' + Utilities.getUuid().slice(0, 8).toUpperCase());
  const rowData = [
    subId,
    exerciseId,
    studentId,
    payload.student_name || '',
    payload.total_score !== undefined ? payload.total_score : 0,
    payload.max_score || 35,
    payload.rating || '',
    nowStr,
    typeof payload.section_scores === 'object' ? JSON.stringify(payload.section_scores) : String(payload.section_scores_json || '{}'),
    typeof payload.answers === 'object' ? JSON.stringify(payload.answers) : String(payload.answers_json || '{}'),
    typeof payload.manual_grades === 'object' ? JSON.stringify(payload.manual_grades) : String(payload.manual_grades_json || '{}'),
    payload.status || 'submitted'
  ];

  if (foundRowIndex > 0) {
    sheet.getRange(foundRowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { submission_id: subId, status: rowData[11] };
}

function handleGradeManualTranslation_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.PRACTICE_SUBMISSIONS);
  const subId = String(payload.submission_id || '');
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === subId) {
      const existing = values[i];
      const updatedRow = [
        existing[0],
        existing[1],
        existing[2],
        existing[3],
        payload.total_score !== undefined ? payload.total_score : existing[4],
        existing[5],
        payload.rating || existing[6],
        existing[7],
        existing[8],
        existing[9],
        typeof payload.manual_grades === 'object' ? JSON.stringify(payload.manual_grades) : String(payload.manual_grades_json || existing[10]),
        'graded'
      ];
      sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
      return { submission_id: subId, status: 'graded', total_score: updatedRow[4] };
    }
  }
  return null;
}

function handleSavePracticeExercise_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.PRACTICE_EXERCISES);
  const ex = payload.exercise || payload;
  const exId = String(ex.exercise_id || ('EX_' + Date.now()));
  const nowStr = new Date().toLocaleString('vi-VN');

  const values = sheet.getDataRange().getValues();
  let foundRowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === exId) {
      foundRowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    exId,
    ex.title || 'Bài tập mới',
    ex.lesson_tag || 'Bài 1',
    ex.total_score || 35,
    typeof ex.thresholds === 'object' ? JSON.stringify(ex.thresholds) : String(ex.thresholds_json || '{"very_good":31,"good":25}'),
    typeof ex.sections === 'object' ? JSON.stringify(ex.sections) : String(ex.sections_json || '[]'),
    nowStr
  ];

  if (foundRowIndex > 0) {
    sheet.getRange(foundRowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { exercise_id: exId };
}

function handleDeletePracticeExercise_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.PRACTICE_EXERCISES);
  const exId = String(payload.exercise_id || '');
  const values = sheet.getDataRange().getValues();

  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === exId) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
