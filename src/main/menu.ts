import { Menu, BrowserWindow, app } from 'electron'

export function createMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [{ role: 'appMenu' as const }]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendToRenderer('menu:new')
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendToRenderer('menu:open')
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendToRenderer('menu:save')
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendToRenderer('menu:saveAs')
        },
        { type: 'separator' },
        {
          label: 'Import Audio...',
          accelerator: 'CmdOrCtrl+I',
          click: () => sendToRenderer('menu:importAudio')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => sendToRenderer('menu:undo')
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: () => sendToRenderer('menu:redo')
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        {
          label: 'Delete Note',
          accelerator: 'Delete',
          click: () => sendToRenderer('menu:deleteNote')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => sendToRenderer('menu:zoomIn')
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => sendToRenderer('menu:zoomOut')
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => sendToRenderer('menu:resetZoom')
        },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function sendToRenderer(channel: string): void {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    window.webContents.send(channel)
  }
}
