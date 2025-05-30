/**
 * 数据库配置文件
 */

module.exports = {
  //使用打包的sqlite数据库
  development: {
    // 开发环境数据库配置
    client: 'sqlite3',//mysql2
    connection: {
      filename: './database/edusystem.sqlite'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  //使用本地Mysql数据库,若要使用则注释掉上面部分，用development:替换掉下面的mysql:
  mysql: {
    client: 'mysql2',
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: '123456',
      database: 'edusystem'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  
  test: {
    // 测试环境数据库配置
    client: 'mysql2',
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: 'sovendea',
      database: 'edusystem_test'
    },
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds/test'
    }
  },
  
  production: {
    // 生产环境数据库配置
    client: 'mysql2',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'edusystem'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migrations'
    }
  }
};