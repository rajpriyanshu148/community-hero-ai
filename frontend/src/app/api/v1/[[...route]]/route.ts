import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================
// In-Memory Database State (re-initialized on lambda spinup, seeded with Bengaluru data)
// ============================================================
let users = [
  { id: '1', name: 'System Admin', email: 'admin@hero.city', role: 'ADMIN', trustScore: 100, xp: 5000, level: 4, ward: 'Ward 1', skills: [], badges: ['3'] },
  { id: '2', name: 'Ward Officer Verma', email: 'authority@hero.city', role: 'AUTHORITY', trustScore: 85, xp: 2500, level: 3, ward: 'Ward 12', skills: [], badges: [] },
  { id: '3', name: 'Aarav Mehta', email: 'citizen@hero.city', role: 'CITIZEN', trustScore: 65, xp: 350, level: 1, ward: 'Ward 12', skills: [], badges: ['3'] },
  { id: '4', name: 'Priya Nair', role: 'VOLUNTEER', email: 'volunteer@hero.city', trustScore: 78, xp: 1200, level: 2, ward: 'Ward 5', skills: [{ id: 's1', skill: 'ELECTRICIAN' }], badges: ['1', '5'] }
];

let issues: any[] = [
  {
    id: 'issue-1',
    title: 'Massive Pothole near Indiranagar Metro',
    description: 'A deep pothole is causing heavy traffic congestion. Two motorcyclists almost fell last night.',
    category: 'POTHOLE',
    severity: 'CRITICAL',
    status: 'ASSIGNED',
    lat: 12.971891,
    lng: 77.641151,
    address: 'Indiranagar 100 Feet Rd, Bengaluru, Karnataka 560038',
    ward: 'Ward 12',
    reportedById: '3',
    upvotes: 8,
    civicScore: 84.5,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    verifications: [
      { id: 'v1', result: 'EXISTS', trustWeight: 7.8, user: { name: 'Priya Nair' } }
    ],
    ledger: [
      { id: 'l1', action: 'REPORTED', actorName: 'Aarav Mehta', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'l2', action: 'STATUS_CHANGED', actorName: 'AI Watchdog Engine', createdAt: new Date(Date.now() - 43200000).toISOString() }
    ],
    comments: [
      { id: 'c1', user: { name: 'Priya Nair' }, content: 'This is highly dangerous, traffic is very slow here.', createdAt: new Date(Date.now() - 60000000).toISOString() }
    ],
    mediaUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    aiAnalysis: {
      issueType: 'POTHOLE',
      severity: 'CRITICAL',
      confidence: 0.91,
      publicRisk: 'CRITICAL',
      reasoning: 'Road surface damage exceeds 60% of lane width near high-traffic Metro station corridor.'
    }
  },
  {
    id: 'issue-2',
    title: 'Water Leakage from Main Pipeline',
    description: 'Clean drinking water has been leaking from the underground pipe for three days now.',
    category: 'WATER_LEAKAGE',
    severity: 'HIGH',
    status: 'SUBMITTED',
    lat: 12.978543,
    lng: 77.640231,
    address: 'Double Road, Indiranagar, Bengaluru, Karnataka 560038',
    ward: 'Ward 12',
    reportedById: '3',
    upvotes: 4,
    civicScore: 68.0,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    verifications: [],
    ledger: [
      { id: 'l3', action: 'REPORTED', actorName: 'Aarav Mehta', createdAt: new Date(Date.now() - 172800000).toISOString() }
    ],
    comments: [],
    mediaUrls: ['https://images.unsplash.com/photo-1542013936693-8848e5740a7a?auto=format&fit=crop&q=80&w=800'],
    aiAnalysis: {
      issueType: 'WATER_LEAKAGE',
      severity: 'HIGH',
      confidence: 0.88,
      publicRisk: 'HIGH',
      reasoning: 'Continuous flow of potable water detected, risk of roadway undermining if unchecked.'
    }
  }
];

