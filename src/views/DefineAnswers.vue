<template>
  <div class="homework-system">
    <h1 class="system-title">多模态试卷自动勘误辅导系统</h1>
    
    <div class="answer-definition-section">
      <h2>请完成答案定义</h2>
      
      <!-- 题目类型列表 -->
      <div class="question-sections">
        <el-card v-for="(section, sectionIndex) in questionSections" :key="sectionIndex" class="question-section-card">
          <div class="section-header">
            <div class="section-type-badge" :class="getTypeClass(section.type)">
              {{ section.chineseNumber || getChineseNumber(sectionIndex + 1) }}、{{ getTypeName(section.type) }}
              <span class="section-score">
                <el-input-number 
                  v-model="section.score" 
                  :min="1" 
                  :max="100" 
                  size="mini" 
                  :disabled="answersSaved"
                  @change="updateSectionScore"
                  class="score-input"
                ></el-input-number> 分
              </span>
            </div>
            
            <div class="questions-container">
              <div v-for="(question, qIndex) in section.questions" :key="qIndex" class="question-item">
                {{ section.startNum + qIndex }}. 
                <el-input 
                  v-model="question.answer" 
                  :placeholder="getPlaceholder(section.type)" 
                  class="answer-input"
                  size="small"
                  :class="{'judgment-input': section.type === 'judgment'}"
                  :disabled="answersSaved"
                  v-if="section.type !== 'essay'"
                ></el-input>
                
                <el-input 
                  v-if="section.type === 'essay'" 
                  v-model="question.answer" 
                  :placeholder="getPlaceholder(section.type)" 
                  type="textarea"
                  :rows="5"
                  resize="none"
                  class="essay-input"
                  :disabled="answersSaved"
                ></el-input>
                
                <el-select 
                  v-if="section.type === 'judgment'" 
                  v-model="question.answer" 
                  placeholder="" 
                  size="small"
                  class="judgment-select"
                  :disabled="answersSaved"
                >
                  <el-option label="对" value="对"></el-option>
                  <el-option label="错" value="错"></el-option>
                </el-select>
                
                <el-button 
                  type="text" 
                  icon="el-icon-minus" 
                  @click="deleteQuestion(section, qIndex)"
                  class="delete-question-btn"
                  v-if="section.questions.length > 1 && qIndex === section.questions.length - 1 && !answersSaved"
                ></el-button>
              </div>
              
              <div class="add-question" v-if="!answersSaved">
                <el-button 
                  type="text" 
                  icon="el-icon-plus" 
                  @click="addQuestion(section)"
                  class="add-question-btn"
                ></el-button>
              </div>
            </div>
            
            <div class="section-footer">
              <el-button 
                type="text" 
                icon="el-icon-delete" 
                @click="deleteSection(sectionIndex)"
                class="delete-section-btn"
                v-if="!answersSaved"
              ></el-button>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 添加新题目类型 -->
      <div class="add-section-container" v-if="!answersSaved">
        <el-card class="add-section-card" shadow="hover" @click.native="showAddSectionDialog">
          <div class="add-section-header">
            <i class="el-icon-plus add-section-icon"></i>
            <span class="add-section-text">添加新题型</span>
          </div>
        </el-card>
      </div>
      
      <!-- 自动填充提示 -->
      <div class="auto-fill-tip" v-if="!answersSaved">
        <el-button type="text" size="small" @click="showUploadDialog">自己填太慢? 试试上传扫描件让AI生成答案</el-button>
      </div>
      
      <!-- 上传扫描件对话框 -->
      <el-dialog title="上传试卷扫描件" :visible.sync="uploadDialogVisible" width="40%">
        <div class="upload-container">
          <el-upload
            class="upload-area"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            multiple
            list-type="picture-card"
            :limit="10">
            <i class="el-icon-plus"></i>
            <div slot="tip" class="el-upload__tip">支持上传jpg/png格式的图片，每张不超过5MB</div>
          </el-upload>
        </div>
        
        <span slot="footer" class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="applyUpload">应用</el-button>
        </span>
      </el-dialog>
      
      <!-- 保存按钮 -->
      <div class="save-button-container" v-if="!answersSaved && questionSections.length > 0">
        <el-button type="primary" @click="saveAnswers" :loading="saving" class="save-button">保存答案</el-button>
      </div>
      
      <!-- 保存成功提示 -->
      <div class="save-success-tip" v-if="answersSaved">
        <el-alert
          title="答案已保存成功！"
          type="success"
          :closable="false"
          show-icon
        >
          <template slot="title">
            答案已保存成功！答案栏目已固定，不可再修改。
          </template>
        </el-alert>
      </div>
    </div>
    
    <!-- 添加题目类型对话框 -->
    <el-dialog title="请完成答案定义" :visible.sync="addSectionDialogVisible" width="30%">
      <el-form :model="newSection" label-width="100px">
        <el-form-item label="题目类型:">
          <el-radio-group v-model="newSection.type">
            <el-radio label="choice">选择题</el-radio>
            <el-radio label="fill">填空题</el-radio>
            <el-radio label="judgment">判断题</el-radio>
            <el-radio label="essay">解答题</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="中文题号:">
          <el-select v-model="newSection.chineseNumber" placeholder="请选择中文题号">
            <el-option
              v-for="num in availableChineseNumbers"
              :key="num"
              :label="num"
              :value="num">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="起始题号:">
          <el-input-number v-model="newSection.startNum" :min="1" :max="100"></el-input-number>
        </el-form-item>
        
        <el-form-item label="每题分值:">
          <el-input-number v-model="newSection.score" :min="1" :max="100"></el-input-number>
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="addSectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSection">完成</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { examApi } from '../api/exam';

