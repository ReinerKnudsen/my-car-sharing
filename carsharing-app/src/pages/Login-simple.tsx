import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
} from '@ionic/react';

const Login: React.FC = () => {
  console.log('Login component rendering');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', email);
    alert(`Login: ${email}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Login - Simplified</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '40px' }}>
          <h1>CarSharing Login</h1>
          <p>Wenn Sie das sehen, funktioniert die Login-Seite grundsätzlich!</p>
          
          <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label>E-Mail:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label>Passwort:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                required
              />
            </div>
            
            <IonButton expand="block" type="submit">
              Anmelden
            </IonButton>
          </form>
          
          <p style={{ marginTop: '20px', color: '#666' }}>
            Noch kein Account? Kontaktieren Sie einen Administrator.
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;

