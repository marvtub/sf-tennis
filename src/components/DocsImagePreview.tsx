"use client";

import { useEffect, useRef, useState } from "react";

export type DocsPreviewImage = {
  src: string;
  alt: string;
  caption: string;
  description: string;
};

export function DocsImagePreview({ images }: { images: DocsPreviewImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];
  const isOpen = activeIndex !== null;

  function handleDialogKeydown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;

    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ),
    );
    const firstControl = controls[0];
    const lastControl = controls.at(-1);

    if (event.shiftKey && document.activeElement === firstControl) {
      event.preventDefault();
      lastControl?.focus();
    } else if (!event.shiftKey && document.activeElement === lastControl) {
      event.preventDefault();
      firstControl?.focus();
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    closeButtonRef.current?.focus();

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setActiveIndex((index) =>
          index === null ? index : (index + 1) % images.length
        );
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((index) =>
          index === null ? index : (index - 1 + images.length) % images.length
        );
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
      if (dialog?.open) dialog.close();
      triggerRef.current?.focus();
    };
  }, [isOpen, images.length]);

  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={(event) => {
              triggerRef.current = event.currentTarget;
              setActiveIndex(index);
            }}
            className="group block overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            aria-label={`${image.caption}. ${image.description} Open larger preview`}
          >
            <img
              src={image.src}
              alt={image.alt}
              width={1280}
              height={720}
              loading="eager"
              decoding="async"
              className="aspect-video w-full bg-slate-100 object-cover dark:bg-slate-800"
            />
            <span className="block border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="block text-sm font-semibold text-slate-950 dark:text-white">
                {image.caption}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                {image.description}
              </span>
            </span>
          </button>
        ))}
      </div>

      {activeImage && activeIndex !== null && (
        <dialog
          ref={dialogRef}
          className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-transparent p-3 backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm open:flex sm:p-6"
          aria-label={`${activeImage.caption} preview`}
          onClick={() => setActiveIndex(null)}
          onKeyDown={handleDialogKeydown}
          onCancel={(event) => {
            event.preventDefault();
            setActiveIndex(null);
          }}
        >
          <div
            className="max-h-full w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                  {activeImage.caption}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeIndex + 1} of {images.length}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setActiveIndex(null)}
                className="rounded-md px-2 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="bg-slate-100 p-2 dark:bg-slate-900 sm:p-4">
              <img
                src={activeImage.src}
                alt={activeImage.alt}
                width={1280}
                height={720}
                className="max-h-[78vh] w-full rounded-md object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((activeIndex - 1 + images.length) % images.length)
                }
                className="rounded-md px-2 py-1 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                Previous
              </button>
              <p className="hidden text-center text-slate-500 dark:text-slate-400 sm:block">
                {activeImage.description}
              </p>
              <button
                type="button"
                onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
                className="rounded-md px-2 py-1 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                Next
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
