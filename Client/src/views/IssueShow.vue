<template>
  <div class="page-container">
    <h1 class="page-title">稿件查看</h1>
    <p class="tip">所有登录用户均可查看文案信息</p>

    <div class="issue-list">
      <div
        class="issue-card"
        v-for="issue in issues"
        :key="issue.id"
        @click="openIssueModal(issue)"
      >
        <div class="title">{{ issue.title }}</div>
        <div class="status status-ing">{{ statusText(issue.status) }}</div>
        <div class="desc">
          本期选择 {{ issue.selectedCount || 0 }} 首 → 点击查看文案
        </div>
      </div>
      <div class="empty" v-if="issues.length === 0">暂无可查看稿件</div>
    </div>

    <el-dialog
      v-model="issueModalVisible"
      :title="
        currentIssue.title ? `${currentIssue.title} - 文案查看` : '文案查看'
      "
      width="1400px"
      :close-on-click-modal="false"
      :before-close="handleDialogClose"
    >
      <!-- 🔥 在这里加导出按钮（只加了这一段） -->
      <div style="text-align: right; margin-bottom: 10px">
        <el-button
          type="primary"
          icon="el-icon-download"
          @click="exportDetailImage"
        >
          导出为图片
        </el-button>
      </div>

      <!-- 🔥 给内容包一层 id，用于导出 -->
      <div id="export-target">
        <div v-if="currentSongs.length === 0" class="empty-box">
          当前没有进入稿件页的歌曲
        </div>

        <div
          v-else
          class="song-card"
          v-for="song in currentSongs"
          :key="song.id"
        >
          <div class="card-body">
            <div class="info-side">
              <div class="votes-badge">总票数：{{ song.totalVotes || 0 }}</div>

              <div class="song-name">{{ song.name }}</div>
              <div class="song-meta">歌手：{{ song.artist || "未知" }}</div>
              <div class="song-meta">
                推荐人：{{ song.submitter || "未知" }}
              </div>
              <div class="song-meta">
                文案组选择人：{{ song.copy?.nickname || "未分配" }}
              </div>
              <div class="song-meta">平台：{{ song.type || "暂无" }}</div>

              <div class="song-meta">
                文案信息：<br />
                {{ song.copy?.content || "暂无文案" }}
              </div>
            </div>

            <div class="player-side">
              <div
                class="player-container"
                v-if="song.link && song.type === 'bilibili'"
              >
                <iframe
                  :src="getEmbedUrl(song.link, song.type)"
                  width="100%"
                  height="320"
                  frameborder="0"
                  allowfullscreen
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                ></iframe>
              </div>
              <div
                class="player-container"
                v-else-if="song.link && song.type === 'netease'"
              >
                <iframe
                  :src="getEmbedUrl(song.link, song.type)"
                  width="100%"
                  height="120"
                  frameborder="0"
                  sandbox="allow-same-origin allow-scripts allow-forms"
                ></iframe>
              </div>
              <div class="no-player" v-else>暂无播放链接</div>
            </div>
          </div>
        </div>
      </div>

      <div style="text-align: right; margin-top: 16px">
        <el-button @click="issueModalVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import api from "@/store/auth";
// 只新增这一行
import html2canvas from "html2canvas";

const issues = ref([]);
const currentIssue = ref({});
const currentSongs = ref([]);
const issueModalVisible = ref(false);

const loadIssues = async () => {
  try {
    const res = await api.get("/issue/show-list");
    issues.value = res.data || [];
  } catch (e) {
    console.error(e);
    ElMessage.error("加载稿件失败");
  }
};

const handleDialogClose = (done) => {
  currentSongs.value = [];
  currentIssue.value = {};
  issueModalVisible.value = false;
  if (done) done();
};

const fetchSongs = async (issueId) => {
  try {
    const res = await api.get(`/issue/${issueId}/show`);
    currentSongs.value = res.data.songs || [];
  } catch (e) {
    console.error(e);
    ElMessage.error("加载歌曲失败");
  }
};

const openIssueModal = async (issue) => {
  currentIssue.value = issue;
  issueModalVisible.value = true;
  await fetchSongs(issue.id);
};

