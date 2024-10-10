import { forwardRef, MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";
import { HTMLMotionProps, motion } from "framer-motion";

export interface ErrorToastProps extends HTMLMotionProps<"div"> {
    active: boolean;
    text: string;
    close: MouseEventHandler;
}

const variants = {
    hidden: { y: 0, x: "-50%" },
    visible: { y: -400, x: "-50%" },
};

export const ErrorToast = forwardRef<HTMLDivElement, ErrorToastProps>(
    ({ children, className, active, text, close, ...props }, ref) => {
        return (
            <motion.div
                variants={variants}
                animate={active ? "visible" : "hidden"}
                transition={{
                    ease: "linear",
                    duration: 0.1,
                }}
                ref={ref}
                className={twMerge(
                    "flex w-max content-center align-middle justify-center gap-2.5 px-4 py-3 rounded bg-dex-red select-none",
                    className
                )}
                {...props}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    className="shrink-0 w-[18px] h-[18px] text-dex-bg">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                </svg>

                <span className="flex items-center font-semibold text-xs pr-1 text-dex-bg select-none">
                    {text.trim()}
                </span>

                <svg
                    onClick={close}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.75"
                    stroke="currentColor"
                    className="shrink-0 size-4 text-dex-fg hover:text-dex-bg cursor-pointer pt-[1.25px]">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                    />
                </svg>
            </motion.div>
        );
    }
);
