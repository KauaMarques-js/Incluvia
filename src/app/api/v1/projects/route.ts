import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { createProjectSchema, paginationSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';
import { ProjectStatus } from '@/lib/enums';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/projects
 * Lists projects the current user has access to.
 */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const pagination = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status');

    const where = {
      createdById: session.userId,
      ...(status === 'active' || status === 'archived' ? { status: status as ProjectStatus } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              {
                description: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { targets: true, aiEvaluations: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/v1/projects
 * Creates a new audit project.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const result = createProjectSchema.safeParse(body);
    if (!result.success) {
      throw new AppError('VALIDATION_ERROR', 'Verifique os campos informados.', {
        fields: result.error.flatten().fieldErrors,
      });
    }

    const project = await prisma.project.create({
      data: {
        name: result.data.name,
        description: result.data.description,
        createdById: session.userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
