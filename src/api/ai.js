/**
 * AI模型API调用
 */

import axios from 'axios';

// API基础URL和密钥
const ARK_API_KEY = "ef368e0b-4512-41c2-a2c0-4efa63906f6d";
const ARK_API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

// 模型ID
const DOUBAO_MODEL_ID = "doubao-1.5-vision-pro-250328"; // doubao-1.5-vision-pro-32k
const DEEPSEEK_MODEL_ID = "deepseek-v3-250324"; // deepseek-V3
const DEEPSEEK_R1_MODEL_ID = "deepseek-r1-250120"; // deepseek-R1

export const aiApi = {
  /**
   * 将图片转换为Base64格式
   * @param {File} file - 图片文件
   * @returns {Promise<string>} - 返回Base64编码的图片
   */
  convertImageToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },

  /**
   * 调用doubao-1.5-vision-pro-32k模型处理图片
   * @param {Array<string>} base64Images - Base64编码的图片数组
   * @param {string} prompt - 提示文本
   * @returns {Promise<Object>} - 返回模型处理结果
   */
  processImagesWithDoubao: async (base64Images) => {
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `对于该图片内的所有题目，若没有附图，则完整给出题干以及相关选项（若有的话）；若带有附图则需要你给出题干的同时对附图做尽可能详细的，对解题有帮助的描述（我需要单看描述和题干就能解出题目）。描述应该标注在题干后面。不需要给出任何题包括选择填空判断解答题的答案（包括√和×）。按根据试卷的题目排版顺序给出。如
                  一、选择题（每小题分数）：
                  （识别到的题号）.(题目...);（识别到的题号）.(题目...); ...  
                  二、填空题（每小题分数）：...
                  三、判断题（每小题分数）：...
                  四、解答题（每小题分数）：...`
          },
          ...base64Images.map(base64 => ({
            type: "image_url",
            image_url: {
              url: base64
            }
          }))
        ]
      }
    ];

    try {
      const response = await axios.post(ARK_API_URL, {
        model: DOUBAO_MODEL_ID,
        stream: false,
        messages: messages
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ARK_API_KEY}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('调用doubao模型失败:', error);
      throw error;
    }
  },

  /**
   * 调用deepseek-V3模型处理文本
   * @param {string} content - 需要处理的文本内容
   * @param {string} systemPrompt - 系统提示
   * @returns {Promise<Object>} - 返回模型处理结果
   */
  processTextWithDeepseek: async (content) => {
    const messages = [
      {
        role: "system",
        content: `这是一篇试卷的题目，请你联网查询题目答案，若无相关结果则请你理解每道题讲的是什么，然后分析给出每道题的正确答案（只需要答案），需要严格按格式打印出来，不需要分析过程，重点：生成的格式填写的必须只能是“选择题”，“填空题”，“判断题”，“解答题”，试卷的题型如果不属于这四种，需要你强行归类进这四种题目，判断不出就统一作为解答题生成。格式如下：
                  (中文题号)、选择题（每小题分数）
                  1.A
                  2.B...（每小题要换行，答案必须是选项）
                  (中文题号)、填空题（每小题分数）
                  ...
                  (中文题号)、判断题（每小题分数）
                  ...（判断题的答案只有“对”和“错”）
                  (中文题号)、解答题（每小题分数）
                  ...（解答题每小题不需要换行，只有解答题需要答题过程）`
      },
      {
        role: "user",
        content: content
      }
    ];

    try {
      const response = await axios.post(ARK_API_URL, {
        model: DEEPSEEK_MODEL_ID,
        stream: false,
        messages: messages
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ARK_API_KEY}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('调用deepseek模型失败:', error);
      throw error;
    }
  },

  /**
   * 完整的图片处理流程：图片识别后再进行文本优化
   * @param {Array<File>} imageFiles - 图片文件数组
   * @returns {Promise<Object>} - 返回最终处理结果
   */
  processImagesWithAI: async (imageFiles) => {
    try {
      // 1. 将所有图片转换为Base64格式
      const base64ImagesPromises = imageFiles.map(file => aiApi.convertImageToBase64(file));
      const base64Images = await Promise.all(base64ImagesPromises);
      
      // 2. 调用doubao模型识别图片内容
      const doubaoResult = await aiApi.processImagesWithDoubao(base64Images);
      const recognizedContent = doubaoResult.choices[0].message.content;
      
      // 3. 调用deepseek模型优化识别结果
      const deepseekResult = await aiApi.processTextWithDeepseek(
        `${recognizedContent}`
      );
      
      return {
        originalRecognition: recognizedContent,
        optimizedResult: deepseekResult.choices[0].message.content
      };
    } catch (error) {
      console.error('AI处理图片失败:', error);
      throw error;
    }
  },

  /**
   * 专门用于处理学生试卷的图片识别
   * @param {Array<File>} imageFiles - 学生试卷图片文件数组
   * @returns {Promise<Object>} - 返回识别结果
   */
  processStudentPaperWithDoubao: async (imageFiles) => {
    try {
      // 1. 将所有图片转换为Base64格式
      const base64ImagesPromises = imageFiles.map(file => aiApi.convertImageToBase64(file));
      const base64Images = await Promise.all(base64ImagesPromises);
      
      // 2. 构建带有特定提示文本的消息
      const messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "这是学生试卷我要提取他的填写答案来批改作业，请严格按照中文题号、数字题号.答案的格式输出学生填写的内容，注意每小题前面一定要附上中文题号！严格按照学生填什么你输出什么，若没有填写，就默认填了null，不需要解析。如一、1.A，一、2.B，一、3.C"
            },
            ...base64Images.map(base64 => ({
              type: "image_url",
              image_url: {
                url: base64
              }
            }))
          ]
        }
      ];

      // 3. 调用doubao模型识别图片内容
      const response = await axios.post(ARK_API_URL, {
        model: DOUBAO_MODEL_ID,
        stream: false,
        messages: messages
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ARK_API_KEY}`
        }
      });

      const recognizedContent = response.data.choices[0].message.content;
      
      return {
        originalRecognition: recognizedContent,
        // 为了保持接口一致，这里直接使用原始识别结果
        optimizedResult: recognizedContent
      };
    } catch (error) {
      console.error('AI处理学生试卷失败:', error);
      throw error;
    }
  },
  
  /**
   * 使用deepseek-R1模型分析错题数据
   * @param {Array<Object>} wrongAnswersData - 错题数据数组
   * @returns {Promise<Object>} - 返回模型分析结果
   */
  analyzeWrongAnswersWithDeepseekR1: async (wrongAnswersData) => {
    try {
      console.log('发送给AI的错题数据:', JSON.stringify(wrongAnswersData, null, 2));
      
      // 构建提示文本
      const promptText = `根据该次考试的错题以及错误次数，分析该班学生的短板弱项并给出教学调整建议并且随机推送几道相关习题用作练习。\n\n错题数据：${JSON.stringify(wrongAnswersData, null, 2)}`;
      
      console.log('发送给AI的提示文本:', promptText);
      
      // 构建消息
      const messages = [
        {
          role: "system",
          content: "你是一位专业的教育分析师，擅长分析学生的错题数据，找出学习短板并提供针对性的教学建议。"
        },
        {
          role: "user",
          content: promptText
        }
      ];
      
      // 调用deepseek-R1模型
      const response = await axios.post(ARK_API_URL, {
        model: DEEPSEEK_R1_MODEL_ID,
        stream: false,
        messages: messages
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ARK_API_KEY}`
        }
      });
      
      console.log('AI返回的完整响应:', response.data);
      
      const analysisResult = response.data.choices[0].message.content;
      console.log('AI分析结果:', analysisResult);
      
      return analysisResult;
    } catch (error) {
      console.error('AI分析错题失败:', error);
      throw error;
    }
  },
    analyzeWrongAnswerWithDeepseekR1: async (analysisData) => {
      try {
        const prompt = `请分析以下学生的错题并给出详细的解释：
                        题目类型：${analysisData.questionType}
                        题目内容：${analysisData.questionContent || '无题目内容'}
                        正确答案：${analysisData.correctAnswer}
                        学生答案：${analysisData.studentAnswer}
                        请从以下几个方面进行分析：
                        1. 错误原因分析
                        2. 知识点提示,回答格式为： 
                        1. 题目解析
                        2. 错误原因分析
                        3. 知识点提示，字数在400字左右`;
        console.log(prompt);
    // 构建消息
        const messages = [
          {
            role: "system",
            content: "你是一位专业的教育分析师，擅长分析学生的错题数据，找出学习短板并提供针对性的教学建议。"
          },
          {
            role: "user",
            content: prompt
          }
        ];
        
        // 调用deepseek-V3模型
        const response = await axios.post(ARK_API_URL, {
          model: DEEPSEEK_MODEL_ID,
          stream: false,
          messages: messages
        }, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ARK_API_KEY}`
          }
        });
        
        console.log('AI返回的完整响应:', response.data);
        
        const analysisResult = response.data.choices[0].message.content;
        console.log('AI分析结果:', analysisResult);
        
        return analysisResult;
  
      } catch (error) {
        console.error('AI分析API调用失败:', error);
        throw error;
      }
    },
  /**
   * AI批改解答题
   * @param {Object} gradeData - 批改数据
   * @param {string} gradeData.studentAnswer - 学生答案
   * @param {string} gradeData.standardAnswer - 标准答案
   * @param {number} gradeData.totalScore - 题目总分
   * @returns {Promise<number>} - 返回AI评分结果
   */
  gradeEssayQuestionWithDeepseek: async (gradeData) => {
    try {
      const { studentAnswer, standardAnswer, totalScore } = gradeData;
      
      // 构建提示文本
      const promptText = `
请根据标准答案对学生的解答题答案进行评分。
标准答案：${standardAnswer}
学生答案：${studentAnswer}
总分：${totalScore}分

请仅返回一个数字，表示学生获得的分数（0-${totalScore}之间的数字，不可以有小数）。不要包含任何其他文字或解释。`;
      
      // 构建消息
      const messages = [
        {
          role: "system",
          content: "你是一位专业的教育评分者，根据标准答案对学生的解答题答案进行客观评分。请只返回分数，不要有任何其他文字。"
        },
        {
          role: "user",
          content: promptText
        }
      ];

      const response = await axios.post(ARK_API_URL, {
        model: DEEPSEEK_MODEL_ID,
        stream: false,
        messages: messages
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ARK_API_KEY}`
        }
      });
      console.log(response.data);
      // 提取分数
      let scoreText = response.data.choices[0].message.content.trim();
      const scoreMatch = scoreText.match(/(\d+(\.\d+)?)/);
      if (scoreMatch) {
        scoreText = scoreMatch[0];
      }
      // 转换为数字
      const score = parseFloat(scoreText);
      
      // 确保分数在有效范围内
      const validScore = Math.min(Math.max(0, score), totalScore);
      
      return validScore;
    } catch (error) {
      console.error('AI批改失败:', error);
      throw error;
    }
  },
    /**
   * AI批改解答题
   * @param {Object} gradeData - 批改数据
   * @param {string} gradeData.studentAnswer - 学生答案
   * @param {string} gradeData.standardAnswer - 标准答案
   * @param {number} gradeData.totalScore - 题目总分
   * @returns {Promise<number>} - 返回AI评分结果
   */
  gradeEssayQuestionWithDeepseek: async (gradeData) => {
    try {
      const { studentAnswer, standardAnswer, totalScore } = gradeData;
      
      // 构建提示文本
      const promptText = `
请根据标准答案对学生的解答题答案进行评分。
标准答案：${standardAnswer}
学生答案：${studentAnswer}
总分：${totalScore}分

请仅返回一个数字，表示学生获得的分数（0-${totalScore}之间的数字，不可以有小数）。不要包含任何其他文字或解释。`;
      
      // 构建消息
      const messages = [
        {
          role: "system",
          content: "你是一位专业的教育评分者，根据标准答案对学生的解答题答案进行客观评分。请只返回分数，不要有任何其他文字。"
        },
        {
          role: "user",
          content: promptText
        }
      ];

      const response = await axios.post(ARK_API_URL, {
        model: DEEPSEEK_MODEL_ID,
        stream: false,
        messages: messages
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ARK_API_KEY}`
        }
      });
      console.log(response.data);
      // 提取分数
      let scoreText = response.data.choices[0].message.content.trim();
      const scoreMatch = scoreText.match(/(\d+(\.\d+)?)/);
      if (scoreMatch) {
        scoreText = scoreMatch[0];
      }
      // 转换为数字
      const score = parseFloat(scoreText);
      
      // 确保分数在有效范围内
      const validScore = Math.min(Math.max(0, score), totalScore);
      
      return validScore;
    } catch (error) {
      console.error('AI批改失败:', error);
      throw error;
    }
  },
  
  /**
   * AI批改填空题
   * @param {Object} gradeData - 批改数据
   * @param {string} gradeData.studentAnswer - 学生答案
   * @param {string} gradeData.standardAnswer - 标准答案
   * @param {string} gradeData.questionContent - 题目内容
   * @returns {Promise<boolean>} - 返回AI评判结果，true表示正确，false表示错误
   */
  gradeFillQuestionWithDeepseek: async (gradeData) => {
    try {
      const { studentAnswer, standardAnswer, questionContent } = gradeData;
      
      // 构建提示文本
      const promptText = `
请根据标准答案对学生的填空题答案进行评判。
题目内容：${questionContent || '无题目内容'}
标准答案：${standardAnswer}
学生答案：${studentAnswer || '未作答'}

请仅返回"正确"或"错误"，不要包含任何其他文字或解释。`;
      
      // 构建消息
      const messages = [
        {
          role: "system",
          content: "你是一位专业的教育评分者，根据标准答案对学生的填空题答案进行客观评判。请只返回'正确'或'错误'，不要有任何其他文字。"
        },
        {
          role: "user",
          content: promptText
        }
      ];

      const response = await axios.post(ARK_API_URL, {
        model: DEEPSEEK_MODEL_ID,
        stream: false,
        messages: messages
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ARK_API_KEY}`
        }
      });
      
      console.log('AI批改填空题响应:', response.data);
      
      // 提取结果
      const resultText = response.data.choices[0].message.content.trim().toLowerCase();
      
      // 判断是否正确
      return resultText.includes('正确') || resultText.includes('correct') || resultText.includes('right');
    } catch (error) {
      console.error('AI批改填空题失败:', error);
      throw error;
    }
  },
  
  /**
   * 批量批改学生试卷
   * @param {Object} batchGradeData - 批量批改数据
   * @param {Array} batchGradeData.standardAnswers - 标准答案数组
   * @param {Array} batchGradeData.studentAnswers - 学生答案数组
   * @returns {Promise<Array>} - 返回批改结果数组
   */
  batchGradeStudentPaper: async (batchGradeData) => {
    try {
      const { standardAnswers, studentAnswers } = batchGradeData;
      const results = [];
      
      // 遍历学生答案
      for (let i = 0; i < studentAnswers.length; i++) {
        const studentAnswer = studentAnswers[i];
        
        // 查找对应的标准答案
        const standardAnswer = standardAnswers.find(sa => 
          sa.chineseNumber === studentAnswer.chineseNumber && 
          sa.questionNumber === studentAnswer.questionNumber
        );
        
        if (!standardAnswer) {
          console.warn(`未找到对应的标准答案: ${studentAnswer.chineseNumber}、${studentAnswer.questionNumber}`);
          continue;
        }
        
        // 根据题型进行不同的批改
        let isCorrect = false;
        let score = 0;
        
        // 获取题目类型
        const questionType = standardAnswer.type || 'unknown';
        
        switch (questionType) {
          case 'choice':
          case 'judgment':
            // 选择题和判断题直接比较答案
            isCorrect = studentAnswer.studentAnswer === standardAnswer.answer;
            score = isCorrect ? standardAnswer.score || 0 : 0;
            break;
            
          case 'fill':
            // 填空题使用AI批改
            if (studentAnswer.studentAnswer && standardAnswer.answer) {
              isCorrect = await aiApi.gradeFillQuestionWithDeepseek({
                studentAnswer: studentAnswer.studentAnswer,
                standardAnswer: standardAnswer.answer,
                questionContent: standardAnswer.content || ''
              });
              score = isCorrect ? standardAnswer.score || 0 : 0;
            } else {
              isCorrect = false;
              score = 0;
            }
            break;
            
          case 'essay':
            // 解答题使用AI评分
            if (studentAnswer.studentAnswer && standardAnswer.answer) {
              // 调用deepseek-v3模型评分
              const gradeData = {
                studentAnswer: studentAnswer.studentAnswer,
                standardAnswer: standardAnswer.answer,
                totalScore: standardAnswer.score || 0
              };
              
              // 构建提示文本
              const promptText = `
请根据标准答案对学生的解答题答案进行评分。
题目内容：${standardAnswer.content || '无题目内容'}
标准答案：${standardAnswer.answer}
学生答案：${studentAnswer.studentAnswer || '未作答'}
总分：${standardAnswer.score || 0}分

请仅返回一个数字，表示学生获得的分数（0-${standardAnswer.score || 0}之间的数字，不可以有小数）。不要包含任何其他文字或解释。`;
              
              // 构建消息
              const messages = [
                {
                  role: "system",
                  content: "你是一位专业的教育评分者，根据标准答案对学生的解答题答案进行客观评分。请只返回分数，不要有任何其他文字。"
                },
                {
                  role: "user",
                  content: promptText
                }
              ];

              const response = await axios.post(ARK_API_URL, {
                model: DEEPSEEK_MODEL_ID,
                stream: false,
                messages: messages
              }, {
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${ARK_API_KEY}`
                }
              });
              
              // 提取分数
              let scoreText = response.data.choices[0].message.content.trim();
              const scoreMatch = scoreText.match(/(\d+(\.\d+)?)/);
              if (scoreMatch) {
                scoreText = scoreMatch[0];
              }
              
              // 转换为数字
              score = parseFloat(scoreText);
              
              // 确保分数在有效范围内
              score = Math.min(Math.max(0, score), standardAnswer.score || 0);
              
              // 判断是否完全正确
              isCorrect = score >= (standardAnswer.score || 0);
            } else {
              isCorrect = false;
              score = 0;
            }
            break;
            
          default:
            // 未知题型，默认为错误
            isCorrect = false;
            score = 0;
            break;
        }
        
        // 添加批改结果
        results.push({
          chineseNumber: studentAnswer.chineseNumber,
          questionNumber: studentAnswer.questionNumber,
          studentAnswer: studentAnswer.studentAnswer,
          standardAnswer: standardAnswer.answer,
          isCorrect,
          score,
          questionType
        });
      }
      
      return results;
    } catch (error) {
      console.error('批量批改学生试卷失败:', error);
      throw error;
    }
  }
};