export default {
  name: 'DefineAnswers',
  computed: {
    // 计算可用的中文题号列表
    availableChineseNumbers() {
      const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];
      
      // 如果没有已存在的题型，则返回所有可用的中文题号
      if (this.questionSections.length === 0) {
        return chineseNumbers;
      }
      
      // 获取当前最大的中文题号
      let maxIndex = 0;
      this.questionSections.forEach(section => {
        if (section.chineseNumber) {
          const index = this.getNumberFromChinese(section.chineseNumber);
          maxIndex = Math.max(maxIndex, index);
        }
      });
      
      // 返回大于等于当前最大中文题号的所有中文题号
      return chineseNumbers.slice(maxIndex);
    }
  },
  data() {
    return {
      questionSections: [],
      addSectionDialogVisible: false,
      uploadDialogVisible: false,
      fileList: [],
      newSection: {
        type: 'choice',
        startNum: 1,
        score: 3,
        chineseNumber: '一', // 添加中文题号字段
        questions: []
      },
      saving: false,
      answersSaved: false,
      currentExamId: null // 将从路由参数获取
    }
  },
  methods: {
    getChineseNumber(num) {
      const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
      if (num <= 0 || num > 99) return num
      if (num <= 10) return chineseNumbers[num - 1]
      
      const tens = Math.floor(num / 10)
      const ones = num % 10
      
      if (tens === 1) {
        return ones === 0 ? '十' : `十${chineseNumbers[ones - 1]}`
      }
      
      return ones === 0 
        ? `${chineseNumbers[tens - 1]}十`
        : `${chineseNumbers[tens - 1]}十${chineseNumbers[ones - 1]}`
    },
    getTypeName(type) {
      const typeMap = {
        'choice': '选择题',
        'fill': '填空题',
        'judgment': '判断题',
        'essay': '解答题'
      }
      return typeMap[type] || '未知题型'
    },
    getTypeClass(type) {
      return `type-${type}`
    },
    getPlaceholder(type) {
      const placeholderMap = {
        'choice': '请输入选项',
        'fill': '请输入答案',
        'judgment': '请选择',
        'essay': '请输入解答'
      }
      return placeholderMap[type] || ''
    },
    showAddSectionDialog() {
      // 计算推荐的中文题号（默认为上一个题型的中文题号加一）
      let recommendedChineseNumber = '一';
      if (this.questionSections.length > 0) {
        const lastSection = this.questionSections[this.questionSections.length - 1];
        if (lastSection.chineseNumber) {
          // 获取上一个题型的中文题号对应的数字
          const lastIndex = this.getNumberFromChinese(lastSection.chineseNumber);
          // 推荐的中文题号为上一个加一
          recommendedChineseNumber = this.getChineseNumber(lastIndex + 1);
        }
      }
      
      this.newSection = {
        type: 'choice',
        startNum: 1,
        score: 3,
        chineseNumber: recommendedChineseNumber,
        questions: []
      }
      this.addSectionDialogVisible = true
    },
    addSection() {
      // 创建新的题目类型区域
      const newSection = {
        type: this.newSection.type,
        startNum: this.newSection.startNum,
        score: this.newSection.score,
        chineseNumber: this.newSection.chineseNumber, // 保存用户设置的中文题号
        questions: [] // 先不添加默认题目
      }
      
      // 根据起始题号添加对应数量的题目
      for (let i = 0; i < 1; i++) { // 默认添加1个题目
        newSection.questions.push({ answer: '' });
      }
      
      this.questionSections.push(newSection);
      this.addSectionDialogVisible = false;
    },
    addQuestion(section) {
      section.questions.push({ answer: '' })
    },
    deleteSection(index) {
      this.$confirm('确定要删除这个答案栏吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.questionSections.splice(index, 1)
        this.$message({
          type: 'success',
          message: '删除成功!'
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })          
      })
    },
    deleteQuestion(section, index) {
      if (section.questions.length > 1) {
        section.questions.splice(index, 1)
      }
    },
    // 保存答案到后端
    saveAnswers() {
      // 验证所有答案是否已填写
      let hasEmptyAnswer = false;
      this.questionSections.forEach(section => {
        section.questions.forEach(question => {
          if (!question.answer) {
            hasEmptyAnswer = true;
          }
        });
      });
      
      if (hasEmptyAnswer) {
        this.$confirm('有题目答案未填写，确定要保存吗?', '提示', {
          confirmButtonText: '确定保存',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.submitAnswers();
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '已取消保存'
          });
        });
      } else {
        this.submitAnswers();
      }
    },
    // 提交答案到后端
    submitAnswers() {
      this.saving = true;
      
      // 重新从路由获取examId，确保使用最新值
      const routeExamId = this.$route.params.examId;
      console.log('提交答案 - 路由中的examId:', routeExamId);
      
      // 如果currentExamId为空，尝试使用路由参数
      if (!this.currentExamId && routeExamId) {
        console.log('currentExamId为空，使用路由参数');
        this.currentExamId = !isNaN(parseInt(routeExamId, 10)) ? parseInt(routeExamId, 10) : routeExamId;
      }
      
      // 检查examId是否存在，如果不存在则显示错误信息
      if (!this.currentExamId) {
        this.$message({
          type: 'error',
          message: '无效的考试ID，无法保存答案'
        });
        this.saving = false;
        return;
      }
      
      // 确保每个题型区域都有中文题号
      this.questionSections.forEach((section, index) => {
        // 如果没有设置中文题号，则使用默认的计算方法
        if (!section.chineseNumber) {
          section.chineseNumber = this.getChineseNumber(index + 1);
        }
        
        // 确保每个题目都有content字段，即使为空
        section.questions.forEach(question => {
          if (!question.content) {
            question.content = null;
          }
        });
      });
      
      // 添加更多日志输出，查看examId的值和类型
      console.log('保存答案 - 使用的examId:', this.currentExamId);
      console.log('保存答案 - examId类型:', typeof this.currentExamId);
      console.log('保存答案 - 路由参数:', this.$route.params);
      console.log('保存答案 - 包含中文题号的题型:', this.questionSections);
      
      examApi.saveAnswers(this.currentExamId, this.questionSections)
        .then(response => {
          if (response.data.success) {
            this.answersSaved = true;
            this.$message({
              type: 'success',
              message: '答案保存成功！'
            });
          } else {
            this.$message({
              type: 'error',
              message: response.data.message || '保存失败，请重试'
            });
          }
        })
        .catch(error => {
          console.error('保存答案失败:', error);
          this.$message({
            type: 'error',
            message: '保存失败，请重试'
          });
        })
        .finally(() => {
          this.saving = false;
        });
    },
  
    // 显示上传对话框
    showUploadDialog() {
      this.uploadDialogVisible = true;
      this.fileList = [];
    },
    
    // 处理文件变更
    handleFileChange(file, fileList) {
      // 验证文件类型
      const isJPG = file.raw.type === 'image/jpeg';
      const isPNG = file.raw.type === 'image/png';
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isJPG && !isPNG) {
        this.$message.error('上传图片只能是 JPG 或 PNG 格式!');
        this.fileList = fileList.filter(f => f.uid !== file.uid);
        return false;
      }
      
      if (!isLt5M) {
        this.$message.error('上传图片大小不能超过 5MB!');
        this.fileList = fileList.filter(f => f.uid !== file.uid);
        return false;
      }
      
      this.fileList = fileList;
      return true;
    },
    
    // 处理文件移除
    handleFileRemove(file, fileList) {
      this.fileList = fileList;
    },
    
    // 应用上传的图片
    applyUpload() {
      if (this.fileList.length === 0) {
        this.$message.warning('请先上传答案扫描件');
        return;
      }
      
      // 显示加载中提示
      const loadingInstance = this.$loading({
        lock: true,
        text: 'AI正在处理图片，请稍候...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      // 获取上传的图片文件
      const imageFiles = this.fileList.map(file => file.raw);
      
      // 导入AI API
      import('@/api/ai').then(({ aiApi }) => {
        // 调用AI处理图片
        aiApi.processImagesWithAI(imageFiles)
          .then(result => {
            // 关闭对话框
            this.uploadDialogVisible = false;
            
            // 处理AI返回的结果
            console.log('AI识别原始结果:', result.originalRecognition);
            console.log('AI优化后结果:', result.optimizedResult);
            
            // 解析AI返回的结果并填充到表单
            try {
              // 获取AI返回的结果
              const aiResult = result.optimizedResult;
              console.log('正在处理AI返回结果:', aiResult);
              
              // 分割成行并过滤空行
              const lines = aiResult.split('\n').filter(line => line.trim() !== '');
              
              // 识别题型部分
              let currentType = null;
              let currentSectionIndex = -1; // 初始化题型索引
              let currentScore = 3; // 默认分数
              let tempAnswers = [];
              let lastSectionType = null; // 记录上一个题型
              let chineseNum = ''; // 初始化中文题号变量
              
              // 清空现有题型，全部重新创建
              if (!this.answersSaved) {
                console.log('清空现有题型，重新创建');
                this.questionSections = [];
              } else {
                console.log('答案已保存，不能修改题型');
                this.$message.warning('答案已保存，不能再修改');
                return;
              }
              
              // 正则表达式模式 - 改进中文题号匹配
              const sectionPattern = /^([一二三四五六七八九十]{1,3})?[、.：:]?\s*(选择题|填空题|判断题|解答题)(?:[:：])?(?:\s*[（(（]\s*(?:每小题|每题)?\s*(\d+)\s*分.*?[）)）])?/;
              // 添加负向后顾断言(?<!\.)，确保不匹配小数点后的数字
              const answerPattern = /^\s*(?<!\.)(\d+)[.．、:：]\s*(.+)/;
              // 不再使用这个正则表达式，保留但不修改
              const multiAnswersPattern = /(\d+)[.．、:：]\s*([^,，;；]+)[,，;；]?/g; // 用于解析逗号分隔的多个答案
              
              // 首先，按题型分割文本
              // 使用正则表达式匹配题型标题行
              const sectionRegex = new RegExp(sectionPattern, 'gm');
              let sectionMatch;
              let lastIndex = 0;
              let sections = [];
              
              // 查找所有题型标题
              while ((sectionMatch = sectionRegex.exec(aiResult)) !== null) {
                const matchIndex = sectionMatch.index;
                // 如果不是第一个匹配，将上一个匹配到当前匹配之间的内容作为一个部分
                if (lastIndex > 0) {
                  sections.push({
                    text: aiResult.substring(lastIndex, matchIndex),
                    type: currentType,
                    chineseNum: chineseNum,
                    score: currentScore
                  });
                }
                
                // 解析中文序号（可能为空）
                chineseNum = sectionMatch[1] || '';
                // 获取题型
                const questionType = sectionMatch[2];
                // 获取分数（如果有）
                const score = sectionMatch[3] ? parseInt(sectionMatch[3], 10) : 3;
                console.log(`识别到题型: ${questionType}, 分数: ${score}, 中文题号: ${chineseNum}`);
                
                // 确定题型代码
                if (questionType.includes('选择')) {
                  currentType = 'choice';
                } else if (questionType.includes('填空')) {
                  currentType = 'fill';
                } else if (questionType.includes('判断')) {
                  currentType = 'judgment';
                } else if (questionType.includes('解答')) {
                  currentType = 'essay';
                } else {
                  currentType = null;
                }
                
                // 确保分数是有效的数字
                if (typeof score === 'number' && !isNaN(score) && score > 0) {
                  currentScore = score;
                } else {
                  currentScore = 3;
                }
                
                lastIndex = matchIndex + sectionMatch[0].length;
              }
              
              // 添加最后一个部分
              if (lastIndex < aiResult.length && currentType) {
                sections.push({
                  text: aiResult.substring(lastIndex),
                  type: currentType,
                  chineseNum: chineseNum,
                  score: currentScore
                });
              }
              
              console.log(`识别到 ${sections.length} 个题型区域`);
              
              // 处理每个题型区域
              for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                if (!section.type) continue;
                
                console.log(`处理题型区域 ${i+1}: ${this.getTypeName(section.type)}, 中文题号: ${section.chineseNum}`);
                
                // 为每个题型创建一个新的答案数组
                tempAnswers = [];
                
                // 使用改进后的方法处理整个文本块，而不是按行处理
                this.parseCommaSeparatedAnswers(section.text, tempAnswers);
                
                // 如果找到答案，处理它们
                if (tempAnswers.length > 0) {
                  // 获取最小题号作为起始题号
                  const startNum = Math.min(...tempAnswers.map(a => a.num));
                  // 处理答案
                  this.processAnswers(section.type, startNum, section.score, tempAnswers, section.chineseNum);
                  console.log(`为题型 ${this.getTypeName(section.type)} 创建了 ${tempAnswers.length} 个答案`);
                }
              }
              
              // 处理最后一组答案
              if (currentType && tempAnswers.length > 0) {
                // 获取最小题号作为起始题号
                const startNum = tempAnswers.length > 0 ? Math.min(...tempAnswers.map(a => a.num)) : 1;
                // 传递最后一个题型的中文题号
                this.processAnswers(currentType, startNum, currentScore, tempAnswers, chineseNum);
              }
              
              // 添加创建的题型和题目数量的调试日志
              console.log('处理完成! 创建的题型数量:', this.questionSections.length);
              let totalQuestions = 0;
              this.questionSections.forEach((section, idx) => {
                console.log(`题型${idx + 1}: ${this.getTypeName(section.type)}, 起始题号: ${section.startNum}, 题目数量: ${section.questions.length}`);
                totalQuestions += section.questions.length;
              });
              console.log(`总共创建了 ${totalQuestions} 个答案框`);
              
              if (this.questionSections.length === 0) {
                this.$message.warning('没有识别到任何题型或答案，请检查扫描件或手动添加');
              } else {
                this.$message.success(`已自动填充识别结果，创建了 ${totalQuestions} 个答案框，请检查并修改`);
              }
            } catch (error) {
              console.error('解析AI结果失败:', error);
              this.$message.warning('无法自动填充答案，请手动输入');
            }
            
            // 显示成功消息
            this.$message.success('AI识别完成，请检查并修改识别结果');
          })
          .catch(error => {
            console.error('AI处理失败:', error);
            this.$message.error('AI处理失败，请重试');
          })
          .finally(() => {
            // 关闭加载提示
            loadingInstance.close();
          });
      });
    },
    
    // 从后端加载已保存的答案
    loadSavedAnswers() {
      examApi.getAnswers(this.currentExamId)
        .then(response => {
          if (response.data.success && response.data.data && response.data.data.length > 0) {
            // 已有保存的答案，设置为已保存状态
            this.answersSaved = true;
            
            // 处理返回的答案数据，重建questionSections
            const answers = response.data.data;
            const sectionMap = new Map();
            
            answers.forEach(answer => {
              const sectionIndex = answer.section_index - 1;
              const questionNumber = answer.question_number;
              
              if (!sectionMap.has(sectionIndex)) {
                sectionMap.set(sectionIndex, {
                  type: answer.section_type,
                  startNum: questionNumber, // 暂时设置，后面会更新
                  score: answer.score,
                  questions: []
                });
              }
              
              const section = sectionMap.get(sectionIndex);
              // 更新起始题号（取最小值）
              section.startNum = Math.min(section.startNum, questionNumber);
              
              // 添加问题
              const questionIndex = questionNumber - section.startNum;
              while (section.questions.length <= questionIndex) {
                section.questions.push({ answer: '' });
              }
              section.questions[questionIndex].answer = answer.answer;
            });
            
            // 转换Map为数组
            this.questionSections = Array.from(sectionMap.values());
          }
        })
        .catch(error => {
          console.error('加载答案失败:', error);
        });
    },
  
    created() {
      // 从路由参数获取考试ID
      const examIdParam = this.$route.params.examId;
      console.log('路由参数 examId:', examIdParam);
      console.log('路由参数完整对象:', this.$route.params);
      
      // 尝试转换为数字，但保留原始字符串以防转换失败
      let parsedId = parseInt(examIdParam, 10);
      this.currentExamId = !isNaN(parsedId) ? parsedId : examIdParam;
      
      console.log('处理后的 currentExamId:', this.currentExamId);
      console.log('currentExamId 类型:', typeof this.currentExamId);
      
      if (!this.currentExamId) {
        this.$message({
          type: 'error',
          message: '无效的考试ID，请返回重试'
        });
        return;
      }
      
      // 页面创建时加载已保存的答案
      this.loadSavedAnswers();
    },
    
    // 处理包含逗号分隔的多个答案的行
    parseCommaSeparatedAnswers(line, tempAnswers) {
      console.log('处理答案行:', line);
      
      // 修改正则表达式，使用前瞻断言确保只在下一个题号前停止匹配
      // 使用\b边界匹配和负向后顾断言(?<!\.)，确保不匹配小数点后的数字
      const multiAnswersPattern = /(?:^|\s)(?<!\.)(\d+)[.．、:：]\s*([^]*?)(?=\s*(?:^|\s)(?<!\.)\d+[.．、:：]|$|\s*,\s*(?:^|\s)(?<!\.)\d+[.．、:：])/g;
      let match;
      let hasMatches = false;
      
      // 尝试使用多答案模式匹配
      while ((match = multiAnswersPattern.exec(line)) !== null) {
        hasMatches = true;
        const num = parseInt(match[1], 10);
        // 移除答案末尾的逗号、句号等标点符号
        let answer = match[2].trim();
        answer = answer.replace(/[,，。.;；]+$/, '');
        
        console.log(`  多答案匹配: 题号=${num}, 答案="${answer}"`);
        tempAnswers.push({ num, answer });
      }
      
      // 如果多答案模式没有匹配成功，尝试使用单答案模式
      if (!hasMatches) {
        // 使用更精确的正则表达式，严格匹配数字题号
        // 这个模式会匹配数字题号，然后捕获所有内容直到下一个数字题号或行尾
        // 增加前置边界条件，确保只匹配行首或空白字符后的数字作为题号
        const answerPattern = /(?:^|\s)(\d+)[.．、:：]\s*([^]*?)(?=\s+(?:^|\s)\d+[.．、:：]|$)/g;
        
        // 重置正则表达式
        answerPattern.lastIndex = 0;
        
        while ((match = answerPattern.exec(line)) !== null) {
          hasMatches = true;
          const num = parseInt(match[1], 10);
          // 移除答案末尾的逗号、句号等标点符号，但保留答案内部的逗号
          let answer = match[2].trim();
          answer = answer.replace(/[,，。.;；]+$/, '');
          
          console.log(`  严格匹配答案: 题号=${num}, 答案="${answer}"`);
          tempAnswers.push({ num, answer });
        }
      }
      
      return hasMatches;
    },
    
    // 处理答案并创建或更新题型区域
    processAnswers(type, startNum, score, answers, chineseNum) {
      if (!answers || answers.length === 0) return;
      
      // 确保分数是有效的数字，如果不是则使用默认值3
      const validScore = (typeof score === 'number' && !isNaN(score) && score > 0) ? score : 3;
      
      console.log(`处理答案: 类型=${type}, 起始题号=${startNum}, 分数=${validScore}, 答案数量=${answers.length}, 中文题号=${chineseNum || '未指定'}`);
      
      // 在处理前先对答案按题号排序
      answers.sort((a, b) => a.num - b.num);
      
      // 获取最小题号作为起始题号
      const actualStartNum = Math.min(...answers.map(a => a.num));
      console.log(`实际起始题号: ${actualStartNum}`);
      
      // 更新起始题号
      startNum = actualStartNum;      

      // 检查是否已存在相同的题型区域
      let targetSection = this.questionSections.find(section => 
        section.type === type && 
        section.chineseNumber === (chineseNum || '')
      );

      // 如果不存在相同的题型区域，则创建新的
      if (!targetSection) {
        targetSection = {
          type: type,
          startNum: startNum,
          score: validScore, // 使用验证后的分数
          chineseNumber: chineseNum || '', // 设置中文题号，如果没有则为空字符串
          questions: []
        };
        console.log(`创建题型区域，设置中文题号: ${chineseNum || '未指定'}`);
        this.questionSections.push(targetSection);
      }
      console.log(`创建新题型区域: ${type}, 起始题号: ${startNum}`);
      
      
      // 清空所有已有题目并重建
      // 这样可以确保每个题号都有单独的答案框
      targetSection.questions = [];
      
      // 计算需要的题目数量
      const maxQuestionNum = Math.max(...answers.map(a => a.num));
      const numQuestions = maxQuestionNum - startNum + 1;
      
      // 先创建足够的空题目
      for (let i = 0; i < numQuestions; i++) {
        targetSection.questions.push({ answer: '' });
      }
      
      console.log(`创建了 ${numQuestions} 个空题目`);
      
      // 然后填入答案
      answers.forEach(({ num, answer }) => {
        const questionIndex = num - targetSection.startNum;
        console.log(`设置答案: 题号=${num}, 索引=${questionIndex}, 答案="${answer}"`);
        
        // 确保索引有效
        if (questionIndex >= 0 && questionIndex < targetSection.questions.length) {
          targetSection.questions[questionIndex].answer = answer;
        } else {
          console.warn(`题号 ${num} 超出范围，无法设置答案`);
        }
      });
      
      console.log(`处理后题目数量: ${targetSection.questions.length}`);
    },
    // 处理分数修改
    updateSectionScore(value) {
      console.log(`分数已更新为: ${value}`);
      // 如果需要，可以在这里添加额外的逻辑，比如重新计算总分等
    },
    
    // 将中文数字转换为阿拉伯数字
    getNumberFromChinese(chineseNumber) {
      const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      const index = chineseNumbers.indexOf(chineseNumber);
      if (index !== -1) {
        return index + 1; // 返回对应的阿拉伯数字
      }
      
      // 处理十几、几十、几十几的情况
      if (chineseNumber.includes('十')) {
        if (chineseNumber === '十') {
          return 10;
        }
        
        let result = 0;
        if (chineseNumber.startsWith('十')) {
          // 十几
          result = 10;
          const ones = chineseNumber.substring(1);
          if (ones) {
            result += chineseNumbers.indexOf(ones) + 1;
          }
        } else {
          // 几十或几十几
          const tens = chineseNumber.split('十')[0];
          result = (chineseNumbers.indexOf(tens) + 1) * 10;
          
          const ones = chineseNumber.split('十')[1];
          if (ones) {
            result += chineseNumbers.indexOf(ones) + 1;
          }
        }
        return result;
      }
      
      return 1; // 默认返回1
    },
  }
};
</script>

