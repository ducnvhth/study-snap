/**
 * StudySnap — Kho dữ liệu trung tâm (Shared Store) — Đào tạo Tiếng Trung Giao Tiếp & HSK
 */

window.STUDYSNAP_INITIAL_DATA = {
  teachers: [
    {
      teacher_id: 'GV01',
      full_name: 'Hồ Châu Uyển Nhi',
      username: 'gv_uyennhi',
      password: '123456',
      subject: 'Tiếng Trung Giao Tiếp & HSK'
    }
  ],

  classes: [
    { class_id: 'CLS01', class_name: 'Lớp Tiếng Trung HSK 2', created_at: '01/11/2026' },
    { class_id: 'CLS02', class_name: 'Lớp Tiếng Trung HSK 1 - K24', created_at: '05/11/2026' }
  ],

  students: [
    { student_id: 'HS01', full_name: 'Nguyễn Minh Anh', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'MA', username: 'hs01', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS02', full_name: 'Trần Quốc Bảo', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'QB', username: 'hs02', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS03', full_name: 'Lê Hoàng Châu', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'HC', username: 'hs03', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS04', full_name: 'Phạm Gia Huy', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'GH', username: 'hs04', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS05', full_name: 'Võ Khánh Linh', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'KL', username: 'hs05', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS06', full_name: 'Đặng Tuấn Kiệt', class_name: 'Lớp Tiếng Trung HSK 2', avatar_initials: 'TK', username: 'hs06', password: '123456', created_at: '01/11/2026' },
    { student_id: 'HS07', full_name: 'Hoàng Phương Thảo', class_name: 'Lớp Tiếng Trung HSK 1 - K24', avatar_initials: 'PT', username: 'hs07', password: '123456', created_at: '05/11/2026' },
    { student_id: 'HS08', full_name: 'Vũ Đức Nam', class_name: 'Lớp Tiếng Trung HSK 1 - K24', avatar_initials: 'DN', username: 'hs08', password: '123456', created_at: '05/11/2026' }
  ],

  assignments: [
    {
      assignment_id: 'BVN01_1',
      session_tag: 'Buổi 1',
      title: 'Bài 1: Thu âm giới thiệu bản thân bằng tiếng Trung & luyện 4 thanh điệu',
      lesson_tag: 'Bài 1',
      class_name: 'Lớp Tiếng Trung HSK 2',
      due_date: '12/11/2026',
      description: 'Thu âm (60–90 giây) hoặc tải video giới thiệu họ tên, quốc tịch, nghề nghiệp bằng tiếng Trung. Chú ý quy tắc biến điệu thanh 3 (nǐ hǎo) và các âm bật hơi (p, t, k, q, ch).',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'BVN01_2',
      session_tag: 'Buổi 1',
      title: 'Bài 2: Đọc thuộc 10 câu chào hỏi và làm quen cơ bản',
      lesson_tag: 'Bài 2',
      class_name: 'Lớp Tiếng Trung HSK 2',
      due_date: '12/11/2026',
      description: 'Thu âm đọc to rõ ràng 10 câu chào hỏi, hỏi thăm sức khỏe trong Bài 1. Chú ý ngữ điệu tự nhiên và tròn vành rõ chữ.',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'BVN01_3',
      session_tag: 'Buổi 1',
      title: 'Bài 3: Luyện dịch và đọc 5 câu đàm thoại làm quen trong lớp',
      lesson_tag: 'Bài 3',
      class_name: 'Lớp Tiếng Trung HSK 2',
      due_date: '12/11/2026',
      description: 'Dịch và thu âm đọc 5 câu đối thoại hỏi họ tên, bạn học, thầy cô giáo. Phát âm dứt khoát thanh 4 và tự nhiên thanh nhẹ.',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'BVN01_4',
      session_tag: 'Buổi 1',
      title: 'Bài 4: Quay video ngắn 1 phút tự giới thiệu bằng tiếng Hán',
      lesson_tag: 'Bài 4',
      class_name: 'Lớp Tiếng Trung HSK 2',
      due_date: '13/11/2026',
      description: 'Quay video giới thiệu ngắn gọn trước camera, nhìn thẳng tự tin, phát âm tròn tiếng các thanh mẫu và vận mẫu đã học.',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'BVN02_1',
      session_tag: 'Buổi 2',
      title: 'Bài 1: Đọc đoạn hội thoại học tiếng Hán & phân biệt âm uốn lưỡi zh, ch, sh',
      lesson_tag: 'Bài 1',
      class_name: 'Lớp Tiếng Trung HSK 2',
      due_date: '14/11/2026',
      description: 'Thu âm đoạn hội thoại Bài 2. Chú ý biến điệu của chữ 不 (bù → bú khi đi trước thanh 4) và phát âm chuẩn các âm đầu lưỡi.',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'BVN02_2',
      session_tag: 'Buổi 2',
      title: 'Bài 2: Đặt 3 câu hỏi với trợ từ nghi vấn 吗 (ma) hoặc 呢 (ne)',
      lesson_tag: 'Bài 2',
      class_name: 'Lớp Tiếng Trung HSK 2',
      due_date: '14/11/2026',
      description: 'Đặt và thu âm phát âm 3 câu hỏi tiếng Trung sử dụng 吗 hoặc 呢 kèm theo câu trả lời hoàn chỉnh tương ứng.',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'BVN02_3',
      session_tag: 'Buổi 2',
      title: 'Bài 3: Luyện phát âm nhóm thanh mẫu cuốn lưỡi zh, ch, sh, r',
      lesson_tag: 'Bài 3',
      class_name: 'Lớp Tiếng Trung HSK 2',
      due_date: '14/11/2026',
      description: 'Thu âm đọc bảng từ vựng thanh mẫu uốn lưỡi. Giữ đầu lưỡi cong đúng vị trí và phát âm rõ ràng.',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'BVN03_1',
      session_tag: 'Buổi 3',
      title: 'Bài 1: Quay video hỏi giá mua sắm & nói lịch trình một ngày bằng tiếng Trung',
      lesson_tag: 'Bài 3',
      class_name: 'all',
      due_date: '16/11/2026',
      description: 'Quay video hoặc thu âm kể về lịch trình buổi sáng và hội thoại mua hàng hỏi giá (多少钱), sử dụng ít nhất 4 từ vựng của Bài 3.',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'BVN04_1',
      session_tag: 'Buổi 1',
      title: 'Bài 1: Phát âm thanh mẫu & vận mẫu tiếng Hán cơ bản',
      lesson_tag: 'Bài 1',
      class_name: 'Lớp Tiếng Trung HSK 1 - K24',
      due_date: '15/11/2026',
      description: 'Thu âm 21 thanh mẫu và 36 vận mẫu cơ bản trong tiếng Trung. Chú ý phân biệt âm bật hơi p, t, k và không bật hơi b, d, g.',
      require_media: 'audio_or_video'
    },
    {
      assignment_id: 'ASG_PRAC_DEMO_1',
      session_tag: 'Buổi 1',
      title: 'Luyện tập cuối buổi: HSK 1: Bài 1 (Chào hỏi & Làm quen)',
      lesson_tag: 'Bài 1',
      lesson_id: 'bai-1',
      exercise_id: 'EX_HSK1_BAI_1',
      class_name: 'all',
      due_date: '20/11/2026',
      description: 'Làm bài luyện tập cuối buổi trực tiếp trên hệ thống.',
      require_media: 'practice'
    }
  ],

  submissions: [
    {
      submission_id: 'SUB01',
      assignment_id: 'BVN01_1',
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
      assignment_id: 'BVN01_1',
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
      assignment_id: 'BVN01_2',
      student_id: 'HS03',
      submitted_at: '10/11/2026 17:10',
      student_note: 'Em nộp bản thu âm 10 câu chào hỏi và làm quen cơ bản ạ.',
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
      assignment_id: 'BVN01_2',
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
      assignment_id: 'BVN02_1',
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
      assignment_id: 'BVN02_2',
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
      assignment_id: 'BVN03_1',
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
    }
  ],

  lessons: [],

  exitTickets: [
    {
      ticket_id: 'EXIT_BAI_1',
      lesson_tag: 'Bài 1',
      title: 'Kiểm tra hiểu bài cuối buổi — Bài 1: Chào hỏi & Biến điệu thanh 3',
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
      title: 'Kiểm tra hiểu bài cuối buổi — Bài 2: Học tập & Ngữ âm tiếng Hán',
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
      title: 'Kiểm tra hiểu bài cuối buổi — Bài 3: Mua sắm & Đời sống',
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
  ],

  practiceExercises: [
    {
      exercise_id: 'EX_HSK1_BAI_1',
      title: 'Bài luyện tập cuối buổi — HSK 1: Bài 1 (Chào hỏi & Làm quen)',
      lesson_tag: 'Bài 1',
      total_score: 35,
      thresholds: {
        very_good: 31,
        good: 25
      },
      sections: [
        {
          section_id: 'sec_matching_1',
          section_num: 1,
          type: 'matching',
          title: 'Phần 1: Nối từ (10 điểm)',
          description: 'Nối chữ Hán và phiên âm pinyin ở cột trái với nghĩa tiếng Việt tương ứng ở cột phải. Mỗi cặp đúng được 1 điểm.',
          max_score: 10,
          data: {
            left: [
              { id: 1, hanzi: '你', pinyin: 'nǐ' },
              { id: 2, hanzi: '好', pinyin: 'hǎo' },
              { id: 3, hanzi: '您', pinyin: 'nín' },
              { id: 4, hanzi: '你们', pinyin: 'nǐmen' },
              { id: 5, hanzi: '对不起', pinyin: 'duìbuqǐ' },
              { id: 6, hanzi: '没关系', pinyin: 'méi guānxi' },
              { id: 7, hanzi: '谢谢', pinyin: 'xièxie' },
              { id: 8, hanzi: '不客气', pinyin: 'bú kèqi' },
              { id: 9, hanzi: '再见', pinyin: 'zàijiàn' },
              { id: 10, hanzi: '老师', pinyin: 'lǎoshī' }
            ],
            right: [
              { id: 'A', text: 'Bạn, cậu (ngôi thứ 2 số ít)' },
              { id: 'B', text: 'Tốt, khỏe, an lành' },
              { id: 'C', text: 'Ngài, ông, bà, thầy, cô (kính trọng)' },
              { id: 'D', text: 'Các bạn, các cậu (số nhiều)' },
              { id: 'E', text: 'Xin lỗi, có lỗi' },
              { id: 'F', text: 'Không sao, không có gì' },
              { id: 'G', text: 'Cảm ơn' },
              { id: 'H', text: 'Đừng khách sáo, không có gì' },
              { id: 'I', text: 'Tạm biệt, hẹn gặp lại' },
              { id: 'J', text: 'Thầy giáo, cô giáo' }
            ],
            answer: {
              '1': 'A',
              '2': 'B',
              '3': 'C',
              '4': 'D',
              '5': 'E',
              '6': 'F',
              '7': 'G',
              '8': 'H',
              '9': 'I',
              '10': 'J'
            }
          }
        },
        {
          section_id: 'sec_mc_2',
          section_num: 2,
          type: 'multiple_choice',
          title: 'Phần 2: Trắc nghiệm (8 điểm)',
          description: 'Chọn đáp án chính xác nhất cho từng câu hỏi về ngữ âm, chữ Hán và giao tiếp Bài 1. Mỗi câu đúng được 1 điểm.',
          max_score: 8,
          shuffle_options: true,
          data: {
            items: [
              {
                id: 'MC1',
                prompt: 'Khi hai âm tiết mang thanh 3 đi liền nhau như "你好 (nǐ hǎo)", quy tắc biến điệu phát âm chuẩn là gì?',
                options: [
                  'Âm tiết thứ nhất biến điệu đọc thành thanh 2: ní hǎo',
                  'Cả hai âm tiết đều chuyển thành thanh 1: nī hāo',
                  'Âm tiết thứ hai biến điệu đọc thành thanh 4: nǐ hào',
                  'Giữ nguyên thanh 3 đọc nặng cả hai âm: nǐ hǎo'
                ],
                correctIndex: 0,
                explanation: 'Quy tắc biến điệu hai thanh 3 (3 + 3): Âm tiết thứ nhất bắt buộc biến âm thành thanh 2 (2 + 3 → ní hǎo).'
              },
              {
                id: 'MC2',
                prompt: 'Khi chào hỏi thầy cô giáo hoặc người lớn tuổi, từ xưng hô nào thể hiện sự tôn trọng, lễ phép nhất?',
                options: [
                  '您 (nín)',
                  '你 (nǐ)',
                  '他 (tā)',
                  '它 (tā)'
                ],
                correctIndex: 0,
                explanation: '"您" (nín) là đại từ nhân xưng ngôi thứ 2 số ít mang sắc thái kính cẩn, tôn kính (dưới chữ 你 có bộ Tâm 心).'
              },
              {
                id: 'MC3',
                prompt: 'Khi một người bạn nói "对不起 (duìbuqǐ)" với em, câu đáp lại lịch sự và tự nhiên nhất là:',
                options: [
                  '没关系 (méi guānxi)',
                  '不客气 (bú kèqi)',
                  '不用谢 (bú yòng xiè)',
                  '再见 (zàijiàn)'
                ],
                correctIndex: 0,
                explanation: 'Đáp lại lời xin lỗi "对不起" dùng "没关系" (không sao/không hề gì). Còn "不客气" dùng để đáp lại lời cảm ơn "谢谢".'
              },
              {
                id: 'MC4',
                prompt: 'Hậu tố nào dưới đây được thêm vào sau đại từ nhân xưng hoặc danh từ chỉ người để tạo dạng số nhiều?',
                options: [
                  '们 (men)',
                  '吗 (ma)',
                  '呢 (ne)',
                  '好 (hǎo)'
                ],
                correctIndex: 0,
                explanation: 'Hậu tố "们" (men) dùng để tạo số nhiều: 我们 (chúng tôi), 你们 (các bạn), 他们 (họ), 老师们 (các thầy cô).'
              },
              {
                id: 'MC5',
                prompt: 'Trong từ "谢谢 (xièxie)", âm tiết thứ hai mang thanh điệu gì?',
                options: [
                  'Thanh nhẹ (khinh thanh - đọc ngắn và nhẹ)',
                  'Thanh 1 (âm cao ngang bằng phẳng)',
                  'Thanh 4 (âm hạ nhanh, dứt khoát)',
                  'Thanh 3 (âm trầm xuống rồi lên)'
                ],
                correctIndex: 0,
                explanation: 'Trong từ lặp "谢谢", chữ thứ hai là thanh nhẹ (khinh thanh), phiên âm chuẩn là "xièxie".'
              },
              {
                id: 'MC6',
                prompt: 'Phó từ phủ định "不 (bù)" khi đứng trước chữ "客 (kè - mang thanh 4)" trong cụm "不客气" sẽ biến điệu như thế nào?',
                options: [
                  'Đọc thành thanh 2: bú (bú kèqi)',
                  'Đọc thành thanh 1: bū (bū kèqi)',
                  'Đọc thành thanh 3: bǔ (bǔ kèqi)',
                  'Giữ nguyên thanh 4: bù (bù kèqi)'
                ],
                correctIndex: 0,
                explanation: 'Quy tắc biến điệu của "不": khi đứng trước một âm tiết mang thanh 4, "不" (bù) biến điệu đọc thành thanh 2 "bú".'
              },
              {
                id: 'MC7',
                prompt: 'Chữ Hán nào dưới đây viết đúng của từ "Tạm biệt / Hẹn gặp lại"?',
                options: [
                  '再见 (zàijiàn)',
                  '在见 (zàijiàn)',
                  '见再 (jiànzài)',
                  '现见 (xiànjiàn)'
                ],
                correctIndex: 0,
                explanation: '"再见": chữ 再 (tái: lần nữa, lại) + 见 (kiến: gặp). "再见" có nghĩa gốc là "Hẹn gặp lại lần sau".'
              },
              {
                id: 'MC8',
                prompt: 'Câu nào sau đây là câu chào hỏi đúng ngữ pháp và lễ phép nhất khi gặp cô giáo vào buổi sáng?',
                options: [
                  '老师，您好！ (Lǎoshī, nín hǎo!)',
                  '您们好老师！ (Nínmen hǎo lǎoshī!)',
                  '你好老师，您好！ (Nǐ hǎo lǎoshī, nín hǎo!)',
                  '老师你好们！ (Lǎoshī nǐ hǎo men!)'
                ],
                correctIndex: 0,
                explanation: 'Cấu trúc chào hỏi chuẩn mực trong tiếng Trung: [Danh xưng/Chức danh] + [Lời chào]. Ví dụ: 老师，您好！ (Cô giáo, chào cô ạ!).'
              }
            ]
          }
        },
        {
          section_id: 'sec_fill_3',
          section_num: 3,
          type: 'fill_blank_wordbank',
          title: 'Phần 3: Điền từ có ngân hàng từ (7 điểm)',
          description: 'Chọn từ thích hợp từ ngân hàng từ bên trên để điền vào chỗ trống "____". Mỗi từ dùng 1 lần, mỗi câu đúng được 1 điểm.',
          max_score: 7,
          data: {
            wordbank: ['您', '好', '们', '对不起', '没关系', '谢谢', '再见'],
            items: [
              {
                id: 'FB1',
                text: '李老师，____好！',
                hint: 'Chào cô Lý ạ! (kính trọng)',
                answer: '您'
              },
              {
                id: 'FB2',
                text: '同学____，早上好！',
                hint: 'Chào các bạn học! (số nhiều)',
                answer: '们'
              },
              {
                id: 'FB3',
                text: 'A: ____！ B: 没关系。',
                hint: 'Xin lỗi!',
                answer: '对不起'
              },
              {
                id: 'FB4',
                text: 'A: 对不起！ B: ____。',
                hint: 'Không sao đâu / Không có gì.',
                answer: '没关系'
              },
              {
                id: 'FB5',
                text: 'A: ____你的帮助！ B: 不客气。',
                hint: 'Cảm ơn sự giúp đỡ của bạn!',
                answer: '谢谢'
              },
              {
                id: 'FB6',
                text: '明天____，李老师！',
                hint: 'Hẹn ngày mai gặp lại, cô Lý!',
                answer: '再见'
              },
              {
                id: 'FB7',
                text: '认识你，我也很____。',
                hint: 'Quen biết bạn, tôi cũng rất vui/tốt.',
                answer: '好'
              }
            ]
          }
        },
        {
          section_id: 'sec_err_4',
          section_num: 4,
          type: 'error_correction',
          title: 'Phần 4: Sửa câu sai (5 điểm)',
          description: 'Mỗi câu dưới đây có một lỗi sai ngữ pháp hoặc dùng từ. Em hãy viết lại câu đúng vào ô nhập. Mỗi câu đúng được 1 điểm.',
          max_score: 5,
          data: {
            items: [
              {
                id: 'ERR1',
                wrong: '大家们好！',
                situation: 'Chào mọi người trong lớp học',
                accepted: ['大家好！', '大家好', '大家好!'],
                explanation: 'Chữ "大家" (dàjiā) bản thân đã mang ý nghĩa số nhiều là "mọi người/cả nhà", do đó tuyệt đối không thêm hậu tố "们".'
              },
              {
                id: 'ERR2',
                wrong: '你叫什么名字是？',
                situation: 'Hỏi tên một người bạn mới quen',
                accepted: ['你叫什么名字？', '你叫什么名字', '你叫什么名字?'],
                explanation: 'Trong tiếng Trung, câu hỏi dùng đại từ nghi vấn "什么" (gì/cái gì) không dùng động từ "是" đặt ở cuối câu.'
              },
              {
                id: 'ERR3',
                wrong: '我很很高兴。',
                situation: 'Bày tỏ tâm trạng rất vui mừng khi gặp bạn',
                accepted: ['我很高兴。', '我很高兴', '我很高兴.'],
                explanation: 'Phó từ chỉ mức độ "很" (rất) là đơn âm tiết, không được lặp lại thành "很很". Đúng là "我很高兴。"'
              },
              {
                id: 'ERR4',
                wrong: '您们好！',
                situation: 'Chào các thầy cô giáo trong trường',
                accepted: ['老师们好！', '老师们好', '你们好！', '你们好', '老师好！', '老师好', '各位老师好！'],
                explanation: '"您" là đại từ nhân xưng ngôi thứ 2 số ít trang trọng, không đi với "们". Muốn chào nhiều thầy cô dùng "老师们好！" hoặc "你们好！".'
              },
              {
                id: 'ERR5',
                wrong: '不谢谢。',
                situation: 'Đáp lại lời cảm ơn của người khác',
                accepted: ['不客气。', '不客气', '不用谢。', '不用谢', '不客气!', '不用谢!'],
                explanation: 'Đáp lại lời cảm ơn "谢谢", người Trung Quốc dùng "不客气" (bú kèqi) hoặc "不用谢" (bú yòng xiè), tuyệt đối không dùng "不谢谢".'
              }
            ]
          }
        },
        {
          section_id: 'sec_trans_5',
          section_num: 5,
          type: 'translation',
          title: 'Phần 5: Dịch câu (5 điểm)',
          description: 'Dịch các câu sau theo đúng hướng yêu cầu (Việt → Trung hoặc Trung → Việt). Mỗi câu đúng được 1 điểm.',
          max_score: 5,
          data: {
            items: [
              {
                id: 'TR1',
                direction: 'vi->zh',
                mode: 'exact',
                prompt: 'Xin chào các bạn!',
                accepted: ['你们好！', '你们好', '大家好！', '大家好', '你们好!', '大家好!'],
                explanation: '"Các bạn" là 你们 (nǐmen), câu chào các bạn là 你们好！ Hoặc chào cả lớp/mọi người: 大家好！'
              },
              {
                id: 'TR2',
                direction: 'vi->zh',
                mode: 'exact',
                prompt: 'Thầy giáo, chào thầy ạ!',
                accepted: ['老师，您好！', '老师，您好', '老师您好！', '老师您好', '老师，你好！', '老师你好！', '老师，您好!', '老师您好!'],
                explanation: 'Chào thầy giáo lễ phép dùng kính ngữ: 老师，您好！'
              },
              {
                id: 'TR3',
                direction: 'vi->zh',
                mode: 'exact',
                prompt: 'Không sao đâu, đừng bận tâm.',
                accepted: ['没关系。', '没关系', '没关系!', '没关系！', '没事。', '没事'],
                explanation: 'Đáp lại lời xin lỗi hoặc trấn an người khác: 没关系。 (méi guānxi).'
              },
              {
                id: 'TR4',
                direction: 'zh->vi',
                mode: 'manual',
                prompt: '认识你，我也很高兴。 (Rènshi nǐ, wǒ yě hěn gāoxìng.)',
                grading_note: 'Dịch đúng nghĩa: "Làm quen/Quen biết bạn, tôi cũng rất vui / Rất vui được làm quen với bạn."',
                explanation: '认识 (rènshi: quen biết), 也 (yě: cũng), 高兴 (gāoxìng: vui mừng).'
              },
              {
                id: 'TR5',
                direction: 'zh->vi',
                mode: 'manual',
                prompt: '明天见，李老师！ (Míngtiān jiàn, Lǐ lǎoshī!)',
                grading_note: 'Dịch đúng nghĩa: "Ngày mai gặp lại, cô Lý! / Hẹn ngày mai gặp lại cô Lý!"',
                explanation: '明天 (míngtiān: ngày mai), 见 (jiàn: gặp), 李老师 (Lǐ lǎoshī: cô giáo Lý).'
              }
            ]
          }
        }
      ]
    },
    {
      exercise_id: 'EX_HSK2_LISTEN_1',
      title: 'Bài luyện tập Nghe hiểu — 课文 4 (Mẫu chuẩn HSK)',
      lesson_tag: 'Bài 1',
      total_score: 2,
      thresholds: { very_good: 2, good: 1 },
      sections: [
        {
          section_id: 'sec_listen_demo_1',
          section_num: 1,
          type: 'listening_mc',
          title: 'Phần 1: Nghe hiểu',
          description: 'Nghe đoạn hội thoại hai lần và chọn đáp án chính xác nhất cho mỗi câu hỏi.',
          max_score: 2,
          data: {
            context_label: '课文 4',
            context_title: '在宾馆房间，李文在写日记。',
            context_subtitle: 'Nghe đoạn hội thoại 2 lần và chọn đáp án đúng.',
            audio_label: '1-7',
            audio_url: '',
            audio_duration: '00:28',
            items: [
              {
                id: 'LS1',
                prompt: '李文回北京的路上花了多长时间？',
                options: [
                  '几个小时',
                  '十几个小时',
                  '几十个小时',
                  ''
                ],
                correctIndex: 1,
                explanation: 'Trong đoạn hội thoại, Lý Văn nói đã đi tàu mất hơn mười tiếng đồng hồ (十几个小时).'
              },
              {
                id: 'LS2',
                prompt: '李文觉得王老师的姐姐看起来怎么样？',
                options: [
                  '很累',
                  '很年轻',
                  '很像王老师',
                  ''
                ],
                correctIndex: 1,
                explanation: 'Nhân vật nói chị gái thầy Vương trông rất trẻ (看起来很年轻).'
              }
            ]
          }
        }
      ]
    }
  ],

  practiceSubmissions: [
    {
      submission_id: 'PRAC_SUB_01',
      exercise_id: 'EX_HSK1_BAI_1',
      student_id: 'HS01',
      student_name: 'Nguyễn Minh Anh',
      total_score: 33,
      max_score: 35,
      rating: 'very_good',
      submitted_at: '11/11/2026 15:30',
      section_scores: {
        'sec_matching_1': 10,
        'sec_mc_2': 8,
        'sec_fill_3': 7,
        'sec_err_4': 4,
        'sec_trans_5': 4
      },
      answers: {
        'sec_matching_1': { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E', '6': 'F', '7': 'G', '8': 'H', '9': 'I', '10': 'J' },
        'sec_mc_2': { 'MC1': 0, 'MC2': 0, 'MC3': 0, 'MC4': 0, 'MC5': 0, 'MC6': 0, 'MC7': 0, 'MC8': 0 },
        'sec_fill_3': { 'FB1': '您', 'FB2': '们', 'FB3': '对不起', 'FB4': '没关系', 'FB5': '谢谢', 'FB6': '再见', 'FB7': '好' },
        'sec_err_4': { 'ERR1': '大家好！', 'ERR2': '你叫什么名字？', 'ERR3': '我很高兴。', 'ERR4': '老师们好！', 'ERR5': '谢谢你。' },
        'sec_trans_5': { 'TR1': '你们好！', 'TR2': '老师，您好！', 'TR3': '没关系。', 'TR4': 'Quen biết bạn tôi cũng rất vui.', 'TR5': 'Hẹn gặp cô Lý ngày mai ạ!' }
      },
      manual_grades: {
        'TR4': { score: 1, comment: 'Dịch rất tự nhiên và chính xác!' },
        'TR5': { score: 1, comment: 'Đạt yêu cầu.' }
      },
      status: 'graded'
    }
  ]
};

/**
 * Shared Global Loading UI Controller (Progress Bar, Status Chip, Overlay & Button Spinners)
 */
window.StudySnapLoading = (function () {
  const ACTION_LABELS = {
    bootstrap: 'Đang đồng bộ dữ liệu hệ thống...',
    setupDatabase: 'Đang khởi tạo dữ liệu ban đầu...',
    login: 'Đang xác thực tài khoản...',
    submitHomework: 'Đang nộp BVN...',
    submitExitTicket: 'Đang lưu kết quả luyện tập...',
    submitPracticeExercise: 'Đang nộp bài luyện tập cuối buổi...',
    savePracticeExercise: 'Đang lưu đề luyện tập...',
    deletePracticeExercise: 'Đang xóa đề luyện tập...',
    gradeManualTranslation: 'Đang lưu điểm chấm câu dịch...',
    addAssignment: 'Đang giao bài tập mới...',
    deleteAssignment: 'Đang xóa bài tập...',
    assignExercisesToClass: 'Đang giao bài tập cho lớp...',
    unassignAssignment: 'Đang hủy giao bài cho lớp...',
    saveTeacherFeedback: 'Đang lưu nhận xét & phản hồi giọng nói...',
    createClass: 'Đang tạo lớp học mới...',
    deleteClass: 'Đang xóa lớp học...',
    changeStudentClass: 'Đang chuyển lớp cho học sinh...',
    createStudentAccount: 'Đang tạo tài khoản học sinh...',
    resetStudentPassword: 'Đang cập nhật mật khẩu học sinh...',
    deleteStudentAccount: 'Đang xóa tài khoản học sinh...',
    addVocabulary: 'Đang thêm từ vựng mới...',
    batchAddVocabulary: 'Đang nhập danh sách từ vựng...',
    deleteVocabulary: 'Đang xóa từ vựng...',
    uploadMedia: 'Đang tải tệp âm thanh/video lên Google Drive...',
    importFromBootstrapData: 'Đang chuyển dữ liệu sang Cloudflare D1...',
    getMedia: 'Đang tải tệp âm thanh...'
  };

  const OVERLAY_DETAILS = {
    bootstrap: {
      title: 'Đang đồng bộ dữ liệu hệ thống...',
      desc: 'Hệ thống đang cập nhật dữ liệu mới nhất từ máy chủ. Vui lòng đợi hoàn tất trước khi thao tác để tránh xung đột dữ liệu.'
    },
    setupDatabase: {
      title: 'Đang khởi tạo dữ liệu ban đầu...',
      desc: 'Hệ thống đang thiết lập dữ liệu mặc định. Vui lòng đợi trong giây lát.'
    },
    login: {
      title: 'Đang xác thực tài khoản...',
      desc: 'Hệ thống đang kiểm tra thông tin đăng nhập. Vui lòng đợi hoàn tất.'
    },
    submitHomework: {
      title: 'Đang nộp BVN...',
      desc: 'Vui lòng giữ nguyên trang cho đến khi hệ thống xác nhận đã lưu bài nộp BVN.'
    },
    submitExitTicket: {
      title: 'Đang lưu kết quả luyện tập...',
      desc: 'Vui lòng đợi hệ thống ghi nhận điểm bài luyện tập.'
    },
    submitPracticeExercise: {
      title: 'Đang nộp bài luyện tập cuối buổi...',
      desc: 'Hệ thống đang chấm điểm và đồng bộ bài làm lên máy chủ. Vui lòng đợi.'
    },
    savePracticeExercise: {
      title: 'Đang lưu & đồng bộ đề luyện tập...',
      desc: 'Vui lòng đợi quá trình lưu hoàn tất trước khi thao tác tiếp để tránh xung đột dữ liệu.'
    },
    deletePracticeExercise: {
      title: 'Đang xóa đề luyện tập...',
      desc: 'Vui lòng đợi hệ thống đồng bộ thay đổi.'
    },
    gradeManualTranslation: {
      title: 'Đang lưu điểm chấm câu dịch...',
      desc: 'Vui lòng đợi hệ thống cập nhật điểm số học sinh.'
    },
    addAssignment: {
      title: 'Đang giao bài tập mới...',
      desc: 'Vui lòng đợi hệ thống lưu bài tập và đồng bộ danh sách lớp.'
    },
    deleteAssignment: {
      title: 'Đang xóa bài tập...',
      desc: 'Vui lòng đợi hệ thống cập nhật danh sách bài tập.'
    },
    assignExercisesToClass: {
      title: 'Đang giao bài tập cho lớp...',
      desc: 'Vui lòng đợi hệ thống phân phối bài tập đến lớp học.'
    },
    unassignAssignment: {
      title: 'Đang hủy giao bài cho lớp...',
      desc: 'Vui lòng đợi hệ thống cập nhật trạng thái giao bài.'
    },
    saveTeacherFeedback: {
      title: 'Đang lưu nhận xét & phản hồi giọng nói...',
      desc: 'Vui lòng giữ nguyên trang cho đến khi hệ thống hoàn tất đồng bộ phản hồi.'
    },
    createClass: {
      title: 'Đang tạo lớp học mới...',
      desc: 'Vui lòng đợi hệ thống cập nhật danh sách lớp học.'
    },
    deleteClass: {
      title: 'Đang xóa lớp học...',
      desc: 'Vui lòng đợi hệ thống cập nhật danh sách lớp và học sinh.'
    },
    changeStudentClass: {
      title: 'Đang chuyển lớp cho học sinh...',
      desc: 'Vui lòng đợi hệ thống lưu lớp học mới.'
    },
    importFromBootstrapData: {
      title: 'Đang chuyển dữ liệu sang Cloudflare D1...',
      desc: 'Hệ thống đang đồng bộ dữ liệu ban đầu sang cơ sở dữ liệu tốc độ cao.'
    },
    createStudentAccount: {
      title: 'Đang tạo tài khoản học sinh...',
      desc: 'Vui lòng đợi hệ thống lưu tài khoản mới lên máy chủ.'
    },
    resetStudentPassword: {
      title: 'Đang cập nhật mật khẩu học sinh...',
      desc: 'Vui lòng đợi hệ thống đồng bộ mật khẩu mới.'
    },
    deleteStudentAccount: {
      title: 'Đang xóa tài khoản học sinh...',
      desc: 'Vui lòng đợi hệ thống hoàn tất xóa và đồng bộ dữ liệu.'
    },
    addVocabulary: {
      title: 'Đang thêm từ vựng mới...',
      desc: 'Vui lòng đợi hệ thống đồng bộ kho từ vựng.'
    },
    batchAddVocabulary: {
      title: 'Đang nhập danh sách từ vựng...',
      desc: 'Hệ thống đang đồng bộ hàng loạt từ vựng lên máy chủ. Vui lòng chờ.'
    },
    deleteVocabulary: {
      title: 'Đang xóa từ vựng...',
      desc: 'Vui lòng đợi hệ thống cập nhật lại kho từ vựng.'
    }
  };

  let activeRequests = [];
  let seqCounter = 0;
  let hideTimer = null;
  let blockingLocks = [];
  let lockSeqCounter = 0;
  let lastFocusedElement = null;
  let interactionGuardInstalled = false;
  const savedButtons = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function resolveLabel(actionOrLabel) {
    if (!actionOrLabel) return 'Đang kết nối máy chủ...';
    return ACTION_LABELS[actionOrLabel] || String(actionOrLabel);
  }

  function resolveOverlayMessage(actionOrTitle, customDesc) {
    const mapped = actionOrTitle ? OVERLAY_DETAILS[actionOrTitle] : null;
    if (mapped) {
      return {
        title: mapped.title,
        desc: customDesc ? String(customDesc) : mapped.desc
      };
    }
    return {
      title: actionOrTitle ? resolveLabel(actionOrTitle) : 'Đang đồng bộ dữ liệu hệ thống...',
      desc: customDesc
        ? String(customDesc)
        : 'Vui lòng đợi hệ thống hoàn tất đồng bộ trước khi thao tác để tránh xung đột dữ liệu.'
    };
  }

  function installInteractionGuard() {
    if (interactionGuardInstalled || typeof document === 'undefined' || !document.addEventListener) return;
    interactionGuardInstalled = true;
    const blockIfLocked = function (ev) {
      if (blockingLocks.length === 0) return;
      const overlay = document.getElementById('studysnap-loading-overlay');
      if (overlay && ev && ev.target && overlay.contains && overlay.contains(ev.target)) {
        return;
      }
      if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
      if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
      if (ev && typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
    };
    ['keydown', 'keypress', 'keyup', 'pointerdown', 'mousedown', 'click', 'submit'].forEach(function (evtName) {
      document.addEventListener(evtName, blockIfLocked, true);
    });
  }

  function ensureUi() {
    if (typeof document === 'undefined' || !document.body) return false;
    installInteractionGuard();

    if (!document.getElementById('studysnap-api-progress')) {
      const bar = document.createElement('div');
      bar.id = 'studysnap-api-progress';
      bar.className = 'ss-api-progress-bar';
      bar.setAttribute('aria-hidden', 'true');
      bar.innerHTML = '<div class="ss-api-progress-fill"></div>';
      document.body.appendChild(bar);
    }

    if (!document.getElementById('studysnap-api-pill')) {
      const chip = document.createElement('div');
      chip.id = 'studysnap-api-pill';
      chip.className = 'ss-api-status-chip';
      chip.setAttribute('role', 'status');
      chip.setAttribute('aria-live', 'polite');
      chip.innerHTML =
        '<span class="ss-spinner ss-spinner-sm" aria-hidden="true"></span>' +
        '<span id="studysnap-api-pill-text">Đang đồng bộ dữ liệu...</span>';
      document.body.appendChild(chip);
    }

    if (!document.getElementById('studysnap-loading-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'studysnap-loading-overlay';
      overlay.className = 'ss-loading-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-live', 'assertive');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-labelledby', 'studysnap-loading-title');
      overlay.setAttribute('aria-describedby', 'studysnap-loading-desc');
      overlay.setAttribute('tabindex', '-1');
      overlay.innerHTML =
        '<div class="ss-loading-card">' +
          '<div class="ss-loading-icon-badge" aria-hidden="true">' +
            '<span class="ss-spinner ss-spinner-lg"></span>' +
          '</div>' +
          '<h3 class="ss-loading-title" id="studysnap-loading-title">Đang đồng bộ dữ liệu hệ thống...</h3>' +
          '<p class="ss-loading-desc" id="studysnap-loading-desc">Vui lòng đợi hệ thống hoàn tất đồng bộ trước khi thao tác để tránh xung đột dữ liệu.</p>' +
          '<div class="ss-loading-progress-track" aria-hidden="true"><div class="ss-api-progress-fill"></div></div>' +
        '</div>';
      document.body.appendChild(overlay);
    }

    return true;
  }

  function syncIndicator() {
    if (!ensureUi()) return;
    const bar = document.getElementById('studysnap-api-progress');
    const chip = document.getElementById('studysnap-api-pill');
    const chipText = document.getElementById('studysnap-api-pill-text');
    if (!bar || !chip || !chipText) return;

    if (activeRequests.length > 0) {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      const latest = activeRequests[activeRequests.length - 1];
      chipText.textContent = latest.label;
      bar.classList.add('is-active');
      chip.classList.add('is-active');
    } else {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        if (activeRequests.length === 0) {
          bar.classList.remove('is-active');
          chip.classList.remove('is-active');
        }
      }, 80);
    }
  }

  function setPageInertLocked(locked) {
    if (typeof document === 'undefined' || !document.body) return;
    const rootEl = document.documentElement;
    const overlay = document.getElementById('studysnap-loading-overlay');
    const ignoredIds = {
      'studysnap-loading-overlay': true,
      'studysnap-api-progress': true,
      'studysnap-api-pill': true
    };
    const ignoredTags = { SCRIPT: true, STYLE: true, LINK: true, TEMPLATE: true, NOSCRIPT: true };

    if (locked) {
      if (!lastFocusedElement && document.activeElement && document.activeElement !== document.body && (!overlay || !overlay.contains || !overlay.contains(document.activeElement))) {
        lastFocusedElement = document.activeElement;
        if (typeof lastFocusedElement.blur === 'function') {
          try {
            lastFocusedElement.blur();
          } catch (e) {
            // ignore
          }
        }
      }
      if (rootEl && rootEl.classList) rootEl.classList.add('ss-sync-locked');
      if (document.body.classList) document.body.classList.add('ss-sync-locked');
      document.body.setAttribute('aria-busy', 'true');

      Array.prototype.forEach.call(document.body.children || [], function (child) {
        if (!child || ignoredIds[child.id] || ignoredTags[child.tagName]) return;
        if (child.getAttribute('data-ss-sync-inert') === '1') return;
        if (!child.inert) {
          child.setAttribute('data-ss-sync-inert', '1');
          const prevAriaHidden = child.getAttribute('aria-hidden');
          if (prevAriaHidden !== null) {
            child.setAttribute('data-ss-prev-aria-hidden', prevAriaHidden);
          }
          child.inert = true;
          child.setAttribute('aria-hidden', 'true');
        }
      });

      if (overlay && typeof overlay.focus === 'function') {
        try {
          overlay.focus({ preventScroll: true });
        } catch (e) {
          try {
            overlay.focus();
          } catch (e2) {
            // ignore
          }
        }
      }
    } else {
      if (rootEl && rootEl.classList) rootEl.classList.remove('ss-sync-locked');
      if (document.body.classList) document.body.classList.remove('ss-sync-locked');
      document.body.removeAttribute('aria-busy');

      if (typeof document.querySelectorAll === 'function') {
        document.querySelectorAll('[data-ss-sync-inert="1"]').forEach(function (child) {
          child.inert = false;
          const prevAriaHidden = child.getAttribute('data-ss-prev-aria-hidden');
          if (prevAriaHidden !== null) {
            child.setAttribute('aria-hidden', prevAriaHidden);
            child.removeAttribute('data-ss-prev-aria-hidden');
          } else {
            child.removeAttribute('aria-hidden');
          }
          child.removeAttribute('data-ss-sync-inert');
        });
      }

      if (lastFocusedElement) {
        const focusTarget = lastFocusedElement;
        lastFocusedElement = null;
        if (document.body.contains && document.body.contains(focusTarget) && !focusTarget.disabled && typeof focusTarget.focus === 'function') {
          try {
            focusTarget.focus({ preventScroll: true });
          } catch (e) {
            // ignore
          }
        }
      }
    }
  }

  function renderOverlayState() {
    if (blockingLocks.length === 0) {
      if (typeof document !== 'undefined') {
        const overlay = document.getElementById('studysnap-loading-overlay');
        if (overlay) {
          overlay.classList.remove('is-open');
          overlay.setAttribute('aria-hidden', 'true');
        }
        setPageInertLocked(false);
      }
      return;
    }

    if (!ensureUi()) return;
    // Ưu tiên thông báo explicit > lock đang thực thi (!isQueued) > lock đầu tiên đang chờ hàng đợi
    let activeEntry = null;
    for (let i = blockingLocks.length - 1; i >= 0; i--) {
      if (blockingLocks[i].isExplicit) {
        activeEntry = blockingLocks[i];
        break;
      }
    }
    if (!activeEntry) {
      for (let i = blockingLocks.length - 1; i >= 0; i--) {
        if (!blockingLocks[i].isQueued) {
          activeEntry = blockingLocks[i];
          break;
        }
      }
    }
    if (!activeEntry) {
      activeEntry = blockingLocks[0];
    }

    const overlay = document.getElementById('studysnap-loading-overlay');
    const titleEl = document.getElementById('studysnap-loading-title');
    const descEl = document.getElementById('studysnap-loading-desc');
    if (titleEl && activeEntry.title) titleEl.textContent = activeEntry.title;
    if (descEl && activeEntry.desc) descEl.textContent = activeEntry.desc;
    if (overlay) {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
    }
    setPageInertLocked(true);
  }

  function beginRequest(actionOrLabel) {
    seqCounter += 1;
    const id = 'req_' + seqCounter;
    activeRequests.push({ id: id, label: resolveLabel(actionOrLabel) });
    syncIndicator();
    return id;
  }

  function endRequest(id) {
    activeRequests = activeRequests.filter(function (r) {
      return r.id !== id;
    });
    syncIndicator();
  }

  async function trackPromise(actionOrLabel, promiseOrFn) {
    const id = beginRequest(actionOrLabel);
    try {
      const target = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
      return await target;
    } finally {
      endRequest(id);
    }
  }

  function beginBlockingSync(actionOrTitle, customDesc, options) {
    const opts = typeof options === 'boolean' ? { isExplicit: options } : (options || {});
    lockSeqCounter += 1;
    const lockId = 'lock_' + lockSeqCounter;
    const resolved = opts.isExplicit
      ? {
          title: actionOrTitle ? String(actionOrTitle) : 'Đang đồng bộ dữ liệu hệ thống...',
          desc: customDesc ? String(customDesc) : 'Vui lòng đợi trong giây lát để hệ thống hoàn tất đồng bộ.'
        }
      : resolveOverlayMessage(actionOrTitle, customDesc);
    blockingLocks.push({
      id: lockId,
      title: resolved.title,
      desc: resolved.desc,
      isExplicit: Boolean(opts.isExplicit),
      isQueued: Boolean(opts.isQueued)
    });
    renderOverlayState();
    return lockId;
  }

  function activateBlockingSync(lockId) {
    if (!lockId) return;
    blockingLocks.forEach(function (item) {
      if (item.id === lockId) {
        item.isQueued = false;
      }
    });
    renderOverlayState();
  }

  function endBlockingSync(lockId) {
    if (!lockId) return;
    blockingLocks = blockingLocks.filter(function (item) {
      return item.id !== lockId;
    });
    renderOverlayState();
  }

  function showOverlay(title, desc) {
    return beginBlockingSync(title, desc, true);
  }

  function hideOverlay(force) {
    if (force) {
      blockingLocks = [];
    } else if (blockingLocks.length > 0) {
      let popIdx = -1;
      for (let i = blockingLocks.length - 1; i >= 0; i--) {
        if (blockingLocks[i].isExplicit) {
          popIdx = i;
          break;
        }
      }
      if (popIdx === -1) popIdx = blockingLocks.length - 1;
      blockingLocks.splice(popIdx, 1);
    }
    renderOverlayState();
  }

  async function withOverlay(title, desc, asyncFn) {
    const lockId = showOverlay(title, desc);
    try {
      return await asyncFn();
    } finally {
      endBlockingSync(lockId);
    }
  }

  function toButtonArray(btnOrList) {
    if (!btnOrList) return [];
    if (Array.isArray(btnOrList)) return btnOrList.filter(Boolean);
    if (typeof btnOrList.length === 'number' && typeof btnOrList.tagName === 'undefined') {
      return Array.prototype.slice.call(btnOrList).filter(Boolean);
    }
    return [btnOrList];
  }

  function setSingleButtonLoading(btn, isLoading, loadingText) {
    if (!btn || typeof btn.tagName === 'undefined') return;
    if (isLoading) {
      if (savedButtons && !savedButtons.has(btn)) {
        savedButtons.set(btn, {
          html: btn.innerHTML,
          disabled: Boolean(btn.disabled)
        });
      }
      btn.disabled = true;
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      const existingText = btn.querySelector('.ss-btn-loading-label');
      if (existingText) {
        existingText.textContent = loadingText || 'Đang xử lý...';
      } else {
        btn.innerHTML = '';
        const spinner = document.createElement('span');
        spinner.className = 'ss-spinner ss-spinner-sm';
        spinner.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.className = 'ss-btn-loading-label';
        label.textContent = loadingText || 'Đang xử lý...';
        btn.appendChild(spinner);
        btn.appendChild(label);
      }
    } else {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      if (savedButtons && savedButtons.has(btn)) {
        const prev = savedButtons.get(btn);
        btn.innerHTML = prev.html;
        btn.disabled = prev.disabled;
        savedButtons.delete(btn);
      } else {
        btn.disabled = false;
      }
    }
  }

  function setButtonLoading(btnOrList, isLoading, loadingText) {
    toButtonArray(btnOrList).forEach(function (btn) {
      setSingleButtonLoading(btn, isLoading, loadingText);
    });
  }

  async function withButtonLoading(btnOrList, loadingText, asyncFn) {
    const btns = toButtonArray(btnOrList);
    if (btns.some(function (b) { return b.classList && b.classList.contains('is-loading'); })) {
      return null;
    }
    setButtonLoading(btns, true, loadingText);
    try {
      return await asyncFn();
    } finally {
      setButtonLoading(btns, false);
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      if (activeRequests.length > 0) syncIndicator();
      if (blockingLocks.length > 0) renderOverlayState();
    });
  }

  return {
    ACTION_LABELS: ACTION_LABELS,
    resolveLabel: resolveLabel,
    beginRequest: beginRequest,
    endRequest: endRequest,
    trackPromise: trackPromise,
    beginBlockingSync: beginBlockingSync,
    activateBlockingSync: activateBlockingSync,
    endBlockingSync: endBlockingSync,
    isLocked: function () { return blockingLocks.length > 0; },
    showOverlay: showOverlay,
    hideOverlay: hideOverlay,
    withOverlay: withOverlay,
    setButtonLoading: setButtonLoading,
    withButtonLoading: withButtonLoading
  };
})();

/**
 * Shared Scroll-to-Top Floating Button Controller
 */
window.StudySnapScrollTop = (function () {
  const SCROLL_THRESHOLD_PX = 260;
  let initialized = false;
  let rafScheduled = false;

  function getScrollOffset() {
    if (typeof window === 'undefined') return 0;
    if (typeof window.pageYOffset === 'number') return window.pageYOffset;
    if (typeof window.scrollY === 'number') return window.scrollY;
    if (typeof document !== 'undefined') {
      if (document.documentElement && typeof document.documentElement.scrollTop === 'number') {
        return document.documentElement.scrollTop;
      }
      if (document.body && typeof document.body.scrollTop === 'number') {
        return document.body.scrollTop;
      }
    }
    return 0;
  }

  function ensureButton() {
    if (typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
      return null;
    }
    let btn = document.getElementById('ss-scroll-top-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'ss-scroll-top-btn';
      btn.type = 'button';
      btn.className = 'ss-scroll-top-btn';
      if (typeof btn.setAttribute === 'function') {
        btn.setAttribute('aria-label', 'Cuộn lên đầu trang');
        btn.setAttribute('title', 'Lên đầu trang');
        btn.setAttribute('aria-hidden', 'true');
      }
      btn.tabIndex = -1;
      btn.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<line x1="12" y1="19" x2="12" y2="5"></line>' +
          '<polyline points="5 12 12 5 19 12"></polyline>' +
        '</svg>';
      if (typeof document.body.appendChild === 'function') {
        document.body.appendChild(btn);
      }
    }
    return btn;
  }

  function syncVisibility() {
    rafScheduled = false;
    const btn = ensureButton();
    if (!btn) return;
    const isVisible = getScrollOffset() > SCROLL_THRESHOLD_PX;
    if (btn.classList && typeof btn.classList.toggle === 'function') {
      btn.classList.toggle('is-visible', isVisible);
    }
    if (typeof btn.setAttribute === 'function') {
      btn.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
    }
    btn.tabIndex = isVisible ? 0 : -1;
  }

  function scheduleSync() {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      if (rafScheduled) return;
      rafScheduled = true;
      window.requestAnimationFrame(syncVisibility);
    } else {
      syncVisibility();
    }
  }

  function scrollToTop() {
    if (typeof window === 'undefined') return;
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }
    if (typeof document !== 'undefined') {
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
  }

  function init() {
    if (initialized) {
      syncVisibility();
      return ensureButton();
    }
    const btn = ensureButton();
    if (!btn) return null;
    initialized = true;

    if (typeof btn.addEventListener === 'function') {
      btn.addEventListener('click', scrollToTop);
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('scroll', scheduleSync, { passive: true });
      window.addEventListener('resize', scheduleSync, { passive: true });
    }
    syncVisibility();
    return btn;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading' && typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    init: init,
    sync: syncVisibility,
    scrollToTop: scrollToTop
  };
})();

