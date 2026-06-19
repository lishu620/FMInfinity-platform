<template>
  <div class="page-container">
    <h1 class="page-title">稿件投票</h1>
    <p class="tip">每首歌最多可投 {{ maxVote }} 票，可对多首歌曲分别投票</p>

    <div class="issue-list">
      <div
        class="issue-card"
        v-for="issue in votingIssues"
        :key="issue.id"
        @click="openVoteModal(issue)"
      >
        <div class="title">{{ issue.title }}</div>
        <div class="status status-ing">投票中</div>
        <div class="desc">点击投票 →</div>
      </div>
      <div class="empty" v-if="votingIssues.length === 0">
        暂无正在投票中的稿件
      </div>
    </div>

    <el-dialog
      v-model="voteModalVisible"
      title="歌曲投票"
      width="1400px"
      :close-on-click-modal="false"
      :before-close="handleDialogClose"
    >
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="歌曲投票" name="songVote">
          <div class="song-vote-card" v-for="song in currentSongs" :key="song.id">
        <div class="card-body">
          <div class="info-side">
            <div class="votes-badge">
              总票数：{{ voteResultMap[currentIssue.id]?.[song.id] || 0 }}
            </div>

            <div class="song-name">{{ song.name }}</div>
            <div class="submitter">
              歌手：{{
                song.vsingers?.map((v) => v.vsingerName).join(" / ") || "未知"
              }}
            </div>
            <div class="recommender">
              投票人：
              <template v-if="song.voterDetails?.length">
                {{
                  song.voterDetails
                    .map((v) => `${v.nickname}（${v.voteCount}票）`)
                    .join("、")
                }}
              </template>
              <template v-else>暂无</template>
            </div>

            <div class="vote-rate-row" v-if="!isVoted(song.id)">
              <span>投出票数：</span>
              <el-rate
                v-model="mySongScores[song.id]"
                :max="maxVote"
                show-text
                :texts="rateTexts"
              />
            </div>

            <div class="voted-tip" v-if="isVoted(song.id)">
              你已投 {{ mySongScores[song.id] }} 票
            </div>

            <div class="vote-btn-row" v-if="isVoted(song.id)">
              <el-button type="warning" plain @click="resetVote(song)">
                重置本人投票
              </el-button>
            </div>

            <div class="vote-btn-row" v-if="!isVoted(song.id)">
              <el-button
                type="danger"
                @click="submitVote(song)"
                :disabled="!mySongScores[song.id]"
              >
                确认投票
              </el-button>
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

      <div style="text-align: right; margin-top: 16px">
        <el-button @click="voteModalVisible = false">关闭</el-button>
      </div>
        </el-tab-pane>

        <el-tab-pane label="个人投票统计" name="userStats">
          <div class="user-stats-table" v-if="userStats.length > 0">
            <el-table :data="userStats" stripe border style="width: 100%" max-height="500">
              <el-table-column type="index" label="排名" width="60" align="center" />
              <el-table-column prop="nickname" label="用户昵称" min-width="150" />
              <el-table-column prop="username" label="用户名" min-width="120" />
              <el-table-column prop="totalVotes" label="总投票数" width="120" align="center" sortable>
                <template #default="{ row }">
                  <el-tag type="danger" size="large">{{ row.totalVotes }} 票</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="votedSongs" label="已投票歌曲数" width="130" align="center" sortable>
                <template #default="{ row }">
                  <span>{{ row.votedSongs }} 首</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="empty" v-else>
            暂无投票数据
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/store/auth";
import api from "@/store/auth";

const authStore = useAuthStore();

const votingIssues = ref([]);
const voteModalVisible = ref(false);
const currentIssue = ref({ id: null });
const currentSongs = ref([]);
const voteResultMap = ref({});
const mySongScores = ref({});
const userVotedList = ref([]);
const activeTab = ref("songVote");
const userStats = ref([]);

const maxVote = computed(() => {
  return authStore.maxVote;
});

const isVoted = (songId) => {
  return userVotedList.value.some((v) => v.songId === songId);
};

const getEmbedUrl = (link, type) => {
  if (!link) return "";
  if (type === "bilibili")
    return `//player.bilibili.com/player.html?isOutside=true&bvid=${link}&p=1&autoplay=0`;
  if (type === "netease")
    return `//music.163.com/outchain/player?type=2&id=${link}&auto=0&height=80`;
  return "";
};

const resetVote = async (song) => {
  const issueId = currentIssue.value.id;

  try {
    await api.post(`/vote/issue/${issueId}/reset`, {
      songId: song.id,
    });

    ElMessage.success("已重置本人投票");

    userVotedList.value = userVotedList.value.filter(
      (v) => v.songId !== song.id,
    );

    mySongScores.value[song.id] = 1;

    const s = await api.get(`/vote/issue/${issueId}/songs`);
    currentSongs.value = s.data;

    const v = await api.get(`/vote/issue/${issueId}/my-vote`);
    userVotedList.value = v.data || [];

    currentSongs.value.forEach((songItem) => {
      const found = userVotedList.value.find((v) => v.songId === songItem.id);
      mySongScores.value[songItem.id] = found ? found.voteCount : 1;
    });

    const r = await api.get(`/vote/issue/${issueId}/result`);
    voteResultMap.value[issueId] = r.data || {};

    const stats = await api.get(`/vote/issue/${issueId}/user-stats`);
    userStats.value = stats.data || [];
  } catch (e) {
    console.error(e);
    ElMessage.error(e?.response?.data?.message || "重置投票失败");
  }
};

