<template>
  <div class="teacher-management">
    <el-card>
      <div slot="header" class="clearfix">
        <span>教师账号管理</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="showAddDialog">添加教师</el-button>
      </div>
      
      <!-- 搜索框 -->
      <div class="search-container" style="margin-bottom: 20px">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名/姓名/邮箱"
          clearable
          @clear="handleSearchClear"
          @input="handleSearch"
          style="width: 300px">
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
      </div>
      
      <!-- 教师列表 -->
      <el-table :data="teachers" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="username" label="用户名"></el-table-column>
        <el-table-column prop="name" label="姓名"></el-table-column>
        <el-table-column prop="email" label="邮箱"></el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template slot-scope="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="mini" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 30, 50]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 添加教师对话框 -->
    <el-dialog title="添加教师" :visible.sync="addDialogVisible" width="40%">
      <el-form :model="teacherForm" :rules="teacherRules" ref="teacherForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="teacherForm.username"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="teacherForm.name"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="teacherForm.password" type="password"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="teacherForm.email"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitTeacherForm" :loading="submitLoading">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 编辑教师对话框 -->
    <el-dialog title="编辑教师" :visible.sync="editDialogVisible" width="40%">
      <el-form :model="teacherForm" :rules="teacherRules" ref="teacherForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="teacherForm.username"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="teacherForm.name"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="teacherForm.password" type="password" placeholder="不修改请留空"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="teacherForm.email"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitEditForm" :loading="submitLoading">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'TeacherManagement',
  data() {
    return {
      searchQuery: '',
      filteredTeachers: [],
      loading: false,
      submitLoading: false,
      teachers: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      addDialogVisible: false,
      editDialogVisible: false,
      currentTeacherId: null,
      teacherForm: {
        username: '',
        name: '',
        password: '',
        email: ''
      },
      teacherRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur', validator: this.validatePassword }
        ],
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getTeachers()
  },
  methods: {
    // 验证密码 - 编辑时可以为空
    validatePassword(rule, value, callback) {
      if (this.editDialogVisible && !value) {
        callback()
      } else if (!value) {
        callback(new Error('请输入密码'))
      } else if (value.length < 6) {
        callback(new Error('密码长度不能小于6位'))
      } else {
        callback()
      }
    },
    // 搜索处理
    handleSearch() {
      const query = this.searchQuery.toLowerCase().trim()
      // 从Vuex store获取完整的教师列表
      const allTeachers = this.$store.state.teachers.teacherList
      
      if (!query) {
        this.filteredTeachers = allTeachers
      } else {
        this.filteredTeachers = allTeachers.filter(teacher => 
          teacher.username.toLowerCase().includes(query) ||
          teacher.name.toLowerCase().includes(query) ||
          teacher.email.toLowerCase().includes(query)
        )
      }
      
      // 重置分页并更新显示
      this.currentPage = 1
      this.updateDisplayTeachers()
    },
    
    // 清空搜索
    handleSearchClear() {
      this.searchQuery = ''
      this.handleSearch()
    },
    
    // 更新显示的教师列表
    updateDisplayTeachers() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      this.teachers = this.filteredTeachers.slice(start, end)
      this.total = this.filteredTeachers.length
    },
    
    // 获取教师列表
    async getTeachers() {
      this.loading = true
      try {
        // 从Vuex获取教师列表
        const teacherList = await this.$store.dispatch('teachers/getTeacherList')
        
        // 确保teacherList是数组
        if (Array.isArray(teacherList)) {
          this.filteredTeachers = teacherList
          this.updateDisplayTeachers()
        } else {
          console.error('获取到的教师列表不是数组:', teacherList)
          this.teachers = []
          this.filteredTeachers = []
          this.total = 0
          this.$message.error('教师数据格式错误')
        }
      } catch (error) {
        console.error('获取教师列表失败:', error)
        this.$message.error('获取教师列表失败')
        this.teachers = []
        this.filteredTeachers = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },
    
    // 处理页码变化
    handleCurrentChange(val) {
      this.currentPage = val
      this.updateDisplayTeachers()
    },
    
    // 处理每页条数变化
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.updateDisplayTeachers()
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    // 显示添加对话框
    showAddDialog() {
      this.addDialogVisible = true
      this.$nextTick(() => {
        this.$refs.teacherForm && this.$refs.teacherForm.resetFields()
        this.teacherForm = {
          username: '',
          name: '',
          password: '',
          email: ''
        }
      })
    },
    // 处理编辑
    handleEdit(row) {
      this.currentTeacherId = row.id
      this.editDialogVisible = true
      this.$nextTick(() => {
        this.$refs.teacherForm && this.$refs.teacherForm.resetFields()
        this.teacherForm = {
          username: row.username,
          name: row.name,
          password: '', // 密码不回显
          email: row.email
        }
      })
    },
    // 处理删除
    handleDelete(row) {
      this.$confirm(`确认删除教师 ${row.name}?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 调用Vuex删除教师
          await this.$store.dispatch('teachers/deleteTeacher', row.id)
          this.$message.success('删除成功')
          // 重新获取教师列表
          this.getTeachers()
        } catch (error) {
          this.$message.error('删除教师失败')
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    // 提交添加表单
    submitTeacherForm() {
      this.$refs.teacherForm.validate(async valid => {
        if (valid) {
          this.submitLoading = true
          try {
            // 调用Vuex添加教师
            await this.$store.dispatch('teachers/addTeacher', {
              username: this.teacherForm.username,
              name: this.teacherForm.name,
              password: this.teacherForm.password,
              email: this.teacherForm.email
            })
            this.addDialogVisible = false
            this.$message.success('添加成功')
            // 重新获取教师列表
            this.getTeachers()
          } catch (error) {
            this.$message.error('添加教师失败')
          } finally {
            this.submitLoading = false
          }
        } else {
          return false
        }
      })
    },
    // 提交编辑表单
    submitEditForm() {
      this.$refs.teacherForm.validate(async valid => {
        if (valid) {
          this.submitLoading = true
          try {
            // 调用Vuex更新教师
            await this.$store.dispatch('teachers/updateTeacher', {
              id: this.currentTeacherId,
              username: this.teacherForm.username,
              name: this.teacherForm.name,
              password: this.teacherForm.password, // 如果为空，store会保留原密码
              email: this.teacherForm.email
            })
            this.editDialogVisible = false
            this.$message.success('更新成功')
            // 重新获取教师列表
            this.getTeachers()
          } catch (error) {
            this.$message.error('更新教师失败')
          } finally {
            this.submitLoading = false
          }
        } else {
          return false
        }
      })
    }
  }
}  
</script>

<style scoped>
.teacher-management {
  padding: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>