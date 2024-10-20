import { Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { SignupComponent } from './signup/signup.component';
import { AddComponent } from "./add.component";

export const routes: Routes = [
    { path: '', redirectTo: 'upload', pathMatch: 'full' },
    // { path: 'home', component: HomeComponent },
    { path: '', redirectTo: 'upload', pathMatch: 'full' },
    { path: 'login', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'upload', component: AddComponent },

    // {path: '**', component: OuchComponent}
];
