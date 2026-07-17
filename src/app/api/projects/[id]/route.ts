import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { projectSchema } from '@/lib/validations';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await dbConnect();
    const project = await Project.findById(id)
      .populate('assignees', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl');

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const parseResult = projectSchema.partial().safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const updates = parseResult.data;
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const logs: any[] = [];

    if (updates.status && updates.status !== project.status) {
      const statusLabels: Record<string, string> = {
        todo: 'To Do',
        in_progress: 'In Progress',
        in_review: 'In Review',
        completed: 'Completed',
        on_hold: 'On Hold',
      };
      logs.push({
        project: project._id,
        user: session.user.id,
        type: 'status_change',
        message: `changed status to "${statusLabels[updates.status]}"`,
      });
      project.status = updates.status;
    }

    if (updates.priority && updates.priority !== project.priority) {
      logs.push({
        project: project._id,
        user: session.user.id,
        type: 'priority_change',
        message: `changed priority to "${updates.priority}"`,
      });
      project.priority = updates.priority;
    }

    if (updates.assignees) {
      const oldAssignees = project.assignees.map((a) => a.toString()).sort();
      const newAssignees = [...updates.assignees].sort();
      const match =
        oldAssignees.length === newAssignees.length &&
        oldAssignees.every((val, index) => val === newAssignees[index]);

      if (!match) {
        const assignedUsers = await User.find({ _id: { $in: updates.assignees } }, 'name');
        const names = assignedUsers.map((u) => u.name).join(', ');
        logs.push({
          project: project._id,
          user: session.user.id,
          type: 'assignment_change',
          message: names ? `assigned to ${names}` : 'removed all assignees',
        });
        project.assignees = updates.assignees.map((userId) => new mongoose.Types.ObjectId(userId));
      }
    }

    if (updates.title && updates.title !== project.title) {
      logs.push({
        project: project._id,
        user: session.user.id,
        type: 'details_change',
        message: `renamed project to "${updates.title}"`,
      });
      project.title = updates.title;
    }

    if (updates.description !== undefined && updates.description !== project.description) {
      logs.push({
        project: project._id,
        user: session.user.id,
        type: 'details_change',
        message: 'updated description',
      });
      project.description = updates.description;
    }

    if (updates.dueDate !== undefined) {
      const oldTime = project.dueDate ? new Date(project.dueDate).getTime() : 0;
      const newTime = updates.dueDate ? new Date(updates.dueDate).getTime() : 0;
      if (oldTime !== newTime) {
        logs.push({
          project: project._id,
          user: session.user.id,
          type: 'details_change',
          message: updates.dueDate ? `set due date to ${new Date(updates.dueDate).toLocaleDateString()}` : 'removed due date',
        });
        project.dueDate = updates.dueDate || undefined;
      }
    }

    await project.save();

    if (logs.length > 0) {
      await ActivityLog.insertMany(logs);
    }

    const populatedProject = await Project.findById(project._id)
      .populate('assignees', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl');

    return NextResponse.json(populatedProject);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await dbConnect();
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await ActivityLog.deleteMany({ project: id });

    return NextResponse.json({ message: 'Project and activity logs deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
