import { prisma } from '@/utils/database';

/**
 * Video Hosting Strategy (T065)
 * 
 * CURRENT: YouTube Unlisted links - no cost, simple embed
 * FUTURE: Cloudflare R2 + Stream when volume justifies
 * 
 * Video URL format in Technique model:
 * - YouTube: "https://youtube.com/watch?v=xxx" or "https://youtu.be/xxx"
 * - Cloudflare Stream: "https://customer-xxxx.cloudflarestream.com/video-id/watch"
 * - Bunny: "https://iframe.mediadelivery.net/embed/xxx/video-id"
 * 
 * The getTechniqueDetails method handles video URL processing
 */
const VIDEO_HOSTING = {
  type: process.env.VIDEO_HOSTING_TYPE || 'youtube',  // 'youtube' | 'cloudflare' | 'bunny'
  cdnBase: process.env.VIDEO_CDN_BASE || ''
};

export class CourseService {
  async getCurrentCourse(studentId: string) {
    // Find active enrollment
    const enrollment = await prisma.turmaStudent.findFirst({
      where: { studentId, isActive: true, status: 'ACTIVE' },
      include: {
        turma: {
          include: {
            course: true
          }
        }
      }
    });

    if (!enrollment) return null;
    return enrollment.turma.course;
  }

  async getCourseJourney(courseId: string, studentId: string) {
    // Get techniques for the course
    const techniques = await prisma.courseTechnique.findMany({
      where: { courseId },
      include: {
        technique: true
      },
      orderBy: { orderIndex: 'asc' }
    });

    // Get student progress
    const progress = await prisma.studentTechniqueProgress.findMany({
      where: { studentId, techniqueId: { in: techniques.map(t => t.techniqueId) } }
    });

    // Merge
    return techniques.map(ct => {
      const p = progress.find(prog => prog.techniqueId === ct.techniqueId);
      let status = 'LOCKED';
      if (p) {
          status = p.completed ? 'COMPLETED' : 'IN_PROGRESS';
      } else {
          // Logic to unlock based on previous technique?
          // For now, let's say if previous is completed, this is UNLOCKED
          // Or just return LOCKED/TODO
          status = 'TODO';
      }

      return {
        ...ct.technique,
        orderIndex: ct.orderIndex,
        weekNumber: ct.weekNumber,
        status,
        completedAt: p?.completedAt
      };
    });
  }

  async getTechniqueDetails(techniqueId: string, studentId: string) {
    const technique = await prisma.technique.findUnique({
      where: { id: techniqueId }
    });

    const progress = await prisma.studentTechniqueProgress.findUnique({
      where: {
        studentId_techniqueId: { studentId, techniqueId }
      }
    });

    return {
      ...technique,
      progress
    };
  }

  async getRanking(organizationId: string) {
    // Fetch students with their completed technique count and points
    const students = await prisma.student.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        user: {
          select: { firstName: true, lastName: true, avatarUrl: true }
        },
        techniqueProgress: {
          where: { completed: true },
          select: { id: true } // just count
        },
        attendances: {
          select: { id: true } // attendance count for points
        }
      }
    });

    const ranking = students.map(s => {
      // Points: 10 per technique, 5 per attendance
      const points = (s.techniqueProgress.length * 10) + (s.attendances.length * 5);
      return {
        id: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        photoUrl: s.user.avatarUrl,
        points,
        masteredCount: s.techniqueProgress.length,
        belt: 'Faixa Branca' // TODO: Get actual belt from student progression
      };
    });

    // Sort by points descending
    const sortedRanking = ranking.sort((a, b) => b.points - a.points);

    // Add position
    const rankedList = sortedRanking.map((r, index) => ({
      ...r,
      position: index + 1
    }));

    // Find current user rank (if applicable)
    // Since we don't have studentId here, we'll return the full list
    // The frontend can find the user's position

    return {
      ranking: rankedList.slice(0, 20),
      userRank: null // Will be set by caller if needed
    };
  }
}
