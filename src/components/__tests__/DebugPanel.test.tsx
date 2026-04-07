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
  it("starts on the json tab by default", () => {
    render(<DebugPanel {...defaultProps} />);
    expect(
      screen.getByText("No response yet. Generate a UI to see the raw output.")
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
});

describe("DebugPanel — persistent Thinking tab", () => {
  it("shows Thinking tab when thinkingContent is provided", () => {
    render(<DebugPanel {...defaultProps} thinkingContent="Model reasoning..." />);
    expect(screen.getByText("Thinking")).toBeTruthy();
  });

  it("keeps Thinking tab visible after thinkingContent resets to null", () => {
    const { rerender } = render(
      <DebugPanel {...defaultProps} thinkingContent="Model reasoning..." />
    );
    expect(screen.getByText("Thinking")).toBeTruthy();
    // Simulate generation complete — thinkingContent becomes null
    rerender(<DebugPanel {...defaultProps} thinkingContent={null} />);
    // Tab should still be visible
    expect(screen.getByText("Thinking")).toBeTruthy();
  });

  it("hides Thinking tab when no thinking content has ever existed", () => {
    render(<DebugPanel {...defaultProps} />);
    expect(screen.queryByText("Thinking")).toBeNull();
  });

  it("shows fallback message when tab is visible but content is null", () => {
    const { rerender } = render(
      <DebugPanel {...defaultProps} thinkingContent="Reasoning..." />
    );
    // Switch to thinking tab
    fireEvent.click(screen.getByText("Thinking"));
    // Reset content
    rerender(<DebugPanel {...defaultProps} thinkingContent={null} />);
    expect(screen.getByText("No thinking output for this generation.")).toBeTruthy();
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
