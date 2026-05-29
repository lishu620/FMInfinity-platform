import { defineStore } from "pinia";
import { ref } from "vue";
import { ElNotification } from "element-plus";
import axios from "axios";

export const useNotificationStore = defineStore("notification", () => {
  const noticeList = ref([]);
  const unReadCount = ref(0);
  const isDrawerOpen = ref(false);
  let eventSource = null;

  // 加载通知列表
  async function loadNoticeList() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get("/api/notice/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      noticeList.value = res.data.list;
      unReadCount.value = res.data.unReadCount;
    } catch (err) {
      console.error("加载通知失败", err);
    }
  }

  // 标记已读并自动从前端删除
  async function readNotice(item) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.post(
        `/api/notice/read/${item.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // 自动从前端列表删除
      noticeList.value = noticeList.value.filter((n) => n.id !== item.id);
      if (unReadCount.value > 0) unReadCount.value--;
    } catch (err) {
      console.error("标记已读失败", err);
    }
  }

  // 删除通知
  async function deleteNotice(id) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.delete(`/api/notice/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const item = noticeList.value.find((n) => n.id === id);
      noticeList.value = noticeList.value.filter((n) => n.id !== id);
      if (item && !item.isRead && unReadCount.value > 0) unReadCount.value--;
    } catch (err) {
      console.error("删除通知失败", err);
    }
  }

  // 全部标记已读并清空列表
  async function readAll() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.post(
        "/api/notice/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      noticeList.value = [];
      unReadCount.value = 0;
    } catch (err) {
      console.error("全部已读失败", err);
    }
  }

  // SSE 实时通知连接
  function connectSSE() {
    const token = localStorage.getItem("token");
    if (!token || eventSource) return;

    try {
      // 通过 URL 参数传递 token（SSE 不支持自定义 header）
      eventSource = new EventSource(
        `/api/notice/stream?token=${encodeURIComponent(token)}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_notice") {
            // 新通知插入列表头部
            noticeList.value.unshift(data.notice);
            unReadCount.value++;

            // ElNotification 弹窗提醒
            ElNotification({
              title: data.notice.title || "新通知",
              message: data.notice.content || "",
              type: "info",
              duration: 5000,
              position: "top-right",
            });
          }
        } catch (e) {
          // 忽略解析错误
        }
      };

      eventSource.onerror = () => {
        // SSE 连接断开，5秒后重连
        disconnectSSE();
        setTimeout(() => connectSSE(), 5000);
      };
    } catch (e) {
      console.error("SSE 连接失败", e);
    }
  }

  function disconnectSSE() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

  // 清空（退出登录时）
  function clear() {
    noticeList.value = [];
    unReadCount.value = 0;
    disconnectSSE();
  }

  return {
    noticeList,
    unReadCount,
    isDrawerOpen,
    loadNoticeList,
    readNotice,
    deleteNotice,
    readAll,
    connectSSE,
    disconnectSSE,
    clear,
  };
});
