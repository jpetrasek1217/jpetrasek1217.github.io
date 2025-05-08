import { Component } from '@angular/core';
import { TrackTableComponent } from './track-table/track-table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TrackTableComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'track-type-change-mockup';
}
