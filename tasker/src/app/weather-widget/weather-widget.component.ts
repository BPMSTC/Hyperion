import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherService, WeatherData } from '../services/weather-service';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weather-widget.component.html',
  styleUrls: ['./weather-widget.component.css']
})

    export class WeatherWidgetComponent implements OnInit {
  weather: WeatherData | null = null;
  taskSuggestions: string[] = [];
  loading = true;
  error = false;
  showSuggestions = true;
  showLocationInput = false;
  locationQuery = '';
  searching = false;
  locationError = '';
  currentLocation = '';

  constructor(private weatherService: WeatherService) {}

  ngOnInit(): void {
    this.loadSavedLocation();
  }

  loadSavedLocation(): void {
    // Check if user has a saved location preference
    const savedLocation = localStorage.getItem('weatherLocation');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        this.currentLocation = location.name;
        this.loadWeatherByCoords(location.lat, location.lon);
      } catch (e) {
        // If saved location is invalid, fall back to auto-detection
        this.loadWeather();
      }
    } else {
      // No saved location, use auto-detection
      this.loadWeather();
    }
  }

  loadWeather(): void {
    this.loading = true;
    this.error = false;
    this.locationError = '';

    this.weatherService.getWeatherForCurrentLocation().subscribe({
      next: (data: WeatherData | null) => {
        this.loading = false;
        if (data) {
          this.weather = data;
          this.taskSuggestions = this.weatherService.suggestTasksBasedOnWeather(data);
          this.currentLocation = 'Current Location';
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

  loadWeatherByCoords(lat: number, lon: number): void {
    this.loading = true;
    this.error = false;
    this.locationError = '';

    this.weatherService.getCurrentWeather(lat, lon).subscribe({
      next: (data: WeatherData | null) => {
        this.loading = false;
        if (data) {
          this.weather = data;
          this.taskSuggestions = this.weatherService.suggestTasksBasedOnWeather(data);
        } else {
          this.error = true;
          this.locationError = 'Unable to load weather for this location';
        }
      },
      error: (err: any) => {
        console.error('Weather error:', err);
        this.loading = false;
        this.error = true;
        this.locationError = 'Unable to load weather for this location';
      }
    });
  }

  refreshWeather(): void {
    this.loadSavedLocation();
  }

  toggleLocationInput(): void {
    this.showLocationInput = !this.showLocationInput;
    this.locationError = '';
  }

  searchLocation(): void {
    const query = this.locationQuery.trim();
    if (!query) return;

    this.searching = true;
    this.locationError = '';

    this.weatherService.searchLocation(query).subscribe({
      next: (result: any) => {
        this.searching = false;
        if (result) {
          this.currentLocation = result.name;
          // Save location preference
          localStorage.setItem('weatherLocation', JSON.stringify({
            name: result.name,
            lat: result.lat,
            lon: result.lon
          }));
          this.loadWeatherByCoords(result.lat, result.lon);
          this.showLocationInput = false;
          this.locationQuery = '';
        } else {
          this.locationError = 'Location not found. Try a different search.';
        }
      },
      error: (err: any) => {
        console.error('Location search error:', err);
        this.searching = false;
        this.locationError = 'Unable to search location. Please try again.';
      }
    });
  }

  useAutoLocation(): void {
    this.searching = true;
    this.locationError = '';
    
    // Clear saved location preference
    localStorage.removeItem('weatherLocation');
    this.currentLocation = '';
    
    this.loadWeather();
    this.showLocationInput = false;
    this.locationQuery = '';
    this.searching = false;
  }

  getWeatherIcon(): string {
    return this.weather ? this.weatherService.getWeatherIcon(this.weather.weatherCode) : '🌤️';
  }
}