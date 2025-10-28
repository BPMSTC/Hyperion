import { Component, OnInit } from '@angular/core';
import { QuoteService, Quote } from '../services/quote.service';

@Component({
  selector: 'app-quote-of-the-day',
  template: `
    <div class="quote-of-the-day p-3 bg-info text-white rounded">
      <h5>Quote of the day</h5>
      <blockquote class="blockquote">
        <p>{{ quote?.text || 'Stay positive, work hard, make it happen.' }}</p>
        <footer class="blockquote-footer text-white-50">
          {{ quote?.author || 'Unknown' }}
        </footer>
      </blockquote>
    </div>
  `,
  styles: [`
    .quote-of-the-day { max-width: 500px; margin: 2rem auto; }
    blockquote { margin: 0; }
  `]
})
export class QuoteOfTheDayComponent implements OnInit {
  quote: Quote | null = null;

  constructor(private quoteService: QuoteService) {}

  ngOnInit(): void {
    this.loadQuote();
    // Set up a timer to refresh every 24 hours
    setInterval(() => this.loadQuote(), 24 * 60 * 60 * 1000);
  }

  loadQuote() {
    this.quoteService.getQuoteOfTheDay().subscribe(q => this.quote = q);
  }
}
