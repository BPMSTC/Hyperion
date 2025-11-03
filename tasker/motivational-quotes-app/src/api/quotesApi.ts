export const fetchQuote = async (): Promise<string> => {
    const response = await fetch('https://api.example.com/motivational-quote'); // Placeholder for the actual API endpoint
    if (!response.ok) {
        throw new Error('Failed to fetch quote');
    }
    const data = await response.json();
    return data.quote; // Assuming the API returns an object with a 'quote' property
};