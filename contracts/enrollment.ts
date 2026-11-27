// CONTRACT ONLY — not implemented. Enrollment & course access (schema "app"). See docs/OFFLINE-COURSES.md §Delivery.

/** Created by the payment consumer (or manually by Reception for live classes). */
export interface Enrollment {
  id: string; userId: string
  target: { kind: 'offline_course'; cmsCourseId: number } | { kind: 'live_class'; classId: string } | { kind: 'event'; cmsEventId: number }
  status: 'active' | 'expired' | 'canceled'
  startsAt: string; expiresAt?: string | null // from the course's accessDays (0 = no expiry)
  sourceTransactionId?: string
}

/** Per-lesson progress for offline courses (lessonId = the CMS lesson row id, stable across edits). */
export interface LessonProgress { userId: string; cmsCourseId: number; lessonId: string; secondsWatched: number; completedAt?: string }

/** Video delivery: the platform API checks enrollment (or lesson.preview) and asks the streaming provider for a
 *  short-lived signed URL for lesson.video.assetId. The asset id never reaches the browser otherwise. */
export interface VideoAccessService {
  playbackUrl(input: { userId: string | null; cmsCourseId: number; lessonId: string }): Promise<{ url: string; expiresAt: string } | { denied: 'not_enrolled' | 'expired' | 'not_found' }>
}
