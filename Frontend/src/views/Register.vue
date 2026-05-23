<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">用户注册</h2>

      <el-form
        @submit.prevent="handleRegister"
        class="register-form"
        ref="formRef"
        :model="form"
        :rules="formRules"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="请输入昵称"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item prop="statusId">
          <el-select
            v-model="form.statusId"
            placeholder="请选择用户组"
            size="large"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="item in statusList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <div v-if="error" class="error-tip">{{ error }}</div>

        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            size="large"
            class="login-btn"
          >
            {{ loading ? "注册中..." : "注册" }}
          </el-button>
        </el-form-item>

        <div class="login-link">
          已有账号？<a @click="$router.push('/login')">立即登录</a>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/store/auth";
import { ElMessage } from "element-plus";

const router = useRouter();
const formRef = ref(null);
const statusList = ref([]);

// 定义校验规则
const formRules = ref({
  username: { required: true, message: "请输入账号", trigger: "blur" },
  nickname: { required: true, message: "请输入昵称", trigger: "blur" },
  password: { required: true, message: "请输入密码", trigger: "blur" },
  statusId: { required: true, message: "请选择用户组", trigger: "change" },
});

const form = ref({
  username: "",
  nickname: "",
  password: "",
  statusId: "",
});

const loading = ref(false);
const error = ref("");

// 关键修复：调用公开接口
const fetchStatus = async () => {
  try {
    // 👈 这里必须是 /status/public 👈
    const { data } = await api.get("/auth/status/public");
    statusList.value = data;
    console.log("加载到组列表：", data);
  } catch (err) {
    console.error("加载组失败", err);
    ElMessage.error("无法加载用户组列表");
  }
};

const handleRegister = async () => {
  try {
    loading.value = true;
    error.value = "";

    // 触发表单校验
    await formRef.value.validate();

    // 发送请求 - 确保 URL 是 /auth/register
    await api.post("/auth/register", form.value);

    ElMessage.success("注册成功，请等待管理员审核");
    router.push("/login");
  } catch (err) {
    error.value = err.response?.data?.message || "注册失败，请检查网络或重试";
    console.error("注册报错：", error.value);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStatus();
});
</script>

<style scoped>
@import "../styles/login.css";
</style>
