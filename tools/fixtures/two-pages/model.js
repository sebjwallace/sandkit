// The lemonade stand: fewer cups sell as the price rises.
function createModel(costs) {
  const costPerCup = costs.lemons + costs.sugar + costs.cup;
  const cupsSold = (price) => Math.max(0, Math.round(120 - price * 1.2));

  function day(price) {
    const cups = cupsSold(price);
    const revenue = cups * price;
    const cost = cups * costPerCup;
    return { price, cups, revenue, cost, profit: revenue - cost };
  }

  return { costPerCup, day };
}
