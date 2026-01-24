
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Set to false to actually perform deletions
const DRY_RUN = false;

async function cleanup() {
    console.log(`--- Global Duplicate Cleanup Started (${DRY_RUN ? 'DRY RUN' : 'LIVE MODE'}) ---`);

    // Fetch all students to analyze in memory (safer for complex grouping)
    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: {
            student: {
                include: {
                    _count: {
                        select: {
                            attendances: true,
                            subscriptions: true
                        }
                    }
                }
            }
        }
    });

    const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
    const getParts = (s: string) => normalize(s).split(' ').filter(p => p.length > 1);

    // Grouping logic
    // We'll create groups based on (CPF or Name)
    const groups: (typeof users)[] = [];

    for (const u of users) {
        let placed = false;
        const uNameParts = getParts(`${u.firstName} ${u.lastName}`);
        const uCpf = u.cpf;

        for (const group of groups) {
            const master = group[0];
            const mNameParts = getParts(`${master.firstName} ${master.lastName}`);
            const mCpf = master.cpf;

            // Match by CPF if both have it
            const cpfMatch = uCpf && mCpf && uCpf === mCpf;

            // Fuzzy Name Match: first AND last name part matches
            const shareFirst = uNameParts[0] === mNameParts[0];
            const lastPartU = uNameParts[uNameParts.length - 1];
            const lastPartM = mNameParts[mNameParts.length - 1];
            const shareLast = lastPartU === lastPartM;
            const nameMatch = shareFirst && shareLast;

            if (cpfMatch || nameMatch) {
                // Special case: different first names but same CPF (family members)
                // If CPFs match but names are very different, don't group here for deletion
                // unless it's a known duplicate case. 
                // Actually, if names are different, we should check if they are REALLY the same person.
                // In the previous step we kept family members.
                if (cpfMatch && !nameMatch) {
                    // Different names, same CPF -> Likely family. Don't group for auto-delete.
                    continue;
                }

                group.push(u);
                placed = true;
                break;
            }
        }

        if (!placed) {
            groups.push([u]);
        }
    }

    let totalDeleted = 0;

    for (const group of groups) {
        if (group.length < 2) continue;

        console.log(`\nGroup: "${group[0].firstName} ${group[0].lastName}" (${group.length} records)`);

        // Sort: Activity > Valid Email > Oldest
        const sorted = [...group].sort((a, b) => {
            const aAct = (a.student?._count?.attendances || 0) + (a.student?._count?.subscriptions || 0);
            const bAct = (b.student?._count?.attendances || 0) + (b.student?._count?.subscriptions || 0);

            if (aAct !== bAct) return bAct - aAct; // Higher activity first

            const aIsTemp = a.email?.includes('@temp') || a.email?.includes('@asaas-import');
            const bIsTemp = b.email?.includes('@temp') || b.email?.includes('@asaas-import');

            if (aIsTemp && !bIsTemp) return 1;
            if (!aIsTemp && bIsTemp) return -1;

            return a.createdAt.getTime() - b.createdAt.getTime();
        });

        const master = sorted[0];
        const duplicates = sorted.slice(1);

        console.log(`  [KEEP] Master ID: ${master.id} | Email: ${master.email} | Act: ${(master.student?._count?.attendances || 0) + (master.student?._count?.subscriptions || 0)}`);

        for (const dup of duplicates) {
            const student = dup.student;
            const act = (student?._count?.attendances || 0) + (student?._count?.subscriptions || 0);

            if (act > 0) {
                console.log(`  [SKIP] Duplicate ID: ${dup.id} | Email: ${dup.email} | HAS ACTIVITY (${act})`);
                continue;
            }

            console.log(`  [DELETE] Duplicate ID: ${dup.id} | Email: ${dup.email} | No Activity`);

            if (!DRY_RUN) {
                // Delete AgentTasks
                if (student) {
                    const tasks = await prisma.agentTask.findMany({ where: { targetEntity: 'Student' } });
                    const tasksToDelete = tasks.filter(t => (t.actionPayload as any)?.studentId === student.id);
                    for (const t of tasksToDelete) {
                        try { await prisma.agentTask.delete({ where: { id: t.id } }); } catch (e) { }
                    }
                }
                // Delete User
                try {
                    await prisma.user.delete({ where: { id: dup.id } });
                    totalDeleted++;
                } catch (e) {
                    console.error(`    Failed to delete ${dup.id}:`, e);
                }
            } else {
                totalDeleted++;
            }
        }
    }

    console.log(`\n--- Global Cleanup Completed ---`);
    console.log(`Total records matched for deletion: ${totalDeleted}`);
    if (DRY_RUN) console.log(`[DRY RUN] No changes were made.`);
}

cleanup()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
