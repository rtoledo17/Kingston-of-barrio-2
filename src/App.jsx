import React, { useState } from 'react';
import { Trophy, Users, CalendarDays, Settings, Play, Plus, Trash2, Crown, Check, Unlock, Medal, Target } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('setup');
  
  // Estado de la aplicación
  const [numCourts, setNumCourts] = useState(4);
  const [teams, setTeams] = useState([
    { id: 1, p1: 'Roy', p2: 'Sergio' },
    { id: 2, p1: 'A Romero', p2: 'J Romero' },
    { id: 3, p1: 'Arturo', p2: 'Eddie' },
    { id: 4, p1: 'Iker', p2: 'Santi' },
    { id: 5, p1: 'Alan', p2: 'Cuadra' },
    { id: 6, p1: 'Javi', p2: 'Alex' },
    { id: 7, p1: 'Chuy', p2: 'Rodrigo' },
    { id: 8, p1: 'Miller', p2: 'Yusef' },
  ]);
  const [rounds, setRounds] = useState([]);
  const [tournamentStarted, setTournamentStarted] = useState(false);

  // Funciones de Configuración
  const addTeam = () => {
    const newId = teams.length > 0 ? Math.max(...teams.map(t => t.id)) + 1 : 1;
    setTeams([...teams, { id: newId, p1: '', p2: '' }]);
  };

  const removeTeam = (id) => {
    setTeams(teams.filter(t => t.id !== id));
  };

  const updateTeam = (id, field, value) => {
    setTeams(teams.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // Algoritmo Round Robin
  const generateTournament = () => {
    const validTeams = teams.filter(t => t.p1.trim() !== '' || t.p2.trim() !== '');
    if (validTeams.length < 2) {
      alert("Necesitas al menos 2 parejas para iniciar el torneo.");
      return;
    }

    let tournamentTeams = [...validTeams];
    if (tournamentTeams.length % 2 !== 0) {
      tournamentTeams.push({ id: 'bye', p1: 'Descanso', p2: '' });
    }

    const numRounds = tournamentTeams.length - 1;
    const matchesPerRound = tournamentTeams.length / 2;
    const generatedRounds = [];

    for (let r = 0; r < numRounds; r++) {
      const roundMatches = [];
      let courtCounter = 1;

      for (let m = 0; m < matchesPerRound; m++) {
        const t1 = tournamentTeams[m];
        const t2 = tournamentTeams[tournamentTeams.length - 1 - m];

        if (t1.id !== 'bye' && t2.id !== 'bye') {
          roundMatches.push({
            id: `r${r}-m${m}`,
            round: r + 1,
            court: courtCounter <= numCourts ? courtCounter : 'Espera',
            team1: t1,
            team2: t2,
            score1: '',
            score2: '', 
            finished: false
          });
          courtCounter++;
        }
      }
      generatedRounds.push(roundMatches);
      tournamentTeams.splice(1, 0, tournamentTeams.pop());
    }

    setRounds(generatedRounds);
    setTournamentStarted(true);
    setActiveTab('matches');
  };

  const resetTournament = () => {
    if(window.confirm('¿Estás seguro de reiniciar el torneo? Se perderán los resultados actuales.')) {
      setRounds([]);
      setTournamentStarted(false);
      setActiveTab('setup');
    }
  };

  // Funciones de Partidos
  const updateScore = (roundIndex, matchIndex, teamNum, value) => {
    const newRounds = [...rounds];
    newRounds[roundIndex][matchIndex][`score${teamNum}`] = value;
    setRounds(newRounds);
  };

  const toggleMatchStatus = (roundIndex, matchIndex) => {
    const newRounds = [...rounds];
    const match = newRounds[roundIndex][matchIndex];
    match.finished = !match.finished;
    setRounds(newRounds);
  };

  // Cálculo de Clasificaciones
  const getStandings = () => {
    const stats = {};
    
    teams.forEach(t => {
      if (t.p1.trim() !== '' || t.p2.trim() !== '') {
        stats[t.id] = { ...t, played: 0, wins: 0, losses: 0, draws: 0, scoreFor: 0, scoreAgainst: 0 };
      }
    });

    rounds.flat().forEach(m => {
      if (m.finished) {
        const s1 = parseInt(m.score1) || 0;
        const s2 = parseInt(m.score2) || 0;

        if(stats[m.team1.id]) stats[m.team1.id].played++;
        if(stats[m.team2.id]) stats[m.team2.id].played++;

        if(stats[m.team1.id]) {
          stats[m.team1.id].scoreFor += s1;
          stats[m.team1.id].scoreAgainst += s2;
        }
        if(stats[m.team2.id]) {
          stats[m.team2.id].scoreFor += s2;
          stats[m.team2.id].scoreAgainst += s1;
        }

        if (s1 > s2) {
          if(stats[m.team1.id]) stats[m.team1.id].wins++;
          if(stats[m.team2.id]) stats[m.team2.id].losses++;
        } else if (s2 > s1) {
          if(stats[m.team2.id]) stats[m.team2.id].wins++;
          if(stats[m.team1.id]) stats[m.team1.id].losses++;
        } else {
          if(stats[m.team1.id]) stats[m.team1.id].draws++;
          if(stats[m.team2.id]) stats[m.team2.id].draws++;
        }
      }
    });

    const statsArray = Object.values(stats);

    // Ordenar por Victorias
    const byWins = [...statsArray].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.draws !== a.draws) return b.draws - a.draws;
      const diffB = b.scoreFor - b.scoreAgainst;
      const diffA = a.scoreFor - a.scoreAgainst;
      return diffB - diffA;
    });

    // Ordenar por Puntos Acumulados
    const byPoints = [...statsArray].sort((a, b) => {
      if (b.scoreFor !== a.scoreFor) return b.scoreFor - a.scoreFor;
      const diffB = b.scoreFor - b.scoreAgainst;
      const diffA = a.scoreFor - a.scoreAgainst;
      if (diffB !== diffA) return diffB - diffA;
      return b.wins - a.wins;
    });

    return { byWins, byPoints };
  };

  const getRowStyle = (index) => {
    if (index === 0) return "bg-yellow-900/40 border-l-4 border-yellow-400"; 
    if (index === 1) return "bg-gray-700/60 border-l-4 border-gray-400"; 
    return "border-l-4 border-transparent hover:bg-gray-800/50 border-b border-gray-700/50";
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    return <span className="text-gray-500">{index + 1}</span>;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'setup':
        return (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Configuración Inicial
              </h2>
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-2">Número de Canchas</label>
                <input 
                  type="number" min="1" value={numCourts} 
                  onChange={(e) => setNumCourts(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-yellow-500"
                  disabled={tournamentStarted}
                />
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" /> Equipos ({teams.length})
                </h3>
                {!tournamentStarted && (
                  <button onClick={addTeam} className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded-lg text-sm flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Añadir
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {teams.map((team, index) => (
                  <div key={team.id} className="flex flex-col sm:flex-row gap-2 items-center bg-gray-900 p-3 rounded-xl border border-gray-700">
                    <span className="text-yellow-500 font-bold w-6 text-center">{index + 1}</span>
                    <input 
                      type="text" placeholder="Jugador 1" value={team.p1}
                      onChange={(e) => updateTeam(team.id, 'p1', e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-yellow-500 w-full"
                      disabled={tournamentStarted}
                    />
                    <input 
                      type="text" placeholder="Jugador 2" value={team.p2}
                      onChange={(e) => updateTeam(team.id, 'p2', e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-yellow-500 w-full"
                      disabled={tournamentStarted}
                    />
                    {!tournamentStarted && (
                      <button onClick={() => removeTeam(team.id)} className="text-red-400 hover:text-red-300 p-2">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!tournamentStarted ? (
                <button onClick={generateTournament} className="w-full mt-6 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-4 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg uppercase tracking-wide">
                  <Play className="w-6 h-6 fill-current" /> Generar Enfrentamientos
                </button>
              ) : (
                <button onClick={resetTournament} className="w-full mt-6 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                  Reiniciar Torneo
                </button>
              )}
            </div>
          </div>
        );

      case 'matches':
        if (!tournamentStarted) return (
          <div className="text-center py-20 animate-fade-in">
            <CalendarDays className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400">Torneo no iniciado</h2>
          </div>
        );

        return (
          <div className="w-full mx-auto space-y-12 animate-fade-in pb-24">
            {rounds.map((round, rIndex) => (
              <div key={rIndex} className="bg-transparent">
                <div className="flex items-center justify-center mb-6">
                  <h3 className="text-xl font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="bg-gray-800 px-6 py-2 rounded-full border border-gray-700 shadow-lg">Ronda {rIndex + 1}</span>
                  </h3>
                </div>
                
                {/* GRID RESPONSIVO AMPLIADO (Hasta 4 canchas o más) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                  {round.map((match, mIndex) => (
                    
                    // Diseño Visual de la Cancha (Horizontal)
                    <div key={match.id} className="relative w-full h-48 bg-gray-800 rounded-2xl shadow-2xl border-4 border-gray-700 overflow-hidden flex transition-all duration-300">
                      
                      {/* Líneas de la Cancha */}
                      <div className="absolute inset-2 border-2 border-yellow-500/30 pointer-events-none rounded"></div>
                      <div className="absolute top-2 bottom-2 left-1/2 w-0 border-l-2 border-dashed border-yellow-500/40 -translate-x-1/2 pointer-events-none"></div>
                      
                      {/* Cuadros de saque */}
                      <div className="absolute top-2 bottom-2 left-1/4 w-[1px] bg-yellow-500/10 pointer-events-none"></div>
                      <div className="absolute top-2 bottom-2 right-1/4 w-[1px] bg-yellow-500/10 pointer-events-none"></div>
                      <div className="absolute top-1/2 left-2 right-2 h-[1px] bg-yellow-500/10 -translate-y-1/2 pointer-events-none"></div>

                      {/* Etiqueta de la Cancha */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 text-yellow-500 text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1 rounded-b-lg border-b border-x border-gray-700 z-20 shadow-md whitespace-nowrap">
                        CANCHA {match.court}
                      </div>

                      {/* Equipo 1 (Izquierda) */}
                      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-2 pt-6">
                        <div className="text-center mb-2">
                          <p className={`font-bold text-sm sm:text-base leading-tight truncate w-full px-1 ${match.finished && match.score1 > match.score2 ? 'text-yellow-400' : 'text-gray-200'}`}>{match.team1.p1}</p>
                          <p className={`font-bold text-sm sm:text-base leading-tight truncate w-full px-1 ${match.finished && match.score1 > match.score2 ? 'text-yellow-400' : 'text-gray-200'}`}>{match.team1.p2}</p>
                        </div>
                        {match.finished ? (
                          <div className="text-3xl sm:text-4xl font-black text-white bg-gray-900/80 px-4 py-1 rounded-xl border border-gray-600">
                            {match.score1 || '0'}
                          </div>
                        ) : (
                          <input 
                            type="number" value={match.score1} onChange={(e) => updateScore(rIndex, mIndex, 1, e.target.value)}
                            placeholder="0"
                            className="w-14 sm:w-16 h-10 sm:h-12 text-xl sm:text-2xl text-center bg-gray-900 border-2 border-gray-600 text-yellow-400 rounded-xl focus:border-yellow-500 focus:outline-none placeholder-gray-700" 
                          />
                        )}
                      </div>

                      {/* Equipo 2 (Derecha) */}
                      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-2 pt-6">
                        <div className="text-center mb-2">
                          <p className={`font-bold text-sm sm:text-base leading-tight truncate w-full px-1 ${match.finished && match.score2 > match.score1 ? 'text-yellow-400' : 'text-gray-200'}`}>{match.team2.p1}</p>
                          <p className={`font-bold text-sm sm:text-base leading-tight truncate w-full px-1 ${match.finished && match.score2 > match.score1 ? 'text-yellow-400' : 'text-gray-200'}`}>{match.team2.p2}</p>
                        </div>
                        {match.finished ? (
                          <div className="text-3xl sm:text-4xl font-black text-white bg-gray-900/80 px-4 py-1 rounded-xl border border-gray-600">
                            {match.score2 || '0'}
                          </div>
                        ) : (
                          <input 
                            type="number" value={match.score2} onChange={(e) => updateScore(rIndex, mIndex, 2, e.target.value)}
                            placeholder="0"
                            className="w-14 sm:w-16 h-10 sm:h-12 text-xl sm:text-2xl text-center bg-gray-900 border-2 border-gray-600 text-yellow-400 rounded-xl focus:border-yellow-500 focus:outline-none placeholder-gray-700" 
                          />
                        )}
                      </div>

                      {/* Botón Central */}
                      <button 
                        onClick={() => toggleMatchStatus(rIndex, mIndex)}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] border-[3px] sm:border-4 transition-all duration-300 ${
                          match.finished 
                            ? 'bg-gray-800 border-green-500 text-green-500 hover:bg-gray-700 hover:scale-105' 
                            : 'bg-yellow-500 border-gray-900 text-gray-900 hover:bg-yellow-400 hover:scale-110'
                        }`}
                      >
                        {match.finished ? <Unlock className="w-4 h-4 sm:w-5 sm:h-5" /> : <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />}
                      </button>

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'standings':
        const { byWins, byPoints } = getStandings();
        return (
          <div className="max-w-7xl mx-auto animate-fade-in pb-24 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Tabla 1: Por Partidos Ganados */}
              <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden h-fit flex flex-col">
                <div className="bg-yellow-500 py-3 px-5 flex items-center justify-between border-b-2 border-yellow-600 shrink-0">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="w-5 h-5" /> Por Partidos Ganados
                  </h2>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="p-3 font-semibold text-center w-12">Pos</th>
                        <th className="p-3 font-semibold min-w-[140px]">Pareja</th>
                        <th className="p-3 font-semibold text-center" title="Partidos Jugados">PJ</th>
                        <th className="p-3 font-semibold text-center text-green-400" title="Ganados">G</th>
                        <th className="p-3 font-semibold text-center text-gray-400" title="Empatados">E</th>
                        <th className="p-3 font-semibold text-center text-red-400" title="Perdidos">P</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {byWins.map((team, index) => (
                        <tr key={`wins-${team.id}`} className={`transition-colors ${getRowStyle(index)}`}>
                          <td className="p-3 font-bold text-center flex justify-center">
                            {getRankIcon(index)}
                          </td>
                          <td className="p-3 font-bold text-white whitespace-nowrap">
                            {team.p1} <span className="text-gray-500 text-xs">/</span> {team.p2}
                          </td>
                          <td className="p-3 text-center text-gray-300">{team.played}</td>
                          <td className="p-3 text-center font-bold text-green-400">{team.wins}</td>
                          <td className="p-3 text-center text-gray-400">{team.draws}</td>
                          <td className="p-3 text-center text-red-400">{team.losses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla 2: Por Puntos Acumulados */}
              <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden h-fit flex flex-col">
                <div className="bg-gray-300 py-3 px-5 flex items-center justify-between border-b-2 border-gray-400 shrink-0">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-5 h-5" /> Por Puntos Acumulados
                  </h2>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="p-3 font-semibold text-center w-12">Pos</th>
                        <th className="p-3 font-semibold min-w-[140px]">Pareja</th>
                        <th className="p-3 font-semibold text-center" title="Partidos Jugados">PJ</th>
                        <th className="p-3 font-semibold text-center text-blue-400" title="Puntos a Favor">PF</th>
                        <th className="p-3 font-semibold text-center text-orange-400" title="Puntos en Contra">PC</th>
                        <th className="p-3 font-semibold text-center text-white" title="Diferencia de Puntos">DIF</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {byPoints.map((team, index) => (
                        <tr key={`pts-${team.id}`} className={`transition-colors ${getRowStyle(index)}`}>
                          <td className="p-3 font-bold text-center flex justify-center">
                            {getRankIcon(index)}
                          </td>
                          <td className="p-3 font-bold text-white whitespace-nowrap">
                            {team.p1} <span className="text-gray-500 text-xs">/</span> {team.p2}
                          </td>
                          <td className="p-3 text-center text-gray-300">{team.played}</td>
                          <td className="p-3 text-center font-bold text-blue-400">{team.scoreFor}</td>
                          <td className="p-3 text-center text-orange-400">{team.scoreAgainst}</td>
                          <td className="p-3 text-center font-bold text-white">{team.scoreFor - team.scoreAgainst}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-100 selection:bg-yellow-500 selection:text-gray-900">
      
      {/* Cabecera expandida a todo lo ancho para coincidir con las canchas */}
      <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-40">
        <div className="w-full max-w-[1920px] mx-auto px-4 py-4 flex justify-center items-center">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase flex items-center justify-center gap-2">
               Kings of Barrio <Crown className="text-yellow-500 w-7 h-7"/> Padel
            </h1>
            <p className="text-yellow-500 text-[10px] font-bold tracking-[0.4em] mt-1">TOURNAMENT SYSTEM</p>
          </div>
        </div>
      </header>

      {/* Contenedor Principal (w-full para ocupar toda la pantalla) */}
      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </main>

      {/* Navegación Móvil Inferior */}
      <nav className="fixed bottom-0 w-full bg-gray-950 border-t border-gray-800 z-50 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto flex justify-around p-2">
          <button onClick={() => setActiveTab('setup')} className={`flex flex-col items-center p-2 rounded-xl w-24 transition-colors ${activeTab === 'setup' ? 'text-yellow-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}>
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ajustes</span>
          </button>
          <button onClick={() => setActiveTab('matches')} className={`flex flex-col items-center p-2 rounded-xl w-24 transition-colors ${activeTab === 'matches' ? 'text-yellow-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}>
            <CalendarDays className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Partidos</span>
          </button>
          <button onClick={() => setActiveTab('standings')} className={`flex flex-col items-center p-2 rounded-xl w-24 transition-colors ${activeTab === 'standings' ? 'text-yellow-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}>
            <Trophy className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Tablas</span>
          </button>
        </div>
      </nav>

      {/* Estilos Extra */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .pb-safe { padding-bottom: max(env(safe-area-inset-bottom), 1rem); }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}} />
    </div>
  );
}
