package com.edusys.service;

import com.edusys.dto.ExamDTO;
import com.edusys.dto.QuestionAnswerDTO;

import java.util.List;
import java.util.Map;

public interface ExamService {
    /**
     * 创建考试
     * @param examDTO 考试信息
     * @return 创建的考试
     */
    ExamDTO createExam(ExamDTO examDTO);
    
    /**
     * 根据ID获取考试
     * @param id 考试ID
     * @return 考试信息
     */
    ExamDTO getExamById(Long id);
    
    /**
     * 根据教师ID获取考试列表
     * @param teacherId 教师ID
     * @return 考试列表
     */
    List<ExamDTO> getExamsByTeacherId(Long teacherId);
    
    /**
     * 保存题目答案
     * @param examId 考试ID
     * @param sections 题目答案列表
     * @return 保存结果
     */
    boolean saveAnswers(Long examId, Map<String, List<QuestionAnswerDTO>> sections);
}