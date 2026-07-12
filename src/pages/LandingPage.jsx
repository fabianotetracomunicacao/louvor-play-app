import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Music, 
  Calendar, 
  Monitor, 
  Smartphone, 
  Users, 
  Search, 
  Play, 
  Edit3,
  Bell,
  CheckCircle, 
  ArrowRight,
  Shield,
  Layers,
  Zap,
  ChevronRight,
  ChevronDown,
  Star,
  Globe,
  Church,
  Sun,
  Moon,
  MessageCircle,
  Layout,
  RefreshCw,
  Maximize,
  Clock,
  Activity,
  Phone
} from 'lucide-react';

const WordRotator = ({ words }) => {
    const [index, setIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [currentWidth, setCurrentWidth] = useState('auto');
    const measureRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            // After fade out, change word and measure its width
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % words.length);
                setIsVisible(true);
            }, 600);
        }, 3000);

        return () => clearInterval(interval);
    }, [words.length]);

    // Measure the width of the current word whenever it changes
    useEffect(() => {
        if (measureRef.current) {
            const width = measureRef.current.offsetWidth;
            setCurrentWidth(width);
        }
    }, [index]);

    return (
        <span 
            className="inline-block relative overflow-visible transition-[width] duration-700 ease-in-out align-bottom"
            style={{ width: currentWidth !== 'auto' ? `${currentWidth}px` : 'auto' }}
        >
            {/* Hidden measurer to get the width of the word */}
            <span 
                ref={measureRef} 
                className="absolute invisible whitespace-nowrap opacity-0 pointer-events-none select-none"
                aria-hidden="true"
            >
                {words[index]}
            </span>

            {/* Visible Rotating word */}
            <span className={`inline-block whitespace-nowrap transition-all duration-700 ease-in-out transform bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 py-1 ${
                isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
            }`}>
                {words[index]}
            </span>
        </span>
    );
};

import mockupImg from '../assets/mockup.png';
import transpositionMockup from '../assets/transposition-mockup.png';
import churchProjectionMockup from '../assets/church-projection.png';
import playerFull from '../assets/player-full.png';
import playerSettings from '../assets/player-settings.png';
import cultModeMockup from '../assets/cult-mode-mockup.png';

import { useAuth } from '../contexts/AuthContext';

// Hook para animações de entrada ao rolar
function useScrollAnimation() {
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'lp-anim-styles';
        if (!document.getElementById('lp-anim-styles')) {
            style.textContent = `
                .lp-animate {
                    opacity: 0;
                    transform: translateY(40px);
                    transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
                }
                .lp-animate.lp-visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .lp-animate-delay-1 { transition-delay: 0.1s; }
                .lp-animate-delay-2 { transition-delay: 0.2s; }
                .lp-animate-delay-3 { transition-delay: 0.3s; }
                .lp-animate-delay-4 { transition-delay: 0.4s; }
                .lp-animate-delay-5 { transition-delay: 0.5s; }
            `;
            document.head.appendChild(style);
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('lp-visible');
                    }
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );

        // Use rAF + timeout to ensure full JSX render is done before querying
        const raf = requestAnimationFrame(() => {
            setTimeout(() => {
                const elements = document.querySelectorAll('.lp-animate');
                elements.forEach((el) => observer.observe(el));
            }, 100);
        });

        return () => {
            cancelAnimationFrame(raf);
            observer.disconnect();
            const s = document.getElementById('lp-anim-styles');
            if (s) s.remove();
        };
    }, []);
}

