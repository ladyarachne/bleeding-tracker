// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
console.log("PRELOAD IS RUNNING");
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  saveEntry: (entry) => ipcRenderer.invoke('save-entry', entry),
  getEntries: (options) => ipcRenderer.invoke('get-entries', options),
  getEntryByDate: (date) => ipcRenderer.invoke('get-entry-by-date', date),
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
  deleteEntry: (date) => ipcRenderer.invoke('delete-entry', date),
  // Ring tracking
  saveRingEvent: (event) => ipcRenderer.invoke('save-ring-event', event),
  getRingEvents: (options) => ipcRenderer.invoke('get-ring-events', options),
  getRingEventByDate: (date) => ipcRenderer.invoke('get-ring-event-by-date', date),
  deleteRingEvent: (date, eventType) => ipcRenderer.invoke('delete-ring-event', date, eventType)
});
