import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { MealPlan } from '../types';
import { Calendar as CalendarIcon, Plus, Sparkles, Loader2 } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { generateMealPlan } from '../services/geminiService';

export const MealPlanner = ({ householdId, setActiveTab }: { householdId: string, setActiveTab: (tab: 'recipes' | 'mealPlanner') => void }) => {
  const [planName, setPlanName] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMeals, setGeneratedMeals] = useState<any[]>([]);

  const handleCreatePlan = async () => {
    if (!planName.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'households', householdId, 'mealPlans'), {
      householdId,
      name: planName,
      startDate: serverTimestamp(),
      endDate: serverTimestamp()
    });
    setPlanName('');
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const meals = await generateMealPlan(date, 5);
      setGeneratedMeals(meals);
      // Ensure the state update is processed
      setTimeout(() => setActiveTab('recipes'), 100);
    } catch (error) {
      console.error("Failed to generate AI meal plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <CalendarIcon className="w-5 h-5" /> Meal Plans
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="New meal plan name..."
          className="flex-1 p-2 rounded-full border border-stone-200 dark:border-stone-700 bg-transparent"
        />
        <button onClick={handleCreatePlan} className="p-2 bg-stone-800 text-white rounded-full">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="border-2 border-blue-500 rounded-lg p-4">
        <Calendar onChange={(value) => setDate(value as Date)} value={date} className="w-full" />
        <button 
          onClick={handleGenerateAI} 
          disabled={isGenerating}
          className="mt-4 w-full flex items-center justify-center gap-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate AI Meal Plan (5 dishes)
        </button>
      </div>
      {generatedMeals.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-xl font-serif font-bold">Generated Meals:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedMeals.map((meal, i) => (
              <div key={i} className="p-4 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 space-y-2">
                <h5 className="font-bold text-lg">{meal.title}</h5>
                <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">{meal.ingredients.join(', ')}</p>
                <details className="text-sm pt-2">
                  <summary className="cursor-pointer font-medium text-blue-600">View Instructions</summary>
                  <p className="mt-2 text-stone-700 dark:text-stone-300 whitespace-pre-line">{meal.instructions.join('\n')}</p>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
