// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WebMcpBridge } from "./WebMcpBridge";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, "modelContext");
  vi.restoreAllMocks();
});

describe("WebMcpBridge", () => {
  it("removes registered tools on unmount before registering them again", () => {
    const activeTools = new Set<string>();
    const registerTool = vi.fn((tool: { name: string }) => {
      activeTools.add(tool.name);
    });
    const unregisterTool = vi.fn((name: string) => {
      activeTools.delete(name);
    });

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool, unregisterTool },
    });

    const firstMount = render(<WebMcpBridge />);
    expect(activeTools).toEqual(
      new Set(["sf_tennis_get_courts", "sf_tennis_get_docs"]),
    );

    firstMount.unmount();
    expect(unregisterTool).toHaveBeenCalledTimes(2);
    expect(activeTools.size).toBe(0);

    render(<WebMcpBridge />);
    expect(registerTool).toHaveBeenCalledTimes(4);
    expect(activeTools).toEqual(
      new Set(["sf_tennis_get_courts", "sf_tennis_get_docs"]),
    );
  });

  it("aborts signal-based registrations on unmount", () => {
    const activeTools = new Set<string>();
    const registerTool = vi.fn(
      (tool: { name: string }, options?: { signal?: AbortSignal }) => {
        activeTools.add(tool.name);
        options?.signal?.addEventListener("abort", () => {
          activeTools.delete(tool.name);
        });
      },
    );

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool },
    });

    const mounted = render(<WebMcpBridge />);
    expect(activeTools.size).toBe(2);

    mounted.unmount();
    expect(activeTools.size).toBe(0);
  });

  it("invokes promise-resolved cleanup handles after unmount", async () => {
    const activeTools = new Set<string>();
    const resolveHandles: Array<() => void> = [];
    const registerTool = vi.fn((tool: { name: string }) => {
      activeTools.add(tool.name);
      return new Promise<() => void>((resolve) => {
        resolveHandles.push(() => resolve(() => activeTools.delete(tool.name)));
      });
    });

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool },
    });

    const mounted = render(<WebMcpBridge />);
    mounted.unmount();
    expect(activeTools.size).toBe(2);

    await act(async () => {
      resolveHandles.forEach((resolve) => resolve());
    });

    expect(activeTools.size).toBe(0);
  });

  it("rolls back earlier tools when a later registration throws", () => {
    const activeTools = new Set<string>();
    const registerTool = vi.fn((tool: { name: string }) => {
      if (tool.name === "sf_tennis_get_docs") {
        throw new Error("registration failed");
      }
      activeTools.add(tool.name);
    });
    const unregisterTool = vi.fn((name: string) => activeTools.delete(name));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool, unregisterTool },
    });

    render(<WebMcpBridge />);

    expect(registerTool).toHaveBeenCalledTimes(2);
    expect(unregisterTool).toHaveBeenCalledWith("sf_tennis_get_courts");
    expect(activeTools.size).toBe(0);
  });

  it("rolls back all tools when an asynchronous registration fails", async () => {
    const activeTools = new Set<string>();
    let rejectRegistration!: (error: Error) => void;
    const registerTool = vi.fn((tool: { name: string }) => {
      activeTools.add(tool.name);
      if (tool.name === "sf_tennis_get_docs") {
        return new Promise<void>((_resolve, reject) => {
          rejectRegistration = reject;
        });
      }
    });
    const unregisterTool = vi.fn((name: string) => activeTools.delete(name));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool, unregisterTool },
    });

    render(<WebMcpBridge />);
    await act(async () => {
      rejectRegistration(new Error("registration failed"));
    });

    expect(unregisterTool).toHaveBeenCalledTimes(2);
    expect(activeTools.size).toBe(0);
  });

  it("invokes the cleanup returned by bulk tool registration", () => {
    const dispose = vi.fn();
    const provideTools = vi.fn(() => dispose);

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { provideTools },
    });

    const mounted = render(<WebMcpBridge />);
    mounted.unmount();

    expect(provideTools).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("clears provided context on unmount when no cleanup is returned", () => {
    const provideContext = vi.fn();

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { provideContext },
    });

    const mounted = render(<WebMcpBridge />);
    mounted.unmount();

    expect(provideContext).toHaveBeenCalledTimes(2);
    expect(provideContext.mock.calls[1]?.[0]).toMatchObject({ tools: [] });
  });
});
