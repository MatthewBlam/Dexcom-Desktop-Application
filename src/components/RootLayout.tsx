import { twMerge } from "tailwind-merge";
import { HTMLMotionProps, motion } from "framer-motion";

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
            animate={{ opacity: 1 }}
            transition={{ duration: duration, delay: delay }}
            className={twMerge("opacity-0 h-full", className)}
            {...props}>
            {children}
        </motion.main>
    );
};
