const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (cfg) => ipcRenderer.invoke('config:save', cfg),
  resetSources: () => ipcRenderer.invoke('config:reset-sources'),
  onConfigChanged: (fn) => ipcRenderer.on('config:changed', (_e, cfg) => fn(cfg)),

  fetchText: (url) => ipcRenderer.invoke('net:fetch', url),
  checkRoute: () => ipcRenderer.invoke('net:check-route'),
  endRun: () => ipcRenderer.invoke('net:end-run'),

  planEdition: () => ipcRenderer.invoke('edition:plan'),
  saveEdition: (edition, consideredUrls) => ipcRenderer.invoke('edition:save', edition, consideredUrls),
  listEditions: () => ipcRenderer.invoke('edition:list'),
  loadEdition: (id) => ipcRenderer.invoke('edition:load', id),
  markRead: (editionId, articleId) => ipcRenderer.invoke('edition:mark-read', editionId, articleId),

  getLearning: () => ipcRenderer.invoke('learning:get'),
  saveLearning: (data) => ipcRenderer.invoke('learning:save', data),
  resetLearning: () => ipcRenderer.invoke('learning:reset'),
  onLearningReset: (fn) => ipcRenderer.on('learning:reset', () => fn()),

  embedStatus: () => ipcRenderer.invoke('embed:status'),
  embed: (texts) => ipcRenderer.invoke('embed:texts', texts),

  openExternal: (url) => ipcRenderer.invoke('open:external', url),
  openSources: () => ipcRenderer.invoke('window:sources')
});
