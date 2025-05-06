import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { QuestionMarkCircleIcon, MapPinIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

interface TimeSlot {
  time: string;
  shift: 'morning' | 'afternoon';
}

interface AvailableTimes {
  [key: string]: TimeSlot[];
}

const availableTimes: AvailableTimes = {
  '2025-05-12': [
    { time: '09:00', shift: 'morning' },
    { time: '10:30', shift: 'morning' },
    { time: '14:00', shift: 'afternoon' },
  ],
  '2025-05-15': [
    { time: '11:00', shift: 'morning' },
    { time: '15:30', shift: 'afternoon' },
  ],
  '2025-05-20': [
    { time: '09:30', shift: 'morning' },
    { time: '16:00', shift: 'afternoon' },
  ],
};

const professionals = [
  { id: '1', name: 'Dr. João Silva', specialty: 'Oftalmologista', photo: 'placeholder' },
  { id: '2', name: 'Dra. Maria Oliveira', specialty: 'Oftalmologista', photo: 'placeholder' },
];

const upcomingConsultations = [
  { date: '20/05/2025', time: '15:00', professional: 'Dr. João Silva', location: 'Ótica Centro – Florianópolis' },
];

const pastConsultations = [
  { date: '10/04/2025', time: '14:00', professional: 'Dra. Maria Oliveira', location: 'Ótica Sul – Florianópolis', canReview: true },
];

const availableDates = [
  new Date(2025, 4, 12),
  new Date(2025, 4, 15),
  new Date(2025, 4, 20),
];

export default function ConsultationScheduler() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [shiftFilter, setShiftFilter] = useState<'morning' | 'afternoon' | null>(null);

  const filteredTimes = selectedDate
    ? (availableTimes[selectedDate.toISOString().split('T')[0]] || [])
        .filter((slot: TimeSlot) => !shiftFilter || slot.shift === shiftFilter)
    : [];

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const formattedDate = selectedDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const professionalName = selectedProfessional || professionals[0]?.name;
      alert(`Você marcou consulta com ${professionalName}, dia ${formattedDate} às ${selectedTime}`);
    }
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some(
      (d) =>
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">Minhas Consultas</h1>
        <QuestionMarkCircleIcon className="w-6 h-6 text-secondary cursor-pointer" />
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Selecione uma Data</h2>
        <Calendar
          onChange={(value: Date | null) => setSelectedDate(value)}
          value={selectedDate}
          tileClassName={({ date }) =>
            isDateAvailable(date) ? 'bg-primary text-white rounded-full' : ''
          }
          className="border-none shadow-lg rounded-2xl p-4 w-full"
        />
      </div>
      {selectedDate && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Horários Disponíveis</h2>
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setShiftFilter(shiftFilter === 'morning' ? null : 'morning')}
              className={`px-4 py-2 rounded-full text-sm ${
                shiftFilter === 'morning' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              Manhã
            </button>
            <button
              onClick={() => setShiftFilter(shiftFilter === 'afternoon' ? null : 'afternoon')}
              className={`px-4 py-2 rounded-full text-sm ${
                shiftFilter === 'afternoon' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              Tarde
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredTimes.length > 0 ? (
              filteredTimes.map((slot: TimeSlot, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`px-4 py-2 rounded-full text-sm ${
                    selectedTime === slot.time
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {slot.time}
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-600">Nenhum horário disponível para esta data.</p>
            )}
          </div>
        </div>
      )}
      {selectedTime && professionals.length > 1 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Selecionar Profissional</h2>
          <div className="space-y-2">
            {professionals.map((prof) => (
              <button
                key={prof.id}
                onClick={() => setSelectedProfessional(prof.name)}
                className={`flex items-center w-full p-4 rounded-2xl shadow-md ${
                  selectedProfessional === prof.name ? 'bg-gray-100' : 'bg-white'
                } hover:bg-gray-100 transition`}
              >
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">{prof.name}</p>
                  <p className="text-xs text-gray-600">{prof.specialty}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {selectedTime && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Endereço da Consulta</h2>
          <div className="bg-white p-4 rounded-2xl shadow-md">
            <div className="flex items-center mb-2">
              <MapPinIcon className="w-5 h-5 text-primary mr-2" />
              <p className="text-sm font-medium text-gray-800">Ótica Centro – Florianópolis</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">Rua das Flores, 123, Centro, Florianópolis - SC</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Rua+das+Flores,123,Centro,Florianópolis,SC"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-secondary text-white px-4 py-2 rounded-full text-sm hover:bg-opacity-80 transition"
            >
              Como chegar
            </a>
          </div>
        </div>
      )}
      {selectedTime && (
        <div className="mb-6">
          <div className="bg-gray-100 p-4 rounded-2xl mb-4">
            <p className="text-sm text-gray-800">
              Você marcou consulta com {selectedProfessional || professionals[0]?.name}, dia{' '}
              {selectedDate?.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}{' '}
              às {selectedTime}
            </p>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full bg-primary text-white px-4 py-3 rounded-full text-sm hover:bg-opacity-80 transition"
          >
            Confirmar Consulta
          </button>
        </div>
      )}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Consultas Futuras</h2>
        {upcomingConsultations.length > 0 ? (
          upcomingConsultations.map((consultation, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl shadow-md mb-2">
              <div className="flex items-center mb-2">
                <ClockIcon className="w-5 h-5 text-primary mr-2" />
                <p className="text-sm text-gray-800">
                  {consultation.date} às {consultation.time}
                </p>
              </div>
              <div className="flex items-center">
                <UserIcon className="w-5 h-5 text-primary mr-2" />
                <p className="text-sm text-gray-800">{consultation.professional}</p>
              </div>
              <p className="text-sm text-gray-600 mt-1">{consultation.location}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">Nenhuma consulta futura agendada.</p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Histórico de Consultas</h2>
        {pastConsultations.length > 0 ? (
          pastConsultations.map((consultation, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl shadow-md mb-2">
              <div className="flex items-center mb-2">
                <ClockIcon className="w-5 h-5 text-primary mr-2" />
                <p className="text-sm text-gray-800">
                  {consultation.date} às {consultation.time}
                </p>
              </div>
              <div className="flex items-center">
                <UserIcon className="w-5 h-5 text-primary mr-2" />
                <p className="text-sm text-gray-800">{consultation.professional}</p>
              </div>
              <p className="text-sm text-gray-600 mt-1">{consultation.location}</p>
              <div className="flex space-x-2 mt-2">
                <button className="text-secondary text-sm hover:underline">Reagendar</button>
                {consultation.canReview && (
                  <button className="text-secondary text-sm hover:underline">Avaliar</button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">Nenhum histórico de consultas.</p>
        )}
      </div>
    </div>
  );
}