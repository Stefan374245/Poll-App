import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { HeroComponent } from '../hero/hero';
import { YourSurveysComponent } from '../your-surveys/your-surveys';
import { SurveyDataService } from '../../core/services/survey/survey-data.service';

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
export class HomeComponent implements OnInit {
  private readonly surveyDataService = inject(SurveyDataService);

  async ngOnInit(): Promise<void> {
    console.log('🏠 Home component initialized, loading surveys...');
    await this.surveyDataService.loadAllSurveys();
  }
}
