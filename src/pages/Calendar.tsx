import { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { EventCalendar } from '@/components/ui/calendar/event-calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Pencil } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { EditEventDialog } from '@/components/EditEventDialog';
import { Event, EventCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getCategoryColor } from '@/utils/categoryColors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Retreat Recommendations removed

export default function CalendarPage() {
  const { events, addEvent, updateEvent, deleteEvent } = useAppContext();
  const { currentUser } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    createdBy: currentUser?.name || 'Anonymous',
    color: getCategoryColor('other'),
    startDate: new Date(),
    endDate: new Date(),
    arrivalTime: '',
    departureTime: '',
    isMultiDay: false,
    category: 'other' as EventCategory,
    cateringNeeded: false,
    cateringNotes: ''
  });
  
  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  
  // Handler for opening the edit dialog
  const handleEditEvent = (event: Event) => {
    // Allow editing if the current user created the event OR if they're an admin
    const isAdmin = currentUser?.permissions.includes('admin');
    const isCreator = currentUser && event.createdBy === currentUser.name;
    
    if (isCreator || isAdmin) {
      setEventToEdit(event);
      setIsEditDialogOpen(true);
    }
  };
  
  // Handler for saving edited event
  const handleSaveEditedEvent = (editedEvent: Event) => {
    // Check if the user is the creator of the event or if they're an admin
    const isAdmin = currentUser?.permissions.includes('admin');
    const isCreator = currentUser && editedEvent.createdBy === currentUser.name;
    
    if (isAdmin || isCreator) {
      updateEvent(editedEvent);
      setIsEditDialogOpen(false);
      setEventToEdit(null);
    }
  };

  // Import notification context
  const { addNotification } = useNotifications();

  // When selected date changes, update the start and end dates for new events
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      setNewEvent(prev => ({
        ...prev,
        startDate: newDate,
        endDate: newDate
      }));
    }
  };

  // Filter events that include the selected date (between start and end dates)
  const eventsOnSelectedDate = events.filter(
    (event) => date && (
      isSameDay(event.startDate, date) || 
      isSameDay(event.endDate, date) || 
      (date >= event.startDate && date <= event.endDate)
    )
  );

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.startDate && newEvent.endDate) {
      // Check if user is trying to add a camp or retreat event
      const isRestrictedCategory = newEvent.category === 'camp' || newEvent.category === 'retreat';
      const isAdmin = currentUser?.permissions.includes('admin');
      
      // Only allow adding camps and retreats if the user is an admin
      if (isRestrictedCategory && !isAdmin) {
        alert('Only administrators can add camp and retreat events');
        return;
      }
      
      // If not multi-day, set end date equal to start date
      const endDate = newEvent.isMultiDay ? newEvent.endDate : newEvent.startDate;
      
      // Ensure we have clean date objects with no time component
      const startDateClean = new Date(new Date(newEvent.startDate).toDateString());
      const endDateClean = new Date(new Date(endDate).toDateString());
      
      const eventToAdd = {
        title: newEvent.title,
        description: newEvent.description,
        startDate: startDateClean,
        endDate: endDateClean,
        arrivalTime: newEvent.arrivalTime,
        departureTime: newEvent.departureTime,
        createdBy: currentUser?.name || 'Anonymous',
        color: newEvent.color,
        category: newEvent.category,
        cateringNeeded: newEvent.category === 'retreat' ? newEvent.cateringNeeded : undefined,
        cateringNotes: newEvent.category === 'retreat' && newEvent.cateringNeeded ? newEvent.cateringNotes : undefined
      };
      
      addEvent(eventToAdd);
      
      // Notify chefs if catering is needed
      if (newEvent.category === 'retreat' && newEvent.cateringNeeded) {
        // Send notification to users with chef permission
        addNotification({
          title: 'Catering Request',
          message: `New catering request for retreat "${newEvent.title}" from ${format(newEvent.startDate, 'MMM d')} to ${format(endDate, 'MMM d, yyyy')}${newEvent.cateringNotes ? `: ${newEvent.cateringNotes}` : ''}`,
          type: 'info',
          link: '/calendar'
        });
      }
      
      setNewEvent({ 
        title: '', 
        description: '', 
        createdBy: currentUser?.name || 'Anonymous', 
        color: getCategoryColor('other'),
        startDate: date || new Date(),
        endDate: date || new Date(),
        arrivalTime: '',
        departureTime: '',
        isMultiDay: false,
        category: 'other',
        cateringNeeded: false,
        cateringNotes: ''
      });
    }
  };

  return (
    <MobileLayout title="Event Calendar">
      <div className="space-y-4">
        {/* Edit Event Dialog */}
        <EditEventDialog 
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSaveEditedEvent}
          event={eventToEdit}
        />
        <div className="lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-6">
          <div className="lg:col-span-3 xl:col-span-4">
            <EventCalendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              className="rounded-md border shadow w-full h-full"
              events={events}
              onEventClick={(event) => {
                // Navigate to the start date of the event
                handleDateChange(event.startDate);
              }}
              pcMode={true}
            />
          </div>
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-4">
              <Card className="p-4 rounded-md border shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {date ? format(date, 'MMMM d, yyyy') : 'Selected Date'}
                  </h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex items-center gap-1">
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Event</DialogTitle>
                      </DialogHeader>
                      {/* Event form content */}
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title-pc">Event Title</Label>
                          <Input
                            id="title-pc"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter event title"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description-pc">Description</Label>
                          <Textarea
                            id="description-pc"
                            value={newEvent.description}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter event description"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Start Date</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              value={newEvent.startDate ? format(newEvent.startDate, 'yyyy-MM-dd') : ''}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : new Date();
                                setNewEvent(prev => ({ 
                                  ...prev, 
                                  startDate: date,
                                  endDate: prev.endDate < date ? date : prev.endDate 
                                }));
                              }}
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="arrivalTime-pc">Arrival Time</Label>
                          <Input
                            id="arrivalTime-pc"
                            type="time"
                            value={newEvent.arrivalTime}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, arrivalTime: e.target.value }))}
                            placeholder="e.g., 14:00"
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">
                            Time of arrival on the start date
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="multiday-pc">Multi-day Event</Label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                id="multiday-pc"
                                checked={newEvent.isMultiDay}
                                onChange={(e) => {
                                  const isMultiDay = e.target.checked;
                                  setNewEvent(prev => ({ 
                                    ...prev, 
                                    isMultiDay,
                                    endDate: isMultiDay ? prev.endDate : prev.startDate
                                  }));
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>End Date</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              value={newEvent.endDate ? format(newEvent.endDate, 'yyyy-MM-dd') : ''}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : new Date();
                                setNewEvent(prev => ({ 
                                  ...prev, 
                                  endDate: date < prev.startDate ? prev.startDate : date,
                                  isMultiDay: !isSameDay(date, prev.startDate) || prev.isMultiDay
                                }));
                              }}
                              className="w-full"
                              disabled={!newEvent.isMultiDay}
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="departureTime-pc">Departure Time</Label>
                          <Input
                            id="departureTime-pc"
                            type="time"
                            value={newEvent.departureTime}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, departureTime: e.target.value }))}
                            placeholder="e.g., 10:00"
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">
                            Time of departure on the end date
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category-pc">Event Category</Label>
                          <Select 
                            value={newEvent.category} 
                            onValueChange={(value: EventCategory) => setNewEvent(prev => ({ 
                              ...prev, 
                              category: value,
                              color: getCategoryColor(value)
                            }))}
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

                        {/* Catering options for retreat events */}
                        {newEvent.category === 'retreat' && (
                          <>
                            <div className="grid gap-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="catering-pc">Catering Needed</Label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    id="catering-pc"
                                    checked={newEvent.cateringNeeded}
                                    onChange={(e) => {
                                      const cateringNeeded = e.target.checked;
                                      setNewEvent(prev => ({ 
                                        ...prev, 
                                        cateringNeeded
                                      }));
                                    }}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Enable to notify the kitchen staff that catering is needed for this retreat
                              </p>
                            </div>

                            {newEvent.cateringNeeded && (
                              <div className="grid gap-2">
                                <Label htmlFor="cateringNotes-pc">Catering Notes</Label>
                                <Textarea
                                  id="cateringNotes-pc"
                                  value={newEvent.cateringNotes}
                                  onChange={(e) => setNewEvent(prev => ({ ...prev, cateringNotes: e.target.value }))}
                                  placeholder="Special dietary requirements, meal preferences, number of people, etc."
                                  className="h-20"
                                />
                              </div>
                            )}
                          </>
                        )}

                        <div className="grid gap-2">
                          <Label htmlFor="color-pc">Event Color</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              id="color-pc"
                              value={newEvent.color}
                              onChange={(e) => setNewEvent(prev => ({ ...prev, color: e.target.value }))}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <span className="text-sm text-muted-foreground">Select a color for this event</span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <DialogClose asChild className="w-full sm:w-auto">
                          <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                        </DialogClose>
                        <Button 
                          onClick={(e) => {
                            handleAddEvent();
                            // Close the dialog programmatically after adding event
                            document.querySelector('[role="dialog"] button[aria-label="Close"]')?.click();
                          }} 
                          className="w-full sm:w-auto"
                        >
                          Add Event
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {eventsOnSelectedDate.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events on this day
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                    {eventsOnSelectedDate.map((event) => (
                      <Card 
                        key={event.id} 
                        style={{ borderLeft: `4px solid ${event.color || '#3b82f6'}` }}
                        className="transition-all hover:shadow-md"
                      >
                        <CardContent className="p-4">
                          <h3 className="font-medium">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {isSameDay(event.startDate, event.endDate) ? (
                              <>
                                {format(event.startDate, 'MMM d, yyyy')}
                                {event.arrivalTime && event.departureTime && (
                                  <span className="ml-1">({event.arrivalTime} - {event.departureTime})</span>
                                )}
                                {event.arrivalTime && !event.departureTime && (
                                  <span className="ml-1">(Arrival: {event.arrivalTime})</span>
                                )}
                                {!event.arrivalTime && event.departureTime && (
                                  <span className="ml-1">(Departure: {event.departureTime})</span>
                                )}
                              </>
                            ) : (
                              <span className="text-primary-foreground bg-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                                {format(event.startDate, 'MMM d')}{event.arrivalTime && <span> {event.arrivalTime}</span>} - 
                                {format(event.endDate, 'MMM d, yyyy')}{event.departureTime && <span> {event.departureTime}</span>}
                              </span>
                            )}
                          </div>
                          {event.category && (
                            <Badge 
                              variant="outline" 
                              className="mt-2 text-[11px] h-5 capitalize"
                            >
                              {event.category}
                            </Badge>
                          )}
                          {event.category === "retreat" && event.cateringNeeded && (
                            <Badge 
                              variant="secondary"
                              className="ml-2 text-[11px] h-5 bg-amber-100 text-amber-800 hover:bg-amber-100"
                            >
                              Catering
                            </Badge>
                          )}
                          <div className="flex justify-between items-center mt-3">
                            <p className="text-xs text-muted-foreground">
                              Created by: {event.createdBy}
                            </p>
                            {/* Show edit/delete options if user is the creator OR an admin */}
                            {currentUser && (currentUser.name === event.createdBy || currentUser.permissions.includes('admin')) && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary h-7 w-7 p-0"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive h-7"
                                  onClick={() => deleteEvent(event.id, currentUser?.name)}
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
          {/* Mobile view */}
          <div className="lg:hidden mt-4">
            <Tabs defaultValue="events" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="add">Add Event</TabsTrigger>
              </TabsList>
              <TabsContent value="events" className="mt-4">
                <h2 className="text-xl font-semibold mb-4">
                  {date ? format(date, 'MMMM d, yyyy') : 'Selected Date'}
                </h2>
                {eventsOnSelectedDate.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events on this day
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventsOnSelectedDate.map((event) => (
                      <Card 
                        key={event.id} 
                        style={{ borderLeft: `4px solid ${event.color || '#3b82f6'}` }}
                        className="transition-all hover:shadow-md"
                      >
                        <CardContent className="p-4">
                          <h3 className="font-medium">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {isSameDay(event.startDate, event.endDate) ? (
                              <>
                                {format(event.startDate, 'MMM d, yyyy')}
                                {event.arrivalTime && event.departureTime && (
                                  <span className="ml-1">({event.arrivalTime} - {event.departureTime})</span>
                                )}
                                {event.arrivalTime && !event.departureTime && (
                                  <span className="ml-1">(Arrival: {event.arrivalTime})</span>
                                )}
                                {!event.arrivalTime && event.departureTime && (
                                  <span className="ml-1">(Departure: {event.departureTime})</span>
                                )}
                          {event.category === "retreat" && event.cateringNeeded && (
                            <Badge 
                              variant="secondary"
                              className="ml-2 text-[11px] h-5 bg-amber-100 text-amber-800 hover:bg-amber-100"
                            >
                              Catering
                            </Badge>
                          )}
                              </>
                            ) : (
                              <span className="text-primary-foreground bg-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                                {format(event.startDate, 'MMM d')}{event.arrivalTime && <span> {event.arrivalTime}</span>} - 
                                {format(event.endDate, 'MMM d, yyyy')}{event.departureTime && <span> {event.departureTime}</span>}
                              </span>
                            )}
                          {event.category === "retreat" && event.cateringNeeded && (
                            <Badge 
                              variant="secondary"
                              className="ml-2 text-[11px] h-5 bg-amber-100 text-amber-800 hover:bg-amber-100"
                            >
                              Catering
                            </Badge>
                          )}
                          </div>
                          {event.category && (
                            <Badge 
                              variant="outline" 
                              className="mt-2 text-[11px] h-5 capitalize"
                            >
                              {event.category}
                            </Badge>
                          )}
                          {event.category === "retreat" && event.cateringNeeded && (
                            <Badge 
                              variant="secondary"
                              className="ml-2 text-[11px] h-5 bg-amber-100 text-amber-800 hover:bg-amber-100"
                            >
                              Catering
                            </Badge>
                          )}
                          <div className="flex justify-between items-center mt-3">
                            <p className="text-xs text-muted-foreground">
                              Created by: {event.createdBy}
                            </p>
                            {/* Show edit/delete options if user is the creator OR an admin */}
                            {currentUser && (currentUser.name === event.createdBy || currentUser.permissions.includes('admin')) && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary h-7 w-7 p-0"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive h-7"
                                  onClick={() => deleteEvent(event.id, currentUser?.name)}
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="add" className="mt-4">
                <h2 className="text-xl font-semibold mb-4">Add New Event</h2>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title-mobile">Event Title</Label>
                    <Input
                      id="title-mobile"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter event title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description-mobile">Description</Label>
                    <Textarea
                      id="description-mobile"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter event description"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={newEvent.startDate ? format(newEvent.startDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : new Date();
                          setNewEvent(prev => ({ 
                            ...prev, 
                            startDate: date,
                            endDate: prev.endDate < date ? date : prev.endDate 
                          }));
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="arrivalTime-mobile">Arrival Time</Label>
                    <Input
                      id="arrivalTime-mobile"
                      type="time"
                      value={newEvent.arrivalTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, arrivalTime: e.target.value }))}
                      placeholder="e.g., 14:00"
                      className="w-full"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="multiday-mobile">Multi-day Event</Label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="multiday-mobile"
                          checked={newEvent.isMultiDay}
                          onChange={(e) => {
                            const isMultiDay = e.target.checked;
                            setNewEvent(prev => ({ 
                              ...prev, 
                              isMultiDay,
                              endDate: isMultiDay ? prev.endDate : prev.startDate
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={newEvent.endDate ? format(newEvent.endDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : new Date();
                          setNewEvent(prev => ({ 
                            ...prev, 
                            endDate: date < prev.startDate ? prev.startDate : date,
                            isMultiDay: !isSameDay(date, prev.startDate) || prev.isMultiDay
                          }));
                        }}
                        className="w-full"
                        disabled={!newEvent.isMultiDay}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="departureTime-mobile">Departure Time</Label>
                    <Input
                      id="departureTime-mobile"
                      type="time"
                      value={newEvent.departureTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, departureTime: e.target.value }))}
                      placeholder="e.g., 10:00"
                      className="w-full"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category-mobile">Event Category</Label>
                    <Select 
                      value={newEvent.category} 
                      onValueChange={(value: EventCategory) => setNewEvent(prev => ({ 
                        ...prev, 
                        category: value,
                        color: getCategoryColor(value)
                      }))}
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

                  {/* Catering options for retreat events */}
                  {newEvent.category === 'retreat' && (
                    <>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="catering-mobile">Catering Needed</Label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              id="catering-mobile"
                              checked={newEvent.cateringNeeded}
                              onChange={(e) => {
                                const cateringNeeded = e.target.checked;
                                setNewEvent(prev => ({ 
                                  ...prev, 
                                  cateringNeeded
                                }));
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>

                      {newEvent.cateringNeeded && (
                        <div className="grid gap-2">
                          <Label htmlFor="cateringNotes-mobile">Catering Notes</Label>
                          <Textarea
                            id="cateringNotes-mobile"
                            value={newEvent.cateringNotes}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, cateringNotes: e.target.value }))}
                            placeholder="Special dietary requirements, etc."
                            className="h-20"
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="color-mobile">Event Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        id="color-mobile"
                        value={newEvent.color}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">Select a color for this event</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleAddEvent}
                    className="w-full mt-2"
                  >
                    Add Event
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Retreat Recommendations removed */}
      </div>
    </MobileLayout>
  );
}
