const { DataTypes } = require("sequelize");

module.exports = (sequelize, tablePrefix) => {
  return sequelize.define("Usuario", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: `${tablePrefix}usuarios`
  });
};
