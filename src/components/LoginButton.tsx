import { ComponentProps, forwardRef, MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";

export interface LoginButtonProps extends ComponentProps<"button"> {
    click: MouseEventHandler;
    text: string;
    disabled: boolean;
    tabbable: boolean;
}

export const LoginButton = forwardRef<HTMLButtonElement, LoginButtonProps>(
    (
        { children, className, click, text, disabled, tabbable, ...props },
        ref
    ) => {
        const tabIndex = tabbable ? 0 : -1;
        return (
            <button
                tabIndex={tabIndex}
                ref={ref}
                disabled={disabled}
                onClick={click}
                className={twMerge(
                    "ring-offset-dex-fg cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-dex-green select-none appearance-none font-medium text-base text-dex-bg bg-dex-green outline-none ring-2 ring-transparent ring-offset-2 focus-visible:ring-2 focus-visible:ring-dex-green hover:bg-dex-green-hover p-2 rounded-full",
                    className
                )}
                {...props}>
                {text}
            </button>
        );
    }
);
