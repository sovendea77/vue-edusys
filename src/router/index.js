import Vue from 'vue'
import Router from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import TeacherManagement from '../views/TeacherManagement.vue'
import CreateExam from '../views/CreateExam.vue'
import DefineAnswers from '../views/DefineAnswers.vue'
import ExamAnswers from '../views/ExamAnswers.vue'
import ExamContent from '../views/ExamContent.vue'
import StudentWrongAnswers from '../views/StudentWrongAnswers.vue'
import AIAnalysis from '../views/AIAnalysis.vue'
import store from '../store'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { title: '登录' }
    },
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: { title: '首页', requiresAuth: true }
    },
    {
      path: '/teacher-management',
      name: 'TeacherManagement',
      component: TeacherManagement,
      meta: { title: '教师管理', requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/create-exam',
      name: 'CreateExam',
      component: CreateExam,
      meta: { title: '创建考试', requiresAuth: true }
    },
    {
      path: '/exam/:examId/define-answers',
      name: 'DefineAnswers',
      component: DefineAnswers,
      meta: { title: '定义答案', requiresAuth: true }
    },
    {
      path: '/exam/:examId/answers',
      name: 'ExamAnswers',
      component: ExamAnswers,
      meta: { title: '考试答案', requiresAuth: true }
    },
    {
      path: '/exam-content',
      name: 'ExamContent',
      component: ExamContent,
      meta: { title: '考试内容', requiresAuth: true }
    },
    {
      path: '/student-wrong-answers/:examId/:studentId/:studentName',
      name: 'StudentWrongAnswers',
      component: StudentWrongAnswers,
      meta: { title: '学生错题详情', requiresAuth: true }
    },
    {
      path: '/ai-analysis',
      name: 'AIAnalysis',
      component: AIAnalysis,
      meta: { title: 'AI错题分析', requiresAuth: true }
    }
  ]
})

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 教育管理系统` : '教育管理系统'
  
  // 检查是否需要登录权限
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查是否已登录
    if (!store.state.user.token) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 如果没有用户信息，获取用户信息
    if (!store.state.user.userInfo) {
      try {
        // 获取用户信息
        const { roles } = await store.dispatch('user/getUserInfo')
        
        // 检查是否需要管理员权限
        if (to.matched.some(record => record.meta.requiresAdmin) && !roles.includes('admin')) {
          next({ path: '/' })
          return
        }
        
        next()
      } catch (error) {
        // 获取用户信息失败，可能是token过期，清除token并跳转到登录页
        await store.dispatch('user/resetToken')
        next(`/login?redirect=${to.path}`)
      }
    } else {
      // 已有用户信息，检查是否需要管理员权限
      if (to.matched.some(record => record.meta.requiresAdmin) && 
          !store.state.user.roles.includes('admin')) {
        next({ path: '/' })
        return
      }
      next()
    }
  } else {
    // 不需要登录权限的页面
    if (to.path === '/login' && store.state.user.token) {
      // 已登录用户访问登录页，重定向到首页
      next({ path: '/' })
    } else {
      next()
    }
  }
})

export default router
