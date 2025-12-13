import React, { useState, useMemo } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { chevronBack, chevronForward } from 'ionicons/icons';
import { Booking } from '../types';

interface BookingCalendarProps {
  bookings: Booking[];
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ 
  bookings, 
  onDateSelect, 
  selectedDate 
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Heute als lokalen String (ohne Zeitzone-Probleme)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Hilfsfunktion: Generiert alle Tage zwischen zwei Datumsstrings
  const getDaysBetween = (startStr: string, endStr: string): string[] => {
    const days: string[] = [];
    const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
    
    // Lokale Datumsobjekte (ohne Zeitzone-Probleme)
    const current = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Berechne welche Tage Buchungen haben und welche "Durchgangstage" sind
  const { bookedDays, fullDays } = useMemo(() => {
    const booked = new Set<string>();
    const full = new Set<string>(); // Tage, die 24h durchgebucht sind
    
    bookings.forEach(booking => {
      const days = getDaysBetween(booking.start_datum, booking.ende_datum);
      
      days.forEach((dateStr, index) => {
        booked.add(dateStr);
        
        // Prüfe ob es ein "Durchgangstag" ist (nicht erster, nicht letzter)
        const isFirstDay = index === 0;
        const isLastDay = index === days.length - 1;
        
        if (!isFirstDay && !isLastDay) {
          // Mittlerer Tag = 24h gebucht
          full.add(dateStr);
        }
      });
    });
    
    return { bookedDays: booked, fullDays: full };
  }, [bookings]);

  // Hilfsfunktion: Formatiere Datum als YYYY-MM-DD String (lokal, keine Zeitzone)
  const formatDateString = (year: number, month: number, day: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Kalender-Daten generieren
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Montag = 0
    
    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];
    
    // Leere Tage am Anfang (Tage des Vormonats)
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(currentYear, currentMonth, -startDayOfWeek + i + 1);
      days.push({
        date: formatDateString(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate()),
        day: prevDate.getDate(),
        isCurrentMonth: false
      });
    }
    
    // Tage des aktuellen Monats
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({
        date: formatDateString(currentYear, currentMonth, day),
        day,
        isCurrentMonth: true
      });
    }
    
    return days;
  }, [currentMonth, currentYear]);

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDayStyle = (date: string, isCurrentMonth: boolean) => {
    const isToday = date === todayStr;
    const isBooked = bookedDays.has(date);
    const isSelected = date === selectedDate;

    let backgroundColor = 'transparent';
    let color = isCurrentMonth ? '#333' : '#ccc';
    let border = 'none';
    let fontWeight = 'normal';

    if (isBooked && isCurrentMonth) {
      backgroundColor = '#e0e0e0'; // Grau für gebuchte Tage
      color = '#333';
    }

    if (isToday) {
      border = '2px solid var(--ion-color-primary)';
      fontWeight = 'bold';
    }

    if (isSelected) {
      backgroundColor = 'var(--ion-color-primary)';
      color = 'white';
    }

    return {
      backgroundColor,
      color,
      border,
      fontWeight,
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isCurrentMonth ? 'pointer' : 'default',
      margin: '2px auto',
    };
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Header mit Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        border: '1px solid var(--ion-color-medium)',
        borderRadius: '8px',
      }}>
        {/* Zurück-Button nur anzeigen wenn nicht im aktuellen Monat */}
        {currentMonth === today.getMonth() && currentYear === today.getFullYear() ? (
          <div style={{ width: '48px' }}></div>
        ) : (
          <IonButton fill="clear" onClick={goToPrevMonth}>
            <IonIcon icon={chevronBack} />
          </IonButton>
        )}
        <h2 style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold' }}>
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <IonButton fill="clear" onClick={goToNextMonth}>
          <IonIcon icon={chevronForward} />
        </IonButton>
      </div>

      {/* Wochentage Header */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        textAlign: 'center',
        marginBottom: '8px',
        fontWeight: 'bold',
        border: '1px solid var(--ion-color-medium)',
        borderRadius: '8px',
        color: '#666'
      }}>
        {weekDays.map(day => (
          <div key={day} style={{ padding: '8px 0' }}>{day}</div>
        ))}
      </div>

      {/* Kalender-Tage */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        textAlign: 'center',
      }}>
        {calendarDays.map(({ date, day, isCurrentMonth }) => (
          <div 
            key={date}
            onClick={() => isCurrentMonth && onDateSelect(date)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              padding: '2px 0',
              cursor: isCurrentMonth ? 'pointer' : 'default'
            }}
          >
            <div style={getDayStyle(date, isCurrentMonth)}>
              {day}
            </div>
            {/* Pfeil für 24h-Durchgangstage */}
            {isCurrentMonth && fullDays.has(date) && (
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--ion-color-primary)',
                marginTop: '-4px',
                fontWeight: 'bold'
              }}>
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legende */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '12px', 
        marginTop: '16px',
        justifyContent: 'center',
        border: '1px solid var(--ion-color-medium)',
        borderRadius: '8px',
        padding: '8px 0px',
        fontSize: '0.85em',
        color: '#666'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: '#e0e0e0',
            borderRadius: '50%'
          }}></div>
          <span>Gebucht</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid var(--ion-color-primary)',
            borderRadius: '50%'
          }}></div>
          <span>Heute</span>
        </div>

      </div>
    </div>
  );
};

export default BookingCalendar;

