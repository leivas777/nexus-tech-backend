const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type:DataTypes.STRING(100),
        allowNull: false,
        validate:{
            notEmpty: {msg: 'Nome não pode ser vazio'},
            len:{ args: [2, 100], msg: 'Nome deve ter entre 2 e 100 caracteres'}
        }
    },
    email:{
        type: DataTypes.STRING(255),
        allowNull: false,
        unique:{
            msg: 'Este e-mail já está cadastrado'
        },
        validate:{
            isEmail:{ msg: 'E-mail inválido'},
            notEmpty: {msg: 'E-mail não pode ser vazio'}
        }
    },
    password:{
        type: DataTypes.STRING(255),
        allowNull: false,
        validate:{
            notEmpty:{ msg: 'Senha não pode ser vazia.'},
            len:{ args:[6,255], msg:'Senha deve ter no mínimo 6 caracteres'}
        }
    },
    isActive:{
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    hooks:{
        beforeCreate: async(user) =>{
            if(user.password){
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt)
            }
        },
        beforeUpdate: async(user) => {
            if(user.changed('password')){
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt)
            }
        }
    }
});

//Método para comparar senhas
User.prototype.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password)
};

//Remover senha do JSON de resposta
User.prototype.toJSON = function(){
    const values = {...this.get()};
    delete values.password;
    return values;
};

module.exports = User;