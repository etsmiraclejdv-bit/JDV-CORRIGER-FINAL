'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  MapPin,
  Package,
  Quote,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

const scenes: {
  eyebrow: TerrainKey;
  title: TerrainKey;
  text: TerrainKey;
  icon: typeof Building2;
  visual: string;
}[] = [
  {
    eyebrow: 'ld.e1',
    title: 'ld.n1',
    text: 'ld.x1',
    icon: Building2,
    visual: 'vision',
  },
  {
    eyebrow: 'ld.e2',
    title: 'ld.n2',
    text: 'ld.x2',
    icon: MapPin,
    visual: 'prospection',
  },
  {
    eyebrow: 'ld.e3',
    title: 'ld.n3',
    text: 'ld.x3',
    icon: CreditCard,
    visual: 'client',
  },
  {
    eyebrow: 'ld.e4',
    title: 'ld.n4',
    text: 'ld.x4',
    icon: GraduationCap,
    visual: 'formation',
  },
  {
    eyebrow: 'ld.e5',
    title: 'ld.n5',
    text: 'ld.x5',
    icon: Target,
    visual: 'founder',
  },
];

function SceneVisual({ type }: { type: string }) {
  const { t } = useLanguage();
  if (type === 'prospection')
    return (
      <div className="jdv-scene-visual">
        <div className="jdv-person jdv-person--prospector">
          <MapPin size={25} />
        </div>
        <div className="jdv-client-dot" />
        <div className="jdv-signal" />
        <span>{t('ld.v1')}</span>
      </div>
    );
  if (type === 'client')
    return (
      <div className="jdv-scene-visual">
        <Package size={27} />
        <ArrowRight size={18} />
        <CreditCard size={27} />
        <CheckCircle2 size={20} />
        <span>{t('ld.v2')}</span>
      </div>
    );
  if (type === 'formation')
    return (
      <div className="jdv-scene-visual jdv-training">
        <div className="jdv-person">
          <GraduationCap size={25} />
        </div>
        <div className="jdv-trainees">
          <Users size={32} />
          <Users size={32} />
          <Users size={32} />
        </div>
        <span>{t('ld.v3')}</span>
      </div>
    );
  if (type === 'founder')
    return (
      <div className="jdv-scene-visual">
        <div className="jdv-founder">
          <Award size={27} />
        </div>
        <div className="jdv-vision-lines">
          <i />
          <i />
          <i />
        </div>
        <span>{t('ld.v4')}</span>
      </div>
    );
  return (
    <div className="jdv-scene-visual jdv-vision">
      <ShieldCheck size={30} />
      <BriefcaseBusiness size={30} />
      <Banknote size={30} />
      <span>{t('ld.v5')}</span>
    </div>
  );
}

export default function JdvLoadingScreen() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false),
    [scene, setScene] = useState(0),
    [progress, setProgress] = useState(0);
  useEffect(() => {
    if (sessionStorage.getItem('jdv_loading_seen') === '1') return;
    setVisible(true);
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setProgress(Math.min(100, (elapsed / 30000) * 100));
      if (elapsed >= 30000) {
        window.clearInterval(timer);
        sessionStorage.setItem('jdv_loading_seen', '1');
        setVisible(false);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setInterval(() => setScene((v) => (v + 1) % scenes.length), 3000);
    return () => window.clearInterval(timer);
  }, [visible]);
  if (!visible) return null;
  const current = scenes[scene],
    Icon = current.icon;
  return (
    <div className="jdv-loading jdv-loading--extended" role="status" aria-label={t('ld.aria2')}>
      <div className="jdv-loading__grid" />
      <div className="jdv-loading__glow jdv-loading__glow--one" />
      <div className="jdv-loading__glow jdv-loading__glow--two" />
      <section className="jdv-loading__content">
        <div className="jdv-loading__brand">
          <div className="jdv-loading__logo-wrap">
            <div className="jdv-loading__orbit jdv-loading__orbit--outer" />
            <div className="jdv-loading__orbit jdv-loading__orbit--inner" />
            <div className="jdv-loading__logo-card">
              <img
                src="/assets/images/image_a5395bef-1789678648033.jpg"
                alt="JDV CRM"
                className="jdv-loading__logo"
              />
            </div>
          </div>
          <div className="jdv-loading__name">
            JDV <span>CRM</span>
          </div>
          <p>{t('ld.tag2')}</p>
        </div>
        <div className="jdv-founder-strip">
          <div className="jdv-founder-strip__icon">
            <Quote size={18} />
          </div>
          <div>
            <strong>Romaric A. B. ADEDEDJI</strong>
            <small>{t('ld.fnd')}</small>
          </div>
        </div>
        <div className="jdv-loading__story">
          <div className="jdv-story-copy" key={scene}>
            <div className="jdv-story-eyebrow">
              <Icon size={15} />
              {t(current.eyebrow)}
            </div>
            <h1>{t(current.title)}</h1>
            <p>{t(current.text)}</p>
          </div>
          <SceneVisual type={current.visual} />
        </div>
        <div className="jdv-loading__timeline">
          {scenes.map((_, i) => (
            <i key={i} className={i === scene ? 'is-active' : ''} />
          ))}
        </div>
        <div className="jdv-loading__progress">
          <div className="jdv-loading__progress-track">
            <span style={{ width: progress + '%' }} />
          </div>
          <div className="jdv-loading__status">
            <span>{t('ld.disc')}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#08152f]/75 px-4 py-3 text-center backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#D4AF37]">
            {t('ld.pers')}
          </p>
          <p className="mt-1 text-xs text-slate-300">{t('ld.contact2')}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-white">
            <a href="tel:+2290166038221" className="hover:text-[#F5E17A]">
              +229 01 66 03 82 21
            </a>
            <a href="tel:+2290195325987" className="hover:text-[#F5E17A]">
              +229 01 95 32 59 87
            </a>
            <a href="tel:+2290151565878" className="hover:text-[#F5E17A]">
              +229 01 51 56 58 78
            </a>
            <a href="tel:+2290140164627" className="hover:text-[#F5E17A]">
              +229 01 40 16 46 27
            </a>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 text-[11px] text-slate-300">
            <a href="mailto:centre.global.jdv@gmail.com" className="hover:text-[#F5E17A]">
              centre.global.jdv@gmail.com
            </a>
            <span>{t('ld.city')}</span>
          </div>
        </div>
      </section>
      <p className="jdv-loading__footer">{t('ld.foot')}</p>
    </div>
  );
}
