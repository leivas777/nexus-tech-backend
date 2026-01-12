const { sequelize } = require("../models");
const { Appointment, AvailabilitySlot, BlockedDate } = sequelize.models;
const googleCalendarService = require("../services/googleCalendarServices");

// GET /api/appointments - Listar agendamentos do usuário
async function getAppointments(req, res) {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        console.log("📅 Buscando agendamentos para usuário:", userId);

        const whereClause = { userId };

        if (startDate && endDate) {
            whereClause.startTime = {
                [sequelize.Sequelize.Op.between]: [
                    new Date(startDate),
                    new Date(endDate)
                ]
            };
        }

        const appointments = await Appointment.findAll({
            where: whereClause,
            order: [["startTime", "ASC"]]
        });

        console.log(`✅ ${appointments.length} agendamentos encontrados`);

        return res.status(200).json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error("❌ Erro ao buscar agendamentos:", error.message);
        return res.status(500).json({
            error: "Erro ao buscar agendamentos",
            details: error.message
        });
    }
}

// POST /api/appointments - Criar novo agendamento
async function createAppointment(req, res) {
    try {
        const userId = req.user.id;
        const {
            title,
            description,
            startTime,
            endTime,
            appointmentType,
            clientName,
            clientEmail,
            clientPhone,
            customerId,
            syncWithGoogle
        } = req.body;

        console.log("📝 Criando novo agendamento para usuário:", userId);

        // Validações básicas
        if (!title || !startTime || !endTime) {
            return res.status(400).json({
                error: "Campos obrigatórios: title, startTime, endTime"
            });
        }

        if (new Date(endTime) <= new Date(startTime)) {
            return res.status(400).json({
                error: "endTime deve ser maior que startTime"
            });
        }

        // Verificar se há conflito de horário
        const conflictingAppointment = await Appointment.findOne({
            where: {
                userId,
                startTime: {
                    [sequelize.Sequelize.Op.lt]: new Date(endTime)
                },
                endTime: {
                    [sequelize.Sequelize.Op.gt]: new Date(startTime)
                },
                status: {
                    [sequelize.Sequelize.Op.ne]: "cancelled"
                }
            }
        });

        if (conflictingAppointment) {
            return res.status(409).json({
                error: "Já existe um agendamento neste horário"
            });
        }

        // Criar agendamento
        const appointment = await Appointment.create({
            userId,
            title,
            description,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            appointmentType,
            clientName,
            clientEmail,
            clientPhone,
            customerId,
            status: "pending"
        });

        console.log("✅ Agendamento criado:", appointment.id);

        // Sincronizar com Google Calendar se solicitado
        if (syncWithGoogle) {
            try {
                const user = await sequelize.models.User.findByPk(userId);
                
                if (user?.googleAccessToken) {
                    const googleEvent = await googleCalendarService.createEvent(
                        user.googleAccessToken,
                        user.googleRefreshToken,
                        {
                            title,
                            description,
                            startTime,
                            endTime,
                            clientEmail
                        }
                    );

                    // Atualizar agendamento com ID do Google
                    await appointment.update({
                        googleEventId: googleEvent.googleEventId,
                        isSyncedWithGoogle: true
                    });

                    console.log("✅ Sincronizado com Google Calendar:", googleEvent.googleEventId);
                }
            } catch (error) {
                console.error("⚠️ Erro ao sincronizar com Google:", error.message);
                // Não falhar a criação se Google falhar
            }
        }

        return res.status(201).json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error("❌ Erro ao criar agendamento:", error.message);
        return res.status(500).json({
            error: "Erro ao criar agendamento",
            details: error.message
        });
    }
}

// PUT /api/appointments/:id - Atualizar agendamento
async function updateAppointment(req, res) {
    try {
        const userId = req.user.id;
        const appointmentId = req.params.id;
        const { title, description, startTime, endTime, status, clientName, clientEmail, clientPhone } = req.body;

        console.log("✏️ Atualizando agendamento:", appointmentId);

        const appointment = await Appointment.findOne({
            where: { id: appointmentId, userId }
        });

        if (!appointment) {
            return res.status(404).json({
                error: "Agendamento não encontrado"
            });
        }

        // Atualizar agendamento
        await appointment.update({
            title: title || appointment.title,
            description: description || appointment.description,
            startTime: startTime ? new Date(startTime) : appointment.startTime,
            endTime: endTime ? new Date(endTime) : appointment.endTime,
            status: status || appointment.status,
            clientName: clientName || appointment.clientName,
            clientEmail: clientEmail || appointment.clientEmail,
            clientPhone: clientPhone || appointment.clientPhone
        });

        // Sincronizar com Google Calendar se tiver googleEventId
        if (appointment.googleEventId) {
            try {
                const user = await sequelize.models.User.findByPk(userId);
                
                if (user?.googleAccessToken) {
                    await googleCalendarService.updateEvent(
                        user.googleAccessToken,
                        user.googleRefreshToken,
                        appointment.googleEventId,
                        {
                            title: title || appointment.title,
                            description: description || appointment.description,
                            startTime: startTime || appointment.startTime,
                            endTime: endTime || appointment.endTime
                        }
                    );

                    console.log("✅ Atualizado no Google Calendar");
                }
            } catch (error) {
                console.error("⚠️ Erro ao atualizar no Google:", error.message);
            }
        }

        console.log("✅ Agendamento atualizado");

        return res.status(200).json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error("❌ Erro ao atualizar agendamento:", error.message);
        return res.status(500).json({
            error: "Erro ao atualizar agendamento",
            details: error.message
        });
    }
}

// DELETE /api/appointments/:id - Deletar agendamento
async function deleteAppointment(req, res) {
    try {
        const userId = req.user.id;
        const appointmentId = req.params.id;

        console.log("🗑️ Deletando agendamento:", appointmentId);

        const appointment = await Appointment.findOne({
            where: { id: appointmentId, userId }
        });

        if (!appointment) {
            return res.status(404).json({
                error: "Agendamento não encontrado"
            });
        }

        // Deletar do Google Calendar se tiver googleEventId
        if (appointment.googleEventId) {
            try {
                const user = await sequelize.models.User.findByPk(userId);
                
                if (user?.googleAccessToken) {
                    await googleCalendarService.deleteEvent(
                        user.googleAccessToken,
                        user.googleRefreshToken,
                        appointment.googleEventId
                    );

                    console.log("✅ Deletado do Google Calendar");
                }
            } catch (error) {
                console.error("⚠️ Erro ao deletar do Google:", error.message);
            }
        }

        // Deletar do banco de dados
        await appointment.destroy();

        console.log("✅ Agendamento deletado");

        return res.status(200).json({
            success: true,
            message: "Agendamento deletado com sucesso"
        });
    } catch (error) {
        console.error("❌ Erro ao deletar agendamento:", error.message);
        return res.status(500).json({
            error: "Erro ao deletar agendamento",
            details: error.message
        });
    }
}

module.exports = {
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment
};