package com.edusys.service;

import com.edusys.dto.StudentGradeDTO;
import com.edusys.dto.StudentWrongAnswerDTO;

import java.util.List;
import java.util.Map;

public interface StudentService {
    /**
     * 保存学生错题答案
     * @param examId 考试ID
     * @param studentId 学生ID
     * @param answers 错题答案列表
     * @return 保存结果
     */
    boolean saveStudentWrongAnswers(Long examId, String studentId, List<StudentWrongAnswerDTO> answers);
    
    /**
     * 获取考试成绩统计信息
     * @param examId 考试ID
     * @return 统计信息
     */
    Map<String, Object> getExamStatistics(Long examId);
    
    /**
     * 保存学生成绩
     * @param examId 考试ID
     * @return 保存结果
     */
    boolean saveStudentGrades(Long examId);
    
    /**
     * 获取错题分析数据
     * @param examId 考试ID
     * @param minErrorCount 最小错误次数
     * @return 错题分析数据
     */
    List<Map<String, Object>> getWrongAnswersAnalysis(Long examId, Integer minErrorCount);
}