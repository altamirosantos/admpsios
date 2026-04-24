import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import {
    N8nChatHistoryRecord,
    N8nChatHistoryService,
    ProfileOption
} from 'src/app/demo/service/n8n-chat-history.service';

type ChatMessageType = 'human' | 'ai' | 'system' | 'unknown';

interface ChatMessageViewModel {
    id: number | string | null;
    sessionId: string;
    userId: string;
    createdAt: string;
    createdAtDate: Date | null;
    messageType: ChatMessageType;
    content: string;
    rawMessage: string;
}

interface ChatSessionGroup {
    sessionId: string;
    sessionDisplayId: string;
    userId: string;
    startedAt: Date | null;
    messages: ChatMessageViewModel[];
}

@Component({
    selector: 'app-n8n-chat-histories-index',
    templateUrl: './n8n-chat-histories-index.component.html',
    styleUrl: './n8n-chat-histories-index.component.scss',
    providers: [MessageService]
})
export class N8nChatHistoriesIndexComponent implements OnInit {
    userOptions: { label: string; value: string | null }[] = [];
    chatMessages: ChatMessageViewModel[] = [];
    chatSessions: ChatSessionGroup[] = [];
    totalRecords = 0;
    pageIndex = 0;
    pageSize = 20;
    readonly pageSizeOptions = [20, 50, 100];

    selectedUserId: string | null = null;
    startDate: Date | null = null;
    endDate: Date | null = null;

    loading = false;

    constructor(
        private readonly messageService: MessageService,
        private readonly n8nChatHistoryService: N8nChatHistoryService
    ) {}

    ngOnInit(): void {
        void this.loadInitialData();
    }

