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
  }
};