import { APP_STATE, calculateTotalSpent, getTopCategory, checkBudgetStatus, getPastWeekTrend } from './state.js';
import { validateField } from './validators.js';
import { compileRegex, highlightMatches } from './search.js';

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
    APP_STATE.activeCurrency = loadFromStorage ('app:active_currency', 'RWF');

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

    document.getElementById('btn-export-json').
    addEventListener('click', () => {
    triggerJsonExport(APP_STATE.records, APP_STATE.
    budgetCap, APP_STATE.rates);

}