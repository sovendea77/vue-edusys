@echo off
chcp 65001
echo 正在启动多模态试卷自动批改系统...

echo 正在安装依赖...
call npm install

echo 正在初始化...
node database/init-sqlite.js

call npm run build

echo 正在启动服务器...
node server.js
pause
