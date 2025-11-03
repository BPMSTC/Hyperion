export function startQuoteCycler(updateQuote: (quote: string) => void) {
    const QUOTE_STORAGE_KEY = 'lastQuote';
    const TIME_STORAGE_KEY = 'lastQuoteTime';
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    const now = new Date().getTime();
    const lastQuoteTime = localStorage.getItem(TIME_STORAGE_KEY);
    const lastQuote = localStorage.getItem(QUOTE_STORAGE_KEY);

    if (lastQuoteTime && (now - parseInt(lastQuoteTime)) < TWENTY_FOUR_HOURS) {
        updateQuote(lastQuote || ""); // Use the last quote if within 24 hours
    } else {
        fetchNewQuote(updateQuote);
    }

    setInterval(() => {
        fetchNewQuote(updateQuote);
    }, TWENTY_FOUR_HOURS);
}

function fetchNewQuote(updateQuote: (quote: string) => void) {
    // Placeholder for the API endpoint
    const API_ENDPOINT = 'https://api.example.com/motivational-quote';

    fetch(API_ENDPOINT)
        .then(response => response.json())
        .then(data => {
            const quote = data.quote; // Adjust based on actual API response structure
            localStorage.setItem('lastQuote', quote);
            localStorage.setItem('lastQuoteTime', new Date().getTime().toString());
            updateQuote(quote);
        })
        .catch(error => {
            console.error('Error fetching quote:', error);
        });
}