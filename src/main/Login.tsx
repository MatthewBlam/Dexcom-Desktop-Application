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
    ousChecked: boolean;
    userChange: ChangeEventHandler;
    passwordChange: ChangeEventHandler;
    ousChange: ChangeEventHandler;
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
            ousChecked,
            userChange,
            passwordChange,
            ousChange,
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
                        if (e.key == "Enter") {
                            (
                                e.currentTarget.nextElementSibling
                                    .childNodes[1] as HTMLElement
                            ).focus();
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
                        if (e.key == "Enter") {
                            (
                                e.currentTarget.nextElementSibling.childNodes[0]
                                    .childNodes[0] as HTMLElement
                            ).focus();
                        }
                    }}></TextInput>
                <Checkbox
                    tabbable={tabbable}
                    className="ml-[1px]"
                    label="I do not live in the United States"
                    checked={ousChecked}
                    change={ousChange}
                    disabled={disabled}
                    onKeyDownCapture={(e) => {
                        if (e.key == "Enter") {
                            (
                                e.currentTarget.childNodes[0]
                                    .childNodes[0] as HTMLElement
                            ).click();
                        }
                    }}></Checkbox>
                <LoginButton
                    tabbable={tabbable}
                    className="mt-2 mb-[22%]"
                    click={loginClick}
                    text="Log In"></LoginButton>
            </div>
        );
    }
);
