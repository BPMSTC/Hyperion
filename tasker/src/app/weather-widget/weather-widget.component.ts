import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService, WeatherData } from '../services/weather.service';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="weather-widget" *ngIf="weather">
      <div class="weather-header">
        <span class="weather-icon">{{ getWeatherIcon() }}</span>
        <div class="weather-info">
          <div class="weather-temp">{{ weather.temperature }}°F</div>
          <div class="weather-desc">{{ weather.weatherDescription }}</div>
        </div>
        <button class="weather-refresh" (click)="refreshWeather()" title="Refresh weather">
          🔄
        </button>
      </div>
      
      <div class="weather-details">
        <span class="weather-detail">💨 {{ weather.windSpeed }} mph</span>
      </div>

      <div class="task-suggestions" *ngIf="showSuggestions">
        <div class="suggestions-header">
          <strong>Suggested tasks for today:</strong>
          <button class="toggle-suggestions" (click)="showSuggestions = !showSuggestions">
            ▼
          </button>
        </div>
        <ul class="suggestions-list">
          <li *ngFor="let suggestion of taskSuggestions">{{ suggestion }}</li>
        </ul>
      </div>

      <div class="task-suggestions collapsed" *ngIf="!showSuggestions">
        <button class="toggle-suggestions-expand" (click)="showSuggestions = true">
          Suggested tasks ▶
        </button>
      </div>
    </div>

    <div class="weather-widget loading" *ngIf="loading">
      <div class="weather-loading">Loading weather...</div>
    </div>

    <div class="weather-widget error" *ngIf="error && !loading">
      <div class="weather-error">
        Unable to load weather. 
        <button (click)="refreshWeather()">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .weather-widget {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 20px;
      color: white;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .weather-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 10px;
    }

    .weather-icon {
      font-size: 48px;
    }

    .weather-info {
      flex: 1;
    }

    .weather-temp {
      font-size: 32px;
      font-weight: bold;
    }

    .weather-desc {
      font-size: 16px;
      opacity: 0.9;
    }

    .weather-refresh {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s;
    }

    .weather-refresh:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(180deg);
    }

    .weather-details {
      display: flex;
      gap: 15px;
      padding: 10px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .weather-detail {
      font-size: 14px;
    }

    .task-suggestions {
      margin-top: 15px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .task-suggestions.collapsed {
      padding: 10px;
      text-align: center;
    }

    .suggestions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .toggle-suggestions, .toggle-suggestions-expand {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 14px;
      padding: 5px;
    }

    .toggle-suggestions-expand {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 8px 15px;
    }

    .toggle-suggestions-expand:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .suggestions-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .suggestions-list li {
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .suggestions-list li:last-child {
      border-bottom: none;
    }

    .suggestions-list li:before {
      content: '✓ ';
      opacity: 0.7;
      margin-right: 8px;
    }

    .weather-widget.loading,
    .weather-widget.error {
      background: #f0f0f0;
      color: #333;
      text-align: center;
      padding: 30px;
    }

    .weather-loading {
      font-size: 16px;
    }

    .weather-error button {
      margin-top: 10px;
      padding: 8px 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .weather-error button:hover {
      background: #5568d3;
    }
  `]
})
export class WeatherWidgetComponent implements OnInit {
  weather: WeatherData | null = null;
  taskSuggestions: string[] = [];
  loading = true;
  error = false;
  showSuggestions = true;

  constructor(private weatherService: WeatherService) {}

  ngOnInit(): void {
    this.loadWeather();
  }

  loadWeather(): void {
    this.loading = true;
    this.error = false;

    this.weatherService.getWeatherForCurrentLocation().subscribe({
      next: (data) => {
        this.loading = false;
        if (data) {
          this.weather = data;
          this.taskSuggestions = this.weatherService.suggestTasksBasedOnWeather(data);
        } else {
          this.error = true;
        }
      },
      error: (err) => {
        console.error('Weather error:', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  refreshWeather(): void {
    this.loadWeather();
  }

  getWeatherIcon(): string {
    return this.weather ? this.weatherService.getWeatherIcon(this.weather.weatherCode) : '🌤️';
  }
}