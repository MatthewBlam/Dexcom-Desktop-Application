import { ComponentProps, ChangeEventHandler, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { useSettingsContext } from "../contexts/SettingsContext";

export interface CheckboxProps extends ComponentProps<"div"> {
    label: string;
    checked: boolean;
    change: ChangeEventHandler;
    disabled: boolean;
    tabbable: boolean;
}

export const Checkbox = forwardRef<HTMLDivElement, CheckboxProps>(
    (
        {
            children,
            className,
            label,
            checked,
            change,
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
                ref={ref}
                className={twMerge(
                    "checkcontainer inline-flex items-center group",
                    className
                )}
                {...props}>
                <label
                    className="flex items-center cursor-pointer relative labelcontainer"
                    htmlFor="checkbox">
                    <input
                        tabIndex={tabIndex}
                        id="checkbox"
                        type="checkbox"
                        checked={checked}
                        onChange={change}
                        disabled={disabled}
                        className={twMerge(
                            G7theme
                                ? "bg-dex-fg-light border-dex-fg-dark group-hover:border-dex-text-muted group-hover:border-opacity-70"
                                : "bg-dex-fg-light border-dex-fg-dark group-hover:border-dex-text-muted group-hover:border-opacity-70",
                            "checkbox peer appearance-none cursor-pointer w-4 h-4 border-2 outline-none focus-visible:border-dex-green focus-visible:group-hover:border-dex-green rounded ring-0 checked:bg-dex-green checked:group-hover:border-dex-green checked:border-dex-green disabled:cursor-not-allowed"
                        )}></input>
                    <span className="absolute cursor-pointer pointer-events-none text-dex-bg opacity-0 peer-checked:opacity-100 peer-disabled:cursor-not-allowed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-[11px] w-[11px] cursor-pointer pointer-events-none"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="1.5">
                            <path
                                className="pointer-events-none"
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"></path>
                        </svg>
                    </span>
                </label>
                <label
                    htmlFor="checkbox"
                    className="checklabel font-medium cursor-pointer text-xs ml-[7px] mt-[1px] text-dex-text-muted select-none">
                    {label}
                </label>
            </div>
        );
    }
);
