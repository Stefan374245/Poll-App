import { Component, OnInit, HostBinding } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header';
import { RouteData } from '../../app.routes';

/**
 * Main layout wrapper with header and body background control.
 * Controls header visibility and body background via RouteData.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent implements OnInit {
  hideHeader = false;

  @HostBinding('class.white-bg') whiteBg = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Check initial route
    this.updateLayoutFromRoute();

    // Update on route changes
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateLayoutFromRoute();
      });
  }

  /**
   * Updates layout configuration from active route data
   */
  private updateLayoutFromRoute(): void {
    let route = this.activatedRoute.firstChild;
    while (route?.firstChild) {
      route = route.firstChild;
    }

    const data = route?.snapshot.data as RouteData | undefined;
    this.hideHeader = data?.hideHeader ?? false;
    this.whiteBg = data?.bodyBgWhite ?? false;
  }
}
