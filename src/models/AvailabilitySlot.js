const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const AvailabilitySlot = sequelize.define(
        "AvailabilitySlot",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            dayOfWeek: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: { min: 0, max: 6 },
                field: "day_of_week"
            },
            startTime: {
                type: DataTypes.TIME,
                allowNull: false,
                field: "start_time"
            },
            endTime: {
                type: DataTypes.TIME,
                allowNull: false,
                field: "end_time"
            },
            slotDurationMinutes: {
                type: DataTypes.INTEGER,
                defaultValue: 60,
                field: "slot_duration_minutes"
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                field: "is_active"
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: "user_id"
            }
        },
        {
            tableName: "availability_slots",
            timestamps: true,
            underscored: true
        }
    );

    return AvailabilitySlot;
};