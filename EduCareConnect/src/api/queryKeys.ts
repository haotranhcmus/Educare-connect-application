/**
 * Centralized query key factory for TanStack Query.
 *
 * Why: hard-coded `["students", "mine", uid]` everywhere is typo-prone. A
 * single source of truth means `queryKeys.students.mine(uid)` produces an
 * identical key in every hook, screen, and `invalidateQueries` call.
 *
 * Convention (see docs/tanstack-query-guide.md §3):
 *   [domain, sub-action, ...params]
 *
 * Per-call examples used by the app:
 *   queryKeys.students.mine(uid)         → ["students", "mine", uid]
 *   queryKeys.students.detail(id)        → ["students", "detail", id]
 *   queryKeys.students.iepPlans(id)      → ["students", "iep-plans", id]
 *   queryKeys.sessions.student(id)       → ["sessions", "student", id]
 *   queryKeys.reports.student(id)        → ["reports", "student", id]
 *
 * Each domain also exposes `.all` for broad invalidation:
 *   qc.invalidateQueries({ queryKey: queryKeys.reports.all })
 */

type Uid = number | null | undefined;
type MaybeId = number | undefined;

export const queryKeys = {
  // ── Students ────────────────────────────────────────────────────────────
  students: {
    all: ["students"] as const,
    mine: (uid: Uid) => ["students", "mine", uid] as const,
    detail: (studentId: MaybeId) => ["students", "detail", studentId] as const,
    withActivePlan: () => ["students", "with-active-plan"] as const,
    /** All IEP plans owned by a student. Plan-side hooks own this key. */
    iepPlans: (studentId: MaybeId) =>
      ["students", "iep-plans", studentId] as const,
  },

  // ── IEP plans (detail / by-plan-id queries) ─────────────────────────────
  iepPlans: {
    all: ["iep-plans"] as const,
    detail: (planId: MaybeId) => ["iep-plans", "detail", planId] as const,
  },

  // ── IEP goals ───────────────────────────────────────────────────────────
  iepGoals: {
    all: ["iep-goals"] as const,
    forPlan: (planId: MaybeId) => ["iep-goals", "plan", planId] as const,
    byIds: (key: string) => ["iep-goals", "by-ids", key] as const,
  },

  // ── IEP objectives ──────────────────────────────────────────────────────
  iepObjectives: {
    all: ["iep-objectives"] as const,
    forGoal: (goalId: MaybeId) => ["iep-objectives", "goal", goalId] as const,
    detail: (objectiveId: MaybeId) =>
      ["iep-objectives", "detail", objectiveId] as const,
    /** Active objectives across all of a student's plans. */
    active: (studentId: MaybeId) =>
      ["iep-objectives", "active", studentId] as const,
    /** Used when fetching a specific set of objectives by id (eg. for a session). */
    byIds: (ids: readonly number[]) =>
      ["iep-objectives", "by-ids", [...ids].sort()] as const,
  },

  // ── IEP session results (per objective) ─────────────────────────────────
  iepResults: {
    all: ["iep-results"] as const,
    byObjective: (objectiveId: MaybeId, limit: number) =>
      ["iep-results", "objective", objectiveId, limit] as const,
  },

  // ── Sessions ────────────────────────────────────────────────────────────
  sessions: {
    all: ["sessions"] as const,
    student: (studentId: MaybeId) =>
      ["sessions", "student", studentId] as const,
    today: (uid: Uid) => ["sessions", "today", uid] as const,
    my: (uid: Uid, filters?: { dateFrom?: string; dateTo?: string } | null) =>
      ["sessions", "my", uid, filters ?? null] as const,
    detail: (sessionId: MaybeId) => ["sessions", "detail", sessionId] as const,
    results: (sessionId: MaybeId) =>
      ["sessions", "results", sessionId] as const,
    availableForReport: (uid: Uid) =>
      ["sessions", "available-for-report", uid] as const,
    /** Broad prefix to invalidate every "my sessions" cache regardless of uid/filters. */
    myAll: () => ["sessions", "my"] as const,
  },

  // ── Reports ─────────────────────────────────────────────────────────────
  reports: {
    all: ["reports"] as const,
    student: (studentId: MaybeId) => ["reports", "student", studentId] as const,
    my: (uid: Uid) => ["reports", "my", uid] as const,
    detail: (reportId: MaybeId) => ["reports", "detail", reportId] as const,
    forSession: (sessionId: MaybeId) =>
      ["reports", "for-session", sessionId] as const,
    photos: (attachmentIds: readonly number[] | undefined) =>
      ["reports", "photos", attachmentIds] as const,
    pendingCount: (uid: Uid) => ["reports", "pending-count", uid] as const,
    /** Broad prefix to invalidate every pending-count cache regardless of uid. */
    pendingCountAll: () => ["reports", "pending-count"] as const,
  },

  // ── Profile ─────────────────────────────────────────────────────────────
  profile: {
    all: ["profile"] as const,
    me: (uid: Uid) => ["profile", "me", uid] as const,
  },

  // ── Parent-side views (parent app) ──────────────────────────────────────
  parent: {
    all: ["parent"] as const,
    student: (uid: Uid) => ["parent", "student", uid] as const,
    students: (uid: Uid) => ["parent", "students", uid] as const,
    studentById: (studentId: MaybeId) =>
      ["parent", "student-by-id", studentId] as const,
    unreadCount: (studentId: MaybeId) =>
      ["parent", "unread-count", studentId] as const,
    activePlan: (studentId: MaybeId) =>
      ["parent", "active-plan", studentId] as const,
    latestSession: (studentId: MaybeId) =>
      ["parent", "latest-session", studentId] as const,
    sessionsThisWeek: (studentId: MaybeId) =>
      ["parent", "sessions-this-week", studentId] as const,
    planHistory: (studentId: MaybeId) =>
      ["parent", "plan-history", studentId] as const,
    goalsObjectives: (planId: MaybeId) =>
      ["parent", "goals-objectives", planId] as const,
    reports: (studentId: MaybeId) => ["parent", "reports", studentId] as const,
    /** Broad prefix for invalidating any `parent.reports(*)` cache. */
    reportsAll: () => ["parent", "reports"] as const,
    /** Broad prefix for invalidating any `parent.unreadCount(*)` cache. */
    unreadCountAll: () => ["parent", "unread-count"] as const,
    timetable: (
      studentId: MaybeId,
      dateFrom: string | undefined,
      dateTo: string | undefined,
    ) => ["parent", "timetable", studentId, dateFrom, dateTo] as const,
  },
  // ── Notifications ───────────────────────────────────────────────────────
  notifications: {
    all: ["notifications"] as const,
    list: (uid: Uid, onlyUnread: boolean) =>
      ["notifications", "list", uid, onlyUnread] as const,
    unreadCount: (uid: Uid) => ["notifications", "unread-count", uid] as const,
  },

  // ── Chat ────────────────────────────────────────────────────────────────
  chat: {
    all: ["chat"] as const,
    conversations: (uid: Uid) => ["chat", "conversations", uid] as const,
    messages: (conversationId: MaybeId) =>
      ["chat", "messages", conversationId] as const,
    unreadCount: (uid: Uid) => ["chat", "unread-count", uid] as const,
  },

  // ── AI assistant ────────────────────────────────────────────────────────
  ai: {
    all: ["ai"] as const,
    session: (uid: Uid) => ["ai", "session", uid] as const,
    messages: (channelId: MaybeId) => ["ai", "messages", channelId] as const,
  },
} as const;