/**
 * Shared Store & Backend Sync Manager
 */
window.StudySnapStore = (function () {
  const STORAGE_KEY = 'studysnap_app_state_zh_v1';
  const GAS_URL_KEY = 'studysnap_gas_webapp_url';
  const DEFAULT_GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwVkdgBgbyjOe9vFz-8dhut231bViQkEOgyUEwJbFHN1ww16w-Vkgq45IB9d1baxNRcaw/exec';
  const D1_API_ENDPOINT = '/api';
  let backendMode = 'unknown';
  let inflightProbePromise = null;
  let inflightMigrationPromise = null;
  let inflightBootstrapPromise = null;
  let writeSyncQueue = Promise.resolve();

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
          const isProd = parsed.isClearedForProduction === true;
          if (!Array.isArray(parsed.classes) || (!isProd && parsed.classes.length === 0)) {
            parsed.classes = isProd ? [] : JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA.classes || []));
          }
          (parsed.students || []).forEach(function (st) {
            const c = (st.class_name || '').trim();
            if (
              c &&
              c !== 'Chưa xếp lớp' &&
              c !== 'all' &&
              c !== 'unassigned' &&
              !parsed.classes.some(function (cls) { return cls.class_name.toLowerCase() === c.toLowerCase(); })
            ) {
              parsed.classes.push({
                class_id: 'CLS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                class_name: c,
                created_at: st.created_at || '01/11/2026'
              });
            }
          });
          parsed.lessons = Array.isArray(parsed.lessons)
            ? parsed.lessons.filter(function (l) { return Boolean(l && l.isCustom === true); })
            : [];
          if (!Array.isArray(parsed.vocabulary)) {
            parsed.vocabulary = isProd ? [] : JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA.vocabulary || []));
          }
          if (isProd) {
            if (!Array.isArray(parsed.assignments)) parsed.assignments = [];
            if (!Array.isArray(parsed.submissions)) parsed.submissions = [];
          }
          if (!isProd && (!Array.isArray(parsed.assignments) || parsed.assignments.length === 0 || !parsed.assignments.some(function (a) { return a.assignment_id === 'BVN01_1'; }))) {
            parsed.assignments = JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA.assignments || []));
            parsed.submissions = JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA.submissions || []));
          } else {
            parsed.assignments.forEach(function (a) {
              if (!a.session_tag) {
                a.session_tag = (a.lesson_tag && a.lesson_tag.replace('Bài', 'Buổi')) || 'Buổi 1';
              }
              if (!a.class_name) {
                a.class_name = a.require_media === 'practice' ? 'unassigned' : 'all';
              }
            });
          }
          if (!Array.isArray(parsed.practiceExercises)) {
            parsed.practiceExercises = isProd ? [] : JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA.practiceExercises || []));
          }
          if (!Array.isArray(parsed.practiceSubmissions)) {
            parsed.practiceSubmissions = isProd ? [] : JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA.practiceSubmissions || []));
          }
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

  function applyDeltaResponseToState(stateObj, payload, json) {
    if (!stateObj || !json || !json.ok) return;
    const action = payload && payload.action ? String(payload.action) : '';

    if (action === 'submitHomework' && json.submission) {
      const targetAsgId = String(payload.assignment_id || '').trim();
      const targetStuId = String(payload.student_id || '').trim();
      if (!Array.isArray(stateObj.submissions)) stateObj.submissions = [];
      const subList = stateObj.submissions;
      const found = subList.find(function (s) {
        return (
          (json.submission.submission_id && s.submission_id === json.submission.submission_id) ||
          (s.assignment_id === targetAsgId && s.student_id === targetStuId)
        );
      });
      if (found) {
        if (json.submission.submission_id) found.submission_id = json.submission.submission_id;
        if (json.submission.media_url !== undefined && json.submission.media_url !== '') {
          found.media_url = json.submission.media_url;
        }
        if (json.submission.status) found.status = json.submission.status;
        if (json.submission.score !== undefined) found.score = String(json.submission.score);
        else if (payload.score !== undefined) found.score = String(payload.score);
        if (json.submission.student_note !== undefined) found.student_note = String(json.submission.student_note);
        else if (payload.student_note !== undefined) found.student_note = String(payload.student_note);
        if (json.submission.media_duration) found.media_duration = String(json.submission.media_duration);
        else if (payload.media_duration) found.media_duration = String(payload.media_duration);
        if (payload.media_type) found.media_type = String(payload.media_type);
        if (json.submission.submitted_at) found.submitted_at = String(json.submission.submitted_at);
      } else if (targetAsgId && targetStuId) {
        subList.push({
          submission_id: json.submission.submission_id || ('SUB_' + Date.now()),
          assignment_id: targetAsgId,
          student_id: targetStuId,
          submitted_at: json.submission.submitted_at || new Date().toLocaleString('vi-VN'),
          student_note: String(
            json.submission.student_note !== undefined ? json.submission.student_note : (payload.student_note || '')
          ),
          media_type: String(payload.media_type || 'audio'),
          media_url: json.submission.media_url || String(payload.media_url || ''),
          media_duration: String(json.submission.media_duration || payload.media_duration || '01:00'),
          status: json.submission.status || (payload.status || 'submitted'),
          score: json.submission.score !== undefined ? String(json.submission.score) : (payload.score !== undefined ? String(payload.score) : '')
        });
      }
    } else if (action === 'saveTeacherFeedback' && json.submission) {
      const targetAsgId = String(payload.assignment_id || '').trim();
      const targetStuId = String(payload.student_id || '').trim();
      const subList = Array.isArray(stateObj.submissions) ? stateObj.submissions : [];
      const found = subList.find(function (s) {
        return (
          (json.submission.submission_id && s.submission_id === json.submission.submission_id) ||
          (s.assignment_id === targetAsgId && s.student_id === targetStuId)
        );
      });
      if (found) {
        if (json.submission.submission_id) found.submission_id = json.submission.submission_id;
        if (json.submission.teacher_voice_url) found.teacher_voice_url = json.submission.teacher_voice_url;
        if (json.submission.status) found.status = json.submission.status;
      }
    } else if (action === 'savePracticeExercise' && json.practiceExercise) {
      const pe = json.practiceExercise;
      const exList = Array.isArray(stateObj.practiceExercises) ? stateObj.practiceExercises : [];
      const foundEx = exList.find(function (e) {
        return e.exercise_id === pe.exercise_id;
      });
      if (foundEx) {
        if (Array.isArray(pe.sections)) foundEx.sections = pe.sections;
        if (pe.updated_at) foundEx.updated_at = pe.updated_at;
        if (pe.title) foundEx.title = pe.title;
        if (pe.lesson_tag) foundEx.lesson_tag = pe.lesson_tag;
        if (pe.total_score !== undefined) foundEx.total_score = pe.total_score;
        syncLinkedPracticeAssignments(stateObj, foundEx);
      }
    } else if (action === 'createStudentAccount' && json.student) {
      const stu = json.student;
      const students = Array.isArray(stateObj.students) ? stateObj.students : [];
      const foundStu = students.find(function (s) {
        return s.student_id === stu.student_id || (stu.username && s.username === stu.username);
      });
      if (foundStu) {
        foundStu.student_id = stu.student_id || foundStu.student_id;
      }
    }

    if (json.version && stateObj.lastRemoteBootstrapAt) {
      stateObj.syncVersion = String(json.version);
    }
    saveState(stateObj);
  }

  function mergeRemoteData(stateObj, remoteData) {
    if (!remoteData) return stateObj;
    if (
      Array.isArray(remoteData.teachers) ||
      Array.isArray(remoteData.students) ||
      Array.isArray(remoteData.practiceExercises)
    ) {
      stateObj.lastRemoteBootstrapAt = Date.now();
    }
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
    } else if (remoteData.isProduction === false) {
      stateObj.isClearedForProduction = false;
    }

    if (Array.isArray(remoteData.teachers)) {
      if (remoteData.teachers.length > 0) {
        stateObj.teachers = remoteData.teachers.map(function (t) {
          const subj = String(t.subject || '');
          return {
            teacher_id: t.teacher_id || 'GV01',
            full_name: t.full_name || 'Hồ Châu Uyển Nhi',
            username: String(t.username || 'gv_uyennhi'),
            password: String(t.password || '123456'),
            subject: !subj || subj.indexOf('Tiếng Anh') >= 0 ? 'Tiếng Trung Giao Tiếp & HSK' : subj
          };
        });
      } else if (remoteIsCleared || stateObj.isClearedForProduction === true) {
        stateObj.teachers = [];
      }
    }

    if (Array.isArray(remoteData.classes) && (remoteData.classes.length > 0 || remoteData.isProduction === true || stateObj.isClearedForProduction === true)) {
      stateObj.classes = remoteData.classes.map(function (c) {
        return {
          class_id: c.class_id || ('CLS_' + Date.now()),
          class_name: String(c.class_name || '').trim(),
          created_at: formatCleanDate(c.created_at) || '01/11/2026'
        };
      }).filter(function (c) { return Boolean(c.class_name); });
    } else if (
      (remoteIsCleared || stateObj.isClearedForProduction === true) &&
      Array.isArray(remoteData.students) &&
      remoteData.students.length === 0 &&
      Array.isArray(remoteData.assignments) &&
      remoteData.assignments.length === 0
    ) {
      stateObj.classes = [];
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
      stateObj.students.forEach(function (st) {
        const c = String(st.class_name || '').trim();
        if (
          c &&
          c !== 'Chưa xếp lớp' &&
          c !== 'all' &&
          c !== 'unassigned' &&
          Array.isArray(stateObj.classes) &&
          !stateObj.classes.some(function (cls) { return String(cls.class_name || '').toLowerCase() === c.toLowerCase(); })
        ) {
          stateObj.classes.push({
            class_id: 'CLS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            class_name: c,
            created_at: st.created_at || '01/11/2026'
          });
        }
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
          session_tag: a.session_tag || (a.lesson_tag && a.lesson_tag.replace('Bài', 'Buổi')) || 'Buổi 1',
          title: a.title,
          lesson_tag: a.lesson_tag,
          lesson_id: a.lesson_id || '',
          exercise_id: a.exercise_id || '',
          class_name:
            a.class_name !== undefined && a.class_name !== null && String(a.class_name).trim() !== ''
              ? String(a.class_name).trim()
              : (a.require_media === 'practice' ? 'unassigned' : 'all'),
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

    if (Array.isArray(remoteData.practiceExercises) && (remoteData.practiceExercises.length > 0 || remoteData.isProduction === true || stateObj.isClearedForProduction === true)) {
      stateObj.practiceExercises = remoteData.practiceExercises.map(function (pe) {
        return {
          exercise_id: pe.exercise_id,
          title: pe.title,
          lesson_tag: pe.lesson_tag,
          total_score: Number(pe.total_score) || 35,
          thresholds: typeof pe.thresholds_json === 'string' ? JSON.parse(pe.thresholds_json || '{}') : (pe.thresholds || { very_good: 31, good: 25 }),
          sections: typeof pe.sections_json === 'string' ? JSON.parse(pe.sections_json || '[]') : (pe.sections || []),
          created_at: formatCleanDate(pe.created_at) || ''
        };
      });
    }
    if (Array.isArray(stateObj.lessons)) {
      stateObj.lessons = stateObj.lessons.filter(function (l) {
        return Boolean(l && l.isCustom === true);
      });
    } else {
      stateObj.lessons = [];
    }

    if (Array.isArray(remoteData.practiceSubmissions)) {
      stateObj.practiceSubmissions = remoteData.practiceSubmissions.map(function (ps) {
        return {
          submission_id: ps.submission_id,
          exercise_id: ps.exercise_id,
          student_id: ps.student_id,
          student_name: ps.student_name,
          total_score: Number(ps.total_score) || 0,
          max_score: Number(ps.max_score) || 35,
          rating: ps.rating || '',
          submitted_at: formatCleanDate(ps.submitted_at),
          section_scores: typeof ps.section_scores_json === 'string' ? JSON.parse(ps.section_scores_json || '{}') : (ps.section_scores || {}),
          answers: typeof ps.answers_json === 'string' ? JSON.parse(ps.answers_json || '{}') : (ps.answers || {}),
          manual_grades: typeof ps.manual_grades_json === 'string' ? JSON.parse(ps.manual_grades_json || '{}') : (ps.manual_grades || {}),
          status: ps.status || 'submitted'
        };
      });
    }

    saveState(stateObj);
    return stateObj;
  }

  function normalizeChineseSentence(str) {
    if (!str) return '';
    let s = String(str).trim();
    // Chuẩn hóa dấu toàn góc sang bán góc
    s = s.replace(/！/g, '!')
         .replace(/，/g, ',')
         .replace(/。/g, '.')
         .replace(/？/g, '?')
         .replace(/：/g, ':')
         .replace(/；/g, ';')
         .replace(/[“”]/g, '"')
         .replace(/[‘’]/g, "'")
         .replace(/（/g, '(')
         .replace(/）/g, ')');
    // Không phân biệt hoa/thường với pinyin
    s = s.toLowerCase();
    // Bỏ khoảng trắng thừa
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  function isAnswerMatch(studentInput, acceptedList) {
    if (!studentInput || !Array.isArray(acceptedList) || acceptedList.length === 0) return false;
    const inputNorm = normalizeChineseSentence(studentInput).toLowerCase();
    const inputNoPunct = inputNorm.replace(/[!.,?:;'"()]/g, '').trim();

    return acceptedList.some(function (acc) {
      const accNorm = normalizeChineseSentence(acc).toLowerCase();
      if (inputNorm === accNorm) return true;
      const accNoPunct = accNorm.replace(/[!.,?:;'"()]/g, '').trim();
      return inputNoPunct === accNoPunct;
    });
  }

  function isKeywordsMatch(studentInput, requiredKeywords) {
    if (!studentInput || !Array.isArray(requiredKeywords) || requiredKeywords.length === 0) return false;
    const inputNorm = normalizeChineseSentence(studentInput).toLowerCase();
    return requiredKeywords.every(function (kw) {
      const kwNorm = normalizeChineseSentence(kw).toLowerCase();
      return inputNorm.indexOf(kwNorm) !== -1;
    });
  }

  function calculateRating(score, thresholds) {
    const t = thresholds || { very_good: 31, good: 25 };
    const num = Number(score) || 0;
    if (num >= (t.very_good || 31)) {
      return { key: 'very_good', label: 'Rất tốt 🌟', badgeClass: 'status-graded' };
    }
    if (num >= (t.good || 25)) {
      return { key: 'good', label: 'Khá 👍', badgeClass: 'status-submitted' };
    }
    return { key: 'needs_review', label: 'Cần ôn tập lại 📚', badgeClass: 'status-missing' };
  }

  async function fetchWithTimeout(url, options, timeoutMs) {
    if (typeof AbortController === 'undefined') {
      return await fetch(url, options);
    }
    const controller = new AbortController();
    const timer = setTimeout(function () {
      controller.abort();
    }, timeoutMs || 25000);
    try {
      const fetchOpts = Object.assign({}, options || {}, { signal: controller.signal });
      return await fetch(url, fetchOpts);
    } finally {
      clearTimeout(timer);
    }
  }

  function canProbeD1Endpoint() {
    return Boolean(
      typeof window !== 'undefined' &&
        window.location &&
        /^https?:$/i.test(String(window.location.protocol || '')) &&
        typeof fetch === 'function'
    );
  }

  async function postD1Json(bodyObj, timeoutMs) {
    const response = await fetchWithTimeout(
      D1_API_ENDPOINT,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
      },
      timeoutMs || 20000
    );
    const json = await response.json();
    return { response: response, json: json };
  }

  async function probeD1Mode() {
    if (backendMode !== 'unknown') return backendMode;
    if (!canProbeD1Endpoint()) {
      backendMode = 'gas';
      return backendMode;
    }
    if (inflightProbePromise) return await inflightProbePromise;
    inflightProbePromise = (async function () {
      try {
        const res = await fetchWithTimeout(D1_API_ENDPOINT + '?action=ping', {}, 5000);
        const json = await res.json();
        if (json && json.backend === 'cloudflare-d1' && !json.d1Missing && res.ok) {
          backendMode = 'd1';
          return 'd1';
        }
      } catch (e) {
        // Fallback sang GAS neu khong co Pages Function /api
      } finally {
        inflightProbePromise = null;
      }
      backendMode = 'gas';
      return 'gas';
    })();
    return await inflightProbePromise;
  }

  async function ensureD1Migrated(stateObj) {
    if (inflightMigrationPromise) return await inflightMigrationPromise;
    inflightMigrationPromise = (async function () {
      try {
        const gasUrl = getGasUrl();
        let migratedFromSheets = false;
        if (gasUrl) {
          try {
            const gasRes = await fetchWithTimeout(gasUrl + '?action=bootstrap', {}, 25000);
            const gasJson = await gasRes.json();
            if (gasJson && gasJson.ok && gasJson.data) {
              const d = gasJson.data;
              const hasAnyGasData = Boolean(
                d.isProduction === true ||
                  (Array.isArray(d.teachers) && d.teachers.length > 0) ||
                  (Array.isArray(d.students) && d.students.length > 0) ||
                  (Array.isArray(d.assignments) && d.assignments.length > 0) ||
                  (Array.isArray(d.practiceExercises) && d.practiceExercises.length > 0) ||
                  (Array.isArray(d.vocabulary) && d.vocabulary.length > 0)
              );
              if (hasAnyGasData) {
                const importOut = await postD1Json(
                  { action: 'importFromBootstrapData', data: d },
                  30000
                );
                if (importOut && importOut.json && importOut.json.ok) {
                  migratedFromSheets = true;
                  if (importOut.json.version && stateObj) {
                    stateObj.syncVersion = String(importOut.json.version);
                    stateObj.syncBackend = 'd1';
                  }
                  if (importOut.json.data) mergeRemoteData(stateObj, importOut.json.data);
                  return importOut.json;
                }
              }
            }
          } catch (gasMigrateErr) {
            // Tiep tuc setupDatabase neu khong doc duoc GAS cu
          }
        }
        if (!migratedFromSheets) {
          const setupOut = await postD1Json({ action: 'setupDatabase' }, 20000);
          if (setupOut && setupOut.json && setupOut.json.ok) {
            if (setupOut.json.version && stateObj) {
              stateObj.syncVersion = String(setupOut.json.version);
              stateObj.syncBackend = 'd1';
            }
            if (setupOut.json.data) mergeRemoteData(stateObj, setupOut.json.data);
            return setupOut.json;
          }
        }
        return null;
      } finally {
        inflightMigrationPromise = null;
      }
    })();
    return await inflightMigrationPromise;
  }

  function cacheUploadedDriveMedia(mediaUrl, dataUrl, filename) {
    try {
      if (
        typeof window !== 'undefined' &&
        window.StudySnapAudio &&
        typeof window.StudySnapAudio.cacheDriveMediaFromDataUrl === 'function'
      ) {
        window.StudySnapAudio.cacheDriveMediaFromDataUrl(mediaUrl, dataUrl, filename);
      }
    } catch (e) {
      // Ignore cache warm-up errors
    }
  }

  async function uploadMediaToDriveViaGas(mediaOpts) {
    const gasUrl = getGasUrl();
    if (!gasUrl) {
      return { ok: false, error: 'Chưa cấu hình cầu nối Google Apps Script cho Google Drive.' };
    }
    try {
      const response = await fetchWithTimeout(
        gasUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'uploadMedia',
            base64_data: mediaOpts.base64_data,
            mime_type: mediaOpts.mime_type || 'audio/webm',
            filename: mediaOpts.filename || ('StudySnap_' + Date.now())
          })
        },
        90000
      );
      const json = await response.json();
      if (!json || !json.ok || !json.media_url) {
        const legacyHint =
          json && json.error && String(json.error).indexOf('không hợp lệ') >= 0
            ? 'Vui lòng cập nhật và Deploy New Version cho backend/Code.gs để bật tải tệp lên Google Drive.'
            : (json && json.error) || 'Không thể tải tệp âm thanh/video lên Google Drive.';
        return { ok: false, error: legacyHint };
      }
      return json;
    } catch (err) {
      const isAbort = err && err.name === 'AbortError';
      return {
        ok: false,
        error: isAbort
          ? 'Tải tệp âm thanh lên Google Drive quá thời gian (tệp hơi lớn hoặc mạng chậm). Vui lòng thử lại.'
          : 'Không thể kết nối cầu nối Google Drive (GAS) khi tải tệp âm thanh.'
      };
    }
  }

  function cleanupDriveMediaViaGas(urls) {
    const gasUrl = getGasUrl();
    if (!gasUrl || !Array.isArray(urls) || urls.length === 0 || typeof fetch !== 'function') return;
    try {
      fetch(gasUrl, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteMediaFiles', urls: urls })
      }).catch(function () {});
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  function inferMimeAndExtFromDataUrl(dataUrl, fallbackMime) {
    const mimeMatch = String(dataUrl || '').match(/^data:([^;]+);base64,/i);
    const mimeType = (mimeMatch && mimeMatch[1] ? mimeMatch[1] : fallbackMime || 'audio/webm').toLowerCase();
    let ext = '.webm';
    if (mimeType.indexOf('wav') >= 0) ext = '.wav';
    else if (mimeType.indexOf('mp3') >= 0 || mimeType.indexOf('mpeg') >= 0) ext = '.mp3';
    else if (mimeType.indexOf('video') >= 0) ext = '.mp4';
    else if (mimeType.indexOf('mp4') >= 0 || mimeType.indexOf('m4a') >= 0) ext = '.m4a';
    return { mimeType: mimeType, ext: ext };
  }

  async function prepareD1MediaPayload(stateObj, rawPayload) {
    const payloadCopy = Object.assign({}, rawPayload || {});
    const actionName = String(payloadCopy.action || '');

    if (actionName === 'submitHomework' && payloadCopy.media_base64 && String(payloadCopy.media_base64).indexOf('data:') === 0) {
      const hwMeta = inferMimeAndExtFromDataUrl(
        payloadCopy.media_base64,
        payloadCopy.media_mime_type || (payloadCopy.media_type === 'video' ? 'video/mp4' : 'audio/webm')
      );
      const up = await uploadMediaToDriveViaGas({
        base64_data: payloadCopy.media_base64,
        mime_type: hwMeta.mimeType,
        filename: payloadCopy.media_filename || ('BVN_' + (payloadCopy.assignment_id || 'EX') + '_' + (payloadCopy.student_id || 'HS') + '_' + Date.now() + hwMeta.ext)
      });
      if (!up.ok) return { errorResponse: up };
      cacheUploadedDriveMedia(up.media_url, payloadCopy.media_base64, payloadCopy.media_filename);
      payloadCopy.media_url = up.media_url;
      payloadCopy.media_base64 = '';
      if (stateObj && Array.isArray(stateObj.submissions)) {
        const localSub = stateObj.submissions.find(function (s) {
          return s.assignment_id === payloadCopy.assignment_id && s.student_id === payloadCopy.student_id;
        });
        if (localSub) {
          localSub.media_url = up.media_url;
          saveState(stateObj);
        }
      }
      return { payload: payloadCopy };
    }

    if (actionName === 'saveTeacherFeedback' && payloadCopy.teacher_voice_base64 && String(payloadCopy.teacher_voice_base64).indexOf('data:') === 0) {
      const fbMeta = inferMimeAndExtFromDataUrl(
        payloadCopy.teacher_voice_base64,
        payloadCopy.teacher_voice_mime_type || 'audio/webm'
      );
      const upVoice = await uploadMediaToDriveViaGas({
        base64_data: payloadCopy.teacher_voice_base64,
        mime_type: fbMeta.mimeType,
        filename: 'VoiceFeedback_' + (payloadCopy.assignment_id || 'EX') + '_' + (payloadCopy.student_id || 'HS') + '_' + Date.now() + fbMeta.ext
      });
      if (!upVoice.ok) return { errorResponse: upVoice };
      cacheUploadedDriveMedia(upVoice.media_url, payloadCopy.teacher_voice_base64, 'voice_feedback.webm');
      payloadCopy.teacher_voice_url = upVoice.media_url;
      payloadCopy.teacher_voice_base64 = '';
      if (stateObj && Array.isArray(stateObj.submissions)) {
        const localSub = stateObj.submissions.find(function (s) {
          return s.assignment_id === payloadCopy.assignment_id && s.student_id === payloadCopy.student_id;
        });
        if (localSub) {
          localSub.teacher_voice_url = upVoice.media_url;
          saveState(stateObj);
        }
      }
      return { payload: payloadCopy };
    }

    if (actionName === 'savePracticeExercise') {
      const exSource = payloadCopy.exercise || payloadCopy;
      const exClone = JSON.parse(JSON.stringify(exSource));
      const exId = String(exClone.exercise_id || ('EX_' + Date.now()));
      const uploadTasks = [];

      if (Array.isArray(exClone.sections)) {
        exClone.sections.forEach(function (sec, sIdx) {
          if (!sec || !sec.data) return;
          const secPrefix = exId + '_' + (sec.section_id || ('listen_' + (sIdx + 1)));
          if (typeof sec.data.audio_url === 'string' && sec.data.audio_url.indexOf('data:') === 0) {
            uploadTasks.push({
              target: sec.data,
              dataUrl: sec.data.audio_url,
              prefix: secPrefix
            });
          }
          if (Array.isArray(sec.data.items)) {
            sec.data.items.forEach(function (item, qIdx) {
              if (item && typeof item.audio_url === 'string' && item.audio_url.indexOf('data:') === 0) {
                uploadTasks.push({
                  target: item,
                  dataUrl: item.audio_url,
                  prefix: secPrefix + '_' + (item.id || ('q' + (qIdx + 1)))
                });
              }
            });
          }
        });
      }

      if (uploadTasks.length > 0) {
        const CONCURRENCY = 3;
        for (let i = 0; i < uploadTasks.length; i += CONCURRENCY) {
          const chunk = uploadTasks.slice(i, i + CONCURRENCY);
          const results = await Promise.all(
            chunk.map(function (task) {
              const meta = inferMimeAndExtFromDataUrl(task.dataUrl, 'audio/webm');
              return uploadMediaToDriveViaGas({
                base64_data: task.dataUrl,
                mime_type: meta.mimeType,
                filename: task.prefix + '_' + Date.now() + meta.ext
              });
            })
          );
          for (let j = 0; j < results.length; j++) {
            if (!results[j] || !results[j].ok || !results[j].media_url) {
              return { errorResponse: results[j] || { ok: false, error: 'Lỗi tải file nghe lên Google Drive.' } };
            }
            cacheUploadedDriveMedia(results[j].media_url, chunk[j].dataUrl, chunk[j].prefix);
            chunk[j].target.audio_url = results[j].media_url;
          }
        }
        if (exSource && exSource !== stateObj && Array.isArray(exSource.sections)) {
          exSource.sections = JSON.parse(JSON.stringify(exClone.sections));
        }
        if (stateObj && Array.isArray(stateObj.practiceExercises)) {
          const idx = stateObj.practiceExercises.findIndex(function (e) {
            return e.exercise_id === exClone.exercise_id;
          });
          if (idx >= 0) {
            stateObj.practiceExercises[idx].sections = exClone.sections;
            saveState(stateObj);
          }
        }
      }

      if (payloadCopy.exercise) {
        payloadCopy.exercise = exClone;
      } else {
        Object.assign(payloadCopy, exClone);
      }
      return { payload: payloadCopy };
    }

    return { payload: payloadCopy };
  }

  async function syncPostToGas(stateObj, payload) {
    const mode = await probeD1Mode();
    const url = getGasUrl();
    if (mode === 'gas' && !url) return null;
    const loadingCtrl = typeof window !== 'undefined' ? window.StudySnapLoading : null;
    const actionName = payload && payload.action ? payload.action : 'sync';
    const customLabel = (payload && payload._loadingLabel) || actionName;
    const hasHeavyBody = Boolean(
      payload &&
        (payload.media_base64 ||
          payload.teacher_voice_base64 ||
          (Array.isArray(payload.vocabulary) && payload.vocabulary.length > 10))
    );
    const reqId = loadingCtrl ? loadingCtrl.beginRequest(customLabel) : null;
    const lockId = loadingCtrl && loadingCtrl.beginBlockingSync
      ? loadingCtrl.beginBlockingSync(customLabel, null, { isQueued: true })
      : null;

    const executePost = async function () {
      if (loadingCtrl && lockId && loadingCtrl.activateBlockingSync) {
        loadingCtrl.activateBlockingSync(lockId);
      }
      const act = payload && payload.action ? String(payload.action) : '';
      let activeMode = mode;

      if (activeMode === 'd1') {
        const prepared = await prepareD1MediaPayload(stateObj, payload);
        if (prepared.errorResponse) {
          return prepared.errorResponse;
        }
        const cleanedPayload = prepared.payload;
        const wirePayload =
          act === 'login' || act === 'setupDatabase' || act === 'importFromBootstrapData'
            ? cleanedPayload
            : Object.assign({}, cleanedPayload, {
                deltaOnly: true,
                clientVersion:
                  stateObj && stateObj.syncBackend === 'd1' && stateObj.syncVersion
                    ? String(stateObj.syncVersion)
                    : ''
              });

        const d1Res = await postD1Json(wirePayload, hasHeavyBody ? 45000 : 20000);
        let json = d1Res.json;
        if (act === 'login' && json && json.needsMigration) {
          await ensureD1Migrated(stateObj);
          const retryRes = await postD1Json(wirePayload, 20000);
          json = retryRes.json;
        }
        if (json && json.ok) {
          if (stateObj) stateObj.syncBackend = 'd1';
          if (Array.isArray(json.deletedMediaUrls) && json.deletedMediaUrls.length > 0) {
            cleanupDriveMediaViaGas(json.deletedMediaUrls);
          }
          if (json.data) {
            if (json.version && stateObj) {
              stateObj.syncVersion = String(json.version);
            }
            mergeRemoteData(stateObj, json.data);
          } else if (act !== 'login') {
            applyDeltaResponseToState(stateObj, cleanedPayload, json);
          }
        }
        return json;
      }

      const wirePayload =
        act === 'login' || act === 'setupDatabase'
          ? payload
          : Object.assign({}, payload, {
              deltaOnly: true,
              clientVersion: stateObj && stateObj.syncVersion ? String(stateObj.syncVersion) : ''
            });
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(wirePayload)
        },
        hasHeavyBody ? 90000 : 25000
      );
      const json = await response.json();
      if (json && json.ok) {
        if (json.data) {
          if (json.version && stateObj) {
            stateObj.syncVersion = String(json.version);
          }
          mergeRemoteData(stateObj, json.data);
        } else if (act !== 'login') {
          applyDeltaResponseToState(stateObj, payload, json);
        }
      }
      return json;
    };

    const queuedTask = writeSyncQueue.then(executePost, executePost);
    writeSyncQueue = queuedTask.then(function () {}, function () {});

    try {
      return await queuedTask;
    } catch (e) {
      return null;
    } finally {
      if (loadingCtrl) {
        if (lockId && loadingCtrl.endBlockingSync) loadingCtrl.endBlockingSync(lockId);
        if (reqId) loadingCtrl.endRequest(reqId);
      }
    }
  }

  async function fetchBootstrapFromGas(stateObj) {
    const canProbeD1 = canProbeD1Endpoint() && backendMode !== 'gas';
    const gasUrl = getGasUrl();
    if (!canProbeD1 && !gasUrl) return null;
    if (inflightBootstrapPromise) {
      return await inflightBootstrapPromise;
    }
    const loadingCtrl = typeof window !== 'undefined' ? window.StudySnapLoading : null;
    const reqId = loadingCtrl ? loadingCtrl.beginRequest('bootstrap') : null;
    const lockId = loadingCtrl && loadingCtrl.beginBlockingSync ? loadingCtrl.beginBlockingSync('bootstrap') : null;

    inflightBootstrapPromise = (async function () {
      try {
        if (canProbeD1) {
          try {
            const hasD1State = Boolean(
              stateObj && stateObj.syncBackend === 'd1' && stateObj.syncVersion && stateObj.lastRemoteBootstrapAt
            );
            const d1BootUrl =
              D1_API_ENDPOINT +
              '?action=bootstrap' +
              (hasD1State ? '&v=' + encodeURIComponent(String(stateObj.syncVersion)) : '');
            const d1Res = await fetchWithTimeout(d1BootUrl, {}, 12000);
            const d1Json = await d1Res.json();

            if (d1Res.ok && d1Json && d1Json.backend === 'cloudflare-d1' && !d1Json.d1Missing) {
              backendMode = 'd1';
              if (d1Json.needsMigration) {
                return await ensureD1Migrated(stateObj);
              }
              if (d1Json.unchanged) {
                if (d1Json.version && stateObj) {
                  stateObj.syncVersion = String(d1Json.version);
                  stateObj.syncBackend = 'd1';
                  saveState(stateObj);
                }
                return d1Json;
              }
              if (d1Json.ok && d1Json.data) {
                if (d1Json.version && stateObj) {
                  stateObj.syncVersion = String(d1Json.version);
                  stateObj.syncBackend = 'd1';
                }
                mergeRemoteData(stateObj, d1Json.data);
                return d1Json;
              }
            }
            if (d1Json && d1Json.d1Missing) {
              backendMode = 'gas';
            }
          } catch (d1Err) {
            backendMode = 'gas';
          }
        }

        if (!gasUrl) return null;
        const hasBootstrappedState = Boolean(
          stateObj && stateObj.syncVersion && stateObj.lastRemoteBootstrapAt && stateObj.syncBackend !== 'd1'
        );
        const bootUrl =
          gasUrl +
          '?action=bootstrap' +
          (hasBootstrappedState ? '&v=' + encodeURIComponent(String(stateObj.syncVersion)) : '');
        const response = await fetchWithTimeout(bootUrl, {}, 25000);
        const json = await response.json();
        if (json && json.ok && json.unchanged) {
          if (json.version && stateObj) {
            stateObj.syncVersion = String(json.version);
          }
          return json;
        }
        if (json && json.ok && json.data) {
          if (json.version && stateObj) {
            stateObj.syncVersion = String(json.version);
          }
          if (
            json.data.isProduction !== true &&
            !stateObj.isClearedForProduction &&
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
      } finally {
        inflightBootstrapPromise = null;
        if (loadingCtrl) {
          if (lockId && loadingCtrl.endBlockingSync) loadingCtrl.endBlockingSync(lockId);
          if (reqId) loadingCtrl.endRequest(reqId);
        }
      }
    })();

    return await inflightBootstrapPromise;
  }

  async function submitPracticeExercise(stateObj, sub) {
    if (!stateObj.practiceSubmissions) stateObj.practiceSubmissions = [];
    const idx = stateObj.practiceSubmissions.findIndex(function (s) {
      return s.exercise_id === sub.exercise_id && s.student_id === sub.student_id;
    });
    if (idx >= 0) {
      stateObj.practiceSubmissions[idx] = sub;
    } else {
      stateObj.practiceSubmissions.push(sub);
    }
    saveState(stateObj);
    return await syncPostToGas(stateObj, {
      action: 'submitPracticeExercise',
      exercise_id: sub.exercise_id,
      student_id: sub.student_id,
      student_name: sub.student_name,
      total_score: sub.total_score,
      max_score: sub.max_score,
      rating: sub.rating,
      section_scores: sub.section_scores,
      answers: sub.answers,
      manual_grades: sub.manual_grades,
      status: sub.status
    });
  }

  function formatPracticeAssignmentTitle(rawTitle) {
    const clean = String(rawTitle || '').trim() || 'Bài tập mới';
    if (/^Luyện tập cuối (buổi|bài):/i.test(clean)) {
      return 'Luyện tập cuối buổi:' + clean.replace(/^Luyện tập cuối (?:buổi|bài):/i, '');
    }
    return (
      'Luyện tập cuối buổi: ' +
      clean.replace(/^(?:Bài tập luyện tập cuối bài|Bài luyện tập cuối buổi)\s*—\s*/i, '')
    );
  }

  function syncLinkedPracticeAssignments(stateObj, exercise) {
    if (!stateObj || !Array.isArray(stateObj.assignments) || !exercise || !exercise.exercise_id) return;
    const formattedTitle = formatPracticeAssignmentTitle(exercise.title);
    const nextTag = String(exercise.lesson_tag || '').trim() || 'Bài 1';
    stateObj.assignments.forEach(function (a) {
      if (a && a.require_media === 'practice' && a.exercise_id === exercise.exercise_id) {
        a.title = formattedTitle;
        a.lesson_tag = nextTag;
      }
    });
  }

  async function savePracticeExercise(stateObj, exercise) {
    if (!stateObj.practiceExercises) stateObj.practiceExercises = [];
    const idx = stateObj.practiceExercises.findIndex(function (e) {
      return e.exercise_id === exercise.exercise_id;
    });
    if (idx >= 0) {
      stateObj.practiceExercises[idx] = exercise;
    } else {
      stateObj.practiceExercises.push(exercise);
    }
    syncLinkedPracticeAssignments(stateObj, exercise);
    saveState(stateObj);
    return await syncPostToGas(stateObj, {
      action: 'savePracticeExercise',
      exercise: exercise
    });
  }

  async function deletePracticeExercise(stateObj, exerciseId) {
    if (!stateObj.practiceExercises) return;
    stateObj.practiceExercises = stateObj.practiceExercises.filter(function (e) {
      return e.exercise_id !== exerciseId;
    });
    saveState(stateObj);
    return await syncPostToGas(stateObj, {
      action: 'deletePracticeExercise',
      exercise_id: exerciseId
    });
  }

  async function gradeManualTranslation(stateObj, submissionId, manualGrades, totalScore, rating) {
    if (!stateObj.practiceSubmissions) return;
    const sub = stateObj.practiceSubmissions.find(function (s) {
      return s.submission_id === submissionId;
    });
    if (sub) {
      sub.manual_grades = manualGrades;
      sub.total_score = totalScore;
      sub.rating = rating;
      sub.status = 'graded';
      saveState(stateObj);
    }
    return await syncPostToGas(stateObj, {
      action: 'gradeManualTranslation',
      submission_id: submissionId,
      manual_grades: manualGrades,
      total_score: totalScore,
      rating: rating
    });
  }

  async function deleteAssignment(stateObj, assignmentId) {
    if (!stateObj.assignments) return;
    stateObj.assignments = stateObj.assignments.filter(function (a) {
      return a.assignment_id !== assignmentId;
    });
    if (stateObj.submissions) {
      stateObj.submissions = stateObj.submissions.filter(function (s) {
        return s.assignment_id !== assignmentId;
      });
    }
    saveState(stateObj);
    return await syncPostToGas(stateObj, {
      action: 'deleteAssignment',
      assignment_id: assignmentId
    });
  }

  async function deleteStudentAccount(stateObj, studentId) {
    const targetId = String(studentId || '').trim();
    if (!stateObj || !targetId) {
      return { ok: false, offline: !getGasUrl(), remote: null };
    }

    const prevStudents = Array.isArray(stateObj.students) ? stateObj.students.slice() : [];
    const prevSubmissions = Array.isArray(stateObj.submissions) ? stateObj.submissions.slice() : [];
    const prevExitLogs = Array.isArray(stateObj.exitTicketLogs) ? stateObj.exitTicketLogs.slice() : [];
    const prevPracticeSubs = Array.isArray(stateObj.practiceSubmissions) ? stateObj.practiceSubmissions.slice() : [];

    stateObj.students = prevStudents.filter(function (s) {
      return String(s.student_id || '').trim() !== targetId;
    });
    stateObj.submissions = prevSubmissions.filter(function (s) {
      return String(s.student_id || '').trim() !== targetId;
    });
    stateObj.exitTicketLogs = prevExitLogs.filter(function (l) {
      return String(l.student_id || '').trim() !== targetId;
    });
    stateObj.practiceSubmissions = prevPracticeSubs.filter(function (ps) {
      return String(ps.student_id || '').trim() !== targetId;
    });
    saveState(stateObj);

    const hasGas = Boolean(getGasUrl());
    const res = await syncPostToGas(stateObj, {
      action: 'deleteStudentAccount',
      student_id: targetId
    });

    if (hasGas && (!res || res.ok === false)) {
      stateObj.students = prevStudents;
      stateObj.submissions = prevSubmissions;
      stateObj.exitTicketLogs = prevExitLogs;
      stateObj.practiceSubmissions = prevPracticeSubs;
      saveState(stateObj);
      return { ok: false, offline: false, remote: res };
    }

    try {
      const masteryKey = 'studysnap_mastered_vocab_' + targetId;
      const draftPrefix = 'studysnap_practice_draft_' + targetId + '_';
      Object.keys(localStorage).forEach(function (key) {
        if (key === masteryKey || key.indexOf(draftPrefix) === 0) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // ignore localStorage access errors
    }

    return { ok: true, offline: !hasGas, remote: res };
  }

  async function updateAssignmentsTargetClass(stateObj, assignmentIds, targetClass, actionName) {
    const ids = Array.isArray(assignmentIds)
      ? assignmentIds.map(function (id) { return String(id || '').trim(); }).filter(Boolean)
      : (assignmentIds ? [String(assignmentIds).trim()] : []);
    if (!stateObj || !Array.isArray(stateObj.assignments) || ids.length === 0) {
      return { ok: false, offline: !getGasUrl(), remote: null };
    }

    const prevClasses = new Map();
    stateObj.assignments.forEach(function (a) {
      if (ids.indexOf(String(a.assignment_id || '').trim()) !== -1) {
        prevClasses.set(a.assignment_id, a.class_name);
        a.class_name = targetClass;
      }
    });
    saveState(stateObj);

    const hasGas = Boolean(getGasUrl());
    const payload = {
      action: actionName || 'assignExercisesToClass',
      assignment_ids: ids
    };
    if (actionName === 'unassignAssignment') {
      payload.assignment_id = ids[0];
    } else {
      payload.target_class = targetClass;
    }

    const res = await syncPostToGas(stateObj, payload);
    if (hasGas && (!res || res.ok === false)) {
      stateObj.assignments.forEach(function (a) {
        if (prevClasses.has(a.assignment_id)) {
          a.class_name = prevClasses.get(a.assignment_id);
        }
      });
      saveState(stateObj);
      return { ok: false, offline: false, remote: res };
    }
    return { ok: true, offline: !hasGas, remote: res };
  }

  async function assignExercisesToClass(stateObj, assignmentIds, targetClass) {
    return await updateAssignmentsTargetClass(stateObj, assignmentIds, targetClass || 'all', 'assignExercisesToClass');
  }

  async function unassignExercises(stateObj, assignmentIds) {
    return await updateAssignmentsTargetClass(stateObj, assignmentIds, 'unassigned', 'unassignAssignment');
  }

  async function batchAddVocabulary(stateObj, vocabList) {
    if (!stateObj.vocabulary) stateObj.vocabulary = [];
    if (Array.isArray(vocabList) && vocabList.length > 0) {
      vocabList.forEach(function (v) {
        if (!v) return;
        const vid = String(v.vocab_id || '').trim();
        const idx = vid ? stateObj.vocabulary.findIndex(function (cur) { return String(cur.vocab_id || '').trim() === vid; }) : -1;
        if (idx >= 0) {
          stateObj.vocabulary[idx] = v;
        } else {
          stateObj.vocabulary.push(v);
        }
      });
      saveState(stateObj);
      return await syncPostToGas(stateObj, {
        action: 'batchAddVocabulary',
        vocabulary: vocabList
      });
    }
  }

  async function deleteVocabulary(stateObj, target) {
    if (!stateObj) return { ok: false, skipped: true };
    const vocabId = typeof target === 'string'
      ? String(target).trim()
      : String((target && target.vocab_id) || '').trim();
    const lessonId = typeof target === 'object' && target
      ? String(target.lesson_id || '').trim()
      : '';
    if (!vocabId && !lessonId) {
      return { ok: false, error: 'Thiếu mã từ vựng hoặc mã bài học.' };
    }
    if (!Array.isArray(stateObj.vocabulary)) stateObj.vocabulary = [];
    stateObj.vocabulary = stateObj.vocabulary.filter(function (v) {
      if (vocabId) return String(v.vocab_id || '').trim() !== vocabId;
      return String(v.lesson_id || '').trim() !== lessonId;
    });
    saveState(stateObj);
    return await syncPostToGas(stateObj, {
      action: 'deleteVocabulary',
      vocab_id: vocabId,
      lesson_id: lessonId
    });
  }

  async function submitVocabCompletion(stateObj, payload) {
    if (!stateObj || !payload || !payload.assignment_id || !payload.student_id) {
      return { ok: false, error: 'Thiếu thông tin bài ôn từ hoặc học sinh.' };
    }
    if (!Array.isArray(stateObj.submissions)) stateObj.submissions = [];
    const targetAsgId = String(payload.assignment_id).trim();
    const targetStuId = String(payload.student_id).trim();
    const nowStr = new Date().toLocaleString('vi-VN');
    const nextScore = payload.score !== undefined && payload.score !== null ? String(payload.score) : '';
    const nextNote = String(payload.student_note || 'Đã hoàn thành ôn tập từ vựng');
    const nextDur = String(payload.media_duration || '');
    const nextStatus = String(payload.status || 'graded');

    const existing = stateObj.submissions.find(function (s) {
      return String(s.assignment_id || '').trim() === targetAsgId && String(s.student_id || '').trim() === targetStuId;
    });
    if (existing) {
      existing.submitted_at = nowStr;
      existing.student_note = nextNote;
      existing.media_type = 'vocab';
      existing.media_url = '';
      existing.media_duration = nextDur;
      existing.status = nextStatus;
      existing.score = nextScore;
    } else {
      stateObj.submissions.push({
        submission_id: 'SUB_' + Date.now(),
        assignment_id: targetAsgId,
        student_id: targetStuId,
        submitted_at: nowStr,
        student_note: nextNote,
        media_type: 'vocab',
        media_url: '',
        media_duration: nextDur,
        status: nextStatus,
        score: nextScore,
        teacher_comment: '',
        teacher_voice_url: '',
        teacher_voice_duration: ''
      });
    }
    saveState(stateObj);
    return await syncPostToGas(stateObj, {
      action: 'submitHomework',
      assignment_id: targetAsgId,
      student_id: targetStuId,
      student_note: nextNote,
      media_type: 'vocab',
      media_url: '',
      media_duration: nextDur,
      status: nextStatus,
      score: nextScore
    });
  }

  function slugifyLessonId(rawText) {
    const clean = String(rawText || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return clean || 'bai-1';
  }

  function stripPracticeTitlePrefix(rawTitle) {
    return String(rawTitle || '')
      .replace(/^(?:Bài\s*tập\s*)?(?:luyện\s*tập\s*cuối\s*buổi|cuối\s*buổi)\s*(?:—|–|-|:)?\s*/i, '')
      .trim();
  }

  function extractShortLessonTag(lessonId, title, fallbackTag) {
    const fb = String(fallbackTag || '').trim();
    if (fb) return fb;
    const raw = String(title || lessonId || '').trim();
    const match = raw.match(/^(Bài\s*\d+)/i);
    if (match) return match[1];
    return raw.length > 20 ? raw.slice(0, 19) + '…' : (raw || 'Bài học');
  }

  function buildSyncedLessonDisplayTitle(tag, topics) {
    const cleanTag = String(tag || '').trim();
    const uniqTopics = [];
    (topics || []).forEach(function (t) {
      const clean = String(t || '').trim();
      if (clean && uniqTopics.indexOf(clean) === -1) uniqTopics.push(clean);
    });
    if (uniqTopics.length === 0) return cleanTag || 'Bài học';
    const first = uniqTopics[0];
    let baseTitle = first;
    if (cleanTag) {
      if (first.toLowerCase() === cleanTag.toLowerCase()) {
        baseTitle = cleanTag;
      } else if (first.toLowerCase().indexOf(cleanTag.toLowerCase()) !== 0) {
        baseTitle = cleanTag + ' — ' + first;
      }
    }
    if (uniqTopics.length > 1) {
      baseTitle += ' (+' + (uniqTopics.length - 1) + ' bài)';
    }
    return baseTitle;
  }

  function getSyncedLessons(stateObj) {
    const map = {};
    const st = stateObj || {};
    const practices = Array.isArray(st.practiceExercises) ? st.practiceExercises : [];
    const vocabList = Array.isArray(st.vocabulary) ? st.vocabulary : [];
    const assignments = Array.isArray(st.assignments) ? st.assignments : [];
    const customLessons = Array.isArray(st.lessons) ? st.lessons : [];

    // 1. Nguồn chính: đồng bộ theo Bài & Thuộc bài của Luyện tập cuối buổi
    practices.forEach(function (ex) {
      if (!ex) return;
      const rawTag = String(ex.lesson_tag || '').trim();
      const rawTitle = String(ex.title || '').trim();
      const cleanTopic = stripPracticeTitlePrefix(rawTitle);
      const keyBase = rawTag || cleanTopic || ex.exercise_id;
      if (!keyBase) return;
      const lid = slugifyLessonId(keyBase);
      if (!lid || lid === 'all' || lid === 'all-lessons' || lid === 'hsk-272') return;

      if (!map[lid]) {
        map[lid] = {
          lesson_id: lid,
          tag: rawTag || extractShortLessonTag(lid, cleanTopic),
          topics: cleanTopic ? [cleanTopic] : [],
          title: '',
          exercise_ids: ex.exercise_id ? [ex.exercise_id] : [],
          source: 'practice',
          isCustom: false
        };
      } else {
        if (cleanTopic && map[lid].topics.indexOf(cleanTopic) === -1) {
          map[lid].topics.push(cleanTopic);
        }
        if (ex.exercise_id && map[lid].exercise_ids.indexOf(ex.exercise_id) === -1) {
          map[lid].exercise_ids.push(ex.exercise_id);
        }
      }
      map[lid].title = buildSyncedLessonDisplayTitle(map[lid].tag, map[lid].topics);
    });

    // 2. Bài ôn từ đang giao (giữ liên kết hiển thị)
    assignments.forEach(function (asg) {
      if (!asg || String(asg.require_media || '').trim().toLowerCase() !== 'vocab') return;
      const cls = String(asg.class_name || '').trim().toLowerCase();
      if (!cls || cls === 'unassigned') return;
      const lid = String(asg.lesson_id || '').trim();
      if (!lid || lid === 'all' || lid === 'all-lessons' || lid === 'hsk-272') return;
      if (!map[lid]) {
        const fallbackTitle = String(asg.lesson_tag || lid).trim();
        map[lid] = {
          lesson_id: lid,
          tag: String(asg.lesson_tag || extractShortLessonTag(lid, fallbackTitle)).trim(),
          topics: [],
          title: fallbackTitle,
          exercise_ids: [],
          source: 'assignment',
          isCustom: false
        };
      }
    });

    // 3. Bài đã có từ vựng trong kho (giữ nguyên để không mất từ đã nhập)
    vocabList.forEach(function (v) {
      if (!v || !v.lesson_id) return;
      const lid = String(v.lesson_id).trim();
      if (!lid || lid === 'all' || lid === 'all-lessons' || lid === 'hsk-272') return;
      const vTitle = String(v.lesson_title || lid).trim();
      if (!map[lid]) {
        map[lid] = {
          lesson_id: lid,
          tag: extractShortLessonTag(lid, vTitle),
          topics: [],
          title: vTitle,
          exercise_ids: [],
          source: 'vocab',
          isCustom: false
        };
      } else if (!map[lid].title && vTitle) {
        map[lid].title = vTitle;
      }
    });

    // 4. Các bài riêng giáo viên chủ động tạo thêm bằng "+ Tạo bài học mới..."
    customLessons.forEach(function (cl) {
      if (!cl || cl.isCustom !== true || !cl.lesson_id) return;
      const lid = String(cl.lesson_id).trim();
      if (!lid || lid === 'all' || lid === 'all-lessons' || lid === 'hsk-272') return;
      if (!map[lid]) {
        const cTitle = String(cl.title || cl.lesson_title || lid).trim();
        map[lid] = {
          lesson_id: lid,
          tag: String(cl.tag || extractShortLessonTag(lid, cTitle)).trim(),
          topics: [],
          title: cTitle,
          exercise_ids: [],
          source: 'custom',
          isCustom: true
        };
      }
    });

    return Object.keys(map).map(function (k) {
      return map[k];
    }).sort(function (a, b) {
      const ma = String(a.tag || a.title || a.lesson_id).match(/\d+/);
      const mb = String(b.tag || b.title || b.lesson_id).match(/\d+/);
      const wa = ma ? parseInt(ma[0], 10) : 9999;
      const wb = mb ? parseInt(mb[0], 10) : 9999;
      if (wa !== wb) return wa - wb;
      return String(a.title || a.tag || '').localeCompare(String(b.title || b.tag || ''), 'vi');
    });
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
    isUsingD1: function () { return backendMode === 'd1'; },
    getBackendMode: function () { return backendMode; },
    syncPostToGas: syncPostToGas,
    fetchBootstrapFromGas: fetchBootstrapFromGas,
    normalizeChineseSentence: normalizeChineseSentence,
    isAnswerMatch: isAnswerMatch,
    isKeywordsMatch: isKeywordsMatch,
    calculateRating: calculateRating,
    submitPracticeExercise: submitPracticeExercise,
    savePracticeExercise: savePracticeExercise,
    deletePracticeExercise: deletePracticeExercise,
    deleteAssignment: deleteAssignment,
    deleteStudentAccount: deleteStudentAccount,
    assignExercisesToClass: assignExercisesToClass,
    unassignExercises: unassignExercises,
    batchAddVocabulary: batchAddVocabulary,
    deleteVocabulary: deleteVocabulary,
    submitVocabCompletion: submitVocabCompletion,
    gradeManualTranslation: gradeManualTranslation,
    slugifyLessonId: slugifyLessonId,
    stripPracticeTitlePrefix: stripPracticeTitlePrefix,
    extractShortLessonTag: extractShortLessonTag,
    getSyncedLessons: getSyncedLessons,
    getInitials: getInitials,
    loading: typeof window !== 'undefined' ? window.StudySnapLoading : null
  };
})();
