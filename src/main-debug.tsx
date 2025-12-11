import React from 'react';
import { createRoot } from 'react-dom/client';

console.log('main.tsx is executing!');
console.log('Environment variables:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
});

const container = document.getElementById('root');
console.log('Root container:', container);

if (container) {
  const root = createRoot(container);
  console.log('Root created, rendering...');
  
  root.render(
    <React.StrictMode>
      <div style={{ padding: '20px' }}>
        <h1>Debug Mode Active</h1>
        <p>Die App lädt!</p>
        <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'FEHLT'}</p>
      </div>
    </React.StrictMode>
  );
  
  console.log('Render complete!');
} else {
  console.error('Root container not found!');
}

