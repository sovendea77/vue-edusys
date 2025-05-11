package com.edusys.repository;

import com.edusys.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    /**
     * 根据用户名查找教师
     * @param username 用户名
     * @return 教师信息
     */
    Optional<Teacher> findByUsername(String username);
    
    /**
     * 根据邮箱查找教师
     * @param email 邮箱
     * @return 教师信息
     */
    Optional<Teacher> findByEmail(String email);
    
    /**
     * 检查用户名是否存在
     * @param username 用户名
     * @return 是否存在
     */
    boolean existsByUsername(String username);
    
    /**
     * 检查邮箱是否存在
     * @param email 邮箱
     * @return 是否存在
     */
    boolean existsByEmail(String email);
}