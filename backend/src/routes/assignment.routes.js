const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/assignment.controller");

// Only supervisors can create/update
router.post("/", auth(["supervisor"]), controller.createAssignment);
router.put("/:id", auth(["supervisor"]), controller.updateAssignment);

// Staff can view their assignments (route guarded by auth to ensure the staffId matches the token for extra safety)
router.get("/staff/:staffId", auth(["staff", "supervisor"]), async (req, res, next) => {
  // allow supervisors to query any staff; staff can query only their own id
  if (req.user.role === "staff" && req.user.id !== req.params.staffId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return controller.getStaffAssignments(req, res, next);
});

// Supervisor view
router.get("/supervisor/:supervisorId", auth(["supervisor"]), controller.getSupervisorAssignments);

module.exports = router;
