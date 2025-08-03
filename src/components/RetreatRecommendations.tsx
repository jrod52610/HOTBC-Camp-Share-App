import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Event, EventCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Check, X } from 'lucide-react';
import { format, addYears, isSameDay, addDays, differenceInDays, isWeekend, getDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getCategoryColor } from '@/utils/categoryColors';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RetreatRecommendations() {
  const { events, addEvent } = useAppContext();
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [cateringOptions, setCateringOptions] = useState<Record<string, { needed: boolean, notes: string }>>({});
  
  // Function to get day of week name
  const getDayOfWeek = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[getDay(date)];
  };
  
  // Function to get the relative position of a date within its month
  const getRelativePosition = (date: Date) => {
    const dayOfMonth = date.getDate();
    const weekNumber = Math.ceil(dayOfMonth / 7);
    const dayOfWeek = getDayOfWeek(date);
    return `${getOrdinalSuffix(weekNumber)} ${dayOfWeek} of ${format(date, 'MMMM')}`;
  };
  
  // Helper to get ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  useEffect(() => {
    // Log for debugging
    console.log("Current year:", new Date().getFullYear());
    console.log("All events:", events.length);
    console.log("Retreat events:", events.filter(event => event.category === 'retreat').length);
    
    // Get the current month for filtering
    const currentMonth = new Date().getMonth();
    
    // Log all retreat events first
    console.log("All retreat events:", events.filter(event => event.category === 'retreat').length);
    events.filter(event => event.category === 'retreat').forEach(event => {
      console.log("Available retreat:", event.title, format(event.startDate, 'yyyy-MM-dd'), 
        "Year:", event.startDate.getFullYear(), 
        "Month:", event.startDate.getMonth(),
        "Current month:", currentMonth);
    });
    
    // Filter retreat events to only include those in the current month (regardless of year)
    const currentYear = new Date().getFullYear();
    const retreatEvents = events.filter(event => 
      event.category === 'retreat' &&
      event.startDate.getMonth() === currentMonth // Only include events from the current month
    );
    
    console.log("Retreat events for current month:", retreatEvents.length);
    retreatEvents.forEach(event => {
      console.log("Found retreat for current month:", event.title, format(event.startDate, 'yyyy-MM-dd'), 
        "Year:", event.startDate.getFullYear(), 
        "Month:", event.startDate.getMonth());
    });
    
    // Generate recommendations for next year based on relative dates
    const generateRecommendations = () => {
      const newRecommendations: Event[] = [];
      // Use the actual current year for dynamic recommendations that will work year after year
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const currentMonth = new Date().getMonth();
      console.log("Using current year:", currentYear, "and next year:", nextYear, "current month:", currentMonth);
      
      // Track events we've already recommended to avoid duplicates
      const recommendedDates: string[] = [];
      
      // For debugging - log all retreat events we're about to process
      console.log("Processing retreats for recommendations:", retreatEvents.length);
      
      retreatEvents.forEach(event => {
        // Calculate duration of event
        const duration = differenceInDays(event.endDate, event.startDate);
        
        // Get the original event's month and day
        const eventMonth = event.startDate.getMonth();
        const eventDay = event.startDate.getDate();
        
        console.log("Processing event for recommendation:", event.title, "category:", event.category);
        
        // Create date for next year with same month and approximate day
        let nextYearDate = new Date(nextYear, eventMonth, eventDay);
        
        // Adjust to maintain same day of week and week number (relative position)
        // Example: If it was 2nd Saturday of August, find 2nd Saturday of August next year
        const originalDayOfWeek = getDay(event.startDate);
        const originalWeekNumber = Math.ceil(eventDay / 7);
        
        // Find the first day of the month
        const firstDayOfMonth = new Date(nextYear, eventMonth, 1);
        
        // Find the first occurrence of the original day of week
        let firstOccurrence = new Date(firstDayOfMonth);
        while (getDay(firstOccurrence) !== originalDayOfWeek) {
          firstOccurrence = addDays(firstOccurrence, 1);
        }
        
        // Calculate the target day by adding (week number - 1) * 7 days
        nextYearDate = addDays(firstOccurrence, (originalWeekNumber - 1) * 7);
        
        // Check if this date has already been recommended
        const dateKey = format(nextYearDate, 'yyyy-MM-dd');
        if (recommendedDates.includes(dateKey)) {
          return;
        }
        
        // Add to tracking array
        recommendedDates.push(dateKey);
        
        // Create end date based on original duration
        const nextYearEndDate = addDays(nextYearDate, duration);
        
        // Create new recommendation event
        const recommendation: Event = {
          id: `recommendation-${event.id}`,
          title: event.title,
          startDate: nextYearDate,
          endDate: nextYearEndDate,
          description: event.description || '',
          category: 'retreat',
          createdBy: currentUser?.name || 'System',
          color: '#d3d3d3', // Light gray color for recommendations
        };
        
        newRecommendations.push(recommendation);
      });
      
      setRecommendations(newRecommendations);
      setLoading(false);
    };
    
    generateRecommendations();
  }, [events, currentUser]);

  const acceptRecommendation = (recommendation: Event) => {
    // Check if user is an admin
    const isAdmin = currentUser?.permissions.includes('admin');
    
    if (!isAdmin) {
      alert('Only administrators can add retreat events');
      return;
    }
    
    const cateringOption = cateringOptions[recommendation.id] || { needed: false, notes: '' };
    
    // Add as a real event with retreat color
    const newEvent = {
      title: recommendation.title,
      startDate: recommendation.startDate,
      endDate: recommendation.endDate,
      description: recommendation.description,
      category: 'retreat' as EventCategory,
      createdBy: currentUser?.name || 'System',
      color: getCategoryColor('retreat'),
      cateringNeeded: cateringOption.needed,
      cateringNotes: cateringOption.needed ? cateringOption.notes : undefined
    };
    
    addEvent(newEvent);
    
    // Notify chefs if catering is needed
    if (cateringOption.needed) {
      // Send notification to users with chef permission
      addNotification({
        title: 'Catering Request',
        message: `New catering request for retreat "${recommendation.title}" from ${format(recommendation.startDate, 'MMM d')} to ${format(recommendation.endDate, 'MMM d, yyyy')}${cateringOption.notes ? `: ${cateringOption.notes}` : ''}`,
        type: 'info',
        link: '/calendar'
      });
    }
    
    // Remove from recommendations
    setRecommendations(prev => prev.filter(rec => rec.id !== recommendation.id));
  };
  
  // Handler for catering options
  const updateCateringOption = (id: string, needed: boolean, notes: string = '') => {
    setCateringOptions(prev => ({
      ...prev,
      [id]: { needed, notes }
    }));
  };
  
  const declineRecommendation = (recommendationId: string) => {
    // Just remove from recommendations
    setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId));
  };
  
  if (loading) {
    return <div className="flex justify-center py-6">Loading recommendations...</div>;
  }
  
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No retreat recommendations available
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Retreat Recommendations for Next Year</h2>
      <p className="text-sm text-muted-foreground">
        Based on previous retreat dates in {format(new Date(), 'MMMM')}, we recommend these dates for {format(new Date(), 'MMMM')} next year.
      </p>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card 
              key={rec.id} 
              style={{ borderLeft: `4px solid ${rec.color || '#d3d3d3'}` }}
              className="transition-all hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{rec.title}</h3>
                      {rec.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {rec.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-primary-foreground bg-gray-400 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                          {format(rec.startDate, 'MMM d')} - {format(rec.endDate, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          Relative date: {getRelativePosition(rec.startDate)}
                        </p>
                        {isWeekend(rec.startDate) && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 ml-2 text-[10px] h-5">
                            Weekend
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Catering options */}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Catering Needed</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cateringOptions[rec.id]?.needed || false}
                          onChange={(e) => updateCateringOption(rec.id, e.target.checked, cateringOptions[rec.id]?.notes || '')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    
                    {cateringOptions[rec.id]?.needed && (
                      <div className="mt-2">
                        <textarea
                          placeholder="Catering notes (dietary requirements, preferences, etc.)"
                          value={cateringOptions[rec.id]?.notes || ''}
                          onChange={(e) => updateCateringOption(rec.id, true, e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => acceptRecommendation(rec)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => declineRecommendation(rec.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}