export function LandingPage() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [resourcesOpen, setResourcesOpen] = useState(false);
    const resourcesRef = useRef(null);

    // Auto-redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('landing-theme');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('landing-theme', JSON.stringify(isDarkMode));
        document.title = "LouvorPlay | Gestão de Louvor Profissional";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', 'A plataforma definitiva para músicos e igrejas gestionarem repertório, escalas e projeções em tempo real.');
        }
    }, [isDarkMode]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (resourcesRef.current && !resourcesRef.current.contains(e.target)) {
                setResourcesOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Smooth scroll handler
    const smoothScrollTo = useCallback((e, href) => {
        e.preventDefault();
        setResourcesOpen(false);
        const target = document.querySelector(href);
        if (target) {
            const navHeight = 80;
            const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }, []);

    // Activate scroll animations
    useScrollAnimation();

    const themeClass = isDarkMode ? 'dark bg-[#0F0F1A] text-white' : 'bg-slate-50 text-slate-900';

    return (
        <div className={`min-h-screen transition-colors duration-500 selection:bg-blue-500/30 ${themeClass}`}>
            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-500 ${
                isDarkMode ? 'bg-[#0F0F1A]/80 border-white/5' : 'bg-white/80 border-slate-200'
            }`}>
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <img src="/logo_official.png" alt="LouvorPlay" className="h-10 w-auto object-contain" />
                    </div>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <a href="#solucao" onClick={(e) => smoothScrollTo(e, '#solucao')} className={`hover:text-blue-500 transition ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Solução</a>

                        {/* Recursos Dropdown */}
                        <div className="relative" ref={resourcesRef}>
                            <button
                                onClick={() => setResourcesOpen(!resourcesOpen)}
                                className={`flex items-center gap-1.5 hover:text-blue-500 transition ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                            >
                                Recursos
                                <ChevronDown size={14} className={`transition-transform duration-200 ${resourcesOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {resourcesOpen && (
                                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-60 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
                                    isDarkMode ? 'bg-[#12121e] border-white/10' : 'bg-white border-slate-200'
                                }`}>
                                    <div className="p-2">
                                        {[
                                            { label: 'Player de Cifras', href: '#player-cifras', icon: Music },
                                            { label: 'Tonalidade Personalizada', href: '#musicalidade-elite', icon: Music },
                                            { label: 'Trabalho em Equipe', href: '#trabalho-equipe', icon: Users },
                                            { label: 'Gestão de Repertório', href: '#gestao-repertorio', icon: Layers },
                                            { label: 'Gestão Inteligente', href: '#gestao-inteligente', icon: Calendar },
                                            { label: 'Mídias e Telão', href: '#midias-telao', icon: Monitor },
                                        ].map((item, i) => (
                                            <a
                                                key={i}
                                                href={item.href}
                                                onClick={(e) => smoothScrollTo(e, item.href)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                                    isDarkMode
                                                        ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                                }`}
                                            >
                                                <item.icon size={14} className="text-blue-500" />
                                                {item.label}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <a href="#precos" onClick={(e) => smoothScrollTo(e, '#precos')} className={`hover:text-blue-500 transition ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Preços</a>
                        <a href="#depoimentos" onClick={(e) => smoothScrollTo(e, '#depoimentos')} className={`hover:text-blue-500 transition ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Depoimentos</a>
                        <a href="#contato" onClick={(e) => smoothScrollTo(e, '#contato')} className={`hover:text-blue-500 transition ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Contato</a>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-2.5 rounded-xl transition-all ${
                                isDarkMode 
                                ? 'bg-white/5 hover:bg-white/10 text-yellow-400' 
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            }`}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className={`hidden sm:block text-sm font-medium hover:text-blue-500 transition ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                        >
                            Entrar
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition shadow-lg shadow-blue-500/20"
                        >
                            Começar Agora
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-20">
                {/* 1. HERO SECTION */}
                <section className="relative overflow-hidden pt-20 pb-32 isolate">
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        {/* Video Background */}
                        <video 
                            autoPlay 
                            muted 
                            loop 
                            playsInline 
                            className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover"
                        >
                            <source src="/videos/hero-background.mp4" type="video/mp4" />
                        </video>
                        
                        {/* Overlays */}
                        {/* 1. Dark Overlay for readability */}
                        <div className={`absolute inset-0 transition-colors duration-1000 ${
                            isDarkMode ? 'bg-[#0F0F1A]/60' : 'bg-white/40'
                        }`}></div>
                        
                        {/* 2. Gradient Fade for session transition */}
                        <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-current transition-colors duration-1000 ${
                            isDarkMode ? 'text-[#0F0F1A]' : 'text-slate-50'
                        }`}></div>
                    </div>
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${
                            isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
                        }`}>
                            <Music size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">A Revolução do Louvor</span>
                        </div>
                        <h1 className="text-[40px] md:text-[77px] font-black mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 italic leading-tight">
                            Toque com mais foco.<br />
                            <span className="text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                Lidere com mais <WordRotator words={['Poder', 'Organização', 'Profissionalismo', 'Facilidade']} />.
                            </span>
                        </h1>
                        <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                            A plataforma definitiva para músicos e igrejas gestionarem repertório, 
                            escalas e projeções em tempo real. Tudo em um só lugar.
                        </p>

                        
                        {/* Hero Mockup */}
                        <div className="mt-20 relative animate-in fade-in zoom-in duration-1000 delay-500 max-w-5xl mx-auto">
                            <div className={`absolute inset-0 blur-[120px] -z-10 transition-opacity ${isDarkMode ? 'bg-blue-600/30 opacity-100' : 'bg-blue-600/10 opacity-50'}`}></div>
                            <div className={`border rounded-[2.5rem] p-4 shadow-2xl overflow-hidden transition-colors duration-500 overflow-hidden ${
                                isDarkMode ? 'bg-slate-900/50 border-white/10 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-blue-500/10'
                            }`}>
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-800">
                                    <iframe 
                                        className="absolute inset-0 w-full h-full"
                                        src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0" 
                                        title="Apresentação LouvorPlay" 
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. SOLUÇÃO COMPLETA */}
                <section id="solucao" className="py-24 relative">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-20 lp-animate">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 italic uppercase tracking-tighter">Uma solução pensada para cada necessidade</h2>
                            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Seja você um músico solo em busca de organização ou um líder de louvor 
                                gerindo uma equipe inteira, o LouvorPlay se adapta ao seu ritmo.
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8 lp-animate">

                            {/* Card 1 — Para o Músico Adorador */}
                            <div className="group relative rounded-[2.5rem] overflow-hidden min-h-[580px] flex flex-col justify-end cursor-default">
                                {/* Photo */}
                                <div className="absolute inset-0">
                                    <img
                                        src="/images/musico-adorador.jpg"
                                        alt="Músico Adorador"
                                        className="w-full h-full object-cover object-bottom scale-105 group-hover:scale-110 transition-transform duration-700 ease-out"
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/70 to-[#050508]/10" />
                                    {/* Blue tint glow */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-blue-700/30 to-transparent" />
                                </div>

                                {/* Border glow on hover */}
                                <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-white/10 group-hover:ring-blue-500/40 transition-all duration-500" />

                                {/* Floating content */}
                                <div className="relative z-10 p-8 md:p-10">
                                    {/* Badge */}
                                    <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1.5 rounded-full mb-5 backdrop-blur-sm">
                                        <Music size={13} />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Músico Solo</span>
                                    </div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-6 leading-tight">
                                        Para o<br />Músico Adorador
                                    </h3>
                                    <ul className="space-y-3">
                                        {[
                                            "Transposição de tom instantânea",
                                            "Diagramas de acordes sempre visíveis",
                                            "Criação de playlists pessoais",
                                            "Acesso offline via Progressive Web App",
                                            "Busca inteligente por aplicação litúrgica"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3">
                                                <CheckCircle size={15} className="text-blue-400 shrink-0" />
                                                <span className="text-slate-300 text-sm font-medium">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Card 2 — Para o Ministério da Igreja */}
                            <div className="group relative rounded-[2.5rem] overflow-hidden min-h-[580px] flex flex-col justify-end cursor-default">
                                {/* Photo */}
                                <div className="absolute inset-0">
                                    <img
                                        src="/images/ministerio-banda.jpg"
                                        alt="Ministério da Igreja"
                                        className="w-full h-full object-cover object-bottom scale-105 group-hover:scale-110 transition-transform duration-700 ease-out"
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/70 to-[#050508]/10" />
                                    {/* Purple tint glow */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-purple-700/30 to-transparent" />
                                </div>

                                {/* Border glow on hover */}
                                <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-white/10 group-hover:ring-purple-500/40 transition-all duration-500" />

                                {/* Floating content */}
                                <div className="relative z-10 p-8 md:p-10">
                                    {/* Badge */}
                                    <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 text-purple-300 px-3 py-1.5 rounded-full mb-5 backdrop-blur-sm">
                                        <Church size={13} />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Ministério</span>
                                    </div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-6 leading-tight">
                                        Para o<br />Ministério da Igreja
                                    </h3>
                                    <ul className="space-y-3">
                                        {[
                                            "Gestão de escalas de membros e instrumentos",
                                            "Projeção profissional de letras e multimídia",
                                            "Sessão Ao Vivo sincronizada para toda equipe",
                                            "Repertório compartilhado e centralizado",
                                            "Controle remoto da projeção via celular"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3">
                                                <CheckCircle size={15} className="text-purple-400 shrink-0" />
                                                <span className="text-slate-300 text-sm font-medium">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* 4-9. RECURSOS PRINCIPAIS */}
                <section id="recursos" className="py-24 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-20 lp-animate">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 italic uppercase tracking-tighter">Tudo o que você precisa em um só lugar</h2>
                            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Ferramentas profissionais desenhadas por músicos, para músicos. 
                                Do ensaio ao culto, estamos com você.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { icon: Music, color: 'blue', title: 'Cifrador & Player', desc: 'Transposição de tom em um clique, scroll automático inteligente e diagramas de acordes.', href: '#player-cifras' },
                                { icon: Monitor, color: 'purple', title: 'Projetor Profissional', desc: 'Diga adeus ao PowerPoint. Projete letras, mídias e versículos com temas dinâmicos.', href: '#midias-telao' },
                                { icon: Layers, color: 'emerald', title: 'Playlists & Setlists', desc: 'Organize seu repertório por cultos ou temas. Compartilhe as setlists com a equipe.', href: '#gestao-repertorio' },
                                { icon: Zap, color: 'orange', title: 'Sessão Ao Vivo', desc: 'Sincronize todos os músicos. O líder controla o tom e a posição da cifra em tempo real.', href: '#trabalho-equipe' },
                                { icon: Search, color: 'pink', title: 'Repertório Infinito', desc: 'Busque por milhares de músicas, filtre por aplicação e encontre as versões oficiais.', href: '#gestao-inteligente' },
                                { icon: Smartphone, color: 'indigo', title: 'Controle Remoto', desc: 'Controle a projeção na palma da mão usando seu celular via QR Code de qualquer lugar.', href: '#midias-telao' },
                                { icon: Edit3, color: 'amber', title: 'Editor Pro', desc: 'Editor de cifra com recursos avançados, transposição automática e formatação inteligente.', href: '#editor-avancado' },
                                { icon: Calendar, color: 'rose', title: 'Escalas & Equipe', desc: 'Gerenciamento completo de escalas de adoradores para cultos, ensaios e eventos.', href: '#gestao-escalas' },
                                { icon: Bell, color: 'teal', title: 'Notificações', desc: 'Sistema de notificação para manter a equipe sempre avisada sobre escalas e mudanças.', href: '#notificacoes' }
                            ].map((feature, i) => {
                                const colorMap = {
                                    blue: isDarkMode ? 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600',
                                    purple: isDarkMode ? 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600',
                                    emerald: isDarkMode ? 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
                                    orange: isDarkMode ? 'bg-orange-500/20 text-orange-400 group-hover:bg-orange-500' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-600',
                                    pink: isDarkMode ? 'bg-pink-500/20 text-pink-400 group-hover:bg-pink-500' : 'bg-pink-50 text-pink-600 group-hover:bg-pink-600',
                                    indigo: isDarkMode ? 'bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600',
                                    amber: isDarkMode ? 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-600',
                                    rose: isDarkMode ? 'bg-rose-500/20 text-rose-400 group-hover:bg-rose-500' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
                                    teal: isDarkMode ? 'bg-teal-500/20 text-teal-400 group-hover:bg-teal-500' : 'bg-teal-50 text-teal-600 group-hover:bg-teal-600',
                                    cyan: isDarkMode ? 'bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500' : 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600'
                                };

                                return (
                                <a key={i} href={feature.href} onClick={(e) => smoothScrollTo(e, feature.href)} className={`border p-8 rounded-[2.5rem] transition-all group block ${
                                    isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 hover:shadow-xl'
                                }`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition duration-300 ${colorMap[feature.color]} group-hover:text-white`}>
                                        <feature.icon size={24} />
                                    </div>
                                    <h4 className="text-xl font-bold mb-3 italic uppercase tracking-tighter">{feature.title}</h4>
                                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        {feature.desc}
                                    </p>
                                </a>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* SUBMENU DE RECURSOS */}
                <div className={`sticky top-0 z-30 border-b transition-colors ${isDarkMode ? 'bg-[#0A0A14]/80 backdrop-blur-xl border-white/5' : 'bg-white/80 backdrop-blur-xl border-slate-200'}`}>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-4 -mb-px">
                            {[
                                { label: 'Player de Cifras', href: '#player-cifras', icon: Music },
                                { label: 'Tonalidade Personalizada', href: '#musicalidade-elite', icon: Music },
                                { label: 'Trabalho em Equipe', href: '#trabalho-equipe', icon: Users },
                                { label: 'Gestão de Repertório', href: '#gestao-repertorio', icon: Layers },
                                { label: 'Gestão Inteligente', href: '#gestao-inteligente', icon: Calendar },
                                { label: 'Mídias e Telão', href: '#midias-telao', icon: Monitor },
                            ].map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    onClick={(e) => smoothScrollTo(e, item.href)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                                        isDarkMode
                                            ? 'text-slate-400 hover:text-white hover:bg-white/10'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <item.icon size={14} />
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 1. PLAYER DE CIFRAS */}
                <section id="player-cifras" className={`py-24 transition-colors ${
                    isDarkMode ? 'bg-white/5' : 'bg-white'
                }`}>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16 lp-animate">
                            <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full mb-6 ${
                                isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
                            }`}>
                                <Music size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Player de Cifras</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 italic uppercase tracking-tighter">Onde a técnica encontra a fluidez.</h2>
                            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Uma visualização pensada para o palco, eliminando distrações e focando no que realmente importa: o louvor.
                            </p>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
                            {/* Visual do Player */}
                            <div className="w-full lg:w-3/5 order-2 lg:order-1">
                                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group">
                                    <img src={playerFull} alt="Visualização do Player" className="w-full h-auto" />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                            </div>
                            
                            {/* Recursos do Player */}
                            <div className="w-full lg:w-2/5 order-1 lg:order-2 space-y-6">
                                {[
                                    { title: 'Tipografia de Fácil Leitura', desc: 'Fontes selecionadas para máxima clareza em qualquer distância ou dispositivo.' },
                                    { title: 'Destaques Inteligentes', desc: 'Acorde e refrões realçados para que você nunca se perca na estrutura.' },
                                    { title: 'Sessões e Dinâmicas', desc: 'Indicações claras de Intro, Solo, Refrão e a dinâmica instrumental de cada parte.' },
                                    { title: 'Fluxo da Setlist', desc: 'Saiba sua posição exata no repertório e conte com a troca automática para o próximo louvor.' },
                                    { title: 'Aprendizado Integrado', desc: 'Vídeos de aprendizado ou a música original diretamente na mesma página da cifra.' },
                                    { title: 'Modo Impressão Pro', desc: 'Recursos avançados para edição e impressão de cifras personalizadas.' },
                                    { title: 'Favoritos a um Toque', desc: 'Organize suas músicas prediletas com a opção de favoritar instantaneamente.' }
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="mt-1">
                                            <CheckCircle size={18} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold italic uppercase tracking-tighter text-sm mb-1">{feature.title}</h4>
                                            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ajustes e Personalização */}
                        <div className={`p-8 md:p-16 rounded-[4rem] border transition-all ${
                            isDarkMode ? 'bg-gradient-to-br from-white/5 to-transparent border-white/5' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <div className="flex flex-col lg:flex-row items-start gap-16">
                                <div className="w-full lg:w-2/3">
                                    <h3 className="text-2xl md:text-4xl font-black mb-4 italic uppercase tracking-tighter">Sua cifra, <span className="text-blue-500">do seu jeito.</span></h3>
                                    
                                    <div className={`mb-10 p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                <Music size={18} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-sm uppercase italic tracking-tighter">Rolagem de Precisão</h5>
                                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ajuste fino da velocidade para acompanhar sua execução. Controle total do tempo em suas mãos.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        {[
                                            { title: 'Modos Visuais', desc: 'Tema claro ou escuro para conforto em qualquer ambiente.', icon: <Moon size={14} /> },
                                            { title: 'Visualização de Tabs', desc: 'Opções para exibir ou ocultar tablaturas conforme sua necessidade.', icon: <Layout size={14} /> },
                                            { title: 'Transposição Inteligente', desc: 'Troque o tom e salve para seu perfil, para a igreja ou para a setlist do dia.', icon: <RefreshCw size={14} /> },
                                            { title: 'Sliders de Customização', desc: 'Tamanho da letra, tablatura, espaçamento e muito mais na ponta do dedo.', icon: <Maximize size={14} /> }
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="mt-1 text-blue-500">{item.icon}</div>
                                                <div>
                                                    <h5 className="font-bold text-xs uppercase mb-1 tracking-wider">{item.title}</h5>
                                                    <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Rolagem Milagrosa */}
                                    <div className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20 group">
                                        <div className="relative z-10">
                                            <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center shrink-0 shadow-inner">
                                                    <Zap size={32} className="fill-current text-yellow-300 animate-pulse" />
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Rolagem Milagrosa <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full align-middle ml-2 border border-white/20">v2.0 AI</span></h4>
                                                    <p className="text-blue-100 text-xs leading-relaxed max-w-lg">
                                                        Nossa inteligência exclusiva sincroniza o tempo da música com o tamanho da sua cifra. 
                                                        Esqueça de ficar ajustando a página com o dedo: Sua mão fica onde deve ficar, no instrumento.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-8">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-blue-200 font-bold italic uppercase text-[9px] tracking-widest">
                                                        <Clock size={12} /> Sincronia Rítmica
                                                    </div>
                                                    <p className="text-[10px] text-blue-100/70">Ajuste automático baseado no BPM real.</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-blue-200 font-bold italic uppercase text-[9px] tracking-widest">
                                                        <Activity size={12} /> Adaptive Flow
                                                    </div>
                                                    <p className="text-[10px] text-blue-100/70">Compensa espaçamentos e tablaturas.</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-blue-200 font-bold italic uppercase text-[9px] tracking-widest">
                                                        <CheckCircle size={12} /> Fim Inteligente
                                                    </div>
                                                    <p className="text-[10px] text-blue-100/70">Finaliza exatamente no último acorde.</p>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-4 border-t border-white/5 text-center">
                                                <p className="text-[10px] text-blue-200/60 italic">
                                                    Prefere o controle físico? O LouvorPlay é compatível com os principais pedais do mercado para ajuste de rolagem e troca de músicas.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full lg:w-1/3 flex justify-center lg:justify-end">
                                    <img 
                                        src={playerSettings} 
                                        alt="Menu de Ajustes" 
                                        className="w-full max-w-[260px] h-auto drop-shadow-2xl rounded-2xl transform lg:rotate-2 hover:rotate-0 transition duration-500" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. MUSICALIDADE DE ELITE */}
                <section id="musicalidade-elite" className={`py-24 relative ${isDarkMode ? 'bg-[#0F0F1A]' : 'bg-white'}`}>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                            <div className="flex-1">
                                <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full mb-6 ${
                                    isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
                                }`}>
                                    <Music size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Tonalidade Personalizada</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight italic uppercase tracking-tighter">O tom perfeito para cada momento.</h2>
                                <p className={`text-lg mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Fomos além de uma simples transposição. O LouvorPlay entende que o tom de uma música 
                                    pode mudar dependendo de quem canta e de qual evento se trata.
                                </p>
                                
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        { title: 'Tom Original', desc: 'O DNA da canção, definido pelo autor ou administrador.', icon: Shield, color: 'slate' },
                                        { title: 'Tom do Repertório', desc: 'A identidade do seu ministério. O padrão usado por toda a equipe.', icon: Church, color: 'purple' },
                                        { title: 'Tom da Escala', desc: 'Ajuste momentâneo para um vocalista específico em um culto.', icon: Calendar, color: 'blue' },
                                        { title: 'Meu Tom', desc: 'O conforto individual de cada músico no seu instrumento.', icon: Smartphone, color: 'emerald' }
                                    ].map((item, i) => (
                                        <div key={i} className={`p-6 border rounded-[2rem] transition-all hover:scale-[1.02] ${
                                            isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-sm'
                                        }`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                                                isDarkMode ? `bg-${item.color}-500/20 text-${item.color}-400` : `bg-${item.color}-50 text-${item.color}-600`
                                            }`}>
                                                <item.icon size={20} />
                                            </div>
                                            <h4 className="font-bold italic uppercase text-xs mb-2 tracking-tighter">{item.title}</h4>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex-1 relative">
                                <div className={`relative border rounded-[3rem] p-2 shadow-2xl overflow-hidden ${
                                    isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'
                                }`}>
                                    <div className={`absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-overlay`}></div>
                                    <img 
                                        src={transpositionMockup} 
                                        alt="Transposition Mockup" 
                                        className="w-full h-auto rounded-[2.5rem] shadow-inner"
                                    />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white animate-pulse shadow-2xl shadow-blue-500/50">
                                            <Music size={32} />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/20 blur-3xl -z-10 rounded-full"></div>
                                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-600/20 blur-3xl -z-10 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. TRABALHO EM EQUIPE */}
                <section id="trabalho-equipe" className={`py-24 transition-colors ${
                    isDarkMode ? 'bg-black' : 'bg-slate-900 text-white'
                }`}>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col lg:flex-row items-center gap-20">
                            <div className="w-full lg:w-1/2">
                                <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full mb-6 ${
                                    isDarkMode ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                }`}>
                                    <Users size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Trabalho em Equipe</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-8 italic uppercase tracking-tighter leading-tight">
                                    Modo Culto: <span className="text-purple-500">Sincronia Total na Equipe.</span>
                                </h2>
                                <p className="text-slate-400 mb-10 leading-relaxed text-sm md:text-base">
                                    Esqueça o "em que parte estamos?". Com o Modo Culto, um líder controla a navegação e todos os dispositivos conectados acompanham em tempo real.
                                </p>
                                
                                <div className="space-y-6">
                                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                            <Monitor size={24} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold uppercase italic text-sm mb-1">Controle de Mestre</h5>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Um único músico (líder) gerencia a troca de músicas, passagens e a rolagem para toda a banda simultaneamente.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                            <Smartphone size={24} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold uppercase italic text-sm mb-1">Indicador de Dispositivos</h5>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Visualize em tempo real quantos músicos estão conectados e sincronizados com a sessão ativa.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                            <Music size={24} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold uppercase italic text-sm mb-1">Rolagem Milagrosa Sincronizada</h5>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                A inteligência de rolagem funciona para todos, garantindo que o tempo da música seja o guia da equipe inteira.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full lg:w-1/2 relative">
                                <div className="absolute -inset-10 bg-purple-500/10 blur-[100px] rounded-full"></div>
                                <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl transform rotate-2 group hover:rotate-0 transition duration-700">
                                    <img src={cultModeMockup} alt="Sincronização Modo Culto" className="w-full h-auto" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. GESTÃO DE REPERTÓRIO */}
                <section id="gestao-repertorio" className={`py-24 overflow-hidden transition-colors ${
                    isDarkMode ? 'bg-gradient-to-b from-blue-600/5 to-transparent' : 'bg-slate-50'
                }`}>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16 lp-animate">
                            <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full mb-6 ${
                                isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}>
                                <Layers size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Gestão de Repertório</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 italic uppercase tracking-tighter">Onde a organização encontra a adoração.</h2>
                            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Centralize suas músicas e mantenha sua equipe em sintonia absoluta. 
                                Do estudo individual ao palco da igreja.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-16">
                            <div className={`p-8 md:p-12 rounded-[3rem] border transition-all ${
                                isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 hover:shadow-xl'
                            }`}>
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 mb-6">
                                    <Globe size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 italic uppercase tracking-tighter">Repertório Pessoal</h3>
                                <p className={`mb-6 text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Sua biblioteca privada. Salve suas cifras favoritas, organize suas playlists de estudo 
                                    e tenha acesso rápido às suas músicas sem interferir no grupo.
                                </p>
                                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                    Privacidade & Praticidade <ChevronRight size={14} />
                                </div>
                            </div>

                            <div className={`p-8 md:p-12 rounded-[3rem] border transition-all relative overflow-hidden group ${
                                isDarkMode ? 'bg-blue-600/10 border-blue-500/30' : 'bg-blue-600 text-white border-transparent'
                            }`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                                    isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-white/20 text-white'
                                }`}>
                                    <Users size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 italic uppercase tracking-tighter">Repertório de Igreja</h3>
                                <p className={`mb-6 text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-blue-50'}`}>
                                    O coração do seu ministério. Compartilhe um repertório centralizado com toda a equipe. 
                                    Mudanças de tom, arranjos e letras são sincronizadas instantaneamente para todos.
                                </p>
                                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-white'}`}>
                                    Colaboração Total <ChevronRight size={14} />
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -z-10 group-hover:bg-white/10 transition duration-500"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                            {[
                                { icon: MessageCircle, title: 'Chat Interno', desc: 'Discuta arranjos e dinâmicas diretamente na música.' },
                                { icon: Calendar, title: 'Escalas Integradas', desc: 'Saiba quem toca o quê e quando em cada repertório.' },
                                { icon: Layers, title: 'Setlists em Tempo Real', desc: 'O líder muda a música e todos acompanham o scroll.' },
                                { icon: Shield, title: 'Controle de Membros', desc: 'Gerencie permissões de edição e visualização da equipe.' }
                            ].map((res, i) => (
                                <div key={i} className="text-center md:text-left group">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto md:mx-0 mb-4 transition duration-300 ${
                                        isDarkMode ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                                    }`}>
                                        <res.icon size={20} />
                                    </div>
                                    <h4 className="font-bold italic uppercase text-xs mb-2 tracking-tighter">{res.title}</h4>
                                    <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{res.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 5. GESTÃO INTELIGENTE */}
                <section id="gestao-inteligente" className={`py-24 overflow-hidden transition-colors ${
                    isDarkMode ? 'bg-gradient-to-r from-blue-600/5 to-purple-600/5' : 'bg-slate-100'
                }`}>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row items-center gap-16">
                            <div className="flex-1">
                                <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full mb-6 ${
                                    isDarkMode ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-100 text-purple-600'
                                }`}>
                                    <Calendar size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Gestão Inteligente</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight italic uppercase tracking-tighter">Chega de confusão nas escalas pelo WhatsApp.</h2>
                                <p className={`text-lg mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Organize seu time com clareza. Escale músicos, defina instrumentos e mantenha 
                                    toda a equipe alinhada com notificações automáticas.
                                </p>
                                <div className="space-y-6">
                                    <div className={`flex gap-4 p-4 border rounded-2xl ${
                                        isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
                                    }`}>
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold italic uppercase text-sm">Equipes Dinâmicas</h4>
                                            <p className="text-xs text-slate-500">Gerencie quem toca em cada data com facilidade.</p>
                                        </div>
                                    </div>
                                    <div className={`flex gap-4 p-4 border rounded-2xl ${
                                        isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
                                    }`}>
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                            <Music size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold italic uppercase text-sm">Confirmação Automática</h4>
                                            <p className="text-xs text-slate-500">Músicos confirmam presença direto pelo sistema.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 relative">
                                <div className={`relative border rounded-[2rem] p-6 shadow-2xl max-w-md mx-auto transform rotate-2 transition-colors ${
                                    isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="font-bold italic uppercase text-sm">Próximos Cultos</h4>
                                        <div className="w-8 h-8 rounded-full bg-slate-800/20"></div>
                                    </div>
                                    {[
                                        { day: "DOM", date: "12 Abr", event: "Culto de Celebração", team: 5 },
                                        { day: "QUA", date: "15 Abr", event: "Noite de Adoração", team: 3 },
                                        { day: "SAB", date: "18 Abr", event: "Ensaio Geral", team: 8 }
                                    ].map((item, i) => (
                                        <div key={i} className={`flex items-center gap-4 p-4 border-b last:border-0 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                                            <div className="text-center">
                                                <span className="block text-[10px] text-slate-500 font-bold">{item.day}</span>
                                                <span className="block text-sm font-bold">{item.date}</span>
                                            </div>
                                            <div className="flex-1">
                                                <span className="block text-sm font-medium">{item.event}</span>
                                                <span className="text-[10px] text-purple-400 font-bold">{item.team} Músicos Escalados</span>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-600" />
                                        </div>
                                    ))}
                                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-600/20 blur-3xl -z-10"></div>
                                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-600/20 blur-3xl -z-10"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. MÍDIAS E TELÃO */}
                <section id="midias-telao" className={`py-24 transition-colors ${
                    isDarkMode ? 'bg-black' : 'bg-slate-900 text-white'
                }`}>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="w-full lg:w-1/2 relative group">
                                <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition duration-700"></div>
                                <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                                    <img 
                                        src={churchProjectionMockup} 
                                        alt="Projeção na Igreja" 
                                        className="w-full h-auto transform group-hover:scale-105 transition duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
                                                <Play size={20} className="text-white fill-current" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Live Agora</p>
                                                <p className="text-sm font-medium text-white/90">Sincronização Ativa com Toda a Equipe</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full lg:w-1/2">
                                <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full mb-6 ${
                                    isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                                }`}>
                                    <Monitor size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Mídias e Telão</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-8 italic uppercase tracking-tighter leading-tight">
                                    Experiência Imersiva no <span className="text-blue-500">Palco e na Nave.</span>
                                </h2>
                                
                                <div className="space-y-8">
                                    <div className="flex gap-4 group">
                                        <div className="mt-1 w-10 h-10 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition duration-300">
                                            <Smartphone size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold italic uppercase tracking-tighter mb-1">Controle Remoto Total</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed">
                                                Opere a projeção de qualquer lugar da igreja. Use seu celular ou tablet para passar os slides, 
                                                trocar backgrounds ou enviar alertas instantâneos sem precisar estar atrás do computador.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 group">
                                        <div className="mt-1 w-10 h-10 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition duration-300">
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold italic uppercase tracking-tighter mb-1">Backgrounds Dinâmicos</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed">
                                                Dê vida às letras com vídeos de fundo (motion backgrounds) e imagens em alta definição. 
                                                Nossa tecnologia garante transições suaves de fade que elevam o nível visual da adoração.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 group">
                                        <div className="mt-1 w-10 h-10 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition duration-300">
                                            <Music size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold italic uppercase tracking-tighter mb-1">Alertas e Cronômetros</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed">
                                                Banners de alerta para comunicados urgentes e contagem regressiva personalizada para o início do culto. 
                                                Tudo sincronizado e gerenciado em poucos cliques.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => navigate('/login')}
                                    className="mt-12 group flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs transition shadow-lg shadow-blue-500/20"
                                >
                                    Testar Projeção Agora
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>


                {/* 10. DEPOIMENTOS */}
                <section id="depoimentos" className={`py-24 transition-colors ${isDarkMode ? 'bg-gradient-to-b from-transparent to-white/5' : 'bg-white'}`}>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16 lp-animate">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 italic uppercase tracking-tighter">Quem usa, aprova</h2>
                            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Histórias de como o LouvorPlay transformou ministérios pelo Brasil.</p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { name: "Marcos Paulo", role: "Ministro de Louvor", church: "Igreja da Videira", text: "O LouvorPlay revolucionou nossa organização. Ter as escalas integradas com as cifras poupa horas de ensaio." },
                                { name: "Fernanda Costa", role: "Vocalista", church: "Batista da Lagoinha", text: "A facilidade de mudar o tom e compartilhar as setlists pelo celular é incrível. Nunca mais usamos papel." },
                                { name: "Gabriel Souza", role: "Tecladista", church: "Igreja do Nazareno", text: "O player integrado com as cifras ajuda muito nos ensaios individuais. O sistema é muito rápido e intuitivo." }
                            ].map((d, i) => (
                                <div key={i} className={`p-8 rounded-[3rem] transition-all relative overflow-hidden group border ${
                                    isDarkMode 
                                    ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/20' 
                                    : 'bg-white border-slate-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-2'
                                }`}>
                                    <div className="flex gap-1 mb-6">
                                        {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
                                    </div>
                                    <p className={`italic mb-10 leading-relaxed text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>"{d.text}"</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                                            {d.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-sm italic uppercase tracking-tighter">{d.name}</h5>
                                            <p className="text-[9px] text-blue-500 font-black tracking-widest uppercase">{d.role} • {d.church}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 11. PLANOS E PREÇOS */}
                <section id="precos" className={`py-24 transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16 lp-animate">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 italic uppercase tracking-tighter">Planos que cabem no seu ministério</h2>
                            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Escolha a melhor opção para você ou para sua igreja.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {[
                                { title: 'Individual Mensal', desc: 'A liberdade de assinar mês a mês.', price: '19,90', period: '/mês', features: ["Repertório Ilimitado", "Transposição de Tom", "Playlists Pessoais", "Acesso Offline"] },
                                { title: 'Individual Anual', desc: 'Melhor custo-benefício (PIX).', price: '190,00', period: '/ano', popular: true, features: ["Tudo do Mensal", "Economize 2 meses", "Suporte prioritário", "Acesso a novos betas"] },
                                { title: 'Plano Igreja', desc: 'Gestão completa do ministério.', price: 'Sob Consulta', period: '', color: 'purple', features: ["Múltiplos Músicos", "Gestão de Escalas", "Projeção Ilimitada", "Admin da Igreja", "Sessão Ao Vivo Sync"] }
                            ].map((plan, i) => (
                                <div key={i} className={`p-1 rounded-[3.5rem] transition-all relative ${
                                    plan.popular 
                                    ? 'bg-gradient-to-b from-blue-500 to-purple-600 shadow-2xl scale-105 z-10' 
                                    : 'bg-transparent shadow-sm'
                                }`}>
                                    <div className={`h-full w-full p-8 rounded-[3.4rem] flex flex-col ${
                                        isDarkMode ? 'bg-[#12121e]' : 'bg-white'
                                    }`}>
                                        {plan.popular && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-xl">
                                                Escolha dos Músicos
                                            </div>
                                        )}
                                        <h4 className="text-xl font-black mb-1 italic uppercase tracking-tighter text-blue-500">{plan.title}</h4>
                                        <p className="text-slate-500 text-[10px] mb-8 uppercase font-bold tracking-widest leading-none">{plan.desc}</p>
                                        
                                        <div className="mb-10">
                                            <div className="text-[10px] text-slate-400 uppercase font-black tracking-tighter mb-1">A partir de</div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black italic tracking-tighter">
                                                    {plan.price.includes('Sob') ? '' : 'R$'} {plan.price}
                                                </span>
                                                <span className="text-slate-500 text-xs font-bold">{plan.period}</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-4 mb-10 flex-1">
                                            {plan.features.map((f, j) => (
                                                <li key={j} className="flex items-start gap-2.5 text-xs">
                                                    <div className="mt-0.5">
                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                    </div>
                                                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{f}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <button 
                                            onClick={() => {
                                                if (plan.price.includes('Sob')) {
                                                    window.open('https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre o Plano Igreja do LouvorPlay.', '_blank');
                                                } else {
                                                    navigate('/login');
                                                }
                                            }}
                                            className={`w-full py-5 rounded-2xl font-black italic uppercase tracking-widest text-[11px] transition duration-300 flex items-center justify-center gap-2 group ${
                                                plan.popular 
                                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20' 
                                                : `${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`
                                            }`}
                                        >
                                            {plan.price.includes('Sob') && <MessageCircle size={16} className="group-hover:animate-bounce" />}
                                            {plan.price.includes('Sob') ? 'Consultar Especialista' : 'Começar Agora'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ SECTION */}
                <section className="py-24 transition-colors">
                    <div className="max-w-3xl mx-auto px-4">
                        <div className="text-center mb-16 lp-animate">
                            <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">Dúvidas Frequentes</h2>
                            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Tudo o que você precisa saber para começar seu ministério digital.</p>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { q: "Preciso de internet durante o culto?", a: "Não! O LouvorPlay salva automaticamente suas cifras e repertórios no dispositivo. Você pode abrir o app no modo offline com total segurança durante a ministração." },
                                { q: "Qual a diferença entre o plano Individual e Igreja?", a: "O plano Individual é focado no músico solo. O plano Igreja libera acessos múltiplos, permitindo que o líder crie as setlists e escalas e todos os músicos as vejam instantaneamente em seus aparelhos." },
                                { q: "O sistema sincroniza com pedais físicos?", a: "Sim! Somos compatíveis com os principais pedais do mercado (AirTurn, PageFlip, etc.) para troca de músicas e controle da rolagem automática via Bluetooth ou USB." },
                                { q: "Como funciona a transposição automática?", a: "Diferente de sistemas que apenas mudam o texto, nossa engine recalcula matematicamente cada acorde, garantindo que a transposição seja perfeita mesmo em cifras complexas com sétimas e nonas." }
                            ].map((item, i) => (
                                <div key={i} className={`p-6 rounded-3xl border transition-all ${
                                    isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
                                }`}>
                                    <h4 className="font-black italic uppercase tracking-tighter text-sm mb-3 flex items-center justify-between group cursor-pointer">
                                        {item.q}
                                        <ChevronRight size={16} className="text-blue-500 group-hover:translate-x-1 transition" />
                                    </h4>
                                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {item.a}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 text-center">
                            <p className="text-xs text-slate-500 mb-4 italic">Ainda tem dúvidas?</p>
                            <button 
                                onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                                className="text-blue-500 font-black italic uppercase tracking-widest text-[10px] hover:underline"
                            >
                                Falar com suporte no WhatsApp
                            </button>
                        </div>
                    </div>
                </section>

                {/* 12. CTA FINAL */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-blue-600/10 -z-10"></div>
                    
                    {/* Elementos decorativos de fundo */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -z-10"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10"></div>

                    <div className="max-w-5xl mx-auto px-4 text-center">
                        <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-blue-500">Transformação Inadiável</span>
                        </div>
                        <h2 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] italic uppercase tracking-tighter">
                            Eleve o nível do <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">seu louvor hoje</span>
                        </h2>
                        <p className={`text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            Junte-se a centenas de ministérios que já aposentaram as pastas de papel e revolucionaram seus cultos.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-12 py-6 rounded-full font-black italic uppercase tracking-[0.2em] text-lg transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-2xl shadow-blue-500/40"
                            >
                                Começar Agora Free
                            </button>
                            <button 
                                onClick={() => document.getElementById('precos').scrollIntoView({ behavior: 'smooth' })}
                                className={`px-12 py-6 rounded-full font-black italic uppercase tracking-[0.2em] text-lg transition-all duration-300 border ${
                                    isDarkMode ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-900'
                                }`}
                            >
                                Ver Planos
                            </button>
                        </div>
                        <p className="mt-8 text-[10px] text-slate-500 uppercase font-bold tracking-widest opacity-60">
                            Sem compromisso • Cancele quando quiser • Suporte Brasileiro
                        </p>
                    </div>
                </section>

                {/* CONTATO */}
                <section id="contato" className={`py-24 transition-colors ${
                    isDarkMode ? 'bg-[#0A0A14]' : 'bg-slate-50'
                }`}>
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <div className="lp-animate">
                            <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full mb-8 ${
                                isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}>
                                <Phone size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Fale Conosco</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-6">
                                Tem dúvidas? <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">A gente resolve.</span>
                            </h2>
                            <p className={`text-lg mb-12 max-w-xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Nossa equipe está disponível para ajudar seu ministério a tirar o máximo do LouvorPlay.
                                Mande uma mensagem e retornamos rapidinho!
                            </p>
                            <a
                                href="https://wa.me/5549988113082?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20o%20LouvorPlay."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-black italic uppercase tracking-[0.15em] text-base transition-all duration-300 bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 hover:scale-105"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                </svg>
                                Falar no WhatsApp
                            </a>
                            <p className="mt-6 text-xs text-slate-500 font-medium">(49) 98811-3082</p>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className={`py-12 border-t transition-colors ${isDarkMode ? 'bg-[#0F0F1A] border-white/5' : 'bg-white border-slate-200'}`}>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                            <div className="flex items-center gap-2">
                                <img 
                                    src="/logo_official.png" 
                                    alt="LouvorPlay" 
                                    className="h-8 w-auto object-contain opacity-80" 
                                />
                            </div>
                            <div className={`flex flex-wrap justify-center gap-6 text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                <a href="#solucao" onClick={(e) => smoothScrollTo(e, '#solucao')} className="hover:text-blue-500 transition">Solução</a>
                                <a href="#recursos" onClick={(e) => smoothScrollTo(e, '#recursos')} className="hover:text-blue-500 transition">Recursos</a>
                                <a href="#precos" onClick={(e) => smoothScrollTo(e, '#precos')} className="hover:text-blue-500 transition">Preços</a>
                                <a href="#depoimentos" onClick={(e) => smoothScrollTo(e, '#depoimentos')} className="hover:text-blue-500 transition">Depoimentos</a>
                                <a
                                    href="https://wa.me/5549988113082"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-emerald-500 transition"
                                >
                                    Contato
                                </a>
                            </div>
                            <div className={`text-xs font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                © {new Date().getFullYear()} Produzido por Ide! | TetraCom
                            </div>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
