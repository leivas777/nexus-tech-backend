const express = require("express");
const {
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment
} = require("../controllers/appointmentController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// GET /api/appointments - Listar agendamentos
router.get("/", getAppointments);

// POST /api/appointments - Criar novo agendamento
router.post("/", createAppointment);

// PUT /api/appointments/:id - Atualizar agendamento
router.put("/:id", updateAppointment);

// DELETE /api/appointments/:id - Deletar agendamento
router.delete("/:id", deleteAppointment);

module.exports = router;