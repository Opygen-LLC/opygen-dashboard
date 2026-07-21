import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  id: string | null;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  mobileNumber: string | null;
  role: string | null;
  balance: number;
  status: string | null;
  fathersName?: string | null;
  mothersName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  accounts: any[];
  isInitialized: boolean;
}

const initialState: UserState = {
  id: null,
  name: null,
  email: null,
  avatarUrl: null,
  mobileNumber: null,
  role: null,
  balance: 0,
  status: null,
  fathersName: null,
  mothersName: null,
  gender: null,
  dateOfBirth: null,
  bloodGroup: null,
  accounts: [],
  isInitialized: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserProfile: (state, action: PayloadAction<Partial<UserState>>) => {
      return { ...state, ...action.payload, isInitialized: true };
    },
    updateAvatar: (state, action: PayloadAction<string>) => {
      state.avatarUrl = action.payload;
    },
    clearUserProfile: (state) => {
      return initialState;
    },
  },
});

export const { setUserProfile, updateAvatar, clearUserProfile } = userSlice.actions;
export default userSlice.reducer;
