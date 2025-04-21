<template>
  <div class="exam-content-container">
    <h1 class="system-title">多模态试卷自动批改系统</h1>
    
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
    
    <div v-else-if="!latestExam" class="empty-state">
      <el-empty description="暂无考试记录"></el-empty>
      <el-button type="primary" @click="createNewExam" class="create-exam-btn">创建新考试</el-button>
    </div>
    
    <div v-else class="answer-definition-section">
      <div class="exam-info">
        <h2>{{ latestExam.title || '考试名称' }}</h2>
        <p v-if="latestExam.description">{{ latestExam.description }}</p>
        <p class="exam-date">创建时间: {{ formatDate(latestExam.created_at) }}</p>
      </div>      
      
    <div class="student-info">
      <el-button icon="el-icon-back" size="small" @click="goBack">返回</el-button>
    </div>
      <!-- 题目类型列表 -->
      <div class="question-sections">
        <el-card v-for="(section, sectionIndex) in questionSections" :key="sectionIndex" class="question-section-card">
          <div class="section-header">
            <div class="section-type-badge" :class="getTypeClass(section.type)">
              {{ section.chineseNumber || getChineseNumber(sectionIndex + 1) }}、{{ getTypeName(section.type) }}
              <span class="section-score">{{ section.score }}分</span>
            </div>
            
            <div class="questions-container">
              <div v-for="(question, qIndex) in section.questions" :key="qIndex" class="question-item" :class="{'essay-question-item': section.type === 'essay'}">
                {{ section.startNum + qIndex }}. 
                <!-- 解答题使用多行文本框 -->
                <el-input 
                  v-if="section.type === 'essay'"
                  v-model="question.answer" 
                  :placeholder="getPlaceholder(section.type)" 
                  type="textarea"
                  :rows="4"
                  resize="none"
                  class="essay-input"
                  :disabled="!isEditing"
                ></el-input>
                
                <!-- 其他题型使用普通输入框 -->
                <el-input 
                  v-else-if="section.type !== 'judgment'"
                  v-model="question.answer" 
                  :placeholder="getPlaceholder(section.type)" 
                  class="answer-input"
                  size="small"
                  :disabled="!isEditing"
                ></el-input>
                
                <!-- 判断题使用下拉选择框 -->
                <el-select 
                  v-if="section.type === 'judgment'" 
                  v-model="question.answer" 
                  placeholder="" 
                  size="small"
                  class="judgment-select"
                  :disabled="!isEditing"
                >
                  <el-option label="对" value="对"></el-option>
                  <el-option label="错" value="错"></el-option>
                </el-select>
              </div>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button v-if="!isEditing" type="primary" @click="startEditing">编辑答案</el-button>
        <template v-else>
          <el-button type="success" @click="saveAnswers" :loading="saving">保存答案</el-button>
          <el-button @click="cancelEditing">取消</el-button>
        </template>
        
        <!-- 上传试卷按钮 -->
        <div class="upload-tip">
          <el-button type=“button” size="small" @click="showUploadDialog">上传源试卷图片以获得题目内容</el-button>
        </div>
      </div>
      
      <!-- 上传试卷对话框 -->
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
          <el-button type="primary" @click="processUpload">确定</el-button>
        </span>
      </el-dialog>
      
      <div class="upload-tip">
          <el-button type="button" size="small" @click="showStudentUploadDialog">批量上传学生试卷</el-button>
          <el-button type="primary" size="small" @click="updateExamStatistics">更新成绩</el-button>
      </div>

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

      <!-- 批量上传学生试卷对话框 -->
      <el-dialog title="批量上传学生试卷" :visible.sync="studentUploadDialogVisible" width="40%">
        <div class="upload-container">
          <el-upload
            class="upload-area"
            action="#"
            :auto-upload="false"
            :on-change="handleStudentFileChange"
            :on-remove="handleStudentFileRemove"
            :file-list="studentFileList"
            multiple
            list-type="picture-card"
            :limit="20">
            <i class="el-icon-plus"></i>
            <div slot="tip" class="el-upload__tip">支持上传jpg/png格式的图片，每张不超过5MB</div>
          </el-upload>
          
          <!-- 显示图片名前缀列表 -->
          <div v-if="studentFilePrefixes.length > 0" class="file-prefixes-container">
            <el-tag 
              v-for="(prefix, index) in studentFilePrefixes" 
              :key="index"
              size="small"
              class="file-prefix-tag">
              {{ prefix }}
            </el-tag>
          </div>
        </div>
        
        <span slot="footer" class="dialog-footer">
          <el-button @click="studentUploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="processStudentUpload">确定</el-button>
        </span>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { examApi } from '../api/exam';
