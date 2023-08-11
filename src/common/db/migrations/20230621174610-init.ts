import {Migration} from "sequelize-cli";
import {IndexType} from "sequelize/types/dialects/abstract/query-interface.js";

const migration: Migration = {
    async up(queryInterface, Sequelize) {

        await queryInterface.createTable('Users', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER.UNSIGNED
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Users');
    }
};
module.exports = {up: migration.up, down: migration.down};
