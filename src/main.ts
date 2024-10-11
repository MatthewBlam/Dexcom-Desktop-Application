// TODO: disable refresh and other maybe unwanted user commands
// App Logo
// Windows compatibility
// Build

import {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    Menu,
    nativeImage,
    screen,
    powerMonitor,
} from "electron";
const { spawn } = require("child_process");
const Store = require("electron-store");
import path from "path";

// Globals
var Python: python;
var Win: BrowserWindow;
var Widget: BrowserWindow;
var widgetOpen: boolean = false;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    app.quit();
}

function sendRender(message: object) {
    Win.webContents.send("toRender", JSON.stringify(message));
}

function sendWidget(message: object) {
    if (widgetOpen) {
        Widget.webContents.send("toRender", JSON.stringify(message));
    }
}

ipcMain.on("toMain", (event, args) => {
    const values = JSON.parse(args);
    const keys = Object.keys(values);
    const call = keys[0];

    if (call == "RESTART") {
        app.relaunch();
        app.quit();
    }

    if (call == "TERMINATE") {
        storage.resetCredentials();
        Python.end();
    }

    if (call == "DOM") {
        sendRender({ INIT_SETTINGS: storage.getSettings() });
        const storedCredentials = storage.getCredentials();
        if (storedCredentials) {
            console.log("Logging in with stored:", storedCredentials.user);
            if (Python instanceof python) {
                Python.end();
            }
            Python = new python(storedCredentials);
            Python.start();
        }
    }

    // Attempt to login by starting python script
    if (call == "LOGIN") {
        const credentials = values["LOGIN"];
        console.log("Logging in with:", credentials.user);
        if (Python instanceof python) {
            Python.end();
        }
        Python = new python(credentials);
        Python.start();
    }

    if (call == "INIT_WIDGET_SETTINGS") {
        sendWidget({ SETTINGS: storage.getSettings() });
    }

    if (call == "GET_SETTINGS") {
        const settingsGet = storage.getSettings();
        sendRender({ OPEN_SETTINGS: settingsGet });
        sendWidget({ SETTINGS: settingsGet });
    }

    if (call == "STORE_SETTINGS") {
        const settingsStore = values["STORE_SETTINGS"];
        console.log("STORING", settingsStore);
        storage.saveSettings(settingsStore);
        sendWidget({ SETTINGS: settingsStore });
    }

    if (call == "OPEN_WIDGET") {
        showCloseWidgetMenu();
        createWidget();
    }

    if (call == "CLOSE_WIDGET") {
        showOpenWidgetMenu();
        Widget.close();
    }

    if (call == "GET_WIDGET") {
        sendWidget({ WIDGET_POSITION: storage.getWidgetPosition() });
    }

    if (call == "STORE_WIDGET") {
        storage.saveWidgetPosition(values["STORE_WIDGET"]);
    }

    if (call == "GET_WIDGET_OPEN") {
        sendRender({ WIDGET_OPEN: storage.getWidgetOpen() });
    }

    if (call == "STORE_WIDGET_OPEN") {
        storage.saveWidgetOpen(values["STORE_WIDGET_OPEN"]);
    }

    if (call == "STORE_READING") {
        storage.saveCurrentReading(values["STORE_READING"]);
    }

    if (call == "GET_READING") {
        sendWidget({ READING: storage.getCurrentReading() });
    }

    if (call == "SET_IGNORE_MOUSE") {
        const args = values["SET_IGNORE_MOUSE"];
        const ignore = args[0];
        const options = args[1];
        const window = BrowserWindow.fromWebContents(event.sender);
        window.setIgnoreMouseEvents(ignore, options);
    }
});

interface Bounds {
    width: number;
    height: number;
}

interface Settings {
    sensor: "G6" | "G7";
    unit: "mg/dl" | "mmol/l";
    high: number;
    low: number;
    highMMOLL: number;
    lowMMOLL: number;
}

interface Credentials {
    user: string;
    password: string;
    ous: boolean;
}

