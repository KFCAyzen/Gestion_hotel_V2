"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Employee {
    id: string;
    name: string;
    role: string;
    department: string;
}

interface ScheduleEntry {
    id: string;
    employeeId: string;
    date: string;
    shift: 'morning' | 'afternoon' | 'night';
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'confirmed' | 'absent';
}

export default function EmployeeSchedule() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [selectedWeek, setSelectedWeek] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        employeeId: '',
        date: '',
        shift: 'morning' as 'morning' | 'afternoon' | 'night',
        startTime: '08:00',
        endTime: '16:00'
    });

    useEffect(() => {
        loadEmployees();
        loadSchedule();
    }, []);

    const loadEmployees = () => {
        // Charger les employés depuis localStorage ou créer des exemples
        const savedEmployees = localStorage.getItem('employees');
        if (savedEmployees) {
            setEmployees(JSON.parse(savedEmployees));
        } else {
            const defaultEmployees: Employee[] = [
                { id: '1', name: 'Marie Dupont', role: 'Réceptionniste', department: 'Accueil' },
                { id: '2', name: 'Jean Martin', role: 'Femme de ménage', department: 'Entretien' },
                { id: '3', name: 'Sophie Bernard', role: 'Concierge', department: 'Services' },
                { id: '4', name: 'Pierre Durand', role: 'Maintenance', department: 'Technique' },
                { id: '5', name: 'Claire Moreau', role: 'Réceptionniste', department: 'Accueil' }
            ];
            setEmployees(defaultEmployees);
            localStorage.setItem('employees', JSON.stringify(defaultEmployees));
        }
    };

    const loadSchedule = () => {
        const savedSchedule = localStorage.getItem('employeeSchedule');
        if (savedSchedule) {
            setSchedule(JSON.parse(savedSchedule));
        }
    };

    const saveSchedule = (newScheduleData: ScheduleEntry[]) => {
        localStorage.setItem('employeeSchedule', JSON.stringify(newScheduleData));
        setSchedule(newScheduleData);
    };

    const getWeekDates = (date: Date) => {
        const week = [];
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Lundi

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            week.push(day);
        }
        return week;
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const getDayName = (date: Date) => {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return days[date.getDay()];
    };

    const getShiftColor = (shift: string) => {
        switch (shift) {
            case 'morning': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'afternoon': return 'bg-green-100 text-green-800 border-green-200';
            case 'night': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getShiftLabel = (shift: string) => {
        switch (shift) {
            case 'morning': return 'Matin';
            case 'afternoon': return 'Après-midi';
            case 'night': return 'Nuit';
            default: return shift;
        }
    };

    const addScheduleEntry = () => {
        if (!newSchedule.employeeId || !newSchedule.date) return;

        const entry: ScheduleEntry = {
            id: Date.now().toString(),
            employeeId: newSchedule.employeeId,
            date: newSchedule.date,
            shift: newSchedule.shift,
            startTime: newSchedule.startTime,
            endTime: newSchedule.endTime,
            status: 'scheduled'
        };

        const updatedSchedule = [...schedule, entry];
        saveSchedule(updatedSchedule);
        setShowAddModal(false);
        setNewSchedule({
            employeeId: '',
            date: '',
            shift: 'morning',
            startTime: '08:00',
            endTime: '16:00'
        });
    };

    const removeScheduleEntry = (id: string) => {
        if (confirm('Supprimer cette entrée du planning ?')) {
            const updatedSchedule = schedule.filter(entry => entry.id !== id);
            saveSchedule(updatedSchedule);
        }
    };

    const updateScheduleStatus = (id: string, status: 'scheduled' | 'confirmed' | 'absent') => {
        const updatedSchedule = schedule.map(entry =>
            entry.id === id ? { ...entry, status } : entry
        );
        saveSchedule(updatedSchedule);
    };

    const weekDates = getWeekDates(selectedWeek);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Planning des Employés</h2>
                    <p className="text-slate-600">Gestion des horaires et plannings hebdomadaires</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                    Ajouter au Planning
                </button>
            </div>

            {/* Navigation semaine */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => {
                            const prevWeek = new Date(selectedWeek);
                            prevWeek.setDate(selectedWeek.getDate() - 7);
                            setSelectedWeek(prevWeek);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    
                    <div className="text-center">
                        <h3 className="font-semibold text-slate-800">
                            Semaine du {weekDates[0].toLocaleDateString('fr-FR')} au {weekDates[6].toLocaleDateString('fr-FR')}
                        </h3>
                    </div>
                    
                    <button
                        onClick={() => {
                            const nextWeek = new Date(selectedWeek);
                            nextWeek.setDate(selectedWeek.getDate() + 7);
                            setSelectedWeek(nextWeek);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Planning hebdomadaire */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Employé</th>
                                {weekDates.map((date, index) => (
                                    <th key={index} className="px-4 py-3 text-center text-sm font-medium text-slate-700 min-w-[120px]">
                                        <div>{getDayName(date)}</div>
                                        <div className="text-xs text-slate-500">{date.getDate()}/{date.getMonth() + 1}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {employees.map((employee) => (
                                <tr key={employee.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <div className="font-medium text-slate-800">{employee.name}</div>
                                            <div className="text-sm text-slate-500">{employee.role}</div>
                                        </div>
                                    </td>
                                    {weekDates.map((date, dateIndex) => {
                                        const daySchedule = schedule.filter(
                                            entry => entry.employeeId === employee.id && 
                                            entry.date === formatDate(date)
                                        );
                                        
                                        return (
                                            <td key={dateIndex} className="px-2 py-3 text-center">
                                                <div className="space-y-1">
                                                    {daySchedule.map((entry) => (
                                                        <div
                                                            key={entry.id}
                                                            className={`px-2 py-1 rounded text-xs border ${getShiftColor(entry.shift)} relative group cursor-pointer`}
                                                            onClick={() => {
                                                                const newStatus = entry.status === 'scheduled' ? 'confirmed' : 
                                                                               entry.status === 'confirmed' ? 'absent' : 'scheduled';
                                                                updateScheduleStatus(entry.id, newStatus);
                                                            }}
                                                        >
                                                            <div>{getShiftLabel(entry.shift)}</div>
                                                            <div className="text-xs">{entry.startTime}-{entry.endTime}</div>
                                                            {entry.status === 'confirmed' && (
                                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                                                            )}
                                                            {entry.status === 'absent' && (
                                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeScheduleEntry(entry.id);
                                                                }}
                                                                className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Légende */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <h4 className="font-medium text-slate-800 mb-3">Légende</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Matin (8h-16h)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Après-midi (14h-22h)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Nuit (22h-6h)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Confirmé</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Absent</span>
                    </div>
                </div>
            </div>

            {/* Modal d'ajout */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Ajouter au Planning</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Employé</label>
                                <select
                                    value={newSchedule.employeeId}
                                    onChange={(e) => setNewSchedule({...newSchedule, employeeId: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Sélectionner un employé</option>
                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name} - {employee.role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={newSchedule.date}
                                    onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Équipe</label>
                                <select
                                    value={newSchedule.shift}
                                    onChange={(e) => setNewSchedule({...newSchedule, shift: e.target.value as 'morning' | 'afternoon' | 'night'})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="morning">Matin</option>
                                    <option value="afternoon">Après-midi</option>
                                    <option value="night">Nuit</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Heure début</label>
                                    <input
                                        type="time"
                                        value={newSchedule.startTime}
                                        onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Heure fin</label>
                                    <input
                                        type="time"
                                        value={newSchedule.endTime}
                                        onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={addScheduleEntry}
                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}