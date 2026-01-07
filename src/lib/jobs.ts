import { neon } from "@neondatabase/serverless";

// Types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  roleType?: string;
  postedDate?: string;
  url?: string;
}

export interface JobStats {
  total: number;
  avgDayRate: number;
  topRoles: { role: string; count: number }[];
  roleBreakdown: { name: string; jobs: number }[];
  salaryRanges: { role: string; min: number; max: number; avg: number }[];
  hybridPercentage: number;
}

// Database client
function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

// Fetch jobs by location
export async function getJobsByLocation(location: string): Promise<Job[]> {
  const sql = getDb();
  const searchTerm = `%${location}%`;

  try {
    const rows = await sql`
      SELECT
        title,
        company,
        location,
        salary_min,
        salary_max,
        description,
        role_type
      FROM test_jobs
      WHERE location ILIKE ${searchTerm}
      LIMIT 50
    `;

    return rows.map((row: any, index: number) => ({
      id: `job-${index}`,
      title: row.title,
      company: row.company || "Unknown",
      location: row.location || "UK",
      salaryMin: row.salary_min,
      salaryMax: row.salary_max,
      salary: row.salary_min && row.salary_max
        ? `£${Math.round(row.salary_min / 1000)}k - £${Math.round(row.salary_max / 1000)}k`
        : undefined,
      description: row.description,
      roleType: row.role_type,
      url: `https://fractional.quest/fractional-jobs`,
    }));
  } catch (error) {
    console.error("[jobs] Error fetching by location:", error);
    return [];
  }
}

// Fetch jobs by role type
export async function getJobsByRole(role: string): Promise<Job[]> {
  const sql = getDb();
  const searchTerm = `%${role}%`;

  try {
    const rows = await sql`
      SELECT
        title,
        company,
        location,
        salary_min,
        salary_max,
        description,
        role_type
      FROM test_jobs
      WHERE title ILIKE ${searchTerm} OR role_type ILIKE ${searchTerm}
      LIMIT 50
    `;

    return rows.map((row: any, index: number) => ({
      id: `job-${index}`,
      title: row.title,
      company: row.company || "Unknown",
      location: row.location || "UK",
      salaryMin: row.salary_min,
      salaryMax: row.salary_max,
      salary: row.salary_min && row.salary_max
        ? `£${Math.round(row.salary_min / 1000)}k - £${Math.round(row.salary_max / 1000)}k`
        : undefined,
      description: row.description,
      roleType: row.role_type,
      url: `https://fractional.quest/fractional-${role.toLowerCase()}-jobs-uk`,
    }));
  } catch (error) {
    console.error("[jobs] Error fetching by role:", error);
    return [];
  }
}

// Get stats for a location
export async function getLocationStats(location: string): Promise<JobStats> {
  const sql = getDb();
  const searchTerm = `%${location}%`;

  try {
    // Total count
    const [countResult] = await sql`
      SELECT COUNT(*) as count
      FROM test_jobs
      WHERE location ILIKE ${searchTerm}
    `;
    const total = Number(countResult?.count || 0);

    // Average salary
    const [avgResult] = await sql`
      SELECT AVG(salary_max) as avg
      FROM test_jobs
      WHERE location ILIKE ${searchTerm} AND salary_max IS NOT NULL
    `;
    const avgDayRate = Math.round(Number(avgResult?.avg || 150000) / 1000);

    // Role breakdown
    const roleRows = await sql`
      SELECT role_type as role, COUNT(*) as count
      FROM test_jobs
      WHERE location ILIKE ${searchTerm}
      GROUP BY role_type
      ORDER BY count DESC
    `;
    const topRoles = roleRows.map((r: any) => ({
      role: r.role || "Other",
      count: Number(r.count),
    }));
    const roleBreakdown = topRoles.map((r) => ({
      name: r.role,
      jobs: r.count,
    }));

    // Salary ranges (day rates in £)
    const salaryRanges = [
      { role: "CTO", min: 900, max: 1400, avg: 1100 },
      { role: "CFO", min: 1000, max: 1500, avg: 1200 },
      { role: "CMO", min: 850, max: 1300, avg: 1000 },
      { role: "COO", min: 900, max: 1300, avg: 1050 },
      { role: "CHRO", min: 800, max: 1200, avg: 950 },
    ];

    return {
      total,
      avgDayRate,
      topRoles,
      roleBreakdown,
      salaryRanges,
      hybridPercentage: 60,
    };
  } catch (error) {
    console.error("[jobs] Error fetching stats:", error);
    return {
      total: 0,
      avgDayRate: 0,
      topRoles: [],
      roleBreakdown: [],
      salaryRanges: [],
      hybridPercentage: 0,
    };
  }
}

// Role types for filtering
const ROLE_TYPES = ['cfo', 'cto', 'cmo', 'coo', 'chro', 'cio', 'ciso'];

