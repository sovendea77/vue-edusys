/**
 * 教师账号管理模块
 */

import { teacherApi } from '@/api/teacher'
import axios from 'axios'

// API基础URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3000/api'

const state = {
  teacherList: []
}

const mutations = {
  SET_TEACHER_LIST: (state, teachers) => {
    state.teacherList = teachers
  },
  ADD_TEACHER: (state, teacher) => {
    state.teacherList.unshift(teacher)
  },
  UPDATE_TEACHER: (state, updatedTeacher) => {
    const index = state.teacherList.findIndex(t => t.id === updatedTeacher.id)
    if (index !== -1) {
      state.teacherList.splice(index, 1, updatedTeacher)
    }
  },
  DELETE_TEACHER: (state, teacherId) => {
    state.teacherList = state.teacherList.filter(t => t.id !== teacherId)
  }
}

const actions = {
  // 获取教师列表
  async getTeacherList({ commit }) {
    try {
      const response = await teacherApi.getTeachers()
      // 确保response.data.data存在且是数组
      const teachers = response.data && response.data.data && Array.isArray(response.data.data) 
        ? response.data.data 
        : []
      commit('SET_TEACHER_LIST', teachers)
      return teachers
    } catch (error) {
      console.error('获取教师列表失败:', error)
      commit('SET_TEACHER_LIST', [])
      throw error
    }
  },
  
  // 添加教师
  async addTeacher({ commit }, teacherData) {
    try {
      const response = await teacherApi.createTeacher(teacherData)
      const newTeacher = response.data.data
      commit('ADD_TEACHER', newTeacher)
      return newTeacher
    } catch (error) {
      console.error('添加教师失败:', error)
      throw error
    }
  },
  
  // 更新教师信息
  async updateTeacher({ commit }, teacherData) {
    try {
      const response = await teacherApi.updateTeacher(teacherData.id, teacherData)
      const updatedTeacher = response.data.data
      commit('UPDATE_TEACHER', updatedTeacher)
      return updatedTeacher
    } catch (error) {
      console.error('更新教师失败:', error)
      throw error
    }
  },
  
  // 删除教师
  async deleteTeacher({ commit }, teacherId) {
    try {
      await teacherApi.deleteTeacher(teacherId)
      commit('DELETE_TEACHER', teacherId)
      return true
    } catch (error) {
      console.error('删除教师失败:', error)
      throw error
    }
  },
  
  // 验证教师账号
  async validateTeacher({ state }, { username, password }) {
    try {
      // 添加教师登录验证API
      const loginData = { username, password }
      const response = await axios.post(`${API_BASE_URL}/teachers/login`, loginData)
      
      if (response.data && response.data.success) {
        return response.data.data
      } else {
        throw new Error('教师账号或密码错误')
      }
    } catch (error) {
      console.error('教师验证失败:', error)
      throw error
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}