let predictions = [
  { id: 'p1', issueType: 'GARBAGE', ward: 'Ward 12', probability: 0.78, reasoning: 'Spike in weekly food delivery packets + garbage pickup truck strike planned.', weatherContext: 'Hot dry weather', expiresAt: new Date(Date.now() + 86400000 * 5).toISOString() },
  { id: 'p2', issueType: 'POTHOLE', ward: 'Ward 5', probability: 0.85, reasoning: 'Incoming heavy monsoon downpour forecasted to expand minor road cracks.', weatherContext: 'Thunderstorm warnings', expiresAt: new Date(Date.now() + 86400000 * 4).toISOString() }
];

let missions = [
  { id: 'm1', title: 'Ward 12 Pothole Audit', description: 'Audit all potholes near Metro Station and verify resolution status.', type: 'INSPECT', xpReward: 150, ward: 'Ward 12' },
  { id: 'm2', title: 'Streetlight Assessment', description: 'Inspect streetlights around Central Park area after 8 PM.', type: 'VERIFY', xpReward: 120, ward: 'Ward 5' }
];

let userMissions: any[] = [];

// ============================================================
// Helper functions for stateless cookies-based session management
// ============================================================
function getMergedUsers(req: NextRequest) {
  let customUsers: any[] = [];
  try {
    const cookieVal = req.cookies.get('custom_users')?.value;
    if (cookieVal) {
      customUsers = JSON.parse(decodeURIComponent(cookieVal));
    }
  } catch (err) {
    console.error('Error parsing custom_users cookie:', err);
  }
  return [...users, ...customUsers];
}

function getCurrentUser(req: NextRequest, mergedUsers: any[]) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (token.startsWith('mock-jwt-token-')) {
    const userId = token.replace('mock-jwt-token-', '');
    const found = mergedUsers.find(u => u.id === userId);
    if (found) return found;
  }
  // Fallback to default user
  return mergedUsers[2];
}

