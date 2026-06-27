import { forwardRef, MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";
import { HTMLMotionProps, motion } from "motion/react";
import { TriangleAlert, X } from "lucide-react";

export interface ErrorToastProps extends HTMLMotionProps<"div"> {
  active: boolean;
  text: string;
  close: MouseEventHandler;
}

const variants = {
  hidden: { y: 0, x: "-50%" },
  visible: { y: -400, x: "-50%" },
};

export const ErrorToast = forwardRef<HTMLDivElement, ErrorToastProps>(({ children, className, active, text, close, ...props }, ref) => {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      transition={{
        ease: "linear",
        duration: 0.1,
      }}
      ref={ref}
      className={twMerge("flex w-max content-center align-middle justify-center gap-2.5 px-4 py-3 rounded bg-dex-red select-none", className)}
      {...props}>
      <TriangleAlert className="shrink-0 w-[18px] h-[18px] text-dex-bg" strokeWidth={2} />

      <span className="flex items-center font-semibold text-xs pr-1 text-dex-bg select-none">{text.trim()}</span>

      <X onClick={close} className="shrink-0 size-4 text-dex-fg hover:text-dex-bg cursor-pointer pt-[1.25px]" strokeWidth={2.75} />
    </motion.div>
  );
});