interface Reading {
    id: string;
    value: number;
    mmol_l: number;
    trend: number;
    trend_direction: string;
    trend_description: string;
    trend_arrow: string;
    date_time: Array<string>;
}

class Storage {
    store = new Store();

    getWinBounds(): Bounds {
        const bounds: Bounds | null = this.store.get("win-bounds");
        if (!bounds) {
            var defaultBounds: Bounds = { width: 800, height: 500 };
            this.store.set("win-bounds", defaultBounds);
            return defaultBounds;
        }
        return bounds;
    }

    saveWinBounds(bounds: Bounds) {
        this.store.set("win-bounds", bounds);
    }

    getWidgetPosition() {
        const position = this.store.get("widget-position");
        if (!position) {
            var defaultPosition = ["0px", "0px"];
            this.store.set("widget-position", defaultPosition);
            return defaultPosition;
        }
        return position;
    }

    saveWidgetPosition(position: Array<string>) {
        this.store.set("widget-position", position);
    }

    getWidgetOpen() {
        const open = this.store.get("widget-open");
        if (open === null || open === undefined) {
            this.store.set("widget-open", false);
            return false;
        }
        return open;
    }

    saveWidgetOpen(open: boolean) {
        this.store.set("widget-open", open);
    }

    saveCurrentReading(reading: Reading) {
        this.store.set("current-reading", reading);
    }

    getCurrentReading() {
        const reading = this.store.get("current-reading");
        if (!reading) {
            var defualtReading = {
                id: "Unavailable",
                value: -1,
                mmol_l: -1,
                trend: 0,
                trend_direction: "Unavailable",
                trend_description: "Unavailable",
                trend_arrow: "Unavailable",
                date_time: ["Unavailable", "Unavailable"],
            };
            this.store.set("current-reading", defualtReading);
            return defualtReading;
        }
        return reading;
    }

    getCredentials(): Credentials | undefined {
        const credentials: Credentials | undefined =
            this.store.get("credentials");
        if (!credentials) {
            console.log("RETRIEVED: No Credentials");
            sendRender({ AUTH_ERROR: null });
            return undefined;
        }
        console.log("RETRIEVED:", credentials.user);
        return credentials;
    }

    saveCredentials(credentials: Credentials) {
        console.log("STORING", credentials.user);
        this.store.set("credentials", credentials);
    }

    resetCredentials() {
        console.log("WIPING CREDENTIALS");
        this.store.delete("credentials");
    }

    getSettings(): Settings | undefined {
        const settings: Settings | undefined = this.store.get("settings");
        if (!settings) {
            const defaultSettings: Settings = {
                sensor: "G7",
                unit: "mg/dl",
                high: 200,
                low: 70,
                highMMOLL: 11.0,
                lowMMOLL: 4.0,
            };
            this.store.set("settings", defaultSettings);
            return defaultSettings;
        }
        return settings;
    }

    saveSettings(settings: Settings) {
        console.log("STORING", settings);
        this.store.set("settings", settings);
        updateTray(this.getCurrentReading());
    }
    resetSettings() {
        console.log("WIPING SETTINGS");
        this.store.delete("settings");
    }
}
const storage = new Storage();
// storage.resetSettings(); // REMOVE THIS IT IS ONLY FOR DEV TESTING
// storage.resetCredentials(); // REMOVE THIS IT IS ONLY FOR DEV TESTING

function getID() {
    const ID = new Date();
    return ID;
}

class python {
    Process: typeof spawn;
    running: boolean = false;
    credentials: Credentials;

    constructor(cred: Credentials) {
        this.credentials = cred;
    }

    send(message: any) {
        this.Process.stdin.write(`${getID()} ${message}`);
    }

