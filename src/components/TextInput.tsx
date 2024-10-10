import { ComponentProps, ChangeEventHandler, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { useSettingsContext } from "../contexts/SettingsContext";

export interface TextInputProps extends ComponentProps<"div"> {
    label: string;
    placeholder: string;
    value: string;
    change: ChangeEventHandler;
    password?: boolean;
    disabled: boolean;
    tabbable: boolean;
}

export const TextInput = forwardRef<HTMLDivElement, TextInputProps>(
    (
        {
            children,
            className,
            label,
            placeholder,
            value,
            change,
            password = false,
            disabled,
            tabbable,
            ...props
        },
        ref
    ) => {
        const tabIndex = tabbable ? 0 : -1;
        const { sensorSetting } = useSettingsContext();
        const G7theme = sensorSetting === "G7" ? true : false;
        return (
            <div
                className={twMerge("flex flex-col gap-1.5", className)}
                {...props}>
                <span className="font-medium text-xs text-dex-text-muted pl-0.5 select-none">
                    {label}
                </span>
                <input
                    tabIndex={tabIndex}
                    className={twMerge(
                        G7theme
                            ? "bg-dex-fg-light disabled:bg-dex-fg-dark disabled:bg-opacity-40 border-dex-fg-dark hover:border-dex-text-muted disabled:hover:border-fg-dark disabled:border-dex-fg-dark hover:border-opacity-70"
                            : "bg-dex-fg-light disabled:bg-dex-fg-light disabled:bg-opacity-40 border-dex-fg-dark hover:border-dex-text-muted disabled:hover:border-fg disabled:border-dex-fg hover:border-opacity-70",
                        "font-medium text-sm placeholder-dex-text-muted text-dex-text disabled:text-dex-text-muted disabled:cursor-not-allowed border-2 focus-visible:border-dex-green outline-none ring-none focus-visible:ring-none rounded-lg py-1.5 px-2.5 block w-full"
                    )}
                    type={password ? "password" : "text"}
                    placeholder={placeholder}
                    value={value}
                    onChange={change}
                    disabled={disabled}></input>
            </div>
        );
    }
);
