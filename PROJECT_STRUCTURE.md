# 项目结构说明

## 前端部分 (Frontend)

```
src/
  ├── assets/         # 静态资源文件（图片、字体等）
  ├── components/     # 可复用的Vue组件
  ├── views/          # 页面级Vue组件
  ├── router/         # Vue Router路由配置
  ├── store/          # Vuex状态管理
  ├── api/            # API请求封装
  ├── utils/          # 工具函数
  ├── styles/         # 全局样式文件
  ├── plugins/        # Vue插件
  ├── mixins/         # Vue混入
  ├── directives/     # Vue自定义指令
  ├── filters/        # Vue过滤器
  ├── App.vue         # 根组件
  └── main.js         # 入口文件
```

## 后端部分 (Backend)

```
server/
  ├── config/         # 配置文件
  ├── controllers/    # 控制器（处理请求和响应）
  ├── models/         # 数据模型
  ├── routes/         # 路由定义
  ├── middlewares/    # 中间件
  ├── utils/          # 工具函数
  ├── services/       # 业务逻辑服务
  ├── validators/     # 数据验证
  ├── tests/          # 测试文件
  └── app.js          # 后端入口文件
```

## 数据库部分 (Database)

```
database/
  ├── migrations/     # 数据库迁移文件
  ├── seeds/          # 数据库种子文件
  └── config.js       # 数据库配置
```

## 其他文件

```
public/              # 公共静态资源
dist/                # 构建输出目录
node_modules/        # 依赖包
.env                 # 环境变量
.env.development     # 开发环境变量
.env.production      # 生产环境变量
package.json         # 项目配置和依赖
README.md            # 项目说明
```