export type TicketStatus = 'open' | 'closed' | 'pending';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface ChatMessage {
    id: number;
    ticket_id: number;
    sender_id: number;
    message: string;
    is_read: boolean;
    created_at: string;
    updated_at: string;
    sender?: {
        id: number;
        name: string;
    };
}

export interface Ticket {
    id: number;
    user_id: number;
    tenant_id?: number;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    last_message_at: string;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    tenant?: {
        id: number;
        name: string;
    };
    messages?: ChatMessage[];
}

export interface TicketResponse {
    success: boolean;
    data: Ticket[];
    message?: string;
}

export interface SingleTicketResponse {
    success: boolean;
    data: Ticket;
}
