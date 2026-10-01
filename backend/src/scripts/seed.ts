import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { CompanyPriority, Role } from '@prisma/client';

async function seed() {
    console.log('--- Wiping Existing Database Records ---');
    // Wipe join tables first to avoid foreign key constraint violations
    await prisma.studentCompanyShortlist.deleteMany();
    await prisma.interviewAssignment.deleteMany();
    await prisma.scheduleVersion.deleteMany();
    await prisma.companyRound.deleteMany();
    await prisma.companyCoordinator.deleteMany();
    await prisma.company.deleteMany();
    await prisma.student.deleteMany();
    await prisma.room.deleteMany();
    await prisma.panel.deleteMany();
    await prisma.user.deleteMany();
    await prisma.placementDrive.deleteMany();

    console.log('--- Starting Realistic PlacementOps Dataset Seeding ---');

    // Common password hash for all seed accounts: "password123"
    const commonPasswordHash = await bcrypt.hash('password123', 10);

    // 1. Create Core Administrative / Operations Users
    console.log('Creating Admin & Coordinator accounts...');

    await prisma.user.create({
        data: {
            email: 'admin@campus.edu',
            passwordHash: commonPasswordHash,
            role: Role.ADMIN,
        },
    });

    await prisma.user.create({
        data: {
            email: 'coordinator@campus.edu',
            passwordHash: commonPasswordHash,
            role: Role.COORDINATOR,
        },
    });

    console.log('Created admin@campus.edu and coordinator@campus.edu accounts.');

    // 2. Create Placement Drive
    const drive = await prisma.placementDrive.create({
        data: {
            name: '2026 Campus Placement Drive',
            academicYear: '2025-2026',
            startDate: new Date('2026-10-01T09:00:00Z'),
            endDate: new Date('2026-10-05T18:00:00Z'),
        },
    });

    console.log(`Created Drive: ${drive.name} (${drive.id})`);

    // 3. Create Rooms (20 Rooms)
    const roomPromises = [];
    for (let i = 1; i <= 20; i++) {
        roomPromises.push(
            prisma.room.create({
                data: {
                    placementDriveId: drive.id,
                    name: `Room-${100 + i}`,
                    capacity: 4,
                },
            })
        );
    }
    const rooms = await Promise.all(roomPromises);
    console.log(`Created ${rooms.length} Rooms.`);

    // 4. Create Panels (15 Panels)
    const panelPromises = [];
    for (let i = 1; i <= 15; i++) {
        panelPromises.push(
            prisma.panel.create({
                data: {
                    placementDriveId: drive.id,
                    name: `Panel-${i}`,
                    specialization: i % 2 === 0 ? 'Technical / System Design' : 'HR & Culture Fit',
                },
            })
        );
    }
    const panels = await Promise.all(panelPromises);
    console.log(`Created ${panels.length} Panels.`);

    // 5. Create Companies (~35 Companies)
    const companyNames = [
        'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta',
        'Goldman Sachs', 'JPMorgan', 'Morgan Stanley', 'Uber', 'Salesforce',
        'Adobe', 'Atlassian', 'Oracle', 'Cisco', 'Intel',
        'Nvidia', 'Qualcomm', 'AMD', 'IBM', 'PayPal',
        'Stripe', 'Twilio', 'Snowflake', 'Databricks', 'MongoDB',
        'Infosys', 'TCS', 'Wipro', 'Accenture', 'Cognizant',
        'Capgemini', 'HCL Tech', 'Tech Mahindra', 'LTI Mindtree', 'Deloitte'
    ];

    const branches = ['CSE', 'ECE', 'EEE', 'MECH'];
    const companies = [];

    for (let i = 0; i < companyNames.length; i++) {
        const priority = i < 5 ? CompanyPriority.HIGH : i < 20 ? CompanyPriority.MEDIUM : CompanyPriority.LOW;
        const minCgpa = i < 10 ? 8.5 : i < 25 ? 7.5 : 6.0;

        const company = await prisma.company.create({
            data: {
                placementDriveId: drive.id,
                name: companyNames[i],
                priority,
                minimumCgpa: minCgpa,
                eligibleBranches: i < 15 ? ['CSE', 'ECE'] : branches,
                expectedArrival: new Date('2026-10-01T09:00:00Z'),
                expectedDeparture: new Date('2026-10-04T18:00:00Z'),
                rounds: {
                    create: [
                        { name: 'Technical Round 1', sequenceOrder: 1, durationMinutes: 45, requiredPanelCount: 1 },
                        { name: 'HR Round', sequenceOrder: 2, durationMinutes: 30, requiredPanelCount: 1 },
                    ],
                },
            },
        });
        companies.push(company);
    }
    console.log(`Created ${companies.length} Companies with rounds.`);

    // 6. Seed Students (~800 Students)
    console.log('Generating ~800 Student accounts and profiles...');
    const studentIds: string[] = [];

    for (let i = 1; i <= 800; i++) {
        const branch = branches[i % branches.length];
        const cgpa = parseFloat((6.0 + (i % 41) * 0.1).toFixed(2));

        const user = await prisma.user.create({
            data: {
                email: `student${i}@campus.edu`,
                passwordHash: commonPasswordHash,
                role: Role.STUDENT,
                student: {
                    create: {
                        name: `Candidate ${i}`,
                        rollNumber: `CS2026-${1000 + i}`,
                        branch,
                        cgpa,
                        graduationYear: 2026,
                    },
                },
            },
            include: { student: true },
        });

        if (user.student) {
            studentIds.push(user.student.id);
        }
    }
    console.log(`Created ${studentIds.length} Student profiles.`);

    // 7. Create Shortlist Links
    console.log('Building shortlist relationships...');
    let shortlistCount = 0;

    for (const company of companies) {
        const eligibleStudents = await prisma.student.findMany({
            where: {
                cgpa: { gte: company.minimumCgpa },
                ...(company.eligibleBranches.length > 0 ? { branch: { in: company.eligibleBranches } } : {}),
            },
            take: 40,
        });

        for (const st of eligibleStudents) {
            await prisma.studentCompanyShortlist.create({
                data: {
                    studentId: st.id,
                    companyId: company.id,
                },
            });
            shortlistCount++;
        }
    }

    console.log(`Generated ${shortlistCount} Shortlist links.`);
    console.log('--- Seeding Completed Successfully ---');
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });