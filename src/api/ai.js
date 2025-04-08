/**
 * AI模型API调用
 */

import axios from 'axios';

// API基础URL和密钥
const ARK_API_KEY = "ef368e0b-4512-41c2-a2c0-4efa63906f6d";
const ARK_API_URL = "https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions";

// 模型ID
const DOUBAO_MODEL_ID = "bot-20250322162347-lxgsm"; // doubao-1.5-vision-pro-32k
const DEEPSEEK_MODEL_ID = "bot-20250322162759-bmj22"; // deepseek-V3
const DEEPSEEK_R1_MODEL_ID = "bot-20250322191644-rrtvm"; // deepseek-R1

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
            text: ""
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
        content: ""
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
        console.error('AI分析API调用失败:', error);
        throw error;
      }
    }
};