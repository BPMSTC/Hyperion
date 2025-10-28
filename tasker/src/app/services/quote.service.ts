import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Quote {
  text: string;
  author: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private apiUrl = 'https://quotes-api12.p.rapidapi.com/dev-jokes?category=all&subcategory=javascript'; // Replace with your actual API endpoint
  private headers = new HttpHeaders({
    // Add your API headers here
    'X-API-Key': '4c2f2c0c75mshd6b704b0055be75p16034ajsn75e2084c72b2'
  });

  private quoteSubject = new BehaviorSubject<Quote | null>(null);
  public quote$ = this.quoteSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load saved quote from localStorage on initialization
    this.loadSavedQuote();
  }

  private loadSavedQuote(): void {
    const savedQuote = localStorage.getItem('dailyQuote');
    if (savedQuote) {
      const quote = JSON.parse(savedQuote);
      const fetchDate = new Date(quote.fetchDate);
      // Check if the quote is from today
      if (this.isToday(fetchDate)) {
        this.quoteSubject.next(quote);
        return;
      }
    }
    // If no valid saved quote, fetch a new one
    this.fetchQuote().subscribe();
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  fetchQuote(): Observable<Quote> {
    // TODO: Replace with actual API call
    // For now, return a placeholder quote
    return new Observable<Quote>(observer => {
      const placeholderQuote: Quote = {
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
      };
      
      // Store in localStorage
      localStorage.setItem('dailyQuote', JSON.stringify(placeholderQuote));
      this.quoteSubject.next(placeholderQuote);
      observer.next(placeholderQuote);
      observer.complete();
    });

    /* Uncomment and modify this when you have your API details
    return this.http.get(this.apiUrl, { headers: this.headers }).pipe(
      map((response: any) => {
        const quote: Quote = {
          text: response.quote,
          author: response.author,
          fetchDate: new Date()
        };
        localStorage.setItem('dailyQuote', JSON.stringify(quote));
        this.quoteSubject.next(quote);
        return quote;
      }),
      catchError(error => {
        console.error('Error fetching quote:', error);
        throw error;
      })
    );
    */
  }

  // Placeholder for API call
  getQuoteOfTheDay(): Observable<Quote> {
    // Replace this with actual API call logic
    return of({
      text: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs'
    });
  }
}