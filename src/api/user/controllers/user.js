'use strict';
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "c15e25c1883d5e",
    pass: "cbe455df4161f9"
  }
});

module.exports = {
  async login(ctx) {
    const { email,password } = ctx.request.body;

    try {
      const entry = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: email}
      });

      if (entry){
        const passwordMatch = await bcrypt.compare(password, entry.password);
        if(passwordMatch){
          const updateEntry = strapi.db.query('plugin::users-permissions.user').update({
            where:{id:entry.id},
            data:{logged: true}
          });
    
          return ctx.send({message: `Valor actualizado correctamente para el usuario con ID: ${entry.username}`,success: true,user:entry});
        } else return ctx.send({message: `Contraseña incorrecta`,success: false});
        
      } else return ctx.send({message: `El usuario no existe en la base de datos`,success: false});
    } catch (error) {
      return ctx.badRequest('Error al actualizar el valor: '+error);
    }
  },

  async confirmUser(ctx){
    const {id} = ctx.params;
      
    try{
      const updateEntry = strapi.db.query('plugin::users-permissions.user').update({
        where:{id:id},
        data:{confirmed: true }
      });

      return ctx.send({
        message: `Email confirmado correctamente para el usuario con ID: ${id}`,
        success: true
      });
    } catch(err){
      return ctx.badRequest('Error: '+err);
    }
  },
  async createUser(ctx){

    let { username, email, password,confirmed,blocked,logged,role,gpid,surname } = ctx.request.body;

    const name = username;

    const randomNumber = Math.round(Math.random()*5000);

    username = name+surname+randomNumber;
    
    try {
      const user = await strapi.plugins['users-permissions'].services.user.add({
        username,
        surname,
        email,
        password,
        gpid,
        blocked,
        confirmed,
        logged,
        role,
      });

      const templatePath = path.resolve(__dirname, '../emailTemplates/welcome.html');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      const correoHTML = templateContent.replace('{{fullname}}', username+' '+surname);

      await transport.sendMail({
        from:'livestreamfront@gmail.com',
        to:email,
        subject:'Confirmacion de usuario',
        text: `Id de usuario: ${user.id}`,
        html:correoHTML
      });
      
      return ctx.send({'user':user,'success':true});
    } catch (error) {
      console.error('Error al enviar el correo electrónico:', error);
    }
  }
};

