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
  private readonly DEFAULT_LAT = 44.5236; // Same as your weather service
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
      // Use default location as fallback
      this.userLocation = {
        lat: this.DEFAULT_LAT,
        lng: this.DEFAULT_LON
      };
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 600000 // 10 minutes
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
   * Search for places using the RapidAPI Google Places API
   * @param query - The search query (e.g., "restaurants near me", "coffee shop")
   * @returns Observable with places data
   */
  searchPlaces(query: string): Observable<PlaceResult[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }

    const url = `${this.baseUrl}/textsearch/json`;
    const params = { query: query.trim() };

    return this.http.get<any>(url, { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      map(response => response.results || []),
      catchError(error => {
        console.error('Error searching places:', error);
        return of([]);
      })
    );
  }

  /**
   * Get place autocomplete suggestions using HTTP
   * @param input - The input text for autocomplete
   * @returns Observable with autocomplete suggestions
   */
getPlaceAutocomplete(input: string): Observable<AutocompleteResult[]> {
  if (!input || input.trim().length < 3) {
    return of([]);
  }

  const url = `${this.baseUrl}/autocomplete/json`;
  
  if (!this.userLocation) {
    // No location available, just do a regular search
    const params = { input: input.trim() };
    return this.http.get<any>(url, { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      map(response => response.predictions || []),
      catchError(error => {
        console.error('Error getting autocomplete:', error);
        return of([]);
      })
    );
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
    components: 'country:us' // Still bias towards US, but no location restriction
  };

  // Make both requests simultaneously
  const localResults$ = this.http.get<any>(url, { 
    headers: this.getHeaders(),
    params: localParams 
  }).pipe(
    map(response => response.predictions || []),
    catchError(() => of([])) // Return empty array on error
  );

  const globalResults$ = this.http.get<any>(url, { 
    headers: this.getHeaders(),
    params: globalParams 
  }).pipe(
    map(response => response.predictions || []),
    catchError(() => of([]))
  );

  // Combine both results: local first, then global (excluding duplicates)
  return forkJoin([localResults$, globalResults$]).pipe(
    map(([localResults, globalResults]) => {
      // Get place_ids from local results to avoid duplicates
      const localPlaceIds = new Set(localResults.map((r: AutocompleteResult) => r.place_id));
      
      // Filter out global results that are already in local results
      const uniqueGlobalResults = globalResults.filter((r: AutocompleteResult) => !localPlaceIds.has(r.place_id));
      
      // Combine: local results first, then unique global results
      return [...localResults, ...uniqueGlobalResults];
    }),
    catchError(error => {
      console.error('Error combining autocomplete results:', error);
      return of([]);
    })
  );
}

    // Add this method to check if location is available
  getUserLocation(): { lat: number; lng: number } | null {
    return this.userLocation;
  }

  // Add this method to check if location is ready
  isLocationAvailable(): boolean {
    return this.userLocation !== null;
  }


  /**
   * Get detailed place information by place ID
   * @param placeId - The Google Places place ID
   * @returns Observable with place details
   */
  getPlaceDetails(placeId: string): Observable<PlaceResult | null> {
    if (!placeId) {
      return of(null);
    }

    const url = `${this.baseUrl}/details/json`;
    const params = { 
      place_id: placeId,
      fields: 'name,formatted_address,geometry'
    };

    return this.http.get<any>(url, { 
      headers: this.getHeaders(),
      params 
    }).pipe(
      map(response => response.result || null),
      catchError(error => {
        console.error('Error getting place details:', error);
        return of(null);
      })
    );
  }

  /**
   * Format a place result for display
   * @param place - The place object from API (either PlaceResult or AutocompleteResult)
   * @returns Formatted place string
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

  /**
   * Check if the API key is configured
   * @returns boolean indicating if API key is set
   */
  isConfigured(): boolean {
    return this.rapidApiKey !== '31b8304331msh0bc2b7ed13f6529p1bb430jsn2ad943e42e82' && this.rapidApiKey?.length > 0;
  }
}