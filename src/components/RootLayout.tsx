import { twMerge } from "tailwind-merge";
import { HTMLMotionProps, motion } from "motion/react";

export interface RootProps extends HTMLMotionProps<"main"> {
    duration: number;
    delay: number;
}

export const RootLayout = ({
    children,
    className,
    duration,
    delay,
    ...props
}: RootProps) => {
    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: duration, delay: delay }}
            className={twMerge("h-full", className)}
            {...props}>
            {children}
        </motion.main>
    );
};