const getEmbedUrl = (link, type) => {
  if (!link) return "";
  if (type === "bilibili")
    return `//player.bilibili.com/player.html?isOutside=true&bvid=${link}&p=1&autoplay=0`;
  if (type === "netease")
    return `//music.163.com/outchain/player?type=2&id=${link}&auto=0&height=80`;
  return "";
};

const statusText = (status) => {
  const map = {
    draft: "草稿",
    submitting: "提交中",
    voting: "投票中",
    confirmed: "已确认",
    published: "已发布",
  };
  return map[status] || status || "-";
};

// 🔥 最终修复版：100%还原网页左右布局，文字左、播放器右
const exportDetailImage = async () => {
  try {
    ElMessage.info("正在生成图片...");

    // 1. 获取真实DOM，克隆一份用于截图
    const realDom = document.getElementById("export-target");
    const cloneDom = realDom.cloneNode(true);

    // 2. 遍历所有歌曲卡片，修复布局 + 替换播放器
    const songCards = cloneDom.querySelectorAll(".song-card");
    songCards.forEach((card, index) => {
      const song = currentSongs.value[index];
      if (!song) return;

      // 3. 找到播放器容器，替换成静态卡片
      const playerContainer = card.querySelector(".player-container");
      if (!playerContainer) return;

      // 4. 根据平台生成对应样式的静态播放器卡片
      if (song.type === "bilibili") {
        playerContainer.innerHTML = `
          <div style="width:100%; height:320px; background:#000; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:16px;">
            <span>B站视频：${song.name}</span>
          </div>
        `;
      } else if (song.type === "netease") {
        playerContainer.innerHTML = `
          <div style="width:100%; height:120px; background:#f5f5f5; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#333; font-size:16px;">
            <span>网易云音乐：${song.name}</span>
          </div>
        `;
      }

      // 🔥 关键：强制保留flex左右布局，不换行
      const cardBody = card.querySelector(".card-body");
      cardBody.style.display = "flex";
      cardBody.style.flexWrap = "nowrap"; // 禁止换行，强制左右并排
      cardBody.style.gap = "24px";
    });

    // 5. 临时插入克隆DOM，截图
    cloneDom.style.position = "absolute";
    cloneDom.style.left = "-9999px";
    cloneDom.style.top = "-9999px";
    cloneDom.style.width = "1400px"; // 强制和弹窗同宽，保证布局
    document.body.appendChild(cloneDom);

    // 6. 截图（完整左右布局）
    const canvas = await html2canvas(cloneDom, {
      useCORS: true,
      scale: 2,
      backgroundColor: "#fff",
      width: cloneDom.scrollWidth,
      height: cloneDom.scrollHeight,
    });

    // 7. 移除临时DOM
    document.body.removeChild(cloneDom);

    // 8. 下载图片
    const a = document.createElement("a");
    a.download = `${currentIssue.value.title || "稿件详情"}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();

    ElMessage.success("导出成功！");
  } catch (e) {
    console.error(e);
    ElMessage.error("导出失败");
  }
};

onMounted(() => {
  loadIssues();
});
</script>

<style scoped>
.issue-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.issue-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  border: 1px solid #eee;
}

.issue-card:hover {
  background: #e6f7ff;
}

.title {
  font-weight: bold;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #00c48c;
  color: #fff;
  margin: 6px 0;
  display: inline-block;
}

.desc {
  color: #999;
  font-size: 13px;
}

.empty {
  grid-column: 1/-1;
  text-align: center;
  padding: 40px;
  color: #999;
}

.song-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.card-body {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.info-side {
  flex: 1;
  min-width: 300px;
}

.votes-badge {
  background: #9f7aea;
  color: #fff;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  display: inline-block;
}

.song-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.song-meta {
  color: #666;
  margin-bottom: 8px;
}

.player-side {
  width: 100%;
  max-width: 650px;
}

.player-container {
  border-radius: 8px;
  overflow: hidden;
}

.no-player {
  padding: 60px;
  text-align: center;
  color: #999;
  background: #f5f5f5;
  border-radius: 8px;
}

.empty-box {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
