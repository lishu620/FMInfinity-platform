import { defineStore } from "pinia";
import { ref, watch } from "vue";

// 默认主题
const DEFAULT_THEME = "blue";

export const useThemeStore = defineStore("theme", () => {
  // 从 localStorage 读取，没有则用默认主题
  const currentTheme = ref(
    localStorage.getItem("app-theme") || DEFAULT_THEME
  );

  // 主题配置
  const themes = ref([
    { id: "blue", name: "浅蓝主题", primary: "#89C2FF", background: "#E6F7FF" },
    { id: "purple", name: "浅紫主题", primary: "#B19CD9", background: "#D3D3D3" },
  ]);

  const currentThemeConfig = ref(
    themes.value.find((t) => t.id === currentTheme.value) || themes.value[0]
  );

  // 监听主题变化，同步更新配置和 DOM
  watch(currentTheme, (newTheme) => {
    localStorage.setItem("app-theme", newTheme);
    currentThemeConfig.value = themes.value.find((t) => t.id === newTheme) || themes.value[0];
    applyTheme(newTheme);
  });

  // 应用主题到 DOM
  function applyTheme(themeId) {
    document.documentElement.setAttribute("data-theme", themeId);
  }

  // 切换主题
  function setTheme(themeId) {
    if (themes.value.some((t) => t.id === themeId)) {
      currentTheme.value = themeId;
    }
  }

  // 初始化时应用主题
  function initTheme() {
    applyTheme(currentTheme.value);
  }

  return {
    currentTheme,
    themes,
    currentThemeConfig,
    setTheme,
    initTheme,
  };
});