const loadVotingIssues = async () => {
  try {
    const res = await api.get("/vote/issues");
    votingIssues.value = res.data;
  } catch (e) {
    console.error(e);
    ElMessage.error("加载稿件失败");
  }
};

const openVoteModal = async (issue) => {
  currentIssue.value = issue;
  voteModalVisible.value = true;
  mySongScores.value = {};
  userVotedList.value = [];

  try {
    const s = await api.get(`/vote/issue/${issue.id}/songs`);
    currentSongs.value = s.data;

    const v = await api.get(`/vote/issue/${issue.id}/my-vote`);
    userVotedList.value = v.data || [];

    currentSongs.value.forEach((song) => {
      const found = userVotedList.value.find((v) => v.songId === song.id);
      mySongScores.value[song.id] = found ? found.voteCount : 1;
    });

    const r = await api.get(`/vote/issue/${issue.id}/result`);
    voteResultMap.value[issue.id] = r.data || {};

    const stats = await api.get(`/vote/issue/${issue.id}/user-stats`);
    userStats.value = stats.data || [];
  } catch (e) {
    console.error(e);
    ElMessage.error("加载投票数据失败");
  }
};

const submitVote = async (song) => {
  const issueId = currentIssue.value.id;
  const score = mySongScores.value[song.id];
  if (!score) return ElMessage.warning("请选择票数");

  try {
    await api.post(`/vote/issue/${issueId}/submit`, {
      songId: song.id,
      voteCount: score,
    });

    ElMessage.success("投票成功！");

    const s = await api.get(`/vote/issue/${issueId}/songs`);
    currentSongs.value = s.data;

    const v = await api.get(`/vote/issue/${issueId}/my-vote`);
    userVotedList.value = v.data || [];

    currentSongs.value.forEach((songItem) => {
      const found = userVotedList.value.find((v) => v.songId === songItem.id);
      mySongScores.value[songItem.id] = found ? found.voteCount : 1;
    });

    const r = await api.get(`/vote/issue/${issueId}/result`);
    voteResultMap.value[issueId] = r.data || {};

    const stats = await api.get(`/vote/issue/${issueId}/user-stats`);
    userStats.value = stats.data || [];
  } catch (e) {
    console.error(e);
    ElMessage.error(e?.response?.data?.message || "投票失败");
  }
};

const rateTexts = computed(() => {
  const texts = [];
  for (let i = 1; i <= maxVote.value; i++) {
    texts.push(`${i} 票`);
  }
  return texts;
});

const handleDialogClose = (done) => {
  mySongScores.value = {};
  userVotedList.value = [];
  currentSongs.value = [];
  currentIssue.value = { id: null };
  activeTab.value = "songVote";
  userStats.value = [];
  done();
};

onMounted(() => loadVotingIssues());
</script>

<style scoped>
.issue-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.issue-card {
  background: var(--card-bg, rgba(255, 255, 255, 0.65));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--card-border, rgba(255, 255, 255, 0.3));
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: background 0.2s;
}
.issue-card:hover {
  background: var(--primary-color-light, #e6f7ff);
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
.song-vote-card {
  background: var(--card-bg, rgba(255, 255, 255, 0.65));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--card-border, rgba(255, 255, 255, 0.3));
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}
.card-body {
  display: flex;
  gap: 24px;
}
.info-side {
  flex: 1;
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
.submitter,
.recommender {
  color: #666;
  margin-bottom: 8px;
}
.my-score-tag {
  color: #00c48c;
  font-weight: bold;
  margin-left: 4px;
}
.vote-rate-row {
  margin: 16px 0;
  display: flex;
  align-items: center;
}
.voted-tip {
  color: #00c48c;
  font-weight: bold;
  margin: 16px 0;
}
.vote-btn-row {
  margin-top: 10px;
}
.player-side {
  width: 650px;
}
.player-container {
  border-radius: 8px;
  overflow: hidden;
}
.user-stats-table {
  margin-top: 8px;
}
:deep(.el-tabs--border-card) {
  border: none;
  box-shadow: none;
}
:deep(.el-tabs--border-card > .el-tabs__header) {
  background: var(--card-bg, rgba(255, 255, 255, 0.5));
  border-bottom: 1px solid var(--card-border, #e4e7ed);
}
:deep(.el-tabs--border-card > .el-tabs__content) {
  padding: 16px 0;
}
.no-player {
  padding: 60px;
  text-align: center;
  color: #999;
  background: #f5f5f5;
  border-radius: 8px;
}

/* ========== 响应式 ========== */
@media (max-width: 1023px) {
  .card-body {
    flex-direction: column;
    gap: 16px;
  }
  .player-side {
    width: 100%;
  }
  .player-container iframe {
    height: 240px;
  }
}

@media (max-width: 767px) {
  .song-vote-card {
    padding: 14px;
    margin-bottom: 12px;
  }
  .song-name {
    font-size: 17px;
  }
  .issue-list {
    grid-template-columns: 1fr;
  }
  .no-player {
    padding: 30px;
  }
}
</style>
