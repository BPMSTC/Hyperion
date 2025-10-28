import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  private readonly rapidApiKey: string = '31b8304331msh0bc2b7ed13f6529p1bb430jsn2ad943e42e82';
  private readonly rapidApiHost = 'google-map-places.p.rapidapi.com';
  private readonly baseUrl = `https://${this.rapidApiHost}/maps/api/place`;
  private userLocation: { lat: number; lng: number } | null = null;
  private readonly DEFAULT_LAT = 44.5236;
  private readonly DEFAULT_LON = -89.5746;

  // HttpClient is Angular's built-in service for making HTTP requests (API calls) 
  // to web servers. It's Angular's way of communicating with external APIs and backend services.
  constructor(private http: HttpClient) { 
    this.initializeUserLocation();
  }

  //navigator is a built-in web API that provides information about the user's browser and device,
  // including access to geolocation features.
  private initializeUserLocation(): void {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => { // Success callback, position is the parameter taht contains the user's gps coordinates
        this.userLocation = { // service property to store the user's location, creates a new object with lat and lng properties
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
        timeout: 10000, //10 seconds
        maximumAge: 600000 //10 minutes
      }
    );
  }

  // Get HTTP headers for RapidAPI requests
  // headers are required by RapidAPI to authenticate and identify the client making the request.
  // Http is a class provided by Angular to facilitate HTTP communication.
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.rapidApiHost,
      'Content-Type': 'application/json'
    });
  }

  // This is a helper method
  // Build API URL for given endpoint
  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  // This is a helper method
  // Make autocomplete request with given parameters
    private makeAutocompleteRequest(params: any): Observable<AutocompleteResult[]> {
      return this.http.get<any>(this.getApiUrl('autocomplete/json'), { 
        headers: this.getHeaders(),
        params 
      }).pipe( // pip transforms the structure of the data
        map(response => response.predictions || []), // map extracts the predictions array from the API response
        catchError(() => of([])) // if error occurs, return an empty array
      );
    }

    // Generic error handler for API operations
    private handleApiError(operation: string) {
      return (error: any): Observable<any> => {
        console.error(`Error ${operation}:`, error);
        return of([]);
      };
    }

    // Get place autocomplete suggestions with location-aware prioritization
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
        // both const objects defined here
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
    // this is a return statement
    // forkJoin waits for both Observables to complete, then combines their results
    return forkJoin([localResults$, globalResults$]).pipe( //chains operations on the Observable
      //Destructuring assignment - unpacks array into variables
      map(([localResults, globalResults]) => {
        const localPlaceIds = new Set(localResults.map((r: AutocompleteResult) => r.place_id));
        const uniqueGlobalResults = globalResults.filter((r: AutocompleteResult) => !localPlaceIds.has(r.place_id));
        return [...localResults, ...uniqueGlobalResults];//spreads the array
      }),
      catchError(this.handleApiError('combining autocomplete results'))
    );
  }

  // Get user's current location
  getUserLocation(): { lat: number; lng: number } | null {
    return this.userLocation;
  }

  // Check if location is available
  isLocationAvailable(): boolean {
    return this.userLocation !== null;
  }

  /**
   * Format autocomplete result for display
   */
  formatLocationDisplay(place: AutocompleteResult): string {
    if (place.description) {
      return place.description;
    }
    if (place.structured_formatting) {
      return `${place.structured_formatting.main_text}, ${place.structured_formatting.secondary_text}`;
    }
    return 'Unknown location';
  }
}