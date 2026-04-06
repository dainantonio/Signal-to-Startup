import React from 'react';
import { motion } from 'motion/react';
import { PitchDeckData } from './types';
import { Target, Users, Zap, Briefcase, TrendingUp, DollarSign, Crosshair, Map, Network } from 'lucide-react';

export const PitchDeckViewer = ({ deck }: { deck: PitchDeckData }) => {
  const slides = [
    {
      id: 'title',
      title: deck.title.company_name,
      subtitle: deck.title.one_liner,
      icon: <Zap className="w-16 h-16 text-primary opacity-50" />,
      content: null,
      bg: 'bg-primary text-primary-foreground',
    },
    {
      id: 'problem',
      title: 'The Problem',
      subtitle: 'What is broken in the world today.',
      icon: <Target className="w-8 h-8 text-red-500" />,
      content: deck.problem,
      bg: 'bg-white',
    },
    {
      id: 'solution',
      title: 'Our Solution',
      subtitle: 'How we systematically solve this.',
      icon: <Zap className="w-8 h-8 text-primary" />,
      content: deck.solution,
      bg: 'bg-white',
    },
    {
      id: 'market',
      title: 'Market Size',
      subtitle: deck.market_size.explanation,
      icon: <Crosshair className="w-8 h-8 text-emerald-500" />,
      content: [
        `TAM: ${deck.market_size.tam} (Total Addressable)`,
        `SAM: ${deck.market_size.sam} (Serviceable Addressable)`,
        `SOM: ${deck.market_size.som} (Serviceable Obtainable)`
      ],
      bg: 'bg-slate-50',
    },
    {
      id: 'business',
      title: 'Business Model',
      subtitle: 'How we make money.',
      icon: <DollarSign className="w-8 h-8 text-amber-500" />,
      content: deck.business_model,
      bg: 'bg-white',
    },
    {
      id: 'gtm',
      title: 'Go-To-Market',
      subtitle: 'How we get our first 1k users.',
      icon: <Map className="w-8 h-8 text-indigo-500" />,
      content: deck.go_to_market,
      bg: 'bg-white',
    },
    {
      id: 'competition',
      title: 'Competition',
      subtitle: `Versus: ${deck.competition.competitor_types}`,
      icon: <Network className="w-8 h-8 text-purple-500" />,
      content: [`Our Unfair Advantage: ${deck.competition.our_advantage}`],
      bg: 'bg-purple-50',
    },
    {
      id: 'traction',
      title: 'Traction & Roadmap',
      subtitle: 'What we are executing next.',
      icon: <TrendingUp className="w-8 h-8 text-emerald-600" />,
      content: deck.traction,
      bg: 'bg-white',
    },
    {
      id: 'team',
      title: 'The Team',
      subtitle: 'The execution engine.',
      icon: <Users className="w-8 h-8 text-blue-500" />,
      content: deck.team,
      bg: 'bg-slate-50',
    },
    {
      id: 'ask',
      title: 'The Ask',
      subtitle: deck.the_ask.amount,
      icon: <Briefcase className="w-8 h-8 text-primary" />,
      content: deck.the_ask.use_of_funds,
      bg: 'bg-primary text-primary-foreground',
    }
  ];

  return (
    <div className="space-y-16 max-w-4xl mx-auto pb-32">
      {slides.map((slide, i) => {
        const isTitleSlide = i === 0 || i === slides.length - 1;
        
        return (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full min-h-[500px] md:min-h-0 md:aspect-video rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-20 shadow-2xl flex flex-col justify-center relative overflow-hidden ${slide.bg} ${isTitleSlide ? 'text-center items-center' : ''}`}
          >
            {isTitleSlide && (
              <div className="absolute top-0 right-0 p-16 opacity-10 scale-150 transform translate-x-12 -translate-y-12">
                {slide.icon}
              </div>
            )}
            
            {!isTitleSlide && (
              <div className="mb-10 flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-black/5">
                  {slide.icon}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">{slide.title}</h2>
                  <p className="text-sm md:text-base text-slate-500 font-medium">{slide.subtitle}</p>
                </div>
              </div>
            )}

            {isTitleSlide && (
              <div className="relative z-10 space-y-4 md:space-y-6">
                <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-[1.1] text-balance">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-2xl opacity-80 font-medium max-w-2xl mx-auto text-balance">
                  {slide.subtitle}
                </p>
              </div>
            )}

            {slide.content && !isTitleSlide && (
              <ul className="space-y-6">
                {slide.content.map((point, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + (idx * 0.1) }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-black/20 mt-2 md:mt-2.5 flex-shrink-0" />
                    <span className="text-lg md:text-3xl font-medium text-slate-700 leading-snug tracking-tight text-balance">
                      {point}
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
            
            {/* Slide Number */}
            <div className={`absolute bottom-6 right-8 md:bottom-8 md:right-12 text-xs md:text-sm font-black tracking-widest ${isTitleSlide ? 'text-white/40' : 'text-slate-300'}`}>
              {i + 1} / {slides.length}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
