<template>
  <div class="ai-analysis-container">
    <h1 class="system-title">AI错题分析</h1>
    
    <!-- 查询表单 -->
    <el-form :inline="true" class="query-form">
      <el-form-item label="考试ID">
        <el-input v-model="examId" placeholder="请输入考试ID" clearable></el-input>
      </el-form-item>
      <el-form-item label="最小错误次数">
        <el-input-number v-model="minErrorCount" :min="1" :max="100" :step="1"></el-input-number>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchWrongAnswersAnalysis" :loading="loading">
          <i class="el-icon-search"></i> 查询
        </el-button>
      </el-form-item>
    </el-form>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>
    
    <!-- 错误提示 -->
    <div v-else-if="error" class="error-state">
      <el-alert
        :title="error"
        type="error"
        :closable="false"
        show-icon
      ></el-alert>
    </div>
    
    <!-- 空数据提示 -->
    <div v-else-if="wrongAnswersAnalysis.length === 0" class="empty-state">
      <el-empty description="暂无错题分析数据"></el-empty>
    </div>
    
    <!-- 错题分析表格 -->
    <div v-else class="analysis-table-container">
      <h2>错题分析结果 (共 {{ wrongAnswersAnalysis.length }} 条记录)</h2>
      
      <!-- AI分析按钮 -->
      <div class="ai-analysis-button-container">
        <el-button 
          type="success" 
          icon="el-icon-s-opportunity" 
          :disabled="wrongAnswersAnalysis.length === 0"
          :loading="aiAnalysisLoading"
          @click="analyzeWithAI"
        >
          AI智能分析
        </el-button>
      </div>
      
      <!-- AI分析结果展示区域 -->
      <div v-if="aiAnalysisResult" class="ai-analysis-result">
        <el-card class="ai-result-card">
          <div slot="header" class="ai-result-header">
            <span><i class="el-icon-s-opportunity"></i> AI分析结果</span>
          </div>
          <div class="ai-result-content" style="white-space: pre-wrap;">{{ formattedAIResult }}</div>
        </el-card>
      </div>
      
      <el-table
        :data="wrongAnswersAnalysis"
        border
        stripe
        style="width: 100%"
        :default-sort="{prop: 'error_count', order: 'descending'}"
      >
        <el-table-column
          label="题号"
          width="120"
          align="center"
        >
          <template slot-scope="scope">
            <span class="question-type-badge" :class="getTypeClass(scope.row.chinese_number)">
              {{ scope.row.chinese_number }}.{{ scope.row.question_number }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="content"
          label="题目内容"
        ></el-table-column>
        
        <el-table-column
          prop="correct_answer"
          label="正确答案"
          width="120"
          align="center"
        ></el-table-column>
        
        <el-table-column
          prop="error_count"
          label="错误次数"
          width="120"
          align="center"
          sortable
        >
          <template slot-scope="scope">
            <el-tag type="danger">{{ scope.row.error_count }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { studentApi } from '../api/student';
import { aiApi } from '../api/ai';

export default {
  name: 'AIAnalysis',
  data() {
    return {
      examId: '',
      minErrorCount: 1,
      wrongAnswersAnalysis: [],
      loading: false,
      error: null,
      aiAnalysisLoading: false,
      aiAnalysisResult: null
    };
  },
  computed: {
    // 格式化AI分析结果，直接返回原始文本
    formattedAIResult() {
      if (!this.aiAnalysisResult) return '';
      return this.aiAnalysisResult;
    }
  },
  methods: {
    // 获取错题分析数据
    fetchWrongAnswersAnalysis() {
      if (!this.examId) {
        this.$message.warning('请输入考试ID');
        return;
      }
      
      this.loading = true;
      this.error = null;
      this.aiAnalysisResult = null; // 清空之前的AI分析结果
      
      studentApi.getWrongAnswersAnalysis(this.examId, this.minErrorCount)
        .then(response => {
          if (response.data.success) {
            this.wrongAnswersAnalysis = response.data.data;
            console.log('获取到的错题分析数据:', this.wrongAnswersAnalysis);
          } else {
            throw new Error(response.data.message || '获取错题分析数据失败');
          }
        })
        .catch(error => {
          console.error('获取错题分析数据失败:', error);
          this.error = error.message || '获取错题分析数据失败，请重试';
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 使用AI分析错题数据
    analyzeWithAI() {
      if (this.wrongAnswersAnalysis.length === 0) {
        this.$message.warning('没有错题数据可供分析');
        return;
      }
      
      this.aiAnalysisLoading = true;
      
      // 调用AI API进行分析
      aiApi.analyzeWrongAnswersWithDeepseekR1(this.wrongAnswersAnalysis)
        .then(result => {
          this.aiAnalysisResult = result;
          this.$message.success('AI分析完成');
        })
        .catch(error => {
          console.error('AI分析失败:', error);
          this.$message.error('AI分析失败: ' + (error.message || '未知错误'));
        })
        .finally(() => {
          this.aiAnalysisLoading = false;
        });
    },
    
    // 获取题目类型样式类
    getTypeClass(chineseNumber) {
      // 根据中文题号判断题型
      if (chineseNumber === '一') {
        return 'type-choice';
      } else if (chineseNumber === '二') {
        return 'type-fill';
      } else if (chineseNumber === '三') {
        return 'type-judgment';
      }
      return '';
    }
  }
};
</script>

<style scoped>
.ai-analysis-container {
  max-width: 1000px;
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
  margin-bottom: 20px;
}

.query-form {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.loading-state,
.error-state,
.empty-state {
  margin: 40px 0;
}

.analysis-table-container {
  margin-top: 20px;
}

.analysis-table-container h2 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 18px;
}

.question-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
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

.ai-analysis-button-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.ai-analysis-button-container .el-button {
  padding: 12px 25px;
  font-size: 16px;
}

.ai-analysis-result {
  margin: 20px 0;
}

.ai-result-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ai-result-header {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}

.ai-result-header i {
  margin-right: 8px;
}

.ai-result-content {
  line-height: 1.8;
  color: #303133;
  padding: 10px 0;
}

.ai-result-content h1,
.ai-result-content h2,
.ai-result-content h3 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #409EFF;
}

.ai-result-content ul,
.ai-result-content ol {
  padding-left: 20px;
  margin: 10px 0;
}

.ai-result-content p {
  margin: 10px 0;
}

.el-table .cell {
  word-break: break-word;
  line-height: 1.5;
}
</style>