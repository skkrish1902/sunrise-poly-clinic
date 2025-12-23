import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;
  private apiUrl = 'http://localhost:3000/api/login';
  private currentUser: string = '';

  constructor(private http: HttpClient) {
    // Check if user is already logged in from localStorage
    const loggedIn = localStorage.getItem('isLoggedIn');
    const username = localStorage.getItem('username');
    this.isAuthenticated = loggedIn === 'true';
    this.currentUser = username || '';
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, { username, password });
  }

  setAuthenticated(username: string): void {
    this.isAuthenticated = true;
    this.currentUser = username;
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
  }

  logout(): void {
    this.isAuthenticated = false;
    this.currentUser = '';
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getCurrentUser(): string {
    return this.currentUser;
  }
}
