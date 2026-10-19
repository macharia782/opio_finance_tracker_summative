export const APP_STATE = {
    records: [],
    budgetCap: 0,
    activeCurrency: 'RWF',
    rates: {
        KES: 0.11,
        UGX: 2.85
    }
};

export function calculateTotalSpent() {
    const sumInRwf = APP_STATE.records.reduce((acc, rec) => acc + parseFloat(rec.amount || 0), 0);
    if (APP_STATE.activeCurrency === 'RWF') return sumInRwf;
    return sumInRwf * (APP_STATE.rates[APP_STATE.activeCurrency] || 1);
}

export function getTopCategory() {
    if (APP_STATE.records.length === 0) return '-';

    const frequencies = {};
    APP_STATE.records.forEach(rec => {
        const cat = rec.category || 'Other';
        frequencies[cat] = (frequencies[cat] || 0) + 1;
    });

    let topCat = '-';
    let maxCount = 0;

    for (const cat in frequencies) {
        if (frequencies[cat] > maxCount) {
            maxCount = frequencies[cat];
            topCat = cat;
        }
    }

    return topCat;
}

export function checkBudgetStatus() {
    const totalInRwf = APP_STATE.records.reduce((acc, rec) => acc + parseFloat(rec.amount || 0), 0);
    if (!APP_STATE.budgetCap || APP_STATE.budgetCap <= 0) {
        return { percent: 0, remaining: 0, isOver: false };
    }

    const percent = Math.round((totalInRwf / APP_STATE.budgetCap) * 100);
    const remaining = APP_STATE.budgetCap - totalInRwf;
    const isOver = totalInRwf > APP_STATE.budgetCap;

    return {
        percent: Math.min(percent, 100),
        remaining: Math.abs(remaining),
        isOver
    };
}

export function getPastWeekTrend() {
    const dailyTotals = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateString = d.toISOString().slice(0, 10);
        dailyTotals[dateString] = 0;
    }

    APP_STATE.records.forEach(rec => {
        if (dailyTotals[rec.date] !== undefined) {
            dailyTotals[rec.date] += parseFloat(rec.amount || 0);
        }
    });

    return dailyTotals;
}