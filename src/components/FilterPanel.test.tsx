import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FilterPanel } from "./FilterPanel";
import type { CoinMarket, DashboardFilters } from "../types/api";

const sampleCoins: CoinMarket[] = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    current_price: 50000,
    market_cap: 1000000,
    market_cap_rank: 1,
    total_volume: 500000,
    price_change_percentage_24h: 2.5,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    current_price: 3500,
    market_cap: 800000,
    market_cap_rank: 2,
    total_volume: 400000,
    price_change_percentage_24h: -1.1,
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    current_price: 150,
    market_cap: 250000,
    market_cap_rank: 3,
    total_volume: 150000,
    price_change_percentage_24h: 0.5,
  },
  {
    id: "cardano",
    symbol: "ada",
    name: "Cardano",
    image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    current_price: 0.5,
    market_cap: 60000,
    market_cap_rank: 4,
    total_volume: 30000,
    price_change_percentage_24h: 0.1,
  },
  {
    id: "polkadot",
    symbol: "dot",
    name: "Polkadot",
    image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
    current_price: 7.2,
    market_cap: 50000,
    market_cap_rank: 5,
    total_volume: 20000,
    price_change_percentage_24h: 0.9,
  },
  {
    id: "avalanche",
    symbol: "avax",
    name: "Avalanche",
    image: "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png",
    current_price: 30,
    market_cap: 40000,
    market_cap_rank: 6,
    total_volume: 15000,
    price_change_percentage_24h: -0.3,
  },
];

function FilterPanelWrapper() {
  const [filters, setFilters] = useState<DashboardFilters>({
    vsCurrency: "usd",
    timeRange: 30,
    selectedCoins: ["bitcoin", "ethereum", "solana"],
    primaryCoin: "bitcoin",
  });

  return (
    <div>
      <FilterPanel filters={filters} availableCoins={sampleCoins} onFiltersChange={(updater) => setFilters(updater)} />
      <output data-testid="selection">{filters.selectedCoins.join(",")}</output>
    </div>
  );
}

describe("FilterPanel", () => {
  it("allows toggling coin selections", async () => {
    const user = userEvent.setup();
    render(<FilterPanelWrapper />);

    const cardano = screen.getByLabelText(/Cardano/i) as HTMLInputElement;
    expect(cardano.checked).toBe(false);

    await user.click(cardano);
    expect(cardano.checked).toBe(true);

    await user.click(cardano);
    expect(cardano.checked).toBe(false);
  });

  it("limits selection to five coins", async () => {
    const user = userEvent.setup();
    render(<FilterPanelWrapper />);

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    const unchecked = checkboxes.filter((box) => !box.checked);

    await user.click(unchecked[0]);
    await user.click(unchecked[1]);
    const blockedCandidate = unchecked[2];
    await user.click(blockedCandidate);

    expect(blockedCandidate.checked).toBe(false);
    const outputs = screen.getAllByTestId("selection");
    const selectedValue = outputs[0].textContent ?? "";
    const selectedIds = selectedValue.split(",").filter(Boolean);
    expect(selectedIds.length).toBe(5);
  });
});
