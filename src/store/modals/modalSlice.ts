import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ModalType = "addNote" | "changeStatus" | "assignResources" | "setPriority" | "info" | "delay" | "subtask" | "dpr" | "brief" | null;

interface ModalState {
    openModal: ModalType;
    modalData: any;
}

const initialState: ModalState = {
    openModal: null,
    modalData: null,
};

const modalSlice = createSlice({
    name: "modal",
    initialState,
    reducers: {
        openModal: (state, action: PayloadAction<{ type: ModalType; data?: any }>) => {
            state.openModal = action.payload.type;
            state.modalData = action.payload.data || null;
        },
        closeModal: (state) => {
            state.openModal = null;
            state.modalData = null;
        },
    },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
