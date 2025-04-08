/**
 * 控制器索引文件
 * 用于集中导出所有控制器
 */

// 导入教师控制器
const teacherController = require('./teacher');
// 导入考试控制器
const examController = require('./exam');
// 导入学生控制器
const studentController = require('./student');

// 示例用户控制器
const userController = {
  // 获取用户信息
  getUserInfo: (req, res) => {
    // 实际项目中会从数据库获取用户信息
    res.json({ success: true, data: { name: '示例用户' } });
  },
  
  // 用户登录
  login: (req, res) => {
    const { username, password } = req.body;
    // 实际项目中会验证用户名和密码
    if (username && password) {
      res.json({ success: true, data: { token: 'sample-token' } });
    } else {
      res.status(400).json({ success: false, message: '用户名或密码不能为空' });
    }
  }
};

// 示例课程控制器
const courseController = {
  // 获取课程列表
  getCourses: (req, res) => {
    // 实际项目中会从数据库获取课程列表
    res.json({ success: true, data: [] });
  }
};

// 导出所有控制器
module.exports = {
  teacherController,
  examController,
  studentController,
  userController,
  courseController
};