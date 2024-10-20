import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { AuthService, State } from './auth.service';
import { Comment, Photo, StandardResponse } from '../../data.type';


interface PhotoResponse {
  success: boolean;
  data: Photo
}

@Injectable({
  providedIn: 'root'
})

export class PhotoService {
  #http = inject(HttpClient);
  #auth = inject(AuthService);
  #token = this.#auth.$state().token;
  $photo_id = signal<string>("");



  //Request pre-signed URL from the backend
  getUploadUrl(data: { email: string, profileImageFilename: string, profileImageContentType: string }) {

    // Get the JWT token from AuthService
    const token = this.#auth.$state().token;

    // Set up headers with Authorization
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`  // Include JWT token in Authorization header
    });

    return this.#http.post<{ data: { profileImageUploadURL: string } }>(
      'https://slx20f36ie.execute-api.us-east-1.amazonaws.com/prod/upload',
      data
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


  get_photo(size: number, page_no: number) {
    const userid = this.#auth.$state().id ? this.#auth.$state().id : this.#auth.getGuestUserId();
    return this.#http.get<StandardResponse<Photo[]>>(`http://localhost:3000/photos?size=${size}&page_no=${page_no}&uid=${userid}`);
  }


}
