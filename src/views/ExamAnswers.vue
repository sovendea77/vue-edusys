<template>
  <div class="exam-answers-container">
    <h1 class="system-title">{{ exam.title || 'xxx考试名（exams表里的title）' }}</h1>
    
    <div class="exam-description" v-if="exam.description">
      描述：{{ exam.description || '（exams表里的description）' }}
    </div>
    
    <div class="exam-total-score" v-if="exam.total_score">
      试卷总分：<span class="total-score-value">{{ exam.total_score }}</span>
    </div>
    
    <div class="answers-section">
      <!-- 按中文题号分组显示题目 -->
      <el-card v-for="(group, groupIndex) in groupedAnswers" :key="groupIndex" class="question-section-card">
        <div class="section-header">
          <div class="section-type-badge" :class="{
            'type-choice': group[0].section_type === 'choice',
            'type-fill': group[0].section_type === 'fill',
            'type-judgment': group[0].section_type === 'judgment',
            'type-essay': group[0].section_type === 'essay'
          }">
            {{ group[0].chinese_number || getChineseNumber(groupIndex + 1) }}、
            {{ group[0].section_type === 'choice' ? '选择题' : 
               group[0].section_type === 'fill' ? '填空题' : 
               group[0].section_type === 'judgment' ? '判断题' : 
               group[0].section_type === 'essay' ? '解答题' : '未知题型' }}
            <span class="section-score">{{ group[0].score }}分</span>
          </div>
        </div>
        
        <div class="questions-list">
          <div v-for="question in group" :key="question.id" class="question-item" :class="{'essay-question-item': question.section_type === 'essay'}">
            <span class="question-number">{{ question.question_number }}.</span>
            <!-- 解答题答案 -->
            <div v-if="question.section_type === 'essay'" class="essay-answer">
              <span>{{ question.answer }}</span>
            </div>
            <!-- 其他题型答案 -->
            <span v-else class="question-answer" :class="{
              'judgment-true': question.section_type === 'judgment' && question.answer === '对', 
              'judgment-false': question.section_type === 'judgment' && question.answer === '错'
            }">{{ question.answer }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 统计信息展示区域 -->
      <div v-if="examStatistics.studentCount > 0" class="statistics-section">
        <div class="statistics-content">
          <div class="statistics-item">
            <span class="statistics-label">试卷总分:</span>
            <span class="statistics-value">{{ examStatistics.totalScore }}</span>
          </div>
          <div class="statistics-item">
            <span class="statistics-label">参考学生数:</span>
            <span class="statistics-value">{{ examStatistics.studentCount }}</span>
          </div>
          <div class="statistics-item">
            <span class="statistics-label">最高分:</span>
            <span class="statistics-value">{{ examStatistics.highestScore }}</span>
            <span v-if="examStatistics.highestScoreStudent" class="statistics-student">({{ examStatistics.highestScoreStudent }})</span>
          </div>
          <div class="statistics-item">
            <span class="statistics-label">最低分:</span>
            <span class="statistics-value">{{ examStatistics.lowestScore }}</span>
          </div>
          <div class="statistics-item">
            <span class="statistics-label">平均分:</span>
            <span class="statistics-value">{{ examStatistics.averageScore }}</span>
          </div>
        </div>
      
        <!-- 学生列表 -->
        <div class="student-list-section">
          <h3 class="student-list-title">学生成绩列表</h3>
          <div v-if="studentListLoading" class="loading-state">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else-if="studentList.length === 0" class="empty-state">
            <el-empty description="暂无学生成绩数据"></el-empty>
          </div>
          <div v-else class="student-list">
            <el-table :data="studentList" style="width: 100%" :stripe="true" :border="true">
              <el-table-column prop="student_name" label="学生姓名" width="180"></el-table-column>
              <el-table-column prop="score" label="分数" width="120"></el-table-column>
              <el-table-column label="操作">
                <template slot-scope="scope">
                  <el-button 
                    size="mini" 
                    type="primary" 
                    @click="viewStudentWrongAnswers(scope.row)"
                  >查看错题</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
      
      <!-- 返回按钮 -->
      <div class="back-button-container">
        <el-button type="primary" @click="goBack">返回考试列表</el-button>
        <el-button type="success" @click="viewExamContent">查看考试内容</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { examApi } from '../api/exam';
