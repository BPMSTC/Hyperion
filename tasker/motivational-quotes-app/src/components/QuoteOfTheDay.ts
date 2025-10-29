import React, { useEffect, useState } from 'react';
import { fetchQuote } from '../api/quotesApi';
import { startQuoteCycler } from '../utils/quoteCycler';

const QuoteOfTheDay: React.FC = () => {
    const [quote, setQuote] = useState<string>('');

    useEffect(() => {
        const loadQuote = async () => {
            const fetchedQuote = await fetchQuote();
            setQuote(fetchedQuote);
        };

        loadQuote();
        const timer = startQuoteCycler(loadQuote);

        return () => clearInterval(timer);
    }, []);

    return (
        <div>
            <h2>Quote of the day</h2>
            <p>{quote}</p>
        </div>
    );
};

export default QuoteOfTheDay;