import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeroComponent } from '../hero/hero';
import { YourSurveysComponent } from '../your-surveys/your-surveys';

/**
 * Home page component.
 * Composes the hero banner and the "Your surveys" section.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, YourSurveysComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
