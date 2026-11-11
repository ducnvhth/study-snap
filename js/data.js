/**
 * StudySnap — Kho dữ liệu trung tâm (Shared Store) — Đào tạo Tiếng Trung Giao Tiếp & HSK
 */

window.STUDYSNAP_INITIAL_DATA = {
  teachers: [
    {
      teacher_id: 'GV01',
      full_name: 'Cô Nguyễn Thu Minh',
      username: 'gv_minh',
      password: '123456',
      subject: 'Tiếng Trung Giao Tiếp & HSK'
    }
  ],

  students: [
    { student_id: 'HS01', full_name: 'Nguyễn Minh Anh', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'MA', username: 'hs01', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS02', full_name: 'Trần Quốc Bảo', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'QB', username: 'hs02', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS03', full_name: 'Lê Hoàng Châu', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'HC', username: 'hs03', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS04', full_name: 'Phạm Gia Huy', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'GH', username: 'hs04', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS05', full_name: 'Võ Khánh Linh', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'KL', username: 'hs05', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS06', full_name: 'Đặng Tuấn Kiệt', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'TK', username: 'hs06', password: '123456', created_at: '01/11/2026' }
  ],

  assignments: [
    {
      assignment_id: 'BVN01',
      title: 'Bài 1: Thu âm giới thiệu bản thân bằng tiếng Trung & luyện 4 thanh điệu',
      lesson_tag: 'Bài 1',
      due_date: '12/11/2026',
      description: 'Thu âm (60–90 giây) hoặc tải video giới thiệu họ tên, quốc tịch, nghề nghiệp bằng tiếng Trung. Chú ý quy tắc biến điệu thanh 3 (nǐ hǎo) và các âm bật hơi (p, t, k, q, ch).',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'BVN02',
      title: 'Bài 2: Đọc đoạn hội thoại học tiếng Hán & phân biệt âm uốn lưỡi zh, ch, sh',
      lesson_tag: 'Bài 2',
      due_date: '14/11/2026',
      description: 'Thu âm đoạn hội thoại Bài 2 và đặt 3 câu hỏi với 吗 (ma) hoặc 呢 (ne). Chú ý biến điệu của chữ 不 (bù → bú khi đi trước thanh 4).',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'BVN03',
      title: 'Bài 3: Quay video hỏi giá mua sắm & nói lịch trình một ngày bằng tiếng Trung',
      lesson_tag: 'Bài 3',
      due_date: '16/11/2026',
      description: 'Quay video hoặc thu âm kể về lịch trình buổi sáng và hội thoại mua hàng hỏi giá (多少钱), sử dụng ít nhất 4 từ vựng của Bài 3.',
      require_media: 'audio_or_video'
    }
  ],

  submissions: [
    {
      submission_id: 'SUB01',
      assignment_id: 'BVN01',
      student_id: 'HS01',
      submitted_at: '10/11/2026 14:20',
      student_note: 'Em đã thu âm 2 lần để sửa biến điệu thanh 3 và âm mặt lưỡi j, q, x ạ.',
      media_type: 'audio',
      media_url: 'demo:student-hs01-bvn01',
      media_duration: '01:18',
      status: 'graded',
      score: 9.5,
      teacher_comment: 'Phát âm thanh 1 và thanh 4 rất sáng, dứt khoát! Biến điệu "你好 (nǐ hǎo)" chuẩn. Chú ý bật hơi mạnh hơn một chút ở từ "留学生 (liúxuéshēng)" nhé.',
      teacher_voice_url: 'demo:teacher-voice-sub01',
      teacher_voice_duration: '00:42',
      graded_at: '10/11/2026 19:05'
    },
    {
      submission_id: 'SUB02',
      assignment_id: 'BVN01',
      student_id: 'HS02',
      submitted_at: '10/11/2026 16:45',
      student_note: 'Em quay video tự giới thiệu bằng tiếng Trung không nhìn phiên âm Pinyin ạ.',
      media_type: 'video',
      media_url: 'demo:student-hs02-bvn01',
      media_duration: '01:35',
      status: 'submitted',
      score: '',
      teacher_comment: '',
      teacher_voice_url: '',
      teacher_voice_duration: '',
      graded_at: ''
    },
    {
      submission_id: 'SUB03',
      assignment_id: 'BVN01',
      student_id: 'HS03',
      submitted_at: '10/11/2026 17:10',
      student_note: 'Em nộp bản thu âm Bài 1 chào hỏi và giới thiệu bản thân ạ.',
      media_type: 'audio',
      media_url: 'demo:student-hs03-bvn01',
      media_duration: '01:05',
      status: 'graded',
      score: 8.5,
      teacher_comment: 'Ngữ điệu tự nhiên, trôi chảy. Em cần giữ độ cao của thanh 1 ở từ "高兴 (gāoxìng)" và đọc nhẹ thanh nhẹ ở từ "认识 (rènshi)" nhé.',
      teacher_voice_url: 'demo:teacher-voice-sub03',
      teacher_voice_duration: '00:35',
      graded_at: '10/11/2026 20:15'
    },
    {
      submission_id: 'SUB04',
      assignment_id: 'BVN01',
      student_id: 'HS05',
      submitted_at: '10/11/2026 21:00',
      student_note: 'Em gửi bài thu âm giới thiệu bản thân bằng tiếng Trung ạ.',
      media_type: 'audio',
      media_url: 'demo:student-hs05-bvn01',
      media_duration: '01:12',
      status: 'graded',
      score: 9.0,
      teacher_comment: 'Giọng đọc rõ chữ, phân biệt tốt âm đầu lưỡi z, c, s và zh, ch, sh. Phát huy ở Bài 2 nhé!',
      teacher_voice_url: 'demo:teacher-voice-sub04',
      teacher_voice_duration: '00:30',
      graded_at: '10/11/2026 22:00'
    },
    {
      submission_id: 'SUB05',
      assignment_id: 'BVN02',
      student_id: 'HS01',
      submitted_at: '11/11/2026 08:30',
      student_note: 'Em gửi bài đọc hội thoại Bài 2 và 3 câu hỏi mở rộng bằng tiếng Trung ạ.',
      media_type: 'audio',
      media_url: 'demo:student-hs01-bvn02',
      media_duration: '01:24',
      status: 'graded',
      score: 9.0,
      teacher_comment: 'Biến điệu chữ "不" trong câu "汉语发音不太难 (Hànyǔ fāyīn bú tài nán)" rất chuẩn xác!',
      teacher_voice_url: 'demo:teacher-voice-sub05',
      teacher_voice_duration: '00:28',
      graded_at: '11/11/2026 09:30'
    },
    {
      submission_id: 'SUB06',
      assignment_id: 'BVN02',
      student_id: 'HS03',
      submitted_at: '11/11/2026 09:15',
      student_note: 'Em nộp video đọc bài khóa chữ Hán Bài 2 ạ.',
      media_type: 'video',
      media_url: 'demo:student-hs03-bvn02',
      media_duration: '01:40',
      status: 'submitted',
      score: '',
      teacher_comment: '',
      teacher_voice_url: '',
      teacher_voice_duration: '',
      graded_at: ''
    },
    {
      submission_id: 'SUB07',
      assignment_id: 'BVN03',
      student_id: 'HS01',
      submitted_at: '11/11/2026 09:50',
      student_note: 'Em quay video kể về lịch trình buổi sáng và hội thoại mua hàng bằng tiếng Trung ạ.',
      media_type: 'video',
      media_url: 'demo:student-hs01-bvn03',
      media_duration: '01:50',
      status: 'submitted',
      score: '',
      teacher_comment: '',
      teacher_voice_url: '',
      teacher_voice_duration: '',
      graded_at: ''
    }
  ],

  vocabulary: [
    {
      vocab_id: 'V01',
      lesson_id: 'bai-1',
      lesson_title: 'Bài 1: Chào hỏi & Làm quen',
      word: '你好',
      ipa: 'nǐ hǎo',
      part_of_speech: 'Lời chào',
      meaning_vi: 'Xin chào (biến điệu đọc là ní hǎo)',
      example_en: '你好，我是越南人。(Nǐ hǎo, wǒ shì Yuènán rén.)',
      example_vi: 'Xin chào, tôi là người Việt Nam.'
    },
    {
      vocab_id: 'V02',
      lesson_id: 'bai-1',
      lesson_title: 'Bài 1: Chào hỏi & Làm quen',
      word: '高兴',
      ipa: 'gāo xìng',
      part_of_speech: 'Tính từ',
      meaning_vi: 'Vui vẻ, phấn khởi',
      example_en: '认识你我很高兴。(Rènshi nǐ wǒ hěn gāoxìng.)',
      example_vi: 'Rất vui được làm quen với bạn.'
    },
    {
      vocab_id: 'V03',
      lesson_id: 'bai-1',
      lesson_title: 'Bài 1: Chào hỏi & Làm quen',
      word: '认识',
      ipa: 'rèn shi',
      part_of_speech: 'Động từ',
      meaning_vi: 'Quen biết, làm quen',
      example_en: '很高兴认识大家。(Hěn gāoxìng rènshi dàjiā.)',
      example_vi: 'Rất vui được làm quen với mọi người.'
    },
    {
      vocab_id: 'V04',
      lesson_id: 'bai-1',
      lesson_title: 'Bài 1: Chào hỏi & Làm quen',
      word: '留学生',
      ipa: 'liú xué shēng',
      part_of_speech: 'Danh từ',
      meaning_vi: 'Du học sinh',
      example_en: '她是汉语留学生。(Tā shì Hànyǔ liúxuéshēng.)',
      example_vi: 'Cô ấy là du học sinh ngành tiếng Trung.'
    },
    {
      vocab_id: 'V05',
      lesson_id: 'bai-2',
      lesson_title: 'Bài 2: Học tập & Ngôn ngữ',
      word: '汉语',
      ipa: 'Hàn yǔ',
      part_of_speech: 'Danh từ',
      meaning_vi: 'Tiếng Trung (Tiếng Hán)',
      example_en: '汉语发音不太难。(Hànyǔ fāyīn bú tài nán.)',
      example_vi: 'Phát âm tiếng Trung không khó lắm.'
    },
    {
      vocab_id: 'V06',
      lesson_id: 'bai-2',
      lesson_title: 'Bài 2: Học tập & Ngôn ngữ',
      word: '汉字',
      ipa: 'Hàn zì',
      part_of_speech: 'Danh từ',
      meaning_vi: 'Chữ Hán',
      example_en: '我每天都练习写汉字。(Wǒ měitiān dōu liànxí xiě Hànzì.)',
      example_vi: 'Mỗi ngày tôi đều luyện viết chữ Hán.'
    },
    {
      vocab_id: 'V07',
      lesson_id: 'bai-2',
      lesson_title: 'Bài 2: Học tập & Ngôn ngữ',
      word: '发音',
      ipa: 'fā yīn',
      part_of_speech: 'Danh từ / Động từ',
      meaning_vi: 'Phát âm, ngữ âm',
      example_en: '老师的发音非常标准。(Lǎoshī de fāyīn fēicháng biāozhǔn.)',
      example_vi: 'Phát âm của cô giáo vô cùng chuẩn.'
    },
    {
      vocab_id: 'V08',
      lesson_id: 'bai-2',
      lesson_title: 'Bài 2: Học tập & Ngôn ngữ',
      word: '努力',
      ipa: 'nǔ lì',
      part_of_speech: 'Tính từ',
      meaning_vi: 'Chăm chỉ, nỗ lực',
      example_en: '他学习汉语很努力。(Tā xuéxí Hànyǔ hěn nǔlì.)',
      example_vi: 'Cậu ấy học tiếng Trung rất chăm chỉ.'
    },
    {
      vocab_id: 'V09',
      lesson_id: 'bai-3',
      lesson_title: 'Bài 3: Mua sắm & Đời sống',
      word: '多少钱',
      ipa: 'duō shao qián',
      part_of_speech: 'Đại từ nghi vấn',
      meaning_vi: 'Bao nhiêu tiền?',
      example_en: '请问，这本书多少钱？(Qǐngwèn, zhè běn shū duōshao qián?)',
      example_vi: 'Xin hỏi, quyển sách này bao nhiêu tiền?'
    },
    {
      vocab_id: 'V10',
      lesson_id: 'bai-3',
      lesson_title: 'Bài 3: Mua sắm & Đời sống',
      word: '便宜',
      ipa: 'pián yi',
      part_of_speech: 'Tính từ',
      meaning_vi: 'Rẻ, giá hợp lý',
      example_en: '这件衣服很便宜。(Zhè jiàn yīfu hěn piányi.)',
      example_vi: 'Bộ quần áo này rất rẻ.'
    },
    {
      vocab_id: 'V11',
      lesson_id: 'bai-3',
      lesson_title: 'Bài 3: Mua sắm & Đời sống',
      word: '准备',
      ipa: 'zhǔn bèi',
      part_of_speech: 'Động từ',
      meaning_vi: 'Chuẩn bị, sẵn sàng',
      example_en: '我已经做好准备了。(Wǒ yǐjīng zuò hǎo zhǔnbèi le.)',
      example_vi: 'Tôi đã chuẩn bị sẵn sàng rồi.'
    },
    {
      vocab_id: 'V12',
      lesson_id: 'bai-3',
      lesson_title: 'Bài 3: Mua sắm & Đời sống',
      word: '坚持',
      ipa: 'jiān chí',
      part_of_speech: 'Động từ',
      meaning_vi: 'Kiên trì, bền bỉ',
      example_en: '坚持每天听汉语录音。(Jiānchí měitiān tīng Hànyǔ lùyīn.)',
      example_vi: 'Kiên trì nghe băng ghi âm tiếng Trung mỗi ngày.'
    }
  ],

  exitTickets: [
    {
      ticket_id: 'EXIT_BAI_1',
      lesson_tag: 'Bài 1',
      title: 'Kiểm tra hiểu bài cuối giờ — Bài 1: Chào hỏi & Biến điệu thanh 3',
      questions: [
        {
          id: 'Q1',
          prompt: 'Khi hai âm tiết mang thanh 3 đi liền nhau như "你好 (nǐ hǎo)", quy tắc biến điệu phát âm chuẩn là gì?',
          speakWord: '你好',
          options: [
            'Âm tiết thứ nhất đọc thành thanh 2: ní hǎo',
            'Cả hai âm tiết đều đọc thành thanh 1: nī hāo',
            'Âm tiết thứ hai đọc thành thanh 4: nǐ hào',
            'Giữ nguyên không biến điệu'
          ],
          correctIndex: 0,
          explanation: 'Trong tiếng Trung, khi hai thanh 3 đi liền nhau (3 + 3), âm tiết đầu tiên biến điệu đọc thành thanh 2 (2 + 3 → ní hǎo).'
        },
        {
          id: 'Q2',
          prompt: 'Để nói "Rất vui được làm quen với bạn" trong tiếng Trung, ta dùng câu nào?',
          speakWord: '认识你我很高兴',
          options: [
            '认识你我很高兴 (Rènshi nǐ wǒ hěn gāoxìng)',
            '这本书多少钱 (Zhè běn shū duōshao qián)',
            '我每天写汉字 (Wǒ měitiān xiě Hànzì)',
            '这件衣服很便宜 (Zhè jiàn yīfu hěn piányi)'
          ],
          correctIndex: 0,
          explanation: '"认识 (rènshi)" là quen biết/làm quen, "高兴 (gāoxìng)" là vui mừng: "认识你我很高兴" = Rất vui được làm quen với bạn.'
        },
        {
          id: 'Q3',
          prompt: 'Từ "留学生 (liú xué shēng)" trong Bài 1 có nghĩa tiếng Việt là gì?',
          speakWord: '留学生',
          options: [
            'Du học sinh',
            'Giáo viên bản xứ',
            'Nhân viên văn phòng',
            'Hướng dẫn viên du lịch'
          ],
          correctIndex: 0,
          explanation: '"留学生 (liúxuéshēng)" nghĩa là du học sinh (ví dụ: 汉语留学生 = du học sinh ngành tiếng Trung).'
        }
      ]
    },
    {
      ticket_id: 'EXIT_BAI_2',
      lesson_tag: 'Bài 2',
      title: 'Kiểm tra hiểu bài cuối giờ — Bài 2: Học tập & Ngữ âm tiếng Hán',
      questions: [
        {
          id: 'Q1',
          prompt: 'Chữ "不 (bù)" khi đứng trước một âm tiết mang thanh 4 như trong cụm "不太难 (bù tài nán)" sẽ đọc biến điệu như thế nào?',
          speakWord: '不太难',
          options: [
            'Đọc thành thanh 2: bú tài nán',
            'Đọc thành thanh 3: bǔ tài nán',
            'Đọc thành thanh 1: bū tài nán',
            'Đọc thành thanh nhẹ: bu tài nán'
          ],
          correctIndex: 0,
          explanation: 'Chữ "不 (bù)" vốn mang thanh 4, nhưng khi đứng trước một âm tiết thanh 4 khác (như 太 tài, 是 shì, 去 qù) thì biến điệu thành thanh 2 (bú).'
        },
        {
          id: 'Q2',
          prompt: 'Từ nào dưới đây có nghĩa là "Chữ Hán" trong câu "Mỗi ngày tôi đều luyện viết chữ Hán"?',
          speakWord: '汉字',
          options: [
            '汉字 (Hàn zì)',
            '发音 (fā yīn)',
            '努力 (nǔ lì)',
            '便宜 (pián yi)'
          ],
          correctIndex: 0,
          explanation: '"汉字 (Hànzì)" là chữ Hán, còn "汉语 (Hànyǔ)" là ngôn ngữ tiếng Hán (tiếng Trung).'
        },
        {
          id: 'Q3',
          prompt: 'Trong câu "他学习汉语很___ (Cậu ấy học tiếng Trung rất chăm chỉ)", từ cần điền là:',
          speakWord: '努力',
          options: [
            '努力 (nǔ lì — chăm chỉ, nỗ lực)',
            '便宜 (pián yi — rẻ)',
            '认识 (rèn shi — quen biết)',
            '多少钱 (duō shao qián — bao nhiêu tiền)'
          ],
          correctIndex: 0,
          explanation: '"努力 (nǔlì)" nghĩa là chăm chỉ, nỗ lực (学习很努力 = học tập rất chăm chỉ).'
        }
      ]
    },
    {
      ticket_id: 'EXIT_BAI_3',
      lesson_tag: 'Bài 3',
      title: 'Kiểm tra hiểu bài cuối giờ — Bài 3: Mua sắm & Đời sống',
      questions: [
        {
          id: 'Q1',
          prompt: 'Khi đi mua hàng ở Trung Quốc, muốn hỏi "Quyển sách này bao nhiêu tiền?", ta nói như thế nào?',
          speakWord: '这本书多少钱',
          options: [
            '这本书多少钱？(Zhè běn shū duōshao qián?)',
            '这本书很高兴？(Zhè běn shū hěn gāoxìng?)',
            '这本书很努力？(Zhè běn shū hěn nǔlì?)',
            '你是留学生吗？(Nǐ shì liúxuéshēng ma?)'
          ],
          correctIndex: 0,
          explanation: '"多少钱 (duōshao qián)" dùng để hỏi giá tiền ("Bao nhiêu tiền?"), lượng từ của quyển sách (书) là "本 (běn)".'
        },
        {
          id: 'Q2',
          prompt: 'Từ "便宜 (pián yi)" trong câu "这件衣服很便宜" mang ý nghĩa gì?',
          speakWord: '这件衣服很便宜',
          options: [
            'Rẻ, giá hợp lý',
            'Đắt đỏ',
            'Bận rộn',
            'Khó khăn'
          ],
          correctIndex: 0,
          explanation: '"便宜 (piányi)" là tính từ nghĩa là rẻ (chú ý chữ 便 trong từ này đọc là pián chứ không đọc là biàn).'
        },
        {
          id: 'Q3',
          prompt: 'Động từ nào diễn tả tinh thần "kiên trì, bền bỉ luyện nghe tiếng Trung mỗi ngày"?',
          speakWord: '坚持',
          options: [
            '坚持 (jiān chí)',
            '准备 (zhǔn bèi)',
            '认识 (rèn shi)',
            '发音 (fā yīn)'
          ],
          correctIndex: 0,
          explanation: '"坚持 (jiānchí)" nghĩa là kiên trì, bền bỉ theo đuổi mục tiêu.'
        }
      ]
    }
  ],

  exitTicketLogs: [
    {
      record_id: 'EXT01',
      ticket_id: 'EXIT_BAI_1',
      student_id: 'HS01',
      student_name: 'Nguyễn Minh Anh',
      score: 3,
      total: 3,
      submitted_at: '10/11/2026 20:45'
    },
    {
      record_id: 'EXT02',
      ticket_id: 'EXIT_BAI_1',
      student_id: 'HS03',
      student_name: 'Lê Hoàng Châu',
      score: 3,
      total: 3,
      submitted_at: '10/11/2026 20:46'
    },
    {
      record_id: 'EXT03',
      ticket_id: 'EXIT_BAI_1',
      student_id: 'HS02',
      student_name: 'Trần Quốc Bảo',
      score: 2,
      total: 3,
      submitted_at: '10/11/2026 20:47'
    }
  ]
};

/**
 * Shared Store & Backend Sync Manager
 */
window.StudySnapStore = (function () {
  const STORAGE_KEY = 'studysnap_app_state_zh_v1';
  const GAS_URL_KEY = 'studysnap_gas_webapp_url';
  const DEFAULT_GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwVkdgBgbyjOe9vFz-8dhut231bViQkEOgyUEwJbFHN1ww16w-Vkgq45IB9d1baxNRcaw/exec';

  function formatCleanDate(val) {
    if (!val) return '';
    const str = String(val);
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return (
          String(d.getDate()).padStart(2, '0') +
          '/' +
          String(d.getMonth() + 1).padStart(2, '0') +
          '/' +
          d.getFullYear()
        );
      }
    }
    return str;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.teachers)) {
          return parsed;
        }
      }
    } catch (e) {
      // Fallback
    }
    const seed = JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA));
    saveState(seed);
    return seed;
  }

  function saveState(stateObj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
    } catch (e) {
      // Ignore quota exceeded
    }
  }

  function getGasUrl() {
    return DEFAULT_GAS_WEBAPP_URL;
  }

  function setGasUrl(url) {
    localStorage.setItem(GAS_URL_KEY, (url || '').trim());
  }

  function mergeRemoteData(stateObj, remoteData) {
    if (!remoteData) return stateObj;
    const initialSeed = window.STUDYSNAP_INITIAL_DATA;

    const remoteIsCleared =
      remoteData.isProduction === true ||
      (Array.isArray(remoteData.teachers) &&
        remoteData.teachers.length > 0 &&
        Array.isArray(remoteData.students) &&
        remoteData.students.length === 0 &&
        Array.isArray(remoteData.assignments) &&
        remoteData.assignments.length === 0);

    if (remoteIsCleared) {
      stateObj.isClearedForProduction = true;
    }

    if (Array.isArray(remoteData.teachers) && remoteData.teachers.length > 0) {
      stateObj.teachers = remoteData.teachers.map(function (t) {
        const subj = String(t.subject || '');
        return {
          teacher_id: t.teacher_id || 'GV01',
          full_name: t.full_name || 'Cô Nguyễn Thu Minh',
          username: String(t.username || 'gv_minh'),
          password: String(t.password || '123456'),
          subject: !subj || subj.indexOf('Tiếng Anh') >= 0 ? 'Tiếng Trung Giao Tiếp & HSK' : subj
        };
      });
    }
    if (Array.isArray(remoteData.students)) {
      stateObj.students = remoteData.students.map(function (st) {
        const cls = String(st.class_name || '');
        return {
          student_id: st.student_id,
          full_name: st.full_name,
          class_name: !cls || cls === 'Lớp Giao Tiếp B1' ? 'Lớp Tiếng Trung HSK 2' : cls,
          avatar_initials: st.avatar_initials || getInitials(st.full_name),
          username: String(st.username || String(st.student_id || '').toLowerCase()),
          password: String(st.password || '123456'),
          created_at: formatCleanDate(st.created_at) || '01/11/2026'
        };
      });
    }
    if (Array.isArray(remoteData.assignments)) {
      stateObj.assignments = remoteData.assignments.map(function (a) {
        const seedMatch = initialSeed.assignments.find(function (sa) {
          return sa.assignment_id === a.assignment_id;
        });
        const isLegacyEnSeed =
          seedMatch &&
          (String(a.description || '').indexOf('tiếng Anh') >= 0 ||
            String(a.title || '').indexOf('sân bay') >= 0 ||
            String(a.title || '').indexOf('mục tiêu học tập') >= 0 ||
            String(a.title || '').indexOf('một ngày làm việc') >= 0);

        if (isLegacyEnSeed) {
          return JSON.parse(JSON.stringify(seedMatch));
        }
        return {
          assignment_id: a.assignment_id,
          title: a.title,
          lesson_tag: a.lesson_tag,
          due_date: formatCleanDate(a.due_date),
          description: a.description,
          require_media: a.require_media || 'audio_or_video'
        };
      });
    }
    if (Array.isArray(remoteData.submissions)) {
      stateObj.submissions = remoteData.submissions.map(function (s) {
        const seedSub = initialSeed.submissions.find(function (ss) {
          return ss.submission_id === s.submission_id;
        });
        const isLegacyEnSub =
          seedSub &&
          (String(s.student_note || '').indexOf('works và likes') >= 0 ||
            String(s.teacher_comment || '').indexOf('environment') >= 0 ||
            String(s.teacher_comment || '').indexOf('international communication') >= 0 ||
            String(s.teacher_comment || '').indexOf('window seat') >= 0 ||
            String(s.student_note || '').indexOf('nhìn giấy') >= 0);

        if (isLegacyEnSub) {
          return JSON.parse(JSON.stringify(seedSub));
        }
        return {
          submission_id: s.submission_id,
          assignment_id: s.assignment_id,
          student_id: s.student_id,
          submitted_at: formatCleanDate(s.submitted_at),
          student_note: s.student_note || '',
          media_type: s.media_type || 'audio',
          media_url: s.media_url || '',
          media_duration: s.media_duration || '01:10',
          status: s.status || 'submitted',
          score: s.score,
          teacher_comment: s.teacher_comment || '',
          teacher_voice_url: s.teacher_voice_url || '',
          teacher_voice_duration: s.teacher_voice_duration || '',
          graded_at: formatCleanDate(s.graded_at)
        };
      });
    }
    if (Array.isArray(remoteData.vocabulary)) {
      if (remoteData.vocabulary.length === 0) {
        stateObj.vocabulary = [];
      } else {
        const legacyEnWords = [
          'articulate', 'rapport', 'enthusiasm', 'perspective',
          'itinerary', 'boarding pass', 'complimentary', 'turbulence',
          'prioritize', 'collaborate', 'milestone', 'consistent'
        ];
        const customChineseVocab = remoteData.vocabulary.filter(function (v) {
          return legacyEnWords.indexOf(String(v.word || '').toLowerCase()) === -1;
        });
        if (customChineseVocab.length === 0) {
          stateObj.vocabulary = JSON.parse(JSON.stringify(initialSeed.vocabulary));
        } else {
          const hasLegacy = remoteData.vocabulary.length !== customChineseVocab.length;
          if (!hasLegacy) {
            stateObj.vocabulary = customChineseVocab;
          } else {
            const mergedVocab = JSON.parse(JSON.stringify(initialSeed.vocabulary));
            customChineseVocab.forEach(function (cv) {
              const existsIdx = mergedVocab.findIndex(function (mv) {
                return mv.vocab_id === cv.vocab_id || mv.word === cv.word;
              });
              if (existsIdx >= 0) {
                mergedVocab[existsIdx] = cv;
              } else {
                mergedVocab.push(cv);
              }
            });
            stateObj.vocabulary = mergedVocab;
          }
        }
      }
    }
    if (Array.isArray(remoteData.exitTicketLogs)) {
      stateObj.exitTicketLogs = remoteData.exitTicketLogs.map(function (log) {
        return {
          record_id: log.record_id,
          ticket_id: log.ticket_id,
          student_id: log.student_id,
          student_name: log.student_name,
          score: log.score,
          total: log.total,
          submitted_at: formatCleanDate(log.submitted_at)
        };
      });
    }
    saveState(stateObj);
    return stateObj;
  }

  async function clearAllTestData(stateObj) {
    stateObj.students = [];
    stateObj.assignments = [];
    stateObj.submissions = [];
    stateObj.vocabulary = [];
    stateObj.exitTicketLogs = [];
    stateObj.isClearedForProduction = true;
    saveState(stateObj);

    try {
      Object.keys(localStorage).forEach(function (key) {
        if (key.indexOf('studysnap_mastered_vocab') === 0) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // ignore
    }

    return await syncPostToGas(stateObj, { action: 'clearAllData' });
  }

  async function syncPostToGas(stateObj, payload) {
    const url = getGasUrl();
    if (!url) return null;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      if (json && json.ok && json.data) {
        mergeRemoteData(stateObj, json.data);
      }
      return json;
    } catch (e) {
      return null;
    }
  }

  async function fetchBootstrapFromGas(stateObj) {
    const url = getGasUrl();
    if (!url) return null;
    try {
      const response = await fetch(url + '?action=bootstrap');
      const json = await response.json();
      if (json && json.ok && json.data) {
        if (
          Array.isArray(json.data.teachers) &&
          json.data.teachers.length === 0 &&
          Array.isArray(json.data.students) &&
          json.data.students.length === 0
        ) {
          return await syncPostToGas(stateObj, { action: 'setupDatabase' });
        }
        mergeRemoteData(stateObj, json.data);
      }
      return json;
    } catch (e) {
      return null;
    }
  }

  function getInitials(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/);
    if (!parts.length || !parts[0]) return 'HS';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  return {
    loadState: loadState,
    saveState: saveState,
    getGasUrl: getGasUrl,
    setGasUrl: setGasUrl,
    syncPostToGas: syncPostToGas,
    fetchBootstrapFromGas: fetchBootstrapFromGas,
    clearAllTestData: clearAllTestData,
    getInitials: getInitials
  };
})();
