import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, Music, ListMusic, TrendingUp, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';

export function AdminReportsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState({
        totalSongs: 0,
        totalPlays: 0,
        totalUsers: 0,
        usersByRole: {},
        playlistsByType: {}
    });
    const [topSongs, setTopSongs] = useState([]);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        setLoading(true);
        try {
            // Fetch all statistics in parallel
            const [
                { data: totalSongs },
                { data: totalPlays },
                { data: topSongsData },
                { data: userCounts },
                { data: playlistCounts },
                allUsersResponse
            ] = await Promise.all([
                supabase.rpc('get_total_songs'),
                supabase.rpc('get_total_plays'),
                supabase.rpc('get_top_songs', { limit_count: 100 }),
                supabase.rpc('get_user_counts_by_role'),
                supabase.rpc('get_playlist_counts'),
                supabase.from('profiles').select('id', { count: 'exact', head: true })
            ]);

            // Process user counts by role
            const usersByRole = {};
            if (userCounts) {
                userCounts.forEach(({ role, count }) => {
                    usersByRole[role] = parseInt(count);
                });
            }

            // Process playlist counts by type
            const playlistsByType = {};
            if (playlistCounts) {
                playlistCounts.forEach(({ type, count }) => {
                    playlistsByType[type] = parseInt(count);
                });
            }

            setStatistics({
                totalSongs: totalSongs || 0,
                totalPlays: totalPlays || 0,
                totalUsers: allUsersResponse?.count || 0,
                usersByRole,
                playlistsByType
            });

            setTopSongs(topSongsData || []);
        } catch (error) {
            console.error('Error loading statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <BarChart3 size={32} className="text-purple-400" />
                            Relatórios do Sistema
                        </h1>
                        <p className="text-slate-400 mt-1">Estatísticas e métricas da plataforma</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Songs */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Music className="text-blue-400" size={24} />
                            <span className="text-xs text-slate-400 uppercase font-bold">Total</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{statistics.totalSongs.toLocaleString()}</div>
                        <div className="text-sm text-slate-400 mt-1">Músicas Cadastradas</div>
                    </div>

                    {/* Total Plays */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="text-green-400" size={24} />
                            <span className="text-xs text-slate-400 uppercase font-bold">Total</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{statistics.totalPlays.toLocaleString()}</div>
                        <div className="text-sm text-slate-400 mt-1">Músicas Tocadas</div>
                    </div>

                    {/* Total Users */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="text-purple-400" size={24} />
                            <span className="text-xs text-slate-400 uppercase font-bold">Total</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{statistics.totalUsers.toLocaleString()}</div>
                        <div className="text-sm text-slate-400 mt-1">Usuários</div>
                    </div>

                    {/* Total Playlists */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <ListMusic className="text-orange-400" size={24} />
                            <span className="text-xs text-slate-400 uppercase font-bold">Total</span>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {Object.values(statistics.playlistsByType).reduce((a, b) => a + b, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">Playlists</div>
                    </div>
                </div>

                {/* Detailed Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Users by Role */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Users size={20} className="text-purple-400" />
                            Usuários por Tipo
                        </h2>
                        <div className="space-y-3">
                            {(() => {
                                // Role translation and priority
                                const roleTranslation = {
                                    'admin': 'Administrador',
                                    'editor': 'Editor',
                                    'musician': 'Músico'
                                };
                                const rolePriority = { 'admin': 3, 'editor': 2, 'musician': 1 };

                                // Sort roles by priority (Admin > Editor > Musician)
                                return Object.entries(statistics.usersByRole)
                                    .sort(([roleA], [roleB]) => {
                                        return (rolePriority[roleB] || 0) - (rolePriority[roleA] || 0);
                                    })
                                    .map(([role, count]) => (
                                        <div key={role} className="flex items-center justify-between">
                                            <span className="text-slate-300">{roleTranslation[role] || role}</span>
                                            <span className="text-white font-bold">{count.toLocaleString()}</span>
                                        </div>
                                    ));
                            })()}
                        </div>
                    </div>

                    {/* Playlists by Type */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ListMusic size={20} className="text-orange-400" />
                            Playlists por Tipo
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-300">Públicas</span>
                                <span className="text-white font-bold">{(statistics.playlistsByType.public || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-300">Colaborativas</span>
                                <span className="text-white font-bold">{(statistics.playlistsByType.collaborative || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-300">Privadas</span>
                                <span className="text-white font-bold">{(statistics.playlistsByType.private || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top 100 Songs */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-400" />
                        Top 100 Músicas Mais Tocadas
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">#</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Título</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Artista</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-semibold">Visualizações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topSongs.map((song, index) => (
                                    <tr key={song.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                                        <td className="py-3 px-4 text-slate-300">{index + 1}</td>
                                        <td className="py-3 px-4 text-white font-medium">{song.title}</td>
                                        <td className="py-3 px-4 text-slate-300">{song.artist}</td>
                                        <td className="py-3 px-4 text-right text-green-400 font-bold">{song.views.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
