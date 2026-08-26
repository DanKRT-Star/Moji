import api from "@/lib/axios";
import type { Call } from "@/types/call";

export const callService = {
    async getCallHistory(conversationId: string): Promise<Call[]> {
        const res = await api.get(`/calls/${conversationId}`);
        return res.data.calls;
    },
};