import { studentApi } from '../api/student';

export default {
  name: 'ExamAnswers',
  data() {
    return {
      exam: {},
      answers: [],
      loading: true,
      error: null,
      examStatistics: {
        studentCount: 0,
        totalScore: 0,
        highestScore: 0,
        highestScoreStudent: null,
        lowestScore: 0,
        averageScore: 0
      },
      studentList: [],
      studentListLoading: false
    }
  },
  computed: {
    // 按中文题号分组的答案
    groupedAnswers() {
      // 先按中文题号分组
      const groups = {};
      this.answers.forEach(answer => {
        const key = answer.chinese_number || '';
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(answer);
      });
      return Object.values(groups);
    },
    // 选择题列表（兼容旧代码）
    choiceQuestions() {
      return this.answers.filter(answer => answer.section_type === 'choice');
    },
    // 填空题列表（兼容旧代码）
    fillQuestions() {
      return this.answers.filter(answer => answer.section_type === 'fill');
    },
    // 判断题列表（兼容旧代码）
    judgmentQuestions() {
      return this.answers.filter(answer => answer.section_type === 'judgment');
    },
    // 解答题列表
    essayQuestions() {
      return this.answers.filter(answer => answer.section_type === 'essay');
    }
  },
  methods: {
    // 获取考试详情
    fetchExamDetails() {
      const examId = this.$route.params.examId;
      if (!examId) {
        this.error = '未找到考试ID';
        this.$message.error(this.error);
        return;
      }
      
      this.loading = true;
      
      // 获取考试详情
      examApi.getExamById(examId)
        .then(response => {
          if (response.data.success) {
            this.exam = response.data.data;
            // 获取考试答案
            return examApi.getAnswers(examId);
          } else {
            throw new Error(response.data.message || '获取考试详情失败');
          }
        })
        .then(response => {
          if (response.data.success) {
            this.answers = response.data.data;
            // 获取考试统计信息
            this.getExamStatistics();
            // 获取学生列表
            this.getStudentList();
          } else {
            throw new Error(response.data.message || '获取考试答案失败');
          }
        })
        .catch(error => {
          console.error('获取考试详情或答案失败:', error);
          this.error = error.message || '获取考试详情或答案失败，请重试';
          this.$message.error(this.error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 返回考试列表
    goBack() {
      this.$router.push('/');
    },
    // 获取中文数字
    getChineseNumber(num) {
      const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      if (num <= 0 || num > 10) return num;
      return chineseNumbers[num - 1];
    },
    // 检查是否有特定类型的题目在前面
    hasSectionBefore(type) {
      if (type === 'fill') {
        return this.choiceQuestions.length > 0;
      } else if (type === 'judgment') {
        return this.choiceQuestions.length > 0 || this.fillQuestions.length > 0;
      } else if (type === 'essay') {
        return this.choiceQuestions.length > 0 || this.fillQuestions.length > 0 || this.judgmentQuestions.length > 0;
      }
      return false;
    },
    // 获取题目类型的序号
    getSectionIndex(type) {
      let index = 1;
      if (type === 'fill') {
        if (this.choiceQuestions.length > 0) index++;
      } else if (type === 'judgment') {
        if (this.choiceQuestions.length > 0) index++;
        if (this.fillQuestions.length > 0) index++;
      } else if (type === 'essay') {
        if (this.choiceQuestions.length > 0) index++;
        if (this.fillQuestions.length > 0) index++;
        if (this.judgmentQuestions.length > 0) index++;
      }
      return index;
    },
    
    // 获取考试统计信息
    getExamStatistics() {
      const examId = this.$route.params.examId;
      if (!examId) return;
      
      // 获取统计信息
      studentApi.getExamStatistics(examId)
        .then(response => {
          if (response.data.success) {
            this.examStatistics = response.data.data;
            console.log('成功获取考试统计信息');
          } else {
            console.warn('获取考试统计信息失败:', response.data.message);
          }
        })
        .catch(error => {
          console.error('获取考试统计信息失败:', error);
        });
    },
    
    // 获取学生列表
    getStudentList() {
      const examId = this.$route.params.examId;
      if (!examId) return;
      
      this.studentListLoading = true;
      
      // 获取学生列表
      studentApi.getStudentList(examId)
        .then(response => {
          if (response.data.success) {
            this.studentList = response.data.data;
            console.log('成功获取学生列表:', this.studentList);
          } else {
            console.warn('获取学生列表失败:', response.data.message);
          }
        })
        .catch(error => {
          console.error('获取学生列表失败:', error);
        })
        .finally(() => {
          this.studentListLoading = false;
        });
    },
    
    // 查看学生错题
    viewStudentWrongAnswers(student) {
      const examId = this.$route.params.examId;
      if (!examId) {
        this.$message.warning('未找到考试ID');
        return;
      }
      
      this.$router.push({
        name: 'StudentWrongAnswers',
        params: {
          examId: examId,
          studentId: student.student_name,
          studentName: student.student_name
        }
      });
    },
    // 查看考试内容
    viewExamContent() {
      const examId = this.$route.params.examId;
      if (!examId) {
        this.$message.warning('未找到考试ID');
        return;
      }
      
      this.$router.push({
        name: 'ExamContent',
        params: {
          examId: examId
        }
      });
    },
  },
  created() {
    this.fetchExamDetails();
  }
}
</script>

<style scoped>
.exam-answers-container {
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

.exam-description {
  margin: 15px 0;
  color: #606266;
  font-size: 14px;
}

.exam-total-score {
  margin: 15px 0;
  color: #606266;
  font-size: 14px;
}

.total-score-value {
  color: #F56C6C;
  font-weight: bold;
  font-size: 16px;
}

.answers-section {
  margin-top: 20px;
}

.question-section-card {
  margin-bottom: 20px;
}

.section-header {
  margin-bottom: 15px;
}

.section-type-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 15px;
  color: white;
  font-weight: bold;
}

.type-choice {
  background-color: #67C23A;
}

.type-fill {
  background-color: #E6A23C;
}

.type-judgment {
  background-color: #F56C6C;
}

.type-essay {
  background-color: #409EFF;
}

.section-score {
  margin-left: 5px;
  font-size: 0.9em;
}

.questions-list {
  display: flex;
  flex-wrap: wrap;
}

.question-item {
  margin-right: 20px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.question-number {
  margin-right: 5px;
  font-weight: bold;
}

.question-answer {
  color: #409EFF;
  font-weight: bold;
}

.judgment-true {
  color: #67C23A;
}

.judgment-false {
  color: #F56C6C;
}

.essay-question-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 20px;
}

.essay-answer {
  margin-top: 10px;
  width: 100%;
  background-color: #f8f8f8;
  border-radius: 4px;
  padding: 10px;
  color: #409EFF;
  font-weight: bold;
}

.statistics-section {
  margin-top: 30px;
  margin-bottom: 30px;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
}

.statistics-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 20px;
}

.statistics-item {
  flex: 1;
  min-width: 150px;
  margin: 10px;
  text-align: center;
}

.statistics-label {
  display: block;
  color: #606266;
  font-size: 14px;
  margin-bottom: 5px;
}

.statistics-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.statistics-student {
  font-size: 14px;
  color: #606266;
  margin-left: 5px;
}

.student-list-section {
  margin-top: 20px;
}

.student-list-title {
  font-size: 18px;
  color: #303133;
  margin-bottom: 15px;
}

.student-list {
  margin-bottom: 20px;
}

.loading-state,
.empty-state {
  padding: 20px;
  text-align: center;
}

.back-button-container {
  margin-top: 30px;
  text-align: center;
}
</style>