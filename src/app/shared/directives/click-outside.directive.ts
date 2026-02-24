import { Directive, ElementRef, output, OnInit, OnDestroy } from '@angular/core';

/**
 * Directive that emits when a click occurs outside the host element.
 * Useful for closing dropdowns and modals.
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective implements OnInit, OnDestroy {
  /** Emits when a click occurs outside. */
  appClickOutside = output<void>();

  private readonly listener = (event: Event): void => {
    this.handleClick(event);
  };

  constructor(private readonly elementRef: ElementRef) {}

  ngOnInit(): void {
    document.addEventListener('click', this.listener);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.listener);
  }

  private handleClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.appClickOutside.emit();
    }
  }
}
