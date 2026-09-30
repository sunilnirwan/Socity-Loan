import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map } from 'rxjs';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { firestoreDb } from '../firebase/firebase.config';
import { listenAsUser } from '../firebase/live-query';
import { AuthService } from './auth.service';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private auth = inject(AuthService);
  private transactions$ = new BehaviorSubject<Transaction[]>([]);
  private isLoaded$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initTransactionsListener();
  }

  private initTransactionsListener(): void {
    const txnCol = collection(firestoreDb, 'transactions');
    listenAsUser(this.auth, u => u.role === 'admin' ? txnCol : query(txnCol, where('userUid', '==', u.uid)), (docs) => {
      const list: Transaction[] = [];
      docs.forEach(docSnap => {
        const d = docSnap.data()!;
        list.push({
          id: docSnap.id,
          transactionId: d['transactionId'] || docSnap.id.slice(0, 8).toUpperCase(),
          userId: d['userId'] || '',
          userUid: d['userUid'] || '',
          userName: d['userName'] || '',
          type: d['type'] || 'credit',
          category: d['category'] || d['type'] || 'general',
          amount: d['amount'] || 0,
          description: d['description'] || '',
          date: d['date'] || (d['createdAt']?.toDate?.() ? d['createdAt'].toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          referenceId: d['referenceId'] || '',
          balanceAfter: d['balanceAfter'],
          createdAt: d['createdAt']
        });
      });

      // Sort by creation date descending
      list.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateB.localeCompare(dateA);
      });

      this.transactions$.next(list);
      this.isLoaded$.next(true);
    });
  }

  getTransactions$(): Observable<Transaction[]> {
    return this.transactions$.asObservable();
  }

  getTransactions(): Transaction[] {
    return this.transactions$.value;
  }

  getUserTransactions$(userIdOrUid: string): Observable<Transaction[]> {
    const clean = userIdOrUid.trim().toUpperCase();
    return this.transactions$.pipe(
      map(txns => txns.filter(t => t.userId.toUpperCase() === clean || t.userUid === userIdOrUid))
    );
  }

  getUserTransactions(userIdOrUid: string): Transaction[] {
    const clean = userIdOrUid.trim().toUpperCase();
    return this.transactions$.value.filter(t => t.userId.toUpperCase() === clean || t.userUid === userIdOrUid);
  }

  async addTransaction(txnData: Omit<Transaction, 'id' | 'transactionId'>): Promise<Transaction> {
    const today = txnData.date || new Date().toISOString().split('T')[0];
    const generatedId = `TXN${Date.now().toString().slice(-6)}`;

    const newDoc = await addDoc(collection(firestoreDb, 'transactions'), {
      ...txnData,
      transactionId: generatedId,
      date: today,
      createdAt: serverTimestamp()
    });

    return {
      ...txnData,
      id: newDoc.id,
      transactionId: generatedId
    };
  }
}
