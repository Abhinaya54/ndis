import { io } from "socket.io-client";

let socket;
export const connectSocket = (onConnect) => {
  if (!socket) {
    socket = io(process.env.REACT_APP_API_URL || "http://localhost:5000");
    socket.on("connect", () => onConnect && onConnect(socket.id));
  }
  return socket;
};

export const joinStaffRoom = (staffId) => {
  if (!socket) return;
  socket.emit("joinStaff", staffId);
};

export const leaveStaffRoom = (staffId) => {
  if (!socket) return;
  socket.emit("leaveStaff", staffId);
};

export const onAssignmentUpdate = (cb) => {
  if (!socket) return;
  socket.on("assignmentUpdated", cb);
};

export const onAssignmentStatus = (cb) => {
  if (!socket) return;
  socket.on("assignmentStatus", cb);
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};
