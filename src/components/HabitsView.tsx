import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Heart,
  Gem,
  Compass,
  CheckCircle2,
  Circle,
  Plus,
  ShoppingBag,
  Sparkles,
  Award,
  Apple,
  Hand,
  Check,
} from 'lucide-react';
import { PetAccessory } from '../types';

export const HabitsView: React.FC = () => {
  const {
    habitGoals = [],
    toggleHabit,
    addHabitGoal,
    pet,
    feedPet,
    petBird,
    sendPetOnAdventure,
    claimAdventureReward,
    shopAccessories = [],
    buyAccessory,
    toggleEquipAccessory,
    moodEntries = [],
    addMoodEntry,
    gratitudeEntries = [],
    addGratitudeEntry,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'habits' | 'shop' | 'reflection'>('habits');
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<'hydration' | 'movement' | 'mental' | 'nutrition' | 'rest' | 'teaching'>('mental');

  // Mood reflection state
  const [selectedMood, setSelectedMood] = useState<'joyful' | 'calm' | 'tired' | 'stressed' | 'inspired'>('inspired');
  const [gratitudeText, setGratitudeText] = useState('');
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);

  const handleHabitCheck = (id: string) => {
    toggleHabit(id);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    addHabitGoal({
      title: newHabitTitle.trim(),
      category: newHabitCategory,
      frequency: 'daily',
      targetCount: 1,
      energyReward: 20,
      stonesReward: 25,
      icon:
        newHabitCategory === 'hydration'
          ? 'Droplets'
          : newHabitCategory === 'movement'
          ? 'Activity'
          : newHabitCategory === 'nutrition'
          ? 'Apple'
          : newHabitCategory === 'rest'
          ? 'Moon'
          : newHabitCategory === 'teaching'
          ? 'HeartHandshake'
          : 'Wind',
    });

    setNewHabitTitle('');
    sound.playChime('bell');
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gratitudeText.trim()) return;

    addMoodEntry(selectedMood, gratitudeText.trim());
    addGratitudeEntry(gratitudeText.trim());

    setReflectionSubmitted(true);
    setGratitudeText('');
    confetti({
      particleCount: 60,
      spread: 70,
    });
    sound.playChime('complete');
  };

  const energyPercent = Math.min(100, Math.round((pet.energy / pet.maxEnergy) * 100));

  // Determine pet avatar icon based on status and accessories
  const petIcon = pet.adventureStatus === 'exploring' ? '🧭' : pet.adventureStatus === 'returned' ? '🎁' : '🐣';

  return (
    <div className="flex-1 h-screen overflow-y-auto p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Habits & Wellness{' '}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100/80 border border-indigo-200/60 text-indigo-700 backdrop-blur-xs">
                Finch Pet Companion
              </span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Nurture your daily wellness and prevent teacher burnout by linking personal habits to Pip the Finch's growth.
            </p>
          </div>

          {/* Rainbow Stones Balance Pill */}
          <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/60 shadow-xs">
            <Gem className="w-5 h-5 text-amber-500 fill-amber-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Rainbow Stones</p>
              <p className="text-lg font-black text-slate-800 leading-none">{pet.rainbowStones}</p>
            </div>
          </div>
        </div>

        {/* PET COMPANION HERO CARD */}
        <div className="bg-gradient-to-r from-amber-50/70 via-rose-50/60 to-indigo-50/70 backdrop-blur-xl rounded-3xl border border-white/70 p-6 sm:p-8 shadow-lg shadow-amber-900/5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Pet Avatar Display */}
            <div className="flex items-center space-x-5">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/80 backdrop-blur-md border-2 border-amber-300/80 shadow-md flex items-center justify-center text-5xl transform hover:scale-105 transition-transform select-none">
                  {petIcon}
                </div>
                {pet.equippedAccessories && pet.equippedAccessories.length > 0 && (
                  <span className="absolute -top-2 -right-2 text-2xl" title="Equipped outfit">
                    ✨
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-2xl font-extrabold text-slate-800">{pet.name}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 capitalize border border-amber-300/50">
                    {pet.stage}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1">
                  Happiness:{' '}
                  <span className="font-bold text-indigo-700">
                    {pet.happiness >= 80 ? 'Joyful 💖' : pet.happiness >= 50 ? 'Cheerful ✨' : 'Cozy ☕'} ({pet.happiness}%)
                  </span>{' '}
                  • Level {pet.level}
                </p>

                {/* Energy Bar */}
                <div className="mt-3 w-56 sm:w-64">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>Adventure Energy</span>
                    <span>
                      {pet.energy} / {pet.maxEnergy} ({energyPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/60 overflow-hidden shadow-inner border border-white/50">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all duration-500"
                      style={{ width: `${energyPercent}%` }}
                    />
                  </div>
                </div>

                {/* Quick Care Actions */}
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={() => {
                      feedPet();
                      confetti({ particleCount: 15, spread: 40 });
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white/70 hover:bg-white border border-white/80 text-[11px] font-semibold text-slate-700 shadow-xs flex items-center space-x-1 cursor-pointer transition-all"
                  >
                    <Apple className="w-3.5 h-3.5 text-rose-500" />
                    <span>Feed 🍎 (+15 Energy)</span>
                  </button>
                  <button
                    onClick={() => {
                      petBird();
                      confetti({ particleCount: 15, spread: 40 });
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white/70 hover:bg-white border border-white/80 text-[11px] font-semibold text-slate-700 shadow-xs flex items-center space-x-1 cursor-pointer transition-all"
                  >
                    <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-400" />
                    <span>Pet Pip 💕 (+5 Happiness)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Adventure Trigger */}
            <div className="text-center sm:text-right">
              {pet.adventureStatus === 'exploring' ? (
                <div className="bg-indigo-600/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-md border border-indigo-400/30 text-center min-w-48">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Exploring the World</p>
                  <p className="text-sm font-bold mt-0.5">Pip is on a teacher quest!</p>
                  <div className="w-full bg-indigo-950/40 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-amber-300 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pet.adventureProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-indigo-100 mt-1">{pet.adventureProgress}% completed</p>
                </div>
              ) : pet.adventureStatus === 'returned' ? (
                <div className="bg-emerald-600/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-md border border-emerald-400/30 text-center min-w-48 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Adventure Complete! 🎉</p>
                  <p className="text-xs text-emerald-50 max-w-xs">{pet.lastAdventureStory || 'Pip has returned with stories and gifts!'}</p>
                  <button
                    onClick={claimAdventureReward}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Gem className="w-3.5 h-3.5 fill-slate-900" />
                    <span>Claim +75 Rainbow Stones</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={sendPetOnAdventure}
                  disabled={pet.energy < 30}
                  className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
                    pet.energy >= 30
                      ? 'bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-indigo-200/50 hover:scale-105'
                      : 'bg-white/40 border border-white/50 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>{pet.energy >= 30 ? 'Send Pip on Adventure! 🗺️' : `Needs 30 Energy (have ${pet.energy})`}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs: Daily Habits, Shop, Daily Reflection */}
        <div className="flex items-center justify-between border-b border-white/40 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('habits')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'habits'
                  ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-200/50'
                  : 'bg-white/50 backdrop-blur-md border border-white/60 text-slate-600 hover:bg-white/80'
              }`}
            >
              Daily Quests & Habits
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'shop'
                  ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-200/50'
                  : 'bg-white/50 backdrop-blur-md border border-white/60 text-slate-600 hover:bg-white/80'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Pip’s Boutique Shop</span>
            </button>
            <button
              onClick={() => setActiveTab('reflection')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'reflection'
                  ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-200/50'
                  : 'bg-white/50 backdrop-blur-md border border-white/60 text-slate-600 hover:bg-white/80'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Teacher Reflection & Mood</span>
            </button>
          </div>
        </div>

        {/* TAB 1: HABITS & QUESTS */}
        {activeTab === 'habits' && (
          <div className="space-y-4">
            {/* Create Habit Input */}
            <form
              onSubmit={handleCreateHabit}
              className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-4 shadow-lg shadow-slate-200/30 flex flex-wrap items-center gap-3"
            >
              <input
                type="text"
                placeholder="Add a daily teacher self-care quest (e.g. 5-minute vocal rest)..."
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                className="flex-1 min-w-56 bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white/90 shadow-xs"
              />
              <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value as any)}
                className="bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium cursor-pointer shadow-xs"
              >
                <option value="mental">Mindfulness & Mental</option>
                <option value="movement">Movement & Stretch</option>
                <option value="hydration">Hydration</option>
                <option value="nutrition">Nutrition</option>
                <option value="rest">Rest & Recharge</option>
                <option value="teaching">Classroom Encouragement</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200/50 cursor-pointer flex items-center space-x-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Quest</span>
              </button>
            </form>

            {/* Habit Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(habitGoals || []).map((h) => (
                <div
                  key={h.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    h.completed
                      ? 'bg-emerald-50/50 backdrop-blur-md border-emerald-200/60 shadow-xs'
                      : 'bg-white/45 backdrop-blur-xl border border-white/60 hover:border-white/90 hover:bg-white/60 shadow-md shadow-slate-200/20'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleHabitCheck(h.id)}
                      className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      {h.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          h.completed ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {h.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {h.category} • {h.frequency} Quest
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-rose-600 bg-rose-50/80 px-2 py-0.5 rounded-lg border border-rose-100 shadow-xs">
                      +{h.energyReward} Energy
                    </span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50/80 px-2 py-0.5 rounded-lg border border-amber-100 shadow-xs">
                      +{h.stonesReward} Stones
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PIP’S BOUTIQUE SHOP */}
        {activeTab === 'shop' && (
          <div className="space-y-4">
            <div className="bg-amber-50/60 backdrop-blur-md border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <h4 className="text-sm font-bold text-amber-900">Welcome to Pip’s Teacher Boutique!</h4>
                <p className="text-xs text-amber-700">
                  Spend Rainbow Stones earned from your habits to dress Pip or decorate the classroom birdhouse!
                </p>
              </div>
              <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-sm">
                <Gem className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{pet.rainbowStones} Stones</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(shopAccessories || []).map((item) => {
                const isOwned = (pet.inventory || []).includes(item.id);
                const isEquipped = (pet.equippedAccessories || []).includes(item.id);
                const isAffordable = pet.rainbowStones >= item.cost;

                return (
                  <div
                    key={item.id}
                    className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-lg shadow-slate-200/20 flex flex-col justify-between items-center text-center space-y-3"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/60 flex items-center justify-center text-2xl shadow-xs">
                      {item.type === 'glasses' ? '👓' : item.type === 'hat' ? '🎓' : item.type === 'neck' ? '🧣' : item.type === 'held' ? '🍎' : '🪴'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 capitalize">{item.type}</p>
                    </div>

                    {isOwned ? (
                      <button
                        onClick={() => toggleEquipAccessory(item.id)}
                        className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                          isEquipped
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Equipped</span>
                          </>
                        ) : (
                          <span>Equip</span>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => buyAccessory(item)}
                        disabled={!isAffordable}
                        className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                          isAffordable
                            ? 'bg-amber-500/90 hover:bg-amber-500 text-white shadow-md shadow-amber-200/50'
                            : 'bg-white/40 border border-white/40 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Gem className="w-3.5 h-3.5" />
                        <span>{item.cost} Stones</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TEACHER REFLECTION & MOOD CHECK-IN */}
        {activeTab === 'reflection' && (
          <div className="bg-white/50 backdrop-blur-xl rounded-3xl border border-white/60 p-6 sm:p-8 shadow-xl shadow-slate-200/30 max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Teacher Daily Mood & Gratitude Check-In</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Take a moment to pause. Acknowledging small wins protects your teacher joy.
              </p>
            </div>

            {/* Mood selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">How are you feeling right now?</label>
              <div className="grid grid-cols-5 gap-2 text-center">
                {(
                  [
                    { id: 'joyful', emoji: '😄', label: 'Joyful' },
                    { id: 'inspired', emoji: '✨', label: 'Inspired' },
                    { id: 'calm', emoji: '😌', label: 'Calm' },
                    { id: 'tired', emoji: '🥱', label: 'Tired' },
                    { id: 'stressed', emoji: '😣', label: 'Overwhelmed' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMood(m.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedMood === m.id
                        ? 'bg-indigo-50/80 border-indigo-400 shadow-md backdrop-blur-xs scale-105'
                        : 'bg-white/40 backdrop-blur-xs border-white/60 hover:bg-white/70'
                    }`}
                  >
                    <span className="text-2xl block">{m.emoji}</span>
                    <span className="text-[10px] font-bold text-slate-700 mt-1 block">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gratitude Prompt */}
            <form onSubmit={handleSaveReflection} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  What is one thing that made you smile or feel proud in class today?
                </label>
                <textarea
                  rows={3}
                  value={gratitudeText}
                  onChange={(e) => setGratitudeText(e.target.value)}
                  placeholder="e.g. Maya finally understood long division after our group activity!"
                  className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:bg-white/90 shadow-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600">Earn +25 Rainbow Stones & +30 Pip Energy</span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200/50 cursor-pointer flex items-center space-x-1.5 transition-all"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>Save Reflection</span>
                </button>
              </div>
            </form>

            {/* Recent Check-ins */}
            {(moodEntries || []).length > 0 && (
              <div className="pt-6 border-t border-white/40 space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Past Reflections ({(moodEntries || []).length})
                </h4>
                <div className="space-y-2">
                  {(moodEntries || []).map((m) => (
                    <div key={m.id} className="p-3 bg-white/40 backdrop-blur-xs rounded-xl border border-white/50 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-700">
                        <span>{m.date} • {m.timestamp}</span>
                        <span className="capitalize px-2 py-0.5 rounded-full bg-indigo-100/70 text-indigo-700 text-[10px] font-bold">
                          {m.mood}
                        </span>
                      </div>
                      {m.note && <p className="text-slate-600 mt-1 italic font-medium">"{m.note}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
