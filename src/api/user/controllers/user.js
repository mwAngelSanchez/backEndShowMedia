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
  async createUser(ctx) {
    let { username, email, password, confirmed, blocked, logged, role, gpid, surname } = ctx.request.body;
  
    // Enviar el correo electrónico con el ID del usuario
  
    const name = username;
    username = email;
  
    let user;
    try {
      user = await strapi.plugins['users-permissions'].services.user.add({
        username,
        name,
        surname,
        email,
        password,
        gpid,
        blocked,
        confirmed,
        logged,
        role,
      });
    } catch (error) {
      return ctx.badRequest('Error: ' + error);
    }
  
    // Envío de correo
    try {
      const templatePath = path.resolve(__dirname, '../emailTemplates/correo.html');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
  
      const correoHTML = templateContent.replace('{{fullname}}', name + ' ' + surname);
  
      await strapi.plugins['email'].services.email.send({
        to: email,
        from: 'registro@premiospepsico2023.com',
        replyTo: 'registro@premiospepsico2023.com',
        subject: '¡Registro exitoso a Premios Pepsico 2023!',
        html: correoHTML,
      });
    } catch (error) {
      console.error(error);
    }
  
    return ctx.send({ 'user': user, 'success': true });
  },
  async passwordRecover(ctx){
    const { email, gpid ,newPassword } = ctx.request.body;

    try {
      const entry = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: email}
      });

      if (entry && entry.gpid === gpid){
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        
        const updateEntry = strapi.db.query('plugin::users-permissions.user').update({
          where:{id:entry.id},
          data:{password: hashedPassword}
        });
        
        return ctx.send({'success':true,user:updateEntry});
        
      } else return ctx.send({message: `El correo o el GPID no corresponden con los registros`,success: false});
    } catch (error) {
      return ctx.badRequest('Error al actualizar el valor: '+error);
    }
  }
};

