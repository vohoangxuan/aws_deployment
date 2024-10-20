import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

import { PhotoService } from './photo.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

interface UploadResponse {
  data: {
    profileImageUploadURL: string;
  };
}

@Component({
  selector: 'app-add',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="form-container">
      <h1>Upload Profile Image</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="fill">
          <mat-label>Enter image title</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>
        <div>
          <input type="file" formControlName="picture" (change)="onFileSelect($event)" />          
        </div>
        <div class="submit-container">
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || !file">Upload Image</button>
        </div>
      </form>

      <div *ngIf="previewUrl" class="image-preview">
        <img [src]="previewUrl" class="preview-img" alt="Image Preview">
      </div>
    </div>
  `,
  styles: `
    .form-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: auto;
      padding: 20px;
      max-width: 360px;
    }

    .image-preview {
      padding: 10px;
      display: flex; 
      align-items: center; 
    }

    .preview-img {
      max-width: 100%;
      max-height: 300px; 
      height: auto;
      display: block;
    }

    .submit-container {
      margin-top: 20px; 
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    button {
      width: 100%;
      margin-top: 20px;
    }
  `
})
export class AddComponent {
  form = inject(FormBuilder).nonNullable.group({
    picture: [null, Validators.required],
    title: ['']
  });

  file: File | null = null;  // Initialize file as null to avoid non-null assertions
  previewUrl: string | ArrayBuffer | null = null;
  photo_service = inject(PhotoService);
  #auth = inject(AuthService);
  #router = inject(Router);

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/') || file.size > 5242880) {
        alert(!file.type.startsWith('image/') ? 'Only image files are allowed!' : 'File size should not exceed 5MB');
        input.value = '';
        this.form.controls['picture'].setValue(null);
        return;
      }

      this.file = file;  // Set the file correctly
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(this.file);
    }
  }

  submit() {
    const email = this.#auth.getUserEmail();  // Get the user's email from AuthService
    if (!email) {
      alert('User is not logged in!');
      return;
    }

    if (this.form.valid && this.file) {  // Ensure file is set before proceeding
      // Step 1: Request pre-signed URL from the backend
      this.photo_service.getUploadUrl({
        email: email,  // Use the email from AuthService
        profileImageFilename: this.file.name,
        profileImageContentType: this.file.type
      }).subscribe({
        next: (response: UploadResponse) => {  // Use next for success response
          const { profileImageUploadURL } = response.data;

          // Step 2: Upload the image to S3 using the pre-signed URL
          this.photo_service.uploadImage(profileImageUploadURL, this.file!).then(uploadResult => {
            if (uploadResult.ok) {
              // Step 3: Image uploaded successfully, reset the form
              this.form.reset();
              this.file = null;
              this.previewUrl = null;
              alert('Image uploaded successfully!');
            } else {
              console.error('Image upload failed');
            }
          });
        },
        error: (err) => {  // Use error for error handling
          console.error('Error getting pre-signed URL:', err);
        },
        complete: () => {  // Optional: Use complete if you want to handle completion
          console.log('Request completed.');
        }
      });
    }
  }

  constructor() {
    if (!this.#auth.is_logged_in()) {
      this.#router.navigate(['/login']).then(success => {
        console.log('Navigation to login successful:', success);
      }).catch(err => {
        console.error('Navigation error:', err);
      });
    }
  }
}
