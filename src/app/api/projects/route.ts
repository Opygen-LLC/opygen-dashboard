import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import ActivityLog from '@/models/ActivityLog';
import { projectSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const assignee = searchParams.get('assignee');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const filter: any = {};

    if (assignee) {
      filter.assignees = assignee;
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const projects = await Project.find(filter)
      .populate('assignees', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .sort(sort);

    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const parseResult = projectSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const projectData = parseResult.data;

    const totalPayments = (projectData.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    if (totalPayments > (projectData.budget || 0)) {
      return NextResponse.json(
        { error: `Total payment milestones ($${totalPayments.toLocaleString()}) cannot exceed the project budget ($${(projectData.budget || 0).toLocaleString()})` },
        { status: 400 }
      );
    }

    const project = await Project.create({
      ...projectData,
      createdBy: session.user.id,
    });

    // Create activity log entry
    await ActivityLog.create({
      project: project._id,
      user: session.user.id,
      type: 'details_change',
      message: `created the project "${project.title}"`,
    });

    // Populate user references before returning
    const populatedProject = await Project.findById(project._id)
      .populate('assignees', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl');

    return NextResponse.json(populatedProject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