    start() {
        if (this.running) {
            return;
        }

        const pythonEXE = MAIN_WINDOW_VITE_DEV_SERVER_URL
            ? "./dexcom"
            : path.join(__dirname, "../dexcom");

        this.Process = spawn(
            pythonEXE,
            [
                this.credentials.user,
                this.credentials.password,
                String(this.credentials.ous),
            ],
            {
                shell: true,
            }
        );
        this.running = true;

        this.Process.stdout.on("data", (message: any) => {
            message = message.toString().trim();
            console.log("python:", message);

            if (message.slice(0, 9).includes("READING")) {
                console.log("PARSING:", message);
                const reading: Reading = JSON.parse(
                    message.replaceAll("READING: ", "").replaceAll("'", '"')
                );
                sendRender({ READING: reading });
                sendWidget({ READING: reading });
                updateTray(reading);
            }

            if (message.includes("AUTH SUCCESS")) {
                storage.saveCredentials(this.credentials);
                sendRender({ CREDENTIALS: null });
            }

            if (message.includes("AUTH ERROR")) {
                storage.resetCredentials();
                sendRender({ AUTH_ERROR: message.slice(12) });
            }
        });

        this.Process.stderr.on("data", (error: any) => {
            error = error.toString();
            console.log("PYTHON ERROR\n" + error.toString());
            if (!error.includes("urllib3 v2 only supports")) {
                Python.restart();
            }
        });

        this.Process.on("close", (code: any) => {
            this.running = false;
            console.log(`PYTHON CLOSED, Code ${code}`);
        });
    }

    end() {
        if (!this.running) {
            return;
        }

        console.log("TERMINATING PYTHON");
        this.send("TERMINATE");
        var i = 0;
        const interval = setInterval(() => {
            i += 1;
            if (!this.running) {
                console.log("PYTHON KILLED SUCCESSFULLY");
                sendRender({ KILLED_PYTHON: null });
                clearInterval(interval);
            }
            if (i > 10) {
                this.Process.kill();
            }
            if (i > 20) {
                this.Process.kill();
                sendRender({ PYTHON_ERROR: null });
                clearInterval(interval);
            }
        }, 1000);
    }

    restart() {
        this.Process.kill();
        var i = 1;
        const restart = setInterval(() => {
            if (!this.running) {
                this.start();
                clearInterval(restart);
            }
            if (i > 10) {
                this.Process.kill();
                sendRender({ PYTHON_ERROR: null });
                clearInterval(restart);
            }
            i += 1;
        }, 1000);
    }

    pause() {
        this.send("PAUSE");
    }

    resume() {
        this.send("RESUME");
    }
}

powerMonitor.on("suspend", () => {
    console.log("\nThe system is going to sleep");
    Python.pause();
});

powerMonitor.on("resume", () => {
    console.log("\nThe system is resuming");
    Python.resume();
});

powerMonitor.on("lock-screen", () => {
    console.log("\nThe system is about to be locked");
    Python.pause();
});

powerMonitor.on("unlock-screen", () => {
    console.log("\nThe system is unlocked");
    Python.resume();
});

