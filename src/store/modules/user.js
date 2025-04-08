/**
 * 用户状态管理模块
 */
import Cookies from 'js-cookie'

const state = {
  token: Cookies.get('token'),
  userInfo: null,
  roles: []
}

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
    if (token) {
      Cookies.set('token', token)
    } else {
      Cookies.remove('token')
    }
  },
  SET_USER_INFO: (state, userInfo) => {
    state.userInfo = userInfo
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  CLEAR_USER: (state) => {
    state.token = null
    state.userInfo = null
    state.roles = []
    Cookies.remove('token')
  }
}

const actions = {
  // 用户登录
  login({ commit, dispatch }, userInfo) {
    const { role, username, password } = userInfo
    return new Promise((resolve, reject) => {
      // 模拟API请求
      setTimeout(async () => {
        if (role === 'admin') {
          // 管理员登录验证
          if (username === 'admin' && password === '123456') {
            const token = 'admin-token'
            commit('SET_TOKEN', token)
            commit('SET_ROLES', ['admin'])
            commit('SET_USER_INFO', {
              id: 1,
              username: 'admin',
              name: '管理员'
            })
            resolve()
          } else {
            reject(new Error('管理员账号或密码错误'))
          }
        } else if (role === 'teacher') {
          try {
            // 验证教师账号
            const teacher = await dispatch('teachers/validateTeacher', { username, password }, { root: true })
            // 教师登录成功
            const token = 'teacher-token'
            commit('SET_TOKEN', token)
            commit('SET_ROLES', ['teacher'])
            commit('SET_USER_INFO', {
              id: teacher.id,
              username: teacher.username,
              name: teacher.name
            })
            resolve()
          } catch (error) {
            reject(new Error('教师账号或密码错误'))
          }
        } else {
          reject(new Error('无效的登录角色'))
        }
      }, 300)
    })
  },

  // 获取用户信息
  getUserInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      // 模拟API请求
      setTimeout(() => {
        if (state.token === 'admin-token') {
          commit('SET_ROLES', ['admin'])
          commit('SET_USER_INFO', {
            id: 1,
            username: 'admin',
            name: '管理员'
          })
          resolve({ roles: ['admin'] })
        } else if (state.token) {
          commit('SET_ROLES', ['teacher'])
          commit('SET_USER_INFO', {
            id: 2,
            username: 'teacher',
            name: '教师'
          })
          resolve({ roles: ['teacher'] })
        } else {
          reject(new Error('获取用户信息失败'))
        }
      }, 300)
    })
  },

  // 退出登录
  logout({ commit }) {
    return new Promise(resolve => {
      commit('CLEAR_USER')
      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}