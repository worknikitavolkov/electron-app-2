const { app, Menu, ipcMain, Tray } = require("electron");
const path = require("path");
const Store = require("./store");
const MainWindow = require("./MainWindow");

// Set env
process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let tray;

//Init store & defaults
const store = new Store({
  configName: "user-settings",
  defaults: {
    settings: {
      cpuOverload: 80,
      alertFrequency: 5,
    },
  },
});

//Menu
const menu = [
  ...(isMac ? [{ role: "appMenu" }] : []),
  {
    role: "fileMenu",
  },
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { type: "separator" },
            { role: "toggledevtools" },
          ],
        },
      ]
    : []),
];

function createMainWindow() {
  mainWindow = new MainWindow("./app/index.html", isDev);
}

app.on("ready", () => {
  createMainWindow();

  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.webContents.send("settings:get", store.get("settings"));
  });

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  //Tray
  const icon = path.join(__dirname, "assets", "icons", "tray_icon.png");
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "SysTop",
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      },
    },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray = new Tray(icon);
  tray.setToolTip("SysTop");
  tray.setContextMenu(contextMenu);
});

//Set settings
ipcMain.on("settings:set", (e, value) => {
  store.set("settings", value);
  mainWindow.webContents.send("settings:get", store.get("settings"));
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.allowRendererProcessReuse = true;
