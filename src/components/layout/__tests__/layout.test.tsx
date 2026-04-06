// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(cleanup);
import {
  Stack,
  Box,
  Center,
  Cluster,
  Sidebar,
  Switcher,
  Cover,
  Grid,
  Frame,
  Reel,
} from "../index";

describe("Stack", () => {
  it("renders with .stack class and --space custom property", () => {
    render(
      <Stack space="var(--space-m)" data-testid="stack">
        <div>A</div>
        <div>B</div>
      </Stack>
    );
    const el = screen.getByTestId("stack");
    expect(el.className).toContain("stack");
    expect(el.style.getPropertyValue("--space")).toBe("var(--space-m)");
  });

  it("applies recursive CSS variant", () => {
    render(
      <Stack recursive data-testid="stack">
        <div>A</div>
      </Stack>
    );
    const el = screen.getByTestId("stack");
    expect(el.className).toContain("stack-recursive");
  });

  it("renders splitAfter wrapper", () => {
    render(
      <Stack splitAfter={1} data-testid="stack">
        <div>First</div>
        <div>Second</div>
      </Stack>
    );
    const el = screen.getByTestId("stack");
    const splitDiv = el.querySelector(".stack-split");
    expect(splitDiv).not.toBeNull();
  });
});

describe("Box", () => {
  it("renders with .box class and --padding", () => {
    render(
      <Box padding="var(--space-l)" data-testid="box">
        Content
      </Box>
    );
    const el = screen.getByTestId("box");
    expect(el.className).toContain("box");
    expect(el.style.getPropertyValue("--padding")).toBe("var(--space-l)");
  });
});

describe("Center", () => {
  it("renders with .center class and --max-width", () => {
    render(
      <Center maxWidth="40ch" data-testid="center">
        Content
      </Center>
    );
    const el = screen.getByTestId("center");
    expect(el.className).toContain("center");
    expect(el.style.getPropertyValue("--max-width")).toBe("40ch");
  });

  it("applies centerText and intrinsic modifiers", () => {
    render(
      <Center centerText intrinsic data-testid="center">
        Content
      </Center>
    );
    const el = screen.getByTestId("center");
    expect(el.className).toContain("center-text");
    expect(el.className).toContain("center-intrinsic");
  });
});

describe("Cluster", () => {
  it("renders with .cluster class and spacing", () => {
    render(
      <Cluster space="var(--space-xs)" data-testid="cluster">
        <span>A</span>
        <span>B</span>
      </Cluster>
    );
    const el = screen.getByTestId("cluster");
    expect(el.className).toContain("cluster");
    expect(el.style.getPropertyValue("--space")).toBe("var(--space-xs)");
  });
});

describe("Sidebar", () => {
  it("renders with .sidebar class and flex properties", () => {
    render(
      <Sidebar data-testid="sidebar">
        <nav>Nav</nav>
        <main>Main</main>
      </Sidebar>
    );
    const el = screen.getByTestId("sidebar");
    expect(el.className).toContain("sidebar");
    expect(el.style.getPropertyValue("--side-width")).toBe("20rem");
    expect(el.style.getPropertyValue("--content-min")).toBe("50%");
  });

  it("applies sidebar-right class when side='right'", () => {
    render(
      <Sidebar side="right" data-testid="sidebar">
        <main>Main</main>
        <nav>Nav</nav>
      </Sidebar>
    );
    const el = screen.getByTestId("sidebar");
    expect(el.className).toContain("sidebar-right");
  });
});

describe("Switcher", () => {
  it("renders with .switcher class and dynamic nth-child CSS", () => {
    render(
      <Switcher limit={3} data-testid="switcher">
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </Switcher>
    );
    const el = screen.getByTestId("switcher");
    expect(el.className).toContain("switcher");
    // Check that a <style> tag was rendered with nth-child rule
    const styleEl = document.querySelector("style");
    expect(styleEl?.textContent).toContain("nth-last-child");
    expect(styleEl?.textContent).toContain("4"); // limit + 1
  });
});

