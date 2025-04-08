<template>
  <div class="create-exam-container">
    <h1 class="page-title">创建新考试</h1>
    
    <el-card class="create-exam-card">
      <el-form :model="examForm" :rules="rules" ref="examForm" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="examForm.title" placeholder="请输入考试标题"></el-input>
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            type="textarea" 
            v-model="examForm.description" 
            placeholder="请输入考试描述"
            :rows="4"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">创建考试</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { examApi } from '../api/exam';

export default {
  name: 'CreateExam',
  data() {
    return {
      examForm: {
        title: '',
        description: ''
      },
      rules: {
        title: [
          { required: true, message: '请输入考试标题', trigger: 'blur' },
          { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
        ],
        description: [
          { max: 500, message: '长度不能超过 500 个字符', trigger: 'blur' }
        ]
      },
      loading: false
    };
  },
  methods: {
    submitForm() {
      this.$refs.examForm.validate(valid => {
        if (valid) {
          this.loading = true;
          
          // 获取当前登录教师的ID
          const teacherId = this.$store.state.user.userInfo ? this.$store.state.user.userInfo.id : null;
          
          // 检查teacherId是否存在
          if (!teacherId) {
            this.$message.error('获取用户信息失败，请重新登录');
            this.loading = false;
            return;
          }
          
          // 创建考试数据对象
          const examData = {
            title: this.examForm.title,
            description: this.examForm.description,
            teacher_id: teacherId
          };
          
          // 调用API创建考试
          examApi.createExam(examData)
            .then(response => {
              if (response.data.success) {
                this.$message({
                  type: 'success',
                  message: '考试创建成功！'
                });
                
                // 跳转到答案定义页面，并传递考试ID
                const examId = response.data.data.id;
                this.$router.push(`/exam/${examId}/define-answers`);
              } else {
                this.$message({
                  type: 'error',
                  message: response.data.message || '创建失败，请重试'
                });
              }
            })
            .catch(error => {
              console.error('创建考试失败:', error);
              this.$message({
                type: 'error',
                message: '创建失败，请重试'
              });
            })
            .finally(() => {
              this.loading = false;
            });
        }
      });
    },
    resetForm() {
      this.$refs.examForm.resetFields();
    }
  }
};
</script>

<style scoped>
.create-exam-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  text-align: center;
  margin-bottom: 30px;
  color: #409EFF;
}

.create-exam-card {
  margin-bottom: 20px;
}
</style>