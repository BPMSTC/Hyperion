import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService, WeatherData } from '../services/weather-service';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-widget.component.html',
  styleUrls: ['./weather-widget.component.css']
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
      next: (data: WeatherData | null) => {
        this.loading = false;
        if (data) {
          this.weather = data;
          this.taskSuggestions = this.weatherService.suggestTasksBasedOnWeather(data);
        } else {
          this.error = true;
        }
      },
      error: (err: any) => {
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