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
  private apiUrl = 'https://quotes-inspirational-quotes-motivational-quotes.p.rapidapi.com/quote?token=ipworld.info';
  private headers = new HttpHeaders({
    'X-RapidAPI-Key': '4c2f2c0c75mshd6b704b0055be75p16034ajsn75e2084c72b2',
    'X-RapidAPI-Host': 'quotes-inspirational-quotes-motivational-quotes.p.rapidapi.com',
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
    return this.http.get(this.apiUrl, { headers: this.headers }).pipe(
      map((response: any) => {
        const quote: Quote = {
          text: response?.text || 'No quote found.',
          author: response?.author || 'Unknown'
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
  }
}