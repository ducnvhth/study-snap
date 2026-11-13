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
    },
    {
      vocab_id: 'V13',
      lesson_id: 'bai-4',
      lesson_title: 'Bài 4: Đồ ăn & Nhà hàng',
      word: '米饭',
      ipa: 'mǐ fàn',
      part_of_speech: 'Danh từ',
      meaning_vi: 'Cơm trắng',
      example_en: '我想吃一碗米饭。(Wǒ xiǎng chī yì wǎn mǐfàn.)',
      example_vi: 'Tôi muốn ăn một bát cơm trắng.'
    },
    {
      vocab_id: 'V14',
      lesson_id: 'bai-4',
      lesson_title: 'Bài 4: Đồ ăn & Nhà hàng',
      word: '好吃',
      ipa: 'hǎo chī',
      part_of_speech: 'Tính từ',
      meaning_vi: 'Ngon, thơm ngon',
      example_en: '中国菜非常好吃。(Zhōngguó cài fēicháng hǎochī.)',
      example_vi: 'Món ăn Trung Quốc vô cùng ngon.'
    },
    {
      vocab_id: 'V15',
      lesson_id: 'bai-4',
      lesson_title: 'Bài 4: Đồ ăn & Nhà hàng',
      word: '服务员',
      ipa: 'fú wù yuán',
      part_of_speech: 'Danh từ',
      meaning_vi: 'Nhân viên phục vụ',
      example_en: '服务员，请给我们菜单。(Fúwùyuán, qǐng gěi wǒmen càidān.)',
      example_vi: 'Phục vụ ơi, vui lòng cho chúng tôi thực đơn.'
    },
    {
      vocab_id: 'V16',
      lesson_id: 'bai-4',
      lesson_title: 'Bài 4: Đồ ăn & Nhà hàng',
      word: '买单',
      ipa: 'mǎi dān',
      part_of_speech: 'Động từ',
      meaning_vi: 'Thanh toán, tính tiền',
      example_en: '你好，我们买单。(Nǐ hǎo, wǒmen mǎidān.)',
      example_vi: 'Xin chào, chúng tôi thanh toán.'
    },
    {
      vocab_id: 'V17',
      lesson_id: 'bai-5',
      lesson_title: 'Bài 5: Thời gian & Lịch trình',
      word: '现在',
      ipa: 'xiàn zài',
      part_of_speech: 'Danh từ thời gian',
      meaning_vi: 'Bây giờ, hiện tại',
      example_en: '现在是上午九点整。(Xiànzài shì shàngwǔ jiǔ diǎn zhěng.)',
      example_vi: 'Bây giờ là đúng 9 giờ sáng.'
    },
    {
      vocab_id: 'V18',
      lesson_id: 'bai-5',
      lesson_title: 'Bài 5: Thời gian & Lịch trình',
      word: '明天',
      ipa: 'míng tiān',
      part_of_speech: 'Danh từ thời gian',
      meaning_vi: 'Ngày mai',
      example_en: '明天早上我们一起去图书馆。(Míngtiān zǎoshang wǒmen yìqǐ qù túshūguǎn.)',
      example_vi: 'Sáng mai chúng ta cùng đi thư viện nhé.'
    },
    {
      vocab_id: 'V19',
      lesson_id: 'bai-5',
      lesson_title: 'Bài 5: Thời gian & Lịch trình',
      word: '开始',
      ipa: 'kāi shǐ',
      part_of_speech: 'Động từ',
      meaning_vi: 'Bắt đầu',
      example_en: '汉语课八点开始。(Hànyǔ kè bā diǎn kāishǐ.)',
      example_vi: 'Tiết học tiếng Trung bắt đầu lúc 8 giờ.'
    },
    {
      vocab_id: 'V20',
      lesson_id: 'bai-5',
      lesson_title: 'Bài 5: Thời gian & Lịch trình',
      word: '睡觉',
      ipa: 'shuì jiào',
      part_of_speech: 'Động từ',
      meaning_vi: 'Đi ngủ',
      example_en: '我通常晚上十一点睡觉。(Wǒ tōngcháng wǎnshang shíyī diǎn shuìjiào.)',
      example_vi: 'Tôi thường đi ngủ lúc 11 giờ tối.'
    },
    {
      vocab_id: 'V21',
      lesson_id: 'bai-6',
      lesson_title: 'Bài 6: Gia đình & Nghề nghiệp',
      word: '爸爸',
      ipa: 'bà ba',
      part_of_speech: 'Danh từ',
      meaning_vi: 'Bố, cha',
      example_en: '我爸爸是一名医生。(Wǒ bàba shì yì míng yīshēng.)',
      example_vi: 'Bố tôi là một bác sĩ.'
    },
    {
      vocab_id: 'V22',
      lesson_id: 'bai-6',
      lesson_title: 'Bài 6: Gia đình & Nghề nghiệp',
      word: '妈妈',
      ipa: 'mā ma',
      part_of_speech: 'Danh từ',
      meaning_vi: 'Mẹ, má',
      example_en: '我妈妈做菜非常好吃。(Wǒ māma zuò cài fēicháng hǎochī.)',
      example_vi: 'Mẹ tôi nấu ăn rất ngon.'
    },
    {
      vocab_id: 'V23',
      lesson_id: 'bai-6',
      lesson_title: 'Bài 6: Gia đình & Nghề nghiệp',
      word: '工作',
      ipa: 'gōng zuò',
      part_of_speech: 'Danh từ / Động từ',
      meaning_vi: 'Công việc, làm việc',
      example_en: '你在哪儿工作？(Nǐ zài nǎr gōngzuò?)',
      example_vi: 'Bạn làm việc ở đâu?'
    },
    {
      vocab_id: 'V24',
      lesson_id: 'bai-6',
      lesson_title: 'Bài 6: Gia đình & Nghề nghiệp',
      word: '医生',
      ipa: 'yī shēng',
      part_of_speech: 'Danh từ',
      meaning_vi: 'Bác sĩ',
      example_en: '李医生在医院工作。(Lǐ yīshēng zài yīyuàn gōngzuò.)',
      example_vi: 'Bác sĩ Lý làm việc ở bệnh viện.'
    },
    {
      vocab_id: 'V25',
      lesson_id: 'bai-7',
      lesson_title: 'Bài 7: Phương hướng & Giao thông',
      word: '哪儿',
      ipa: 'nǎr',
      part_of_speech: 'Đại từ',
      meaning_vi: 'Ở đâu, chỗ nào',
      example_en: '请问，洗手间在哪儿？(Qǐngwèn, xǐshǒujiān zài nǎr?)',
      example_vi: 'Xin hỏi, nhà vệ sinh ở đâu?'
    },
    {
      vocab_id: 'V26',
      lesson_id: 'bai-7',
      lesson_title: 'Bài 7: Phương hướng & Giao thông',
      word: '左边',
      ipa: 'zuǒ biān',
      part_of_speech: 'Danh từ vị trí',
      meaning_vi: 'Bên trái',
      example_en: '超市在学校的左边。(Chāoshì zài xuéxiào de zuǒbiān.)',
      example_vi: 'Siêu thị nằm ở bên trái trường học.'
    },
    {
      vocab_id: 'V27',
      lesson_id: 'bai-7',
      lesson_title: 'Bài 7: Phương hướng & Giao thông',
      word: '右边',
      ipa: 'yòu biān',
      part_of_speech: 'Danh từ vị trí',
      meaning_vi: 'Bên phải',
      example_en: '银行在前面右边。(Yínháng zài qiánmiàn yòubiān.)',
      example_vi: 'Ngân hàng ở phía trước bên tay phải.'
    },
    {
      vocab_id: 'V28',
      lesson_id: 'bai-7',
      lesson_title: 'Bài 7: Phương hướng & Giao thông',
      word: '公共汽车',
      ipa: 'gōng gòng qì chē',
      part_of_speech: 'Danh từ',
      meaning_vi: 'Xe buýt',
      example_en: '我每天坐公共汽车去上班。(Wǒ měitiān zuò gōnggòng qìchē qù shàngbān.)',
      example_vi: 'Mỗi ngày tôi đều đi xe buýt đi làm.'
    },
    {
      vocab_id: 'V29',
      lesson_id: 'bai-8',
      lesson_title: 'Bài 8: Thời tiết & Cảm xúc',
      word: '天气',
      ipa: 'tiān qì',
      part_of_speech: 'Danh từ',
      meaning_vi: 'Thời tiết',
      example_en: '今天天气非常晴朗。(Jīntiān tiānqì fēicháng qínglǎng.)',
      example_vi: 'Hôm nay thời tiết rất đẹp trời.'
    },
    {
      vocab_id: 'V30',
      lesson_id: 'bai-8',
      lesson_title: 'Bài 8: Thời tiết & Cảm xúc',
      word: '冷',
      ipa: 'lěng',
      part_of_speech: 'Tính từ',
      meaning_vi: 'Lạnh, rét',
      example_en: '冬天这里很冷。(Dōngtiān zhèlǐ hěn lěng.)',
      example_vi: 'Mùa đông ở đây rất lạnh.'
    },
    {
      vocab_id: 'V31',
      lesson_id: 'bai-8',
      lesson_title: 'Bài 8: Thời tiết & Cảm xúc',
      word: '热',
      ipa: 'rè',
      part_of_speech: 'Tính từ',
      meaning_vi: 'Nóng, ấm bức',
      example_en: '夏天天气太热了。(Xiàtiān tiānqì tài rè le.)',
      example_vi: 'Mùa hè thời tiết nóng quá.'
    },
    {
      vocab_id: 'V32',
      lesson_id: 'bai-8',
      lesson_title: 'Bài 8: Thời tiết & Cảm xúc',
      word: '舒服',
      ipa: 'shū fu',
      part_of_speech: 'Tính từ',
      meaning_vi: 'Thoải mái, dễ chịu',
      example_en: '秋天微风吹来很舒服。(Qiūtiān wēifēng chuī lái hěn shūfu.)',
      example_vi: 'Mùa thu gió nhẹ thổi lại rất dễ chịu.'
    }
  ],

  lessons: [
    { lesson_id: 'bai-1', tag: 'Bài 1', title: 'Bài 1: Chào hỏi & Làm quen', desc: 'Luyện 4 thanh điệu, biến điệu thanh 3 và mẫu câu làm quen cơ bản' },
    { lesson_id: 'bai-2', tag: 'Bài 2', title: 'Bài 2: Học tập & Ngôn ngữ', desc: 'Phát âm thanh mẫu, vận mẫu và từ vựng học tiếng Hán' },
    { lesson_id: 'bai-3', tag: 'Bài 3', title: 'Bài 3: Mua sắm & Đời sống', desc: 'Hội thoại mua sắm, hỏi giá cả và đếm số lượng trong tiếng Trung' },
    { lesson_id: 'bai-4', tag: 'Bài 4', title: 'Bài 4: Đồ ăn & Nhà hàng', desc: 'Gọi món ăn Trung Hoa, khẩu vị và giao tiếp khi đi ăn' },
    { lesson_id: 'bai-5', tag: 'Bài 5', title: 'Bài 5: Thời gian & Lịch trình', desc: 'Hỏi giờ giấc, ngày tháng và kể lịch trình hoạt động trong ngày' },
    { lesson_id: 'bai-6', tag: 'Bài 6', title: 'Bài 6: Gia đình & Nghề nghiệp', desc: 'Giới thiệu thành viên gia đình, nghề nghiệp và tuổi tác' },
    { lesson_id: 'bai-7', tag: 'Bài 7', title: 'Bài 7: Phương hướng & Giao thông', desc: 'Hỏi đường, chỉ hướng đi và các phương tiện giao thông phổ biến' },
    { lesson_id: 'bai-8', tag: 'Bài 8', title: 'Bài 8: Thời tiết & Cảm xúc', desc: 'Miêu tả thời tiết các mùa, cảm xúc và trạng thái sức khỏe' }
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
  ],

  practiceExercises: [
    {
      exercise_id: 'EX_HSK1_BAI_1',
      title: 'Bài tập luyện tập cuối bài — HSK 1: Bài 1 (Chào hỏi & Làm quen)',
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
            context_subtitle: '听两遍对话，选择正确答案。(Nghe đoạn hội thoại 2 lần rồi chọn đáp án đúng.)',
            audio_label: '1-7',
            audio_url: 'demo:listening',
            audio_duration: '00:28',
            audio_transcript: '女：李文，你从家回北京的路上花了多长时间？ 男：坐火车花了十几个小时，有点儿累。 女：对了，昨天我见到王老师的姐姐了，她看起来很年轻！ 男：是啊，很多人也这么说。',
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
          const isProd = parsed.isClearedForProduction === true;
          if (!Array.isArray(parsed.classes) || (!isProd && parsed.classes.length === 0)) {
            parsed.classes = isProd ? [] : JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA.classes || []));
          }
          (parsed.students || []).forEach(function (st) {
            const c = (st.class_name || '').trim();
            if (c && !parsed.classes.some(function (cls) { return cls.class_name.toLowerCase() === c.toLowerCase(); })) {
              parsed.classes.push({
                class_id: 'CLS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                class_name: c,
                created_at: st.created_at || '01/11/2026'
              });
            }
          });
          if (!Array.isArray(parsed.lessons) || parsed.lessons.length < 8) {
            parsed.lessons = JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA.lessons || []));
          }
          if (!Array.isArray(parsed.vocabulary)) {
            parsed.vocabulary = isProd ? [] : JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA.vocabulary || []));
          } else if (!isProd && parsed.vocabulary.length < 20) {
            parsed.vocabulary = JSON.parse(JSON.stringify(window.STUDYSNAP_INITIAL_DATA.vocabulary || []));
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
                a.class_name = 'all';
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

    if (
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
          class_name: a.class_name || 'all',
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

  async function clearAllTestData(stateObj, options) {
    const includeTeachers = Boolean(options && (options.includeTeachers === true || options.include_teachers === true));
    if (includeTeachers) {
      stateObj.teachers = [];
    }
    stateObj.classes = [];
    stateObj.students = [];
    stateObj.assignments = [];
    stateObj.submissions = [];
    stateObj.vocabulary = [];
    stateObj.exitTicketLogs = [];
    stateObj.practiceExercises = [];
    stateObj.practiceSubmissions = [];
    stateObj.isClearedForProduction = true;
    saveState(stateObj);

    try {
      Object.keys(localStorage).forEach(function (key) {
        if (
          key.indexOf('studysnap_mastered_vocab') === 0 ||
          key.indexOf('studysnap_practice_draft_') === 0
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // ignore
    }

    return await syncPostToGas(stateObj, {
      action: includeTeachers ? 'clearAllDataCompletely' : 'clearAllData',
      include_teachers: includeTeachers
    });
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
    }
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

  async function assignExercisesToClass(stateObj, assignmentIds, targetClass) {
    if (!stateObj.assignments || !Array.isArray(assignmentIds)) return;
    stateObj.assignments.forEach(function (a) {
      if (assignmentIds.indexOf(a.assignment_id) !== -1) {
        a.class_name = targetClass;
      }
    });
    saveState(stateObj);
    return await syncPostToGas(stateObj, {
      action: 'assignExercisesToClass',
      assignment_ids: assignmentIds,
      target_class: targetClass
    });
  }

  async function batchAddVocabulary(stateObj, vocabList) {
    if (!stateObj.vocabulary) stateObj.vocabulary = [];
    if (Array.isArray(vocabList) && vocabList.length > 0) {
      vocabList.forEach(function (v) {
        stateObj.vocabulary.push(v);
      });
      saveState(stateObj);
      return await syncPostToGas(stateObj, {
        action: 'batchAddVocabulary',
        vocabulary: vocabList
      });
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
    normalizeChineseSentence: normalizeChineseSentence,
    isAnswerMatch: isAnswerMatch,
    isKeywordsMatch: isKeywordsMatch,
    calculateRating: calculateRating,
    submitPracticeExercise: submitPracticeExercise,
    savePracticeExercise: savePracticeExercise,
    deletePracticeExercise: deletePracticeExercise,
    deleteAssignment: deleteAssignment,
    assignExercisesToClass: assignExercisesToClass,
    batchAddVocabulary: batchAddVocabulary,
    gradeManualTranslation: gradeManualTranslation,
    getInitials: getInitials
  };
})();
