import {
    ComponentProps,
    ComponentType,
    forwardRef,
    MouseEventHandler,
} from "react";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends ComponentProps<"button"> {
    click: MouseEventHandler;
    text: string;
    Icon?: ComponentType;
    tabbable: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, className, click, text, Icon, tabbable, ...props }, ref) => {
        const tabIndex = tabbable ? 0 : -1;
        const isIcon = Icon ? true : false;
        return (
            <button
                tabIndex={tabIndex}
                ref={ref}
                onClick={click}
                className={twMerge(
                    "select-none appearance-none inline-flex items-center font-medium text-sm text-dex-text bg-dex-fg-light hover:bg-dex-fg focus-visible:outline-dex-green outline-transparent outline outline-2 py-2.5 pr-4 rounded-lg",
                    isIcon ? "pl-[14px]" : "pl-4",
                    className
                )}
                {...props}>
                {isIcon ? <Icon /> : ""}
                {text}
            </button>
        );
    }
);
