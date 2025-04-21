<template>
  <div id="app">
    <el-container v-if="isLoggedIn">
      <el-header>
        <div class="header-container">
          <div class="logo">
            <span>多模态试卷自动勘误辅导系统</span>
          </div>
          <div class="user-info">
            <span v-if="userInfo">{{ userInfo.name }}</span>
            <el-dropdown @command="handleCommand">
              <span class="el-dropdown-link">
                <i class="el-icon-setting"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px">
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            router
            background-color="#545c64"
            text-color="#fff"
            active-text-color="#ffd04b">
            <el-menu-item index="/">
              <i class="el-icon-s-home"></i>
              <span slot="title">考试列表</span>
            </el-menu-item>
            <el-menu-item index="/teacher-management" v-if="isAdmin">
              <i class="el-icon-user"></i>
              <span slot="title">教师管理</span>
            </el-menu-item>
            <el-menu-item index="/create-exam">
              <i class="el-icon-edit-outline"></i>
              <span slot="title">创建考试</span>
            </el-menu-item>
            <el-menu-item index="/ai-analysis">
              <i class="el-icon-data-analysis"></i>
              <span slot="title">AI错题分析</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main>
          <router-view/>
        </el-main>
      </el-container>
    </el-container>
    <router-view v-else/>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapState('user', ['userInfo', 'roles']),
    isLoggedIn() {
      return this.$route.path !== '/login'
    },
    isAdmin() {
      return this.roles.includes('admin')
    },
    activeMenu() {
      return this.$route.path
    }
  },
  methods: {
    ...mapActions('user', ['logout']),
    handleCommand(command) {
      if (command === 'logout') {
        this.logout().then(() => {
          this.$router.push('/login')
          this.$message.success('已退出登录')
        })
      }
    }
  }
}
</script>

<style>
/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

.el-header {
  background-color: #409EFF;
  color: #fff;
  line-height: 60px;
  padding: 0 20px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
}

.logo span {
  margin-left: 10px;
  font-size: 18px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-info span {
  margin-right: 15px;
}

.el-dropdown-link {
  cursor: pointer;
  color: #fff;
}

.el-container {
  height: 100%;
}

.el-aside {
  background-color: #545c64;
  color: #fff;
}

.el-menu-vertical {
  height: 100%;
  border-right: none;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
