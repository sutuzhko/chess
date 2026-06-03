import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@app/pages/HomeView.vue'),
    },
    {
      path: '/lobby/:mode',
      name: 'lobby',
      component: () => import('@app/pages/LobbyView.vue'),
    },
    {
      path: '/game/:matchId?',
      name: 'game',
      component: () => import('@app/pages/GameView.vue'),
    },
    {
      path: '/openings',
      name: 'openings',
      component: () => import('@app/pages/OpeningsView.vue'),
    },
    {
      path: '/puzzles',
      name: 'puzzles',
      component: () => import('@app/pages/PuzzlesView.vue'),
    },
    {
      path: '/puzzles/fen-builder',
      name: 'puzzles-fen-builder',
      component: () => import('@app/pages/FenBuilderView.vue'),
    },
    {
      path: '/puzzles/:id',
      name: 'puzzle-solve',
      component: () => import('@app/pages/PuzzleSolverView.vue'),
    },
    {
      path: '/settings/:tab?',
      name: 'settings',
      component: () => import('@app/pages/SettingsView.vue'),
    },
    {
      path: '/oauth/callback',
      name: 'oauth-callback',
      component: () => import('@app/pages/OAuthCallbackView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

export default router;
