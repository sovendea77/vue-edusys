package com.edusys.service.impl;

import com.edusys.dto.ExamDTO;
import com.edusys.dto.QuestionAnswerDTO;
import com.edusys.model.Exam;
import com.edusys.model.QuestionAnswer;
import com.edusys.repository.ExamRepository;
import com.edusys.repository.QuestionAnswerRepository;
import com.edusys.service.ExamService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final QuestionAnswerRepository questionAnswerRepository;
    
    public ExamServiceImpl(ExamRepository examRepository, QuestionAnswerRepository questionAnswerRepository) {
        this.examRepository = examRepository;
        this.questionAnswerRepository = questionAnswerRepository;
    }
    
    @Override
    @Transactional
    public ExamDTO createExam(ExamDTO examDTO) {
        Exam exam = new Exam();
        BeanUtils.copyProperties(examDTO, exam);
        
        Exam savedExam = examRepository.save(exam);
        
        // 使用Optional处理可能为空的集合，避免空指针异常
        Optional.ofNullable(examDTO.getQuestionAnswers())
                .filter(answers -> !answers.isEmpty())
                .ifPresent(answers -> {
                    List<QuestionAnswer> questionAnswers = answers.stream()
                            .map(dto -> {
                                QuestionAnswer questionAnswer = new QuestionAnswer();
                                BeanUtils.copyProperties(dto, questionAnswer);
                                questionAnswer.setExamId(savedExam.getId());
                                return questionAnswer;
                            })
                            .collect(Collectors.toList());
                    
                    questionAnswerRepository.saveAll(questionAnswers);
                });
        
        return convertToDTO(savedExam);
    }
    
    @Override
    public ExamDTO getExamById(Long id) {
        return examRepository.findById(id)
                .map(exam -> {
                    ExamDTO examDTO = convertToDTO(exam);
                    
                    // 获取题目答案并设置到DTO中
                    List<QuestionAnswerDTO> questionAnswerDTOs = questionAnswerRepository.findByExamId(exam.getId())
                            .stream()
                            .map(this::convertToQuestionAnswerDTO)
                            .collect(Collectors.toList());
                    
                    examDTO.setQuestionAnswers(questionAnswerDTOs);
                    return examDTO;
                })
                .orElse(null);
    }
    
    @Override
    public List<ExamDTO> getExamsByTeacherId(Long teacherId) {
        return examRepository.findByTeacherId(teacherId).stream()
                .map(this::convertToDTO)
                .toList(); // 使用Java 16+的toList()方法替代collect(Collectors.toList())
    }
    
    @Override
    @Transactional
    public boolean saveAnswers(Long examId, Map<String, List<QuestionAnswerDTO>> sections) {
        // 验证考试是否存在
        if (!examRepository.existsById(examId)) {
            return false;
        }
        
        // 删除原有的题目答案
        List<QuestionAnswer> existingAnswers = questionAnswerRepository.findByExamId(examId);
        if (!existingAnswers.isEmpty()) {
            questionAnswerRepository.deleteAll(existingAnswers);
        }
        
        // 保存新的题目答案
        List<QuestionAnswer> newAnswers = new ArrayList<>();
        
        // 使用Map定义题型配置，简化代码
        Map<String, SectionConfig> sectionConfigs = Map.of(
            "choice", new SectionConfig(1, "choice", "一"),
            "fill", new SectionConfig(2, "fill", "二"),
            "judgment", new SectionConfig(3, "judgment", "三"),
            "essay", new SectionConfig(4, "essay", "四")
        );
        
        // 使用Stream API处理所有题型
        sections.forEach((sectionType, dtoList) -> {
            if (sectionConfigs.containsKey(sectionType)) {
                SectionConfig config = sectionConfigs.get(sectionType);
                
                for (int i = 0; i < dtoList.size(); i++) {
                    QuestionAnswerDTO dto = dtoList.get(i);
                    QuestionAnswer questionAnswer = new QuestionAnswer();
                    BeanUtils.copyProperties(dto, questionAnswer);
                    questionAnswer.setExamId(examId);
                    questionAnswer.setSectionIndex(config.sectionIndex);
                    questionAnswer.setSectionType(config.sectionType);
                    questionAnswer.setQuestionNumber(i + 1);
                    questionAnswer.setChineseNumber(config.chineseNumber);
                    newAnswers.add(questionAnswer);
                }
            }
        });
        
        questionAnswerRepository.saveAll(newAnswers);
        
        // 更新考试总分
        int totalScore = newAnswers.stream().mapToInt(QuestionAnswer::getScore).sum();
        examRepository.findById(examId).ifPresent(exam -> {
            exam.setTotalScore(totalScore);
            examRepository.save(exam);
        });
        
        return true;
    }
    
    /**
     * 题型配置内部类
     */
    private static class SectionConfig {
        private final int sectionIndex;
        private final String sectionType;
        private final String chineseNumber;
        
        public SectionConfig(int sectionIndex, String sectionType, String chineseNumber) {
            this.sectionIndex = sectionIndex;
            this.sectionType = sectionType;
            this.chineseNumber = chineseNumber;
        }
    }
    
    /**
     * 将实体转换为DTO
     * @param exam 考试实体
     * @return 考试DTO
     */
    private ExamDTO convertToDTO(Exam exam) {
        var examDTO = new ExamDTO(); // 使用var类型推断
        BeanUtils.copyProperties(exam, examDTO);
        return examDTO;
    }
    
    /**
     * 将题目答案实体转换为DTO
     * @param questionAnswer 题目答案实体
     * @return 题目答案DTO
     */
    private QuestionAnswerDTO convertToQuestionAnswerDTO(QuestionAnswer questionAnswer) {
        var dto = new QuestionAnswerDTO(); // 使用var类型推断
        BeanUtils.copyProperties(questionAnswer, dto);
        return dto;
    }
}