import { aiApi } from '../api/ai';
import { studentApi } from '../api/student';

export default {
  name: 'ExamContent',
  data() {
    return {
      latestExam: null,
      questionSections: [],
      originalSections: [], // 用于存储原始数据，取消编辑时恢复
      loading: true,
      saving: false,
      error: null,
      isEditing: false,
      uploadDialogVisible: false, // 上传对话框可见性
      fileList: [], // 上传的文件列表
      studentUploadDialogVisible: false, // 学生试卷上传对话框可见性
      studentFileList: [], // 学生试卷文件列表
      studentFilePrefixes: [], // 学生试卷文件名前缀列表
      statisticsDialogVisible: false, // 统计信息对话框可见性
      statisticsLoading: false, // 统计信息加载状态
      examStatistics: { // 考试统计信息
        totalScore: 0,
        studentCount: 0,
        highestScore: 0,
        lowestScore: 0,
        averageScore: 0,
        highestScoreStudent: null
      },
      studentList: [], // 学生列表
      studentListLoading: false // 学生列表加载状态
    }
  },
  methods: {
    // 返回首页
    goBack() {
      this.$router.push('/');
    },
    // 显示上传对话框
    showUploadDialog() {
      this.uploadDialogVisible = true;
      this.fileList = [];
    },
    
    // 显示学生试卷上传对话框
    showStudentUploadDialog() {
      this.studentUploadDialogVisible = true;
      this.studentFileList = [];
      this.studentFilePrefixes = [];
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
    
    // 处理学生试卷文件变更
    handleStudentFileChange(file, fileList) {
      // 验证文件类型
      const isJPG = file.raw.type === 'image/jpeg';
      const isPNG = file.raw.type === 'image/png';
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isJPG && !isPNG) {
        this.$message.error('上传图片只能是 JPG 或 PNG 格式!');
        this.studentFileList = fileList.filter(f => f.uid !== file.uid);
        return false;
      }
      
      if (!isLt5M) {
        this.$message.error('上传图片大小不能超过 5MB!');
        this.studentFileList = fileList.filter(f => f.uid !== file.uid);
        return false;
      }
      
      this.studentFileList = fileList;
      
      // 更新文件名前缀列表
      this.updateFilePrefixes();
      
      return true;
    },
    
    // 处理学生试卷文件移除
    handleStudentFileRemove(file, fileList) {
      this.studentFileList = fileList;
      
      // 更新文件名前缀列表
      this.updateFilePrefixes();
    },
    
    // 更新文件名前缀列表
    updateFilePrefixes() {
      if (this.studentFileList.length === 0) {
        this.studentFilePrefixes = [];
        return;
      }
      
      // 提取所有文件名（不含扩展名）
      const fileNames = this.studentFileList.map(file => {
        const fileName = file.name;
        const dotIndex = fileName.lastIndexOf('.');
        return dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
      });
      
      // 分析文件名，提取学生姓名或试卷类型
      const nameMap = new Map();
      
      // 第一步：提取每个文件名中可能的学生姓名或试卷类型
      fileNames.forEach(fileName => {
        // 尝试匹配常见的模式
        // 1. 数字+学科+卷型 (如 23数学乙卷1)
        const subjectMatch = fileName.match(/^(\d+[^\d]+卷)[^\d]*\d*$/);
        if (subjectMatch) {
          const key = subjectMatch[1];
          if (!nameMap.has(key)) nameMap.set(key, []);
          nameMap.get(key).push(fileName);
          return;
        }
        
        // 2. 处理带数字后缀的名字 (如 林建华1, 林建华2)
        const nameWithNumberMatch = fileName.match(/^([^\d]+)(\d+)$/);
        if (nameWithNumberMatch) {
          const name = nameWithNumberMatch[1];
          if (!nameMap.has(name)) nameMap.set(name, []);
          nameMap.get(name).push(fileName);
          return;
        }
        
        // 3. 处理前缀+名字 (如 xx林建华, jj林建华)
        // 查找两个文件名之间的共同部分
        for (const otherName of fileNames) {
          if (fileName === otherName) continue;
          
          // 寻找最长公共子串
          const commonPart = this.findLongestCommonSubstring(fileName, otherName);
          if (commonPart && commonPart.length >= 2) { // 至少2个字符才认为是有效的名字
            if (!nameMap.has(commonPart)) nameMap.set(commonPart, []);
            if (!nameMap.get(commonPart).includes(fileName)) {
              nameMap.get(commonPart).push(fileName);
            }
            break;
          }
        }
        
        // 4. 如果没有匹配到任何模式，使用整个文件名
        if (!Array.from(nameMap.values()).some(arr => arr.includes(fileName))) {
          if (!nameMap.has(fileName)) nameMap.set(fileName, []);
          nameMap.get(fileName).push(fileName);
        }
      });
      
      // 转换为数组并按照上传顺序排列（不进行排序）
      this.studentFilePrefixes = Array.from(nameMap.keys());
      
      // 添加前缀提示
      if (this.studentFilePrefixes.length > 0) {
        this.studentFilePrefixes = ['上传的学生有：', ...this.studentFilePrefixes];
      }
    },
    
    // 查找两个字符串的最长公共子串
    findLongestCommonSubstring(str1, str2) {
      if (!str1 || !str2) return '';
      
      let longest = '';
      let matrix = Array(str1.length + 1).fill().map(() => Array(str2.length + 1).fill(0));
      
      // 填充矩阵
      for (let i = 1; i <= str1.length; i++) {
        for (let j = 1; j <= str2.length; j++) {
          if (str1[i-1] === str2[j-1]) {
            matrix[i][j] = matrix[i-1][j-1] + 1;
            if (matrix[i][j] > longest.length) {
              longest = str1.substring(i - matrix[i][j], i);
            }
          }
        }
      }
      
      return longest;
    },
    
    // 处理学生试卷上传
    processStudentUpload() {
      if (this.studentFileList.length === 0) {
        this.$message.warning('请先上传学生试卷');
        return;
      }
      
      // 显示加载中提示
      const loadingInstance = this.$loading({
        lock: true,
        text: 'AI正在处理学生试卷，请稍候...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      // 按学生名字分组处理图片
      this.processStudentImagesByGroup()
        .then(() => {
          // 显示成功消息
          this.$message.success(`已成功处理 ${this.studentFileList.length} 张学生试卷图片，共 ${this.studentFilePrefixes.length - 1} 名学生`);
          
          // 关闭对话框
          this.studentUploadDialogVisible = false;
          loadingInstance.close();
        })
        .catch(error => {
          console.error('处理学生试卷失败:', error);
          this.$message.error('处理学生试卷失败，请重试');
          loadingInstance.close();
        });
    },
    
    // 按学生名字分组处理图片
    processStudentImagesByGroup() {
      return new Promise(async (resolve, reject) => {
        try {
          // 获取学生名字列表（去掉提示文本）
          const studentNames = this.studentFilePrefixes.filter(prefix => prefix !== '上传的学生有：');
          
          // 创建学生名字到文件的映射
          const studentFilesMap = new Map();
          
          // 遍历所有文件，按学生名字分组
          this.studentFileList.forEach(file => {
            const fileName = file.name;
            const dotIndex = fileName.lastIndexOf('.');
            const fileNameWithoutExt = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
            
            // 查找该文件属于哪个学生
            for (const studentName of studentNames) {
              if (fileNameWithoutExt.includes(studentName) || studentName.includes(fileNameWithoutExt)) {
                if (!studentFilesMap.has(studentName)) {
                  studentFilesMap.set(studentName, []);
                }
                studentFilesMap.get(studentName).push(file.raw);
                break;
              }
            }
          });
          
          console.log('学生试卷分组情况:', Array.from(studentFilesMap.entries()).map(([name, files]) => `${name}: ${files.length}张图片`));
          
          // 依次处理每个学生的图片
          for (const [studentName, imageFiles] of studentFilesMap.entries()) {
            console.log(`正在处理学生 ${studentName} 的试卷，共 ${imageFiles.length} 张图片...`);
            
            // 调用专门处理学生试卷的doubao模型
            const result = await aiApi.processStudentPaperWithDoubao(imageFiles);
            
            // 在控制台打印结果
            console.log(`学生 ${studentName} 的试卷处理结果:`, result.originalRecognition);
            
            // 解析学生答案
            const studentAnswers = this.parseStudentAnswers(result.originalRecognition);
            console.log(`解析后的学生答案:`, studentAnswers);
            
            // 如果有答案，进行批改并保存到数据库
            if (studentAnswers.length > 0) {
              try {
                // 获取标准答案
                const standardAnswers = this.getStandardAnswers();
                
                // 使用AI批改学生试卷
                const batchGradeData = {
                  standardAnswers,
                  studentAnswers
                };
                
                // 调用批量批改接口
                const gradeResults = await aiApi.batchGradeStudentPaper(batchGradeData);
                console.log(`学生 ${studentName} 的批改结果:`, gradeResults);
                
                // 生成学生ID（使用学生名字作为临时ID）
                const studentId = this.generateStudentId(studentName);
                
                // 保存学生答案和批改结果
                const saveResult = await this.saveStudentAnswersWithGrades(this.latestExam.id, studentId, studentName, gradeResults);
                console.log(`学生 ${studentName} 的答案和批改结果保存结果:`, saveResult);
              } catch (error) {
                console.error(`批改和保存学生 ${studentName} 的答案失败:`, error);
              }
            }
          }
          
          resolve();
        } catch (error) {
          console.error('按学生分组处理图片失败:', error);
          reject(error);
        }
      });
    },
    
    // 获取标准答案
    getStandardAnswers() {
      const standardAnswers = [];
      
      // 遍历所有题型区域
      this.questionSections.forEach((section, sectionIndex) => {
        const chineseNumber = section.chineseNumber || this.getChineseNumber(sectionIndex + 1);
        
        // 遍历该区域的所有题目
        section.questions.forEach((question, questionIndex) => {
          const questionNumber = section.startNum + questionIndex;
          
          standardAnswers.push({
            chineseNumber,
            questionNumber,
            answer: question.answer,
            content: question.content,
            type: section.type,
            score: section.score / section.questions.length // 平均分配分数
          });
        });
      });
      
      return standardAnswers;
    },
    
    // 仅使用doubao模型处理图片
    processImagesWithDoubaoOnly(imageFiles) {
      return new Promise(async (resolve, reject) => {
        try {
          // 1. 将所有图片转换为Base64格式
          const base64ImagesPromises = imageFiles.map(file => aiApi.convertImageToBase64(file));
          const base64Images = await Promise.all(base64ImagesPromises);
          
          // 2. 调用doubao模型识别图片内容
          const doubaoResult = await aiApi.processImagesWithDoubao(base64Images);
          const recognizedContent = doubaoResult.choices[0].message.content;
          
          resolve({
            originalRecognition: recognizedContent,
            // 为了保持接口一致，这里直接使用原始识别结果
            optimizedResult: recognizedContent
          });
        } catch (error) {
          console.error('AI处理图片失败:', error);
          reject(error);
        }
      });
    },
    
    // 处理上传图片
    processUpload() {
      if (this.fileList.length === 0) {
        this.$message.warning('请先上传试卷扫描件');
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
      
      // 调用仅使用doubao模型的处理方法
      this.processImagesWithDoubaoOnly(imageFiles)
        .then(result => {
          // 关闭对话框
          this.uploadDialogVisible = false;
          
          // 处理AI返回的结果
          console.log('AI识别结果:', result.originalRecognition);
          
          // 解析AI返回的结果并提取题目内容
          try {
            // 获取AI返回的结果
            const aiResult = result.originalRecognition;
            console.log('正在处理AI返回结果:', aiResult);
            
            // 分割成行并过滤空行
            const lines = aiResult.split('\n').filter(line => line.trim() !== '');
            
             // 识别题型部分，但不会覆盖原有的中文题号设置
            const match = aiResult.match(/^([一二三四五六七八九十]{1,2})[、.．:：]/);
            // 仅用于识别上传试卷中的题目，不会修改原有题号
            let currentChineseNumber = match ? match[1] : '一'; // 默认为第一大题
            
            // 存储题目内容的映射
            const questionContents = new Map();
            
            // 简化的正则表达式，只匹配中文题号
            const sectionPattern = /^([一二三四五六七八九十]{1,2})[、.．:：]/;
            
            // 改进的正则表达式，匹配数字题号和题目内容，支持以数字开头的题目内容和缩进的选项
            const questionPattern = /^\s*(\d+)\s*[.．、:：]\s*([\s\S]*?)(?=\s*(?:(?:^\s*\d+\s*[.．、:：])|$))/gm;
            
            // 处理题目内容提取的函数
            function extractQuestionContent(line) {
              questionPattern.lastIndex = 0; // 重置正则表达式的lastIndex
              const match = questionPattern.exec(line);
              if (match) {
                return {
                  number: parseInt(match[1], 10),
                  content: match[2].trim()
                };
              }
              return null;
            }
            
            // 处理多行题目内容，包括缩进的选项
            function processMultilineContent(lines, startIndex) {
              let content = lines[startIndex];
              let i = startIndex + 1;
              
              // 继续添加后续行，直到遇到下一个题号
              while (i < lines.length) {
                const nextLine = lines[i].trim();
                // 如果下一行是新题目（匹配数字题号），则停止
                if (nextLine.match(/^\s*\d+\s*[.．、:：]/)) {
                  break;
                }
                // 如果下一行是新大题（匹配中文题号），则停止
                if (nextLine.match(sectionPattern)) {
                  break;
                }
                // 否则，将该行添加到当前题目内容中
                content += '\n' + nextLine;
                i++;
              }
              
              return {
                content: content,
                nextIndex: i
              };
            }
            
            console.log('使用的中文题号匹配正则:', sectionPattern);
            console.log('使用的数字题号匹配正则:', questionPattern);
            
            // 将文本按大题分段
            let sections = [];
            let currentSection = '';
            let currentQuestions = [];
            
            // 处理每一行文本
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              const sectionMatch = line.match(sectionPattern);
              
              if (sectionMatch) {
                // 如果已经有内容，保存当前section
                if (currentSection && currentChineseNumber) {
                  sections.push({
                    chineseNumber: currentChineseNumber,
                    questions: currentQuestions
                  });
                }
                
                // 开始新的section，只关注中文题号
                currentChineseNumber = sectionMatch[1];
                currentSection = line + '\n';
                currentQuestions = [];
                console.log(`识别到中文题号: ${currentChineseNumber}`);
              } else {
                // 将行添加到当前section
                currentSection += line + '\n';
                
                // 尝试匹配小题
                const questionObj = extractQuestionContent(line);
                if (questionObj) {
                  // 处理多行内容，包括缩进的选项
                  const multilineResult = processMultilineContent(lines, i);
                  // 更新题目内容，包含选项
                  questionObj.content = multilineResult.content;
                  // 更新索引，跳过已处理的行
                  i = multilineResult.nextIndex - 1;
                  
                  currentQuestions.push(questionObj);
                }
              }
            }
            
            // 保存最后一个section
            if (currentSection && currentChineseNumber) {
              sections.push({
                chineseNumber: currentChineseNumber,
                questions: currentQuestions
              });
            }
            
            // 更新现有题目的content字段
            if (this.questionSections.length > 0 && sections.length > 0) {
              // 记录更新的题目数量
              let updatedQuestionCount = 0;
              
              // 遍历每个section，只根据中文题号和数字题号匹配更新内容
              sections.forEach(section => {
                // 在questionSections中找到对应的section，只使用中文题号进行匹配
                const targetSectionIndex = this.questionSections.findIndex(qs => {
                  // 优先使用section自身的chineseNumber属性进行匹配
                  return (qs.chineseNumber === section.chineseNumber);
                });
                
                if (targetSectionIndex !== -1) {
                  const targetSection = this.questionSections[targetSectionIndex];
                  
                  // 遍历section中的每个题目
                  section.questions.forEach(extractedQuestion => {
                    // 在targetSection中找到对应题号的题目
                    const questionIndex = extractedQuestion.number - targetSection.startNum;
                    if (questionIndex >= 0 && questionIndex < targetSection.questions.length) {
                      // 更新题目内容
                      targetSection.questions[questionIndex].content = extractedQuestion.content;
                      updatedQuestionCount++;
                      console.log(`更新题目内容: 中文题号=${section.chineseNumber}, 题号=${extractedQuestion.number}, 内容="${extractedQuestion.content}"`);
                    }
                  });
                }
              });
              
              // 显示更新的题目数量
              console.log(`共更新了 ${updatedQuestionCount} 道题目的内容`);
              
              // 如果没有更新任何题目，给出提示
              if (updatedQuestionCount === 0) {
                console.warn('未能更新任何题目内容，可能是题型或题号匹配失败');
                this.$message.warning('未能自动提取题目内容，请检查题型和题号是否匹配');
              }
              
              // 自动保存题目内容到数据库
              console.log('正在自动保存题目内容到数据库...');
              
              // 准备保存题目内容，但不修改中文题号
              const sectionsToSave = JSON.parse(JSON.stringify(this.questionSections));
              sectionsToSave.forEach((section, index) => {
                // 保留原有的中文题号，不进行修改
                // 确保section_type字段存在
                section.section_type = section.type;
                
                // 确保每个题目都有content字段，即使为空
                section.questions.forEach(question => {
                  if (!question.content) {
                    question.content = null;
                  }
                });
              });
              
              // 在控制台输出保存的题目内容
              console.log('保存的题目内容:', sectionsToSave);
              
              // 调用API保存到数据库
              examApi.saveAnswers(this.latestExam.id, sectionsToSave)
                .then(response => {
                  if (response.data.success) {
                    this.$message.success('题目内容已自动保存到数据库');
                    // 更新原始数据
                    this.originalSections = JSON.parse(JSON.stringify(this.questionSections));
                  } else {
                    throw new Error(response.data.message || '保存题目内容失败');
                  }
                })
                .catch(error => {
                  console.error('保存题目内容失败:', error);
                  this.$message.error(error.message || '保存题目内容失败，请重试');
                });
              
              this.$message.success('已提取题目内容');
            } else {
              this.$message.warning('未能提取题目内容');
            }
          } catch (error) {
            console.error('解析AI结果失败:', error);
            this.$message.warning('无法自动提取题目内容，请手动编辑');
          }
          
          // 关闭加载中提示
          loadingInstance.close();
        })
        .catch(error => {
          console.error('AI处理失败:', error);
          this.$message.error('AI处理失败，请重试');
          loadingInstance.close();
        });
    },
    
    // 获取最新考试
    fetchLatestExam() {
      this.loading = true;
      // 检查路由参数中是否有考试ID
      const examId = this.$route.params.examId;
      
      if (examId) {
        // 如果路由中有考试ID，直接获取该考试
        examApi.getExamById(examId)
          .then(response => {
            if (response.data.success) {
              this.latestExam = response.data.data;
              
              // 获取该考试的答案
              return examApi.getAnswers(this.latestExam.id);
            } else {
              throw new Error(response.data.message || '获取考试详情失败');
            }
          })
          .then(response => {
            if (response && response.data.success && response.data.data && response.data.data.length > 0) {
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
            
              // 从答案数据中提取中文题号
              answers.forEach(answer => {
                if (answer.chinese_number) {
                  const sectionIndex = answer.section_index - 1;
                  if (sectionIndex >= 0 && sectionIndex < this.questionSections.length) {
                    this.questionSections[sectionIndex].chineseNumber = answer.chinese_number;
                  }
                }
              });
            
              // 深拷贝保存原始数据
              this.originalSections = JSON.parse(JSON.stringify(this.questionSections));
            }
            })
          .finally(() => {
            this.loading = false;
            
            // 如果已经加载了考试信息，则获取统计信息
            if (this.latestExam) {
              this.getExamStatistics();
            }
          });
      } else {
      // 从Vuex中获取当前登录的教师ID
      const teacherId = this.$store.state.user.userInfo ? this.$store.state.user.userInfo.id : 1;
      
      // 获取教师的所有考试
      examApi.getExamsByTeacherId(teacherId)
        .then(response => {
          if (response.data.success) {
            const exams = response.data.data;
            if (exams && exams.length > 0) {
              // 按创建时间排序，获取最新的考试
              exams.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              this.latestExam = exams[0];
              
              // 获取该考试的答案
              return examApi.getAnswers(this.latestExam.id);
            } else {
              this.latestExam = null;
              this.loading = false;
            }
          } else {
            throw new Error(response.data.message || '获取考试列表失败');
          }
        })
        .then(response => {
          if (response && response.data.success && response.data.data && response.data.data.length > 0) {
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
            
            // 从答案数据中提取中文题号
            answers.forEach(answer => {
              if (answer.chinese_number) {
                const sectionIndex = answer.section_index - 1;
                if (sectionIndex >= 0 && sectionIndex < this.questionSections.length) {
                  this.questionSections[sectionIndex].chineseNumber = answer.chinese_number;
                }
              }
            });
            
            // 深拷贝保存原始数据
            this.originalSections = JSON.parse(JSON.stringify(this.questionSections));
          }
        })
        .finally(() => {
          this.loading = false;
          
          // 如果已经加载了考试信息，则获取统计信息
          if (this.latestExam) {
            this.getExamStatistics();
          }
        });
      }
    },
    // 开始编辑
    startEditing() {
      this.isEditing = true;
    },
    // 取消编辑
    cancelEditing() {
      // 恢复原始数据
      this.questionSections = JSON.parse(JSON.stringify(this.originalSections));
      this.isEditing = false;
    },
    // 保存答案
    saveAnswers() {
      if (!this.latestExam) return;
      
      this.saving = true;
      
      // 为每个题型区域添加中文题号
      const sectionsToSave = JSON.parse(JSON.stringify(this.questionSections));
      sectionsToSave.forEach((section, index) => {
        // 使用getChineseNumber方法获取中文题号
        section.chineseNumber = this.getChineseNumber(index + 1);
        // 确保section_type字段存在
        section.section_type = section.type;
        
        // 确保每个题目都有content字段，即使为空
        section.questions.forEach(question => {
          if (!question.content) {
            question.content = null;
          }
        });
      });
      
      examApi.saveAnswers(this.latestExam.id, sectionsToSave)
        .then(response => {
          if (response.data.success) {
            this.$message.success('答案保存成功');
            // 更新原始数据
            this.originalSections = JSON.parse(JSON.stringify(this.questionSections));
            this.isEditing = false;
          } else {
            throw new Error(response.data.message || '保存答案失败');
          }
        })
        .catch(error => {
          console.error('保存答案失败:', error);
          this.$message.error(error.message || '保存答案失败，请重试');
        })
        .finally(() => {
          this.saving = false;
        });
    },
    // 创建新考试
    createNewExam() {
      this.$router.push('/create-exam');
    },
    // 获取题目类型样式类
    getTypeClass(type) {
      return {
        'type-choice': type === 'choice',
        'type-fill': type === 'fill',
        'type-judgment': type === 'judgment',
        'type-essay': type === 'essay'
      };
    },
    // 获取题目类型名称
    getTypeName(type) {
      const typeMap = {
        'choice': '选择题',
        'fill': '填空题',
        'judgment': '判断题',
        'essay': '解答题'
      };
      return typeMap[type] || '未知题型';
    },
    // 获取输入框占位符
    getPlaceholder(type) {
      const placeholderMap = {
        'choice': '请输入选项（如：A）',
        'fill': '请输入答案',
        'judgment': '请选择（对/错）',
        'essay': '请输入解答过程'
      };
      return placeholderMap[type] || '请输入答案';
    },
    // 获取中文数字
    getChineseNumber(num) {
      const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      if (num <= 0 || num > 99) return num;
      if (num <= 10) return chineseNumbers[num - 1];
      
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      
      if (tens === 1) {
        return ones === 0 ? '十' : `十${chineseNumbers[ones - 1]}`;
      }
      
      return ones === 0 
        ? `${chineseNumbers[tens - 1]}十`
        : `${chineseNumbers[tens - 1]}十${chineseNumbers[ones - 1]}`;
    },
    
    // 解析学生答案
    parseStudentAnswers(recognizedText) {
      if (!recognizedText) return [];
      
      // 分割成行并过滤空行
      const lines = recognizedText.split('\n').filter(line => line.trim() !== '');
      
      // 存储解析后的答案
      const parsedAnswers = [];
      
      // 匹配中文题号、数字题号和答案的正则表达式
      // 例如：一、1.A 或 二、2.null
      const answerPattern = /^([一二三四五六七八九十]{1,2})[、.．:：]\s*(\d+)[.．、:：]\s*(.+)$/;
      
      // 处理每一行
      for (const line of lines) {
        const match = line.match(answerPattern);
        if (match) {
          const chineseNumber = match[1]; // 中文题号
          const questionNumber = parseInt(match[2], 10); // 数字题号
          const studentAnswer = match[3].trim(); // 学生答案
          
          parsedAnswers.push({
            chineseNumber,
            questionNumber,
            studentAnswer
          });
        }
      }
      
      return parsedAnswers;
    },
    
    // 直接使用学生名字作为ID
    generateStudentId(studentName) {
      // 直接返回学生名字作为ID
      return studentName;
    },
    
    // 保存学生答案和批改结果
    async saveStudentAnswersWithGrades(examId, studentId, studentName, gradeResults) {
      // 计算总分
      const totalScore = gradeResults.reduce((sum, result) => sum + result.score, 0);
      
      // 准备保存的数据
      const saveData = {
        examId,
        studentId,
        studentName,
        totalScore,
        answers: gradeResults.map(result => ({
          chineseNumber: result.chineseNumber,
          questionNumber: result.questionNumber,
          studentAnswer: result.studentAnswer,
          standardAnswer: result.standardAnswer,
          isCorrect: result.isCorrect,
          score: result.score,
          questionType: result.questionType
        }))
      };
      
      // 调用API保存学生答案和批改结果
      const response = await studentApi.saveStudentAnswersWithGrades(saveData);
      
      if (response.data.success) {
        return {
          success: true,
          savedCount: response.data.data.savedCount,
          totalScore
        };
      } else {
        throw new Error(response.data.message || '保存学生答案失败');
      }
    },
    // 更新成绩统计信息（保存学生成绩并获取最新统计）
    updateExamStatistics() {
      if (!this.latestExam) {
        this.$message.warning('请先创建考试');
        return;
      }
      
      // 显示加载中提示
      const loadingInstance = this.$loading({
        lock: true,
        text: '正在处理学生成绩数据...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      // 先保存学生成绩，然后获取统计信息
      studentApi.saveStudentGrades(this.latestExam.id)
        .then(response => {
          if (response.data.success) {
            console.log('学生成绩保存成功:', response.data.message);
            // 保存成功后获取统计信息
            return studentApi.getExamStatistics(this.latestExam.id);
          } else {
            throw new Error(response.data.message || '保存学生成绩失败');
          }
        })
        .then(response => {
          if (response.data.success) {
            this.examStatistics = response.data.data;
            // 更新学生列表
            this.getStudentList();
            this.$message.success('成绩统计更新完成');
          } else {
            throw new Error(response.data.message || '获取考试统计信息失败');
          }
        })
        .catch(error => {
          console.error('处理学生成绩数据失败:', error);
          this.$message.error(error.message || '处理学生成绩数据失败，请重试');
        })
        .finally(() => {
          loadingInstance.close();
        });
    },
    
    // 获取考试统计信息（不保存学生成绩，只获取统计信息）
    getExamStatistics() {
      if (!this.latestExam) {
        return;
      }
      
      // 获取统计信息
      studentApi.getExamStatistics(this.latestExam.id)
        .then(response => {
          if (response.data.success) {
            this.examStatistics = response.data.data;
            console.log('成功获取考试统计信息');
            
            // 获取学生列表
            this.getStudentList();
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
      if (!this.latestExam) {
        return;
      }
      
      this.studentListLoading = true;
      
      // 获取学生列表
      studentApi.getStudentList(this.latestExam.id)
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
      if (!this.latestExam) {
        this.$message.warning('请先创建考试');
        return;
      }
      
      // 跳转到学生错题详情页面
      this.$router.push({
        name: 'StudentWrongAnswers',
        params: {
          examId: this.latestExam.id,
          studentId: student.student_name,
          studentName: student.student_name
        }
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
    this.fetchLatestExam();
  },
  
  // 在组件挂载后获取统计信息
  mounted() {
    // 如果已经加载了考试信息，则获取统计信息
    if (this.latestExam) {
      this.getExamStatistics();
    }
  }
}
</script>

<style scoped>
.exam-content-container {
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

.exam-info {
  margin-bottom: 20px;
}

.exam-date {
  color: #909399;
  font-size: 14px;
}

.edit-status-tip {
  margin-bottom: 20px;
}

.question-sections {
  margin-top: 20px;
}

.question-section-card {
  margin-bottom: 15px;
}

.section-header {
  display: flex;
  flex-direction: column;
}

.section-type-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 15px;
  color: white;
  margin-bottom: 10px;
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

.essay-question-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 20px;
}

.essay-input {
  width: 100%;
  margin-top: 10px;
}

.action-buttons {
  margin-top: 30px;
  text-align: center;
}

.loading-state,
.error-state,
.empty-state {
  margin-top: 40px;
  text-align: center;
}

.create-exam-btn {
  margin-top: 20px;
}

.upload-tip {
  margin-top: 10px;
  text-align: left;
}

.upload-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.upload-area {
  width: 100%;
  margin-bottom: 20px;
}

.file-prefixes-container {
  margin-top: 15px;
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.file-prefix-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.statistics-loading {
  padding: 20px;
}

.statistics-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.statistics-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
}

.statistics-item {
  padding: 10px 20px;
  font-size: 16px;
  text-align: center;
  flex: 1;
  min-width: 200px;
}

.statistics-label {
  font-weight: bold;
  color: #606266;
  display: block;
  margin-bottom: 5px;
}

.statistics-value {
  color: #409EFF;
  font-weight: bold;
  font-size: 24px;
}

.statistics-student {
  color: #67C23A;
  margin-left: 5px;
  font-size: 14px;
}

.student-list-section {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.student-list-title {
  font-size: 18px;
  color: #606266;
  margin-bottom: 15px;
}

.student-list {
  margin-top: 15px;
}
</style>