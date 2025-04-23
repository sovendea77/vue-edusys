const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./server/routes');
const app = express();

// 启用 CORS
app.use(cors());

// 解析 JSON 请求体
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 配置 API 路由
app.use('/api/teachers', routes.teacherRoutes);
app.use('/api/exams', routes.examRoutes);
app.use('/api/students', routes.studentRoutes);

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 所有其他路由返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
  console.log(`服务器已启动: http://localhost:${PORT}`);
});