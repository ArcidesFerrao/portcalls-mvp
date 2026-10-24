export const ROUTES = {
  home: "/",
  login: "/login",
  demo: "/demo",
  dashboard: "/app",
  newProcess: "/app/processes/new",
  process: (id: string) => `/app/processes/${id}`,
  settings: "/app/settings",
};