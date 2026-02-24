import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BtnComponent } from '../../shared/components/btn/btn';

/**
 * Hero banner at the top of the home page.
 * Shows heading, subtext, CTA button, and phone illustration.
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, BtnComponent],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {}
