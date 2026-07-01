import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Login } from "../renderer/Login";
import { Settings } from "../components/Settings";
import { DEFAULT_SETTINGS } from "../shared/types";

vi.mock("motion/react", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        return ({ children, ...props }: any) => {
          const Tag = String(prop);
          return <div data-motion-tag={Tag} {...props}>{children}</div>;
        };
      },
    }
  ),
  HTMLMotionProps: {},
  useAnimate: () => [vi.fn(), vi.fn()],
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("lucide-react", () => ({
  Settings: () => <span>SettingsIcon</span>,
  Expand: () => <span>ExpandIcon</span>,
  Shrink: () => <span>ShrinkIcon</span>,
  RotateCcw: () => <span>RotateCcwIcon</span>,
  ChevronLeft: () => <span>ChevronLeftIcon</span>,
  ChevronRight: () => <span>ChevronRightIcon</span>,
  Info: () => <span>InfoIcon</span>,
}));

describe("Login", () => {
  it("renders username and password inputs", () => {
    render(
      <Login
        userVal=""
        passwordVal=""
        regionVal="us"
        userChange={vi.fn()}
        passwordChange={vi.fn()}
        regionChange={vi.fn()}
        loginClick={vi.fn()}
        disabled={false}
        tabbable={true}
      />
    );
    expect(screen.getByPlaceholderText("User ID")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("renders the region checkboxes", () => {
    render(
      <Login
        userVal=""
        passwordVal=""
        regionVal="us"
        userChange={vi.fn()}
        passwordChange={vi.fn()}
        regionChange={vi.fn()}
        loginClick={vi.fn()}
        disabled={false}
        tabbable={true}
      />
    );
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("renders the login button", () => {
    render(
      <Login
        userVal=""
        passwordVal=""
        regionVal="us"
        userChange={vi.fn()}
        passwordChange={vi.fn()}
        regionChange={vi.fn()}
        loginClick={vi.fn()}
        disabled={false}
        tabbable={true}
      />
    );
    expect(screen.getByText("Log In")).toBeInTheDocument();
  });

  it("displays user-provided values", () => {
    render(
      <Login
        userVal="testuser"
        passwordVal="secret"
        regionVal="ous"
        userChange={vi.fn()}
        passwordChange={vi.fn()}
        regionChange={vi.fn()}
        loginClick={vi.fn()}
        disabled={false}
        tabbable={true}
      />
    );
    expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
  });
});

describe("Settings", () => {
  const defaultProps = {
    active: true,
    settingsTabbable: true,
    draft: DEFAULT_SETTINGS,
    updateDraft: vi.fn(),
    onSave: vi.fn(),
    onClose: vi.fn(),
    onReset: vi.fn(),
    confirmActive: false,
    confirmTabbable: false,
    onOpenConfirm: vi.fn(),
    onCloseConfirm: vi.fn(),
    onLogout: vi.fn(),
  };

  it("renders the settings panel", () => {
    render(<Settings {...defaultProps} />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders threshold labels", () => {
    render(<Settings {...defaultProps} />);
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("renders log out button", () => {
    render(<Settings {...defaultProps} />);
    expect(screen.getByText("Log Out")).toBeInTheDocument();
  });
});
