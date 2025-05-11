1.项目安装环境要求
1.Node.js：需要安装 Node.js（版本>= 6.0.0）。
2.npm：用于管理依赖包（版本>= 3.0.0）。
3.数据库：
默认开发环境使用 SQLite。
生产环境和测试环境支持 MySQL，需配置 MySQL 数据库连接信息。
4.其他工具：
webpack 用于前端构建。
knex 用于数据库迁移和查询。
2.安装过程
我们将项目发布到了GitHub上，可通过在GitHub上克隆或者直接下载我们提供的压缩包。若是你想直接使用的话，可以直接运行压缩包里的start.bat文件启动。若想本地部署，则参考一下流程：
1.克隆项目：
git clone <https://github.com/sovendea77/vue-edusys.git>
cd vue-edusys-main
2.安装依赖：
npm install
3.配置数据库：
开发环境默认使用 SQLite，无需额外配置。
如果使用 MySQL，修改 config.js 中的 mysql 或 production 配置，确保数据库连接信息正确。
4.运行数据库迁移：
npx knex migrate:latest --env development
5.运行种子数据（可选）：
npx knex seed:run --env development
3.主要流程
本地部署：
1.数据库构建
自行创建edusystem数据库，修改database\config.js里的password为你自己的数据库密码，然后在运行database\migrations\init.sql文件。
2.开发环境启动
启动前端开发服务器：
npm run dev
默认访问地址为 http://localhost:8080。
启动后端服务器：
node server/app.js
默认地址为 http://localhost:3000。
然后就可以在本地访问http://localhost:8080使用了。

直接使用：运行start.bat文件，会自行安装依赖构建环境。点击http://localhost:3000即可使用。
4.注意事项
1.环境变量：
在 .env 文件中配置数据库连接信息和其他环境变量。
示例：
connection: {
      host: '127.0.0.1',
      user: 'root',
      password: ‘yourpassword’,
      database: 'edusystem'
}
2.调试：
使用 npm run build --report 查看打包分析报告。
开启后端日志以调试 API 请求。
3.依赖管理：
确保安装 compression-webpack-plugin。

管理员账号：admin
密码：123456