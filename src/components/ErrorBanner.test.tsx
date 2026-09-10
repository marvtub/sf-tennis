import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ErrorBanner } from "./ErrorBanner";

interface ElementProps {
  children?: ReactNode;
  onClick?: () => void;
}

function findElement(
  node: ReactNode,
  predicate: (element: ReactElement<ElementProps>) => boolean,
): ReactElement<ElementProps> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, predicate);
      if (match) return match;
    }
    return undefined;
  }

  if (!isValidElement<ElementProps>(node)) return undefined;
  if (predicate(node)) return node;
  return findElement(node.props.children, predicate);
}

describe("ErrorBanner", () => {
  it("announces the error and keeps retry available", () => {
    const onRetry = vi.fn();
    const banner = ErrorBanner({ message: "Service unavailable", onRetry });
    const markup = renderToStaticMarkup(banner);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Service unavailable");
    expect(markup).toMatch(/<span[^>]*aria-hidden="true"[^>]*>⚠<\/span>/);

    const retryButton = findElement(banner, (element) => element.type === "button");
    expect(retryButton).toBeDefined();
    retryButton?.props.onClick?.();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
