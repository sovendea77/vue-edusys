/**
 * 学生相关控制器
 */

const db = require('../database/db');
const { examModel } = require('../models');

// 判断两个答案是否匹配（支持模糊匹配）
const isAnswerMatched = (studentAnswer, standardAnswer) => {
  if (!studentAnswer || !standardAnswer) return false;
  
  // 转换为字符串并去除空格
  const cleanStudentAnswer = String(studentAnswer).trim().toLowerCase();
  const cleanStandardAnswer = String(standardAnswer).trim().toLowerCase();
  
  // 完全匹配
  if (cleanStudentAnswer === cleanStandardAnswer) return true;
  
  // 模糊匹配逻辑
  // 1. 处理判断题答案，支持√、×、✓、✗、对、错、true、false等多种表达方式
  const trueAnswers = ['√', '✓', '对', 'true', 't', '1', 'yes', 'y'];
  const falseAnswers = ['×', '✗', '错', 'false', 'f', '0', 'no', 'n'];
  
  if (trueAnswers.includes(cleanStudentAnswer)) {
    return trueAnswers.includes(cleanStandardAnswer);
  }
  if (falseAnswers.includes(cleanStudentAnswer)) {
    return falseAnswers.includes(cleanStandardAnswer);
  }
  
  // 2. 处理数字答案，允许前导零和小数点后零的差异
  if (/^\d+(\.\d+)?$/.test(cleanStandardAnswer) && /^\d+(\.\d+)?$/.test(cleanStudentAnswer)) {
    return parseFloat(cleanStudentAnswer) === parseFloat(cleanStandardAnswer);
  }
  
  // 3. 处理文本答案，忽略标点符号和空格
  const normalizeText = (text) => text.replace(/[.,，。、；;：:"''"\s]/g, '');
  return normalizeText(cleanStudentAnswer) === normalizeText(cleanStandardAnswer);
};

