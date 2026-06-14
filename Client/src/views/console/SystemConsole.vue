<template>
  <div class="page-container">
    <h1 class="page-title">系统管理</h1>

    <!-- 数据库连接状态 -->
    <div class="section">
      <h2 class="section-title">数据库连接状态</h2>
      <el-card>
        <div v-if="dbStatus" class="db-status">
          <div class="db-row">
            <span class="db-label">连接状态：</span>
            <el-tag :type="dbStatus.connected ? 'success' : 'danger'" size="large">
              {{ dbStatus.connected ? '已连接' : '连接失败' }}
            </el-tag>
          </div>
          <div class="db-row">
            <span class="db-label">数据库类型：</span>
            <span class="db-value">{{ dbStatus.dialect }}</span>
          </div>
          <div class="db-row">
            <span class="db-label">数据库名称：</span>
            <span class="db-value">{{ dbStatus.database }}</span>
          </div>
          <div class="db-row">
            <span class="db-label">主机地址：</span>
            <span class="db-value">{{ dbStatus.host }}</span>
          </div>
          <div class="db-row">
            <span class="db-label">端口：</span>
            <span class="db-value">{{ dbStatus.port }}</span>
          </div>
          <div v-if="!dbStatus.connected" class="db-row">
            <span class="db-label">错误信息：</span>
            <span class="db-value text-red-500">{{ dbStatus.error }}</span>
          </div>
          <div class="db-row" style="margin-top: 12px">
            <el-button size="small" @click="fetchDbStatus" :loading="dbLoading">
              刷新状态
            </el-button>
          </div>
        </div>
        <div v-else class="empty-tip">
          加载中...
        </div>
      </el-card>
    </div>

    <!-- 数据库迁移 -->
    <div class="section">
      <h2 class="section-title">数据库迁移</h2>
      <el-card>
        <el-form label-width="110px">
          <el-form-item label="目标数据库类型">
            <el-radio-group v-model="migration.targetDialect">
              <el-radio value="mysql">MySQL</el-radio>
              <el-radio value="sqlite">SQLite</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- MySQL 配置 -->
          <template v-if="migration.targetDialect === 'mysql'">
            <el-form-item label="主机地址">
              <el-input v-model="migration.mysqlHost" placeholder="localhost" />
            </el-form-item>
            <el-form-item label="端口">
              <el-input v-model.number="migration.mysqlPort" placeholder="3306" />
            </el-form-item>
            <el-form-item label="数据库名">
              <el-input v-model="migration.mysqlDatabase" placeholder="fminfinity" />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="migration.mysqlUser" placeholder="fminfinity" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="migration.mysqlPassword" type="password" placeholder="数据库密码" />
            </el-form-item>
          </template>

          <!-- SQLite 配置 -->
          <template v-if="migration.targetDialect === 'sqlite'">
            <el-form-item label="存储路径">
              <el-input v-model="migration.sqliteStorage" placeholder="./main.sqlite" />
            </el-form-item>
          </template>

          <el-form-item>
            <el-button
              type="warning"
              @click="runMigration"
              :loading="migration.migrating"
            >
              仅迁移数据
            </el-button>
            <el-button
              type="success"
              @click="runSwitchOnly"
              :loading="migration.switchingOnly"
            >
              仅切换数据库
            </el-button>
            <el-button
              type="primary"
              @click="runSwitchAndMigrate"
              :loading="migration.switching"
            >
              切换并迁移
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 迁移结果 -->
        <div v-if="migration.result" class="migration-result" style="margin-top: 16px">
          <el-alert
            :type="migration.result.error ? 'error' : 'success'"
            :title="migration.result.error ? '迁移失败' : migration.result.message"
            :closable="false"
            show-icon
          />
          <div v-if="migration.result.results" style="margin-top: 12px">
            <div
              v-for="(count, table) in migration.result.results"
              :key="table"
              class="db-row"
            >
              <span class="db-label">{{ table }}：</span>
              <span class="db-value">{{ count.count ?? 0 }} 条记录</span>
            </div>
          </div>
          <div v-if="migration.result.needsRestart" style="margin-top: 12px">
            <el-alert type="warning" title="请重启服务使配置生效" :closable="false" show-icon />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 扩展区域：后续可添加更多系统管理功能 -->
    <div class="section">
      <h2 class="section-title">更多功能</h2>
      <el-card>
        <el-empty description="更多系统管理功能即将上线..." :image-size="80" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/store/auth";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "@/store/auth";

