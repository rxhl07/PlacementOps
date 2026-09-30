import { apiClient } from './apiClient';
import { ApiResponse, ScheduleDiff, DisruptionType } from '../types/domain';

export interface ReplanResponse {
    disruptionId: string;
    oldVersionNumber: number;
    newVersionNumber: number;
    summary: Record<string, unknown>;
    diffs: ScheduleDiff[];
}

export const replansApi = {
    triggerReplan: async (payload: {
        placementDriveId: string;
        type: DisruptionType;
        description: string;
        companyId?: string;
        panelId?: string;
        roomId?: string;
        studentId?: string;
        delayMinutes?: number;
    }) => {
        const res = await apiClient.post<ApiResponse<ReplanResponse>>('/replans', payload);
        return res.data.data!;
    },
    getDiff: async (newVersionId: string) => {
        const res = await apiClient.get<ApiResponse<ScheduleDiff[]>>(`/replans/diff/${newVersionId}`);
        return res.data.data!;
    },
};