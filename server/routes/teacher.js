/**
 * 教师路由
 */

const express = require('express');
const router = express.Router();
const { teacherController } = require('../controllers');

// 获取所有教师
router.get('/', teacherController.getAllTeachers);

// 获取单个教师
router.get('/:id', teacherController.getTeacherById);

// 创建教师
router.post('/', teacherController.createTeacher);

// 更新教师
router.put('/:id', teacherController.updateTeacher);

// 删除教师
router.delete('/:id', teacherController.deleteTeacher);

// 教师登录验证
router.post('/login', teacherController.login);

module.exports = router;