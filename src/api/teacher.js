/**
 * 教师管理API
 */

import axios from 'axios'

// API基础URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3000/api'

export const teacherApi = {
  // 获取所有教师
  getTeachers: () => {
    return axios.get(`${API_BASE_URL}/teachers`)
  },
  
  // 获取单个教师
  getTeacher: (id) => {
    return axios.get(`${API_BASE_URL}/teachers/${id}`)
  },
  
  // 创建教师
  createTeacher: (teacherData) => {
    return axios.post(`${API_BASE_URL}/teachers`, teacherData)
  },
  
  // 更新教师
  updateTeacher: (id, teacherData) => {
    return axios.put(`${API_BASE_URL}/teachers/${id}`, teacherData)
  },
  
  // 删除教师
  deleteTeacher: (id) => {
    return axios.delete(`${API_BASE_URL}/teachers/${id}`)
  }
}