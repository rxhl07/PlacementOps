import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { CompanyPriority, Role } from '@prisma/client';

async function seed() {
    console.log('--- Starting Realistic PlacementOps Dataset Seeding ---');

    // 1. Create Placement Drive
    const drive = await prisma.placementDrive.create({
        data: {
            name: '2026 Campus Placement Drive',
            academicYear: '2025-2026',
            startDate: new Date('2026-10-01T09:00:00Z'),
            endDate: new Date('2026-10-05T18:00:00Z'),
        },
    });

    console.log(`Created Drive: ${drive.name} (${drive.id})`);

    // 2. Create Rooms (20 Rooms)
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

    // 3. Create Panels (15 Panels)
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

    // 4. Create Companies (~35 Companies)
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

    // 5. Seed Students (~800 Students)
    console.log('Generating ~800 Student accounts and profiles...');
    const passwordHash = await bcrypt.hash('student123', 10);
    const studentIds: string[] = [];

    for (let i = 1; i <= 800; i++) {
        const branch = branches[i % branches.length];
        const cgpa = parseFloat((6.0 + (i % 41) * 0.1).toFixed(2)); // CGPA ranges 6.00 to 10.00

        const user = await prisma.user.create({
            data: {
                email: `student${i}@campus.edu`,
                passwordHash,
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

    // 6. Create Overlapping Shortlists
    console.log('Building shortlist relationships...');
    let shortlistCount = 0;

    for (const company of companies) {
        // Fetch students eligible for this company based on CGPA and Branch
        const eligibleStudents = await prisma.student.findMany({
            where: {
                cgpa: { gte: company.minimumCgpa },
                ...(company.eligibleBranches.length > 0 ? { branch: { in: company.eligibleBranches } } : {}),
            },
            take: 40, // Limit to 40 candidates per company shortlist
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