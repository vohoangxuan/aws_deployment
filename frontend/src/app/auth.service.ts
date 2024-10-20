import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { StandardResponse, User } from '../../data.type';
import { tap } from 'rxjs/operators';

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
  // $state = signal<State>(initial_state);
  $state = signal<State>(this.loadStateFromLocalStorage());


  loadStateFromLocalStorage(): State {
    const stateJson = localStorage.getItem('DUMMY_STATE');
    return stateJson ? JSON.parse(stateJson) : initial_state;  // Load state or use initial state if not found
  }

  login(credential: { email: string, password: string }) {
    return this.#http.post<SignInResponse>(
      'https://slx20f36ie.execute-api.us-east-1.amazonaws.com/prod/login',
      credential
    ).pipe(
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
  }

  is_logged_in() {
    return this.$state().token ? true : false;
  }

  signup(data: User) {
    return this.#http.post<StandardResponse<string>>(
      "https://slx20f36ie.execute-api.us-east-1.amazonaws.com/prod/signup"
      , data);
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
  constructor() {
    effect(() => {
      localStorage.setItem('DUMMY_STATE', JSON.stringify(this.$state()));
    }

    );
  }
}
