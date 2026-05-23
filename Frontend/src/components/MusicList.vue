<template>
  <!-- 歌曲列表组件 -->
  <div class="mb-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="section-title">歌曲列表</h2>
    </div>

    <el-table :data="songs" border stripe>
      <el-table-column label="序号" width="70" align="center">
        <template #default="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>

      <el-table-column prop="name" label="歌曲名" min-width="200" />
      <el-table-column prop="submitter" label="提交者" min-width="150" />

      <el-table-column
        prop="isAdminInsert"
        label="来源"
        width="110"
        align="center"
      >
        <template #default="scope">
          <el-tag type="info" size="small" v-if="scope.row.isAdminInsert">
            天文台导入
          </el-tag>
          <el-tag type="success" size="small" v-else> 用户投稿 </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="160" align="center">
        <template #default="scope">
          <el-button
            v-if="isAdminOrIssueAdmin"
            type="primary"
            size="small"
            @click="$emit('edit-song', scope.row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="isAdminOrIssueAdmin"
            type="danger"
            size="small"
            @click="$emit('delete-song', scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
defineProps({
  songs: {
    type: Array,
    default: () => [],
  },
  isAdminOrIssueAdmin: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit-song", "delete-song"]);
</script>

<style scoped>
.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
}
</style>
