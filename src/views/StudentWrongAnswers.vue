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
          <!-- 在学生答案和正确答案显示后，添加填空题批改部分 -->
          <div class="answer-item">
            <span class="answer-label">正确答案:</span>
            <span class="correct-answer">{{ wrongAnswer.correct_answer }}</span>
          </div>
          
          <!-- 添加填空题批改部分 -->
          <div v-if="isFillQuestion(wrongAnswer.chinese_number)" class="fill-grading-section">
            <div class="grading-buttons">
              <el-button 
                type="warning" 
                size="small" 
                icon="el-icon-edit"
                :loading="wrongAnswer.aiGrading"
                @click="gradeFillWithAI(wrongAnswer)"
              >
                AI批改
              </el-button>
              
              <el-button 
                type="primary" 
                size="small" 
                icon="el-icon-user"
                @click="showManualGradingForFill(wrongAnswer)"
              >
                手动批改
              </el-button>
            </div>
            
            <div v-if="wrongAnswer.aiGradeResult !== undefined" class="ai-grade-result">
              <span class="grade-label">AI评判:</span>
              <span class="grade-score" :class="{'correct': wrongAnswer.aiGradeResult === '正确', 'incorrect': wrongAnswer.aiGradeResult === '错误'}">
                {{ wrongAnswer.aiGradeResult }}
              </span>
              <el-button 
                type="success" 
                size="mini" 
                @click="saveFillCorrectness(wrongAnswer, wrongAnswer.aiGradeResult === '正确')"
                :disabled="wrongAnswer.gradeSaved"
              >
                {{ wrongAnswer.gradeSaved ? '已保存' : '保存结果' }}
              </el-button>
            </div>
            
            <div v-if="wrongAnswer.manualGradeResult !== undefined" class="manual-grade-result">
              <span class="grade-label">教师评判:</span>
              <span class="grade-score" :class="{'correct': wrongAnswer.manualGradeResult === '正确', 'incorrect': wrongAnswer.manualGradeResult === '错误'}">
                {{ wrongAnswer.manualGradeResult }}
              </span>
              <el-button 
                type="success" 
                size="mini" 
                @click="saveFillCorrectness(wrongAnswer, wrongAnswer.manualGradeResult === '正确')"
                :disabled="wrongAnswer.gradeSaved"
              >
                {{ wrongAnswer.gradeSaved ? '已保存' : '保存结果' }}
              </el-button>
            </div>
          </div>
          
          <div v-if="isEssayQuestion(wrongAnswer.chinese_number)" class="essay-grading-section">
            <div class="grading-buttons">
              <el-button 
                type="warning" 
                size="small" 
                icon="el-icon-edit"
                :loading="wrongAnswer.aiGrading"
                @click="gradeEssayWithAI(wrongAnswer)"
              >
                AI批改
              </el-button>
              
              <el-button 
                type="primary" 
                size="small" 
                icon="el-icon-user"
                @click="showManualGrading(wrongAnswer)"
              >
                手动批改
              </el-button>
            </div>
            
            <div v-if="wrongAnswer.aiGradeResult !== undefined" class="ai-grade-result">
              <span class="grade-label">AI评分:</span>
              <span class="grade-score">{{ wrongAnswer.aiGradeResult }}分</span>
              <el-button 
                type="success" 
                size="mini" 
                @click="saveEssayGrade(wrongAnswer, wrongAnswer.aiGradeResult)"
                :disabled="wrongAnswer.gradeSaved"
              >
                {{ wrongAnswer.gradeSaved ? '已保存' : '保存评分' }}
              </el-button>
            </div>
            
            <div v-if="wrongAnswer.manualGradeResult !== undefined" class="manual-grade-result">
              <span class="grade-label">教师评分:</span>
              <span class="grade-score">{{ wrongAnswer.manualGradeResult }}分</span>
              <el-button 
                type="success" 
                size="mini" 
                @click="saveEssayGrade(wrongAnswer, wrongAnswer.manualGradeResult)"
                :disabled="wrongAnswer.gradeSaved"
              >
                {{ wrongAnswer.gradeSaved ? '已保存' : '保存评分' }}
              </el-button>
            </div>
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
  
  <el-dialog
    title="填空题手动批改"
    :visible.sync="fillManualGradingDialogVisible"
    width="500px"
  >
    <div v-if="currentGradingQuestion" class="manual-grading-dialog">
      <div class="question-info">
        <div class="info-item">
          <span class="info-label">题目:</span>
          <span>{{ currentGradingQuestion.chinese_number }}、{{ currentGradingQuestion.question_number }}.</span>
        </div>
        
        <div class="info-item" v-if="currentGradingQuestion.content">
          <span class="info-label">题目内容:</span>
          <div class="info-content">{{ currentGradingQuestion.content }}</div>
        </div>
        
        <div class="info-item">
          <span class="info-label">标准答案:</span>
          <div class="info-content">{{ currentGradingQuestion.correct_answer }}</div>
        </div>
        
        <div class="info-item">
          <span class="info-label">学生答案:</span>
          <div class="info-content">{{ currentGradingQuestion.student_answer || '未作答' }}</div>
        </div>
      </div>
      
      <div class="fill-judgment">
        <span class="judgment-label">评判结果:</span>
        <el-radio-group v-model="fillJudgment">
          <el-radio label="正确">正确</el-radio>
          <el-radio label="错误">错误</el-radio>
        </el-radio-group>
      </div>
    </div>
    
    <span slot="footer" class="dialog-footer">
      <el-button @click="fillManualGradingDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitFillManualGrading">确定</el-button>
    </span>
  </el-dialog>
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
      error: null,
      manualGradingDialogVisible: false,
      currentGradingQuestion: null,
      manualScore: 0,
      fillManualGradingDialogVisible: false,
      fillJudgment: '正确'
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
            
            // 检查每个错题是否有question_id
            this.wrongAnswers.forEach(wrongAnswer => {
              if (!wrongAnswer.question_id) {
              }
            });
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
    },
    // 显示填空题手动批改对话框
