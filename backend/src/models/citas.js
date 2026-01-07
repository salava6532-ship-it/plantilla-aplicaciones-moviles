const { DataTypes } = require("sequelize");

module.exports = (sequelize, tablePrefix) => {
  return sequelize.define("Cita", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    cliente: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hora: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: "pendiente"
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: `${tablePrefix}citas`
  });
};