// Combined fetch for page data
// Handles both location-based (london, uk) and role-based (cfo, cto) queries
export async function getJobsPageData(filter: string) {
  const filterLower = filter.toLowerCase();

  // Check if this is a role filter
  const isRoleFilter = ROLE_TYPES.includes(filterLower);

  if (isRoleFilter) {
    const [jobs, stats] = await Promise.all([
      getJobsByRole(filterLower),
      getRoleStats(filterLower),
    ]);
    return { jobs, stats };
  }

  // Special case for 'uk' - get all jobs
  if (filterLower === 'uk') {
    const [jobs, stats] = await Promise.all([
      getAllJobs(),
      getAllStats(),
    ]);
    return { jobs, stats };
  }

  // Default: location-based filter
  const [jobs, stats] = await Promise.all([
    getJobsByLocation(filter),
    getLocationStats(filter),
  ]);

  return { jobs, stats };
}

// Get all jobs (UK-wide)
export async function getAllJobs(): Promise<Job[]> {
  const sql = getDb();

  try {
    const rows = await sql`
      SELECT
        title,
        company,
        location,
        salary_min,
        salary_max,
        description,
        role_type
      FROM test_jobs
      LIMIT 100
    `;

    return rows.map((row: any, index: number) => ({
      id: `job-${index}`,
      title: row.title,
      company: row.company || "Unknown",
      location: row.location || "UK",
      salaryMin: row.salary_min,
      salaryMax: row.salary_max,
      salary: row.salary_min && row.salary_max
        ? `£${Math.round(row.salary_min / 1000)}k - £${Math.round(row.salary_max / 1000)}k`
        : undefined,
      description: row.description,
      roleType: row.role_type,
      url: `https://fractional.quest/fractional-jobs`,
    }));
  } catch (error) {
    console.error("[jobs] Error fetching all jobs:", error);
    return [];
  }
}

// Get all stats (UK-wide)
export async function getAllStats(): Promise<JobStats> {
  const sql = getDb();

  try {
    const [countResult] = await sql`SELECT COUNT(*) as count FROM test_jobs`;
    const total = Number(countResult?.count || 0);

    const [avgResult] = await sql`
      SELECT AVG(salary_max) as avg FROM test_jobs WHERE salary_max IS NOT NULL
    `;
    const avgDayRate = Math.round(Number(avgResult?.avg || 150000) / 1000);

    const roleRows = await sql`
      SELECT role_type as role, COUNT(*) as count
      FROM test_jobs
      GROUP BY role_type
      ORDER BY count DESC
    `;
    const topRoles = roleRows.map((r: any) => ({
      role: r.role || "Other",
      count: Number(r.count),
    }));
    const roleBreakdown = topRoles.map((r) => ({
      name: r.role,
      jobs: r.count,
    }));

    const salaryRanges = [
      { role: "CTO", min: 900, max: 1400, avg: 1100 },
      { role: "CFO", min: 1000, max: 1500, avg: 1200 },
      { role: "CMO", min: 850, max: 1300, avg: 1000 },
      { role: "COO", min: 900, max: 1300, avg: 1050 },
      { role: "CHRO", min: 800, max: 1200, avg: 950 },
    ];

    return {
      total,
      avgDayRate,
      topRoles,
      roleBreakdown,
      salaryRanges,
      hybridPercentage: 55,
    };
  } catch (error) {
    console.error("[jobs] Error fetching all stats:", error);
    return {
      total: 0,
      avgDayRate: 0,
      topRoles: [],
      roleBreakdown: [],
      salaryRanges: [],
      hybridPercentage: 0,
    };
  }
}

// Get stats by role type
export async function getRoleStats(role: string): Promise<JobStats> {
  const sql = getDb();
  const searchTerm = `%${role}%`;

  try {
    const [countResult] = await sql`
      SELECT COUNT(*) as count
      FROM test_jobs
      WHERE title ILIKE ${searchTerm} OR role_type ILIKE ${searchTerm}
    `;
    const total = Number(countResult?.count || 0);

    const [avgResult] = await sql`
      SELECT AVG(salary_max) as avg
      FROM test_jobs
      WHERE (title ILIKE ${searchTerm} OR role_type ILIKE ${searchTerm}) AND salary_max IS NOT NULL
    `;
    const avgDayRate = Math.round(Number(avgResult?.avg || 150000) / 1000);

    const locationRows = await sql`
      SELECT location, COUNT(*) as count
      FROM test_jobs
      WHERE title ILIKE ${searchTerm} OR role_type ILIKE ${searchTerm}
      GROUP BY location
      ORDER BY count DESC
    `;
    const topRoles = locationRows.map((r: any) => ({
      role: r.location || "UK",
      count: Number(r.count),
    }));
    const roleBreakdown = topRoles.map((r) => ({
      name: r.role,
      jobs: r.count,
    }));

    // Day rate ranges specific to role
    const roleUpper = role.toUpperCase();
    const salaryRanges = [
      { role: roleUpper, min: 1000, max: 1500, avg: 1200 },
      { role: `Senior ${roleUpper}`, min: 1200, max: 1800, avg: 1400 },
      { role: `Interim ${roleUpper}`, min: 900, max: 1400, avg: 1100 },
    ];

    return {
      total,
      avgDayRate,
      topRoles,
      roleBreakdown,
      salaryRanges,
      hybridPercentage: 70,
    };
  } catch (error) {
    console.error("[jobs] Error fetching role stats:", error);
    return {
      total: 0,
      avgDayRate: 0,
      topRoles: [],
      roleBreakdown: [],
      salaryRanges: [],
      hybridPercentage: 0,
    };
  }
}
