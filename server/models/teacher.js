/**
 * 教师模型
 */

const db = require('../database/db');
const bcrypt = require('bcrypt');

const teacherModel = {
  // 获取所有教师
  findAll: async () => {
    return await db('teachers')
      .select('id', 'username', 'name', 'email', 'created_at as createdAt')
      .orderBy('id', 'desc');
  },

  // 根据ID查找教师
  findById: async (id) => {
    return await db('teachers')
      .select('id', 'username', 'name', 'email', 'created_at as createdAt')
      .where({ id })
      .first();
  },

  // 根据用户名查找教师
  findByUsername: async (username) => {
    return await db('teachers')
      .select('*')
      .where({ username })
      .first();
  },

  // 创建教师
  create: async (teacherData) => {
    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(teacherData.password, salt);

    const [id] = await db('teachers').insert({
      username: teacherData.username,
      name: teacherData.name,
      email: teacherData.email,
      password: hashedPassword
    });

    return { id, ...teacherData };
  },

  // 更新教师信息
  update: async (id, teacherData) => {
    const updateData = {
      username: teacherData.username,
      name: teacherData.name,
      email: teacherData.email
    };

    // 如果提供了新密码，则更新密码
    if (teacherData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(teacherData.password, salt);
    }

    await db('teachers')
      .where({ id })
      .update(updateData);

    return await teacherModel.findById(id);
  },

  // 删除教师
  delete: async (id) => {
    return await db('teachers')
      .where({ id })
      .del();
  },

  // 验证教师密码
  validatePassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
};

module.exports = teacherModel;