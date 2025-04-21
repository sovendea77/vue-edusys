/**
 * 学生相关API
 */

import axios from 'axios';

// API基础URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3000/api';

export const studentApi = {
  // 保存学生错题答案
  saveStudentWrongAnswers: (examId, studentId, answers) => {
    return axios.post(`${API_BASE_URL}/students/wrong-answers`, {
      examId,
      studentId,
      answers
    });
  },
  
  // 获取考试成绩统计信息
  getExamStatistics: (examId) => {
    return axios.get(`${API_BASE_URL}/students/exam-statistics/${examId}`);
  },
  
  // 保存学生成绩
  saveStudentGrades: (examId) => {
    return axios.post(`${API_BASE_URL}/students/save-grades`, { examId });
  },
  
  // 获取学生列表
  getStudentList: (examId) => {
    return axios.get(`${API_BASE_URL}/students/list/${examId}`);
  },
  
  // 获取学生错题详情
  getStudentWrongAnswers: (examId, studentId) => {
    return axios.get(`${API_BASE_URL}/students/wrong-answers/${examId}/${studentId}`);
  },
  
  // 获取错题分析数据（按错误次数排序）
  getWrongAnswersAnalysis: (examId, minErrorCount = 1) => {
    return axios.get(`${API_BASE_URL}/students/wrong-answers-analysis/${examId}?minErrorCount=${minErrorCount}`);
  },
  
  // 更新学生解答题分数
  updateEssayQuestionScore: (examId, studentId, questionId, score) => {
    const validQuestionId = questionId || 'default';
    
    console.log('更新解答题分数 - 参数:', { examId, studentId, questionId: validQuestionId, score });
    
    return axios.post(`${API_BASE_URL}/students/essay-score`, {
      examId,
      studentId,
      questionId: validQuestionId,
      score
    });
  },
  
  // 更新填空题
  updateFillQuestionCorrectness: (examId, studentId, questionId, isCorrect) => {
    const validQuestionId = questionId || 'default';
    
    console.log('更新填空题:', { examId, studentId, questionId: validQuestionId, isCorrect });
    
    return axios.post(`${API_BASE_URL}/students/fill-correctness`, {
      examId,
      studentId,
      questionId: validQuestionId,
      isCorrect
    });
  },
  
  // 保存学生答案和批改结果
  saveStudentAnswersWithGrades: (saveData) => {
    console.log('保存学生答案和批改结果:', saveData);
    return axios.post(`${API_BASE_URL}/students/save-answers-with-grades`, saveData);
  },
  
  // 批量保存学生错题答案
  batchSaveStudentWrongAnswers: async (examId, studentId, studentName, answers) => {
    console.log('批量保存学生错题答案:', { examId, studentId, studentName, answersCount: answers.length });

    const { aiApi } = require('./ai');
    
    // 处理每个答案
    const processedAnswers = [];
    
    for (const answer of answers) {
      // 复制原始答案
      const processedAnswer = { ...answer };
      
      // 根据题型进行不同处理
      if (answer.questionType === 'essay') {
        // 解答题使用AI批改
        try {
          const gradeData = {
            studentAnswer: answer.studentAnswer,
            standardAnswer: answer.standardAnswer,
            totalScore: answer.score || 0
          };
          
          const score = await aiApi.gradeEssayQuestionWithDeepseek(gradeData);
          
          // 更新分数
          processedAnswer.score = score;
          processedAnswer.isCorrect = score >= (answer.score || 0);
        } catch (error) {
          console.error('AI批改解答题失败:', error);
          // 如果AI批改失败，默认为0分
          processedAnswer.score = 0;
          processedAnswer.isCorrect = false;
        }
      }
      
      processedAnswers.push(processedAnswer);
    }
    
    // 保存处理后的答案
    return axios.post(`${API_BASE_URL}/students/wrong-answers`, {
      examId,
      studentId,
      studentName,
      answers: processedAnswers
    });
  }
};