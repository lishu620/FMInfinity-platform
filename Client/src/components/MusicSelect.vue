<template>
  <div class="music-select">
    <h2 class="section-title">歌曲信息补充</h2>

    <div class="tip" v-if="isCopyMember || authStore.isSuperAdmin">
      点击歌曲卡片补充歌手、平台、链接等信息
    </div>

    <!-- 歌曲信息填写网格 -->
    <div class="song-grid">
      <div
        class="song-item"
        :class="{ 'has-info': song.link, active: editingSongId === song.id }"
        v-for="song in songs"
        :key="song.id"
        @click="openEditDialog(song)"
      >
        <div class="name">{{ song.name }}</div>
        <div class="submitter" v-if="song.submitter">（{{ song.submitter }}）</div>
        <div class="info-status">
          <el-tag v-if="song.link" type="success" size="small">已填写</el-tag>
          <el-tag v-else type="info" size="small">待填写</el-tag>
        </div>
        <div class="song-meta" v-if="song.vsingers?.length">
          歌手：{{ song.vsingers.map(v => v.vsingerName).join(' / ') }}
        </div>
      </div>
    </div>

    <!-- 填写信息弹窗 -->
    <el-dialog
      v-model="showDialog"
      title="补充信息"
      width="550px"
      :close-on-click-modal="false"
    >
      <el-form label-width="90px" :model="form">
        <el-form-item label="歌曲名称">
          <el-input v-model="form.name" disabled />
        </el-form-item>

        <el-form-item label="歌手名称" prop="artist">
          <el-select
            v-model="form.artistList"
            multiple
            filterable
            placeholder="请选择/搜索歌手"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="item in vsingerList"
              :key="item.id"
              :label="item.value"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="音乐平台" prop="platform">
          <el-select v-model="form.platform" placeholder="选择平台">
            <el-option label="网易云音乐" value="netease" />
            <el-option label="B站" value="bilibili" />
          </el-select>
        </el-form-item>
        <el-form-item label="音乐链接" prop="link">
          <el-input v-model="form.link" placeholder="B站/BV/网易云链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submit">提交保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/store/auth";
import api from "@/store/auth";

const props = defineProps({
  issueId: [String, Number],
  songs: Array,
});

const emit = defineEmits(["refresh"]);
const authStore = useAuthStore();

const editingSongId = ref(null);
const showDialog = ref(false);
const form = ref({
  id: null,
  name: "",
  artistList: [],
  platform: "",
  link: "",
});

// 歌姬列表
const vsingerList = ref([]);

// 权限：文案组 / 超管
const isCopyMember = computed(() => {
  if (!authStore.user) return false;
  return authStore.user.group === "文案组" || authStore.isSuperAdmin;
});
// 打开编辑弹窗（任何文案组成员可编辑任何歌曲）
const openEditDialog = (song) => {
  if (!isCopyMember.value) return;
  editingSongId.value = song.id;

  // 获取已有歌手信息
  const existingArtistIds = song.vsingers?.map(v => v.id) || [];

  form.value = {
    id: song.id,
    name: song.name,
    artistList: existingArtistIds,
    platform: song.type || "",
    link: song.link || "",
  };
  showDialog.value = true;
};

// 提交歌曲信息
const submit = async () => {
  if (!form.value.artistList || form.value.artistList.length === 0) {
    ElMessage.warning("请选择至少一位歌手");
    return;
  }
  if (!form.value.platform || !form.value.link) {
    ElMessage.warning("请完善歌手、平台、链接");
    return;
  }

  try {
    let saveLink = form.value.link.trim();
    if (form.value.platform === "bilibili") {
      const bvMatch = saveLink.match(/BV[A-Za-z0-9]{10,}/);
      saveLink = bvMatch ? bvMatch[0] : saveLink;
    } else if (form.value.platform === "netease") {
      const idMatch = saveLink.match(/[?&]id=(\d+)/);
      saveLink = idMatch ? idMatch[1] : saveLink;
    }

    await api.put(`/issue/${props.issueId}/song/${form.value.id}`, {
      vsingerIds: form.value.artistList,
      link: saveLink,
      type: form.value.platform,
      isSelected: true,
    });

    ElMessage.success("保存成功！");
    showDialog.value = false;
    editingSongId.value = null;
    emit("refresh");
  } catch (e) {
    ElMessage.error("保存失败");
  }
};

// 加载歌姬列表
const loadVsinggers = async () => {
  try {
    const { data } = await api.get("/vsingers");
    vsingerList.value = data.map((item) => ({
      value: item.vsingerName,
      id: item.id,
    }));
  } catch (e) {
    console.error("加载歌姬列表失败", e);
  }
};

onMounted(() => {
  loadVsinggers();
});
</script>

<style scoped>
.music-select {
  margin-top: 30px;
}
.section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
}
.tip {
  background: #f5f5f5;
  padding: 10px 14px;
  border-radius: 6px;
  color: #666;
  margin-bottom: 20px;
  font-size: 14px;
}
.song-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.song-item {
  padding: 16px 14px;
  background: #f7f7f7;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.song-item:hover {
  background: #eef2ff;
  border-color: #a5b4fc;
}
.song-item.active {
  background: #e6f7ee;
  border-color: #00c48c;
}
.song-item.has-info {
  border-color: #c4b5fd;
  background: #faf5ff;
}
.song-item .name {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 6px;
}
.song-item .submitter {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}
.info-status {
  margin-bottom: 6px;
}
.song-meta {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>