showManualGradingForFill(wrongAnswer) {
  this.currentGradingQuestion = wrongAnswer;
  this.fillJudgment = wrongAnswer.manualGradeResult || '正确';
  this.fillManualGradingDialogVisible = true;
},

// 提交填空题手动批改
submitFillManualGrading() {
  if (!this.currentGradingQuestion) return;
  
  // 更新UI显示
  this.$set(this.currentGradingQuestion, 'manualGradeResult', this.fillJudgment);
  this.$set(this.currentGradingQuestion, 'gradeSaved', false);
  
  this.fillManualGradingDialogVisible = false;
  this.$message.success('教师评判已设置');
},
    
    // 判断是否为解答题
    isEssayQuestion(chineseNumber) {
      const wrongAnswer = this.wrongAnswers.find(item => item.chinese_number === chineseNumber);
      if (wrongAnswer && wrongAnswer.section_type) {
        const sectionType = wrongAnswer.section_type.toLowerCase();
        return sectionType === 'essay' || sectionType.includes('解答');
      }
      return false;
    },
    
    // AI批改解答题
    async gradeEssayWithAI(wrongAnswer) {
      if (wrongAnswer.aiGrading) return;
      this.$set(wrongAnswer, 'aiGrading', true);
      
      try {
        const gradeData = {
          studentAnswer: wrongAnswer.student_answer || '未作答',
          standardAnswer: wrongAnswer.correct_answer,
          totalScore: wrongAnswer.question_score || wrongAnswer.score || 10 // 使用题目实际分值
        };

        // 调用AI
        const score = await aiApi.gradeEssayQuestionWithDeepseek(gradeData);
        
        // 更新UI显示
        this.$set(wrongAnswer, 'aiGradeResult', score);
        this.$set(wrongAnswer, 'gradeSaved', false);
        this.$message.success('AI批改完成');
      } catch (error) {
        console.error('AI批改失败:', error);
        this.$message.error('AI批改失败: ' + (error.message || '未知错误'));
      } finally {
        this.$set(wrongAnswer, 'aiGrading', false);
      }
    },

  // 判断是否为填空题
  isFillQuestion(chineseNumber) {
    const wrongAnswer = this.wrongAnswers.find(item => item.chinese_number === chineseNumber);
    if (wrongAnswer && wrongAnswer.section_type) {
      const sectionType = wrongAnswer.section_type.toLowerCase();
      return sectionType === 'fill' || sectionType.includes('填空');
    }
    return false;
  },

  // AI批改填空题
  async gradeFillWithAI(wrongAnswer) {
    if (wrongAnswer.aiGrading) return;
    this.$set(wrongAnswer, 'aiGrading', true);
  
    try {
      const gradeData = {
        studentAnswer: wrongAnswer.student_answer || '未作答',
        standardAnswer: wrongAnswer.correct_answer,
        questionContent: wrongAnswer.content || '无题目内容'
      };

      // 调用AI
      const isCorrect = await aiApi.gradeFillQuestionWithDeepseek(gradeData);
    
      // 更新UI显示
      this.$set(wrongAnswer, 'aiGradeResult', isCorrect ? '正确' : '错误');
      this.$set(wrongAnswer, 'gradeSaved', false);
    
      // 保存到数据库
      await this.saveFillCorrectness(wrongAnswer, isCorrect);
    
      this.$message.success('AI批改完成');
    } catch (error) {
      console.error('AI批改失败:', error);
      this.$message.error('AI批改失败: ' + (error.message || '未知错误'));
    } finally {
      this.$set(wrongAnswer, 'aiGrading', false);
    }
  },

  // 保存填空题
  async saveFillCorrectness(wrongAnswer, isCorrect) {
    try {
      const questionId = wrongAnswer.question_id || wrongAnswer.id;
    
      if (!questionId) {
        console.error('错误: 无法获取题目ID', wrongAnswer);
        this.$message.error('保存批改结果失败: 无法获取题目ID');
        return;
      }
    
      console.log('保存填空题正确性 - 使用的questionId:', questionId);
    
      const response = await studentApi.updateFillQuestionCorrectness(
        this.examId,
        this.studentId,
        questionId,
        isCorrect
      );
    
      if (response.data.success) {
        this.$set(wrongAnswer, 'gradeSaved', true);
        this.$set(wrongAnswer, 'is_corrected', isCorrect);
        this.$message.success('批改结果已保存到数据库');
      } else {
        throw new Error(response.data.message || '保存批改结果失败');
      }
    } catch (error) {
      console.error('保存批改结果失败:', error);
      this.$message.error('保存批改结果失败: ' + (error.message || '未知错误'));
    }
  },
    
    // 显示手动批改对话框
    showManualGrading(wrongAnswer) {
      this.currentGradingQuestion = wrongAnswer;
      console.log(this.currentGradingQuestion);
      this.manualScore = wrongAnswer.manualGradeResult || 0;
      this.manualGradingDialogVisible = true;
    },
    
    // 提交手动批改
    submitManualGrading() {
      if (!this.currentGradingQuestion) return;
      
      // 验证分数范围
      const totalScore = this.currentGradingQuestion.score || 10;
      if (this.manualScore < 0 || this.manualScore > totalScore) {
        this.$message.error(`分数必须在0-${totalScore}分之间`);
        return;
      }
      
      // 更新UI显示
      this.$set(this.currentGradingQuestion, 'manualGradeResult', this.manualScore);
      this.$set(this.currentGradingQuestion, 'gradeSaved', false);
      
      this.manualGradingDialogVisible = false;
      this.$message.success('教师评分已设置');
    },
    
    // 保存解答题评分
    async saveEssayGrade(wrongAnswer, score) {
      try {
        const questionId = wrongAnswer.question_id || wrongAnswer.id;
        
        // 如果没有有效的questionId
        if (!questionId) {
          console.error('错误: 无法获取题目ID', wrongAnswer);
          this.$message.error('保存评分失败: 无法获取题目ID');
          return;
        }
        
        console.log('保存评分 - 使用的questionId:', questionId);
        
        const response = await studentApi.updateEssayQuestionScore(
          this.examId,
          this.studentId,
          questionId,
          score
        );
        
        if (response.data.success) {
          this.$set(wrongAnswer, 'gradeSaved', true);
          // 更新本地score字段，确保UI显示正确
          this.$set(wrongAnswer, 'score', score);
          this.$message.success('评分已保存到数据库');
        } else {
          throw new Error(response.data.message || '保存评分失败');
        }
      } catch (error) {
        console.error('保存评分失败:', error);
        this.$message.error('保存评分失败: ' + (error.message || '未知错误'));
      }
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

.essay-grading-section {
  margin-top: 10px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.ai-grade-result {
  margin-top: 8px;
  padding: 8px;
  background-color: #f8f8f8;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.grade-label {
  font-weight: bold;
  margin-right: 8px;
}

.grade-score {
  color: #E6A23C;
  font-size: 16px;
  font-weight: bold;
  margin-right: 15px;
}

.grading-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.manual-grade-result {
  margin-top: 8px;
  padding: 8px;
  background-color: #ecf5ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.manual-grading-dialog {
  padding: 10px;
}

.question-info {
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 10px;
}

.info-label {
  font-weight: bold;
  margin-right: 8px;
  color: #606266;
}

.info-content {
  margin-top: 5px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  white-space: pre-wrap;
}

.score-input {
  display: flex;
  align-items: center;
  margin-top: 15px;
}

.score-label {
  font-weight: bold;
  margin-right: 15px;
  color: #606266;
}

.fill-grading-section {
  margin-top: 10px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.fill-judgment {
  margin-top: 15px;
}

.judgment-label {
  margin-right: 10px;
  font-weight: bold;
}

.correct {
  color: #67C23A;
  font-weight: bold;
}

.incorrect {
  color: #F56C6C;
  font-weight: bold;
}
</style>
