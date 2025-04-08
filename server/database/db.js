/**
 * 数据库连接模块
 */

const knex = require('knex');
const config = require('../../database/config');

// 根据环境变量选择配置
const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

// 创建数据库连接实例
const db = knex(dbConfig);

module.exports = db;