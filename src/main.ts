// TODO: disable refresh and other maybe unwanted user commands
// Loading indicator on startup (blank screen while logging in)
// Several displays support?
// App menu tray thing?
// App Logo
// Windows compatibility
// Build

import {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    screen,
    powerMonitor,
} from "electron";
import path from "path";
const { spawn } = require("child_process");
const Store = require("electron-store");
const fs = require("fs");

// Init globals
var python: Python;
var win: BrowserWindow;
var widget: BrowserWindow;
var widgetOpen: boolean = false;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    app.quit();
}

// Send message to render porcess
function sendRender(message: object) {
    win.webContents.send("toRender", JSON.stringify(message));
}

function sendWidget(message: object) {
    if (widgetOpen) {
        widget.webContents.send("toRender", JSON.stringify(message));
    }
}

// Receive message from render process
ipcMain.on("toMain", (event, args) => {
    var values = JSON.parse(args);
    var keys = Object.keys(values);
    var call = keys[0];

    if (call == "DOM") {
        // Start python script if credentials retrieved from storage
        var storedCredentials: Credentials = storage.getCredentials();
        if (storedCredentials) {
            console.log("Logging in with stored:", storedCredentials.user);
            if (python instanceof Python) {
                python.end();
            }
            python = new Python(storedCredentials);
            python.start();
        }

        var storedSettings: Settings = storage.getSettings();
        sendRender({ INIT_SETTINGS: storedSettings });
    }

    // Attempt to login by starting python script
    if (call == "LOGIN") {
        var credentials = values["LOGIN"];
        console.log("Logging in with:", credentials.user);
        if (python instanceof Python) {
            python.end();
        }
        python = new Python(credentials);
        python.start();
    }

    if (call == "INIT_WIDGET_SETTINGS") {
        var settings: Settings = storage.getSettings();
        sendWidget({ SETTINGS: settings });
    }

    if (call == "GET_SETTINGS") {
        var settings: Settings = storage.getSettings();
        sendRender({ OPEN_SETTINGS: settings });
        sendWidget({ SETTINGS: settings });
    }

    if (call == "STORE_SETTINGS") {
        var settings: Settings = values["STORE_SETTINGS"];
        console.log("STORING", settings);
        storage.saveSettings(settings);
        sendWidget({ SETTINGS: settings });
    }

    // Send kill signal to python script
    if (call == "TERMINATE") {
        storage.resetCredentials();
        python.end();
        // killPython();
    }

    if (call == "OPEN_WIDGET") {
        createWidget();
    }

    if (call == "CLOSE_WIDGET") {
        widget.close();
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

// Interfaces
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

// Manage storage of app data
class Storage {
    store = new Store();
    // Retrieve window dimensions
    getWinBounds(): Bounds {
        const bounds: Bounds | null = this.store.get("win-bounds");
        if (!bounds) {
            var defaultBounds: Bounds = { width: 800, height: 500 };
            this.store.set("win-bounds", defaultBounds);
            return defaultBounds;
        }
        return bounds;
    }
    // Store window dimensions
    saveWinBounds(bounds: Bounds) {
        this.store.set("win-bounds", bounds);
    }
    // Retrieve widget position
    getWidgetPosition() {
        const position = this.store.get("widget-position");
        if (!position) {
            var defaultPosition = ["0px", "0px"];
            this.store.set("widget-position", defaultPosition);
            return defaultPosition;
        }
        return position;
    }
    // Store widget position
    saveWidgetPosition(position: Array<string>) {
        this.store.set("widget-position", position);
    }
    // Retrieve if widget open
    getWidgetOpen() {
        const open = this.store.get("widget-open");
        if (open === null || open === undefined) {
            this.store.set("widget-open", false);
            return false;
        }
        return open;
    }
    // Store if widget open
    saveWidgetOpen(open: boolean) {
        this.store.set("widget-open", open);
    }
    // Store current reading
    saveCurrentReading(reading: Reading) {
        this.store.set("current-reading", reading);
    }
    // Retrieve current reading
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
    // Retrieve login info
    getCredentials(): Credentials | undefined {
        const credentials: Credentials | undefined =
            this.store.get("credentials");
        if (!credentials) {
            console.log("RETRIEVED: No Credentials");
            sendRender({ AUTH_ERROR: null });
            return undefined;
        }
        console.log("RETRIEVED:", credentials);
        return credentials;
    }
    // Store login info
    saveCredentials(credentials: Credentials) {
        console.log("STORING", credentials.user);
        this.store.set("credentials", credentials);
    }
    // Wipe login info
    resetCredentials() {
        console.log("WIPING CREDENTIALS");
        this.store.delete("credentials");
    }
    // Retrieve settings
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
    // Store settings
    saveSettings(settings: Settings) {
        console.log("STORING", settings);
        this.store.set("settings", settings);
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

class Python {
    Process: typeof spawn;
    running: boolean;
    credentials: Credentials;

    constructor(cred: Credentials) {
        this.credentials = cred;
        this.running = false;
    }

    start() {
        if (this.running) {
            return;
        }
        this.Process = spawn(
            "./dexcom",
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
        this.Process.stdout.on("data", (pymessage: any) => {
            pymessage = pymessage.toString().trim();
            console.log("python:", pymessage);
            if (pymessage.slice(0, 9).includes("READING")) {
                console.log("PARSING:", pymessage);
                var reading: Reading = JSON.parse(
                    pymessage.replaceAll("READING: ", "").replaceAll("'", '"')
                );
                sendRender({ READING: reading });
                sendWidget({ READING: reading });
            }
            // Save login and signal renderer
            if (pymessage.includes("AUTH SUCCESS")) {
                storage.saveCredentials(this.credentials);
                sendRender({ CREDENTIALS: null });
            }
            // Wipe login and signal renderer
            if (pymessage.includes("AUTH ERROR")) {
                storage.resetCredentials();
                sendRender({ AUTH_ERROR: pymessage.slice(12) });
            }
        });
        this.Process.stderr.on("data", (err: any) => {
            console.log("PYTHON ERROR\n" + err.toString());
            // send error to render
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
        this.Process.stdin.write(`${getID()} TERMINATE`);
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
                clearInterval(interval);
                // something went wrong
            }
        }, 1000);
    }

    pause() {
        this.Process.stdin.write(`${getID()} PAUSE`);
    }

    resume() {
        this.Process.stdin.write(`${getID()} RESUME`);
    }
}

powerMonitor.on("suspend", () => {
    console.log("The system is going to sleep");
    python.pause();
});

powerMonitor.on("resume", () => {
    console.log("The system is resuming");
    python.resume();
});

powerMonitor.on("lock-screen", () => {
    console.log("The system is about to be locked");
    python.pause();
});

powerMonitor.on("unlock-screen", () => {
    console.log("The system is unlocked");
    python.resume();
});

const createWindow = () => {
    // Create the browser window
    const winBounds: Bounds = storage.getWinBounds();
    win = new BrowserWindow({
        minWidth: 450,
        minHeight: 400,
        width: winBounds.width,
        height: winBounds.height,
        show: false,
        autoHideMenuBar: true,
        center: true,
        title: "Dexcom",
        frame: false,
        titleBarStyle: "hidden",
        trafficLightPosition: { x: 12, y: 12 },
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    // Load the index.html of the app
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(
            path.join(
                __dirname,
                `../main/renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
            )
        );
    }

    // Display window
    win.show();

    // Listener to save window size
    win.on("resized", () => {
        var bounds = win.getBounds();
        storage.saveWinBounds({ width: bounds.width, height: bounds.height });
    });
};

const createWidget = () => {
    if (!widgetOpen) {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;
        widget = new BrowserWindow({
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
            widget.loadURL(WIDGET_WINDOW_VITE_DEV_SERVER_URL);
        } else {
            widget.loadFile(
                path.join(
                    __dirname,
                    `../widget/renderer/${WIDGET_WINDOW_VITE_NAME}/index.html`
                )
            );
        }

        widgetOpen = true;

        win.focus();

        widget.on("close", () => {
            widgetOpen = false;
            // sendRender({ CLOSE_WIDGET: null });
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
    if (python instanceof Python) {
        if (python.running) {
            e.preventDefault;
            python.end();
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
            { role: "reload" },
            { role: "forceReload" },
            { role: "toggleDevTools" },
            { type: "separator" },
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
            { type: "separator" },
            { role: "window" },
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
