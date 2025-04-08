/**
 * Vuex状态管理
 */

import Vue from 'vue'
import Vuex from 'vuex'

// 导入各模块的状态管理
import user from './modules/user'
import teachers from './modules/teachers'
// import course from './modules/course'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 全局状态
  },
  mutations: {
    // 修改状态的方法
  },
  actions: {
    // 异步操作
  },
  getters: {
    // 计算属性
  },
  modules: {
    // 模块化状态管理
    user,
    teachers,
    // course
  }
})