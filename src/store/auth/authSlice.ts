import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
    isAuthenticated: boolean;
    user: {
        id: string | null;
        name: string | null;
        profilePicture: string | null;
        email: string | null;
        role: string | null;
        departments: string[] | null
    };
}

const initialState: AuthState = {
    isAuthenticated: false,
    user: {
        id: "-1",
        name: "Guest",
        profilePicture: "Guest",
        email: "guest@xyz.com",
        role: "guest",
        departments: []
    }
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthToken: (state, action: PayloadAction<string>) => {
            try {
                const decodedToken: any = jwtDecode(action.payload); // Decode the token

                state.isAuthenticated = true;
                state.user = {
                    id: decodedToken.id,
                    name: decodedToken.name,
                    profilePicture: decodedToken.profile_picture,
                    email: decodedToken.email,
                    role: decodedToken.role,
                    departments: decodedToken.departments
                };
            } catch (error) {
                console.error('Invalid token:', error);
                state.isAuthenticated = false;
                state.user = {
                    id: "-1",
                    name: "Guest",
                    profilePicture: "Guest",
                    email: "guest@xyz.com",
                    role: "guest",
                    departments: []
                }
            }
        },
        clearAuth: (state) => {
            state.isAuthenticated = false;
            state.user = {
                id: "-1",
                name: "Guest",
                profilePicture: "Guest",
                email: "guest@xyz.com",
                role: "guest",
                departments: []
            }
        },
    },
});

export const { setAuthToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;
