import { APP_STATE, calculateTotalSpent, getTopCategory, checkBudgetStatus, getPastWeekTrend } from './state.js';
import { validateField } from './validators.js';
import { compileRegex, highlightMatches } from './search.js';
import { saveToStorage, loadFromStorage, validateImportedJson, triggerJsonExport } from './storage.js';

let activeEditId = null;
let currentSortKey = 'date';

document.addEventListener('DOMContentLoaded', () => {
    initAppState();
    setupEventListeners();
    renderAll();
});

function initAppState() {
    APP_STATE.records = loadFromStorage('app:records', []);
    APP_STATE.budgetCap = loadFromStorage('app:budget_cap', 0);
    APP_STATE.activeCurrency = loadFromStorage('app:active_currency', 'RWF');

    const savedRates = loadFromStorage('app:rates', null);
    if (savedRates) APP_STATE.rates = savedRates;

    document.getElementById('txt-budget-cap').value = APP_STATE.budgetCap || '';
    document.getElementById('select-currency').value = APP_STATE.activeCurrency;
    document.getElementById('rate-rwf-kes').value = APP_STATE.rates.KES;
    document.getElementById('rate-rwf-ugx').value = APP_STATE.rates.UGX;
}

function setupEventListeners() {
    document.getElementById('expense-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('btn-cancel').addEventListener('click', clearForm);

    document.getElementById('txt-search').addEventListener('input', renderLedger);
    document.getElementById('chk-case-insensitive').addEventListener('change', renderLedger);

    document.getElementById('sort-date').addEventListener('click', () => { currentSortKey = 'date'; renderLedger(); });
    document.getElementById('sort-desc').addEventListener('click', () => { currentSortKey = 'description'; renderLedger(); });
    document.getElementById('sort-amount').addEventListener('click', () => { currentSortKey = 'amount'; renderLedger(); });

    document.getElementById('txt-budget-cap').addEventListener('input', (e) => {
        APP_STATE.budgetCap = parseFloat(e.target.value) || 0; saveToStorage('app:budget_cap', APP_STATE.budgetCap);
        renderDashboard();
    });

    document.getElementById('select-currency').addEventListener('change', (e) => {
        APP_STATE.activeCurrency = e.target.value; saveToStorage('app:active_currency', APP_STATE.activeCurrency);
        renderDashboard();
        renderLedger();
    });

    const updateRates = () => {
        APP_STATE.rates.KES = parseFloat(document.getElementById('rate-rwf-kes').value) || 0.11;
        APP_STATE.rates.UGX = parseFloat(document.getElementById('rate-rwf-ugx').value) || 2.85;
        saveToStorage('app:rates', APP_STATE.rates);
        renderDashboard();
        renderLedger();
    };
    document.getElementById('rate-rwf-kes').addEventListener('input', updateRates);
    document.getElementById('rate-rwf-ugx').addEventListener('input', updateRates);

    document.getElementById('btn-export-json').addEventListener('click', () => {
        triggerJsonExport(APP_STATE.records, APP_STATE.budgetCap, APP_STATE.rates);
    });

    const fileInput = document.getElementById('file-import-json');
    fileInput.addEventListener('change', handleJsonImport);

    const importLabel = document.getElementById('lbl-import-json');
    if (importLabel) {
        importLabel.addEventListener('keydown', (e) => {
            if(e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });
    }
}

function handleFormSubmit(e) {
    e.preventDefault();

    const descInput = document.getElementById('expense-desc');
    const amountInput = document.getElementById('expense-amount');
    const catSelect = document.getElementById('expense-category');
    const dateInput = document.getElementById('expense-date');

    const descValid = showFieldError('expense-desc', descInput.value);
    const amountValid = showFieldError('expense-amount', amountInput.value);
    const catValid = showFieldError('expense-category', catSelect.value);
    const dateValid = showFieldError('expense-date', dateInput.value);

    if (!descValid || !amountValid || !catValid || !dateValid) return;

    if(activeEditId) {
        const record = APP_STATE.records.find(r => r.id === activeEditId);
        if (record) {
            record.description = descInput.value.trim();
            record.amount = parseFloat(amountInput.value);
            record.category = catSelect.value;
            record.date = dateInput.value;
            record.updatedAt = new Date().toISOString();
        }
        activeEditId = null;
        document.getElementById('add-expense-heading').textContent = 'Add New Expense';
    } else {
        const newRecord = {
            id: 'rec_' + Date.now(),
            description: descInput.value.trim(),
            amount: parseFloat(amountInput.value),
            category: catSelect.value,
            date: dateInput.value,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        APP_STATE.records.push(newRecord);
    }

    saveToStorage('app:records', APP_STATE.records);
    clearForm();
    renderAll();
}

function showFieldError(fieldId, value) {
    const shortName = fieldId.replace('expense-', '');
    const result = validateField(shortName, value);
    const errorEl = document.getElementById(`${fieldId}-error`);

    if (!result.isValid) {
        errorEl.textContent = result.errorMsg;
        return false;
    } else {
        errorEl.textContent = '';
        return true;
    }
}

function clearForm() {
    document.getElementById('expense-form').reset();
    activeEditId = null;
    document.getElementById('add-expense-heading').textContent = 'Add New Expense';
    document.getElementById('expense-desc-error').textContent = '';
    document.getElementById('expense-amount-error').textContent = '';
    document.getElementById('expense-category-error').textContent = '';
    document.getElementById('expense-date-error').textContent = '';
}

function handleJsonImport(e) {
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const statusEl = document.getElementById('io-status-msg');
        const result = validateImportedJson(evt.target.result);

        if (!result.valid) {
            statusEl.textContent = result.error;
            statusEl.style.color = 'var(--error-color)';
            return;
        }

        APP_STATE.records = result.data.records;
        if (result.data.budgetCap) APP_STATE.budgetCap = result.data.budgetCap;
        if (result.data.rates) APP_STATE.rates = result.data.rates;

        saveToStorage('app:records', APP_STATE.records);
        saveToStorage('app:budget_cap', APP_STATE.budgetCap);
        saveToStorage('app:rates', APP_STATE.rates);

        initAppState();
        renderAll();

        statusEl.textContent = 'Backup file imported successfully!';
        statusEl.style.color = 'green';
    };
    reader.readAsText(file);
}

function renderAll() {
    renderDashboard();
    renderLedger();
}

function renderDashboard() {
    const total = calculateTotalSpent();
    const topCat = getTopCategory();
    const budget = checkBudgetStatus();

    document.getElementById('stat-total-spent').textContent = total.toFixed(2);
    document.getElementById('stat-top-category').textContent = topCat;

    const capLabel = document.getElementById('stat-budget-cap');
    if (APP_STATE.budgetCap > 0) {
        let displayCap = APP_STATE.budgetCap;
        if (APP_STATE.activeCurrency !== 'RWF') {
            displayCap = APP_STATE.budgetCap * (APP_STATE.rates[APP_STATE.activeCurrency] || 1);
        }
        capLabel.textContent = displayCap.toFixed(2);
    }   else {
        capLabel.textContent = 'Not set';
    }

    const labelEls = document.querySelectorAll('.active-currency-label');
    labelEls.forEach(el => el.textContent = APP_STATE.activeCurrency);

    const progressBar = document.getElementById('budget-progress-fill');
    const liveStatus = document.getElementById('budget-live-status');

    progressBar.style.width = `${budget.percent}%`;

    if (budget.isOver) {
        progressBar.classList.add('over-cap');
        liveStatus.setAttribute('aria-live', 'assertive');
        liveStatus.textContent =  ` Over budget cap by ${budget.remaining.toFixed(2)} RWF! (${budget.percent}%)`;
    }   else {
        progressBar.classList.remove('over-cap');
        liveStatus.setAttribute('aria-live', 'polite');
        if (APP_STATE.budgetCap > 0) {
            liveStatus.textContent = `Remaining limit: ${budget.remaining.toFixed(2)} RWF (${budget.percent}%)`;
        }   else {
            liveStatus.textContent = 'Set limit below · 0%';}
    }

    renderChart();
}

function renderChart() {
    const chartRow = document.getElementById('chart-pillar-row');
    chartRow.innerHTML = '';
    const trendData = getPastWeekTrend();
    const maxDayVal = Math.max(...Object.values(trendData), 1);

    for (const dateStr in trendData) {
        const val = trendData[dateStr];
        const pctHeight = (val / maxDayVal) * 100; 
        const shortDay = dateStr.slice(5);

        const pillar = document.createElement('div');
        pillar.className = 'chart-bar-pillar';
        pillar.style.height = `${Math.max(pctHeight, 4)}%`;
        pillar.setAttribute('data-label', shortDay);
        pillar.title = `${dateStr}: ${val.toFixed(2)} RWF`;
        chartRow.appendChild(pillar);
    }
}

function renderLedger() {
    const container = document.getElementById('ledger-rows-target');
    container.innerHTML = '';


    const searchInput = document.getElementById('txt-search').value;
    const ignoreCase = document.getElementById('chk-case-insensitive').checked;
    const regex = compileRegex(searchInput, ignoreCase);

    let filtered = APP_STATE.records.filter(rec => {
        if(!regex) return true;
        return regex.test(rec.description) || regex.test(rec.category);
    });

    filtered.sort((a,b) => {
        if (currentSortKey === 'amount') return b.amount - a.amount;
        if (currentSortKey === 'description') return a.description.localeCompare(b.description);
        return new Date(b.date) - new Date(a.date);
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state-card">No transactions logged match search filter paths.</div>`;
        return;
    }

    filtered.forEach(rec => {
        let displayAmount = rec.amount;

        if (APP_STATE.activeCurrency !== 'RWF') {
            displayAmount = rec.amount * (APP_STATE.rates[APP_STATE.activeCurrency] || 1);
        }

        const card = document.createElement('div');
        card.className = 'record-card';
        card.style.background = '#FFF';
        card.style.border = '2px solid var(--text-color)';
        card.style.padding = '1rem';
        card.style.marginBottom = '1rem';
        card.style.borderRadius = '6px';

        const highlightedDesc = highlightMatches(rec.description, regex);
        const highlightedCat = highlightMatches(rec.category, regex);

        card.innerHTML = `
            <div style="display:flex;justify-content:space-between; font-weight:bold;"> 
                <span>${highlightedDesc}</span>
                <span>${displayAmount.toFixed(2)} ${APP_STATE.activeCurrency}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:0.85rem;"> 
                <span style="background:#EEE; padding:2px 6px; border-radius:4px;">${highlightedCat}</span> 
                <span style="color:#666;">${rec.date}</span> 
            </div>
            <div style="margin-top:10px; display:flex; gap:8px;">
                <button type="button" class="btn-edit" style="padding:4px 8px; font-size:0.8rem;">Edit</button> 
                <button type="button" class="btn-delete" style="padding:4px 8px; font-size:0.8rem;
                background:var(--error-color); color:white;">Delete</button>
            </div>
        `;

        card.querySelector('.btn-edit').addEventListener('click', () => populateFormForEdit(rec.id));
        card.querySelector('.btn-delete').addEventListener('click', () => handleRecordDelete(rec.id));

        container.appendChild(card);
    });
}

function populateFormForEdit(id) {
    const record = APP_STATE.records.find(r => r.id === id);
    if (!record) return;

    document.getElementById('expense-desc').value = record.description;
    document.getElementById('expense-amount').value = record.amount;
    document.getElementById('expense-category').value = record.category;
    document.getElementById('expense-date').value = record.date;

    activeEditId = id;
    document.getElementById('add-expense-heading').textContent = 'Modify Selected Expense';
    document.getElementById('add-expense').scrollIntoView({ behavior: 'smooth' });
}

function handleRecordDelete(id) {
    if (confirm('Are you sure you want to delete this transaction record?')) {
        APP_STATE.records = APP_STATE.records.filter(r => r.id !== id);
        saveToStorage('app:records', APP_STATE.records);
        renderAll();
    }
}
