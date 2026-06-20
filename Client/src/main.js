import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router";

// 导入全局样式
import "./style.css";
// import "./styles/animations.css";  // 暂时禁用排查对话框问题
import "./styles/public.css";
import "./styles/issue-list.css";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.mount("#app");

// 初始化主题（必须在 pinia 注册之后）
import { useThemeStore } from "@/store/theme";
const themeStore = useThemeStore();
themeStore.initTheme();
