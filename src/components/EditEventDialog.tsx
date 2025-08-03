import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Event, EventCategory } from '@/types';
import { format, isSameDay } from 'date-fns';
import { getCategoryColor } from '@/utils/categoryColors';
import { useNotifications } from '@/context/NotificationContext';

interface EditEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedEvent: Event) => void;
  event: Event | null;
}

export function EditEventDialog({ isOpen, onClose, onSave, event }: EditEventDialogProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [category, setCategory] = useState<EventCategory>('other');
  const [cateringNeeded, setCateringNeeded] = useState(false);
  const [cateringNotes, setCateringNotes] = useState('');
  const { addNotification, addChefNotification } = useNotifications();

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setStartDate(format(new Date(event.startDate), 'yyyy-MM-dd'));
      setEndDate(format(new Date(event.endDate), 'yyyy-MM-dd'));
      setArrivalTime(event.arrivalTime || '');
      setDepartureTime(event.departureTime || '');
      setDescription(event.description || '');
      setColor(event.color || '#3b82f6');
      setCategory(event.category || 'other');
      setIsMultiDay(!isSameDay(new Date(event.startDate), new Date(event.endDate)));
      setCateringNeeded(!!event.cateringNeeded);
      setCateringNotes(event.cateringNotes || '');
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    
    // Create date objects that preserve the actual date values
    const startDateObj = new Date(startDate + 'T00:00:00');
    // If not multi-day, set end date equal to start date
    const endDateObj = isMultiDay ? new Date(endDate + 'T00:00:00') : new Date(startDate + 'T00:00:00');
    
    // Check if this is a retreat and has catering that wasn't previously requested
    const isNewCateringRequest = 
      category === 'retreat' && 
      cateringNeeded && 
      (!event.cateringNeeded || event.cateringNotes !== cateringNotes);
    
    // Ensure we have clean date objects with no time component
    const startDateClean = new Date(startDateObj.toDateString());
    const endDateClean = new Date(endDateObj.toDateString());

    const editedEvent: Event = {
      ...event,
      title,
      startDate: startDateClean,
      endDate: endDateClean,
      arrivalTime,
      departureTime,
      description,
      color,
      category,
      cateringNeeded: category === 'retreat' ? cateringNeeded : undefined,
      cateringNotes: (category === 'retreat' && cateringNeeded) ? cateringNotes : undefined
    };

    onSave(editedEvent);
    
    // If this is a retreat with new catering request, notify users with chef permission
    if (isNewCateringRequest) {
      addChefNotification({
        title: 'Catering Request',
        message: `Updated catering request for retreat "${title}" from ${format(startDateObj, 'MMM d')} to ${format(endDateObj, 'MMM d, yyyy')}${cateringNotes ? `: ${cateringNotes}` : ''}`,
        type: 'info',
        link: '/calendar'
      });
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen && event !== null} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            {/* Multi-day toggle */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="multiday" className="text-right">
                Multi-day Event
              </Label>
              <div className="col-span-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="multiday"
                    checked={isMultiDay}
                    onChange={(e) => {
                      const multiDayEnabled = e.target.checked;
                      setIsMultiDay(multiDayEnabled);
                      if (!multiDayEnabled) {
                        // If switching to single day, set end date equal to start date
                        setEndDate(startDate);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setStartDate(newStartDate);
                  // If end date is before new start date or not multi-day, update end date
                  if (!isMultiDay || new Date(endDate) < new Date(newStartDate)) {
                    setEndDate(newStartDate);
                  }
                }}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onClick={(e) => {
                  // On mobile, ensure multi-day is enabled when clicking the end date field
                  if (!isMultiDay) {
                    setIsMultiDay(true);
                  }
                }}
                onChange={(e) => {
                  const newEndDate = e.target.value;
                  // Only update if end date is after or equal to start date
                  if (new Date(newEndDate) >= new Date(startDate)) {
                    setEndDate(newEndDate);
                    // If setting different end date, enable multi-day toggle
                    if (newEndDate !== startDate) {
                      setIsMultiDay(true);
                    }
                  }
                }}
                className="col-span-3"
                disabled={!isMultiDay}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="arrivalTime" className="text-right">
                Arrival Time
              </Label>
              <Input
                id="arrivalTime"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departureTime" className="text-right">
                Departure Time
              </Label>
              <Input
                id="departureTime"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 max-h-48 overflow-y-auto scrollbar-thin"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select 
                  value={category} 
                  onValueChange={(value: EventCategory) => {
                    setCategory(value);
                    setColor(getCategoryColor(value)); // Auto-update color when category changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retreat">Retreat</SelectItem>
                    <SelectItem value="camp">Camp</SelectItem>
                    <SelectItem value="day-off">Day Off</SelectItem>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">Select a color for this event</span>
              </div>
            </div>
            
            {/* Catering options - only display for retreat events */}
            {category === 'retreat' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cateringNeeded" className="text-right">
                    Catering Needed
                  </Label>
                  <div className="col-span-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="cateringNeeded"
                        checked={cateringNeeded}
                        onChange={(e) => setCateringNeeded(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                
                {cateringNeeded && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cateringNotes" className="text-right">
                      Catering Notes
                    </Label>
                    <Textarea
                      id="cateringNotes"
                      value={cateringNotes}
                      onChange={(e) => setCateringNotes(e.target.value)}
                      placeholder="Dietary requirements, preferences, etc."
                      className="col-span-3"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}