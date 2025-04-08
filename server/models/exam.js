/**
 * 考试模型
 */

const db = require('../database/db');

const examModel = {
  // 创建新考试
  create: async (examData) => {
    const [id] = await db('exams').insert(examData);
    return id;
  },

  // 根据ID查找考试
  findById: async (id) => {
    return await db('exams')
      .select('*')
      .where({ id })
      .first();
  },

  // 获取教师的所有考试
  findByTeacherId: async (teacherId) => {
    return await db('exams')
      .select('*')
      .where({ teacher_id: teacherId })
      .orderBy('created_at', 'desc');
  },

  // 保存题目答案
  saveQuestionAnswers: async (answersData) => {
    return await db('question_answers').insert(answersData);
  },

  // 获取考试的所有题目答案
  getQuestionAnswers: async (examId) => {
    return await db('question_answers')
      .select('*')
      .where({ exam_id: examId })
      .orderBy(['section_index', 'question_number']);
  },

  // 检查考试是否已有答案
  hasAnswers: async (examId) => {
    const count = await db('question_answers')
      .count('id as count')
      .where({ exam_id: examId })
      .first();
    return count.count > 0;
  },
  
  // 删除考试的所有答案
  deleteQuestionAnswers: async (examId) => {
    return await db('question_answers')
      .where({ exam_id: examId })
      .delete();
  },
  
  // 删除考试及其关联的答案
  deleteExam: async (examId) => {
    // 使用事务确保数据一致性
    return await db.transaction(async trx => {
      // 先删除关联的答案
      await trx('question_answers')
        .where({ exam_id: examId })
        .delete();
      
      // 再删除考试记录
      await trx('exams')
        .where({ id: examId })
        .delete();
      
      return true;
    });
  },
  
  // 更新考试总分
  updateTotalScore: async (examId, totalScore) => {
    return await db('exams')
      .where({ id: examId })
      .update({ total_score: totalScore });
  }
};

module.exports = examModel;