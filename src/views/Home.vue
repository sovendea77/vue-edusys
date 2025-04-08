<template>
  <div class="exam-list-container">
    <h1 class="system-title">多模态试卷自动批改系统</h1>
    
    <div class="exam-list-section">
      <h2>考试记录</h2>
      
      <!-- 考试列表 -->
      <div class="exam-cards">
        <el-card 
          v-for="exam in exams" 
          :key="exam.id" 
          class="exam-card" 
          shadow="hover"
          @click.native="viewExamAnswers(exam.id)"
        >
          <div class="exam-card-content">
            <div class="exam-id">考试ID: {{ exam.id }}</div>
            <div class="exam-title">{{ exam.title }}</div>
            <div class="exam-description" v-if="exam.description">{{ exam.description }}</div>
            <div class="exam-date">创建时间: {{ formatDate(exam.created_at) }}</div>
            <div class="exam-actions">
              <el-button 
                type="danger" 
                size="mini" 
                icon="el-icon-delete" 
                circle
                @click.stop="confirmDeleteExam(exam.id)"
              ></el-button>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 空状态提示 -->
      <div class="empty-state" v-if="exams.length === 0 && !loading">
        <el-empty description="暂无考试记录"></el-empty>
        <el-button type="primary" @click="createNewExam" class="create-exam-btn">创建新考试</el-button>
      </div>
      
      <!-- 加载状态 -->
      <div class="loading-state" v-if="loading">
        <el-skeleton :rows="3" animated />
        <el-skeleton :rows="3" animated />
      </div>
      
      <!-- 创建新考试按钮 -->
      <div class="create-exam-container" v-if="exams.length > 0 && !loading">
        <el-button type="primary" @click="createNewExam" class="create-exam-btn">创建新考试</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { examApi } from '../api/exam';

export default {
  name: 'Home',
  data() {
    return {
      exams: [],
      loading: true,
      error: null
    }
  },
  methods: {
    // 获取考试列表
    fetchExams() {
      this.loading = true;
      
      // 从Vuex中获取当前登录的教师ID
      const teacherId = this.$store.state.user.userInfo ? this.$store.state.user.userInfo.id : 1; // 默认使用ID为1的教师
      
      // 添加获取考试列表的API调用
      // 注意：需要在API中添加getExamsByTeacherId方法
      examApi.getExamsByTeacherId(teacherId)
        .then(response => {
          if (response.data.success) {
            this.exams = response.data.data;
          } else {
            this.error = response.data.message || '获取考试列表失败';
            this.$message.error(this.error);
          }
        })
        .catch(error => {
          console.error('获取考试列表失败:', error);
          this.error = '获取考试列表失败，请重试';
          this.$message.error(this.error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 查看考试答案
    viewExamAnswers(examId) {
      this.$router.push(`/exam/${examId}/answers`);
    },
    // 创建新考试
    createNewExam() {
      this.$router.push('/create-exam');
    },
    // 确认删除考试
    confirmDeleteExam(examId) {
      this.$confirm('此操作将永久删除该考试及其所有答案记录, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteExam(examId);
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });
    },
    // 删除考试
    deleteExam(examId) {
      examApi.deleteExam(examId)
        .then(response => {
          if (response.data.success) {
            this.$message({
              type: 'success',
              message: '删除成功!'
            });
            // 重新获取考试列表
            this.fetchExams();
          } else {
            this.$message.error(response.data.message || '删除失败');
          }
        })
        .catch(error => {
          console.error('删除考试失败:', error);
          this.$message.error('删除考试失败，请重试');
        });
    },
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  },
  created() {
    // 页面创建时加载考试列表
    this.fetchExams();
  }
}
</script>

<style scoped>
.exam-list-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.system-title {
  text-align: center;
  color: white;
  background-color: #409EFF;
  padding: 15px;
  margin-top: 0;
  border-radius: 4px;
}

.exam-list-section {
  margin-top: 20px;
}

.exam-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.exam-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
}

.exam-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.exam-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.exam-id {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.exam-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.exam-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  flex-grow: 1;
}

.exam-date {
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.exam-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.3s;
}

.exam-card:hover .exam-actions {
  opacity: 1;
}

.empty-state {
  margin-top: 40px;
  text-align: center;
}

.loading-state {
  margin-top: 20px;
}

.create-exam-container {
  margin-top: 30px;
  text-align: center;
}

.create-exam-btn {
  padding: 10px 20px;
}
</style>
