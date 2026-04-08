import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { DebugPanel } from "../DebugPanel";
import { DiagnosticsProvider, useDiagnosticsDispatch } from "@/chat/diagnostics-context";
import type { DiagnosticsState } from "@/chat/diagnostics-context";
import { useEffect } from "react";

afterEach(cleanup);

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
    fireEvent.click(screen.getByText("Errors"));
    rerender(
      <DiagnosticsProvider>
        <DebugPanel />
      </DiagnosticsProvider>,
    );
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

describe("DebugPanel — tabs", () => {
  it("does not show a Thinking tab", () => {
    renderWithDiagnostics();
    expect(screen.queryByText("Thinking")).toBeNull();
  });

  it("shows Errors tab", () => {
    renderWithDiagnostics();
    expect(screen.getByText("Errors")).toBeTruthy();
  });

  it("shows System Prompt tab", () => {
    renderWithDiagnostics();
    expect(screen.getByText("System Prompt")).toBeTruthy();
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
});