const studentController = {
  // 获取学生列表
  getStudentList: async (req, res) => {
    try {
      const { examId } = req.params;
      
      console.log('获取学生列表 - examId:', examId);
      
      // 验证考试是否存在
      const exam = await examModel.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      // 从student_grade表中获取学生列表
      const students = await db('student_grade')
        .select('student_name', 'score')
        .where({ exam_id: examId })
        .orderBy('score', 'desc');
      
      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('获取学生列表失败:', error);
      res.status(500).json({ success: false, message: '获取学生列表失败: ' + error.message });
    }
  },
  
  // 获取学生错题详情
  getStudentWrongAnswers: async (req, res) => {
    try {
      const { examId, studentId } = req.params;
      
      console.log('获取学生错题详情 - examId:', examId);
      console.log('获取学生错题详情 - studentId:', studentId);
      
      // 验证考试是否存在
      const exam = await examModel.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      // 获取学生的错题记录（is_corrected为false的题目）
      const wrongAnswers = await db('student_wrong_answers as swa')
        .select(
          'swa.id',
          'swa.student_answer',
          'swa.question_id',
          'swa.is_corrected',
          'qa.question_number',
          'qa.chinese_number',
          'qa.content',
          'qa.answer as correct_answer',
          'qa.section_type',
          'qa.score' 
        )
        .join('question_answers as qa', 'swa.question_id', 'qa.id')
        .where({
          'swa.exam_id': examId,
          'swa.student_id': studentId,
          'swa.is_corrected': false
        })
        .orderBy(['qa.chinese_number', 'qa.question_number']);
      
      res.json({
        success: true,
        data: wrongAnswers
      });
    } catch (error) {
      console.error('获取学生错题详情失败:', error);
      res.status(500).json({ success: false, message: '获取学生错题详情失败: ' + error.message });
    }
  },
  
  // 获取考试统计信息
  getExamStatistics: async (req, res) => {
    try {
      const { examId } = req.params;
      
      console.log('获取考试统计信息 - examId:', examId);
      
      // 验证考试是否存在
      const exam = await examModel.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      // 直接从考试表中获取总分
      const totalScore = exam.total_score || 0;
      
      // 从student_grade表中获取学生成绩信息
      const studentGrades = await db('student_grade')
        .select('student_name', 'score')
        .where({ exam_id: examId });
      
      // 如果没有学生成绩记录，返回基本信息
      if (studentGrades.length === 0) {
        return res.json({
          success: true,
          data: {
            totalScore,
            studentCount: 0,
            highestScore: 0,
            lowestScore: 0,
            averageScore: 0,
            highestScoreStudent: null
          }
        });
      }
      
      // 计算统计信息
      const studentCount = studentGrades.length;
      let highestScore = 0;
      let highestScoreStudent = null;
      let lowestScore = totalScore;
      let totalStudentScore = 0;
      
      studentGrades.forEach(({ student_name, score }) => {
        const numericScore = parseFloat(score);
        totalStudentScore += numericScore;
        
        if (numericScore > highestScore) {
          highestScore = numericScore;
          highestScoreStudent = student_name;
        }
        
        if (numericScore < lowestScore) {
          lowestScore = numericScore;
        }
      });
      
      // 计算平均分
      const averageScore = studentCount > 0 ? totalStudentScore / studentCount : 0;
      
      // 返回统计信息
      res.json({
        success: true,
        data: {
          totalScore,
          studentCount,
          highestScore,
          lowestScore,
          averageScore: parseFloat(averageScore.toFixed(2)),
          highestScoreStudent
        }
      });
    } catch (error) {
      console.error('获取考试统计信息失败:', error);
      res.status(500).json({ success: false, message: '获取考试统计信息失败: ' + error.message });
    }
  },
  
  // 保存学生错题答案
  saveStudentWrongAnswers: async (req, res) => {
    try {
      const { examId, studentId, answers } = req.body;
      
      console.log('保存学生错题 - examId:', examId);
      console.log('保存学生错题 - studentId:', studentId);
      console.log('保存学生错题 - 答案数量:', answers ? answers.length : '无答案');
      
      // 验证必要字段
      if (!examId || !studentId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ success: false, message: '缺少必要字段' });
      }
      
      // 验证考试是否存在
      const exam = await examModel.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      // 获取考试的所有题目答案
      const questionAnswers = await examModel.getQuestionAnswers(examId);
      
      // 创建中文题号和题号到question_id和answer的映射
      const questionIdMap = new Map();
      const questionAnswerMap = new Map();
      questionAnswers.forEach(qa => {
        const key = `${qa.chinese_number}_${qa.question_number}`;
        questionIdMap.set(key, qa.id);
        questionAnswerMap.set(qa.id, qa.answer);
      });
      
      // 准备要保存的学生答案数据
      const wrongAnswersToSave = [];
      
      // 处理每个学生答案
      for (const answer of answers) {
        const { chineseNumber, questionNumber, studentAnswer } = answer;
        
        // 空答案直接标记为错误
        if (studentAnswer === 'null' || studentAnswer === null) {
          // 查找对应的question_id
          const key = `${chineseNumber}_${questionNumber}`;
          const questionId = questionIdMap.get(key);
          
          if (!questionId) {
            console.warn(`未找到对应的题目: ${key}`);
            continue;
          }
          
          wrongAnswersToSave.push({
            student_id: studentId,
            question_id: questionId,
            exam_id: examId,
            student_answer: null,
            is_corrected: false
          });
          continue;
        }
        
        // 查找对应的question_id
        const key = `${chineseNumber}_${questionNumber}`;
        const questionId = questionIdMap.get(key);
        
        if (!questionId) {
          console.warn(`未找到对应的题目: ${key}`);
          continue;
        }
        
        // 获取标准答案
        const standardAnswer = questionAnswerMap.get(questionId);
        
        // 判断学生答案是否与标准答案匹配
        const isCorrect = isAnswerMatched(studentAnswer, standardAnswer);
        
        // 添加到待保存数组，包含is_corrected字段
        wrongAnswersToSave.push({
          student_id: studentId,
          question_id: questionId,
          exam_id: examId,
          student_answer: studentAnswer,
          is_corrected: isCorrect
        });
      }
      
      console.log('准备保存的学生错题数量:', wrongAnswersToSave.length);
      
      // 如果没有有效答案，直接返回成功
      if (wrongAnswersToSave.length === 0) {
        return res.json({ 
          success: true, 
          message: '没有需要保存的学生答案',
          data: { savedCount: 0 }
        });
      }
      
      // 使用事务确保数据一致性
      await db.transaction(async trx => {
        // 获取当前学生在该考试中已有的错题记录
        const existingRecords = await trx('student_wrong_answers')
          .select('id', 'student_id', 'question_id', 'exam_id')
          .where({
            student_id: studentId,
            exam_id: examId
          });
        
        console.log('已存在的学生错题记录数量:', existingRecords.length);
        
        // 创建现有记录的映射，用于快速查找
        const existingMap = new Map();
        existingRecords.forEach(record => {
          const key = `${record.student_id}_${record.question_id}_${record.exam_id}`;
          existingMap.set(key, record.id);
        });
        
        // 分离需要更新和需要插入的记录
        const recordsToUpdate = [];
        const recordsToInsert = [];
        
        wrongAnswersToSave.forEach(record => {
          const key = `${record.student_id}_${record.question_id}_${record.exam_id}`;
          if (existingMap.has(key)) {
            // 已存在记录，需要更新
            recordsToUpdate.push({
              id: existingMap.get(key),
              ...record
            });
          } else {
            // 不存在记录，需要插入
            recordsToInsert.push(record);
          }
        });
        
        console.log('需要更新的记录数量:', recordsToUpdate.length);
        console.log('需要插入的记录数量:', recordsToInsert.length);
        
        // 执行批量更新
        for (const record of recordsToUpdate) {
          await trx('student_wrong_answers')
            .where('id', record.id)
            .update({
              student_answer: record.student_answer,
              is_corrected: record.is_corrected
            });
        }
        
        // 执行批量插入
        if (recordsToInsert.length > 0) {
          await trx('student_wrong_answers').insert(recordsToInsert);
        }
      });
      
      res.json({ 
        success: true, 
        message: '学生答案保存成功',
        data: { savedCount: wrongAnswersToSave.length }
      });
    } catch (error) {
      console.error('保存学生答案失败:', error);
      res.status(500).json({ success: false, message: '保存学生答案失败: ' + error.message });
    }
  },


  // 保存学生成绩
  saveStudentGrades: async (req, res) => {
    try {
      const { examId } = req.body;
      
      console.log('保存学生成绩 - examId:', examId);
      
      // 验证考试是否存在
      const exam = await examModel.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      // 直接从考试表中获取总分
      const totalScore = exam.total_score || 0;
      
      // 获取所有学生的答案，同时获取题目类型和分数信息
      const studentAnswers = await db('student_wrong_answers as swa')
        .select(
          'swa.student_id', 
          'swa.question_id', 
          'swa.is_corrected',
          'swa.score as student_score',
          'qa.section_type',
          'qa.score as question_score'
        )
        .join('question_answers as qa', 'swa.question_id', 'qa.id')
        .where({ 'swa.exam_id': examId });
      
      // 如果没有学生答案，直接返回
      if (studentAnswers.length === 0) {
        return res.json({
          success: true,
          message: '没有学生答案数据，无法保存成绩',
          data: { savedCount: 0 }
        });
      }
      
      // 计算每个学生的得分
      const studentScores = new Map();
      studentAnswers.forEach(sa => {
        if (!studentScores.has(sa.student_id)) {
          studentScores.set(sa.student_id, 0);
        }
        
        if (sa.section_type === 'essay') {
          if (sa.student_score) {
            studentScores.set(
              sa.student_id, 
              studentScores.get(sa.student_id) + parseFloat(sa.student_score)
            );
          }
        } 
        else if (sa.is_corrected) {
          studentScores.set(
            sa.student_id, 
            studentScores.get(sa.student_id) + parseFloat(sa.question_score || 0)
          );
        }
      });
      
      // 转换为数组，方便处理
      const scores = Array.from(studentScores.entries()).map(([studentId, score]) => ({ studentId, score }));
      
      // 使用事务保存学生成绩
      let savedCount = 0;
      await db.transaction(async trx => {
        // 先删除该考试的所有学生成绩记录
        await trx('student_grade').where({ exam_id: examId }).delete();
        
        // 插入新的成绩记录
        for (const { studentId, score } of scores) {
          await trx('student_grade').insert({
            student_name: studentId,
            exam_id: examId,
            score
          });
          savedCount++;
        }
      });
      
      res.json({
        success: true,
        message: `成功保存 ${savedCount} 名学生的成绩`,
        data: { savedCount }
      });
    } catch (error) {
      console.error('保存学生成绩失败:', error);
      res.status(500).json({ success: false, message: '保存学生成绩失败: ' + error.message });
    }
  },

  // 获取错题分析数据
  getWrongAnswersAnalysis: async (req, res) => {
    try {
      const { examId } = req.params;
      const { minErrorCount = 1 } = req.query;
      
      console.log('获取错题分析数据 - examId:', examId);
      console.log('获取错题分析数据 - 最小错误次数:', minErrorCount);
      
      // 验证考试是否存在
      const exam = await examModel.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: '考试不存在' });
      }
      
      // 查询错题分析数据
      // 1. 统计每道题目的错误次数
      const wrongAnswersAnalysis = await db('student_wrong_answers as swa')
        .select(
          'qa.id',
          'qa.question_number',
          'qa.chinese_number',
          'qa.content',
          'qa.answer as correct_answer',
          'qa.section_type',
          db.raw('COUNT(CASE WHEN swa.is_corrected = false THEN 1 END) as error_count')
        )
        .join('question_answers as qa', 'swa.question_id', 'qa.id')
        .where('swa.exam_id', examId)
        .groupBy(
          'qa.id',
          'qa.question_number',
          'qa.chinese_number',
          'qa.content',
          'qa.answer',
          'qa.section_type'
        )
        .having('error_count', '>=', minErrorCount)
        .orderBy('error_count', 'desc');
      
      res.json({
        success: true,
        data: wrongAnswersAnalysis
      });
    } catch (error) {
      console.error('获取错题分析数据失败:', error);
      res.status(500).json({ success: false, message: '获取错题分析数据失败: ' + error.message });
    }
  },
  
  // 更新解答题评分
  updateEssayQuestionScore: async (req, res) => {
    try {
      const examId = req.params.examId || req.body.examId;
      const studentId = req.params.studentId || req.body.studentId;
      const questionId = req.params.questionId || req.body.questionId;
      const score = req.body.score;
      
      if (!examId || !studentId || !questionId || score === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: '缺少必要参数',
          receivedParams: { examId, studentId, questionId, score }
        });
      }
      
      // 查询满分值
      const questionInfo = await db('question_answers')
        .where('id', questionId)
        .first();
      console.log(questionInfo);
      if (!questionInfo) {
        return res.status(404).json({ 
          success: false, 
          message: '未找到对应的题目',
          questionId
        });
      }
      
      // 获取题目满分
      const fullScore = questionInfo.score || 0;
      
      // 查询数据库中该学生的错题记录
      const existingRecord = await db('student_wrong_answers')
        .where({
          exam_id: examId,
          student_id: studentId,
          question_id: questionId
        })
        .first();

      if (!existingRecord) {
        console.log(2222);
        return res.status(404).json({ 
          success: false, 
          message: '未找到对应的错题记录',
          searchParams: { examId, studentId, questionId }
        });
      }
      
      // 判断是否为满分
      const isFullScore = parseFloat(score) >= parseFloat(fullScore);
      
      await db('student_wrong_answers')
        .where({
          exam_id: examId,
          student_id: studentId,
          question_id: questionId  
        })
        .update({ 
          is_corrected: isFullScore ? 1 : 0,  
          score: parseFloat(score)
        });
      
      // 获取当前学生的总分
      const currentGrade = await db('student_grade')
        .where({
          exam_id: examId,
          student_name: studentId
        })
        .first();
      
      // 获取考试的总分
      const examInfo = await db('exams')
        .where('id', examId)
        .first();
      
      // 计算新的总分
      let totalScore = 0;
      if (currentGrade) {
        if (existingRecord.score) {
          totalScore = parseFloat(currentGrade.score) - parseFloat(existingRecord.score) + parseFloat(score);
        } else {
          totalScore = parseFloat(currentGrade.score) + parseFloat(score);
        }
      } else {
        totalScore = parseFloat(score);
      }
      console.log('学生新的总分:', totalScore);
      
      // 更新student_grade表中的学生总分
      if (currentGrade) {
        // 更新现有成绩记录
        await db('student_grade')
          .where({
            exam_id: examId,
            student_name: studentId
          })
          .update({ score: totalScore });
      } else {
        console.log(33333);
        await db('student_grade').insert({
          student_name: studentId,
          exam_id: examId,
          score: totalScore
        });
      }
      
      res.json({ 
        success: true, 
        message: '评分更新成功',
        updatedRecord: {
          examId,
          studentId,
          questionId,
          score,
          isFullScore,
          totalScore
        }
      });
    } catch (error) {
      console.error('更新解答题评分失败:', error);
      res.status(500).json({ success: false, message: '更新解答题评分失败: ' + error.message });
    }
  },
  
  // 更新填空题
  updateFillQuestionCorrectness: async (req, res) => {
    try {
      const { examId, studentId, questionId, isCorrect } = req.body;
      
      console.log('更新填空题正确性 - examId:', examId);
      console.log('更新填空题正确性 - studentId:', studentId);
      console.log('更新填空题正确性 - questionId:', questionId);
      console.log('更新填空题正确性 - isCorrect:', isCorrect);
      
      // 验证必要字段
      if (!examId || !studentId || !questionId) {
        return res.status(400).json({ success: false, message: '缺少必要字段' });
      }
      
      // 更新is_corrected字段
      await db('student_wrong_answers')
        .where({
          exam_id: examId,
          student_id: studentId,
          question_id: questionId
        })
        .update({
          is_corrected: isCorrect ? 1 : 0
        });
      
      res.json({
        success: true,
        message: '填空题正确性更新成功',
        data: { isCorrect }
      });
    } catch (error) {
      console.error('更新填空题正确性失败:', error);
      res.status(500).json({ success: false, message: '更新填空题正确性失败: ' + error.message });
    }
  },

