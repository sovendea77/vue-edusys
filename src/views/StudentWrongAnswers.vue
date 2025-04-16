<template>
  <div class="wrong-answers-container">
    <h1 class="system-title">学生错题详情</h1>
    
    <div class="student-info">
      <el-button icon="el-icon-back" size="small" @click="goBack">返回</el-button>
      <h2>{{ studentName }} 的错题列表</h2>
    </div>
    
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="error" class="error-state">
      <el-alert
        :title="error"
        type="error"
        :closable="false"
        show-icon
      ></el-alert>
    </div>
    
    <div v-else-if="wrongAnswers.length === 0" class="empty-state">
      <el-empty description="该学生没有错题记录"></el-empty>
    </div>
    
    <div v-else class="wrong-answers-list">
      <el-card v-for="(wrongAnswer, index) in wrongAnswers" :key="index" class="wrong-answer-card">
        <div class="question-header">
          <span class="question-number">{{ wrongAnswer.chinese_number }}、{{ wrongAnswer.question_number }}.</span>
          <span class="question-type-badge" :class="getTypeClass(wrongAnswer.chinese_number)">{{ getTypeName(wrongAnswer.chinese_number) }}</span>
        </div>
        
        <div class="question-content" v-if="wrongAnswer.content">
          {{ wrongAnswer.content }}
        </div>
        
        <div class="answers-container">
          <div class="answer-item">
            <span class="answer-label">学生答案:</span>
            <span class="student-answer">{{ wrongAnswer.student_answer || '未作答' }}</span>
          </div>
          <div class="answer-item">
            <span class="answer-label">正确答案:</span>
            <span class="correct-answer">{{ wrongAnswer.correct_answer }}</span>
          </div>
          
          <div class="ai-analysis-section">
            <el-button 
              type="primary" 
              size="small" 
              icon="el-icon-s-opportunity"
              :loading="wrongAnswer.aiAnalyzing"
              @click="analyzeWithAI(wrongAnswer)"
            >
              AI分析
            </el-button>

            <div v-if="wrongAnswer.aiAnalysisResult" class="ai-analysis-result">
              <el-card class="ai-result-card">
                <div class="ai-result-content" style="white-space: pre-wrap;">
                  {{ wrongAnswer.aiAnalysisResult }}
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { studentApi } from '../api/student';
import { aiApi } from '../api/ai'; 

export default {
  name: 'StudentWrongAnswers',
  data() {
    return {
      examId: null,
      studentId: null,
      studentName: '',
      wrongAnswers: [],
      loading: true,
      error: null
    };
  },
  methods: {
    // 获取学生错题详情
    fetchWrongAnswers() {
      this.loading = true;
      this.error = null;
      
      studentApi.getStudentWrongAnswers(this.examId, this.studentId)
        .then(response => {
          if (response.data.success) {
            this.wrongAnswers = response.data.data;
            console.log('获取到的错题详情:', this.wrongAnswers);
          } else {
            throw new Error(response.data.message || '获取错题详情失败');
          }
        })
        .catch(error => {
          console.error('获取错题详情失败:', error);
          this.error = error.message || '获取错题详情失败，请重试';
        })
        .finally(() => {
          this.loading = false;
        });
    },
      // AI分析
  async analyzeWithAI(wrongAnswer) {
      if (wrongAnswer.aiAnalyzing) return;
      this.$set(wrongAnswer, 'aiAnalyzing', true);
      
      try {
        const analysisData = {
          questionType: this.getTypeName(wrongAnswer.chinese_number),
          questionContent: wrongAnswer.content,
          correctAnswer: wrongAnswer.correct_answer,
          studentAnswer: wrongAnswer.student_answer || '未作答'
        };

        const result = await aiApi.analyzeWrongAnswerWithDeepseekR1(analysisData);

        this.$set(wrongAnswer, 'aiAnalysisResult', result);
        this.$message.success('AI分析完成');
      } catch (error) {
        console.error('AI分析失败:', error);
        this.$message.error('AI分析失败: ' + (error.message || '未知错误'));
      } finally {
        this.$set(wrongAnswer, 'aiAnalyzing', false);
      }
    },
    // 返回上一页
    goBack() {
      this.$router.push('/exam-content');
    },
    // 获取题目类型样式类
    getTypeClass(chineseNumber) {
      // 直接使用当前题目的section_type判断题型
      const wrongAnswer = this.wrongAnswers.find(item => item.chinese_number === chineseNumber);
      if (wrongAnswer && wrongAnswer.section_type) {
        const sectionType = wrongAnswer.section_type.toLowerCase();
        if (sectionType === 'choice' || sectionType.includes('选择')) {
          return 'type-choice';
        } else if (sectionType === 'fill' || sectionType.includes('填空')) {
          return 'type-fill';
        } else if (sectionType === 'judgment' || sectionType.includes('判断')) {
          return 'type-judgment';
        } else if (sectionType === 'essay' || sectionType.includes('解答')) {
          return 'type-essay';
        }
      }
      return '';
    },
    // 获取题目类型名称
    getTypeName(chineseNumber) {
      // 根据section_type判断题型
      const wrongAnswer = this.wrongAnswers.find(item => item.chinese_number === chineseNumber);
      if (wrongAnswer && wrongAnswer.section_type) {
        const sectionType = wrongAnswer.section_type.toLowerCase();
        if (sectionType === 'choice' || sectionType.includes('选择')) {
          return '选择题';
        } else if (sectionType === 'fill' || sectionType.includes('填空')) {
          return '填空题';
        } else if (sectionType === 'judgment' || sectionType.includes('判断')) {
          return '判断题';
        } else if (sectionType === 'essay' || sectionType.includes('解答')) {
          return '解答题';
        }
        return wrongAnswer.section_type;
      }
      return '未知题型';
    }
  },
  created() {
    // 从路由参数获取考试ID和学生ID
    this.examId = this.$route.params.examId;
    this.studentId = this.$route.params.studentId;
    this.studentName = this.$route.params.studentName || this.studentId;
    
    if (!this.examId || !this.studentId) {
      this.error = '缺少必要参数';
      this.loading = false;
      return;
    }
    
    // 获取错题详情
    this.fetchWrongAnswers();
  }
  };
</script>

<style scoped>
.wrong-answers-container {
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

.student-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.student-info h2 {
  margin-left: 15px;
  flex-grow: 1;
}

.loading-state,
.error-state,
.empty-state {
  margin-top: 40px;
  text-align: center;
}

.wrong-answers-list {
  margin-top: 20px;
}

.wrong-answer-card {
  margin-bottom: 15px;
}

.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.question-number {
  font-weight: bold;
  font-size: 16px;
  margin-right: 10px;
}

.question-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
  font-size: 12px;
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

.question-content {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.answers-container {
  display: flex;
  flex-direction: column;
}

.answer-item {
  margin-bottom: 10px;
}

.answer-label {
  font-weight: bold;
  margin-right: 10px;
}

.student-answer {
  color: #F56C6C;
}

.correct-answer {
  color: #67C23A;
}

/* 添加新样式 */
.ai-analysis-section {
  margin-top: 15px;
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.ai-analysis-result {
  margin-top: 10px;
}

.ai-result-card {
  background-color: #f8f9fa;
}

.ai-result-content {
  padding: 10px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

/* 解答题样式 */
.essay-answer-container {
  width: 100%;
}

.essay-answer {
  margin-top: 5px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  line-height: 1.6;
  width: 100%;
}
</style>