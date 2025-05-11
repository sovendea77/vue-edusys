package com.edusys.repository;

import com.edusys.model.StudentGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentGradeRepository extends JpaRepository<StudentGrade, Long> {
    /**
     * 根据考试ID查找学生成绩
     * @param examId 考试ID
     * @return 学生成绩列表
     */
    List<StudentGrade> findByExamId(Long examId);
    
    /**
     * 根据考试ID和学生姓名查找学生成绩
     * @param examId 考试ID
     * @param studentName 学生姓名
     * @return 学生成绩
     */
    StudentGrade findByExamIdAndStudentName(Long examId, String studentName);
}