    async loadInitialData(): Promise<void> {
        this.loading = true;

        try {
            const profiles = await this.n8nChatHistoryService.getProfiles();

            this.userOptions = [
                { label: 'Todos os usuários', value: null },
                ...profiles.map((profile) => ({
                    label: this.formatProfileLabel(profile),
                    value: profile.id
                }))
            ];

            await this.loadChatHistories();
        } catch (error) {
            console.error('Erro ao carregar histórico de chat:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar o histórico de chat.',
                life: 3000
            });
        } finally {
            this.loading = false;
        }
    }

    async applyFilters(): Promise<void> {
        if (this.startDate && this.endDate && this.startDate > this.endDate) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Filtro inválido',
                detail: 'A data inicial não pode ser maior que a data final.',
                life: 3000
            });
            return;
        }

        this.pageIndex = 0;

        await this.loadChatHistories();
    }

    async onPageChange(event: { page?: number; rows?: number }): Promise<void> {
        this.pageIndex = event.page ?? 0;
        this.pageSize = event.rows ?? this.pageSize;

        await this.loadChatHistories();
    }

    clearFilters(): void {
        this.selectedUserId = null;
        this.startDate = null;
        this.endDate = null;
        this.pageIndex = 0;
        void this.loadChatHistories();
    }

    get firstRecordIndex(): number {
        return this.totalRecords === 0 ? 0 : this.pageIndex * this.pageSize;
    }

    get currentPageReport(): string {
        if (this.totalRecords === 0) {
            return 'Nenhuma mensagem encontrada';
        }

        const first = this.firstRecordIndex + 1;
        const last = Math.min(this.firstRecordIndex + this.chatMessages.length, this.totalRecords);

        return `Exibindo ${first}-${last} de ${this.totalRecords} mensagens`;
    }

    private async loadChatHistories(): Promise<void> {
        this.loading = true;

        try {
            const response = await this.n8nChatHistoryService.getChatHistoriesPage({
                page: this.pageIndex,
                pageSize: this.pageSize
            }, {
                userId: this.selectedUserId,
                startDate: this.startDate,
                endDate: this.endDate
            });

            this.chatMessages = response.data.map((history) => this.mapToViewModel(history));
            this.chatSessions = this.groupMessagesBySession(this.chatMessages);
            this.totalRecords = response.total;
        } catch (error) {
            console.error('Erro ao filtrar histórico de chat:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível aplicar os filtros.',
                life: 3000
            });
        } finally {
            this.loading = false;
        }
    }

    getMessageTypeLabel(messageType: ChatMessageType): string {
        switch (messageType) {
            case 'human':
                return 'Usuário';
            case 'ai':
                return 'IA';
            case 'system':
                return 'Sistema';
            default:
                return 'Mensagem';
        }
    }

    trackByMessage(_: number, message: ChatMessageViewModel): number | string | null {
        return message.id;
    }

    trackBySession(_: number, session: ChatSessionGroup): string {
        return session.sessionId;
    }

    getSessionMessageCountLabel(totalMessages: number): string {
        return totalMessages === 1 ? '1 mensagem' : `${totalMessages} mensagens`;
    }

    private formatProfileLabel(profile: ProfileOption): string {
        const nome = profile.nome?.trim();
        const apelido = profile.apelido?.trim();

        if (nome && apelido) {
            return `${nome} (${apelido})`;
        }

        if (nome) {
            return nome;
        }

        if (apelido) {
            return apelido;
        }

        return profile.id;
    }

    private mapToViewModel(history: N8nChatHistoryRecord): ChatMessageViewModel {
        const parsedMessage = this.parseMessage(history.message);

        return {
            id: history.id ?? null,
            sessionId: history.session_id || 'Sem sessão',
            userId: history.user_id || 'Sem usuário',
            createdAt: history.created_at,
            createdAtDate: history.created_at ? new Date(history.created_at) : null,
            messageType: parsedMessage.type,
            content: parsedMessage.content,
            rawMessage: parsedMessage.rawMessage
        };
    }

    private groupMessagesBySession(messages: ChatMessageViewModel[]): ChatSessionGroup[] {
        const sessions = new Map<string, ChatSessionGroup>();

        for (const message of messages) {
            const existingSession = sessions.get(message.sessionId);

            if (existingSession) {
                existingSession.messages.push(message);
                continue;
            }

            sessions.set(message.sessionId, {
                sessionId: message.sessionId,
                sessionDisplayId: this.extractDisplaySessionId(message.sessionId),
                userId: message.userId,
                startedAt: message.createdAtDate,
                messages: [message]
            });
        }

        return Array.from(sessions.values());
    }

    private extractDisplaySessionId(sessionId: string): string {
        const separatorIndex = sessionId.indexOf('|');

        if (separatorIndex === -1) {
            return sessionId;
        }

        return sessionId.slice(separatorIndex + 1) || sessionId;
    }

    private parseMessage(message: unknown): { type: ChatMessageType; content: string; rawMessage: string } {
        const normalizedMessage = this.normalizeMessage(message);

        if (normalizedMessage && typeof normalizedMessage === 'object') {
            const messageType = this.normalizeMessageType((normalizedMessage as { type?: string }).type);
            const contentValue = (normalizedMessage as { content?: unknown }).content;

            return {
                type: messageType,
                content: this.extractContent(contentValue),
                rawMessage: JSON.stringify(normalizedMessage, null, 2)
            };
        }

        return {
            type: 'unknown',
            content: typeof normalizedMessage === 'string' ? normalizedMessage : 'Mensagem sem conteúdo legível.',
            rawMessage: typeof normalizedMessage === 'string' ? normalizedMessage : JSON.stringify(normalizedMessage, null, 2)
        };
    }

    private normalizeMessage(message: unknown): unknown {
        if (typeof message !== 'string') {
            return message;
        }

        try {
            return JSON.parse(message);
        } catch {
            return message;
        }
    }

    private normalizeMessageType(value?: string): ChatMessageType {
        if (value === 'human' || value === 'ai' || value === 'system') {
            return value;
        }

        return 'unknown';
    }

    private extractContent(content: unknown): string {
        if (typeof content === 'string') {
            return content;
        }

        if (Array.isArray(content)) {
            return content
                .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
                .join('\n');
        }

        if (content && typeof content === 'object') {
            return JSON.stringify(content, null, 2);
        }

        return 'Mensagem sem conteúdo.';
    }
}
