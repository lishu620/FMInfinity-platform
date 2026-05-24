<template>
  <div class="updates-container">
    <h1>最新更新日志</h1>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="latestUpdates.length === 0" class="empty">暂无更新记录</div>
    <div v-else class="updates-list">
      <div
        v-for="update in latestUpdates"
        :key="update.fileName"
        class="update-card"
      >
        <div class="update-header">
          <div>
            <h2>前端 v{{ update.client }} / 后端 v{{ update.server }}</h2>
            <div class="update-date">发布日期：{{ update.date }}</div>
          </div>
          <span class="version-badge" v-if="update.isLatest">最新</span>
        </div>
        <div class="update-content" v-html="update.renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { marked } from "marked";

const loading = ref(true);
const latestUpdates = ref([]);

function parseFrontmatter(markdown) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);
  if (!match) {
    return { data: {}, content: markdown };
  }
  const yamlContent = match[1];
  const markdownContent = match[2];
  const data = {};
  const lines = yamlContent.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, content: markdownContent };
}

function parseDate(dateStr) {
  const [year, month, day] = dateStr.split(".").map(Number);
  return new Date(year, month - 1, day);
}

onMounted(async () => {
  try {
    // 注意：移除了 as: 'raw'，依赖自定义插件将 .md 导出为字符串
    const modules = import.meta.glob("/src/updates/*.md", { eager: true });
    console.log("找到的文件：", Object.keys(modules));

    const updatesData = [];
    for (const [path, module] of Object.entries(modules)) {
      const rawContent = module.default; // 关键：通过 .default 获取字符串内容
      const fileName = path.split("/").pop();
      const { data, content } = parseFrontmatter(rawContent);

      if (!data.client || !data.server || !data.date) {
        console.warn(`文件 ${fileName} 缺少必要字段`, data);
        continue;
      }

      const renderedHtml = await marked.parse(content);
      updatesData.push({
        fileName,
        client: data.client,
        server: data.server,
        date: data.date,
        renderedContent: renderedHtml,
      });
    }

    updatesData.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    const latest = updatesData.slice(0, 3);
    if (latest.length > 0) latest[0].isLatest = true;
    latestUpdates.value = latest;
  } catch (error) {
    console.error("加载更新日志失败:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.updates-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
}

h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  border-bottom: 3px solid #42b983;
  padding-bottom: 0.5rem;
  margin-bottom: 2rem;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #7f8c8d;
}

.update-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.update-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.update-header {
  background: linear-gradient(135deg, #42b983 0%, #2c3e50 100%);
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.update-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.update-date {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.version-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.update-content {
  padding: 1.5rem;
  line-height: 1.6;
  color: #34495e;
}

.update-content :deep(h1),
.update-content :deep(h2),
.update-content :deep(h3) {
  color: #2c3e50;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.update-content :deep(h1) {
  font-size: 1.8rem;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 0.3rem;
}

.update-content :deep(h2) {
  font-size: 1.5rem;
}

.update-content :deep(p) {
  margin: 0.8em 0;
}

.update-content :deep(ul),
.update-content :deep(ol) {
  padding-left: 1.5em;
  margin: 0.8em 0;
}

.update-content :deep(li) {
  margin: 0.3em 0;
}

.update-content :deep(code) {
  background: #f4f4f4;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 0.9em;
}

.update-content :deep(pre) {
  background: #f4f4f4;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}
</style>
