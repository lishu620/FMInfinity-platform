<template>
  <div class="profile-container">
    <div class="profile-box">
      <h1 class="profile-title">个人中心</h1>

      <el-divider>基本信息</el-divider>

      <!-- 账号（不可修改） -->
      <el-form label-width="100px">
        <el-form-item label="账号">
          <span class="text-lg">{{ authStore.user.username }}</span>
        </el-form-item>

        <!-- 昵称 -->
        <el-form-item label="昵称">
          <el-input
            v-model="form.nickname"
            placeholder="请输入昵称"
            style="width: 300px"
          />
        </el-form-item>

        <!-- 所属组 -->
        <el-form-item label="所属组">
          <span class="text-lg">{{ authStore.user.group }}</span>
        </el-form-item>
      </el-form>

      <el-divider>修改密码</el-divider>

      <!-- 修改密码 -->
      <el-form label-width="100px">
        <el-form-item label="原密码">
          <el-input
            v-model="form.oldPassword"
            type="password"
            placeholder="请输入原密码"
            style="width: 300px"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码"
            style="width: 300px"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认新密码">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            style="width: 300px"
            show-password
          />
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="mt-8">
        <el-button type="primary" size="default" @click="updateProfile">
          保存修改
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/store/auth";
import api from "@/store/auth";
import { ElMessage } from "element-plus";

const authStore = useAuthStore();

const form = ref({
  nickname: authStore.user.nickname,
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const updateProfile = async () => {
  try {
    // 密码校验
    if (
      form.value.newPassword &&
      form.value.newPassword !== form.value.confirmPassword
    ) {
      ElMessage.error("两次输入的新密码不一致");
      return;
    }

    await api.put("/auth/me", {
      nickname: form.value.nickname,
      oldPassword: form.value.oldPassword,
      newPassword: form.value.newPassword,
    });

    // 更新用户信息
    await authStore.fetchUser();
    ElMessage.success("个人信息修改成功！");

    // 清空密码框
    form.value.oldPassword = "";
    form.value.newPassword = "";
    form.value.confirmPassword = "";
  } catch (err) {
    ElMessage.error(
      "修改失败：" + (err.response?.data?.message || "服务器错误"),
    );
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

.profile-box {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.profile-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #333;
}

.text-lg {
  font-size: 18px;
}
</style>
