import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // File operations
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('file:save', filePath, content),
  saveFileAs: (content: string) => ipcRenderer.invoke('file:saveAs', content),
  importAudio: () => ipcRenderer.invoke('file:importAudio'),

  // Menu events
  onMenuNew: (callback: () => void) => {
    ipcRenderer.on('menu:new', callback)
    return () => ipcRenderer.removeListener('menu:new', callback)
  },
  onMenuOpen: (callback: () => void) => {
    ipcRenderer.on('menu:open', callback)
    return () => ipcRenderer.removeListener('menu:open', callback)
  },
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on('menu:save', callback)
    return () => ipcRenderer.removeListener('menu:save', callback)
  },
  onMenuSaveAs: (callback: () => void) => {
    ipcRenderer.on('menu:saveAs', callback)
    return () => ipcRenderer.removeListener('menu:saveAs', callback)
  },
  onMenuImportAudio: (callback: () => void) => {
    ipcRenderer.on('menu:importAudio', callback)
    return () => ipcRenderer.removeListener('menu:importAudio', callback)
  },
  onMenuUndo: (callback: () => void) => {
    ipcRenderer.on('menu:undo', callback)
    return () => ipcRenderer.removeListener('menu:undo', callback)
  },
  onMenuRedo: (callback: () => void) => {
    ipcRenderer.on('menu:redo', callback)
    return () => ipcRenderer.removeListener('menu:redo', callback)
  },
  onMenuDeleteNote: (callback: () => void) => {
    ipcRenderer.on('menu:deleteNote', callback)
    return () => ipcRenderer.removeListener('menu:deleteNote', callback)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type DikteAPI = typeof api
