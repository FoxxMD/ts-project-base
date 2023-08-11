'use strict';
import {
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
  DataTypes,
  CreationOptional,
  Model,
} from "sequelize";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {

  declare id: CreationOptional<number>;
  declare name: string;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export const init = (sequelize: Sequelize) => {
  User.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'User',
  });
}

export const associate = () => {
  //User.belongsTo(Guild, {targetKey: 'id', as: 'Team'});
}
