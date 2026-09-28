import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inrCurrency',
  standalone: true
})
export class InrCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, showSymbol: boolean = true): string {
    if (value === null || value === undefined || value === '') {
      return showSymbol ? '₹0' : '0';
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return showSymbol ? '₹0' : '0';
    }

    // Format using Indian Numbering System
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(num);

    return showSymbol ? `₹${formatted}` : formatted;
  }
}
