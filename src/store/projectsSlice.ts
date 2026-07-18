import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DashboardProject } from '@/types/project';

interface ProjectsState {
  projects: DashboardProject[];
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: string;
    priority: string;
    assignee: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    currentPage: number;
  };
}

const initialState: ProjectsState = {
  projects: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    currentPage: 1,
  }
};

export const fetchProjectsThunk = createAsyncThunk<DashboardProject[], string | undefined>(
  'projects/fetchProjects',
  async (filterParams, { getState, rejectWithValue }) => {
    try {
      let params = filterParams;
      if (params === undefined) {
        const state = getState() as any;
        const { search, status, priority, assignee, sortBy, sortOrder } = state.projects.filters;
        const urlParams = new URLSearchParams();
        if (search && search.trim()) urlParams.append("search", search);
        if (status && status !== "all") urlParams.append("status", status);
        if (priority && priority !== "all") urlParams.append("priority", priority);
        if (assignee && assignee !== "all") urlParams.append("assignee", assignee);
        urlParams.append("sortBy", sortBy);
        urlParams.append("sortOrder", sortOrder);
        params = urlParams.toString();
      }
      const res = await fetch(`/api/projects?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch projects');
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setSearchFilter(state, action: PayloadAction<string>) {
      state.filters.search = action.payload;
      state.filters.currentPage = 1;
    },
    setStatusFilter(state, action: PayloadAction<string>) {
      state.filters.status = action.payload;
      state.filters.currentPage = 1;
    },
    setPriorityFilter(state, action: PayloadAction<string>) {
      state.filters.priority = action.payload;
      state.filters.currentPage = 1;
    },
    setAssigneeFilter(state, action: PayloadAction<string>) {
      state.filters.assignee = action.payload;
      state.filters.currentPage = 1;
    },
    setSortByFilter(state, action: PayloadAction<string>) {
      state.filters.sortBy = action.payload;
      state.filters.currentPage = 1;
    },
    toggleSortOrder(state) {
      state.filters.sortOrder = state.filters.sortOrder === 'asc' ? 'desc' : 'asc';
      state.filters.currentPage = 1;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.filters.currentPage = action.payload;
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },
    updateProjectLocally(state, action: PayloadAction<DashboardProject>) {
      const idx = state.projects.findIndex(p => p._id === action.payload._id);
      if (idx !== -1) {
        state.projects[idx] = action.payload;
      }
    },
    deleteProjectLocally(state, action: PayloadAction<string>) {
      state.projects = state.projects.filter(p => p._id !== action.payload);
    },
    addProjectLocally(state, action: PayloadAction<DashboardProject>) {
      state.projects.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjectsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  setSearchFilter,
  setStatusFilter,
  setPriorityFilter,
  setAssigneeFilter,
  setSortByFilter,
  toggleSortOrder,
  setCurrentPage,
  resetFilters,
  updateProjectLocally,
  deleteProjectLocally,
  addProjectLocally,
} = projectsSlice.actions;

export default projectsSlice.reducer;
