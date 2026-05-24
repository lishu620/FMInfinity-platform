import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/store/auth";
import Home from "@/views/Home.vue";
import QuickJump from "../views/QuickJump.vue";
import Login from "@/views/Login.vue";
import IssueList from "@/views/IssueList.vue";
import IssueDetail from "@/views/IssueDetail.vue";
import Profile from "@/views/Profile.vue";
import AdminPanel from "@/views/AdminPanel.vue";
import Register from "@/views/Register.vue";
import GroupPanel from "@/views/GroupManagement.vue";
import SubmissionStatus from "../views/SubmissionStatus.vue";
import VsingersManager from "../views/VsingersManager.vue";
import VsingerShow from "../views/VsingerShow.vue";
import UpdatesView from "../views/UpdatesView.vue";
import { pa } from "element-plus/es/locale/index.mjs";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/register", component: Register },

  { path: "/issues", component: IssueList, meta: { requiresAuth: true } },
  { path: "/issues/:id", component: IssueDetail, meta: { requiresAuth: true } },
  { path: "/profile", component: Profile, meta: { requiresAuth: true } },
  {
    path: "/quick-start",
    component: QuickJump,
    meta: { requiresAuth: true },
  },
  {
    path: "/submission-status",
    component: SubmissionStatus,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin-console",
    component: AdminPanel,
    meta: { requiresAuth: true, requiresRole: ["admin", "groupAdmin"] },
  },
  {
    path: "/group-console",
    component: GroupPanel,
    meta: { requiresAuth: true, requiresRole: ["admin"] },
  },
  {
    path: "/vsinger-console",
    component: VsingersManager,
    meta: { requiresAuth: true, requiresRole: ["admin"] },
  },
  {
    path: "/vsinger-show",
    component: VsingerShow,
    meta: { requiresAuth: true },
  },
  {
    path: "/vote",
    name: "Vote",
    component: () => import("@/views/IssueVote.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/review",
    name: "Review",
    component: () => import("@/views/IssueReview.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/show",
    name: "Show",
    component: () => import("@/views/IssueShow.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/update",
    component: UpdatesView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  await authStore.initAuth();

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next("/login");
  }

  if (to.meta.requiresRole) {
    const roles = to.meta.requiresRole;

    const roleMap = {
      admin: authStore.isSuperAdmin,
      groupAdmin: authStore.isGroupAdmin,
    };

    const hasPermission = roles.some((role) => roleMap[role]);

    if (!hasPermission) {
      return next("/");
    }
  }

  next();
});

export default router;
