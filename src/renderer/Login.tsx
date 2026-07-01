import {
    ChangeEventHandler,
    ComponentProps,
    forwardRef,
    MouseEventHandler,
} from "react";
import { twMerge } from "tailwind-merge";
import { TextInput } from "../components/TextInput";
import { LoginButton } from "../components/LoginButton";
import { Checkbox } from "../components/Checkbox";

export interface LoginProps extends ComponentProps<"div"> {
    userVal: string;
    passwordVal: string;
    regionVal: string;
    userChange: ChangeEventHandler;
    passwordChange: ChangeEventHandler;
    regionChange: (region: string) => void;
    loginClick: MouseEventHandler;
    disabled: boolean;
    tabbable: boolean;
}

export const Login = forwardRef<HTMLDivElement, LoginProps>(
    (
        {
            children,
            className,
            userVal,
            passwordVal,
            regionVal,
            userChange,
            passwordChange,
            regionChange,
            loginClick,
            disabled,
            tabbable,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={twMerge(
                    "basis-full px-14 max-w-[450px] flex flex-col gap-5",
                    className
                )}
                {...props}>
                <TextInput
                    tabbable={tabbable}
                    label="Username or Email"
                    placeholder="User ID"
                    value={userVal}
                    change={userChange}
                    disabled={disabled}
                    onKeyDownCapture={(e) => {
                        if (e.key === "Enter") {
                            (
                                e.currentTarget.nextElementSibling
                                    ?.childNodes[1] as HTMLElement | undefined
                            )?.focus();
                        }
                    }}></TextInput>
                <TextInput
                    tabbable={tabbable}
                    label="Password"
                    placeholder="Password"
                    value={passwordVal}
                    change={passwordChange}
                    password={true}
                    disabled={disabled}
                    onKeyDownCapture={(e) => {
                        if (e.key === "Enter") {
                            (
                                e.currentTarget.nextElementSibling?.childNodes[0]
                                    ?.childNodes[0] as HTMLElement | undefined
                            )?.focus();
                        }
                    }}></TextInput>
                <div className="flex gap-4 ml-[1px]">
                    <Checkbox
                        tabbable={tabbable}
                        label="United States"
                        checked={regionVal === "us"}
                        change={() => regionChange("us")}
                        disabled={disabled}></Checkbox>
                    <Checkbox
                        tabbable={tabbable}
                        label="Japan"
                        checked={regionVal === "jp"}
                        change={() => regionChange("jp")}
                        disabled={disabled}></Checkbox>
                    <Checkbox
                        tabbable={tabbable}
                        label="Other"
                        checked={regionVal === "ous"}
                        change={() => regionChange("ous")}
                        disabled={disabled}></Checkbox>
                </div>
                <LoginButton
                    tabbable={tabbable}
                    className="mt-2 mb-[22%]"
                    click={loginClick}
                    disabled={disabled}
                    text="Log In"></LoginButton>
            </div>
        );
    }
);
