import { twMerge } from "tailwind-merge";
import { DraggableTopBar } from "./DraggableTopBar";
import { motion, HTMLMotionProps, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 0.5 },
};

export interface DimmerProps extends HTMLMotionProps<"div"> {
    active: boolean;
    show?: boolean;
    key?: any;
}

export const Dimmer = ({ active, className, ...props }: DimmerProps) => {
    return (
        <motion.div
            variants={variants}
            animate={active ? "visible" : "hidden"}
            transition={{
                duration: 0.3,
            }}
            className={twMerge(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-dex-text z-10 opacity-0",
                clsx({ "pointer-events-none": !active }),
                className
            )}
            {...props}>
            <DraggableTopBar hideLogo={true}></DraggableTopBar>
        </motion.div>
    );
};

const variantsFlashing = {
    hidden: { opacity: 0 },
    visible: { opacity: [0, 0.3, 0] },
};

export const DimmerFlashing = ({
    active,
    className,
    show,
    key,
    ...props
}: DimmerProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    variants={variantsFlashing}
                    key={`flasher${key}`}
                    animate={active ? "visible" : "hidden"}
                    initial={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear",
                    }}
                    className={twMerge(
                        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-dex-text z-10 opacity-0",
                        clsx({ "pointer-events-none": !active }),
                        className
                    )}
                    {...props}>
                    <DraggableTopBar hideLogo={true}></DraggableTopBar>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
