-- 创建教师表
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建考试表
CREATE TABLE IF NOT EXISTS `exams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `teacher_id` INT NOT NULL,
  `total_score` INT DEFAULT 0 COMMENT '试卷总分',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建题目答案表
CREATE TABLE IF NOT EXISTS `question_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` INT NOT NULL,
  `section_index` INT NOT NULL COMMENT '题目栏序号',
  `section_type` VARCHAR(20) NOT NULL COMMENT '题目类型：choice, fill, judgment',
  `question_number` INT NOT NULL COMMENT '题目序号',
  `chinese_number` VARCHAR(10) DEFAULT NULL COMMENT '中文题号，如：一、二、三',
  `content` TEXT DEFAULT NULL COMMENT '题目内容',
  `answer` VARCHAR(255) NOT NULL COMMENT '答案内容',
  `score` INT NOT NULL COMMENT '分值',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建学生错题表
CREATE TABLE IF NOT EXISTS `student_wrong_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` VARCHAR(255) NOT NULL COMMENT '学生姓名',
  `question_id` INT NOT NULL,
  `exam_id` INT NOT NULL,
  `student_answer` VARCHAR(255) COMMENT '学生填写的答案',
  `is_corrected` BOOLEAN DEFAULT FALSE COMMENT '是否正确',
  FOREIGN KEY (question_id) REFERENCES question_answers(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建学生成绩表
CREATE TABLE IF NOT EXISTS `student_grade` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_name` VARCHAR(255) NOT NULL COMMENT '学生姓名',
  `exam_id` INT NOT NULL,
  `score` DECIMAL(5,2) NOT NULL COMMENT '学生成绩',
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加索引
CREATE INDEX idx_question_answers_exam_id ON question_answers(exam_id);
CREATE INDEX idx_question_answers_section_index ON question_answers(section_index);
CREATE INDEX idx_question_answers_chinese_number ON question_answers(chinese_number);

ALTER TABLE `student_wrong_answers` 
ADD COLUMN `score` DECIMAL(5,2) DEFAULT 0 COMMENT '学生得分';