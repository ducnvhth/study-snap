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

/**
 * ============================================================================
 * LỐI TẮT QUẢN TRỊ NHANH TRONG GOOGLE SHEETS & APPS SCRIPT
 * - Trong Google Sheets: Mở menu "StudySnap Quản trị" trên thanh công cụ.
 * - Trong Apps Script Editor: Chọn hàm "xoaToanBoDuLieu" hoặc "xoaTrangHoanToan" rồi bấm Run.
 * ============================================================================
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('StudySnap Quản trị')
      .addItem('Xóa toàn bộ dữ liệu test (Giữ GV)', 'menuClearTestData_')
      .addItem('Xóa TRẮNG toàn bộ 100% (Kể cả GV)', 'menuClearAllCompletely_')
      .addSeparator()
      .addItem('Khởi tạo tài khoản GV mặc định (Setup)', 'menuSetupDatabase_')
      .addToUi();
  } catch (e) {
    // Bỏ qua khi gọi ngoài ngữ cảnh UI bảng tính
  }
}

function xoaToanBoDuLieu() {
  return clearAllData();
}

function xoaTrangHoanToan() {
  return clearAllDataCompletely();
}

function menuClearTestData_() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert(
    'Xóa toàn bộ dữ liệu test?',
    'Thao tác này sẽ xóa sạch Học sinh, BVN, Bài nộp, Từ vựng, Luyện tập cuối buổi, Kết quả và File ghi âm/video trên Drive.\nTài khoản Giáo viên vẫn được giữ lại để đăng nhập.',
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) return;
  const result = clearAllData();
  ui.alert(result.message);
}

function menuClearAllCompletely_() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert(
    'CẢNH BÁO: Xóa TRẮNG 100% dữ liệu?',
    'Thao tác này sẽ xóa SẠCH toàn bộ tất cả 8 sheet (bao gồm cả danh sách Giáo viên) và toàn bộ file trong StudySnap_Media_Uploads.\nBạn chắc chắn muốn thực hiện?',
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) return;
  const result = clearAllDataCompletely();
  ui.alert(result.message);
}

function menuSetupDatabase_() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert(
    'Khởi tạo hệ thống với tài khoản Giáo viên mặc định?',
    'Hệ thống sẽ kiểm tra cấu trúc bảng và chỉ tạo duy nhất 1 tài khoản Giáo viên: Hồ Châu Uyển Nhi (tên đăng nhập: gv_uyennhi).',
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) return;
  const result = setupDatabase();
  ui.alert(result.message || 'Đã khởi tạo tài khoản Giáo viên Hồ Châu Uyển Nhi thành công.');
}

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
      error: 'Không thể tải dữ liệu lúc này. Vui lòng thử lại sau.'
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
      const setupRes = setupDatabase();
      return jsonResponse({
        ok: true,
        message: setupRes.message,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'clearAllData' || action === 'clearAllDataCompletely') {
      return jsonResponse({
        ok: false,
        error: 'Chức năng quản trị và làm sạch dữ liệu chỉ được thực hiện trực tiếp trong Google Apps Script.'
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
      const deletedStudent = handleDeleteStudentAccount_(ss, payload);
      return jsonResponse({
        ok: true,
        deletedStudent: deletedStudent,
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

    if (action === 'assignExercisesToClass') {
      const targetClass = String(payload.target_class || 'all').trim();
      const ids = Array.isArray(payload.assignment_ids)
        ? payload.assignment_ids
        : (payload.assignment_id ? [payload.assignment_id] : []);
      const result = updateAssignmentsClass_(ss, ids, targetClass);
      return jsonResponse({
        ok: true,
        updated: result,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'unassignAssignment') {
      const ids = Array.isArray(payload.assignment_ids)
        ? payload.assignment_ids
        : (payload.assignment_id ? [payload.assignment_id] : []);
      const result = updateAssignmentsClass_(ss, ids, 'unassigned');
      return jsonResponse({
        ok: true,
        updated: result,
        data: getBootstrapData_(ss)
      });
    }

    if (action === 'deleteAssignment') {
      const result = handleDeleteAssignment_(ss, payload);
      return jsonResponse({
        ok: true,
        deletedAssignment: result,
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
      error: 'Yêu cầu không hợp lệ.'
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: 'Không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau.'
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Khởi tạo cấu trúc 8 Sheet chuẩn và tạo duy nhất 1 tài khoản Giáo viên (Hồ Châu Uyển Nhi)
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist_(ss);

  const teachersSheet = ss.getSheetByName(SHEET_NAMES.TEACHERS);
  if (teachersSheet.getLastRow() <= 1) {
    const defaultTeachers = [
      ['GV01', 'Hồ Châu Uyển Nhi', 'gv_uyennhi', '123456', 'Tiếng Trung Giao Tiếp & HSK']
    ];
    teachersSheet.getRange(2, 1, defaultTeachers.length, defaultTeachers[0].length).setValues(defaultTeachers);
  }

  PropertiesService.getScriptProperties().setProperty('STUDYSNAP_IS_PRODUCTION', 'true');

  return {
    ok: true,
    message: 'Đã khởi tạo cấu trúc hệ thống với duy nhất 1 tài khoản Giáo viên: Hồ Châu Uyển Nhi (tên đăng nhập: gv_uyennhi).'
  };
}

/**
 * XÓA TOÀN BỘ DỮ LIỆU THỬ NGHIỆM ĐỂ SỬ DỤNG DỮ LIỆU THẬT
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
    clearSheetRowsSafely_(ss.getSheetByName(sheetName));
  });

  // Đảm bảo bảng Teachers vẫn có ít nhất 1 tài khoản Giáo viên để đăng nhập
  const teachersSheet = ss.getSheetByName(SHEET_NAMES.TEACHERS);
  if (teachersSheet && teachersSheet.getLastRow() <= 1) {
    teachersSheet.getRange(2, 1, 1, 5).setValues([
      ['GV01', 'Hồ Châu Uyển Nhi', 'gv_uyennhi', '123456', 'Tiếng Trung Giao Tiếp & HSK']
    ]);
  }

  const trashedFiles = trashAllDriveUploadFiles_();
  PropertiesService.getScriptProperties().setProperty('STUDYSNAP_IS_PRODUCTION', 'true');

  return {
    ok: true,
    isProduction: true,
    clearedSheets: sheetsToClear.length,
    trashedFiles: trashedFiles,
    message: 'Đã xóa toàn bộ dữ liệu thử nghiệm và giữ nguyên tài khoản Giáo viên.'
  };
}

function clearAllDataCompletely() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist_(ss);

  const allSheets = [
    SHEET_NAMES.TEACHERS,
    SHEET_NAMES.STUDENTS,
    SHEET_NAMES.ASSIGNMENTS,
    SHEET_NAMES.SUBMISSIONS,
    SHEET_NAMES.EXIT_TICKETS,
    SHEET_NAMES.VOCABULARY,
    SHEET_NAMES.PRACTICE_EXERCISES,
    SHEET_NAMES.PRACTICE_SUBMISSIONS
  ];

  allSheets.forEach(function (sheetName) {
    clearSheetRowsSafely_(ss.getSheetByName(sheetName));
  });

  const trashedFiles = trashAllDriveUploadFiles_();
  PropertiesService.getScriptProperties().setProperty('STUDYSNAP_IS_PRODUCTION', 'true');

  return {
    ok: true,
    isProduction: true,
    clearedSheets: allSheets.length,
    trashedFiles: trashedFiles,
    message: 'Đã xóa trắng toàn bộ dữ liệu hệ thống.'
  };
}

function clearSheetRowsSafely_(sheet) {
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const numRows = lastRow - 1;
  const numCols = Math.max(sheet.getLastColumn(), 1);
  sheet.getRange(2, 1, numRows, numCols).clearContent();

  // Giữ lại dòng 2 không đóng băng để tránh lỗi Google Apps Script khi xóa toàn bộ dòng không đóng băng
  try {
    if (sheet.getMaxRows() > 2 && lastRow > 2) {
      sheet.deleteRows(3, lastRow - 2);
    }
  } catch (e) {
    // Nội dung từ dòng 2 trở đi đã được clearContent sạch
  }
}

function trashAllDriveUploadFiles_() {
  let trashedCount = 0;
  try {
    const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    while (folders.hasNext()) {
      trashedCount += trashFolderFilesRecursively_(folders.next());
    }
  } catch (e) {
    // Bỏ qua nếu chưa phát sinh thư mục Drive hoặc chưa cấp quyền Drive
  }
  return trashedCount;
}

function trashFolderFilesRecursively_(folder) {
  let trashedCount = 0;
  const files = folder.getFiles();
  while (files.hasNext()) {
    files.next().setTrashed(true);
    trashedCount++;
  }
  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    const sub = subFolders.next();
    trashedCount += trashFolderFilesRecursively_(sub);
    sub.setTrashed(true);
  }
  return trashedCount;
}

const ASSIGNMENT_HEADERS = [
  'assignment_id',
  'title',
  'lesson_tag',
  'due_date',
  'description',
  'require_media',
  'session_tag',
  'class_name',
  'exercise_id',
  'lesson_id'
];

function ensureSheetHeaders_(sheet, requiredHeaders) {
  if (!sheet || !Array.isArray(requiredHeaders) || requiredHeaders.length === 0) return [];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sheet.getRange(1, 1, 1, requiredHeaders.length).setFontWeight('bold').setBackground('#CCFBF1');
    sheet.setFrozenRows(1);
    return requiredHeaders.slice();
  }
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || '').trim();
  });
  const missing = requiredHeaders.filter(function (h) {
    return currentHeaders.indexOf(h) === -1;
  });
  if (missing.length > 0) {
    const startCol = currentHeaders.length + 1;
    sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
    sheet.getRange(1, startCol, 1, missing.length).setFontWeight('bold').setBackground('#CCFBF1');
  }
  return currentHeaders.concat(missing);
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
      headers: ASSIGNMENT_HEADERS
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
    ensureSheetHeaders_(sheet, schema.headers);
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
  if (!username || !password) {
    return {
      ok: false,
      error: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.'
    };
  }

  const teachers = readSheetRows_(ss.getSheetByName(SHEET_NAMES.TEACHERS));
  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i];
    const tUser = String(t.username || '').trim().toLowerCase();
    const tPwd = String(t.password === undefined || t.password === null ? '' : t.password).trim();
    if (tUser && tUser === username && tPwd === password) {
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
    const sUser = String(s.username || '').trim().toLowerCase();
    const sId = String(s.student_id || '').trim().toLowerCase();
    const sPwd = String(s.password === undefined || s.password === null ? '' : s.password).trim();
    const matchUser = (sUser && sUser === username) || (sId && sId === username);
    if (matchUser && sPwd === password) {
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

function generateNextStudentId_(sheet) {
  const values = sheet ? sheet.getDataRange().getValues() : [];
  let maxNum = 0;
  const existingIds = {};
  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][0] || '').trim().toUpperCase();
    if (!id) continue;
    existingIds[id] = true;
    const match = id.match(/^HS(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  let counter = Math.max(maxNum + 1, Math.max(values.length, 1));
  let candidate = 'HS' + String(counter).padStart(2, '0');
  while (existingIds[candidate]) {
    counter++;
    candidate = 'HS' + String(counter).padStart(2, '0');
  }
  return candidate;
}

/**
 * Giáo viên tạo tài khoản mới cho Học sinh
 */
