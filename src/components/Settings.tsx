import { ComponentProps, forwardRef, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { HTMLMotionProps, motion } from "framer-motion";
import { Button } from "./Button";

type SettingsPayload = {
    sensor: string;
    unit: string;
    high: number;
    low: number;
    highMMOLL: number;
    lowMMOLL: number;
};

export interface SettingsProps extends HTMLMotionProps<"div"> {
    active: boolean;
    closeSettings: () => void;
    storeSettings: (settings: SettingsPayload) => void;
    settingsTabbable: boolean;
    confirmActive: boolean;
    openConfirm: () => void;
    closeConfirm: (logout?: boolean) => void;
    logoutClick: () => void;
    confirmTabbable: boolean;

    sensorState: string;
    unitState: string;
    highState: number;
    lowState: number;
    highMMOLLState: number;
    lowMMOLLState: number;

    setSensorState: (sensor: string) => void;
    setUnitState: (unit: string) => void;
    setHighState: (value: number) => void;
    setLowState: (value: number) => void;
    setHighMMOLLState: (value: number) => void;
    setLowMMOLLState: (value: number) => void;
}

const variants = {
    hidden: { opacity: 0, scale: 0, x: "-50%", y: "-50%" },
    visible: { opacity: 1, scale: 1, x: "-50%", y: "-50%" },
};

export const Settings = forwardRef<HTMLDivElement, SettingsProps>(
    (
        {
            children,
            className,
            active,
            closeSettings,
            storeSettings,
            settingsTabbable,
            confirmActive,
            openConfirm,
            closeConfirm,
            logoutClick,
            confirmTabbable,

            sensorState,
            unitState,
            highState,
            lowState,
            highMMOLLState,
            lowMMOLLState,

            setSensorState,
            setUnitState,
            setHighState,
            setLowState,
            setHighMMOLLState,
            setLowMMOLLState,
            ...props
        },
        ref
    ) => {
        const sensorElement = useRef(null);
        const unitElement = useRef(null);
        const highElement = useRef(null);
        const lowElement = useRef(null);
        const highElementMMOLL = useRef(null);
        const lowElementMMOLL = useRef(null);

        function saveSettings() {
            const settings = {
                sensor: sensorState,
                unit: unitState,
                high: highState,
                low: lowState,
                highMMOLL: highMMOLLState,
                lowMMOLL: lowMMOLLState,
            };
            console.log("SAVING SETTINGS", settings);
            storeSettings(settings);
            closeSettings();
        }

        return (
            <>
                <motion.div
                    variants={variants}
                    animate={active ? "visible" : "hidden"}
                    transition={{
                        duration: 0.05,
                        opacity: {
                            duration: 0.2,
                        },
                    }}
                    ref={ref}
                    className={twMerge(
                        "bg-dex-bg z-20 drop-shadow-2xl rounded-xl size-fit opacity-0 absolute left-1/2 top-1/2 [@media(max-height:430px)]:top-[53.5%] transition-top duration-1000",
                        className
                    )}
                    {...props}>
                    <div className="w-full h-full p-6">
                        <div className="w-full h-full flex flex-col gap-1.5 justify-start items-center">
                            <div className="w-full flex flex-row content-start">
                                <span className="text-dex-text text-xl select-none font-semibold ml-0.5">
                                    Settings
                                </span>
                                <button
                                    tabIndex={settingsTabbable ? 12 : -1}
                                    onClick={() => {
                                        closeSettings();
                                    }}
                                    className="appearance-none focus-visible:outline-dex-green relative inline-flex ml-auto items-center justify-center size-6 rounded transition-none bg-dex-bg">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2.15"
                                        stroke="currentColor"
                                        className="size-5 absolute text-dex-text-muted hover:text-dex-text transition-all duration-[0.03s]">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18 18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className="w-full h-full pb-4 pt-2.5 px-0.5 flex flex-row gap-8 mb-6">
                                <div className="w-full flex flex-col content-start gap-8">
                                    <div className="low">
                                        <div className="text-dex-text text-sm select-none font-medium mb-1.5 ml-0.5">
                                            Low
                                        </div>
                                        {unitState === "mg/dl" ? (
                                            <ValueBox
                                                valueBoxHandler={setLowState}
                                                comparison={highState}
                                                tabbable={settingsTabbable}
                                                index={[1, 2]}
                                                ref={lowElement}
                                                value={lowState}
                                                min={60}
                                                max={150}></ValueBox>
                                        ) : (
                                            <ValueBoxMMOLL
                                                valueBoxHandler={
                                                    setLowMMOLLState
                                                }
                                                comparison={highMMOLLState}
                                                tabbable={settingsTabbable}
                                                index={[1, 2]}
                                                ref={lowElementMMOLL}
                                                value={lowMMOLLState}
                                                min={3.5}
                                                max={8.5}></ValueBoxMMOLL>
                                        )}
                                    </div>
                                    <div className="version">
                                        <div className="text-dex-text text-sm select-none font-medium mb-1.5 ml-0.5">
                                            Sensor
                                        </div>
                                        <SegmentedButton
                                            changeHandler={(btn: number) => {
                                                if (btn == 1) {
                                                    setSensorState("G7");
                                                } else {
                                                    setSensorState("G6");
                                                }
                                            }}
                                            tabbable={settingsTabbable}
                                            index={[5, 6]}
                                            ref={sensorElement}
                                            buttonOne="G7"
                                            buttonTwo="G6"
                                            activeButton={
                                                sensorState === "G7" ? 1 : 2
                                            }></SegmentedButton>
                                    </div>
                                </div>

                                <div className="w-full flex flex-col content-start gap-8">
                                    <div className="high">
                                        <div className="text-dex-text text-sm select-none font-medium mb-1.5 ml-0.5">
                                            High
                                        </div>
                                        {unitState === "mg/dl" ? (
                                            <ValueBox
                                                valueBoxHandler={setHighState}
                                                comparison={lowState}
                                                tabbable={settingsTabbable}
                                                index={[3, 4]}
                                                ref={highElement}
                                                value={highState}
                                                min={150}
                                                max={400}></ValueBox>
                                        ) : (
                                            <ValueBoxMMOLL
                                                valueBoxHandler={
                                                    setHighMMOLLState
                                                }
                                                comparison={lowMMOLLState}
                                                tabbable={settingsTabbable}
                                                index={[3, 4]}
                                                ref={highElementMMOLL}
                                                value={highMMOLLState}
                                                min={8.5}
                                                max={22.0}></ValueBoxMMOLL>
                                        )}
                                    </div>
                                    <div className="unit">
                                        <div className="text-dex-text text-sm select-none font-medium mb-1.5 ml-0.5">
                                            Unit
                                        </div>
                                        <SegmentedButton
                                            changeHandler={(btn: number) => {
                                                if (btn == 1) {
                                                    setUnitState("mg/dl");
                                                } else {
                                                    setUnitState("mmol/l");
                                                }
                                            }}
                                            tabbable={settingsTabbable}
                                            index={[7, 8]}
                                            ref={unitElement}
                                            buttonOne="mg/dl"
                                            buttonTwo="mmol/l"
                                            activeButton={
                                                unitState === "mg/dl" ? 1 : 2
                                            }></SegmentedButton>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full flex flex-row mt-auto justify-end gap-1">
                                <Button
                                    className="mr-auto focus-visible:outline-dex-green outline-transparent text-sm pl-[14.15px] pr-[14.25px]"
                                    text="Log Out"
                                    tabbable={settingsTabbable}
                                    tabIndex={settingsTabbable ? 11 : -1}
                                    click={() => {
                                        closeSettings();
                                        openConfirm();
                                    }}></Button>
                                <Button
                                    className="text-sm py-2 pl-3.5 pr-[14.25px] bg-dex-bg hover:bg-dex-bg text-dex-text-muted hover:text-dex-text "
                                    text="Cancel"
                                    tabbable={settingsTabbable}
                                    tabIndex={settingsTabbable ? 10 : -1}
                                    click={() => {
                                        closeSettings();
                                    }}></Button>
                                <Button
                                    className="focus-visible:outline-dex-green outline-transparent text-sm py-2 pl-3.5 pr-[14.25px]"
                                    text="Save"
                                    tabbable={settingsTabbable}
                                    tabIndex={settingsTabbable ? 9 : -1}
                                    click={() => {
                                        saveSettings();
                                    }}></Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    id="confirmation"
                    variants={variants}
                    animate={confirmActive ? "visible" : "hidden"}
                    transition={{
                        duration: 0.05,
                        opacity: {
                            duration: 0.2,
                        },
                    }}
                    className="w-max absolute rounded-lg bg-dex-bg drop-shadow-2xl opacity-0 left-1/2 top-1/2 p-6 z-30">
                    <div className="text-nowrap mb-1 text-lg font-semibold text-dex-text">
                        Confirm
                    </div>
                    <div className="mb-6 text-sm font-normal text-dex-text-muted">
                        Are you sure you want to log out?
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            className="text-sm py-2 pl-3.5 pr-[14.25px] bg-dex-bg hover:bg-dex-bg text-dex-text-muted hover:text-dex-text "
                            text="No"
                            tabbable={confirmTabbable}
                            click={() => {
                                closeConfirm();
                            }}></Button>
                        <Button
                            className="focus-visible:outline-dex-green outline-transparent text-sm py-2 pl-3.5 pr-[14.25px]"
                            text="Yes"
                            tabbable={confirmTabbable}
                            click={() => {
                                logoutClick();
                                closeConfirm(true);
                            }}></Button>
                    </div>
                </motion.div>
            </>
        );
    }
);

interface SegmentedButtonProps extends ComponentProps<"div"> {
    buttonOne: string;
    buttonTwo: string;
    activeButton: 1 | 2;
    tabbable: boolean;
    index: number[];
    changeHandler: (button: 1 | 2) => void;
}

const SegmentedButton = forwardRef<HTMLDivElement, SegmentedButtonProps>(
    (
        {
            children,
            className,
            buttonOne,
            buttonTwo,
            activeButton,
            tabbable,
            index,
            changeHandler,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={twMerge(
                    "w-fit flex items-center justify-center p-1 gap-1 rounded-lg bg-dex-fg-light text-dex-text-light",
                    className
                )}
                {...props}>
                <button
                    tabIndex={tabbable ? index[0] : -1}
                    onClick={(e) => {
                        changeHandler(1);
                    }}
                    data-state={activeButton === 1 ? "active" : ""}
                    className="focus-visible:outline-dex-green select-none outline-transparent outline outline-2 flex items-center justify-center whitespace-nowrap rounded-md px-6 py-1 text-sm font-normal hover:bg-dex-fg data-[state=active]:bg-dex-bg data-[state=active]:drop-shadow-ms data-[state=active]:text-dex-text data-[state=active]:font-medium">
                    {buttonOne}
                </button>
                <button
                    tabIndex={tabbable ? index[1] : -1}
                    onClick={(e) => {
                        changeHandler(2);
                    }}
                    data-state={activeButton === 2 ? "active" : ""}
                    className="focus-visible:outline-dex-green select-none outline-transparent outline outline-2 flex items-center justify-center whitespace-nowrap rounded-md px-6 py-1 text-sm font-normal hover:bg-dex-fg data-[state=active]:bg-dex-bg data-[state=active]:drop-shadow-ms data-[state=active]:text-dex-text data-[state=active]:font-medium">
                    {buttonTwo}
                </button>
            </div>
        );
    }
);

interface ValueBoxProps extends ComponentProps<"div"> {
    value: number;
    comparison: number;
    min: number;
    max: number;
    tabbable: boolean;
    index: number[];
    valueBoxHandler: (value: number) => void;
}

const ValueBox = forwardRef<HTMLDivElement, ValueBoxProps>(
    (
        {
            children,
            className,
            value,
            comparison,
            min,
            max,
            tabbable,
            index,
            valueBoxHandler,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={twMerge(
                    "w-[145.6px] flex relative gap-1.5 bg-dex-fg-light py-1.5 px-1.5 items-center justify-center rounded-lg ",
                    className
                )}
                {...props}>
                <button
                    tabIndex={tabbable ? index[0] : -1}
                    onClick={(e) => {
                        const newValue = value - 5;
                        if (newValue == comparison) {
                            return;
                        }
                        if (newValue >= min) {
                            valueBoxHandler(newValue);
                            value = newValue;
                        }
                    }}
                    className="focus-visible:outline-dex-green outline-transparent outline outline-2 mr-auto p-1 rounded text-dex-text-muted hover:text-dex-text-muted bg-dex-fg-light hover:bg-dex-fg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        className="size-4 p-0.5">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5 8.25 12l7.5-7.5"
                        />
                    </svg>
                </button>
                <div className="w-[72px] h-7 px-6 select-none rounded-md drop-shadow-ms absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] bg-dex-bg p-2 text-dex-text text-sm font-medium text-center flex items-center justify-center">
                    {value}
                </div>
                <button
                    tabIndex={tabbable ? index[1] : -1}
                    onClick={(e) => {
                        const newValue = value + 5;
                        if (newValue == comparison) {
                            return;
                        }
                        if (newValue <= max) {
                            valueBoxHandler(newValue);
                            value = newValue;
                        }
                    }}
                    className="focus-visible:outline-dex-green outline-transparent outline outline-2 ml-auto p-1 rounded text-dex-text-muted hover:text-dex-text-muted bg-dex-fg-light hover:bg-dex-fg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        className="size-4 p-0.5">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                    </svg>
                </button>
            </div>
        );
    }
);

const ValueBoxMMOLL = forwardRef<HTMLDivElement, ValueBoxProps>(
    (
        {
            children,
            className,
            value,
            comparison,
            min,
            max,
            tabbable,
            index,
            valueBoxHandler,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={twMerge(
                    "w-[145.6px] flex relative gap-1.5 bg-dex-fg-light py-1.5 px-1.5 items-center justify-center rounded-lg ",
                    className
                )}
                {...props}>
                <button
                    tabIndex={tabbable ? index[0] : -1}
                    onClick={(e) => {
                        const newValue = value - 0.5;
                        if (newValue == comparison) {
                            return;
                        }
                        if (newValue >= min) {
                            valueBoxHandler(newValue);
                            value = newValue;
                        }
                    }}
                    className="focus-visible:outline-dex-green outline-transparent outline outline-2 mr-auto p-1 rounded text-dex-text-muted hover:text-dex-text-muted bg-dex-fg-light hover:bg-dex-fg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        className="size-4 p-0.5">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5 8.25 12l7.5-7.5"
                        />
                    </svg>
                </button>
                <div className="w-[72px] h-7 px-6 select-none rounded-md drop-shadow-ms absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] bg-dex-bg p-2 text-dex-text text-sm font-medium text-center flex items-center justify-center">
                    {value.toFixed(1)}
                </div>
                <button
                    tabIndex={tabbable ? index[1] : -1}
                    onClick={(e) => {
                        const newValue = value + 0.5;
                        if (newValue == comparison) {
                            return;
                        }
                        if (newValue <= max) {
                            valueBoxHandler(newValue);
                            value = newValue;
                        }
                    }}
                    className="focus-visible:outline-dex-green outline-transparent outline outline-2 ml-auto p-1 rounded text-dex-text-muted hover:text-dex-text-muted bg-dex-fg-light hover:bg-dex-fg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        className="size-4 p-0.5">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                    </svg>
                </button>
            </div>
        );
    }
);
