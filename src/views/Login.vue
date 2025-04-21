<template>
  <div class="login-container">
    <el-card class="login-card">
      <div slot="header" class="header">
        <h2>多模态试卷自动批改系统登录</h2>
      </div>
      <el-form :model="loginForm" :rules="loginRules" ref="loginForm" label-width="80px">
        <el-form-item label="角色" prop="role">
          <el-select v-model="loginForm.role" placeholder="请选择登录角色" style="width: 100%">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="教师" value="teacher"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        
        <el-button type="primary" @click="handleLogin" :loading="loading" class="login-button">登录</el-button>
        
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        role: 'admin',
        username: '',
        password: ''
      },
      loginRules: {
        role: [{ required: true, message: '请选择登录角色', trigger: 'change' }],
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      },
      loading: false
    }
  },
  methods: {
    ...mapActions('user', ['login']),
    handleLogin() {
      this.$refs.loginForm.validate(async valid => {
        if (valid) {
          this.loading = true
          try {
            await this.login({
              role: this.loginForm.role,
              username: this.loginForm.username,
              password: this.loginForm.password
            })
            this.$router.push('/')
          } catch (error) {
            this.$message.error(error.message || '登录失败')
          } finally {
            this.loading = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: url('../../picture/风景.png');
  background-size: cover;
  background-position: center;
}

.login-card {
  width: 400px;
  background-color: rgba(255, 255, 255, 0.6);
}

.header {
  text-align: center;
}

.login-button {
  width: 50%;
  margin: 0 auto;
  display: flex;
  justify-content: center;
}

</style>