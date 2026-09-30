import { apiClient } from './apiClient';
import { ApiResponse, ScheduleVersion } from '../types/domain';

export const schedulesApi = {
    getActiveSchedule: async (driveId: string) => {
        const res = await apiClient.get<ApiResponse<ScheduleVersion>>(`/schedules/active/${driveId}`);
        return res.data.data!;
    },
    generateSchedule: async (driveId: string) => {
        const res = await apiClient.post<ApiResponse<unknown>>(`/schedules/generate/${driveId}`);
        return res.data.data!;
    },
};