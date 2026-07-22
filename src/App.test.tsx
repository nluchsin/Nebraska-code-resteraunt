import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
});

afterEach(() => cleanup());

describe("Nebraska Table menu", () => {
  it("renders every food item on the menu", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Burger" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Veggie Sammy" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^View / })).toHaveLength(21);
  });

  it("applies multiple tag filters from the URL", () => {
    window.history.replaceState({}, "", "/?tag=Drink,Alcoholic");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Mojito" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Old Fashioned" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Burger" })).not.toBeInTheDocument();
  });

  it("matches comma-delimited search terms and keeps URL state", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole("textbox", { name: "Search menu" }), "pasta,spicy");

    expect(window.location.search).toBe("?q=pasta%2Cspicy");
    expect(screen.getByRole("heading", { name: "Cajun Pasta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chicken Slammer" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Burger" })).not.toBeInTheDocument();
  });

  it("adds a dish to the order", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Add Burger/ }));
    await user.click(screen.getByRole("button", { name: "Open order" }));

    expect(screen.getAllByRole("heading", { name: "Burger" })).toHaveLength(2);
    expect(screen.getAllByText("$8.99").length).toBeGreaterThan(0);
  });

  it("removes one item when the active card button is clicked again", async () => {
    const user = userEvent.setup();
    render(<App />);

    const burgerButton = screen.getByRole("button", { name: /Add Burger/ });
    await user.click(burgerButton);
    await user.click(screen.getByRole("button", { name: /Remove one Burger/ }));
    await user.click(screen.getByRole("button", { name: "Open order" }));

    expect(screen.getByText("Your bag is empty.")).toBeInTheDocument();
  });

  it("opens an item detail view from a menu card", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "View Burger" }));

    expect(screen.getByRole("button", { name: "Close item" })).toBeInTheDocument();
    expect(screen.getAllByText(/tangy cheddar cheese sauce/).length).toBeGreaterThan(1);
    expect(screen.getAllByRole("button", { name: "Add Burger" })).toHaveLength(2);
  });
});
