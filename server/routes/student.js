/**
 * 学生相关路由
 */

const express = require('express');
const router = express.Router();
const { studentController } = require('../controllers');

// 保存学生错题答案
router.post('/wrong-answers', studentController.saveStudentWrongAnswers);

// 获取考试统计信息
router.get('/exam-statistics/:examId', studentController.getExamStatistics);

// 保存学生成绩
router.post('/save-grades', studentController.saveStudentGrades);

// 获取学生列表
router.get('/list/:examId', studentController.getStudentList);

// 获取学生错题详情
router.get('/wrong-answers/:examId/:studentId', studentController.getStudentWrongAnswers);

// 获取错题分析数据
router.get('/wrong-answers-analysis/:examId', studentController.getWrongAnswersAnalysis);

// 更新解答题评分
router.post('/essay-score', studentController.updateEssayQuestionScore);

// 更新填空题正确性
router.post('/fill-correctness', studentController.updateFillQuestionCorrectness);


module.exports = router;