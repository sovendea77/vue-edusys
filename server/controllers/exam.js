/**
 * 考试控制器
 */

const { examModel } = require('../models');
const db = require('../database/db');

const examController = {
  // 创建新考试
  createExam: async (req, res) => {
    try {
      const examData = req.body;
      console.log('接收到的考试数据:', examData);
      
      // 验证必要字段
      if (!examData.title || !examData.teacher_id) {
        console.error('创建考试失败: 缺少必要字段', examData);
        return res.status(400).json({ success: false, message: '缺少必要字段' });
      }
      
      const id = await examModel.create(examData);
      console.log('考试创建成功，ID:', id);
      res.json({ success: true, data: { id } });
    } catch (error) {
      console.error('创建考试失败:', error.message, error.stack);
      res.status(500).json({ success: false, message: '创建考试失败: ' + error.message });
    }
  },

  // 获取考试详情
  getExamById: async (req, res) => {
    try {
      const { id } = req.params;
      const exam = await examModel.findById(id);
      
      if (!exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      res.json({ success: true, data: exam });
    } catch (error) {
      console.error('获取考试详情失败:', error);
      res.status(500).json({ success: false, message: '获取考试详情失败' });
    }
  },

  // 保存题目答案
  saveAnswers: async (req, res) => {
    try {
      // 从URL参数和请求体中获取examId
      const urlExamId = req.params.examId;
      const { examId, sections } = req.body;
      
      // 使用URL中的examId优先，如果不存在则使用请求体中的examId
      const finalExamId = urlExamId || examId;
      
      console.log('保存答案 - URL examId:', urlExamId);
      console.log('保存答案 - Body examId:', examId);
      console.log('保存答案 - 最终使用的examId:', finalExamId);
      console.log('保存答案 - 题目部分数据:', sections ? sections.length : 'sections为空');
      
      // 验证考试是否存在
      const exam = await examModel.findById(finalExamId);
      if (!exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      // 检查是否已有答案
      const hasAnswers = await examModel.hasAnswers(finalExamId);
      
      // 准备要保存的答案数据
      const answersToSave = [];
      
      // 如果已有答案，先删除旧答案
      if (hasAnswers) {
        // 删除旧答案
        await examModel.deleteQuestionAnswers(finalExamId);
        console.log('已删除旧答案，准备保存新答案');
      }
      
      sections.forEach((section, sectionIndex) => { 
        // 获取当前题型的中文序号
        const chineseNumber = section.chineseNumber || '';
        
        // 检查section.questions是否存在
        if (!section.questions || !Array.isArray(section.questions)) {
          console.error(`第${sectionIndex + 1}个题型的questions不是数组或不存在:`, section);
          return; // 跳过这个section
        }
        
        section.questions.forEach((question, qIndex) => {
          // 检查question对象
          if (!question) {
            console.error(`第${sectionIndex + 1}个题型的第${qIndex}个题目为空`);
            return; // 跳过这个question
          }
          
          // 确保content字段为null而不是undefined
          const content = question.content === undefined ? null : question.content;
          
          // 记录每个题目的content值
          console.log(`题型${sectionIndex + 1}的第${qIndex}个题目的content:`, content);
          
          // 创建答案对象，只包含表中实际存在的字段
          const answerObj = {
            exam_id: finalExamId,
            section_index: sectionIndex + 1,
            section_type: section.type,
            question_number: section.startNum + qIndex,
            chinese_number: chineseNumber, // 添加中文题号
            content: content, // 使用处理后的content值
            answer: question.answer,
            score: section.score,
            created_at: new Date() // 添加创建时间字段
          };
          
          // 将答案对象添加到待保存数组
          answersToSave.push(answerObj);
        });
      });
      
      console.log('准备保存的答案数量:', answersToSave.length);
      
      // 检查answersToSave中的数据
      if (answersToSave.length > 0) {
        console.log('第一个答案数据示例:', JSON.stringify(answersToSave[0], null, 2));
      }
      
      // 保存答案
      await examModel.saveQuestionAnswers(answersToSave);
      
      // 计算试卷总分
      let totalScore = 0;
      sections.forEach(section => {
        if (section.questions && Array.isArray(section.questions)) {
          totalScore += section.questions.length * section.score;
        }
      });
      
      console.log('计算的试卷总分:', totalScore);
      
      // 更新考试总分
      await examModel.updateTotalScore(finalExamId, totalScore);
      
      res.json({ 
        success: true, 
        message: '答案保存成功',
        data: { answersCount: answersToSave.length, totalScore: totalScore }
      });
    } catch (error) {
      console.error('保存答案失败:', error);
      res.status(500).json({ success: false, message: '保存答案失败' });
    }
  },
  
  // 获取考试答案
  getAnswers: async (req, res) => {
    try {
      const { examId } = req.params;
      
      // 验证考试是否存在
      const exam = await examModel.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      // 获取答案
      const answers = await examModel.getQuestionAnswers(examId);
      
      res.json({ success: true, data: answers });
    } catch (error) {
      console.error('获取答案失败:', error);
      res.status(500).json({ success: false, message: '获取答案失败' });
    }
  },
  
  // 获取教师的所有考试
  getExamsByTeacherId: async (req, res) => {
    try {
      const { teacherId } = req.params;
      
      // 获取教师的所有考试
      const exams = await examModel.findByTeacherId(teacherId);
      
      res.json({ success: true, data: exams });
    } catch (error) {
      console.error('获取教师考试列表失败:', error);
      res.status(500).json({ success: false, message: '获取教师考试列表失败' });
    }
  },
  
  // 删除考试
  deleteExam: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 验证考试是否存在
      const exam = await examModel.findById(id);
      if (!exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      // 删除考试及其关联的答案
      await examModel.deleteExam(id);
      
      res.json({ success: true, message: '考试删除成功' });
    } catch (error) {
      console.error('删除考试失败:', error);
      res.status(500).json({ success: false, message: '删除考试失败' });
    }
  }
};

module.exports = examController;