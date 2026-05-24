<template>
  <div class="music-select">
    <h2 class="section-title">文案组选择音乐</h2>

    <!-- 显示当前用户已选歌曲 -->
    <div class="top-card" v-if="mySelectedSong">
      <div class="left-info">
        <div class="info-item song-name">{{ mySelectedSong.name }}</div>
        <div class="info-item submitter">
          推荐人：{{ mySelectedSong.submitter || "无" }}
        </div>
        <div class="info-item selected-by" v-if="mySelectedSong.selectedUser">
          选择人：{{ mySelectedSong.selectedUser.nickname }}
        </div>
      </div>
      <div class="right-player">
        <div v-if="mySelectedSong.link" class="player-box">
          <iframe
            :src="getEmbedUrl(mySelectedSong.link, mySelectedSong.type)"
            width="100%"
            height="100%"
            frameborder="0"
            allow="encrypted-media"
            allowfullscreen
          ></iframe>
        </div>
        <div v-else class="no-link-tip">请点击「下一步」填写音乐链接</div>
      </div>
    </div>

    <!-- 未选中时提示 -->
    <div class="tip" v-else>
      每位成员仅限选择 1 首歌曲，选中后点击下一步填写信息
    </div>

    <!-- 歌曲选择网格 -->
    <div class="song-grid">
      <div
        class="song-item"
        :class="{
          active: selectedId === song.id,
          disabled:
            isSongTaken(song.id) ||
            (mySelectedSong && mySelectedSong.id !== song.id),
        }"
        v-for="song in songs"
        :key="song.id"
        @click="selectSong(song)"
      >
        <div class="name">{{ song.name }}</div>
        <div class="user" v-if="song.submitter">（{{ song.submitter }}）</div>
        <div class="taken-text" v-if="isSongTaken(song.id)">
          选择人：{{ getTakenNickname(song.id) }}
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="btn-bar" v-if="isCopyMember || authStore.isSuperAdmin">
      <el-button
        type="primary"
        :disabled="!selectedId"
        @click="openNext"
        v-if="!mySelectedSong"
      >
        下一步：填写音乐信息
      </el-button>

      <el-button
        type="default"
        :disabled="!mySelectedSong"
        @click="resetSelection"
      >
        重置选择
      </el-button>
    </div>

    <!-- 填写信息弹窗 -->
    <el-dialog
      v-model="showDialog"
      title="填写音乐信息"
      width="550px"
      :close-on-click-modal="false"
    >
      <el-form label-width="90px" :model="form" ref="formRef" rules="formRules">
        <el-form-item label="歌曲名称">
          <el-input v-model="form.name" disabled />
        </el-form-item>

        <!-- 🔥 多选歌手 -->
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
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage, ElForm } from "element-plus";
import { useAuthStore } from "@/store/auth";
import api from "@/store/auth";

const props = defineProps({
  issueId: [String, Number],
  songs: Array,
});

const emit = defineEmits(["refresh"]);
const authStore = useAuthStore();

const selectedId = ref(null);
const showDialog = ref(false);
const form = ref({
  id: null,
  name: "",
  artist: "",
  artistList: [], // 多选歌手数组
  platform: "",
  link: "",
});
const formRef = ref(null);

// 歌姬列表
const vsingerList = ref([]);

// 表单校验
const formRules = {
  artist: [{ required: true, message: "请选择歌手", trigger: "blur" }],
  platform: [{ required: true, message: "请选择平台", trigger: "change" }],
  link: [{ required: true, message: "请输入链接", trigger: "blur" }],
};

// 当前用户已选歌曲
const mySelectedSong = computed(() => {
  if (!authStore.user?.id) return null;
  return props.songs.find((s) => s.SelectedUser === authStore.user.id) || null;
});

// 权限：文案组 / 超管
const isCopyMember = computed(() => {
  if (!authStore.user) return false;
  return authStore.user.group === "文案组" || authStore.isSuperAdmin;
});

// 判断歌曲是否被占用
const isSongTaken = (songId) => {
  if (!authStore.user?.id) return false;
  const song = props.songs.find((s) => s.id === songId);
  return !!(song?.SelectedUser && song.SelectedUser !== authStore.user.id);
};

// 获取占用者昵称
const getTakenNickname = (songId) => {
  const song = props.songs.find((s) => s.id === songId);
  return song?.selectedUser?.nickname || "已选择";
};

// 音乐播放地址
const getEmbedUrl = (link, type) => {
  if (!link || !type) return "";
  if (type === "bilibili") {
    return `//player.bilibili.com/player.html?isOutside=true&bvid=${link}&p=1&autoplay=0`;
  }
  if (type === "netease") {
    return `//music.163.com/outchain/player?type=2&id=${link}&auto=0&height=80`;
  }
  return "";
};

// 选择歌曲
const selectSong = (song) => {
  if (!isCopyMember.value) return;
  if (mySelectedSong.value) {
    ElMessage.warning("你已选择过歌曲，无法再选");
    return;
  }
  if (isSongTaken(song.id)) {
    ElMessage.warning("该歌曲已被其他人选择");
    return;
  }
  selectedId.value = selectedId.value === song.id ? null : song.id;
};

// 打开弹窗
const openNext = () => {
  const song = props.songs.find((s) => s.id === selectedId.value);
  if (!song) return;
  form.value = {
    id: song.id,
    name: song.name,
    artist: song.artist || "",
    artistList: song.artist ? song.artist.split(" / ") : [],
    platform: song.type || "",
    link: song.link || "",
  };
  showDialog.value = true;
};

// 提交
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
      SelectedUser: authStore.user.id,
      copierNickname: authStore.user.nickname,
    });

    ElMessage.success("保存成功！");
    showDialog.value = false;
    selectedId.value = null;
    emit("refresh");
  } catch (e) {
    ElMessage.error("保存失败");
  }
};

// 重置选择
const resetSelection = async () => {
  if (!mySelectedSong.value) return;
  try {
    await api.put(`/issue/${props.issueId}/song/${mySelectedSong.value.id}`, {
      copierNickname: "",
      isSelected: false,
      type: "",
      link: "",
      artist: "",
      SelectedUser: null,
    });
    selectedId.value = null;
    ElMessage.success("已重置");
    emit("refresh");
  } catch (e) {
    ElMessage.error("重置失败");
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

watch(
  () => props.songs,
  () => {
    if (mySelectedSong.value) {
      selectedId.value = mySelectedSong.value.id;
    } else {
      selectedId.value = null;
    }
  },
  { deep: true },
);

onMounted(() => {
  loadVsinggers();
  if (mySelectedSong.value) {
    selectedId.value = mySelectedSong.value.id;
  }
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
.top-card {
  display: flex;
  gap: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 380px;
}
.left-info {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}
.info-item {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.info-item.submitter,
.info-item.selected-by {
  font-size: 14px;
  font-weight: normal;
  color: #666;
}
.right-player {
  flex: 1;
  border: 2px solid #333;
  border-radius: 8px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.player-box {
  width: 100%;
  height: 100%;
}
.no-link-tip {
  color: #999;
  font-size: 14px;
  padding: 20px;
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
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.song-item.active {
  background: #e6f7ee;
  border-color: #00c48c;
}
.song-item.disabled {
  background: #e0e0e0 !important;
  cursor: not-allowed !important;
  opacity: 0.7;
}
.song-item .name {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 6px;
}
.song-item .user {
  font-size: 13px;
  color: #999;
}
.taken-text {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 12px;
  color: #999;
}
.btn-bar {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
</style>
