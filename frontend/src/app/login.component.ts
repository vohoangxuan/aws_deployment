import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="login()" class="login-form">
    <h1>Login</h1>
    <mat-form-field appearance="fill">
      @if(email.invalid && (email.dirty || email.touched)){
        @if(email.errors?.['email']){<label class="error-message">Email is not valid</label>}
      }
    <mat-label>Email</mat-label>
    <input matInput placeholder="Enter your email" formControlName="email"/>
  </mat-form-field>
  <mat-form-field appearance="fill">
    <mat-label>Password</mat-label>
    <input matInput placeholder="Enter your password" formControlName="password" type="password"/>
  </mat-form-field>
  @if(errorMessage) {
    <div class="error-message">
      {{ errorMessage }}
    </div>
  }
  <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Login</button>
  <p style="align-content: center;margin-top:10px;">Don't have an account?
    <a [routerLink]="['/signup']">Sign up here</a>
  </p>
    </form>
  `,
  styles: `
  .login-form {
    max-width: 360px;
    margin: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }

  mat-form-field {
    width: 100%; 
    margin-bottom: 16px; 
  }

  button {
    width: 100%; 
    margin-top: 20px; 
  }

  .error-message {
    color: red;
    margin-top: 10px;
  }

  h1 {
    text-align: center;
    width: 100%;
    color: #1976d2; 
    margin-bottom: 20px;
  }
  `
})
export class LoginComponent {
  #auth = inject(AuthService);
  #router = inject(Router);
  errorMessage: string = '';

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  get email() { return this.form.get('email') as FormControl; }

  constructor() {
    if (this.#auth.is_logged_in()) {
      this.#router.navigate(['']);
    }
  }

  login() {
    this.#auth.login(this.form.value as { email: string, password: string })
      .subscribe({
        next: (response) => {
          this.errorMessage = '';
          // this.#auth.$state.set({
          //   id: response.data.user._id,
          //   username: response.data.user.username,
          //   email: response.data.user.email,
          //   token: response.data.jwt
          // });
          console.log("login successfully:", response);

          this.#router.navigate(['']);
        },
        error: (err) => {
          if (err.status === 401) {
            this.errorMessage = 'Invalid username or password.';
          } else {
            this.errorMessage = 'An error occurred. Please try again later.';
          }
          console.error('Login error:', err);
        }
      });
  }
}