package com.edusys.repository;

import com.edusys.model.QuestionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionAnswerRepository extends JpaRepository<QuestionAnswer, Long> {
    /**
     * 根据考试ID查找题目答案
     * @param examId 考试ID
     * @return 题目答案列表
     */
    List<QuestionAnswer> findByExamId(Long examId);
    
    /**
     * 根据考试ID和题目栏序号查找题目答案
     * @param examId 考试ID
     * @param sectionIndex 题目栏序号
     * @return 题目答案列表
     */
    List<QuestionAnswer> findByExamIdAndSectionIndex(Long examId, Integer sectionIndex);
}