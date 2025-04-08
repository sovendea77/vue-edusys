/**
 * 数据模型索引文件
 * 用于集中导出所有数据模型
 */

// 导入教师模型
const teacherModel = require('./teacher');
// 导入考试模型
const examModel = require('./exam');

// 示例用户模型
const userModel = {
  // 模拟数据库表结构
  schema: {
    id: { type: 'integer', primaryKey: true, autoIncrement: true },
    username: { type: 'string', unique: true, required: true },
    password: { type: 'string', required: true },
    email: { type: 'string', unique: true },
    created_at: { type: 'datetime', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'datetime', defaultValue: 'CURRENT_TIMESTAMP' }
  },
  
  // 模拟查询方法
  findByUsername: (username) => {
    // 实际项目中会查询数据库
    return Promise.resolve({ id: 1, username, email: 'example@example.com' });
  }
};

// 示例课程模型
const courseModel = {
  // 模拟数据库表结构
  schema: {
    id: { type: 'integer', primaryKey: true, autoIncrement: true },
    title: { type: 'string', required: true },
    description: { type: 'text' },
    instructor_id: { type: 'integer', references: 'users.id' },
    created_at: { type: 'datetime', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'datetime', defaultValue: 'CURRENT_TIMESTAMP' }
  },
  
  // 模拟查询方法
  findAll: () => {
    // 实际项目中会查询数据库
    return Promise.resolve([]);
  }
};

// 导出所有模型
module.exports = {
  teacherModel,
  examModel,
  userModel,
  courseModel,
  teacherModel
};