const createWindow = () => {
    const winBounds = storage.getWinBounds();
    Win = new BrowserWindow({
        minWidth: 450,
        minHeight: 400,
        width: winBounds.width,
        height: winBounds.height,
        show: false,
        autoHideMenuBar: true,
        center: true,
        title: "Dexcom",
        frame: false,
        titleBarStyle: "customButtonsOnHover",
        trafficLightPosition: { x: 12, y: 12 },
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        Win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        Win.loadFile(
            path.join(
                __dirname,
                `../main/renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
            )
        );
    }

    Win.show();

    Win.on("resized", () => {
        const bounds = Win.getBounds();
        storage.saveWinBounds({ width: bounds.width, height: bounds.height });
    });
};

const createWidget = () => {
    if (!widgetOpen) {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;
        Widget = new BrowserWindow({
            width: width,
            height: height,
            center: true,
            resizable: false,
            movable: false,
            autoHideMenuBar: true,
            frame: false,
            title: "Dexcom Widget",
            alwaysOnTop: true,
            transparent: true,
            hasShadow: false,

            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
            },
        });

        if (WIDGET_WINDOW_VITE_DEV_SERVER_URL) {
            Widget.loadURL(WIDGET_WINDOW_VITE_DEV_SERVER_URL);
        } else {
            Widget.loadFile(
                path.join(
                    __dirname,
                    `../widget/renderer/${WIDGET_WINDOW_VITE_NAME}/index.html`
                )
            );
        }

        widgetOpen = true;
        Win.focus();

        Widget.on("close", () => {
            widgetOpen = false;
        });
    }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// Make sure python process closes
app.on("before-quit", (e) => {
    if (Python instanceof python) {
        if (Python.running) {
            e.preventDefault;
            Python.end();
        }
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

var tray: any;
var trayMenu: any;

app.whenReady().then(() => {
    const iconPath = MAIN_WINDOW_VITE_DEV_SERVER_URL
        ? "./dexcom_graphics/app-logo-trayTemplate.png"
        : path.join(__dirname, "../dexcom_graphics/app-logo-trayTemplate.png");
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 13 });
    icon.setTemplateImage(true);
    tray = new Tray(icon);

    trayMenu = Menu.buildFromTemplate([
        {
            id: "open-widget",
            label: "Open Widget",
            type: "normal",
            click: () => {
                sendRender({ TRAY_OPEN_WIDGET: null });
                showCloseWidgetMenu();
            },
        },
        {
            id: "close-widget",
            label: "Close Widget",
            type: "normal",
            click: () => {
                sendRender({ TRAY_CLOSE_WIDGET: null });
                showOpenWidgetMenu();
            },
        },
    ]);

    tray.setToolTip("Dexcom");
    tray.setContextMenu(trayMenu);

    if (storage.getWidgetOpen()) {
        trayMenu.getMenuItemById("open-widget").visible = false;
        trayMenu.getMenuItemById("close-widget").visible = true;
    } else {
        trayMenu.getMenuItemById("close-widget").visible = false;
        trayMenu.getMenuItemById("open-widget").visible = true;
    }
});

function showOpenWidgetMenu() {
    trayMenu.getMenuItemById("close-widget").visible = false;
    trayMenu.getMenuItemById("open-widget").visible = true;
}

function showCloseWidgetMenu() {
    trayMenu.getMenuItemById("open-widget").visible = false;
    trayMenu.getMenuItemById("close-widget").visible = true;
}

function updateTray(reading: Reading) {
    const unit = storage.getSettings().unit;
    const glucose = unit == "mmol/l" ? reading.mmol_l : reading.value;
    tray.setTitle(
        ` ${glucose == -1 ? "" : ` ${glucose}`} ${reading.trend_arrow}`
    );
}

// Build native menubar on mac
const template: Electron.MenuItemConstructorOptions[] = [
    // { role: 'appMenu' }

    {
        label: app.name,
        submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
        ],
    },

    // { role: 'fileMenu' }
    {
        label: "File",
        submenu: [{ role: "close" }],
    },
    // { role: 'editMenu' }
    {
        label: "Edit",
        submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },

            { role: "pasteAndMatchStyle" },
            { role: "delete" },
            { role: "selectAll" },
            { type: "separator" },
            {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
            },
        ],
    },
    // { role: 'viewMenu' }
    {
        label: "View",
        submenu: [
            // { role: "reload" },
            // { role: "forceReload" },
            // { role: "toggleDevTools" },
            // { type: "separator" },
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { type: "separator" },
            { role: "togglefullscreen" },
        ],
    },
    // { role: 'windowMenu' }
    {
        label: "Window",
        submenu: [
            { role: "minimize" },
            { role: "zoom" },

            { type: "separator" },
            { role: "front" },
        ],
    },
    {
        role: "help",
        submenu: [
            {
                label: "Learn More",
                click: async () => {
                    const { shell } = require("electron");
                    await shell.openExternal(
                        "https://github.com/MatthewBlam/Dexcom-Desktop-Application"
                    );
                },
            },
        ],
    },
];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
