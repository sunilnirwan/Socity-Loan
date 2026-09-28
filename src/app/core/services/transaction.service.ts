import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private storage = inject(LocalStorageService);

  getTransactions$(): Observable<Transaction[]> {
    return this.storage.getTransactions$();
  }

  getTransactions(): Transaction[] {
    return this.storage.getTransactions();
  }

  getUserTransactions$(userId: string): Observable<Transaction[]> {
    return this.storage.getTransactions$().pipe(
      map(txns => txns.filter(t => t.userId.toUpperCase() === userId.toUpperCase()))
    );
  }

  getUserTransactions(userId: string): Transaction[] {
    return this.storage.getTransactions().filter(t => t.userId.toUpperCase() === userId.toUpperCase());
  }

  addTransaction(txnData: Omit<Transaction, 'id' | 'transactionId'>): Transaction {
    const txns = this.storage.getTransactions();
    const nextId = txns.length > 0 ? Math.max(...txns.map(t => t.id || 0)) + 1 : 1;
    const txnId = `TXN${nextId.toString().padStart(4, '0')}`;

    const newTxn: Transaction = {
      ...txnData,
      id: nextId,
      transactionId: txnId
    };

    this.storage.saveTransactions([newTxn, ...txns]);
    return newTxn;
  }
}
