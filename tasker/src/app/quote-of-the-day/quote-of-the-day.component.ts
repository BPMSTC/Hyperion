import { Component, OnInit } from '@angular/core';
import { QuoteService, Quote } from '../services/quote.service';
import { provideHttpClient } from '@angular/common/http';


@Component({
  selector: 'app-quote-of-the-day',
  templateUrl: './quote-of-the-day.component.html',
  styleUrls: ['./quote-of-the-day.component.css']
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
    this.quoteService.fetchQuote().subscribe(q => this.quote = q);
  }
}
