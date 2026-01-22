import api from "./api";

export const createAssignment = async (payload) => {
  const res = await api.post("/api/assignments", payload);
  return res.data;
};

export const updateAssignment = async (id, payload) => {
  const res = await api.put(`/api/assignments/${id}`, payload);
  return res.data;
};

export const getStaffAssignments = async (staffId, week = "current") => {
  const res = await api.get(`/api/assignments/staff/${staffId}?week=${week}`);
  return res.data;
};

export const getSupervisorAssignments = async (supervisorId) => {
  const res = await api.get(`/api/assignments/supervisor/${supervisorId}`);
  return res.data;
};
