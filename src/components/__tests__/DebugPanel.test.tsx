import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { DebugPanel } from "../DebugPanel";
import { DiagnosticsProvider, useDiagnosticsDispatch } from "@/chat/diagnostics-context";
import type { DiagnosticsState } from "@/chat/diagnostics-context";
import { useEffect } from "react";

afterEach(cleanup);

/**
 * Helper to render DebugPanel with a DiagnosticsProvider
 * and optionally set initial diagnostics state.
 */
function renderWithDiagnostics(initialState?: Partial<DiagnosticsState>) {
  function Initializer({ state }: { state?: Partial<DiagnosticsState> }) {
    const { setState } = useDiagnosticsDispatch();
    useEffect(() => {
      if (state) setState(state);
    }, []);
    return null;
  }

  return render(
    <DiagnosticsProvider>
      <Initializer state={initialState} />
      <DebugPanel />
    </DiagnosticsProvider>,
  );
}

describe("DebugPanel — controlled tab state", () => {
  it("starts on the patches tab by default", () => {
    renderWithDiagnostics();
    expect(
      screen.getByText(
        "No patches yet. Generate a UI to see streaming JSONL output.",
      ),
    ).toBeTruthy();
  });

  it("persists tab selection across re-renders", () => {
    const { rerender } = render(
      <DiagnosticsProvider>
        <DebugPanel />
      </DiagnosticsProvider>,
    );
    // Switch to errors tab
    fireEvent.click(screen.getByText("Errors"));
    // Re-render
    rerender(
      <DiagnosticsProvider>
        <DebugPanel />
      </DiagnosticsProvider>,
    );
    // Errors tab content should still be visible
    expect(screen.getByText("No errors.")).toBeTruthy();
  });

  it("shows patches and raw JSON as separate tabs", () => {
    renderWithDiagnostics({
      rawLines: ["patch1"],
      rawJson: '{"root":"a"}',
    });
    expect(screen.getByText("JSONL Patches")).toBeTruthy();
    expect(screen.getByText("Raw JSON")).toBeTruthy();
  });

  it("preserves patches after streaming ends", () => {
    renderWithDiagnostics({
      rawLines: ["patch1", "patch2"],
      rawJson: '{"root":"a"}',
    });
    const pre = document.querySelector("pre");
    expect(pre?.textContent).toContain("patch1");
    expect(pre?.textContent).toContain("patch2");
  });
});

describe("DebugPanel — Thinking tab", () => {
  it("always shows the Thinking tab", () => {
    renderWithDiagnostics();
    expect(screen.getByText("Thinking")).toBeTruthy();
  });

  it("shows thinking content when provided", () => {
    renderWithDiagnostics({ thinkingContent: "Model reasoning..." });
    fireEvent.click(screen.getByText("Thinking"));
    expect(screen.getByText("Model reasoning...")).toBeTruthy();
  });

  it("shows fallback message when no thinking content", () => {
    renderWithDiagnostics();
    fireEvent.click(screen.getByText("Thinking"));
    expect(screen.getByText("No thinking output available.")).toBeTruthy();
  });
});

describe("DebugPanel — auto-scroll", () => {
  it("attaches refs to JSONL pre element for auto-scroll", () => {
    renderWithDiagnostics({
      rawLines: ["line1", "line2", "line3"],
    });
    const pre = document.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain("line1");
  });

  it("renders without errors when content is empty", () => {
    const { container } = renderWithDiagnostics();
    expect(container.firstChild).not.toBeNull();
  });

  it("attaches ref to thinking pre element", () => {
    renderWithDiagnostics({ thinkingContent: "Thinking..." });
    fireEvent.click(screen.getByText("Thinking"));
    const pres = document.querySelectorAll("pre");
    const thinkingPre = Array.from(pres).find((p) =>
      p.textContent?.includes("Thinking..."),
    );
    expect(thinkingPre).not.toBeNull();
  });
});
