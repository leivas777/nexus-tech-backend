const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Appointment = sequelize.define(
        "Appointment",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            startTime: {
                type: DataTypes.DATE,
                allowNull: false,
                field: "start_time"
            },
            endTime: {
                type: DataTypes.DATE,
                allowNull: false,
                field: "end_time"
            },
            status: {
                type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed"),
                defaultValue: "pending"
            },
            appointmentType: {
                type: DataTypes.STRING(100),
                field: "appointment_type"
            },
            googleEventId: {
                type: DataTypes.STRING(255),
                unique: true,
                field: "google_event_id"
            },
            isSyncedWithGoogle: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: "is_synced_with_google"
            },
            clientName: {
                type: DataTypes.STRING(255),
                field: "client_name"
            },
            clientEmail: {
                type: DataTypes.STRING(255),
                field: "client_email"
            },
            clientPhone: {
                type: DataTypes.STRING(20),
                field: "client_phone"
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: "user_id"
            },
            customerId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: "customer_id"
            }
        },
        {
            tableName: "appointments",
            timestamps: true,
            underscored: true
        }
    );

    return Appointment;
};