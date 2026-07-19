import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { projectSchema, baseProjectSchema } from '@/lib/validations';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    return NextResponse.json(project, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
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

    const parseResult = baseProjectSchema.partial().safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const updates = { ...parseResult.data };
    // Remove fields that Zod applied defaults to if they weren't in the actual request
    for (const key in updates) {
      if (!(key in body)) {
        delete (updates as any)[key];
      }
    }

    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatedBudget = updates.budget !== undefined ? updates.budget : project.budget;
    
    // If budget changed, clear all milestones (payments)
    if (updates.budget !== undefined && updates.budget !== project.budget) {
        updates.payments = [];
    }
    const updatedPayments = updates.payments !== undefined ? updates.payments : project.payments;
    if (updatedPayments && updatedBudget !== undefined && updatedBudget > 0) {
      const totalPayments = updatedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      if (totalPayments > updatedBudget) {
        return NextResponse.json(
          { error: `Total payment milestones ($${totalPayments.toLocaleString()}) cannot exceed the project budget ($${updatedBudget.toLocaleString()})` },
          { status: 400 }
        );
      }
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

    if (updates.startDate !== undefined) {
      const oldTime = project.startDate ? new Date(project.startDate).getTime() : 0;
      const newTime = updates.startDate ? new Date(updates.startDate).getTime() : 0;
      if (oldTime !== newTime) {
        logs.push({
          project: project._id,
          user: session.user.id,
          type: 'details_change',
          message: updates.startDate ? `set start date to ${new Date(updates.startDate).toLocaleDateString()}` : 'removed start date',
        });
        project.startDate = updates.startDate || undefined;
      }
    }

    if (updates.budget !== undefined && updates.budget !== project.budget) {
      logs.push({
        project: project._id,
        user: session.user.id,
        type: 'details_change',
        message: `updated budget to $${Number(updates.budget).toLocaleString()}`,
      });
      project.budget = updates.budget;
    }

    if (updates.budgetMin !== undefined && updates.budgetMin !== project.budgetMin) {
      project.budgetMin = updates.budgetMin ?? undefined;
    }

    if (updates.budgetMax !== undefined && updates.budgetMax !== project.budgetMax) {
      project.budgetMax = updates.budgetMax ?? undefined;
    }

    if (updates.clientName !== undefined && updates.clientName !== project.clientName) {
      project.clientName = updates.clientName;
    }

    if (updates.clientMobile !== undefined && updates.clientMobile !== project.clientMobile) {
      project.clientMobile = updates.clientMobile;
    }

    if (updates.clientSocialLink !== undefined && updates.clientSocialLink !== project.clientSocialLink) {
      project.clientSocialLink = updates.clientSocialLink;
    }

    if (updates.payments !== undefined) {
      // Find all old receipt URLs
      const oldReceiptUrls = (project.payments || [])
        .map((p: any) => p.receiptUrl)
        .filter((url): url is string => !!url);

      // Find all new receipt URLs
      const newReceiptUrls = (updates.payments || [])
        .map((p: any) => p.receiptUrl)
        .filter((url): url is string => !!url);

      // Identify URLs that were in old but are not in new
      const deletedReceiptUrls = oldReceiptUrls.filter(url => !newReceiptUrls.includes(url));

      // Trigger deletion for each removed receipt URL
      for (const url of deletedReceiptUrls) {
        deleteFromCloudinary(url).catch(err =>
          console.error("Failed to delete removed receipt from Cloudinary:", err)
        );
      }

      project.payments = updates.payments as any;
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
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Find all receipt URLs of the project to delete them from Cloudinary
    const receiptUrls = (project.payments || [])
      .map((p: any) => p.receiptUrl)
      .filter((url): url is string => !!url);

    for (const url of receiptUrls) {
      deleteFromCloudinary(url).catch(err =>
        console.error("Failed to delete project receipt from Cloudinary:", err)
      );
    }

    await project.deleteOne();
    await ActivityLog.deleteMany({ project: id });

    return NextResponse.json({ message: 'Project and activity logs deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
