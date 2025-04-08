/**
 * 教师控制器
 */

const { teacherModel } = require('../models');

const teacherController = {
  // 获取所有教师
  getAllTeachers: async (req, res) => {
    try {
      const teachers = await teacherModel.findAll();
      res.json({ success: true, data: teachers });
    } catch (error) {
      console.error('获取教师列表失败:', error);
      res.status(500).json({ success: false, message: '获取教师列表失败' });
    }
  },

  // 获取单个教师
  getTeacherById: async (req, res) => {
    try {
      const { id } = req.params;
      const teacher = await teacherModel.findById(id);
      
      if (!teacher) {
        return res.status(404).json({ success: false, message: '教师不存在' });
      }
      
      res.json({ success: true, data: teacher });
    } catch (error) {
      console.error('获取教师信息失败:', error);
      res.status(500).json({ success: false, message: '获取教师信息失败' });
    }
  },

  // 创建教师
  createTeacher: async (req, res) => {
    try {
      const { username, name, password, email } = req.body;
      
      // 检查用户名是否已存在
      const existingTeacher = await teacherModel.findByUsername(username);
      if (existingTeacher) {
        return res.status(400).json({ success: false, message: '用户名已存在' });
      }
      
      const newTeacher = await teacherModel.create({ username, name, password, email });
      
      // 不返回密码
      delete newTeacher.password;
      
      res.status(201).json({ success: true, data: newTeacher });
    } catch (error) {
      console.error('创建教师失败:', error);
      res.status(500).json({ success: false, message: '创建教师失败' });
    }
  },

  // 更新教师
  updateTeacher: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, name, password, email } = req.body;
      
      // 检查教师是否存在
      const teacher = await teacherModel.findById(id);
      if (!teacher) {
        return res.status(404).json({ success: false, message: '教师不存在' });
      }
      
      // 如果更改了用户名，检查新用户名是否已存在
      if (username !== teacher.username) {
        const existingTeacher = await teacherModel.findByUsername(username);
        if (existingTeacher && existingTeacher.id !== parseInt(id)) {
          return res.status(400).json({ success: false, message: '用户名已存在' });
        }
      }
      
      const updatedTeacher = await teacherModel.update(id, { username, name, password, email });
      
      res.json({ success: true, data: updatedTeacher });
    } catch (error) {
      console.error('更新教师失败:', error);
      res.status(500).json({ success: false, message: '更新教师失败' });
    }
  },

  // 删除教师
  deleteTeacher: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 检查教师是否存在
      const teacher = await teacherModel.findById(id);
      if (!teacher) {
        return res.status(404).json({ success: false, message: '教师不存在' });
      }
      
      await teacherModel.delete(id);
      
      res.json({ success: true, message: '教师删除成功' });
    } catch (error) {
      console.error('删除教师失败:', error);
      res.status(500).json({ success: false, message: '删除教师失败' });
    }
  },

  // 教师登录验证
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // 检查用户名是否存在
      const teacher = await teacherModel.findByUsername(username);
      if (!teacher) {
        return res.status(401).json({ success: false, message: '教师账号或密码错误' });
      }
      
      // 验证密码
      const isPasswordValid = await teacherModel.validatePassword(password, teacher.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: '教师账号或密码错误' });
      }
      
      // 登录成功，返回教师信息（不包含密码）
      const teacherData = {
        id: teacher.id,
        username: teacher.username,
        name: teacher.name,
        email: teacher.email
      };
      
      res.json({ success: true, data: teacherData });
    } catch (error) {
      console.error('教师登录失败:', error);
      res.status(500).json({ success: false, message: '教师登录失败' });
    }
  }
};

module.exports = teacherController;