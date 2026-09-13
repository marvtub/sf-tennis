// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
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

  it("observes registration promises before aborting them", () => {
    const registrations = [Promise.resolve(), Promise.resolve()];
    const catchSpies = registrations.map((registration) =>
      vi.spyOn(registration, "catch"),
    );
    const registerTool = vi
      .fn()
      .mockReturnValueOnce(registrations[0])
      .mockReturnValueOnce(registrations[1]);

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool },
    });

    const mounted = render(<WebMcpBridge />);
    mounted.unmount();

    for (const catchSpy of catchSpies) {
      expect(catchSpy).toHaveBeenCalledTimes(1);
    }
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
