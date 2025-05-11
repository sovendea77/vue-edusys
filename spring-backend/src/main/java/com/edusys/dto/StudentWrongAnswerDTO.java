package com.edusys.dto;

import com.edusys.model.StudentWrongAnswer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentWrongAnswerDTO {
    private Long id;
    
    @NotBlank(message = "学生ID不能为空")
    private String studentId;
    
    @NotNull(message = "题目ID不能为空")
    private Long questionId;
    
    @NotNull(message = "考试ID不能为空")
    private Long examId;
    
    private String studentAnswer;
    
    private Boolean isCorrected;
    
    private Double score;
}