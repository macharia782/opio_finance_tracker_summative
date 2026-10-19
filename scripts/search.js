export function compileRegex(input, ignoreCase = true) {
    if (!input) return null;

    try{
        const flags = ignoreCase ? 'i' : '';
        return new RegExp(input, flags);
    }   catch(error) {
        console.warn('Invalid regular expression search pattern type:', error.message);
        return null;
    }
}

export function highlightMatches(text, regexObj) {
    if(!regexObj) return text;

    return text.replace(regexObj, (match) => `<mark>${match}</mark>`);
}