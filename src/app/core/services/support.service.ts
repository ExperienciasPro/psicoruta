import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface SupportTicketMessage {
  sender: 'user' | 'admin';
  message: string;
  date: string;
}

export interface SupportTicket {
  _id?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  subject: string;
  description: string;
  screenshot?: string;
  status: 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado';
  messages: SupportTicketMessage[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SupportService {
  private http = inject(HttpClient);
  private readonly API = '/api/support';

  getTickets(userId?: string): Observable<SupportTicket[]> {
    const params = userId ? `?userId=${userId}` : '';
    return this.http.get<SupportTicket[]>(`${this.API}/tickets${params}`);
  }

  getAllTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.API}/tickets`);
  }

  createTicket(data: Partial<SupportTicket>): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.API}/tickets`, data);
  }

  replyTicket(ticketId: string, sender: 'user' | 'admin', message: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.API}/tickets/${ticketId}/reply`, { sender, message });
  }

  updateStatus(ticketId: string, status: SupportTicket['status']): Observable<SupportTicket> {
    return this.http.patch<SupportTicket>(`${this.API}/tickets/${ticketId}`, { status });
  }
}
