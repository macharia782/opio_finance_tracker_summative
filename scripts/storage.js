export function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    }  catch (error) {
        console.error('Storage write failure:', error);
    }
}

export function loadFromStorage(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item): defaultValue;
    }   catch (error) {
        console.error('Storage read failure:', error);
        return defaultValue;
    }
}

export function validateImportedJson(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);

        if (!parsed || !Array.isArray(parsed.records)) {
            return { valid: false, data: null, error: 'Root must contain a records array.' };
        }

        for (const record of parsed.records) {
            if (!record.id || typeof record.id !== 'string') return { valid: false, data: null, error: 'Record valid id string.' };
            if (!record.description || typeof record.description !== 'string') return { valid: false, data: null, error: 'Record missing description string.' };
            if (record.amount === undefined || isNaN(Number(record.amount))) return { valid: false, data: null, error: 'Record missing valid amount value.' };
            if (!record.category || typeof record.category !== 'string') return { valid: false, data: null, error: 'Record missing category string.' };
            if (!record.date || typeof record.date !== 'string') return { valid: false, data: null, error: 'Record missing date string.' };
        }

        return { valid: true, data: parsed, error: null };
    }   catch (e) {
        return { valid: false, data: null, error: 'Malformed JSON payload file structure. ' };
    }
}

export function triggerJsonExport(recordsData, budgetCap, ratesData) {
    const exportPayload = {
        records: recordsData,
        budgetCap: budgetCap,
        rates: ratesData
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `opio_ledger_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();

    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}