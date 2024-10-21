import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { AuthService, State } from './auth.service';
import { ConfigService } from './config.service';  // Import ConfigService
import { Photo, StandardResponse } from '../../data.type';
import { from, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  #http = inject(HttpClient);
  #auth = inject(AuthService);
  #configService = inject(ConfigService);  // Inject ConfigService
  $photo_id = signal<string>("");

  constructor() { }

  // Request pre-signed URL from the backend
  getUploadUrl(data: { email: string, profileImageFilename: string, profileImageContentType: string }) {
    // Get the JWT token from AuthService
    const token = this.#auth.$state().token;

    // Load config before making the request
    return from(this.#configService.loadConfig()).pipe(
      switchMap(() => {
        const uploadApiUrl = this.#configService.getUploadApiUrl();  // Use the dynamically loaded upload API URL

        // Set up headers with Authorization
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`  // Include JWT token in Authorization header
        });

        return this.#http.post<{ data: { profileImageUploadURL: string; signedProfileImageURL: string } }>(
          uploadApiUrl,
          data,
          { headers }
        );
      })
    );
  }

  // Step 2: Upload the image to S3 using the pre-signed URL
  async uploadImage(url: string, file: File) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    return response;
  }


}
