import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private config: any = null;

    constructor(private http: HttpClient) { }

    // Load config.json and store it
    loadConfig(): Promise<void> {
        return this.http.get('/assets/config.json').toPromise().then((data) => {
            this.config = data;
        });
    }

    // Get the login API URL
    getLoginApiUrl(): string {
        return this.config?.loginApiUrl || '';
    }

    // Get the signup API URL
    getSignupApiUrl(): string {
        return this.config?.signupApiUrl || '';
    }

    getUploadApiUrl(): string {
        return this.config?.uploadApiUrl || '';
    }
}
