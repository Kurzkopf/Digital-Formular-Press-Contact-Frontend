import { type ApiResponse, api } from "./api";
import type { Page, Submission } from "@/types/admin.types";

export const getAllSubmissions = async(page: number, size: number) : Promise<ApiResponse<Page<Submission>>> => {
    return await api.get<Page<Submission>>(`/api/admin/submissions?page=${page}&size=${size}&sort=createdAt,desc`)
}

export const sendMailSubmission = async(id: number) => {
    return await api.post(`/api/admin/submission/sendMail/${id}`, id)
}