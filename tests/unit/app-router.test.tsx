import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "../../src/app/providers/AppProviders";
import { AppRouter } from "../../src/app/router/AppRouter";

describe("router shell", () => {
  it("renders the public portal selection page", async () => {
    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>
    );
    expect(await screen.findByText("Student Operations Hub")).toBeDefined();
    expect(screen.getByText("Institution Admin")).toBeDefined();
    expect(screen.getByText("Campus Principal")).toBeDefined();
    expect(screen.getByText("Office Staff")).toBeDefined();
    expect(screen.getByText("Parent Portal")).toBeDefined();
  });
});
