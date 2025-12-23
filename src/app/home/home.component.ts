import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  username: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.username = this.authService.getCurrentUser();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToPatients() {
    this.router.navigate(['/patients']);
  }

  navigateToAppointments() {
    this.router.navigate(['/appointments']);
  }

  navigateToMedicines() {
    this.router.navigate(['/medicines']);
  }
}
