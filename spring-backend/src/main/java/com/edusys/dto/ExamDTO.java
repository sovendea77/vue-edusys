package com.edusys.dto;

import com.edusys.model.Exam;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamDTO {
    private Long id;
    
    @NotBlank(message = "考试标题不能为空")
    private String title;
    
    private String description;
    
    @NotNull(message = "教师ID不能为空")
    private Long teacherId;
    
    private Integer totalScore;
    
    private List<QuestionAnswerDTO> questionAnswers;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}