package com.edusys.repository;

import com.edusys.model.StudentWrongAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface StudentWrongAnswerRepository extends JpaRepository<StudentWrongAnswer, Long> {
    /**
     * 根据考试ID和学生ID查找错题
     * @param examId 考试ID
     * @param studentId 学生ID
     * @return 错题列表
     */
    List<StudentWrongAnswer> findByExamIdAndStudentId(Long examId, String studentId);
    
    /**
     * 根据考试ID查找错题
     * @param examId 考试ID
     * @return 错题列表
     */
    List<StudentWrongAnswer> findByExamId(Long examId);
    
    /**
     * 获取错题分析数据
     * @param examId 考试ID
     * @param minErrorCount 最小错误次数
     * @return 错题分析数据
     */
    @Query(value = "SELECT qa.id, qa.section_index, qa.section_type, qa.question_number, qa.chinese_number, " +
            "qa.content, qa.answer as correct_answer, COUNT(swa.id) as error_count " +
            "FROM question_answers qa " +
            "JOIN student_wrong_answers swa ON qa.id = swa.question_id " +
            "WHERE qa.exam_id = :examId " +
            "GROUP BY qa.id " +
            "HAVING COUNT(swa.id) >= :minErrorCount " +
            "ORDER BY error_count DESC", nativeQuery = true)
    List<Map<String, Object>> findWrongAnswersAnalysis(@Param("examId") Long examId, @Param("minErrorCount") Integer minErrorCount);
}