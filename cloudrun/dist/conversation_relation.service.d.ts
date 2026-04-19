import { BotContext } from './bot_context';
export declare class ConversationRelationService {
    botContext: BotContext;
    constructor(botContext: BotContext);
    createConversationRelation({ conversationRelationEntity }: {
        conversationRelationEntity: ConversationRelationEntity;
    }): Promise<string | null>;
    updateConversationRelationTitle({ botId, conversationId, title }: {
        botId: string;
        conversationId: string;
        title: string;
    }): Promise<any>;
    deleteConversationRelationByID({ botId, conversationId }: {
        botId: string;
        conversationId: string;
    }): Promise<any>;
    describeConversationRelation({ botId, pageSize, pageNumber, filterAndOptions }: {
        botId: string;
        pageSize?: number;
        pageNumber?: number;
        filterAndOptions?: unknown[];
    }): Promise<[ConversationRelationEntity[] | null, number]>;
    setConversationsTitle({ conversationId, userMessage }: {
        conversationId: string;
        userMessage?: string;
    }): Promise<void>;
    transDataToChatEntity(item: ConversationRelationData): ConversationRelationEntity;
}
export interface ConversationRelationData {
    bot_id: string;
    user_id: string;
    conversation_id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
}
export declare class ConversationRelationEntity {
    botId: string;
    userId: string;
    conversationId: string;
    title: string;
    createdAt?: number;
    updatedAt?: number;
}
