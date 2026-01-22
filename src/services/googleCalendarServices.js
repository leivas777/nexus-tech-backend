const { google } = require("googleapis");

class GoogleCalendarService {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    /**
     * Gera URL de autenticação do Google
     */
    getAuthUrl() {
        const scopes = [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile"
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            prompt: "consent",
            state: String(userId)
        });

    }

    /**
     * Troca código de autorização por tokens
     */
    async getTokensFromCode(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            return tokens;
        } catch (error) {
            console.error("❌ Erro ao obter tokens:", error.message);
            throw new Error("Falha ao autenticar com Google");
        }
    }

    /**
     * Obtém informações do usuário Google
     */
    async getUserInfo(accessToken) {
        try {
            this.oauth2Client.setCredentials({
                access_token: accessToken
            });

            const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
            const response = await oauth2.userinfo.get();

            return response.data;
        } catch (error) {
            console.error("❌ Erro ao obter informações do usuário:", error.message);
            throw error;
        }
    }

    /**
     * Cria cliente Google Calendar com tokens do usuário
     */
    createCalendarClient(accessToken, refreshToken) {
        this.oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        return google.calendar({ version: "v3", auth: this.oauth2Client });
    }

    /**
     * Obtém calendário principal do usuário
     */
    async getPrimaryCalendarId(accessToken, refreshToken) {
        try {
            const calendar = this.createCalendarClient(accessToken, refreshToken);
            const response = await calendar.calendarList.list();
            const primaryCalendar = response.data.items.find((cal) => cal.primary);
            return primaryCalendar?.id || "primary";
        } catch (error) {
            console.error("❌ Erro ao obter calendário:", error.message);
            throw error;
        }
    }

    /**
     * Cria evento no Google Calendar
     */
    async createEvent(accessToken, refreshToken, eventData) {
        try {
            const calendar = this.createCalendarClient(accessToken, refreshToken);

            const event = {
                summary: eventData.title,
                description: eventData.description || "",
                start: {
                    dateTime: new Date(eventData.startTime).toISOString(),
                    timeZone: "America/Sao_Paulo"
                },
                end: {
                    dateTime: new Date(eventData.endTime).toISOString(),
                    timeZone: "America/Sao_Paulo"
                },
                attendees: eventData.clientEmail
                    ? [{ email: eventData.clientEmail }]
                    : [],
                conferenceData: {
                    createRequest: {
                        requestId: `${Date.now()}`,
                        conferenceSolutionKey: { type: "hangoutsMeet" }
                    }
                }
            };

            const response = await calendar.events.insert({
                calendarId: "primary",
                resource: event,
                conferenceDataVersion: 1,
                sendUpdates: "eventCreator"
            });

            return {
                googleEventId: response.data.id,
                eventLink: response.data.htmlLink,
                meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri
            };
        } catch (error) {
            console.error("❌ Erro ao criar evento:", error.message);
            throw error;
        }
    }

    /**
     * Atualiza evento no Google Calendar
     */
    async updateEvent(accessToken, refreshToken, googleEventId, eventData) {
        try {
            const calendar = this.createCalendarClient(accessToken, refreshToken);

            const event = {
                summary: eventData.title,
                description: eventData.description || "",
                start: {
                    dateTime: new Date(eventData.startTime).toISOString(),
                    timeZone: "America/Sao_Paulo"
                },
                end: {
                    dateTime: new Date(eventData.endTime).toISOString(),
                    timeZone: "America/Sao_Paulo"
                }
            };

            await calendar.events.update({
                calendarId: "primary",
                eventId: googleEventId,
                resource: event,
                sendUpdates: "eventCreator"
            });

            return { success: true };
        } catch (error) {
            console.error("❌ Erro ao atualizar evento:", error.message);
            throw error;
        }
    }

    /**
     * Deleta evento do Google Calendar
     */
    async deleteEvent(accessToken, refreshToken, googleEventId) {
        try {
            const calendar = this.createCalendarClient(accessToken, refreshToken);

            await calendar.events.delete({
                calendarId: "primary",
                eventId: googleEventId,
                sendUpdates: "eventCreator"
            });

            return { success: true };
        } catch (error) {
            console.error("❌ Erro ao deletar evento:", error.message);
            throw error;
        }
    }

    /**
     * Lista eventos do Google Calendar
     */
    async listEvents(accessToken, refreshToken, startDate, endDate) {
        try {
            const calendar = this.createCalendarClient(accessToken, refreshToken);

            const response = await calendar.events.list({
                calendarId: "primary",
                timeMin: new Date(startDate).toISOString(),
                timeMax: new Date(endDate).toISOString(),
                singleEvents: true,
                orderBy: "startTime"
            });

            return response.data.items || [];
        } catch (error) {
            console.error("❌ Erro ao listar eventos:", error.message);
            throw error;
        }
    }
}

module.exports = new GoogleCalendarService();