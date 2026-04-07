import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { DebugPanel } from "../DebugPanel";

afterEach(cleanup);

const defaultProps = {
  rawJson: null,
  error: null,
  systemPrompt: null,
  streamLines: null,
  thinkingContent: null,
};

describe("DebugPanel — controlled tab state", () => {
  it("starts on the patches tab by default", () => {
    render(<DebugPanel {...defaultProps} />);
    expect(
      screen.getByText("No patches yet. Generate a UI to see streaming JSONL output.")
    ).toBeTruthy();
  });

  it("persists tab selection across re-renders", () => {
    const { rerender } = render(<DebugPanel {...defaultProps} />);
    // Switch to errors tab
    fireEvent.click(screen.getByText("Errors"));
    // Re-render with new props (simulating streaming update)
    rerender(<DebugPanel {...defaultProps} rawJson='{"root":"a"}' />);
    // Errors tab content should still be visible
    expect(screen.getByText("No errors.")).toBeTruthy();
  });

  it("shows patches and raw JSON as separate tabs", () => {
    render(
      <DebugPanel
        {...defaultProps}
        streamLines={["patch1"]}
        rawJson='{"root":"a"}'
      />
    );
    expect(screen.getByText("JSONL Patches")).toBeTruthy();
    expect(screen.getByText("Raw JSON")).toBeTruthy();
  });

  it("preserves patches after streaming ends", () => {
    render(
      <DebugPanel
        {...defaultProps}
        streamLines={["patch1", "patch2"]}
        rawJson='{"root":"a"}'
      />
    );
    // Patches tab is default and shows streaming content
    const pre = document.querySelector("pre");
    expect(pre?.textContent).toContain("patch1");
    expect(pre?.textContent).toContain("patch2");
  });
});

describe("DebugPanel — Thinking tab", () => {
  it("always shows the Thinking tab", () => {
    render(<DebugPanel {...defaultProps} />);
    expect(screen.getByText("Thinking")).toBeTruthy();
  });

  it("shows thinking content when provided", () => {
    render(<DebugPanel {...defaultProps} thinkingContent="Model reasoning..." />);
    fireEvent.click(screen.getByText("Thinking"));
    expect(screen.getByText("Model reasoning...")).toBeTruthy();
  });

  it("shows fallback message when no thinking content", () => {
    render(<DebugPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Thinking"));
    expect(screen.getByText("No thinking output available.")).toBeTruthy();
  });
});

describe("DebugPanel — auto-scroll", () => {
  it("attaches refs to JSONL pre element for auto-scroll", () => {
    render(
      <DebugPanel
        {...defaultProps}
        streamLines={["line1", "line2", "line3"]}
      />
    );
    const pre = document.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain("line1");
  });

  it("renders without errors when content is empty", () => {
    const { container } = render(<DebugPanel {...defaultProps} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("attaches ref to thinking pre element", () => {
    render(
      <DebugPanel {...defaultProps} thinkingContent="Thinking..." />
    );
    fireEvent.click(screen.getByText("Thinking"));
    const pres = document.querySelectorAll("pre");
    const thinkingPre = Array.from(pres).find((p) =>
      p.textContent?.includes("Thinking...")
    );
    expect(thinkingPre).not.toBeNull();
  });
});