// 保存学生答案和批改结果
  saveStudentAnswersWithGrades: async (req, res) => {
    try {
      const { examId, studentId, studentName, totalScore, answers } = req.body;
      
      console.log('保存学生答案和批改结果 - 参数:', { 
        examId, 
        studentId, 
        studentName, 
        totalScore, 
        answersCount: answers ? answers.length : 0 
      });
      
      // 验证参数
      if (!examId || !studentId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ success: false, message: '缺少必要参数' });
      }
      
      // 获取正确的question_id
      const questionAnswers = await db('question_answers')
        .select('id', 'chinese_number', 'question_number')
        .where({ exam_id: examId });
      const questionIdMap = new Map();
      questionAnswers.forEach(qa => {
        const key = `${qa.chinese_number}_${qa.question_number}`;
        questionIdMap.set(key, qa.id);
      });
      
      // 开始数据库事务
      await db.transaction(async trx => {
        // 1. 保存或更新学生成绩
        const existingGrade = await trx('student_grade')
          .where({
            exam_id: examId,
            student_name: studentId
          })
          .first();
        
        if (existingGrade) {
          // 更新现有成绩
          await trx('student_grade')
            .where({
              exam_id: examId,
              student_name: studentId
            })
            .update({
              score: totalScore
            });
        } else {
          // 创建新成绩记录
          await trx('student_grade').insert({
            exam_id: examId,
            student_name: studentId,
            score: totalScore
          });
        }
        
        // 2. 保存学生答案
        const savedAnswers = [];
        
        for (const answer of answers) {
          // 查找正确的整数类型question_id
          let questionId;
          
          if (answer.questionId && !isNaN(parseInt(answer.questionId))) {
            // 如果已经是数字ID，直接使用
            questionId = parseInt(answer.questionId);
          } else {
            // 否则通过中文题号和题号查找
            const key = `${answer.chineseNumber}_${answer.questionNumber}`;
            questionId = questionIdMap.get(key);
            
            if (!questionId) {
              console.warn(`未找到对应的题目ID: ${key}`);
              continue;
            }
          }
          
          console.log(`处理题目: ${answer.chineseNumber}_${answer.questionNumber}, 找到ID: ${questionId}`);
          
          // 获取题目信息
          const questionInfo = questionInfoMap.get(questionId);
          if (!questionInfo) {
            console.warn(`未找到题目信息: ${questionId}`);
            continue;
          }
          
          // 判断答案是否正确
          let isCorrect = false;
          
          // 根据题型判断正确性
          if (questionInfo.section_type === 'essay') {
            // 解答题
            isCorrect = parseFloat(answer.score || 0) >= parseFloat(questionInfo.score || 0);
          } else {
            // 选择题、判断题、填空题
            isCorrect = isAnswerMatched(answer.studentAnswer, questionInfo.standard_answer);
          }
          
          // 检查是否已存在该答案
          const existingAnswer = await trx('student_wrong_answers')
            .where({
              exam_id: examId,
              student_id: studentId,
              question_id: questionId
            })
            .first();
          
          if (existingAnswer) {
            // 更新现有答案
            await trx('student_wrong_answers')
              .where({
                exam_id: examId,
                student_id: studentId,
                question_id: questionId
              })
              .update({
                student_answer: answer.studentAnswer,
                is_corrected: isCorrect ? 1 : 0,
                score: answer.score || 0
              });
          } else {
            // 创建新答案记录
            await trx('student_wrong_answers').insert({
              exam_id: examId,
              student_id: studentId,
              question_id: questionId,
              student_answer: answer.studentAnswer,
              is_corrected: isCorrect ? 1 : 0,
              score: answer.score || 0
            });
          }
          
          savedAnswers.push(questionId);
        }
        
        return savedAnswers;
      });
      
      res.json({
        success: true,
        message: '学生答案和批改结果保存成功',
        data: {
          examId,
          studentId,
          studentName,
          totalScore,
          savedCount: answers.length
        }
      });
    } catch (error) {
      console.error('保存学生答案和批改结果失败:', error);
      res.status(500).json({ success: false, message: '保存学生答案和批改结果失败: ' + error.message });
    }
  }
};

module.exports = studentController;
