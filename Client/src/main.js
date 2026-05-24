import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router";

// 导入全局样式
import "./style.css";
import "./styles/public.css";
import "./styles/issue-list.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.mount("#app");
