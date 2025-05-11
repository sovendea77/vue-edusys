package com.edusys.repository;

import com.edusys.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    /**
     * 根据教师ID查找考试
     * @param teacherId 教师ID
     * @return 考试列表
     */
    List<Exam> findByTeacherId(Long teacherId);
}