// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DocsImagePreview, type DocsPreviewImage } from "./DocsImagePreview";

const images: DocsPreviewImage[] = [
  {
    src: "/first.webp",
    alt: "First view",
    caption: "First image",
    description: "The first image",
  },
  {
    src: "/second.webp",
    alt: "Second view",
    caption: "Second image",
    description: "The second image",
  },
];

describe("DocsImagePreview", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.style.overflow = "auto";
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.style.overflow = "";
  });

  function render(previewImages: DocsPreviewImage[]) {
    act(() => root.render(<DocsImagePreview images={previewImages} />));
  }

  function open(caption: string) {
    const button = container.querySelector<HTMLButtonElement>(
      `[aria-label^="${caption}."]`,
    );
    expect(button).not.toBeNull();
    act(() => button?.click());
  }

  it("closes the preview and restores scrolling when the selected image is removed", () => {
    render(images);
    open("Second image");

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");

    render(images.slice(0, 1));

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("keeps the preview closed when the image list becomes empty", () => {
    render(images);
    open("First image");

    render([]);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe("auto");
  });
});
