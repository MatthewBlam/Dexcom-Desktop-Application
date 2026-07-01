import { Tray, Menu, nativeImage } from "electron";
import path from "path";
import { Reading } from "../shared/types";
import { PushChannels } from "../shared/ipc-channels";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;

type PushFn = (channel: string, ...args: any[]) => void;

export class TrayManager {
  private tray: Tray | null = null;
  private menu: Menu | null = null;
  private pushToRenderer: PushFn;

  constructor(pushToRenderer: PushFn) {
    this.pushToRenderer = pushToRenderer;
  }

  init(): void {
    const iconPath = MAIN_WINDOW_VITE_DEV_SERVER_URL
      ? "src/graphics/app-logo-trayTemplate.png"
      : path.join(__dirname, "../assets/graphics/app-logo-trayTemplate.png");
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 13 });
    icon.setTemplateImage(true);
    this.tray = new Tray(icon);

    this.menu = Menu.buildFromTemplate([
      {
        id: "open-widget",
        label: "Open Widget",
        type: "normal",
        click: () => {
          this.pushToRenderer(PushChannels.TRAY_OPEN_WIDGET);
          this.showCloseWidgetMenu();
        },
      },
      {
        id: "close-widget",
        label: "Close Widget",
        type: "normal",
        click: () => {
          this.pushToRenderer(PushChannels.TRAY_CLOSE_WIDGET);
          this.showOpenWidgetMenu();
        },
      },
    ]);

    this.tray.setToolTip("Dexcom");
    this.tray.setContextMenu(this.menu);

    this.menu.getMenuItemById("open-widget")!.visible = false;
    this.menu.getMenuItemById("close-widget")!.visible = false;
  }

  showOpenWidgetMenu(): void {
    if (!this.menu) return;
    this.menu.getMenuItemById("close-widget")!.visible = false;
    this.menu.getMenuItemById("open-widget")!.visible = true;
  }

  showCloseWidgetMenu(): void {
    if (!this.menu) return;
    this.menu.getMenuItemById("open-widget")!.visible = false;
    this.menu.getMenuItemById("close-widget")!.visible = true;
  }

  reset(): void {
    if (!this.menu || !this.tray) return;
    this.menu.getMenuItemById("close-widget")!.visible = false;
    this.menu.getMenuItemById("open-widget")!.visible = false;
    this.tray.setTitle("");
  }

  update(reading: Reading, unit: string): void {
    if (!this.tray) return;
    const glucose = unit === "mmol/l" ? reading.mmol_l : reading.value;
    this.tray.setTitle(
      ` ${glucose === -1 ? "" : ` ${glucose}`} ${reading.trend_arrow}`
    );
  }
}
