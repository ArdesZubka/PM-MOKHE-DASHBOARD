/**
 * Utility for generating monotonic, non-reusable Project and Task codes.
 *
 * WHY LENGTH-BASED GENERATION IS UNSAFE:
 * Using array.length or array.length + 1 to derive codes (e.g., `PRJ-${projects.length + 1}`)
 * causes ID collision whenever an item is deleted. For example, if there are 4 items and item PRJ-2
 * is deleted, array.length becomes 3. Creating a new project would yield `PRJ-4`, resulting in
 * duplicate codes in the system.
 * 
 * Monotonic counters increment continuously regardless of deletions, ensuring every project and task
 * retains a unique, immutable code across the lifetime of the application session.
 */

let projectCounter = 5; // Initialized after PRJ-1 .. PRJ-4
let taskCounter = 7;    // Initialized after TGS-1 .. TGS-6

export function generateProjectCode(): string {
  const code = `PRJ-${projectCounter}`;
  projectCounter++;
  return code;
}

export function generateTaskCode(): string {
  const code = `TGS-${taskCounter}`;
  taskCounter++;
  return code;
}

/**
 * Sync counter state with existing max numbers if custom datasets are loaded.
 */
export function initializeCountersFromData(projects: { code?: string }[], tasks: { code?: string }[]): void {
  let maxProj = 0;
  projects.forEach(p => {
    if (p.code) {
      const match = p.code.match(/PRJ-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxProj) maxProj = num;
      }
    }
  });
  if (maxProj >= projectCounter) {
    projectCounter = maxProj + 1;
  }

  let maxTask = 0;
  tasks.forEach(t => {
    if (t.code) {
      const match = t.code.match(/TGS-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxTask) maxTask = num;
      }
    }
  });
  if (maxTask >= taskCounter) {
    taskCounter = maxTask + 1;
  }
}
