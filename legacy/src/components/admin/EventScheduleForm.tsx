import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Trash2, Plus, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// Common input styles for form fields (readable text - always dark text on light background)
const INPUT_STYLES = "bg-white text-[#1a1a1a] placeholder:text-mp-ink-muted border-slate-300 focus:border-sakura focus:ring-sakura/20";

export interface ScheduleDay {
  date: string;
  start_time: string;
  end_time: string;
}

interface EventScheduleFormProps {
  schedule: ScheduleDay[];
  onChange: (schedule: ScheduleDay[]) => void;
}

const EventScheduleForm = ({ schedule, onChange }: EventScheduleFormProps) => {
  const addDay = () => {
    const lastDay = schedule[schedule.length - 1];
    const newDay: ScheduleDay = {
      date: lastDay?.date || "",
      start_time: lastDay?.start_time || "10:00",
      end_time: lastDay?.end_time || "18:00",
    };
    onChange([...schedule, newDay]);
  };

  const removeDay = (index: number) => {
    if (schedule.length <= 1) return;
    const newSchedule = schedule.filter((_, i) => i !== index);
    onChange(newSchedule);
  };

  const updateDay = (index: number, field: keyof ScheduleDay, value: string) => {
    const newSchedule = schedule.map((day, i) => {
      if (i === index) {
        return { ...day, [field]: value };
      }
      return day;
    });
    onChange(newSchedule);
  };

  const duplicatePreviousDay = (index: number) => {
    if (index === 0) return;
    const prevDay = schedule[index - 1];
    if (prevDay) {
      // Get the next date after the previous day
      const prevDate = prevDay.date ? parseISO(prevDay.date) : new Date();
      const nextDate = new Date(prevDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const newSchedule = schedule.map((day, i) => {
        if (i === index) {
          return {
            date: format(nextDate, "yyyy-MM-dd"),
            start_time: prevDay.start_time,
            end_time: prevDay.end_time,
          };
        }
        return day;
      });
      onChange(newSchedule);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sakura" />
          Planning de l'événement
        </Label>
        <span className="text-xs text-muted-foreground">
          {schedule.length} jour{schedule.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {schedule.map((day, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              layout
              className="relative p-4 rounded-xl border border-border bg-muted/30 space-y-3"
            >
              {/* Day header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-display text-muted-foreground">
                  Jour {index + 1}
                  {day.date && (
                    <span className="ml-2 text-foreground capitalize">
                      — {format(parseISO(day.date), "EEEE d MMMM", { locale: fr })}
                    </span>
                  )}
                </span>
                
                <div className="flex items-center gap-1">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicatePreviousDay(index)}
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3 h-3" />
                      Copier J-1
                    </Button>
                  )}
                  {schedule.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDay(index)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-3 gap-3">
                {/* Date */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={day.date}
                    onChange={(e) => updateDay(index, "date", e.target.value)}
                    className={`h-9 ${INPUT_STYLES}`}
                  />
                </div>

                {/* Start Time */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Début
                  </Label>
                  <Input
                    type="time"
                    value={day.start_time}
                    onChange={(e) => updateDay(index, "start_time", e.target.value)}
                    className={`h-9 ${INPUT_STYLES}`}
                  />
                </div>

                {/* End Time */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    🏁 Fin
                  </Label>
                  <Input
                    type="time"
                    value={day.end_time}
                    onChange={(e) => updateDay(index, "end_time", e.target.value)}
                    className={`h-9 ${INPUT_STYLES}`}
                    placeholder="Optionnel"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Day Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addDay}
        className="w-full border-dashed gap-2"
      >
        <Plus className="w-4 h-4" />
        Ajouter un jour
      </Button>
    </div>
  );
};

export default EventScheduleForm;

// Helper to format schedule for display
export const formatScheduleDisplay = (schedule: ScheduleDay[] | null): string => {
  if (!schedule || schedule.length === 0) return "";
  
  if (schedule.length === 1) {
    const day = schedule[0];
    const dateStr = day.date ? format(parseISO(day.date), "d MMMM yyyy", { locale: fr }) : "";
    const timeStr = day.start_time ? 
      (day.end_time ? `${day.start_time} - ${day.end_time}` : day.start_time) : "";
    return `${dateStr}${timeStr ? ` • ${timeStr}` : ""}`;
  }
  
  // Multiple days - show range
  const sortedDays = [...schedule].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = parseISO(sortedDays[0].date);
  const lastDate = parseISO(sortedDays[sortedDays.length - 1].date);
  
  return `Du ${format(firstDate, "d", { locale: fr })} au ${format(lastDate, "d MMMM yyyy", { locale: fr })}`;
};

// Helper to format detailed schedule
export const formatScheduleDetailed = (schedule: ScheduleDay[] | null): string[] => {
  if (!schedule || schedule.length === 0) return [];
  
  return schedule.map(day => {
    const dateStr = day.date ? format(parseISO(day.date), "EEEE d MMMM", { locale: fr }) : "";
    const timeStr = day.start_time ? 
      (day.end_time ? `${day.start_time} - ${day.end_time}` : `à partir de ${day.start_time}`) : "";
    return `${dateStr} : ${timeStr}`;
  });
};
