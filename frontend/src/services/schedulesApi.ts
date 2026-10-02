import { apiClient } from './apiClient';

export const schedulesApi = {
    // ... existing methods
    generateSchedule: async (placementDriveId: string) => {
        const response = await apiClient.post(
            `/schedules/generate/${placementDriveId}`,
            {},
            { timeout: 0 } // Increased to 60 seconds for solver execution
        );
        return response.data;
    },
    getActiveSchedule: async (placementDriveId: string) => {
        const response = await apiClient.get(`/schedules/active/${placementDriveId}`);
        return response.data;
    },
};