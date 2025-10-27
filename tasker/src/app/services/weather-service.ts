import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeed: number;
  latitude: number;
  longitude: number;
  locationName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly API_BASE = 'https://api.open-meteo.com/v1/forecast';
  
  // Default location (Stevens Point, Wisconsin)
  private readonly DEFAULT_LAT = 44.5236;
  private readonly DEFAULT_LON = -89.5746;

  constructor(private http: HttpClient) {}

  /**
   * Get current weather for given coordinates
   */
  getCurrentWeather(lat: number, lon: number): Observable<WeatherData | null> {
    const url = `${this.API_BASE}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        if (!response.current) return null;
        
        return {
          temperature: Math.round(response.current.temperature_2m),
          weatherCode: response.current.weather_code,
          weatherDescription: this.getWeatherDescription(response.current.weather_code),
          windSpeed: Math.round(response.current.wind_speed_10m),
          latitude: lat,
          longitude: lon
        };
      }),
      catchError(error => {
        console.error('Error fetching weather:', error);
        return of(null);
      })
    );
  }

  /**
   * Get weather using browser's geolocation
   */
  getWeatherForCurrentLocation(): Observable<WeatherData | null> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported, using default location');
        this.getCurrentWeather(this.DEFAULT_LAT, this.DEFAULT_LON).subscribe(
          data => observer.next(data),
          error => observer.error(error),
          () => observer.complete()
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          this.getCurrentWeather(
            position.coords.latitude,
            position.coords.longitude
          ).subscribe(
            data => observer.next(data),
            error => observer.error(error),
            () => observer.complete()
          );
        },
        error => {
          console.warn('Geolocation error, using default location:', error);
          this.getCurrentWeather(this.DEFAULT_LAT, this.DEFAULT_LON).subscribe(
            data => observer.next(data),
            error => observer.error(error),
            () => observer.complete()
          );
        }
      );
    });
  }

  /**
   * Convert weather code to human-readable description
   * Based on WMO Weather interpretation codes
   */
  private getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    
    return weatherCodes[code] || 'Unknown';
  }

  /**
   * Get weather icon/emoji based on code
   */
  getWeatherIcon(code: number): string {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 57) return '🌧️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  }

  /**
   * Suggest tasks based on current weather conditions
   */
  suggestTasksBasedOnWeather(weather: WeatherData): string[] {
    const suggestions: string[] = [];
    const temp = weather.temperature;
    const code = weather.weatherCode;

    // Rain conditions (codes 51-67, 80-82)
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      suggestions.push('Indoor cleaning');
      suggestions.push('Organize files');
      suggestions.push('Read a book');
      suggestions.push('Work on indoor projects');
    }
    // Snow conditions (codes 71-86)
    else if (code >= 71 && code <= 86) {
      suggestions.push('Shovel driveway');
      suggestions.push('Indoor activities');
      suggestions.push('Hot beverage prep');
      suggestions.push('Cozy indoor tasks');
    }
    // Thunderstorm (codes 95-99)
    else if (code >= 95) {
      suggestions.push('Stay indoors');
      suggestions.push('Catch up on emails');
      suggestions.push('Plan future tasks');
    }
    // Nice weather (clear/partly cloudy and good temp)
    else if (code <= 3 && temp >= 60 && temp <= 85) {
      suggestions.push('Go for a walk');
      suggestions.push('Outdoor errands');
      suggestions.push('Yard work');
      suggestions.push('Visit the park');
    }
    // Cold but clear
    else if (code <= 3 && temp < 60) {
      suggestions.push('Bundle up and exercise');
      suggestions.push('Quick outdoor errands');
      suggestions.push('Indoor workout');
    }
    // Hot weather
    else if (temp > 85) {
      suggestions.push('Early morning tasks');
      suggestions.push('Stay hydrated');
      suggestions.push('Indoor activities');
      suggestions.push('Evening outdoor tasks');
    }
    // Default suggestions
    else {
      suggestions.push('Check off pending tasks');
      suggestions.push('Plan your day');
      suggestions.push('Review priorities');
    }

    return suggestions;
  }

  /**
   * Determine if weather is good for outdoor activities
   */
  isGoodForOutdoorActivities(weather: WeatherData): boolean {
    const temp = weather.temperature;
    const code = weather.weatherCode;
    
    // Clear or partly cloudy, reasonable temperature
    return code <= 3 && temp >= 50 && temp <= 90;
  }
}