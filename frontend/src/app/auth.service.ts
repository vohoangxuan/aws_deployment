import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { StandardResponse, User } from '../../data.type';
import { tap, from, switchMap } from 'rxjs';
import { ConfigService } from './config.service';  // Import ConfigService

interface SignInResponse {
  success: boolean;
  data: {
    jwt: string;  // JWT token
    user: {
      _id: string;
      username: string;
      email: string;
    }
  }
}

export interface State {
  id: string,
  username: string,
  email: string,
  token: string
}

export const initial_state = {
  id: "",
  username: '',
  email: '',
  token: ''
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  #http = inject(HttpClient);
  #configService = inject(ConfigService);  // Inject ConfigService to load API URLs
  $state = signal<State>(this.loadStateFromLocalStorage());
  private loginApiUrl = '';   // To store the login API URL
  private signupApiUrl = '';  // To store the signup API URL

  constructor() {
    effect(() => {
      localStorage.setItem('DUMMY_STATE', JSON.stringify(this.$state()));
    });
  }

  loadStateFromLocalStorage(): State {
    const stateJson = localStorage.getItem('DUMMY_STATE');
    return stateJson ? JSON.parse(stateJson) : initial_state;  // Load state or use initial state if not found
  }

  login(credential: { email: string, password: string }) {
    return from(this.#configService.loadConfig()).pipe(
      switchMap(() => {
        const loginApiUrl = this.#configService.getLoginApiUrl();  // Use the dynamically loaded login API URL
        return this.#http.post<SignInResponse>(loginApiUrl, credential).pipe(
          tap((response) => {
            if (response.success) {
              // Update the state after a successful login
              this.$state.set({
                id: response.data.user._id,
                username: response.data.user.username,
                email: response.data.user.email,
                token: response.data.jwt
              });
            }
          })
        );
      })
    );
  }


  is_logged_in() {
    return this.$state().token ? true : false;
  }

  signup(data: User) {
    return from(this.#configService.loadConfig()).pipe(
      switchMap(() => {
        const signupApiUrl = this.#configService.getSignupApiUrl();  // Use the dynamically loaded signup API URL
        return this.#http.post<StandardResponse<string>>(signupApiUrl, data);  // Return the Observable from HTTP request
      })
    );
  }


  getUserEmail() {
    return this.$state().email;  // Method to get user's email
  }

  getGuestUserId(): string {
    let userId = localStorage.getItem('GUEST_USER_ID');
    if (!userId) {
      userId = this.generateUniqueId();
      localStorage.setItem('GUEST_USER_ID', userId);
    }
    return userId;
  }

  private generateUniqueId(): string {
    return 'guest_' + Math.random().toString(36).slice(2, 11);
  }
}
