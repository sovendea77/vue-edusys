package com.edusys.dto;

import com.edusys.model.QuestionAnswer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionAnswerDTO {
    private Long id;
    
    @NotNull(message = "考试ID不能为空")
    private Long examId;
    
    @NotNull(message = "题目栏序号不能为空")
    private Integer sectionIndex;
    
    @NotBlank(message = "题目类型不能为空")
    private String sectionType;
    
    @NotNull(message = "题目序号不能为空")
    private Integer questionNumber;
    
    private String chineseNumber;
    
    private String content;
    
    @NotBlank(message = "答案不能为空")
    private String answer;
    
    @NotNull(message = "分数不能为空")
    private Integer score;
    
    private LocalDateTime createdAt;
}