"use client";
import { useState, } from 'react';
import axios from 'axios';
import { DatePicker, Button, Input, Alert } from 'antd';
import { ArrowDownOutlined, SignatureOutlined , ClockCircleOutlined } from '@ant-design/icons';
import styles from "./page.module.css";

export default function Home() {
  const [task, setTask] = useState('');
  const [email, setEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  const handleTaskChange = (e) => {
    setTask(e.target.value);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowConfirmation(true);
  };

  const handleRemindMeClick = () => {
    const selectedDateString = selectedDate.toISOString().slice(0, 10);

    const data = {
      tarea: task,
      email: email,
      date: selectedDateString
    };
 
    axios.post('process.env.CLOUD_FUNCTION', data)
      .then(response => {
        console.log('Respuesta del servidor:', response.data);
        // Resetear campos después de enviar los datos
        setTask('');
        setEmail('');
        setSelectedDate(null);
        setShowConfirmation(false);
        setMostrarAlerta(true);
      })
      .catch(error => {
        console.error('Error al enviar datos:', error);
      });
  };

  return (
    <main className={styles.main}>
      <div className={styles.description} >
        <h1>REMINDME <SignatureOutlined spin={false} /></h1>
        <div>
          <a
            href="https://javiersuarezportfolio.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{" "}
           <h2>Javier Suarez</h2>
          </a>
        </div>
        
      </div>

      <Input placeholder="Me debo acordar de..." value={task} onChange={handleTaskChange} ></Input>
      <DatePicker placeholder="¿Cuándo?" onChange={handleDateChange} />
      
      {showConfirmation && (
        <div className={`confirmation-text ${showConfirmation ? 'active' : ''}`}>
          <h4>De acuerdo, te mandaremos recordatorio.</h4>
         
        </div>
        )}

        {showConfirmation && (
          <div style={{textAlign: 'center}', marginBottom: '-2.5em'}}><ArrowDownOutlined style={{ fontSize: '4em', color: '#1777FF' }} /></div>
        )}

      <div className={styles.center}>
        <Input placeholder="¿A qué email?" value={email} onChange={handleEmailChange} ></Input>
        <Button onClick={handleRemindMeClick}>REMINDME</Button>
      </div>
      {mostrarAlerta && <Alert showIcon message="Hecho! Te llegará un email cuando llegue el dia de la tarea" type="success" />}
    </main>
  );
}
