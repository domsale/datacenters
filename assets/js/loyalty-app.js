(function () {
  'use strict';

  const STORAGE_KEY = 'card-companion-state';
  const cards = [];
  const purchases = [];
  let cardIdCounter = 1;
  let purchaseIdCounter = 1;
  let storageAvailable = false;

  const defaultCards = [
    {
      name: 'Chase Sapphire Preferred®',
      program: 'Chase Ultimate Rewards',
      balance: 52000,
      valuation: 1.25,
      baseRate: 1,
      bonusCategories: [
        { names: ['Travel'], displayName: 'Travel', multiplier: 2 },
        { names: ['Dining', 'Restaurants'], displayName: 'Dining', multiplier: 3 }
      ],
      notes: 'Redeem through travel partners for outsized value.'
    },
    {
      name: 'American Express® Gold Card',
      program: 'Membership Rewards',
      balance: 64000,
      valuation: 1.8,
      baseRate: 1,
      bonusCategories: [
        { names: ['Dining', 'Restaurants'], displayName: 'Dining', multiplier: 4 },
        { names: ['Groceries', 'Supermarkets'], displayName: 'Groceries', multiplier: 4 },
        { names: ['Airfare', 'Flights'], displayName: 'Airfare', multiplier: 3 }
      ],
      notes: 'Don’t forget to enroll in the $10 dining credits each month.'
    },
    {
      name: 'Citi® Double Cash Card',
      program: 'Citi ThankYou (via Rewards+ pairing)',
      balance: 18000,
      valuation: 1,
      baseRate: 2,
      bonusCategories: [],
      notes: 'Great fallback card for uncategorized spend.'
    }
  ];

  const defaultPurchases = [
    {
      category: 'Groceries',
      amount: 125,
      notes: 'Weekly household run'
    },
    {
      category: 'Travel',
      amount: 600,
      notes: 'Summer flight to visit family'
    },
    {
      category: 'Home Improvement',
      amount: 850,
      notes: 'Paint and supplies for guest room refresh'
    }
  ];

  const defaultCategoryLabels = [
    'Airfare',
    'Dining',
    'Gas',
    'Groceries',
    'Online Shopping',
    'Streaming Services',
    'Travel'
  ];

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const pointFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  document.addEventListener('DOMContentLoaded', function () {
    const appRoot = document.getElementById('loyalty-app');
    if (!appRoot) {
      return;
    }

    const cardForm = document.getElementById('card-form');
    const cardNameInput = document.getElementById('card-name');
    const cardProgramInput = document.getElementById('card-program');
    const cardBalanceInput = document.getElementById('card-balance');
    const cardValuationInput = document.getElementById('card-valuation');
    const cardBaseRateInput = document.getElementById('card-base-rate');
    const cardBonusInput = document.getElementById('card-bonus');
    const cardNotesInput = document.getElementById('card-notes');

    const purchaseForm = document.getElementById('purchase-form');
    const purchaseCategoryInput = document.getElementById('purchase-category');
    const purchaseAmountInput = document.getElementById('purchase-amount');
    const purchaseNotesInput = document.getElementById('purchase-notes');

    const cardsTableBody = document.querySelector('#cards-table tbody');
    const purchasesTableBody = document.querySelector('#purchases-table tbody');
    const summaryTotals = document.getElementById('summary-totals');
    const insightsList = document.getElementById('insights-list');
    const purchaseDetails = document.getElementById('purchase-details');
    const resetButton = document.getElementById('reset-app');
    const categorySuggestions = document.getElementById('category-suggestions');
    const toolbarNote = document.querySelector('.loyalty-toolbar-note');

    storageAvailable = detectStorage();
    if (!storageAvailable && toolbarNote) {
      toolbarNote.textContent = 'Local storage is unavailable in this browser session. Data will reset when you refresh.';
    }

    const hasSavedState = loadState();
    if (!hasSavedState) {
      loadDefaults();
    }

    updateUI();
    saveState();

    cardForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const cardName = cardNameInput.value.trim();
      if (!cardName) {
        cardNameInput.focus();
        return;
      }

      addCard(
        {
          name: cardName,
          program: cardProgramInput.value.trim(),
          balance: cardBalanceInput.value,
          valuation: cardValuationInput.value,
          baseRate: cardBaseRateInput.value,
          bonusCategories: cardBonusInput.value,
          notes: cardNotesInput.value.trim()
        }
      );

      clearCardForm();
    });

    cardsTableBody.addEventListener('click', function (event) {
      const button = event.target.closest('[data-remove-card]');
      if (!button) {
        return;
      }
      const id = Number(button.getAttribute('data-remove-card'));
      removeCard(id);
    });

    purchaseForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const category = purchaseCategoryInput.value.trim();
      if (!category) {
        purchaseCategoryInput.focus();
        return;
      }
      const amountValue = purchaseAmountInput.value;
      if (!amountValue) {
        purchaseAmountInput.focus();
        return;
      }

      addPurchase(
        {
          category: category,
          amount: amountValue,
          notes: purchaseNotesInput.value.trim()
        }
      );

      clearPurchaseForm();
    });

    purchasesTableBody.addEventListener('click', function (event) {
      const button = event.target.closest('[data-remove-purchase]');
      if (!button) {
        return;
      }
      const id = Number(button.getAttribute('data-remove-purchase'));
      removePurchase(id);
    });

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        const shouldReset = window.confirm('Reset the workspace with curated sample data? This will replace your saved entries.');
        if (!shouldReset) {
          return;
        }
        resetState();
        updateUI();
        saveState();
      });
    }

    function clearCardForm() {
      cardForm.reset();
      cardBalanceInput.value = '0';
      cardValuationInput.value = '1.5';
      cardBaseRateInput.value = '1';
      cardBonusInput.value = '';
    }

    function clearPurchaseForm() {
      purchaseForm.reset();
      purchaseCategoryInput.value = '';
      purchaseAmountInput.value = '';
      purchaseNotesInput.value = '';
    }

    function updateUI() {
      updateCardsTable();
      updatePurchaseTable();
      updateSummary();
      updateInsights();
      updatePurchaseDetails();
      updateCategorySuggestions();
    }

    function updateCardsTable() {
      cardsTableBody.innerHTML = '';
      if (cards.length === 0) {
        cardsTableBody.appendChild(createEmptyRow(5, 'Add your first card to begin tracking.'));
        return;
      }

      cards
        .slice()
        .sort(function (a, b) {
          return a.name.localeCompare(b.name);
        })
        .forEach(function (card) {
          const row = document.createElement('tr');
          row.setAttribute('data-card-id', String(card.id));

          const cardCell = document.createElement('td');
          const title = document.createElement('div');
          title.className = 'loyalty-cell-title';
          title.textContent = card.name;
          cardCell.appendChild(title);

          if (card.program) {
            const program = document.createElement('div');
            program.className = 'loyalty-subtext';
            program.textContent = card.program;
            cardCell.appendChild(program);
          }

          if (card.notes) {
            const notes = document.createElement('div');
            notes.className = 'loyalty-tagline';
            notes.textContent = card.notes;
            cardCell.appendChild(notes);
          }

          const balanceCell = document.createElement('td');
          balanceCell.innerHTML = '<strong>' + formatPoints(card.balance, true) + '</strong>';

          const valueCell = document.createElement('td');
          const estimatedValue = card.balance * card.valuation / 100;
          valueCell.innerHTML = '<strong>' + formatCurrency(estimatedValue) + '</strong>' +
            '<div class="loyalty-subtext">@ ' + formatCents(card.valuation) + ' each</div>';

          const highlightsCell = document.createElement('td');
          const highlightParts = [];
          highlightParts.push('Base ' + formatRate(card.baseRate) + '×');
          if (card.bonusCategories.length > 0) {
            const bonusList = card.bonusCategories
              .slice(0, 3)
              .map(function (item) {
                return escapeHtml(item.displayName) + ' (' + formatRate(item.multiplier) + '×)';
              });
            highlightParts.push('Bonus: ' + bonusList.join(', '));
            if (card.bonusCategories.length > 3) {
              highlightParts.push('+' + (card.bonusCategories.length - 3) + ' more');
            }
          }
          highlightsCell.innerHTML = '<div class="loyalty-subtext">' + highlightParts.join('<br>') + '</div>';

          const actionCell = document.createElement('td');
          actionCell.className = 'loyalty-actions';
          const removeButton = document.createElement('button');
          removeButton.className = 'loyalty-remove';
          removeButton.setAttribute('type', 'button');
          removeButton.setAttribute('data-remove-card', String(card.id));
          removeButton.textContent = 'Remove';
          actionCell.appendChild(removeButton);

          row.appendChild(cardCell);
          row.appendChild(balanceCell);
          row.appendChild(valueCell);
          row.appendChild(highlightsCell);
          row.appendChild(actionCell);

          cardsTableBody.appendChild(row);
        });
    }

    function updatePurchaseTable() {
      purchasesTableBody.innerHTML = '';
      if (purchases.length === 0) {
        purchasesTableBody.appendChild(createEmptyRow(4, 'Add purchases to see optimized recommendations.'));
        return;
      }

      purchases.forEach(function (purchase) {
        const evaluation = evaluatePurchase(purchase);
        const row = document.createElement('tr');
        row.setAttribute('data-purchase-id', String(purchase.id));

        const purchaseCell = document.createElement('td');
        const title = document.createElement('div');
        title.className = 'loyalty-cell-title';
        const purchaseLabel = purchase.category ? purchase.category : 'General spend';
        title.textContent = purchaseLabel;
        purchaseCell.appendChild(title);

        const amountLine = document.createElement('div');
        amountLine.className = 'loyalty-subtext';
        amountLine.textContent = formatCurrency(purchase.amount);
        purchaseCell.appendChild(amountLine);

        if (purchase.notes) {
          const notes = document.createElement('div');
          notes.className = 'loyalty-tagline';
          notes.textContent = purchase.notes;
          purchaseCell.appendChild(notes);
        }

        const bestCardCell = document.createElement('td');
        const projectedValueCell = document.createElement('td');

        if (!evaluation || !evaluation.best) {
          bestCardCell.innerHTML = '<span class="loyalty-subtext">Add or update cards to see recommendations.</span>';
          projectedValueCell.textContent = '—';
        } else {
          const badge = document.createElement('div');
          badge.className = 'loyalty-badge';
          badge.textContent = evaluation.best.card.name;
          bestCardCell.appendChild(badge);

          const subtext = document.createElement('div');
          subtext.className = 'loyalty-subtext';
          subtext.textContent = formatRate(evaluation.best.multiplier) + '× • ' + evaluation.best.source;
          bestCardCell.appendChild(subtext);

          projectedValueCell.innerHTML = '<strong>' + formatCurrency(evaluation.best.value) + '</strong>' +
            '<div class="loyalty-subtext">' + formatPoints(evaluation.best.points, true) + '</div>';
        }

        const actionCell = document.createElement('td');
        actionCell.className = 'loyalty-actions';
        const removeButton = document.createElement('button');
        removeButton.className = 'loyalty-remove';
        removeButton.setAttribute('type', 'button');
        removeButton.setAttribute('data-remove-purchase', String(purchase.id));
        removeButton.textContent = 'Remove';
        actionCell.appendChild(removeButton);

        row.appendChild(purchaseCell);
        row.appendChild(bestCardCell);
        row.appendChild(projectedValueCell);
        row.appendChild(actionCell);

        purchasesTableBody.appendChild(row);
      });
    }

    function updateSummary() {
      const totalPoints = cards.reduce(function (total, card) {
        return total + card.balance;
      }, 0);

      const totalValue = cards.reduce(function (total, card) {
        return total + (card.balance * card.valuation / 100);
      }, 0);

      let plannedValue = 0;
      purchases.forEach(function (purchase) {
        const evaluation = evaluatePurchase(purchase);
        if (evaluation && evaluation.best) {
          plannedValue += evaluation.best.value;
        }
      });

      summaryTotals.innerHTML = '' +
        '<div class="summary-card">' +
        '  <strong>' + formatPoints(totalPoints, true) + '</strong>' +
        '  <span>Total tracked points</span>' +
        '</div>' +
        '<div class="summary-card">' +
        '  <strong>' + formatCurrency(totalValue) + '</strong>' +
        '  <span>Estimated cash value</span>' +
        '</div>' +
        '<div class="summary-card">' +
        '  <strong>' + formatCurrency(plannedValue) + '</strong>' +
        '  <span>Value from planned spend</span>' +
        '</div>';
    }

    function updateInsights() {
      insightsList.innerHTML = '';

      if (cards.length === 0) {
        insightsList.appendChild(createListItem('Add the cards in your wallet to unlock personalized suggestions.'));
        return;
      }

      if (purchases.length === 0) {
        insightsList.appendChild(createListItem('Queue up purchases you expect to make so the optimizer can go to work.'));
        return;
      }

      const categorySummaries = [];
      const baseRateCategories = [];
      const cardsUsed = new Set();

      purchases.forEach(function (purchase) {
        const evaluation = evaluatePurchase(purchase);
        if (!evaluation || !evaluation.best) {
          return;
        }

        const best = evaluation.best;
        cardsUsed.add(best.card.id);
        const normalizedCategory = (purchase.category || 'General spend').trim().toLowerCase();
        let summary = categorySummaries.find(function (item) {
          return item.key === normalizedCategory;
        });

        const valuePerDollar = purchase.amount > 0 ? (best.value / purchase.amount) : 0;

        if (!summary) {
          summary = {
            key: normalizedCategory,
            label: purchase.category || 'General spend',
            card: best.card,
            multiplier: best.multiplier,
            source: best.source,
            amount: 0,
            points: 0,
            value: 0,
            valuePerDollar: valuePerDollar
          };
          categorySummaries.push(summary);
        }

        summary.amount += purchase.amount;
        summary.points += best.points;
        summary.value += best.value;

        if (valuePerDollar > summary.valuePerDollar) {
          summary.card = best.card;
          summary.multiplier = best.multiplier;
          summary.source = best.source;
          summary.valuePerDollar = valuePerDollar;
        }

        if (Math.abs(best.multiplier - best.card.baseRate) < 0.01 || best.multiplier <= best.card.baseRate) {
          baseRateCategories.push(summary.label);
        }
      });

      categorySummaries.sort(function (a, b) {
        return b.value - a.value;
      });

      categorySummaries.forEach(function (summary) {
        const message = '<strong>' + escapeHtml(summary.label) + '</strong>: Use <strong>' + escapeHtml(summary.card.name) + '</strong> for ' +
          formatRate(summary.multiplier) + '× (' + escapeHtml(summary.source) + ') to earn ' + formatPoints(summary.points, true) +
          ' worth about ' + formatCurrency(summary.value) + '.';
        insightsList.appendChild(createListItemHTML(message));
      });

      const underutilizedCards = cards.filter(function (card) {
        return !cardsUsed.has(card.id) && card.balance > 0;
      });

      if (underutilizedCards.length > 0) {
        const names = underutilizedCards.map(function (card) {
          return escapeHtml(card.name);
        }).join(', ');
        insightsList.appendChild(createListItemHTML('Consider planning a redemption or bonus category for <strong>' + names + '</strong>—those points are idle.'));
      }

      const uniqueBaseRateCategories = Array.from(new Set(baseRateCategories));
      if (uniqueBaseRateCategories.length > 0) {
        insightsList.appendChild(
          createListItemHTML(
            'You are only earning the base rate on <strong>' +
            escapeHtml(uniqueBaseRateCategories.join(', ')) +
            '</strong>. Explore limited-time offers or new cards that reward those purchases.'
          )
        );
      }
    }

    function updatePurchaseDetails() {
      purchaseDetails.innerHTML = '';

      if (purchases.length === 0) {
        purchaseDetails.innerHTML = '<p class="loyalty-empty">Add purchases to generate a breakdown of how each card performs.</p>';
        return;
      }

      purchases.forEach(function (purchase) {
        const evaluation = evaluatePurchase(purchase);
        if (!evaluation || evaluation.results.length === 0) {
          return;
        }

        const details = document.createElement('details');
        details.className = 'loyalty-breakdown';

        const summary = document.createElement('summary');
        summary.innerHTML = '<span>' + escapeHtml(purchase.category || 'General spend') + '</span>' +
          '<span>' + formatCurrency(purchase.amount) + '</span>';
        details.appendChild(summary);

        const list = document.createElement('ul');
        list.className = 'loyalty-breakdown__list';

        evaluation.results.slice(0, 3).forEach(function (result) {
          const item = document.createElement('li');
          item.innerHTML = '<strong>' + escapeHtml(result.card.name) + '</strong>: ' +
            formatRate(result.multiplier) + '× (' + escapeHtml(result.source) + ') → ' +
            formatPoints(result.points, true) + ' ≈ ' + formatCurrency(result.value);
          list.appendChild(item);
        });

        details.appendChild(list);
        purchaseDetails.appendChild(details);
      });

      if (!purchaseDetails.innerHTML) {
        purchaseDetails.innerHTML = '<p class="loyalty-empty">Add purchases to generate a breakdown of how each card performs.</p>';
      }
    }

    function updateCategorySuggestions() {
      if (!categorySuggestions) {
        return;
      }

      const categories = new Map();
      defaultCategoryLabels.forEach(function (label) {
        const key = label.toLowerCase();
        if (!categories.has(key)) {
          categories.set(key, label);
        }
      });

      cards.forEach(function (card) {
        card.bonusCategories.forEach(function (bonus) {
          bonus.names.forEach(function (name) {
            const key = name.toLowerCase();
            if (!categories.has(key)) {
              categories.set(key, capitalize(name));
            }
          });
        });
      });

      purchases.forEach(function (purchase) {
        if (!purchase.category) {
          return;
        }
        const key = purchase.category.toLowerCase();
        if (!categories.has(key)) {
          categories.set(key, capitalize(purchase.category));
        }
      });

      const options = Array.from(categories.values()).sort(function (a, b) {
        return a.localeCompare(b);
      });

      categorySuggestions.innerHTML = options.map(function (option) {
        return '<option value="' + escapeHtml(option) + '"></option>';
      }).join('');
    }

    function addCard(cardData, options) {
      const card = normalizeCard(cardData);
      cards.push(card);
      if (!options || !options.silent) {
        updateUI();
        saveState();
      }
      return card;
    }

    function removeCard(id) {
      const index = cards.findIndex(function (card) {
        return card.id === id;
      });
      if (index === -1) {
        return;
      }
      cards.splice(index, 1);
      updateUI();
      saveState();
    }

    function addPurchase(purchaseData, options) {
      const purchase = normalizePurchase(purchaseData);
      purchases.push(purchase);
      if (!options || !options.silent) {
        updateUI();
        saveState();
      }
      return purchase;
    }

    function removePurchase(id) {
      const index = purchases.findIndex(function (purchase) {
        return purchase.id === id;
      });
      if (index === -1) {
        return;
      }
      purchases.splice(index, 1);
      updateUI();
      saveState();
    }

    function resetState() {
      cards.length = 0;
      purchases.length = 0;
      cardIdCounter = 1;
      purchaseIdCounter = 1;

      defaultCards.forEach(function (card) {
        addCard(card, { silent: true });
      });

      defaultPurchases.forEach(function (purchase) {
        addPurchase(purchase, { silent: true });
      });
    }

    function loadDefaults() {
      cards.length = 0;
      purchases.length = 0;
      cardIdCounter = 1;
      purchaseIdCounter = 1;

      defaultCards.forEach(function (card) {
        addCard(card, { silent: true });
      });

      defaultPurchases.forEach(function (purchase) {
        addPurchase(purchase, { silent: true });
      });
    }

    function loadState() {
      if (!storageAvailable) {
        return false;
      }

      let parsed;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return false;
        }
        parsed = JSON.parse(raw);
      } catch (error) {
        console.warn('Card Companion: unable to load saved data.', error);
        return false;
      }

      cards.length = 0;
      purchases.length = 0;
      cardIdCounter = 1;
      purchaseIdCounter = 1;

      if (parsed && Array.isArray(parsed.cards)) {
        parsed.cards.forEach(function (card) {
          addCard(card, { silent: true });
        });
      }

      if (parsed && Array.isArray(parsed.purchases)) {
        parsed.purchases.forEach(function (purchase) {
          addPurchase(purchase, { silent: true });
        });
      }

      return cards.length > 0 || purchases.length > 0;
    }

    function saveState() {
      if (!storageAvailable) {
        return;
      }

      const payload = {
        cards: cards,
        purchases: purchases
      };

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.warn('Card Companion: unable to save data.', error);
      }
    }

    function evaluatePurchase(purchase) {
      if (cards.length === 0) {
        return null;
      }

      const results = cards.map(function (card) {
        const multiplierData = getMultiplier(card, purchase.category);
        const multiplier = multiplierData.multiplier;
        const source = multiplierData.source;
        const points = purchase.amount * multiplier;
        const value = points * card.valuation / 100;
        return {
          card: card,
          multiplier: multiplier,
          source: source,
          points: points,
          value: value
        };
      }).sort(function (a, b) {
        if (b.value === a.value) {
          return b.multiplier - a.multiplier;
        }
        return b.value - a.value;
      });

      return {
        best: results[0],
        results: results
      };
    }

    function getMultiplier(card, category) {
      if (!category) {
        return {
          multiplier: card.baseRate,
          source: 'Base rate'
        };
      }

      const normalizedCategory = category.trim().toLowerCase();

      for (let i = 0; i < card.bonusCategories.length; i += 1) {
        const bonus = card.bonusCategories[i];
        for (let j = 0; j < bonus.names.length; j += 1) {
          const normalizedName = bonus.names[j].trim().toLowerCase();
          if (!normalizedName) {
            continue;
          }
          if (normalizedCategory === normalizedName) {
            return {
              multiplier: bonus.multiplier,
              source: bonus.displayName + ' bonus'
            };
          }
          if (normalizedName.length >= 3 && normalizedCategory.indexOf(normalizedName) !== -1) {
            return {
              multiplier: bonus.multiplier,
              source: bonus.displayName + ' bonus'
            };
          }
        }
      }

      return {
        multiplier: card.baseRate,
        source: 'Base rate'
      };
    }

    function normalizeCard(cardData) {
      const id = assignCardId(cardData.id);
      const bonusCategories = normalizeBonusCategories(cardData.bonusCategories);
      const balance = sanitizeNumber(cardData.balance, 0);
      const valuation = sanitizeNumber(cardData.valuation, 1.5);
      const baseRate = sanitizeNumber(cardData.baseRate, 1);

      return {
        id: id,
        name: (cardData.name || 'Unnamed card').trim(),
        program: (cardData.program || '').trim(),
        balance: balance,
        valuation: valuation,
        baseRate: baseRate,
        bonusCategories: bonusCategories,
        notes: (cardData.notes || '').trim()
      };
    }

    function normalizePurchase(purchaseData) {
      const id = assignPurchaseId(purchaseData.id);
      const amount = sanitizeNumber(purchaseData.amount, 0);
      return {
        id: id,
        category: (purchaseData.category || '').trim(),
        amount: amount,
        notes: (purchaseData.notes || '').trim()
      };
    }

    function normalizeBonusCategories(raw) {
      if (!raw) {
        return [];
      }

      if (typeof raw === 'string') {
        return parseBonusCategories(raw);
      }

      if (Array.isArray(raw)) {
        return raw
          .map(function (item) {
            return normalizeBonusCategory(item);
          })
          .filter(Boolean);
      }

      if (typeof raw === 'object') {
        const normalized = normalizeBonusCategory(raw);
        return normalized ? [normalized] : [];
      }

      return [];
    }

    function normalizeBonusCategory(category) {
      if (!category) {
        return null;
      }

      const multiplier = sanitizeNumber(category.multiplier, 0);
      if (multiplier <= 0) {
        return null;
      }

      const names = [];
      if (Array.isArray(category.names)) {
        category.names.forEach(function (name) {
          if (typeof name === 'string' && name.trim()) {
            names.push(name.trim());
          }
        });
      }

      if (typeof category.displayName === 'string' && category.displayName.trim()) {
        if (!names.length) {
          names.push(category.displayName.trim());
        }
      }

      if (typeof category.category === 'string' && category.category.trim()) {
        if (!names.length) {
          names.push(category.category.trim());
        }
      }

      if (!names.length) {
        return null;
      }

      return {
        names: names,
        displayName: category.displayName ? category.displayName : names[0],
        multiplier: multiplier
      };
    }

    function parseBonusCategories(raw) {
      const categories = [];
      raw.split(/\n+/).forEach(function (line) {
        const trimmed = line.trim();
        if (!trimmed) {
          return;
        }
        const separatorIndex = trimmed.indexOf(':');
        if (separatorIndex === -1) {
          return;
        }
        const namesSection = trimmed.slice(0, separatorIndex);
        const multiplierSection = trimmed.slice(separatorIndex + 1);
        const multiplier = sanitizeNumber(multiplierSection, 0);
        if (multiplier <= 0) {
          return;
        }
        const names = namesSection.split(/[,/]/).map(function (name) {
          return name.trim();
        }).filter(Boolean);
        if (!names.length) {
          return;
        }
        categories.push({
          names: names,
          displayName: names[0],
          multiplier: multiplier
        });
      });
      return categories;
    }

    function sanitizeNumber(value, fallback) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric < 0) {
        return typeof fallback === 'number' ? fallback : 0;
      }
      return numeric;
    }

    function assignCardId(proposedId) {
      if (typeof proposedId === 'number' && proposedId >= 0) {
        cardIdCounter = Math.max(cardIdCounter, proposedId + 1);
        return proposedId;
      }
      const id = cardIdCounter;
      cardIdCounter += 1;
      return id;
    }

    function assignPurchaseId(proposedId) {
      if (typeof proposedId === 'number' && proposedId >= 0) {
        purchaseIdCounter = Math.max(purchaseIdCounter, proposedId + 1);
        return proposedId;
      }
      const id = purchaseIdCounter;
      purchaseIdCounter += 1;
      return id;
    }

    function createEmptyRow(colspan, text) {
      const row = document.createElement('tr');
      row.className = 'loyalty-empty-row';
      const cell = document.createElement('td');
      cell.className = 'loyalty-empty';
      cell.colSpan = colspan;
      cell.textContent = text;
      row.appendChild(cell);
      return row;
    }

    function createListItem(text) {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }

    function createListItemHTML(html) {
      const item = document.createElement('li');
      item.innerHTML = html;
      return item;
    }

    function formatCurrency(value) {
      return currencyFormatter.format(value || 0);
    }

    function formatPoints(value, includeSuffix) {
      const formatted = pointFormatter.format(Math.round(value || 0));
      return includeSuffix ? formatted + ' pts' : formatted;
    }

    function formatCents(value) {
      const numeric = Number(value) || 0;
      if (numeric === 0) {
        return '0¢';
      }
      return numeric.toFixed(2).replace(/\.00$/, '') + '¢';
    }

    function formatRate(value) {
      const numeric = Number(value) || 0;
      if (Math.abs(numeric - Math.round(numeric)) < 0.01) {
        return String(Math.round(numeric));
      }
      return numeric.toFixed(2).replace(/0$/, '').replace(/\.0$/, '');
    }

    function capitalize(text) {
      if (!text) {
        return '';
      }
      return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function escapeHtml(text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function detectStorage() {
      try {
        const testKey = '__card_companion_test__';
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        return true;
      } catch (error) {
        return false;
      }
    }
  });
})();
