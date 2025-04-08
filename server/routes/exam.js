/**
 * 考试路由
 */

const express = require('express');
const router = express.Router();
const { examController } = require('../controllers');

// 创建考试
router.post('/', examController.createExam);

// 获取考试详情
router.get('/:id', examController.getExamById);

// 获取教师的所有考试
router.get('/teacher/:teacherId', examController.getExamsByTeacherId);

// 保存题目答案
router.post('/:examId/answers', examController.saveAnswers);

// 获取考试答案
router.get('/:examId/answers', examController.getAnswers);

// 删除考试
router.delete('/:id', examController.deleteExam);

module.exports = router;