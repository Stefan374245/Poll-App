import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services';
import { RouteData } from '../../app.routes';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu';

/**
 * App header with navigation and user actions.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, UserMenuComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent implements OnInit {
  readonly currentUser;
  showCreateButton = false;
  showWhiteHeader = false;
  buttonText = 'Create Survey';
  buttonRoute: string[] = ['/create'];

  constructor(
    readonly authService: AuthService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
  ) {
    this.currentUser = this.authService.currentUser;
  }

  /**
   * Returns the router link as array for type-safe navigation
   */
  get routerLink(): string[] {
    return this.buttonRoute;
  }

  ngOnInit(): void {
    this.updateHeaderFromRoute();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateHeaderFromRoute();
      });
  }

  /**
   * Updates header configuration based on current route data
   */
  private updateHeaderFromRoute(): void {
    const currentUrl = this.router.url;

    this.showCreateButton = currentUrl.startsWith('/survey/');

    let route = this.activatedRoute.firstChild;
    while (route?.firstChild) {
      route = route.firstChild;
    }

    const data = route?.snapshot.data as RouteData | undefined;
    this.showWhiteHeader = data?.showWhiteHeader ?? false;
  }
}
