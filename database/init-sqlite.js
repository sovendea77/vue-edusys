/**
 * SQLite 数据库初始化脚本
 */
const fs = require('fs');
const path = require('path');
const db = require('../server/database/db');

async function initDatabase() {
  
  // 检查数据库文件是否存在
  const dbPath = path.join(__dirname, 'edusystem.sqlite');
  const dbExists = fs.existsSync(dbPath);
  
  if (!dbExists) {
    
    // 创建教师表
    await db.schema.createTable('teachers', table => {
      table.increments('id').primary();
      table.string('username', 50).notNullable().unique();
      table.string('name', 100).notNullable();
      table.string('email', 100).notNullable().unique();
      table.string('password', 255).notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    
    // 创建考试表
    await db.schema.createTable('exams', table => {
      table.increments('id').primary();
      table.string('title', 100).notNullable();
      table.text('description');
      table.integer('teacher_id').notNullable();
      table.integer('total_score').defaultTo(0);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
      table.foreign('teacher_id').references('id').inTable('teachers').onDelete('CASCADE');
    });
    
    // 创建题目答案表
    await db.schema.createTable('question_answers', table => {
      table.increments('id').primary();
      table.integer('exam_id').notNullable();
      table.integer('section_index').notNullable();
      table.string('section_type', 20).notNullable();
      table.integer('question_number').notNullable();
      table.string('chinese_number', 10).nullable();
      table.text('content').nullable();
      table.string('answer', 255).notNullable();
      table.integer('score').notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.foreign('exam_id').references('id').inTable('exams').onDelete('CASCADE');
    });
    
    // 创建学生错题表
    await db.schema.createTable('student_wrong_answers', table => {
      table.increments('id').primary();
      table.string('student_id', 255).notNullable();
      table.integer('question_id').notNullable();
      table.integer('exam_id').notNullable();
      table.string('student_answer', 255).nullable();
      table.boolean('is_corrected').defaultTo(false);
      table.decimal('score', 5, 2).defaultTo(0);
      table.foreign('question_id').references('id').inTable('question_answers').onDelete('CASCADE');
      table.foreign('exam_id').references('id').inTable('exams').onDelete('CASCADE');
    });
    
    // 创建学生成绩表
    await db.schema.createTable('student_grade', table => {
      table.increments('id').primary();
      table.string('student_name', 255).notNullable();
      table.integer('exam_id').notNullable();
      table.decimal('score', 5, 2).notNullable();
      table.foreign('exam_id').references('id').inTable('exams').onDelete('CASCADE');
    });
    
    // 创建默认管理员账号
    await db('teachers').insert({
      username: 'admin',
      name: '管理员',
      email: 'admin@example.com',
      password: '$2b$10$X7SLlL9K9X9uV9UA9T3kOeRz5FQGj.wOL0xj1sM1U/P8.UbGRZuMa' // 123456
    });
    
  } else {
  }
}

// 执行初始化
initDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    process.exit(1);
  });