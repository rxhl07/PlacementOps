export enum Role {
    ADMIN = 'ADMIN',
    COORDINATOR = 'COORDINATOR',
    COMPANY_COORDINATOR = 'COMPANY_COORDINATOR',
    STUDENT = 'STUDENT',
}

export enum StudentStatus {
    ACTIVE = 'ACTIVE',
    WITHDRAWN = 'WITHDRAWN',
}

export enum CompanyPriority {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}

export enum RoomType {
    INTERVIEW = 'INTERVIEW',
    GROUP_DISCUSSION = 'GROUP_DISCUSSION',
    APTITUDE = 'APTITUDE',
    WAITING = 'WAITING',
}

export enum AssignmentStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum DisruptionType {
    COMPANY_DELAY = 'COMPANY_DELAY',
    PANEL_UNAVAILABLE = 'PANEL_UNAVAILABLE',
    STUDENT_WITHDRAWAL = 'STUDENT_WITHDRAWAL',
    ROOM_UNAVAILABLE = 'ROOM_UNAVAILABLE',
}

export enum ScheduleChangeType {
    MOVED = 'MOVED',
    CANCELLED = 'CANCELLED',
    ADDED = 'ADDED',
}

export interface User {
    id: string;
    email: string;
    role: Role;
    student?: Student;
    companyCoordinator?: CompanyCoordinator;
}

export interface Student {
    id: string;
    userId: string;
    name: string;
    rollNumber: string;
    branch: string;
    cgpa: number;
    graduationYear: number;
    status: StudentStatus;
}

export interface Company {
    id: string;
    placementDriveId: string;
    name: string;
    priority: CompanyPriority;
    minimumCgpa: number;
    eligibleBranches: string[];
    expectedArrival: string;
    expectedDeparture: string;
    actualArrival?: string;
    rounds?: CompanyRound[];
}

export interface CompanyRound {
    id: string;
    companyId: string;
    name: string;
    sequenceOrder: number;
    durationMinutes: number;
    requiredPanelCount: number;
}

export interface CompanyCoordinator {
    id: string;
    userId: string;
    companyId: string;
    name: string;
    phone?: string;
}

export interface PlacementDrive {
    id: string;
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    _count?: {
        companies: number;
        rooms: number;
        panels: number;
    };
}

export interface Room {
    id: string;
    placementDriveId: string;
    name: string;
    type: RoomType;
    capacity: number;
    isAvailable: boolean;
}

export interface Panel {
    id: string;
    placementDriveId: string;
    name: string;
    specialization?: string;
    isAvailable: boolean;
}

export interface InterviewAssignment {
    id: string;
    scheduleVersionId: string;
    studentId: string;
    companyId: string;
    roundId: string;
    roomId: string;
    panelId: string;
    startTime: string;
    endTime: string;
    status: AssignmentStatus;
    student: Student;
    company: Company;
    round: CompanyRound;
    room: Room;
    panel: Panel;
}

export interface ScheduleVersion {
    id: string;
    placementDriveId: string;
    versionNumber: number;
    isCurrent: boolean;
    triggerReason: string;
    createdAt: string;
    assignments?: InterviewAssignment[];
}

export interface ScheduleDiff {
    id: string;
    oldScheduleVersionId: string;
    newScheduleVersionId: string;
    changeType: ScheduleChangeType;
    assignmentId: string;
    details: {
        studentName?: string;
        companyName?: string;
        oldTime?: { start: string; end: string };
        newTime?: { start: string; end: string };
        oldRoom?: string;
        newRoom?: string;
        reason?: string;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error?: {
        message: string;
        code?: string;
    } | null;
}