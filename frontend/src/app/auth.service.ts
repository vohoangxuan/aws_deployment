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
      profileImageURL?: string;
    }
  }
}

export interface State {
  id: string,
  username: string,
  email: string,
  token: string,
  profileImageURL?: string,
}

export const initial_state = {
  id: "",
  username: '',
  email: '',
  token: '',
  profileImageURL: ''
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
            console.log("Login response:", response);

            if (response.success) {
              // Update the state after a successful login
              this.$state.set({
                id: response.data.user._id,
                username: response.data.user.username,
                email: response.data.user.email,
                token: response.data.jwt,
                profileImageURL: response.data.user.profileImageURL || ''
              });
              console.log("Updated state with profile image URL:", this.$state());
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

  getProfileImageURL(): string | null {
    return this.$state().profileImageURL ?? null;
  }

  updateProfileImageURL(newUrl: string) {
    const currentState = this.$state();
    this.$state.set({
      ...currentState,
      profileImageURL: newUrl
    });
  }
}
