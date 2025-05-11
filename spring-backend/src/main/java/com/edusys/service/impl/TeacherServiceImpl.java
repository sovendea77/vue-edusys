package com.edusys.service.impl;

import com.edusys.dto.TeacherDTO;
import com.edusys.model.Teacher;
import com.edusys.repository.TeacherRepository;
import com.edusys.service.TeacherService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeacherServiceImpl implements TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public List<TeacherDTO> getAllTeachers() {
        return teacherRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public TeacherDTO getTeacherById(Long id) {
        return teacherRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }
    
    @Override
    public TeacherDTO createTeacher(TeacherDTO teacherDTO) {
        // 检查用户名和邮箱是否已存在
        if (teacherRepository.existsByUsername(teacherDTO.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        if (teacherRepository.existsByEmail(teacherDTO.getEmail())) {
            throw new RuntimeException("邮箱已存在");
        }
        
        Teacher teacher = new Teacher();
        BeanUtils.copyProperties(teacherDTO, teacher);
        
        // 加密密码
        teacher.setPassword(passwordEncoder.encode(teacherDTO.getPassword()));
        
        Teacher savedTeacher = teacherRepository.save(teacher);
        return convertToDTO(savedTeacher);
    }
    
    @Override
    public TeacherDTO updateTeacher(Long id, TeacherDTO teacherDTO) {
        return teacherRepository.findById(id)
                .map(teacher -> {
                    // 检查用户名和邮箱是否已被其他用户使用
                    if (!teacher.getUsername().equals(teacherDTO.getUsername()) 
                            && teacherRepository.existsByUsername(teacherDTO.getUsername())) {
                        throw new RuntimeException("用户名已存在");
                    }
                    if (!teacher.getEmail().equals(teacherDTO.getEmail()) 
                            && teacherRepository.existsByEmail(teacherDTO.getEmail())) {
                        throw new RuntimeException("邮箱已存在");
                    }
                    
                    teacher.setUsername(teacherDTO.getUsername());
                    teacher.setName(teacherDTO.getName());
                    teacher.setEmail(teacherDTO.getEmail());
                    
                    // 如果提供了新密码，则更新密码
                    if (teacherDTO.getPassword() != null && !teacherDTO.getPassword().isEmpty()) {
                        teacher.setPassword(passwordEncoder.encode(teacherDTO.getPassword()));
                    }
                    
                    Teacher updatedTeacher = teacherRepository.save(teacher);
                    return convertToDTO(updatedTeacher);
                })
                .orElse(null);
    }
    
    @Override
    public boolean deleteTeacher(Long id) {
        if (teacherRepository.existsById(id)) {
            teacherRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    @Override
    public TeacherDTO login(String username, String password) {
        return teacherRepository.findByUsername(username)
                .filter(teacher -> passwordEncoder.matches(password, teacher.getPassword()))
                .map(this::convertToDTO)
                .orElse(null);
    }
    
    /**
     * 将实体转换为DTO
     * @param teacher 教师实体
     * @return 教师DTO
     */
    private TeacherDTO convertToDTO(Teacher teacher) {
        TeacherDTO teacherDTO = new TeacherDTO();
        BeanUtils.copyProperties(teacher, teacherDTO);
        teacherDTO.setPassword(null); // 不返回密码
        return teacherDTO;
    }
}