function handleCreateStudentAccount_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  const studentId = payload.student_id || generateNextStudentId_(sheet);
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

function trashDriveFileByUrl_(fileUrl) {
  const url = String(fileUrl || '').trim();
  if (!url) return false;
  const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!match || !match[1]) return false;
  try {
    DriveApp.getFileById(match[1]).setTrashed(true);
    return true;
  } catch (e) {
    return false;
  }
}

function deleteRowsByColumnMatch_(sheet, colIndex, targetValue, onRowDelete) {
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  const values = sheet.getDataRange().getValues();
  const needle = String(targetValue || '').trim();
  if (!needle) return 0;
  let deletedCount = 0;
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][colIndex] || '').trim() === needle) {
      if (typeof onRowDelete === 'function') {
        onRowDelete(values[i]);
      }
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  return deletedCount;
}

function handleDeleteStudentAccount_(ss, payload) {
  const studentId = String((payload && payload.student_id) || '').trim();
  if (!studentId) {
    return { deleted: false, student_id: '' };
  }

  const deletedStudents = deleteRowsByColumnMatch_(
    ss.getSheetByName(SHEET_NAMES.STUDENTS),
    0,
    studentId
  );

  const deletedSubmissions = deleteRowsByColumnMatch_(
    ss.getSheetByName(SHEET_NAMES.SUBMISSIONS),
    2,
    studentId,
    function (row) {
      trashDriveFileByUrl_(row[6]);
      trashDriveFileByUrl_(row[11]);
    }
  );

  const deletedExitTickets = deleteRowsByColumnMatch_(
    ss.getSheetByName(SHEET_NAMES.EXIT_TICKETS),
    2,
    studentId
  );

  const deletedPracticeSubmissions = deleteRowsByColumnMatch_(
    ss.getSheetByName(SHEET_NAMES.PRACTICE_SUBMISSIONS),
    2,
    studentId
  );

  return {
    deleted: deletedStudents > 0,
    student_id: studentId,
    deleted_students: deletedStudents,
    deleted_submissions: deletedSubmissions,
    deleted_exit_tickets: deletedExitTickets,
    deleted_practice_submissions: deletedPracticeSubmissions
  };
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
  const headers = ensureSheetHeaders_(sheet, ASSIGNMENT_HEADERS);
  const assignmentId = payload.assignment_id || ('BVN0' + sheet.getLastRow());
  const rowMap = {
    assignment_id: assignmentId,
    title: payload.title || '',
    lesson_tag: payload.lesson_tag || 'Bài mới',
    due_date: payload.due_date || '',
    description: payload.description || '',
    require_media: payload.require_media || 'audio_or_video',
    session_tag: payload.session_tag || '',
    class_name: payload.class_name !== undefined && payload.class_name !== null && String(payload.class_name).trim() !== ''
      ? String(payload.class_name).trim()
      : 'all',
    exercise_id: payload.exercise_id || '',
    lesson_id: payload.lesson_id || ''
  };
  const rowValues = headers.map(function (h) {
    return rowMap[h] !== undefined ? rowMap[h] : '';
  });
  sheet.appendRow(rowValues);
  return { assignment_id: assignmentId, class_name: rowMap.class_name };
}