function saveUser(req: NextRequest, response: NextResponse, user: any, merged: any[]) {
  const customUsersOnly = merged.filter(u => u.id !== '1' && u.id !== '2' && u.id !== '3' && u.id !== '4');
  const index = customUsersOnly.findIndex(u => u.id === user.id);
  if (index !== -1) {
    customUsersOnly[index] = user;
  } else {
    customUsersOnly.push(user);
  }
  response.cookies.set('custom_users', encodeURIComponent(JSON.stringify(customUsersOnly)), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// ============================================================
// Catch-All Handler
// ============================================================
export async function GET(req: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const { route } = await params;
  const path = (route || []).join('/');
  const searchParams = req.nextUrl.searchParams;

  const merged = getMergedUsers(req);
  const user = getCurrentUser(req, merged);

  // 1. Auth routes
  if (path === 'auth/me') {
    return NextResponse.json({ success: true, data: { user } });
  }

  // 2. Issues routes
  if (path === 'issues') {
    return NextResponse.json({ success: true, data: { issues } });
  }
  if (path === 'issues/my') {
    const myIssues = issues.filter(i => i.reportedById === user.id);
    return NextResponse.json({ success: true, data: { issues: myIssues } });
  }
  if (path.startsWith('issues/')) {
    const id = path.split('/')[1];
    const issue = issues.find(i => i.id === id);
    if (!issue) return NextResponse.json({ success: false, message: 'Issue not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { issue } });
  }

  // 3. AI Predictions
  if (path === 'ai/predictions') {
    const ward = searchParams.get('ward') || user.ward || 'Ward 12';
    const wardPreds = predictions.filter(p => p.ward === ward);
    return NextResponse.json({ success: true, data: wardPreds });
  }

  // 4. Leaderboard
  if (path === 'leaderboard') {
    const sortedUsers = [...merged].sort((a, b) => b.xp - a.xp);
    return NextResponse.json({ success: true, data: { users: sortedUsers } });
  }

  // 5. Missions
  if (path === 'missions') {
    const active = userMissions.filter(um => um.userId === user.id && um.status !== 'COMPLETED');
    const available = missions.filter(m => !active.some(a => a.missionId === m.id));
    return NextResponse.json({ success: true, data: { available, active } });
  }

  // 6. Weather Alerts
  if (path === 'weather/alerts') {
    const alerts = [
      { id: 'wa1', alertType: 'FLOODING_RISK', severity: 'HIGH', message: 'Heavy rain detected. Flooding risk in low-lying roads is high.' }
    ];
    return NextResponse.json({ success: true, data: alerts });
  }

  // 7. Authority assigned
  if (path === 'authority/assigned') {
    const assigned = issues.filter(i => i.departmentId === 'dept-road' || i.assignedToId === user.id);
    return NextResponse.json({ success: true, data: { issues: assigned } });
  }

  // 8. Admin lists
  if (path === 'admin/users') {
    return NextResponse.json({ success: true, data: { users: merged } });
  }
  if (path === 'admin/fraud') {
    const fraud = issues.filter(i => i.isFraudFlagged);
    return NextResponse.json({ success: true, data: { issues: fraud } });
  }

  return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const { route } = await params;
  const path = (route || []).join('/');

  const merged = getMergedUsers(req);
  const user = getCurrentUser(req, merged);

  // 1. Login/Register Mock
  if (path === 'auth/login') {
    const body = await req.json();
    const matched = merged.find(u => u.email === body.email);
    if (!matched) return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    const token = `mock-jwt-token-${matched.id}`;
    return NextResponse.json({ success: true, data: { accessToken: token, user: matched } });
  }
  if (path === 'auth/register') {
    const body = await req.json();
    const nextId = String(Date.now());
    const newUser = {
      id: nextId,
      name: body.name,
      email: body.email,
      role: 'CITIZEN',
      trustScore: 50,
      xp: 0,
      level: 1,
      ward: body.ward || 'Ward 12',
      skills: [],
      badges: []
    };
    
    const updatedCustomUsers = [...merged.filter(u => u.id !== '1' && u.id !== '2' && u.id !== '3' && u.id !== '4'), newUser];
    const response = NextResponse.json({ success: true, data: { user: newUser } });
    response.cookies.set('custom_users', encodeURIComponent(JSON.stringify(updatedCustomUsers)), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }

  // 2. Issue reporting (handles multipart or json)
  if (path === 'issues') {
    let body: any = {};
    try {
      const formData = await req.formData();
      body = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        severity: formData.get('severity') as string,
        lat: parseFloat(formData.get('lat') as string),
        lng: parseFloat(formData.get('lng') as string),
        address: formData.get('address') as string,
        ward: formData.get('ward') as string,
        aiAnalysis: formData.get('aiAnalysis') ? JSON.parse(formData.get('aiAnalysis') as string) : null
      };
    } catch {
      body = await req.json();
    }

    const newIssue = {
      id: `issue-${issues.length + 1}`,
      title: body.title,
      description: body.description,
      category: body.category,
      severity: body.severity,
      status: 'SUBMITTED',
      lat: body.lat,
      lng: body.lng,
      address: body.address,
      ward: body.ward,
      reportedById: user.id,
      upvotes: 0,
      civicScore: 40,
      createdAt: new Date().toISOString(),
      verifications: [],
      ledger: [
        { id: `l-${Date.now()}`, action: 'REPORTED', actorName: user.name, createdAt: new Date().toISOString() }
      ],
      comments: [],
      mediaUrls: ['https://images.unsplash.com/photo-1599740831418-b21a3a97d9e4?auto=format&fit=crop&q=80&w=800'],
      aiAnalysis: body.aiAnalysis || {
        issueType: body.category,
        severity: body.severity,
        confidence: 0.85,
        publicRisk: 'MEDIUM',
        reasoning: 'Self-reported issue without vision parsing.'
      }
    };
    issues.push(newIssue);
    return NextResponse.json({ success: true, data: { issue: newIssue } });
  }

  // 3. Upvote
  if (path.endsWith('/upvote')) {
    const id = path.split('/')[1];
    const issue = issues.find(i => i.id === id);
    if (issue) {
      issue.upvotes += 1;
      issue.civicScore = Math.min(100, issue.civicScore + 5);
      return NextResponse.json({ success: true });
    }
  }

  // 4. Comment
  if (path.endsWith('/comment')) {
    const id = path.split('/')[1];
    const body = await req.json();
    const issue = issues.find(i => i.id === id);
    if (issue) {
      const newComment = {
        id: `c-${Date.now()}`,
        user: { name: user.name },
        content: body.content,
        createdAt: new Date().toISOString()
      };
      issue.comments.push(newComment);
      return NextResponse.json({ success: true, data: { comment: newComment } });
    }
  }

  // 5. Verification
  if (path === 'verify') {
    const body = await req.json();
    const issue = issues.find(i => i.id === body.issueId);
    if (issue) {
      const newVerify = {
        id: `v-${Date.now()}`,
        result: body.result,
        trustWeight: user.trustScore / 10,
        user: { name: user.name }
      };
      issue.verifications.push(newVerify);
      
      // Update ledger
      issue.ledger.push({
        id: `l-${Date.now()}`,
        action: 'STATUS_CHANGED',
        actorName: user.name,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({ success: true });
    }
  }

  // 6. Skills registration
  if (path === 'skills') {
    const body = await req.json();
    user.skills = user.skills || [];
    user.skills.push({ id: `s-${Date.now()}`, skill: body.skill });
    
    const response = NextResponse.json({ success: true });
    saveUser(req, response, user, merged);
    return response;
  }

  // 7. Mission Accept/Complete
  if (path.endsWith('/accept')) {
    const id = path.split('/')[1];
    const mission = missions.find(m => m.id === id);
    if (mission) {
      userMissions.push({
        id: `um-${Date.now()}`,
        missionId: id,
        userId: user.id,
        status: 'ACCEPTED',
        mission
      });
      return NextResponse.json({ success: true });
    }
  }
  if (path.endsWith('/complete')) {
    const id = path.split('/')[1];
    const match = userMissions.find(um => um.missionId === id && um.userId === user.id);
    if (match) {
      match.status = 'COMPLETED';
      user.xp += match.mission.xpReward;
      user.level = Math.min(5, Math.floor(user.xp / 1000) + 1);
      
      const response = NextResponse.json({ success: true, data: { xpEarned: match.mission.xpReward } });
      saveUser(req, response, user, merged);
      return response;
    }
  }

  // 8. Gemini Vision Analysis
  if (path === 'ai/analyze') {
    const mockAnalysis = {
      issueType: 'POTHOLE',
      severity: 'HIGH',
      confidence: 0.89,
      publicRisk: 'HIGH',
      department: 'Roads & Infrastructure',
      estimatedResolutionTime: '48 hours',
      estimatedCost: '₹12,000-18,000',
      reasoning: 'Road surface damage exceeds 50% of traffic lane width. Detected using vision parsing models.'
    };
    return NextResponse.json({ success: true, data: mockAnalysis });
  }

  return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const { route } = await params;
  const path = (route || []).join('/');

  const merged = getMergedUsers(req);
  const user = getCurrentUser(req, merged);

  // Status updates
  if (path.endsWith('/status')) {
    const id = path.split('/')[1];
    const body = await req.json();
    const issue = issues.find(i => i.id === id);
    if (issue) {
      issue.status = body.status;
      issue.ledger.push({
        id: `l-${Date.now()}`,
        action: 'STATUS_CHANGED',
        actorName: user.name,
        createdAt: new Date().toISOString()
      });
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
}
