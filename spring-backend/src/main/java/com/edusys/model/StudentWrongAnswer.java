package com.edusys.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "student_wrong_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentWrongAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "student_id", nullable = false)
    private String studentId; // 学生姓名
    
    @Column(name = "question_id", nullable = false)
    private Long questionId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", insertable = false, updatable = false)
    private QuestionAnswer questionAnswer;
    
    @Column(name = "exam_id", nullable = false)
    private Long examId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", insertable = false, updatable = false)
    private Exam exam;
    
    @Column(name = "student_answer")
    private String studentAnswer;
    
    @Column(name = "is_corrected")
    private Boolean isCorrected;
    
    @Column
    private Double score;
}