<style scoped>
.homework-system {
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

.answer-definition-section {
  margin-top: 20px;
}

.question-sections {
  margin-bottom: 20px;
}

.question-section-card {
  margin-bottom: 15px;
}

.section-header {
  display: flex;
  flex-direction: column;
}

.section-type-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 15px 5px 10px;
  border-radius: 15px;
  color: white;
  margin-bottom: 10px;
  position: relative;
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
  display: flex;
  align-items: center;
  margin-left: auto;
  padding-left: 20px;
  position: relative;
  z-index: 10;
}

.score-input {
  width: 80px;
  margin: 0 5px 0 10px;
}

.questions-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.question-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
  margin-bottom: 10px;
  position: relative;
}

.answer-input {
  width: 80px;
  margin-left: 5px;
}

.judgment-input {
  display: none;
}

.judgment-select {
  width: 80px;
  margin-left: 5px;
}

.essay-input {
  width: 700px;
  margin-left: 5px;
  height: 120px;
}

.add-question {
  margin-left: 10px;
}

.add-question-btn {
  border: 1px dashed #ccc;
  border-radius: 50%;
  padding: 5px;
}

.add-section-container {
  margin-top: 20px;
}

.add-section-card {
  border: 1px dashed #ccc;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-section-card:hover {
  border-color: #409EFF;
  background-color: #f5f7fa;
}

