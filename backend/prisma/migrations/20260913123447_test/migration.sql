-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COORDINATOR', 'COMPANY_COORDINATOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CompanyPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('INTERVIEW', 'GROUP_DISCUSSION', 'APTITUDE', 'WAITING');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisruptionType" AS ENUM ('COMPANY_DELAY', 'PANEL_UNAVAILABLE', 'STUDENT_WITHDRAWAL', 'ROOM_UNAVAILABLE');

-- CreateEnum
CREATE TYPE "ScheduleChangeType" AS ENUM ('MOVED', 'CANCELLED', 'ADDED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_drives" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "academic_year" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "roll_number" VARCHAR(100) NOT NULL,
    "branch" VARCHAR(100) NOT NULL,
    "cgpa" DECIMAL(4,2) NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "placement_drive_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "priority" "CompanyPriority" NOT NULL DEFAULT 'MEDIUM',
    "minimum_cgpa" DECIMAL(4,2) NOT NULL DEFAULT 0.0,
    "eligible_branches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expected_arrival" TIMESTAMP(3) NOT NULL,
    "expected_departure" TIMESTAMP(3) NOT NULL,
    "actual_arrival" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_coordinators" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_coordinators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_rounds" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "required_panel_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_company_shortlists" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "shortlisted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_company_shortlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "placement_drive_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "RoomType" NOT NULL DEFAULT 'INTERVIEW',
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_availabilities" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "room_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panels" (
    "id" UUID NOT NULL,
    "placement_drive_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "specialization" VARCHAR(255),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panel_availabilities" (
    "id" UUID NOT NULL,
    "panel_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "panel_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_versions" (
    "id" UUID NOT NULL,
    "placement_drive_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "trigger_reason" VARCHAR(255) NOT NULL,
    "disruption_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_assignments" (
    "id" UUID NOT NULL,
    "schedule_version_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "panel_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disruptions" (
    "id" UUID NOT NULL,
    "placement_drive_id" UUID NOT NULL,
    "type" "DisruptionType" NOT NULL,
    "description" TEXT NOT NULL,
    "company_id" UUID,
    "panel_id" UUID,
    "room_id" UUID,
    "student_id" UUID,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disruptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_diffs" (
    "id" UUID NOT NULL,
    "old_schedule_version_id" UUID NOT NULL,
    "new_schedule_version_id" UUID NOT NULL,
    "change_type" "ScheduleChangeType" NOT NULL,
    "assignment_id" UUID NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_diffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "reason" VARCHAR(255),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_roll_number_key" ON "students"("roll_number");

-- CreateIndex
CREATE INDEX "students_branch_cgpa_idx" ON "students"("branch", "cgpa");

-- CreateIndex
CREATE INDEX "companies_placement_drive_id_idx" ON "companies"("placement_drive_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_coordinators_user_id_key" ON "company_coordinators"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_rounds_company_id_sequence_order_key" ON "company_rounds"("company_id", "sequence_order");

-- CreateIndex
CREATE UNIQUE INDEX "student_company_shortlists_student_id_company_id_key" ON "student_company_shortlists"("student_id", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_placement_drive_id_name_key" ON "rooms"("placement_drive_id", "name");

-- CreateIndex
CREATE INDEX "room_availabilities_room_id_start_time_end_time_idx" ON "room_availabilities"("room_id", "start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "panels_placement_drive_id_name_key" ON "panels"("placement_drive_id", "name");

-- CreateIndex
CREATE INDEX "panel_availabilities_panel_id_start_time_end_time_idx" ON "panel_availabilities"("panel_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "schedule_versions_placement_drive_id_is_current_idx" ON "schedule_versions"("placement_drive_id", "is_current");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_versions_placement_drive_id_version_number_key" ON "schedule_versions"("placement_drive_id", "version_number");

-- CreateIndex
CREATE INDEX "interview_assignments_schedule_version_id_idx" ON "interview_assignments"("schedule_version_id");

-- CreateIndex
CREATE INDEX "interview_assignments_schedule_version_id_student_id_start__idx" ON "interview_assignments"("schedule_version_id", "student_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "interview_assignments_schedule_version_id_room_id_start_tim_idx" ON "interview_assignments"("schedule_version_id", "room_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "interview_assignments_schedule_version_id_panel_id_start_ti_idx" ON "interview_assignments"("schedule_version_id", "panel_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "schedule_diffs_old_schedule_version_id_new_schedule_version_idx" ON "schedule_diffs"("old_schedule_version_id", "new_schedule_version_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_placement_drive_id_fkey" FOREIGN KEY ("placement_drive_id") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_coordinators" ADD CONSTRAINT "company_coordinators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_coordinators" ADD CONSTRAINT "company_coordinators_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_rounds" ADD CONSTRAINT "company_rounds_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_company_shortlists" ADD CONSTRAINT "student_company_shortlists_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_company_shortlists" ADD CONSTRAINT "student_company_shortlists_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_placement_drive_id_fkey" FOREIGN KEY ("placement_drive_id") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_availabilities" ADD CONSTRAINT "room_availabilities_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panels" ADD CONSTRAINT "panels_placement_drive_id_fkey" FOREIGN KEY ("placement_drive_id") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panel_availabilities" ADD CONSTRAINT "panel_availabilities_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "panels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_versions" ADD CONSTRAINT "schedule_versions_placement_drive_id_fkey" FOREIGN KEY ("placement_drive_id") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_versions" ADD CONSTRAINT "schedule_versions_disruption_id_fkey" FOREIGN KEY ("disruption_id") REFERENCES "disruptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_assignments" ADD CONSTRAINT "interview_assignments_schedule_version_id_fkey" FOREIGN KEY ("schedule_version_id") REFERENCES "schedule_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_assignments" ADD CONSTRAINT "interview_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_assignments" ADD CONSTRAINT "interview_assignments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_assignments" ADD CONSTRAINT "interview_assignments_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "company_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_assignments" ADD CONSTRAINT "interview_assignments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_assignments" ADD CONSTRAINT "interview_assignments_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "panels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disruptions" ADD CONSTRAINT "disruptions_placement_drive_id_fkey" FOREIGN KEY ("placement_drive_id") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disruptions" ADD CONSTRAINT "disruptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disruptions" ADD CONSTRAINT "disruptions_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "panels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disruptions" ADD CONSTRAINT "disruptions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disruptions" ADD CONSTRAINT "disruptions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_diffs" ADD CONSTRAINT "schedule_diffs_old_schedule_version_id_fkey" FOREIGN KEY ("old_schedule_version_id") REFERENCES "schedule_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_diffs" ADD CONSTRAINT "schedule_diffs_new_schedule_version_id_fkey" FOREIGN KEY ("new_schedule_version_id") REFERENCES "schedule_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