const authStore = useAuthStore();

// 数据库状态
const dbStatus = ref(null);
const dbLoading = ref(false);

// 数据库迁移
const migration = ref({
  targetDialect: "mysql",
  mysqlHost: "localhost",
  mysqlPort: 3306,
  mysqlDatabase: "fminfinity",
  mysqlUser: "fminfinity",
  mysqlPassword: "",
  sqliteStorage: "./main.sqlite",
  migrating: false,
  switching: false,
  switchingOnly: false,
  result: null,
});

// 获取数据库连接状态
const fetchDbStatus = async () => {
  dbLoading.value = true;
  try {
    const { data } = await api.get("/auth/db-status");
    dbStatus.value = data;
  } catch (err) {
    console.error("获取数据库状态失败:", err);
    dbStatus.value = { connected: false, error: "请求失败" };
  } finally {
    dbLoading.value = false;
  }
};

// 构建目标数据库配置
const buildTargetConfig = () => {
  const m = migration.value;
  if (m.targetDialect === "mysql") {
    return {
      dialect: "mysql",
      host: m.mysqlHost || "localhost",
      port: m.mysqlPort || 3306,
      database: m.mysqlDatabase || "fminfinity",
      username: m.mysqlUser || "fminfinity",
      password: m.mysqlPassword || "",
    };
  } else {
    return {
      dialect: "sqlite",
      storage: m.sqliteStorage || "./main.sqlite",
    };
  }
};

// 仅迁移数据
const runMigration = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要迁移数据到目标数据库吗？目标库的现有数据将被清空！",
      "确认迁移",
      { confirmButtonText: "确定迁移", cancelButtonText: "取消", type: "warning" }
    );
  } catch {
    return;
  }

  migration.value.migrating = true;
  migration.value.result = null;
  try {
    const target = buildTargetConfig();
    const { data } = await api.post("/migration/migrate", { target });
    migration.value.result = data;
    ElMessage.success("数据迁移完成");
  } catch (err) {
    migration.value.result = { error: true, message: err.response?.data?.message || "迁移失败" };
    ElMessage.error("迁移失败");
  } finally {
    migration.value.migrating = false;
  }
};

// 仅切换数据库（不迁移数据）
const runSwitchOnly = async () => {
  try {
    await ElMessageBox.confirm(
      "确定仅切换数据库吗？这将更新 .env 配置指向新数据库，但不会迁移现有数据。切换后需要重启服务生效。",
      "确认切换",
      { confirmButtonText: "确定切换", cancelButtonText: "取消", type: "warning" }
    );
  } catch {
    return;
  }

  migration.value.switchingOnly = true;
  migration.value.result = null;
  try {
    const config = buildTargetConfig();
    const { data } = await api.post("/migration/switch", {
      ...config,
      migrate: false,
    });
    migration.value.result = data;
    ElMessage.success("数据库切换完成，请重启服务");
  } catch (err) {
    migration.value.result = { error: true, message: err.response?.data?.message || "切换失败" };
    ElMessage.error("切换失败");
  } finally {
    migration.value.switchingOnly = false;
  }
};

// 切换并迁移
const runSwitchAndMigrate = async () => {
  try {
    await ElMessageBox.confirm(
      "确定切换数据库并迁移数据吗？这将更新 .env 配置，迁移后需要重启服务。目标库的现有数据将被清空！",
      "确认切换并迁移",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    );
  } catch {
    return;
  }

  migration.value.switching = true;
  migration.value.result = null;
  try {
    const config = buildTargetConfig();
    const { data } = await api.post("/migration/switch", {
      ...config,
      migrate: true,
    });
    migration.value.result = data;
    ElMessage.success("切换并迁移完成，请重启服务");
  } catch (err) {
    migration.value.result = { error: true, message: err.response?.data?.message || "切换失败" };
    ElMessage.error("切换失败");
  } finally {
    migration.value.switching = false;
  }
};

onMounted(() => {
  fetchDbStatus();
});
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
  color: #303133;
}

.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
}

.empty-tip {
  color: #999;
  padding: 10px 0;
}

.db-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.db-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.db-label {
  font-weight: 500;
  min-width: 90px;
  color: #606266;
}

.db-value {
  color: #303133;
}

.text-red-500 {
  color: #f56c6c;
  font-weight: bold;
}
</style>