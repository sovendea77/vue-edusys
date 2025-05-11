package com.edusys.service;

import com.edusys.dto.TeacherDTO;

import java.util.List;

public interface TeacherService {
    /**
     * 获取所有教师
     * @return 教师列表
     */
    List<TeacherDTO> getAllTeachers();
    
    /**
     * 根据ID获取教师
     * @param id 教师ID
     * @return 教师信息
     */
    TeacherDTO getTeacherById(Long id);
    
    /**
     * 创建教师
     * @param teacherDTO 教师信息
     * @return 创建的教师
     */
    TeacherDTO createTeacher(TeacherDTO teacherDTO);
    
    /**
     * 更新教师
     * @param id 教师ID
     * @param teacherDTO 教师信息
     * @return 更新后的教师
     */
    TeacherDTO updateTeacher(Long id, TeacherDTO teacherDTO);
    
    /**
     * 删除教师
     * @param id 教师ID
     * @return 删除结果
     */
    boolean deleteTeacher(Long id);
    
    /**
     * 教师登录
     * @param username 用户名
     * @param password 密码
     * @return 登录结果
     */
    TeacherDTO login(String username, String password);
}