import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "users", "issues", "verifications", "votes", "departments", "missions", "mission_assignments", "badges", "trust_history", "predictions", "notifications", "ledger_entries", "volunteer_skills", "comments", "weather_alerts", "analytics" CASCADE;`);

  // 2. Create Badges
  console.log('Creating badges...');
  const badgesData = [
    {
      name: 'Road Guardian',
      description: 'Reported 5 or more genuine road issues (potholes, infrastructure).',
      icon: 'RoadIcon',
      xpRequired: 200,
    },
    {
      name: 'Water Warrior',
      description: 'Reported 5 or more genuine water leakage issues.',
      icon: 'DropletIcon',
      xpRequired: 200,
    },
    {
      name: 'Active Citizen',
      description: 'Completed 10 or more community verifications.',
      icon: 'ShieldCheckIcon',
      xpRequired: 150,
    },
    {
      name: 'Community Hero',
      description: 'Reached Level 5 with a trust score above 90.',
      icon: 'StarIcon',
      xpRequired: 1000,
    },
    {
      name: 'Weekly Hero',
      description: 'Completed 3 missions in a single week.',
      icon: 'CalendarIcon',
      xpRequired: 100,
    },
  ];

  const badges = [];
  for (const b of badgesData) {
    const badge = await prisma.badge.create({ data: b });
    badges.push(badge);
  }

  // 3. Create Departments
  console.log('Creating departments...');
  const deptsData = [
    { name: 'Roads & Infrastructure', category: 'POTHOLE', slaCritical: 24, slaHigh: 48, slaMedium: 72, slaLow: 168 },
    { name: 'Water & Sewage Board', category: 'WATER_LEAKAGE', slaCritical: 12, slaHigh: 24, slaMedium: 72, slaLow: 120 },
    { name: 'Sanitation Department', category: 'GARBAGE', slaCritical: 24, slaHigh: 48, slaMedium: 72, slaLow: 96 },
    { name: 'Electricity Board', category: 'STREETLIGHT', slaCritical: 4, slaHigh: 12, slaMedium: 24, slaLow: 72 },
  ];

  const depts: any = {};
  for (const d of deptsData) {
    // Map categories to Prisma's exact enum
    let catEnum: any = 'OTHER';
    if (d.category === 'POTHOLE') catEnum = 'POTHOLE';
    else if (d.category === 'WATER_LEAKAGE') catEnum = 'WATER_LEAKAGE';
    else if (d.category === 'GARBAGE') catEnum = 'GARBAGE';
    else if (d.category === 'STREETLIGHT') catEnum = 'STREETLIGHT';

    const dept = await prisma.department.create({
      data: {
        name: d.name,
        category: catEnum,
        slaCritical: d.slaCritical,
        slaHigh: d.slaHigh,
        slaMedium: d.slaMedium,
        slaLow: d.slaLow,
      },
    });
    depts[d.category] = dept;
  }

  // 4. Create Users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@hero.city',
      name: 'System Admin',
      role: 'ADMIN',
      trustScore: 100,
      xp: 5000,
      level: 4,
      passwordHash,
      ward: 'Ward 1',
    },
  });

  const authority = await prisma.user.create({
    data: {
      email: 'authority@hero.city',
      name: 'Ward Officer Verma',
      role: 'AUTHORITY',
      trustScore: 85,
      xp: 2500,
      level: 3,
      passwordHash,
      ward: 'Ward 12',
    },
  });

  const citizen = await prisma.user.create({
    data: {
      email: 'citizen@hero.city',
      name: 'Aarav Mehta',
      role: 'CITIZEN',
      trustScore: 65,
      xp: 350,
      level: 1,
      passwordHash,
      ward: 'Ward 12',
      badges: JSON.stringify([badges[2].id]), // Active Citizen badge seed
    },
  });

  const volunteer = await prisma.user.create({
    data: {
      email: 'volunteer@hero.city',
      name: 'Priya Nair',
      role: 'VOLUNTEER',
      trustScore: 78,
      xp: 1200,
      level: 2,
      passwordHash,
      ward: 'Ward 5',
      badges: JSON.stringify([badges[0].id, badges[4].id]),
    },
  });

  // Register volunteer skill
  await prisma.volunteerSkill.create({
    data: {
      userId: volunteer.id,
      skill: 'ELECTRICIAN',
      isVerified: true,
    },
  });

  // 5. Create Missions
  console.log('Creating missions...');
  const missionsData = [
    { title: 'Ward 12 Pothole Audit', description: 'Audit all potholes near Metro Station and verify resolution status.', type: 'INSPECT', xpReward: 150, ward: 'Ward 12' },
    { title: 'Streetlight Assessment', description: 'Inspect streetlights around Central Park area after 8 PM.', type: 'VERIFY', xpReward: 120, ward: 'Ward 5' },
    { title: 'Garbage Dump Report', description: 'Report any illegal garbage dumping spots along Main Highway.', type: 'REPORT', xpReward: 100, ward: 'Ward 17' },
  ];

  for (const m of missionsData) {
    let typeEnum: any = 'VERIFY';
    if (m.type === 'INSPECT') typeEnum = 'INSPECT';
    else if (m.type === 'REPORT') typeEnum = 'REPORT';

    await prisma.mission.create({
      data: {
        title: m.title,
        description: m.description,
        type: typeEnum,
        xpReward: m.xpReward,
        ward: m.ward,
      },
    });
  }

  // 6. Create Issues (Bengaluru Geolocation Context)
  console.log('Creating issues...');
  const issuesData = [
    {
      title: 'Massive Pothole near Indiranagar Metro',
      description: 'A deep pothole is causing heavy traffic congestion. Two motorcyclists almost fell last night.',
      category: 'POTHOLE',
      severity: 'CRITICAL',
      status: 'ASSIGNED',
      lat: 12.971891,
      lng: 77.641151,
      address: 'Indiranagar 100 Feet Rd, Bengaluru, Karnataka 560038',
      ward: 'Ward 12',
      reportedById: citizen.id,
      departmentId: depts['POTHOLE'].id,
      civicScore: 84.5,
    },
    {
      title: 'Water Leakage from Main Pipe line',
      description: 'Clean drinking water has been leaking from the underground pipe for three days now.',
      category: 'WATER_LEAKAGE',
      severity: 'HIGH',
      status: 'SUBMITTED',
      lat: 12.978543,
      lng: 77.640231,
      address: 'Double Road, Indiranagar, Bengaluru, Karnataka 560038',
      ward: 'Ward 12',
      reportedById: citizen.id,
      departmentId: depts['WATER_LEAKAGE'].id,
      civicScore: 68.0,
    },
    {
      title: 'Garbage Overflow near Central Park entrance',
      description: 'Garbage bins are overflowing, emitting terrible smell. Stray dogs are scattering it all over.',
      category: 'GARBAGE',
      severity: 'MEDIUM',
      status: 'COMMUNITY_VERIFIED',
      lat: 12.959281,
      lng: 77.697412,
      address: 'Outer Ring Rd, Marathahalli, Bengaluru, Karnataka 560037',
      ward: 'Ward 5',
      reportedById: volunteer.id,
      departmentId: depts['GARBAGE'].id,
      civicScore: 52.0,
    },
    {
      title: 'Flickering Streetlights on Sector 3 Lane',
      description: 'All streetlights are completely off or flickering. Extremely dark and unsafe for walkers.',
      category: 'STREETLIGHT',
      severity: 'LOW',
      status: 'RESOLVED',
      lat: 12.910285,
      lng: 77.678412,
      address: 'HSR Layout Sector 3, Bengaluru, Karnataka 560102',
      ward: 'Ward 17',
      reportedById: volunteer.id,
      departmentId: depts['STREETLIGHT'].id,
      civicScore: 35.0,
      resolvedAt: new Date(),
    },
  ];

  for (const i of issuesData) {
    let catEnum: any = 'OTHER';
    if (i.category === 'POTHOLE') catEnum = 'POTHOLE';
    else if (i.category === 'WATER_LEAKAGE') catEnum = 'WATER_LEAKAGE';
    else if (i.category === 'GARBAGE') catEnum = 'GARBAGE';
    else if (i.category === 'STREETLIGHT') catEnum = 'STREETLIGHT';

    let sevEnum: any = 'MEDIUM';
    if (i.severity === 'CRITICAL') sevEnum = 'CRITICAL';
    else if (i.severity === 'HIGH') sevEnum = 'HIGH';
    else if (i.severity === 'LOW') sevEnum = 'LOW';

    let statEnum: any = 'SUBMITTED';
    if (i.status === 'ASSIGNED') statEnum = 'ASSIGNED';
    else if (i.status === 'COMMUNITY_VERIFIED') statEnum = 'COMMUNITY_VERIFIED';
    else if (i.status === 'RESOLVED') statEnum = 'RESOLVED';

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3);

    const issue = await prisma.issue.create({
      data: {
        title: i.title,
        description: i.description,
        category: catEnum,
        severity: sevEnum,
        status: statEnum,
        lat: i.lat,
        lng: i.lng,
        address: i.address,
        ward: i.ward,
        reportedById: i.reportedById,
        departmentId: i.departmentId,
        civicScore: i.civicScore,
        slaDeadline: deadline,
        resolvedAt: i.resolvedAt,
        aiAnalysis: JSON.stringify({
          issueType: i.category,
          severity: i.severity,
          confidence: 0.91,
          publicRisk: i.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          reasoning: 'Automated seed generation data.',
        }),
      },
    });

    // Create a ledger entry for each issue
    await prisma.ledgerEntry.create({
      data: {
        issueId: issue.id,
        action: 'REPORTED',
        actorId: i.reportedById,
        actorName: i.reportedById === citizen.id ? citizen.name : volunteer.name,
      },
    });
  }

  // 7. Seed Predictions
  console.log('Seeding predictions...');
  const predData = [
    { issueType: 'GARBAGE', ward: 'Ward 12', probability: 0.78, reasoning: 'Spike in weekly food delivery packets + garbage pickup truck strike planned.', weatherContext: 'Hot dry weather' },
    { issueType: 'POTHOLE', ward: 'Ward 5', probability: 0.85, reasoning: 'Incoming heavy monsoon downpour forecasted to expand minor road cracks.', weatherContext: 'Thunderstorm warnings' },
  ];

  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  for (const p of predData) {
    await prisma.prediction.create({
      data: {
        issueType: p.issueType,
        ward: p.ward,
        probability: p.probability,
        reasoning: p.reasoning,
        weatherContext: p.weatherContext,
        expiresAt: expires,
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
