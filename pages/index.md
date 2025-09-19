---
layout: page
title: Card Companion – Loyalty Points Maximizer
permalink: /
description: "Track cards, plan purchases, and turn loyalty points into real-world value."
---

## Welcome to Card Companion

Card Companion is your command center for getting outsized value from every reward point you collect. Add the cards in your wallet, map out upcoming purchases, and instantly see which combination delivers the most cash-equivalent value.

### Build your personalized optimization plan

- Keep a running inventory of loyalty currencies, annual fees, and bonus categories.
- Model upcoming expenses to surface the most valuable card and earning rate for each purchase.
- Translate point balances into cash value so you know exactly how close you are to your next redemption.

<div class="loyalty-app" id="loyalty-app">
  <div class="loyalty-app__toolbar">
    <button type="button" class="loyalty-reset" id="reset-app">Reset with sample data</button>
    <p class="loyalty-toolbar-note">Your cards and purchase plans stay on this device through local storage.</p>
  </div>
  <div class="loyalty-app__grid">
    <section class="loyalty-panel loyalty-panel--cards">
      <h2>Card wallet</h2>
      <p>Catalog the cards you use so the optimizer can weigh balances, earning rates, and transfer partners.</p>
      <form id="card-form" class="loyalty-form" autocomplete="off">
        <div class="form-field">
          <label for="card-name">Card name</label>
          <input type="text" id="card-name" placeholder="e.g., Sapphire Preferred" required>
        </div>
        <div class="form-field">
          <label for="card-program">Points currency</label>
          <input type="text" id="card-program" placeholder="Ultimate Rewards, Membership Rewards…">
        </div>
        <div class="form-field">
          <label for="card-balance">Current points balance</label>
          <input type="number" id="card-balance" min="0" step="1" value="0">
        </div>
        <div class="form-field">
          <label for="card-valuation">Estimated value per point (¢)</label>
          <input type="number" id="card-valuation" min="0" step="0.1" value="1.5">
        </div>
        <div class="form-field">
          <label for="card-base-rate">Base earn rate (points per $1)</label>
          <input type="number" id="card-base-rate" min="0" step="0.1" value="1">
        </div>
        <div class="form-field form-field--wide">
          <label for="card-bonus">Bonus categories<br><span class="form-hint">One per line as “Category:Multiplier”. Separate aliases with commas.</span></label>
          <textarea id="card-bonus" placeholder="Dining, Restaurants:3&#10;Travel:2"></textarea>
        </div>
        <div class="form-field form-field--wide">
          <label for="card-notes">Reminders</label>
          <input type="text" id="card-notes" placeholder="Annual fee, limited-time offers, etc.">
        </div>
        <button type="submit" class="loyalty-primary">Add card</button>
      </form>
      <div class="table-wrapper">
        <table class="loyalty-table" id="cards-table">
          <thead>
            <tr>
              <th scope="col">Card</th>
              <th scope="col">Balance</th>
              <th scope="col">Value</th>
              <th scope="col">Highlights</th>
              <th scope="col" class="loyalty-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr class="loyalty-empty-row">
              <td colspan="5" class="loyalty-empty">Add your first card to begin tracking.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="loyalty-panel loyalty-panel--purchases">
      <h2>Upcoming purchases</h2>
      <p>Plan a purchase, trip, or recurring bill to see which card produces the biggest return.</p>
      <form id="purchase-form" class="loyalty-form" autocomplete="off">
        <div class="form-field">
          <label for="purchase-category">Spending category</label>
          <input type="text" id="purchase-category" list="category-suggestions" placeholder="Groceries" required>
          <datalist id="category-suggestions"></datalist>
        </div>
        <div class="form-field">
          <label for="purchase-amount">Amount (USD)</label>
          <input type="number" id="purchase-amount" min="0" step="0.01" required>
        </div>
        <div class="form-field form-field--wide">
          <label for="purchase-notes">Notes</label>
          <input type="text" id="purchase-notes" placeholder="Add context like merchant or travel goal.">
        </div>
        <button type="submit" class="loyalty-primary">Add purchase</button>
      </form>
      <div class="table-wrapper">
        <table class="loyalty-table" id="purchases-table">
          <thead>
            <tr>
              <th scope="col">Purchase</th>
              <th scope="col">Best card</th>
              <th scope="col">Projected value</th>
              <th scope="col" class="loyalty-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr class="loyalty-empty-row">
              <td colspan="4" class="loyalty-empty">Add purchases to see optimized recommendations.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="loyalty-panel loyalty-panel--summary">
      <h2>Optimization summary</h2>
      <div class="loyalty-summary" id="summary-totals" role="status" aria-live="polite">
        <div class="summary-card">
          <strong>0 pts</strong>
          <span>Total tracked points</span>
        </div>
        <div class="summary-card">
          <strong>$0.00</strong>
          <span>Estimated cash value</span>
        </div>
        <div class="summary-card">
          <strong>$0.00</strong>
          <span>Value from planned spend</span>
        </div>
      </div>
      <div class="loyalty-insights">
        <h3>Actionable insights</h3>
        <ul id="insights-list">
          <li class="loyalty-empty">Start by adding a few cards and planned purchases.</li>
        </ul>
      </div>
      <div class="loyalty-breakdowns">
        <h3>Card-by-card comparisons</h3>
        <div id="purchase-details">
          <p class="loyalty-empty">Add purchases to generate a breakdown of how each card performs.</p>
        </div>
      </div>
    </section>
  </div>
</div>

### How to make the most of the app

1. **Set realistic point valuations.** Each point currency is worth a different amount depending on how you redeem it. Update the valuation field to reflect your personal redemption style (see the benchmarks section for guidance).
2. **Model real-life spending.** Add the large bills you already have on the calendar—taxes, travel, home projects, holiday gifts—so you know which card to reach for before you swipe.
3. **Track temporary bonuses.** Use the reminders field to note when quarterly multipliers or limited-time offers expire so you do not leave boosted earnings on the table.
4. **Revisit before big redemptions.** Update your balances after major redemptions to keep the conversion to cash value accurate.

### Sample workflow

- Add each rewards card once and reuse the reset button if you want to load the curated sample set again.
- Keep a rolling list of the next three months of purchases. Archive entries after you pay the bill to keep projections clean.
- Use the insights list as a punch list—if a category only earns 1×, consider shifting spend to a more rewarding card or exploring a new product that covers the gap.

<script src="{{ site.baseurl }}/assets/js/loyalty-app.js"></script>

