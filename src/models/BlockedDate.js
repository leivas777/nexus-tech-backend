const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const BlockedDate = sequelize.define(
        "BlockedDate",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: "user_id"
            },
            startDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                field: "start_date"
            },
            endDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                field: "end_date"
            },
            reason: {
                type: DataTypes.STRING(255),
                allowNull: true
            }
        },
        {
            tableName: "blocked_dates",
            timestamps: true,
            underscored: true
        }
    );

    return BlockedDate;
};