describe("Cover", () => {
  it("renders with .cover class and min-height", () => {
    render(
      <Cover minHeight="50vh" data-testid="cover">
        <div>Centered</div>
        <footer>Footer</footer>
      </Cover>
    );
    const el = screen.getByTestId("cover");
    expect(el.className).toContain("cover");
    expect(el.style.getPropertyValue("--min-height")).toBe("50vh");
  });

  it("wraps first child with .cover-centered by default", () => {
    render(
      <Cover data-testid="cover">
        <div>Centered</div>
        <footer>Footer</footer>
      </Cover>
    );
    const el = screen.getByTestId("cover");
    const centeredDiv = el.querySelector(".cover-centered");
    expect(centeredDiv).not.toBeNull();
    expect(centeredDiv?.textContent).toBe("Centered");
  });
});

describe("Grid", () => {
  it("renders with .grid class and --grid-min", () => {
    render(
      <Grid min="200px" data-testid="grid">
        <div>A</div>
        <div>B</div>
      </Grid>
    );
    const el = screen.getByTestId("grid");
    expect(el.className).toContain("grid");
    expect(el.style.getPropertyValue("--grid-min")).toBe("200px");
  });
});

describe("Frame", () => {
  it("renders with .frame class and --ratio", () => {
    render(
      <Frame ratio="4 / 3" data-testid="frame">
        <img src="test.jpg" alt="test" />
      </Frame>
    );
    const el = screen.getByTestId("frame");
    expect(el.className).toContain("frame");
    expect(el.style.getPropertyValue("--ratio")).toBe("4 / 3");
  });
});

describe("Reel", () => {
  it("renders with .reel class and spacing", () => {
    render(
      <Reel itemWidth="20ch" space="var(--space-m)" data-testid="reel">
        <div>A</div>
        <div>B</div>
      </Reel>
    );
    const el = screen.getByTestId("reel");
    expect(el.className).toContain("reel");
    expect(el.style.getPropertyValue("--item-width")).toBe("20ch");
  });

  it("applies noBar class", () => {
    render(
      <Reel noBar data-testid="reel">
        <div>A</div>
      </Reel>
    );
    const el = screen.getByTestId("reel");
    expect(el.className).toContain("reel-no-bar");
  });
});

describe("All primitives render with defaults", () => {
  const components = [
    { name: "Stack", Component: Stack },
    { name: "Box", Component: Box },
    { name: "Center", Component: Center },
    { name: "Cluster", Component: Cluster },
    { name: "Sidebar", Component: Sidebar },
    { name: "Switcher", Component: Switcher },
    { name: "Cover", Component: Cover },
    { name: "Grid", Component: Grid },
    { name: "Frame", Component: Frame },
    { name: "Reel", Component: Reel },
  ];

  for (const { name, Component } of components) {
    it(`${name} renders without errors`, () => {
      const { container } = render(
        <Component>
          <div>Child</div>
        </Component>
      );
      expect(container.firstChild).not.toBeNull();
    });
  }
});

describe("Composition", () => {
  it("Stack inside Sidebar renders without layout conflicts", () => {
    render(
      <Sidebar data-testid="sidebar">
        <Stack space="var(--space-s)" data-testid="nav-stack">
          <div>Nav Item 1</div>
          <div>Nav Item 2</div>
        </Stack>
        <Stack space="var(--space-m)" data-testid="main-stack">
          <div>Content 1</div>
          <div>Content 2</div>
        </Stack>
      </Sidebar>
    );

    const sidebar = screen.getByTestId("sidebar");
    const navStack = screen.getByTestId("nav-stack");
    const mainStack = screen.getByTestId("main-stack");

    expect(sidebar.className).toContain("sidebar");
    expect(navStack.className).toContain("stack");
    expect(mainStack.className).toContain("stack");
    // Both Stack and Sidebar render without errors when composed
  });
});
