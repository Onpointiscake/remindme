## Remindme app

Aplicación que envía recordatorios de tareas por email el dia concreto indicado por el usuario.

App creada con React y librería UI Ant design. Backend en Google Cloud


## Arquitectura

Se realiza una llamada API al Endpoint de una función serverless en GC, la cual inserta los datos del usuario en una SQL recogidos en el front end.

La tarea queda retenida en la base de datos hasta la fecha indicada.

Se crea un cron Job diario con el servicio Cloud Scheduler, que ejecuta un topic de PUB/SUB al cual está suscrito una segunda función.

Está segunda función hace query en las tareas y comprueba si hay alguna en la que la fecha de recordatorio coincide con la fecha del día actual. Si es así, manda esas tareas por email. 

Para enviar los emails se ha utilizado la API de Sendgrid. 

### See a Live Demo

(https://remindme.app)


### Función cloud para recibir los datos desde llamada API:

```javascript
// Código recibidor de la petición API del Front para insertar los datos en la SQL

const functions = require('@google-cloud/functions-framework');
const { Client } = require('pg');

const dbConfig = {
  user: process.env.USER,
  host: process.env.HOST, 
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
};

functions.http('insertData', async (req, res) => {  
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).send('Método no permitido'); return; }
  if (!req.body) { res.status(400).send('Cuerpo de la solicitud vacío'); return; }

  const { tarea, email, date } = req.body;

  if (!tarea || !email || !date) {
    res.status(400).send('Datos incompletos. Se requiere tarea, correo electrónico y fecha');
    return;
  }

  const client = new Client(dbConfig);

  try {
    await client.connect();
    const query = 'INSERT INTO tasks (tarea, email, date) VALUES ($1, $2, $3)';
    const values = [tarea, email, date];
    await client.query(query, values);
    res.status(200).send('Datos insertados con éxito: ' + tarea + ' ' + email + ' ' + date);
  } catch (err) {
    console.error('Error ejecutando la consulta', err.stack);
    res.status(500).send('Error insertando datos');
  } finally {
    await client.end();
  }

});
```

### Función cloud para hacer query a bbdd y enviar emails:

```javascript
const functions = require('@google-cloud/functions-framework');
const sgMail = require('@sendgrid/mail');
const { Client } = require('pg');

// Set the SendGrid API key
sgMail.setApiKey(process.env.SENDGRIG_API_KEY); // Replace with your actual SendGrid API key

// Database configuration
const dbConfig = {
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
};

// Define your Cloud Function
functions.http('queryData', async (req, res) => {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const query = 'SELECT * FROM tasks WHERE date = $1';
    const values = [today];
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      console.log('No hay tareas para hoy.');
      res.status(200).send('No hay tareas para hoy.');
    } else {
      console.log(`Emails listos para hoy: ${result.rows.length}`)
      for (const task of result.rows) {
        console.log('Enviando Email...');
        // Email sending code using SendGrid
        const msg = {
          to: task.email,
          from: 'reminmeapp@gmail.com', // Replace with your verified sender email in SendGrid
          subject: 'Remindme App',
          text: `Hola! Recuerda que para hoy...: ${task.tarea}`,
        };
        try {
          await sgMail.send(msg);
          console.log('Email sent successfully');
        } catch (error) {
          console.error('Error sending email:', error);
        }
      }
      res.status(200).send(`OK`);
    }

  } catch (err) {
    console.error('Error ejecutando la consulta', err.stack);
    res.status(500).send('Error ejecutando la consulta');
  } finally {
    await client.end();
  }
});



