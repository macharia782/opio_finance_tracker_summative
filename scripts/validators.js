export const VALIDATION_REGEX = {
    description: /^\S(?:.*\S)?$/,
    amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/, 
    duplicateWord: /\b(\w+)\s+\1\b/
};

export function validateField(fieldName, value) {
    const clean = value.trim();

    if (!clean) {
        return { isValid: false, errorMsg: 'This field cannot be left blank.' };
    }

    if (fieldName === 'description') {
        if(!VALIDATION_REGEX.description.test(value)) {
            return { isValid: false, errorMsg: 'Cannot have leading or trailing spaces.' };
        }
        if (/\s{2,}/.test(value)) {
            return { isValid: false, errorMsg: 'Cannot have internal double spaces.' }
        }
        if (VALIDATION_REGEX.duplicateWord.test(clean)) {
            return { isValid: false, errorMsg: 'Advanced Error: Duplicate words detected!' };
        }  
    }

    if (fieldName === 'amount') {
        if(!VALIDATION_REGEX.amount.test(clean) || parseFloat(clean) <= 0) {
            return { isValid: false, errorMsg: 'Please enter a valid positive number.' };            
        }
    }

    if (fieldName === 'category') {
        if (!VALIDATION_REGEX.category.test(clean)) {
            return { isValid: false, errorMsg: 'Only letters, single spaces, and hyphens allowed.'}
        }
    }

    if (fieldName === 'date') {
        if(!VALIDATION_REGEX.date.test(clean)) {
            return { isValid: false, errorMsg: 'Format must be exactly YYYY-MM-DD.'};
        }

        const [y, m, d] = clean.split('-').map(Number);
        const checkDate = new Date(y, m - 1, d);
        if (checkDate.getFullYear() !== y || checkDate.getMonth() !== m - 1 || checkDate.getDate() !== d) {
            return { isValid: false, errorMsg: 'This calendar date does not exist. ' };
        }
    }

    return { isValid: true, errorMsg: ''};
}