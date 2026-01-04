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
      type: DataTypes.TIME,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    estado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "pendiente"
    }
  }, {
    tableName: `${tablePrefix}citas`
  });
};
