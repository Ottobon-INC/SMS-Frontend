import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "../../src/app/providers/AppProviders";
import { AppRouter } from "../../src/app/router/AppRouter";

describe("router shell", () => {
  it("renders the home placeholder", () => {
    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>
    );
    expect(screen.getByText("home")).toBeDefined();
  });
});
