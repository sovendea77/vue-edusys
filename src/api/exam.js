/**
 * 考试相关API
 */

import axios from 'axios';

// API基础URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3000/api';

export const examApi = {
  // 创建考试
  createExam: (examData) => {
    return axios.post(`${API_BASE_URL}/exams`, examData);
  },
  
  // 获取考试详情
  getExamById: (id) => {
    return axios.get(`${API_BASE_URL}/exams/${id}`);
  },
  
  // 获取教师的所有考试
  getExamsByTeacherId: (teacherId) => {
    return axios.get(`${API_BASE_URL}/exams/teacher/${teacherId}`);
  },
  
  // 保存题目答案
  saveAnswers: (examId, sections) => {
    return axios.post(`${API_BASE_URL}/exams/${examId}/answers`, { examId, sections });
  },
  
  // 获取考试答案
  getAnswers: (examId) => {
    return axios.get(`${API_BASE_URL}/exams/${examId}/answers`);
  },
  
  // 删除考试
  deleteExam: (examId) => {
    return axios.delete(`${API_BASE_URL}/exams/${examId}`);
  }
};