package com.edusys.dto;

import com.edusys.model.StudentGrade;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentGradeDTO {
    private Long id;
    
    @NotBlank(message = "学生姓名不能为空")
    private String studentName;
    
    @NotNull(message = "考试ID不能为空")
    private Long examId;
    
    @NotNull(message = "分数不能为空")
    private Double score;
}