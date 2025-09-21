import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  imports: [],
  templateUrl: './loading.html',
  styleUrl: './loading.scss'
})
export class Loading {
  @Input() text: string = "Chargement en cours ..."
}