.add-section-header {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;
}

.add-section-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.add-section-text {
  font-size: 14px;
}

.section-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.delete-question-btn {
  position: absolute;
  right: -20px;
  color: #F56C6C;
}

.delete-section-btn {
  color: #F56C6C;
}

.auto-fill-tip {
  margin-top: 15px;
  text-align: left;
}

/* 保存按钮样式 */
.save-button-container {
  margin-top: 30px;
  text-align: center;
}

.save-button {
  padding: 12px 30px;
  font-size: 16px;
}

/* 保存成功提示样式 */
.save-success-tip {
  margin-top: 20px;
}

.auto-fill-tip .el-button {
  color: white;
  background-color: #409EFF;
  padding: 8px 15px;
  border-radius: 4px;
  transition: all 0.3s;
}

.auto-fill-tip .el-button:active {
  background-color: #3080cc; 
}

/* 上传区域样式 */
.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.upload-area {
  width: 100%;
  margin-bottom: 15px;
}

.el-upload__tip {
  color: #909399;
  font-size: 13px;
  margin-top: 10px;
  text-align: center;
}

.el-upload--picture-card {
  background-color: #fbfdff;
  border: 1px dashed #c0ccda;
  border-radius: 6px;
  box-sizing: border-box;
  width: 148px;
  height: 148px;
  cursor: pointer;
  line-height: 146px;
  vertical-align: top;
  transition: border-color 0.3s;
}

.el-upload--picture-card:hover {
  border-color: #409EFF;
}
</style>