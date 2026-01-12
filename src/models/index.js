// models/index.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔧 Inicializando Sequelize...');

// ✅ Configurar Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: false, // ✅ Desativar por padrão (cada modelo define o seu)
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  }
);

console.log('✅ Sequelize configurado');

// ✅ Importar modelos
console.log('📦 Importando modelos...');

const User = require('./Users')(sequelize);
const Customer = require('./Customer')(sequelize);
const BusinessSegment = require('./BusinessSegment')(sequelize);

console.log('✅ Modelos importados:', { User: !!User, Customer: !!Customer, BusinessSegment: !!BusinessSegment });

// ✅ Definir associações
console.log('🔗 Definindo associações...');

User.hasOne(Customer, {
  foreignKey: 'user_id',
  as: 'customer',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Customer.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Customer.belongsTo(BusinessSegment, {
  foreignKey: 'segmento',
  targetKey: 'segment',
  as: 'segmentoData',
});

console.log('✅ Associações definidas');

// ✅ Testar conexão
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conectado ao banco de dados com sucesso!');
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  });

// ✅ Sincronizar modelos
console.log('🔄 Sincronizando modelos...');

sequelize.sync({ alter: false })
  .then(() => {
    console.log('✅ Modelos sincronizados com o banco de dados');
  })
  .catch(err => {
    console.error('❌ Erro ao sincronizar modelos:', err.message);
  });

// ✅ EXPORTAR MODELOS
module.exports = {
  sequelize,
  User,
  Customer,
  BusinessSegment,
};

console.log('✅ Modelos exportados');