function updateAssignmentsClass_(ss, assignmentIds, targetClass) {
  const sheet = ss.getSheetByName(SHEET_NAMES.ASSIGNMENTS);
  if (!sheet || sheet.getLastRow() <= 1 || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
    return { updated_count: 0, target_class: targetClass };
  }
  const headers = ensureSheetHeaders_(sheet, ASSIGNMENT_HEADERS);
  const classColIdx = headers.indexOf('class_name');
  if (classColIdx === -1) return { updated_count: 0, target_class: targetClass };

  const idSet = {};
  assignmentIds.forEach(function (id) {
    const clean = String(id || '').trim();
    if (clean) idSet[clean] = true;
  });

  const values = sheet.getDataRange().getValues();
  let updatedCount = 0;
  for (let i = 1; i < values.length; i++) {
    const rowId = String(values[i][0] || '').trim();
    if (idSet[rowId]) {
      sheet.getRange(i + 1, classColIdx + 1).setValue(String(targetClass || 'unassigned').trim());
      updatedCount++;
    }
  }
  return { updated_count: updatedCount, target_class: targetClass };
}

function handleDeleteAssignment_(ss, payload) {
  const assignmentId = String((payload && payload.assignment_id) || '').trim();
  if (!assignmentId) return { deleted: false, assignment_id: '' };

  const deletedAssignments = deleteRowsByColumnMatch_(
    ss.getSheetByName(SHEET_NAMES.ASSIGNMENTS),
    0,
    assignmentId
  );
  const deletedSubmissions = deleteRowsByColumnMatch_(
    ss.getSheetByName(SHEET_NAMES.SUBMISSIONS),
    1,
    assignmentId,
    function (row) {
      trashDriveFileByUrl_(row[6]);
      trashDriveFileByUrl_(row[11]);
    }
  );
  return {
    deleted: deletedAssignments > 0,
    assignment_id: assignmentId,
    deleted_assignments: deletedAssignments,
    deleted_submissions: deletedSubmissions
  };
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

  // Nếu có đoạn audio nhúng Base64 (từ dạng bài Nghe hiểu), đẩy lên Drive để tránh vượt giới hạn 50k ký tự/ô của Google Sheets
  if (Array.isArray(ex.sections)) {
    for (let sIdx = 0; sIdx < ex.sections.length; sIdx++) {
      const sec = ex.sections[sIdx];
      if (sec && sec.data && typeof sec.data.audio_url === 'string' && sec.data.audio_url.indexOf('data:') === 0) {
        const mimeMatch = sec.data.audio_url.match(/^data:([^;]+);base64,/i);
        const mimeType = mimeMatch && mimeMatch[1] ? mimeMatch[1] : 'audio/webm';
        const ext = mimeType.indexOf('mp3') >= 0 || mimeType.indexOf('mpeg') >= 0
          ? '.mp3'
          : (mimeType.indexOf('wav') >= 0 ? '.wav' : (mimeType.indexOf('mp4') >= 0 || mimeType.indexOf('m4a') >= 0 ? '.m4a' : '.webm'));
        const fileName = exId + '_' + (sec.section_id || ('listen_' + (sIdx + 1))) + '_' + Date.now() + ext;
        sec.data.audio_url = saveBase64MediaToDrive_(sec.data.audio_url, mimeType, fileName);
      }
    }
  }

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
