import { ComponentProps, forwardRef, MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";
import { useSettingsContext } from "../contexts/SettingsContext";

export interface LoginButtonProps extends ComponentProps<"button"> {
    click: MouseEventHandler;
    text: string;
    tabbable: boolean;
}

export const LoginButton = forwardRef<HTMLButtonElement, LoginButtonProps>(
    ({ children, className, click, text, tabbable, ...props }, ref) => {
        const tabIndex = tabbable ? 0 : -1;
        const { sensorSetting } = useSettingsContext();
        const G7theme = sensorSetting === "G7" ? true : false;
        return (
            <button
                tabIndex={tabIndex}
                ref={ref}
                onClick={click}
                className={twMerge(
                    G7theme ? "ring-offset-dex-fg" : "ring-offset-dex-bg",
                    "select-none appearance-none font-medium text-base text-dex-bg bg-dex-green outline-none ring-2 ring-transparent ring-offset-2 focus-visible:ring-2 focus-visible:ring-dex-green hover:bg-dex-green-hover p-2 rounded-full",
                    className
                )}
                {...props}>
                {text}
            </button>
        );
    }
);
