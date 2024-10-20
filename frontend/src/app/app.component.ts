import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService, initial_state } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, RouterLink, MatIconModule, MatButtonModule, MatMenuModule, ReactiveFormsModule],
  template: `
  <form [formGroup]="form">
    <mat-toolbar color="primary">
      <a [routerLink]="['']" style="margin-right: 8px;"><mat-icon class="white-icon">home</mat-icon></a>
      <span>Photo Sharing </span>
      @if(auth.is_logged_in()) {
        <span class="user-greeting">Hello, {{ auth.$state().username }}!</span>
      }
      <span class="spacer"></span>
      <div class="search-container">
        <input class="input" matInput placeholder="Search term" formControlName="search">
        <button mat-button (click)="clearSearch()">
          <mat-icon>search</mat-icon>
        </button>
      </div>
      <button mat-icon-button [matMenuTriggerFor]="menu">
        <mat-icon>apps</mat-icon>
      </button>
    </mat-toolbar>
  </form>

    <mat-menu #menu="matMenu">
      @if(!auth.$state().token){
        <button mat-menu-item routerLink="login">Login</button>
        <button mat-menu-item routerLink="signup">Signup</button>
      }

      @if(auth.$state().token){
        <button mat-menu-item routerLink="upload">Add Profile Picture</button>
        
        <button mat-menu-item (click)="logout()">Logout</button>
      }
    </mat-menu>
    
    <!-- <h1>Welcome to {{title}}!</h1> -->
      <!-- <a [routerLink]="['login']">Login</a>|
      <a [routerLink]="['list']">Home</a>|
      <a [routerLink]="['signup']">Signup</a> |
      <a [routerLink]="['ownList']">My Photos</a>  -->

    <router-outlet />
    <router-outlet></router-outlet>
  `,
  styles: `
    .mat-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px; /* Consistent padding */
    }
    .title {
      flex: 1;
      white-space: nowrap; /* Prevents the title from breaking into multiple lines */
    }

    .spacer {
      flex: 1;
    }

    .search-container {
      display: flex;
      flex-grow: 1; /* Allows the search container to grow */
      max-width: 300px; /* Max width to prevent overlap */
    }

    .input {
      width: 100%;
      border: 1px solid #ccc;
      border-radius: 20px;
      padding: 4px 10px;
    }
    .white-icon {
      color: white;
    }
    .user-greeting {
      margin-left: 20px;
      font-size: 0.9rem;
      color: #E0E0E0;
      font-style: italic;
    }

  @media (max-width: 600px) {
    .search-container {
      order: 3; 
      width: 100%; 
      margin-top: 10px; 
    }

    .user-greeting, .title {
      order: 2;
      text-align: center; 
      width: 100%; 
    }

    .mat-icon-button {
      order: 1;
    }

    .spacer, .title {
      display: none; 
    }
  }

  @media (max-width: 400px) {
    .search-container {
      order: 2; 
    }
  }
      `
})
export class AppComponent {

  form = inject(FormBuilder).nonNullable.group({
    search: ['']
  });

  auth = inject(AuthService);
  title = 'PhotoSharing_frontend';
  #router = inject(Router);

  logout() {
    this.auth.$state.set(initial_state);
    this.#router.navigate(['/']).then(() => {
      window.location.reload();
    });
  };

  clearSearch() {
    console.log("after search.........");
    this.#router.navigate(['/photos/search'], { queryParams: { search_title: this.form.value.search, size: 4, page_no: 1 } });
  }
}
