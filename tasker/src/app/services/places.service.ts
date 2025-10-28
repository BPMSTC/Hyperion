import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface AutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private readonly rapidApiKey: string = '31b8304331msh0bc2b7ed13f6529p1bb430jsn2ad943e42e82'; // Replace with your RapidAPI key
  private readonly rapidApiHost = 'google-map-places.p.rapidapi.com';
  private readonly baseUrl = `https://${this.rapidApiHost}/maps/api/place`;
  private userLocation: { lat: number; lng: number } | null = null;
  private readonly DEFAULT_LAT = 44.5236;
  private readonly DEFAULT_LON = -89.5746;

  constructor(private http: HttpClient) { 
    this.initializeUserLocation();
  }

  private initializeUserLocation(): void {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('User location obtained:', this.userLocation);
      },
      error => {
        console.warn('Could not get user location:', error.message);
        this.userLocation = {
          lat: this.DEFAULT_LAT,
          lng: this.DEFAULT_LON
        };
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  }

  /**
   * Get HTTP headers for RapidAPI requests
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.rapidApiHost,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Build API URL for given endpoint
   */
  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  /**
   * Make autocomplete request with given parameters
   */
  private makeAutocompleteRequest(params: any): Observable<AutocompleteResult[]> {
    return this.http.get<any>(this.getApiUrl('autocomplete/json'), { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      map(response => response.predictions || []),
      catchError(() => of([]))
    );
  }

  /**
   * Generic error handler for API operations
   */
  private handleApiError(operation: string) {
    return (error: any): Observable<any> => {
      console.error(`Error ${operation}:`, error);
      return of([]);
    };
  }

  /**
   * Search for places using the RapidAPI Google Places API
   */
  searchPlaces(query: string): Observable<PlaceResult[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }

    const params = { query: query.trim() };

    return this.http.get<any>(this.getApiUrl('textsearch/json'), { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      map(response => response.results || []),
      catchError(this.handleApiError('searching places'))
    );
  }

  /**
   * Get place autocomplete suggestions with location-aware prioritization
   */
  getPlaceAutocomplete(input: string): Observable<AutocompleteResult[]> {
    if (!input || input.trim().length < 3) {
      return of([]);
    }

    if (!this.userLocation) {
      // No location available, just do a regular search
      const params = { input: input.trim() };
      return this.makeAutocompleteRequest(params);
    }

    // Make two simultaneous requests
    const localParams = {
      input: input.trim(),
      location: `${this.userLocation.lat},${this.userLocation.lng}`,
      radius: '25000',
      strictbounds: 'true',
      components: 'country:us'
    };

    const globalParams = {
      input: input.trim(),
      components: 'country:us'
    };

    // Make both requests simultaneously using the helper method
    const localResults$ = this.makeAutocompleteRequest(localParams);
    const globalResults$ = this.makeAutocompleteRequest(globalParams);

    // Combine both results: local first, then global (excluding duplicates)
    return forkJoin([localResults$, globalResults$]).pipe(
      map(([localResults, globalResults]) => {
        const localPlaceIds = new Set(localResults.map((r: AutocompleteResult) => r.place_id));
        const uniqueGlobalResults = globalResults.filter((r: AutocompleteResult) => !localPlaceIds.has(r.place_id));
        return [...localResults, ...uniqueGlobalResults];
      }),
      catchError(this.handleApiError('combining autocomplete results'))
    );
  }

  /**
   * Get user's current location
   */
  getUserLocation(): { lat: number; lng: number } | null {
    return this.userLocation;
  }

  /**
   * Check if location is available
   */
  isLocationAvailable(): boolean {
    return this.userLocation !== null;
  }

  /**
   * Get detailed place information by place ID
   */
  getPlaceDetails(placeId: string): Observable<PlaceResult | null> {
    if (!placeId) {
      return of(null);
    }

    const params = { 
      place_id: placeId,
      fields: 'name,formatted_address,geometry'
    };

    return this.http.get<any>(this.getApiUrl('details/json'), { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      map(response => response.result || null),
      catchError(this.handleApiError('getting place details'))
    );
  }

  /**
   * Format a place result for display
   */
  formatPlaceDisplay(place: PlaceResult | AutocompleteResult | any): string {
    if (place.formatted_address) {
      return place.formatted_address;
    }
    if (place.description) {
      return place.description;
    }
    if (place.structured_formatting) {
      return `${place.structured_formatting.main_text}, ${place.structured_formatting.secondary_text}`;
    }
    return place.name || 'Unknown location';
  }
}