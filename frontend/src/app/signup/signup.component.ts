import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { delay, of } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { User } from '../../../data.type';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterModule],
  template: `
    <form [formGroup]="signup_form" (ngSubmit)="submit()" class="signup-form">
        <mat-form-field appearance="fill">
          <mat-label>Name</mat-label>
          <input matInput placeholder="Enter your name" formControlName="name"/>
        </mat-form-field>
        @if(email.invalid && (email.dirty || email.touched)){
            @if(email.errors?.['email']){<label class="err_msg">Email is not valid</label>}
        }
        <mat-form-field appearance="fill">        
          <mat-label>Email</mat-label>
          <input matInput placeholder="Enter your email" formControlName="email"/>
        </mat-form-field>
      
        @if(password.invalid && (password.dirty || password.touched)){
            @if(password.errors?.['minlength']){<label class="err_msg">Password must be greater than 6</label>}
        }
        <mat-form-field appearance="fill">
          <mat-label>Password</mat-label>
          <input matInput placeholder="Enter password" formControlName="password" type="password"/>
        </mat-form-field>
      
        @if(confirm_password.invalid && (confirm_password.dirty || confirm_password.touched)){
            @if(confirm_password.errors?.['passwordMismatch']){<label class="err_msg">Not match with password</label>}
        }
        <mat-form-field appearance="fill">
          <mat-label>Confirm Password</mat-label>
          <input matInput placeholder="Enter confirm password" formControlName="confirm_password" type="password"/>
        </mat-form-field>
      <button mat-raised-button color="primary" type="submit" [disabled]="signup_form.invalid">Signup</button><br>
      <p style="align-content: center;">Already have account? <a [routerLink]="['../login']">Login</a></p>
    </form>
    <!-- @if(form.errors?.['passwordMismatch']){<div>Confirm Password is not valid</div>} -->
  `,
  styles: `
  .signup-form {
    max-width: 360px;
    margin: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }

  mat-form-field {
    width: 100%;
    margin-bottom: 10px;
  }

  button {
    width: 100%;
    margin-top: 10px;
  }

  .err_msg{
    color: red;
  }
  `
})


export class SignupComponent {

  #signup_service = inject(AuthService);
  #router = inject(Router);

  // data binding
  signup_form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email], this.checkEmailExist],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', [Validators.required, this.confirmPasswordValidator]],
  },
    // {validators: this.confirmPasswordValidator}
  );

  get name() { return this.signup_form.get('name') as FormControl; }
  get email() { return this.signup_form.get('email') as FormControl; }
  get password() { return this.signup_form.get('password') as FormControl; }
  get confirm_password() { return this.signup_form.get('confirm_password') as FormControl; }

  constructor() {
  }

  submit() {
    console.log(this.signup_form.value);
    const user_info = {
      name: this.signup_form.get('name')?.value,
      email: this.signup_form.get('email')?.value,
      password: this.signup_form.get('password')?.value,
    };

    console.log(user_info);
    this.#signup_service.signup(user_info as User).subscribe(response => {
      console.log(response);
      if (response.success) {
        this.#router.navigate(['login']);
      } else {
        console.log(response.data);
      }
    });
  }

  // Custom validator function *** null == good && {errorMessage: true}  == bad
  confirmPasswordValidator(control: AbstractControl) {

    return control.root.get('password')?.value !== control.root.get('confirm_password')?.value ? { passwordMismatch: true } : null; // Get the password control

  };

  checkEmailExist(control: AbstractControl) {
    return of(null).pipe(delay(5000))
  }
}
